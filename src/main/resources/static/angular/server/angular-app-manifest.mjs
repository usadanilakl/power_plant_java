
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
    "route": "/angular/browser/loto"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/tag-number"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/pid"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 730, hash: '879e4fa8ad992b8abb980d3c9e9fae3c7a04d348ef88b6c26cfd78813bda198e', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1021, hash: '3e71da12c754145e222648f51773806433171c915960082037413c39b046ffa7', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'loto/index.html': {size: 3378, hash: 'c3e4233db63258e869afd3af64b3ee05cc383a710721cc41fc85be9bae14154a', text: () => import('./assets-chunks/loto_index_html.mjs').then(m => m.default)},
    'index.html': {size: 4707, hash: '8bf2c4d4bbc21288ff84f6f6e08460ac292216456db6e2d7a5bb5cacd6b30570', text: () => import('./assets-chunks/index_html.mjs').then(m => m.default)},
    'pid/index.html': {size: 8317, hash: 'd4a081422b03c34e55d2717897b7ce38336232464f952282b96e1f939740f184', text: () => import('./assets-chunks/pid_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 8280, hash: '5edb7e93f69ad3a9a820818df15774e68790f8c44ea3764e56927397e3d069e5', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'styles-JKAGC53I.css': {size: 364, hash: 'VECtiBfngJY', text: () => import('./assets-chunks/styles-JKAGC53I_css.mjs').then(m => m.default)}
  },
};
