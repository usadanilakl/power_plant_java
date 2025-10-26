
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
    'index.csr.html': {size: 23793, hash: 'dad4fe7ee185df12abef26f9a25bc973a935b0dbcaa0d8f26ae7510ddfb91ae4', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17152, hash: '86793201a28eee2a96dc535a9692f2f3129ed111802a4903ab95c446ffd6ee82', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 46647, hash: 'fdd84562aac0369d9abda533c428c7123cf5c578994168eaf6d5d04ac8cc55a0', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 43743, hash: '9064c63690249b1cc90536aa2d8ab20087bace2b07a8aefab26708e56de899a0', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 49636, hash: '452ba755bc6edbe52479e3632979207910e6140f2c536a5436fc211e4d7ee32b', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 44325, hash: '05d872b4d838c323fbb9645fc0e747ac09b3e062e0f8e88b2259a640efc54aa5', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 39851, hash: '27673e4d6f1557caa70ff7bdd12d6938fce68c1f228c4e86149aaa8db6030dc9', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 39880, hash: 'f7416a35e90bc381de1c8359b1692ffc8b814ab639deedb2ed1333b921466f67', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 42397, hash: '45eaa3e59fef8be90c26c446344db0f5c3d583152ee4c796405e1dba8ac8c76b', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 34623, hash: 'c0030c026f10469bbd6233c45f20ce488db7cf503d2e8331812b82b22c1ead9f', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 24636, hash: 'b96cd5478db0897797b2750f90e3c4fd43a86f9e7b8be77e47c46db8f2c0e658', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 33140, hash: 'b4edbc0eef4cd9931d83eae10698bcc622af26b90a4a2840a238a2a5ed782b71', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 31651, hash: 'ae6f9f6eaacc63682f3d65c044e1e7d7787edb58e5afb3814752b03fadceff7e', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 49961, hash: '1ef94493c6dc2618c8def4378b512dbf96f831273b4330f4e68db8f197f3567c', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'loto/loto-standard/index.html': {size: 47931, hash: '41598c871c31eb307a1a74de0b63bda7f7e10088d1a1766689176ca49c73d2cf', text: () => import('./assets-chunks/loto_loto-standard_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 52246, hash: '3bf3ab8329ff6cf90d665e8a0e1d60b787ccf8980aaac44cfaecdb94d51d0579', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 42651, hash: '376fdda963a62b91a84de1faa36304c7968bc9a03ce1e67cec65f78cda72a08f', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 36844, hash: 'dd4b6a548c99c84af13157f763af0f85e958889a01c28ad6f9e8f50750004a92', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 57602, hash: '7b7c1512d4222b9bdd63eb5546591326cd6ca5cc758c386579c1f040040e2c39', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 42979, hash: '73b4f5e3f857326d144aa40bf54957ca0d455d34c0263520e7de7f6e666a1ab9', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 42685, hash: '724f9b7ecf5f35efbfae49f846c2985629430b02c2ef200017b37a0a52df762d', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 42256, hash: 'e1df59d0ce3cd65623a749d0f54b88e6ea7393103b99ec5da84e28f992aee154', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 39502, hash: '90fb503d97c977978c158d920ddb537d1231ee828cdf70328d0c662e5cef28c5', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'form-designer/perview/index.html': {size: 40904, hash: 'd80c684bd27400aad9d5bb610b252c21f6b530f2d257b233d1bd45350206bbad', text: () => import('./assets-chunks/form-designer_perview_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 55523, hash: '00aeab4a3c75bdcaeb6ae8a1e591e6584ed1f40448ad10ea5b9fcda514f631da', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'styles-TNAVY2DP.css': {size: 10047, hash: 'OPTPw42CT58', text: () => import('./assets-chunks/styles-TNAVY2DP_css.mjs').then(m => m.default)}
  },
};
