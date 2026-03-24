import {
  Overlay,
  TemplatePortal,
  WorkAreaDto
} from "./chunk-3YEG6ZAP.js";
import {
  takeUntilDestroyed
} from "./chunk-7P7YM7O4.js";
import {
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule
} from "./chunk-HH6S5SLA.js";
import {
  CommonModule,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  EventEmitter,
  HttpClient,
  Injector,
  NgClass,
  NgStyle,
  Observable,
  PLATFORM_ID,
  UpperCasePipe,
  ViewContainerRef,
  computed,
  effect,
  environment,
  forkJoin,
  forwardRef,
  inject,
  input,
  isPlatformBrowser,
  map,
  output,
  signal,
  ɵsetClassDebugInfo,
  ɵɵNgOnChangesFeature,
  ɵɵProvidersFeature,
  ɵɵadvance,
  ɵɵclassProp,
  ɵɵconditional,
  ɵɵdefineComponent,
  ɵɵdefineInjectable,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵloadQuery,
  ɵɵnamespaceHTML,
  ɵɵnamespaceSVG,
  ɵɵnextContext,
  ɵɵpipe,
  ɵɵpipeBind1,
  ɵɵprojection,
  ɵɵprojectionDef,
  ɵɵproperty,
  ɵɵpureFunction2,
  ɵɵqueryRefresh,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵresetView,
  ɵɵresolveDocument,
  ɵɵrestoreView,
  ɵɵsanitizeUrl,
  ɵɵstyleProp,
  ɵɵtemplate,
  ɵɵtemplateRefExtractor,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵviewQuery
} from "./chunk-LMIOZ4NA.js";

