var offsetX = 0;
var offsetY = 0;
var heartScale = 1;
var gardenCtx, gardenCanvas, garden;
var puzzleComplete = false;
var flowerHeartComplete = false;
var flowersStarted = false;
var letterRevealStopped = false;
var letterRevealFinishedAt = 0;
var letterRevealStarted = false;
var EXPLODE_DELAY_AFTER_LETTER = 10000;
var LETTER_START_AFTER_PUZZLE_MS = 2800;
var HEART_LIGHTNING_MS = 2200;
var letterRevealTimer = null;

function timeElapse(date) {
	var current = new Date();
	var seconds = (current.getTime() - date.getTime()) / 1000;

	if (seconds < 0) {
		seconds = 0;
	}

	var days = Math.floor(seconds / (3600 * 24));
	seconds = seconds % (3600 * 24);
	var hours = Math.floor(seconds / 3600);
	seconds = seconds % 3600;
	var minutes = Math.floor(seconds / 60);
	seconds = Math.floor(seconds % 60);

	function pad(n) {
		return n < 10 ? "0" + n : String(n);
	}

	function card(num, label) {
		return (
			'<div class="counter-card">' +
			'<span class="counter-num">' + num + '</span>' +
			'<span class="counter-label">' + label + '</span>' +
			'</div>'
		);
	}

	var result =
		card(days, "días") +
		card(pad(hours), "horas") +
		card(pad(minutes), "minutos") +
		card(pad(seconds), "segundos");

	$("#elapseClock").html(result);
}

function adjustCodePosition() {
	var diff = ($("#loveHeart").height() - $("#code").height()) / 2;
	if (diff > 0 && window.innerWidth > 960) {
		$("#code").css("margin-top", diff);
	} else {
		$("#code").css("margin-top", 0);
	}
}

function lightningRandom(min, max) {
	return min + Math.random() * (max - min);
}

function buildLightningPoints(x1, y1, x2, y2, displacement) {
	var points = [{ x: x1, y: y1 }];
	var dx = x2 - x1;
	var dy = y2 - y1;
	var dist = Math.sqrt(dx * dx + dy * dy) || 1;
	var steps = Math.max(5, Math.floor(dist / 15));
	var i;

	for (i = 1; i < steps; i++) {
		var t = i / steps;
		var falloff = 1 - Math.abs(t - 0.5) * 1.15;

		points.push({
			x: x1 + dx * t + lightningRandom(-displacement, displacement) * falloff,
			y: y1 + dy * t + lightningRandom(-displacement, displacement) * falloff
		});
	}

	points.push({ x: x2, y: y2 });
	return points;
}

function drawLightningBolt(ctx, points, width, color, glow) {
	var i;

	ctx.save();
	ctx.lineCap = "round";
	ctx.lineJoin = "round";
	ctx.shadowBlur = glow;
	ctx.shadowColor = color;
	ctx.strokeStyle = color;
	ctx.lineWidth = width;
	ctx.beginPath();
	ctx.moveTo(points[0].x, points[0].y);

	for (i = 1; i < points.length; i++) {
		ctx.lineTo(points[i].x, points[i].y);
	}

	ctx.stroke();
	ctx.shadowBlur = 0;
	ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
	ctx.lineWidth = Math.max(1, width * 0.3);
	ctx.stroke();
	ctx.restore();
}

function drawLightningBranch(ctx, fromPoint, angle, length, depth) {
	if (depth <= 0 || length < 10) {
		return;
	}

	var endX = fromPoint.x + Math.cos(angle) * length;
	var endY = fromPoint.y + Math.sin(angle) * length;
	var branch = buildLightningPoints(fromPoint.x, fromPoint.y, endX, endY, length * 0.16);

	drawLightningBolt(ctx, branch, 1.2 + depth * 0.35, "rgba(190, 215, 255, 0.88)", 12);

	if (Math.random() > 0.4) {
		var mid = branch[Math.floor(branch.length / 2)];
		drawLightningBranch(ctx, mid, angle + lightningRandom(-1, 1), length * 0.52, depth - 1);
	}
}

function playHeartLightningBurst(options) {
	options = options || {};

	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
		return;
	}

	var canvas = options.canvas;

	if (!canvas) {
		return;
	}

	var ctx = canvas.getContext("2d");
	var bolts = options.bolts || [];
	var duration = options.duration || 1500;
	var flashEl = options.flashEl;
	var start = performance.now();
	var b;

	function sizeCanvas() {
		if (options.mode === "viewport") {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		} else if (options.mode === "parent" && canvas.parentElement) {
			canvas.width = canvas.parentElement.clientWidth;
			canvas.height = canvas.parentElement.clientHeight;
		}
	}

	sizeCanvas();

	function frame(now) {
		var elapsed = now - start;
		var alpha = elapsed < duration * 0.7
			? 1
			: Math.max(0, 1 - (elapsed - duration * 0.7) / (duration * 0.3));

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		if (alpha > 0.03) {
			for (b = 0; b < bolts.length; b++) {
				var bolt = bolts[b];
				var pts = buildLightningPoints(
					bolt.x1,
					bolt.y1,
					bolt.x2,
					bolt.y2,
					(bolt.displace || 20) * (0.55 + Math.random() * 0.9)
				);

				ctx.globalAlpha = alpha * (0.6 + Math.random() * 0.4);
				drawLightningBolt(
					ctx,
					pts,
					bolt.width || 2.6,
					bolt.color || "#b9d4ff",
					bolt.glow || 18
				);

				if (Math.random() > 0.3) {
					var midIdx = Math.floor(pts.length * lightningRandom(0.3, 0.7));
					drawLightningBranch(
						ctx,
						pts[midIdx],
						lightningRandom(-Math.PI, Math.PI),
						lightningRandom(22, 54),
						2
					);
				}
			}

			if (options.flashX != null && options.flashY != null) {
				var radius = options.flashRadius || 80;
				var grad = ctx.createRadialGradient(
					options.flashX,
					options.flashY,
					0,
					options.flashX,
					options.flashY,
					radius
				);

				grad.addColorStop(0, "rgba(255,255,255," + (0.58 * alpha) + ")");
				grad.addColorStop(0.35, "rgba(180,210,255," + (0.3 * alpha) + ")");
				grad.addColorStop(1, "rgba(255,255,255,0)");
				ctx.globalAlpha = 1;
				ctx.fillStyle = grad;
				ctx.fillRect(0, 0, canvas.width, canvas.height);
			}
		}

		if (flashEl) {
			if (elapsed < 220) {
				flashEl.classList.add("is-lightning");
			} else {
				flashEl.classList.remove("is-lightning");
			}
		}

		if (elapsed < duration) {
			requestAnimationFrame(frame);
		} else {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			if (flashEl) {
				flashEl.classList.remove("is-lightning");
			}
		}
	}

	requestAnimationFrame(frame);
}

