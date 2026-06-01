const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const BASE_URL = 'https://jacksongeneration.github.io/permits/data';
const DATA_DIR = path.join('docs', 'browser', 'data');
const PUBLIC_DATA_DIR = path.join('public', 'data');
const BACKUP_DIR = path.join('.deploy-backup', 'data');

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const get = url.startsWith('https') ? https.get : http.get;
    get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        download(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      const stream = fs.createWriteStream(dest);
      res.pipe(stream);
      stream.on('finish', () => { stream.close(); resolve(); });
      stream.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Backs up ALL files from docs/browser/data/ before build wipes them.
 */
function backupDeployedData() {
  if (!fs.existsSync(DATA_DIR)) return;

  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const files = fs.readdirSync(DATA_DIR);
  for (const file of files) {
    const src = path.join(DATA_DIR, file);
    const dest = path.join(BACKUP_DIR, file);
    if (fs.statSync(src).isFile()) {
      fs.copyFileSync(src, dest);
      console.log(`  Backed up ${file}`);
    }
  }
  console.log(`  Backed up ${files.length} files from deployed data`);
}

/**
 * Restores backed-up data into the build output, preserving any files
 * that the build didn't regenerate.
 */
function restoreBackedUpData() {
  if (!fs.existsSync(BACKUP_DIR)) return;

  fs.mkdirSync(DATA_DIR, { recursive: true });
  const files = fs.readdirSync(BACKUP_DIR);
  for (const file of files) {
    const dest = path.join(DATA_DIR, file);
    const src = path.join(BACKUP_DIR, file);
    // Only restore if the build didn't produce a newer/better version
    // (public/data/ files get copied by Angular build)
    if (!fs.existsSync(dest)) {
      fs.copyFileSync(src, dest);
      console.log(`  Restored ${file} from backup`);
    } else {
      // If file exists but is empty/tiny (e.g. "[]"), prefer backup if backup has data
      const buildSize = fs.statSync(dest).size;
      const backupSize = fs.statSync(src).size;
      if (buildSize <= 3 && backupSize > 3) {
        fs.copyFileSync(src, dest);
        console.log(`  Restored ${file} from backup (build had empty placeholder)`);
      }
    }
  }

  // Clean up backup
  fs.rmSync(BACKUP_DIR, { recursive: true, force: true });
}

/**
 * Downloads live data from GitHub Pages into public/data/ so Angular build includes it.
 * Also fetches all files that exist on the live site.
 */
async function fetchLiveData() {
  fs.mkdirSync(PUBLIC_DATA_DIR, { recursive: true });

  // All known data files used by the app
  const ALL_DATA_FILES = [
    'work-areas.json',
    'work-area-shapes.json',
    'work-area-map-image.jpg',
    'work-categories.json',
    'loto-points.json',
    'locations.json',
    'field-list-types.json',
    'default-instruments.json',
    'sds-chemicals.json'
  ];

  for (const file of ALL_DATA_FILES) {
    const dest = path.join(PUBLIC_DATA_DIR, file);
    try {
      console.log(`  Downloading ${file} from live site...`);
      const tempDest = dest + '.tmp';
      await download(`${BASE_URL}/${file}`, tempDest);
      const size = fs.statSync(tempDest).size;
      if (size <= 3 && fs.existsSync(dest) && fs.statSync(dest).size > 3) {
        // Downloaded file is empty but local has data — keep local
        fs.unlinkSync(tempDest);
        console.log(`  ${file} from live site is empty, keeping local copy (${fs.statSync(dest).size} bytes)`);
      } else {
        fs.renameSync(tempDest, dest);
        console.log(`  ${file} downloaded (${size} bytes)`);
      }
    } catch (e) {
      console.log(`  Warning: ${file} not available from live site (${e.message}), keeping local copy`);
    }
  }
}

async function main() {
  console.log('Step 1: Backing up deployed data...');
  backupDeployedData();

  console.log('Step 2: Fetching live data before build...');
  await fetchLiveData();

  console.log('Step 3: Building...');
  run('npx ng build --configuration production --base-href /permits/');
  fs.copyFileSync(path.join('docs', 'browser', 'index.html'), path.join('docs', 'browser', '404.html'));

  console.log('Step 4: Restoring backed-up data...');
  restoreBackedUpData();

  console.log('Step 5: Deploying...');
  run('npx angular-cli-ghpages --dir=docs/browser --repo=https://github.com/JacksonGeneration/permits.git');
}

main().catch((e) => { console.error(e); process.exit(1); });
