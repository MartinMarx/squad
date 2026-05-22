# UI Inventory — Before-State

_Per-surface findings from `docs/redesign/screenshots/before/`. Each finding lists what's wrong relative to `DESIGN_BRIEF.md` and `DESIGN_TOKENS.md`. Findings are graded by severity:_

- 🔴 **Blocking** — must fix; off-brand or broken
- 🟠 **Important** — clearly needs work
- 🟡 **Polish** — nice-to-have, refinement

_The order of fixes is governed by `02-migration-plan.md`, not by severity within this doc._

> Coverage notes: screenshots cover 6 views (onboarding, home, library, skills, mcp, settings) × 2 themes × 2 sizes = 24 PNGs. Deliberately deferred for now: project view + task view (need fixture project data), the welcome overlay (transient state), and the 18 modals (will be captured per-PR during Phase 3+). The screenshot script has a known minor issue where capture #2–#4 of "onboarding" actually show the post-onboarding workspace state because the `frozenSteps` query settled between snapshots; the first (light-lg) shot is the authoritative onboarding capture.

---

## Cross-cutting findings (applies to every view)

These are global and should be fixed once at the foundation layer, not per-screen.

| # | Severity | Finding | Owner phase |
|---|---|---|---|
| C1 | 🔴 | **No `--shadow-*` scale.** Every layered surface is flat — popovers, modals, cards. The Mac-app "lifted" feel can't exist without a real shadow scale. | PR 1 — Token foundation |
| C2 | 🔴 | **No `--duration-*` / `--ease-*` tokens.** Each component picks its own duration. Cannot enforce consistent motion. | PR 1 — Token foundation |
| C3 | 🔴 | **Dead Tailwind `dark:` variants in primitives** (e.g. `button.tsx` line 13: `dark:border-input dark:bg-input/30`). The codebase applies `.emlight`/`.emdark`, not `.dark`. These never fire. Misleading; remove. | PR 2 — Cleanup |
| C4 | 🟠 | **`--ring: hsl(0 0% 3.9%)`** is hardcoded in `index.css` (lines 391 & 696). Should be `--border-focus-ring` semantic token. | PR 1 / PR 2 |
| C5 | 🟠 | **Sidebar is opaque.** Per brief, native vibrancy material applies here. Requires `BrowserWindow.vibrancy` setting + `--background-sidebar` semi-transparent token. | PR 6 — Shell |
| C6 | 🟠 | **Popovers / menus / command-palette / tooltips are opaque.** Per brief, these are the second liquid-glass surface family. Need `backdrop-filter: blur(20px)` + `--background-overlay` token + `--shadow-2`. | PR 4 — Overlay primitives |
| C7 | 🟠 | **`prefers-reduced-motion` is only honored by `.logo-shimmer-overlay`.** All other animations ignore the user's reduced-motion preference. A11y miss. | PR 1 + per-component |
| C8 | 🟡 | **No z-index scale.** Components likely use ad-hoc values; need to migrate to `--z-*` tokens. | PR 1 / PR 2 |
| C9 | 🟡 | **Custom 8px scrollbars** (light + dark). Per brief, **keep** but soften thumb to 60% opacity to match the calm tone. Decision was made deliberately — recording for future reference. | PR 2 |
| C10 | 🟡 | **The `_legacy/` folder exists** in `src/renderer/`. Carve out of the rework scope entirely — don't restyle code on its way to deletion. | All PRs |

---

## Onboarding (`onboarding-light-lg.png`)

The first surface a brand-new user sees. The current state is the GitHub sign-in step of the onboarding stepper.

**Layout**: centered "Sign in" tab pill above a card that holds a centered GitHub icon, "Connect GitHub" headline, body copy, primary CTA "Sign in with GitHub" (Stoik blue), secondary CTA "Skip for now" (outline).

