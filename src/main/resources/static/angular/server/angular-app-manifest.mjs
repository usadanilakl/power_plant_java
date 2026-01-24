
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/angular/browser/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "redirectTo": "/angular/browser/home",
    "route": "/angular/browser"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/home"
  },
  {
    "renderMode": 2,
    "redirectTo": "/angular/browser/file/edit",
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
    "route": "/angular/browser/loto-standard"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/loto-builder"
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
    "route": "/angular/browser/form-designer/preview"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/form-designer/design"
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
    "route": "/angular/browser/admin"
  },
  {
    "renderMode": 1,
    "route": "/angular/browser/sync"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/sync-test"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/sync-resync"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 25137, hash: '2f6226cb952b39a86e1807848b7721cba29fa166a0c9aab560845ececafd8f75', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17254, hash: 'b28822bb94b5b84092e7cd889cdb7a71ff24a2a94d442301084f632821360cef', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'home/index.html': {size: 125970, hash: 'f67b89539d6a7259451137a2d921dc093b689810246822885bf21db6cfa290b9', text: () => import('./assets-chunks/home_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 219971, hash: '75761166b4b0f59a4b1dd38663345c2709042a8bbeb600dcbef598fbb64bf96f', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 119022, hash: 'b47e2b1e96ab58bba7b7a9bebb0057645fc67662a2e6045e8d5a11528ebb8cd5', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes-grid/index.html': {size: 130723, hash: '9817affe80afbc9f86f1484794e20ae9c76fec8fbe041a1e17246755ec08fbca', text: () => import('./assets-chunks/loto_loto-boxes-grid_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 118459, hash: '7a0914228d456de8b530e07307ed9a7fe579483c3a743d909d1e07c6de48f613', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto/esp-devices/index.html': {size: 120237, hash: '844d99f5d0d587fa8efc85c9bf2acb2c93e9205336644b50ea8bf17d34e303d4', text: () => import('./assets-chunks/loto_esp-devices_index_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 3562575, hash: '6a0ff7506ff884c474593504e59235cb0d3f6951bc140b954317a7b40eb63957', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 3666866, hash: 'fc5a8ed73cbbcbc0cc67cac971e174d8c24d671bbf714d0bbf8a7f9129d14bf6', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 111120, hash: 'caa77b1cae0e5e52994b6ecdec753c63d231008f81217ad3caece19e91f46104', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 3576602, hash: 'fb94d02549145a5929884fcebe1ef30b239b08cd96f3d9da5b5a7ab5d53fe301', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 699143, hash: '25f7719617055ee3a184423d0737213e8e94560b4568df470db787104b75c50b', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'loto-builder/index.html': {size: 3735696, hash: '41c17cca2ef6540b767e6f2733659a4726ed312736499607ebfd0a864bd5453b', text: () => import('./assets-chunks/loto-builder_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 255707, hash: '23b567de0cfc63061c3f7e256e6331b4aedd1b9c4fa7574197b00d0f6b6f3af4', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 389417, hash: 'bed46bc4c20506cce6537560e727fe6dbadf8493f25d9c8918e116f8f5b16e86', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 115425, hash: 'a7f3a536ec8fe78580617f1b749c48ec6bacb5f1dedba1b4372cf9e8bd52eb54', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'loto-standard/index.html': {size: 7063966, hash: 'd2486eb831568348408b6084a6dd6d3a2a6e8be72345ef8d4608406cb45a8053', text: () => import('./assets-chunks/loto-standard_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 703008, hash: 'b1542893fd29834174b86021c276183d1e61de943902b1bc3e651c0381583d3e', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 1455325, hash: '969ee5869168957b26b0a9d14f7d160e132d92551de6d90c56244946d3e27241', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 596002, hash: 'b72943ddd281f333f86379ce097cfbe078b156bb104c52c55fd70d6d6b7be797', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 719044, hash: '76fbbfbca3935d23f0dbd9cd3889c2f0ac13da0ca3966a4e0586181d8ab4c8ae', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 68741, hash: '93002710d00988456b1b8893b259fdd6f79a173a3984cafdf85b531a2a9d3bdf', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 114965, hash: '579a907ffc29c654918f1c7e1016f7c7858e918ad0314ae9653b3749448958e9', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'admin/index.html': {size: 115488, hash: '4e65a480dd94066fc4869c19c277e8ea6966b6b0b2de52dddc8d2d18b5e063f4', text: () => import('./assets-chunks/admin_index_html.mjs').then(m => m.default)},
    'sync-test/index.html': {size: 122387, hash: 'f1c883a3259f2186795eccbc12b06a1574c59d8b4eb58d80e6007a6cae17de84', text: () => import('./assets-chunks/sync-test_index_html.mjs').then(m => m.default)},
    'sync-resync/index.html': {size: 126783, hash: 'd542550dd2fda678a511c8646280ca0867a01f83b4200c67a5a0f32b6736db21', text: () => import('./assets-chunks/sync-resync_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 3574177, hash: 'd597c84377fe46826ebc719a13ea99dea5439011817372d1027a205be99c3cfc', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'form-designer/preview/index.html': {size: 1337928, hash: '58ece99eb42e272a3951df7d76bf68fd71576d7b8de1995201d0e19924c056fd', text: () => import('./assets-chunks/form-designer_preview_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 3638051, hash: '437b938066079edee55dda69c3d70fbdd39c5c1fe524b7c07452d11c63bc326b', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'styles-7VYHPHOB.css': {size: 28858, hash: 'm4VI6V+Txag', text: () => import('./assets-chunks/styles-7VYHPHOB_css.mjs').then(m => m.default)}
  },
};
