function Initialize-AnniLog {
    param(
        [string]$LogFilePath,
        [switch]$EnableStopwatch
    )
    
    $script:LogFilePath = $LogFilePath
    $script:EnableStopwatch = $EnableStopwatch
    
    if ($EnableStopwatch) {
        $script:Stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    }
    
    # Create logs directory if it doesn't exist
    $logDir = Split-Path -Parent $LogFilePath
    if (-not (Test-Path $logDir)) {
        New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    }
    
    Write-Log "INFO" "AnniLog initialized"
}

function Write-Log {
    param(
        [string]$Level,
        [string]$Message
    )
    
    if (-not $script:LogFilePath) {
        Write-Host "[$Level] $Message"
        return
    }
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $elapsedTime = ""
    
    if ($script:EnableStopwatch -and $script:Stopwatch) {
        $elapsedTime = " [$($script:Stopwatch.Elapsed.ToString('hh\:mm\:ss\.fff'))]"
    }
    
    $logEntry = "[$timestamp]$elapsedTime [$Level] $Message"
    
    # Write to console with colors
    switch ($Level) {
        "INFO" { Write-Host $logEntry -ForegroundColor Cyan }
        "SUCCESS" { Write-Host $logEntry -ForegroundColor Green }
        "WARNING" { Write-Host $logEntry -ForegroundColor Yellow }
        "ERROR" { Write-Host $logEntry -ForegroundColor Red }
        default { Write-Host $logEntry }
    }
    
    # Write to file
    Add-Content -Path $script:LogFilePath -Value $logEntry
}

function Write-Success {
    param([string]$Message)
    Write-Log "SUCCESS" $Message
}

function Write-Warning {
    param([string]$Message)
    Write-Log "WARNING" $Message
}

function Write-ErrorLog {
    param([string]$Message)
    Write-Log "ERROR" $Message
}

function Stop-AnniLog {
    if ($script:Stopwatch) {
        $script:Stopwatch.Stop()
    }
    Write-Log "INFO" "AnniLog stopped"
}

Export-ModuleMember -Function Initialize-AnniLog, Write-Log, Write-Success, Write-Warning, Write-ErrorLog, Stop-AnniLog