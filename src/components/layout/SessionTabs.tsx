import { useState } from 'react';

export type TabStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface Tab {
  id: string;
  profileName: string;
  status: TabStatus;
}

interface SessionTabsProps {
  tabs: Tab[];
  activeTabId: string;
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
}

export function SessionTabs({ tabs, activeTabId, onTabClick, onTabClose }: SessionTabsProps) {
  const [hoveredTabId, setHoveredTabId] = useState<string | null>(null);

  const getStatusColor = (status: TabStatus) => {
    switch (status) {
      case 'connected':
        return '#10B981'; // Green
      case 'connecting':
        return '#F59E0B'; // Yellow
      case 'error':
        return '#EF4444'; // Red
      case 'disconnected':
        return '#71717A'; // Gray
      default:
        return '#71717A';
    }
  };

  if (tabs.length === 0) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      flex: 1,
      overflow: 'auto',
      paddingLeft: '8px'
    }}>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          onMouseEnter={() => setHoveredTabId(tab.id)}
          onMouseLeave={() => setHoveredTabId(null)}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            backgroundColor: activeTabId === tab.id ? '#27272A' : 'transparent',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'background-color 0.15s ease',
            minWidth: '120px',
            maxWidth: '200px'
          }}
          onClick={() => onTabClick(tab.id)}
        >
          {/* Status dot */}
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: getStatusColor(tab.status),
              flexShrink: 0,
              boxShadow: `0 0 4px ${getStatusColor(tab.status)}`
            }}
          />

          {/* Tab name */}
          <span
            style={{
              fontSize: '13px',
              color: activeTabId === tab.id ? '#FAFAFA' : '#A1A1AA',
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1
            }}
          >
            {tab.profileName}
          </span>

          {/* Close button */}
          {(hoveredTabId === tab.id || activeTabId === tab.id) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              style={{
                width: '16px',
                height: '16px',
                padding: 0,
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '3px',
                color: '#71717A',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                flexShrink: 0,
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#3F3F46';
                e.currentTarget.style.color = '#FAFAFA';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#71717A';
              }}
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
