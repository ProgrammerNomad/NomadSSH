# Go rebuild delivery status

> Historical delivery snapshot before the desktop UX refinement. Use [current release readiness](../RELEASE_READINESS.md) for current claims and remaining gates.

Updated 2026-10-30. Source: `desktop/`; branch: `codex/go-desktop-rebuild`.

Final local checks: 12 top-level Go tests passed (including the opt-in Windows keychain test), `go vet ./...` passed, TypeScript/Vite production build passed, and npm audit reported zero known vulnerabilities. Linux x64 and macOS ARM64 core test binaries cross-compiled after the final backend changes.

The latest executable is `desktop/build/NomadSSH-verified.exe`. The earlier preview remains open so the user’s active demo session is not interrupted. Subsequent `build.ps1` runs produce `desktop/build/NomadSSH.exe` after that preview is closed.

## Implemented and verified locally

- Windows native Wails executable, React UI and real Go bindings.
- OS workspace locks prevent duplicate instances from writing the same vault; locks release on close.
- Locking cancels terminal writers even when output backpressure fills the event queue.
- Vault create/unlock/lock, AES-256-GCM, Argon2id, wrong-password/tamper rejection, password rotation, encrypted persistence, redacted renderer state, backup and restore without private keys.
- Private-key generation/import; encrypted-key passphrase rejection and successful authentication; native Windows credential storage including multi-chunk updates and deletion.
- SSH shell input/output, Unicode bytes, resize, host-key rejection, local protocol sandbox, encrypted-key authentication through a password-authenticated jump host.
- SFTP binary upload/download, existing-file protection, rename/delete, recursive directories including empty directories, prefix-validated resume and refusal of corrupt prefixes.
- Local forwarding, remote forwarding and SOCKS5; byte-for-byte forwarding and listener release after stop.
- Windows ConPTY local shell input/output and cancellation.
- Drive configuration validation, local secret exclusion, missing-token error and locked-vault authorization guard.

The integration tests run against the bundled loopback server. OpenSSH compatibility across independent server implementations is still an acceptance gate. The UI has been inspected in the native Windows app; this is not an exhaustive accessibility or visual-regression test suite.

## Implemented, with further acceptance checks required

Profiles, grouping, search/pins/duplication, multiple tabs/two-pane split, snippet run/paste, key management screens, file-manager operations, pause/cancel/retry UI, history screen, idle lock, preferences, command palette and encrypted backup screens are wired to Go services. Remaining checks include transfer interruption timing, large/slow/unreliable networks, disk-full failures, concurrent shutdown, agent authentication against real OS agents, and full keyboard-only navigation.

Drive supports encrypted immutable revisions and explicit restore. Live OAuth, upload/download and automatic retry behavior require the user's Google Desktop OAuth registration. Two-device merging/deletion conflict handling is not implemented; separate snapshots preserve both devices' revisions.

## Platform evidence

| Target | Evidence | Outstanding |
| --- | --- | --- |
| Windows x64 | Frontend strict typecheck/build, Go tests/vet, native executable, UI inspection, ConPTY and actual credential-store test | Independent OpenSSH/agent interoperability; signed installer; race detector |
| Linux x64 | Core tests cross-compiled successfully; native CI workflow added | Execute native CI; GTK/WebKit UI, PTY, Secret Service, race and packaging checks |
| macOS ARM64 | Core tests cross-compiled successfully; app bundle recipe and native CI workflow added | Execute native CI; WebKit UI, PTY, Keychain, race, signing/notarization checks |
| Other desktop architectures | Portable Go/platform adapters | Native build and smoke-test matrix |

## Roadmap items not finished

- Full automatic bidirectional Drive synchronization, entity-level conflict resolution and deleted-item reconciliation.
- Saved terminal layouts, close-all UI, automatic reconnect, session recording/replay and explicit command execution history/export.
- Rich file manager: multi-select, drag/drop, sorting/search controls, symlink navigation and remote editor.
- Snippet CUSTOM/CLIPBOARD variables, expansion preview and recent executions.
- Auto-key selection, keyboard-interactive MFA, hardware security keys, agent forwarding, optional tunnel autostart/reconnect.
- Shell/working-directory chooser, cursor/light/custom themes, comprehensive context menus and OS-specific shortcut presentation.
- Safe migration from the old Electron storage/schema.
- Team sharing/roles/revocation, plugin marketplace/API, CLI companion, serial connections, broadcast scripting and optional cloud/password-manager/infrastructure adapters from the historical roadmap.
- Signed installers, automatic updates, third-party notices/license review, security review and full native OS acceptance testing.

The original Electron project has been preserved. This delivery is a functioning first Go desktop implementation; it does not claim completion of every historical requirement.
