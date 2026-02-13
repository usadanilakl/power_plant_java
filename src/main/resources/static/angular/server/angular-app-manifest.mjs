
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
    'index.csr.html': {size: 25690, hash: '83968938982b20c127815e5576ad7fca1fd15beaa39a259da5af12ca543c254e', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17662, hash: '3ae3cc8c673915c570201904e5eb0904d8b1411c434a328ddb86ad63a969e80f', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'permits-monitor/index.html': {size: 74562, hash: '9be98b3e7ef23206ca7dc4eb6fed7c6a148b5af72ebc8c6cd653fc1f885c9ea6', text: () => import('./assets-chunks/permits-monitor_index_html.mjs').then(m => m.default)},
    'home/index.html': {size: 129935, hash: 'e56cf2ae8f5019282f6680bcc2c5e56cbe90f0a36e980a96e36948e96f25be0e', text: () => import('./assets-chunks/home_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 125394, hash: '54ae773cf395ac68d9da99ffb3aa9ebbe6773bce6c99986d5887451f3f054f2a', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 123529, hash: 'd23fee1180de335d8f377d0c481fe428b61cac28f9d0ac1a615ccedcd259ede7', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 192800, hash: '38cc131770afb6b131ab7043ecf27413752fcbfd94ba3036aec84d03d3f10aa4', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 165441, hash: '30a5cb403932b4a39247be2b886c4cbdb604a81c2a0cb5b853a09db9575e5c43', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 120283, hash: '0446b2f4fb7c465d2d8bf1d40fe6f21b1bc0972ba8c5eb02420a64c1c907f5bd', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes-grid/index.html': {size: 132508, hash: '5d55b8800809935f491bf4f66fc5b68f5cc2843ee151daaf972d802c959bc797', text: () => import('./assets-chunks/loto_loto-boxes-grid_index_html.mjs').then(m => m.default)},
    'loto/esp-devices/index.html': {size: 121992, hash: 'f5b33ac5d2c7a136e29803ba586d468ab77b7331d809282654f4e29c8656201a', text: () => import('./assets-chunks/loto_esp-devices_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 120237, hash: 'a8259cab67e1a5676142cc13bf9745f89bf34bfc4a27944e4d7781e1b3d9ba6b', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 114837, hash: '56595878ddff5e8e2e66b2fd0b36583f0c361907118bf965bbcd40b4e0113bbe', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'loto-builder/index.html': {size: 199074, hash: 'ec11331b7fd2b2b46529170a46ff2cb07ae8614f2332f95e0096582a12560ee4', text: () => import('./assets-chunks/loto-builder_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 158139, hash: '79a4242f4976b47d4a09d684f4ca4f1d8f3cbca507fbda0165a309075d124a18', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 132831, hash: 'ced73cc6fee2f317f4b5f9a85dd8a0f8427dbbeb6f5b21d85d862c90651aba4c', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 140699, hash: 'a88fde9f5a03bdc4aaa6f8a9e37176cc46a44dc3d775c8b560977fca017cd55c', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'loto-standard/index.html': {size: 284998, hash: 'f89c0831eb80d24650dae476c6d526cc8f3d5ddc9a6d666190a51771289d1631', text: () => import('./assets-chunks/loto-standard_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 140742, hash: '3437a72dac37d91852bc6ebcf85f5b64d8522c948fa52b2074263db5b241e0c5', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 140637, hash: '759ff65ac1582e7c005184fd1e892351e4950348cc3c87ffc81a1882c90261f7', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 118338, hash: 'cf4bbdd078e3a6364c12c364c46f267c3e9ddc78b9154b689b4a91472a57fbe3', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 124003, hash: '616c641ca78c99534ee0afea5e3ac6f4709ca23e71ee1289d0b2aba798b82ae6', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 119790, hash: '9f0544214f74d7c8c7ab5bb9687921c60c4afe1f3497135df13d68ddb17e27bd', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'form-designer/preview/index.html': {size: 119144, hash: '4cf9a0a36ea16370afc0f5f64b57675f3338be7b6fb37b84633eeac320d86414', text: () => import('./assets-chunks/form-designer_preview_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 64353, hash: 'caa2cf26b717aa4c381d4c8a062c872845938c5890807c08b548d8179fb1a897', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 134167, hash: 'd8b3c887e0aa4fdfb6741d5b2c021bfddfc4e99074591408467ff437186eee1c', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 106501, hash: '0f3511abb1f15cfcd4d61f6ce81eccebef841879d5a3f175a222dd9197eb6ed6', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'admin/index.html': {size: 117719, hash: 'a134e88c1d18d73dd8db9c4c51fb461be52f56e02378fc88b3097c6e9b9b3f65', text: () => import('./assets-chunks/admin_index_html.mjs').then(m => m.default)},
    'admin/category-values/index.html': {size: 85070, hash: 'f4684192c42232e190672ef82b5034200e33fac827708547dafa2fe6fe65574a', text: () => import('./assets-chunks/admin_category-values_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 115415, hash: '437557eceaacf969b6a846ffc7384e6d7056fc303ea0327cd04ef720860d85ea', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'log/table/index.html': {size: 135842, hash: '3101f35b38af10604e47a26a68b65b7e24e9f8fcd39034bdb7803c4f56f3cb95', text: () => import('./assets-chunks/log_table_index_html.mjs').then(m => m.default)},
    'trash/index.html': {size: 71260, hash: '904a69e7b7e3e4015828cd739a6ac929568238c78329ca0a999053a9e9af94c6', text: () => import('./assets-chunks/trash_index_html.mjs').then(m => m.default)},
    'styles-EUPGYQTL.css': {size: 33050, hash: 'T83zmW8yAQs', text: () => import('./assets-chunks/styles-EUPGYQTL_css.mjs').then(m => m.default)}
  },
};
