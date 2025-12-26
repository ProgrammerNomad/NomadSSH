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
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  FormField,
  FormLabel,
  FormError,
} from '@/components/ui';

interface ImportKeyModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (name: string, path: string, group?: string) => void;
}

const DEFAULT_GROUPS = ['Personal', 'Workstation', 'Office', 'Client', 'Temporary'];

const ImportKeyModal: React.FC<ImportKeyModalProps> = ({ open, onClose, onImport }) => {
  const [name, setName] = useState('');
  const [path, setPath] = useState('');
  const [group, setGroup] = useState('Personal');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Key name is required';
    }
    if (!path.trim()) {
      newErrors.path = 'Key path is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImport = () => {
    if (!validate()) return;

    onImport(name.trim(), path.trim(), group);
    setName('');
    setPath('');
    setGroup('Personal');
    setErrors({});
    onClose();
  };

  const handleBrowse = () => {
    // TODO: Implement file picker via Electron IPC
    console.log('Browse for key file...');
  };

  return (
    <Modal open={open} onOpenChange={onClose}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Import SSH Key</ModalTitle>
          <ModalDescription>
            Import an existing SSH private key from your file system
          </ModalDescription>
        </ModalHeader>

        <div className="p-6 space-y-4">
          <FormField>
            <FormLabel htmlFor="keyName" required>
              Key Name
            </FormLabel>
            <Input
              id="keyName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My SSH Key"
              error={!!errors.name}
            />
            {errors.name && <FormError>{errors.name}</FormError>}
          </FormField>

          <FormField>
            <FormLabel htmlFor="keyPath" required>
              Key File Path
            </FormLabel>
            <div className="flex gap-2">
              <Input
                id="keyPath"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="C:\Users\username\.ssh\id_rsa"
                error={!!errors.path}
                className="flex-1"
              />
              <Button variant="secondary" onClick={handleBrowse}>
                Browse
              </Button>
            </div>
            {errors.path && <FormError>{errors.path}</FormError>}
            <p className="text-xs text-text-secondary mt-1">
              Path to your private key file (usually in ~/.ssh/)
            </p>
          </FormField>

          <FormField>
            <FormLabel htmlFor="keyGroup">Group</FormLabel>
            <Select value={group} onValueChange={setGroup}>
              <SelectTrigger id="keyGroup">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEFAULT_GROUPS.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-text-secondary mt-1">
              Organize keys by security context (e.g., workstation keys vs client keys)
            </p>
          </FormField>
        </div>

        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleImport}>
            Import Key
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ImportKeyModal;
