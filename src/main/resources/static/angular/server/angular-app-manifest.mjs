
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
  },
  {
    "renderMode": 2,
    "redirectTo": "/angular/browser/scheduler/flow",
    "route": "/angular/browser/scheduler"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/scheduler/flow"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/scheduler/table"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 23674, hash: '62effef7e86223a4938d21e640dd712e3b47fb29d02591897d1d3b4c04972a07', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17152, hash: 'e6ad3adfb84d8c69d50c0f8d2c3ead290a4a8f2c81bf153b17a786931f50278f', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 42808, hash: 'bfc42ea77a59d5abf6e7f2960ecf4d85492595394fb591cee49c2239ad091c76', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 34864, hash: '2a1367bfae2d96d2a1e94e2563b8d33928a7aaea32c24b167b5302e01194999f', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 33434, hash: '0203d889a1aafc5771b177c3774e934405a989519edba7aa16238a46aa9ae8c8', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 30872, hash: 'cfa872cd84c350f136481cc012561787d5ac3a45395c8440d6d9c5921846f64c', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 30831, hash: '3f93dcd9a2a433abd8a0c54cc54d11684145a0c91759234378bf3c9cbdef6d00', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 38707, hash: '4edd0c4b894e09095b7c4297e10e1b6b4f0d99dfab37732ace8bfa7c747cd9d4', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 24270, hash: '0e7a1f5c96f910fcb8dd5d7081db04142d103417f7de1287a4ed9db2479cdcdc', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 34275, hash: '101f45148219e0040afc015655dce6274e5b3c3913fc2b3b532a4c8e977306fc', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 31560, hash: '6a2da782affa1f4d45d5972bac4e85d6163c97643c485804a72bc5f609e86ff7', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 31006, hash: 'a0e6a19ecbf816350c957435b6fa5fc99e6def48786e76f7d6ab784f12f6709e', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 40222, hash: 'b415a0c328e04fd9449d5cde23f5856a9a986f83dbd17596e85eaba5204a5af9', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 36170, hash: 'd4745a8a44f9b1275e06e922020726c67a78ceba0d3714d03a2ce95b9b2e5656', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 50921, hash: '91c1e60761658b03db529dd7cc5b0f3b96579abeadbf26876986b0f82fe279ba', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'file-editor/index.html': {size: 40306, hash: '0b38f1488af51d1b27f69f9d138aaa653aa338574fae6a7a0016f09601ccd043', text: () => import('./assets-chunks/file-editor_index_html.mjs').then(m => m.default)},
    'styles-ZZB5FV3S.css': {size: 9528, hash: '3l+z/03bYiA', text: () => import('./assets-chunks/styles-ZZB5FV3S_css.mjs').then(m => m.default)}
  },
};
