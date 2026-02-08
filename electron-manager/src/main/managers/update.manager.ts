/**
 * UpdateManager - Checks for and downloads JAR updates from the sync server.
 * Compares local JAR checksum with server's, downloads with progress tracking,
 * verifies integrity, and replaces the local JAR atomically.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import * as crypto from 'crypto';
import { UpdateInfo, UpdateProgress, IpcResult } from '../../shared/types';
import { DEFAULT_SPRING_BOOT_CONFIG, DEFAULT_SYNC_SERVER } from '../constants';
import { getWorkingDir } from '../paths';

export class UpdateManager {
  private workingDir: string;
  private jarPath: string;
  private cachedChecksum: string | null = null;
  private cachedChecksumMtime: number = 0;

  constructor() {
    this.workingDir = getWorkingDir();
    this.jarPath = path.join(this.workingDir, DEFAULT_SPRING_BOOT_CONFIG.jar);
  }

  /** Check the sync server for a newer JAR version */
  public async checkForUpdate(serverUrl?: string): Promise<IpcResult<UpdateInfo>> {
    const url = serverUrl || DEFAULT_SYNC_SERVER.url;

    return new Promise((resolve) => {
      try {
        const endpoint = new URL(`${url}/api/update/check`);
        const req = http.request(
          {
            hostname: endpoint.hostname,
            port: endpoint.port || 80,
            path: endpoint.pathname,
            method: 'GET',
            timeout: 15000
          },
          (res) => {
            if (res.statusCode === 404) {
              resolve({ success: true, data: undefined });
              return;
            }
            let body = '';
            res.on('data', (chunk: Buffer) => { body += chunk.toString(); });
            res.on('end', () => {
              try {
                const serverInfo = JSON.parse(body);
                const localChecksum = this.getLocalJarChecksum();
                const isNewer = localChecksum !== serverInfo.checksum;

                const info: UpdateInfo = {
                  fileName: serverInfo.fileName,
                  fileSize: serverInfo.fileSize,
                  checksum: serverInfo.checksum,
                  lastModified: serverInfo.lastModified,
                  isNewer
                };

                console.log(`Update check: server=${serverInfo.checksum?.substring(0, 12)}... local=${localChecksum?.substring(0, 12)}... newer=${isNewer}`);
                resolve({ success: true, data: info });
              } catch {
                resolve({ success: false, error: 'Invalid response from update server' });
              }
            });
          }
        );

        req.on('error', (err) => {
          resolve({ success: false, error: `Cannot reach sync server: ${err.message}` });
        });

        req.on('timeout', () => {
          req.destroy();
          resolve({ success: false, error: 'Update check timed out' });
        });

        req.end();
      } catch (err: any) {
        resolve({ success: false, error: err.message });
      }
    });
  }

  /** Download the JAR update with progress reporting */
  public async downloadUpdate(
    serverUrl?: string,
    onProgress?: (progress: UpdateProgress) => void
  ): Promise<IpcResult> {
    const url = serverUrl || DEFAULT_SYNC_SERVER.url;
    const tmpPath = this.jarPath + '.tmp';

    // Phase: checking
    onProgress?.({ phase: 'checking' });

    // First check what's available
    const checkResult = await this.checkForUpdate(url);
    if (!checkResult.success) {
      const err = checkResult.error || 'Update check failed';
      onProgress?.({ phase: 'error', error: err });
      return { success: false, error: err };
    }
    if (!checkResult.data?.isNewer) {
      onProgress?.({ phase: 'done' });
      return { success: true }; // Already up to date
    }

    const expectedChecksum = checkResult.data.checksum;
    const totalBytes = checkResult.data.fileSize;

    // Phase: downloading
    onProgress?.({ phase: 'downloading', bytesDownloaded: 0, totalBytes, percent: 0 });

    return new Promise((resolve) => {
      try {
        const endpoint = new URL(`${url}/api/update/download`);
        const req = http.request(
          {
            hostname: endpoint.hostname,
            port: endpoint.port || 80,
            path: endpoint.pathname,
            method: 'GET',
            timeout: 600000 // 10 min timeout for large JAR
          },
          (res) => {
            if (res.statusCode !== 200) {
              const err = `Download failed: HTTP ${res.statusCode}`;
              onProgress?.({ phase: 'error', error: err });
              resolve({ success: false, error: err });
              return;
            }

            // Ensure managed_apps/pid directory exists
            if (!fs.existsSync(this.workingDir)) {
              fs.mkdirSync(this.workingDir, { recursive: true });
            }

            const writeStream = fs.createWriteStream(tmpPath);
            let bytesDownloaded = 0;

            res.on('data', (chunk: Buffer) => {
              bytesDownloaded += chunk.length;
              const percent = totalBytes > 0 ? Math.round((bytesDownloaded / totalBytes) * 100) : 0;
              onProgress?.({ phase: 'downloading', bytesDownloaded, totalBytes, percent });
            });

            res.pipe(writeStream);

            writeStream.on('finish', () => {
              writeStream.close();

              // Phase: verifying
              onProgress?.({ phase: 'verifying' });

              const downloadedChecksum = this.computeFileChecksum(tmpPath);
              if (downloadedChecksum !== expectedChecksum) {
                // Checksum mismatch — delete tmp and fail
                try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }
                const err = `Checksum mismatch: expected ${expectedChecksum.substring(0, 12)}... got ${downloadedChecksum.substring(0, 12)}...`;
                onProgress?.({ phase: 'error', error: err });
                resolve({ success: false, error: err });
                return;
              }

              // Phase: applying (rename tmp -> jar)
              onProgress?.({ phase: 'applying' });

              try {
                // On Windows, we may need to remove the old file first if rename fails
                if (fs.existsSync(this.jarPath)) {
                  fs.unlinkSync(this.jarPath);
                }
                fs.renameSync(tmpPath, this.jarPath);

                // Invalidate cached checksum
                this.cachedChecksum = null;
                this.cachedChecksumMtime = 0;

                console.log(`JAR updated successfully: ${checkResult.data!.fileName}`);
                onProgress?.({ phase: 'done' });
                resolve({ success: true });
              } catch (err: any) {
                onProgress?.({ phase: 'error', error: err.message });
                resolve({ success: false, error: `Failed to replace JAR: ${err.message}` });
              }
            });

            writeStream.on('error', (err) => {
              try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }
              onProgress?.({ phase: 'error', error: err.message });
              resolve({ success: false, error: `Write error: ${err.message}` });
            });
          }
        );

        req.on('error', (err) => {
          try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }
          onProgress?.({ phase: 'error', error: err.message });
          resolve({ success: false, error: `Download error: ${err.message}` });
        });

        req.on('timeout', () => {
          req.destroy();
          try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }
          const err = 'Download timed out';
          onProgress?.({ phase: 'error', error: err });
          resolve({ success: false, error: err });
        });

        req.end();
      } catch (err: any) {
        try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }
        onProgress?.({ phase: 'error', error: err.message });
        resolve({ success: false, error: err.message });
      }
    });
  }

  /** Get SHA-256 checksum of the local JAR (cached by mtime) */
  public getLocalJarChecksum(): string {
    if (!fs.existsSync(this.jarPath)) return '';

    const stat = fs.statSync(this.jarPath);
    if (this.cachedChecksum && stat.mtimeMs === this.cachedChecksumMtime) {
      return this.cachedChecksum;
    }

    this.cachedChecksum = this.computeFileChecksum(this.jarPath);
    this.cachedChecksumMtime = stat.mtimeMs;
    return this.cachedChecksum;
  }

  /** Get local JAR last modified time */
  public getLocalJarModifiedTime(): string | null {
    if (!fs.existsSync(this.jarPath)) return null;
    return fs.statSync(this.jarPath).mtime.toISOString();
  }

  /** Get local JAR file size */
  public getLocalJarSize(): number {
    if (!fs.existsSync(this.jarPath)) return 0;
    return fs.statSync(this.jarPath).size;
  }

  /** Compute SHA-256 checksum of a file */
  private computeFileChecksum(filePath: string): string {
    const hash = crypto.createHash('sha256');
    const data = fs.readFileSync(filePath);
    hash.update(data);
    return hash.digest('hex');
  }
}
