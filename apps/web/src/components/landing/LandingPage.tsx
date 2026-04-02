'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowUpRight,
  Infinity,
  GripVertical,
  Users,
  LayoutTemplate,
  Sparkles,
  Check,
  X,
  Minus,
  Quote,
  Network,
  GitBranch,
  Lightbulb,
  Menu,
  Workflow,
} from 'lucide-react';

/* ─── Scroll Reveal (with blur) ─── */
const ScrollReveal = ({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(e.target); } },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-[transform,opacity,filter] duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
        visible
          ? 'translate-y-0 opacity-100 blur-0'
          : 'translate-y-8 opacity-0 blur-[4px]'
      } ${className}`}
    >
      {children}
    </div>
  );
};

/* ─── Pill Badge ─── */
const Pill = ({ children }: { children: ReactNode }) => (
  <span className="inline-block rounded-full bg-[#7c3aed]/[0.08] px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7c3aed]">
    {children}
  </span>
);

/* ─── Button ─── */
const PrimaryButton = ({ children, href, large }: { children: ReactNode; href: string; large?: boolean }) => (
  <Link
    href={href}
    className={`group inline-flex items-center gap-2.5 rounded-full bg-[#1C1917] text-white font-medium transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#292524] active:scale-[0.97] ${
      large ? 'px-7 py-3.5 text-[15px]' : 'px-5 py-2.5 text-[13px]'
    }`}
  >
    {children}
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.12] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-105">
      <ArrowUpRight size={13} strokeWidth={2} />
    </span>
  </Link>
);

const SecondaryButton = ({ children, href }: { children: ReactNode; href: string }) => (
  <Link
    href={href}
    className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-medium text-[#44403C] ring-1 ring-[#ddd6fe] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#f5f3ff] hover:text-[#1C1917] active:scale-[0.97]"
  >
    {children}
  </Link>
);

/* ─── Bento Card (Double-Bezel) ─── */
const BentoCard = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`rounded-[1.5rem] bg-[#f5f3ff]/50 p-1.5 ring-1 ring-[#7c3aed]/[0.06] transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(124,58,237,0.08)] ${className}`}>
    <div className="h-full rounded-[calc(1.5rem-0.375rem)] bg-white p-7 shadow-[0_1px_3px_rgba(124,58,237,0.04)] ring-1 ring-[#7c3aed]/[0.04]">
      {children}
    </div>
  </div>
);

