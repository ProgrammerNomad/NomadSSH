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

### **PHASE A: Tabby Integration Basics (HIGH PRIORITY)**

#### 1. SSH Connection Integration
**Goal:** Connect ProfileManager to Tabby's SSH engine

- [ ] Research Tabby's SSH connection API
  - [ ] Find connection manager/service in Tabby source
  - [ ] Identify how Tabby creates SSH sessions
  - [ ] Understand session lifecycle (connect, disconnect, reconnect)
  - [ ] Find terminal tab management code
- [ ] Create SSH service adapter layer
  - [ ] `src/services/ssh/SSHConnectionService.ts` - Wrapper around Tabby's SSH
  - [ ] Map our SSHProfile type to Tabby's connection format
  - [ ] Handle authentication (password vs key)
  - [ ] Support "auto" key selection (try all keys sequentially)
- [ ] Wire ProfileManager → SSH Service
  - [ ] `handleConnectProfile()` calls SSH service
  - [ ] Create new session on successful connection
  - [ ] Add session to state
  - [ ] Switch to terminal view
  - [ ] Show connection errors (toast or modal)
- [ ] Update Terminal component
  - [ ] Pass Tabby terminal instance to Terminal component
  - [ ] Render active SSH session
  - [ ] Handle terminal I/O from Tabby
  - [ ] Test basic SSH commands

**Success Criteria:**
✅ Click profile → Opens SSH terminal  
✅ Type commands → Execute on remote server  
✅ See output in terminal  
✅ Disconnect button works

---

#### 2. Session Management
**Goal:** Multi-tab SSH sessions working properly

- [ ] Session lifecycle
  - [ ] Create session object when connecting
  - [ ] Track active sessions in App.tsx state
  - [ ] Update session status (connecting, connected, disconnected)
  - [ ] Handle connection failures gracefully
- [ ] Session tabs
  - [ ] Show active session in TopBar tabs
  - [ ] Switch between sessions
  - [ ] Close session → disconnect SSH
  - [ ] Update profile.lastConnected timestamp
- [ ] Terminal multiplexing
  - [ ] Render correct terminal for active session
  - [ ] Preserve terminal state when switching tabs
  - [ ] Handle terminal resize (FitAddon)
- [ ] Auto-reconnect (optional enhancement)
  - [ ] Detect connection drops
  - [ ] Prompt user to reconnect
  - [ ] Retry logic with exponential backoff

**Success Criteria:**
✅ Multiple SSH sessions in tabs  
✅ Switch between sessions without losing state  
✅ Close tab → SSH disconnects properly  
✅ No memory leaks

---

#### 3. Profile Storage & Loading
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

### **PHASE C: Encryption Layer (HIGH PRIORITY)**

#### 6. Master Password Encryption
**Goal:** Implement zero-knowledge encryption

- [ ] Crypto service
  - [ ] `src/services/crypto/CryptoService.ts`
  - [ ] PBKDF2 key derivation (100k iterations)
  - [ ] AES-256-GCM encryption
  - [ ] Generate random salt per user
  - [ ] Secure IV generation per encryption
- [ ] Master password flow
  - [ ] Hash password with PBKDF2 → derive encryption key
  - [ ] Store salt in electron-store (NOT the key!)
  - [ ] Verify password on unlock (decrypt test data)
  - [ ] Clear key from memory on lock
- [ ] Encrypt profiles
  - [ ] Encrypt profile data before saving
  - [ ] Decrypt profiles on app unlock
  - [ ] Handle decryption errors (wrong password)
- [ ] Encrypt SSH key paths
  - [ ] Don't store actual private keys
  - [ ] Encrypt key metadata (path, name, fingerprint)
  - [ ] Keys stay in filesystem (user manages them)
- [ ] Security considerations
  - [ ] Never log decrypted data
  - [ ] Clear sensitive data from memory
  - [ ] Implement auto-lock on idle
  - [ ] Rate-limit password attempts

**Success Criteria:**
✅ Create master password → Data encrypted at rest  
✅ Lock app → Data inaccessible  
✅ Unlock with password → Data decrypted  
✅ Wrong password → Error, no data leak  
✅ Auto-lock after idle timeout

---

#### 7. Encrypted Storage
**Goal:** All data encrypted before writing to disk

