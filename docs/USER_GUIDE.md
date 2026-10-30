# NomadSSH user guide

## Start a workspace

Open the native application. On first launch, choose a master password of at least 12 characters. This encrypts your saved connections and settings. Keep it safe: there is no recovery backdoor. Existing workspaces ask for that password when opened.

By default, application data lives under the OS user configuration directory in `NomadSSH-Go` (`%APPDATA%\NomadSSH-Go` on Windows). `--data-dir PATH` selects a separate workspace. An OS lock prevents two instances from writing the same workspace.

`--demo` creates isolated temporary data and starts a loopback SSH/SFTP test server. The included profiles are local test connections. The constrained demo shell accepts `help`, `date`, `whoami`, `pwd`, `ls`, `echo`, `clear` and `exit`. The demo's generated public key is trusted directly; ordinary servers still require fingerprint verification. Demo files are temporary test data, not backups.

## Connect and inspect

Choose **New** or **File → New connection**. Enter a name, hostname/IP, port and username. Select password, private key or SSH agent authentication. Private-key login requires a key imported or generated in **Key manager**. Expand connection options to set a group, tags or a jump host.

**Save connection** saves without connecting. **Save & connect** saves first and then opens a session. For an existing password-authenticated profile, leaving its password blank preserves the stored password. Saved passwords are not displayed back in the form.

Select a saved host to inspect its address, authentication, group, last connection and known fingerprint. Double-click or press Enter to connect. Compare a first-use or changed fingerprint with the server administrator through a trusted channel before accepting it.

The table can be filtered and sorted. F2 edits; Delete opens a confirmation; right-click offers connection actions. The left manager groups hosts. Use the toolbar's panel control to hide it; the Connections title bar can hide properties and the lower log. Drag the navigation pane's resize handle to adjust its width.

## Terminals and sessions

Each connection opens an independent session tab. Closing a tab disconnects its session and associated transfers/tunnels. **Connection → Close all sessions** asks before closing every session. Exiting with live work also asks for confirmation.

Switching to another workspace view keeps sessions active. **Split view** displays the active session beside another open session. **Local terminal** opens PowerShell on Windows or the available Unix shell through a native PTY. Terminal font size and scrollback are in Preferences. Clicking a terminal hyperlink copies the URL rather than opening it automatically.

Use snippets to paste a command for review or explicitly run it in the active session. `${HOST}`, `${USER}` and `${PORT}` expand from that session. Never assume a snippet is safe merely because it is saved.

## File transfer

Open **File transfer** and choose a connected SSH session. Local files are on the left and remote files on the right. Type a path and press Enter, use the parent button, or double-click a directory. Each pane has its own name filter and sort order. Directories appear first; sorting supports name, largest first and newest first.

Select a file or folder, then **Upload** or **Download**. The queue shows progress, speed and remaining time. Up to three transfers run concurrently. Pause/cancel/retry are available per item. Resume checks the existing destination prefix with SHA-256 before appending. Unrelated existing destination files are rejected rather than silently overwritten. Symlinks are shown but not traversed during recursive transfers.

Pane actions create folders, rename/move and delete files or empty folders. Remote permissions accept octal values. Deletion is permanent and asks for confirmation; nonempty folder deletion is blocked. Refresh a pane to see completed changes made elsewhere.

## Keys and forwarding

**Key manager** generates Ed25519, RSA-3072 or ECDSA-P256 keys and imports existing private keys, including passphrase-protected OpenSSH keys. The public key can be copied for installation on a server. Private keys remain in the OS secure store. Importing a matching fingerprint on another device reconnects existing metadata to the local key.

**Port forwarding** saves local, remote and SOCKS5 CONNECT presets. Forwarding listeners are restricted to loopback. Start/stop controls report active state; disconnecting the owning session closes forwarding. Automatic tunnel reconnect is not implemented.

## Locking and backup

Lock manually from File or the navigation pane, or configure the idle timeout. Locking disconnects sessions and cancels transfers/tunnels. Preferences also offers master-password rotation and known-host management.

**Backup & sync** exports encrypted workspace snapshots. They contain saved connection passwords inside the encrypted vault, public-key metadata and preferences. They exclude private keys and OAuth credentials. Restore needs the password used for the snapshot and replaces current metadata. Close sessions before restoring and keep a current backup first.

## Google Drive configuration

Supply your own Google OAuth **Desktop app** client ID, enable the Drive API and configure the consent screen/test users for your project. Enter the supplied client secret if applicable, save configuration and choose **Sign in with Google**. The app uses PKCE and a loopback callback; tokens remain in the OS secure store. Only the `drive.appdata` scope is requested. See [Google's native-app OAuth guide](https://developers.google.com/identity/protocols/oauth2/native-app) and [application-data guide](https://developers.google.com/workspace/drive/api/guides/appdata).

Manual and periodic uploads create encrypted revisions. Choose a revision to restore explicitly. Automatic bidirectional merging and deletion conflict resolution are not implemented. Live sign-in/upload/restore testing remains pending the app's OAuth registration. Re-import private keys on every new device.

## Shortcuts

| Action | Shortcut |
| --- | --- |
| New connection | Ctrl+N / Cmd+N |
| Local terminal | Ctrl+Shift+T / Cmd+Shift+T |
| Preferences | Ctrl+, / Cmd+, |
| Command palette | Ctrl+K / Cmd+K |
| Lock workspace | Ctrl+Shift+L / Cmd+Shift+L |
| Filter connections | Ctrl+F / Cmd+F in Connections |
| Connect / edit / remove selected table row | Enter / F2 / Delete |

Native menus show platform accelerators. macOS/Linux interactive shortcut acceptance is still pending. See [release readiness](RELEASE_READINESS.md) for platform and feature limits.
