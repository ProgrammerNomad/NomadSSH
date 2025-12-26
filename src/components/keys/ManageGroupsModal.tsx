import React, { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  Button,
  Input,
  FormField,
  FormLabel,
  FormError,
} from '@/components/ui';

interface ManageGroupsModalProps {
  open: boolean;
  onClose: () => void;
  groups: string[];
  onCreateGroup: (groupName: string) => void;
  onRenameGroup: (oldName: string, newName: string) => void;
  onDeleteGroup: (groupName: string) => void;
}

const DEFAULT_GROUPS = ['Personal', 'Workstation', 'Office', 'Client', 'Temporary'];

const ManageGroupsModal: React.FC<ManageGroupsModalProps> = ({
  open,
  onClose,
  groups,
  onCreateGroup,
  onRenameGroup,
  onDeleteGroup,
}) => {
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleCreate = () => {
    const trimmed = newGroupName.trim();
    if (!trimmed) {
      setErrors({ create: 'Group name cannot be empty' });
      return;
    }
    if (groups.includes(trimmed)) {
      setErrors({ create: 'Group already exists' });
      return;
    }
    onCreateGroup(trimmed);
    setNewGroupName('');
    setErrors({});
  };

  const handleStartEdit = (groupName: string) => {
    setEditingGroup(groupName);
    setEditValue(groupName);
    setErrors({});
  };

  const handleSaveEdit = () => {
    if (!editingGroup) return;
    const trimmed = editValue.trim();
    if (!trimmed) {
      setErrors({ edit: 'Group name cannot be empty' });
      return;
    }
    if (trimmed !== editingGroup && groups.includes(trimmed)) {
      setErrors({ edit: 'Group already exists' });
      return;
    }
    onRenameGroup(editingGroup, trimmed);
    setEditingGroup(null);
    setEditValue('');
    setErrors({});
  };

  const handleCancelEdit = () => {
    setEditingGroup(null);
    setEditValue('');
    setErrors({});
  };

  const handleDelete = (groupName: string) => {
    if (DEFAULT_GROUPS.includes(groupName)) {
      alert('Cannot delete default groups');
      return;
    }
    if (confirm(`Delete group "${groupName}"? Keys in this group will be moved to "Personal".`)) {
      onDeleteGroup(groupName);
    }
  };

  return (
    <Modal open={open} onOpenChange={onClose}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Manage Key Groups</ModalTitle>
          <ModalDescription>
            Create, rename, or delete key groups. Default groups cannot be deleted.
          </ModalDescription>
        </ModalHeader>

        <div className="p-6 space-y-4">
          {/* Create New Group */}
          <FormField>
            <FormLabel htmlFor="newGroup">Create New Group</FormLabel>
            <div className="flex gap-2">
              <Input
                id="newGroup"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Enter group name"
                error={!!errors.create}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
              <Button variant="primary" onClick={handleCreate}>
                Create
              </Button>
            </div>
            {errors.create && <FormError>{errors.create}</FormError>}
          </FormField>

          {/* Existing Groups */}
          <div>
            <FormLabel>Existing Groups</FormLabel>
            <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
              {groups.length === 0 ? (
                <p className="text-sm text-text-secondary">No groups yet. Create one above.</p>
              ) : (
                groups.map((group) => (
                  <div
                    key={group}
                    className="flex items-center gap-2 p-2 rounded border border-border bg-surface-hover"
                  >
                    {editingGroup === group ? (
                      <>
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="flex-1"
                          error={!!errors.edit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                        />
                        <Button variant="primary" size="sm" onClick={handleSaveEdit}>
                          Save
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm text-text-primary">{group}</span>
                        {DEFAULT_GROUPS.includes(group) && (
                          <span className="text-xs text-text-secondary bg-surface px-2 py-0.5 rounded">
                            Default
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStartEdit(group)}
                          disabled={DEFAULT_GROUPS.includes(group)}
                        >
                          Rename
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(group)}
                          disabled={DEFAULT_GROUPS.includes(group)}
                          className="text-red-500 hover:text-red-400"
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                ))
              )}
              {errors.edit && <FormError>{errors.edit}</FormError>}
            </div>
          </div>
        </div>

        <ModalFooter>
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ManageGroupsModal;
