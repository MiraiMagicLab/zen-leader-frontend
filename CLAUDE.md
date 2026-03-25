# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server with HMR
npm run build     # Type-check + production build
npm run lint      # ESLint validation
npm run preview   # Preview production build
```

No test runner is configured.

## Architecture

**Stack:** React 19 + TypeScript, Vite 8 (Oxc), React Router v7, Tailwind CSS v4, Framer Motion, shadcn/ui built on `@base-ui/react`.

**Routing** (`src/App.tsx`): SPA with client-side routing. `/` redirects to `/login`. The `/dashboard` route uses `DashboardLayout` with nested `<Outlet>` routes (`/dashboard`, `/dashboard/settings`, `/dashboard/profile`).

**Layout** (`src/components/layout/DashboardLayout.tsx`): Persistent sidebar + sticky header shell. Desktop sidebar is a fixed 256px column; mobile uses the `Sheet` component as a drawer. Page content renders via `<Outlet>`.

**Pages** (`src/pages/`): Three pages exist — `LoginPage`, `DashboardPage`, `SettingsPage`. All use Framer Motion for animated page entry. Login simulates a 1500ms delay then navigates to `/dashboard`. All data is hardcoded mock data — there is no API integration.

**State:** No centralized state management. `useState` is used only for local UI state (form inputs, toggles). There is no auth system — anyone can navigate to `/dashboard` directly.

**Styling:** Tailwind CSS v4 via PostCSS. Custom CSS design tokens (the "Zenith Design System") are defined in `src/index.css`. Use `cn()` from `src/lib/utils.ts` (wraps `clsx` + `tailwind-merge`) when composing class names. Component variants use `class-variance-authority`.

**UI Components** (`src/components/ui/`): Shadcn-style components generated via the shadcn CLI (`components.json` configures `base-nova` style with `@base-ui/react` as the primitive layer). Add new components with `npx shadcn add <component>`.

**Icons:** Material Symbols loaded from Google Fonts (via `index.html`), plus Lucide React for shadcn components. Use Material Symbols for dashboard chrome icons, Lucide where shadcn components expect icon props.

**Path alias:** `@/` maps to `src/` (configured in both `vite.config.ts` and `tsconfig.json`).
