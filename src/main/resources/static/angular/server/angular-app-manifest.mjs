
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/angular/browser/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "route": "/angular/browser"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/loto"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/tag-number"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/pid"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 730, hash: '7902fb71160725039296602f0d452291d9282d1c4fc05560fd432af2be022030', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1021, hash: 'bd8773917eff772014a767eaaa09bba10dcd91f4bf5b986fe267a53b02a05446', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'loto/index.html': {size: 3378, hash: '411c650a71874bec2943edcaccd695cd496924aed941b6157168105e1c4be4c3', text: () => import('./assets-chunks/loto_index_html.mjs').then(m => m.default)},
    'index.html': {size: 4707, hash: 'fa4966b38c8657b951fad2e706fe6e9619410b87dbf0bcef263b9073d3580778', text: () => import('./assets-chunks/index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 8219, hash: '9a9930153d7ab58c467f1952c693b1b316a0a5b8ed73a3d2aa2f6a47134c2044', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'pid/index.html': {size: 7055, hash: '0da8b6dc356278b7754efcf9945f4270409ce766cfd8803728506009c8a1bc95', text: () => import('./assets-chunks/pid_index_html.mjs').then(m => m.default)},
    'styles-JKAGC53I.css': {size: 364, hash: 'VECtiBfngJY', text: () => import('./assets-chunks/styles-JKAGC53I_css.mjs').then(m => m.default)}
  },
};
