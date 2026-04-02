import Link from 'next/link';

const NotFound = () => {
  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-white px-4">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[600px] rounded-full bg-[#7c3aed]/[0.03] blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 bottom-1/4 h-[300px] w-[300px] rounded-full bg-[#0891b2]/[0.03] blur-[100px]" />

      <div className="relative flex max-w-lg flex-col items-start">
        {/* Big 404 — left-aligned, asymmetric */}
        <div className="relative">
          <span className="text-[clamp(6rem,20vw,11rem)] font-bold leading-none tracking-tighter text-[#F0EFED]">
            404
          </span>
          {/* Floating node illustration overlapping the number */}
          <div className="absolute -right-4 bottom-2 flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 shadow-[0_4px_24px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04] md:-right-12">
            <div className="h-2 w-2 rounded-full bg-[#7c3aed]" />
            <span className="text-[11px] font-semibold text-[#7c3aed]">Lost node</span>
          </div>
        </div>

        <h1 className="mt-2 text-[clamp(1.5rem,4vw,2.25rem)] font-bold tracking-tight text-[#1C1917]">
          This page drifted off the canvas
        </h1>
        <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-[#78716C]">
          The page you are looking for does not exist or may have been moved. Head back to your projects or start fresh.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/projects"
            className="group inline-flex items-center gap-2.5 rounded-full bg-[#1C1917] px-6 py-3 text-[14px] font-medium text-white transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#292524] active:scale-[0.97]"
          >
            Go to projects
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.12] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-105">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17L17 7" />
                <path d="M7 7h10v10" />
              </svg>
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-[14px] font-medium text-[#57534E] ring-1 ring-[#E7E5E4] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#F5F5F4] hover:text-[#1C1917] active:scale-[0.97]"
          >
            Back to home
          </Link>
        </div>
      </div>

      {/* Decorative disconnected flow — bottom right */}
      <div className="pointer-events-none absolute bottom-12 right-8 hidden opacity-[0.35] md:block lg:right-16">
        <svg width="200" height="120" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Nodes */}
          <rect x="0" y="10" width="52" height="26" rx="8" fill="#f5f3ff" stroke="#ddd6fe" strokeWidth="1" />
          <text x="26" y="27" textAnchor="middle" fontSize="9" fontWeight="500" fontFamily="system-ui" fill="#7c3aed">Start</text>

          <rect x="80" y="10" width="52" height="26" rx="8" fill="white" stroke="#E7E5E4" strokeWidth="1" />
          <text x="106" y="27" textAnchor="middle" fontSize="9" fontWeight="500" fontFamily="system-ui" fill="#78716C">Step 2</text>

          {/* Disconnected node — drifting away */}
          <rect x="148" y="70" width="48" height="26" rx="8" fill="white" stroke="#E7E5E4" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
          <text x="172" y="87" textAnchor="middle" fontSize="9" fontWeight="500" fontFamily="system-ui" fill="#A8A29E">???</text>

          {/* Solid connection */}
          <line x1="52" y1="23" x2="80" y2="23" stroke="#ddd6fe" strokeWidth="1.2" />
          {/* Broken connection — dashed */}
          <path d="M132 23 Q150 23 155 45 Q160 67 148 76" stroke="#E7E5E4" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
        </svg>
      </div>
    </div>
  );
};

export default NotFound;
