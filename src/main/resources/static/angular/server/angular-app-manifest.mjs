
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
    'index.csr.html': {size: 23674, hash: '872c35c8ceb1af89aca630665706dd8437f43f45d9dc9fcf0e0f67b6604bd1d5', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17152, hash: '9048c8f4aaf7c92d721140b025141f4c7645d4ebae0203cbcbaea8be4f319f39', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 42678, hash: '02b9d1dc65eda8861d84010a116ad5e054b46162988e05c5b9431ddb56969261', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 33434, hash: '31782c39ae9cbc0cfda88f2294cdf7f8121ebe48e343376078a79046bf439ea0', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 34284, hash: 'bb4db50720f58777ca863cb4931b6e9b859a15e0cafb4dafe1a6528cf29c5c6a', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 30864, hash: 'e23c120d7e55c54b3e6c8bb6b8b97bdb3cb4e92c6ce7fff2c79d0e5999e3de1b', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 30839, hash: '3f5ecdea8656542d42fa40f092210b8e7ef921bdb1f93d81a455619743b7f1e9', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 38574, hash: '9ba53797c163df0844f73274537e00e7c30e2c477035facb27b10c023edef686', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 24270, hash: '4b5a7eee423d703c1f1ea03e6ce44fa63803fd594163c3217974eaf294aabff6', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 31565, hash: 'a8b734b6ce03697c0b91eb83ecf76ebad82d02f4c45d390a4862e8d04500f4fd', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 30879, hash: 'c8744d9f8cae3a43d14a9e1b12ad92cf06110abf9c735f15e9e43c91e34a7a67', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 34854, hash: '4eee565e973e06fb13de270269087860f3e71362a8cb7c0d460348ee8c5b8b94', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 50791, hash: '916c2c2c1b55c2280e5857ee2331c3408f761c2cc953abc0d40101d195d77362', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'file-editor/index.html': {size: 40311, hash: 'fd3bb469c8bec4fb11dc87f5e42732cdb68317fdba6da40b5e4763d5df6aea88', text: () => import('./assets-chunks/file-editor_index_html.mjs').then(m => m.default)},
    'styles-ZZB5FV3S.css': {size: 9528, hash: '3l+z/03bYiA', text: () => import('./assets-chunks/styles-ZZB5FV3S_css.mjs').then(m => m.default)}
  },
};
