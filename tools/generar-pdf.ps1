$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$node = Join-Path $env:LOCALAPPDATA "Programs\cursor\resources\app\resources\helpers\node.exe"

if (-not (Test-Path $node)) {
	$node = "node"
}

Write-Host "Capturando 2 paginas: carta con corazones + propuesta a medio raspar..."
Write-Host "Puede tardar ~45-60 segundos."

& $node (Join-Path $PSScriptRoot "capture-screenshot.js")

$pdf = Join-Path $root "Biankita-carta-completa.pdf"
$png1 = Join-Path $root "Biankita-captura-carta.png"
$png2 = Join-Path $root "Biankita-captura-propuesta.png"

if (Test-Path $pdf) {
	$sizeMb = [math]::Round((Get-Item $pdf).Length / 1MB, 2)
	Write-Host "PDF listo: $pdf ($sizeMb MB)"
}

if (Test-Path $png1) {
	Write-Host "PNG carta: $png1"
}

if (Test-Path $png2) {
	Write-Host "PNG propuesta: $png2"
}
