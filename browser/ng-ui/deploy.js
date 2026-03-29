const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const BASE_URL = 'https://jacksongeneration.github.io/permits/data';
const DATA_DIR = path.join('docs', 'browser', 'data');
const PUBLIC_DATA_DIR = path.join('public', 'data');
const DATA_FILES = ['work-areas.json', 'work-area-shapes.json', 'work-area-map-image.jpg', 'work-categories.json'];

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
 * Downloads live data BEFORE build so the build output includes it.
 * Always overwrites local dev files with live site data to prevent
 * stale dev data from replacing production data on deploy.
 */
async function fetchLiveData() {
  fs.mkdirSync(PUBLIC_DATA_DIR, { recursive: true });
  for (const file of DATA_FILES) {
    const dest = path.join(PUBLIC_DATA_DIR, file);
    try {
      console.log(`  Downloading ${file} from live site...`);
      await download(`${BASE_URL}/${file}`, dest);
      console.log(`  ${file} downloaded`);
    } catch (e) {
      console.log(`  Warning: ${file} not available from live site (${e.message}), keeping local copy`);
    }
  }
}

async function main() {
  console.log('Fetching live data before build...');
  await fetchLiveData();
  run('npx ng build --configuration production --base-href /permits/');
  fs.copyFileSync(path.join('docs', 'browser', 'index.html'), path.join('docs', 'browser', '404.html'));
  run('npx angular-cli-ghpages --dir=docs/browser --repo=https://github.com/JacksonGeneration/permits.git');
}

main().catch((e) => { console.error(e); process.exit(1); });
