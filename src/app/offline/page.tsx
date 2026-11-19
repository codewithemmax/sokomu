import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-surface-base text-text-primary px-6 py-16 flex items-center justify-center">
      <section className="max-w-lg w-full border-t border-border bg-surface-raised p-8 space-y-6 outline outline-1 -outline-offset-1 outline-border">
        <div className="inline-flex items-center gap-2 bg-offline-100 px-3 py-1 text-xs font-medium text-offline-600">
          <span aria-hidden="true" className="inline-block size-2 bg-offline-600" />
          <span>Offline mode active</span>
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-2xl sm:text-3xl leading-[1.05] text-indigo-900">
            You are offline, and your practice continues
          </h1>
          <p className="text-sm leading-relaxed text-text-secondary">
            This page has not been saved to your device yet. Any scenario you have
            cached in IndexedDB and all on-device vocabulary and tonal drills remain
            ready without a network connection.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/library"
            className="inline-flex items-center justify-center rounded-[var(--radius-button)] border border-transparent bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-on-indigo hover:bg-indigo-900 transition-colors"
          >
            Open Offline Library
          </Link>
          <Link
            href="/scenarios"
            className="inline-flex items-center justify-center rounded-[var(--radius-button)] border border-border bg-surface-raised px-4 py-2.5 text-sm font-semibold text-text-primary hover:bg-surface-base transition-colors"
          >
            Browse Cached Scenarios
          </Link>
          <Link
            href="/map"
            className="inline-flex items-center justify-center px-2 py-2.5 text-sm font-semibold text-text-secondary underline decoration-1 underline-offset-4 hover:text-text-primary hover:decoration-2"
          >
            Cultural Map
          </Link>
        </div>
      </section>
    </main>
  );
}
