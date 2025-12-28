import { HostKey } from '@/types';

/**
 * Service for managing known SSH host keys (server fingerprints)
 * Just storage operations - no SSH logic
 */
class KnownHostsService {
  private readonly STORAGE_KEY = 'nomadssh_known_hosts';

  /**
   * Get host key for specific host:port
   */
  async getHostKey(host: string, port: number): Promise<HostKey | null> {
    const knownHosts = await this.getAllKnownHosts();
    const normalizedHost = host.toLowerCase();
    
    return knownHosts.find(
      (h) => h.host.toLowerCase() === normalizedHost && h.port === port
    ) || null;
  }

  /**
   * Save a new host key
   */
  async saveHostKey(
    host: string,
    port: number,
    fingerprint: string,
    keyType: string,
    algorithm: string,
    fingerprintMD5?: string
  ): Promise<void> {
    const knownHosts = await this.getAllKnownHosts();
    const normalizedHost = host.toLowerCase();
    
    const existingIndex = knownHosts.findIndex(
      (h) => h.host.toLowerCase() === normalizedHost && h.port === port
    );

    const hostKey: HostKey = {
      host: normalizedHost,
      port,
      fingerprint,
      fingerprintMD5,
      keyType,
      algorithm,
      addedAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      knownHosts[existingIndex] = hostKey;
    } else {
      knownHosts.push(hostKey);
    }

    await this.saveAllKnownHosts(knownHosts);
  }

  /**
   * Remove a specific host key
   */
  async removeHostKey(host: string, port: number): Promise<void> {
    const knownHosts = await this.getAllKnownHosts();
    const normalizedHost = host.toLowerCase();
    
    const filtered = knownHosts.filter(
      (h) => !(h.host.toLowerCase() === normalizedHost && h.port === port)
    );

    await this.saveAllKnownHosts(filtered);
  }

  /**
   * Get all known hosts
   */
  async getAllKnownHosts(): Promise<HostKey[]> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) {
        return [];
      }

      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Failed to load known hosts:', error);
      return [];
    }
  }

  /**
   * Clear all known hosts
   */
  async clearAllKnownHosts(): Promise<void> {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Update last seen timestamp
   */
  async updateLastSeen(host: string, port: number): Promise<void> {
    const knownHosts = await this.getAllKnownHosts();
    const normalizedHost = host.toLowerCase();
    
    const hostKey = knownHosts.find(
      (h) => h.host.toLowerCase() === normalizedHost && h.port === port
    );

    if (hostKey) {
      hostKey.lastSeenAt = new Date().toISOString();
      await this.saveAllKnownHosts(knownHosts);
    }
  }

  /**
   * Private helper to save all known hosts
   */
  private async saveAllKnownHosts(hosts: HostKey[]): Promise<void> {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(hosts));
    } catch (error) {
      console.error('Failed to save known hosts:', error);
      throw new Error('Failed to save known hosts');
    }
  }
}

// Export singleton instance
export const knownHostsService = new KnownHostsService();
