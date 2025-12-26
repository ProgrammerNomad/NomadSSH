/**
 * Preload Script - Context Bridge API
 * 
 * Exposes secure SSH API to renderer process via contextBridge.
 * CRITICAL: Never expose ipcRenderer directly to prevent security vulnerabilities.
 */

import { contextBridge, ipcRenderer } from 'electron';
import type { SSHProfile, SSHKey, Snippet, Tunnel } from '../src/types';

// Type-safe API interface
export interface NomadAPI {
  ssh: {
    connect: (profile: SSHProfile, keys?: SSHKey[]) => Promise<{ success: boolean; sessionId?: string; error?: string }>;
    disconnect: (sessionId: string) => Promise<{ success: boolean; error?: string }>;
    resize: (sessionId: string, cols: number, rows: number) => Promise<{ success: boolean; error?: string }>;
    write: (sessionId: string, data: string) => void;
    getSessions: () => Promise<{ success: boolean; sessions?: any[]; error?: string }>;
    onOutput: (sessionId: string, callback: (data: string) => void) => () => void;
    onStatus: (sessionId: string, callback: (status: string) => void) => () => void;
    onError: (sessionId: string, callback: (error: string) => void) => () => void;
    onReady: (sessionId: string, callback: () => void) => () => void;
    onClosed: (sessionId: string, callback: () => void) => () => void;
    onLog: (sessionId: string, callback: (message: string) => void) => () => void;
    getHistory: (sessionId: string) => Promise<{ success: boolean; history?: { type: 'data' | 'log', content: string }[]; error?: string }>;
  };
  storage: {
    getProfiles: () => Promise<{ success: boolean; data?: SSHProfile[]; error?: string }>;
    saveProfiles: (profiles: SSHProfile[]) => Promise<{ success: boolean; error?: string }>;
    getKeys: () => Promise<{ success: boolean; data?: SSHKey[]; error?: string }>;
    saveKeys: (keys: SSHKey[]) => Promise<{ success: boolean; error?: string }>;
    getSnippets: () => Promise<{ success: boolean; data?: Snippet[]; error?: string }>;
    saveSnippets: (snippets: Snippet[]) => Promise<{ success: boolean; error?: string }>;
    getTunnels: () => Promise<{ success: boolean; data?: Tunnel[]; error?: string }>;
    saveTunnels: (tunnels: Tunnel[]) => Promise<{ success: boolean; error?: string }>;
    getHostGroups: () => Promise<{ success: boolean; data?: string[]; error?: string }>;
    saveHostGroups: (groups: string[]) => Promise<{ success: boolean; error?: string }>;
    getPath: () => Promise<{ success: boolean; data?: string; error?: string }>;
  };
}

contextBridge.exposeInMainWorld('nomad', {
  ssh: {
    /**
     * Connect to SSH server
     */
    connect: (profile: SSHProfile, keys: SSHKey[] = []) => {
      return ipcRenderer.invoke('ssh:connect', profile, keys);
    },

    /**
     * Disconnect from SSH server
     */
    disconnect: (sessionId: string) => {
      return ipcRenderer.invoke('ssh:disconnect', sessionId);
    },

    /**
     * Resize terminal
     */
    resize: (sessionId: string, cols: number, rows: number) => {
      return ipcRenderer.invoke('ssh:resize', sessionId, cols, rows);
    },

    /**
     * Write data to SSH (keyboard input)
     */
    write: (sessionId: string, data: string) => {
      ipcRenderer.send('ssh:write', sessionId, data);
    },

    /**
     * Get all active sessions
     */
    getSessions: () => {
      return ipcRenderer.invoke('ssh:get-sessions');
    },

    /**
     * Get session history
     */
    getHistory: (sessionId: string) => {
      return ipcRenderer.invoke('ssh:get-history', sessionId);
    },

    /**
     * Listen to terminal output for specific session
     * Returns cleanup function
     */
    onOutput: (sessionId: string, callback: (data: string) => void) => {
      const listener = (_event: any, sid: string, data: string) => {
        if (sid === sessionId) {
          callback(data);
        }
      };
      ipcRenderer.on('ssh:output', listener);
      
      // Return cleanup function
      return () => {
        ipcRenderer.removeListener('ssh:output', listener);
      };
    },

    /**
     * Listen to status changes for specific session
     * Returns cleanup function
     */
    onStatus: (sessionId: string, callback: (status: string) => void) => {
      const listener = (_event: any, sid: string, status: string) => {
        if (sid === sessionId) {
          callback(status);
        }
      };
      ipcRenderer.on('ssh:status', listener);
      
      return () => {
        ipcRenderer.removeListener('ssh:status', listener);
      };
    },

    /**
     * Listen to errors for specific session
     * Returns cleanup function
     */
    onError: (sessionId: string, callback: (error: string) => void) => {
      const listener = (_event: any, sid: string, error: string) => {
        if (sid === sessionId) {
          callback(error);
        }
      };
      ipcRenderer.on('ssh:error', listener);
      
      return () => {
        ipcRenderer.removeListener('ssh:error', listener);
      };
    },

    /**
     * Listen to ready event for specific session
     * Returns cleanup function
     */
    onReady: (sessionId: string, callback: () => void) => {
      const listener = (_event: any, sid: string) => {
        if (sid === sessionId) {
          callback();
        }
      };
      ipcRenderer.on('ssh:ready', listener);
      
      return () => {
        ipcRenderer.removeListener('ssh:ready', listener);
      };
    },

    /**
     * Listen to closed event for specific session
     * Returns cleanup function
     */
    onClosed: (sessionId: string, callback: () => void) => {
      const listener = (_event: any, sid: string) => {
        if (sid === sessionId) {
          callback();
        }
      };
      ipcRenderer.on('ssh:closed', listener);
      
      return () => {
        ipcRenderer.removeListener('ssh:closed', listener);
      };
    },

    /**
     * Listen to log messages for specific session
     * Returns cleanup function
     */
    onLog: (sessionId: string, callback: (message: string) => void) => {
      const listener = (_event: any, sid: string, message: string) => {
        if (sid === sessionId) {
          callback(message);
        }
      };
      ipcRenderer.on('ssh:log', listener);
      
      return () => {
        ipcRenderer.removeListener('ssh:log', listener);
      };
    },
  },

  storage: {
    getProfiles: () => ipcRenderer.invoke('storage:get-profiles'),
    saveProfiles: (profiles: SSHProfile[]) => ipcRenderer.invoke('storage:save-profiles', profiles),
    getKeys: () => ipcRenderer.invoke('storage:get-keys'),
    saveKeys: (keys: SSHKey[]) => ipcRenderer.invoke('storage:save-keys', keys),
    getSnippets: () => ipcRenderer.invoke('storage:get-snippets'),
    saveSnippets: (snippets: Snippet[]) => ipcRenderer.invoke('storage:save-snippets', snippets),
    getTunnels: () => ipcRenderer.invoke('storage:get-tunnels'),
    saveTunnels: (tunnels: Tunnel[]) => ipcRenderer.invoke('storage:save-tunnels', tunnels),
    getHostGroups: () => ipcRenderer.invoke('storage:get-host-groups'),
    saveHostGroups: (groups: string[]) => ipcRenderer.invoke('storage:save-host-groups', groups),
    getPath: () => ipcRenderer.invoke('storage:get-path'),
  },
});

// Register window with main process
ipcRenderer.send('ssh:register-window');
