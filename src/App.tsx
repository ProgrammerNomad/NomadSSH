/**
 * STEP 3: ADD TOP BAR WITH SEARCH AND SETTINGS
 * 
 * Adding proper top bar with logo, search, and settings menu.
 */

import React, { useRef, useEffect, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import logoSvg from '../assets/logo.svg';

interface Profile {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  authMethod: string;
}

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [status, setStatus] = useState('Initializing...');
  const [connected, setConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [profiles] = useState<Profile[]>([
    {
      id: 'paddockavenue',
      name: 'paddockavenue',
      host: '198.96.88.179',
      port: 22,
      username: 'paddockavenue',
      password: 'hOq$hYj93I%pala6',
      authMethod: 'password'
    }
  ]);

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
      
      setStatus('Connecting to SSH...');

      // Auto-connect to first profile
      connectSSH(terminal, profiles[0]);
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
      console.error('[App] SSH error:', err);
    }
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
      <div style={{
        height: '56px',
        backgroundColor: '#18181B',
        borderBottom: '1px solid #3F3F46',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: '16px',
        flexShrink: 0
      }}>
        {/* Logo and app name */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginRight: '8px'
        }}>
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

        {/* Connection status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          backgroundColor: '#27272A',
          borderRadius: '6px',
          fontSize: '13px'
        }}>
          <div style={{ 
            width: '6px', 
            height: '6px', 
            borderRadius: '50%', 
            backgroundColor: connected ? '#10B981' : '#71717A'
          }} />
          <span style={{ color: connected ? '#10B981' : '#A1A1AA' }}>
            {status}
          </span>
        </div>

        {/* Search bar */}
        <div style={{
          flex: 1,
          maxWidth: '400px',
          position: 'relative'
        }}>
          <input
            type="text"
            placeholder="Search profiles, commands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              backgroundColor: '#27272A',
              border: '1px solid #3F3F46',
              borderRadius: '8px',
              color: '#E5E7EB',
              fontSize: '14px',
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
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '16px',
              height: '16px',
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

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Settings menu */}
        <div style={{ position: 'relative' }}>
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
                onClick={() => {
                  setShowSettingsMenu(false);
                  alert('Settings coming soon!');
                }}
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
              <button
                onClick={() => {
                  setShowSettingsMenu(false);
                  alert('Preferences coming soon!');
                }}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Preferences
              </button>
              <div style={{
                height: '1px',
                backgroundColor: '#3F3F46',
                margin: '4px 0'
              }} />
              <button
                onClick={() => {
                  setShowSettingsMenu(false);
                  alert('About NomadSSH\n\nVersion 1.0.0\nBased on Tabby Terminal');
                }}
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
      </div>

      {/* Main content area */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden'
      }}>
        {/* Sidebar */}
        <div style={{
          width: '260px',
          backgroundColor: '#18181B',
          borderRight: '1px solid #3F3F46',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0
        }}>
          {/* Sidebar header */}
          <div style={{
            padding: '16px',
            borderBottom: '1px solid #3F3F46'
          }}>
            <div style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#71717A',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              PROFILES
            </div>
          </div>

          {/* Profile list */}
          <div style={{
            flex: 1,
            padding: '8px',
            overflowY: 'auto'
          }}>
            {profiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => {
                  if (terminalRef.current) {
                    terminalRef.current.clear();
                    terminalRef.current.writeln('\x1b[1;36m=== NomadSSH - Connecting ===\x1b[0m');
                    terminalRef.current.writeln('');
                    connectSSH(terminalRef.current, profile);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: connected ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                  border: connected ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid transparent',
                  borderRadius: '8px',
                  color: '#E5E7EB',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.15s ease',
                  marginBottom: '6px'
                }}
                onMouseEnter={(e) => {
                  if (!connected) {
                    e.currentTarget.style.backgroundColor = '#27272A';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!connected) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: connected ? '#10B981' : '#71717A',
                  flexShrink: 0
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: '#E5E7EB'
                  }}>
                    {profile.name}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#71717A',
                    marginTop: '4px'
                  }}>
                    {profile.host}:{profile.port}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Add profile button */}
          <div style={{
            padding: '12px',
            borderTop: '1px solid #3F3F46'
          }}>
            <button style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#06B6D4',
              border: 'none',
              borderRadius: '8px',
              color: '#FFF',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#0891B2';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#06B6D4';
            }}>
              <span style={{ fontSize: '18px', fontWeight: 700 }}>+</span>
              <span>Add Profile</span>
            </button>
          </div>
        </div>

        {/* Terminal area */}
        <div 
          ref={containerRef}
          onClick={handleTerminalClick}
          style={{
            flex: 1,
            backgroundColor: '#000',
            cursor: 'text',
            overflow: 'hidden'
          }}
        />
      </div>
    </div>
  );
}

export default App;
