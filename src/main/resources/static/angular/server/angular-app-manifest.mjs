
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
    "route": "/angular/browser/permit-builder/safe-works"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/permit-builder/hot-works"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/permit-builder/confined-spaces"
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
  },
  {
    "renderMode": 2,
    "redirectTo": "/angular/browser/form-designer/forms",
    "route": "/angular/browser/form-designer"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/form-designer/forms"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/form-designer/perview"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/form-designer/design"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 23674, hash: '126aac9e556491a5e86d3ec1b1579dbfb6a96e0135a99cbf64d4ae5cae9ecce2', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17152, hash: '58e0f72dbaa0a6349c966339b09624f7691e8f0294dbdf34125b86492170649b', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 46280, hash: '6c0d65ea1cf8a44d131a9a887d0bfa1a674fae31c4c4a031239721a48008fcef', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 49033, hash: '870a9468ec7dca1fbd5ad256f57c572ef318528df8d0af69f830b8ab83c28be8', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 43317, hash: 'b5c06660176b56cf66e1bb26478fb2d0c608233c6ed24b7f29d70fdb094287ff', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 43893, hash: '3c4137e6c02d138738e03c87317bab942712d6ff1b4fc0b582d1527cfd4d57f6', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 39518, hash: '0c1caaa50a6492eeac6deb4403a99aea0c92687ffa6853f74bf03ce826c64dd9', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 39481, hash: 'f312b7475317e3fc3d2f728d28ee5405f1c0b08900c99a3ee607402c9972e190', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 41970, hash: 'c5dcb808f119c803c70f6bf9004fea3de51c9fc3c304b5c3e753a0dde511dd55', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 34257, hash: 'dc75b263089466bde10b699115971c703bc6679eb509519151760afcd936a768', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 31285, hash: 'a2ef4212343b4a9ed2db56a49a6296c39fc7eb492f17a4ff113e0ac9cd526aa6', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 24270, hash: 'ba000d72e9c32f3c4c0fb23340a305a87a4990c6328210da3663994a44aa85e2', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'loto/loto-standard/index.html': {size: 47564, hash: '37f1061333a3cfee7a24d5990f9639b0e1af2ca2a3582a8b080156898ceda7d9', text: () => import('./assets-chunks/loto_loto-standard_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 32774, hash: '52b8f935562568ec4337e41cf711e28da0a5ac5f78440f37c5d6c048a107f903', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 57235, hash: '96f69a4aac58a7bc7f55b93a6dd9aa0cc228581f5cb908ad75fdb8c9af685d5e', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 49599, hash: '55ef64a667c5f95a21aa998cf44c4d95f368c070191122db55b782e1c122559f', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 42278, hash: '22f4b4b2fef64fc320debef987f7249d132dc3c0407dbba5a65c5d985e8f46ba', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 43596, hash: '74b2608023b8e748651ff9cbf3c3b9c704fe64d15a81dc1b549b1518d4afade8', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 41904, hash: '5a2d28d4489428cddf13dd4f0dda4a4bbd1f054404be3a3553b9f004aa423e24', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 42326, hash: 'c52a4d03a19b9468060d26298c9eea12ef3506db719e83d9bdfbe95ab0600120', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 36478, hash: 'f569ff81ef39d0caed938ed8b3f89585a29dac7774363a16673a8bbdbfb489f3', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 42609, hash: 'c4edb2d65b56c5c7c0e6af68fe7a57b175744080f2f1ece70d35ee221ae00292', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 39136, hash: '5c73b2e611e416d1bb1b31c1e97e1e190ec68349afaf22e4416ac62ade3791bd', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'form-designer/perview/index.html': {size: 41072, hash: '4ef984312e059aec29b2526001dcc9389ef1c1a38d5ecbc542b5d3790375c234', text: () => import('./assets-chunks/form-designer_perview_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 55156, hash: '914c84578a0d314a8c80dbe3a9fd3b89ca2501ba34014f88aedbaeedce94c319', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'styles-WVLSSJOW.css': {size: 9627, hash: 'm5kLIVbtCdo', text: () => import('./assets-chunks/styles-WVLSSJOW_css.mjs').then(m => m.default)}
  },
};
