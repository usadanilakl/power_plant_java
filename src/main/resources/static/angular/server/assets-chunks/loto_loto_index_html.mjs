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

.header-menus[_ngcontent-ng-c62108944] {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 10px;
  box-sizing: border-box;
}
.menu-container[_ngcontent-ng-c62108944] {
  width: 100%;
  padding: 10px 15px;
  margin-bottom: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}
.menu-container[_ngcontent-ng-c62108944]:first-child {
  background-color: rgba(2, 43, 97, 0.644);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
}
.menu-container[_ngcontent-ng-c62108944]:first-child     app-router-menu {
  --router-menu-text-color: white;
  --router-menu-text-hover-color: rgb(163, 201, 237);
}
.menu-container[_ngcontent-ng-c62108944]:last-child {
  background-color: rgba(2, 43, 97, 0.644);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
}
.menu-container[_ngcontent-ng-c62108944]:last-child     app-router-menu {
  --router-menu-text-color: white;
  --router-menu-text-hover-color: rgb(163, 201, 237);
}
.menu-container[_ngcontent-ng-c62108944]:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}
.menu-container[_ngcontent-ng-c62108944]     a {
  color: white;
  text-decoration: none;
  padding: 5px 10px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}
.menu-container[_ngcontent-ng-c62108944]     a:hover {
  background-color: rgba(255, 255, 255, 0.1);
}
/*# sourceMappingURL=/loto.component.css.map */</style><style ng-app-id="ng">

