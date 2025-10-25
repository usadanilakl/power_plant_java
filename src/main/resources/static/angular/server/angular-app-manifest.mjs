
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
    'index.csr.html': {size: 23793, hash: '3a58ca9086a1fe410824802608f587355fd2a16799bcd6e54939e41bbfb7ec39', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17152, hash: 'f614decd4a5484a7f12dde857f4122d2d05a1830bf368753d9c24c8726bfaf1d', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 46647, hash: '030a2d96583b5291bb80ed4605c432c04d7419bbc8bf8099a0a7bda8add2646b', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 49636, hash: '92f3a2fdcdd0bd2818cfdbce488a9907eaa071ed594a4c75caf2ed4be7648167', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 43743, hash: 'd3e0f772d25c2e640cf2348490503b2c40a2fe3dbffd694750cc1134cfbe5611', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 39884, hash: 'af13c7510532938ec13711037f466cff53ac22a742bfa8090880aa3284e03dbe', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 44321, hash: '1c54c35cea2621c87aab4cf482ae98816fc563aae2fea372c00aab9b6edded35', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 39851, hash: 'fecf2334a6ddbc10b22df62d27c12f141647c7fb0547421c3738bd38c6986d36', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 42395, hash: 'a0dead13735e1a0b529b714a9d0e2298c1d1ebffab2cbe7977ea494e48cebb06', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 24636, hash: '0aaed71ae399112a6e57811e2870243b5e9d0ae80dd7f511e44abcbe45492ac8', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 34625, hash: '683e1caf7cd43a60474c7a679e6bfb2fa70b67165f822fd90369f5e7af0bccf1', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 31651, hash: '8de2c1e70d6232c194e310d4c41c165a7008e24277ad76107d06492ff8d27139', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 33140, hash: 'b97df202a8e305686e4dd3a4db48da378fb4bf5b557f3942e7ae986de99306ba', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'loto/loto-standard/index.html': {size: 47931, hash: '751c9e84e960a51458749ef3a52f576f49d9ec946787d809a79767d5e1687c21', text: () => import('./assets-chunks/loto_loto-standard_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 49959, hash: '34e1064f73a73a5ca20122e73f6cbae84766e3f8f0ac177efcf26c138b535a70', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 52156, hash: 'e3c84a275f14f8689ea054f7f9a9859c9d87477bf9ffaa526252971462594242', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 57602, hash: '6a038a9446058956dd046bfd3cead6abc3dc3468e85ab7221ec9c2a3e7dee79e', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 42258, hash: '4cf3a444952638056a9e36c15b414c6a227722030ec9e30448d0c37df0e85d9d', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 42647, hash: 'eaeb3fa472b1a670b36c17a501aebd3c7479240d0d964ab08aba9846241539c4', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 42687, hash: 'b8bfb28b04fff921daf09a7ddde6c733b502ce1c25ac292dc578f1308d653cf1', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 36844, hash: '40c4b3c84b8b7bf2b1fa1af9413a0c7a1d29401be55da6f7f81db62316657b07', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 42977, hash: 'cd6572a0fc5f82c9622516b43928681d0918a09b7c3355e066733d87524c63fc', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 39502, hash: 'ec4fca2d63a8fe01f80b682f2fd08e4894297187a88daa47d0308a8fb6bf2b11', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'form-designer/perview/index.html': {size: 40904, hash: 'beeb51969e8346130829461d991b8c78ad2a916b6c60463ad4bba8c1b0d0762e', text: () => import('./assets-chunks/form-designer_perview_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 55522, hash: 'd043a37d9dcf8b8e517d2cf1cb05d4f50579c5587e48e59b7df421ee34087e13', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'styles-TNAVY2DP.css': {size: 10047, hash: 'OPTPw42CT58', text: () => import('./assets-chunks/styles-TNAVY2DP_css.mjs').then(m => m.default)}
  },
};