// src/app/shared/reactive-form/refactored/input-fields/searchable-select-input/searchable-select-input.component.ts
var _c0 = ["dropdownTemplate"];
var _forTrack0 = ($index, $item) => $item.value || $index;
function SearchableSelectInputComponent_ng_template_6_For_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 10);
    \u0275\u0275listener("click", function SearchableSelectInputComponent_ng_template_6_For_7_Template_div_click_0_listener($event) {
      const option_r5 = \u0275\u0275restoreView(_r4).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.selectOption(option_r5, $event));
    });
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const option_r5 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", option_r5.label || option_r5.name, " ");
  }
}
function SearchableSelectInputComponent_ng_template_6_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 9);
    \u0275\u0275text(1, "No options found");
    \u0275\u0275elementEnd();
  }
}
function SearchableSelectInputComponent_ng_template_6_Conditional_9_Conditional_10_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 15);
    \u0275\u0275listener("click", function SearchableSelectInputComponent_ng_template_6_Conditional_9_Conditional_10_Template_div_click_0_listener($event) {
      \u0275\u0275restoreView(_r7);
      const ctx_r2 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r2.onDeleteOption($event));
    });
    \u0275\u0275elementStart(1, "span", 13);
    \u0275\u0275text(2, "\u{1F5D1}");
    \u0275\u0275elementEnd();
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" Delete ", ctx_r2.categoryName(), " ");
  }
}
function SearchableSelectInputComponent_ng_template_6_Conditional_9_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 11);
    \u0275\u0275element(1, "hr");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "div", 12);
    \u0275\u0275listener("click", function SearchableSelectInputComponent_ng_template_6_Conditional_9_Template_div_click_2_listener($event) {
      \u0275\u0275restoreView(_r6);
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.onAddNewOption($event));
    });
    \u0275\u0275elementStart(3, "span", 13);
    \u0275\u0275text(4, "+");
    \u0275\u0275elementEnd();
    \u0275\u0275text(5);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "div", 12);
    \u0275\u0275listener("click", function SearchableSelectInputComponent_ng_template_6_Conditional_9_Template_div_click_6_listener($event) {
      \u0275\u0275restoreView(_r6);
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.onEditOption($event));
    });
    \u0275\u0275elementStart(7, "span", 13);
    \u0275\u0275text(8, "\u270F\uFE0F");
    \u0275\u0275elementEnd();
    \u0275\u0275text(9);
    \u0275\u0275elementEnd();
    \u0275\u0275template(10, SearchableSelectInputComponent_ng_template_6_Conditional_9_Conditional_10_Template, 4, 1, "div", 14);
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate1(" Add New ", ctx_r2.categoryName(), " ");
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate1(" Edit ", ctx_r2.categoryName(), "s ");
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r2.showDelete() ? 10 : -1);
  }
}
function SearchableSelectInputComponent_ng_template_6_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 4)(1, "div", 5)(2, "input", 6);
    \u0275\u0275listener("input", function SearchableSelectInputComponent_ng_template_6_Template_input_input_2_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.filterOptions($event));
    })("click", function SearchableSelectInputComponent_ng_template_6_Template_input_click_2_listener($event) {
      \u0275\u0275restoreView(_r2);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "button", 7);
    \u0275\u0275listener("click", function SearchableSelectInputComponent_ng_template_6_Template_button_click_3_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      ctx_r2.toggleSearchMode();
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275text(4);
    \u0275\u0275pipe(5, "uppercase");
    \u0275\u0275elementEnd()();
    \u0275\u0275repeaterCreate(6, SearchableSelectInputComponent_ng_template_6_For_7_Template, 2, 1, "div", 8, _forTrack0);
    \u0275\u0275template(8, SearchableSelectInputComponent_ng_template_6_Conditional_8_Template, 2, 0, "div", 9)(9, SearchableSelectInputComponent_ng_template_6_Conditional_9_Template, 11, 3);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275property("value", ctx_r2.searchTerm());
    \u0275\u0275advance();
    \u0275\u0275classProp("or-mode", ctx_r2.searchMode() === "or");
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(5, 6, ctx_r2.searchMode()), " ");
    \u0275\u0275advance(2);
    \u0275\u0275repeater(ctx_r2.filteredOptions());
    \u0275\u0275advance(2);
    \u0275\u0275conditional(ctx_r2.filteredOptions().length === 0 ? 8 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r2.categoryName() ? 9 : -1);
  }
}
var SearchableSelectInputComponent = class _SearchableSelectInputComponent {
  dropdownTemplate;
  // Display-related inputs
  label = input("");
  categoryName = input("");
  closeOnSelect = input(true);
  // Options can be array or Observable
  options = input([]);
  // Internal state
  isOpen = signal(false);
  filteredOptions = signal([]);
  searchTerm = signal("");
  searchMode = signal("and");
  internalValue = signal(null);
  isDisabled = signal(false);
  optionsSubscription = null;
  // Input to control delete button visibility
  showDelete = input(false);
  // Outputs
  addNewOption = output();
  editOption = output();
  deleteOption = output();
  valueChange = output();
  // CVA callbacks
  onChange = () => {
  };
  onTouched = () => {
  };
  // Overlay plumbing
  overlay = inject(Overlay);
  viewContainerRef = inject(ViewContainerRef);
  elementRef = inject(ElementRef);
  overlayRef = null;
  // COMPUTED - for template display
  selectedDisplay = computed(() => {
    const value = this.internalValue();
    const opts = this.filteredOptions();
    if (value === null || value === void 0 || !opts.length) {
      return "Select an option";
    }
    const found = opts.find((o) => o.value == value || o.id == value);
    return found ? found.label || found.name || String(value) : "Select an option";
  });
  constructor() {
    effect(() => {
      this.setupOptionsSource();
    });
  }
  // ---- ControlValueAccessor ----
  writeValue(value) {
    this.internalValue.set(value);
  }
  registerOnChange(fn) {
    this.onChange = fn;
  }
  registerOnTouched(fn) {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled) {
    this.isDisabled.set(isDisabled);
  }
  // ---- Options handling ----
  setupOptionsSource() {
    const opts = this.options();
    if (this.optionsSubscription) {
      this.optionsSubscription.unsubscribe();
      this.optionsSubscription = null;
    }
    if (opts instanceof Observable) {
      this.optionsSubscription = opts.subscribe((newOptions) => {
        this.filteredOptions.set(newOptions ?? []);
      });
    } else if (Array.isArray(opts)) {
      this.filteredOptions.set(opts ?? []);
    } else {
      this.filteredOptions.set([]);
    }
  }
  // ---- Overlay / dropdown ----
  onDocumentClick(event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }
  toggleDropdown(event) {
    event.stopPropagation();
    if (this.isOpen()) {
      this.closeDropdown();
    } else {
      this.openDropdown(event.currentTarget);
    }
  }
  openDropdown(triggerElement) {
    const opts = this.options();
    if (Array.isArray(opts)) {
      this.filteredOptions.set(opts);
    }
    const positionStrategy = this.overlay.position().flexibleConnectedTo(triggerElement).withPositions([
      {
        originX: "start",
        originY: "bottom",
        overlayX: "start",
        overlayY: "top",
        offsetY: 4
      },
      {
        originX: "start",
        originY: "top",
        overlayX: "start",
        overlayY: "bottom",
        offsetY: -4
      }
    ]);
    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: true,
      backdropClass: "transparent-backdrop",
      width: triggerElement.offsetWidth
    });
    this.overlayRef.backdropClick().subscribe(() => this.closeDropdown());
    const portal = new TemplatePortal(this.dropdownTemplate, this.viewContainerRef);
    this.overlayRef.attach(portal);
    this.isOpen.set(true);
  }
  closeDropdown() {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    this.isOpen.set(false);
    this.searchTerm.set("");
    const opts = this.options();
    if (Array.isArray(opts)) {
      this.filteredOptions.set(opts);
    }
  }
  // ---- User interactions ----
  selectOption(option, event) {
    event.stopPropagation();
    const newValue = option?.value ?? option?.id ?? null;
    this.internalValue.set(newValue);
    this.onChange(newValue);
    this.onTouched();
    this.valueChange.emit(newValue);
    if (this.closeOnSelect()) {
      this.closeDropdown();
    }
  }
  filterOptions(event) {
    const input2 = event.target;
    const filterValue = input2.value.toLowerCase().trim();
    this.searchTerm.set(filterValue);
    this.applyFilter(filterValue);
  }
  toggleSearchMode() {
    this.searchMode.set(this.searchMode() === "and" ? "or" : "and");
    this.applyFilter(this.searchTerm());
  }
  applyFilter(filterValue) {
    const allOptions = Array.isArray(this.options()) ? this.options() : this.filteredOptions();
    const searchWords = filterValue.split(/\s+/).filter((word) => word.length > 0);
    if (searchWords.length === 0) {
      this.filteredOptions.set(allOptions);
      return;
    }
    const isAndMode = this.searchMode() === "and";
    this.filteredOptions.set(allOptions.filter((opt) => {
      const optionText = (opt.label ?? opt.name ?? opt.value ?? opt.id ?? "").toLowerCase();
      return isAndMode ? searchWords.every((word) => optionText.includes(word)) : searchWords.some((word) => optionText.includes(word));
    }));
  }
  onAddNewOption(event) {
    event.stopPropagation();
    this.addNewOption.emit(this.categoryName());
    this.closeDropdown();
  }
  onEditOption(event) {
    event.stopPropagation();
    this.editOption.emit(this.categoryName());
    this.closeDropdown();
  }
  onDeleteOption(event) {
    event.stopPropagation();
    this.deleteOption.emit();
    this.closeDropdown();
  }
  static \u0275fac = function SearchableSelectInputComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _SearchableSelectInputComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _SearchableSelectInputComponent, selectors: [["app-searchable-select-input"]], viewQuery: function SearchableSelectInputComponent_Query(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275viewQuery(_c0, 5);
    }
    if (rf & 2) {
      let _t;
      \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.dropdownTemplate = _t.first);
    }
  }, hostBindings: function SearchableSelectInputComponent_HostBindings(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275listener("click", function SearchableSelectInputComponent_click_HostBindingHandler($event) {
        return ctx.onDocumentClick($event);
      }, false, \u0275\u0275resolveDocument);
    }
  }, inputs: { label: [1, "label"], categoryName: [1, "categoryName"], closeOnSelect: [1, "closeOnSelect"], options: [1, "options"], showDelete: [1, "showDelete"] }, outputs: { addNewOption: "addNewOption", editOption: "editOption", deleteOption: "deleteOption", valueChange: "valueChange" }, features: [\u0275\u0275ProvidersFeature([
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => _SearchableSelectInputComponent),
      multi: true
    }
  ])], decls: 8, vars: 4, consts: [["dropdownTemplate", ""], [1, "dropdown-container"], [1, "label-container"], [1, "dropdown-input", 3, "click"], [1, "dropdown-options"], [1, "search-container"], ["type", "text", "placeholder", "Search...", 3, "input", "click", "value"], ["type", "button", "title", "Toggle AND/OR search mode", 1, "search-mode-toggle", 3, "click"], [1, "dropdown-option"], [1, "no-options"], [1, "dropdown-option", 3, "click"], [1, "option-divider"], [1, "add-new-option", 3, "click"], [1, "plus-icon"], [1, "add-new-option", "delete-option"], [1, "add-new-option", "delete-option", 3, "click"]], template: function SearchableSelectInputComponent_Template(rf, ctx) {
    if (rf & 1) {
      const _r1 = \u0275\u0275getCurrentView();
      \u0275\u0275elementStart(0, "div", 1)(1, "div", 2)(2, "label");
      \u0275\u0275text(3);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(4, "div", 3);
      \u0275\u0275listener("click", function SearchableSelectInputComponent_Template_div_click_4_listener($event) {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(!ctx.isDisabled() && ctx.toggleDropdown($event));
      });
      \u0275\u0275text(5);
      \u0275\u0275elementEnd()();
      \u0275\u0275template(6, SearchableSelectInputComponent_ng_template_6_Template, 10, 8, "ng-template", null, 0, \u0275\u0275templateRefExtractor);
    }
    if (rf & 2) {
      \u0275\u0275advance(3);
      \u0275\u0275textInterpolate(ctx.label());
      \u0275\u0275advance();
      \u0275\u0275classProp("disabled", ctx.isDisabled());
      \u0275\u0275advance();
      \u0275\u0275textInterpolate1(" ", ctx.selectedDisplay(), " ");
    }
  }, dependencies: [ReactiveFormsModule, CommonModule, UpperCasePipe], styles: ["\n\n  .transparent-backdrop {\n  background-color: transparent !important;\n  pointer-events: none !important;\n}\n.dropdown-container[_ngcontent-%COMP%] {\n  position: relative;\n  width: 100%;\n  margin-bottom: 1rem;\n}\n.dropdown-container[_ngcontent-%COMP%]   label[_ngcontent-%COMP%] {\n  display: block;\n  margin-bottom: 0.5rem;\n  font-weight: 600;\n  font-size: 0.875rem;\n  color: var(--primary-text);\n}\n.dropdown-input[_ngcontent-%COMP%] {\n  padding: 0.5rem 0.75rem;\n  border: 1px solid var(--border-color);\n  border-radius: 4px;\n  background-color: var(--primary-background);\n  color: var(--primary-text);\n  cursor: pointer;\n  -webkit-user-select: none;\n  user-select: none;\n  transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;\n  width: 100%;\n  box-sizing: border-box;\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  min-height: 38px;\n  position: relative;\n  z-index: 1;\n}\n.dropdown-input[_ngcontent-%COMP%]:hover {\n  border-color: var(--accent-color);\n}\n.dropdown-input.disabled[_ngcontent-%COMP%] {\n  opacity: 0.6;\n  cursor: not-allowed;\n  background-color: var(--secondary-background);\n}\n.dropdown-input.disabled[_ngcontent-%COMP%]:hover {\n  border-color: var(--border-color);\n}\n.dropdown-input.open[_ngcontent-%COMP%], \n.dropdown-input[_ngcontent-%COMP%]:focus {\n  outline: none;\n  border-color: var(--accent-color);\n  box-shadow: 0 0 0 0.2rem var(--accent-color-shadow);\n}\n.dropdown-options[_ngcontent-%COMP%] {\n  background-color: var(--card-background);\n  border: 1px solid var(--border-color);\n  border-radius: 4px;\n  max-height: 200px;\n  overflow-y: auto;\n  box-shadow: var(--card-shadow);\n  min-width: 100%;\n  visibility: visible;\n  opacity: 1;\n  display: block;\n  padding: 0;\n  margin: 0;\n}\n.search-container[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: stretch;\n  border-bottom: 1px solid var(--border-color);\n}\n.search-container[_ngcontent-%COMP%]   input[_ngcontent-%COMP%] {\n  flex: 1;\n  padding: 0.75rem;\n  border: none;\n  box-sizing: border-box;\n  background-color: var(--primary-background);\n  color: var(--primary-text);\n}\n.search-container[_ngcontent-%COMP%]   input[_ngcontent-%COMP%]:focus {\n  outline: none;\n  background-color: var(--secondary-background);\n}\n.search-mode-toggle[_ngcontent-%COMP%] {\n  padding: 0.5rem 0.75rem;\n  border: none;\n  border-left: 1px solid var(--border-color);\n  background-color: var(--secondary-background);\n  color: var(--primary-text);\n  font-size: 0.75rem;\n  font-weight: 600;\n  cursor: pointer;\n  transition: background-color 0.2s ease, color 0.2s ease;\n  min-width: 40px;\n}\n.search-mode-toggle[_ngcontent-%COMP%]:hover {\n  background-color: var(--accent-color);\n  color: var(--header-text);\n}\n.search-mode-toggle.or-mode[_ngcontent-%COMP%] {\n  background-color: var(--accent-color);\n  color: var(--header-text);\n}\n.dropdown-option[_ngcontent-%COMP%] {\n  padding: 0.5rem 0.75rem;\n  cursor: pointer;\n  transition: background-color 0.2s ease;\n  color: var(--primary-text);\n  line-height: 1.4;\n  display: flex;\n  align-items: center;\n}\n.dropdown-option[_ngcontent-%COMP%]:hover {\n  background-color: var(--menu-item-hover-bg-color);\n}\n.dropdown-option.selected[_ngcontent-%COMP%] {\n  background-color: var(--accent-color);\n  color: var(--header-text);\n}\n.no-options[_ngcontent-%COMP%] {\n  padding: 0.5rem 0.75rem;\n  color: var(--secondary-text);\n  text-align: center;\n  line-height: 1.4;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n.add-new-option[_ngcontent-%COMP%] {\n  padding: 0.5rem 0.75rem;\n  cursor: pointer;\n  display: flex;\n  align-items: center;\n  color: var(--primary-text);\n  border-top: 1px solid var(--border-color);\n  line-height: 1.4;\n}\n.add-new-option[_ngcontent-%COMP%]:hover {\n  background-color: var(--menu-item-hover-bg-color);\n}\n.add-new-option.delete-option[_ngcontent-%COMP%] {\n  color: var(--error-color, #dc3545);\n}\n.add-new-option.delete-option[_ngcontent-%COMP%]   .plus-icon[_ngcontent-%COMP%] {\n  color: var(--error-color, #dc3545);\n}\n.add-new-option.delete-option[_ngcontent-%COMP%]:hover {\n  background-color: rgba(220, 53, 69, 0.1);\n}\n.dropdown-options[_ngcontent-%COMP%]::-webkit-scrollbar {\n  width: 8px;\n}\n.dropdown-options[_ngcontent-%COMP%]::-webkit-scrollbar-track {\n  background: var(--secondary-background);\n}\n.dropdown-options[_ngcontent-%COMP%]::-webkit-scrollbar-thumb {\n  background: var(--secondary-text);\n  border-radius: 4px;\n}\n.dropdown-options[_ngcontent-%COMP%]::-webkit-scrollbar-thumb:hover {\n  background: var(--primary-text);\n}\n.plus-icon[_ngcontent-%COMP%] {\n  margin-right: 8px;\n  font-weight: bold;\n  color: var(--accent-color);\n}\n.label-container[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n}\n.question-icon[_ngcontent-%COMP%] {\n  margin-left: 5px;\n  cursor: pointer;\n  color: var(--accent-color);\n}\n.question-icon[_ngcontent-%COMP%]:hover {\n  color: var(--accent-color-hover);\n}\n/*# sourceMappingURL=searchable-select-input.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(SearchableSelectInputComponent, { className: "SearchableSelectInputComponent", filePath: "src/app/shared/reactive-form/refactored/input-fields/searchable-select-input/searchable-select-input.component.ts", lineNumber: 40 });
})();