function triggerPuzzleJoinLightning() {
	var loveHeart = document.getElementById("loveHeart");
	var canvas = document.getElementById("heartLightningCanvas");

	if (!loveHeart || !canvas) {
		return;
	}

	var w = loveHeart.clientWidth || 670;
	var h = loveHeart.clientHeight || 625;
	var factor = (w / 670) * 0.94;
	var cx = w / 2;
	var cy = h / 2 - 12 * factor;
	var topY = cy - 230 * factor;
	var botY = cy + 210 * factor;

	playHeartLightningBurst({
		canvas: canvas,
		mode: "parent",
		flashEl: loveHeart,
		flashX: cx,
		flashY: cy,
		flashRadius: 130 * factor,
		duration: 1900,
		bolts: [
			{ x1: cx, y1: topY, x2: cx, y2: botY, displace: 24 * factor, width: 3.4, color: "#dce8ff", glow: 24 },
			{ x1: cx - 20 * factor, y1: topY + 28 * factor, x2: cx + 16 * factor, y2: botY - 24 * factor, displace: 18 * factor, width: 2.4, color: "#a8c8ff", glow: 18 },
			{ x1: cx + 26 * factor, y1: topY + 52 * factor, x2: cx - 12 * factor, y2: botY - 36 * factor, displace: 15 * factor, width: 2, color: "#f3f7ff", glow: 14 }
		]
	});
}

function triggerMergeJoinLightning(canvas, biankaHeart, diegoHeart, arena) {
	if (!canvas || !biankaHeart || !diegoHeart) {
		return;
	}

	var bCenter = {
		x: biankaHeart.x + (biankaHeart.el.offsetWidth || biankaHeart.size) * 0.5,
		y: biankaHeart.y + (biankaHeart.el.offsetHeight || biankaHeart.size + 18) * 0.5
	};
	var dCenter = {
		x: diegoHeart.x + (diegoHeart.el.offsetWidth || diegoHeart.size) * 0.5,
		y: diegoHeart.y + (diegoHeart.el.offsetHeight || diegoHeart.size + 18) * 0.5
	};
	var midX = (bCenter.x + dCenter.x) * 0.5;
	var midY = (bCenter.y + dCenter.y) * 0.5;
	var spread = Math.max(36, Math.abs(dCenter.x - bCenter.x) * 0.35);

	playHeartLightningBurst({
		canvas: canvas,
		mode: "viewport",
		flashEl: arena,
		flashX: midX,
		flashY: midY,
		flashRadius: 120,
		duration: 1700,
		bolts: [
			{ x1: bCenter.x, y1: bCenter.y - 18, x2: dCenter.x, y2: dCenter.y + 18, displace: 22, width: 3.2, color: "#dce8ff", glow: 22 },
			{ x1: midX, y1: midY - spread, x2: midX, y2: midY + spread, displace: 16, width: 2.6, color: "#b9d4ff", glow: 18 },
			{ x1: bCenter.x - 8, y1: bCenter.y, x2: dCenter.x + 8, y2: dCenter.y, displace: 14, width: 2, color: "#eef4ff", glow: 14 }
		]
	});
}

var STORY_PHOTO_COUNT = 11;

function revealStoryPhoto(index) {
	var photo = document.querySelector('.story-photo[data-photo="' + index + '"]');
	var gallery = document.getElementById("storyPhotos");

	if (photo && !photo.classList.contains("is-visible") && !photo.classList.contains("is-revealing")) {
		photo.classList.add("is-revealing");
		setTimeout(function () {
			photo.classList.add("is-visible");
			photo.classList.remove("is-revealing");
		}, 40);
	}

	if (gallery) {
		gallery.classList.add("is-active");
	}
}

function revealAllPhotosNow() {
	var n;

	photosProgressStarted = true;

	for (n = 1; n <= STORY_PHOTO_COUNT; n++) {
		revealStoryPhoto(n);
	}
}

var photosProgressStarted = false;

function startProgressivePhotos() {
	var n;
	var stepMs = 1200;
	var startDelay = 1800;

	if (photosProgressStarted) {
		return;
	}

	photosProgressStarted = true;

	for (n = 1; n <= STORY_PHOTO_COUNT; n++) {
		(function (photoIndex) {
			setTimeout(function () {
				revealStoryPhoto(photoIndex);
			}, startDelay + (photoIndex - 1) * stepMs);
		})(n);
	}
}

function initPhotoMuralCycle() {
	var gallery = document.getElementById("storyPhotos");

	if (!gallery) {
		return;
	}

	var frames = gallery.querySelectorAll(".photo-moment img");
	var order = [];
	var i;

	for (i = 1; i <= STORY_PHOTO_COUNT; i++) {
		order.push(i);
	}

	var cycling = false;

	if (!frames.length) {
		return;
	}

	setInterval(function () {
		if (!gallery.classList.contains("is-active") || cycling) {
			return;
		}

		cycling = true;
		order.push(order.shift());

		frames.forEach(function (img, i) {
			img.classList.add("is-swapping");
			setTimeout(function () {
				img.src = order[i] + ".jpg";
				img.classList.remove("is-swapping");
			}, 280);
		});

		setTimeout(function () {
			cycling = false;
		}, 320);
	}, 2600);
}

function initStoryPhotos() {
	initPhotoMuralCycle();
}

function prepareTypewriterText() {
	$("#code .line").each(function () {
		var $el = $(this);

		if (!$el.data("fullText")) {
			$el.data("fullText", $el.html());
			$el.empty();
		}
	});
}

function lineRevealDelay($el, html) {
	var text = $("<div>").html(html).text().trim();
	var delay = 720;

	if ($el.hasClass("stanza")) {
		delay += 480;
	}

	if ($el.hasClass("highlight")) {
		delay += 320;
	}

	if (/[.!?…]$/.test(text)) {
		delay += 920;
	} else if (text.length > 32) {
		delay += 180;
	}

	return delay;
}

function followLetterScroll(lineEl) {
	if (!lineEl || letterRevealStopped) {
		return;
	}

	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
		return;
	}

	var rect = lineEl.getBoundingClientRect();
	var comfortZone = window.innerHeight * 0.58;

	if (rect.bottom > comfortZone) {
		lineEl.scrollIntoView({
			behavior: "smooth",
			block: "end",
			inline: "nearest"
		});
	}
}

function finishLetterReveal() {
	var card = document.querySelector(".letter-card");

	if (card) {
		card.classList.add("is-complete");
	}

	letterRevealFinishedAt = Date.now();

	$("#letterRevealAll").addClass("is-hidden");
	$("#code .signature").addClass("visible");

	var signature = document.querySelector("#code .signature");
	if (signature && !letterRevealStopped) {
		setTimeout(function () {
			followLetterScroll(signature);
		}, 400);
	}
}

function revealAllLetter() {
	var $lines = $("#code .line");

	letterRevealStopped = true;

	$lines.each(function () {
		var $el = $(this);

		if (!$el.hasClass("visible")) {
			$el.addClass("visible is-instant");
			$el.html($el.data("fullText") || "");
		}
	});

	revealAllPhotosNow();
	finishLetterReveal();
}

function prepareLetterCardWaiting() {
	prepareTypewriterText();
	document.body.classList.add("letter-locked");

	var card = document.querySelector(".letter-card");

	if (card) {
		card.classList.add("is-waiting-heart");
	}
}

function beginLetterReveal() {
	if (letterRevealStarted) {
		return;
	}

	letterRevealStarted = true;
	document.body.classList.remove("letter-locked");

	var card = document.querySelector(".letter-card");
	if (card) {
		card.classList.remove("is-waiting-heart");
	}

	startTypewriter();
}

function scheduleLetterRevealWhenHeartFinishes(puzzleDurationMs) {
	if (letterRevealStarted || letterRevealTimer) {
		return;
	}

	var pause = window.matchMedia("(prefers-reduced-motion: reduce)").matches ?
		500 :
		Math.max(LETTER_START_AFTER_PUZZLE_MS, HEART_LIGHTNING_MS);
	var waitMs = Math.max(puzzleDurationMs, 11000) + pause;

	function tryReveal() {
		if (letterRevealStarted) {
			return;
		}

		if (flowersStarted && !flowerHeartComplete) {
			letterRevealTimer = setTimeout(tryReveal, 120);
			return;
		}

		beginLetterReveal();
	}

	letterRevealTimer = setTimeout(tryReveal, waitMs);
}

