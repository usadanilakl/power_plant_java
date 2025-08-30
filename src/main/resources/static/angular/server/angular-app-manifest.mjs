
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
    'index.csr.html': {size: 23674, hash: 'd751ab2c35f0f0fd1157fbf4df62c10e12d6db6f855929216dce9fd02758a49f', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17152, hash: 'e28fbda554df87259ff2b8ab3f32765173cad3d81c1940d8369e7dc2f1265b8f', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'loto/loto-standard/index.html': {size: 37520, hash: '954a274ccba0e15d17c9f8dd5912fa6acd1e803442e953f0be95cadace213b5e', text: () => import('./assets-chunks/loto_loto-standard_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 37502, hash: '5dadb5688922ffa723602f71b4f20ad619c2d3257b4d39b9b7e9d88e3be0a9b5', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 46501, hash: '4e2c313c549f79db86ee5821e20ae87b491dfd76e6995e2da09db3ab4b642e16', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 42943, hash: 'e8deb05c7e1679d1a1fa15dac15aa1002c457d9515631f3a5d7473a6eb51f2dc', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 39275, hash: '5aabe772ac2f77cf402df18a7a22ff3588d1f43483622f1516c893eb20e91f0e', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 39240, hash: '5b6ff438238980ba8df633013e21135358b301a98e607cffd8867403cf1c1b07', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 43523, hash: '383b34cd514c2db6a59f40bb560fb7942ce4520d66ff198e9ff4b8ca7d1fbe99', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 24270, hash: 'c512a1a4d9f838da9311aee8d1134768b03e4d3e279f0955b34e4401375430e7', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 41562, hash: '4a2f553fc0e1222683f6ae5601129f9891abca8e517b532ab48f776d5f08450d', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 34126, hash: '51df9e3b4b162ed78e0235a6ed0f2d2a4b0f23fd54e427f3172c382322aa8dda', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 31006, hash: 'ee0fe3232e149112feaee4d6c8b0ddf42fccc62bd11d95f315015f0cd721cf4c', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 36199, hash: 'fa514d72cb0fc5ee458fe614e2bfc2ebdfd5f5a3bc4947cdfdf34af4703f6713', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 42833, hash: '8e2c4485ca5fb801838f75039e92a9bba9cf8873a336a8b7f0d2c8f369c323e2', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'file-editor/index.html': {size: 46010, hash: 'a8562a3e92a44a4add7eddea25e64ebc7c2ff6061c877eb07f2ba90a4efb8083', text: () => import('./assets-chunks/file-editor_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 56804, hash: 'f04fbd2ff7667f65372c11165fe95d1c80c1e8d9493946e0c782db629752a177', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'styles-WVLSSJOW.css': {size: 9627, hash: 'm5kLIVbtCdo', text: () => import('./assets-chunks/styles-WVLSSJOW_css.mjs').then(m => m.default)}
  },
};
