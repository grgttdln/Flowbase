'use client';

import dynamic from 'next/dynamic';

const ProjectList = dynamic(() => import('@/components/home/ProjectList'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[100dvh] items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-5">
        <div className="relative flex h-12 w-12 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-2xl bg-[#7c3aed]/[0.06]" style={{ animationDuration: '2s' }} />
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5f3ff] ring-1 ring-[#7c3aed]/[0.08]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse" style={{ animationDuration: '1.5s' }}>
              <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
            </svg>
          </div>
        </div>
        <div className="h-1 w-16 overflow-hidden rounded-full bg-[#F5F5F4]">
          <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-transparent via-[#7c3aed]/40 to-transparent animate-[loading-shimmer_1.2s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  ),
});

const ProjectsPage = () => {
  return <ProjectList />;
};

export default ProjectsPage;
