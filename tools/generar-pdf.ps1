$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$pdf = Join-Path $root "Biankita-carta-completa.pdf"
$chrome = Join-Path $env:LOCALAPPDATA "Google\Chrome\Application\chrome.exe"
$node = Join-Path $env:LOCALAPPDATA "Programs\cursor\resources\app\resources\helpers\node.exe"

if (-not (Test-Path $chrome)) {
	$chrome = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
}

if (-not (Test-Path $node)) {
	$node = "node"
}

if (-not (Test-Path $chrome)) {
	Write-Error "No se encontro Chrome ni Edge para generar el PDF."
}

Write-Host "Generando PDF (espera ~25 segundos)..."

$server = Start-Process -FilePath $node -ArgumentList "tools/serve-static.js" -WorkingDirectory $root -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 2

try {
	if (Test-Path $pdf) {
		Remove-Item $pdf -Force
	}

	$url = "http://127.0.0.1:8765/index.html?pdf=1"
	& $chrome --headless --disable-gpu --no-pdf-header-footer --virtual-time-budget=24000 --run-all-compositor-stages-before-draw --print-to-pdf="$pdf" $url | Out-Null

	if (-not (Test-Path $pdf)) {
		Write-Error "No se pudo crear el PDF."
	}

	$sizeMb = [math]::Round((Get-Item $pdf).Length / 1MB, 2)
	Write-Host "Listo: $pdf ($sizeMb MB)"
}
finally {
	Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
}
