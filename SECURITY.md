# Security

NomadSSH is under active development. A release must pass the gates in [release readiness](docs/RELEASE_READINESS.md) before being described as production-ready.

## Data and credentials

- Go owns network connections, file operations, key handling and persistence.
- Workspace metadata, including saved server passwords, is authenticated and encrypted with AES-256-GCM. Argon2id derives the encryption key from the master password.
- Private keys and Google OAuth credentials use the OS secure store. No plaintext fallback is provided.
- Backups and Drive snapshots include encrypted metadata and public-key metadata, not private-key material. A new device needs private keys reimported separately.
- Host fingerprints require verification before trusting a new or changed external server.
- Locking disconnects sessions and cancels transfers/tunnels. There is no password-reset backdoor.

An unlocked app can use the current user's filesystem, shell, SSH agent and secure store. Encryption does not protect against malware running as that user or a compromised operating system. Go's garbage collector prevents guarantees that every memory copy of a secret is erased.

## Reporting

Do not include private keys, passwords, access tokens, vault files or terminal recordings in public issues. Report a suspected vulnerability privately to the repository maintainer through the repository hosting service's private security channel when enabled. If no private channel is available, request one without publishing exploit details or confidential data.

The demonstration server is started only with `--demo`, binds to loopback and uses generated credentials. It is a protocol test fixture, not a hardened SSH server for deployment.
