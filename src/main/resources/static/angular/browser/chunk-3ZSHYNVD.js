import {
  FormRendererComponent
} from "./chunk-74NDDOPI.js";
import "./chunk-R4XEPM3C.js";
import {
  EntityLoaderService
} from "./chunk-MDZWWHXT.js";
import "./chunk-2MZRWINU.js";
import "./chunk-B7QPVHEX.js";
import "./chunk-VPLEDPJD.js";
import {
  FormStateService,
  PrintableFormDto
} from "./chunk-VDR6ALQ6.js";
import "./chunk-7ZBWWDK2.js";
import {
  toSignal
} from "./chunk-BLD5MXQL.js";
import {
  computed,
  inject,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵdefineComponent,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵproperty
} from "./chunk-W4KMF4YJ.js";
import "./chunk-N6ESDQJH.js";

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
//# sourceMappingURL=chunk-3ZSHYNVD.js.map
