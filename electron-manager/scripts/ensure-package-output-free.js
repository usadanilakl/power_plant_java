/*
 * Fails packaging early if the previous unpacked Electron build is still
 * running from build/win-unpacked. electron-builder cannot replace a running
 * .exe on Windows, and otherwise reports a noisy app-builder stack trace.
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

if (process.platform !== 'win32') {
  process.exit(0);
}

const rootDir = path.resolve(__dirname, '..');
const unpackedDir = path.join(rootDir, 'build', 'win-unpacked');

if (!fs.existsSync(unpackedDir)) {
  process.exit(0);
}

const command = [
  '$target = [Environment]::GetEnvironmentVariable("DK_PM_PACKAGE_OUTPUT")',
  '$matches = Get-Process | ForEach-Object {',
  '  try {',
  '    if ($_.Path -and $_.Path.StartsWith($target, [System.StringComparison]::OrdinalIgnoreCase)) {',
  '      [PSCustomObject]@{ ProcessId = $_.Id; Name = $_.ProcessName; ExecutablePath = $_.Path }',
  '    }',
  '  } catch {}',
  '}',
  'if ($matches) { $matches | ConvertTo-Json -Compress }',
].join('\n');

let output = '';

try {
  output = execFileSync(
    'powershell.exe',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', command],
    {
      encoding: 'utf8',
      env: {
        ...process.env,
        DK_PM_PACKAGE_OUTPUT: unpackedDir,
      },
    }
  ).trim();
} catch (err) {
  console.warn(`WARNING: Could not check whether ${unpackedDir} is in use.`);
  console.warn(err.message);
  process.exit(0);
}

if (!output) {
  process.exit(0);
}

const processes = JSON.parse(output);
const blockedBy = Array.isArray(processes) ? processes : [processes];

console.error('');
console.error('ERROR: Cannot package because the previous unpacked app is still running.');
console.error(`Close every process running from: ${unpackedDir}`);
console.error('');

for (const proc of blockedBy) {
  console.error(`  PID ${proc.ProcessId}: ${proc.Name}`);
  console.error(`    ${proc.ExecutablePath}`);
}

console.error('');
console.error('Close DK Power Manager, then run npm run package:zip again.');
console.error('If it will not close, you can stop the listed PID from PowerShell, for example:');
console.error(`  Stop-Process -Id ${blockedBy[0].ProcessId}`);
console.error('');

process.exit(1);
