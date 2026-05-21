<img alt="Emdash banner" src="https://github.com/user-attachments/assets/a2ecaf3c-9d84-40ca-9a8e-d4f612cc1c6f" />


<div align="center" style="margin:24px 0;">
  
<br />

[![Apache 2.0 License](https://img.shields.io/badge/License-Apache_2.0-555555.svg?labelColor=333333&color=666666)](./LICENSE.md)
[![Downloads](https://img.shields.io/github/downloads/generalaction/emdash/total?labelColor=333333&color=666666)](https://github.com/generalaction/emdash/releases)
[![GitHub Stars](https://img.shields.io/github/stars/generalaction/emdash?labelColor=333333&color=666666)](https://github.com/generalaction/emdash)
[![Last Commit](https://img.shields.io/github/last-commit/generalaction/emdash?labelColor=333333&color=666666)](https://github.com/generalaction/emdash/commits/main)
[![Commit Activity](https://img.shields.io/github/commit-activity/m/generalaction/emdash?labelColor=333333&color=666666)](https://github.com/generalaction/emdash/graphs/commit-activity)
<br>
[![Discord](https://img.shields.io/badge/Discord-join-%235462eb?labelColor=%235462eb&logo=discord&logoColor=%23f5f5f5)](https://discord.gg/f2fv7YxuR2)
<a href="https://www.ycombinator.com"><img src="https://img.shields.io/badge/Y%20Combinator-W26-orange" alt="Y Combinator W26"></a>
[![Follow @emdashsh on X](https://img.shields.io/twitter/follow/emdashsh?logo=X&color=%23f5f5f5)](https://twitter.com/intent/follow?screen_name=emdashsh)

<br />

  <a href="https://emdash.sh/download" style="display:inline-block; margin-right:8px; text-decoration:none; outline:none; border:none;">
    <img src="https://emdash.sh/media/readme/downloadforwindows.png" alt="Download for Windows" height="40">
  </a>
  <a href="https://emdash.sh/download" style="display:inline-block; margin-right:8px; text-decoration:none; outline:none; border:none;">
    <img src="https://emdash.sh/media/readme/downloadformacos.png" alt="Download for macOS" height="40">
  </a>
  <a href="https://emdash.sh/download" style="display:inline-block; text-decoration:none; outline:none; border:none;">
    <img src="https://emdash.sh/media/readme/downloadforlinux.png" alt="Download for Linux" height="40">
  </a>

</div>

<br />

Emdash is a provider-agnostic desktop app that lets you run multiple coding agents in parallel, each isolated in its own git worktree on your local machine. We call it an Agentic Development Environment (ADE).

Emdash supports Claude Code, Codex, and Cursor. Users can pass Linear or GitHub issues to an agent, review diffs, test changes, create PRs, see CI/CD checks, and merge.

<div align="center" style="margin:24px 0;">

[Installation](#installation) • [Providers](#providers) • [Contributing](#contributing) • [FAQ](#faq)

</div>

<img alt="Emdash product" src="https://emdash.sh/media/blog/public-v1-beta/v1beta.jpg" />

# Installation

### macOS
- Homebrew: `brew install --cask emdash`
- Apple Silicon: https://releases.emdash.sh/emdash-arm64.dmg
- Intel x64: https://releases.emdash.sh/emdash-x64.dmg

### Windows
- Installer (x64): https://releases.emdash.sh/emdash-x64.msi
- Portable (x64): https://releases.emdash.sh/emdash-x64.exe

### Linux
- AppImage (x64): https://releases.emdash.sh/emdash-x86_64.AppImage
- Debian package (x64): https://releases.emdash.sh/emdash-amd64.deb

### Release Overview

**[Latest Releases (macOS • Windows • Linux)](https://github.com/generalaction/emdash/releases/latest)**

# Providers

<img alt="Providers banner" src="https://github.com/user-attachments/assets/c7b32a3e-452c-4209-91ef-71bcd895e2df" />

### Supported CLI Providers

| CLI Provider | Status | Install / Setup |
| ----------- | ------ | ----------- |
| [Claude Code](https://docs.anthropic.com/claude/docs/claude-code) | ✅ Supported | <code>curl -fsSL https://claude.ai/install.sh &#124; bash</code> |
| [Codex](https://github.com/openai/codex) | ✅ Supported | <code>npm install -g @openai/codex</code> |
| [Cursor](https://cursor.com/cli) | ✅ Supported | <code>curl https://cursor.com/install -fsS &#124; bash</code> |

### Issues

Emdash allows you to pass issues, tickets, and support threads straight to your coding agent.

| Tool | Status | Authentication |
| ----------- | ------ | ----------- |
| [Linear](https://linear.app) | ✅ Supported | Connect with Linear OAuth via the official MCP server. |
| [GitHub Issues](https://docs.github.com/en/issues) | ✅ Supported | Connect your GitHub account or authenticate via GitHub CLI (`gh auth login`). |

# Contributing

Contributions welcome! See the [Contributing Guide](CONTRIBUTING.md) to get started, and join our [Discord](https://discord.gg/f2fv7YxuR2) to discuss.

# FAQ

<details>
<summary><b>Where is my data stored?</b></summary>

> **App data is local‑first**. We store app state in a local **SQLite** database:
>
> ```
> macOS:   ~/Library/Application Support/emdash/emdash.db
> Windows: %APPDATA%\emdash\emdash.db
> Linux:   ~/.config/emdash/emdash.db
> ```
>
> **Privacy Note:** While Emdash itself stores data locally, **when you use any coding agent (Claude Code, Codex, or Cursor), your code and prompts are sent to that provider's cloud API servers** for processing. Each provider has their own data handling and retention policies.
>
> You can reset the local DB by deleting it (quit the app first). The file is recreated on next launch.
</details>

<details>
<summary><b>How do I add a new provider?</b></summary>

> Emdash is **provider‑agnostic** and built to add CLIs quickly.
>
> - Open a PR following the **Contributing Guide** (`CONTRIBUTING.md`).
> - Include: provider name, how it’s invoked (CLI command), auth notes, and minimal setup steps.
> - We’ll add it to the **Providers table** and wire up provider selection in the UI.
>
> If you’re unsure where to start, open an issue with the CLI’s link and typical commands.
</details>

<details>
<summary><b>What permissions does Emdash need?</b></summary>

> - **Filesystem/Git:** to read/write your repo and create **Git worktrees** for isolation.  
> - **Network:** only for provider CLIs you choose to use (e.g., Codex, Claude) and optional GitHub actions.  
> - **Local DB:** to store your app state in SQLite on your machine.
>
> Emdash itself does **not** send your code or chats to any servers. Third‑party CLIs may transmit data per their policies.
</details>

[![Follow @emdashsh](https://img.shields.io/twitter/follow/emdashsh?style=social&label=Follow%20%40emdashsh)](https://x.com/emdashsh)
[![Follow @rabanspiegel](https://img.shields.io/twitter/follow/rabanspiegel?style=social&label=Follow%20%40rabanspiegel)](https://x.com/rabanspiegel)
[![Follow @arnestrickmann](https://img.shields.io/twitter/follow/arnestrickmann?style=social&label=Follow%20%40arnestrickmann)](https://x.com/arnestrickmann)
