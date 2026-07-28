# TelAviv2030 deploy script
# Builds the client, packs server + client, uploads to the Pi, and restarts the service.

param(
    [string]$PiHost     = "yme-04",
    [string]$PiUser     = "akira",
    [switch]$SkipInstall = $false,
    [switch]$SkipNginx   = $false
)

$ErrorActionPreference = "Stop"

# ── AnniLog ──
Import-Module "$PSScriptRoot\lib\AnniLog.psd1" -Force

$logPath = "$PSScriptRoot\logs\deploy-$(Get-Date -Format 'yyyy-MM-dd_HHmmss').log"
Initialize-AnniLog -LogFilePath $logPath -EnableStopwatch -EnableTranscript

Write-AnniLog -Level INFO -Message "Deploying TelAviv2030 to ${PiUser}@${PiHost}"

# ── Config ──
$PiDir       = "/opt/anni/telaviv"
$StorageDir  = "/srv/storage/TelAviv2030"
$ServiceName = "telaviv"
$Port        = "4300"

# ── Build client ──
Write-AnniLog -Level INFO -Message "Building client..."
Push-Location "$PSScriptRoot\client"
$r = Invoke-AnniCommand -Command "npm" -Arguments "install" -Description "client npm install"
if (-not $r.Success) { Write-AnniLog -Level ERROR -Message "Client npm install failed"; Close-AnniLog; exit 1 }

$r = Invoke-AnniCommand -Command "npm" -Arguments "run", "build" -Description "client build"
if (-not $r.Success) { Write-AnniLog -Level ERROR -Message "Client build failed"; Close-AnniLog; exit 1 }
Pop-Location
Write-AnniLog -Level SUCCESS -Message "Client built -> ../dist"

# ── Test SSH ──
Write-AnniLog -Level INFO -Message "Testing SSH..."
$sshOpts = @("-o", "ConnectTimeout=10", "-o", "BatchMode=yes")
$r = Invoke-AnniCommand -Command "ssh" -Arguments ($sshOpts + @("${PiUser}@${PiHost}", "echo ok")) -Description "ssh connectivity test"
if (-not $r.Success) { Write-AnniLog -Level ERROR -Message "SSH connection failed"; Close-AnniLog; exit 1 }

# ── Deploy to Pi ──
Write-AnniLog -Level INFO -Message "Deploying files to ${PiDir}..."

# Ensure remote dirs exist
Invoke-AnniCommand -Command "ssh" -Arguments ($sshOpts + @("${PiUser}@${PiHost}", "sudo mkdir -p ${PiDir} ${StorageDir} && sudo chown ${PiUser}:${PiUser} ${PiDir}")) -Description "prepare Pi directories" | Out-Null

# Pack client build
$clientTar = [System.IO.Path]::GetTempPath() + "telaviv-client.tar.gz"
Push-Location "$PSScriptRoot\dist"
Invoke-AnniCommand -Command "tar" -Arguments "-czf", $clientTar, "." -Description "pack client dist"
Pop-Location

# Pack server source
$serverTar = [System.IO.Path]::GetTempPath() + "telaviv-server.tar.gz"
Push-Location "$PSScriptRoot\server"
Invoke-AnniCommand -Command "tar" -Arguments "-czf", $serverTar, "server.js", "package.json", "db", "middleware", "lib" -Description "pack server source"
Pop-Location

# Upload and extract
Invoke-AnniCommand -Command "ssh" -Arguments ($sshOpts + @("${PiUser}@${PiHost}", "rm -rf /tmp/telaviv-deploy-* && mkdir -p /tmp/telaviv-deploy-server /tmp/telaviv-deploy-client")) -Description "clean remote tmp" | Out-Null
Invoke-AnniCommand -Command "scp" -Arguments ($sshOpts + @($clientTar, "${PiUser}@${PiHost}:/tmp/telaviv-client.tar.gz")) -Description "upload client bundle"
Invoke-AnniCommand -Command "scp" -Arguments ($sshOpts + @($serverTar, "${PiUser}@${PiHost}:/tmp/telaviv-server.tar.gz")) -Description "upload server bundle"
Invoke-AnniCommand -Command "scp" -Arguments ($sshOpts + @("$PSScriptRoot\TelAviv2030.service", "${PiUser}@${PiHost}:/tmp/telaviv.service")) -Description "upload systemd service"

