"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Upload, Briefcase, Zap, Map, TrendingUp, ArrowLeftRight,
  Moon, Sun,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { motion } from "framer-motion";

const NAV = [
  { href: "/dashboard", label: "Dashboard",     icon: LayoutDashboard },
  { href: "/upload",    label: "Upload Resume",  icon: Upload },
  { href: "/jobs",      label: "Job Matches",    icon: Briefcase },
  { href: "/skills",    label: "Skill Gaps",     icon: Zap },
  { href: "/roadmap",   label: "Roadmap",        icon: Map },
  { href: "/career",    label: "Career Path",    icon: TrendingUp },
  { href: "/exchange",  label: "Skill Exchange", icon: ArrowLeftRight },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-[var(--bg)] border-r border-[var(--border)] flex flex-col z-50">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[var(--border)]">
        <span className="text-sm font-semibold tracking-tight text-[var(--text)]">Carreriq</span>
        <p className="text-xs text-[var(--text-faint)] mt-0.5">Career Intelligence</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-150 group ${
                active
                  ? "text-[var(--text)] font-medium"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              {/* Active background pill */}
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-[var(--bg-subtle)] rounded-lg"
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  style={{ zIndex: -1 }}
                />
              )}
              {/* Hover background */}
              {!active && (
                <span className="absolute inset-0 rounded-lg bg-[var(--bg-subtle)] opacity-0 group-hover:opacity-100 transition-opacity duration-150" style={{ zIndex: -1 }} />
              )}
              <Icon
                size={15}
                strokeWidth={active ? 2.2 : 1.8}
                className={active ? "text-[var(--text)]" : "text-[var(--text-faint)] group-hover:text-[var(--text-muted)] transition-colors duration-150"}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-[var(--border)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {theme === "dark"
              ? <Moon size={13} className="text-[var(--text-faint)]" />
              : <Sun  size={13} className="text-[var(--text-faint)]" />
            }
            <span className="text-xs text-[var(--text-faint)]">
              {theme === "dark" ? "Dark" : "Light"}
            </span>
          </div>
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border transition-colors duration-200 focus:outline-none ${
              theme === "dark"
                ? "bg-[var(--text)] border-[var(--text)]"
                : "bg-[var(--bg-hover)] border-[var(--border-strong)]"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-3.5 w-3.5 rounded-full bg-[var(--bg)] shadow-sm transition-transform duration-200 ease-out my-auto ${
                theme === "dark" ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
        <p className="text-xs text-[var(--text-faint)]">v1.0.0</p>
      </div>
    </aside>
  );
}
