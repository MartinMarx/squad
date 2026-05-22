# UI Work Conventions

_Applies to every UI change in `src/renderer/`. Read in addition to `agents/conventions/renderer-patterns.md`._

## Always

1. **Invoke the `frontend-design` skill** before generating any new UI surface (new component, redesigned screen, new modal). Don't freehand — the skill exists to keep work distinctive and avoid generic AI-design defaults.
2. **Read `docs/redesign/DESIGN_BRIEF.md` first** if you don't already have the redesign direction in mind. The one-liner is "clean Linear/Vercel modernism + subtle Apple liquid-glass + Mac-app polish."
3. **Use semantic tokens, never hardcoded values.** Colors via `--background`, `--foreground`, `--stoik-blue-*`, etc. Shadows via `--shadow-*`. Motion via `--duration-*` + `--ease-*`. Radii via `--radius-*`. Z-index via `--z-*`. Tokens are in `src/renderer/index.css`; the full inventory is in `docs/redesign/DESIGN_TOKENS.md`.
4. **Test in both themes.** Switch via the in-app theme toggle and verify the change reads well in `emlight` AND `emdark`.
5. **Honor `prefers-reduced-motion`.** Any new animation/transition must include the reduced-motion bypass.

## Never

1. **Never hardcode hex / rgba / px shadows.** If a needed token doesn't exist, add one to `index.css` rather than inlining.
2. **Never use Tailwind `dark:` variants.** The theme is applied via `.emlight` / `.emdark` classes; `dark:` utilities don't fire reliably. Use semantic tokens that resolve correctly in both themes.
3. **Never reintroduce Inter / Roboto / generic web fonts.** Native system stack only: `-apple-system, BlinkMacSystemFont, "SF Pro Text"...` and `ui-monospace, "SF Mono"...`.
4. **Never center-max-width workspace content.** This is a desktop app — fill the window. The only exceptions are onboarding/welcome surfaces.
5. **Never use Stoik violin (`--stoik-violin-*`) adjacent to Stoik blue (`--stoik-blue-*`).** They have distinct roles (blue = primary, violin = special). If they'd be visible together, redesign.
6. **Never use `--shadow-4`** for anything non-transient. It's for drag previews and floating overlays only.
7. **Never use `--radius-2xl`** in the workspace shell. Reserved for onboarding/welcome/hero surfaces.
8. **Never ship raw shadcn defaults.** Every primitive must be re-pitched for desktop — see `docs/redesign/02-migration-plan.md` for the primitives redesign track.

## Native desktop conventions over web conventions

- macOS frameless title bar with traffic lights at `{x: 10, y: 10}` is preserved — reserve at least 70px of dead space at the top-left of any titlebar slot.
- Full-window layouts. No `max-width: 1280px` container patterns.
- Keyboard-first: every primary action has a hotkey. Hovering reveals the hotkey hint (`<kbd>`).
- External links open in the OS browser via the existing `registerExternalLinkHandlers` mechanism.

## Liquid-glass discipline

Per the brief, liquid-glass material applies ONLY to:

- The left sidebar (native vibrancy via `BrowserWindow` `vibrancy` option + `--background-sidebar` semi-transparent token)
- Popovers, dropdowns, menus, command palette, tooltips (`--background-overlay` token + `backdrop-filter: blur(...)`)

Everything else stays opaque. Adding glass to titlebar, main content, or in-content toolbars is out of scope without a brief revision.

## Visual loop

When iterating on a UI change:

1. Edit the screen / component (invoke `frontend-design` for any non-trivial change).
2. Run the screenshot capture: `pnpm run build && node --experimental-strip-types scripts/screenshot.ts --out=after`.
3. Invoke the `design-review` skill against the new screenshots + this brief (see `docs/redesign/03-visual-loop.md`).
4. Apply review-issued fixes. Repeat until convergence.

## When in doubt

Default to **restraint**. Refined minimalism is the target. If a proposed flourish doesn't earn its position against the brief, cut it.
