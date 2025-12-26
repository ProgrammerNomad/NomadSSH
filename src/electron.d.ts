/**
 * TypeScript definitions for Electron API exposed via contextBridge
 */

import type { SSHProfile, SSHKey, Snippet, Tunnel } from './types';

declare global {
  interface Window {
    nomad: {
      ssh: {
        connect: (profile: SSHProfile, keys?: SSHKey[]) => Promise<{
          success: boolean;
          sessionId?: string;
          error?: string;
        }>;
        disconnect: (sessionId: string) => Promise<{
          success: boolean;
          error?: string;
        }>;
        resize: (sessionId: string, cols: number, rows: number) => Promise<{
          success: boolean;
          error?: string;
        }>;
        write: (sessionId: string, data: string) => void;
        getSessions: () => Promise<{
          success: boolean;
          sessions?: any[];
          error?: string;
        }>;
        onOutput: (sessionId: string, callback: (data: string) => void) => () => void;
        onStatus: (sessionId: string, callback: (status: string) => void) => () => void;
        onError: (sessionId: string, callback: (error: string) => void) => () => void;
        onReady: (sessionId: string, callback: () => void) => () => void;
        onClosed: (sessionId: string, callback: () => void) => () => void;
        onLog: (sessionId: string, callback: (message: string) => void) => () => void;
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
    };
  }
}

export {};
