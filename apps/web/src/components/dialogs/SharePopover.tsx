'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Copy, X } from 'lucide-react';
import { useCollaboration, useRemoteUsers } from '@flowbase/canvas';
import { generateRoomId } from '@/lib/roomId';

const COLLAB_SERVER_URL = process.env.NEXT_PUBLIC_COLLAB_URL || 'ws://localhost:4444';
const COLLAB_HTTP_URL = COLLAB_SERVER_URL.replace(/^ws(s?)/, 'http$1');

interface SharePopoverProps {
  onClose: () => void;
}

export default function SharePopover({ onClose }: SharePopoverProps) {
  const { isCollaborating, roomId, status, awareness, startCollaboration, stopCollaboration } =
    useCollaboration();
  const remoteUsers = useRemoteUsers(awareness);
  const [copied, setCopied] = useState(false);
  const [confirmStop, setConfirmStop] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Start sharing on first open if not already sharing
  useEffect(() => {
    if (!isCollaborating && !roomId) {
      const id = generateRoomId();
      startCollaboration(id, true);
    }
  }, [isCollaborating, roomId, startCollaboration]);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  const shareLink = roomId ? `${window.location.origin}/collab/${roomId}` : '';

  const handleCopy = useCallback(async () => {
    if (!shareLink) return;
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shareLink]);

  const handleStopSharing = useCallback(async () => {
    if (!confirmStop) {
      setConfirmStop(true);
      return;
    }
    // Tell server to close room
    if (roomId) {
      try {
        await fetch(`${COLLAB_HTTP_URL}/rooms/${roomId}`, { method: 'DELETE' });
      } catch {
        // Best effort — local cleanup proceeds regardless
      }
    }
    stopCollaboration();
    onClose();
  }, [confirmStop, roomId, stopCollaboration, onClose]);

  return (
    <div
      ref={popoverRef}
      className="w-72 rounded-2xl bg-white p-5 shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#18181b]">Share Project</h3>
        <button
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded-md text-[#a1a1aa] transition-colors hover:bg-black/5 hover:text-[#555]"
        >
          <X size={14} />
        </button>
      </div>

      {/* Share link */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex-1 truncate rounded-lg bg-[#fafafa] px-3 py-2 font-mono text-xs text-[#52525b]">
          {shareLink || 'Generating...'}
        </div>
        <button
          onClick={handleCopy}
          disabled={!shareLink}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-[#fafafa] disabled:opacity-40"
        >
          {copied ? (
            <Check size={14} className="text-emerald-500" />
          ) : (
            <Copy size={14} className="text-[#a1a1aa]" />
          )}
        </button>
      </div>

      {/* Connection status */}
      <div className="mb-3">
        <div className="mb-2 flex items-center gap-2 text-xs text-[#a1a1aa]">
          <div
            className={`h-1.5 w-1.5 rounded-full ${
              status === 'connected'
                ? 'bg-emerald-500'
                : status === 'connecting'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-red-400'
            }`}
          />
          <span>
            {status === 'connected'
              ? `Connected (${remoteUsers.length + 1})`
              : status === 'connecting'
                ? 'Connecting...'
                : 'Disconnected'}
          </span>
        </div>

        {/* Collaborator list */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 rounded-lg px-2 py-1 text-xs text-[#52525b]">
            <div className="h-2 w-2 rounded-full bg-[#7c3aed]" />
            <span className="font-medium">You (Owner)</span>
          </div>
          {remoteUsers.map((user) => (
            <div
              key={user.clientId}
              className="flex items-center gap-2 rounded-lg px-2 py-1 text-xs text-[#52525b]"
            >
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: user.color }}
              />
              <span>{user.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stop sharing */}
      <button
        onClick={handleStopSharing}
        className={`w-full rounded-xl py-2 text-sm font-medium transition-colors ${
          confirmStop
            ? 'bg-red-500 text-white hover:bg-red-600'
            : 'text-red-500 hover:bg-red-50'
        }`}
      >
        {confirmStop ? 'Confirm — Stop Sharing' : 'Stop Sharing'}
      </button>
    </div>
  );
}
