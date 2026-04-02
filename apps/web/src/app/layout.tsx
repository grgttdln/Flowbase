import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';
import '@/styles/globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
});

export const metadata: Metadata = {
  title: 'Flowbase',
  description: 'AI-powered whiteboard',
};

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} antialiased`}>{children}</body>
    </html>
  );
};

export default RootLayout;
