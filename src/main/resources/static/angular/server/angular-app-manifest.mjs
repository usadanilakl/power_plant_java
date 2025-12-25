
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
    'loto/loto-standard/index.html': {size: 60228, hash: '6546bda5fb95b002e3be97ccf02f969fb3adc7c08915acef71e6895d0d03722d', text: () => import('./assets-chunks/loto_loto-standard_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 59437, hash: '02d8f8be4991f9a8cad3ce935b2398154f6e9c3f53fc7428a929f2b6a005a34a', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 60019, hash: 'bec6eb2502a1cd958d79631ca8786d0d5667192e89d4402aaedf4a07c074c067', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 55577, hash: 'd9a793e128cb4f0e8af4e36c13c07b986168c6a8fab70b073936dfc10749b971', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes-grid/index.html': {size: 67819, hash: '77310e5859f8da3e7f617f45416bababceec9b903d2816500013fc909f65f164', text: () => import('./assets-chunks/loto_loto-boxes-grid_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 55544, hash: 'e75bcb75bf3d97c671060443e091896882e21341eb88998fc4b1a69ef697221e', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto/esp-devices/index.html': {size: 57334, hash: '2c330990c688cb528e761786329a96a72b9b5161b123a0e753c408ac4de84a07', text: () => import('./assets-chunks/loto_esp-devices_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 36298, hash: 'e0e367e7f427f90b0f25add7dbb9e149fe035312d4a930c33df812644485dec0', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 26309, hash: '38f956e5a54e8a03799d557f755e2f88982727a4dd784fdee521852298fcc1b0', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 42920, hash: 'cc54e270001ff60a1ad5da9a5dc667a82e38c31ce99be35e6cd516f05989a159', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 33327, hash: 'cab98c1808725827097e1fb937fa4f568a6e3fe4af2142e11e32fce4aff3fad1', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 59743, hash: '8ca879400eccb7ba652d3b834ed2e279e3d7e763a7f15479f6da32032204a2e9', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 62199, hash: '22ec6b9105e86270243419a8a89ceb0308ba198322d97559b5f7a16213fd023f', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 52433, hash: '33824d338f250145512a77c8e31f6025bcd04f0a2ab91288b36bcac9d9f017ec', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 52042, hash: 'a45406970d664e540dd2c2bea1699ad3e040ed185265055940668fc880280fad', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 52469, hash: '9de19cdd0cbb019030bba1a438e22b79de2cb198c10d68eb98ffc03e869c86fd', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 45668, hash: '20389248aad89b90ad451f7da2211c527362feac301760f9f859be8c36be3edc', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 52630, hash: 'eaf0a656ca7cecf1976e483ee68ccebb82aff1129119defe050be456bf5b9f67', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 49283, hash: '7cd4a650d5b66fd7bad9b4b8a965210964226c65a3b0956493652321b9a29cf8', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'form-designer/perview/index.html': {size: 51258, hash: '1a03f1357cf9397b3d83289c84d356a1008d635a7b6eddcaf769fbde1aca4cc4', text: () => import('./assets-chunks/form-designer_perview_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 65327, hash: '25f4bd31cda52ae86152cdd3bd7f96f6e4203a317d8bb4f6b618b7bb744577fe', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 75104, hash: '2776174e8c0c6a02bd2698e3bc9ab9f786eec1a45652712c46a86699e08f7bc4', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 81678, hash: 'd3392fbc75da4be638f5cc4d3d8e7872be2151264c65c9a5b037ec41af091d8d', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'styles-GW2G6IRD.css': {size: 12481, hash: 'yOYDpS0q7Rc', text: () => import('./assets-chunks/styles-GW2G6IRD_css.mjs').then(m => m.default)}
  },
};
