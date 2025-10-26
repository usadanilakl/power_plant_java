
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
    'index.csr.html': {size: 23793, hash: '1ff65c608862e727dc76d4fb7167e632bc07d42597c5ffee619c69cb2296b8e5', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17152, hash: '7d68a49252b7116e8d9638df40e41a453e208e8a78ffed4f19376dad3754e6c7', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 46647, hash: '5cb0dcf90bbae0840159e38e482cbfa4a559203c1bbda049b75cef1befbf7180', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 49636, hash: 'afd9e51d046f58d7f46d2c81d041c81cb5535ec1981dbf06eb6ebadc5e70525a', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 43743, hash: 'c5dd94e0e0ba81fc78f62cf4436b948338ff0970eebeb00b8af8ba25bedaab4c', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 44321, hash: '04a9d025181b9ed383eb7b4c06cd4bb55bbc273559e5e75a8a9ca384159dca2c', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 39884, hash: 'fec8935a0beaaae4a7d6c31769e61c5c793e2ec74b3766f4569935ad2a9c075b', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 39847, hash: '1f68514ad364ce21ec1161dd848301afb5a4080d2e0edeedbb1411b5cc3f5d42', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 34623, hash: 'b7fe9fc953f4297e8f775bf8f2051baa04c68e74be63364a4bd1afb1b47f7233', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 24636, hash: '9f30c1aa300a745f032483a988f727c9062da0ee224a31170465dd04ba683018', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 42397, hash: '9e1735b3aa72077c3ea7742adafd0055e40a9e1246790ce434368970393b6b7b', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'loto/loto-standard/index.html': {size: 47931, hash: '34c172177035af2ac2837d85e91b8d87568e365f682e875cfcb7c69c01dbe624', text: () => import('./assets-chunks/loto_loto-standard_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 33140, hash: '2bcb3cbb29549bf21db0c5b35c130805580be6bceefad04092df825fb25b80bf', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 31651, hash: 'c0252cd4483a94b50222e9ac72de57f94a59fdb23fbb29efb7d1b20359917374', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 49957, hash: '5694ab93ae780da82a64e56a16f3c87cf45d2893321eaa48e2a371b553d33dea', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 52271, hash: '6c52150c62e9f9fb49bac4e2bc4333109f213f68a2a7cbb46a5db341c6a6a56f', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 42256, hash: 'd7282cb90ceb4c5b97fb3bef2324e7f6cc1666551f9f59e3c3a69ab879cfd301', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 42687, hash: '940d0ffcc6dc4bbfbbfaa9be4a9dc35b3b5b014008e06a00c76a9ea572760fa6', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 42649, hash: 'ba3b678c53ce64a1a4f2385f1ccc458c24352ccfb52ba720bcc5f8bd70440c35', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 36844, hash: 'b0cdcee3cad29e3701eba46020f6cad8dd7038f26916a601ce9bb5336a1c59ca', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 42979, hash: 'df46ba38d0a119ad2b641c575b15641f3dd3b43dd6608063483b216dc2355af7', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 39502, hash: '74ceb0b450fef1b5d0a6b220cd3f450db8715dfcc6d07482504db3216c7bfb44', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'form-designer/perview/index.html': {size: 40904, hash: 'a272292fba58e68c7a9ab1576cff1a55773b3e0d12cc5c263ce9b573af877bca', text: () => import('./assets-chunks/form-designer_perview_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 57602, hash: 'c7e24ddb1e4391f01404746506653d6a23addb44a95a1bdc58b46d6d38728fc3', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 55522, hash: 'de36d2684916a0e55af4e7702f776c0e6b3678a8ce1cf2465899729867ed971e', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'styles-TNAVY2DP.css': {size: 10047, hash: 'OPTPw42CT58', text: () => import('./assets-chunks/styles-TNAVY2DP_css.mjs').then(m => m.default)}
  },
};
