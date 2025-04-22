
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
    "redirectTo": "/angular/browser/loto/loto",
    "route": "/angular/browser/loto"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/loto/loto"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/loto/loto-points"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/loto/loto-points-active"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/loto/loto-boxes"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/loto/locks"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/loto-points"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/tag-number"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/pid"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/print"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 730, hash: '09afbcbb27e8389a3ea367b340b5de28d2493a1cb7d46c0fc54d480a3f8f9e04', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1021, hash: '0bbc24be6a1919e5703f912dbe0e23516d3acba98d3c05cfb9e835cef627dbe9', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'index.html': {size: 5773, hash: '42c87ef7efd55316ca845382322ed863fc440e678d4dae685ca547f292213337', text: () => import('./assets-chunks/index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 9155, hash: '7c16979755cdfded64f9766fa0ba469b44dd738e8525a9f5af567711caa988c5', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 7478, hash: '236c15f4b0b8ca94a38e60313ba7ef3005789749cf5682e3ee1417c95d0d7a99', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 9143, hash: '2aa1c82adfdc9a1b47d9de74cc86227fb3f8ca34a9b68805dff87e8ff9c71967', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 7511, hash: 'f48218dc9cd4373c65ac405915867ae2ce6dfd283803b2bb660931af73e9a47c', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'pid/index.html': {size: 7471, hash: 'd0083590b6055ace3133f4cc84adb4adbe69faedf4cb6a4a850d693b698fdd01', text: () => import('./assets-chunks/pid_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 9241, hash: 'eba7f6b36e4979309f9f1d579940f9989f064db94e08646e9c7153d7943b15e6', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 3831, hash: '453328892156163dffb07c831d8dbf2fd960cfc19a472636059bcf95a1155f0c', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 8141, hash: 'd74db7580e1f9c31f5f2a421a112e381d7e7fab2344d0079fce6dc983494f921', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 9264, hash: '8691959463761ad485bcc3608f293d1ca66bd9c67bbf07984d7c111330a22ba9', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'styles-SE6UKMVB.css': {size: 2550, hash: 'HQgC9XG/u4M', text: () => import('./assets-chunks/styles-SE6UKMVB_css.mjs').then(m => m.default)}
  },
};
