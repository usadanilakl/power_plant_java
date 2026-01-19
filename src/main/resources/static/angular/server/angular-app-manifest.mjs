
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
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 25121, hash: 'edeee4b5cee151d0a2e8607b9b3bf92424e30a396828d027b11a4f8657c7c2ac', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17238, hash: '05b1a3a55de25d4fd8c3639e1555e5ed23da698094ed404d3af7e062c21a2aa6', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'home/index.html': {size: 111163, hash: 'e5b0b719f85f835aff16cefe7444a45413755d1739ecfda84021193459c4d26b', text: () => import('./assets-chunks/home_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 114050, hash: '8d207b23aac11bbf7fde3b4a35d91cc8443c378f97cb4e7bc9da74ea6ac684d4', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 106549, hash: '1863d97954dcbe4b70019b7e872639c1147bb09218379b812c60ba73f373ef1d', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 112172, hash: '8e6262ce6ab16d52cb281014cb9bbef79e6afb6fa0fe85da2846a81b978c4c55', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes-grid/index.html': {size: 118395, hash: 'b35ae4e0711664705296a7b056de65b7cc2941ff2919e61f09a860504beeec22', text: () => import('./assets-chunks/loto_loto-boxes-grid_index_html.mjs').then(m => m.default)},
    'loto/esp-devices/index.html': {size: 107918, hash: '22fbcbd2460dbbcc08af2e63673f1fba0759f4331414bda23a4730c681e39c9b', text: () => import('./assets-chunks/loto_esp-devices_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 105986, hash: 'fab91922b08bf694dd6af8ec3710fc8b4ef3b81cfb437a57f38faf05b7ca3baf', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 184001, hash: '6613fcfaa1f5d9e95ef128853f6224d724f13646246f343d18ce20329c276837', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 98824, hash: '05b743bff813375a199aa9686481abbbcbec684348aebc784a236f1dd7c50baf', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 158374, hash: '9c89da79bd5ffe843c21cce42c0c7c972c363a4447ce48d0421d87e8eeb3af41', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 117960, hash: 'd71e039c9528a7f72b424bea4e63f599dc6535da4f0c36fdc0162214456ddf0d', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 105359, hash: 'cf964038e0a4936c85334ab7078fb8a08744f3a8df4871195ccd07d514239c31', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 105343, hash: '592a1b81d08b26e650cc66c5be78095a098200bf2b19957ec31e3acbd5676c58', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 105395, hash: '3928677d70993c6f4b26f3df2d9f3333600fec48ac7d9296cbb74973b50f0c6d', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 101810, hash: 'c53f943fd878668beae5632283da726ca4a46166b0a2ddbd7ccadf8ee944e453', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'loto-builder/index.html': {size: 193248, hash: 'f23f97dc9e62c6d4aa58d46a854b5a801db5f5ec1e1fcca75746b7d85abbe18f', text: () => import('./assets-chunks/loto-builder_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 114008, hash: 'e7d3e63b90f79c957ed9e3ecfedb7fef54e2a536d9037eebc5eeecff101c6cf1', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 105298, hash: '75121f0bf00077b14aa07f13e446007fb36ffc7600fb5d005853289df95ea197', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'loto-standard/index.html': {size: 273161, hash: '9eee793ed341aa2adab400df3b40746205547259539c8251e56fff405318c234', text: () => import('./assets-chunks/loto-standard_index_html.mjs').then(m => m.default)},
    'form-designer/preview/index.html': {size: 107753, hash: '01eb669b464c22e84c7128e561af6c8319291db25875614f77625988b8196f0d', text: () => import('./assets-chunks/form-designer_preview_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 104836, hash: '3cdc03fb7b2eb01d940ae41d3366e33c35e6abbf57b62a226d85d8385e4a2dda', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 121332, hash: '5414e2aa1c8235385fa4f8e7464a1e012a7ad1680ffc825ee59a859cb5d3bf1a', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 59040, hash: '593fe9efca719427466b612f17210e7200424757fba6a2a5b84ad72265be94d1', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'admin/index.html': {size: 67453, hash: '88df647aa000e1affbbe4954e76d05e4c37d80f74ef66ce71a7118143a3205be', text: () => import('./assets-chunks/admin_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 65904, hash: '9eae66525c4dc929b420c0ec34317c3c525aace58599bcb15fc855ee1dd23143', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'sync-test/index.html': {size: 71291, hash: 'a1e408532c532d1bfa64cfef998303d5dec7a9e00909b4c2d47245eee849d62f', text: () => import('./assets-chunks/sync-test_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 117893, hash: 'a0c6f65f7f01a98c07cc75fa2d00a39affb54819ccdf01fb1bae334f7a1592cc', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'styles-7VYHPHOB.css': {size: 28858, hash: 'm4VI6V+Txag', text: () => import('./assets-chunks/styles-7VYHPHOB_css.mjs').then(m => m.default)}
  },
};
