import type { Metadata } from "next";
import {
  JetBrains_Mono,
  Noto_Sans,
  Noto_Serif_Display,
} from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const notoSerifDisplay = Noto_Serif_Display({
  variable: "--font-noto-serif-display",
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700"],
  display: "swap",
});

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
});

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
    <html
      lang="en"
      className={`${notoSerifDisplay.variable} ${notoSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-surface-base text-text-primary">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
