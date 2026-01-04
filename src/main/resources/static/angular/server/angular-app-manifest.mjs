
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: false,
  baseHref: '/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "redirectTo": "/file/edit",
    "route": "/"
  },
  {
    "renderMode": 2,
    "redirectTo": "/file/table",
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
    "route": "/form-designer/perview"
  },
  {
    "renderMode": 2,
    "route": "/form-designer/design"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 665, hash: '44009fe0d2a2f543ffba34fbcf94a496fa4c5ea0792685cb894307526bc05abd', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1205, hash: '076ddbe88c7eea64c2dadecdf78e808fafdabf8e37ea354c0e9d14ec556801c6', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 6769824, hash: '196d3d0f40ab941c8f96b9b528fa150a5a2a9d55826604181e5557fde81e4703', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 6815695, hash: 'c097ace1c26c9cdae10c0cf2b398b8d6c89f83bbacea502e9272b8405450fec4', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 6810959, hash: '0307ec86e8b8da76debc51a22d2c1f9181049d8aa9923eaf7e6ef9d9d763a40e', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 6768455, hash: '1ba0a16608ba8d8be87fc79c27e1b24acfc7015a152d024d46c7fdd8acb97987', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 6708413, hash: 'c1321d750b349708d631a76c02b5ba0a68cdf8f546199aa1d8eccac0c65f825e', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes-grid/index.html': {size: 6723978, hash: '6cc25e16313c9c37cf05ec9ee2011fa0dfd16a1ae13a061a249034dce44ef5ac', text: () => import('./assets-chunks/loto_loto-boxes-grid_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 6707846, hash: 'f878c91e8129384e2635742c802b0f88ebfb4ca7d290ab7a292e3945e612924c', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto/esp-devices/index.html': {size: 6712179, hash: 'fcc7dd9496414c087cdfe64c08568fad52f6563de2b502c5fcb8823ebd69c4d7', text: () => import('./assets-chunks/loto_esp-devices_index_html.mjs').then(m => m.default)},
    'loto-standard/index.html': {size: 6935083, hash: '7a46cabc6830aca1147874e0a39334cf6143a25ae98f7c6069d3baee58c2669d', text: () => import('./assets-chunks/loto-standard_index_html.mjs').then(m => m.default)},
    'loto-builder/index.html': {size: 6678376, hash: '44717ead0e7ec2cc6dfae55bacbcb0b3637aa6816c7d20ae8fa207e6b8da4a0a', text: () => import('./assets-chunks/loto-builder_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 6784350, hash: 'a9fc4b63a5c3eaa8f16d58463d4446c19f1c828abc5243a3563030df6cd197a6', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 6676142, hash: 'fa6e8a7ddd94b1cd8fd2d6e93f106dd26f3c48028d596e6cf2172a01864dcefc', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 6685847, hash: '633b134cb78765b6a0e458383364ec2b7798032f8d2041ec13524d44f962e0a4', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 6695028, hash: '9ab6f2c84509f07e672508d4e60c2bc4df84be3cb401b7a3ad960e705a4e9fd4', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 8016732, hash: '845a4d51ebceaea4601b54a1a3abf46ada7fe130a3009bee6a015bf84f3af17e', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 7175826, hash: 'dd6e80b52146bbe5c49f57c1163129a4366967f0e3b753f4e04640a3dbacc2a5', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 7290911, hash: '179497e30535a2db609a262e445dd472703480cf86da847960bef754931cd0d9', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 6825721, hash: '2723d9ec054a32bfbc27526b2495ab88362923fcf3ae9da6a2e8280f6f3d1342', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 6963963, hash: '51dad92ae7b8f399b991ff98694d28c25da351cc8b0e6bfac745595e257fce65', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 6697724, hash: '0a309f8b33444ba2ea63b74c5448683f42e4f944ec3046d179ed2a97b9d110e8', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 6757184, hash: '73415c7f34c45742ee78eca79c451c2b53682a15d8f47ace4e1d16547d710245', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 7287493, hash: 'e71f310ef62a45bf2ff1e673cbb6dcb2c341399b1cfe78de87036071cb9bae13', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'form-designer/perview/index.html': {size: 7922915, hash: 'ec0f9eb24423cbf268685e36bbdf9312c72cba2adbee53c136380d4c076393a9', text: () => import('./assets-chunks/form-designer_perview_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 7305972, hash: 'ea04593f0f858e82720006ebbefbe4f40bb4ddcc770a3434c25105f80a95d0e5', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)}
  },
};
