"use client";

import { useAppState } from "@/lib/store";
import Link from "next/link";
import { Upload, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { FADE_UP, STAGGER, STAGGER_ITEM } from "@/lib/motion";
import PageTransition from "@/components/PageTransition";

const priorityConfig = {
  High:   { dot: "bg-red-400",   badge: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",     bar: "bg-red-400" },
  Medium: { dot: "bg-amber-400", badge: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400", bar: "bg-amber-400" },
  Low:    { dot: "bg-[var(--border-strong)]", badge: "bg-[var(--bg-subtle)] text-[var(--text-muted)]",   bar: "bg-[var(--border-strong)]" },
};

export default function RoadmapPage() {
  const { state } = useAppState();
  const { roadmap, resume } = state;

  if (!resume) {
    return (
      <PageTransition>
        <div className="p-8 max-w-2xl">
          <h1 className="text-2xl font-semibold text-[var(--text)] mb-2">Learning Roadmap</h1>
          <p className="text-sm text-[var(--text-muted)] mb-6">Upload your resume to generate your personalized roadmap.</p>
          <Link href="/upload" className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--text)] text-[var(--bg)] text-sm rounded-lg hover:opacity-90 transition-opacity duration-150">
            <Upload size={13} /> Upload Resume
          </Link>
        </div>
      </PageTransition>
    );
  }

  const groups = [
    { label: "High Priority",   items: roadmap.filter(r => r.priority === "High") },
    { label: "Medium Priority", items: roadmap.filter(r => r.priority === "Medium") },
    { label: "Low Priority",    items: roadmap.filter(r => r.priority === "Low") },
  ].filter(g => g.items.length > 0);

  const totalWeeks = roadmap.reduce((acc, item) => {
    const n = parseInt(item.timeline);
    return acc + (isNaN(n) ? 0 : n);
  }, 0);

  return (
    <PageTransition>
    <div className="p-8 max-w-3xl">
      <motion.div {...FADE_UP} className="mb-6">
        <h1 className="text-2xl font-semibold text-[var(--text)] mb-1">Learning Roadmap</h1>
        <p className="text-sm text-[var(--text-muted)]">
          {roadmap.length} skills · ~{totalWeeks} weeks total · ordered by impact
        </p>
      </motion.div>

      {/* Summary bar */}
      {roadmap.length > 0 && (
        <motion.div {...FADE_UP} transition={{ duration: 0.18, ease: "easeOut", delay: 0.04 }}
          className="bg-[var(--bg)] border border-[var(--border)] rounded-xl p-5 mb-6">
          <div className="flex items-center gap-6 mb-3">
            {(["High", "Medium", "Low"] as const).map(p => {
              const count = roadmap.filter(r => r.priority === p).length;
              const cfg = priorityConfig[p];
              return (
                <div key={p} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  <span className="text-xs text-[var(--text-muted)]">{count} {p}</span>
                </div>
              );
            })}
          </div>
          {/* Stacked bar */}
          <div className="h-1.5 bg-[var(--bg-subtle)] rounded-full overflow-hidden flex">
            {(["High", "Medium", "Low"] as const).map(p => {
              const count = roadmap.filter(r => r.priority === p).length;
              const pct = (count / roadmap.length) * 100;
              return (
                <motion.div key={p}
                  className={`h-full ${priorityConfig[p].bar}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              );
            })}
          </div>
        </motion.div>
      )}

      {roadmap.length === 0 ? (
        <motion.div {...FADE_UP} transition={{ duration: 0.18, ease: "easeOut", delay: 0.04 }}
          className="bg-[var(--bg)] border border-[var(--border)] rounded-xl p-10 text-center">
          <CheckCircle size={24} className="mx-auto text-emerald-500 mb-3" />
          <p className="text-sm font-medium text-[var(--text)] mb-1">All skills covered</p>
          <p className="text-xs text-[var(--text-muted)]">You have all the skills needed for your top roles.</p>
        </motion.div>
      ) : (
        <div className="space-y-8">
          {groups.map(({ label, items }) => (
            <div key={label}>
              <p className="text-xs text-[var(--text-faint)] uppercase tracking-widest mb-3">{label}</p>
              <motion.div {...STAGGER} initial="initial" animate="animate" className="space-y-2">
                {items.map((item, i) => {
                  const cfg = priorityConfig[item.priority];
                  return (
                    <motion.div key={item.skill} {...STAGGER_ITEM}
                      className="bg-[var(--bg)] border border-[var(--border)] rounded-xl px-5 py-4 flex items-start gap-4 hover:border-[var(--border-strong)] transition-colors duration-150">
                      <div className="flex items-center gap-2.5 pt-0.5 shrink-0">
                        <span className="text-xs text-[var(--text-faint)] font-mono w-5">{String(i + 1).padStart(2, "0")}</span>
                        <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-medium text-[var(--text)] capitalize">{item.skill}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>{item.priority}</span>
                        </div>
                        <p className="text-xs text-[var(--text-muted)] leading-relaxed">{item.reason}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-semibold text-[var(--text)]">{item.timeline}</p>
                        <p className="text-xs text-[var(--text-faint)]">est.</p>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          ))}
        </div>
      )}
    </div>
    </PageTransition>
  );
}
