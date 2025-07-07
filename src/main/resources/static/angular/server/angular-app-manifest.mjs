
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
    'index.csr.html': {size: 23674, hash: 'dabd7cd760106804ac949e8040eeff638b0df389d9d89402c0410792228ecd4d', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17152, hash: 'd906daf454096ee2160a908a636b3f0ce0126833ffc55bca08eb41f50fa21fac', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 42678, hash: 'b2008ecfcd442c1af40bff0087b2d7170aeea467f91e2222522c288819e0ab51', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 34864, hash: 'b32c10e9cc595e9fadf6ff2cf6d8a5fd8170db746e7fc38514e7d840a63b388c', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 33434, hash: '6ae8dccd4f2b6f725b13bedb9a7a50e720ed91b7570a1e72d3fe81bd35e667e0', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 30872, hash: '05ce0dd62de15e5e473a69d57c7e16cc0f420ff82f5ebac948242a2b3743f512', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 50797, hash: '4034818eecced0a7577c0c2a1a1428a9d94e22fdce7c2233f2c27bb7b02cb47c', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 31565, hash: '71ee07fa29f2cf359b0fdd8072d6a1ac924df785e06942f2d778004b5462bc6d', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 30831, hash: 'bb0337b0664b83d82350e765443c72e98da8993444b93c8e328581ebe22f802d', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 38577, hash: 'fe6bb9163dbe90149a5dc47a49268bd1506443638778dd7a966f64a05b29ffaf', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 24270, hash: '1fc3726e25204fd9efd779c127ae525770def87fd43f4c15d392d9840a515843', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 30875, hash: 'd2ba92894c2b23f931b023bcc6e747af12207a58d148a9ab4458d4724d869eb7', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 34275, hash: 'c98483a5c21f37deaf99680bbab019c4d0b05625edbe6d1afeccb9343b0ae297', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'file-editor/index.html': {size: 40317, hash: 'eb9f9cf53f3bb659253731edcb945341aa23f8f039bbbd80f78e65aa5dc8225e', text: () => import('./assets-chunks/file-editor_index_html.mjs').then(m => m.default)},
    'styles-ZZB5FV3S.css': {size: 9528, hash: '3l+z/03bYiA', text: () => import('./assets-chunks/styles-ZZB5FV3S_css.mjs').then(m => m.default)}
  },
};
