
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
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 25137, hash: '79ce43002a5d40820afd744b1b4ef0454dd6489a2d393bde9817803510edd159', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17254, hash: '928b38903c112ba083b5316ce4263a1d61121b0d6691bd4a2c6d035cd5c218d7', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'home/index.html': {size: 111579, hash: 'd42ccf3aff53c897eab33d352d616692b4311d030ac523cc30419e553a2c488b', text: () => import('./assets-chunks/home_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 112524, hash: 'fa3560b6941cdf9f5b900ef9efaa412e1128dceee5eeceb904c5b587c2702834', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 115810, hash: '5795b8efa3a210a1c3dea185ebe420a12859fc18e52dac8d3ea6aa84e79b54ef', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 106900, hash: '03fec65fcf4e206e938ab1c0e3b1107a40d55132b5babcecb7570d4e3a3a372a', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 185809, hash: '4ef11bb327be061070ed0aeaae1a9434a82b85afa5d3b5aedc1892de150d7b28', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 106338, hash: '8c98020176ee9a3b2fef184b5aa81e775c1fc79cb35f74c85d6013f7b0d2dca9', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto/esp-devices/index.html': {size: 108271, hash: '8ff6699051ddc6a926b49f128f95dbc7dba47f079e588ac8479d6076dc427611', text: () => import('./assets-chunks/loto_esp-devices_index_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 159495, hash: '9abf16d1df4aa180c1713a59a9cf05a4bd020a1b4ef53e0c977ecdf5fa9fa7a9', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 99144, hash: '1c7cc7e44a9e076104dc53be8ec2a623a46eeb4716f68d34a8320082a1c1db73', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'loto-builder/index.html': {size: 194372, hash: 'e84ea9a523ebe8fc17a786b2d801306d606b3b019dd1bea9a9065e7b3800a41f', text: () => import('./assets-chunks/loto-builder_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 118280, hash: '5d46fd965fe032d64601ca9e2cbb4c607f76b41333752c60c0381d1af89a2414', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 106364, hash: 'cd9bd06238b9f6fd62644920f225f5b66ee8236e3d2b032c7f6ffc07eac74bf8', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes-grid/index.html': {size: 118747, hash: '7558580c429a8e92bdc6eedbea25137b5f2e23632d95a3bd5eb8a98c358403ba', text: () => import('./assets-chunks/loto_loto-boxes-grid_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 106348, hash: '0e6bfc3ade47beeea2378b9628d6564dd0497cdcb439c45a112543487eeb50c3', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 102034, hash: '601f4055ce8ef6e8a808ce76790899d45852dd6095a33ba60fe06402de3798ff', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 106399, hash: 'bf35e723ffdb9144547730fe68bce0112e4aca29b3c5d440926ad8eceb8bc018', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 105570, hash: '060f858a8e57751f7c5fc70cab51324d726a5860caee251374c42a3596e4baa1', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 113656, hash: '6a18195d8210f16791e070f317f3ff43ac5a21a847a0ac019e4f707242dabbd1', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'form-designer/preview/index.html': {size: 108024, hash: '7466904dcf3cee209c8eebae5ef9c9f1b2d6a89086c85e93bcf7f150474a6c1d', text: () => import('./assets-chunks/form-designer_preview_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 121605, hash: 'cf7c75c654c873794f06f84463bb11182417d620d0c22ca092a715197236cd9d', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 106331, hash: 'b3d317410d06013ce1e819551fff9932dc66193935f21d53aea963d6342ec7c0', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 59056, hash: 'a3514218d2279d9ea85c6da2071020f19e82b80a5ba52b455bda812acbd00717', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 67154, hash: 'cf6cb941112ed7deee9d239c07e3eae5a824b702b3db69429fda485c9856f5d4', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'admin/index.html': {size: 67682, hash: '4706510bfbd74936cefde77bace87707477dea13663bba491a3b7ae5789ae01f', text: () => import('./assets-chunks/admin_index_html.mjs').then(m => m.default)},
    'sync-test/index.html': {size: 71307, hash: '027ae38647f4b8e68fc168af6d23c5d01edded6b2563476c88c992a7dabdb2e2', text: () => import('./assets-chunks/sync-test_index_html.mjs').then(m => m.default)},
    'loto-standard/index.html': {size: 274969, hash: 'db3b1d27709167d5492ea1cfe715142df83a68ba4867052f4fc4bbbf2314fa97', text: () => import('./assets-chunks/loto-standard_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 118899, hash: 'eeb740097ecbdeca6871cf128905c23ea9475fbb7ef12111a17909b7bcdb2227', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'styles-7VYHPHOB.css': {size: 28858, hash: 'm4VI6V+Txag', text: () => import('./assets-chunks/styles-7VYHPHOB_css.mjs').then(m => m.default)}
  },
};
