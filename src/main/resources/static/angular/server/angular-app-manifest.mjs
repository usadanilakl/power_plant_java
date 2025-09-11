
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
    'index.csr.html': {size: 23674, hash: '1f8fe2766ac58276ca7d0e6f47bb6c6061a08c8d48be2a9150ae31ee2091c852', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17152, hash: '784f236dd526c42561d87720ca44a3b040df0882059c3c5df7000e88948448a1', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 46674, hash: '78257500f4e213c1a5c11d48cf21b53ea2bdd8d6622247b5c77a5affcee8baba', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 48894, hash: '70517627c4c90b537e83fab0abb568baf4355e4c1512e9a5a776122c48f6beb4', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 43082, hash: 'ea7fc69df13bccb12f8bdb2d0ce97e07d28be479cb91bb702f903613c3e28c06', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 43658, hash: '5ba1021bf307d7c0acde4e812d650e0af97b09e89d33bea91bd975ea576df402', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 39379, hash: 'e50681bf53b4ab3778b9eddfbeb7aed4e2bc7e8231f1672f789ceee17f1a7d40', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/loto-standard/index.html': {size: 47425, hash: 'e596742c39f4290483dd63354fdb71c8727ac8e629b439da979f9b8b33c4e5f2', text: () => import('./assets-chunks/loto_loto-standard_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 41735, hash: '464431220effa1d30928a261f1f6de86a8987cbdd061f9116c0c0b4e150c1871', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 39342, hash: '1d2459a6f1ec3be0ab983d9d7ed6c97877b9ba5ed0f405dafa6ed700598e4df4', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 24270, hash: 'f49ff82e5f126ecc212639d95bbf2de63155e16f0b6bda52359ffeec99d25380', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 34155, hash: '521fdeda592bfabdcebf0c42e30223920172322f9ce86b3e05f520d5ce16583a', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 32281, hash: '1336f72fa4dea523f0d2d3bd7f1accd35ceec40c3b4185ae7a217988f7a89e6b', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 31146, hash: 'b3dab9250c5ac82a317919ca67ce56bd6235e1fc08bd589c938f5bae2726ef33', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 36339, hash: '8b30fc2fe2f4deaf3d8b5a67c97b2fcfeddd3b32a5dd6592d9f11240df485cec', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 46220, hash: 'e8752bdc2940dbcc67671824e87fb38a1612e5e4e7edcc60f3e586c4149e36d1', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 40276, hash: 'c5e409e9e207dee86508c5a3570861666180274eac23ed207c084ae7143e3756', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 43004, hash: '235f74d7b98dd1ab88dc70a062e3b90aa5e286086a2c41fa0b553bcc75b9930d', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 56977, hash: '4c36edbc386562a0a10ebf2aeb30213fec324f12652c8ac2a88590f6f7bcfd3e', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'styles-WVLSSJOW.css': {size: 9627, hash: 'm5kLIVbtCdo', text: () => import('./assets-chunks/styles-WVLSSJOW_css.mjs').then(m => m.default)}
  },
};
