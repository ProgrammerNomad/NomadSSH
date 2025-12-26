/**
 * useTerminal Hook - Connect xterm.js to SSH backend via IPC
 * 
 * React hook for managing terminal instances and SSH connections.
 * Uses callback ref pattern for proper DOM initialization.
 * 
 * Runs in renderer process only.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

export interface UseTerminalOptions {
  sessionId: string;
  onError?: (error: string) => void;
  onClose?: () => void;
}

export interface UseTerminalReturn {
  terminal: Terminal | null;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  error: string | null;
  containerRef: (node: HTMLDivElement | null) => void;
}

export function useTerminal({ sessionId, onError, onClose }: UseTerminalOptions): UseTerminalReturn {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [error, setError] = useState<string | null>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const containerNodeRef = useRef<HTMLDivElement | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const statusRef = useRef<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');

  const updateStatus = useCallback((next: 'connecting' | 'connected' | 'disconnected' | 'error') => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  // Callback ref - called when container mounts/unmounts
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    // When React detaches the node (null) clean up
    if (node === null) {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      containerNodeRef.current = null;
      return;
    }

    // Bail out if we're reusing the same DOM node (avoid re-init on re-render)
    if (containerNodeRef.current === node) {
      return;
    }

    // Cleanup previous instance before creating a new one
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    if (!sessionId) {
      return;
    }

    console.log('[useTerminal] Initializing terminal for session:', sessionId);
    updateStatus('connecting');
    setError(null);
    containerNodeRef.current = node;

    // Initialize terminal with Cyber Blue + Zinc Dark theme
    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Cascadia Code, Fira Code, Consolas, Monaco, monospace',
      theme: {
        background: '#000000',        // Pure black for terminal
        foreground: '#E5E7EB',        // text-text-primary (gray-200)
        cursor: '#06B6D4',            // Primary cyan
        cursorAccent: '#000000',
        selection: 'rgba(6, 182, 212, 0.3)',  // Primary with opacity
        black: '#18181B',             // zinc-900
        red: '#EF4444',               // red-500 (error)
        green: '#10B981',             // emerald-500 (success)
        yellow: '#F59E0B',            // amber-500 (warning)
        blue: '#3B82F6',              // blue-500 (info)
        magenta: '#A855F7',           // purple-500
        cyan: '#06B6D4',              // cyan-500 (primary)
        white: '#E5E7EB',             // gray-200
        brightBlack: '#71717A',       // zinc-500 (text-secondary)
        brightRed: '#F87171',         // red-400
        brightGreen: '#34D399',       // emerald-400
        brightYellow: '#FBBF24',      // amber-400
        brightBlue: '#60A5FA',        // blue-400
        brightMagenta: '#C084FC',     // purple-400
        brightCyan: '#22D3EE',        // cyan-400 (primary-light)
        brightWhite: '#F9FAFB',       // gray-50
      },
      allowProposedApi: true,
    });

    // Fit addon for auto-resize
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    // Store refs
    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Open terminal once container has dimensions
    let rafId: number | null = null;
    const openWhenReady = () => {
      if (!node.isConnected) {
        console.warn('[useTerminal] Node not connected, retrying...');
        return;
      }

      const { clientWidth, clientHeight } = node;
      console.log('[useTerminal] Container dimensions:', clientWidth, 'x', clientHeight);
      
      if (clientWidth === 0 || clientHeight === 0) {
        console.warn('[useTerminal] Container has no dimensions, waiting...');
        rafId = window.requestAnimationFrame(openWhenReady);
        return;
      }

      try {
        console.log('[useTerminal] Opening terminal in container');
        terminal.open(node);
        terminal.focus();
        
        // Initial fit
        fitAddon.fit();
        
        // Double check fit after a short delay to ensure layout is settled
        setTimeout(() => {
          try {
            fitAddon.fit();
            console.log('[useTerminal] Refit complete, cols:', terminal.cols, 'rows:', terminal.rows);
          } catch (e) {
            console.warn('[useTerminal] Refit failed:', e);
          }
        }, 50);

        console.log('[useTerminal] Terminal opened successfully, cols:', terminal.cols, 'rows:', terminal.rows);
        
        // Write test message to verify terminal is visible
        terminal.writeln('\x1b[1;36m=== NomadSSH Terminal Ready ===\x1b[0m');
        terminal.writeln('');
      } catch (err) {
        console.error('[useTerminal] Failed to open terminal:', err);
      }
    };

    openWhenReady();

    // Subscribe to ready event
    const unsubscribeReady = window.nomad.ssh.onReady(sessionId, () => {
      console.log('[useTerminal] Session ready!');
      updateStatus('connected');
      setError(null);
    });

    // Fetch history to catch up on missed events
    window.nomad.ssh.getHistory(sessionId).then((result) => {
      if (result.success && result.history) {
        console.log(`[useTerminal] Replaying ${result.history.length} history items`);
        result.history.forEach((item) => {
          if (item.type === 'data') {
            terminal.write(item.content);
          } else if (item.type === 'log') {
            terminal.write(`\x1b[36m${item.content}\x1b[0m\r\n`);
          }
        });
      }
    }).catch(err => console.error('[useTerminal] Failed to fetch history:', err));

    // CRITICAL: If we're receiving data, the connection is likely already ready
    // The ready event may have been emitted before we subscribed
    // So check if we're getting output and auto-transition to connected
    let hasReceivedData = false;

    // Subscribe to SSH output (modified to track data reception)
    const unsubscribeOutput = window.nomad.ssh.onOutput(sessionId, (data: string) => {
      console.log('[useTerminal] Received output:', data.substring(0, 50));
      hasReceivedData = true;
      terminal.write(data);
      // Force refresh to ensure render
      // terminal.refresh(0, terminal.rows - 1); 
      if (statusRef.current === 'connecting') {
        console.log('[useTerminal] Switching to connected after receiving output');
        updateStatus('connected');
      }
    });

    // Subscribe to status changes
    const unsubscribeStatus = window.nomad.ssh.onStatus(sessionId, (newStatus: string) => {
      console.log('[useTerminal] Status changed:', newStatus);
      updateStatus(newStatus as any);
      if (newStatus === 'connected') {
        setError(null);
      }
    });

    // Subscribe to errors
    const unsubscribeError = window.nomad.ssh.onError(sessionId, (errorMsg: string) => {
      console.log('[useTerminal] Error:', errorMsg);
      updateStatus('error');
      setError(errorMsg);
      if (onError) {
        onError(errorMsg);
      }
    });

    // Subscribe to closed event
    const unsubscribeClosed = window.nomad.ssh.onClosed(sessionId, () => {
      console.log('[useTerminal] Session closed');
      updateStatus('disconnected');
      if (onClose) {
        onClose();
      }
    });

    // Subscribe to log messages (connection logs)
    const unsubscribeLog = window.nomad.ssh.onLog(sessionId, (message: string) => {
      console.log('[useTerminal] Log:', message);
      // Display logs in cyan color like Bitvise
      terminal.write(`\x1b[36m${message}\x1b[0m\r\n`);
    });

    // Forward terminal input to SSH
    const inputDisposable = terminal.onData((data: string) => {
      window.nomad.ssh.write(sessionId, data);
    });

    // Handle terminal resize
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      resizeTimeout = setTimeout(() => {
        if (fitAddon && terminal) {
          try {
            fitAddon.fit();
            window.nomad.ssh.resize(sessionId, terminal.cols, terminal.rows);
          } catch (error) {
            console.error('Failed to resize terminal:', error);
          }
        }
      }, 100); // Debounce resize
    };

    // Listen to window resize
    window.addEventListener('resize', handleResize);

    // Listen to container resize
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(node);

    // Store cleanup function
    cleanupRef.current = () => {
      // Clear timeouts
      clearTimeout(resizeTimeout);

      // Remove resize listeners
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();

      // Dispose terminal input listener
      inputDisposable.dispose();
      // Unsubscribe from all SSH events
      unsubscribeOutput();
      unsubscribeStatus();
      unsubscribeError();
      unsubscribeReady();
      unsubscribeClosed();
      unsubscribeLog();

      // Dispose terminal
      if (terminalRef.current) {
        terminalRef.current.dispose();
        terminalRef.current = null;
      }

      fitAddonRef.current = null;
    };
  }, [sessionId, onError, onClose, updateStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, []);

  return {
    terminal: terminalRef.current,
    status,
    error,
    containerRef,
  };
}
