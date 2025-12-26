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
  SelectGroup,
  SelectLabel,
  FormField,
  FormLabel,
  FormError,
} from '@/components/ui';
import { SSHProfile, SSHKey } from '@/types';
import { PREDEFINED_TAGS, getTagColor, parseTags } from '@/utils/tags';
import IconPickerModal from './IconPickerModal';

interface ProfileManagerProps {
  open: boolean;
  onClose: () => void;
  onSave: (profile: Omit<SSHProfile, 'id' | 'createdAt' | 'updatedAt'>) => void;
  profile?: SSHProfile;
  keys?: SSHKey[];
  groups?: string[];
}

const ProfileManager: React.FC<ProfileManagerProps> = ({ open, onClose, onSave, profile, keys = [], groups = [] }) => {
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    host: profile?.host || '',
    port: profile?.port || 22,
    username: profile?.username || '',
    authMethod: profile?.authMethod || 'password',
    keyId: profile?.keyId || '',
    tags: profile?.tags?.join(', ') || '',
    group: profile?.group || '',
    icon: profile?.icon || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Profile name is required';
    }
    if (!formData.host.trim()) {
      newErrors.host = 'Host is required';
    }
    if (formData.port < 1 || formData.port > 65535) {
      newErrors.port = 'Port must be between 1 and 65535';
    }
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    onSave({
      name: formData.name.trim(),
      host: formData.host.trim(),
      port: formData.port,
      username: formData.username.trim(),
      authMethod: formData.authMethod as 'password' | 'key',
      keyId: formData.keyId || undefined,
      group: formData.group || undefined,
      icon: formData.icon || undefined,
      tags: formData.tags
        ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : undefined,
    });

    onClose();
  };

  const handleTestConnection = () => {
    if (!validate()) return;
    // TODO: Implement test connection
    console.log('Testing connection...', formData);
  };

  return (
    <Modal open={open} onOpenChange={onClose}>
      <ModalContent className="max-w-2xl">
        <ModalHeader>
          <ModalTitle>{profile ? 'Edit Profile' : 'New SSH Profile'}</ModalTitle>
          <ModalDescription>
            Configure SSH connection settings. All fields marked with * are required.
          </ModalDescription>
        </ModalHeader>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Profile Name */}
            <FormField className="col-span-2">
              <FormLabel htmlFor="name" required>
                Profile Name
              </FormLabel>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="My Server"
                error={!!errors.name}
              />
              {errors.name && <FormError>{errors.name}</FormError>}
            </FormField>

            {/* Icon */}
            <FormField>
              <FormLabel htmlFor="icon">Icon</FormLabel>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowIconPicker(true)}
                  className="w-16 h-16 flex items-center justify-center border-2 border-border rounded-lg hover:border-accent transition-colors text-3xl"
                  style={{
                    backgroundColor: formData.icon?.startsWith('#') ? formData.icon : 'transparent'
                  }}
                >
                  {formData.icon && !formData.icon.startsWith('#') ? formData.icon : ''}
                </button>
                <div className="flex-1">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowIconPicker(true)}
                    className="w-full"
                  >
                    {formData.icon ? 'Change Icon' : 'Choose Icon'}
                  </Button>
                  <p className="text-xs text-text-secondary mt-1">
                    Visual identifier for this profile
                  </p>
                </div>
              </div>
            </FormField>

            {/* Group */}
            <FormField className="col-span-2">
              <FormLabel htmlFor="group">Group (optional)</FormLabel>
              <Select 
                value={formData.group || 'ungrouped'} 
                onValueChange={(value) => handleChange('group', value === 'ungrouped' ? '' : value)}
              >
                <SelectTrigger id="group">
                  <SelectValue placeholder="Ungrouped" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ungrouped">Ungrouped</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-text-secondary mt-1">
                Organize profiles into visual folders
              </p>
            </FormField>

            {/* Host */}
            <FormField>
              <FormLabel htmlFor="host" required>
                Host
              </FormLabel>
              <Input
                id="host"
                value={formData.host}
                onChange={(e) => handleChange('host', e.target.value)}
                placeholder="192.168.1.100 or example.com"
                error={!!errors.host}
              />
              {errors.host && <FormError>{errors.host}</FormError>}
            </FormField>

            {/* Port */}
            <FormField>
              <FormLabel htmlFor="port" required>
                Port
              </FormLabel>
              <Input
                id="port"
                type="number"
                value={formData.port}
                onChange={(e) => handleChange('port', parseInt(e.target.value) || 22)}
                placeholder="22"
                error={!!errors.port}
              />
              {errors.port && <FormError>{errors.port}</FormError>}
            </FormField>

            {/* Username */}
            <FormField>
              <FormLabel htmlFor="username" required>
                Username
              </FormLabel>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                placeholder="root"
                error={!!errors.username}
              />
              {errors.username && <FormError>{errors.username}</FormError>}
            </FormField>

            {/* Auth Method */}
            <FormField>
              <FormLabel htmlFor="authMethod">Authentication Method</FormLabel>
              <Select
                value={formData.authMethod}
                onValueChange={(value) => handleChange('authMethod', value)}
              >
                <SelectTrigger id="authMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="password">Password</SelectItem>
                  <SelectItem value="key">SSH Key</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            {/* SSH Key Selector (if auth method is key) */}
            {formData.authMethod === 'key' && (
              <FormField className="col-span-2">
                <FormLabel htmlFor="keyId">SSH Key</FormLabel>
                <Select value={formData.keyId} onValueChange={(value) => handleChange('keyId', value)}>
                  <SelectTrigger id="keyId">
                    <SelectValue placeholder="Select an SSH key" />
                  </SelectTrigger>
                  <SelectContent>
                    {keys.length === 0 ? (
                      <SelectItem value="no-keys" disabled>
                        No keys available
                      </SelectItem>
                    ) : (
                      <>
                        {/* Auto option - try all keys */}
                        <SelectItem value="auto">
                          Auto (try all keys)
                        </SelectItem>
                        
                        {(() => {
                          // Group keys by group field
                          const grouped = keys.reduce((acc, key) => {
                            const group = key.group || 'Personal';
                            if (!acc[group]) acc[group] = [];
                            acc[group].push(key);
                            return acc;
                          }, {} as Record<string, SSHKey[]>);

                          // Render grouped items
                          return Object.keys(grouped).sort().map((groupName) => (
                            <SelectGroup key={groupName}>
                              <SelectLabel>{groupName}</SelectLabel>
                              {grouped[groupName].map((key) => (
                                <SelectItem key={key.id} value={key.id}>
                                  {key.name} ({key.type.toUpperCase()})
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          ));
                        })()}
                      </>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-text-secondary mt-1">
                  {formData.keyId === 'auto' 
                    ? 'Will try all available keys until one succeeds'
                    : 'No keys found? Add them in SSH Key Manager'
                  }
                </p>
              </FormField>
            )}

            {/* Tags */}
            <FormField className="col-span-2">
              <FormLabel htmlFor="tags">Tags (optional)</FormLabel>
              <div className="relative">
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => {
                    handleChange('tags', e.target.value);
                    setTagInput(e.target.value);
                    setShowTagSuggestions(true);
                  }}
                  onFocus={() => setShowTagSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                  placeholder="production, web, database"
                />
                
                {/* Tag Suggestions Dropdown */}
                {showTagSuggestions && tagInput && (
                  <div className="absolute z-50 w-full mt-1 bg-surface border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {PREDEFINED_TAGS.filter((tag) =>
                      tag.toLowerCase().includes(tagInput.split(',').pop()?.trim().toLowerCase() || '')
                    ).map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const currentTags = parseTags(formData.tags);
                          // Remove the incomplete tag being typed
                          currentTags.pop();
                          // Add the selected tag
                          currentTags.push(tag);
                          const newTagString = currentTags.join(', ');
                          handleChange('tags', newTagString);
                          setTagInput('');
                          setShowTagSuggestions(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-border transition-colors flex items-center gap-2"
                      >
                        <span className={`text-xs px-2 py-0.5 rounded border ${getTagColor(tag)}`}>
                          {tag}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Current Tags Display */}
              {formData.tags && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {parseTags(formData.tags).map((tag, idx) => (
                    <span
                      key={idx}
                      className={`text-xs px-2 py-1 rounded border ${getTagColor(tag)}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              
              <p className="text-xs text-text-secondary mt-1">
                Separate multiple tags with commas. Suggestions: {PREDEFINED_TAGS.slice(0, 5).join(', ')}
              </p>
            </FormField>
          </div>
        </div>

        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={handleTestConnection}>
            Test Connection
          </Button>
          <Button variant="primary" onClick={handleSave}>
            {profile ? 'Save Changes' : 'Create Profile'}
          </Button>
        </ModalFooter>
      </ModalContent>

      <IconPickerModal
        open={showIconPicker}
        onClose={() => setShowIconPicker(false)}
        onSelect={(icon) => handleChange('icon', icon)}
        currentIcon={formData.icon}
      />
    </Modal>
  );
};

export default ProfileManager;
