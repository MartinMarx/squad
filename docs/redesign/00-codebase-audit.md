# Phase 0 — Codebase Audit

_Read this once at the start of the redesign. Captures the shape of the app **as it exists today** so later phases can be specific and avoid re-discovery._

## TL;DR

This codebase is much better equipped for a UI rework than a typical Electron app:

- ✅ Tailwind v4 with a comprehensive token system already in place
- ✅ Two themes wired up (`emlight`, `emdark`) with full P3 color palettes
- ✅ shadcn/Radix UI primitives library in `lib/ui/` (~50 components)
- ✅ Native title bar on macOS (`hiddenInset` + traffic-light positioning)
- ✅ System fonts already in `--font-sans`
- ✅ Custom thin scrollbars using semantic tokens
- ⚠️ Stale `agents/architecture/renderer.md` (references `views/` + `components/` directories that no longer exist)
- ⚠️ Dead Tailwind `dark:` variants in primitives (e.g. `button.tsx`) — no `.dark` class is ever applied
- ⚠️ Leftover `@custom-variant dark` and `@custom-variant dark-black` declared in CSS but never set on root
- ❌ No elevation / shadow tokens
- ❌ No motion / easing / duration tokens
- ❌ No documented z-index scale
- ❌ No platform-specific titlebar adjustments (macOS vs Windows/Linux)
- ❌ Heavy editors (Monaco, xterm) are themed via JS at runtime — CSS-only changes won't propagate to open editors

**Implication:** the rework is primarily **aesthetic redirection** (re-defining the semantic tokens and redesigning component variants), not infrastructure construction.

---

## Stack

| Concern | Tool |
|---|---|
| Build | electron-vite 5, Vite 6, TypeScript 6 |
| Runtime | Electron 40, React 19 |
| State | MobX (class-based stores) + TanStack Query |
| Routing | Custom view registry (not React Router) |
| Styling | Tailwind v4 (`@tailwindcss/vite`), CSS variables, `tw-animate-css` |
| Primitives | Radix UI (Dialog, Popover, Tooltip, Select, Menu, …), `@base-ui/react` (Button), `class-variance-authority` + `clsx` + `tailwind-merge` |
| Animation | `framer-motion` 12, `motion` 12 |
| Icons | `lucide-react` |
| Heavy editors | Monaco (code), TipTap (rich text), xterm.js (terminals) |
| Layout | `react-resizable-panels`, `allotment`, `@dnd-kit` |
| Notifications | `sonner` |

---

## Repo Layout (renderer-relevant)

```
src/
├── main/                Electron main process — RPC controllers, services, DB, PTY, SSH, updater
│   ├── app/             window.ts (BrowserWindow), menu.ts, protocol.ts
│   ├── core/            domain modules (account, conversations, mcp, projects, tasks, terminals, …)
│   └── rpc.ts           RPC router assembly
├── preload/             contextBridge exposing window.electronAPI
├── renderer/
│   ├── App.tsx          Provider composition + AppView state (onboarding | welcome | workspace)
│   ├── main.tsx         Bootstrap + Monaco init + RPC wiring + ReactDOM.createRoot
│   ├── index.css        ⚠️ 883 lines — single source of design tokens
│   ├── app/             workspace.tsx, welcome.tsx, home-view.tsx, view-registry.ts, modal-registry.ts
│   ├── features/        sidebar, projects, tasks, settings, skills, mcp, library, integrations,
│   │                    onboarding, command-palette
│   ├── lib/
│   │   ├── ui/          ~50 component primitives (button, dialog, input, popover, …)
│   │   ├── components/  app-shell components (error-boundary, monaco-keyboard-bridge, …)
│   │   ├── providers/   theme-provider, github-context-provider, integrations-provider, …
│   │   ├── layout/      workspace-layout, navigation-provider, layout-provider
│   │   └── …            editor, monaco, pty, hooks, stores, commands, theme
│   └── _legacy/         legacy code (untouched in this audit)
└── shared/              IPC primitives, event definitions, domain types, provider registry
```

⚠️ `agents/architecture/renderer.md` references `src/renderer/views/` and `src/renderer/components/` directories — these **do not exist**. The doc is stale. Updating it is out of scope for this audit but worth doing alongside the rework.

---

## Top-level App Shell (`src/renderer/App.tsx`)

Three top-level `AppView` states, gated on session and legacy-port detection:

1. **Onboarding** — `Onboarding` component, conditionally `sign-in` and `import` steps
2. **Welcome** — `WelcomeScreen` shown briefly post-onboarding
3. **Workspace** — the main shell

Provider stack (outer → inner):

