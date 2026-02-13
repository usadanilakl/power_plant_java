
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
    "route": "/angular/browser/permits-monitor"
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
    "preload": [
      "chunk-DBA3RMYZ.js"
    ],
    "route": "/angular/browser/form-designer/forms"
  },
  {
    "renderMode": 2,
    "preload": [
      "chunk-G6ZLJE2H.js",
      "chunk-T3IDWNPX.js"
    ],
    "route": "/angular/browser/form-designer/design"
  },
  {
    "renderMode": 2,
    "preload": [
      "chunk-ZH3UTDMS.js",
      "chunk-T3IDWNPX.js"
    ],
    "route": "/angular/browser/form-designer/preview"
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
    "route": "/angular/browser/sync/sharepoint"
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
    'index.csr.html': {size: 25690, hash: 'a71e43809f1b6f6e36f61602577a3567ace2efa4c8b225f9286053a4525500cf', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17662, hash: 'eb8f2bafd11adcaf0e8f4193a570132db7de12ffe968a442a46e01ff927289f6', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'permits-monitor/index.html': {size: 74562, hash: 'd1f6b31e04ac126579c33eb2f15a9f9b0577ac15e81ee6091753e1003c70230e', text: () => import('./assets-chunks/permits-monitor_index_html.mjs').then(m => m.default)},
    'home/index.html': {size: 129935, hash: '8f933d972f480c8f1c39d035d8952d08d991103551307db365bd21f0cdaf98c4', text: () => import('./assets-chunks/home_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 125394, hash: 'fa7e786e43fb657935a2a58da679f663bde4bcc1dcb636ecd170c012d8b0963d', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 120283, hash: '5d794e070a5cd3c083150219d2e1848296e778e082b9992465117fa78b6ea534', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 123529, hash: '8e15fb4261b34cb7089a042025150afb998aaaebcb94bd4793251a9265dd1c06', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 192800, hash: '886ef840d46cacd85fce8ce842c7a4dc2dba69841334404d04fa6446be4becb5', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes-grid/index.html': {size: 132521, hash: '9ebf1171788720189c8dc170bf464f74dfec6efaa171f9d2270704bb08ec044c', text: () => import('./assets-chunks/loto_loto-boxes-grid_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 120237, hash: '26f04ebaa926f4eff142f79f9c76a16aae72da6d2ef776a6f5268efd5afa7ffd', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto/esp-devices/index.html': {size: 121992, hash: '2ce5a4bb0f76c0519a5f41ebc5320d4f10791b37dd9b6fd93e947648ee456fcf', text: () => import('./assets-chunks/loto_esp-devices_index_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 165441, hash: '7eb63e2d923f2d73a2070e0a35c97fd18221433db3fe453ddfff0382b5c463d4', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 114837, hash: '0a768a5facd59c65b3155c907b3864d624d84d1bb8f54234d45d2860f9c36ee2', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'loto-builder/index.html': {size: 199074, hash: 'bcaed0494ac0ef850beedd02b0643cf352e6eb2dc631516f9e7176dac7578d2b', text: () => import('./assets-chunks/loto-builder_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 132831, hash: '73fec191baf9893869f8496528718beff86c28cc383599d60ce4c87d78cb8ece', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 158139, hash: 'dbb5eb181ed436b4d09a83570a43f68bce92ee3df30863cffc04143537dad79a', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 140699, hash: '42e32ebcbd6b03d8afae01d88f7083865a5d737a540521b9e91bbc96f0037a3d', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 140637, hash: '4533b49d39e1d2f85eb0cbe90e92ade77bfa627176ec0e3a6814c0a59b8e93e7', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 118338, hash: 'b018e38c1b26ef2006fe629e44f062c745d805a21a8ec2d0a1c22313792ecfb2', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 140742, hash: '0fe1a105095242b32fe64b9b9e95f0011da216c2acdb3014f60ab6f72cda1310', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'loto-standard/index.html': {size: 284998, hash: '85c0b6806d81a3c5d40377b47e8f17dbbdbc0c83e826cfcfe4fe8536854c4469', text: () => import('./assets-chunks/loto-standard_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 123990, hash: '57c12a50ccda61dda4612f29497b453a16eaf718beca26445c53b21025144e55', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 119790, hash: '3bb6f916cd3fd4d73e0807e5f64ef940038528c56ce23011e7bdede573b804e3', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 106501, hash: '53af1818efe08b4b40e0d547c8e3b95fd943841b7cf7bc4f489d539f2b3ae79b', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'form-designer/preview/index.html': {size: 119158, hash: '175e625a250a06c74f2d08e5c12f3ad182e93f817da31ca5fe416e1ac6cbb886', text: () => import('./assets-chunks/form-designer_preview_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 134167, hash: '4ddf2ee3ef86cbb8e551872c169813fe77c5c969c710e47f4406f97ca12c201d', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 64353, hash: 'a3ba87d9d58016cd2c83e04ffcd4b49fe954c9671a367f3a3842be341e6ea651', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'admin/index.html': {size: 117732, hash: '26e520253b7413ce349d0b94cced84540c865ad707375d7e344230a43be47773', text: () => import('./assets-chunks/admin_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 115415, hash: '43d3d9c87b5fdfb9e2ad5de5e3b38ab6375e54bf1e1109bbc345d0fdf1d91189', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'admin/category-values/index.html': {size: 85070, hash: '42df112dfb71b1f27728060748df3a3e8e32dacb9aec7d73c6146ece2afc2cce', text: () => import('./assets-chunks/admin_category-values_index_html.mjs').then(m => m.default)},
    'log/table/index.html': {size: 135856, hash: '877454d92eff4d35c7a901e1653e5d12ae36c4577ccc0cf9eedd434de69cd79a', text: () => import('./assets-chunks/log_table_index_html.mjs').then(m => m.default)},
    'trash/index.html': {size: 71260, hash: '07984b0e9216c24781f69b5d95f36283e6b54e102c4b43efd272a5d6b8fca1f0', text: () => import('./assets-chunks/trash_index_html.mjs').then(m => m.default)},
    'styles-EUPGYQTL.css': {size: 33050, hash: 'T83zmW8yAQs', text: () => import('./assets-chunks/styles-EUPGYQTL_css.mjs').then(m => m.default)}
  },
};
