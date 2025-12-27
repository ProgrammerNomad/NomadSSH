/**
 * STEP 2: ADD SIDEBAR WITH PROFILES
 * 
 * Adding sidebar with profile list, but keeping same working terminal code.
 */

import React, { useRef, useEffect, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';

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
      {/* Status bar */}
      <div style={{
        height: '48px',
        backgroundColor: '#18181B',
        borderBottom: '1px solid #3F3F46',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        fontSize: '14px',
        flexShrink: 0
      }}>
        <span style={{ fontWeight: 600, marginRight: '16px', color: '#E5E7EB' }}>NomadSSH</span>
        <div style={{ 
          width: '8px', 
          height: '8px', 
          borderRadius: '50%', 
          backgroundColor: connected ? '#10B981' : '#71717A',
          marginRight: '8px'
        }} />
        <span style={{ color: connected ? '#10B981' : '#71717A', fontSize: '13px' }}>{status}</span>
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
