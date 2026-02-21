import {
  CheckboxXComponent,
  InvisibleInputFieldComponent,
  InvisibleSearchableMultiSelectComponent,
  InvisibleSearchableSelectComponent,
  NestedFormInputComponent,
  RadioCheckboxesComponent
} from "./chunk-5RTLZHJG.js";
import {
  FormContainerDto,
  PrintableFormDto
} from "./chunk-GLQJSYC5.js";
import {
  CommonModule,
  DestroyRef,
  FormArray,
  FormBuilder,
  FormControl,
  FormControlDirective,
  FormGroup,
  FormGroupDirective,
  NgControlStatus,
  NgControlStatusGroup,
  NgStyle,
  ReactiveFormsModule,
  computed,
  debounceTime,
  distinctUntilChanged,
  effect,
  inject,
  input,
  output,
  signal,
  takeUntilDestroyed,
  ɵNgNoValidate,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵconditional,
  ɵɵdefineComponent,
  ɵɵdefineInjectable,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵpureFunction0,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵstyleMap,
  ɵɵstyleProp,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate1
} from "./chunk-AVNJ6D7Z.js";
import {
  __spreadProps,
  __spreadValues
} from "./chunk-TXDUYLVM.js";

// src/app/features/form-designer-refactored/services/form-array-processing.service.ts
var FormArrayProcessingService = class _FormArrayProcessingService {
  PIXELS_PER_INCH = 96;
  processFormArrays(formDefinition, formData, formValue) {
    if (!formDefinition || !formDefinition.formContainers)
      return formDefinition;
    const processed = [];
    for (const container of formDefinition.formContainers) {
      if ((container.contentType === "formField" || container.contentType === "repeatingSection") && this.isFormField(container.content) && container.content.type === "form-array") {
        processed.push(...this.processFormArray(container, formData, formValue, formDefinition.size));
      } else {
        processed.push(container);
      }
    }
    return new PrintableFormDto(__spreadProps(__spreadValues({}, formDefinition), { formContainers: processed }));
  }
  processFormArray(container, formData, formValue, formSize) {
    const field = container.content;
    const fieldName = field.name || "";
    const arrayData = this.getNestedValue(formValue, fieldName) || [];
    const arrayLength = Array.isArray(arrayData) ? arrayData.length : 0;
    if (arrayLength === 0)
      return [container];
    let nestedForm = field.nestedForm;
    if (!nestedForm && field.fields && field.fields.length > 0) {
      nestedForm = this.buildNestedFormFromFields(field.fields, formSize);
      field.nestedForm = nestedForm;
    }
    if (!nestedForm)
      return [container];
    const nestedFormHeight = nestedForm.size.height * this.PIXELS_PER_INCH;
    const pageHeight = formSize.height * this.PIXELS_PER_INCH;
    return this.calculatePagination(container, nestedFormHeight, arrayLength, pageHeight).containers;
  }
  calculatePagination(originalContainer, nestedFormHeight, arrayLength, pageHeight) {
    const containers = [];
    const containerY = originalContainer.position.y;
    const currentPage = originalContainer.pageNumber || 1;
    const spaceOnFirstPage = pageHeight - containerY;
    const itemsOnFirstPage = Math.max(1, Math.floor(spaceOnFirstPage / nestedFormHeight));
    let remaining = arrayLength;
    let startIndex = 0;
    let pageNumber = currentPage;
    while (remaining > 0) {
      const isFirst = pageNumber === currentPage;
      const items = isFirst ? Math.min(itemsOnFirstPage, remaining) : Math.min(Math.floor(pageHeight / nestedFormHeight), remaining);
      const endIndex = startIndex + items;
      const c = new FormContainerDto(__spreadProps(__spreadValues({}, originalContainer), {
        pageNumber,
        position: {
          x: originalContainer.position.x,
          y: isFirst ? containerY : 0
        },
        size: {
          width: originalContainer.size.width,
          height: nestedFormHeight * items
        }
      }));
      c.arrayIndexRange = { start: startIndex, end: endIndex };
      containers.push(c);
      remaining -= items;
      startIndex = endIndex;
      pageNumber++;
    }
    return { containers };
  }
  groupContainersByPage(containers) {
    const pageMap = /* @__PURE__ */ new Map();
    for (const c of containers) {
      const page = c.pageNumber || 1;
      if (!pageMap.has(page))
        pageMap.set(page, []);
      pageMap.get(page).push(c);
    }
    return Array.from(pageMap.entries()).map(([pageNumber, containers2]) => ({ pageNumber, containers: containers2 })).sort((a, b) => a.pageNumber - b.pageNumber);
  }
  getArrayItemsForContainer(container, arrayData) {
    const range = container.arrayIndexRange;
    if (!range || !Array.isArray(arrayData))
      return arrayData;
    return arrayData.slice(range.start, range.end);
  }
  getNestedValue(obj, path) {
    if (!obj || !path)
      return null;
    return path.split(".").reduce((prev, curr) => prev ? prev[curr] : null, obj);
  }
  buildNestedFormFromFields(fields, formSize) {
    const rowHeight = 30;
    const gap = 5;
    let yOffset = 0;
    const containers = [];
    for (let i = 0; i < fields.length; i++) {
      const f = fields[i];
      const h = f.type === "textarea" ? rowHeight * 2 : rowHeight;
      containers.push({
        id: -(i + 1),
        contentType: "formField",
        content: f,
        position: { x: 0, y: yOffset },
        size: { width: formSize.width * this.PIXELS_PER_INCH - 20, height: h },
        pageNumber: 1
      });
      yOffset += h + gap;
    }
    const totalHeight = yOffset / this.PIXELS_PER_INCH + 0.2;
    return {
      formContainers: containers,
      size: { width: formSize.width, height: Math.max(0.5, totalHeight) }
    };
  }
  isFormField(content) {
    return content && typeof content === "object" && "name" in content && "type" in content;
  }
  static \u0275fac = function FormArrayProcessingService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _FormArrayProcessingService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _FormArrayProcessingService, factory: _FormArrayProcessingService.\u0275fac, providedIn: "root" });
};

