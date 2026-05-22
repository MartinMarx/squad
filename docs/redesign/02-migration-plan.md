# Migration Plan — Sequenced PRs

_Each entry is a small, reviewable PR. Each one ends with a screenshot of the affected surface(s) for the PR description. Each PR after PR 2 invokes the `frontend-design` skill for new UI work and the `design-review` skill before merge._

## Sequencing rules

1. **Foundation first.** PR 1 (tokens) and PR 2 (cleanup) precede all visual work.
2. **Primitives before screens.** Every screen depends on primitives, so primitives ship first.
3. **One surface family per PR.** Don't bundle "Button + Sidebar" — they're independent reviews.
4. **No silent visual change.** A PR titled "token migration" must produce zero visual diff in screenshots; if it does, that's a regression to investigate.
5. **Skip out-of-scope.** `src/renderer/_legacy/` is carved out — don't touch.

## PR table

| # | Title | Scope | Visual change | Est. diff |
|---|---|---|---|---|
| 1 | Add design-token foundation | Add `--shadow-*`, `--duration-*`, `--ease-*`, `--z-*`, `--background-sidebar`, `--background-overlay`, `--border-focus-ring`, `--accent-special`, `--titlebar-leading-inset` to `index.css`. Refine semantic value choices per DESIGN_TOKENS.md. | None | ~150 lines in index.css |
| 2 | Clean up dead variants + token migration | Remove `@custom-variant dark` + `@custom-variant dark-black`. Strip `dark:` utilities from `lib/ui/*`. Replace `--ring` hardcoded → `--border-focus-ring`. Migrate hardcoded shadows/durations to tokens. | None (snapshot-identical) | ~30 files touched, mostly token swaps |
| 3 | Primitive — Button | Re-pitch all variants (primary, secondary, outline, ghost, destructive, link). Add shadow on hover. Use `--duration-fast --ease-out`. Reduce sizes to xs / sm / md / lg + icon variants. Invoke `frontend-design`. | Button visual updated | ~200 lines |
| 4 | Primitive — Input / Textarea / Field / Label / Search | Unified input visual language. Focus state via `--border-focus-ring`. Height 32px default. Group variant for input + button combos. | Input visuals updated | ~250 lines |
| 5 | Overlay primitives (Popover / Dropdown / Menu / Tooltip / Context Menu / Command Palette) + sidebar vibrancy | THIS IS where liquid-glass arrives. Add `backdrop-filter` + `--background-overlay` + `--shadow-2` to all overlays. Add native vibrancy to `BrowserWindow.vibrancy` in `window.ts` for the sidebar. Add `--background-sidebar` to the sidebar container. | Sidebar gets glass; popovers get glass + shadow | ~400 lines + 1 main-process change |
| 6 | Primitive — Dialog / Alert Dialog / Modal layout | Re-pitch modal: `--shadow-3`, `--background` opaque (modals are NOT vibrancy per brief), generous header/footer padding. Enter animation: `--duration-slow --ease-spring`. Honor `prefers-reduced-motion`. | All modals visually refined | ~200 lines |
| 7 | Primitive — Tab / Toggle / Toggle Group / Tab Bar / Switch | Linear-style tab indicator: 2px bottom-border in `--stoik-blue-9` + light bg tint, not the current heavy fill. Same treatment for the in-view side-nav (used by Library + Settings). | Tabs visually refined; side-navs lighten | ~300 lines |
| 8 | Other primitives (Badge / Separator / Kbd / Progress / Spinner / Empty-state / Action-list-item) | Catch-all for remaining low-level primitives. Each one gets a brief frontend-design review even if it's a small change. | Polish | ~250 lines |
| 9 | Workspace shell — titlebar + sidebar shell | Refine titlebar component: enforce `--titlebar-leading-inset` (78px) on macOS. On Windows/Linux: equivalent right-edge inset for native controls. Decide one direction for the per-view titlebar slot (richer breadcrumb OR removed entirely) and ship it. Add status indicator slot in the sidebar footer. | Shell visuals refined | ~300 lines |
| 10 | Screen — Home view | Empty titlebar slot decision applied here. Action list spacing: `gap-2` minimum. Selected highlight uses `--accent` (blue-tinted). Widen `max-w-md` → `max-w-lg`. Decide on the dark-mode shimmer logo (dim or scope to onboarding only). Bring brand color in. | Home view refined | ~150 lines |
| 11 | Screen — Library (incl. Skills + MCP tabs) | Lighter active-tab indicator (per PR 7). Heavier primary CTAs (h-9 + brand weight). Card shadows + hover state. Section header weight bump. Tooltips on icon-only buttons. Distinct badge colors for stdio vs http on MCP. | Library shell refined; affects all 3 tabs | ~400 lines |
| 12 | Screen — Settings | Same active-state lightening on the left nav (likely shared primitive with Library; verify during PR 7). Row gap rhythm (`py-3` per row). Choose-file button matches dropdown visual weight. Version footer simplification. Save-state indication on toggles. | Settings refined | ~250 lines |
| 13 | Screen — Onboarding | Sign-in step: visual hierarchy between Primary CTA and Skip (skip becomes ghost). GitHub icon larger (40-48px). "Connect GitHub" headline upgraded to `--text-2xl semibold`. Card gains `--shadow-2`. Add cross-fade between steps. | Onboarding refined | ~200 lines |
| 14 | Screen — Welcome + post-onboarding overlay | The transient welcome screen between onboarding completion and workspace landing. Brief moment but it's the first impression of the rebrand. Single deliberate flourish allowed here (logo + tagline + Enter prompt). | Welcome refined | ~150 lines |
| 15 | Cross-screen consistency pass | Final sweep: status indicators across the app, toast / sonner styling, badges, empty states, error states. Verify every Stoik-blue use IS primary action and every Stoik-violin use IS a special moment. | Polish + consistency | ~200 lines |

