# Release readiness

Updated 2026-10-30. Maintained source: `desktop/`. Version: `0.2.0-dev`.

This is a working development build. Production release approval remains pending the acceptance gates below; a polished interface or successful build alone does not complete them.

## Verification scope

The local suite exercises actual loopback SSH/SFTP connections, not just mocked network calls: vault authentication/persistence/tamper/password rotation, secret exclusion from backups, private-key import and jump-host authentication, changed-host rejection, terminal output and resize, local/remote/SOCKS forwarding, SFTP integrity and recursive/resumed transfers, local shell lifecycle, workspace locking and lock during output backpressure.

Windows secure-storage tests opt into a fresh disposable keychain namespace. Frontend regression tests cover connection sorting/filtering and keyboard actions, context actions, tree selection, save versus save-and-connect, and stale remote listing rejection. Static checks use strict TypeScript, Go vet and formatting. Native UI acceptance inspects the compiled Windows window.

Local verification for this revision:

| Check | Result |
| --- | --- |
| `npm test` | 6 frontend regression tests passed |
| Frontend strict TypeScript and Vite production build | Passed |
| Prettier check and Go formatting | Passed |
| `go test ./internal/... -v -count=1 -timeout 90s` with native keychain enabled | 12 top-level tests and 3 forwarding subtests passed |
| `go vet ./...` | Passed |
| Windows production-tag native build | Passed; `desktop/build/NomadSSH.exe` opened in isolated demo mode |
| Native UI | File menu → New connection, grouped form, SSH session, SFTP listing, independent remote filter and active-session exit cancellation verified |
| `npm audit --audit-level=high` | 0 reported vulnerabilities |
| `govulncheck v1.9.0 ./...` on Windows | 0 reachable or imported-package vulnerabilities; one unused-module advisory noted below |
| Linux amd64 and macOS ARM64 core test cross-compilation | Passed; binaries were not executed on those platforms |
| Archive preservation | All 43 relocated tracked files match their original Git content hashes |
| Current documentation local links | No broken links |

The Go scan reports [GO-2026-5932](https://pkg.go.dev/vuln/GO-2026-5932) for the unmaintained `golang.org/x/crypto/openpgp` packages. NomadSSH requires the crypto module for SSH/Argon2id but does not import the affected OpenPGP packages; the scan reports no affected imported packages or reachable symbols. This is not a blanket security guarantee. Repeat dependency checks for every release and native target.

The archived [earlier delivery record](history/GO_DELIVERY_STATUS.md) is historical and is not the status of this UI revision.

## Platform acceptance

| Target | Current evidence | Required before release |
| --- | --- | --- |
| Windows x64 | Native executable, Go protocol tests, actual credential-store test, ConPTY and native UI inspection | Independent OpenSSH/agent interoperability, network/disk stress, keyboard/accessibility review, installer/signature/update validation |
| Linux x64 | Core cross-compilation and a native CI job definition | Execute CI; interactive GTK/WebKit, PTY and Secret Service acceptance; race checks and packaging |
| macOS ARM64 | Core cross-compilation, `.app` recipe and a native CI job definition | Execute CI; interactive WebKit/PTY/Keychain acceptance; race checks, signing and notarization |
| macOS Intel and other architectures | Portable Go/platform adapters | Explicit native build and acceptance evidence |

The CI workflow has not been executed remotely during this local session. Cross-compiled core tests are not a native GUI validation. Windows race checks require a supported C toolchain, absent on this machine.

## Release gates

- [ ] Independent OpenSSH servers: password, encrypted keys, SSH agents, bastions, host-key changes and simultaneous prompts.
- [ ] Native Windows/macOS/Linux acceptance at minimum window sizes, display scaling, keyboard-only operation and screen-reader navigation.
- [ ] Sustained high-throughput terminal output, many sessions, unreliable networks, reconnect/cancellation races, interrupted transfers and disk-full behavior.
- [ ] Live Google OAuth, upload/download and two-device restore using the application's own registration. Credentials remain configurable as requested.
- [ ] Dependency vulnerability review, complete third-party license notices, independent security review and documented supported OS versions.
- [ ] Signed installers, macOS notarization, checksums/provenance, upgrade/uninstall checks and a verified update mechanism.

## Feature gaps retained from the original plan

The full [requirements record](history/GO_REBUILD_PLAN.md) remains available. These items are not silently considered complete:

- Automatic bidirectional Drive merging, deletion reconciliation and conflict resolution. Current behavior is immutable encrypted revision upload and explicit restore.
- Saved terminal/panel layouts, automatic reconnect, recording/replay, explicit command history and export.
- SFTP multi-select, drag/drop, symlink navigation and remote editing. Name filters, sorting and modification dates are now implemented.
- Snippet custom/clipboard variables, previews and recent execution records.
- Automatic key selection, keyboard-interactive MFA, hardware keys, agent forwarding and automatic tunnel reconnect/start.
- Local shell/working-directory choice, cursor and light/custom themes, full platform-specific shortcut presentation.
- Safe migration from the archived Electron database.
- Team vaults/roles/revocation, plugin API/marketplace, CLI, serial sessions, broadcast scripting and optional infrastructure/password-manager adapters.

The current desktop refinement includes native menus, close-all and active-work exit confirmation, a host tree/table/property/log workspace, collapsible panels, grouped connection forms and direct product copy. These are implemented UX improvements, not evidence that all roadmap or release gates have been completed.
