import type {
  F1Driver,
  F1Session,
  F1SessionType,
  F1Standings,
  F1RaceWeekend,
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

interface OpenF1Interval {
  driver_number: number;
  gap_to_leader: number | null;
  interval: number | null;
  date: string;
}

interface OpenF1Lap {
  driver_number: number;
  lap_number: number;
  lap_duration: number | null;
  is_pit_out_lap: boolean;
  date_start: string;
}

interface OpenF1Stint {
  driver_number: number;
  stint_number: number;
  lap_start: number;
  lap_end: number | null;
  compound: string;
  tyre_age_at_start: number;
}

/**
 * Format lap time for display (seconds to M:SS.sss)
 */
function formatLapTime(seconds: number | null): string | undefined {
  if (seconds === null || seconds <= 0) return undefined;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toFixed(3).padStart(6, "0")}`;
}

/**
 * Format gap time for display
 */
function formatGap(gap: number | null, position: number): string | undefined {
  if (position === 1) return "LEADER";
  if (gap === null) return undefined;
  // Gap is in seconds - format as +X.XXX
  return `+${gap.toFixed(3)}`;
}

/**
 * Determine driver status based on session status
 * For final sessions, all drivers are "finished"
 * For live sessions, drivers are "running" (could be enhanced with race_control data)
 */
function getDriverStatus(sessionStatus: GameStatus): "running" | "pit" | "out" | "finished" {
  if (sessionStatus === "final") return "finished";
  return "running";
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
 * Build enriched driver data from all API responses
 */
function buildDriverData(
  positions: OpenF1Position[],
  driversData: OpenF1Driver[],
  intervals: OpenF1Interval[],
  laps: OpenF1Lap[],
  stints: OpenF1Stint[],
  sessionStatus: GameStatus
): F1Driver[] {
  // Build driver info map
  const driverMap = new Map<number, OpenF1Driver>();
  for (const driver of driversData) {
    driverMap.set(driver.driver_number, driver);
  }

  // Get latest position for each driver
  const latestPositions = new Map<number, number>();
  for (const pos of positions) {
    latestPositions.set(pos.driver_number, pos.position);
  }

  // Get latest gap for each driver
  const latestGaps = new Map<number, number | null>();
  for (const interval of intervals) {
    latestGaps.set(interval.driver_number, interval.gap_to_leader);
  }

  // Process laps data - get last lap time, fastest lap, and laps completed
  const driverLapData = new Map<number, { lastLap: number | null; fastestLap: number | null; lapsCompleted: number }>();
  for (const lap of laps) {
    const existing = driverLapData.get(lap.driver_number);
    const lapTime = lap.lap_duration;

    if (!existing) {
      driverLapData.set(lap.driver_number, {
        lastLap: lapTime,
        fastestLap: lapTime && lapTime > 0 ? lapTime : null,
        lapsCompleted: lap.lap_number,
      });
    } else {
      // Update last lap (most recent by lap number)
      if (lap.lap_number > existing.lapsCompleted) {
        existing.lastLap = lapTime;
        existing.lapsCompleted = lap.lap_number;
      }
      // Update fastest lap
      if (lapTime && lapTime > 0 && (!existing.fastestLap || lapTime < existing.fastestLap)) {
        existing.fastestLap = lapTime;
      }
    }
  }

  // Process stints data - count pit stops and get current tyre
  const driverStintData = new Map<number, { pitStops: number; currentTyre: string | null }>();
  for (const stint of stints) {
    const existing = driverStintData.get(stint.driver_number);
    if (!existing) {
      driverStintData.set(stint.driver_number, {
        pitStops: stint.stint_number > 1 ? stint.stint_number - 1 : 0,
        currentTyre: stint.compound,
      });
    } else {
      // Update with latest stint info
      if (stint.stint_number > existing.pitStops + 1) {
        existing.pitStops = stint.stint_number - 1;
      }
      existing.currentTyre = stint.compound;
    }
  }

  // Build driver standings
  const drivers: F1Driver[] = [];
  for (const [driverNumber, position] of latestPositions) {
    const driverInfo = driverMap.get(driverNumber);
    if (driverInfo) {
      const gap = latestGaps.get(driverNumber);
      const lapData = driverLapData.get(driverNumber);
      const stintData = driverStintData.get(driverNumber);

      drivers.push({
        position,
        driverNumber,
        driverCode: driverInfo.name_acronym,
        driverName: driverInfo.broadcast_name,
        teamName: driverInfo.team_name,
        gap: formatGap(gap ?? null, position),
        lastLapTime: formatLapTime(lapData?.lastLap ?? null),
        fastestLap: formatLapTime(lapData?.fastestLap ?? null),
        lapsCompleted: lapData?.lapsCompleted,
        pitStops: stintData?.pitStops ?? 0,
        currentTyre: stintData?.currentTyre ?? undefined,
        status: getDriverStatus(sessionStatus),
      });
    }
  }

  // Sort by position
  drivers.sort((a, b) => a.position - b.position);
  return drivers;
}

/**
 * Fetch all driver-related data for a session
 */
async function fetchSessionDriverData(
  sessionKey: number | string,
  isPastDate: boolean
): Promise<{
  positions: OpenF1Position[];
  driversData: OpenF1Driver[];
  intervals: OpenF1Interval[];
  laps: OpenF1Lap[];
  stints: OpenF1Stint[];
}> {
  const revalidate = isPastDate ? false : 10;

  const [positionsResponse, driversResponse, intervalsResponse, lapsResponse, stintsResponse] =
    await Promise.all([
      fetch(`${OPENF1_BASE_URL}/position?session_key=${sessionKey}`, {
        headers: { Accept: "application/json" },
        next: { revalidate },
      }),
      fetch(`${OPENF1_BASE_URL}/drivers?session_key=${sessionKey}`, {
        headers: { Accept: "application/json" },
        next: { revalidate },
      }),
      fetch(`${OPENF1_BASE_URL}/intervals?session_key=${sessionKey}`, {
        headers: { Accept: "application/json" },
        next: { revalidate },
      }),
      fetch(`${OPENF1_BASE_URL}/laps?session_key=${sessionKey}`, {
        headers: { Accept: "application/json" },
        next: { revalidate },
      }),
      fetch(`${OPENF1_BASE_URL}/stints?session_key=${sessionKey}`, {
        headers: { Accept: "application/json" },
        next: { revalidate },
      }),
    ]);

  return {
    positions: positionsResponse.ok ? await positionsResponse.json() : [],
    driversData: driversResponse.ok ? await driversResponse.json() : [],
    intervals: intervalsResponse.ok ? await intervalsResponse.json() : [],
    laps: lapsResponse.ok ? await lapsResponse.json() : [],
    stints: stintsResponse.ok ? await stintsResponse.json() : [],
  };
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
    const sessionStatus = getSessionStatus(latestSession);

    // Fetch all driver-related data
    const { positions, driversData, intervals, laps, stints } = await fetchSessionDriverData(
      sessionKey,
      isPastDate ?? false
    );

    // Build enriched driver data
    const drivers = buildDriverData(positions, driversData, intervals, laps, stints, sessionStatus);

    return {
      id: sessionKey.toString(),
      name: latestSession.session_name,
      type: mapSessionType(latestSession.session_type),
      status: sessionStatus,
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
 * Fetch F1 race weekends within a date range
 * Groups sessions by circuit to create race weekend objects
 * @param daysBack - Number of days in the past to check
 * @param daysForward - Number of days in the future to check
 */
export async function getF1RaceWeekends(
  daysBack: number = 365,
  daysForward: number = 30
): Promise<F1RaceWeekend[]> {
  try {
    const today = new Date();
    const startDate = addDays(today, -daysBack);
    const endDate = addDays(today, daysForward);

    const url = `${OPENF1_BASE_URL}/sessions?date_start>=${formatDateForOpenF1(startDate)}&date_start<=${formatDateForOpenF1(endDate)}`;

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`OpenF1 API error: ${response.status}`);
    }

    const sessions: OpenF1Session[] = await response.json();

    // Group sessions by circuit (each circuit = one race weekend)
    const weekendMap = new Map<string, OpenF1Session[]>();
    for (const session of sessions) {
      // Create a key based on circuit and approximate date (within same week)
      const sessionDate = new Date(session.date_start);
      const weekKey = `${session.circuit_short_name}-${sessionDate.getFullYear()}-${Math.floor(sessionDate.getTime() / (7 * 24 * 60 * 60 * 1000))}`;

      const existing = weekendMap.get(weekKey) ?? [];
      existing.push(session);
      weekendMap.set(weekKey, existing);
    }

    // Convert to F1RaceWeekend objects
    const weekends: F1RaceWeekend[] = [];
    for (const [, weekendSessions] of weekendMap) {
      // Sort sessions by date
      weekendSessions.sort((a, b) =>
        new Date(a.date_start).getTime() - new Date(b.date_start).getTime()
      );

      const firstSession = weekendSessions[0];
      const lastSession = weekendSessions[weekendSessions.length - 1];

      // Generate race weekend name from circuit
      const raceName = generateRaceName(firstSession.circuit_short_name, firstSession.country_name);

      weekends.push({
        id: `${firstSession.circuit_short_name}-${new Date(firstSession.date_start).getFullYear()}`,
        name: raceName,
        circuitName: firstSession.circuit_short_name,
        country: firstSession.country_name,
        startDate: new Date(firstSession.date_start),
        endDate: new Date(lastSession.date_end),
        sessions: weekendSessions.map(s => ({
          id: s.session_key.toString(),
          name: s.session_name,
          type: mapSessionType(s.session_type),
          status: getSessionStatus(s),
          startTime: new Date(s.date_start),
          circuitName: s.circuit_short_name,
          country: s.country_name,
          drivers: [], // Drivers loaded separately when viewing specific session
        })),
      });
    }

    // Sort weekends by start date
    weekends.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    return weekends;
  } catch (error) {
    console.error("Failed to fetch F1 race weekends:", error);
    return [];
  }
}

/**
 * Generate a race name from circuit and country
 */
function generateRaceName(circuit: string, country: string): string {
  // Map common circuit names to their official Grand Prix names
  const circuitToGP: Record<string, string> = {
    "Bahrain": "Bahrain Grand Prix",
    "Jeddah": "Saudi Arabian Grand Prix",
    "Melbourne": "Australian Grand Prix",
    "Suzuka": "Japanese Grand Prix",
    "Shanghai": "Chinese Grand Prix",
    "Miami": "Miami Grand Prix",
    "Imola": "Emilia Romagna Grand Prix",
    "Monaco": "Monaco Grand Prix",
    "Montreal": "Canadian Grand Prix",
    "Barcelona": "Spanish Grand Prix",
    "Spielberg": "Austrian Grand Prix",
    "Silverstone": "British Grand Prix",
    "Budapest": "Hungarian Grand Prix",
    "Spa": "Belgian Grand Prix",
    "Zandvoort": "Dutch Grand Prix",
    "Monza": "Italian Grand Prix",
    "Baku": "Azerbaijan Grand Prix",
    "Singapore": "Singapore Grand Prix",
    "Austin": "United States Grand Prix",
    "Mexico City": "Mexico City Grand Prix",
    "Sao Paulo": "São Paulo Grand Prix",
    "Las Vegas": "Las Vegas Grand Prix",
    "Lusail": "Qatar Grand Prix",
    "Yas Marina": "Abu Dhabi Grand Prix",
  };

  return circuitToGP[circuit] ?? `${country} Grand Prix`;
}

/**
 * Get a specific race weekend by ID
 */
export async function getF1RaceWeekendById(id: string): Promise<F1RaceWeekend | null> {
  const weekends = await getF1RaceWeekends();
  return weekends.find(w => w.id === id) ?? null;
}

/**
 * Get all sessions for a specific race weekend with full driver data
 */
export async function getF1RaceWeekendSessions(weekendId: string): Promise<F1Session[]> {
  const weekend = await getF1RaceWeekendById(weekendId);
  if (!weekend) return [];

  // Fetch full session data for each session in the weekend
  const sessionPromises = weekend.sessions.map(async (sessionInfo) => {
    const isPastDate = isDateInPast(sessionInfo.startTime);
    const sessionKey = sessionInfo.id;
    const sessionStatus = sessionInfo.status;

    // Fetch all driver-related data
    const { positions, driversData, intervals, laps, stints } = await fetchSessionDriverData(
      sessionKey,
      isPastDate
    );

    // Build enriched driver data
    const drivers = buildDriverData(positions, driversData, intervals, laps, stints, sessionStatus);

    return {
      ...sessionInfo,
      drivers,
    };
  });

  return Promise.all(sessionPromises);
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
      const sessionStatus = getSessionStatus(session);

      // Fetch all driver-related data
      const { positions, driversData, intervals, laps, stints } = await fetchSessionDriverData(
        sessionKey,
        isPastDate
      );

      // Build enriched driver data
      const drivers = buildDriverData(positions, driversData, intervals, laps, stints, sessionStatus);

      return {
        id: sessionKey.toString(),
        name: session.session_name,
        type: mapSessionType(session.session_type),
        status: sessionStatus,
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
