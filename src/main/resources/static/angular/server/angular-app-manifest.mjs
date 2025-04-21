
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
    'index.csr.html': {size: 730, hash: '6306465443a5c1ff73f2035e2fcbf497ce261209c426dc26f092651db3b8304d', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1021, hash: '3d609404ec56e613374e8e2baac45881d96f1c5d130ed6a9983e749caca3b36c', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'index.html': {size: 5773, hash: 'd5cb82538eb6988d5f5d7a287e813f5d5d207d2abe10c656d428886bf8a68d28', text: () => import('./assets-chunks/index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 8717, hash: 'cbe7eec0d403798482e5bbbfc4ed3a0b899b28c1255ec942ff0c8c6be6073f6a', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 9090, hash: 'efe6f8113def1115efb88f9ed0ba459dfe500017bf9d5b97d19f3e59e64d9850', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 7434, hash: '192773e7e91dcf365737d961dd2d0ae14d93acfd6e60363ce79ac18079bf20cd', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 8802, hash: 'ffcc6da5298617609dc7b0b115d4357ce33c285c93708aaf0798c2f7b3f3169e', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 7399, hash: '256e0d0075fbc9db697f9cb1721b957f8416773f0195ce7166bdd8ae2fdd68d0', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 7716, hash: '6c2a6a9f4aba1814857ed10f71917955bdbb5ea1d8900fd23e27f89fbfcf4777', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 8812, hash: 'cfc3ed09daf6c1c93baf1f1c31274c133c9511da83131db32fb75fcc887049e9', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 3831, hash: 'fd006433a0a0e884d09cf7035314ee3344689fc72b6a8246c4df2c31a427c6ef', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'pid/index.html': {size: 7397, hash: 'dcdb9e7619e6c04cdd1a440010e91074e7c9589288e708eded9d29f10659e8e9', text: () => import('./assets-chunks/pid_index_html.mjs').then(m => m.default)},
    'styles-SE6UKMVB.css': {size: 2550, hash: 'HQgC9XG/u4M', text: () => import('./assets-chunks/styles-SE6UKMVB_css.mjs').then(m => m.default)}
  },
};
