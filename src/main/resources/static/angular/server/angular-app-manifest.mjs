
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
      "chunk-4TWANNPW.js",
      "chunk-OFFZ7H33.js"
    ],
    "route": "/form-designer/design"
  },
  {
    "renderMode": 2,
    "preload": [
      "chunk-6JYSQ5NJ.js",
      "chunk-OFFZ7H33.js"
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
    'index.csr.html': {size: 25697, hash: 'd6e5c162874925d01f8c0320f205fb7da405f75a10eebf2152fd84f5a0f5f3af', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17646, hash: '9b183c6ef5d44a046ad27c1658de590ad3a778007c23dcebf9b3eea0bb9d7eb5', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'home/index.html': {size: 142031, hash: 'fc2f8f4a2ba68f6bfbf59abf7105dfcadc9b4570d420dfce7eeaa6e5c800da2d', text: () => import('./assets-chunks/home_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 234209, hash: '9379929942e79a66aa01a78f7703c1f1d547336fad7bf922f2c39ba930ddab73', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 133256, hash: '413e5e936dbae65ef95a1b5e78f6499a8f926a4d2ad9bc21b427a88bdcd7ccbb', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes-grid/index.html': {size: 152493, hash: '5c122650c6c732e5fb31a6aa16f1d41743f214bee3dc467e0821326fd083b070', text: () => import('./assets-chunks/loto_loto-boxes-grid_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 132691, hash: '7b617e56b8780365bc976685d5f6127d915aecb3670f9c8bc5cc84c79828d795', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto/esp-devices/index.html': {size: 134660, hash: '15038d796584db6cad7c7e65b5347831787c9045efd075837e773403dbf14791', text: () => import('./assets-chunks/loto_esp-devices_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 3572342, hash: '9831f3c92dafb1449aa48566ebbc6bb2baa1b106f800e8cc34c06187073768be', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 3653748, hash: 'df626cf80d3c3c27b5a3a6011830dece675786b01b197c6733ced917d358802f', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 3552914, hash: 'a426f04e4776b35d0635be55f7027cafcd9e20ad80226cc25b44e234a0c65fd8', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 127039, hash: '7334e83eb58ec7677f5bec85b1e9d78e798402f38e55071743f9c9d338f97ec5', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 225036, hash: '983e4c233ac9ed5d45b6d604415af1d2ed17bc4e177b3afec6e8a89518c94b1a', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 731257, hash: 'd7cbd9c686a9f6361160b7c64c472a24ec52daca38560f418dd50082f176a030', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 294009, hash: 'b81ceed10ab5b87cf2b0885125d7bd233ee4215e8c7fc37366497defd9c47098', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'loto-builder/index.html': {size: 3725319, hash: '46eaf87fe017925d6ba8b3e12ecb4260fe829c033bcc5d69961086449aed3b80', text: () => import('./assets-chunks/loto-builder_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 130540, hash: 'e8d3835600dff40356c1259e8547218a816638c4bcc05e91f8dd0e1826130010', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 640045, hash: '115d51b4ea5a9b10996c0e03822d355d47c55cd7f70268e8a0e0ccb6d60744be', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 721416, hash: 'bd298a91aef08086fdde77049c7d465bf3240648318adaafc254682de473bf7b', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 427763, hash: '50c07779ea6cd4611a0b43b9aded405aa367f96b454eddc92a8a14db62b36277', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 3570801, hash: 'e2c68acc034327adf6b5d54de82d576459c9b1d162c8f70b0d1795b82d0e422a', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'form-designer/preview/index.html': {size: 718050, hash: '494a85044da53e4a37d2e089358874d20b7716a6fcfa62f23ac12221ef892b62', text: () => import('./assets-chunks/form-designer_preview_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 732784, hash: 'ddae80fef9f88354c1607b3758556cc9b9edf5e7fa0e427b5267b87d7ee0043b', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 76983, hash: 'c7483081baebc35a9fb634c32d32f2f4cf27f60b183cc28d38c6b9172a032cc4', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 127865, hash: '1560e46d1da4b38735da4d3549964bf1498e373541b29c1bddcd08589b539aec', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'admin/index.html': {size: 130165, hash: '6743d1448273a3e30d155a4dd4aa3fd3bfe8c7a974d0adbc44cdb859b0cc942f', text: () => import('./assets-chunks/admin_index_html.mjs').then(m => m.default)},
    'admin/category-values/index.html': {size: 124912, hash: 'fd5a2c5ece0d8686ab383de2c609b45575c7d0b96b5f6df9850ebff3b7a9769a', text: () => import('./assets-chunks/admin_category-values_index_html.mjs').then(m => m.default)},
    'trash/index.html': {size: 84498, hash: '18a4a4b3e1193da817f145d08f19ae7f2ec133b95f5a167844612ee4019e8fbb', text: () => import('./assets-chunks/trash_index_html.mjs').then(m => m.default)},
    'log/table/index.html': {size: 148707, hash: '0db2a67a644a39eb32d2a15e62035793700d45777b5c9c3dfb94398bcecc3282', text: () => import('./assets-chunks/log_table_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 3599702, hash: '4fd69f8a1203b5863a8c7215a46eb91fc2d8cf309d641f2e44acf9e8599f7a54', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'loto-standard/index.html': {size: 7703941, hash: 'e06b9f0332849228bc7815c4dc8651c7fa037a68de17dd176a5bd4a8c532f6fc', text: () => import('./assets-chunks/loto-standard_index_html.mjs').then(m => m.default)},
    'styles-WXGYEPNN.css': {size: 33199, hash: 'LtirIMOP81Y', text: () => import('./assets-chunks/styles-WXGYEPNN_css.mjs').then(m => m.default)}
  },
};
