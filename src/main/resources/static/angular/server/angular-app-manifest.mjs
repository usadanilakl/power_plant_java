
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
    'index.csr.html': {size: 23674, hash: 'aa6c19f6378023b8b3a73e611dc57ce75d8ea61c0f3bbfe6d78c06a14591c4b7', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17152, hash: 'd1aa244258f1dc126ee2a9a7189695467ef9e219534fd9fd79de28bdd319a3a9', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 45877, hash: '988a5710331fcae788c7d21c0b541f64b11e9e75be1c9f3cde9249a714fb902f', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 53109, hash: '2170e0a7ece6a944e1f1c15b995a071b707536168fabf0e8c0b73c91f443d82f', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 53733, hash: 'c5e87f426a038ad407c3320ccf20aa3cfd916145c80e6b8181f6ab9581b5b95b', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 53691, hash: 'e0ba3d8aba6bbb805c5e78aaa9e162dc57649ffdb214eb11f0a2033c427630ff', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 51313, hash: '53839bf83688d9b88e6f53244dd38401df3f496a3fe63d6695fb6e99a9c1f887', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/loto-standard/index.html': {size: 53358, hash: 'b253a0ed3dba4f44b65a18c28c65dd9879bcc5e7432329a7a27eeeaf1b22244c', text: () => import('./assets-chunks/loto_loto-standard_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 40691, hash: 'c9380c1434989ccad3961974529f262acc664e8965e4b891baecb0a1c4f492ff', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 51285, hash: 'b30d366b9e95d0e84e89afec56db31eafcdd7ba5cc674e8059f0110c29b44c02', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 33696, hash: '87d945aad9603ca5554bd5be06e0726b4cca308b1365efde87875025b1417d22', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 24270, hash: 'e9a9837c69eb588b06fc0179e92878df52b7474673ba763c82542108bf028788', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 31006, hash: 'a15c122bc9175209ad1c5b871b3dfdb0364a9301060ca9b9ea1671970230da67', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 36165, hash: '828625a4f7668193b7c902b27843c3b9e535fe0364c577d5371dcbeb38fa2915', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 56508, hash: '1b9f5b363509a7df0d4415c3d0f9420410539f4692195bc3c8c797e1ea9dc5b1', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 42344, hash: '4bfc1b84aedf005273eca4c9aa8d58d8642cfc79e3389068ae1c0be00e01098d', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'file-editor/index.html': {size: 45884, hash: '62414e7f22efda6cb9451008c7b16b7670058338bc9a6d2ded35641b835da6a2', text: () => import('./assets-chunks/file-editor_index_html.mjs').then(m => m.default)},
    'styles-WVLSSJOW.css': {size: 9627, hash: 'm5kLIVbtCdo', text: () => import('./assets-chunks/styles-WVLSSJOW_css.mjs').then(m => m.default)}
  },
};
