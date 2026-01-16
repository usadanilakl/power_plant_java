
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
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 25137, hash: 'b0b57937ef82a91ebb77abe06ff29c848593de2b1f30e20f3b09c44a3a02f111', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17254, hash: 'abc5a3e315b94ee3400be771652b0475a7b65be6a4487f8f36c9552aed0fcd1f', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 206359, hash: 'a14e29dfed060bb2c29d4b9a6eb9eec91097fbe24d67bbb09bb8441d38c95eef', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'home/index.html': {size: 110085, hash: '667c3fd1275f607451629e7ef9d9ad511048a6affc74bade0ee4922e7d0cdbb0', text: () => import('./assets-chunks/home_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 105408, hash: '009f5a28f35bf87a37a9ae389448bd6a795f322ccd4d5a10d0ec199aede38352', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes-grid/index.html': {size: 117108, hash: 'c412e983adbb4c838d856f3f78d20612f889df3b6392bc2d570477331c53b5f6', text: () => import('./assets-chunks/loto_loto-boxes-grid_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 104844, hash: '7cfe38b249c09a78d971c713cd5b346b4f31f4e2e357578277e5f9181dea5e64', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto/esp-devices/index.html': {size: 106622, hash: '9f3cb3a0afed800c3c0535fbaa6ac0e49a13db6b4c9057a1c3b5a3991f9e0bab', text: () => import('./assets-chunks/loto_esp-devices_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 3649261, hash: 'ca9c1f02acdf2a0199b2baeafe392dc77d9d1d4f23bd69993ce4c06205d78e73', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 3620575, hash: '97e1b9c4c02e92af69febe172bff9b6db8d4bddf7b84613da84a95199fee7202', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 3561020, hash: '7cf17ee38a8dcb94a2818201f711fd54b789c261ed503c9dcced6b4696202d0b', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 97650, hash: '3fcf9b6177d105a089b1c97f4aed30d867f9564ae67f3ffbfde7c3e607c9ec17', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'loto-builder/index.html': {size: 3718013, hash: 'ab9ca057e0a5fe4b2201688cc13c9edb598f937ea4e8767f9ffe242646b70019', text: () => import('./assets-chunks/loto-builder_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 685676, hash: 'f636f725c3d8836b682eda544c4e1ddbf9a5c93e33ae511cf99484f5d129ef5b', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 242132, hash: 'b8f858b7d494a12f05173ca82eb91b351783a4d1e4f18551a7eea5b64a721988', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 375842, hash: 'f52eda9315aba04f11c07d024ef13a8583b66673c7e3636fa2854f1925f28b38', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 100540, hash: '495dd475e275a47feb245b0bc580b32a6eedbb582ccb446ae919281effb5fc33', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 1441113, hash: '67b5de35678fe51baf73195485c6c154432c45e8655738e5b301c92239ae0dbf', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 582429, hash: '673d63ad5ec65669282a6abe9eb4e265c2736e3ab27bf3341205b1fd95f82fb5', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 689202, hash: 'b720d8c41d3baec41fbfdf92ac457a826a0b4ddbafd163dc8228cba9def323f8', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 3557327, hash: '109fba88c915c7d580779b7cacd9cc891720990c9197ccd2b79b663b622501b7', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 705236, hash: 'a7ec1a3236471ed05cf47a33448c2f5ad3d5f95f61fa61c722a1642d27497049', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 59056, hash: '5b6b9ac29bd9a01a4e96b6c7d569de711560ce31193aa50d1f0e9dd09f6248eb', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 67154, hash: '61c37a4a7aa7d86bb4fc7c7bd683db351a6daab62d0ff375efdb30e9f6f3ad14', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'admin/index.html': {size: 67677, hash: '32991e5af4327745b24bb036a60e8df237dbc25636e549a4594c08349a8978b0', text: () => import('./assets-chunks/admin_index_html.mjs').then(m => m.default)},
    'form-designer/preview/index.html': {size: 1324127, hash: '475e16e575efcc379891b4af2947a217670f4cb128838d923ed771209edeb4db', text: () => import('./assets-chunks/form-designer_preview_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 3626406, hash: '3894cae2562f31fad7b60a8c3f822b9ec510a388889f4719cdda79d4a665db06', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'loto-standard/index.html': {size: 7046044, hash: 'd0a99d1edc18a0195fd91f30db74f0311da96f806e12421d47a55652928d456a', text: () => import('./assets-chunks/loto-standard_index_html.mjs').then(m => m.default)},
    'styles-7VYHPHOB.css': {size: 28858, hash: 'm4VI6V+Txag', text: () => import('./assets-chunks/styles-7VYHPHOB_css.mjs').then(m => m.default)}
  },
};
