import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalFooter,
  Button,
  Input,
  FormField,
  FormLabel,
  FormError,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui';
import { Snippet } from '@/types';

interface AddSnippetModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (snippetData: Omit<Snippet, 'id' | 'createdAt' | 'updatedAt'>) => void;
  snippet?: Snippet;
}

const AddSnippetModal: React.FC<AddSnippetModalProps> = ({
  open,
  onClose,
  onSave,
  snippet,
}) => {
  const [name, setName] = useState('');
  const [command, setCommand] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Snippet['category']>('Custom');
  const [errors, setErrors] = useState<{ name?: string; command?: string }>({});

  useEffect(() => {
    if (snippet) {
      setName(snippet.name);
      setCommand(snippet.command);
      setDescription(snippet.description || '');
      setCategory(snippet.category);
    } else {
      setName('');
      setCommand('');
      setDescription('');
      setCategory('Custom');
    }
    setErrors({});
  }, [snippet, open]);

  const extractVariables = (cmd: string): string[] => {
    const variableRegex = /\$\{([^}]+)\}/g;
    const variables: string[] = [];
    let match;
    while ((match = variableRegex.exec(cmd)) !== null) {
      if (!variables.includes(`\${${match[1]}}`)) {
        variables.push(`\${${match[1]}}`);
      }
    }
    return variables;
  };

  const validate = () => {
    const newErrors: { name?: string; command?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!command.trim()) {
      newErrors.command = 'Command is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const variables = extractVariables(command);

    onSave({
      name: name.trim(),
      command: command.trim(),
      description: description.trim() || undefined,
      category,
      variables: variables.length > 0 ? variables : undefined,
      lastUsed: snippet?.lastUsed,
    });

    onClose();
  };

  const handleCancel = () => {
    setErrors({});
    onClose();
  };

  return (
    <Modal open={open} onClose={handleCancel}>
      <ModalContent>
        <ModalHeader>
          {snippet ? 'Edit Snippet' : 'Add New Snippet'}
        </ModalHeader>

        <div className="p-6 space-y-4">
          {/* Name */}
          <FormField>
            <FormLabel htmlFor="snippet-name">
              Name <span className="text-error">*</span>
            </FormLabel>
            <Input
              id="snippet-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Check disk usage"
              autoFocus
            />
            {errors.name && <FormError>{errors.name}</FormError>}
          </FormField>

          {/* Category */}
          <FormField>
            <FormLabel htmlFor="snippet-category">Category</FormLabel>
            <Select value={category} onValueChange={(value) => setCategory(value as Snippet['category'])}>
              <SelectTrigger id="snippet-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="System">System</SelectItem>
                <SelectItem value="Network">Network</SelectItem>
                <SelectItem value="Docker">Docker</SelectItem>
                <SelectItem value="Git">Git</SelectItem>
                <SelectItem value="Database">Database</SelectItem>
                <SelectItem value="Custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          {/* Command */}
          <FormField>
            <FormLabel htmlFor="snippet-command">
              Command <span className="text-error">*</span>
            </FormLabel>
            <textarea
              id="snippet-command"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="e.g., df -h | grep '${MOUNT_POINT}'"
              rows={4}
              className="w-full px-3 py-2 bg-background text-text-primary border border-border rounded font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent"
            />
            {errors.command && <FormError>{errors.command}</FormError>}
            <p className="text-xs text-text-secondary mt-1">
              Use variables: $&#123;HOST&#125;, $&#123;USER&#125;, $&#123;PORT&#125;, $&#123;CUSTOM&#125;, $&#123;CLIPBOARD&#125;
            </p>
          </FormField>

          {/* Description */}
          <FormField>
            <FormLabel htmlFor="snippet-description">Description (optional)</FormLabel>
            <Input
              id="snippet-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what this command does"
            />
          </FormField>

          {/* Variables Preview */}
          {extractVariables(command).length > 0 && (
            <div className="bg-accent/10 border border-accent/30 rounded p-3">
              <p className="text-xs text-text-secondary mb-2">Detected variables:</p>
              <div className="flex flex-wrap gap-2">
                {extractVariables(command).map((variable) => (
                  <span
                    key={variable}
                    className="px-2 py-1 bg-accent/20 text-accent rounded text-xs font-mono"
                  >
                    {variable}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <ModalFooter>
          <Button variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            {snippet ? 'Save Changes' : 'Add Snippet'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddSnippetModal;
