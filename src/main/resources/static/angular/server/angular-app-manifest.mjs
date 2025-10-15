
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
    'index.csr.html': {size: 23793, hash: '014407b3c00e301bb96e831f3dc553ed7f032ed79be02114f12a19cb4bc02ab0', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17152, hash: 'a3b1ccf44199b1a7b4a9c0ef862078b011ab7d6e92a2e242fdd651c0539a047e', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'loto/loto-standard/index.html': {size: 47886, hash: '7245e24dc403e49d62bcbe0cb24d6593403cceb74ab7a8d29aed1b2efeb6340c', text: () => import('./assets-chunks/loto_loto-standard_index_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 46602, hash: '71b7e6439428815f1b0f768cf0394bb709cd385e28e560cc8d46a36ce20119d5', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 49591, hash: 'ec95119c01eddbd5175e42caa9e11f2befbe2ef8eb934e303f9f8fddcb311410', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 44280, hash: 'd8f267750c281a2895e5cd56a86a5202ea57ea7beb9b8019b25e13f140627d4b', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 43693, hash: 'eb4471d21aab3a94dcb56fc0b33f9575319cc7112b4424cde8d0a81bede64a80', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 39835, hash: '79a65694639afd4089eeea257226f3a72442e2b1857859a01097d62a0b7f6c82', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 42348, hash: '29dc85a5072c48685e2bbe7334530ea67c2dad7a1057a075ebd44ea788cd5885', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 39806, hash: '84de06076a3f66b81a42970e9d0704e60fd44419f322cfeef5275c4ddadd0b4f', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 34578, hash: '7f4085ab8ab66e91055628a175e15ec9dd27e9544e1b2f922775f2e059a61233', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 24591, hash: '2ffb5e364562c28b256f22281b08748fd7fc7568452cadafb0e56c98060d2e51', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 31606, hash: '3a69e82c648fd2351c5c2dea9dd1a5919e7e02ff237b690802026dc95103b71f', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 33095, hash: '9715847c46c67560500d819570351e8318bbbdf7a45c652efc7e5f4023b0a15b', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 42604, hash: '74868cefff46acc736586ec2e464c45e7891df8f1965bd2834d5cc68715b20bf', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 49912, hash: '67d57c6024a46d42b3359d41788f1207be82c682a15f73f84e8d39cf0f94a90c', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 44510, hash: '29e8203dfba6c45539db6a9cc80b236e2c2d4f909fdc1c3b4307bb5088e36135', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 36799, hash: '032a2198062bde4948b688f13f21ae3931d05850d4066944b3ab44ee17551484', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 42213, hash: '4832bd328ae89dd0ae518c9b896fb017bdb6fb67922632bb1b6564fdaa8c5587', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 42638, hash: '16d63212cfb39054c4a552c3347b297c17929e18408af3aeb1b7a96a4a56174a', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 42934, hash: '71940331d7835dd98b0cbb5114ca4161030ae1217693294cbdd580806ab0f79b', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'form-designer/perview/index.html': {size: 40858, hash: '42aaa7473e275fd01c875f8e00700053c04c38b718c6d5c90252399dd665c33e', text: () => import('./assets-chunks/form-designer_perview_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 39457, hash: '358ef4b672b516d4e106a5be76a32cc6987909c275f327caffca0f91457709b3', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 55477, hash: 'c16ab5452c5d6321ce1c86e0039a44801216f096b225826d6443a3651051e6fd', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 57557, hash: '35d075f1f04b527708d0ffe387f1ce7fb2f9335a2ce8e2cc5b62f9fb07441039', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'styles-WMY3BGK6.css': {size: 10002, hash: 'y98nJx7Z66k', text: () => import('./assets-chunks/styles-WMY3BGK6_css.mjs').then(m => m.default)}
  },
};
