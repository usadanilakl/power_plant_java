
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/angular/browser/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "redirectTo": "/angular/browser/home",
    "route": "/angular/browser"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/home"
  },
  {
    "renderMode": 2,
    "redirectTo": "/angular/browser/file/edit",
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
    "route": "/angular/browser/loto-standard"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/loto-builder"
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
    "route": "/angular/browser/form-designer/preview"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/form-designer/design"
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
    "route": "/angular/browser/admin"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/admin/category-values"
  },
  {
    "renderMode": 1,
    "redirectTo": "/angular/browser/sync/status",
    "route": "/angular/browser/sync"
  },
  {
    "renderMode": 1,
    "route": "/angular/browser/sync/status"
  },
  {
    "renderMode": 1,
    "route": "/angular/browser/sync/recovery"
  },
  {
    "renderMode": 1,
    "route": "/angular/browser/full-sync-to-server"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/trash"
  },
  {
    "renderMode": 2,
    "redirectTo": "/angular/browser/sync-admin/full-sync-to-server",
    "route": "/angular/browser/sync-admin/full-sync"
  },
  {
    "renderMode": 2,
    "redirectTo": "/angular/browser/sync/recovery",
    "route": "/angular/browser/sync-resync"
  },
  {
    "renderMode": 2,
    "redirectTo": "/angular/browser/log/table",
    "route": "/angular/browser/log"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/log/table"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 25241, hash: '08f0706b575d4cc6a4e532c02d921cddb2a43cf031ffead17d70a7e5bd740fb2', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17254, hash: '7f38014fe71616024e78aab3fa77ba504e2b53450727c265c54920f53592113e', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'home/index.html': {size: 121260, hash: '78bc840db64a4f57fd470530eb5f72ff3fdd94efbd5bdc0c2f7ab8f146e441b3', text: () => import('./assets-chunks/home_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 182641, hash: 'f613d4884906561db38a1d977a102c9482c73f7a9a990be27b67ccf2e54fdd00', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 116262, hash: '9f8ea500143ee73fb90ceecfe64f004efe40f48a04a47663b6fe03578585d9ac', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 113003, hash: '94b907065b399ec184f22e5b1c9d3a698180f1e6ee5d4b692ef0125b14a1ca79', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes-grid/index.html': {size: 125241, hash: '20ce813d58ebce334dc596b897c4844518702e6ec0b5f76ef5e234824fe43424', text: () => import('./assets-chunks/loto_loto-boxes-grid_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 112970, hash: 'c1309c9abb35d73b91ae4b17b882890bee5ebffe98b767c8106eaacf12198e2d', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 155318, hash: '11c75a4549a8358ac91838e0ae8802d30046c003c20c9ff8a0dca7b2bf6157ba', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/esp-devices/index.html': {size: 114689, hash: '869a37ae8d0be4e9429ace412daeda0028a3f2fbd4db93eea72cf9373ec84b8c', text: () => import('./assets-chunks/loto_esp-devices_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 105629, hash: '8be6a3b28099b051cda2c52cfc667dd062cdd4efdad536b5594e487d5833968d', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'loto-builder/index.html': {size: 189845, hash: '240068c36f7dad50a92c55c7542783957f2216bf8729028b90850ad7a95e6bec', text: () => import('./assets-chunks/loto-builder_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 121251, hash: 'f5f62d558d9639828b5ffcaa26184334550f1df2342a3a9571c246c5a4745792', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 123064, hash: 'ded849ab75cfb855c634da90ebc3f9ecba0ad305ad25dd759061948fe5f2c3c0', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 118114, hash: 'eab94851c64fecec588a8d3bac3687df3ead31018ef903f8f8e2c7e7fe378cd3', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 111180, hash: '8a2cbb99901e808c9ff90daf5972e007d00772b79349f31498ff76cc328626ef', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'loto-standard/index.html': {size: 277358, hash: '24da357405d350d32e0e392931d93a4013d65fec8a0aab81f910a4634b1f5a16', text: () => import('./assets-chunks/loto-standard_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 111167, hash: '12bf5c88e7f59b97b61b4c69b58867fce5c1b7b401b4674463c09cfe819be8bd', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 109934, hash: '2cffeddaf64d9d72335672311968f33399b64d23808fb6a17a557189ca13b286', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 111201, hash: 'e905504650235f8bfada59c018a21636a3ec0fe7032a221413d7652083410af3', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 110574, hash: 'd4a2f29e977f0571fb8929ddadf0cf11f5159a01afbeaf78371d9eb09ab98912', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 115586, hash: 'd279d0ba83b27c87d68a249dee241a23c012c6bae4030c6871ed9e50ae907592', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 126629, hash: '76d49266d319296d963583ae1b7aeeb36c64e10288738503b13d94c631264aa3', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'form-designer/preview/index.html': {size: 112549, hash: 'd318ef98a0fc395e85e57acc6542d34837ecc3426c2af1348f28498ed41a5df8', text: () => import('./assets-chunks/form-designer_preview_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 99367, hash: 'b5f7be1203a65ccc1c8105237e5a3573452338687bed09ae198368675a6b55c3', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'admin/category-values/index.html': {size: 77936, hash: '3b95dc4839535763290a7ddb6ad2c5a56ec48c0bc24aa93267411d6fadf797bb', text: () => import('./assets-chunks/admin_category-values_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 57219, hash: 'f67e72de066fc5d662b2d14e886f650e65e8cfe93ca91adf99ab6e94ec2c007b', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 108281, hash: '36f17c46fcfd2f66bf23913771244465dae7abc8bec4a0d893dc998489e1d3f7', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'admin/index.html': {size: 110585, hash: '5a70ad76334c8213026cc4f80aaca6af2d159a6abdbe8bd5ad94fd85eb444aa5', text: () => import('./assets-chunks/admin_index_html.mjs').then(m => m.default)},
    'log/table/index.html': {size: 128672, hash: '66c52062c87a8846c9187c902ee52c2e2d6c0d6433a7f99ade900ed974c71ec9', text: () => import('./assets-chunks/log_table_index_html.mjs').then(m => m.default)},
    'trash/index.html': {size: 64090, hash: '32aeece819979e88d2d9c5239796009cbcec56cafa5a8fee450e6e4acad6524a', text: () => import('./assets-chunks/trash_index_html.mjs').then(m => m.default)},
    'styles-Z3PCIMZQ.css': {size: 32780, hash: 'yim97pIkghI', text: () => import('./assets-chunks/styles-Z3PCIMZQ_css.mjs').then(m => m.default)}
  },
};
