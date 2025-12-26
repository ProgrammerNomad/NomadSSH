import React from 'react';
import { Button } from '@/components/ui';

interface AboutPanelProps {
  onClose: () => void;
}

const AboutPanel: React.FC<AboutPanelProps> = ({ onClose }) => {
  const handleGitHub = () => {
    // TODO: Open GitHub link via Electron shell
    console.log('Opening GitHub...');
    // window.electron.shell.openExternal('https://github.com/ProgrammerNomad/NomadSSH');
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center">
        <Button size="sm" variant="ghost" onClick={onClose} className="px-2">
          ←
        </Button>
        <h2 className="text-lg font-semibold text-text-primary ml-3">About</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto flex items-center justify-center">
        <div className="max-w-md text-center space-y-6 p-8">
          {/* Logo/Icon */}
          <div className="text-6xl mb-4">
            <span className="font-mono text-accent">&gt;_</span>
          </div>

          {/* App Name & Version */}
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">NomadSSH</h1>
            <p className="text-text-secondary text-sm">v0.1.0</p>
          </div>

          {/* Attribution */}
          <div className="pt-4 pb-4 border-t border-b border-border space-y-2">
            <p className="text-text-secondary text-sm">
              Built on top of{' '}
              <span className="text-text-primary font-semibold">Tabby Terminal</span>
            </p>
            <p className="text-text-secondary text-xs">
              Extending Tabby with zero-knowledge encrypted cloud sync
            </p>
          </div>

          {/* License */}
          <div className="space-y-2">
            <p className="text-text-secondary text-sm">
              Licensed under{' '}
              <span className="text-text-primary font-semibold">MIT License</span>
            </p>
          </div>

          {/* GitHub Link */}
          <div className="pt-4">
            <Button variant="primary" onClick={handleGitHub}>
              View on GitHub
            </Button>
          </div>

          {/* Copyright */}
          <div className="pt-6">
            <p className="text-text-secondary text-xs">
              © 2025 ProgrammerNomad. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPanel;
