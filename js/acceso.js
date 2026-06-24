var CARTA_URL = "https://diegovh03.github.io/Biankita/index.html?v=20260625";
var ENVIADO_URL = "https://diegovh03.github.io/Biankita/enviado.html";

function hasGoogleScript() {
	var url = window.GOOGLE_SCRIPT_URL;
	return url && url.indexOf("http") === 0 && url.indexOf("/exec") !== -1;
}

function buildMailto(email) {
	var subject = encodeURIComponent("Tu carta te espera");
	var body = encodeURIComponent(
		"Hola,\n\nTe envio el enlace de tu carta:\n\n" +
			CARTA_URL +
			"\n\nAbrelo desde tu laptop para que se vea mejor.\n\nCon cariño,\nDiego"
	);

	return "mailto:" + encodeURIComponent(email) + "?subject=" + subject + "&body=" + body;
}

function initAccesoForm() {
	var form = document.getElementById("accesoForm");
	var input = document.getElementById("email");
	var status = document.getElementById("accesoStatus");
	var btn = form.querySelector("button");

	if (!form || !input) {
		return;
	}

	if (hasGoogleScript()) {
		form.action = window.GOOGLE_SCRIPT_URL;
		form.method = "POST";
		form.addEventListener("submit", function () {
			btn.disabled = true;
			btn.textContent = "Enviando…";
		});
		return;
	}

	form.addEventListener("submit", function (event) {
		event.preventDefault();

		var email = input.value.trim().toLowerCase();

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			status.className = "gate-status gate-status--error";
			status.textContent = "Escribe un correo valido.";
			return;
		}

		btn.disabled = true;
		btn.textContent = "Abriendo correo…";
		status.className = "gate-status gate-status--ok";
		status.textContent =
			"Se abrira tu app de correo con el enlace. Pulsa Enviar alli.";

		window.location.href = buildMailto(email);

		setTimeout(function () {
			window.location.href = ENVIADO_URL + "?modo=borrador";
		}, 1200);
	});
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", initAccesoForm);
} else {
	initAccesoForm();
}