```
QueryClientProvider → FeatureFlagProvider → TooltipProvider
  → WorkspaceLayoutContextProvider → TerminalPoolProvider
  → GithubContextProvider → IntegrationsProvider → WorkspaceViewProvider
  → RightSidebarProvider → ThemeProvider → ModalRenderer + content
```

---

## Workspace Layout (`src/renderer/lib/layout/workspace-layout.tsx`)

Resizable panel group, persisted to `localStorage` keyed `workspace-outer`:

- **Left sidebar**: 200px min → 30% max, default 20%, collapsible to 0
- **Main content**: title-bar slot at top, main panel below
- Container styled `bg-background text-foreground` — fully token-driven
- Backed by `react-resizable-panels`

---

## Views (7 registered in `view-registry.ts`)

| ID | Path | Notes |
|---|---|---|
| `home` | `app/home-view.tsx` | Dashboard / landing |
| `library` | `features/library/library-view.tsx` | Prompts library |
| `skills` | `features/skills/skills-view.tsx` | Skills catalog & management |
| `mcp` | `features/mcp/mcp-view.tsx` | MCP server management |
| `project` | `features/projects/view.tsx` | Project root (task list, settings, branch selector) |
| `task` | `features/tasks/view.tsx` | The IDE-like workspace: conversations + diff-view + editor + terminals + notebook |
| `settings` | `features/settings/settings-view.tsx` | App settings |

---

## Modals (18 registered in `modal-registry.ts`)

Command palette, create task, add project, github device flow, confirm action, unsaved changes, create conversation, prompt, MCP server, create skill, conflict dialog, create PR, rename task, share/import project config, github connect, linear connect, add remote, delete task.

Sizes: `xs | sm | md | lg`. Positions: `center | top`.

---

## Sidebar (`features/sidebar/`)

Virtualized list (`@tanstack/react-virtual`) of projects → tasks. Drag-and-drop reordering, search trigger, pinned-tasks group, agent status indicators per task. **The single most-touched UI surface.** Iteration quality here matters more than anywhere else.

---

## Task View Sub-Areas (`features/tasks/`)

The task view is the densest surface and the actual product:

- **`conversations/`** — agent conversation panel + tabs
- **`diff-view/`** — file changes panel, diff viewer (file + stacked), PR section
- **`editor/`** — Monaco code editor, file tree, conflict dialog
- **`terminals/`** — xterm panels with tabs
- **`notebook/`** — notebook view
- **`tabs/`** — tab bar primitives

---

## Design Token System (`src/renderer/index.css`)

**Single CSS file, 883 lines, four logical sections:**

### 1. `@theme inline` (lines 11–135) — Tailwind v4 token registration

Registers every semantic token as a Tailwind utility (`bg-background`, `text-foreground-muted`, …):

- `--font-sans` — system stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif`
- `--font-mono` — Menlo, Monaco, Consolas, Liberation Mono, Courier New
- Custom text sizes: `text-code` (13px / 1.2), `text-tiny` (11px / 1.3), `text-micro` (10px / 1.2)
- Maps semantic tokens to runtime CSS vars
- Accordion keyframes

### 2. `.emlight` theme (lines 154–455) — LIGHT MODE

- **Radix P3 scales** for: neutral, red, green (grass), blue, yellow, purple, orange, cyan, amber, violet, jade (each 1–12)
- **Custom brand scales**:
  - `--stoik-blue-*` derived from `#1362dd` via `color-mix(in srgb, …, white)`
  - `--stoik-violin-*` derived from `#320a37` via `color-mix(in srgb, …, white)`
- **~80 semantic tokens** grouped by intent:
  - Background hierarchy: `background`, `background-1/2/3`, `background-secondary/-1/-2/-3`, `background-tertiary/-1/-2/-3`, `background-quaternary/-1/-2`, `background-neutral`, `background-destructive`
  - Foreground hierarchy: `foreground`, `foreground-muted`, `foreground-passive`, `foreground-inverse`, `foreground-secondary/-muted/-passive`, `foreground-tertiary/-muted/-passive`, `foreground-neutral`, `foreground-destructive`
  - Borders: `border`, `border-1`, `border-2`, `border-destructive`, `border-primary`
  - Buttons: `primary-button-background`, `primary-button-background-hover`, `primary-button-foreground`, `primary-button-border`
  - Accent: `accent`, `accent-foreground` (currently Stoik violin)
  - Selection: `selection`, `selection-foreground`
  - Ring: `ring`
  - Radius: `radius` (0.5rem base) → `radius-lg/md/sm` derived
  - Status: `status-in-progress`, `status-in-review`, `status-done`, `status-todo`, `status-cancelled`
  - Diff: `foreground-diff-added/modified/deleted`
  - Success/Error/Warning/Info/Conflict/Merged — each with `foreground-*`, `background-*`, sometimes `background-*-hover` and `border-*`
  - **Monaco-specific** (~12 tokens): `--monaco-bg`, `--monaco-fg`, `--monaco-line-highlight`, `--monaco-inserted-text-bg`, `--monaco-removed-text-bg`, `--monaco-selection-bg`, etc.
  - **xterm-specific** (~6 tokens): `--xterm-bg`, `--xterm-fg`, `--xterm-cursor`, `--xterm-selection-bg`, etc.

