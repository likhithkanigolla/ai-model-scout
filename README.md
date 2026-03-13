# COMPASSLLM Frontend

React frontend for the COMPASSLLM AutoML workflow.

Repository: `https://github.com/likhithkanigolla/COMPASSLLM`

## What It Does

- Uploads datasets.
- Shows CSV previews.
- Lets the user choose a target column.
- Lets the user exclude columns and rerun analysis.
- Displays analysis charts and summary metrics.
- Requests LLM model recommendations.
- Triggers training and shows results.
- Provides download links for trained models.
- Displays dashboard metrics and knowledge-base entries.

## Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Zustand
- Framer Motion
- Recharts

## Local Development

```bash
npm install
npm run dev
```

The dev server runs on port `8080`.

## API Integration

The frontend proxies API calls from `/api` to:

```text
http://127.0.0.1:10120
```

This is configured in `vite.config.ts`.

## Fallback Behavior

The frontend API client supports fallback mock data for local development when the backend is unavailable.

Relevant environment variables:

- `VITE_API_BASE_URL` default: `/api`
- `VITE_ENABLE_API_FALLBACK` default: `true`

## Recommended Run Order

1. Start PostgreSQL.
2. Start the backend.
3. Start the frontend.
4. Open the app in the browser.

## Main User Flow

1. Upload dataset.
2. Review preview.
3. Run analysis.
4. Exclude columns or change target.
5. Re-run analysis.
6. Continue to recommendations.
7. Train models.
8. Download artifacts.
