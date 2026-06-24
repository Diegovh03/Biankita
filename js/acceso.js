var ACCESO_OWNER_EMAIL = "daaron.valdiviah@gmail.com";
var CARTA_URL = "https://diegovh03.github.io/Biankita/index.html";
var CARTA_URL_CORTA = "https://is.gd/OBRhL8";

function parseEmails(value) {
	return value
		.split(/[,;]+/)
		.map(function (s) {
			return s.trim().toLowerCase();
		})
		.filter(function (s) {
			return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
		});
}

function sendLinkToEmail(targetEmail) {
	var autoresponse =
		"Hola,\n\nAbre tu carta aqui:\n\n" +
		CARTA_URL_CORTA +
		"\n\nCon carino,\nDiego";

	return fetch("https://formsubmit.co/ajax/" + encodeURIComponent(ACCESO_OWNER_EMAIL), {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json"
		},
		body: JSON.stringify({
			email: targetEmail,
			_subject: "Nuevo pedido de enlace (para Diego)",
			_autoresponse: autoresponse,
			_captcha: "false"
		})
	});
}

function showSuccessLinks() {
	var card = document.querySelector(".gate-card");
	var form = document.getElementById("accesoForm");
	var lead = document.getElementById("accesoLead");
	var success = document.getElementById("accesoSuccess");
	var link = document.getElementById("accesoDirectLink");
	var note = document.getElementById("accesoBottomNote");

	if (card) {
		card.classList.add("gate-card--success");
	}

	if (form) {
		form.hidden = true;
	}

	if (lead) {
		lead.textContent = "Listo. Abre tu carta con este boton:";
	}

	if (success) {
		success.hidden = false;
	}

	if (link) {
		link.href = CARTA_URL_CORTA;
	}

	if (note) {
		note.textContent =
			"Tambien intentamos enviarte el enlace al correo. Si no llega, usa el boton de arriba.";
	}
}

function initAccesoForm() {
	var form = document.getElementById("accesoForm");
	var input = document.getElementById("emails");
	var status = document.getElementById("accesoStatus");
	var btn = form.querySelector("button");

	if (!form || !input) {
		return;
	}

	form.addEventListener("submit", function (event) {
		event.preventDefault();

		var emails = parseEmails(input.value);

		if (!emails.length) {
			status.textContent = "Escribe al menos un correo valido.";
			status.className = "gate-status gate-status--error";
			return;
		}

		btn.disabled = true;
		btn.textContent = "Un momento…";
		status.textContent = "";
		status.className = "gate-status";

		showSuccessLinks();
		status.className = "gate-status gate-status--ok";
		status.textContent = "Tu carta ya esta lista para abrir.";

		emails.forEach(function (targetEmail) {
			sendLinkToEmail(targetEmail).catch(function () {
				/* El boton en pantalla siempre funciona aunque falle el correo */
			});
		});
	});
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", initAccesoForm);
} else {
	initAccesoForm();
}
