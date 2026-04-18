"use client";

import { useRef, useEffect } from "react";

const VALUES = [
  {
    num: "01",
    title: "Job Match Intelligence",
    desc: "Your skills are scored against 7 roles. You see exactly where you stand — match percentage, matched skills, and what's missing.",
  },
  {
    num: "02",
    title: "Skill Gap Analysis",
    desc: "Every missing skill is surfaced with context. You know not just what's missing, but why it matters for each specific role.",
  },
  {
    num: "03",
    title: "Learning Roadmap",
    desc: "Gaps are converted into a prioritized, week-based learning plan. High-impact skills first. No guesswork.",
  },
  {
    num: "04",
    title: "Career Direction",
    desc: "Based on your current profile, Carreriq maps short, mid, and long-term roles — specific to your skills, not generic advice.",
  },
];

function ValueCard({ num, title, desc, delay }: typeof VALUES[0] & { delay: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("visible"); io.disconnect(); } },
      { threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="reveal card-interactive grad-card bg-[var(--bg)] border border-[var(--border)] rounded-xl p-7 group"
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="w-6 h-px bg-[var(--border-strong)] mb-6 transition-all duration-150 ease-out group-hover:w-10 group-hover:bg-[var(--text-muted)]" />
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-semibold text-[var(--text)]">{title}</p>
        <span className="text-xs font-mono text-[var(--text-faint)] ml-4 shrink-0">{num}</span>
      </div>
      <p className="text-sm text-[var(--text-muted)] leading-relaxed">{desc}</p>
    </div>
  );
}

export default function Values() {
  const labelRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = labelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("visible"); io.disconnect(); } },
      { threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="border-t border-[var(--border)]">
      <div className="max-w-5xl mx-auto px-6 py-24">
        <p ref={labelRef} className="reveal text-xs font-medium text-[var(--text-faint)] uppercase tracking-widest mb-12">
          What Carreriq does
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {VALUES.map((v, i) => (
            <ValueCard key={v.title} {...v} delay={i * 40} />
          ))}
        </div>
      </div>
    </section>
  );
}
