
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: false,
  baseHref: '/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "redirectTo": "/home",
    "route": "/"
  },
  {
    "renderMode": 2,
    "route": "/home"
  },
  {
    "renderMode": 2,
    "redirectTo": "/file/edit",
    "route": "/file"
  },
  {
    "renderMode": 2,
    "route": "/file/edit"
  },
  {
    "renderMode": 2,
    "route": "/file/table"
  },
  {
    "renderMode": 2,
    "redirectTo": "/loto/loto",
    "route": "/loto"
  },
  {
    "renderMode": 2,
    "route": "/loto/loto"
  },
  {
    "renderMode": 2,
    "route": "/loto/loto-points-active"
  },
  {
    "renderMode": 2,
    "route": "/loto/loto-boxes"
  },
  {
    "renderMode": 2,
    "route": "/loto/loto-boxes-grid"
  },
  {
    "renderMode": 2,
    "route": "/loto/locks"
  },
  {
    "renderMode": 2,
    "route": "/loto/esp-devices"
  },
  {
    "renderMode": 2,
    "route": "/loto-standard"
  },
  {
    "renderMode": 2,
    "route": "/loto-builder"
  },
  {
    "renderMode": 2,
    "redirectTo": "/loto-points/table",
    "route": "/loto-points"
  },
  {
    "renderMode": 1,
    "route": "/loto-points/table"
  },
  {
    "renderMode": 1,
    "route": "/loto-points/*"
  },
  {
    "renderMode": 2,
    "redirectTo": "/permit-builder/daily-packages",
    "route": "/permit-builder"
  },
  {
    "renderMode": 2,
    "route": "/permit-builder/jobs"
  },
  {
    "renderMode": 2,
    "route": "/permit-builder/work-requests"
  },
  {
    "renderMode": 2,
    "route": "/permit-builder/daily-packages"
  },
  {
    "renderMode": 1,
    "route": "/permit-builder/daily-packages/re-issue/*"
  },
  {
    "renderMode": 1,
    "route": "/permit-builder/daily-packages/*"
  },
  {
    "renderMode": 2,
    "route": "/permit-builder/safe-works"
  },
  {
    "renderMode": 2,
    "route": "/permit-builder/hot-works"
  },
  {
    "renderMode": 2,
    "route": "/permit-builder/confined-spaces"
  },
  {
    "renderMode": 2,
    "redirectTo": "/scheduler/flow",
    "route": "/scheduler"
  },
  {
    "renderMode": 2,
    "route": "/scheduler/flow"
  },
  {
    "renderMode": 2,
    "route": "/scheduler/table"
  },
  {
    "renderMode": 2,
    "redirectTo": "/form-designer/forms",
    "route": "/form-designer"
  },
  {
    "renderMode": 2,
    "route": "/form-designer/forms"
  },
  {
    "renderMode": 2,
    "route": "/form-designer/preview"
  },
  {
    "renderMode": 2,
    "route": "/form-designer/design"
  },
  {
    "renderMode": 2,
    "route": "/tag-number"
  },
  {
    "renderMode": 2,
    "route": "/print"
  },
  {
    "renderMode": 2,
    "route": "/backup"
  },
  {
    "renderMode": 2,
    "route": "/admin"
  },
  {
    "renderMode": 1,
    "route": "/sync"
  },
  {
    "renderMode": 2,
    "route": "/sync-test"
  },
  {
    "renderMode": 2,
    "route": "/sync-resync"
  },
  {
    "renderMode": 2,
    "route": "/full-sync-to-server"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 767, hash: '4f39683380e097ae398e1d52ae75bcffe85aa0f3fe0cf33212f07f21f696d010', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1307, hash: '82e45409177fcdf9c19d8a48e5462a2497df48014b47688ba3d87a652c9e8042', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'home/index.html': {size: 104755, hash: '7c0fe16d8477e0267537cfb740bfc2c664c1074f8f84846601aca294643f2ce6', text: () => import('./assets-chunks/home_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 199707, hash: '21dc54b461f271e877dd6bfcceabca93680fc2ce35e4ef1317c5e4e4f7a18b52', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 97153, hash: '661f8fdc7f3a0471f0652dde267cea628fdaa4301228cc05942af735178714ee', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes-grid/index.html': {size: 110991, hash: 'c673d7345131d4bbccaf2350d2e7699d77c0412f8ca0a5caca3b13f61fcc116e', text: () => import('./assets-chunks/loto_loto-boxes-grid_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 96588, hash: 'bcb08fb97f1cf3ae6a33fa63ea27f00093d0ef5217a5eb18fe963aac6b018e77', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto/esp-devices/index.html': {size: 99207, hash: 'c4954d7a5b7bb9410a9f295bc35a978ee73203778e6271469ba6e811bb604134', text: () => import('./assets-chunks/loto_esp-devices_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 3558751, hash: 'f172a614c1056454e4f2b2c7503d5383fb79784dfedbb335899c8dc1ab4f8e11', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 3664479, hash: '4740b26736e8bc2c3665097e0457c1ca23aa7fc682553f63bd592af955956dce', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 88281, hash: 'ae7c70944c6763ea8c4f1935a3079129bee63b19b4f4e2f3dfc8390e345dea72', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 3550909, hash: 'bbd80657c1c7cf51d9c1bcc49bf4ebe16448fd16b429ee60ca749947c6977e7a', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto-builder/index.html': {size: 3851713, hash: '3d1567cb6a3b255eb13b3380ef048e7a2f9a253e7c37f0dd36801602727ac942', text: () => import('./assets-chunks/loto-builder_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 679053, hash: 'de52c8964869b1327f4a1c64ff50110e3c3b2214c79471dec64eda3ace569704', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 238964, hash: '32a05ca052c9c911624937d4f13f385f253e75fdcf6a06a0fe4b5303b63314de', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 376796, hash: '01ed1b455fc8f5989845c2b5c3d822f09e9793bb27079e6427c0b8ca81cf88f1', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 92909, hash: 'afe733a6dbe916b4b9110e63f538157df7e63e89d8523edeea263d538b76da77', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 1436395, hash: 'dcbd5b4b8d0af3562163bb6ca02fb40265e838faf7b5f55f144d2f21360ddc9a', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 588670, hash: '30589770c15791e7fe61dce9193a725cde985ff8899cd7c59e352c4811399b5b', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 681631, hash: '334d2c6be52c41fc1b2d1102f1087c11912c4e4e5a594d0952b5d0ad3e1fcb2e', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 700099, hash: 'b8de2d4457fe77e455fc24b383acb97bec77da4cfd1bf573eb7fe49a657991ab', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 3555388, hash: 'cf8ac60392c9e22960589814a088c9b80afedb4989c53a4291a8454f071aee25', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 48434, hash: '10af730a29e1f7bef1ed5fac9332acdfb2a6cd3cf75c20995a530c0be188f654', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 93435, hash: 'c575724286423fce7f2a7c7113bc926b34d298a563c63a73b3837fb81aeb13d0', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'admin/index.html': {size: 93785, hash: 'd32878c2f8a0fc822fc18b0faeacb5e88bf1a4b4c035e12229781c13592b6c6c', text: () => import('./assets-chunks/admin_index_html.mjs').then(m => m.default)},
    'sync-test/index.html': {size: 101920, hash: '9bac449f3b86d49a7aeda03de20b3ee2217a8606684860e4be81c6ba266d9c2e', text: () => import('./assets-chunks/sync-test_index_html.mjs').then(m => m.default)},
    'sync-resync/index.html': {size: 107158, hash: '930677ad6f7cd0c94dd32d7f45ea7ef1edd15090d20095bd5b064040859ad89c', text: () => import('./assets-chunks/sync-resync_index_html.mjs').then(m => m.default)},
    'full-sync-to-server/index.html': {size: 96955, hash: '5c714a34ccb7f498b36d480217ed04c8bcd23e90ce3fc37e7ea0d29ed267cb6d', text: () => import('./assets-chunks/full-sync-to-server_index_html.mjs').then(m => m.default)},
    'loto-standard/index.html': {size: 7200178, hash: 'a32e1b27ab7e4bc2920383172b1adffbf3172b74a3a20d75348b5f028ce09b2b', text: () => import('./assets-chunks/loto-standard_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 3627368, hash: '69adb06072a86f2769cf3d59a6619781f4db18f60017f3c513ede165fb2b368b', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'form-designer/preview/index.html': {size: 1317059, hash: '53aca4be555678bb274ceba83bf0d9e100a3ca43dd97728ede6031448ff3f0d9', text: () => import('./assets-chunks/form-designer_preview_index_html.mjs').then(m => m.default)}
  },
};
