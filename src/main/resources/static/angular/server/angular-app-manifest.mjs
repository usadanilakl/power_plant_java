
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
    "renderMode": 2,
    "route": "/angular/browser/admin/category-values"
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
    "route": "/angular/browser/trash"
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
    'index.csr.html': {size: 25241, hash: '08f0706b575d4cc6a4e532c02d921cddb2a43cf031ffead17d70a7e5bd740fb2', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17254, hash: '7f38014fe71616024e78aab3fa77ba504e2b53450727c265c54920f53592113e', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'home/index.html': {size: 121260, hash: '78bc840db64a4f57fd470530eb5f72ff3fdd94efbd5bdc0c2f7ab8f146e441b3', text: () => import('./assets-chunks/home_index_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 155318, hash: '11c75a4549a8358ac91838e0ae8802d30046c003c20c9ff8a0dca7b2bf6157ba', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 182641, hash: 'f613d4884906561db38a1d977a102c9482c73f7a9a990be27b67ccf2e54fdd00', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 113003, hash: '8f40110946f989e7bbbfadb39d558a39e6db73f27419bef8856a34007777d33b', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 116262, hash: '9f8ea500143ee73fb90ceecfe64f004efe40f48a04a47663b6fe03578585d9ac', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes-grid/index.html': {size: 125241, hash: '926cb0a603444c8243015723e75adf64ad752acf452cfc46f2049c4816896dfc', text: () => import('./assets-chunks/loto_loto-boxes-grid_index_html.mjs').then(m => m.default)},
    'loto/esp-devices/index.html': {size: 114689, hash: '8c8c02ac08e702fccfe2d59bbc3bb3095da07669b1ac8583f6cb5519513fdce7', text: () => import('./assets-chunks/loto_esp-devices_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 112970, hash: 'faf1b712cf289229f78157fe8e76daedb954311be01ea3a80338a99003bfd054', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 105629, hash: '8472f474c95afc44ee05fcaf190b46e0d404759e6bab3ed55d77c6648a80bf08', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'loto-builder/index.html': {size: 189845, hash: 'b5977b2bc898a3dc9579464b7d4dfd63cfedb4cbb148b64152bd4128d360bd6c', text: () => import('./assets-chunks/loto-builder_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 121251, hash: '34a468feb5e0524f37cfb74ee8fbed10138334952628f5c676d82932915b5080', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 123064, hash: '50c9b6058b93a4eed601246c5b9d627485a42cc0482909a25f31a091310c6b9c', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 118114, hash: 'eab94851c64fecec588a8d3bac3687df3ead31018ef903f8f8e2c7e7fe378cd3', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 111180, hash: '22007d2aab37171ee5f3ee1c43991238206cb134e81a17d13f38e283aa56d709', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'loto-standard/index.html': {size: 277358, hash: '24da357405d350d32e0e392931d93a4013d65fec8a0aab81f910a4634b1f5a16', text: () => import('./assets-chunks/loto-standard_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 111167, hash: '8e439ea7eef623bde617264ecb6d732773079cd67ff82481c2f7f6f6dbf3e963', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 109934, hash: '0c446b896f649dd19db5e12b0ec408b9a7b50cc6d099eecd4508bdcd2f95e7be', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 111201, hash: 'e905504650235f8bfada59c018a21636a3ec0fe7032a221413d7652083410af3', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 115586, hash: '52d6be3b39802b963f1b447caf0930f0bc48280f614c5e66a549e6f05f27e16e', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 110574, hash: 'd37c57dba9a3bd5aa713062dd639d7cbc42a959379cdac62b60410ad7d32414d', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'form-designer/preview/index.html': {size: 112549, hash: '3cbf608a7bd9f2dd6efd5eaccb82d46fce6ac638bb7d3860d3cf9db551d7fbfd', text: () => import('./assets-chunks/form-designer_preview_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 99367, hash: '5acd26998931c5bffa77e3506ffd5ac307134817f48b0ebaee8440eae647aad9', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 126629, hash: '76d49266d319296d963583ae1b7aeeb36c64e10288738503b13d94c631264aa3', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 57219, hash: 'c56a854f3afafb4b532f1216239fbb63f8b65f42b00154f70b6c89db77a75f1c', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'admin/category-values/index.html': {size: 77936, hash: 'f0fe01dbb464410ac46ce4c01f47e53e962e1e01fa24c246d96740d559f98b70', text: () => import('./assets-chunks/admin_category-values_index_html.mjs').then(m => m.default)},
    'admin/index.html': {size: 110585, hash: 'f63f86166e0c7050312e372c8ee0338460ddb550cacb0792305bb088c0532225', text: () => import('./assets-chunks/admin_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 108281, hash: '5293ef4b20552d25f0aa3a4daf07575be6944d8605286bea8cbc45376b177b0c', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'log/table/index.html': {size: 128672, hash: '03eb4c3d95c441c3030a64c0be644144b8cc8d0a03c1d1b7e070056f9533c352', text: () => import('./assets-chunks/log_table_index_html.mjs').then(m => m.default)},
    'trash/index.html': {size: 64090, hash: '5a287655c33c9abe74f74d7cac306626dc62f7a870d5457b214a0a3813cec4d1', text: () => import('./assets-chunks/trash_index_html.mjs').then(m => m.default)},
    'styles-Z3PCIMZQ.css': {size: 32780, hash: 'yim97pIkghI', text: () => import('./assets-chunks/styles-Z3PCIMZQ_css.mjs').then(m => m.default)}
  },
};
