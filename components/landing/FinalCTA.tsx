"use client";

import Link from "next/link";
import { useRef, useEffect } from "react";
import { ArrowRight } from "lucide-react";

export default function FinalCTA() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("visible"); io.disconnect(); } },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="border-t border-[var(--border)]">
      <div ref={ref} className="reveal max-w-5xl mx-auto px-6 py-24 flex flex-col items-center text-center">
        <p className="text-xs font-medium text-[var(--text-faint)] uppercase tracking-widest mb-5">
          Get started
        </p>
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--text)] mb-4 max-w-md leading-tight">
          Ready to understand your career?
        </h2>
        <p className="text-sm text-[var(--text-muted)] mb-10 max-w-sm leading-relaxed">
          Upload your resume and get a full analysis in under a minute.
        </p>
        <Link
          href="/signup"
          className="animated-border inline-flex items-center gap-2 px-7 py-3.5 bg-[var(--text)] text-[var(--bg)] text-sm font-medium rounded-lg hover:opacity-88 transition-opacity duration-200 group relative z-10"
        >
          Sign Up — it&apos;s free
          <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform duration-150" />
        </Link>
      </div>
    </section>
  );
}
