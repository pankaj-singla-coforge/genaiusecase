# Insurance Dashboard

Production-ready Next.js (App Router + TypeScript) dashboard for Excel/CSV analytics with schema inference, interactive charts, and rich table filtering.

## Stack

- Next.js 16 (App Router)
- Tailwind CSS v4 + shadcn/ui
- Recharts for charts
- xlsx for client-side parsing
- Zustand for state management (with persisted UI preferences)
- react-hook-form + zod for upload validation
- lucide-react + framer-motion for icons and subtle motion

## Features

- Upload `.xlsx`, `.xls`, `.csv` via drag-and-drop or file picker
- Automatic schema inference:
	- Column headers
	- Type detection (`string`, `number`, `date`)
	- Suggested dimension/measure/date columns
- KPI cards:
	- Total rows
	- Numeric column count
	- Distinct dimension count
	- Aggregated measure (`sum`, `avg`, `count`, `min`, `max`)
- Visualizations:
	- Bar chart (dimension vs aggregated measure)
	- Pie chart (Top 10 categories)
	- Line chart by day/week/month when a date column exists
- Data table:
	- Sortable columns
	- Pagination
	- Column show/hide
	- Export current view to CSV
- Filtering:
	- Global search
	- Per-column text filter
	- Date range filter
- Dark mode by default, responsive layout, polished visuals, and clear empty/error states
- Persisted user preferences in local storage (dimension, measure, aggregation, filters, etc.)

## Local Development

```bash
npm install
npm run dev
```

Then open http://localhost:3000

## Production Build

```bash
npm run lint
npm run build
npm run start
```

## Azure App Service Deployment Notes

This project is configured with:

- `next.config.ts` -> `output: "standalone"`

Recommended App Service settings:

- Runtime: Node.js 20 LTS
- Startup command: `npm run start`
- Build command: `npm run build`

Environment variables (if needed later):

- `NODE_ENV=production`
- `PORT` is managed by App Service

## Scripts

- `npm run dev` - Start development server
- `npm run lint` - Run ESLint
- `npm run build` - Create production build
- `npm run start` - Start production server
