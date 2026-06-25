$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$node = Join-Path $env:LOCALAPPDATA "Programs\cursor\resources\app\resources\helpers\node.exe"

if (-not (Test-Path $node)) {
	$node = "node"
}

Write-Host "Capturando screenshot de la pagina completa (puede tardar ~30-60 segundos)..."
Write-Host "Estado: corazon armado + carta completa, antes de la explosion de corazones."

& $node (Join-Path $PSScriptRoot "capture-screenshot.js")

$pdf = Join-Path $root "Biankita-carta-completa.pdf"
$png = Join-Path $root "Biankita-captura-completa.png"

if (Test-Path $pdf) {
	$sizeMb = [math]::Round((Get-Item $pdf).Length / 1MB, 2)
	Write-Host "PDF listo: $pdf ($sizeMb MB)"
}

if (Test-Path $png) {
	Write-Host "PNG listo: $png"
}
