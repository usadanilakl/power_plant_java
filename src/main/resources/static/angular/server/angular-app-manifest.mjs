
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/angular/browser/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "redirectTo": "/angular/browser/home",
    "route": "/angular/browser"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/home"
  },
  {
    "renderMode": 2,
    "redirectTo": "/angular/browser/file/edit",
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
    "route": "/angular/browser/loto/loto-points-active"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/loto/loto-boxes"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/loto/loto-boxes-grid"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/loto/locks"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/loto/esp-devices"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/loto-standard"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/loto-builder"
  },
  {
    "renderMode": 2,
    "redirectTo": "/angular/browser/loto-points/table",
    "route": "/angular/browser/loto-points"
  },
  {
    "renderMode": 1,
    "route": "/angular/browser/loto-points/table"
  },
  {
    "renderMode": 1,
    "route": "/angular/browser/loto-points/*"
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
    "route": "/angular/browser/form-designer/preview"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/form-designer/design"
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
    "route": "/angular/browser/admin"
  },
  {
    "renderMode": 1,
    "route": "/angular/browser/sync"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/sync-test"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 25137, hash: '201177e4b45de92df6b678a350c812f28d043ed2e79e1de07f3755b60751e745', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17254, hash: '2a6628244ce6c8b408bc8a452e261920b31f189b16b94ba6f7add7834fa18117', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'home/index.html': {size: 111579, hash: '23199fde21797b1b3e5d91c8fbf4914b58a4f49f35a2e838b6669a98c86764ac', text: () => import('./assets-chunks/home_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 207853, hash: '94d3cdbb9db61abbbb2d94decaf6f59e55c29ac5cebb1277de66ee2768d4bdb2', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 3567401, hash: 'd88f2577c57b7b0166621ef8bf65bec0e78c00c6078bf259e0169c2fd73bb8b2', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes-grid/index.html': {size: 118602, hash: '51e424a203c58150edabf87ac5d81d1aed4f9616d33e4207d0d49d9088a77721', text: () => import('./assets-chunks/loto_loto-boxes-grid_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 106901, hash: '5a8f23206dcbae524c43af4be14308939666e57f03f9fe88f7ca21081a5e5ea6', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/esp-devices/index.html': {size: 108116, hash: '5cb055cadf26e5466215da39c240e938db5a9e9b55225a69e29cdec6b256961c', text: () => import('./assets-chunks/loto_esp-devices_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 106338, hash: 'f577b67d5a4b373f50ea4267ef297aefce39be7dfc47be338197588b63a1010f', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 3655640, hash: '42ce0db55c13959776e03490430f2d4c8722904653ac4288b09b38927c453d05', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 99144, hash: 'df274de655ac6249adf994d88c3c461a26bfe77c322d33bb472cee8e9834d0ae', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 3626958, hash: '90d0f552cf18808fc53f080a7313bc56a537f5d99104a835c1f7926f5627675e', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 687170, hash: 'e5a716fde024f63d0686f4d3ca86d7d283c216dd6cbf89f32f40f004f56bd189', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'loto-builder/index.html': {size: 3724395, hash: '1d92e3b4278b944ae50fb18d908703aae01b847b550a33446606f168d28b9b75', text: () => import('./assets-chunks/loto-builder_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 243621, hash: 'f3d7e8a665c6dbe9cac72c28dc0ea0a2f4f8428c3e84f9fc4020d8cb7e5977bc', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 377335, hash: '2473f678c2edf560483fe673a89644ea6f012cf35610fa73e827cb54c0c9ffb3', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 102033, hash: '4531cf11d9eca0851d5cd5252e33a0da8160944d01b42f0e02cafeb22ba5fc92', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 583923, hash: 'f38e341634ea5cbffd44662984af149b6174602c26f60f869f547ecd4e944da8', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 690697, hash: 'a416ba4c0fda738eb35d81755b91a16b367069a2b879474f93c32e57684f8822', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'form-designer/preview/index.html': {size: 1325621, hash: '3db08fb6a1d2b01a9078e123eec27d1dc51470d7d69073913a34b2802114c8fd', text: () => import('./assets-chunks/form-designer_preview_index_html.mjs').then(m => m.default)},
    'loto-standard/index.html': {size: 7052491, hash: 'ede91d5e1d75841527fa5a0b3ceaecb3b91d0b35496a65d178244d128502815f', text: () => import('./assets-chunks/loto-standard_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 706731, hash: 'de949d406eec1a25d57d0ac9e7502dc456bcd6c7bca24e68fbc4485dbe109d98', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 59056, hash: '318469594eafb51f4ce4dcf99e4f1c842aa41324dd502cd65a34f72ce63a2d6d', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 67154, hash: 'f35652a96c3483592411efa6f4750bf32447f9dbe57a5dbb03aa70bd7ec35dca', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'admin/index.html': {size: 67677, hash: 'febc0257da4bf4cd402879bb2bca5de3c2ea80d71bdcf39af1e19dcf6d6294aa', text: () => import('./assets-chunks/admin_index_html.mjs').then(m => m.default)},
    'sync-test/index.html': {size: 71315, hash: '66467a21d9775723bd557071f565869801f263d0bcdb57d561157a7427220482', text: () => import('./assets-chunks/sync-test_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 3563708, hash: 'fa5a45de860d6ee02101afbd37b188326d873da086f334343c4e1685637e0c60', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 3631292, hash: 'b1b3682bacae9593ebcbfb0c2977a70b89555c48532e026658a007e6811321ef', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 1443249, hash: 'e3bee76bbd9e3cb47a68f5b819b369b39fa078e26af4a981f7def1f40904418c', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'styles-7VYHPHOB.css': {size: 28858, hash: 'm4VI6V+Txag', text: () => import('./assets-chunks/styles-7VYHPHOB_css.mjs').then(m => m.default)}
  },
};
