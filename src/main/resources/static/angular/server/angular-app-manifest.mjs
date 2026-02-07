
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
    "redirectTo": "/angular/browser/sync/status",
    "route": "/angular/browser/sync"
  },
  {
    "renderMode": 1,
    "route": "/angular/browser/sync/status"
  },
  {
    "renderMode": 1,
    "route": "/angular/browser/sync/recovery"
  },
  {
    "renderMode": 1,
    "route": "/angular/browser/full-sync-to-server"
  },
  {
    "renderMode": 2,
    "redirectTo": "/angular/browser/sync-admin/full-sync-to-server",
    "route": "/angular/browser/sync-admin/full-sync"
  },
  {
    "renderMode": 2,
    "redirectTo": "/angular/browser/sync/recovery",
    "route": "/angular/browser/sync-resync"
  },
  {
    "renderMode": 2,
    "redirectTo": "/angular/browser/log/table",
    "route": "/angular/browser/log"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/log/table"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 25241, hash: '8b8e712d38865f17977eccefd49e878e3f4e65b57f439baba1877d1dc55652f6', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17254, hash: 'c6154070a1b1ad11609a01dcdfdaf9114f6ec02383bccb1b219673da73292007', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'home/index.html': {size: 121260, hash: '5e1310f78243602495eb81f953ccd74043ac7ab1f941ad573099d38f5f69a488', text: () => import('./assets-chunks/home_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 116262, hash: '75e20f3d88d673a350a9929d0a8e9e207841021c46a44122937e5c8b9b9edba4', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 182641, hash: '78a7f34ab500c86d9968220e1feb894c77cd9a840ef728a1b663c9f89d6c0504', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 113003, hash: 'e16d230ce608abb32a50d6f454cbe3380dad66de3eb65f0c0b82a658d5d148c5', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes-grid/index.html': {size: 125241, hash: '1bb48595353c11ddf02acdf6f15c30cca5dfb0e4397327ea4be938ff932eaf98', text: () => import('./assets-chunks/loto_loto-boxes-grid_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 112970, hash: 'efc136ef0e4ee85422d207f3f2e68ae59bb58c5b08a2bb9ef375f0349b91757f', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 155318, hash: '051e664b577320f59802c910afcd9f3958d08574a61d5f23e561fafc25b8888d', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/esp-devices/index.html': {size: 114689, hash: 'e32826a237e5c7ef1dbec2d9fa15b81ce8a8dcbccca8a3a5682a2b76f0e4d898', text: () => import('./assets-chunks/loto_esp-devices_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 105629, hash: 'ecbed431ede2785cb63b63f53cb1b205ad71c47f9ad711dafb98ddf2d488321a', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 118114, hash: '2e8773f8b4c86c68498966a4333b29408d3ec95480a6d602a203def7e7f1eaca', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto-builder/index.html': {size: 189845, hash: '48f8c7e6263cc32a57c8db263556065aa4c720b845debf37c41bcdf7bb32d9b1', text: () => import('./assets-chunks/loto-builder_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 111180, hash: 'efb4c5cd7bb4a908841db6a1b5a3d7113329928eb7e8179a5b40ebf9d19115fb', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 123064, hash: 'efee05bdb9ae358b80037a3ab78f0410dd3fa85ba4bc5f60949f2bb3d41149d5', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 121251, hash: 'cf15f83767a24e396824acfc3a95fc45aa2d607fbf2a8f0a16517931f47f63de', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 111167, hash: '143374ce7b435d5c681f3b7885a917b2c32ad91943d26e510f5bd059c02ee55b', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 109934, hash: 'c564048062631e96bf90f383b471ae9e1be0e833521b534db84d780e5902ab4c', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 111201, hash: '32b26d082543fd9b5ab8c2d42b48ef475b972a3424d8d1db07b96be88d00544f', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'loto-standard/index.html': {size: 277124, hash: 'fe5481bf7edcf6fffe3904e2a43aca57e1eacd6d7ba090d4392f1eadee7e6a4a', text: () => import('./assets-chunks/loto-standard_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 115586, hash: 'dc4434fb883ad014abb29edbc7b4442848bbe06c0055ebd81f92285beba27097', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 110574, hash: '17e23798fbecec3b82d73e0dc01a3440bda5eec5f8fd3c5cecffedc88bdc7161', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'form-designer/preview/index.html': {size: 112549, hash: '364fc0f78733e1206c920e4a496e88a4d2782025e3b59d9ba182247a7e51ae56', text: () => import('./assets-chunks/form-designer_preview_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 126629, hash: '60b48823b3e63739843f182422c9444dfc598fe3fdbbc13a0836040ffa47aaee', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 57219, hash: 'c3ae4d8d06d009c851e38dce1652d1de304249656812be1a8191075b67e3359b', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 108281, hash: '2d36f3c313735724aaa2214f124755e7c0f2510a8b1b6fe3f2058928b1d57b31', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 99133, hash: '4faa19c316828bffe45374e5a6f0385061ac82068e76bd36c989fa253ac6320d', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'admin/index.html': {size: 109823, hash: 'fecc4ec39eda3e22f84d80e683d255941976064dc748cdff225457ab50ffdc1b', text: () => import('./assets-chunks/admin_index_html.mjs').then(m => m.default)},
    'log/table/index.html': {size: 128672, hash: 'f71cdb3d4083ff7b5ad01cf8910382bf418aa2dde6b21ec22c6c08f9b763aac1', text: () => import('./assets-chunks/log_table_index_html.mjs').then(m => m.default)},
    'styles-Z3PCIMZQ.css': {size: 32780, hash: 'yim97pIkghI', text: () => import('./assets-chunks/styles-Z3PCIMZQ_css.mjs').then(m => m.default)}
  },
};
