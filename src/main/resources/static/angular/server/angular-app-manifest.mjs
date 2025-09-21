
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
    'index.csr.html': {size: 23674, hash: 'a31d7bc0ab603b003d224b44cc1f6968ae1551bbb5cd249c4c8ca128afd81a6b', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17152, hash: 'dde81a475e61eb685fdaba1eb483638263f145e18e12ed5aa95e5ff4d176cfaa', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 46280, hash: '1fe7bab24bab784920f3683b6f761d2f362806e243170d0ab0da2cc879e23bcd', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 49033, hash: 'a7adcc0369b2011fad5ec126d3bf550ca4b2fb09a3cf145eb612ea113594f896', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 43897, hash: '2d152d2d017113efe15b9975d4f18898f46b675d38d00f37f49d85b969a5a2a0', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 43321, hash: '9f81ba9d2eaf619a1ce1c3e9d0c914cbf5d00b12fefc440ce6890ca29db8663f', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 39514, hash: 'ceda90a291916a1efcd79067e91636e92e0c5a912f6a5569f7d898d73006dc96', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 39485, hash: '3392bd235f0bd481e1441f06a070f0c05be75405747f36e0803455dea38f090e', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 41972, hash: '586b87bfd60b3d358667f433553924c2634f5b0081f9d345e0c51439e873bfef', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 34259, hash: '438300e5ca3c7ccdfc6d1a25859f599e41741f8cdd28cb97e5a78e2bc20eeef3', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 24270, hash: '56bdde0f0132a69d8b004627ee261bd34b78f87d2a88101fdf6f881c893cdb7b', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 32774, hash: '5c5f2c9a0372c4277eb89b28b0ba22193bef6298fbbc147ae0135fb65d610f25', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 31285, hash: '1f7424563649cb31056a013b1c407e13a98607bd43bcf9ec17ff8d831586439f', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 43596, hash: '941cfaea609fa6060dc464e2034a0e6aaa30e649647113efa4b898d77ec47761', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 57235, hash: '4286a58f811da5f627803ed65649981a9aedac9d83d3fcbbf1fd1aea320ef14e', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 49597, hash: 'c5c832aebca881fd8af08c05674025004245c5603d95b408cf29d987e2d4c588', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 42324, hash: 'd0f2ce44e0d5cc50d4a539c229da12178afe5636fe0cc139439199ce5d5b0762', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 42280, hash: '515e4f5093f4420e3862e00386991f799e8419a599fdfcd00946677e77c3941a', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 41904, hash: 'ef070d025f1a437b638b0be8e13446a67c6fc125616d482858315ab1d4d449a8', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 42613, hash: 'dd80adb071e1be1115480714c362961e3df91f10ca50e4b156d89d8ec9b0c3dd', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'loto/loto-standard/index.html': {size: 47564, hash: '196d3eebb299ba3f0262a0e89b180daa3c206716dc0fac229e755a3ae8611471', text: () => import('./assets-chunks/loto_loto-standard_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 36478, hash: '928ddeed187d7a278c46f107652d531bff3a27494aa52f7ce0f12f4ab6e42045', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 39136, hash: '464956973de2ca22f300345834262a3c3d0121cd4ee5ee90b9ef78e7f59e66d2', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'form-designer/perview/index.html': {size: 41072, hash: '9e32d6a43ec4f380d1326ef839c40e1d1af8a018b34f9cbd88323f60cc6551dd', text: () => import('./assets-chunks/form-designer_perview_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 55156, hash: 'be4ce670669ebc09627b4d850b0f03e45e85fa1cdce6ac332c0deeb92a0a7434', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'styles-WVLSSJOW.css': {size: 9627, hash: 'm5kLIVbtCdo', text: () => import('./assets-chunks/styles-WVLSSJOW_css.mjs').then(m => m.default)}
  },
};
