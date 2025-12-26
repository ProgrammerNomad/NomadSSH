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

const DEFAULT_GROUPS = ['Personal', 'Workstation', 'Office', 'Client', 'Temporary'];

interface GenerateKeyModalProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (name: string, type: string, bits: number, group?: string) => void;
}

const GenerateKeyModal: React.FC<GenerateKeyModalProps> = ({ open, onClose, onGenerate }) => {
  const [name, setName] = useState('');
  const [keyType, setKeyType] = useState('ed25519');
  const [bits, setBits] = useState(4096);
  const [group, setGroup] = useState('Personal');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Key name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGenerate = () => {
    if (!validate()) return;

    onGenerate(name.trim(), keyType, bits, group);
    setName('');
    setKeyType('ed25519');
    setBits(4096);
    setGroup('Personal');
    setErrors({});
    onClose();
  };

  return (
    <Modal open={open} onOpenChange={onClose}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Generate New SSH Key</ModalTitle>
          <ModalDescription>
            Create a new SSH key pair for authentication
          </ModalDescription>
        </ModalHeader>

        <div className="p-6 space-y-4">
          <FormField>
            <FormLabel htmlFor="genKeyName" required>
              Key Name
            </FormLabel>
            <Input
              id="genKeyName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My New Key"
              error={!!errors.name}
            />
            {errors.name && <FormError>{errors.name}</FormError>}
          </FormField>

          <FormField>
            <FormLabel htmlFor="genKeyGroup">Group</FormLabel>
            <Select value={group} onValueChange={setGroup}>
              <SelectTrigger id="genKeyGroup">
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
              Organize keys by security context
            </p>
          </FormField>

          <FormField>
            <FormLabel htmlFor="keyType">Key Type</FormLabel>
            <Select value={keyType} onValueChange={setKeyType}>
              <SelectTrigger id="keyType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ed25519">ED25519 (Recommended)</SelectItem>
                <SelectItem value="rsa">RSA</SelectItem>
                <SelectItem value="ecdsa">ECDSA</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-text-secondary mt-1">
              ED25519 is the most secure and fastest option
            </p>
          </FormField>

          {keyType === 'rsa' && (
            <FormField>
              <FormLabel htmlFor="bits">Key Size (bits)</FormLabel>
              <Select value={bits.toString()} onValueChange={(v) => setBits(parseInt(v))}>
                <SelectTrigger id="bits">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2048">2048</SelectItem>
                  <SelectItem value="4096">4096 (Recommended)</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          )}
        </div>

        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleGenerate}>
            Generate Key
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default GenerateKeyModal;