/* ─── Canvas Mockup ─── */
const CanvasPreview = () => (
  <div className="rounded-[2rem] bg-gradient-to-b from-[#ede9fe]/60 to-[#ddd6fe]/30 p-2 ring-1 ring-[#7c3aed]/[0.08] shadow-[0_24px_80px_rgba(124,58,237,0.08),0_8px_24px_rgba(0,0,0,0.04)]">
    <div className="overflow-hidden rounded-[calc(2rem-0.5rem)] bg-white ring-1 ring-[#7c3aed]/[0.06]">
      {/* Title bar */}
      <div className="flex items-center gap-2 border-b border-[#ede9fe] px-5 py-2.5">
        <div className="flex gap-1.5">
          <div className="h-[9px] w-[9px] rounded-full bg-[#FF605C]" />
          <div className="h-[9px] w-[9px] rounded-full bg-[#FFBD44]" />
          <div className="h-[9px] w-[9px] rounded-full bg-[#00CA4E]" />
        </div>
        <div className="ml-4 flex-1">
          <div className="mx-auto w-44 rounded-md bg-[#f5f3ff] px-3 py-1 text-center text-[10px] text-[#a78bfa]">flowbase.app/editor</div>
        </div>
      </div>
      {/* Canvas area */}
      <div className="relative h-[320px] bg-white md:h-[400px]" style={{ backgroundImage: 'radial-gradient(circle, #ddd6fe 0.6px, transparent 0.6px)', backgroundSize: '20px 20px' }}>

        {/* ── Fake toolbar (top center) ── */}
        <div className="absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-0.5 rounded-xl bg-white/90 px-2 py-1.5 shadow-[0_1px_4px_rgba(0,0,0,0.06),0_0_0_0.5px_rgba(0,0,0,0.04)] backdrop-blur-md">
          {/* Pointer */}
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#7c3aed]/10">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" /></svg>
          </div>
          <div className="mx-0.5 h-4 w-px bg-black/[0.06]" />
          {[0,1,2].map((i) => (
            <div key={i} className="flex h-6 w-6 items-center justify-center rounded-lg">
              <div className={`rounded-[3px] ${i === 0 ? 'h-[9px] w-[9px] border-[1.5px] border-[#a78bfa]' : i === 1 ? 'h-[9px] w-[9px] rounded-full border-[1.5px] border-[#a78bfa]' : 'h-[9px] w-[9px] rotate-45 border-[1.5px] border-[#a78bfa]'}`} />
            </div>
          ))}
          <div className="mx-0.5 h-4 w-px bg-black/[0.06]" />
          {[0,1].map((i) => (
            <div key={i} className="flex h-6 w-6 items-center justify-center rounded-lg">
              <div className={`${i === 0 ? 'h-[1.5px] w-[10px] bg-[#a78bfa]' : 'h-0 w-0 border-b-[1.5px] border-l-[1.5px] border-transparent border-b-[#71717a] border-l-transparent'}`} style={i === 1 ? { width: 10, height: 10, borderBottom: '1.5px solid #71717a', borderRight: '1.5px solid #71717a', transform: 'rotate(-45deg)', borderRadius: '0 0 2px 0' } : undefined} />
            </div>
          ))}
          <div className="mx-0.5 h-4 w-px bg-black/[0.06]" />
          <div className="flex h-6 w-6 items-center justify-center rounded-lg">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"><path d="M4 20h4L18.5 9.5a2.121 2.121 0 00-3-3L5 17v3" /></svg>
          </div>
          <div className="flex h-6 w-6 items-center justify-center rounded-lg">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.2" strokeLinecap="round"><path d="M17 10H3" /><path d="M21 6H3" /><path d="M21 14H3" /><path d="M17 18H3" /></svg>
          </div>
        </div>

        {/* ── Flow nodes ── */}
        {/* Row 1 */}
        <div className="absolute left-[6%] top-[22%] flex items-center gap-2 rounded-xl border border-[#ede9fe] bg-white px-4 py-2.5 text-[12px] font-semibold text-[#7c3aed] shadow-[0_1px_4px_rgba(124,58,237,0.08)] ring-1 ring-[#7c3aed]/20 md:left-[8%]">
          <div className="h-2 w-2 rounded-full bg-[#7c3aed]" />
          Start
        </div>

        <div className="absolute left-[28%] top-[22%] rounded-xl border border-[#ede9fe] bg-white px-4 py-2.5 text-[12px] font-medium text-[#5b21b6] shadow-[0_1px_3px_rgba(0,0,0,0.04)] md:left-[30%]">
          User Input
        </div>

        <div className="absolute left-[50%] top-[22%] rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-2.5 text-[12px] font-medium text-[#166534] shadow-[0_1px_3px_rgba(0,0,0,0.03)] md:left-[52%]">
          Validate
        </div>

        <div className="absolute right-[8%] top-[22%] rounded-xl border border-[#ede9fe] bg-white px-4 py-2.5 text-[12px] font-medium text-[#5b21b6] shadow-[0_1px_3px_rgba(0,0,0,0.04)] md:right-[10%]">
          Transform
        </div>

        {/* Row 2 */}
        <div className="absolute left-[18%] top-[50%] rounded-xl border border-[#ddd6fe] bg-[#f5f3ff] px-4 py-2.5 text-[12px] font-medium text-[#5b21b6] shadow-[0_1px_3px_rgba(0,0,0,0.03)] md:left-[22%]">
          Process
        </div>

        <div className="absolute left-[44%] top-[50%] rounded-xl border border-[#fed7aa] bg-[#fff7ed] px-4 py-2.5 text-[12px] font-medium text-[#9a3412] shadow-[0_1px_3px_rgba(0,0,0,0.03)] md:left-[46%]">
          Review
        </div>

        <div className="absolute right-[10%] top-[50%] rounded-xl border border-[#ede9fe] bg-white px-4 py-2.5 text-[12px] font-medium text-[#5b21b6] shadow-[0_1px_3px_rgba(0,0,0,0.04)] md:right-[12%]">
          Notify
        </div>

        {/* Row 3 */}
        <div className="absolute left-[32%] top-[76%] flex items-center gap-2 rounded-xl border border-[#7c3aed]/30 bg-[#7c3aed]/[0.05] px-4 py-2.5 text-[12px] font-semibold text-[#7c3aed] shadow-[0_2px_8px_rgba(124,58,237,0.08)] md:left-[36%]">
          Complete
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        </div>

        {/* ── Connection SVG ── */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <marker id="ah-v" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#7c3aed" opacity="0.55" />
            </marker>
            <marker id="ah-g" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#a78bfa" opacity="0.45" />
            </marker>
          </defs>
          {/* Start → User Input */}
          <line x1="15%" y1="28%" x2="28%" y2="28%" stroke="#7c3aed" strokeWidth="1.5" opacity="0.35" markerEnd="url(#ah-v)" />
          {/* User Input → Validate */}
          <line x1="40%" y1="28%" x2="50%" y2="28%" stroke="#a78bfa" strokeWidth="1.2" opacity="0.25" markerEnd="url(#ah-g)" />
          {/* Validate → Transform */}
          <line x1="62%" y1="28%" x2="72%" y2="28%" stroke="#a78bfa" strokeWidth="1.2" opacity="0.25" markerEnd="url(#ah-g)" />
          {/* User Input → Process */}
          <line x1="34%" y1="33%" x2="28%" y2="49%" stroke="#a78bfa" strokeWidth="1.2" opacity="0.3" markerEnd="url(#ah-v)" />
          {/* Validate → Review */}
          <line x1="58%" y1="33%" x2="52%" y2="49%" stroke="#d97706" strokeWidth="1.2" opacity="0.3" markerEnd="url(#ah-g)" />
          {/* Transform → Notify */}
          <line x1="82%" y1="33%" x2="82%" y2="49%" stroke="#a78bfa" strokeWidth="1.2" opacity="0.2" markerEnd="url(#ah-g)" />
          {/* Process → Complete */}
          <line x1="30%" y1="60%" x2="37%" y2="75%" stroke="#7c3aed" strokeWidth="1.2" opacity="0.3" markerEnd="url(#ah-v)" />
          {/* Review → Complete */}
          <line x1="52%" y1="60%" x2="45%" y2="75%" stroke="#7c3aed" strokeWidth="1.2" opacity="0.3" markerEnd="url(#ah-v)" />
        </svg>

        {/* ── Sticky note ── */}
        <div className="absolute right-[6%] top-[68%] w-[100px] rounded-[4px] bg-[#fef08a] p-2.5 text-[9px] leading-snug text-[#713f12] shadow-[1px_1px_4px_rgba(0,0,0,0.06)] md:right-[8%]">
          Remember to add error handling path
        </div>

        {/* ── Cursor ── */}
        <div className="landing-float absolute right-[22%] top-[38%] md:right-[26%]">
          <svg width="14" height="18" viewBox="0 0 16 20" fill="none"><path d="M1 1L1 14.5L5 10.5L9.5 19L12 18L7.5 9H14.5L1 1Z" fill="#7c3aed" stroke="white" strokeWidth="1.5" /></svg>
          <div className="ml-3.5 -mt-0.5 rounded-full bg-[#7c3aed] px-2 py-[2px] text-[9px] font-medium text-white shadow-[0_2px_6px_rgba(124,58,237,0.25)]">You</div>
        </div>

        {/* ── Zoom controls (bottom left) ── */}
        <div className="absolute bottom-3 left-3 flex items-center gap-0.5 rounded-lg bg-white/90 px-1.5 py-1 shadow-[0_1px_4px_rgba(0,0,0,0.06)] backdrop-blur-md ring-1 ring-black/[0.04]">
          <span className="px-1 text-[9px] font-medium text-[#a78bfa]">100%</span>
        </div>
      </div>
    </div>
  </div>
);

/* ═══════════════════════ NAVBAR ═══════════════════════ */
const Navbar = () => {
  const [open, setOpen] = useState(false);
  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Use cases', href: '#use-cases' },
    { label: 'Compare', href: '#compare' },
  ];

  return (
    <>
      <nav className="fixed left-0 right-0 top-0 z-40 flex justify-center px-4 pt-5 landing-nav-enter">
        <div className="flex items-center gap-1 rounded-full bg-white/75 py-2 pl-4 pr-2 shadow-[0_2px_24px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04] backdrop-blur-2xl md:gap-6 md:pl-5 md:pr-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-[15px] font-bold text-[#7c3aed]">
            <Image src="/logo.png" alt="Flowbase" width={28} height={28} />
            Flowbase
          </Link>

          {/* Desktop links */}
          <div className="hidden items-center gap-5 text-[13px] font-medium text-[#78716C] md:flex">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} className="transition-colors duration-300 hover:text-[#1C1917]">{l.label}</a>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:block">
            <PrimaryButton href="/projects">Start Building</PrimaryButton>
          </div>

          {/* Hamburger */}
          <button
            onClick={() => setOpen(!open)}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-black/[0.04] md:hidden"
            aria-label="Menu"
          >
            <Menu size={18} strokeWidth={1.8} className="text-[#1C1917]" />
          </button>
        </div>
      </nav>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white/95 backdrop-blur-3xl">
          <div className="flex items-center justify-between px-6 pt-6">
            <Link href="/" className="flex items-center gap-2 text-[15px] font-bold text-[#7c3aed]">
              <Image src="/logo.png" alt="Flowbase" width={28} height={28} />
              Flowbase
            </Link>
            <button onClick={() => setOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/[0.04]" aria-label="Close">
              <X size={18} strokeWidth={1.8} />
            </button>
          </div>
          <div className="flex flex-1 flex-col items-start justify-center gap-6 px-10">
            {navLinks.map((l, i) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                style={{ animationDelay: `${100 + i * 60}ms` }}
                className="landing-menu-enter text-[32px] font-semibold tracking-tight text-[#1C1917]"
              >
                {l.label}
              </a>
            ))}
            <div className="landing-menu-enter mt-4" style={{ animationDelay: '380ms' }}>
              <PrimaryButton href="/projects" large>Start Building</PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/* ═══════════════════════ HERO ═══════════════════════ */
const Hero = () => (
  <section className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-4 pt-28 pb-16 md:pt-32">
    {/* Soft radial glows */}
    <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-[#7c3aed]/[0.04] blur-[120px]" />
    <div className="pointer-events-none absolute -right-40 top-1/3 h-[400px] w-[400px] rounded-full bg-[#0891b2]/[0.03] blur-[100px]" />
    <div className="pointer-events-none absolute -left-40 top-2/3 h-[400px] w-[400px] rounded-full bg-[#d97706]/[0.03] blur-[100px]" />


    <div className="flex flex-col items-center text-center">
      <div className="landing-enter landing-stagger-1">
        <Pill>Visual thinking, reimagined</Pill>
      </div>
      <h1 className="landing-enter landing-stagger-2 mt-6 max-w-3xl text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-[1.05] tracking-tight text-[#1C1917]">
        The infinite canvas for{' '}
        <span className="bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] bg-clip-text text-transparent">your best ideas</span>
      </h1>
      <p className="landing-enter landing-stagger-3 mt-5 max-w-lg text-[17px] leading-relaxed text-[#78716C]">
        Create beautiful flowcharts, diagrams, and visual workflows in seconds.
        Fast, intuitive, and built for teams who think visually.
      </p>
      <div className="landing-enter landing-stagger-4 mt-8 flex flex-wrap items-center justify-center gap-3">
        <PrimaryButton href="/projects" large>Start Building Flows</PrimaryButton>
        <SecondaryButton href="#how-it-works">See how it works</SecondaryButton>
      </div>
    </div>

    <div className="landing-scale-enter landing-stagger-5 mt-16 w-full max-w-4xl">
      <CanvasPreview />
    </div>
  </section>
);

/* ═══════════════════════ FEATURES BENTO ═══════════════════════ */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const features = [
  { icon: Infinity, title: 'Infinite canvas', desc: 'Zoom, pan, and build without boundaries. Your canvas grows with your thinking.', span: 'md:col-span-7 md:row-span-2', color: 'text-[#7c3aed]', bg: 'bg-[#7c3aed]/[0.08]' },
  { icon: GripVertical, title: 'Drag & drop', desc: 'Grab nodes, place them anywhere. Connect ideas with a single click.', span: 'md:col-span-5', color: 'text-[#0891b2]', bg: 'bg-[#0891b2]/[0.08]' },
  { icon: Users, title: 'Real-time collaboration', desc: 'Work together live. See cursors, edits, and comments as they happen.', span: 'md:col-span-5', color: 'text-[#059669]', bg: 'bg-[#059669]/[0.08]' },
  { icon: LayoutTemplate, title: 'Pre-built templates', desc: 'Start fast with ready-made templates for every kind of workflow.', span: 'md:col-span-6', color: 'text-[#d97706]', bg: 'bg-[#d97706]/[0.08]' },
  { icon: Sparkles, title: 'Clean & minimal', desc: 'No clutter, no learning curve. Just your ideas, beautifully organized.', span: 'md:col-span-6', color: 'text-[#e11d48]', bg: 'bg-[#e11d48]/[0.08]' },
];

const Features = () => (
  <section id="features" className="relative scroll-mt-20 overflow-hidden px-4 py-28 md:py-36">
    {/* Decorative accents */}
    <div className="pointer-events-none absolute -left-20 top-1/4 h-[300px] w-[300px] rounded-full bg-[#7c3aed]/[0.03] blur-[80px]" />
    <div className="pointer-events-none absolute -right-20 bottom-1/4 h-[250px] w-[250px] rounded-full bg-[#0891b2]/[0.03] blur-[80px]" />
    <div className="mx-auto max-w-5xl">
      <ScrollReveal className="text-center">
        <Pill>Features</Pill>
        <h2 className="mt-5 text-[clamp(1.8rem,4vw,3rem)] font-bold tracking-tight text-[#1C1917]">
          Everything you need, nothing you don&apos;t
        </h2>
        <p className="mx-auto mt-4 max-w-md text-[16px] leading-relaxed text-[#78716C]">
          Built from the ground up for speed and simplicity.
        </p>
      </ScrollReveal>

      <div className="mt-14 grid grid-cols-1 gap-3 md:grid-cols-12">
        {/* ── Infinite canvas (hero card) ── */}
        <ScrollReveal delay={0} className="md:col-span-7 md:row-span-2">
          <div className="h-full rounded-[1.5rem] bg-[#f5f3ff]/50 p-1.5 ring-1 ring-[#7c3aed]/[0.06] transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(124,58,237,0.08)]">
            <div className="flex h-full flex-col rounded-[calc(1.5rem-0.375rem)] bg-white shadow-[0_1px_3px_rgba(124,58,237,0.04)] ring-1 ring-[#7c3aed]/[0.04]">
              {/* Mini canvas illustration — all coordinates inside a fixed viewBox for perfect alignment */}
              <div className="relative mx-5 mt-5 flex-1 overflow-hidden rounded-xl bg-[#faf5ff]/60" style={{ backgroundImage: 'radial-gradient(circle, #ddd6fe 0.6px, transparent 0.6px)', backgroundSize: '14px 14px', minHeight: 140 }}>
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 160" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <marker id="fc-v" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 1.5L7 4L0 6.5z" fill="#a78bfa" /></marker>
                    <marker id="fc-g" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 1.5L7 4L0 6.5z" fill="#86efac" /></marker>
                    <marker id="fc-o" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 1.5L7 4L0 6.5z" fill="#fdba74" /></marker>
                  </defs>

                  {/* ── Connection lines (behind nodes) ── */}
                  <line x1="80" y1="44" x2="150" y2="44" stroke="#a78bfa" strokeWidth="1.2" opacity="0.5" markerEnd="url(#fc-v)" />
                  <line x1="218" y1="44" x2="282" y2="44" stroke="#86efac" strokeWidth="1.2" opacity="0.5" markerEnd="url(#fc-g)" />
                  <line x1="184" y1="58" x2="132" y2="100" stroke="#a78bfa" strokeWidth="1.2" opacity="0.35" markerEnd="url(#fc-v)" />
                  <line x1="164" y1="114" x2="250" y2="114" stroke="#fdba74" strokeWidth="1.2" opacity="0.45" markerEnd="url(#fc-o)" />

                  {/* ── Row 1 nodes ── */}
                  <rect x="24" y="30" width="56" height="28" rx="6" fill="#f5f3ff" stroke="#ddd6fe" strokeWidth="1" />
                  <text x="52" y="49" textAnchor="middle" fontSize="10" fontWeight="500" fontFamily="system-ui" fill="#7c3aed">Start</text>

                  <rect x="150" y="30" width="68" height="28" rx="6" fill="white" stroke="#ddd6fe" strokeWidth="1" />
                  <text x="184" y="49" textAnchor="middle" fontSize="10" fontWeight="500" fontFamily="system-ui" fill="#7c3aed">Process</text>

                  <rect x="282" y="30" width="56" height="28" rx="6" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="1" />
                  <text x="310" y="49" textAnchor="middle" fontSize="10" fontWeight="500" fontFamily="system-ui" fill="#166534">Done</text>

                  {/* ── Row 2 nodes ── */}
                  <rect x="100" y="100" width="64" height="28" rx="6" fill="#fff7ed" stroke="#fed7aa" strokeWidth="1" />
                  <text x="132" y="119" textAnchor="middle" fontSize="10" fontWeight="500" fontFamily="system-ui" fill="#9a3412">Review</text>

                  <rect x="250" y="100" width="64" height="28" rx="6" fill="white" stroke="#ddd6fe" strokeWidth="1" />
                  <text x="282" y="119" textAnchor="middle" fontSize="10" fontWeight="500" fontFamily="system-ui" fill="#7c3aed">Deploy</text>
                </svg>
              </div>
              <div className="p-7 pt-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7c3aed]/[0.08]">
                  <Infinity size={20} strokeWidth={1.7} className="text-[#7c3aed]" />
                </div>
                <h3 className="mt-4 text-[17px] font-semibold text-[#1C1917]">Infinite canvas</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-[#78716C]">Zoom, pan, and build without boundaries. Your canvas grows with your thinking.</p>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* ── Drag & drop ── */}
        <ScrollReveal delay={80} className="md:col-span-5">
          <div className="rounded-[1.5rem] bg-[#f5f3ff]/50 p-1.5 ring-1 ring-[#7c3aed]/[0.06] transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(124,58,237,0.08)]">
            <div className="rounded-[calc(1.5rem-0.375rem)] bg-white shadow-[0_1px_3px_rgba(124,58,237,0.04)] ring-1 ring-[#7c3aed]/[0.04]">
              {/* Drag illustration */}
              <div className="relative mx-5 mt-5 flex h-24 items-center justify-center overflow-hidden rounded-xl bg-[#ecfeff]/60">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg border border-[#ddd6fe] bg-white px-3 py-1.5 text-[10px] font-medium text-[#44403C] shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-transform" style={{ transform: 'rotate(-2deg)' }}>Node A</div>
                  <svg width="24" height="12" viewBox="0 0 24 12" fill="none"><path d="M2 6h16m0 0l-4-4m4 4l-4 4" stroke="#0891b2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" /></svg>
                  <div className="rounded-lg border border-dashed border-[#0891b2]/30 bg-[#ecfeff] px-3 py-1.5 text-[10px] font-medium text-[#0891b2]">Drop here</div>
                </div>
                {/* Cursor */}
                <div className="absolute bottom-2 right-6">
                  <svg width="12" height="15" viewBox="0 0 16 20" fill="none"><path d="M1 1L1 14.5L5 10.5L9.5 19L12 18L7.5 9H14.5L1 1Z" fill="#0891b2" stroke="white" strokeWidth="1.5" /></svg>
                </div>
              </div>
              <div className="p-7 pt-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0891b2]/[0.08]">
                  <GripVertical size={20} strokeWidth={1.7} className="text-[#0891b2]" />
                </div>
                <h3 className="mt-4 text-[17px] font-semibold text-[#1C1917]">Drag & drop</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-[#78716C]">Grab nodes, place them anywhere. Connect ideas with a single click.</p>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* ── Real-time collaboration ── */}
        <ScrollReveal delay={160} className="md:col-span-5">
          <div className="rounded-[1.5rem] bg-[#f5f3ff]/50 p-1.5 ring-1 ring-[#7c3aed]/[0.06] transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(124,58,237,0.08)]">
            <div className="rounded-[calc(1.5rem-0.375rem)] bg-white shadow-[0_1px_3px_rgba(124,58,237,0.04)] ring-1 ring-[#7c3aed]/[0.04]">
              {/* Collab illustration — overlapping cursors */}
              <div className="relative mx-5 mt-5 flex h-24 items-center justify-center overflow-hidden rounded-xl bg-[#ecfdf5]/60">
                <div className="flex -space-x-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7c3aed] text-[11px] font-semibold text-white ring-2 ring-white">M</div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0891b2] text-[11px] font-semibold text-white ring-2 ring-white">A</div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#059669] text-[11px] font-semibold text-white ring-2 ring-white">L</div>
                </div>
                {/* Cursors */}
                <div className="absolute left-[20%] top-[25%] landing-drift">
                  <svg width="10" height="13" viewBox="0 0 16 20" fill="none"><path d="M1 1L1 14.5L5 10.5L9.5 19L12 18L7.5 9H14.5L1 1Z" fill="#7c3aed" stroke="white" strokeWidth="1.5" /></svg>
                </div>
                <div className="absolute right-[22%] top-[30%] landing-drift" style={{ animationDelay: '1.5s' }}>
                  <svg width="10" height="13" viewBox="0 0 16 20" fill="none"><path d="M1 1L1 14.5L5 10.5L9.5 19L12 18L7.5 9H14.5L1 1Z" fill="#059669" stroke="white" strokeWidth="1.5" /></svg>
                </div>
                <div className="absolute bottom-[20%] left-[40%] landing-drift" style={{ animationDelay: '0.8s' }}>
                  <svg width="10" height="13" viewBox="0 0 16 20" fill="none"><path d="M1 1L1 14.5L5 10.5L9.5 19L12 18L7.5 9H14.5L1 1Z" fill="#0891b2" stroke="white" strokeWidth="1.5" /></svg>
                </div>
              </div>
              <div className="p-7 pt-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#059669]/[0.08]">
                  <Users size={20} strokeWidth={1.7} className="text-[#059669]" />
                </div>
                <h3 className="mt-4 text-[17px] font-semibold text-[#1C1917]">Real-time collaboration</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-[#78716C]">Work together live. See cursors, edits, and comments as they happen.</p>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* ── Pre-built templates ── */}
        <ScrollReveal delay={240} className="md:col-span-6">
          <div className="rounded-[1.5rem] bg-[#f5f3ff]/50 p-1.5 ring-1 ring-[#7c3aed]/[0.06] transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(124,58,237,0.08)]">
            <div className="rounded-[calc(1.5rem-0.375rem)] bg-white shadow-[0_1px_3px_rgba(124,58,237,0.04)] ring-1 ring-[#7c3aed]/[0.04]">
              {/* Template grid illustration */}
              <div className="mx-5 mt-5 grid grid-cols-3 gap-1.5 overflow-hidden rounded-xl bg-[#fffbeb]/60 p-3">
                {['Flowchart', 'Org chart', 'Mindmap', 'Wireframe', 'Kanban', 'Timeline'].map((t) => (
                  <div key={t} className="rounded-lg bg-white px-2 py-2 text-center text-[9px] font-medium text-[#78716C] shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.03]">
                    {t}
                  </div>
                ))}
              </div>
              <div className="p-7 pt-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d97706]/[0.08]">
                  <LayoutTemplate size={20} strokeWidth={1.7} className="text-[#d97706]" />
                </div>
                <h3 className="mt-4 text-[17px] font-semibold text-[#1C1917]">Pre-built templates</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-[#78716C]">Start fast with ready-made templates for every kind of workflow.</p>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* ── Clean & minimal ── */}
        <ScrollReveal delay={320} className="md:col-span-6">
          <div className="rounded-[1.5rem] bg-[#f5f3ff]/50 p-1.5 ring-1 ring-[#7c3aed]/[0.06] transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(124,58,237,0.08)]">
            <div className="rounded-[calc(1.5rem-0.375rem)] bg-white shadow-[0_1px_3px_rgba(124,58,237,0.04)] ring-1 ring-[#7c3aed]/[0.04]">
              {/* Minimal UI illustration */}
              <div className="relative mx-5 mt-5 flex h-24 items-center justify-center overflow-hidden rounded-xl bg-[#fff1f2]/40">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="h-1 w-10 rounded-full bg-[#7c3aed]/15" />
                    <div className="h-1 w-7 rounded-full bg-[#7c3aed]/[0.08]" />
                  </div>
                  <div className="h-10 w-px bg-[#ddd6fe]/60" />
                  <div className="flex gap-1.5">
                    <div className="h-6 w-6 rounded-md bg-white shadow-[0_1px_3px_rgba(124,58,237,0.06)] ring-1 ring-[#7c3aed]/[0.06]" />
                    <div className="h-6 w-6 rounded-md bg-white shadow-[0_1px_3px_rgba(124,58,237,0.06)] ring-1 ring-[#7c3aed]/[0.06]" />
                    <div className="h-6 w-6 rounded-md bg-[#e11d48]/10 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-[#e11d48]/10" />
                  </div>
                  <div className="h-10 w-px bg-[#ddd6fe]/60" />
                  <div className="rounded-full bg-[#1C1917] px-3 py-1 text-[8px] font-medium text-white">Export</div>
                </div>
              </div>
              <div className="p-7 pt-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e11d48]/[0.08]">
                  <Sparkles size={20} strokeWidth={1.7} className="text-[#e11d48]" />
                </div>
                <h3 className="mt-4 text-[17px] font-semibold text-[#1C1917]">Clean & minimal</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-[#78716C]">No clutter, no learning curve. Just your ideas, beautifully organized.</p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  </section>
);

/* ═══════════════════════ HOW IT WORKS ═══════════════════════ */
const steps = [
  { num: '01', title: 'Create', desc: 'Drop nodes onto the canvas and label your ideas. Pick from rectangles, circles, diamonds, or freehand shapes.', color: 'bg-[#7c3aed]' },
  { num: '02', title: 'Connect', desc: 'Draw connections between concepts with a single drag. Arrows snap to anchors and reroute automatically.', color: 'bg-[#0891b2]' },
  { num: '03', title: 'Collaborate', desc: 'Share your flow and build together in real time. Export to PNG, SVG, or share a live link.', color: 'bg-[#059669]' },
];

const HowItWorks = () => (
  <section id="how-it-works" className="relative scroll-mt-20 overflow-hidden bg-[#faf5ff]/50 px-4 py-28 md:py-40">
    <div className="mx-auto max-w-5xl">
      <div className="grid grid-cols-1 items-start gap-16 md:grid-cols-[1fr_1.2fr]">
        {/* Left — sticky heading */}
        <ScrollReveal className="md:sticky md:top-32">
          <Pill>How it works</Pill>
          <h2 className="mt-5 text-[clamp(1.8rem,4vw,3rem)] font-bold tracking-tight text-[#1C1917]">
            Three steps.<br />That&apos;s it.
          </h2>
          <p className="mt-4 max-w-sm text-[16px] leading-relaxed text-[#78716C]">
            No tutorials, no onboarding flows. Just open the canvas and start building.
          </p>
          <div className="mt-8">
            <PrimaryButton href="/projects">Try it now</PrimaryButton>
          </div>
        </ScrollReveal>

        {/* Right — vertical timeline */}
        <div className="relative flex flex-col gap-6">
          {/* Connecting line */}
          <div className="absolute bottom-8 left-5 top-8 hidden w-px bg-gradient-to-b from-[#7c3aed]/20 via-[#0891b2]/20 to-[#059669]/20 md:block" />

          {steps.map((s, i) => (
            <ScrollReveal key={s.num} delay={i * 120}>
              <div className="relative flex gap-5 rounded-[1.5rem] bg-white p-7 shadow-[0_1px_4px_rgba(124,58,237,0.04)] ring-1 ring-[#7c3aed]/[0.06] transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(124,58,237,0.06)]">
                <div className={`relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${s.color} text-[14px] font-bold text-white shadow-[0_2px_8px_rgba(0,0,0,0.1)]`}>
                  {s.num}
                </div>
                <div>
                  <h3 className="text-[18px] font-semibold text-[#1C1917]">{s.title}</h3>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-[#78716C]">{s.desc}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </div>
  </section>
);

/* ═══════════════════════ USE CASES ═══════════════════════ */
const useCases = [
  { icon: Workflow, title: 'UX Flows', desc: 'Map user journeys from first click to conversion.', color: 'text-[#7c3aed]', bg: 'bg-[#7c3aed]/[0.08]' },
  { icon: Network, title: 'System Architecture', desc: 'Visualize complex technical systems at a glance.', color: 'text-[#0891b2]', bg: 'bg-[#0891b2]/[0.08]' },
  { icon: GitBranch, title: 'Process Mapping', desc: 'Document and optimize any business workflow.', color: 'text-[#059669]', bg: 'bg-[#059669]/[0.08]' },
  { icon: Lightbulb, title: 'Brainstorming', desc: 'Capture and connect ideas on an open canvas.', color: 'text-[#d97706]', bg: 'bg-[#d97706]/[0.08]' },
];

const UseCases = () => (
  <section id="use-cases" className="relative scroll-mt-20 overflow-hidden px-4 py-28 md:py-40">
    <div className="pointer-events-none absolute -left-16 top-1/3 h-[280px] w-[280px] rounded-full bg-[#059669]/[0.03] blur-[80px]" />
    <div className="pointer-events-none absolute -right-16 top-2/3 h-[250px] w-[250px] rounded-full bg-[#d97706]/[0.03] blur-[80px]" />
    <div className="mx-auto max-w-5xl">
      <ScrollReveal className="text-center">
        <Pill>Use cases</Pill>
        <h2 className="mt-5 text-[clamp(1.8rem,4vw,3rem)] font-bold tracking-tight text-[#1C1917]">
          Built for how you work
        </h2>
        <p className="mx-auto mt-4 max-w-md text-[16px] leading-relaxed text-[#78716C]">
          From quick sketches to complex systems — Flowbase adapts to your thinking.
        </p>
      </ScrollReveal>

      <div className="mt-14 grid grid-cols-1 gap-3 md:grid-cols-3">
        {/* Featured first card — spans 2 cols, horizontal layout */}
        {(() => { const Icon0 = useCases[0].icon; return (
          <ScrollReveal delay={0} className="md:col-span-2">
            <BentoCard className="h-full">
              <div className="flex flex-col gap-6 md:flex-row md:items-center">
                <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl ${useCases[0].bg}`}>
                  <Icon0 size={28} strokeWidth={1.5} className={useCases[0].color} />
                </div>
                <div>
                  <h3 className="text-[20px] font-semibold text-[#1C1917]">{useCases[0].title}</h3>
                  <p className="mt-1.5 max-w-md text-[15px] leading-relaxed text-[#78716C]">{useCases[0].desc}</p>
                </div>
              </div>
            </BentoCard>
          </ScrollReveal>
        ); })()}

        {/* Second card — tall on the right */}
        {(() => { const Icon1 = useCases[1].icon; return (
          <ScrollReveal delay={80} className="md:row-span-2">
            <BentoCard className="h-full">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${useCases[1].bg}`}>
                <Icon1 size={20} strokeWidth={1.7} className={useCases[1].color} />
              </div>
              <h3 className="mt-5 text-[17px] font-semibold text-[#1C1917]">{useCases[1].title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-[#78716C]">{useCases[1].desc}</p>
            </BentoCard>
          </ScrollReveal>
        ); })()}

        {/* Bottom two cards */}
        {useCases.slice(2).map((u, i) => {
          const Icon = u.icon;
          return (
            <ScrollReveal key={u.title} delay={160 + i * 80}>
              <BentoCard className="h-full">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${u.bg}`}>
                  <Icon size={20} strokeWidth={1.7} className={u.color} />
                </div>
                <h3 className="mt-5 text-[17px] font-semibold text-[#1C1917]">{u.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-[#78716C]">{u.desc}</p>
              </BentoCard>
            </ScrollReveal>
          );
        })}
      </div>
    </div>
  </section>
);

/* ═══════════════════════ COMPARISON ═══════════════════════ */
const comparisonRows = [
  { label: 'Learning curve', flow: 'Minutes', miro: 'Hours', lucid: 'Hours' },
  { label: 'Interface', flow: 'Minimal', miro: 'Complex', lucid: 'Complex' },
  { label: 'Canvas speed', flow: true, miro: false, lucid: false },
  { label: 'Real-time collab', flow: true, miro: true, lucid: true },
  { label: 'No sign-up needed', flow: true, miro: false, lucid: false },
  { label: 'Free to start', flow: true, miro: false, lucid: false },
];

const CellVal = ({ val, highlight }: { val: boolean | string; highlight?: boolean }) => {
  if (typeof val === 'string') return <span className={`text-[14px] font-medium ${highlight ? 'text-[#7c3aed]' : 'text-[#A8A29E]'}`}>{val}</span>;
  return val
    ? <div className={`flex h-7 w-7 items-center justify-center rounded-full ${highlight ? 'bg-[#7c3aed]/[0.1]' : 'bg-[#16a34a]/[0.08]'}`}><Check size={14} strokeWidth={2.5} className={highlight ? 'text-[#7c3aed]' : 'text-[#16a34a]'} /></div>
    : <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f5f3ff]/60"><Minus size={14} strokeWidth={2} className="text-[#c4b5fd]" /></div>;
};

const Comparison = () => (
  <section id="compare" className="relative scroll-mt-20 overflow-hidden bg-[#faf5ff]/50 px-4 py-28 md:py-36">
    <div className="mx-auto max-w-4xl">
      <ScrollReveal className="text-center">
        <Pill>Compare</Pill>
        <h2 className="mt-5 text-[clamp(1.8rem,4vw,3rem)] font-bold tracking-tight text-[#1C1917]">
          Less complexity. More flow.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-[16px] leading-relaxed text-[#78716C]">
          See how Flowbase stacks up against the heavyweight tools.
        </p>
      </ScrollReveal>

      <ScrollReveal delay={150} className="mt-14">
        <div className="rounded-[1.5rem] bg-[#f5f3ff]/50 p-1.5 ring-1 ring-[#7c3aed]/[0.06]">
          <div className="overflow-hidden rounded-[calc(1.5rem-0.375rem)] bg-white shadow-[0_1px_3px_rgba(124,58,237,0.04)] ring-1 ring-[#7c3aed]/[0.04]">
            {/* Header */}
            <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] border-b border-[#ede9fe]">
              <div className="px-7 py-5" />
              <div className="relative px-4 py-5 text-center">
                <div className="absolute inset-0 bg-gradient-to-b from-[#7c3aed]/[0.06] to-[#7c3aed]/[0.02]" />
                <div className="relative">
                  <div className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-xl bg-[#7c3aed]/[0.12]">
                    <Image src="/logo.png" alt="" width={18} height={18} />
                  </div>
                  <span className="text-[14px] font-bold text-[#7c3aed]">Flowbase</span>
                </div>
              </div>
              <div className="flex items-end justify-center px-4 py-5">
                <span className="text-[13px] font-medium text-[#A8A29E]">Miro</span>
              </div>
              <div className="flex items-end justify-center px-4 py-5">
                <span className="text-[13px] font-medium text-[#A8A29E]">Lucidchart</span>
              </div>
            </div>
            {/* Rows */}
            {comparisonRows.map((r, i) => (
              <div key={r.label} className={`group grid grid-cols-[1.4fr_1fr_1fr_1fr] items-center transition-colors duration-300 hover:bg-[#faf5ff]/40 ${i < comparisonRows.length - 1 ? 'border-b border-[#f5f3ff]' : ''}`}>
                <div className="px-7 py-4.5 text-[14px] font-medium text-[#1C1917]">{r.label}</div>
                <div className="relative flex justify-center px-4 py-4.5">
                  <div className="absolute inset-0 bg-[#7c3aed]/[0.02]" />
                  <div className="relative"><CellVal val={r.flow} highlight /></div>
                </div>
                <div className="flex justify-center px-4 py-4.5"><CellVal val={r.miro} /></div>
                <div className="flex justify-center px-4 py-4.5"><CellVal val={r.lucid} /></div>
              </div>
            ))}
            {/* Bottom accent row */}
            <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] border-t border-[#ede9fe]">
              <div className="px-7 py-4" />
              <div className="relative flex justify-center px-4 py-4">
                <div className="absolute inset-0 bg-gradient-to-t from-[#7c3aed]/[0.06] to-[#7c3aed]/[0.02]" />
                <Link href="/projects" className="relative inline-flex items-center gap-1.5 rounded-full bg-[#7c3aed] px-4 py-1.5 text-[12px] font-medium text-white transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#6d28d9] active:scale-[0.97]">
                  Try free
                  <ArrowUpRight size={11} strokeWidth={2.5} />
                </Link>
              </div>
              <div className="px-4 py-4" />
              <div className="px-4 py-4" />
            </div>
          </div>
        </div>
      </ScrollReveal>
    </div>
  </section>
);

/* ═══════════════════════ TESTIMONIALS ═══════════════════════ */
const testimonials = [
  {
    quote: 'Flowbase replaced three tools in our design workflow. It\u2019s absurdly fast and the interface just gets out of the way.',
    name: 'Maya Chen',
    role: 'Senior Product Designer',
    company: 'Vercel',
    color: 'text-[#7c3aed]',
    bg: 'bg-[#7c3aed]/[0.08]',
  },
  {
    quote: 'Our engineering team maps out every system diagram in Flowbase now. The infinite canvas is game-changing for architecture reviews.',
    name: 'Aarav Patel',
    role: 'Staff Engineer',
    company: 'Stripe',
    color: 'text-[#0891b2]',
    bg: 'bg-[#0891b2]/[0.08]',
  },
  {
    quote: 'I onboarded my entire PM team in under 5 minutes. Try doing that with Lucidchart.',
    name: 'Lena Kowalski',
    role: 'Head of Product',
    company: 'Linear',
    color: 'text-[#059669]',
    bg: 'bg-[#059669]/[0.08]',
  },
];

const Testimonials = () => (
  <section className="relative overflow-hidden px-4 py-28 md:py-40">
    <div className="pointer-events-none absolute -right-20 top-1/3 h-[300px] w-[300px] rounded-full bg-[#7c3aed]/[0.03] blur-[80px]" />
    <div className="mx-auto max-w-5xl">
      <ScrollReveal className="text-center">
        <Pill>Testimonials</Pill>
        <h2 className="mt-5 text-[clamp(1.8rem,4vw,3rem)] font-bold tracking-tight text-[#1C1917]">
          Loved by makers
        </h2>
      </ScrollReveal>

      <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-5">
        {/* Featured testimonial — large, spans 3 cols */}
        <ScrollReveal delay={0} className="md:col-span-3">
          <div className="flex h-full flex-col rounded-[1.5rem] bg-[#1C1917] p-9 shadow-[0_24px_80px_rgba(0,0,0,0.12)] transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:shadow-[0_32px_80px_rgba(0,0,0,0.18)]">
            <Quote size={28} strokeWidth={1.2} className="text-white/20" />
            <p className="mt-5 flex-1 text-[18px] leading-relaxed text-white/80">{testimonials[0].quote}</p>
            <div className="mt-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-[14px] font-semibold text-white">
                {testimonials[0].name.split(' ').map((n) => n[0]).join('')}
              </div>
              <div>
                <p className="text-[14px] font-semibold text-white">{testimonials[0].name}</p>
                <p className="text-[12px] text-white/50">{testimonials[0].role}, {testimonials[0].company}</p>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Two smaller testimonials stacked */}
        <div className="flex flex-col gap-4 md:col-span-2">
          {testimonials.slice(1).map((t, i) => (
            <ScrollReveal key={t.name} delay={100 + i * 100}>
              <div className="flex h-full flex-col rounded-[1.5rem] bg-white p-7 shadow-[0_1px_4px_rgba(124,58,237,0.04)] ring-1 ring-[#7c3aed]/[0.06] transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(124,58,237,0.06)]">
                <Quote size={20} strokeWidth={1.2} className="text-[#7c3aed]/20" />
                <p className="mt-3 flex-1 text-[14px] leading-relaxed text-[#44403C]">{t.quote}</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${t.bg} text-[12px] font-semibold ${t.color}`}>
                    {t.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[#1C1917]">{t.name}</p>
                    <p className="text-[11px] text-[#A8A29E]">{t.role}, {t.company}</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </div>
  </section>
);

/* ═══════════════════════ CTA ═══════════════════════ */
const CtaSection = () => (
  <section className="px-4 py-28 md:py-36">
    <div className="mx-auto max-w-5xl">
      <ScrollReveal>
        <div className="relative overflow-hidden rounded-[2rem] bg-[#1C1917] px-8 py-20 text-center md:px-16 md:py-28">
          {/* Glows */}
          <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[300px] w-[500px] rounded-full bg-[#7c3aed]/[0.15] blur-[100px]" />
          <div className="pointer-events-none absolute right-0 bottom-0 h-[200px] w-[300px] rounded-full bg-[#0891b2]/[0.08] blur-[80px]" />

          {/* Dot grid overlay */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, white 0.8px, transparent 0.8px)', backgroundSize: '24px 24px' }} />

          <div className="relative">
            <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-bold tracking-tight text-white">
              Ready to think visually?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[16px] leading-relaxed text-white/60">
              Start building beautiful flows in seconds. No signup required, no credit card, no friction.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/projects"
                className="group inline-flex items-center gap-2.5 rounded-full bg-white px-7 py-3.5 text-[15px] font-medium text-[#1C1917] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white/90 active:scale-[0.97]"
              >
                Start Building Flows
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1C1917]/[0.08] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px">
                  <ArrowUpRight size={13} strokeWidth={2} className="text-[#1C1917]" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </div>
  </section>
);

/* ═══════════════════════ FOOTER ═══════════════════════ */
const footerLinks = {
  Product: ['Features', 'Templates', 'Pricing', 'Changelog'],
  Resources: ['Documentation', 'Blog', 'Community', 'Support'],
  Company: ['About', 'Careers', 'Privacy', 'Terms'],
};

const Footer = () => (
  <footer className="border-t border-[#ede9fe]/60 px-4 py-16">
    <div className="mx-auto grid max-w-5xl grid-cols-2 gap-10 md:grid-cols-5">
      {/* Brand */}
      <div className="col-span-2">
        <Link href="/" className="flex items-center gap-2 text-[15px] font-bold text-[#7c3aed]">
          <Image src="/logo.png" alt="Flowbase" width={28} height={28} />
          Flowbase
        </Link>
        <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-[#A8A29E]">
          The fast, intuitive diagramming tool for teams who think visually.
        </p>
      </div>

      {/* Links */}
      {Object.entries(footerLinks).map(([group, links]) => (
        <div key={group}>
          <h4 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#A8A29E]">{group}</h4>
          <ul className="mt-4 space-y-2.5">
            {links.map((link) => (
              <li key={link}>
                <a href="#" className="text-[13px] text-[#78716C] transition-colors duration-300 hover:text-[#1C1917]">{link}</a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>

    <div className="mx-auto mt-12 max-w-5xl border-t border-[#ede9fe]/60 pt-6">
      <p className="text-[12px] text-[#A8A29E]">© {new Date().getFullYear()} Flowbase. All rights reserved.</p>
    </div>
  </footer>
);

/* ═══════════════════════ LANDING PAGE ═══════════════════════ */
const LandingPage = () => (
  <div className="min-h-[100dvh] bg-white">
    <Navbar />
    <Hero />
    <Features />
    <HowItWorks />
    <UseCases />
    <Comparison />
    <Testimonials />
    <CtaSection />
    <Footer />
  </div>
);

export default LandingPage;
