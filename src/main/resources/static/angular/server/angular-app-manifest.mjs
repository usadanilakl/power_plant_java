
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
    "preload": [
      "chunk-DBA3RMYZ.js"
    ],
    "route": "/form-designer/forms"
  },
  {
    "renderMode": 2,
    "preload": [
      "chunk-XUBS6SSI.js",
      "chunk-6ZDJY3PK.js"
    ],
    "route": "/form-designer/design"
  },
  {
    "renderMode": 2,
    "preload": [
      "chunk-QLUKWK7Y.js",
      "chunk-6ZDJY3PK.js"
    ],
    "route": "/form-designer/preview"
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
    'index.csr.html': {size: 25531, hash: 'b9252387e2ddd11583e76067a6a6c51b6711eba6a604a5aa99a0eaf61c775725', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17544, hash: 'fd9f32a1b3991eb641fbbeb4452fc08454f78d84717ef07785d55380ae7cf89f', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'home/index.html': {size: 133649, hash: '860f5bf15eb4eda4d0027feecd3da76697e07e0e0047612aa17ae9eedd2559c2', text: () => import('./assets-chunks/home_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 148495, hash: '00d6abdcab45b036ca98491eaed15c77fcf9e4896b68e92edd2e7bb5b6be8cdb', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 225863, hash: '7ec06b8612a82ccc33574363f62cc17b3322d36aa4b7656dc36f75ab77db828d', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 130356, hash: '3bedbd10da6bf59b8e0c0e4460afb7daf929cd56c8fd8f988c723b09b53868e7', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 124731, hash: 'a0545a2a7072160b5a579d66fcc1c5f7fafa4a66a83a4b24aabd485e2fc93929', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 175904, hash: '43e867cb2b514de084b516e20664db953c7359afb697dd16889c236abf0ef5d1', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes-grid/index.html': {size: 136572, hash: 'b99144f996452f0847571b7ea6306968cc5c7f5ce5b3b9d299ce5b858e962e84', text: () => import('./assets-chunks/loto_loto-boxes-grid_index_html.mjs').then(m => m.default)},
    'loto/esp-devices/index.html': {size: 126095, hash: 'bcd33dbf972f54ee39a4e035db406bb53b3a114b43be9da88e2b24ee57240767', text: () => import('./assets-chunks/loto_esp-devices_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 124164, hash: '9f5dab90ed56be8a4bf021331719c3d1299dcddce638773ea67fc1ffac7d8274', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 117847, hash: '3676c1784a4dc36d584b38d42c177d18d6630ba1f97f92e4010cef895e95aa00', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'loto-builder/index.html': {size: 210013, hash: '6a52fd1d5261da476cfb986e6ad9624b24b148562fd5208f384017e924dd7a18', text: () => import('./assets-chunks/loto-builder_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 135510, hash: '6ad7f82c4b2f9d722d43cc52fda53cec8a638d8d214587f7e96a0a636dafa799', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 174542, hash: 'f653ceb2a738eb61e86e163bce8eec00c7824189e582fb1148b682b0e0433303', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 179182, hash: 'ae7b22bf5ef5497aadffbfd66d9d63061a50a80a20c91e58960eea5825868337', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 122152, hash: '5b735431c8279bba8073957fa756cdc1c4c51451f9c66c12287cb8687db40442', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 163542, hash: 'eaa073b10bd08f20e2e400028649801e56a07dc223d7257fb2e18215ce71b759', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 151945, hash: '2aa4142dd3fe08733e10d7c5ded3390e06acdedd6925ebf2c4f6c7c3410d308a', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 147090, hash: '8aa74d77e2c670659da9a14b832530259e9f32cec48868831c30dd6fc13e03fb', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'form-designer/preview/index.html': {size: 123667, hash: 'b1dae2e3ba169870c2db4fa16febe4ebcbf08515c4c5337cd5a3eb3e340154e6', text: () => import('./assets-chunks/form-designer_preview_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 137918, hash: '50a85f46ffc6d1269a4e3d48bd3807bffe5db5f022415f67d8ba0f96594cb694', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 123505, hash: '7ad7a4421db80e35a04e3b6fddc1434c941ad5f1e3f0a15d3e10a8ef4aaa7407', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 68595, hash: '12a806e24eec53014b7cff0377cd832940e6a1aff65ece7f2e8ddbab80298204', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 119474, hash: '518cbbaeec572a7e3cbeb9075d4c041cf4bea0b2b6eaf79d8b24a266c19cf95d', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 137403, hash: '7c12065dbe77d1924803e9a71ac967f7eb60262fa43a5cb99f21e0c635ff1126', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'trash/index.html': {size: 76072, hash: '5a7ccdf16f67e4417a0123b1c577bf37d835cead098dabe056a5514b678431ad', text: () => import('./assets-chunks/trash_index_html.mjs').then(m => m.default)},
    'admin/index.html': {size: 121769, hash: '1ed0aaa884846c9b4044aa86bbe4a72f5944d5fff05d5165e952d1a24ec8f0ba', text: () => import('./assets-chunks/admin_index_html.mjs').then(m => m.default)},
    'admin/category-values/index.html': {size: 105112, hash: '51b4fe4e356f3985006911429ac4cb7acb98d17ca3dccbb2659927c7d5740f95', text: () => import('./assets-chunks/admin_category-values_index_html.mjs').then(m => m.default)},
    'log/table/index.html': {size: 140282, hash: 'fc4887cd1767e7b7ee91b4aa053d75f82ec6c9a3798c3804b38049ef594a9f1b', text: () => import('./assets-chunks/log_table_index_html.mjs').then(m => m.default)},
    'loto-standard/index.html': {size: 309767, hash: '2188a14fe083c0dd9d40c8c4eebb400fe4c5be6ab59b18ff51422e298dd07153', text: () => import('./assets-chunks/loto-standard_index_html.mjs').then(m => m.default)},
    'styles-Z3PCIMZQ.css': {size: 32780, hash: 'yim97pIkghI', text: () => import('./assets-chunks/styles-Z3PCIMZQ_css.mjs').then(m => m.default)}
  },
};
