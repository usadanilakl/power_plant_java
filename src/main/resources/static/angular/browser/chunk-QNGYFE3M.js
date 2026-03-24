import {
  LotoPointDto
} from "./chunk-PRWR46IA.js";
import {
  CommonModule,
  HttpClient,
  HttpHeaders,
  HttpParams,
  Subject,
  environment,
  inject,
  output,
  signal,
  tap,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵclassProp,
  ɵɵconditional,
  ɵɵdefineComponent,
  ɵɵdefineInjectable,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵinject,
  ɵɵlistener,
  ɵɵnamespaceHTML,
  ɵɵnamespaceSVG,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate
} from "./chunk-LMIOZ4NA.js";

// src/app/shared/image/refactored/services/pid-symbols.service.ts
var PIDSymbolsService = class _PIDSymbolsService {
  symbols = [
    {
      id: "manual-valve",
      name: "Manual Valve",
      category: "valve",
      svgPath: "M 0,0 L 20,10 L 0,20 Z M 40,0 L 20,10 L 40,20 Z",
      width: 40,
      height: 20,
      originalWidth: 40,
      originalHeight: 20
    },
    {
      id: "mov",
      name: "Motor Operated Valve",
      category: "valve",
      // svgPath: 'M 0,25 L 20,35 L 0,45 Z M 40,25 L 20,35 L 40,45 Z M 20,35 L 20,15 M 20,5 m -10,0 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0 M 15,5 l 10,0 l -5,8 z',
      svgPath: "M 0,25 L 20,35 L 0,45 Z M 40,25 L 20,35 L 40,45 Z M 20,35 L 20,15 M 20,5 m -10,0 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0 M 16,10 L 16,0 L 20,5 L 24,0 L 24,10",
      width: 40,
      height: 50,
      originalWidth: 40,
      originalHeight: 50
    },
    {
      id: "bypass-line-2-valves",
      name: "Bypass Line with 2 Valves",
      category: "valve",
      svgPath: "M 0,40 L 0,0 L 20,0 M 20,0 L 30,5 L 20,10 Z M 40,0 L 30,5 L 40,10 Z M 40,0 L 80,0 M 80,0 L 90,5 L 80,10 Z M 100,0 L 90,5 L 100,10 Z M 100,0 L 120,0 L 120,40",
      width: 120,
      height: 40,
      originalWidth: 120,
      originalHeight: 40
    },
    {
      id: "aov",
      name: "Air Operated Valve",
      category: "valve",
      svgPath: "M 0,25 L 20,35 L 0,45 Z M 40,25 L 20,35 L 40,45 Z M 20,35 L 20,15 M 10,0 h 20 v 15 h -20 z M 15,12 l 5,-10 l 5,10 M 17,8 h 6",
      width: 40,
      height: 50,
      originalWidth: 40,
      originalHeight: 50
    },
    {
      id: "cv",
      name: "Control Valve",
      category: "valve",
      // svgPath: 'M 0,25 L 20,35 L 0,45 Z M 40,25 L 20,35 L 40,45 Z M 20,35 L 20,15 M 5,15 A 15,15 0 0 1 35,15',
      svgPath: "M 0,25 L 20,35 L 0,45 Z M 40,25 L 20,35 L 40,45 Z M 20,35 L 20,15 M 5,15 A 15,15 0 0 1 35,15 Z",
      width: 40,
      height: 50,
      originalWidth: 40,
      originalHeight: 50
    },
    {
      id: "centrifugal-pump",
      name: "Centrifugal Pump",
      category: "pump",
      svgPath: "M 20,20 m -15,0 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0 M 0,15 L 5,15 L 5,25 L 0,25 Z M 35,15 L 40,15 L 40,25 L 35,25 Z M 10,20 L 30,20 M 25,15 L 30,20 L 25,25",
      width: 40,
      height: 40,
      originalWidth: 40,
      originalHeight: 40
    },
    {
      id: "pressure-indicator",
      name: "Pressure Indicator",
      category: "instrument",
      svgPath: "M 20,20 m -15,0 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0 M 20,5 L 20,35",
      width: 40,
      height: 40,
      originalWidth: 40,
      originalHeight: 20
    },
    {
      id: "motor",
      name: "Electric Motor",
      category: "electrical",
      svgPath: "M 20,20 m -15,0 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0 M 20,20 L 35,20",
      width: 40,
      height: 40,
      originalWidth: 40,
      originalHeight: 20
    }
  ];
  getSymbolsByCategory(category) {
    return this.symbols.filter((s) => s.category === category);
  }
  getSymbolById(id) {
    return this.symbols.find((s) => s.id === id);
  }
  getAllSymbols() {
    return this.symbols;
  }
  static \u0275fac = function PIDSymbolsService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _PIDSymbolsService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _PIDSymbolsService, factory: _PIDSymbolsService.\u0275fac, providedIn: "root" });
};