**Total estimated diff:** ~3,200 lines across ~80-120 files.

**Total estimated PR cycle time:** ~6-8 weeks if shipped 2 PRs/week. PRs 1-8 can run in parallel after PR 2 lands (foundation in place); PRs 9-15 are roughly serial (each depends on the screen state).

---

## Per-PR template

Each PR description should follow this template:

```markdown
## What
[One-line: what visual surface(s) change]

## Why
- Brief link: `docs/redesign/DESIGN_BRIEF.md` § <section>
- Tokens link: `docs/redesign/DESIGN_TOKENS.md` § <section>
- Inventory finding: `docs/redesign/01-ui-inventory.md` § <Cn or screen name>

## How
[Concrete change summary in 3-5 bullets]

## Before / After
| Surface | Before | After |
|---|---|---|
| <name>-light-lg | ![](before.png) | ![](after.png) |
| <name>-dark-lg | ![](before.png) | ![](after.png) |

## Design review
- [ ] `frontend-design` skill invoked during implementation
- [ ] `design-review` skill run against the new screenshots
- [ ] Verified `emlight` AND `emdark`
- [ ] Verified `lg` (1400×900) AND `sm` (1024×720)
- [ ] `prefers-reduced-motion` honored
- [ ] No hardcoded hex / rgba / px shadows introduced
- [ ] No new `dark:` Tailwind utilities introduced

## Risks
[Anything that could regress: shared primitives that other screens depend on, Monaco/xterm theme interplay, modal stacking, etc.]
```

---

## Carve-outs (not in this plan)

- **`src/renderer/_legacy/`** — quarantined, untouched.
- **Monaco editor color theme** — `--monaco-*` tokens stay as they are unless explicitly tackled in a separate effort.
- **xterm color theme** — `--xterm-*` tokens stay as they are; the `applyThemeToAll()` mechanism already re-applies on theme change.
- **Marketing site / docs site** in `docs/` — separate codebase, separate visual identity.
- **Project view + Task view** — need fixture data to capture before/afters. Add to the plan once we have a way to provision a real project via the screenshot script. Lower priority than the primitives + shell which underpin them.

---

## When something falls off the plan

If, during implementation, a PR uncovers work that's bigger than expected (e.g., PR 5's overlay vibrancy turns out to be 6 separate component refactors), **split it**. Better to merge ten smaller PRs than one mega-PR that's hard to review. Update this file when sequencing changes.

If a PR is blocked on something not in this plan (e.g., a renderer-side bug, a fixture-data gap), open a separate issue and continue with the next un-blocked PR.
