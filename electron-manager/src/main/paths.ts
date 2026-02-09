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

/** Ensure the working directory tree exists. Call once at startup. */
export function ensureWorkingDir(): void {
  const dir = getWorkingDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
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
