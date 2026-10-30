/**
 * Storage IPC Handlers - Bridge for data persistence
 * 
 * Provides IPC methods for loading/saving app data.
 * Currently unencrypted - will be encrypted in Phase C.
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { storageService } from '../../src/services/storage/LocalStorageService';
import { knownHostsService } from '../../src/services/storage/KnownHostsService';
import type { SSHProfile, SSHKey, Snippet, Tunnel } from '../../src/types';

export function registerStorageHandlers() {
  // Profiles
  ipcMain.handle('storage:get-profiles', async () => {
    try {
      const profiles = storageService.getProfiles();
      return { success: true, data: profiles };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle('storage:save-profiles', async (event: IpcMainInvokeEvent, profiles: SSHProfile[]) => {
    try {
      storageService.saveProfiles(profiles);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // SSH Keys
  ipcMain.handle('storage:get-keys', async () => {
    try {
      const keys = storageService.getKeys();
      return { success: true, data: keys };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle('storage:save-keys', async (event: IpcMainInvokeEvent, keys: SSHKey[]) => {
    try {
      storageService.saveKeys(keys);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Snippets
  ipcMain.handle('storage:get-snippets', async () => {
    try {
      const snippets = storageService.getSnippets();
      return { success: true, data: snippets };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle('storage:save-snippets', async (event: IpcMainInvokeEvent, snippets: Snippet[]) => {
    try {
      storageService.saveSnippets(snippets);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Tunnels
  ipcMain.handle('storage:get-tunnels', async () => {
    try {
      const tunnels = storageService.getTunnels();
      return { success: true, data: tunnels };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle('storage:save-tunnels', async (event: IpcMainInvokeEvent, tunnels: Tunnel[]) => {
    try {
      storageService.saveTunnels(tunnels);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Host Groups
  ipcMain.handle('storage:get-host-groups', async () => {
    try {
      const groups = storageService.getHostGroups();
      return { success: true, data: groups };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle('storage:save-host-groups', async (event: IpcMainInvokeEvent, groups: string[]) => {
    try {
      storageService.saveHostGroups(groups);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Utility
  ipcMain.handle('storage:get-path', async () => {
    try {
      const path = storageService.getStoragePath();
      return { success: true, data: path };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Known Hosts (SSH Host Key Verification)
  ipcMain.handle('storage:get-known-hosts', async () => {
    try {
      const hosts = knownHostsService.getAllKnownHosts();
      return { success: true, data: hosts };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle('storage:remove-known-host', async (event: IpcMainInvokeEvent, host: string, port: number) => {
    try {
      knownHostsService.removeHostKey(host, port);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle('storage:clear-known-hosts', async () => {
    try {
      knownHostsService.clearAllKnownHosts();
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });
}
