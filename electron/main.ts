import { app, BrowserWindow } from 'electron';
import path from 'path';
import { registerSSHHandlers, cleanupSSHHandlers } from './ipc/sshIPC';
import { registerStorageHandlers } from './ipc/storageIPC';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    backgroundColor: '#09090B', // Updated to Cyber Blue theme
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'hidden',
    frame: false,
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Register SSH IPC handlers before app is ready
app.whenReady().then(() => {
  registerSSHHandlers();
  registerStorageHandlers();
  createWindow();
});

app.on('window-all-closed', () => {
  cleanupSSHHandlers();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Cleanup on quit
app.on('before-quit', () => {
  cleanupSSHHandlers();
});
