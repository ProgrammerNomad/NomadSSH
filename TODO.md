# NomadSSH - Development TODO

**Last Updated:** December 26, 2025  
**Current Phase:** UI Complete → Starting Tabby Integration

---

## 📊 Project Status

### ✅ Completed (Phase 1-3)
- **Complete UI Layer** - All 15+ screens and components built
- **Design System** - VS Code-inspired dark theme, Heroicons, Radix UI
- **State Management** - React state for profiles, keys, sessions, snippets, history
- **Phase 2 Features** - SSH Key Groups, Profile Tags, Command Snippets, SFTP UI, Command History
- **Phase 3 Features** - Host Groups, Visual Host Cards with custom icons

### 🚧 Current Focus
**Tabby Terminal Integration** - Connect our UI to Tabby's SSH engine

### ⏳ Pending
- Actual SSH connections (via Tabby)
- Encryption layer (PBKDF2 + AES-256-GCM)
- Google Drive sync
- Local storage persistence
- SFTP file operations (via Tabby)
- Port forwarding (via Tabby)

---

## 🎯 Priority Roadmap

### **PHASE A: SSH + PTY Implementation (HIGH PRIORITY - FOUNDATION)**

> **Architecture Note:** We are building from scratch using ssh2 + node-pty, inspired by Tabby's architecture patterns (NOT using Tabby code). This ensures clean separation: Core Services → IPC → Renderer.

#### 1. SSH + PTY Service (MOST CRITICAL)
**Goal:** Create core SSH connection service with pseudo-terminal support

**File:** `src/services/ssh/SSHService.ts` (runs in Electron main process)

- [ ] **SSH Connection Core**
  - [ ] Import ssh2 `Client` class
  - [ ] Import node-pty for pseudo-terminal (PTY)
  - [ ] Create `SSHConnection` class wrapping ssh2 Client
  - [ ] Implement `connect(profile)` method
    - [ ] Map SSHProfile → ssh2 ConnectConfig
    - [ ] Handle password authentication
    - [ ] Handle SSH key authentication (read private key from path)
    - [ ] Handle "auto" key mode (try all keys sequentially until success)
    - [ ] Emit 'ready' event on successful connection
    - [ ] Emit 'error' event on failure
  
- [ ] **PTY Bridge (Critical Pattern)**
  - [ ] Spawn PTY using `pty.spawn('bash', [], { ... })`
  - [ ] Request shell from ssh2: `client.shell((err, stream) => { ... })`
  - [ ] **Bidirectional streaming:**
    - [ ] `stream.on('data', (data) => pty.write(data))` - SSH output → PTY
    - [ ] `pty.onData((data) => stream.write(data))` - PTY input → SSH
  - [ ] Handle stream events: 'close', 'error'
  - [ ] Handle PTY events: 'exit'
  
- [ ] **Terminal Operations**
  - [ ] `resize(cols, rows)` - Forward to both stream and PTY
  - [ ] `disconnect()` - Clean shutdown (kill PTY, end SSH stream, end client)
  - [ ] `getStatus()` - Return connection state (connecting, connected, disconnected)

- [ ] **Security & Error Handling**
  - [ ] Never expose ssh2 or node-pty to renderer process
  - [ ] Validate all inputs (profile data, dimensions)
  - [ ] Handle connection timeout (30s default)
  - [ ] Handle authentication failures gracefully
  - [ ] Log errors without leaking credentials

**Key Rules:**
- ❌ NO SSH logic in React components
- ❌ NO node-pty in renderer process
- ❌ NO direct fs access from UI
- ✅ ssh2 + node-pty ONLY in main process
- ✅ All communication via IPC

**Success Criteria:**
✅ SSH connects successfully  
✅ PTY spawned and bridged  
✅ Bidirectional data flow working  
✅ Resize events handled  
✅ Clean disconnect without leaks

---

#### 2. Multi-Session Manager (VERY IMPORTANT)
**Goal:** Manage multiple concurrent SSH connections with unique IDs

**File:** `src/services/ssh/SessionManager.ts` (runs in Electron main process)

- [ ] **Session Manager Core**
  - [ ] Create `SessionManager` class (singleton)
  - [ ] Store sessions in Map<sessionId, SSHConnection>
  - [ ] Generate unique session IDs (UUID or timestamp-based)
  
- [ ] **Session Lifecycle Methods**
  - [ ] `createSession(profile)` → Returns sessionId
    - [ ] Create new SSHConnection instance
    - [ ] Call connect()
    - [ ] Store in sessions Map
    - [ ] Return sessionId to caller
  - [ ] `getSession(sessionId)` → Returns SSHConnection or null
  - [ ] `resizeSession(sessionId, cols, rows)` → Forward to connection
  - [ ] `writeToSession(sessionId, data)` → Send data to SSH/PTY
  - [ ] `closeSession(sessionId)` → Disconnect and remove from Map
  - [ ] `getAllSessions()` → Return list of active session IDs
  
- [ ] **Event Management**
  - [ ] Forward connection events to IPC (ready, data, error, close)
  - [ ] Emit 'session:data' for output
  - [ ] Emit 'session:status' for state changes
  - [ ] Clean up event listeners on disconnect
  
- [ ] **Error Recovery**
  - [ ] Handle session crashes
  - [ ] Prevent orphaned sessions
  - [ ] Timeout stale connections
  - [ ] Graceful shutdown (close all sessions)

**Success Criteria:**
✅ Create multiple sessions simultaneously  
✅ Each session isolated (no cross-talk)  
✅ Session lookup by ID works  
✅ Clean removal on close  
✅ No memory leaks after disconnect

---

#### 3. Electron IPC Handlers (SECURITY CRITICAL)
**Goal:** Secure IPC bridge between renderer and SSH services

**File:** `electron/ipc/sshIPC.ts` (runs in Electron main process)

- [ ] **IPC Handler Setup**
  - [ ] Import `ipcMain` from Electron
  - [ ] Import SessionManager
  - [ ] Register all SSH-related IPC handlers
  
