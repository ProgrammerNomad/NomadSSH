import React, { useState, useEffect } from 'react';
import { AppShell } from './components/layout';
import { ProfileManager } from './components/profiles';
import ManageHostGroupsModal from './components/profiles/ManageHostGroupsModal';
import { Dashboard } from './components/dashboard';
import { MasterPasswordModal } from './components/auth';
import { AboutPanel } from './components/about';
import { CommandPalette } from './components/command';
import { SettingsPanel } from './components/settings';
import { CloudSyncSettings } from './components/sync';
import { TunnelManager } from './components/tunnels';
import { TerminalArea } from './components/terminal';
import { SnippetsManager } from './components/snippets';
import { SFTPManager } from './components/sftp';
import SSHKeyManager from './components/keys';
import { SSHProfile, SSHKey, Tunnel, Session, Snippet, CommandHistory } from './types';
import CommandHistoryManager from './components/history/CommandHistoryManager';

function App() {
  const [profiles, setProfiles] = useState<SSHProfile[]>([]);
  const [keys, setKeys] = useState<SSHKey[]>([]);
  const [tunnels, setTunnels] = useState<Tunnel[]>([]);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [commandHistory, setCommandHistory] = useState<CommandHistory[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [hostGroups, setHostGroups] = useState<string[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showProfileManager, setShowProfileManager] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showManageGroups, setShowManageGroups] = useState(false);
  const [editingProfile, setEditingProfile] = useState<SSHProfile | undefined>(undefined);
  const [currentView, setCurrentView] = useState<'dashboard' | 'terminal' | 'keys' | 'settings' | 'sync' | 'tunnels' | 'about' | 'snippets' | 'sftp' | 'history'>('dashboard');
  const [isLocked, setIsLocked] = useState(true);
  const [hasPassword, setHasPassword] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');

  // Load data from storage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('[App] Loading data from storage...');
        
        const [profilesRes, keysRes, snippetsRes, tunnelsRes, groupsRes] = await Promise.all([
          window.nomad.storage.getProfiles(),
          window.nomad.storage.getKeys(),
          window.nomad.storage.getSnippets(),
          window.nomad.storage.getTunnels(),
          window.nomad.storage.getHostGroups(),
        ]);

        if (profilesRes.success && profilesRes.data) {
          setProfiles(profilesRes.data);
          console.log('[App] Loaded profiles:', profilesRes.data.length);
        }
        if (keysRes.success && keysRes.data) {
          setKeys(keysRes.data);
          console.log('[App] Loaded keys:', keysRes.data.length);
        }
        if (snippetsRes.success && snippetsRes.data) {
          setSnippets(snippetsRes.data);
          console.log('[App] Loaded snippets:', snippetsRes.data.length);
        }
        if (tunnelsRes.success && tunnelsRes.data) {
          setTunnels(tunnelsRes.data);
          console.log('[App] Loaded tunnels:', tunnelsRes.data.length);
        }
        if (groupsRes.success && groupsRes.data) {
          // If no groups in storage, use defaults
          const loadedGroups = groupsRes.data.length > 0 
            ? groupsRes.data 
            : ['Work', 'Personal', 'Clients', 'Staging', 'Production', 'Development'];
          setHostGroups(loadedGroups);
          console.log('[App] Loaded host groups:', loadedGroups.length, loadedGroups);
          
          // Save defaults if storage was empty
          if (groupsRes.data.length === 0 && loadedGroups.length > 0) {
            window.nomad.storage.saveHostGroups(loadedGroups)
              .then(() => console.log('[App] Saved default host groups'))
              .catch((err) => console.error('[App] Error saving default groups:', err));
          }
        }
      } catch (error) {
        console.error('[App] Error loading data:', error);
      }
    };

    loadData();
  }, []);

  // Auto-save profiles when they change
  useEffect(() => {
    if (profiles.length === 0) return; // Skip initial empty state
    
    const timer = setTimeout(() => {
      window.nomad.storage.saveProfiles(profiles)
        .then(() => console.log('[App] Saved profiles:', profiles.length))
        .catch((err) => console.error('[App] Error saving profiles:', err));
    }, 500); // Debounce 500ms

    return () => clearTimeout(timer);
  }, [profiles]);

  // Auto-save keys when they change
  useEffect(() => {
    if (keys.length === 0) return;
    
    const timer = setTimeout(() => {
      window.nomad.storage.saveKeys(keys)
        .then(() => console.log('[App] Saved keys:', keys.length))
        .catch((err) => console.error('[App] Error saving keys:', err));
    }, 500);

    return () => clearTimeout(timer);
  }, [keys]);

  // Auto-save snippets when they change
  useEffect(() => {
    if (snippets.length === 0) return;
    
    const timer = setTimeout(() => {
      window.nomad.storage.saveSnippets(snippets)
        .then(() => console.log('[App] Saved snippets:', snippets.length))
        .catch((err) => console.error('[App] Error saving snippets:', err));
    }, 500);

    return () => clearTimeout(timer);
  }, [snippets]);

  // Auto-save tunnels when they change
  useEffect(() => {
    if (tunnels.length === 0) return;
    
    const timer = setTimeout(() => {
      window.nomad.storage.saveTunnels(tunnels)
        .then(() => console.log('[App] Saved tunnels:', tunnels.length))
        .catch((err) => console.error('[App] Error saving tunnels:', err));
    }, 500);

    return () => clearTimeout(timer);
  }, [tunnels]);

  // Auto-save host groups when they change
  useEffect(() => {
    // Skip if empty (initial state before load)
    if (hostGroups.length === 0) return;
    
    const timer = setTimeout(() => {
      window.nomad.storage.saveHostGroups(hostGroups)
        .then(() => console.log('[App] Saved host groups:', hostGroups.length))
        .catch((err) => console.error('[App] Error saving host groups:', err));
    }, 500);

    return () => clearTimeout(timer);
  }, [hostGroups]);

  useEffect(() => {
    // Check if master password exists in storage
    const passwordExists = localStorage.getItem('hasPassword') === 'true';
    setHasPassword(passwordExists);
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K to open command palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCreatePassword = (password: string) => {
    // TODO: Implement password hashing and storage
    console.log('Creating master password...');
    localStorage.setItem('hasPassword', 'true');
    setHasPassword(true);
    setIsLocked(false);
  };

  const handleUnlock = (password: string) => {
    // TODO: Implement password verification
    console.log('Unlocking with password...');
    setIsLocked(false);
  };

  const handleSaveProfile = (profileData: Omit<SSHProfile, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingProfile) {
      // Update existing profile
      setProfiles(
        profiles.map((p) =>
          p.id === editingProfile.id
            ? { ...p, ...profileData, updatedAt: new Date().toISOString() }
            : p
        )
      );
      setEditingProfile(undefined);
    } else {
      // Create new profile
      const newProfile: SSHProfile = {
        ...profileData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setProfiles([...profiles, newProfile]);
    }
  };

  const handleEditProfile = (profile: SSHProfile) => {
    setEditingProfile(profile);
    setShowProfileManager(true);
  };

  const handleTogglePin = (profileId: string) => {
    setProfiles(
      profiles.map((p) =>
        p.id === profileId ? { ...p, isPinned: !p.isPinned } : p
      )
    );
  };

  const handleCloseProfileManager = () => {
    setShowProfileManager(false);
    setEditingProfile(undefined);
  };

  const handleChangeTheme = (newTheme: 'dark' | 'light' | 'system') => {
    setTheme(newTheme);
    // TODO: Apply theme to document
    console.log('Theme changed to:', newTheme);
  };

  const handleImportKey = (name: string, path: string, group?: string) => {
    const newKey: SSHKey = {
      id: Date.now().toString(),
      name,
      type: 'rsa',
      fingerprint: 'SHA256:' + Math.random().toString(36).substring(2, 15),
      path,
      group: group || 'Personal',
      createdAt: new Date().toISOString(),
    };
    setKeys([...keys, newKey]);
  };

  const handleGenerateKey = (name: string, type: string, bits: number, group?: string) => {
    const newKey: SSHKey = {
      id: Date.now().toString(),
      name,
      type: type as 'rsa' | 'ed25519' | 'ecdsa',
      fingerprint: 'SHA256:' + Math.random().toString(36).substring(2, 15),
      path: `~/.ssh/${name.toLowerCase().replace(/\s+/g, '_')}`,
      group: group || 'Personal',
      createdAt: new Date().toISOString(),
    };
    setKeys([...keys, newKey]);
  };

  const handleDeleteKey = (keyId: string) => {
    setKeys(keys.filter((k) => k.id !== keyId));
  };

  const handleMoveKeyGroup = (keyId: string, newGroup: string) => {
    setKeys(keys.map((k) => (k.id === keyId ? { ...k, group: newGroup } : k)));
  };

  const handleCreateGroup = (groupName: string) => {
    // Groups are dynamic based on keys - no need to store separately
    console.log('Group created:', groupName);
  };

  const handleRenameGroup = (oldName: string, newName: string) => {
    // Update all keys in the old group to the new group
    setKeys(keys.map((k) => (k.group === oldName ? { ...k, group: newName } : k)));
  };

  const handleDeleteGroup = (groupName: string) => {
    // Move all keys in this group to "Personal"
    setKeys(keys.map((k) => (k.group === groupName ? { ...k, group: 'Personal' } : k)));
  };

  const handleAddTunnel = (tunnel: Omit<Tunnel, 'id'>) => {
    const newTunnel: Tunnel = {
      ...tunnel,
      id: Date.now().toString(),
    };
    setTunnels([...tunnels, newTunnel]);
  };

  const handleEditTunnel = (id: string, updates: Partial<Tunnel>) => {
    setTunnels(tunnels.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const handleDeleteTunnel = (id: string) => {
    setTunnels(tunnels.filter((t) => t.id !== id));
  };

  const handleToggleTunnel = (id: string, enabled: boolean) => {
    setTunnels(tunnels.map((t) => (t.id === id ? { ...t, enabled } : t)));
  };

  const handleAddSnippet = (snippetData: Omit<Snippet, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newSnippet: Snippet = {
      ...snippetData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSnippets([...snippets, newSnippet]);
  };

  const handleEditSnippet = (id: string, updates: Partial<Snippet>) => {
    setSnippets(snippets.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const handleDeleteSnippet = (id: string) => {
    setSnippets(snippets.filter((s) => s.id !== id));
  };

  const handleRunSnippet = (snippet: Snippet) => {
    // TODO: Implement snippet execution with variable substitution
    console.log('Running snippet:', snippet.command);
    // Update last used time
    setSnippets(
      snippets.map((s) =>
        s.id === snippet.id ? { ...s, lastUsed: new Date().toISOString() } : s
      )
    );
  };

  const handlePasteSnippet = (snippet: Snippet) => {
    // TODO: Implement paste to active terminal
    console.log('Pasting snippet:', snippet.command);
    // Update last used time
    setSnippets(
      snippets.map((s) =>
        s.id === snippet.id ? { ...s, lastUsed: new Date().toISOString() } : s
      )
    );
  };

  const handleAddCommandHistory = (commandData: Omit<CommandHistory, 'id'>) => {
    const newCommand: CommandHistory = {
      ...commandData,
      id: Date.now().toString(),
    };
    setCommandHistory([newCommand, ...commandHistory]);
  };

  const handleRerunCommand = (command: string) => {
    // TODO: Execute command in active terminal
    console.log('Re-running command:', command);
  };

  const handleExportHistory = () => {
    const json = JSON.stringify(commandHistory, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `command-history-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateHostGroup = (groupName: string) => {
    setHostGroups([...hostGroups, groupName]);
  };

  const handleRenameHostGroup = (oldName: string, newName: string) => {
    setHostGroups(hostGroups.map((g) => (g === oldName ? newName : g)));
    // Update profiles in this group
    setProfiles(
      profiles.map((p) => (p.group === oldName ? { ...p, group: newName } : p))
    );
  };

  const handleDeleteHostGroup = (groupName: string) => {
    setHostGroups(hostGroups.filter((g) => g !== groupName));
    // Move profiles to ungrouped
    setProfiles(
      profiles.map((p) => (p.group === groupName ? { ...p, group: undefined } : p))
    );
  };

  const handleConnectProfile = async (profileId: string) => {
    const profile = profiles.find((p) => p.id === profileId);
    if (!profile) return;

    try {
      console.log('[App] Connecting to profile:', profile.name);
      
      // Switch to terminal view immediately
      setCurrentView('terminal');

      // Connect to SSH via Electron IPC
      const result = await window.nomad.ssh.connect(profile, keys);
      console.log('[App] SSH connect result:', result);

      if (!result.success || !result.sessionId) {
        // Connection failed
        console.error('[App] SSH connection failed:', result.error);
        alert(`Connection failed: ${result.error || 'Unknown error'}`);
        return;
      }

      console.log('[App] SSH connection successful, sessionId:', result.sessionId);

      // Update last connected time
      setProfiles(
        profiles.map((p) =>
          p.id === profileId
            ? { ...p, lastConnected: new Date().toISOString() }
            : p
        )
      );

      // Create session object
      const newSession: Session = {
        id: result.sessionId,
        profileId,
        connected: true,
        startedAt: new Date().toISOString(),
      };

      // Add session to state
      setSessions([...sessions, newSession]);
      setActiveSessionId(result.sessionId);
    } catch (error) {
      console.error('SSH connection error:', error);
      alert(`Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDisconnectSession = async (sessionId: string) => {
    try {
      // Disconnect SSH via Electron IPC
      await window.nomad.ssh.disconnect(sessionId);

      // Remove session from state
      const remainingSessions = sessions.filter((s) => s.id !== sessionId);
      setSessions(remainingSessions);

      // Handle active session
      if (activeSessionId === sessionId) {
        if (remainingSessions.length > 0) {
          // Switch to next available session
          setActiveSessionId(remainingSessions[0].id);
        } else {
          // No sessions left, go to dashboard
          setActiveSessionId(null);
          setCurrentView('dashboard');
        }
      }
    } catch (error) {
      console.error('Failed to disconnect session:', error);
      // Remove from UI anyway
      setSessions(sessions.filter((s) => s.id !== sessionId));
    }
  };

  return (
    <>
      {/* Master Password Modal - First Time or Locked */}
      <MasterPasswordModal
        open={isLocked}
        mode={hasPassword ? 'unlock' : 'create'}
        onSubmit={hasPassword ? handleUnlock : handleCreatePassword}
      />

      {/* Main App (only shown when unlocked) */}
      {!isLocked && (
        <>
          <AppShell
            profiles={profiles}
            sessions={sessions}
            activeSessionId={activeSessionId}
            onConnectProfile={handleConnectProfile}
            onDisconnectSession={handleDisconnectSession}
            onNewProfile={() => setShowProfileManager(true)}
            onShowKeys={() => setCurrentView('keys')}
            onShowSettings={() => setCurrentView('settings')}
            onShowSync={() => setCurrentView('sync')}
            onShowTunnels={() => setCurrentView('tunnels')}
            onShowWelcome={() => setCurrentView('dashboard')}
            onShowAbout={() => setCurrentView('about')}
            onShowCommandPalette={() => setShowCommandPalette(true)}
            onShowSnippets={() => setCurrentView('snippets')}
            onShowSFTP={() => setCurrentView('sftp')}
            onShowHistory={() => setCurrentView('history')}
          >
            {currentView === 'dashboard' ? (
              <Dashboard
                profiles={profiles}
                sessions={sessions}
                onConnect={handleConnectProfile}
                onCreateProfile={() => {
                  setEditingProfile(undefined);
                  setShowProfileManager(true);
                }}
                onEditProfile={handleEditProfile}
                onTogglePin={handleTogglePin}
                onShowKeys={() => setCurrentView('keys')}
                onShowTunnels={() => setCurrentView('tunnels')}
                onShowSync={() => setCurrentView('sync')}
                hostGroups={hostGroups}
                onManageGroups={() => setShowManageGroups(true)}
              />
            ) : currentView === 'terminal' ? (
              <TerminalArea sessions={sessions} activeSessionId={activeSessionId} />
            ) : currentView === 'keys' ? (
              <SSHKeyManager
                keys={keys}
                onImport={handleImportKey}
                onGenerate={handleGenerateKey}
                onDelete={handleDeleteKey}
                onMoveToGroup={handleMoveKeyGroup}
                onCreateGroup={handleCreateGroup}
                onRenameGroup={handleRenameGroup}
                onDeleteGroup={handleDeleteGroup}
                onClose={() => setCurrentView('dashboard')}
              />
            ) : currentView === 'settings' ? (
              <SettingsPanel onClose={() => setCurrentView('dashboard')} />
            ) : currentView === 'sync' ? (
              <CloudSyncSettings onClose={() => setCurrentView('dashboard')} />
            ) : currentView === 'about' ? (
              <AboutPanel onClose={() => setCurrentView('dashboard')} />
            ) : currentView === 'snippets' ? (
              <SnippetsManager
                snippets={snippets}
                onAdd={handleAddSnippet}
                onEdit={handleEditSnippet}
                onDelete={handleDeleteSnippet}
                onRun={handleRunSnippet}
                onPaste={handlePasteSnippet}
                onClose={() => setCurrentView('dashboard')}
              />
            ) : currentView === 'tunnels' ? (
              <TunnelManager
                tunnels={tunnels}
                onAdd={handleAddTunnel}
                onEdit={handleEditTunnel}
                onDelete={handleDeleteTunnel}
                onToggle={handleToggleTunnel}
                onClose={() => setCurrentView('dashboard')}
              />
            ) : currentView === 'sftp' ? (
              <SFTPManager onClose={() => setCurrentView('dashboard')} />
            ) : currentView === 'history' ? (
              <CommandHistoryManager
                history={commandHistory}
                profiles={profiles}
                onRerun={handleRerunCommand}
                onExport={handleExportHistory}
              />
            ) : null}
          </AppShell>

          <ProfileManager
            open={showProfileManager}
            onClose={handleCloseProfileManager}
            onSave={handleSaveProfile}
            profile={editingProfile}
            keys={keys}
            groups={hostGroups}
          />

          <ManageHostGroupsModal
            open={showManageGroups}
            onClose={() => setShowManageGroups(false)}
            groups={hostGroups}
            onCreateGroup={handleCreateHostGroup}
            onRenameGroup={handleRenameHostGroup}
            onDeleteGroup={handleDeleteHostGroup}
          />

          <CommandPalette
            open={showCommandPalette}
            onClose={() => setShowCommandPalette(false)}
            profiles={profiles}
            onConnectProfile={handleConnectProfile}
            onEditProfile={handleEditProfile}
            onTogglePin={handleTogglePin}
            onNewProfile={() => setShowProfileManager(true)}
            onImportKey={() => {
              setCurrentView('keys');
              // TODO: Auto-open import modal
            }}
            onGenerateKey={() => {
              setCurrentView('keys');
              // TODO: Auto-open generate modal
            }}
            onShowKeys={() => setCurrentView('keys')}
            onShowSettings={() => setCurrentView('settings')}
            onShowSync={() => setCurrentView('sync')}
            onShowTunnels={() => setCurrentView('tunnels')}
            onShowSFTP={() => setCurrentView('sftp')}
            onShowSnippets={() => setCurrentView('snippets')}
            onShowHistory={() => setCurrentView('history')}
            onLock={() => setIsLocked(true)}
            onChangeTheme={handleChangeTheme}
          />
        </>
      )}
    </>
  );
}

export default App;
