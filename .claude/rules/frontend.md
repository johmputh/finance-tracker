---
description: Conventions and design system for the React frontend
globs: apps/frontend/**
---

# Frontend rules (apps/frontend)

## Core

- **Tailwind utility classes only.** No CSS modules, no inline `style={{ ... }}`.
- **Function components + hooks only.** No class components.
- **React Router** for routing.
- **State** via React hooks (`useState`, `useReducer`).
- **API calls** go through the fetch wrapper in `src/lib/api.ts` — never call `fetch` directly in components.
- **File placement:** pages in `src/pages/`, components in `src/components/`.
- **Reuse, never copy-paste.** Any UI pattern used more than once (card, button, input, modal) must be extracted into a reusable component in `src/components/ui/`, named in `PascalCase`. Do not duplicate the same markup structure across pages.

## Design system — Premium Dark Theme

Dark-only. There is no light mode.

### Surfaces & text
- Root background: `bg-zinc-950`
- Cards: `bg-zinc-900`
- Nested surfaces: `bg-zinc-800`
- Default text: `text-zinc-100`

### Palette
- `zinc` is the neutral scale for everything.
- **One** accent color only (pick `emerald` *or* `cyan` and use it consistently), reserved for CTAs and highlights.
- Semantic colors:
  - Income (รายรับ): `emerald-500`
  - Expense (รายจ่าย): `rose-500`
  - Balance: the accent color

### Typography (Google Fonts only)
- Body: **Sarabun**
- Headings: **Kanit** — bold, sharp, with clear visual hierarchy.

### Component styling
- **Cards:** `rounded-xl` + `border border-zinc-800` + a light `shadow-lg`.
- **Buttons:** `hover:scale-[1.02]` + `transition` + `active:scale-95` for press feedback.
- **Inputs:** `focus:ring-2 focus:ring-accent/50`; remove the default browser outline.
- **Animations:** fade-in on mount; skeletons while loading; hover transitions at `duration-200`.

## Localization (Thai-first app)

- **All UI text in Thai** — labels, buttons, errors, modals, empty states.
- **Money:** `฿` prefix with thousands separators, e.g. `฿1,250`.
- **Dates:** format with `Intl.DateTimeFormat('th-TH')`, e.g. `"20 เม.ย. 2026"`.

## Responsive (mobile-first)

- **Target range:** iPhone SE (375px) up to desktop.
- Design the 375px layout first, then scale up with Tailwind breakpoints (`sm:`, `md:`, `lg:`).
- **Navigation:** mobile uses a hamburger or bottom nav; desktop uses a sidebar or top nav.
- **Summary cards:** 1 column on mobile → 3 columns on desktop.
- **Dashboard charts:** 1 column on mobile → 2–3 columns on desktop.
- **Tables:** render as a card list on mobile; a real table on desktop.
- **Modals:** fullscreen on mobile; centered dialog on desktop.
- **Touch targets:** interactive elements at least `44×44px` (iOS HIG).

## Never

- Strong/loud gradients
- Decorative emoji used as icons
- Heavy drop shadows
- Garish, oversaturated colors
- Any font other than the chosen Google Fonts (Sarabun / Kanit)
