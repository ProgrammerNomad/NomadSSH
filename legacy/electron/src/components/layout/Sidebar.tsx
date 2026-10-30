import React from 'react';

interface Profile {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  authMethod: string;
}

interface SidebarProps {
  profiles: Profile[];
  activeProfileId?: string;
  onProfileSelect: (profile: Profile) => void;
  onAddProfile: () => void;
}

export function Sidebar({ 
  profiles, 
  activeProfileId, 
  onProfileSelect, 
  onAddProfile 
}: SidebarProps) {
  return (
    <div style={{
      width: '260px',
      backgroundColor: '#18181B',
      borderRight: '1px solid #3F3F46',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0
    }}>
      {/* Sidebar header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #3F3F46'
      }}>
        <div style={{
          fontSize: '11px',
          fontWeight: 600,
          color: '#71717A',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          PROFILES
        </div>
      </div>

      {/* Profile list */}
      <div style={{
        flex: 1,
        padding: '8px',
        overflowY: 'auto'
      }}>
        {profiles.map((profile) => {
          const isActive = profile.id === activeProfileId;
          
          return (
            <button
              key={profile.id}
              onClick={() => onProfileSelect(profile)}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: isActive ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                border: isActive ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid transparent',
                borderRadius: '8px',
                color: '#E5E7EB',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.15s ease',
                marginBottom: '6px'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#27272A';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isActive ? '#10B981' : '#71717A',
                flexShrink: 0
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: '#E5E7EB'
                }}>
                  {profile.name}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#71717A',
                  marginTop: '4px'
                }}>
                  {profile.host}:{profile.port}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Add profile button */}
      <div style={{
        padding: '12px',
        borderTop: '1px solid #3F3F46'
      }}>
        <button 
          onClick={onAddProfile}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#06B6D4',
            border: 'none',
            borderRadius: '8px',
            color: '#FFF',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'background-color 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#0891B2';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#06B6D4';
          }}
        >
          <span style={{ fontSize: '18px', fontWeight: 700 }}>+</span>
          <span>Add Profile</span>
        </button>
      </div>
    </div>
  );
}
