/**
 * Session Manager - Multi-Session SSH Connection Management
 * 
 * Manages multiple concurrent SSH sessions with unique IDs.
 * Provides centralized session lifecycle management and event handling.
 * 
 * Runs in Electron main process only.
 */

import { EventEmitter } from 'events';
import { SSHConnection } from './SSHService';
import type { SSHProfile, SSHKey } from '../../types';

export interface SessionInfo {
  id: string;
  profileId: string;
  profileName: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  startedAt: string;
  error?: string;
}

export class SessionManager extends EventEmitter {
  private static instance: SessionManager | null = null;
  private sessions: Map<string, SSHConnection> = new Map();
  private sessionBuffers: Map<string, { type: 'data' | 'log', content: string }[]> = new Map();
  private sessionCounter = 0;

  private constructor() {
    super();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Create new SSH session
   * Returns sessionId on success
   */
  async createSession(profile: SSHProfile, keys: SSHKey[] = []): Promise<string> {
    // Generate unique session ID
    const sessionId = this.generateSessionId();

    try {
      // Create SSH connection
      const connection = new SSHConnection(sessionId, profile);

      // Forward connection events to session manager
      this.setupConnectionEvents(sessionId, connection);

      // Initialize buffer
      this.sessionBuffers.set(sessionId, []);

      // Store session
      this.sessions.set(sessionId, connection);

      // Emit session created event
      this.emit('session:created', sessionId, profile);

      // Connect (async)
      await connection.connect(keys);

      return sessionId;
    } catch (error) {
      // Cleanup on failure
      this.sessions.delete(sessionId);
      throw error;
    }
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): SSHConnection | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Get session info (metadata)
   */
  getSessionInfo(sessionId: string): SessionInfo | null {
    const connection = this.sessions.get(sessionId);
    if (!connection) {
      return null;
    }

    const profile = connection.getProfile();
    return {
      id: sessionId,
      profileId: profile.id,
      profileName: profile.name,
      status: connection.getStatus(),
      startedAt: new Date().toISOString(),
    };
  }

  /**
   * Get session history (logs and data)
   */
  getSessionHistory(sessionId: string): { type: 'data' | 'log', content: string }[] {
    return this.sessionBuffers.get(sessionId) || [];
  }

  /**
   * Get all active sessions
   */
  getAllSessions(): SessionInfo[] {
    const sessions: SessionInfo[] = [];
    
    this.sessions.forEach((connection, sessionId) => {
      const info = this.getSessionInfo(sessionId);
      if (info) {
        sessions.push(info);
      }
    });

    return sessions;
  }

  /**
   * Get all session IDs
   */
  getSessionIds(): string[] {
    return Array.from(this.sessions.keys());
  }

  /**
   * Resize session terminal
   */
  resizeSession(sessionId: string, cols: number, rows: number): boolean {
    const connection = this.sessions.get(sessionId);
    if (!connection) {
      return false;
    }

    try {
      connection.resize(cols, rows);
      return true;
    } catch (error) {
      console.error(`Failed to resize session ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Write data to session (keyboard input)
   */
  writeToSession(sessionId: string, data: string): boolean {
    const connection = this.sessions.get(sessionId);
    if (!connection) {
      return false;
    }

    try {
      connection.write(data);
      return true;
    } catch (error) {
      console.error(`Failed to write to session ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Close session and cleanup
   */
  closeSession(sessionId: string): boolean {
    const connection = this.sessions.get(sessionId);
    if// Keep buffer for a while? No, clear it for now to avoid leaks
      // Actually, we might want to keep it if the user wants to see why it closed
      // But for now let's clear it after a delay
      setTimeout(() => {
        this.sessionBuffers.delete(sessionId);
      }, 60000); // Keep history for 1 minute after close
      
       (!connection) {
      return false;
    }

    try {
      connection.disconnect();
      this.sessions.delete(sessionId);
      this.emit('session:closed', sessionId);
      return true;
    } catch (error) {
      console.error(`Failed to close session ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Close all sessions (app shutdown)
   */
  closeAllSessions(): void {
    const sessionIds = Array.from(this.sessions.keys());
    
    for (const sessionId of sessionIds) {
      try {
        this.closeSession(sessionId);
      } catch (error) {
        console.error(`Error closing session ${sessionId}:`, error);
      }
    }

    this.sessions.clear();
  }

  /**
   * Check if session exists
   */
  hasSession(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  /**
   * Get session count
   */
  getSessionCount(): number {
    const addToBuffer = (type: 'data' | 'log', content: string) => {
      const buffer = this.sessionBuffers.get(sessionId);
      if (buffer) {
        buffer.push({ type, content });
        // Limit buffer size
        if (buffer.length > 1000) {
          buffer.shift();
        }
      }
    };

    // Forward ready event
    connection.on('ready', () => {
      this.emit('session:ready', sessionId);
    });

    // Forward data event (terminal output)
    connection.on('data', (data: string) => {
      addToBuffer('data', data);
      this.emit('session:data', sessionId, data);
    });

    // Forward error event
    connection.on('error', (error: Error) => {
      addToBuffer('log', `Error: ${error.message}`);
      this.emit('session:error', sessionId, error.message);
    });

    // Forward close event
    connection.on('close', () => {
      // Don't delete session here, let closeSession handle it or just mark as closed
      // But we need to remove from map if it was closed remotely
      if (this.sessions.has(sessionId)) {
        this.sessions.delete(sessionId);
        // Keep buffer
        setTimeout(() => {
          this.sessionBuffers.delete(sessionId);
        }, 60000);
      }
      this.emit('session:closed', sessionId);
    });

    // Forward status event
    connection.on('status', (status: string) => {
      this.emit('session:status', sessionId, status);
    });

    // Forward log event
    connection.on('log', (message: string) => {
      addToBuffer('log', message);
    // Forward status event
    connection.on('status', (status: string) => {
      this.emit('session:status', sessionId, status);
    });

    // Forward log event
    connection.on('log', (message: string) => {
      this.emit('session:log', sessionId, message);
    });
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    this.sessionCounter++;
    return `session-${Date.now()}-${this.sessionCounter}`;
  }

  /**
   * Cleanup on shutdown
   */
  destroy(): void {
    this.closeAllSessions();
    this.removeAllListeners();
    SessionManager.instance = null;
  }
}

// Export singleton instance getter
export const getSessionManager = () => SessionManager.getInstance();
