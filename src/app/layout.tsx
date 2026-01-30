import type { Metadata } from "next";
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
    <html lang="en">
      <body className="min-h-screen bg-terminal-bg text-terminal-fg antialiased overflow-x-hidden">
        <div className="flex min-h-screen flex-col overflow-x-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
