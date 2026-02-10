
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
    'index.csr.html': {size: 25241, hash: '532a27e935f42fa04dc77dbb04e9906443ea185a1e03071e6d6770d2c5dd389b', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17254, hash: '4b6dc8b25e4ebcd7c09d1e993861cd8a92822bfeaa7a4f2cd0d173ecbe9a51e9', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'home/index.html': {size: 142097, hash: '285486907c05493fceca84dbd0af35ccb55251347b62cdbdb6bba44c6bd97022', text: () => import('./assets-chunks/home_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 172707, hash: '5e06e5a658a24fc3fc2247d1a43005e7231dd0f0fb3d6ed4b2e968dfa9dfddbd', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 132829, hash: 'd21c7675f0696f75948ec83aba148b9043d0a45d5a57daa04de219c66c93577e', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes-grid/index.html': {size: 152059, hash: 'b2b954b948d168e520916f9555dbf66b1c58e0bd61fe70146ab1b21e985ccd7e', text: () => import('./assets-chunks/loto_loto-boxes-grid_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 132266, hash: '3a00d0ce30a8075c97bb214c9ab816dc4e727eb1efd193ef43068b09a780f392', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto/esp-devices/index.html': {size: 134197, hash: '2c41142958637d7766c4c09c65fc0f2e63166e803a6c14269c838a944448a956', text: () => import('./assets-chunks/loto_esp-devices_index_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 3549826, hash: '7d82280bd2838ecf96927fdcb5cd9d907007373fb8307d6978c7c9b353af9830', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 3654927, hash: '9d0aae97e8d9e40bffc1a369694fa79576110a6f12534b9ead7ee26ef590fd14', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 3576202, hash: '0ee3c185b1a51c94b4df88f59f8e32a520ed7212e8615de1ccb1e83aa89731ff', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 125991, hash: '8572574b893c705a141831368ad56d59d0175159f7787acb20efa294f51f4eb2', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 224201, hash: '1876217901e4bc53872b3022c09fae274aaab0bbf70baf3e4bc70999c8471c6a', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 722136, hash: 'db0e591d43ed3c6c93ebd657e9ebb369531bb66b143b47fb3a27056abd50fa14', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 196959, hash: '3032f0149fe591b608cb15ea6d30ecb28e79ce1a4eeb67f162367038ebe9ef94', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 241072, hash: '3038f8aedfa55ee44a70bd3c28ee4587d30b4207dc286ed1dac4faae7cfd49a0', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 130296, hash: '4f9afb7e3ebcdd2746eda7e9c2bf34b23f9848a445aa7bbbe7b6803b4603474c', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'loto-builder/index.html': {size: 3730753, hash: '095daa6bbe40e97dba2cb0b8df13551498084037cfc343915f3e3b7f12818166', text: () => import('./assets-chunks/loto-builder_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 130077, hash: '9244b697286009b1ca063e7672ca35676346ae07f4bd042c2fd01821ab49c700', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'loto-standard/index.html': {size: 7711134, hash: 'cc7a0c9e451da9aaebefbdf7140625ec782d9f0458d22e878fe262e5052e2c55', text: () => import('./assets-chunks/loto-standard_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 146132, hash: '9b59b3af7b586d1a1ff936511c69f9872236f8761bdbe540c44b677870551db1', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 430935, hash: 'f080b1ee50c94ca99d9f31de609baef6c5eeeecec6ffd6ab19f4d791efab10bf', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 76515, hash: 'd5f17e6a3354d3ef81412f70048b628050759ae44651f28f4638c2a836ec59c5', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 127570, hash: 'cf9f438879c63b493261da7c9ae59365a88a2c8492aef5b98d23295134b65227', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'admin/index.html': {size: 129881, hash: '590eb8841cc4f417d153ceb6074b047cbf6aa75428b3be054a1e78b837537e5e', text: () => import('./assets-chunks/admin_index_html.mjs').then(m => m.default)},
    'form-designer/preview/index.html': {size: 420992, hash: 'aaddf55f552a583192e565d7d02f9845aa40fb5fe7a624d5c5350632aed4c782', text: () => import('./assets-chunks/form-designer_preview_index_html.mjs').then(m => m.default)},
    'admin/category-values/index.html': {size: 124424, hash: '080af2665cf457fbe8bc01e435c9c4e0bb412b4dc2c6baca5714e1285fb4fc8b', text: () => import('./assets-chunks/admin_category-values_index_html.mjs').then(m => m.default)},
    'trash/index.html': {size: 83982, hash: '098f76ea93307a285095d6ccb6e20d91792c8c5019d183ca039225276b0ede81', text: () => import('./assets-chunks/trash_index_html.mjs').then(m => m.default)},
    'log/table/index.html': {size: 148327, hash: '20a21167d3008203e7c5568687bb7ed62ac7af68b39d2cc8eb763fd0f316d385', text: () => import('./assets-chunks/log_table_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 3574842, hash: '84ad717e774a3eb39db03d3e82bd0372c2e636703c7c80e92cc11efadfe781af', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 3603512, hash: '5db47a80f9c541ff7a14bca1c54643910d80364d1886fd2c7af4ba285799d834', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'styles-Z3PCIMZQ.css': {size: 32780, hash: 'yim97pIkghI', text: () => import('./assets-chunks/styles-Z3PCIMZQ_css.mjs').then(m => m.default)}
  },
};
