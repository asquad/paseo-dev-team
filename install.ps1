# Installs or updates paseo-dev-team on Windows. Options: .\install.ps1 --help
$ErrorActionPreference = 'Stop'
$installer = Join-Path $PSScriptRoot 'scripts\install.mjs'

if ($env:PASEO_DEV_TEAM_NODE) {
    & $env:PASEO_DEV_TEAM_NODE $installer @args
    exit $LASTEXITCODE
}

$node = Get-Command node -ErrorAction SilentlyContinue
if ($node) {
    & $node.Source $installer @args
    exit $LASTEXITCODE
}

$candidates = @(
    (Join-Path $env:ProgramFiles 'Paseo\Paseo.exe'),
    (Join-Path $env:LOCALAPPDATA 'Programs\Paseo\Paseo.exe')
)
foreach ($app in $candidates) {
    if (Test-Path $app) {
        $env:ELECTRON_RUN_AS_NODE = '1'
        try {
            & $app $installer @args
            exit $LASTEXITCODE
        } finally {
            Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
        }
    }
}

Write-Error 'Node.js was not found and no Paseo app runtime was detected. Install Node.js 18+ or set PASEO_DEV_TEAM_NODE to a node executable.'
exit 1
