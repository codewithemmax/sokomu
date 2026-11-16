import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
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
      <div className="space-y-12">
        <section className="paper-surface overflow-hidden border border-border shadow-[var(--shadow-2)]">
          <div className="grid lg:grid-cols-[1.2fr_.8fr]">
            <div className="p-6 sm:p-8 lg:p-12">
              <div className="mb-6 inline-flex items-center gap-2 border-l-2 border-gold-600 pl-3 text-xs font-semibold uppercase tracking-[0.12em] text-gold-600">
                <span className="inline-flex size-6 items-center justify-center bg-gold-100">
                  <Icon name="globe" size={15} />
                </span>
                Nigerian languages, locally taught
              </div>

              <h1 className="max-w-2xl font-display text-3xl sm:text-4xl lg:text-[3.4rem] font-semibold leading-[1.08] tracking-tight text-indigo-900">
                Learn the words that sound like home.
              </h1>

              <p className="mt-5 max-w-xl text-base sm:text-lg text-text-secondary leading-relaxed">
                Practical lessons for Yoruba, Igbo, Hausa, and Nigerian Pidgin,
                with dialects, tones, and audio you can keep using offline.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-7">
              <Link
                href="/onboarding?step=language"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[10px] bg-indigo-700 px-5 py-3 text-base font-semibold text-white transition-colors hover:bg-indigo-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              >
                Start learning <Icon name="arrow-right" size={17} />
              </Link>
              <Link
                href="/map"
                className="inline-flex min-h-[48px] items-center justify-center rounded-[10px] border border-border bg-surface-sunken px-5 py-3 text-base font-medium text-text-primary transition-colors hover:bg-indigo-100/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              >
                <Icon name="map" size={17} /> Explore the map
              </Link>
              </div>
            </div>
            <div className="relative hidden min-h-[320px] overflow-hidden bg-indigo-900 p-8 lg:flex lg:flex-col lg:justify-between">
              <div className="absolute right-0 top-0 size-64 border border-gold-400/30" />
              <div className="absolute bottom-0 left-0 size-72 border border-white/10" />
              <div className="relative flex items-center justify-between text-indigo-100">
                <span className="text-xs font-semibold uppercase tracking-[0.16em]">Your learning shelf</span>
                <Icon name="book" size={20} />
              </div>
              <div className="relative space-y-4">
                <p className="font-display text-3xl font-semibold text-white">One place for every voice.</p>
                <div className="grid grid-cols-2 gap-2 text-sm text-indigo-100">
                  {["Yoruba", "Igbo", "Hausa", "Pidgin"].map((language) => (
                    <div key={language} className="flex items-center gap-2 border border-white/15 bg-white/10 px-3 py-2">
                      <span className="size-1.5 rounded-full bg-gold-400" /> {language}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section aria-label="Sokomu features" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            ["sparkles", "Short, useful practice", "Build confidence with everyday phrases and scenarios."],
            ["signal", "Hear the difference", "Tone-aware drills help you say the right word, not just a word."],
            ["database", "Works offline", "Keep your lessons and saved audio close, even without signal."],
          ].map(([icon, title, copy]) => (
            <div key={title} className="paper-surface flex gap-3 border border-border p-4">
              <span className="flex size-9 shrink-0 items-center justify-center bg-indigo-100 text-indigo-700">
                <Icon name={icon as "sparkles" | "signal" | "database"} size={18} />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
                <p className="mt-1 text-xs leading-relaxed text-text-secondary">{copy}</p>
              </div>
            </div>
          ))}
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2
              id="dialects-heading"
              className="font-display text-2xl font-semibold text-text-primary"
            >
              4 Languages &middot; 8 Regional Dialects
            </h2>
            <Link
              href="/trainer"
              className="inline-flex min-h-10 shrink-0 items-center text-xs sm:text-sm font-medium text-indigo-700 hover:underline"
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
