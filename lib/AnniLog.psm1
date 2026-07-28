# AnniLog -- Reusable PowerShell Logging Module
# Provides structured, levelled logging with dual output (console + file),
# full external-command capture, and optional session transcripts.
# No project-specific assumptions -- usable in any PowerShell 7+ project.
#
# Usage:
#   Import-Module "$PSScriptRoot\AnniLog.psm1"
#   Initialize-AnniLog -LogFilePath "C:\logs\myapp.log" -LogLevel "INFO" -EnableTranscript
#   Write-AnniLog -Level INFO -Message "Hello world"
#   Invoke-AnniCommand -Command "uv" -Arguments "run", "main.py"
#   Close-AnniLog

# ------- Module State ------- #

$script:AnniLogState = @{
    LogFilePath    = $null
    LogLevel       = "INFO"
    Stopwatch      = $null
    Initialised    = $false
    TranscriptPath = $null
    TranscriptOn   = $false
}

# Numeric priority for each log level (lower = more severe)
$script:LevelPriority = @{
    "ERROR"   = 0
    "WARNING" = 1
    "INFO"    = 2
    "SUCCESS" = 2
    "CMD"     = 2
    "DEBUG"   = 3
}

# Console colours for each log level
$script:LevelColour = @{
    "ERROR"   = "Red"
    "WARNING" = "Yellow"
    "INFO"    = "White"
    "SUCCESS" = "Green"
    "CMD"     = "DarkCyan"
    "DEBUG"   = "Cyan"
}

# ------- Private Helpers ------- #

function Write-AnniLogFileLine {
    # Appends one raw, timestamped line to the log file. Internal use only.
    param([string]$Text)

    if ($script:AnniLogState.LogFilePath) {
        $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        "$timestamp $Text" | Out-File -FilePath $script:AnniLogState.LogFilePath -Append -Encoding utf8
    }
}

# ------- Public Functions ------- #

function Initialize-AnniLog {
    <#
    .SYNOPSIS
        Initialises the logging session.
    .DESCRIPTION
        Sets the log file path, log level, and starts an optional stopwatch
        and/or full console transcript. Must be called before Write-AnniLog.
    .PARAMETER LogFilePath
        Full path to the log file. Parent directory is created if missing.
    .PARAMETER LogLevel
        Minimum level to output. Messages below this level are suppressed.
        Valid values: ERROR, WARNING, INFO, SUCCESS, CMD, DEBUG.
        Default: INFO.
    .PARAMETER EnableStopwatch
        If set, starts a stopwatch that can be referenced in Close-AnniLog.
    .PARAMETER EnableTranscript
        If set, starts a PowerShell transcript capturing EVERYTHING written
        to the console (including native command output that bypasses
        Write-AnniLog) into a sidecar file next to the log file:
        <name>-transcript.<ext>. Stopped automatically by Close-AnniLog.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$LogFilePath,

        [ValidateSet("ERROR", "WARNING", "INFO", "SUCCESS", "CMD", "DEBUG")]
        [string]$LogLevel = "INFO",

        [switch]$EnableStopwatch,

        [switch]$EnableTranscript
    )

    $logDir = Split-Path -Parent $LogFilePath
    if ($logDir -and -not (Test-Path $logDir)) {
        New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    }

    $script:AnniLogState.LogFilePath = $LogFilePath
    $script:AnniLogState.LogLevel    = $LogLevel
    $script:AnniLogState.Initialised = $true

    if ($EnableStopwatch) {
        $script:AnniLogState.Stopwatch = [System.Diagnostics.Stopwatch]::new()
        $script:AnniLogState.Stopwatch.Start()
    }

    # Write session header to log file
    $header = "--- Log session started at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ---"
    $header | Out-File -FilePath $LogFilePath -Append -Encoding utf8

    if ($EnableTranscript) {
        $dir  = Split-Path -Parent $LogFilePath
        $name = [System.IO.Path]::GetFileNameWithoutExtension($LogFilePath)
        $ext  = [System.IO.Path]::GetExtension($LogFilePath)
        if (-not $ext) { $ext = ".log" }
        $transcriptPath = if ($dir) { Join-Path $dir "$name-transcript$ext" } else { "$name-transcript$ext" }

        try {
            Start-Transcript -Path $transcriptPath -Append -UseMinimalHeader | Out-Null
            $script:AnniLogState.TranscriptPath = $transcriptPath
            $script:AnniLogState.TranscriptOn   = $true
            Write-AnniLog -Level DEBUG -Message "Transcript started: $transcriptPath"
        } catch {
            Write-AnniLog -Level WARNING -Message "Could not start transcript: $($_.Exception.Message)"
        }
    }
}

