"use client";

import Link from "next/link";
import { useTypewriter } from "@/hooks/useTypewriter";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef } from "react";

const WORDS = ["precision.", "clarity.", "direction.", "intelligence."];

export default function Hero() {
  const typed   = useTypewriter(WORDS, 72, 2200);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;

    const orbs = Array.from(el.querySelectorAll<HTMLElement>(".mesh-orb"));

    // Idle float — each orb has its own phase
    const phases = orbs.map((_, i) => i * 2.1);
    let floatRaf = 0;
    const floatTick = (t: number) => {
      orbs.forEach((orb, i) => {
        const y = Math.sin((t / 1000 + phases[i]) * 0.5) * 22;
        const s = 1 + Math.sin((t / 1000 + phases[i]) * 0.3) * 0.03;
        orb.dataset.floatY = String(y);
        orb.dataset.floatS = String(s);
      });
      floatRaf = requestAnimationFrame(floatTick);
    };
    floatRaf = requestAnimationFrame(floatTick);

    // Mouse parallax — blended with float
    const mouse = { x: 0, y: 0 };
    const onMove = (e: MouseEvent) => {
      const { innerWidth: w, innerHeight: h } = window;
      mouse.x = (e.clientX / w - 0.5) * 30;
      mouse.y = (e.clientY / h - 0.5) * 30;
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    // Combine float + parallax in a single RAF
    let combineRaf = 0;
    const combineTick = () => {
      orbs.forEach((orb, i) => {
        const fy = parseFloat(orb.dataset.floatY ?? "0");
        const fs = parseFloat(orb.dataset.floatS ?? "1");
        const factor = (i + 1) * 0.28;
        const px = mouse.x * factor;
        const py = mouse.y * factor;
        orb.style.transform = `translate(${px}px, ${fy + py}px) scale(${fs})`;
      });
      combineRaf = requestAnimationFrame(combineTick);
    };
    combineRaf = requestAnimationFrame(combineTick);

    return () => {
      cancelAnimationFrame(floatRaf);
      cancelAnimationFrame(combineRaf);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <section ref={heroRef} className="hero-bg relative overflow-hidden min-h-[90vh] flex items-center">
      {/* Mesh background — no CSS animation, JS handles it */}
      <div className="mesh-bg">
        <div className="mesh-orb mesh-orb-1" />
        <div className="mesh-orb mesh-orb-2" />
        <div className="mesh-orb mesh-orb-3" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-28 w-full">
        {/* Badge — static, no float */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-subtle)] mb-10">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-faint)]" />
          <span className="text-xs text-[var(--text-muted)] font-medium tracking-wide">
            Career Intelligence Platform
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-[3.6rem] font-semibold tracking-tight text-[var(--text)] leading-[1.1] mb-7 max-w-2xl">
          Understand your career.
          <br />
          <span className="text-[var(--text-muted)]">Improve it with </span>
          <span className="text-[var(--text)]">{typed}</span>
          <span className="tw-cursor" />
        </h1>

        {/* Subtext */}
        <p className="text-base text-[var(--text-muted)] leading-relaxed mb-10 max-w-lg">
          Carreriq analyzes your resume, scores your fit across roles, identifies skill gaps,
          and gives you a structured path forward — not a list of jobs, but a system for growth.
        </p>

        {/* CTA */}
        <div className="flex items-center gap-5 flex-wrap">
          <Link
            href="/signup"
            className="animated-border inline-flex items-center gap-2 px-6 py-3 bg-[var(--text)] text-[var(--bg)] text-sm font-medium rounded-lg hover:opacity-90 transition-opacity duration-150 group"
          >
            Get Started
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform duration-150" />
          </Link>
          <Link
            href="/login"
            className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-150"
          >
            Already have an account →
          </Link>
        </div>
      </div>
    </section>
  );
}
