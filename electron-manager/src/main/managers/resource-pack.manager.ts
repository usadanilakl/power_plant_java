/**
 * ResourcePackManager - Syncs resource pack directories that are still distributed
 * outside the managed file-sync pipeline, such as qa-data.
 * from the sync server. Uses manifest-based comparison to download only missing/changed files.
 *
 * Server endpoints (implemented in sync-server):
 *   GET /api/resource-packs/list                -> string[]
 *   GET /api/resource-packs/manifest/{name}     -> PackFileEntry[]
 *   GET /api/resource-packs/file/{name}/{path}  -> file stream
 */

import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import { IpcResult } from '../../shared/types';
import { getWorkingDir } from '../paths';

export interface PackFileEntry {
  relativePath: string;
  fileHash: string;
  fileSize: number;
  lastModified: string;
}

export interface ResourcePackStatus {
  name: string;
  localPresent: boolean;
  totalFiles: number;
  missingFiles: number;
  updatedFiles: number;
}

export class ResourcePackManager {
  private workingDir: string;

  constructor() {
    this.workingDir = getWorkingDir();
  }

  /**
   * Check for updates on all packs available from the server.
   * Compares server manifest with local files (existence + size).
   */
  public async checkForUpdates(
    serverUrl: string,
    headers: Record<string, string>
  ): Promise<ResourcePackStatus[]> {
    const packNames = await this.httpGetJson<string[]>(
      `${serverUrl}/api/resource-packs/list`, headers
    );

    if (!packNames || packNames.length === 0) return [];

    const statuses: ResourcePackStatus[] = [];
    for (const name of packNames) {
      try {
        const manifest = await this.httpGetJson<PackFileEntry[]>(
          `${serverUrl}/api/resource-packs/manifest/${encodeURIComponent(name)}`, headers
        );

        if (!manifest) {
          statuses.push({ name, localPresent: false, totalFiles: 0, missingFiles: 0, updatedFiles: 0 });
          continue;
        }

        const packDir = path.join(this.workingDir, name);
        const localPresent = fs.existsSync(packDir);
        let missingFiles = 0;
        let updatedFiles = 0;

        for (const entry of manifest) {
          const localPath = path.join(packDir, entry.relativePath);
          if (!fs.existsSync(localPath)) {
            missingFiles++;
          } else {
            const localSize = fs.statSync(localPath).size;
            if (localSize !== entry.fileSize) {
              updatedFiles++;
            }
          }
        }

        statuses.push({
          name,
          localPresent,
          totalFiles: manifest.length,
          missingFiles,
          updatedFiles
        });
      } catch (err: any) {
        console.warn(`Failed to check pack ${name}:`, err.message);
        statuses.push({ name, localPresent: fs.existsSync(path.join(this.workingDir, name)), totalFiles: 0, missingFiles: 0, updatedFiles: 0 });
      }
    }

    return statuses;
  }

