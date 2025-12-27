/**
 * STEP 3: REFACTORED WITH COMPONENTS
 * 
 * Using proper component structure for maintainability.
 */

import React, { useRef, useEffect, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { TopBar } from './components/layout/TopBar';
import { Sidebar } from './components/layout/SidebarWithGroups';
import { Dashboard } from './components/dashboard';
import { ManageCategoriesModal, Category } from './components/categories';
import { ManageKeysModal, SSHKey } from './components/keys';
import { ProfileModal, ProfilesManager } from './components/profiles';

interface Profile {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  authMethod: string;
  categoryId?: string;
  keyId?: string;
}

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [status, setStatus] = useState('Ready');
  const [connected, setConnected] = useState(false);
  const [activeProfileId, setActiveProfileId] = useState<string | undefined>();
  
  // View state
  const [showDashboard, setShowDashboard] = useState(true);
  const [showProfilesManager, setShowProfilesManager] = useState(false);
  
  // Modal states
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [showKeysModal, setShowKeysModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | undefined>();
  
  // Load data from localStorage or use defaults on first run
  const [categories, setCategories] = useState<Category[]>(() => {
    const stored = localStorage.getItem('nomadssh_categories');
    if (stored) {
      return JSON.parse(stored);
    }
    // First run defaults
    return [
      { id: 'cat_personal', name: 'Personal', isDefault: true },
      { id: 'cat_work', name: 'Work', isDefault: true },
      { id: 'cat_clients', name: 'Clients', isDefault: true }
    ];
  });
  
  // SSH Keys
  const [sshKeys, setSshKeys] = useState<SSHKey[]>(() => {
    const stored = localStorage.getItem('nomadssh_ssh_keys');
    return stored ? JSON.parse(stored) : [];
  });
  
  // Profiles - only add demo server on first run
  const [profiles, setProfiles] = useState<Profile[]>(() => {
    const stored = localStorage.getItem('nomadssh_profiles');
    if (stored) {
      return JSON.parse(stored);
    }
    // First run: add demo profile
    return [
      {
        id: 'rebex_test',
        name: 'Rebex Test Server',
        host: 'test.rebex.net',
        port: 22,
        username: 'demo',
        password: 'password',
        authMethod: 'password',
        categoryId: 'cat_personal'
      }
    ];
  });

  // Persist categories to localStorage
  useEffect(() => {
    localStorage.setItem('nomadssh_categories', JSON.stringify(categories));
  }, [categories]);

  // Persist SSH keys to localStorage
  useEffect(() => {
    localStorage.setItem('nomadssh_ssh_keys', JSON.stringify(sshKeys));
  }, [sshKeys]);

  // Persist profiles to localStorage
  useEffect(() => {
    localStorage.setItem('nomadssh_profiles', JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    // Prevent double initialization (React StrictMode runs effects twice)
    if (terminalRef.current) {
      console.log('[App] Terminal already initialized, skipping...');
      return;
    }

    if (!containerRef.current) return;

    console.log('[App] Starting terminal initialization...');
    
    // Create terminal instance
    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Cascadia Code, Fira Code, Consolas, Monaco, monospace',
      theme: {
        background: '#000000',
        foreground: '#E5E7EB',
        cursor: '#06B6D4',
        black: '#18181B',
        red: '#EF4444',
        green: '#10B981',
        yellow: '#F59E0B',
        blue: '#3B82F6',
        magenta: '#A855F7',
        cyan: '#06B6D4',
        white: '#E5E7EB',
      }
    });

    // Create fit addon
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    // Store refs
    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Wait for next frame to ensure container has dimensions
    requestAnimationFrame(() => {
      // Check if terminal was disposed or replaced before this frame ran
      if (terminalRef.current !== terminal) {
        console.log('[App] Terminal instance disposed or replaced, skipping open...');
        return;
      }

      if (!containerRef.current) return;

      // Clear container just in case
      containerRef.current.innerHTML = '';

      console.log('[App] Opening terminal...');
      terminal.open(containerRef.current);
      fitAddon.fit();

      console.log('[App] Terminal opened, cols:', terminal.cols, 'rows:', terminal.rows);

      // Focus terminal immediately
      terminal.focus();
      
      // Show welcome message (no auto-connect)
      setStatus('Ready');
      terminal.writeln('\x1b[1;36m=== Welcome to NomadSSH ===\x1b[0m');
      terminal.writeln('');
      terminal.writeln('Select a profile from the sidebar to connect.');
      terminal.writeln('');
    });

    // Handle window resize
    const handleResize = () => {
      if (fitAddon && terminal) {
        fitAddon.fit();
      }
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      console.log('[App] Cleaning up terminal...');
      window.removeEventListener('resize', handleResize);
      if (terminalRef.current) {
        terminalRef.current.dispose();
        terminalRef.current = null;
      }
    };
  }, []);

  const connectSSH = async (terminal: Terminal, profile: Profile) => {
    // Clear terminal for fresh start
    terminal.clear();
    
    terminal.writeln(`\x1b[36mConnecting to ${profile.host}:${profile.port}...\x1b[0m`);
    terminal.writeln(`\x1b[36mUsername: ${profile.username}\x1b[0m`);
    terminal.writeln('');

    // Track active profile
    setActiveProfileId(profile.id);

    try {
      const result = await window.nomad.ssh.connect(profile, []);

      if (!result.success) {
        terminal.writeln(`\x1b[31mConnection failed: ${result.error}\x1b[0m`);
        setStatus('Connection failed');
        setConnected(false);
        return;
      }

      const sessionId = result.sessionId;
      terminal.writeln(`\x1b[32mConnected! Session: ${sessionId}\x1b[0m`);
      terminal.writeln('');
      setStatus(`Connected: ${profile.name}`);
      setConnected(true);

      // Listen for SSH output
      window.nomad.ssh.onOutput(sessionId, (data: string) => {
        console.log('[SSH] Output:', data.length, 'bytes');
        terminal.write(data);
      });

      // Listen for errors
      window.nomad.ssh.onError(sessionId, (error: string) => {
        console.error('[SSH] Error:', error);
        terminal.writeln(`\x1b[31m\nSSH Error: ${error}\x1b[0m`);
      });

      // Listen for close
      window.nomad.ssh.onClosed(sessionId, () => {
        console.log('[SSH] Connection closed');
        terminal.writeln('\x1b[33m\nConnection closed\x1b[0m');
        setStatus('Disconnected');
        setConnected(false);
        setActiveProfileId(undefined);
      });

      // Send terminal input to SSH
      terminal.onData((data) => {
        window.nomad.ssh.write(sessionId, data);
      });

      // Send resize events to SSH
      terminal.onResize(({ cols, rows }) => {
        window.nomad.ssh.resize(sessionId, cols, rows);
      });

      terminal.focus();
    } catch (err: any) {
      terminal.writeln(`\x1b[31mError: ${err.message}\x1b[0m`);
      setStatus('Error');
      setConnected(false);
      setActiveProfileId(undefined);
      console.error('[App] SSH error:', err);
    }
  };

  const handleProfileSelect = (profile: Profile) => {
    setShowDashboard(false); // Hide dashboard, show terminal
    if (terminalRef.current) {
      terminalRef.current.clear();
      terminalRef.current.writeln('\x1b[1;36m=== NomadSSH - Connecting ===\x1b[0m');
      terminalRef.current.writeln('');
      connectSSH(terminalRef.current, profile);
    }
  };

  const handleAddProfile = () => {
    setEditingProfile(undefined);
    setShowProfileModal(true);
  };

  const handleEditProfile = (profile: Profile) => {
    setEditingProfile(profile);
    setShowProfileModal(true);
  };

  const handleSaveProfile = (profile: Profile) => {
    if (editingProfile) {
      // Edit existing
      setProfiles(profiles.map(p => p.id === profile.id ? profile : p));
    } else {
      // Add new
      setProfiles([...profiles, profile]);
    }
    console.log('Profile saved:', profile);
  };

  const handleDeleteProfile = (profileId: string) => {
    if (confirm('Delete this connection?')) {
      setProfiles(profiles.filter(p => p.id !== profileId));
      if (activeProfileId === profileId) {
        setActiveProfileId(undefined);
        setConnected(false);
        setStatus('Disconnected');
      }
    }
  };

  const handleDuplicateProfile = (profile: Profile) => {
    const newProfile = {
      ...profile,
      id: `profile_${Date.now()}`,
      name: `${profile.name} (Copy)`
    };
    setProfiles([...profiles, newProfile]);
    setEditingProfile(newProfile);
    setShowProfileModal(true);
  };

  const handleSaveCategories = (updatedCategories: Category[]) => {
    setCategories(updatedCategories);
    console.log('Categories saved:', updatedCategories);
  };

  const handleSaveKeys = (updatedKeys: SSHKey[]) => {
    setSshKeys(updatedKeys);
    // TODO: Add encryption before saving (security requirement)
    console.log('SSH Keys saved:', updatedKeys.length);
  };

  // Focus terminal when clicked
  const handleTerminalClick = () => {
    if (terminalRef.current) {
      terminalRef.current.focus();
    }
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#09090B',
      color: '#E5E7EB',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Top bar */}
      <TopBar 
        status={status}
        connected={connected}
        onSearch={(query) => console.log('Search:', query)}
        onSettingsClick={() => alert('Settings coming soon!')}
        onPreferencesClick={() => setShowKeysModal(true)}
        onAboutClick={() => alert('About NomadSSH\n\nVersion 1.0.0\nBased on Tabby Terminal')}
        onManageProfilesClick={() => setShowProfilesManager(true)}
      />

      {/* Main content area */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden'
      }}>
        {/* Sidebar */}
        <Sidebar 
          profiles={profiles}
          categories={categories}
          activeProfileId={activeProfileId}
          onProfileSelect={handleProfileSelect}
          onAddProfile={handleAddProfile}
          onManageCategories={() => setShowCategoriesModal(true)}
          onEditProfile={handleEditProfile}
          onDeleteProfile={handleDeleteProfile}
          onHomeClick={() => setShowDashboard(true)}
        />

        {/* Main content area - Dashboard or Terminal */}
        {showDashboard && (
          <Dashboard
            profiles={profiles}
            categories={categories}
            onProfileConnect={handleProfileSelect}
            onAddProfile={handleAddProfile}
            onManageProfiles={() => setShowProfilesManager(true)}
          />
        )}
        
        {/* Terminal container - always rendered but hidden when dashboard is shown */}
        <div 
          ref={containerRef}
          onClick={handleTerminalClick}
          style={{
            flex: 1,
            width: '100%',
            backgroundColor: '#000',
            cursor: 'text',
            overflow: 'hidden',
            display: showDashboard ? 'none' : 'block'
          }}
        />
      </div>

      {/* Modals */}
      <ManageCategoriesModal
        isOpen={showCategoriesModal}
        onClose={() => setShowCategoriesModal(false)}
        categories={categories}
        onSave={handleSaveCategories}
      />

      <ManageKeysModal
        isOpen={showKeysModal}
        onClose={() => setShowKeysModal(false)}
        keys={sshKeys}
        onSave={handleSaveKeys}
      />

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => {
          setShowProfileModal(false);
          setEditingProfile(undefined);
        }}
        onSave={handleSaveProfile}
        categories={categories}
        sshKeys={sshKeys}
        editProfile={editingProfile}
      />

      {/* Full-screen views */}
      {showProfilesManager && (
        <ProfilesManager
          profiles={profiles}
          categories={categories}
          sshKeys={sshKeys}
          onClose={() => setShowProfilesManager(false)}
          onEditProfile={(profile) => {
            setEditingProfile(profile);
            setShowProfileModal(true);
          }}
          onDeleteProfile={handleDeleteProfile}
          onAddProfile={handleAddProfile}
          onDuplicateProfile={handleDuplicateProfile}
        />
      )}
    </div>
  );
}

export default App;
