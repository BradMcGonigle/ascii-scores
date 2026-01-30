import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="font-mono text-center w-full max-w-2xl">
          <div className="overflow-x-auto">
            <pre className="text-terminal-red mb-8 text-xs sm:text-sm md:text-base inline-block">
              {`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ██╗  ██╗ ██████╗ ██╗  ██╗                              ║
║   ██║  ██║██╔═══██╗██║  ██║                              ║
║   ███████║██║   ██║███████║                              ║
║   ╚════██║██║   ██║╚════██║                              ║
║        ██║╚██████╔╝     ██║                              ║
║        ╚═╝ ╚═════╝      ╚═╝                              ║
║                                                           ║
║              PAGE NOT FOUND                               ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`.trim()}
            </pre>
          </div>
          <p className="text-terminal-muted mb-6">
            The page you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link
            href="/"
            className="inline-block px-4 py-2 border border-terminal-border hover:bg-terminal-border/20 transition-colors"
          >
            [RETURN HOME]
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
