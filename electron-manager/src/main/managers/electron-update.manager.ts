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

    // Clear a stale staged build before downloading. Without this, a ZIP left by a failed apply
    // lingers: if the new build has a different filename getStagedZipPath() may pick the OLD one,
    // and applyUpdate() would then install the wrong version.
    if (this.getStagedZipPath() !== null && this.getStagedChecksum() !== expectedChecksum) {
      console.log('Discarding stale staged update before downloading the newer build');
      this.discardStaged();
    }

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

    // Extract-to-swap staging dirs. We never unzip over a live install:
    //   <install>.new  — fresh extract target (empty, so nothing can be locked)
    //   <install>.prev — the outgoing version, kept as the rollback copy
    const newDir = `${installDir}.new`;
    const prevDir = `${installDir}.prev`;
    const exeName = path.basename(exePath);

    // Escape single quotes for PowerShell string literals
    const psZipPath = zipPath.replace(/'/g, "''");
    const psNewDir = newDir.replace(/'/g, "''");

    // --- Script 1: update-extract.cmd ---
    // Extracts, verifies, and swaps. All three need the same filesystem rights, so they live in
    // the one script the orchestrator can re-run under UAC. The marker means "fully applied",
    // not "unzip returned".
    //
    // Why extract-to-swap rather than unzip-over-the-top:
    //   1. Expand-Archive raises a NON-TERMINATING error when it cannot replace a locked file and
    //      powershell.exe still exits 0 — so `if not errorlevel 1` reported success after a
    //      PARTIAL extraction. Harmless while every build shipped identical Electron binaries;
    //      fatal the first time a release changes them (mixed Chromium tree, app will not start).
    //   2. A fresh directory has nothing to lock, so extraction failures are real failures.
    //   3. Renaming the live install is itself the "did the app actually exit?" test — it fails
    //      loudly instead of silently writing over a running process.
    //   4. Overlay extraction never deletes files, so anything dropped from the distribution
    //      lingered in every field install forever. A swap leaves exactly the shipped tree.
    //
    // CRLF line endings are critical for CMD on Windows.
    const extractLines = [
      '@echo off',
      'REM Move our own cwd out of the install folder before touching it — a directory that is any',
      'REM process\'s current directory cannot be renamed on Windows. All paths below are absolute.',
      'cd /d "%SystemRoot%"',
      `echo Extracting update to: "${newDir}"`,
      '',
      'REM Start from a clean extract dir so a stale partial run cannot poison this one.',
      `if exist "${newDir}" rmdir /s /q "${newDir}"`,
      '',
      `powershell -NoProfile -Command "$ErrorActionPreference='Stop'; try { Expand-Archive -Path '${psZipPath}' -DestinationPath '${psNewDir}' -Force; exit 0 } catch { Write-Host $_.Exception.Message; exit 1 }"`,
      'if errorlevel 1 (',
      '    echo Extraction FAILED.',
      `    if exist "${newDir}" rmdir /s /q "${newDir}"`,
      '    exit /b 1',
      ')',
      '',
      'REM Verify the payload landed before touching the live install.',
      `if not exist "${newDir}\\${exeName}" (`,
      '    echo Verification FAILED: executable missing from extracted payload.',
      `    rmdir /s /q "${newDir}"`,
      '    exit /b 1',
      ')',
      `if not exist "${newDir}\\resources\\app.asar" (`,
      '    echo Verification FAILED: resources\\app.asar missing from extracted payload.',
      `    rmdir /s /q "${newDir}"`,
      '    exit /b 1',
      ')',
      '',
      'REM Swap. Keep only one previous version.',
      `if exist "${prevDir}" rmdir /s /q "${prevDir}"`,
      '',
      'REM Electron does not release the install folder the moment the main process exits — its',
      'REM GPU/renderer/utility children keep DLL handles open for a few more seconds. Observed',
      'REM 2026-08-09: main PID exited, the fixed 3s settle was not enough, and the swap aborted',
      'REM safely but the update never applied. Failing on the FIRST attempt turns a lost race into',
      'REM a permanent "updates never install". Retry with backoff; only a lock that outlives ~30s',
      'REM is a genuine "the app is still running".',
      'set SWAP_TRIES=0',
      ':SWAP_RETRY',
      `move "${installDir}" "${prevDir}" >nul 2>&1`,
      'if not errorlevel 1 goto SWAP_DONE',
      'set /a SWAP_TRIES+=1',
      'if %SWAP_TRIES% GEQ 15 goto SWAP_GIVEUP',
      'echo   install folder still locked, retrying (%SWAP_TRIES%/15)...',
      'timeout /t 2 /nobreak >nul',
      'goto SWAP_RETRY',
      ':SWAP_GIVEUP',
      'echo Swap FAILED after 30s: the install folder is still in use - the app did not fully exit.',
      'echo Nothing was changed.',
      `rmdir /s /q "${newDir}"`,
      'exit /b 1',
      ':SWAP_DONE',
      '',
      `move "${newDir}" "${installDir}" >nul 2>&1`,
      'if errorlevel 1 (',
      '    echo Swap FAILED while installing the new version - rolling back.',
      `    move "${prevDir}" "${installDir}" >nul 2>&1`,
      '    exit /b 1',
      ')',
      '',
      `echo OK > "${markerPath}"`,
      'echo Update applied and verified.',
      'exit /b 0',
    ];
    const extractScript = extractLines.join('\r\n') + '\r\n';

    // --- Script 2: update-elevate.ps1 ---
    // Runs update-extract.cmd with admin privileges (triggers UAC prompt).
    const elevateScript = `param([string]$ScriptPath)\r\nStart-Process -FilePath 'cmd.exe' -ArgumentList "/c \`"$ScriptPath\`"" -Verb RunAs -Wait\r\n`;

    // --- Script 3: update.cmd (main orchestrator) ---
    // Use array + join to guarantee CRLF line endings (CMD can choke on bare LF)
    const mainLines = [
      '@echo off',
      'title DK Power Manager - Updating...',
      'REM Same reason as update-extract.cmd: this shell must not hold the install folder open,',
      'REM and it stays alive for the whole run (including while the elevated retry executes).',
      'cd /d "%SystemRoot%"',
      '',
      `set "LOGFILE=${logFile}"`,
      `set "EXTRACT_CMD=${extractCmdPath}"`,
      `set "ELEVATE_PS=${elevatePsPath}"`,
      `set "MARKER=${markerPath}"`,
      '',
      'echo ============================================ >> "%LOGFILE%"',
      'echo [%date% %time%] Update script started >> "%LOGFILE%"',
      `echo [%date% %time%] PID: ${electronPid} >> "%LOGFILE%"`,
      `echo [%date% %time%] ZIP: ${zipPath} >> "%LOGFILE%"`,
      `echo [%date% %time%] Install: ${installDir} >> "%LOGFILE%"`,
      '',
      'echo Waiting for DK Power Manager to exit...',
      `echo [%date% %time%] Waiting for PID ${electronPid} >> "%LOGFILE%"`,
      '',
      // The old version swallowed a timeout in an empty catch and carried on regardless, which is
      // what CREATED the locked-file condition it then failed to detect. Exit non-zero instead:
      // WaitForExit returns false on timeout, and a missing process means it already exited.
      `powershell -NoProfile -Command "$p = Get-Process -Id ${electronPid} -ErrorAction SilentlyContinue; if ($p) { if (-not $p.WaitForExit(60000)) { exit 1 } }; exit 0"`,
      'if errorlevel 1 (',
      '    echo [%date% %time%] ERROR: app still running after 60s - aborting, nothing changed >> "%LOGFILE%"',
      '    echo.',
      '    echo ERROR: DK Power Manager did not exit within 60 seconds.',
      '    echo The update was NOT applied and nothing was changed.',
      '    echo Close the app completely and click "Apply Update" again.',
      '    echo.',
      '    echo Log: "%LOGFILE%"',
      '    timeout /t 20 /nobreak >nul',
      '    exit /b 1',
      ')',
      '',
      'echo [%date% %time%] Process exited >> "%LOGFILE%"',
      '',
      'REM Extra wait for file handles to release',
      'timeout /t 3 /nobreak >nul',
      '',
      'REM Verify ZIP still exists',
      `if not exist "${zipPath}" (`,
      '    echo [%date% %time%] ERROR: ZIP not found >> "%LOGFILE%"',
      '    echo.',
      '    echo ERROR: Update ZIP not found at:',
      `    echo   ${zipPath}`,
      '    echo.',
      '    echo It may have been deleted during app shutdown.',
      '    echo Log: "%LOGFILE%"',
      '    echo.',
      '    echo Press any key to exit...',
      '    pause >nul',
      '    exit /b 1',
      ')',
      '',
      'echo Extracting update...',
      'echo [%date% %time%] Attempting extraction >> "%LOGFILE%"',
      '',
      'REM Delete old marker if present',
      'if exist "%MARKER%" del "%MARKER%" 2>nul',
      '',
      'REM Try extraction as current user',
      'call "%EXTRACT_CMD%" >> "%LOGFILE%" 2>&1',
      '',
      'if exist "%MARKER%" (',
      '    echo [%date% %time%] Extraction succeeded >> "%LOGFILE%"',
      '    goto EXTRACTION_OK',
      ')',
      '',
      'REM Standard extraction failed - try with elevation (UAC)',
      'echo [%date% %time%] Standard extraction failed, requesting elevation >> "%LOGFILE%"',
      'echo.',
      'echo Extraction failed (likely permissions).',
      'echo Requesting admin privileges - please click Yes on the UAC prompt...',
      'echo.',
      '',
      'powershell -NoProfile -ExecutionPolicy Bypass -File "%ELEVATE_PS%" -ScriptPath "%EXTRACT_CMD%" >> "%LOGFILE%" 2>&1',
      '',
      'if exist "%MARKER%" (',
      '    echo [%date% %time%] Elevated extraction succeeded >> "%LOGFILE%"',
      '    goto EXTRACTION_OK',
      ')',
      '',
      'REM Both attempts failed. The swap either never happened or rolled itself back, so the',
      'REM existing install is intact — relaunch it rather than leaving the desktop with nothing.',
      'REM (The old script ended at `pause >nul`, which parked an unattended plant PC at a console',
      'REM prompt with no app and no backend until someone walked over to it.)',
      'echo [%date% %time%] ERROR: All extraction attempts failed >> "%LOGFILE%"',
      `if exist "${newDir}" rmdir /s /q "${newDir}"`,
      'echo.',
      'echo ERROR: Update failed. The existing version is untouched and is being restarted.',
      'echo.',
      'echo The update ZIP is preserved. You can retry by clicking',
      'echo "Apply Update" again from the Sync ^& Updates page.',
      'echo.',
      'echo Log: "%LOGFILE%"',
      `echo [%date% %time%] Relaunching previous version after failure >> "%LOGFILE%"`,
      `start "" "${exePath}"`,
      'timeout /t 20 /nobreak >nul',
      'exit /b 1',
      '',
      ':EXTRACTION_OK',
      'del "%MARKER%" 2>nul',
      'echo [%date% %time%] Extraction complete >> "%LOGFILE%"',
      '',
      'REM Copy version tracking file',
      `if exist "${stagingVersionPath}" (`,
      `    copy /y "${stagingVersionPath}" "${this.versionFilePath}" >nul`,
      '    echo [%date% %time%] Version file copied >> "%LOGFILE%"',
      ')',
      '',
      `echo [%date% %time%] Previous version kept at "${prevDir}" (run rollback.cmd to restore) >> "%LOGFILE%"`,
      '',
      'echo.',
      'echo Update applied successfully!',
      'echo Relaunching DK Power Manager...',
      'echo [%date% %time%] Relaunching >> "%LOGFILE%"',
      'timeout /t 2 /nobreak >nul',
      `start "" "${exePath}"`,
      '',
      'REM Cleanup LAST, and never before the relaunch. This script FILE lives in the staging dir,',
      'REM and cmd.exe reads a batch file incrementally as it executes — deleting the staging dir',
      'REM deletes update.cmd out from under the running shell, which then stops at the next read.',
      'REM That is why a SUCCESSFUL update used to leave the app shut down (observed 2026-08-10):',
      'REM everything applied correctly, then the script died before it could relaunch.',
      'REM Anything after this point may not execute — so nothing important goes below it.',
      'REM NOTE: <install>.prev is deliberately NOT deleted — it is the rollback copy that',
      'REM rollback.cmd restores. The next update replaces it, so only one generation is kept.',
      'echo Cleaning up...',
      `rmdir /s /q "${this.stagingDir}" 2>nul`,
      '',
      'exit /b 0',
    ];
    const mainScript = mainLines.join('\r\n') + '\r\n';

    // --- Script 4: rollback.cmd (working dir, survives staging cleanup) ---
    // Without this, recovering a bad update means someone who knows what `.prev` is walking to the
    // machine. With it, it is one double-click. Lives in the working dir because the staging dir is
    // deleted on success and the install dir is what gets swapped.
    const rollbackLines = [
      '@echo off',
      'title DK Power Manager - Rollback',
      'cd /d "%SystemRoot%"',   // must not hold the install folder open — see update-extract.cmd
      'echo Restoring the previous DK Power Manager version...',
      'echo.',
      `if not exist "${prevDir}" (`,
      '    echo Nothing to roll back to - no previous version is stored.',
      '    pause',
      '    exit /b 1',
      ')',
      '',
      'echo Close DK Power Manager first if it is running.',
      'pause',
      '',
      `if exist "${newDir}" rmdir /s /q "${newDir}"`,
      `move "${installDir}" "${newDir}" >nul 2>&1`,
      'if errorlevel 1 (',
      '    echo FAILED: the install folder is in use. Close the app and try again.',
      '    pause',
      '    exit /b 1',
      ')',
      `move "${prevDir}" "${installDir}" >nul 2>&1`,
      'if errorlevel 1 (',
      '    echo FAILED to restore - putting things back.',
      `    move "${newDir}" "${installDir}" >nul 2>&1`,
      '    pause',
      '    exit /b 1',
      ')',
      `rmdir /s /q "${newDir}" 2>nul`,
      'echo.',
      'echo Rollback complete. Relaunching...',
      `start "" "${exePath}"`,
      'timeout /t 3 /nobreak >nul',
      'exit /b 0',
    ];
    const rollbackScript = rollbackLines.join('\r\n') + '\r\n';
    const rollbackPath = path.join(this.workingDir, 'rollback.cmd');

    try {
      // Write all scripts to staging
      fs.writeFileSync(extractCmdPath, extractScript, { encoding: 'utf8' });
      fs.writeFileSync(elevatePsPath, elevateScript, { encoding: 'utf8' });
      fs.writeFileSync(cmdPath, mainScript, { encoding: 'utf8' });
      try {
        fs.writeFileSync(rollbackPath, rollbackScript, { encoding: 'utf8' });
      } catch (err: any) {
        // Non-fatal: the update can still proceed, we just lose the one-click recovery.
        console.warn(`Could not write rollback.cmd: ${err.message}`);
      }

      // Launch detached with proper quoting for paths with spaces.
      // windowsVerbatimArguments prevents Node from re-escaping our quotes.
      // cwd MUST be outside the install directory. Windows will not rename a directory that is
      // any process's current directory, so a cmd.exe inheriting Electron's cwd (which for a
      // packaged app IS the install folder) makes the swap impossible — permanently, not as a
      // race. Observed 2026-08-10: all 15 retries failed, then the elevated retry failed too,
      // because the original non-elevated cmd.exe was still alive holding the folder.
      // The working dir is always outside the install dir (ProgramData when packaged) and is
      // never renamed or deleted by these scripts.
      const child = spawn('cmd.exe', ['/c', `"${cmdPath}"`], {
        cwd: this.workingDir,
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

  /**
   * Is a ZIP staged and ready to apply?
   *
   * When {@code expectedChecksum} is supplied, a staged ZIP only counts if it IS that build.
   * The UI disables "Download" whenever something is staged, so a STALE staged ZIP — one left by
   * a failed apply, after a newer build was published — would otherwise strand the operator with
   * no way to fetch the new one and no discard button. Observed 2026-08-09.
   *
   * The comparison is cheap: the expected checksum was written into the staging
   * electron-version.json at download time, so nothing has to be re-hashed.
   */
  public isUpdateStaged(expectedChecksum?: string): boolean {
    if (this.getStagedZipPath() === null) return false;
    if (!expectedChecksum) return true;
    return this.getStagedChecksum() === expectedChecksum;
  }

  /** Checksum of the currently staged ZIP, from the staging version record ('' if none). */
  public getStagedChecksum(): string {
    try {
      const p = path.join(this.stagingDir, 'electron-version.json');
      if (fs.existsSync(p)) {
        const record: ElectronVersionRecord = JSON.parse(fs.readFileSync(p, 'utf8'));
        return record.checksum || '';
      }
    } catch { /* corrupted — treat as no staged build */ }
    return '';
  }

  /** Delete anything staged. Used to clear a stale ZIP so a newer build can be downloaded. */
  public discardStaged(): void {
    try {
      if (fs.existsSync(this.stagingDir)) {
        fs.rmSync(this.stagingDir, { recursive: true, force: true });
        console.log('Discarded staged Electron update');
      }
    } catch (err: any) {
      console.warn(`Could not discard staged update: ${err.message}`);
    }
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
