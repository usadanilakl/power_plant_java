
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
    'index.csr.html': {size: 23674, hash: '47cc644a4e8696de79f3ec11758991f16ae286b447f634cd00449a1f87be8ff9', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17152, hash: '7dd8caa8052056f9488dcdd20dece1f210d298723391ca66af0b8d5b975c134e', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 46813, hash: 'a6d912560474f74d8f2642d85885764d7025e4b51acc0849fd076826b484857c', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 49033, hash: '70f8aa7ec5a8bcca1b7948e72ec9603f18a0d1e2cbbccecd0ef5ea02498df298', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 43221, hash: 'abd091b378b01c99150c3d5436de50a3bd5e3f5b169636472f1a6c53b57aa235', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 43797, hash: '2a2cdc3e2d88e3ef84631442923913e752636ed78a5778a0b58afe4a1fa280b2', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 39518, hash: '953ea48bee3d997c29f70c43580253b06e694cc8ad5efc6a850b70a24e66392a', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 39481, hash: 'a00760566a936b9b2319faff08518f574c0b3759cd49a72f7234b54969080b8d', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 41874, hash: 'a8ef2360e9b31f07dfcb793969f20b6f825d3c805d0848fbcd97d71cefc9af8f', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 34157, hash: '740d5de00fe8498224632e6cde332cf55a4a6dae8e0f5d0f8618b2a58287df22', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 24270, hash: '68932cf33fc09d3d0556d74e11583b96e2114751d76c36041f3bf35eb0e45a39', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 32774, hash: '77918633c417bd1f0e64423b3cf42014d0e89a8832eb557c4daa5887b398f82b', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'loto/loto-standard/index.html': {size: 47564, hash: 'e9d8f8811076a99c5e97b4d397bcc6c83ccbbb6bd5d5f11fa1adba038d5dc578', text: () => import('./assets-chunks/loto_loto-standard_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 31285, hash: '681053b420c1241f78ebfaa4902f8a0aa4e06506f9ef841f3cfca6e7dc766077', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 41949, hash: 'cc2c65788ba56d4f907ee91d062c0330fd74d642635b925ba9db1ae777d84b4f', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 48913, hash: 'a55891a293ffa9d06bdb071ac48f7789ae1e505fc085659a0f0bb5394b552669', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 39955, hash: '3b6540027c77415015c1f5e32b8b3bca3331fca151017d2fb63e7e9717f5cf24', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 36478, hash: '6b719227aaf8b21537bd2036b2c2f4f7b2c634c3e1dc84184ce462e35564c01c', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 41992, hash: '09827afa155c431cc9b13b10cc54c63135da00b5e103d360970faf34b7957ec5', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 41568, hash: 'bbc18e83a84836e507ce6ab63a662d3d3df6bc0a24c5742c09a4ade95158dec9', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 57116, hash: 'e114f983678f74f56589bd7784a68fb5f82dcea1429579cc2493290f712c8301', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 43141, hash: 'dbd538d2f70b69dd2bc4852dff3d5ad505acad70b8e1709741ab61ea1a9f5a9c', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 39104, hash: 'a604bd9a1f62e25d3708961d3c6ac29d8dbd724fb84ac6e6fa6e6a9343d5d093', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 54227, hash: '2c7f0813db0acdac600eb32abc001a2efd0861d1b231b01535a9c72cabfa4955', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'form-designer/perview/index.html': {size: 41132, hash: '0f78d261f7453a8d34694fe34673b3be06cc4c30cc915c0f6a444961d44a791c', text: () => import('./assets-chunks/form-designer_perview_index_html.mjs').then(m => m.default)},
    'styles-WVLSSJOW.css': {size: 9627, hash: 'm5kLIVbtCdo', text: () => import('./assets-chunks/styles-WVLSSJOW_css.mjs').then(m => m.default)}
  },
};
