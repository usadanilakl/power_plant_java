
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
    'index.csr.html': {size: 23793, hash: '0a3f9c63f805aa9e9b6dde2f59104903a698d29ef2c42cb8402ece5c86b2139c', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17152, hash: '2d650d54b09dabdac00f840442e660a92750e0494bdd8bd8807939fa5574bd74', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 46602, hash: 'e420f0e759914f429eb60bd7a06308ea388b1436c1586b0e1ccf3cc904084156', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 49661, hash: '77b923c43867e1d9dc65f058a210a4a928dbb9118f99ecfef4621c2ee9c55dec', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 43638, hash: 'a449f36646d5587dc99020ada53a2154fec363d02310d0f4e07801921042209a', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 44215, hash: '6e021403aeaa9c25f98444b475b83c882bdd381603a437c0c2914ed57c5a3193', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 39839, hash: '640c4665d878107067e75f7c18840ef959b3e7f6dfa790fc37df3096ce753a9e', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 39802, hash: '79fd1b2bb1886380f3bcb17311ed5fca4c17b2ee3222a6e43eff0f837199c6d3', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 42291, hash: '2d10a2a2d322f6890f09d4c707baccf434251f6c757ba819dcf34b027af66197', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 24591, hash: '386e56c34bae0644dbbeabfab18b1e08a6ed6811a61cced29dda72650b42175e', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 34578, hash: '5cd3e82ba67b2e796784f86ccc9d4c3f4f689ecde5515f45a95cb2e8f6ec9b29', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 57557, hash: '6aed379e6b282f02e4c1db76b45896bdab36003c028dc056f1f41452e7b05956', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 33095, hash: '5cda5adde0911b746d98d2c8e01c188d5ba16712c3de1cc36f3d96c2e4ac0992', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 31606, hash: 'cf810dbbc6c4659cbe316d174f3002e681c12da18a97d0f5edd23b45750830f9', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'loto/loto-standard/index.html': {size: 47886, hash: 'ccf73994e2b43dc3fe1dd5c0687ed8a70bf9f6d7a8416df8aeb695f36d805ea0', text: () => import('./assets-chunks/loto_loto-standard_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 49918, hash: 'a50046e960728abe834da61a2aec8a88e7be7e223743be831459e3a0c45294dc', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 44571, hash: '64b31987b3a394ba8944f05113c6a5fc5fffe8fe789ecd6fddcff119ae11fbc9', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 42601, hash: 'ce8d19c32aec68e285cefef955472ca635546e4ff1628d0b3170800cf1e37c6b', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 36799, hash: '3340ed3dbe5c6bc95555922d577cad9787f0fc177ffad62963a9ba188c42a73a', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 42647, hash: 'b6bbdc47f07dc390ba7fea3823af66bdd0b1bd0b3dd38cbc602c5ec401f54a55', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 42216, hash: 'e491b9c71e95216ffa349be7aaa1c4999bfbf8d370f78fc08b834a468763eb87', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 42934, hash: '5a35a007dd92f1f21bb3c0d40a4578fc15fcd7f51b3300f0c897084b803424f5', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 55478, hash: '295f82726b278ac06986baef18f0aeb30b7e5f3b8291d2489fb8ec7e379df8f8', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 39457, hash: '0e7d52207fb0d0b9ae5dcdea24139e236247c7898647fcba0d10d99ed09334a5', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'form-designer/perview/index.html': {size: 40858, hash: '79207109d50be34bec8d7fae139f1877a8c829dea8b01db8eca70cfdb39427a9', text: () => import('./assets-chunks/form-designer_perview_index_html.mjs').then(m => m.default)},
    'styles-WMY3BGK6.css': {size: 10002, hash: 'y98nJx7Z66k', text: () => import('./assets-chunks/styles-WMY3BGK6_css.mjs').then(m => m.default)}
  },
};