  /**
   * Sync a single resource pack — downloads only missing/changed files.
   */
  public async syncPack(
    serverUrl: string,
    packName: string,
    headers: Record<string, string>,
    onProgress: (msg: string, pct: number) => void
  ): Promise<IpcResult> {
    try {
      onProgress(`Fetching ${packName} manifest...`, 0);
      const manifest = await this.httpGetJson<PackFileEntry[]>(
        `${serverUrl}/api/resource-packs/manifest/${encodeURIComponent(packName)}`, headers
      );

      if (!manifest || manifest.length === 0) {
        onProgress(`${packName}: no files on server`, 100);
        return { success: true };
      }

      const packDir = path.join(this.workingDir, packName);
      if (!fs.existsSync(packDir)) {
        fs.mkdirSync(packDir, { recursive: true });
      }

      let downloaded = 0;
      let skipped = 0;
      let failed = 0;
      const toDownload: PackFileEntry[] = [];

      // Determine which files need downloading
      for (const entry of manifest) {
        const localPath = path.join(packDir, entry.relativePath);
        if (fs.existsSync(localPath)) {
          const localSize = fs.statSync(localPath).size;
          if (localSize === entry.fileSize) {
            skipped++;
            continue;
          }
        }
        toDownload.push(entry);
      }

      if (toDownload.length === 0) {
        onProgress(`${packName}: up to date (${manifest.length} files)`, 100);
        return { success: true };
      }

      onProgress(`${packName}: downloading ${toDownload.length} files...`, 5);

      let processed = 0;
      for (const entry of toDownload) {
        processed++;
        const localPath = path.join(packDir, entry.relativePath);
        const localDir = path.dirname(localPath);
        if (!fs.existsSync(localDir)) {
          fs.mkdirSync(localDir, { recursive: true });
        }

        // Query-param endpoint (no file extension in the URL path) so IIS/ARR forwards it instead of its
        // static-file handler 401-ing an extension-bearing proxied URL under Windows Auth. Mirrors the
        // cold-resync file pull + FileDriftService.pull. A failed download is warned + counted, not
        // silently miscounted as a success (which previously let missing files masquerade as up-to-date).
        const encodedName = encodeURIComponent(packName);
        const encodedPath = encodeURIComponent(entry.relativePath);
        try {
          await this.downloadFile(
            `${serverUrl}/api/resource-packs/file-by-path?name=${encodedName}&path=${encodedPath}`,
            localPath, headers
          );
          downloaded++;
        } catch (err: any) {
          failed++;
          console.warn(`Failed to download ${packName}/${entry.relativePath}: ${err.message}`);
        }

        const pct = 5 + Math.round((processed / toDownload.length) * 95);
        onProgress(`${packName}: ${processed}/${toDownload.length} files`, pct);
      }

      console.log(`Resource pack ${packName}: ${downloaded} downloaded, ${skipped} skipped, ${failed} failed`);
      if (failed > 0) {
        console.warn(`Resource pack ${packName}: ${failed} file(s) could not be downloaded from the hub.`);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || `Failed to sync ${packName}` };
    }
  }

  /**
   * Sync all available resource packs from the server.
   */
  public async syncAllPacks(
    serverUrl: string,
    headers: Record<string, string>,
    onProgress: (msg: string, pct: number) => void
  ): Promise<IpcResult> {
    try {
      const packNames = await this.httpGetJson<string[]>(
        `${serverUrl}/api/resource-packs/list`, headers
      );

      if (!packNames || packNames.length === 0) {
        onProgress('No resource packs available', 100);
        return { success: true };
      }

      let completedPacks = 0;
      for (const name of packNames) {
        const packWeight = 100 / packNames.length;
        const basePercent = Math.round(completedPacks * packWeight);

        const result = await this.syncPack(serverUrl, name, headers, (msg, pct) => {
          const mappedPct = basePercent + Math.round((pct / 100) * packWeight);
          onProgress(msg, mappedPct);
        });

        if (!result.success) {
          console.warn(`Pack sync failed for ${name}: ${result.error}`);
        }
        completedPacks++;
      }

      onProgress('Resource packs synced', 100);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to sync resource packs' };
    }
  }

  /**
   * Quick local-only status check (no server contact).
   * Engraver templates are no longer synced as a resource pack; they now flow
   * through UI-managed metadata + managed file sync.
   */
  public getLocalStatus(): ResourcePackStatus[] {
    const knownPacks = ['qa-data'];
    return knownPacks.map(name => {
      const packDir = path.join(this.workingDir, name);
      const localPresent = fs.existsSync(packDir);
      let totalFiles = 0;

      if (localPresent) {
        totalFiles = this.countFiles(packDir);
      }

      return { name, localPresent, totalFiles, missingFiles: 0, updatedFiles: 0 };
    });
  }

  private countFiles(dirPath: string): number {
    let count = 0;
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue;
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          count += this.countFiles(fullPath);
        } else if (entry.isFile()) {
          count++;
        }
      }
    } catch { /* ignore */ }
    return count;
  }

  /** Stream-download a file from a URL to disk */
  private downloadFile(
    urlStr: string,
    destPath: string,
    extraHeaders: Record<string, string>
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
            timeout: 120000,
            headers: { ...extraHeaders }
          },
          (res) => {
            if (res.statusCode !== 200) {
              let errorBody = '';
              res.on('data', (c: Buffer) => { errorBody += c.toString(); });
              res.on('end', () => {
                reject(new Error(`HTTP ${res.statusCode} from ${urlStr}: ${errorBody.substring(0, 200)}`));
              });
              return;
            }

            const writeStream = fs.createWriteStream(destPath);
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
}
