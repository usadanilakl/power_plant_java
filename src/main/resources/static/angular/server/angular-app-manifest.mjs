
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
    "route": "/angular/browser/file-editor"
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
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 23674, hash: '22afc43067c10606614223c0718afa6977451cd3a6bcf8abc14ec40343b39fa0', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17152, hash: 'b64b73b7c48224aab5cedf2e23818cbb9c80a8e742b07573c342869df203bcf1', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 64504, hash: 'cea8c420afc814e67cbe104baeb322c6937ddb4cc815120f3230fa341d9b922b', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 102865, hash: '3029bf71eedb84cce35611a284a85c40ae81cc1c7077fd53aff08d9a0a017a08', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 31395, hash: 'b6a3c0315c6cc4673b4958e160e1871649b8869266e200bb2c636a454cad7610', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 30831, hash: '3525a50a30cd1cae2acc5a11d943e6a70e78dcf9f07c5892d7395abc99eecf97', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 109768, hash: '672375091695db25a7c8105f3f9cef91385d83200d853c386d1a217c42db550e', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 57008, hash: '5647e46a39f2477d0ad57b6810e876d3a47f3b7fbef8664d4acfe3bfddb7502c', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 24270, hash: '3323ad54ced562691b753b03b6b376fbdceeee0b852d1c4bdf97d995f176135d', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 32026, hash: '585d77763645e893bc36e900471138771dec808132de469883b2ba08425b0f4c', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 393401, hash: 'b076ebc87c37d043a98ae2fc45b4022cb1ab2a82e11eabaaa2fcf558b2246c99', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 36171, hash: '8824cbca517d9089a6efd108a474f620f95a49de66b72584897b3ecbe55a8cbb', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 137319, hash: 'ff6530c9cee6725a786677741ef5418f92509b943618bdeaa740196f05ab2edf', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 415426, hash: '27224e4c6e83b28455ee480b6edc126afc81410f81f845939476b0c5bba8f3bc', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 1358595, hash: 'a29aad2fb2503526f10a19d876bd5bf1152ba9160a841e3405ace95350569cc0', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'file-editor/index.html': {size: 1071074, hash: '0f87e1838daae74a9b083a2827073159245a819ec0f632e7841b6af0c8dcc451', text: () => import('./assets-chunks/file-editor_index_html.mjs').then(m => m.default)},
    'styles-ZZB5FV3S.css': {size: 9528, hash: '3l+z/03bYiA', text: () => import('./assets-chunks/styles-ZZB5FV3S_css.mjs').then(m => m.default)}
  },
};
