
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
    "redirectTo": "/angular/browser/permit-builder/jobs",
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
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 23674, hash: 'dee0c26f81b62fa8fc6eb69d1227ce35ed37b9423254073e085f513d890db4fe', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17152, hash: 'e3daa9272b670ce71a18756810dae6d9727559157cb540aaec3c56d9f133f818', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 389848, hash: '87a24bfd4f7cfafb2e6ab2aa9d3b161b92173748ffb0f59b6bacbf195551cd0e', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 52047, hash: 'e874987914b6a9f82e56623362d8ebe645915612b9a4eae3eb753a2b55a5b15c', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 66465, hash: 'c12259342b0d3dabe9067c141016d170413e36fa169c0ad95550dcdea1450bd8', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 39907, hash: '255d2bc325e4815bd7df3eefde9803b73a6e7fc1bc4221d05e8f5ce913cd477f', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 82941, hash: 'c06d1aa39e80cd71a91a16c18a975a36acce0b1f7e861a08a0451ad905816f0d', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 39342, hash: 'a2e6158882000bc996226256ed5bdd1a14ec6508b97c9be34a3b2b7400907d86', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto/loto-standard/index.html': {size: 62999, hash: 'feb6354e28e570ab5fd85ec65b5a05129cea96296930b5136cb67cfbeb9dbbb7', text: () => import('./assets-chunks/loto_loto-standard_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 24270, hash: '2ba43d0d8abb9d782949e044c01cadd7957e994454550fafe7971c6b8cbc18c4', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 59004, hash: '382b64b9ae3af1ad9d1eca1128edc461b189bf42a4a23ccf4e704895a1894439', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 84066, hash: '0194ef9536ae49539fcf3318364298cfe6bc632d1074dd15f31a73b6df892568', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 32126, hash: '5e2b8b7aa90118cce18c4049d294da683e7a0d1854db7b05d7e5f24ad38e5c12', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 32161, hash: 'faee4da98f3f9d8a4f42bbeb08b1219f1d36456561a421d06b023dc025c7178a', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 36339, hash: '35bf8bf6345171390d2f440bebc1769a5497fc6844ef2e53dab910a281d29ce6', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 113430, hash: '7abd2f55fd61a30bb4aab226dfa5f85efdb3a24ecb35503342eef63dfc1bb3cb', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 112542, hash: '3c6f76f5a7c4c814a390ac3f1f103e7f2dc09d17ae32e43939c27176f08bf691', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 1364539, hash: '7c626c6bba7c67c81f408fa474686aeeb9e12103a37c14584dd39d2b1d90e557', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 89543, hash: '80e4223fbd19f0e5ba5ff3a3faf272e90f8d8f6eb598b4744bbc705b59080905', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'styles-WVLSSJOW.css': {size: 9627, hash: 'm5kLIVbtCdo', text: () => import('./assets-chunks/styles-WVLSSJOW_css.mjs').then(m => m.default)}
  },
};
