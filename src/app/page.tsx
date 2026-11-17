import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { PitchRule } from "@/components/ui/PitchRule";
import type { Tone } from "@/types/domain";
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

const MINIMAL_PAIRS: readonly {
  word: string;
  pattern: readonly Tone[];
  label: string;
  gloss: string;
  color: string;
}[] = [
  { word: "\u1ECDk\u1ECD", pattern: ["M", "M"], label: "M \u00B7 M", gloss: "husband", color: "text-tone-mid" },
  { word: "\u1ECDk\u1ECD\u0300", pattern: ["M", "L"], label: "M \u00B7 L", gloss: "vehicle", color: "text-tone-low" },
  { word: "\u1ECD\u0300k\u1ECD\u0300", pattern: ["L", "L"], label: "L \u00B7 L", gloss: "spear", color: "text-tone-low" },
  { word: "oko", pattern: ["M", "M"], label: "M \u00B7 M (no dot)", gloss: "farm", color: "text-tone-mid" },
];

export default function LandingPage() {
  return (
    <AppShell>
      <div className="space-y-14">
        <section className="border-t-[3px] border-ink">
          <div className="grid lg:grid-cols-[1.2fr_.8fr]">
            <div className="py-8 sm:py-10 lg:py-14 lg:pr-12">
              <p className="mb-6 flex items-center gap-2 text-sm text-text-secondary">
                <Icon name="globe" size={16} className="text-clay" />
                <span className="italic">Nigerian languages, locally taught</span>
              </p>

              <h1 className="max-w-2xl font-display text-[2.6rem] sm:text-6xl lg:text-[4.75rem] leading-[0.95] text-indigo-900">
                Learn the words that sound like home.
              </h1>
              <PitchRule
                pattern={["M", "L", "H", "M", "L"]}
                className="mt-6 text-clay"
              />

              <p className="mt-6 max-w-xl text-base sm:text-lg text-text-secondary leading-relaxed">
                Practical lessons for Yoruba, Igbo, Hausa, and Nigerian Pidgin,
                with dialects, tones, and audio you can keep using offline.
              </p>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-8">
              <Link
                href="/onboarding?step=language"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 border-2 border-indigo-900 bg-indigo-900 px-6 py-3 text-base font-semibold text-on-indigo transition-colors hover:border-indigo-700 hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              >
                Start learning <Icon name="arrow-right" size={17} />
              </Link>
              <Link
                href="/map"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 text-base font-semibold text-text-primary underline decoration-1 underline-offset-[6px] transition-colors hover:decoration-[3px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              >
                <Icon name="map" size={17} /> Explore the map
              </Link>
              </div>
            </div>
            <div className="adire-field relative hidden min-h-[320px] overflow-hidden p-8 lg:flex lg:flex-col lg:justify-between">
              <div className="relative flex items-center justify-between border-b border-on-indigo/25 pb-3 text-on-indigo/80">
                <span className="font-mono text-xs">Your learning shelf</span>
                <Icon name="book" size={20} />
              </div>
              <div className="relative space-y-4">
                <p className="font-display text-4xl leading-[1] text-on-indigo">One place for every voice.</p>
                <div className="grid grid-cols-2 border-t border-on-indigo/25 text-sm text-on-indigo">
                  {["Yoruba", "Igbo", "Hausa", "Pidgin"].map((language) => (
                    <div key={language} className="flex items-center gap-2 border-b border-on-indigo/25 py-2.5 odd:pr-3 even:border-l even:pl-3">
                      <span className="size-2 bg-gold-400" /> {language}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section aria-label="Sokomu features" className="grid grid-cols-1 border-y border-ink/25 sm:grid-cols-3">
          {[
            ["sparkles", "Short, useful practice", "Build confidence with everyday phrases and scenarios."],
            ["signal", "Hear the difference", "Tone-aware drills help you say the right word, not just a word."],
            ["database", "Works offline", "Keep your lessons and saved audio close, even without signal."],
          ].map(([icon, title, copy]) => (
            <div key={title} className="flex gap-3 border-ink/25 py-5 sm:px-5 sm:first:pl-0 sm:[&:not(:first-child)]:border-l [&:not(:first-child)]:border-t sm:[&:not(:first-child)]:border-t-0">
              <span className="mt-0.5 shrink-0 text-clay">
                <Icon name={icon as "sparkles" | "signal" | "database"} size={20} />
              </span>
              <div>
                <h2 className="font-display text-lg leading-tight text-text-primary">{title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-text-secondary">{copy}</p>
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
              <span className="shrink-0 border border-edge-600/40 px-2 py-0.5 font-mono text-[11px] font-semibold text-edge-600">
                NFC + Deterministic Grading
              </span>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-text-secondary">
                In Yoruba and Igbo, tone is not decoration. Changing a single
                pitch mark changes the word completely:
              </p>
              <div className="grid grid-cols-2 border-l border-t border-ink/25 sm:grid-cols-4">
                {MINIMAL_PAIRS.map((pair) => (
                  <div
                    key={pair.word}
                    className="border-b border-r border-ink/25 p-3"
                  >
                    <p className="tonal-text text-2xl font-semibold text-text-primary">
                      {pair.word}
                    </p>
                    <PitchRule
                      pattern={pair.pattern}
                      className={`mt-1 ${pair.color}`}
                    />
                    <p className={`mt-1.5 font-mono text-xs ${pair.color}`}>
                      {pair.label}
                    </p>
                    <p className="text-xs text-text-muted">{pair.gloss}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-5">
            <CardHeader>
              <CardTitle>Hybrid AI Architecture</CardTitle>
              <span className="shrink-0 border border-cloud-600/40 px-2 py-0.5 font-mono text-[11px] font-semibold text-cloud-600">
                Firebase AI Logic
              </span>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="border-l-[3px] border-ink/30 py-1 pl-3">
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
              <div className="border-l-[3px] border-ink/30 py-1 pl-3">
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
              className="font-display text-3xl leading-none text-text-primary"
            >
              4 Languages &middot; 8 Regional Dialects
            </h2>
            <Link
              href="/trainer"
              className="inline-flex min-h-10 shrink-0 items-center text-xs sm:text-sm font-semibold text-indigo-700 underline decoration-1 underline-offset-4 hover:decoration-2"
            >
              Native Speaker Trainer Portal &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {DIALECT_HIGHLIGHTS.map((item) => (
              <Card key={item.language} className="flex flex-col justify-between border-t-[3px] border-t-ink">
                <div>
                  <p className="text-xs font-mono font-semibold text-gold-600">
                    {item.dialects}
                  </p>
                  <h3 className="mt-1 font-display text-2xl text-text-primary">
                    {item.language}
                  </h3>
                  <p className="mt-3 tonal-text border-l-[3px] border-clay py-0.5 pl-3 text-sm font-medium text-indigo-900">
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