- [ ] **Connection Handlers**
  - [ ] `ipcMain.handle('ssh:connect', async (event, profile) => { ... })`
    - [ ] Validate profile data (required fields, sanitize)
    - [ ] Call SessionManager.createSession(profile)
    - [ ] Return { success: true, sessionId } or { success: false, error }
  - [ ] `ipcMain.handle('ssh:disconnect', async (event, sessionId) => { ... })`
    - [ ] Validate sessionId exists
    - [ ] Call SessionManager.closeSession(sessionId)
    - [ ] Return success status
  
- [ ] **Terminal Operation Handlers**
  - [ ] `ipcMain.handle('ssh:resize', async (event, sessionId, cols, rows) => { ... })`
    - [ ] Validate dimensions (positive integers)
    - [ ] Forward to SessionManager.resizeSession()
  - [ ] `ipcMain.handle('ssh:write', async (event, sessionId, data) => { ... })`
    - [ ] Write keyboard input to session
    - [ ] Used for sending commands/key presses
#### 4. Electron Preload (CONTEXT BRIDGE)
**Goal:** Expose secure SSH API to renderer using contextBridge

**File:** `electron/preload.ts` (security boundary)

- [ ] **Context Bridge API**
  - [ ] Import `contextBridge`, `ipcRenderer` from Electron
  - [ ] Expose `window.nomad.ssh` API object
  
- [ ] **SSH API Methods**
  - [ ] `connect(profile)` → Returns Promise<{ sessionId, error? }>
    - [ ] Calls `ipcRenderer.invoke('ssh:connect', profile)`
  - [ ] `disconnect(sessionId)` → Returns Promise<boolean>
    - [ ] Calls `ipcRenderer.invoke('ssh:disconnect', sessionId)`
  - [ ] `resize(sessionId, cols, rows)` → Returns Promise<void>
    - [ ] Calls `ipcRenderer.invoke('ssh:resize', sessionId, cols, rows)`
  - [ ] `write(sessionId, data)` → void
    - [ ] Calls `ipcRenderer.send('ssh:data', sessionId, data)`
  
- [ ] **Event Listeners**
  - [ ] `onOutput(sessionId, callback)` → Cleanup function
    - [ ] Listens to 'ssh:output' events
    - [ ] Filters by sessionId
    - [ ] Returns unsubscribe function
  - [ ] `onStatus(sessionId, callback)` → Cleanup function
    - [ ] Listens to 'ssh:status' events
  - [ ] `onError(sessionId, callback)` → Cleanup function
    - [ ] Listens to 'ssh:error' events

- [ ] **Type Definitions**
  - [ ] Create `electron.d.ts` in src/
  - [ ] Define Window interface extension:
    ```typescript
    interface Window {
      nomad: {
        ssh: {
          connect: (profile: SSHProfile) => Promise<{ sessionId?: string; error?: string }>;
          disconnect: (sessionId: string) => Promise<boolean>;
     8. SFTP Service Implementation
**Goal:** Build SFTP file transfer using ssh2-sftp-client

**File:** `src/services/sftp/SFTPService.ts`

- [ ] **SFTP Connection**
  - [ ] Import ssh2-sftp-client
  - [ ] Create SFTPClient wrapper class
  - [ ] Connect using existing SSH connection (reuse session)
  - [ ] Or create dedicated SFTP connection
  
- [ ] **File Browser Operations**
  - [ ] `listFiles(remotePath)` → Returns FileInfo[]
    - [ ] Get files, folders, symlinks
    - [ ] Include name, size, modified date, permissions, type
  - [ ] `changeDirectory(path)` → Navigate
  - [ ] `getWorkingDirectory()` → Get current path
  - [ ] `makeDirectory(name)` → Create folder
  - [ ] `deleteFile(path)` → Remove file
  - [ ] `deleteDirectory(path, recursive)` → Remove folder
  - [ ] `rename(oldPath, newPath)` → Rename/move
  - [ ] `chmod(path, mode)` → Change permissions
  
- [ ] **File Transfer Operations**
  - [ ] `upload(localPath, remotePath, onProgress)` → Upload file
    - [ ] Read local file in chunks
    - [ ] Stream to remote
    - [ ] Emit progress events (bytes transferred, percentage)
  - [ ] `download(remotePath, localPath, onProgress)` → Download file
    - [ ] Stream from remote
    - [ ] Write to local in chunks
    - [ ] Emit progress events
  - [ ] `uploadDirectory(localPath, remotePath)` → Recursive upload
  - [ ] `downloadDirectory(remotePath, localPath)` → Recursive download
  
- [ ] **Transfer Queue Management**
  - [ ] Queue transfers (don't block UI)
  - [ ] Parallel transfers (configurable, default 3)
  - [ ] Pause/resume support
  - [ ] Cancel operation
  - [ ] Retry on failure (exponential backoff)
  - [ ] Calculate transfer speed (bytes/sec)
  - [ ] Estimate time remaining (ETA)
  
- [ ] **Error Handling**
  - [ ] Permission denied → Clear error message
  - [ ] File not found → Handle gracefully
  - [ ] Disk full → Show space error
  - [ ] Network issues → Retry logic
  - [ ] Connection lost → Attempt reconnect

**Success Criteria:**
✅ List remote files successfully  
✅ Upload file with progress  
✅ Download file with progress  
✅ Create/delete/rename operations work  
✅ Queue handles multiple transfers  
✅ Errors handled gracefullyd.ssh.onOutput(sessionId, (data) => terminal.write(data))`
  - [ ] Subscribe to output on mount
  - [ ] Unsubscribe on unmount (cleanup)
  
- [ ] **Forward Input to Backend**
  - [ ] `terminal.onData((data) => window.nomad.ssh.write(sessionId, data))`
  - [ ] Sends keyboard input to SSH via IPC
  
- [ ] **Handle Resize Events**
  - [ ] Listen to window resize
  - [ ] `fitAddon.fit()` → Get new dimensions
  - [ ] `window.nomad.ssh.resize(sessionId, terminal.cols, terminal.rows)`
  - [ ] Debounce resize events (avoid spam)
  
