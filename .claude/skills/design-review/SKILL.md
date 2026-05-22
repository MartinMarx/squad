---
name: design-review
description: Reviews UI screenshots of the Emdash app against the locked redesign direction (clean Linear/Vercel modernism + subtle Apple liquid-glass + Mac-app polish) and outputs severity-graded findings with token-referenced fixes. Use when implementing UI changes in `src/renderer/`, after running `scripts/screenshot.ts --out=after` to capture an "after" snapshot, or before merging any UI PR. Takes a screen name (e.g. "settings"), a screenshot path, or "latest" to review the most recent after-shots.
---

# Design Review — Emdash

Critique a UI surface against the redesign brief. The model is the reviewer; this skill is a checklist + output format that keeps the review consistent and actionable.

## Pre-flight (must happen before any review)

If they're not already in context, read these three documents first:

1. `docs/redesign/DESIGN_BRIEF.md` — the locked aesthetic direction, anti-patterns, and emotional anchor.
2. `docs/redesign/DESIGN_TOKENS.md` — concrete proposed values for every token family. Every fix should cite a token from here.
3. `agents/conventions/ui-work.md` — the per-PR rules. The review enforces these.

## Inputs

User invokes via `/design-review <arg>`, where `<arg>` is one of:

- `latest` — review every screen pair (light/dark, lg/sm) in `docs/redesign/screenshots/after/`.
- `<screen>` — e.g. `settings`, `home`, `library`, `sidebar`. Reviews all 4 variants (light/dark × lg/sm) for that screen.
- `<path>` — an explicit screenshot path (relative or absolute).

If no arg is given, default to `latest`.

## Workflow

1. **Resolve which screenshot(s) to review** from the argument.
2. **For each screenshot, view it** (use the Read tool on the PNG path).
3. **Compare against the matching `before/` screenshot** if one exists. If it doesn't, note the absence — the PR should typically have a before/after pair.
4. **Walk every axis in the checklist below.** Do not skip axes silently. If an axis is N/A for the surface, say so explicitly.
5. **Emit the report** in the Output Format below. Be specific (file paths, token names, pixel values), not abstract.
6. **End with a verdict**: `READY TO MERGE` / `BLOCKING ISSUES` / `IMPORTANT ISSUES`. Be unsentimental.

## Review axes (the checklist)

Walk all eight. Each has explicit pass/fail signals.

### 1. Token adherence
- ❓ Any hardcoded hex / rgb / rgba / px shadow / px duration / px easing in the changed source files? `grep` if needed.
- ❓ Every color reference goes through a `--*` semantic token?
- ❓ **Brand discipline**: Stoik blue used only for primary actions, focus, info, selection? Stoik violin used only for special states (merged-PR, accent highlights, easter eggs)? Are blue and violin ever adjacent? They must not be.

### 2. Visual hierarchy + spacing rhythm
- ❓ Is the primary CTA visually heavier than secondaries?
- ❓ Are sibling elements on a consistent vertical rhythm (multiples of `--space-1` (4px))?
- ❓ Section labels vs body vs caption — is the contrast in weight/size unambiguous?

### 3. Typography
- ❓ Font-family on `var(--font-display)` / `var(--font-text)` / `var(--font-mono)`?
- ❓ Sizes pulled from the `--text-*` scale, no `font-size: 13.5px` etc.?
- ❓ Line-heights match the token (e.g. `text-base` is 13/20)?
- ❓ Weight contrast: `--weight-regular` for body vs `--weight-semibold` for emphasis — no use of 800/900?

### 4. Dark-mode parity
- ❓ Both `emlight` and `emdark` screenshots provided?
- ❓ The dark version reads as a first-class design, not a flipped light one?
- ❓ No place where the design works in one theme and falls apart in the other?

### 5. Native desktop feel
- ❓ Full-window layout (no `max-width` container webby pattern in workspace views)?
- ❓ macOS frameless traffic-light area respected (no content under top-left 78px)?
- ❓ System font stack in use (no Inter / Geist / Roboto creeping in)?
- ❓ Keyboard shortcuts surface via `<kbd>` hints where appropriate?

### 6. Accessibility
- ❓ Contrast: foreground vs background ≥ 4.5:1 for body, ≥ 3:1 for large text? (Use eye estimation; flag suspects.)
- ❓ Focus ring visible on the focused element using `--border-focus-ring`?
- ❓ Icon-only buttons have `aria-label` and a tooltip?

### 7. Motion
- ❓ Durations pulled from `--duration-*` tokens?
- ❓ Easings pulled from `--ease-*` tokens?
- ❓ `prefers-reduced-motion` short-circuit present on any new animation?

### 8. Liquid-glass discipline
- ❓ Vibrancy/backdrop-blur on sidebar + overlays (popover, menu, dropdown, command palette, tooltip) ONLY?
- ❓ Main content / titlebar / in-content toolbars all opaque?
- ❓ Glass surfaces use `--background-sidebar` or `--background-overlay` tokens, not inline `backdrop-filter` values?

## Output format

```markdown
# Design Review — <surface name>

Reviewed: <list of screenshot paths>
Brief reference: docs/redesign/DESIGN_BRIEF.md (commit: <sha if known>)
Tokens reference: docs/redesign/DESIGN_TOKENS.md

## Findings

### 🔴 Blocking

1. **<short title>** — <where, e.g. settings-light-lg.png, top-right CTA>
   - What: <one-line description of the problem>
   - Fix: <concrete fix referencing a token, e.g. "Use `--shadow-2` and `--background-overlay`">
   - Brief reference: <section, e.g. DESIGN_BRIEF.md § "Liquid-glass dosage">

### 🟠 Important

(same structure)

### 🟡 Polish

(same structure)

## Verdict

`READY TO MERGE` — no blockers, important issues triaged with owners
`IMPORTANT ISSUES` — must address the 🟠 items before merge
`BLOCKING ISSUES` — must address the 🔴 items before merge

## Coverage gaps

- Surfaces not captured (e.g. modals, hover states, focus states): <list>
- Themes / sizes missing from the pair: <list>
```

## Calibration

- **🔴 Blocking** = breaks the brief: off-brand color, hardcoded value, Stoik blue and violin adjacent, web-marketing pattern in workspace, dark mode falls apart.
- **🟠 Important** = clearly wrong but ships without breaking: under-weighted CTA, missing focus ring, motion duration off-spec, missing tooltip.
- **🟡 Polish** = nice-to-have: a 2px-off margin, a slightly stale gradient choice, opportunities for refinement.

When in doubt, prefer the **higher** severity. The reviewer is the gatekeeper.

## What NOT to do

- Don't write a paragraph when a token-referencing one-liner suffices.
- Don't review without reading the brief + tokens first.
- Don't accept "I'll fix it later" — surface every finding now, let the implementer triage.
- Don't apologise for harsh findings. The review's job is honesty.
