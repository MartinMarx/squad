# Design Tokens — Emdash Rework Proposal

_Concrete values for the rework. The existing token **architecture** (`src/renderer/index.css`) is excellent and stays. This file proposes **values** that re-tune existing tokens for the new direction plus the **new** token families (elevation, motion, z-index) that the audit found missing._

> All tokens are CSS variables on `:root` inside the theme class (`.emlight` / `.emdark`). The Tailwind v4 `@theme inline` block maps them into utilities. **Components never hardcode values; they read tokens.**

## Strategy

1. **Keep the Radix P3 base scales** (neutral, red, green, blue, yellow, purple, orange, cyan, amber, violet, jade) — they're well-balanced and already in place. Tunings here are at the **semantic** layer.
2. **Re-tune brand role discipline.** Stoik blue gets all the "primary" responsibility. Stoik violin retreats to "special" moments only.
3. **Add three missing scales** — `elevation`, `motion`, `z-index` — that the audit flagged.
4. **Trim radii** to a clean 4–16px progression. Current 0.5rem base is fine but the scale was implicit; this makes it explicit.
5. **Codify typography** with concrete size/weight/leading pairs (currently implicit via Tailwind defaults).

---

## 1. Color — semantic tokens (light & dark)

Brand sources stay the same:
- Stoik blue base: `#1362dd` → existing `--stoik-blue-*` 12-step scale
- Stoik violin base: `#320a37` → existing `--stoik-violin-*` 12-step scale
- Neutrals: Radix P3 12-step scale (`--neutral-1` to `--neutral-12`)

The table below lists each semantic token and its proposed light/dark value. Tokens marked **(NEW)** don't exist today. Tokens marked **(CHANGE)** propose a different value than today. Unmarked tokens keep current value.

### Surface — backgrounds

| Token | Light value | Dark value | Change vs. current |
|---|---|---|---|
| `--background` | `white` | `var(--neutral-1)` | — |
| `--background-1` | `var(--neutral-2)` | `var(--neutral-2)` | — |
| `--background-2` | `var(--neutral-3)` | `var(--neutral-3)` | — |
| `--background-3` | `var(--neutral-4)` | `var(--neutral-4)` | — |
| `--background-sidebar` _(NEW)_ | `color-mix(in srgb, var(--neutral-2) 88%, transparent)` | `color-mix(in srgb, var(--neutral-2) 80%, transparent)` | NEW — for the vibrancy sidebar. Component reads this; native vibrancy provides the blur underneath. |
| `--background-overlay` _(NEW)_ | `color-mix(in srgb, white 78%, transparent)` | `color-mix(in srgb, var(--neutral-2) 72%, transparent)` | NEW — for popovers/menus/command palette. Backdrop-filter blur underneath. |
| `--background-titlebar` _(NEW)_ | `var(--background)` | `var(--background)` | NEW — opaque per brief (titlebar is NOT in scope for liquid glass). |

### Surface — secondaries (hover/raised states)

Existing `--background-secondary-1/2/3`, `--background-tertiary-*`, `--background-quaternary-*` keep their architecture but are re-anchored:

| Token | Light value | Dark value |
|---|---|---|
| `--background-secondary` | `var(--neutral-2)` | `var(--neutral-2)` |
| `--background-secondary-1` | `var(--neutral-3)` | `var(--neutral-3)` |
| `--background-secondary-2` | `var(--neutral-4)` | `var(--neutral-4)` |
| `--background-tertiary` | `var(--neutral-3)` | `var(--background)` _(was `--background-1` in dark; new value emphasizes flatness of dark tertiary surfaces)_ |
| `--background-tertiary-1` | `var(--neutral-4)` | `var(--neutral-2)` |
| `--background-tertiary-2` | `var(--neutral-5)` | `var(--neutral-3)` |

### Foreground (text + icons)

