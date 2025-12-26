# NomadSSH

**Secure, cloud-synced SSH client for power users.**  
*Your servers. Your keys. Anywhere.*

---

NomadSSH is an open-source, cross-platform SSH client built for developers who work across multiple machines and environments. It combines the power of traditional SSH clients (like Bitvise) with modern features such as encrypted cloud sync, portability, and extensibility.

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

- Store profiles locally
- Lose configuration on reinstall
- Don't sync securely across devices

**NomadSSH solves this.**

With NomadSSH, you can:

1. Sign in on a new machine
2. Enter your master password
3. Instantly restore all SSH profiles, keys, and layouts

---

## Core Features

### Security

- **Master password–based encryption**
- **AES-256-GCM encrypted data**
- **Private keys never leave your device unencrypted**
- **Zero-knowledge cloud sync** (even cloud providers can't read data)

### SSH Client

- SSH shell & exec
- Password & key-based authentication
- SSH agent support
- Session logging (optional)

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
| **UI** | Electron + TypeScript |
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

NomadSSH uses a **zero-knowledge security model**:

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

**Contributions are welcome!**

You can help by:

- Fixing bugs
- Improving UI/UX
- Adding plugins
- Improving documentation

Please read `CONTRIBUTING.md` before submitting PRs.

---

## License

NomadSSH is licensed under the **MIT License**.  
You are free to use, modify, and distribute it.

---

## Inspiration

NomadSSH is inspired by:

- **Bitvise SSH Client**
- Modern terminal workflows
- The need for portable, secure developer tools

---

## Vision

> *NomadSSH aims to be the last SSH client you ever need,  
> no matter where you work from.*

---

## Support the Project

If you find NomadSSH useful:

- **Star the repo**
- **Share feedback**
- **Contribute code or ideas**

---

**Made with love by a Nomad Programmer**