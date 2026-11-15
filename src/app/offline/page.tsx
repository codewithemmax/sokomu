import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-[#F7F5F0] text-[#141829] px-6 py-16 flex items-center justify-center">
      <section className="max-w-lg w-full rounded-2xl border border-[#D9D4C7] bg-white p-8 shadow-sm space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#FFEDD5] px-3 py-1 text-xs font-medium text-[#7C2D12]">
          <span aria-hidden="true">●</span>
          <span>Offline mode active</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-[#121A3F]">
            You are offline, and your practice continues
          </h1>
          <p className="text-sm leading-relaxed text-[#4A5068]">
            This page has not been saved to your device yet. Any scenario you have
            cached in IndexedDB and all on-device vocabulary and tonal drills remain
            ready without a network connection.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/library"
            className="inline-flex items-center justify-center rounded-xl bg-[#26337A] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#121A3F] transition-colors"
          >
            Open Offline Library
          </Link>
          <Link
            href="/scenarios"
            className="inline-flex items-center justify-center rounded-xl border border-[#D9D4C7] bg-[#F7F5F0] px-4 py-2.5 text-sm font-medium text-[#141829] hover:bg-[#EEEAE1] transition-colors"
          >
            Browse Cached Scenarios
          </Link>
          <Link
            href="/map"
            className="inline-flex items-center justify-center rounded-xl border border-[#D9D4C7] bg-white px-4 py-2.5 text-sm font-medium text-[#4A5068] hover:bg-[#EEEAE1] transition-colors"
          >
            Cultural Map
          </Link>
        </div>
      </section>
    </main>
  );
}
