import React from 'react';
import { Session, SSHProfile } from '@/types';
import { Button } from '@/components/ui';

interface SessionTabsProps {
  sessions: Session[];
  profiles: SSHProfile[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onCloseSession: (sessionId: string) => void;
}

const SessionTabs: React.FC<SessionTabsProps> = ({
  sessions,
  profiles,
  activeSessionId,
  onSelectSession,
  onCloseSession,
}) => {
  const getProfileName = (profileId: string) => {
    const profile = profiles.find((p) => p.id === profileId);
    return profile?.name || 'Unknown';
  };

  if (sessions.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1">
      {sessions.map((session) => {
        const isActive = session.id === activeSessionId;
        return (
          <div
            key={session.id}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded text-sm cursor-pointer
              ${
                isActive
                  ? 'bg-background border border-accent text-text-primary'
                  : 'bg-surface border border-border text-text-secondary hover:bg-background hover:text-text-primary'
              }
              transition-colors
            `}
            onClick={() => onSelectSession(session.id)}
          >
            <span className="max-w-[120px] truncate">{getProfileName(session.profileId)}</span>
            <button
              className="hover:text-error transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onCloseSession(session.id);
              }}
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                strokeWidth="2"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default SessionTabs;
