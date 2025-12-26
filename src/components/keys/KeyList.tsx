import React, { useState } from 'react';
import { Button, Input, FormField, FormLabel, FormError } from '@/components/ui';
import { SSHKey } from '@/types';

interface KeyListProps {
  keys: SSHKey[];
  onDelete: (keyId: string) => void;
  onImport: () => void;
  onGenerate: () => void;
}

const KeyList: React.FC<KeyListProps> = ({ keys, onDelete, onImport, onGenerate }) => {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDelete = (keyId: string) => {
    if (deleteConfirm === keyId) {
      onDelete(keyId);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(keyId);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-text-primary mb-4">SSH Key Manager</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="primary" onClick={onImport}>
            Import Key
          </Button>
          <Button size="sm" variant="secondary" onClick={onGenerate}>
            Generate New Key
          </Button>
        </div>
      </div>

      {/* Key List */}
      <div className="flex-1 overflow-y-auto p-4">
        {keys.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-secondary mb-4">No SSH keys configured</p>
            <p className="text-sm text-text-secondary">
              Import an existing key or generate a new one to get started
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {keys.map((key) => (
              <div
                key={key.id}
                className="p-4 bg-surface border border-border rounded hover:border-border/70 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-text-primary">{key.name}</h3>
                      <span className="text-xs px-2 py-0.5 bg-background border border-border rounded uppercase">
                        {key.type}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-text-secondary">
                        <span className="font-medium">Fingerprint:</span>{' '}
                        <code className="text-xs bg-background px-1.5 py-0.5 rounded">
                          {key.fingerprint}
                        </code>
                      </p>
                      <p className="text-xs text-text-secondary">
                        <span className="font-medium">Path:</span> {key.path}
                      </p>
                      <p className="text-xs text-text-secondary">
                        Added: {new Date(key.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={deleteConfirm === key.id ? 'danger' : 'ghost'}
                    onClick={() => handleDelete(key.id)}
                  >
                    {deleteConfirm === key.id ? 'Confirm Delete' : 'Remove'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security Notice */}
      <div className="p-4 border-t border-border bg-surface">
        <p className="text-xs text-text-secondary">
          Your private keys are stored encrypted and never transmitted in plaintext
        </p>
      </div>
    </div>
  );
};

export default KeyList;
