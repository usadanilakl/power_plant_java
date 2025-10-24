
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
    "redirectTo": "/angular/browser/permit-builder/daily-packages",
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
    "renderMode": 1,
    "route": "/angular/browser/permit-builder/daily-packages/re-issue/*"
  },
  {
    "renderMode": 1,
    "route": "/angular/browser/permit-builder/daily-packages/*"
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
    'index.csr.html': {size: 23793, hash: '6c041b7f13e45ca6137a9601146ff27c4cc1e317cacb2100bfba832a5d294b09', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17152, hash: '1befaff22c3009f3eccad4a5205eaddc41d0f809f22ae5b42fe20c28b6c2a6ef', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 46602, hash: '4ca458d5b67b8e14d5aeed5402f36b2b15d46823974f606499fcf94df14d6471', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto-standard/index.html': {size: 47893, hash: '2e4d597210f5623a28bfc1245c0cf5afd506036dfd7ce796e73ba97f4f8ebd80', text: () => import('./assets-chunks/loto_loto-standard_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 49591, hash: '2d8cd03cf9b49f4bd95e0bca3ca05079c5ecaea617aa9d178281604eecf0fd21', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 44280, hash: '7c701967cb12be2eb410f8ac2e3e57e87fa3902a78532ba80ca3b8f6737fbaf4', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 39835, hash: '92dde15966b8c4a9da3ca03bee2b4e81349d0c34a846cfee317289b2437e81f8', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 42350, hash: '39fcb1629fc162abeb4bf9cae5c5278a05c6e4cceb890de0deff78c72fa1615e', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 39806, hash: 'f49fe62d38943a302e0568cfdda3d18c6c0ee6ac5f7a67dc8d9f342d31ab251c', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 24591, hash: 'd19808546add63e161373df3aab96363f4599457cf984093032a94581c0857c3', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 34578, hash: '61cd4c9618e10e5d5591912d58de7fca73a571719a7d501fc56bcf4c0807e3ea', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 33095, hash: '8aaf95f30bfdfabe4e05d0ec19028e20dc824e4c4795d565e21705d524ffab0a', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 31606, hash: '803878d05427a12321e869664ba5936f6a73d2b53dd957e3363a02d915a4967f', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 49914, hash: '3b8597f6dfa698cbc28ec40856fad575eae6b413b588ace7f9be859508d1cac6', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 51352, hash: '59839c91cebb5a3af12b97d2940ed42c92abc5a85870d6cbe5d150a303b7521f', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 42604, hash: 'd101ce56c8c406e6099b0b86c60f342d1961265da05815929fe8b18c2660b58b', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 57557, hash: '1a9f007cf5283b4866551f44580711ad4ba4dccc9569cbed0f90888f1cee6aa3', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 42640, hash: '0aaebeaa441df748688b8f6ef24e7b252d6903387409f4526917dad5b677bd31', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 42215, hash: 'd747853f0b09f5ce58f8bcf939632dcf50cad47e11068cebaf606080abd4b840', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 36799, hash: 'd7e4c5158e5c7e2eba2a171ecbc9eb82a4cad9f34e540353548bee754eece240', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 43692, hash: '6ecda1c86330303c9b9375bea15989186be5f3313bcc15bccec96680a64e490c', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 42932, hash: '0072682e3a6f0b1d49d169e72688e94560b3210bbc0f0a490948670e2c47c120', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 39457, hash: '218e61b0cb34f80f0039a583d3887b2471f08dc6e849a411b643b25bb97ad49d', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'form-designer/perview/index.html': {size: 40859, hash: '87bd54aa527df69944f42ef0f5dbfded3fe2f44cfe8663ce6d28fdd3c9ab2e7e', text: () => import('./assets-chunks/form-designer_perview_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 55478, hash: 'a6415c1a3b86b4c78e3bd62f2a52eca631edff56d18c7d3acac218db9b7f6890', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'styles-WMY3BGK6.css': {size: 10002, hash: 'y98nJx7Z66k', text: () => import('./assets-chunks/styles-WMY3BGK6_css.mjs').then(m => m.default)}
  },
};
