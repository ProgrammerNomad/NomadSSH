import React from 'react';
import { StatusIndicator } from '@/components/ui';

interface StatusBarProps {
  onShowSync?: () => void;
  onShowHome?: () => void;
}

const StatusBar: React.FC<StatusBarProps> = ({ onShowSync, onShowHome }) => {
  return (
    <footer className="h-6 bg-surface border-t border-border flex items-center px-4 text-xs flex-shrink-0">
      {/* Connection Status */}
      <button
        onClick={onShowHome}
        className="flex items-center gap-2 min-w-[200px] hover:text-text-primary transition-colors cursor-pointer"
        title="Go to Home"
      >
        <StatusIndicator status="disconnected" size="sm" />
        <span className="text-text-secondary hover:text-text-primary transition-colors">Not connected</span>
      </button>

      {/* Sync Status */}
      <button
        onClick={onShowSync}
        className="flex-1 flex items-center justify-center gap-2 hover:text-text-primary transition-colors cursor-pointer"
        title="Open Cloud Sync"
      >
        <span className="text-text-secondary hover:text-text-primary transition-colors">Sync: Off</span>
      </button>

      {/* Right Side Info */}
      <div className="flex items-center gap-4 text-text-secondary">
        <span>Ready</span>
      </div>
    </footer>
  );
};

export default StatusBar;
