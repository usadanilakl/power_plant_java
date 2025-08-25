
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
    'index.csr.html': {size: 23674, hash: '794a84bc79a5755bfa96bf74eba11ee72eb8fbf1371bbec853f2abafbb2c6e45', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17152, hash: '328e4fb56402fdf08a6e023c2334c36d9ba61ae91bff883ff902b1e444cb21ad', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 45929, hash: 'fd6c13c3c3905af02c811184635c89a97533506584c385c456cbaf3e982c8b57', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto-standard/index.html': {size: 55156, hash: 'ae38481f83751f1e4c03b03f80a1e5549894892fe876a1ed31396e32683d6cd8', text: () => import('./assets-chunks/loto_loto-standard_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 54634, hash: '71ceb20ed44c83583a636d9c1e63a35bd9263b9eb7981bcc7ee34d817eb401db', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 54258, hash: '530088526af33aadb8e307af8b8cc67e8d7eaf027368810fe5856dfa979560c9', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 54835, hash: '0ab587271cf198b4a0d367b8d4053ac197f58c140b5f6e03ea360d6acca4d172', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 52051, hash: '45f3bc2a0c4604515953980d2c74a4aeb9e4b1ee9303613f3599fa54c3c6fd87', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 41074, hash: '14c80e63e4ad2c3701d90f612a226529b04e1c893ea3c6385ea613c86644132d', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 24270, hash: 'a99c2ed774bc0b368d5cd52bd45e528427cf2fd184cc6021f89681c31015de99', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 33696, hash: '007f3104bf2a41a39df77346b81913b834329cb510f03c589da2e515dc29a1a4', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 56283, hash: '8348b37190e3f67ab4f0377e41c091775ad8bd5f69ae31130da206541915ffb6', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 31006, hash: '0f474e9e7925be7ba30bf581e4a1831dd65bb43491a7a0a05dca3f1780bfd9b2', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 36165, hash: '92172e8a4c2705e9ef2f32279b1772ef6efe523bf1b8bc0a4c4e7ddfb18c5ee5', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 42344, hash: 'fd5352b3a4f2d6bd7947330512ada642cf1186c1e2a157feb473ac0d2c389bac', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 52079, hash: 'e91dc9d96458c4bddbbc0481134f7a6ddeb19d77a250a1adf07120376803bb52', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'file-editor/index.html': {size: 45606, hash: '85f25eadc4e9990f6f74b6cac610563b7d4f27e0855e11d772b8152c3f380eaa', text: () => import('./assets-chunks/file-editor_index_html.mjs').then(m => m.default)},
    'styles-WVLSSJOW.css': {size: 9627, hash: 'm5kLIVbtCdo', text: () => import('./assets-chunks/styles-WVLSSJOW_css.mjs').then(m => m.default)}
  },
};
