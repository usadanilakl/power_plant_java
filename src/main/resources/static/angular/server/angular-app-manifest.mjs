
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: false,
  baseHref: '/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "redirectTo": "/file/edit",
    "route": "/"
  },
  {
    "renderMode": 2,
    "redirectTo": "/file/table",
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
    "route": "/loto/loto-standard"
  },
  {
    "renderMode": 2,
    "route": "/loto/loto-points"
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
    "route": "/form-designer/forms"
  },
  {
    "renderMode": 2,
    "route": "/form-designer/perview"
  },
  {
    "renderMode": 2,
    "route": "/form-designer/design"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 665, hash: '44009fe0d2a2f543ffba34fbcf94a496fa4c5ea0792685cb894307526bc05abd', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1205, hash: '076ddbe88c7eea64c2dadecdf78e808fafdabf8e37ea354c0e9d14ec556801c6', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 139200, hash: '9a87408dac961dc3f7c96bcd1c4e7cc7b8afe54501286b732aff3321c9bbb924', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-standard/index.html': {size: 99877, hash: '9cb95f5e067f67ed5e460b423672c750047db58fa73f8dc5c466e6a2bd3785c0', text: () => import('./assets-chunks/loto_loto-standard_index_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 3504722, hash: '9b145a861b6ff73ab679e49df9fb8ae6925df781fe422292d4a984ea9485e06e', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 3518122, hash: 'c428800a86baffc3eb37c719df4d6eb8873bafdf17859922f4a55f42d01c4c79', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 36994, hash: 'd6ff1bac713da99a5e71153b5e62acc1cdd35eb6c98f5a9c88f75fbd8c4c983f', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes-grid/index.html': {size: 50844, hash: '82b8315fe07f06ad276f6f57c2eaf14f7397c1d1d1e31bd71bf58e059406c240', text: () => import('./assets-chunks/loto_loto-boxes-grid_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 36430, hash: 'b03a047fac2e1353bd6a1183e8b298fca4618c456c594218fffb946cebb01a81', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 3499050, hash: '055adb928eb9dbd1765dd8b8d724d7d22ee0f6fb1507b567e715493876c4f8fc', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 2423, hash: '17ebf3dbd52e8a802b586900f1857af36492331e9be9f1bf86bda2aecac4adcc', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 3481532, hash: '267a060ec5f0c91ee09149bb8ea856177b9582e872b5488e5b0cd58359ce30f3', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 11796, hash: 'fb12e0d69a37186cf58fd9bcd44f8bfa6d2b94b2ae926345dad91081899f3cc9', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 21879, hash: '042cea6f4affe1182e678524fdf5dcbac001725ac8812fb41f24f23f7bb7958a', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 621086, hash: '372fcfeea2a91c7a53b8751cbf9f8e6b4a0b05694cb635681088e45f3ccc8e4e', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 3477787, hash: '0b6d78d828c063eccdb94057445d97f7cbfdabe54c17af3a2db43d4b64b3c9f3', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 173554, hash: '55863a8711c25d860d8605b43cd85f43dfb902719e3fed95965350463c0591d7', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 311796, hash: '2da435463e150027934ffd629f395a94978795a68b008922610302b13e42fd8b', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 24575, hash: 'ecac376e5873de3b72169a9ac6564ae3c660c31f5070c2bc4fd305fd1546069a', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 1366183, hash: 'b7657e3efc9c29e85a29d14d26a615d035f173d193ceb3afee73dbe5229a12a5', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 615936, hash: '936116db904012f01a74648e591c9a1bd2aab190df9baee7fcceaea3f2f4d585', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 523655, hash: 'e386498222a063f7d9735a4921042c4d72fc16c7291756915e4bef03085b23f3', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 3470239, hash: '9654ddca6fc79ff395cb93af5427815a84a10af621b6dbc5f6a7bec7041dbea1', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 634414, hash: '8d89122973401bac90f658cd4980b46ea590305dde83a5e5d3035f5875c2fd97', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'form-designer/perview/index.html': {size: 1251365, hash: '71985da73ca0be964371489c1390be94e4e1c42132451619353c2bf8fad50d23', text: () => import('./assets-chunks/form-designer_perview_index_html.mjs').then(m => m.default)},
    'loto/esp-devices/index.html': {size: 43623, hash: '2df7ae18d460e5d8032424bc0dde8503ec25e8d38e41c2a9c0cbd7fd979214d6', text: () => import('./assets-chunks/loto_esp-devices_index_html.mjs').then(m => m.default)}
  },
};
