import React from 'react';
import { Button } from '@/components/ui';

interface KeyGroupHeaderProps {
  groupName: string;
  keyCount: number;
  collapsed: boolean;
  onToggle: () => void;
  onEdit?: () => void;
}

const KeyGroupHeader: React.FC<KeyGroupHeaderProps> = ({
  groupName,
  keyCount,
  collapsed,
  onToggle,
  onEdit,
}) => {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-surface border-b border-border hover:bg-background transition-colors">
      <button
        onClick={onToggle}
        className="flex items-center gap-3 flex-1 text-left"
      >
        <svg
          className={`w-4 h-4 text-text-secondary transition-transform ${
            collapsed ? '' : 'rotate-90'
          }`}
          fill="none"
          strokeWidth="2"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="font-semibold text-text-primary">{groupName}</span>
        <span className="text-sm text-text-secondary">({keyCount})</span>
      </button>
      {onEdit && (
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          Edit
        </Button>
      )}
    </div>
  );
};

export default KeyGroupHeader;
