# Architecture

NomadSSH is a Go desktop process embedding a React/TypeScript interface through Wails 3. The UI renders inside the platform webview; the shipped application is not a hosted website and does not need a Node.js runtime. Node is a build dependency.

## Source ownership

| Location | Responsibility |
| --- | --- |
| `desktop/main.go` | Native window, asset embedding, dialogs, bridge registration and shutdown |
| `desktop/menu.go` | Application menus and commands routed to current UI state |
| `desktop/internal/core/service.go` | Request dispatch, workspace state, profile/key operations and lifecycle |
| `vault.go`, `model.go`, `secrets.go` | Versioned metadata, authenticated encryption, atomic persistence, secure storage |
| `session.go`, `platform_*.go` | SSH trust/auth/PTY, jump hosts, terminal streams and native local shells |
| `files.go`, `tunnels.go` | SFTP, transfers, forwarding and cancellation |
| `drive.go` | OAuth configuration, local tokens, encrypted Drive revisions and explicit restore |
| `workspace_*.go` | OS file locks for exclusive workspace ownership |
| `demo.go`, `*_test.go` | Loopback protocol fixture and integration/regression tests |
| `desktop/frontend/src` | Workspace components, xterm rendering, dialogs and Go request/event bridge |

The current module intentionally uses one internal core package. The original plan's finer package decomposition and CLI companion are proposals, not the current directory structure.

## Data boundary

Go owns networking, files, secret storage and persisted state. The UI submits explicit operations through `main.App.Invoke` and receives redacted metadata. Password input necessarily exists transiently in the renderer while entered, but saved passwords are never returned in state. Private-key files are read in Go after native selection; private-key bodies are not exposed through renderer state.

The vault uses AES-256-GCM with an Argon2id-derived key and versioned metadata. Private keys and OAuth credentials use the OS secure store separately. Chunked records use a manifest to publish complete updates. Backups/Drive snapshots export the encrypted vault, not secure-store records. Restoring public-key metadata does not restore private-key material.

## Runtime lifecycle

Each terminal session owns a cancelable connection/PTY and its streams. Native local shells use Windows ConPTY or Unix PTY. Input, resize and output are routed by session ID. Output is base64-encoded to preserve bytes over the bridge and decoded into xterm.js; the renderer retains early output until a terminal mounts.

Control events and terminal-output events use separate bounded backend channels so a saturated output channel cannot block lock notifications. The frontend polls events and refreshes metadata periodically. Sustained-output renderer memory and large-session stress testing remain release gates; bounded backend queues alone do not establish end-to-end flow control.

Lock and shutdown close sessions, cancel transfers and release forwarding listeners. An OS workspace file lock prevents concurrent instances writing the same vault. Native exit/menu commands inspect live work and request confirmation before quitting. Session switching invalidates stale SFTP listing requests in the frontend.

Transfers use bounded concurrency and context cancellation. Recursive copies do not follow symlinks. Resume validates an existing destination prefix before appending. Existing unrelated files are protected from overwrite.

## Platform boundary and builds

Windows uses WebView2, ConPTY and native credential storage. macOS uses WebKit, Unix PTY and Keychain. Linux uses GTK/WebKitGTK, Unix PTY and Secret Service. If secure storage is unavailable, key/token operations report an error; they do not fall back to plaintext files.

The build scripts install frontend dependencies from the lockfile, format-check/test/typecheck/build the UI, test/vet Go and embed the generated assets in a native binary. CI defines native Windows/macOS/Linux jobs and Unix race checks. Interactive OS acceptance and signed distribution are separate from compilation.

See [security](../SECURITY.md) and [release readiness](RELEASE_READINESS.md) for limitations. The old Electron implementation is archived under `legacy/electron/`; no implicit data migration is performed.
