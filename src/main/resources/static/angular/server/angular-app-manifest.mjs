
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
    'index.csr.html': {size: 23674, hash: 'bc615c55389564ca1d2c989c03b32c9d3479aa62235ad2a1181a7e95cb5e5974', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17152, hash: '48b5a7aff5585e7cd2a1812e0846bbe071c70076c923dde8c5b58faee3abb7b1', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 33533, hash: 'bbc74ccd1b9d5631ef71830575bd73f0a7144168e7276c761bd682e0e15b1a1e', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 43801, hash: '4b348fec8dc9e8eea6996792a29a18aedf26e92eb7f840e5ef15c397f8e3e189', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 34953, hash: '46435707c52bf9a7e2942b3c2c97b5785c8f7c0e78def7bddcbcdef0baba0e53', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 34374, hash: '2f6963b2329e63487c8f1c95239a624c886797b0f070c5573c4bb34a3dd9c774', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 30971, hash: 'b201b0b34adc7d565c80885ddc31dc81b429d423b2f84d8131c4856d4d16d06f', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 30930, hash: '2b03563625f06bf878a8972769c98458103abc2bac300c4440b3cf0ef28a778c', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 24270, hash: '375ef5649c42d7e562b4f31247e9f1b5f6728a8d9fe42d983af414f3a33217dd', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 38802, hash: 'a6fb08815177d647be4969ace893105f1c622f220fe3f436e49c31d5fe000d9f', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 31665, hash: 'ecc64888879004bc02a57bf627981765efcd5c1d51edecad0027a729f06a070d', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 51772, hash: 'be246ca844be35bd46926b8c791753b23eac8a151018e066955e581029a0b94d', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 31007, hash: 'b898223cd34aa700e66eadfb9c902ced8926b0a2d7c4a135ca48b54a10fb8abf', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 36165, hash: 'b4567f8804cd8ce19ff3e9239315c4c002fa3f8c0e76b723abe1435c9e85da57', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 40322, hash: 'b7116c99e08889128b26299e6aaea9c7b1359e65ea4b59bed8ab469906f4cba7', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'file-editor/index.html': {size: 41148, hash: 'b31dbebeaa85ad56713848b3515bc9112765090314bcedacca1202b53255e1fe', text: () => import('./assets-chunks/file-editor_index_html.mjs').then(m => m.default)},
    'styles-ZZB5FV3S.css': {size: 9528, hash: '3l+z/03bYiA', text: () => import('./assets-chunks/styles-ZZB5FV3S_css.mjs').then(m => m.default)}
  },
};