function Write-AnniLog {
    <#
    .SYNOPSIS
        Writes a log message at the specified level.
    .DESCRIPTION
        Outputs to both console (coloured) and log file (timestamped).
        Messages below the configured log level are suppressed.
    .PARAMETER Level
        Log level for this message.
    .PARAMETER Message
        The message text to log.
    #>
    [CmdletBinding()]
    param(
        [ValidateSet("ERROR", "WARNING", "INFO", "SUCCESS", "CMD", "DEBUG")]
        [string]$Level = "INFO",

        [Parameter(Mandatory = $true)]
        [string]$Message
    )

    if (-not $script:AnniLogState.Initialised) {
        Write-Warning "AnniLog: Write-AnniLog called before Initialize-AnniLog. Message discarded."
        return
    }

    # Check if this message's level is within the configured threshold
    $msgPriority = $script:LevelPriority[$Level]
    $cfgPriority = $script:LevelPriority[$script:AnniLogState.LogLevel]

    if ($msgPriority -gt $cfgPriority) {
        return
    }

    $consoleLine = "[$Level] $Message"

    # Console output with colour
    $colour = $script:LevelColour[$Level]
    if ($colour) {
        Write-Host $consoleLine -ForegroundColor $colour
    } else {
        Write-Host $consoleLine
    }

    # File output with timestamp
    Write-AnniLogFileLine "[$Level] $Message"
}

