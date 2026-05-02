Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Host "Préparation du build Windows..."

py -m pip install pyinstaller

if (Test-Path build) { Remove-Item -LiteralPath build -Recurse -Force }
if (Test-Path dist) { Remove-Item -LiteralPath dist -Recurse -Force }
if (Test-Path release) { Remove-Item -LiteralPath release -Recurse -Force }

py -m PyInstaller FicheCardenveil.spec --noconfirm

$releaseDir = Join-Path $root "release"
$packageDir = Join-Path $releaseDir "FicheCardenveil"
$zipPath = Join-Path $releaseDir "FicheCardenveil-win.zip"

New-Item -ItemType Directory -Path $releaseDir | Out-Null
Copy-Item -LiteralPath (Join-Path $root "dist\\FicheCardenveil") -Destination $packageDir -Recurse
Copy-Item -LiteralPath (Join-Path $root "README-distribution.txt") -Destination (Join-Path $packageDir "README.txt")

Compress-Archive -Path (Join-Path $packageDir "*") -DestinationPath $zipPath -Force

Write-Host ""
Write-Host "Build terminé."
Write-Host "Dossier : $packageDir"
Write-Host "Archive : $zipPath"
