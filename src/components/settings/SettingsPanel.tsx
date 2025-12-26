import React, { useState } from 'react';
import {
  Button,
  Toggle,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  FormField,
  FormLabel,
} from '@/components/ui';
import { MasterPasswordModal } from '@/components/auth';

interface SettingsPanelProps {
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [lockOnIdle, setLockOnIdle] = useState(false);
  const [idleTimeout, setIdleTimeout] = useState('15');
  const [defaultShell, setDefaultShell] = useState('bash');
  const [theme, setTheme] = useState('dark');

  const handleChangePassword = (newPassword: string) => {
    // TODO: Implement password change logic
    console.log('Changing password...');
    setShowChangePassword(false);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button size="sm" variant="ghost" onClick={onClose} className="px-2">
            ←
          </Button>
          <h2 className="text-lg font-semibold text-text-primary">Settings</h2>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl space-y-8">
          {/* Security Section */}
          <section>
            <h3 className="text-base font-semibold text-text-primary mb-4 pb-2 border-b border-border">
              Security
            </h3>
            <div className="space-y-4">
              {/* Change Master Password */}
              <FormField>
                <div className="flex items-center justify-between">
                  <div>
                    <FormLabel>Master Password</FormLabel>
                    <p className="text-sm text-text-secondary mt-1">
                      Change your master password used for encryption
                    </p>
                  </div>
                  <Button variant="secondary" onClick={() => setShowChangePassword(true)}>
                    Change
                  </Button>
                </div>
              </FormField>

              {/* Lock on Idle */}
              <FormField>
                <div className="flex items-center justify-between">
                  <div>
                    <FormLabel>Lock on Idle</FormLabel>
                    <p className="text-sm text-text-secondary mt-1">
                      Automatically lock the app after period of inactivity
                    </p>
                  </div>
                  <Toggle checked={lockOnIdle} onCheckedChange={setLockOnIdle} />
                </div>
              </FormField>

              {/* Idle Timeout */}
              {lockOnIdle && (
                <FormField className="ml-6">
                  <FormLabel htmlFor="idleTimeout">Idle Timeout (minutes)</FormLabel>
                  <Select value={idleTimeout} onValueChange={setIdleTimeout}>
                    <SelectTrigger id="idleTimeout" className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 minutes</SelectItem>
                      <SelectItem value="10">10 minutes</SelectItem>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              )}
            </div>
          </section>

          {/* Preferences Section */}
          <section>
            <h3 className="text-base font-semibold text-text-primary mb-4 pb-2 border-b border-border">
              Preferences
            </h3>
            <div className="space-y-4">
              {/* Default Shell */}
              <FormField>
                <FormLabel htmlFor="defaultShell">Default Shell</FormLabel>
                <Select value={defaultShell} onValueChange={setDefaultShell}>
                  <SelectTrigger id="defaultShell" className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bash">Bash</SelectItem>
                    <SelectItem value="zsh">Zsh</SelectItem>
                    <SelectItem value="fish">Fish</SelectItem>
                    <SelectItem value="sh">Sh</SelectItem>
                    <SelectItem value="powershell">PowerShell</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-text-secondary mt-1">
                  Shell to use when connecting to remote servers
                </p>
              </FormField>

              {/* Theme */}
              <FormField>
                <FormLabel htmlFor="theme">Theme</FormLabel>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger id="theme" className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="light">Light (Coming Soon)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-text-secondary mt-1">
                  Application color theme
                </p>
              </FormField>
            </div>
          </section>

          {/* Terminal Section */}
          <section>
            <h3 className="text-base font-semibold text-text-primary mb-4 pb-2 border-b border-border">
              Terminal
            </h3>
            <div className="space-y-4">
              {/* Font Size */}
              <FormField>
                <FormLabel htmlFor="fontSize">Font Size</FormLabel>
                <Select defaultValue="14">
                  <SelectTrigger id="fontSize" className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">12px</SelectItem>
                    <SelectItem value="14">14px</SelectItem>
                    <SelectItem value="16">16px</SelectItem>
                    <SelectItem value="18">18px</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              {/* Cursor Style */}
              <FormField>
                <FormLabel htmlFor="cursorStyle">Cursor Style</FormLabel>
                <Select defaultValue="block">
                  <SelectTrigger id="cursorStyle" className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="block">Block</SelectItem>
                    <SelectItem value="underline">Underline</SelectItem>
                    <SelectItem value="bar">Bar</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>
          </section>
        </div>
      </div>

      {/* Change Password Modal */}
      <MasterPasswordModal
        open={showChangePassword}
        mode="create"
        onSubmit={handleChangePassword}
        onCancel={() => setShowChangePassword(false)}
      />
    </div>
  );
};

export default SettingsPanel;
