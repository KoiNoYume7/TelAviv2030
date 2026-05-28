@{
    RootModule = 'AnniLog.psm1'
    ModuleVersion = '1.0.0'
    GUID = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'
    Author = 'Anni Ecosystem'
    Description = 'Logging module for Anni projects'
    FunctionsToExport = @('Initialize-AnniLog', 'Write-Log', 'Write-Success', 'Write-Warning', 'Write-ErrorLog', 'Stop-AnniLog')
    PrivateData = @{
        PSData = @{
            Tags = @('Logging', 'Anni')
        }
    }
}