
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
    'index.csr.html': {size: 25241, hash: '62c040bd08d83b2051cf04140e1a3947a25244b45c7b08789a3365f02a2ee3cc', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17254, hash: 'd9de6e233a1eac25d08416ae93fcdceae64bcfe9384b2c6986e142d3cf7b971d', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'home/index.html': {size: 122409, hash: 'a35496ddfd6278c41bb303e027c041b4956be17c780bdc0b4b4df6c429b5fc93', text: () => import('./assets-chunks/home_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 117411, hash: 'f1ecb9c303ed6a754a5634d743d89b1998762ed12da1f713ff30b268aafeeed4', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 156467, hash: '78a8e0e4ed90d9f46584b453d4bc22fb64d6f065ceb4b872e38974e5223ee4d8', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 183790, hash: 'ac121a47eecd4ea9236388a644705424efd6a6105df12211b241c94917e23e71', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 114152, hash: 'c92e78ab7f9679fad54014833218abb6333538f9dc3a3355b1b62bf5bfb44ae3', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes-grid/index.html': {size: 126390, hash: 'f220ef4117a174c93ef6b62170bee904dc6c515ab51ece5522f7c371376c7fb4', text: () => import('./assets-chunks/loto_loto-boxes-grid_index_html.mjs').then(m => m.default)},
    'loto/esp-devices/index.html': {size: 115838, hash: '57c38e7b25d51214a91f86c54ba2b0acab4cfdf89a0334774fabd115b45f4d3b', text: () => import('./assets-chunks/loto_esp-devices_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 114119, hash: '94effb04bf874c25c0998a65fa951bba911d1cf61e55c3ec71045f23a723a4a2', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 106778, hash: 'c4ef9fc1d15f6aa78c9e3f771809432bee61ab4e0fe2f7cc58c7a064a4aaacb8', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'loto-builder/index.html': {size: 190994, hash: 'b626b3cab8fca0e8e43daf84fceb71cae69327b7344b81abf3f5711818ed6692', text: () => import('./assets-chunks/loto-builder_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 122400, hash: 'e9c9ff961493c9d153e5b0ac490d364d551cb7c4b8060891dc26eb7a356c7140', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 124213, hash: '571af5ce1ab98b2c9ce7bd1596113ed4ed2fa5f777d001c50f0dc2562051ab89', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 112329, hash: '3a199a9dd4d1415949ef996b79b3c2605287221fda7263763d4e9f75ad3c66b9', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 112316, hash: 'bd68ebce597fe35faa5caed68a2aae03745d555b3755210efb1a4e8b418b410e', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 112350, hash: '0168c7215c1750187daca88abad66751c07edce73a3f12528fbd9ad246525297', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'loto-standard/index.html': {size: 278507, hash: '083fe413c8cf113a0b5fd1c5c31007a6b744ec05a4ace747c82e48ff3c6571c2', text: () => import('./assets-chunks/loto-standard_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 119263, hash: 'd6afd252696ac14cc88a518de17417494532df72cec2f517909514a02c7e7582', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 111083, hash: 'a7fbed9f1a6ec97e00ef07ab0217c7f4ec3f139180449a6ddd55baedb7a7892e', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 116735, hash: '12812ca62381fdb0560c125152dfe49458318efdb1bfad5bac5d9e2db7f2f03c', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 111723, hash: '35fe1735a4d010bf46b52c0732567b321a3386879693057eb6ef7de1f5f325fb', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 100516, hash: 'cbb71cba8266e53d2741833b13c49b1bd6f96fd00db506e1e3c9fa74ae981939', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 127778, hash: '148c883cb36b58bb988d8448f28ca40de3272906ccc50b579f5f1b07e50e86dc', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 58368, hash: '30a7125f4f1f52610aa818b6c32e8af677f3ae24797b18dffcda8cc80b78eb82', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'form-designer/preview/index.html': {size: 113698, hash: 'dc02d45c98a9a880023737d020f346c9859fb7e926c73df43b8d2a3b1f11d0f8', text: () => import('./assets-chunks/form-designer_preview_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 109430, hash: '9b8dff4449e7dae90a626241666d54d94b2400110218180b66485b9b182abf3a', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'admin/category-values/index.html': {size: 79085, hash: '7b708544c08dea9a34aa8ed911b6baa24e0e1ef4f1c2f2b4bb08ec1762ea1244', text: () => import('./assets-chunks/admin_category-values_index_html.mjs').then(m => m.default)},
    'admin/index.html': {size: 111734, hash: '2ed4a1e775aecae3544f748f2a6fdd65dfa124754467f10274a86b92ec775df3', text: () => import('./assets-chunks/admin_index_html.mjs').then(m => m.default)},
    'log/table/index.html': {size: 129821, hash: '27fcb06c80a1fba2e362f1cd2e7d812a4065d95a7ce91fe6ac259ebadb1052a2', text: () => import('./assets-chunks/log_table_index_html.mjs').then(m => m.default)},
    'trash/index.html': {size: 65239, hash: '0af6c6d41699e37cb8a80c62739a58b927b5cafeeb61417bcaf8a5fbccd06329', text: () => import('./assets-chunks/trash_index_html.mjs').then(m => m.default)},
    'styles-Z3PCIMZQ.css': {size: 32780, hash: 'yim97pIkghI', text: () => import('./assets-chunks/styles-Z3PCIMZQ_css.mjs').then(m => m.default)}
  },
};
