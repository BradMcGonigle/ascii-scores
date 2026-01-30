import Link from "next/link";
import { AsciiLogoCompact } from "@/components/ascii";
import { Navigation } from "./Navigation";

export function Header() {
  return (
    <header className="border-b border-terminal-border bg-terminal-bg relative">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <AsciiLogoCompact />
          </Link>
          <Navigation />
        </div>
      </div>
    </header>
  );
}
