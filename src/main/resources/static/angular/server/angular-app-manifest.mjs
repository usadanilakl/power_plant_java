
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
    'index.csr.html': {size: 23674, hash: 'c954ed0139f2216927688d649686d7e874077bc5a97d89bf02190f6f62573ce7', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17152, hash: '3f008aabb8f60e08901a30a794995f09485c9c5e8787c458719ea443c5b355d5', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 43801, hash: '1392647658d366927172d982d3a9e5f601e3d036bb9c268073e798a92335954d', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 33533, hash: '539f2e23cc2dd0ce9ac7dcb4fec86332eb217a88a41abfc744cb428258e474b6', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 34383, hash: 'd29d2763e19345850eb4ff3c882774c401843448231c09c67b5e791c242f1899', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 34953, hash: 'eca50289bb13d9b630b0520f00ebcdeb64f5a25ef51860467a337f12f981c530', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 30971, hash: '810d497b8e46accef829a8c2628e49177de18f1f990e9bcf1e657f8af7cf20c9', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 38804, hash: 'f55f8431af1c4ad0284e0716a04ed6785535a8d58032a9f994c8cfadacba912b', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 31665, hash: '464f45ca5be40a689b385e2116d5443b78ccee54f2aa80c7d561e64251d592fd', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 24270, hash: '8ccc0acce0b5007b31d1caccbb62362557952231b10febc95de171b7d1fb8985', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 31006, hash: '2a3ce8b6cbc1762022d0782fd875d16e869e4602e4ce47f0c9cdc7eeb7f988f1', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 36165, hash: 'b72103f6e5e80d51bff0cef41357ca73e490d01f02d4ccd5e6e598c7ddc16812', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 40322, hash: 'a6e9392c6d61826b855b1cb1331ee974cc2b02e06b91036d7e5467faaccdb747', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 51936, hash: 'de98f7dce8e4a92eafd35913adca4f1aa0b1e6904501aa2560d36d4a02811e27', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 30930, hash: 'b717b570ea40e64e2fa968604bfb1b087b771cc0c45b5ab408dd592af4cbcd5a', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'file-editor/index.html': {size: 41312, hash: '6280dad0e92fc86eb239ea6ca48ea53f388a9e857d327d4e2d6c008f32b3d22b', text: () => import('./assets-chunks/file-editor_index_html.mjs').then(m => m.default)},
    'styles-ZZB5FV3S.css': {size: 9528, hash: '3l+z/03bYiA', text: () => import('./assets-chunks/styles-ZZB5FV3S_css.mjs').then(m => m.default)}
  },
};
