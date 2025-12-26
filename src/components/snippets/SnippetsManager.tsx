import React, { useState, useMemo } from 'react';
import { Button, Input } from '@/components/ui';
import { Snippet } from '@/types';
import SnippetCard from './SnippetCard';
import AddSnippetModal from './AddSnippetModal';

interface SnippetsManagerProps {
  snippets: Snippet[];
  onAdd: (snippetData: Omit<Snippet, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onEdit: (id: string, snippetData: Partial<Snippet>) => void;
  onDelete: (id: string) => void;
  onRun: (snippet: Snippet) => void;
  onPaste: (snippet: Snippet) => void;
  onClose?: () => void;
}

const SnippetsManager: React.FC<SnippetsManagerProps> = ({
  snippets,
  onAdd,
  onEdit,
  onDelete,
  onRun,
  onPaste,
  onClose,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<Snippet | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'System', 'Network', 'Docker', 'Git', 'Database', 'Custom'];

  // Filter snippets
  const filteredSnippets = useMemo(() => {
    return snippets.filter((snippet) => {
      const matchesSearch =
        searchQuery === '' ||
        snippet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        snippet.command.toLowerCase().includes(searchQuery.toLowerCase()) ||
        snippet.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'All' || snippet.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [snippets, searchQuery, selectedCategory]);

  // Recent snippets (last 5 used)
  const recentSnippets = useMemo(() => {
    return [...snippets]
      .filter((s) => s.lastUsed)
      .sort((a, b) => {
        if (!a.lastUsed || !b.lastUsed) return 0;
        return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
      })
      .slice(0, 5);
  }, [snippets]);

  const handleAdd = () => {
    setEditingSnippet(undefined);
    setShowAddModal(true);
  };

  const handleEdit = (snippet: Snippet) => {
    setEditingSnippet(snippet);
    setShowAddModal(true);
  };

  const handleSave = (snippetData: Omit<Snippet, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingSnippet) {
      onEdit(editingSnippet.id, {
        ...snippetData,
        updatedAt: new Date().toISOString(),
      });
    } else {
      onAdd(snippetData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this snippet?')) {
      onDelete(id);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onClose && (
            <Button size="sm" variant="ghost" onClick={onClose} className="px-2">
              ←
            </Button>
          )}
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Command Snippets</h2>
            <p className="text-sm text-text-secondary mt-1">
              Save and reuse frequently used commands
            </p>
          </div>
        </div>
        <Button variant="primary" onClick={handleAdd}>
          + Add Snippet
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="p-4 border-b border-border space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search snippets..."
            className="pl-10"
          />
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-accent text-white'
                  : 'bg-surface text-text-secondary hover:bg-border'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {snippets.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-text-secondary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              </svg>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                No snippets yet
              </h3>
              <p className="text-text-secondary mb-4">
                Create your first command snippet to save time on repetitive tasks
              </p>
              <Button variant="primary" onClick={handleAdd}>
                Add Your First Snippet
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Recent Snippets */}
            {recentSnippets.length > 0 && searchQuery === '' && selectedCategory === 'All' && (
              <section>
                <h3 className="text-sm font-semibold text-text-primary mb-3">
                  Recently Used
                </h3>
                <div className="grid gap-3">
                  {recentSnippets.map((snippet) => (
                    <SnippetCard
                      key={snippet.id}
                      snippet={snippet}
                      onRun={onRun}
                      onPaste={onPaste}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* All Snippets / Filtered */}
            <section>
              <h3 className="text-sm font-semibold text-text-primary mb-3">
                {searchQuery || selectedCategory !== 'All' ? 'Search Results' : 'All Snippets'}
                <span className="text-text-secondary font-normal ml-2">
                  ({filteredSnippets.length})
                </span>
              </h3>
              {filteredSnippets.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-text-secondary">No snippets found</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredSnippets.map((snippet) => (
                    <SnippetCard
                      key={snippet.id}
                      snippet={snippet}
                      onRun={onRun}
                      onPaste={onPaste}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AddSnippetModal
        open={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingSnippet(undefined);
        }}
        onSave={handleSave}
        snippet={editingSnippet}
      />
    </div>
  );
};

export default SnippetsManager;
