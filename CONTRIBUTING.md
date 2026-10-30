# Contributing to NomadSSH

Work on `desktop/`. `legacy/electron/` is an archived baseline, not a second maintained application. Keep historical plans separate from current feature claims.

## Development

Install Go 1.26+, Node 24 and the native dependencies listed in the [README](README.md). Run the root build script for a tested native executable. Use `--demo` for isolated SSH/SFTP experiments. Never commit real credentials, workspace vaults, private keys, terminal recordings or OAuth secrets.

The frontend has no independent backend: `npm run dev` starts Vite, but native bindings require a Wails host. A successful browser rendering is not an integration test.

## Required checks

From the repository root:

```sh
npm --prefix desktop/frontend ci
npm --prefix desktop/frontend run format:check
npm --prefix desktop/frontend test
npm --prefix desktop/frontend run build
npm --prefix desktop/frontend audit --audit-level=high
cd desktop
go test ./internal/... -timeout 90s
go vet ./...
```

Use `gofmt` for Go and `npm --prefix desktop/frontend run format` for frontend formatting. On supported native toolchains, also run `go test -race ./internal/... -timeout 120s`. The GUI build requires the generated `frontend/dist` directory, which is intentionally ignored by Git.

`NOMADSSH_TEST_KEYCHAIN=1` enables the native secure-storage integration test. It uses a fresh test namespace and deletes its own records. Run it in an interactive desktop login with an unlocked secure store. Do not redirect tests to a user's production workspace.

## Review expectations

- Keep network, filesystem, credentials and validation in Go. Do not persist secrets in renderer storage or logs.
- Use cancellation for long-running work and test lock/disconnect cleanup. Handle stale asynchronous UI results when sessions change.
- Verify keyboard operation, minimum window size, empty/error states and the actual native window after UI changes.
- Add tests for meaningful behavior and regressions; keep purely visual checks proportionate.
- Update the user guide and release checklist when behavior or support claims change.
- Describe what changed, why, verification performed and remaining risks in a pull request.

The [release checklist](docs/RELEASE_READINESS.md) governs release claims. Native builds on CI do not replace interactive platform acceptance, signing or independent SSH interoperability testing.
