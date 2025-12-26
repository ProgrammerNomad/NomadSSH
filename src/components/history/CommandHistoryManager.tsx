import React, { useState, useMemo } from 'react';
import { CommandHistory, SSHProfile } from '@/types';
import { Button, Input } from '@/components/ui';

interface CommandHistoryManagerProps {
  history: CommandHistory[];
  profiles: SSHProfile[];
  onRerun: (command: string) => void;
  onExport: () => void;
}

const CommandHistoryManager: React.FC<CommandHistoryManagerProps> = ({
  history,
  profiles,
  onRerun,
  onExport,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProfile, setFilterProfile] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'failure'>('all');
  const [sortBy, setSortBy] = useState<'time' | 'profile' | 'duration'>('time');

  // Filter and sort history
  const filteredHistory = useMemo(() => {
    let filtered = [...history];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.command.toLowerCase().includes(query) ||
          item.profileName.toLowerCase().includes(query)
      );
    }

    // Profile filter
    if (filterProfile !== 'all') {
      filtered = filtered.filter((item) => item.profileId === filterProfile);
    }

    // Status filter
    if (filterStatus === 'success') {
      filtered = filtered.filter((item) => item.exitCode === 0);
    } else if (filterStatus === 'failure') {
      filtered = filtered.filter((item) => item.exitCode !== 0 && item.exitCode !== undefined);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'time') {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      } else if (sortBy === 'profile') {
        return a.profileName.localeCompare(b.profileName);
      } else if (sortBy === 'duration') {
        return (b.duration || 0) - (a.duration || 0);
      }
      return 0;
    });

    return filtered;
  }, [history, searchQuery, filterProfile, filterStatus, sortBy]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleString();
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return '-';
    if (duration < 1000) return `${duration}ms`;
    if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`;
    return `${Math.floor(duration / 60000)}m ${Math.floor((duration % 60000) / 1000)}s`;
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h1 className="text-xl font-semibold text-text-primary">Command History</h1>
            <p className="text-sm text-text-secondary">
              {filteredHistory.length} {filteredHistory.length === 1 ? 'command' : 'commands'}
            </p>
          </div>
        </div>
        <Button variant="secondary" onClick={onExport}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-surface">
        {/* Search */}
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search commands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Profile Filter */}
        <select
          value={filterProfile}
          onChange={(e) => setFilterProfile(e.target.value)}
          className="px-3 py-2 bg-background border border-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="all">All Profiles</option>
          {profiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.name}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as 'all' | 'success' | 'failure')}
          className="px-3 py-2 bg-background border border-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="all">All Status</option>
          <option value="success">Success</option>
          <option value="failure">Failure</option>
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'time' | 'profile' | 'duration')}
          className="px-3 py-2 bg-background border border-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="time">Sort by Time</option>
          <option value="profile">Sort by Profile</option>
          <option value="duration">Sort by Duration</option>
        </select>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-auto">
        {filteredHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <svg className="w-16 h-16 text-text-secondary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-text-primary mb-2">No Command History</h3>
            <p className="text-text-secondary max-w-md">
              {searchQuery || filterProfile !== 'all' || filterStatus !== 'all'
                ? 'No commands match your filters. Try adjusting your search criteria.'
                : 'Commands executed in SSH sessions will appear here.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredHistory.map((item) => (
              <div
                key={item.id}
                className="p-4 hover:bg-surface transition-colors group"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Command Info */}
                  <div className="flex-1 min-w-0">
                    {/* Command */}
                    <div className="flex items-start gap-2 mb-2">
                      <code className="flex-1 text-sm font-mono text-text-primary break-all bg-background px-3 py-2 rounded border border-border">
                        {item.command}
                      </code>
                      {item.exitCode !== undefined && (
                        <span
                          className={`shrink-0 text-xs px-2 py-1 rounded font-medium ${
                            item.exitCode === 0
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {item.exitCode === 0 ? 'Success' : `Exit ${item.exitCode}`}
                        </span>
                      )}
                    </div>

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 text-xs text-text-secondary">
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                        </svg>
                        {item.profileName}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatTimestamp(item.timestamp)}
                      </span>
                      {item.duration !== undefined && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          {formatDuration(item.duration)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onRerun(item.command)}
                      title="Re-run command"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommandHistoryManager;
