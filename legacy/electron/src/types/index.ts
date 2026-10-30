export interface SSHProfile {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  authMethod: 'password' | 'key';
  password?: string; // For password auth (should be encrypted)
  keyId?: string;
  tags?: string[];
  group?: string; // Optional visual group for organization
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
  passphrase?: string; // Optional passphrase (should be encrypted)
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

export interface Snippet {
  id: string;
  name: string;
  command: string;
  description?: string;
  category: 'System' | 'Network' | 'Docker' | 'Git' | 'Database' | 'Custom';
  tags?: string[];
  variables?: string[]; // Extracted variables like ${HOST}, ${USER}
  lastUsed?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommandHistory {
  id: string;
  command: string;
  timestamp: string;
  profileId: string;
  profileName: string;
  exitCode?: number;
  duration?: number; // milliseconds
  sessionId: string;
}

export interface HostKey {
  host: string;
  port: number;
  fingerprint: string;
  fingerprintMD5?: string;
  keyType: string;
  algorithm: string;
  addedAt: string;
  lastSeenAt: string;
}

export * from './sftp';
