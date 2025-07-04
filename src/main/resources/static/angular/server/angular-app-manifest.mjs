
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/angular/browser/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "redirectTo": "/angular/browser/file/edit",
    "route": "/angular/browser"
  },
  {
    "renderMode": 2,
    "redirectTo": "/angular/browser/file/table",
    "route": "/angular/browser/file"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/file/edit"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/file/table"
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
    "route": "/angular/browser/print"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/file-editor"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 23674, hash: '809f51f532e6543975076025b5e023820bb0c4c4d0f4cdf1d8ece4692644fa60', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17152, hash: 'f19a08e859fd9a2f2a6e9a7707a8ca98d9547e2582edca2a7cf900cad63cb106', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 33294, hash: 'b1627a6ceb5ce0bca96982cd64aa456bf87fb2d15aa409e66301099fbfa9020f', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 40746, hash: 'bf02c65be920ca0794fa5c82fa837e5f3fca1694ee8e901ca78650205703c159', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 34095, hash: 'd1ffe7af6f3e7d3e383a6c8cd4cc720f94f625609cffca419ba409c5f662a536', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 30790, hash: 'ac41c0f6292564accd66f697377f94dee615b13423af788dca77074cb9faa452', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 34674, hash: 'c6011e33c095a547f1a4bb4debbab4dec04ac01c90cc0221d7e5234540d66e95', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 32953, hash: 'd93631c292b866145cd9cce0af39a3d9381dce1a7e48a1cd91c6d951a4af6c82', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 38271, hash: 'c784387cdda3d0377eb35c44abba702b07f1d79105e0d2b40a64659186ec1b3d', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 30751, hash: '0e0c60a29d3a63618140e70717a79a1a276176aff14e1fd0ef114fe198511519', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 24270, hash: 'ee430c8440a1b6e0f073b7c9da3937bc4db33a75b893fbf361140ea3f0020a62', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'file-editor/index.html': {size: 39257, hash: 'dd960f9cd4b01181db9fc96c2ce7ba2e73d1ee5995fe7e38701a88e2d11225d8', text: () => import('./assets-chunks/file-editor_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 48292, hash: 'fc393d4fb7ead964416c499c027b58e34788cb851b145c5a69d74249591da896', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'styles-ZZB5FV3S.css': {size: 9528, hash: '3l+z/03bYiA', text: () => import('./assets-chunks/styles-ZZB5FV3S_css.mjs').then(m => m.default)}
  },
};
