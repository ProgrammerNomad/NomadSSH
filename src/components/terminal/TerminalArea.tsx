import React from 'react';
import Terminal from './Terminal';
import { Session } from '@/types';

interface TerminalAreaProps {
  sessions: Session[];
  activeSessionId: string | null;
}

const TerminalArea: React.FC<TerminalAreaProps> = ({ sessions, activeSessionId }) => {
  const activeSession = sessions.find((s) => s.id === activeSessionId);

  const handleData = (data: string) => {
    // TODO: Send data to SSH connection via IPC
    console.log('Terminal data:', data);
  };

  const handleResize = (cols: number, rows: number) => {
    // TODO: Send resize event to SSH connection via IPC
    console.log('Terminal resize:', cols, rows);
  };

  if (!activeSession) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="text-center">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-text-secondary opacity-50"
            fill="none"
            strokeWidth="1.5"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
          <h2 className="text-xl font-semibold text-text-primary mb-2">No Active Session</h2>
          <p className="text-text-secondary">
            Select a profile from the sidebar to start a new SSH session
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full border-2 border-green-500">
      {sessions.map((session) => {
        console.log(`[TerminalArea] Rendering session ${session.id}, active: ${activeSessionId}, visible: ${session.id === activeSessionId}`);
        return (
        <div
          key={session.id}
          className="h-full w-full"
          style={{ display: session.id === activeSessionId ? 'block' : 'none' }}
        >
          <Terminal
            sessionId={session.id}
            onData={handleData}
            onResize={handleResize}
          />
        </div>
      )})}
    </div>
  );
};

export default TerminalArea;
