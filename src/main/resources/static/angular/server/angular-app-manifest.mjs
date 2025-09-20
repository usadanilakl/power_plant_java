
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
    "route": "/angular/browser/permit-builder/safe-works"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/permit-builder/hot-works"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/permit-builder/confined-spaces"
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
  },
  {
    "renderMode": 2,
    "redirectTo": "/angular/browser/form-designer/forms",
    "route": "/angular/browser/form-designer"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/form-designer/forms"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/form-designer/perview"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/form-designer/design"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 23674, hash: 'b7b18febb672d3c81ca847f94e47b58230fead185e78886f7670e6ffb5f06ad4', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17152, hash: '49dea3187110d21a0a8d8baa65943104f47bdb473e5e489d248c20962d59b557', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 46826, hash: '68403684a4511b9dd56be015b418dcb83b85b7bee5369ccb62c75b14cbc7c409', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 49033, hash: '4bc8c7d23ac86371d25ed1381eca943bb06ee7a5935997a2e1d8713109662324', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-standard/index.html': {size: 47571, hash: '5fef2ee460864c760bc69df009e150246894733d8c0414fbb4afa528e0a40512', text: () => import('./assets-chunks/loto_loto-standard_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 43230, hash: 'c1287992753a3185bf3d28e66ad365795a2991b3d65b4525e95148a9650a3cb2', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 39518, hash: '76df8d848eb714a938f8f34d6312658bd7d3d8c7ecf6f56b5645445bbee3eb88', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 41887, hash: 'd644b96f563972cc757499b5e8d24a7125606364278b65ca3f659700ebd442c4', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 39481, hash: 'c2c560ae8c991a5b742b4677625bf5367bb4e3e009f305e71b8b76c2639e07b8', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 24270, hash: '0eb8bf1e458e2743881e33208a49e4588c25cacc60f32e65eb871c4969ed68b1', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 34172, hash: 'ef91aa90ba895e170342649e8be4b8f76c23d140ea5492fb852afad0fd58bd8c', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 32774, hash: 'd492f6b745ef068c24a566e0aff008abe16301a7323f5d2de553c23f2ee3ac0a', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 31285, hash: '3d9692e12f63387d8d39e6ac92bf4f2f3071b41d7e43e43107b87d0b1618e6c5', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 49599, hash: '3aa8ca9e91e65f7724293bd39642368a09e44d1e354e63db4c60525a6e35fa7f', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 43596, hash: 'aa0db0a29da26952c04878b9d4ac248d772da68b0a07f0787a1d85026d3c702e', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 42280, hash: '5d7aa2640a975bbb84ad3c3d80658d90d58df74e37230c31c8823d312b4695bd', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 41902, hash: 'f8d822c9314a405169e1df90b89258e67f7a646b4ab6bdb7bcc0914524e894b7', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 43808, hash: 'aeadc603b69a410102de37358f2fa399390cf93e039ce8b35efde5a7c16d8358', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 42326, hash: 'bd5d54f97c81a48cb0e68adff9db6f229ba6f0b96f07fbdffdba10861e796abb', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 43154, hash: '36fe5ca3d0f9f729ff92ac809162803e9d72df9f8fb75255a11572427341d255', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 36478, hash: '73fe6ff613b3c0b2e2ceb2f1619aef509ca342aae63c850661f94618347a2318', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 39136, hash: '1e414caa1a55981e1ef47418ac82673c7e32f6186db05b28052f99c3e55059a8', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 57148, hash: '8b7bfc61d1796dace8bc8e34698c8098d23017d2fa35d62b13d45a37bd40febf', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'form-designer/perview/index.html': {size: 41164, hash: 'bd84c009a89839d68324820e47e2bf81353d2cd1a3ba9726934610f8ebd39553', text: () => import('./assets-chunks/form-designer_perview_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 55070, hash: '67281dacb143431d0e045380599d3617b406ea41c33224d6ac98ad5e9b35236b', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'styles-WVLSSJOW.css': {size: 9627, hash: 'm5kLIVbtCdo', text: () => import('./assets-chunks/styles-WVLSSJOW_css.mjs').then(m => m.default)}
  },
};
