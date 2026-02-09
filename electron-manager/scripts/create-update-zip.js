/**
 * create-update-zip.js
 *
 * After `electron-builder --dir` produces `release/win-unpacked/`, this script
 * creates a ZIP with the contents at root level (no nested subfolder).
 * The ZIP can be dropped into the sync server's `electron-updates/` directory.
 *
 * Uses PowerShell Compress-Archive to avoid loading 200MB+ into memory.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const unpackedDir = path.join(rootDir, 'release', 'win-unpacked');
const pkg = require(path.join(rootDir, 'package.json'));
const version = pkg.version || '1.0.0';
const productName = pkg.build?.productName || 'DK-Power-Manager';
const safeName = productName.replace(/\s+/g, '-');
const zipName = `${safeName}-${version}.zip`;
const zipPath = path.join(rootDir, 'release', zipName);

// Verify win-unpacked exists
if (!fs.existsSync(unpackedDir)) {
  console.error(`ERROR: ${unpackedDir} does not exist.`);
  console.error('Run "npm run package:dir" first to build the unpacked app.');
  process.exit(1);
}

// Remove old ZIP if present
if (fs.existsSync(zipPath)) {
  console.log(`Removing existing ${zipName}...`);
  fs.unlinkSync(zipPath);
}

console.log(`Creating ${zipName} from win-unpacked...`);

// Use PowerShell Compress-Archive with -Path 'dir\*' to put contents at root level
const psCommand = `Compress-Archive -Path '${unpackedDir}\\*' -DestinationPath '${zipPath}' -CompressionLevel Optimal`;
try {
  execSync(`powershell -NoProfile -Command "${psCommand}"`, {
    stdio: 'inherit',
    timeout: 300000 // 5 min
  });
} catch (err) {
  console.error('ERROR: Failed to create ZIP.', err.message);
  process.exit(1);
}

// Verify
const stats = fs.statSync(zipPath);
const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
console.log(`Created: ${zipPath} (${sizeMB} MB)`);
console.log(`\nTo deploy: copy ${zipName} to sync server's electron-updates/ directory.`);