function startTypewriter() {
	prepareTypewriterText();

	var $lines = $("#code .line");
	var index = 0;
	var letterTimer = null;
	var revealAllBtn = document.getElementById("letterRevealAll");

	letterRevealStopped = false;

	if (revealAllBtn) {
		revealAllBtn.addEventListener("click", function () {
			letterRevealStopped = true;
			if (letterTimer) {
				clearTimeout(letterTimer);
			}
			revealAllLetter();
		});
	}

	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
		revealAllLetter();
		return;
	}

	function typeNextLine() {
		if (letterRevealStopped || document.body.classList.contains("letter-locked")) {
			return;
		}

		if (index >= $lines.length) {
			finishLetterReveal();
			return;
		}

		var $el = $($lines[index]);
		var html = $el.data("fullText") || "";

		$el.addClass("visible");
		$el.html(html);

		setTimeout(function () {
			followLetterScroll($el[0]);
		}, 120);

		index++;
		letterTimer = setTimeout(typeNextLine, lineRevealDelay($el, html));
	}

	setTimeout(startProgressivePhotos, 600);
	typeNextLine();
}

function setupGarden() {
	var $loveHeart = $("#loveHeart");
	gardenCanvas = document.getElementById("flowerCanvas");

	gardenCanvas.width = $loveHeart.width();
	gardenCanvas.height = $loveHeart.height();

	offsetX = gardenCanvas.width / 2;
	offsetY = gardenCanvas.height / 2 - 12 * (gardenCanvas.width / 670 * 0.94);
	heartScale = (gardenCanvas.width / 670) * 0.94;

	gardenCtx = gardenCanvas.getContext("2d");
	gardenCtx.globalCompositeOperation = "lighter";
	garden = new Garden(gardenCtx, gardenCanvas);

	setInterval(function () {
		garden.render();
	}, Garden.options.growSpeed);
}

function getHeartPoint(angle) {
	var t = angle / Math.PI;
	var x = 19.5 * heartScale * (16 * Math.pow(Math.sin(t), 3));
	var y = -20 * heartScale * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
	return [offsetX + x, offsetY + y];
}

function startFlowerHeart() {
	var interval = 50;
	var angle = 10;
	var heart = [];

	var animationTimer = setInterval(function () {
		var bloom = getHeartPoint(angle);
		var draw = true;

		for (var i = 0; i < heart.length; i++) {
			var p = heart[i];
			var distance = Math.sqrt(Math.pow(p[0] - bloom[0], 2) + Math.pow(p[1] - bloom[1], 2));
			if (distance < Garden.options.bloomRadius.max * 1.3) {
				draw = false;
				break;
			}
		}

		if (draw) {
			heart.push(bloom);
			garden.createRandomBloom(bloom[0], bloom[1]);
		}

		if (angle >= 30) {
			clearInterval(animationTimer);
			flowerHeartComplete = true;
		} else {
			angle += 0.2;
		}
	}, interval);
}

function startPuzzleHeart(imageUrls) {
	var canvas = document.getElementById("puzzleCanvas");

	function boot(images) {
		if (!images[0] || !images[1]) {
			puzzleComplete = true;
			flowerHeartComplete = true;
			setTimeout(beginLetterReveal, 800);
			return;
		}

		var puzzle = new PuzzleHeart(canvas, images);
		var puzzleDurationMs;

		puzzle.setupCanvas();
		setupGarden();
		adjustCodePosition();

		puzzle.onProgress = function (ratio) {
			if (!flowersStarted && ratio >= 0.5) {
				flowersStarted = true;
				startFlowerHeart();
			}
		};

		puzzle.onComplete = function () {
			puzzleComplete = true;
			var loveHeart = document.getElementById("loveHeart");
			if (loveHeart) {
				loveHeart.classList.add("is-complete");
			}
			triggerPuzzleJoinLightning();
			if (!flowersStarted) {
				flowersStarted = true;
				startFlowerHeart();
			}
		};

		puzzle.start();
		puzzleDurationMs = puzzle.getEstimatedDuration();
		scheduleLetterRevealWhenHeartFinishes(puzzleDurationMs);
	}

	function tryLoad() {
		var pre1 = document.getElementById("preloadFoto1");
		var pre2 = document.getElementById("preloadFoto2");

		if (pre1 && pre2 && pre1.complete && pre2.complete &&
			pre1.naturalWidth > 0 && pre2.naturalWidth > 0) {
			boot([pre1, pre2]);
			return;
		}

		PuzzleHeart.loadImages(imageUrls, boot);
	}

	setTimeout(tryLoad, 200);
}

