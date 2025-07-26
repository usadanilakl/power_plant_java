
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
    "route": "/angular/browser/backup"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/file-editor"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 23674, hash: '872c35c8ceb1af89aca630665706dd8437f43f45d9dc9fcf0e0f67b6604bd1d5', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17152, hash: '9048c8f4aaf7c92d721140b025141f4c7645d4ebae0203cbcbaea8be4f319f39', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 64503, hash: 'f2dbf67dda8c8133832b5237e931c1c0b8e7f0db20264d0c8b30e241c99fbed2', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 393401, hash: 'd6d7b3de47aaca92eb86014e6ff6721343708c5c104f4ce94d13a1e69d82f1c3', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 31395, hash: 'a6c82b03dbfaf8b32ba932853c794113ed6ebfb5eed17f82cb3ebe45fbcb8e86', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 102865, hash: 'b0f07f60a00feb9e87c5b0824d6b71e49d5fb8d34a2bdee9101f9bf2e99137cf', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 30831, hash: '4be22ace3e109e7685ebf8406e212b62e8329510cd4833ced996958cfc45700f', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 56889, hash: 'cb01a4a35bc2a93d02a5563ab51f3b8612367942b0c117c6bdbc4fd27360fd6b', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 24270, hash: '4b5a7eee423d703c1f1ea03e6ce44fa63803fd594163c3217974eaf294aabff6', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 31896, hash: '1d4568d9f8a3e8724704d805be258c129a8d77bae09f351de8a6dc78d2c75f2f', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'file-editor/index.html': {size: 73813, hash: 'ec7436bab58192b679cdf506977d55103671dac8c883a3d42335e9e749c1aa55', text: () => import('./assets-chunks/file-editor_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 109636, hash: '2d91415bddddc1a4824e87740f1a6e23fb2b799e1ca979f6ee6810a159c903e8', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 410693, hash: '7c3ad40b3566c0f2545e8fa19d7ceb6a212eae34e2a514c2b720f0dc85842e62', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 357818, hash: '17048fa5a3678688f78f532f1da16d49579ada690389711745e6b6f95b11f6c8', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'styles-ZZB5FV3S.css': {size: 9528, hash: '3l+z/03bYiA', text: () => import('./assets-chunks/styles-ZZB5FV3S_css.mjs').then(m => m.default)}
  },
};
