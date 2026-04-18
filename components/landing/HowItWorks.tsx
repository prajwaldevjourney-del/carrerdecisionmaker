"use client";

import { useRef, useEffect, useState } from "react";

const STEPS = [
  {
    step: "01",
    title: "Upload your resume",
    desc: "Drop a PDF. Carreriq extracts your skills, experience level, and professional context automatically.",
  },
  {
    step: "02",
    title: "Analyze your skills",
    desc: "Your profile is scored against 7 roles. Each role shows match percentage, matched skills, and gaps.",
  },
  {
    step: "03",
    title: "Get structured insights",
    desc: "Skill gaps are ranked by impact. A learning roadmap is generated with timelines and priorities.",
  },
  {
    step: "04",
    title: "Improve systematically",
    desc: "Follow your roadmap. Track progress. Use the career intelligence engine to answer specific questions about your path.",
  },
];

function StepRow({ step, title, desc, index, isLast }: typeof STEPS[0] & { index: number; isLast: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setTimeout(() => setActive(true), index * 60);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [index]);

  return (
    <div
      ref={ref}
      className={`flex items-start gap-8 py-7 transition-opacity duration-200 ease-out ${
        !isLast ? "border-b border-[var(--border)]" : ""
      } ${active ? "opacity-100" : "opacity-0"}`}
    >
      <div className="flex flex-col items-center shrink-0 pt-0.5">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono transition-colors duration-150 ${
          active
            ? "bg-[var(--bg-hover)] border border-[var(--border-strong)] text-[var(--text)]"
            : "bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--text-faint)]"
        }`}>
          {step}
        </div>
        {!isLast && (
          <div
            className="w-px bg-[var(--border)] mt-1 transition-all duration-200 ease-out"
            style={{ height: active ? "36px" : "0px" }}
          />
        )}
      </div>
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
        <p className={`text-sm font-semibold transition-colors duration-150 ${active ? "text-[var(--text)]" : "text-[var(--text-muted)]"}`}>
          {title}
        </p>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

export default function HowItWorks() {
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
          How it works
        </p>
        <div>
          {STEPS.map((s, i) => (
            <StepRow key={s.step} {...s} index={i} isLast={i === STEPS.length - 1} />
          ))}
        </div>
      </div>
    </section>
  );
}