function Invoke-AnniCommand {
    <#
    .SYNOPSIS
        Runs an external command (or script block) with full output capture.
    .DESCRIPTION
        Executes the command, streams every line of stdout AND stderr live to
        the console exactly as you would see it, and writes each line to the
        log file tagged [CMD]. Logs the command line, exit code, and duration.
        Use this instead of calling externals directly in any script that
        should leave a reviewable trail (deploys, installers, migrations).
    .PARAMETER Command
        The executable to run (e.g. "uv", "npm", "ssh", "git").
    .PARAMETER Arguments
        Argument list passed to the executable.
    .PARAMETER ScriptBlock
        Alternative to Command/Arguments: a PowerShell script block whose
        merged output is captured the same way.
    .PARAMETER Description
        Optional friendly label logged instead of the raw command line.
    .PARAMETER Quiet
        Suppress live console echo of output lines (they are still logged).
    .PARAMETER AllowFail
        Log a non-zero exit as WARNING instead of ERROR (for commands where
        failure is expected/handled by the caller).
    .OUTPUTS
        PSCustomObject with Command, ExitCode, Success, Duration, Output
        (all captured lines as a string array).
    .EXAMPLE
        $r = Invoke-AnniCommand -Command "uv" -Arguments "run", "main.py"
        if (-not $r.Success) { Write-AnniLog -Level ERROR -Message "uv failed" }
    .EXAMPLE
        Invoke-AnniCommand -ScriptBlock { npm install --omit=dev } -Description "npm install"
    #>
    [CmdletBinding(DefaultParameterSetName = 'Native')]
    param(
        [Parameter(Mandatory = $true, Position = 0, ParameterSetName = 'Native')]
        [string]$Command,

        [Parameter(Position = 1, ParameterSetName = 'Native')]
        [string[]]$Arguments = @(),

        [Parameter(Mandatory = $true, ParameterSetName = 'Script')]
        [scriptblock]$ScriptBlock,

        [string]$Description,

        [switch]$Quiet,

        [switch]$AllowFail
    )

    if (-not $script:AnniLogState.Initialised) {
        Write-Warning "AnniLog: Invoke-AnniCommand called before Initialize-AnniLog. Output will NOT be logged."
    }

    $label = if ($Description) { $Description }
             elseif ($PSCmdlet.ParameterSetName -eq 'Native') { "$Command $($Arguments -join ' ')".Trim() }
             else { $ScriptBlock.ToString().Trim() }

    Write-AnniLog -Level CMD -Message "> $label"

    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    $exitCode  = 0
    $captured  = [System.Collections.Generic.List[string]]::new()

    # Each pipeline object may be a string (stdout) or an ErrorRecord (stderr
    # merged via 2>&1). Both are echoed verbatim, logged tagged [CMD], and
    # collected into the result's Output property.
    $handleLine = {
        param($item)
        $line = if ($item -is [System.Management.Automation.ErrorRecord]) { $item.ToString() } else { [string]$item }
        if (-not $Quiet) { Write-Host $line }
        Write-AnniLogFileLine "[CMD]   $line"
        $captured.Add($line)
    }

    # Reset so a stale exit code from a previous command can't leak into the
    # result when this command never sets one (e.g. command not found).
    $global:LASTEXITCODE = 0

    try {
        if ($PSCmdlet.ParameterSetName -eq 'Native') {
            & $Command @Arguments 2>&1 | ForEach-Object { & $handleLine $_ }
        } else {
            & $ScriptBlock 2>&1 | ForEach-Object { & $handleLine $_ }
        }
        $exitCode = if ($null -ne $LASTEXITCODE) { $LASTEXITCODE } else { 0 }
    } catch {
        # Command not found, or a terminating error inside the script block
        & $handleLine $_
        $exitCode = if ($LASTEXITCODE) { $LASTEXITCODE } else { 1 }
    }

    $stopwatch.Stop()
    $duration = $stopwatch.Elapsed
    $summary  = "exit $exitCode in {0:mm\:ss\.fff}" -f $duration

    if ($exitCode -eq 0) {
        Write-AnniLog -Level CMD -Message "< $summary"
    } elseif ($AllowFail) {
        Write-AnniLog -Level WARNING -Message "< $label -- $summary"
    } else {
        Write-AnniLog -Level ERROR -Message "< $label -- $summary"
    }

    [PSCustomObject]@{
        Command  = $label
        ExitCode = $exitCode
        Success  = ($exitCode -eq 0)
        Duration = $duration
        Output   = $captured.ToArray()
    }
}

function Close-AnniLog {
    <#
    .SYNOPSIS
        Closes the logging session.
    .DESCRIPTION
        Stops the stopwatch (if running), writes elapsed time to log, stops
        the transcript (if running), and writes a session footer. Call this
        at the end of your script.
    #>
    [CmdletBinding()]
    param()

    if (-not $script:AnniLogState.Initialised) {
        return
    }

    $elapsed = $null
    if ($script:AnniLogState.Stopwatch) {
        $script:AnniLogState.Stopwatch.Stop()
        $elapsed = $script:AnniLogState.Stopwatch.Elapsed
        Write-AnniLog -Level INFO -Message ("Total elapsed time: {0:hh\:mm\:ss\.fff}" -f $elapsed)
    }

    if ($script:AnniLogState.TranscriptOn) {
        try {
            Stop-Transcript | Out-Null
        } catch {
            # Transcript already stopped externally -- nothing to do
        }
    }

    $footer = "--- Log session ended at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ---"
    if ($script:AnniLogState.LogFilePath) {
        $footer | Out-File -FilePath $script:AnniLogState.LogFilePath -Append -Encoding utf8
    }

    # Reset state
    $script:AnniLogState.LogFilePath    = $null
    $script:AnniLogState.LogLevel       = "INFO"
    $script:AnniLogState.Stopwatch      = $null
    $script:AnniLogState.Initialised    = $false
    $script:AnniLogState.TranscriptPath = $null
    $script:AnniLogState.TranscriptOn   = $false
}

# ------- Module Exports ------- #

Export-ModuleMember -Function Initialize-AnniLog, Write-AnniLog, Invoke-AnniCommand, Close-AnniLog
