# Design Brief — Emdash UI/UX Rework

_The first document any contributor reads before touching UI. The rest of the rework — tokens, primitives, screens — derives from this._

## One-sentence direction

**Clean modernism in the Linear / Vercel / Arc vein, with subtle Apple liquid-glass cues on layered surfaces, executed with the polish of the best native Mac apps.**

No hedging. If a proposed change isn't aligned with that sentence, it's wrong.

## Product

**Emdash.** A desktop app that lets a software engineer run multiple AI coding agents in parallel — managing their conversations, diffs, terminals, and git state across projects. Owned by Stoik.

## Audience

Software engineers running 2–10 coding agents at once. Power users. They care about:

- **Speed.** Keyboard-first interactions. The tool should never be the bottleneck.
- **Control.** Every running agent visible. Every state legible at a glance.
- **Craft.** They notice when shadows are wrong, when motion feels off, when type is set badly. The target user has used Things 3 and felt the difference.

They are not afraid of density. They will not be charmed by emoji decorations or marketing flourishes inside the app.

## Tone

- **Refined minimalism, not poverty minimalism.** Restraint, not absence. Negative space is composed, not leftover.
- **Mac-native polish.** The app should feel like it belongs alongside Things, Fantastical, NetNewsWire — not alongside Slack/Notion/web-wrappers.
- **Disciplined color.** Monochrome base + one brand primary doing the work. Accent reserved for special moments.
- **Calm density.** Comfortable to use for hours. Not crowded, not airy.

## What the user should feel

After a week: **"this person cares."**

The single emotional anchor is **crafted Mac-app polish**. Every micro-interaction should ladder up to that.

- Capable but unhurried.
- Quiet competence.
- The opposite of "AI demo flashy."

## Reference apps

Read these like a band lists influences — we are not copying, we are stealing the right things.

1. **Linear** _(primary)_. The gold standard for modern desktop SaaS aesthetic. Borrowed: restraint of color, disciplined motion, brand accent against monochrome neutrals, tight type rhythm, density without claustrophobia.
2. **Arc Browser**. Borrowed: custom chrome that feels native (not webby), willingness to break web conventions on a desktop surface, the way layered surfaces communicate hierarchy.
3. **Vercel (the app, not the marketing site)**. Borrowed: geometric calm, monochrome status indicators, button restraint, sharp tabular layouts.
4. **Things 3**. Borrowed: native vibrancy on sidebar, motion physics, popover craft, the way small details accumulate into "Mac app" feel.
5. **Apple macOS Tahoe / Liquid Glass (macOS 26)**. Borrowed: the *subtle* glass material on left sidebar and overlays. Specular-edge highlights on translucent surfaces. Adaptive tint.

## Liquid-glass dosage: SUBTLE HINT

- ✅ Sidebar (native vibrancy)
- ✅ Command palette, popovers, dropdowns, menus, tooltips (backdrop-filter or native vibrancy where supported)
- ❌ Main content area (opaque)
- ❌ Titlebar (opaque; respects the macOS hidden-inset behavior already in place)
- ❌ In-content toolbars / tab bars (opaque)

The point: liquid glass is a hint of Mac-26 character on layered chrome, not a wholesale material language across the app. Most pixels are opaque and calm.

## Brand role discipline

The Stoik palette is already baked in. Roles are now strict:

- **Stoik blue (`#1362dd`)** = primary actions, focus rings, selection highlights, "info" surfaces, the focused tab indicator, the primary button. The one color the eye lands on when it needs to act.
- **Stoik violin (`#320a37`)** = reserved for **special** moments only: merged-PR state, achievement/celebration cues, accent highlights on specific UI events. Rare. Earns its weight by being rare.
- **Never use blue and violin adjacent to each other.** If your design needs both visible at once, it's wrong.
- **Neutrals do 90% of the work.** Background, foreground, borders — all from the P3 neutral scale.

## Typography commitment: native system stack

- **Display + body**: SF Pro (Display ≥20px, Text <20px) via `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", ...`
- **Mono**: SF Mono via `ui-monospace, "SF Mono", Menlo, Monaco, Consolas, ...`
- **No web-loaded fonts.** Zero font-loading cost, perfect native feel on Mac. Windows/Linux fall back to their respective system stacks.

Rationale: the user explicitly chose this over committing to Geist / Inter / Berkeley. A native font on a native app is honest design.

## Density philosophy: balanced

Mid-range type. Comfortable but real-density-capable.

- Body: 13px (`text-base`) for primary, 12px (`text-sm`) for secondary, 11px (`text-xs`) for tertiary/labels
- Reading: 14-16px allowed in editorial moments (settings descriptions, prompts library)
- Compact lists (sidebar, tab bar, terminal output): 12-13px

See `DESIGN_TOKENS.md` for the full scale.

## Anti-patterns

Things this rework MUST NOT become. Each one is a real failure mode I will guard against during reviews.

- ❌ **Generic "AI chat bubble" UI.** No avatar circles + speech bubbles + "Assistant is typing…" tropes. This is a desktop power tool, not a consumer chatbot.
- ❌ **Purple gradients on white backgrounds.** The single biggest AI-design tell.
- ❌ **`rounded-3xl` everything.** Radii are 4–12px range (see tokens). Reserve 16px+ for hero surfaces only.
- ❌ **Inter as display font.** System fonts are better here. Don't reintroduce Inter via any "web font" detour.
- ❌ **Centered max-width content.** This is a desktop app. Fill the window. The only exception is the onboarding/welcome surfaces, which are intentional centered moments.
- ❌ **Tailwind `dark:` variants.** The codebase applies `.emlight`/`.emdark`, not `.dark`. The audit found `dark:` utilities are dead-or-flaky. Use semantic tokens directly.
- ❌ **Hardcoded hex / rgba.** Every color reference goes through a semantic token. If a token doesn't exist for what you need, add one.
- ❌ **Emoji decorations in UI chrome.** Emoji in user-supplied content (commit messages, conversation contents) is fine; emoji in chrome (button labels, headers, empty states) is not.
- ❌ **Dark mode = pure black.** The P3 dark neutrals (`--neutral-1` = `display-p3 0.067 0.067 0.067`) are correct. Don't override with `#000`.
- ❌ **Animation for the sake of animation.** Motion reveals hierarchy or confirms intent. If a motion doesn't do work, delete it.
- ❌ **Marketing-page heroes inside the workspace.** "Welcome to Emdash" gradient backgrounds belong only in onboarding, never in regular views.
- ❌ **Raw shadcn defaults shipped unchanged.** Every primitive must be re-pitched for desktop. Generic shadcn cards in an Electron app feel like a website.
- ❌ **Skeumorphism.** Liquid glass is a material, not a skeumorphic prop. No textured "leather" or "paper" or "wood" surfaces.

## What "done" looks like

A user familiar with Linear and Things 3 should open Emdash and think: "yes, this is in the same conversation."

Specifically:
- The sidebar has the soft vibrancy of a real Mac app.
- The primary button is unmistakably Stoik blue and obvious without being loud.
- Type feels native — no `Inter` web-font shimmer on first paint.
- Motion is short, spring-y, never longer than it needs to be.
- Dark mode is not just inverted — it's its own first-class design.
- Nothing screams. Everything earns its position.

## Out of scope (for this brief)

Decisions deferred to later phases:
- Monaco editor's color theme (Phase 3+; touched only deliberately, not by accident).
- Onboarding flow content (just visual treatment, not flow restructure).
- The webview-based in-app browser pane chrome (separate effort).
- Marketing site / docs site styling (lives in `docs/`, separate from the renderer).
