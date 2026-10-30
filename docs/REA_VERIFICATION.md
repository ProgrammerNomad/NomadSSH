# REA installation and verification

Verified on 2026-10-30 after the user approved the concrete setup plan.

## Installed configuration

- System Node.js upgraded from 24.13.0 to 24.22.1 through the version-pinned official Windows installer using winget. Installer hash verification passed. npm reports 11.9.0.
- REA 6.8.0 configured for Codex using its setup command; no global REA executable installation is needed because the registration uses npx.
- Configuration: `C:\Users\shivs\.codex\config.toml`.
- Backup: `C:\Users\shivs\.codex\config.toml.rea.backup`.
- Registered command: `cmd.exe /d /c npx -y rea-agents@6.8.0 mcp`.
- Bundled skill: `C:\Users\shivs\.agents\skills\reverse-engineer-anything\SKILL.md`.
- Setup result: `ready`, with `configured_codex` and `installed_skill` applied.

## Checks and their limits

| Check | Result |
| --- | --- |
| `node --version` | v24.22.1 |
| Scoped REA doctor for Codex and skill | healthy: true; both identities aligned |
| `codex mcp get rea --json` | enabled stdio registration with pinned package |
| Independent MCP initialize over the exact registered command | server rea, version 6.8.0 |
| MCP tools/list | 229 tools, including binary_session and analyze_javascript_application |
| MCP binary_session call | succeeded; server exited cleanly with code 0 |
| Static JavaScript CLI analysis of selected compiled NomadSSH files | completed with zero parse failures |
| Native providers | none configured; broad environment_healthy remains false |
| Tools exposed to the already-running chat | absent at verification time; needs Codex restart/reconnect |

The independent MCP test proves that the configured command starts and serves requests. It does not prove the already-running Codex chat has reloaded its tools. Do not reinstall REA merely because an existing chat has not reconnected.

## NomadSSH analysis evidence

Analyzed a temporary copy of the current production build and its package.json. No application code was executed and no SSH connection was opened.

Selected compiled sources:

- dist/electron/main.js
- dist/electron/preload.js
- dist/electron/ipc/sshIPC.js
- dist/src/services/ssh/SSHService.js
- dist/src/services/storage/LocalStorageService.js

Parent Evidence ID: `ev_03da5365db1dfdd2151281708864fa00855d7dd75ff3daf461c428449dc827d3`.

Artifact SHA256: `d59fcec40d3ba9dea3d87f53e96e277f058248af8bb5c59d4afe0763fc9d1219`.

Observed static results:

- 5 JavaScript files parsed, 0 parse failures, 91 findings.
- 1 BrowserWindow, 1 contextBridge API, 35 exposed API members.
- 45 IPC operations, 32 literal channels and 2 dynamic-channel operations.

Coverage is deliberately partial: 8 inventoried files were outside the selected scope, and dynamic IPC channels remain unresolved. REA reports 8 application-graph unknowns and 1,181 semantic-graph unknowns. Unpaired IPC observations do not prove missing runtime handlers, particularly because storageIPC was outside scope. Static relationships do not prove runtime behavior or security enforcement.

The complete local evidence is retained in `tmp/rea/baseline-evidence.json`, with its summary in `tmp/rea/baseline-summary.json`. These files and the independent MCP verifier `tmp/verify-rea.mjs` are ignored by Git.

## Next step

Restart or reconnect Codex to load the installed REA tools into the coding-agent session. Installation was verified independently; a functioning Go implementation has since been added under `desktop/`. See [release readiness](RELEASE_READINESS.md) for current implementation evidence and remaining requirements. The analyzed Electron files now belong to the archived baseline under `legacy/electron/`; the paths above identify their location at analysis time.
