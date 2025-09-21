
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
    'index.csr.html': {size: 23674, hash: '0f4007599d37651ba71ca5328358dcf280aeaf3fd1ce447780e91e23d5442a18', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17152, hash: 'e075d662bf2ffae422fcfcc4ed208aeb88fc152f6a364e242d6f2a92228d03a6', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 46280, hash: 'a4f31e1bb3c0865b72e63b5d43abcc3c77f137da9442c3411fcce6d348ba9c16', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 49033, hash: '1b73a610fca150be9b333137008e62dc3b9573865e539341e664acf8a259ce23', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 43321, hash: '48f6c6825995be71f1d3d8c59ee561d609c4119361dee0a8990da995aab5b0cd', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 43897, hash: 'a564b7d8535c0fd7e6262b0c65dfec74384d08810182cf18720bd9e0a984e465', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 39518, hash: '97683a487ae112778509594f85c3f7eef70bc1215ef8e0ffffdea2ba94933fad', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 41974, hash: '2ae11c873190a4bce2048e32ae6062a630f32bfb96b8296a090ebf4cb113df5b', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 39481, hash: 'fcc4d0adb67bae7b707272ff8305381c4b68f7c171390fae3c7dba71bcc6c8c7', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto/loto-standard/index.html': {size: 47564, hash: '63f713aa2a2befb462727400acc054940839c4d6e83129930506df82f67f567b', text: () => import('./assets-chunks/loto_loto-standard_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 24270, hash: '478b68c6885430aa8b8abdd7d769b2e844555ebf1940d30dda2ca9f01c702361', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 34259, hash: '7742dd1b1a62c2664cbe6bc660363459110d5039a66017c1cc324617bf57ac79', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 32774, hash: 'c860913fdbe9646c75f5ac5bfd81a4128ee9ed0901034eea710cf68793b307b0', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 49599, hash: '20aadd9ba5a3139b29bde4990b4847cc61dd5805c9dd6d19c3393e19e32f1e14', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 31285, hash: 'ee8d81c71601d01d148e7668ad3f0599d83d5b3631e6810ce9c9f748671a28f6', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 57235, hash: 'b17f0acf6b546b6d42e968b9009e8e542599557b9e5a22c8b20405e8733ad9ff', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 43596, hash: '35a213f46e5645f5c83076b450d543cb7129c39e4265d47e28ce20885a0d5889', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 36478, hash: '4718faa99beeb25a304f297d1a666352c1bd4d22e61918ac380ead6b5df654e4', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 42280, hash: 'ccb7a368cb9c9831602a18d11c6fd0d4d3a0461effd4c76f8f0822c07903db19', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 42326, hash: '66118e1fa6aa52aee84e675fd0430e3b655eace33e8a954ea54fbdd407b65795', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 41900, hash: '6b615757f780cbe9210e93f3a50c7941ce207964931e0a4275e25902a56dc13d', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 39136, hash: 'f59ca50fdfeca44ec6834da8611884b4be31aab2cb0f5a4c6549811f79ef36e1', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'form-designer/perview/index.html': {size: 41072, hash: '174723b287d27d409c92adeb05ffe459564a6edab2dd1d23954be8fc3959289e', text: () => import('./assets-chunks/form-designer_perview_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 55156, hash: '06996492fb8c34d6d50a8d3996e901a0bba51d7ce78d705451c4171d2b790236', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 42611, hash: '358a9f2f9f541b2a417ebca762a423c5e29e1069f34d8038e58fd74df7185b92', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'styles-WVLSSJOW.css': {size: 9627, hash: 'm5kLIVbtCdo', text: () => import('./assets-chunks/styles-WVLSSJOW_css.mjs').then(m => m.default)}
  },
};
