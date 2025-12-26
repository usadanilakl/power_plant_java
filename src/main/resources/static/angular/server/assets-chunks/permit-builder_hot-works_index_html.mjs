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
/*# sourceMappingURL=/clipboard.component.css.map */</style><style ng-app-id="ng">

[_nghost-ng-c2764824898] {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 500px;
  width: 100%;
  overflow: hidden;
  flex: 1;
}
app-hot-work-table[_ngcontent-ng-c2764824898] {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 500px;
  width: 100%;
  overflow: hidden;
  flex: 1;
}
/*# sourceMappingURL=/hot-work-side-menu.component.css.map */</style><style ng-app-id="ng">

[_nghost-ng-c1776432842] {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 100%;
  width: 100%;
  overflow: hidden;
}
/*# sourceMappingURL=/hot-work-table.component.css.map */</style><style ng-app-id="ng">

[_nghost-ng-c2108134260] {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 100%;
  width: 100%;
  overflow: hidden;
}
.table-wrapper[_ngcontent-ng-c2108134260] {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  overflow: hidden;
}
.table-controls[_ngcontent-ng-c2108134260] {
  flex: 0 0 auto;
  padding: 10px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ddd;
}
.default-controls[_ngcontent-ng-c2108134260] {
  display: flex;
  flex-direction: column;
  width: 100%;
}
.button-row[_ngcontent-ng-c2108134260] {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
}
.button-row[_ngcontent-ng-c2108134260]   button[_ngcontent-ng-c2108134260] {
  margin-right: 10px;
}
.search-row[_ngcontent-ng-c2108134260] {
  width: 100%;
}
.search-input[_ngcontent-ng-c2108134260], 
.filter-input[_ngcontent-ng-c2108134260] {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 10px;
}
cdk-virtual-scroll-viewport.table-container[_ngcontent-ng-c2108134260] {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  overflow: auto;
  height: 100%;
}
.cdk-virtual-scroll-content-wrapper[_ngcontent-ng-c2108134260] {
  width: 100%;
  min-width: 100%;
}
table[_ngcontent-ng-c2108134260] {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}
thead[_ngcontent-ng-c2108134260] {
  position: sticky;
  top: 0;
  z-index: 2;
  background-color: #f8f8f8;
}
th[_ngcontent-ng-c2108134260] {
  position: sticky;
  top: 0;
  background-color: #f8f8f8;
  z-index: 1;
  box-shadow: 0 1px 0 0 #ddd;
  cursor: pointer;
}
thead[_ngcontent-ng-c2108134260]   tr[_ngcontent-ng-c2108134260]:nth-child(2)   th[_ngcontent-ng-c2108134260] {
  top: 41px;
}
th[_ngcontent-ng-c2108134260], 
td[_ngcontent-ng-c2108134260] {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
  white-space: nowrap;
}
.resizer[_ngcontent-ng-c2108134260] {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 5px;
  cursor: col-resize;
}
tbody[_ngcontent-ng-c2108134260]   tr[_ngcontent-ng-c2108134260] {
  cursor: pointer;
}
tbody[_ngcontent-ng-c2108134260]   tr[_ngcontent-ng-c2108134260]:hover {
  background-color: #f5f5f5;
}
.table-container[_ngcontent-ng-c2108134260]::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}
.table-container[_ngcontent-ng-c2108134260]::-webkit-scrollbar-thumb {
  border-radius: 5px;
  background-color: rgba(0, 0, 0, .5);
  -webkit-box-shadow: 0 0 1px rgba(255, 255, 255, .5);
}
.table-container[_ngcontent-ng-c2108134260] {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, .5) transparent;
}
tr.selected[_ngcontent-ng-c2108134260] {
  background-color: #e0f7fa;
  font-weight: bold;
}
tr.selected[_ngcontent-ng-c2108134260]:hover {
  background-color: #b2ebf2;
}
.highlighted[_ngcontent-ng-c2108134260] {
  background-color: #ffff99;
  transition: background-color 0.5s ease;
}
.ghost-row[_ngcontent-ng-c2108134260] {
  opacity: 0.5;
  background-color: #e0e0e0;
}
.dragging[_ngcontent-ng-c2108134260] {
  opacity: 0.9;
  background-color: #f0f0f0;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transform: scale(1.02);
  transition: all 0.2s ease;
  z-index: 1000;
  pointer-events: none;
  cursor: grabbing;
}
/*# sourceMappingURL=/table.component.css.map */</style><style ng-app-id="ng">cdk-virtual-scroll-viewport{display:block;position:relative;transform:translateZ(0)}.cdk-virtual-scrollable{overflow:auto;will-change:scroll-position;contain:strict}.cdk-virtual-scroll-content-wrapper{position:absolute;top:0;left:0;contain:content}[dir=rtl] .cdk-virtual-scroll-content-wrapper{right:0;left:auto}.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper{min-height:100%}.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper>dl:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper>ol:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper>table:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper>ul:not([cdkVirtualFor]){padding-left:0;padding-right:0;margin-left:0;margin-right:0;border-left-width:0;border-right-width:0;outline:none}.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper{min-width:100%}.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper>dl:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper>ol:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper>table:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper>ul:not([cdkVirtualFor]){padding-top:0;padding-bottom:0;margin-top:0;margin-bottom:0;border-top-width:0;border-bottom-width:0;outline:none}.cdk-virtual-scroll-spacer{height:1px;transform-origin:0 0;flex:0 0 auto}[dir=rtl] .cdk-virtual-scroll-spacer{transform-origin:100% 0}
</style><style ng-app-id="ng">

[_nghost-ng-c62076445] {
  display: block;
  height: 100%;
  width: 100%;
  overflow: hidden;
}
.form-container[_ngcontent-ng-c62076445] {
  height: 100%;
  width: 100%;
  overflow-y: auto;
  padding: 1rem;
  box-sizing: border-box;
}
/*# sourceMappingURL=/hot-work-form.component.css.map */</style><style ng-app-id="ng">.cdk-visually-hidden{border:0;clip:rect(0 0 0 0);height:1px;margin:-1px;overflow:hidden;padding:0;position:absolute;width:1px;white-space:nowrap;outline:0;-webkit-appearance:none;-moz-appearance:none;left:0}[dir=rtl] .cdk-visually-hidden{left:auto;right:0}
</style><style ng-app-id="ng">mat-icon,mat-icon.mat-primary,mat-icon.mat-accent,mat-icon.mat-warn{color:var(--mat-icon-color, inherit)}.mat-icon{-webkit-user-select:none;user-select:none;background-repeat:no-repeat;display:inline-block;fill:currentColor;height:24px;width:24px;overflow:hidden}.mat-icon.mat-icon-inline{font-size:inherit;height:inherit;line-height:inherit;width:inherit}.mat-icon.mat-ligature-font[fontIcon]::before{content:attr(fontIcon)}[dir=rtl] .mat-icon-rtl-mirror{transform:scale(-1, 1)}.mat-form-field:not(.mat-form-field-appearance-legacy) .mat-form-field-prefix .mat-icon,.mat-form-field:not(.mat-form-field-appearance-legacy) .mat-form-field-suffix .mat-icon{display:block}.mat-form-field:not(.mat-form-field-appearance-legacy) .mat-form-field-prefix .mat-icon-button .mat-icon,.mat-form-field:not(.mat-form-field-appearance-legacy) .mat-form-field-suffix .mat-icon-button .mat-icon{margin:auto}
</style><style ng-app-id="ng">

[_nghost-ng-c1799638334] {
  display: block;
  font-family: Arial, sans-serif;
  max-width: 100%;
  margin: 0 auto;
}
form[_ngcontent-ng-c1799638334] {
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  gap: 30px;
}
.form-layout-row[_ngcontent-ng-c1799638334] {
  display: flex;
  flex-wrap: nowrap;
  margin: -10px;
  overflow-x: auto;
  margin-bottom: 15px;
}
.form-field-layout-row[_ngcontent-ng-c1799638334] {
  flex: 0 0 auto;
  width: 200px;
  margin: 10px;
  margin-bottom: 15px;
}
.form-layout-column[_ngcontent-ng-c1799638334] {
  display: flex;
  flex-direction: column;
  margin-bottom: 15px;
}
.form-field-layout-column[_ngcontent-ng-c1799638334] {
  margin-bottom: 20px;
}
.form-layout-reactive[_ngcontent-ng-c1799638334] {
  display: flex;
  flex-wrap: wrap;
  margin: 10px;
  gap: 10px;
}
.form-layout-grid[_ngcontent-ng-c1799638334] {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.form-field-layout-reactive[_ngcontent-ng-c1799638334] {
  flex: 1 1 100%;
}
.group-title[_ngcontent-ng-c1799638334] {
  font-size: 1.2em;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
  padding-bottom: 5px;
  border-bottom: 1px solid #ccc;
  width: 100%;
}
@media (min-width: 600px) {
  .form-field-layout-reactive[_ngcontent-ng-c1799638334] {
    flex: 1 1 calc(50% - 20px);
  }
}
@media (min-width: 900px) {
  .form-field-layout-reactive[_ngcontent-ng-c1799638334] {
    flex: 1 1 calc(33.333% - 20px);
  }
}
button[_ngcontent-ng-c1799638334] {
  padding: 10px 20px;
  font-size: 16px;
  color: #fff;
  background-color: #4CAF50;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}
button[_ngcontent-ng-c1799638334]:hover {
  background-color: #45a049;
}
button[type=button][_ngcontent-ng-c1799638334] {
  background-color: #f44336;
  margin-left: 10px;
}
button[type=button][_ngcontent-ng-c1799638334]:hover {
  background-color: #d32f2f;
}
@media (max-width: 600px) {
  .form-layout-row[_ngcontent-ng-c1799638334], 
   .form-layout-reactive[_ngcontent-ng-c1799638334] {
    flex-direction: column;
  }
  .form-field-layout-row[_ngcontent-ng-c1799638334], 
   .form-field-layout-reactive[_ngcontent-ng-c1799638334] {
    flex: 1 1 100%;
  }
  .form-layout-grid[_ngcontent-ng-c1799638334] {
    grid-template-columns: 1fr;
  }
  .error-message[_ngcontent-ng-c1799638334] {
    color: red;
    font-size: 0.8em;
    margin-top: 5px;
  }
}
/*# sourceMappingURL=/smart-form.component.css.map */</style><style ng-app-id="ng">/* src/app/shared/form-input/form-input.component.css */
.form-input {
  font-family: Arial, sans-serif;
  margin-bottom: 20px;
  position: relative;
}
.form-input label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #333;
}
.form-input input {
  width: 100%;
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}
.form-input input:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 5px rgba(76, 175, 80, 0.5);
}
.form-input input::placeholder {
  color: #999;
}
.form-input input[type=number] {
  -moz-appearance: textfield;
}
.form-input input[type=number]::-webkit-outer-spin-button,
.form-input input[type=number]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.form-input input[type=date] {
  padding: 8px 10px;
}
/*# sourceMappingURL=/form-input.component.css.map */
</style><style ng-app-id="ng">

