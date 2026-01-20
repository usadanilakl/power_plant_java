
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
    "renderMode": 1,
    "route": "/angular/browser/sync"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/sync-test"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 25137, hash: '8872962deaf8f9d399572e0ce9ee23f021319359c4fbe7c0f7e185c4d97f203b', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17254, hash: '2542c6821b1c52f7ee27ec5be343cce40b1cb9de48551c911ab5d4cd5f811b1e', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'home/index.html': {size: 111579, hash: '9d8b60f2503532121e2fab0872d8034c340c55546ae0f9687791f208bc331377', text: () => import('./assets-chunks/home_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 112573, hash: 'bafbb39bbf8fc023bd7bb0de704815d4368267b42486d5a267fff83eb3792f69', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 112524, hash: '345083f85cd0510dcd19026aabd552f568aa6ae0dfd967e6c2a07ebde191b6ae', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 106901, hash: '680505651d060d56e1961956f38b29306997da7c6f6f5c16c3364e22c79dd713', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 153143, hash: '4830193f72cce5b0c8a3ee4645458f2092b438f8e4fbe4a076d2ecb661a7f6ae', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 180126, hash: 'f590dccd5331a012904e5e15b3bcab1999a4856919d5f1ec44c974743fa7d0b5', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes-grid/index.html': {size: 118747, hash: '32383ab5e71f8e17d24f3490ce90ebac5c66c4a741e52543888e06b0d9d9dea9', text: () => import('./assets-chunks/loto_loto-boxes-grid_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 106338, hash: 'd1fbe34919c4f10235846256d360c6e70f4f77092944958d52e134b546ad2bc6', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto/esp-devices/index.html': {size: 108271, hash: '845b04de2e75d4b3e185cf6fb9f2b41cbdcaec94b12ecb92c4006131e2e14f3f', text: () => import('./assets-chunks/loto_esp-devices_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 99143, hash: '956d8f0dfbff6e930a5d20353440df5108080151a2f9da9ef2819c098204b2a0', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'loto-builder/index.html': {size: 188017, hash: 'b71e36b6b8467bd10eb389a38c283ce578b67259cbf3ef3b7677e753b11183e6', text: () => import('./assets-chunks/loto-builder_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 118279, hash: '13b948a4ddeb3a9893aa19d07896544ac229512147b0b8a063da20c36b88b0e1', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 105320, hash: '23963be643fb795a9084d353ddd80df6e3cffcf53bbe720f89e6a8bf99cb74c9', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 105304, hash: 'ba7724567a0216d14feb3c25e5f8d18efcec5e32be63016539aaa7f6b4188a21', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 102033, hash: 'e5bd1f6588f02cbe919663b6aa01b64dbfc9bcc8828552d902d7993f9c3f14f5', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 105356, hash: '58028367890d0f2b03cba3aa44ab1a718e14596e9acb8d902bd67a8a1c9af406', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'loto-standard/index.html': {size: 269576, hash: '0687349e93efe1b336385d8e137356827df54327bf74e2d231b7fc29884d54bc', text: () => import('./assets-chunks/loto-standard_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 110930, hash: '76b0ea783eefc8a87429616327df8a7f317a75ef0abe8544b708d3c0b5e23677', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 105570, hash: 'd3112ae126c51ecb4c9a76de977e845ff0952a466dfee73a58c6ac7823e3ec3c', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'form-designer/preview/index.html': {size: 108025, hash: '2afe1ee101f8876dfe99d2dc41c79bf251e17b4d70b1b9a35060e7fbda03365b', text: () => import('./assets-chunks/form-designer_preview_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 121604, hash: '0638bf7dfe391a1d1cc43b9023d849f97ebc3b5bb4fa72f0323fd7809c47cb8b', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 59056, hash: 'cbe9c97ba9e91b9e3135333fc107b63e8874c6770d4e02805490d3f5900a8212', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 102916, hash: 'ef73a13d9dabd13bdbeafde0d8b0ab8a482c76d895de5061e53d2a8ccd6497a4', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 67154, hash: '73a09422b2e8d9be285584c40f8d641f734215915bc7a52060cc59ce6c048aab', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'admin/index.html': {size: 67677, hash: '10ed8f240dbee73c86ed51912dfe4fa3f35f1935195f9c6d56efd15f63d0078b', text: () => import('./assets-chunks/admin_index_html.mjs').then(m => m.default)},
    'sync-test/index.html': {size: 71307, hash: 'f6c411cb562c6bc2cacd96946a0972b51da9ec901581583e1c7b457962afd541', text: () => import('./assets-chunks/sync-test_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 117852, hash: 'cb7000992649ad6d3382cae8591fc81f53737eaaa7e56aa72112ad1163b313aa', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'styles-7VYHPHOB.css': {size: 28858, hash: 'm4VI6V+Txag', text: () => import('./assets-chunks/styles-7VYHPHOB_css.mjs').then(m => m.default)}
  },
};
