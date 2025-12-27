import { useState, useRef, useEffect } from 'react';
import logoSvg from '../../../assets/logo.svg';
import { SessionTabs, Tab } from './SessionTabs';
import WindowControls from './WindowControls';

interface TopBarProps {
  tabs: Tab[];
  activeTabId: string;
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onSearch?: (query: string) => void;
  onSettingsClick?: () => void;
  onPreferencesClick?: () => void;
  onAboutClick?: () => void;
  onManageProfilesClick?: () => void;
}

export function TopBar({
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
  onSearch,
  onSettingsClick,
  onPreferencesClick,
  onAboutClick,
  onManageProfilesClick
}: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowSettingsMenu(false);
      }
    };

    if (showSettingsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSettingsMenu]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearch?.(value);
  };

  const handleSettingsClick = () => {
    setShowSettingsMenu(false);
    onSettingsClick?.();
  };

  const handlePreferencesClick = () => {
    setShowSettingsMenu(false);
    onPreferencesClick?.();
  };

  const handleAboutClick = () => {
    setShowSettingsMenu(false);
    onAboutClick?.();
  };

  const handleManageProfilesClick = () => {
    setShowSettingsMenu(false);
    onManageProfilesClick?.();
  };

  return (
    <div style={{
      height: '56px',
      backgroundColor: '#18181B',
      borderBottom: '1px solid #3F3F46',
      display: 'flex',
      alignItems: 'center',
      padding: '0 0 0 16px',
      gap: '16px',
      flexShrink: 0,
      WebkitAppRegion: 'drag'
    } as React.CSSProperties}>
      {/* Logo and app name */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginRight: '8px',
        WebkitAppRegion: 'no-drag'
      } as React.CSSProperties}>
        <img 
          src={logoSvg} 
          alt="NomadSSH" 
          style={{ 
            width: '28px', 
            height: '28px',
            objectFit: 'contain'
          }} 
        />
        <span style={{ 
          fontWeight: 700, 
          fontSize: '16px',
          color: '#E5E7EB',
          letterSpacing: '-0.02em'
        }}>
          NomadSSH
        </span>
      </div>

      {/* Session tabs - will show active SSH connections */}
      <div style={{ flex: 1, WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <SessionTabs
          tabs={tabs}
          activeTabId={activeTabId}
          onTabClick={onTabClick}
          onTabClose={onTabClose}
        />
      </div>

      {/* Compact search */}
      <div style={{
        width: '240px',
        position: 'relative',
        WebkitAppRegion: 'no-drag'
      } as React.CSSProperties}>
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search... (Ctrl+K)"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          style={{
            width: '100%',
            padding: '7px 12px 7px 32px',
            backgroundColor: '#27272A',
            border: '1px solid #3F3F46',
            borderRadius: '6px',
            color: '#E5E7EB',
            fontSize: '13px',
            outline: 'none',
            transition: 'all 0.15s ease'
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#06B6D4';
            e.currentTarget.style.backgroundColor = '#000';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#3F3F46';
            e.currentTarget.style.backgroundColor = '#27272A';
          }}
        />
        <svg 
          style={{
            position: 'absolute',
            left: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '14px',
            height: '14px',
            color: '#71717A',
            pointerEvents: 'none'
          }}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Settings menu */}
      <div ref={menuRef} style={{ position: 'relative', WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button
          onClick={() => setShowSettingsMenu(!showSettingsMenu)}
          style={{
            width: '36px',
            height: '36px',
            backgroundColor: showSettingsMenu ? '#27272A' : 'transparent',
            border: '1px solid',
            borderColor: showSettingsMenu ? '#3F3F46' : 'transparent',
            borderRadius: '8px',
            color: '#E5E7EB',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            if (!showSettingsMenu) {
              e.currentTarget.style.backgroundColor = '#27272A';
              e.currentTarget.style.borderColor = '#3F3F46';
            }
          }}
          onMouseLeave={(e) => {
            if (!showSettingsMenu) {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'transparent';
            }
          }}
        >
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="5" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="19" r="2" />
          </svg>
        </button>

        {/* Dropdown menu */}
        {showSettingsMenu && (
          <div style={{
            position: 'absolute',
            top: '44px',
            right: 0,
            width: '220px',
            backgroundColor: '#18181B',
            border: '1px solid #3F3F46',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
            overflow: 'hidden',
            zIndex: 1000
          }}>
            <button
              onClick={handlePreferencesClick}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: 'transparent',
                border: 'none',
                color: '#E5E7EB',
                fontSize: '14px',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#27272A'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Keychain (SSH Keys)
            </button>            <button
              onClick={handleManageProfilesClick}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: 'transparent',
                border: 'none',
                color: '#E5E7EB',
                fontSize: '14px',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#27272A'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Manage Profiles
            </button>            <button
              onClick={handleSettingsClick}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: 'transparent',
                border: 'none',
                color: '#E5E7EB',
                fontSize: '14px',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#27272A'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
            <div style={{
              height: '1px',
              backgroundColor: '#3F3F46',
              margin: '4px 0'
            }} />
            <button
              onClick={handleAboutClick}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: 'transparent',
                border: 'none',
                color: '#E5E7EB',
                fontSize: '14px',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#27272A'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              About
            </button>
          </div>
        )}
      </div>

      {/* Window Controls */}
      <WindowControls />
    </div>
  );
}