// src/app/features/form-designer-refactored/services/form-rendering.service.ts
var FormRenderingService = class _FormRenderingService {
  fb = inject(FormBuilder);
  createFormFromDefinition(formDefinition, formData, existingForm) {
    if (!formDefinition || !formDefinition.formContainers) {
      return this.fb.group({});
    }
    const fields = this.getAllFormFields(formDefinition);
    const form = this.fb.group({});
    for (const field of fields) {
      const name = field.name || "";
      if (!name)
        continue;
      const existing = existingForm?.get(name);
      if (field.type === "form-array") {
        if (existing instanceof FormArray) {
          form.addControl(name, existing);
        } else {
          const arrayData = this.getNestedValue(formData, name) || [];
          form.addControl(name, this.createFormArray(field, arrayData));
        }
      } else {
        if (existing) {
          form.addControl(name, existing);
        } else {
          let value = this.getNestedValue(formData, name);
          value = this.normalizeFieldValue(field, value);
          form.addControl(name, new FormControl(value, field.validators || []));
        }
      }
    }
    return form;
  }
  createFormArray(field, arrayData) {
    const formArray = this.fb.array([]);
    if (!Array.isArray(arrayData))
      return formArray;
    let nestedFields = field.nestedForm?.formContainers?.filter((c) => c.contentType === "formField" && this.isFormField(c.content)).map((c) => c.content) || [];
    if (nestedFields.length === 0 && field.fields && field.fields.length > 0) {
      nestedFields = field.fields;
    }
    for (const item of arrayData) {
      formArray.push(this.createArrayItem(nestedFields, item));
    }
    return formArray;
  }
  createArrayItem(fields, data = {}) {
    const group = {};
    for (const field of fields) {
      const name = field.name || "";
      if (!name)
        continue;
      const value = this.getNestedValue(data, name);
      if (field.type === "form-array") {
        group[name] = this.createFormArray(field, value || []);
      } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        group[name] = this.convertToFormGroup(value);
      } else {
        group[name] = [value, field.validators || []];
      }
    }
    return this.fb.group(group);
  }
  convertToFormGroup(obj) {
    if (obj === null || obj === void 0 || typeof obj !== "object" || Array.isArray(obj)) {
      return new FormControl(obj);
    }
    const group = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const val = obj[key];
        group[key] = typeof val === "object" && val !== null && !Array.isArray(val) ? this.convertToFormGroup(val) : new FormControl(val);
      }
    }
    return this.fb.group(group);
  }
  getAllFormFields(formDefinition) {
    if (!formDefinition || !formDefinition.formContainers)
      return [];
    const fields = [];
    const seen = /* @__PURE__ */ new Set();
    for (const container of formDefinition.formContainers) {
      if ((container.contentType === "formField" || container.contentType === "repeatingSection") && this.isFormField(container.content)) {
        const field = container.content;
        const name = field.name || "";
        if (name && !seen.has(name)) {
          fields.push(field);
          seen.add(name);
        }
      }
    }
    return fields;
  }
  deepMerge(target, source) {
    if (!source || typeof source !== "object")
      return target;
    if (!target || typeof target !== "object")
      return source;
    const result = __spreadValues({}, target);
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        const sv = source[key];
        const tv = target[key];
        if (Array.isArray(sv)) {
          result[key] = sv;
        } else if (typeof sv === "object" && sv !== null && typeof tv === "object" && tv !== null && !Array.isArray(tv)) {
          result[key] = this.deepMerge(tv, sv);
        } else {
          result[key] = sv;
        }
      }
    }
    return result;
  }
  getContainerStyles(container) {
    return __spreadProps(__spreadValues({}, container.style), {
      position: "absolute",
      left: `${container.position.x}px`,
      top: `${container.position.y}px`,
      width: `${container.size.width}px`,
      height: `${container.size.height}px`
    });
  }
  getContentStyles(container) {
    if (!container.contentStyle)
      return {};
    const styles = __spreadValues({}, container.contentStyle);
    if (styles.fontSize && typeof styles.fontSize === "number") {
      styles.fontSize = `${styles.fontSize}px`;
    }
    return styles;
  }
  normalizeFieldValue(field, value) {
    if (field.type === "file") {
      return null;
    }
    if (field.type === "checkbox-group" || field.type === "multi-select" || field.type === "multi-input") {
      return value || [];
    }
    if (field.type === "select" && typeof value === "object" && value !== null) {
      return value.id;
    }
    return value;
  }
  getNestedValue(obj, path) {
    if (!obj || !path)
      return null;
    return path.split(".").reduce((prev, curr) => prev ? prev[curr] : null, obj);
  }
  isFormField(content) {
    return content && typeof content === "object" && "name" in content && "type" in content;
  }
  static \u0275fac = function FormRenderingService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _FormRenderingService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _FormRenderingService, factory: _FormRenderingService.\u0275fac, providedIn: "root" });
};

