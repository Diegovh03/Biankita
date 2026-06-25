var http = require("http");
var fs = require("fs");
var path = require("path");

var root = path.join(__dirname, "..");
var port = Number(process.env.PORT || 8765);

var types = {
	".html": "text/html; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".js": "application/javascript; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".webp": "image/webp",
	".svg": "image/svg+xml",
	".ico": "image/x-icon"
};

http.createServer(function (req, res) {
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
}).listen(port, "127.0.0.1", function () {
	console.log("Serving " + root + " on http://127.0.0.1:" + port);
});
