
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
    "route": "/angular/browser/file-editor"
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
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 23674, hash: '22b7a93d59741927b687579ca1c17964cc25ec8807530fe66451f36fb9ac3f57', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17152, hash: 'c4625af84830b668e0a37921ddbebda7a4f42dba8f6c111c1e69410b52493154', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 45929, hash: 'be80b5e280d0b7a5ea177f675352f963c7f252e17f086821c1339410a88ef2d7', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 54634, hash: '8a0130d8f7c015c9b2b6b55c7ab9fc850452c5db935f13131f2c1a5ac26741af', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 54258, hash: '0a58940387dfb6b84615e0f185a2cee78bb916faaac50e87469dd7e5e1092655', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 54835, hash: '18b2630c5f9109a546d3b0cfa8df439cd07ba6e24d9b0b43b98835af74b9f14a', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto-standard/index.html': {size: 55467, hash: 'a8122cae1e535f9ad3ab99b949294722386b1abd0a1dd4cb1c472f4b3f16511a', text: () => import('./assets-chunks/loto_loto-standard_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 52084, hash: '32b2b02931f3dee2e32b51b2eb236b23e67ec2a5f3d92b3bf0027d4a26d3fc61', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 52046, hash: '749c2f7bac2b2c3a5341a9acbdf8efc81988c50ec16ec75b66c5b54c6a1c3d5b', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 24270, hash: 'b37b10c86b6b054b728d1a6c51787b46ead8a993d9ee3251684af06c58022cef', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 33696, hash: '01812137ce79cb79a8bb30e5f967a0698060cdaa7f1c482cc77e7a1d6f31db8a', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 41074, hash: '0bd32490f758b86d97f6728c3c6845c694192805da4ec48413c6b54f7d9069f0', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 31006, hash: 'b082b66a0869b47ede5c5235166705fcf61c11fd2855029909f53d5c10b4d45f', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 36165, hash: '4c5453681c3bb3e3ed2310a75197eed718efa6a3461551b5a8464731a36e4d16', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 56302, hash: 'f5ff42235939c0bdfab9dd2da0cac6f83a471b6f12c62c0157c5bab005c9c92c', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 42344, hash: '406774a487f9a400f8e0c8f54b0d9283931e2a946bb883522bf93033bd39aa56', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'file-editor/index.html': {size: 45625, hash: '020f3a847f38f51d976ce3a4128b0d36946210c4651e4a78d196919ac1db8c08', text: () => import('./assets-chunks/file-editor_index_html.mjs').then(m => m.default)},
    'styles-WVLSSJOW.css': {size: 9627, hash: 'm5kLIVbtCdo', text: () => import('./assets-chunks/styles-WVLSSJOW_css.mjs').then(m => m.default)}
  },
};
