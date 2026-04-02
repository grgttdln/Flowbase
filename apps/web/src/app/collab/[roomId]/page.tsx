'use client';

import { use, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { CollaborationProvider, useCollaboration } from '@flowbase/canvas';

const CanvasEditor = dynamic(() => import('@/components/canvas/CanvasEditor'), {
  ssr: false,
});

const JoinScreen = dynamic(() => import('@/components/collab/JoinScreen'), {
  ssr: false,
});

const SessionEndedScreen = dynamic(() => import('@/components/collab/SessionEndedScreen'), {
  ssr: false,
});

const COLLAB_SERVER_URL = process.env.NEXT_PUBLIC_COLLAB_URL || 'ws://localhost:4444';
const COLLAB_HTTP_URL = COLLAB_SERVER_URL.replace(/^ws(s?)/, 'http$1');

type CollabState = 'joining' | 'connected' | 'ended' | 'error';

function CollabInner({ roomId }: { roomId: string }) {
  const { isCollaborating, status, sessionEnded } = useCollaboration();
  const [collabState, setCollabState] = useState<CollabState>('joining');
  const [error, setError] = useState<string>();

  // Check room existence on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${COLLAB_HTTP_URL}/rooms/${roomId}`);
        if (!res.ok && !cancelled) {
          setCollabState('error');
          setError("This session doesn't exist or has ended.");
        }
      } catch {
        // Server unreachable — let WebSocket attempt handle it
      }
    })();
    return () => { cancelled = true; };
  }, [roomId]);

  // Track connection state
  useEffect(() => {
    if (sessionEnded) {
      setCollabState('ended');
    } else if (isCollaborating) {
      setCollabState('connected');
    } else if (status === 'connecting') {
      setCollabState('joining');
    }
  }, [isCollaborating, status, sessionEnded]);

  if (collabState === 'ended') {
    return <SessionEndedScreen />;
  }

  if (collabState === 'error') {
    return <JoinScreen status="error" error={error} />;
  }

  if (collabState === 'joining') {
    return <JoinScreen status={status === 'connecting' ? 'connecting' : 'connected'} />;
  }

  // connected
  return <CanvasEditor projectName="Shared Canvas" />;
}

export default function CollabPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);

  return (
    <CollaborationProvider roomId={roomId} isOwner={false}>
      <CollabInner roomId={roomId} />
    </CollaborationProvider>
  );
}
