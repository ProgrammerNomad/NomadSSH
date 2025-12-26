import React, { useState, useEffect } from 'react';
import { AppShell } from './components/layout';
import { ProfileManager } from './components/profiles';
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
import { SSHProfile, SSHKey, Tunnel, Session, Snippet } from './types';

function App() {
  const [profiles, setProfiles] = useState<SSHProfile[]>([]);
  const [keys, setKeys] = useState<SSHKey[]>([]);
  const [tunnels, setTunnels] = useState<Tunnel[]>([]);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showProfileManager, setShowProfileManager] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [editingProfile, setEditingProfile] = useState<SSHProfile | undefined>(undefined);
  const [currentView, setCurrentView] = useState<'dashboard' | 'terminal' | 'keys' | 'settings' | 'sync' | 'tunnels' | 'about' | 'snippets' | 'sftp'>('dashboard');
  const [isLocked, setIsLocked] = useState(true);
  const [hasPassword, setHasPassword] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');

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

  const handleConnectProfile = (profileId: string) => {
    // TODO: Implement actual SSH connection via Electron IPC
    const profile = profiles.find((p) => p.id === profileId);
    if (!profile) return;

    // Update last connected time
    setProfiles(
      profiles.map((p) =>
        p.id === profileId
          ? { ...p, lastConnected: new Date().toISOString() }
          : p
      )
    );

    const newSession: Session = {
      id: Date.now().toString(),
      profileId,
      connected: true,
      startedAt: new Date().toISOString(),
    };
    setSessions([...sessions, newSession]);
    setActiveSessionId(newSession.id);
    setCurrentView('terminal');
  };

  const handleDisconnectSession = (sessionId: string) => {
    // TODO: Implement actual SSH disconnection via Electron IPC
    setSessions(sessions.filter((s) => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      setActiveSessionId(sessions.length > 1 ? sessions[0].id : null);
      if (sessions.length <= 1) {
        setCurrentView('dashboard');
      }
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
            ) : null}
          </AppShell>

          <ProfileManager
            open={showProfileManager}
            onClose={handleCloseProfileManager}
            onSave={handleSaveProfile}
            profile={editingProfile}
            keys={keys}
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
            onLock={() => setIsLocked(true)}
            onChangeTheme={handleChangeTheme}
          />
        </>
      )}
    </>
  );
}

export default App;
