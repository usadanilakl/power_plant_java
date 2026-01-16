
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
    'index.csr.html': {size: 25137, hash: 'b6802a0d730080764247dfe3464be6f6d7bcd1c5c045570e1185821d6fda1d3a', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17254, hash: '3e5c0417f5fa4f8dff46739cb84306b8a28a96d311a221f29aa2f09bbca9455d', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'home/index.html': {size: 110085, hash: 'ea1ab7433188ab2d7322d5e4241b713e0e6baadec33d6a205c850ae4de82aa2d', text: () => import('./assets-chunks/home_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 206356, hash: 'e8ce805d3a096e74028173f2642e577afd4bc93eb5c887b0529e49d130025708', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 105407, hash: '5090f5736174479e6a7bb4ec5b3d6b38ad0c5121f18e523d6acc6f5d64f5888f', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes-grid/index.html': {size: 117108, hash: '0591e76a2a2b6f3c235d365753bf18f1b6788fa3875a799358dc00ca58fdc211', text: () => import('./assets-chunks/loto_loto-boxes-grid_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 104844, hash: '0f4fc9a10509bf2b0f04d2308e8cdbdbc00ecb2528b04d58c02ec5f5a2805dc4', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto/esp-devices/index.html': {size: 106622, hash: '8cd8ac32506524eee50017c0ea119af2cdf66c1c67fe8fa8d7949a6b80e3f64e', text: () => import('./assets-chunks/loto_esp-devices_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 3649238, hash: '5a4b37564fa078de68d31fe84c59c5ce42fc8db6b6734383ebead303ce1cd03b', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 3620554, hash: '2d8fa7ff3fd9167760c8119f21e31aab4edf6e60eec7bfb19adfeb5d9cd63454', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 97650, hash: 'c9df82df420a1f6e80d9ef7bafc3c8a91065a6be273e10e7d85d4607f9c74dfa', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 3561013, hash: '8c40aa6b88ed9895bad4e354b76474d43821b0f407d75d16fe05bbebc0a14521', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 685674, hash: '19876173112d8e3bd6ec49f1da831192be1a60c933a927d3932effebf350ff57', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'loto-builder/index.html': {size: 3717995, hash: '41537a9bf1db60132537962ec19ed1e9914cbcfc196c52373f70428322fadf10', text: () => import('./assets-chunks/loto-builder_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 242128, hash: '68b38948d60dfcff1b6485b4f168e49440cdd6a7b8ab98cbd134215c4ae8fb0e', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 582423, hash: 'f327607ccbc314d864d46e293351d02828301406ac55fb372f7d33020ba5cb87', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 375835, hash: '6f91886320f721bb1648fd5aa7083071b308cf15a0c63a1cbbf21aff41aef47d', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 100539, hash: '4e601d4e0a43dc85a059bf241e4374eee26ae0c90c41553b73000bf3d34a1048', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 689201, hash: 'f9e03264bf65ad7c23f591468598166f05ae7eeae604114d929e6b29dc35086b', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'loto-standard/index.html': {size: 7046084, hash: '690aaf85e17005e57ed7a75d7add1bfdc94ba94ebf3425b9efff8cba44398b65', text: () => import('./assets-chunks/loto-standard_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 705235, hash: '7a4f2aabda0b32721c95f6301ea5c026bb15991e814139748b352e373b2b4540', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'form-designer/preview/index.html': {size: 1324121, hash: 'b7adb1113169279629fe8456277190f16b2faf3455efee2246bf3e6f86c95c08', text: () => import('./assets-chunks/form-designer_preview_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 59056, hash: 'ae332bf0efb6eb19305e7319be5c19a954c8d12412cbf198f42b852f68d91543', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 67154, hash: '0f0a23b9a30d12ec244d1e3a60a3327d117796a094116e192787075a078e6e79', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'admin/index.html': {size: 67677, hash: 'd2b4e94414fb2ba255eaed418f28456419b79ea44b0a9fd335202d5bfcaee52c', text: () => import('./assets-chunks/admin_index_html.mjs').then(m => m.default)},
    'sync-test/index.html': {size: 71307, hash: 'b10309cd6a6a3c2ed7e1e4adc3309915208fdad79109f8ef5957263eb3e2ae1d', text: () => import('./assets-chunks/sync-test_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 3557320, hash: '995b6f8bebbf88c9182738776367c60e46fb96c994b552d0647f9b79873f2dd9', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 3626392, hash: '60f8981dc90c9d97af4379a95b4d497bc2702b8dabc982506c3d3e473fcbae27', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 1441107, hash: 'ccb756f138e5e0935e2cdf6fd9f28021e5b5755c5f5b6e54cb9be352cb51eaab', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'styles-7VYHPHOB.css': {size: 28858, hash: 'm4VI6V+Txag', text: () => import('./assets-chunks/styles-7VYHPHOB_css.mjs').then(m => m.default)}
  },
};
