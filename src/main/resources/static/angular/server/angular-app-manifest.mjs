
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
    'index.csr.html': {size: 23793, hash: '299520f6944b2940392d2a2cc2e2e20ba5b1d4e63b90f57f3a5c8b08401aa5ae', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17152, hash: '27bc0baa52f39c8e5c5611bd6343309b77b581def16a069d949658789e8fa616', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 49661, hash: '4df7eabd03cc50bb8e87dfd9f42229f3d1bad1cb0e528e8ea9ff9e444c2489e7', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 46602, hash: '2232b57437cfa0c953b02cd25bfa44a5fdb400745990537281137d0ab94b5b2c', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto-standard/index.html': {size: 47889, hash: '57a9c36060d92c1c1e7ad1028425521e2e50c430bf627fcd91aa74eff329b92a', text: () => import('./assets-chunks/loto_loto-standard_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 43638, hash: '9b956f2f6f57536551cfb4631a77d492b5af1b72a04c972f510d6d8c4d2f0c63', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 44215, hash: 'f5ec52bc0cea1dffa2f9d1059658e1ae122a26f565c7c922f3816a50baa3a930', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 39839, hash: '559f6dc378ec45de39d5df676ee673ec27334ae3b50861d3d932c9fc9c6aca5b', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 39802, hash: '73de1f3cf05cea63f793c8914b9669c7b87ba3edcda5f0595268217105fcb9d7', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 24591, hash: 'fcbf586e396e6a1284a7d8c8ccc68a88e831d7097f9fd5032c4fb2a0dde30b50', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 34580, hash: '41041d58c23c0b9a41f0ef9c780920d8e585083ddca4bd42b4f713db220d1996', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 33095, hash: '02a885a98f6577ef5df6f383b1c025e7444f288bc80a6c16a1e934cbc5d7c5b5', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 31606, hash: '2c105892572d193dbd1340a05c9ad34187175b9efefcacd2c24d21d7029c3ddd', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 44571, hash: '935f4a81924f58e87b78f6dcc6fde79c31adb5f12ad5da5463c4f200c96235e2', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 49918, hash: 'd15215f0dd699b504601e0eea96310f04d86e91c4e5be28da80d3819c112858e', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 42599, hash: '2ce44666a2cd220dc6afd9491067698f74bac8ba895cd8cc3fe8a4cf15f61309', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 42220, hash: '7750ae8f7c22cadf4895775f6a3afb69ce2c2a8e9452c690ddf0aff5203f6d85', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 42645, hash: 'fe04a9bffb997661f3b3f8a2354c5dd4745e09aeaa7dc601db5f23cedeb4ebc3', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 36799, hash: '67ba0cbae75f1f6be128fb77dd1faa1f4c8612f5cddf6d31de47dfd82b7251ae', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 42932, hash: '751e6b8c5bff36bd26ad099aea47103841e63d57bbaf01ad6731d07b618ee5ee', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 42285, hash: 'cd4e93dde98078bf71f47d26eea85059c4b27f1f582ffe5cd510ee61afdb1ddc', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 39457, hash: '212cbc2b0449332eb5181739470ee7534d0c1cb965b147bae34b039bc9b6e9e5', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'form-designer/perview/index.html': {size: 40858, hash: 'a46b348a904f8efb6d49695dec772dd458ab3feec27173c4b91cd2d75446c9b3', text: () => import('./assets-chunks/form-designer_perview_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 55478, hash: '337c61af04e08d6ec5a96a27be2309fd60d0bbc12e427995efac08907a95cd1c', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 57557, hash: '0533f838985bd748fd059a0d9f867000464f6a4adf387dcd852f7bdbc49faa18', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'styles-WMY3BGK6.css': {size: 10002, hash: 'y98nJx7Z66k', text: () => import('./assets-chunks/styles-WMY3BGK6_css.mjs').then(m => m.default)}
  },
};
