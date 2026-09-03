/**
 * Durable last-resort logger for main-process fatals.
 *
 * process.stderr is a discard handle in a packaged Windows GUI app, and console.error is replaced
 * by IpcHandlers.interceptConsole() — so neither is a reliable place to record a fatal. Worse, a
 * fatal can happen before (or instead of) SpringBootManager existing, so the in-memory log buffer
 * that feeds the Logs page is not available either.
 *
 * This writes straight to a file in the working directory. It is deliberately synchronous and
 * dependency-free: it must work while the process is already in a bad state.
 */

import * as fs from 'fs';
import * as path from 'path';
import { getWorkingDir } from './paths';

const FILE = 'electron-main-fatal.log';

/**
 * Append a fatal to disk and stderr. Never throws — callers are already handling a failure.
 *
 * @param kind short marker, e.g. 'uncaughtException' or 'onReady'
 * @param err  the thrown value; Error stacks are preserved
 */
export function logFatal(kind: string, err: unknown): void {
  const detail = err instanceof Error ? (err.stack || err.message) : String(err);
  const stamp = new Date().toISOString();
  const line = `[${stamp}] [EM] [FATAL] ${kind}: ${detail}\n`;

  try {
    process.stderr.write(line);
  } catch {
    // stderr may be a discard handle; disk is the real target.
  }

  try {
    const dir = getWorkingDir();
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(path.join(dir, FILE), line, { encoding: 'utf8' });
  } catch {
    // Last resort already failed — there is nowhere else to go.
  }
}

/** Absolute path of the fatal log, for surfacing to an operator. */
export function fatalLogPath(): string {
  try {
    return path.join(getWorkingDir(), FILE);
  } catch {
    return FILE;
  }
}
