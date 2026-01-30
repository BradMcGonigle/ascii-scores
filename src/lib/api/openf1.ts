import type {
  F1Driver,
  F1Session,
  F1SessionType,
  F1Standings,
  GameStatus,
} from "@/lib/types";

const OPENF1_BASE_URL = "https://api.openf1.org/v1";

/**
 * OpenF1 API response types
 */
interface OpenF1Session {
  session_key: number;
  session_name: string;
  session_type: string;
  date_start: string;
  date_end: string;
  circuit_short_name: string;
  country_name: string;
}

interface OpenF1Position {
  driver_number: number;
  position: number;
  date: string;
}

interface OpenF1Driver {
  driver_number: number;
  broadcast_name: string;
  name_acronym: string;
  team_name: string;
}

/**
 * Map OpenF1 session type to our type
 */
function mapSessionType(type: string): F1SessionType {
  const typeMap: Record<string, F1SessionType> = {
    Practice_1: "practice_1",
    Practice_2: "practice_2",
    Practice_3: "practice_3",
    Qualifying: "qualifying",
    Sprint: "sprint",
    Race: "race",
  };
  return typeMap[type] ?? "race";
}

/**
 * Determine session status based on times
 */
function getSessionStatus(session: OpenF1Session): GameStatus {
  const now = new Date();
  const start = new Date(session.date_start);
  const end = new Date(session.date_end);

  if (now < start) return "scheduled";
  if (now > end) return "final";
  return "live";
}

/**
 * Fetch the latest F1 session
 */
export async function getLatestF1Session(): Promise<F1Session | null> {
  try {
    // Get recent sessions
    const sessionsResponse = await fetch(
      `${OPENF1_BASE_URL}/sessions?date_start>=${getRecentDateString()}`,
      {
        headers: { Accept: "application/json" },
        next: { revalidate: 10 }, // Cache for 10 seconds
      }
    );

    if (!sessionsResponse.ok) {
      throw new Error(`OpenF1 API error: ${sessionsResponse.status}`);
    }

    const sessions: OpenF1Session[] = await sessionsResponse.json();

    if (sessions.length === 0) {
      return null;
    }

    // Get the most recent session
    const latestSession = sessions[sessions.length - 1];
    const sessionKey = latestSession.session_key;

    // Fetch positions and driver info in parallel
    const [positionsResponse, driversResponse] = await Promise.all([
      fetch(`${OPENF1_BASE_URL}/position?session_key=${sessionKey}`, {
        headers: { Accept: "application/json" },
      }),
      fetch(`${OPENF1_BASE_URL}/drivers?session_key=${sessionKey}`, {
        headers: { Accept: "application/json" },
      }),
    ]);

    const positions: OpenF1Position[] = positionsResponse.ok
      ? await positionsResponse.json()
      : [];
    const driversData: OpenF1Driver[] = driversResponse.ok
      ? await driversResponse.json()
      : [];

    // Build driver map
    const driverMap = new Map<number, OpenF1Driver>();
    for (const driver of driversData) {
      driverMap.set(driver.driver_number, driver);
    }

    // Get latest position for each driver
    const latestPositions = new Map<number, number>();
    for (const pos of positions) {
      latestPositions.set(pos.driver_number, pos.position);
    }

    // Build driver standings
    const drivers: F1Driver[] = [];
    for (const [driverNumber, position] of latestPositions) {
      const driverInfo = driverMap.get(driverNumber);
      if (driverInfo) {
        drivers.push({
          position,
          driverNumber,
          driverCode: driverInfo.name_acronym,
          teamName: driverInfo.team_name,
          status: "running",
        });
      }
    }

    // Sort by position
    drivers.sort((a, b) => a.position - b.position);

    return {
      id: sessionKey.toString(),
      name: latestSession.session_name,
      type: mapSessionType(latestSession.session_type),
      status: getSessionStatus(latestSession),
      startTime: new Date(latestSession.date_start),
      circuitName: latestSession.circuit_short_name,
      country: latestSession.country_name,
      drivers,
    };
  } catch (error) {
    console.error("Failed to fetch F1 session:", error);
    return null;
  }
}

/**
 * Get F1 standings for display
 */
export async function getF1Standings(): Promise<F1Standings | null> {
  const session = await getLatestF1Session();

  if (!session) {
    return null;
  }

  return {
    session,
    lastUpdated: new Date(),
  };
}

/**
 * Get date string for 7 days ago
 */
function getRecentDateString(): string {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return date.toISOString().split("T")[0];
}