// src/app/features/form-designer-refactored/form-renderer/form-container-renderer/form-container-renderer.component.ts
var _c0 = () => [];
var _c1 = () => [true, false];
function FormContainerRendererComponent_Conditional_1_Case_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-invisible-input-field", 10);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275styleMap(ctx_r0.asFormField(ctx_r0.container().content).style);
    \u0275\u0275property("formControl", ctx_r0.getFormControl(ctx_r0.asFormField(ctx_r0.container().content).name));
  }
}
function FormContainerRendererComponent_Conditional_1_Case_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-invisible-input-field", 11);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275styleMap(ctx_r0.asFormField(ctx_r0.container().content).style);
    \u0275\u0275property("formControl", ctx_r0.getFormControl(ctx_r0.asFormField(ctx_r0.container().content).name));
  }
}
function FormContainerRendererComponent_Conditional_1_Case_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-invisible-input-field", 12);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275styleMap(ctx_r0.asFormField(ctx_r0.container().content).style);
    \u0275\u0275property("formControl", ctx_r0.getFormControl(ctx_r0.asFormField(ctx_r0.container().content).name));
  }
}
function FormContainerRendererComponent_Conditional_1_Case_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-invisible-input-field", 13);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275styleMap(ctx_r0.asFormField(ctx_r0.container().content).style);
    \u0275\u0275property("formControl", ctx_r0.getFormControl(ctx_r0.asFormField(ctx_r0.container().content).name));
  }
}
function FormContainerRendererComponent_Conditional_1_Case_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-invisible-searchable-select", 14);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275styleMap(ctx_r0.asFormField(ctx_r0.container().content).style);
    \u0275\u0275property("formControl", ctx_r0.getFormControl(ctx_r0.asFormField(ctx_r0.container().content).name))("options", ctx_r0.asFormField(ctx_r0.container().content).options || \u0275\u0275pureFunction0(4, _c0));
  }
}
function FormContainerRendererComponent_Conditional_1_Case_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-invisible-searchable-multi-select", 14);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275styleMap(ctx_r0.asFormField(ctx_r0.container().content).style);
    \u0275\u0275property("formControl", ctx_r0.getFormControl(ctx_r0.asFormField(ctx_r0.container().content).name))("options", ctx_r0.asFormField(ctx_r0.container().content).options || \u0275\u0275pureFunction0(4, _c0));
  }
}
function FormContainerRendererComponent_Conditional_1_Case_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-checkbox-x", 15);
  }
  if (rf & 2) {
    let tmp_4_0;
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275styleMap(ctx_r0.asFormField(ctx_r0.container().content).style);
    \u0275\u0275property("formControl", ctx_r0.getFormControl(ctx_r0.asFormField(ctx_r0.container().content).name))("id", ctx_r0.asFormField(ctx_r0.container().content).name + (((tmp_4_0 = ctx_r0.formData()) == null ? null : tmp_4_0.id) || ""));
  }
}
function FormContainerRendererComponent_Conditional_1_Case_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-radio-checkboxes", 8);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275property("formControl", ctx_r0.getFormControl(ctx_r0.asFormField(ctx_r0.container().content).name))("name", ctx_r0.asFormField(ctx_r0.container().content).name)("options", \u0275\u0275pureFunction0(3, _c1));
  }
}
function FormContainerRendererComponent_Conditional_1_Case_8_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "app-nested-form-input", 16);
    \u0275\u0275listener("itemAdded", function FormContainerRendererComponent_Conditional_1_Case_8_Template_app_nested_form_input_itemAdded_0_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.onAddArrayItem($event));
    })("itemRemoved", function FormContainerRendererComponent_Conditional_1_Case_8_Template_app_nested_form_input_itemRemoved_0_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.onRemoveArrayItem($event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275property("formField", ctx_r0.asFormField(ctx_r0.container().content))("formArray", ctx_r0.getFormArray(ctx_r0.asFormField(ctx_r0.container().content).name))("fieldName", ctx_r0.asFormField(ctx_r0.container().content).name)("arrayIndexRange", ctx_r0.getArrayIndexRange());
  }
}
function FormContainerRendererComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, FormContainerRendererComponent_Conditional_1_Case_0_Template, 1, 3, "app-invisible-input-field", 2)(1, FormContainerRendererComponent_Conditional_1_Case_1_Template, 1, 3, "app-invisible-input-field", 3)(2, FormContainerRendererComponent_Conditional_1_Case_2_Template, 1, 3, "app-invisible-input-field", 4)(3, FormContainerRendererComponent_Conditional_1_Case_3_Template, 1, 3, "app-invisible-input-field", 5)(4, FormContainerRendererComponent_Conditional_1_Case_4_Template, 1, 5, "app-invisible-searchable-select", 6)(5, FormContainerRendererComponent_Conditional_1_Case_5_Template, 1, 5, "app-invisible-searchable-multi-select", 6)(6, FormContainerRendererComponent_Conditional_1_Case_6_Template, 1, 4, "app-checkbox-x", 7)(7, FormContainerRendererComponent_Conditional_1_Case_7_Template, 1, 4, "app-radio-checkboxes", 8)(8, FormContainerRendererComponent_Conditional_1_Case_8_Template, 1, 4, "app-nested-form-input", 9);
  }
  if (rf & 2) {
    let tmp_1_0;
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275conditional((tmp_1_0 = ctx_r0.asFormField(ctx_r0.container().content).type) === "text" ? 0 : tmp_1_0 === "textarea" ? 1 : tmp_1_0 === "number" ? 2 : tmp_1_0 === "date" ? 3 : tmp_1_0 === "select" ? 4 : tmp_1_0 === "multi-select" ? 5 : tmp_1_0 === "checkbox" ? 6 : tmp_1_0 === "radio" ? 7 : tmp_1_0 === "form-array" ? 8 : -1);
  }
}
function FormContainerRendererComponent_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 1);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("ngStyle", ctx_r0.getContentStyles(ctx_r0.container()));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r0.container().content, " ");
  }
}
function FormContainerRendererComponent_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 1);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("ngStyle", ctx_r0.getContentStyles(ctx_r0.container()));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r0.getNestedValue(ctx_r0.form().value, ctx_r0.container().content), " ");
  }
}
var FormContainerRendererComponent = class _FormContainerRendererComponent {
  container = input.required();
  form = input();
  readOnly = input(false);
  formData = input({});
  arrayItemAdded = output();
  arrayItemRemoved = output();
  renderingService = inject(FormRenderingService);
  fb = inject(FormBuilder);
  containerWithNoLabel = computed(() => {
    const c = this.container();
    if (c.contentType === "formField" && this.isFormField(c.content)) {
      const field = c.content;
      return new FormContainerDto(__spreadProps(__spreadValues({}, c), {
        content: __spreadProps(__spreadValues({}, field), { label: "" })
      }));
    }
    return c;
  });
  getContainerStyles(container) {
    const styles = this.renderingService.getContainerStyles(container);
    if (this.isFormField(container.content) && container.content.type === "form-array") {
      styles["min-height"] = styles["height"];
      styles["height"] = "auto";
      styles["overflow"] = "visible";
    }
    return styles;
  }
  getContentStyles(container) {
    return this.renderingService.getContentStyles(container);
  }
  isFormField(content) {
    return content && typeof content === "object" && "name" in content && "type" in content;
  }
  asFormField(content) {
    return content;
  }
  getFormControl(path) {
    const form = this.form();
    if (!form)
      return new FormControl();
    const control = form.get(path);
    if (!control)
      return new FormControl();
    return control;
  }
  getFormArray(path) {
    const form = this.form();
    if (!form)
      return this.fb.array([]);
    const control = form.get(path);
    if (control instanceof FormArray) {
      return control;
    }
    const newArray = this.fb.array([]);
    form.addControl(path, newArray);
    return newArray;
  }
  getArrayIndexRange() {
    return this.container().arrayIndexRange;
  }
  getNestedValue(obj, path) {
    if (!obj || !path)
      return null;
    return path.split(".").reduce((prev, curr) => prev ? prev[curr] : null, obj);
  }
  onAddArrayItem(formGroup) {
    this.arrayItemAdded.emit(formGroup);
  }
  onRemoveArrayItem(event) {
    this.arrayItemRemoved.emit(event);
  }
  static \u0275fac = function FormContainerRendererComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _FormContainerRendererComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _FormContainerRendererComponent, selectors: [["app-form-container-renderer"]], inputs: { container: [1, "container"], form: [1, "form"], readOnly: [1, "readOnly"], formData: [1, "formData"] }, outputs: { arrayItemAdded: "arrayItemAdded", arrayItemRemoved: "arrayItemRemoved" }, decls: 4, vars: 2, consts: [[1, "form-container", 3, "ngStyle"], [1, "content-display", 3, "ngStyle"], ["type", "text", 3, "formControl", "style"], ["type", "textarea", 3, "formControl", "style"], ["type", "number", 3, "formControl", "style"], ["type", "date", 3, "formControl", "style"], [3, "formControl", "options", "style"], [3, "formControl", "id", "style"], [3, "formControl", "name", "options"], [3, "formField", "formArray", "fieldName", "arrayIndexRange"], ["type", "text", 3, "formControl"], ["type", "textarea", 3, "formControl"], ["type", "number", 3, "formControl"], ["type", "date", 3, "formControl"], [3, "formControl", "options"], [3, "formControl", "id"], [3, "itemAdded", "itemRemoved", "formField", "formArray", "fieldName", "arrayIndexRange"]], template: function FormContainerRendererComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0);
      \u0275\u0275template(1, FormContainerRendererComponent_Conditional_1_Template, 9, 1)(2, FormContainerRendererComponent_Conditional_2_Template, 2, 2, "div", 1)(3, FormContainerRendererComponent_Conditional_3_Template, 2, 2, "div", 1);
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      \u0275\u0275property("ngStyle", ctx.getContainerStyles(ctx.container()));
      \u0275\u0275advance();
      \u0275\u0275conditional(ctx.isFormField(ctx.container().content) ? 1 : ctx.container().contentType === "text" ? 2 : ctx.container().contentType === "variable" ? 3 : -1);
    }
  }, dependencies: () => [
    CommonModule,
    NgStyle,
    ReactiveFormsModule,
    NgControlStatus,
    FormControlDirective,
    InvisibleInputFieldComponent,
    RadioCheckboxesComponent,
    InvisibleSearchableSelectComponent,
    CheckboxXComponent,
    InvisibleSearchableMultiSelectComponent,
    NestedFormInputComponent
  ], styles: ["\n\n.form-container[_ngcontent-%COMP%] {\n  position: absolute;\n  display: flex;\n}\n/*# sourceMappingURL=form-container-renderer.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(FormContainerRendererComponent, { className: "FormContainerRendererComponent", filePath: "src/app/features/form-designer-refactored/form-renderer/form-container-renderer/form-container-renderer.component.ts", lineNumber: 30 });
})();

