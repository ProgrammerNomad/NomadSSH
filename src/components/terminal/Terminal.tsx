import React from 'react';
import { useTerminal } from '@/hooks/useTerminal';

interface TerminalProps {
  sessionId: string;
  onError?: (error: string) => void;
  onClose?: () => void;
}

const Terminal: React.FC<TerminalProps> = ({ sessionId, onError, onClose }) => {
  // Use terminal hook - it returns the containerRef
  const { terminal, status, error, containerRef } = useTerminal({
    sessionId,
    onError,
    onClose,
  });

  console.log('[Terminal] Render status:', status);

  console.log('[Terminal] Container rendering, status:', status, 'sessionId:', sessionId);

  return (
    <div className="h-full w-full bg-black relative">
      {/* Status overlay */}
      {status === 'connecting' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <div className="text-text-secondary text-sm">Connecting to SSH server...</div>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {status === 'error' && error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-10">
          <div className="bg-surface border border-error rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-error flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-text-primary font-semibold mb-2">Connection Failed</h3>
                <p className="text-text-secondary text-sm mb-4">{error}</p>
                <button
                  onClick={onClose}
                  className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Close Terminal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Disconnected overlay - minimal to show content */}
      {status === 'disconnected' && (
        <div className="absolute top-4 right-4 z-20">
          <div className="bg-surface border border-border rounded-lg shadow-lg p-4 flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 text-text-secondary">
              <div className="w-2 h-2 rounded-full bg-text-secondary" />
              <span className="text-sm font-medium">Connection closed</span>
            </div>
            <button
              onClick={onClose}
              className="bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded text-sm transition-colors font-medium"
            >
              Close Session
            </button>
          </div>
        </div>
      )}

      {/* Terminal container */}
      <div 
        ref={containerRef} 
        className="h-full w-full" 
        style={{ 
          position: 'relative',
          backgroundColor: '#000000',
          zIndex: 1
        }}
      />
    </div>
  );
};

export default Terminal;
