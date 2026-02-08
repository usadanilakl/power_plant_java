/**
 * Downloads Eclipse Temurin JRE 21 (Windows x64) for bundling with Electron.
 * Run: node scripts/download-jre.js
 * Output: electron-manager/jre/ directory with bin/java.exe
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const JRE_DIR = path.join(__dirname, '..', 'jre');
const TEMP_ZIP = path.join(__dirname, '..', 'jre-download.zip');

// Adoptium API: latest JRE 21, Windows x64, HotSpot
const DOWNLOAD_URL = 'https://api.adoptium.net/v3/binary/latest/21/ga/windows/x64/jre/hotspot/normal/eclipse';

async function main() {
  // Skip if JRE already present
  const javaExe = path.join(JRE_DIR, 'bin', 'java.exe');
  if (fs.existsSync(javaExe)) {
    console.log('JRE already exists:', javaExe);
    try {
      const version = execSync(`"${javaExe}" -version 2>&1`, { encoding: 'utf-8' }).trim().split('\n')[0];
      console.log('Version:', version);
    } catch { /* ignore */ }
    return;
  }

  console.log('Downloading Eclipse Temurin JRE 21 for Windows x64...');
  console.log('URL:', DOWNLOAD_URL);

  await downloadWithRedirects(DOWNLOAD_URL, TEMP_ZIP);

  const stat = fs.statSync(TEMP_ZIP);
  console.log(`Downloaded: ${(stat.size / 1024 / 1024).toFixed(1)} MB`);

  // Extract using PowerShell
  console.log('Extracting...');
  if (fs.existsSync(JRE_DIR)) {
    fs.rmSync(JRE_DIR, { recursive: true });
  }
  fs.mkdirSync(JRE_DIR, { recursive: true });

  execSync(
    `powershell -NoProfile -Command "Expand-Archive -Path '${TEMP_ZIP}' -DestinationPath '${JRE_DIR}' -Force"`,
    { stdio: 'inherit' }
  );

  // Flatten: the ZIP contains a single top-level dir like jdk-21.0.x+y-jre/
  const entries = fs.readdirSync(JRE_DIR);
  if (entries.length === 1) {
    const subDir = path.join(JRE_DIR, entries[0]);
    if (fs.statSync(subDir).isDirectory()) {
      console.log(`Flattening ${entries[0]}/...`);
      for (const entry of fs.readdirSync(subDir)) {
        fs.renameSync(path.join(subDir, entry), path.join(JRE_DIR, entry));
      }
      fs.rmdirSync(subDir);
    }
  }

  // Cleanup temp file
  fs.unlinkSync(TEMP_ZIP);

  // Verify
  if (fs.existsSync(javaExe)) {
    console.log('JRE ready:', javaExe);
    try {
      execSync(`"${javaExe}" -version`, { stdio: 'inherit' });
    } catch { /* ignore */ }
  } else {
    console.error('ERROR: java.exe not found after extraction!');
    console.error('Expected at:', javaExe);
    console.error('Contents:', fs.readdirSync(JRE_DIR));
    process.exit(1);
  }
}

function downloadWithRedirects(url, destPath, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    function doRequest(url, redirectsLeft) {
      const client = url.startsWith('https') ? https : http;
      client.get(url, { headers: { 'User-Agent': 'DKPower-JRE-Download' } }, (res) => {
        // Follow redirects
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          if (redirectsLeft <= 0) return reject(new Error('Too many redirects'));
          res.resume();
          return doRequest(res.headers.location, redirectsLeft - 1);
        }

        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode}`));
        }

        const ws = fs.createWriteStream(destPath);
        let downloaded = 0;
        const total = parseInt(res.headers['content-length'] || '0', 10);

        res.on('data', (chunk) => {
          downloaded += chunk.length;
          if (total > 0) {
            process.stdout.write(`\r  ${(downloaded / 1024 / 1024).toFixed(1)} / ${(total / 1024 / 1024).toFixed(1)} MB`);
          }
        });

        res.pipe(ws);
        ws.on('finish', () => {
          ws.close();
          console.log('');
          resolve();
        });
        ws.on('error', reject);
      }).on('error', reject);
    }

    doRequest(url, maxRedirects);
  });
}

main().catch((err) => {
  console.error('JRE download failed:', err.message);
  process.exit(1);
});
