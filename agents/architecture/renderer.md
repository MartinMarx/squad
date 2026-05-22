# Renderer

## Main Entry Points

- `src/renderer/App.tsx`: top-level provider composition + `AppView` state (`onboarding` | `welcome` | `workspace`)
- `src/renderer/main.tsx`: bootstrap (Monaco pool init, RPC wiring, navigation snapshot restore, `ReactDOM.createRoot`)
- `src/renderer/app/workspace.tsx`: main post-onboarding shell (left sidebar + main content with title-bar slot)
- `src/renderer/app/view-registry.ts`: registry of top-level views with `WrapView` / `TitlebarSlot` / `MainPanel` slots and optional `canActivate` guards
- `src/renderer/app/modal-registry.ts`: registry of all modals (size + position)
- `src/renderer/lib/ipc.ts`: typed RPC client (`rpc`) and event emitter (`events`) used throughout renderer

## Top-level Views (`src/renderer/app/view-registry.ts`)

| ID | File |
|---|---|
| `home` | `src/renderer/app/home-view.tsx` |
| `library` | `src/renderer/features/library/library-view.tsx` |
| `skills` | `src/renderer/features/skills/skills-view.tsx` |
| `mcp` | `src/renderer/features/mcp/mcp-view.tsx` |
| `project` | `src/renderer/features/projects/view.tsx` |
| `task` | `src/renderer/features/tasks/view.tsx` |
| `settings` | `src/renderer/features/settings/settings-view.tsx` |

## Feature Areas (`src/renderer/features/`)

- `command-palette/` — `cmdk`-backed command palette modal and command registration
- `integrations/` — GitHub, Linear, and other integration UI + provider
- `library/` — prompts library (prompt modal + library view)
- `mcp/` — MCP server management view, modal, settings card
- `onboarding/` — onboarding step components (`sign-in`, `import`)
- `projects/` — project root view, task list, project titlebar, settings, add-project flow
- `settings/` — app settings view, GitHub/Linear connect modals
- `sidebar/` — left sidebar (virtualized list, drag-and-drop, search, agent status)
- `skills/` — skills catalog and management
- `tasks/` — task experience:
  - `conversations/` — agent conversation panel + tabs (create-conversation modal)
  - `diff-view/` — file changes panel, diff viewer (file + stacked), PR section, create-PR modal
  - `editor/` — Monaco editor, file tree, conflict dialog
  - `terminals/` — xterm panels with tabs
  - `notebook/` — notebook view
  - `tabs/` — tab bar primitives
  - `hooks/`, `stores/`, `view/`, `task-view-context.tsx` — task-scoped state + selectors

## Library (`src/renderer/lib/`)

- `ui/` — shared UI primitives (~50 components: button, dialog, input, popover, dropdown, select, tooltip, …)
- `components/` — app-shell components (error-boundary, app-keyboard-shortcuts, monaco-keyboard-bridge, confirm-action-dialog, github-device-flow-modal, unsaved-changes-dialog)
- `providers/` — theme provider, GitHub context, integrations, feature-flag override
- `layout/` — workspace layout, navigation provider, layout provider, panel drag store
- `theme/` — theme model + toggle logic
- `hooks/` — shared hooks
- `stores/` — MobX stores (`app-state`, `view-state-cache`, …)
- `commands/` — command registry, shortcut binding, app commands
- `editor/`, `monaco/` — editor primitives, Monaco model registry and pools
- `pty/` — renderer-side PTY frontend
- `modal/` — modal renderer and provider primitives
- `ipc.ts` — typed RPC client + event emitter

## Legacy (`src/renderer/_legacy/`)

Quarantined area for code on its way out. Don't add anything here; prefer migration over expansion.

## When Editing Here

- Check `agents/conventions/renderer-patterns.md` for modal, view, PTY frontend, and context patterns.
- Call RPC methods via the typed `rpc` client from `src/renderer/lib/ipc.ts` (e.g., `rpc.tasks.create(...)`).
- New modals must be registered in `src/renderer/app/modal-registry.ts`.
- New views must be registered in `src/renderer/app/view-registry.ts`.
- `window.electronAPI` is declared in `src/renderer/globals.d.ts` and exposes only `invoke`, `eventSend`, `eventOn`, `getPathForFile`. Use it directly only for IPC channels that need `event.sender` (PTY start/input/resize/kill, fsList, openIn); prefer the typed `rpc` client for everything else.
- If you change user-visible workflows, update the matching page in `docs/` when appropriate.
