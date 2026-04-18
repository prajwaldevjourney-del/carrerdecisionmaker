"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAppState } from "@/lib/store";
import { Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/upload":    "Upload Resume",
  "/jobs":      "Job Matches",
  "/skills":    "Skill Gaps",
  "/roadmap":   "Roadmap",
  "/career":    "Career Path",
  "/exchange":  "Skill Exchange",
};

export default function TopBar() {
  const pathname = usePathname();
  const { state } = useAppState();
  const title = PAGE_TITLES[pathname] ?? "Carreriq";

  return (
    <header className="h-14 topbar-bg border-b border-[var(--border)] flex items-center justify-between px-8 shrink-0">
      <AnimatePresence mode="wait">
        <motion.h2
          key={title}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="text-sm font-semibold text-[var(--text)]"
        >
          {title}
        </motion.h2>
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {state.resume ? (
          <motion.div
            key="resume-info"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="flex items-center gap-2.5"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-[var(--text-muted)]">{state.resume.name}</span>
            <span className="text-xs text-[var(--text-faint)]">·</span>
            <span className="text-xs text-[var(--text-faint)]">{state.resume.skills.length} skills</span>
            <span className="text-xs text-[var(--text-faint)]">·</span>
            <span className="text-xs text-[var(--text-faint)]">{state.resume.experienceLevel}</span>
          </motion.div>
        ) : (
          <motion.div
            key="upload-cta"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <Link
              href="/upload"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[var(--text)] text-[var(--bg)] rounded-md hover:opacity-90 transition-opacity duration-150"
            >
              <Upload size={12} /> Upload Resume
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
