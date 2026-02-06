import type { GolfLeaderboard, GolfPlayer, GolfTournament, GolfTournamentStatus } from "@/lib/types";
import type { PGATournamentInfo } from "@/lib/api/pga";
import { formatCurrency, formatNumber, truncate } from "@/lib/utils/format";

interface GolfLeaderboardProps {
  leaderboard: GolfLeaderboard;
  /** Optional tournament info to display when leaderboard data is unavailable */
  selectedTournament?: PGATournamentInfo;
}

/**
 * Map common country names to ASCII-style country codes
 */
const COUNTRY_CODES: Record<string, string> = {
  "United States": "USA",
  "USA": "USA",
  "England": "ENG",
  "Scotland": "SCO",
  "Wales": "WAL",
  "Northern Ireland": "NIR",
  "Ireland": "IRL",
  "Canada": "CAN",
  "Australia": "AUS",
  "South Africa": "RSA",
  "Japan": "JPN",
  "South Korea": "KOR",
  "Korea": "KOR",
  "Spain": "ESP",
  "Germany": "GER",
  "France": "FRA",
  "Italy": "ITA",
  "Sweden": "SWE",
  "Denmark": "DEN",
  "Norway": "NOR",
  "Belgium": "BEL",
  "Netherlands": "NED",
  "Mexico": "MEX",
  "Argentina": "ARG",
  "Colombia": "COL",
  "Chile": "CHI",
  "New Zealand": "NZL",
  "China": "CHN",
  "Chinese Taipei": "TPE",
  "Taiwan": "TPE",
  "Thailand": "THA",
  "Philippines": "PHI",
  "India": "IND",
  "Austria": "AUT",
  "Switzerland": "SUI",
  "Finland": "FIN",
  "Poland": "POL",
  "Czech Republic": "CZE",
  "Czechia": "CZE",
  "Portugal": "POR",
  "Zimbabwe": "ZIM",
  "Fiji": "FIJ",
  "Venezuela": "VEN",
  "Paraguay": "PAR",
  "Puerto Rico": "PUR",
  "Singapore": "SIN",
  "Malaysia": "MAS",
  "Indonesia": "INA",
  "Brazil": "BRA",
  "Peru": "PER",
  "Greece": "GRE",
  "Hungary": "HUN",
  "Romania": "ROU",
  "Slovakia": "SVK",
  "Slovenia": "SLO",
  "Croatia": "CRO",
  "Serbia": "SRB",
  "Bulgaria": "BUL",
  "Turkey": "TUR",
  "Israel": "ISR",
  "Egypt": "EGY",
  "Morocco": "MAR",
  "Kenya": "KEN",
  "Nigeria": "NGR",
  "Ghana": "GHA",
  "Cameroon": "CMR",
  "Ivory Coast": "CIV",
  "Senegal": "SEN",
  "Tunisia": "TUN",
  "Algeria": "ALG",
  "Jamaica": "JAM",
  "Bahamas": "BAH",
  "Trinidad and Tobago": "TTO",
  "Bermuda": "BER",
  "Panama": "PAN",
  "Costa Rica": "CRC",
  "Honduras": "HON",
  "Guatemala": "GUA",
  "Dominican Republic": "DOM",
  "Ecuador": "ECU",
  "Uruguay": "URU",
  "Bolivia": "BOL",
  "Vietnam": "VIE",
  "Hong Kong": "HKG",
  "Pakistan": "PAK",
  "Bangladesh": "BAN",
  "Sri Lanka": "SRI",
  "Nepal": "NEP",
  "Myanmar": "MYA",
  "Cambodia": "CAM",
  "Laos": "LAO",
  "Brunei": "BRU",
  "Mongolia": "MGL",
  "Kazakhstan": "KAZ",
  "Uzbekistan": "UZB",
  "Saudi Arabia": "KSA",
  "United Arab Emirates": "UAE",
  "Qatar": "QAT",
  "Kuwait": "KUW",
  "Bahrain": "BRN",
  "Oman": "OMA",
  "Jordan": "JOR",
  "Lebanon": "LIB",
  "Iran": "IRI",
  "Iraq": "IRQ",
  "Cyprus": "CYP",
  "Luxembourg": "LUX",
  "Iceland": "ISL",
  "Estonia": "EST",
  "Latvia": "LAT",
  "Lithuania": "LTU",
  "Ukraine": "UKR",
  "Belarus": "BLR",
  "Moldova": "MDA",
  "Georgia": "GEO",
  "Armenia": "ARM",
  "Azerbaijan": "AZE",
};

