'use client';

import { useEffect } from 'react';
import Link from 'next/link';

const EditorError = ({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) => {
  useEffect(() => {
    console.error('Editor error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4 text-center">
        <h2 className="text-lg font-semibold text-[#1C1917]">Something went wrong</h2>
        <p className="max-w-sm text-sm text-[#78716C]">{error.message}</p>
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="rounded-full bg-[#1C1917] px-5 py-2 text-sm font-medium text-white hover:bg-[#292524]"
          >
            Try again
          </button>
          <Link
            href="/projects"
            className="rounded-full px-5 py-2 text-sm font-medium text-[#57534E] ring-1 ring-[#E7E5E4] hover:bg-[#F5F5F4]"
          >
            Back to projects
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EditorError;
