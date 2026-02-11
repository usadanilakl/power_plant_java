
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
    "renderMode": 2,
    "route": "/admin/category-values"
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
    'index.csr.html': {size: 25225, hash: '91459c68dfe5753439329a32f41db34bd48c08810abdddd51a608625a953d313', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17238, hash: '5fd5ae8b403f9eaa0add4ae79784a924ce6416f78f04d8038dae5dde7a414f60', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'home/index.html': {size: 141565, hash: '4ed141de9b1b9b1013eb5d0454a4b53f44d3b9a2caa1feb5d4435c97ad1935e0', text: () => import('./assets-chunks/home_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 233604, hash: '842e254f410edf621f75c4bd4d8f45029d7cfed1bd5e32aec65ffdd506e80265', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 132651, hash: '7d4b315166745a8d2e91c4f03dff67d7f822b4876c44bde4d86e20b2624277e9', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes-grid/index.html': {size: 151888, hash: '44a3c41236b512474cba61d246fb90e8ab7186da13e8e5a15a16373eb8485c20', text: () => import('./assets-chunks/loto_loto-boxes-grid_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 132086, hash: 'de2342115f77000ba08890f42d367f02d4e03726ffbcdbf7ab002a2f62684792', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto/esp-devices/index.html': {size: 134019, hash: 'ce90288e05fd516a0d40f15ba195310e8aeebf7506e71d03af68b1be9966beee', text: () => import('./assets-chunks/loto_esp-devices_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 3571738, hash: '32e59b2aa5a0d430270712a03d44f2b9b9c9fc5b776568776d9d8e2804f13a92', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 3653251, hash: 'dbcd65b208db9359a8e2cdc59ee77f3620304924e6d1525e32347d8028fff8f4', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 125763, hash: 'dd26f4c54cced75c00fd53ae73d533e633c305c8d255b21149d61b18dd53b480', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 3552445, hash: '3e75640e495276c409b024c30015a0fc24acdcba341234a0dad9875b57fedecd', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 224328, hash: 'e3076238a9cec53d63bd03d511cf7e9352d85c8bc6dd70f305d2fb2440ab1aeb', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 721910, hash: '712d1c0de4ad4ca1be18d9ac88645dc8d5d4ef6934908a2f7c91131336bf1eba', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 270803, hash: '079507bb1fe0fbdbd965ff4bf158bf1e752cc8add31d5c5b20ce51239673febf', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 404478, hash: '9f35cd243413c24d81923bbefc28d94ca94edc821ea05de9f3638f3c8349b271', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 130068, hash: 'a75cf10c681fd437676c3ba3487f756e04ba75a16e425605c6850ce5ecd54568', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'loto-standard/index.html': {size: 7703233, hash: '446e8cf112b707c11ae6cc25a08a375b4ad0f9b12fecd255f68a9c6c2ccd98c5', text: () => import('./assets-chunks/loto-standard_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 715073, hash: '05736a169776bcaf6085881e009607eef3c4e2c6df552813f405f100bb036d93', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 616786, hash: '13f415e825e5f5a466775c3d5800453b19ac95dc225ad219e112d028006909ea', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 731128, hash: '276eeb651361f606715c93c938b3182c2479b20ffe07481805d5b013526e9daf', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'loto-builder/index.html': {size: 3724810, hash: '89527d467b15a39e6433da900a6513d3e4963066d56f87bb331f1b4fff30b452', text: () => import('./assets-chunks/loto-builder_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 76511, hash: '64e9aa90260157415ee1ff841dd669f84fb3952420b5165a62357b1d09a5137f', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 128416, hash: '0a25186d280556171c858068368d2e03ca602fb27fd564fd46e46c2813ff1d3b', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'admin/index.html': {size: 129685, hash: '1e27378519bb4837b4893f92fbb10a4d177e9144a2aee030242ed007f14f0505', text: () => import('./assets-chunks/admin_index_html.mjs').then(m => m.default)},
    'admin/category-values/index.html': {size: 124424, hash: 'cca7f1456e32762198e772bce3519a44ebbd6f362dab9b6c55542cf6e704a99c', text: () => import('./assets-chunks/admin_category-values_index_html.mjs').then(m => m.default)},
    'trash/index.html': {size: 83982, hash: '626b10859fedc0f4ba65cc0b87737cc10b599dd214bb5464b14fb142fbbaf3a3', text: () => import('./assets-chunks/trash_index_html.mjs').then(m => m.default)},
    'log/table/index.html': {size: 148191, hash: '398f7f693596751fd1f5bc17f556497b1fce78818a38c7e990be5ddfd41ebe34', text: () => import('./assets-chunks/log_table_index_html.mjs').then(m => m.default)},
    'form-designer/preview/index.html': {size: 1355699, hash: '7918f00654cf5d8484a19764ddffca615e0eb070b886bd2a9e088cd986cd37d1', text: () => import('./assets-chunks/form-designer_preview_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 3570329, hash: 'a9c2ce79b9fe344596822ace90637b48cdecb8b00c65a3f988b61696defc7025', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 3599226, hash: 'cb5404dc467140cb69d1bb88aaeed198ff8fd35ae266242e215e1be0e494f786', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'styles-Z3PCIMZQ.css': {size: 32780, hash: 'yim97pIkghI', text: () => import('./assets-chunks/styles-Z3PCIMZQ_css.mjs').then(m => m.default)}
  },
};
