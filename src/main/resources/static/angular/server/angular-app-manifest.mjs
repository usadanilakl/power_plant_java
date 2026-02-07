
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "redirectTo": "/home",
    "route": "/"
  },
  {
    "renderMode": 2,
    "route": "/home"
  },
  {
    "renderMode": 2,
    "redirectTo": "/file/edit",
    "route": "/file"
  },
  {
    "renderMode": 2,
    "route": "/file/edit"
  },
  {
    "renderMode": 2,
    "route": "/file/table"
  },
  {
    "renderMode": 2,
    "redirectTo": "/loto/loto",
    "route": "/loto"
  },
  {
    "renderMode": 2,
    "route": "/loto/loto"
  },
  {
    "renderMode": 2,
    "route": "/loto/loto-points-active"
  },
  {
    "renderMode": 2,
    "route": "/loto/loto-boxes"
  },
  {
    "renderMode": 2,
    "route": "/loto/loto-boxes-grid"
  },
  {
    "renderMode": 2,
    "route": "/loto/locks"
  },
  {
    "renderMode": 2,
    "route": "/loto/esp-devices"
  },
  {
    "renderMode": 2,
    "route": "/loto-standard"
  },
  {
    "renderMode": 2,
    "route": "/loto-builder"
  },
  {
    "renderMode": 2,
    "redirectTo": "/loto-points/table",
    "route": "/loto-points"
  },
  {
    "renderMode": 1,
    "route": "/loto-points/table"
  },
  {
    "renderMode": 1,
    "route": "/loto-points/*"
  },
  {
    "renderMode": 2,
    "redirectTo": "/permit-builder/daily-packages",
    "route": "/permit-builder"
  },
  {
    "renderMode": 2,
    "route": "/permit-builder/jobs"
  },
  {
    "renderMode": 2,
    "route": "/permit-builder/work-requests"
  },
  {
    "renderMode": 2,
    "route": "/permit-builder/daily-packages"
  },
  {
    "renderMode": 1,
    "route": "/permit-builder/daily-packages/re-issue/*"
  },
  {
    "renderMode": 1,
    "route": "/permit-builder/daily-packages/*"
  },
  {
    "renderMode": 2,
    "route": "/permit-builder/safe-works"
  },
  {
    "renderMode": 2,
    "route": "/permit-builder/hot-works"
  },
  {
    "renderMode": 2,
    "route": "/permit-builder/confined-spaces"
  },
  {
    "renderMode": 2,
    "redirectTo": "/scheduler/flow",
    "route": "/scheduler"
  },
  {
    "renderMode": 2,
    "route": "/scheduler/flow"
  },
  {
    "renderMode": 2,
    "route": "/scheduler/table"
  },
  {
    "renderMode": 2,
    "redirectTo": "/form-designer/forms",
    "route": "/form-designer"
  },
  {
    "renderMode": 2,
    "route": "/form-designer/forms"
  },
  {
    "renderMode": 2,
    "route": "/form-designer/preview"
  },
  {
    "renderMode": 2,
    "route": "/form-designer/design"
  },
  {
    "renderMode": 2,
    "route": "/tag-number"
  },
  {
    "renderMode": 2,
    "route": "/print"
  },
  {
    "renderMode": 2,
    "route": "/backup"
  },
  {
    "renderMode": 2,
    "route": "/admin"
  },
  {
    "renderMode": 1,
    "redirectTo": "/sync/status",
    "route": "/sync"
  },
  {
    "renderMode": 1,
    "route": "/sync/status"
  },
  {
    "renderMode": 1,
    "route": "/sync/recovery"
  },
  {
    "renderMode": 1,
    "route": "/full-sync-to-server"
  },
  {
    "renderMode": 2,
    "route": "/trash"
  },
  {
    "renderMode": 2,
    "redirectTo": "/sync-admin/full-sync-to-server",
    "route": "/sync-admin/full-sync"
  },
  {
    "renderMode": 2,
    "redirectTo": "/sync/recovery",
    "route": "/sync-resync"
  },
  {
    "renderMode": 2,
    "redirectTo": "/log/table",
    "route": "/log"
  },
  {
    "renderMode": 2,
    "route": "/log/table"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 25225, hash: 'c5977878a307f73f3bfd7b8be9f3b683e15b50f34222fcdabcb80765d11e3478', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17238, hash: '5b7b96a508beb60dec0b7046da3ee421761ff09f65b1443d46e974071071cc01', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 190040, hash: '6f2ee7e86c7f8e8ece82382986b459ec92525e9e5fd8f3d7e3810c3d34c84eb8', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 119983, hash: '1ef057ff886367e464a71ea162c454df68e272da8448adf95c993084a2bd1548', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'home/index.html': {size: 121817, hash: '16e56b6c8d5ac54881ae15ad928948a6517d13345fcdc371683ec733969e0557', text: () => import('./assets-chunks/home_index_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 161884, hash: '873a05e591292573927bbaaab84a9abe5a7e2a52dfc98acd600c3b2381bd1a28', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes-grid/index.html': {size: 126207, hash: 'aa51bdcc2cabd2a373d4a4dbf5e6b34c1292459984518e38dad966d63c6cd1d1', text: () => import('./assets-chunks/loto_loto-boxes-grid_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 119164, hash: 'c96606cd07b8bf1b19e12e612ab050748b1d30885122a31a21e29bc5a383bb54', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 114361, hash: '3316d1ff32d7db5df8451876dfccd5122d1b89a97689ca87201dbdcbd05877ee', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 113799, hash: '58d0d05b3f9d6e64962d9528a005c46f250327d83b0501398ffa11b64a1f3cba', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto/esp-devices/index.html': {size: 115727, hash: 'a8bf40d09e19b32ceff1ef6b06309092348f8ebe64cf4ecd0d8634855cc3af2a', text: () => import('./assets-chunks/loto_esp-devices_index_html.mjs').then(m => m.default)},
    'loto-builder/index.html': {size: 196933, hash: '3b787ccb8706ede0be1447cf9257d6d5a482762664c368f838b7ee93d898467c', text: () => import('./assets-chunks/loto-builder_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 106489, hash: '96c4bc50b4b62c3fc4630b03513302964dd6591da95dd210db8779edff090131', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'loto-standard/index.html': {size: 281157, hash: '5a95acbd9ff83958a477237830e343ef475152e6c0354c76ce73abbfb3ce3751', text: () => import('./assets-chunks/loto-standard_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 124152, hash: '865872c3f1157a723e2acadff0f16609a1cd903a264591d3967bf3232e764e20', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 113279, hash: '321464f24b78b585ed94257f0ac7f9dcd92ae752da8f2ac421b3121fe63faf93', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 113295, hash: 'c4aaa6b5c0e9df9a0b7d44cc9ad352379d019edf0ab428fbc1f73f2359906edf', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 113329, hash: '724d4f838c2502bcdc2a0f80a8fc0b43f8da94fc913662f3bfefb8a05d323a40', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 110795, hash: '74409122d44a0201e9b56571fd125358c7b1d3bd3451e82e2d1f1e15033c6fea', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 118822, hash: '7537ca1183d02ae4b27cf0ba61b5148b7d56635172fcd37e562771c667e1ab38', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 111658, hash: '0991af239d922a1f79445470ed5ece99e59e4b19e53b3bd347f61e7f2e967dd5', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'form-designer/preview/index.html': {size: 114110, hash: 'de7c703bda3f07cdc5d1c225b740bc9b4682360b12463ae81013a2b726bbb1a5', text: () => import('./assets-chunks/form-designer_preview_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 124329, hash: 'ac75998d8df2c8c132b25f258d7ac48df39bc42ff3c57150cd595842659bb6d0', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 127711, hash: 'cd5700ed6642f3e0e431194203cbc2a53b3d912c745d44a0d7c059d69f4eb691', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 102436, hash: 'aec79e51267283336ad9a25e146ac6987ef79e95ae6f38587c373b11c4e7c209', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 58224, hash: 'a88fde15dd05eed0818faf4da49618eae5edcb32304e43676f2d4cd421cc9797', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 110129, hash: '3bf74a4ff1ea7d20d6df23b6883911259da9e9e774ed5d6106d04da3de39a5a6', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'admin/index.html': {size: 110652, hash: '6d298fcc046c97e06968220776f87ef7413fd9f92703ba11e8a8a1172020b15a', text: () => import('./assets-chunks/admin_index_html.mjs').then(m => m.default)},
    'trash/index.html': {size: 65688, hash: '2b53fd1c1f4a76c5a593c5ec5bc26dcd37297e8f7ec56fe121eabbafe8f75c33', text: () => import('./assets-chunks/trash_index_html.mjs').then(m => m.default)},
    'log/table/index.html': {size: 129906, hash: 'b6ba51742e960acbcf4f5bc157992d31f15fbb6d69d3d3a41fabc5bdbd7651fa', text: () => import('./assets-chunks/log_table_index_html.mjs').then(m => m.default)},
    'styles-Z3PCIMZQ.css': {size: 32780, hash: 'yim97pIkghI', text: () => import('./assets-chunks/styles-Z3PCIMZQ_css.mjs').then(m => m.default)}
  },
};
