
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
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 25086, hash: '9f1a904ead203eea251c14344175dbb352a4b1bb6b4c21baf1f0a90ae8051e72', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17203, hash: 'b9199bde84f36fb11e67c74e6e905a34bb6e2f35cf595a61409b424c26b8efd3', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'home/index.html': {size: 96432, hash: 'e08b8781e06feb6ba47ff73dff3e8d7f88555623b0fbc171c07cb3c5c34fb564', text: () => import('./assets-chunks/home_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 95977, hash: '0251edf0d377e1e1da97c73480f61f6566ba1b03513988f4ec84a4471ea5ba57', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 158835, hash: 'ee09b3dccd0692a118295fb3a107fe703ad0dac5e5b1967d408ac87489f7b83b', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 134530, hash: '8db50a1fea3ce99187e91d39d7e62a598e1b806e9d894023ff14fad026038268', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 91224, hash: '14dca84f5026d768c6586be3d28bb6f8d956d22ef7b1c5f17eb9a3033ab47941', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes-grid/index.html': {size: 103467, hash: '3ac80591d3aef88ac832ae837e947df691da41b633a909407679222abb20577e', text: () => import('./assets-chunks/loto_loto-boxes-grid_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 96335, hash: '02e62cc04973f926ed2c5aca394443bcbd11c4e258f08e2f72b831baf35bea6f', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/esp-devices/index.html': {size: 92981, hash: 'af2eabc73c177d3e8c1c470c5584a25159dfa95428db46623dd40e5a5ef10a49', text: () => import('./assets-chunks/loto_esp-devices_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 91192, hash: '24e74316cf82020985f0f7c77db426e0fede795072cce0f36e097f2a36380c79', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 83996, hash: '61fc55a5caafdf74de4890d12f6016d80f09a4e2956c3f5042ebd8cb4160bb5f', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'loto-builder/index.html': {size: 164114, hash: '4c2cc92aa97c016538c948ba6ff8ffaf4ea003a0951d9cad426774fe0c8fe23a', text: () => import('./assets-chunks/loto-builder_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 101113, hash: 'a90671f708189c8d090bb694338ec56242aae1682b96c34cd03a9a9209cc56e2', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'loto-standard/index.html': {size: 249172, hash: 'fe7620e76fad3dcd985e023c3b72920647456ccbe348221066d94920406648be', text: () => import('./assets-chunks/loto-standard_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 89569, hash: '2c7bdeb622b73227e012ea94580829146f627655354c52f8a0c0e04d8d03c273', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 89535, hash: '403ca7ef3ebb112062125e6d76ed9ab66fc5e824054bb78bcdddce2597369ed1', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 102904, hash: '5027b23bb0aba98eedda614956d20f22ea385e842c9332873bab2b4b12eb375a', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 89547, hash: '4f2b9b792b98a0c26d26ae9190f644e8f8604166c726b42a8bb382c38e48ec27', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 94033, hash: 'f675070e74587bcd12efb4c608cdbb17f045eca28ef98ee5e29322f1ba71f79f', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 86887, hash: '36c30291c0183ca1352341e295a76a5731b93bc280e3dba7f5f7a344106c9eb4', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 90215, hash: '2d3f1d62812ce7368d74ba0be02f19e7d51566edd4a182b76a576cf917d49925', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'form-designer/preview/index.html': {size: 92190, hash: '4418809e54c2ba4b28703bcd6552dc9d78a2e9b44f7c33e51d2c90702bfc2382', text: () => import('./assets-chunks/form-designer_preview_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 37377, hash: '0520c5539746af8ed6a0b17b2d0afec6800a60178612d58ed2cc20a2b77e0433', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'admin/index.html': {size: 46468, hash: 'b14d257296a8f3764d05b6a3ce192b3148c109e90d4895aeaf333de82dc4b57c', text: () => import('./assets-chunks/admin_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 44930, hash: '309540f330680cf23d38a8a507ea34b83e0fa1f24828c6638de1df4f88843c9d', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 81128, hash: 'd03a5ac1bdb16a323aaf268bbcb152436ac55f0a0c343654601fa5389701a86c', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 106250, hash: 'de4c54c27c5fcbb4e220b83f6bda5c4a3f4cc76714d1fc23a594f30a8dc53dcb', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'styles-67EVNKE3.css': {size: 28624, hash: '/Tv6EccCWeM', text: () => import('./assets-chunks/styles-67EVNKE3_css.mjs').then(m => m.default)}
  },
};
