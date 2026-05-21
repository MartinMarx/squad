# Providers

## Source Of Truth

- `src/shared/agent-provider-registry.ts`
- `src/main/core/dependencies/dependency-manager.ts`
- `src/main/core/pty/`

## Current Providers (3)

claude, codex, cursor

## Provider Metadata Includes

- CLI and detection commands
- version args
- install command and docs URL
- auto-approve flags
- initial prompt handling
- resume and session flags
- optional plan activation and auto-start commands

## Agent Event Classifiers

Cursor has a dedicated terminal output classifier in `src/main/core/agent-hooks/classifiers/`. Other providers use the generic classifier. These parse agent terminal output to detect events and forward them to the renderer via the agent hooks module (`src/main/core/agent-hooks/`).

## Provider Runtime Notes

- Claude uses deterministic `--session-id` values for conversation isolation.
- `src/main/core/agent-hooks/hook-config.ts` writes hook config files (`.claude/settings.local.json`, `.codex/hooks.json`) into worktrees.

## Adding Or Changing A Provider

1. update `src/shared/agent-provider-registry.ts`
2. update allowlisted agent env vars in `src/main/core/pty/pty-env.ts` if needed
3. add an agent event classifier in `src/main/core/agent-hooks/classifiers/` when non-generic parsing is required
4. validate detection behavior in `src/main/core/dependencies/`
5. add or update tests for any non-standard behavior
