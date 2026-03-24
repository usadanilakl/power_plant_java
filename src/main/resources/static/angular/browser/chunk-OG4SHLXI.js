import {
  FormStateService,
  PrintableFormDto
} from "./chunk-52YAMMEI.js";
import {
  toSignal
} from "./chunk-7P7YM7O4.js";
import "./chunk-HH6S5SLA.js";
import {
  Router
} from "./chunk-OKWMHAJY.js";
import {
  CommonModule,
  NgStyle,
  inject,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵdefineComponent,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtext,
  ɵɵtextInterpolate
} from "./chunk-LMIOZ4NA.js";
import "./chunk-TXDUYLVM.js";

// src/app/features/form-designer-refactored/form-designer-forms/form-designer-forms.component.ts
var _forTrack0 = ($index, $item) => $item.id;
function FormDesignerFormsComponent_For_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "th");
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const col_r1 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(col_r1.header);
  }
}
function FormDesignerFormsComponent_For_13_For_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "td", 5);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const col_r5 = ctx.$implicit;
    const form_r4 = \u0275\u0275nextContext().$implicit;
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275property("ngStyle", ctx_r1.getCellStyle(form_r4, col_r5));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r1.getCellValue(form_r4, col_r5));
  }
}
function FormDesignerFormsComponent_For_13_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "tr", 4);
    \u0275\u0275listener("click", function FormDesignerFormsComponent_For_13_Template_tr_click_0_listener() {
      const form_r4 = \u0275\u0275restoreView(_r3).$implicit;
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.selectForm(form_r4));
    });
    \u0275\u0275repeaterCreate(1, FormDesignerFormsComponent_For_13_For_2_Template, 2, 2, "td", 5, _forTrack0);
    \u0275\u0275elementStart(3, "td", 6)(4, "button", 7);
    \u0275\u0275listener("click", function FormDesignerFormsComponent_For_13_Template_button_click_4_listener($event) {
      const form_r4 = \u0275\u0275restoreView(_r3).$implicit;
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.copyForm(form_r4, $event));
    });
    \u0275\u0275text(5, "Copy");
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r1.columns);
  }
}
function FormDesignerFormsComponent_ForEmpty_14_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "tr")(1, "td", 8);
    \u0275\u0275text(2, " No forms found. Create one from the left menu. ");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275attribute("colspan", ctx_r1.columns.length + 1);
  }
}
var FormDesignerFormsComponent = class _FormDesignerFormsComponent {
  formState = inject(FormStateService);
  router = inject(Router);
  forms = toSignal(this.formState.allForms$, { initialValue: [] });
  columns = PrintableFormDto.toTableColumns(["name", "formType", "isVerified"]);
  selectForm(form) {
    this.formState.setCurrentFormById(form.id);
    this.router.navigate(["/form-designer/design"]);
  }
  copyForm(form, event) {
    event.stopPropagation();
    this.formState.copyForm(form.id);
  }
  getCellValue(form, column) {
    if (column.accessorFn)
      return column.accessorFn(form);
    if (column.accessorKey)
      return form[column.accessorKey] ?? "";
    return "";
  }
  getCellStyle(form, column) {
    return column.conditionalStyling ? column.conditionalStyling(form, column) : {};
  }
  static \u0275fac = function FormDesignerFormsComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _FormDesignerFormsComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _FormDesignerFormsComponent, selectors: [["app-form-designer-forms"]], decls: 15, vars: 1, consts: [[1, "forms-container"], [1, "header"], [1, "forms-table"], [1, "form-row"], [1, "form-row", 3, "click"], [3, "ngStyle"], [1, "actions-cell"], ["title", "Copy", 1, "action-btn", 3, "click"], [1, "empty-state"]], template: function FormDesignerFormsComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "h2");
      \u0275\u0275text(3, "Existing Forms");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(4, "table", 2)(5, "thead")(6, "tr");
      \u0275\u0275repeaterCreate(7, FormDesignerFormsComponent_For_8_Template, 2, 1, "th", null, _forTrack0);
      \u0275\u0275elementStart(9, "th");
      \u0275\u0275text(10, "Actions");
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(11, "tbody");
      \u0275\u0275repeaterCreate(12, FormDesignerFormsComponent_For_13_Template, 6, 0, "tr", 3, _forTrack0, false, FormDesignerFormsComponent_ForEmpty_14_Template, 3, 1, "tr");
      \u0275\u0275elementEnd()()();
    }
    if (rf & 2) {
      \u0275\u0275advance(7);
      \u0275\u0275repeater(ctx.columns);
      \u0275\u0275advance(5);
      \u0275\u0275repeater(ctx.forms());
    }
  }, dependencies: [CommonModule, NgStyle], styles: ["\n\n.forms-container[_ngcontent-%COMP%] {\n  padding: 20px;\n  height: 100%;\n}\n.header[_ngcontent-%COMP%] {\n  margin-bottom: 16px;\n}\n.header[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%] {\n  margin: 0;\n  font-size: 1.5rem;\n}\n.forms-table[_ngcontent-%COMP%] {\n  width: 100%;\n  border-collapse: collapse;\n  background-color: white;\n  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);\n  border-radius: 4px;\n  overflow: hidden;\n}\n.forms-table[_ngcontent-%COMP%]   th[_ngcontent-%COMP%] {\n  background-color: #f5f5f5;\n  padding: 12px 16px;\n  text-align: left;\n  font-weight: 600;\n  border-bottom: 2px solid #ddd;\n}\n.forms-table[_ngcontent-%COMP%]   td[_ngcontent-%COMP%] {\n  padding: 10px 16px;\n  border-bottom: 1px solid #eee;\n}\n.form-row[_ngcontent-%COMP%] {\n  cursor: pointer;\n  transition: background-color 0.2s;\n}\n.form-row[_ngcontent-%COMP%]:hover {\n  background-color: #f0f7ff;\n}\n.actions-cell[_ngcontent-%COMP%] {\n  text-align: center;\n}\n.action-btn[_ngcontent-%COMP%] {\n  padding: 4px 12px;\n  border: 1px solid #ccc;\n  background-color: #f9f9f9;\n  border-radius: 4px;\n  cursor: pointer;\n  font-size: 12px;\n}\n.action-btn[_ngcontent-%COMP%]:hover {\n  background-color: #e9e9e9;\n}\n.empty-state[_ngcontent-%COMP%] {\n  text-align: center;\n  padding: 40px;\n  color: #999;\n  font-style: italic;\n}\n/*# sourceMappingURL=form-designer-forms.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(FormDesignerFormsComponent, { className: "FormDesignerFormsComponent", filePath: "src/app/features/form-designer-refactored/form-designer-forms/form-designer-forms.component.ts", lineNumber: 16 });
})();
export {
  FormDesignerFormsComponent
};
//# sourceMappingURL=chunk-OG4SHLXI.js.map
