import React, { useState } from 'react';
import {
  Button,
  Toggle,
  Modal,
  ModalContent,
  ModalHeader,
  ModalFooter,
  FormField,
  FormLabel,
  StatusIndicator,
} from '@/components/ui';

interface CloudSyncSettingsProps {
  onClose: () => void;
}

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

const CloudSyncSettings: React.FC<CloudSyncSettingsProps> = ({ onClose }) => {
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const handleToggleSync = (enabled: boolean) => {
    if (enabled && !isConnected) {
      // TODO: Implement Google Drive OAuth flow
      console.log('Initiating Google Drive connection...');
      // Simulate connection
      setIsConnected(true);
    }
    setSyncEnabled(enabled);
  };

  const handleManualSync = async () => {
    setSyncStatus('syncing');
    // TODO: Implement actual sync logic
    // Simulate sync process
    setTimeout(() => {
      setSyncStatus('success');
      setLastSyncTime(new Date());
      setTimeout(() => setSyncStatus('idle'), 3000);
    }, 2000);
  };

  const handleResetSync = () => {
    // TODO: Implement reset logic (clear sync metadata, disconnect)
    console.log('Resetting sync...');
    setSyncEnabled(false);
    setIsConnected(false);
    setLastSyncTime(null);
    setSyncStatus('idle');
    setShowResetConfirm(false);
  };

  const getSyncStatusText = () => {
    switch (syncStatus) {
      case 'syncing':
        return 'Syncing...';
      case 'success':
        return 'Sync complete';
      case 'error':
        return 'Sync failed';
      default:
        return lastSyncTime
          ? `Last synced ${formatRelativeTime(lastSyncTime)}`
          : 'Never synced';
    }
  };

  const getSyncStatusColor = (): 'connected' | 'disconnected' | 'connecting' | 'error' => {
    switch (syncStatus) {
      case 'syncing':
        return 'connecting';
      case 'success':
        return 'connected';
      case 'error':
        return 'error';
      default:
        return 'disconnected';
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button size="sm" variant="ghost" onClick={onClose} className="px-2">
            ←
          </Button>
          <h2 className="text-lg font-semibold text-text-primary">Cloud Sync</h2>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl space-y-6">
          {/* Security Notice */}
          <div className="bg-surface border border-border rounded p-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg
                  className="w-5 h-5 text-success"
                  fill="none"
                  strokeWidth="2"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-1">
                  Zero-Knowledge Encryption
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  All your data is encrypted locally using your master password before being
                  uploaded to the cloud. NomadSSH and your cloud provider never have access to
                  your unencrypted data, private keys, or passwords.
                </p>
              </div>
            </div>
          </div>

          {/* Enable Sync */}
          <FormField>
            <div className="flex items-center justify-between">
              <div>
                <FormLabel>Enable Cloud Sync</FormLabel>
                <p className="text-sm text-text-secondary mt-1">
                  Synchronize your profiles and settings across devices
                </p>
              </div>
              <Toggle checked={syncEnabled} onCheckedChange={handleToggleSync} />
            </div>
          </FormField>

          {syncEnabled && (
            <>
              {/* Provider Info */}
              <div className="border border-border rounded p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-surface rounded flex items-center justify-center">
                      <svg className="w-6 h-6 text-text-primary" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">Google Drive</p>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {isConnected ? 'Connected' : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  {!isConnected && (
                    <Button size="sm" variant="secondary" onClick={() => setIsConnected(true)}>
                      Connect
                    </Button>
                  )}
                </div>
              </div>

              {/* Sync Status */}
              {isConnected && (
                <>
                  <FormField>
                    <FormLabel>Sync Status</FormLabel>
                    <div className="flex items-center gap-3 mt-2 p-3 bg-surface rounded border border-border">
                      <StatusIndicator status={getSyncStatusColor()} />
                      <span className="text-sm text-text-primary flex-1">{getSyncStatusText()}</span>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleManualSync}
                        disabled={syncStatus === 'syncing'}
                      >
                        {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
                      </Button>
                    </div>
                  </FormField>

                  {/* Sync Options */}
                  <div className="space-y-3">
                    <FormLabel>Sync Options</FormLabel>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-surface rounded border border-border">
                        <div>
                          <p className="text-sm text-text-primary">Auto-sync on changes</p>
                          <p className="text-xs text-text-secondary mt-1">
                            Automatically sync when profiles or settings change
                          </p>
                        </div>
                        <Toggle defaultChecked />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-surface rounded border border-border">
                        <div>
                          <p className="text-sm text-text-primary">Sync SSH keys</p>
                          <p className="text-xs text-text-secondary mt-1">
                            Include encrypted SSH keys in sync (recommended)
                          </p>
                        </div>
                        <Toggle defaultChecked />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-surface rounded border border-border">
                        <div>
                          <p className="text-sm text-text-primary">Sync on startup</p>
                          <p className="text-xs text-text-secondary mt-1">
                            Pull latest changes when app starts
                          </p>
                        </div>
                        <Toggle defaultChecked />
                      </div>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="pt-4 border-t border-border">
                    <FormLabel>Danger Zone</FormLabel>
                    <div className="mt-3 p-4 bg-surface rounded border border-error/30">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-text-primary">Reset Sync</p>
                          <p className="text-xs text-text-secondary mt-1">
                            Disconnect and clear all sync data. Your local data will remain intact.
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setShowResetConfirm(true)}
                        >
                          Reset
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <Modal open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <ModalContent>
          <ModalHeader>Reset Cloud Sync?</ModalHeader>
          <div className="p-6">
            <p className="text-sm text-text-secondary">
              This will disconnect your Google Drive account and clear all sync metadata. Your
              local profiles and settings will not be affected.
            </p>
            <p className="text-sm text-text-secondary mt-3">
              You can re-enable sync at any time.
            </p>
          </div>
          <ModalFooter>
            <Button variant="ghost" onClick={() => setShowResetConfirm(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleResetSync}>
              Reset Sync
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

// Helper function to format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

export default CloudSyncSettings;
