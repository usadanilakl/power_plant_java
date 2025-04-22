
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/angular/browser/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "route": "/angular/browser"
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
    "route": "/angular/browser/pid"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/print"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 730, hash: '01a8220f20b36e2512e7d87ab897704e1c4f755f5cafee966883c34b8e7a7674', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1021, hash: 'cd51c691ee20dbc1b21aeae3274aea2a6141f0561d20322a8f2ecc5b5acb24f7', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 9045, hash: '96adc1f05fe4acada77944e2447adb4571566181b46962715eaab4c50ab00b6b', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'index.html': {size: 5773, hash: '6f8a952c58b87290b378a501c31e44a746b5967b79e6552b3cedf76d903be9e5', text: () => import('./assets-chunks/index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 7401, hash: 'd12a5de29dd7f3941656042b9211230faf4bd2fc7a3e02a46bfd2de3954fe5ab', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 9033, hash: '14c1520ad4b6a0b26d4ddf21619bae7ae071efa276dbd28feb5bf783be758003', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 8031, hash: '2a26385d2f9f3c3f818f9186438d4baa7e938fc526c5677a2d9df0aefb58d040', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 7368, hash: '5155dff0d344f75a84fc46f53bd2548dba33b8f77c2213101a04de6032bb07e6', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 3831, hash: '42ae59a126e6dc1778f23f0c63538b65ff072257eeafcb5751165990917cf122', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 9131, hash: '8a1614d5c1a106d9a9f38cac394520d8736d1fc178bdc877d2ac4147da5880ca', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 9154, hash: 'f1e35f19c7b40fef9c2b7dba4d14e42afe262367ab116d1facc9b5dfdcf57ee9', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'pid/index.html': {size: 7361, hash: '0f8c77741b300ee28f56dcbf6fe9fe748c15119257f183593c8f817c81baa7bd', text: () => import('./assets-chunks/pid_index_html.mjs').then(m => m.default)},
    'styles-SE6UKMVB.css': {size: 2550, hash: 'HQgC9XG/u4M', text: () => import('./assets-chunks/styles-SE6UKMVB_css.mjs').then(m => m.default)}
  },
};
