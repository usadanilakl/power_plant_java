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

/** Get the path to bundled config-defaults (read-only, for seeding working dir). */
function getConfigDefaultsPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'config-defaults');
  }
  // Dev: dist/main/main/ → up 3 → electron-manager/config-defaults
  return path.resolve(__dirname, '..', '..', '..', 'config-defaults');
}

const CONFIG_FILES = ['pjm-config.json', 'gate-log-config.json'];

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
