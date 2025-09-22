
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
    'index.csr.html': {size: 23674, hash: '6e1969b9cea2ea97684d4adaa9f9be40cd598d0dd2ecaf71bfc365ca4511c464', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17152, hash: '9575779be6c7b06d43ba51be3943ac0091b1ef8ff74c3c7b84d9a70987cbbadf', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 46280, hash: 'd96918a397acfc9184ea2fc57a903dd5c64b6b317d242d4658eb2c5ddd00da52', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 49033, hash: 'c9b9a72683e06abc17ee84541b06678245fdcd9366a03ffa473f04f38a5262bc', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-standard/index.html': {size: 47571, hash: '4edfbb088c83b15afc29f5698129bc3142b177e6d78596cbefe4c45b5a959a7b', text: () => import('./assets-chunks/loto_loto-standard_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 43313, hash: '54cbe7c9b117ebdcd9792e3fa97cc1d6c51507f55781f7a31c0bd40680519245', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 39518, hash: '7d78a025242ebed9251e30f5c90f228d64f9979ab6114e4431efc59e83c8fcb9', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 39481, hash: '544bef738eef4fb4015d2126d929979b8dfe8a5c312313ad5c6f1979f2fd33bd', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 41970, hash: '07c4bfb13aa9fade81a23d33583f067b3eddaf713b27f3cb5b4b977a45b318b0', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 34257, hash: '0590b7ab311ca0bfbe9510a0d50daf068c6491fc97844ea292cf4d9388ac9b7e', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 24270, hash: 'a90cf12f342c415f136a3bea421bbeca514d9fe423d2eff901ab49a6ae1f6979', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 32774, hash: '50797eff86dec3c008e159dcc293340fb40727073545462e566ef49345d37086', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 31285, hash: '2ab99a93dd50e8b52b5d8f4340071d214c7792f9a23419a2aa96478d9bdf4897', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 49599, hash: 'cbeebd9bc1df0c0338fa065947e9fa74f7427cd7f808af70b7ef9ec28102a21c', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 43651, hash: '0e2b85ef9d0c41319b66823735c03a01b4fba8741ff2bba1f6e5cfe7670f888f', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 43891, hash: 'e23701ae96669cb9f831803c1b8c7ecc51edc13337caf14e755b68c2c8c0c487', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 42280, hash: '4de0b78b09115dff1602292a824c00201f1f8b4ce46707f49d8b76bb04eb2a1d', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 36478, hash: '38d24993e281c23d11055c71c1e148a844b1ded643f5202804da555f1518b14f', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 41902, hash: 'e94484180339c6f57bdf0ab823f5fd7f7abf1ba380ce4a0b0529d2f84a1b308b', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 42322, hash: 'ab6bfb307fb2e919dd1cbd8ae6b51dcd9d6c24433389952ab0e9473b2cc30f0e', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 42613, hash: 'f0fe8b769a2efca9ad208f052f56c2b4a04bbde85310734af3e5d52de4c08627', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 39136, hash: '54dc069eff1595855d5d2c74e5f5d5f25d9d45258c0a932400fe4fd365b52d21', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'form-designer/perview/index.html': {size: 41072, hash: '9aaa54f025856f5f8e0bb11fe9d69f3b430021bcc2fef133c9e52976fb59ed3d', text: () => import('./assets-chunks/form-designer_perview_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 57235, hash: '2136d7f6d325fed2952111b5c4ef9a29313482e0585a59b8752e76dc6993a900', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 55155, hash: '49b25c6a03b88047b7d7b9737dcc0853458fea66d2f3eaeb23f50c51f3cb3fa0', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'styles-WVLSSJOW.css': {size: 9627, hash: 'm5kLIVbtCdo', text: () => import('./assets-chunks/styles-WVLSSJOW_css.mjs').then(m => m.default)}
  },
};
