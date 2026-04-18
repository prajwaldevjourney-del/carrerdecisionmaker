"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { Moon, Sun } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("All fields are required."); return; }
    setLoading(true);
    // Simulate auth — replace with real auth provider
    await new Promise(r => setTimeout(r, 600));
    setLoading(false);
    router.push("/dashboard");
  };

  return (
    <div className="app-bg text-[var(--text)] min-h-screen flex flex-col">
      {/* Minimal nav */}
      <header className="border-b border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold tracking-tight text-[var(--text)]">Carreriq</Link>
          <button onClick={toggle} aria-label="Toggle theme" className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-subtle)] transition-colors">
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <h1 className="text-xl font-semibold text-[var(--text)] mb-1">Log in</h1>
          <p className="text-sm text-[var(--text-muted)] mb-8">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-[var(--text)] underline underline-offset-2">Sign up</Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2.5 text-sm bg-[var(--bg-subtle)] border border-[var(--border)] rounded-md text-[var(--text)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--text-muted)] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 text-sm bg-[var(--bg-subtle)] border border-[var(--border)] rounded-md text-[var(--text)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--text-muted)] transition-colors"
              />
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[var(--text)] text-[var(--bg)] text-sm font-medium rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
