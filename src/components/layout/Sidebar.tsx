import React, { useState, useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui';
import { SSHProfile, Session } from '@/types';
import { getTagColor } from '@/utils/tags';

interface SidebarProps {
  collapsed: boolean;
  profiles: SSHProfile[];
  sessions: Session[];
  onToggle: () => void;
  onProfileClick: (profileId: string) => void;
  onHome: () => void;
  onAddProfile: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  profiles,
  sessions,
  onToggle,
  onProfileClick,
  onHome,
  onAddProfile,
}) => {
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Get all unique tags from profiles
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    profiles.forEach((p) => p.tags?.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [profiles]);

  // Get connected profile IDs
  const connectedProfileIds = useMemo(
    () => new Set(sessions.map((s) => s.profileId)),
    [sessions]
  );

  // Filter profiles by selected tags
  const filteredProfiles = useMemo(() => {
    if (selectedTags.length === 0) return profiles;
    return profiles.filter((p) =>
      selectedTags.some((tag) => p.tags?.includes(tag))
    );
  }, [profiles, selectedTags]);

  const toggleTagFilter = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const renderProfileItem = (profile: SSHProfile) => {
    const isConnected = connectedProfileIds.has(profile.id);
    const statusColor = isConnected ? 'bg-green-500' : 'bg-text-secondary';

    if (collapsed) {
      return (
        <TooltipProvider key={profile.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onProfileClick(profile.id)}
                className="w-full p-2 flex items-center justify-center hover:bg-border rounded transition-colors relative group"
              >
                <span className={`w-2 h-2 rounded-full ${statusColor}`} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <div className="text-xs">
                <div className="font-semibold">{profile.name}</div>
                <div className="text-text-secondary">
                  {profile.username}@{profile.host}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <button
        key={profile.id}
        onClick={() => onProfileClick(profile.id)}
        className="w-full p-2 flex items-center gap-2 hover:bg-border rounded transition-colors group text-left"
      >
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColor}`} />
        <div className="flex-1 min-w-0">
          <div className="text-sm text-text-primary truncate">{profile.name}</div>
          {profile.tags && profile.tags.length > 0 && (
            <div className="text-xs text-text-secondary truncate">
              {profile.tags.map((tag) => `#${tag}`).join(' ')}
            </div>
          )}
        </div>
      </button>
    );
  };

  return (
    <aside
      className={`bg-surface border-r border-border flex flex-col transition-all duration-200 relative group ${
        collapsed ? 'w-14' : 'w-64'
      }`}
    >
      {/* Collapse Toggle Button - Show on hover */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 z-10 w-6 h-6 bg-surface border border-border rounded-full items-center justify-center hover:bg-border transition-all shadow-sm opacity-0 group-hover:opacity-100 flex"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <span className="text-xs text-text-secondary">
          {collapsed ? '▶' : '◀'}
        </span>
      </button>

      {/* Home Button */}
      <div className="p-2 border-b border-border">
        {collapsed ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onHome}
                  className="w-full p-2 flex items-center justify-center hover:bg-border rounded transition-colors"
                >
                  <span className="text-text-primary font-mono text-sm">&gt;_</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <div className="text-xs font-medium">Home</div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <button
            onClick={onHome}
            className="w-full p-2 flex items-center gap-3 hover:bg-border rounded transition-colors"
          >
            <span className="text-text-primary font-mono text-sm">&gt;_</span>
            <span className="text-sm text-text-primary font-medium">Home</span>
          </button>
        )}
      </div>

      {/* Profiles Section */}
      <div className="flex-1 overflow-y-auto">
        {!collapsed && (
          <div className="px-2 py-2">
            <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
              Profiles
            </div>
          </div>
        )}

        <div className="px-2 space-y-1">
          {filteredProfiles.length === 0 ? (
            !collapsed && (
              <div className="text-center py-8 text-text-secondary text-xs">
                {selectedTags.length > 0 ? 'No matching profiles' : 'No profiles yet'}
              </div>
            )
          ) : (
            filteredProfiles.map(renderProfileItem)
          )}
        </div>

        {/* Tag Filters Section */}
        {allTags.length > 0 && (
          <div className="mt-4">
            {!collapsed && (
              <button
                onClick={() => setFiltersCollapsed(!filtersCollapsed)}
                className="w-full px-2 py-2 flex items-center justify-between hover:bg-border transition-colors"
              >
                <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                  Filters
                </div>
                <span className="text-xs text-text-secondary">
                  {filtersCollapsed ? '▶' : '▼'}
                </span>
              </button>
            )}

            {!filtersCollapsed && (
              <div className="px-2 space-y-1">
                {allTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  const tagColorClasses = getTagColor(tag);
                  
                  if (collapsed) {
                    return (
                      <TooltipProvider key={tag}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => toggleTagFilter(tag)}
                              className={`w-full p-2 flex items-center justify-center rounded transition-colors ${
                                isSelected ? tagColorClasses : 'hover:bg-border'
                              }`}
                            >
                              <span className="text-xs">#</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <div className="text-xs">#{tag}</div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  }

                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTagFilter(tag)}
                      className={`w-full px-2 py-1.5 flex items-center gap-2 rounded transition-colors text-left ${
                        isSelected ? tagColorClasses : 'hover:bg-border'
                      }`}
                    >
                      <span className="text-xs">#</span>
                      <span className="text-sm flex-1 truncate">{tag}</span>
                      {isSelected && <span className="text-xs">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Profile Button */}
      <div className="p-2 border-t border-border">
        {collapsed ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onAddProfile}
                  className="w-full p-2 flex items-center justify-center bg-accent hover:bg-accent/80 rounded transition-colors"
                >
                  <span className="text-text-primary font-semibold">+</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <div className="text-xs font-medium">Add Profile</div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <button
            onClick={onAddProfile}
            className="w-full p-2 flex items-center justify-center gap-2 bg-accent hover:bg-accent/80 rounded transition-colors"
          >
            <span className="text-text-primary font-semibold">+</span>
            <span className="text-sm text-text-primary font-medium">Add Profile</span>
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
