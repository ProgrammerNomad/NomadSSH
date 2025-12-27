import React, { useEffect, useState } from 'react';
import { Minus, Square, X, Maximize2 } from 'lucide-react';

const WindowControls: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const checkMaximized = async () => {
      if (window.nomad?.window?.isMaximized) {
        const maximized = await window.nomad.window.isMaximized();
        setIsMaximized(maximized);
      }
    };
    checkMaximized();
  }, []);

  const handleMinimize = () => {
    console.log('[WindowControls] Minimize clicked');
    console.log('[WindowControls] window.nomad:', window.nomad);
    if (window.nomad?.window?.minimize) {
      console.log('[WindowControls] Calling minimize');
      window.nomad.window.minimize();
    } else {
      console.error('[WindowControls] window.nomad.window.minimize not available');
    }
  };

  const handleMaximize = async () => {
    console.log('[WindowControls] Maximize clicked');
    if (window.nomad?.window?.maximize && window.nomad?.window?.isMaximized) {
      console.log('[WindowControls] Calling maximize');
      window.nomad.window.maximize();
      // Toggle state after action
      const maximized = await window.nomad.window.isMaximized();
      setIsMaximized(maximized);
    } else {
      console.error('[WindowControls] window.nomad.window.maximize not available');
    }
  };

  const handleClose = () => {
    console.log('[WindowControls] Close clicked');
    if (window.nomad?.window?.close) {
      console.log('[WindowControls] Calling close');
      window.nomad.window.close();
    } else {
      console.error('[WindowControls] window.nomad.window.close not available');
    }
  };

  return (
    <div className="flex h-full" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
      {/* Minimize Button */}
      <button
        onClick={handleMinimize}
        className="h-full w-12 flex items-center justify-center hover:bg-zinc-700 transition-colors"
        aria-label="Minimize"
      >
        <Minus className="w-4 h-4 text-zinc-400" />
      </button>

      {/* Maximize/Restore Button */}
      <button
        onClick={handleMaximize}
        className="h-full w-12 flex items-center justify-center hover:bg-zinc-700 transition-colors"
        aria-label={isMaximized ? 'Restore' : 'Maximize'}
      >
        {isMaximized ? (
          <Maximize2 className="w-3.5 h-3.5 text-zinc-400" />
        ) : (
          <Square className="w-3.5 h-3.5 text-zinc-400" />
        )}
      </button>

      {/* Close Button */}
      <button
        onClick={handleClose}
        className="h-full w-12 flex items-center justify-center hover:bg-red-500 transition-colors group"
        aria-label="Close"
      >
        <X className="w-4 h-4 text-zinc-400 group-hover:text-white" />
      </button>
    </div>
  );
};

export default WindowControls;
