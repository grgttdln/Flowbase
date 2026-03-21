'use client';

import { use } from 'react';
import dynamic from 'next/dynamic';

const EditorLoader = dynamic(() => import('@/components/canvas/EditorLoader'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <p className="text-gray-400">Loading canvas...</p>
    </div>
  ),
});

const EditorPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  return <EditorLoader projectId={id} />;
};

export default EditorPage;
