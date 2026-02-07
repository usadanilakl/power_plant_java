
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
    'index.csr.html': {size: 767, hash: '6b5d32a69ca1f8aa1217dbcf2ec52e4435ecd2a592171c3b40dda41167529cd4', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1307, hash: '34d8a21d19c704f4d37f8a394b323e053cfe1d5dffe29c8e4d2e7b7936dffd74', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'home/index.html': {size: 110253, hash: 'd1b997d104eca7ea9074685b150ac8ccd77572e034eb067b425b124811382fc5', text: () => import('./assets-chunks/home_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 105451, hash: 'cec232e6667641a21cf0e8d690cfb41d6c5465537afad321a9842385087e7cb6', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 101244, hash: '3ed3f832f245a34b437b3b95e0a7fe5bba2bdf519fe8eb7ed6100ddb3ab07464', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 185950, hash: 'fd3c08402a66b0679854b56c183c30282d19e624028b728654d3018cf14a4132', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes-grid/index.html': {size: 115621, hash: 'c43b0026645a4aefa151ee2101c25910ac1bd43d60943b2292b16388ab62d71b', text: () => import('./assets-chunks/loto_loto-boxes-grid_index_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 151679, hash: '806d6b55ebc93082941d8cf9f27f67030c807aba0d10dde0bfa040479f57d833', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/esp-devices/index.html': {size: 103771, hash: '09174ea0dab7023bb218309688de09e94bedb1f4163138d7fc329ef60075d293', text: () => import('./assets-chunks/loto_esp-devices_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 107956, hash: '58e3f5b837ebd2d73ef83553e25eec75638dc49d6cb2179d3195c50e4c31451d', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 101211, hash: '94716b182fc3cf08e80ddb0f750269afa096d3285cf7155920d8c871a52058fa', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 92902, hash: 'd017ade049d3ff552559a471272719eca4bc9a94891a53371a817e96ef54cb9e', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'loto-builder/index.html': {size: 192999, hash: '0ca3aea83757e1987163a52feba028097a952ebea2e18116cb200d448a02ce31', text: () => import('./assets-chunks/loto-builder_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 111113, hash: '463052672d84b9d83866f84bae93def84ce01a7094ab6dc7e2cdc7a410090294', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 112730, hash: '9a70336641bfcb97ecb4cefc1b6d041d3c645ce9652b5ee495a575382505cbdd', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 99384, hash: 'f0b16a34414e33a329980f15be1e78eb67c657ffa6beeb89d0bbb5dab3f0d53c', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 99400, hash: '84090acf485245335f5fd75a6c99dd3a01799ed51db7e68ab879882e41e8b487', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 99436, hash: '44bc3bc78d707baaf3da14ad1604caf5ae3d82aff08b0440bee9fd2bdcea9c5f', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 97530, hash: '1e347a5c3dce87ba74192be0c57b8d66d515db9090139a1c213ae518c5633783', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 104192, hash: '84cd02a5e3a1abdcd479cd9774b2dc133fd7323c2d8a263fb7eba4189b5fb678', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 98945, hash: '6747e7bc4cf47b3d34261d8c0bd8dc6a2c478ad1e890d8bd846330f1315d645b', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'form-designer/preview/index.html': {size: 101422, hash: 'cf443d1a70b1ecbcb3a05f59957eab4e1790c115ce5756ce7bd8ed71fde2a055', text: () => import('./assets-chunks/form-designer_preview_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 86405, hash: '9eaebd76ee9ae303588091430ab308b53abf7eb8a41178eda5fb05e0702e814f', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 117413, hash: 'b8b308eeca166b3090d04f523fce9337cd0113b0b224552db857be71b39431b4', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 37969, hash: '4c9c58b7af0c343b0339789e6b726e67eefb3311ff8ec514a480e6aa1ff94a30', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'admin/index.html': {size: 97762, hash: '7efbce11efe685fb712e69a1825b51890a5369cf7744cee24b04c18f88f54f5f', text: () => import('./assets-chunks/admin_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 96073, hash: '13f8b0e15629a635216a696289dc112789f171c5ed1223fd63db521ab1198e4e', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'loto-standard/index.html': {size: 297253, hash: '2f348bc9669627de0ca9c903a7cd002e0c8cb537e2586d65898ef3823a422f3f', text: () => import('./assets-chunks/loto-standard_index_html.mjs').then(m => m.default)},
    'log/table/index.html': {size: 120533, hash: '4e374fde65934f6670caeb4fcc60f3ab6e056bb3f7f3cb43d9b2ea4086744512', text: () => import('./assets-chunks/log_table_index_html.mjs').then(m => m.default)}
  },
};
