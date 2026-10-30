# NomadSSH Go rebuild

> Historical requirements and initial design record. Current implementation architecture, visual direction and release evidence are in the [documentation index](../README.md). Source paths and setup instructions below describe the original review.

Reviewed: 2026-10-30. This is a requirements and architecture record, not a claim that the rebuild is complete.

## Confirmed decisions

- Go services with Wails, React/TypeScript, and xterm.js.
- Windows, macOS, and Linux desktops. Mobile is outside the agreed target.
- Private keys remain local, in OS secure storage. A new device restores encrypted metadata and prompts to re-import its missing keys.
- Preserve the Cyber Blue/Zinc Dark visual identity and the planned power-user workflows.
- REA setup and the required system Node.js 24.x update were explicitly approved after presenting the dry-run plan.

## Sources reviewed

- Current README.md, package.json, CONTRIBUTING.md (empty), type definitions, application wiring, SSH/session services, storage, Electron IPC, and preload.
- Historical TODO.md, UI-TASKS.md, and COLOR_MIGRATION.md from commit `34b02fb`; these were subsequently deleted in `bc4adf1`.
- Current source takes precedence when describing implementation status. Historical checked boxes often describe UI prototypes, not functioning services, and several of those components are absent at HEAD.
- Historical documents contain contradictory Tabby integration instructions and partially merged sections. The new architecture uses independent Go implementations; no dependency on Tabby's application architecture is required.

## Existing implementation and baseline

At baseline commit `1cee9b3`, the working tree was clean.

| Area | Observed state |
| --- | --- |
| Profiles/categories/dashboard | React implementation with browser localStorage persistence |
| SSH interactive shell | ssh2 connection, remote PTY, input/output and resizing code present; live interoperability not yet verified in this review |
| Multiple terminal tabs | Implemented in UI and session manager, with lifecycle defects |
| Private-key authentication | Backend expects file-based key records; UI imports key contents and passes an empty key list to connect |
| Known hosts | Fingerprint verification and settings exist; backend file storage and renderer localStorage diverge |
| Encryption/lock | Not implemented; passwords, imported private keys, and passphrases can be saved in plaintext localStorage |
| SFTP | Types and dependency present; no current service or full file-manager implementation |
| Tunnels/snippets | Types and storage methods present; no complete current operational workflows |
| Drive sync | Documented plan; implementation absent |
| Local terminal/split panes/replay | Planned; current implementation absent |
| Distribution | No verified Windows/macOS/Linux release matrix |

Checks performed:

- `npm run build`: passes, with Vite warnings about Node fs/path imports in renderer code and bundle size.
- `tsc --noEmit -p tsconfig.json`: fails with 21 diagnostics, including stale bridge types, a missing knownHostsService reference, SVG typing, and unused declarations.
- No live remote-server test was performed. A build success is not proof of working authentication or session cleanup.

Defects to avoid carrying into the rewrite:

1. `src/App.tsx` saves profiles and imported key material in localStorage.
2. `connectSSHWithTab` calls `connect(profile, [])`, preventing the imported key list from reaching the backend.
3. UI and service SSHKey records have incompatible content-versus-path schemas.
4. Closing a tab disposes its terminal but does not call the backend disconnect API or retain/dispose all event subscriptions.
5. A single global currentVerificationId cannot safely represent simultaneous host-key prompts.
6. Output subscriptions are installed after connecting; early output can be missed.
7. Host-key state must have a single backend owner. The renderer must not import filesystem services.

## Feature checklist for the rebuild

All rows remain requirements until tested; a visible screen alone does not complete a feature.

