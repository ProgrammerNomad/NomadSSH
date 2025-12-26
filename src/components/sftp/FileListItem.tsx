import React from 'react';
import { FileItem } from '@/types/sftp';

interface FileListItemProps {
  file: FileItem;
  selected: boolean;
  onSelect: (file: FileItem) => void;
  onDoubleClick: (file: FileItem) => void;
  onContextMenu: (file: FileItem, event: React.MouseEvent) => void;
}

const FileListItem: React.FC<FileListItemProps> = ({
  file,
  selected,
  onSelect,
  onDoubleClick,
  onContextMenu,
}) => {
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '-';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

    if (diffDays === 0) {
      return `Today ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getFileIcon = () => {
    if (file.type === 'directory') {
      return (
        <svg className="w-4 h-4 text-primary-light" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
        </svg>
      );
    }

    // File type icons based on extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    const colorMap: Record<string, string> = {
      js: 'text-yellow-400',
      ts: 'text-primary',
      tsx: 'text-primary',
      jsx: 'text-yellow-400',
      json: 'text-yellow-300',
      html: 'text-orange-400',
      css: 'text-purple-400',
      py: 'text-primary-light',
      sh: 'text-emerald-400',
      md: 'text-text-secondary',
      txt: 'text-text-secondary',
      zip: 'text-red-400',
      tar: 'text-red-400',
      gz: 'text-red-400',
    };

    const color = ext ? colorMap[ext] || 'text-text-secondary' : 'text-text-secondary';

    return (
      <svg className={`w-4 h-4 ${color}`} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
      </svg>
    );
  };

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 hover:bg-border cursor-pointer transition-colors ${
        selected ? 'bg-accent/20 border-l-2 border-accent' : ''
      }`}
      onClick={() => onSelect(file)}
      onDoubleClick={() => onDoubleClick(file)}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu(file, e);
      }}
    >
      {/* Icon */}
      <div className="flex-shrink-0">{getFileIcon()}</div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary truncate">{file.name}</p>
      </div>

      {/* Size */}
      <div className="w-24 text-right">
        <p className="text-xs text-text-secondary">{file.type === 'directory' ? '-' : formatSize(file.size)}</p>
      </div>

      {/* Modified */}
      <div className="w-32 text-right">
        <p className="text-xs text-text-secondary">{formatDate(file.modifiedAt)}</p>
      </div>

      {/* Permissions */}
      {file.permissions && (
        <div className="w-24 text-right">
          <p className="text-xs text-text-secondary font-mono">{file.permissions}</p>
        </div>
      )}
    </div>
  );
};

export default FileListItem;
