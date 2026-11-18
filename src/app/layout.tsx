import type { Metadata } from "next";
// Fonts are self-hosted from @fontsource-variable packages, so builds never
// need to reach Google Fonts. Each file declares per-subset @font-face rules
// with unicode-range; browsers fetch only the subsets a page actually uses
// (Latin Extended covers Yoruba, Igbo and Hausa diacritics).
import "@fontsource-variable/inter/wght.css";
import "@fontsource-variable/plus-jakarta-sans/wght.css";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sokomu | Speak, Learn, Everywhere",
  description:
    "Offline-first hybrid AI tutor for Nigerian indigenous languages and regional dialects (Yoruba, Igbo, Hausa, and Nigerian Pidgin), powered by Firebase AI Logic and Gemini Nano.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-surface-raised text-text-primary">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
