import { useState, useEffect } from 'react';
import { Shield, Trash2, Eye, Download, Upload, Search, AlertTriangle } from 'lucide-react';
import type { HostKey } from '../../types';

interface SecuritySettingsProps {
  onClose?: () => void;
}

export function SecuritySettings({ onClose }: SecuritySettingsProps) {
  const [knownHosts, setKnownHosts] = useState<HostKey[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHost, setSelectedHost] = useState<HostKey | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [hostToRemove, setHostToRemove] = useState<{ host: string; port: number } | null>(null);
  const [sortBy, setSortBy] = useState<'host' | 'date'>('host');

  useEffect(() => {
    loadKnownHosts();
  }, []);

  const loadKnownHosts = async () => {
    try {
      const result = await window.nomad.storage.getKnownHosts();
      if (result.success && result.data) {
        setKnownHosts(result.data);
      }
    } catch (error) {
      console.error('[SecuritySettings] Failed to load known hosts:', error);
    }
  };

  const handleRemoveHost = async (host: string, port: number) => {
    setHostToRemove({ host, port });
    setShowRemoveConfirm(true);
  };

  const confirmRemoveHost = async () => {
    if (hostToRemove) {
      await window.nomad.storage.removeKnownHost(hostToRemove.host, hostToRemove.port);
      loadKnownHosts();
      setShowRemoveConfirm(false);
      setHostToRemove(null);
    }
  };

  const handleClearAll = async () => {
    await window.nomad.storage.clearKnownHosts();
    loadKnownHosts();
    setShowClearConfirm(false);
  };

  const handleViewDetails = (host: HostKey) => {
    setSelectedHost(host);
    setShowDetailsModal(true);
  };

  const handleExport = () => {
    const hosts = knownHostsService.getAllKnownHosts();
    const data = JSON.stringify(hosts, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nomadssh_known_hosts_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string);
          if (Array.isArray(imported)) {
            // Clear and import (replace strategy)
            await window.nomad.storage.clearKnownHosts();
            
            // Note: Import would need a bulk save IPC method
            // For now, just reload to show current state
            alert(`Import feature needs bulk save IPC implementation`);
            loadKnownHosts();
          }
        } catch (error) {
          alert('Failed to import: Invalid file format');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const filteredHosts = knownHosts
    .filter(host => 
      host.host.toLowerCase().includes(searchQuery.toLowerCase()) ||
      host.fingerprint.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'host') {
        return a.host.localeCompare(b.host);
      }
      return new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime();
    });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const truncateFingerprint = (fp: string) => {
    if (fp.length <= 20) return fp;
    return fp.substring(0, 20) + '...';
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-cyan-500" />
          <div>
            <h2 className="text-xl font-semibold text-gray-200">Security Settings</h2>
            <p className="text-sm text-zinc-500">Manage SSH host keys and verification</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-300 bg-zinc-800 rounded hover:bg-zinc-700"
          >
            Close
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Known Hosts Section */}
        <div className="bg-zinc-900 rounded-lg border border-zinc-800">
          <div className="p-4 border-b border-zinc-800">
            <h3 className="text-lg font-semibold text-gray-200 mb-2">Known Hosts</h3>
            <p className="text-sm text-zinc-500 mb-4">
              Verified SSH server fingerprints. These are checked on every connection to prevent man-in-the-middle attacks.
            </p>

            {/* Search and Actions */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search by host or fingerprint..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded text-gray-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'host' | 'date')}
                className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-gray-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="host">Sort by Host</option>
                <option value="date">Sort by Date</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                disabled={knownHosts.length === 0}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-zinc-800 text-gray-300 rounded hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={handleImport}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-zinc-800 text-gray-300 rounded hover:bg-zinc-700"
              >
                <Upload className="w-4 h-4" />
                Import
              </button>
              <button
                onClick={() => setShowClearConfirm(true)}
                disabled={knownHosts.length === 0}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            </div>
          </div>

          {/* Host Keys List */}
          <div className="divide-y divide-zinc-800">
            {filteredHosts.length === 0 ? (
              <div className="p-8 text-center">
                <Shield className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500">
                  {searchQuery ? 'No matching host keys found' : 'No host keys saved yet'}
                </p>
                <p className="text-sm text-zinc-600 mt-1">
                  Host keys are automatically saved when you verify a new SSH connection
                </p>
              </div>
            ) : (
              filteredHosts.map((host) => (
                <div
                  key={`${host.host}:${host.port}`}
                  className="p-4 hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-gray-200 font-medium">
                          {host.host}:{host.port}
                        </span>
                        <span className="px-2 py-0.5 text-xs bg-zinc-800 text-zinc-400 rounded">
                          {host.keyType}
                        </span>
                      </div>
                      <div className="text-sm text-zinc-500 mb-1">
                        {truncateFingerprint(host.fingerprint)}
                      </div>
                      <div className="text-xs text-zinc-600">
                        Added: {formatDate(host.addedAt)} • Last seen: {formatDate(host.lastSeenAt)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetails(host)}
                        className="p-2 text-cyan-400 hover:bg-zinc-800 rounded transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveHost(host.host, host.port)}
                        className="p-2 text-red-400 hover:bg-zinc-800 rounded transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 p-4 bg-zinc-900 rounded-lg border border-zinc-800">
          <div className="text-sm text-zinc-500">
            <div className="flex justify-between mb-1">
              <span>Total Known Hosts:</span>
              <span className="text-gray-200 font-medium">{knownHosts.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Remove Single Host Confirmation Modal */}
      {showRemoveConfirm && hostToRemove && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <Trash2 className="w-6 h-6 text-cyan-500" />
              <h3 className="text-lg font-semibold text-gray-200">Remove Host Key?</h3>
            </div>
            <p className="text-zinc-400 mb-2">
              Remove host key for <span className="text-cyan-400 font-mono">{hostToRemove.host}:{hostToRemove.port}</span>?
            </p>
            <p className="text-sm text-zinc-500 mb-6">
              You will need to verify this server again on your next connection.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRemoveConfirm(false);
                  setHostToRemove(null);
                }}
                className="px-4 py-2 bg-zinc-800 text-gray-300 rounded hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemoveHost}
                className="px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 rounded-lg border border-red-500/50 p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-200">Clear All Host Keys?</h3>
            </div>
            <p className="text-zinc-400 mb-6">
              This will remove all saved host keys. You will need to verify each server again on your next connection.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 bg-zinc-800 text-gray-300 rounded hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Host Key Details Modal */}
      {showDetailsModal && selectedHost && (
        <HostKeyDetailsModal
          host={selectedHost}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedHost(null);
          }}
        />
      )}
    </div>
  );
}

