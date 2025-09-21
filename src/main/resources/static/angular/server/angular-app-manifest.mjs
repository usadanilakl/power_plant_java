
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/angular/browser/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "redirectTo": "/angular/browser/file/edit",
    "route": "/angular/browser"
  },
  {
    "renderMode": 2,
    "redirectTo": "/angular/browser/file/table",
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
    "route": "/angular/browser/loto/loto-standard"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/loto/loto-points"
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
    "route": "/angular/browser/loto/locks"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/loto-points"
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
    "redirectTo": "/angular/browser/permit-builder/jobs",
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
    "route": "/angular/browser/form-designer/perview"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/form-designer/design"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 23674, hash: 'd1b81b074c11261391beb68f94a3e521e499cdb290e0819c938423c8e7e91b36', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17152, hash: '283431281015f28a6e5e25a55e633d6994a70e4738abca1251713d60449f04c1', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 46280, hash: '84da889d7434250bb53bf6acb4dc2f49b88870c98e1cf3068a0ee77811d28fe9', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 49033, hash: 'e4d160715298b7da81492ce6023a348ec0b0cf3036ac47acb5b9bce84cb7281e', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 43321, hash: 'a8a7610e809b7ba234507bd20c17dac49dfc38f290f420300f5a7a9f5dfd31d1', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 43897, hash: '539b0dffd73ca6386dddbff0b40ef39a8c51f2303f40f826163077b8f272e7a3', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 39518, hash: 'ae01c59856e9ba3a55361adc067351f612286f200642129b1f1c84181d59768b', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/loto-standard/index.html': {size: 47564, hash: '50b5574fe383c1e8310a89eeedcf60b1890ec222af3b339dd0279ced062b0faf', text: () => import('./assets-chunks/loto_loto-standard_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 39481, hash: '7dd42bdfff28edec560244309628cba816abfe824bac081393637ac1f6bb891c', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 24270, hash: 'df5c3a16ee668fb36dfeb8d62478d5eb0cbcb85dca1ae26bc81fa7db681f9754', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 34255, hash: '762bd89510fd718efc7568cdd5693b2453a4e5a9882ebb963ed77a803e1249e1', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 41974, hash: 'c69ee54078d5afafbd4061ec4eaab33849de15627572b172a48bf6fe072c14a7', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 31285, hash: '426c040a3b8d73def6bc3d044463a12a67c11c50e6e4cfc665b089616ae9b8f2', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 32774, hash: 'ed34bdbc7f1f59b4ab8547a1413b084ce9a16cf884f9b107fcec1b43375179f3', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 49599, hash: '536f1e7b1f2f98f3891fbe0918e9380431e9f1e17d67a3901265a071898da2aa', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 42276, hash: '0ffe7b0255d5f5a36f455a6c64682feb4be3fb177d3e5b47eff7c99413df8d21', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 41904, hash: 'd07da5c797f2290fb301e64058b7f94fca2c0f4d1afb4a29cd6dc64d64c07cd4', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 43596, hash: 'dfb03a729a19a01100cb4baef998a8c55b6257b67456f744599cfef035c85521', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 36478, hash: 'e8131e7b9ad3b0df9f537bce9b61b39d98594d286cea0b8291baba0074c7a731', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 42322, hash: '75d4e1403566ccd9730ba235eedf6584ea87c9515d7a5213c1da44d9272f1fbc', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 42611, hash: '8964026fa156cb67c211681b3c8732841bf549d7c93894c9773ec5c7dbde7860', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 57235, hash: 'c08af2749b37fa848f2e534c494d19b239dcaf492c9732ef6f015a27bb33b8fc', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 39136, hash: '06dbb5db4929de4e505889607644588d40b4b56fbd5317c611fa51f3640938fb', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'form-designer/perview/index.html': {size: 41072, hash: '1207b09fd52399423422712213cbf843455bbb450eaf971a08c6b241aca1b095', text: () => import('./assets-chunks/form-designer_perview_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 55156, hash: '9939862e0351d613ddd2f1a082a1a93aeb36d6e11aba4a7183016bead5342c63', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'styles-WVLSSJOW.css': {size: 9627, hash: 'm5kLIVbtCdo', text: () => import('./assets-chunks/styles-WVLSSJOW_css.mjs').then(m => m.default)}
  },
};