// src/app/shared/image/refactored/symbol-palette/symbol-palette.component.ts
var _forTrack0 = ($index, $item) => $item.id;
function SymbolPaletteComponent_For_2_Conditional_6_For_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 9);
    \u0275\u0275listener("click", function SymbolPaletteComponent_For_2_Conditional_6_For_2_Template_div_click_0_listener() {
      const symbol_r5 = \u0275\u0275restoreView(_r4).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r2.onSymbolSelect(symbol_r5));
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(1, "svg", 10);
    \u0275\u0275element(2, "path", 11);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(3, "span");
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const symbol_r5 = ctx.$implicit;
    \u0275\u0275property("title", symbol_r5.name);
    \u0275\u0275advance();
    \u0275\u0275attribute("width", symbol_r5.width)("height", symbol_r5.height);
    \u0275\u0275advance();
    \u0275\u0275attribute("d", symbol_r5.svgPath);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(symbol_r5.name);
  }
}
function SymbolPaletteComponent_For_2_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 7);
    \u0275\u0275repeaterCreate(1, SymbolPaletteComponent_For_2_Conditional_6_For_2_Template, 5, 5, "div", 8, _forTrack0);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const category_r2 = \u0275\u0275nextContext().$implicit;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r2.getSymbolsByCategory(category_r2.id));
  }
}
function SymbolPaletteComponent_For_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 2)(1, "button", 3);
    \u0275\u0275listener("click", function SymbolPaletteComponent_For_2_Template_button_click_1_listener() {
      const category_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.toggleCategory(category_r2.id));
    });
    \u0275\u0275elementStart(2, "span", 4);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(4, "svg", 5);
    \u0275\u0275element(5, "path", 6);
    \u0275\u0275elementEnd()();
    \u0275\u0275template(6, SymbolPaletteComponent_For_2_Conditional_6_Template, 3, 0, "div", 7);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const category_r2 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275classProp("expanded", ctx_r2.isCategoryExpanded(category_r2.id));
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(category_r2.label);
    \u0275\u0275advance();
    \u0275\u0275classProp("rotated", ctx_r2.isCategoryExpanded(category_r2.id));
    \u0275\u0275advance(2);
    \u0275\u0275conditional(ctx_r2.isCategoryExpanded(category_r2.id) ? 6 : -1);
  }
}
var SymbolPaletteComponent = class _SymbolPaletteComponent {
  pidSymbolsService = inject(PIDSymbolsService);
  symbolSelected = output();
  // Track expanded category (null = all collapsed, only one can be expanded at a time)
  expandedCategory = signal(null);
  categories = [
    { id: "valve", label: "Valves" },
    { id: "pump", label: "Pumps" },
    { id: "instrument", label: "Instruments" },
    { id: "electrical", label: "Electrical" }
  ];
  getSymbolsByCategory(category) {
    return this.pidSymbolsService.getSymbolsByCategory(category);
  }
  toggleCategory(categoryId) {
    if (this.expandedCategory() === categoryId) {
      this.expandedCategory.set(null);
    } else {
      this.expandedCategory.set(categoryId);
    }
  }
  isCategoryExpanded(categoryId) {
    return this.expandedCategory() === categoryId;
  }
  onSymbolSelect(symbol) {
    this.symbolSelected.emit(symbol);
  }
  static \u0275fac = function SymbolPaletteComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _SymbolPaletteComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _SymbolPaletteComponent, selectors: [["app-symbol-palette"]], outputs: { symbolSelected: "symbolSelected" }, decls: 3, vars: 0, consts: [[1, "symbol-palette"], [1, "symbol-category", 3, "expanded"], [1, "symbol-category"], [1, "category-header", 3, "click"], [1, "category-label"], ["width", "12", "height", "12", "viewBox", "0 0 16 16", "fill", "currentColor", 1, "chevron"], ["fill-rule", "evenodd", "d", "M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z"], [1, "symbol-grid"], [1, "symbol-item", 3, "title"], [1, "symbol-item", 3, "click", "title"], [1, "symbol-svg"], ["fill", "none"]], template: function SymbolPaletteComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0);
      \u0275\u0275repeaterCreate(1, SymbolPaletteComponent_For_2_Template, 7, 6, "div", 1, _forTrack0);
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      \u0275\u0275advance();
      \u0275\u0275repeater(ctx.categories);
    }
  }, dependencies: [CommonModule], styles: ["\n\n.symbol-palette[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: row;\n  align-items: flex-start;\n  gap: 4px;\n  padding: 8px 12px;\n  background: var(--surface-color, #ffffff);\n  overflow-x: auto;\n  overflow-y: hidden;\n}\n.symbol-category[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: row;\n  align-items: flex-start;\n  flex-shrink: 0;\n}\n.category-header[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  padding: 8px 12px;\n  background: var(--surface-color, #ffffff);\n  border: 1px solid var(--border-color, #e0e0e0);\n  border-radius: 6px;\n  cursor: pointer;\n  color: var(--text-color, #333);\n  font-size: 0.8em;\n  font-weight: 600;\n  text-transform: uppercase;\n  letter-spacing: 0.5px;\n  white-space: nowrap;\n  transition: all 0.2s ease;\n}\n.category-header[_ngcontent-%COMP%]:hover {\n  background: var(--hover-bg, #f5f5f5);\n  border-color: var(--primary-color, #007bff);\n}\n.symbol-category.expanded[_ngcontent-%COMP%]   .category-header[_ngcontent-%COMP%] {\n  background: var(--primary-color, #007bff);\n  border-color: var(--primary-color, #007bff);\n  color: white;\n  border-radius: 6px 0 0 6px;\n}\n.category-label[_ngcontent-%COMP%] {\n  font-weight: 600;\n}\n.chevron[_ngcontent-%COMP%] {\n  transition: transform 0.2s ease;\n}\n.chevron.rotated[_ngcontent-%COMP%] {\n  transform: rotate(180deg);\n}\n.symbol-category.expanded[_ngcontent-%COMP%]   .chevron[_ngcontent-%COMP%] {\n  fill: white;\n}\n.symbol-grid[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: row;\n  gap: 6px;\n  padding: 6px 8px;\n  background: var(--surface-color, #f8f9fa);\n  border: 1px solid var(--border-color, #e0e0e0);\n  border-left: none;\n  border-radius: 0 6px 6px 0;\n}\n.symbol-item[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  padding: 6px;\n  background: var(--surface-color, #ffffff);\n  border: 1px solid var(--border-color, #e0e0e0);\n  border-radius: 4px;\n  cursor: pointer;\n  transition: all 0.2s ease;\n  min-width: 50px;\n  min-height: 50px;\n  flex-shrink: 0;\n}\n.symbol-item[_ngcontent-%COMP%]:hover {\n  background: var(--hover-bg, #f5f5f5);\n  border-color: var(--primary-color, #007bff);\n  transform: translateY(-2px);\n  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);\n}\n.symbol-item[_ngcontent-%COMP%]:active {\n  transform: translateY(0);\n  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);\n}\n.symbol-svg[_ngcontent-%COMP%] {\n  margin-bottom: 2px;\n  flex-shrink: 0;\n}\n.symbol-svg[_ngcontent-%COMP%]   path[_ngcontent-%COMP%] {\n  stroke: var(--text-color, #333);\n  stroke-width: 2;\n  transition: stroke 0.2s ease;\n}\n.symbol-item[_ngcontent-%COMP%]:hover   .symbol-svg[_ngcontent-%COMP%]   path[_ngcontent-%COMP%] {\n  stroke: var(--primary-color, #007bff);\n  stroke-width: 2.5;\n}\n.symbol-item[_ngcontent-%COMP%]   span[_ngcontent-%COMP%] {\n  font-size: 0.55em;\n  text-align: center;\n  color: var(--text-secondary, #666);\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  max-width: 48px;\n}\n.symbol-item[_ngcontent-%COMP%]:hover   span[_ngcontent-%COMP%] {\n  color: var(--text-color, #333);\n  font-weight: 500;\n}\n.symbol-palette[_ngcontent-%COMP%]::-webkit-scrollbar {\n  height: 6px;\n}\n.symbol-palette[_ngcontent-%COMP%]::-webkit-scrollbar-track {\n  background: var(--surface-color, #f1f1f1);\n  border-radius: 3px;\n}\n.symbol-palette[_ngcontent-%COMP%]::-webkit-scrollbar-thumb {\n  background: var(--border-color, #ccc);\n  border-radius: 3px;\n}\n.symbol-palette[_ngcontent-%COMP%]::-webkit-scrollbar-thumb:hover {\n  background: var(--text-secondary, #999);\n}\n@media (prefers-color-scheme: dark) {\n  .symbol-palette[_ngcontent-%COMP%] {\n    background: var(--surface-color, #2a2a2a);\n  }\n  .category-header[_ngcontent-%COMP%] {\n    background: var(--surface-color, #2a2a2a);\n    border-color: var(--border-color, #444);\n    color: var(--text-color, #e0e0e0);\n  }\n  .category-header[_ngcontent-%COMP%]:hover {\n    background: var(--hover-bg, #3a3a3a);\n  }\n  .symbol-category.expanded[_ngcontent-%COMP%]   .category-header[_ngcontent-%COMP%] {\n    background: var(--primary-color, #007bff);\n    border-color: var(--primary-color, #007bff);\n    color: white;\n  }\n  .symbol-grid[_ngcontent-%COMP%] {\n    background: var(--surface-color, #1a1a1a);\n    border-color: var(--border-color, #444);\n  }\n  .symbol-item[_ngcontent-%COMP%] {\n    background: var(--surface-color, #2a2a2a);\n    border-color: var(--border-color, #444);\n  }\n  .symbol-item[_ngcontent-%COMP%]:hover {\n    background: var(--hover-bg, #3a3a3a);\n    border-color: var(--primary-color, #007bff);\n    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);\n  }\n  .symbol-svg[_ngcontent-%COMP%]   path[_ngcontent-%COMP%] {\n    stroke: var(--text-color, #e0e0e0);\n  }\n  .symbol-item[_ngcontent-%COMP%]:hover   .symbol-svg[_ngcontent-%COMP%]   path[_ngcontent-%COMP%] {\n    stroke: var(--primary-color, #4da3ff);\n  }\n  .symbol-item[_ngcontent-%COMP%]   span[_ngcontent-%COMP%] {\n    color: var(--text-secondary, #999);\n  }\n  .symbol-item[_ngcontent-%COMP%]:hover   span[_ngcontent-%COMP%] {\n    color: var(--text-color, #e0e0e0);\n  }\n  .symbol-palette[_ngcontent-%COMP%]::-webkit-scrollbar-track {\n    background: var(--surface-color, #1a1a1a);\n  }\n  .symbol-palette[_ngcontent-%COMP%]::-webkit-scrollbar-thumb {\n    background: var(--border-color, #555);\n  }\n  .symbol-palette[_ngcontent-%COMP%]::-webkit-scrollbar-thumb:hover {\n    background: var(--text-secondary, #777);\n  }\n}\n/*# sourceMappingURL=symbol-palette.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(SymbolPaletteComponent, { className: "SymbolPaletteComponent", filePath: "src/app/shared/image/refactored/symbol-palette/symbol-palette.component.ts", lineNumber: 12 });
})();