| Group | Required behavior | Acceptance evidence |
| --- | --- | --- |
| Profiles | Create/edit/delete/duplicate, quick connect, search, tags, pins, recent connections, icons, flat optional host groups | Persistence/restart and schema migration tests |
| Keys | Import and generate Ed25519/RSA/ECDSA keys, SHA256 fingerprints, passphrases, flat security-context groups, grouped selection, explicit auto-key mode | Key parsing, encrypted-key authentication, missing-key and wrong-passphrase tests |
| SSH | Password/key/agent auth, interactive shell, exec, timeout, keepalive, cancellation, reconnect, host-key verification | Local test SSH server plus supported OpenSSH interoperability |
| Sessions | Independent tabs, same profile in multiple sessions, resize, close/close-all, saved layouts, split panes | Isolation, initial-output preservation, cleanup and race tests |
| Host trust | Unknown-key prompt, changed-key warning/rejection, known-host management, simultaneous prompt handling | First-use, match, mismatch, cancellation and timeout cases |
| SFTP | Local/remote panes, breadcrumbs, sorting/search, symlinks, mkdir/rename/delete/chmod, multi-select and drag/drop | Temporary local/remote file trees and permission/error cases |
| Transfers | Upload/download including directories, bounded concurrency, progress/speed/ETA, pause/resume/cancel/retry | Byte-for-byte verification, interruption/resume and disk-full handling |
| Tunnels | Local/remote/SOCKS5 forwarding, named presets, enable/disable, status, optional autostart/reconnect | End-to-end forwarding, bind conflict, cancellation and listener cleanup |
| Vault | Master password, AES-256-GCM metadata encryption, versioned KDF settings, lock/unlock/idle lock/password change | Wrong-password, tamper, atomic-save, backup and restart tests |
| Key custody | OS secure storage; private keys excluded from metadata database, exports and sync | Backend custody and secret-exclusion tests on each desktop OS |
| Drive sync | OAuth, encrypted metadata upload/download, manual/automatic sync, offline handling, conflicts, restore | Two-device changes, deletion/conflict handling and ciphertext-only payload tests |
| Snippets | Categories/tags, search/recent, run versus paste, HOST/USER/PORT/CUSTOM/CLIPBOARD variables | Expansion previews and explicit execution behavior |
| History | Connection attempts/duration/bytes/reasons; command search/filter/export/re-run; optional recording/replay | Accurate source attribution and explicit recording controls |
| Local terminal | Windows PowerShell/CMD/available shells and Unix shells, working directory, mixed local/SSH tabs | Windows ConPTY and Unix PTY integration/cleanup |
| Settings and UX | Font/cursor/theme preferences, palette, keyboard navigation/shortcuts, context menus, notifications, loading/empty/error states | Keyboard-only workflows, contrast and platform shortcut checks |
| Advanced SSH | Jump hosts/bastions, agent forwarding, keyboard-interactive MFA, hardware-key integration | Separate provider/OS capability and interoperability tests |
| Teams | Shared vault/profiles, access roles, team sync, audit logs | Separate shared-key and membership/revocation design before implementation |
| Extensibility | Plugin API/marketplace, CLI companion, scripting/broadcast, custom themes, serial connections | Explicit capability boundary, cancellation and documented API contracts |
| Optional integrations in historical roadmap | 1Password/Bitwarden, LDAP/AD, Ansible, Docker, Kubernetes exec, AWS EC2 and Azure VM | Each needs its own adapter and credentials/interoperability coverage |
| Releases | Installers, updates, signing, user/developer docs, license attribution, dependency review | Native build and smoke tests on every supported target |

Historical future features stay visible in this checklist; they are not silently included in an MVP completion claim. Dates and old estimates from the deleted TODO are obsolete.

## Architecture

```text
frontend/                    React, TypeScript, xterm.js, styles
cmd/nomadssh/                Wails desktop entry point
cmd/nomadssh-cli/            CLI using the same Go services
internal/app/               lifecycle and typed frontend bindings
internal/model/             versioned profiles, sessions, keys, transfers
internal/sshclient/         auth, host trust, exec, remote PTY, jump hosts
internal/sessions/          cancellation, stream ownership, event routing
internal/sftp/              local/remote browsing and transfer queue
internal/tunnels/           local, remote and SOCKS5 listeners
internal/vault/             authenticated encryption and unlock lifecycle
internal/storage/           atomic persistence, backups and migrations
internal/secrets/           platform secure-storage adapters
internal/sync/              provider-neutral sync and Drive adapter
internal/localterminal/     Windows ConPTY / Unix PTY adapters
internal/history/           optional logging and replay
internal/snippets/          expansion and execution requests
```

Go owns credentials, networking, filesystem operations, validation, and cancellation. React receives metadata and explicit status events. Private keys are imported using native file selection/backend reads rather than retained in renderer state. Password entry necessarily passes through the UI transiently; it must never be persisted there or logged.

Use `golang.org/x/crypto/ssh` for SSH, `ssh/knownhosts` and `ssh/agent` where applicable, and a maintained SFTP client after dependency review. Use AES-GCM from Go's standard library. Prefer a versioned Argon2id KDF design, as the detailed TODO recommends, over the older README's fixed PBKDF2 description.

Request a remote PTY directly over SSH. Do not reproduce the historical proposal to route remote terminal output through a separately spawned local bash process. Local terminals need their own platform PTY adapter.

