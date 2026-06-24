/* Cambia esto por tu correo real (solo una vez) */
var ACCESO_OWNER_EMAIL = "daaron.valdiviah@gmail.com";
var CARTA_URL = "https://diegovh03.github.io/Biankita/";

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
		"Hola 💜\n\nAquí está tu enlace:\n\n" +
		CARTA_URL +
		"\n\nÁbrelo desde el celular para que se vea mejor.\n\nCon cariño,\nDiego";

	return fetch("https://formsubmit.co/ajax/" + encodeURIComponent(ACCESO_OWNER_EMAIL), {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json"
		},
		body: JSON.stringify({
			email: targetEmail,
			_subject: "Tu enlace — El Código del amor",
			_autoresponse: autoresponse,
			_template: "table",
			_captcha: "false"
		})
	});
}

function initAccesoForm() {
	var form = document.getElementById("accesoForm");
	var input = document.getElementById("emails");
	var status = document.getElementById("accesoStatus");
	var card = document.querySelector(".gate-card");
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
			status.textContent = "Escribe al menos un correo válido.";
			status.className = "gate-status gate-status--error";
			return;
		}

		btn.disabled = true;
		btn.textContent = "Enviando…";
		status.textContent = "";
		status.className = "gate-status";

		Promise.all(emails.map(sendLinkToEmail))
			.then(function () {
				card.classList.add("gate-card--success");
				form.hidden = true;
				status.className = "gate-status gate-status--ok";
				status.textContent =
					emails.length === 1
						? "Listo. Revisa tu correo (y spam si no aparece)."
						: "Listo. Revisa el correo de cada dirección que pusiste.";
			})
			.catch(function () {
				status.className = "gate-status gate-status--error";
				status.textContent =
					"No se pudo enviar. Revisa tu conexión o prueba de nuevo en un minuto.";
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
