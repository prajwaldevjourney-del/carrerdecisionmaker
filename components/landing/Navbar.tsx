"use client";

import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function Navbar() {
  const { theme, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 navbar-blur border-b transition-all duration-300 ${
        scrolled ? "border-[var(--border)] shadow-sm" : "border-transparent"
      }`}
    >
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold tracking-tight text-[var(--text)] hover:opacity-80 transition-opacity">
          Carreriq
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/login"
            className="px-3 py-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors rounded-md hover:bg-[var(--bg-subtle)]"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="px-3 py-1.5 text-sm bg-[var(--text)] text-[var(--bg)] rounded-md hover:opacity-90 transition-all duration-200 ml-1"
          >
            Sign Up
          </Link>
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="ml-2 p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-subtle)] transition-all duration-200"
          >
            {theme === "dark"
              ? <Sun  size={15} className="rotate-0 transition-transform duration-300" />
              : <Moon size={15} className="rotate-0 transition-transform duration-300" />
            }
          </button>
        </nav>
      </div>
    </header>
  );
}
