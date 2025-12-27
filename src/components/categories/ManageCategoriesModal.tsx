import React, { useState } from 'react';

export interface Category {
  id: string;
  name: string;
  icon?: string;
  isDefault: boolean;
}

interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onSave: (categories: Category[]) => void;
}

export function ManageCategoriesModal({ 
  isOpen, 
  onClose, 
  categories: initialCategories,
  onSave 
}: ManageCategoriesModalProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  if (!isOpen) return null;

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;

    const newCategory: Category = {
      id: `cat_${Date.now()}`,
      name: newCategoryName.trim(),
      isDefault: false
    };

    setCategories([...categories, newCategory]);
    setNewCategoryName('');
  };

  const handleDeleteCategory = (id: string) => {
    setCategories(categories.filter(c => c.id !== id));
  };

  const handleStartEdit = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
  };

  const handleSaveEdit = () => {
    if (!editName.trim()) return;

    setCategories(categories.map(c => 
      c.id === editingId ? { ...c, name: editName.trim() } : c
    ));
    setEditingId(null);
    setEditName('');
  };

  const handleSave = () => {
    onSave(categories);
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
        width: '500px',
        maxHeight: '600px',
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
            Manage Categories
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
          {/* Add new category */}
          <div style={{
            marginBottom: '24px',
            padding: '16px',
            backgroundColor: '#27272A',
            borderRadius: '8px',
            border: '1px solid #3F3F46'
          }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 600,
              color: '#A1A1AA',
              marginBottom: '8px'
            }}>
              Add New Category
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Category name..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  backgroundColor: '#18181B',
                  border: '1px solid #3F3F46',
                  borderRadius: '6px',
                  color: '#E5E7EB',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <button
                onClick={handleAddCategory}
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
                Add
              </button>
            </div>
          </div>

          {/* Categories list */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 600,
              color: '#A1A1AA',
              marginBottom: '12px'
            }}>
              Your Categories
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {categories.map((category) => (
                <div
                  key={category.id}
                  style={{
                    padding: '12px',
                    backgroundColor: '#27272A',
                    border: '1px solid #3F3F46',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  {editingId === category.id ? (
                    <>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                        style={{
                          flex: 1,
                          padding: '8px 10px',
                          backgroundColor: '#18181B',
                          border: '1px solid #3F3F46',
                          borderRadius: '6px',
                          color: '#E5E7EB',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                        autoFocus
                      />
                      <button
                        onClick={handleSaveEdit}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#10B981',
                          border: 'none',
                          borderRadius: '6px',
                          color: '#FFF',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditName('');
                        }}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#3F3F46',
                          border: 'none',
                          borderRadius: '6px',
                          color: '#E5E7EB',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: 500,
                          color: '#E5E7EB'
                        }}>
                          {category.name}
                        </div>
                      </div>
                      <button
                        onClick={() => handleStartEdit(category)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: 'transparent',
                          border: '1px solid #3F3F46',
                          borderRadius: '6px',
                          color: '#A1A1AA',
                          fontSize: '13px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#3F3F46';
                          e.currentTarget.style.color = '#E5E7EB';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#A1A1AA';
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: 'transparent',
                          border: '1px solid #3F3F46',
                          borderRadius: '6px',
                          color: '#EF4444',
                          fontSize: '13px',
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
                    </>
                  )}
                </div>
              ))}
            </div>
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
