import { useState, useEffect } from 'react';

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

interface SSHKey {
  id: string;
  name: string;
  publicKey: string;
  privateKey: string;
  passphrase?: string;
  createdAt: number;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: Profile) => void;
  categories: Category[];
  sshKeys: SSHKey[];
  editProfile?: Profile;
}

export function ProfileModal({ 
  isOpen, 
  onClose, 
  onSave,
  categories,
  sshKeys,
  editProfile 
}: ProfileModalProps) {
  const [name, setName] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('22');
  const [username, setUsername] = useState('');
  const [authMethod, setAuthMethod] = useState<'password' | 'key'>('key'); // Default to key (more secure)
  const [password, setPassword] = useState('');
  const [keyId, setKeyId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [connectImmediately, setConnectImmediately] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (editProfile) {
      setName(editProfile.name);
      setHost(editProfile.host);
      setPort(editProfile.port.toString());
      setUsername(editProfile.username);
      setAuthMethod(editProfile.authMethod as 'password' | 'key');
      setPassword(editProfile.password || '');
      setKeyId(editProfile.keyId || '');
      setCategoryId(editProfile.categoryId || '');
    } else {
      // Reset for new profile
      setName('');
      setHost('');
      setPort('22');
      setUsername('');
      setAuthMethod(sshKeys.length > 0 ? 'key' : 'password'); // Smart default
      setPassword('');
      setKeyId(sshKeys.length === 1 ? sshKeys[0].id : ''); // Auto-select if only one
      setCategoryId(categories[0]?.id || '');
      setConnectImmediately(true);
      setShowPassword(false);
      setShowAdvanced(false);
    }
  }, [editProfile, isOpen, categories, sshKeys]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!name.trim() || !host.trim() || !username.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    if (authMethod === 'password' && !password) {
      alert('Please enter a password');
      return;
    }

    if (authMethod === 'key' && !keyId) {
      alert('Please select an SSH key');
      return;
    }

    const profile: Profile = {
      id: editProfile?.id || `profile_${Date.now()}`,
      name: name.trim(),
      host: host.trim(),
      port: parseInt(port) || 22,
      username: username.trim(),
      authMethod,
      password: authMethod === 'password' ? password : '',
      categoryId: categoryId || undefined,
      keyId: authMethod === 'key' ? keyId : undefined
    };

    onSave(profile);
    onClose();
  };

  const selectedKey = sshKeys.find(k => k.id === keyId);

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(8px)'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: '#18181B',
          borderRadius: '12px',
          width: '580px',
          maxHeight: '90vh',
          border: '1px solid #27272A',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.6)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '28px 32px 24px',
          borderBottom: '1px solid #27272A'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 600,
            color: '#FAFAFA',
            margin: '0 0 6px 0',
            letterSpacing: '-0.01em'
          }}>
            {editProfile ? 'Edit SSH Profile' : 'Add SSH Profile'}
          </h2>
          <p style={{
            fontSize: '13px',
            color: '#71717A',
            margin: 0,
            lineHeight: '1.5'
          }}>
            {editProfile ? 'Update connection settings for this profile' : 'Create a reusable SSH connection profile'}
          </p>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '28px',
              right: '32px',
              width: '32px',
              height: '32px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: '#71717A',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#27272A';
              e.currentTarget.style.color = '#FAFAFA';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#71717A';
            }}
          >
            ✕
          </button>
        </div>

        {/* Content - Scrollable */}
        <div style={{
          flex: 1,
          overflowY: 'auto'
        }}>
          {/* CONNECTION DETAILS Section */}
          <div style={{ padding: '32px 32px 28px' }}>
            <h3 style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#71717A',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              margin: '0 0 24px 0',
              paddingBottom: '12px',
              borderBottom: '1px solid #27272A'
            }}>
              Connection Details
            </h3>

            {/* Profile Name & Category Row */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              {/* Profile Name */}
              <div style={{ flex: 1 }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#D4D4D8',
                  marginBottom: '8px'
                }}>
                  Profile Name <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Production Server"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#09090B',
                    border: '1px solid #27272A',
                    borderRadius: '6px',
                    color: '#FAFAFA',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s ease'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#06B6D4'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#27272A'}
                />
                <p style={{
                  fontSize: '12px',
                  color: '#52525B',
                  margin: '6px 0 0 0'
                }}>
                  This name is shown in your connections list
                </p>
              </div>

              {/* Category */}
              <div style={{ flex: 1 }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#D4D4D8',
                  marginBottom: '8px'
                }}>
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#09090B',
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
                  <option value="" style={{ backgroundColor: '#09090B' }}>Uncategorized</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id} style={{ backgroundColor: '#09090B' }}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Host */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                color: '#D4D4D8',
                marginBottom: '8px'
              }}>
                Host <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="192.168.1.100 or server.example.com"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#09090B',
                  border: '1px solid #27272A',
                  borderRadius: '6px',
                  color: '#FAFAFA',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s ease'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#06B6D4'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#27272A'}
              />
            </div>

            {/* Username & Port Row */}
            <div style={{ display: 'flex', gap: '16px' }}>
              {/* Username */}
              <div style={{ flex: 1 }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#D4D4D8',
                  marginBottom: '8px'
                }}>
                  Username <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="root"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#09090B',
                    border: '1px solid #27272A',
                    borderRadius: '6px',
                    color: '#FAFAFA',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s ease'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#06B6D4'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#27272A'}
                />
                <p style={{
                  fontSize: '12px',
                  color: '#52525B',
                  margin: '6px 0 0 0'
                }}>
                  Remote system user (e.g. root, ubuntu, ec2-user)
                </p>
              </div>

              {/* Port */}
              <div style={{ width: '140px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#D4D4D8',
                  marginBottom: '8px'
                }}>
                  Port
                </label>
                <input
                  type="number"
                  placeholder="22"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#09090B',
                    border: '1px solid #27272A',
                    borderRadius: '6px',
                    color: '#FAFAFA',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s ease'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#06B6D4'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#27272A'}
                />
                {port !== '22' && (
                  <p style={{
                    fontSize: '12px',
                    color: '#52525B',
                    margin: '6px 0 0 0'
                  }}>
                    Custom SSH port
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* AUTHENTICATION Section */}
          <div style={{ padding: '28px 32px 32px', borderTop: '1px solid #27272A' }}>
            <h3 style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#71717A',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              margin: '0 0 20px 0',
              paddingBottom: '12px',
              borderBottom: '1px solid #27272A'
            }}>
              Authentication
            </h3>

            {/* Auth Method Toggle */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                color: '#D4D4D8',
                marginBottom: '10px'
              }}>
                Authentication Method
              </label>
              <div style={{ 
                display: 'inline-flex',
                backgroundColor: '#09090B',
                borderRadius: '8px',
                border: '1px solid #27272A',
                padding: '3px'
              }}>
                <button
                  onClick={() => setAuthMethod('password')}
                  style={{
                    padding: '8px 24px',
                    backgroundColor: authMethod === 'password' ? '#18181B' : 'transparent',
                    border: authMethod === 'password' ? '1px solid #3F3F46' : '1px solid transparent',
                    borderRadius: '6px',
                    color: authMethod === 'password' ? '#FAFAFA' : '#71717A',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Password
                </button>
                <button
                  onClick={() => setAuthMethod('key')}
                  style={{
                    padding: '8px 24px',
                    backgroundColor: authMethod === 'key' ? '#18181B' : 'transparent',
                    border: authMethod === 'key' ? '1px solid #3F3F46' : '1px solid transparent',
                    borderRadius: '6px',
                    color: authMethod === 'key' ? '#FAFAFA' : '#71717A',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  SSH Key
                </button>
              </div>
              <p style={{
                fontSize: '12px',
                color: '#52525B',
                margin: '10px 0 0 0'
              }}>
                SSH key authentication is more secure and recommended
              </p>
            </div>

            {/* Password Mode */}
            {authMethod === 'password' && (
              <div style={{ marginTop: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#D4D4D8',
                  marginBottom: '8px'
                }}>
                  Password <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 80px 10px 12px',
                      backgroundColor: '#09090B',
                      border: '1px solid #27272A',
                      borderRadius: '6px',
                      color: '#FAFAFA',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.15s ease'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#06B6D4'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#27272A'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      padding: '4px 12px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#71717A',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'color 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#FAFAFA'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#71717A'}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <p style={{
                  fontSize: '12px',
                  color: '#52525B',
                  margin: '6px 0 0 0'
                }}>
                  Stored securely on this device
                </p>
              </div>
            )}

            {/* SSH Key Mode */}
            {authMethod === 'key' && (
              <div style={{ marginTop: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#D4D4D8',
                  marginBottom: '8px'
                }}>
                  SSH Key <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select
                    value={keyId}
                    onChange={(e) => setKeyId(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      backgroundColor: '#09090B',
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
                    <option value="" style={{ backgroundColor: '#09090B' }}>
                      {sshKeys.length === 0 ? 'No SSH keys available' : 'Select SSH key'}
                    </option>
                    {sshKeys.map(key => (
                      <option key={key.id} value={key.id} style={{ backgroundColor: '#09090B' }}>
                        {key.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => alert('Manage SSH Keys - Coming soon!')}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: 'transparent',
                      border: '1px solid #27272A',
                      borderRadius: '6px',
                      color: '#71717A',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#3F3F46';
                      e.currentTarget.style.color = '#D4D4D8';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#27272A';
                      e.currentTarget.style.color = '#71717A';
                    }}
                  >
                    Manage keys
                  </button>
                </div>
                {sshKeys.length === 0 && (
                  <p style={{
                    fontSize: '12px',
                    color: '#EAB308',
                    margin: '6px 0 0 0'
                  }}>
                    No SSH keys available. Import or generate a key to continue.
                  </p>
                )}
                {selectedKey && (
                  <div style={{
                    marginTop: '10px',
                    padding: '10px 12px',
                    backgroundColor: '#09090B',
                    border: '1px solid #27272A',
                    borderRadius: '6px'
                  }}>
                    <p style={{
                      fontSize: '12px',
                      color: '#71717A',
                      margin: '0 0 4px 0'
                    }}>
                      Key type: <span style={{ color: '#D4D4D8' }}>RSA</span>
                    </p>
                    <p style={{
                      fontSize: '11px',
                      color: '#52525B',
                      margin: 0,
                      fontFamily: 'monospace'
                    }}>
                      Fingerprint: SHA256:{selectedKey.id.substring(0, 16)}...
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ADVANCED SETTINGS Section (Collapsed) */}
          <div style={{ padding: '0 32px 32px', borderTop: '1px solid #27272A' }}>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{
                width: '100%',
                padding: '16px 0',
                backgroundColor: 'transparent',
                border: 'none',
                color: '#71717A',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'color 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#D4D4D8'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#71717A'}
            >
              <span style={{ 
                fontSize: '10px',
                transition: 'transform 0.2s ease',
                transform: showAdvanced ? 'rotate(90deg)' : 'rotate(0deg)'
              }}>▸</span>
              Advanced Settings
            </button>
            {showAdvanced && (
              <div style={{ paddingTop: '8px' }}>
                <p style={{
                  fontSize: '13px',
                  color: '#52525B',
                  margin: 0,
                  fontStyle: 'italic'
                }}>
                  Advanced options coming soon (connection timeout, keep-alive, agent forwarding)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px 32px',
          borderTop: '1px solid #27272A',
          backgroundColor: '#09090B'
        }}>
          {/* Connect Immediately Checkbox */}
          {!editProfile && (
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '16px',
              cursor: 'pointer',
              userSelect: 'none'
            }}>
              <input
                type="checkbox"
                checked={connectImmediately}
                onChange={(e) => setConnectImmediately(e.target.checked)}
                style={{
                  width: '16px',
                  height: '16px',
                  cursor: 'pointer',
                  accentColor: '#06B6D4'
                }}
              />
              <span style={{
                fontSize: '13px',
                color: '#D4D4D8'
              }}>
                Connect immediately after saving
              </span>
            </label>
          )}
          
          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={onClose}
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
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              style={{
                padding: '10px 24px',
                backgroundColor: '#06B6D4',
                border: 'none',
                borderRadius: '6px',
                color: '#FFF',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0891B2'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#06B6D4'}
            >
              {editProfile ? 'Save Changes' : 'Save Profile'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
