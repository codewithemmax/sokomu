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
    example: "ẹ kú àárọ̀ . usu (Ijebu for yam)",
    toneNote: "Three-tone system (H, M, L) where pitch distinguishes meaning.",
  },
  {
    language: "Igbo",
    dialects: "Owerri (Isuama), Onitsha",
    example: "nnọ̀ọ̀ . ákwà (cloth) vs ákwá (cry)",
    toneNote: "Two-tone system with downstep and regional nasal/aspirated shifts.",
  },
  {
    language: "Hausa",
    dialects: "Kano (Kananci)",
    example: "ina kwana . lafiya lau",
    toneNote: "Hooked consonants (ɓ, ɗ, ƙ) and Kano market cadence.",
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
  { word: "ọkọ", pattern: ["M", "M"], label: "M · M", gloss: "husband", color: "text-tone-mid" },
  { word: "ọkọ̀", pattern: ["M", "L"], label: "M · L", gloss: "vehicle", color: "text-tone-low" },
  { word: "ọ̀kọ̀", pattern: ["L", "L"], label: "L · L", gloss: "spear", color: "text-tone-low" },
  { word: "oko", pattern: ["M", "M"], label: "M · M (no dot)", gloss: "farm", color: "text-tone-mid" },
];

export default function LandingPage() {
  return (
    <AppShell>
      <div className="space-y-12 lg:space-y-16">
        <section className="overflow-hidden rounded-[var(--radius-panel)] bg-indigo-900 text-on-indigo">
          <div className="grid gap-10 p-6 sm:p-10 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:p-14">
            <div className="flex min-w-0 flex-col gap-6">
              <p className="flex items-center gap-2 text-sm text-indigo-100">
                <Icon name="globe" size={16} />
                <span>Nigerian languages, locally taught</span>
              </p>

              <h1 className="max-w-2xl font-display text-3xl sm:text-hero font-extrabold text-on-indigo">
                Learn the words that sound like home.
              </h1>

              <p className="max-w-xl text-base sm:text-lg text-on-indigo/90">
                Practical lessons for Yoruba, Igbo, Hausa, and Nigerian Pidgin,
                with dialects, tones, and audio you can keep using offline.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/onboarding?step=language"
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-[var(--radius-button)] bg-surface-raised px-6 text-base font-semibold text-indigo-900 transition-colors hover:bg-indigo-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-100"
                >
                  Start learning <Icon name="arrow-right" size={18} />
                </Link>
                <Link
                  href="/map"
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-[var(--radius-button)] border border-on-indigo/50 px-6 text-base font-semibold text-on-indigo transition-colors hover:bg-on-indigo/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-100"
                >
                  <Icon name="map" size={18} /> Explore the map
                </Link>
              </div>
            </div>

            <figure className="relative m-0 hidden min-w-0 flex-col gap-5 rounded-[var(--radius-card)] bg-surface-raised p-6 text-text-primary lg:flex">
              <div className="flex items-center justify-between text-text-secondary">
                <span className="text-sm font-medium">Your learning shelf</span>
                <Icon name="book" size={20} />
              </div>
              <p className="font-display text-2xl font-extrabold text-text-primary">
                One place for every voice.
              </p>
              <PitchRule
                pattern={["M", "L", "H", "M", "L", "H"]}
                step={40}
                staff
              />
              <div className="grid grid-cols-2 gap-2 text-sm">
                {["Yoruba", "Igbo", "Hausa", "Pidgin"].map((language) => (
                  <div
                    key={language}
                    className="flex min-h-11 items-center gap-2 rounded-[var(--radius-button)] bg-surface-base px-3 font-medium"
                  >
                    <span aria-hidden="true" className="size-2 rounded-full bg-gold-400" />
                    {language}
                  </div>
                ))}
              </div>
            </figure>
          </div>
        </section>

        <section aria-label="Sokomu features" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            ["sparkles", "Short, useful practice", "Build confidence with everyday phrases and scenarios."],
            ["signal", "Hear the difference", "Tone-aware drills help you say the right word, not just a word."],
            ["database", "Works offline", "Keep your lessons and saved audio close, even without signal."],
          ].map(([icon, title, copy]) => (
            <div key={title} className="flex gap-4 rounded-[var(--radius-card)] bg-surface-base p-5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-input)] bg-surface-sunken text-indigo-700">
                <Icon name={icon as "sparkles" | "signal" | "database"} size={20} />
              </span>
              <div>
                <h2 className="font-display text-lg font-bold leading-tight text-text-primary">{title}</h2>
                <p className="mt-1 text-sm text-text-secondary">{copy}</p>
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
              <span className="inline-flex h-7 shrink-0 items-center rounded-full bg-edge-100 px-2.5 text-xs font-medium text-text-primary">
                NFC + Deterministic Grading
              </span>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-text-secondary">
                In Yoruba and Igbo, tone is not decoration. Changing a single
                pitch mark changes the word completely:
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {MINIMAL_PAIRS.map((pair) => (
                  <div
                    key={pair.word}
                    className="flex flex-col gap-2 rounded-[var(--radius-card)] bg-surface-base p-3"
                  >
                    <p className="tonal-text font-display text-2xl font-bold text-text-primary">
                      {pair.word}
                    </p>
                    <PitchRule pattern={pair.pattern} />
                    <div>
                      <p className={`text-xs font-semibold ${pair.color}`}>
                        {pair.label}
                      </p>
                      <p className="text-xs text-text-secondary">{pair.gloss}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-5">
            <CardHeader>
              <CardTitle>Hybrid AI Architecture</CardTitle>
              <span className="inline-flex h-7 shrink-0 items-center rounded-full bg-cloud-100 px-2.5 text-xs font-medium text-text-primary">
                Firebase AI Logic
              </span>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-[var(--radius-card)] bg-surface-base p-3">
                <p className="text-sm font-semibold text-edge-600">
                  ON_DEVICE &middot; Gemini Nano
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  Zero-data vocabulary quizzes and tonal feedback grounded on
                  verified local glossary entries via{" "}
                  <code className="font-mono text-xs">PREFER_ON_DEVICE</code> and{" "}
                  <code className="font-mono text-xs">ONLY_ON_DEVICE</code>.
                </p>
              </div>
              <div className="rounded-[var(--radius-card)] bg-surface-base p-3">
                <p className="text-sm font-semibold text-cloud-600">
                  IN_CLOUD &middot; {REMOTE_CONFIG_DEFAULTS.ai_tts_model}
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  Two-speaker cultural dialogues synthesized once into 24 kHz
                  mono PCM and cached in IndexedDB for instant offline replay.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="dialects-heading" className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2
              id="dialects-heading"
              className="font-display text-2xl sm:text-3xl font-extrabold text-text-primary"
            >
              4 Languages &middot; 8 Regional Dialects
            </h2>
            <Link
              href="/trainer"
              className="inline-flex min-h-11 shrink-0 items-center text-sm font-semibold text-indigo-700 underline-offset-4 hover:text-indigo-900 hover:underline"
            >
              Native Speaker Trainer Portal &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {DIALECT_HIGHLIGHTS.map((item) => {
              const hausa = item.language === "Hausa" ? "font-hausa" : "";
              return (
                <Card key={item.language} className="flex flex-col justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-secondary">
                      {item.dialects}
                    </p>
                    <h3 className="mt-1 font-display text-xl font-bold text-text-primary">
                      {item.language}
                    </h3>
                    <p
                      className={`mt-3 tonal-text rounded-[var(--radius-button)] bg-surface-base px-3 py-2 text-sm font-medium text-indigo-900 ${hausa}`}
                    >
                      {item.example}
                    </p>
                  </div>
                  <p className={`mt-3 text-sm text-text-secondary ${hausa}`}>
                    {item.toneNote}
                  </p>
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
