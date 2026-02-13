
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
    "route": "/permits-monitor"
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
    "route": "/permit-builder/jhas"
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
      "chunk-26HOEAJG.js",
      "chunk-RF5T4RPW.js"
    ],
    "route": "/form-designer/design"
  },
  {
    "renderMode": 2,
    "preload": [
      "chunk-7C2LH2YA.js",
      "chunk-RF5T4RPW.js"
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
    "route": "/sync/sharepoint"
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
    'index.csr.html': {size: 25674, hash: 'af907b06f42bc5d3e782ccc171e2235991d989a368390ec9c16793201e22a91b', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17646, hash: '8b5f1f17f48cfbbc5d957b18ac9668cffc00b96716fe3b283a0ecda5338ee88c', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'permits-monitor/index.html': {size: 81433, hash: '6756f8e58542165f9bbaa38e7a30278aab17ee157647953f10f4f3b236d9f8cc', text: () => import('./assets-chunks/permits-monitor_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 226870, hash: '3a3c355c98cbc106d73043e086f09e0f9aacb1325df57a67cdf09b644fdbf53e', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 176908, hash: '68b9fbb89cad4bcf94eeafd1b67700e3752f18af50ecee38c401ff3dc0eac9af', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 131466, hash: '4a003179347942137df6cd2260a9087a67431bc54de50cc0de94eebe71653356', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 125829, hash: '690731529ab95ebeba8739b05a534c0f52f514cfbb74b641313d87205e0bb26b', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 149598, hash: 'f7b9f1a663793f9ff37ee4568eff0d11085bdb35e1eb88205bc0f696442d7b07', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes-grid/index.html': {size: 137688, hash: '6ac44366ff21e2136c33e8caa760a84683fd04c59d2cfd0c4d0ab4716652b63b', text: () => import('./assets-chunks/loto_loto-boxes-grid_index_html.mjs').then(m => m.default)},
    'loto/esp-devices/index.html': {size: 127234, hash: '4c2b53f39e63b8df3d04ccc1b835a7e114b364e3a407f739d0096e0122f1c9be', text: () => import('./assets-chunks/loto_esp-devices_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 125265, hash: 'f85cdbc5b2eb97dc7f8fb49dccce2a48dd1f78aeb5ae2180bed6f7094011bc2f', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 119970, hash: '33c818a2302a35e4889f7848d26b5eae5a9d670b560dcfb8e53d5174d450cdbd', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'loto-builder/index.html': {size: 211027, hash: '08aa6e3fa3b0b110d7c3759c68e12e1061e83888519515d13b5b8b8c6112b40c', text: () => import('./assets-chunks/loto-builder_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 177905, hash: '0f02998c20cac99ed228a9fe8ae0d42e4e94445c5b0221f7a3f126d17a9b83e1', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 138205, hash: 'd21938e995a8437ffe250a64a46c9449faa3e5714d4091928712fda229374bcf', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'permit-builder/jhas/index.html': {size: 158486, hash: '2a32611605406fc6258f5499d9f95375af7b0f1d2c0c6330337276f1436ec634', text: () => import('./assets-chunks/permit-builder_jhas_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 174086, hash: '8763709028db7d013de7d32f117ceac006fe06614fa46ea637ee1058f7081733', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 201357, hash: '127267b1b36d82e241a91bdf191e7d103db69bcb6a4121c7043bf4a53dfb994f', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'home/index.html': {size: 134611, hash: 'ac140e635c4fb8c2518fb03096b15efc38c4a972262e6a2acdab41007685eb2f', text: () => import('./assets-chunks/home_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 123483, hash: '2109951388e5ab148229679547f3454daf032095b5293565f1be8b4c1f7aeb7a', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 185789, hash: 'b1bea0c3661ad7491ee3b47cf526230be95b1b48c0e34f154c920a38fd101839', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 148425, hash: '2e412a8f994d79d98d1a1544932a1a7897fe63d334dc57e1b963e3ab00f36e16', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 125049, hash: 'f21d707d055327637235e5afa9a3b9bb0c93029c8e961ecc16ef690275fa72e0', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'form-designer/preview/index.html': {size: 124397, hash: 'cf59f4a43033c7973f77ed3823a2b978d2c7ef919eee3fe5583529fe98c4da24', text: () => import('./assets-chunks/form-designer_preview_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 139430, hash: '5e0d2a44ae5de82d7994d77967ccc51fbababa739c826fade47df4958b15e65d', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 69557, hash: '0873ef2a301fbf3984603a4e66290ed8a8ddeeb75f62f88fe01c6a83d59f3033', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 120442, hash: '403ec66dd2d2bad2d6af183192331b0d710875c96919deea97de7bcca6438e56', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'admin/index.html': {size: 122731, hash: '719895fd4a1eba98d0379cda1aacfb065148e0ef6371427ec14236783f2a59c7', text: () => import('./assets-chunks/admin_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 138373, hash: '7af413c16f7382a7c426c00e22046fcb39949536a7164ed003fea8e66ec18295', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'trash/index.html': {size: 77064, hash: '10f19221c6145799313ff083d2fade85c1db0b7b51dd99e285f81d5beaf6235f', text: () => import('./assets-chunks/trash_index_html.mjs').then(m => m.default)},
    'admin/category-values/index.html': {size: 106087, hash: 'ea6b3b3bd4036c8052b1b912414ca97e4147eac26594813f76593d2333a40adf', text: () => import('./assets-chunks/admin_category-values_index_html.mjs').then(m => m.default)},
    'log/table/index.html': {size: 141281, hash: 'b92ff46d435281d697eab24fc95456c6e0c9026ec420b8dc6eab1fdf4bdbfc6c', text: () => import('./assets-chunks/log_table_index_html.mjs').then(m => m.default)},
    'loto-standard/index.html': {size: 310803, hash: '2494ca6793289986c2e9004b312f04effe9848ad7d34859ba4a6fb5461597243', text: () => import('./assets-chunks/loto-standard_index_html.mjs').then(m => m.default)},
    'styles-EUPGYQTL.css': {size: 33050, hash: 'T83zmW8yAQs', text: () => import('./assets-chunks/styles-EUPGYQTL_css.mjs').then(m => m.default)}
  },
};
