
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
    'index.csr.html': {size: 23674, hash: '08bc1f38728e7962f8dfe9ac0fc3c4ca7642440e67468df04f2cc5aeb524c67c', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17152, hash: '27936fbf040a5127d866238072821956d6f6294012147a8bee5299be9241d432', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 46280, hash: '62411b5f36f3469625cd40a1ce54150aadecd972c75257a2fcaa3f2e0d7fbe66', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 43321, hash: '6b74a7876e7bac8ebd2d1ca2e9fe0b9e76662c33b53cd192f5989d159a490c3a', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 49033, hash: '8a44c4c0ae24b61cfde0ac75901e38cec7d9b2df43bf8423de6d32067c877e5b', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 43901, hash: 'e3ed3170d923eace0e200de0c4a8f2e296f0c16a07472528289316df76e22ae3', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 39514, hash: '701f75d8054c0775d12ace0cc07387d76d036086d367731ef87ed742b263046d', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 41972, hash: '4c1129e1f6adb65e97697ede31cdd9255da8480613e00fcf086f5398d7125f00', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 39485, hash: '7ced4f8469e18f61d0bb90e1352ad072222c0dc0f05466f39e2ca77fd4c7d77f', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 24270, hash: 'e17e65da471e55a3589f47e5307ec9d13a817a9bcd516bd981325d4ec3a1a095', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 34257, hash: 'abd6d141384eafbc4e2aa82c08718551bdca1abbbe66215592977cacff9f00f7', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 32774, hash: '175c1075fb575b60f63b7c41f39941953a762a2e3c1d18a8f530c87229b13cf0', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 31285, hash: '3701f0722451e567d38d13c716ea9827e2ff045f49b6c4c5878a27be99a27cd9', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 49597, hash: '050cd894ef29741745b5bf668168b602da5fb6f17354c61b19ffa265629c983a', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'loto/loto-standard/index.html': {size: 47564, hash: '191316aa26e348928397ed7d7a4a521f971d36edc19e688691130de02cf9efd4', text: () => import('./assets-chunks/loto_loto-standard_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 43596, hash: 'bd3961ce0037a84acd6056c73241e26d14c9a649b41fa99ef00083e5b268d949', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 42278, hash: '63a051cf84ca2984ce4504d50ab5e8f8518ef7af776bf3a59534037d7a8416a1', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 42326, hash: 'ac082f490fedcea4e1b3a8d151931881430c86b325c2319b5452b4988ecb7590', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 41900, hash: '2c753b43113ccd1dce5c1910c78589680dd1231ac34b90abdcc411589b8ab414', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 36478, hash: '5c7b64581fda960e29bef74e2538bd1e7800d94b260c8316da2d0ad88838fdd4', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 57235, hash: '7c4256f6d643d93efef7e32a9ed32b2c6982a258d33d940a843bbd35b4b7850b', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 42613, hash: 'b7490d740888cc973e6b2a8e91edccb817b6390ee854c6d7b217f5f503c0b3ca', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 39136, hash: '065d942e0038be730951fd2199b68e91998a651bef8d6b35a61a0e70a6b88552', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'form-designer/perview/index.html': {size: 41164, hash: '13c9e904c6bc0c53c39f076aba03a2798d8c092047cb8cdc9a42708aa992d168', text: () => import('./assets-chunks/form-designer_perview_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 55155, hash: '3bd8963560be07a60d207fdd1ead2ed7b1bf09a309fba80d4d80661d7fdd74c3', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'styles-WVLSSJOW.css': {size: 9627, hash: 'm5kLIVbtCdo', text: () => import('./assets-chunks/styles-WVLSSJOW_css.mjs').then(m => m.default)}
  },
};
