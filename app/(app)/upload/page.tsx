"use client";

import { useState, useRef } from "react";
import { useAppState } from "@/lib/store";
import { useRouter } from "next/navigation";
import {
  Upload, FileText, CheckCircle, AlertCircle, Loader2, X,
  User, Mail, Phone, MapPin, Briefcase, GraduationCap, Code, Star
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FADE_UP } from "@/lib/motion";
import PageTransition from "@/components/PageTransition";

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
  const [parsedData, setParsedData] = useState<typeof state | null>(null);

  const handleFile = (f: File) => {
    if (f.type !== "application/pdf") {
      setErrorMsg("Only PDF files are supported.");
      setStatus("error");
      return;
    }
    setFile(f);
    setStatus("idle");
    setErrorMsg("");
    setParsedData(null);
  };

  const handleParse = async () => {
    if (!file) return;
    setStatus("parsing");
    setErrorMsg("");
    setStep(0);
    setParsedData(null);

    // Animate through steps with realistic timing
    let currentStep = 0;
    const stepTimings = [400, 600, 800, 600, 700, 600, 500];
    const advanceStep = () => {
      currentStep++;
      if (currentStep < PARSE_STEPS.length) {
        setStep(currentStep);
        setTimeout(advanceStep, stepTimings[currentStep] ?? 600);
      }
    };
    setTimeout(advanceStep, stepTimings[0]);

    const fd = new FormData();
    fd.append("resume", file);

    try {
      const res  = await fetch("/api/parse-resume", { method: "POST", body: fd });
      const data = await res.json();

      // Complete all steps
      setStep(PARSE_STEPS.length - 1);

      if (!res.ok) {
        setErrorMsg(data.error || "Failed to parse resume.");
        setStatus("error");
        return;
      }

      // Small delay to show completion
      await new Promise(r => setTimeout(r, 600));

      const newState = {
        ...state,
        resume: data.resume,
        jobs: data.jobs,
        roadmap: data.roadmap,
        career: data.career,
      };
      setState(newState);
      setParsedData(newState);
      setStatus("done");

    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  };

  const resume = parsedData?.resume ?? state.resume;

  return (
    <PageTransition>
      <div className="p-8 max-w-3xl">
        <motion.div {...FADE_UP} className="mb-8">
          <h1 className="text-2xl font-semibold text-[var(--text)] mb-1">Upload Resume</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Upload your PDF resume. Gemini AI will extract every detail and generate your full career analysis.
          </p>
        </motion.div>

        <motion.div {...FADE_UP} transition={{ duration: 0.18, ease: "easeOut", delay: 0.04 }}>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => {
              e.preventDefault(); setDragging(false);
              const f = e.dataTransfer.files[0];
              if (f) handleFile(f);
            }}
            onClick={() => status !== "parsing" && !file && inputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl transition-all duration-150 ${
              file
                ? "border-[var(--border)] bg-[var(--bg)]"
                : dragging
                ? "border-[var(--border-strong)] bg-[var(--bg-hover)] scale-[1.01]"
                : "border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)] cursor-pointer"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />

            <AnimatePresence mode="wait">
              {!file ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-14 px-8 text-center"
                >
                  <motion.div
                    className="w-14 h-14 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border)] flex items-center justify-center mb-4"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Upload size={22} className="text-[var(--text-faint)]" />
                  </motion.div>
                  <p className="text-sm font-medium text-[var(--text)] mb-1">Drop your PDF resume here</p>
                  <p className="text-xs text-[var(--text-faint)]">or click to browse · PDF only · Max 10MB</p>
                </motion.div>
              ) : (
                <motion.div
                  key="file"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-4 p-5"
                >
                  <div className="w-10 h-10 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] flex items-center justify-center shrink-0">
                    <FileText size={16} className="text-[var(--text-muted)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text)] truncate">{file.name}</p>
                    <p className="text-xs text-[var(--text-faint)]">{(file.size / 1024).toFixed(1)} KB · PDF</p>
                  </div>
                  {status === "idle" && (
                    <button
                      onClick={e => { e.stopPropagation(); setFile(null); setStatus("idle"); }}
                      className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-faint)] hover:text-[var(--text)] transition-colors duration-150"
                    >
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
              <motion.div
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="mt-3"
              >
                <button
                  onClick={handleParse}
                  className="w-full py-3 bg-[var(--text)] text-[var(--bg)] text-sm font-medium rounded-xl hover:opacity-90 transition-opacity duration-150"
                >
                  Analyze Resume with AI
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Parsing progress */}
          <AnimatePresence>
            {status === "parsing" && (
              <motion.div
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="mt-4 bg-[var(--bg)] border border-[var(--border)] rounded-xl overflow-hidden"
              >
                <div className="px-5 pt-5 pb-2">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-medium text-[var(--text)]">Analyzing your resume</p>
                    <span className="text-xs text-[var(--text-faint)]">{step + 1} / {PARSE_STEPS.length}</span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1 bg-[var(--bg-subtle)] rounded-full overflow-hidden mb-5">
                    <motion.div
                      className="h-full bg-[var(--text)] rounded-full"
                      animate={{ width: `${((step + 1) / PARSE_STEPS.length) * 100}%` }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    />
                  </div>

                  {/* Steps */}
                  <div className="space-y-2.5 pb-3">
                    {PARSE_STEPS.map((s, i) => {
                      const Icon = s.icon;
                      const done    = i < step;
                      const current = i === step;
                      const pending = i > step;
                      return (
                        <motion.div
                          key={s.label}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: pending ? 0.35 : 1, x: 0 }}
                          transition={{ duration: 0.2, delay: i * 0.04 }}
                          className="flex items-center gap-3"
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                            done    ? "bg-emerald-500" :
                            current ? "bg-[var(--text)]" :
                            "bg-[var(--bg-subtle)] border border-[var(--border)]"
                          }`}>
                            {done    ? <CheckCircle size={12} className="text-white" /> :
                             current ? <Loader2 size={11} className="text-[var(--bg)] animate-spin" /> :
                             <Icon size={11} className="text-[var(--text-faint)]" />}
                          </div>
                          <span className={`text-xs transition-colors duration-200 ${
                            done || current ? "text-[var(--text)]" : "text-[var(--text-faint)]"
                          }`}>
                            {s.label}
                          </span>
                          {current && (
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: [0, 1, 0] }}
                              transition={{ duration: 1.2, repeat: Infinity }}
                              className="text-xs text-[var(--text-faint)] ml-auto"
                            >
                              processing...
                            </motion.span>
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
              <motion.div
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="mt-4 flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl"
              >
                <AlertCircle size={15} className="text-red-500 shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">{errorMsg}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Full resume preview — shown after parsing */}
        <AnimatePresence>
          {status === "done" && resume && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="mt-6 space-y-4"
            >
              {/* Success banner */}
              <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                <CheckCircle size={15} className="text-emerald-600 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    Resume analyzed — {resume.skills.length} skills extracted
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">
                    Redirecting to dashboard...
                  </p>
                </div>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors duration-150"
                >
                  Go now →
                </button>
              </div>

              {/* Personal info */}
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.05 }}
                className="grad-card bg-[var(--bg)] border border-[var(--border)] rounded-xl p-5"
              >
                <p className="text-xs text-[var(--text-faint)] uppercase tracking-widest mb-4">Personal Information</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: User,       label: "Name",             value: resume.name },
                    { icon: Mail,       label: "Email",            value: resume.email || "—" },
                    { icon: Phone,      label: "Phone",            value: (resume as any).phone || "—" }, // eslint-disable-line @typescript-eslint/no-explicit-any
                    { icon: MapPin,     label: "Location",         value: (resume as any).location || "—" }, // eslint-disable-line @typescript-eslint/no-explicit-any
                    { icon: Briefcase,  label: "Current Role",     value: (resume as any).currentRole || "—" }, // eslint-disable-line @typescript-eslint/no-explicit-any
                    { icon: GraduationCap, label: "Education",     value: (resume as any).education || "—" }, // eslint-disable-line @typescript-eslint/no-explicit-any
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
                {(resume as any).summary && ( // eslint-disable-line @typescript-eslint/no-explicit-any
                  <div className="mt-4 pt-4 border-t border-[var(--border)]">
                    <p className="text-xs text-[var(--text-faint)] mb-1.5">Summary</p>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">{(resume as any).summary}</p> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                  </div>
                )}
              </motion.div>

              {/* Experience */}
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
                className="grad-card bg-[var(--bg)] border border-[var(--border)] rounded-xl p-5"
              >
                <p className="text-xs text-[var(--text-faint)] uppercase tracking-widest mb-4">Experience</p>
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-2xl font-semibold text-[var(--text)]">{resume.yearsOfExperience}+</p>
                    <p className="text-xs text-[var(--text-faint)]">Years</p>
                  </div>
                  <div className="w-px h-10 bg-[var(--border)]" />
                  <div>
                    <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${
                      resume.experienceLevel === "Advanced"     ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" :
                      resume.experienceLevel === "Intermediate" ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400" :
                      "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                    }`}>
                      {resume.experienceLevel}
                    </span>
                    <p className="text-xs text-[var(--text-faint)] mt-1">Level</p>
                  </div>
                  <div className="w-px h-10 bg-[var(--border)]" />
                  <div>
                    <p className="text-2xl font-semibold text-[var(--text)]">{resume.skills.length}</p>
                    <p className="text-xs text-[var(--text-faint)]">Skills found</p>
                  </div>
                </div>
              </motion.div>

              {/* All skills */}
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.15 }}
                className="grad-card bg-[var(--bg)] border border-[var(--border)] rounded-xl p-5"
              >
                <p className="text-xs text-[var(--text-faint)] uppercase tracking-widest mb-4">
                  All Extracted Skills ({resume.skills.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {resume.skills.map((s, i) => (
                    <motion.span
                      key={s}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.12, delay: i * 0.015 }}
                      className="text-xs bg-[var(--bg-subtle)] text-[var(--text-muted)] px-2.5 py-1 rounded-md border border-[var(--border)] hover:border-[var(--border-strong)] hover:text-[var(--text)] transition-colors duration-150"
                    >
                      {s}
                    </motion.span>
                  ))}
                </div>
              </motion.div>

              {/* Job matches preview */}
              {parsedData?.jobs && parsedData.jobs.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: 0.2 }}
                  className="grad-card bg-[var(--bg)] border border-[var(--border)] rounded-xl p-5"
                >
                  <p className="text-xs text-[var(--text-faint)] uppercase tracking-widest mb-4">Job Match Preview</p>
                  <div className="space-y-2.5">
                    {parsedData.jobs.slice(0, 5).map((job, i) => (
                      <motion.div
                        key={job.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.15, delay: 0.2 + i * 0.05 }}
                        className="flex items-center gap-3"
                      >
                        <span className="text-xs text-[var(--text-muted)] w-36 truncate shrink-0">{job.title}</span>
                        <div className="flex-1 h-1.5 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${
                              job.matchPercent >= 70 ? "bg-emerald-500" :
                              job.matchPercent >= 40 ? "bg-amber-400" : "bg-red-400"
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${job.matchPercent}%` }}
                            transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 + i * 0.06 }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-[var(--text)] w-8 text-right shrink-0">
                          {job.matchPercent}%
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Previous resume preview (idle state) */}
        <AnimatePresence>
          {state.resume && status === "idle" && !file && (
            <motion.div
              {...FADE_UP}
              transition={{ duration: 0.18, ease: "easeOut", delay: 0.08 }}
              className="mt-8 bg-[var(--bg)] border border-[var(--border)] rounded-xl p-5"
            >
              <p className="text-xs text-[var(--text-faint)] uppercase tracking-widest mb-4">Current Resume</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { l: "Name",    v: state.resume.name },
                  { l: "Level",   v: state.resume.experienceLevel },
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
                {state.resume.skills.slice(0, 20).map(s => (
                  <span key={s} className="text-xs bg-[var(--bg-subtle)] text-[var(--text-muted)] px-2 py-0.5 rounded-md border border-[var(--border)]">{s}</span>
                ))}
                {state.resume.skills.length > 20 && (
                  <span className="text-xs text-[var(--text-faint)] px-2 py-0.5">+{state.resume.skills.length - 20} more</span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