/**
 * Get ASCII-style country code for a country name
 */
function getCountryCode(country?: string): string {
  if (!country) return "";
  return COUNTRY_CODES[country] ?? "";
}

interface GolfLeaderboardTableProps {
  tournament: GolfTournament;
  lastUpdated: Date;
}

/**
 * Check if all active players have completed their round
 */
function isRoundPlayComplete(players: GolfPlayer[], currentRound?: number): boolean {
  if (!currentRound) return false;
  const activePlayers = players.filter((p) => p.status === "active");
  if (activePlayers.length === 0) return false;

  // Round is complete only when all active players have thru === "F"
  // Note: We can't rely on rounds array length because ESPN API populates it
  // with in-progress scores (e.g., 55 strokes after 16 holes)
  return activePlayers.every((p) => p.thru === "F");
}

/**
 * Get status display text for golf tournament
 */
function getTournamentStatusText(
  status: GolfTournamentStatus,
  currentRound?: number,
  roundPlayComplete?: boolean
): string {
  switch (status) {
    case "in_progress":
      if (roundPlayComplete && currentRound) {
        return `ROUND ${currentRound} PLAY COMPLETE`;
      }
      return currentRound ? `ROUND ${currentRound} IN PROGRESS` : "IN PROGRESS";
    case "completed":
      return "FINAL";
    case "scheduled":
      return "UPCOMING";
    case "canceled":
      return "CANCELED";
  }
}

/**
 * Get CSS class for tournament status
 */
function getTournamentStatusClass(status: GolfTournamentStatus): string {
  switch (status) {
    case "in_progress":
      return "text-live";
    case "completed":
      return "text-final";
    case "scheduled":
      return "text-scheduled";
    case "canceled":
      return "text-terminal-muted";
  }
}

/**
 * Get CSS class for player position (highlight top 3)
 */
function getPositionClass(position: string): string {
  const posNum = parseInt(position.replace("T", ""), 10);
  if (!isNaN(posNum) && posNum <= 3) {
    return "text-terminal-green";
  }
  return "";
}

/**
 * Get CSS class for score to par
 */
function getScoreClass(scoreToParNum: number): string {
  if (scoreToParNum < 0) return "text-terminal-green";
  if (scoreToParNum > 0) return "text-terminal-red";
  return "";
}

/**
 * Get status indicator for player
 */
function getPlayerStatusIndicator(status: string): string {
  switch (status) {
    case "cut":
      return "CUT";
    case "wd":
      return "WD";
    case "dq":
      return "DQ";
    default:
      return "";
  }
}

/**
 * Format thru value for display
 */
function formatThru(thru?: string): string {
  if (!thru) return "--";
  return thru;
}

/**
 * Format round score with par comparison coloring class
 */
function getRoundScoreClass(score: number | undefined, par: number = 72): string {
  if (score === undefined) return "";
  if (score < par) return "text-terminal-green";
  if (score > par) return "text-terminal-red";
  return "";
}

interface TournamentHeaderProps {
  tournament: GolfTournament;
}

/**
 * Flexible border line component that fills available width
 */
function GolfBorderLine({
  left,
  right,
  fill,
  className,
}: {
  left: string;
  right: string;
  fill: string;
  className: string;
}) {
  return (
    <div className={`flex ${className} leading-none`} aria-hidden="true">
      <span>{left}</span>
      <span className="flex-1 overflow-hidden whitespace-nowrap tracking-[0]">{fill.repeat(200)}</span>
      <span>{right}</span>
    </div>
  );
}

/**
 * Content section with ASCII vertical borders on sides
 * Uses absolute positioning so borders stretch to match content height
 */
