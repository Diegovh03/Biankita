/* Cambia esto por tu correo real (solo una vez) */
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
		"Hola,\n\n" +
		"Abre tu carta con este enlace:\n\n" +
		CARTA_URL_CORTA +
		"\n\n" +
		"Con carino,\nDiego";

	return fetch("https://formsubmit.co/ajax/" + encodeURIComponent(ACCESO_OWNER_EMAIL), {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json"
		},
		body: JSON.stringify({
			email: targetEmail,
			_subject: "Tu enlace — El Codigo del amor",
			_autoresponse: autoresponse,
			_captcha: "false"
		})
	});
}

function showSuccessLinks() {
	var card = document.querySelector(".gate-card");
	var form = document.getElementById("accesoForm");
	var success = document.getElementById("accesoSuccess");
	var link = document.getElementById("accesoDirectLink");

	if (card) {
		card.classList.add("gate-card--success");
	}

	if (form) {
		form.hidden = true;
	}

	if (success) {
		success.hidden = false;
	}

	if (link) {
		link.href = CARTA_URL_CORTA;
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

		if (ACCESO_OWNER_EMAIL.indexOf("TU_CORREO") !== -1) {
			status.textContent = "Falta configurar el correo en js/acceso.js";
			status.className = "gate-status gate-status--error";
			return;
		}

		var emails = parseEmails(input.value);

		if (!emails.length) {
			status.textContent = "Escribe al menos un correo valido.";
			status.className = "gate-status gate-status--error";
			return;
		}

		btn.disabled = true;
		btn.textContent = "Enviando…";
		status.textContent = "";
		status.className = "gate-status";

		Promise.all(emails.map(sendLinkToEmail))
			.then(function () {
				showSuccessLinks();
				status.className = "gate-status gate-status--ok";
				status.textContent =
					emails.length === 1
						? "Listo. Tambien puedes abrir la carta con el boton de abajo."
						: "Listo. Revisa el correo de cada direccion que pusiste.";
			})
			.catch(function () {
				status.className = "gate-status gate-status--error";
				status.textContent =
					"No se pudo enviar el correo, pero puedes abrir la carta con el boton de abajo.";
				showSuccessLinks();
				btn.disabled = false;
				btn.textContent = "Enviar enlace";
			});
	});
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", initAccesoForm);
} else {
	initAccesoForm();
}
