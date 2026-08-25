/**
 * ColdResyncManager - Downloads H2 database and files from the sync server
 * BEFORE Spring Boot starts. Enables first-run setup and external resync
 * without needing Spring Boot to be running.
 *
 * H2's BACKUP TO creates a standard ZIP containing the .mv.db file.
 * We use adm-zip (pure JS) to extract it — no Java needed.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import AdmZip from 'adm-zip';
import { ColdResyncProgress, IpcResult } from '../../shared/types';
import { DEFAULT_SPRING_BOOT_CONFIG, getDbNameForProfile, getUploadsDirForProfile } from '../constants';
import { getWorkingDir } from '../paths';
import { DeviceConfigManager } from './device-config.manager';

const SYNC_STATUS_FILE = 'sync-status.json';

interface ManifestEntry {
  relativePath: string;
  fileHash: string;
  fileSize: number;
  lastModified: string;
}

export class ColdResyncManager {
  private workingDir: string;
  private dbDir: string;
  private dbPath: string;
  private uploadsDir: string;
  private dbName: string;

  constructor(deviceConfigManager?: DeviceConfigManager) {
    this.workingDir = getWorkingDir();
    const profile = deviceConfigManager?.getConfig()?.springProfile;
    this.dbName = getDbNameForProfile(profile);
    this.dbDir = path.join(this.workingDir, 'db');
    this.dbPath = path.join(this.dbDir, `${this.dbName}.mv.db`);
    this.uploadsDir = path.join(this.workingDir, getUploadsDirForProfile(profile));
    console.log(`ColdResyncManager: workingDir=${this.workingDir} dbPath=${this.dbPath} uploadsDir=${this.uploadsDir}`);
  }

  /** True if the database file doesn't exist (first run or deleted) */
  public needsColdResync(): boolean {
    return !fs.existsSync(this.dbPath);
  }

  /** Check if database file exists */
  public isDbPresent(): boolean {
    return fs.existsSync(this.dbPath);
  }

  /** Get database file size in bytes (0 if missing) */
  public getDbSizeBytes(): number {
    if (!fs.existsSync(this.dbPath)) return 0;
    return fs.statSync(this.dbPath).size;
  }

  /** Check if uploads directory exists and has files */
  public areFilesPresent(): boolean {
    if (!fs.existsSync(this.uploadsDir)) return false;
    return this.getFilesTotalSizeBytes() > 0;
  }

  /** Get total size of uploads directory in bytes */
  public getFilesTotalSizeBytes(): number {
    if (!fs.existsSync(this.uploadsDir)) return 0;
    return this.getDirSize(this.uploadsDir);
  }

  /** Download and extract H2 database only */
  public async syncDatabase(
    serverUrl: string,
    machineId: string,
    deviceNumber: number,
    onProgress: (msg: string, pct: number) => void
  ): Promise<IpcResult & { syncCutoff?: string; preswapAsidePath?: string }> {
    const headers = { 'X-Machine-Id': machineId, 'X-Device-Number': String(deviceNumber) };

    try {
      this.ensureDirectories();

      // Preserve un-pushed local changes across the swap: copy the CURRENT DB aside before it's overwritten,
      // so the post-swap /api/resync/preserve-local-changes routine can re-inject anything the hub never got.
      // Best-effort — a copy failure must not block the resync (only the local-change rescue is skipped).
      let preswapAsidePath: string | undefined;
      try {
        preswapAsidePath = await this.copyDbAside();
      } catch (e: any) {
        console.warn(`cold-resync: could not copy DB aside for change preservation: ${e?.message || e}`);
      }

      onProgress('Downloading database...', 0);
      const backupZipPath = path.join(this.dbDir, 'backup_cold.zip');
      // Capture the snapshot's SyncOrder cutoff from THIS download response — it must come from the same
      // response as the bytes we install, so a bounded mark-synced can't clear changes newer than the snapshot.
      const syncCutoff = await this.downloadFile(
        `${serverUrl}/api/resync/database/h2-backup`,
        backupZipPath,
        headers,
        (bytesDownloaded, totalBytes) => {
          const pct = totalBytes > 0 ? Math.round((bytesDownloaded / totalBytes) * 60) : 10;
          onProgress('Downloading database...', pct);
        }
      );

      const zipStat = fs.statSync(backupZipPath);
      console.log(`H2 backup ZIP downloaded: ${zipStat.size} bytes (${(zipStat.size / 1024 / 1024).toFixed(1)} MB), cutoff=${syncCutoff ?? 'none'}`);

      onProgress('Extracting database...', 70);
      await this.extractDatabase(backupZipPath);
      try { fs.unlinkSync(backupZipPath); } catch { /* ignore */ }

      this.persistSyncStatus();
      onProgress('Database synced', 100);
      return { success: true, syncCutoff, preswapAsidePath };
    } catch (err: any) {
      return { success: false, error: err.message || 'Database sync failed' };
    }
  }

  /**
   * Copy the current DB file aside (a pre-swap snapshot) so un-pushed local changes can be rescued after the
   * swap replaces it. Safe to call only while Spring Boot is stopped (the DB is unlocked then). Returns the
   * aside path, or undefined if there's no DB to copy.
   */
  private async copyDbAside(): Promise<string | undefined> {
    if (!fs.existsSync(this.dbPath)) return undefined;
    const asidePath = path.join(this.dbDir, `${this.dbName}-preswap.mv.db`);
    // Async copy (off the main thread via libuv) so a 1 GB+ DB doesn't freeze the UI.
    await fs.promises.copyFile(this.dbPath, asidePath);
    console.log(`cold-resync: copied pre-swap DB aside → ${asidePath} (${(fs.statSync(asidePath).size / 1024 / 1024).toFixed(1)} MB)`);
    return asidePath;
  }

  /** Delete a pre-swap aside copy once its changes have been rescued (or on give-up). Best-effort. */
  public deleteAside(asidePath: string): void {
    try {
      if (asidePath && fs.existsSync(asidePath)) {
        fs.unlinkSync(asidePath);
        console.log(`cold-resync: removed pre-swap aside ${asidePath}`);
      }
    } catch (e: any) {
      console.warn(`cold-resync: could not remove aside ${asidePath}: ${e?.message || e}`);
    }
  }

  /** Download files only (from manifest).
   *  @param cleanFirst If true, deletes all local files before downloading. Default: false (only download missing). */
  public async syncFiles(
    serverUrl: string,
    machineId: string,
    deviceNumber: number,
    onProgress: (msg: string, pct: number) => void,
    cleanFirst: boolean = false
  ): Promise<IpcResult> {
    const headers = { 'X-Machine-Id': machineId, 'X-Device-Number': String(deviceNumber) };

    try {
      this.ensureDirectories();

      // Clean existing files if requested
      if (cleanFirst && fs.existsSync(this.uploadsDir)) {
        onProgress('Clearing local files...', 0);
        console.log(`Clean file sync: removing ${this.uploadsDir}`);
        fs.rmSync(this.uploadsDir, { recursive: true, force: true });
        fs.mkdirSync(this.uploadsDir, { recursive: true });
      }

      onProgress('Fetching file manifest...', 0);
      const manifest = await this.httpGetJson<ManifestEntry[]>(
        `${serverUrl}/api/resync/files/path-manifest`,
        headers
      );

      console.log(`File manifest: ${manifest?.length ?? 0} entries${manifest?.length > 0 ? ', first: ' + manifest[0].relativePath : ''}`);

      if (!manifest || manifest.length === 0) {
        onProgress('No files to download', 100);
        return { success: true };
      }

      onProgress(`Found ${manifest.length} files`, 5);

      let downloaded = 0;
      let skipped = 0;
      let failed = 0;
      let processed = 0;
      for (const entry of manifest) {
        processed++;
        let relativePath = entry.relativePath;
        if (relativePath.startsWith('uploads-prod/')) {
          relativePath = relativePath.substring('uploads-prod/'.length);
        } else if (relativePath.startsWith('uploads-prod\\')) {
          relativePath = relativePath.substring('uploads-prod\\'.length);
        }

        const localPath = path.join(this.uploadsDir, relativePath);
        const localDir = path.dirname(localPath);

        if (fs.existsSync(localPath)) {
          skipped++;
          onProgress(`Downloading files... (${processed}/${manifest.length})`, 5 + Math.round((processed / manifest.length) * 95));
          continue;
        }

        if (!fs.existsSync(localDir)) {
          fs.mkdirSync(localDir, { recursive: true });
        }

        // Fetch via the QUERY-PARAM endpoint — the file path rides in ?path= so the URL path carries no
        // file extension. In production the hub sits behind IIS/ARR, whose static-file handler intercepts
        // an extension-bearing proxied URL (…/foo.pdf) under Windows Auth and 401s it BEFORE forwarding.
        // The old `/permanent/<path>.pdf` form hit exactly that 401; because a failed download here is only
        // warned-and-skipped (not retried, and previously miscounted as "downloaded"), those files silently
        // never arrived and resurfaced later as file drift. A no-extension URL path sidesteps IIS, and this
        // is the same endpoint FileDriftService.pull uses on the backend.
        const encodedParam = encodeURIComponent(entry.relativePath);
        try {
          await this.downloadFile(`${serverUrl}/api/resync/files/permanent-by-path?path=${encodedParam}`, localPath, headers);
          downloaded++;
        } catch (err: any) {
          failed++;
          console.warn(`Failed to download file: ${entry.relativePath} — ${err.message}`);
        }

        const pct = 5 + Math.round((processed / manifest.length) * 95);
        onProgress(`Downloading files... (${processed}/${manifest.length})`, pct);
      }

      console.log(`Files sync: ${downloaded} downloaded, ${skipped} skipped, ${failed} failed`);
      if (failed > 0) {
        // Do NOT fail the whole cold resync for per-file misses — the DB is already in place and the
        // file-drift detector will re-attempt these. But make the loss LOUD instead of silent.
        console.warn(`Cold resync: ${failed} file(s) could not be downloaded from the hub; file-drift repair will retry them.`);
      }
      this.persistSyncStatus();
      onProgress(failed > 0 ? `Files synced (${failed} failed)` : 'Files synced', 100);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Files sync failed' };
    }
  }

  /**
   * Perform cold resync — downloads DB + files from sync server.
   * Must be called BEFORE Spring Boot starts (DB file can't be replaced while locked).
   */
  public async performColdResync(
    serverUrl: string,
    machineId: string,
    deviceNumber: number,
    onProgress: (progress: ColdResyncProgress) => void
  ): Promise<IpcResult> {
    try {
      // DB (0-40%)
      const dbResult = await this.syncDatabase(serverUrl, machineId, deviceNumber, (msg, pct) => {
        const mappedPct = Math.round(pct * 0.4);
        onProgress({ phase: pct < 70 ? 'db_download' : 'db_extract', statusMessage: msg, progressPercent: mappedPct });
      });
      if (!dbResult.success) {
        onProgress({ phase: 'error', statusMessage: dbResult.error || 'Database sync failed', progressPercent: 0, error: dbResult.error });
        return dbResult;
      }

      // Files (40-95%)
      const filesResult = await this.syncFiles(serverUrl, machineId, deviceNumber, (msg, pct) => {
        const mappedPct = 40 + Math.round(pct * 0.55);
        onProgress({ phase: pct < 5 ? 'file_manifest' : 'file_download', statusMessage: msg, progressPercent: mappedPct, });
      });
      if (!filesResult.success) {
        onProgress({ phase: 'error', statusMessage: filesResult.error || 'Files sync failed', progressPercent: 0, error: filesResult.error });
        return filesResult;
      }

      onProgress({ phase: 'done', statusMessage: 'Cold resync complete', progressPercent: 100 });
      return { success: true };
    } catch (err: any) {
      const error = err.message || 'Unknown error during cold resync';
      onProgress({ phase: 'error', statusMessage: error, progressPercent: 0, error });
      return { success: false, error };
    }
  }

  private ensureDirectories(): void {
    if (!fs.existsSync(this.dbDir)) {
      fs.mkdirSync(this.dbDir, { recursive: true });
    }
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Extract the .mv.db file from the H2 backup ZIP.
   * H2's BACKUP TO creates a standard ZIP with the database file inside.
   * Uses extractEntryTo instead of getData() to avoid loading the entire DB into memory.
   */
  private async extractDatabase(zipPath: string): Promise<void> {
    // Remove existing db file if present (extract won't overwrite).
    if (fs.existsSync(this.dbPath)) {
      await fs.promises.unlink(this.dbPath);
    }

    // Decompress OFF the main thread — adm-zip's extractEntryTo is synchronous and would freeze the Electron
    // UI on a large DB. The worker runs the SAME adm-zip extract in a separate thread. If the worker can't
    // run (packaging edge case), fall back to the in-process extract so the update still completes.
    try {
      await this.extractInWorker(zipPath, `${this.dbName}.mv.db`);
    } catch (e: any) {
      console.warn(`cold-resync: threaded extract unavailable (${e?.message || e}) — falling back to in-process extract`);
      this.extractDatabaseSync(zipPath);
    }

    // Verify extraction succeeded
    if (!fs.existsSync(this.dbPath)) {
      throw new Error(`Database extraction failed — ${this.dbPath} not found after extraction`);
    }
    const stat = fs.statSync(this.dbPath);
    if (stat.size < 1024) {
      throw new Error(`Database file suspiciously small: ${stat.size} bytes`);
    }
    console.log(`Extracted DB -> ${this.dbPath} (${(stat.size / 1024 / 1024).toFixed(1)} MB on disk)`);
  }

  /** Original synchronous extract — the fallback if the worker thread can't run. */
  private extractDatabaseSync(zipPath: string): void {
    const zip = new AdmZip(zipPath);
    const dbEntry = zip.getEntries().find(e => e.entryName.endsWith('.mv.db'));
    if (!dbEntry) {
      throw new Error(`No .mv.db file found in H2 backup ZIP: ${zipPath}`);
    }
    zip.extractEntryTo(dbEntry, this.dbDir, false, true, false, `${this.dbName}.mv.db`);
  }

  /** Run the adm-zip extract in a worker thread so the decompression doesn't block the UI thread. */
  private extractInWorker(zipPath: string, outName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Worker } = require('worker_threads');
      const worker = new Worker(path.join(__dirname, 'unzip-worker.js'),
        { workerData: { zipPath, destDir: this.dbDir, outName } });
      let settled = false;
      const done = (err?: Error) => { if (settled) return; settled = true; err ? reject(err) : resolve(); };
      worker.on('message', (m: any) => (m && m.ok) ? done() : done(new Error((m && m.error) || 'unzip worker failed')));
      worker.on('error', (e: any) => done(e instanceof Error ? e : new Error(String(e))));
      worker.on('exit', (code: number) => { if (code !== 0) done(new Error(`unzip worker exited with code ${code}`)); });
    });
  }

  /** Recursively calculate directory size */
  private getDirSize(dirPath: string): number {
    let total = 0;
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          total += this.getDirSize(fullPath);
        } else if (entry.isFile()) {
          total += fs.statSync(fullPath).size;
        }
      }
    } catch { /* ignore permission errors */ }
    return total;
  }

  /** Stream-download a file from a URL to disk */
  // Resolves with the X-Sync-Cutoff response header (present on the h2-backup download) so the caller can
  // do a BOUNDED mark-synced after the swap; undefined for downloads that don't carry it (files, etc.).
  private downloadFile(
    urlStr: string,
    destPath: string,
    extraHeaders: Record<string, string>,
    onProgress?: (bytesDownloaded: number, totalBytes: number) => void
  ): Promise<string | undefined> {
    return new Promise((resolve, reject) => {
      try {
        const endpoint = new URL(urlStr);
        const req = http.request(
          {
            hostname: endpoint.hostname,
            port: endpoint.port || 80,
            path: endpoint.pathname + (endpoint.search || ''),
            method: 'GET',
            timeout: 300000, // 5 min per file
            headers: { ...extraHeaders }
          },
          (res) => {
            if (res.statusCode !== 200) {
              // Consume response body for diagnostic info
              let errorBody = '';
              res.on('data', (c: Buffer) => { errorBody += c.toString(); });
              res.on('end', () => {
                reject(new Error(`HTTP ${res.statusCode} from ${urlStr}: ${errorBody.substring(0, 200)}`));
              });
              return;
            }

            const hdr = res.headers['x-sync-cutoff'];
            const syncCutoff = typeof hdr === 'string' ? hdr : undefined;
            const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
            const writeStream = fs.createWriteStream(destPath);
            let bytesDownloaded = 0;

            res.on('data', (chunk: Buffer) => {
              bytesDownloaded += chunk.length;
              onProgress?.(bytesDownloaded, totalBytes);
            });

            res.pipe(writeStream);

            writeStream.on('finish', () => {
              writeStream.close();
              resolve(syncCutoff);
            });

            writeStream.on('error', (err) => {
              try { fs.unlinkSync(destPath); } catch { /* ignore */ }
              reject(err);
            });
          }
        );

        req.on('error', (err) => {
          try { fs.unlinkSync(destPath); } catch { /* ignore */ }
          reject(err);
        });

        req.on('timeout', () => {
          req.destroy();
          try { fs.unlinkSync(destPath); } catch { /* ignore */ }
          reject(new Error(`Download timed out: ${urlStr}`));
        });

        req.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  /** HTTP GET that returns parsed JSON */
  private httpGetJson<T>(urlStr: string, extraHeaders: Record<string, string>): Promise<T> {
    return new Promise((resolve, reject) => {
      try {
        const endpoint = new URL(urlStr);
        const req = http.request(
          {
            hostname: endpoint.hostname,
            port: endpoint.port || 80,
            path: endpoint.pathname + (endpoint.search || ''),
            method: 'GET',
            timeout: 300000, // 5 min — same as file downloads
            headers: { ...extraHeaders }
          },
          (res) => {
            let body = '';
            res.on('data', (chunk: Buffer) => { body += chunk.toString(); });
            res.on('end', () => {
              if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                try {
                  resolve(JSON.parse(body));
                } catch {
                  reject(new Error('Invalid JSON response'));
                }
              } else {
                reject(new Error(`HTTP ${res.statusCode}: ${body.substring(0, 200)}`));
              }
            });
          }
        );

        req.on('error', (err) => reject(err));
        req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
        req.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  /** Write sync-status.json to mark successful cold resync */
  private persistSyncStatus(): void {
    const statusPath = path.join(this.workingDir, SYNC_STATUS_FILE);
    const status = {
      lastSyncTime: new Date().toISOString(),
      lastSyncType: 'full'
    };
    try {
      fs.writeFileSync(statusPath, JSON.stringify(status, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing sync-status.json:', err);
    }

    // Clean auto-resync state so Spring Boot doesn't carry stale escalation state
    this.cleanAutoResyncState();
  }

  /** Remove auto-resync-state.json so auto-resync starts fresh after cold resync */
  private cleanAutoResyncState(): void {
    const statePath = path.join(this.workingDir, 'auto-resync-state.json');
    try {
      if (fs.existsSync(statePath)) {
        fs.unlinkSync(statePath);
        console.log('Cleaned auto-resync-state.json after cold resync');
      }
    } catch { /* ignore */ }
  }
}
