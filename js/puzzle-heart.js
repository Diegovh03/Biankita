(function (window) {
	"use strict";

	function easeOutCubic(t) {
		return 1 - Math.pow(1 - t, 3);
	}

	function random(min, max) {
		return min + Math.random() * (max - min);
	}

	function pointInPolygon(x, y, polygon) {
		var inside = false;
		for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
			var xi = polygon[i].x;
			var yi = polygon[i].y;
			var xj = polygon[j].x;
			var yj = polygon[j].y;
			if (((yi > y) !== (yj > y)) &&
				(x < (xj - xi) * (y - yi) / (yj - yi + 0.00001) + xi)) {
				inside = !inside;
			}
		}
		return inside;
	}

	function clampSource(img, sx, sy, sw, sh) {
		if (sx < 0) { sw += sx; sx = 0; }
		if (sy < 0) { sh += sy; sy = 0; }
		if (sx + sw > img.width) { sw = img.width - sx; }
		if (sy + sh > img.height) { sh = img.height - sy; }
		if (sw <= 1 || sh <= 1) { return null; }
		return { sx: sx, sy: sy, sw: sw, sh: sh };
	}

	function PuzzleHeart(canvas, images) {
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");
		this.images = images;
		this.cols = 10;
		this.rows = 12;
		this.pieces = [];
		this.placedPieces = [];
		this.running = false;
		this.onComplete = null;
		this.onProgress = null;
	}

	PuzzleHeart.prototype.setupCanvas = function () {
		var parent = this.canvas.parentElement;
		var sizeW = parent ? (parent.clientWidth || 670) : 670;
		var sizeH = parent ? (parent.clientHeight || 625) : 625;

		this.canvas.width = sizeW;
		this.canvas.height = sizeH;
		this.factor = (sizeW / 670) * 0.94;
		this.cx = sizeW / 2;
		this.cy = sizeH / 2 - 12 * this.factor;
		this.heartPolygon = this.buildHeartPolygon();
		this.bounds = this.getPolygonBounds(this.heartPolygon);
	};

	PuzzleHeart.prototype.buildHeartPolygon = function () {
		var points = [];
		var steps = 200;
		var f = this.factor;

		for (var i = 0; i <= steps; i++) {
			var t = (i / steps) * Math.PI * 2;
			points.push({
				x: this.cx + 19.5 * f * (16 * Math.pow(Math.sin(t), 3)),
				y: this.cy - 20 * f * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))
			});
		}
		return points;
	};

	PuzzleHeart.prototype.getPolygonBounds = function (polygon) {
		var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
		for (var i = 0; i < polygon.length; i++) {
			var p = polygon[i];
			if (p.x < minX) minX = p.x;
			if (p.y < minY) minY = p.y;
			if (p.x > maxX) maxX = p.x;
			if (p.y > maxY) maxY = p.y;
		}
		return { minX: minX, minY: minY, maxX: maxX, maxY: maxY };
	};

	PuzzleHeart.prototype.applyHeartClip = function (ctx) {
		var poly = this.heartPolygon;
		ctx.beginPath();
		ctx.moveTo(poly[0].x, poly[0].y);
		for (var i = 1; i < poly.length; i++) {
			ctx.lineTo(poly[i].x, poly[i].y);
		}
		ctx.closePath();
		ctx.clip();
	};

	PuzzleHeart.prototype.getImageLayout = function (image, region) {
		var regionW = region.maxX - region.minX;
		var regionH = region.maxY - region.minY;
		var coverScale = Math.max(regionW / image.width, regionH / image.height);
		var drawW = image.width * coverScale;
		var drawH = image.height * coverScale;
		return {
			drawW: drawW,
			drawH: drawH,
			offsetX: region.minX + (regionW - drawW) / 2,
			offsetY: region.minY + (regionH - drawH) / 2
		};
	};

	PuzzleHeart.prototype.buildPieces = function () {
		var bounds = this.bounds;
		var heartW = bounds.maxX - bounds.minX;
		var heartH = bounds.maxY - bounds.minY;
		var cellW = heartW / this.cols;
		var cellH = heartH / this.rows;
		var midX = this.cx;
		var imgLeft = this.images[0];
		var imgRight = this.images[1];

		var leftRegion = { minX: bounds.minX, maxX: midX, minY: bounds.minY, maxY: bounds.maxY };
		var rightRegion = { minX: midX, maxX: bounds.maxX, minY: bounds.minY, maxY: bounds.maxY };
		var leftLayout = this.getImageLayout(imgLeft, leftRegion);
		var rightLayout = this.getImageLayout(imgRight, rightRegion);

		var leftPieces = [];
		var rightPieces = [];

		for (var row = 0; row < this.rows; row++) {
			for (var col = 0; col < this.cols; col++) {
				var x = bounds.minX + col * cellW;
				var y = bounds.minY + row * cellH;
				var centerX = x + cellW / 2;
				var centerY = y + cellH / 2;

				if (!pointInPolygon(centerX, centerY, this.heartPolygon)) {
					continue;
				}

				var isLeft = centerX < midX;
				var image = isLeft ? imgLeft : imgRight;
				var layout = isLeft ? leftLayout : rightLayout;
				var list = isLeft ? leftPieces : rightPieces;
				var angle = random(0, Math.PI * 2);
				var dist = random(180, 320) * this.factor;
				var side = isLeft ? -1 : 1;

				list.push({
					destX: x,
					destY: y,
					w: cellW + 1,
					h: cellH + 1,
					srcX: ((x - layout.offsetX) / layout.drawW) * image.width,
					srcY: ((y - layout.offsetY) / layout.drawH) * image.height,
					srcW: (cellW / layout.drawW) * image.width,
					srcH: (cellH / layout.drawH) * image.height,
					fromX: centerX + Math.cos(angle) * dist + side * 40,
					fromY: centerY + Math.sin(angle) * dist - 60 * this.factor,
					fromRot: random(-1.2, 1.2),
					fromScale: random(0.5, 0.85),
					duration: 1400,
					image: image
				});
			}
		}

		leftPieces.forEach(function (p, i) {
			p.delay = 400 + i * 90;
		});

		var leftEnd = leftPieces.length ? leftPieces[leftPieces.length - 1].delay + 1100 : 0;
		rightPieces.forEach(function (p, i) {
			p.delay = leftEnd + 400 + i * 90;
		});

		return leftPieces.concat(rightPieces);
	};

	PuzzleHeart.prototype.drawPiece = function (ctx, piece, x, y, rot, scale, alpha, grid) {
		var img = piece.image;
		if (!img || !img.complete || !img.naturalWidth) {
			return;
		}

		var source = clampSource(img, piece.srcX, piece.srcY, piece.srcW, piece.srcH);
		if (!source) {
			return;
		}

		var w = piece.w * scale;
		var h = piece.h * scale;

		ctx.save();
		ctx.globalAlpha = alpha;
		ctx.translate(x + piece.w / 2, y + piece.h / 2);
		ctx.rotate(rot);
		ctx.scale(scale, scale);
		ctx.drawImage(
			img,
			source.sx, source.sy, source.sw, source.sh,
			-piece.w / 2, -piece.h / 2, piece.w, piece.h
		);
		ctx.restore();

		if (grid) {
			ctx.save();
			ctx.globalAlpha = alpha * 0.45;
			ctx.strokeStyle = "#ffffff";
			ctx.lineWidth = 1.2;
			ctx.strokeRect(x, y, w, h);
			ctx.restore();
		}
	};

	PuzzleHeart.prototype.paintFrame = function () {
		var ctx = this.ctx;
		var i;

		ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		for (i = 0; i < this.pieces.length; i++) {
			var flying = this.pieces[i];
			if (!flying.done && flying.currentX !== undefined) {
				this.drawPiece(
					ctx,
					flying,
					flying.currentX,
					flying.currentY,
					flying.currentRot,
					flying.currentScale,
					flying.currentAlpha,
					true
				);
			}
		}

		ctx.save();
		this.applyHeartClip(ctx);

		for (i = 0; i < this.placedPieces.length; i++) {
			var p = this.placedPieces[i];
			this.drawPiece(ctx, p, p.destX, p.destY, 0, 1, 1, false);
		}

		ctx.restore();
	};

	PuzzleHeart.prototype.start = function () {
		var self = this;
		this.pieces = this.buildPieces();
		this.placedPieces = [];
		this.startTime = performance.now();
		this.running = true;
		this.totalPieces = this.pieces.length;
		this.doneCount = 0;

		function tick(now) {
			self.update(now);
			if (self.running) {
				requestAnimationFrame(tick);
			}
		}

		requestAnimationFrame(tick);
	};

	PuzzleHeart.prototype.update = function (now) {
		var elapsed = now - this.startTime;
		var allDone = true;
		var i;

		for (i = 0; i < this.pieces.length; i++) {
			var piece = this.pieces[i];
			if (piece.done) {
				continue;
			}

			var t = elapsed - piece.delay;
			if (t <= 0) {
				allDone = false;
				continue;
			}

			var progress = Math.min(1, t / piece.duration);
			var eased = easeOutCubic(progress);

			if (progress < 1) {
				allDone = false;
				piece.currentX = piece.fromX + (piece.destX - piece.fromX) * eased;
				piece.currentY = piece.fromY + (piece.destY - piece.fromY) * eased;
				piece.currentRot = piece.fromRot * (1 - eased);
				piece.currentScale = piece.fromScale + (1 - piece.fromScale) * eased;
				piece.currentAlpha = Math.min(1, 0.35 + progress * 0.75);
			} else {
				piece.done = true;
				this.placedPieces.push(piece);
				this.doneCount++;

				if (typeof this.onProgress === "function") {
					this.onProgress(this.doneCount / this.totalPieces);
				}
			}
		}

		this.paintFrame();

		if (allDone) {
			this.running = false;
			if (this.onComplete) {
				this.onComplete();
			}
		}
	};

	PuzzleHeart.loadImages = function (urls, callback) {
		var pre1 = document.getElementById("preloadFoto1");
		var pre2 = document.getElementById("preloadFoto2");

		if (pre1 && pre2 && pre1.complete && pre2.complete &&
			pre1.naturalWidth > 0 && pre2.naturalWidth > 0) {
			callback([pre1, pre2]);
			return;
		}

		var loaded = [];
		var done = 0;
		var total = urls.length;

		urls.forEach(function (url, index) {
			var img = new Image();
			img.onload = function () {
				loaded[index] = img;
				done++;
				if (done === total) {
					callback(loaded);
				}
			};
			img.onerror = function () {
				done++;
				if (done === total) {
					callback(loaded);
				}
			};
			img.src = url;
		});
	};

	window.PuzzleHeart = PuzzleHeart;
})(window);
