declare global {
  interface Window {
    nomad: {
      ssh: {
        connect: (profile: any, tunnels: any[]) => Promise<any>;
        write: (sessionId: string, data: string) => Promise<void>;
        resize: (sessionId: string, cols: number, rows: number) => Promise<void>;
        disconnect: (sessionId: string) => Promise<void>;
        onOutput: (sessionId: string, callback: (data: string) => void) => void;
        onError: (sessionId: string, callback: (error: string) => void) => void;
        onClosed: (sessionId: string, callback: () => void) => void;
        getHistory: (sessionId: string) => Promise<any>;
      };
      window: {
        minimize: () => void;
        maximize: () => void;
        close: () => void;
        isMaximized: () => Promise<boolean>;
      };
    };
  }
}

export {};
