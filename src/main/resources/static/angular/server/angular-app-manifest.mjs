
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
    "route": "/angular/browser/file-editor"
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
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 23674, hash: '4c61342d089b79e0825908b9046760fbb2a7bc78d0599ab5c7f5d8ce704fc45c', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17152, hash: '457a635f4596a58751fd5f155cda5c6d98e8a3976612e9a0ef9c0790f4ebc65e', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 42808, hash: 'd4bb31edb2c264c22b09af3fa131340f19ea7b6433b91167cc06066b57fa0476', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 33434, hash: 'd4c007defaa9e5b900da273865c208c36c7514d5dfff0b71c79fa50f3662f813', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 34275, hash: 'e37b6344dbf22a37cab48f0f299bdd847a5cd68aef26d2705201894f68371cd3', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 30831, hash: '6d40400b923897ba87efe1a53bd49d21b9d09683564c68c9ea7604485df890df', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 30864, hash: '246c1935e844a24dbbe098799ad413d5133229d472dc1a7551a7771bed342dfc', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 34864, hash: 'c9da9a66642462545ded4e892e40d22ab642dd78fe5b6bf87a557290b007850f', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 24270, hash: 'dd4ff3c1958af72339cae4c314e2f7e8d004061100f3a12a0bf0f5405c34ac4e', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 38705, hash: '1844d8c69fd3b527f6dc138a1cb3ba98305e6f86ce4dc620b6fe96a9dd5138dc', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 31560, hash: 'b6ebbe78891dba16be82d3546814560e6285f389eb2aa938c567805bc6ff07eb', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 31006, hash: '8f66f86159d9eb261c2911251a3d2ccf096f8eef6f300956119e06100f8cdec8', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 36170, hash: '30ed67eb5c995a4b275d75b16fbc374a1839325737e6d0460d05e7c3d1e65a43', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 40222, hash: '95d1f63b718022a71cdad522a91c5fdc7a878133abb5526c8d255d7a3c88b76e', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 50921, hash: '2e9a182e98fee7ef1b7dbabdf36e3c4ef4d7bf18cdb442c8bf4fbd3148abe76d', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'file-editor/index.html': {size: 40312, hash: 'a008e84e2a44549d54b101fe728dd3375782f9a360247418d790cebf755b950c', text: () => import('./assets-chunks/file-editor_index_html.mjs').then(m => m.default)},
    'styles-ZZB5FV3S.css': {size: 9528, hash: '3l+z/03bYiA', text: () => import('./assets-chunks/styles-ZZB5FV3S_css.mjs').then(m => m.default)}
  },
};
