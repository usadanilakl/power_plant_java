const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const BASE_URL = 'https://jacksongeneration.github.io/permits/data';
const DATA_DIR = path.join('docs', 'browser', 'data');
const DATA_FILES = ['work-areas.json', 'work-area-shapes.json', 'work-area-map-image.jpg'];

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

async function preserveData() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  for (const file of DATA_FILES) {
    const dest = path.join(DATA_DIR, file);
    if (fs.existsSync(dest)) {
      console.log(`  ${file} already present from local build`);
    } else {
      try {
        console.log(`  Downloading ${file} from live site...`);
        await download(`${BASE_URL}/${file}`, dest);
        console.log(`  ${file} downloaded`);
      } catch (e) {
        console.log(`  Warning: ${file} not available yet (${e.message})`);
      }
    }
  }
}

async function main() {
  run('npx ng build --configuration production --base-href /permits/');
  fs.copyFileSync(path.join('docs', 'browser', 'index.html'), path.join('docs', 'browser', '404.html'));
  console.log('Preserving map data...');
  await preserveData();
  run('npx angular-cli-ghpages --dir=docs/browser --repo=https://github.com/JacksonGeneration/permits.git');
}

main().catch((e) => { console.error(e); process.exit(1); });
