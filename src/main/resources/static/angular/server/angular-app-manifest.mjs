
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
    'index.csr.html': {size: 25137, hash: '34054790a4e8b05522a769da35e2a4b5ef58d3379f6f6838d6ef26329c192b54', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17254, hash: 'f313b01e480bc2923efb02dd13cb43699f44bfa1f4781616434791a09a2fcd5c', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 172488, hash: '587e6cea0d244a8429e2adaad0d5d1a0d1cfb4031210a12ba061f5b5a2ef5184', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'home/index.html': {size: 110085, hash: '70cdaefed6033cb319947dfd02fe167f8aa40139dcade46636102a397a3d4493', text: () => import('./assets-chunks/home_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 109631, hash: '9dc54a03c2be8555937188a6e0d42f3df3f770bb8ac855917292c7f2b0229603', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 104877, hash: '0113709d7e8e797b23ebb3071ab87ddfc7b380384ee3f1d2db08d103ea8e766c', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 104844, hash: '2325921419c4e9f1792ed5374217c0d68c151c13189d25f530f5b7245209825d', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 109988, hash: 'dcd4dfc3912dd668a28ab255e7c913ac3a817e90e2072a1992f0e3b38468864a', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes-grid/index.html': {size: 117116, hash: 'a4424861ec2d5f2974c49a469c0ea4cfcde47a294d33009cb16bb589c83d3cd3', text: () => import('./assets-chunks/loto_loto-boxes-grid_index_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 148183, hash: 'e84707520970b4884ed44a1ff1bf1415bf9bbd05b9e641fc27e99a7e6529665a', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/esp-devices/index.html': {size: 106563, hash: 'd2466fdb3ea94c7ae10685943af212ef0b9257474b7eca38ffac8a85ebc46ecd', text: () => import('./assets-chunks/loto_esp-devices_index_html.mjs').then(m => m.default)},
    'loto-builder/index.html': {size: 180045, hash: '6b2f68ad95e16a923e84cf1a408afae06bd79d2ed551c3715b2efa2fcc8875b9', text: () => import('./assets-chunks/loto-builder_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 97650, hash: '74d7867128142586793ae6b473e93245b9af7fa3ca839813dfead29e6cf0d7a3', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 114765, hash: '1ff3aec9995e05947f6324e60c98fe3b376686430dc3f95e305bce10a7713fa9', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 103187, hash: 'd9cc7a1941d6404c13ba27bd0996c2540093e296821628e654a8d95e4e7b6e08', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 103201, hash: 'b20a81e5a8a91fc649408ba2527b943391513dfc7908d9ab230e0b39f2b47c7f', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 103221, hash: '4d4a4764eeef4a35d1d974c1af6706415145d1bcc73b0f8b8aeb349d8aadcd12', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 116558, hash: '45232b0df7b58d236147d7983be105f9d9804452001e6b76f0ee245555fe656b', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 100540, hash: 'e9c8a3a4f7a23d5b3a86987b7075d27f9ed07ea155093809f2b0657abb1e03ed', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'loto-standard/index.html': {size: 265519, hash: 'd6916643754c61d3abff515ea8891aeae445b3a6eb9f8e2ba17a0f085f43508a', text: () => import('./assets-chunks/loto-standard_index_html.mjs').then(m => m.default)},
    'form-designer/preview/index.html': {size: 105844, hash: 'd6d21590411a5e001993f91ee1da81941ecac2c46123605c64beb343d037880b', text: () => import('./assets-chunks/form-designer_preview_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 107685, hash: '6fc6ed972a2a83902264117fe150a53bccefd2d5ebc8995e8f998a490f16c11e', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 119902, hash: 'ab28538eb27276f4167cb7310356455de2af0dc8bc7dcc033b60f24d90e48256', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 103869, hash: '0b44a56ea5e8933a431294e07418db3476c8d2b9649f368a8abc762b2205deec', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'admin/index.html': {size: 67677, hash: '0f7b5a39fe104395c04fd8649fd6347978f85e3cd1bebd6815ac213b6177d04a', text: () => import('./assets-chunks/admin_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 59056, hash: '321cfe3a0cccfb35b4fa9382d4261ac01c6ff5067606c04cf69c20ebaa9ce29d', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 66135, hash: 'a292377767200df19ef8739ae670167da51173ac75448a77aae90e9f0d21bf45', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 101262, hash: '004ca5c0822e4bd7e5fe95b4cb5d5331df82f2adeebcbb3c0e551590e4270673', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'styles-7VYHPHOB.css': {size: 28858, hash: 'm4VI6V+Txag', text: () => import('./assets-chunks/styles-7VYHPHOB_css.mjs').then(m => m.default)}
  },
};
