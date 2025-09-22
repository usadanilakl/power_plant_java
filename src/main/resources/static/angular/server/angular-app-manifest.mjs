
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
    'index.csr.html': {size: 23674, hash: '1bd371ae67174adf648552b4ed8e9b525d8401cfb1f4ffb2201f2411567fbc4c', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17152, hash: 'c3b07788111f412226923cbf0ce03312c7817ba3e9a9bb427e982903d0a4b7ee', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 46280, hash: '7641afac6ae21d9f12f4918446d0e33893ac7f9a3982e132a46c6dbf1200f6f8', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 43317, hash: '6972726ccf2ea9766c35e6b021a0b30dbc53f56ff1559552f82479f16b9a6130', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 49033, hash: '9d1553e8653dd2ce327b763b39ea95ea0e5cc805c1343821d7daa23bbc36cfc1', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 43897, hash: '3e4a86085bf984133b7ec0106f65b885e56109261da78f6d16b2c1d3c84a9c49', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto-standard/index.html': {size: 47564, hash: '7ebd7668d36355f8bb5f929269e86ae95a3609f0dc593cfc1785e790cf4ead11', text: () => import('./assets-chunks/loto_loto-standard_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 39514, hash: 'f41912234e8defb2388d10490cc010f3b42ed5c6c9ddc7f5dd583fbcc50ec841', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 39485, hash: '35d99fb8d2871e56a32a5c89c035ae1205dcf5a59d4104f8e632b0781b073400', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 34257, hash: 'edd4ea6006cbfdda331403109e8d05f39aa7529eb66b2ba0612f4ab6d9bfc1f4', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 24270, hash: 'a8f59a32e8ce051294105bc6cc917c0930504df7a6b85171adec0e8bd13372d3', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 41966, hash: '9228852e1a5169c85dc8c350b2ca2835130a602ae55b99f312a0f1f7353be7e2', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 32774, hash: '409b6caed1d9851ddc939f9bac38e7f97c643b26fa6dd1bafb916f20940f1f6e', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 31285, hash: '26226b9145bb7529ae72b75537a67ef1386ae84932b7e612663a735350e4a3ba', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 49595, hash: '5f1904bd3fd4222026afd14daa370abac3c0b42249244aee3ff6de36cee28614', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 42278, hash: '4e91e2da5ca25c23d18b9ea5a9a8bfb187d99f48f2a584574914c89736dae9f0', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 43651, hash: '8e70ec61032945d1352a60a838ef1b76a76fbb0b29fd5713a38ef661042aa9c3', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 41900, hash: '6827f8e2eaf6ec41dca658a9ae7ab3de9979c2de1a45173dd15187bfc41d8cae', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 42324, hash: '087fe576b5390c54399e6e0858f05f698dff668e4955966f844140c6e0fcb7e2', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 36478, hash: '4d89732698cca90ea9f189578b4fdf942d01d3c3a7eed1260fe3db686b80dfa3', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 42609, hash: '109e8444238addeb6fd8c57796189d1382b53b1c34f1aea78b7d03f1665b89d5', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'form-designer/perview/index.html': {size: 41072, hash: 'dc6e562f5e85041a7434ab895a813d29281ee7754052f20e65d69bc829c05247', text: () => import('./assets-chunks/form-designer_perview_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 39136, hash: 'd674bf4b2979d6263d4a10260d5bf0045ae6e6030fec5d65d2dc9cb29c9e0596', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 55156, hash: 'e3b14423521297632c7aab69adea4af5e0dd9de14376d6fa4ca3442d0d426553', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 57235, hash: '108527e5d5d8e8bca0daedf4d7286b86f26bcbe755bb6af41e53d479f3dafd39', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'styles-WVLSSJOW.css': {size: 9627, hash: 'm5kLIVbtCdo', text: () => import('./assets-chunks/styles-WVLSSJOW_css.mjs').then(m => m.default)}
  },
};
