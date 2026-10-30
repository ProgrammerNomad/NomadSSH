import { useState, useMemo } from 'react';

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
}

interface DashboardProps {
  profiles: Profile[];
  categories: Category[];
  onProfileConnect: (profile: Profile) => void;
  onAddProfile: () => void;
  onManageProfiles: () => void;
}

export function Dashboard({
  profiles,
  categories,
  onProfileConnect,
  onAddProfile,
  onManageProfiles
}: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Get recent connections (mock for now - will add tracking later)
  const recentProfiles = useMemo(() => {
    return profiles.slice(0, 6);
  }, [profiles]);

  // Filter profiles by search
  const filteredProfiles = useMemo(() => {
    if (!searchQuery) return profiles;
    return profiles.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.host.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [profiles, searchQuery]);

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return 'Uncategorized';
    return categories.find(c => c.id === categoryId)?.name || 'Uncategorized';
  };

  return (
    <div style={{
      flex: 1,
      overflow: 'auto',
      backgroundColor: '#09090B',
      padding: '48px'
    }}>
      {/* Welcome Section */}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 700,
          color: '#FAFAFA',
          margin: '0 0 8px 0',
          letterSpacing: '-0.02em'
        }}>
          Welcome to NomadSSH
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#71717A',
          margin: '0 0 48px 0'
        }}>
          Connect to your servers securely from anywhere
        </p>

        {/* Quick Actions */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '48px'
        }}>
          <button
            onClick={onAddProfile}
            style={{
              padding: '12px 24px',
              backgroundColor: '#06B6D4',
              border: 'none',
              borderRadius: '8px',
              color: '#FFF',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0891B2'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#06B6D4'}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Profile
          </button>

          <button
            onClick={onManageProfiles}
            style={{
              padding: '12px 24px',
              backgroundColor: 'transparent',
              border: '1px solid #27272A',
              borderRadius: '8px',
              color: '#D4D4D8',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#18181B';
              e.currentTarget.style.borderColor = '#3F3F46';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = '#27272A';
            }}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Manage All Profiles
          </button>
        </div>

        {/* Recent Connections */}
        {recentProfiles.length > 0 && (
          <div style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#FAFAFA',
              margin: '0 0 20px 0'
            }}>
              Recent Connections
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px'
            }}>
              {recentProfiles.map(profile => (
                <button
                  key={profile.id}
                  onClick={() => onProfileConnect(profile)}
                  style={{
                    padding: '20px',
                    backgroundColor: '#18181B',
                    border: '1px solid #27272A',
                    borderRadius: '8px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#27272A';
                    e.currentTarget.style.borderColor = '#3F3F46';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#18181B';
                    e.currentTarget.style.borderColor = '#27272A';
                  }}
                >
                  <div style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#FAFAFA',
                    marginBottom: '8px'
                  }}>
                    {profile.name}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: '#71717A',
                    marginBottom: '12px',
                    fontFamily: 'monospace'
                  }}>
                    {profile.username}@{profile.host}:{profile.port}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#52525B',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {getCategoryName(profile.categoryId)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* All Profiles with Search */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px'
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#FAFAFA',
              margin: 0
            }}>
              All Profiles ({profiles.length})
            </h2>

            <input
              type="text"
              placeholder="Search profiles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '300px',
                padding: '10px 12px',
                backgroundColor: '#18181B',
                border: '1px solid #27272A',
                borderRadius: '6px',
                color: '#FAFAFA',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.15s ease'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#06B6D4'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#27272A'}
            />
          </div>

          {filteredProfiles.length === 0 ? (
            <div style={{
              padding: '48px',
              textAlign: 'center',
              backgroundColor: '#18181B',
              border: '1px solid #27272A',
              borderRadius: '8px'
            }}>
              <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{
                margin: '0 auto 16px',
                color: '#52525B'
              }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p style={{
                fontSize: '16px',
                color: '#71717A',
                margin: '0 0 8px 0'
              }}>
                {searchQuery ? 'No profiles found' : 'No profiles yet'}
              </p>
              <p style={{
                fontSize: '14px',
                color: '#52525B',
                margin: 0
              }}>
                {searchQuery ? 'Try a different search' : 'Create your first SSH profile to get started'}
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gap: '1px',
              backgroundColor: '#27272A',
              border: '1px solid #27272A',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              {filteredProfiles.map(profile => (
                <button
                  key={profile.id}
                  onClick={() => onProfileConnect(profile)}
                  style={{
                    padding: '16px 20px',
                    backgroundColor: '#18181B',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#27272A'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#18181B'}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '15px',
                      fontWeight: 600,
                      color: '#FAFAFA',
                      marginBottom: '4px'
                    }}>
                      {profile.name}
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: '#71717A',
                      fontFamily: 'monospace'
                    }}>
                      {profile.username}@{profile.host}:{profile.port}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#52525B',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    padding: '4px 8px',
                    backgroundColor: '#09090B',
                    borderRadius: '4px'
                  }}>
                    {getCategoryName(profile.categoryId)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginTop: '48px',
          padding: '24px',
          backgroundColor: '#18181B',
          border: '1px solid #27272A',
          borderRadius: '8px'
        }}>
          <div>
            <div style={{
              fontSize: '32px',
              fontWeight: 700,
              color: '#06B6D4',
              marginBottom: '4px'
            }}>
              {profiles.length}
            </div>
            <div style={{
              fontSize: '13px',
              color: '#71717A'
            }}>
              Total Profiles
            </div>
          </div>

          <div>
            <div style={{
              fontSize: '32px',
              fontWeight: 700,
              color: '#10B981',
              marginBottom: '4px'
            }}>
              {categories.length}
            </div>
            <div style={{
              fontSize: '13px',
              color: '#71717A'
            }}>
              Categories
            </div>
          </div>

          <div>
            <div style={{
              fontSize: '32px',
              fontWeight: 700,
              color: '#F59E0B',
              marginBottom: '4px'
            }}>
              0
            </div>
            <div style={{
              fontSize: '13px',
              color: '#71717A'
            }}>
              Active Sessions
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
