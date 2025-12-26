export interface SSHProfile {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  authMethod: 'password' | 'key';
  keyId?: string;
  tags?: string[];
  isPinned?: boolean;
  lastConnected?: string;
  icon?: string; // Emoji or color code
  createdAt: string;
  updatedAt: string;
}

export interface SSHKey {
  id: string;
  name: string;
  type: 'rsa' | 'ed25519' | 'ecdsa';
  fingerprint: string;
  path: string;
  group?: string; // Optional group: Workstation, Office, Personal, Client, Temporary
  createdAt: string;
}

export interface Tunnel {
  id: string;
  name: string;
  type: 'local' | 'remote' | 'dynamic';
  sourcePort: number;
  destinationHost?: string;
  destinationPort?: number;
  enabled: boolean;
}

export interface Session {
  id: string;
  profileId: string;
  connected: boolean;
  startedAt: string;
}
