
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
    "route": "/angular/browser/file-editor"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 730, hash: '25cafb1c2eb5cd0617f5017daca4ae50064e0ad565a49aedd2421e374370f7ae', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1021, hash: 'ce88382fb1498509e22de7f39647bbe064a71e0de6b20673d3714d23bbf88ad4', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'file/table/index.html': {size: 15351, hash: '895e1011768060fc7e826ea5b381f317954a610d711d93cb77e7ee9d2e24cb3b', text: () => import('./assets-chunks/file_table_index_html.mjs').then(m => m.default)},
    'loto/loto-points-active/index.html': {size: 11454, hash: '8ba21fe25e4fd001cec2af30fde7b61641a5bf39ea52275a521678d79f5851fb', text: () => import('./assets-chunks/loto_loto-points-active_index_html.mjs').then(m => m.default)},
    'loto/loto/index.html': {size: 10188, hash: 'd3627a81dd84e284acdce00424dca7b22331e377e149cf7d3a03cbd749bb6926', text: () => import('./assets-chunks/loto_loto_index_html.mjs').then(m => m.default)},
    'loto/loto-boxes/index.html': {size: 7684, hash: 'e70e8690226449c6e40eca03df4ae2a8295a7a5e5f7aee30813cd3cf0e53bc25', text: () => import('./assets-chunks/loto_loto-boxes_index_html.mjs').then(m => m.default)},
    'loto/locks/index.html': {size: 7645, hash: 'bf6b97149ded5e9895df593e3218b75568cc353a07a30acd337a8955990f5f8c', text: () => import('./assets-chunks/loto_locks_index_html.mjs').then(m => m.default)},
    'loto-points/index.html': {size: 9513, hash: '73d4a4124fff9ee7f07cea98f90d2fc34c42f4b64f6115290a53d9a3d330f0c0', text: () => import('./assets-chunks/loto-points_index_html.mjs').then(m => m.default)},
    'file/edit/index.html': {size: 23082, hash: '2c16d3f19342d0f7ee6dd7248057d75ae0c1fd84dd90d2f7d79bf1f84760ab9d', text: () => import('./assets-chunks/file_edit_index_html.mjs').then(m => m.default)},
    'print/index.html': {size: 1164, hash: '0733c19b37450d18b0b9fd205319a6c02459de2b07394cb4e09bb4eaab113522', text: () => import('./assets-chunks/print_index_html.mjs').then(m => m.default)},
    'tag-number/index.html': {size: 9847, hash: '1f5840016a6047f72c25cb2ec2f238d588332ce982af3f8310f8d9e930e49334', text: () => import('./assets-chunks/tag-number_index_html.mjs').then(m => m.default)},
    'loto/loto-points/index.html': {size: 10868, hash: '7b58fea843ca3ddaa9a9e3cc9ed2369e860816cf559eb8e5663362e562f2d08d', text: () => import('./assets-chunks/loto_loto-points_index_html.mjs').then(m => m.default)},
    'file-editor/index.html': {size: 13306, hash: 'bbe7577485838af261bfbcfc7694c10b07d4488f8d8a59d2bdfea203c77ed20d', text: () => import('./assets-chunks/file-editor_index_html.mjs').then(m => m.default)},
    'styles-SE6UKMVB.css': {size: 2550, hash: 'HQgC9XG/u4M', text: () => import('./assets-chunks/styles-SE6UKMVB_css.mjs').then(m => m.default)}
  },
};
