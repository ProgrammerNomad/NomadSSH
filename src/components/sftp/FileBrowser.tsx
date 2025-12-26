import React, { useState } from 'react';
import { Button, Input } from '@/components/ui';
import { FileItem } from '@/types/sftp';
import FileListItem from './FileListItem';

interface FileBrowserProps {
  title: string;
  currentPath: string;
  files: FileItem[];
  selectedFiles: FileItem[];
  onNavigate: (path: string) => void;
  onSelectFile: (file: FileItem) => void;
  onDoubleClick: (file: FileItem) => void;
  onContextMenu: (file: FileItem, event: React.MouseEvent) => void;
  onRefresh: () => void;
  onNewFolder: () => void;
  sortBy: 'name' | 'size' | 'modified';
  onSortChange: (sortBy: 'name' | 'size' | 'modified') => void;
}

const FileBrowser: React.FC<FileBrowserProps> = ({
  title,
  currentPath,
  files,
  selectedFiles,
  onNavigate,
  onSelectFile,
  onDoubleClick,
  onContextMenu,
  onRefresh,
  onNewFolder,
  sortBy,
  onSortChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleNavigateUp = () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
    onNavigate(parentPath);
  };

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort files
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    // Directories first
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1;
    }

    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'size':
        return b.size - a.size;
      case 'modified':
        return new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime();
      default:
        return 0;
    }
  });

  return (
    <div className="flex flex-col h-full bg-surface border-r border-border">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={onRefresh}
              className="px-2"
              title="Refresh"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onNewFolder}
              className="px-2"
              title="New Folder"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1 mb-2 overflow-x-auto">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleNavigateUp}
            className="px-2"
            title="Go up"
            disabled={currentPath === '/'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          <div className="flex-1 px-2 py-1 bg-background rounded text-xs text-text-secondary font-mono overflow-x-auto whitespace-nowrap">
            {currentPath}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="pl-8 text-sm h-8"
          />
        </div>
      </div>

      {/* Column Headers */}
      <div className="flex items-center gap-3 px-3 py-2 bg-background border-b border-border">
        <div className="flex-shrink-0 w-4" />
        <button
          onClick={() => onSortChange('name')}
          className="flex-1 min-w-0 text-left text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors"
        >
          Name {sortBy === 'name' && '↓'}
        </button>
        <button
          onClick={() => onSortChange('size')}
          className="w-24 text-right text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors"
        >
          Size {sortBy === 'size' && '↓'}
        </button>
        <button
          onClick={() => onSortChange('modified')}
          className="w-32 text-right text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors"
        >
          Modified {sortBy === 'modified' && '↓'}
        </button>
        <div className="w-24 text-right text-xs font-semibold text-text-secondary">
          Permissions
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto">
        {sortedFiles.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-text-secondary text-sm">
              {searchQuery ? 'No files found' : 'Empty directory'}
            </p>
          </div>
        ) : (
          sortedFiles.map((file) => (
            <FileListItem
              key={file.path}
              file={file}
              selected={selectedFiles.some((f) => f.path === file.path)}
              onSelect={onSelectFile}
              onDoubleClick={onDoubleClick}
              onContextMenu={onContextMenu}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default FileBrowser;
