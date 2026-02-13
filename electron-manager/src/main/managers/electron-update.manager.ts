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
   * Apply the staged update by writing batch/PS scripts and launching them.
   * Three scripts are generated:
   *   1. update.cmd         — main orchestrator (waits for PID, calls extract, handles elevation, relaunches)
   *   2. update-extract.cmd — just the extraction + success marker (can run normal or elevated)
   *   3. update-elevate.ps1 — re-launches update-extract.cmd with admin privileges (UAC)
   *
   * Returns success — the caller must then stop Spring Boot and call app.exit().
   */
  public applyUpdate(): IpcResult {
    const zipPath = this.getStagedZipPath();
    if (!zipPath) {
      return { success: false, error: 'No staged update found' };
    }

    const exePath = app.getPath('exe');
    const installDir = path.dirname(exePath);
    const electronPid = process.pid;

    const cmdPath = path.join(this.stagingDir, 'update.cmd');
    const extractCmdPath = path.join(this.stagingDir, 'update-extract.cmd');
    const elevatePsPath = path.join(this.stagingDir, 'update-elevate.ps1');
    const markerPath = path.join(this.stagingDir, '.update-ok');
    const stagingVersionPath = path.join(this.stagingDir, 'electron-version.json');
    const logFile = path.join(this.stagingDir, 'update.log');

    // Escape single quotes for PowerShell string literals
    const psZipPath = zipPath.replace(/'/g, "''");
    const psInstallDir = installDir.replace(/'/g, "''");

    // --- Script 1: update-extract.cmd ---
    // Does only the extraction + writes a marker file on success.
    // Can be run as current user or elevated via UAC.
    const extractScript = `@echo off
echo Extracting update to: "${installDir}"
powershell -NoProfile -Command "Expand-Archive -Path '${psZipPath}' -DestinationPath '${psInstallDir}' -Force"
if not errorlevel 1 (
    echo OK > "${markerPath}"
    echo Extraction successful.
) else (
    echo Extraction FAILED.
)
exit /b %errorlevel%
`;

    // --- Script 2: update-elevate.ps1 ---
    // Runs update-extract.cmd with admin privileges (triggers UAC prompt).
    const elevateScript = `param([string]$ScriptPath)
Start-Process -FilePath 'cmd.exe' -ArgumentList "/c \`"$ScriptPath\`"" -Verb RunAs -Wait
`;

    // --- Script 3: update.cmd (main orchestrator) ---
    const mainScript = `@echo off
setlocal enabledelayedexpansion
title DK Power Manager - Updating...

set "LOGFILE=${logFile}"
set "EXTRACT_CMD=${extractCmdPath}"
set "ELEVATE_PS=${elevatePsPath}"
set "MARKER=${markerPath}"

echo ============================================ >> "%LOGFILE%"
echo [%date% %time%] Update script started >> "%LOGFILE%"
echo [%date% %time%] PID: ${electronPid} >> "%LOGFILE%"
echo [%date% %time%] ZIP: ${zipPath} >> "%LOGFILE%"
echo [%date% %time%] Install: ${installDir} >> "%LOGFILE%"

echo Waiting for DK Power Manager to exit...

set /a WAIT_COUNT=0
:WAIT_LOOP
tasklist /fi "PID eq ${electronPid}" 2>nul | find "${electronPid}" >nul
if not errorlevel 1 (
    set /a WAIT_COUNT+=1
    if !WAIT_COUNT! GEQ 60 (
        echo [%date% %time%] WARNING: Timeout waiting for PID ${electronPid} >> "%LOGFILE%"
        echo WARNING: Timed out waiting for app to exit. Proceeding...
        goto EXTRACT
    )
    timeout /t 1 /nobreak >nul
    goto WAIT_LOOP
)
echo [%date% %time%] Process exited >> "%LOGFILE%"

:EXTRACT
REM Extra wait for file handles to release
timeout /t 2 /nobreak >nul

REM Verify ZIP still exists
if not exist "${zipPath}" (
    echo [%date% %time%] ERROR: ZIP not found >> "%LOGFILE%"
    echo.
    echo ERROR: Update ZIP not found at:
    echo   ${zipPath}
    echo.
    echo It may have been deleted during app shutdown.
    echo Log: "%LOGFILE%"
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

echo Extracting update...
echo [%date% %time%] Attempting extraction >> "%LOGFILE%"

REM Delete old marker if present
if exist "%MARKER%" del "%MARKER%" 2>nul

REM Try extraction as current user
call "%EXTRACT_CMD%" >> "%LOGFILE%" 2>&1

if exist "%MARKER%" (
    echo [%date% %time%] Extraction succeeded >> "%LOGFILE%"
    goto EXTRACTION_OK
)

REM Standard extraction failed - try with elevation (UAC)
echo [%date% %time%] Standard extraction failed, requesting elevation >> "%LOGFILE%"
echo.
echo Extraction failed (likely permissions).
echo Requesting admin privileges - please click Yes on the UAC prompt...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%ELEVATE_PS%" -ScriptPath "%EXTRACT_CMD%" >> "%LOGFILE%" 2>&1

if exist "%MARKER%" (
    echo [%date% %time%] Elevated extraction succeeded >> "%LOGFILE%"
    goto EXTRACTION_OK
)

REM Both attempts failed
echo [%date% %time%] ERROR: All extraction attempts failed >> "%LOGFILE%"
echo.
echo ERROR: Update extraction failed.
echo.
echo The update ZIP is preserved. You can retry by clicking
echo "Apply Update" again from the Sync ^& Updates page.
echo.
echo Log: "%LOGFILE%"
echo.
echo Press any key to exit...
pause >nul
exit /b 1

:EXTRACTION_OK
del "%MARKER%" 2>nul
echo [%date% %time%] Extraction complete >> "%LOGFILE%"

REM Copy version tracking file
if exist "${stagingVersionPath}" (
    copy /y "${stagingVersionPath}" "${this.versionFilePath}" >nul
    echo [%date% %time%] Version file copied >> "%LOGFILE%"
)

REM Cleanup staging directory
echo Cleaning up...
rmdir /s /q "${this.stagingDir}" 2>nul

echo.
echo Update applied successfully!
echo Relaunching DK Power Manager...
echo [%date% %time%] Relaunching >> "%LOGFILE%"
timeout /t 2 /nobreak >nul
start "" "${exePath}"

exit /b 0
`;

    try {
      // Write all scripts to staging
      fs.writeFileSync(extractCmdPath, extractScript, { encoding: 'utf8' });
      fs.writeFileSync(elevatePsPath, elevateScript, { encoding: 'utf8' });
      fs.writeFileSync(cmdPath, mainScript, { encoding: 'utf8' });

      // Launch detached with proper quoting for paths with spaces.
      // windowsVerbatimArguments prevents Node from re-escaping our quotes.
      const child = spawn('cmd.exe', ['/c', `"${cmdPath}"`], {
        detached: true,
        stdio: 'ignore',
        windowsHide: false,
        windowsVerbatimArguments: true
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

  /**
   * Clean up staging directory on startup.
   * Only fully removes staging if the update was successfully applied
   * (staging checksum matches working dir checksum). Otherwise, preserves
   * the staged ZIP so the user can retry without re-downloading.
   */
  public cleanupStaging(): void {
    if (!fs.existsSync(this.stagingDir)) return;

    const stagingVersionPath = path.join(this.stagingDir, 'electron-version.json');

    // If both version files exist and checksums match → update was applied → clean up
    if (fs.existsSync(stagingVersionPath) && fs.existsSync(this.versionFilePath)) {
      try {
        const staged: ElectronVersionRecord = JSON.parse(fs.readFileSync(stagingVersionPath, 'utf8'));
        const current: ElectronVersionRecord = JSON.parse(fs.readFileSync(this.versionFilePath, 'utf8'));
        if (staged.checksum === current.checksum) {
          fs.rmSync(this.stagingDir, { recursive: true, force: true });
          console.log('Cleaned up staging directory (update applied successfully)');
          return;
        }
      } catch { /* fall through to preserve staging */ }
    }

    // Update not yet applied — preserve ZIP for retry, clean up old scripts
    const filesToClean = ['update.cmd', 'update-extract.cmd', 'update-elevate.ps1', '.update-ok'];
    for (const file of filesToClean) {
      try {
        const fp = path.join(this.stagingDir, file);
        if (fs.existsSync(fp)) fs.unlinkSync(fp);
      } catch { /* ignore */ }
    }
    console.log('Staging preserved (update not yet applied); old scripts cleaned');
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
