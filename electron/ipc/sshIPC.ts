/**
 * SSH IPC Handlers - Secure bridge between renderer and SSH services
 * 
 * Handles all SSH-related IPC communication.
 * CRITICAL: Validates all input from renderer to prevent security issues.
 * 
 * Runs in Electron main process only.
 */

import { ipcMain, IpcMainInvokeEvent, WebContents } from 'electron';
import { getSessionManager } from '../../src/services/ssh/SessionManager';
import type { SSHProfile, SSHKey } from '../../src/types';

// Store webContents for sending events back to renderer
const rendererWindows = new Map<number, WebContents>();

/**
 * Register SSH IPC handlers
 */
export function registerSSHHandlers() {
  const sessionManager = getSessionManager();

  // Register renderer window
  ipcMain.on('ssh:register-window', (event) => {
    const webContentsId = event.sender.id;
    rendererWindows.set(webContentsId, event.sender);

    // Cleanup on window close
    event.sender.on('destroyed', () => {
      rendererWindows.delete(webContentsId);
    });
  });

  /**
   * Connect to SSH server
   * Returns: { success: true, sessionId } or { success: false, error }
   */
  ipcMain.handle('ssh:connect', async (event: IpcMainInvokeEvent, profile: SSHProfile, keys: SSHKey[] = []) => {
    try {
      // Validate input
      if (!profile || !profile.host || !profile.username) {
        return {
          success: false,
          error: 'Invalid profile: missing required fields (host, username)',
        };
      }

      // Validate port
      if (!profile.port || profile.port < 1 || profile.port > 65535) {
        return {
          success: false,
          error: 'Invalid port number',
        };
      }

      // Create session
      const sessionId = await sessionManager.createSession(profile, keys);

      return {
        success: true,
        sessionId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  });

  /**
   * Disconnect SSH session
   * Returns: { success: true } or { success: false, error }
   */
  ipcMain.handle('ssh:disconnect', async (event: IpcMainInvokeEvent, sessionId: string) => {
    try {
      // Validate sessionId
      if (!sessionId || typeof sessionId !== 'string') {
        return {
          success: false,
          error: 'Invalid session ID',
        };
      }

      const result = sessionManager.closeSession(sessionId);

      if (!result) {
        return {
          success: false,
          error: 'Session not found',
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to disconnect',
      };
    }
  });

  /**
   * Resize terminal
   * Returns: { success: true } or { success: false, error }
   */
  ipcMain.handle('ssh:resize', async (event: IpcMainInvokeEvent, sessionId: string, cols: number, rows: number) => {
    try {
      // Validate input
      if (!sessionId || typeof sessionId !== 'string') {
        return {
          success: false,
          error: 'Invalid session ID',
        };
      }

      if (!Number.isInteger(cols) || !Number.isInteger(rows) || cols < 1 || rows < 1 || cols > 1000 || rows > 1000) {
        return {
          success: false,
          error: 'Invalid terminal dimensions',
        };
      }

      const result = sessionManager.resizeSession(sessionId, cols, rows);

      if (!result) {
        return {
          success: false,
          error: 'Session not found or resize failed',
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to resize',
      };
    }
  });

  /**
   * Write data to SSH session (keyboard input)
   * Note: Uses 'on' instead of 'handle' for performance (no response needed)
   */
  ipcMain.on('ssh:write', (event: IpcMainInvokeEvent, sessionId: string, data: string) => {
    try {
      // Validate input
      if (!sessionId || typeof sessionId !== 'string') {
        console.error('Invalid session ID in ssh:write');
        return;
      }

      if (typeof data !== 'string') {
        console.error('Invalid data type in ssh:write');
        return;
      }

      // Rate limiting: prevent DOS by limiting data size
      if (data.length > 10000) {
        console.error('Data too large in ssh:write');
        return;
      }

      sessionManager.writeToSession(sessionId, data);
    } catch (error) {
      console.error('Error in ssh:write:', error);
    }
  });

  /**
   * Get all active sessions
   */
  ipcMain.handle('ssh:get-sessions', async () => {
    try {
      const sessions = sessionManager.getAllSessions();
      return {
        success: true,
        sessions,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get sessions',
      };
    }
  });

  /**
   * Get session history
   */
  ipcMain.handle('ssh:get-history', async (event: IpcMainInvokeEvent, sessionId: string) => {
    try {
      const history = sessionManager.getSessionHistory(sessionId);
      return {
        success: true,
        history,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get history',
      };
    }
  });

  // Forward session events to renderer
  setupSessionEventForwarding(sessionManager);
}

/**
 * Forward session manager events to all renderer windows
 */
function setupSessionEventForwarding(sessionManager: ReturnType<typeof getSessionManager>) {
  // Session data (terminal output)
  sessionManager.on('session:data', (sessionId: string, data: string) => {
    console.log('[sshIPC] Forwarding data for session:', sessionId, 'length:', data.length);
    broadcastToRenderers('ssh:output', sessionId, data);
  });

  // Session status changes
  sessionManager.on('session:status', (sessionId: string, status: string) => {
    console.log('[sshIPC] Forwarding status for session:', sessionId, 'status:', status);
    broadcastToRenderers('ssh:status', sessionId, status);
  });

  // Session errors
  sessionManager.on('session:error', (sessionId: string, error: string) => {
    console.log('[sshIPC] Forwarding error for session:', sessionId, 'error:', error);
    broadcastToRenderers('ssh:error', sessionId, error);
  });

  // Session ready
  sessionManager.on('session:ready', (sessionId: string) => {
    console.log('[sshIPC] Forwarding ready event for session:', sessionId);
    broadcastToRenderers('ssh:ready', sessionId);
  });

  // Session closed
  sessionManager.on('session:closed', (sessionId: string) => {
    console.log('[sshIPC] Forwarding closed event for session:', sessionId);
    broadcastToRenderers('ssh:closed', sessionId);
  });

  // Session logs
  sessionManager.on('session:log', (sessionId: string, message: string) => {
    console.log('[sshIPC] Forwarding log for session:', sessionId, 'message:', message);
    broadcastToRenderers('ssh:log', sessionId, message);
  });
}

/**
 * Broadcast event to all registered renderer windows
 */
function broadcastToRenderers(channel: string, ...args: any[]) {
  rendererWindows.forEach((webContents) => {
    if (!webContents.isDestroyed()) {
      try {
        webContents.send(channel, ...args);
      } catch (error) {
        console.error(`Failed to send ${channel} to renderer:`, error);
      }
    }
  });
}

/**
 * Cleanup on app shutdown
 */
export function cleanupSSHHandlers() {
  const sessionManager = getSessionManager();
  sessionManager.closeAllSessions();
  rendererWindows.clear();
}