- [ ] **Status & Error Handling**
  - [ ] Subscribe to `onStatus` → Update UI (connecting, connected, error)
  - [ ] Subscribe to `onError` → Show error banner
  - [ ] Show spinner while connecting
  - [ ] Show "Disconnected" message after close
  
- [ ] **Cleanup on Unmount**
  - [ ] Call all unsubscribe functions
  - [ ] `terminal.dispose()` to free memory
  - [ ] Do NOT call disconnect here (handled by close button)

**React Integration:**
```typescript
// Example usage in Terminal.tsx
const Terminal: React.FC<{ sessionId: string }> = ({ sessionId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { status, error } = useTerminal(sessionId, containerRef);
  
  return (
    <div className="terminal-wrapper">
      {status === 'connecting' && <Spinner />}
      {error && <ErrorBanner message={error} />}
      <div ref={containerRef} className="terminal-container" />
    </div>
  );
};
```

**Key Rules:**
- ❌ NO ssh2 or node-pty in renderer
- ❌ NO direct IPC calls (use window.nomad.ssh)
- ❌ NO fs access
- ✅ Only use window.nomad.ssh API
- ✅ Clean up subscriptions on unmount
- ✅ Handle all connection states

**Success Criteria:**
✅ Terminal renders correctly  
✅ Keyboard input works  
✅ Output displays in real-time  
✅ Resize works smoothly  
✅ No memory leaks on unmount  
✅ Error states handled gracefully

---

#### 6. Wire ProfileManager to SSH Service
**Goal:** Connect "Connect" button to actual SSH

**File:** `src/App.tsx` (update existing code)

- [ ] **Update handleConnectProfile**
  ```typescript
  const handleConnectProfile = async (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;
    
    try {
      // Show connecting state
      setCurrentView('terminal');
      
      // Call SSH service via IPC
      const result = await window.nomad.ssh.connect(profile);
      
      if (result.error) {
        // Show error toast
        console.error('Connection failed:', result.error);
        return;
      }
      
      // Create session object
      const newSession: Session = {
        id: result.sessionId!,
        profileId: profile.id,
        profileName: profile.name,
        connected: true,
        startedAt: new Date().toISOString()
      };
      
      // Add to sessions
      setSessions([...sessions, newSession]);
      setActiveSessionId(result.sessionId!);
      
      // Update lastConnected
      setProfiles(profiles.map(p =>
        p.id === profileId
          ? { ...p, lastConnected: new Date().toISOString() }
          : p
      ));
    } catch (error) {
      console.error('SSH connection error:', error);
      // Show error modal
    }
  };
  ```

- [ ] **Update handleDisconnect**
  - [ ] Call `window.nomad.ssh.disconnect(sessionId)`
  - [ ] Remove session from sessions array
  - [ ] Update session.connected = false
  - [ ] Switch to dashboard if no sessions left

- [ ] **Session Tabs Integration**
  - [ ] Show session tabs in TopBar when sessions exist
  - [ ] Switch activeSessionId on tab click
  - [ ] Close button calls handleDisconnect
  - [ ] Render Terminal component with activeSessionId

- [ ] **Error Handling**
  - [ ] Connection timeout → Show error modal
  - [ ] Authentication failure → Show credentials prompt
  - [ ] Network error → Show retry button
  - [ ] Unknown error → Show generic error message

**Success Criteria:**
✅ Click Connect → Terminal opens  
✅ SSH commands work (ls, pwd, cd)  
✅ Multiple sessions in tabs  
✅ Switch between sessions  
✅ Disconnect closes session  
✅ Errors handled gracefully

---

#### 7. Profile Storage & Loading
**Goal:** Save/load profiles from disk (unencrypted for now)

- [ ] Local storage service
  - [ ] `src/services/storage/LocalStorageService.ts`
  - [ ] Use `electron-store` for persistence
  - [ ] Save profiles as JSON
  - [ ] Save SSH keys metadata (paths, not private keys)
  - [ ] Save snippets, host groups, settings
- [ ] Load on app startup
  - [ ] Read profiles from storage in App.tsx useEffect
  - [ ] Populate state with saved data
  - [ ] Handle missing/corrupted data gracefully