.layout-container[_ngcontent-ng-c260259828] {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: calc(var(--vh, 1vh) * 100);
  background-color: var(--primary-background);
  color: var(--primary-text);
  position: relative;
  overflow: hidden;
}
.header[_ngcontent-ng-c260259828] {
  position: relative;
  background-color: var(--header-background);
  color: var(--header-text);
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  overflow: hidden;
  z-index: 100;
}
.header-content[_ngcontent-ng-c260259828] {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 1rem;
  overflow-x: auto;
  flex: 1;
  position: relative;
}
.header-content[_ngcontent-ng-c260259828]::after {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 30px;
  background:
    linear-gradient(
      to right,
      hsla(0, 0%, 100%, 0),
      var(--header-background));
  pointer-events: none;
}
.header-content[_ngcontent-ng-c260259828]::-webkit-scrollbar {
  display: none;
}
.header-content[_ngcontent-ng-c260259828] {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.header-content[_ngcontent-ng-c260259828]   h1[_ngcontent-ng-c260259828] {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
}
.header-actions[_ngcontent-ng-c260259828] {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}
.auth-btn[_ngcontent-ng-c260259828] {
  background-color: var(--accent-color);
  color: var(--header-text);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s ease-in-out;
}
.auth-btn[_ngcontent-ng-c260259828]:hover {
  background-color: var(--accent-color-hover);
}
.content-wrapper[_ngcontent-ng-c260259828] {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}
.left-menu[_ngcontent-ng-c260259828] {
  background-color: var(--menu-background);
  flex-shrink: 0;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border-color);
}
.resizer[_ngcontent-ng-c260259828] {
  width: 15px;
  cursor: col-resize;
  background-color: transparent;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease-in-out;
  flex-shrink: 0;
  z-index: 10;
}
.resizer[_ngcontent-ng-c260259828]:hover {
  background-color: var(--accent-color-translucent);
}
.menu-toggle-btn[_ngcontent-ng-c260259828] {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: var(--secondary-background);
  border: 1px solid var(--border-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  box-shadow: var(--card-shadow);
  transition: all 0.3s ease;
  z-index: 1002;
}
.menu-toggle-btn[_ngcontent-ng-c260259828]:hover {
  background-color: var(--accent-color);
  transform: translate(-50%, -50%) scale(1.1);
}
.arrow[_ngcontent-ng-c260259828] {
  border: solid var(--primary-text);
  border-width: 0 2px 2px 0;
  display: inline-block;
  padding: 3px;
  transition: transform 0.3s ease;
}
.arrow[_ngcontent-ng-c260259828]:not(.collapsed) {
  transform: rotate(135deg);
}
.arrow.collapsed[_ngcontent-ng-c260259828] {
  transform: rotate(-45deg);
  margin-left: -2px;
}
.main-and-footer[_ngcontent-ng-c260259828] {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}
.main-content[_ngcontent-ng-c260259828] {
  flex: 1;
  overflow: hidden;
  padding: 1rem;
  background-color: var(--primary-background);
}
.footer-resizer[_ngcontent-ng-c260259828] {
  height: 5px;
  background-color: var(--border-color);
  cursor: row-resize;
  transition: background-color 0.3s ease;
}
.footer-resizer[_ngcontent-ng-c260259828]:hover {
  background-color: var(--accent-color);
}
.footer[_ngcontent-ng-c260259828] {
  overflow: auto;
  background-color: var(--secondary-background);
  border-top: 1px solid var(--border-color);
  padding: 1rem;
}
.overlay[_ngcontent-ng-c260259828] {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease-in-out, visibility 0.3s ease-in-out;
  z-index: 1000;
  pointer-events: none;
}
.overlay.active[_ngcontent-ng-c260259828] {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}
@supports (-webkit-touch-callout: none) {
  .layout-container[_ngcontent-ng-c260259828] {
    height: -webkit-fill-available;
  }
}
@media screen and (max-width: 768px) {
  .layout-container[_ngcontent-ng-c260259828] {
    min-height: 100vh;
    min-height: calc(var(--vh, 1vh) * 100);
    -webkit-overflow-scrolling: touch;
  }
  .content-wrapper[_ngcontent-ng-c260259828] {
    flex: 1;
    display: flex;
    overflow: hidden;
    position: relative;
    transform: translateZ(0);
    -webkit-transform: translateZ(0);
  }
  .main-and-footer[_ngcontent-ng-c260259828] {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    overscroll-behavior: contain;
  }
  .main-content[_ngcontent-ng-c260259828] {
    flex: 1;
    overflow: auto;
    -webkit-overflow-scrolling: touch;
    transform: translate3d(0, 0, 0);
    -webkit-transform: translate3d(0, 0, 0);
  }
}
@media (max-width: 768px) {
  .left-menu[_ngcontent-ng-c260259828] {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    height: 100% !important;
    width: 100% !important;
    max-width: 100% !important;
    z-index: 1002 !important;
    transform: translateX(-100%) !important;
    box-shadow: 2px 0 5px rgba(0, 0, 0, 0.2) !important;
    transition: transform 0.3s ease-in-out !important;
  }
  .left-menu.active[_ngcontent-ng-c260259828] {
    transform: translateX(0) !important;
  }
  .resizer[_ngcontent-ng-c260259828] {
    width: 50px !important;
    cursor: default !important;
    background-color: transparent !important;
    position: fixed !important;
    left: 0 !important;
    top: 50% !important;
    height: auto !important;
    z-index: 1003 !important;
    transform: translateY(-50%) !important;
  }
  .resizer[_ngcontent-ng-c260259828]:hover {
    background-color: transparent !important;
  }
  .menu-toggle-btn[_ngcontent-ng-c260259828] {
    position: static !important;
    transform: none !important;
    left: auto !important;
    top: auto !important;
  }
  .menu-toggle-btn[_ngcontent-ng-c260259828]:hover {
    transform: scale(1.1) !important;
  }
  .left-menu.active[_ngcontent-ng-c260259828]    ~ .resizer[_ngcontent-ng-c260259828] {
    left: calc(100% - 60px) !important;
  }
  .main-and-footer[_ngcontent-ng-c260259828] {
    width: 100%;
  }
  .main-content[_ngcontent-ng-c260259828] {
    padding: 0.5rem;
  }
  .header[_ngcontent-ng-c260259828] {
    padding: 0.75rem;
  }
  .header-content[_ngcontent-ng-c260259828]   h1[_ngcontent-ng-c260259828] {
    font-size: 1.25rem;
  }
  .auth-btn[_ngcontent-ng-c260259828] {
    padding: 0.4rem 0.8rem;
    font-size: 0.9rem;
  }
}
@media (min-width: 769px) and (max-width: 1024px) {
  .left-menu[_ngcontent-ng-c260259828] {
    max-width: 350px;
  }
}
@media (max-width: 768px) {
  body.menu-open[_ngcontent-ng-c260259828] {
    overflow: hidden;
  }
}
.clipboard-container[_ngcontent-ng-c260259828] {
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

.theme-toggle-button[_ngcontent-ng-c3074088440] {
  background-color: var(--secondary-background);
  color: var(--primary-text);
  border: 1px solid var(--border-color);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.2rem;
  transition: background-color 0.3s ease, color 0.3s ease;
}
.theme-toggle-button[_ngcontent-ng-c3074088440]:hover {
  background-color: color-mix(in srgb, var(--secondary-background) 80%, var(--primary-text));
}
/*# sourceMappingURL=/theme-toggle.component.css.map */</style><style ng-app-id="ng">

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

[_nghost-ng-c2155718970] {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
.container[_ngcontent-ng-c2155718970] {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: hidden;
  height: 100%;
  padding: 20px;
}
app-loto-table[_ngcontent-ng-c2155718970] {
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow: visible;
}
.button-container[_ngcontent-ng-c2155718970] {
  display: flex;
  justify-content: center;
  width: 100%;
  margin-top: 10px;
  margin-bottom: 10px;
}
.action-button[_ngcontent-ng-c2155718970] {
  width: 100%;
  padding: 10px 20px;
  font-size: 16px;
  font-weight: bold;
  color: #ffffff;
  background-color: #007bff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}
.action-button[_ngcontent-ng-c2155718970]:hover {
  background-color: #0056b3;
}
.action-button[_ngcontent-ng-c2155718970]:active {
  background-color: #004085;
}
/*# sourceMappingURL=/loto-side-menu.component.css.map */</style><style ng-app-id="ng">

.image-container[_ngcontent-ng-c543735635] {
  width: 100%;
  height: 100%;
}
/*# sourceMappingURL=/loto.component.css.map */</style><style ng-app-id="ng">

.carousel-container[_ngcontent-ng-c2658397410] {
  position: relative;
  width: 100%;
  overflow: hidden;
}
.carousel[_ngcontent-ng-c2658397410] {
  display: flex;
  overflow-x: auto;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.carousel[_ngcontent-ng-c2658397410]::-webkit-scrollbar {
  display: none;
}
.carousel[_ngcontent-ng-c2658397410]   img[_ngcontent-ng-c2658397410] {
  flex: 0 0 auto;
  width: 300px;
  height: 200px;
  object-fit: contain;
  background-color: #f0f0f0;
  margin-right: 10px;
  cursor: pointer;
}
.nav-button[_ngcontent-ng-c2658397410] {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  padding: 10px;
  cursor: pointer;
}
.nav-button.left[_ngcontent-ng-c2658397410] {
  left: 10px;
}
.nav-button.right[_ngcontent-ng-c2658397410] {
  right: 10px;
}
/*# sourceMappingURL=/image-carousel.component.css.map */</style><style ng-app-id="ng">

.floating-menu[_ngcontent-ng-c1220759610] {
  position: fixed;
  background-color: #ffffff;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  z-index: 1000;
  display: flex;
  flex-direction: column;
}
.menu-header[_ngcontent-ng-c1220759610] {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: #f0f0f0;
  cursor: move;
}
.menu-header[_ngcontent-ng-c1220759610]   h3[_ngcontent-ng-c1220759610] {
  margin: 0;
  font-size: 16px;
}
.close-button[_ngcontent-ng-c1220759610] {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
}
.menu-content[_ngcontent-ng-c1220759610] {
  padding: 10px;
  overflow: visible;
  height: calc(100% - 40px);
  display: flex;
  flex-direction: column;
}
.resize-handle[_ngcontent-ng-c1220759610] {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  cursor: se-resize;
  background:
    linear-gradient(
      135deg,
      transparent 50%,
      #ccc 50%);
}
/*# sourceMappingURL=/floating-menu.component.css.map */</style><style ng-app-id="ng">

.equipment-details-container[_ngcontent-ng-c935781403] {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
h2[_ngcontent-ng-c935781403] {
  margin: 0 0 10px 0;
  padding: 10px;
  background-color: #f0f0f0;
}
.equipment-details-content[_ngcontent-ng-c935781403] {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}
.basic-details[_ngcontent-ng-c935781403] {
  margin-bottom: 20px;
}
.detail-item[_ngcontent-ng-c935781403] {
  margin-bottom: 10px;
}
.detail-item[_ngcontent-ng-c935781403]   strong[_ngcontent-ng-c935781403] {
  font-weight: bold;
  margin-right: 10px;
}
.loto-points-section[_ngcontent-ng-c935781403], 
.related-files-section[_ngcontent-ng-c935781403] {
  margin-top: 20px;
}
h3[_ngcontent-ng-c935781403] {
  margin-bottom: 10px;
}
.loto-points-list[_ngcontent-ng-c935781403], 
.related-files-list[_ngcontent-ng-c935781403] {
  list-style-type: none;
  padding: 0;
}
.loto-point-item[_ngcontent-ng-c935781403], 
.related-file-item[_ngcontent-ng-c935781403] {
  margin-bottom: 10px;
}
.loto-point-header[_ngcontent-ng-c935781403] {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f0f0f0;
  width: 100%;
}
.loto-point-header[_ngcontent-ng-c935781403]   details[_ngcontent-ng-c935781403] {
  flex-grow: 1;
  width: 100%;
}
.loto-point-header[_ngcontent-ng-c935781403]   summary[_ngcontent-ng-c935781403] {
  cursor: pointer;
  padding: 10px 15px;
  font-weight: bold;
  transition: background-color 0.3s ease;
  width: 100%;
  box-sizing: border-box;
}
.loto-point-header[_ngcontent-ng-c935781403]   summary[_ngcontent-ng-c935781403]:hover {
  background-color: #e0e0e0;
}
.loto-point-details[_ngcontent-ng-c935781403] {
  padding: 15px;
  background-color: #fff;
  width: 100%;
  box-sizing: border-box;
}
.loto-point-details[_ngcontent-ng-c935781403]   p[_ngcontent-ng-c935781403] {
  margin: 5px 0;
  word-wrap: break-word;
  overflow-wrap: break-word;
}
.loto-point-button[_ngcontent-ng-c935781403], 
.related-file-item[_ngcontent-ng-c935781403]   button[_ngcontent-ng-c935781403] {
  padding: 5px 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  white-space: nowrap;
}
.loto-point-button[_ngcontent-ng-c935781403]:hover, 
.related-file-item[_ngcontent-ng-c935781403]   button[_ngcontent-ng-c935781403]:hover {
  background-color: #0056b3;
}
@media (max-width: 600px) {
  .equipment-details[_ngcontent-ng-c935781403] {
    padding: 5px;
  }
  .detail-item[_ngcontent-ng-c935781403]   strong[_ngcontent-ng-c935781403] {
    display: block;
    width: 100%;
    margin-bottom: 5px;
  }
  .loto-point-header[_ngcontent-ng-c935781403]   summary[_ngcontent-ng-c935781403] {
    padding: 8px 10px;
  }
  .loto-point-details[_ngcontent-ng-c935781403] {
    padding: 10px;
  }
}
/*# sourceMappingURL=/equipment-details.component.css.map */</style><style ng-app-id="ng">

[_nghost-ng-c1893060424] {
  display: flex;
  flex: 1;
  flex-direction: column;
  height: 100%;
  min-height: 100%;
  width: 100%;
  overflow: visible;
}
/*# sourceMappingURL=/loto-table.component.css.map */</style><style ng-app-id="ng">

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
/*# sourceMappingURL=/table.component.css.map */</style><style ng-app-id="ng">

.popup-overlay[_ngcontent-ng-c1448224042] {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.popup-content[_ngcontent-ng-c1448224042] {
  background-color: white;
  border-radius: 5px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  max-width: 90%;
  max-height: 90%;
  width: 90%;
  height: 90%;
}
.popup-header[_ngcontent-ng-c1448224042] {
  padding: 15px 20px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.popup-header[_ngcontent-ng-c1448224042]   h2[_ngcontent-ng-c1448224042] {
  margin: 0;
  font-size: 1.2rem;
}
.close-button[_ngcontent-ng-c1448224042] {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
}
.popup-body[_ngcontent-ng-c1448224042] {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}
.popup-small[_ngcontent-ng-c1448224042] {
  width: 300px;
  height: auto;
  min-height: 200px;
}
.popup-medium[_ngcontent-ng-c1448224042] {
  width: 500px;
  height: auto;
  min-height: 300px;
}
.popup-large[_ngcontent-ng-c1448224042] {
  width: 800px;
  height: auto;
  min-height: 400px;
}
.popup-auto[_ngcontent-ng-c1448224042] {
  width: auto;
  height: auto;
  min-width: 200px;
  min-height: 100px;
}
@media (max-width: 600px) {
  .popup-small[_ngcontent-ng-c1448224042], 
   .popup-medium[_ngcontent-ng-c1448224042], 
   .popup-large[_ngcontent-ng-c1448224042], 
   .popup-auto[_ngcontent-ng-c1448224042] {
    width: 95%;
    max-height: 95%;
  }
}
/*# sourceMappingURL=/popup.component.css.map */</style><style ng-app-id="ng">cdk-virtual-scroll-viewport{display:block;position:relative;transform:translateZ(0)}.cdk-virtual-scrollable{overflow:auto;will-change:scroll-position;contain:strict}.cdk-virtual-scroll-content-wrapper{position:absolute;top:0;left:0;contain:content}[dir=rtl] .cdk-virtual-scroll-content-wrapper{right:0;left:auto}.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper{min-height:100%}.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper>dl:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper>ol:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper>table:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-horizontal .cdk-virtual-scroll-content-wrapper>ul:not([cdkVirtualFor]){padding-left:0;padding-right:0;margin-left:0;margin-right:0;border-left-width:0;border-right-width:0;outline:none}.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper{min-width:100%}.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper>dl:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper>ol:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper>table:not([cdkVirtualFor]),.cdk-virtual-scroll-orientation-vertical .cdk-virtual-scroll-content-wrapper>ul:not([cdkVirtualFor]){padding-top:0;padding-bottom:0;margin-top:0;margin-bottom:0;border-top-width:0;border-bottom-width:0;outline:none}.cdk-virtual-scroll-spacer{height:1px;transform-origin:0 0;flex:0 0 auto}[dir=rtl] .cdk-virtual-scroll-spacer{transform-origin:100% 0}
</style><style ng-app-id="ng">.cdk-visually-hidden{border:0;clip:rect(0 0 0 0);height:1px;margin:-1px;overflow:hidden;padding:0;position:absolute;width:1px;white-space:nowrap;outline:0;-webkit-appearance:none;-moz-appearance:none;left:0}[dir=rtl] .cdk-visually-hidden{left:auto;right:0}
</style><style ng-app-id="ng">mat-icon,mat-icon.mat-primary,mat-icon.mat-accent,mat-icon.mat-warn{color:var(--mat-icon-color, inherit)}.mat-icon{-webkit-user-select:none;user-select:none;background-repeat:no-repeat;display:inline-block;fill:currentColor;height:24px;width:24px;overflow:hidden}.mat-icon.mat-icon-inline{font-size:inherit;height:inherit;line-height:inherit;width:inherit}.mat-icon.mat-ligature-font[fontIcon]::before{content:attr(fontIcon)}[dir=rtl] .mat-icon-rtl-mirror{transform:scale(-1, 1)}.mat-form-field:not(.mat-form-field-appearance-legacy) .mat-form-field-prefix .mat-icon,.mat-form-field:not(.mat-form-field-appearance-legacy) .mat-form-field-suffix .mat-icon{display:block}.mat-form-field:not(.mat-form-field-appearance-legacy) .mat-form-field-prefix .mat-icon-button .mat-icon,.mat-form-field:not(.mat-form-field-appearance-legacy) .mat-form-field-suffix .mat-icon-button .mat-icon{margin:auto}
</style></head>
<body class="mat-typography"><!--nghm--><script type="text/javascript" id="ng-event-dispatch-contract">(()=>{function p(t,n,r,o,e,i,f,m){return{eventType:t,event:n,targetElement:r,eic:o,timeStamp:e,eia:i,eirp:f,eiack:m}}function u(t){let n=[],r=e=>{n.push(e)};return{c:t,q:n,et:[],etc:[],d:r,h:e=>{r(p(e.type,e,e.target,t,Date.now()))}}}function s(t,n,r){for(let o=0;o<n.length;o++){let e=n[o];(r?t.etc:t.et).push(e),t.c.addEventListener(e,t.h,r)}}function c(t,n,r,o,e=window){let i=u(t);e._ejsas||(e._ejsas={}),e._ejsas[n]=i,s(i,r),s(i,o,!0)}window.__jsaction_bootstrap=c;})();
</script><script>window.__jsaction_bootstrap(document.body,"ng",["click"],[]);</script>
  <app-root ng-version="19.2.5" ngh="12" ng-server-context="ssg"><router-outlet></router-outlet><app-loto _nghost-ng-c62108944="" ngh="9"><app-main-layout _ngcontent-ng-c62108944="" _nghost-ng-c260259828="" ngh="3"><div _ngcontent-ng-c260259828="" class="layout-container"><header _ngcontent-ng-c260259828="" class="header"><div _ngcontent-ng-c260259828="" class="header-content"><!--container--><h1 _ngcontent-ng-c260259828="">Jackson Generation</h1><!--container--><div _ngcontent-ng-c62108944="" class="header-menus"><div _ngcontent-ng-c62108944="" class="menu-container"><app-router-menu _ngcontent-ng-c62108944="" _nghost-ng-c3121708701="" ng-reflect-layout="row" ngh="4"><nav _ngcontent-ng-c3121708701="" class="router-menu row" ng-reflect-ng-class="row"><ul _ngcontent-ng-c3121708701=""><li _ngcontent-ng-c3121708701=""><a _ngcontent-ng-c3121708701="" ng-reflect-router-link="/" href="/" jsaction="click:;">Home</a></li><li _ngcontent-ng-c3121708701=""><a _ngcontent-ng-c3121708701="" ng-reflect-router-link="/loto" href="/loto" jsaction="click:;">LOTO</a></li><li _ngcontent-ng-c3121708701=""><a _ngcontent-ng-c3121708701="" ng-reflect-router-link="/loto-points" href="/loto-points" jsaction="click:;">LOTO Points</a></li><li _ngcontent-ng-c3121708701=""><a _ngcontent-ng-c3121708701="" ng-reflect-router-link="/tag-number" href="/tag-number" jsaction="click:;">Create New Tag</a></li><li _ngcontent-ng-c3121708701=""><a _ngcontent-ng-c3121708701="" ng-reflect-router-link="/file" href="/file" jsaction="click:;">View Files</a></li><li _ngcontent-ng-c3121708701=""><a _ngcontent-ng-c3121708701="" ng-reflect-router-link="/print" href="/print" jsaction="click:;">Print</a></li><li _ngcontent-ng-c3121708701=""><a _ngcontent-ng-c3121708701="" ng-reflect-router-link="/backup" href="/backup" jsaction="click:;">Backup</a></li><li _ngcontent-ng-c3121708701=""><a _ngcontent-ng-c3121708701="" ng-reflect-router-link="/scheduler" href="/scheduler" jsaction="click:;">Scheduler</a></li><li _ngcontent-ng-c3121708701=""><a _ngcontent-ng-c3121708701="" ng-reflect-router-link="/permit-builder" href="/permit-builder" jsaction="click:;">Permit Builder</a></li><li _ngcontent-ng-c3121708701=""><a _ngcontent-ng-c3121708701="" ng-reflect-router-link="/form-designer" href="/form-designer" jsaction="click:;">Form Designer</a></li><!--container--></ul><!--container--><!--container--></nav></app-router-menu></div><div _ngcontent-ng-c62108944="" class="menu-container"><app-router-menu _ngcontent-ng-c62108944="" _nghost-ng-c3121708701="" ng-reflect-menu-items="[object Object],[object Object" ng-reflect-layout="row" ngh="5"><nav _ngcontent-ng-c3121708701="" class="router-menu row" ng-reflect-ng-class="row"><ul _ngcontent-ng-c3121708701=""><li _ngcontent-ng-c3121708701=""><a _ngcontent-ng-c3121708701="" ng-reflect-router-link="./loto" href="/loto/loto" jsaction="click:;">LOTO</a></li><li _ngcontent-ng-c3121708701=""><a _ngcontent-ng-c3121708701="" ng-reflect-router-link="./loto-standard" href="/loto/loto-standard" jsaction="click:;">LOTO Standards</a></li><li _ngcontent-ng-c3121708701=""><a _ngcontent-ng-c3121708701="" ng-reflect-router-link="./loto-points-active" href="/loto/loto-points-active" jsaction="click:;">Active LOTO Points</a></li><li _ngcontent-ng-c3121708701=""><a _ngcontent-ng-c3121708701="" ng-reflect-router-link="./loto-points" href="/loto/loto-points" jsaction="click:;">All LOTO Points</a></li><li _ngcontent-ng-c3121708701=""><a _ngcontent-ng-c3121708701="" ng-reflect-router-link="./loto-boxes" href="/loto/loto-boxes" jsaction="click:;">LOTO Boxes</a></li><li _ngcontent-ng-c3121708701=""><a _ngcontent-ng-c3121708701="" ng-reflect-router-link="./loto-boxes-grid" href="/loto/loto-boxes-grid" jsaction="click:;">LOTO Grid</a></li><li _ngcontent-ng-c3121708701=""><a _ngcontent-ng-c3121708701="" ng-reflect-router-link="./esp-devices" href="/loto/esp-devices" jsaction="click:;">ESP</a></li><li _ngcontent-ng-c3121708701=""><a _ngcontent-ng-c3121708701="" ng-reflect-router-link="./locks" href="/loto/locks" jsaction="click:;">Locks</a></li><!--container--></ul><!--container--><!--container--></nav></app-router-menu></div></div><!--ng-container--></div><div _ngcontent-ng-c260259828="" class="header-actions"><app-theme-toggle _ngcontent-ng-c260259828="" _nghost-ng-c3074088440="" ngh="0"><button _ngcontent-ng-c3074088440="" class="theme-toggle-button" jsaction="click:;"><span _ngcontent-ng-c3074088440="">🌙</span><!--bindings={
  "ng-reflect-ng-if": "true"
}--><!--bindings={
  "ng-reflect-ng-if": "false"
}--></button></app-theme-toggle></div></header><div _ngcontent-ng-c260259828="" class="content-wrapper"><!--container--><div _ngcontent-ng-c260259828="" class="main-and-footer"><main _ngcontent-ng-c260259828="" class="main-content"><router-outlet _ngcontent-ng-c62108944=""></router-outlet><app-loto _nghost-ng-c543735635="" ngh="8"><div _ngcontent-ng-c543735635="" class="carousel-container"><app-image-carousel _ngcontent-ng-c543735635="" _nghost-ng-c2658397410="" ng-reflect-images="[Computed: ]" ngh="6"><div _ngcontent-ng-c2658397410="" class="carousel-container"><button _ngcontent-ng-c2658397410="" class="nav-button left" jsaction="click:;">&lt;</button><div _ngcontent-ng-c2658397410="" class="carousel"><!--container--></div><button _ngcontent-ng-c2658397410="" class="nav-button right" jsaction="click:;">&gt;</button></div><!--container--></app-image-carousel></div><!--container--><div _ngcontent-ng-c543735635="" class="image-container"><!--container--><div _ngcontent-ng-c543735635="" class="no-file-selected"><p _ngcontent-ng-c543735635="">No file selected. Please select a file to view and edit.</p></div><!--container--><div _ngcontent-ng-c543735635="" class="control-section"><div _ngcontent-ng-c543735635="" class="button-row"></div></div></div><app-floating-menu _ngcontent-ng-c543735635="" _nghost-ng-c1220759610="" ng-reflect-title="Details" ng-reflect-open="false" ng-reflect-height="60" ng-reflect-width="40" ngh="7"><!--container--></app-floating-menu></app-loto><!--container--><!--ng-container--></main><!--container--></div></div><div _ngcontent-ng-c260259828="" class="clipboard-container"><app-clipboard _ngcontent-ng-c260259828="" _nghost-ng-c490724758="" ngh="2"><div _ngcontent-ng-c490724758="" class="clipboard-wrapper"><button _ngcontent-ng-c490724758="" class="mat-mdc-tooltip-trigger clipboard-icon-button" ng-reflect-message="Clipboard (0 items)" jsaction="click:;"><mat-icon _ngcontent-ng-c490724758="" role="img" class="mat-icon notranslate material-icons mat-ligature-font mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font" ngh="1">assignment</mat-icon><!--bindings={
  "ng-reflect-ng-if": "false"
}--></button><!--container--><!--bindings={
  "ng-reflect-ng-if": "true"
}--><!--bindings={
  "ng-reflect-ng-if": "false"
}--></div></app-clipboard></div></div></app-main-layout></app-loto><!--container--><app-print-layout ngh="10"><!--container--></app-print-layout><app-global-message _nghost-ng-c517923000="" ngh="11"><!--container--></app-global-message></app-root>
<script src="polyfills.js" type="module"></script><script src="main.js" type="module"></script>

<script id="ng-state" type="application/json">{"1979661844":{"b":{"responseData":{"content":[{"id":1000009495,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"U1 Modified FIRESIDE LOTO","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":32037,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-10-18T00:55:34.679472","boxNumber":5},{"id":1000009517,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"01-MOV-HIS941 FALL 2025","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24361,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-10-24T04:35:14.300250","boxNumber":64},{"id":1000009519,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"Fuel Gas System (FALL 2025)","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24352,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-10-24T04:36:17.174012","boxNumber":12},{"id":1000009521,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"Service water pumps (FALL 2025)","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24353,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-10-24T04:37:09.978201","boxNumber":13},{"id":1000009523,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"U1 CO2 TANK(Fall Outage 2025)","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24317,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-10-24T04:38:11.306032","boxNumber":50},{"id":1000009525,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"U1 Control Oil (Fall 2025)","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24327,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-10-24T04:38:52.108459","boxNumber":37},{"id":1000009527,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"U1 FIRESIDE LOTO","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24326,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-10-24T04:39:42.249070","boxNumber":34},{"id":1000009529,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"U1 GENERATOR (Fall 2025)","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24330,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-10-24T04:40:46.272259","boxNumber":20},{"id":1000009531,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"U1 HP EYE-HI HEAT TRACE (FALL 2025)","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24356,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-10-24T04:41:24.285925","boxNumber":57},{"id":1000009533,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"U1 Lube Oil (Fall 2025)","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24332,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-10-24T04:42:07.892694","boxNumber":8},{"id":1000009535,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"U1 ST building fire system water supply","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24351,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-10-24T04:42:49.804124","boxNumber":6},{"id":1000009537,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"U1 TURNING GEAR (FALL 2025)","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24339,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-10-24T04:43:33.007672","boxNumber":62},{"id":1000009539,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"U1 Waterside (fall outage 2025)","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24324,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-10-24T04:44:09.255891","boxNumber":33},{"id":1000009541,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"U2 02-MOV-HHS907 FALL 2025","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24362,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-10-24T04:44:49.121885","boxNumber":65},{"id":1000009543,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"U2 CO2 Tank (Fall 2025)","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24318,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-10-24T04:45:31.352435","boxNumber":49},{"id":1000009545,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"U2 Control Oil (FALL 2025)","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24345,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-10-24T04:46:21.972378","boxNumber":26},{"id":1000009547,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"U2 FIRESIDE (Fall 2025)","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24334,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-10-24T04:47:01.366847","boxNumber":36},{"id":1000009549,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"U2 GENERATOR (FALL 2025)","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24341,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-10-24T04:47:48.767659","boxNumber":25},{"id":1000009551,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"U2 HRSG SUMP QUENCH WATER SUPPLY VALVE","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24363,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-10-24T04:48:31.513564","boxNumber":55},{"id":1000009553,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"U2 LUBE OIL SYSTEM","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24347,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-10-24T04:49:32.393365","boxNumber":3},{"id":1000009555,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"U2 ST Building Fire System (FALL 2025)","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24355,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-10-24T04:50:05.307472","boxNumber":58},{"id":1000009557,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"U2 TURNING GEAR (FALL 2025)","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24340,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-10-24T04:50:41.734825","boxNumber":63},{"id":1000009559,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"U2 WATERSIDE (Fall 2025)","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24333,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-10-24T04:51:07.960306","boxNumber":35},{"id":1000009931,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"U1 ECA Cooling Water Pump","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24183,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-10-30T21:08:32.103129","boxNumber":4},{"id":1000010105,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"U1 ACC transformers","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24730,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-11-03T17:29:50.195645","boxNumber":27},{"id":1000010107,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"U2 ACC transformers","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24371,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-11-03T17:30:16.763189","boxNumber":28},{"id":1000010135,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"Unit 2 Fin fan cooler cleaning","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24375,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-11-03T19:07:52.999381","boxNumber":60},{"id":1000010213,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"U2 CONTROL PACKAGE PRESSURIZATION UNIT","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24390,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-11-06T17:55:37.360718","boxNumber":47},{"id":1000010222,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"U2 B Boiler feed pump","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24378,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-11-06T18:12:01.927708","boxNumber":69},{"id":1000010526,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":0,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-12-22T08:49:32.834308","boxNumber":null},{"id":1000010530,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":0,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-12-22T08:52:29.527978","boxNumber":null},{"id":1000010532,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":0,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-12-22T08:52:31.788868","boxNumber":null}],"pageable":{"pageNumber":0,"pageSize":5000,"sort":{"empty":true,"sorted":false,"unsorted":true},"offset":0,"unpaged":false,"paged":true},"last":true,"totalElements":32,"totalPages":1,"size":5000,"number":0,"sort":{"empty":true,"sorted":false,"unsorted":true},"numberOfElements":32,"first":true,"empty":false},"message":"Files retrieved successfully","timestamp":[2025,12,26,2,19,19,89625500]},"h":{},"s":200,"st":"OK","u":"http://localhost:8082/ng/lotos/paginated","rt":"json"},"2551254752":{"b":{"responseData":{"id":1000009143,"deleted":false,"isVerified":false,"name":"LOTO","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,3,44,32,350538000],"dateModified":[2025,9,26,2,31,0,74307000],"modifiedBy":null,"formContainers":[{"id":1000009242,"deleted":false,"isVerified":false,"name":"Notes Table","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,2,25,50,748405000],"dateModified":[2025,9,26,2,26,1,565665000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":23,"y":709},"size":{"width":713,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"64","justifyContent":"center","alignItems":"center"},"contentStyle":{}},{"id":1000009243,"deleted":false,"isVerified":false,"name":"Notes Table","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,2,25,50,924456000],"dateModified":[2025,9,26,2,26,1,565665000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":23,"y":727},"size":{"width":713,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"65","justifyContent":"center","alignItems":"center"},"contentStyle":{}},{"id":1000009240,"deleted":false,"isVerified":false,"name":"Notes Table","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,2,25,50,418563000],"dateModified":[2025,9,26,2,26,1,565665000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":23,"y":673},"size":{"width":713,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"62","justifyContent":"center","alignItems":"center"},"contentStyle":{}},{"id":1000009241,"deleted":false,"isVerified":false,"name":"Notes Table","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,2,25,50,567447000],"dateModified":[2025,9,26,2,26,1,565665000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":23,"y":691},"size":{"width":713,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"63","justifyContent":"center","alignItems":"center"},"contentStyle":{}},{"id":1000009246,"deleted":false,"isVerified":false,"name":"Notes Table","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,2,26,7,535531000],"dateModified":[2025,9,26,2,26,15,986531000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":23,"y":763},"size":{"width":713,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"68","justifyContent":"center","alignItems":"center"},"contentStyle":{}},{"id":1000009247,"deleted":false,"isVerified":false,"name":"Notes Table","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,2,26,7,705277000],"dateModified":[2025,9,26,2,26,15,986531000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":23,"y":781},"size":{"width":713,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"69","justifyContent":"center","alignItems":"center"},"contentStyle":{}},{"id":1000009244,"deleted":false,"isVerified":false,"name":"Notes Table","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,2,25,51,100955000],"dateModified":[2025,9,26,2,26,1,565665000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":23,"y":745},"size":{"width":713,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"66","justifyContent":"center","alignItems":"center"},"contentStyle":{}},{"id":1000009245,"deleted":false,"isVerified":false,"name":"Notes Table","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,2,25,51,295583000],"dateModified":[2025,9,26,2,26,15,986531000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":23,"y":799},"size":{"width":713,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"67","justifyContent":"center","alignItems":"center"},"contentStyle":{}},{"id":1000009234,"deleted":false,"isVerified":false,"name":"Notes Table","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,2,25,49,255589000],"dateModified":[2025,9,26,2,26,1,565665000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":23,"y":565},"size":{"width":713,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"56","justifyContent":"center","alignItems":"center"},"contentStyle":{}},{"id":1000009235,"deleted":false,"isVerified":false,"name":"Notes Table","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,2,25,49,413597000],"dateModified":[2025,9,26,2,26,1,565665000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":23,"y":583},"size":{"width":713,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"57","justifyContent":"center","alignItems":"center"},"contentStyle":{}},{"id":1000009232,"deleted":false,"isVerified":false,"name":"Notes","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,2,24,43,606174000],"dateModified":[2025,9,26,2,25,34,342299000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Notes","position":{"x":23,"y":529},"size":{"width":713,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"54","justifyContent":"center","alignItems":"center"},"contentStyle":{}},{"id":1000009233,"deleted":false,"isVerified":false,"name":"Notes Table","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,2,25,25,133455000],"dateModified":[2025,9,26,2,26,1,565665000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":23,"y":547},"size":{"width":713,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"55","justifyContent":"center","alignItems":"center"},"contentStyle":{}},{"id":1000009238,"deleted":false,"isVerified":false,"name":"Notes Table","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,2,25,49,902925000],"dateModified":[2025,9,26,2,26,1,565665000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":23,"y":637},"size":{"width":713,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"60","justifyContent":"center","alignItems":"center"},"contentStyle":{}},{"id":1000009239,"deleted":false,"isVerified":false,"name":"Notes Table","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,2,25,50,245594000],"dateModified":[2025,9,26,2,26,1,565665000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":23,"y":655},"size":{"width":713,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"61","justifyContent":"center","alignItems":"center"},"contentStyle":{}},{"id":1000009236,"deleted":false,"isVerified":false,"name":"Notes Table","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,2,25,49,563341000],"dateModified":[2025,9,26,2,26,1,565665000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":23,"y":601},"size":{"width":713,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"58","justifyContent":"center","alignItems":"center"},"contentStyle":{}},{"id":1000009237,"deleted":false,"isVerified":false,"name":"Notes Table","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,2,25,49,742454000],"dateModified":[2025,9,26,2,26,1,565665000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":23,"y":619},"size":{"width":713,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"59","justifyContent":"center","alignItems":"center"},"contentStyle":{}},{"id":1000009226,"deleted":false,"isVerified":false,"name":"# Tags Removed","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,2,19,16,997161000],"dateModified":[2025,9,26,2,22,44,57452000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"# Tags Removed","position":{"x":317,"y":475},"size":{"width":146,"height":23},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"48","alignItems":"center"},"contentStyle":{"fontSize":14}},{"id":1000009227,"deleted":false,"isVerified":false,"name":"Time:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,2,19,16,997161000],"dateModified":[2025,9,26,2,22,44,57452000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Time:","position":{"x":461,"y":475},"size":{"width":115,"height":23},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"49","alignItems":"center"},"contentStyle":{"fontSize":14}},{"id":1000009224,"deleted":false,"isVerified":false,"name":"Date:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,2,17,4,975178000],"dateModified":[2025,9,26,2,22,44,57452000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Date:","position":{"x":576,"y":449},"size":{"width":162,"height":23},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"46","alignItems":"center"},"contentStyle":{"fontSize":14}},{"id":1000009225,"deleted":false,"isVerified":false,"name":"Removed By:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,2,19,16,997161000],"dateModified":[2025,9,26,2,22,44,58452000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Removed By:","position":{"x":20,"y":475},"size":{"width":298,"height":23},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"47","alignItems":"center"},"contentStyle":{"fontSize":14}},{"id":1000009230,"deleted":false,"isVerified":false,"name":"Time:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,2,21,14,824181000],"dateModified":[2025,9,26,2,23,46,963458000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Time:","position":{"x":494,"y":501},"size":{"width":111,"height":23},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"52","alignItems":"center"},"contentStyle":{"fontSize":14}},{"id":1000009231,"deleted":false,"isVerified":false,"name":"Date:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,2,21,14,824181000],"dateModified":[2025,9,26,2,23,46,963458000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Date:","position":{"x":605,"y":501},"size":{"width":133,"height":23},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"53","alignItems":"center"},"contentStyle":{"fontSize":14}},{"id":1000009228,"deleted":false,"isVerified":false,"name":"Date:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,2,19,16,997161000],"dateModified":[2025,9,26,2,22,44,58452000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Date:","position":{"x":576,"y":475},"size":{"width":162,"height":23},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"50","alignItems":"center"},"contentStyle":{"fontSize":14}},{"id":1000009229,"deleted":false,"isVerified":false,"name":"All Tags removed and equipment ready for service","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,2,21,14,823180000],"dateModified":[2025,9,26,2,23,51,97771000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"All Tags removed and equipment ready for service","position":{"x":21,"y":501},"size":{"width":473,"height":23},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"51","alignItems":"center"},"contentStyle":{"fontSize":14}},{"id":1000009218,"deleted":false,"isVerified":false,"name":"Authorization to Remove LOTO, Requestor","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,2,16,40,282753000],"dateModified":[2025,9,26,2,22,44,58452000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Authorization to Remove LOTO, Requestor","position":{"x":20,"y":425},"size":{"width":427,"height":23},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"40","alignItems":"center"},"contentStyle":{"fontSize":14}},{"id":1000009219,"deleted":false,"isVerified":false,"name":"Time:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,2,16,40,282753000],"dateModified":[2025,9,26,2,22,44,58452000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Time:","position":{"x":441,"y":425},"size":{"width":131,"height":23},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"41","alignItems":"center"},"contentStyle":{"fontSize":14}},{"id":1000009216,"deleted":false,"isVerified":false,"name":"Transfer Req Acpt:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,2,15,56,26393000],"dateModified":[2025,9,26,2,22,44,58452000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Transfer Req Acpt:","position":{"x":384,"y":351},"size":{"width":256,"height":23},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#c7c7c7","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"38","alignItems":"center"},"contentStyle":{"fontSize":14}},{"id":1000009217,"deleted":false,"isVerified":false,"name":"Date:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,2,15,56,26393000],"dateModified":[2025,9,26,2,22,44,58452000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Date:","position":{"x":634,"y":351},"size":{"width":103,"height":23},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#c7c7c7","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"39","alignItems":"center"},"contentStyle":{"fontSize":14}},{"id":1000009222,"deleted":false,"isVerified":false,"name":"Lock # Removed","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,2,17,4,975178000],"dateModified":[2025,9,26,2,22,44,58452000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Lock # Removed","position":{"x":317,"y":450},"size":{"width":146,"height":23},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"44","alignItems":"center"},"contentStyle":{"fontSize":14}},{"id":1000009223,"deleted":false,"isVerified":false,"name":"Time:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,2,17,4,975178000],"dateModified":[2025,9,26,2,22,44,58452000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Time:","position":{"x":461,"y":449},"size":{"width":115,"height":23},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"45","alignItems":"center"},"contentStyle":{"fontSize":14}},{"id":1000009220,"deleted":false,"isVerified":false,"name":"Date:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,2,16,40,282753000],"dateModified":[2025,9,26,2,24,6,278338000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Date:","position":{"x":570,"y":425},"size":{"width":168,"height":23},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"42","alignItems":"center"},"contentStyle":{"fontSize":14}},{"id":1000009221,"deleted":false,"isVerified":false,"name":"Control Authority Released:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,2,17,4,974174000],"dateModified":[2025,9,26,2,22,44,58452000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Control Authority Released:","position":{"x":20,"y":450},"size":{"width":298,"height":23},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"43","alignItems":"center"},"contentStyle":{"fontSize":14}},{"id":1000009146,"deleted":false,"isVerified":false,"name":"LOTO Record Sheet","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,3,50,43,178117000],"dateModified":[2025,9,23,3,55,23,167448000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"LOTO Record Sheet","position":{"x":266,"y":44},"size":{"width":473,"height":23},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"3","fontWeight":"normal","justifyContent":"center","alignItems":"center"},"contentStyle":{"fontSize":18}},{"id":1000009147,"deleted":false,"isVerified":false,"name":"SMP-3: Hazardous Energy Control Program (LOTO)","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,3,51,52,942105000],"dateModified":[2025,9,23,3,54,51,807159000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"SMP-3: Hazardous Energy Control Program (LOTO)","position":{"x":266,"y":22},"size":{"width":473,"height":23},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#d1d1d1","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"4","fontWeight":"normal","justifyContent":"center","alignItems":"center"},"contentStyle":{"fontSize":18}},{"id":1000009144,"deleted":false,"isVerified":false,"name":"Border","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,3,44,47,27024000],"dateModified":[2025,9,23,4,23,28,857224000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":true,"content":null,"position":{"x":19,"y":1},"size":{"width":720,"height":973},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"1"},"contentStyle":{}},{"id":1000009145,"deleted":false,"isVerified":false,"name":"NAES","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,3,47,48,904308000],"dateModified":[2025,9,23,3,53,17,54844000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"NAES","position":{"x":19,"y":0},"size":{"width":248,"height":67},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"2","fontWeight":"bold","justifyContent":"center","alignItems":"center","fontStyle":"italic"},"contentStyle":{"fontSize":44}},{"id":1000009150,"deleted":false,"isVerified":false,"name":"Equipment/System:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,3,57,20,179957000],"dateModified":[2025,9,23,4,26,51,995520000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Equipment/System:","position":{"x":19,"y":88},"size":{"width":506,"height":23},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"7","alignItems":"center"},"contentStyle":{"fontSize":14}},{"id":1000009151,"deleted":false,"isVerified":false,"name":"Index # 123456","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,3,58,46,50868000],"dateModified":[2025,9,23,4,25,41,437467000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Index # 123456","position":{"x":523,"y":88},"size":{"width":123,"height":23},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"8","fontWeight":"normal","justifyContent":"flex-start","alignItems":"center"},"contentStyle":{"fontSize":14}},{"id":1000009148,"deleted":false,"isVerified":false,"name":"Jackson Generation","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,3,51,53,120277000],"dateModified":[2025,9,23,3,54,8,552794000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Jackson Generation","position":{"x":266,"y":0},"size":{"width":473,"height":23},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"5","fontWeight":"bold","justifyContent":"center","alignItems":"center"},"contentStyle":{"fontSize":18}},{"id":1000009149,"deleted":false,"isVerified":false,"name":"General Information","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,3,55,27,300355000],"dateModified":[2025,9,23,4,24,25,209122000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"General Information","position":{"x":19,"y":66},"size":{"width":720,"height":23},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f72222","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"6","fontWeight":"bold","paddingLeft":"5px"},"contentStyle":{"fontSize":16}},{"id":1000009250,"deleted":false,"isVerified":false,"name":"Notes Table","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,2,26,8,239012000],"dateModified":[2025,9,26,2,26,15,986531000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":23,"y":817},"size":{"width":713,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"72","justifyContent":"center","alignItems":"center"},"contentStyle":{}},{"id":1000009251,"deleted":false,"isVerified":false,"name":"Notes Table","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,2,26,8,419205000],"dateModified":[2025,9,26,2,26,15,986531000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":23,"y":835},"size":{"width":713,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"73","justifyContent":"center","alignItems":"center"},"contentStyle":{}},{"id":1000009248,"deleted":false,"isVerified":false,"name":"Notes Table","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,2,26,7,890312000],"dateModified":[2025,9,26,2,26,15,986531000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":23,"y":853},"size":{"width":713,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"70","justifyContent":"center","alignItems":"center"},"contentStyle":{}},{"id":1000009249,"deleted":false,"isVerified":false,"name":"Notes Table","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,2,26,8,60218000],"dateModified":[2025,9,26,2,26,15,986531000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":23,"y":871},"size":{"width":713,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"71","justifyContent":"center","alignItems":"center"},"contentStyle":{}},{"id":1000009254,"deleted":false,"isVerified":false,"name":"Notes Table","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,2,26,19,690896000],"dateModified":[2025,9,26,2,26,23,296703000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":23,"y":925},"size":{"width":713,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"76","justifyContent":"center","alignItems":"center"},"contentStyle":{}},{"id":1000009255,"deleted":false,"isVerified":false,"name":"Notes Table","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,2,26,19,850283000],"dateModified":[2025,9,26,2,26,23,296703000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":23,"y":943},"size":{"width":713,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"77","justifyContent":"center","alignItems":"center"},"contentStyle":{}},{"id":1000009252,"deleted":false,"isVerified":false,"name":"Notes Table","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,2,26,8,617166000],"dateModified":[2025,9,26,2,26,15,986531000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":23,"y":889},"size":{"width":713,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"74","justifyContent":"center","alignItems":"center"},"contentStyle":{}},{"id":1000009253,"deleted":false,"isVerified":false,"name":"Notes Table","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,2,26,8,816265000],"dateModified":[2025,9,26,2,26,16,891460000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":null,"position":{"x":23,"y":907},"size":{"width":713,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"75","justifyContent":"center","alignItems":"center"},"contentStyle":{}},{"id":1000009170,"deleted":false,"isVerified":false,"name":"Time:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,4,36,26,859279000],"dateModified":[2025,9,26,2,17,0,284358000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Time:","position":{"x":447,"y":306},"size":{"width":131,"height":23},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"27","alignItems":"center"},"contentStyle":{"fontSize":14}},{"id":1000009171,"deleted":false,"isVerified":false,"name":"Date:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,4,36,26,859279000],"dateModified":[2025,9,23,4,36,38,851986000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Date:","position":{"x":576,"y":306},"size":{"width":162,"height":23},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"28","alignItems":"center"},"contentStyle":{"fontSize":14}},{"id":1000009168,"deleted":false,"isVerified":false,"name":"Control Authority Issued:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,4,36,26,859279000],"dateModified":[2025,9,26,2,17,33,333555000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Control Authority Issued:","position":{"x":20,"y":306},"size":{"width":298,"height":23},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"25","alignItems":"center"},"contentStyle":{"fontSize":14}},{"id":1000009169,"deleted":false,"isVerified":false,"name":"Lock # Placed","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,4,36,26,859279000],"dateModified":[2025,9,26,2,17,0,284358000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Lock # Placed","position":{"x":317,"y":306},"size":{"width":131,"height":23},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"26","alignItems":"center"},"contentStyle":{"fontSize":14}},{"id":1000009162,"deleted":false,"isVerified":false,"name":"Time:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,4,30,25,852355000],"dateModified":[2025,9,26,2,19,13,434052000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Time:","position":{"x":447,"y":177},"size":{"width":131,"height":23},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"19","alignItems":"center"},"contentStyle":{"fontSize":14}},{"id":1000009163,"deleted":false,"isVerified":false,"name":"Verified By:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,4,32,13,823972000],"dateModified":[2025,9,23,4,36,20,896206000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Verified By:","position":{"x":20,"y":201},"size":{"width":276,"height":23},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"20","alignItems":"center"},"contentStyle":{"fontSize":14}},{"id":1000009160,"deleted":false,"isVerified":false,"name":"Date:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,4,28,59,483227000],"dateModified":[2025,9,26,2,19,13,434052000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Date:","position":{"x":576,"y":177},"size":{"width":162,"height":23},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"17","alignItems":"center"},"contentStyle":{"fontSize":14}},{"id":1000009161,"deleted":false,"isVerified":false,"name":"#Tags Placed","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,4,30,23,685910000],"dateModified":[2025,9,26,2,19,13,434052000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"#Tags Placed","position":{"x":296,"y":177},"size":{"width":153,"height":23},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"18","alignItems":"center"},"contentStyle":{"fontSize":14}},{"id":1000009166,"deleted":false,"isVerified":false,"name":"Date:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,4,32,13,823972000],"dateModified":[2025,9,23,4,32,22,890897000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Date:","position":{"x":576,"y":201},"size":{"width":162,"height":23},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"23","alignItems":"center"},"contentStyle":{"fontSize":14}},{"id":1000009167,"deleted":false,"isVerified":false,"name":"Statement","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,4,34,7,701471000],"dateModified":[2025,9,23,4,36,18,856848000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"The above equipment has been properly positioned, locked/tagged, a Safe to Work (Zero Energy) check has been performed and equipment is safe to perform the work described in the Scope of Work above.","position":{"x":30,"y":229},"size":{"width":700,"height":59},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"24"},"contentStyle":{}},{"id":1000009164,"deleted":false,"isVerified":false,"name":"#Tags Verified","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,4,32,13,823972000],"dateModified":[2025,9,23,4,36,20,896206000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"#Tags Verified","position":{"x":296,"y":201},"size":{"width":153,"height":23},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"21","alignItems":"center"},"contentStyle":{"fontSize":14}},{"id":1000009165,"deleted":false,"isVerified":false,"name":"Time:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,4,32,13,823972000],"dateModified":[2025,9,23,4,36,20,896206000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Time:","position":{"x":447,"y":201},"size":{"width":131,"height":23},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"22","alignItems":"center"},"contentStyle":{"fontSize":14}},{"id":1000009154,"deleted":false,"isVerified":false,"name":"Date","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,4,0,52,336206000],"dateModified":[2025,9,23,4,27,16,298997000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Date","position":{"x":523,"y":110},"size":{"width":216,"height":23},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"11","fontWeight":"normal","alignItems":"center"},"contentStyle":{"fontSize":14}},{"id":1000009155,"deleted":false,"isVerified":false,"name":"Reason for LOTO:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,4,1,54,984013000],"dateModified":[2025,9,23,4,26,57,884189000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Reason for LOTO:","position":{"x":19,"y":132},"size":{"width":720,"height":23},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"12","justifyContent":"flex-start","alignItems":"center"},"contentStyle":{"fontSize":14}},{"id":1000009152,"deleted":false,"isVerified":false,"name":"Box#","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,4,0,1,725997000],"dateModified":[2025,9,23,4,25,36,75457000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Box#","position":{"x":644,"y":88},"size":{"width":95,"height":23},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"9","fontWeight":"normal","alignItems":"center"},"contentStyle":{"fontSize":14}},{"id":1000009153,"deleted":false,"isVerified":false,"name":"LOTO Requestor:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,4,0,52,336206000],"dateModified":[2025,9,26,1,46,33,467772000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"LOTO Requestor:","position":{"x":19,"y":110},"size":{"width":506,"height":23},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"10","justifyContent":"flex-start","alignItems":"center"},"contentStyle":{"fontSize":14}},{"id":1000009158,"deleted":false,"isVerified":false,"name":"Time:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,4,4,18,563290000],"dateModified":[2025,9,23,4,30,21,240239000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Time:","position":{"x":609,"y":157},"size":{"width":50,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"15","fontWeight":"normal"},"contentStyle":{"fontSize":14}},{"id":1000009159,"deleted":false,"isVerified":false,"name":"Tagged/Locked By:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,4,27,44,521169000],"dateModified":[2025,9,26,2,19,13,434052000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Tagged/Locked By:","position":{"x":20,"y":177},"size":{"width":276,"height":23},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"16","alignItems":"center"},"contentStyle":{"fontSize":14}},{"id":1000009156,"deleted":false,"isVerified":false,"name":"LOTO Approved By:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,4,2,43,493485000],"dateModified":[2025,9,23,4,27,1,994922000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"LOTO Approved By:","position":{"x":19,"y":154},"size":{"width":720,"height":23},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"1px","borderRightWidth":"1px","borderBottomWidth":"1px","borderLeftWidth":"1px","zIndex":"13","alignItems":"center"},"contentStyle":{"fontSize":14}},{"id":1000009157,"deleted":false,"isVerified":false,"name":"Date:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,23,4,3,24,759658000],"dateModified":[2025,9,23,4,27,11,427501000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Date:","position":{"x":411,"y":157},"size":{"width":50,"height":16},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"14","fontWeight":"normal"},"contentStyle":{"fontSize":14}},{"id":1000009210,"deleted":false,"isVerified":false,"name":"Date:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,2,10,12,479346000],"dateModified":[2025,9,26,2,22,44,58452000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Date:","position":{"x":275,"y":378},"size":{"width":103,"height":23},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#c7c7c7","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"32","alignItems":"center"},"contentStyle":{"fontSize":14}},{"id":1000009211,"deleted":false,"isVerified":false,"name":"Transfer Req Released:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,2,10,12,479346000],"dateModified":[2025,9,26,2,22,44,58452000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Transfer Req Released:","position":{"x":20,"y":378},"size":{"width":256,"height":23},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#c8c8c8","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"33","alignItems":"center"},"contentStyle":{"fontSize":14}},{"id":1000009208,"deleted":false,"isVerified":false,"name":"Requestor","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,1,47,30,610919000],"dateModified":[2025,9,26,1,48,27,782376000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"lotoRequestor","type":"text","label":"","options":[],"initialValue":null},"position":{"x":130,"y":111},"size":{"width":391,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"30"},"contentStyle":{}},{"id":1000009209,"deleted":false,"isVerified":false,"name":"Scope of work input","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,1,47,49,548144000],"dateModified":[2025,9,26,2,9,58,297349000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"workScope","type":"text","label":"","options":[],"initialValue":null},"position":{"x":135,"y":133},"size":{"width":602,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"31"},"contentStyle":{}},{"id":1000009214,"deleted":false,"isVerified":false,"name":"Initial Req Released:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,2,15,56,25395000],"dateModified":[2025,9,26,2,22,44,58452000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Initial Req Released:","position":{"x":20,"y":351},"size":{"width":256,"height":23},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#c8c8c8","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"36","alignItems":"center"},"contentStyle":{"fontSize":14}},{"id":1000009215,"deleted":false,"isVerified":false,"name":"Date:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,2,15,56,26393000],"dateModified":[2025,9,26,2,22,44,58452000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Date:","position":{"x":275,"y":351},"size":{"width":103,"height":23},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#c7c7c7","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"37","alignItems":"center"},"contentStyle":{"fontSize":14}},{"id":1000009212,"deleted":false,"isVerified":false,"name":"Transfer Req Acpt:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,2,11,10,400664000],"dateModified":[2025,9,26,2,22,44,58452000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Transfer Req Acpt:","position":{"x":384,"y":378},"size":{"width":256,"height":23},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#c7c7c7","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"34","alignItems":"center"},"contentStyle":{"fontSize":14}},{"id":1000009213,"deleted":false,"isVerified":false,"name":"Date:","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,2,11,10,400664000],"dateModified":[2025,9,26,2,22,44,58452000],"modifiedBy":null,"groupId":null,"contentType":"text","pageNumber":1,"locked":false,"content":"Date:","position":{"x":634,"y":378},"size":{"width":103,"height":23},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#c7c7c7","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"1px","borderLeftWidth":"0px","zIndex":"35","alignItems":"center"},"contentStyle":{"fontSize":14}},{"id":1000009207,"deleted":false,"isVerified":false,"name":"Equipment/System input","note":null,"createdBy":null,"objectType":"","dataServiceItemId":null,"refactorNotes":null,"dateCreated":[2025,9,26,1,46,32,771470000],"dateModified":[2025,9,26,1,48,24,241550000],"modifiedBy":null,"groupId":null,"contentType":"formField","pageNumber":1,"locked":false,"content":{"name":"equipmentSystem","type":"text","label":"","options":[],"initialValue":null},"position":{"x":141,"y":89},"size":{"width":380,"height":20},"style":{"position":"absolute","display":"flex","borderStyle":"solid","borderWidth":"1px","borderColor":"black","borderRadius":"0px","boxSizing":"border-box","backgroundColor":"#f9f9f9","borderTopWidth":"0px","borderRightWidth":"0px","borderBottomWidth":"0px","borderLeftWidth":"0px","zIndex":"29"},"contentStyle":{}}],"size":{"width":7.7,"height":10.15},"formType":"Loto","isPrimary":true},"message":"Primary form found.","timestamp":[2025,12,26,2,19,19,94272800]},"h":{},"s":200,"st":"OK","u":"http://localhost:8082/ng/forms/get-primary-form-by-type/Loto","rt":"json"},"3537251604":{"b":{"responseData":{"content":[{"id":1000009495,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"U1 Modified FIRESIDE LOTO","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":32037,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-10-18T00:55:34.679472","boxNumber":5},{"id":1000009517,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"01-MOV-HIS941 FALL 2025","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24361,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-10-24T04:35:14.300250","boxNumber":64},{"id":1000009519,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"Fuel Gas System (FALL 2025)","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24352,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-10-24T04:36:17.174012","boxNumber":12},{"id":1000009521,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"Service water pumps (FALL 2025)","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24353,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-10-24T04:37:09.978201","boxNumber":13},{"id":1000009523,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"U1 CO2 TANK(Fall Outage 2025)","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24317,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-10-24T04:38:11.306032","boxNumber":50},{"id":1000009525,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"U1 Control Oil (Fall 2025)","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24327,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-10-24T04:38:52.108459","boxNumber":37},{"id":1000009527,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"U1 FIRESIDE LOTO","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24326,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-10-24T04:39:42.249070","boxNumber":34},{"id":1000009529,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"U1 GENERATOR (Fall 2025)","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24330,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-10-24T04:40:46.272259","boxNumber":20},{"id":1000009531,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"U1 HP EYE-HI HEAT TRACE (FALL 2025)","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24356,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-10-24T04:41:24.285925","boxNumber":57},{"id":1000009533,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"U1 Lube Oil (Fall 2025)","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24332,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-10-24T04:42:07.892694","boxNumber":8},{"id":1000009535,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"U1 ST building fire system water supply","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24351,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-10-24T04:42:49.804124","boxNumber":6},{"id":1000009537,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"U1 TURNING GEAR (FALL 2025)","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24339,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-10-24T04:43:33.007672","boxNumber":62},{"id":1000009539,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"U1 Waterside (fall outage 2025)","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24324,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-10-24T04:44:09.255891","boxNumber":33},{"id":1000009541,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"U2 02-MOV-HHS907 FALL 2025","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24362,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-10-24T04:44:49.121885","boxNumber":65},{"id":1000009543,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"U2 CO2 Tank (Fall 2025)","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24318,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-10-24T04:45:31.352435","boxNumber":49},{"id":1000009545,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"U2 Control Oil (FALL 2025)","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24345,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-10-24T04:46:21.972378","boxNumber":26},{"id":1000009547,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"U2 FIRESIDE (Fall 2025)","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24334,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-10-24T04:47:01.366847","boxNumber":36},{"id":1000009549,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"U2 GENERATOR (FALL 2025)","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24341,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-10-24T04:47:48.767659","boxNumber":25},{"id":1000009551,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"U2 HRSG SUMP QUENCH WATER SUPPLY VALVE","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24363,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-10-24T04:48:31.513564","boxNumber":55},{"id":1000009553,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"U2 LUBE OIL SYSTEM","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24347,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-10-24T04:49:32.393365","boxNumber":3},{"id":1000009555,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"U2 ST Building Fire System (FALL 2025)","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24355,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-10-24T04:50:05.307472","boxNumber":58},{"id":1000009557,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"U2 TURNING GEAR (FALL 2025)","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24340,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-10-24T04:50:41.734825","boxNumber":63},{"id":1000009559,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"U2 WATERSIDE (Fall 2025)","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24333,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-10-24T04:51:07.960306","boxNumber":35},{"id":1000009931,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"U1 ECA Cooling Water Pump","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24183,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-10-30T21:08:32.103129","boxNumber":4},{"id":1000010105,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"U1 ACC transformers","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24730,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-11-03T17:29:50.195645","boxNumber":27},{"id":1000010107,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"U2 ACC transformers","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24371,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-11-03T17:30:16.763189","boxNumber":28},{"id":1000010135,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"Unit 2 Fin fan cooler cleaning","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24375,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-11-03T19:07:52.999381","boxNumber":60},{"id":1000010213,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"U2 CONTROL PACKAGE PRESSURIZATION UNIT","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24390,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-11-06T17:55:37.360718","boxNumber":47},{"id":1000010222,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"U2 B Boiler feed pump","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":24378,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-11-06T18:12:01.927708","boxNumber":69},{"id":1000010526,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":0,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-12-22T08:49:32.834308","boxNumber":null},{"id":1000010530,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":0,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-12-22T08:52:29.527978","boxNumber":null},{"id":1000010532,"deleted":false,"isVerified":false,"name":null,"note":null,"createdBy":null,"objectType":null,"dataServiceItemId":null,"refactorNotes":null,"dateCreated":null,"dateModified":null,"workScope":"","system":null,"requestor":null,"controlAuthority":null,"permitType":null,"docNum":0,"permitStatus":null,"temp":false,"redTagNum":null,"lotoPoints":[],"locks":null,"lotoBox":null,"snapshots":null,"equipmentSystem":null,"lotoRequestor":null,"date":"2025-12-22T08:52:31.788868","boxNumber":null}],"pageable":{"pageNumber":0,"pageSize":50,"sort":{"empty":true,"sorted":false,"unsorted":true},"offset":0,"unpaged":false,"paged":true},"last":true,"totalElements":32,"totalPages":1,"size":50,"number":0,"sort":{"empty":true,"sorted":false,"unsorted":true},"numberOfElements":32,"first":true,"empty":false},"message":"Files retrieved successfully","timestamp":[2025,12,26,2,19,19,87102500]},"h":{},"s":200,"st":"OK","u":"http://localhost:8082/ng/lotos/paginated","rt":"json"},"__nghData__":[{"t":{"1":"t2","2":"t3"},"c":{"1":[{"i":"t2","r":1}],"2":[]}},{},{"t":{"1":"t6","2":"t8"},"c":{"1":[{"i":"t6","r":2,"c":{"0":[],"3":[]},"n":{"2":"1f"},"t":{"3":"t7"}}],"2":[]}},{"t":{"3":"t0","4":"t1","9":"t4","14":"t5"},"c":{"3":[],"4":[{"i":"t1","r":1}],"9":[],"14":[]}},{"t":{"1":"t9","2":"t11"},"c":{"1":[{"i":"t9","r":1,"t":{"2":"t10"},"c":{"2":[{"i":"t10","r":1,"x":10}]}}],"2":[]}},{"t":{"1":"t9","2":"t11"},"c":{"1":[{"i":"t9","r":1,"t":{"2":"t10"},"c":{"2":[{"i":"t10","r":1,"x":8}]}}],"2":[]}},{"t":{"6":"t12","9":"t13"},"c":{"6":[],"9":[]}},{"t":{"0":"t17"},"c":{"0":[]}},{"t":{"2":"t14","4":"t15","5":"t16"},"c":{"2":[],"4":[],"5":[{"i":"t16","r":1}]},"d":[9]},{"n":{"1":"0f4n3","10":"0f2nfnf2"},"d":[7,12,8,9,13,14],"e":{"1":1,"10":3},"c":{"11":[{"i":"c543735635","r":1}]}},{"t":{"0":"t18"},"c":{"0":[]}},{"t":{"0":"t19"},"c":{"0":[]}},{"c":{"0":[{"i":"c62108944","r":1}]}}]}</script></body></html>`;