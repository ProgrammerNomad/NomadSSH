# NomadSSH UI Development Tasks

## Completed Features ✅

### Core Layout & Navigation
- ✅ **Global App Shell** - Desktop layout with VS Code-inspired structure
- ✅ **Top Bar** - Session tabs, quick actions, status indicator
- ✅ **Left Sidebar** - Collapsible (64px expanded / 14px collapsed)
- ✅ **Bottom Status Bar** - Fixed 24px height
- ✅ **Main Content Area** - Proper overflow handling

### Authentication & Security
- ✅ **Master Password Modal** - Create/unlock modes
- ✅ **Password Strength Indicator** - 5 levels with visual bar
- ✅ **Password Requirements Checklist** - Real-time validation
- ✅ **App Lock State Management** - Full-screen blocking when locked

### Profile Management
- ✅ **Profile Manager Modal** - Form with validation (name, host, port, username, auth method, key selection, tags)
- ✅ **Profile List in Sidebar** - Connection status indicators
- ✅ **Profile Tags Display** - Comma-separated tags
- ✅ **Form Validation** - Required fields, port range 1-65535

### SSH Key Management
- ✅ **SSH Key Manager Screen** - Full-screen key management interface
- ✅ **Key List Display** - Name, type badge, fingerprint (SHA256), path, creation date
- ✅ **Import Existing Key** - Modal with file path input
- ✅ **Generate New Key** - Modal with type selector (ED25519, RSA, ECDSA) and bits
- ✅ **Delete Key** - Confirmation dialog before deletion
- ⬜ **Key Groups** - Organize keys by security context (see Phase 2 refinements)

### Settings
- ✅ **Settings Panel** - Multiple sections (Security, Preferences, Terminal, About)
- ✅ **Change Master Password** - Reuses MasterPasswordModal
- ✅ **Lock on Idle** - Toggle with timeout selector (5-60 mins)
- ✅ **Default Shell Selector** - Bash, Zsh, Fish, Sh, PowerShell
- ✅ **Theme Selector** - Dark (light coming soon)
- ✅ **Terminal Settings** - Font size (12-18px), cursor style (Block, Underline, Bar)
- ✅ **About Section** - Version, Tabby attribution, MIT license, GitHub link

### Cloud Sync
- ✅ **Cloud Sync Settings Screen** - Full-featured sync management
- ✅ **Zero-Knowledge Encryption Notice** - Shield icon with security explanation
- ✅ **Google Drive Integration** - Provider connection UI
- ✅ **Sync Status Indicator** - Real-time status (idle/syncing/success/error)
- ✅ **Last Sync Time** - Relative time formatting (e.g., "5 minutes ago")
- ✅ **Manual Sync Button** - Trigger sync on demand
- ✅ **Sync Options** - Auto-sync on changes, sync keys toggle, sync on startup
- ✅ **Reset Sync** - Confirmation modal with danger zone styling

### Port Forwarding
- ✅ **Tunnel Manager Screen** - Card-based tunnel list
- ✅ **Add/Edit Tunnel Modal** - Name, type, ports, destination with validation
- ✅ **Tunnel Types** - Local Forward, Remote Forward, Dynamic (SOCKS5)
- ✅ **Type Badge Color Coding** - Green (local), Blue (remote), Yellow (dynamic)
- ✅ **Enable/Disable Toggle** - Per tunnel control
- ✅ **Delete Tunnel** - Confirmation dialog
- ✅ **Info Banner** - Explains each tunnel type in modal