| Token | Light value | Dark value |
|---|---|---|
| `--foreground` | `var(--neutral-12)` | `var(--neutral-12)` |
| `--foreground-muted` | `var(--neutral-11)` | `var(--neutral-11)` |
| `--foreground-passive` | `var(--neutral-9)` _(CHANGE: was `--neutral-8`, slightly more contrast)_ | `var(--neutral-9)` |
| `--foreground-inverse` | `white` | `var(--neutral-1)` |
| `--foreground-success` | `var(--green-11)` _(CHANGE: was `--green-9`, better contrast at small sizes)_ | `var(--green-11)` |
| `--foreground-warning` | `var(--amber-11)` | `var(--amber-11)` |
| `--foreground-error` | `var(--red-11)` _(CHANGE: was `--red-9`)_ | `var(--red-11)` |
| `--foreground-info` | `var(--stoik-blue-11)` _(CHANGE: was `--stoik-blue-9`)_ | `var(--stoik-blue-11)` |

Rationale for the `-9 → -11` shifts: Radix's `-9` step is the saturated brand step for SOLID backgrounds. For TEXT against neutral backgrounds, `-11` is the right contrast step. The current usage is slightly off-spec.

### Borders

| Token | Light value | Dark value |
|---|---|---|
| `--border` | `var(--neutral-5)` | `var(--neutral-6)` |
| `--border-1` | `var(--neutral-7)` _(CHANGE: was `--neutral-8`)_ | `var(--neutral-7)` |
| `--border-2` | `var(--neutral-8)` _(CHANGE: was `--neutral-9`)_ | `var(--neutral-8)` |
| `--border-strong` _(NEW)_ | `var(--neutral-9)` | `var(--neutral-10)` |
| `--border-primary` | `var(--stoik-blue-9)` | `var(--stoik-blue-9)` |
| `--border-destructive` | `var(--red-8)` | `var(--red-8)` |
| `--border-focus-ring` _(NEW)_ | `var(--stoik-blue-9)` | `var(--stoik-blue-9)` |

The current `--ring: hsl(0 0% 3.9%)` is a stray hardcoded value (audit found it). Replace with `--border-focus-ring`.

### Brand

| Token | Light value | Dark value | Role |
|---|---|---|---|
| `--accent` | `var(--stoik-blue-3)` _(CHANGE: was violin-2)_ | `var(--stoik-blue-3)` _(was violin-3)_ | Now blue-tinted, used for hover surfaces in primary contexts |
| `--accent-foreground` | `var(--stoik-blue-11)` _(was violin-9)_ | `var(--stoik-blue-11)` _(was violin-12)_ | Text on accent surface |
| `--accent-special` _(NEW)_ | `var(--stoik-violin-3)` | `var(--stoik-violin-3)` | Reserved violin accent — special moments only |
| `--accent-special-foreground` _(NEW)_ | `var(--stoik-violin-11)` | `var(--stoik-violin-11)` | |
| `--primary-button-background` | `var(--stoik-blue-9)` | `var(--stoik-blue-9)` | — |
| `--primary-button-background-hover` | `var(--stoik-blue-10)` | `var(--stoik-blue-8)` | — |
| `--primary-button-foreground` | `white` | `white` | — |
| `--selection` | `var(--stoik-blue-5)` | `var(--stoik-blue-9)` | — |
| `--foreground-merged` | `var(--stoik-violin-9)` | `var(--stoik-violin-11)` | Stays violin — this IS a "special" moment per the brief |

### Special-purpose tokens (Monaco, xterm) — keep current values

The audit confirmed `--monaco-*` and `--xterm-*` are well-defined. Out of scope for this brief.

---

## 2. Elevation _(NEW)_

Currently missing. A 5-step scale, distinct values for light/dark.

