
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
    'index.csr.html': {size: 23674, hash: 'b24b4f0519f05aba1dd1f1e28c041a885a3d5d2dbfa3cfd9bde3d648bff718a6', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17152, hash: 'c833fdd925aed96b71475bdc64ea84d76d69a95f7195844c6ba6915c99ed3bb4', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 46418, hash: '49d05123b79a1cdeb730523a69397d28b2f9c9759df2547f10a6d6b34090f038', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 46803, hash: 'c6dc26dedcbd93baf96208a70437f2311c746fb56e146e8ca075d13e805e98ea', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-standard/index.html': {size: 47288, hash: '9cc45225735c33f7a3e3b4484651575d55a0959e8c4e43f7ea61029926efc19f', text: () => import('./assets-chunks/loto_loto-standard_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 48488, hash: '84e41c2f506c02bbd26a0d11b7bd95c1f0e4d5bead99eecc012ea81e9ce66bd9', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 47919, hash: '75fbdfea3e4961a6387b993915c56c88898ebfb12051c94c14a5f190312234d2', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 41562, hash: '438c1b64ea6b29a03b4f5d2e22e3fa16e463a9d8ca3953f381f045463eb2dce6', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 44073, hash: 'd8cfa8248560dc50844830d409896aed64fc71e76fb7c8a06b0ce64b45460fad', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 44106, hash: '76ba84ed43c2b77601ce903853bf6d247464ccb5d5d6137299f129146dea65c5', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 24270, hash: 'bbb7f2603772204612d1ea9aa73b40368161a98f9553498a714b1861c639b858', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 34126, hash: '12d7e5438502832fded09b33932456be876e4650480239d7793e5a833923cee3', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 31006, hash: '1669d1fcf03ebc181c1cdc28ca4f325db2a68c1c48afe7c39c4ff6d5a397cdeb', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 36199, hash: '04bbcb94447c8c065db442641c3d48ab2e54cb7da1a12fc7d6039b95bcc642b6', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 42828, hash: '755e6a7985dc72f827d213b78892c2e86fe8f70070ab786429d93aeccf1c9b7f', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 56721, hash: '2a17618c116504f7100fdd56238195a2f7a8f660595fcd89bfe74770f4f88a0a', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'file-editor/index.html': {size: 46011, hash: '6817022514f79e77d5a7bf8ead4d1a4fd611d4f87f6ffc46716412b379fb6bbb', text: () => import('./assets-chunks/file-editor_index_html.mjs').then(m => m.default)},
    'styles-WVLSSJOW.css': {size: 9627, hash: 'm5kLIVbtCdo', text: () => import('./assets-chunks/styles-WVLSSJOW_css.mjs').then(m => m.default)}
  },
};
