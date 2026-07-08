# Run & Rope Events

Subscription-based event directory for barrel racing and roping events.

## Stack

- [Next.js 16](https://nextjs.org/) (App Router)
- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS 4](https://tailwindcss.com/)

## Project structure

```
src/
├── app/                    # Routes and pages
│   ├── events/             # Event directory & detail pages
│   ├── subscription/       # Subscription plans
│   └── api/                # API routes (future)
├── components/
│   ├── events/             # Event UI components
│   ├── layout/             # Header, footer, shell
│   └── subscription/       # Plan cards and billing UI
├── lib/
│   ├── constants.ts        # App-wide constants
│   └── events/             # Event data helpers
└── types/                  # Shared TypeScript types
```

## Getting started

Node.js is installed locally at `~/.local/node-v22.17.0-darwin-arm64/bin`. Add it to your shell profile:

```bash
export PATH="$HOME/.local/node-v22.17.0-darwin-arm64/bin:$PATH"
```

Then from the project directory:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Cloudflare R2 (flyer uploads)

Event flyer uploads are stored in Cloudflare R2 when a user selects a file on `/submit`.

1. Create an R2 bucket in the [Cloudflare dashboard](https://dash.cloudflare.com/).
2. Create an R2 API token with read/write access to that bucket.
3. Enable public access for the bucket (custom domain or `r2.dev` URL).
4. Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

| Variable | Description |
| -------- | ----------- |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret |
| `R2_BUCKET_NAME` | Bucket name for flyer storage |
| `R2_PUBLIC_URL` | Public base URL for uploaded files (no trailing slash) |

Upload flow:

1. User selects a flyer on `/submit`
2. The file is sent to `POST /api/events/upload-flyer`
3. The API uploads to R2 and returns `{ url, key }`
4. The form stores `flyerUrl` and includes it in the final event submission

## Connect to GitHub

Git requires **Xcode Command Line Tools** on macOS. Install them first:

```bash
xcode-select --install
```

Then connect this project to your GitHub repository:

```bash
cd ~/Projects/run-and-rope-events
git init
git add .
git commit -m "Initial commit: Next.js event directory scaffold"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/run-and-rope-events.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username, or use your existing repository URL.

## Scripts

| Command        | Description              |
| -------------- | ------------------------ |
| `npm run dev`  | Start development server |
| `npm run build`| Production build         |
| `npm run start`| Start production server  |
| `npm run lint` | Run ESLint               |
