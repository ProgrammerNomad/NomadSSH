import * as fs from 'fs';
import * as path from 'path';
import type { HostKey } from '../../types';

interface StoredHostKey extends HostKey {
  addedAt: string;
  lastSeenAt: string;
}

class KnownHostsService {
  private readonly STORAGE_KEY = 'ssh_known_hosts';
  private readonly filePath: string | null;
  private readonly isMainProcess: boolean;

  constructor() {
    this.isMainProcess = typeof window === 'undefined';

    if (this.isMainProcess) {
      const { app } = require('electron');
      const userDataPath = app.getPath('userData');
      this.filePath = path.join(userDataPath, 'known_hosts.json');

      if (!fs.existsSync(this.filePath)) {
        fs.writeFileSync(this.filePath, JSON.stringify([]), 'utf8');
      }
    } else {
      this.filePath = null;
    }
  }

  private load(): StoredHostKey[] {
    try {
      if (this.isMainProcess) {
        const data = fs.readFileSync(this.filePath!, 'utf8');
        const parsed = JSON.parse(data) as any[];
        // Filter out corrupted entries (ones without proper host field)
        return parsed.filter(h => h && typeof h.host === 'string' && h.port && h.fingerprint) as StoredHostKey[];
      }

      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data) as any[];
      return parsed.filter(h => h && typeof h.host === 'string' && h.port && h.fingerprint) as StoredHostKey[];
    } catch (error) {
      console.error('[KnownHostsService] Failed to load known hosts:', error);
      return [];
    }
  }

  private persist(hosts: StoredHostKey[]): void {
    try {
      if (this.isMainProcess) {
        fs.writeFileSync(this.filePath!, JSON.stringify(hosts, null, 2), 'utf8');
      } else {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(hosts));
      }
    } catch (error) {
      console.error('[KnownHostsService] Failed to persist known hosts:', error);
    }
  }

  getAllKnownHosts(): StoredHostKey[] {
    return this.load();
  }

  getHostKey(host: string, port: number = 22): StoredHostKey | null {
    const knownHosts = this.load();
    return knownHosts.find(h => h.host === host && h.port === port) || null;
  }

  saveHostKey(
    host: string,
    port: number,
    fingerprint: string,
    fingerprintMD5: string,
    keyType: string,
    algorithm: string
  ): void {
    try {
      const knownHosts = this.load();
      const now = new Date().toISOString();
      const existingIndex = knownHosts.findIndex(h => h.host === host && h.port === port);

      const record: StoredHostKey = {
        host,
        port,
        fingerprint,
        fingerprintMD5,
        keyType,
        algorithm,
        addedAt: existingIndex >= 0 ? knownHosts[existingIndex].addedAt : now,
        lastSeenAt: now,
      };

      if (existingIndex >= 0) {
        knownHosts[existingIndex] = record;
      } else {
        knownHosts.push(record);
      }

      this.persist(knownHosts);
      console.log(`[KnownHostsService] Saved host key for ${host}:${port}`);
    } catch (error) {
      console.error('[KnownHostsService] Failed to save host key:', error);
    }
  }

  updateLastSeen(host: string, port: number = 22): void {
    const knownHosts = this.load();
    const index = knownHosts.findIndex(h => h.host === host && h.port === port);
    if (index >= 0) {
      knownHosts[index].lastSeenAt = new Date().toISOString();
      this.persist(knownHosts);
    }
  }

  removeHostKey(host: string, port: number = 22): void {
    const knownHosts = this.load().filter(h => !(h.host === host && h.port === port));
    this.persist(knownHosts);
  }

  clearAllKnownHosts(): void {
    this.persist([]);
  }
}

export const knownHostsService = new KnownHostsService();
