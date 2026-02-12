
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
      "chunk-UGIRD4QH.js",
      "chunk-QQN445CE.js"
    ],
    "route": "/form-designer/design"
  },
  {
    "renderMode": 2,
    "preload": [
      "chunk-KBREE6VU.js",
      "chunk-QQN445CE.js"
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
    'index.csr.html': {size: 25582, hash: '451d0ee749232d5049d7f9e00397dd40204140924f5078008773c618f654f7f4', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17595, hash: '7e97d517f6141ca292011a720cfb2f0248a2b3923f8cb30da2d96c46031feefa', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'home/index.html': {size: 128486, hash: 'eb8b6611bb2599dd26d887f9f765a60e88ac4f297c95abe87cb45bc8e2aab9af', text: () => import('./assets-chunks/home_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 122299, hash: '127393d42ef44504daf65187144f8762c9d3ad1578a71fbe754b8a74c25f8b6a', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 191683, hash: 'b8c7f9b913671e81b46410390bdfa4719565c9cf7ff5db8276b0e0d8604b1de2', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 119040, hash: 'f193602021ae3783a87adfc291462c26dd39d82dd9740a5fcc0fc2b44221b927', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes-grid/index.html': {size: 131278, hash: '85d0f9f4df8cff44e42c16e26658d3b945f4815624c11a5e91cf8ff3a756a695', text: () => import('./assets-chunks/loto_loto-boxes-grid_index_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 164360, hash: '240489c088c94583eee2ac270e6ba042487e487448d82d95b51afeccd4ed0947', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 119007, hash: '0c50489e869765fb6c5ec860ef1a8fb9c889ecffaf525559c9b32fdde8401191', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto/esp-devices/index.html': {size: 120726, hash: 'cf277cb5ba9e3749c5813283f444bdd10f0db67ad6a3d1a770e461c8181ea008', text: () => import('./assets-chunks/loto_esp-devices_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 112684, hash: '4c9cd259f4c9e2d310a7ce597a916de93534344e8fa595d2633470784788dac4', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'loto-builder/index.html': {size: 197941, hash: 'ac74b2f4bbff6aa6889bae5e45ed2a6c749b1ff757eb6dffeb1bc0bd51cb7313', text: () => import('./assets-chunks/loto-builder_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 130119, hash: '374197d2a131aea80a944187c982c7d6172c6177ca9a8d17ac904a728234d665', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 124151, hash: 'f95b1b35e90a946592aef4a30a04441b9f37c1da96baa51f9591406554e89504', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 118235, hash: '4e6463dfa3db01cfc2ebcb1b346ba15682793a619f373427ae85291704ff53c0', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 156061, hash: '6b42ca89565d2b5a05e93546ee22331833b99a1d4e1d10b178fe270f57158fbd', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 118256, hash: '775ff82bf05b746079e84a0a9ebf04ca3ca2a1bed2b330a65004c2b4e74e285f', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 118222, hash: 'e5d73361bc720d0d3bd7ff805c53a64dd305fc5ccf283afbf731e38d4206707c', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'loto-standard/index.html': {size: 283851, hash: 'e8825685c6af1d2feb2309bb313f6a4b257b09722c0479cde6484c08239b49a7', text: () => import('./assets-chunks/loto-standard_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 116989, hash: 'a69043596f8dc3f70e259f351c3645c64086f89afbba60b2bf8cf6faa012b4fd', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 122641, hash: 'f01546cd80efbe0ab3cd9937467fdef68cda98a79bac49b9d4dee5475501ff7a', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 118517, hash: '93fd952c2807f7fde13bc8800f1176a9f810e8022c0ee1dada56ae1004bf16d3', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 132930, hash: 'be3dec969c196143180a8dd342250544f1e6a6cc10c9c785a57cfcef35797660', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 63432, hash: '327f930cdad7f378c179ccaaee6313e9f762f6a52698d570748a3422a7b7faa6', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 105580, hash: '2f236856c5f19c8c85fe699873444c23135e20a02db9af3716caefaa160a9023', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 114318, hash: '2f07b508e5077908bf5dd1f9bc59a772045f7150953e8ed08c21743b2752edda', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'admin/category-values/index.html': {size: 84149, hash: '507e59ceacb8e2e8c10787854ad843675693cbe432feba4b96c713865fd88d8f', text: () => import('./assets-chunks/admin_category-values_index_html.mjs').then(m => m.default)},
    'admin/index.html': {size: 116606, hash: 'f9fb3887fc7085aefd9580692f60ae9a3878b696b57a9bafc83a67f09446a57d', text: () => import('./assets-chunks/admin_index_html.mjs').then(m => m.default)},
    'form-designer/preview/index.html': {size: 118673, hash: 'fadda21b134d5e700ae3c0039b0213b530183490a303eb1a314127a101ecb0be', text: () => import('./assets-chunks/form-designer_preview_index_html.mjs').then(m => m.default)},
    'log/table/index.html': {size: 134757, hash: '804d92fed30c08a4eaa7b1233091c45ee70ed852a1fa766a8cd7233cf21e0938', text: () => import('./assets-chunks/log_table_index_html.mjs').then(m => m.default)},
    'trash/index.html': {size: 70303, hash: '322b9d6e83467261ad2ea1b9e19d998021277c21397a39b609a83458265dff80', text: () => import('./assets-chunks/trash_index_html.mjs').then(m => m.default)},
    'styles-Z3PCIMZQ.css': {size: 32780, hash: 'yim97pIkghI', text: () => import('./assets-chunks/styles-Z3PCIMZQ_css.mjs').then(m => m.default)}
  },
};
