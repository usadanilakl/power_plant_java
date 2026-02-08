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
 *   Working dir: %APPDATA%/DK Power Manager/managed_apps/pid/
 *   Java: <install>/resources/jre/bin/java.exe
 */

import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

const WORKING_DIR_SUFFIX = path.join('managed_apps', 'pid');

/** Get the writable working directory for Spring Boot data (JAR, DB, config, uploads). */
export function getWorkingDir(): string {
  if (app.isPackaged) {
    return path.join(app.getPath('userData'), WORKING_DIR_SUFFIX);
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

/** Ensure the working directory tree exists. Call once at startup. */
export function ensureWorkingDir(): void {
  const dir = getWorkingDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
