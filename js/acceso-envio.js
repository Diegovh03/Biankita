(function () {
	var ENVIADO_URL = "https://diegovh03.github.io/Biankita/enviado.html";
	var SCRIPT_URL = window.GOOGLE_SCRIPT_URL ||
		"https://script.google.com/macros/s/AKfycby8fBHPwiZ8z6Yn_7Xu5Ebl5qAQd0RXGtxt9D78AogsLuemHkRtFia4wLMIZoe4iAJjnQ/exec";
	var IFRAME_NAME = "googleScriptFrame";

	function enviarPorGoogleScript(email, onDone) {
		var iframe = document.getElementById(IFRAME_NAME);

		if (!iframe) {
			iframe = document.createElement("iframe");
			iframe.id = IFRAME_NAME;
			iframe.name = IFRAME_NAME;
			iframe.title = "Envio de correo";
			iframe.style.display = "none";
			iframe.setAttribute("aria-hidden", "true");
			document.body.appendChild(iframe);
		}

		var ghost = document.createElement("form");
		ghost.method = "POST";
		ghost.action = SCRIPT_URL;
		ghost.target = IFRAME_NAME;
		ghost.acceptCharset = "UTF-8";
		ghost.style.display = "none";

		var hidden = document.createElement("input");
		hidden.type = "hidden";
		hidden.name = "email";
		hidden.value = email;
		ghost.appendChild(hidden);

		document.body.appendChild(ghost);
		ghost.submit();
		document.body.removeChild(ghost);

		setTimeout(onDone, 5000);
	}

	function initAccesoEnvio() {
		var form = document.getElementById("accesoForm");
		var input = document.getElementById("email");
		var status = document.getElementById("accesoStatus");
		var btn = form ? form.querySelector("button") : null;

		if (!form || !input || !btn) {
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
			btn.textContent = "Enviando…";
			status.className = "gate-status";
			status.textContent = "Enviando el enlace a tu correo…";

			enviarPorGoogleScript(email, function () {
				window.location.href = ENVIADO_URL;
			});
		});
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", initAccesoEnvio);
	} else {
		initAccesoEnvio();
	}
})();