- [ ] Update LocalStorageService
  - [ ] Encrypt before writing
  - [ ] Decrypt after reading
  - [ ] Handle encryption errors
  - [ ] Fallback to unencrypted (migration from old data)
- [ ] Encrypted data structure
  - [ ] Store encrypted blob + salt + IV
  - [ ] Version field for future migrations
  - [ ] Integrity check (HMAC or GCM tag)
- [ ] Key rotation (future)
  - [ ] Allow user to change master password
  - [ ] Re-encrypt all data with new key
  - [ ] Atomic operation (don't lose data if it fails)

**Success Criteria:**
✅ All profile data encrypted on disk  
✅ Cannot read data without master password  
✅ Inspect electron-store file → No plaintext  
✅ Change master password → Data re-encrypted

---

### **PHASE D: Cloud Sync (MEDIUM PRIORITY)**

#### 8. Google Drive Integration
**Goal:** Sync encrypted data to Google Drive

- [ ] OAuth2 setup
  - [ ] Register app in Google Cloud Console
  - [ ] Get client ID and secret
  - [ ] Implement OAuth2 flow in Electron
  - [ ] Store refresh token securely
- [ ] Drive API service
  - [ ] `src/services/sync/GoogleDriveService.ts`
  - [ ] Upload encrypted blob to Drive
  - [ ] Download blob from Drive
  - [ ] Check for remote changes (polling or webhooks)
  - [ ] Handle API errors (rate limits, network issues)
- [ ] Sync logic
  - [ ] Upload on profile change (debounced)
  - [ ] Download on app startup
  - [ ] Detect conflicts (local vs remote changes)
  - [ ] Merge strategy (last-write-wins or manual)
- [ ] Conflict resolution UI
  - [ ] Show modal when conflict detected
  - [ ] Display local vs remote versions
  - [ ] Let user choose which to keep
  - [ ] Option to merge manually
- [ ] Sync status
  - [ ] Idle / Syncing / Success / Error
  - [ ] Show last sync time
  - [ ] Manual sync button
  - [ ] Auto-sync toggle in settings

**Success Criteria:**
✅ Connect Google Drive account  
✅ Create profile → Syncs to Drive  
✅ Install on new machine → Download profiles  
✅ Conflict detected → User can resolve  
✅ Network offline → Graceful degradation

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
  - [ ] Store in history state
- [ ] Connection History UI
  - [ ] New screen: ConnectionHistoryManager
  - [ ] Timeline view (day/week)
  - [ ] Filter by profile, date, status
  - [ ] Show connection details (duration, reason)
- [ ] Add to TopBar menu

**Success Criteria:**
✅ Connect to server → Logged in history  
✅ Disconnect → Duration recorded  
✅ View timeline of connections  
✅ Filter by date range

---

### **PHASE F: Polish & Enhancements (LOW PRIORITY)**

#### 11. Local Terminal
**Goal:** Open local PowerShell/Bash tabs

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
- [ ] Analytics (privacy-respecting)

### Release Process
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Automated builds for all platforms
- [ ] Version numbering (semantic versioning)
- [ ] Release notes generation
- [ ] Beta testing channel

### Distribution Channels
- [ ] GitHub Releases
- [ ] Windows: Microsoft Store, Chocolatey, Scoop
- [ ] macOS: Homebrew Cask, App Store (maybe)
- [ ] Linux: Snap, Flatpak, AppImage, AUR

---

## 🎯 Next Immediate Actions

### Today (Dec 26, 2025)
1. **Research Tabby SSH API** (2-3 hours)
   - Clone Tabby repo
   - Find SSH connection code
   - Identify entry points
   - Document findings

2. **Create SSH Service Adapter** (3-4 hours)
   - `src/services/ssh/SSHConnectionService.ts`
   - Basic connect/disconnect
   - Map SSHProfile → Tabby connection

3. **Wire First Connection** (2-3 hours)
   - Update `handleConnectProfile` in App.tsx
   - Test with real SSH server
   - Fix bugs, iterate

### This Week
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
- **Built on Tabby** - Don't reinvent SSH, leverage mature codebase
- **Zero-knowledge** - Cloud provider never sees plaintext
- **Privacy-first** - No telemetry without user consent
- **Open source** - MIT license, fully auditable

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