```css
.emlight {
  --shadow-0: none;
  --shadow-1: 0 1px 2px color-mix(in srgb, black 6%, transparent),
              0 1px 1px color-mix(in srgb, black 4%, transparent);
  --shadow-2: 0 4px 8px color-mix(in srgb, black 6%, transparent),
              0 2px 4px color-mix(in srgb, black 4%, transparent);
  --shadow-3: 0 12px 24px color-mix(in srgb, black 10%, transparent),
              0 4px 8px color-mix(in srgb, black 6%, transparent);
  --shadow-4: 0 24px 48px color-mix(in srgb, black 16%, transparent),
              0 8px 16px color-mix(in srgb, black 10%, transparent);
}

.emdark {
  /* Dark mode: shadow alone doesn't communicate elevation on dark backgrounds.
     Pair with a 0.5px hairline highlight (top edge) for the "lifted" feel. */
  --shadow-0: none;
  --shadow-1: 0 1px 2px color-mix(in srgb, black 40%, transparent),
              inset 0 0.5px 0 color-mix(in srgb, white 6%, transparent);
  --shadow-2: 0 4px 12px color-mix(in srgb, black 50%, transparent),
              inset 0 0.5px 0 color-mix(in srgb, white 8%, transparent);
  --shadow-3: 0 12px 32px color-mix(in srgb, black 60%, transparent),
              inset 0 0.5px 0 color-mix(in srgb, white 10%, transparent);
  --shadow-4: 0 24px 56px color-mix(in srgb, black 70%, transparent),
              inset 0 0.5px 0 color-mix(in srgb, white 12%, transparent);
}
```

| Token | Usage |
|---|---|
| `--shadow-0` | Default state, flat surfaces |
| `--shadow-1` | Cards on hover, raised list items |
| `--shadow-2` | Dropdowns, popovers, command palette overlays |
| `--shadow-3` | Modals, dialogs |
| `--shadow-4` | Drag previews, floating overlays (tooltips on layered content) |

Rule: never use a token > `--shadow-3` for non-transient UI.

---

## 3. Motion _(NEW)_

The audit found only the accordion keyframes. We need durations + easings as tokens.

### Duration tokens

```css
:root {
  --duration-instant: 0ms;     /* state changes that should feel synchronous (focus rings) */
  --duration-fast: 120ms;      /* hover, focus, single-element transitions */
  --duration-normal: 200ms;    /* panel open/close, layout shift */
  --duration-slow: 320ms;      /* modal/sheet enter, complex orchestration */
  --duration-glacial: 500ms;   /* ambient effects (logo shimmer), onboarding flourish */
}
```

### Easing tokens (Apple-standard curves)

```css
:root {
  /* Apple's preferred ease-out, used for "arriving" motion */
  --ease-out: cubic-bezier(0.165, 0.84, 0.44, 1);

  /* Apple's ease-in-out, used for transitions where both ends matter */
  --ease-in-out: cubic-bezier(0.86, 0, 0.07, 1);

  /* Light spring overshoot for delightful arrivals (popover open, etc.) */
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

  /* Linear — for progress indicators only. Banned for state transitions. */
  --ease-linear: linear;
}
```

### Rules

- **Default for state transitions: `var(--duration-fast) var(--ease-out)`**
- **All animations honor `prefers-reduced-motion`.** Add to every animated element:
  ```css
  @media (prefers-reduced-motion: reduce) {
    & { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
  }
  ```
  Currently only `.logo-shimmer-overlay` does this. Codify it project-wide.
- **Spring easing is reserved for arrival moments** (modal open, popover open, drag-end). Not for hover. Not for focus.

---

## 4. Z-index _(NEW)_

Currently ad-hoc. Codify a scale, 100-spaced so integrations can slip in between layers.

```css
:root {
  --z-base: 0;
  --z-sidebar: 10;
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-fixed: 300;
  --z-popover: 400;
  --z-modal: 500;
  --z-toast: 600;
  --z-tooltip: 700;
}
```

Rule: nothing in this codebase uses raw `z-index: 999` after the migration. Use a token.

---

## 5. Radius

Replace the implicit current scale (0.5rem base + sm/md derived) with a clean explicit scale.

```css
:root {
  --radius-none: 0;
  --radius-xs: 4px;    /* tiny indicators, status dots */
  --radius-sm: 6px;    /* small buttons, inputs, badges */
  --radius-md: 8px;    /* default — buttons, small cards, menu items */
  --radius-lg: 10px;   /* modals, popovers, panels */
  --radius-xl: 12px;   /* large cards, sheet headers */
  --radius-2xl: 16px;  /* hero/onboarding surfaces only */
  --radius-full: 9999px; /* pills, avatars */
}
```