.styled-checkbox-container[_ngcontent-ng-c2778646442] {
  display: inline-block;
  position: relative;
}
.hidden-checkbox[_ngcontent-ng-c2778646442] {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 100%;
  width: 100%;
  left: 0;
  top: 0;
  margin: 0;
  padding: 0;
  z-index: 1;
}
label[_ngcontent-ng-c2778646442] {
  display: inline-block;
  padding: 8px 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  background-color: #f9f9f9;
  color: #333;
  transition:
    background-color 0.2s,
    color 0.2s,
    border-color 0.2s;
  -webkit-user-select: none;
  user-select: none;
}
.hidden-checkbox[_ngcontent-ng-c2778646442]:focus    + label[_ngcontent-ng-c2778646442] {
  outline: 2px solid #007bff;
  outline-offset: 2px;
}
label[_ngcontent-ng-c2778646442]:hover {
  background-color: #e9e9e9;
}
label.checked[_ngcontent-ng-c2778646442] {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}
label.disabled[_ngcontent-ng-c2778646442] {
  background-color: #e9ecef;
  color: #6c757d;
  cursor: not-allowed;
  border-color: #ced4da;
}
.hidden-checkbox[_ngcontent-ng-c2778646442]:disabled {
  cursor: not-allowed;
}
/*# sourceMappingURL=/checkbox-only-label.component.css.map */</style></head>
<body class="mat-typography"><!--nghm--><script type="text/javascript" id="ng-event-dispatch-contract">(()=>{function p(t,n,r,o,e,i,f,m){return{eventType:t,event:n,targetElement:r,eic:o,timeStamp:e,eia:i,eirp:f,eiack:m}}function u(t){let n=[],r=e=>{n.push(e)};return{c:t,q:n,et:[],etc:[],d:r,h:e=>{r(p(e.type,e,e.target,t,Date.now()))}}}function s(t,n,r){for(let o=0;o<n.length;o++){let e=n[o];(r?t.etc:t.et).push(e),t.c.addEventListener(e,t.h,r)}}function c(t,n,r,o,e=window){let i=u(t);e._ejsas||(e._ejsas={}),e._ejsas[n]=i,s(i,r),s(i,o,!0)}window.__jsaction_bootstrap=c;})();
</script><script>window.__jsaction_bootstrap(document.body,"ng",["click","mousedown","input","compositionstart","compositionend","submit","contextmenu","change"],["blur"]);</script>
  <app-root ng-version="19.2.5" ngh="13" ng-server-context="ssg"><router-outlet></router-outlet><app-permit-builder-page _nghost-ng-c740111586="" ngh="10"><app-main-layout _ngcontent-ng-c740111586="" _nghost-ng-c1302047649="" ngh="2"><div _ngcontent-ng-c1302047649="" class="layout-container"><header _ngcontent-ng-c1302047649="" class="header"><div _ngcontent-ng-c1302047649="" class="header-content"><!--container--><h1 _ngcontent-ng-c1302047649="">Jackson Generation</h1><!--container--><div _ngcontent-ng-c740111586="" class="header-menus"><div _ngcontent-ng-c740111586="" class="menu-container"><app-router-menu _ngcontent-ng-c740111586="" _nghost-ng-c3121708701="" ng-reflect-layout="row" ngh="3"><nav _ngcontent-ng-c3121708701="" class="router-menu row" ng-reflect-ng-class="row"><ul _ngcontent-ng-c3121708701=""><li _ngcontent-ng-c3121708701=""><a _ngcontent-ng-c3121708701="" ng-reflect-router-link="/" href="/" jsaction="click:;">Home</a></li><li _ngcontent-ng-c3121708701=""><a _ngcontent-ng-c3121708701="" ng-reflect-router-link="/loto" href="/loto" jsaction="click:;">LOTO</a></li><li _ngcontent-ng-c3121708701=""><a _ngcontent-ng-c3121708701="" ng-reflect-router-link="/loto-points" href="/loto-points" jsaction="click:;">LOTO Points</a></li><li _ngcontent-ng-c3121708701=""><a _ngcontent-ng-c3121708701="" ng-reflect-router-link="/tag-number" href="/tag-number" jsaction="click:;">Create New Tag</a></li><li _ngcontent-ng-c3121708701=""><a _ngcontent-ng-c3121708701="" ng-reflect-router-link="/file" href="/file" jsaction="click:;">View Files</a></li><li _ngcontent-ng-c3121708701=""><a _ngcontent-ng-c3121708701="" ng-reflect-router-link="/print" href="/print" jsaction="click:;">Print</a></li><li _ngcontent-ng-c3121708701=""><a _ngcontent-ng-c3121708701="" ng-reflect-router-link="/backup" href="/backup" jsaction="click:;">Backup</a></li><li _ngcontent-ng-c3121708701=""><a _ngcontent-ng-c3121708701="" ng-reflect-router-link="/scheduler" href="/scheduler" jsaction="click:;">Scheduler</a></li><li _ngcontent-ng-c3121708701=""><a _ngcontent-ng-c3121708701="" ng-reflect-router-link="/permit-builder" href="/permit-builder" jsaction="click:;">Permit Builder</a></li><li _ngcontent-ng-c3121708701=""><a _ngcontent-ng-c3121708701="" ng-reflect-router-link="/form-designer" href="/form-designer" jsaction="click:;">Form Designer</a></li><!--container--></ul><!--container--><!--container--></nav></app-router-menu></div><div _ngcontent-ng-c740111586="" class="menu-container"><app-router-menu _ngcontent-ng-c740111586="" _nghost-ng-c3121708701="" ng-reflect-menu-items="[object Object],[object Object" ng-reflect-layout="row" ngh="4"><nav _ngcontent-ng-c3121708701="" class="router-menu row" ng-reflect-ng-class="row"><ul _ngcontent-ng-c3121708701=""><li _ngcontent-ng-c3121708701=""><a _ngcontent-ng-c3121708701="" ng-reflect-router-link="./jobs" href="/permit-builder/jobs" jsaction="click:;">Job-Logs</a></li><li _ngcontent-ng-c3121708701=""><a _ngcontent-ng-c3121708701="" ng-reflect-router-link="./daily-packages" href="/permit-builder/daily-packages" jsaction="click:;">Daily Packages</a></li><li _ngcontent-ng-c3121708701=""><a _ngcontent-ng-c3121708701="" ng-reflect-router-link="./work-requests" href="/permit-builder/work-requests" jsaction="click:;">Work Requests</a></li><li _ngcontent-ng-c3121708701=""><a _ngcontent-ng-c3121708701="" ng-reflect-router-link="./safe-works" href="/permit-builder/safe-works" jsaction="click:;">Safe Works</a></li><li _ngcontent-ng-c3121708701=""><a _ngcontent-ng-c3121708701="" ng-reflect-router-link="./hot-works" href="/permit-builder/hot-works" jsaction="click:;">Hot Works</a></li><li _ngcontent-ng-c3121708701=""><a _ngcontent-ng-c3121708701="" ng-reflect-router-link="./confined-spaces" href="/permit-builder/confined-spaces" jsaction="click:;">Confined Spaces</a></li><!--container--></ul><!--container--><!--container--></nav></app-router-menu></div></div><!--ng-container--></div><button _ngcontent-ng-c1302047649="" class="toggle-menu-btn" jsaction="click:;"> Hide Menu </button></header><div _ngcontent-ng-c1302047649="" class="content-wrapper"><nav _ngcontent-ng-c1302047649="" id="leftMenu" class="left-menu" style="width: 400px;"><!--container--><!--container--><!--container--><!--container--><app-hot-work-side-menu _ngcontent-ng-c740111586="" _nghost-ng-c2764824898="" ngh="0"><app-hot-work-table _ngcontent-ng-c2764824898="" _nghost-ng-c1776432842="" ngh="0"><app-shared-table _ngcontent-ng-c1776432842="" _nghost-ng-c2108134260="" ng-reflect-items="[object Object]" ng-reflect-columns="[object Object],[object Object" ng-reflect-click-callback="function () { [native code] }" ngh="5"><div _ngcontent-ng-c2108134260="" class="table-wrapper"><div _ngcontent-ng-c2108134260="" class="table-controls"><div _ngcontent-ng-c2108134260="" class="default-controls"><div _ngcontent-ng-c2108134260="" class="button-row"><button _ngcontent-ng-c2108134260="" jsaction="click:;">Delete Selected</button></div><div _ngcontent-ng-c2108134260="" class="search-row"><input _ngcontent-ng-c2108134260="" appcopypaste="" type="text" placeholder="Global Search..." class="search-input ng-untouched ng-pristine ng-valid" ng-reflect-model="" value="" jsaction="input:;blur:;compositionstart:;compositionend:;click:;"></div></div></div><cdk-virtual-scroll-viewport _ngcontent-ng-c2108134260="" itemsize="50" class="cdk-virtual-scroll-viewport table-container cdk-virtual-scrollable cdk-virtual-scroll-orientation-vertical" ng-reflect-item-size="50" ngh="0"><div class="cdk-virtual-scroll-content-wrapper"><table _ngcontent-ng-c2108134260=""><thead _ngcontent-ng-c2108134260=""><tr _ngcontent-ng-c2108134260=""><th _ngcontent-ng-c2108134260="" jsaction="click:;"> Date <div _ngcontent-ng-c2108134260="" class="resizer"></div></th><th _ngcontent-ng-c2108134260="" jsaction="click:;"> Location <div _ngcontent-ng-c2108134260="" class="resizer"></div></th><th _ngcontent-ng-c2108134260="" jsaction="click:;"> Work Scope <div _ngcontent-ng-c2108134260="" class="resizer"></div></th><th _ngcontent-ng-c2108134260="" jsaction="click:;"> Foreman <div _ngcontent-ng-c2108134260="" class="resizer"></div></th><th _ngcontent-ng-c2108134260="" jsaction="click:;"> Fire Watch <div _ngcontent-ng-c2108134260="" class="resizer"></div></th><!--container--></tr><tr _ngcontent-ng-c2108134260=""><th _ngcontent-ng-c2108134260=""><input _ngcontent-ng-c2108134260="" appcopypaste="" type="text" class="filter-input ng-untouched ng-pristine ng-valid" placeholder="Filter Date" value="" jsaction="input:;blur:;compositionstart:;compositionend:;click:;"></th><th _ngcontent-ng-c2108134260=""><input _ngcontent-ng-c2108134260="" appcopypaste="" type="text" class="filter-input ng-untouched ng-pristine ng-valid" placeholder="Filter Location" value="" jsaction="input:;blur:;compositionstart:;compositionend:;click:;"></th><th _ngcontent-ng-c2108134260=""><input _ngcontent-ng-c2108134260="" appcopypaste="" type="text" class="filter-input ng-untouched ng-pristine ng-valid" placeholder="Filter Work Scope" value="" jsaction="input:;blur:;compositionstart:;compositionend:;click:;"></th><th _ngcontent-ng-c2108134260=""><input _ngcontent-ng-c2108134260="" appcopypaste="" type="text" class="filter-input ng-untouched ng-pristine ng-valid" placeholder="Filter Foreman" value="" jsaction="input:;blur:;compositionstart:;compositionend:;click:;"></th><th _ngcontent-ng-c2108134260=""><input _ngcontent-ng-c2108134260="" appcopypaste="" type="text" class="filter-input ng-untouched ng-pristine ng-valid" placeholder="Filter Fire Watch" value="" jsaction="input:;blur:;compositionstart:;compositionend:;click:;"></th><!--container--></tr></thead><tbody _ngcontent-ng-c2108134260=""><!--bindings={
  "ng-reflect-cdk-virtual-for-of": "[object Object],[object Object"
}--></tbody></table></div><div class="cdk-virtual-scroll-spacer"></div></cdk-virtual-scroll-viewport></div></app-shared-table></app-hot-work-table><button _ngcontent-ng-c2764824898="" jsaction="click:;">Switch Form View</button></app-hot-work-side-menu><!--container--><!--container--><!--ng-container--></nav><div _ngcontent-ng-c1302047649="" id="resizer" class="resizer" jsaction="mousedown:;"></div><div _ngcontent-ng-c1302047649="" class="main-and-footer"><main _ngcontent-ng-c1302047649="" class="main-content"><router-outlet _ngcontent-ng-c740111586=""></router-outlet><app-hot-work ngh="9"><!--container--><app-hot-work-form _nghost-ng-c62076445="" ng-reflect-values="[Computed: [object Object]]" ngh="8"><div _ngcontent-ng-c62076445="" class="form-container"><app-smart-form _ngcontent-ng-c62076445="" _nghost-ng-c1799638334="" ng-reflect-fields="[object Object],[object Object" ng-reflect-values="[Computed: [object Object]]" ng-reflect-layout="column" ng-reflect-title="Hot Work" ng-reflect-submit-button-text="Submit" ng-reflect-delete-button-text="Delete" ngh="7"><h2 _ngcontent-ng-c1799638334="" class="form-header">Hot Work</h2><!--container--><form _ngcontent-ng-c1799638334="" novalidate="" class="form-layout-column ng-untouched ng-pristine ng-valid" ng-reflect-form="[object Object]" jsaction="submit:;contextmenu:;"><fieldset _ngcontent-ng-c1799638334="" class="form-group form-layout-column"><!--container--><div _ngcontent-ng-c1799638334="" class="form-field-layout-column"><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><app-form-input _ngcontent-ng-c1799638334="" ng-reflect-label="Date" ng-reflect-type="date" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="6"><div class="form-input" ng-reflect-ng-style="[object Object]"><div class="label-container"><label>Date</label><!--container--></div><!--container--><input class="form-input-element" type="date" value="null" jsaction="input:;"></div><!--container--></app-form-input><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-column"><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><app-form-input _ngcontent-ng-c1799638334="" ng-reflect-label="Location" ng-reflect-type="text" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="6"><div class="form-input" ng-reflect-ng-style="[object Object]"><div class="label-container"><label>Location</label><!--container--></div><!--container--><input class="form-input-element" type="text" value="null" jsaction="input:;"></div><!--container--></app-form-input><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-column"><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><app-form-input _ngcontent-ng-c1799638334="" ng-reflect-label="Work Scope" ng-reflect-type="textarea" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="6"><div class="form-input" ng-reflect-ng-style="[object Object]"><div class="label-container"><label>Work Scope</label><!--container--></div><!--container--><input class="form-input-element" type="textarea" value="null" jsaction="input:;"></div><!--container--></app-form-input><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-column"><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><app-form-input _ngcontent-ng-c1799638334="" ng-reflect-label="Foreman" ng-reflect-type="text" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="6"><div class="form-input" ng-reflect-ng-style="[object Object]"><div class="label-container"><label>Foreman</label><!--container--></div><!--container--><input class="form-input-element" type="text" value="null" jsaction="input:;"></div><!--container--></app-form-input><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-column"><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><app-form-input _ngcontent-ng-c1799638334="" ng-reflect-label="Fire Watch" ng-reflect-type="text" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="6"><div class="form-input" ng-reflect-ng-style="[object Object]"><div class="label-container"><label>Fire Watch</label><!--container--></div><!--container--><input class="form-input-element" type="text" value="null" jsaction="input:;"></div><!--container--></app-form-input><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-column"><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><app-form-input _ngcontent-ng-c1799638334="" ng-reflect-label="Meter Model" ng-reflect-type="text" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="6"><div class="form-input" ng-reflect-ng-style="[object Object]"><div class="label-container"><label>Meter Model</label><!--container--></div><!--container--><input class="form-input-element" type="text" value="RKI GX-3R PRO" jsaction="input:;"></div><!--container--></app-form-input><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-column"><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><app-form-input _ngcontent-ng-c1799638334="" ng-reflect-label="Meter Number" ng-reflect-type="text" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="6"><div class="form-input" ng-reflect-ng-style="[object Object]"><div class="label-container"><label>Meter Number</label><!--container--></div><!--container--><input class="form-input-element" type="text" value="null" jsaction="input:;"></div><!--container--></app-form-input><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-column"><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><app-form-input _ngcontent-ng-c1799638334="" ng-reflect-label="Special Instructions" ng-reflect-type="textarea" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="6"><div class="form-input" ng-reflect-ng-style="[object Object]"><div class="label-container"><label>Special Instructions</label><!--container--></div><!--container--><input class="form-input-element" type="textarea" value="null" jsaction="input:;"></div><!--container--></app-form-input><!--container--><!--container--></div><!--container--></fieldset><fieldset _ngcontent-ng-c1799638334="" class="form-group form-layout-grid"><legend _ngcontent-ng-c1799638334="" class="group-title">Safety Measures</legend><!--container--><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Area is Clean" ng-reflect-id="measures.areaIsClean" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="measures.areaIsClean" checked="" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="checked" for="measures.areaIsClean"> Area is Clean </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Flammables are Secured" ng-reflect-id="measures.flammablesAreSecured" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="measures.flammablesAreSecured" checked="" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="checked" for="measures.flammablesAreSecured"> Flammables are Secured </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="No Combustible Dust/Debris" ng-reflect-id="measures.noCombustibleDustOrDe" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="measures.noCombustibleDustOrDebrisPresent" checked="" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="checked" for="measures.noCombustibleDustOrDebrisPresent"> No Combustible Dust/Debris </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Radiative Heat Prevention Take" ng-reflect-id="measures.radiativeHeatPreventi" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="measures.radiativeHeatPreventiveMeasuresAreTaken" checked="" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="checked" for="measures.radiativeHeatPreventiveMeasuresAreTaken"> Radiative Heat Prevention Taken </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Vessels are Purged" ng-reflect-id="measures.vesselsArePurged" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="measures.vesselsArePurged" checked="" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="checked" for="measures.vesselsArePurged"> Vessels are Purged </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Openings are Covered" ng-reflect-id="measures.openingsAreCovered" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="measures.openingsAreCovered" checked="" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="checked" for="measures.openingsAreCovered"> Openings are Covered </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Duct Ventilation Secured" ng-reflect-id="measures.ductVentilationIsSecu" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="measures.ductVentilationIsSecured" checked="" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="checked" for="measures.ductVentilationIsSecured"> Duct Ventilation Secured </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Lock-Out Completed" ng-reflect-id="measures.lockOutIsCompleted" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="measures.lockOutIsCompleted" checked="" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="checked" for="measures.lockOutIsCompleted"> Lock-Out Completed </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Communication Established" ng-reflect-id="measures.communicationIsEstabl" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="measures.communicationIsEstablished" checked="" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="checked" for="measures.communicationIsEstablished"> Communication Established </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Fire Watch Aware of Duties" ng-reflect-id="measures.fireWatchIsAwareOfDut" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="measures.fireWatchIsAwareOfDuties" checked="" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="checked" for="measures.fireWatchIsAwareOfDuties"> Fire Watch Aware of Duties </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Fire Extinguisher Present" ng-reflect-id="measures.fireExtinguisherPrese" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="measures.fireExtinguisherPresent" checked="" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="checked" for="measures.fireExtinguisherPresent"> Fire Extinguisher Present </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><div _ngcontent-ng-c1799638334="" class="form-field-layout-grid"><!--container--><!--container--><app-checkbox-only-label _ngcontent-ng-c1799638334="" _nghost-ng-c2778646442="" ng-reflect-label="Fire Protection in Service" ng-reflect-id="measures.fireProtectionIsInSer" ng-reflect-form="[object Object]" class="ng-untouched ng-pristine ng-valid" ngh="0"><div _ngcontent-ng-c2778646442="" class="styled-checkbox-container"><input _ngcontent-ng-c2778646442="" type="checkbox" class="hidden-checkbox" id="measures.fireProtectionIsInService" checked="" jsaction="change:;"><label _ngcontent-ng-c2778646442="" class="checked" for="measures.fireProtectionIsInService"> Fire Protection in Service </label></div></app-checkbox-only-label><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--><!--container--></div><!--container--></fieldset><!--container--><div _ngcontent-ng-c1799638334="" class="form-field-layout-column"><button _ngcontent-ng-c1799638334="" type="submit">Submit</button><button _ngcontent-ng-c1799638334="" type="button" jsaction="click:;">Delete</button><!--container--></div></form><!--container--><!--container--><!--container--></app-smart-form><!--container--><!--container--></div></app-hot-work-form><!--container--></app-hot-work><!--container--><!--ng-container--></main><!--container--></div></div><div _ngcontent-ng-c1302047649="" class="clipboard-container"><app-clipboard _ngcontent-ng-c1302047649="" _nghost-ng-c490724758="" ngh="1"><div _ngcontent-ng-c490724758="" class="clipboard-wrapper"><button _ngcontent-ng-c490724758="" class="mat-mdc-tooltip-trigger clipboard-icon-button" ng-reflect-message="Clipboard (0 items)" jsaction="click:;"><mat-icon _ngcontent-ng-c490724758="" role="img" class="mat-icon notranslate material-icons mat-ligature-font mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font" ngh="0">assignment</mat-icon><!--bindings={
  "ng-reflect-ng-if": "false"
}--></button><!--container--><!--bindings={
  "ng-reflect-ng-if": "true"
}--><!--bindings={
  "ng-reflect-ng-if": "false"
}--></div></app-clipboard></div></div></app-main-layout></app-permit-builder-page><!--container--><app-print-layout ngh="11"><!--container--></app-print-layout><app-global-message _nghost-ng-c517923000="" ngh="12"><!--container--></app-global-message></app-root>
<script src="polyfills.js" type="module"></script><script src="main.js" type="module"></script>

