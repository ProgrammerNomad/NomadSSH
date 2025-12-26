import React from 'react';
import { Button } from '@/components/ui';
import { TransferItem } from '@/types/sftp';

interface TransferQueueProps {
  transfers: TransferItem[];
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (id: string) => void;
  onClearCompleted: () => void;
}

const TransferQueue: React.FC<TransferQueueProps> = ({
  transfers,
  onPause,
  onResume,
  onCancel,
  onClearCompleted,
}) => {
  const formatSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
  };

  const formatSpeed = (bytesPerSecond: number): string => {
    return `${formatSize(bytesPerSecond)}/s`;
  };

  const calculateETA = (transfer: TransferItem): string => {
    if (!transfer.speed || transfer.speed === 0) return '-';
    const remaining = transfer.size - transfer.transferred;
    const seconds = remaining / transfer.speed;
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const getStatusColor = (status: TransferItem['status']): string => {
    switch (status) {
      case 'transferring':
        return 'text-accent';
      case 'completed':
        return 'text-success';
      case 'error':
        return 'text-error';
      case 'paused':
        return 'text-warning';
      default:
        return 'text-text-secondary';
    }
  };

  const getStatusIcon = (status: TransferItem['status']) => {
    switch (status) {
      case 'transferring':
        return (
          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case 'completed':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'paused':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (transfers.length === 0) {
    return null;
  }

  const activeTransfers = transfers.filter((t) => t.status !== 'completed');
  const completedCount = transfers.filter((t) => t.status === 'completed').length;

  return (
    <div className="border-t border-border bg-surface">
      {/* Header */}
      <div className="px-4 py-2 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">
          Transfer Queue
          {activeTransfers.length > 0 && (
            <span className="ml-2 text-xs text-text-secondary">
              ({activeTransfers.length} active)
            </span>
          )}
        </h3>
        {completedCount > 0 && (
          <Button size="sm" variant="ghost" onClick={onClearCompleted} className="text-xs">
            Clear Completed
          </Button>
        )}
      </div>

      {/* Transfer List */}
      <div className="max-h-48 overflow-y-auto">
        {transfers.map((transfer) => {
          const progress = (transfer.transferred / transfer.size) * 100;

          return (
            <div
              key={transfer.id}
              className="px-4 py-3 border-b border-border hover:bg-background transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className={getStatusColor(transfer.status)}>
                    {getStatusIcon(transfer.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">{transfer.fileName}</p>
                    <p className="text-xs text-text-secondary">
                      {transfer.type === 'upload' ? '↑ Upload' : '↓ Download'} ·{' '}
                      {formatSize(transfer.transferred)} / {formatSize(transfer.size)}
                      {transfer.speed && transfer.status === 'transferring' && (
                        <> · {formatSpeed(transfer.speed)} · ETA {calculateETA(transfer)}</>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  {transfer.status === 'transferring' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onPause(transfer.id)}
                      className="px-2"
                      title="Pause"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </Button>
                  )}
                  {transfer.status === 'paused' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onResume(transfer.id)}
                      className="px-2"
                      title="Resume"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </Button>
                  )}
                  {transfer.status !== 'completed' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onCancel(transfer.id)}
                      className="px-2 text-error"
                      title="Cancel"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </Button>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {transfer.status !== 'completed' && (
                <div className="w-full bg-background rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      transfer.status === 'error'
                        ? 'bg-error'
                        : transfer.status === 'paused'
                        ? 'bg-warning'
                        : 'bg-accent'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}

              {/* Error Message */}
              {transfer.error && (
                <p className="text-xs text-error mt-1">{transfer.error}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TransferQueue;
