param(
    [string]$PiHost = "yme-04",
    [string]$PiUser = "akira",
    [switch]$SkipInstall = $false,
    [switch]$SkipNginx = $false
)

# Import AnniLog
Import-Module "$PSScriptRoot\lib\AnniLog.psd1" -Force
$logPath = "$PSScriptRoot\logs\deploy-$(Get-Date -Format 'yyyy-MM-dd_HHmmss').log"
$logDir = Split-Path -Parent $logPath
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}
Initialize-AnniLog -LogFilePath $logPath -EnableStopwatch

Write-Log "INFO" "TelAviv2030 Deployment"
Write-Log "INFO" "Target: ${PiUser}@${PiHost}"
Write-Log "INFO" "SkipInstall: $SkipInstall | SkipNginx: $SkipNginx"

# Configuration
$PiDir     = "/opt/anni/telaviv"
$StorageDir = "/srv/storage/TelAviv2030"
$ServiceName = "telaviv"
$Port      = "4300"

# ── Test SSH ──────────────────────────────────────────────────────────
Write-Log "INFO" "Testing SSH connection..."
$testResult = & ssh -o ConnectTimeout=5 -o BatchMode=yes "${PiUser}@${PiHost}" "echo ok" 2>&1
if ($LASTEXITCODE -ne 0) { Write-ErrorLog "SSH connection failed"; exit 1 }
Write-Success "SSH OK"

# ── Step 1: Build client ──────────────────────────────────────────────
Write-Log "INFO" "Building client..."
Push-Location "$PSScriptRoot\client"
if (-not $SkipInstall) {
    npm install
    if ($LASTEXITCODE -ne 0) { Write-ErrorLog "Client npm install failed"; Pop-Location; exit 1 }
}
npm run build
if ($LASTEXITCODE -ne 0) { Write-ErrorLog "Client build failed"; Pop-Location; exit 1 }
Pop-Location
Write-Success "Client built -> dist/"

# ── Step 2: Prepare Pi directories ────────────────────────────────────
Write-Log "INFO" "Ensuring Pi directories exist..."
& ssh "${PiUser}@${PiHost}" "sudo mkdir -p ${PiDir} ${StorageDir} && sudo chown ${PiUser}:${PiUser} ${PiDir}"
Write-Success "Directories ready"

# ── Step 3: Copy files to tmp ─────────────────────────────────────────
Write-Log "INFO" "Copying files to /tmp on Pi..."
& ssh "${PiUser}@${PiHost}" "rm -rf /tmp/telaviv-deploy && mkdir -p /tmp/telaviv-deploy"

# Built client files (dist/*  -> flat into deploy dir)
& scp -r "$PSScriptRoot\dist\." "${PiUser}@${PiHost}:/tmp/telaviv-deploy/"

# Server source files (everything except node_modules and .env)
& scp "$PSScriptRoot\server\server.js"   "${PiUser}@${PiHost}:/tmp/telaviv-deploy/"
& scp "$PSScriptRoot\server\package.json" "${PiUser}@${PiHost}:/tmp/telaviv-deploy/"
& scp -r "$PSScriptRoot\server\db"       "${PiUser}@${PiHost}:/tmp/telaviv-deploy/"
& scp -r "$PSScriptRoot\server\routes"   "${PiUser}@${PiHost}:/tmp/telaviv-deploy/"

# Service file
& scp "$PSScriptRoot\server\telaviv.service" "${PiUser}@${PiHost}:/tmp/telaviv-deploy/"

Write-Success "Files copied to /tmp/telaviv-deploy"

# ── Step 4: Move to final destination (preserve .env + node_modules) ──
Write-Log "INFO" "Deploying to ${PiDir}..."
$moveCmd = @"
  # Preserve .env and node_modules (backup .env just in case)
  if [ -f ${PiDir}/.env ]; then cp ${PiDir}/.env /tmp/telaviv-env-backup; fi

  # Remove everything EXCEPT .env and node_modules
  find ${PiDir} -mindepth 1 -maxdepth 1 \
    ! -name '.env' ! -name 'node_modules' ! -name 'package-lock.json' \
    -exec rm -rf {} +

  # Move new files in
  cp -r /tmp/telaviv-deploy/. ${PiDir}/
  rm -rf /tmp/telaviv-deploy

  echo "Deploy copy done"
"@
& ssh "${PiUser}@${PiHost}" $moveCmd
Write-Success "Files deployed"

# ── Step 5: npm install on Pi (for native modules like better-sqlite3) ─
Write-Log "INFO" "Running npm install on Pi..."
& ssh "${PiUser}@${PiHost}" "cd ${PiDir} && npm install --omit=dev 2>&1 | tail -5"
if ($LASTEXITCODE -ne 0) { Write-ErrorLog "npm install on Pi failed"; exit 1 }
Write-Success "npm install complete"

# ── Step 6: Permissions ────────────────────────────────────────────────
Write-Log "INFO" "Setting ownership (akira — matches NTFS storage mount)..."
& ssh "${PiUser}@${PiHost}" "sudo chown -R ${PiUser}:${PiUser} ${PiDir} && chmod 600 ${PiDir}/.env"
Write-Success "Permissions set"

# ── Step 7: Install / reload systemd service ──────────────────────────
Write-Log "INFO" "Installing systemd service..."
& ssh "${PiUser}@${PiHost}" "sudo cp ${PiDir}/telaviv.service /etc/systemd/system/${ServiceName}.service && sudo systemctl daemon-reload && sudo systemctl enable ${ServiceName}"
Write-Success "Systemd service installed"

# ── Step 8: Configure nginx (optional) ────────────────────────────────
if (-not $SkipNginx) {
    Write-Log "INFO" "Configuring nginx..."
    & scp "$PSScriptRoot\nginx\telaviv.conf" "${PiUser}@${PiHost}:/tmp/telaviv.conf"
    & ssh "${PiUser}@${PiHost}" "sudo mv /tmp/telaviv.conf /etc/nginx/sites-available/telaviv.yumehana.dev && sudo ln -sf /etc/nginx/sites-available/telaviv.yumehana.dev /etc/nginx/sites-enabled/telaviv.yumehana.dev && sudo nginx -t"
    if ($LASTEXITCODE -eq 0) {
        & ssh "${PiUser}@${PiHost}" "sudo systemctl reload nginx"
        Write-Success "Nginx configured"
    } else {
        Write-ErrorLog "Nginx config test failed — skipping reload"
    }
} else {
    Write-Log "INFO" "Skipping nginx config (SkipNginx flag set)"
}

# ── Step 9: Restart service ────────────────────────────────────────────
Write-Log "INFO" "Restarting ${ServiceName}..."
& ssh "${PiUser}@${PiHost}" "sudo systemctl restart ${ServiceName} && sleep 2 && systemctl is-active ${ServiceName}"
Write-Success "Service restarted"

# ── Step 10: Smoke test ────────────────────────────────────────────────
Write-Log "INFO" "Smoke test..."
& ssh "${PiUser}@${PiHost}" "curl -sf http://localhost:${Port}/api/health"
if ($LASTEXITCODE -eq 0) {
    Write-Success "Health check passed — http://localhost:${Port}/api/health"
} else {
    Write-ErrorLog "Health check failed — check: journalctl -u ${ServiceName} -n 20"
}

Write-Success "Deployment complete!"
Write-Log "INFO" "Live at: https://telaviv.yumehana.dev (once Cloudflare tunnel is configured)"

Stop-AnniLog
