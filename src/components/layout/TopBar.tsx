import React, { useState, useRef, useEffect } from 'react';
import { Button, StatusIndicator } from '@/components/ui';
import { Session } from '@/types';
import SessionTabs from './SessionTabs';

interface TopBarProps {
  sessions: Session[];
  activeSessionId: string | null;
  onDisconnectSession: (sessionId: string) => void;
  onToggleRightPanel: () => void;
  onNewProfile: () => void;
  onShowKeys: () => void;
  onShowSettings: () => void;
  onShowSync: () => void;
  onShowTunnels: () => void;
  onShowAbout: () => void;
  onShowCommandPalette: () => void;
  onShowSnippets: () => void;
  onShowSFTP: () => void;
  onShowHistory: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ 
  sessions, 
  activeSessionId, 
  onDisconnectSession, 
  onToggleRightPanel, 
  onNewProfile, 
  onShowKeys, 
  onShowSettings, 
  onShowSync, 
  onShowTunnels,
  onShowAbout,
  onShowCommandPalette,
  onShowSnippets,
  onShowSFTP,
  onShowHistory
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleMenuAction = (action: () => void) => {
    action();
    setShowMenu(false);
  };

  return (
    <header className="h-12 bg-surface border-b border-border flex items-center px-4 flex-shrink-0">
      {/* App Title/Logo */}
      <div className="flex items-center gap-2 min-w-[200px]">
        <span className="font-semibold text-text-primary">NomadSSH</span>
        <StatusIndicator status="disconnected" size="sm" />
      </div>

      {/* Session Tabs */}
      <div className="flex-1 flex items-center gap-2 px-4 overflow-x-auto">
        <SessionTabs
          sessions={sessions}
          profiles={[]}
          activeSessionId={activeSessionId}
          onSelectSession={() => {}}
          onCloseSession={onDisconnectSession}
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {/* Search Button */}
        <Button 
          size="sm" 
          variant="ghost" 
          className="px-2"
          title="Quick search (Ctrl+K)"
          onClick={onShowCommandPalette}
        >
          <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </Button>

        {/* More Menu */}
        <div className="relative" ref={menuRef}>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => setShowMenu(!showMenu)}
            className="px-2"
            title="More options"
          >
            <svg className="w-4 h-4 text-text-secondary" fill="currentColor" viewBox="0 0 16 16">
              <circle cx="8" cy="3" r="1.5" />
              <circle cx="8" cy="8" r="1.5" />
              <circle cx="8" cy="13" r="1.5" />
            </svg>
          </Button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-surface border border-border rounded-lg shadow-lg py-1 z-50">
              <button
                onClick={() => handleMenuAction(onShowKeys)}
                className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-border transition-colors flex items-center gap-3"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                <span>SSH Keys</span>
              </button>
              <button
                onClick={() => handleMenuAction(onShowTunnels)}
                className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-border transition-colors flex items-center gap-3"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span>Tunnels</span>
              </button>
              <button
                onClick={() => handleMenuAction(onShowSnippets)}
                className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-border transition-colors flex items-center gap-3"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                <span>Snippets</span>
              </button>
              <button
                onClick={() => handleMenuAction(onShowSFTP)}
                className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-border transition-colors flex items-center gap-3"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span>SFTP</span>
              </button>
              <button
                onClick={() => handleMenuAction(onShowHistory)}
                className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-border transition-colors flex items-center gap-3"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Command History</span>
              </button>
              <button
                onClick={() => handleMenuAction(onShowSync)}
                className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-border transition-colors flex items-center gap-3"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
                <span>Cloud Sync</span>
              </button>
              <div className="border-t border-border my-1" />
              <button
                onClick={() => handleMenuAction(onShowSettings)}
                className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-border transition-colors flex items-center gap-3"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Settings</span>
              </button>
              <button
                onClick={() => handleMenuAction(onShowAbout)}
                className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-border transition-colors flex items-center gap-3"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>About</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
