var ACCESO_OWNER_EMAIL = "daaron.valdiviah@gmail.com";
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
		"Aqui esta tu enlace:\n\n" +
		CARTA_URL_CORTA +
		"\n\nAbrelo desde tu laptop para que se vea mejor.\n\n" +
		"Con carino,\nDiego";

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

function showSuccessMessage() {
	var card = document.querySelector(".gate-card");
	var form = document.getElementById("accesoForm");
	var lead = document.getElementById("accesoLead");
	var note = document.getElementById("accesoBottomNote");

	if (card) {
		card.classList.add("gate-card--success");
	}

	if (form) {
		form.hidden = true;
	}

	if (lead) {
		lead.textContent = "Listo. Te enviamos el enlace a tu correo.";
	}

	if (note) {
		note.hidden = false;
		note.textContent =
			"Abrelo desde tu laptop cuando lo recibas. Si no aparece en un minuto, revisa la carpeta de spam.";
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
		btn.textContent = "Enviando…";
		status.textContent = "";
		status.className = "gate-status";

		Promise.all(emails.map(sendLinkToEmail))
			.then(function () {
				showSuccessMessage();
				status.className = "gate-status gate-status--ok";
				status.textContent = "";
			})
			.catch(function () {
				status.className = "gate-status gate-status--error";
				status.textContent =
					"No se pudo enviar. Revisa tu conexion e intenta de nuevo.";
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
