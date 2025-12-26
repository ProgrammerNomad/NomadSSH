import React, { useState, useMemo } from 'react';
import KeyListGrouped from './KeyListGrouped';
import ImportKeyModal from './ImportKeyModal';
import GenerateKeyModal from './GenerateKeyModal';
import ManageGroupsModal from './ManageGroupsModal';
import { SSHKey } from '@/types';
import { Button } from '@/components/ui';

interface SSHKeyManagerProps {
  keys: SSHKey[];
  onImport: (name: string, path: string, group?: string) => void;
  onGenerate: (name: string, type: string, bits: number, group?: string) => void;
  onDelete: (keyId: string) => void;
  onMoveToGroup?: (keyId: string, group: string) => void;
  onCreateGroup?: (groupName: string) => void;
  onRenameGroup?: (oldName: string, newName: string) => void;
  onDeleteGroup?: (groupName: string) => void;
  onClose?: () => void;
}

const SSHKeyManager: React.FC<SSHKeyManagerProps> = ({
  keys,
  onImport,
  onGenerate,
  onDelete,
  onMoveToGroup,
  onCreateGroup,
  onRenameGroup,
  onDeleteGroup,
  onClose,
}) => {
  const [showImport, setShowImport] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [showManageGroups, setShowManageGroups] = useState(false);

  // Extract unique groups from keys
  const groups = useMemo(() => {
    const uniqueGroups = Array.from(new Set(keys.map((k) => k.group || 'Personal')));
    return uniqueGroups.sort();
  }, [keys]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onClose && (
            <Button size="sm" variant="ghost" onClick={onClose} className="px-2">
              ←
            </Button>
          )}
          <div>
            <h2 className="text-lg font-semibold text-text-primary">SSH Keys</h2>
          <p className="text-sm text-text-secondary mt-1">Manage your SSH keys organized by groups</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setShowManageGroups(true)}>
            Manage Groups
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setShowImport(true)}>
            Import Key
          </Button>
          <Button size="sm" variant="primary" onClick={() => setShowGenerate(true)}>
            Generate New
          </Button>
        </div>
      </div>

      {/* Key List (Grouped) */}
      <div className="flex-1 overflow-hidden">
        <KeyListGrouped keys={keys} onDelete={onDelete} onMoveToGroup={onMoveToGroup} />
      </div>

      <ImportKeyModal
        open={showImport}
        onClose={() => setShowImport(false)}
        onImport={onImport}
      />

      <GenerateKeyModal
        open={showGenerate}
        onClose={() => setShowGenerate(false)}
        onGenerate={onGenerate}
      />

      <ManageGroupsModal
        open={showManageGroups}
        onClose={() => setShowManageGroups(false)}
        groups={groups}
        onCreateGroup={onCreateGroup || (() => {})}
        onRenameGroup={onRenameGroup || (() => {})}
        onDeleteGroup={onDeleteGroup || (() => {})}
      />
    </div>
  );
};

export default SSHKeyManager;
