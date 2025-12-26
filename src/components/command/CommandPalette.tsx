import React, { useState, useEffect, useRef } from 'react';
import { SSHProfile } from '@/types';
import { Input } from '@/components/ui';

interface CommandItem {
  id: string;
  label: string;
  group: 'Profiles' | 'Actions' | 'Navigation';
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  profiles: SSHProfile[];
  onConnectProfile: (profileId: string) => void;
  onEditProfile: (profile: SSHProfile) => void;
  onTogglePin: (profileId: string) => void;
  onNewProfile: () => void;
  onImportKey: () => void;
  onGenerateKey: () => void;
  onShowKeys: () => void;
  onShowSettings: () => void;
  onShowSync: () => void;
  onShowTunnels: () => void;
  onShowSFTP?: () => void;
  onShowSnippets?: () => void;
  onShowHistory?: () => void;
  onToggleSidebar?: () => void;
  onLock?: () => void;
  onChangeTheme?: (theme: 'dark' | 'light' | 'system') => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onClose,
  profiles,
  onConnectProfile,
  onEditProfile,
  onTogglePin,
  onNewProfile,
  onImportKey,
  onGenerateKey,
  onShowKeys,
  onShowSettings,
  onShowSync,
  onShowTunnels,
  onShowSFTP,
  onShowSnippets,
  onShowHistory,
  onToggleSidebar,
  onLock,
  onChangeTheme,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate command items
  const commands: CommandItem[] = [
    // Navigation
    { id: 'nav-keys', label: 'Open SSH Keys', group: 'Navigation', action: () => { onShowKeys(); onClose(); }, keywords: ['ssh', 'keys', 'open'] },
    { id: 'nav-settings', label: 'Open Settings', group: 'Navigation', action: () => { onShowSettings(); onClose(); }, keywords: ['settings', 'preferences', 'open'] },
    { id: 'nav-sync', label: 'Open Cloud Sync', group: 'Navigation', action: () => { onShowSync(); onClose(); }, keywords: ['sync', 'cloud', 'google', 'drive', 'open'] },
    { id: 'nav-tunnels', label: 'Open Port Forwarding', group: 'Navigation', action: () => { onShowTunnels(); onClose(); }, keywords: ['tunnels', 'port', 'forwarding', 'open'] },
    ...(onShowSFTP ? [{ id: 'nav-sftp', label: 'Open SFTP', group: 'Navigation' as const, action: () => { onShowSFTP(); onClose(); }, keywords: ['sftp', 'file', 'transfer', 'ftp', 'open'] }] : []),
    ...(onShowSnippets ? [{ id: 'nav-snippets', label: 'Open Snippets', group: 'Navigation' as const, action: () => { onShowSnippets(); onClose(); }, keywords: ['snippets', 'commands', 'scripts', 'open'] }] : []),
    ...(onShowHistory ? [{ id: 'nav-history', label: 'Open Command History', group: 'Navigation' as const, action: () => { onShowHistory(); onClose(); }, keywords: ['history', 'commands', 'log', 'open'] }] : []),
    
    // Actions
    { id: 'action-new-profile', label: 'New Profile', group: 'Actions', action: () => { onNewProfile(); onClose(); }, keywords: ['new', 'create', 'profile', 'host'] },
    { id: 'action-import-key', label: 'Import SSH Key', group: 'Actions', action: () => { onImportKey(); onClose(); }, keywords: ['import', 'key', 'ssh'] },
    { id: 'action-generate-key', label: 'Generate SSH Key', group: 'Actions', action: () => { onGenerateKey(); onClose(); }, keywords: ['generate', 'create', 'key', 'ssh'] },
    ...(onToggleSidebar ? [{ id: 'action-toggle-sidebar', label: 'Toggle Sidebar', group: 'Actions' as const, action: () => { onToggleSidebar(); onClose(); }, keywords: ['toggle', 'sidebar', 'collapse', 'expand'] }] : []),
    ...(onLock ? [{ id: 'action-lock', label: 'Lock Vault', group: 'Actions' as const, action: () => { onLock(); onClose(); }, keywords: ['lock', 'vault', 'secure', 'password'] }] : []),
    ...(onChangeTheme ? [
      { id: 'theme-dark', label: 'Theme: Dark', group: 'Actions' as const, action: () => { onChangeTheme('dark'); onClose(); }, keywords: ['theme', 'dark', 'appearance', 'color'] },
      { id: 'theme-light', label: 'Theme: Light', group: 'Actions' as const, action: () => { onChangeTheme('light'); onClose(); }, keywords: ['theme', 'light', 'appearance', 'color'] },
      { id: 'theme-system', label: 'Theme: System', group: 'Actions' as const, action: () => { onChangeTheme('system'); onClose(); }, keywords: ['theme', 'system', 'auto', 'appearance', 'color'] },
    ] : []),
    
    // Profile actions
    ...profiles.flatMap(profile => [
      {
        id: `connect-${profile.id}`,
        label: `Connect: ${profile.name}`,
        group: 'Profiles' as const,
        action: () => { onConnectProfile(profile.id); onClose(); },
        keywords: ['connect', profile.name, profile.host, profile.username, ...(profile.tags || [])],
      },
      {
        id: `edit-${profile.id}`,
        label: `Edit: ${profile.name}`,
        group: 'Profiles' as const,
        action: () => { onEditProfile(profile); onClose(); },
        keywords: ['edit', profile.name, profile.host],
      },
      {
        id: `pin-${profile.id}`,
        label: `${profile.isPinned ? 'Unpin' : 'Pin'}: ${profile.name}`,
        group: 'Profiles' as const,
        action: () => { onTogglePin(profile.id); onClose(); },
        keywords: ['pin', 'unpin', profile.name],
      },
    ]),
  ];