- [ ] Save on changes
  - [ ] Auto-save when profile created/edited/deleted
  - [ ] Auto-save when key added/removed
  - [ ] Debounce saves (don't save on every keystroke)
- [ ] Migration system (future-proof)
  - [ ] Version field in storage
  - [ ] Migration functions for schema changes

**Success Criteria:**
✅ Create profile → Restart app → Profile still there  
✅ Edit profile → Changes persist  
✅ Delete profile → Gone after restart  
✅ Import key → Metadata saved

---

### **PHASE A VERIFICATION TEST (DO NOT SKIP)**

Once Phase A (steps 1-7) is complete, run this test:

**Minimum Viable SSH Test:**
1. ✅ Open app
2. ✅ Click profile → Connect button
3. ✅ Terminal opens in tab
4. ✅ Type `ls` → See directory listing
5. ✅ Type `pwd` → See current directory
6. ✅ Type `echo "test"` → See output
7. ✅ Resize window → Terminal resizes correctly
8. ✅ Type `exit` or click Disconnect → Connection closes cleanly
9. ✅ No errors in console
10. ✅ Open 3 sessions simultaneously → All work independently
11. ✅ Switch between tabs → Terminal state preserved
12. ✅ Close tab → SSH disconnects, no memory leaks

**If ALL 12 pass → Phase A complete. Move to Phase B (SFTP).**

**If ANY fail → Fix before proceeding.**

  
- [ ] **Data Streaming (Renderer → Main)**
  - [ ] `ipcMain.on('ssh:data', (event, sessionId, data) => { ... })`
    - [ ] Forward to SessionManager.writeToSession()
    - [ ] This is for terminal input from xterm.js
  
- [ ] **Data Streaming (Main → Renderer)**
  - [ ] Listen to SessionManager events
  - [ ] `event.sender.send('ssh:output', sessionId, data)` - Terminal output
  - [ ] `event.sender.send('ssh:status', sessionId, status)` - Connection state
  - [ ] `event.sender.send('ssh:error', sessionId, error)` - Error messages

- [ ] **Security Validation**
  - [ ] Never trust renderer input - validate everything
  - [ ] Sanitize file paths (prevent directory traversal)
  - [ ] Rate-limit connection attempts (prevent DOS)
  - [ ] Do NOT expose node-pty, ssh2, or fs to renderer
  - [ ] Do NOT return raw error objects (leak info)

**Key Security Rules:**
- ❌ NO ipcRenderer exposed directly to renderer
- ❌ NO ssh2 or node-pty imports in renderer
- ❌ NO direct child_process.spawn access
- ✅ All SSH operations go through SessionManager
- ✅ Validate all inputs from renderer
- ✅ Return sanitized errors only

**Success Criteria:**
✅ Renderer can connect via IPC  
✅ All handlers validate inputs  
✅ Errors don't leak sensitive info  
✅ No direct access to Node.js APIs from renderer  
✅ Rate limiting prevents abuse

---

### **PHASE B: SFTP Integration (MEDIUM PRIORITY)**

#### 4. Tabby SFTP Integration
**Goal:** Wire SFTP UI to Tabby's SFTP implementation

- [ ] Research Tabby's SFTP support
  - [ ] Find SFTP client code in Tabby
  - [ ] Understand file browser implementation
  - [ ] Check transfer queue/progress tracking
- [ ] Create SFTP service layer
  - [ ] `src/services/sftp/SFTPService.ts`
  - [ ] Wrap Tabby's SFTP client
  - [ ] List files/directories
  - [ ] Upload/download files
  - [ ] Create/delete/rename operations
  - [ ] Get file permissions and modify (chmod)
- [ ] Wire SFTPManager component
  - [ ] Connect to SFTP when profile selected
  - [ ] Display remote files in right pane
  - [ ] Display local files in left pane
  - [ ] Handle navigation (cd, back button)
  - [ ] Show file icons, sizes, dates
- [ ] File operations
  - [ ] Upload: local → remote (Ctrl+→)
  - [ ] Download: remote → local (Ctrl+←)
  - [ ] Delete file (Delete key)
  - [ ] Rename file (right-click → rename)
  - [ ] Create folder (right-click → new folder)
  - [ ] Edit permissions (right-click → permissions)
- [ ] Transfer queue
  - [ ] Show active transfers in bottom panel
  - [ ] Progress bars with speed/ETA
  - [ ] Pause/resume/cancel buttons
  - [ ] Queue multiple transfers
  - [ ] Handle errors (retry logic)
- [ ] Advanced features (Phase 4)
  - [ ] Drag-and-drop files
  - [ ] Multi-selection (Ctrl+Click)
  - [ ] Resume interrupted transfers

**Success Criteria:**
✅ Browse remote filesystem  
✅ Upload/download files  
✅ See transfer progress  
✅ Create/delete/rename files  
✅ Edit permissions via UI

---

#### 5. Port Forwarding Integration
**Goal:** Connect Tunnel Manager to Tabby's forwarding

- [ ] Research Tabby's tunnel support
  - [ ] Find port forwarding implementation
  - [ ] Understand local/remote/dynamic forwards
  - [ ] Check tunnel status tracking
- [ ] Create tunnel service
  - [ ] `src/services/tunnels/TunnelService.ts`
  - [ ] Start local forward (ssh -L)
  - [ ] Start remote forward (ssh -R)
  - [ ] Start SOCKS5 proxy (ssh -D)
  - [ ] Stop tunnel
  - [ ] Get tunnel status
- [ ] Wire TunnelManager component
  - [ ] Create tunnel → call tunnel service
  - [ ] Toggle tunnel on/off
  - [ ] Show active/inactive status
  - [ ] Display local port, remote host:port
  - [ ] Handle errors (port in use, etc.)
- [ ] Tunnel persistence
  - [ ] Save tunnel configs to storage
  - [ ] Load tunnels on startup
  - [ ] Auto-start enabled tunnels (optional)

**Success Criteria:**
✅ Create local forward → Access remote service locally  
✅ Create remote forward → Expose local port to remote  
✅ Create SOCKS5 proxy → Browse via SSH tunnel  
✅ Toggle tunnels on/off  
✅ Tunnels survive app restart (if enabled)

---

### **PHASE C: Encryption & Secure Storage (HIGH PRIORITY)**

> **Architecture:** SSH metadata encrypted in local DB, private keys in OS keychain (NEVER in files/DB)

#### 6. OS Keychain Integration (CRITICAL FIRST STEP)
**Goal:** Store private keys securely using OS-native secure storage

**File:** `src/services/storage/KeychainService.ts`

- [ ] **Install keytar dependency**
  - [ ] `npm install keytar` - Industry standard for Electron keychain access
  - [ ] Supports Windows DPAPI, macOS Keychain, Linux libsecret/gnome-keyring
  
- [ ] **Keychain Service Implementation**
  - [ ] `storeKey(keyId, privateKeyContent)` → Store in OS keychain
    - [ ] Service name: "NomadSSH"
    - [ ] Account: keyId (e.g., "key-prod")
    - [ ] Secret: Full private key content
  - [ ] `getKey(keyId)` → Retrieve from OS keychain
    - [ ] Returns private key as string
    - [ ] Returns null if not found
  - [ ] `deleteKey(keyId)` → Remove from keychain
  - [ ] `listKeys()` → Get all stored key IDs
  
- [ ] **Update SSH Key Import Flow**
  - [ ] When user imports key → Read file content
  - [ ] Store content in keychain via keytar
  - [ ] Store only metadata in encrypted DB (id, name, type, fingerprint)
  - [ ] Delete temp file copy
  - [ ] Original .pem/.pub stays in user's filesystem (optional)
  
- [ ] **Update SSHService to use keychain**
  - [ ] Replace `readFile(key.path)` with `KeychainService.getKey(keyId)`
  - [ ] Key stays in memory only during connection
  - [ ] Clear key reference after connection established

**Success Criteria:**
✅ Private keys never written to app database  
✅ Keys stored in OS secure storage  
✅ SSH connection retrieves key from keychain  
✅ Keys survive app restart  
✅ Works cross-platform (Win/Mac/Linux)

---

#### 7. Master Password & Metadata Encryption
**Goal:** Encrypt connection metadata using master password

**File:** `src/services/crypto/CryptoService.ts`

- [ ] **Crypto Service Setup**
  - [ ] Install `argon2` or `scrypt` for key derivation
  - [ ] Implement master password key derivation
    - [ ] Use argon2id (recommended) or scrypt
    - [ ] Generate random salt per user
    - [ ] Derive 256-bit key from password
  - [ ] AES-256-GCM encryption/decryption
    - [ ] Encrypt: plaintext → ciphertext + IV + auth tag
    - [ ] Decrypt: ciphertext + IV + tag → plaintext
  
- [ ] **Master Password Flow**
  - [ ] First launch → Prompt to create master password
  - [ ] Store salt in electron-store (NOT the key!)
  - [ ] On unlock → Derive key from password + salt
  - [ ] Verify password by decrypting test payload
  - [ ] Clear key from memory on lock
  
- [ ] **Encrypt Connection Metadata**
  - [ ] Encrypt profiles (host, username, port, tags, groups)
  - [ ] Encrypt key metadata (name, type, fingerprint)
  - [ ] Store as `data/connections.json.enc`
  - [ ] Store as `data/keys.json.enc`
  
- [ ] **Security Measures**
  - [ ] Never log decrypted data
  - [ ] Wipe sensitive data from memory after use
  - [ ] Auto-lock on idle (configurable timeout)
  - [ ] Rate-limit password attempts (prevent brute force)
  - [ ] Constant-time password comparison

**Data Structure:**
```
~/.nomadssh/
  data/
    connections.json.enc  ← Encrypted metadata (SAFE to sync)
    keys.json.enc         ← Encrypted key metadata (SAFE to sync)
  
OS Keychain (via keytar):
    NomadSSH:key-prod → [PRIVATE KEY CONTENT]  ← NEVER synced
```

**Success Criteria:**
✅ Master password setup on first launch  
✅ All metadata encrypted at rest  
✅ Lock/unlock working  
✅ Wrong password shows error  
✅ Auto-lock after idle timeout  
✅ Private keys stay in OS keychain

---

#### 8. Encrypted Local Storage
**Goal:** Persist all data encrypted on disk

**File:** `src/services/storage/LocalStorageService.ts`

- [ ] **Storage Service Implementation**
  - [ ] Create storage directory: `~/.nomadssh/data/`
  - [ ] File structure:
    ```
    ~/.nomadssh/
      data/
        connections.json.enc
        keys.json.enc
        settings.json.enc
      meta/
        version.json (unencrypted)
        salt.bin (encryption salt)
    ```
  
- [ ] **Encrypted Storage Operations**
  - [ ] `saveProfiles(profiles)` → Encrypt + write to disk
  - [ ] `loadProfiles()` → Read + decrypt from disk
  - [ ] `saveKeys(keyMetadata)` → Encrypt + write key metadata
  - [ ] `loadKeys()` → Read + decrypt key metadata
  - [ ] Use CryptoService for all encryption
  
- [ ] **Migration System**
  - [ ] Version field in all files
  - [ ] Detect old format → migrate to new
  - [ ] Backup before migration
  - [ ] Rollback on failure
  
- [ ] **Error Handling**
  - [ ] Corrupted file → Restore from backup
  - [ ] Wrong password → Clear error message
  - [ ] Missing files → Initialize empty state

**Success Criteria:**
✅ All data encrypted on disk  
✅ Cannot read data without master password  
✅ Inspect files → No plaintext visible  
✅ Change master password → Data re-encrypted  
✅ Profile persistence works after restart

---

### **PHASE D: Cloud Sync (MEDIUM PRIORITY)**

> **Zero-Knowledge Sync:** Only encrypted metadata syncs. Private keys stay local (OS keychain).

#### 9. Google Drive Integration
**Goal:** Sync encrypted metadata to Google Drive (zero-knowledge)

**File:** `src/services/sync/GoogleDriveService.ts`

- [ ] **OAuth2 Setup**
  - [ ] Register app in Google Cloud Console
  - [ ] Get client ID and secret
  - [ ] Implement OAuth2 flow in Electron
  - [ ] Store refresh token securely in OS keychain (via keytar)
  
- [ ] **Drive API Service**
  - [ ] Upload encrypted files to Drive folder
    - [ ] `connections.json.enc` (connection metadata)
    - [ ] `keys.json.enc` (key metadata)
    - [ ] `settings.json.enc` (app preferences)
  - [ ] Download from Drive on new device
  - [ ] Check for remote changes (timestamps)
  - [ ] Handle API errors (rate limits, network issues)
  
- [ ] **Sync Logic**
  - [ ] Auto-upload on profile change (debounced)
  - [ ] Download on app startup
  - [ ] Conflict detection (local vs remote timestamps)
  - [ ] Merge strategy: Last-write-wins with manual override
  
- [ ] **Key Re-Import Flow (New Device)**
  - [ ] Download encrypted metadata from Drive → Decrypt with master password
  - [ ] Detect missing private keys
  - [ ] Show prompt: "⚠️ SSH keys not found on this device"
  - [ ] Options: Import existing .pem, Generate new, Link to different keyId, Skip
  
- [ ] **Conflict Resolution UI**
  - [ ] Modal when conflict detected
  - [ ] Display: Local vs Remote (connection count, last modified)
  - [ ] User choice: Keep local, Keep remote, Manual merge
  
- [ ] **Sync Status**
  - [ ] States: Idle / Syncing / Success / Error
  - [ ] Show last sync time
  - [ ] Manual sync button
  - [ ] Auto-sync toggle in settings

**What Gets Synced:**
```
✅ SYNCED (Encrypted):
  - connections.json.enc (host, port, username, tags)
  - keys.json.enc (key metadata: name, type, fingerprint)
  - settings.json.enc (app preferences)

❌ NEVER SYNCED:
  - Private keys (stay in OS keychain)
  - Master password (never leaves device)
```

**Success Criteria:**
✅ Connect Google Drive → OAuth working  
✅ Create profile → Syncs to Drive  
✅ New device → Download + decrypt metadata  
✅ Keys missing → Prompt re-import  
✅ Conflict → User resolves  
✅ Offline → Graceful degradation  
✅ Zero-knowledge: Google never sees plaintext

---

### **PHASE E: Command & Connection History (LOW PRIORITY)**

#### 9. Command History Logging
**Goal:** Capture and log executed commands

- [ ] Hook into Tabby terminal
  - [ ] Listen for command execution events
  - [ ] Parse command text (detect Enter key)
  - [ ] Capture exit code (if available)
  - [ ] Measure execution duration
- [ ] Store command history
  - [ ] Save to CommandHistory state
  - [ ] Persist to local storage (encrypted)
  - [ ] Limit history size (e.g., last 1000 commands)
- [ ] Wire CommandHistoryManager
  - [ ] Already built UI ✅
  - [ ] Populate with real data
  - [ ] Test filters and search
  - [ ] Re-run command → paste to active terminal

**Success Criteria:**
✅ Execute command → Shows in history  
✅ Search history by text  
✅ Filter by profile, status  
✅ Re-run command from history

---

#### 10. Connection History
**Goal:** Track SSH connection attempts and sessions

- [ ] Create ConnectionHistory type
  - [ ] Connection start/end timestamps
  - [ ] Duration
  - [ ] Success/failure status
  - [ ] Disconnect reason
  - [ ] Data transferred (if available)
- [ ] Track connections
  - [ ] Log when SSH connection starts
  - [ ] Log when SSH connection ends
  - [ ] Update profile.lastConnected
  - [ ] Store in history - Day 1
**Goal: SSH + PTY service working**

1. **Install node-pty** (5 minutes)
   ```powershell
   npm install node-pty
   npm install --save-dev @types/node-pty
   ```

2. **Create SSH Service** (3-4 hours)
   - File: `src/services/ssh/SSHService.ts`
   - Implement SSHConnection class
   - ssh2 Client + node-pty bridge
   - Bidirectional streaming (SSH ↔ PTY)
   - Test with console.log (no UI yet)

3. **Create Session Manager** (2-3 hours)
   - File: `src/services/ssh/SessionManager.ts`
   - Map<sessionId, SSHConnection>
   - createSession, closeSession, resizeSession methods
   - Test creating multiple sessions

### Tomorrow (Dec 27, 2025) - Day 2
**Goal: IPC + Preload working**

4. **Create IPC Handlers** (3-4 hours)
   - File: `electron/ipc/sshIPC.ts`
   - ssh:connect, ssh:disconnect, ssh:resize handlers
   - Forward data to SessionManager
   - Test with Electron DevTools (ipcRenderer.invoke)

5. **Create Preload API** (2-3 hours)
   - File: `electron/preload.ts` (update existing)
   - Expose window.nomad.ssh via contextBridge
   - Create TypeScript types (electron.d.ts)
   - Test API available in renderer console

### Day 3 (Dec 28, 2025)
**Goal: Terminal UI working**

6. **Create useTerminal Hook** (4-5 hours)
   - File: `src/hooks/useTerminal.ts`
   - Initialize xterm.js
   - Connect to SSH via window.nomad.ssh
   - Handle input/output/resize
   - Test in Terminal.tsx component

7. **Wire ProfileManager** (2-3 hours)
   - Update handleConnectProfile in App.tsx
   - Create session on connect
   - Switch to terminal view
   - Test end-to-end: Click → Connect → Type commands

### Day 4-5 (Dec 29-30, 2025)
**Goal: Complete Phase A**

8. **Profile Storage** (3-4 hours)
   - Implement LocalStorageService
   - Save/load profiles with electron-store
   - Test persistence across restarts

9. **Bug Fixes & Polish** (4-6 hours)
   - Fix any connection issues
   - Handle edge cases (timeouts, errors)
   - Improve error messages
   - Run Phase A verification test (all 12 steps)

### This Week (Dec 26-31, 2025)
**Deliverable: Phase A Complete**
- ✅ SSH connections working end-to-end
- ✅ Multiple sessions in tabs
- ✅ Terminal I/O functional
- ✅ Profile persistence working
- ✅ All 12 verification tests passing
- [ ] Detect available shells
  - [ ] Windows: PowerShell, CMD, Git Bash, WSL
  - [ ] macOS/Linux: bash, zsh, fish
- [ ] Create local terminal session
  - [ ] New button in TopBar or sidebar
  - [ ] Spawn local shell process
  - [ ] Connect to xterm.js
  - [ ] Working directory: user home or last used
- [ ] Session management
  - [ ] Mix local and remote tabs
  - [ ] Close local terminal → kill process
  - [ ] Handle process exit gracefully

**Success Criteria:**
✅ Open local terminal in tab  
✅ Execute local commands  
✅ Multiple local terminals  
✅ Mix local + SSH sessions

---

#### 12. Toast Notifications
**Goal:** User feedback for actions

- [ ] Toast notification component
  - [ ] `src/components/ui/Toast.tsx`
  - [ ] Bottom-right corner
  - [ ] Auto-dismiss after 3-5 seconds
  - [ ] Success, error, info, warning variants
  - [ ] Stack multiple toasts
- [ ] Integrate throughout app
  - [ ] "Profile saved successfully"
  - [ ] "Connected to server"
  - [ ] "Sync complete"
  - [ ] "Key imported"
  - [ ] "Connection failed: [reason]"
- [ ] Notification queue
  - [ ] Don't spam user with many toasts
  - [ ] Consolidate similar notifications

**Success Criteria:**
✅ Action → Toast appears  
✅ Auto-dismiss after delay  
✅ Multiple toasts stack  
✅ Not annoying

---

#### 13. Empty States & Loading
**Goal:** Better UX for edge cases

- [ ] Empty states
  - [ ] No profiles: "Create your first connection!"
  - [ ] No keys: "Import or generate an SSH key"
  - [ ] No snippets: "Add command snippets to save time"
  - [ ] No history: "Your command history will appear here"
- [ ] Loading states
  - [ ] Connecting to SSH: spinner + timeout
  - [ ] Syncing profiles: progress bar
  - [ ] Loading profiles: skeleton UI
- [ ] Error states
  - [ ] Connection timeout: actionable error message
  - [ ] Sync failed: show reason + retry button
  - [ ] File transfer failed: what went wrong

**Success Criteria:**
✅ First-time user sees helpful empty states  
✅ Loading states show progress  
✅ Errors are clear and actionable

---

#### 14. Keyboard Shortcuts
**Goal:** Power user productivity

- [ ] Global shortcuts
  - [ ] Ctrl+T: New local terminal
  - [ ] Ctrl+W: Close active tab
  - [ ] Ctrl+Tab / Ctrl+Shift+Tab: Next/prev tab
  - [ ] Ctrl+K: Command palette (already ✅)
  - [ ] Ctrl+Shift+K: Open snippets
  - [ ] Ctrl+Shift+H: Command history
  - [ ] Ctrl+L: Lock app
- [ ] Document shortcuts
  - [ ] Settings panel: Keyboard Shortcuts section
  - [ ] Show in tooltips
  - [ ] Customizable shortcuts (future)

**Success Criteria:**
✅ All major actions have shortcuts  
✅ Shortcuts work consistently  
✅ No conflicts with Tabby shortcuts

---

#### 15. Right-Click Context Menus
**Goal:** Discoverable actions

- [ ] Profile context menu
  - [ ] Connect, Edit, Duplicate, Delete
  - [ ] Pin/Unpin
  - [ ] Move to group
  - [ ] Export (future)
- [ ] Session tab context menu
  - [ ] Rename session
  - [ ] Duplicate session (new connection)
  - [ ] Close, Close others, Close all
- [ ] SFTP file context menu
  - [ ] Download, Upload, Delete, Rename
  - [ ] Edit permissions
  - [ ] Copy path
  - [ ] Open in external editor (future)
- [ ] Terminal context menu
  - [ ] Copy, Paste
  - [ ] Select all
  - [ ] Clear screen
  - [ ] Export output (future)

**Success Criteria:**
✅ Right-click anywhere → Relevant menu  
✅ All actions work  
✅ Keyboard shortcuts shown in menu

---

## 🛠️ Technical Debt & Refactoring

### Code Quality
- [ ] Add PropTypes or Zod validation for component props
- [ ] Extract magic strings to constants
- [ ] Add JSDoc comments to services
- [ ] Consistent error handling pattern
- [ ] Logging service for debugging

### Testing
- [ ] Unit tests for crypto service (critical!)
- [ ] Unit tests for storage service
- [ ] Integration tests for SSH connection flow
- [ ] E2E tests for critical user journeys
  - [ ] Create profile → Connect → Execute command
  - [ ] Create master password → Lock → Unlock
  - [ ] Sync to Drive → Install on new machine → Restore

### Performance
- [ ] Profile list pagination/virtualization (1000+ profiles)
- [ ] Command history pagination
- [ ] Optimize re-renders (React.memo, useCallback)
- [ ] Lazy load screens (React.lazy)
- [ ] Profile image caching (if we add profile pictures)

### Accessibility
- [ ] Keyboard navigation for all modals
- [ ] ARIA labels for icon buttons
- [ ] Focus management (modal open → focus input)
- [ ] Screen reader announcements for status changes
- [ ] High contrast mode support

---

## 🚀 Phase 4: Advanced Features (FUTURE)

### Team Features
- [ ] Shared vault (team profiles)
- [ ] Role-based access control
- [ ] Audit logs (who accessed what)
- [ ] Team sync (shared Google Drive folder)

### Enterprise
- [ ] Jump host / bastion support
- [ ] SSH agent forwarding
- [ ] Session recording (playback terminal sessions)
- [ ] Multi-factor authentication
- [ ] Hardware key support (YubiKey)
- [ ] LDAP/Active Directory integration

### Power Features
- [ ] Split terminal views (2x2 grid)
- [ ] Broadcast mode (type in all terminals)
- [ ] Custom themes
- [ ] Plugin system (extend with custom code)
- [ ] Scripting/automation (run commands on multiple servers)
- [ ] Serial port support (for network equipment)

### Integrations
- [ ] 1Password / Bitwarden integration
- [ ] Ansible playbook execution
- [ ] Docker container SSH
- [ ] Kubernetes pod exec
- [ ] AWS EC2 instance connect
- [ ] Azure VM SSH

---

## 📝 Documentation TODO

### User Documentation
- [ ] Installation guide (Windows/macOS/Linux)
- [ ] Getting started tutorial
- [ ] Master password best practices
- [ ] SSH key management guide
- [ ] Cloud sync setup (Google Drive)
- [ ] Troubleshooting common issues
- [ ] FAQ

### Developer Documentation
- [ ] Architecture overview
- [ ] Tabby integration guide
- [ ] Contributing guide (already started ✅)
- [ ] Encryption implementation details
- [ ] API documentation (if we build one)
- [ ] Plugin development guide (future)

### Code Documentation
- [ ] README.md improvements
- [ ] CHANGELOG.md
- [ ] LICENSE attribution (Tabby MIT)
- [ ] Security policy (reporting vulnerabilities)

---

## 🔒 Security Audit TODO

### Before Public Release
- [ ] Third-party security audit of crypto code
- [ ] Penetration testing
- [ ] Code review by security experts
- [ ] Dependency vulnerability scan (npm audit)
- [ ] Supply chain security (verify packages)

### Ongoing
- [ ] Regular dependency updates
- [ ] Security advisory monitoring
- [ ] Bug bounty program (future)
- [ ] Responsible disclosure policy

---

## 📦 Packaging & Distribution

### Build System
- [ ] Electron Builder configuration
- [ ] Code signing certificates (Windows, macOS)
- [ ] Auto-update mechanism
- [ ] Crash reporting (Sentry or similar)
- [ ] Analfrom scratch** - Using ssh2 + node-pty, inspired by Tabby's architecture patterns
- **Clean separation** - Core services (main) → IPC → UI (renderer)
- **Zero-knowledge** - Cloud provider never sees plaintext
- **Privacy-first** - No telemetry without user consent
- **Open source** - MIT license, fully auditable
- **Security by design* vs Competitors
- **Encrypted cloud sync** - vs Termius paid subscription ($10/mo)
- **Self-hosted** - Your own Google Drive, no vendor lock-in
- **Open source** - vs Termius/SecureCRT proprietary code
- **Visual organization** - Groups, tags, custom icons, colors
- **Power user features** - Command snippets, history, palette, auto-key selection
- **Zero-knowledge encryption** - Even we can't see your data
- **Built for devops** - Not just SSH, but SFTP + tunnels + snippets in one tool
### Distribution Channels
- [ ] GitHub Releases
- [ ] Windows: Microsoft Store, Chocolatey, Scoop
- [ ] macOS: Homebrew Cask, App Store (maybe)
- [ ] Linux: Snap, Flatpak, AppImage, AUR

---
🛡️ CRITICAL IMPLEMENTATION RULES (DO NOT BREAK)

### Architecture Rules (Enforce Strictly)
✅ **ALLOWED:**
- ssh2 in main process only
- node-pty in main process only
- IPC handlers in main process
- window.nomad.ssh API in renderer
- xterm.js in renderer
- React components in renderer

❌ **FORBIDDEN:**
- ssh2 or node-pty in renderer (NEVER)
- ipcRenderer exposed directly (use contextBridge)
- Direct fs access from renderer
- child_process.spawn in renderer
- Sensitive data in renderer without encryption
- Private keys in renderer memory

### Security Rules (Non-Negotiable)
- ALL renderer input must be validated in main process
- NO raw error objects returned to renderer (leak info)
- NO private keys stored unencrypted
- NO credentials logged to console
- Rate-limit connection attempts (prevent DOS)
- Sanitize file paths (prevent directory traversal)

### Code Quality Rules
- TypeScript strict mode enabled
- ESLint + Prettier enforced
- All IPC handlers return { success, data?, error? }
- All Promises have error handling
- Cleanup listeners on unmount (prevent memory leaks)

**If any rule is violated → Reject PR immediately.**

---

## 🤝 Contribution Guidelines

### Getting Started
1. Read CONTRIBUTING.md
2. Set up dev environment (`npm install`, `npm run dev`)
3. Pick a task from this TODO
4. Create issue on GitHub (describe what you'll work on)
5. Fork, branch, implement, test, PR

### Code Standards
- TypeScript strict mode (no `any` types)
- ESLint + Prettier (run `npm run lint` before commit)
- Meaningful commit messages (Conventional Commits format)
- Tests for new features (especially crypto, SSH, storage)
- Update docs (this TODO, README, inline comments)

### Review Process
- PR requires 1 approval
- All tests pass (run `npm test`)
- No security issues (follow rules above)
- Code quality checks pass (ESLint, TypeScript compiler)
- Complete Phase A.1: SSH Connection Integration
- Start Phase A.2: Session Management
- Basic connection working end-to-end

### This Month (January 2026)
- Complete Phase A (Tabby Integration Basics)
- Complete Phase B (SFTP & Port Forwarding)
- Start Phase C (Encryption Layer)

### Q1 2026
- Complete Phase C (Encryption)
- Complete Phase D (Cloud Sync)
- Alpha release for testing

### Q2 2026
- Complete Phase E (History Features)
- Complete Phase F (Polish)
- Security audit
- Beta release

### Q3 2026
- Bug fixes, stability
- Documentation
- 1.0 Public Release

---

## 💡 Notes & Reminders

### Design Decisions
- **Built from scratch** - Using ssh2 + node-pty, inspired by Tabby architecture
- **Zero-knowledge sync** - Cloud (Google Drive) never sees plaintext
- **OS keychain for keys** - Private keys in DPAPI/Keychain/libsecret (keytar)
- **Master password** - Derives encryption key (argon2 + AES-256-GCM)
- **Metadata to cloud** - Only encrypted metadata syncs, keys stay local
- **Re-import on new device** - Same UX as 1Password/Bitwarden
- **Privacy-first** - No telemetry without user consent
- **Open source** - MIT license, fully auditable

### Storage Architecture
```
~/.nomadssh/
  data/
    connections.json.enc  ← Encrypted (SYNCED to cloud)
    keys.json.enc         ← Metadata only (SYNCED)
  meta/
    salt.bin              ← For key derivation

OS Keychain (via keytar):
  NomadSSH:key-prod → [PRIVATE KEY CONTENT]  ← NEVER synced

Connection: Metadata (encrypted) + Key (OS keychain) → SSH
```

### Key Differentiators
- Encrypted cloud sync (vs Termius subscription)
- Self-hosted option (own Google Drive)
- Open source (vs proprietary)
- Visual organization (groups, tags, icons)
- Power user features (snippets, history, command palette)

### Success Metrics
- **Technical:** App works reliably for daily SSH use
- **Security:** No data leaks, encryption works correctly
- **UX:** Faster than copying SSH config files manually
- **Community:** Active contributors, bug reports, feature requests

---

## 🤝 Contribution Guidelines

### Getting Started
1. Read CONTRIBUTING.md
2. Set up dev environment
3. Pick a task from this TODO
4. Create issue on GitHub
5. Fork, branch, implement, test, PR

### Code Standards
- TypeScript strict mode
- ESLint + Prettier
- Meaningful commit messages
- Tests for new features
- Update docs

### Review Process
- PR requires 1 approval
- All tests pass
- No security issues
- Code quality checks pass

---

**End of TODO.md**

*This is a living document. Update it as tasks are completed, priorities change, or new requirements emerge.*
