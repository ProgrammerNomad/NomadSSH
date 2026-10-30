import React, { useState } from 'react';

export interface SSHKey {
  id: string;
  name: string;
  publicKey: string;
  privateKey: string;
  passphrase?: string;
  createdAt: number;
}

interface ManageKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
  keys: SSHKey[];
  onSave: (keys: SSHKey[]) => void;
}

export function ManageKeysModal({ 
  isOpen, 
  onClose, 
  keys: initialKeys,
  onSave 
}: ManageKeysModalProps) {
  const [keys, setKeys] = useState<SSHKey[]>(initialKeys);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newPrivateKey, setNewPrivateKey] = useState('');
  const [newPassphrase, setNewPassphrase] = useState('');

  if (!isOpen) return null;

  const handleImportKey = () => {
    if (!newKeyName.trim() || !newPrivateKey.trim()) {
      alert('Please provide key name and private key');
      return;
    }

    const newKey: SSHKey = {
      id: `key_${Date.now()}`,
      name: newKeyName.trim(),
      publicKey: '', // Will be derived or imported separately
      privateKey: newPrivateKey.trim(),
      passphrase: newPassphrase || undefined,
      createdAt: Date.now()
    };

    setKeys([...keys, newKey]);
    setNewKeyName('');
    setNewPrivateKey('');
    setNewPassphrase('');
    setShowAddForm(false);
  };

  const handleDeleteKey = (id: string) => {
    if (confirm('Delete this SSH key? This cannot be undone.')) {
      setKeys(keys.filter(k => k.id !== id));
    }
  };

  const handleSave = () => {
    onSave(keys);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        backgroundColor: '#18181B',
        borderRadius: '12px',
        width: '600px',
        maxHeight: '700px',
        border: '1px solid #3F3F46',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #3F3F46',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#E5E7EB',
            margin: 0
          }}>
            Manage SSH Keys
          </h2>
          <button
            onClick={onClose}
            style={{
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
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px'
        }}>
          {/* Add key button */}
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#06B6D4',
                border: 'none',
                borderRadius: '8px',
                color: '#FFF',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0891B2'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#06B6D4'}
            >
              <span style={{ fontSize: '18px' }}>+</span>
              Import SSH Key
            </button>
          )}

          {/* Add key form */}
          {showAddForm && (
            <div style={{
              marginBottom: '24px',
              padding: '16px',
              backgroundColor: '#27272A',
              borderRadius: '8px',
              border: '1px solid #3F3F46'
            }}>
              <div style={{
                fontSize: '15px',
                fontWeight: 600,
                color: '#E5E7EB',
                marginBottom: '16px'
              }}>
                Import SSH Key
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#A1A1AA',
                  marginBottom: '6px'
                }}>
                  Key Name
                </label>
                <input
                  type="text"
                  placeholder="My SSH Key"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#18181B',
                    border: '1px solid #3F3F46',
                    borderRadius: '6px',
                    color: '#E5E7EB',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#A1A1AA',
                  marginBottom: '6px'
                }}>
                  Private Key
                </label>
                <textarea
                  placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;..."
                  value={newPrivateKey}
                  onChange={(e) => setNewPrivateKey(e.target.value)}
                  rows={8}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#18181B',
                    border: '1px solid #3F3F46',
                    borderRadius: '6px',
                    color: '#E5E7EB',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#A1A1AA',
                  marginBottom: '6px'
                }}>
                  Passphrase (optional)
                </label>
                <input
                  type="password"
                  placeholder="Enter if key is encrypted"
                  value={newPassphrase}
                  onChange={(e) => setNewPassphrase(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#18181B',
                    border: '1px solid #3F3F46',
                    borderRadius: '6px',
                    color: '#E5E7EB',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleImportKey}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#10B981',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#FFF',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Import Key
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewKeyName('');
                    setNewPrivateKey('');
                    setNewPassphrase('');
                  }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#3F3F46',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#E5E7EB',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Keys list */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 600,
              color: '#A1A1AA',
              marginBottom: '12px'
            }}>
              Your SSH Keys ({keys.length})
            </label>
            {keys.length === 0 ? (
              <div style={{
                padding: '32px',
                textAlign: 'center',
                color: '#71717A',
                fontSize: '14px'
              }}>
                No SSH keys imported yet
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {keys.map((key) => (
                  <div
                    key={key.id}
                    style={{
                      padding: '14px',
                      backgroundColor: '#27272A',
                      border: '1px solid #3F3F46',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: '#3F3F46',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <svg width="20" height="20" fill="none" stroke="#06B6D4" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#E5E7EB',
                        marginBottom: '4px'
                      }}>
                        {key.name}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#71717A'
                      }}>
                        Added {new Date(key.createdAt).toLocaleDateString()}
                        {key.passphrase && ' • Protected'}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteKey(key.id)}
                      style={{
                        padding: '8px 14px',
                        backgroundColor: 'transparent',
                        border: '1px solid #3F3F46',
                        borderRadius: '6px',
                        color: '#EF4444',
                        fontSize: '13px',
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
                        e.currentTarget.style.borderColor = '#3F3F46';
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #3F3F46',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: '#27272A',
              border: '1px solid #3F3F46',
              borderRadius: '8px',
              color: '#E5E7EB',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3F3F46'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#27272A'}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '10px 20px',
              backgroundColor: '#06B6D4',
              border: 'none',
              borderRadius: '8px',
              color: '#FFF',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0891B2'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#06B6D4'}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
