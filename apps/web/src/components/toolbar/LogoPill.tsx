'use client';

import Link from 'next/link';
import FloatingPill from '../ui/FloatingPill';

interface LogoPillProps {
  href?: string;
  onBeforeNavigate?: () => void;
}

const LogoPill = ({ href, onBeforeNavigate }: LogoPillProps) => {
  const content = (
    <FloatingPill className="px-3 py-2">
      <span className="text-[15px] font-bold text-[#007AFF]">Flowbase</span>
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