function GolfBorderedSection({
  children,
  vertical,
  className
}: {
  children: React.ReactNode;
  vertical: string;
  className: string;
}) {
  return (
    <div className="relative">
      {/* Left border - absolute positioned, full height */}
      <div className={`absolute left-0 top-0 bottom-0 ${className} leading-none overflow-hidden`} aria-hidden="true">
        <span className="whitespace-pre">{(vertical + "\n").repeat(100)}</span>
      </div>
      {/* Content with padding for borders */}
      <div className="px-3">
        {children}
      </div>
      {/* Right border - absolute positioned, full height */}
      <div className={`absolute right-0 top-0 bottom-0 ${className} leading-none overflow-hidden`} aria-hidden="true">
        <span className="whitespace-pre">{(vertical + "\n").repeat(100)}</span>
      </div>
    </div>
  );
}

/**
 * Get border style based on tournament status (similar to GameDetail)
 */
function getBorderStyle(status: GolfTournamentStatus) {
  const doubleBorder = {
    corners: { tl: "╔", tr: "╗", bl: "╚", br: "╝", ml: "╠", mr: "╣" },
    horizontal: "═",
    vertical: "║",
  };

  switch (status) {
    case "in_progress":
      return {
        ...doubleBorder,
        textClass: "text-terminal-green",
      };
    case "completed":
      return {
        ...doubleBorder,
        textClass: "text-terminal-border",
      };
    case "scheduled":
    case "canceled":
    default:
      return {
        ...doubleBorder,
        textClass: "text-terminal-yellow",
      };
  }
}

/**
 * Tournament Score Header - similar to GameScoreHeader in GameDetail
 * Shows tournament status, leaders prominently, and key info
 */
