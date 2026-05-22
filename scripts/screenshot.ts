/**
 * Capture before/after screenshots of the Electron app for the redesign loop.
 *
 * Usage:
 *   pnpm run build
 *   node --experimental-strip-types scripts/screenshot.ts [--out=before|after]
 *
 * Output:
 *   docs/redesign/screenshots/<out>/<view>-<mode>-<size>.png
 *
 * Captures each view in both themes (light/dark) at two window sizes
 * (1400x900 + 1024x720). Navigation uses sidebar button clicks and tab
 * interactions — not the command palette, which only exposes app-level
 * commands (settings, new project, toggle theme, navigate back/forward) and
 * not the top-level view navigation we need here.
 *
 * Onboarding is captured first against a fresh DB. After that, the onboarding
 * bypass localStorage key is installed via `addInitScript` and the page is
 * reloaded so the rest of the captures land on the post-onboarding workspace
 * shell. The home view shows an action list on empty state; library / skills /
 * mcp are sub-tabs of the library view; settings is its own view.
 */

import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { _electron as electron, type ElectronApplication, type Page } from 'playwright';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');

const outFlag = process.argv.find((a) => a.startsWith('--out='));
const OUT_DIR_NAME = outFlag ? outFlag.slice('--out='.length) : 'before';
const OUTPUT_DIR = join(PROJECT_ROOT, 'docs', 'redesign', 'screenshots', OUT_DIR_NAME);

const ONBOARDING_KEY = 'emdash:has-seen-onboarding:v1';

type Mode = 'light' | 'dark';
type Size = { readonly name: 'lg' | 'sm'; readonly w: number; readonly h: number };

const SIZES: readonly Size[] = [
  { name: 'lg', w: 1400, h: 900 },
  { name: 'sm', w: 1024, h: 720 },
];

type Capture = {
  /** filename stem (e.g. "settings" → settings-light-lg.png) */
  readonly name: string;
  /** Run once before this capture's (mode, size) inner loop. */
  readonly prepare?: (ctx: { page: Page; app: ElectronApplication }) => Promise<void>;
};

const CAPTURES: readonly Capture[] = [
  // Default state on fresh launch — no bypass, no navigation.
  { name: 'onboarding' },

  // First post-bypass capture: install the bypass and reload. The default
  // post-bypass view is `home`, which renders the 3-action "open project"
  // list. Pressing Enter on it opens the Add Project modal, so we must avoid
  // synthetic Enter presses before this capture.
  {
    name: 'home',
    prepare: async ({ app, page }) => {
      await installOnboardingBypass(app);
      await page.reload();
      await waitForRendererReady(page);
      await dismissOverlays(page);
    },
  },

  // Library top-level view (defaults to the Prompts tab).
  {
    name: 'library',
    prepare: async ({ page }) => {
      await dismissOverlays(page);
      await clickSidebarButton(page, 'Library');
    },
  },

  // Skills is a tab within the library view.
  {
    name: 'skills',
    prepare: async ({ page }) => {
      await clickLibraryTab(page, 'Skills');
    },
  },

  // MCP is also a tab within the library view.
  {
    name: 'mcp',
    prepare: async ({ page }) => {
      await clickLibraryTab(page, 'MCP');
    },
  },

  // Settings is a top-level view.
  {
    name: 'settings',
    prepare: async ({ page }) => {
      await clickSidebarButton(page, 'Settings');
    },
  },
];

