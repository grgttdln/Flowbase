'use client';

import Link from 'next/link';
import { exportFlowbase } from '@/lib/export';

interface SessionEndedScreenProps {
  projectName?: string;
}

export default function SessionEndedScreen({ projectName }: SessionEndedScreenProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white">
      <div className="flex w-80 flex-col items-center gap-4 text-center">
        <h1 className="text-lg font-semibold text-[#18181b]">Session Ended</h1>
        <p className="text-sm text-[#a1a1aa]">
          The owner has stopped sharing this project.
        </p>

        <div className="mt-2 flex w-full flex-col gap-2">
          <button
            onClick={() => exportFlowbase(projectName || 'Shared Canvas')}
            className="w-full rounded-xl bg-[#18181b] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#27272a]"
          >
            Export a Copy (.flowbase)
          </button>
          <Link
            href="/"
            className="w-full rounded-xl px-6 py-2.5 text-sm text-[#a1a1aa] transition-colors hover:bg-[#fafafa]"
          >
            Go to Flowbase
          </Link>
        </div>
      </div>
    </div>
  );
}
