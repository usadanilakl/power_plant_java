
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
    'index.csr.html': {size: 23674, hash: 'a115d53ca75bee06021b2c8a72686488f21ab6a607f213898630acf6e6009094', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17152, hash: 'cca776e3ca9877142b706ea89276392cd13c77c7418c9b47fcab7ad1defe1529', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 64505, hash: 'f751aab5fdcea39c15526bab470a8777e1068e310a563c6fa84a6ee69b135c8f', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 393402, hash: '86d804b9b0cbe4cad4239e7da866cedbd2ee81e55f829cfbbab34543ae4ab7e6', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 102864, hash: '3a8a938f52a9f42212ee4b5a72c5229c1081a2c6970cfbc97f7c48da07ab2d1c', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 31395, hash: 'aee54673a374d170aebc05fd8fb66f2b8743862455256ae9dd81136e03502122', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 30831, hash: '2dd8fb6360a4da3d25355da0ff729ac9b6ef3a16ec04a4ba2c28cf07999e91a3', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 56892, hash: '0831ec2a7a5fff2c3439dd07b46abc089d4a276309abf0b02c6e004346803178', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 24270, hash: '04f6b892ca5174a2e05ff9e4b2eec3a3333362066ed78cf4e1f25a47c2e63bdf', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 31894, hash: '09d5b3da8ec3c9c640dcbf4ff05c3137548df5c46643abd13a71ff0b72d688b5', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 109642, hash: '2536f43dcb82582d94c8d2018b32c73afbd1c125aa506580d30a290e0134e2dc', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'file-editor/index.html': {size: 73820, hash: 'a52e316c3fbbdd0ee6d491fb317c1258eb3c6cdef3c6a29047953f1c9c417e37', text: () => import('./assets-chunks/file-editor_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 357824, hash: 'f119531d9d8deffc056544e60d95a5c74be6270801886786598571aa19b81f29', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 410695, hash: '8df58aae2b5612f05fe7608d7e3cdfef741fd7ac13be84f03de02c7c96776a12', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'styles-ZZB5FV3S.css': {size: 9528, hash: '3l+z/03bYiA', text: () => import('./assets-chunks/styles-ZZB5FV3S_css.mjs').then(m => m.default)}
  },
};
