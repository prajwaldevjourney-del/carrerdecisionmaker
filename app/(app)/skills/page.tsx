"use client";

import { useState } from "react";
import { useAppState } from "@/lib/store";
import Link from "next/link";
import { ChevronDown, ChevronUp, Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FADE_UP, STAGGER, STAGGER_ITEM } from "@/lib/motion";
import PageTransition from "@/components/PageTransition";

export default function SkillsPage() {
  const { state } = useAppState();
  const { jobs, resume, roadmap } = state;
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!resume) {
    return (
      <PageTransition>
        <div className="p-8 max-w-2xl">
          <h1 className="text-2xl font-semibold text-[var(--text)] mb-2">Skill Gaps</h1>
          <p className="text-sm text-[var(--text-muted)] mb-6">Upload your resume to see skill gap analysis.</p>
          <Link href="/upload" className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--text)] text-[var(--bg)] text-sm rounded-lg hover:opacity-90 transition-opacity duration-150">
            <Upload size={13} /> Upload Resume
          </Link>
        </div>
      </PageTransition>
    );
  }

  const totalGaps = jobs.reduce((a, b) => a + b.missingSkills.length, 0);

  // Build a map of skill → reason from the roadmap (Gemini-generated reasons)
  const skillReasonMap: Record<string, string> = {};
  for (const item of roadmap) {
    skillReasonMap[item.skill.toLowerCase()] = item.reason;
  }

  return (
    <PageTransition>
      <div className="p-8 max-w-3xl">
        <motion.div {...FADE_UP} className="mb-6">
          <h1 className="text-2xl font-semibold text-[var(--text)] mb-1">Skill Gap Analysis</h1>
          <p className="text-sm text-[var(--text-muted)]">
            {resume.skills.length} skills from your resume · {totalGaps} gaps across {jobs.length} roles
          </p>
        </motion.div>

        {/* Your actual skills from resume */}
        <motion.div {...FADE_UP} transition={{ duration: 0.18, ease: "easeOut", delay: 0.04 }}
          className="grad-card bg-[var(--bg)] border border-[var(--border)] rounded-xl p-5 mb-5">
          <p className="text-xs text-[var(--text-faint)] uppercase tracking-widest mb-3">
            Your Skills from Resume
            <span className="text-[var(--text-muted)] normal-case tracking-normal ml-1">({resume.skills.length})</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {resume.skills.map(s => (
              <span key={s} className="text-xs bg-[var(--bg-subtle)] text-[var(--text-muted)] px-2.5 py-1 rounded-md border border-[var(--border)]">
                {s}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Per-role gap analysis — all data from Gemini */}
        <motion.div {...STAGGER} initial="initial" animate="animate" className="space-y-2">
          {jobs.map(job => {
            const isOpen = expanded === job.id;
            const pct = job.matchPercent;
            return (
              <motion.div key={job.id} {...STAGGER_ITEM}
                className="grad-card bg-[var(--bg)] border border-[var(--border)] rounded-xl overflow-hidden">
                <button onClick={() => setExpanded(isOpen ? null : job.id)}
                  className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-[var(--bg-subtle)] transition-colors duration-150">

                  {/* Circular match score */}
                  <div className="relative w-10 h-10 shrink-0">
                    <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15" fill="none" stroke="var(--bg-subtle)" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15" fill="none"
                        stroke={pct >= 70 ? "#10b981" : pct >= 40 ? "#f59e0b" : "#ef4444"}
                        strokeWidth="3"
                        strokeDasharray={`${(pct / 100) * 94.2} 94.2`}
                        strokeLinecap="round" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold text-[var(--text)]">{pct}%</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text)] mb-0.5">{job.title}</p>
                    <p className="text-xs text-[var(--text-faint)]">
                      {job.matchedSkills.length} matched · {job.missingSkills.length} missing
                    </p>
                  </div>
                  {isOpen
                    ? <ChevronUp size={14} className="text-[var(--text-faint)] shrink-0" />
                    : <ChevronDown size={14} className="text-[var(--text-faint)] shrink-0" />}
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="overflow-hidden">
                      <div className="px-5 pb-5 border-t border-[var(--border)]">

                        {/* Matched skills */}
                        {job.matchedSkills.length > 0 && (
                          <div className="pt-4 mb-4">
                            <p className="text-xs text-[var(--text-faint)] uppercase tracking-widest mb-2">
                              Matched ({job.matchedSkills.length})
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {job.matchedSkills.map(skill => (
                                <span key={skill} className="text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 px-2 py-0.5 rounded-md">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Missing skills with Gemini reasons */}
                        {job.missingSkills.length === 0 ? (
                          <p className="pt-4 text-sm text-emerald-600">All required skills matched.</p>
                        ) : (
                          <div>
                            <p className="text-xs text-[var(--text-faint)] uppercase tracking-widest mb-2">
                              Missing ({job.missingSkills.length})
                            </p>
                            <div className="space-y-2">
                              {job.missingSkills.map(skill => (
                                <div key={skill} className="flex items-start gap-3 p-3 bg-[var(--bg-subtle)] rounded-lg">
                                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                                  <div>
                                    <p className="text-sm font-medium text-[var(--text)] capitalize">{skill}</p>
                                    <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">
                                      {/* Use Gemini roadmap reason if available, else generic */}
                                      {skillReasonMap[skill.toLowerCase()] ||
                                        `${skill} is required for ${job.title} roles.`}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </PageTransition>
  );
}
