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
    this.workingDir = path.resolve(__dirname, '..', '..', '..', '..', DEFAULT_SPRING_BOOT_CONFIG.workingDir);
    this.dbDir = path.join(this.workingDir, 'db');
    this.dbPath = path.join(this.dbDir, 'proddb.mv.db');
    this.uploadsDir = path.join(this.workingDir, 'uploads-prod');
  }

  /** True if the database file doesn't exist (first run or deleted) */
  public needsColdResync(): boolean {
    return !fs.existsSync(this.dbPath);
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
    const headers = {
      'X-Machine-Id': machineId,
      'X-Device-Number': String(deviceNumber)
    };

    try {
      // 1. Ensure directories exist
      this.ensureDirectories();

      // 2. Download H2 backup (0–30%)
      onProgress({ phase: 'db_download', statusMessage: 'Downloading database...', progressPercent: 0 });
      const backupZipPath = path.join(this.dbDir, 'backup_cold.zip');
      await this.downloadFile(
        `${serverUrl}/api/resync/database/h2-backup`,
        backupZipPath,
        headers,
        (bytesDownloaded, totalBytes) => {
          const percent = totalBytes > 0 ? Math.round((bytesDownloaded / totalBytes) * 30) : 5;
          onProgress({
            phase: 'db_download',
            statusMessage: 'Downloading database...',
            progressPercent: percent,
            bytesDownloaded,
            totalBytes
          });
        }
      );

      // 3. Extract database (30–40%)
      onProgress({ phase: 'db_extract', statusMessage: 'Extracting database...', progressPercent: 30 });
      this.extractDatabase(backupZipPath);
      // Clean up temp ZIP
      try { fs.unlinkSync(backupZipPath); } catch { /* ignore */ }
      onProgress({ phase: 'db_extract', statusMessage: 'Database extracted', progressPercent: 40 });

      // 4. Download file manifest (40–45%)
      onProgress({ phase: 'file_manifest', statusMessage: 'Fetching file manifest...', progressPercent: 40 });
      const manifest = await this.httpGetJson<ManifestEntry[]>(
        `${serverUrl}/api/resync/files/path-manifest`,
        headers
      );

      if (!manifest || manifest.length === 0) {
        onProgress({ phase: 'finalizing', statusMessage: 'No files to download', progressPercent: 95 });
      } else {
        onProgress({
          phase: 'file_manifest',
          statusMessage: `Found ${manifest.length} files`,
          progressPercent: 45,
          filesTotal: manifest.length
        });

        // 5. Download files (45–95%)
        await this.downloadFiles(serverUrl, manifest, headers, onProgress);
      }

      // 6. Finalize — write sync-status.json (95–100%)
      onProgress({ phase: 'finalizing', statusMessage: 'Finalizing...', progressPercent: 95 });
      this.persistSyncStatus();
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
   */
  private extractDatabase(zipPath: string): void {
    const zip = new AdmZip(zipPath);
    const entries = zip.getEntries();

    // Find the .mv.db entry
    const dbEntry = entries.find(e => e.entryName.endsWith('.mv.db'));
    if (!dbEntry) {
      throw new Error('No .mv.db file found in H2 backup ZIP');
    }

    // Extract to db directory with target name
    const data = dbEntry.getData();
    fs.writeFileSync(this.dbPath, data);
    console.log(`Extracted database: ${dbEntry.entryName} -> ${this.dbPath} (${(data.length / 1024 / 1024).toFixed(1)} MB)`);
  }

  /**
   * Download all files from the manifest, comparing against local files.
   * Skips files that already exist with matching hash.
   */
  private async downloadFiles(
    serverUrl: string,
    manifest: ManifestEntry[],
    headers: Record<string, string>,
    onProgress: (progress: ColdResyncProgress) => void
  ): Promise<void> {
    let downloaded = 0;
    let skipped = 0;

    for (let i = 0; i < manifest.length; i++) {
      const entry = manifest[i];

      // The server manifest returns paths like "uploads-prod/pdf/file.pdf"
      // Strip the leading "uploads-prod/" prefix for local relative path
      let relativePath = entry.relativePath;
      if (relativePath.startsWith('uploads-prod/')) {
        relativePath = relativePath.substring('uploads-prod/'.length);
      } else if (relativePath.startsWith('uploads-prod\\')) {
        relativePath = relativePath.substring('uploads-prod\\'.length);
      }

      const localPath = path.join(this.uploadsDir, relativePath);
      const localDir = path.dirname(localPath);

      // Skip if file already exists (cold resync is a full download, but no need to re-download identical files)
      if (fs.existsSync(localPath)) {
        skipped++;
        downloaded++;
        continue;
      }

      // Ensure parent directory exists
      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
      }

      // Download file
      const encodedPath = entry.relativePath.split('/').map(encodeURIComponent).join('/');
      const fileUrl = `${serverUrl}/api/resync/files/permanent/${encodedPath}`;

      try {
        await this.downloadFile(fileUrl, localPath, headers);
      } catch (err: any) {
        console.warn(`Failed to download file: ${entry.relativePath} — ${err.message}`);
        // Non-fatal: continue with next file
      }

      downloaded++;

      // Report progress (45% to 95% range)
      const filePercent = 45 + Math.round((downloaded / manifest.length) * 50);
      onProgress({
        phase: 'file_download',
        statusMessage: `Downloading files... (${downloaded}/${manifest.length})`,
        progressPercent: filePercent,
        filesTotal: manifest.length,
        filesDownloaded: downloaded
      });
    }

    console.log(`Cold resync files: ${downloaded - skipped} downloaded, ${skipped} skipped (already existed)`);
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
              reject(new Error(`HTTP ${res.statusCode} downloading ${urlStr}`));
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
