import type { MetadataRoute } from "next";
import { LEAGUES, type League } from "@/lib/types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ascii-scores.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const leagues = Object.keys(LEAGUES) as League[];

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
  ];

  // League pages - these have live scores so they change frequently
  const leaguePages: MetadataRoute.Sitemap = leagues.map((league) => ({
    url: `${SITE_URL}/${league}`,
    lastModified: new Date(),
    changeFrequency: "hourly" as const,
    priority: 0.9,
  }));

  return [...staticPages, ...leaguePages];
}
