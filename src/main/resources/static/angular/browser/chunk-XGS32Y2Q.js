import {
  FormRendererComponent
} from "./chunk-OOBPS3FM.js";
import {
  EntityLoaderService
} from "./chunk-Q4NMF6LB.js";
import "./chunk-5RTLZHJG.js";
import "./chunk-C3MIWPDE.js";
import {
  FormStateService,
  PrintableFormDto
} from "./chunk-GLQJSYC5.js";
import {
  computed,
  inject,
  toSignal,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵdefineComponent,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵproperty
} from "./chunk-AVNJ6D7Z.js";
import "./chunk-TXDUYLVM.js";

// src/app/features/form-designer-refactored/form-designer-preview/form-designer-preview.component.ts
var FormDesignerPreviewComponent = class _FormDesignerPreviewComponent {
  formState = inject(FormStateService);
  entityLoader = inject(EntityLoaderService);
  form = toSignal(this.formState.form$, { initialValue: new PrintableFormDto() });
  data = computed(() => {
    const formType = this.form()?.formType;
    if (!formType)
      return {};
    return this.entityLoader.getSampleData(formType);
  });
  static \u0275fac = function FormDesignerPreviewComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _FormDesignerPreviewComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _FormDesignerPreviewComponent, selectors: [["app-form-designer-preview"]], decls: 2, vars: 2, consts: [[1, "preview-container"], [3, "formDefinition", "formData"]], template: function FormDesignerPreviewComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0);
      \u0275\u0275element(1, "app-form-renderer", 1);
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      \u0275\u0275advance();
      \u0275\u0275property("formDefinition", ctx.form())("formData", ctx.data());
    }
  }, dependencies: [FormRendererComponent], styles: ["\n\n.preview-container[_ngcontent-%COMP%] {\n  width: 100%;\n  height: 100%;\n  overflow: auto;\n}\n/*# sourceMappingURL=form-designer-preview.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(FormDesignerPreviewComponent, { className: "FormDesignerPreviewComponent", filePath: "src/app/features/form-designer-refactored/form-designer-preview/form-designer-preview.component.ts", lineNumber: 15 });
})();
export {
  FormDesignerPreviewComponent
};
//# sourceMappingURL=chunk-XGS32Y2Q.js.map