### Terminal
- ✅ **Terminal Component** - xterm.js with FitAddon and WebLinksAddon
- ✅ **Dark Theme** - VS Code color scheme (background: #1e1e1e)
- ✅ **Font Configuration** - Cascadia Code, Fira Code, Consolas fallbacks
- ✅ **Terminal Area Container** - Session management and routing
- ✅ **Multiple Sessions** - Support for multiple concurrent SSH connections
- ✅ **Session Tabs** - In TopBar with close buttons (X icon)
- ✅ **Empty State** - "No Active Session" message with terminal icon
- ✅ **Profile Click Handler** - Sidebar click → create session → open terminal

---

## Termius-Inspired Features to Add

### High Priority - Key Groups (Security Context)

#### ⬜ SSH Key Groups
**Concept:** Group keys by security/usage context, NOT file-system folders.

**Default Groups (suggestions):**
- 🖥 **Workstation** - Personal laptop/desktop keys
- 🏢 **Office** - Company-issued keys
- 👤 **Personal** - Personal projects/hobby servers
- 🧑‍💼 **Client** - Client-specific keys (per-client isolation)
- 🔐 **Temporary** - Short-lived keys for testing

**Rules:**
- Groups are optional (default: "Personal")
- Flat structure - NO nested groups
- Collapsible group headers
- Keys can be moved between groups
- One primary group per key
- Plain text group names (no icons in data, only UI)

**UI Design:**
```
🔑 SSH Keys
┌─────────────────────────────────────────┐
│ ▼ Workstation                     [Edit] │
├─────────────────────────────────────────┤
│ laptop-main    ED25519  SHA256:xx:aa... │
│ laptop-backup  RSA      SHA256:xx:bb... │
├─────────────────────────────────────────┤
│ ▼ Client                          [Edit] │
├─────────────────────────────────────────┤
│ client-acme    ED25519  SHA256:xx:cc... │
│ client-zen     ED25519  SHA256:xx:dd... │
├─────────────────────────────────────────┤
│ [+ Import Key]  [+ Generate]  [+ Group] │
└─────────────────────────────────────────┘
```

**Key Selection in Profile Form:**
When adding SSH profile, key dropdown becomes grouped:
```
Select SSH Key                    [▼]
┌─────────────────────────────────┐
│ ▼ Client                        │
│   · client-acme (ED25519)       │
│   · client-zen (ED25519)        │
│ ▼ Personal                      │
│   · laptop-main (ED25519)       │
└─────────────────────────────────┘
```

**Why This Matters:**
- ✅ Prevents using wrong key on wrong server (security)
- ✅ Mirrors mental models (workstation vs client keys)
- ✅ Reduces cognitive load (grouped dropdown)
- ✅ Professional UX (like AWS profiles, SSH config)

**Implementation Tasks:**
- ⬜ Add `group` field to SSHKey type (string, optional, default: "Personal")
- ⬜ Create `KeyGroupHeader` component (collapsible)
- ⬜ Update `KeyList` to render by groups
- ⬜ Add "Manage Groups" modal (create, rename, delete)
- ⬜ Update key import/generate forms with group selector
- ⬜ Update `ProfileManager` key dropdown to show grouped select
- ⬜ Add "Move to Group" action in key context menu

---

### High Priority - Profile Organization (Tags vs Groups)

#### ⬜ Profile Tags (Already Implemented - Just Enhance)
**Current:** Profiles have comma-separated tags.

**Enhancement Needed:**
- Tag autocomplete (suggest existing tags)
- Tag filter in sidebar (click tag to filter)
- Tag colors (auto-assign based on tag name hash)
- Predefined tag suggestions: `prod`, `staging`, `dev`, `client-acme`, `client-xyz`

**Key Insight:** 
- **Keys** = Groups (security context: who owns this key?)
- **Profiles** = Tags (environment context: what type of server is this?)

**Example:**
```
Profile: "ACME Prod DB"
- Tags: prod, database, client-acme
- Key: client-acme (from "Client" group)

Profile: "Personal Blog"
- Tags: personal, web
- Key: laptop-main (from "Personal" group)
```

---

### Medium Priority - Host Groups (Visual Organization)

#### ⬜ Host Groups (Optional, Later Phase)
After key groups and profile tags are solid, add visual host groups:
- Group profiles into folders (like Termius screenshot)
- Example: "Admins" (23 hosts), "Production" (12 hosts)
- This is purely organizational UI, not security
- Drag-and-drop profiles between groups
- Group cards with icon and host count

**Why Later:** Keys and tags solve 80% of organization needs. Host groups are polish.

#### ⬜ Visual Host Cards
Replace simple sidebar list with rich cards:
- **Circular Icon** - Custom color/emoji per host (like Termius)
- **Host Name Prominently** - Bold, easy to scan
- **Tags as Chips** - Visual badges (ssh, admin, personal, prod, dev, cash, db)
- **Quick Actions on Hover** - Connect, Edit, Duplicate, Delete
- **Connection Status** - Prominent colored dot
- **Last Connected** - Show relative time

**Implementation:**
- Create `HostCard.tsx` component
- Update Sidebar to use card layout instead of plain list
- Add icon picker modal for profile customization

#### ⬜ Host Details Panel
Right-side panel when host selected (not modal):
- **Address Section** - IP/hostname with OS icon (Linux penguin, Ubuntu, etc.)
- **General Section** - Display name, description, tags editor
- **SSH Configuration** - Port, keep-alive settings
- **Credentials Section** - Username, password (masked), key dropdown
- **Tunnel Presets** - Quick access to saved tunnels for this host
- **Large Connect Button** - Bottom of panel, always visible

**Why Important:** Reduces modal fatigue. Keep context visible while editing.

---

### High Priority - Command Snippets

#### ⬜ Snippets Manager
New dedicated screen (add "Snippets" to sidebar navigation):
- **Snippet List** - Cards showing name and command preview
- **RUN Button** - Execute command immediately in active terminal
- **PASTE Button** - Insert command into terminal without executing
- **Add Snippet Modal** - Name, command, optional description
- **Edit/Delete Actions** - Per snippet management

**Example Snippets (like Termius screenshot):**
- `sudo kill -9 ps axlgrep 'coreaudio[a-z...'`
- `cd /home`
- `echo "Hello, world"`
- `echo $SSH_CONNECTION` (Show IP Address)
- `rm -rf ~/.Library/Application\ Suppor...` (Remove Config)
- `ls -l`

#### ⬜ Snippet Categories
- **Auto-categorize** - System, Network, Docker, Git, Database
- **User-defined Categories** - Custom folders
- **Tags** - Multiple tags per snippet for filtering

#### ⬜ Snippet Variables
Support placeholder replacement:
- `${HOST}` - Current host IP/name
- `${USER}` - Current username
- `${PORT}` - SSH port
- `${CUSTOM}` - Prompt for user input on run
- `${CLIPBOARD}` - Paste clipboard content

**Example:**
```bash
ssh -L ${PORT}:localhost:${PORT} ${USER}@${HOST}
```

#### ⬜ Quick Snippet Access
- **Keyboard Shortcut** - Ctrl+Shift+S to open snippet picker
- **Search Bar** - Filter by name, command, or tag
- **Recent Snippets** - Show last 5 used at top

---

### Medium Priority - SFTP Enhanced

#### ⬜ Dedicated SFTP Screen
Not just right panel toggle - full-screen option:
- **Accessible from Sidebar** - "SFTP" as dedicated nav item
- **Dual-Pane Layout** - Left: Local files, Right: Remote files
- **Breadcrumb Navigation** - Path navigation at top of each pane
- **File Browser** - Icons for file types, size, modified date

#### ⬜ File Operations
- **Drag-and-Drop** - Drag files between panes or from OS
- **Upload/Download** - With progress bars
- **Transfer Queue** - Show multiple transfers with pause/cancel
- **Resume Support** - For large files (track partial transfers)
- **Permissions Editor** - chmod via UI (checkboxes for rwx)

#### ⬜ File Browser Features
- **Sorting** - By name, size, date (click column headers)
- **Search** - Find files in current directory
- **Right-Click Menu** - Rename, Delete, Permissions, Download/Upload, New Folder
- **Keyboard Shortcuts** - Enter to open, Delete to remove, F2 to rename
- **Selection** - Ctrl+Click for multiple files

---

### Low Priority - History & Search

#### ⬜ Command History
Searchable log of all executed commands:
- **Full Command Text** - What was executed
- **Timestamp** - When it ran
- **Session/Profile** - Which host
- **Exit Code** - Success/failure
- **Re-run Button** - Execute again in active terminal
- **Filter UI** - By profile, date range, success/failure
- **Export** - Save history to file (CSV/JSON)

**Storage:** SQLite or JSON file in encrypted local storage

#### ⬜ Connection History
Log of SSH connections:
- **Connection Attempts** - Successful and failed
- **Duration** - How long session lasted
- **Data Transferred** - Rough estimate (bytes in/out)
- **Disconnect Reason** - User closed, timeout, error
- **Timeline View** - Visual timeline of connections per day/week

---

### Low Priority - Local Terminal

#### ⬜ Local Terminal Tab
Open PowerShell/Bash on local machine:
- **Same Terminal UI** - Consistent with SSH sessions
- **Sidebar Access** - "Local Terminal" button
- **Multiple Local Tabs** - Like SSH sessions
- **PowerShell/CMD/Bash** - Detect available shells
- **Working Directory** - Start in user home or project folder

**Why Important:** Users often need local terminal alongside remote. Reduces context switching.

---

## Visual Improvements Needed

### Layout Polish
- ⬜ **Empty States** - Add helpful tips ("No profiles? Create your first connection!")
- ⬜ **Loading States** - Spinners for async operations (connecting, syncing)
- ⬜ **Consistent Spacing** - Audit all padding/margins for uniformity
- ⬜ **Focus Management** - Proper keyboard navigation (Tab order, focus rings)
- ⬜ **Tooltips** - Add to all icon-only buttons

### Interactions
- ⬜ **Keyboard Shortcuts** - Ctrl+T (new tab), Ctrl+W (close tab), Ctrl+Tab (next tab)
- ⬜ **Context Menus** - Right-click on profiles, sessions, files
- ⬜ **Quick Search** - Ctrl+P for profiles/snippets (like VS Code command palette)
- ⬜ **Command Palette** - Ctrl+Shift+P for all actions
- ⬜ **Drag-and-Drop** - Profiles to groups, files to SFTP

### Feedback & Notifications
- ⬜ **Toast Notifications** - Non-blocking alerts (bottom-right corner)
  - "Profile saved successfully"
  - "Connected to server"
  - "Sync complete"
  - "Key imported"
- ⬜ **Error Messages** - More helpful and actionable
  - Instead of: "Connection failed"
  - Show: "Connection to 192.168.1.1:22 timed out. Check network and firewall settings."
- ⬜ **Progress Indicators** - For long operations
  - Connecting to SSH (with timeout countdown)
  - Syncing profiles (X of Y items)
  - Uploading large files (MB transferred, speed, ETA)
- ⬜ **Network Status** - Detect offline, show warning banner

---

## Backend Integration TODO

### Electron IPC
- ⬜ **SSH Connection** - Main process handles ssh2 library
- ⬜ **Terminal I/O** - Stream data between renderer and main (pty)
- ⬜ **SFTP Operations** - File transfer in main process
- ⬜ **File System Access** - Read/write SSH keys securely
- ⬜ **Secure Storage** - SQLite or encrypted JSON for profiles

### Encryption (Critical Security)
- ⬜ **PBKDF2 Key Derivation** - From master password
- ⬜ **AES-256-GCM Encryption** - For all sensitive data
- ⬜ **Encrypt Profiles** - Before saving to disk
- ⬜ **Encrypt SSH Keys** - When storing locally
- ⬜ **Decrypt on Unlock** - When user enters master password
- ⬜ **Secure Memory Handling** - Clear keys from memory after use

### Google Drive Sync
- ⬜ **OAuth2 Flow** - Implement in Electron
- ⬜ **Upload Encrypted Blob** - All profiles in one file
- ⬜ **Download & Merge** - Handle conflicts
- ⬜ **Conflict Resolution UI** - Last-write-wins with manual merge option
- ⬜ **Sync Metadata** - Timestamps, device IDs
- ⬜ **Auto-sync** - On profile changes if enabled

### Port Forwarding Implementation
- ⬜ **Local Forward** - ssh2 `forwardOut()`
- ⬜ **Remote Forward** - ssh2 `forwardIn()`
- ⬜ **Dynamic SOCKS5** - Create SOCKS proxy server
- ⬜ **Tunnel Status** - Monitor active tunnels
- ⬜ **Auto-reconnect** - If tunnel drops

---

## Priority Roadmap

### Phase 1 - MVP Complete ✅
- ✅ All UI components built (12 features)
- ⬜ Backend SSH connection (IN PROGRESS)
- ⬜ Basic SFTP file transfers
- ⬜ Encrypted local storage
- ⬜ Master password crypto implementation

### Phase 2 - Organization & Productivity (Termius-Inspired)
**Priority Order:**
1. ⬜ **SSH Key Groups** (security context grouping)
   - Add group field to keys
   - Collapsible group headers
   - Grouped key selector in profile form
   - Manage groups modal
2. ⬜ **Profile Tag Enhancements**
   - Tag autocomplete
   - Tag-based filtering in sidebar
   - Tag color coding
3. ⬜ **Command Snippets Manager** (RUN/PASTE buttons)
   - Dedicated screen with snippet list
   - Execute or paste into terminal
   - Snippet categories
   - Variable substitution (${HOST}, ${USER})
4. ⬜ **Enhanced SFTP**
   - Dedicated full-screen mode
   - Dual-pane file browser
   - Drag-and-drop transfers
   - Transfer queue with progress

### Phase 3 - Visual Polish & Power Features
- ⬜ Host Groups (visual folders for profiles)
- ⬜ Visual Host Cards with custom icons
- ⬜ Command History & Search
- ⬜ Connection History logs
- ⬜ Local Terminal integration
- ⬜ Split Terminal views
- ⬜ Keyboard shortcuts & command palette
- ⬜ Toast notifications

### Phase 4 - Advanced & Enterprise
- ⬜ Google Drive sync (encrypted)
- ⬜ Team Vault (shared credentials)
- ⬜ Jump Host/Bastion support
- ⬜ Session Recording
- ⬜ Multi-factor Authentication
- ⬜ Audit Logs

**Rationale for Phase 2 Order:**
- Key Groups = immediate security benefit (wrong-key prevention)
- Tags = already implemented, just enhance filtering
- Snippets = high value for power users (save repetitive typing)
- SFTP = file management need (but not everyone uses it)

---

## Design Principles (Maintained)

**Visual Language:**
- ✅ Dark theme (VS Code inspired) - clean, professional
- ✅ Dense information display - maximize screen real estate
- ✅ Minimal borders and shadows - flat design
- ✅ Color only for status and accents
- ✅ Monospace fonts for terminal (Cascadia Code, Fira Code)
- ✅ System fonts for UI text

**Grouping Philosophy (CRITICAL):**
- **Keys = Groups** (security context: "Who owns this key?")
  - Workstation, Office, Personal, Client, Temporary
  - Flat structure, no nesting
  - Collapsible headers
  - Optional, default: "Personal"
- **Profiles = Tags** (environment context: "What type of server?")
  - prod, staging, dev, client-name, database, web
  - Multiple tags per profile
  - Filter by tag
- **Hosts = Groups (Later)** (visual organization only)
  - Optional folders like "Admins", "Production"
  - Drag-and-drop profiles between groups
  - Not security-related, just UI organization

**UX Rules for Groups:**
- ❌ NO deep folder trees
- ❌ NO nested hierarchies
- ❌ NO drag-drop file-manager style
- ✅ Flat groups + optional labels
- ✅ Think tags, not folders
- ✅ Collapsible but not nested
- ✅ Groups are optional, not mandatory

**Termius Lessons Applied:**
- **Groups for Keys** - Security context (workstation vs client keys)
- **Tags for Profiles** - Environment context (prod vs staging)
- **Grouped Dropdowns** - Show keys by group in profile form (prevents mistakes)
- **Snippets Save Time** - Power users love saved commands
- **Dedicated SFTP** - Better than hidden toggle panel
- **Details Panel > Modals** - Keep context visible during edits

**NomadSSH Differentiator:**
- **Zero-Knowledge Encryption** - We encrypt locally before cloud sync
- **No Vendor Lock-in** - You own your data, Google Drive is just storage
- **Privacy-First** - Cloud provider never sees plaintext
- **Open Source** - Built on Tabby Terminal (MIT), fully auditable

---

## Current Status Summary

**What Works Now:**
- Complete UI for 12 core features (all components built)
- Profile management, SSH keys, settings, sync UI, tunnels UI
- Terminal with xterm.js integration
- Session management (tabs, switching)
- Master password lock screen

**What's Missing:**
- Actual SSH connections (Electron IPC + ssh2 library)
- Real encryption (currently localStorage placeholders)
- Google Drive sync backend
- SFTP file operations backend
- Port forwarding implementation
- Termius-inspired enhancements (groups, snippets, visual cards)

**Next Steps:**
1. Implement Electron IPC for SSH connections
2. Integrate ssh2 library for real SSH
3. Build encryption layer (PBKDF2 + AES-256-GCM)
4. Add SFTP backend with ssh2-sftp-client
5. Start Phase 2 (Host Groups + Visual Cards)
