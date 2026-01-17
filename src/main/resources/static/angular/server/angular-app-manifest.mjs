
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
    'index.csr.html': {size: 25137, hash: '201177e4b45de92df6b678a350c812f28d043ed2e79e1de07f3755b60751e745', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17254, hash: '2a6628244ce6c8b408bc8a452e261920b31f189b16b94ba6f7add7834fa18117', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'home/index.html': {size: 111579, hash: '23199fde21797b1b3e5d91c8fbf4914b58a4f49f35a2e838b6669a98c86764ac', text: () => import('./assets-chunks/home_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 111482, hash: 'adfb97740ee4ebb5d12827567d542420edfc4db89f30c080060a6304d9600eea', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 111124, hash: 'd0fab7a38c1aa9a149319f8376f15ddda39ef9301d7413bfcba58f5defb7aba7', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 149677, hash: '295797e360a0524d98883edefad7a5e3af9dbe5a88fad15689ff8e14c0f080bf', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 106371, hash: 'e974d12f4cc254ee7c766be42c59130e4f76ee089ae19ccbe28e36b54f39d23e', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 173982, hash: '25d1c030d663cc508f204564e291d51f335155fefd580a873dd39a4c6ed5a1b3', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 106339, hash: 'a0addf58c0d000b585d8da94c196681adbff3890cbbae38bf65da0813c27c41b', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes-grid/index.html': {size: 118609, hash: 'dde1e562cfcdddc7d879b24cf99529f809dc9bca8b940db9d6b487ce3f6a9ddb', text: () => import('./assets-chunks/loto_loto-boxes-grid_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 99143, hash: '90e0d4a9f4be89060dccc7db2eddf0a37ac22df2ce58b05f8c8d08bd10de664b', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'loto/esp-devices/index.html': {size: 108057, hash: 'a0af63b7d4b6e2d4960141e449534d3466e333fec6bc08b555cbbfdf67948ed0', text: () => import('./assets-chunks/loto_esp-devices_index_html.mjs').then(m => m.default)},
    'loto-builder/index.html': {size: 181539, hash: 'e726787c347c2db7aee704bdbbb68c2db3713a7644407f5b5da8808f72c9ad82', text: () => import('./assets-chunks/loto-builder_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 116259, hash: '880c7fab2458f3cebf29423892f42f97419b76ad14e484cdbd8fab4c22e55c9b', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 118051, hash: 'e460d1c9a4c624c8a08dfa443c0ff5200ad844ca5ec6197ae48d51d2b6340c8f', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 104695, hash: '1305127326f06ad23cc9ae8265d8e49558a79373469ac0b53ce2ae9f96bbeff4', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 104681, hash: '59171c8cde0c0f85214da7356f4e47b8d31dc5f1d6e5008ee12741894427d697', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 102034, hash: '3f646926a5980c60a4721460df6b58c286d56ea7271d4df0eca4851883af01e9', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 104715, hash: '1e4655a2ffbc15d5773d9c5777c2424831a4a272fb9816fa99dd26f453c23ed3', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'loto-standard/index.html': {size: 267013, hash: '40ad9e10236cf22e87e1065acc2b3a2cdf3b0782bb1317d038b8cf8737f60e2b', text: () => import('./assets-chunks/loto-standard_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 109179, hash: 'e22bd8dde1dc1dde43b7d8e19a43e81c5136c01eb0ff8cf1cf24547e6950dee7', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'form-designer/preview/index.html': {size: 107337, hash: 'd667b020348706c3e012ded34c6adeae795f85ef565edf72b22972df9c17417d', text: () => import('./assets-chunks/form-designer_preview_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 105363, hash: '3ade356059ca5da4713ec61f6fbd6909d0cb9552fd9d98a466484d49d6d7e38a', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 121397, hash: '47d7be9026b71f2e5dd665883943be4a2089ab213ffa623c62c7ebfe6fb87756', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 59056, hash: '85eaba0ae887023b6bcd039138b50d53d7f2bd958aaa2db53eaf77bca1a7672a', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 66135, hash: 'd3d13a6cf8fa3f53c0c74951cb3909b49300cc86e56aeaec2706966a2bbbb402', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'admin/index.html': {size: 67677, hash: '3714fdf0d7fc64a220d0352d22129adad2e2ebb9d5fb4746fb676e0c3d5b6d8e', text: () => import('./assets-chunks/admin_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 101262, hash: '41a8c794763c157e3149db64f7b6713d4856d7e97f7589847237afbd5e3db254', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'sync-test/index.html': {size: 71307, hash: '409c27c4f8390214ea6a5ceee54d80a39a4b0e2866e66c9aa017529c8845abe1', text: () => import('./assets-chunks/sync-test_index_html.mjs').then(m => m.default)},
    'styles-7VYHPHOB.css': {size: 28858, hash: 'm4VI6V+Txag', text: () => import('./assets-chunks/styles-7VYHPHOB_css.mjs').then(m => m.default)}
  },
};
