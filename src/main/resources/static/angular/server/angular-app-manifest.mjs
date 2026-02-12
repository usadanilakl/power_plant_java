
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
    'index.csr.html': {size: 25241, hash: '1f84b22b7c2cdf49b05da3db3bc7c93fef56b3790e07cae243767023cb867d60', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17254, hash: '9c59efd59b5fa2a992e719574e2ab01981d4aba05b7a5e81b761b94b8254ec03', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 123986, hash: 'ec95326b305518ea2a9d75de28a20f1adb1b9266c92c7d2b9bd5703542c6713d', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 164179, hash: '93e05009b2d73bf15c4d59861070d4ca6a200157fe4546278d2f93e90b3f6d91', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 191502, hash: '9746b809dd1bfc4e4b7b3ceff145634ff3ca1ec51ec3efff8a2947c0db6e8d45', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'home/index.html': {size: 128673, hash: '97dbad3a59efe3298b31d6781b8fe7fa84dd02a4fc7358fb42268a6d3b03a503', text: () => import('./assets-chunks/home_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 118875, hash: '74cd919b619334e4aad45d15b0ebfad283bec60a875fc71fb3bd2508c84dee02', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 122134, hash: 'a42e9c52241b5377ef164f3fb474de7d6b4b5a0352a1706b751d79c0d7af2bf8', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/esp-devices/index.html': {size: 120561, hash: '597d178a07bd1ca43f0d730f1179c965ec3631d43fad234fa84a73c1ae062520', text: () => import('./assets-chunks/loto_esp-devices_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes-grid/index.html': {size: 131113, hash: 'a6af4c538749ee12519810f8f96e53b7e18af04f6eb0eb9808917df8cbb4103c', text: () => import('./assets-chunks/loto_loto-boxes-grid_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 118842, hash: '2cc728ae3492ba6ec352663e2451f529cee679b9895afb2ad43596259ed9ce22', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 112567, hash: '9cd2b25ec001aa058a7c4d101b259c3dd96d1032b777023a9140a8fbb39f7500', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 155944, hash: '06868b6ec6c707df5e68a15d46b09dc6188057042fa98c647d38545791fa2afa', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'loto-builder/index.html': {size: 197776, hash: '2d3109e660fccb1b9c79e1dfb97dbb8fd49ddd27a4466494331559f4399f4489', text: () => import('./assets-chunks/loto-builder_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 118105, hash: '40b7511efeb5ee5dad9fc451e8122adf08bf298b821edc6b2203193842e3dd9a', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 118118, hash: '663835a1bf0408e9fc9abf23409486a7a495138c9674f8c8402440bdc422b0b2', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 130002, hash: 'da7475f07ffc6b4523105b5848f1491b7afdda9696fad681c2342ac56fc6f19a', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'loto-standard/index.html': {size: 283686, hash: '42d61be77ec178fae39fd59418b5bcfb019c4ec45f9ed27f9f8fa34db69f94d9', text: () => import('./assets-chunks/loto-standard_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 118139, hash: 'cf41400c3b3a35e0f947bf2910c9af81e144703852d8809cc75f96bb617a463e', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 116446, hash: 'f28bcc3324cbfca09db2581c7ee4a2571b9c389f9c995070a27e744de79aeb0b', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 122524, hash: '40489efb3d5aefb1761199e534f3cb82c6be9f3b992a5d49a633cfc4a5a0e6ba', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 116872, hash: 'e18c60f9722a1e26c033f30e2d6e8d02369028d40b811d6e963f3feb34464bf7', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 63091, hash: 'e49b1417aa2157c2046e13ce7a50ab98a095bf65b6adf29610256da2ccd40ab8', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 132501, hash: 'c8b0ed338fc40bb9d7595b079ffd12f6be6dc4b30c7a51164ce7fffeb457c3ef', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'form-designer/preview/index.html': {size: 118421, hash: 'fbce8930792feab7e53a32d2133f4196428db4d2132a2f0be8807f02d39b321c', text: () => import('./assets-chunks/form-designer_preview_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 105239, hash: 'cef72b8bac686e9cd3ba824554cc5ff5d5d62126d161f8aa835a8c58eeb5ac6e', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 114153, hash: '57340690b610d75892c3091fea0720bc5963685b291158e6c816637ba1d61d76', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'admin/category-values/index.html': {size: 83808, hash: '7a4eacb7fe697adb9ddfdb44b7bfe9fbabe504c24a68010cd331ef5405e6633b', text: () => import('./assets-chunks/admin_category-values_index_html.mjs').then(m => m.default)},
    'admin/index.html': {size: 116457, hash: '8e5ccafeef4c8da4a4692e1aee36ae2bc980c4fe1a2cd839c9990c958f6a2235', text: () => import('./assets-chunks/admin_index_html.mjs').then(m => m.default)},
    'log/table/index.html': {size: 134544, hash: 'd4dd0da970407c5da99f78778db171f80afbb2a0ef463692820275fa5749acae', text: () => import('./assets-chunks/log_table_index_html.mjs').then(m => m.default)},
    'trash/index.html': {size: 69962, hash: '5b4982669cebfd783c4c4f14e270fded7a23b63bd5d4ca21fb2c32e43369b31e', text: () => import('./assets-chunks/trash_index_html.mjs').then(m => m.default)},
    'styles-Z3PCIMZQ.css': {size: 32780, hash: 'yim97pIkghI', text: () => import('./assets-chunks/styles-Z3PCIMZQ_css.mjs').then(m => m.default)}
  },
};
