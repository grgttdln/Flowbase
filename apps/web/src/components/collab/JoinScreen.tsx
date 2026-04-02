'use client';

interface JoinScreenProps {
  status: 'connecting' | 'connected' | 'error';
  error?: string;
}

export default function JoinScreen({ status, error }: JoinScreenProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4 text-center">
        {/* Logo */}
        <div className="mb-2 text-2xl font-bold tracking-tight text-[#18181b]">
          Flowbase
        </div>

        {status === 'error' ? (
          <>
            <p className="text-sm text-red-500">
              {error || "This session doesn't exist or has ended."}
            </p>
            <a
              href="/"
              className="mt-2 rounded-xl bg-[#18181b] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#27272a]"
            >
              Go to Flowbase
            </a>
          </>
        ) : (
          <>
            {/* Spinner */}
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#7c3aed] border-t-transparent" />
            <p className="text-sm text-[#a1a1aa]">
              {status === 'connecting'
                ? 'Joining collaborative session...'
                : 'Loading canvas...'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
