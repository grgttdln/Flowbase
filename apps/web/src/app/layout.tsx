import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Flowbase',
  description: 'AI-powered whiteboard',
};

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
};

export default RootLayout;
