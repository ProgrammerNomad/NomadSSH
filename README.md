# NomadSSH

A desktop SSH client built in Go for Windows, macOS and Linux, with a Wails interface using React, TypeScript and xterm.js.

Manage saved connections, work in SSH and local terminal tabs, transfer files over SFTP, and forward ports from one desktop workspace. Private keys stay in the operating system's secure store.

**Status: 0.2.0 development build.** Windows has been built and tested locally. Native macOS/Linux acceptance, live Google OAuth, release signing and several roadmap features remain outstanding. See [release readiness](docs/RELEASE_READINESS.md) for evidence and limits.

## Workspace

- Grouped host tree, searchable and sortable connection table, connection properties and event log.
- Native application menus, compact toolbars, keyboard shortcuts, context actions and collapsible panels.
- Password, private-key and SSH-agent authentication; jump hosts and host-fingerprint verification.
- Independent terminal tabs, two-pane terminal view, Windows ConPTY and Unix PTY adapters.
- Two-pane SFTP with filters, sorting, file metadata, recursive transfers, progress, pause/cancel and verified resume.
- Local, remote and SOCKS5 forwarding; saved snippets; key generation and import.
- Encrypted workspace, idle locking, encrypted backup/restore and configurable Google Drive snapshots.

Google Drive currently stores separate encrypted revisions with explicit restore. It does not merge changes between devices. Private keys and OAuth credentials are excluded from snapshots; re-import keys on a new device.

## Build and run

Requirements: Go 1.26+, Node.js 24 and npm. Dependencies are pinned in the Go module and frontend lockfile.

| Platform | Native dependencies | Build |
| --- | --- | --- |
| Windows | WebView2 runtime | `./build.ps1 -Run` |
| macOS | Xcode command line tools | `bash build.sh` |
| Linux | GTK 4, WebKitGTK 6, desktop Secret Service | `bash build.sh` |

On Ubuntu 24.04, the build packages are `libgtk-4-dev` and `libwebkitgtk-6.0-dev`. Secure storage must be available and unlocked; there is no plaintext key-storage fallback.

```powershell
# Windows: build, check and open a separate local demonstration
./build.ps1 -Run -Demo

# Run the already-built application with your real workspace
./desktop/build/NomadSSH.exe
```

The demo starts a real loopback SSH/SFTP test server with generated credentials and isolated temporary data. It does not connect to a production server. See the [user guide](docs/USER_GUIDE.md) for demo commands, workspace locations, backups and Drive configuration.

Builds produce `desktop/build/NomadSSH.exe` on Windows, `desktop/build/NomadSSH` on Unix, and an unsigned `.app` bundle on macOS. Close the executable being rebuilt first. These are development artifacts, not signed installers.

## Documentation

- [User guide](docs/USER_GUIDE.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Desktop design research and decisions](docs/UI_DESIGN_REVIEW.md)
- [Release readiness and remaining features](docs/RELEASE_READINESS.md)
- [Contributing and verification](CONTRIBUTING.md)
- [Security and credential handling](SECURITY.md)
- [REA setup evidence](docs/REA_VERIFICATION.md)

## Repository

```text
desktop/          Maintained Go desktop application and React interface
docs/             Current product, architecture and release documentation
docs/history/     Original requirements and earlier delivery records
legacy/electron/  Preserved Electron baseline; excluded from current builds
.github/          Native Windows, macOS and Linux CI workflow
```

No automatic import from the old Electron storage is implemented. The baseline and its original README remain in `legacy/electron/` for future migration work.

Licensed under [MIT](LICENSE). Dependency licenses remain applicable.
