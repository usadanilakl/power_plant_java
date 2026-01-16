
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
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 25137, hash: 'e8d5bc8d8c79590f7c1b2aa75f5f7b7c83b5f3664e974e8cecf844439d8d8b6a', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17254, hash: 'bf865e2eb5761dd03d5a0d50346a1a997ff6ff1b2f33e8407299d467942be35b', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'home/index.html': {size: 110085, hash: 'd988988aa4c40a8695c874fe4979cef1c843947773a24362e7e90613a4524bbb', text: () => import('./assets-chunks/home_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 109630, hash: 'f8524179c736626027db0e7718492673c5e3b0cb079760fce17942a44a3feb86', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 172488, hash: 'e6729188f4e3a1b65a1bd7732cb3174b96964cd8cde017ec6c890c0316a212a8', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 104877, hash: '1f6e046ae20f568debced37dcb96b8a77af4a87f53f3ae1cff29bce173b6975e', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes-grid/index.html': {size: 117116, hash: 'c78cb6869408f83e4778359abda5cd8154401b83b3282238343e342ff656474f', text: () => import('./assets-chunks/loto_loto-boxes-grid_index_html.mjs').then(m => m.default)},
    'loto/esp-devices/index.html': {size: 106564, hash: '9fd18e2b6286ccc031bb3d80fd9dc6d5034b6fce895b3afd69e3ea60029a7fd2', text: () => import('./assets-chunks/loto_esp-devices_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 104844, hash: 'e977d22a7c13b20edce8025d99b75cba20a6ee70334df5d30235328c084cd79f', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 109988, hash: '1dea9ff78acf79709e4a82237943a7e7fcc571ad4324cfc36767532e2c78abe3', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 148183, hash: '053ea6e74d3e044523465577bb1577013be2e39363090b169de7c068e524cfd3', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto-builder/index.html': {size: 180044, hash: '60f3884d6f20b358310d666acf0442717f57faf5b2227b6a6f57ad462e4ce354', text: () => import('./assets-chunks/loto-builder_index_html.mjs').then(m => m.default)},
    'permit-builder/jobs/index.html': {size: 97649, hash: '28ad7f9251247e87a11356cd3329da3acae767dbc6843ef5f302fdfe9db8b196', text: () => import('./assets-chunks/permit-builder_jobs_index_html.mjs').then(m => m.default)},
    'permit-builder/work-requests/index.html': {size: 114766, hash: 'ad0fa39418ac01a0d68336537b22fc9e52b4508ebc951b26f1ab9f53446341ba', text: () => import('./assets-chunks/permit-builder_work-requests_index_html.mjs').then(m => m.default)},
    'permit-builder/safe-works/index.html': {size: 103200, hash: '8e00006e9a09cd3218f028ecfb2e81e86c2c9fcf0a8a25a52e3cbdb69aed860b', text: () => import('./assets-chunks/permit-builder_safe-works_index_html.mjs').then(m => m.default)},
    'loto-standard/index.html': {size: 265519, hash: 'ea490f0321fed92d3133c6472dcc3c41d43586ba3c6e1a200183a1b4469d5321', text: () => import('./assets-chunks/loto-standard_index_html.mjs').then(m => m.default)},
    'permit-builder/daily-packages/index.html': {size: 116557, hash: 'b0cef94dae98194912763aeebfbb51157b597051136e75b5cb3990f6f08e623d', text: () => import('./assets-chunks/permit-builder_daily-packages_index_html.mjs').then(m => m.default)},
    'scheduler/flow/index.html': {size: 100540, hash: '387186dea6dea4e09df63b2847fc3b3e7d95a2d85889b292b208b0baf244579f', text: () => import('./assets-chunks/scheduler_flow_index_html.mjs').then(m => m.default)},
    'permit-builder/confined-spaces/index.html': {size: 103221, hash: '46461dcc2f0f5a808fa1edcaf74c37756548b44999e64d04770aa3c1f9bdf9f9', text: () => import('./assets-chunks/permit-builder_confined-spaces_index_html.mjs').then(m => m.default)},
    'permit-builder/hot-works/index.html': {size: 103188, hash: 'b5b4d69ebf0857f7773c1559f5d293b3551d3383cf033778115252cadd6f9362', text: () => import('./assets-chunks/permit-builder_hot-works_index_html.mjs').then(m => m.default)},
    'scheduler/table/index.html': {size: 107685, hash: '8a6db5be4a02746766e6017992ba9f69eb28ff837b25a2754651666a990dca02', text: () => import('./assets-chunks/scheduler_table_index_html.mjs').then(m => m.default)},
    'form-designer/preview/index.html': {size: 105843, hash: '2dfbdd40c34bb80444f40c1113e1354d1b39c75b187e206911600b6a88992d1e', text: () => import('./assets-chunks/form-designer_preview_index_html.mjs').then(m => m.default)},
    'form-designer/forms/index.html': {size: 103869, hash: 'a98bae376f865ef55981100b2d001e8461dcc4af64de373d3a785f54c04e7664', text: () => import('./assets-chunks/form-designer_forms_index_html.mjs').then(m => m.default)},
    'form-designer/design/index.html': {size: 119903, hash: 'f7c1992540f0831af4150a3e50aa97cb8d17233ec57d003caa2fe1b5fd29f99a', text: () => import('./assets-chunks/form-designer_design_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 59056, hash: '8f5cf95aa3d6e93f618aed8e95bd0db59f9d6b7adfb9c74161cb3a0c4be94f18', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'backup/index.html': {size: 66135, hash: '5436748f28538f0e07487c76cc3c2714b85fbce4e15812114d92e5690ace7c49', text: () => import('./assets-chunks/backup_index_html.mjs').then(m => m.default)},
    'admin/index.html': {size: 67677, hash: '79333a76d1b7b7a1e94c3a5d8c37a473c9e966be16e2669bfe60cb21d03d5b9f', text: () => import('./assets-chunks/admin_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 101262, hash: '371cf21edd2f92dab7f682e2c06211352fdede1dd86938b5838215fd938e84e1', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'styles-7VYHPHOB.css': {size: 28858, hash: 'm4VI6V+Txag', text: () => import('./assets-chunks/styles-7VYHPHOB_css.mjs').then(m => m.default)}
  },
};
