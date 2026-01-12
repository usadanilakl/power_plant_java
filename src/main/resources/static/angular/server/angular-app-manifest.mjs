
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
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 25086, hash: '56eb13851ae0b89b54a6b958a1e9042d318810da54eb6420d1b10e28411d6bdf', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17203, hash: '7a3f4c186ba2909b4393f89344b1738d431d51d3370f7572abdd8ba41c7a0ebf', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'home/index.html': {size: 96432, hash: '4442776cda7bf607152bff31fa4e8e07ffd71b291a53e133885447ee2b9dacd7', text: () => import('./assets-chunks/home_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 167523, hash: 'e32436ba870c0b71465de132ed31fa013c631b935179afa27448b0f9f4352e06', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 95977, hash: 'c95ffaa02dca5548329acf812922da05e2beb91189594b033edf4425dbc07c9e', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 91225, hash: 'a2e4d741edddf6b2c2de6a3e50b31ddbea4aba4da0b2ebca102264e6e87aa584', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 91192, hash: '5947d1269aeebe449f6aebf07f19b4358b331dea7fdf420f9ada240b1cafc3db', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes-grid/index.html': {size: 103466, hash: 'd566f8afcd341043ce5dd2196dabe09c8c0cbd29b8765fbc35967a4ab310c01d', text: () => import('./assets-chunks/loto_loto-boxes-grid_index_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 134530, hash: 'a73d856699a116f2d17e7e43fbba7fa8d0ed4afbfacf01f55f9532d6ca49e702', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/esp-devices/index.html': {size: 92982, hash: '3f9347887d52f17a4ed3a4b2c2d00f1bc1ca2793d670196ca6ec6f22aef494a4', text: () => import('./assets-chunks/loto_esp-devices_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 83997, hash: '7dc9710e6ca8a2bee46fdfbb93f00c25fcad88d3718f2ccda9292e90e6c34e24', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'loto-builder/index.html': {size: 164115, hash: '15ebe2a862e3c25bdfbdfe1dd09feee12765a6190e14ec9771b3f1d284234987', text: () => import('./assets-chunks/loto-builder_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 101113, hash: 'f0a5e862475ae60087c0d74944c1f37e622c36ffe3cbdbe14e0a7322e10e621f', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 102905, hash: '1777fc6ab2571869c3ef1cf97e0b3e59a8a1e24111420919d7da2f43589f43e0', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 96335, hash: 'f9c95e3fb5f9c9e1c74e53f6a5e40e5879f6a79cda3d5ee560c6e03b9d66bc52', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto-standard/index.html': {size: 245517, hash: '3a108bf93a193fbd4e80616a116f28c92abf394335fc5c3c7b27bc4c8efbf062', text: () => import('./assets-chunks/loto-standard_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 89548, hash: 'ac75b50bb862d5d90125d3eaac1f27b8daa8859b0c3ebe0d971ed65129136942', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 89535, hash: 'c6185c1eef7d5a9688f34435b102549504d0547f08177b1d904038d9792fffc8', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 89568, hash: 'b47785ed96405081e1acd282d7a2641edba64f1648f42a67054686517fcfc621', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 86886, hash: 'f6ea8b3f49bf95d217e851e177bf6bc99c90b63879765bfcfc9582dee4d5e902', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 94033, hash: '177b40423db6942aed6dada45d57b0d0fe74773d2c181637b69dffbd17230781', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 90216, hash: 'e3d1435f71ae0db8f0902eef15d1f28dd9391f10cabdf2099e11738919cafc20', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'form-designer/preview/index.html': {size: 92190, hash: 'b647e15c033d8b1bc62729df96b4661baf8575f3dce8de64d79e37670176b1b1', text: () => import('./assets-chunks/form-designer_preview_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 106249, hash: 'db9a98e6a7483aee7824f47eaa5553911f2c18a2b541251f3fed926fdedd4b89', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 37377, hash: 'ea648802990a581b242abf01a40d2b3ba2907148b2e1df2ac3ca1a4f9978b64c', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 81128, hash: '68eafe021cb9d1519a3a5ee32a9df1af8cc7ab5226fd00ad8acbfce26a1880c9', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 44930, hash: 'e4d8547c283a2269e4686c620893b5ba559b5eb1223d16c53015628780b80967', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'admin/index.html': {size: 46468, hash: '1d9f89ebf8786356f90e20bc89137bbe6c75c7f56b769c852745e191a17f0268', text: () => import('./assets-chunks/admin_index_html.mjs').then(m => m.default)},
    'styles-67EVNKE3.css': {size: 28624, hash: '/Tv6EccCWeM', text: () => import('./assets-chunks/styles-67EVNKE3_css.mjs').then(m => m.default)}
  },
};