function TournamentScoreHeader({ tournament }: TournamentHeaderProps) {
  const statusClass = getTournamentStatusClass(tournament.status);
  const roundPlayComplete = isRoundPlayComplete(tournament.players, tournament.currentRound);
  const statusText = getTournamentStatusText(tournament.status, tournament.currentRound, roundPlayComplete);
  const isLive = tournament.status === "in_progress";
  const isFinal = tournament.status === "completed";

  const border = getBorderStyle(tournament.status);

  // Get top 3 leaders for prominent display
  const leaders = tournament.players
    .filter((p) => p.status === "active")
    .slice(0, 3);

  // Build broadcast string
  const broadcastText = tournament.broadcasts?.slice(0, 4).join(", ");

  return (
    <div className="font-mono mb-6">
      {/* Top border */}
      <GolfBorderLine
        left={border.corners.tl}
        right={border.corners.tr}
        fill={border.horizontal}
        className={border.textClass}
      />

      {/* Upper section: Status and TV */}
      <GolfBorderedSection vertical={border.vertical} className={border.textClass}>
        {/* Status line */}
        <div className={`text-center py-2 ${statusClass}`}>
          {isLive && <span className="text-terminal-green mr-2">●</span>}
          {statusText}
        </div>

        {/* TV broadcast for live and scheduled tournaments */}
        {(isLive || tournament.status === "scheduled") && broadcastText && (
          <div className="text-center py-1 text-xs text-terminal-muted">
            <span className="sr-only">Broadcast on </span>
            <span className="text-terminal-cyan">TV:</span> {broadcastText}
          </div>
        )}
      </GolfBorderedSection>

      {/* Divider */}
      <GolfBorderLine
        left={border.corners.ml}
        right={border.corners.mr}
        fill={border.horizontal}
        className={border.textClass}
      />

      {/* Middle section: Tournament name and leaders */}
      <GolfBorderedSection vertical={border.vertical} className={border.textClass}>
        <div className="py-4">
          {/* Tournament name - centered and prominent */}
          <div className="text-center mb-4">
            <div className="text-xl sm:text-2xl font-bold text-terminal-fg">
              {tournament.name}
            </div>
            {tournament.currentRound && (
              <div className="text-terminal-muted text-sm">
                Round {tournament.currentRound} of {tournament.totalRounds}
              </div>
            )}
          </div>

          {/* Leaders display - like team scores in GameScoreHeader */}
          {leaders.length > 0 && (
            <div className="flex justify-center items-start gap-2 sm:gap-8">
              {leaders.map((player, index) => {
                const isLeader = index === 0;
                const scoreClass = getScoreClass(player.scoreToParNum);
                const countryCode = getCountryCode(player.country);

                return (
                  <div key={player.id} className="text-center min-w-16 sm:min-w-[120px]">
                    {/* Position badge */}
                    <div className={`text-xs mb-1 ${isLeader && isFinal ? "text-terminal-green" : "text-terminal-muted"}`}>
                      {player.position}
                    </div>
                    {/* Player name - hide country on mobile */}
                    <div className={`text-xs sm:text-base font-bold ${isLeader && isFinal ? "text-terminal-green" : "text-terminal-fg"}`}>
                      {countryCode && (
                        <span className="hidden sm:inline text-terminal-muted text-xs mr-1">{countryCode}</span>
                      )}
                      <span className="sm:hidden">{truncate(player.name.split(" ").pop() || player.name, 10)}</span>
                      <span className="hidden sm:inline">{truncate(player.name.split(" ").pop() || player.name, 12)}</span>
                    </div>
                    {/* Score */}
                    <div className={`text-xl sm:text-3xl font-bold ${scoreClass}`}>
                      {player.scoreToPar}
                    </div>
                    {/* Thru indicator */}
                    <div className="text-terminal-muted text-xs">
                      {player.thru === "F" ? "F" : player.thru ? `Thru ${player.thru}` : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* No leaders yet message */}
          {leaders.length === 0 && tournament.status !== "scheduled" && (
            <div className="text-center text-terminal-muted">
              Leaderboard data loading...
            </div>
          )}
        </div>
      </GolfBorderedSection>

      {/* Bottom border */}
      <GolfBorderLine
        left={border.corners.bl}
        right={border.corners.br}
        fill={border.horizontal}
        className={border.textClass}
      />
    </div>
  );
}

/**
 * Scheduled Tournament Header - for upcoming tournaments without player data
 * Shows tournament name, dates, and venue prominently
 */
function ScheduledTournamentHeader({
  name,
  startDate,
  endDate,
  venue,
  location,
  purseAmount,
  defendingChampion,
  broadcasts,
}: {
  name: string;
  startDate: Date;
  endDate?: Date;
  venue?: string;
  location?: string;
  purseAmount?: number;
  defendingChampion?: string;
  broadcasts?: string[];
}) {
  const border = getBorderStyle("scheduled");

  // Format dates
  const startStr = startDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const endStr = endDate?.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const dateRange = endStr ? `${startStr} - ${endStr}` : startStr;

  // Build broadcast string
  const broadcastText = broadcasts?.slice(0, 4).join(", ");

  // Format purse
  const formattedPurse = purseAmount ? formatCurrency(purseAmount) : null;

  // Build venue text
  const venueText =
    venue && venue !== "TBD"
      ? `${venue}${location ? `, ${location}` : ""}`
      : location || null;

  return (
    <div className="font-mono mb-6">
      {/* Top border */}
      <GolfBorderLine
        left={border.corners.tl}
        right={border.corners.tr}
        fill={border.horizontal}
        className={border.textClass}
      />

      {/* Upper section: Status and TV */}
      <GolfBorderedSection vertical={border.vertical} className={border.textClass}>
        {/* Status line */}
        <div className="text-center py-2 text-terminal-yellow">
          UPCOMING
        </div>

        {/* TV broadcast */}
        {broadcastText && (
          <div className="text-center py-1 text-xs text-terminal-muted">
            <span className="sr-only">Broadcast on </span>
            <span className="text-terminal-cyan">TV:</span> {broadcastText}
          </div>
        )}
      </GolfBorderedSection>

      {/* Divider */}
      <GolfBorderLine
        left={border.corners.ml}
        right={border.corners.mr}
        fill={border.horizontal}
        className={border.textClass}
      />

      {/* Middle section: Tournament name and dates */}
      <GolfBorderedSection vertical={border.vertical} className={border.textClass}>
        <div className="py-4">
          {/* Tournament name - centered and prominent */}
          <div className="text-center mb-4">
            <div className="text-xl sm:text-2xl font-bold text-terminal-fg">
              {name}
            </div>
          </div>

          {/* Date display - like scores in the live header */}
          <div className="flex justify-center items-center gap-4 sm:gap-8">
            <div className="text-center">
              <div className="text-terminal-muted text-xs mb-1">DATES</div>
              <div className="text-lg sm:text-xl font-bold text-terminal-yellow">
                {dateRange}
              </div>
            </div>
          </div>

          {/* Venue info */}
          {venueText && (
            <div className="text-center mt-4 text-terminal-muted text-sm">
              {venueText}
            </div>
          )}

          {/* Additional info row */}
          {(formattedPurse || defendingChampion) && (
            <div className="flex justify-center gap-6 mt-3 text-sm">
              {formattedPurse && (
                <div className="text-center">
                  <span className="text-terminal-muted">Purse: </span>
                  <span className="text-terminal-green">{formattedPurse}</span>
                </div>
              )}
              {defendingChampion && (
                <div className="text-center">
                  <span className="text-terminal-muted">Defending: </span>
                  <span className="text-terminal-fg">{truncate(defendingChampion, 20)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </GolfBorderedSection>

      {/* Bottom border */}
      <GolfBorderLine
        left={border.corners.bl}
        right={border.corners.br}
        fill={border.horizontal}
        className={border.textClass}
      />

      {/* Upcoming message */}
      <div className="text-center mt-4 text-terminal-muted text-sm">
        Leaderboard will be available once play begins
      </div>
    </div>
  );
}

/**
 * Tournament Info Section - similar to GameInfoSection
 */
function TournamentInfoSection({ tournament }: TournamentHeaderProps) {
  // Get primary course (host course or first course)
  const primaryCourse = tournament.courses?.find((c) => c.isHost) ?? tournament.courses?.[0];
  const additionalCourseCount = (tournament.courses?.length ?? 0) - 1;

  // Format purse
  const formattedPurse = tournament.purseAmount
    ? formatCurrency(tournament.purseAmount)
    : null;

  // Build venue/location
  const venueText =
    tournament.venue && tournament.venue !== "TBD"
      ? `${tournament.venue}${tournament.location ? `, ${tournament.location}` : ""}`
      : tournament.location || null;

  const hasInfo = primaryCourse || formattedPurse || tournament.defendingChampion || venueText;

  if (!hasInfo) return null;

  return (
    <div className="font-mono mt-6">
      {/* Section header */}
      <div className="flex text-terminal-border mb-4" style={{ lineHeight: 0.85, height: '1em' }} aria-hidden="true">
        <span className="text-terminal-fg whitespace-nowrap" style={{ lineHeight: 'normal' }}>TOURNAMENT INFO</span>
        <span className="ml-2 flex-1 overflow-hidden whitespace-nowrap tracking-[0]" style={{ lineHeight: 0.85, marginLeft: '0.5rem' }}>{"─".repeat(200)}</span>
      </div>

      <div className="space-y-1 text-sm">
        {/* Course info */}
        {primaryCourse && (
          <div className="flex">
            <span className="text-terminal-muted w-24">Course:</span>
            <span className="text-terminal-fg">
              {primaryCourse.name}
              {primaryCourse.par && ` · Par ${primaryCourse.par}`}
              {primaryCourse.totalYards && ` · ${formatNumber(primaryCourse.totalYards)} yds`}
            </span>
          </div>
        )}

        {/* Additional courses */}
        {additionalCourseCount > 0 && (
          <div className="flex">
            <span className="text-terminal-muted w-24" />
            <span className="text-terminal-muted text-xs">
              +{additionalCourseCount} additional course{additionalCourseCount > 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* Venue (if no course data) */}
        {!primaryCourse && venueText && (
          <div className="flex">
            <span className="text-terminal-muted w-24">Venue:</span>
            <span className="text-terminal-fg">{venueText}</span>
          </div>
        )}

        {/* Purse */}
        {formattedPurse && (
          <div className="flex">
            <span className="text-terminal-muted w-24">Purse:</span>
            <span className="text-terminal-green">{formattedPurse}</span>
          </div>
        )}

        {/* Defending champion */}
        {tournament.defendingChampion && (
          <div className="flex">
            <span className="text-terminal-muted w-24">Defending:</span>
            <span className="text-terminal-fg">{tournament.defendingChampion}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Displays PGA Tour leaderboard table (ESPN-style layout)
 */
function GolfLeaderboardTable({
  tournament,
  lastUpdated,
}: GolfLeaderboardTableProps) {
  return (
    <div className="overflow-x-auto">
      <div className="w-full">
        {/* Tournament score header - similar to GameScoreHeader */}
        <TournamentScoreHeader tournament={tournament} />

        {/* Leaderboard table with horizontal scroll */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-separate border-spacing-0" role="table" aria-label="Golf tournament leaderboard">
            {/* Header row */}
            <thead>
              <tr className="text-terminal-cyan border-b border-terminal-border">
                <th
                  className="w-[40px] min-w-[40px] text-center py-1 sticky left-0 z-30 bg-terminal-bg"
                >
                  POS
                </th>
                <th
                  className="min-w-36 px-2 text-left py-1 sticky left-[40px] z-30 bg-terminal-bg border-r border-terminal-border shadow-[4px_0_8px_rgba(0,0,0,0.3)]"
                >
                  PLAYER
                </th>
                <th className="px-3 text-center py-1 whitespace-nowrap">
                  SCORE
                </th>
                <th className="px-3 text-center py-1 whitespace-nowrap">
                  TODAY
                </th>
                <th className="px-2 text-center py-1 whitespace-nowrap">
                  THRU
                </th>
                <th className="px-2 text-center py-1 whitespace-nowrap">
                  R1
                </th>
                <th className="px-2 text-center py-1 whitespace-nowrap">
                  R2
                </th>
                <th className="px-2 text-center py-1 whitespace-nowrap">
                  R3
                </th>
                <th className="px-2 text-center py-1 whitespace-nowrap">
                  R4
                </th>
                <th className="px-2 text-center py-1 whitespace-nowrap">
                  TOT
                </th>
              </tr>
            </thead>

            {/* Player rows */}
            <tbody>
              {tournament.players.length > 0 ? (
                tournament.players.slice(0, 40).map((player, index) => {
                  const positionClass = getPositionClass(player.position);
                  const scoreClass = getScoreClass(player.scoreToParNum);
                  const statusIndicator = getPlayerStatusIndicator(player.status);
                  const isInactive = player.status !== "active";
                  const isEvenRow = index % 2 === 0;
                  const countryCode = getCountryCode(player.country);
                  // Apply background to each cell individually (not tr) for proper sticky behavior
                  const cellBgClass = isEvenRow ? "bg-terminal-bg" : "bg-terminal-zebra";

                  const positionLabel = player.position.startsWith("T")
                    ? `Tied for position ${player.position.slice(1)}`
                    : `Position ${player.position}`;

                  return (
                    <tr
                      key={player.id}
                      className={`${isInactive ? "text-terminal-muted" : ""} border-b border-terminal-border/30`}
                    >
                      {/* Position - sticky */}
                      <td
                        className={`w-[40px] min-w-[40px] text-center py-1 sticky left-0 z-20 ${positionClass} ${cellBgClass}`}
                      >
                        <span className="sr-only">{positionLabel}</span>
                        <span aria-hidden="true">
                          {statusIndicator || player.position}
                        </span>
                      </td>

                      {/* Player name with country code - sticky */}
                      <td
                        className={`min-w-36 px-2 py-1 sticky left-[40px] z-20 border-r border-terminal-border shadow-[4px_0_8px_rgba(0,0,0,0.3)] ${cellBgClass}`}
                      >
                        <div className="flex items-center gap-1.5">
                          {countryCode && (
                            <span className="hidden sm:inline text-terminal-muted text-xs font-mono" title={player.country}>
                              {countryCode}
                            </span>
                          )}
                          <span className="truncate">{truncate(player.name, 18)}</span>
                        </div>
                      </td>

                      {/* Score to par */}
                      <td className={`px-3 text-center py-1 whitespace-nowrap ${cellBgClass} ${scoreClass}`}>
                        <span className="sr-only">
                          {player.scoreToParNum < 0
                            ? `${Math.abs(player.scoreToParNum)} under par`
                            : player.scoreToParNum > 0
                            ? `${player.scoreToParNum} over par`
                            : "Even par"}
                        </span>
                        <span aria-hidden="true">{player.scoreToPar}</span>
                      </td>

                      {/* Today's score */}
                      <td className={`px-3 text-center py-1 whitespace-nowrap ${cellBgClass}`}>
                        {player.today ?? "--"}
                      </td>

                      {/* Thru */}
                      <td className={`px-2 text-center py-1 text-terminal-muted whitespace-nowrap ${cellBgClass}`}>
                        {formatThru(player.thru)}
                      </td>

                      {/* Round 1 */}
                      <td className={`px-2 text-center py-1 whitespace-nowrap ${cellBgClass} ${getRoundScoreClass(player.rounds[0])}`}>
                        {player.rounds[0] ?? "--"}
                      </td>

                      {/* Round 2 */}
                      <td className={`px-2 text-center py-1 whitespace-nowrap ${cellBgClass} ${getRoundScoreClass(player.rounds[1])}`}>
                        {player.rounds[1] ?? "--"}
                      </td>

                      {/* Round 3 */}
                      <td className={`px-2 text-center py-1 whitespace-nowrap ${cellBgClass} ${getRoundScoreClass(player.rounds[2])}`}>
                        {player.rounds[2] ?? "--"}
                      </td>

                      {/* Round 4 */}
                      <td className={`px-2 text-center py-1 whitespace-nowrap ${cellBgClass} ${getRoundScoreClass(player.rounds[3])}`}>
                        {player.rounds[3] ?? "--"}
                      </td>

                      {/* Total strokes */}
                      <td className={`px-2 text-center py-1 whitespace-nowrap ${cellBgClass}`}>
                        {player.totalStrokes ?? "--"}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="text-terminal-muted text-center py-4">
                    No players on leaderboard yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Show count if truncated */}
          {tournament.players.length > 40 && (
            <div className="text-terminal-muted text-xs text-center pt-2">
              Showing top 40 of {tournament.players.length} players
            </div>
          )}
        </div>

        {/* Tournament info section */}
        <TournamentInfoSection tournament={tournament} />

        {/* Last updated */}
        <div className="text-terminal-muted text-xs text-center pt-4">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}

/**
 * Server component - displays PGA Tour leaderboard
 */
export function GolfLeaderboardDisplay({ leaderboard, selectedTournament }: GolfLeaderboardProps) {
  const { tournament } = leaderboard;

  if (!tournament) {
    // Show selected tournament info if available
    if (selectedTournament) {
      return (
        <ScheduledTournamentHeader
          name={selectedTournament.name}
          startDate={selectedTournament.startDate}
          endDate={selectedTournament.endDate}
        />
      );
    }

    // No tournament info at all
    const border = getBorderStyle("scheduled");
    return (
      <div className="font-mono">
        {/* Top border */}
        <GolfBorderLine
          left={border.corners.tl}
          right={border.corners.tr}
          fill={border.horizontal}
          className={border.textClass}
        />

        {/* Status */}
        <GolfBorderedSection vertical={border.vertical} className={border.textClass}>
          <div className="text-center py-2 text-terminal-yellow">
            NO ACTIVE TOURNAMENT
          </div>
        </GolfBorderedSection>

        {/* Divider */}
        <GolfBorderLine
          left={border.corners.ml}
          right={border.corners.mr}
          fill={border.horizontal}
          className={border.textClass}
        />

        {/* Message */}
        <GolfBorderedSection vertical={border.vertical} className={border.textClass}>
          <div className="py-8 text-center">
            <div className="text-terminal-muted">
              Tournament data not yet available
            </div>
            <div className="text-terminal-muted text-xs mt-2">
              Check back closer to the tournament start date
            </div>
          </div>
        </GolfBorderedSection>

        {/* Bottom border */}
        <GolfBorderLine
          left={border.corners.bl}
          right={border.corners.br}
          fill={border.horizontal}
          className={border.textClass}
        />
      </div>
    );
  }

  // Show upcoming tournament info if tournament is scheduled with no players
  if (tournament.status === "scheduled" && tournament.players.length === 0) {
    // Get primary course for venue info
    const primaryCourse = tournament.courses?.find((c) => c.isHost) ?? tournament.courses?.[0];
    const venueText = primaryCourse?.name ?? tournament.venue;

    return (
      <ScheduledTournamentHeader
        name={tournament.name}
        startDate={tournament.startDate}
        endDate={tournament.endDate}
        venue={venueText}
        location={tournament.location}
        purseAmount={tournament.purseAmount}
        defendingChampion={tournament.defendingChampion}
        broadcasts={tournament.broadcasts}
      />
    );
  }

  return (
    <GolfLeaderboardTable
      tournament={tournament}
      lastUpdated={leaderboard.lastUpdated}
    />
  );
}