### 3. `.emdark` theme (lines 457–763) — DARK MODE

Mirror of `.emlight` with dark P3 scales and inverted semantic tokens. Both modes are **fully populated** — there are no "missing in dark mode" gaps in the token layer (though component styles may not always pick up dark-mode tokens cleanly; see Dead Code below).

### 4. `@layer base` + `@layer components` (lines 766–883)

- Default border via `* { @apply border-border }`
- Full-viewport html/body/root (no `overflow-y: auto` — pure desktop fill, **no centered max-width pattern anywhere**)
- Selection styling using `color-mix` for transparency (both `::selection` and `::-moz-selection`)
- **Custom thin scrollbars** using `--border` color, 8px width — semi-styled, not OS-native. Good for visual control but loses macOS overlay-scrollbar behavior.
- One `.logo-shimmer-overlay` component (animated shimmer that **honors `prefers-reduced-motion`** — good citizen)

### Token findings (what's good, what's missing)

**Good:**
- Brand colors (`#1362dd` Stoik blue, `#320a37` Stoik violin) already baked in as scaled palettes
- Selection color is brand-blue tinted, not OS-native — feels app-native rather than web-native
- Semantic naming is consistent (background-secondary-2 rather than gray-200) — components should already be referencing intent, not raw color

**Missing (these are the gaps the redesign must fill):**
- ❌ **No elevation / shadow scale.** Modern apps need a 3–5 step shadow scale (popover, modal, dropdown, toast, hover).
- ❌ **No motion / duration / easing tokens.** Only the accordion keyframes are defined. No `--ease-out`, `--ease-spring`, `--duration-fast/normal/slow`.
- ❌ **No z-index scale.** Components likely use ad-hoc z-indexes.
- ❌ **Radii are conservative** (0.5rem / 0.375rem / 0.25rem). Plenty of room to push sharper (more "native Mac") or rounder (more "playful").
- ❌ **No spacing scale documented.** Tailwind's default spacing is in use everywhere; the redesign could either codify it or override.
- ❌ **No typography scale documented** beyond the three custom small sizes. Standard Tailwind type scale is used implicitly.

---

## Theme Provider (`src/renderer/lib/providers/theme-provider.tsx`)

- Persists user choice in the app settings DB (key: `theme`); also caches to `localStorage` as `emdash-theme`.
- Three states: `null` (follow system), `emlight`, `emdark`.
- Applies `emlight` or `emdark` class to `<html>`.
- Subscribes to `prefers-color-scheme` changes when no explicit preference is set.
- **Re-applies xterm theme to live PTY sessions** on theme change via `applyThemeToAll()`. This is correct.
- ⚠️ **Monaco editors are not explicitly re-themed** on theme change — they may keep their initial theme until reloaded. Worth verifying.

### ⚠️ Dead code: `dark:` Tailwind variants in components

`button.tsx` (and likely others) uses Tailwind `dark:` utilities:

```ts
'dark:border-input dark:bg-input/30 dark:hover:bg-input/50'
'dark:bg-destructive/20 dark:hover:bg-destructive/30'
```

Tailwind's `dark:` variant fires on `prefers-color-scheme: dark` **or** a `.dark` class on a parent. This codebase applies `.emlight`/`.emdark`, not `.dark`. So:

- In `emdark` mode, `dark:` overrides **may** fire from `prefers-color-scheme` if the OS is in dark mode, but won't fire if the user manually picked `emdark` on a light-OS machine — inconsistent visual.
- In `emlight` mode on a dark-OS machine, `dark:` overrides will fire even though the app is in light mode — wrong visual.

**Action for Phase 1 verification:** screenshot the app in `emdark` on a light-OS host and look for inconsistencies in primitives. Long-term fix: replace `dark:` variants in primitives with `.emdark`-scoped variants (or remove them and rely entirely on semantic tokens, which is cleaner).

### Unused custom-variants

Two custom-variants are declared at the top of `index.css` but never appear as classes on root:

