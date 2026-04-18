"use client";

import { useState, useRef } from "react";
import { useAppState } from "@/lib/store";
import { useRouter } from "next/navigation";
import {
  Upload, FileText, CheckCircle, AlertCircle, Loader2, X,
  User, Mail, Phone, MapPin, Briefcase, GraduationCap, Code, Star, FolderOpen, Award
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FADE_UP } from "@/lib/motion";
import PageTransition from "@/components/PageTransition";
import type { ParsedResume, JobRole } from "@/types";

const PARSE_STEPS = [
  { label: "Reading PDF content",           icon: FileText },
  { label: "Extracting personal details",   icon: User },
  { label: "Identifying all skills",        icon: Code },
  { label: "Analyzing experience level",    icon: Briefcase },
  { label: "Computing job match scores",    icon: Star },
  { label: "Generating learning roadmap",   icon: GraduationCap },
  { label: "Building career trajectory",    icon: CheckCircle },
];

export default function UploadPage() {
  const { state, setState } = useAppState();
  const router   = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [file,     setFile]     = useState<File | null>(null);
  const [status,   setStatus]   = useState<"idle" | "parsing" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [step,     setStep]     = useState(-1);
  const [result,   setResult]   = useState<{ resume: ParsedResume; jobs: JobRole[] } | null>(null);

  const handleFile = (f: File) => {
    if (f.type !== "application/pdf") { setErrorMsg("Only PDF files are supported."); setStatus("error"); return; }
    setFile(f); setStatus("idle"); setErrorMsg(""); setResult(null);
  };

  const handleParse = async () => {
    if (!file) return;
    setStatus("parsing"); setErrorMsg(""); setStep(0); setResult(null);

    // Animate through steps, then hold on last step until API returns
    let cur = 0;
    const timings = [800, 1000, 1200, 1000, 1100, 1000, 800];
    let stopped = false;
    const advance = () => {
      if (stopped) return;
      cur++;
      if (cur < PARSE_STEPS.length - 1) {
        setStep(cur);
        setTimeout(advance, timings[cur] ?? 900);
      } else {
        // Hold on last step — keep spinning until API returns
        setStep(PARSE_STEPS.length - 2);
      }
    };
    setTimeout(advance, timings[0]);

    const fd = new FormData();
    fd.append("resume", file);

    try {
      const res  = await fetch("/api/parse-resume", { method: "POST", body: fd });
      stopped = true;
      const data = await res.json();
      setStep(PARSE_STEPS.length - 1); // all done

      if (!res.ok) { setErrorMsg(data.error || "Failed to parse resume."); setStatus("error"); return; }

      await new Promise(r => setTimeout(r, 400));

      setState({ ...state, resume: data.resume, jobs: data.jobs, roadmap: data.roadmap, career: data.career });
      setResult({ resume: data.resume, jobs: data.jobs });
      setStatus("done");

      setTimeout(() => router.push("/dashboard"), 5000);
    } catch {
      stopped = true;
      setErrorMsg("Network error. Please try again."); setStatus("error");
    }
  };

  return (
    <PageTransition>
      <div className="p-8 max-w-3xl">
        <motion.div {...FADE_UP} className="mb-8">
          <h1 className="text-2xl font-semibold text-[var(--text)] mb-1">Upload Resume</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Gemini AI reads every line of your resume and populates all sections automatically. Analysis takes 20–30 seconds.
          </p>
        </motion.div>

        <motion.div {...FADE_UP} transition={{ duration: 0.18, ease: "easeOut", delay: 0.04 }}>
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            onClick={() => status !== "parsing" && !file && inputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl transition-all duration-150 ${
              file ? "border-[var(--border)] bg-[var(--bg)]"
              : dragging ? "border-[var(--border-strong)] bg-[var(--bg-hover)] scale-[1.01]"
              : "border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)] cursor-pointer"
            }`}
          >
            <input ref={inputRef} type="file" accept=".pdf" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            <AnimatePresence mode="wait">
              {!file ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-14 px-8 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border)] flex items-center justify-center mb-4">
                    <Upload size={22} className="text-[var(--text-faint)]" />
                  </div>
                  <p className="text-sm font-medium text-[var(--text)] mb-1">Drop your PDF resume here</p>
                  <p className="text-xs text-[var(--text-faint)]">or click to browse · PDF only · Max 10MB</p>
                </motion.div>
              ) : (
                <motion.div key="file" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-4 p-5">
                  <div className="w-10 h-10 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] flex items-center justify-center shrink-0">
                    <FileText size={16} className="text-[var(--text-muted)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text)] truncate">{file.name}</p>
                    <p className="text-xs text-[var(--text-faint)]">{(file.size / 1024).toFixed(1)} KB · PDF</p>
                  </div>
                  {status === "idle" && (
                    <button onClick={e => { e.stopPropagation(); setFile(null); setStatus("idle"); }}
                      className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-faint)] hover:text-[var(--text)] transition-colors duration-150">
                      <X size={14} />
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Analyze button */}
          <AnimatePresence>
            {file && status === "idle" && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }} className="mt-3">
                <button onClick={handleParse}
                  className="w-full py-3 bg-[var(--text)] text-[var(--bg)] text-sm font-medium rounded-xl hover:opacity-90 transition-opacity duration-150">
                  Analyze Resume with Gemini AI
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Parsing progress */}
          <AnimatePresence>
            {status === "parsing" && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-4 grad-card bg-[var(--bg)] border border-[var(--border)] rounded-xl overflow-hidden">
                <div className="px-5 pt-5 pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-medium text-[var(--text)]">Gemini AI is analyzing your resume</p>
                    <span className="text-xs text-[var(--text-faint)]">{Math.min(step + 1, PARSE_STEPS.length)} / {PARSE_STEPS.length}</span>
                  </div>
                  <div className="h-1 bg-[var(--bg-subtle)] rounded-full overflow-hidden mb-5">
                    <motion.div className="h-full bg-[var(--text)] rounded-full"
                      animate={{ width: `${((step + 1) / PARSE_STEPS.length) * 100}%` }}
                      transition={{ duration: 0.3, ease: "easeOut" }} />
                  </div>
                  <div className="space-y-2.5">
                    {PARSE_STEPS.map((s, i) => {
                      const Icon = s.icon;
                      const done = i < step; const current = i === step; const pending = i > step;
                      return (
                        <motion.div key={s.label}
                          initial={{ opacity: 0, x: -8 }} animate={{ opacity: pending ? 0.35 : 1, x: 0 }}
                          transition={{ duration: 0.2, delay: i * 0.04 }}
                          className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                            done ? "bg-emerald-500" : current ? "bg-[var(--text)]" : "bg-[var(--bg-subtle)] border border-[var(--border)]"
                          }`}>
                            {done    ? <CheckCircle size={12} className="text-white" /> :
                             current ? <Loader2 size={11} className="text-[var(--bg)] animate-spin" /> :
                             <Icon size={11} className="text-[var(--text-faint)]" />}
                          </div>
                          <span className={`text-xs transition-colors duration-200 ${done || current ? "text-[var(--text)]" : "text-[var(--text-faint)]"}`}>
                            {s.label}
                          </span>
                          {current && (
                            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.2, repeat: Infinity }}
                              className="text-xs text-[var(--text-faint)] ml-auto">processing...</motion.span>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {status === "error" && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="mt-4 flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl">
                <AlertCircle size={15} className="text-red-500 shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">{errorMsg}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Full resume preview after parsing ── */}
        <AnimatePresence>
          {status === "done" && result && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }} className="mt-6 space-y-4">

              {/* Success banner */}
              <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                <CheckCircle size={15} className="text-emerald-600 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    Resume analyzed — {result.resume.skills.length} skills · {result.jobs.length} roles scored
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">All sections updated. Redirecting to dashboard in 4s...</p>
                </div>
                <button onClick={() => router.push("/dashboard")}
                  className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors duration-150 shrink-0">
                  Go now →
                </button>
              </div>

              {/* Personal info — from actual resume */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.05 }}
                className="grad-card bg-[var(--bg)] border border-[var(--border)] rounded-xl p-5">
                <p className="text-xs text-[var(--text-faint)] uppercase tracking-widest mb-4">Extracted from Resume</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: User,          label: "Name",         value: result.resume.name },
                    { icon: Mail,          label: "Email",        value: result.resume.email || "—" },
                    { icon: Phone,         label: "Phone",        value: result.resume.phone || "—" },
                    { icon: MapPin,        label: "Location",     value: result.resume.location || "—" },
                    { icon: Briefcase,     label: "Current Role", value: result.resume.currentRole || "—" },
                    { icon: GraduationCap, label: "Education",    value: result.resume.education || "—" },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-2.5">
                      <Icon size={13} className="text-[var(--text-faint)] mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-[var(--text-faint)]">{label}</p>
                        <p className="text-sm text-[var(--text)] truncate">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {result.resume.summary && (
                  <div className="mt-4 pt-4 border-t border-[var(--border)]">
                    <p className="text-xs text-[var(--text-faint)] mb-1.5">AI Summary</p>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">{result.resume.summary}</p>
                  </div>
                )}
              </motion.div>

              {/* Experience stats */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.08 }}
                className="grad-card bg-[var(--bg)] border border-[var(--border)] rounded-xl p-5">
                <p className="text-xs text-[var(--text-faint)] uppercase tracking-widest mb-4">Experience</p>
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-2xl font-semibold text-[var(--text)]">{result.resume.yearsOfExperience}</p>
                    <p className="text-xs text-[var(--text-faint)]">Years</p>
                  </div>
                  <div className="w-px h-10 bg-[var(--border)]" />
                  <div>
                    <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${
                      result.resume.experienceLevel === "Advanced"     ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" :
                      result.resume.experienceLevel === "Intermediate" ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400" :
                      "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                    }`}>{result.resume.experienceLevel}</span>
                    <p className="text-xs text-[var(--text-faint)] mt-1">Level</p>
                  </div>
                  <div className="w-px h-10 bg-[var(--border)]" />
                  <div>
                    <p className="text-2xl font-semibold text-[var(--text)]">{result.resume.skills.length}</p>
                    <p className="text-xs text-[var(--text-faint)]">Skills</p>
                  </div>
                  {result.resume.certifications?.length > 0 && (
                    <>
                      <div className="w-px h-10 bg-[var(--border)]" />
                      <div>
                        <p className="text-2xl font-semibold text-[var(--text)]">{result.resume.certifications.length}</p>
                        <p className="text-xs text-[var(--text-faint)]">Certs</p>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>

              {/* Work experience — from actual resume */}
              {result.resume.workExperience?.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: 0.11 }}
                  className="grad-card bg-[var(--bg)] border border-[var(--border)] rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Briefcase size={13} className="text-[var(--text-faint)]" />
                    <p className="text-xs text-[var(--text-faint)] uppercase tracking-widest">Work Experience</p>
                  </div>
                  <div className="space-y-4">
                    {result.resume.workExperience.map((exp, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.15, delay: 0.12 + i * 0.05 }}
                        className={`${i < result.resume.workExperience.length - 1 ? "pb-4 border-b border-[var(--border)]" : ""}`}>
                        <div className="flex items-start justify-between mb-1">
                          <div>
                            <p className="text-sm font-medium text-[var(--text)]">{exp.title}</p>
                            <p className="text-xs text-[var(--text-muted)]">{exp.company}</p>
                          </div>
                          <span className="text-xs text-[var(--text-faint)] shrink-0 ml-4">{exp.duration}</span>
                        </div>
                        {exp.highlights?.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {exp.highlights.slice(0, 3).map((h, j) => (
                              <li key={j} className="flex items-start gap-2 text-xs text-[var(--text-muted)]">
                                <span className="w-1 h-1 rounded-full bg-[var(--border-strong)] mt-1.5 shrink-0" />
                                {h}
                              </li>
                            ))}
                          </ul>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Projects — from actual resume */}
              {result.resume.projects?.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: 0.14 }}
                  className="grad-card bg-[var(--bg)] border border-[var(--border)] rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <FolderOpen size={13} className="text-[var(--text-faint)]" />
                    <p className="text-xs text-[var(--text-faint)] uppercase tracking-widest">Projects</p>
                  </div>
                  <div className="space-y-3">
                    {result.resume.projects.map((proj, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.15, delay: 0.15 + i * 0.05 }}
                        className={`${i < result.resume.projects.length - 1 ? "pb-3 border-b border-[var(--border)]" : ""}`}>
                        <p className="text-sm font-medium text-[var(--text)] mb-0.5">{proj.name}</p>
                        {proj.description && <p className="text-xs text-[var(--text-muted)] mb-2">{proj.description}</p>}
                        {proj.techStack?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {proj.techStack.map(t => (
                              <span key={t} className="text-xs bg-[var(--bg-subtle)] text-[var(--text-faint)] px-2 py-0.5 rounded border border-[var(--border)]">{t}</span>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Certifications */}
              {result.resume.certifications?.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: 0.17 }}
                  className="grad-card bg-[var(--bg)] border border-[var(--border)] rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Award size={13} className="text-[var(--text-faint)]" />
                    <p className="text-xs text-[var(--text-faint)] uppercase tracking-widest">Certifications</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.resume.certifications.map((c, i) => (
                      <span key={i} className="text-xs bg-[var(--bg-subtle)] text-[var(--text-muted)] px-2.5 py-1 rounded-md border border-[var(--border)]">{c}</span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* All skills */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.2 }}
                className="grad-card bg-[var(--bg)] border border-[var(--border)] rounded-xl p-5">
                <p className="text-xs text-[var(--text-faint)] uppercase tracking-widest mb-4">
                  All Extracted Skills ({result.resume.skills.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {result.resume.skills.map((s, i) => (
                    <motion.span key={s}
                      initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.1, delay: i * 0.012 }}
                      className="text-xs bg-[var(--bg-subtle)] text-[var(--text-muted)] px-2.5 py-1 rounded-md border border-[var(--border)] hover:border-[var(--border-strong)] hover:text-[var(--text)] transition-colors duration-150">
                      {s}
                    </motion.span>
                  ))}
                </div>
              </motion.div>

              {/* Job match preview */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.23 }}
                className="grad-card bg-[var(--bg)] border border-[var(--border)] rounded-xl p-5">
                <p className="text-xs text-[var(--text-faint)] uppercase tracking-widest mb-4">Job Match Scores</p>
                <div className="space-y-2.5">
                  {result.jobs.map((job, i) => (
                    <motion.div key={job.id}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.15, delay: 0.24 + i * 0.05 }}
                      className="flex items-center gap-3">
                      <span className="text-xs text-[var(--text-muted)] w-36 truncate shrink-0">{job.title}</span>
                      <div className="flex-1 h-1.5 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${job.matchPercent >= 70 ? "bg-emerald-500" : job.matchPercent >= 40 ? "bg-amber-400" : "bg-red-400"}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${job.matchPercent}%` }}
                          transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 + i * 0.06 }} />
                      </div>
                      <span className="text-xs font-semibold text-[var(--text)] w-8 text-right shrink-0">{job.matchPercent}%</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

            </motion.div>
          )}
        </AnimatePresence>

        {/* Existing resume preview (idle, no file) */}
        <AnimatePresence>
          {state.resume && status === "idle" && !file && (
            <motion.div {...FADE_UP} transition={{ duration: 0.18, ease: "easeOut", delay: 0.08 }}
              className="mt-8 grad-card bg-[var(--bg)] border border-[var(--border)] rounded-xl p-5">
              <p className="text-xs text-[var(--text-faint)] uppercase tracking-widest mb-4">Current Resume</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { l: "Name",    v: state.resume.name },
                  { l: "Role",    v: state.resume.currentRole || state.resume.experienceLevel },
                  { l: "Email",   v: state.resume.email || "—" },
                  { l: "Skills",  v: `${state.resume.skills.length} identified` },
                ].map(({ l, v }) => (
                  <div key={l}>
                    <p className="text-xs text-[var(--text-faint)] mb-0.5">{l}</p>
                    <p className="text-sm font-medium text-[var(--text)]">{v}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {state.resume.skills.slice(0, 24).map(s => (
                  <span key={s} className="text-xs bg-[var(--bg-subtle)] text-[var(--text-muted)] px-2 py-0.5 rounded-md border border-[var(--border)]">{s}</span>
                ))}
                {state.resume.skills.length > 24 && (
                  <span className="text-xs text-[var(--text-faint)] px-2 py-0.5">+{state.resume.skills.length - 24} more</span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
