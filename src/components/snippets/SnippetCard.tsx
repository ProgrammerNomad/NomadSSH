import React from 'react';
import { Button } from '@/components/ui';
import { Snippet } from '@/types';

interface SnippetCardProps {
  snippet: Snippet;
  onRun: (snippet: Snippet) => void;
  onPaste: (snippet: Snippet) => void;
  onEdit: (snippet: Snippet) => void;
  onDelete: (snippetId: string) => void;
}

const SnippetCard: React.FC<SnippetCardProps> = ({
  snippet,
  onRun,
  onPaste,
  onEdit,
  onDelete,
}) => {
  const getCategoryColor = (category: string) => {
    const colors = {
      System: 'bg-primary-subtle text-primary-light border border-primary/30',
      Network: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
      Docker: 'bg-purple-500/10 text-purple-400 border border-purple-500/30',
      Git: 'bg-orange-500/10 text-orange-400 border border-orange-500/30',
      Database: 'bg-red-500/10 text-red-400 border border-red-500/30',
      Custom: 'bg-zinc-800 text-text-secondary border border-border',
    };
    return colors[category as keyof typeof colors] || colors.Custom;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-4 hover:border-accent/50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-text-primary">{snippet.name}</h3>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(snippet.category)}`}>
              {snippet.category}
            </span>
          </div>
          {snippet.description && (
            <p className="text-xs text-text-secondary mt-1">{snippet.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(snippet)}
            className="px-2"
            title="Edit snippet"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(snippet.id)}
            className="px-2 text-error hover:text-error"
            title="Delete snippet"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Command Preview */}
      <div className="bg-background border border-border rounded p-3 mb-3">
        <code className="text-xs font-mono text-text-primary break-all">
          {snippet.command}
        </code>
      </div>

      {/* Variables Badge */}
      {snippet.variables && snippet.variables.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-text-secondary">Variables:</span>
          {snippet.variables.map((variable) => (
            <span
              key={variable}
              className="px-2 py-0.5 bg-accent/20 text-accent rounded text-xs font-mono"
            >
              {variable}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={() => onRun(snippet)}
            className="px-3"
          >
            <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            RUN
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onPaste(snippet)}
            className="px-3"
          >
            <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            PASTE
          </Button>
        </div>
        {snippet.lastUsed && (
          <span className="text-xs text-text-secondary">
            Last used {formatDate(snippet.lastUsed)}
          </span>
        )}
      </div>
    </div>
  );
};

export default SnippetCard;
