import {
  DiagramApiService
} from "./chunk-KSE3P6BZ.js";
import {
  Router
} from "./chunk-4PYQZ7JD.js";
import {
  CommonModule,
  DatePipe,
  inject,
  signal,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵconditional,
  ɵɵdefineComponent,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵnextContext,
  ɵɵpipe,
  ɵɵpipeBind2,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtextInterpolate2
} from "./chunk-W4KMF4YJ.js";
import "./chunk-N6ESDQJH.js";

// src/app/features/diagram-builder/components/diagram-list/diagram-list.component.ts
var _forTrack0 = ($index, $item) => $item.id;
function DiagramListComponent_Conditional_13_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 5);
    \u0275\u0275text(1, "Loading diagrams...");
    \u0275\u0275elementEnd();
  }
}
function DiagramListComponent_Conditional_14_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 6)(1, "p");
    \u0275\u0275text(2, "No diagrams yet. Create your first one!");
    \u0275\u0275elementEnd()();
  }
}
function DiagramListComponent_Conditional_15_For_2_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0);
    \u0275\u0275pipe(1, "date");
  }
  if (rf & 2) {
    const diagram_r2 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275textInterpolate1(" \xB7 Modified ", \u0275\u0275pipeBind2(1, 1, diagram_r2.dateModified, "short"), " ");
  }
}
function DiagramListComponent_Conditional_15_For_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 9);
    \u0275\u0275listener("click", function DiagramListComponent_Conditional_15_For_2_Template_div_click_0_listener() {
      const diagram_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.openBuilder(diagram_r2.id));
    });
    \u0275\u0275elementStart(1, "div", 10)(2, "h3");
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "p", 11);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "p", 12);
    \u0275\u0275text(7);
    \u0275\u0275template(8, DiagramListComponent_Conditional_15_For_2_Conditional_8_Template, 2, 4);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(9, "div", 13)(10, "button", 14);
    \u0275\u0275listener("click", function DiagramListComponent_Conditional_15_For_2_Template_button_click_10_listener($event) {
      const diagram_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      ctx_r2.openBuilder(diagram_r2.id);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275text(11, "Edit");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(12, "button", 14);
    \u0275\u0275listener("click", function DiagramListComponent_Conditional_15_For_2_Template_button_click_12_listener($event) {
      const diagram_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      ctx_r2.openViewer(diagram_r2.id);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275text(13, "View");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(14, "button", 15);
    \u0275\u0275listener("click", function DiagramListComponent_Conditional_15_For_2_Template_button_click_14_listener($event) {
      const diagram_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      ctx_r2.deleteDiagram(diagram_r2.id);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275text(15, "Delete");
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const diagram_r2 = ctx.$implicit;
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(diagram_r2.name || "Untitled");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(diagram_r2.description || "No description");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate2(" ", diagram_r2.canvasWidth, "\xD7", diagram_r2.canvasHeight, " ");
    \u0275\u0275advance();
    \u0275\u0275conditional(diagram_r2.dateModified ? 8 : -1);
  }
}
function DiagramListComponent_Conditional_15_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 7);
    \u0275\u0275repeaterCreate(1, DiagramListComponent_Conditional_15_For_2_Template, 16, 5, "div", 8, _forTrack0);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r2.diagrams());
  }
}
var DiagramListComponent = class _DiagramListComponent {
  api = inject(DiagramApiService);
  router = inject(Router);
  diagrams = signal([]);
  loading = signal(true);
  ngOnInit() {
    this.loadDiagrams();
  }
  loadDiagrams() {
    this.loading.set(true);
    this.api.getAll().subscribe({
      next: (res) => {
        this.diagrams.set(res.responseData || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
  createNew() {
    this.router.navigate(["/diagram-builder", "new"]);
  }
  seedFeedwaterTest() {
    this.api.seedFeedwaterControlTest().subscribe({
      next: (res) => {
        const diagram = res.responseData;
        this.loadDiagrams();
        if (diagram?.id) {
          this.router.navigate(["/diagram-builder", "build", diagram.id]);
        }
      }
    });
  }
  seedSealOilTest() {
    this.api.seedSealOilSystem().subscribe({
      next: (res) => {
        const diagram = res.responseData;
        this.loadDiagrams();
        if (diagram?.id) {
          this.router.navigate(["/diagram-builder", "build", diagram.id]);
        }
      }
    });
  }
  seedLubeOilTest() {
    this.api.seedLubeOilSystem().subscribe({
      next: (res) => {
        const diagram = res.responseData;
        this.loadDiagrams();
        if (diagram?.id) {
          this.router.navigate(["/diagram-builder", "build", diagram.id]);
        }
      }
    });
  }
  openBuilder(id) {
    this.router.navigate(["/diagram-builder", "build", id]);
  }
  openViewer(id) {
    this.router.navigate(["/diagram-builder", "view", id]);
  }
  deleteDiagram(id) {
    this.api.delete(id).subscribe({
      next: () => this.loadDiagrams()
    });
  }
  static \u0275fac = function DiagramListComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _DiagramListComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _DiagramListComponent, selectors: [["app-diagram-list"]], decls: 16, vars: 1, consts: [[1, "diagram-list-page"], [1, "header"], [1, "header-actions"], [1, "btn-secondary", 3, "click"], [1, "btn-primary", 3, "click"], [1, "loading"], [1, "empty-state"], [1, "diagram-grid"], [1, "diagram-card"], [1, "diagram-card", 3, "click"], [1, "card-body"], [1, "description"], [1, "meta"], [1, "card-actions"], [1, "btn-sm", 3, "click"], [1, "btn-sm", "danger", 3, "click"]], template: function DiagramListComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "h2");
      \u0275\u0275text(3, "Diagrams");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(4, "div", 2)(5, "button", 3);
      \u0275\u0275listener("click", function DiagramListComponent_Template_button_click_5_listener() {
        return ctx.seedFeedwaterTest();
      });
      \u0275\u0275text(6, "Seed Feedwater Test");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(7, "button", 3);
      \u0275\u0275listener("click", function DiagramListComponent_Template_button_click_7_listener() {
        return ctx.seedSealOilTest();
      });
      \u0275\u0275text(8, "Seed Seal Oil System");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(9, "button", 3);
      \u0275\u0275listener("click", function DiagramListComponent_Template_button_click_9_listener() {
        return ctx.seedLubeOilTest();
      });
      \u0275\u0275text(10, "Seed Lube Oil System");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(11, "button", 4);
      \u0275\u0275listener("click", function DiagramListComponent_Template_button_click_11_listener() {
        return ctx.createNew();
      });
      \u0275\u0275text(12, "+ New Diagram");
      \u0275\u0275elementEnd()()();
      \u0275\u0275template(13, DiagramListComponent_Conditional_13_Template, 2, 0, "p", 5)(14, DiagramListComponent_Conditional_14_Template, 3, 0, "div", 6)(15, DiagramListComponent_Conditional_15_Template, 3, 0, "div", 7);
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      \u0275\u0275advance(13);
      \u0275\u0275conditional(ctx.loading() ? 13 : ctx.diagrams().length === 0 ? 14 : 15);
    }
  }, dependencies: [CommonModule, DatePipe], styles: ["\n\n.diagram-list-page[_ngcontent-%COMP%] {\n  padding: 24px;\n  background: #121212;\n  color: #e0e0e0;\n  min-height: 100%;\n}\n.header[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  margin-bottom: 24px;\n}\n.header-actions[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 12px;\n  align-items: center;\n}\nh2[_ngcontent-%COMP%] {\n  margin: 0;\n}\n.btn-primary[_ngcontent-%COMP%] {\n  padding: 8px 16px;\n  background: #1565c0;\n  color: white;\n  border: none;\n  border-radius: 4px;\n  cursor: pointer;\n  font-size: 14px;\n}\n.btn-primary[_ngcontent-%COMP%]:hover {\n  background: #1976d2;\n}\n.btn-secondary[_ngcontent-%COMP%] {\n  padding: 8px 16px;\n  background: #2e7d32;\n  color: white;\n  border: none;\n  border-radius: 4px;\n  cursor: pointer;\n  font-size: 14px;\n}\n.btn-secondary[_ngcontent-%COMP%]:hover {\n  background: #388e3c;\n}\n.diagram-grid[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));\n  gap: 16px;\n}\n.diagram-card[_ngcontent-%COMP%] {\n  background: #1e1e1e;\n  border: 1px solid #333;\n  border-radius: 8px;\n  padding: 16px;\n  cursor: pointer;\n  transition: border-color 0.2s;\n}\n.diagram-card[_ngcontent-%COMP%]:hover {\n  border-color: #2196f3;\n}\n.card-body[_ngcontent-%COMP%]   h3[_ngcontent-%COMP%] {\n  margin: 0 0 8px;\n  font-size: 16px;\n}\n.description[_ngcontent-%COMP%] {\n  font-size: 13px;\n  color: #888;\n  margin: 0 0 8px;\n}\n.meta[_ngcontent-%COMP%] {\n  font-size: 12px;\n  color: #666;\n  margin: 0;\n}\n.card-actions[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 8px;\n  margin-top: 12px;\n  padding-top: 12px;\n  border-top: 1px solid #333;\n}\n.btn-sm[_ngcontent-%COMP%] {\n  padding: 4px 12px;\n  background: #2a2a2a;\n  color: #ccc;\n  border: 1px solid #444;\n  border-radius: 4px;\n  cursor: pointer;\n  font-size: 12px;\n}\n.btn-sm[_ngcontent-%COMP%]:hover {\n  background: #3a3a3a;\n}\n.btn-sm.danger[_ngcontent-%COMP%]:hover {\n  background: #c62828;\n  border-color: #f44336;\n  color: white;\n}\n.loading[_ngcontent-%COMP%], \n.empty-state[_ngcontent-%COMP%] {\n  text-align: center;\n  padding: 48px;\n  color: #666;\n}\n/*# sourceMappingURL=diagram-list.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(DiagramListComponent, { className: "DiagramListComponent", filePath: "src/app/features/diagram-builder/components/diagram-list/diagram-list.component.ts", lineNumber: 131 });
})();
export {
  DiagramListComponent
};
//# sourceMappingURL=chunk-S6DZHJ4A.js.map
