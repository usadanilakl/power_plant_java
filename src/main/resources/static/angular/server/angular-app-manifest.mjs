
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
      "chunk-G6ZLJE2H.js",
      "chunk-T3IDWNPX.js"
    ],
    "route": "/form-designer/design"
  },
  {
    "renderMode": 2,
    "preload": [
      "chunk-ZH3UTDMS.js",
      "chunk-T3IDWNPX.js"
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
    'index.csr.html': {size: 25674, hash: 'd8b078b9b10b5db041c31df2fadafa1cb1223db3ca081d1bddf62670d2be2551', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17646, hash: 'df66bfa41474a35652b7a522f88024aea0cec7e2b0da2314936d8828a97a0aa3', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'home/index.html': {size: 142821, hash: 'aa69e33cb19ea8ebbe68f07fee2b82ad487b71ba0e9e60c69d7318956e57d162', text: () => import('./assets-chunks/home_index_html.mjs').then(m => m.default)},
    'permits-monitor/index.html': {size: 197947, hash: 'cc5ba7f45a8f39969aa46010a6f44929b7792033edf75bf48aff61dc9614c8c7', text: () => import('./assets-chunks/permits-monitor_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 234999, hash: '79da2b4616c79eb56c4fcba254aa35fbff563cd9994c2b44103943b4600d5acc', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 134039, hash: '4275a836ee516b5466fe0d43e94374bbb9987c016139324641e4aead4ff5ddf9', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes-grid/index.html': {size: 153283, hash: '32cd9a1050b97c530c4f415ac3bb3281156bff8172c9162200a6b284e2402026', text: () => import('./assets-chunks/loto_loto-boxes-grid_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 133481, hash: 'b1f32994758ad406b1de8fecf4a4a1145e4dac10571319f0a85ed8d915c50c30', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto/esp-devices/index.html': {size: 135450, hash: '5ac4f579f5cd480458bbe6bb3a73cbe2b01ceb4fa922ed2c9157beaafcb944c5', text: () => import('./assets-chunks/loto_esp-devices_index_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 3553703, hash: '57c6a9b061fb9f3908270384690cacbd73b08dcf9b351b596a584fa103a2ceca', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 3654546, hash: 'f1cf0d15901b08dadfc87d04df55bd38b2df71797d4dcbc96e639f764b4711df', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 127829, hash: '8f23138a9e78340cddafef2a523707f75cf24cec8a857ae5aec1643a9cfee8a2', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 226284, hash: '43ac2f3a0600bcb2625ca531bb066c95011ebd5c7faa576e44a099e1015fdf41', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 3573138, hash: 'b07ecf9508d497cd3382baade9babb1111cbf8455dca1a52612c2d29526d0942', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 732046, hash: 'e05d7297ba780e266f573e970c16dcc33a63fc99639e413d691a41d6588eec47', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 294804, hash: '5150d8960b3af8b05dfd1532853cb988c5e3c3edd3239e5a36505ff3edbaaac6', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 428564, hash: '35566631e3303c944bd530734c4d7d327b708a76f9166abff47616eecdb961b6', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 131330, hash: '9d638159301991da80dd12c84f2b8fbac63eaf30752fca7de4132841dfa6741a', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'loto-standard/index.html': {size: 7704730, hash: '7ba166a9e9e49868b6583f21a69be20c782f4b46e0a6c29b9532c05f77698eca', text: () => import('./assets-chunks/loto-standard_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 722199, hash: 'e9f9d16ba58fe5315b4b57a16c0aaf622c614f07a65fa5903614c99fe73a827e', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 733567, hash: '99552150c1bc42d507a29fae69cb65a055b184a976dfb3b806613a4789cad5cb', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'form-designer/preview/index.html': {size: 718544, hash: 'f77299ae976e358501302d47285e956100ca7a966ec95f771bc6bd6c2a969efe', text: () => import('./assets-chunks/form-designer_preview_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 640841, hash: 'b8f4bdf3ce4010a5d203fb6d80236ecee25caeeba40c152722f3e644150c23f2', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 77767, hash: '701f8a794984345c04ab8a9e86fcc37774a77796724cffb924b8892454000c85', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 129685, hash: '5c0265f40920d1a5b6902e35e7dabab48f860456d39b891ea7aeffcdc9fa1ac0', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'admin/index.html': {size: 130956, hash: '648fb76172fa5b46f507d36294ed1cd815972161736610e716aff1f32a3cbb40', text: () => import('./assets-chunks/admin_index_html.mjs').then(m => m.default)},
    'admin/category-values/index.html': {size: 125690, hash: '5e631592bb768034b545ce1c69aceedf5e4d97f39625eda084597234decadd3c', text: () => import('./assets-chunks/admin_category-values_index_html.mjs').then(m => m.default)},
    'trash/index.html': {size: 85280, hash: 'ddbe5af65ed28e0552fc1e6b6935e81ca872fb330011dd5362df8fa01e496efd', text: () => import('./assets-chunks/trash_index_html.mjs').then(m => m.default)},
    'log/table/index.html': {size: 149518, hash: '84c781d595bd190de12279d2c03f5bf30bee0cab4b21c9440a03e42bf78de8cb', text: () => import('./assets-chunks/log_table_index_html.mjs').then(m => m.default)},
    'loto-builder/index.html': {size: 3726105, hash: '292545096fd1a9ffcbd5cf35c6bfd5024ef74c03099a6a21df6fdacc85a4652a', text: () => import('./assets-chunks/loto-builder_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 3571588, hash: 'eb88cb0bdbf5889ac78b5cdd6bddf4fe74e2fbe985a9dd0712eac99ee66751a8', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 3600474, hash: '238e7657d9de0140c9bb4dfbbe786ee0f95501b20035de8eb7875c8af7427414', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'styles-EUPGYQTL.css': {size: 33050, hash: 'T83zmW8yAQs', text: () => import('./assets-chunks/styles-EUPGYQTL_css.mjs').then(m => m.default)}
  },
};
