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
}

export function Sidebar({ 
  profiles, 
  categories,
  activeProfileId, 
  onProfileSelect, 
  onAddProfile,
  onManageCategories
}: SidebarProps) {
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (categoryId: string) => {
    const newCollapsed = new Set(collapsedCategories);
    if (newCollapsed.has(categoryId)) {
      newCollapsed.delete(categoryId);
    } else {
      newCollapsed.add(categoryId);
    }
    setCollapsedCategories(newCollapsed);
  };

  // Group profiles by category
  const groupedProfiles = categories.map(category => ({
    category,
    profiles: profiles.filter(p => p.categoryId === category.id)
  }));

  // Uncategorized profiles
  const uncategorized = profiles.filter(p => !p.categoryId || !categories.find(c => c.id === p.categoryId));

  return (
    <div style={{
      width: '280px',
      backgroundColor: '#18181B',
      borderRight: '1px solid #3F3F46',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0
    }}>
      {/* Sidebar header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #3F3F46',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{
          fontSize: '11px',
          fontWeight: 600,
          color: '#71717A',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          CONNECTIONS
        </div>
        <button
          onClick={onManageCategories}
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
            e.currentTarget.style.backgroundColor = '#27272A';
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

      {/* Profile list with categories */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px'
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
          <span>New Connection</span>
        </button>
      </div>
    </div>
  );
}
