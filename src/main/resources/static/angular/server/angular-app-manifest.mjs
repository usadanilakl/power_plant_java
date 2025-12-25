
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
    'index.csr.html': {size: 24527, hash: '53094e2a561bd0defdfccd4daa6872c5551310afc5bca4088e219943e1973ef0', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17152, hash: '8c208ee09e5f8f2adc2cfd338423fcf9a0181b9c50c59450ee3b5bb0da8bd808', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 60557, hash: 'ca63d62186f40bfe4f7322029363b7024ae0d6b208d652e0a768f4c4dd84ae1a', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-standard/index.html': {size: 60097, hash: '84f27db4e2309ac6bdb450ce2a3bd08a5592061298ee3c9c6b82914e03ea8bd9', text: () => import('./assets-chunks/loto_loto-standard_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 59306, hash: 'adbb69870d6838115ba6e963da3e78f652fe3fe54126d94c5131cd98d2d8a35f', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 59888, hash: '84031891f9466d90dcebb2f383ef3899113bd135ba57bd8947fb5e82684031e8', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 55446, hash: '369280ecc339787dbfe2d711c65c45e80ed5bdfd192a3e05f56f7a73fdf5385b', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes-grid/index.html': {size: 67688, hash: 'de5b3bb208497144f6eb811b4f61fd831a54c4ec64c3b37fc550f49a7b2306fc', text: () => import('./assets-chunks/loto_loto-boxes-grid_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 55413, hash: 'f2948e0cbfaac48bfaa5b015589649b27ac42c437bafcbdbe5512c954fe29314', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 26309, hash: '5ebba081d3c4dcd8b6e911b84e01ca9a486a6f93451b39949376586560f72cc4', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 36298, hash: 'c9b075ec28398359f91222fecfab357b43dd05357f8846bb61d5ad9465687e5f', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 42920, hash: '3951f7c313fed441629b17f94ed346374383471655b872b214ef07739be72ef7', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 33327, hash: 'd6ce0693c672105c21b1db516e11085c15e801918527113cffa8ea556273a5b2', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 59743, hash: 'f063dc7d2868575132a338033a1c47aabeed573bd6244a32766fadb24104a85b', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 52433, hash: '6eb194a80f884a7ad5225cc58611e4f633d3751c9f6fab485223b806e24594ff', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 62199, hash: 'e886007b532286a9763c380e2b9afdee7c8e10f661b293e4aacfab99a49bd8f8', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 52469, hash: 'f710e470bd40ca29bc9a6a5f1c9af746f69d1c129ff87d810e8f2f4c11279588', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 52042, hash: '46e5b062751e91f5aa017a2ea19537d6f67068ee7566c91325ef141620f42207', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 45668, hash: 'ef3d2ea3b9155213282ec76a5168481874e82bba0ebf6c18869debc058804991', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 52630, hash: '7227c4d4718cf7c010c8fc7544260939b6ab062fba5f81da5ee329223724a678', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 49283, hash: '10aed35a2c40c57c77713a8529d3e6b3aac1454047af49bfbc19d4becef0bd04', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'form-designer/perview/index.html': {size: 51258, hash: '35f9235f9eaeaa472422e805270e77ff887aa9c8a92212f2765a745c77516733', text: () => import('./assets-chunks/form-designer_perview_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 65327, hash: '7d7f1693159e916f991a8ff1f9391be97ea419e3d7e232fa91615a91947c75a0', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 75104, hash: 'd41cc393e165ad16027f2b7f97f559f4b33f53cef3e06f2e7eeb1d412df8a537', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 81678, hash: '7babf70fc27ab2f735658e3bfd4746c096fabe66c8769c5556a8d81f8059870c', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'styles-GW2G6IRD.css': {size: 12481, hash: 'yOYDpS0q7Rc', text: () => import('./assets-chunks/styles-GW2G6IRD_css.mjs').then(m => m.default)}
  },
};
