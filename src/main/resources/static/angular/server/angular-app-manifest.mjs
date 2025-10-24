
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
    'index.csr.html': {size: 23793, hash: 'eb24e4bdd6994c3515da359c3d39b4a71f7303ee09069ec308db4f99af8a6911', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17152, hash: '358a3a217791046b5457bd40865e38afbaaccea5461348bc5a16582cc881d617', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 46602, hash: '5018ebcc47e32939a0b9a03232f4738a7acae17cc5fd781ed1f8e63ecdfb0384', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto-standard/index.html': {size: 47886, hash: 'ac0ad3e8809a73f684709a3bc8c1633c0f803a72c0398fb0ea2349d9d386b6da', text: () => import('./assets-chunks/loto_loto-standard_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 49591, hash: '3ba223299c7fcaeb55cfd29f3a45ea2d5d34e7b9589d89006651cd3e7de0bdf9', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 43698, hash: '5d7268c387811e1a10d2f5c0752d7b5e6df9ac8400769d8d84652ed3a0d9b6c6', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 44275, hash: '633d25adfbced75cb351e6eb451621d2c9db7711265f0c64cf85cf045187a1e5', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 42348, hash: '37a33b8f28588f2a0e86d906e311c6ec067a620e022043c394bd4e85933a240a', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 39835, hash: '6544aaabe49cc9a9771f1bc48810e055a46b8c9d68a43a8b32a6602e79c0dd0b', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 39806, hash: '85e71cabfd8262c86e3ee077d1b5cf2a7047de9586597757302dda83eed4c5ab', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 24591, hash: '564e8749d2f7455f778403bed5d30d39d55a4a0f540169970a556e6299474a34', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 31606, hash: '9360436f6309b860d34e74509cc7a20c88596a840deefdfdfb44f99bfacc560c', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 34576, hash: 'b01e65b09c377de4e8d88606eb82e662f23753a354850d38d36ec6dea58ce73f', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 33095, hash: 'c130e1b5efebe374d97903de5c1684409bddb5ccac0ad236e6b91011f0182acc', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 51352, hash: '87260cf5c90adff3bda750c1ab2f6811639d1636df1c251d0699488e8b53f955', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 49916, hash: 'c4a7fd91505a60de186f7e59704cb759cb304a7abb9698deca240d83b74c5d58', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 42604, hash: 'ea88f8d83914256d9f607ad9c547d839635bad9b5241aaa8aa3eb159ae9bbe90', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 42642, hash: '59cf48410d74727c19b61eac4310c8625cc7f6efdf1664f3d055bf26af6977ea', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 36799, hash: '335ee8758c74ff03687155f940452419b57b3dfb24db642dc9e1c382d4f73323', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 42211, hash: 'c7dd3668d14373145868170b734138e4dde77dbeb9e4b72e8ae31c83b6b7da6f', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 42934, hash: '89c4947cbadb3305a4a815cf001cacd9558558b7f64e4db894ef051e1b333880', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'form-designer/perview/index.html': {size: 40859, hash: '0fbae302c0a87dce2faf34528cf9b447a9e7bc3b1daaef740c30fd3315185f4c', text: () => import('./assets-chunks/form-designer_perview_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 39457, hash: 'ed818e9a53b582573f27121422183c50f399b930adc40056c1da036c4e85770f', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 55477, hash: '5d8045958913d81678e0e187d42b1961c793a77630d862a25d0c513af4c2b86e', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 57557, hash: '9cd860f6bf4cb8907c9e483a55b11a817535310d19170772e03890d29a8af3f9', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'styles-WMY3BGK6.css': {size: 10002, hash: 'y98nJx7Z66k', text: () => import('./assets-chunks/styles-WMY3BGK6_css.mjs').then(m => m.default)}
  },
};