// src/app/services/ui/print.service.ts
var PrintService = class _PrintService {
  printableForm = signal(null);
  isPreparing = signal(false);
  printForm(definition, data) {
    const dataSignal = signal(data);
    this.isPreparing.set(true);
    this.printableForm.set({ definition, data: dataSignal });
    setTimeout(() => {
      this.isPreparing.set(false);
      const electronAPI = window.electronAPI;
      if (electronAPI?.printCurrentPage) {
        electronAPI.printCurrentPage({ silent: false }).then(() => this.printableForm.set(null)).catch(() => this.printableForm.set(null));
      } else {
        window.print();
        this.printableForm.set(null);
      }
    }, 500);
  }
  static \u0275fac = function PrintService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _PrintService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _PrintService, factory: _PrintService.\u0275fac, providedIn: "root" });
};

// src/app/features/form-designer-refactored/form-renderer/form-renderer.component.ts
var _forTrack0 = ($index, $item) => $item.pageNumber;
var _forTrack1 = ($index, $item) => $item.id;
function FormRendererComponent_Conditional_0_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 2)(1, "button", 4);
    \u0275\u0275listener("click", function FormRendererComponent_Conditional_0_Conditional_1_Template_button_click_1_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.onSubmit());
    });
    \u0275\u0275text(2, "Submit");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "button", 4);
    \u0275\u0275listener("click", function FormRendererComponent_Conditional_0_Conditional_1_Template_button_click_3_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.print());
    });
    \u0275\u0275text(4, "Print");
    \u0275\u0275elementEnd()();
  }
}
function FormRendererComponent_Conditional_0_For_3_For_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "app-form-container-renderer", 7);
    \u0275\u0275listener("arrayItemAdded", function FormRendererComponent_Conditional_0_For_3_For_2_Template_app_form_container_renderer_arrayItemAdded_0_listener($event) {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.onArrayItemAdded($event));
    })("arrayItemRemoved", function FormRendererComponent_Conditional_0_For_3_For_2_Template_app_form_container_renderer_arrayItemRemoved_0_listener($event) {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.onArrayItemRemoved($event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const container_r5 = ctx.$implicit;
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275property("container", container_r5)("form", ctx_r1.form)("readOnly", ctx_r1.readOnly())("formData", ctx_r1.formData());
  }
}
function FormRendererComponent_Conditional_0_For_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 5);
    \u0275\u0275repeaterCreate(1, FormRendererComponent_Conditional_0_For_3_For_2_Template, 1, 4, "app-form-container-renderer", 6, _forTrack1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const page_r6 = ctx.$implicit;
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275styleProp("width", ctx_r1.sheetSize().width * ctx_r1.pixelsPerInch, "px")("height", ctx_r1.sheetSize().height * ctx_r1.pixelsPerInch, "px");
    \u0275\u0275advance();
    \u0275\u0275repeater(page_r6.containers);
  }
}
function FormRendererComponent_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "form", 1);
    \u0275\u0275listener("ngSubmit", function FormRendererComponent_Conditional_0_Template_form_ngSubmit_0_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onSubmit());
    });
    \u0275\u0275template(1, FormRendererComponent_Conditional_0_Conditional_1_Template, 5, 0, "div", 2);
    \u0275\u0275repeaterCreate(2, FormRendererComponent_Conditional_0_For_3_Template, 3, 4, "div", 3, _forTrack0);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275property("formGroup", ctx_r1.form);
    \u0275\u0275advance();
    \u0275\u0275conditional(!ctx_r1.readOnly() ? 1 : -1);
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r1.pages());
  }
}
var FormRendererComponent = class _FormRendererComponent {
  formDefinition = input();
  formData = input({});
  readOnly = input(false);
  formSubmit = output();
  formChange = output();
  arrayProcessingService = inject(FormArrayProcessingService);
  renderingService = inject(FormRenderingService);
  printService = inject(PrintService);
  destroyRef = inject(DestroyRef);
  pixelsPerInch = 96;
  form = new FormGroup({});
  formArrayItemsCount = signal(0);
  sheetSize = computed(() => {
    const def = this.formDefinition();
    return def?.size || { width: 8.5, height: 11 };
  });
  processedFormDefinition = computed(() => {
    const def = this.formDefinition();
    const data = this.formData();
    if (!def)
      return null;
    this.formArrayItemsCount();
    const formValue = this.form?.value || data;
    return this.arrayProcessingService.processFormArrays(def, data, formValue);
  });
  pages = computed(() => {
    const processed = this.processedFormDefinition();
    if (!processed || !processed.formContainers)
      return [];
    return this.arrayProcessingService.groupContainersByPage(processed.formContainers);
  });
  constructor() {
    effect(() => {
      const def = this.formDefinition();
      const data = this.formData();
      if (def) {
        this.form = this.renderingService.createFormFromDefinition(def, data, this.form);
        this.subscribeToFormChanges();
      }
    });
  }
  subscribeToFormChanges() {
    this.form.valueChanges.pipe(debounceTime(1e3), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      const originalData = this.formData() || {};
      const formValue = this.form.value;
      const mergedData = this.renderingService.deepMerge(originalData, formValue);
      this.formChange.emit(mergedData);
    });
  }
  onSubmit() {
    if (!this.form || this.form.invalid) {
      console.warn("Form is invalid", this.form?.errors);
      return;
    }
    const formValue = this.form.value;
    const data = this.formData();
    const mergedData = this.renderingService.deepMerge(data, formValue);
    this.formSubmit.emit(mergedData);
  }
  onArrayItemAdded(event) {
    this.formArrayItemsCount.update((count) => count + 1);
  }
  onArrayItemRemoved(event) {
    const control = this.form.get(event.fieldName);
    if (control instanceof FormArray) {
      control.removeAt(event.index);
    }
    this.formArrayItemsCount.update((count) => count + 1);
    this.form.updateValueAndValidity();
  }
  print() {
    const def = this.formDefinition();
    if (def) {
      const originalData = this.formData() || {};
      const formValue = this.form.value;
      const mergedData = this.renderingService.deepMerge(originalData, formValue);
      this.printService.printForm(def, mergedData);
    }
  }
  static \u0275fac = function FormRendererComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _FormRendererComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _FormRendererComponent, selectors: [["app-form-renderer"]], inputs: { formDefinition: [1, "formDefinition"], formData: [1, "formData"], readOnly: [1, "readOnly"] }, outputs: { formSubmit: "formSubmit", formChange: "formChange" }, decls: 1, vars: 1, consts: [[3, "formGroup"], [3, "ngSubmit", "formGroup"], [1, "form-actions"], [1, "form-sheet", 3, "width", "height"], ["type", "button", 3, "click"], [1, "form-sheet"], [3, "container", "form", "readOnly", "formData"], [3, "arrayItemAdded", "arrayItemRemoved", "container", "form", "readOnly", "formData"]], template: function FormRendererComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275template(0, FormRendererComponent_Conditional_0_Template, 4, 2, "form", 0);
    }
    if (rf & 2) {
      \u0275\u0275conditional(ctx.formDefinition() ? 0 : -1);
    }
  }, dependencies: [
    CommonModule,
    ReactiveFormsModule,
    \u0275NgNoValidate,
    NgControlStatusGroup,
    FormGroupDirective,
    FormContainerRendererComponent
  ], styles: ["\n\n[_nghost-%COMP%] {\n  display: block;\n  width: 100%;\n  height: 100%;\n  overflow: auto;\n  background-color: #f0f0f0;\n  padding: 20px;\n  box-sizing: border-box;\n}\n.form-sheet[_ngcontent-%COMP%] {\n  background-color: white;\n  color: black;\n  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);\n  margin: 0 auto 20px auto;\n  position: relative;\n  overflow: visible;\n}\n.form-container[_ngcontent-%COMP%] {\n  position: absolute;\n  display: flex;\n}\n.form-actions[_ngcontent-%COMP%] {\n  text-align: center;\n  margin-top: 20px;\n}\n.form-actions[_ngcontent-%COMP%]   button[_ngcontent-%COMP%] {\n  margin: 0 10px;\n  padding: 10px 20px;\n}\n/*# sourceMappingURL=form-renderer.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(FormRendererComponent, { className: "FormRendererComponent", filePath: "src/app/features/form-designer-refactored/form-renderer/form-renderer.component.ts", lineNumber: 23 });
})();

export {
  PrintService,
  FormRendererComponent
};
//# sourceMappingURL=chunk-OOBPS3FM.js.map
