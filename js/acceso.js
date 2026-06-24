var CARTA_URL = "https://is.gd/OBRhL8";
var ENVIADO_URL = "https://diegovh03.github.io/Biankita/enviado.html";

function isEmailJsReady() {
	var cfg = window.EMAILJS_CONFIG;

	return (
		cfg &&
		cfg.publicKey &&
		cfg.publicKey.indexOf("PON_AQUI") === -1 &&
		cfg.serviceId &&
		cfg.serviceId.indexOf("PON_AQUI") === -1 &&
		cfg.templateId &&
		cfg.templateId.indexOf("PON_AQUI") === -1
	);
}

function initAccesoForm() {
	var form = document.getElementById("accesoForm");
	var input = document.getElementById("email");
	var status = document.getElementById("accesoStatus");
	var btn = form.querySelector("button");

	if (!form || !input) {
		return;
	}

	if (!isEmailJsReady()) {
		status.className = "gate-status gate-status--error";
		status.innerHTML =
			'Falta configurar el envio de correos. Abre <a href="configurar-correo.html">configurar-correo.html</a> (solo una vez).';
		btn.disabled = true;
		return;
	}

	emailjs.init({ publicKey: window.EMAILJS_CONFIG.publicKey });

	form.addEventListener("submit", function (event) {
		event.preventDefault();

		var email = input.value.trim().toLowerCase();

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			status.className = "gate-status gate-status--error";
			status.textContent = "Escribe un correo valido.";
			return;
		}

		btn.disabled = true;
		btn.textContent = "Enviando…";
		status.className = "gate-status";
		status.textContent = "";

		emailjs
			.send(window.EMAILJS_CONFIG.serviceId, window.EMAILJS_CONFIG.templateId, {
				to_email: email,
				link: CARTA_URL,
				user_email: email
			})
			.then(function () {
				window.location.href = ENVIADO_URL;
			})
			.catch(function () {
				status.className = "gate-status gate-status--error";
				status.textContent =
					"No se pudo enviar. Revisa configurar-correo.html o intenta de nuevo.";
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
