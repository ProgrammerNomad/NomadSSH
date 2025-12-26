import React, { useState, useMemo } from 'react';
import { SSHProfile, Session } from '@/types';
import HostCard from './HostCard';
import { Button, Input } from '@/components/ui';

interface DashboardProps {
  profiles: SSHProfile[];
  sessions: Session[];
  onConnect: (profileId: string) => void;
  onCreateProfile: () => void;
  onEditProfile: (profile: SSHProfile) => void;
  onTogglePin: (profileId: string) => void;
  onShowKeys: () => void;
  onShowTunnels: () => void;
  onShowSync: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  profiles,
  sessions,
  onConnect,
  onCreateProfile,
  onEditProfile,
  onTogglePin,
  onShowKeys,
  onShowTunnels,
  onShowSync,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Get connected profile IDs
  const connectedProfileIds = useMemo(
    () => new Set(sessions.map((s) => s.profileId)),
    [sessions]
  );

  // Filter and sort profiles
  const { pinnedProfiles, recentProfiles, otherProfiles } = useMemo(() => {
    const filtered = profiles.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.host.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const pinned = filtered.filter((p) => p.isPinned);
    const recent = filtered
      .filter((p) => !p.isPinned && p.lastConnected)
      .sort(
        (a, b) =>
          new Date(b.lastConnected!).getTime() - new Date(a.lastConnected!).getTime()
      )
      .slice(0, 6);
    const other = filtered.filter((p) => !p.isPinned && !p.lastConnected);

    return { pinnedProfiles: pinned, recentProfiles: recent, otherProfiles: other };
  }, [profiles, searchQuery]);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header with Search */}
      <div className="p-6 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-semibold text-text-primary mb-4">Dashboard</h1>

          {/* Quick Connect Search */}
          <div className="mb-4">
            <Input
              placeholder="Quick connect: search by name, host, username, or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Stats & Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Stats Cards */}
            <div className="bg-surface rounded-lg p-4 border border-border">
              <p className="text-sm text-text-secondary">Total Profiles</p>
              <p className="text-2xl font-bold text-text-primary">{profiles.length}</p>
            </div>
            <div className="bg-surface rounded-lg p-4 border border-border">
              <p className="text-sm text-text-secondary">Active Sessions</p>
              <p className="text-2xl font-bold text-green-400">{sessions.length}</p>
            </div>
            <div className="bg-surface rounded-lg p-4 border border-border">
              <p className="text-sm text-text-secondary">Pinned</p>
              <p className="text-2xl font-bold text-text-primary">
                {profiles.filter((p) => p.isPinned).length}
              </p>
            </div>
            <div className="bg-surface rounded-lg p-4 border border-border">
              <p className="text-sm text-text-secondary">Quick Actions</p>
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="ghost" onClick={onShowKeys} title="SSH Keys">
                  🔑
                </Button>
                <Button size="sm" variant="ghost" onClick={onShowTunnels} title="Tunnels">
                  🔀
                </Button>
                <Button size="sm" variant="ghost" onClick={onShowSync} title="Sync">
                  ☁️
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Profile Cards */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* No Profiles State */}
          {profiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="text-6xl mb-4">🚀</div>
              <h2 className="text-xl font-semibold text-text-primary mb-2">
                Welcome to NomadSSH
              </h2>
              <p className="text-text-secondary mb-4">
                Create your first SSH profile to get started
              </p>
              <Button variant="primary" onClick={onCreateProfile}>
                Create Profile
              </Button>
            </div>
          ) : (
            <>
              {/* Pinned Profiles */}
              {pinnedProfiles.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                      📌 Pinned
                    </h2>
                    <span className="text-sm text-text-secondary">
                      {pinnedProfiles.length} {pinnedProfiles.length === 1 ? 'host' : 'hosts'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {pinnedProfiles.map((profile) => (
                      <HostCard
                        key={profile.id}
                        profile={profile}
                        isConnected={connectedProfileIds.has(profile.id)}
                        onConnect={onConnect}
                        onEdit={onEditProfile}
                        onTogglePin={onTogglePin}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Connections */}
              {recentProfiles.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                      🕒 Recent Connections
                    </h2>
                    <span className="text-sm text-text-secondary">
                      {recentProfiles.length} {recentProfiles.length === 1 ? 'host' : 'hosts'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {recentProfiles.map((profile) => (
                      <HostCard
                        key={profile.id}
                        profile={profile}
                        isConnected={connectedProfileIds.has(profile.id)}
                        onConnect={onConnect}
                        onEdit={onEditProfile}
                        onTogglePin={onTogglePin}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* All Other Profiles */}
              {otherProfiles.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                      📁 All Profiles
                    </h2>
                    <span className="text-sm text-text-secondary">
                      {otherProfiles.length} {otherProfiles.length === 1 ? 'host' : 'hosts'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {otherProfiles.map((profile) => (
                      <HostCard
                        key={profile.id}
                        profile={profile}
                        isConnected={connectedProfileIds.has(profile.id)}
                        onConnect={onConnect}
                        onEdit={onEditProfile}
                        onTogglePin={onTogglePin}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* No Search Results */}
              {searchQuery &&
                pinnedProfiles.length === 0 &&
                recentProfiles.length === 0 &&
                otherProfiles.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <div className="text-6xl mb-4">🔍</div>
                    <h2 className="text-xl font-semibold text-text-primary mb-2">
                      No profiles found
                    </h2>
                    <p className="text-text-secondary">
                      Try adjusting your search query
                    </p>
                  </div>
                )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
