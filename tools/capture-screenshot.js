var http = require("http");
var https = require("https");
var fs = require("fs");
var path = require("path");
var { spawn } = require("child_process");

var root = path.join(__dirname, "..");
var port = Number(process.env.PORT || 8765);
var debugPort = Number(process.env.DEBUG_PORT || 9222);
var pageUrl = process.env.PAGE_URL || ("http://127.0.0.1:" + port + "/index.html?pdf=1&v=20260625");
var pngOut = process.env.PNG_OUT || path.join(root, "Biankita-captura-completa.png");
var pdfOut = process.env.PDF_OUT || path.join(root, "Biankita-carta-completa.pdf");

var chrome = process.env.CHROME_PATH || path.join(
	process.env.LOCALAPPDATA || "",
	"Google", "Chrome", "Application", "chrome.exe"
);

if (!fs.existsSync(chrome)) {
	chrome = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
}

function sleep(ms) {
	return new Promise(function (resolve) {
		setTimeout(resolve, ms);
	});
}

function fetchJson(url) {
	return new Promise(function (resolve, reject) {
		var lib = url.indexOf("https:") === 0 ? https : http;
		lib.get(url, function (res) {
			var data = "";
			res.on("data", function (chunk) { data += chunk; });
			res.on("end", function () {
				try {
					resolve(JSON.parse(data));
				} catch (err) {
					reject(err);
				}
			});
		}).on("error", reject);
	});
}

function cdpSend(ws, method, params) {
	params = params || {};
	return new Promise(function (resolve, reject) {
		var id = cdpSend.nextId++;
		function onMessage(event) {
			var msg = JSON.parse(event.data);
			if (msg.id === id) {
				ws.removeEventListener("message", onMessage);
				if (msg.error) {
					reject(new Error(msg.error.message || "CDP error"));
				} else {
					resolve(msg.result);
				}
			}
		}
		ws.addEventListener("message", onMessage);
		ws.send(JSON.stringify({ id: id, method: method, params: params }));
	});
}
cdpSend.nextId = 1;

function startServer() {
	return new Promise(function (resolve) {
		var types = {
			".html": "text/html; charset=utf-8",
			".css": "text/css; charset=utf-8",
			".js": "application/javascript; charset=utf-8",
			".png": "image/png",
			".jpg": "image/jpeg",
			".jpeg": "image/jpeg"
		};

		var server = http.createServer(function (req, res) {
			var urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
			var filePath = path.join(root, urlPath === "/" ? "index.html" : urlPath);

			if (!filePath.startsWith(root)) {
				res.writeHead(403);
				res.end("Forbidden");
				return;
			}

			fs.readFile(filePath, function (err, data) {
				if (err) {
					res.writeHead(404);
					res.end("Not found");
					return;
				}

				res.writeHead(200, {
					"Content-Type": types[path.extname(filePath).toLowerCase()] || "application/octet-stream"
				});
				res.end(data);
			});
		});

		server.listen(port, "127.0.0.1", function () {
			resolve(server);
		});
	});
}

function startChrome(startUrl) {
	return spawn(chrome, [
		"--headless=new",
		"--disable-gpu",
		"--hide-scrollbars",
		"--window-size=1440,900",
		"--force-device-scale-factor=1",
		"--remote-debugging-port=" + debugPort,
		startUrl
	], {
		stdio: "ignore",
		detached: false
	});
}

async function getPageTarget() {
	var targets = await fetchJson("http://127.0.0.1:" + debugPort + "/json/list");
	var page = targets.find(function (t) {
		return t.type === "page" && t.url && t.url.indexOf("127.0.0.1:" + port) !== -1;
	});

	if (!page) {
		page = targets.find(function (t) {
			return t.type === "page";
		});
	}

	if (!page) {
		throw new Error("No se encontro la pestana de Chrome para capturar.");
	}

	return page;
}

async function captureScreenshot() {
	var server = await startServer();
	var chromeProc = startChrome(pageUrl);

	await sleep(3000);

	try {
		var target = await getPageTarget();
		var ws = new WebSocket(target.webSocketDebuggerUrl);

		await new Promise(function (resolve, reject) {
			ws.addEventListener("open", resolve);
			ws.addEventListener("error", reject);
		});

		await cdpSend(ws, "Page.enable");
		await cdpSend(ws, "Runtime.enable");
		await cdpSend(ws, "Emulation.setDeviceMetricsOverride", {
			width: 1440,
			height: 900,
			deviceScaleFactor: 1,
			mobile: false
		});

		var ready = false;
		for (var i = 0; i < 120; i++) {
			var check = await cdpSend(ws, "Runtime.evaluate", {
				expression: "document.body && document.body.classList.contains('pdf-ready')",
				returnByValue: true
			});
			if (check && check.result && check.result.value) {
				ready = true;
				break;
			}
			await sleep(500);
		}

		if (!ready) {
			throw new Error("La pagina no llego al estado pdf-ready a tiempo.");
		}

		await sleep(1200);

		var metrics = await cdpSend(ws, "Page.getLayoutMetrics");
		var content = metrics.contentSize || metrics.cssContentSize;
		var width = Math.ceil(content.width);
		var height = Math.ceil(content.height);

		await cdpSend(ws, "Emulation.setDeviceMetricsOverride", {
			width: width,
			height: height,
			deviceScaleFactor: 1,
			mobile: false
		});

		await sleep(800);

		var shot = await cdpSend(ws, "Page.captureScreenshot", {
			format: "png",
			fromSurface: true,
			captureBeyondViewport: true
		});

		fs.writeFileSync(pngOut, Buffer.from(shot.data, "base64"));
		ws.close();

		await buildPdfFromPng(pngOut, pdfOut, width, height);

		console.log("PNG: " + pngOut);
		console.log("PDF: " + pdfOut);
	} finally {
		chromeProc.kill();
		server.close();
	}
}

function buildPdfFromPng(pngPath, pdfPath, width, height) {
	return new Promise(function (resolve, reject) {
		var htmlPath = path.join(root, "tools", "_captura-print.html");
		var pngName = path.basename(pngPath).replace(/\\/g, "/");
		var html = "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><style>" +
			"@page{margin:0;size:" + width + "px " + height + "px;}" +
			"html,body{margin:0;padding:0;width:" + width + "px;height:" + height + "px;}" +
			"img{display:block;width:" + width + "px;height:" + height + "px;}" +
			"</style></head><body><img src=\"../" + pngName + "\" alt=\"Carta completa\" /></body></html>";

		fs.writeFileSync(htmlPath, html);

		var proc = spawn(chrome, [
			"--headless=new",
			"--disable-gpu",
			"--no-pdf-header-footer",
			"--print-to-pdf=" + pdfPath,
			"file:///" + htmlPath.replace(/\\/g, "/")
		], { stdio: "ignore" });

		proc.on("exit", function (code) {
			if (code !== 0) {
				reject(new Error("No se pudo crear el PDF."));
				return;
			}
			resolve();
		});
	});
}

captureScreenshot().catch(function (err) {
	console.error(err.message || err);
	process.exit(1);
});
