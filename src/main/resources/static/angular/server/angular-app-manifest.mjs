
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
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 23674, hash: '4c0aff567b3037e885931214371284fa86698e7b19f692f1968e2b794e9d370a', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17152, hash: 'd58f4376cdf218b7d5f75518000d9cf0f7a2b9b22aa31df561f0e05fee2e9756', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 42678, hash: '3b811014d7c73d513b77aebeb8ddcd02d3d32690860742e42e5b76e956912cfe', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 33434, hash: '459ce0b639f3255d32466953053cc207536a961aa6a2b9ece4ffb3775afd9791', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 34864, hash: '57ad6e43cfd031233007d512c375a562ead4d614366422542f0eccc5833990cf', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 30864, hash: '0c8d54202fac7429b8ec26d07b92955e741333647ad194b493266596f0d1f0b8', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 30839, hash: 'c63101fbed3a5fb65aa1a84dc7e2c5c6002ec7d2494528d3e7e45c4c9d02cb50', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 38574, hash: '8ec77046af3e687123c4afbed8e491f9793e7716fd4b616bb6743aff2e87ce82', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 24270, hash: 'e3a2be0938098834c765ca22f48484564641f52b4880d955bb6687f3ded588b2', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 31565, hash: '0edb2f352bf0714fd95cdd844a64741b6b28e269dfaaefbb1f22365f8d6e8891', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 30879, hash: 'ef411e0080077bf36f46c68e8fb9885ad0d5eee467ecba5643b22595ef5a2196', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 34275, hash: 'dd922d36e59a553ede59b4db931304c008b256937f90f8be27da4193adff7165', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 50797, hash: 'af9ead683edf1ba7b213db9a6ccb4650a64155bbfcfdb31fccbd7efce6f4229c', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'file-editor/index.html': {size: 40317, hash: '20f16ec443d326067d22bdafe5b856a3720458d7d2276d76bb7a8d73352a85cd', text: () => import('./assets-chunks/file-editor_index_html.mjs').then(m => m.default)},
    'styles-ZZB5FV3S.css': {size: 9528, hash: '3l+z/03bYiA', text: () => import('./assets-chunks/styles-ZZB5FV3S_css.mjs').then(m => m.default)}
  },
};
