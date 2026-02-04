import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { LEAGUES, type League } from "@/lib/types";

interface LeagueLayoutProps {
  children: React.ReactNode;
  params: Promise<{ league: string }>;
}

export default async function LeagueLayout({ children, params }: LeagueLayoutProps) {
  const { league: leagueId } = await params;

  // Validate league
  if (!Object.keys(LEAGUES).includes(leagueId)) {
    notFound();
  }

  return (
    <>
      <Header activeLeague={leagueId as League} />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
