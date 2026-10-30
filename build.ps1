param([switch]$Run, [switch]$Demo)
$ErrorActionPreference = 'Stop'
& (Join-Path $PSScriptRoot 'desktop/build.ps1') -Run:$Run -Demo:$Demo
