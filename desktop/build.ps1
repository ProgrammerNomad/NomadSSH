param([switch]$Run, [switch]$Demo)
$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
    $goCommand = Get-Command go -ErrorAction SilentlyContinue
    $goExe = if ($goCommand) { $goCommand.Source } else { Join-Path $env:LOCALAPPDATA 'NomadSSH/toolchains/go1.26.10/go/bin/go.exe' }
    if (-not (Test-Path -LiteralPath $goExe)) { throw 'Install Go 1.26 or later and put go on PATH.' }
    Push-Location frontend
    try {
        & npm.cmd ci
        if ($LASTEXITCODE) { throw 'Frontend dependency installation failed.' }
        & npm.cmd run format:check
        if ($LASTEXITCODE) { throw 'Frontend formatting failed.' }
        & npm.cmd test
        if ($LASTEXITCODE) { throw 'Frontend tests failed.' }
        & npm.cmd run build
        if ($LASTEXITCODE) { throw 'Frontend build failed.' }
    } finally { Pop-Location }
    & $goExe test ./internal/... -timeout 90s
    if ($LASTEXITCODE) { throw 'Backend tests failed.' }
    & $goExe vet ./...
    if ($LASTEXITCODE) { throw 'Go vet failed.' }
    New-Item -ItemType Directory -Force build | Out-Null
    & $goExe build -trimpath -tags production -ldflags '-H windowsgui' -o build/NomadSSH.exe .
    if ($LASTEXITCODE) { throw 'Native build failed. Close any running copy before rebuilding.' }
    if ($Run) {
        $launch = @{ FilePath = (Join-Path $PSScriptRoot 'build/NomadSSH.exe') }
        if ($Demo) { $launch.ArgumentList = '--demo' }
        Start-Process @launch
    }
} finally { Pop-Location }
