# TelAviv2030 mobile build helper
# Builds the web client, syncs to Android, and opens Android Studio.
# Requires: Node.js, Java JDK, Android SDK / Android Studio.

param(
    [string]$ApiBase = "https://telaviv.yumehana.dev/api"
)

$ErrorActionPreference = "Stop"

# Ensure .env for the mobile build
$envPath = "$PSScriptRoot\client\.env"
Set-Content -Path $envPath -Value "VITE_API_BASE=$ApiBase`nVITE_APP_VERSION=0.1.0" -Force

Push-Location "$PSScriptRoot\client"

Write-Host "Installing client dependencies..."
npm install

Write-Host "Building web assets for mobile..."
npm run build

if (-not (Test-Path "$PSScriptRoot\client\android")) {
    Write-Host "Adding Android platform..."
    npx cap add android
}

Write-Host "Syncing web assets to Android..."
npx cap sync android

Write-Host "Opening Android Studio..."
npx cap open android

Pop-Location
