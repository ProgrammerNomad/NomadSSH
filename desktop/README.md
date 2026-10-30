# NomadSSH desktop

This directory is the maintained Go module. `main.go` owns the Wails application, `menu.go` defines native commands, `internal/core/` implements services and `frontend/` contains React/TypeScript and xterm.js. Frontend production assets are embedded in the native executable.

From the repository root, run `./build.ps1 -Run -Demo` on Windows or `bash build.sh` on macOS/Linux. The equivalent scripts in this directory can also be run directly.

See the [root README](../README.md), [architecture](../docs/ARCHITECTURE.md), [contribution checks](../CONTRIBUTING.md) and [release gates](../docs/RELEASE_READINESS.md). A Vite preview alone cannot exercise Go bindings; use the native executable for integration and visual checks.
