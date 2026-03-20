import { APP_NAME } from '@flowbase/shared';

const HomePage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F5F5]">
      <div className="rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-[#007AFF]">{APP_NAME}</h1>
        <p className="mt-2 text-sm text-gray-500">AI-powered whiteboard</p>
      </div>
    </div>
  );
};

export default HomePage;
