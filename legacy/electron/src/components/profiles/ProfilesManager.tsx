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
  isDefault?: boolean;
}

interface SSHKey {
  id: string;
  name: string;
  publicKey: string;
  privateKey: string;
}

interface ProfilesManagerProps {
  profiles: Profile[];
  categories: Category[];
  sshKeys: SSHKey[];
  onClose: () => void;
  onEditProfile: (profile: Profile) => void;
  onDeleteProfile: (id: string) => void;
  onAddProfile: () => void;
  onDuplicateProfile: (profile: Profile) => void;
}

export function ProfilesManager({
  profiles,
  categories,
  sshKeys,
  onClose,
  onEditProfile,
  onDeleteProfile,
  onAddProfile,
  onDuplicateProfile
}: ProfilesManagerProps) {
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    profiles.length > 0 ? profiles[0].id : null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const selectedProfile = profiles.find(p => p.id === selectedProfileId);

  // Filter profiles
  const filteredProfiles = useMemo(() => {
    return profiles.filter(profile => {
      const matchesSearch = profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           profile.host.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || profile.categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [profiles, searchQuery, selectedCategory]);

  // Group profiles by category
  const groupedProfiles = useMemo(() => {
    const groups: Record<string, Profile[]> = {};
    
    filteredProfiles.forEach(profile => {
      const catId = profile.categoryId || 'uncategorized';
      if (!groups[catId]) {
        groups[catId] = [];
      }
      groups[catId].push(profile);
    });
    
    return groups;
  }, [filteredProfiles]);

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return 'Uncategorized';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Uncategorized';
  };

  const getKeyName = (keyId?: string) => {
    if (!keyId) return 'None';
    const key = sshKeys.find(k => k.id === keyId);
    return key?.name || 'Unknown';
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: '#09090B',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        height: '60px',
        backgroundColor: '#18181B',
        borderBottom: '1px solid #27272A',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: '16px',
        flexShrink: 0
      }}>
        <button
          onClick={onClose}
          style={{
            width: '36px',
            height: '36px',
            backgroundColor: 'transparent',
            border: '1px solid #27272A',
            borderRadius: '6px',
            color: '#D4D4D8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease'
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
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <h1 style={{
          fontSize: '18px',
          fontWeight: 700,
          color: '#FAFAFA',
          margin: 0
        }}>
          Manage Profiles
        </h1>

        <div style={{ flex: 1 }} />

        <button
          onClick={onAddProfile}
          style={{
            padding: '10px 20px',
            backgroundColor: '#06B6D4',
            border: 'none',
            borderRadius: '6px',
            color: '#FFF',
            fontSize: '14px',
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
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Profile
        </button>
      </div>

      {/* Main content */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden'
      }}>
        {/* Left: Profiles list */}
        <div style={{
          width: '360px',
          borderRight: '1px solid #27272A',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0A0A0B'
        }}>
          {/* Search and filter */}
          <div style={{ padding: '16px', borderBottom: '1px solid #27272A' }}>
            <input
              type="text"
              placeholder="Search profiles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#18181B',
                border: '1px solid #27272A',
                borderRadius: '6px',
                color: '#FAFAFA',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: '12px',
                transition: 'border-color 0.15s ease'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#06B6D4'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#27272A'}
            />

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#18181B',
                border: '1px solid #27272A',
                borderRadius: '6px',
                color: '#FAFAFA',
                fontSize: '14px',
                outline: 'none',
                cursor: 'pointer',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s ease'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#06B6D4'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#27272A'}
            >
              <option value="all" style={{ backgroundColor: '#18181B' }}>All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id} style={{ backgroundColor: '#18181B' }}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Profiles list */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {Object.entries(groupedProfiles).map(([categoryId, categoryProfiles]) => (
              <div key={categoryId} style={{ marginBottom: '8px' }}>
                <div style={{
                  padding: '8px 16px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#71717A',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  backgroundColor: '#0A0A0B'
                }}>
                  {getCategoryName(categoryId)} ({categoryProfiles.length})
                </div>
                {categoryProfiles.map(profile => (
                  <button
                    key={profile.id}
                    onClick={() => setSelectedProfileId(profile.id)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: selectedProfileId === profile.id ? '#18181B' : 'transparent',
                      border: 'none',
                      borderLeft: '3px solid',
                      borderLeftColor: selectedProfileId === profile.id ? '#06B6D4' : 'transparent',
                      color: '#D4D4D8',
                      fontSize: '14px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedProfileId !== profile.id) {
                        e.currentTarget.style.backgroundColor = '#12121380';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedProfileId !== profile.id) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{profile.name}</div>
                    <div style={{
                      fontSize: '12px',
                      color: '#71717A'
                    }}>
                      {profile.username}@{profile.host}:{profile.port}
                    </div>
                  </button>
                ))}
              </div>
            ))}

            {filteredProfiles.length === 0 && (
              <div style={{
                padding: '32px 16px',
                textAlign: 'center',
                color: '#52525B',
                fontSize: '14px'
              }}>
                {searchQuery ? 'No profiles match your search' : 'No profiles yet'}
              </div>
            )}
          </div>
        </div>

        {/* Right: Profile details */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '32px'
        }}>
          {selectedProfile ? (
            <div>
              {/* Profile header */}
              <div style={{
                marginBottom: '32px',
                paddingBottom: '24px',
                borderBottom: '1px solid #27272A'
              }}>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#FAFAFA',
                  margin: '0 0 8px 0'
                }}>
                  {selectedProfile.name}
                </h2>
                <p style={{
                  fontSize: '14px',
                  color: '#71717A',
                  margin: 0
                }}>
                  {getCategoryName(selectedProfile.categoryId)}
                </p>
              </div>

              {/* Connection details */}
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#71717A',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  margin: '0 0 16px 0'
                }}>
                  Connection Details
                </h3>

                <div style={{ display: 'grid', gap: '16px' }}>
                  <div>
                    <div style={{
                      fontSize: '12px',
                      color: '#71717A',
                      marginBottom: '4px'
                    }}>Host</div>
                    <div style={{
                      fontSize: '14px',
                      color: '#FAFAFA',
                      fontFamily: 'monospace'
                    }}>{selectedProfile.host}</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <div style={{
                        fontSize: '12px',
                        color: '#71717A',
                        marginBottom: '4px'
                      }}>Port</div>
                      <div style={{
                        fontSize: '14px',
                        color: '#FAFAFA'
                      }}>{selectedProfile.port}</div>
                    </div>

                    <div>
                      <div style={{
                        fontSize: '12px',
                        color: '#71717A',
                        marginBottom: '4px'
                      }}>Username</div>
                      <div style={{
                        fontSize: '14px',
                        color: '#FAFAFA'
                      }}>{selectedProfile.username}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Authentication */}
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#71717A',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  margin: '0 0 16px 0'
                }}>
                  Authentication
                </h3>

                <div style={{ display: 'grid', gap: '16px' }}>
                  <div>
                    <div style={{
                      fontSize: '12px',
                      color: '#71717A',
                      marginBottom: '4px'
                    }}>Method</div>
                    <div style={{
                      fontSize: '14px',
                      color: '#FAFAFA',
                      textTransform: 'capitalize'
                    }}>{selectedProfile.authMethod}</div>
                  </div>

                  {selectedProfile.authMethod === 'key' && (
                    <div>
                      <div style={{
                        fontSize: '12px',
                        color: '#71717A',
                        marginBottom: '4px'
                      }}>SSH Key</div>
                      <div style={{
                        fontSize: '14px',
                        color: '#FAFAFA'
                      }}>{getKeyName(selectedProfile.keyId)}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{
                display: 'flex',
                gap: '12px',
                paddingTop: '24px',
                borderTop: '1px solid #27272A'
              }}>
                <button
                  onClick={() => onEditProfile(selectedProfile)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#06B6D4',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#FFF',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0891B2'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#06B6D4'}
                >
                  Edit Profile
                </button>

                <button
                  onClick={() => onDuplicateProfile(selectedProfile)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'transparent',
                    border: '1px solid #27272A',
                    borderRadius: '6px',
                    color: '#D4D4D8',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
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
                  Duplicate
                </button>

                <div style={{ flex: 1 }} />

                <button
                  onClick={() => {
                    if (confirm(`Delete profile "${selectedProfile.name}"?`)) {
                      onDeleteProfile(selectedProfile.id);
                      setSelectedProfileId(profiles[0]?.id || null);
                    }
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '6px',
                    color: '#EF4444',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                    e.currentTarget.style.borderColor = '#EF4444';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                  }}
                >
                  Delete Profile
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#52525B',
              gap: '16px'
            }}>
              <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p style={{ fontSize: '16px' }}>No profile selected</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
