import React, { useState } from 'react';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import StatusBar from './StatusBar';
import { SSHProfile, Session } from '@/types';

interface AppShellProps {
  children?: React.ReactNode;
  profiles: SSHProfile[];
  sessions: Session[];
  activeSessionId: string | null;
  onConnectProfile: (profileId: string) => void;
  onDisconnectSession: (sessionId: string) => void;
  onNewProfile: () => void;
  onShowKeys: () => void;
  onShowSettings: () => void;
  onShowSync: () => void;
  onShowTunnels: () => void;
  onShowWelcome: () => void;
  onShowAbout: () => void;
  onShowCommandPalette: () => void;
}

const AppShell: React.FC<AppShellProps> = ({ 
  children, 
  profiles, 
  sessions, 
  activeSessionId, 
  onConnectProfile, 
  onDisconnectSession, 
  onNewProfile, 
  onShowKeys, 
  onShowSettings, 
  onShowSync, 
  onShowTunnels, 
  onShowWelcome,
  onShowAbout,
  onShowCommandPalette
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightPanelVisible, setRightPanelVisible] = useState(false);

  return (
    <div className="flex flex-col h-screen w-screen bg-background text-text-primary overflow-hidden">
      {/* Top Bar - Fixed */}
      <TopBar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onDisconnectSession={onDisconnectSession}
        onToggleRightPanel={() => setRightPanelVisible(!rightPanelVisible)}
        onNewProfile={onNewProfile}
        onShowKeys={onShowKeys}
        onShowSettings={onShowSettings}
        onShowSync={onShowSync}
        onShowTunnels={onShowTunnels}
        onShowAbout={onShowAbout}
        onShowCommandPalette={onShowCommandPalette}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Collapsible */}
        <Sidebar
          collapsed={sidebarCollapsed}
          profiles={profiles}
          sessions={sessions}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          onProfileClick={onConnectProfile}
          onHome={onShowWelcome}
          onAddProfile={onNewProfile}
        />

        {/* Central Work Area */}
        <main className="flex-1 overflow-hidden bg-background">
          {children}
        </main>

        {/* Right Panel - SFTP (Optional, toggleable) */}
        {rightPanelVisible && (
          <aside className="w-96 border-l border-border bg-surface overflow-hidden">
            <div className="p-4 text-text-secondary">
              <p>SFTP Panel (Coming Soon)</p>
            </div>
          </aside>
        )}
      </div>

      {/* Bottom Status Bar - Fixed */}
      <StatusBar 
        onShowSync={onShowSync}
        onShowHome={onShowWelcome}
      />
    </div>
  );
};

export default AppShell;
