
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
    'index.csr.html': {size: 730, hash: 'ef508dd5b4165f9c9cb20e2099825790ccb4d627145cf63402c440fcd8fc9d47', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1021, hash: 'c9dbba1bd5a301413a04bee3cb088e694fc986ff1b31f5628716ba6d3ae88f1a', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'loto/index.html': {size: 3378, hash: '60345f20a879ea586ae2c26e08676c2451efc00cdf0ef52aaa2db1bf3cc6f51a', text: () => import('./assets-chunks/loto_index_html.mjs').then(m => m.default)},
    'index.html': {size: 3368, hash: 'fa2b930f5d798ae45ab6e13ab78a0259b7e9f7ac69ad44e9cbd2120387cfa89b', text: () => import('./assets-chunks/index_html.mjs').then(m => m.default)},
    'pid/index.html': {size: 7127, hash: '3efe61d5c5e3f3acbc375b384c5f3938a7b42e66d6c7a40ff386290a542f2487', text: () => import('./assets-chunks/pid_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 8341, hash: 'db40f33c5a6d6e566b3b107a3bf326daef03d66aa5637fd9f6ef654486492db6', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'styles-SE6UKMVB.css': {size: 2550, hash: 'HQgC9XG/u4M', text: () => import('./assets-chunks/styles-SE6UKMVB_css.mjs').then(m => m.default)}
  },
};