  // Filter commands based on query
  const filteredCommands = query.trim() === '' 
    ? commands 
    : commands.filter(cmd => {
        const searchText = query.toLowerCase();
        const labelMatch = cmd.label.toLowerCase().includes(searchText);
        const keywordMatch = cmd.keywords?.some(kw => kw.toLowerCase().includes(searchText));
        return labelMatch || keywordMatch;
      });

  // Group filtered commands
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.group]) {
      acc[cmd.group] = [];
    }
    acc[cmd.group].push(cmd);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  const groupOrder: Array<'Profiles' | 'Actions' | 'Navigation'> = ['Profiles', 'Actions', 'Navigation'];
  const flatFilteredCommands = groupOrder.flatMap(group => groupedCommands[group] || []);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, flatFilteredCommands.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        flatFilteredCommands[selectedIndex]?.action();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, selectedIndex, flatFilteredCommands, onClose]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-32 z-50">
      <div
        ref={containerRef}
        className="w-full max-w-2xl bg-surface border border-border rounded-lg shadow-2xl overflow-hidden"
      >
        {/* Search Input */}
        <div className="p-4 border-b border-border">
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="w-full bg-background border-none focus:ring-0 text-base"
          />
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {flatFilteredCommands.length === 0 ? (
            <div className="p-8 text-center text-text-secondary">
              No commands found
            </div>
          ) : (
            groupOrder.map(group => {
              const items = groupedCommands[group];
              if (!items || items.length === 0) return null;

              return (
                <div key={group} className="py-2">
                  {/* Group Header */}
                  <div className="px-4 py-1 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    {group}
                  </div>
                  <div className="border-b border-border mb-2 mx-4" />

                  {/* Group Items */}
                  {items.map((cmd, idx) => {
                    const flatIndex = flatFilteredCommands.indexOf(cmd);
                    const isSelected = flatIndex === selectedIndex;

                    return (
                      <button
                        key={cmd.id}
                        onClick={cmd.action}
                        onMouseEnter={() => setSelectedIndex(flatIndex)}
                        className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center gap-3 ${
                          isSelected
                            ? 'bg-accent/20 text-accent border-l-2 border-accent'
                            : 'text-text-primary hover:bg-border'
                        }`}
                      >
                        <span className="flex-1">{cmd.label}</span>
                        {cmd.group === 'Profiles' && cmd.label.startsWith('Connect:') && (
                          <span className="text-xs text-text-secondary">↵</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Help */}
        <div className="px-4 py-2 bg-background border-t border-border flex items-center justify-between text-xs text-text-secondary">
          <div className="flex items-center gap-4">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
          <span>Ctrl+K to reopen</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
