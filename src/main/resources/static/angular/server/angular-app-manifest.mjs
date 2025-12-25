
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
    'index.csr.html': {size: 24527, hash: '1ad151364eb86e3871bfc00fbb27cc692fd743ddb5ebd2968478091d851b5f3f', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17152, hash: '4258564aed89e3cbb4874ebb962f18cc459ae52c61db7d8d5a760f1d013a55b9', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 60688, hash: 'ca7b3bb29e55295d2349df2b1f97222ab792e3eeda1d2d45139dc1ffcf79608c', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 59437, hash: '02d8f8be4991f9a8cad3ce935b2398154f6e9c3f53fc7428a929f2b6a005a34a', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 60019, hash: 'bec6eb2502a1cd958d79631ca8786d0d5667192e89d4402aaedf4a07c074c067', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 55577, hash: '049704c60f989ab5088e5ef61c51ce0db1f3634758069e8fa5b101fb846c9630', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/loto-standard/index.html': {size: 60228, hash: '6546bda5fb95b002e3be97ccf02f969fb3adc7c08915acef71e6895d0d03722d', text: () => import('./assets-chunks/loto_loto-standard_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes-grid/index.html': {size: 67819, hash: 'd64718920e1bb801f4fc4f763e43cc34db3a9e9a18c3c64ef256f56a4ff5a536', text: () => import('./assets-chunks/loto_loto-boxes-grid_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 55544, hash: '574ce3054e2f0c1b23a93a9075e09d1df5cf877a72aec7a436b080d9c487ccbf', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto/esp-devices/index.html': {size: 57334, hash: '4af603d0891793da75abad2f39f3905c700b25bf53e0d7e9f4874c466014fc38', text: () => import('./assets-chunks/loto_esp-devices_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 36298, hash: '72dea271542d2bb36e4740d840541b16b33c09b1323f823671900bf409e2e7d3', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 26309, hash: '38f956e5a54e8a03799d557f755e2f88982727a4dd784fdee521852298fcc1b0', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 33327, hash: '7818d0f5f240b0c7785fdbf721d36f83aff886fcbf5e2e921ca71cdc8fc2523f', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 42920, hash: '99f602353201a0a8d6a3e5c8fad8c5e861fb0fc358f7904a8416dee1e0b02f2d', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 59743, hash: '7094eb294eb58ec38b313120c510d6d588a10422f2533c27454d02e1eedd1cc8', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 62199, hash: '131fc21a7a6adc8fc910d07c9ffb39cdf7603d07199b9a3936b6cb17b29af3f8', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 52433, hash: 'ee1c3e81aee781175d31f14c941c332c195d3a10e8e21dcb0b6f705443679612', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 52042, hash: '93e9e63357a99dfb91437a3bb91e3d518bc21c0f893ea5c25f5b0f98575941ea', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 45668, hash: '9eb68a9dcc84f8d5be708abf11d4aea20dd2a47c300c58137ac72fe2cc9999d2', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 52469, hash: '3663cdd8cd665e73b64cf33a98b1eecb4b56a9ec444b6fb26474c74c2800d449', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 52630, hash: '8f5927b86a4cad87c3e64e54c4b541eb76ac5dd500d23e2d70a2d19ceab48516', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 49283, hash: '76d8ac317cd7465671cb1d41743efe8c3d2516aaf4ac4eed4663e88941ab5a66', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'form-designer/perview/index.html': {size: 51258, hash: '6426e616420c0a0063760f14856fcfdaf08d4001424f254dfc20e3da4c40d275', text: () => import('./assets-chunks/form-designer_perview_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 65327, hash: 'c04506e485bcd8ef711101c845f1aba97b51dc45e529f0d624fdc48ca53698b1', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 81678, hash: 'd3392fbc75da4be638f5cc4d3d8e7872be2151264c65c9a5b037ec41af091d8d', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 75104, hash: '2776174e8c0c6a02bd2698e3bc9ab9f786eec1a45652712c46a86699e08f7bc4', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'styles-GW2G6IRD.css': {size: 12481, hash: 'yOYDpS0q7Rc', text: () => import('./assets-chunks/styles-GW2G6IRD_css.mjs').then(m => m.default)}
  },
};