<script id="ng-state" type="application/json">{"1535148311":{"b":{"responseData":[{"id":4152,"name":"PID","category":{"id":2452,"name":"File Type","alias":"fileType"},"alias":null},{"id":4153,"name":"Extra","category":{"id":2453,"name":"Vendor","alias":"vendor"},"alias":null},{"id":4155,"name":"John Cockerill","category":{"id":2453,"name":"Vendor","alias":"vendor"},"alias":null},{"id":4156,"name":"Kiewit","category":{"id":2453,"name":"Vendor","alias":"vendor"},"alias":null},{"id":4157,"name":"Mitsubishi","category":{"id":2453,"name":"Vendor","alias":"vendor"},"alias":null},{"id":4158,"name":"HOLTEC","category":{"id":2453,"name":"Vendor","alias":"vendor"},"alias":null},{"id":4159,"name":"US Water","category":{"id":2453,"name":"Vendor","alias":"vendor"},"alias":null},{"id":4160,"name":"Gas (Vendor)","category":{"id":2453,"name":"Vendor","alias":"vendor"},"alias":null},{"id":4202,"name":"Connector","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":null},{"id":4203,"name":"Line","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":null},{"id":4204,"name":"Manual Valve","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"V"},{"id":4205,"name":"Instrument","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":null},{"id":4206,"name":"Air Operated Valve","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"AOV"},{"id":4207,"name":"Relief Valve","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"PRV"},{"id":4208,"name":"Motor Operated Valve","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"MOV"},{"id":4209,"name":"John Cockeril","category":{"id":2453,"name":"Vendor","alias":"vendor"},"alias":null},{"id":4402,"name":"HPS & HHS","category":{"id":2552,"name":"System","alias":"system"},"alias":null},{"id":4403,"name":"Condensate System","category":{"id":2552,"name":"System","alias":"system"},"alias":"CND"},{"id":4454,"name":"Closed Cooling Water System","category":{"id":2552,"name":"System","alias":"system"},"alias":"CCW"},{"id":4653,"name":"LPS & HLS","category":{"id":2552,"name":"System","alias":"system"},"alias":null},{"id":4654,"name":"IPS & HIS","category":{"id":2552,"name":"System","alias":"system"},"alias":null},{"id":5403,"name":"CLOSED","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":5404,"name":"CLOSED","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":5405,"name":"AUTO","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":5407,"name":"OPEN","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":5408,"name":"OFF","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":5411,"name":"Not Applicable.","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":5412,"name":"no data","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":5414,"name":"OPEN","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":5415,"name":"PULLED","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":5416,"name":"INSERTED","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":5417,"name":"SOUTH COOLER","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":5418,"name":"NORTH COOLER","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":5419,"name":"NORTH FILTER","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":5420,"name":"NORTH FILTER","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":5421,"name":"CLOSED ","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":5422,"name":" THROTTLED","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":5424,"name":"RACKED OUT","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":5425,"name":"RACKED IN","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":5426,"name":"BYPASS","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":5552,"name":"Cleaver Brooks","category":{"id":2453,"name":"Vendor","alias":"vendor"},"alias":null},{"id":5602,"name":"CRT Deck","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":5652,"name":"Heat Trace Iso","category":{"id":2452,"name":"File Type","alias":"fileType"},"alias":null},{"id":5653,"name":"Heat Trace","category":{"id":2552,"name":"System","alias":"system"},"alias":"HTS"},{"id":5802,"name":"PIPE RACK 2ND LEVEL","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":5803,"name":"Cold Reheat","category":{"id":2552,"name":"System","alias":"system"},"alias":"CRH"},{"id":5852,"name":"PIPE RACK 3RD LEVEL","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":5902,"name":"PIPE RACK 1ST LEVEL","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":5903,"name":"Feed Water System","category":{"id":2552,"name":"System","alias":"system"},"alias":"BFW"},{"id":5904,"name":"LUBE OIL TANK","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":5905,"name":"LUBE OIL SYSTEM","category":{"id":2552,"name":"System","alias":"system"},"alias":"LOS"},{"id":5906,"name":"CRT AREA","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":6053,"name":"ST BUILDING WEST- LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":6054,"name":"ST BUILDING WEST- UPPER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":7652,"name":"CCW SKID","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":7653,"name":"Instrument Air","category":{"id":2552,"name":"System","alias":"system"},"alias":"INA"},{"id":7702,"name":"Hot Reheat","category":{"id":2552,"name":"System","alias":"system"},"alias":"HRH"},{"id":9302,"name":"Aux Steam","category":{"id":2552,"name":"System","alias":"system"},"alias":"AXS"},{"id":9303,"name":"Demin Water System","category":{"id":2552,"name":"System","alias":"system"},"alias":"DWS"},{"id":10902,"name":"Pump","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"PMP"},{"id":10903,"name":"PRV","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":null},{"id":10904,"name":"MVB","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":10905,"name":"ACC LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":10906,"name":"HRSG NORTH - LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":10907,"name":"HRSG WEST - LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":10908,"name":"Chemical Feed System","category":{"id":2552,"name":"System","alias":"system"},"alias":"CCF"},{"id":10909,"name":"HRSG EAST- LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":10910,"name":"TCP","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":12502,"name":"ACC UPPER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":12503,"name":"Air Cool Condenser","category":{"id":2552,"name":"System","alias":"system"},"alias":"ACC"},{"id":12504,"name":"FAN-BLOWER-COMPRESSOR","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":null},{"id":14102,"name":"Service Water System","category":{"id":2552,"name":"System","alias":"system"},"alias":"SWS"},{"id":14103,"name":"Blow Down System","category":{"id":2552,"name":"System","alias":"system"},"alias":"BDN"},{"id":14104,"name":"SWT & DWT AREA","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":14105,"name":"WASTE WATER SUMP","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":14106,"name":"AUX BOILER BLDG","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":15702,"name":"UNDER HRSG","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":15703,"name":"HEATER-DRYER","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"HTR"},{"id":17302,"name":"ST BUILDING EAST - LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":17303,"name":"ST BASEMENT","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":17304,"name":"ADMIN BUILDING","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":17305,"name":"BOP","category":{"id":2552,"name":"System","alias":"system"},"alias":null},{"id":18902,"name":"ST BUILDING SOUTH - LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":18903,"name":"GLAND STEAM","category":{"id":2552,"name":"System","alias":"system"},"alias":null},{"id":18904,"name":"ST BUILDING EAST - UPPER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":18905,"name":"STEAM TURBINE","category":{"id":2552,"name":"System","alias":"system"},"alias":"STP"},{"id":18906,"name":"ST BUILDING BASEMENT","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":20502,"name":"DRAINS TANKS PIT","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":20503,"name":"DRAINS TANKS AREA","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":20504,"name":"COMBUSTION TURBINE","category":{"id":2552,"name":"System","alias":"system"},"alias":"CTP"},{"id":20505,"name":"CONTROL PANEL","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"CPL"},{"id":20506,"name":"GT INLET","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":22102,"name":"ST NORTH OUTSIDE DECK","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":23702,"name":"GT ENCLOSURE WEST - UPPER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":23703,"name":"WATER TREATMENT PLANT","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":23704,"name":"WAREHOUSE","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":23705,"name":"BULK AMMONIA TANKS","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":23706,"name":"INA SYSTEM AREA","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":23707,"name":"FUEL GAS YARD","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":23708,"name":"Potable Water System","category":{"id":2552,"name":"System","alias":"system"},"alias":"PWS"},{"id":23709,"name":"SWITCHYARD","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":23710,"name":"Fire Protection System","category":{"id":2552,"name":"System","alias":"system"},"alias":"FPS"},{"id":25302,"name":"Sampling System","category":{"id":2552,"name":"System","alias":"system"},"alias":"SMP"},{"id":26902,"name":"GT ENCLOSURE WEST - LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":28502,"name":"ECA","category":{"id":2552,"name":"System","alias":"system"},"alias":null},{"id":28503,"name":"TCA","category":{"id":2552,"name":"System","alias":"system"},"alias":null},{"id":28504,"name":"SKID","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"SKD"},{"id":30102,"name":"Fuel Gas System","category":{"id":2552,"name":"System","alias":"system"},"alias":"FGS"},{"id":30103,"name":"DRAINS","category":{"id":2552,"name":"System","alias":"system"},"alias":null},{"id":31702,"name":"HRSG NORTH - UPPER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":31703,"name":"HRSG SOUTH - UPPER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":31704,"name":"COMPRESSED GASSES","category":{"id":2552,"name":"System","alias":"system"},"alias":"CMP"},{"id":31705,"name":"2C COOLING AIR","category":{"id":2552,"name":"System","alias":"system"},"alias":null},{"id":31706,"name":"3C COOLING AIR","category":{"id":2552,"name":"System","alias":"system"},"alias":null},{"id":33302,"name":"GT EXHAUST LANDING","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":33303,"name":"HRSG EAST - UPPER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":33304,"name":"HRSG","category":{"id":2552,"name":"System","alias":"system"},"alias":null},{"id":34902,"name":"DUCT BURNER","category":{"id":2552,"name":"System","alias":"system"},"alias":"BUR"},{"id":36502,"name":"HRSG WEST - UPPER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":38102,"name":"AFCU","category":{"id":2552,"name":"System","alias":"system"},"alias":"SCR"},{"id":39702,"name":"Bulk Ammonia System","category":{"id":2552,"name":"System","alias":"system"},"alias":"AQA"},{"id":39703,"name":"SOUTH OF ADMIN BUILDING","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":41302,"name":"CONTROL OIL","category":{"id":2552,"name":"System","alias":"system"},"alias":"COS"},{"id":41303,"name":"GT ENCLOSURE EAST - LOWER","category":{"id":2702,"name":"Location","alias":"location"},"alias":null},{"id":42952,"name":"Electrical Panel Schedule","category":{"id":2452,"name":"File Type","alias":"fileType"},"alias":null},{"id":42953,"name":"Electrical","category":{"id":2552,"name":"System","alias":"system"},"alias":null},{"id":42954,"name":"Electrical Panel Schedule Picture","category":{"id":2452,"name":"File Type","alias":"fileType"},"alias":null},{"id":46202,"name":"SEAL OIL","category":{"id":2552,"name":"System","alias":"system"},"alias":"SOS"},{"id":1000000546,"name":"Demin Water Treatment System","category":{"id":2552,"name":"System","alias":"system"},"alias":"DWT"},{"id":1000000547,"name":"LP Steam System","category":{"id":2552,"name":"System","alias":"system"},"alias":"LPS"},{"id":1000000548,"name":"IP Steam System","category":{"id":2552,"name":"System","alias":"system"},"alias":"IPS"},{"id":1000000549,"name":"HP Steam System","category":{"id":2552,"name":"System","alias":"system"},"alias":"HPS"},{"id":1000000550,"name":"Pressure Control Valve","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"PCV"},{"id":1000000551,"name":"Temperature Control Valve","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"TCV"},{"id":1000000552,"name":"Flow Control Valve","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"FCV"},{"id":1000000553,"name":"Compressor","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"CMP"},{"id":1000000554,"name":"Transformer","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"XRF"},{"id":1000000555,"name":"Pressure Transmitter","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"PIT"},{"id":1000000556,"name":"Temperature Transmitter","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"TIT"},{"id":1000000557,"name":"Flow Transmitter","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"FIT"},{"id":1000000558,"name":"Breaker 480VAC","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":"bkr"},{"id":1000000954,"name":"Sanitary Drain System","category":{"id":2552,"name":"System","alias":"system"},"alias":"SDR"},{"id":1000000955,"name":"Plant Drain System","category":{"id":2552,"name":"System","alias":"system"},"alias":"PDR"},{"id":1000000956,"name":"Waste Water Drain System","category":{"id":2552,"name":"System","alias":"system"},"alias":"WDR"},{"id":1000008028,"name":"Active","category":{"id":1000008027,"name":"Permit Status","alias":"permitStatus"},"alias":"ACT"},{"id":1000008029,"name":"Inactive","category":{"id":1000008027,"name":"Permit Status","alias":"permitStatus"},"alias":"INA"},{"id":1000008030,"name":"Closed","category":{"id":1000008027,"name":"Permit Status","alias":"permitStatus"},"alias":"CLS"},{"id":1000008032,"name":"Breaker 13.8kV","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":null},{"id":1000008037,"name":"Breaker 6.9kV","category":{"id":2502,"name":"Equipment Type","alias":"eqType"},"alias":null},{"id":1000008134,"name":"REMOVED","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":"REM"},{"id":1000008135,"name":"INSTALLED","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":"INS"},{"id":1000009343,"name":"INSTALLED","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":1000009344,"name":"REMOVED","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":1000009347,"name":"ON","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null},{"id":1000009481,"name":"HT Panel Schedule","category":{"id":2452,"name":"File Type","alias":"fileType"},"alias":null},{"id":1000009482,"name":"Electrical One and Three Line Diagram","category":{"id":2452,"name":"File Type","alias":"fileType"},"alias":null},{"id":1000009483,"name":"HRSG Valves","category":{"id":2452,"name":"File Type","alias":"fileType"},"alias":null},{"id":1000009484,"name":"HRSG Isometrics","category":{"id":2452,"name":"File Type","alias":"fileType"},"alias":null},{"id":1000009485,"name":"BOP Valves","category":{"id":2452,"name":"File Type","alias":"fileType"},"alias":null},{"id":1000009486,"name":"Isometric Large Bore Piping none-stressed","category":{"id":2452,"name":"File Type","alias":"fileType"},"alias":null},{"id":1000009487,"name":"Isometric Large Bore Piping stressed","category":{"id":2452,"name":"File Type","alias":"fileType"},"alias":null},{"id":1000009488,"name":"Isometric Small Bore Piping stressed","category":{"id":2452,"name":"File Type","alias":"fileType"},"alias":null},{"id":1000009492,"name":"processed","category":{"id":1000008027,"name":"Permit Status","alias":"permitStatus"},"alias":null},{"id":1000009502,"name":"DISABLED","category":{"id":3052,"name":"Isolated Position","alias":"isoPos"},"alias":null},{"id":1000009503,"name":"ENABLED","category":{"id":3053,"name":"Normal Position","alias":"normPos"},"alias":null}],"message":"All values retrieved successfully","timestamp":[2025,12,26,2,19,28,811025200]},"h":{},"s":200,"st":"OK","u":"http://localhost:8082/ng/values/all-values","rt":"json"},"2924600860":{"b":{"responseData":{"id":1000009050,"deleted":false,"isVerified":false,"name":"Hot Work","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,17,3,765908000],"dateModified":[2025,9,22,22,17,45,996075000],"modifiedBy":null,"formContainers":[{"id":1000009114,"deleted":false,"isVerified":false,"name":"","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,2,45,32,268913000],"dateModified":[2025,9,26,1,37,3,997007000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"measures.areaIsClean","type":"radio","label":"","options":[],"initialValue":null},"position":{"x":27,"y":406},"size":{"width":42,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"59"},"contentStyle":{}},{"id":1000009115,"deleted":false,"isVerified":false,"name":"General Condition of Area Housekeeping is acceptable.","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,2,47,57,599437000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"General Condition of Area Housekeeping is acceptable.","position":{"x":73,"y":406},"size":{"width":662,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"60"},"contentStyle":{"fontSize":13}},{"id":1000009112,"deleted":false,"isVerified":false,"name":"","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,2,45,31,138901000],"dateModified":[2025,9,26,1,37,5,526594000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"measures.flammablesAreSecured","type":"radio","label":"","options":[],"initialValue":null},"position":{"x":27,"y":429.1818181818182},"size":{"width":42,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"57"},"contentStyle":{}},{"id":1000009113,"deleted":false,"isVerified":false,"name":"","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,2,45,31,694055000],"dateModified":[2025,9,26,1,37,7,477999000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"measures.noCombustibleDustOrDebrisPresent","type":"radio","label":"","options":[],"initialValue":null},"position":{"x":27,"y":452.3636363636364},"size":{"width":42,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"58"},"contentStyle":{}},{"id":1000009118,"deleted":false,"isVerified":false,"name":"Remove, cover, or otherwise protect all flameble and combustible materials in area. (35 feet from work area)","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,2,48,0,609357000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Remove, cover, or otherwise protect all flameble and combustible materials in area. (35 feet from work area)","position":{"x":73,"y":429.1818181818182},"size":{"width":662,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"63"},"contentStyle":{"fontSize":13}},{"id":1000009119,"deleted":false,"isVerified":false,"name":"Sweep or vacuum away all combustible dust or debris. If possible, wet down area after it is cleaned.","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,2,48,1,156047000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Sweep or vacuum away all combustible dust or debris. If possible, wet down area after it is cleaned.","position":{"x":73,"y":452.3636363636364},"size":{"width":662,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"64"},"contentStyle":{"fontSize":13}},{"id":1000009116,"deleted":false,"isVerified":false,"name":"Walls, roofs, ceilings, pipes, tanks and partitions assessed for conductive or radiated heat and preventive measures taken.","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,2,47,58,103958000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Walls, roofs, ceilings, pipes, tanks and partitions assessed for conductive or radiated heat and preventive measures taken.","position":{"x":73,"y":475.54545454545456},"size":{"width":662,"height":31},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"61"},"contentStyle":{"fontSize":13}},{"id":1000009117,"deleted":false,"isVerified":false,"name":"Purge or inert piping or vessels prior to hot work (if used ofr transporting or storing flammables or combustibles) per site procedure.","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,2,47,59,305210000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Purge or inert piping or vessels prior to hot work (if used ofr transporting or storing flammables or combustibles) per site procedure.","position":{"x":73,"y":509.72727272727275},"size":{"width":662,"height":30},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"62"},"contentStyle":{"fontSize":13}},{"id":1000009106,"deleted":false,"isVerified":false,"name":"","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,2,45,28,898023000],"dateModified":[2025,9,26,1,37,9,827763000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"measures.radiativeHeatPreventiveMeasuresAreTaken","type":"radio","label":"","options":[],"initialValue":null},"position":{"x":27,"y":481.04545454545456},"size":{"width":42,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"51"},"contentStyle":{}},{"id":1000009107,"deleted":false,"isVerified":false,"name":"","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,2,45,29,302024000],"dateModified":[2025,9,26,1,37,11,542535000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"measures.vesselsArePurged","type":"radio","label":"","options":[],"initialValue":null},"position":{"x":26,"y":514.7272727272727},"size":{"width":42,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"52"},"contentStyle":{}},{"id":1000009104,"deleted":false,"isVerified":false,"name":"","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,2,45,28,86030000],"dateModified":[2025,9,26,1,37,16,97986000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"measures.openingsAreCovered","type":"radio","label":"","options":[],"initialValue":null},"position":{"x":27,"y":542.9090909090909},"size":{"width":42,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"49"},"contentStyle":{}},{"id":1000009105,"deleted":false,"isVerified":false,"name":"","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,2,45,28,415931000],"dateModified":[2025,9,26,1,37,17,879318000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"measures.ductVentilationIsSecured","type":"radio","label":"","options":[],"initialValue":null},"position":{"x":27,"y":566.090909090909},"size":{"width":42,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"50"},"contentStyle":{}},{"id":1000009110,"deleted":false,"isVerified":false,"name":"","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,2,45,30,382788000],"dateModified":[2025,9,26,1,37,19,583326000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"measures.lockOutIsCompleted","type":"radio","label":"","options":[],"initialValue":null},"position":{"x":27,"y":589.2727272727271},"size":{"width":42,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"55"},"contentStyle":{}},{"id":1000009111,"deleted":false,"isVerified":false,"name":"","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,2,45,30,742222000],"dateModified":[2025,9,26,1,37,24,541465000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"measures.communicationIsEstablished","type":"radio","label":"","options":[],"initialValue":null},"position":{"x":27,"y":612.4545454545453},"size":{"width":42,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"56"},"contentStyle":{}},{"id":1000009108,"deleted":false,"isVerified":false,"name":"","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,2,45,29,653492000],"dateModified":[2025,9,26,1,37,26,938516000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"measures.fireWatchIsAwareOfDuties","type":"radio","label":"","options":[],"initialValue":null},"position":{"x":27,"y":640.6363636363634},"size":{"width":42,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"53"},"contentStyle":{}},{"id":1000009109,"deleted":false,"isVerified":false,"name":"","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,2,45,29,998516000],"dateModified":[2025,9,26,1,37,28,957153000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"measures.fireExtinguisherPresent","type":"radio","label":"","options":[],"initialValue":null},"position":{"x":27,"y":668.8181818181815},"size":{"width":42,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"54"},"contentStyle":{}},{"id":1000009098,"deleted":false,"isVerified":false,"name":"Reading","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,0,25,50,292835000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Reading","position":{"x":685,"y":285},"size":{"width":54,"height":60},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"43","fontWeight":"bold","justifyContent":"center","alignItems":"flex-start"},"contentStyle":{"fontSize":12,"whiteSpace":"pre-wrap"}},{"id":1000009099,"deleted":false,"isVerified":false,"name":"Air monitoring table rows","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,2,34,58,287799000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":199,"y":302},"size":{"width":540,"height":21},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"transparent","borderTopWidth":"1px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"44"},"contentStyle":{}},{"id":1000009096,"deleted":false,"isVerified":false,"name":"Reading","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,0,25,14,622557000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Reading","position":{"x":577,"y":285},"size":{"width":54,"height":60},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"41","fontWeight":"bold","justifyContent":"center","alignItems":"flex-start"},"contentStyle":{"fontSize":12,"whiteSpace":"pre-wrap"}},{"id":1000009097,"deleted":false,"isVerified":false,"name":"Time","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,0,25,50,292835000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Time","position":{"x":631,"y":285},"size":{"width":54,"height":60},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"42","fontWeight":"bold","justifyContent":"center","alignItems":"flex-start"},"contentStyle":{"fontSize":12,"whiteSpace":"pre-wrap"}},{"id":1000009102,"deleted":false,"isVerified":false,"name":"Y NA","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,2,39,29,162672000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Y  NA","position":{"x":26,"y":384},"size":{"width":50,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"46"},"contentStyle":{"whiteSpace":"pre-wrap"}},{"id":1000009103,"deleted":false,"isVerified":false,"name":"Openings in floors or walls covered to contain sparks and hot slag.","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,2,42,56,504307000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Openings in floors or walls covered to contain sparks and hot slag.","position":{"x":73,"y":542.9090909090909},"size":{"width":662,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"47"},"contentStyle":{"fontSize":13}},{"id":1000009100,"deleted":false,"isVerified":false,"name":"HOT WORK PERMIT CHECKLIST AND APPROVALSECTION","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,2,37,40,155674000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"HOT WORK PERMIT CHECKLIST AND APPROVAL SECTION","position":{"x":19,"y":353},"size":{"width":720,"height":30},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#050505","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"45","fontWeight":"bold","justifyContent":"center","alignItems":"center"},"contentStyle":{"fontSize":18,"color":"#ffffff"}},{"id":1000009101,"deleted":false,"isVerified":false,"name":"","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,2,39,16,241098000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"measures.fireProtectionIsInService","type":"radio","label":"","options":[],"initialValue":null},"position":{"x":27,"y":697},"size":{"width":42,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"48"},"contentStyle":{}},{"id":1000009090,"deleted":false,"isVerified":false,"name":"Reading","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,0,24,30,976672000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Reading","position":{"x":254,"y":285},"size":{"width":54,"height":60},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"35","fontWeight":"bold","justifyContent":"center","alignItems":"flex-start"},"contentStyle":{"fontSize":12,"whiteSpace":"pre-wrap"}},{"id":1000009091,"deleted":false,"isVerified":false,"name":"Time","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,0,24,57,318587000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Time","position":{"x":308,"y":285},"size":{"width":54,"height":60},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"36","fontWeight":"bold","justifyContent":"center","alignItems":"flex-start"},"contentStyle":{"fontSize":12,"whiteSpace":"pre-wrap"}},{"id":1000009088,"deleted":false,"isVerified":false,"name":"Time","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,0,22,17,370031000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Time","position":{"x":200,"y":285},"size":{"width":54,"height":60},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"34","fontWeight":"bold","justifyContent":"center","alignItems":"flex-start"},"contentStyle":{"fontSize":12,"whiteSpace":"pre-wrap"}},{"id":1000009094,"deleted":false,"isVerified":false,"name":"Reading","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,0,25,14,622557000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Reading","position":{"x":469,"y":285},"size":{"width":54,"height":60},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"39","fontWeight":"bold","justifyContent":"center","alignItems":"flex-start"},"contentStyle":{"fontSize":12,"whiteSpace":"pre-wrap"}},{"id":1000009095,"deleted":false,"isVerified":false,"name":"Time","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,0,25,14,622557000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Time","position":{"x":523,"y":285},"size":{"width":54,"height":60},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"40","fontWeight":"bold","justifyContent":"center","alignItems":"flex-start"},"contentStyle":{"fontSize":12,"whiteSpace":"pre-wrap"}},{"id":1000009092,"deleted":false,"isVerified":false,"name":"Reading","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,0,24,57,318587000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Reading","position":{"x":362,"y":285},"size":{"width":54,"height":60},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"38","fontWeight":"bold","justifyContent":"center","alignItems":"flex-start"},"contentStyle":{"fontSize":12,"whiteSpace":"pre-wrap"}},{"id":1000009093,"deleted":false,"isVerified":false,"name":"Time","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,0,25,14,622557000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Time","position":{"x":415,"y":285},"size":{"width":54,"height":60},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"37","fontWeight":"bold","justifyContent":"center","alignItems":"flex-start"},"contentStyle":{"fontSize":12,"whiteSpace":"pre-wrap"}},{"id":1000009138,"deleted":false,"isVerified":false,"name":"Plant Manager (or Designee) Approval (Fire System Disabled):","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,3,20,0,729722000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Plant Manager (or Designee) Approval \\n(Fire System Disabled):","position":{"x":24,"y":776},"size":{"width":490,"height":31},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"83","fontWeight":"bold"},"contentStyle":{"fontSize":12,"whiteSpace":"pre-wrap"}},{"id":1000009139,"deleted":false,"isVerified":false,"name":"Date/Time:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,3,20,0,729722000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Date/Time:","position":{"x":513,"y":786},"size":{"width":224,"height":21},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"84","fontWeight":"bold"},"contentStyle":{"fontSize":12}},{"id":1000009136,"deleted":false,"isVerified":false,"name":"Date/Time:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,3,18,1,291161000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Date/Time:","position":{"x":533,"y":854},"size":{"width":203,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"81","fontWeight":"bold"},"contentStyle":{"fontSize":12}},{"id":1000009137,"deleted":false,"isVerified":false,"name":"HOT WORK PERMIT CANCELLATION SECTION","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,3,18,38,678811000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"HOT WORK PERMIT CANCELLATION SECTION","position":{"x":20,"y":809},"size":{"width":720,"height":30},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#050505","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"82","fontWeight":"bold","justifyContent":"center","alignItems":"center"},"contentStyle":{"fontSize":18,"color":"#ffffff"}},{"id":1000009142,"deleted":false,"isVerified":false,"name":"Special Instructions:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,3,23,52,944439000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Special Instructions:","position":{"x":24,"y":724},"size":{"width":712,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"87","fontWeight":"bold"},"contentStyle":{"fontSize":12,"whiteSpace":"pre-wrap"}},{"id":1000009140,"deleted":false,"isVerified":false,"name":"Hot Work Permit Approved (Issuer Signature):","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,3,22,58,255864000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Hot Work Permit Approved (Issuer Signature):","position":{"x":24,"y":756},"size":{"width":490,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"85","fontWeight":"bold"},"contentStyle":{"fontSize":12,"whiteSpace":"pre-wrap"}},{"id":1000009141,"deleted":false,"isVerified":false,"name":"Date/Time:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,3,22,58,255864000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Date/Time:","position":{"x":513,"y":755},"size":{"width":224,"height":21},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"86","fontWeight":"bold"},"contentStyle":{"fontSize":12}},{"id":1000009130,"deleted":false,"isVerified":false,"name":"(Requestor)","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,3,12,56,756951000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"(Requestor)","position":{"x":44,"y":108},"size":{"width":67,"height":15},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"75","fontWeight":"normal"},"contentStyle":{"fontSize":11}},{"id":1000009131,"deleted":false,"isVerified":false,"name":"Fire Watch Name:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,3,15,21,464492000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Fire Watch Name:","position":{"x":23,"y":887},"size":{"width":315,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"76","fontWeight":"bold"},"contentStyle":{"fontSize":12}},{"id":1000009128,"deleted":false,"isVerified":false,"name":"","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,3,9,56,103426000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":24,"y":913.3636363636363},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"73"},"contentStyle":{}},{"id":1000009129,"deleted":false,"isVerified":false,"name":"The Hot Work is completed; the area has been inspected and this permit is closed out.","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,3,10,36,725601000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"The Hot Work is completed; the area has been inspected and this permit is closed out.","position":{"x":47,"y":912.3636363636363},"size":{"width":662,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"74"},"contentStyle":{"fontSize":15}},{"id":1000009134,"deleted":false,"isVerified":false,"name":"Requestor Name:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,3,18,1,291161000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Requestor Name:","position":{"x":23,"y":854},"size":{"width":315,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"79","fontWeight":"bold"},"contentStyle":{"fontSize":12}},{"id":1000009135,"deleted":false,"isVerified":false,"name":"Signature","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,3,18,1,291161000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Signature","position":{"x":338,"y":854},"size":{"width":195,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"80","fontWeight":"bold"},"contentStyle":{"fontSize":12}},{"id":1000009132,"deleted":false,"isVerified":false,"name":"Signature","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,3,16,6,37775000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Signature","position":{"x":338,"y":887},"size":{"width":195,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"77","fontWeight":"bold"},"contentStyle":{"fontSize":12}},{"id":1000009133,"deleted":false,"isVerified":false,"name":"Date/Time:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,3,17,21,602285000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Date/Time:","position":{"x":533,"y":887},"size":{"width":203,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"78","fontWeight":"bold"},"contentStyle":{"fontSize":12}},{"id":1000009122,"deleted":false,"isVerified":false,"name":"Ductwork shutdown or otherwise protected to prevent causing a fire at a distant location.","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,2,48,3,886292000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Ductwork shutdown or otherwise protected to prevent causing a fire at a distant location.","position":{"x":73,"y":566.090909090909},"size":{"width":662,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"67"},"contentStyle":{"fontSize":13}},{"id":1000009123,"deleted":false,"isVerified":false,"name":"Necessary equipment de-energized and locke out of service per LOTO requirements.","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,2,48,4,372571000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Necessary equipment de-energized and locke out of service per LOTO requirements.","position":{"x":73,"y":589.2727272727271},"size":{"width":662,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"68"},"contentStyle":{"fontSize":13}},{"id":1000009120,"deleted":false,"isVerified":false,"name":"Communications checked in the area for use in emergency (phones, radios)","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,2,48,1,644279000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Communications checked in the area for use in emergency (phones, radios)","position":{"x":73,"y":612.4545454545453},"size":{"width":662,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"65"},"contentStyle":{"fontSize":13}},{"id":1000009121,"deleted":false,"isVerified":false,"name":"Fire Watch is aware of their duties, is fire extinguisher trained, know location of fire extinguishers, and emergency procedures.","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,2,48,2,199250000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Fire Watch is aware of their duties, is fire extinguisher trained, knows location of fire extinguishers, and emergency procedures.","position":{"x":73,"y":635.6363636363634},"size":{"width":663,"height":30},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"66"},"contentStyle":{"fontSize":13}},{"id":1000009126,"deleted":false,"isVerified":false,"name":"Hot Work Permit Cancelled:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,3,7,5,163637000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Hot Work Permit Cancelled:","position":{"x":24,"y":946},"size":{"width":418,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"71","fontWeight":"bold"},"contentStyle":{"fontSize":12}},{"id":1000009127,"deleted":false,"isVerified":false,"name":"Date/Time:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,3,8,35,97737000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Date/Time:","position":{"x":447,"y":946},"size":{"width":284,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"72","fontWeight":"bold"},"contentStyle":{"fontSize":12}},{"id":1000009124,"deleted":false,"isVerified":false,"name":"The fire extinguisher immediately available and the backup have been inspected and are suitable for use.","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,2,48,4,830592000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"The fire extinguisher immediately available and the backup have been inspected and are suitable for use.","position":{"x":73,"y":668.8181818181815},"size":{"width":662,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"69"},"contentStyle":{"fontSize":13}},{"id":1000009125,"deleted":false,"isVerified":false,"name":"Fire Protection System in service.","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,2,48,5,792634000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Fire Protection System in service. If area has a fire system and it is out of service, the Plant Manager MUST approve the permit and notification to insurance carrier is required.","position":{"x":73,"y":692},"size":{"width":662,"height":30},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"70"},"contentStyle":{"fontSize":13,"color":"#eb1e1e"}},{"id":1000009051,"deleted":false,"isVerified":false,"name":"","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,17,46,105376000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":true,"content":null,"position":{"x":19,"y":0},"size":{"width":720,"height":974},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"1"},"contentStyle":{}},{"id":1000009054,"deleted":false,"isVerified":false,"name":"HOT WORK PERMIT","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,25,18,109014000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"HOT WORK PERMIT","position":{"x":279,"y":3},"size":{"width":200,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"4","fontWeight":"bold"},"contentStyle":{"fontSize":20}},{"id":1000009055,"deleted":false,"isVerified":false,"name":"Permit Is Valid for One Shift Only","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,27,18,685437000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Permit Is Valid for One Shift Only","position":{"x":502,"y":3},"size":{"width":230,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"#f02424","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"5"},"contentStyle":{"fontSize":15,"color":"#f72222"}},{"id":1000009052,"deleted":false,"isVerified":false,"name":"Permit #","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,22,25,441214000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Permit #","position":{"x":21,"y":3},"size":{"width":100,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"2"},"contentStyle":{"fontSize":15}},{"id":1000009053,"deleted":false,"isVerified":false,"name":"Permit #","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,24,21,139487000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"variable","pageNumber":1,"locked":false,"content":"id","position":{"x":84,"y":3},"size":{"width":130,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"3"},"contentStyle":{"fontSize":15}},{"id":1000009174,"deleted":false,"isVerified":false,"name":"Initial Test Results","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,1,35,50,167272000],"dateModified":[2025,9,26,1,37,1,461829000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"initialTestResult","type":"time","label":"","options":[],"initialValue":null},"position":{"x":693,"y":255},"size":{"width":40,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"89"},"contentStyle":{}},{"id":1000009173,"deleted":false,"isVerified":false,"name":"Initial Test Time","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,1,34,10,64236000],"dateModified":[2025,9,26,1,36,10,573992000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"timeOfInitialTest","type":"time","label":"","options":[],"initialValue":null},"position":{"x":329,"y":253},"size":{"width":70,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"88"},"contentStyle":{}},{"id":1000009082,"deleted":false,"isVerified":false,"name":"","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,55,46,614104000],"dateModified":[2025,9,26,1,34,11,504106000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":19,"y":242},"size":{"width":720,"height":40},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"transparent","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"25"},"contentStyle":{}},{"id":1000009083,"deleted":false,"isVerified":false,"name":"Y N","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,23,0,52,41730000],"dateModified":[2025,9,26,1,33,55,537838000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Y  N","position":{"x":158,"y":243},"size":{"width":35,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"31"},"contentStyle":{"whiteSpace":"pre-wrap"}},{"id":1000009080,"deleted":false,"isVerified":false,"name":"Time Of Initial Test","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,53,18,116123000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Time Of Initial Test","position":{"x":200,"y":242},"size":{"width":124,"height":40},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"29","fontWeight":"bold","justifyContent":"center","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000009081,"deleted":false,"isVerified":false,"name":"Initial Reading -","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,53,52,16985000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Initial Reading - Combustables (LEL) under 10%","position":{"x":403,"y":242},"size":{"width":287,"height":40},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#ffffff","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"30","fontWeight":"bold","justifyContent":"center","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000009084,"deleted":false,"isVerified":false,"name":"Additional Monitoring Results If Required","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,0,17,31,504502000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Additional Monitoring Results If Required","position":{"x":21,"y":285},"size":{"width":179,"height":60},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"32","fontWeight":"bold","justifyContent":"center","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":12,"whiteSpace":"pre-wrap"}},{"id":1000009085,"deleted":false,"isVerified":false,"name":"If required - write down results every 2 hours of hot work","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,0,20,11,499551000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"If required - write down results every 2 hours of hot work","position":{"x":21,"y":316},"size":{"width":176,"height":25},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"33","justifyContent":"flex-start","alignItems":"flex-start","paddingTop":"0px","paddingRight":"0px","paddingBottom":"0px","paddingLeft":"0px"},"contentStyle":{"fontSize":11}},{"id":1000009074,"deleted":false,"isVerified":false,"name":"Permit #","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,47,37,783943000],"dateModified":[2025,9,26,1,32,18,973394000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"meterNum","type":"text","label":"","options":[],"initialValue":null},"position":{"x":397,"y":215},"size":{"width":178,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"22"},"contentStyle":{"fontSize":15}},{"id":1000009075,"deleted":false,"isVerified":false,"name":"Permit #","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,48,43,70528000],"dateModified":[2025,9,26,1,32,16,890770000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"date","type":"text","label":"","options":[],"initialValue":null},"position":{"x":634,"y":215},"size":{"width":103,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"23"},"contentStyle":{"fontSize":15}},{"id":1000009072,"deleted":false,"isVerified":false,"name":"Permit #","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,46,33,157529000],"dateModified":[2025,9,26,1,32,21,938389000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"meterModel","type":"text","label":"","options":[],"initialValue":null},"position":{"x":154,"y":215},"size":{"width":178,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"20"},"contentStyle":{"fontSize":15}},{"id":1000009073,"deleted":false,"isVerified":false,"name":"Serial #","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,47,37,783943000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Serial #","position":{"x":349,"y":215},"size":{"width":50,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"21"},"contentStyle":{"fontSize":12}},{"id":1000009078,"deleted":false,"isVerified":false,"name":"Fire Watch Required","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,51,48,340201000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Fire Watch Required","position":{"x":21,"y":242},"size":{"width":124,"height":40},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"27","fontWeight":"bold","justifyContent":"center","alignItems":"center"},"contentStyle":{"fontSize":12}},{"id":1000009076,"deleted":false,"isVerified":false,"name":"Cal Date","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,48,43,70528000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Cal Date","position":{"x":586,"y":215},"size":{"width":50,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"24"},"contentStyle":{"fontSize":12}},{"id":1000009077,"deleted":false,"isVerified":false,"name":"","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,50,38,285781000],"dateModified":[2025,9,26,1,34,6,180352000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"isFireWatchRequired","type":"radio","label":"","options":[],"initialValue":null},"position":{"x":156,"y":262},"size":{"width":40,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"26"},"contentStyle":{}},{"id":1000009066,"deleted":false,"isVerified":false,"name":"Permit #","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,37,55,351483000],"dateModified":[2025,9,26,1,30,39,164409000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"fireWatch","type":"text","label":"","options":[],"initialValue":null},"position":{"x":489,"y":96},"size":{"width":249,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"14"},"contentStyle":{"fontSize":15}},{"id":1000009067,"deleted":false,"isVerified":false,"name":"Note","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,40,24,319861000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Note: For open flame winter thawing activities, a fire watch is NOT required. See Procedure for requirements.","position":{"x":19,"y":125},"size":{"width":720,"height":30},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#efdc0b","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"15","fontWeight":"bold","justifyContent":"center","alignItems":"center"},"contentStyle":{"fontSize":13,"color":"#000000"}},{"id":1000009064,"deleted":false,"isVerified":false,"name":"Permit #","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,36,8,173544000],"dateModified":[2025,9,26,1,30,33,735452000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"foreman","type":"text","label":"","options":[],"initialValue":null},"position":{"x":154,"y":96},"size":{"width":249,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"12"},"contentStyle":{"fontSize":15}},{"id":1000009065,"deleted":false,"isVerified":false,"name":"Fire Watch:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,37,55,351483000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Fire Watch:","position":{"x":416,"y":96},"size":{"width":64,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"13"},"contentStyle":{"fontSize":12}},{"id":1000009070,"deleted":false,"isVerified":false,"name":"Check this box if the hot work is in a confined space and the records of monitoring will only be recorded on the Confined Space Etry Permit or Certification of Reclassification.","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,44,18,886346000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Check this box if the hot work is in a confined space and the records of monitoring will only be recorded on the Confined Space Etry Permit or Certification of Reclassification.","position":{"x":48,"y":177},"size":{"width":687,"height":29},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"18","fontWeight":"bold"},"contentStyle":{"fontSize":12}},{"id":1000009071,"deleted":false,"isVerified":false,"name":"Test Equipment Model #","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,46,33,157529000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Test Equipment Model #","position":{"x":21,"y":215},"size":{"width":135,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"19"},"contentStyle":{"fontSize":12}},{"id":1000009068,"deleted":false,"isVerified":false,"name":"Atmospheric Monitoring Record:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,42,39,520733000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Atmospheric Monitoring Record:","position":{"x":21,"y":162},"size":{"width":198,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"16","fontWeight":"bold"},"contentStyle":{"fontSize":12}},{"id":1000009069,"deleted":false,"isVerified":false,"name":"","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,43,40,990944000],"dateModified":[2025,9,26,1,31,17,250892000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"isAirMonitoringRegisteredOnConfinedSpace","type":"checkbox","label":"","options":[],"initialValue":null},"position":{"x":25,"y":182.5},"size":{"width":18,"height":18},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"17"},"contentStyle":{}},{"id":1000009059,"deleted":false,"isVerified":false,"name":"Location of Hot Work:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,33,35,154771000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Location of Hot Work:","position":{"x":21,"y":63},"size":{"width":146,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"7"},"contentStyle":{"fontSize":15}},{"id":1000009056,"deleted":false,"isVerified":false,"name":"HOT WORK PERMIT ISSUE SECTION","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,29,36,32348000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"HOT WORK PERMIT ISSUE SECTION","position":{"x":19,"y":28},"size":{"width":720,"height":30},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#050505","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"6","fontWeight":"bold","justifyContent":"center","alignItems":"center"},"contentStyle":{"fontSize":18,"color":"#ffffff"}},{"id":1000009062,"deleted":false,"isVerified":false,"name":"Permit #","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,34,46,820881000],"dateModified":[2025,9,26,1,30,11,479669000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"date","type":"text","label":"","options":[],"initialValue":null},"position":{"x":605,"y":63},"size":{"width":130,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"10"},"contentStyle":{"fontSize":15}},{"id":1000009063,"deleted":false,"isVerified":false,"name":"Person Performing Work:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,36,8,173544000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Person Performing Work:","position":{"x":21,"y":96},"size":{"width":135,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"11"},"contentStyle":{"fontSize":12}},{"id":1000009060,"deleted":false,"isVerified":false,"name":"Permit #","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,33,35,154771000],"dateModified":[2025,9,26,1,30,20,792712000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"location","type":"text","label":"","options":[],"initialValue":null},"position":{"x":170,"y":63},"size":{"width":390,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"8"},"contentStyle":{"fontSize":15}},{"id":1000009061,"deleted":false,"isVerified":false,"name":"Date:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,22,22,34,46,820881000],"dateModified":[2025,9,23,3,43,9,998596000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Date:","position":{"x":562,"y":63},"size":{"width":50,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"9"},"contentStyle":{"fontSize":15}}],"size":{"width":7.7,"height":10.15},"formType":"HotWork","isPrimary":true},"message":"Primary form found.","timestamp":[2025,12,26,2,19,28,711704500]},"h":{},"s":200,"st":"OK","u":"http://localhost:8082/ng/forms/get-primary-form-by-type/HotWork","rt":"json"},"3786461445":{"b":{"responseData":[{"id":1000009716,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"HotWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,25,5,3,3,627504000],"dateModified":[2025,10,25,5,3,3,627504000],"workScope":"open up holes on north side of shroud so tubing doesn't rub","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":null,"date":"2025-10-27","location":"U1 ACC Fan Shrouds","foreman":"Dan Schomig","fireWatch":"","meterModel":"RKI GX-3R PRO","meterNum":null,"specialInstructions":null,"measures":{"areaIsClean":true,"flammablesAreSecured":true,"noCombustibleDustOrDebrisPresent":true,"radiativeHeatPreventiveMeasuresAreTaken":true,"vesslsArePurged":false,"openingsAreCovered":true,"ductVentilationIsSecured":true,"lockOutIsCompleted":true,"communicationIsEstablished":true,"fireWatchIsAwareOfDuties":true,"fireExtinguisherPresent":true,"fireProtectionIsInService":true},"index":0},{"id":1000009719,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"HotWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,25,5,3,3,697614000],"dateModified":[2025,10,25,5,3,3,697614000],"workScope":"open up holes on north side of shroud so tubing doesn't rub","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":null,"date":"2025-10-27","location":"U1 ACC Fan Shrouds","foreman":"Dan Schomig","fireWatch":"","meterModel":"RKI GX-3R PRO","meterNum":null,"specialInstructions":null,"measures":{"areaIsClean":true,"flammablesAreSecured":true,"noCombustibleDustOrDebrisPresent":true,"radiativeHeatPreventiveMeasuresAreTaken":true,"vesslsArePurged":false,"openingsAreCovered":true,"ductVentilationIsSecured":true,"lockOutIsCompleted":true,"communicationIsEstablished":true,"fireWatchIsAwareOfDuties":true,"fireExtinguisherPresent":true,"fireProtectionIsInService":true},"index":1},{"id":1000009746,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"HotWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,25,23,54,59,253672000],"dateModified":[2025,10,25,23,58,51,293014000],"workScope":"Cut out old valves and weld new ones","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24687","date":"2025-10-26","location":"U1 West side ground of HRSG","foreman":"Dan Schomig","fireWatch":"Chase Adams","meterModel":"RKI GX-3R PRO","meterNum":null,"specialInstructions":null,"measures":{"areaIsClean":true,"flammablesAreSecured":true,"noCombustibleDustOrDebrisPresent":false,"radiativeHeatPreventiveMeasuresAreTaken":false,"vesslsArePurged":false,"openingsAreCovered":false,"ductVentilationIsSecured":false,"lockOutIsCompleted":true,"communicationIsEstablished":true,"fireWatchIsAwareOfDuties":true,"fireExtinguisherPresent":true,"fireProtectionIsInService":true},"index":2},{"id":1000009778,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"HotWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,27,19,13,34,69230000],"dateModified":[2025,10,27,19,13,34,69230000],"workScope":"Modify pump enclosure steel so we can get the heater probe out, Cut tube steel & weld plate","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":null,"date":"2025-10-28","location":"U1 BFW Pump Enclosure","foreman":"Dan Schomig","fireWatch":"Chase Adams","meterModel":"RKI GX-3R PRO","meterNum":null,"specialInstructions":null,"measures":{"areaIsClean":true,"flammablesAreSecured":true,"noCombustibleDustOrDebrisPresent":true,"radiativeHeatPreventiveMeasuresAreTaken":true,"vesslsArePurged":false,"openingsAreCovered":true,"ductVentilationIsSecured":true,"lockOutIsCompleted":true,"communicationIsEstablished":true,"fireWatchIsAwareOfDuties":true,"fireExtinguisherPresent":true,"fireProtectionIsInService":true},"index":3},{"id":1000009853,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"HotWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,30,17,26,12,947542000],"dateModified":[2025,10,30,17,28,23,971496000],"workScope":"Removing studs, prepping for new studs and doing lay out.","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24704","date":"2025-10-30","location":"HRSG 1 stage and 2 catalyst","foreman":"Corey Brown","fireWatch":"Luis Gonzalez","meterModel":"RKI GX-3R PRO","meterNum":"3","specialInstructions":null,"measures":{"areaIsClean":true,"flammablesAreSecured":true,"noCombustibleDustOrDebrisPresent":true,"radiativeHeatPreventiveMeasuresAreTaken":true,"vesslsArePurged":false,"openingsAreCovered":true,"ductVentilationIsSecured":false,"lockOutIsCompleted":true,"communicationIsEstablished":true,"fireWatchIsAwareOfDuties":true,"fireExtinguisherPresent":true,"fireProtectionIsInService":true},"index":4},{"id":1000009865,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"HotWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,30,18,19,57,903585000],"dateModified":[2025,10,30,18,23,4,18394000],"workScope":"change out valves and weld new flanges in","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24705","date":"2025-10-31","location":"U1 & U2 fuel gas valves","foreman":"Dan Schomig","fireWatch":"Chase Adams","meterModel":"RKI GX-3R PRO","meterNum":null,"specialInstructions":null,"measures":{"areaIsClean":true,"flammablesAreSecured":true,"noCombustibleDustOrDebrisPresent":false,"radiativeHeatPreventiveMeasuresAreTaken":true,"vesslsArePurged":false,"openingsAreCovered":false,"ductVentilationIsSecured":false,"lockOutIsCompleted":true,"communicationIsEstablished":true,"fireWatchIsAwareOfDuties":true,"fireExtinguisherPresent":true,"fireProtectionIsInService":true},"index":5},{"id":1000009909,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"HotWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,30,20,38,56,275176000],"dateModified":[2025,10,30,20,40,52,266359000],"workScope":"Removing studs, prepping for new studs and doing lay out.","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24706","date":"2025-10-31","location":"HRSG 1 stage and 2 catalyst","foreman":"Corey Brown","fireWatch":"Luis Gonzalez","meterModel":"RKI GX-3R PRO","meterNum":"3","specialInstructions":null,"measures":{"areaIsClean":true,"flammablesAreSecured":true,"noCombustibleDustOrDebrisPresent":true,"radiativeHeatPreventiveMeasuresAreTaken":true,"vesslsArePurged":false,"openingsAreCovered":true,"ductVentilationIsSecured":false,"lockOutIsCompleted":true,"communicationIsEstablished":true,"fireWatchIsAwareOfDuties":true,"fireExtinguisherPresent":true,"fireProtectionIsInService":true},"index":6},{"id":1000009918,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"HotWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,30,20,48,58,978229000],"dateModified":[2025,10,30,20,52,7,275601000],"workScope":"GT exhaust liner repairs","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24707","date":"2025-10-31","location":"U1 GT EXHAUST","foreman":"","fireWatch":"","meterModel":"RKI GX-3R PRO","meterNum":null,"specialInstructions":null,"measures":{"areaIsClean":true,"flammablesAreSecured":true,"noCombustibleDustOrDebrisPresent":true,"radiativeHeatPreventiveMeasuresAreTaken":true,"vesslsArePurged":false,"openingsAreCovered":false,"ductVentilationIsSecured":false,"lockOutIsCompleted":true,"communicationIsEstablished":true,"fireWatchIsAwareOfDuties":true,"fireExtinguisherPresent":true,"fireProtectionIsInService":true},"index":7},{"id":1000009934,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"HotWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,30,21,10,26,393082000],"dateModified":[2025,10,30,21,17,50,867543000],"workScope":"U1 SCR BAFFLE PLATE REPAIR","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24708","date":"2025-10-31","location":"U1 SCR","foreman":"Keb Basset","fireWatch":"","meterModel":"RKI GX-3R PRO","meterNum":null,"specialInstructions":null,"measures":{"areaIsClean":true,"flammablesAreSecured":true,"noCombustibleDustOrDebrisPresent":true,"radiativeHeatPreventiveMeasuresAreTaken":true,"vesslsArePurged":false,"openingsAreCovered":false,"ductVentilationIsSecured":true,"lockOutIsCompleted":true,"communicationIsEstablished":true,"fireWatchIsAwareOfDuties":true,"fireExtinguisherPresent":true,"fireProtectionIsInService":true},"index":8},{"id":1000009950,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"HotWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,10,31,17,27,1,258121000],"dateModified":[2025,10,31,17,29,32,377065000],"workScope":"weld mifting lugs on flow meter","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24713","date":"2025-11-01","location":"U2 fuel gas flow meter","foreman":"Dan Schomig","fireWatch":"Chase Adams","meterModel":"RKI GX-3R PRO","meterNum":null,"specialInstructions":null,"measures":{"areaIsClean":true,"flammablesAreSecured":true,"noCombustibleDustOrDebrisPresent":true,"radiativeHeatPreventiveMeasuresAreTaken":true,"vesslsArePurged":false,"openingsAreCovered":false,"ductVentilationIsSecured":true,"lockOutIsCompleted":true,"communicationIsEstablished":true,"fireWatchIsAwareOfDuties":true,"fireExtinguisherPresent":true,"fireProtectionIsInService":true},"index":9},{"id":1000009982,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"HotWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,1,21,17,10,476413000],"dateModified":[2025,11,1,21,20,18,630182000],"workScope":"Weld repairs cracks on supports","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24718","date":"2025-11-01","location":"U1 exhaust duct","foreman":"John Pittman","fireWatch":"Daniel Garcia","meterModel":"RKI GX-3R PRO","meterNum":null,"specialInstructions":null,"measures":{"areaIsClean":true,"flammablesAreSecured":true,"noCombustibleDustOrDebrisPresent":true,"radiativeHeatPreventiveMeasuresAreTaken":true,"vesslsArePurged":false,"openingsAreCovered":false,"ductVentilationIsSecured":false,"lockOutIsCompleted":true,"communicationIsEstablished":true,"fireWatchIsAwareOfDuties":true,"fireExtinguisherPresent":true,"fireProtectionIsInService":true},"index":10},{"id":1000010058,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"HotWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,2,17,50,58,510208000],"dateModified":[2025,11,2,17,53,43,378180000],"workScope":"Loading and installing catalyst","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24719","date":"2025-11-02","location":"HRSG 1 stage and 2 catalyst","foreman":"Corey Brown","fireWatch":"Luis Gonzalez","meterModel":"RKI GX-3R PRO","meterNum":"6","specialInstructions":null,"measures":{"areaIsClean":true,"flammablesAreSecured":true,"noCombustibleDustOrDebrisPresent":true,"radiativeHeatPreventiveMeasuresAreTaken":true,"vesslsArePurged":false,"openingsAreCovered":false,"ductVentilationIsSecured":false,"lockOutIsCompleted":true,"communicationIsEstablished":true,"fireWatchIsAwareOfDuties":true,"fireExtinguisherPresent":true,"fireProtectionIsInService":true},"index":11},{"id":1000010070,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"HotWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,2,19,29,2,708580000],"dateModified":[2025,11,2,19,31,12,817162000],"workScope":"Weld new flanges & change out 3 existing valves","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24720","date":"2025-11-03","location":"U1 & U2 fuel gas valves","foreman":"Dan Schomig","fireWatch":"Chase Adams","meterModel":"RKI GX-3R PRO","meterNum":null,"specialInstructions":null,"measures":{"areaIsClean":true,"flammablesAreSecured":true,"noCombustibleDustOrDebrisPresent":true,"radiativeHeatPreventiveMeasuresAreTaken":true,"vesslsArePurged":false,"openingsAreCovered":false,"ductVentilationIsSecured":false,"lockOutIsCompleted":true,"communicationIsEstablished":true,"fireWatchIsAwareOfDuties":true,"fireExtinguisherPresent":true,"fireProtectionIsInService":true},"index":12},{"id":1000010077,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"HotWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,2,19,36,27,906570000],"dateModified":[2025,11,2,19,39,19,415507000],"workScope":"Grinding cracks\\nWeld repair cracks","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24721","date":"2025-11-03","location":"U2 exhaust duct","foreman":"John Pittman","fireWatch":"Daniel Garcia","meterModel":"RKI GX-3R PRO","meterNum":null,"specialInstructions":null,"measures":{"areaIsClean":true,"flammablesAreSecured":true,"noCombustibleDustOrDebrisPresent":true,"radiativeHeatPreventiveMeasuresAreTaken":true,"vesslsArePurged":false,"openingsAreCovered":false,"ductVentilationIsSecured":false,"lockOutIsCompleted":true,"communicationIsEstablished":true,"fireWatchIsAwareOfDuties":true,"fireExtinguisherPresent":true,"fireProtectionIsInService":true},"index":13},{"id":1000010118,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"HotWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,3,17,43,36,775284000],"dateModified":[2025,11,3,17,45,17,556639000],"workScope":"Loading and installing catalyst","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24726","date":"2025-11-03","location":"HRSG 1 stage and 2 catalyst","foreman":"Corey Brown","fireWatch":"Luis Gonzalez","meterModel":"RKI GX-3R PRO","meterNum":"6","specialInstructions":null,"measures":{"areaIsClean":true,"flammablesAreSecured":true,"noCombustibleDustOrDebrisPresent":true,"radiativeHeatPreventiveMeasuresAreTaken":true,"vesslsArePurged":false,"openingsAreCovered":false,"ductVentilationIsSecured":false,"lockOutIsCompleted":true,"communicationIsEstablished":true,"fireWatchIsAwareOfDuties":true,"fireExtinguisherPresent":true,"fireProtectionIsInService":true},"index":14},{"id":1000010140,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"HotWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,3,19,10,14,25363000],"dateModified":[2025,11,3,19,10,14,25363000],"workScope":"Grinding cracks\\nWeld repair cracks","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":null,"date":"2025-11-04","location":"U2 exhaust duct","foreman":"John Pittman","fireWatch":"Daniel Garcia","meterModel":"RKI GX-3R PRO","meterNum":null,"specialInstructions":null,"measures":{"areaIsClean":true,"flammablesAreSecured":true,"noCombustibleDustOrDebrisPresent":true,"radiativeHeatPreventiveMeasuresAreTaken":true,"vesslsArePurged":false,"openingsAreCovered":true,"ductVentilationIsSecured":true,"lockOutIsCompleted":true,"communicationIsEstablished":true,"fireWatchIsAwareOfDuties":true,"fireExtinguisherPresent":true,"fireProtectionIsInService":true},"index":15},{"id":1000010220,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"HotWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,6,18,10,36,65865000],"dateModified":[2025,11,6,18,14,8,448945000],"workScope":"Modify BFW pump enclosure so the house can pull the heater","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24734","date":"2025-11-07","location":"U2 BFW pump A","foreman":"Dan Schomig","fireWatch":"Chase Adams","meterModel":"RKI GX-3R PRO","meterNum":null,"specialInstructions":null,"measures":{"areaIsClean":true,"flammablesAreSecured":true,"noCombustibleDustOrDebrisPresent":true,"radiativeHeatPreventiveMeasuresAreTaken":true,"vesslsArePurged":false,"openingsAreCovered":true,"ductVentilationIsSecured":true,"lockOutIsCompleted":true,"communicationIsEstablished":true,"fireWatchIsAwareOfDuties":true,"fireExtinguisherPresent":true,"fireProtectionIsInService":true},"index":16},{"id":1000010239,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"HotWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,6,19,55,31,190796000],"dateModified":[2025,11,6,19,58,37,211326000],"workScope":"REMOVE/INSTALL CATALIST","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24735","date":"2025-11-07","location":"HRSG 2 stage 1 and 2 Catalyst","foreman":"David Hall","fireWatch":"","meterModel":"RKI GX-3R PRO","meterNum":null,"specialInstructions":null,"measures":{"areaIsClean":true,"flammablesAreSecured":true,"noCombustibleDustOrDebrisPresent":true,"radiativeHeatPreventiveMeasuresAreTaken":true,"vesslsArePurged":false,"openingsAreCovered":true,"ductVentilationIsSecured":true,"lockOutIsCompleted":true,"communicationIsEstablished":true,"fireWatchIsAwareOfDuties":true,"fireExtinguisherPresent":true,"fireProtectionIsInService":true},"index":17},{"id":1000010287,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"HotWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,8,3,1,34,277138000],"dateModified":[2025,11,8,3,3,13,79409000],"workScope":"Cleaning components and hardware in crane bay","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24740","date":"2025-11-08","location":"Unit 2 Crane Bay","foreman":"Ben Swan","fireWatch":"Josef Thompson","meterModel":"RKI GX-3R PRO","meterNum":null,"specialInstructions":"FIRE PROTECTION SYSTEM IS OOS","measures":{"areaIsClean":true,"flammablesAreSecured":true,"noCombustibleDustOrDebrisPresent":true,"radiativeHeatPreventiveMeasuresAreTaken":true,"vesslsArePurged":false,"openingsAreCovered":true,"ductVentilationIsSecured":true,"lockOutIsCompleted":true,"communicationIsEstablished":true,"fireWatchIsAwareOfDuties":true,"fireExtinguisherPresent":true,"fireProtectionIsInService":true},"index":18},{"id":1000010304,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"HotWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,11,7,33,43,439590000],"dateModified":[2025,11,11,7,33,43,439590000],"workScope":"SSS Clutch & Pinion Shaft Assembly and Installation","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":null,"date":"2025-11-11","location":"ST-2 Enclosure","foreman":"Ben Swan","fireWatch":"","meterModel":"RKI GX-3R PRO","meterNum":null,"specialInstructions":null,"measures":{"areaIsClean":true,"flammablesAreSecured":true,"noCombustibleDustOrDebrisPresent":true,"radiativeHeatPreventiveMeasuresAreTaken":true,"vesslsArePurged":false,"openingsAreCovered":true,"ductVentilationIsSecured":true,"lockOutIsCompleted":true,"communicationIsEstablished":true,"fireWatchIsAwareOfDuties":true,"fireExtinguisherPresent":true,"fireProtectionIsInService":true},"index":19},{"id":1000010317,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"HotWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,11,14,9,29,199131000],"dateModified":[2025,11,11,14,9,29,199131000],"workScope":"Winterization of scaffolding","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":null,"date":"2025-11-12","location":"Site wide","foreman":"Joe Hart","fireWatch":"","meterModel":"RKI GX-3R PRO","meterNum":null,"specialInstructions":null,"measures":{"areaIsClean":true,"flammablesAreSecured":true,"noCombustibleDustOrDebrisPresent":true,"radiativeHeatPreventiveMeasuresAreTaken":true,"vesslsArePurged":false,"openingsAreCovered":true,"ductVentilationIsSecured":true,"lockOutIsCompleted":true,"communicationIsEstablished":true,"fireWatchIsAwareOfDuties":true,"fireExtinguisherPresent":true,"fireProtectionIsInService":true},"index":20},{"id":1000010322,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"HotWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,11,14,20,9,801866000],"dateModified":[2025,11,11,14,24,3,13143000],"workScope":"SSS Clutch & Pinion Shaft Assembly and Installation","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24755","date":"2025-11-11","location":"ST-2 Enclosure","foreman":"Richard Jones","fireWatch":"","meterModel":"RKI GX-3R PRO","meterNum":null,"specialInstructions":null,"measures":{"areaIsClean":true,"flammablesAreSecured":true,"noCombustibleDustOrDebrisPresent":true,"radiativeHeatPreventiveMeasuresAreTaken":true,"vesslsArePurged":false,"openingsAreCovered":true,"ductVentilationIsSecured":true,"lockOutIsCompleted":true,"communicationIsEstablished":true,"fireWatchIsAwareOfDuties":true,"fireExtinguisherPresent":true,"fireProtectionIsInService":true},"index":21},{"id":1000010345,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"HotWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,13,17,32,25,929214000],"dateModified":[2025,11,13,17,34,51,34754000],"workScope":"Cleaning components and hardware in crane bay","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24764","date":"2025-11-13","location":"Unit 2 Crane Bay","foreman":"Richard Jones","fireWatch":"Scott Schoen","meterModel":"RKI GX-3R PRO","meterNum":"4","specialInstructions":"FIRE PROTECTION SYSTEM IS OOS","measures":{"areaIsClean":true,"flammablesAreSecured":true,"noCombustibleDustOrDebrisPresent":true,"radiativeHeatPreventiveMeasuresAreTaken":true,"vesslsArePurged":false,"openingsAreCovered":true,"ductVentilationIsSecured":true,"lockOutIsCompleted":false,"communicationIsEstablished":true,"fireWatchIsAwareOfDuties":true,"fireExtinguisherPresent":true,"fireProtectionIsInService":false},"index":22},{"id":1000010355,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"HotWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,13,17,50,29,287344000],"dateModified":[2025,11,13,17,51,58,646014000],"workScope":"Cleaning components and hardware in crane bay","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24765","date":"2025-11-14","location":"Unit 2 Crane Bay","foreman":"Ben Swan","fireWatch":"Caleb Reeves","meterModel":"RKI GX-3R PRO","meterNum":null,"specialInstructions":"FIRE PROTECTION SYSTEM IS OOS","measures":{"areaIsClean":true,"flammablesAreSecured":true,"noCombustibleDustOrDebrisPresent":true,"radiativeHeatPreventiveMeasuresAreTaken":true,"vesslsArePurged":false,"openingsAreCovered":true,"ductVentilationIsSecured":true,"lockOutIsCompleted":true,"communicationIsEstablished":true,"fireWatchIsAwareOfDuties":true,"fireExtinguisherPresent":true,"fireProtectionIsInService":true},"index":23},{"id":1000010361,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":"HotWork","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,11,14,4,13,22,498531000],"dateModified":[2025,11,14,4,17,15,387333000],"workScope":"HRSG 2 stage 1 and 2 Catalyst","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":null,"permitStatus":null,"temp":null,"redTagNum":"24766","date":"2025-11-14","location":"HRSG 2 stage 1 and 2 Catalyst ","foreman":"David Hall","fireWatch":"","meterModel":"RKI GX-3R PRO","meterNum":null,"specialInstructions":null,"measures":{"areaIsClean":true,"flammablesAreSecured":true,"noCombustibleDustOrDebrisPresent":true,"radiativeHeatPreventiveMeasuresAreTaken":true,"vesslsArePurged":false,"openingsAreCovered":true,"ductVentilationIsSecured":true,"lockOutIsCompleted":true,"communicationIsEstablished":true,"fireWatchIsAwareOfDuties":true,"fireExtinguisherPresent":true,"fireProtectionIsInService":true},"index":24}],"message":"Hot work requests retrieved successfully","timestamp":[2025,12,26,2,19,28,745520900]},"h":{},"s":200,"st":"OK","u":"http://localhost:8082/ng/hot-works/get-all-hot-work","rt":"json"},"3998057701":{"b":{"responseData":[{"id":2452,"name":"File Type","alias":"fileType"},{"id":2453,"name":"Vendor","alias":"vendor"},{"id":2502,"name":"Equipment Type","alias":"eqType"},{"id":2552,"name":"System","alias":"system"},{"id":2702,"name":"Location","alias":"location"},{"id":3052,"name":"Isolated Position","alias":"isoPos"},{"id":3053,"name":"Normal Position","alias":"normPos"},{"id":1000008027,"name":"Permit Status","alias":"permitStatus"}],"message":"All categories retrieved successfully","timestamp":[2025,12,26,2,19,28,703330300]},"h":{},"s":200,"st":"OK","u":"http://localhost:8082/ng/values/categories","rt":"json"},"__nghData__":[{},{"t":{"1":"t7","2":"t9"},"c":{"1":[{"i":"t7","r":2,"c":{"0":[],"3":[]},"n":{"2":"1f"},"t":{"3":"t8"}}],"2":[]}},{"t":{"3":"t31","4":"t32","18":"t33"},"c":{"3":[],"4":[{"i":"t32","r":1}],"18":[]}},{"t":{"1":"t10","2":"t12"},"c":{"1":[{"i":"t10","r":1,"t":{"2":"t11"},"c":{"2":[{"i":"t11","r":1,"x":10}]}}],"2":[]}},{"t":{"1":"t10","2":"t12"},"c":{"1":[{"i":"t10","r":1,"t":{"2":"t11"},"c":{"2":[{"i":"t11","r":1,"x":6}]}}],"2":[]}},{"n":{"10":"9f2"},"t":{"14":"t22","17":"t23","20":"t24"},"c":{"14":[{"i":"t22","r":1,"x":5}],"17":[{"i":"t23","r":1,"x":5}],"20":[]}},{"t":{"1":"t56","3":"t58"},"c":{"1":[{"i":"t56","r":1,"t":{"3":"t57"},"c":{"3":[]}}],"3":[]}},{"t":{"0":"t43","1":"t61","2":"t62"},"c":{"0":[{"i":"t43","r":3,"t":{"0":"t44","3":"t45","7":"t60"},"c":{"0":[{"i":"t44","r":1}],"3":[{"i":"t45","r":1,"t":{"1":"t46","3":"t47"},"c":{"1":[],"3":[{"i":"t47","r":1,"t":{"1":"t48","2":"t49","3":"t50","4":"t51","5":"t52","6":"t53","7":"t54","8":"t55","9":"t59"},"c":{"1":[],"2":[],"3":[],"4":[],"5":[],"6":[],"7":[],"8":[{"i":"t55","r":1}],"9":[]},"x":8}]}},{"i":"t45","r":1,"t":{"1":"t46","3":"t47"},"c":{"1":[{"i":"t46","r":1}],"3":[{"i":"t47","r":1,"t":{"1":"t48","2":"t49","3":"t50","4":"t51","5":"t52","6":"t53","7":"t54","8":"t55","9":"t59"},"c":{"1":[],"2":[],"3":[{"i":"t50","r":1}],"4":[],"5":[],"6":[],"7":[],"8":[],"9":[]},"x":12}]}}],"7":[{"i":"t60","r":1}]}}],"1":[],"2":[]}},{"t":{"1":"t42","2":"t63"},"c":{"1":[{"i":"t42","r":1}],"2":[]}},{"t":{"0":"t40","1":"t41"},"c":{"0":[],"1":[{"i":"t41","r":1}]}},{"n":{"1":"0f4n3","7":"0f2nf2","14":"0f2nfn2f2"},"e":{"1":1,"7":7,"14":3},"t":{"8":"t34","9":"t35","10":"t36","11":"t37","12":"t38","13":"t39"},"c":{"8":[],"9":[],"10":[],"11":[],"12":[{"i":"t38","r":1}],"13":[],"15":[{"i":"c2717194150","r":1}]}},{"t":{"0":"t27"},"c":{"0":[]}},{"t":{"0":"t28"},"c":{"0":[]}},{"c":{"0":[{"i":"c740111586","r":1}]}}]}</script></body></html>`;