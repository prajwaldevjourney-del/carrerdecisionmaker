"use client";

import { useAppState } from "@/lib/store";
import Link from "next/link";
import { Upload, Briefcase, Zap, Map, TrendingUp, ArrowLeftRight, ArrowRight, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { FADE_UP, STAGGER, STAGGER_ITEM } from "@/lib/motion";
import PageTransition from "@/components/PageTransition";

const FEATURES = [
  { href: "/jobs",     icon: Briefcase,     label: "Job Matches",    desc: "See how you score against 7 roles" },
  { href: "/skills",   icon: Zap,           label: "Skill Gaps",     desc: "Identify what you're missing" },
  { href: "/roadmap",  icon: Map,           label: "Roadmap",        desc: "Week-by-week learning plan" },
  { href: "/career",   icon: TrendingUp,    label: "Career Path",    desc: "AI-powered trajectory + assistant" },
  { href: "/exchange", icon: ArrowLeftRight, label: "Skill Exchange", desc: "Share skills, earn points" },
];

export default function DashboardPage() {
  const { state } = useAppState();
  const { resume, jobs, roadmap } = state;

  // Empty state — no resume uploaded
  if (!resume) {
    return (
      <PageTransition>
        <div className="p-8 max-w-4xl">
          {/* Welcome */}
          <motion.div {...FADE_UP} className="mb-10">
            <h1 className="text-3xl font-semibold text-[var(--text)] mb-2">Welcome to Carreriq</h1>
            <p className="text-sm text-[var(--text-muted)] max-w-lg">
              Upload your resume to get a complete career analysis — job fit scores, skill gaps, a learning roadmap, and AI-powered career guidance.
            </p>
          </motion.div>

          {/* Upload CTA */}
          <motion.div {...FADE_UP} transition={{ duration: 0.18, ease: "easeOut", delay: 0.05 }}
            className="grad-card bg-[var(--bg)] border border-[var(--border)] rounded-xl p-8 mb-8 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--text)] mb-1">Start with your resume</p>
              <p className="text-xs text-[var(--text-muted)]">PDF · Takes under 30 seconds to analyze</p>
            </div>
            <Link href="/upload"
              className="flex items-center gap-2 px-5 py-2.5 bg-[var(--text)] text-[var(--bg)] text-sm font-medium rounded-lg hover:opacity-90 transition-opacity duration-150 group">
              <Upload size={14} />
              Upload Resume
              <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform duration-150" />
            </Link>
          </motion.div>

          {/* Feature grid */}
          <motion.div {...STAGGER} initial="initial" animate="animate"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FEATURES.map(({ href, icon: Icon, label, desc }) => (
              <motion.div key={href} {...STAGGER_ITEM}>
                <Link href={href}
                  className="grad-card flex items-start gap-4 p-5 bg-[var(--bg)] border border-[var(--border)] rounded-xl group">
                  <div className="w-8 h-8 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] flex items-center justify-center shrink-0">
                    <Icon size={14} className="text-[var(--text-muted)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text)] mb-0.5">{label}</p>
                    <p className="text-xs text-[var(--text-faint)]">{desc}</p>
                  </div>
                  <ArrowRight size={13} className="text-[var(--text-faint)] shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </PageTransition>
    );
  }

  // Resume uploaded — full dashboard
  const topJob   = jobs[0];
  const avgMatch = jobs.length > 0 ? Math.round(jobs.reduce((a, b) => a + b.matchPercent, 0) / jobs.length) : 0;
  const highPrioritySkills = roadmap.filter(r => r.priority === "High").length;

  const levelBadge = {
    Beginner:     "text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400",
    Intermediate: "text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400",
    Advanced:     "text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400",
  }[resume.experienceLevel];

  return (
    <PageTransition>
      <div className="p-8 max-w-5xl">

        {/* Header */}
        <motion.div {...FADE_UP} className="mb-8">
          <h1 className="text-2xl font-semibold text-[var(--text)] mb-1">
            Good to see you, {resume.name.split(" ")[0]}
          </h1>
          <p className="text-sm text-[var(--text-muted)]">Here&apos;s your career intelligence snapshot.</p>
        </motion.div>

        {/* KPI row */}
        <motion.div {...STAGGER} initial="initial" animate="animate"
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            {
              label: "Level",
              value: <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${levelBadge}`}>{resume.experienceLevel}</span>,
              sub: `${resume.yearsOfExperience}+ years exp`,
            },
            {
              label: "Skills",
              value: <span className="text-3xl font-semibold text-[var(--text)]">{resume.skills.length}</span>,
              sub: "Identified from resume",
            },
            {
              label: "Top Match",
              value: <span className="text-3xl font-semibold text-[var(--text)]">{topJob?.matchPercent ?? 0}%</span>,
              sub: topJob?.title ?? "—",
            },
            {
              label: "Avg Match",
              value: <span className="text-3xl font-semibold text-[var(--text)]">{avgMatch}%</span>,
              sub: `Across ${jobs.length} roles`,
            },
          ].map(({ label, value, sub }) => (
            <motion.div key={label} {...STAGGER_ITEM}
              className="kpi-card border border-[var(--border)] rounded-xl p-5">
              <p className="text-xs text-[var(--text-faint)] uppercase tracking-widest mb-3">{label}</p>
              <div className="mb-1.5">{value}</div>
              <p className="text-xs text-[var(--text-faint)] truncate">{sub}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Main grid */}
        <div className="grid grid-cols-3 gap-4 mb-4">

          {/* Top role card — 2 cols */}
          {topJob && (
            <motion.div {...FADE_UP} transition={{ duration: 0.18, ease: "easeOut", delay: 0.06 }}
              className="grad-card col-span-2 bg-[var(--bg)] border border-[var(--border)] rounded-xl p-6">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="text-xs text-[var(--text-faint)] uppercase tracking-widest mb-1.5">Best Matched Role</p>
                  <h2 className="text-xl font-semibold text-[var(--text)]">{topJob.title}</h2>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${
                  topJob.automationRisk === "Low"    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400" :
                  topJob.automationRisk === "Medium" ? "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400" :
                  "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"
                }`}>
                  {topJob.automationRisk} Automation Risk
                </span>
              </div>

              {/* Progress bar */}
              <div className="mb-5">
                <div className="flex justify-between text-xs text-[var(--text-muted)] mb-2">
                  <span>Match Score</span>
                  <span className="font-semibold text-[var(--text)]">{topJob.matchPercent}%</span>
                </div>
                <div className="h-2 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                  <motion.div className="h-full bg-[var(--text)] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${topJob.matchPercent}%` }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
                  />
                </div>
              </div>

              {/* Skills */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[var(--text-faint)] mb-2">
                    Matched <span className="text-[var(--text-muted)]">({topJob.matchedSkills.length})</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {topJob.matchedSkills.slice(0, 8).map(s => (
                      <span key={s} className="text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 px-2 py-0.5 rounded-md">{s}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-faint)] mb-2">
                    Missing <span className="text-[var(--text-muted)]">({topJob.missingSkills.length})</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {topJob.missingSkills.slice(0, 8).map(s => (
                      <span key={s} className="text-xs bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400 px-2 py-0.5 rounded-md">{s}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-[var(--border)]">
                <Link href="/jobs"
                  className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-150 group">
                  View all {jobs.length} role matches
                  <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform duration-150" />
                </Link>
              </div>
            </motion.div>
          )}

          {/* Roadmap summary — 1 col */}
          <motion.div {...FADE_UP} transition={{ duration: 0.18, ease: "easeOut", delay: 0.08 }}
            className="grad-card bg-[var(--bg)] border border-[var(--border)] rounded-xl p-6 flex flex-col">
            <p className="text-xs text-[var(--text-faint)] uppercase tracking-widest mb-4">Learning Roadmap</p>
            <div className="flex-1 space-y-2 mb-4">
              {roadmap.slice(0, 5).map((item, i) => (
                <div key={item.skill} className="flex items-center gap-3">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    item.priority === "High" ? "bg-red-400" :
                    item.priority === "Medium" ? "bg-amber-400" : "bg-[var(--border-strong)]"
                  }`} />
                  <span className="text-xs text-[var(--text)] capitalize flex-1 truncate">{item.skill}</span>
                  <span className="text-xs text-[var(--text-faint)] shrink-0">{item.timeline}</span>
                </div>
              ))}
              {roadmap.length === 0 && (
                <div className="flex items-center gap-2 text-xs text-emerald-600">
                  <CheckCircle size={13} />
                  All skills covered
                </div>
              )}
            </div>
            <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between">
              <span className="text-xs text-[var(--text-faint)]">{highPrioritySkills} high priority</span>
              <Link href="/roadmap"
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-150 flex items-center gap-1 group">
                Full roadmap <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform duration-150" />
              </Link>
            </div>
          </motion.div>
        </div>

        {/* All roles bar chart */}
        <motion.div {...FADE_UP} transition={{ duration: 0.18, ease: "easeOut", delay: 0.1 }}
          className="grad-card bg-[var(--bg)] border border-[var(--border)] rounded-xl p-6 mb-4">
          <div className="flex items-center justify-between mb-5">
            <p className="text-xs text-[var(--text-faint)] uppercase tracking-widest">All Role Matches</p>
            <Link href="/jobs" className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-150">View details →</Link>
          </div>
          <div className="space-y-3">
            {jobs.map((job, i) => (
              <div key={job.id} className="flex items-center gap-4">
                <span className="text-xs text-[var(--text-muted)] w-40 truncate shrink-0">{job.title}</span>
                <div className="flex-1 h-1.5 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      job.matchPercent >= 70 ? "bg-emerald-500" :
                      job.matchPercent >= 40 ? "bg-amber-400" : "bg-red-400"
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${job.matchPercent}%` }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 + i * 0.04 }}
                  />
                </div>
                <span className="text-xs font-medium text-[var(--text)] w-8 text-right shrink-0">{job.matchPercent}%</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Feature nav cards */}
        <motion.div {...STAGGER} initial="initial" animate="animate"
          className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: "/skills",   icon: Zap,           label: "Skill Gaps",     desc: `${jobs.reduce((a,b) => a + b.missingSkills.length, 0)} gaps found` },
            { href: "/career",   icon: TrendingUp,    label: "Career Path",    desc: "AI trajectory" },
            { href: "/roadmap",  icon: Map,           label: "Roadmap",        desc: `${roadmap.length} skills to learn` },
            { href: "/exchange", icon: ArrowLeftRight, label: "Skill Exchange", desc: `${state.exchangePoints} pts earned` },
          ].map(({ href, icon: Icon, label, desc }) => (
            <motion.div key={href} {...STAGGER_ITEM}>
              <Link href={href}
                className="grad-card flex items-center gap-3 p-4 bg-[var(--bg)] border border-[var(--border)] rounded-xl group">
                <div className="w-7 h-7 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] flex items-center justify-center shrink-0">
                  <Icon size={13} className="text-[var(--text-muted)]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[var(--text)] truncate">{label}</p>
                  <p className="text-xs text-[var(--text-faint)] truncate">{desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </PageTransition>
  );
}
