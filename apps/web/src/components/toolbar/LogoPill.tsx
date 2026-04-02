'use client';

import Image from 'next/image';
import Link from 'next/link';
import FloatingPill from '../ui/FloatingPill';

interface LogoPillProps {
  href?: string;
  onBeforeNavigate?: () => void;
}

const LogoPill = ({ href, onBeforeNavigate }: LogoPillProps) => {
  const content = (
    <FloatingPill className="flex items-center px-2.5 py-2">
      <Image src="/logo.png" alt="Flowbase" width={20} height={20} />
    </FloatingPill>
  );

  if (href) {
    return (
      <Link href={href} onClick={onBeforeNavigate}>
        {content}
      </Link>
    );
  }

  return content;
};

export default LogoPill;
