
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
    'index.csr.html': {size: 23674, hash: '5f88410246eca92631bf9147eefd632722c5cc6e1d4c78e002569d200b298f95', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17152, hash: '9d327ac7bc95253b677e24751622e38de7ce7bd5b24441a6623787b1d46935b3', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 46280, hash: '7e2cd6f49bf9d77f4ba0441863328f9bad6f230a03b174143ab0b14657f9ca2b', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 49033, hash: 'dcc5188bdc69079a1623c5db08824eaaa7c6d52176196da6fbb2c7d5b527d7d7', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 43317, hash: '4c0acf5e9cdd0a21267181a10a7b5b00d77300bbe277c7a1d124b7e66a332057', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 43893, hash: '19dfb58d182691f2289859e97fa5b5b6c50feaacaca4a47d360d5eb5f91b8184', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 39518, hash: '2d567ed7a60bc29a115ef913155a3f6937eeeebb6c69922c29c0c363e0a8429a', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 41970, hash: '31d8aa1874bcd6b95be3527a5984e591d488a451a201d9c2951b129f61f6e828', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 39481, hash: '04aac703bc0c945c0f3f8f0959ebe79ac8bf1bb370428c0afc338abeb05eb35a', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 24270, hash: '1c8aeb4032295434911090059947ae858d0c656c2a123723f2b28309453e14df', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 34259, hash: '5ad12444e1f5a38da54a9f43be6a5efe4acc1d8ef152072212a489fbf4d070c2', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 31285, hash: 'f1c248104d197542d24eb82472c99dfd55249a2de8638c06bb267b42d4cd18ec', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 32774, hash: 'a5fd0692a5039b8b96abd269126ffa07e12e88792dca29afca3b095614d31dc4', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 43651, hash: 'c1634959479a10a61532f31f49c67b4ef00fb9eb9b9eeaee8c2a065aad62b9ad', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 49597, hash: '3da98eac9512653f28beb252d99055b47a276635c9a70f97f3da452c53ab1652', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 57235, hash: 'd6bb92d81a8ddfd443df3a047f32eefa3ffe4ec9205c08ca9e03cbd5ef495382', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 42280, hash: 'b9c933de37bed7ab20a9acf56810e41fb1efb7802a41ef88fc4db5be9019eef8', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 41902, hash: '63a444fa728b3617d5622c503b714e0193b4d6abddc1c043bf7939b90cddc1d7', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 36478, hash: '2946db8fa67202f7189f9decb0280cb88ade73fe7a6aa4531a729b1e5bd23026', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 42326, hash: '2ae63517a9aadd64d4305b29f8a9d50af948443b0926bb7803c328ff06b4debe', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'loto/loto-standard/index.html': {size: 47564, hash: 'a22bdf8b8a38eeb2546650f6d4bb2e5e14d511e07d16b777dd0f22b2280b5332', text: () => import('./assets-chunks/loto_loto-standard_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 42611, hash: '2aa53aaa637ee284222445f25863e2ae6dbdca8e98825baee37bd21d1ba87a05', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'form-designer/perview/index.html': {size: 41072, hash: '7e288e105acd4131dac321dc0b3e7fdcd42a7df3e0400c1f3c9ffee38d89cc55', text: () => import('./assets-chunks/form-designer_perview_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 39136, hash: '6df906d65ad3aa340089fd344e6091c2375e7c00a7f438df166905ad32dfa2b4', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 55156, hash: '59e957b07bb526fbd16cc62984478c5241ba75f2b7f79445ed25757257f336a1', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'styles-WVLSSJOW.css': {size: 9627, hash: 'm5kLIVbtCdo', text: () => import('./assets-chunks/styles-WVLSSJOW_css.mjs').then(m => m.default)}
  },
};
