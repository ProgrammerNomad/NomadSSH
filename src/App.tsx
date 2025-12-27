/**
 * STEP 3: REFACTORED WITH COMPONENTS
 * 
 * Using proper component structure for maintainability.
 */

import { useRef, useEffect, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { TopBar } from './components/layout/TopBar';
import { Sidebar } from './components/layout/SidebarWithGroups';
import { Dashboard } from './components/dashboard';
import { ManageCategoriesModal, Category } from './components/categories';
import { ManageKeysModal, SSHKey } from './components/keys';
import { ProfileModal, ProfilesManager } from './components/profiles';
import { Tab, TabStatus } from './components/layout/SessionTabs';

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
  // Multiple terminal instances - one per tab
  const terminalsRef = useRef<Map<string, Terminal>>(new Map());
  const containersRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const fitAddonsRef = useRef<Map<string, FitAddon>>(new Map());
  
  const [status, setStatus] = useState('Ready');
  const [connected, setConnected] = useState(false);
  const [activeProfileId, setActiveProfileId] = useState<string | undefined>();
  
  // Tab management
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  
  // View state
  const [showDashboard, setShowDashboard] = useState(true);
  const [showProfilesManager, setShowProfilesManager] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
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

  // Handle window resize for all terminals
  useEffect(() => {
    const handleResize = () => {
      fitAddonsRef.current.forEach((fitAddon) => {
        fitAddon.fit();
      });
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      
      // Cleanup all terminals on unmount
      terminalsRef.current.forEach((terminal) => {
        terminal.dispose();
      });
      terminalsRef.current.clear();
      containersRef.current.clear();
      fitAddonsRef.current.clear();
    };
  }, []);

  const connectSSHWithTab = async (terminal: Terminal, profile: Profile, tabId: string) => {
    terminal.clear();
    
    terminal.writeln(`\x1b[36mConnecting to ${profile.host}:${profile.port}...\x1b[0m`);
    terminal.writeln(`\x1b[36mUsername: ${profile.username}\x1b[0m`);
    terminal.writeln('');

    setActiveProfileId(profile.id);

    try {
      const result = await window.nomad.ssh.connect(profile, []);

      if (!result.success) {
        terminal.writeln(`\x1b[31mConnection failed: ${result.error}\x1b[0m`);
        // Update tab status to error
        setTabs(prev => prev.map(tab => 
          tab.id === tabId ? { ...tab, status: 'error' as TabStatus } : tab
        ));
        return;
      }

      const sessionId = result.sessionId;
      terminal.writeln(`\x1b[32mConnected! Session: ${sessionId}\x1b[0m`);
      terminal.writeln('');
      
      // Update tab status to connected
      setTabs(prev => prev.map(tab => 
        tab.id === tabId ? { ...tab, status: 'connected' as TabStatus } : tab
      ));

      // Listen for SSH output
      window.nomad.ssh.onOutput(sessionId, (data: string) => {
        terminal.write(data);
      });

      // Listen for errors
      window.nomad.ssh.onError(sessionId, (error: string) => {
        terminal.writeln(`\x1b[31m\nSSH Error: ${error}\x1b[0m`);
        setTabs(prev => prev.map(tab => 
          tab.id === tabId ? { ...tab, status: 'error' as TabStatus } : tab
        ));
      });

      // Listen for close
      window.nomad.ssh.onClosed(sessionId, () => {
        terminal.writeln('\x1b[33m\nConnection closed\x1b[0m');
        setTabs(prev => prev.map(tab => 
          tab.id === tabId ? { ...tab, status: 'disconnected' as TabStatus } : tab
        ));
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
      setTabs(prev => prev.map(tab => 
        tab.id === tabId ? { ...tab, status: 'error' as TabStatus } : tab
      ));
      console.error('[App] SSH error:', err);
    }
  };

  const handleProfileSelect = (profile: Profile) => {
    console.log('[App] Profile selected:', profile.name);
    console.log('[App] Existing tabs:', tabs.map(t => ({ id: t.id, name: t.profileName })));
    
    // Check if a tab for this profile already exists
    const existingTab = tabs.find(tab => tab.profileName === profile.name);
    
    if (existingTab) {
      console.log('[App] Found existing tab, switching to:', existingTab.id);
      // Switch to existing tab instead of creating new one
      handleTabClick(existingTab.id);
      return;
    }
    
    console.log('[App] No existing tab, creating new one');
    // Generate unique tab ID
    const tabId = `tab_${Date.now()}_${profile.id}`;
    
    // Create new tab
    const newTab: Tab = {
      id: tabId,
      profileName: profile.name,
      status: 'connecting' as TabStatus
    };
    
    // Add tab and set as active
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(tabId);
    setShowDashboard(false);
    
    // Hide all existing terminal containers before creating new one
    containersRef.current.forEach((container) => {
      container.style.display = 'none';
    });
    
    // Create terminal container
    const container = document.createElement('div');
    container.id = `terminal-${tabId}`;
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.display = 'block';
    
    // Find terminal area and append
    const terminalArea = document.getElementById('terminal-area');
    if (terminalArea) {
      terminalArea.appendChild(container);
    }
    
    // Store container ref
    containersRef.current.set(tabId, container);
    
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
    terminalsRef.current.set(tabId, terminal);
    fitAddonsRef.current.set(tabId, fitAddon);
    
    // Open terminal
    terminal.open(container);
    fitAddon.fit();
    terminal.focus();
    
    // Show welcome message
    terminal.writeln('\x1b[1;36m=== NomadSSH - Connecting ===\x1b[0m');
    terminal.writeln('');
    
    // Connect SSH
    connectSSHWithTab(terminal, profile, tabId);
  };

  const handleTabClick = (tabId: string) => {
    console.log('[App] Tab clicked:', tabId);
    console.log('[App] Current activeTabId:', activeTabId);
    
    // Switch to tab and show terminal area
    setActiveTabId(tabId);
    setShowDashboard(false);
    
    // Hide all terminal containers
    containersRef.current.forEach((container, id) => {
      container.style.display = id === tabId ? 'block' : 'none';
      console.log(`[App] Container ${id} display:`, container.style.display);
    });
    
    // Focus the active terminal
    const terminal = terminalsRef.current.get(tabId);
    if (terminal) {
      terminal.focus();
      const fitAddon = fitAddonsRef.current.get(tabId);
      if (fitAddon) {
        fitAddon.fit();
      }
    }
  };

  const handleTabClose = (tabId: string) => {
    // Get terminal and container
    const terminal = terminalsRef.current.get(tabId);
    const container = containersRef.current.get(tabId);
    
    // Dispose terminal
    if (terminal) {
      terminal.dispose();
      terminalsRef.current.delete(tabId);
    }
    
    // Remove container
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
      containersRef.current.delete(tabId);
    }
    
    // Remove fit addon
    fitAddonsRef.current.delete(tabId);
    
    // Remove tab
    setTabs(prev => prev.filter(tab => tab.id !== tabId));
    
    // If closing active tab, switch to another or show dashboard
    if (activeTabId === tabId) {
      const remainingTabs = tabs.filter(tab => tab.id !== tabId);
      if (remainingTabs.length > 0) {
        // Switch to last tab
        const newActiveId = remainingTabs[remainingTabs.length - 1].id;
        setActiveTabId(newActiveId);
        handleTabClick(newActiveId);
      } else {
        // No tabs left, show dashboard
        setShowDashboard(true);
        setActiveTabId('');
      }
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
        tabs={tabs}
        activeTabId={activeTabId}
        onTabClick={handleTabClick}
        onTabClose={handleTabClose}
        onSearch={(query) => console.log('Search:', query)}
        onSettingsClick={() => alert('Settings coming soon!')}
        onPreferencesClick={() => setShowKeysModal(true)}
        onAboutClick={() => alert('NomadSSH v0.0.1\n\nProfessional SSH Client with Zero-Knowledge Sync\n\nMIT License\nhttps://github.com/ProgrammerNomad/NomadSSH')}
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
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
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
        
        {/* Terminal area - container for all terminal tabs */}
        <div 
          id="terminal-area"
          style={{
            flex: 1,
            width: '100%',
            backgroundColor: '#000',
            overflow: 'hidden',
            display: showDashboard ? 'none' : 'block',
            position: 'relative'
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