Terminal transport must preserve bytes, ordering, Unicode decoder state, initial output, resize events and backpressure. Register the session and stream consumer before connecting. Bound queues by bytes and use cancellation to close connections, goroutines, local processes and forwarding listeners.

Keep private keys local as confirmed. Sync encrypted profiles, key metadata and preferences. Store OAuth tokens locally in secure storage. On restore, show missing keys and allow re-import or linking an existing local key. Never imply that metadata restoration restores a private key.

Detailed command text/exit status cannot be reliably inferred from raw keystrokes in arbitrary interactive shells. Use explicit exec/snippet execution records or opt-in shell integration; label unavailable results as unknown. Session logging and recording are opt-in because terminal output can contain secrets.

Go memory management cannot guarantee erasing every copy of a secret. Minimize retention and copies; do not promise perfect memory zeroization.

## Cross-platform contract

Target modern Windows x64, macOS Intel/Apple Silicon, and Linux x64 initially; add Windows/Linux ARM64 through verified native builds. Exact minimum OS versions will be pinned with the selected Wails release and CI images.

Wails' current v3 documentation describes stable desktop support, with WebView2 on Windows, WebKit on macOS and GTK/WebKitGTK dependencies on Linux. It is Go plus a web UI, not an all-Go interface. Go was not found on PATH during review; install the toolchain required by the pinned Wails release before implementation builds.

Build and test on native Windows/macOS/Linux runners. Cross-compiling Go services does not verify GUI dependencies, keyboard input, secure storage, signing or installer behavior. Headless Linux may have no unlocked secret service; report that state explicitly rather than falling back to plaintext files.

## Delivery sequence and completion gates

1. Preserve the Electron baseline and recorded requirements; establish the Wails/Go project, native build matrix, shared models and migration schema.
2. Implement vault/secure storage, profile/key management, known hosts and working SSH terminal sessions. Test against a local SSH test server before connecting to user machines.
3. Complete SFTP, transfers, all tunnel types, snippets, local terminals, histories and split layouts.
4. Add encrypted metadata sync, missing-key restoration, conflicts and offline behavior. Live Google OAuth validation needs the application's OAuth registration and a test account.
5. Complete advanced SSH and the separately specified team/integration features. Preserve a per-feature checklist and distinguish unsupported platform integrations.
6. Finish accessibility, packaging, update/signing workflow and cross-platform verification. User-facing release claims follow tested capabilities.

Each stage must include functioning services and UI, meaningful tests, and documented limitations. Do not delete the baseline or label the whole conversion complete while checklist items are placeholders.

## REA setup plan approved by the user

Registry package reviewed: `rea-agents@6.8.0`. Installed system Node was `24.13.0`; supported Node 24 begins at `24.22.1`. npm was `11.9.0`.

The initial command returned `needs_human` because of the runtime version:

```powershell
npx.cmd --yes rea-agents@latest setup --client codex --dry-run --json
```

A preview using Node 24.22.1 in npm's temporary cache returned `planned` with no applied actions. Its actions were:

- Update `C:\Users\shivs\.codex\config.toml`, preserving unrelated settings.
- Back up that configuration to `C:\Users\shivs\.codex\config.toml.rea.backup` (setup may choose another recovery filename if contents change).
- Register `cmd.exe /d /c npx -y rea-agents@6.8.0 mcp`.
- Install the bundled skill at `C:\Users\shivs\.agents\skills\reverse-engineer-anything`.
- No additional analysis-provider installation or provider environment variables.

After updating Node, apply this same Codex-only scope, then verify the CLI version, scoped doctor output, Codex registration, MCP initialization/tool discovery and a benign analysis call. An on-disk registration alone does not prove this already-running chat has loaded the tools. A Codex restart/reconnect may be needed.

REA does not translate the application into Go automatically. Its JavaScript analysis can help inspect application artifacts. Native decompilation requires a suitable provider; none was configured at review time. No Bitvise executable was supplied or reverse-engineered in this review.

## External references

- [REA setup](https://rea.tools/get-started/)
- [REA installation and verification](https://github.com/morluto/rea/blob/main/docs/installation.md)
- [Codex MCP configuration](https://developers.openai.com/learn/docs-mcp)
- [Wails desktop status](https://wails.io/status/)
- [Wails architecture and platform requirements](https://wails.io/faq/)
- [Go SSH package](https://pkg.go.dev/golang.org/x/crypto/ssh)
- [Fyne alternative](https://docs.fyne.io/started/quick/)
- [Bitvise feature reference](https://bitvise.com/tunnelier)