$extractCmd = @"
  mkdir -p /tmp/telaviv-deploy-server /tmp/telaviv-deploy-client
  tar -xzf /tmp/telaviv-client.tar.gz -C /tmp/telaviv-deploy-client && rm /tmp/telaviv-client.tar.gz
  tar -xzf /tmp/telaviv-server.tar.gz -C /tmp/telaviv-deploy-server && rm /tmp/telaviv-server.tar.gz
  if [ -f ${PiDir}/.env ]; then cp ${PiDir}/.env /tmp/telaviv-env-backup; fi
  find ${PiDir} -mindepth 1 -maxdepth 1 ! -name '.env' ! -name 'node_modules' ! -name 'package-lock.json' -exec rm -rf {} +
  cp -r /tmp/telaviv-deploy-server/. ${PiDir}/
  mkdir -p ${PiDir}/public
  cp -r /tmp/telaviv-deploy-client/. ${PiDir}/public/
  rm -rf /tmp/telaviv-deploy-server /tmp/telaviv-deploy-client
"@
Invoke-AnniCommand -Command "ssh" -Arguments ($sshOpts + @("${PiUser}@${PiHost}", $extractCmd)) -Description "extract deploy bundle" | Out-Null

Remove-Item $clientTar, $serverTar -ErrorAction SilentlyContinue

# ── npm install on Pi ──
if (-not $SkipInstall) {
    Write-AnniLog -Level INFO -Message "Running npm install on Pi..."
    $r = Invoke-AnniCommand -Command "ssh" -Arguments ($sshOpts + @("${PiUser}@${PiHost}", "cd ${PiDir} && npm install --omit=dev 2>&1 | tail -5")) -Description "npm install on Pi"
    if (-not $r.Success) { Write-AnniLog -Level ERROR -Message "npm install on Pi failed"; Close-AnniLog; exit 1 }
}

# ── Service + nginx ──
Invoke-AnniCommand -Command "ssh" -Arguments ($sshOpts + @("${PiUser}@${PiHost}", "sudo mv /tmp/telaviv.service /etc/systemd/system/${ServiceName}.service && sudo systemctl daemon-reload && sudo systemctl enable ${ServiceName}")) -Description "install systemd service" | Out-Null

if (-not $SkipNginx) {
    Invoke-AnniCommand -Command "scp" -Arguments ($sshOpts + @("$PSScriptRoot\nginx\telaviv.conf", "${PiUser}@${PiHost}:/tmp/telaviv.conf")) -Description "upload nginx config"
    $nginxCmd = "sudo mv /tmp/telaviv.conf /etc/nginx/sites-available/telaviv.yumehana.dev && sudo ln -sf /etc/nginx/sites-available/telaviv.yumehana.dev /etc/nginx/sites-enabled/telaviv.yumehana.dev && sudo nginx -t"
    $r = Invoke-AnniCommand -Command "ssh" -Arguments ($sshOpts + @("${PiUser}@${PiHost}", $nginxCmd)) -Description "install nginx config"
    if ($r.Success) {
        Invoke-AnniCommand -Command "ssh" -Arguments ($sshOpts + @("${PiUser}@${PiHost}", "sudo systemctl reload nginx")) -Description "reload nginx" | Out-Null
    } else {
        Write-AnniLog -Level WARNING -Message "nginx config test failed; skipping reload"
    }
}

# ── Restart + smoke test ──
Write-AnniLog -Level INFO -Message "Restarting ${ServiceName}..."
Invoke-AnniCommand -Command "ssh" -Arguments ($sshOpts + @("${PiUser}@${PiHost}", "sudo systemctl restart ${ServiceName} && sleep 2 && systemctl is-active ${ServiceName}")) -Description "restart service" | Out-Null

$r = Invoke-AnniCommand -Command "ssh" -Arguments ($sshOpts + @("${PiUser}@${PiHost}", "curl -sf http://localhost:${Port}/api/health")) -Description "health check"
if ($r.Success) {
    Write-AnniLog -Level SUCCESS -Message "Health check passed"
} else {
    Write-AnniLog -Level ERROR -Message "Health check failed; check: journalctl -u ${ServiceName} -n 20"
    Close-AnniLog
    exit 1
}

Write-AnniLog -Level SUCCESS -Message "Deployment complete"
Close-AnniLog