async function waitForRendererReady(page: Page): Promise<void> {
  await page.waitForURL(/^app:\/\//, { timeout: 30_000 });
  await page.waitForFunction(
    () => (document.getElementById('root')?.children.length ?? 0) > 0,
    null,
    { timeout: 30_000 }
  );
  await page.waitForTimeout(800);
}

async function installOnboardingBypass(app: ElectronApplication): Promise<void> {
  await app.context().addInitScript((key: string) => {
    try {
      localStorage.setItem(key, 'true');
    } catch {
      /* opaque origin — succeeds on the next load */
    }
  }, ONBOARDING_KEY);
}

async function dismissOverlays(page: Page): Promise<void> {
  // Send a few Escape presses to close any open modal, popover, or
  // command palette. Most overlays in this app respond to Escape.
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(120);
}

async function setTheme(page: Page, mode: Mode): Promise<void> {
  await page.evaluate((m: Mode) => {
    const root = document.documentElement;
    root.classList.remove('emlight', 'emdark');
    root.classList.add(m === 'light' ? 'emlight' : 'emdark');
  }, mode);
  await page.waitForTimeout(120);
}

async function setSize(app: ElectronApplication, w: number, h: number): Promise<void> {
  await app.evaluate(
    async ({ BrowserWindow }, dim: { w: number; h: number }) => {
      const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
      if (win) {
        win.setBounds({ width: dim.w, height: dim.h }, false);
      }
    },
    { w, h }
  );
  await new Promise((r) => setTimeout(r, 220));
}

async function clickSidebarButton(page: Page, label: 'Library' | 'Settings'): Promise<void> {
  // The left sidebar exposes Library and Settings buttons via aria-label. Use
  // the attribute selector directly: getByRole(..., { exact: true }) misses
  // the Settings button because BoundShortcut appends the "⌘," shortcut to its
  // accessible name.
  await page.locator(`[aria-label="${label}"]`).first().click();
  await page.waitForTimeout(450);
}

async function clickLibraryTab(page: Page, tab: 'Prompts' | 'Skills' | 'MCP'): Promise<void> {
  // Inside the library view, a side nav has Prompts / Skills / MCP buttons.
  await page.getByRole('button', { name: tab, exact: true }).first().click();
  await page.waitForTimeout(350);
}

async function captureOne(
  page: Page,
  app: ElectronApplication,
  capture: Capture
): Promise<void> {
  if (capture.prepare) {
    await capture.prepare({ page, app });
  }
  for (const size of SIZES) {
    await setSize(app, size.w, size.h);
    for (const mode of ['light', 'dark'] as const) {
      await setTheme(page, mode);
      const filename = `${capture.name}-${mode}-${size.name}.png`;
      await page.screenshot({ path: join(OUTPUT_DIR, filename) });
      console.log(`  📸 ${filename}`);
    }
  }
}

async function main(): Promise<void> {
  // Isolate the Electron app from the user's real userData/DB by giving it a
  // fake HOME. On macOS the app resolves appData via $HOME/Library/Application
  // Support; with a fresh HOME we get a clean userData (no singleton lock
  // contention with a real Emdash install) and a fresh DB.
  const tmpHome = await mkdtemp(join(tmpdir(), 'emdash-screenshot-home-'));
  await mkdir(join(tmpHome, 'Library', 'Application Support'), { recursive: true });
  const tmpDb = join(tmpdir(), `emdash-screenshot-${Date.now()}.db`);

  await rm(OUTPUT_DIR, { recursive: true, force: true });
  await mkdir(OUTPUT_DIR, { recursive: true });

  console.log(`Launching Electron with HOME=${tmpHome}`);
  const app = await electron.launch({
    args: [PROJECT_ROOT],
    env: {
      ...process.env,
      HOME: tmpHome,
      EMDASH_DB_FILE: tmpDb,
    } as Record<string, string>,
  });
  const page = await app.firstWindow();

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log(`[renderer error] ${msg.text()}`);
    }
  });
  page.on('pageerror', (err) => {
    console.error(`[renderer pageerror] ${err.message}`);
  });

  console.log('Waiting for renderer to mount…');
  await waitForRendererReady(page);
  console.log(`Renderer ready. URL: ${page.url()}`);

  try {
    for (const capture of CAPTURES) {
      console.log(`\n--- ${capture.name} ---`);
      await captureOne(page, app, capture);
    }
  } finally {
    await app.close();
  }

  console.log(`\nDone. Output: ${OUTPUT_DIR}`);
}

main().catch((err: unknown) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