// src/app/shared/image/refactored/services/zoom-pan.service.ts
var ZoomPanService = class _ZoomPanService {
  MIN_SCALE = 0.1;
  MAX_SCALE = 10;
  ZOOM_FACTOR_IN = 1.2;
  ZOOM_FACTOR_OUT = 0.8;
  calculateZoom(event, currentState, containerRect, imageRect) {
    const mouseX = event.clientX - containerRect.left;
    const mouseY = event.clientY - containerRect.top;
    const delta = event.deltaY > 0 ? this.ZOOM_FACTOR_OUT : this.ZOOM_FACTOR_IN;
    const newScale = Math.min(Math.max(this.MIN_SCALE, currentState.scale * delta), this.MAX_SCALE);
    const newPosition = this.calculatePosition(mouseX, mouseY, currentState, newScale, imageRect);
    return {
      scale: newScale,
      pointX: newPosition.left,
      pointY: newPosition.top
    };
  }
  calculatePosition(mouseX, mouseY, currentState, newScale, imageRect) {
    const relativeX = (mouseX - currentState.pointX) / imageRect.width;
    const relativeY = (mouseY - currentState.pointY) / imageRect.height;
    const newWidth = imageRect.width * newScale / currentState.scale;
    const newHeight = imageRect.height * newScale / currentState.scale;
    const newLeft = mouseX - relativeX * newWidth;
    const newTop = mouseY - relativeY * newHeight;
    return { left: newLeft, top: newTop };
  }
  calculatePan(startPos, currentPos, initialTransform) {
    return {
      pointX: initialTransform.pointX + (currentPos.x - startPos.x),
      pointY: initialTransform.pointY + (currentPos.y - startPos.y)
    };
  }
  applyTransform(element, state, transition = "0s") {
    element.style.setProperty("--transition-duration", transition);
    element.style.transform = `translate(${state.pointX}px, ${state.pointY}px) scale(${state.scale})`;
  }
  static \u0275fac = function ZoomPanService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _ZoomPanService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _ZoomPanService, factory: _ZoomPanService.\u0275fac, providedIn: "root" });
};

