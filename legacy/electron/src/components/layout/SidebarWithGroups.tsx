import React, { useState } from 'react';

interface Profile {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  authMethod: string;
  categoryId?: string;
  keyId?: string;
}

interface Category {
  id: string;
  name: string;
  isDefault: boolean;
}

interface SidebarProps {
  profiles: Profile[];
  categories: Category[];
  activeProfileId?: string;
  onProfileSelect: (profile: Profile) => void;
  onAddProfile: () => void;
  onManageCategories: () => void;
  onEditProfile?: (profile: Profile) => void;
  onDeleteProfile?: (profileId: string) => void;
  onHomeClick?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ 
  profiles, 
  categories,
  activeProfileId, 
  onProfileSelect, 
  onAddProfile,
  onManageCategories,
  onEditProfile,
  onDeleteProfile,
  onHomeClick,
  collapsed = false,
  onToggleCollapse
}: SidebarProps) {
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{ profileId: string; x: number; y: number } | null>(null);
  const [activeView, setActiveView] = useState<'connections' | 'logs' | 'snippets'>('connections');

  const toggleCategory = (categoryId: string) => {
    const newCollapsed = new Set(collapsedCategories);
    if (newCollapsed.has(categoryId)) {
      newCollapsed.delete(categoryId);
    } else {
      newCollapsed.add(categoryId);
    }
    setCollapsedCategories(newCollapsed);
  };

  const handleContextMenu = (e: React.MouseEvent, profileId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ profileId, x: e.clientX, y: e.clientY });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  // Close context menu when clicking outside
  React.useEffect(() => {
    if (contextMenu) {
      const handleClick = () => handleCloseContextMenu();
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  // Group profiles by category
  const groupedProfiles = categories.map(category => ({
    category,
    profiles: profiles.filter(p => p.categoryId === category.id)
  }));

  // Uncategorized profiles
  const uncategorized = profiles.filter(p => !p.categoryId || !categories.find(c => c.id === p.categoryId));

  // Collapsed icon-only view
  if (collapsed) {
    return (
      <div style={{
        width: '56px',
        backgroundColor: '#18181B',
        borderRight: '1px solid #3F3F46',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        transition: 'width 0.2s ease'
      }}>
        {/* Home icon */}
        <button
          onClick={onHomeClick}
          title="Home"
          style={{
            width: '56px',
            height: '56px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#D4D4D8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.15s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#27272A'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </button>

        {/* Connections icon */}
        <button
          onClick={() => {
            setActiveView('connections');
            onToggleCollapse?.(); // Expand sidebar to show profiles
          }}
          title="Connections"
          style={{
            width: '56px',
            height: '56px',
            backgroundColor: activeView === 'connections' ? '#27272A' : 'transparent',
            border: 'none',
            borderLeft: activeView === 'connections' ? '3px solid #06B6D4' : '3px solid transparent',
            color: '#D4D4D8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
            position: 'relative'
          }}
          onMouseEnter={(e) => {
            if (activeView !== 'connections') {
              e.currentTarget.style.backgroundColor = '#27272A';
            }
          }}
          onMouseLeave={(e) => {
            if (activeView !== 'connections') {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {profiles.length > 0 && (
            <span style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              backgroundColor: '#06B6D4',
              color: '#09090B',
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 5px',
              borderRadius: '10px',
              minWidth: '18px',
              textAlign: 'center'
            }}>
              {profiles.length}
            </span>
          )}
        </button>

        {/* Snippets icon */}
        <button
          onClick={() => setActiveView('snippets')}
          title="Snippets"
          style={{
            width: '56px',
            height: '56px',
            backgroundColor: activeView === 'snippets' ? '#27272A' : 'transparent',
            border: 'none',
            borderLeft: activeView === 'snippets' ? '3px solid #06B6D4' : '3px solid transparent',
            color: '#D4D4D8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            if (activeView !== 'snippets') {
              e.currentTarget.style.backgroundColor = '#27272A';
            }
          }}
          onMouseLeave={(e) => {
            if (activeView !== 'snippets') {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
          </svg>
        </button>

        {/* Logs icon */}
        <button
          onClick={() => setActiveView('logs')}
          title="Logs"
          style={{
            width: '56px',
            height: '56px',
            backgroundColor: activeView === 'logs' ? '#27272A' : 'transparent',
            border: 'none',
            borderLeft: activeView === 'logs' ? '3px solid #06B6D4' : '3px solid transparent',
            color: '#D4D4D8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            if (activeView !== 'logs') {
              e.currentTarget.style.backgroundColor = '#27272A';
            }
          }}
          onMouseLeave={(e) => {
            if (activeView !== 'logs') {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Toggle expand button */}
        <button
          onClick={onToggleCollapse}
          title="Expand sidebar"
          style={{
            width: '56px',
            height: '56px',
            backgroundColor: 'transparent',
            border: 'none',
            borderTop: '1px solid #3F3F46',
            color: '#71717A',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#27272A';
            e.currentTarget.style.color = '#D4D4D8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#71717A';
          }}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    );
  }

  // Expanded full view
  return (
    <div style={{
      width: '280px',
      transition: 'width 0.2s ease',
      backgroundColor: '#18181B',
      borderRight: '1px solid #3F3F46',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0
    }}>
      {/* Home button */}
      <button
        onClick={onHomeClick}
        style={{
          margin: '12px 12px 0',
          padding: '12px 16px',
          backgroundColor: 'transparent',
          border: '1px solid #27272A',
          borderRadius: '8px',
          color: '#D4D4D8',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          transition: 'all 0.15s ease',
          textAlign: 'left'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#27272A';
          e.currentTarget.style.borderColor = '#3F3F46';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.borderColor = '#27272A';
        }}
      >
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        Home
      </button>

      {/* Navigation menu */}
      <div style={{ padding: '0 12px', marginTop: '8px' }}>
        {/* Connections section - button + profiles wrapped in border */}
        <div style={{
          border: `1px solid ${activeView === 'connections' ? '#3F3F46' : '#27272A'}`,
          borderRadius: '8px',
          backgroundColor: activeView === 'connections' ? '#27272A' : 'transparent',
          marginBottom: '4px',
          transition: 'all 0.15s ease'
        }}>
          {/* Connections menu item */}
          <div
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: 'transparent',
              borderRadius: '8px 8px 0 0',
              color: '#D4D4D8',
              fontSize: '14px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.15s ease'
            }}
          >
            <div 
              onClick={() => setActiveView('connections')}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                flex: 1,
                cursor: 'pointer'
              }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Connections
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onManageCategories();
              }}
              style={{
                padding: '4px 8px',
                backgroundColor: 'transparent',
                border: '1px solid #3F3F46',
                borderRadius: '4px',
                color: '#71717A',
                fontSize: '11px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#3F3F46';
                e.currentTarget.style.color = '#E5E7EB';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#71717A';
              }}
            >
              Groups
            </button>
          </div>

          {/* Profile list - sub-items under Connections */}
          {activeView === 'connections' && (
            <div style={{ 
              padding: '0 12px 12px 12px',
              borderTop: '1px solid #3F3F46'
            }}>
            {groupedProfiles
              .filter(({ profiles: categoryProfiles }) => categoryProfiles.length > 0)
              .map(({ category, profiles: categoryProfiles }) => (
              <div key={category.id} style={{ marginBottom: '8px' }}>
                {/* Category header */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#A1A1AA',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#27272A'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <svg 
                    width="12" 
                    height="12" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    style={{
                      transform: collapsedCategories.has(category.id) ? 'rotate(0deg)' : 'rotate(90deg)',
                      transition: 'transform 0.15s ease'
                    }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span style={{ flex: 1 }}>{category.name}</span>
                  <span style={{ 
                    fontSize: '11px', 
                    color: '#71717A',
                    backgroundColor: '#27272A',
                    padding: '2px 6px',
                    borderRadius: '10px'
                  }}>
                    {categoryProfiles.length}
                  </span>
                </button>

                {/* Profiles in category */}
                {!collapsedCategories.has(category.id) && categoryProfiles.map(profile => (
                  <div
                    key={profile.id}
                    onClick={() => onProfileSelect(profile)}
                    onContextMenu={(e) => handleContextMenu(e, profile.id)}
                    style={{
                      padding: '10px 12px',
                      marginLeft: '20px',
                      marginBottom: '4px',
                      backgroundColor: activeProfileId === profile.id ? '#27272A' : 'transparent',
                      border: `1px solid ${activeProfileId === profile.id ? '#06B6D4' : 'transparent'}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                    onMouseEnter={(e) => {
                      if (activeProfileId !== profile.id) {
                        e.currentTarget.style.backgroundColor = '#27272A';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeProfileId !== profile.id) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#FAFAFA',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {profile.name}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#71717A',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginTop: '2px'
                      }}>
                        {profile.username}@{profile.host}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {/* Uncategorized profiles */}
            {uncategorized.length > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <button
                  onClick={() => toggleCategory('uncategorized')}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#A1A1AA',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#27272A'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <svg 
                    width="12" 
                    height="12" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    style={{
                      transform: collapsedCategories.has('uncategorized') ? 'rotate(0deg)' : 'rotate(90deg)',
                      transition: 'transform 0.15s ease'
                    }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span style={{ flex: 1 }}>Uncategorized</span>
                  <span style={{ 
                    fontSize: '11px', 
                    color: '#71717A',
                    backgroundColor: '#27272A',
                    padding: '2px 6px',
                    borderRadius: '10px'
                  }}>
                    {uncategorized.length}
                  </span>
                </button>

                {!collapsedCategories.has('uncategorized') && uncategorized.map(profile => (
                  <div
                    key={profile.id}
                    onClick={() => onProfileSelect(profile)}
                    onContextMenu={(e) => handleContextMenu(e, profile.id)}
                    style={{
                      padding: '10px 12px',
                      marginLeft: '20px',
                      marginBottom: '4px',
                      backgroundColor: activeProfileId === profile.id ? '#27272A' : 'transparent',
                      border: `1px solid ${activeProfileId === profile.id ? '#06B6D4' : 'transparent'}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                    onMouseEnter={(e) => {
                      if (activeProfileId !== profile.id) {
                        e.currentTarget.style.backgroundColor = '#27272A';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeProfileId !== profile.id) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#FAFAFA',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {profile.name}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#71717A',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginTop: '2px'
                      }}>
                        {profile.username}@{profile.host}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

          {/* New Connection button inside Connections section */}
          {activeView === 'connections' && (
            <div style={{ padding: '0 12px 8px 12px' }}>
              <button
                onClick={onAddProfile}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: 'transparent',
                  border: '1px solid #06B6D4',
                  borderRadius: '6px',
                  color: '#06B6D4',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#06B6D4';
                  e.currentTarget.style.color = '#09090B';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#06B6D4';
                }}
              >
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                New Connection
              </button>
            </div>
          )}
        </div>

        {/* Snippets menu item */}
        <button
          onClick={() => setActiveView('snippets')}
          style={{
            width: '100%',
            padding: '12px 16px',
            backgroundColor: activeView === 'snippets' ? '#27272A' : 'transparent',
            border: `1px solid ${activeView === 'snippets' ? '#3F3F46' : '#27272A'}`,
            borderRadius: '8px',
            color: '#D4D4D8',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.15s ease',
            textAlign: 'left',
            marginBottom: '4px'
          }}
          onMouseEnter={(e) => {
            if (activeView !== 'snippets') {
              e.currentTarget.style.backgroundColor = '#27272A';
              e.currentTarget.style.borderColor = '#3F3F46';
            }
          }}
          onMouseLeave={(e) => {
            if (activeView !== 'snippets') {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = '#27272A';
            }
          }}
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
          </svg>
          Snippets
        </button>

        {/* Logs menu item */}
        <button
          onClick={() => setActiveView('logs')}
          style={{
            width: '100%',
            padding: '12px 16px',
            backgroundColor: activeView === 'logs' ? '#27272A' : 'transparent',
            border: `1px solid ${activeView === 'logs' ? '#3F3F46' : '#27272A'}`,
            borderRadius: '8px',
            color: '#D4D4D8',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.15s ease',
            textAlign: 'left',
            marginBottom: '4px'
          }}
          onMouseEnter={(e) => {
            if (activeView !== 'logs') {
              e.currentTarget.style.backgroundColor = '#27272A';
              e.currentTarget.style.borderColor = '#3F3F46';
            }
          }}
          onMouseLeave={(e) => {
            if (activeView !== 'logs') {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = '#27272A';
            }
          }}
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Logs
        </button>
      </div>

      {/* Scrollable area for content (when not in connections view) */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px 12px'
      }}>
        {/* Placeholder for Snippets view */}
        {activeView === 'snippets' && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#71717A' }}>
            Snippets view - Coming soon
          </div>
        )}

        {/* Placeholder for Logs view */}
        {activeView === 'logs' && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#71717A' }}>
            Logs view - Coming soon
          </div>
        )}
      </div>

      {/* Old profile list - to be removed */}
      <div style={{
        display: 'none'
      }}>
        {groupedProfiles.map(({ category, profiles: categoryProfiles }) => (
          <div key={category.id} style={{ marginBottom: '8px' }}>
            {/* Category header */}
            <button
              onClick={() => toggleCategory(category.id)}
              style={{
                width: '100%',
                padding: '8px 10px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '6px',
                color: '#A1A1AA',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: 600,
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#27272A'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <svg 
                width="12" 
                height="12" 
                fill="currentColor" 
                viewBox="0 0 20 20"
                style={{
                  transition: 'transform 0.2s ease',
                  transform: collapsedCategories.has(category.id) ? 'rotate(-90deg)' : 'rotate(0deg)'
                }}
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span style={{ flex: 1 }}>{category.name}</span>
              <span style={{ 
                fontSize: '11px', 
                color: '#52525B',
                fontWeight: 500 
              }}>
                {categoryProfiles.length}
              </span>
            </button>

            {/* Category profiles */}
            {!collapsedCategories.has(category.id) && (
              <div style={{ paddingLeft: '8px', marginTop: '4px' }}>
                {categoryProfiles.map((profile) => {
                  const isActive = profile.id === activeProfileId;
                  
                  return (
                    <button
                      key={profile.id}
                      onClick={() => onProfileSelect(profile)}
                      onContextMenu={(e) => handleContextMenu(e, profile.id)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        backgroundColor: isActive ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                        border: isActive ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid transparent',
                        borderRadius: '6px',
                        color: '#E5E7EB',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        transition: 'all 0.15s ease',
                        marginBottom: '4px'
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
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: isActive ? '#10B981' : '#52525B',
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
                          marginTop: '2px'
                        }}>
                          {profile.username}@{profile.host}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {/* Uncategorized profiles */}
        {uncategorized.length > 0 && (
          <div style={{ marginTop: '8px' }}>
            <div style={{
              padding: '8px 10px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#71717A'
            }}>
              Uncategorized
            </div>
            {uncategorized.map((profile) => {
              const isActive = profile.id === activeProfileId;
              
              return (
                <button
                  key={profile.id}
                  onClick={() => onProfileSelect(profile)}
                  onContextMenu={(e) => handleContextMenu(e, profile.id)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: isActive ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                    border: isActive ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid transparent',
                    borderRadius: '6px',
                    color: '#E5E7EB',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.15s ease',
                    marginBottom: '4px'
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
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: isActive ? '#10B981' : '#52525B',
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
                      marginTop: '2px'
                    }}>
                      {profile.username}@{profile.host}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom: Collapse button only */}
      <div style={{ padding: '12px', borderTop: '1px solid #3F3F46' }}>
        <button
          onClick={onToggleCollapse}
          title="Collapse sidebar"
          style={{
            width: '100%',
            padding: '8px',
            marginTop: '8px',
            backgroundColor: 'transparent',
            border: '1px solid #3F3F46',
            borderRadius: '6px',
            color: '#71717A',
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#27272A';
            e.currentTarget.style.color = '#D4D4D8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#71717A';
          }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
          Collapse
        </button>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            backgroundColor: '#18181B',
            border: '1px solid #3F3F46',
            borderRadius: '8px',
            padding: '4px',
            zIndex: 10000,
            minWidth: '160px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {onEditProfile && (
            <button
              onClick={() => {
                const profile = profiles.find(p => p.id === contextMenu.profileId);
                if (profile) {
                  onEditProfile(profile);
                  handleCloseContextMenu();
                }
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '6px',
                color: '#E5E7EB',
                fontSize: '14px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#27272A'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Edit Connection
            </button>
          )}
          {onDeleteProfile && (
            <button
              onClick={() => {
                onDeleteProfile(contextMenu.profileId);
                handleCloseContextMenu();
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '6px',
                color: '#EF4444',
                fontSize: '14px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Delete Connection
            </button>
          )}
        </div>
      )}
    </div>
  );
}
