
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
    'index.csr.html': {size: 23793, hash: '4bf03657d29b9c276dfe94d6512821c9b41360d4f723ca3e96ecaa0d274335ee', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17152, hash: 'cf36b39c54d8c15bc542b00da22e3a3d563a55d51fc6c099ef235b9714d0b8c3', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 80628, hash: '43cbc7ee172cab20da181dc22ecebae707d130053997aaeb45899ad4e0fbcb74', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 60906, hash: '735f05c00a8dcac13bb66cfc29126f953e738b6371ec458656e09189148b9a33', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 44433, hash: '31bcaa5985e8f78eda2c618765a89b36d33a16b552dd2af150504bd79d43a612', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 40367, hash: '31f3f6e18b0e5296d25112e7c6f3efca0237bdd7da69c3ab8859d0e57b6ef894', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/loto-standard/index.html': {size: 86546, hash: '1ec0569967d3b99b8cb2a0b34752ba1e37b464b29704720bcfe13dc31ad85af3', text: () => import('./assets-chunks/loto_loto-standard_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 39802, hash: '18bb9ab8bb99509af4898f258cbd54a2a1db2378cc14e86ce27694995fd89bdb', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 62265, hash: 'bfcd43c5a54a80f3c87ce95123c05d7da5173c2851e57863f1a67ed1f17f637a', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 24591, hash: '661e43022067f19b4e5a815ceae589040a4df4e3f0395f72c1e26b8c8b2fbeda', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 32621, hash: '294e17929758c70f2ff3c13b2a2677e8840ec121b262fc45475b83815957304e', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 33095, hash: '850978b0a80e921beeba3c50b5baec237572d50662eb3bff9fc6ec331a081e95', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 767136, hash: 'b97c6a97d2236dc1dcec053728836ec1906f444d49e9e9a562ccaf296c2915ec', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 67962, hash: '7df1330f49353926379dfc10ae4591f4d0882f865f31ea341197d7c7bb7a3740', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 3442356, hash: '48dab114b42697d8ee7c6fae26774428f5d19e5cefda49ee6fe2e484bf197809', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 450805, hash: '209facde53bcd177e30840cde5d2fc3433bf0662fba62928264f328e5a301e67', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 871290, hash: '47a033028aaba749eb61ea608aef80b7da0611eb514f98d6a4049fcf62415b8c', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 36799, hash: '91ed974768fae991340b8643b227198478467baaa5a211a1c26dab24d562787d', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 626599, hash: 'c0db0390cb694607faf0a2155264239363824b376e9867daa8d31608e71af8a5', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 548746, hash: '203ca31d8d1dc640657621553ca31d8785cb2f609f48dcc25d1964eb3cbe846e', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 476975, hash: '95410681e02b06f55bdc4e135355bb70f4bf92f421653b5ac1cb5ce4f8f90ed1', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'form-designer/perview/index.html': {size: 915044, hash: 'ddf4b6c4717dde9583e749b622d28cf3988f3255a14214c4fac838dcca720eb1', text: () => import('./assets-chunks/form-designer_perview_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 564767, hash: '1ab58fd6dd37fe4b0c334cf172abfe46ec047c8dfce18af589e9e476028f4a47', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 578138, hash: 'c907252b6163b2e6c384a83e3e4dd671d956a23cd0d4548eecc1eaafcbb6ff62', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 442066, hash: 'c86953ef5429bc1c2e344b19a29271d670fe618210eb422fab2f4924ac7b5142', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'styles-WMY3BGK6.css': {size: 10002, hash: 'y98nJx7Z66k', text: () => import('./assets-chunks/styles-WMY3BGK6_css.mjs').then(m => m.default)}
  },
};
