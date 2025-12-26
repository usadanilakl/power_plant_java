export default `<!DOCTYPE html><html lang="en"><head>
  <meta charset="utf-8">
  <title>Frontend</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&amp;display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
<link rel="stylesheet" href="styles.css"><style ng-app-id="ng">

.overlay[_ngcontent-ng-c517923000] {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
}
.message-box[_ngcontent-ng-c517923000] {
  padding: 15px 25px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  font-size: 1.1rem;
  max-width: 80%;
  text-align: center;
  cursor: pointer;
  -webkit-user-select: none;
  user-select: none;
  transition: background-color 0.3s ease, color 0.3s ease;
}
.message-box.red[_ngcontent-ng-c517923000] {
  background-color: #c75c5c;
  color: #fff5f5;
}
.message-box.green[_ngcontent-ng-c517923000] {
  background-color: #5c9575;
  color: #f1fbf7;
}
.message-box.white[_ngcontent-ng-c517923000] {
  background-color: #f5f5f5;
  color: #333;
}
.message-box.yellow[_ngcontent-ng-c517923000] {
  background-color: #d4c66d;
  color: #2f2e18;
}
/*# sourceMappingURL=/global-message.component.css.map */</style><style ng-app-id="ng">

app-main-layout[_ngcontent-ng-c740111586] {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 100%;
  width: 100%;
  overflow: hidden;
}
.header-menus[_ngcontent-ng-c740111586] {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 10px;
  box-sizing: border-box;
}
.menu-container[_ngcontent-ng-c740111586] {
  width: 100%;
  padding: 10px 15px;
  margin-bottom: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}
.left-menu-container[_ngcontent-ng-c740111586] {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 100%;
  width: 100%;
  overflow: hidden;
}
.menu-container[_ngcontent-ng-c740111586]:first-child {
  background-color: rgba(2, 43, 97, 0.644);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
}
.menu-container[_ngcontent-ng-c740111586]:first-child     app-router-menu {
  --router-menu-text-color: white;
  --router-menu-text-hover-color: rgb(163, 201, 237);
}
.menu-container[_ngcontent-ng-c740111586]:last-child {
  background-color: rgba(2, 43, 97, 0.644);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
}
.menu-container[_ngcontent-ng-c740111586]:last-child     app-router-menu {
  --router-menu-text-color: white;
  --router-menu-text-hover-color: rgb(163, 201, 237);
}
.menu-container[_ngcontent-ng-c740111586]:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}
.menu-container[_ngcontent-ng-c740111586]     a {
  color: white;
  text-decoration: none;
  padding: 5px 10px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}
.menu-container[_ngcontent-ng-c740111586]     a:hover {
  background-color: rgba(255, 255, 255, 0.1);
}
/*# sourceMappingURL=/permit-builder-page.component.css.map */</style><style ng-app-id="ng">

.layout-container[_ngcontent-ng-c1302047649] {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
.header[_ngcontent-ng-c1302047649] {
  position: relative;
  background-color: #3f51b5;
  color: white;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-content[_ngcontent-ng-c1302047649] {
  flex-grow: 1;
}
.toggle-menu-btn[_ngcontent-ng-c1302047649] {
  position: absolute;
  bottom: 10px;
  left: 10px;
}
.content-wrapper[_ngcontent-ng-c1302047649] {
  display: flex;
  flex: 1;
  overflow: hidden;
}
.left-menu[_ngcontent-ng-c1302047649] {
  background-color: #f0f0f0;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
.resizer[_ngcontent-ng-c1302047649] {
  width: 5px;
  background-color: #ccc;
  cursor: col-resize;
}
.main-and-footer[_ngcontent-ng-c1302047649] {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}
.main-content[_ngcontent-ng-c1302047649] {
  flex: 1;
  overflow: auto;
}
.footer-resizer[_ngcontent-ng-c1302047649] {
  height: 5px;
  background-color: #ccc;
  cursor: row-resize;
}
.footer[_ngcontent-ng-c1302047649] {
  overflow: auto;
}
.clipboard-container[_ngcontent-ng-c1302047649] {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  cursor: move;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  background-color: white;
  max-width: 400px;
}
/*# sourceMappingURL=/main-layout.component.css.map */</style><style ng-app-id="ng">

[_nghost-ng-c3121708701] {
  --router-menu-text-color: inherit;
  --router-menu-text-hover-color: inherit;
}
.router-menu[_ngcontent-ng-c3121708701]   ul[_ngcontent-ng-c3121708701] {
  list-style-type: none;
  padding: 0;
  margin: 0;
}
.router-menu.column[_ngcontent-ng-c3121708701]   ul[_ngcontent-ng-c3121708701] {
  display: flex;
  flex-direction: column;
}
.router-menu.row[_ngcontent-ng-c3121708701]   ul[_ngcontent-ng-c3121708701] {
  display: flex;
  flex-direction: row;
}
.router-menu.row[_ngcontent-ng-c3121708701]   li[_ngcontent-ng-c3121708701] {
  margin-right: 15px;
}
.router-menu.column[_ngcontent-ng-c3121708701]   li[_ngcontent-ng-c3121708701] {
  margin-bottom: 10px;
}
.router-menu[_ngcontent-ng-c3121708701]   a[_ngcontent-ng-c3121708701] {
  text-decoration: none;
  color: var(--router-menu-text-color);
}
.router-menu[_ngcontent-ng-c3121708701]   a[_ngcontent-ng-c3121708701]:hover {
  color: var(--router-menu-text-hover-color);
}
/*# sourceMappingURL=/router-menu.component.css.map */</style><style ng-app-id="ng">

.clipboard-wrapper[_ngcontent-ng-c490724758] {
  position: relative;
}
.clipboard-icon-button[_ngcontent-ng-c490724758] {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: var(--accent-color);
  color: var(--header-text);
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
.clipboard-icon-button[_ngcontent-ng-c490724758]:hover {
  background-color: var(--accent-color-hover);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  transform: scale(1.05);
}
.item-badge[_ngcontent-ng-c490724758] {
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: #ff4444;
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}
.clipboard-container[_ngcontent-ng-c490724758] {
  position: fixed;
  right: 20px;
  bottom: 20px;
  width: 400px;
  max-height: 600px;
  background-color: var(--card-background);
  border-radius: 8px;
  box-shadow: var(--card-shadow);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  border: 1px solid var(--border-color);
}
.clipboard-header[_ngcontent-ng-c490724758] {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--header-background);
  color: var(--header-text);
  border-radius: 8px 8px 0 0;
}
.clipboard-header[_ngcontent-ng-c490724758]   h3[_ngcontent-ng-c490724758] {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}
.close-button[_ngcontent-ng-c490724758] {
  background: none;
  border: none;
  color: var(--header-text);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}
.close-button[_ngcontent-ng-c490724758]:hover {
  background-color: rgba(255, 255, 255, 0.2);
}
.clipboard-content[_ngcontent-ng-c490724758] {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}
.sections-tabs[_ngcontent-ng-c490724758] {
  display: flex;
  gap: 4px;
  padding: 8px;
  border-bottom: 1px solid var(--border-color);
  overflow-x: auto;
  background-color: var(--secondary-background);
  flex-shrink: 0;
}
.section-tab[_ngcontent-ng-c490724758] {
  padding: 6px 12px;
  border: none;
  background-color: var(--secondary-background);
  color: var(--secondary-text);
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
  font-size: 12px;
  transition: all 0.2s ease;
  border: 1px solid var(--border-color);
}
.section-tab[_ngcontent-ng-c490724758]:hover {
  background-color: var(--hover-color);
  border-color: var(--accent-color);
}
.section-tab.active[_ngcontent-ng-c490724758] {
  background-color: var(--accent-color);
  color: var(--header-text);
  border-color: var(--accent-color);
}
.section-count[_ngcontent-ng-c490724758] {
  font-size: 11px;
  opacity: 0.8;
  margin-left: 4px;
}
.section-items[_ngcontent-ng-c490724758] {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}
.section-actions[_ngcontent-ng-c490724758] {
  display: flex;
  gap: 8px;
  padding: 8px;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--secondary-background);
}
.action-button[_ngcontent-ng-c490724758] {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid var(--border-color);
  background-color: var(--card-background);
  color: var(--primary-text);
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all 0.2s ease;
}
.action-button[_ngcontent-ng-c490724758]:hover:not(:disabled) {
  background-color: var(--hover-color);
  border-color: var(--accent-color);
}
.action-button[_ngcontent-ng-c490724758]:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.action-button[_ngcontent-ng-c490724758]   mat-icon[_ngcontent-ng-c490724758] {
  font-size: 16px;
  width: 16px;
  height: 16px;
}
.items-list[_ngcontent-ng-c490724758] {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}
.clipboard-item[_ngcontent-ng-c490724758] {
  display: flex;
  gap: 8px;
  padding: 8px;
  margin-bottom: 8px;
  background-color: var(--secondary-background);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  transition: all 0.2s ease;
  height: 100px;
  min-height: 100px;
}
.clipboard-item[_ngcontent-ng-c490724758]:hover {
  background-color: var(--hover-color);
  border-color: var(--accent-color);
}
.item-content[_ngcontent-ng-c490724758] {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
  min-height: 0;
}
.item-content[_ngcontent-ng-c490724758]::-webkit-scrollbar {
  display: none;
}
.item-content[_ngcontent-ng-c490724758]   pre[_ngcontent-ng-c490724758] {
  margin: 0;
  font-size: 11px;
  color: var(--primary-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: pre-wrap;
  word-break: break-word;
}
.item-actions[_ngcontent-ng-c490724758] {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}
.item-action-button[_ngcontent-ng-c490724758] {
  padding: 4px;
  border: none;
  background-color: transparent;
  color: var(--secondary-text);
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}
.item-action-button[_ngcontent-ng-c490724758]:hover {
  background-color: var(--hover-color);
  color: var(--accent-color);
}
.item-action-button[_ngcontent-ng-c490724758]   mat-icon[_ngcontent-ng-c490724758] {
  font-size: 16px;
  width: 16px;
  height: 16px;
}
.empty-state[_ngcontent-ng-c490724758] {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  color: var(--secondary-text);
  text-align: center;
}
.empty-state[_ngcontent-ng-c490724758]   mat-icon[_ngcontent-ng-c490724758] {
  font-size: 48px;
  width: 48px;
  height: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}
.empty-state[_ngcontent-ng-c490724758]   p[_ngcontent-ng-c490724758] {
  margin: 0;
  font-size: 14px;
}
.items-list[_ngcontent-ng-c490724758]::-webkit-scrollbar {
  width: 6px;
}
.items-list[_ngcontent-ng-c490724758]::-webkit-scrollbar-track {
  background: var(--secondary-background);
  border-radius: 3px;
}
.items-list[_ngcontent-ng-c490724758]::-webkit-scrollbar-thumb {
  background: var(--accent-color);
  border-radius: 3px;
}
.items-list[_ngcontent-ng-c490724758]::-webkit-scrollbar-thumb:hover {
  background: var(--accent-color-hover);
}
@media (max-width: 768px) {
  .clipboard-container[_ngcontent-ng-c490724758] {
    width: 90vw;
    max-width: 400px;
    max-height: 70vh;
    right: 10px;
    bottom: 10px;
  }
}
@media (max-width: 480px) {
  .clipboard-container[_ngcontent-ng-c490724758] {
    width: 95vw;
    max-height: 80vh;
    right: 5px;
    bottom: 5px;
  }
  .section-tab[_ngcontent-ng-c490724758] {
    font-size: 11px;
    padding: 4px 8px;
  }
  .action-button[_ngcontent-ng-c490724758] {
    font-size: 11px;
    padding: 4px 6px;
  }
}
/*# sourceMappingURL=/clipboard.component.css.map */</style><style ng-app-id="ng">.cdk-visually-hidden{border:0;clip:rect(0 0 0 0);height:1px;margin:-1px;overflow:hidden;padding:0;position:absolute;width:1px;white-space:nowrap;outline:0;-webkit-appearance:none;-moz-appearance:none;left:0}[dir=rtl] .cdk-visually-hidden{left:auto;right:0}
</style><style ng-app-id="ng">mat-icon,mat-icon.mat-primary,mat-icon.mat-accent,mat-icon.mat-warn{color:var(--mat-icon-color, inherit)}.mat-icon{-webkit-user-select:none;user-select:none;background-repeat:no-repeat;display:inline-block;fill:currentColor;height:24px;width:24px;overflow:hidden}.mat-icon.mat-icon-inline{font-size:inherit;height:inherit;line-height:inherit;width:inherit}.mat-icon.mat-ligature-font[fontIcon]::before{content:attr(fontIcon)}[dir=rtl] .mat-icon-rtl-mirror{transform:scale(-1, 1)}.mat-form-field:not(.mat-form-field-appearance-legacy) .mat-form-field-prefix .mat-icon,.mat-form-field:not(.mat-form-field-appearance-legacy) .mat-form-field-suffix .mat-icon{display:block}.mat-form-field:not(.mat-form-field-appearance-legacy) .mat-form-field-prefix .mat-icon-button .mat-icon,.mat-form-field:not(.mat-form-field-appearance-legacy) .mat-form-field-suffix .mat-icon-button .mat-icon{margin:auto}
</style></head>
<body class="mat-typography"><!--nghm--><script type="text/javascript" id="ng-event-dispatch-contract">(()=>{function p(t,n,r,o,e,i,f,m){return{eventType:t,event:n,targetElement:r,eic:o,timeStamp:e,eia:i,eirp:f,eiack:m}}function u(t){let n=[],r=e=>{n.push(e)};return{c:t,q:n,et:[],etc:[],d:r,h:e=>{r(p(e.type,e,e.target,t,Date.now()))}}}function s(t,n,r){for(let o=0;o<n.length;o++){let e=n[o];(r?t.etc:t.et).push(e),t.c.addEventListener(e,t.h,r)}}function c(t,n,r,o,e=window){let i=u(t);e._ejsas||(e._ejsas={}),e._ejsas[n]=i,s(i,r),s(i,o,!0)}window.__jsaction_bootstrap=c;})();
</script><script>window.__jsaction_bootstrap(document.body,"ng",["click","mousedown"],[]);</script>
  <app-root ng-version="19.2.5" ngh="8" ng-server-context="ssg"><router-outlet></router-outlet><app-permit-builder-page _nghost-ng-c740111586="" ngh="5"><app-main-layout _ngcontent-ng-c740111586="" _nghost-ng-c1302047649="" ngh="2"><div _ngcontent-ng-c1302047649="" class="layout-container"><header _ngcontent-ng-c1302047649="" class="header"><div _ngcontent-ng-c1302047649="" class="header-content"><!--container--><h1 _ngcontent-ng-c1302047649="">Jackson Generation</h1><!--container--><div _ngcontent-ng-c740111586="" class="header-menus"><div _ngcontent-ng-c740111586="" class="menu-container"><app-router-menu _ngcontent-ng-c740111586="" _nghost-ng-c3121708701="" ng-reflect-layout="row" ngh="3"><nav _ngcontent-ng-c3121708701="" class="router-menu row" ng-reflect-ng-class="row"><ul _ngcontent-ng-c3121708701=""><li _ngcontent-ng-c3121708701=""><a _ngcontent-ng-c3121708701="" ng-reflect-router-link="/" href="/" jsaction="click:;">Home</a></li><li _ngcontent-ng-c3121708701=""><a _ngcontent-ng-c3121708701="" ng-reflect-router-link="/loto" href="/loto" jsaction="click:;">LOTO</a></li><li _ngcontent-ng-c3121708701=""><a _ngcontent-ng-c3121708701="" ng-reflect-router-link="/loto-points" href="/loto-points" jsaction="click:;">LOTO Points</a></li><li _ngcontent-ng-c3121708701=""><a _ngcontent-ng-c3121708701="" ng-reflect-router-link="/tag-number" href="/tag-number" jsaction="click:;">Create New Tag</a></li><li _ngcontent-ng-c3121708701=""><a _ngcontent-ng-c3121708701="" ng-reflect-router-link="/file" href="/file" jsaction="click:;">View Files</a></li><li _ngcontent-ng-c3121708701=""><a _ngcontent-ng-c3121708701="" ng-reflect-router-link="/print" href="/print" jsaction="click:;">Print</a></li><li _ngcontent-ng-c3121708701=""><a _ngcontent-ng-c3121708701="" ng-reflect-router-link="/backup" href="/backup" jsaction="click:;">Backup</a></li><li _ngcontent-ng-c3121708701=""><a _ngcontent-ng-c3121708701="" ng-reflect-router-link="/scheduler" href="/scheduler" jsaction="click:;">Scheduler</a></li><li _ngcontent-ng-c3121708701=""><a _ngcontent-ng-c3121708701="" ng-reflect-router-link="/permit-builder" href="/permit-builder" jsaction="click:;">Permit Builder</a></li><li _ngcontent-ng-c3121708701=""><a _ngcontent-ng-c3121708701="" ng-reflect-router-link="/form-designer" href="/form-designer" jsaction="click:;">Form Designer</a></li><!--container--></ul><!--container--><!--container--></nav></app-router-menu></div><div _ngcontent-ng-c740111586="" class="menu-container"><app-router-menu _ngcontent-ng-c740111586="" _nghost-ng-c3121708701="" ng-reflect-menu-items="[object Object],[object Object" ng-reflect-layout="row" ngh="4"><nav _ngcontent-ng-c3121708701="" class="router-menu row" ng-reflect-ng-class="row"><ul _ngcontent-ng-c3121708701=""><li _ngcontent-ng-c3121708701=""><a _ngcontent-ng-c3121708701="" ng-reflect-router-link="./jobs" href="/permit-builder/jobs" jsaction="click:;">Job-Logs</a></li><li _ngcontent-ng-c3121708701=""><a _ngcontent-ng-c3121708701="" ng-reflect-router-link="./daily-packages" href="/permit-builder/daily-packages" jsaction="click:;">Daily Packages</a></li><li _ngcontent-ng-c3121708701=""><a _ngcontent-ng-c3121708701="" ng-reflect-router-link="./work-requests" href="/permit-builder/work-requests" jsaction="click:;">Work Requests</a></li><li _ngcontent-ng-c3121708701=""><a _ngcontent-ng-c3121708701="" ng-reflect-router-link="./safe-works" href="/permit-builder/safe-works" jsaction="click:;">Safe Works</a></li><li _ngcontent-ng-c3121708701=""><a _ngcontent-ng-c3121708701="" ng-reflect-router-link="./hot-works" href="/permit-builder/hot-works" jsaction="click:;">Hot Works</a></li><li _ngcontent-ng-c3121708701=""><a _ngcontent-ng-c3121708701="" ng-reflect-router-link="./confined-spaces" href="/permit-builder/confined-spaces" jsaction="click:;">Confined Spaces</a></li><!--container--></ul><!--container--><!--container--></nav></app-router-menu></div></div><!--ng-container--></div><button _ngcontent-ng-c1302047649="" class="toggle-menu-btn" jsaction="click:;"> Hide Menu </button></header><div _ngcontent-ng-c1302047649="" class="content-wrapper"><nav _ngcontent-ng-c1302047649="" id="leftMenu" class="left-menu" style="width: 400px;"><app-job-log-left-menu _ngcontent-ng-c740111586="" ngh="0"><p>job-log-left-menu works!</p></app-job-log-left-menu><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--ng-container--></nav><div _ngcontent-ng-c1302047649="" id="resizer" class="resizer" jsaction="mousedown:;"></div><div _ngcontent-ng-c1302047649="" class="main-and-footer"><main _ngcontent-ng-c1302047649="" class="main-content"><router-outlet _ngcontent-ng-c740111586=""></router-outlet><app-job-log ngh="0"><p>job-log works!</p></app-job-log><!--container--><!--ng-container--></main><!--container--></div></div><div _ngcontent-ng-c1302047649="" class="clipboard-container"><app-clipboard _ngcontent-ng-c1302047649="" _nghost-ng-c490724758="" ngh="1"><div _ngcontent-ng-c490724758="" class="clipboard-wrapper"><button _ngcontent-ng-c490724758="" class="mat-mdc-tooltip-trigger clipboard-icon-button" ng-reflect-message="Clipboard (0 items)" jsaction="click:;"><mat-icon _ngcontent-ng-c490724758="" role="img" class="mat-icon notranslate material-icons mat-ligature-font mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font" ngh="0">assignment</mat-icon><!--bindings={
  "ng-reflect-ng-if": "false"
}--></button><!--container--><!--bindings={
  "ng-reflect-ng-if": "true"
}--><!--bindings={
  "ng-reflect-ng-if": "false"
}--></div></app-clipboard></div></div></app-main-layout></app-permit-builder-page><!--container--><app-print-layout ngh="6"><!--container--></app-print-layout><app-global-message _nghost-ng-c517923000="" ngh="7"><!--container--></app-global-message></app-root>
<script src="polyfills.js" type="module"></script><script src="main.js" type="module"></script>

<script id="ng-state" type="application/json">{"__nghData__":[{},{"t":{"1":"t6","2":"t8"},"c":{"1":[{"i":"t6","r":2,"c":{"0":[],"3":[]},"n":{"2":"1f"},"t":{"3":"t7"}}],"2":[]}},{"t":{"3":"t26","4":"t27","18":"t28"},"c":{"3":[],"4":[{"i":"t27","r":1}],"18":[]}},{"t":{"1":"t9","2":"t11"},"c":{"1":[{"i":"t9","r":1,"t":{"2":"t10"},"c":{"2":[{"i":"t10","r":1,"x":10}]}}],"2":[]}},{"t":{"1":"t9","2":"t11"},"c":{"1":[{"i":"t9","r":1,"t":{"2":"t10"},"c":{"2":[{"i":"t10","r":1,"x":6}]}}],"2":[]}},{"n":{"1":"0f4n3","7":"0f2nf2","14":"0f2nfn2f2"},"e":{"1":1,"7":7,"14":3},"t":{"8":"t29","9":"t30","10":"t31","11":"t32","12":"t33","13":"t34"},"c":{"8":[{"i":"t29","r":1}],"9":[],"10":[],"11":[],"12":[],"13":[],"15":[{"i":"c1072808895","r":1}]}},{"t":{"0":"t18"},"c":{"0":[]}},{"t":{"0":"t19"},"c":{"0":[]}},{"c":{"0":[{"i":"c740111586","r":1}]}}]}</script></body></html>`;