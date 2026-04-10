/**
 * Copies the EtaPro PowerShell script and Excel templates from the project root
 * into electron-manager/etapro-defaults/ so they get bundled by electron-builder.
 *
 * Sources:
 *   <project>/scripts/etapro-scrape.ps1
 *   <project>/etapro/template-live.xlsx
 *   <project>/etapro/template-history.xlsx
 *
 * Run automatically via the "prepackage" npm script.
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..', '..');
const targetDir = path.resolve(__dirname, '..', 'etapro-defaults');

// Ensure target dir exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const files = [
  { src: path.join(projectRoot, 'scripts', 'etapro-scrape.ps1'), dst: path.join(targetDir, 'etapro-scrape.ps1') },
  { src: path.join(projectRoot, 'etapro', 'template-live.xlsx'), dst: path.join(targetDir, 'template-live.xlsx') },
  { src: path.join(projectRoot, 'etapro', 'template-history.xlsx'), dst: path.join(targetDir, 'template-history.xlsx') },
];

let copied = 0;
let skipped = 0;

for (const { src, dst } of files) {
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dst);
    console.log(`[EtaPro] Copied: ${path.basename(src)}`);
    copied++;
  } else {
    console.warn(`[EtaPro] WARNING: Source not found, skipping: ${src}`);
    skipped++;
  }
}

console.log(`[EtaPro] Sync complete: ${copied} copied, ${skipped} skipped`);
if (skipped > 0) {
  console.warn('[EtaPro] Missing templates will cause EtaPro to fail on first scrape in the packaged app.');
  console.warn('[EtaPro] Create them per project/features/etapro-scraper/setup-guide.md and place in <project>/etapro/');
}
