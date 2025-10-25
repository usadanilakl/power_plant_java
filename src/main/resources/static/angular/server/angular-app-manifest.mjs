
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
    'index.csr.html': {size: 23793, hash: 'af599916a0a832133e85d6d71a38342b0524d4630531d55c5e89cf1e4e66d5f8', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17152, hash: '7436eefb8d936ab5ca8adb9c6bc8ea247583e97e4473bdf8dad3c5b5e6e2ca58', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 46647, hash: 'c5d673638f1dae1d9c6b495d1240f0c06a1eb6a91304ad15415c6a6a7f982367', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 49636, hash: 'd68411e3e3d6bedd3ed1a3610f9e320d6b9bfe839457e27a11034f13f6770f16', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 43743, hash: 'd03562100c18f164df102360580996e10cf9ce879d08389a0e806059b00a75f5', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 44321, hash: 'a9bfc0523a9df9c3cf64debbab46ea6bfa96a76578e24ca687fabda6c1be964a', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto-standard/index.html': {size: 47931, hash: '2334e05a22377e880070f1bd4bf9dbb5cf0f91123315a83ffa39799cddd71768', text: () => import('./assets-chunks/loto_loto-standard_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 39884, hash: 'b35a6296bc80ad16539f45138ca56997d384d7aabb1cb5ba16a569cefa0a0c2d', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 39847, hash: 'c405e207be0b2846587584669fa15948c78a105a5b3b3524c3b61de5a6adc458', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 42393, hash: '3783aa405775614545b313b0eeb738f0e8aecb8168434c7f4059485206642f79', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 34625, hash: 'ff50d7ec1af42cd7186f4b6b33df0a247d74ecd27270691ec9e1b5cbfbaab038', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 24636, hash: '217ca002d806050d2bef898581ce8e46b2b99c3f581cc2fd8edbf26ccfe71d5b', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 33140, hash: 'c6963f1e17dd1b245691fd4eb475805b65ec581dc61271cfb001a3606032f18f', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 31651, hash: '69ec407b2c98021dfad08055ae5a3f0ee4003eab21c12e9910d6d521473dc1ab', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 49959, hash: '5b1bc897b1057b99349fd0580b65a894d6426a78d12f4b7014d387c8f744dca6', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 52156, hash: '9010501e981217b370a88ebbc5e870d4cec6a953bc925e47d3c7cff70b5a4b6c', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 42647, hash: '8006df12bd69979d9683b310d8112e3c607e95aa560f0e2e903ab9356b32241e', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 42258, hash: '64cefa58103d86ea3a4818384414c9d5ab83c9ebb8d9335a77fd04b0138c150e', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 57602, hash: 'd707115755f1a55e02bb284a3b734239c40ba4bdb2217d95dcd03c1fe69f9932', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 36844, hash: '6ff9d47ebbc5cfd2147b19514c136761a44a3294bb90397357eadffcb29c6478', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 42977, hash: 'c10692226c551c88b51187732af9f59d2a810fb39fece65c085f5327b5ff0b15', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 42687, hash: 'd7190cdf7fcaa918f546c2121144fd31c833776b6d32f82bd5bf2003b3510c1f', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 39502, hash: '9ff87b2ba9a99e0f748c0a3ad94e201db857f2757a9cbd1f404e3fd5bf8547ee', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'form-designer/perview/index.html': {size: 40904, hash: 'fbb9b447138d00bd78443999c755716b9ec7ccc4d6f88081a8243a17c16ccf76', text: () => import('./assets-chunks/form-designer_perview_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 55523, hash: '78c77596cfa095ce1d95118ce6d9f708c8ec83f864ae182c742bc46e2969167e', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'styles-TNAVY2DP.css': {size: 10047, hash: 'OPTPw42CT58', text: () => import('./assets-chunks/styles-TNAVY2DP_css.mjs').then(m => m.default)}
  },
};
