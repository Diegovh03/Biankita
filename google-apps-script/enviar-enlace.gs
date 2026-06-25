var CARTA_URL = "https://diegovh03.github.io/Biankita/index.html?v=20260625";
var ENVIADO_URL = "https://diegovh03.github.io/Biankita/enviado.html";

function doGet() {
	return HtmlService.createHtmlOutput("Servicio activo. Usa el formulario de acceso.");
}

function doPost(e) {
	var email = "";

	try {
		if (e && e.parameter && e.parameter.email) {
			email = String(e.parameter.email).trim().toLowerCase();
		}

		if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return paginaError("Correo invalido.");
		}

		GmailApp.sendEmail(
			email,
			"Tu carta te espera",
			"Hola,\n\n" +
				"Te envio el enlace de tu carta:\n\n" +
				CARTA_URL +
				"\n\nAbrelo desde tu laptop para que se vea mejor.\n\n" +
				"Con cariño,\nDiego"
		);

		return HtmlService.createHtmlOutput(
			'<!DOCTYPE html><html><head><meta charset="utf-8">' +
				'<meta http-equiv="refresh" content="0;url=' +
				ENVIADO_URL +
				'">' +
				"</head><body><p>Enviado. Redirigiendo…</p></body></html>"
		);
	} catch (err) {
		return paginaError("No se pudo enviar el correo. Revisa la autorizacion de Gmail en Apps Script.");
	}
}

function paginaError(mensaje) {
	return HtmlService.createHtmlOutput(
		"<!DOCTYPE html><html><head><meta charset=\"utf-8\"></head><body><p>" +
			mensaje +
			"</p></body></html>"
	);
}
