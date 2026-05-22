# Visual Loop

_The iteration cycle for any UI work in `src/renderer/`. Use this loop for every PR in `02-migration-plan.md` from PR 3 onward (primitives + screens)._

## The loop

```
   ┌────────────────────────────────────────┐
   │  1. Edit the surface                   │
   │     (frontend-design skill)            │
   └──────────────┬─────────────────────────┘
                  │
                  ▼
   ┌────────────────────────────────────────┐
   │  2. Capture the "after" screenshot      │
   │     (scripts/screenshot.ts --out=after) │
   └──────────────┬─────────────────────────┘
                  │
                  ▼
   ┌────────────────────────────────────────┐
   │  3. Review the screenshot              │
   │     (/design-review latest)            │
   └──────────────┬─────────────────────────┘
                  │
                  ▼
        ┌─────────┴──────────┐
        │ Any 🔴 or 🟠 ?     │
        └─────────┬──────────┘
            ┌─────┴─────┐
           Yes          No
            │             │
            ▼             ▼
        Goto 1     Open the PR
```

## Commands, in order

### 1. Edit the surface

When you start working on a UI surface (component or screen), invoke the design skill **before** writing any code. It exists specifically to push past generic AI defaults.

```
[invoke frontend-design skill]
```

Then implement the change. Constraints — repeat from `agents/conventions/ui-work.md`:

- Use semantic tokens; no hardcoded hex / rgba / px shadow / px duration.
- Use `--shadow-*` / `--duration-*` / `--ease-*` / `--z-*` for elevation, motion, layering.
- Touch only the surface listed in your migration-plan PR.
- Test both `emlight` and `emdark`.

### 2. Capture the after-shots

```bash
pnpm run build
node --experimental-strip-types scripts/screenshot.ts --out=after
```

Output lands in `docs/redesign/screenshots/after/`. The script captures all six top-level views in both themes × both sizes (24 PNGs total). If the PR touches a surface that isn't in the default capture set (modal, project view, task view, etc.), extend the script's `CAPTURES` array in your branch — see `scripts/screenshot.ts`.

> **Faster inner loop alternative:** while iterating, `/chrome` against `http://localhost:3000` gives instant feedback for renderer-only styling. Use it for tight fix-fix-fix cycles. Fall back to the Playwright script for the committed before/after pair that ends up in the PR.

### 3. Review the after-shots

```
/design-review latest
```

The `design-review` skill (`.claude/skills/design-review/SKILL.md`) walks the eight-axis checklist (tokens, hierarchy, typography, dark-mode parity, native feel, a11y, motion, liquid-glass discipline) and emits a structured report with severity-graded findings.

If you want to review a single surface only:

```
/design-review settings
/design-review home
/design-review sidebar
```

If you want to review a specific path:

```
/design-review docs/redesign/screenshots/after/settings-dark-lg.png
```

### 4. Apply fixes, loop

The report ends with a verdict:

- `READY TO MERGE` — no blockers, open the PR. Include the verdict in the PR description.
- `IMPORTANT ISSUES` — address every 🟠 finding, re-capture, re-review.
- `BLOCKING ISSUES` — address every 🔴 finding, re-capture, re-review.

Repeat until the verdict is `READY TO MERGE`. **The verdict is not optional**, even for "trivial" surface fixes — if you're confident enough to ship, the skill should agree.

## Convergence tips

If the loop isn't converging:

1. **Re-read the brief.** Most stuck loops are an attempt to compromise on the locked direction. The brief says "no hedging" — same applies in code.
2. **Check the inventory.** `01-ui-inventory.md` lists the original findings for the surface. If your changes haven't addressed the 🔴 items, that's the source of the loop.
3. **Cite the token.** Every fix should reference a `--*` token. If you can't name the token, the fix probably isn't using the system right.
4. **Ask for a smaller PR.** If a single PR is producing >5 🔴 findings, the scope is too large. Split it per the migration plan.

## What "convergence" looks like

A converged surface has:

- Zero 🔴 blocking findings.
- 🟠 findings tracked (either fixed in PR or filed as follow-ups in `02-migration-plan.md`).
- A clean before/after pair committed alongside the code change.
- Both `emlight` and `emdark` captured and reviewed.

## Anti-loops (do not do these)

- ❌ "I'll fix the design-review issues in a follow-up PR." That's how rework debt accumulates. The check exists so you face the cost now.
- ❌ Skipping `/design-review` because "it's just a small change." Even small changes can introduce token-violation regressions; the skill catches them in 30 seconds.
- ❌ Hand-editing the before/after screenshots. They are reproducible artifacts. If your PR breaks the script's ability to capture, fix the script.
- ❌ Letting the loop go more than 3 rounds without splitting the PR. After 3 rounds of unaddressed 🔴 findings, the diagnosis is "scope too large," not "needs more iteration."

## Reference

- `frontend-design` — Anthropic skill, drives the editing step.
- `/design-review` — project-local skill at `.claude/skills/design-review/SKILL.md`.
- `scripts/screenshot.ts` — Playwright-Electron capture script.
- `docs/redesign/DESIGN_BRIEF.md` — locked aesthetic direction.
- `docs/redesign/DESIGN_TOKENS.md` — concrete token values.
- `agents/conventions/ui-work.md` — UI-work rules for every agent that touches the renderer.
