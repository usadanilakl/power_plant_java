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
import { DEFAULT_SPRING_BOOT_CONFIG } from '../constants';
import { getWorkingDir } from '../paths';

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

  constructor() {
    this.workingDir = getWorkingDir();
    this.dbDir = path.join(this.workingDir, 'db');
    this.dbPath = path.join(this.dbDir, 'proddb.mv.db');
    this.uploadsDir = path.join(this.workingDir, 'uploads-prod');
    console.log(`ColdResyncManager: workingDir=${this.workingDir} dbPath=${this.dbPath}`);
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
  ): Promise<IpcResult> {
    const headers = { 'X-Machine-Id': machineId, 'X-Device-Number': String(deviceNumber) };

    try {
      this.ensureDirectories();

      onProgress('Downloading database...', 0);
      const backupZipPath = path.join(this.dbDir, 'backup_cold.zip');
      await this.downloadFile(
        `${serverUrl}/api/resync/database/h2-backup`,
        backupZipPath,
        headers,
        (bytesDownloaded, totalBytes) => {
          const pct = totalBytes > 0 ? Math.round((bytesDownloaded / totalBytes) * 60) : 10;
          onProgress('Downloading database...', pct);
        }
      );

      const zipStat = fs.statSync(backupZipPath);
      console.log(`H2 backup ZIP downloaded: ${zipStat.size} bytes (${(zipStat.size / 1024 / 1024).toFixed(1)} MB)`);

      onProgress('Extracting database...', 70);
      this.extractDatabase(backupZipPath);
      try { fs.unlinkSync(backupZipPath); } catch { /* ignore */ }

      this.persistSyncStatus();
      onProgress('Database synced', 100);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Database sync failed' };
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
      for (const entry of manifest) {
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
          downloaded++;
          continue;
        }

        if (!fs.existsSync(localDir)) {
          fs.mkdirSync(localDir, { recursive: true });
        }

        const encodedPath = entry.relativePath.split('/').map(encodeURIComponent).join('/');
        try {
          await this.downloadFile(`${serverUrl}/api/resync/files/permanent/${encodedPath}`, localPath, headers);
        } catch (err: any) {
          console.warn(`Failed to download file: ${entry.relativePath} — ${err.message}`);
        }

        downloaded++;
        const pct = 5 + Math.round((downloaded / manifest.length) * 95);
        onProgress(`Downloading files... (${downloaded}/${manifest.length})`, pct);
      }

      console.log(`Files sync: ${downloaded - skipped} downloaded, ${skipped} skipped`);
      this.persistSyncStatus();
      onProgress('Files synced', 100);
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
  private extractDatabase(zipPath: string): void {
    const zip = new AdmZip(zipPath);
    const entries = zip.getEntries();

    console.log(`H2 backup ZIP entries: [${entries.map(e => `${e.entryName} (${e.header.size} bytes)`).join(', ')}]`);

    // Find the .mv.db entry
    const dbEntry = entries.find(e => e.entryName.endsWith('.mv.db'));
    if (!dbEntry) {
      throw new Error(`No .mv.db file found in H2 backup ZIP. Entries: ${entries.map(e => e.entryName).join(', ')}`);
    }

    // Remove existing db file if present (extractEntryTo won't overwrite by default)
    if (fs.existsSync(this.dbPath)) {
      fs.unlinkSync(this.dbPath);
    }

    // Extract using extractEntryTo — safer for large files than getData() which buffers everything
    zip.extractEntryTo(dbEntry, this.dbDir, false, true, false, 'proddb.mv.db');

    // Verify extraction succeeded
    if (!fs.existsSync(this.dbPath)) {
      throw new Error(`Database extraction failed — ${this.dbPath} not found after extraction`);
    }
    const stat = fs.statSync(this.dbPath);
    if (stat.size < 1024) {
      throw new Error(`Database file suspiciously small: ${stat.size} bytes`);
    }
    console.log(`Extracted: ${dbEntry.entryName} (${dbEntry.header.size} bytes in ZIP) -> ${this.dbPath} (${(stat.size / 1024 / 1024).toFixed(1)} MB on disk)`);
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
  private downloadFile(
    urlStr: string,
    destPath: string,
    extraHeaders: Record<string, string>,
    onProgress?: (bytesDownloaded: number, totalBytes: number) => void
  ): Promise<void> {
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
              resolve();
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
            timeout: 30000,
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
  }
}
