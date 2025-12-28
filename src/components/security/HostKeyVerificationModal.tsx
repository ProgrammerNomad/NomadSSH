import React, { useState } from 'react';
import { ShieldAlert, Copy, Check } from 'lucide-react';

interface HostKeyVerificationModalProps {
  isOpen: boolean;
  host: string;
  port: number;
  fingerprint: string;
  fingerprintMD5?: string;
  keyType: string;
  isChanged?: boolean;
  oldFingerprint?: string;
  onAccept: () => void;
  onReject: () => void;
}

export const HostKeyVerificationModal: React.FC<HostKeyVerificationModalProps> = ({
  isOpen,
  host,
  port,
  fingerprint,
  fingerprintMD5,
  keyType,
  isChanged = false,
  oldFingerprint,
  onAccept,
  onReject,
}) => {
  const [copied, setCopied] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);

  if (!isOpen) return null;

  const handleCopyFingerprint = () => {
    navigator.clipboard.writeText(fingerprint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAccept = () => {
    if (isChanged && !confirmChecked) {
      return;
    }
    onAccept();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-zinc-700 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-200">
            {isChanged ? '🚨 WARNING: HOST KEY CHANGED' : '⚠️ Unknown Host Key'}
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Critical Warning for Changed Keys */}
          {isChanged && (
            <div className="bg-red-500/10 border border-red-500 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-red-400 mb-1">
                    POSSIBLE MAN-IN-THE-MIDDLE ATTACK!
                  </h4>
                  <p className="text-sm text-red-300/90">
                    Someone may be intercepting your connection. Only proceed if you
                    know the server was reinstalled or reconfigured.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Host Information */}
          <div className="space-y-2">
            {!isChanged && (
              <p className="text-gray-300">
                The authenticity of host <span className="font-mono text-cyan-400">{host}:{port}</span>{' '}
                cannot be established.
              </p>
            )}
            {isChanged && (
              <p className="text-gray-300">
                The host key for <span className="font-mono text-cyan-400">{host}:{port}</span>{' '}
                has changed since your last connection.
              </p>
            )}
          </div>

          {/* Key Type */}
          <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              Key Type
            </div>
            <div className="font-mono text-sm text-gray-200">{keyType}</div>
          </div>

          {/* Old Fingerprint */}
          {isChanged && oldFingerprint && (
            <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                Old Fingerprint
              </div>
              <div className="font-mono text-xs text-gray-400 break-all">
                {oldFingerprint}
              </div>
            </div>
          )}

          {/* Current Fingerprint */}
          <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-gray-400 uppercase tracking-wide">
                {isChanged ? 'New Fingerprint (SHA-256)' : 'SHA-256 Fingerprint'}
              </div>
              <button
                onClick={handleCopyFingerprint}
                className="flex items-center gap-1 px-2 py-1 text-xs text-cyan-400 hover:text-cyan-300 hover:bg-zinc-700/50 rounded transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <div className="font-mono text-xs text-gray-200 break-all">
              {fingerprint}
            </div>
          </div>

          {/* MD5 Fingerprint */}
          {fingerprintMD5 && (
            <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                MD5 Fingerprint (Legacy)
              </div>
              <div className="font-mono text-xs text-gray-300 break-all">
                {fingerprintMD5}
              </div>
            </div>
          )}

          {/* Confirmation Checkbox for Changed Keys */}
          {isChanged && (
            <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmChecked}
                  onChange={(e) => setConfirmChecked(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-zinc-600 bg-zinc-700 text-cyan-500 focus:ring-2 focus:ring-cyan-500/40"
                />
                <span className="text-sm text-gray-300">
                  I understand the risk and want to accept this new host key
                </span>
              </label>
            </div>
          )}

          {/* Question */}
          {!isChanged && (
            <p className="text-gray-300 text-sm">
              Are you sure you want to continue connecting?
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onReject}
              className="min-w-[100px] px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-gray-200 rounded-lg transition-colors"
            >
              {isChanged ? 'Cancel' : 'Reject'}
            </button>
            <button
              onClick={handleAccept}
              disabled={isChanged && !confirmChecked}
              className={`min-w-[100px] px-4 py-2 rounded-lg transition-colors font-medium ${
                isChanged
                  ? 'bg-red-500 hover:bg-red-600 disabled:bg-red-500/30 disabled:cursor-not-allowed text-white'
                  : 'bg-cyan-500 hover:bg-cyan-600 text-white'
              }`}
            >
              {isChanged ? 'Accept New Key' : 'Accept & Connect'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
