
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
    "redirectTo": "/angular/browser/permit-builder/jobs",
    "route": "/angular/browser/permit-builder"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/permit-builder/jobs"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/permit-builder/work-requests"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/permit-builder/daily-packages"
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
    'index.csr.html': {size: 23674, hash: '41c283acf491884860db92bfc9742914cac6c5e429408ddb449651ec999c2b0c', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17152, hash: '3760569682e50714daf4091d18eac9fb65eaace454c843d3df15ab752bf3ec68', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 46674, hash: 'eebd5ad54a74e7cf798a72ef9bcada6927e203f92861b255d998350959029ee3', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto-standard/index.html': {size: 47432, hash: '6d9f776ffc3dd7d14fa7162020587848ac6535afc49bb4570f39a8e4296501c6', text: () => import('./assets-chunks/loto_loto-standard_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 43082, hash: '919c60a38ef4cf5e1ae3729040874d9a26c26cd24d8ef730692b6fc6e2cf08a3', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 48894, hash: '5b4cd3572778f6fa7e563a27e2056c0e293072c8f2fdc8c3dc0bc1d0eaad3e24', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 39379, hash: '56334ad694fac1b91da5e343f9dfb685988befd3307f7455136bd93d7c6ef9ea', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 41735, hash: '840e3f360fd7a035b78954a369e75f0fb44f4f00750c85ffcbd769e216d02cc3', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 39342, hash: '8874c8b97170445cc550d25a3f8b925bc52c3a606004e85d7f1b9c66a22a2746', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 24270, hash: '0de59a70a51638e48680359177413af698d6f943730c6c5ede66a59abc82acb7', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 34159, hash: 'b628cc5faf42cac265857610ba2b76d3b0d4ea768dd21717e28706dcae11c5ee', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 32281, hash: '78d8f7831896daba992e3f7d83bcbcdf9ce209dc8ac7b3d933a35e535393ec88', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 31146, hash: '85e6ef1e5475216d718b2de5135a2c01b9d1396d8f186ca13149f4eaff0f286c', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 46224, hash: '6b42f32cd0d36cf4b253fb9aafca82f55ed3868f83ee1894678097df4b903cc4', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 36339, hash: '28785878eb4b619296c60a87b5209674cf9bb7d8bbeb5c61e5014cf99e3059ed', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 43656, hash: '664808c399c2f9101a1c9080e24c1dd904b03fc8140377c8b175e857836bb756', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 40276, hash: '244d586e8253fe62218efd3b46e261e0cad60504d2acb7ee6a5d524494f18e19', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 43006, hash: '88f0e2d5c14a958315c90937195f56caa162884a4497502dbdecc141a44186a9', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 56977, hash: '7e0341cc6333ec298e33bdd3803a7d558cedfb38465c042291907263c8513759', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'styles-WVLSSJOW.css': {size: 9627, hash: 'm5kLIVbtCdo', text: () => import('./assets-chunks/styles-WVLSSJOW_css.mjs').then(m => m.default)}
  },
};
