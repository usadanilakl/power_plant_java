
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
    "route": "/angular/browser/loto/loto-boxes-grid"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/loto/locks"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/loto/esp-devices"
  },
  {
    "renderMode": 2,
    "redirectTo": "/angular/browser/loto-points/table",
    "route": "/angular/browser/loto-points"
  },
  {
    "renderMode": 1,
    "route": "/angular/browser/loto-points/table"
  },
  {
    "renderMode": 1,
    "route": "/angular/browser/loto-points/*"
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
    "redirectTo": "/angular/browser/permit-builder/daily-packages",
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
    "renderMode": 1,
    "route": "/angular/browser/permit-builder/daily-packages/re-issue/*"
  },
  {
    "renderMode": 1,
    "route": "/angular/browser/permit-builder/daily-packages/*"
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
    'index.csr.html': {size: 24527, hash: '3bc26fd3032fd52555572e27dbf31bd3dca88ae00e2ef3fcff715c2542391272', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17152, hash: '04d0295f208bdc80e46675385c1542eb6e90c770e1212a67f0f0c85c4c9bb149', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 60688, hash: 'f5ea09be58df50f04489db7f0e9db9f2466ef32e91ffab24027983b6106afa67', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 59437, hash: '853e8a554364e9d29260a2ad6c3450064c127c9884f0dc3c3a0e2f3565d9e34e', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'loto/loto-standard/index.html': {size: 60228, hash: '9127734b2afb90b5433f9e8c4340f07b910e8ad26e06add1b785261e3e7bec2e', text: () => import('./assets-chunks/loto_loto-standard_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 60019, hash: '34d10edcd8cb93ac3efa8d4102394afaa31dc85d7712da6d73c52f2eb03a0325', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 55577, hash: 'b04c16b971644fdf35ce9fe4e2e2f7c3a1ca836d0d395a83f80313502d1cd417', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes-grid/index.html': {size: 67819, hash: '10fa6dd6566f5f2ec1b9b9b01d78121b7ef39b5f1b10a411a662305c23624a1f', text: () => import('./assets-chunks/loto_loto-boxes-grid_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 55544, hash: '54a8d6b75bab0b88df032ea282a03c97ecc0b929cba36649ee31d1738efab6b1', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto/esp-devices/index.html': {size: 57334, hash: '7e22112668dcb95f8896ea29aa1f1e693f48b07d86ab33b27c25c21264eb798e', text: () => import('./assets-chunks/loto_esp-devices_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 26309, hash: '9ffe3f1f0cfbebfba2f07c030e9e786c0cfcb34a1e495b9a2e5e40dac3366b7b', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 36298, hash: '5539d499c888658515fca357e83482b83168ad467197d0e4f36ef5ed688913a3', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 33327, hash: '796fc14f620cf987ab4b84915a51654252333b0b0b2c7dcd9032cfbe3d2758d4', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 42920, hash: '21dab6b610002640c34bea119384ed0299efb689a6b4aa8f8c71d6e8d6715e90', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 59743, hash: '800d76987690ed7c19e74ba78b4a172ddeec8fe250f5b594dc93214eb402d13a', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 62199, hash: '4d81b94c9313cb6a2979614da46c27a0c205c83746904fd8b5eddb1a29c187f0', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 52042, hash: 'c153a69116a8702578296b12dbc5284d2a539f599b1d64a4097ef3e7439c70ae', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 52433, hash: '30b0c6ae68872e33cf3b6834adebd5740dd4872b07e35cd39d2205fd92025380', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 52469, hash: '022bb3ff438d1e3a464dcc9411bbdd3f06cb6e77a77ce03af4fd85f16d1dd019', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 45668, hash: '97e3bb94411e8ae690bcd6a90214bb6f665d5145208274c5414631e680f89905', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 49283, hash: 'fa6de39907260ddc98fe90401d58b70e43991b491d650b704ec2b5073a2d261d', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 52630, hash: '654ff69e5a86839e72ee98a55acbb0b4c426a43c4893f62332dabb6e6fae5777', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'form-designer/perview/index.html': {size: 51258, hash: '3dd8c947b9f517f5dc99d957d091e4a233fd09c33e2c9906da011bb9ebaf714d', text: () => import('./assets-chunks/form-designer_perview_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 65327, hash: 'c83b005112cf8eb74f42d5b909f5b3a1536fab957e0b2b356e8ff7f09003f72c', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 75066, hash: 'cdce10f81e6936f3bbb33457a1c1c428abc106e345a5e6dbfb2d7c1262630471', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 81640, hash: '899bf7ef98cd03f9166650212051086e46396a2a3c9b011b9107fbeeee80239f', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'styles-GW2G6IRD.css': {size: 12481, hash: 'yOYDpS0q7Rc', text: () => import('./assets-chunks/styles-GW2G6IRD_css.mjs').then(m => m.default)}
  },
};
