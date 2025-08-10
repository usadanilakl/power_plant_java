
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
    'index.csr.html': {size: 23674, hash: '103226d021762e00b74129d3615c65ac25ed9f9deec058820d6e1c6eff45e3ad', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17152, hash: '4c5c0b1c10726081ec44ffa875190626096280ef6eb181cc4d804c7564582626', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 43801, hash: '1d305e4a7aeefab2d837245ee4ac1c5ebdadfb155a96dc8c0a568744edfc3e3e', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto-standard/index.html': {size: 45852, hash: '02b2067b83d0037c49046199364cd66e6bd5b6b006a8e30eef9a3e98494d9598', text: () => import('./assets-chunks/loto_loto-standard_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 50510, hash: '30ba517b9fa8f941fc81c9c4c97e0c77dffb1c1f697c4af26b1ede98fb7b5718', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 50472, hash: '7e5dc4a6b9973526ea13eea52765817086921234326fabb19afccc49dde0346c', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 48057, hash: '8290242b349007c72e68ab2bf39927924aa8e0107a7bece7de1c5945c5bfb15a', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 48029, hash: '8e79439842773539fa165b056601f199ef6233d97d05e03e241669b2476a3c6d', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 31665, hash: 'e1fa83364c873c2511456a42c5e9c2398c358b6408f817654aa889577648a891', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 24270, hash: 'e9544fe6b6170c0989e07b7db5f431e9ec347eae1327cec93441a1662dc2d68e', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 38677, hash: '0c9c9868d4d843cfa1fd7698e74add5d25eedd659a16fdfe7b599bf3535ce8e8', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 51936, hash: '7187b944628eebc0a6c52f621a31da62b8c961a6303d1a2bfc60b3e1fb7ec6b2', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 31006, hash: '0027a3a13993556c8b23a4d744732c23b0a406a380198bab61ff6521100f62ae', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 36165, hash: '2e124d5019cac235ac817ada9eb22c4940967a235e4a936e99cb01339a2ef24e', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 40322, hash: '4e61f56456566e0697333d1c15761e2790eab46dae22b1fbea20144ad7699877', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 49886, hash: 'aebadb3de0f6ba3c99cca84be58af0776ad867590495ab040ddc25e170017917', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'file-editor/index.html': {size: 41312, hash: 'b1a8d82290b6bbd7611c88832c6b83b0053818f32799e0baac1fad4d7bdca302', text: () => import('./assets-chunks/file-editor_index_html.mjs').then(m => m.default)},
    'styles-ZZB5FV3S.css': {size: 9528, hash: '3l+z/03bYiA', text: () => import('./assets-chunks/styles-ZZB5FV3S_css.mjs').then(m => m.default)}
  },
};
