import type { Metadata } from "next";
import { Archivo, JetBrains_Mono, Noto_Sans } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
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
      className={`${archivo.variable} ${notoSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-surface-base text-text-primary">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
