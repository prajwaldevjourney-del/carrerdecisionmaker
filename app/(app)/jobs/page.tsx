"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppState } from "@/lib/store";
import Link from "next/link";
import { ChevronDown, ChevronUp, ExternalLink, Loader2, RefreshCw, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FADE_IN, FADE_UP } from "@/lib/motion";
import PageTransition from "@/components/PageTransition";
import type { LiveJob } from "@/app/api/job-search/route";

export default function JobsPage() {
  const { state } = useAppState();
  const { jobs, resume } = state;
  const [expanded, setExpanded]     = useState<string | null>(null);
  const [liveJobs, setLiveJobs]     = useState<LiveJob[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError]   = useState("");
  const [activeTab, setActiveTab]   = useState<"matches" | "live">("matches");

  const fetchLiveJobs = useCallback(async () => {
    if (!resume || jobs.length === 0) return;
    setLiveLoading(true); setLiveError("");
    try {
      const res  = await fetch("/api/job-search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resume, jobs }) });
      const data = await res.json();
      if (data.error) { setLiveError(data.error); return; }
      setLiveJobs(data.jobs ?? []);
    } catch { setLiveError("Failed to fetch live jobs."); }
    finally { setLiveLoading(false); }
  }, [resume, jobs]);

  useEffect(() => {
    if (resume && jobs.length > 0 && liveJobs.length === 0 && !liveLoading) fetchLiveJobs();
  }, [resume, jobs, liveJobs.length, liveLoading, fetchLiveJobs]);

  if (!resume) {
    return (
      <PageTransition>
        <div className="p-10">
          <h1 className="text-2xl font-semibold text-[var(--text)] mb-1">Job Matches</h1>
          <p className="text-sm text-[var(--text-muted)] mb-6">Upload your resume to see job matches.</p>
          <Link href="/upload" className="text-sm text-[var(--text)] underline underline-offset-2">Upload Resume →</Link>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
    <div className="p-10">
      <div className="max-w-3xl">
        <motion.div {...FADE_UP} className="mb-6">
          <h1 className="text-2xl font-semibold text-[var(--text)] mb-1">Job Matches</h1>
          <p className="text-sm text-[var(--text-muted)]">{jobs.length} roles scored · live web search powered by Gemini</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-[var(--bg-subtle)] rounded-lg mb-6 w-fit">
          {(["matches", "live"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`relative px-4 py-1.5 text-sm rounded-md transition-colors duration-150 ${
                activeTab === tab ? "text-[var(--text)] font-medium" : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}>
              {activeTab === tab && (
                <motion.div layoutId="tab-bg" className="absolute inset-0 bg-[var(--bg)] rounded-md shadow-sm" style={{ zIndex: -1 }}
                  transition={{ duration: 0.15, ease: "easeOut" }} />
              )}
              {tab === "matches" ? "Role Analysis" : (
                <span className="flex items-center gap-1.5">
                  <Globe size={12} />Live Jobs
                  {liveLoading && <Loader2 size={11} className="animate-spin" />}
                  {!liveLoading && liveJobs.length > 0 && (
                    <span className="bg-[var(--text)] text-[var(--bg)] text-xs px-1.5 py-0.5 rounded-full leading-none">{liveJobs.length}</span>
                  )}
                </span>
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "matches" && (
            <motion.div key="matches" {...FADE_IN} className="space-y-2">
              {jobs.map(job => {
                const isOpen = expanded === job.id;
                const riskCls = {
                  Low:    "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
                  Medium: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
                  High:   "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
                }[job.automationRisk];
                return (
                  <div key={job.id} className="bg-[var(--bg)] border border-[var(--border)] rounded-lg overflow-hidden hover:border-[var(--border-strong)] transition-colors duration-150">
                    <button onClick={() => setExpanded(isOpen ? null : job.id)}
                      className="w-full px-6 py-4 flex items-center gap-4 text-left hover:bg-[var(--bg-subtle)] transition-colors duration-150">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-medium text-[var(--text)]">{job.title}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${riskCls}`}>{job.automationRisk} Risk</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${job.matchPercent >= 70 ? "bg-emerald-500" : job.matchPercent >= 40 ? "bg-amber-400" : "bg-red-400"}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${job.matchPercent}%` }}
                              transition={{ duration: 0.4, ease: "easeOut" }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-[var(--text)] w-10 text-right">{job.matchPercent}%</span>
                        </div>
                      </div>
                      {isOpen ? <ChevronUp size={14} className="text-[var(--text-faint)] shrink-0" /> : <ChevronDown size={14} className="text-[var(--text-faint)] shrink-0" />}
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div key="detail"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.18, ease: "easeOut" }}
                          className="overflow-hidden">
                          <div className="px-6 pb-5 border-t border-[var(--border)]">
                            <div className="grid grid-cols-2 gap-6 pt-4">
                              <div>
                                <p className="text-xs text-[var(--text-faint)] uppercase tracking-wide mb-2">Matched ({job.matchedSkills.length})</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {job.matchedSkills.length > 0
                                    ? job.matchedSkills.map(s => <span key={s} className="text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 px-2 py-0.5 rounded">{s}</span>)
                                    : <span className="text-xs text-[var(--text-faint)]">None matched</span>}
                                </div>
                              </div>
                              <div>
                                <p className="text-xs text-[var(--text-faint)] uppercase tracking-wide mb-2">Missing ({job.missingSkills.length})</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {job.missingSkills.length > 0
                                    ? job.missingSkills.map(s => <span key={s} className="text-xs bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400 px-2 py-0.5 rounded">{s}</span>)
                                    : <span className="text-xs text-emerald-600">All matched!</span>}
                                </div>
                              </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-[var(--border)] grid grid-cols-3 gap-4 text-center">
                              {[["Skills Matched", job.matchedSkills.length], ["Skills Missing", job.missingSkills.length], ["Total Required", job.requiredSkills.length]].map(([l, v]) => (
                                <div key={l as string}>
                                  <p className="text-lg font-semibold text-[var(--text)]">{v}</p>
                                  <p className="text-xs text-[var(--text-faint)]">{l}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </motion.div>
          )}

          {activeTab === "live" && (
            <motion.div key="live" {...FADE_IN}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-[var(--text-faint)]">
                  {liveLoading ? "Searching the web for open positions..." : liveJobs.length > 0 ? `${liveJobs.length} positions found` : "No results yet"}
                </p>
                <button onClick={fetchLiveJobs} disabled={liveLoading}
                  className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)] disabled:opacity-40 transition-colors duration-150">
                  <RefreshCw size={12} className={liveLoading ? "animate-spin" : ""} /> Refresh
                </button>
              </div>
              {liveLoading && (
                <div className="space-y-2">
                  {[0,1,2,3].map(i => (
                    <div key={i} className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-5">
                      <div className="h-4 bg-[var(--bg-subtle)] rounded animate-pulse w-48 mb-2" />
                      <div className="h-3 bg-[var(--bg-subtle)] rounded animate-pulse w-32 mb-3" />
                      <div className="h-3 bg-[var(--bg-subtle)] rounded animate-pulse w-full" />
                    </div>
                  ))}
                </div>
              )}
              {liveError && !liveLoading && (
                <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">{liveError}</div>
              )}
              {!liveLoading && liveJobs.length > 0 && (
                <div className="space-y-2">
                  {liveJobs.map((job, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15, ease: "easeOut", delay: i * 0.03 }}
                      className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-5 hover:border-[var(--border-strong)] transition-colors duration-150">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm font-medium text-[var(--text)]">{job.title}</span>
                            <span className="text-xs bg-[var(--bg-subtle)] text-[var(--text-muted)] px-2 py-0.5 rounded">{job.type}</span>
                            <span className="text-xs text-[var(--text-faint)]">{job.source}</span>
                          </div>
                          <p className="text-xs text-[var(--text)] font-medium mb-0.5">{job.company}</p>
                          <p className="text-xs text-[var(--text-faint)] mb-2">{job.location}</p>
                          <p className="text-xs text-[var(--text-muted)] leading-relaxed">{job.matchReason}</p>
                        </div>
                        <a href={job.applyUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--text)] text-[var(--bg)] text-xs rounded-md hover:opacity-90 transition-opacity duration-150 shrink-0">
                          Apply <ExternalLink size={11} />
                        </a>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
              {!liveLoading && liveJobs.length === 0 && !liveError && (
                <div className="text-center py-12 text-[var(--text-faint)]">
                  <Globe size={22} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Click Refresh to search for live jobs</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
    </PageTransition>
  );
}
