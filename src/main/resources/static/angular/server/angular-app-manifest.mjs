
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "redirectTo": "/home",
    "route": "/"
  },
  {
    "renderMode": 2,
    "route": "/home"
  },
  {
    "renderMode": 2,
    "redirectTo": "/file/edit",
    "route": "/file"
  },
  {
    "renderMode": 2,
    "route": "/file/edit"
  },
  {
    "renderMode": 2,
    "route": "/file/table"
  },
  {
    "renderMode": 2,
    "redirectTo": "/loto/loto",
    "route": "/loto"
  },
  {
    "renderMode": 2,
    "route": "/loto/loto"
  },
  {
    "renderMode": 2,
    "route": "/loto/loto-points-active"
  },
  {
    "renderMode": 2,
    "route": "/loto/loto-boxes"
  },
  {
    "renderMode": 2,
    "route": "/loto/loto-boxes-grid"
  },
  {
    "renderMode": 2,
    "route": "/loto/locks"
  },
  {
    "renderMode": 2,
    "route": "/loto/esp-devices"
  },
  {
    "renderMode": 2,
    "route": "/loto-standard"
  },
  {
    "renderMode": 2,
    "route": "/loto-builder"
  },
  {
    "renderMode": 2,
    "redirectTo": "/loto-points/table",
    "route": "/loto-points"
  },
  {
    "renderMode": 1,
    "route": "/loto-points/table"
  },
  {
    "renderMode": 1,
    "route": "/loto-points/*"
  },
  {
    "renderMode": 2,
    "redirectTo": "/permit-builder/daily-packages",
    "route": "/permit-builder"
  },
  {
    "renderMode": 2,
    "route": "/permit-builder/jobs"
  },
  {
    "renderMode": 2,
    "route": "/permit-builder/work-requests"
  },
  {
    "renderMode": 2,
    "route": "/permit-builder/daily-packages"
  },
  {
    "renderMode": 1,
    "route": "/permit-builder/daily-packages/re-issue/*"
  },
  {
    "renderMode": 1,
    "route": "/permit-builder/daily-packages/*"
  },
  {
    "renderMode": 2,
    "route": "/permit-builder/safe-works"
  },
  {
    "renderMode": 2,
    "route": "/permit-builder/hot-works"
  },
  {
    "renderMode": 2,
    "route": "/permit-builder/confined-spaces"
  },
  {
    "renderMode": 2,
    "redirectTo": "/scheduler/flow",
    "route": "/scheduler"
  },
  {
    "renderMode": 2,
    "route": "/scheduler/flow"
  },
  {
    "renderMode": 2,
    "route": "/scheduler/table"
  },
  {
    "renderMode": 2,
    "redirectTo": "/form-designer/forms",
    "route": "/form-designer"
  },
  {
    "renderMode": 2,
    "route": "/form-designer/forms"
  },
  {
    "renderMode": 2,
    "route": "/form-designer/preview"
  },
  {
    "renderMode": 2,
    "route": "/form-designer/design"
  },
  {
    "renderMode": 2,
    "route": "/tag-number"
  },
  {
    "renderMode": 2,
    "route": "/print"
  },
  {
    "renderMode": 2,
    "route": "/backup"
  },
  {
    "renderMode": 2,
    "route": "/admin"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 25070, hash: 'd49932225028a02ae0cca619be43b213f80b54167f073f0d788f991b38b225fd', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17187, hash: '132a3e5750a1e48c571e3b2b51934b2160bbf29f91ca7b8ac207a56229448287', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'home/index.html': {size: 3485044, hash: 'e7c1d45449f970c58a6f600575af85a213c92e757d5117f3236501bf55a7a3a2', text: () => import('./assets-chunks/home_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 3648514, hash: '02ab964baad749f73078c72a676ce587290d7fc954c9f781d14c54186a3fbd75', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 3581037, hash: '82d9fcf5a965eb2dfb08e26e0feefc53bcd240664725a4f2e504660dd8c83445', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 3619842, hash: 'eb6815db54e25feb1b5baff042bd24b34b372d2da86b06202fe63708074660f9', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 3561327, hash: '17506b826347647fd0a05c07dc6453cd14be6652369f200a35b904d100aabb64', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 3480428, hash: '7bc1401a1fbbe67ec364ba4e27b52defdaa66c8a21527e903e1da0805d307d5b', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes-grid/index.html': {size: 3492142, hash: '593ab83591499bc94ec420e24d7b8cd457df6bcd5adf21af4b6c1a562d282fe6', text: () => import('./assets-chunks/loto_loto-boxes-grid_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 3479868, hash: '675020a4fcfada556f403a92691cb4f119f7ea246c644acd0a55103b7b8aa5ec', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto/esp-devices/index.html': {size: 3481645, hash: '4a9999c9b2dfa7982076cd7afec31d7813fde14f6971a82cba6da79f791ead47', text: () => import('./assets-chunks/loto_esp-devices_index_html.mjs').then(m => m.default)},
    'loto-standard/index.html': {size: 7043431, hash: '81d153762e2d173e650dc575c51005bf65d26e4734d29b6193beb9443d9b7c70', text: () => import('./assets-chunks/loto-standard_index_html.mjs').then(m => m.default)},
    'loto-builder/index.html': {size: 3717277, hash: 'c68004bfcb3341de96117bbb16b89d7cdcaabe248992e98b9cb9d0ce27d606dd', text: () => import('./assets-chunks/loto-builder_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 3472705, hash: 'be09fe92e488b870d32a0776a76327221c07073f7aa01d95a23211eb9c6c7ad0', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 4816157, hash: '24d637f350fc81549a15da928c20504ea6ec3ac42144b8ff0d86baa262a6bf9a', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 4060730, hash: '43839eb27429e7726e1f9d27e61d34907ee9e9a48d8281b7b76b860ae28053b3', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 3957479, hash: '0adda76d3440fe0d4fcde101e8118ab66b9aef14fa0ef27ab3630152f543c88f', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 3617183, hash: 'cbc49032ac940a9c542318771a99f464bce75c00232d113065663bdfd07653cd', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 3750892, hash: '87597e506f62d97cd15556a775afc229797c754c3ff69818d5b7f362c1435d8d', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 3475691, hash: '79572964ac863e9f3c610ef1e6403696e88cf255046021b95221d76355c12c88', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 3557763, hash: '9477204f83979a1e40fac4e782eadd885d75bfc7885bc257f6795842f99150c1', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 4064305, hash: 'f9dc346d68fd532c25488fc04c7b97277b9d5ae31033422fee27b0ce7cc422c8', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'form-designer/preview/index.html': {size: 4699224, hash: '8854856309c57003ce1002d98764ab47fbe5e308433656cf8ee29ee1e505fa9c', text: () => import('./assets-chunks/form-designer_preview_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 4080339, hash: 'a23bcaf88219a42f8b8818bacbf4495f4e0b1eea7b6c049c27ad01d9a2924afa', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 3626016, hash: 'd779644c88aac5a311cb74ee4ec589388549362ecae049ac9aa95d8e93348a9f', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 3434548, hash: '96254fff42e06705e426cd02223f2d61c21defbaf7113c1a16ec89c9f1fb0f28', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 3442305, hash: 'e8ac57f238de58373426a17a446966e76ce05069513eaa41c3b241fc2fc69fbb', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'admin/index.html': {size: 3442828, hash: 'cff3af58d0e971c78835dd1f6202054dfee77753f1c67c11703f12999345ebfd', text: () => import('./assets-chunks/admin_index_html.mjs').then(m => m.default)},
    'styles-67EVNKE3.css': {size: 28624, hash: '/Tv6EccCWeM', text: () => import('./assets-chunks/styles-67EVNKE3_css.mjs').then(m => m.default)}
  },
};