// src/app/features/permit-builder/work-area/services/work-area-api.service.ts
var WorkAreaApiService = class _WorkAreaApiService {
  http = inject(HttpClient);
  baseUrl = `${environment.apiUrl}/work-areas`;
  shapeUrl = `${environment.apiUrl}/work-area-shapes`;
  // --- Work Area CRUD ---
  getAll() {
    return this.http.get(`${this.baseUrl}/get-all`).pipe(map((response) => (response.responseData || []).map((d) => WorkAreaDto.fromJson(d))));
  }
  getById(id) {
    return this.http.get(`${this.baseUrl}/get-by-id/${id}`).pipe(map((response) => WorkAreaDto.fromJson(response.responseData)));
  }
  save(dto) {
    return this.http.post(this.baseUrl, dto.toJson()).pipe(map((response) => WorkAreaDto.fromJson(response.responseData)));
  }
  delete(id) {
    return this.http.delete(`${this.baseUrl}/${id}`).pipe(map(() => void 0));
  }
  getByAreaType(typeId) {
    return this.http.get(`${this.baseUrl}/by-area-type/${typeId}`).pipe(map((response) => (response.responseData || []).map((d) => WorkAreaDto.fromJson(d))));
  }
  // --- Permit Counts ---
  getWithPermitCounts() {
    return this.http.get(`${this.baseUrl}/with-permit-counts`).pipe(map((response) => response.responseData || []));
  }
  getPermitCounts(workAreaId) {
    return this.http.get(`${this.baseUrl}/permit-counts/${workAreaId}`).pipe(map((response) => response.responseData));
  }
  // --- Map Shape CRUD ---
  getAllShapes() {
    return this.http.get(`${this.shapeUrl}/get-all`).pipe(map((response) => response.responseData || []));
  }
  saveShape(dto) {
    return this.http.post(this.shapeUrl, dto).pipe(map((response) => response.responseData));
  }
  deleteShape(id) {
    return this.http.delete(`${this.shapeUrl}/${id}`).pipe(map(() => void 0));
  }
  // --- Map Image ---
  uploadMapImage(file) {
    const formData = new FormData();
    formData.append("file", file);
    return this.http.post(`${this.baseUrl}/upload-map-image`, formData).pipe(map((response) => response.responseData));
  }
  getMapImage() {
    return this.http.get(`${this.baseUrl}/map-image`, { observe: "response" }).pipe(map((response) => {
      if (response.status === 204 || !response.body)
        return null;
      return response.body.responseData;
    }));
  }
  static \u0275fac = function WorkAreaApiService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _WorkAreaApiService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _WorkAreaApiService, factory: _WorkAreaApiService.\u0275fac, providedIn: "root" });
};

