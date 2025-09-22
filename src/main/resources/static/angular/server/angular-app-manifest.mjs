
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
    'index.csr.html': {size: 23674, hash: '3c8ee52a70f17f31a43e4085cccf2d308af4db20e41c5528e9bbf9567afcef45', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17152, hash: '8ebd628d5d87a6c847ed42c4c066e5fe24957dd38cb997a9e91ab3b479284af7', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 46280, hash: 'e58322fc599ea50dcca28cf27aad45086b4f70aa87ada0e1f88feab44704440f', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 49033, hash: '8543bb150c9849ac2a69dcbe8885588c4cb746c22b0d8747ee27a75a46b105dc', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 43317, hash: '17a4a325fc62cfbd875833f68de347dfaf65eb69c179d2fe38e989e51649e66f', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 43893, hash: '02e9210e2f54c94cae1f04b62648ce772010b4636f92da629b3e95d8e90ef13c', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 39518, hash: '6c232d11678a3d08faecf7cdfa688d40150fa5200ccdcc3bdcd5b8c351219a47', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 39481, hash: '8c24001cd4814163c73dfab63f9333ee587f97adcb7c852f3dae378cb65c9e8c', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 34257, hash: '74ebb666073739148b6fd63a6e14f378b275394909afab977e5ac08a57a8541b', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 41970, hash: '3d98c167263362087547f7830c79a9c0a2f4719b7d082997776d7f7f489220ab', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 24270, hash: 'e85d717622f2def9d6b1a2d094828fbb00387551b7b5ae845fc4743c29b02ef2', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 31285, hash: 'bfc70495b42aa91c1ed61462f8ae77b3bdf86868a13e60bbeda74c5fd2f36b23', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 32774, hash: 'c4aa950b70ddb1ce210486ecfe02b581e80622e39c9a3bbec21677e54d10f43f', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 43651, hash: '0df7ab71800ecf530475511da885ceafedd78ef2a6d05e51e39a039e7a072523', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 49599, hash: 'fe175d260596870d8ab92d89562d323e126fab14f2378f102fb52b6b9fb12519', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 57235, hash: 'dac8f90bd496a61794b64aa98c39b194b471427bcc0260d75df3cc7a4f9d30f6', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 41904, hash: 'd25972fb59dde17ddaaef5ac91d08ba6181e87944f5366733b1ecbfdb9b77b1e', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 42278, hash: '5ba7bb2737ef162efa30fdefb878d4c71f4f1fe8b4a7f0f79c08898ed512364b', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'loto/loto-standard/index.html': {size: 47564, hash: 'b351c0394d749e0ef8f38ee27c171032900df114f955954709b0ece90b7f5f17', text: () => import('./assets-chunks/loto_loto-standard_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 42326, hash: 'dbddb23a6b465d484604c3b632e8df3e30ca4718040a7055e8d7916984f299cf', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 36478, hash: '21567eaafc2f547961d8a11fc989282a19049036f5ff00baec546cc20dc64633', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 42611, hash: 'd694b16a218f2483b4ddc769f321731459c4b73f35b45ede924fc3fe3e9d7052', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 39136, hash: '2e8191ac2ea2b8ee0ca68c1edded4bde5fd4eeb5b0a5b4cd83589e4b55a659db', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'form-designer/perview/index.html': {size: 41072, hash: '89441710fcd506dd4e25f5545af5644c57fdb1adcd35f39998dc9093187e3dee', text: () => import('./assets-chunks/form-designer_perview_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 55155, hash: '21e7ed5c273f512f222f05438a15c518c4004958fe7074c8336e62565c4e7146', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'styles-WVLSSJOW.css': {size: 9627, hash: 'm5kLIVbtCdo', text: () => import('./assets-chunks/styles-WVLSSJOW_css.mjs').then(m => m.default)}
  },
};
