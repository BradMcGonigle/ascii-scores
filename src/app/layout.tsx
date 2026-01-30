import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/layout";
import "./globals.css";

export const metadata: Metadata = {
  title: "ASCII Scores - Live Sports Scoreboards",
  description:
    "Real-time sports scores for NHL, NFL, NBA, MLB, MLS, and Formula 1 rendered in ASCII art style",
  keywords: [
    "sports",
    "scores",
    "live",
    "ASCII",
    "NHL",
    "NFL",
    "NBA",
    "MLB",
    "MLS",
    "F1",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-terminal-bg text-terminal-fg antialiased">
        <ThemeProvider>
          <div className="flex min-h-screen flex-col">{children}</div>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
