
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
    'file/edit/index.html': {size: 183790, hash: 'ac121a47eecd4ea9236388a644705424efd6a6105df12211b241c94917e23e71', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 156467, hash: '78a8e0e4ed90d9f46584b453d4bc22fb64d6f065ceb4b872e38974e5223ee4d8', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 117411, hash: 'f1ecb9c303ed6a754a5634d743d89b1998762ed12da1f713ff30b268aafeeed4', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 114152, hash: 'f881b16d2e3a77b741b602a9bca28ed51deb1f8aaf57e609a3bdbf9c9fc6b61d', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes-grid/index.html': {size: 126390, hash: 'f220ef4117a174c93ef6b62170bee904dc6c515ab51ece5522f7c371376c7fb4', text: () => import('./assets-chunks/loto_loto-boxes-grid_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 114119, hash: 'd61262f47bdd2540ee69d837c0855074fe92fb76eb02a6d4115568277877bbaf', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto/esp-devices/index.html': {size: 115838, hash: 'be3f77b78d359c7628a0b5ac74714ac2c031c66bd6c761d9b50b879b68a17362', text: () => import('./assets-chunks/loto_esp-devices_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 106778, hash: 'c4ef9fc1d15f6aa78c9e3f771809432bee61ab4e0fe2f7cc58c7a064a4aaacb8', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'loto-builder/index.html': {size: 190994, hash: 'b6645f976ee45e526bc8f5a487a567703b5491dd61f2a5a7ae2da820272023d8', text: () => import('./assets-chunks/loto-builder_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 119263, hash: 'd6afd252696ac14cc88a518de17417494532df72cec2f517909514a02c7e7582', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 124213, hash: 'e6223358a19211061ac54b48e25f67e242b760dce2fcb5387e026161a3e22bcf', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 122400, hash: 'e9c9ff961493c9d153e5b0ac490d364d551cb7c4b8060891dc26eb7a356c7140', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 112316, hash: '113dd874ae588bff404bfcbdac5bf0041862fa9e4761104711e6ac8ef56ebf9c', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 112329, hash: '79659912c1db4d85e77afcb58108cac1903299a8dd2c9d9077df55c5f19e513c', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 112350, hash: '0168c7215c1750187daca88abad66751c07edce73a3f12528fbd9ad246525297', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'loto-standard/index.html': {size: 278507, hash: '083fe413c8cf113a0b5fd1c5c31007a6b744ec05a4ace747c82e48ff3c6571c2', text: () => import('./assets-chunks/loto-standard_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 111723, hash: '7698d49ad6e39f0d43e61c36ddcbbfb64964179f3ecc362d8df10297d10955a0', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 111083, hash: 'a7fbed9f1a6ec97e00ef07ab0217c7f4ec3f139180449a6ddd55baedb7a7892e', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 116735, hash: '9fa9fd83414994830e0b9be0b92995608c6a8b7815c1966df032fb44aa1cba65', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'form-designer/preview/index.html': {size: 113698, hash: 'e263f961c0365aacd4adbac2c03721f56f4d456d0364299f38ca5bf0d7592930', text: () => import('./assets-chunks/form-designer_preview_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 127778, hash: '9ff2a693659d1a18bbbe8c563c6e0c8aefb6db9690b6404a708880d9f9eb769f', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 100516, hash: '804b7ef9981ac34c072d8a04034e05c000c8fc244a5c916667f5241efedc7ef6', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 58368, hash: '586e7305adeb7cf9d813d6ca529a487e560a6971be6a545fe91db66ff57bb802', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'admin/category-values/index.html': {size: 79085, hash: '673599d349e3186895c8e52f5d22be1ddc8c89679f75f2338df171077a7df061', text: () => import('./assets-chunks/admin_category-values_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 109430, hash: '443886fe5136d8af5b4f28baf8aed7555731d1efb0ec2476f833918d3cb83819', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'admin/index.html': {size: 111734, hash: 'bc22c2cb65445ebde528a246cd8d49680e2737747757c8e585ea7d222cb60259', text: () => import('./assets-chunks/admin_index_html.mjs').then(m => m.default)},
    'log/table/index.html': {size: 129821, hash: 'ebf21cb7e6c638731124fa326dd83bfc1ccc1fe3bb3332305dc032f19555985a', text: () => import('./assets-chunks/log_table_index_html.mjs').then(m => m.default)},
    'trash/index.html': {size: 65239, hash: '9a71a69d62c6afd24a2f99a9589a11786f6951f1b14fe38a26583f3b358529ac', text: () => import('./assets-chunks/trash_index_html.mjs').then(m => m.default)},
    'styles-Z3PCIMZQ.css': {size: 32780, hash: 'yim97pIkghI', text: () => import('./assets-chunks/styles-Z3PCIMZQ_css.mjs').then(m => m.default)}
  },
};