function initBouncingHeart() {
	var arena = document.getElementById("bouncingHeartsArena");

	if (!arena) {
		return;
	}

	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
		arena.style.display = "none";
		return;
	}

	var colors = [
		"#e53935", "#c0392b", "#ff6b6b", "#ff4757", "#d63031", "#ff1744", "#e84393",
		"#58a868", "#27ae60", "#55efc4", "#81ecec", "#00b894", "#2ecc71", "#00cec9", "#1dd1a1",
		"#a67fd8", "#9b59b6", "#8e44ad", "#6c3483", "#b983ff", "#a29bfe", "#dda0dd", "#e056fd",
		"#2d2d2d", "#1a1a1a", "#34495e", "#636e72", "#2c3e50", "#000000",
		"#f4c542", "#f1c40f", "#fdcb6e", "#ffeaa7", "#fab1a0", "#ffdd59",
		"#8b6914", "#a0522d", "#795548", "#6d4c41", "#bcaaa4", "#d7ccc8",
		"#ff9f43", "#e67e22", "#d35400", "#e17055", "#ff7675", "#ff6348",
		"#b45a84", "#e87890", "#fd79a8", "#f2a0b8", "#ffc0cb", "#ffb6c1", "#ff85a1",
		"#3498db", "#2980b9", "#74b9ff", "#0984e3", "#48dbfb", "#00d2ff", "#1e90ff",
		"#7b9fd8", "#81c4f8", "#a8d8ff", "#dfe6e9", "#87ceeb", "#add8e6",
		"#95a5a6", "#7f8c8d", "#b2bec3", "#aaa69d", "#636e72", "#bdc3c7",
		"#f368e0", "#10ac84", "#ee5253", "#5f27cd", "#c8d6e5", "#576574",
		"#ff6f91", "#845ec2", "#d65db1", "#ff9671", "#ffc75f", "#f9f871",
		"#0081cf", "#0089ba", "#008e9b", "#008f7a", "#8458ff", "#a178df",
		"#ff8066", "#ffcc5c", "#96e6b3", "#da627d", "#ffa69e", "#861657"
	];
	var hearts = [];
	var miniHearts = [];
	var maxMini = 98;
	var spawnTimer = 0;
	var startTime = Date.now();
	var DIEGO_AT = 3000;
	var APPROACH_AT = 22000;
	var UNITE_AT = 25000;
	var MERGE_DURATION = 2800;
	var EXPLODE_DURATION = 2800;
	var FORM_DURATION = 5200;
	var REVEAL_BOX_EXTRA = 2800;
	var MAIN_SIZE = 72;
	var finalePhase = "bounce";
	var explodeStart = 0;
	var formStart = 0;
	var revealBoxRect = { cx: 0, cy: 0, w: 0, h: 0 };
	var scratchReady = false;
	var scratchRevealed = false;
	var biankaHeart = null;
	var diegoHeart = null;
	var pairX = 0;
	var pairY = 0;
	var pairVx = 2.8;
	var pairVy = 2.2;
	var diegoSpawned = false;
	var mergeStarted = false;
	var mergeStart = 0;
	var mergeLightningFired = false;
	var pairGap = 14;
	var mergeLightningCanvas = document.createElement("canvas");

	mergeLightningCanvas.className = "heart-lightning-overlay";
	mergeLightningCanvas.setAttribute("aria-hidden", "true");
	arena.appendChild(mergeLightningCanvas);

	function rand(min, max) {
		return min + Math.random() * (max - min);
	}

	function pickColor() {
		return colors[Math.floor(Math.random() * colors.length)];
	}

	function applyHeart(heart) {
		heart.icon.style.fontSize = heart.size + "px";

		if (heart.text) {
			heart.text.style.fontSize = Math.max(14, heart.size * 0.38) + "px";
		}

		var scale = heart.spawnScale != null ? heart.spawnScale : 1;
		heart.el.style.transform =
			"translate3d(" + heart.x + "px," + heart.y + "px,0) scale(" + scale + ")";
	}

	function createHeart(options) {
		options = options || {};
		var el = document.createElement("div");
		var label = options.label || "";
		var className = "bounce-heart";

		if (label === "Bianka") {
			className += " bounce-heart--main bounce-heart--bianka";
		} else if (label === "Diego") {
			className += " bounce-heart--main bounce-heart--diego";
		}

		if (options.spawning) {
			className += " bounce-heart--spawn";
		}

		el.className = className;

		if (label) {
			el.innerHTML =
				'<span class="bounce-heart__icon">\u2665</span>' +
				'<span class="bounce-heart__text">' + label + '</span>';
			el.style.zIndex = "12";
		} else {
			el.innerHTML = '<span class="bounce-heart__icon">\u2665</span>';
		}

		arena.appendChild(el);

		var icon = el.querySelector(".bounce-heart__icon");
		var text = el.querySelector(".bounce-heart__text");
		var color = options.color || pickColor();
		var size = options.size != null ? options.size : rand(11, 20);

		icon.style.color = color;

		if (text) {
			text.style.color = color;
		}

		var heart = {
			el: el,
			icon: icon,
			text: text,
			x: options.x != null ? options.x : rand(20, Math.max(20, window.innerWidth - 80)),
			y: options.y != null ? options.y : rand(20, Math.max(20, window.innerHeight - 80)),
			vx: options.vx != null ? options.vx : rand(1.8, 3.6) * (Math.random() > 0.5 ? 1 : -1),
			vy: options.vy != null ? options.vy : rand(1.5, 3.1) * (Math.random() > 0.5 ? 1 : -1),
			size: size,
			maxSize: options.maxSize != null ? options.maxSize : rand(38, 54),
			growth: options.growth != null ? options.growth : rand(1.8, 3.2),
			label: label,
			mode: options.mode || "bounce",
			fill: false,
			startSize: options.startSize || size,
			targetSize: options.targetSize || MAIN_SIZE
		};

		hearts.push(heart);

		if (!label) {
			miniHearts.push(heart);
		}

		applyHeart(heart);

		if (options.spawning) {
			requestAnimationFrame(function () {
				el.classList.add("is-born");
				heart.spawnScale = 1;
			});
		}

		return heart;
	}

	function spawnMiniHeart() {
		if (finalePhase === "explode" || finalePhase === "form" || finalePhase === "reveal" || finalePhase === "hold") {
			return;
		}
		if (miniHearts.length >= maxMini) {
			return;
		}
		createHeart();
	}

	function boundsFor(heart) {
		var w = heart.el.offsetWidth || heart.size + 10;
		var h = heart.el.offsetHeight || heart.size + 20;
		return {
			maxX: Math.max(0, window.innerWidth - w),
			maxY: Math.max(0, window.innerHeight - h)
		};
	}

	function growHeart(heart) {
		var prev = heart.size;
		heart.size = Math.min(heart.maxSize, heart.size + heart.growth);
		applyHeart(heart);

		if (heart.size > prev) {
			heart.el.classList.remove("bounce-heart--growing");
			void heart.el.offsetWidth;
			heart.el.classList.add("bounce-heart--growing");
		}
	}

	function updateBouncePhysics(heart) {
		var b = boundsFor(heart);
		var bounced = false;

		heart.x += heart.vx;
		heart.y += heart.vy;

		if (heart.x <= 0) {
			heart.x = 0;
			heart.vx = Math.abs(heart.vx);
			bounced = true;
		}
		if (heart.y <= 0) {
			heart.y = 0;
			heart.vy = Math.abs(heart.vy);
			bounced = true;
		}
		if (heart.x >= b.maxX) {
			heart.x = b.maxX;
			heart.vx = -Math.abs(heart.vx);
			bounced = true;
		}
		if (heart.y >= b.maxY) {
			heart.y = b.maxY;
			heart.vy = -Math.abs(heart.vy);
			bounced = true;
		}

		if (bounced) {
			growHeart(heart);
		}

		applyHeart(heart);
	}

	function updateMiniHeart(heart) {
		if (heart.mode === "pair" || heart.label) {
			return;
		}

		updateBouncePhysics(heart);
	}

	function updateNamedHeart(heart) {
		if (heart.mode !== "pair") {
			updateBouncePhysics(heart);
		}
	}

	function updateDiegoGrowth(heart, elapsed) {
		if (!heart || heart.label !== "Diego" || elapsed < DIEGO_AT) {
			return;
		}

		var growDuration = UNITE_AT - DIEGO_AT;
		var t = Math.min(1, (elapsed - DIEGO_AT) / growDuration);

		heart.size = heart.startSize + (MAIN_SIZE - heart.startSize) * t;
	}

	function spawnDiego() {
		if (diegoSpawned) {
			return;
		}
		diegoSpawned = true;

		var miniSize = rand(11, 15);

		diegoHeart = createHeart({
			label: "Diego",
			color: "#58a868",
			x: window.innerWidth * 0.62,
			y: window.innerHeight * 0.38,
			size: miniSize,
			startSize: miniSize,
			targetSize: MAIN_SIZE,
			maxSize: 108,
			vx: rand(-2.5, 2.5),
			vy: rand(-2.5, 2.5),
			mode: "bounce"
		});
	}

	function updateApproach(elapsed) {
		if (!biankaHeart || !diegoHeart) {
			return;
		}

		var progress = Math.min(1, (elapsed - APPROACH_AT) / (UNITE_AT - APPROACH_AT));
		var ease = progress * progress * (3 - 2 * progress);
		var cx = window.innerWidth * 0.5;
		var cy = window.innerHeight * 0.42;
		var spread = 130 * (1 - ease) + 18;
		var pull = 0.018 + ease * 0.045;

		updateBouncePhysics(biankaHeart);
		updateBouncePhysics(diegoHeart);

		biankaHeart.x += (cx - spread * 0.55 - biankaHeart.x) * pull;
		biankaHeart.y += (cy - biankaHeart.y) * pull;
		diegoHeart.x += (cx + spread * 0.15 - diegoHeart.x) * pull;
		diegoHeart.y += (cy - diegoHeart.y) * pull;

		biankaHeart.vx *= 0.988;
		biankaHeart.vy *= 0.988;
		diegoHeart.vx *= 0.988;
		diegoHeart.vy *= 0.988;

		applyHeart(biankaHeart);
		applyHeart(diegoHeart);
	}

	function startUnite() {
		if (mergeStarted || !biankaHeart || !diegoHeart) {
			return;
		}

		mergeStarted = true;
		finalePhase = "merge";
		mergeStart = Date.now();
		biankaHeart.size = MAIN_SIZE;
		diegoHeart.size = MAIN_SIZE;
		biankaHeart.mode = "bounce";
		diegoHeart.mode = "bounce";
		applyHeart(biankaHeart);
		applyHeart(diegoHeart);
	}

	function updateMerge() {
		if (!biankaHeart || !diegoHeart) {
			return;
		}

		var progress = Math.min(1, (Date.now() - mergeStart) / MERGE_DURATION);
		var ease = progress * progress * (3 - 2 * progress);
		var cx = window.innerWidth * 0.5;
		var cy = window.innerHeight * 0.42;
		var gap = 72 * (1 - ease) + pairGap;
		var targetBx = cx - gap * 0.55 - diegoHeart.size * 0.15;
		var targetDx = cx + gap * 0.12 + biankaHeart.size * 0.15;
		var pull = 0.04 + ease * 0.07;

		biankaHeart.x += (targetBx - biankaHeart.x) * pull;
		biankaHeart.y += (cy - biankaHeart.y) * pull;
		diegoHeart.x += (targetDx - diegoHeart.x) * pull;
		diegoHeart.y += (cy - diegoHeart.y) * pull;

		applyHeart(biankaHeart);
		applyHeart(diegoHeart);

		if (progress >= 1) {
			if (!mergeLightningFired) {
				mergeLightningFired = true;
				triggerMergeJoinLightning(mergeLightningCanvas, biankaHeart, diegoHeart, arena);
			}

			finalePhase = "unite";
			pairX = biankaHeart.x;
			pairY = biankaHeart.y;
			pairVx = (biankaHeart.vx || pairVx) * 0.65;
			pairVy = (biankaHeart.vy || pairVy) * 0.65;

			if (Math.abs(pairVx) < 1.2) {
				pairVx = rand(1.6, 2.4) * (Math.random() > 0.5 ? 1 : -1);
			}
			if (Math.abs(pairVy) < 1) {
				pairVy = rand(1.2, 2) * (Math.random() > 0.5 ? 1 : -1);
			}

			biankaHeart.mode = "pair";
			diegoHeart.mode = "pair";
		}
	}

	function pairBounds() {
		var w1 = biankaHeart.el.offsetWidth || MAIN_SIZE;
		var w2 = diegoHeart.el.offsetWidth || MAIN_SIZE;
		var h = Math.max(biankaHeart.el.offsetHeight, diegoHeart.el.offsetHeight) || MAIN_SIZE + 20;
		return {
			maxX: Math.max(0, window.innerWidth - (w1 + w2 + pairGap)),
			maxY: Math.max(0, window.innerHeight - h)
		};
	}

	function updatePair() {
		var b = pairBounds();
		var bounced = false;

		pairX += pairVx;
		pairY += pairVy;

		if (pairX <= 0) {
			pairX = 0;
			pairVx = Math.abs(pairVx);
			bounced = true;
		}
		if (pairY <= 0) {
			pairY = 0;
			pairVy = Math.abs(pairVy);
			bounced = true;
		}
		if (pairX >= b.maxX) {
			pairX = b.maxX;
			pairVx = -Math.abs(pairVx);
			bounced = true;
		}
		if (pairY >= b.maxY) {
			pairY = b.maxY;
			pairVy = -Math.abs(pairVy);
			bounced = true;
		}

		biankaHeart.x = pairX;
		biankaHeart.y = pairY;
		diegoHeart.x = pairX + biankaHeart.el.offsetWidth + pairGap;
		diegoHeart.y = pairY;

		if (bounced) {
			biankaHeart.size = Math.min(biankaHeart.maxSize, biankaHeart.size + 0.8);
			diegoHeart.size = Math.min(diegoHeart.maxSize, diegoHeart.size + 0.8);
		}

		applyHeart(biankaHeart);
		applyHeart(diegoHeart);
	}

	function getRevealBoxSize() {
		var w = Math.min(window.innerWidth - 28, 520);
		var h = Math.min(Math.max(220, window.innerHeight * 0.32), 300);

		if (window.innerWidth < 480) {
			w = Math.min(window.innerWidth - 18, 380);
			h = Math.min(Math.max(200, window.innerHeight * 0.3), 260);
		}

		return { w: w, h: h };
	}

	function sampleRectBorderPoints(cx, cy, w, h, step) {
		var points = [];
		var left = cx - w / 2;
		var right = cx + w / 2;
		var top = cy - h / 2;
		var bottom = cy + h / 2;
		var x;
		var y;

		for (x = left; x <= right; x += step) {
			points.push({ x: x, y: top });
			points.push({ x: x, y: bottom });
		}

		for (y = top + step; y < bottom; y += step) {
			points.push({ x: left, y: y });
			points.push({ x: right, y: y });
		}

		return points;
	}

	function paintPaperGrain(ctx, w, h) {
		var imageData = ctx.getImageData(0, 0, w, h);
		var data = imageData.data;
		var i;

		for (i = 0; i < data.length; i += 4) {
			var n = (Math.random() - 0.5) * 22;
			data[i] = Math.min(255, Math.max(0, data[i] + n));
			data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n));
			data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n));
		}

		ctx.putImageData(imageData, 0, 0);
	}

	function drawPastedPatch(ctx, w, h) {
		var patchW = rand(w * 0.1, w * 0.26);
		var patchH = rand(h * 0.12, h * 0.32);
		var patchX = rand(0, Math.max(0, w - patchW));
		var patchY = rand(0, Math.max(0, h - patchH));
		var pastels = [
			"rgba(255, 180, 162, 0.62)",
			"rgba(127, 216, 190, 0.58)",
			"rgba(201, 160, 255, 0.58)",
			"rgba(255, 209, 102, 0.6)",
			"rgba(152, 245, 200, 0.55)",
			"rgba(255, 200, 221, 0.58)"
		];

		ctx.save();
		ctx.translate(patchX + patchW / 2, patchY + patchH / 2);
		ctx.rotate(rand(-0.18, 0.18));
		ctx.shadowColor = "rgba(70, 50, 60, 0.18)";
		ctx.shadowBlur = 10;
		ctx.shadowOffsetX = 2;
		ctx.shadowOffsetY = 4;
		ctx.fillStyle = pastels[Math.floor(Math.random() * pastels.length)];
		ctx.fillRect(-patchW / 2, -patchH / 2, patchW, patchH);
		ctx.strokeStyle = "rgba(255, 255, 255, 0.42)";
		ctx.lineWidth = 1.2;
		ctx.strokeRect(-patchW / 2, -patchH / 2, patchW, patchH);
		ctx.restore();
	}

	function drawTapeStrip(ctx, x, y, width, height, angle) {
		ctx.save();
		ctx.translate(x, y);
		ctx.rotate(angle);
		ctx.fillStyle = "rgba(255, 236, 200, 0.72)";
		ctx.fillRect(-width / 2, -height / 2, width, height);
		ctx.strokeStyle = "rgba(220, 190, 140, 0.35)";
		ctx.lineWidth = 0.8;
		ctx.strokeRect(-width / 2, -height / 2, width, height);
		ctx.restore();
	}

	function paintScratchLayer(ctx, w, h) {
		var grad = ctx.createLinearGradient(0, 0, w, h);
		var n;

		grad.addColorStop(0, "rgba(255, 214, 196, 0.96)");
		grad.addColorStop(0.35, "rgba(255, 248, 220, 0.94)");
		grad.addColorStop(0.7, "rgba(196, 228, 255, 0.94)");
		grad.addColorStop(1, "rgba(230, 210, 255, 0.96)");

		ctx.globalCompositeOperation = "source-over";
		ctx.fillStyle = grad;
		ctx.fillRect(0, 0, w, h);
		paintPaperGrain(ctx, w, h);

		for (n = 0; n < 18; n++) {
			drawPastedPatch(ctx, w, h);
		}

		drawTapeStrip(ctx, 16, 14, w * 0.18, 14, -0.45);
		drawTapeStrip(ctx, w - 16, 14, w * 0.16, 12, 0.42);
		drawTapeStrip(ctx, 14, h - 12, w * 0.15, 12, 0.35);
		drawTapeStrip(ctx, w - 14, h - 12, w * 0.17, 13, -0.38);

		for (n = 0; n < 420; n++) {
			ctx.font = Math.round(rand(10, 28)) + 'px "Cormorant Garamond", Georgia, serif';
			ctx.fillStyle = pickColor();
			ctx.globalAlpha = rand(0.45, 0.92);
			ctx.fillText("\u2665", rand(2, w - 6), rand(12, h - 2));
		}

		for (n = 0; n < 1200; n++) {
			ctx.globalAlpha = rand(0.08, 0.38);
			ctx.fillStyle = Math.random() > 0.5 ? "#fffdf5" : pickColor();
			ctx.beginPath();
			ctx.arc(rand(0, w), rand(0, h), rand(0.6, 2.4), 0, Math.PI * 2);
			ctx.fill();
		}

		ctx.globalAlpha = 0.28;
		ctx.fillStyle = "#fffdf0";
		ctx.fillRect(0, 0, w, h);
		ctx.globalAlpha = 1;
	}

	function borderHeartsReady() {
		var ready = 0;
		var total = 0;
		var i;
		var dx;
		var dy;

		for (i = 0; i < hearts.length; i++) {
			if (hearts[i].fill || hearts[i].label) {
				continue;
			}
			if (hearts[i].mode !== "form" && hearts[i].mode !== "hold") {
				continue;
			}

			total++;
			dx = hearts[i].targetX - hearts[i].x;
			dy = hearts[i].targetY - hearts[i].y;

			if (Math.sqrt(dx * dx + dy * dy) < 16) {
				ready++;
			}
		}

		return total > 0 && ready / total >= 0.9;
	}

	function prepScratchSurface(w, h) {
		var canvas = document.getElementById("heartRevealScratch");
		var dustCanvas = document.getElementById("heartRevealDust");
		var ctx;

		if (!canvas) {
			return null;
		}

		canvas.width = w;
		canvas.height = h;
		ctx = canvas.getContext("2d");

		if (!ctx) {
			return null;
		}

		paintScratchLayer(ctx, w, h);

		if (dustCanvas) {
			dustCanvas.width = w;
			dustCanvas.height = h;
		}

		return ctx;
	}

	function getScratchProgress(ctx, w, h) {
		var data = ctx.getImageData(0, 0, w, h).data;
		var total = w * h;
		var cleared = 0;
		var i;

		for (i = 3; i < data.length; i += 16) {
			if (data[i] < 40) {
				cleared++;
			}
		}

		return cleared / (total / 4);
	}

	function initHeartScratchReveal(skipPaint) {
		var box = document.getElementById("heartRevealBox");
		var canvas = document.getElementById("heartRevealScratch");
		var dustCanvas = document.getElementById("heartRevealDust");

		if (!box || !canvas) {
			return;
		}

		var rect = box.getBoundingClientRect();
		var w = Math.round(rect.width);
		var h = Math.round(rect.height);
		var ctx = canvas.getContext("2d");
		var dustCtx = dustCanvas ? dustCanvas.getContext("2d") : null;
		var drawing = false;
		var lastCheck = 0;
		var dustParticles = [];
		var dustAnimating = false;
		var dustColors = [
			"#fff8f2", "#ffe8dc", "#dceeff", "#ead4ff", "#f5e6cc",
			"#ffb4a2", "#c9a0ff", "#98f5c8", "#ffd166", "#ffffff"
		];

		if (!ctx || w < 10 || h < 10) {
			return;
		}

		if (!skipPaint) {
			canvas.width = w;
			canvas.height = h;
			paintScratchLayer(ctx, w, h);
			if (dustCanvas && dustCtx) {
				dustCanvas.width = w;
				dustCanvas.height = h;
			}
		}

		function spawnDust(x, y) {
			var i;

			if (!dustCtx) {
				return;
			}

			for (i = 0; i < rand(6, 12); i++) {
				dustParticles.push({
					x: x + rand(-16, 16),
					y: y + rand(-16, 16),
					vx: rand(-2.4, 2.4),
					vy: rand(-3.2, -0.4),
					life: rand(0.55, 1),
					decay: rand(0.012, 0.028),
					size: rand(1.2, 5.5),
					color: dustColors[Math.floor(Math.random() * dustColors.length)]
				});
			}

			if (!dustAnimating) {
				dustAnimating = true;
				requestAnimationFrame(tickDust);
			}
		}

		function tickDust() {
			var i;
			var p;
			var alive = false;

			if (!dustCtx) {
				dustAnimating = false;
				return;
			}

			dustCtx.clearRect(0, 0, w, h);

			for (i = dustParticles.length - 1; i >= 0; i--) {
				p = dustParticles[i];
				p.x += p.vx;
				p.y += p.vy;
				p.vy += 0.05;
				p.vx *= 0.98;
				p.life -= p.decay;

				if (p.life <= 0) {
					dustParticles.splice(i, 1);
					continue;
				}

				alive = true;
				dustCtx.globalAlpha = p.life * 0.85;
				dustCtx.fillStyle = p.color;
				dustCtx.beginPath();
				dustCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
				dustCtx.fill();
			}

			dustCtx.globalAlpha = 1;

			if (alive || drawing) {
				requestAnimationFrame(tickDust);
			} else {
				dustAnimating = false;
			}
		}

		function pointerPos(event) {
			var r = canvas.getBoundingClientRect();
			var clientX;
			var clientY;

			if (event.touches && event.touches.length) {
				clientX = event.touches[0].clientX;
				clientY = event.touches[0].clientY;
			} else {
				clientX = event.clientX;
				clientY = event.clientY;
			}

			return {
				x: clientX - r.left,
				y: clientY - r.top
			};
		}

		function scratchAt(x, y) {
			var i;

			spawnDust(x, y);
			ctx.globalCompositeOperation = "destination-out";

			ctx.globalAlpha = 0.92;
			ctx.beginPath();
			ctx.arc(x, y, rand(24, 34), 0, Math.PI * 2);
			ctx.fill();

			for (i = 0; i < 8; i++) {
				ctx.globalAlpha = rand(0.25, 0.75);
				ctx.beginPath();
				ctx.arc(
					x + rand(-24, 24),
					y + rand(-24, 24),
					rand(2, 9),
					0,
					Math.PI * 2
				);
				ctx.fill();
			}

			ctx.globalAlpha = 1;
		}

		function onScratch(event) {
			var pos = pointerPos(event);
			scratchAt(pos.x, pos.y);

			if (!scratchRevealed && Date.now() - lastCheck > 180) {
				lastCheck = Date.now();
				if (getScratchProgress(ctx, w, h) >= 0.52) {
					scratchRevealed = true;
					finalePhase = "hold";
					box.classList.add("is-revealed");
					arena.classList.add("is-formed");

					if (biankaHeart && biankaHeart.el) {
						biankaHeart.el.style.zIndex = "14";
					}
					if (diegoHeart && diegoHeart.el) {
						diegoHeart.el.style.zIndex = "14";
					}

					var hi;
					for (hi = 0; hi < hearts.length; hi++) {
						if (hearts[hi].mode === "hold" && !hearts[hi].fill) {
							hearts[hi].el.classList.add("is-shining");
						}
					}
				}
			}

			event.preventDefault();
		}

		function onStart(event) {
			drawing = true;
			onScratch(event);
		}

		function onEnd() {
			drawing = false;
		}

		function onMove(event) {
			if (!drawing) {
				return;
			}
			onScratch(event);
		}

		canvas.addEventListener("mousedown", onStart);
		canvas.addEventListener("mousemove", onMove);
		window.addEventListener("mouseup", onEnd);
		canvas.addEventListener("touchstart", onStart, { passive: false });
		canvas.addEventListener("touchmove", onMove, { passive: false });
		window.addEventListener("touchend", onEnd);
	}

	function showRevealScratchBox() {
		var box = document.getElementById("heartRevealBox");

		if (!box || scratchReady) {
			return;
		}

		scratchReady = true;
		box.style.width = revealBoxRect.w + "px";
		box.style.height = revealBoxRect.h + "px";
		prepScratchSurface(revealBoxRect.w, revealBoxRect.h);
		box.hidden = false;
		arena.appendChild(box);
		arena.classList.add("is-scratching");

		var i;
		for (i = 0; i < hearts.length; i++) {
			if (!hearts[i].fill) {
				hearts[i].mode = "hold";
			}
		}

		requestAnimationFrame(function () {
			requestAnimationFrame(function () {
				box.classList.add("is-visible");
				initHeartScratchReveal(true);
			});
		});
	}

	function startFormBox() {
		finalePhase = "form";
		formStart = Date.now();

		var size = getRevealBoxSize();
		var borderW = size.w + 28;
		var borderH = size.h + 28;
		var targets;
		var i;

		revealBoxRect.cx = window.innerWidth / 2;
		revealBoxRect.cy = window.innerHeight / 2;
		revealBoxRect.w = size.w;
		revealBoxRect.h = size.h;

		targets = sampleRectBorderPoints(revealBoxRect.cx, revealBoxRect.cy, borderW, borderH, 8);

		while (hearts.length < targets.length + 80) {
			createHeart({
				x: rand(0, window.innerWidth),
				y: rand(0, window.innerHeight),
				size: rand(10, 18),
				color: pickColor()
			});
		}

		for (i = 0; i < targets.length; i++) {
			hearts[i].mode = "form";
			hearts[i].targetX = targets[i].x;
			hearts[i].targetY = targets[i].y;
			hearts[i].targetSize = rand(15, 24);
			hearts[i].fill = false;
			hearts[i].icon.style.color = pickColor();
			hearts[i].icon.style.opacity = "1";
			hearts[i].el.classList.remove("is-exploding");
			hearts[i].el.classList.add("is-forming");
		}

		for (i = targets.length; i < hearts.length; i++) {
			var innerX = revealBoxRect.cx - revealBoxRect.w / 2;
			var innerY = revealBoxRect.cy - revealBoxRect.h / 2;

			hearts[i].mode = "form";
			hearts[i].targetX = rand(innerX - 20, innerX + revealBoxRect.w + 20);
			hearts[i].targetY = rand(innerY - 16, innerY + revealBoxRect.h + 16);
			hearts[i].targetSize = rand(6, 14);
			hearts[i].fill = true;
			hearts[i].icon.style.color = pickColor();
			hearts[i].icon.style.opacity = rand(0.12, 0.22);
			hearts[i].el.classList.add("is-forming");
		}
	}

	function startExplosion() {
		if (finalePhase === "explode" || finalePhase === "form" || finalePhase === "reveal" || finalePhase === "hold") {
			return;
		}

		finalePhase = "explode";
		explodeStart = Date.now();
		arena.classList.add("is-finale");

		var cx = window.innerWidth / 2;
		var cy = window.innerHeight / 2;
		var i;

		for (i = 0; i < hearts.length; i++) {
			hearts[i].mode = "explode";
			hearts[i].vx = rand(-10, 10);
			hearts[i].vy = rand(-10, 10);
			hearts[i].growth = rand(4, 8);
			hearts[i].maxSize = rand(38, 68);
			hearts[i].el.classList.add("is-exploding");

			if (hearts[i].text) {
				hearts[i].text.style.opacity = "0";
			}
		}

		for (i = 0; i < 280; i++) {
			var angle = rand(0, Math.PI * 2);
			var speed = rand(5, 12);
			createHeart({
				x: cx + rand(-40, 40),
				y: cy + rand(-40, 40),
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed,
				size: rand(10, 20),
				maxSize: rand(26, 52),
				growth: rand(3, 7),
				color: pickColor()
			});
			hearts[hearts.length - 1].mode = "explode";
			hearts[hearts.length - 1].el.classList.add("is-exploding");
		}
	}

	function updateExplodeHeart(heart) {
		heart.x += heart.vx;
		heart.y += heart.vy;
		heart.size = Math.min(heart.maxSize, heart.size + heart.growth * 0.38);

		if (heart.x < -heart.size) {
			heart.x = window.innerWidth + heart.size;
		}
		if (heart.x > window.innerWidth + heart.size) {
			heart.x = -heart.size;
		}
		if (heart.y < -heart.size) {
			heart.y = window.innerHeight + heart.size;
		}
		if (heart.y > window.innerHeight + heart.size) {
			heart.y = -heart.size;
		}

		applyHeart(heart);
	}

	function updateFormHeart(heart) {
		if (heart.mode === "hold") {
			applyHeart(heart);
			return;
		}

		var progress = Math.min(1, (Date.now() - formStart) / FORM_DURATION);
		var ease = 1 - Math.pow(1 - progress, 3);
		var speed = heart.fill ? 0.045 : 0.14 + ease * 0.14;

		heart.x += (heart.targetX - heart.x) * speed;
		heart.y += (heart.targetY - heart.y) * speed;
		heart.size += (heart.targetSize - heart.size) * 0.18;

		if (progress >= 1 && !heart.fill) {
			heart.mode = "hold";
		}

		applyHeart(heart);
	}

	biankaHeart = createHeart({
		label: "Bianka",
		color: "#a67fd8",
		size: MAIN_SIZE,
		maxSize: 108,
		growth: 1.8
	});

	for (var n = 0; n < 24; n++) {
		spawnMiniHeart();
	}

	function tick() {
		var now = Date.now();
		var elapsed = now - startTime;
		var i;

		if (finalePhase === "bounce" || finalePhase === "approach" || finalePhase === "merge" || finalePhase === "unite") {
			spawnTimer += 1;

			if (spawnTimer % 22 === 0) {
				spawnMiniHeart();
				if (spawnTimer % 44 === 0) {
					spawnMiniHeart();
				}
			}

			if (elapsed >= DIEGO_AT) {
				spawnDiego();
			}

			if (elapsed >= APPROACH_AT && finalePhase === "bounce") {
				finalePhase = "approach";
			}

			if (elapsed >= UNITE_AT && (finalePhase === "bounce" || finalePhase === "approach")) {
				startUnite();
			}

			if (letterRevealFinishedAt && now >= letterRevealFinishedAt + EXPLODE_DELAY_AFTER_LETTER) {
				startExplosion();
			}

			if (diegoHeart && elapsed >= DIEGO_AT && elapsed < UNITE_AT) {
				updateDiegoGrowth(diegoHeart, elapsed);
			}

			if (finalePhase === "approach") {
				updateApproach(elapsed);
			} else if (finalePhase === "merge") {
				updateMerge();
			} else if (finalePhase === "bounce") {
				if (biankaHeart && biankaHeart.mode !== "pair") {
					updateNamedHeart(biankaHeart);
				}
				if (diegoHeart && diegoHeart.mode !== "pair") {
					updateNamedHeart(diegoHeart);
				}
			}

			if (finalePhase === "unite") {
				updatePair();
			}

			for (i = 0; i < miniHearts.length; i++) {
				updateMiniHeart(miniHearts[i]);
			}
		} else if (finalePhase === "explode") {
			if (now - explodeStart >= EXPLODE_DURATION) {
				startFormBox();
			}

			for (i = 0; i < hearts.length; i++) {
				updateExplodeHeart(hearts[i]);
			}
		} else if (finalePhase === "form") {
			if (
				now - formStart >= FORM_DURATION + REVEAL_BOX_EXTRA &&
				borderHeartsReady() &&
				!scratchReady
			) {
				showRevealScratchBox();
				finalePhase = "reveal";
			}

			for (i = 0; i < hearts.length; i++) {
				if (hearts[i].mode === "form") {
					updateFormHeart(hearts[i]);
				}
			}
		} else if (finalePhase === "reveal" || finalePhase === "hold") {
			for (i = 0; i < hearts.length; i++) {
				if (hearts[i].mode === "form") {
					updateFormHeart(hearts[i]);
				} else if (hearts[i].mode === "hold") {
					applyHeart(hearts[i]);
				}
			}
		}

		requestAnimationFrame(tick);
	}

	window.addEventListener("resize", function () {
		if (finalePhase === "hold" || finalePhase === "form" || finalePhase === "reveal") {
			return;
		}
	});

	requestAnimationFrame(tick);
}

