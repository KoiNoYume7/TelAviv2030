@{
    RootModule        = 'AnniLog.psm1'
    ModuleVersion     = '2.0.0'
    GUID              = '51043702-67e4-4abe-8567-49efe5f52f51'
    Author            = 'KoiNoYume7'
    Description       = 'Reusable structured logging module with levelled console/file output, full external-command capture, and session transcripts.'
    PowerShellVersion = '7.0'
    FunctionsToExport = @(
        'Initialize-AnniLog',
        'Write-AnniLog',
        'Invoke-AnniCommand',
        'Close-AnniLog'
    )
    CmdletsToExport   = @()
    VariablesToExport  = @()
    AliasesToExport    = @()
}
