import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { REMOTE_CONFIG_DEFAULTS } from "@/lib/firebase/remote-config-defaults";

const DIALECT_HIGHLIGHTS = [
  {
    language: "Yoruba",
    dialects: "Ijebu, Ekiti, Ondo, Oyo",
    example: "\u1EB9 k\u00FA \u00E0\u00E1r\u1ECD\u0300 . usu (Ijebu for yam)",
    toneNote: "Three-tone system (H, M, L) where pitch distinguishes meaning.",
  },
  {
    language: "Igbo",
    dialects: "Owerri (Isuama), Onitsha",
    example: "nn\u1ECD\u0300\u1ECD\u0300 . \u00E1kw\u00E0 (cloth) vs \u00E1kw\u00E1 (cry)",
    toneNote: "Two-tone system with downstep and regional nasal/aspirated shifts.",
  },
  {
    language: "Hausa",
    dialects: "Kano (Kananci)",
    example: "ina kwana . lafiya lau",
    toneNote: "Hooked consonants (\u0253, \u0257, \u0199) and Kano market cadence.",
  },
  {
    language: "Nigerian Pidgin",
    dialects: "Lagos street & transit",
    example: "How far? . Owa o! Bole here",
    toneNote: "Authentic Lagos bus-conductor and market expressions.",
  },
] as const;

export default function LandingPage() {
  return (
    <AppShell>
      <div className="space-y-10">
        <section className="rounded-3xl border border-border bg-surface-raised p-6 sm:p-8 lg:p-12 shadow-[var(--shadow-2)]">
          <div className="max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold-600/30 bg-gold-100 px-3.5 py-1 text-xs font-medium text-gold-600">
              <span>So (Yoruba) &middot; Koya (Hausa) &middot; Muta (Igbo)</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.15] tracking-tight text-indigo-900">
              Speak the dialect your elders actually speak, online or in Airplane Mode.
            </h1>

            <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
              Sokomu is an offline-first hybrid AI tutor for Nigerian indigenous
              languages and regional dialects. Structured vocabulary and tonal
              drills run locally on{" "}
              <span className="font-semibold text-edge-600">Gemini Nano</span>{" "}
              via Firebase AI Logic, while natural two-speaker conversations
              stream once in{" "}
              <span className="font-semibold text-cloud-600">
                24 kHz PCM audio
              </span>{" "}
              and replay offline forever from IndexedDB.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/onboarding?step=language"
                className="inline-flex min-h-[48px] items-center justify-center rounded-[10px] bg-indigo-700 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-indigo-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              >
                Start learning
              </Link>
              <Link
                href="/map"
                className="inline-flex min-h-[48px] items-center justify-center rounded-[10px] border border-border bg-surface-sunken px-5 py-3 text-base font-medium text-text-primary transition-colors hover:bg-indigo-100/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              >
                Explore Nigeria dialect map
              </Link>
              <Link
                href="/scenarios"
                className="inline-flex min-h-[48px] items-center justify-center rounded-[10px] px-4 py-3 text-sm font-medium text-indigo-700 hover:underline"
              >
                Browse scenarios &rarr;
              </Link>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="minimal-pairs-heading"
          className="grid grid-cols-1 gap-6 lg:grid-cols-12"
        >
          <Card className="lg:col-span-7">
            <CardHeader>
              <CardTitle id="minimal-pairs-heading">
                Why tone and regional dialect matter
              </CardTitle>
              <span className="rounded-full bg-edge-100 px-2.5 py-1 font-mono text-xs font-semibold text-edge-600">
                NFC + Deterministic Grading
              </span>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-text-secondary">
                In Yoruba and Igbo, tone is not decoration. Changing a single
                pitch mark changes the word completely:
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-border bg-surface-sunken p-3">
                  <p className="tonal-text text-xl font-semibold text-text-primary">
                    {"\u1ECDk\u1ECD"}
                  </p>
                  <p className="mt-1 font-mono text-xs text-tone-mid">
                    M &middot; M
                  </p>
                  <p className="text-xs text-text-muted">husband</p>
                </div>
                <div className="rounded-xl border border-border bg-surface-sunken p-3">
                  <p className="tonal-text text-xl font-semibold text-text-primary">
                    {"\u1ECDk\u1ECD\u0300"}
                  </p>
                  <p className="mt-1 font-mono text-xs text-tone-low">
                    M &middot; L
                  </p>
                  <p className="text-xs text-text-muted">vehicle</p>
                </div>
                <div className="rounded-xl border border-border bg-surface-sunken p-3">
                  <p className="tonal-text text-xl font-semibold text-text-primary">
                    {"\u1ECD\u0300k\u1ECD\u0300"}
                  </p>
                  <p className="mt-1 font-mono text-xs text-tone-low">
                    L &middot; L
                  </p>
                  <p className="text-xs text-text-muted">spear</p>
                </div>
                <div className="rounded-xl border border-border bg-surface-sunken p-3">
                  <p className="tonal-text text-xl font-semibold text-text-primary">
                    oko
                  </p>
                  <p className="mt-1 font-mono text-xs text-tone-mid">
                    M &middot; M (no dot)
                  </p>
                  <p className="text-xs text-text-muted">farm</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-5">
            <CardHeader>
              <CardTitle>Hybrid AI Architecture</CardTitle>
              <span className="rounded-full bg-cloud-100 px-2.5 py-1 font-mono text-xs font-semibold text-cloud-600">
                Firebase AI Logic
              </span>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-xl border border-border bg-surface-sunken p-3">
                <p className="font-mono text-xs font-semibold text-edge-600">
                  ON_DEVICE &middot; Gemini Nano
                </p>
                <p className="mt-1 text-xs text-text-secondary">
                  Zero-data vocabulary quizzes and tonal feedback grounded on
                  verified local glossary entries via{" "}
                  <code className="font-mono">PREFER_ON_DEVICE</code> and{" "}
                  <code className="font-mono">ONLY_ON_DEVICE</code>.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-surface-sunken p-3">
                <p className="font-mono text-xs font-semibold text-cloud-600">
                  IN_CLOUD &middot; {REMOTE_CONFIG_DEFAULTS.ai_tts_model}
                </p>
                <p className="mt-1 text-xs text-text-secondary">
                  Two-speaker cultural dialogues synthesized once into 24 kHz
                  mono PCM and cached in IndexedDB for instant offline replay.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="dialects-heading" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2
              id="dialects-heading"
              className="font-display text-2xl font-semibold text-text-primary"
            >
              4 Languages &middot; 8 Regional Dialects
            </h2>
            <Link
              href="/trainer"
              className="text-xs sm:text-sm font-medium text-indigo-700 hover:underline"
            >
              Native Speaker Trainer Portal &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {DIALECT_HIGHLIGHTS.map((item) => (
              <Card key={item.language} className="flex flex-col justify-between">
                <div>
                  <p className="text-xs font-mono font-semibold uppercase tracking-wider text-gold-600">
                    {item.dialects}
                  </p>
                  <h3 className="mt-1 font-display text-xl font-semibold text-text-primary">
                    {item.language}
                  </h3>
                  <p className="mt-2 tonal-text rounded-lg bg-surface-sunken px-3 py-2 text-sm font-medium text-indigo-900">
                    {item.example}
                  </p>
                </div>
                <p className="mt-3 text-xs text-text-secondary">
                  {item.toneNote}
                </p>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
