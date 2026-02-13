/**
 * create-update-zip.js
 *
 * After `electron-builder --dir` produces `release/win-unpacked/`, this script
 * creates a ZIP with the contents at root level (no nested subfolder).
 * The ZIP can be dropped into the sync server's `electron-updates/` directory.
 *
 * Uses .NET ZipFile API via PowerShell with FileShare.ReadWrite so files locked
 * by Windows Defender / Search Indexer can still be read.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const unpackedDir = path.join(rootDir, 'build', 'win-unpacked');
const pkg = require(path.join(rootDir, 'package.json'));
const version = pkg.version || '1.0.0';
const productName = pkg.build?.productName || 'DK-Power-Manager';
const safeName = productName.replace(/\s+/g, '-');
const zipName = `${safeName}-${version}.zip`;
const zipPath = path.join(rootDir, 'build', zipName);

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

// Write a temp PowerShell script that uses .NET ZipFile API with FileShare.ReadWrite
// to handle files locked by antivirus or search indexer.
const psScriptPath = path.join(rootDir, 'build', '_create-zip.ps1');
const psScript = `
Add-Type -Assembly 'System.IO.Compression.FileSystem'
$source = '${unpackedDir.replace(/'/g, "''")}'
$dest = '${zipPath.replace(/'/g, "''")}'
$basePath = (Resolve-Path $source).Path
$zip = [System.IO.Compression.ZipFile]::Open($dest, 'Create')
$files = Get-ChildItem -Path $source -Recurse -File
$total = $files.Count
$count = 0
foreach ($f in $files) {
    $rel = $f.FullName.Substring($basePath.Length + 1)
    $fs = [System.IO.File]::Open($f.FullName, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
    $entry = $zip.CreateEntry($rel, [System.IO.Compression.CompressionLevel]::Optimal)
    $es = $entry.Open()
    $fs.CopyTo($es)
    $es.Dispose()
    $fs.Dispose()
    $count++
    if ($count % 25 -eq 0) { Write-Host "  $count / $total files..." }
}
$zip.Dispose()
Write-Host "Zipped $count files"
`;

try {
  fs.writeFileSync(psScriptPath, psScript, 'utf8');
  execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${psScriptPath}"`, {
    stdio: 'inherit',
    timeout: 600000 // 10 min
  });
} catch (err) {
  console.error('ERROR: Failed to create ZIP.', err.message);
  process.exit(1);
} finally {
  try { fs.unlinkSync(psScriptPath); } catch { /* ignore */ }
}

// Verify
const stats = fs.statSync(zipPath);
const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
console.log(`Created: ${zipPath} (${sizeMB} MB)`);
console.log(`\nTo deploy: copy ${zipName} to sync server's electron-updates/ directory.`);