// src/app/features/permit-builder/work-area/components/work-area-map-picker/work-area-map-picker.component.ts
var _c02 = ["mapContainer"];
var _c1 = ["zoomElement"];
var _forTrack02 = ($index, $item) => $item.dto.id;
var _forTrack1 = ($index, $item) => $item.id;
function WorkAreaMapPickerComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 3);
    \u0275\u0275text(1, "Loading map...");
    \u0275\u0275elementEnd();
  }
}
function WorkAreaMapPickerComponent_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 4);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r0.errorMessage());
  }
}
function WorkAreaMapPickerComponent_Conditional_3_Conditional_0_Conditional_1_For_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 15);
    \u0275\u0275listener("click", function WorkAreaMapPickerComponent_Conditional_3_Conditional_0_Conditional_1_For_4_Template_button_click_0_listener() {
      const wa_r4 = \u0275\u0275restoreView(_r3).$implicit;
      const ctx_r0 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r0.setWorkArea(wa_r4));
    });
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const wa_r4 = ctx.$implicit;
    const ctx_r0 = \u0275\u0275nextContext(4);
    \u0275\u0275classProp("active", ctx_r0.isAreaSelected(wa_r4));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", wa_r4.name, " ");
  }
}
function WorkAreaMapPickerComponent_Conditional_3_Conditional_0_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 10)(1, "span", 13);
    \u0275\u0275text(2, "Select work area:");
    \u0275\u0275elementEnd();
    \u0275\u0275repeaterCreate(3, WorkAreaMapPickerComponent_Conditional_3_Conditional_0_Conditional_1_For_4_Template, 2, 3, "button", 14, _forTrack1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(3);
    \u0275\u0275repeater(ctx_r0.selectedShape().workAreas);
  }
}
function WorkAreaMapPickerComponent_Conditional_3_Conditional_0_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 11);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(3);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r0.selectedShape().workAreas[0].name);
  }
}
function WorkAreaMapPickerComponent_Conditional_3_Conditional_0_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 12);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(3);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r0.selectedShape().dto.label);
  }
}
function WorkAreaMapPickerComponent_Conditional_3_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 5);
    \u0275\u0275template(1, WorkAreaMapPickerComponent_Conditional_3_Conditional_0_Conditional_1_Template, 5, 0, "div", 10)(2, WorkAreaMapPickerComponent_Conditional_3_Conditional_0_Conditional_2_Template, 2, 1, "div", 11)(3, WorkAreaMapPickerComponent_Conditional_3_Conditional_0_Conditional_3_Template, 2, 1, "div", 12);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r0.selectedShape().workAreas.length > 1 ? 1 : ctx_r0.selectedShape().workAreas.length === 1 ? 2 : -1);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(ctx_r0.selectedShape().dto.label ? 3 : -1);
  }
}
function WorkAreaMapPickerComponent_Conditional_3_For_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 16);
    \u0275\u0275listener("click", function WorkAreaMapPickerComponent_Conditional_3_For_7_Template_div_click_0_listener($event) {
      const shape_r6 = \u0275\u0275restoreView(_r5).$implicit;
      const ctx_r0 = \u0275\u0275nextContext(2);
      ctx_r0.selectShape(shape_r6);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(1, "div", 17)(2, "span", 18);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const shape_r6 = ctx.$implicit;
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275classProp("selected", ctx_r0.isSelected(shape_r6));
    \u0275\u0275property("ngStyle", ctx_r0.getShapeStyle(shape_r6));
    \u0275\u0275advance();
    \u0275\u0275property("ngStyle", ctx_r0.getLabelStyle(shape_r6));
    \u0275\u0275advance();
    \u0275\u0275classProp("selected", ctx_r0.isSelected(shape_r6));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r0.getDisplayName(shape_r6));
  }
}
function WorkAreaMapPickerComponent_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275template(0, WorkAreaMapPickerComponent_Conditional_3_Conditional_0_Template, 4, 2, "div", 5);
    \u0275\u0275elementStart(1, "div", 6, 0);
    \u0275\u0275listener("wheel", function WorkAreaMapPickerComponent_Conditional_3_Template_div_wheel_1_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.onWheel($event));
    })("mousedown", function WorkAreaMapPickerComponent_Conditional_3_Template_div_mousedown_1_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.onMouseDown($event));
    })("mousemove", function WorkAreaMapPickerComponent_Conditional_3_Template_div_mousemove_1_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.onMouseMove($event));
    })("mouseup", function WorkAreaMapPickerComponent_Conditional_3_Template_div_mouseup_1_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.onMouseUp());
    })("mouseleave", function WorkAreaMapPickerComponent_Conditional_3_Template_div_mouseleave_1_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.onMouseUp());
    });
    \u0275\u0275elementStart(3, "div", 7, 1);
    \u0275\u0275element(5, "img", 8);
    \u0275\u0275repeaterCreate(6, WorkAreaMapPickerComponent_Conditional_3_For_7_Template, 4, 7, null, null, _forTrack02);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(8, "button", 9);
    \u0275\u0275listener("click", function WorkAreaMapPickerComponent_Conditional_3_Template_button_click_8_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.resetZoom());
    });
    \u0275\u0275text(9, "Reset View");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275conditional(ctx_r0.selectedShape() ? 0 : -1);
    \u0275\u0275advance(5);
    \u0275\u0275property("src", ctx_r0.imageUrl(), \u0275\u0275sanitizeUrl);
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r0.shapes());
  }
}
var WorkAreaMapPickerComponent = class _WorkAreaMapPickerComponent {
  mapContainer;
  zoomElement;
  api = inject(WorkAreaApiService);
  destroyRef = inject(DestroyRef);
  workAreaSelected = output();
  shapes = signal([]);
  selectedWorkAreaId = signal(null);
  selectedShape = signal(null);
  imageUrl = signal(null);
  loading = signal(true);
  errorMessage = signal(null);
  allWorkAreas = [];
  // Transform state
  scale = 1;
  translateX = 0;
  translateY = 0;
  // Pan state
  isPanning = false;
  panStartX = 0;
  panStartY = 0;
  panStartTranslateX = 0;
  panStartTranslateY = 0;
  // CVA
  onChange = () => {
  };
  onTouched = () => {
  };
  ngOnInit() {
    this.loadData();
  }
  // --- ControlValueAccessor ---
  writeValue(value) {
    this.selectedWorkAreaId.set(value);
  }
  registerOnChange(fn) {
    this.onChange = fn;
  }
  registerOnTouched(fn) {
    this.onTouched = fn;
  }
  // --- Data Loading ---
  loadData() {
    forkJoin({
      areas: this.api.getAll(),
      shapes: this.api.getAllShapes(),
      imagePath: this.api.getMapImage()
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ areas, shapes, imagePath }) => {
        this.allWorkAreas = areas;
        const areaMap = new Map(areas.map((a) => [a.id, a]));
        const parsed = shapes.map((s) => this.parseShape(s, areaMap));
        this.shapes.set(parsed);
        if (imagePath) {
          const url = imagePath.startsWith("/") || imagePath.startsWith("http") ? imagePath : "/" + imagePath;
          this.imageUrl.set(url.replaceAll("pdf", "jpg"));
        }
        this.loading.set(false);
        const pendingId = this.selectedWorkAreaId();
        if (pendingId) {
          const match = parsed.find((s) => s.workAreas.some((wa) => wa.id === pendingId));
          if (match) {
            this.selectedShape.set(match);
          }
        }
      },
      error: (err) => {
        console.error("Failed to load work area map data", err);
        this.errorMessage.set("Map data not available");
        this.loading.set(false);
      }
    });
  }
  parseShape(dto, areaMap) {
    let x = 0, y = 0, width = 100, height = 100;
    let originalWidth = 1e3, originalHeight = 1e3;
    try {
      const jsonStr = dto.coordinates.replace(/(\w+)\s*:/g, '"$1":');
      const coords = JSON.parse(jsonStr);
      x = coords.startX ?? coords.x ?? 0;
      y = coords.startY ?? coords.y ?? 0;
      width = coords.width ?? 100;
      height = coords.height ?? 100;
    } catch {
    }
    try {
      const sizeStr = dto.originalPictureSize ?? "";
      const wMatch = sizeStr.match(/width\s*:\s*(\d+)/);
      const hMatch = sizeStr.match(/height\s*:\s*(\d+)/);
      if (wMatch)
        originalWidth = parseFloat(wMatch[1]);
      if (hMatch)
        originalHeight = parseFloat(hMatch[1]);
    } catch {
    }
    const workAreas = (dto.workAreaIds ?? []).map((id) => areaMap.get(id)).filter((wa) => !!wa);
    return { dto, x, y, width, height, originalWidth, originalHeight, workAreas };
  }
  // --- Shape Positioning ---
  getShapeStyle(shape) {
    return {
      left: `${shape.x / shape.originalWidth * 100}%`,
      top: `${shape.y / shape.originalHeight * 100}%`,
      width: `${shape.width / shape.originalWidth * 100}%`,
      height: `${shape.height / shape.originalHeight * 100}%`
    };
  }
  getLabelStyle(shape) {
    const leftPct = shape.x / shape.originalWidth * 100;
    const topPct = shape.y / shape.originalHeight * 100;
    const widthPct = shape.width / shape.originalWidth * 100;
    const heightPct = shape.height / shape.originalHeight * 100;
    const maxWidthPct = widthPct * 2;
    return {
      left: `${leftPct + widthPct / 2}%`,
      top: `${topPct + heightPct / 2}%`,
      "max-width": `${maxWidthPct}%`,
      "max-height": `${heightPct}%`
    };
  }
  getDisplayName(shape) {
    const names = shape.workAreas.map((wa) => wa.name);
    if (names.length === 0)
      return shape.dto.label || "Unknown";
    return names.length === 1 ? names[0] : names.join(" / ");
  }
  isSelected(shape) {
    const selectedId = this.selectedWorkAreaId();
    return !!selectedId && shape.workAreas.some((wa) => wa.id === selectedId);
  }
  // --- Selection ---
  selectShape(shape) {
    this.selectedShape.set(shape);
    if (shape.workAreas.length === 1) {
      this.setWorkArea(shape.workAreas[0]);
    }
  }
  setWorkArea(workArea) {
    this.selectedWorkAreaId.set(workArea.id);
    this.onChange(workArea.id);
    this.onTouched();
    this.workAreaSelected.emit(workArea);
  }
  isAreaSelected(workArea) {
    return this.selectedWorkAreaId() === workArea.id;
  }
  // --- Mouse Events ---
  onWheel(event) {
    event.preventDefault();
    const factor = event.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(Math.max(0.5, this.scale * factor), 8);
    const container = this.mapContainer.nativeElement;
    const rect = container.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    this.translateX = mouseX - (mouseX - this.translateX) * (newScale / this.scale);
    this.translateY = mouseY - (mouseY - this.translateY) * (newScale / this.scale);
    this.scale = newScale;
    this.applyTransform();
  }
  onMouseDown(event) {
    if (event.button !== 0)
      return;
    event.preventDefault();
    this.isPanning = true;
    this.panStartX = event.clientX;
    this.panStartY = event.clientY;
    this.panStartTranslateX = this.translateX;
    this.panStartTranslateY = this.translateY;
  }
  onMouseMove(event) {
    if (!this.isPanning)
      return;
    event.preventDefault();
    this.translateX = this.panStartTranslateX + (event.clientX - this.panStartX);
    this.translateY = this.panStartTranslateY + (event.clientY - this.panStartY);
    this.applyTransform();
  }
  onMouseUp() {
    this.isPanning = false;
  }
  // --- Transform ---
  applyTransform() {
    if (this.zoomElement) {
      const el = this.zoomElement.nativeElement;
      el.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
    }
  }
  resetZoom() {
    this.scale = 1;
    this.translateX = 0;
    this.translateY = 0;
    this.applyTransform();
  }
  static \u0275fac = function WorkAreaMapPickerComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _WorkAreaMapPickerComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _WorkAreaMapPickerComponent, selectors: [["app-work-area-map-picker"]], viewQuery: function WorkAreaMapPickerComponent_Query(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275viewQuery(_c02, 5);
      \u0275\u0275viewQuery(_c1, 5);
    }
    if (rf & 2) {
      let _t;
      \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.mapContainer = _t.first);
      \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.zoomElement = _t.first);
    }
  }, outputs: { workAreaSelected: "workAreaSelected" }, features: [\u0275\u0275ProvidersFeature([
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => _WorkAreaMapPickerComponent),
      multi: true
    }
  ])], decls: 4, vars: 1, consts: [["mapContainer", ""], ["zoomElement", ""], [1, "work-area-map-wrapper"], [1, "loading-state"], [1, "error-state"], [1, "selected-panel"], [1, "map-container", 3, "wheel", "mousedown", "mousemove", "mouseup", "mouseleave"], [1, "zoom-element"], ["alt", "Plant Map", "draggable", "false", 1, "map-image", 3, "src"], ["type", "button", 1, "reset-btn", 3, "click"], [1, "selected-panel-multi"], [1, "selected-panel-name"], [1, "selected-panel-label"], [1, "selected-panel-prompt"], ["type", "button", 1, "area-option-btn", 3, "active"], ["type", "button", 1, "area-option-btn", 3, "click"], [1, "shape-overlay", 3, "click", "ngStyle"], [1, "shape-label-anchor", 3, "ngStyle"], [1, "shape-label"]], template: function WorkAreaMapPickerComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 2);
      \u0275\u0275template(1, WorkAreaMapPickerComponent_Conditional_1_Template, 2, 0, "div", 3)(2, WorkAreaMapPickerComponent_Conditional_2_Template, 2, 1, "div", 4)(3, WorkAreaMapPickerComponent_Conditional_3_Template, 10, 2);
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      \u0275\u0275advance();
      \u0275\u0275conditional(ctx.loading() ? 1 : ctx.errorMessage() ? 2 : 3);
    }
  }, dependencies: [CommonModule, NgStyle], styles: ["\n\n.work-area-map-wrapper[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n}\n.selected-panel[_ngcontent-%COMP%] {\n  padding: 10px 14px;\n  background: #e8f5e9;\n  border: 2px solid #4caf50;\n  border-radius: 8px;\n  text-align: center;\n}\n.selected-panel-name[_ngcontent-%COMP%] {\n  font-weight: 700;\n  font-size: 16px;\n  color: #2e7d32;\n}\n.selected-panel-label[_ngcontent-%COMP%] {\n  font-size: 13px;\n  color: #555;\n  margin-top: 4px;\n}\n.selected-panel-multi[_ngcontent-%COMP%] {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 6px;\n  align-items: center;\n  justify-content: center;\n}\n.selected-panel-prompt[_ngcontent-%COMP%] {\n  font-size: 13px;\n  color: #555;\n  width: 100%;\n  margin-bottom: 2px;\n}\n.area-option-btn[_ngcontent-%COMP%] {\n  padding: 6px 14px;\n  font-size: 14px;\n  border: 2px solid #4caf50;\n  border-radius: 6px;\n  background: #fff;\n  color: #2e7d32;\n  cursor: pointer;\n  font-weight: 600;\n}\n.area-option-btn[_ngcontent-%COMP%]:hover {\n  background: #c8e6c9;\n}\n.area-option-btn.active[_ngcontent-%COMP%] {\n  background: #4caf50;\n  color: #fff;\n}\n.map-container[_ngcontent-%COMP%] {\n  position: relative;\n  width: 100%;\n  height: var(--map-height, 300px);\n  overflow: hidden;\n  border: 1px solid #ccc;\n  border-radius: 8px;\n  background: #f5f5f5;\n  cursor: grab;\n  -webkit-user-select: none;\n  user-select: none;\n}\n.map-container[_ngcontent-%COMP%]:active {\n  cursor: grabbing;\n}\n.zoom-element[_ngcontent-%COMP%] {\n  position: relative;\n  display: inline-block;\n  transform-origin: 0 0;\n  transition: none;\n}\n.map-image[_ngcontent-%COMP%] {\n  display: block;\n  width: 100%;\n  height: auto;\n  pointer-events: none;\n}\n.shape-overlay[_ngcontent-%COMP%] {\n  position: absolute;\n  background: rgba(33, 150, 243, 0.15);\n  border: 2px solid rgba(33, 150, 243, 0.5);\n  border-radius: 4px;\n  cursor: pointer;\n  transition:\n    background 0.15s,\n    border-color 0.15s,\n    box-shadow 0.15s;\n}\n.shape-overlay[_ngcontent-%COMP%]:hover {\n  background: rgba(33, 150, 243, 0.3);\n  border-color: rgba(33, 150, 243, 0.8);\n}\n.shape-overlay.selected[_ngcontent-%COMP%] {\n  background: rgba(76, 175, 80, 0.35);\n  border: 4px solid #2e7d32;\n  box-shadow: 0 0 12px 4px rgba(76, 175, 80, 0.5);\n  animation: _ngcontent-%COMP%_selectedPulse 2s ease-in-out infinite;\n}\n@keyframes _ngcontent-%COMP%_selectedPulse {\n  0%, 100% {\n    box-shadow: 0 0 12px 4px rgba(76, 175, 80, 0.5);\n  }\n  50% {\n    box-shadow: 0 0 20px 8px rgba(76, 175, 80, 0.7);\n  }\n}\n.shape-label-anchor[_ngcontent-%COMP%] {\n  position: absolute;\n  transform: translate(-50%, -50%);\n  pointer-events: none;\n  display: flex;\n  justify-content: center;\n  overflow: hidden;\n}\n.shape-label[_ngcontent-%COMP%] {\n  font-size: 5px;\n  font-weight: 600;\n  color: #1565c0;\n  text-align: center;\n  pointer-events: none;\n  line-height: 1.1;\n  word-break: break-word;\n  overflow-wrap: break-word;\n  padding: 0px 1px;\n  background: rgba(255, 255, 255, 0.75);\n  border-radius: 2px;\n}\n.shape-label.selected[_ngcontent-%COMP%] {\n  color: #fff;\n  background: #2e7d32;\n  font-size: 6px;\n  padding: 1px 3px;\n  border-radius: 4px;\n  font-weight: 700;\n}\n.loading-state[_ngcontent-%COMP%], \n.error-state[_ngcontent-%COMP%] {\n  padding: 40px;\n  text-align: center;\n  color: #666;\n  font-size: 14px;\n}\n.error-state[_ngcontent-%COMP%] {\n  color: #d32f2f;\n}\n.reset-btn[_ngcontent-%COMP%] {\n  align-self: flex-end;\n  padding: 4px 12px;\n  font-size: 12px;\n  border: 1px solid #ccc;\n  border-radius: 4px;\n  background: #fff;\n  cursor: pointer;\n}\n.reset-btn[_ngcontent-%COMP%]:hover {\n  background: #f5f5f5;\n}\n/*# sourceMappingURL=work-area-map-picker.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(WorkAreaMapPickerComponent, { className: "WorkAreaMapPickerComponent", filePath: "src/app/features/permit-builder/work-area/components/work-area-map-picker/work-area-map-picker.component.ts", lineNumber: 36 });
})();

