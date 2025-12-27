/**
 * Local Storage Service - Simple unencrypted storage for now
 * 
 * Phase 1: Basic persistence (current)
 * Phase C: Will be replaced with encrypted storage + keytar
 * 
 * Uses electron-store for cross-platform file storage.
 */

import Store from 'electron-store';
import type { SSHProfile, SSHKey, Snippet, Tunnel } from '../../types';

interface StorageSchema {
  profiles: SSHProfile[];
  keys: SSHKey[];
  snippets: Snippet[];
  tunnels: Tunnel[];
  hostGroups: string[];
  version: string;
}

// Default host groups for new installations (from UI-TASKS.md)
const DEFAULT_HOST_GROUPS = [
  'Work',
  'Personal',
  'Clients',
  'Staging',
  'Production',
  'Development',
];

class LocalStorageService {
  private store: Store<StorageSchema>;

  constructor() {
    this.store = new Store<StorageSchema>({
      name: 'nomadssh-data',
      defaults: {
        profiles: [],
        keys: [],
        snippets: [],
        tunnels: [],
        hostGroups: DEFAULT_HOST_GROUPS,
        version: '0.0.1',
      },
    });
  }

  // Profiles
  getProfiles(): SSHProfile[] {
    return this.store.get('profiles', []);
  }

  saveProfiles(profiles: SSHProfile[]): void {
    this.store.set('profiles', profiles);
  }

  // SSH Keys
  getKeys(): SSHKey[] {
    return this.store.get('keys', []);
  }

  saveKeys(keys: SSHKey[]): void {
    this.store.set('keys', keys);
  }

  // Snippets
  getSnippets(): Snippet[] {
    return this.store.get('snippets', []);
  }

  saveSnippets(snippets: Snippet[]): void {
    this.store.set('snippets', snippets);
  }

  // Tunnels
  getTunnels(): Tunnel[] {
    return this.store.get('tunnels', []);
  }

  saveTunnels(tunnels: Tunnel[]): void {
    this.store.set('tunnels', tunnels);
  }

  // Host Groups
  getHostGroups(): string[] {
    const storedGroups = this.store.get('hostGroups', []);

    if (!storedGroups || storedGroups.length === 0) {
      // Ensure defaults are always available (handles legacy configs)
      this.store.set('hostGroups', DEFAULT_HOST_GROUPS);
      return [...DEFAULT_HOST_GROUPS];
    }

    return storedGroups;
  }

  saveHostGroups(groups: string[]): void {
    const uniqueGroups = Array.from(new Set(groups.filter((group) => group.trim().length > 0)));
    this.store.set('hostGroups', uniqueGroups.length > 0 ? uniqueGroups : DEFAULT_HOST_GROUPS);
  }

  // Clear all data (for testing)
  clearAll(): void {
    this.store.clear();
  }

  // Get storage file path (for debugging)
  getStoragePath(): string {
    return this.store.path;
  }
}

// Export singleton instance
export const storageService = new LocalStorageService();
