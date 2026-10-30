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
import { createHash } from 'crypto';
import type { SSHProfile, SSHKey, HostKey } from '../../types';

// Import storage service (runs in main process only)
let knownHostsService: any = null;
if (typeof window === 'undefined') {
  // Main process - import the actual service
  knownHostsService = require('../storage/KnownHostsService').knownHostsService;
}

export interface HostKeyVerificationData {
  host: string;
  port: number;
  fingerprint: string;
  fingerprintMD5: string;
  keyType: string;
  algorithm: string;
  isChanged: boolean;
  oldFingerprint: string | null;
}

export interface SSHConnectionEvents {
  ready: () => void;
  data: (data: string) => void;
  error: (error: Error) => void;
  close: () => void;
  status: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;
  log: (message: string) => void;
  hostKeyVerification: (data: HostKeyVerificationData) => Promise<boolean>;
}

export class SSHConnection extends EventEmitter {
  private client: Client | null = null;
  private stream: any = null;
  private status: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';
  private sessionId: string;
  private profile: SSHProfile;
  private hostKeyRejected = false;

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

    this.hostKeyRejected = false;
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
        hostVerifier: (keyHash: Buffer, callback: (valid: boolean) => void) => {
          console.log('[SSHService] ===== HOST VERIFIER CALLED =====');
          console.log('[SSHService] Key buffer length:', keyHash.length);
          
          // Parse key type from buffer (first 7 bytes usually contain the algorithm name length + name)
          let keyType = 'unknown';
          try {
            // SSH key format: 4 bytes length + algorithm name
            if (keyHash.length > 4) {
              const algoLength = keyHash.readUInt32BE(0);
              if (algoLength > 0 && algoLength < 100 && keyHash.length > 4 + algoLength) {
                keyType = keyHash.slice(4, 4 + algoLength).toString('utf8');
              }
            }
          } catch (e) {
            console.log('[SSHService] Could not parse key type from buffer');
          }
          
          console.log('[SSHService] Detected key type:', keyType);
          
          // Call async verifyHostKey and convert to callback pattern
          this.verifyHostKey(keyHash, keyType)
            .then(accepted => {
              console.log('[SSHService] Host key verification result:', accepted);
              if (!accepted) {
                this.log('❌ Host key rejected by user');
                console.log('[SSHService] ❌ User rejected host key - aborting connection');
                this.hostKeyRejected = true;
                // Manually destroy the connection before calling callback
                if (this.client) {
                  this.client.destroy();
                }
              }
                this.hostKeyRejected = false;
              callback(accepted);
            })
            .catch(err => {
              console.error('[SSHService] Host key verification error:', err);
              this.log('❌ Host key verification error');
              if (this.client) {
                this.client.destroy();
              this.hostKeyRejected = true;
              }
              callback(false);
            });
        },
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
      let settled = false;
      const safeResolve = () => {
        if (settled) {
          return;
        }
        settled = true;
        resolve();
      };
      const safeReject = (error: Error) => {
        if (settled) {
          return;
        }
        settled = true;
        reject(error);
      };

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
          safeResolve();
        } catch (error) {
          console.error('[SSHService] Error in ready handler:', error);
          safeReject(error instanceof Error ? error : new Error(String(error)));
        }
      });

      this.client.on('error', (err) => {
        console.log('[SSHService] ===== ERROR EVENT =====', err.message);
        this.log(`Connection error: ${err.message}`);
        this.updateStatus('error');

        if (this.client) {
          this.client.end();
          this.client.destroy();
        }

        this.emit('error', err);
        safeReject(err instanceof Error ? err : new Error(String(err)));
      });

      this.client.on('close', () => {
        console.log('[SSHService] ===== CLIENT CLOSE EVENT =====');
        console.trace('[SSHService] Close event stack trace');
        if (!settled) {
          if (this.hostKeyRejected) {
            safeReject(new Error('Host key rejected by user'));
          } else {
            safeReject(new Error('SSH connection closed before becoming ready'));
          }
        }
        this.handleClose();
      });

      this.client.on('end', () => {
        console.log('[SSHService] ===== CLIENT END EVENT =====');
        console.trace('[SSHService] End event stack trace');
        if (!settled) {
          if (this.hostKeyRejected) {
            safeReject(new Error('Host key rejected by user'));
          } else {
            safeReject(new Error('SSH connection ended before becoming ready'));
          }
        }
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
   * Generate fingerprint from host key buffer
   * Supports both SHA-256 and MD5 formats
   */
  private generateFingerprintFromBuffer(keyBuffer: Buffer, algorithm: 'sha256' | 'md5'): string {
    const hash = createHash(algorithm).update(keyBuffer).digest();
    
    if (algorithm === 'sha256') {
      // SHA-256: base64-encoded
      return `SHA256:${hash.toString('base64').replace(/=+$/, '')}`;
    } else {
      // MD5: colon-separated hex
      return hash.toString('hex').match(/.{2}/g)?.join(':') || '';
    }
  }

  /**
   * Verify host key - check against known hosts and prompt user if needed
   */
  private async verifyHostKey(keyBuffer: Buffer, keyType: string): Promise<boolean> {
    console.log('[SSHService] ===== VERIFY HOST KEY CALLED =====');
    console.log('[SSHService] Host:', this.profile.host, 'Port:', this.profile.port);
    console.log('[SSHService] knownHostsService available:', !!knownHostsService);
    
    const fingerprint = this.generateFingerprintFromBuffer(keyBuffer, 'sha256');
    const fingerprintMD5 = this.generateFingerprintFromBuffer(keyBuffer, 'md5');
    
    console.log('[SSHService] Generated fingerprints:');
    console.log('[SSHService] SHA-256:', fingerprint);
    console.log('[SSHService] MD5:', fingerprintMD5);
    
    this.log(`Host key received: ${keyType}`);
    this.log(`SHA-256: ${fingerprint}`);
    this.log(`MD5: ${fingerprintMD5}`);
    
    // Check against known hosts
    if (knownHostsService) {
      console.log('[SSHService] Checking known hosts...');
      const storedKey = knownHostsService.getHostKey(this.profile.host, this.profile.port);
      console.log('[SSHService] Stored key found:', !!storedKey);
      
      if (storedKey) {
        console.log('[SSHService] Stored fingerprint:', storedKey.fingerprint);
        // Host key exists - check if it matches
        if (storedKey.fingerprint === fingerprint) {
          // Match! Update last seen and auto-accept
          console.log('[SSHService] ✅ Host key matches! Auto-accepting.');
          this.log('Host key verified against known hosts ✓');
          knownHostsService.updateLastSeen(this.profile.host, this.profile.port);
          return true;
        } else {
          // KEY CHANGED! This is a critical security warning
          console.log('[SSHService] ⚠️ KEY CHANGED! Old:', storedKey.fingerprint, 'New:', fingerprint);
          this.log('⚠️ WARNING: Host key has changed!');
          this.log(`Old: ${storedKey.fingerprint}`);
          this.log(`New: ${fingerprint}`);
          
          // Must prompt user with warning
          const verificationData: HostKeyVerificationData = {
            host: this.profile.host,
            port: this.profile.port,
            fingerprint,
            fingerprintMD5,
            keyType,
            algorithm: 'sha256',
            isChanged: true,
            oldFingerprint: storedKey.fingerprint
          };
          
          console.log('[SSHService] Prompting user for changed key...');
          const accepted = await this.promptUserForHostKey(verificationData);
          console.log('[SSHService] User decision (changed key):', accepted);
          
          if (accepted) {
            // User accepted changed key - update storage
            knownHostsService.saveHostKey(this.profile.host, this.profile.port, fingerprint, fingerprintMD5, keyType, 'sha256');
            this.log('Host key updated in known hosts');
          }
          
          return accepted;
        }
      } else {
        // Unknown host - prompt user for first-time verification
        console.log('[SSHService] 🆕 Unknown host - requesting user verification');
        this.log('Unknown host - requesting user verification');
        
        const verificationData: HostKeyVerificationData = {
          host: this.profile.host,
          port: this.profile.port,
          fingerprint,
          fingerprintMD5,
          keyType,
          algorithm: 'sha256',
          isChanged: false,
          oldFingerprint: null
        };
        
        console.log('[SSHService] Verification data:', verificationData);
        console.log('[SSHService] Prompting user for unknown host...');
        const accepted = await this.promptUserForHostKey(verificationData);
        console.log('[SSHService] User decision (unknown host):', accepted);
        
        if (accepted) {
          // User accepted - save to known hosts
          knownHostsService.saveHostKey(this.profile.host, this.profile.port, fingerprint, fingerprintMD5, keyType, 'sha256');
          this.log('Host key saved to known hosts');
          console.log('[SSHService] Host key saved to storage');
        }
        
        return accepted;
      }
    }
    
    // Fallback: no storage service available, prompt user
    console.log('[SSHService] ⚠️ No storage service, using fallback prompt');
    const verificationData: HostKeyVerificationData = {
      host: this.profile.host,
      port: this.profile.port,
      fingerprint,
      fingerprintMD5,
      keyType,
      algorithm: 'sha256',
      isChanged: false,
      oldFingerprint: null
    };
    
    return await this.promptUserForHostKey(verificationData);
  }

  /**
   * Prompt user for host key verification via UI modal
   */
  private async promptUserForHostKey(data: HostKeyVerificationData): Promise<boolean> {
    console.log('[SSHService] ===== PROMPT USER FOR HOST KEY =====');
    console.log('[SSHService] Listener count for hostKeyVerification:', this.listenerCount('hostKeyVerification'));
    
    // Check if we have a hostKeyVerification handler
    if (this.listenerCount('hostKeyVerification') === 0) {
      // No handler registered, auto-reject for security
      console.log('[SSHService] ❌ No handler registered, rejecting for security');
      this.log('No host key verification handler, rejecting connection');
      return false;
    }
    
    try {
      console.log('[SSHService] Emitting hostKeyVerification event...');
      this.log('Requesting host key verification from user...');

      const [handler] = this.listeners('hostKeyVerification');
      if (!handler) {
        console.log('[SSHService] ❌ No handler function found after listener count check');
        this.log('Host key verification handler missing');
        return false;
      }

      // Handler should return Promise<boolean>
      const accepted = await (handler as (payload: HostKeyVerificationData) => Promise<boolean>)(data);
      console.log('[SSHService] Handler resolved with:', accepted);
      return !!accepted;
    } catch (error) {
      this.log(`Host key verification error: ${error instanceof Error ? error.message : 'Unknown'}`);
      return false;
    }
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
