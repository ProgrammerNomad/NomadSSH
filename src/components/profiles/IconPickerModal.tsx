import React, { useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalFooter, Button } from '@/components/ui';

interface IconPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (icon: string) => void;
  currentIcon?: string;
}

const PRESET_ICONS = [
  // Servers & Infrastructure
  '🖥️', '💻', '🌐', '☁️', '🗄️', '📡', '🔧', '⚙️',
  // Environments
  '🟢', '🔵', '🔴', '🟡', '🟣', '🟠', '⚫', '⚪',
  // Symbols
  '🔥', '⚡', '💎', '🚀', '🎯', '⭐', '✨', '🌟',
  // Development
  '🐍', '🦀', '🐘', '🐳', '🦊', '🐧', '🍎', '🪟',
  // Database
  '📊', '📈', '💾', '💿', '🗃️', '📦', '🔐', '🔒',
  // Web
  '🌍', '🌎', '🌏', '🔗', '📱', '💬', '📧', '📮',
  // Actions
  '✅', '❌', '⚠️', '🔔', '🔕', '🛠️', '⚒️', '🔨',
  // Numbers
  '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟',
];

const PRESET_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#10b981', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
  '#f43f5e', // rose
  '#64748b', // slate
];

const IconPickerModal: React.FC<IconPickerModalProps> = ({
  open,
  onClose,
  onSelect,
  currentIcon,
}) => {
  const [selectedType, setSelectedType] = useState<'emoji' | 'color'>('emoji');
  const [customIcon, setCustomIcon] = useState('');

  const handleSelect = (icon: string) => {
    onSelect(icon);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent>
        <ModalHeader>Choose Icon</ModalHeader>

        <div className="p-6 space-y-4">
          {/* Type Selector */}
          <div className="flex gap-2 border-b border-border pb-3">
            <Button
              size="sm"
              variant={selectedType === 'emoji' ? 'primary' : 'ghost'}
              onClick={() => setSelectedType('emoji')}
            >
              Emoji
            </Button>
            <Button
              size="sm"
              variant={selectedType === 'color' ? 'primary' : 'ghost'}
              onClick={() => setSelectedType('color')}
            >
              Color
            </Button>
          </div>

          {/* Emoji Picker */}
          {selectedType === 'emoji' && (
            <>
              <div className="grid grid-cols-8 gap-2">
                {PRESET_ICONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => handleSelect(icon)}
                    className={`w-10 h-10 flex items-center justify-center text-2xl rounded hover:bg-border transition-colors ${
                      currentIcon === icon ? 'bg-accent/20 ring-2 ring-accent' : ''
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>

              {/* Custom Emoji Input */}
              <div>
                <label className="text-sm text-text-secondary mb-2 block">
                  Or enter custom emoji:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customIcon}
                    onChange={(e) => setCustomIcon(e.target.value)}
                    placeholder="Paste emoji here"
                    className="flex-1 px-3 py-2 bg-background text-text-primary border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent"
                    maxLength={2}
                  />
                  <Button
                    variant="secondary"
                    onClick={() => customIcon && handleSelect(customIcon)}
                    disabled={!customIcon}
                  >
                    Use
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Color Picker */}
          {selectedType === 'color' && (
            <div className="grid grid-cols-6 gap-3">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => handleSelect(color)}
                  className={`w-12 h-12 rounded-full transition-transform hover:scale-110 ${
                    currentIcon === color ? 'ring-4 ring-accent ring-offset-2 ring-offset-background' : ''
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          )}
        </div>

        <ModalFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="ghost"
            onClick={() => handleSelect('')}
          >
            Clear Icon
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default IconPickerModal;
