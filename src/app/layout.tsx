import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/layout";
import { NotificationProvider } from "@/components/notifications";
import { ToastProvider } from "@/components/ui/Toast";
import { RootJsonLd } from "@/components/seo";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ascii-scores.vercel.app";
const SITE_NAME = "ASCII Scores";
const SITE_DESCRIPTION = "Real-time sports scores for NHL, NFL, NBA, MLB, MLS, PGA, and Formula 1 rendered in ASCII art style. Live scoreboards with a retro terminal aesthetic.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - Live Sports Scoreboards`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "sports scores",
    "live scores",
    "ASCII art",
    "NHL scores",
    "NFL scores",
    "NBA scores",
    "MLB scores",
    "MLS scores",
    "F1 standings",
    "PGA leaderboard",
    "retro scoreboard",
    "terminal style",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} - Live Sports Scoreboards`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ASCII Scores - Live Sports Scoreboards in Retro Terminal Style",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} - Live Sports Scoreboards`,
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
    creator: "@asciiscores",
  },
  alternates: {
    canonical: SITE_URL,
  },
  category: "sports",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <RootJsonLd />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-screen bg-terminal-bg text-terminal-fg antialiased">
        <ThemeProvider>
          <ToastProvider>
          <NotificationProvider>
            <a href="#main-content" className="skip-to-content font-mono">
              [SKIP TO CONTENT]
            </a>
            <div className="flex min-h-screen flex-col" id="main-content" tabIndex={-1}>
              {children}
            </div>
          </NotificationProvider>
          </ToastProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
