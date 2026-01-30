import type {
  F1Driver,
  F1Session,
  F1SessionType,
  F1Standings,
  GameStatus,
} from "@/lib/types";
import { addDays, formatDateForAPI, isDateInPast } from "@/lib/utils/format";

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
 * Convert a Date to OpenF1 API date format (YYYY-MM-DD)
 */
function formatDateForOpenF1(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parse an OpenF1 date string (YYYY-MM-DD) to a Date object
 */
function parseDateFromOpenF1(dateStr: string): Date | null {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  return new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10));
}

/**
 * Fetch F1 session for a specific date
 * @param date - Optional date to fetch session for (defaults to recent sessions)
 */
export async function getF1SessionByDate(date?: Date): Promise<F1Session | null> {
  try {
    // Determine caching strategy:
    // - Past dates: cache indefinitely (sessions are final, won't change)
    // - Today/future: revalidate every 10s for live updates
    const isPastDate = date && isDateInPast(date);

    // Build URL for sessions query
    let sessionsUrl: string;
    if (date) {
      // For a specific date, get sessions that start on that date
      const dateStr = formatDateForOpenF1(date);
      const nextDay = addDays(date, 1);
      const nextDayStr = formatDateForOpenF1(nextDay);
      sessionsUrl = `${OPENF1_BASE_URL}/sessions?date_start>=${dateStr}&date_start<${nextDayStr}`;
    } else {
      // Default: get recent sessions from last 7 days
      sessionsUrl = `${OPENF1_BASE_URL}/sessions?date_start>=${getRecentDateString()}`;
    }

    const sessionsResponse = await fetch(sessionsUrl, {
      headers: { Accept: "application/json" },
      next: { revalidate: isPastDate ? false : 10 },
    });

    if (!sessionsResponse.ok) {
      throw new Error(`OpenF1 API error: ${sessionsResponse.status}`);
    }

    const sessions: OpenF1Session[] = await sessionsResponse.json();

    if (sessions.length === 0) {
      return null;
    }

    // Get the most recent session for the date (or latest overall)
    const latestSession = sessions[sessions.length - 1];
    const sessionKey = latestSession.session_key;

    // Fetch positions and driver info in parallel
    // Apply same caching strategy to these fetches
    const [positionsResponse, driversResponse] = await Promise.all([
      fetch(`${OPENF1_BASE_URL}/position?session_key=${sessionKey}`, {
        headers: { Accept: "application/json" },
        next: { revalidate: isPastDate ? false : 10 },
      }),
      fetch(`${OPENF1_BASE_URL}/drivers?session_key=${sessionKey}`, {
        headers: { Accept: "application/json" },
        next: { revalidate: isPastDate ? false : 10 },
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
 * Fetch the latest F1 session (backward compatible)
 */
export async function getLatestF1Session(): Promise<F1Session | null> {
  return getF1SessionByDate();
}

/**
 * Get F1 standings for display
 * @param date - Optional date to fetch standings for
 */
export async function getF1Standings(date?: Date): Promise<F1Standings | null> {
  const session = await getF1SessionByDate(date);

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

/**
 * Fetch dates that have F1 sessions within a range
 * Returns an array of date strings (YYYYMMDD) that have sessions
 * @param daysBack - Number of days in the past to check (default 30 for F1 race weekends)
 * @param daysForward - Number of days in the future to check
 */
export async function getDatesWithF1Sessions(
  daysBack: number = 30,
  daysForward: number = 14
): Promise<string[]> {
  try {
    const today = new Date();
    const startDate = addDays(today, -daysBack);
    const endDate = addDays(today, daysForward);

    // Determine caching strategy: longer cache since this is session metadata
    const url = `${OPENF1_BASE_URL}/sessions?date_start>=${formatDateForOpenF1(startDate)}&date_start<=${formatDateForOpenF1(endDate)}`;

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`OpenF1 API error: ${response.status}`);
    }

    const sessions: OpenF1Session[] = await response.json();

    // Extract unique dates from sessions
    const datesSet = new Set<string>();
    for (const session of sessions) {
      const sessionDate = parseDateFromOpenF1(session.date_start);
      if (sessionDate) {
        datesSet.add(formatDateForAPI(sessionDate));
      }
    }

    // Sort dates chronologically
    return Array.from(datesSet).sort();
  } catch (error) {
    console.error("Failed to fetch F1 session dates:", error);
    return [];
  }
}

/**
 * Get all F1 sessions for a specific date (multiple sessions possible during race weekend)
 * @param date - Date to fetch sessions for
 */
export async function getF1SessionsForDate(date: Date): Promise<F1Session[]> {
  try {
    const isPastDate = isDateInPast(date);
    const dateStr = formatDateForOpenF1(date);
    const nextDay = addDays(date, 1);
    const nextDayStr = formatDateForOpenF1(nextDay);

    const sessionsUrl = `${OPENF1_BASE_URL}/sessions?date_start>=${dateStr}&date_start<${nextDayStr}`;

    const sessionsResponse = await fetch(sessionsUrl, {
      headers: { Accept: "application/json" },
      next: { revalidate: isPastDate ? false : 10 },
    });

    if (!sessionsResponse.ok) {
      throw new Error(`OpenF1 API error: ${sessionsResponse.status}`);
    }

    const sessions: OpenF1Session[] = await sessionsResponse.json();

    if (sessions.length === 0) {
      return [];
    }

    // Fetch all sessions in parallel for better performance
    const sessionPromises = sessions.map(async (session) => {
      const sessionKey = session.session_key;

      const [positionsResponse, driversResponse] = await Promise.all([
        fetch(`${OPENF1_BASE_URL}/position?session_key=${sessionKey}`, {
          headers: { Accept: "application/json" },
          next: { revalidate: isPastDate ? false : 10 },
        }),
        fetch(`${OPENF1_BASE_URL}/drivers?session_key=${sessionKey}`, {
          headers: { Accept: "application/json" },
          next: { revalidate: isPastDate ? false : 10 },
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
        name: session.session_name,
        type: mapSessionType(session.session_type),
        status: getSessionStatus(session),
        startTime: new Date(session.date_start),
        circuitName: session.circuit_short_name,
        country: session.country_name,
        drivers,
      } as F1Session;
    });

    return Promise.all(sessionPromises);
  } catch (error) {
    console.error("Failed to fetch F1 sessions for date:", error);
    return [];
  }
}
