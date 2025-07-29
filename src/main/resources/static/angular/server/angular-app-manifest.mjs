
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
    'index.csr.html': {size: 23674, hash: 'bd4317308260201013ad972401358c04374a96e7094190684a3e5a37999b1c76', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17152, hash: '9f1036e2cd2463198d17f3a702e94b2fe158b03fb962621c9ec9283e2ec530b1', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 42826, hash: '0b7269b18e44e8d1daef1400524378bcaf77ee982077a89ee5239a7a94672a0d', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 33434, hash: 'a97dfa256e830100b01591869501d00d49e9f41116dafa061cc35b266ae2e835', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 34275, hash: '7e83260fefa1e0e66378ef518a5c6307feb806f69d565751a9afde3717f4cdd0', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 34864, hash: 'd5d4d37ecffa2a1353cab8c75836e207ade1a70d16c339f1382f9a9f73e47b9a', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 30864, hash: 'ab60051e7bba03e1e94168053fc0bb5c8345f3c13e27fde8ba7fd2a902f48260', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 31560, hash: '0982cfbfbfd64422f6dd145a4f97372ea1fe1a0f28766d53c38012f06779521a', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 30831, hash: 'e0bf68ccfec1ba70fc5b097c6d1327b8d39c94ee0fd52b0c8996a0a456948180', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 38707, hash: '1ef4e508e06f1bcb19375b9ef513c31237a3622368d43896570df9a14f7209b2', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 24270, hash: 'd4e1939e8ec6236ef465e0bf4247ec6400199a7e0268d59bcf16362b8090b8a8', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 31006, hash: 'a15aaa0f854e422f117787fa6eccac3fe567f9a03537842193b3aa8d899d6697', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 40221, hash: '8690a1da9ca0009f8097d05f354d6f48b32ad7162fd86ada96e4f45777014517', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 36170, hash: 'da22abd4795dc47003bfd814ed8f7b61177af6cf5ec4dd53e72b854ca1ee0caa', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 51107, hash: 'fd0b1c8612c92600093cb470d3afdf9690201679884ff13d4272eebe71d43740', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'file-editor/index.html': {size: 40479, hash: '84e0345f3dedfc199a857db076dca4d4681768882e463847b329b7bbe4496a90', text: () => import('./assets-chunks/file-editor_index_html.mjs').then(m => m.default)},
    'styles-ZZB5FV3S.css': {size: 9528, hash: '3l+z/03bYiA', text: () => import('./assets-chunks/styles-ZZB5FV3S_css.mjs').then(m => m.default)}
  },
};
