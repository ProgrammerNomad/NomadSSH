import React, { useState } from 'react';
import { Button } from '@/components/ui';
import { SSHKey } from '@/types';
import KeyGroupHeader from './KeyGroupHeader';

interface KeyListGroupedProps {
  keys: SSHKey[];
  onDelete: (keyId: string) => void;
  onMoveToGroup?: (keyId: string, group: string) => void;
}

const KeyListGrouped: React.FC<KeyListGroupedProps> = ({ keys, onDelete, onMoveToGroup }) => {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Group keys by their group field (default to "Personal")
  const groupedKeys = keys.reduce((acc, key) => {
    const group = key.group || 'Personal';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(key);
    return acc;
  }, {} as Record<string, SSHKey[]>);

  const toggleGroup = (group: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(group)) {
      newCollapsed.delete(group);
    } else {
      newCollapsed.add(group);
    }
    setCollapsedGroups(newCollapsed);
  };

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
      {keys.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-text-secondary mb-2">No SSH keys found</p>
            <p className="text-sm text-text-secondary">Import or generate a key to get started</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {Object.entries(groupedKeys).sort(([a], [b]) => a.localeCompare(b)).map(([group, groupKeys]) => (
            <div key={group} className="mb-0">
              <KeyGroupHeader
                groupName={group}
                keyCount={groupKeys.length}
                collapsed={collapsedGroups.has(group)}
                onToggle={() => toggleGroup(group)}
              />
              {!collapsedGroups.has(group) && (
                <div className="space-y-2 p-4 bg-background">
                  {groupKeys.map((key) => (
                    <div
                      key={key.id}
                      className="p-4 bg-surface rounded border border-border hover:border-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-sm font-semibold text-text-primary">
                              {key.name}
                            </h3>
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${
                                key.type === 'ed25519'
                                  ? 'bg-success/20 text-success'
                                  : key.type === 'rsa'
                                  ? 'bg-accent/20 text-accent'
                                  : 'bg-warning/20 text-warning'
                              }`}
                            >
                              {key.type.toUpperCase()}
                            </span>
                          </div>
                          <div className="space-y-1 text-sm text-text-secondary">
                            <p className="font-mono text-xs">{key.fingerprint}</p>
                            <p className="text-xs">{key.path}</p>
                            <p className="text-xs">
                              Created {new Date(key.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={deleteConfirm === key.id ? 'danger' : 'ghost'}
                          onClick={() => handleDelete(key.id)}
                        >
                          {deleteConfirm === key.id ? 'Confirm Delete' : 'Delete'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default KeyListGrouped;