**Findings**:
- 🟠 **`Sign in` tab pill at top is visually disconnected** from the card below. Looks like a floating chip rather than a labeled section header. Should either dock to the card or be removed entirely (single-step views don't need a tab indicator).
- 🟠 **No visual hierarchy between primary and secondary CTAs.** Both buttons are equally wide. The `Skip for now` button should be more recessive (ghost or text-only, lower visual weight).
- 🟠 **GitHub icon is small and uncoloured** (just `--foreground` outline). For an onboarding moment, this is the brand moment of the screen — make it larger (40-48px), give it weight.
- 🟡 **"Connect GitHub" heading typography is fine but flat** — would benefit from `--text-2xl` + `--weight-semibold`, currently looks like `--text-lg` regular.
- 🟡 **The card has a 1px border but `--shadow-0`** — flat. A subtle `--shadow-2` would lift it appropriately.
- 🟡 **At `sm` size (1024×720):** content remains the same fixed pixel size — proportions work, but the card hugs the top half of the viewport awkwardly. Consider true centering on the full viewport, not pseudo-centering inside a content slot.
- 🔴 **No motion** on step transitions (verified in code: no transition wrapper). Step changes pop. Add a soft cross-fade with `--duration-normal`.

---

## Home (`home-light-lg.png` + `home-dark-lg.png`)

The default landing view post-onboarding when no projects exist. Three-action list: Open project, Create repository, Clone from GitHub.

**Layout**: empty `Titlebar` slot at top, centered Emdash logo, three actions in a vertical list (each: icon + label + description), keyboard navigation between them.

**Findings**:
- 🟠 **The titlebar slot is empty** — wastes the 32-40px of titlebar height. Either give it the "Home" label (consistent with library/settings) or remove the slot entirely on this view.
- 🟠 **Action list `gap-1` (4px) is too tight** for a "calm" tone. Items run into each other visually. Use `gap-2` (8px) or `gap-3` (12px) for breathing room.
- 🟠 **Selected action highlight is barely visible** in light mode (`bg-background-1` is `--neutral-2`, almost white). Add a subtle border or use `--accent` (Stoik blue tinted) for clearer focus.
- 🟠 **Action `max-w-md` (28rem = 448px) is narrow** for a desktop view at 1400px wide. Pushes content into a center-of-screen tower that feels web-marketing. Widen to `max-w-lg` (32rem = 512px) at minimum.
- 🟡 **Stoik blue is absent from this view.** The empty state of the app's home view has no brand colour at all. The Enter-arrow icon on the selected action could be `--stoik-blue-9` instead of muted.
- 🟡 **Emdash shimmer logo in dark mode** shows a strong vertical light gradient (white → grey). It's the only "delight" moment on the home view but it competes with the action list for attention. Consider dimming the shimmer in dark mode or restricting it to onboarding-only moments.
- 🟡 **Action icons (FolderOpen / Plus / Github) are all the same outline weight** (`Lucide` defaults). Could use slightly heavier strokes for primary action vs others.

---

## Library — Prompts tab (`library-light-lg.png` + `library-dark-lg.png`)

The default Library landing. Hosts three sub-tabs (Prompts / Skills / MCP). Currently showing the Prompts tab.

**Layout**: titlebar with "Library" label (left-aligned small text) → side-nav (Prompts | Skills | MCP) on the left, content area on the right. Content area has a heading "Prompts" + description, then a search input + "New Prompt" button row, then the prompts list.

**Findings**:
- 🟠 **Side-nav active state uses heavy `bg-background-2` fill.** Linear-style would use a 2-3px left-edge indicator in `--stoik-blue-9` + a much lighter background tint. Current heavy fill looks dated.
- 🟠 **"+ New Prompt" primary CTA is under-weighted (`h-8`).** This is THE primary action on the page; it should be `h-9` with more horizontal padding, slightly heavier weight. Currently competes with the muted search input for visual hierarchy.
- 🟠 **`Library` titlebar label is `--text-sm` muted** — barely visible. Either remove (the side-nav already identifies the view) or make it `--text-lg` with proper foreground.
- 🟠 **Prompts list entries have title + truncated description** but no metadata (last edited, scope, etc.) and no visual elevation on hover. Linear-style would add a subtle `--shadow-1` on hover and a thin border bottom for separation.
- 🟡 **Search input feels disconnected from "New Prompt" button** — different sizes and visual weights. Align heights, use the input-group pattern.
- 🟡 **Background of prompts list area is the same as the panel** — no card affordance. Consider a slightly inset background (`--background-secondary-1`) for the list region.

---

## Library — Skills tab (`skills-light-lg.png` + `skills-dark-lg.png`)

Same shell as Library/Prompts; right pane is a grid of skill cards under a "RECOMMENDED" section header.

**Layout**: same titlebar + side-nav. Right pane: heading "Skills" + description, search + "New Skill" + refresh icon row, "RECOMMENDED" section label, 2-column card grid.

**Findings**:
- 🟠 **Refresh icon button has no label/tooltip** — purely visual affordance. A11y miss + unclear to first-time users.
- 🟠 **Skill cards use `bg-background-1` + 1px border with no shadow.** In dark mode the cards barely separate from the background. Add `--shadow-1` on the card AND `--shadow-2` on hover for proper elevation language.
- 🟠 **Card density.** Each card is roughly 60px tall × 480px wide in the 2-col grid; the icon-only-left + title-only-right pattern doesn't fill the space well. Either add metadata (e.g. "Used 14 times this week" or category badge) or reduce card height.
- 🟠 **"RECOMMENDED" section label is uppercase 11px** — Linear-style, but it's `--foreground-muted` and feels like an afterthought rather than a section header. Increase weight to `--weight-semibold` and add 4-6px tracking.
- 🟡 **No grouping beyond "RECOMMENDED"** — long scrolls of cards with no visual rhythm. Consider section separators (`<Separator />` + label) when the list grows.
- 🟡 **"New Skill" CTA has same under-weight problem as "New Prompt"** — see Library/Prompts findings.

---

## Library — MCP tab (`mcp-light-lg.png` + `mcp-dark-lg.png`)

Same shell again. Cards are MCP servers with type badges ("http" / "stdio").

**Layout**: identical to Skills, plus type badges next to titles.

**Findings**:
- 🟠 **Type badges ("http" / "stdio") are tiny `--text-micro` grey pills.** Use the existing `<Badge variant="...">` primitive with a slightly more confident size (`text-xs` = 11px), and consider distinct semantic colours: `--background-info` tint for stdio (process-local), `--background-success` tint for http (remote).
- 🟠 **"Custom MCP" CTA has the same under-weight problem** as Skills/Prompts CTAs.
- All other findings inherited from Skills (same shell).

---

## Settings (`settings-light-lg.png` + `settings-dark-lg.png`)

Shows General tab with 9 setting rows + version footer.

**Layout**: titlebar "Settings" → side-nav (General | Account | Agents | Integrations | Repository | Philosophers | Interface) → content area. Content: "General" heading + description, list of setting rows. Each row: label + description on left, control (toggle / select / button) on right. Footer: "Version 1.1.23" + "You're up to date" + refresh icon.

**Findings**:
- 🟠 **Side-nav active state has the same heavy fill problem** as Library/Skills/MCP. Migrate all three (Settings sidebar, Library sidebar, and any other left-nav components) at the same time during PR 9 — they share the underlying primitive.
- 🟠 **"Settings" titlebar label is the same muted-tiny problem** as Library.
- 🟠 **Setting rows have no `gap-` between them** (just bordered separation). Add `py-3` to each row body or use `--space-3` gap for calmer rhythm. Currently feels like a config file dumped into a UI.
- 🟠 **"Custom sound" `Choose file...` button + folder icon doesn't match other controls' visual weight.** The dropdown for "Sound timing" (`Always` chevron-down) feels right; the file picker should follow the same visual language.
- 🟡 **Version footer uses `--text-tiny` muted** with a sync icon to its right. The sync icon has no tooltip. Could fold into a status pill: "1.1.23 — up to date".
- 🟡 **Toggle controls** (`Switch` primitive) — when ON they use Stoik blue. Good brand discipline. When OFF they're `--background-2` grey — consider a slightly more distinct off-state in dark mode (border becomes visible).
- 🟡 **Dark mode contrast** for the description rows reads OK but borderline at small sizes; if we shift `--foreground-passive` to `--neutral-9` (proposed in DESIGN_TOKENS.md) this improves.
- 🟡 **No save-state indication** — settings appear to save on toggle (no Save button visible). If that's the case, the row should briefly flash a success indicator (`--background-success` tint, 200ms fade). If saves can fail, this needs error states too.

---

## Sidebar (`PROJECTS` group, footer with Search / Library / Settings)

Visible in every workspace screenshot. The single most-touched UI surface in the app.

**Findings**:
- 🔴 **Opaque background** (`bg-background-tertiary`). Per brief, native vibrancy material applies here. PR 6 work.
- 🟠 **"PROJECTS" group label is `--text-tiny` uppercase muted** with adjacent filter + add icons. The icons are small (size 4 = 16px) and have no tooltips. Add tooltips + slightly increase icon size to `--text-base` (1em = 16px stays but with more touch room).
- 🟠 **Empty state of the projects list is just blank space.** This is the dominant feel for a first-launch user. Add an empty-state illustration or guidance ("Add a project to get started → drag a folder here or click `+`").
- 🟠 **Search trigger in the footer says "Search..." with `⌘K` hint** — well-formatted. But it's a button styled to look like an input, which is misleading. Either commit to button styling (no input affordance) or actually make it open-on-focus.
- 🟠 **Library / Settings footer buttons** — the active state uses a heavy fill; same problem as the in-view side-navs.
- 🟡 **No status indicators** for running agents, network state, sync state. For a tool that orchestrates 2-10 agents in parallel, the sidebar footer is the natural place for "3 agents working" type status.

---

## Title bar (across all views)

Custom hidden-inset titlebar on macOS; the renderer fills it with a `<Titlebar />` component plus a per-view `TitlebarSlot`.

**Findings**:
- 🔴 **The 70px traffic-light dead zone is invisible to the renderer.** Without an explicit `padding-left` it's easy for future components to render under the traffic lights. Codify a `--titlebar-leading-inset` token = 78px (70 + 8 breathing room) and use it everywhere.
- 🟠 **Titlebar content is currently just a left-aligned `--text-sm` label.** On Home it's empty; on Library/Settings it's "Library" / "Settings" muted. Either commit to a richer titlebar (breadcrumb + actions on the right) or commit to leaving it as a calm header band — the current half-measure feels indecisive.
- 🟠 **On Windows/Linux** (no hidden-inset), the renderer titlebar overlaps with the native window controls on the right edge. Verify there's a similar right-edge dead zone reserved for Windows.

---

## Done. Take this with `02-migration-plan.md` for the order of fixes.
