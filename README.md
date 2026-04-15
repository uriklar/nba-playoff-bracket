# NBA Playoff Bracket Challenge

A bracket prediction app to compete by picking NBA playoff series winners and lengths. Built with React + TypeScript + Vite + Tailwind, backed by Supabase, and deployed on Vercel.

## Getting Started

1. Clone the repo
2. `pnpm install`
3. Copy `.env.example` to `.env` and fill in your Supabase credentials
4. `pnpm dev`

## Live Official Results Sync

The app can sync official playoff series results from the `balldontlie` NBA API.

Required server-side env vars:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `BALLDONTLIE_API_KEY`

Optional server-side env vars:

- `RESULTS_SYNC_MIN_INTERVAL_SECONDS`
- `CRON_SECRET`

The sync endpoint is `POST /api/sync-official-results`.
It is designed to:

- fetch current playoff games from `balldontlie`
- detect when a best-of-7 series has been clinched
- update the latest `official_results` row in Supabase
- let the scoreboard read synced results from Supabase

If `CRON_SECRET` is set, requests to the sync endpoint must include
`Authorization: Bearer <CRON_SECRET>`.

By default, the sync route enforces a 6-hour cooldown between syncs unless
`RESULTS_SYNC_MIN_INTERVAL_SECONDS` overrides it.

Vercel cron is configured to hit that endpoint every 6 hours (4 times per day).

## Repo Map

```
.
├── public/
│   ├── basketball.svg                   # Basketball icon used in the nav/favicon
│   └── vite.svg
│
├── src/
│   ├── main.tsx                        # React entry point
│   ├── App.tsx                         # Router: / (Scoreboard), /view-bracket
│   ├── index.css                       # Tailwind imports
│   ├── types.ts                        # Core domain types: Team, Game, Guess, Guesses
│   ├── vite-env.d.ts                   # Vite type declarations
│   │
│   ├── components/
│   │   ├── BracketDisplay.tsx           # Reusable bracket renderer (horizontal & conference layouts)
│   │   │                                #   Contains GameCard for individual matchup display
│   │   ├── BracketSubmissionPage.tsx     # Form page for submitting bracket predictions (currently disabled)
│   │   ├── ScoreboardPage.tsx           # Main page: leaderboard table, official results bracket,
│   │   │                                #   scoring formula modal, team prediction filter
│   │   └── ui/
│   │       └── button.tsx               # shadcn/ui Button component
│   │
│   ├── pages/
│   │   └── ViewBracketPage.tsx          # View any player's submitted bracket (read-only)
│   │
│   ├── hooks/
│   │   └── useBracketSubmission.ts      # State management for bracket submission form
│   │                                    #   (game progression, guess tracking, Supabase upsert)
│   │
│   ├── data/
│   │   ├── playoffBracketTemplate.json  # Bracket structure: all 15 games with teams, seeds, logos, rounds
│   │   ├── guesses.ts                   # Static hardcoded user predictions (used in static scoring mode)
│   │   ├── officialResultsTemplate.json # Template for official series results
│   │   └── temp.json
│   │
│   ├── utils/
│   │   ├── supabase.ts                  # Supabase client init (reads VITE_SUPABASE_URL/ANON_KEY)
│   │   ├── db.ts                        # DB operations: getSubmissions, getSubmission,
│   │   │                                #   upsertSubmission, getOfficialResults
│   │   ├── scoring.ts                   # Score calculation: determineRound, calculateScore,
│   │   │                                #   calculatePotentialPoints (max remaining pts)
│   │   ├── scoreboardData.ts            # Scoreboard loading: static mode (from guesses.ts)
│   │   │                                #   and dynamic mode (from Supabase)
│   │   ├── constants.ts                 # Scoring config per round + game ID regex patterns
│   │   ├── types.ts                     # PlayoffRound enum, GameResult, RoundPoints
│   │   └── stats.ts                     # Helper fns: getSeedDifference, getPredictors,
│   │                                    #   getSeriesIds, getRoundNumber, getConference
│   │
│   ├── analysis/                        # Statistical analysis modules for prediction data
│   │   ├── index.ts                     # runComprehensiveAnalysis() — aggregates all analyses
│   │   ├── consensusAnalysis.ts         # How much predictors agree on each series
│   │   ├── gameLengthAnalysis.ts        # Series length prediction patterns by round
│   │   ├── conferenceBiasAnalysis.ts    # East vs West bias in predictions
│   │   ├── teamPopularityAnalysis.ts    # Most/least picked teams, dark horse picks
│   │   ├── predictorBehaviorAnalysis.ts # Similarity between predictors, contrary picks
│   │   ├── predictorConsistencyAnalysis.ts # Seed consistency in predictions
│   │   ├── seriesCompetitivenessAnalysis.ts # Expected competitiveness of each series
│   │   ├── bracketPathAnalysis.ts       # Championship paths and expected matchups
│   │   ├── upsetAnalysis.ts             # Upset predictions by seed differential
│   │   └── *.test.ts                    # Unit tests for each analysis module
│   │
│   ├── styles/
│   │   └── globals.css                  # Global styles
│   │
│   ├── assets/
│   │   └── react.svg
│   │
│   └── lib/
│       └── utils.ts                     # cn() helper (clsx + tailwind-merge)
│
├── supabase/
│   └── migrations/
│       └── 001_init.sql                 # Schema: submissions (user brackets) + official_results tables
│
├── .env.example                         # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
├── package.json                         # pnpm, Vite, React 18, Supabase, Tailwind, Jest
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── vercel.json                          # Vercel deployment config
├── tasks.md                             # Project task tracking
└── stat-tasks.md (in src/)              # Analysis task tracking
```

## Scoring

| Round | Correct Winner | Correct Series Length | Max Per Series |
|---|---|---|---|
| First Round | 8 pts | 6 pts | 14 pts |
| Conference Semifinals | 12 pts | 8 pts | 20 pts |
| Conference Finals | 16 pts | 10 pts | 26 pts |
| NBA Finals | 24 pts | 12 pts | 36 pts |

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, React Router
- **Backend**: Supabase (Postgres + REST API)
- **Build**: Vite
- **Testing**: Jest + React Testing Library
- **Deploy**: Vercel
