import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)]">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <span className="text-xs text-[var(--text-faint)]">Carreriq</span>
        <div className="flex items-center gap-5">
          <Link href="/privacy" className="text-xs text-[var(--text-faint)] hover:text-[var(--text-muted)] transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="text-xs text-[var(--text-faint)] hover:text-[var(--text-muted)] transition-colors">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}
