
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
    "renderMode": 2,
    "route": "/admin/category-values"
  },
  {
    "renderMode": 1,
    "redirectTo": "/sync/status",
    "route": "/sync"
  },
  {
    "renderMode": 1,
    "route": "/sync/status"
  },
  {
    "renderMode": 1,
    "route": "/sync/recovery"
  },
  {
    "renderMode": 1,
    "route": "/full-sync-to-server"
  },
  {
    "renderMode": 2,
    "route": "/trash"
  },
  {
    "renderMode": 2,
    "redirectTo": "/sync-admin/full-sync-to-server",
    "route": "/sync-admin/full-sync"
  },
  {
    "renderMode": 2,
    "redirectTo": "/sync/recovery",
    "route": "/sync-resync"
  },
  {
    "renderMode": 2,
    "redirectTo": "/log/table",
    "route": "/log"
  },
  {
    "renderMode": 2,
    "route": "/log/table"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 716, hash: '0c5cc69d9f2ab07449aa966f79801c8babe700feb16b6a9bbf4b6f7392c36ece', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1256, hash: '65d90b523d8ac0f8400210c9384522083d67dde9c71447f6613bc9404ed1e28f', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'home/index.html': {size: 132246, hash: '879a2d127f70dcdc8e5c60e43dbe6a35d38bee25dfeef45fc0ab6884e94a912e', text: () => import('./assets-chunks/home_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 224539, hash: 'a2a1f4a356225b110e7e12c01e0eddedd58d2f56a98ef8dca63798455845b754', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 121987, hash: 'a763e28dbe0a776cf64a46f76d50c2d59b478e9f77e4b11b87d5ab3938201047', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes-grid/index.html': {size: 143363, hash: '991410458854291b86055b05830c913355e3b53c1898f90236de1a56a12268f0', text: () => import('./assets-chunks/loto_loto-boxes-grid_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 121423, hash: '4a0504f63b0ae2ea9f873b9dd12fe707e85d12ee21e491d30f3de2123592af1d', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto/esp-devices/index.html': {size: 124196, hash: '42457233f3ed43baffb5e2a1fefe4868bf9e25be4148912ecd006c1161694807', text: () => import('./assets-chunks/loto_esp-devices_index_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 3548428, hash: 'f7aeb5334b5c64eec6f8c7b8f0b217e775da1d33e30c0af0a68a7f304d17550c', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 3663051, hash: '08df28ac8d48e2a6a7015862ac105141c35b9bdfb41403ce9b69c59a2eea5df6', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 3568167, hash: 'a2c02608d4b22943be81686a1c8715b04782d1e082d08f28d9531732ebc3115e', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 114915, hash: '1027d89394fcbb62942e119ca7c1a06057adf42116f531ee2240f4b52202b429', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 222411, hash: '1e0ae48eba3afba1172b04cba3244ded9d407d1b4229cc3689a524816e97582d', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 713454, hash: '8d29639a4866e9c3c3e23c9cc1c4496c1eb269f878e424ef1b0eba82a9153249', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 265953, hash: '638f1d10c5c5f97615ef820e7ac4e54bb636726c8f26425fae4995c639df1698', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 403709, hash: 'dc774d5cd5b809db0d9a08bcaf48b48762661d3c1891fd38034120233d660d94', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 119543, hash: 'f885b4e838fab3bd9832f7662ce6fdcbd09018f85371cae25b083db5aae21441', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'loto-builder/index.html': {size: 3728286, hash: '76cfeef68d8bf1c6d279ddf42e9fd0d56a76a627859b29c3a5c11a68bb674b1d', text: () => import('./assets-chunks/loto-builder_index_html.mjs').then(m => m.default)},
    'loto-standard/index.html': {size: 7725258, hash: 'befd2e35e9b2db972f28e38d7f4f0ee5a5b69567a015c5cfdf1b543774e390e2', text: () => import('./assets-chunks/loto-standard_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 704491, hash: '042116f8dac91ee91e26ba9e3dad2ea951492124991072c95097e2d6d02281bb', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 722959, hash: '813d72c5308724a0e944f16e76209f50fff6e300ab06efd3cfdde11559f77eab', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 621305, hash: 'bb565a348194546e66680edb693ab57240be134070dec37e75f609ef5176ad24', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 58181, hash: 'aa9063ce8a67e08c663303011efe8c619eccbf3a36dc38b0d4318faf5d96efb7', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 117624, hash: 'cd51ecb1a8d172945cfa9e007d4c4ecdd804b439305570a30612636ca22377a5', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'admin/index.html': {size: 118872, hash: '10c6a66eef3f68481de1141779e57cb505da871c99c992784a1b7c5f49e0824d', text: () => import('./assets-chunks/admin_index_html.mjs').then(m => m.default)},
    'admin/category-values/index.html': {size: 109247, hash: '0f3b4dec5f477d6518594ae29edf975dde2f141ea03e438f349c0b407107236f', text: () => import('./assets-chunks/admin_category-values_index_html.mjs').then(m => m.default)},
    'trash/index.html': {size: 66956, hash: '52f23db72c6cf58b338783c7b34dc00b44d6d1b1e41da2cccce70080f3d5e815', text: () => import('./assets-chunks/trash_index_html.mjs').then(m => m.default)},
    'log/table/index.html': {size: 141168, hash: '73a2385f19f1b8faa07c6c5a41c67808c62ca11dbafc63c788fbe00e3cfaaa35', text: () => import('./assets-chunks/log_table_index_html.mjs').then(m => m.default)},
    'form-designer/preview/index.html': {size: 1345615, hash: 'e6cf5f08a26b3b89342dcec1163d8541fc34f02a14a3bbce5a8fd725ebbab165', text: () => import('./assets-chunks/form-designer_preview_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 3566607, hash: '158c7f5d1d140e6bbd3d17e3db060cd9672a0aec14521a30d725f5885c4c90e0', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 3593657, hash: 'fa285760e43085b4c3e24a8143556cbb20426a32bb4b8fa3f35fc1ddb5cdccd3', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)}
  },
};