// src/app/shared/popup-projection/rf-popup-projection.component.ts
var _c03 = ["*"];
var _c12 = (a0, a1) => [a0, a1];
function RfPopupProjectionComponent_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 1);
    \u0275\u0275listener("click", function RfPopupProjectionComponent_Conditional_0_Template_div_click_0_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onClose());
    });
    \u0275\u0275elementStart(1, "div", 2);
    \u0275\u0275listener("click", function RfPopupProjectionComponent_Conditional_0_Template_div_click_1_listener($event) {
      \u0275\u0275restoreView(_r1);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275elementStart(2, "div", 3)(3, "h2");
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "button", 4);
    \u0275\u0275listener("click", function RfPopupProjectionComponent_Conditional_0_Template_button_click_5_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onClose());
    });
    \u0275\u0275text(6, "\xD7");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(7, "div", 5);
    \u0275\u0275projection(8);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275styleProp("z-index", ctx_r1.zIndex);
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction2(4, _c12, "popup-" + ctx_r1.size, ctx_r1.fullHeight ? "popup-full-height" : ""));
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(ctx_r1.title);
  }
}
var RfPopupProjectionComponent = class _RfPopupProjectionComponent {
  elementRef;
  document;
  isOpen = false;
  title = "";
  size = "auto";
  fullHeight = false;
  zIndex = 1e4;
  close = new EventEmitter();
  overlayElement = null;
  isViewInitialized = false;
  needsMove = false;
  isBrowser;
  constructor(elementRef, document, platformId) {
    this.elementRef = elementRef;
    this.document = document;
    this.isBrowser = isPlatformBrowser(platformId);
  }
  ngAfterViewInit() {
    this.isViewInitialized = true;
    if (this.isOpen) {
      this.moveToBody();
    }
  }
  ngOnChanges(changes) {
    if (changes["isOpen"] && this.isViewInitialized) {
      if (this.isOpen) {
        this.needsMove = true;
      } else {
        this.removeFromBody();
      }
    }
  }
  ngAfterViewChecked() {
    if (this.needsMove) {
      this.moveToBody();
      this.needsMove = false;
    }
  }
  ngOnDestroy() {
    this.removeFromBody();
  }
  moveToBody() {
    if (!this.isBrowser)
      return;
    const overlay = this.elementRef.nativeElement.querySelector(".popup-overlay");
    if (overlay && !this.overlayElement) {
      this.overlayElement = overlay;
      this.document.body.appendChild(overlay);
      overlay.style.visibility = "visible";
    }
  }
  removeFromBody() {
    if (!this.isBrowser)
      return;
    if (this.overlayElement) {
      if (this.overlayElement.parentNode === this.document.body) {
        this.document.body.removeChild(this.overlayElement);
      }
      this.overlayElement = null;
    }
  }
  onClose() {
    this.close.emit();
  }
  static \u0275fac = function RfPopupProjectionComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _RfPopupProjectionComponent)(\u0275\u0275directiveInject(ElementRef), \u0275\u0275directiveInject(DOCUMENT), \u0275\u0275directiveInject(PLATFORM_ID));
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _RfPopupProjectionComponent, selectors: [["app-rf-popup-projection"]], inputs: { isOpen: "isOpen", title: "title", size: "size", fullHeight: "fullHeight", zIndex: "zIndex" }, outputs: { close: "close" }, features: [\u0275\u0275NgOnChangesFeature], ngContentSelectors: _c03, decls: 1, vars: 1, consts: [[1, "popup-overlay", 3, "z-index"], [1, "popup-overlay", 3, "click"], [1, "popup-content", 3, "click", "ngClass"], [1, "popup-header"], [1, "close-button", 3, "click"], [1, "popup-body"]], template: function RfPopupProjectionComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275projectionDef();
      \u0275\u0275template(0, RfPopupProjectionComponent_Conditional_0_Template, 9, 7, "div", 0);
    }
    if (rf & 2) {
      \u0275\u0275conditional(ctx.isOpen ? 0 : -1);
    }
  }, dependencies: [NgClass], styles: ["\n\n[_nghost-%COMP%]   .popup-overlay[_ngcontent-%COMP%] {\n  visibility: hidden;\n}\n.popup-overlay[_ngcontent-%COMP%] {\n  position: fixed;\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  background-color: rgba(0, 0, 0, 0.5);\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  z-index: 10000;\n}\n.popup-content[_ngcontent-%COMP%] {\n  background-color: var(--card-background);\n  border-radius: 8px;\n  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);\n  display: flex;\n  flex-direction: column;\n  max-height: 90vh;\n  overflow: hidden;\n}\n.popup-small[_ngcontent-%COMP%] {\n  width: 400px;\n}\n.popup-medium[_ngcontent-%COMP%] {\n  width: 600px;\n}\n.popup-large[_ngcontent-%COMP%] {\n  width: 900px;\n}\n.popup-xlarge[_ngcontent-%COMP%] {\n  width: 95vw;\n  max-width: 1400px;\n}\n.popup-auto[_ngcontent-%COMP%] {\n  width: auto;\n  max-width: 90vw;\n}\n.popup-full-height[_ngcontent-%COMP%] {\n  height: 90vh;\n}\n.popup-header[_ngcontent-%COMP%] {\n  flex-shrink: 0;\n  padding: 20px;\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  gap: 20px;\n}\n.popup-header[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%] {\n  margin: 0;\n  font-size: 1.5em;\n  flex: 1;\n}\n.close-button[_ngcontent-%COMP%] {\n  background: none;\n  border: none;\n  font-size: 24px;\n  cursor: pointer;\n  color: #666;\n  padding: 0;\n  min-width: 32px;\n  height: 32px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  flex-shrink: 0;\n}\n.close-button[_ngcontent-%COMP%]:hover {\n  color: #333;\n  background-color: #f0f0f0;\n  border-radius: 4px;\n}\n.popup-body[_ngcontent-%COMP%] {\n  flex: 1;\n  overflow-y: auto;\n  min-height: 0;\n  border-top: 1px solid #e0e0e0;\n  display: flex;\n  flex-direction: column;\n}\n.popup-full-height[_ngcontent-%COMP%]   .popup-body[_ngcontent-%COMP%] {\n  overflow: hidden;\n}\n/*# sourceMappingURL=rf-popup-projection.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(RfPopupProjectionComponent, { className: "RfPopupProjectionComponent", filePath: "src/app/shared/popup-projection/rf-popup-projection.component.ts", lineNumber: 11 });
})();