// src/app/features/loto-points/refactored/services/rf-loto-point-api.service.ts
var RfLotoPointApiService = class _RfLotoPointApiService {
  http;
  apiUrl = `${environment.apiUrl}/loto-points`;
  // Subject to broadcast LOTO point updates to all listening components
  lotoPointUpdatedSubject = new Subject();
  lotoPointUpdated$ = this.lotoPointUpdatedSubject.asObservable();
  // Subject to broadcast LOTO point deletions
  lotoPointDeletedSubject = new Subject();
  lotoPointDeleted$ = this.lotoPointDeletedSubject.asObservable();
  constructor(http) {
    this.http = http;
  }
  getLotoPoints(page = 1, pageSize = 50) {
    const params = new HttpParams().set("page", page.toString()).set("pageSize", pageSize.toString());
    return this.http.get(`${this.apiUrl}/paginated`, { params });
  }
  searchLotoPoints(criteria, pageSize) {
    const params = new HttpParams().set("page", (criteria.page ?? 1).toString()).set("pageSize", pageSize.toString());
    return this.http.post(`${this.apiUrl}/search`, criteria, { params });
  }
  searchLpByBaseTagNumber(criteria, pageSize) {
    const params = new HttpParams().set("page", (criteria.page ?? 1).toString()).set("pageSize", pageSize.toString());
    return this.http.post(`${this.apiUrl}/search-by-base-tag-number`, criteria, { params });
  }
  getLotoPointById(id) {
    return this.http.get(`${this.apiUrl}/${id}`);
  }
  createLotoPoint(lotoPoint) {
    console.log("createLotoPoint received:", lotoPoint);
    console.log("Has toIdModel?", typeof lotoPoint.toIdModel === "function");
    let lotoPointIdDto;
    if (typeof lotoPoint.toIdModel === "function") {
      console.log("Converting using toIdModel");
      lotoPointIdDto = lotoPoint.toIdModel();
    } else {
      console.log("Creating new LotoPointDto and converting");
      const dto = new LotoPointDto(lotoPoint);
      lotoPointIdDto = dto.toIdModel();
    }
    console.log("Sending to backend:", lotoPointIdDto);
    return this.http.post(this.apiUrl, lotoPointIdDto);
  }
  updateLotoPoint(lotoPoint) {
    let lotoPointIdDto;
    if (typeof lotoPoint.toIdModel === "function") {
      lotoPointIdDto = lotoPoint.toIdModel();
    } else if (this.isLotoPointIdDto(lotoPoint)) {
      lotoPointIdDto = lotoPoint;
    } else {
      const dto = new LotoPointDto(lotoPoint);
      lotoPointIdDto = dto.toIdModel();
    }
    const headers = new HttpHeaders().set("Content-Type", "application/json");
    return this.http.put(`${this.apiUrl}`, lotoPointIdDto, { headers }).pipe(tap((response) => {
      if (response.responseData) {
        const updatedLotoPoint = LotoPointDto.fromJson(response.responseData);
        this.lotoPointUpdatedSubject.next(updatedLotoPoint);
      }
    }));
  }
  /**
   * Save LOTO point - creates if new, updates if existing
   * Broadcasts the update to all listening components
   */
  saveLotoPoint(lotoPoint) {
    const saveObservable = lotoPoint.id ? this.updateLotoPoint(lotoPoint) : this.createLotoPoint(lotoPoint);
    return saveObservable.pipe(tap((response) => {
      if (response.responseData) {
        const updatedLotoPoint = LotoPointDto.fromJson(response.responseData);
        this.lotoPointUpdatedSubject.next(updatedLotoPoint);
      }
    }));
  }
  // Type guard function
  isLotoPointIdDto(object) {
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        const value = object[key];
        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
          return false;
        }
      }
    }
    return true;
  }
  /**
   * Delete a LOTO point safely.
   * - Deletes all associated equipment (and handles their file relationships)
   * - Handles counterpart relationship (delete or unlink based on deleteCounterpart param)
   * - Soft deletes the LOTO point
   *
   * @param id The LOTO point ID to delete
   * @param deleteCounterpart If true, also deletes the counterpart LOTO point (default: false)
   * @param counterpartId Optional: The counterpart ID to also broadcast deletion for (when deleteCounterpart is true)
   * @returns Observable with the deleted LOTO point DTO
   */
  deleteLotoPoint(id, deleteCounterpart = false, counterpartId) {
    const params = new HttpParams().set("deleteCounterpart", deleteCounterpart.toString());
    return this.http.delete(`${this.apiUrl}/${id}`, { params }).pipe(tap((response) => {
      const numericId = typeof id === "string" ? parseInt(id, 10) : id;
      this.lotoPointDeletedSubject.next(numericId);
      if (deleteCounterpart) {
        const deletedCounterpartId = counterpartId || response?.responseData?.counterpartId;
        if (deletedCounterpartId) {
          this.lotoPointDeletedSubject.next(deletedCounterpartId);
        }
      }
    }));
  }
  getLotoPointsByFileId(fileId) {
    return this.http.get(`${this.apiUrl}/file/${fileId}`);
  }
  getRelatedImages(id) {
    return this.http.get(`${this.apiUrl}/${id}/related-images`);
  }
  getRelatedFiles(lotoPointId) {
    return this.http.get(`${this.apiUrl}/${lotoPointId}/related-files`);
  }
  getUniqueValuesOfColumn(column) {
    return this.http.get(`${this.apiUrl}/unique-values/${column}`);
  }
  // getFilteredUniqueValuesOfColumn(
  //   column: string,
  //   filters: { [key: string]: string },
  //   page: number = 1,
  //   pageSize: number = 50,
  //   andLogicEnabled: boolean = true
  // ): Observable<SpringPaginatedResponse<LotoPointDto>> {
  //   const params = new HttpParams()
  //     .set('page', page.toString())
  //     .set('pageSize', pageSize.toString())
  //     .set('andLogicEnabled', andLogicEnabled.toString());
  //   return this.http.post<SpringPaginatedResponse<LotoPointDto>>(
  //     `${this.apiUrl}/unique-values/${column}/filtered`,
  //     filters,
  //     { params }
  //   );
  // }
  getFilteredUniqueValuesOfColumn(column, searchCriterica, page = 1, pageSize = 50, andLogicEnabled = true) {
    const params = new HttpParams().set("page", page.toString()).set("pageSize", pageSize.toString()).set("andLogicEnabled", andLogicEnabled.toString());
    return this.http.post(`${this.apiUrl}/unique-values/${column}/filtered`, searchCriterica, { params });
  }
  /**
   * Get LOTO points grouped by specified criteria for left menu
   * @param groupBy The grouping criteria: equipmentType, location, file, system, unit, zeroEnergyMethod
   * @returns Map of group names to arrays of LOTO points
   */
  getGroupedLotoPoints(groupBy) {
    const params = new HttpParams().set("groupBy", groupBy);
    return this.http.get(`${this.apiUrl}/grouped`, { params });
  }
  /**
   * Get lightweight summaries of all LOTO points for caching
   * Returns only essential fields needed for grouping and display
   * Much faster and smaller payload than full DTOs
   */
  getSummaries() {
    return this.http.get(`${this.apiUrl}/summary`);
  }
  /**
   * Get the unit counterpart for a LOTO point by ID.
   * Returns counterpart data including:
   * - counterpart: LotoPointDto (existing or suggested)
   * - isNew: boolean indicating if counterpart needs to be created
   * - sourceUnit: the source unit prefix (01 or 02)
   * - targetUnit: the target unit prefix (02 or 01)
   */
  getUnitCounterpart(id) {
    return this.http.get(`${this.apiUrl}/${id}/counterpart`);
  }
  /**
   * Get the unit counterpart by tag number (for new items being created).
   * Returns counterpart data including:
   * - counterpart: LotoPointDto (existing or suggested)
   * - isNew: boolean indicating if counterpart needs to be created
   * - sourceUnit: the source unit prefix (01 or 02)
   * - targetUnit: the target unit prefix (02 or 01)
   */
  getCounterpartByTagNumber(tagNumber) {
    const params = new HttpParams().set("tagNumber", tagNumber);
    return this.http.get(`${this.apiUrl}/counterpart-by-tag`, { params });
  }
  /**
   * Get counterpart by ID directly (when counterpartId is already known).
   */
  getCounterpartById(counterpartId) {
    return this.http.get(`${this.apiUrl}/counterpart/${counterpartId}`);
  }
  /**
   * Link two LOTO points as counterparts (bidirectional).
   * Sets counterpartId on both points.
   */
  linkCounterparts(point1Id, point2Id) {
    const params = new HttpParams().set("point1Id", point1Id.toString()).set("point2Id", point2Id.toString());
    return this.http.post(`${this.apiUrl}/link-counterparts`, null, { params });
  }
  /**
   * Unlink counterpart relationship (bidirectional).
   * Removes counterpartId from both points.
   */
  unlinkCounterpart(pointId) {
    return this.http.post(`${this.apiUrl}/${pointId}/unlink-counterpart`, null);
  }
  /**
   * Get the usage count for a ZeroEnergy record (how many LotoPoints reference it).
   */
  getZeroEnergyUsageCount(zeroEnergyId) {
    return this.http.get(`${this.apiUrl}/zero-energy/${zeroEnergyId}/usage-count`);
  }
  /**
   * Look up counterpart equipment for ZeroEnergy transfer.
   * For each source equipment ID, finds the counterpart equipment for the target unit.
   *
   * @param sourceEquipmentIds List of equipment IDs from the source unit
   * @param sourceUnit The source unit prefix ("01" or "02")
   * @returns Observable with list of counterpart EquipmentDto objects
   */
  lookupCounterpartEquipment(sourceEquipmentIds, sourceUnit) {
    return this.http.post(`${this.apiUrl}/lookup-counterpart-equipment`, {
      sourceEquipmentIds,
      sourceUnit
    });
  }
  /**
   * Look up counterpart LOTO points for ZeroEnergy transfer.
   * For each source LOTO point ID, finds the counterpart LOTO point for the target unit.
   *
   * @param sourceLotoPointIds List of LOTO point IDs from the source unit
   * @param sourceUnit The source unit prefix ("01" or "02")
   * @returns Observable with list of counterpart LotoPointDto objects
   */
  lookupCounterpartLotoPoints(sourceLotoPointIds, sourceUnit) {
    return this.http.post(`${this.apiUrl}/lookup-counterpart-loto-points`, {
      sourceLotoPointIds,
      sourceUnit
    });
  }
  bulkSearchByText(text) {
    return this.http.post(`${this.apiUrl}/bulk-search`, { text });
  }
  static \u0275fac = function RfLotoPointApiService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _RfLotoPointApiService)(\u0275\u0275inject(HttpClient));
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _RfLotoPointApiService, factory: _RfLotoPointApiService.\u0275fac, providedIn: "root" });
};

export {
  RfLotoPointApiService,
  PIDSymbolsService,
  SymbolPaletteComponent,
  ZoomPanService
};
//# sourceMappingURL=chunk-QNGYFE3M.js.map
