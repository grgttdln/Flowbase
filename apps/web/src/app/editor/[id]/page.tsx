'use client';

import dynamic from 'next/dynamic';

const CanvasEditor = dynamic(() => import('@/components/canvas/CanvasEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <p className="text-gray-400">Loading canvas...</p>
    </div>
  ),
});

const EditorPage = () => {
  return <CanvasEditor />;
};

export default EditorPage;
