/**
 * ElectronUpdateManager - Checks for, downloads, and applies Electron app updates from the sync server.
 * Downloads a ZIP to a staging directory, verifies integrity, then applies via an external batch
 * script (Windows locks running .exe/.dll files, so replacement happens after Electron exits).
 */

import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import * as crypto from 'crypto';
import { spawn } from 'child_process';
import { app } from 'electron';
import { ElectronUpdateInfo, ElectronUpdateProgress, IpcResult } from '../../shared/types';
import { DEFAULT_SYNC_SERVER } from '../constants';
import { getWorkingDir } from '../paths';

interface ElectronVersionRecord {
  checksum: string;
  fileName: string;
  appliedAt: string;
}

export class ElectronUpdateManager {
  private workingDir: string;
  private versionFilePath: string;
  private stagingDir: string;

  constructor() {
    this.workingDir = getWorkingDir();
    this.versionFilePath = path.join(this.workingDir, 'electron-version.json');
    this.stagingDir = path.join(this.workingDir, 'electron-update-staging');
  }

  /** Check the sync server for a newer Electron version */
  public async checkForUpdate(serverUrl?: string): Promise<IpcResult<ElectronUpdateInfo>> {
    const url = serverUrl || DEFAULT_SYNC_SERVER.url;

    return new Promise((resolve) => {
      try {
        const endpoint = new URL(`${url}/api/electron-update/check`);
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
                const localChecksum = this.getLocalChecksum();
                const isNewer = localChecksum !== serverInfo.checksum;

                const info: ElectronUpdateInfo = {
                  fileName: serverInfo.fileName,
                  fileSize: serverInfo.fileSize,
                  checksum: serverInfo.checksum,
                  lastModified: serverInfo.lastModified,
                  isNewer
                };

                console.log(`Electron update check: server=${serverInfo.checksum?.substring(0, 12)}... local=${localChecksum?.substring(0, 12) || 'none'}... newer=${isNewer}`);
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
          resolve({ success: false, error: 'Electron update check timed out' });
        });

        req.end();
      } catch (err: any) {
        resolve({ success: false, error: err.message });
      }
    });
  }

  /** Download the Electron update ZIP to staging with progress reporting */
  public async downloadUpdate(
    serverUrl?: string,
    onProgress?: (progress: ElectronUpdateProgress) => void
  ): Promise<IpcResult> {
    const url = serverUrl || DEFAULT_SYNC_SERVER.url;

    // Phase: checking
    onProgress?.({ phase: 'checking' });

    const checkResult = await this.checkForUpdate(url);
    if (!checkResult.success) {
      const err = checkResult.error || 'Update check failed';
      onProgress?.({ phase: 'error', error: err });
      return { success: false, error: err };
    }
    if (!checkResult.data?.isNewer) {
      onProgress?.({ phase: 'staged' });
      return { success: true }; // Already up to date
    }

    const expectedChecksum = checkResult.data.checksum;
    const totalBytes = checkResult.data.fileSize;
    const fileName = checkResult.data.fileName;

    // Ensure staging directory exists
    if (!fs.existsSync(this.stagingDir)) {
      fs.mkdirSync(this.stagingDir, { recursive: true });
    }

    const tmpPath = path.join(this.stagingDir, fileName + '.tmp');
    const finalPath = path.join(this.stagingDir, fileName);

    // Phase: downloading
    onProgress?.({ phase: 'downloading', bytesDownloaded: 0, totalBytes, percent: 0 });

    return new Promise((resolve) => {
      try {
        const endpoint = new URL(`${url}/api/electron-update/download`);
        const req = http.request(
          {
            hostname: endpoint.hostname,
            port: endpoint.port || 80,
            path: endpoint.pathname,
            method: 'GET',
            timeout: 600000 // 10 min timeout for large ZIP
          },
          (res) => {
            if (res.statusCode !== 200) {
              const err = `Download failed: HTTP ${res.statusCode}`;
              onProgress?.({ phase: 'error', error: err });
              resolve({ success: false, error: err });
              return;
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
                try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }
                const err = `Checksum mismatch: expected ${expectedChecksum.substring(0, 12)}... got ${downloadedChecksum.substring(0, 12)}...`;
                onProgress?.({ phase: 'error', error: err });
                resolve({ success: false, error: err });
                return;
              }

              // Move tmp to final name
              try {
                if (fs.existsSync(finalPath)) {
                  fs.unlinkSync(finalPath);
                }
                fs.renameSync(tmpPath, finalPath);

                // Write version record to staging (batch script copies it to working dir after extraction)
                const versionRecord: ElectronVersionRecord = {
                  checksum: expectedChecksum,
                  fileName,
                  appliedAt: new Date().toISOString()
                };
                fs.writeFileSync(
                  path.join(this.stagingDir, 'electron-version.json'),
                  JSON.stringify(versionRecord, null, 2)
                );

                console.log(`Electron update staged successfully: ${fileName}`);
                onProgress?.({ phase: 'staged' });
                resolve({ success: true });
              } catch (err: any) {
                onProgress?.({ phase: 'error', error: err.message });
                resolve({ success: false, error: `Failed to stage update: ${err.message}` });
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

  /**
   * Apply the staged update by writing an update.cmd batch script and launching it.
   * The batch script waits for this Electron process to exit, extracts the ZIP over
   * the install directory, copies electron-version.json, and relaunches the app.
   * Returns success — the caller must then stop Spring Boot and call app.exit().
   */
  public applyUpdate(): IpcResult {
    const zipPath = this.getStagedZipPath();
    if (!zipPath) {
      return { success: false, error: 'No staged update found' };
    }

    const exePath = app.getPath('exe');
    const installDir = path.dirname(exePath);
    const exeName = path.basename(exePath);
    const cmdPath = path.join(this.stagingDir, 'update.cmd');

    // Write the batch script
    const script = `@echo off
setlocal enabledelayedexpansion
title DK Power Manager - Updating...

echo Waiting for DK Power Manager to exit...
:WAIT_LOOP
tasklist /fi "IMAGENAME eq ${exeName}" 2>nul | find /i "${exeName}" >nul
if not errorlevel 1 (
    timeout /t 1 /nobreak >nul
    goto WAIT_LOOP
)

REM Extra wait for file handles to release
timeout /t 2 /nobreak >nul

echo Extracting update...
powershell -NoProfile -Command "Expand-Archive -Path '${zipPath.replace(/'/g, "''")}' -DestinationPath '${installDir.replace(/'/g, "''")}' -Force"

if errorlevel 1 (
    echo ERROR: Failed to extract update. The application may need manual repair.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

REM Copy version tracking file
if exist "${path.join(this.stagingDir, 'electron-version.json').replace(/'/g, "''")}" (
    copy /y "${path.join(this.stagingDir, 'electron-version.json')}" "${path.join(this.workingDir, 'electron-version.json')}" >nul
)

REM Cleanup staging directory
echo Cleaning up...
rmdir /s /q "${this.stagingDir}" 2>nul

echo Update applied successfully. Relaunching...
start "" "${exePath}"

exit /b 0
`;

    try {
      fs.writeFileSync(cmdPath, script, { encoding: 'utf8' });

      // Launch the batch script detached
      const child = spawn('cmd.exe', ['/c', cmdPath], {
        detached: true,
        stdio: 'ignore',
        windowsHide: false // Show the update window so user sees progress
      });
      child.unref();

      console.log('Update batch script launched, app will exit shortly');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: `Failed to launch update script: ${err.message}` };
    }
  }

  /** Check if a verified ZIP is staged and ready to apply */
  public isUpdateStaged(): boolean {
    return this.getStagedZipPath() !== null;
  }

  /** Get the local checksum from electron-version.json */
  public getLocalChecksum(): string {
    try {
      if (fs.existsSync(this.versionFilePath)) {
        const record: ElectronVersionRecord = JSON.parse(
          fs.readFileSync(this.versionFilePath, 'utf8')
        );
        return record.checksum || '';
      }
    } catch {
      // Corrupted or missing — treat as no version
    }
    return '';
  }

  /** Clean up staging directory (call on startup) */
  public cleanupStaging(): void {
    if (fs.existsSync(this.stagingDir)) {
      try {
        fs.rmSync(this.stagingDir, { recursive: true, force: true });
        console.log('Cleaned up electron update staging directory');
      } catch (err) {
        console.warn('Failed to clean up staging directory:', err);
      }
    }
  }

  /** Find the staged ZIP file path, or null if none */
  private getStagedZipPath(): string | null {
    if (!fs.existsSync(this.stagingDir)) return null;

    try {
      const files = fs.readdirSync(this.stagingDir);
      const zip = files.find(f => f.endsWith('.zip'));
      if (zip) {
        return path.join(this.stagingDir, zip);
      }
    } catch { /* ignore */ }
    return null;
  }

  /** Compute SHA-256 checksum of a file */
  private computeFileChecksum(filePath: string): string {
    const hash = crypto.createHash('sha256');
    const data = fs.readFileSync(filePath);
    hash.update(data);
    return hash.digest('hex');
  }
}
