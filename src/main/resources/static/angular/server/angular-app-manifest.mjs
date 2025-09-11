
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
    "redirectTo": "/angular/browser/permit-builder/jobs",
    "route": "/angular/browser/permit-builder"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/permit-builder/jobs"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/permit-builder/work-requests"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/permit-builder/daily-packages"
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
    'index.csr.html': {size: 23674, hash: 'bb0cf5e8736382229c68163066d27cef4d3f02a01ecdea712d810174304d036c', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17152, hash: 'f4bcc5aecff3f22227e6e0c9e8ce4ee2df27c5cd50b277c4fdda6de8366839c3', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 46674, hash: '5421bf1d912e7af346c6649347fb4ac2f2c49453287a60b0f1f62208b42eefc4', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto-standard/index.html': {size: 47425, hash: '8e06699de655cf9b99428794ff03deb8a72c24dda4ad7fd94122b39745746c7a', text: () => import('./assets-chunks/loto_loto-standard_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 43082, hash: 'bb35640b3072e5c1a7b40a0da89263949a235dd2091768668f38212f10cb7586', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 43657, hash: '6431d3c2a8a8d2a361df36264aad5a45f350ed6d3c2c0f0b7c07892a0d235060', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 48894, hash: '290ca68eeff34431ea390fc545b5818f2f4b3326541153c9f2a539b59bf0832b', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 39341, hash: '77cbfc4d4c136a8fe969f69981b9bec2271757d8a22a508a34eef5ec847e9573', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 39379, hash: 'c64ad5516b89dbe114cd4e814aa3a82b37b79e1c9a5724e76fdad063bb1e2866', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 24270, hash: '0ca270be74e7e45867e2997d3889dd7d09401cb37af975dceb9decb074788333', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 41733, hash: '7bf7a26430f371349f5745cff54e030bf50a5be2b7722f52408ce149130eacda', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 34155, hash: '562cf6468959c6d72de37e71dd38421d2b922d20702a4b6d8f0f7318aca5b0ff', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 32281, hash: '28a277081e9c721cc3adc393fd935c7dfd88a739b733d25a4ac3c712a1d5fc0b', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 31146, hash: '7910caf32141f1e6b1134bb8af181bf71b84b7c65f0b07db824f6f9de68989ac', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 46220, hash: 'bc8bd612db85f40a4d78be8c1558f40a5cb59cfa24ec4d8c01914e8091022d03', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 40276, hash: 'ebddf090251db7ac0af1c2f4d95461b60fb60de853d128ddcbb62f422993e4d9', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 36339, hash: 'f9b3e3e1ccb82e24f8b4761ab13beb9c269e97fa58a7e712eadb151019c84acd', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 56977, hash: '14e6e1c39bb90fa3b0d4b18d84f48fcfa9e6843109eda6dc0efddb6c5f8c97ea', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 43002, hash: '6ebbecf7618b48938e72ea242c776c8446b7f2d142239731a1b9fc38eb25dc1a', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'styles-WVLSSJOW.css': {size: 9627, hash: 'm5kLIVbtCdo', text: () => import('./assets-chunks/styles-WVLSSJOW_css.mjs').then(m => m.default)}
  },
};
