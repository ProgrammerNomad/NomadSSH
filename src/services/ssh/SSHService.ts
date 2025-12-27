/**
 * SSH Service - Core SSH Connection Handler
 * 
 * This service handles SSH connections using ssh2 library.
 * Streams SSH output directly to xterm.js in the renderer.
 * Runs in Electron main process only.
 * 
 * Architecture:
 * - ssh2 Client → SSH connection to remote server
 * - Direct streaming: SSH ↔ Renderer (xterm.js)
 */

import { Client, ConnectConfig } from 'ssh2';
import { readFile } from 'fs/promises';
import { EventEmitter } from 'events';
import type { SSHProfile, SSHKey } from '../../types';

export interface SSHConnectionEvents {
  ready: () => void;
  data: (data: string) => void;
  error: (error: Error) => void;
  close: () => void;
  status: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;
  log: (message: string) => void;
}

export class SSHConnection extends EventEmitter {
  private client: Client | null = null;
  private stream: any = null;
  private status: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';
  private sessionId: string;
  private profile: SSHProfile;

  constructor(sessionId: string, profile: SSHProfile) {
    super();
    this.sessionId = sessionId;
    this.profile = profile;
  }

  /**
   * Connect to SSH server and establish PTY bridge
   */
  async connect(keys: SSHKey[] = []): Promise<void> {
    if (this.status === 'connecting' || this.status === 'connected') {
      throw new Error('Already connected or connecting');
    }

    this.updateStatus('connecting');
    this.log(`Started new SSH connection to ${this.profile.host}:${this.profile.port}`);
    this.log(`Username: ${this.profile.username}`);
    this.log(`Authentication method: ${this.profile.authMethod}`);

    try {
      // Create SSH client
      this.client = new Client();

      // Build SSH connection config
      const config: ConnectConfig = {
        host: this.profile.host,
        port: this.profile.port,
        username: this.profile.username,
        readyTimeout: 30000,
        keepaliveInterval: 10000,
      };

      // Handle authentication
      if (this.profile.authMethod === 'password') {
        if (!this.profile.password) {
          throw new Error('Password is required but not provided');
        }
        config.password = this.profile.password;
        this.log('Using password authentication');
      } else if (this.profile.keyId === 'auto') {
        // Auto mode: try all available keys
        await this.connectWithAutoKeys(config, keys);
        return;
      } else if (this.profile.keyId) {
        // Specific key authentication
        const key = keys.find(k => k.id === this.profile.keyId);
        if (key) {
          try {
            const privateKey = await readFile(key.path, 'utf8');
            config.privateKey = privateKey;
            if (key.passphrase) {
              config.passphrase = key.passphrase;
            }
          } catch (error) {
            throw new Error(`Failed to read SSH key: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        } else {
          throw new Error(`SSH key not found: ${this.profile.keyId}`);
        }
      }

      // Connect to SSH
      await this.connectWithConfig(config);
    } catch (error) {
      this.updateStatus('error');
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Connect with specific SSH config
   */
  private connectWithConfig(config: ConnectConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.client) {
        reject(new Error('SSH client not initialized'));
        return;
      }

      // Handle SSH client events
      this.client.on('ready', async () => {
        console.log('[SSHService] ===== SSH CLIENT READY EVENT =====');
        this.log('SSH connection established');
        this.log('Requesting interactive shell...');
        try {
          console.log('[SSHService] About to call setupPTYBridge()');
          await this.setupPTYBridge();
          console.log('[SSHService] PTY Bridge setup complete');
          this.updateStatus('connected');
          this.log('Interactive terminal session started');
          console.log('[SSHService] Emitting ready event');
          this.emit('ready');
          console.log('[SSHService] Ready handler complete');
          resolve();
        } catch (error) {
          console.error('[SSHService] Error in ready handler:', error);
          this.log(`Error: ${error instanceof Error ? error.message : 'Unknown'}`);
          reject(error);
        }
      });

      this.client.on('error', (err) => {
        this.log(`Connection error: ${err.message}`);
        this.updateStatus('error');
        this.emit('error', err);
        reject(err);
      });

      this.client.on('close', () => {
        console.log('[SSHService] ===== CLIENT CLOSE EVENT =====');
        console.trace('[SSHService] Close event stack trace');
        this.log('SSH connection closed');
        this.handleClose();
      });

      this.client.on('end', () => {
        console.log('[SSHService] ===== CLIENT END EVENT =====');
        console.trace('[SSHService] End event stack trace');
        this.log('SSH connection ended');
        this.handleClose();
      });

      // Attempt connection
      try {
        this.log(`Connecting to ${config.host}:${config.port}...`);
        this.client.connect(config);
      } catch (error) {
        this.log(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        reject(error);
      }
    });
  }

  /**
   * Try connecting with multiple keys (auto mode)
   */
  private async connectWithAutoKeys(baseConfig: ConnectConfig, keys: SSHKey[]): Promise<void> {
    if (keys.length === 0) {
      throw new Error('No SSH keys available for auto authentication');
    }

    let lastError: Error | null = null;

    // Try each key until one succeeds
    for (const key of keys) {
      try {
        const privateKey = await readFile(key.path, 'utf8');
        const config: ConnectConfig = {
          ...baseConfig,
          privateKey,
          passphrase: key.passphrase,
        };

        await this.connectWithConfig(config);
        return; // Success! Exit
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        // Continue to next key
        continue;
      }
    }

    // All keys failed
    throw lastError || new Error('All SSH keys failed authentication');
  }

  /**
   * Setup PTY bridge between SSH and local terminal
   * This is the critical pattern that makes interactive shells work
   */
  private setupPTYBridge(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.client) {
        reject(new Error('SSH client not connected'));
        return;
      }

      // Request shell from SSH server
      console.log('[SSHService] Requesting shell from server');
      
      // Explicitly request PTY with xterm-256color
      const window = { rows: 24, cols: 80, height: 0, width: 0, term: 'xterm-256color' };
      
      this.client.shell(window, (err, stream) => {
        if (err) {
          console.error('[SSHService] ===== SHELL REQUEST FAILED =====', err);
          this.log(`Shell request error: ${err.message}`);
          reject(err);
          return;
        }

        console.log('[SSHService] ===== SHELL ACQUIRED SUCCESSFULLY =====');
        this.log('Interactive shell established');
        this.stream = stream;

        // Stream SSH output directly to renderer (xterm.js)
        stream.on('data', (data: Buffer) => {
          console.log('[SSHService] Received shell data:', data.length, 'bytes');
          this.emit('data', data.toString());
        });

        // Stream SSH stderr to renderer
        stream.stderr.on('data', (data: Buffer) => {
          console.log('[SSHService] Received shell stderr:', data.length, 'bytes');
          this.emit('data', data.toString());
        });

        // Handle stream events - but don't disconnect on normal close
        stream.on('close', (hadError: boolean) => {
          console.log('[SSHService] ===== SHELL STREAM CLOSED =====', 'hadError:', hadError);
          this.log('Shell stream closed');
          // Only disconnect if we're still marked as connected
          // This prevents immediate disconnect on shell creation
          if (this.status === 'connected') {
            console.log('[SSHService] Disconnecting due to shell close');
            this.disconnect();
          }
        });

        stream.on('exit', (code: any, signal: any) => {
          console.log('[SSHService] Shell exited with code:', code, 'signal:', signal);
          this.log(`Shell exited (code: ${code}, signal: ${signal})`);
        });

        stream.on('error', (error: Error) => {
          console.error('[SSHService] Shell stream error:', error);
          this.emit('error', error);
        });

        // Write initial newline to trigger prompt
        console.log('[SSHService] Writing initial newline to trigger prompt');
        stream.write('\r');
        
        console.log('[SSHService] Shell setup complete, resolving promise');
        resolve();
      });
    });
  }

  /**
   * Resize terminal (cols x rows)
   */
  resize(cols: number, rows: number): void {
    if (this.status !== 'connected' || !this.stream) {
      return;
    }

    // Resize SSH stream (setWindow)
    if (typeof this.stream.setWindow === 'function') {
      try {
        this.stream.setWindow(rows, cols, 0, 0);
      } catch (error) {
        console.error('Failed to resize SSH stream:', error);
      }
    }
  }

  /**
   * Write data to SSH (keyboard input from user)
   */
  write(data: string): void {
    if (this.status !== 'connected' || !this.stream) {
      return;
    }

    try {
      this.stream.write(data);
    } catch (error) {
      console.error('Failed to write to SSH stream:', error);
    }
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    console.log('[SSHService] ===== DISCONNECT CALLED =====');
    console.log('[SSHService] Current status:', this.status);
    console.trace('[SSHService] Disconnect called from:');
    
    if (this.status === 'disconnected') {
      console.log('[SSHService] Already disconnected, skipping');
      return;
    }

    this.log('Disconnecting from server...');

    // Close SSH stream
    if (this.stream) {
      try {
        console.log('[SSHService] Ending stream');
        this.stream.end();
      } catch (error) {
        console.error('[SSHService] Error ending stream:', error);
        // Ignore errors during cleanup
      }
      this.stream = null;
    }

    // End SSH client
    if (this.client) {
      try {
        this.client.end();
      } catch (error) {
        // Ignore errors during cleanup
      }
      this.client = null;
    }

    this.updateStatus('disconnected');
    this.emit('close');
  }

  /**
   * Get current connection status
   */
  getStatus(): 'connecting' | 'connected' | 'disconnected' | 'error' {
    return this.status;
  }

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Get profile
   */
  getProfile(): SSHProfile {
    return this.profile;
  }

  /**
   * Update status and emit event
   */
  private updateStatus(status: 'connecting' | 'connected' | 'disconnected' | 'error'): void {
    this.status = status;
    this.emit('status', status);
  }

  /**
   * Handle connection close
   */
  private handleClose(): void {
    if (this.status !== 'disconnected') {
      this.disconnect();
    }
  }

  /**
   * Emit log message
   */
  private log(message: string): void {
    const timestamp = new Date().toLocaleTimeString();
    this.emit('log', `[${timestamp}] ${message}`);
  }
}
