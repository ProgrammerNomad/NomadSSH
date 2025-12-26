import React from 'react';
import { cn } from '@/utils/cn';

interface StatusIndicatorProps {
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  size = 'md',
  showLabel = false,
  className,
}) => {
  const statusConfig = {
    connected: { color: 'bg-success', label: 'Connected' },
    disconnected: { color: 'bg-text-secondary', label: 'Disconnected' },
    connecting: { color: 'bg-warning', label: 'Connecting' },
    error: { color: 'bg-error', label: 'Error' },
  };

  const config = statusConfig[status];
  const sizeClass = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className={cn('rounded-full', sizeClass, config.color)} />
      {showLabel && <span className="text-sm text-text-secondary">{config.label}</span>}
    </div>
  );
};

export default StatusIndicator;
