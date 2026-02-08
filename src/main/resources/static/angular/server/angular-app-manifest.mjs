
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
    'file/table/index.html': {size: 155318, hash: '11c75a4549a8358ac91838e0ae8802d30046c003c20c9ff8a0dca7b2bf6157ba', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'home/index.html': {size: 121260, hash: '78bc840db64a4f57fd470530eb5f72ff3fdd94efbd5bdc0c2f7ab8f146e441b3', text: () => import('./assets-chunks/home_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 118114, hash: 'eab94851c64fecec588a8d3bac3687df3ead31018ef903f8f8e2c7e7fe378cd3', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 182641, hash: 'f613d4884906561db38a1d977a102c9482c73f7a9a990be27b67ccf2e54fdd00', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 116262, hash: '6d49f0e24d1105c84cd7067a1f0b2a5e9ac978802218b0b5b9c59a1ead3e24c7', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 113003, hash: '05bdfc7ff497f733668d74685bc6189df2eb5bf8252ae42458c487be6697e015', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes-grid/index.html': {size: 125241, hash: '0c1e2e127c04b753b17edb43b90ef990904e64dd1226b1adbf2dd3eb4b12b6e7', text: () => import('./assets-chunks/loto_loto-boxes-grid_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 112970, hash: 'f2dccfc223aa55588c23b54efcd4308f09be9b85ae6ec5402c8cf959080c7905', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto/esp-devices/index.html': {size: 114689, hash: '0d4acd797dd46b3ad030e3712a51c6f0ce3b6796ffede3abc3653d14745c84f8', text: () => import('./assets-chunks/loto_esp-devices_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 105629, hash: 'a1cd53af567065b55e6d5acc854be00fbb794e5709491102ee566be306f31d7d', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'loto-builder/index.html': {size: 189845, hash: 'e1391de5e3eca7da9bf57e314edefbebc1c964a765ac9087f2941840af37dbb5', text: () => import('./assets-chunks/loto-builder_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 123064, hash: '02868ee5c047ef4802b89ca89e0d4ca08bd971d679488a520031828860b19b8c', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 121251, hash: '34a468feb5e0524f37cfb74ee8fbed10138334952628f5c676d82932915b5080', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 111180, hash: 'f6f26a13426d7b1bab6f7a5dcc484e15842dd22f885d2ef1d1956fdf863a0719', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 111201, hash: 'ffe6357b29cf9d44f9f798c845476fb01652f7c46863096f5b0f70f6de344536', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 111167, hash: '9d625bd946ed5b580831027c2aa387b551b749d8de849bf6b1f886671774470f', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 109934, hash: '620d43935aa6c4e9881b25acda93a6b1dbe48ea83990829748db6ad0b77d2210', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 110574, hash: '27b06c8cb242f67927ead1f9d992e04db9fa1e6595e68053708eb19888149198', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 115586, hash: 'd2c687de32fa1fb80ba6adeaf40e53e1646ab4975fae93aa712cc38157e2a03e', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 126629, hash: '35ede61601909ba25a2a0b5558fe15007467c6d4e6e6e2e49e4d486e4aa6e5c2', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'form-designer/preview/index.html': {size: 112549, hash: '17c23a9395fc2775384adcb123abd1f434376bad88d868a8fed2533a9920f908', text: () => import('./assets-chunks/form-designer_preview_index_html.mjs').then(m => m.default)},
    'loto-standard/index.html': {size: 277358, hash: 'd4b25f6b4552f8381c8af00c4ee1a23d83484afed7f3c7c733807a7249a45e5b', text: () => import('./assets-chunks/loto-standard_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 57219, hash: 'f67e72de066fc5d662b2d14e886f650e65e8cfe93ca91adf99ab6e94ec2c007b', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 108281, hash: 'e24a2d10a148a08e612a1776aad6ff67ee6c33e15b94a6d8d5596e8a9e1f06c3', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 99367, hash: 'be433d9d4a78a6446523b494cb46e6c16659e132cb900822f72483044fc8b7bd', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'admin/index.html': {size: 110585, hash: 'de1f80509accca10d122a6cab4493903152c80dddc61b34b205ab9f99cf9fd73', text: () => import('./assets-chunks/admin_index_html.mjs').then(m => m.default)},
    'admin/category-values/index.html': {size: 77936, hash: 'a336710392e0624e03bc8e25f8dab313989211e59f0de0427772f739be802284', text: () => import('./assets-chunks/admin_category-values_index_html.mjs').then(m => m.default)},
    'log/table/index.html': {size: 128672, hash: '96928fed5e9a916c6bca8ea8e064c1dc2354e3cccd15efb9c5fcf2fb70da232e', text: () => import('./assets-chunks/log_table_index_html.mjs').then(m => m.default)},
    'trash/index.html': {size: 64090, hash: 'cf0c9f927cba88716892207be34bb94d3e6ff64e3dfeba40823687d5c6559c74', text: () => import('./assets-chunks/trash_index_html.mjs').then(m => m.default)},
    'styles-Z3PCIMZQ.css': {size: 32780, hash: 'yim97pIkghI', text: () => import('./assets-chunks/styles-Z3PCIMZQ_css.mjs').then(m => m.default)}
  },
};
