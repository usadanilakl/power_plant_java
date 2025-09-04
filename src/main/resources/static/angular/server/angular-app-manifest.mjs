
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
    'index.csr.html': {size: 23674, hash: '88a682e8d5ee835e1f41e029bf976c14e0df9bee8794e8e557c79a4da569aaf9', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17152, hash: '36af061d0105cf9934c7212c333e8901b163189362c25f85ab64cf62b461a7a1', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 46501, hash: '2dd44fa5c220e4a1703f96c25ba3188ed7cdc103867e9f2a2316302855273dbd', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 48754, hash: 'b881bf6988f17c1c0f2e7b3230b2f13006dcd59f0807ff1a902db05cbeec27fa', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 42909, hash: 'c2e3a5b3b680e08c3511a93234e4a57dbf74d7257ceb44778c49a46e6f40fc85', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 43485, hash: 'f4f13d9393830e67137a1e6730587f920c03cbae44c4d266fe43fc9d291b007b', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 39239, hash: '08c2b7ab473f67fb113e5f776971523884f41e21535b889b6978762b96ed6333', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 39202, hash: '00d0d397f38e1ed094cac5bff6eacb23565abf740ac65e492e67d3d9c47f45be', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 41562, hash: '5712ce0d8378720f3537fcc9db45180d2327671131157fe05b54e79697acf400', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 56804, hash: 'd47063db7802711167001754b07b2082d0af9ca0ea9d3e6c16fd63a1a2da1b12', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 24270, hash: 'd30780dad75c1c739c4be3743973f88a6410d175f9f6eb8ccf393d844b1d8084', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 34124, hash: '8c4c8be9464107449cde3f9484fa64880c8d4e328164a282d592e72d46ea3dac', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 36199, hash: '62b05061f0364449a389e50c84c7e1d64f8dff9779b154ef3a861a463e7180ad', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 31006, hash: '73923c727de34ff394fa78074a885cf8691ff15359d26bd841462d36fcf4abcd', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'loto/loto-standard/index.html': {size: 47285, hash: '63142f91490feae852750559e4971b0f6fd05f9899b6387e957eba6f2be341c8', text: () => import('./assets-chunks/loto_loto-standard_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 42831, hash: 'a649f46bfbe1f240c671c3a870849ad9620883f074594acc0b1464b7a2329a0e', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'file-editor/index.html': {size: 46010, hash: '9bc385a32398f887316edac5c3836e0a660b461c0053bee8d0e3377c60d6c905', text: () => import('./assets-chunks/file-editor_index_html.mjs').then(m => m.default)},
    'styles-WVLSSJOW.css': {size: 9627, hash: 'm5kLIVbtCdo', text: () => import('./assets-chunks/styles-WVLSSJOW_css.mjs').then(m => m.default)}
  },
};
