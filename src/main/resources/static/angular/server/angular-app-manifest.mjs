
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
    "route": "/angular/browser/loto/loto-standard"
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
    'index.csr.html': {size: 23674, hash: '9a59e43efd46d52d78251926b4737fd8b5c246f99cc00fe79d524e749e2ed05b', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17152, hash: 'e14aead7ee5e52e4f7d2d8262b62ef0e539454f76e2ac7303ccdcfca5fc44f1c', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 43801, hash: '52a5929dd677a582a22d886598001d62bdda0c1e496eefe64edd7c1abe44dafa', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 50510, hash: 'dda961fd211468c5f7be0c989677aa1d4e0b9bcaa41a6d4eca49f110e7bf79ee', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 49891, hash: 'd77bb43d9cc0bc6916043e8a4d8ecf19f3fc4154e2d312bdd761ce752bdd5051', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 48062, hash: 'aa756dfc0e28fcc225946dc2fbfc5b0d788b590d11aaa68c02c09bd14bdb4b70', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 50467, hash: '51373bf7fbb86cd1f676f7a08e13271c554bafb6b4e4073da2c78638f52e3bbf', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 38677, hash: 'd3b13fc5f5259e5d0b238e71b04084196cb267a4c93bb5cd64f7fb5b6a8ac44d', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 48029, hash: 'a7d154977068c7d238feeccd647a6bfaec3ea30a5eac05c7ce7e22f5e4da06ef', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 24270, hash: '1653979c9549898d8aba1122d17545b8898adec2c6cb995fcab7294192f66450', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 31665, hash: 'a2bfcb543ce09bd7cc9ff38e5df3e778e8de85225500b852f6b1203bb5dfdc84', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 31006, hash: '64fabab7d998ddd6ff41d5c66adb250c74b7b495a6f58909e25536c3e01cebee', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 36165, hash: '9ec65acbcab0061075f546156da96371d754f925293b9cdf9483a8939fff3fb1', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'loto/loto-standard/index.html': {size: 45847, hash: '195fb0e523e2188048f6fad2c1b6484663fb1243d1c9e873056305b3d67dae3c', text: () => import('./assets-chunks/loto_loto-standard_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 51936, hash: '8abd68fd8a0623d848bfa0a9fecdf76a9c952e8def3986dec103dbd8142a881e', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 40322, hash: '25f8a40b78bd2931a9778fe1089144217c433b992bc5755a97b765171159a587', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'file-editor/index.html': {size: 41312, hash: '4a4559b62a14b8cef32b615bf47e0dc90ce9ebdd8c2c50fe4e7be8fb0e63c9ba', text: () => import('./assets-chunks/file-editor_index_html.mjs').then(m => m.default)},
    'styles-ZZB5FV3S.css': {size: 9528, hash: '3l+z/03bYiA', text: () => import('./assets-chunks/styles-ZZB5FV3S_css.mjs').then(m => m.default)}
  },
};