```css
@custom-variant dark (&:is(.dark *));
@custom-variant dark-black (&:is(.dark-black *));
```

`dark` is what enables the dead `dark:` utilities described above (they compile but never match). `dark-black` looks like an aborted "OLED black" theme plan. Both safe to remove if no plans to revive.

---

## Electron Main Process Window (`src/main/app/window.ts`)

- **Default size**: 1400×900; **min size**: 700×500
- **Native chrome on Windows/Linux**
- **Frameless with hidden-inset title bar on macOS**:
  ```ts
  titleBarStyle: 'hiddenInset'
  trafficLightPosition: { x: 10, y: 10 }
  acceptFirstMouse: true
  ```
- `webviewTag: true` — supports in-app browser pane
- `title`: `PRODUCT_NAME` (from `@shared/app-identity`)
- Shows on `ready-to-show` — avoids flash-of-white
- External links routed to OS default browser via `registerExternalLinkHandlers`
- **No `vibrancy` setting** — no macOS translucent backgrounds currently. Adding this is a cheap-but-meaningful native cue.

---

## What's Already Native-Feeling

- ✅ System font stack
- ✅ macOS hidden-inset title bar with traffic lights
- ✅ Full-viewport layout (no centered max-width anywhere)
- ✅ Resizable panels (IDE-style)
- ✅ Keyboard shortcuts wired through `@tanstack/react-hotkeys` + custom command registry
- ✅ Native menu (`src/main/app/menu.ts`)
- ✅ External links open in OS browser
- ✅ Command palette pattern (`cmdk`)

---

## What's Missing or Sub-Native

- ❌ No elevation / shadow scale (cards, popovers, modals all flat or ad-hoc)
- ❌ No motion / easing tokens (each component picks its own duration)
- ❌ No vibrancy / acrylic backgrounds (macOS / Windows native materials)
- ❌ Custom scrollbars instead of OS-native overlay scrollbars (consistent look, but loses macOS hover-to-reveal)
- ❌ Dead `dark:` Tailwind variants in primitives
- ❌ No platform-aware adjustments (titlebar slot is shared; Windows window controls not addressed)
- ❌ `prefers-reduced-motion` only honored by the logo shimmer, not systematically across components
- ❌ Monaco theme may not refresh on theme toggle (needs verification)
- ❌ No documented contrast / a11y audit per token
- ⚠️ Stale `agents/architecture/renderer.md`

---

## Risks for the Rework

1. **Heavy editors are themed via JS, not CSS.** Monaco and xterm read their theme settings at runtime; changing CSS variables won't auto-propagate to open instances. The theme provider already calls `applyThemeToAll()` for xterm — **Monaco theming likely needs similar wiring** but the audit didn't trace it conclusively. Confirm in Phase 1.
2. **`emdark` is a separate class, not `.dark`.** Tailwind's `dark:` variant in components is dead-or-flaky. **Redesigned primitives must use semantic tokens directly**, not `dark:` overrides.
3. **Frameless macOS window** means we own the titlebar visual but must reserve `~70px` from the left edge for traffic lights. Any redesigned titlebar slot must preserve this affordance and adapt on Windows/Linux.
4. **xterm and Monaco have their own theme tokens** (`--xterm-*`, `--monaco-*`) — redesigning the base palette requires deliberate updates to both.
5. **18 modals + 7 views + sidebar = ~25+ distinct surfaces** to inventory in Phase 3. Screenshot capture in Phase 1 should target the highest-impact surfaces first (sidebar + task view + project view) rather than exhaustively covering every modal.
6. **The `_legacy/` folder exists** — Phase 3's migration plan should explicitly carve it out so we don't waste effort restyling code on its way to deletion.

---

## Open Questions for the User (decisions needed before Phase 2)

1. **Brand colors**: keep Stoik blue (`#1362dd`) and violin (`#320a37`), replace them, or add a third accent?
2. **Window chrome**: stay with macOS `hiddenInset`, or move toward a fully custom titlebar (more web-app feel), or a fully native one (more Mac-app feel)?
3. **Heavy editors**: is Monaco's color scheme a deliberate part of the redesign, or a fixed surface we leave alone?
4. **Light + dark parity**: are both modes first-class, or do we ship dark-first and treat light as secondary?
5. **Scrollbars**: keep the custom thin ones (consistent everywhere), or switch to OS-native overlay scrollbars on macOS for native feel?
6. **Vibrancy / translucency**: opt in to macOS vibrancy materials for sidebar/titlebar, or stay opaque?

These belong in Phase 2 — flagging early so the design brief can answer them deliberately.
