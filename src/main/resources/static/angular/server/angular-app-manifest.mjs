
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: false,
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
    "route": "/form-designer/forms"
  },
  {
    "renderMode": 2,
    "route": "/form-designer/preview"
  },
  {
    "renderMode": 2,
    "route": "/form-designer/design"
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
    "renderMode": 1,
    "route": "/sync"
  },
  {
    "renderMode": 2,
    "route": "/sync-test"
  },
  {
    "renderMode": 2,
    "route": "/sync-resync"
  },
  {
    "renderMode": 2,
    "route": "/full-sync-to-server"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 767, hash: 'f9aada7fe819848dbdbe2e23a67257ab42628e475ee215e350e4295ec7418445', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1307, hash: 'fa21bedcb94d35c213052323a8632aca779dd351d11d86abab1f6f20b72dcb64', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'home/index.html': {size: 114504, hash: '59c3f2bf49d85e862e9e21962d66f30db4ee0d46e5a040365450cc8fbf32b11d', text: () => import('./assets-chunks/home_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 125504, hash: '0416e68479a1a839a9215d2f16682e745f24a73dcbeb6b92fd696af616c0751f', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 106899, hash: '4ad525eb55118f4055f29fcc166e8c66e271b33883936892b5ba5de4bcfc6daf', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes-grid/index.html': {size: 120884, hash: '010db5c8c862d774cf539768297df2c782f49a35fb386b20db9fa9b5386fc405', text: () => import('./assets-chunks/loto_loto-boxes-grid_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 114122, hash: '5317abf3eccc743ea3d1df068109f5c6a5be60d96ed9abc0cf1c91efff652d15', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/esp-devices/index.html': {size: 109109, hash: '613c88f50502b69ad27e7dbb30f4d791ec3d935e17f04fe595f51a8798726719', text: () => import('./assets-chunks/loto_esp-devices_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 217964, hash: 'a47de4f3243ee110c78311c86e36d1abc41c83080a58307063e001a10d1cf524', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 106337, hash: '68f0959abe52017c3becbdfbc7cd91c49eb12bbe814faab5e2a61940941023a7', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 98028, hash: '1dc076f3760790f537401ad7d5494024d1331e928e3f9de80ce81b28fcdf07a4', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 171701, hash: 'bad0597ecefefff1505b0d234acd674baff2df8320782607c40af220c342d834', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 119915, hash: '6e65169111f4c51e218bbcd6fcd4897f0ac5d39ec3d020cfced207e90e7ab64d', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 165838, hash: 'f2bc179f7022788aa66f6f9ac4ff76d181e6684d5d097370123fd782ad0d3537', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 129140, hash: '120169443c23ceaca40f28afe3f8e35ac45a3151045c535ff96f821854420cdd', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'loto-builder/index.html': {size: 213701, hash: '7fbeeca535b610b0bff89fd54ac013e67c66ce51c12806008b8bf7466d7b42e9', text: () => import('./assets-chunks/loto-builder_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 144899, hash: '637c167c1f912242cb39486557fd6807f87f6a16b9414c55b0078dea6d9f3e0a', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 102658, hash: '8000b9eb735f48acf308c5ee719f8f26217b8ee62daee8701078a7dc29de8c48', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 116378, hash: '2dc28fa44ac32d69f7d04f949669ff2386cb7f4f93b1026246f625c9a90d49c8', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 106251, hash: '8dc4a2f76649a31617b4c2566f9da7425022531172b40fa0b7bb95cf7a7dce3b', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'form-designer/preview/index.html': {size: 109206, hash: 'ca758cc3dbcbb494f28c4b3d21dfbcd760ee91dca3daacf7ace29aeb25ac0104', text: () => import('./assets-chunks/form-designer_preview_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 124720, hash: '85f75a1bc46d034eef877a2a1a6093d3fbf5e7092ec3e51d00f6a92c66ac1953', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 48467, hash: '6dcbc8d62b82ab73eb8c08731fe28ef60541b271622cb848add582e1824d9581', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 103184, hash: '563744abdf9f7d6e4cb435ae09ef7190f1d0cff523e233eba2abe47cc4a06131', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'admin/index.html': {size: 103534, hash: 'aad78575291a964ca88271070f121cdd15995e6504a881901030db2e1be59965', text: () => import('./assets-chunks/admin_index_html.mjs').then(m => m.default)},
    'sync-test/index.html': {size: 111664, hash: '0b9b168ce1e735c58643fd030a9cb563495ea45c38ee62ca2d61b5991c1e64ca', text: () => import('./assets-chunks/sync-test_index_html.mjs').then(m => m.default)},
    'sync-resync/index.html': {size: 116903, hash: '17d2048e4281fe56e6602f2ad9f34ed3a56781b2d74a8f6be0b2a506c9b28e61', text: () => import('./assets-chunks/sync-resync_index_html.mjs').then(m => m.default)},
    'full-sync-to-server/index.html': {size: 106704, hash: '1c991b510754661be19be5c737f2eabfdf58dce05daec1c78fe67f357c4b24b5', text: () => import('./assets-chunks/full-sync-to-server_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 113331, hash: '5a8d51ff1b80e549484a170944a40894691157df6e087abbfd955b9ed7297362', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 126203, hash: '5210354914ad0569abf59664e868a503cfc40139d5c717d31ee8071c68a1b474', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'loto-standard/index.html': {size: 313021, hash: '67fb1b80002773118850c38bc16f0f54651975bfb13509fcbce0c7130d820fcf', text: () => import('./assets-chunks/loto-standard_index_html.mjs').then(m => m.default)}
  },
};
