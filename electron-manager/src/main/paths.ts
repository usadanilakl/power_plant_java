/**
 * Centralized path resolver for dev mode vs. packaged mode.
 *
 * Dev mode:
 *   __dirname = <project>/electron-manager/dist/main/main/
 *   Working dir: <project>/electron-manager/managed_apps/pid/ (3 levels up)
 *   Java: 'java' (system PATH)
 *
 * Packaged mode:
 *   __dirname = <asar>/dist/main/main/ (read-only, inside ASAR)
 *   Working dir: %PROGRAMDATA%/DK Power Manager/managed_apps/pid/ (shared across all users)
 *   Java: <install>/resources/jre/bin/java.exe
 */

import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

const WORKING_DIR_SUFFIX = path.join('managed_apps', 'pid');

/** Get the writable working directory for Spring Boot data (JAR, DB, config, uploads).
 *  Uses %PROGRAMDATA% in packaged mode so all Windows users share the same data. */
export function getWorkingDir(): string {
  if (app.isPackaged) {
    const programData = process.env.PROGRAMDATA || 'C:\\ProgramData';
    return path.join(programData, 'DK Power Manager', WORKING_DIR_SUFFIX);
  }
  // Dev: dist/main/main/ → up 3 → electron-manager/ → managed_apps/pid
  return path.resolve(__dirname, '..', '..', '..', WORKING_DIR_SUFFIX);
}

/** Get the path to the Java executable (bundled JRE in packaged mode, system PATH in dev). */
export function getJavaPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'jre', 'bin', 'java.exe');
  }
  return 'java';
}

/** Get the path to the bundled tessdata source directory (read-only, for copying to working dir). */
export function getTessdataSourcePath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'tessdata');
  }
  // Dev: <project>/electron-manager/dist/main/main/ → up 4 → <project>/tessdata
  return path.resolve(__dirname, '..', '..', '..', '..', 'tessdata');
}

/** Ensure the working directory tree exists and is writable by all users. Call once at startup. */
export function ensureWorkingDir(): void {
  const dir = getWorkingDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // In packaged mode, grant the Users group full control on the shared ProgramData folder
  // so any Windows user can write logs, DB, config, and layout files.
  if (app.isPackaged && process.platform === 'win32') {
    const programData = process.env.PROGRAMDATA || 'C:\\ProgramData';
    const rootDir = path.join(programData, 'DK Power Manager');
    try {
      execSync(`icacls "${rootDir}" /grant Users:(OI)(CI)F /T /Q`, { windowsHide: true });
    } catch (err: any) {
      console.warn('[Paths] Failed to set folder permissions:', err.message);
    }
  }
}

/** Copy bundled tessdata to working dir's lib/tessdata if not already present.
 *  SikuliConfig (Spring Boot) picks it up from ./lib/tessdata relative to CWD. */
export function ensureTessdata(): void {
  const targetDir = path.join(getWorkingDir(), 'lib', 'tessdata');
  if (fs.existsSync(targetDir)) return; // already deployed

  const sourceDir = getTessdataSourcePath();
  if (!fs.existsSync(sourceDir)) {
    console.log('Tessdata source not found at', sourceDir, '— skipping');
    return;
  }

  console.log(`Copying tessdata: ${sourceDir} -> ${targetDir}`);
  copyDirRecursive(sourceDir, targetDir);
  console.log('Tessdata deployed successfully');
}

/** Get the path to the bundled qa-data/guides folder. */
export function getGuidesPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'qa-data');
  }
  // Dev: dist/main/main/ → up 4 → <project>/qa-data
  return path.resolve(__dirname, '..', '..', '..', '..', 'qa-data');
}

/** Get the path to the bundled data directory (read-only, contains certificate.pfx). */
function getDataSourcePath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'data');
  }
  // Dev: dist/main/main/ → up 4 → <project>/data
  return path.resolve(__dirname, '..', '..', '..', '..', 'data');
}

/** Deploy bundled certificate files (PFX + PEM) to working dir if not already present.
 *  @azure/identity v4 requires PEM format — the PEM is pre-converted at build time. */
export function ensureCertificate(): void {
  const targetDir = path.join(getWorkingDir(), 'data');
  const sourceDir = getDataSourcePath();

  for (const file of ['certificate.pem', 'certificate.pfx']) {
    const target = path.join(targetDir, file);
    if (fs.existsSync(target)) continue;

    const source = path.join(sourceDir, file);
    if (!fs.existsSync(source)) continue;

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    fs.copyFileSync(source, target);
    console.log('[Paths] Certificate deployed:', target);
  }
}

/** Get the path to bundled config-defaults (read-only, for seeding working dir). */
function getConfigDefaultsPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'config-defaults');
  }
  // Dev: dist/main/main/ → up 3 → electron-manager/config-defaults
  return path.resolve(__dirname, '..', '..', '..', 'config-defaults');
}

const CONFIG_FILES = ['pjm-config.json', 'gate-log-config.json', 'sharepoint-config.json', 'perry-config.json', 'webview-ams-config.json'];

/**
 * Provision default config files into the working directory.
 * - If a config file doesn't exist: copies the bundled default.
 * - If it exists but is missing new keys: merges defaults underneath (existing values win).
 * Call once at startup after ensureWorkingDir().
 */
