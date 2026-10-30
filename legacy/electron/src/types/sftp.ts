export interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  modifiedAt: string;
  permissions?: string; // e.g., 'rwxr-xr-x'
  owner?: string;
  group?: string;
}

export interface TransferItem {
  id: string;
  type: 'upload' | 'download';
  sourcePath: string;
  destinationPath: string;
  fileName: string;
  size: number;
  transferred: number;
  status: 'pending' | 'transferring' | 'completed' | 'paused' | 'error';
  speed?: number; // bytes per second
  error?: string;
  startedAt?: string;
}
