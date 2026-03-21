'use client';

import dynamic from 'next/dynamic';

const ProjectList = dynamic(() => import('@/components/home/ProjectList'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F5F5]">
      <p className="text-sm text-[#999999]">Loading...</p>
    </div>
  ),
});

const HomePage = () => {
  return <ProjectList />;
};

export default HomePage;
