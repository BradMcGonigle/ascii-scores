const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ascii-scores.vercel.app";
const SITE_NAME = "ASCII Scores";

interface JsonLdProps {
  type: "organization" | "website" | "breadcrumb";
  data?: {
    name?: string;
    items?: Array<{ name: string; url: string }>;
  };
}

export function JsonLd({ type, data }: JsonLdProps) {
  let schema;

  switch (type) {
    case "organization":
      schema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/icon-512.png`,
        description:
          "Real-time sports scores for NHL, NFL, NBA, MLB, MLS, PGA, and Formula 1 rendered in ASCII art style",
        sameAs: [],
      };
      break;

    case "website":
      schema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: SITE_NAME,
        url: SITE_URL,
        description:
          "Real-time sports scores for NHL, NFL, NBA, MLB, MLS, PGA, and Formula 1 rendered in ASCII art style",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE_URL}/{league}`,
          },
          "query-input": "required name=league",
        },
      };
      break;

    case "breadcrumb":
      if (!data?.items) return null;
      schema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: data.items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      };
      break;

    default:
      return null;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Combined JSON-LD for the root layout
 * Includes Organization and WebSite schemas
 */
export function RootJsonLd() {
  return (
    <>
      <JsonLd type="organization" />
      <JsonLd type="website" />
    </>
  );
}

/**
 * JSON-LD for league pages with breadcrumb navigation
 */
export function LeagueJsonLd({
  leagueName,
  leagueUrl,
}: {
  leagueName: string;
  leagueUrl: string;
}) {
  return (
    <JsonLd
      type="breadcrumb"
      data={{
        items: [
          { name: "Home", url: SITE_URL },
          { name: leagueName, url: leagueUrl },
        ],
      }}
    />
  );
}
