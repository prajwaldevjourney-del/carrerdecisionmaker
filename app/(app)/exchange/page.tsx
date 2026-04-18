"use client";

import { useState } from "react";
import { useAppState } from "@/lib/store";
import { Plus, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FADE_UP, STAGGER, STAGGER_ITEM } from "@/lib/motion";
import PageTransition from "@/components/PageTransition";

export default function ExchangePage() {
  const { state, setState } = useAppState();
  const { exchange, exchangePoints, resume } = state;
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const handleAdd = () => {
    const skill = input.trim().toLowerCase();
    if (!skill) return;
    if (exchange.some(e => e.skill === skill)) { setError("Already added."); return; }
    if (skill.length < 2) { setError("Too short."); return; }
    setState({ ...state, exchange: [...exchange, { skill, addedAt: new Date().toISOString() }], exchangePoints: exchangePoints + 10 });
    setInput(""); setError("");
  };

  return (
    <PageTransition>
    <div className="p-8">
      <div className="max-w-2xl">
        <motion.div {...FADE_UP} className="mb-8">
          <h1 className="text-2xl font-semibold text-[var(--text)] mb-1">Skill Exchange</h1>
          <p className="text-sm text-[var(--text-muted)]">Add skills you can teach. Earn points for each contribution.</p>
        </motion.div>

        {/* Points */}
        <motion.div {...FADE_UP} transition={{ duration: 0.18, ease: "easeOut", delay: 0.04 }}
          className="grad-card bg-[var(--bg)] border border-[var(--border)] rounded-lg p-5 mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--text-faint)] uppercase tracking-wide mb-1">Your Points</p>
            <p className="text-3xl font-semibold text-[var(--text)]">{exchangePoints}</p>
          </div>
          <div className="flex items-center gap-1.5 text-amber-500">
            <Star size={18} fill="currentColor" />
            <span className="text-sm font-medium text-[var(--text-muted)]">+10 per skill</span>
          </div>
        </motion.div>

        {/* Add */}
        <motion.div {...FADE_UP} transition={{ duration: 0.18, ease: "easeOut", delay: 0.06 }}
          className="grad-card bg-[var(--bg)] border border-[var(--border)] rounded-lg p-5 mb-5">
          <p className="text-xs text-[var(--text-faint)] uppercase tracking-wide mb-3">Add a Skill You Can Teach</p>
          <div className="flex gap-2">
            <input type="text" value={input} onChange={e => { setInput(e.target.value); setError(""); }}
              onKeyDown={e => { if (e.key === "Enter") handleAdd(); }}
              placeholder="e.g. React, Docker, SQL..."
              className="flex-1 text-sm px-3 py-2.5 border border-[var(--border)] rounded-md bg-[var(--bg-subtle)] text-[var(--text)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--border-strong)] transition-colors duration-150" />
            <button onClick={handleAdd} disabled={!input.trim()}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[var(--text)] text-[var(--bg)] text-sm rounded-md hover:opacity-90 disabled:opacity-40 transition-opacity duration-150">
              <Plus size={14} /> Add
            </button>
          </div>
          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        </motion.div>

        {/* Resume skills */}
        {resume && resume.skills.length > 0 && (
          <motion.div {...FADE_UP} transition={{ duration: 0.18, ease: "easeOut", delay: 0.08 }}
            className="grad-card bg-[var(--bg)] border border-[var(--border)] rounded-lg p-5 mb-5">
            <p className="text-xs text-[var(--text-faint)] uppercase tracking-wide mb-3">From Your Resume</p>
            <div className="flex flex-wrap gap-1.5">
              {resume.skills.map(s => {
                const added = exchange.some(e => e.skill === s);
                return (
                  <button key={s} disabled={added}
                    onClick={() => { if (!added) setState({ ...state, exchange: [...exchange, { skill: s, addedAt: new Date().toISOString() }], exchangePoints: exchangePoints + 10 }); }}
                    className={`text-xs px-2.5 py-1 rounded border transition-colors duration-150 ${
                      added
                        ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800"
                        : "bg-[var(--bg-subtle)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--border-strong)] hover:text-[var(--text)]"
                    }`}>
                    {added ? "✓ " : "+ "}{s}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* List */}
        {exchange.length > 0 && (
          <motion.div {...FADE_UP} transition={{ duration: 0.18, ease: "easeOut", delay: 0.1 }}
            className="grad-card bg-[var(--bg)] border border-[var(--border)] rounded-lg p-5">
            <p className="text-xs text-[var(--text-faint)] uppercase tracking-wide mb-3">Your Exchange Skills ({exchange.length})</p>
            <motion.div {...STAGGER} initial="initial" animate="animate" className="space-y-0 divide-y divide-[var(--border)]">
              <AnimatePresence>
                {exchange.map((item, i) => (
                  <motion.div key={item.skill} {...STAGGER_ITEM} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[var(--text-faint)] w-5 font-mono">{String(i + 1).padStart(2, "0")}</span>
                      <span className="text-sm text-[var(--text)] capitalize">{item.skill}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-amber-600 font-medium">+10 pts</span>
                      <span className="text-xs text-[var(--text-faint)]">
                        {new Date(item.addedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}

        {exchange.length === 0 && (
          <p className="text-sm text-[var(--text-faint)] text-center py-8">No skills added yet.</p>
        )}
      </div>
    </div>
    </PageTransition>
  );
}
