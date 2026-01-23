
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
    "route": "/angular/browser/sync"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/sync-test"
  },
  {
    "renderMode": 2,
    "route": "/angular/browser/sync-resync"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 25137, hash: '232d46870543eaed529ac73e5babf5086792cd4769a43cc5309e180186f6ac31', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17254, hash: '61c7d4aa3f8cc267b1e6022e2650fe69b1d15b6607e251f5fd1e647107697a95', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'home/index.html': {size: 116285, hash: '8d846bc2f3e71a285b576a37b14bfc979a82d675875b431b0871197620f92281', text: () => import('./assets-chunks/home_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 115009, hash: 'c75be6e1069b46390b927221ac590e2035c4cc54f3eb4671d4523a903a5fd1c2', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 157032, hash: 'e082ac0d1bf44d102fbc7f892c454f14cf3141748aa259eec2485199217cb789', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 109337, hash: 'e5a138d82219a28b62d0eed772b2490570b543277f7be35865d89dee6497cf99', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes-grid/index.html': {size: 121185, hash: '93a91ad8872e8c16aabd926ba772920cabef3310893664a28041d3e94a8813d0', text: () => import('./assets-chunks/loto_loto-boxes-grid_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 114960, hash: '14eaf65e07c2371261ea31e559145027ee29a73196a9549866b6cc2f9d8fbec9', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 184019, hash: 'a34a8f516fe502cd501183764d1b30d8b1e69a425a50f31a66a367b4a1a42a8a', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'loto/esp-devices/index.html': {size: 110708, hash: '44660347a9a4664313836e79456081f0faedd74ef9ce5ff811541f6e66c90ff1', text: () => import('./assets-chunks/loto_esp-devices_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 108774, hash: '1cd1c3904da480130f348c4c26c1fc0f76a93aee2e2e6a34a7d7ca30564fd710', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 101435, hash: 'cae21ff80bce382c86141806c936911fccdcea166847b846d514e1819a1857db', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 120571, hash: '72c18783bfb21e7f032d02c0246b012fb9f2e25ade6c8e38072ddaead6612e2c', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'loto-builder/index.html': {size: 192107, hash: 'dcf5feb20c63c3002b2f093d70fc0ca1fb7c5a99b07e3e55c7a80309a110da58', text: () => import('./assets-chunks/loto-builder_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 107612, hash: 'f2aadc89bb61f1c934215f8b2726cccb1404f8bb60497204f898f421323ee150', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 107648, hash: 'eafe34b54435aca1cfebd3f8197cd6834848146de9f1a26ee0b6a528a005b22b', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 107596, hash: '27441f47fd57b0e12e7188b668af5e1d1ad20adce6fe3ed3230a56b49244b700', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 105740, hash: '9126bf688b548f7b7e6c27a2bc10d5cbd3a2c682415cb241e0cd469c2aaa1313', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 114637, hash: '859ef6e1a20be39d11d5ce04e85673cb492f8452b25e1f1ce89609096a48d2c2', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 108200, hash: '992ab277542551e03cc852f812995e15da802ece9697548e54bc3878be5bd587', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'form-designer/preview/index.html': {size: 110654, hash: 'be9bde10cbacba4ef7fd5b64d245412979cd22b71306aebd356820988711dfdc', text: () => import('./assets-chunks/form-designer_preview_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 124234, hash: '2ceccf777da4709e25ef2167ca00067fce8a48a738f090b987d6d22b9a20af56', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 59056, hash: '11c82d07cd160540a34b962fc48203976a8f20a93b25d33dd5fbe551d343acac', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'loto-standard/index.html': {size: 273735, hash: '8b17f1e7b2d99dacaa389f57a3657ddd50d6cb79ef0361a50f60d79e985e7e12', text: () => import('./assets-chunks/loto-standard_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 105280, hash: '7a324eaf131da9334737921746f3294e04e441454a65dcb85116613244fbbc0a', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'admin/index.html': {size: 105801, hash: '519a50f1e996260d40c91fdf6760f0a1abf1bce07e7c371674f4a5afadd97225', text: () => import('./assets-chunks/admin_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 102910, hash: 'bed2d3954fc2a612414db472434b12505324a8b7ba76657da8b9791072b84625', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'sync-test/index.html': {size: 112702, hash: '6d16f297aeb2dd0eca1d922d517c1ca0315e8bc0e4fdd04f91f24e431de8eb68', text: () => import('./assets-chunks/sync-test_index_html.mjs').then(m => m.default)},
    'sync-resync/index.html': {size: 112171, hash: '64dc86f143cfff5aef6a03f1c6abfb59314177ef9d3d3ed9b5bbe6f45488b6f7', text: () => import('./assets-chunks/sync-resync_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 120144, hash: 'ec059a163b34c629c851b188356a13c4d394a6f15dad3c47e628d6a8cfe95a9d', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'styles-7VYHPHOB.css': {size: 28858, hash: 'm4VI6V+Txag', text: () => import('./assets-chunks/styles-7VYHPHOB_css.mjs').then(m => m.default)}
  },
};
