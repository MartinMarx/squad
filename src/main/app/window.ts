import { join } from 'node:path';
import { BrowserWindow } from 'electron';
import appIcon from '@/assets/images/emdash/emdash_logo.png?asset';
import { registerExternalLinkHandlers } from '@main/utils/externalLinks';
import { PRODUCT_NAME } from '@shared/app-identity';
import { APP_ORIGIN } from './protocol';

let mainWindow: BrowserWindow | null = null;

export function createMainWindow(): BrowserWindow {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 700,
    minHeight: 500,
    title: PRODUCT_NAME,
    // In production, electron-builder injects the icon from the app bundle.
    ...(import.meta.env.DEV && { icon: appIcon }),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // Required for ESM preload scripts (.mjs)
      sandbox: false,
      // Allow using <webview> in renderer for in‑app browser pane.
      // The webview runs in a separate process; nodeIntegration remains disabled.
      webviewTag: true,
      // __dirname resolves to out/main/ at runtime; preload is at out/preload/index.mjs
      preload: join(__dirname, '../preload/index.mjs'),
    },
    ...(process.platform === 'darwin'
      ? {
          titleBarStyle: 'hiddenInset',
          trafficLightPosition: { x: 10, y: 10 },
          acceptFirstMouse: true,
          // Native vibrancy material on the window; the renderer's sidebar
          // uses a semi-transparent --background-sidebar token so the
          // underlying material shows through. Per DESIGN_BRIEF.md the
          // vibrancy stays subtle (sidebar + popover overlays only) —
          // main content + titlebar stay opaque.
          vibrancy: 'sidebar' as const,
          visualEffectState: 'followWindow' as const,
          // Transparent BrowserWindow background lets the vibrancy material
          // reach renderer pixels that don't paint their own background.
          // Body is transparent in index.css; opaque surfaces (main panel,
          // onboarding shell, modals, etc.) paint --background themselves.
          backgroundColor: '#00000000',
        }
      : {}),
    show: false,
  });

  if (import.meta.env.DEV) {
    void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL!);
  } else {
    void mainWindow.loadURL(`${APP_ORIGIN}/index.html`);
  }

  // Route external links to the user’s default browser
  registerExternalLinkHandlers(mainWindow, import.meta.env.DEV);

  // Show when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('focus', () => {
    if (typeof mainWindow?.setWindowButtonVisibility === 'function') {
      mainWindow.setWindowButtonVisibility(true);
    }
  });

  // Cleanup reference on close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}
