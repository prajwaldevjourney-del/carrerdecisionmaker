"use client";

import { useState } from "react";
import { useAppState } from "@/lib/store";
import Link from "next/link";
import { ArrowRight, Send, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FADE_UP, FADE_IN } from "@/lib/motion";
import PageTransition from "@/components/PageTransition";

const SUGGESTED = [
  "What job suits me best?",
  "What should I learn next?",
  "How do I improve my profile?",
  "Show my career path",
  "What are my skill gaps?",
  "Which roles have low automation risk?",
  "What is my market value?",
];

interface QA { query: string; answer: string; }

export default function CareerPage() {
  const { state } = useAppState();
  const { resume, jobs } = state;

  // Use trajectory already computed from resume upload — no extra API call
  const trajectory = state.career;

  const [query,   setQuery]   = useState("");
  const [history, setHistory] = useState<QA[]>([]);
  const [loading, setLoading] = useState(false);

  const handleAsk = async (q: string) => {
    if (!resume || jobs.length === 0 || !q.trim() || loading) return;
    setLoading(true);
    setQuery("");

    const context = {
      name:        resume.name,
      skills:      resume.skills,
      experience:  resume.experienceLevel,
      years:       resume.yearsOfExperience,
      currentRole: resume.currentRole,
      location:    resume.location,
      education:   resume.education,
      summary:     resume.summary,
      job_matches: jobs.map(j => ({
        role:           j.title,
        match:          j.matchPercent,
        missing_skills: j.missingSkills,
        matched_skills: j.matchedSkills,
      })),
    };

    try {
      const res  = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, context }),
      });
      const data = await res.json();
      setHistory(prev => [{ query: q, answer: data.answer || "No response." }, ...prev]);
    } catch {
      setHistory(prev => [{ query: q, answer: "Analysis engine unavailable. Please try again." }, ...prev]);
    } finally {
      setLoading(false);
    }
  };

  if (!resume) {
    return (
      <PageTransition>
        <div className="p-8 max-w-2xl">
          <h1 className="text-2xl font-semibold text-[var(--text)] mb-1">Career Path</h1>
          <p className="text-sm text-[var(--text-muted)] mb-6">Upload your resume to generate your career trajectory.</p>
          <Link href="/upload" className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--text)] text-[var(--bg)] text-sm rounded-lg hover:opacity-90 transition-opacity duration-150">
            Upload Resume →
          </Link>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="p-8">
        <div className="max-w-4xl space-y-5">

          {/* Header — real data from resume */}
          <motion.div {...FADE_UP}>
            <h1 className="text-2xl font-semibold text-[var(--text)] mb-1">Career Path</h1>
            <p className="text-sm text-[var(--text-muted)]">
              Based on <span className="text-[var(--text)] font-medium">{resume.name}</span>
              {resume.currentRole ? ` · ${resume.currentRole}` : ""}
              {" "}· {resume.experienceLevel} · {resume.yearsOfExperience}+ yrs
            </p>
            {resume.summary && (
              <p className="text-xs text-[var(--text-faint)] mt-1 max-w-2xl leading-relaxed">{resume.summary}</p>
            )}
          </motion.div>

          {/* Career Trajectory — from resume parse, no extra API call */}
          <motion.div {...FADE_UP} transition={{ duration: 0.18, ease: "easeOut", delay: 0.04 }}
            className="grad-card bg-[var(--bg)] border border-[var(--border)] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-2">
              <Sparkles size={14} className="text-[var(--text-faint)]" />
              <span className="text-sm font-medium text-[var(--text)]">Career Trajectory</span>
              <span className="ml-auto text-xs text-[var(--text-faint)] bg-[var(--bg-subtle)] border border-[var(--border)] px-2 py-0.5 rounded-full">
                Generated from your resume
              </span>
            </div>
            <div className="p-6">
              {trajectory?.summary && (
                <p className="text-xs text-[var(--text-muted)] mb-5 pb-4 border-b border-[var(--border)] leading-relaxed">
                  {trajectory.summary}
                </p>
              )}
              {trajectory ? (
                <div className="grid grid-cols-3 gap-6">
                  {[
                    { label: "Short Term", sublabel: "0–12 months", items: trajectory.shortTerm },
                    { label: "Mid Term",   sublabel: "1–3 years",   items: trajectory.midTerm },
                    { label: "Long Term",  sublabel: "3–7 years",   items: trajectory.longTerm },
                  ].map(({ label, sublabel, items }) => (
                    <div key={label} className="border-l-2 border-[var(--border-strong)] pl-4">
                      <p className="text-xs font-semibold text-[var(--text)] mb-0.5">{label}</p>
                      <p className="text-xs text-[var(--text-faint)] mb-3">{sublabel}</p>
                      <div className="space-y-2">
                        {(items ?? []).map((item, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <ArrowRight size={11} className="text-[var(--text-faint)] mt-0.5 shrink-0" />
                            <p className="text-xs text-[var(--text-muted)] leading-relaxed">{item}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--text-faint)]">Upload your resume to generate trajectory.</p>
              )}
            </div>
          </motion.div>

          {/* Career Intelligence — Gemini with full resume context */}
          <motion.div {...FADE_UP} transition={{ duration: 0.18, ease: "easeOut", delay: 0.08 }}
            className="grad-card bg-[var(--bg)] border border-[var(--border)] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--text)]">Career Intelligence</span>
              <span className="text-xs text-[var(--text-faint)] bg-[var(--bg-subtle)] border border-[var(--border)] px-2.5 py-1 rounded-full">
                Gemini · Web Search
              </span>
            </div>
            <div className="p-6">

              {/* Live context from resume */}
              <div className="flex flex-wrap items-center gap-3 mb-5 p-3 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-xs text-[var(--text-muted)]">{resume.skills.length} skills</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--border-strong)]" />
                  <span className="text-xs text-[var(--text-muted)]">{jobs.length} roles scored</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--border-strong)]" />
                  <span className="text-xs text-[var(--text-muted)]">Top: {jobs[0]?.matchPercent}% — {jobs[0]?.title}</span>
                </div>
                {resume.currentRole && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--border-strong)]" />
                    <span className="text-xs text-[var(--text-muted)]">{resume.currentRole}</span>
                  </div>
                )}
              </div>

              {/* Suggested queries */}
              <div className="flex flex-wrap gap-2 mb-4">
                {SUGGESTED.map(s => (
                  <button key={s} onClick={() => handleAsk(s)} disabled={loading}
                    className="text-xs px-3 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-md text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-strong)] disabled:opacity-40 transition-colors duration-150">
                    {s}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="flex gap-2 mb-4">
                <input type="text" value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleAsk(query.trim()); }}
                  placeholder="Ask anything about your career..." disabled={loading}
                  className="flex-1 text-sm px-3 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--bg-subtle)] text-[var(--text)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--border-strong)] disabled:opacity-50 transition-colors duration-150" />
                <button onClick={() => handleAsk(query.trim())} disabled={!query.trim() || loading}
                  className="px-4 py-2.5 bg-[var(--text)] text-[var(--bg)] text-sm rounded-lg hover:opacity-90 disabled:opacity-40 transition-opacity duration-150 flex items-center gap-2">
                  {loading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  {loading ? "Analyzing" : "Ask"}
                </button>
              </div>

              {/* Loading */}
              {loading && (
                <div className="flex items-center gap-2 px-4 py-3 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg mb-3">
                  <Loader2 size={12} className="animate-spin text-[var(--text-faint)]" />
                  <span className="text-xs text-[var(--text-muted)]">Searching web + analyzing your profile...</span>
                </div>
              )}

              {/* Q&A history */}
              <AnimatePresence>
                {history.length > 0 && (
                  <div className="space-y-3">
                    {history.map((item, i) => (
                      <motion.div key={i} {...FADE_IN}
                        className="border border-[var(--border)] rounded-lg overflow-hidden">
                        <div className="px-4 py-2.5 bg-[var(--bg-subtle)] border-b border-[var(--border)]">
                          <p className="text-xs font-medium text-[var(--text-muted)]">Q: {item.query}</p>
                        </div>
                        <div className="px-4 py-3">
                          <pre className="text-sm text-[var(--text)] leading-relaxed whitespace-pre-wrap font-sans">{item.answer}</pre>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>

              {history.length === 0 && !loading && (
                <div className="text-center py-6 text-[var(--text-faint)]">
                  <p className="text-xs">Ask anything — answers are grounded in your actual resume data</p>
                </div>
              )}
            </div>
          </motion.div>

        </div>
      </div>
    </PageTransition>
  );
}
