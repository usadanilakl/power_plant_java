
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
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
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 25121, hash: '35d078741437b0621d9b197029858785565e06202ef263d416d8dd783a9c6b60', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17238, hash: '5b21a952eca8731265fa8ebe518885ea9b856741abc7d4208d6fc947eb6206b3', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'home/index.html': {size: 115209, hash: '922dc3729cdd67131d240b0e415a567596ea25bf0e68e9e5b907874893fce0f4', text: () => import('./assets-chunks/home_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 183314, hash: 'eba5dca39a6d29a6566d832d793234299ec50c1154f3d23166bf65665133dda5', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 156333, hash: 'ee78eab9d797f022199933a1d84a25d6e107dac3c5ff6bd28ef7e9782d8e139d', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 115032, hash: 'ce36441055cabc1a209b4be07f96f69b0368662da67fb1561bbe5d012e437666', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 109360, hash: 'c56bdb970d083328f6dea2c69a37ab4f71ae3ec209fb3023debffdd0df27b21a', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/esp-devices/index.html': {size: 110729, hash: '390d2a46e924ca2f8d4bd16c8ef0411e987fe737049d743fc622037bb26f00bc', text: () => import('./assets-chunks/loto_esp-devices_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 114982, hash: '4e32537d06910ea75756ef592c003eeafbe2d6f11c735dc6c97b386a23f17119', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 108797, hash: 'f59ef4fd793310968c3d8a5e19726a696d77e871fc41398f2207dd11a93c8106', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 101632, hash: 'c5d77a16e7127bc51e1e1826a5ede66bd01ebf0c67e92ac605d8f7502352eb69', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'loto-builder/index.html': {size: 191403, hash: 'eda4762a1a24dfb853692a8bed5c5df129d873e047e0fe9e0eace9cfc80678e5', text: () => import('./assets-chunks/loto-builder_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 120767, hash: '994483cae56391e325b78d0f573baa28b3d3f8333e772eb422e5f9e2607b1ad0', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'loto-standard/index.html': {size: 272962, hash: 'e51cbcb041b5f2e5c2084a96aafe120e8e9e92ee8f7cbeaa2d0fafceb29b8779', text: () => import('./assets-chunks/loto-standard_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 107808, hash: 'c84c5457694bcaff4dd74263582eaa5be92fb7e86a7f6c446be98a47d7582a06', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 107793, hash: '3ab366a3150a80dd62599a15e80b705b808439902266b745b07033c03de56234', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 105069, hash: '2dc8b49f60f6a4395ab6e698988f5183f3e8c094e04b19b426ef3feb726a96f2', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes-grid/index.html': {size: 121205, hash: '4abd70c2344636b624e1781b63ae31b6a3d66cd7b100ab72955c8f479c79c98a', text: () => import('./assets-chunks/loto_loto-boxes-grid_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 107844, hash: '7e7f06e5f835a9e5ed49dc9009fd88142f66b2704f09ec0e9fbab5dc72dbe544', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 113966, hash: '79fc1bab74a868bb3e01ffac02653bbc72721064b4da9849af19b54ef55d09c4', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'form-designer/preview/index.html': {size: 110554, hash: '130701c9ec92196c961026e702b62799dadbe2bbc57b6525be41e609d0159238', text: () => import('./assets-chunks/form-designer_preview_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 108100, hash: 'bffb998c2e92b86840f2429c59aa86cb64fd35f6b2822d3df2c7f7b77475afcd', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 59040, hash: '8edcb8c995bef7e630e60482dc31b73d72fefcb8504496f7477619fefcdbcfb1', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 124135, hash: '2d026bada048578500227bece05ea0ffc1de31ec3c78126cd8a33d4acb6b8517', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 102901, hash: '12ec5c4964a0d55778f9950bed1de0442113e985893558e211628e17c6e6f5e3', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'admin/index.html': {size: 71218, hash: '6f94a1b305b44f4e75d6a140b10655d5970e9e9471924ea74e28584320398bca', text: () => import('./assets-chunks/admin_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 69669, hash: 'aa203c5566b182edfdf7c7b9fdd1c499f0ca5b7e10c31d6d2ab5e4f2aa3d8eb9', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'sync-test/index.html': {size: 71291, hash: 'bed455b1f1ddd0355491b452c8462c3f0909b29117166380fc2fcf8c17fd3a2c', text: () => import('./assets-chunks/sync-test_index_html.mjs').then(m => m.default)},
    'sync-resync/index.html': {size: 68894, hash: '3d155074620d95ec1e6b9187c74f48c17182b26f9e2449e9ed1638b50a5d8168', text: () => import('./assets-chunks/sync-resync_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 120343, hash: '8325da0ac489142718b39cf46b4663a5df6b4f7c2be1d8678311d3e283695814', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'styles-7VYHPHOB.css': {size: 28858, hash: 'm4VI6V+Txag', text: () => import('./assets-chunks/styles-7VYHPHOB_css.mjs').then(m => m.default)}
  },
};