function initSwipeSlider() {
	var track = document.getElementById("swipeTrack");
	var handle = document.getElementById("swipeHandle");
	var fill = document.getElementById("swipeFill");
	var success = document.getElementById("swipeSuccess");
	var prompt = document.getElementById("swipePrompt");

	if (!track || !handle || !fill) {
		return;
	}

	var dragging = false;
	var completed = false;
	var handleWidth = 46;
	var padding = 4;

	function maxTravel() {
		return track.clientWidth - handleWidth - padding * 2;
	}

	function setPosition(x) {
		var travel = maxTravel();
		var clamped = Math.max(0, Math.min(x, travel));

		handle.style.left = (padding + clamped) + "px";
		fill.style.width = (padding + clamped + handleWidth / 2) + "px";

		if (travel > 0 && clamped / travel > 0.35) {
			track.classList.add("revealing");
		} else {
			track.classList.remove("revealing");
		}

		if (travel > 0 && clamped / travel >= 0.92 && !completed) {
			completed = true;
			track.classList.add("completed");
			track.classList.add("revealing");
			handle.style.left = (track.clientWidth - handleWidth - padding) + "px";
			fill.style.width = "100%";
			if (prompt) {
				prompt.textContent = "Respuesta recibida";
			}
			if (success) {
				success.hidden = false;
			}
		}
	}

	function resetIfNeeded() {
		if (completed) {
			return;
		}
		handle.style.left = padding + "px";
		fill.style.width = "0";
		track.classList.remove("revealing");
	}

	function pointerX(event) {
		if (event.touches && event.touches.length) {
			return event.touches[0].clientX;
		}
		return event.clientX;
	}

	function onStart(event) {
		if (completed) {
			return;
		}
		dragging = true;
		event.preventDefault();
	}

	function onMove(event) {
		if (!dragging || completed) {
			return;
		}

		var rect = track.getBoundingClientRect();
		var x = pointerX(event) - rect.left - handleWidth / 2 - padding;
		setPosition(x);
		event.preventDefault();
	}

	function onEnd() {
		if (!dragging) {
			return;
		}
		dragging = false;
		if (!completed) {
			resetIfNeeded();
		}
	}

	handle.addEventListener("mousedown", onStart);
	handle.addEventListener("touchstart", onStart, { passive: false });
	window.addEventListener("mousemove", onMove);
	window.addEventListener("touchmove", onMove, { passive: false });
	window.addEventListener("mouseup", onEnd);
	window.addEventListener("touchend", onEnd);
}

