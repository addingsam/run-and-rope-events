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