interface HostKeyDetailsModalProps {
  host: HostKey;
  onClose: () => void;
}

function HostKeyDetailsModal({ host, onClose }: HostKeyDetailsModalProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-200">Host Key Details</h3>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* Host Info */}
          <div>
            <label className="block text-sm text-zinc-500 mb-1">Host</label>
            <div className="text-gray-200 font-mono">
              {host.host}:{host.port}
            </div>
          </div>

          {/* Key Type */}
          <div>
            <label className="block text-sm text-zinc-500 mb-1">Key Type</label>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-zinc-800 text-cyan-400 rounded font-mono">
                {host.keyType}
              </span>
              <span className="text-zinc-600">({host.algorithm})</span>
            </div>
          </div>

          {/* SHA-256 Fingerprint */}
          <div>
            <label className="block text-sm text-zinc-500 mb-1">SHA-256 Fingerprint</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 p-3 bg-zinc-800 rounded font-mono text-sm text-gray-200 break-all">
                {host.fingerprint}
              </div>
              <button
                onClick={() => copyToClipboard(host.fingerprint, 'sha256')}
                className="px-3 py-2 bg-zinc-800 text-cyan-400 rounded hover:bg-zinc-700"
              >
                {copied === 'sha256' ? '✓' : 'Copy'}
              </button>
            </div>
          </div>

          {/* MD5 Fingerprint */}
          {host.fingerprintMD5 && (
            <div>
              <label className="block text-sm text-zinc-500 mb-1">MD5 Fingerprint (Legacy)</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 p-3 bg-zinc-800 rounded font-mono text-sm text-gray-200">
                  {host.fingerprintMD5}
                </div>
                <button
                  onClick={() => copyToClipboard(host.fingerprintMD5!, 'md5')}
                  className="px-3 py-2 bg-zinc-800 text-cyan-400 rounded hover:bg-zinc-700"
                >
                  {copied === 'md5' ? '✓' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-500 mb-1">First Seen</label>
              <div className="text-gray-200">
                {new Date(host.addedAt).toLocaleString()}
              </div>
            </div>
            <div>
              <label className="block text-sm text-zinc-500 mb-1">Last Seen</label>
              <div className="text-gray-200">
                {new Date(host.lastSeenAt).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
