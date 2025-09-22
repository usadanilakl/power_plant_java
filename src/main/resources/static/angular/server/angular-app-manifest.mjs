
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
    "redirectTo": "/angular/browser/permit-builder/jobs",
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
    'index.csr.html': {size: 23674, hash: '46644f999dbfe92bc4ed16c54af4e56bfde985c6f9fa66307f48df2c2d666e7f', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17152, hash: 'ccfeb9ea9727b4d55636edd5b24a75dff8d0d237a8bddbd29eff5cc78e0c0ae4', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 46280, hash: '400d178da8a2910fae1d32bb95d82218aa6baeb05c5c3ecf6e9f14fb273d9ae4', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 43317, hash: 'bfd90b8e6918052666a8ae48b99676d59e0b42185315836aab76df35c8fba816', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 49033, hash: '59a50b9de911726a4c0f5a652566e38b0425ea920b8d7b5e6cd596549558d005', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 43897, hash: 'fb7ff4978bec4bddbae4083fc149809949f58fc960104123566dbd34b2ac84fa', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto-standard/index.html': {size: 47564, hash: '19371a4312c09e36cde3c13aee93192ed5011aaed03bc18f723e32f7535a7a1a', text: () => import('./assets-chunks/loto_loto-standard_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 39485, hash: '239c2dcb26b193e5b14768119579a3ebae6418db4dfdb3b4cfdd72d25c257187', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 39514, hash: '42412486a748e178b2ad3e85579e56f468e1ec4da55212d45c71cc20f1101a88', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 24270, hash: 'b4efc983f57d00e3c0ab38439316e2b191e10a1b01adbc5340567459afb329b8', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 34259, hash: '5bdb3d60b33b4b65350b8d81e8b3085ca2c271b7e0fa1e377795103d0c1e519f', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 41966, hash: '89e0267af9aa6791760a892062b43b93ab994f6a81f4d50139e089f367ce9e44', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 31285, hash: '44b83fb3c6a98c17d48d8fa17c2b04f761f08f7829946df1349c8fea9e323cb3', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 32774, hash: 'ee06986a3f740c54c715f99a253bb15a134c5a738139aedfc108e83ea7a40ee2', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 43651, hash: '31309af080b584e8dcf5d0bb56d1ce6155a65b908b613d77e289ad7cdb1671c6', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 42280, hash: '949e93c4909cfe88cbe83cbf0fe71735fa22eaa06dee38963bb6b7b87995397b', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 49595, hash: '68e5f1d87d454939a9a6e56916d8cd0113ecbc18e4ab52890e02b27f07fa4a69', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 41902, hash: '3df7ae1001d8eb1ce953d362bc50dca4983acc527ba93cfdad1354c86f537a05', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 57235, hash: '719e160a709821d146ad489426983841d50217dc64e962d8c2223383cdbe9f5d', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 42326, hash: '5d8107e2ad6399b3a5fe8691095bfa2ee6319a548c8583b845ec30b318f69423', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 36478, hash: 'cc8f288365b975454b2e6a4bedee162155ce8da7982e2639a0549c599d78c941', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 42611, hash: '0d1472a7807530beb13af46493c017b2c54014232c19777b3379fe4b9775b1a1', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'form-designer/perview/index.html': {size: 41072, hash: 'ff9bbdfa7fb85ab8acb3925155a676fdc2a015e23dc9008af756eeb48f93dbdd', text: () => import('./assets-chunks/form-designer_perview_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 39136, hash: 'c3fca31875c85397eb43bae64d56e26a18261f79974d13eef2a7ab7e7e4e420b', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 55156, hash: 'cf85ab20542e9f0db889900eccb5450fcc9076feb1178d8365d27efc48f4a775', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'styles-WVLSSJOW.css': {size: 9627, hash: 'm5kLIVbtCdo', text: () => import('./assets-chunks/styles-WVLSSJOW_css.mjs').then(m => m.default)}
  },
};
