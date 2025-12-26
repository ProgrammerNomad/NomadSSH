import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { FileItem, TransferItem } from '@/types/sftp';
import FileBrowser from './FileBrowser';
import TransferQueue from './TransferQueue';

interface SFTPManagerProps {
  onClose?: () => void;
}

const SFTPManager: React.FC<SFTPManagerProps> = ({ onClose }) => {
  // Local files
  const [localPath, setLocalPath] = useState('/Users/home');
  const [localFiles, setLocalFiles] = useState<FileItem[]>([
    {
      name: 'Documents',
      path: '/Users/home/Documents',
      type: 'directory',
      size: 0,
      modifiedAt: new Date().toISOString(),
    },
    {
      name: 'Downloads',
      path: '/Users/home/Downloads',
      type: 'directory',
      size: 0,
      modifiedAt: new Date().toISOString(),
    },
    {
      name: 'example.txt',
      path: '/Users/home/example.txt',
      type: 'file',
      size: 1024,
      modifiedAt: new Date(Date.now() - 3600000).toISOString(),
      permissions: 'rw-r--r--',
    },
  ]);
  const [selectedLocalFiles, setSelectedLocalFiles] = useState<FileItem[]>([]);
  const [localSortBy, setLocalSortBy] = useState<'name' | 'size' | 'modified'>('name');

  // Remote files
  const [remotePath, setRemotePath] = useState('/var/www');
  const [remoteFiles, setRemoteFiles] = useState<FileItem[]>([
    {
      name: 'html',
      path: '/var/www/html',
      type: 'directory',
      size: 0,
      modifiedAt: new Date().toISOString(),
      permissions: 'rwxr-xr-x',
      owner: 'www-data',
      group: 'www-data',
    },
    {
      name: 'logs',
      path: '/var/www/logs',
      type: 'directory',
      size: 0,
      modifiedAt: new Date().toISOString(),
      permissions: 'rwxr-xr-x',
      owner: 'root',
      group: 'root',
    },
    {
      name: 'config.php',
      path: '/var/www/config.php',
      type: 'file',
      size: 2048,
      modifiedAt: new Date(Date.now() - 7200000).toISOString(),
      permissions: 'rw-r--r--',
      owner: 'www-data',
      group: 'www-data',
    },
  ]);
  const [selectedRemoteFiles, setSelectedRemoteFiles] = useState<FileItem[]>([]);
  const [remoteSortBy, setRemoteSortBy] = useState<'name' | 'size' | 'modified'>('name');

  // Transfers
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [focusedPane, setFocusedPane] = useState<'local' | 'remote'>('local');

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Enter - Open folder or start transfer
      if (e.key === 'Enter') {
        if (focusedPane === 'local' && selectedLocalFiles.length === 1) {
          const file = selectedLocalFiles[0];
          if (file.type === 'directory') {
            handleLocalNavigate(file.path);
          }
        } else if (focusedPane === 'remote' && selectedRemoteFiles.length === 1) {
          const file = selectedRemoteFiles[0];
          if (file.type === 'directory') {
            handleRemoteNavigate(file.path);
          }
        }
      }
      
      // Backspace - Go up one level
      if (e.key === 'Backspace') {
        if (focusedPane === 'local' && localPath !== '/') {
          const parentPath = localPath.substring(0, localPath.lastIndexOf('/')) || '/';
          handleLocalNavigate(parentPath);
        } else if (focusedPane === 'remote' && remotePath !== '/') {
          const parentPath = remotePath.substring(0, remotePath.lastIndexOf('/')) || '/';
          handleRemoteNavigate(parentPath);
        }
      }
      
      // Ctrl+Right Arrow - Upload
      if (e.ctrlKey && e.key === 'ArrowRight' && selectedLocalFiles.length > 0) {
        e.preventDefault();
        handleUpload();
      }
      
      // Ctrl+Left Arrow - Download
      if (e.ctrlKey && e.key === 'ArrowLeft' && selectedRemoteFiles.length > 0) {
        e.preventDefault();
        handleDownload();
      }
      
      // Delete - Delete file (TODO: add confirmation)
      if (e.key === 'Delete') {
        if (focusedPane === 'local' && selectedLocalFiles.length > 0) {
          console.log('Delete local files:', selectedLocalFiles);
          // TODO: Show confirmation dialog
        } else if (focusedPane === 'remote' && selectedRemoteFiles.length > 0) {
          console.log('Delete remote files:', selectedRemoteFiles);
          // TODO: Show confirmation dialog
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedPane, selectedLocalFiles, selectedRemoteFiles, localPath, remotePath]);

  // Handlers
  const handleLocalNavigate = (path: string) => {
    setLocalPath(path);
    // TODO: Load files from new path
  };

  const handleRemoteNavigate = (path: string) => {
    setRemotePath(path);
    // TODO: Load files from new path
  };

  const handleLocalSelectFile = (file: FileItem) => {
    setSelectedLocalFiles((prev) =>
      prev.find((f) => f.path === file.path)
        ? prev.filter((f) => f.path !== file.path)
        : [...prev, file]
    );
  };

  const handleRemoteSelectFile = (file: FileItem) => {
    setSelectedRemoteFiles((prev) =>
      prev.find((f) => f.path === file.path)
        ? prev.filter((f) => f.path !== file.path)
        : [...prev, file]
    );
  };

  const handleLocalDoubleClick = (file: FileItem) => {
    if (file.type === 'directory') {
      handleLocalNavigate(file.path);
    }
  };

  const handleRemoteDoubleClick = (file: FileItem) => {
    if (file.type === 'directory') {
      handleRemoteNavigate(file.path);
    }
  };

  const handleContextMenu = (file: FileItem, event: React.MouseEvent) => {
    // TODO: Show context menu
    console.log('Context menu for:', file.name);
  };

  const handleUpload = () => {
    if (selectedLocalFiles.length === 0) return;

    selectedLocalFiles.forEach((file) => {
      const transfer: TransferItem = {
        id: Date.now().toString() + Math.random(),
        type: 'upload',
        sourcePath: file.path,
        destinationPath: remotePath + '/' + file.name,
        fileName: file.name,
        size: file.size,
        transferred: 0,
        status: 'pending',
      };

      setTransfers((prev) => [...prev, transfer]);

      // Simulate transfer
      setTimeout(() => {
        setTransfers((prev) =>
          prev.map((t) =>
            t.id === transfer.id ? { ...t, status: 'transferring' as const, startedAt: new Date().toISOString() } : t
          )
        );

        // Simulate progress
        const interval = setInterval(() => {
          setTransfers((prev) => {
            const current = prev.find((t) => t.id === transfer.id);
            if (!current || current.transferred >= current.size) {
              clearInterval(interval);
              return prev.map((t) =>
                t.id === transfer.id ? { ...t, status: 'completed' as const, transferred: t.size } : t
              );
            }

            const increment = Math.min(current.size * 0.1, current.size - current.transferred);
            return prev.map((t) =>
              t.id === transfer.id
                ? { ...t, transferred: t.transferred + increment, speed: increment * 10 }
                : t
            );
          });
        }, 100);
      }, 500);
    });

    setSelectedLocalFiles([]);
  };

  const handleDownload = () => {
    if (selectedRemoteFiles.length === 0) return;

    selectedRemoteFiles.forEach((file) => {
      const transfer: TransferItem = {
        id: Date.now().toString() + Math.random(),
        type: 'download',
        sourcePath: file.path,
        destinationPath: localPath + '/' + file.name,
        fileName: file.name,
        size: file.size,
        transferred: 0,
        status: 'pending',
      };

      setTransfers((prev) => [...prev, transfer]);

      // Simulate transfer (same as upload)
      setTimeout(() => {
        setTransfers((prev) =>
          prev.map((t) =>
            t.id === transfer.id ? { ...t, status: 'transferring' as const, startedAt: new Date().toISOString() } : t
          )
        );

        const interval = setInterval(() => {
          setTransfers((prev) => {
            const current = prev.find((t) => t.id === transfer.id);
            if (!current || current.transferred >= current.size) {
              clearInterval(interval);
              return prev.map((t) =>
                t.id === transfer.id ? { ...t, status: 'completed' as const, transferred: t.size } : t
              );
            }

            const increment = Math.min(current.size * 0.1, current.size - current.transferred);
            return prev.map((t) =>
              t.id === transfer.id
                ? { ...t, transferred: t.transferred + increment, speed: increment * 10 }
                : t
            );
          });
        }, 100);
      }, 500);
    });

    setSelectedRemoteFiles([]);
  };

  const handlePauseTransfer = (id: string) => {
    setTransfers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'paused' as const } : t))
    );
  };

  const handleResumeTransfer = (id: string) => {
    setTransfers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'transferring' as const } : t))
    );
  };

  const handleCancelTransfer = (id: string) => {
    setTransfers((prev) => prev.filter((t) => t.id !== id));
  };

  const handleClearCompleted = () => {
    setTransfers((prev) => prev.filter((t) => t.status !== 'completed'));
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onClose && (
            <Button size="sm" variant="ghost" onClick={onClose} className="px-2">
              ←
            </Button>
          )}
          <h2 className="text-base font-semibold text-text-primary">SFTP</h2>
        </div>
      </div>

      {/* Dual-Pane Browser */}
      <div className="flex flex-1 overflow-hidden">
        {/* Local Files */}
        <div 
          className="flex-1 flex flex-col"
          onClick={() => setFocusedPane('local')}
          onFocus={() => setFocusedPane('local')}
        >
          <FileBrowser
            title="Local"
            currentPath={localPath}
            files={localFiles}
            selectedFiles={selectedLocalFiles}
            onNavigate={handleLocalNavigate}
            onSelectFile={handleLocalSelectFile}
            onDoubleClick={handleLocalDoubleClick}
            onContextMenu={handleContextMenu}
            onRefresh={() => console.log('Refresh local')}
            onNewFolder={() => console.log('New local folder')}
            sortBy={localSortBy}
            onSortChange={setLocalSortBy}
          />
        </div>

        {/* Transfer Controls */}
        <div className="flex flex-col items-center justify-center gap-3 p-4 bg-surface border-x border-border">
          <Button
            variant="primary"
            onClick={handleUpload}
            disabled={selectedLocalFiles.length === 0}
            className="px-4"
            title="Upload selected files"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Button>
          <div className="text-xs text-text-secondary font-semibold">
            {selectedLocalFiles.length > 0 && `${selectedLocalFiles.length} →`}
            {selectedRemoteFiles.length > 0 && `← ${selectedRemoteFiles.length}`}
          </div>
          <Button
            variant="primary"
            onClick={handleDownload}
            disabled={selectedRemoteFiles.length === 0}
            className="px-4"
            title="Download selected files"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
          </Button>
        </div>

        {/* Remote Files */}
        <div 
          className="flex-1 flex flex-col"
          onClick={() => setFocusedPane('remote')}
          onFocus={() => setFocusedPane('remote')}
        >
          <FileBrowser
            title="Remote"
            currentPath={remotePath}
            files={remoteFiles}
            selectedFiles={selectedRemoteFiles}
            onNavigate={handleRemoteNavigate}
            onSelectFile={handleRemoteSelectFile}
            onDoubleClick={handleRemoteDoubleClick}
            onContextMenu={handleContextMenu}
            onRefresh={() => console.log('Refresh remote')}
            onNewFolder={() => console.log('New remote folder')}
            sortBy={remoteSortBy}
            onSortChange={setRemoteSortBy}
          />
        </div>
      </div>

      {/* Transfer Queue */}
      <TransferQueue
        transfers={transfers}
        onPause={handlePauseTransfer}
        onResume={handleResumeTransfer}
        onCancel={handleCancelTransfer}
        onClearCompleted={handleClearCompleted}
      />
    </div>
  );
};

export default SFTPManager;
