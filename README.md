# NomadSSH

**Secure, cloud-synced SSH client for power users.**  
*Your servers. Your keys. Anywhere.*

---

NomadSSH is an open-source, cross-platform SSH client built on top of the excellent Tabby Terminal project. It is designed for developers and operators who work across multiple machines and environments and need their SSH setup to follow them everywhere.

NomadSSH extends Tabby with a strong focus on encrypted cloud sync, portability, and daily power-user workflows, while preserving the reliability and performance of a mature SSH client.

---

## Key Highlights

- **Zero-knowledge encrypted cloud sync**
- **Modern GUI + terminal**
- **Built-in SFTP**
- **Advanced port forwarding**
- **Plugin-friendly architecture**
- **Cross-platform** (Windows, macOS, Linux)
- **Free & open source**

---

## Why NomadSSH?

Most SSH clients:

- Store profiles only locally
- Lose configuration on reinstall or machine change
- Don't offer secure, user-controlled sync

**NomadSSH solves this problem.**

With NomadSSH, you can:

1. Install the app on a new machine
2. Enter your master password
3. Instantly restore all SSH profiles, keys, and layouts

No manual copying. No insecure exports.

---

## Core Features

### Security

- **Master password–based encryption**
- **AES-256-GCM encrypted data**
- **Private keys never leave your device unencrypted**
- **Zero-knowledge cloud sync** (cloud providers cannot read your data)

### SSH Client

- SSH shell & exec
- Password & key-based authentication
- SSH agent support
- Optional session logging

### SFTP

- Dual-panel file manager
- Drag & drop upload/download
- Resume transfers
- Permission editor

### Port Forwarding

- Local port forwarding
- Remote port forwarding
- Dynamic forwarding (SOCKS5)
- Named tunnel presets

### Cloud Sync

- Encrypted sync via Google Drive
- Auto-sync on changes
- Conflict detection
- One-click restore on new devices

### Productivity

- Command snippets
- Saved sessions
- Tabbed terminals
- Split panes
- Session replay (planned)

---

## Supported Platforms

- **Windows** (x64)
- **macOS** (Intel & Apple Silicon)
- **Linux**

---

## Architecture Overview

| Component | Technology |
|-----------|-----------|
| **UI** | Electron + React + TypeScript + Tailwind CSS |
| **Terminal Engine** | xterm.js |
| **SSH Engine** | ssh2 |
| **SFTP** | ssh2-sftp-client |
| **Storage** | Local encrypted store (SQLite / JSON) |
| **Sync** | Google Drive API |
| **Encryption** | AES-256-GCM + PBKDF2 |

---

## Project Structure (High Level)

```
nomadssh/
├── app/
│   ├── ui/
│   ├── ssh/
│   ├── sftp/
│   ├── tunnels/
│   └── plugins/
├── sync/
│   └── google-drive/
├── crypto/
├── storage/
├── docs/
└── scripts/
```

---

## Installation

### From Releases

*(Coming soon)*

### From Source

```bash
git clone https://github.com/ProgrammerNomad/NomadSSH.git
cd NomadSSH
npm install
npm run dev
```

---

## Encryption & Privacy

NomadSSH follows a **zero-knowledge security model**:

- All sensitive data is encrypted locally
- Encryption keys are derived from your master password
- Cloud providers never see plaintext data
- No telemetry, no tracking

---

## Roadmap

### Phase 1 (MVP)

- SSH terminal
- Profile management
- Encrypted local storage

### Phase 2

- Google Drive sync
- SFTP UI
- Port forwarding UI

### Phase 3

- Team profiles
- Plugin marketplace
- CLI companion tool

---

## Contributing

**Contributions are welcome and appreciated.**

You can help by:

- Fixing bugs
- Improving UI/UX
- Adding plugins
- Improving documentation

Please read `CONTRIBUTING.md` before submitting pull requests.

---

## License

NomadSSH is licensed under the **MIT License**.

This project is based on Tabby, which is also MIT licensed.  
All original Tabby copyright notices are preserved.

---

## Acknowledgements

NomadSSH is built on top of the amazing **Tabby Terminal** project and its community.  
Without Tabby, this project would not exist.

---

## Inspiration

- **Bitvise SSH Client**
- Modern terminal workflows
- The need for portable, secure developer tools

---

## Vision

> *NomadSSH aims to be the last SSH client you ever need —  
> no matter where you work from.*

---

## Support the Project

If you find NomadSSH useful:

- Star the repository
- Share feedback
- Contribute code or ideas

---

**Made with ❤️ by a Nomad Programmer**