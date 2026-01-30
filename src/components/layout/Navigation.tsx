import { NavigationLinks } from "./NavigationLinks";
import { MobileNavigation } from "./MobileNavigation";

interface NavigationProps {
  activeLeague?: string;
}

/**
 * Server component for the main navigation.
 * Desktop links are server-rendered, while mobile menu uses a minimal client component.
 * Active state is passed as a prop from the page, eliminating usePathname() on the client.
 */
export function Navigation({ activeLeague }: NavigationProps) {
  return (
    <nav aria-label="League navigation">
      {/* Mobile navigation (client component - handles menu toggle) */}
      <MobileNavigation activeLeague={activeLeague} />

      {/* Desktop navigation (server component - static links) */}
      <NavigationLinks activeLeague={activeLeague} variant="desktop" />
    </nav>
  );
}
