import React, { useState } from 'react';
import {
  Button,
  Toggle,
  Modal,
  ModalContent,
  ModalHeader,
  ModalFooter,
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
import { Tunnel } from '@/types';

interface TunnelManagerProps {
  tunnels: Tunnel[];
  onAdd: (tunnel: Omit<Tunnel, 'id'>) => void;
  onEdit: (id: string, tunnel: Partial<Tunnel>) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
  onClose?: () => void;
}

const TunnelManager: React.FC<TunnelManagerProps> = ({
  tunnels,
  onAdd,
  onEdit,
  onDelete,
  onToggle,
  onClose,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTunnel, setEditingTunnel] = useState<Tunnel | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleAdd = () => {
    setEditingTunnel(null);
    setShowAddModal(true);
  };

  const handleEdit = (tunnel: Tunnel) => {
    setEditingTunnel(tunnel);
    setShowAddModal(true);
  };

  const handleDelete = (id: string) => {
    onDelete(id);
    setDeleteConfirm(null);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'local':
        return 'Local';
      case 'remote':
        return 'Remote';
      case 'dynamic':
        return 'Dynamic (SOCKS5)';
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'local':
        return 'bg-success/20 text-success';
      case 'remote':
        return 'bg-accent/20 text-accent';
      case 'dynamic':
        return 'bg-warning/20 text-warning';
      default:
        return 'bg-surface text-text-secondary';
    }
  };

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
            <h2 className="text-lg font-semibold text-text-primary">Port Forwarding</h2>
            <p className="text-sm text-text-secondary mt-1">Manage SSH tunnels and port forwards</p>
          </div>
        </div>
        <Button size="sm" variant="primary" onClick={handleAdd}>
          + Add Tunnel
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {tunnels.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-text-secondary mb-4">No tunnels configured</p>
              <Button variant="secondary" onClick={handleAdd}>
                Create your first tunnel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {tunnels.map((tunnel) => (
              <div
                key={tunnel.id}
                className="bg-surface border border-border rounded p-4 hover:border-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-semibold text-text-primary">{tunnel.name}</h3>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(
                          tunnel.type
                        )}`}
                      >
                        {getTypeLabel(tunnel.type)}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 text-sm text-text-secondary">
                        <span className="font-medium">Source Port:</span>
                        <span className="font-mono">{tunnel.sourcePort}</span>
                      </div>
                      {tunnel.type !== 'dynamic' && (
                        <div className="flex items-center gap-2 text-sm text-text-secondary">
                          <span className="font-medium">Destination:</span>
                          <span className="font-mono">
                            {tunnel.destinationHost}:{tunnel.destinationPort}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Toggle
                      checked={tunnel.enabled}
                      onCheckedChange={(enabled) => onToggle(tunnel.id, enabled)}
                    />
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(tunnel)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteConfirm(tunnel.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <TunnelFormModal
        open={showAddModal}
        tunnel={editingTunnel}
        onClose={() => {
          setShowAddModal(false);
          setEditingTunnel(null);
        }}
        onSave={(tunnel) => {
          if (editingTunnel) {
            onEdit(editingTunnel.id, tunnel);
          } else {
            onAdd(tunnel as Omit<Tunnel, 'id'>);
          }
          setShowAddModal(false);
          setEditingTunnel(null);
        }}
      />

      {/* Delete Confirmation */}
      <Modal open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <ModalContent>
          <ModalHeader>Delete Tunnel?</ModalHeader>
          <div className="p-6">
            <p className="text-sm text-text-secondary">
              Are you sure you want to delete this tunnel? This action cannot be undone.
            </p>
          </div>
          <ModalFooter>
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

interface TunnelFormModalProps {
  open: boolean;
  tunnel: Tunnel | null;
  onClose: () => void;
  onSave: (tunnel: Omit<Tunnel, 'id'>) => void;
}

const TunnelFormModal: React.FC<TunnelFormModalProps> = ({ open, tunnel, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'local' | 'remote' | 'dynamic'>('local');
  const [sourcePort, setSourcePort] = useState('');
  const [destinationHost, setDestinationHost] = useState('');
  const [destinationPort, setDestinationPort] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (open) {
      if (tunnel) {
        setName(tunnel.name);
        setType(tunnel.type);
        setSourcePort(tunnel.sourcePort.toString());
        setDestinationHost(tunnel.destinationHost || '');
        setDestinationPort(tunnel.destinationPort?.toString() || '');
      } else {
        setName('');
        setType('local');
        setSourcePort('');
        setDestinationHost('');
        setDestinationPort('');
      }
      setErrors({});
    }
  }, [open, tunnel]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    const portNum = parseInt(sourcePort);
    if (!sourcePort || isNaN(portNum) || portNum < 1 || portNum > 65535) {
      newErrors.sourcePort = 'Valid port (1-65535) required';
    }

    if (type !== 'dynamic') {
      if (!destinationHost.trim()) {
        newErrors.destinationHost = 'Destination host is required';
      }

      const destPortNum = parseInt(destinationPort);
      if (!destinationPort || isNaN(destPortNum) || destPortNum < 1 || destPortNum > 65535) {
        newErrors.destinationPort = 'Valid port (1-65535) required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    onSave({
      name: name.trim(),
      type,
      sourcePort: parseInt(sourcePort),
      destinationHost: type === 'dynamic' ? undefined : destinationHost.trim(),
      destinationPort: type === 'dynamic' ? undefined : parseInt(destinationPort),
      enabled: tunnel?.enabled ?? false,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Modal open={open} onOpenChange={onClose}>
      <ModalContent>
        <ModalHeader>{tunnel ? 'Edit Tunnel' : 'Add Tunnel'}</ModalHeader>
        <div className="p-6 space-y-4">
          {/* Info Banner */}
          <div className="bg-surface border border-border rounded p-3 text-sm text-text-secondary">
            <p className="mb-2">
              <strong className="text-text-primary">Local:</strong> Forward local port to remote
              destination
            </p>
            <p className="mb-2">
              <strong className="text-text-primary">Remote:</strong> Forward remote port to local
              destination
            </p>
            <p>
              <strong className="text-text-primary">Dynamic:</strong> SOCKS5 proxy on local port
            </p>
          </div>

          {/* Name */}
          <FormField>
            <FormLabel htmlFor="tunnelName" required>
              Name
            </FormLabel>
            <Input
              id="tunnelName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="My Tunnel"
              error={!!errors.name}
            />
            {errors.name && <FormError>{errors.name}</FormError>}
          </FormField>

          {/* Type */}
          <FormField>
            <FormLabel htmlFor="tunnelType" required>
              Type
            </FormLabel>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger id="tunnelType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="local">Local Forward</SelectItem>
                <SelectItem value="remote">Remote Forward</SelectItem>
                <SelectItem value="dynamic">Dynamic (SOCKS5)</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          {/* Source Port */}
          <FormField>
            <FormLabel htmlFor="sourcePort" required>
              {type === 'remote' ? 'Remote Port' : 'Local Port'}
            </FormLabel>
            <Input
              id="sourcePort"
              value={sourcePort}
              onChange={(e) => setSourcePort(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="8080"
              error={!!errors.sourcePort}
            />
            {errors.sourcePort && <FormError>{errors.sourcePort}</FormError>}
          </FormField>

          {/* Destination (not for dynamic) */}
          {type !== 'dynamic' && (
            <>
              <FormField>
                <FormLabel htmlFor="destinationHost" required>
                  Destination Host
                </FormLabel>
                <Input
                  id="destinationHost"
                  value={destinationHost}
                  onChange={(e) => setDestinationHost(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="localhost or 192.168.1.1"
                  error={!!errors.destinationHost}
                />
                {errors.destinationHost && <FormError>{errors.destinationHost}</FormError>}
              </FormField>

              <FormField>
                <FormLabel htmlFor="destinationPort" required>
                  Destination Port
                </FormLabel>
                <Input
                  id="destinationPort"
                  value={destinationPort}
                  onChange={(e) => setDestinationPort(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="80"
                  error={!!errors.destinationPort}
                />
                {errors.destinationPort && <FormError>{errors.destinationPort}</FormError>}
              </FormField>
            </>
          )}
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            {tunnel ? 'Save' : 'Add'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default TunnelManager;