Rule: nothing in the workspace shell uses `--radius-2xl`. It's reserved for the welcome/onboarding/empty-state moments.

---

## 6. Spacing

The Tailwind 4px default is fine. Codify it as tokens for `style={{}}` and CSS-in-JS situations:

```css
:root {
  --space-0: 0;
  --space-px: 1px;        /* hairline borders */
  --space-0-5: 2px;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;
}
```

Rule: anywhere a hand-coded `8px` / `16px` / etc. appears in inline styles, swap for a token. Tailwind utilities (`p-2`, `gap-4`, …) already align to this scale.

---

## 7. Typography

System stack confirmed. Re-codify the scale.

### Font families

```css
:root {
  --font-display:
    -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI Variable",
    "Segoe UI", system-ui, sans-serif;

  --font-text:
    -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", system-ui, sans-serif;

  --font-mono:
    ui-monospace, "SF Mono", Menlo, Monaco, "Cascadia Mono", Consolas,
    "Liberation Mono", "Courier New", monospace;
}
```

Per Apple's HIG, SF Pro **Display** is used at ≥20px, **Text** at <20px. Browsers handle the swap automatically when the family is queried via `-apple-system`.

### Size scale

| Token | Size | Line-height | Use |
|---|---|---|---|
| `--text-micro` | 10px | 1.2 (12px) | Keyboard hint chips, badge text |
| `--text-tiny` | 11px | 1.3 (15px) | Caption, secondary labels |
| `--text-xs` | 11px | 1.45 (16px) | Sidebar items, dense lists |
| `--text-sm` | 12px | 1.33 (16px) | Secondary body, table cells |
| `--text-base` | 13px | 1.54 (20px) | **Default body. Primary lists.** |
| `--text-md` | 14px | 1.57 (22px) | Emphasized body, settings labels |
| `--text-lg` | 16px | 1.5 (24px) | Section labels, modal titles |
| `--text-xl` | 19px | 1.47 (28px) | View titles |
| `--text-2xl` | 24px | 1.33 (32px) | Major headings (settings page top, etc.) |
| `--text-display` | 32px | 1.25 (40px) | Onboarding/welcome only |
| `--text-code` | 13px | 1.4 (18px) | Code blocks (mono) — slightly tighter LH |

Tabular variants apply `font-variant-numeric: tabular-nums lining-nums` to numeric columns.

### Weights

```css
:root {
  --weight-regular: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --weight-bold: 700;
}
```

Rule: never use `font-weight: 800/900`. SF Pro at heavy weights doesn't read well at our sizes.

---

## 8. What gets removed / cleaned up

Per the audit:

1. **Drop the `@custom-variant dark` and `@custom-variant dark-black` declarations** at the top of `index.css`. They are unused and they make the Tailwind `dark:` utilities look usable when they aren't.
2. **Replace all `dark:` utilities in primitives** with semantic-token references that work in both themes through the `.emlight` / `.emdark` cascade. Concrete list in Phase 3's migration plan.
3. **Replace `--ring: hsl(0 0% 3.9%)`** (hardcoded) with `--border-focus-ring`.
4. **Decide on scrollbars**: keep the current custom 8px-wide thin scrollbars (consistent look across platforms) or switch to OS-native overlay scrollbars on macOS. Recommendation in this rework: **keep custom**, but slightly soften (thumb opacity 60% instead of 100%) to match the calm tone. (This is a brief recommendation; final call in Phase 3.)

---

## 9. Migration order (referenced from `02-migration-plan.md`)

Phase 3 will produce the detailed migration plan. As a preview, the order is:

1. **Token migration** — replace hardcoded values (hex / px counts / ad-hoc shadows) with tokens. No visual change in this PR.
2. **Add new token scales** (elevation, motion, z-index) to `index.css` — also no visual change.
3. **Primitives redesign** — Button, Input, Card, Dialog, Popover, Tooltip, Menu, Tab, Toast — each re-pitched against the new direction. Each PR invokes `frontend-design`.
4. **Screen redesigns** — sidebar first (most-touched), then home, task view, project view, settings, library/skills/mcp, onboarding. Each PR invokes `frontend-design` + `design-review`.
