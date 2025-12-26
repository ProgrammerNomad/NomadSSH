import React from 'react';
import { SSHProfile } from '@/types';
import { Button } from '@/components/ui';
import { getTagColor } from '@/utils/tags';

interface HostCardProps {
  profile: SSHProfile;
  isConnected?: boolean;
  onConnect: (profileId: string) => void;
  onEdit: (profile: SSHProfile) => void;
  onTogglePin: (profileId: string) => void;
}

const HostCard: React.FC<HostCardProps> = ({
  profile,
  isConnected = false,
  onConnect,
  onEdit,
  onTogglePin,
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getLastConnectedText = () => {
    if (!profile.lastConnected) return 'Never connected';
    const date = new Date(profile.lastConnected);
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
    <div
      className={`relative group rounded-lg border p-4 transition-all hover:shadow-lg ${
        isConnected
          ? 'border-green-500 bg-green-500/5'
          : 'border-border bg-surface hover:border-accent'
      }`}
    >
      {/* Pin Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onTogglePin(profile.id);
        }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-text-secondary hover:text-accent"
        title={profile.isPinned ? 'Unpin' : 'Pin'}
      >
        {profile.isPinned ? (
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6l1 1 1-1v-6h5v-2z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6l1 1 1-1v-6h5v-2z" />
          </svg>
        )}
      </button>

      {/* Host Icon/Avatar */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold ${
            profile.icon && profile.icon.startsWith('#')
              ? ''
              : 'bg-accent text-text-primary'
          }`}
          style={
            profile.icon && profile.icon.startsWith('#')
              ? { backgroundColor: profile.icon }
              : undefined
          }
        >
          {profile.icon && !profile.icon.startsWith('#') ? profile.icon : getInitials(profile.name)}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-text-primary truncate">
            {profile.name}
          </h3>
          <p className="text-sm text-text-secondary truncate">
            {profile.username}@{profile.host}
          </p>
        </div>
      </div>

      {/* Status & Tags */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {isConnected && (
          <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400 font-medium border border-green-500/30">
            Connected
          </span>
        )}
        {profile.tags?.slice(0, 3).map((tag) => (
          <span key={tag} className={`text-xs px-2 py-0.5 rounded border ${getTagColor(tag)}`}>
            {tag}
          </span>
        ))}
        {profile.tags && profile.tags.length > 3 && (
          <span className="text-xs text-text-secondary">+{profile.tags.length - 3}</span>
        )}
      </div>

      {/* Last Connected */}
      <p className="text-xs text-text-secondary mb-3">{getLastConnectedText()}</p>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={() => onConnect(profile.id)}
          className="flex-1"
          disabled={isConnected}
        >
          {isConnected ? 'Connected' : 'Connect'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(profile);
          }}
        >
          Edit
        </Button>
      </div>
    </div>
  );
};

export default HostCard;