export function provisionDefaultConfigs(): void {
  const defaultsDir = getConfigDefaultsPath();
  if (!fs.existsSync(defaultsDir)) {
    console.log('Config defaults not found at', defaultsDir, '— skipping provisioning');
    return;
  }

  const workingDir = getWorkingDir();

  for (const file of CONFIG_FILES) {
    const defaultPath = path.join(defaultsDir, file);
    const targetPath = path.join(workingDir, file);

    if (!fs.existsSync(defaultPath)) continue;

    try {
      const defaults = JSON.parse(fs.readFileSync(defaultPath, 'utf-8'));

      if (!fs.existsSync(targetPath)) {
        // No config yet — copy the default
        fs.writeFileSync(targetPath, JSON.stringify(defaults, null, 2), 'utf-8');
        console.log(`[Config] Provisioned ${file} from defaults`);
      } else {
        // Config exists — merge new keys from defaults (existing values take priority)
        const existing = JSON.parse(fs.readFileSync(targetPath, 'utf-8'));
        let merged = false;
        for (const key of Object.keys(defaults)) {
          if (!(key in existing)) {
            existing[key] = defaults[key];
            merged = true;
          }
        }
        if (merged) {
          fs.writeFileSync(targetPath, JSON.stringify(existing, null, 2), 'utf-8');
          console.log(`[Config] Merged new keys into ${file}`);
        }
      }
    } catch (err: any) {
      console.warn(`[Config] Failed to provision ${file}:`, err.message);
    }
  }
}

function copyDirRecursive(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// ── EtaPro defaults ────────────────────────────────────────────────
//
// EtaPro is a desktop-only feature (hub has no Excel/COM). We ship a
// PowerShell scraper script and two Excel templates via extraResources,
// then provision them into the working directory on first launch.
//
// The Java backend reads the script from <workingDir>/scripts/ and the
// templates from <workingDir>/etapro/ — paths are relative to the cwd
// that spring-boot.manager.ts uses when spawning the JAR.

/** Get the path to bundled etapro-defaults (read-only source). */
function getEtaProDefaultsPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'etapro-defaults');
  }
  // Dev: dist/main/main/ → up 3 → electron-manager/etapro-defaults
  return path.resolve(__dirname, '..', '..', '..', 'etapro-defaults');
}

/**
 * Provision the EtaPro PowerShell script and Excel templates into the working directory.
 *
 * - `etapro-scrape.ps1` → `<workingDir>/scripts/etapro-scrape.ps1` (ALWAYS overwritten —
 *   it's code, updates should apply on every launch)
 * - `template-live.xlsx` → `<workingDir>/etapro/template-live.xlsx` (copy only if missing,
 *   to preserve any customizations the user made)
 * - `template-history.xlsx` → `<workingDir>/etapro/template-history.xlsx` (same)
 * - Creates empty `<workingDir>/etapro/output/` and `<workingDir>/etapro/signal/` dirs
 *
 * If the source directory is missing entirely, or if templates are missing from the bundle,
 * this function logs a warning and continues — Java will handle the missing-file case with
 * its own startup validation in EtaProScraperEngine.init().
 *
 * Call once at startup after ensureWorkingDir().
 */
export function provisionEtaProDefaults(): void {
  const sourceDir = getEtaProDefaultsPath();
  const workingDir = getWorkingDir();

  // Target directories (always create, even if source is missing)
  const scriptsDir = path.join(workingDir, 'scripts');
  const etaproDir = path.join(workingDir, 'etapro');
  const outputDir = path.join(etaproDir, 'output');
  const signalDir = path.join(etaproDir, 'signal');
  for (const d of [scriptsDir, etaproDir, outputDir, signalDir]) {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  }

  if (!fs.existsSync(sourceDir)) {
    console.warn('[EtaPro] Defaults directory missing, skipping provisioning:', sourceDir);
    return;
  }

  // 1. Script — always overwrite
  const scriptSource = path.join(sourceDir, 'etapro-scrape.ps1');
  const scriptTarget = path.join(scriptsDir, 'etapro-scrape.ps1');
  if (fs.existsSync(scriptSource)) {
    try {
      fs.copyFileSync(scriptSource, scriptTarget);
      console.log('[EtaPro] Provisioned scraper script:', scriptTarget);
    } catch (err: any) {
      console.warn('[EtaPro] Failed to copy scraper script:', err.message);
    }
  } else {
    console.warn('[EtaPro] Script not found in bundle:', scriptSource);
  }

  // 2. Templates — copy only if missing (preserve user edits)
  for (const name of ['template-live.xlsx', 'template-history.xlsx']) {
    const src = path.join(sourceDir, name);
    const dst = path.join(etaproDir, name);
    if (!fs.existsSync(src)) {
      console.warn(`[EtaPro] Template ${name} not in bundle — user must provide it manually`);
      continue;
    }
    if (fs.existsSync(dst)) {
      // Preserve user customizations
      continue;
    }
    try {
      fs.copyFileSync(src, dst);
      console.log('[EtaPro] Provisioned template:', dst);
    } catch (err: any) {
      console.warn(`[EtaPro] Failed to copy ${name}:`, err.message);
    }
  }
}
