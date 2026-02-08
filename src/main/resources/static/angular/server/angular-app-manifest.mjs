
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
    'file/table/index.html': {size: 155318, hash: '11c75a4549a8358ac91838e0ae8802d30046c003c20c9ff8a0dca7b2bf6157ba', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 116262, hash: '9f8ea500143ee73fb90ceecfe64f004efe40f48a04a47663b6fe03578585d9ac', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 118114, hash: 'eab94851c64fecec588a8d3bac3687df3ead31018ef903f8f8e2c7e7fe378cd3', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 113003, hash: '94b907065b399ec184f22e5b1c9d3a698180f1e6ee5d4b692ef0125b14a1ca79', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes-grid/index.html': {size: 125241, hash: '5a88a13491a551b7bf51c1d64edd5c2b615829bc0627918ce5964facd03ec070', text: () => import('./assets-chunks/loto_loto-boxes-grid_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 112970, hash: 'd8ad3c435a2f4c5b73b36e9c0b7a1dc186c5a9ce35e73067b520cc10e83804b4', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto/esp-devices/index.html': {size: 114689, hash: 'e8fe2a9a81240b38ca92e5c511c3672acfd34a7d9c96f2f4f5963382b4cf6fd2', text: () => import('./assets-chunks/loto_esp-devices_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 105629, hash: '8be6a3b28099b051cda2c52cfc667dd062cdd4efdad536b5594e487d5833968d', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'loto-builder/index.html': {size: 189845, hash: '8f25c54e28983d975d56857d82c0606ccda82bc5ec3d5c49fcd903fdc0f2c3d1', text: () => import('./assets-chunks/loto-builder_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 121251, hash: '43bf1c117bc6cbd8f1fb94b26f1116c96b759e1dac55876ffd2afdf442732f0a', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 111180, hash: 'c2adaa78e0963008900ec360bad2eccda32386633839c992320cae8f5ddcf35a', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 111167, hash: '315027a84878200c64857586f78582d79d3e14c2bccd3f856c157b93716a40b4', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 123064, hash: '97a38c50c3aff362b7da7508ff15f6bd047e719db0b64da59d543f33fde28383', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 109934, hash: '620d43935aa6c4e9881b25acda93a6b1dbe48ea83990829748db6ad0b77d2210', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 115586, hash: '3b2d800f91c4ad5c816987457d2ea08564df1d0a5e33b612cc30d485063ceaea', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 111201, hash: '9584027c3a6cf0b7191c12253333114283cdd750787c5f906313ccc1b5f982f5', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'loto-standard/index.html': {size: 277358, hash: 'fbb97f99b2c9d154903e4aad0e7eefbe913c1dc7f12b48c8bfd277a0df0b61ba', text: () => import('./assets-chunks/loto-standard_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 110574, hash: '75847b7be81e94d423106990fad5d9db1671b1c74b55c56f91eae946035ab64a', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 126629, hash: 'de6d844993479de08d1ee8cb8edfb0168b14b5bb28ebc610b917b22b86415c75', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'form-designer/preview/index.html': {size: 112549, hash: '28b7bdf4a0f6533c3c4ffc2e668576f4f7c050440d74c4b1003406cd76eb9384', text: () => import('./assets-chunks/form-designer_preview_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 57219, hash: '2864ba89cd6dca6559189d85db55bb667ee42036390a4dbe943584dda91862f1', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 99367, hash: '9f4732b692363b59834724e3ce63f95370660cd0ba94bca9f9d0fc31fffb32f5', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 108281, hash: '2d78eb1ca2bddfe70182dd374b9c75910befc2b087de31986c4d1e910f95d29b', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'admin/category-values/index.html': {size: 77936, hash: 'fe629a619f617283b7dc116e52a44c8a3342dd97d935eab2e2f44f4088a51dd7', text: () => import('./assets-chunks/admin_category-values_index_html.mjs').then(m => m.default)},
    'admin/index.html': {size: 110585, hash: 'e34e28695235763685cdccee22f22999b024690da984725fa24d340b8f2c8805', text: () => import('./assets-chunks/admin_index_html.mjs').then(m => m.default)},
    'log/table/index.html': {size: 128672, hash: '53b3a0d1a8e4c4a17744234a9f89c64ad3be305d16f1f1d66aa1d7ca34351457', text: () => import('./assets-chunks/log_table_index_html.mjs').then(m => m.default)},
    'trash/index.html': {size: 64090, hash: '006aaa256e4c603d8f77a153da21fc0b01bd1a8d99cc17d39826859240060595', text: () => import('./assets-chunks/trash_index_html.mjs').then(m => m.default)},
    'styles-Z3PCIMZQ.css': {size: 32780, hash: 'yim97pIkghI', text: () => import('./assets-chunks/styles-Z3PCIMZQ_css.mjs').then(m => m.default)}
  },
};