function initPageDoodles() {
	var box = document.getElementById("pageDoodles");
	var files = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k"];
	var w = window.innerWidth;
	var cols = w < 480 ? 6 : w < 960 ? 8 : 10;
	var rows = w < 480 ? 24 : w < 960 ? 20 : 16;
	var r;
	var c;
	var count = 0;
	var frag = document.createDocumentFragment();
	var img;
	var letter;
	var jitterX;
	var jitterY;
	var top;
	var left;
	var size;
	var rot;
	var op;
	var colOffset;

	if (!box) {
		return;
	}

	box.innerHTML = "";

	for (r = 0; r < rows; r++) {
		colOffset = (r % 2) * (88 / cols);

		for (c = 0; c < cols; c++) {
			letter = files[count % files.length];
			jitterX = ((count * 17 + r * 9 + c * 5) % 13) - 6;
			jitterY = ((count * 23 + r * 11 + c * 7) % 11) - 5;
			top = ((r + 0.35) / rows) * 100 + jitterY * 0.45;
			left = colOffset + ((c + 0.35) / cols) * 92 + jitterX * 0.5;
			size = 48 + ((count * 7 + r * 3 + c * 5) % 38);
			rot = -24 + ((count * 13 + r * 7 + c * 5) % 48);
			op = 0.58 + ((count * 5 + r + c) % 22) / 100;

			img = document.createElement("img");
			img.className = "doodle doodle-scatter";
			img.src = letter + ".png";
			img.alt = "";
			img.style.top = top.toFixed(2) + "%";
			img.style.left = Math.max(0.5, Math.min(94, left)).toFixed(2) + "%";
			img.style.width = size + "px";
			img.style.height = size + "px";
			img.style.transform = "rotate(" + rot + "deg)";
			img.style.opacity = op.toFixed(2);

			frag.appendChild(img);
			count++;
		}
	}

	box.appendChild(frag);
}

function initPage(startDate, imageUrls) {
	initPageDoodles();
	timeElapse(startDate);
	setInterval(function () {
		timeElapse(startDate);
	}, 500);

	prepareLetterCardWaiting();
	initBouncingHeart();
	initStoryPhotos();
	startPuzzleHeart(imageUrls);

	var clientWidth = $(window).width();
	var clientHeight = $(window).height();

	$(window).resize(function () {
		var newWidth = $(window).width();
		var newHeight = $(window).height();
		if (newWidth !== clientWidth && newHeight !== clientHeight) {
			location.replace(location.href);
		}
	});
}
