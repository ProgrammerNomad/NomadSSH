import React, { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalFooter,
  Button,
  Input,
  FormField,
  FormLabel,
} from '@/components/ui';

interface ManageHostGroupsModalProps {
  open: boolean;
  onClose: () => void;
  groups: string[];
  onCreateGroup: (groupName: string) => void;
  onRenameGroup: (oldName: string, newName: string) => void;
  onDeleteGroup: (groupName: string) => void;
}

const ManageHostGroupsModal: React.FC<ManageHostGroupsModalProps> = ({
  open,
  onClose,
  groups,
  onCreateGroup,
  onRenameGroup,
  onDeleteGroup,
}) => {
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleCreate = () => {
    if (!newGroupName.trim()) return;
    if (groups.includes(newGroupName.trim())) {
      alert('Group already exists');
      return;
    }
    onCreateGroup(newGroupName.trim());
    setNewGroupName('');
  };

  const handleStartEdit = (groupName: string) => {
    setEditingGroup(groupName);
    setEditName(groupName);
  };

  const handleSaveEdit = () => {
    if (!editName.trim() || editName === editingGroup) {
      setEditingGroup(null);
      return;
    }
    if (groups.includes(editName.trim())) {
      alert('Group already exists');
      return;
    }
    if (editingGroup) {
      onRenameGroup(editingGroup, editName.trim());
    }
    setEditingGroup(null);
  };

  const handleDelete = (groupName: string) => {
    if (confirm(`Delete group "${groupName}"? Profiles will be moved to "Ungrouped".`)) {
      onDeleteGroup(groupName);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent>
        <ModalHeader>Manage Host Groups</ModalHeader>

        <div className="p-6 space-y-4">
          {/* Create New Group */}
          <FormField>
            <FormLabel>Create New Group</FormLabel>
            <div className="flex gap-2">
              <Input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="e.g., Production, Development"
                onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
              />
              <Button variant="primary" onClick={handleCreate} className="whitespace-nowrap">
                Add Group
              </Button>
            </div>
          </FormField>

          {/* Existing Groups */}
          <div>
            <FormLabel>Existing Groups</FormLabel>
            <div className="mt-2 space-y-2">
              {groups.length === 0 ? (
                <p className="text-sm text-text-secondary">No groups yet. Create one above.</p>
              ) : (
                groups.map((group) => (
                  <div
                    key={group}
                    className="flex items-center gap-2 p-2 bg-surface border border-border rounded"
                  >
                    {editingGroup === group ? (
                      <>
                        <Input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') setEditingGroup(null);
                          }}
                          autoFocus
                          className="flex-1"
                        />
                        <Button size="sm" variant="ghost" onClick={handleSaveEdit}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingGroup(null)}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm text-text-primary">{group}</span>
                        <Button size="sm" variant="ghost" onClick={() => handleStartEdit(group)}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(group)} className="text-error">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <ModalFooter>
          <Button variant="secondary" onClick={onClose}>
            Done
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ManageHostGroupsModal;
