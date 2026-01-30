# ASCII Scores

```
    _    ____   ____ ___ ___   ____   ____ ___  ____  _____ ____
   / \  / ___| / ___|_ _|_ _| / ___| / ___/ _ \|  _ \| ____/ ___|
  / _ \ \___ \| |    | | | |  \___ \| |  | | | | |_) |  _| \___ \
 / ___ \ ___) | |___ | | | |   ___) | |__| |_| |  _ <| |___ ___) |
/_/   \_\____/ \____|___|___| |____/ \____\___/|_| \_\_____|____/
```

Real-time sports scoreboards rendered in ASCII art. Track live scores for NHL, NFL, NBA, MLB, MLS, and Formula 1.

## Features

- **Live Scoreboards** - Real-time scores with automatic polling
- **ASCII Art Rendering** - Beautiful retro-style scoreboards using box-drawing characters
- **Multi-League Support** - NHL, NFL, NBA, MLB, MLS, and F1
- **Server-Side Caching** - Efficient data fetching with Next.js 16 `"use cache"` directive
- **Lightweight** - Minimal client-side JavaScript, ASCII art is just text

## Tech Stack

- **Framework**: Next.js 16.1 (App Router + Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Data Sources**: ESPN API, OpenF1 API
- **Hosting**: Vercel

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/BradMcGonigle/ascii-scores.git
cd ascii-scores

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server with Turbopack |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run tests |

## Example Scoreboards

**NHL Game:**
```
+==========================================+
|           NHL  *  2ND PERIOD             |
|                  12:34                   |
+==========================================+
|                                          |
|    BOS  ████████████████████░░░░  3      |
|    TOR  ████████████░░░░░░░░░░░░  2      |
|                                          |
|  SOG: 24-18      PP: 1/2 - 0/1           |
+==========================================+
```

**F1 Leaderboard:**
```
+==========================================+
|      FORMULA 1  *  MONACO GP  LAP 42/78  |
+====+=================+=======+===========+
| P  | DRIVER          | GAP   | LAST LAP  |
+====+=================+=======+===========+
|  1 | VER Red Bull    | ----  | 1:12.345  |
|  2 | LEC Ferrari     | +2.1s | 1:12.567  |
|  3 | HAM Mercedes    | +4.8s | 1:12.891  |
+====+=================+=======+===========+
```

## Project Structure

```
ascii-scores/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Dashboard
│   │   └── [league]/        # League-specific pages
│   ├── components/          # React components
│   │   ├── ascii/           # ASCII rendering components
│   │   ├── scoreboards/     # Sport-specific scoreboards
│   │   └── layout/          # Layout components
│   └── lib/                 # Utilities & API clients
│       ├── api/             # ESPN & OpenF1 clients
│       ├── ascii/           # ASCII art utilities
│       └── utils/           # Helper functions
├── tests/                   # Test files
├── ARCHITECTURE.md          # Detailed architecture docs
└── README.md                # This file
```

## Data Sources

### ESPN API (Unofficial)

Used for NHL, NFL, NBA, MLB, and MLS scoreboards. This is an unofficial API - please respect rate limits.

### OpenF1 API

Used for Formula 1 data including sessions, drivers, positions, and lap times. Community-driven and free to use.

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is open source under the [MIT License](LICENSE).

## Acknowledgments

- ESPN for their hidden API endpoints
- [OpenF1](https://openf1.org/) for Formula 1 data
- The ASCII art community for inspiration
