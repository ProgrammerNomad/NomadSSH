#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
(cd frontend && npm ci && npm run format:check && npm test && npm run build)
go test ./internal/... -timeout 90s
go vet ./...
mkdir -p build
go build -trimpath -tags production -o build/NomadSSH .
if [[ "$(uname -s)" == Darwin ]]; then
  mkdir -p build/NomadSSH.app/Contents/MacOS
  cp build/NomadSSH build/NomadSSH.app/Contents/MacOS/NomadSSH
  cp packaging/Info.plist build/NomadSSH.app/Contents/Info.plist
fi