// src/app/features/permit-builder/work-area/components/work-area-select/work-area-select.component.ts
var _c04 = ["selectInput"];
var _c13 = ["mapPicker"];
var _c2 = ["popupMapPicker"];
function WorkAreaSelectComponent_Case_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-searchable-select-input", 4, 0);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("label", ctx_r0.label())("options", ctx_r0.options())("categoryName", "");
  }
}
function WorkAreaSelectComponent_Case_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "label", 7);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "app-work-area-map-picker", 8, 1);
    \u0275\u0275listener("workAreaSelected", function WorkAreaSelectComponent_Case_2_Template_app_work_area_map_picker_workAreaSelected_2_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.onMapWorkAreaSelected($event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r0.label());
  }
}
function WorkAreaSelectComponent_Case_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 5)(1, "div", 9);
    \u0275\u0275element(2, "app-searchable-select-input", 4, 0);
    \u0275\u0275elementStart(4, "button", 10);
    \u0275\u0275listener("click", function WorkAreaSelectComponent_Case_3_Template_button_click_4_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.isMapOpen.set(true));
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(5, "svg", 11);
    \u0275\u0275element(6, "path", 12);
    \u0275\u0275elementEnd()()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(7, "app-rf-popup-projection", 13);
    \u0275\u0275listener("close", function WorkAreaSelectComponent_Case_3_Template_app_rf_popup_projection_close_7_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.isMapOpen.set(false));
    });
    \u0275\u0275elementStart(8, "app-work-area-map-picker", 14, 2);
    \u0275\u0275listener("workAreaSelected", function WorkAreaSelectComponent_Case_3_Template_app_work_area_map_picker_workAreaSelected_8_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.onPopupMapWorkAreaSelected($event));
    });
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275property("label", ctx_r0.label())("options", ctx_r0.options())("categoryName", "");
    \u0275\u0275advance(5);
    \u0275\u0275property("isOpen", ctx_r0.isMapOpen())("zIndex", 99999);
  }
}
function WorkAreaSelectComponent_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 6);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("Old location: ", ctx_r0.fallbackText(), "");
  }
}
var WorkAreaSelectComponent = class _WorkAreaSelectComponent {
  api = inject(WorkAreaApiService);
  injector = inject(Injector);
  destroyRef = inject(DestroyRef);
  selectInput;
  mapPicker;
  popupMapPicker;
  // Inputs
  label = input("Work Area");
  viewMode = input("dropdown");
  fallbackText = input(null);
  // Outputs - emits full WorkAreaDto so parent can read constantHazards
  workAreaSelected = output();
  // State
  value = signal(null);
  disabled = signal(false);
  isMapOpen = signal(false);
  workAreas = signal([]);
  // Options computed from loaded work areas
  options = computed(() => {
    return this.workAreas().map((wa) => ({
      value: wa.id,
      label: wa.name
    }));
  });
  // CVA internals
  onChange = (value) => {
  };
  onTouched = () => {
  };
  pendingValue = void 0;
  hasPendingValue = false;
  constructor() {
    this.api.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (areas) => this.workAreas.set(areas)
    });
  }
  ngAfterViewInit() {
    this.setupDropdown();
    this.setupMapPicker();
  }
  setupDropdown() {
    if (!this.selectInput)
      return;
    this.selectInput.registerOnChange((val) => {
      this.value.set(val);
      this.onChange(val);
      this.emitSelectedWorkArea(val);
    });
    this.selectInput.registerOnTouched(() => this.onTouched());
    if (this.hasPendingValue) {
      this.selectInput.writeValue(this.pendingValue);
      this.hasPendingValue = false;
      this.pendingValue = void 0;
    }
    effect(() => {
      const opts = this.options();
      const val = this.value();
      if (opts.length > 0 && val !== null && val !== void 0 && this.selectInput) {
        setTimeout(() => {
          if (this.selectInput) {
            this.selectInput.writeValue(val);
          }
        }, 0);
      }
    }, { injector: this.injector });
  }
  setupMapPicker() {
    if (this.mapPicker && this.hasPendingValue) {
      this.mapPicker.writeValue(this.pendingValue);
      this.hasPendingValue = false;
      this.pendingValue = void 0;
    }
  }
  // --- ControlValueAccessor ---
  writeValue(value) {
    this.value.set(value);
    if (this.selectInput) {
      this.selectInput.writeValue(value);
    } else if (this.mapPicker) {
      this.mapPicker.writeValue(value);
    } else {
      this.pendingValue = value;
      this.hasPendingValue = true;
    }
  }
  registerOnChange(fn) {
    this.onChange = fn;
  }
  registerOnTouched(fn) {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled) {
    this.disabled.set(isDisabled);
    if (this.selectInput) {
      this.selectInput.setDisabledState(isDisabled);
    }
  }
  // --- Map selection handlers ---
  onMapWorkAreaSelected(workArea) {
    if (!workArea)
      return;
    this.value.set(workArea.id);
    this.onChange(workArea.id);
    this.onTouched();
    this.workAreaSelected.emit(workArea);
  }
  onPopupMapWorkAreaSelected(workArea) {
    if (!workArea)
      return;
    this.value.set(workArea.id);
    this.onChange(workArea.id);
    this.onTouched();
    this.workAreaSelected.emit(workArea);
    if (this.selectInput) {
      this.selectInput.writeValue(workArea.id);
    }
    this.isMapOpen.set(false);
  }
  // --- Helpers ---
  emitSelectedWorkArea(valueId) {
    if (valueId === null || valueId === void 0) {
      this.workAreaSelected.emit(null);
      return;
    }
    const selected = this.workAreas().find((wa) => wa.id === valueId) || null;
    this.workAreaSelected.emit(selected);
  }
  /** Reload work areas (e.g., after creating a new one) */
  refresh() {
    this.api.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (areas) => this.workAreas.set(areas)
    });
  }
  static \u0275fac = function WorkAreaSelectComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _WorkAreaSelectComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _WorkAreaSelectComponent, selectors: [["app-work-area-select"]], viewQuery: function WorkAreaSelectComponent_Query(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275viewQuery(_c04, 5);
      \u0275\u0275viewQuery(_c13, 5);
      \u0275\u0275viewQuery(_c2, 5);
    }
    if (rf & 2) {
      let _t;
      \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.selectInput = _t.first);
      \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.mapPicker = _t.first);
      \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.popupMapPicker = _t.first);
    }
  }, inputs: { label: [1, "label"], viewMode: [1, "viewMode"], fallbackText: [1, "fallbackText"] }, outputs: { workAreaSelected: "workAreaSelected" }, features: [\u0275\u0275ProvidersFeature([{
    provide: NG_VALUE_ACCESSOR,
    useExisting: _WorkAreaSelectComponent,
    multi: true
  }])], decls: 5, vars: 2, consts: [["selectInput", ""], ["mapPicker", ""], ["popupMapPicker", ""], [1, "work-area-select"], [3, "label", "options", "categoryName"], [1, "both-wrapper"], [1, "fallback-location"], [1, "map-label"], [3, "workAreaSelected"], [1, "dropdown-with-map-btn"], ["type", "button", "title", "Open map", 1, "map-btn", 3, "click"], ["viewBox", "0 0 24 24", "width", "20", "height", "20", "fill", "currentColor"], ["d", "M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"], ["title", "Select Work Area", "size", "xlarge", 3, "close", "isOpen", "zIndex"], [2, "--map-height", "70vh", 3, "workAreaSelected"]], template: function WorkAreaSelectComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 3);
      \u0275\u0275template(1, WorkAreaSelectComponent_Case_1_Template, 2, 3, "app-searchable-select-input", 4)(2, WorkAreaSelectComponent_Case_2_Template, 4, 1)(3, WorkAreaSelectComponent_Case_3_Template, 10, 5, "div", 5)(4, WorkAreaSelectComponent_Conditional_4_Template, 2, 1, "div", 6);
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      let tmp_0_0;
      \u0275\u0275advance();
      \u0275\u0275conditional((tmp_0_0 = ctx.viewMode()) === "dropdown" ? 1 : tmp_0_0 === "map" ? 2 : tmp_0_0 === "both" ? 3 : -1);
      \u0275\u0275advance(3);
      \u0275\u0275conditional(ctx.fallbackText() && !ctx.value() ? 4 : -1);
    }
  }, dependencies: [CommonModule, FormsModule, SearchableSelectInputComponent, WorkAreaMapPickerComponent, RfPopupProjectionComponent], styles: ["\n\n.work-area-select[_ngcontent-%COMP%] {\n  width: 100%;\n}\n.map-label[_ngcontent-%COMP%] {\n  display: block;\n  font-size: 13px;\n  font-weight: 600;\n  color: #555;\n  margin-bottom: 4px;\n}\n.both-wrapper[_ngcontent-%COMP%] {\n  width: 100%;\n  position: relative;\n  z-index: 9999;\n}\n.dropdown-with-map-btn[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: flex-end;\n  gap: 4px;\n}\n.dropdown-with-map-btn[_ngcontent-%COMP%]   app-searchable-select-input[_ngcontent-%COMP%] {\n  flex: 1;\n}\n.map-btn[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 36px;\n  height: 36px;\n  border: 1px solid #ccc;\n  border-radius: 6px;\n  background: #fff;\n  color: #1565c0;\n  cursor: pointer;\n  flex-shrink: 0;\n}\n.map-btn[_ngcontent-%COMP%]:hover {\n  background: #e3f2fd;\n}\n.fallback-location[_ngcontent-%COMP%] {\n  margin-top: 4px;\n  padding: 4px 8px;\n  font-size: 12px;\n  color: #666;\n  background: #fff3e0;\n  border: 1px solid #ffcc80;\n  border-radius: 4px;\n}\n/*# sourceMappingURL=work-area-select.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(WorkAreaSelectComponent, { className: "WorkAreaSelectComponent", filePath: "src/app/features/permit-builder/work-area/components/work-area-select/work-area-select.component.ts", lineNumber: 119 });
})();

export {
  SearchableSelectInputComponent,
  WorkAreaApiService,
  RfPopupProjectionComponent,
  WorkAreaSelectComponent
};
//# sourceMappingURL=chunk-PTGESYON.js.map
