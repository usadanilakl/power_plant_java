
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
    'index.csr.html': {size: 23793, hash: '3d340a88731779abbd7341c863d03368abf67fe65598e406ae628aaea3ea9594', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17152, hash: '2a549416d304276c892592a40e23786f0bdbc881798c3ec49d004e6dbdd8f8b3', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 82498, hash: 'f50cfb8fc222e99592ade85e0369d2b19ab761cd2288bc9a5fe405ac405d8cbd', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-standard/index.html': {size: 86333, hash: 'a04d0eb08926f487952d34e4ccc2bc4454616ef9aadb80c3d2553a49df313571', text: () => import('./assets-chunks/loto_loto-standard_index_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 767336, hash: '9eb04063c24a4e9b996c5c1f1cc61cc268a4cb172e8ec6a0b2067bd01a6918e2', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 40176, hash: 'f230586fcf5d2b7d134eae1a974df318b2da2f4e5e61f94d0355070da397cebe', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 39611, hash: 'bd35056aa93f57fb34d2b325d18c5160e4059fe49325af86c5d2ebc586c2dcf9', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 461565, hash: 'a7182b9bb502aecbfd175dd4ebc17954827f6c37fccbee80bcbdb10a1c940eeb', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 3442562, hash: 'daf41a5c84dafb4aa2e913fe640edc0dab3153bc913d62499223691c7e3cefbc', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 24636, hash: '74bc5e14184e778465cda222c26d50395663a32a9ba7550bb666e1ab1af56fb4', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 445092, hash: '08551d624959cbef54b84e469ca33b8a96f8ec80dff6265a9a3961fbd8a10758', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 32971, hash: 'ea8122aaef7a4a1e438676a1e2ec65ddac31da24e792ab1ebd714c48182f89ea', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 32666, hash: 'd6d78daa32018266f307f35be86664e5dc89bbee336fa72b31f5917ab8a409b0', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 77043, hash: '9674a16530ee75b6893f09f7dafb38cd84cff4f57644127bd9ec9030e086adb7', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 463000, hash: '70c1e81e4479f25d2fd2b66d924390301ef632f42039565795eb182dcc06c64b', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 450977, hash: '47e7444a6bd0197a260997bdbcaf9bceba1a1afeb93494084e0adff9ed59cb4e', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 868918, hash: 'e3a6f6dda8046e979491850522c4339a134b71e7448bb2d70702659e283643a4', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 35722, hash: 'e5b98cca86a00158140e12b2c0e7893279765f910aee810b7177ffac5d5199fe', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 634813, hash: 'bfc37bbd08f6b8239c365f2b4d4527999dd3f85dfcb1d97340a8ea2038d91e55', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 556932, hash: '2ea2833f8eac790dc6ad15730b8a4ac0d00b56f3824ea15043bb68ea4509af71', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'form-designer/perview/index.html': {size: 926791, hash: '521e0707073a116bb1e87d73c174d0f960cb6483af62aa9bb8f0ea6f5872b4cd', text: () => import('./assets-chunks/form-designer_perview_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 572953, hash: '19a4c50d11a2f5f5f8f66c4a2b48bd1d6ef574f50d255e41f9cca8bae9e1969b', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 481408, hash: 'ac063c4a6d7a80b45d2dde09dd8327e27aa733e5320d91a4229ba0bf812d0ed0', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 584114, hash: 'c1fe7bc4521c01181a34e1e121085dfd16732bc30d906af2f53d9bb112e13198', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 441939, hash: '2744d1361a232d06690c51997fb1c15fbd594cbd9726e72738734f34e45a70be', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'styles-TNAVY2DP.css': {size: 10047, hash: 'OPTPw42CT58', text: () => import('./assets-chunks/styles-TNAVY2DP_css.mjs').then(m => m.default)}
  },
};
