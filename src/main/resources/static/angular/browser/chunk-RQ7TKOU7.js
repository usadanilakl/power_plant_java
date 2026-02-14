import {
  DomSanitizer,
  NavigationEnd,
  Router
} from "./chunk-22ULOPPA.js";
import {
  isFakeMousedownFromScreenReader,
  isFakeTouchstartFromScreenReader
} from "./chunk-L2ZGY44H.js";
import {
  A,
  ALT,
  BidiModule,
  CONTROL,
  CdkFixedSizeVirtualScroll,
  CdkVirtualForOf,
  CdkVirtualScrollViewport,
  DOWN_ARROW,
  END,
  EquipmentDto,
  FileDto,
  HOME,
  LEFT_ARROW,
  LotoPointDto,
  MAC_META,
  META,
  NINE,
  Overlay,
  PAGE_DOWN,
  PAGE_UP,
  Platform,
  RIGHT_ARROW,
  SHIFT,
  ScrollingModule,
  TAB,
  TemplatePortal,
  UP_ARROW,
  ValueDto,
  Z,
  ZERO,
  _CdkPrivateStyleLoader,
  _bindEventWithOptions,
  _getEventTarget,
  _getFocusedElementPierceShadowDom,
  _getShadowRoot,
  coerceArray,
  coerceElement,
  coerceNumberProperty,
  hasModifierKey
} from "./chunk-WOTWESBV.js";
import {
  APP_ID,
  BaseDto,
  BehaviorSubject,
  CSP_NONCE,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  CheckboxControlValueAccessor,
  CommonModule,
  Component,
  DOCUMENT,
  DefaultValueAccessor,
  DestroyRef,
  Directive,
  ElementRef,
  ErrorHandler,
  EventEmitter,
  FormBuilder,
  FormControl,
  FormControlDirective,
  FormControlName,
  FormGroup,
  FormGroupDirective,
  FormsModule,
  HostAttributeToken,
  HttpClient,
  HttpHeaders,
  HttpParams,
  Inject,
  Injectable,
  InjectionToken,
  Injector,
  Input,
  NG_VALUE_ACCESSOR,
  NgClass,
  NgControlStatus,
  NgControlStatusGroup,
  NgForOf,
  NgIf,
  NgModel,
  NgModule,
  NgSelectOption,
  NgStyle,
  NgZone,
  NumberValueAccessor,
  Observable,
  Optional,
  Output,
  PLATFORM_ID,
  QueryList,
  ReactiveFormsModule,
  Renderer2,
  RendererFactory2,
  SecurityContext,
  SelectControlValueAccessor,
  SkipSelf,
  Subject,
  Subscription,
  UpperCasePipe,
  Validators,
  ViewContainerRef,
  ViewEncapsulation,
  afterNextRender,
  booleanAttribute,
  buffer,
  catchError,
  combineLatest,
  computed,
  concat,
  debounceTime,
  distinctUntilChanged,
  effect,
  environment,
  filter,
  finalize,
  firstValueFrom,
  forkJoin,
  forwardRef,
  fromEvent,
  groupBy,
  inject,
  input,
  isPlatformBrowser,
  isSignal,
  map,
  mergeMap,
  of,
  output,
  setClassMetadata,
  share,
  shareReplay,
  signal,
  skip,
  startWith,
  switchMap,
  take,
  takeUntil,
  takeUntilDestroyed,
  tap,
  throwError,
  toSignal,
  ɵNgNoValidate,
  ɵNgSelectMultipleOption,
  ɵsetClassDebugInfo,
  ɵɵNgOnChangesFeature,
  ɵɵProvidersFeature,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵclassMap,
  ɵɵclassProp,
  ɵɵconditional,
  ɵɵdefineComponent,
  ɵɵdefineDirective,
  ɵɵdefineInjectable,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
  ɵɵdefinePipe,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementContainer,
  ɵɵelementContainerEnd,
  ɵɵelementContainerStart,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵinject,
  ɵɵlistener,
  ɵɵloadQuery,
  ɵɵnamespaceHTML,
  ɵɵnamespaceSVG,
  ɵɵnextContext,
  ɵɵpipe,
  ɵɵpipeBind1,
  ɵɵpipeBind3,
  ɵɵprojection,
  ɵɵprojectionDef,
  ɵɵproperty,
  ɵɵpureFunction2,
  ɵɵqueryRefresh,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIdentity,
  ɵɵrepeaterTrackByIndex,
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
  ɵɵtextInterpolate2,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty,
  ɵɵviewQuery
} from "./chunk-BPY52ML3.js";
import {
  __async,
  __objRest,
  __spreadProps,
  __spreadValues
} from "./chunk-TXDUYLVM.js";

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

// src/app/shared/reactive-form/refactored/input-fields/chekcbox-group/chekcbox-group.component.ts
var _forTrack02 = ($index, $item) => $item.label;
function ChekcboxGroupComponent_For_5_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div")(1, "input", 3, 0);
    \u0275\u0275listener("change", function ChekcboxGroupComponent_For_5_Conditional_0_Template_input_change_1_listener($event) {
      \u0275\u0275restoreView(_r1);
      const option_r2 = \u0275\u0275nextContext().$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onCheckboxChange(option_r2, $event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "label", 4);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const option_r2 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275property("id", option_r2.label)("value", option_r2.value)("checked", option_r2.value);
    \u0275\u0275advance(2);
    \u0275\u0275property("for", option_r2.label);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(option_r2.label);
  }
}
function ChekcboxGroupComponent_For_5_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div")(1, "input", 3, 0);
    \u0275\u0275listener("change", function ChekcboxGroupComponent_For_5_Conditional_1_Template_input_change_1_listener($event) {
      \u0275\u0275restoreView(_r4);
      const option_r2 = \u0275\u0275nextContext().$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onCheckboxChange(option_r2, $event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "label", 4);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const option_r2 = \u0275\u0275nextContext().$implicit;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("id", option_r2.label)("value", option_r2.value)("checked", ctx_r2.value.includes(option_r2.value));
    \u0275\u0275advance(2);
    \u0275\u0275property("for", option_r2.label);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(option_r2.label);
  }
}
function ChekcboxGroupComponent_For_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, ChekcboxGroupComponent_For_5_Conditional_0_Template, 5, 5, "div")(1, ChekcboxGroupComponent_For_5_Conditional_1_Template, 5, 5, "div");
  }
  if (rf & 2) {
    const option_r2 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275conditional(ctx_r2.isBoolean(option_r2.value) ? 0 : ctx_r2.mode === "array" ? 1 : -1);
  }
}
var ChekcboxGroupComponent = class _ChekcboxGroupComponent {
  label = "";
  options = [];
  showPopup = false;
  value = {};
  mode = "object";
  onChange = () => {
  };
  onTouched = () => {
  };
  // This is the key change. writeValue determines the mode.
  writeValue(value) {
    if (Array.isArray(value)) {
      this.mode = "array";
      this.value = value || [];
    } else if (typeof value === "object" && value !== null) {
      this.mode = "object";
      this.value = value;
    } else {
      this.mode = "object";
      this.value = {};
    }
  }
  registerOnChange(fn) {
    this.onChange = fn;
  }
  registerOnTouched(fn) {
    this.onTouched = fn;
  }
  // The change handler now uses the mode to update the value correctly.
  onCheckboxChange(option, event) {
    const checkbox = event.target;
    const isChecked = checkbox.checked;
    if (this.mode === "object") {
      this.value[option.key ?? option.label] = isChecked;
    } else {
      if (isChecked) {
        this.value = [...this.value, option.value];
      } else {
        this.value = this.value.filter((val) => val !== option.value);
      }
    }
    this.onTouched();
    console.log("Value sent to form", this.value);
    this.onChange(this.value);
  }
  isBoolean(value) {
    return typeof value === "boolean";
  }
  static \u0275fac = function ChekcboxGroupComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _ChekcboxGroupComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ChekcboxGroupComponent, selectors: [["app-chekcbox-group"]], inputs: { label: "label", options: "options" }, features: [\u0275\u0275ProvidersFeature([
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: _ChekcboxGroupComponent,
      multi: true
    }
  ])], decls: 6, vars: 1, consts: [["checkbox", ""], [1, "checkbox-group"], [1, "label-container"], ["type", "checkbox", 3, "change", "id", "value", "checked"], [3, "for"]], template: function ChekcboxGroupComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 1)(1, "div", 2)(2, "label");
      \u0275\u0275text(3);
      \u0275\u0275elementEnd()();
      \u0275\u0275repeaterCreate(4, ChekcboxGroupComponent_For_5_Template, 2, 1, null, null, _forTrack02);
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      \u0275\u0275advance(3);
      \u0275\u0275textInterpolate(ctx.label);
      \u0275\u0275advance();
      \u0275\u0275repeater(ctx.options);
    }
  }, styles: ['\n\n.checkbox-group[_ngcontent-%COMP%] {\n  font-family: Arial, sans-serif;\n  margin-bottom: 20px;\n}\n.checkbox-group[_ngcontent-%COMP%]    > label[_ngcontent-%COMP%] {\n  display: block;\n  font-weight: bold;\n  margin-bottom: 10px;\n  color: var(--primary-text);\n}\n.checkbox-group[_ngcontent-%COMP%]    > div[_ngcontent-%COMP%] {\n  margin-bottom: 8px;\n}\n.checkbox-group[_ngcontent-%COMP%]   input[type=checkbox][_ngcontent-%COMP%] {\n  display: none;\n}\n.checkbox-group[_ngcontent-%COMP%]   label[_ngcontent-%COMP%] {\n  position: relative;\n  padding-left: 30px;\n  cursor: pointer;\n  display: inline-block;\n  color: var(--secondary-text);\n}\n.checkbox-group[_ngcontent-%COMP%]   label[_ngcontent-%COMP%]::before {\n  content: "";\n  position: absolute;\n  left: 0;\n  top: 0;\n  width: 18px;\n  height: 18px;\n  border: 2px solid var(--border-color);\n  background-color: var(--primary-background);\n  border-radius: 3px;\n  transition: all 0.3s ease;\n}\n.checkbox-group[_ngcontent-%COMP%]   input[type=checkbox][_ngcontent-%COMP%]:checked    + label[_ngcontent-%COMP%]::before {\n  background-color: var(--accent-color);\n  border-color: var(--accent-color);\n}\n.checkbox-group[_ngcontent-%COMP%]   label[_ngcontent-%COMP%]::after {\n  content: "\\2714";\n  position: absolute;\n  top: -1px;\n  left: 4px;\n  font-size: 16px;\n  color: var(--header-text);\n  transition: all 0.3s ease;\n  opacity: 0;\n}\n.checkbox-group[_ngcontent-%COMP%]   input[type=checkbox][_ngcontent-%COMP%]:checked    + label[_ngcontent-%COMP%]::after {\n  opacity: 1;\n}\n.checkbox-group[_ngcontent-%COMP%]   label[_ngcontent-%COMP%]:hover::before {\n  border-color: var(--accent-color-hover);\n}\n/*# sourceMappingURL=chekcbox-group.component.css.map */'] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ChekcboxGroupComponent, { className: "ChekcboxGroupComponent", filePath: "src/app/shared/reactive-form/refactored/input-fields/chekcbox-group/chekcbox-group.component.ts", lineNumber: 19 });
})();

// src/app/shared/reactive-form/refactored/input-fields/checkbox-label-only/checkbox-label-only.component.ts
var CheckboxLabelOnlyComponent = class _CheckboxLabelOnlyComponent {
  label = "";
  id = "";
  value = false;
  disabled = false;
  onChange = () => {
  };
  onTouched = () => {
  };
  writeValue(value) {
    this.value = !!value;
  }
  registerOnChange(fn) {
    this.onChange = fn;
  }
  registerOnTouched(fn) {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled) {
    this.disabled = isDisabled;
  }
  toggleValue() {
    if (!this.disabled) {
      this.value = !this.value;
      this.onChange(this.value);
      this.onTouched();
    }
  }
  static \u0275fac = function CheckboxLabelOnlyComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _CheckboxLabelOnlyComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _CheckboxLabelOnlyComponent, selectors: [["app-checkbox-label-only"]], inputs: { label: "label", id: "id" }, features: [\u0275\u0275ProvidersFeature([
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => _CheckboxLabelOnlyComponent),
      multi: true
    }
  ])], decls: 4, vars: 9, consts: [[1, "styled-checkbox-container"], ["type", "checkbox", 1, "hidden-checkbox", 3, "change", "id", "checked", "disabled"], [3, "for"]], template: function CheckboxLabelOnlyComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "input", 1);
      \u0275\u0275listener("change", function CheckboxLabelOnlyComponent_Template_input_change_1_listener() {
        return ctx.toggleValue();
      });
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(2, "label", 2);
      \u0275\u0275text(3);
      \u0275\u0275elementEnd()();
    }
    if (rf & 2) {
      \u0275\u0275advance();
      \u0275\u0275property("id", ctx.id)("checked", ctx.value)("disabled", ctx.disabled);
      \u0275\u0275advance();
      \u0275\u0275classProp("checked", ctx.value)("disabled", ctx.disabled);
      \u0275\u0275property("for", ctx.id);
      \u0275\u0275advance();
      \u0275\u0275textInterpolate1(" ", ctx.label, " ");
    }
  }, styles: ["\n\n.styled-checkbox-container[_ngcontent-%COMP%] {\n  display: inline-block;\n  position: relative;\n}\n.hidden-checkbox[_ngcontent-%COMP%] {\n  position: absolute;\n  opacity: 0;\n  cursor: pointer;\n  height: 100%;\n  width: 100%;\n  left: 0;\n  top: 0;\n  margin: 0;\n  padding: 0;\n  z-index: 1;\n}\nlabel[_ngcontent-%COMP%] {\n  display: inline-block;\n  padding: 8px 16px;\n  border: 1px solid var(--border-color);\n  border-radius: 4px;\n  cursor: pointer;\n  background-color: var(--secondary-background);\n  color: var(--primary-text);\n  transition:\n    background-color 0.2s,\n    color 0.2s,\n    border-color 0.2s;\n  -webkit-user-select: none;\n  user-select: none;\n}\n.hidden-checkbox[_ngcontent-%COMP%]:focus    + label[_ngcontent-%COMP%] {\n  outline: 2px solid var(--accent-color);\n  outline-offset: 2px;\n}\nlabel[_ngcontent-%COMP%]:hover {\n  background-color: var(--menu-item-hover-bg-color);\n}\nlabel.checked[_ngcontent-%COMP%] {\n  background-color: var(--accent-color);\n  color: var(--header-text);\n  border-color: var(--accent-color);\n}\nlabel.disabled[_ngcontent-%COMP%] {\n  background-color: var(--disabled-background, #e9ecef);\n  color: var(--secondary-text);\n  cursor: not-allowed;\n  border-color: var(--border-color);\n  opacity: 0.6;\n}\n.hidden-checkbox[_ngcontent-%COMP%]:disabled {\n  cursor: not-allowed;\n}\n/*# sourceMappingURL=checkbox-label-only.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(CheckboxLabelOnlyComponent, { className: "CheckboxLabelOnlyComponent", filePath: "src/app/shared/reactive-form/refactored/input-fields/checkbox-label-only/checkbox-label-only.component.ts", lineNumber: 18 });
})();

// src/app/shared/reactive-form/refactored/input-fields/radio-group/rf-radio-group.component.ts
var _forTrack03 = ($index, $item) => $item.value;
function RfRadioGroupComponent_For_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 3)(1, "input", 4);
    \u0275\u0275listener("change", function RfRadioGroupComponent_For_5_Template_input_change_1_listener() {
      const option_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onRadioChange(option_r2));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "label", 5);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const option_r2 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("id", ctx_r2.label + "-" + option_r2.value)("name", ctx_r2.name)("value", option_r2.value)("checked", ctx_r2.value === option_r2.value);
    \u0275\u0275advance();
    \u0275\u0275property("for", ctx_r2.label + "-" + option_r2.value);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(option_r2.label);
  }
}
var RfRadioGroupComponent = class _RfRadioGroupComponent {
  label = "";
  options = [];
  name = "";
  value;
  onChange = () => {
  };
  onTouched = () => {
  };
  writeValue(value) {
    this.value = value;
  }
  registerOnChange(fn) {
    this.onChange = fn;
  }
  registerOnTouched(fn) {
    this.onTouched = fn;
  }
  onRadioChange(option) {
    this.value = option.value;
    this.onChange(this.value);
    this.onTouched();
  }
  static \u0275fac = function RfRadioGroupComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _RfRadioGroupComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _RfRadioGroupComponent, selectors: [["app-rf-radio-group"]], inputs: { label: "label", options: "options", name: "name" }, features: [\u0275\u0275ProvidersFeature([
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => _RfRadioGroupComponent),
      multi: true
    }
  ])], decls: 6, vars: 1, consts: [[1, "radio-group"], [1, "group-label"], [1, "options-container"], [1, "option"], ["type", "radio", 3, "change", "id", "name", "value", "checked"], [3, "for"]], template: function RfRadioGroupComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "span", 1);
      \u0275\u0275text(2);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(3, "div", 2);
      \u0275\u0275repeaterCreate(4, RfRadioGroupComponent_For_5_Template, 4, 6, "div", 3, _forTrack03);
      \u0275\u0275elementEnd()();
    }
    if (rf & 2) {
      \u0275\u0275advance(2);
      \u0275\u0275textInterpolate(ctx.label);
      \u0275\u0275advance(2);
      \u0275\u0275repeater(ctx.options);
    }
  }, dependencies: [CommonModule], styles: ["\n\n.radio-group[_ngcontent-%COMP%] {\n  margin-bottom: 15px;\n}\n.group-label[_ngcontent-%COMP%] {\n  display: block;\n  margin-bottom: 10px;\n  font-weight: bold;\n  font-size: 1.1em;\n  color: var(--primary-text);\n}\n.options-container[_ngcontent-%COMP%] {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 10px;\n}\n.option[_ngcontent-%COMP%] {\n  position: relative;\n}\n.radio-group[_ngcontent-%COMP%]   input[type=radio][_ngcontent-%COMP%] {\n  display: none;\n}\n.radio-group[_ngcontent-%COMP%]   label[_ngcontent-%COMP%] {\n  display: inline-block;\n  padding: 8px 16px;\n  border: 1px solid var(--border-color);\n  border-radius: 4px;\n  cursor: pointer;\n  transition: all 0.3s ease;\n  font-size: 0.9em;\n  background-color: var(--card-background);\n  color: var(--primary-text);\n}\n.radio-group[_ngcontent-%COMP%]   input[type=radio][_ngcontent-%COMP%]:checked    + label[_ngcontent-%COMP%] {\n  background-color: var(--accent-color);\n  color: var(--header-text);\n  border-color: var(--accent-color);\n}\n.radio-group[_ngcontent-%COMP%]   label[_ngcontent-%COMP%]:hover {\n  background-color: var(--secondary-background);\n}\n.radio-group[_ngcontent-%COMP%]   input[type=radio][_ngcontent-%COMP%]:checked    + label[_ngcontent-%COMP%]:hover {\n  background-color: var(--accent-color-hover);\n}\n/*# sourceMappingURL=rf-radio-group.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(RfRadioGroupComponent, { className: "RfRadioGroupComponent", filePath: "src/app/shared/reactive-form/refactored/input-fields/radio-group/rf-radio-group.component.ts", lineNumber: 19 });
})();

// src/app/pipes/find.pipe.ts
var FindPipe = class _FindPipe {
  transform(array, property, value) {
    return array.find((item) => item[property] === value);
  }
  static \u0275fac = function FindPipe_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _FindPipe)();
  };
  static \u0275pipe = /* @__PURE__ */ \u0275\u0275definePipe({ name: "find", type: _FindPipe, pure: true });
};

// src/app/shared/reactive-form/refactored/input-fields/searchable-multi-select-input/searchable-multi-select-input.component.ts
function SearchableMultiSelectInputComponent_For_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 2);
    \u0275\u0275text(1);
    \u0275\u0275pipe(2, "find");
    \u0275\u0275elementStart(3, "button", 4);
    \u0275\u0275listener("click", function SearchableMultiSelectInputComponent_For_5_Template_button_click_3_listener() {
      const value_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.removeOption(value_r2));
    });
    \u0275\u0275text(4, "X");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    let tmp_10_0;
    const value_r2 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", (tmp_10_0 = (tmp_10_0 = \u0275\u0275pipeBind3(2, 1, ctx_r2.options(), "value", value_r2)) == null ? null : tmp_10_0.label) !== null && tmp_10_0 !== void 0 ? tmp_10_0 : value_r2, " ");
  }
}
var SearchableMultiSelectInputComponent = class _SearchableMultiSelectInputComponent {
  options = input([]);
  label = input("");
  categoryName = input("");
  closeOnSelect = input(true);
  selectionChange = new EventEmitter();
  addNewOption = output();
  editOption = output();
  destroyRef = inject(DestroyRef);
  elementRef = inject(ElementRef);
  selectedValues = signal([]);
  availableOptions = signal([]);
  isOpen = signal(false);
  constructor() {
    effect(() => {
      this.updateAvailableOptions();
    });
  }
  updateAvailableOptions() {
    const opts = this.options();
    if (opts && Array.isArray(opts)) {
      const filtered = opts.filter((option) => !this.selectedValues().includes(option.value));
      this.availableOptions.set(filtered);
    }
  }
  onChange = () => {
  };
  onTouched = () => {
  };
  writeValue(value) {
    if (Array.isArray(value)) {
      const mappedValues = value.map((item) => {
        if (typeof item === "object" && item !== null) {
          return item.id !== void 0 ? item.id : item;
        } else {
          return item;
        }
      });
      this.selectedValues.set(mappedValues);
    } else {
      this.selectedValues.set([]);
    }
  }
  registerOnChange(fn) {
    this.onChange = fn;
  }
  registerOnTouched(fn) {
    this.onTouched = fn;
  }
  onDocumentClick(event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }
  closeDropdown() {
    this.isOpen.set(false);
  }
  toggleDropdown(event) {
    event.stopPropagation();
    this.isOpen.update((state) => !state);
  }
  onSelect(value) {
    if (!this.selectedValues().includes(value)) {
      this.selectedValues.update((values) => [...values, value]);
      this.onChange(this.selectedValues());
      this.onTouched();
      this.selectionChange.emit(this.selectedValues());
      if (this.closeOnSelect()) {
        this.isOpen.set(false);
      }
    }
  }
  removeOption(value) {
    this.selectedValues.update((values) => values.filter((v) => v !== value));
    this.onChange(this.selectedValues());
    this.onTouched();
    this.selectionChange.emit(this.selectedValues());
  }
  filterOptions(event) {
    const filterValue = event.target.value.toLowerCase();
    const opts = this.options();
    if (opts && Array.isArray(opts)) {
      const filtered = opts.filter((option) => option.label.toLowerCase().includes(filterValue) && !this.selectedValues().includes(option.value));
      this.availableOptions.set(filtered);
    }
  }
  getSelectedOptionLabels() {
    const opts = this.options();
    const selected = this.selectedValues().map((value) => opts?.find((opt) => opt.value === value)?.label || value);
    return selected.join(", ");
  }
  onAddNewOption() {
    this.addNewOption.emit(this.categoryName());
  }
  onEditOption() {
    this.editOption.emit(this.categoryName());
  }
  static \u0275fac = function SearchableMultiSelectInputComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _SearchableMultiSelectInputComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _SearchableMultiSelectInputComponent, selectors: [["app-searchable-multi-select-input"]], hostBindings: function SearchableMultiSelectInputComponent_HostBindings(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275listener("click", function SearchableMultiSelectInputComponent_click_HostBindingHandler($event) {
        return ctx.onDocumentClick($event);
      }, false, \u0275\u0275resolveDocument);
    }
  }, inputs: { options: [1, "options"], label: [1, "label"], categoryName: [1, "categoryName"], closeOnSelect: [1, "closeOnSelect"] }, outputs: { selectionChange: "selectionChange", addNewOption: "addNewOption", editOption: "editOption" }, features: [\u0275\u0275ProvidersFeature([
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => _SearchableMultiSelectInputComponent),
      multi: true
    }
  ])], decls: 7, vars: 5, consts: [[1, "multi-select-container"], [1, "selected-options"], [1, "selected-option"], [3, "editOption", "addNewOption", "valueChange", "label", "options", "categoryName", "closeOnSelect"], ["type", "button", 3, "click"]], template: function SearchableMultiSelectInputComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "label");
      \u0275\u0275text(2);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(3, "div", 1);
      \u0275\u0275repeaterCreate(4, SearchableMultiSelectInputComponent_For_5_Template, 5, 5, "div", 2, \u0275\u0275repeaterTrackByIdentity);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(6, "app-searchable-select-input", 3);
      \u0275\u0275listener("editOption", function SearchableMultiSelectInputComponent_Template_app_searchable_select_input_editOption_6_listener() {
        return ctx.onEditOption();
      })("addNewOption", function SearchableMultiSelectInputComponent_Template_app_searchable_select_input_addNewOption_6_listener() {
        return ctx.onAddNewOption();
      })("valueChange", function SearchableMultiSelectInputComponent_Template_app_searchable_select_input_valueChange_6_listener($event) {
        return ctx.onSelect($event);
      });
      \u0275\u0275elementEnd()();
    }
    if (rf & 2) {
      \u0275\u0275advance(2);
      \u0275\u0275textInterpolate(ctx.label());
      \u0275\u0275advance(2);
      \u0275\u0275repeater(ctx.selectedValues());
      \u0275\u0275advance(2);
      \u0275\u0275property("label", "")("options", ctx.availableOptions())("categoryName", ctx.categoryName())("closeOnSelect", false);
    }
  }, dependencies: [CommonModule, SearchableSelectInputComponent, FindPipe], styles: ["\n\n.multi-select-container[_ngcontent-%COMP%] {\n  width: 100%;\n  margin-bottom: 1rem;\n  position: relative;\n}\n.multi-select-container[_ngcontent-%COMP%]    > label[_ngcontent-%COMP%] {\n  display: block;\n  margin-bottom: 0.5rem;\n  font-weight: bold;\n  color: var(--primary-text);\n}\n.selected-options[_ngcontent-%COMP%] {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 5px;\n  margin-bottom: 10px;\n  padding: 5px;\n  border: 1px solid var(--border-color);\n  border-radius: 4px;\n  min-height: 38px;\n}\n.selected-option[_ngcontent-%COMP%] {\n  background-color: var(--secondary-background);\n  color: var(--primary-text);\n  padding: 5px 10px;\n  border-radius: 15px;\n  display: flex;\n  align-items: center;\n  font-size: 0.9em;\n}\n.selected-option[_ngcontent-%COMP%]   button[_ngcontent-%COMP%] {\n  background: none;\n  border: none;\n  cursor: pointer;\n  margin-left: 5px;\n  padding: 0;\n  color: var(--secondary-text);\n  font-size: 1.2em;\n  line-height: 1;\n}\n.selected-option[_ngcontent-%COMP%]   button[_ngcontent-%COMP%]:hover {\n  color: var(--primary-text);\n}\n.search-input[_ngcontent-%COMP%] {\n  width: 100%;\n  padding: 0.5rem;\n  border: 1px solid var(--border-color);\n  border-radius: 4px;\n  background-color: var(--primary-background);\n  color: var(--primary-text);\n  font-size: 1rem;\n  box-sizing: border-box;\n}\n.search-input[_ngcontent-%COMP%]:focus {\n  outline: none;\n  border-color: var(--accent-color);\n  box-shadow: 0 0 0 0.2rem var(--accent-color-shadow);\n}\n.options-list[_ngcontent-%COMP%] {\n  list-style: none;\n  padding: 0;\n  margin: 5px 0 0;\n  border: 1px solid var(--border-color);\n  border-radius: 4px;\n  max-height: 200px;\n  overflow-y: auto;\n  position: absolute;\n  width: 100%;\n  background-color: var(--card-background);\n  z-index: 1000;\n  box-shadow: var(--card-shadow);\n}\n.options-list[_ngcontent-%COMP%]   li[_ngcontent-%COMP%] {\n  padding: 10px;\n  cursor: pointer;\n  color: var(--primary-text);\n}\n.options-list[_ngcontent-%COMP%]   li[_ngcontent-%COMP%]:hover {\n  background-color: var(--secondary-background);\n}\n.options-list[_ngcontent-%COMP%]   li.selected[_ngcontent-%COMP%] {\n  background-color: var(--accent-color);\n  color: var(--header-text);\n}\n/*# sourceMappingURL=searchable-multi-select-input.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(SearchableMultiSelectInputComponent, { className: "SearchableMultiSelectInputComponent", filePath: "src/app/shared/reactive-form/refactored/input-fields/searchable-multi-select-input/searchable-multi-select-input.component.ts", lineNumber: 35 });
})();

// src/app/services/util/clipboard.service.ts
var ClipboardService = class _ClipboardService {
  clipboardData = "";
  setClipboardData(data) {
    this.clipboardData = data;
    console.log("Data copied to clipboard", data);
  }
  getClipboardData() {
    return this.clipboardData;
  }
  static \u0275fac = function ClipboardService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _ClipboardService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _ClipboardService, factory: _ClipboardService.\u0275fac, providedIn: "root" });
};

// src/app/directives/copy-paste.directive.ts
var CopyPasteDirective = class _CopyPasteDirective {
  clipboardService = inject(ClipboardService);
  valueToCopy = null;
  // @HostListener('click', ['$event'])
  // onClick(event: MouseEvent): void {
  //   if (event.ctrlKey) {
  //     this.copyToClipboard(event);
  //   } else if (event.shiftKey) {
  //     this.pasteFromClipboard(event);
  //   }
  // }
  onClick(event) {
    if (event.ctrlKey || event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      if (event.ctrlKey) {
        this.copyToClipboard(event);
      } else if (event.shiftKey) {
        this.pasteFromClipboard(event);
      }
    }
  }
  copyToClipboard(event) {
    if (this.valueToCopy !== null) {
      this.clipboardService.setClipboardData(this.valueToCopy);
      event.stopPropagation();
      return;
    }
    const target = event.target;
    if (target && target.value) {
      this.clipboardService.setClipboardData(target.value);
    }
  }
  pasteFromClipboard(event) {
    const target = event.target;
    const clipboardData = this.clipboardService.getClipboardData();
    if (target && clipboardData) {
      target.value = clipboardData;
      target.dispatchEvent(new Event("input"));
    }
  }
  static \u0275fac = function CopyPasteDirective_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _CopyPasteDirective)();
  };
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({ type: _CopyPasteDirective, selectors: [["", "appCopyPaste", ""]], hostBindings: function CopyPasteDirective_HostBindings(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275listener("click", function CopyPasteDirective_click_HostBindingHandler($event) {
        return ctx.onClick($event);
      });
    }
  }, inputs: { valueToCopy: "valueToCopy" } });
};

// src/app/shared/reactive-form/refactored/input-fields/multi-text-input/multi-text-input.component.ts
function MultiTextInputComponent_For_6_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 3)(1, "input", 5);
    \u0275\u0275twoWayListener("ngModelChange", function MultiTextInputComponent_For_6_Template_input_ngModelChange_1_listener($event) {
      const $index_r2 = \u0275\u0275restoreView(_r1).$index;
      const ctx_r2 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r2.values[$index_r2], $event) || (ctx_r2.values[$index_r2] = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function MultiTextInputComponent_For_6_Template_input_ngModelChange_1_listener($event) {
      const $index_r2 = \u0275\u0275restoreView(_r1).$index;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onValueChange($index_r2, $event));
    })("blur", function MultiTextInputComponent_For_6_Template_input_blur_1_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onInputBlur());
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "button", 6);
    \u0275\u0275listener("click", function MultiTextInputComponent_For_6_Template_button_click_2_listener() {
      const $index_r2 = \u0275\u0275restoreView(_r1).$index;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.removeValue($index_r2));
    });
    \u0275\u0275text(3, "X");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const $index_r2 = ctx.$index;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("type", ctx_r2.type)("placeholder", "Enter value...");
    \u0275\u0275twoWayProperty("ngModel", ctx_r2.values[$index_r2]);
  }
}
var MultiTextInputComponent = class _MultiTextInputComponent {
  label = "";
  type = "text";
  valuesChange = new EventEmitter();
  values = [""];
  // Initialize with an empty string
  onValueChange(index, newValue) {
    this.values[index] = newValue;
    this.emitChange();
  }
  onInputBlur() {
    this.onTouched();
    this.valuesChange.emit([...this.values]);
    this.ensureMinimumInputs();
  }
  addValue() {
    this.values = [...this.values, ""];
    this.emitChange();
  }
  removeValue(index) {
    this.values = this.values.filter((_, i) => i !== index);
    this.ensureMinimumInputs();
    this.emitChange();
  }
  writeValue(value) {
    if (Array.isArray(value) && value.length > 0) {
      this.values = [...value];
    } else {
      this.values = [""];
    }
    this.ensureMinimumInputs();
  }
  ensureMinimumInputs() {
    if (this.values.length === 0) {
      this.values = [""];
    }
  }
  emitChange() {
    const valuesCopy = [...this.values];
    this.onChange(valuesCopy);
    this.valuesChange.emit(valuesCopy);
  }
  onChange = () => {
  };
  onTouched = () => {
  };
  registerOnChange(fn) {
    this.onChange = fn;
  }
  registerOnTouched(fn) {
    this.onTouched = fn;
  }
  static \u0275fac = function MultiTextInputComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _MultiTextInputComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _MultiTextInputComponent, selectors: [["app-multi-text-input"]], inputs: { label: "label", type: "type" }, outputs: { valuesChange: "valuesChange" }, features: [\u0275\u0275ProvidersFeature([
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => _MultiTextInputComponent),
      multi: true
    }
  ])], decls: 9, vars: 1, consts: [[1, "multi-input-container"], [1, "label-container"], [1, "input-values"], [1, "input-value"], ["type", "button", 1, "add-button", 3, "click"], ["appCopyPaste", "", 3, "ngModelChange", "blur", "type", "placeholder", "ngModel"], ["type", "button", "title", "Remove", 3, "click"]], template: function MultiTextInputComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "label");
      \u0275\u0275text(3);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(4, "div", 2);
      \u0275\u0275repeaterCreate(5, MultiTextInputComponent_For_6_Template, 4, 3, "div", 3, \u0275\u0275repeaterTrackByIndex);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(7, "button", 4);
      \u0275\u0275listener("click", function MultiTextInputComponent_Template_button_click_7_listener() {
        return ctx.addValue();
      });
      \u0275\u0275text(8, "+ Add");
      \u0275\u0275elementEnd()();
    }
    if (rf & 2) {
      \u0275\u0275advance(3);
      \u0275\u0275textInterpolate(ctx.label);
      \u0275\u0275advance(2);
      \u0275\u0275repeater(ctx.values);
    }
  }, dependencies: [CommonModule, FormsModule, DefaultValueAccessor, NgControlStatus, NgModel, CopyPasteDirective], styles: ["\n\n[_nghost-%COMP%] {\n  display: block;\n  width: 100%;\n}\n.multi-input-container[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 0.5rem;\n  width: 100%;\n}\n.label-container[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n}\n.label-container[_ngcontent-%COMP%]   label[_ngcontent-%COMP%] {\n  font-weight: 600;\n  font-size: 0.875rem;\n  color: var(--primary-text);\n}\n.question-icon[_ngcontent-%COMP%] {\n  cursor: pointer;\n  color: var(--accent-color);\n  font-size: 0.875rem;\n}\n.question-icon[_ngcontent-%COMP%]:hover {\n  color: var(--accent-color-hover);\n}\n.input-values[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 0.5rem;\n}\n.input-value[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n}\n.input-value[_ngcontent-%COMP%]   input[_ngcontent-%COMP%] {\n  flex: 1;\n  padding: 0.5rem 0.75rem;\n  font-size: 0.875rem;\n  border: 1px solid var(--border-color);\n  border-radius: 4px;\n  background-color: var(--primary-background);\n  color: var(--primary-text);\n  transition: border-color 0.2s ease, box-shadow 0.2s ease;\n}\n.input-value[_ngcontent-%COMP%]   input[_ngcontent-%COMP%]:focus {\n  outline: none;\n  border-color: var(--accent-color);\n  box-shadow: 0 0 0 2px var(--accent-color-shadow);\n}\n.input-value[_ngcontent-%COMP%]   input[_ngcontent-%COMP%]::placeholder {\n  color: var(--secondary-text);\n}\n.input-value[_ngcontent-%COMP%]   button[_ngcontent-%COMP%] {\n  padding: 0.4rem 0.6rem;\n  font-size: 0.75rem;\n  font-weight: 600;\n  background-color: transparent;\n  color: var(--error-text, #d32f2f);\n  border: 1px solid var(--error-text, #d32f2f);\n  border-radius: 4px;\n  cursor: pointer;\n  transition: all 0.2s ease;\n  line-height: 1;\n}\n.input-value[_ngcontent-%COMP%]   button[_ngcontent-%COMP%]:hover {\n  background-color: var(--error-background, #ffebee);\n  color: var(--error-text, #c62828);\n}\n.add-button[_ngcontent-%COMP%] {\n  align-self: flex-start;\n  padding: 0.4rem 0.75rem;\n  font-size: 0.875rem;\n  font-weight: 500;\n  background-color: var(--accent-color);\n  color: white;\n  border: none;\n  border-radius: 4px;\n  cursor: pointer;\n  transition: background-color 0.2s ease, transform 0.1s ease;\n}\n.add-button[_ngcontent-%COMP%]:hover {\n  background-color: var(--accent-color-hover);\n}\n.add-button[_ngcontent-%COMP%]:active {\n  transform: scale(0.98);\n}\n/*# sourceMappingURL=multi-text-input.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(MultiTextInputComponent, { className: "MultiTextInputComponent", filePath: "src/app/shared/reactive-form/refactored/input-fields/multi-text-input/multi-text-input.component.ts", lineNumber: 20 });
})();

// src/app/shared/reactive-form/refactored/input-fields/form-input/rf-form-input.component.ts
function RfFormInputComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 1)(1, "label", 4);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(ctx_r0.label);
  }
}
function RfFormInputComponent_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "textarea", 5);
    \u0275\u0275listener("input", function RfFormInputComponent_Conditional_2_Template_textarea_input_0_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.onInputChange($event));
    });
    \u0275\u0275text(1, "    ");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("value", ctx_r0.value)("readonly", ctx_r0.readonly);
  }
}
function RfFormInputComponent_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "input", 6);
    \u0275\u0275listener("input", function RfFormInputComponent_Conditional_3_Template_input_input_0_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.onInputChange($event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("type", ctx_r0.type)("value", ctx_r0.value)("readonly", ctx_r0.readonly);
  }
}
var RfFormInputComponent = class _RfFormInputComponent {
  readonly = false;
  label = "";
  type = "text";
  value = "";
  customStyle = {};
  valueChange = new EventEmitter();
  onChange = () => {
  };
  onTouched = () => {
  };
  writeValue(value) {
    if (this.type === "date" && value instanceof Date) {
      this.value = value.toISOString().split("T")[0];
    } else if (value !== void 0) {
      this.value = value;
    }
  }
  registerOnChange(fn) {
    this.onChange = fn;
  }
  registerOnTouched(fn) {
    this.onTouched = fn;
  }
  onInputChange(event) {
    const target = event.target;
    let value;
    switch (this.type) {
      case "checkbox":
        value = target.checked;
        break;
      case "number":
        value = target.value === "" ? null : target.valueAsNumber;
        break;
      default:
        value = target.value;
        break;
    }
    this.value = value;
    this.onChange(this.value);
    this.onTouched();
    this.valueChange.emit(this.value);
  }
  static \u0275fac = function RfFormInputComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _RfFormInputComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _RfFormInputComponent, selectors: [["app-rf-form-input"]], inputs: { readonly: "readonly", label: "label", type: "type", value: "value", customStyle: "customStyle" }, outputs: { valueChange: "valueChange" }, features: [\u0275\u0275ProvidersFeature([
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => _RfFormInputComponent),
      multi: true
    }
  ])], decls: 4, vars: 3, consts: [[1, "form-input", 3, "ngStyle"], [1, "label-container"], [1, "form-input-element", 3, "value", "readonly"], [1, "form-input-element", 3, "type", "value", "readonly"], [1, "field-label"], [1, "form-input-element", 3, "input", "value", "readonly"], [1, "form-input-element", 3, "input", "type", "value", "readonly"]], template: function RfFormInputComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0);
      \u0275\u0275template(1, RfFormInputComponent_Conditional_1_Template, 3, 1, "div", 1)(2, RfFormInputComponent_Conditional_2_Template, 2, 2, "textarea", 2)(3, RfFormInputComponent_Conditional_3_Template, 1, 3, "input", 3);
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      \u0275\u0275property("ngStyle", ctx.customStyle);
      \u0275\u0275advance();
      \u0275\u0275conditional(ctx.label && ctx.label !== "" ? 1 : -1);
      \u0275\u0275advance();
      \u0275\u0275conditional(ctx.type === "textarea" ? 2 : 3);
    }
  }, dependencies: [CommonModule, NgStyle], styles: ["/* src/app/shared/reactive-form/refactored/input-fields/form-input/rf-form-input.component.css */\n:host {\n  display: block;\n  font-family: Arial, sans-serif;\n  max-width: 100%;\n  margin: 0 auto;\n}\n.form-input {\n  display: flex;\n  flex-direction: column;\n  margin-bottom: 1rem;\n  width: 100%;\n}\n.label-container {\n  margin-bottom: 0.5rem;\n}\n.form-input .field-label {\n  font-weight: 600;\n  font-size: 0.875rem;\n  color: var(--primary-text);\n}\n.form-input-element {\n  padding: 0.5rem 0.75rem;\n  border: 1px solid var(--border-color);\n  border-radius: 4px;\n  background-color: var(--primary-background);\n  color: var(--primary-text);\n  font-size: 0.875rem;\n  width: 100%;\n  box-sizing: border-box;\n  transition: border-color 0.2s ease, box-shadow 0.2s ease;\n}\n.form-input-element:focus {\n  outline: none;\n  border-color: var(--accent-color);\n  box-shadow: 0 0 0 2px var(--accent-color-shadow);\n}\n.form-input-element[readonly] {\n  background-color: var(--secondary-background);\n  cursor: not-allowed;\n}\ntextarea.form-input-element {\n  min-height: 80px;\n  resize: vertical;\n  font-family: inherit;\n}\n/*# sourceMappingURL=rf-form-input.component.css.map */\n"], encapsulation: 2 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(RfFormInputComponent, { className: "RfFormInputComponent", filePath: "src/app/shared/reactive-form/refactored/input-fields/form-input/rf-form-input.component.ts", lineNumber: 20 });
})();

// src/app/shared/reactive-form/refactored/input-fields/form-array-input/form-array-input.component.ts
function FormArrayInputComponent_div_3_ng_container_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 8);
    \u0275\u0275element(2, "app-rf-form-input", 9);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const field_r2 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275property("label", field_r2.label)("type", field_r2.type)("formControlName", field_r2.name);
  }
}
function FormArrayInputComponent_div_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 4)(1, "div", 5);
    \u0275\u0275template(2, FormArrayInputComponent_div_3_ng_container_2_Template, 3, 3, "ng-container", 6);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "button", 7);
    \u0275\u0275listener("click", function FormArrayInputComponent_div_3_Template_button_click_3_listener() {
      const i_r3 = \u0275\u0275restoreView(_r1).index;
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.onRemoveItem(i_r3));
    });
    \u0275\u0275text(4, "Remove");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const control_r5 = ctx.$implicit;
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275property("formGroup", control_r5);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngForOf", ctx_r3.fields());
  }
}
var FormArrayInputComponent = class _FormArrayInputComponent {
  label = input("");
  fields = input([]);
  formArray = input.required();
  addItem = output();
  removeItem = output();
  get itemControls() {
    return this.formArray().controls;
  }
  onAddItem() {
    this.addItem.emit();
  }
  onRemoveItem(index) {
    this.removeItem.emit(index);
  }
  static \u0275fac = function FormArrayInputComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _FormArrayInputComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _FormArrayInputComponent, selectors: [["app-form-array-input"]], inputs: { label: [1, "label"], fields: [1, "fields"], formArray: [1, "formArray"] }, outputs: { addItem: "addItem", removeItem: "removeItem" }, decls: 6, vars: 2, consts: [[1, "form-array-container"], [1, "form-array-label"], ["class", "form-array-item", 3, "formGroup", 4, "ngFor", "ngForOf"], ["type", "button", 1, "add-item-btn", 3, "click"], [1, "form-array-item", 3, "formGroup"], [1, "item-fields"], [4, "ngFor", "ngForOf"], ["type", "button", 1, "remove-item-btn", 3, "click"], [1, "form-field"], [3, "label", "type", "formControlName"]], template: function FormArrayInputComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "label", 1);
      \u0275\u0275text(2);
      \u0275\u0275elementEnd();
      \u0275\u0275template(3, FormArrayInputComponent_div_3_Template, 5, 2, "div", 2);
      \u0275\u0275elementStart(4, "button", 3);
      \u0275\u0275listener("click", function FormArrayInputComponent_Template_button_click_4_listener() {
        return ctx.onAddItem();
      });
      \u0275\u0275text(5, "Add Item");
      \u0275\u0275elementEnd()();
    }
    if (rf & 2) {
      \u0275\u0275advance(2);
      \u0275\u0275textInterpolate(ctx.label());
      \u0275\u0275advance();
      \u0275\u0275property("ngForOf", ctx.itemControls);
    }
  }, dependencies: [CommonModule, NgForOf, ReactiveFormsModule, NgControlStatus, NgControlStatusGroup, FormGroupDirective, FormControlName, RfFormInputComponent], styles: ["\n\n[_nghost-%COMP%] {\n  display: block;\n  width: 100%;\n}\n.form-array-container[_ngcontent-%COMP%] {\n  border: 1px solid var(--border-color);\n  padding: 1rem;\n  border-radius: 4px;\n  margin-bottom: 1rem;\n  background-color: var(--secondary-background);\n}\n.form-array-label[_ngcontent-%COMP%] {\n  font-weight: 600;\n  margin-bottom: 0.75rem;\n  display: block;\n  color: var(--primary-text);\n  font-size: 0.875rem;\n}\n.form-array-item[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: flex-start;\n  gap: 1rem;\n  padding: 1rem;\n  border-top: 1px solid var(--border-color);\n  background-color: var(--card-background);\n}\n.form-array-item[_ngcontent-%COMP%]:first-child {\n  border-top: none;\n  border-radius: 4px 4px 0 0;\n}\n.form-array-item[_ngcontent-%COMP%]:last-child {\n  border-radius: 0 0 4px 4px;\n}\n.form-array-item[_ngcontent-%COMP%]:only-child {\n  border-radius: 4px;\n}\n.item-fields[_ngcontent-%COMP%] {\n  flex-grow: 1;\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));\n  gap: 1rem;\n}\n.form-field[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n}\n.add-item-btn[_ngcontent-%COMP%] {\n  padding: 0.5rem 1rem;\n  border: none;\n  background-color: var(--accent-color);\n  color: white;\n  cursor: pointer;\n  border-radius: 4px;\n  margin-top: 0.75rem;\n  font-size: 0.875rem;\n  font-weight: 500;\n  transition: background-color 0.2s ease;\n}\n.add-item-btn[_ngcontent-%COMP%]:hover {\n  background-color: var(--accent-color-hover);\n}\n.add-item-btn[_ngcontent-%COMP%]:active {\n  transform: scale(0.98);\n}\n.remove-item-btn[_ngcontent-%COMP%] {\n  padding: 0.4rem 0.75rem;\n  background-color: transparent;\n  color: var(--error-text, #d32f2f);\n  border: 1px solid var(--error-text, #d32f2f);\n  border-radius: 4px;\n  cursor: pointer;\n  font-size: 0.75rem;\n  font-weight: 600;\n  align-self: center;\n  transition: all 0.2s ease;\n}\n.remove-item-btn[_ngcontent-%COMP%]:hover {\n  background-color: var(--error-background, #ffebee);\n  color: var(--error-text, #c62828);\n}\n.form-array-empty[_ngcontent-%COMP%] {\n  padding: 1rem;\n  text-align: center;\n  color: var(--secondary-text);\n  font-style: italic;\n  background-color: var(--card-background);\n  border-radius: 4px;\n}\n/*# sourceMappingURL=form-array-input.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(FormArrayInputComponent, { className: "FormArrayInputComponent", filePath: "src/app/shared/reactive-form/refactored/input-fields/form-array-input/form-array-input.component.ts", lineNumber: 14 });
})();

// src/app/shared/popup-projection/rf-popup-projection.component.ts
var _c02 = ["*"];
var _c1 = (a0, a1) => [a0, a1];
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
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction2(4, _c1, "popup-" + ctx_r1.size, ctx_r1.fullHeight ? "popup-full-height" : ""));
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
  // Default z-index, can be overridden for nested popups
  close = new EventEmitter();
  overlayElement = null;
  isViewInitialized = false;
  isBrowser;
  constructor(elementRef, document2, platformId) {
    this.elementRef = elementRef;
    this.document = document2;
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
        setTimeout(() => this.moveToBody(), 0);
      } else {
        this.removeFromBody();
      }
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
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _RfPopupProjectionComponent, selectors: [["app-rf-popup-projection"]], inputs: { isOpen: "isOpen", title: "title", size: "size", fullHeight: "fullHeight", zIndex: "zIndex" }, outputs: { close: "close" }, features: [\u0275\u0275NgOnChangesFeature], ngContentSelectors: _c02, decls: 1, vars: 1, consts: [[1, "popup-overlay", 3, "z-index"], [1, "popup-overlay", 3, "click"], [1, "popup-content", 3, "click", "ngClass"], [1, "popup-header"], [1, "close-button", 3, "click"], [1, "popup-body"]], template: function RfPopupProjectionComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275projectionDef();
      \u0275\u0275template(0, RfPopupProjectionComponent_Conditional_0_Template, 9, 7, "div", 0);
    }
    if (rf & 2) {
      \u0275\u0275conditional(ctx.isOpen ? 0 : -1);
    }
  }, dependencies: [NgClass], styles: ["\n\n.popup-overlay[_ngcontent-%COMP%] {\n  position: fixed;\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  background-color: rgba(0, 0, 0, 0.5);\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  z-index: 10000;\n}\n.popup-content[_ngcontent-%COMP%] {\n  background-color: var(--card-background);\n  border-radius: 8px;\n  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);\n  display: flex;\n  flex-direction: column;\n  max-height: 90vh;\n  overflow: hidden;\n}\n.popup-small[_ngcontent-%COMP%] {\n  width: 400px;\n}\n.popup-medium[_ngcontent-%COMP%] {\n  width: 600px;\n}\n.popup-large[_ngcontent-%COMP%] {\n  width: 900px;\n}\n.popup-auto[_ngcontent-%COMP%] {\n  width: auto;\n  max-width: 90vw;\n}\n.popup-full-height[_ngcontent-%COMP%] {\n  height: 90vh;\n}\n.popup-header[_ngcontent-%COMP%] {\n  flex-shrink: 0;\n  padding: 20px;\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  gap: 20px;\n}\n.popup-header[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%] {\n  margin: 0;\n  font-size: 1.5em;\n  flex: 1;\n}\n.close-button[_ngcontent-%COMP%] {\n  background: none;\n  border: none;\n  font-size: 24px;\n  cursor: pointer;\n  color: #666;\n  padding: 0;\n  min-width: 32px;\n  height: 32px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  flex-shrink: 0;\n}\n.close-button[_ngcontent-%COMP%]:hover {\n  color: #333;\n  background-color: #f0f0f0;\n  border-radius: 4px;\n}\n.popup-body[_ngcontent-%COMP%] {\n  flex: 1;\n  overflow-y: auto;\n  min-height: 0;\n  border-top: 1px solid #e0e0e0;\n  display: flex;\n  flex-direction: column;\n}\n.popup-full-height[_ngcontent-%COMP%]   .popup-body[_ngcontent-%COMP%] {\n  overflow: hidden;\n}\n/*# sourceMappingURL=rf-popup-projection.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(RfPopupProjectionComponent, { className: "RfPopupProjectionComponent", filePath: "src/app/shared/popup-projection/rf-popup-projection.component.ts", lineNumber: 11 });
})();

// src/app/services/file.service.ts
var FileService = class _FileService {
  http;
  apiUrl = `${environment.apiUrl}/files`;
  constructor(http) {
    this.http = http;
  }
  getFiles(page = 1, pageSize = 50) {
    const params = new HttpParams().set("page", page.toString()).set("pageSize", pageSize.toString());
    return this.http.get(`${this.apiUrl}/paginated`, { params });
  }
  getFilesWithPoints() {
    return this.http.get(`${this.apiUrl}/with-points`);
  }
  getEquipmentByFileId(fileId) {
    return this.http.post(`${this.apiUrl}/eq-by-file`, { id: fileId });
  }
  getFileByLink(fileLink) {
    return this.http.post(`${this.apiUrl}/file-by-link`, { fileLink });
  }
  getByFileType(fileType) {
    return this.http.get(`${this.apiUrl}/by-type/${fileType}`);
  }
  searchFiles(criteria, pageSize) {
    const params = new HttpParams().set("page", (criteria.page ?? 1).toString()).set("pageSize", pageSize.toString());
    return this.http.post(`${this.apiUrl}/search`, criteria, { params });
  }
  getFileById(id) {
    return this.http.get(`${this.apiUrl}/${id}`);
  }
  getFileByUrl(imageUrl) {
    const body = { url: imageUrl };
    return this.http.post(`${this.apiUrl}/by-url`, body);
  }
  createFile(file) {
    return this.http.post(this.apiUrl, file);
  }
  updateFile(formData) {
    return this.http.put(`${this.apiUrl}`, formData);
  }
  deleteFile(id) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
  uploadFile(file) {
    const formData = new FormData();
    formData.append("file", file, file.name);
    return this.http.post(`${this.apiUrl}/upload`, formData);
  }
  downloadFile(id) {
    return this.http.get(`${this.apiUrl}/${id}/download`, { responseType: "blob" });
  }
  getMockFiles(params) {
    const testElements = [
      {
        shapeType: { name: "rectangle" },
        color: "#FF0000",
        shapeData: {
          x: 1200,
          y: 100,
          width: 200,
          height: 800
        }
      },
      {
        shapeType: { name: "rectangle" },
        color: "#FF0000",
        shapeData: {
          x: 0,
          y: 0,
          width: 200,
          height: 200
        }
      },
      {
        shapeType: { name: "rectangle" },
        color: "#FF0000",
        shapeData: {
          x: 7144,
          y: 4552,
          width: 200,
          height: 200
        }
      },
      {
        shapeType: { name: "circle" },
        color: "#00FF00",
        shapeData: {
          x: 2300,
          y: 1300,
          radius: 75
        }
      },
      {
        shapeType: { name: "line" },
        color: "#0000FF",
        shapeData: {
          x1: 50,
          y1: 50,
          x2: 250,
          y2: 250
        }
      },
      {
        shapeType: { name: "text" },
        color: "#FFFF00",
        shapeData: {
          x: 400,
          y: 400,
          text: "Sample Text",
          fontSize: 20
        }
      }
    ];
    const mockFiles = [
      { id: "1", name: "Document1.pdf", type: "pdf", size: "1.2 MB", uploadDate: "2023-05-15", category: "document", tags: ["important"] },
      { id: "2", name: "Image1.jpg", type: "jpg", size: "3.5 MB", uploadDate: "2023-05-16", category: "image", tags: ["archived"], url: "assets/images/Image1.jpg", elements: testElements },
      { id: "3", name: "Spreadsheet1.xlsx", type: "xlsx", size: "0.8 MB", uploadDate: "2023-05-17", category: "spreadsheet", tags: ["confidential"] },
      { id: "4", name: "Document2.docx", type: "docx", size: "2.1 MB", uploadDate: "2023-05-18", category: "document", tags: ["important", "confidential"] },
      { id: "5", name: "Presentation1.pptx", type: "pptx", size: "5.3 MB", uploadDate: "2023-05-19", category: "other", tags: [] }
    ];
    let filteredFiles = mockFiles;
    if (params && params.lastId) {
      const lastIndex = mockFiles.findIndex((file) => file.id === params.lastId);
      filteredFiles = mockFiles.slice(lastIndex + 1);
    }
    return of(filteredFiles);
  }
  // ==================== TRASH METHODS ====================
  /**
   * Get all files in trash.
   */
  getTrash() {
    return this.http.get(`${this.apiUrl}/trash`);
  }
  /**
   * Get trash statistics.
   */
  getTrashStats() {
    return this.http.get(`${this.apiUrl}/trash/stats`);
  }
  /**
   * Restore a file from trash to its original location.
   */
  restoreFromTrash(id) {
    return this.http.post(`${this.apiUrl}/trash/${id}/restore`, {});
  }
  /**
   * Permanently delete a file from trash.
   */
  permanentlyDeleteFromTrash(id) {
    return this.http.delete(`${this.apiUrl}/trash/${id}`);
  }
  /**
   * Empty the entire trash (permanently delete all items).
   */
  emptyTrash() {
    return this.http.delete(`${this.apiUrl}/trash`);
  }
  static \u0275fac = function FileService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _FileService)(\u0275\u0275inject(HttpClient));
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _FileService, factory: _FileService.\u0275fac, providedIn: "root" });
};

// src/app/services/equipment.service.ts
var EquipmentService = class _EquipmentService {
  http;
  apiUrl = `${environment.apiUrl}/equipment`;
  // Subject to broadcast equipment updates to all listening components
  equipmentUpdatedSubject = new Subject();
  equipmentUpdated$ = this.equipmentUpdatedSubject.asObservable();
  // Subject to broadcast equipment deletions
  equipmentDeletedSubject = new Subject();
  equipmentDeleted$ = this.equipmentDeletedSubject.asObservable();
  constructor(http) {
    this.http = http;
  }
  getEquipment(page = 1, pageSize = 50) {
    const params = new HttpParams().set("page", page.toString()).set("pageSize", pageSize.toString());
    return this.http.get(`${this.apiUrl}/paginated`, { params });
  }
  getEquipmentById(id) {
    return this.http.get(`${this.apiUrl}/${id}`);
  }
  getEquipmentForAnotherUnit(tagNumber) {
    return this.http.post(`${this.apiUrl}/get-other-unit-equipment`, { tagNumber });
  }
  searchEquipment(criteria, page = 1, pageSize = 50) {
    const params = new HttpParams().set("page", page.toString()).set("pageSize", pageSize.toString());
    return this.http.post(`${this.apiUrl}/search`, criteria, { params });
  }
  searchEqByBaseTagNumber(criteria, page = 1, pageSize = 50) {
    const params = new HttpParams().set("page", page.toString()).set("pageSize", pageSize.toString());
    return this.http.post(`${this.apiUrl}/search-by-base-tag-number`, criteria, { params });
  }
  updateEquipment(equipment) {
    return this.http.put(`${this.apiUrl}`, equipment.toIdModel()).pipe(tap((response) => {
      if (response.responseData) {
        const updatedEquipment = EquipmentDto.fromJson(response.responseData);
        this.equipmentUpdatedSubject.next(updatedEquipment);
      }
    }));
  }
  deleteEquipment(id) {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(tap(() => {
      this.equipmentDeletedSubject.next(id);
    }));
  }
  getByEquipmentType(equipmentType) {
    return this.http.get(`${this.apiUrl}/by-type/${equipmentType}`);
  }
  copyEquipment(id, fileId) {
    return this.http.post(`${this.apiUrl}/copy`, { eqId: id, fileId });
  }
  getRelatedFiles(id) {
    return this.http.get(`${this.apiUrl}/${id}/related-files`);
  }
  static \u0275fac = function EquipmentService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _EquipmentService)(\u0275\u0275inject(HttpClient));
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _EquipmentService, factory: _EquipmentService.\u0275fac, providedIn: "root" });
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
  getGroupedLotoPoints(groupBy2) {
    const params = new HttpParams().set("groupBy", groupBy2);
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
  static \u0275fac = function RfLotoPointApiService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _RfLotoPointApiService)(\u0275\u0275inject(HttpClient));
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _RfLotoPointApiService, factory: _RfLotoPointApiService.\u0275fac, providedIn: "root" });
};

// src/app/services/current-file.service.ts
var CurrentFileService = class _CurrentFileService {
  fileService = inject(FileService);
  equipmentService = inject(EquipmentService);
  lotoPointApiService = inject(RfLotoPointApiService);
  destroyRef = inject(DestroyRef);
  currentFileSubject = new BehaviorSubject(null);
  currentFile$ = this.currentFileSubject.asObservable();
  elementsSubject = new BehaviorSubject([]);
  elements$ = this.elementsSubject.asObservable();
  elementsToRenderSubject = new BehaviorSubject([]);
  elementsToRender$ = this.elementsToRenderSubject.asObservable();
  associatedLotoPointsSubject = new BehaviorSubject([]);
  associatedLotoPoints$ = this.associatedLotoPointsSubject.asObservable();
  uniqueEquipmentTypesSubject = new BehaviorSubject([]);
  uniqueEquipmentTypes$ = this.uniqueEquipmentTypesSubject.asObservable();
  equipmentNotSelectedByDefault = [];
  fileTypes = [
    "pid",
    "elect",
    "ht panel",
    "iso"
  ];
  fileMapByTypeSubject = new BehaviorSubject(/* @__PURE__ */ new Map());
  fileMapByType$ = this.fileMapByTypeSubject.asObservable();
  filesLoadedSubject = new BehaviorSubject(false);
  filesLoaded$ = this.filesLoadedSubject.asObservable();
  filesUpdtedSubject = new Subject();
  filesUpdated$ = this.filesUpdtedSubject.asObservable();
  isProcessingFile = signal(false);
  constructor() {
    this.loadAllFilesByType();
    this.subscribeToEquipmentUpdates();
    this.subscribeToLotoPointUpdates();
  }
  /**
   * Subscribe to equipment updates from EquipmentService
   * This ensures all components displaying equipment get updated when any component saves changes
   */
  subscribeToEquipmentUpdates() {
    this.equipmentService.equipmentUpdated$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((updatedEquipment) => {
      console.log("[CurrentFileService] Equipment updated:", updatedEquipment.id);
      this.updateEquipmentInList(updatedEquipment);
    });
    this.equipmentService.equipmentDeleted$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((deletedId) => {
      console.log("[CurrentFileService] Equipment deleted:", deletedId);
      this.removeEquipmentFromList(deletedId);
    });
  }
  /**
   * Subscribe to LOTO point updates from RfLotoPointApiService
   * This ensures all components displaying LOTO points get updated when any component saves changes
   */
  subscribeToLotoPointUpdates() {
    this.lotoPointApiService.lotoPointUpdated$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((updatedLotoPoint) => {
      console.log("[CurrentFileService] LOTO point updated:", updatedLotoPoint.id);
      this.updateAssociatedLotoPoint(updatedLotoPoint);
    });
    this.lotoPointApiService.lotoPointDeleted$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((deletedId) => {
      console.log("[CurrentFileService] LOTO point deleted:", deletedId);
      this.removeLotoPointFromEquipment(deletedId);
    });
  }
  /**
   * Remove LOTO point from all equipment lists by ID
   */
  removeLotoPointFromEquipment(lotoPointId) {
    const updateEquipmentList = (equipmentList) => {
      return equipmentList.map((equipment) => {
        if (equipment.lotoPoints?.some((lp) => lp.id === lotoPointId)) {
          return new EquipmentDto(__spreadProps(__spreadValues({}, equipment), {
            lotoPoints: equipment.lotoPoints.filter((lp) => lp.id !== lotoPointId)
          }));
        }
        return equipment;
      });
    };
    this.elementsSubject.next(updateEquipmentList(this.elementsSubject.getValue()));
    this.elementsToRenderSubject.next(updateEquipmentList(this.elementsToRenderSubject.getValue()));
    const currentFile = this.currentFileSubject.getValue();
    if (currentFile && currentFile.points) {
      const updatedPoints = updateEquipmentList(currentFile.points);
      this.currentFileSubject.next(new FileDto(__spreadProps(__spreadValues({}, currentFile), { points: updatedPoints })));
    }
    const currentLotoPoints = this.associatedLotoPointsSubject.getValue();
    this.associatedLotoPointsSubject.next(currentLotoPoints.filter((lp) => lp.id !== lotoPointId));
  }
  /**
   * Remove equipment from all lists by ID
   */
  removeEquipmentFromList(equipmentId) {
    const currentElements = this.elementsSubject.getValue();
    const updatedElements = currentElements.filter((eq) => eq.id !== equipmentId);
    this.elementsSubject.next(updatedElements);
    const currentToRender = this.elementsToRenderSubject.getValue();
    const updatedToRender = currentToRender.filter((eq) => eq.id !== equipmentId);
    this.elementsToRenderSubject.next(updatedToRender);
    const currentFile = this.currentFileSubject.getValue();
    if (currentFile && currentFile.points) {
      const updatedPoints = currentFile.points.filter((eq) => eq.id !== equipmentId);
      this.currentFileSubject.next(new FileDto(__spreadProps(__spreadValues({}, currentFile), { points: updatedPoints })));
    }
  }
  loadAllFilesByType() {
    const fileObservables = this.fileTypes.map((type) => this.fileService.getByFileType(type).pipe(map((response) => ({ type, files: response.responseData }))));
    forkJoin(fileObservables).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((results) => {
      const fileMap = /* @__PURE__ */ new Map();
      results.forEach((result) => {
        fileMap.set(result.type, result.files);
      });
      this.fileMapByTypeSubject.next(fileMap);
      this.filesLoadedSubject.next(true);
    });
  }
  getFilesByType(type) {
    return this.fileMapByTypeSubject.getValue().get(type) || [];
  }
  /**
   * Public method to refresh all files from the server
   * Reloads all file types and notifies listeners
   */
  refreshFiles() {
    this.filesLoadedSubject.next(false);
    this.loadAllFilesByType();
  }
  setCurrentFile(file) {
    if (!file) {
      this.currentFileSubject.next(null);
      this.elementsSubject.next([]);
      this.uniqueEquipmentTypesSubject.next([]);
      this.updateElementsToRender(this.equipmentNotSelectedByDefault);
      return;
    }
    const currentFileId = this.currentFileSubject.getValue()?.id;
    if (currentFileId && currentFileId !== file.id) {
      this.elementsSubject.next([]);
      this.elementsToRenderSubject.next([]);
    }
    const isIncompleteDto = file.id && (!file.points || file.points.length === 0);
    if (isIncompleteDto) {
      this.currentFileSubject.next(file);
      this.fileService.getFileById(file.id.toString()).pipe(takeUntilDestroyed(this.destroyRef), map((response) => FileDto.fromJson(response.responseData))).subscribe({
        next: (completeFile) => {
          this.setFileData(completeFile);
        },
        error: (error) => {
          console.error("Error fetching complete file data:", error);
          this.setFileData(file);
        }
      });
    } else {
      this.setFileData(file);
    }
  }
  /**
   * Internal helper method to set file data and update all subjects
   */
  setFileData(file) {
    this.currentFileSubject.next(file);
    const elements = file?.points || [];
    this.elementsSubject.next(elements);
    if (file && file.points) {
      const uniqueTypes = this.getUniqueEqTypes();
      this.uniqueEquipmentTypesSubject.next(uniqueTypes);
    } else {
      this.uniqueEquipmentTypesSubject.next([]);
    }
    this.updateElementsToRender(this.equipmentNotSelectedByDefault);
  }
  saveFile(formDataToSend) {
    this.isProcessingFile.set(true);
    return this.fileService.updateFile(formDataToSend).pipe(map((response) => FileDto.fromJson(response.responseData)), tap((updatedFile) => {
      this.setCurrentFile(updatedFile);
      this.updateMapByType(updatedFile.fileType.name ?? "", updatedFile);
      this.isProcessingFile.set(false);
    }));
  }
  /**
   * Update the file map by type and notify listeners
   * Public method to allow other services to trigger file list updates
   */
  updateMapByType(type, file) {
    const partualType = this.fileTypes.find((t) => type.toLowerCase().includes(t.toLowerCase()));
    const targetType = partualType || "pid";
    const currentFilesByType = this.getFilesByType(targetType);
    const updatedFilesByType = currentFilesByType.filter((f) => f.id !== file.id);
    updatedFilesByType.push(file);
    const currentMap = this.fileMapByTypeSubject.getValue();
    const newMap = new Map(currentMap);
    newMap.set(targetType, updatedFilesByType);
    this.fileMapByTypeSubject.next(newMap);
    this.filesUpdtedSubject.next();
  }
  setElementsToRender(elements) {
    this.elementsToRenderSubject.next(elements);
  }
  addElementToRenderedArray(element) {
    const currentElements = this.elementsToRenderSubject.getValue();
    const updatedElements = [...currentElements, element];
    this.elementsToRenderSubject.next(updatedElements);
  }
  getCurrentFile() {
    return this.currentFileSubject.getValue();
  }
  getElements() {
    return this.elements$;
  }
  getUniqueEquipmentTypes() {
    return this.uniqueEquipmentTypes$;
  }
  clearCurrentFile() {
    this.currentFileSubject.next(null);
    this.elementsSubject.next([]);
  }
  getElementsToRender() {
    return this.elementsToRender$;
  }
  getAssociatedLotoPoints() {
    return this.elementsToRender$.pipe(takeUntilDestroyed(this.destroyRef), map((items) => items.flatMap((item) => item.lotoPoints || [])), map((lotoPoints) => lotoPoints.filter((point) => point !== null && point !== void 0)), map((lotoPoints) => {
      const uniqueMap = /* @__PURE__ */ new Map();
      lotoPoints.forEach((point) => {
        if (!uniqueMap.has(point.id)) {
          uniqueMap.set(point.id, point);
        }
      });
      return Array.from(uniqueMap.values());
    }));
  }
  updateLocalLotoPoints(updatedLotoPoints) {
    const currentLotoPoints = this.associatedLotoPointsSubject.getValue();
    const updatedLotoPointsArray = currentLotoPoints.map((point) => {
      const updatedPoint = updatedLotoPoints.find((up) => up.id === point.id);
      return updatedPoint || point;
    });
    this.associatedLotoPointsSubject.next([...updatedLotoPointsArray]);
    const currentElements = this.elementsToRenderSubject.getValue();
    const updatedElements = currentElements.map((element) => {
      if (element.lotoPoints && element.lotoPoints.length > 0) {
        const updatedLotoPointsForElement = element.lotoPoints.map((lotoPoint) => {
          const updatedPoint = updatedLotoPoints.find((up) => up.id === lotoPoint.id);
          return updatedPoint || lotoPoint;
        });
        return new EquipmentDto(__spreadProps(__spreadValues({}, element), { lotoPoints: updatedLotoPointsForElement }));
      }
      return element;
    });
    this.elementsToRenderSubject.next(updatedElements);
    const currentFile = this.currentFileSubject.getValue();
    if (currentFile && currentFile.points) {
      const updatedPoints = currentFile.points.map((point) => {
        if (point.lotoPoints && point.lotoPoints.length > 0) {
          const updatedLotoPointsForPoint = point.lotoPoints.map((lotoPoint) => {
            const updatedPoint = updatedLotoPoints.find((up) => up.id === lotoPoint.id);
            return updatedPoint || lotoPoint;
          });
          return new EquipmentDto(__spreadProps(__spreadValues({}, point), { lotoPoints: updatedLotoPointsForPoint }));
        }
        return point;
      });
      this.currentFileSubject.next(new FileDto(__spreadProps(__spreadValues({}, currentFile), { points: updatedPoints })));
    }
  }
  updateAssociatedLotoPoint(updatedLotoPoint) {
    this.associatedLotoPointsSubject.next(this.associatedLotoPointsSubject.getValue().map((point) => point.id === updatedLotoPoint.id ? updatedLotoPoint : point));
    const updateEquipmentList = (equipmentList) => {
      return equipmentList.map((equipment) => {
        if (equipment.lotoPoints?.some((lp) => lp.id === updatedLotoPoint.id)) {
          return new EquipmentDto(__spreadProps(__spreadValues({}, equipment), {
            lotoPoints: equipment.lotoPoints.map((lp) => lp.id === updatedLotoPoint.id ? updatedLotoPoint : lp)
          }));
        }
        return equipment;
      });
    };
    this.elementsSubject.next(updateEquipmentList(this.elementsSubject.getValue()));
    this.elementsToRenderSubject.next(updateEquipmentList(this.elementsToRenderSubject.getValue()));
    const currentFile = this.currentFileSubject.getValue();
    if (currentFile && currentFile.points) {
      const updatedPoints = updateEquipmentList(currentFile.points);
      this.currentFileSubject.next(new FileDto(__spreadProps(__spreadValues({}, currentFile), { points: updatedPoints })));
    }
  }
  updateEquipmentInList(updatedEquipment) {
    const currentFileId = this.currentFileSubject.getValue()?.id;
    const equipmentFileId = updatedEquipment.mainFileId || updatedEquipment.mainFileObject?.id;
    if (currentFileId && equipmentFileId !== currentFileId) {
      return;
    }
    const updateOrAddEquipment = (equipmentList) => {
      const existingIndex = equipmentList.findIndex((item) => item.id === updatedEquipment.id);
      if (existingIndex >= 0) {
        return equipmentList.map((item) => item.id === updatedEquipment.id ? updatedEquipment : item);
      } else {
        return [...equipmentList, updatedEquipment];
      }
    };
    const currentElements = this.elementsSubject.getValue();
    this.elementsSubject.next(updateOrAddEquipment(currentElements));
    const currentToRender = this.elementsToRenderSubject.getValue();
    this.elementsToRenderSubject.next(updateOrAddEquipment(currentToRender));
    const currentFile = this.currentFileSubject.getValue();
    if (currentFile && currentFile.points) {
      const updatedPoints = updateOrAddEquipment(currentFile.points);
      this.currentFileSubject.next(new FileDto(__spreadProps(__spreadValues({}, currentFile), { points: updatedPoints })));
    }
  }
  updateRenderedEquipment(updatedEquipment) {
    const currentElements = this.elementsToRenderSubject.getValue();
    const updatedElements = currentElements.map((element) => {
      const updatedElement = updatedEquipment.find((ue) => ue.id === element.id);
      return updatedElement || element;
    });
    this.elementsToRenderSubject.next(updatedElements);
    const allElements = this.elementsSubject.getValue();
    const updatedAllElements = allElements.map((element) => {
      const updatedElement = updatedEquipment.find((ue) => ue.id === element.id);
      return updatedElement || element;
    });
    this.elementsSubject.next(updatedAllElements);
    const currentFile = this.currentFileSubject.getValue();
    if (currentFile && currentFile.points) {
      const updatedPoints = currentFile.points.map((point) => {
        const updatedPoint = updatedEquipment.find((ue) => ue.id === point.id);
        return updatedPoint || point;
      });
      this.currentFileSubject.next(new FileDto(__spreadProps(__spreadValues({}, currentFile), { points: updatedPoints })));
    }
    const currentLotoPoints = this.associatedLotoPointsSubject.getValue();
    const updatedLotoPoints = currentLotoPoints.map((lotoPoint) => {
      const updatedEquipmentWithLotoPoint = updatedEquipment.find((ue) => ue.lotoPoints && ue.lotoPoints.some((lp) => lp.id === lotoPoint.id));
      if (updatedEquipmentWithLotoPoint) {
        return updatedEquipmentWithLotoPoint.lotoPoints.find((lp) => lp.id === lotoPoint.id) || lotoPoint;
      }
      return lotoPoint;
    });
    this.associatedLotoPointsSubject.next(updatedLotoPoints);
  }
  filterByEquipmentType(exclude) {
    const currentElements = this.elementsSubject.getValue();
    return currentElements.filter((element) => {
      if (!element)
        return false;
      if (!element.eqType || !element.eqType.name)
        return true;
      return !exclude.includes(element.eqType.name.toLowerCase());
    });
  }
  // Public method for components to call
  updateElementsToRender(excludeTypes) {
    const filteredElements = this.filterByEquipmentType(excludeTypes);
    this.elementsToRenderSubject.next(filteredElements);
  }
  getUniqueEqTypes() {
    const elements = this.elementsSubject.getValue();
    const uniqueEqTypes = new Set(elements.map((el) => {
      if (!el || !el.eqType || !el.eqType.name) {
        return "Unknown";
      }
      return el.eqType.name;
    }));
    return Array.from(uniqueEqTypes);
  }
  switchFileFormat(extension) {
    const currentFile = this.currentFileSubject.getValue();
    if (!currentFile)
      return;
    if (!currentFile.extensions.includes(extension))
      return;
    const currentExtension = currentFile.fileLink.split(".").pop() || "";
    const newFile = new FileDto(__spreadProps(__spreadValues({}, currentFile), {
      extension,
      fileLink: this.updateFileLink(currentFile.fileLink, currentExtension, extension)
    }));
    this.currentFileSubject.next(newFile);
  }
  updateFileLink(fileLink, oldExtension, newExtension) {
    if (!fileLink.endsWith(oldExtension)) {
      console.warn("Current file link does not end with the expected extension");
      return fileLink;
    }
    return fileLink.replaceAll(oldExtension, newExtension);
  }
  static \u0275fac = function CurrentFileService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _CurrentFileService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _CurrentFileService, factory: _CurrentFileService.\u0275fac, providedIn: "root" });
};

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
var _forTrack04 = ($index, $item) => $item.id;
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
    \u0275\u0275repeaterCreate(1, SymbolPaletteComponent_For_2_Conditional_6_For_2_Template, 5, 5, "div", 8, _forTrack04);
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
      \u0275\u0275repeaterCreate(1, SymbolPaletteComponent_For_2_Template, 7, 6, "div", 1, _forTrack04);
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

// src/app/shared/image/refactored/unified-toolbar/unified-toolbar.component.ts
var _forTrack05 = ($index, $item) => $item.id;
function UnifiedToolbarComponent_Conditional_2_For_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 4);
    \u0275\u0275listener("click", function UnifiedToolbarComponent_Conditional_2_For_2_Template_button_click_0_listener() {
      const tool_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.onToolClick(tool_r2.id));
    });
    \u0275\u0275elementStart(1, "span", 5);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "span", 6);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const tool_r2 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275classProp("active", ctx_r2.isToolActive(tool_r2.id));
    \u0275\u0275property("title", tool_r2.tooltip);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(tool_r2.icon);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(tool_r2.label);
  }
}
function UnifiedToolbarComponent_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 2);
    \u0275\u0275repeaterCreate(1, UnifiedToolbarComponent_Conditional_2_For_2_Template, 5, 5, "button", 3, _forTrack05);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r2.toolGroups().drawing);
  }
}
function UnifiedToolbarComponent_Conditional_3_For_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 4);
    \u0275\u0275listener("click", function UnifiedToolbarComponent_Conditional_3_For_3_Template_button_click_0_listener() {
      const tool_r5 = \u0275\u0275restoreView(_r4).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.onToolClick(tool_r5.id));
    });
    \u0275\u0275elementStart(1, "span", 5);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "span", 6);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const tool_r5 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275classProp("active", ctx_r2.isToolActive(tool_r5.id));
    \u0275\u0275property("title", tool_r5.tooltip);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(tool_r5.icon);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(tool_r5.label);
  }
}
function UnifiedToolbarComponent_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div", 7);
    \u0275\u0275elementStart(1, "div", 2);
    \u0275\u0275repeaterCreate(2, UnifiedToolbarComponent_Conditional_3_For_3_Template, 5, 5, "button", 3, _forTrack05);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275repeater(ctx_r2.toolGroups().shapeOps);
  }
}
function UnifiedToolbarComponent_Conditional_4_For_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 4);
    \u0275\u0275listener("click", function UnifiedToolbarComponent_Conditional_4_For_3_Template_button_click_0_listener() {
      const tool_r7 = \u0275\u0275restoreView(_r6).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.onToolClick(tool_r7.id));
    });
    \u0275\u0275elementStart(1, "span", 5);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "span", 6);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const tool_r7 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275classProp("active", ctx_r2.isToolActive(tool_r7.id));
    \u0275\u0275property("title", tool_r7.tooltip);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(tool_r7.icon);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(tool_r7.label);
  }
}
function UnifiedToolbarComponent_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div", 7);
    \u0275\u0275elementStart(1, "div", 2);
    \u0275\u0275repeaterCreate(2, UnifiedToolbarComponent_Conditional_4_For_3_Template, 5, 5, "button", 3, _forTrack05);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275repeater(ctx_r2.toolGroups().view);
  }
}
function UnifiedToolbarComponent_Conditional_5_For_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r8 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 4);
    \u0275\u0275listener("click", function UnifiedToolbarComponent_Conditional_5_For_3_Template_button_click_0_listener() {
      const tool_r9 = \u0275\u0275restoreView(_r8).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.onToolClick(tool_r9.id));
    });
    \u0275\u0275elementStart(1, "span", 5);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "span", 6);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const tool_r9 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275classProp("active", tool_r9.id === "toggle-symbols" && ctx_r2.showSymbolPalette());
    \u0275\u0275property("title", tool_r9.tooltip);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(tool_r9.icon);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(tool_r9.label);
  }
}
function UnifiedToolbarComponent_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div", 7);
    \u0275\u0275elementStart(1, "div", 2);
    \u0275\u0275repeaterCreate(2, UnifiedToolbarComponent_Conditional_5_For_3_Template, 5, 5, "button", 3, _forTrack05);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275repeater(ctx_r2.toolGroups().editing);
  }
}
var UnifiedToolbarComponent = class _UnifiedToolbarComponent {
  // Inputs
  enabledTools = input([]);
  activeTool = input(null);
  position = input("top");
  showSymbolPalette = input(false);
  // Outputs
  toolClicked = output();
  symbolPaletteToggled = output();
  // Toolbar tool definitions with icons and keyboard shortcuts
  allTools = [
    // Drawing Tools
    {
      id: "select",
      label: "Select",
      icon: "\u{1F5B1}\uFE0F",
      tooltip: "Select and manipulate shapes\nKeyboard: V or Esc",
      group: "drawing"
    },
    {
      id: "draw-rectangle",
      label: "Rectangle",
      icon: "\u25AD",
      tooltip: "Draw rectangle\nKeyboard: R\nRight-click to draw",
      group: "drawing"
    },
    {
      id: "place-symbol",
      label: "Symbol",
      icon: "\u2B50",
      tooltip: "Place symbol from palette\nKeyboard: S\nRight-click to place",
      group: "drawing"
    },
    // Shape Operations
    {
      id: "delete",
      label: "Delete",
      icon: "\u{1F5D1}\uFE0F",
      tooltip: "Delete selected shapes\nKeyboard: Delete or Backspace",
      group: "shape-ops"
    },
    {
      id: "duplicate",
      label: "Duplicate",
      icon: "\u{1F4CB}",
      tooltip: "Duplicate selected shapes\nKeyboard: Ctrl+D\n\nTip: Use Ctrl+C, Ctrl+V for copy/paste",
      group: "shape-ops"
    },
    {
      id: "bring-to-front",
      label: "To Front",
      icon: "\u2B06\uFE0F",
      tooltip: "Bring selected shape to front\nKeyboard: Ctrl+]",
      group: "shape-ops"
    },
    {
      id: "send-to-back",
      label: "To Back",
      icon: "\u2B07\uFE0F",
      tooltip: "Send selected shape to back\nKeyboard: Ctrl+[",
      group: "shape-ops"
    },
    // View Tools
    {
      id: "zoom-in",
      label: "Zoom In",
      icon: "\u{1F50D}+",
      tooltip: "Zoom in\nKeyboard: + or =\nMouse: Scroll up",
      group: "view"
    },
    {
      id: "zoom-out",
      label: "Zoom Out",
      icon: "\u{1F50D}\u2212",
      tooltip: "Zoom out\nKeyboard: - or _\nMouse: Scroll down",
      group: "view"
    },
    {
      id: "zoom-fit",
      label: "Fit",
      icon: "\u26F6",
      tooltip: "Fit to screen\nKeyboard: F or 0",
      group: "view"
    },
    {
      id: "reset-view",
      label: "Reset",
      icon: "\u21BA",
      tooltip: "Reset zoom and pan\nKeyboard: Ctrl+0",
      group: "view"
    },
    {
      id: "toggle-symbols",
      label: "Symbols",
      icon: "\u{1F4DA}",
      tooltip: "Toggle symbol palette\nKeyboard: P",
      group: "editing"
    }
  ];
  // Computed: filter tools based on enabled list
  visibleTools = computed(() => {
    const enabled = this.enabledTools();
    if (!enabled || enabled.length === 0) {
      return this.allTools;
    }
    return this.allTools.filter((tool) => enabled.includes(tool.id));
  });
  // Group tools for organized display
  toolGroups = computed(() => {
    const tools = this.visibleTools();
    return {
      drawing: tools.filter((t) => t.group === "drawing"),
      shapeOps: tools.filter((t) => t.group === "shape-ops"),
      view: tools.filter((t) => t.group === "view"),
      editing: tools.filter((t) => t.group === "editing")
    };
  });
  onToolClick(toolId) {
    if (toolId === "toggle-symbols") {
      this.symbolPaletteToggled.emit();
    } else {
      this.toolClicked.emit(toolId);
    }
  }
  isToolActive(toolId) {
    return this.activeTool() === toolId;
  }
  static \u0275fac = function UnifiedToolbarComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _UnifiedToolbarComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _UnifiedToolbarComponent, selectors: [["app-unified-toolbar"]], inputs: { enabledTools: [1, "enabledTools"], activeTool: [1, "activeTool"], position: [1, "position"], showSymbolPalette: [1, "showSymbolPalette"] }, outputs: { toolClicked: "toolClicked", symbolPaletteToggled: "symbolPaletteToggled" }, decls: 6, vars: 6, consts: [[1, "unified-toolbar"], [1, "toolbar-content"], [1, "tool-group"], ["type", "button", 1, "tool-button", 3, "active", "title"], ["type", "button", 1, "tool-button", 3, "click", "title"], [1, "tool-icon"], [1, "tool-label"], [1, "tool-separator"]], template: function UnifiedToolbarComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "div", 1);
      \u0275\u0275template(2, UnifiedToolbarComponent_Conditional_2_Template, 3, 0, "div", 2)(3, UnifiedToolbarComponent_Conditional_3_Template, 4, 0)(4, UnifiedToolbarComponent_Conditional_4_Template, 4, 0)(5, UnifiedToolbarComponent_Conditional_5_Template, 4, 0);
      \u0275\u0275elementEnd()();
    }
    if (rf & 2) {
      \u0275\u0275classMap("toolbar-" + ctx.position());
      \u0275\u0275advance(2);
      \u0275\u0275conditional(ctx.toolGroups().drawing.length > 0 ? 2 : -1);
      \u0275\u0275advance();
      \u0275\u0275conditional(ctx.toolGroups().shapeOps.length > 0 ? 3 : -1);
      \u0275\u0275advance();
      \u0275\u0275conditional(ctx.toolGroups().view.length > 0 ? 4 : -1);
      \u0275\u0275advance();
      \u0275\u0275conditional(ctx.toolGroups().editing.length > 0 ? 5 : -1);
    }
  }, dependencies: [CommonModule], styles: ["\n\n.unified-toolbar[_ngcontent-%COMP%] {\n  display: flex;\n  background: var(--surface-color, #ffffff);\n  border: 1px solid var(--border-color, #e0e0e0);\n  border-radius: 8px;\n  padding: 8px;\n  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);\n  z-index: 100;\n  -webkit-user-select: none;\n  user-select: none;\n}\n.toolbar-top[_ngcontent-%COMP%], \n.toolbar-bottom[_ngcontent-%COMP%] {\n  flex-direction: row;\n}\n.toolbar-left[_ngcontent-%COMP%], \n.toolbar-right[_ngcontent-%COMP%] {\n  flex-direction: column;\n}\n.toolbar-content[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 4px;\n  align-items: center;\n  flex-wrap: wrap;\n}\n.tool-group[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 4px;\n  align-items: center;\n}\n.tool-separator[_ngcontent-%COMP%] {\n  width: 1px;\n  height: 32px;\n  background: var(--border-color, #e0e0e0);\n  margin: 0 4px;\n}\n.tool-button[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  gap: 2px;\n  padding: 6px 10px;\n  min-width: 60px;\n  background: transparent;\n  border: 1px solid transparent;\n  border-radius: 6px;\n  cursor: pointer;\n  transition: all 0.2s ease;\n  font-family: inherit;\n  color: var(--text-color, #333);\n}\n.tool-button[_ngcontent-%COMP%]:hover {\n  background: var(--hover-bg, #f5f5f5);\n  border-color: var(--hover-border, #d0d0d0);\n}\n.tool-button[_ngcontent-%COMP%]:active {\n  background: var(--active-bg, #e8e8e8);\n  transform: translateY(1px);\n}\n.tool-button.active[_ngcontent-%COMP%] {\n  background: var(--primary-color, #007bff);\n  color: white;\n  border-color: var(--primary-color, #007bff);\n  box-shadow: 0 2px 4px rgba(0, 123, 255, 0.3);\n}\n.tool-button.active[_ngcontent-%COMP%]:hover {\n  background: var(--primary-hover, #0056b3);\n  border-color: var(--primary-hover, #0056b3);\n}\n.tool-button[_ngcontent-%COMP%]:disabled {\n  opacity: 0.5;\n  cursor: not-allowed;\n  background: transparent;\n}\n.tool-button[_ngcontent-%COMP%]:disabled:hover {\n  background: transparent;\n  border-color: transparent;\n  transform: none;\n}\n.tool-icon[_ngcontent-%COMP%] {\n  font-size: 18px;\n  line-height: 1;\n}\n.tool-label[_ngcontent-%COMP%] {\n  font-size: 11px;\n  font-weight: 500;\n  white-space: nowrap;\n}\n@media (max-width: 768px) {\n  .tool-button[_ngcontent-%COMP%] {\n    min-width: 44px;\n    padding: 8px;\n  }\n  .tool-label[_ngcontent-%COMP%] {\n    display: none;\n  }\n  .tool-icon[_ngcontent-%COMP%] {\n    font-size: 20px;\n  }\n}\n@media (prefers-color-scheme: dark) {\n  .unified-toolbar[_ngcontent-%COMP%] {\n    background: var(--surface-color, #2a2a2a);\n    border-color: var(--border-color, #444);\n    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);\n  }\n  .tool-button[_ngcontent-%COMP%] {\n    color: var(--text-color, #e0e0e0);\n  }\n  .tool-button[_ngcontent-%COMP%]:hover {\n    background: var(--hover-bg, #3a3a3a);\n    border-color: var(--hover-border, #555);\n  }\n  .tool-button[_ngcontent-%COMP%]:active {\n    background: var(--active-bg, #444);\n  }\n  .tool-separator[_ngcontent-%COMP%] {\n    background: var(--border-color, #555);\n  }\n}\n.unified-toolbar.compact[_ngcontent-%COMP%]   .tool-button[_ngcontent-%COMP%] {\n  min-width: 40px;\n  padding: 6px;\n}\n.unified-toolbar.compact[_ngcontent-%COMP%]   .tool-label[_ngcontent-%COMP%] {\n  display: none;\n}\n.unified-toolbar.compact[_ngcontent-%COMP%]   .tool-icon[_ngcontent-%COMP%] {\n  font-size: 20px;\n}\n/*# sourceMappingURL=unified-toolbar.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(UnifiedToolbarComponent, { className: "UnifiedToolbarComponent", filePath: "src/app/shared/image/refactored/unified-toolbar/unified-toolbar.component.ts", lineNumber: 21 });
})();

// src/app/shared/menu/context-menu/context-menu.component.ts
var _c03 = ["menuContainer"];
function ContextMenuComponent_div_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 3);
    \u0275\u0275listener("contextmenu", function ContextMenuComponent_div_0_Template_div_contextmenu_0_listener($event) {
      \u0275\u0275restoreView(_r1);
      $event.preventDefault();
      $event.stopPropagation();
      return \u0275\u0275resetView(false);
    });
    \u0275\u0275elementEnd();
  }
}
function ContextMenuComponent_div_1_ng_container_3_button_1_span_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 12);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const action_r4 = \u0275\u0275nextContext(2).$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", action_r4.icon, " ");
  }
}
function ContextMenuComponent_div_1_ng_container_3_button_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 9);
    \u0275\u0275listener("click", function ContextMenuComponent_div_1_ng_container_3_button_1_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r3);
      const action_r4 = \u0275\u0275nextContext().$implicit;
      const ctx_r4 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r4.onActionClick(action_r4));
    })("contextmenu", function ContextMenuComponent_div_1_ng_container_3_button_1_Template_button_contextmenu_0_listener($event) {
      \u0275\u0275restoreView(_r3);
      $event.preventDefault();
      $event.stopPropagation();
      return \u0275\u0275resetView(false);
    });
    \u0275\u0275template(1, ContextMenuComponent_div_1_ng_container_3_button_1_span_1_Template, 2, 1, "span", 10);
    \u0275\u0275elementStart(2, "span", 11);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const action_r4 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275classProp("disabled", action_r4.disabled);
    \u0275\u0275property("disabled", action_r4.disabled);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", action_r4.icon);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(action_r4.label);
  }
}
function ContextMenuComponent_div_1_ng_container_3_div_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div", 13);
  }
}
function ContextMenuComponent_div_1_ng_container_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, ContextMenuComponent_div_1_ng_container_3_button_1_Template, 4, 5, "button", 7)(2, ContextMenuComponent_div_1_ng_container_3_div_2_Template, 1, 0, "div", 8);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const action_r4 = ctx.$implicit;
    const last_r6 = ctx.last;
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !action_r4.divider);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", action_r4.divider && !last_r6);
  }
}
function ContextMenuComponent_div_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 4, 0);
    \u0275\u0275listener("contextmenu", function ContextMenuComponent_div_1_Template_div_contextmenu_0_listener($event) {
      \u0275\u0275restoreView(_r2);
      $event.preventDefault();
      $event.stopPropagation();
      return \u0275\u0275resetView(false);
    });
    \u0275\u0275elementStart(2, "div", 5);
    \u0275\u0275template(3, ContextMenuComponent_div_1_ng_container_3_Template, 3, 2, "ng-container", 6);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r4 = \u0275\u0275nextContext();
    \u0275\u0275styleProp("left", ctx_r4.position().x, "px")("top", ctx_r4.position().y, "px");
    \u0275\u0275advance(3);
    \u0275\u0275property("ngForOf", ctx_r4.actions());
  }
}
var ContextMenuComponent = class _ContextMenuComponent {
  menuContainer;
  destroyRef = inject(DestroyRef);
  platformId = inject(PLATFORM_ID);
  selectedItem = input(null);
  isVisible = input(false);
  position = input({ x: 0, y: 0 });
  actions = input([]);
  actionSelected = output();
  closeMenu = output();
  positionAdjusted = output();
  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      fromEvent(document, "mousedown").pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
        if (!this.isVisible())
          return;
        if (this.menuContainer && !this.menuContainer.nativeElement.contains(event.target)) {
          this.closeMenu.emit();
        }
      });
    }
    effect(() => {
      if (this.isVisible()) {
        setTimeout(() => this.adjustPositionIfNeeded(), 0);
      }
    });
  }
  ngAfterViewInit() {
    this.adjustPositionIfNeeded();
  }
  adjustPositionIfNeeded() {
    if (!this.menuContainer)
      return;
    const menu = this.menuContainer.nativeElement;
    const rect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const padding = 10;
    let adjustedX = this.position().x;
    let adjustedY = this.position().y;
    if (rect.right + padding > viewportWidth) {
      adjustedX = viewportWidth - rect.width - padding;
    }
    if (rect.bottom + padding > viewportHeight) {
      adjustedY = viewportHeight - rect.height - padding;
    }
    adjustedX = Math.max(padding, adjustedX);
    adjustedY = Math.max(padding, adjustedY);
    if (adjustedX !== this.position().x || adjustedY !== this.position().y) {
      this.positionAdjusted.emit({ x: adjustedX, y: adjustedY });
      menu.style.left = `${adjustedX}px`;
      menu.style.top = `${adjustedY}px`;
    }
  }
  onActionClick(action) {
    const item = this.selectedItem();
    if (item && !action.disabled) {
      action.action(item);
      this.actionSelected.emit({ action, item });
      this.closeMenu.emit();
    }
  }
  static \u0275fac = function ContextMenuComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _ContextMenuComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ContextMenuComponent, selectors: [["app-context-menu"]], viewQuery: function ContextMenuComponent_Query(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275viewQuery(_c03, 5);
    }
    if (rf & 2) {
      let _t;
      \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.menuContainer = _t.first);
    }
  }, inputs: { selectedItem: [1, "selectedItem"], isVisible: [1, "isVisible"], position: [1, "position"], actions: [1, "actions"] }, outputs: { actionSelected: "actionSelected", closeMenu: "closeMenu", positionAdjusted: "positionAdjusted" }, decls: 2, vars: 2, consts: [["menuContainer", ""], ["class", "context-menu-backdrop", 3, "contextmenu", 4, "ngIf"], ["class", "context-menu", 3, "left", "top", "contextmenu", 4, "ngIf"], [1, "context-menu-backdrop", 3, "contextmenu"], [1, "context-menu", 3, "contextmenu"], [1, "context-menu-content"], [4, "ngFor", "ngForOf"], ["class", "context-menu-item", "type", "button", 3, "disabled", "click", "contextmenu", 4, "ngIf"], ["class", "context-menu-divider", 4, "ngIf"], ["type", "button", 1, "context-menu-item", 3, "click", "contextmenu", "disabled"], ["class", "context-menu-icon", 4, "ngIf"], [1, "context-menu-label"], [1, "context-menu-icon"], [1, "context-menu-divider"]], template: function ContextMenuComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275template(0, ContextMenuComponent_div_0_Template, 1, 0, "div", 1)(1, ContextMenuComponent_div_1_Template, 4, 5, "div", 2);
    }
    if (rf & 2) {
      \u0275\u0275property("ngIf", ctx.isVisible());
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", ctx.isVisible());
    }
  }, dependencies: [CommonModule, NgForOf, NgIf], styles: ["\n\n.context-menu-backdrop[_ngcontent-%COMP%] {\n  position: fixed;\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  z-index: 10001;\n  pointer-events: none;\n}\n.context-menu[_ngcontent-%COMP%] {\n  position: fixed;\n  background: var(--primary-background);\n  border: 1px solid var(--border-color);\n  border-radius: 4px;\n  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);\n  z-index: 10002;\n  min-width: 200px;\n  overflow: hidden;\n}\n.context-menu-content[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n}\n.context-menu-item[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  padding: 8px 16px;\n  background: none;\n  border: none;\n  cursor: pointer;\n  font-size: 14px;\n  color: var(--primary-text);\n  text-align: left;\n  transition: background-color 0.2s ease;\n  white-space: nowrap;\n}\n.context-menu-item[_ngcontent-%COMP%]:hover:not(.disabled) {\n  background-color: var(--hover-color);\n}\n.context-menu-item.disabled[_ngcontent-%COMP%] {\n  color: var(--secondary-text);\n  cursor: not-allowed;\n  opacity: 0.6;\n}\n.context-menu-icon[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 20px;\n  height: 20px;\n  font-size: 16px;\n}\n.context-menu-label[_ngcontent-%COMP%] {\n  flex: 1;\n}\n.context-menu-divider[_ngcontent-%COMP%] {\n  height: 1px;\n  background-color: var(--border-color);\n  margin: 4px 0;\n}\n/*# sourceMappingURL=context-menu.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ContextMenuComponent, { className: "ContextMenuComponent", filePath: "src/app/shared/menu/context-menu/context-menu.component.ts", lineNumber: 23 });
})();

// src/app/shared/image/refactored/services/mouse-events.service.ts
var MouseEventsService = class _MouseEventsService {
  DOUBLE_CLICK_DELAY = 250;
  // ms
  classify(source$) {
    return source$.pipe(groupBy((event) => event.button), mergeMap((group$) => {
      if (group$.key === 1) {
        return group$.pipe(map((event) => ({ type: "middle", event })));
      }
      if (group$.key === 2) {
        return group$.pipe(map((event) => ({ type: "right", event })));
      }
      return group$.pipe(
        buffer(group$.pipe(debounceTime(this.DOUBLE_CLICK_DELAY))),
        filter((events) => events.length > 0),
        // Ensure we don't process empty buffers
        map((events) => ({
          type: events.length === 1 ? "single" : "double",
          event: events[0]
          // Safely get the first event from the buffered array
        }))
      );
    }));
  }
  // A more robust implementation for left clicks
  classifyClicks(mousedown$) {
    const clicks$ = mousedown$.pipe(groupBy((event) => event.button), mergeMap((group) => {
      const button = group.key;
      switch (button) {
        case 0:
          return group.pipe(buffer(group.pipe(debounceTime(this.DOUBLE_CLICK_DELAY))), map((events) => ({
            type: events.length === 1 ? "single" : "double",
            event: events[0]
          })));
        case 1:
          return group.pipe(map((event) => ({ type: "middle", event })));
        case 2:
          return group.pipe(map((event) => ({ type: "right", event })));
        default:
          return new Observable();
      }
    }));
    return clicks$;
  }
  static \u0275fac = function MouseEventsService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _MouseEventsService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _MouseEventsService, factory: _MouseEventsService.\u0275fac, providedIn: "root" });
};

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

// src/app/shared/image/refactored/services/canvas-render.service.ts
var CanvasRenderService = class _CanvasRenderService {
  HANDLE_SIZE = 8;
  SELECTED_LINE_WIDTH = 3;
  DEFAULT_LINE_WIDTH = 1;
  // Cache for loaded images to avoid reloading
  imageCache = /* @__PURE__ */ new Map();
  drawShapes(canvas, shapes, scale, hoveredShapeId, currentImageWidth, currentImageHeight, highlightedShapeIds) {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("Unable to get 2D context from canvas");
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    shapes.forEach((shape) => this.drawShape(ctx, shape, scale, hoveredShapeId, currentImageWidth, currentImageHeight, highlightedShapeIds));
  }
  drawShape(ctx, shape, scale, hoveredShapeId, currentImageWidth, currentImageHeight, highlightedShapeIds) {
    const isHovered = hoveredShapeId !== null && hoveredShapeId !== void 0 && shape.id === hoveredShapeId;
    const isHighlighted = highlightedShapeIds && shape.id !== void 0 && highlightedShapeIds.includes(shape.id);
    ctx.strokeStyle = isHighlighted ? "#4caf50" : isHovered ? "#ff6600" : shape.color;
    ctx.fillStyle = shape.color;
    ctx.lineWidth = shape.isSelected ? this.SELECTED_LINE_WIDTH : isHovered || isHighlighted ? 4 : this.DEFAULT_LINE_WIDTH;
    if ((isHovered || isHighlighted) && (shape.type === "rectangle" || shape.type === "image" || shape.type === "svg-symbol")) {
      this.drawHoverHighlight(ctx, shape, scale, currentImageWidth, currentImageHeight, isHighlighted);
    }
    const scaledShape = this.scaleShape(shape, scale, currentImageWidth, currentImageHeight);
    switch (scaledShape.type) {
      case "rectangle":
        this.drawRectangle(ctx, scaledShape, shape, scale);
        break;
      case "image":
        this.drawImage(ctx, scaledShape, shape, scale);
        break;
      case "circle":
        this.drawCircle(ctx, scaledShape, scale);
        break;
      case "line":
        this.drawLine(ctx, scaledShape, scale);
        break;
      case "text":
        this.drawText(ctx, scaledShape, scale);
        break;
      case "svg-symbol":
        this.drawSVGSymbol(ctx, scaledShape, scale);
        break;
    }
  }
  drawSVGSymbol(ctx, symbol, scale) {
    ctx.save();
    ctx.translate(symbol.x, symbol.y);
    if (symbol.rotation) {
      ctx.translate(symbol.width / 2, symbol.height / 2);
      ctx.rotate(symbol.rotation * Math.PI / 180);
      ctx.translate(-symbol.width / 2, -symbol.height / 2);
    }
    const scaleX = symbol.width / symbol.originalWidth;
    const scaleY = symbol.height / symbol.originalHeight;
    ctx.scale(scaleX, scaleY);
    const path = new Path2D(symbol.svgPath);
    ctx.stroke(path);
    ctx.restore();
    if (symbol.isSelected) {
      const boundingBox = __spreadProps(__spreadValues({}, symbol), {
        type: "rectangle"
      });
      this.drawSelectionHandles(ctx, boundingBox);
    }
  }
  drawRectangle(ctx, rect, originalShape, scale) {
    ctx.save();
    if (rect.rotation) {
      const centerX = rect.x + rect.width / 2;
      const centerY = rect.y + rect.height / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate(rect.rotation * Math.PI / 180);
      ctx.translate(-centerX, -centerY);
    }
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    ctx.restore();
    if (originalShape.isBulkSelected) {
      this.drawSelectionHandles(ctx, rect, "orange");
    }
    if (originalShape.isSelected) {
      this.drawSelectionHandles(ctx, rect);
    }
  }
  // Add new method to draw image shapes
  drawImage(ctx, imageShape, originalShape, scale) {
    const imageSource = imageShape.imageData || imageShape.imageUrl;
    let img = this.imageCache.get(imageSource);
    if (!img) {
      img = new Image();
      img.src = imageSource;
      this.imageCache.set(imageSource, img);
    }
    if (img.complete && img.naturalWidth > 0) {
      ctx.save();
      if (imageShape.rotation) {
        const centerX = imageShape.x + imageShape.width / 2;
        const centerY = imageShape.y + imageShape.height / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate(imageShape.rotation * Math.PI / 180);
        ctx.translate(-centerX, -centerY);
      }
      ctx.drawImage(img, imageShape.x, imageShape.y, imageShape.width, imageShape.height);
      ctx.strokeStyle = imageShape.color;
      ctx.lineWidth = 1;
      ctx.strokeRect(imageShape.x, imageShape.y, imageShape.width, imageShape.height);
      ctx.restore();
      if (originalShape.isBulkSelected) {
        this.drawSelectionHandles(ctx, imageShape, "orange");
      }
      if (originalShape.isSelected) {
        this.drawSelectionHandles(ctx, imageShape);
      }
    } else {
      this.drawImagePlaceholder(ctx, imageShape);
      img.onload = () => {
        ctx.save();
        if (imageShape.rotation) {
          const centerX = imageShape.x + imageShape.width / 2;
          const centerY = imageShape.y + imageShape.height / 2;
          ctx.translate(centerX, centerY);
          ctx.rotate(imageShape.rotation * Math.PI / 180);
          ctx.translate(-centerX, -centerY);
        }
        ctx.drawImage(img, imageShape.x, imageShape.y, imageShape.width, imageShape.height);
        ctx.strokeStyle = imageShape.color;
        ctx.lineWidth = 1;
        ctx.strokeRect(imageShape.x, imageShape.y, imageShape.width, imageShape.height);
        ctx.restore();
        if (originalShape.isBulkSelected) {
          this.drawSelectionHandles(ctx, imageShape, "orange");
        }
        if (originalShape.isSelected) {
          this.drawSelectionHandles(ctx, imageShape);
        }
      };
    }
  }
  // Helper method to draw placeholder while image loads
  drawImagePlaceholder(ctx, imageShape) {
    ctx.fillStyle = "#e0e0e0";
    ctx.fillRect(imageShape.x, imageShape.y, imageShape.width, imageShape.height);
    ctx.strokeStyle = imageShape.color;
    ctx.lineWidth = 1;
    ctx.strokeRect(imageShape.x, imageShape.y, imageShape.width, imageShape.height);
    ctx.fillStyle = "#666";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Loading...", imageShape.x + imageShape.width / 2, imageShape.y + imageShape.height / 2);
  }
  drawCircle(ctx, circle, scale) {
    ctx.beginPath();
    ctx.arc(circle.x, circle.y, circle.radius, 0, 2 * Math.PI);
    ctx.stroke();
  }
  drawLine(ctx, line, scale) {
    ctx.beginPath();
    ctx.moveTo(line.startX, line.startY);
    ctx.lineTo(line.endX, line.endY);
    ctx.stroke();
  }
  drawText(ctx, text, scale) {
    ctx.font = `${16 * scale}px Arial`;
    ctx.fillText(text.text, text.x, text.y);
  }
  /**
   * Draw a prominent highlight overlay for hovered or highlighted shapes
   * @param isHighlighted - if true, uses green color (for selected items), otherwise orange (for hover)
   */
  drawHoverHighlight(ctx, shape, scale, currentImageWidth, currentImageHeight, isHighlighted = false) {
    if (shape.type !== "rectangle" && shape.type !== "image" && shape.type !== "svg-symbol") {
      return;
    }
    const rectShape = shape;
    const { scaleX: normX, scaleY: normY } = this.getNormalizationFactor(shape, currentImageWidth, currentImageHeight);
    const x = rectShape.x * normX * scale;
    const y = rectShape.y * normY * scale;
    const width = rectShape.width * normX * scale;
    const height = rectShape.height * normY * scale;
    ctx.save();
    if (rectShape.rotation) {
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate(rectShape.rotation * Math.PI / 180);
      ctx.translate(-centerX, -centerY);
    }
    const fillColor = isHighlighted ? "rgba(76, 175, 80, 0.3)" : "rgba(255, 102, 0, 0.25)";
    const strokeColor = isHighlighted ? "#4caf50" : "#ff6600";
    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, width, height);
    ctx.shadowColor = strokeColor;
    ctx.shadowBlur = 10;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, width, height);
    ctx.restore();
  }
  /**
   * Calculates the normalization factor to convert shape coordinates from their
   * original image dimensions to current image dimensions.
   * This handles cases where shapes were created on images that were later resized.
   */
  getNormalizationFactor(shape, currentImageWidth, currentImageHeight) {
    if (currentImageWidth === void 0 || currentImageWidth === null || currentImageHeight === void 0 || currentImageHeight === null) {
      return { scaleX: 1, scaleY: 1 };
    }
    if (!shape.originalPictureWidth || shape.originalPictureWidth <= 0 || !shape.originalPictureHeight || shape.originalPictureHeight <= 0) {
      return { scaleX: 1, scaleY: 1 };
    }
    const scaleX = currentImageWidth / shape.originalPictureWidth;
    const scaleY = currentImageHeight / shape.originalPictureHeight;
    if (!isFinite(scaleX) || !isFinite(scaleY) || scaleX <= 0 || scaleY <= 0) {
      return { scaleX: 1, scaleY: 1 };
    }
    return { scaleX, scaleY };
  }
  scaleShape(shape, scale, currentImageWidth, currentImageHeight) {
    const { scaleX: normX, scaleY: normY } = this.getNormalizationFactor(shape, currentImageWidth, currentImageHeight);
    switch (shape.type) {
      case "rectangle":
        return __spreadProps(__spreadValues({}, shape), {
          x: shape.x * normX * scale,
          y: shape.y * normY * scale,
          width: shape.width * normX * scale,
          height: shape.height * normY * scale
        });
      case "image":
        return __spreadProps(__spreadValues({}, shape), {
          x: shape.x * normX * scale,
          y: shape.y * normY * scale,
          width: shape.width * normX * scale,
          height: shape.height * normY * scale
        });
      case "circle":
        const avgNorm = (normX + normY) / 2;
        return __spreadProps(__spreadValues({}, shape), {
          x: shape.x * normX * scale,
          y: shape.y * normY * scale,
          radius: shape.radius * avgNorm * scale
        });
      case "line":
        return __spreadProps(__spreadValues({}, shape), {
          startX: shape.startX * normX * scale,
          startY: shape.startY * normY * scale,
          endX: shape.endX * normX * scale,
          endY: shape.endY * normY * scale
        });
      case "text":
        return __spreadProps(__spreadValues({}, shape), {
          x: shape.x * normX * scale,
          y: shape.y * normY * scale
        });
      case "svg-symbol":
        const svgShape = shape;
        return __spreadProps(__spreadValues({}, svgShape), {
          x: svgShape.x * normX * scale,
          y: svgShape.y * normY * scale,
          width: svgShape.width * normX * scale,
          height: svgShape.height * normY * scale
        });
      default:
        return shape;
    }
  }
  // private drawSelectionHandles(
  //   ctx: CanvasRenderingContext2D,
  //   shape: Shape,
  //   color: string = 'blue'
  // ): void {
  //   ctx.fillStyle = color;
  //   const corners = this.getShapeCorners(shape);
  //   corners.forEach(([x, y]) => {
  //     ctx.fillRect(
  //       x - this.HANDLE_SIZE / 2,
  //       y - this.HANDLE_SIZE / 2,
  //       this.HANDLE_SIZE,
  //       this.HANDLE_SIZE
  //     );
  //   });
  // }
  drawSelectionHandles(ctx, shape, color = "blue") {
    ctx.save();
    if (shape.type === "rectangle" || shape.type === "image" || shape.type === "svg-symbol") {
      const rotatableShape = shape;
      const rotation = rotatableShape.rotation || 0;
      if (rotation !== 0) {
        const centerX = rotatableShape.x + rotatableShape.width / 2;
        const centerY = rotatableShape.y + rotatableShape.height / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate(rotation * Math.PI / 180);
        ctx.translate(-centerX, -centerY);
      }
    }
    ctx.fillStyle = color;
    const corners = this.getShapeCorners(shape);
    corners.forEach(([x, y]) => {
      ctx.fillRect(x - this.HANDLE_SIZE / 2, y - this.HANDLE_SIZE / 2, this.HANDLE_SIZE, this.HANDLE_SIZE);
    });
    if (shape.type === "rectangle" || shape.type === "image" || shape.type === "svg-symbol") {
      const edgeMidpoints = this.getEdgeMidpoints(shape);
      edgeMidpoints.forEach(([x, y]) => {
        ctx.fillRect(x - this.HANDLE_SIZE / 2, y - this.HANDLE_SIZE / 2, this.HANDLE_SIZE, this.HANDLE_SIZE);
      });
    }
    if (shape.isSelected && !shape.isBulkSelected && (shape.type === "rectangle" || shape.type === "image" || shape.type === "svg-symbol")) {
      const rotatableShape = shape;
      const handleOffset = 20;
      const centerX = rotatableShape.x + rotatableShape.width / 2;
      const handleX = centerX;
      const handleY = rotatableShape.y - handleOffset;
      ctx.beginPath();
      ctx.moveTo(centerX, rotatableShape.y);
      ctx.lineTo(handleX, handleY);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(handleX, handleY, this.HANDLE_SIZE / 2, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
    }
    ctx.restore();
  }
  getShapeCorners(shape) {
    switch (shape.type) {
      case "rectangle":
        const rect = shape;
        return [
          [rect.x, rect.y],
          [rect.x + rect.width, rect.y],
          [rect.x, rect.y + rect.height],
          [rect.x + rect.width, rect.y + rect.height]
        ];
      case "image":
        const img = shape;
        return [
          [img.x, img.y],
          [img.x + img.width, img.y],
          [img.x, img.y + img.height],
          [img.x + img.width, img.y + img.height]
        ];
      case "circle":
        const circle = shape;
        return [
          [circle.x - circle.radius, circle.y - circle.radius],
          [circle.x + circle.radius, circle.y - circle.radius],
          [circle.x - circle.radius, circle.y + circle.radius],
          [circle.x + circle.radius, circle.y + circle.radius]
        ];
      case "line":
        const line = shape;
        return [
          [line.startX, line.startY],
          [line.endX, line.endY]
        ];
      case "svg-symbol":
        const symbol = shape;
        return [
          [symbol.x, symbol.y],
          [symbol.x + symbol.width, symbol.y],
          [symbol.x, symbol.y + symbol.height],
          [symbol.x + symbol.width, symbol.y + symbol.height]
        ];
      default:
        return [];
    }
  }
  getEdgeMidpoints(shape) {
    switch (shape.type) {
      case "rectangle":
      case "image":
      case "svg-symbol":
        const s = shape;
        const midX = s.x + s.width / 2;
        const midY = s.y + s.height / 2;
        return [
          [midX, s.y],
          // top
          [s.x + s.width, midY],
          // right
          [midX, s.y + s.height],
          // bottom
          [s.x, midY]
          // left
        ];
      default:
        return [];
    }
  }
  updateCanvasSize(canvas, img) {
    const imgRect = img.getBoundingClientRect();
    canvas.width = imgRect.width;
    canvas.height = imgRect.height;
  }
  calculateScale(img) {
    const imgRect = img.getBoundingClientRect();
    return imgRect.width / img.naturalWidth;
  }
  calculateBaseScale(img) {
    const computedStyle = window.getComputedStyle(img);
    const width = parseFloat(computedStyle.width);
    return width / img.naturalWidth;
  }
  // Add cleanup method to clear image cache
  clearImageCache() {
    this.imageCache.forEach((img, src) => {
      if (src.startsWith("blob:")) {
        URL.revokeObjectURL(src);
      }
    });
    this.imageCache.clear();
  }
  static \u0275fac = function CanvasRenderService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _CanvasRenderService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _CanvasRenderService, factory: _CanvasRenderService.\u0275fac, providedIn: "root" });
};

// src/app/shared/image/refactored/services/drawing.service.ts
var DrawingService = class _DrawingService {
  state = {
    isDrawing: false,
    startPos: { x: 0, y: 0 },
    currentShape: null
  };
  symbolState = {
    isDrawing: false,
    startPos: { x: 0, y: 0 },
    symbol: null,
    currentWidth: 0,
    currentHeight: 0
  };
  tempCanvas = null;
  /**
   * Initialize temporary canvas for drawing preview
   */
  initializeTempCanvas(container) {
    this.tempCanvas = document.createElement("canvas");
    this.tempCanvas.style.position = "absolute";
    this.tempCanvas.style.top = "0";
    this.tempCanvas.style.left = "0";
    this.tempCanvas.style.pointerEvents = "none";
    container.appendChild(this.tempCanvas);
    return this.tempCanvas;
  }
  /**
   * Update temp canvas size to match the base image size (before transform)
   */
  updateTempCanvasSize(img, baseImageScale) {
    if (!this.tempCanvas)
      return;
    this.tempCanvas.width = img.naturalWidth * baseImageScale;
    this.tempCanvas.height = img.naturalHeight * baseImageScale;
  }
  /**
   * Convert client coordinates to natural image coordinates
   */
  clientToImageCoords(clientX, clientY, imgRect, baseImageScale, transformState) {
    const relativeX = clientX - imgRect.left;
    const relativeY = clientY - imgRect.top;
    const baseDisplayX = relativeX / transformState.scale;
    const baseDisplayY = relativeY / transformState.scale;
    const naturalX = baseDisplayX / baseImageScale;
    const naturalY = baseDisplayY / baseImageScale;
    return { x: naturalX, y: naturalY };
  }
  /**
   * Start drawing a new shape
   */
  startDrawing(clientX, clientY, imgRect, baseImageScale, transformState) {
    const { x, y } = this.clientToImageCoords(clientX, clientY, imgRect, baseImageScale, transformState);
    this.state = {
      isDrawing: true,
      startPos: { x, y },
      currentShape: null
    };
    console.log("Started drawing at:", { x, y });
  }
  /**
   * Update drawing preview as mouse moves
   */
  updateDrawing(clientX, clientY, imgRect, baseImageScale, transformState) {
    if (!this.state.isDrawing || !this.tempCanvas)
      return;
    const { x: currentX, y: currentY } = this.clientToImageCoords(clientX, clientY, imgRect, baseImageScale, transformState);
    const x = Math.min(this.state.startPos.x, currentX);
    const y = Math.min(this.state.startPos.y, currentY);
    const width = Math.abs(currentX - this.state.startPos.x);
    const height = Math.abs(currentY - this.state.startPos.y);
    this.drawPreview(x, y, width, height, baseImageScale, transformState);
  }
  /**
   * Finish drawing and return the created shape
   */
  finishDrawing(clientX, clientY, imgRect, baseImageScale, transformState, naturalWidth, naturalHeight, nextId2, minSize = 5) {
    if (!this.state.isDrawing)
      return null;
    const { x: currentX, y: currentY } = this.clientToImageCoords(clientX, clientY, imgRect, baseImageScale, transformState);
    const x = Math.min(this.state.startPos.x, currentX);
    const y = Math.min(this.state.startPos.y, currentY);
    const width = Math.abs(currentX - this.state.startPos.x);
    const height = Math.abs(currentY - this.state.startPos.y);
    this.cancelDrawing();
    if (width < minSize || height < minSize) {
      return null;
    }
    const newShape = {
      id: nextId2,
      fileId: 0,
      type: "rectangle",
      x,
      y,
      width,
      height,
      color: "#FF0000",
      originalPictureWidth: naturalWidth,
      originalPictureHeight: naturalHeight,
      originalWidth: 200,
      originalHeight: 200,
      isSelected: false,
      isBulkSelected: false,
      currentImgWidth: naturalWidth,
      currentImgHeigth: naturalHeight,
      scaleToCurrentImage: 1
    };
    console.log("Created new shape:", newShape);
    return newShape;
  }
  /**
   * Cancel current drawing operation
   */
  cancelDrawing() {
    this.state = {
      isDrawing: false,
      startPos: { x: 0, y: 0 },
      currentShape: null
    };
    this.clearPreview();
  }
  /**
   * Draw preview rectangle on temp canvas
   */
  drawPreview(x, y, width, height, baseImageScale, transformState) {
    if (!this.tempCanvas)
      return;
    const ctx = this.tempCanvas.getContext("2d");
    if (!ctx)
      return;
    ctx.clearRect(0, 0, this.tempCanvas.width, this.tempCanvas.height);
    const displayX = x * baseImageScale;
    const displayY = y * baseImageScale;
    const displayWidth = width * baseImageScale;
    const displayHeight = height * baseImageScale;
    ctx.strokeStyle = "#FF0000";
    ctx.lineWidth = 2 / transformState.scale;
    ctx.setLineDash([5 / transformState.scale, 5 / transformState.scale]);
    ctx.strokeRect(displayX, displayY, displayWidth, displayHeight);
  }
  /**
   * Clear preview canvas
   */
  clearPreview() {
    if (!this.tempCanvas)
      return;
    const ctx = this.tempCanvas.getContext("2d");
    ctx?.clearRect(0, 0, this.tempCanvas.width, this.tempCanvas.height);
  }
  /**
   * Clean up resources
   */
  cleanup() {
    if (this.tempCanvas?.parentElement) {
      this.tempCanvas.parentElement.removeChild(this.tempCanvas);
    }
    this.tempCanvas = null;
    this.cancelDrawing();
  }
  /**
   * Check if currently drawing
   */
  isDrawing() {
    return this.state.isDrawing;
  }
  /**
   * Get current drawing state (for debugging)
   */
  getState() {
    return __spreadValues({}, this.state);
  }
  // ========================= Symbol Drawing Methods =========================
  /**
   * Start drawing a symbol with drag-to-size
   */
  startDrawingSymbol(clientX, clientY, imgRect, baseImageScale, transformState, symbol) {
    const { x, y } = this.clientToImageCoords(clientX, clientY, imgRect, baseImageScale, transformState);
    this.symbolState = {
      isDrawing: true,
      startPos: { x, y },
      symbol,
      currentWidth: 0,
      currentHeight: 0
    };
    console.log("Started drawing symbol at:", { x, y, symbol: symbol.id });
  }
  /**
   * Update symbol drawing preview as mouse moves (maintains aspect ratio)
   */
  updateDrawingSymbol(clientX, clientY, imgRect, baseImageScale, transformState) {
    if (!this.symbolState.isDrawing || !this.tempCanvas || !this.symbolState.symbol)
      return;
    const { x: currentX, y: currentY } = this.clientToImageCoords(clientX, clientY, imgRect, baseImageScale, transformState);
    const symbol = this.symbolState.symbol;
    const aspectRatio = symbol.originalHeight / symbol.originalWidth;
    const dragX = Math.abs(currentX - this.symbolState.startPos.x);
    const dragY = Math.abs(currentY - this.symbolState.startPos.y);
    let width;
    let height;
    if (dragX / aspectRatio > dragY) {
      width = dragX;
      height = width * aspectRatio;
    } else {
      height = dragY;
      width = height / aspectRatio;
    }
    this.symbolState.currentWidth = width;
    this.symbolState.currentHeight = height;
    const x = this.symbolState.startPos.x;
    const y = this.symbolState.startPos.y;
    this.drawSymbolPreview(x, y, width, height, baseImageScale, transformState, symbol);
  }
  /**
   * Finish drawing symbol and return the created shape
   */
  finishDrawingSymbol(clientX, clientY, imgRect, baseImageScale, transformState, naturalWidth, naturalHeight, nextId2, minSize = 10) {
    if (!this.symbolState.isDrawing || !this.symbolState.symbol)
      return null;
    const { x: currentX, y: currentY } = this.clientToImageCoords(clientX, clientY, imgRect, baseImageScale, transformState);
    const symbol = this.symbolState.symbol;
    const aspectRatio = symbol.originalHeight / symbol.originalWidth;
    const dragX = Math.abs(currentX - this.symbolState.startPos.x);
    const dragY = Math.abs(currentY - this.symbolState.startPos.y);
    let width;
    let height;
    if (dragX / aspectRatio > dragY) {
      width = dragX;
      height = width * aspectRatio;
    } else {
      height = dragY;
      width = height / aspectRatio;
    }
    const x = this.symbolState.startPos.x;
    const y = this.symbolState.startPos.y;
    this.cancelDrawingSymbol();
    if (width < minSize || height < minSize) {
      return null;
    }
    const newSymbol = {
      id: nextId2,
      fileId: 0,
      type: "svg-symbol",
      symbolId: symbol.id,
      svgPath: symbol.svgPath,
      x,
      y,
      width,
      height,
      color: "#000000",
      rotation: 0,
      originalPictureWidth: naturalWidth,
      originalPictureHeight: naturalHeight,
      originalWidth: symbol.originalWidth,
      originalHeight: symbol.originalHeight,
      isSelected: false,
      isBulkSelected: false,
      currentImgWidth: naturalWidth,
      currentImgHeigth: naturalHeight,
      scaleToCurrentImage: 1
    };
    console.log("Created new symbol shape:", newSymbol);
    return newSymbol;
  }
  /**
   * Cancel current symbol drawing operation
   */
  cancelDrawingSymbol() {
    this.symbolState = {
      isDrawing: false,
      startPos: { x: 0, y: 0 },
      symbol: null,
      currentWidth: 0,
      currentHeight: 0
    };
    this.clearPreview();
  }
  /**
   * Check if currently drawing a symbol
   */
  isDrawingSymbol() {
    return this.symbolState.isDrawing;
  }
  /**
   * Draw symbol preview on temp canvas
   */
  drawSymbolPreview(x, y, width, height, baseImageScale, transformState, symbol) {
    if (!this.tempCanvas)
      return;
    const ctx = this.tempCanvas.getContext("2d");
    if (!ctx)
      return;
    ctx.clearRect(0, 0, this.tempCanvas.width, this.tempCanvas.height);
    const displayX = x * baseImageScale;
    const displayY = y * baseImageScale;
    const displayWidth = width * baseImageScale;
    const displayHeight = height * baseImageScale;
    ctx.strokeStyle = "#0066FF";
    ctx.lineWidth = 2 / transformState.scale;
    ctx.setLineDash([5 / transformState.scale, 5 / transformState.scale]);
    ctx.strokeRect(displayX, displayY, displayWidth, displayHeight);
    ctx.save();
    ctx.translate(displayX, displayY);
    const scaleX = displayWidth / symbol.originalWidth;
    const scaleY = displayHeight / symbol.originalHeight;
    ctx.scale(scaleX, scaleY);
    const path = new Path2D(symbol.svgPath);
    ctx.fillStyle = "rgba(0, 102, 255, 0.3)";
    ctx.fill(path);
    ctx.strokeStyle = "#0066FF";
    ctx.lineWidth = 1 / Math.min(scaleX, scaleY);
    ctx.setLineDash([]);
    ctx.stroke(path);
    ctx.restore();
  }
  static \u0275fac = function DrawingService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _DrawingService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _DrawingService, factory: _DrawingService.\u0275fac, providedIn: "root" });
};

// src/app/shared/image/refactored/services/shape-conversion.service.ts
var ShapeConversionService = class _ShapeConversionService {
  /**
   * Convert a rectangle shape to an image shape
   */
  convertRectangleToImage(rectangle, file) {
    return __async(this, null, function* () {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageData = e.target?.result;
          const img = new Image();
          img.onload = () => {
            const imageShape = __spreadProps(__spreadValues({}, rectangle), {
              type: "image",
              imageUrl: URL.createObjectURL(file),
              imageData
            });
            resolve(imageShape);
          };
          img.onerror = () => reject(new Error("Failed to load image"));
          img.src = imageData;
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });
    });
  }
  /**
   * Convert an image shape back to a rectangle shape
   */
  convertImageToRectangle(imageShape) {
    if (imageShape.imageUrl) {
      URL.revokeObjectURL(imageShape.imageUrl);
    }
    const _a = imageShape, { imageUrl, imageData, type } = _a, baseProps = __objRest(_a, ["imageUrl", "imageData", "type"]);
    return __spreadProps(__spreadValues({}, baseProps), {
      type: "rectangle",
      x: imageShape.x,
      y: imageShape.y,
      width: imageShape.width,
      height: imageShape.height
    });
  }
  /**
   * Update image for an existing image shape
   */
  updateImageForShape(imageShape, file) {
    return __async(this, null, function* () {
      if (imageShape.imageUrl) {
        URL.revokeObjectURL(imageShape.imageUrl);
      }
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageData = e.target?.result;
          const img = new Image();
          img.onload = () => {
            const updatedShape = __spreadProps(__spreadValues({}, imageShape), {
              imageUrl: URL.createObjectURL(file),
              imageData
            });
            resolve(updatedShape);
          };
          img.onerror = () => reject(new Error("Failed to load image"));
          img.src = imageData;
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });
    });
  }
  static \u0275fac = function ShapeConversionService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _ShapeConversionService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _ShapeConversionService, factory: _ShapeConversionService.\u0275fac, providedIn: "root" });
};

// src/app/shared/image/refactored/services/shape-manager.service.ts
var ShapeManagerService = class _ShapeManagerService {
  testShapes = [
    {
      id: 1,
      fileId: 1,
      type: "rectangle",
      x: 50,
      y: 50,
      width: 200,
      height: 150,
      color: "#FF0000",
      originalPictureWidth: 1920,
      originalPictureHeight: 1080,
      originalWidth: 200,
      originalHeight: 200,
      isSelected: false,
      isBulkSelected: false,
      currentImgWidth: 1920,
      currentImgHeigth: 1080,
      scaleToCurrentImage: 1
    },
    {
      id: 2,
      fileId: 1,
      type: "rectangle",
      x: 300,
      y: 200,
      width: 150,
      height: 100,
      color: "#00FF00",
      originalPictureWidth: 1920,
      originalPictureHeight: 1080,
      originalWidth: 150,
      originalHeight: 200,
      isSelected: true,
      isBulkSelected: false,
      currentImgWidth: 1920,
      currentImgHeigth: 1080,
      scaleToCurrentImage: 1
    },
    {
      id: 3,
      fileId: 1,
      type: "rectangle",
      x: 500,
      y: 100,
      width: 180,
      height: 120,
      color: "#0000FF",
      originalPictureWidth: 1920,
      originalPictureHeight: 1080,
      originalWidth: 180,
      originalHeight: 200,
      isSelected: false,
      isBulkSelected: true,
      currentImgWidth: 1920,
      currentImgHeigth: 1080,
      scaleToCurrentImage: 1
    },
    {
      id: 4,
      fileId: 1,
      type: "rectangle",
      x: 100,
      y: 300,
      width: 250,
      height: 80,
      color: "#FFA500",
      originalPictureWidth: 1920,
      originalPictureHeight: 1080,
      originalWidth: 250,
      originalHeight: 200,
      isSelected: false,
      isBulkSelected: false,
      currentImgWidth: 1920,
      currentImgHeigth: 1080,
      scaleToCurrentImage: 1
    }
  ];
  // State signals
  shapesSignal = signal(this.testShapes);
  selectedShapeIdsSignal = signal([]);
  singleSelectedShapeIdSignal = signal(null);
  // Public readonly signals
  shapes = this.shapesSignal.asReadonly();
  selectedShapeIds = this.selectedShapeIdsSignal.asReadonly();
  singleSelectedShapeId = this.singleSelectedShapeIdSignal.asReadonly();
  // Shape CRUD Operations
  addShape(shape) {
    this.shapesSignal.update((shapes) => [...shapes, shape]);
  }
  addShapes(newShapes) {
    this.shapesSignal.update((shapes) => [...shapes, ...newShapes]);
  }
  updateShape(shapeId, updates) {
    this.shapesSignal.update((shapes) => shapes.map((shape) => {
      if (shape.id !== shapeId)
        return shape;
      return __spreadValues(__spreadValues({}, shape), updates);
    }));
  }
  replaceShape(shapeId, newShape) {
    this.shapesSignal.update((shapes) => shapes.map((shape) => shape.id === shapeId ? newShape : shape));
  }
  deleteShape(shapeId) {
    this.shapesSignal.update((shapes) => shapes.filter((shape) => shape.id !== shapeId));
  }
  deleteShapes(shapeIds) {
    const idsSet = new Set(shapeIds);
    this.shapesSignal.update((shapes) => shapes.filter((shape) => !idsSet.has(shape.id)));
  }
  getShapeById(shapeId) {
    return this.shapesSignal().find((s) => s.id === shapeId);
  }
  setShapes(shapes) {
    this.selectedShapeIdsSignal.set([]);
    this.singleSelectedShapeIdSignal.set(null);
    this.shapesSignal.set(shapes);
  }
  clearShapes() {
    this.shapesSignal.set([]);
  }
  // Selection Management
  selectShape(shapeId, exclusive = true) {
    if (exclusive) {
      this.clearSelections();
      this.singleSelectedShapeIdSignal.set(shapeId);
    }
    this.selectedShapeIdsSignal.update((ids) => ids.includes(shapeId) ? ids : [...ids, shapeId]);
    this.shapesSignal.update((shapes) => shapes.map((shape) => {
      if (shape.id !== shapeId)
        return shape;
      return __spreadProps(__spreadValues({}, shape), { isSelected: true });
    }));
  }
  // Update deselectShape similarly:
  deselectShape(shapeId) {
    this.selectedShapeIdsSignal.update((ids) => ids.filter((id) => id !== shapeId));
    if (this.singleSelectedShapeIdSignal() === shapeId) {
      this.singleSelectedShapeIdSignal.set(null);
    }
    this.shapesSignal.update((shapes) => shapes.map((shape) => {
      if (shape.id !== shapeId)
        return shape;
      return __spreadProps(__spreadValues({}, shape), { isSelected: false });
    }));
  }
  // Update selectMultipleShapes:
  selectMultipleShapes(shapeIds) {
    this.clearSelections();
    this.selectedShapeIdsSignal.set([...shapeIds]);
    const idsSet = new Set(shapeIds);
    this.shapesSignal.update((shapes) => shapes.map((shape) => __spreadProps(__spreadValues({}, shape), {
      isBulkSelected: idsSet.has(shape.id)
    })));
  }
  toggleShapeSelection(shapeId) {
    console.log("Toggle shape selection", shapeId);
    const isSelected = this.selectedShapeIdsSignal().includes(shapeId);
    if (isSelected) {
      this.deselectShape(shapeId);
    } else {
      this.selectShape(shapeId, false);
    }
  }
  clearSelections() {
    this.selectedShapeIdsSignal.set([]);
    this.singleSelectedShapeIdSignal.set(null);
    this.shapesSignal.update((shapes) => shapes.map((shape) => __spreadProps(__spreadValues({}, shape), {
      isSelected: false,
      isBulkSelected: false
    })));
  }
  // Utility Methods
  getNextShapeId() {
    const shapes = this.shapesSignal();
    return shapes.length > 0 ? Math.max(...shapes.map((s) => s.id)) + 1 : 1;
  }
  getSelectedShapes() {
    const selectedIds = new Set(this.selectedShapeIdsSignal());
    return this.shapesSignal().filter((shape) => selectedIds.has(shape.id));
  }
  hasSelection() {
    return this.selectedShapeIdsSignal().length > 0;
  }
  // Shape Type Specific Operations
  createRectangle(x, y, width, height, imageWidth, imageHeight, color = "#FF0000") {
    return {
      id: this.getNextShapeId(),
      fileId: 0,
      type: "rectangle",
      x,
      y,
      width,
      height,
      color,
      originalPictureWidth: imageWidth,
      originalPictureHeight: imageHeight,
      originalWidth: 200,
      originalHeight: 200,
      isSelected: false,
      isBulkSelected: false,
      currentImgWidth: imageWidth,
      currentImgHeigth: imageHeight,
      scaleToCurrentImage: 1
    };
  }
  createSymbol(symbol, x, y, imageWidth, imageHeight) {
    return {
      id: this.getNextShapeId(),
      fileId: 0,
      type: "svg-symbol",
      symbolId: symbol.id,
      svgPath: symbol.svgPath,
      x: x - symbol.width / 2,
      y: y - symbol.height / 2,
      width: symbol.width,
      height: symbol.height,
      color: "#000000",
      rotation: 0,
      originalPictureWidth: imageWidth,
      originalPictureHeight: imageHeight,
      originalWidth: symbol.originalWidth,
      originalHeight: symbol.originalHeight,
      isSelected: false,
      isBulkSelected: false,
      currentImgWidth: imageWidth,
      currentImgHeigth: imageHeight,
      scaleToCurrentImage: 1
    };
  }
  // Bulk Operations
  updateAllShapesScale(newScale) {
    this.shapesSignal.update((shapes) => shapes.map((shape) => __spreadProps(__spreadValues({}, shape), {
      scaleToCurrentImage: newScale
    })));
  }
  updateAllShapesImageSize(width, height) {
    this.shapesSignal.update((shapes) => shapes.map((shape) => __spreadProps(__spreadValues({}, shape), {
      currentImgWidth: width,
      currentImgHeigth: height
    })));
  }
  static \u0275fac = function ShapeManagerService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _ShapeManagerService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _ShapeManagerService, factory: _ShapeManagerService.\u0275fac, providedIn: "root" });
};

// src/app/shared/image/refactored/models/interactive-image-config.model.ts
var INTERACTIVE_IMAGE_PRESETS = {
  /**
   * File Editor Context
   * Full editing capabilities: add, modify, delete shapes
   */
  FILE_EDITOR: {
    canPan: true,
    canZoom: true,
    canSelectShapes: true,
    canMultiSelect: true,
    canDrawShapes: true,
    canEditShapes: true,
    canDeleteShapes: true,
    canDragShapes: true,
    canResizeShapes: true,
    canRotateShapes: true,
    drawingMode: "multiple",
    allowedShapeTypes: ["rectangle", "symbol"],
    showToolbar: true,
    toolbarPosition: "top",
    showSymbolPalette: true,
    showContextMenu: true,
    autoDeselectOnEmptyClick: true,
    showResizeHandles: true,
    showRotationHandle: true,
    enforceAspectRatio: true
  },
  /**
   * Equipment Editor Context
   * Selective editing: only specific equipment can be modified
   * No creation or deletion, but can edit existing equipment
   */
  EQUIPMENT_EDITOR: {
    canPan: true,
    canZoom: true,
    canSelectShapes: true,
    canMultiSelect: false,
    canDrawShapes: false,
    canEditShapes: true,
    canDeleteShapes: false,
    canDragShapes: true,
    canResizeShapes: true,
    canRotateShapes: true,
    // editableShapeIds: [] // Set dynamically by parent component
    showToolbar: true,
    toolbarPosition: "top",
    enabledTools: ["select", "zoom-in", "zoom-out", "zoom-fit", "reset-view"],
    showSymbolPalette: false,
    showContextMenu: true,
    contextMenuActions: ["duplicate", "bring-to-front", "send-to-back"],
    autoDeselectOnEmptyClick: true,
    showResizeHandles: true,
    showRotationHandle: true,
    enforceAspectRatio: true
  },
  /**
   * Equipment Shape Drawer Context
   * Drawing mode: create ONE new equipment shape
   * Auto-closes after drawing one rectangle or symbol
   */
  EQUIPMENT_DRAWER: {
    canPan: true,
    canZoom: true,
    canSelectShapes: false,
    canMultiSelect: false,
    canDrawShapes: true,
    canEditShapes: false,
    canDeleteShapes: false,
    canDragShapes: false,
    canResizeShapes: false,
    canRotateShapes: false,
    drawingMode: "single",
    allowedShapeTypes: ["rectangle", "symbol"],
    showToolbar: true,
    toolbarPosition: "top",
    enabledTools: ["draw-rectangle", "place-symbol", "toggle-symbols", "zoom-in", "zoom-out", "zoom-fit", "reset-view"],
    showSymbolPalette: true,
    showContextMenu: false,
    autoDeselectOnEmptyClick: false,
    showResizeHandles: false,
    showRotationHandle: false,
    enforceAspectRatio: false
  },
  /**
   * Equipment Browser Context
   * View and select only: click to select equipment
   * No editing, just selection for browsing
   */
  EQUIPMENT_BROWSER: {
    canPan: true,
    canZoom: true,
    canSelectShapes: true,
    canMultiSelect: false,
    canDrawShapes: false,
    canEditShapes: false,
    canDeleteShapes: false,
    canDragShapes: false,
    canResizeShapes: false,
    canRotateShapes: false,
    showToolbar: true,
    toolbarPosition: "top",
    enabledTools: ["zoom-in", "zoom-out", "zoom-fit", "reset-view"],
    showSymbolPalette: false,
    showContextMenu: false,
    autoDeselectOnEmptyClick: true,
    showResizeHandles: false,
    showRotationHandle: false,
    enforceAspectRatio: false
  },
  /**
   * Equipment Unified Context
   * Combined browse and draw: left-click to select existing, right-click drag to draw new
   * Used in the unified equipment dialog for LOTO point forms
   * Supports both rectangles and symbols
   */
  EQUIPMENT_UNIFIED: {
    canPan: true,
    canZoom: true,
    canSelectShapes: true,
    canMultiSelect: false,
    canDrawShapes: true,
    canEditShapes: false,
    canDeleteShapes: false,
    canDragShapes: false,
    canResizeShapes: false,
    canRotateShapes: false,
    drawingMode: "single",
    allowedShapeTypes: ["rectangle", "symbol"],
    showToolbar: true,
    toolbarPosition: "top",
    enabledTools: ["select", "draw-rectangle", "place-symbol", "toggle-symbols", "zoom-in", "zoom-out", "zoom-fit", "reset-view"],
    showSymbolPalette: true,
    showContextMenu: false,
    autoDeselectOnEmptyClick: true,
    showResizeHandles: false,
    showRotationHandle: false,
    enforceAspectRatio: false
  },
  /**
   * View Only Context
   * Pure viewing: pan and zoom only, no interaction with shapes
   */
  VIEW_ONLY: {
    canPan: true,
    canZoom: true,
    canSelectShapes: false,
    canMultiSelect: false,
    canDrawShapes: false,
    canEditShapes: false,
    canDeleteShapes: false,
    canDragShapes: false,
    canResizeShapes: false,
    canRotateShapes: false,
    showToolbar: true,
    toolbarPosition: "top",
    enabledTools: ["zoom-in", "zoom-out", "zoom-fit", "reset-view"],
    showSymbolPalette: false,
    showContextMenu: false,
    autoDeselectOnEmptyClick: false,
    showResizeHandles: false,
    showRotationHandle: false,
    enforceAspectRatio: false
  }
};
function mergeConfig(preset, overrides) {
  return __spreadValues(__spreadValues({}, preset), overrides);
}
function getPreset(presetName) {
  return INTERACTIVE_IMAGE_PRESETS[presetName];
}

// src/app/shared/image/refactored/interactive-image/interactive-image.component.ts
var _c04 = ["imageContainer"];
var _c12 = ["zoomElement"];
var _c2 = ["zoomOuter"];
var _c3 = ["imageElement"];
var _c4 = ["canvasElement"];
var _c5 = ["shapeImageInput"];
var _c6 = (a0, a1) => ({ x: a0, y: a1 });
function InteractiveImageComponent_app_unified_toolbar_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "app-unified-toolbar", 17);
    \u0275\u0275listener("toolClicked", function InteractiveImageComponent_app_unified_toolbar_2_Template_app_unified_toolbar_toolClicked_0_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onToolbarToolClick($event));
    })("symbolPaletteToggled", function InteractiveImageComponent_app_unified_toolbar_2_Template_app_unified_toolbar_symbolPaletteToggled_0_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.toggleSymbolPalette());
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275property("enabledTools", ctx_r2.enabledTools())("activeTool", ctx_r2.currentTool())("position", ctx_r2.activeConfig().toolbarPosition || "top")("showSymbolPalette", ctx_r2.showSymbolPalette());
  }
}
function InteractiveImageComponent_div_13_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 18)(1, "app-symbol-palette", 19);
    \u0275\u0275listener("symbolSelected", function InteractiveImageComponent_div_13_Template_app_symbol_palette_symbolSelected_1_listener($event) {
      \u0275\u0275restoreView(_r4);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onSymbolSelected($event));
    });
    \u0275\u0275elementEnd()();
  }
}
var InteractiveImageComponent = class _InteractiveImageComponent {
  imageContainer;
  zoomElementRef;
  zoomOuterRef;
  imgRef;
  canvasRef;
  shapeImageInput;
  mouseEventService = inject(MouseEventsService);
  destroyRef = inject(DestroyRef);
  zoomPanService = inject(ZoomPanService);
  canvasRenderService = inject(CanvasRenderService);
  drawingService = inject(DrawingService);
  shapeConversionService = inject(ShapeConversionService);
  shapeManager = inject(ShapeManagerService);
  imageUrl = input();
  imageName = input();
  shapesInput = input([]);
  hoveredShapeId = input(null);
  /** ID of shape to select programmatically (shows selection handles) */
  selectedShapeIdInput = input(null);
  /** IDs of shapes to highlight (e.g., for selected LOTO points' equipment) */
  highlightedShapeIds = input([]);
  // Configuration-based approach (replaces simple 'mode')
  config = input();
  preset = input();
  // Custom context menu actions - if provided, will replace default actions
  customContextMenuActions = input();
  // Computed configuration: use preset if provided, otherwise use config, otherwise default to VIEW_ONLY
  activeConfig = computed(() => {
    const presetName = this.preset();
    const customConfig = this.config();
    if (presetName) {
      return customConfig ? mergeConfig(getPreset(presetName), customConfig) : getPreset(presetName);
    }
    if (customConfig) {
      return customConfig;
    }
    return INTERACTIVE_IMAGE_PRESETS["VIEW_ONLY"];
  });
  // Outputs
  shapeRightClicked = output();
  shapeDoubleClicked = output();
  shapeClicked = output();
  shapeUpdated = output();
  shapeDrawn = output();
  shapeHovered = output();
  shapeDeleted = output();
  /** Emitted when user requests to change a shape's symbol/type. Parent should handle showing symbol picker. */
  shapeSymbolChangeRequested = output();
  baseUrl = environment.baseApiUrl;
  pngUrl = computed(() => this.baseUrl + "/" + this.imageUrl()?.replaceAll("pdf", "jpg"));
  shapes = this.shapeManager.shapes;
  selectedShapeIds = this.shapeManager.selectedShapeIds;
  singleSelectedShapeId = this.shapeManager.singleSelectedShapeId;
  _zoomElement;
  _zoomOuter;
  _img;
  _canvas;
  get zoomElement() {
    return this._zoomElement;
  }
  get zoomOuter() {
    return this._zoomOuter;
  }
  get img() {
    return this._img;
  }
  get canvas() {
    return this._canvas;
  }
  // Transform state
  transformState = {
    scale: 1,
    pointX: 0,
    pointY: 0
  };
  zoomEndTimer = null;
  // Panning state
  isPanning = false;
  panStartPos = { x: 0, y: 0 };
  panStartTransform = {
    scale: 1,
    pointX: 0,
    pointY: 0
  };
  baseImageScale = 1;
  imageScale = 1;
  cursor = "default";
  // ResizeObserver to monitor image size changes
  imageResizeObserver = null;
  //Shape Dragging state
  isDraggingShape = false;
  dragStartPos = { x: 0, y: 0 };
  draggedShapeIds = [];
  initialShapePositions = /* @__PURE__ */ new Map();
  // Shape Resizing state
  isResizingShape = false;
  resizeHandle = null;
  resizeStartPos = { x: 0, y: 0 };
  resizingShapeId = null;
  initialShapeBounds = null;
  enforceAspectRatio = signal(false);
  MIN_SHAPE_SIZE = 10;
  // Minimum width/height for shapes
  isRotatingShape = false;
  rotatingShapeId = null;
  contextMenu = {
    visible: false,
    x: 0,
    y: 0,
    actions: [],
    selectedItem: null
  };
  shapeIdToConvert = null;
  // Clipboard for copy/paste
  clipboard = [];
  // Flag to suppress context menu after drawing ends
  suppressContextMenu = false;
  suppressContextMenuTimer = null;
  //Symbol palette (collapsed by default)
  _symbolPaletteVisible = signal(false);
  showSymbolPalette = computed(() => {
    const config = this.activeConfig();
    return config.showSymbolPalette && this._symbolPaletteVisible();
  });
  currentDrawMode = signal("none");
  selectedSymbol = signal(null);
  currentTool = signal("select");
  // Toolbar configuration based on active config
  enabledTools = computed(() => this.activeConfig().enabledTools || []);
  constructor() {
    effect(() => {
      const inputShapes = this.shapesInput();
      this.shapeManager.setShapes(inputShapes || []);
    });
    effect(() => {
      const shapes = this.shapes();
      if (this.canvas && this.img) {
        this.updateCanvasAndRedraw();
      }
    });
    effect(() => {
      const hoveredId = this.hoveredShapeId();
      if (this.canvas && this.img) {
        this.updateCanvasAndRedraw();
      }
    });
    effect(() => {
      const highlightedIds = this.highlightedShapeIds();
      if (this.canvas && this.img) {
        this.updateCanvasAndRedraw();
      }
    });
    effect(() => {
      const selectedId = this.selectedShapeIdInput();
      const shapes = this.shapes();
      console.log("[InteractiveImage] Selection effect - selectedId:", selectedId, "shapes.length:", shapes.length, "canvas:", !!this.canvas, "img:", !!this.img);
      if (selectedId !== null && this.canvas && this.img && shapes.length > 0) {
        const shape = this.shapeManager.getShapeById(selectedId);
        console.log("[InteractiveImage] Looking for shape:", selectedId, "found:", !!shape, "isSelected:", shape?.isSelected);
        if (shape && !shape.isSelected) {
          this.shapeManager.selectShape(selectedId, true);
          console.log("[InteractiveImage] Shape selected, redrawing");
          this.updateCanvasAndRedraw();
        }
      }
    });
    effect(() => {
      const cfg = this.activeConfig();
      if (cfg.drawingMode === "single" && this.shapes().length > this.shapesInput().length) {
        this.currentDrawMode.set("none");
      }
    });
  }
  ngOnDestroy() {
    this.drawingService.cleanup();
    this.canvasRenderService.clearImageCache();
    if (this.imageResizeObserver) {
      this.imageResizeObserver.disconnect();
      this.imageResizeObserver = null;
    }
  }
  ngAfterViewInit() {
    this._zoomElement = this.zoomElementRef.nativeElement;
    this._zoomOuter = this.zoomOuterRef.nativeElement;
    this._img = this.imgRef.nativeElement;
    this._canvas = this.canvasRef.nativeElement;
    this.drawingService.initializeTempCanvas(this.zoomElement);
    this.img.onload = () => {
      this.baseImageScale = this.canvasRenderService.calculateBaseScale(this.img);
      this.updateImageScale();
      this.updateCanvasAndRedraw();
      this.updateTempCanvasSize();
      setTimeout(() => {
        this.fitToScreen();
      }, 50);
    };
    this.setupImageResizeObserver();
    this.setupMouseEvents();
    this.setupKeyboardShortcuts();
  }
  setupMouseEvents() {
    const mousedown$ = fromEvent(this.zoomElement, "mousedown");
    this.mouseEventService.classifyClicks(mousedown$).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((classifiedEvent) => {
      classifiedEvent.event.preventDefault();
      switch (classifiedEvent.type) {
        case "single":
          this.onLeftClick(classifiedEvent.event);
          break;
        case "double":
          console.log("Double click case");
          this.onDoubleClick(classifiedEvent.event);
          break;
        case "middle":
          this.onMiddleClick(classifiedEvent.event);
          break;
        case "right":
          this.onRightClick(classifiedEvent.event);
          break;
      }
    });
    fromEvent(this.imageContainer.nativeElement, "contextmenu", { capture: true }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      console.log("Browser contextmenu event fired on imageContainer - preventing default");
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    });
  }
  // ==================================================Zooming Events==========================================
  onWheel(event) {
    event.preventDefault();
    const zoomOuterRect = this.zoomOuter.getBoundingClientRect();
    const imageRect = this.zoomElement.getBoundingClientRect();
    this.transformState = this.zoomPanService.calculateZoom(event, this.transformState, zoomOuterRect, imageRect);
    this.zoomPanService.applyTransform(this.zoomElement, this.transformState, "0s");
    this.updateImageScale();
    this.updateTempCanvasSize();
    if (this.zoomEndTimer) {
      clearTimeout(this.zoomEndTimer);
    }
    this.zoomEndTimer = setTimeout(() => {
      this.onZoomEnd();
      this.zoomEndTimer = null;
    }, 150);
  }
  onZoomEnd() {
    this.updateCanvasAndRedraw();
  }
  updateImageScale() {
    this.imageScale = this.baseImageScale * this.transformState.scale;
  }
  updateCanvasAndRedraw() {
    if (!this.canvas) {
      console.error("Canvas not available for size update");
      return;
    }
    this.canvasRenderService.updateCanvasSize(this.canvas, this.img);
    this.canvasRenderService.drawShapes(this.canvas, this.shapes(), this.imageScale, this.hoveredShapeId(), this.img.naturalWidth, this.img.naturalHeight, this.highlightedShapeIds());
  }
  updateTempCanvasSize() {
    this.drawingService.updateTempCanvasSize(this.img, this.baseImageScale);
  }
  // ===============================Mouse Event Handlers==============================================
  onMouseLeave(event) {
    if (this.drawingService.isDrawing()) {
      this.drawingService.cancelDrawing();
      this.cursor = "default";
    }
    if (this.drawingService.isDrawingSymbol()) {
      this.drawingService.cancelDrawingSymbol();
      this.cursor = "default";
    }
    if (this.isPanning) {
      this.stopPanning();
    }
    this.shapeHovered.emit(null);
  }
  onMouseDown(event) {
    const config = this.activeConfig();
    if (event.button === 2 && config.canDrawShapes) {
      if (this.currentDrawMode() === "symbol") {
        event.preventDefault();
        this.startDrawingSymbol(event);
        console.log("Starting symbol drawing");
        return;
      } else {
        event.preventDefault();
        this.startDrawing(event);
        return;
      }
    }
    if (event.button === 0) {
      if (config.canResizeShapes) {
        const handle = this.getResizeHandleAtPoint(event);
        if (handle) {
          event.preventDefault();
          this.startResizingShape(event, handle);
          return;
        }
      }
      if (config.canRotateShapes && this.isPointInRotationHandle(event)) {
        this.startRotatingShape(event);
        return;
      }
      if (config.canDragShapes) {
        const clickedShapeId = this.isOverSelectedShape(event);
        if (clickedShapeId !== null) {
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            return;
          }
          event.preventDefault();
          this.startDraggingShape(event, clickedShapeId);
          return;
        }
      }
      if (config.canPan) {
        event.preventDefault();
        this.startPanning(event);
      }
      return;
    }
  }
  onMouseMove(event) {
    if (this.drawingService.isDrawing()) {
      event.preventDefault();
      this.updateDrawing(event);
      return;
    }
    if (this.drawingService.isDrawingSymbol()) {
      event.preventDefault();
      this.updateDrawingSymbol(event);
      return;
    }
    if (this.isResizingShape) {
      event.preventDefault();
      this.updateResizingShape(event);
      return;
    }
    if (this.isDraggingShape) {
      event.preventDefault();
      this.updateDraggingShape(event);
      return;
    }
    if (this.isRotatingShape) {
      this.updateRotatingShape(event);
      return;
    }
    if (this.isPanning) {
      event.preventDefault();
      const currentPos = {
        x: event.clientX,
        y: event.clientY
      };
      const newPosition = this.zoomPanService.calculatePan(this.panStartPos, currentPos, this.panStartTransform);
      this.transformState = __spreadProps(__spreadValues({}, this.transformState), {
        pointX: newPosition.pointX,
        pointY: newPosition.pointY
      });
      this.zoomPanService.applyTransform(this.zoomElement, this.transformState, "0s");
      this.cursor = "grabbing";
    }
    this.updateCursorForHover(event);
  }
  onMouseUp(event) {
    if (this.drawingService.isDrawing()) {
      this.finishDrawing(event);
      return;
    }
    if (this.drawingService.isDrawingSymbol()) {
      this.finishDrawingSymbol(event);
      return;
    }
    if (this.isResizingShape) {
      this.stopResizingShape();
      return;
    }
    if (this.isDraggingShape) {
      this.stopDraggingShape();
      return;
    }
    if (this.isRotatingShape) {
      this.stopRotatingShape();
      return;
    }
    if (this.isPanning) {
      this.stopPanning();
      this.updateCanvasAndRedraw();
    }
  }
  onLeftClick(event) {
    const config = this.activeConfig();
    if (config.canSelectShapes) {
      if ((event.ctrlKey || event.metaKey) && config.canMultiSelect) {
        this.handleShapeSelection(event);
      } else {
        const clickedShapeId = this.isOverShape(event);
        if (clickedShapeId !== null) {
          const shape = this.shapeManager.getShapeById(clickedShapeId);
          if (shape)
            this.shapeClicked.emit(shape);
        } else {
          this.shapeManager.clearSelections();
        }
      }
    }
  }
  onMiddleClick(event) {
    console.log("middle click");
  }
  preventContextMenu(event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    return false;
  }
  onRightClick(event) {
    console.log("onRightClick called", event.type);
    event.preventDefault();
    event.stopPropagation();
    const preventContextMenu = (e) => {
      console.log("Preventing contextmenu from onRightClick");
      e.preventDefault();
      e.stopPropagation();
    };
    event.target?.addEventListener("contextmenu", preventContextMenu, { once: true });
    const config = this.activeConfig();
    const clickedShapeId = this.isOverShape(event);
    if (clickedShapeId !== null) {
      const clickedShape = this.shapeManager.getShapeById(clickedShapeId);
      if (clickedShape) {
        this.shapeRightClicked.emit(clickedShape);
      }
      if (!config.showContextMenu)
        return;
      if (config.canSelectShapes && !this.selectedShapeIds().includes(clickedShapeId)) {
        this.shapeManager.selectShape(clickedShapeId, true);
      }
      this.showShapeContextMenu(event, clickedShapeId);
    }
  }
  onDoubleClick(event) {
    console.log("double click");
    const config = this.activeConfig();
    if (config.canSelectShapes) {
      this.handleShapeSelection(event);
    }
  }
  // ==================================================Panning Methods==================================================
  startPanning(event) {
    this.isPanning = true;
    this.panStartPos = {
      x: event.clientX,
      y: event.clientY
    };
    this.panStartTransform = __spreadValues({}, this.transformState);
    this.cursor = "grabbing";
    this.zoomElement.classList.add("dragging");
  }
  stopPanning() {
    this.isPanning = false;
    this.cursor = "default";
    this.zoomElement.classList.remove("dragging");
  }
  resetTransform() {
    this.transformState = {
      scale: 1,
      pointX: 0,
      pointY: 0
    };
    this.zoomPanService.applyTransform(this.zoomElement, this.transformState);
    this.updateImageScale();
    setTimeout(() => this.updateCanvasAndRedraw(), 300);
  }
  // Zoom in by 25%
  zoomIn() {
    const zoomOuterRect = this.zoomOuter.getBoundingClientRect();
    const centerX = zoomOuterRect.width / 2;
    const centerY = zoomOuterRect.height / 2;
    const newScale = Math.min(this.transformState.scale * 1.25, 10);
    const scaleDiff = newScale / this.transformState.scale;
    const newPointX = centerX - (centerX - this.transformState.pointX) * scaleDiff;
    const newPointY = centerY - (centerY - this.transformState.pointY) * scaleDiff;
    this.transformState = {
      scale: newScale,
      pointX: newPointX,
      pointY: newPointY
    };
    this.zoomPanService.applyTransform(this.zoomElement, this.transformState, "0.2s");
    this.updateImageScale();
    setTimeout(() => {
      this.updateCanvasAndRedraw();
      this.updateTempCanvasSize();
    }, 200);
  }
  // Zoom out by 25%
  zoomOut() {
    const zoomOuterRect = this.zoomOuter.getBoundingClientRect();
    const centerX = zoomOuterRect.width / 2;
    const centerY = zoomOuterRect.height / 2;
    const newScale = Math.max(this.transformState.scale * 0.8, 0.1);
    const scaleDiff = newScale / this.transformState.scale;
    const newPointX = centerX - (centerX - this.transformState.pointX) * scaleDiff;
    const newPointY = centerY - (centerY - this.transformState.pointY) * scaleDiff;
    this.transformState = {
      scale: newScale,
      pointX: newPointX,
      pointY: newPointY
    };
    this.zoomPanService.applyTransform(this.zoomElement, this.transformState, "0.2s");
    this.updateImageScale();
    setTimeout(() => {
      this.updateCanvasAndRedraw();
      this.updateTempCanvasSize();
    }, 200);
  }
  // Fit image to screen
  fitToScreen() {
    if (!this.img || !this.zoomOuter)
      return;
    const containerRect = this.zoomOuter.getBoundingClientRect();
    const imgNaturalWidth = this.img.naturalWidth;
    const imgNaturalHeight = this.img.naturalHeight;
    if (!imgNaturalWidth || !imgNaturalHeight)
      return;
    const padding = 40;
    const scaleX = (containerRect.width - padding) / imgNaturalWidth;
    const scaleY = (containerRect.height - padding) / imgNaturalHeight;
    const scale = Math.min(scaleX, scaleY, 1);
    const scaledWidth = imgNaturalWidth * scale;
    const scaledHeight = imgNaturalHeight * scale;
    const pointX = (containerRect.width - scaledWidth) / 2;
    const pointY = (containerRect.height - scaledHeight) / 2;
    this.transformState = {
      scale: scale / this.baseImageScale,
      pointX,
      pointY
    };
    this.zoomPanService.applyTransform(this.zoomElement, this.transformState, "0.3s");
    this.updateImageScale();
    setTimeout(() => {
      this.updateCanvasAndRedraw();
      this.updateTempCanvasSize();
    }, 300);
  }
  // ==================================================Drawing Methods==================================================
  startDrawing(event) {
    const imgRect = this.img.getBoundingClientRect();
    this.drawingService.startDrawing(event.clientX, event.clientY, imgRect, this.baseImageScale, this.transformState);
    this.cursor = "crosshair";
  }
  updateDrawing(event) {
    const imgRect = this.img.getBoundingClientRect();
    this.drawingService.updateDrawing(
      event.clientX,
      event.clientY,
      imgRect,
      this.baseImageScale,
      // Pass baseImageScale, not imageScale
      this.transformState
    );
  }
  finishDrawing(event) {
    const imgRect = this.img.getBoundingClientRect();
    const newShape = this.drawingService.finishDrawing(event.clientX, event.clientY, imgRect, this.baseImageScale, this.transformState, this.img.naturalWidth, this.img.naturalHeight, this.shapeManager.getNextShapeId());
    if (newShape) {
      this.shapeManager.addShape(newShape);
      this.shapeDrawn.emit(newShape);
    }
    this.currentDrawMode.set("none");
    this.currentTool.set("select");
    this.cursor = "default";
    this.suppressContextMenuTemporarily();
  }
  /**
   * Temporarily suppress browser context menu after drawing ends.
   * This is needed because the browser fires contextmenu after mouseup on right-click.
   */
  suppressContextMenuTemporarily() {
    this.suppressContextMenu = true;
    if (this.suppressContextMenuTimer) {
      clearTimeout(this.suppressContextMenuTimer);
    }
    const suppressHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    };
    window.addEventListener("contextmenu", suppressHandler, { capture: true, once: true });
    this.suppressContextMenuTimer = setTimeout(() => {
      this.suppressContextMenu = false;
      this.suppressContextMenuTimer = null;
      window.removeEventListener("contextmenu", suppressHandler, { capture: true });
    }, 100);
  }
  //==================================================Image Shape Methods==================================================
  convertShapeToImage(shapeId) {
    this.shapeIdToConvert = shapeId;
    this.shapeImageInput.nativeElement.click();
  }
  onShapeImageSelected(event) {
    return __async(this, null, function* () {
      const input2 = event.target;
      if (!input2.files || input2.files.length === 0 || this.shapeIdToConvert === null) {
        return;
      }
      const file = input2.files[0];
      if (!file.type.startsWith("image/")) {
        console.error("Please select an image file");
        return;
      }
      try {
        const currentShape = this.shapeManager.getShapeById(this.shapeIdToConvert);
        if (!currentShape) {
          console.error("Shape not found");
          return;
        }
        if (currentShape.type === "rectangle") {
          const imageShape = yield this.shapeConversionService.convertRectangleToImage(currentShape, file);
          this.shapeManager.replaceShape(this.shapeIdToConvert, imageShape);
        } else if (currentShape.type === "image") {
          const updatedShape = yield this.shapeConversionService.updateImageForShape(currentShape, file);
          this.shapeManager.replaceShape(this.shapeIdToConvert, updatedShape);
        }
        console.log("Shape converted to image successfully");
      } catch (error) {
        console.error("Failed to convert shape to image:", error);
      } finally {
        this.shapeIdToConvert = null;
        input2.value = "";
      }
    });
  }
  convertImageToRectangle(shapeId) {
    const currentShape = this.shapeManager.getShapeById(shapeId);
    if (!currentShape) {
      console.error("Shape not found");
      return;
    }
    if (currentShape.type === "image") {
      const rectangleShape = this.shapeConversionService.convertImageToRectangle(currentShape);
      this.shapeManager.replaceShape(shapeId, rectangleShape);
      console.log("Image converted back to rectangle");
    }
  }
  /**
   * Change a shape's symbol type. Can convert:
   * - Rectangle to SVG Symbol
   * - SVG Symbol to Rectangle
   * - SVG Symbol to different SVG Symbol
   * @param shapeId The ID of the shape to convert
   * @param newSymbol The new symbol to use, or null for rectangle
   * @returns The new shape, or null if conversion failed
   */
  changeShapeSymbol(shapeId, newSymbol) {
    const currentShape = this.shapeManager.getShapeById(shapeId);
    if (!currentShape) {
      console.error("Shape not found:", shapeId);
      return null;
    }
    if (currentShape.type !== "rectangle" && currentShape.type !== "svg-symbol") {
      console.warn("Cannot change symbol for shape type:", currentShape.type);
      return null;
    }
    let newShape;
    const baseProps = {
      id: currentShape.id,
      fileId: currentShape.fileId,
      x: currentShape.x,
      y: currentShape.y,
      width: currentShape.width,
      height: currentShape.height,
      color: currentShape.color,
      originalPictureWidth: currentShape.originalPictureWidth,
      originalPictureHeight: currentShape.originalPictureHeight,
      isSelected: currentShape.isSelected,
      isBulkSelected: currentShape.isBulkSelected,
      currentImgWidth: currentShape.currentImgWidth,
      currentImgHeigth: currentShape.currentImgHeigth,
      scaleToCurrentImage: currentShape.scaleToCurrentImage
    };
    if (newSymbol === null) {
      newShape = __spreadProps(__spreadValues({}, baseProps), {
        type: "rectangle",
        originalWidth: currentShape.width,
        originalHeight: currentShape.height
      });
      console.log("Converted shape to rectangle:", shapeId);
    } else {
      newShape = __spreadProps(__spreadValues({}, baseProps), {
        type: "svg-symbol",
        symbolId: newSymbol.id,
        svgPath: newSymbol.svgPath,
        rotation: currentShape.rotation || 0,
        originalWidth: newSymbol.originalWidth,
        originalHeight: newSymbol.originalHeight
      });
      console.log("Converted shape to symbol:", newSymbol.id);
    }
    this.shapeManager.replaceShape(shapeId, newShape);
    this.shapeUpdated.emit(newShape);
    return newShape;
  }
  // ==================================================Symbol Palette Methods==================================================
  toggleSymbolPalette() {
    this._symbolPaletteVisible.update((show) => !show);
  }
  // Handle toolbar tool clicks
  onToolbarToolClick(tool) {
    switch (tool) {
      case "select":
        this.setDrawMode("none");
        this.currentTool.set("select");
        break;
      case "draw-rectangle":
        this.setDrawMode("rectangle");
        this.currentTool.set("draw-rectangle");
        break;
      case "place-symbol":
        this.setDrawMode("symbol");
        this.currentTool.set("place-symbol");
        break;
      case "delete":
        const selectedIds = this.selectedShapeIds();
        if (selectedIds.length > 0 && this.activeConfig().canDeleteShapes) {
          this.shapeDeleted.emit([...selectedIds]);
          this.shapeManager.deleteShapes(selectedIds);
        }
        break;
      case "duplicate":
        const selectedIds2 = this.selectedShapeIds();
        selectedIds2.forEach((id) => this.duplicateShape(id));
        break;
      case "zoom-in":
        this.zoomIn();
        break;
      case "zoom-out":
        this.zoomOut();
        break;
      case "zoom-fit":
        this.fitToScreen();
        break;
      case "reset-view":
        this.resetTransform();
        break;
      default:
        console.warn("Unknown toolbar tool:", tool);
    }
  }
  setDrawMode(mode) {
    this.currentDrawMode.set(mode);
    if (mode === "symbol") {
      this.cursor = "crosshair";
    } else if (mode === "rectangle") {
      this.cursor = "crosshair";
    } else {
      this.cursor = "default";
    }
  }
  onSymbolSelected(symbol) {
    this.selectedSymbol.set(symbol);
    this.setDrawMode("symbol");
    console.log("Symbol selected:", symbol);
  }
  // ========================= Symbol Drawing Methods =========================
  startDrawingSymbol(event) {
    const symbol = this.selectedSymbol();
    if (!symbol)
      return;
    const imgRect = this.img.getBoundingClientRect();
    this.drawingService.startDrawingSymbol(event.clientX, event.clientY, imgRect, this.baseImageScale, this.transformState, symbol);
    this.cursor = "crosshair";
  }
  updateDrawingSymbol(event) {
    const imgRect = this.img.getBoundingClientRect();
    this.drawingService.updateDrawingSymbol(event.clientX, event.clientY, imgRect, this.baseImageScale, this.transformState);
  }
  finishDrawingSymbol(event) {
    const imgRect = this.img.getBoundingClientRect();
    const newSymbol = this.drawingService.finishDrawingSymbol(event.clientX, event.clientY, imgRect, this.baseImageScale, this.transformState, this.img.naturalWidth, this.img.naturalHeight, this.shapeManager.getNextShapeId());
    if (newSymbol) {
      this.shapeManager.addShape(newSymbol);
      this.shapeDrawn.emit(newSymbol);
    }
    this.currentDrawMode.set("none");
    this.currentTool.set("select");
    this.selectedSymbol.set(null);
    this.cursor = "default";
    this.suppressContextMenuTemporarily();
  }
  //==================================================Shape Events==================================================
  // Add method to handle shape selection (add after onLeftClick):
  handleShapeSelection(event) {
    const clickedShapeId = this.isOverShape(event);
    if (clickedShapeId !== null) {
      if (event.ctrlKey || event.metaKey) {
        console.log("Multi-select", clickedShapeId);
        this.shapeManager.toggleShapeSelection(clickedShapeId);
      } else {
        this.shapeManager.selectShape(clickedShapeId, true);
      }
    } else {
      if (!event.ctrlKey && !event.metaKey) {
        this.shapeManager.clearSelections();
      }
    }
  }
  // Add visual feedback for selected shapes in the template
  // Update the cursor based on hover state (add this method):
  updateCursorForHover(event) {
    const imgRect = this.img.getBoundingClientRect();
    const hoverX = (event.clientX - imgRect.left) / this.transformState.scale / this.baseImageScale;
    const hoverY = (event.clientY - imgRect.top) / this.transformState.scale / this.baseImageScale;
    const shapes = this.shapes();
    let isOverShape = false;
    let hoveredShape = null;
    for (let i = shapes.length - 1; i >= 0; i--) {
      const shape = shapes[i];
      if (shape.type === "rectangle" || shape.type === "image" || shape.type === "svg-symbol") {
        const bounds = this.getNormalizedShapeBounds(shape);
        if (hoverX >= bounds.x && hoverX <= bounds.x + bounds.width && hoverY >= bounds.y && hoverY <= bounds.y + bounds.height) {
          isOverShape = true;
          hoveredShape = shape;
          break;
        }
      }
    }
    this.shapeHovered.emit(hoveredShape);
    if (this.currentDrawMode() !== "none") {
      this.cursor = "crosshair";
      return;
    }
    const handle = this.getResizeHandleAtPoint(event);
    if (handle) {
      this.cursor = this.getResizeCursor(handle);
      return;
    }
    if (this.isPointInRotationHandle(event)) {
      this.cursor = "grab";
      return;
    }
    this.cursor = isOverShape ? "pointer" : "default";
  }
  // Enhanced keyboard shortcuts for all operations
  setupKeyboardShortcuts() {
    fromEvent(document, "keydown").pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      const activeElement = document.activeElement;
      const isTypingInInput = activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement || activeElement?.hasAttribute("contenteditable") || activeElement?.closest("input, textarea, [contenteditable]");
      if (isTypingInInput) {
        return;
      }
      const config = this.activeConfig();
      if (config.canDrawShapes) {
        if (event.key === "v" || event.key === "V" || event.key === "Escape") {
          event.preventDefault();
          this.setDrawMode("none");
          this.currentTool.set("select");
          this.shapeManager.clearSelections();
          this.selectedSymbol.set(null);
          this.cursor = "default";
          return;
        }
        if (event.key === "r" || event.key === "R") {
          event.preventDefault();
          this.setDrawMode("rectangle");
          this.currentTool.set("draw-rectangle");
          return;
        }
        if ((event.key === "s" || event.key === "S") && !event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          this.setDrawMode("symbol");
          this.currentTool.set("place-symbol");
          return;
        }
        if (event.key === "p" || event.key === "P") {
          event.preventDefault();
          this.toggleSymbolPalette();
          return;
        }
      }
      if (config.canZoom) {
        if (event.key === "+" || event.key === "=") {
          event.preventDefault();
          this.zoomIn();
          return;
        }
        if (event.key === "-" || event.key === "_") {
          event.preventDefault();
          this.zoomOut();
          return;
        }
        if ((event.key === "f" || event.key === "F" || event.key === "0") && !event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          this.fitToScreen();
          return;
        }
        if ((event.ctrlKey || event.metaKey) && event.key === "0") {
          event.preventDefault();
          this.resetTransform();
          return;
        }
      }
      if (config.canDeleteShapes && (event.key === "Delete" || event.key === "Backspace")) {
        const selectedIds = this.selectedShapeIds();
        if (selectedIds.length > 0) {
          event.preventDefault();
          this.shapeDeleted.emit([...selectedIds]);
          this.shapeManager.deleteShapes(selectedIds);
          console.log("Deleted shapes:", selectedIds);
        }
      }
      if (config.canEditShapes && (event.ctrlKey || event.metaKey) && event.key === "d") {
        event.preventDefault();
        const selectedIds = this.selectedShapeIds();
        selectedIds.forEach((id) => this.duplicateShape(id));
        return;
      }
      if (config.canSelectShapes && config.canMultiSelect && (event.ctrlKey || event.metaKey) && event.key === "a") {
        event.preventDefault();
        const allShapeIds = this.shapes().map((s) => s.id);
        this.shapeManager.selectMultipleShapes(allShapeIds);
        console.log("Selected all shapes");
      }
      if (config.canSelectShapes && (event.ctrlKey || event.metaKey) && event.key === "c") {
        const selectedShapes = this.shapeManager.getSelectedShapes();
        if (selectedShapes.length > 0) {
          event.preventDefault();
          this.copyShapes(selectedShapes);
        }
      }
      if (config.canEditShapes && (event.ctrlKey || event.metaKey) && event.key === "v") {
        event.preventDefault();
        this.pasteShapes();
      }
    });
  }
  /**
   * Setup ResizeObserver to monitor image size changes and recalculate baseImageScale
   */
  setupImageResizeObserver() {
    this.imageResizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (this.img.naturalWidth > 0 && this.img.naturalHeight > 0) {
          const newBaseScale = this.canvasRenderService.calculateBaseScale(this.img);
          if (Math.abs(newBaseScale - this.baseImageScale) > 1e-4) {
            console.log("Image resized - updating baseImageScale from", this.baseImageScale, "to", newBaseScale);
            this.baseImageScale = newBaseScale;
            this.updateImageScale();
            this.updateCanvasAndRedraw();
            this.updateTempCanvasSize();
          }
        }
      }
    });
    this.imageResizeObserver.observe(this.img);
  }
  /**
   * Returns normalized shape bounds adjusted for current image dimensions.
   * This handles cases where shapes were created on images that were later resized.
   */
  getNormalizedShapeBounds(shape) {
    const currentWidth = this.img?.naturalWidth;
    const currentHeight = this.img?.naturalHeight;
    let normX = 1;
    let normY = 1;
    if (currentWidth && currentWidth > 0 && currentHeight && currentHeight > 0 && shape.originalPictureWidth && shape.originalPictureWidth > 0 && shape.originalPictureHeight && shape.originalPictureHeight > 0) {
      normX = currentWidth / shape.originalPictureWidth;
      normY = currentHeight / shape.originalPictureHeight;
      if (!isFinite(normX) || !isFinite(normY) || normX <= 0 || normY <= 0) {
        normX = 1;
        normY = 1;
      }
    }
    if (shape.type === "rectangle" || shape.type === "image" || shape.type === "svg-symbol") {
      return {
        x: shape.x * normX,
        y: shape.y * normY,
        width: shape.width * normX,
        height: shape.height * normY
      };
    }
    return { x: shape.x * normX, y: shape.y * normY, width: 0, height: 0 };
  }
  isOverShape(event) {
    const imgRect = this.img.getBoundingClientRect();
    const clickX = (event.clientX - imgRect.left) / this.transformState.scale / this.baseImageScale;
    const clickY = (event.clientY - imgRect.top) / this.transformState.scale / this.baseImageScale;
    const shapes = this.shapes();
    let clickedShapeId = null;
    for (let i = shapes.length - 1; i >= 0; i--) {
      const shape = shapes[i];
      if (shape.type === "rectangle" || shape.type === "image" || shape.type === "svg-symbol") {
        const bounds = this.getNormalizedShapeBounds(shape);
        if (clickX >= bounds.x && clickX <= bounds.x + bounds.width && clickY >= bounds.y && clickY <= bounds.y + bounds.height) {
          clickedShapeId = shape.id;
          break;
        }
      }
    }
    return clickedShapeId;
  }
  isOverSelectedShape(event) {
    const shapeId = this.isOverShape(event);
    if (shapeId && this.selectedShapeIds().includes(shapeId))
      return shapeId;
    return null;
  }
  closeContextMenu() {
    this.contextMenu.visible = false;
    this.contextMenu.selectedItem = null;
  }
  handleContextMenuAction(event) {
    this.closeContextMenu();
  }
  // Add a method to show context menu (add after handleShapeSelection):
  showShapeContextMenu(event, shapeId) {
    const shape = this.shapeManager.getShapeById(shapeId);
    if (!shape)
      return;
    this.closeContextMenu();
    const customActions = this.customContextMenuActions();
    console.log("Custom context menu actions:", customActions);
    if (customActions && customActions.length > 0) {
      console.log("Using custom context menu actions");
      setTimeout(() => {
        this.contextMenu = {
          visible: true,
          x: event.clientX,
          y: event.clientY,
          actions: customActions,
          selectedItem: shape
        };
      }, 0);
      return;
    }
    console.log("Using default context menu actions");
    const actions = [];
    if (shape.type === "rectangle") {
      actions.push({
        id: "convertToImage",
        label: "Convert to Image",
        action: () => this.convertShapeToImage(shapeId)
      });
    } else if (shape.type === "image") {
      actions.push({
        id: "changeImage",
        label: "Change Image",
        action: () => this.convertShapeToImage(shapeId)
      });
      actions.push({
        id: "convertToRect",
        label: "Convert to Rectangle",
        action: () => this.convertImageToRectangle(shapeId)
      });
    }
    actions.push({ id: "bringToFront", label: "Bring to Front", action: () => console.log("Bring to front:", shapeId) }, { id: "sendToBack", label: "Send to Back", action: () => console.log("Send to back:", shapeId) }, { id: "duplicate", label: "Duplicate", action: () => this.duplicateShape(shapeId) }, { id: "delete", label: "Delete", action: () => {
      this.shapeDeleted.emit([shapeId]);
      this.shapeManager.deleteShapes([shapeId]);
    } });
    setTimeout(() => {
      this.contextMenu = {
        visible: true,
        x: event.clientX,
        y: event.clientY,
        actions,
        selectedItem: shape
      };
    }, 0);
  }
  duplicateShape(shapeId) {
    const shape = this.shapeManager.getShapeById(shapeId);
    if (!shape)
      return;
    let newShape;
    if (shape.type === "rectangle" || shape.type === "image" || shape.type === "svg-symbol") {
      newShape = __spreadProps(__spreadValues({}, shape), {
        id: this.shapeManager.getNextShapeId(),
        x: shape.x + 20,
        y: shape.y + 20,
        isSelected: false,
        isBulkSelected: false
      });
    } else {
      newShape = __spreadProps(__spreadValues({}, shape), {
        id: this.shapeManager.getNextShapeId(),
        isSelected: false,
        isBulkSelected: false
      });
    }
    this.shapeManager.addShape(newShape);
  }
  // Copy selected shapes to clipboard
  copyShapes(shapes) {
    this.clipboard = shapes.map((shape) => __spreadValues({}, shape));
    console.log(`Copied ${this.clipboard.length} shape(s) to clipboard`);
  }
  // Paste shapes from clipboard
  pasteShapes() {
    if (this.clipboard.length === 0) {
      console.log("Clipboard is empty");
      return;
    }
    const config = this.activeConfig();
    if (!config.canEditShapes) {
      console.warn("Pasting not allowed in current mode");
      return;
    }
    this.shapeManager.clearSelections();
    const pastedShapeIds = [];
    this.clipboard.forEach((clipboardShape) => {
      let newShape;
      if (clipboardShape.type === "rectangle" || clipboardShape.type === "image" || clipboardShape.type === "svg-symbol") {
        newShape = __spreadProps(__spreadValues({}, clipboardShape), {
          id: this.shapeManager.getNextShapeId(),
          x: clipboardShape.x + 20,
          y: clipboardShape.y + 20,
          isSelected: false,
          isBulkSelected: false
        });
      } else {
        newShape = __spreadProps(__spreadValues({}, clipboardShape), {
          id: this.shapeManager.getNextShapeId(),
          isSelected: false,
          isBulkSelected: false
        });
      }
      this.shapeManager.addShape(newShape);
      pastedShapeIds.push(newShape.id);
    });
    if (config.canSelectShapes && pastedShapeIds.length > 0) {
      this.shapeManager.selectMultipleShapes(pastedShapeIds);
    }
    console.log(`Pasted ${pastedShapeIds.length} shape(s)`);
  }
  // ========================================Shape Draggign================================
  startDraggingShape(event, clickedShapeId) {
    if (!this.selectedShapeIds().includes(clickedShapeId)) {
      return;
    }
    this.isDraggingShape = true;
    this.draggedShapeIds = [...this.selectedShapeIds()];
    const imgRect = this.img.getBoundingClientRect();
    this.dragStartPos = {
      x: (event.clientX - imgRect.left) / this.transformState.scale / this.baseImageScale,
      y: (event.clientY - imgRect.top) / this.transformState.scale / this.baseImageScale
    };
    this.initialShapePositions.clear();
    this.draggedShapeIds.forEach((shapeId) => {
      const shape = this.shapeManager.getShapeById(shapeId);
      if (shape && (shape.type === "rectangle" || shape.type === "image" || shape.type === "svg-symbol")) {
        this.initialShapePositions.set(shapeId, { x: shape.x, y: shape.y });
      }
    });
    this.cursor = "move";
  }
  updateDraggingShape(event) {
    if (!this.isDraggingShape)
      return;
    const imgRect = this.img.getBoundingClientRect();
    const currentX = (event.clientX - imgRect.left) / this.transformState.scale / this.baseImageScale;
    const currentY = (event.clientY - imgRect.top) / this.transformState.scale / this.baseImageScale;
    const deltaX = currentX - this.dragStartPos.x;
    const deltaY = currentY - this.dragStartPos.y;
    this.draggedShapeIds.forEach((shapeId) => {
      const initialPos = this.initialShapePositions.get(shapeId);
      const shape = this.shapeManager.getShapeById(shapeId);
      if (initialPos && shape && (shape.type === "rectangle" || shape.type === "image" || shape.type === "svg-symbol")) {
        let newX = initialPos.x + deltaX;
        let newY = initialPos.y + deltaY;
        this.shapeManager.updateShape(shapeId, {
          x: newX,
          y: newY
        });
      }
    });
  }
  stopDraggingShape() {
    this.isDraggingShape = false;
    this.draggedShapeIds.forEach((shapeId) => {
      const shape = this.shapeManager.getShapeById(shapeId);
      if (shape) {
        this.shapeUpdated.emit(shape);
      }
    });
    this.draggedShapeIds = [];
    this.initialShapePositions.clear();
    this.cursor = "default";
  }
  // ========================================Shape Resizing================================
  startResizingShape(event, handle) {
    const singleSelectedId = this.singleSelectedShapeId();
    if (singleSelectedId === null)
      return;
    const shape = this.shapeManager.getShapeById(singleSelectedId);
    if (!shape || shape.type !== "rectangle" && shape.type !== "image" && shape.type !== "svg-symbol") {
      return;
    }
    this.isResizingShape = true;
    this.resizeHandle = handle;
    this.resizingShapeId = singleSelectedId;
    const imgRect = this.img.getBoundingClientRect();
    this.resizeStartPos = {
      x: (event.clientX - imgRect.left) / this.transformState.scale / this.baseImageScale,
      y: (event.clientY - imgRect.top) / this.transformState.scale / this.baseImageScale
    };
    this.initialShapeBounds = {
      x: shape.x,
      y: shape.y,
      width: shape.width,
      height: shape.height
    };
    this.cursor = this.getResizeCursor(handle);
  }
  updateResizingShape(event) {
    if (!this.isResizingShape || !this.resizeHandle || this.resizingShapeId === null || !this.initialShapeBounds) {
      return;
    }
    const shape = this.shapeManager.getShapeById(this.resizingShapeId);
    if (!shape)
      return;
    const imgRect = this.img.getBoundingClientRect();
    const currentX = (event.clientX - imgRect.left) / this.transformState.scale / this.baseImageScale;
    const currentY = (event.clientY - imgRect.top) / this.transformState.scale / this.baseImageScale;
    const deltaX = currentX - this.resizeStartPos.x;
    const deltaY = currentY - this.resizeStartPos.y;
    const newBounds = this.calculateNewBounds(this.initialShapeBounds, this.resizeHandle, deltaX, deltaY);
    if (this.enforceAspectRatio()) {
      const aspectRatio = shape.originalHeight / shape.originalWidth;
      if (newBounds.width !== this.initialShapeBounds.width) {
        const oldHeight = newBounds.height;
        newBounds.height = newBounds.width * aspectRatio;
        if (this.resizeHandle.includes("n")) {
          newBounds.y += oldHeight - newBounds.height;
        }
      } else if (newBounds.height !== this.initialShapeBounds.height) {
        const oldWidth = newBounds.width;
        newBounds.width = newBounds.height / aspectRatio;
        if (this.resizeHandle.includes("w")) {
          newBounds.x += oldWidth - newBounds.width;
        }
      }
    }
    if (newBounds.width < this.MIN_SHAPE_SIZE || newBounds.height < this.MIN_SHAPE_SIZE) {
      return;
    }
    this.shapeManager.updateShape(this.resizingShapeId, newBounds);
  }
  stopResizingShape() {
    this.isResizingShape = false;
    if (this.resizingShapeId !== null) {
      const shape = this.shapeManager.getShapeById(this.resizingShapeId);
      if (shape) {
        this.shapeUpdated.emit(shape);
      }
    }
    this.resizeHandle = null;
    this.resizingShapeId = null;
    this.initialShapeBounds = null;
    this.cursor = "default";
  }
  calculateNewBounds(initial, handle, deltaX, deltaY) {
    const bounds = __spreadValues({}, initial);
    switch (handle) {
      case "nw":
        bounds.x = initial.x + deltaX;
        bounds.y = initial.y + deltaY;
        bounds.width = initial.width - deltaX;
        bounds.height = initial.height - deltaY;
        break;
      case "n":
        bounds.y = initial.y + deltaY;
        bounds.height = initial.height - deltaY;
        break;
      case "ne":
        bounds.y = initial.y + deltaY;
        bounds.width = initial.width + deltaX;
        bounds.height = initial.height - deltaY;
        break;
      case "e":
        bounds.width = initial.width + deltaX;
        break;
      case "se":
        bounds.width = initial.width + deltaX;
        bounds.height = initial.height + deltaY;
        break;
      case "s":
        bounds.height = initial.height + deltaY;
        break;
      case "sw":
        bounds.x = initial.x + deltaX;
        bounds.width = initial.width - deltaX;
        bounds.height = initial.height + deltaY;
        break;
      case "w":
        bounds.x = initial.x + deltaX;
        bounds.width = initial.width - deltaX;
        break;
    }
    return bounds;
  }
  getResizeHandleAtPoint(event) {
    const singleSelectedId = this.singleSelectedShapeId();
    if (singleSelectedId === null)
      return null;
    const shape = this.shapeManager.getShapeById(singleSelectedId);
    if (!shape || shape.type !== "rectangle" && shape.type !== "image" && shape.type !== "svg-symbol") {
      return null;
    }
    const bounds = this.getNormalizedShapeBounds(shape);
    const imgRect = this.img.getBoundingClientRect();
    let mouseX = (event.clientX - imgRect.left) / this.transformState.scale / this.baseImageScale;
    let mouseY = (event.clientY - imgRect.top) / this.transformState.scale / this.baseImageScale;
    const rotation = shape.rotation || 0;
    if (rotation !== 0) {
      const centerX = bounds.x + bounds.width / 2;
      const centerY = bounds.y + bounds.height / 2;
      const translatedX = mouseX - centerX;
      const translatedY = mouseY - centerY;
      const angle = -rotation * Math.PI / 180;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      mouseX = translatedX * cos - translatedY * sin + centerX;
      mouseY = translatedX * sin + translatedY * cos + centerY;
    }
    const handleSize = 8 / this.transformState.scale / this.baseImageScale;
    const handles = this.getResizeHandlePositions(bounds, handleSize);
    for (const [handle, pos] of Object.entries(handles)) {
      if (this.isPointInHandle(mouseX, mouseY, pos, handleSize)) {
        return handle;
      }
    }
    return null;
  }
  getResizeHandlePositions(shape, handleSize) {
    const { x, y, width, height } = shape;
    const halfHandle = handleSize / 2;
    return {
      nw: { x: x - halfHandle, y: y - halfHandle },
      n: { x: x + width / 2 - halfHandle, y: y - halfHandle },
      ne: { x: x + width - halfHandle, y: y - halfHandle },
      e: { x: x + width - halfHandle, y: y + height / 2 - halfHandle },
      se: { x: x + width - halfHandle, y: y + height - halfHandle },
      s: { x: x + width / 2 - halfHandle, y: y + height - halfHandle },
      sw: { x: x - halfHandle, y: y + height - halfHandle },
      w: { x: x - halfHandle, y: y + height / 2 - halfHandle }
    };
  }
  isPointInHandle(mouseX, mouseY, handlePos, handleSize) {
    return mouseX >= handlePos.x && mouseX <= handlePos.x + handleSize && mouseY >= handlePos.y && mouseY <= handlePos.y + handleSize;
  }
  getResizeCursor(handle) {
    const cursorMap = {
      nw: "nw-resize",
      n: "n-resize",
      ne: "ne-resize",
      e: "e-resize",
      se: "se-resize",
      s: "s-resize",
      sw: "sw-resize",
      w: "w-resize"
    };
    return cursorMap[handle];
  }
  updateCursorForResize(event) {
    const handle = this.getResizeHandleAtPoint(event);
    if (handle) {
      this.cursor = this.getResizeCursor(handle);
    }
  }
  // ========================================Shape Rotation================================
  getRotationHandlePosition(shape) {
    const centerX = shape.x + shape.width / 2;
    const topY = shape.y;
    const handleOffset = 20 / this.transformState.scale / this.baseImageScale;
    return { x: centerX, y: topY - handleOffset };
  }
  isPointInRotationHandle(event) {
    const singleSelectedId = this.singleSelectedShapeId();
    if (singleSelectedId === null)
      return false;
    const shape = this.shapeManager.getShapeById(singleSelectedId);
    if (!shape || shape.type !== "rectangle" && shape.type !== "image" && shape.type !== "svg-symbol") {
      return false;
    }
    const bounds = this.getNormalizedShapeBounds(shape);
    const imgRect = this.img.getBoundingClientRect();
    let mouseX = (event.clientX - imgRect.left) / this.transformState.scale / this.baseImageScale;
    let mouseY = (event.clientY - imgRect.top) / this.transformState.scale / this.baseImageScale;
    const rotation = shape.rotation || 0;
    if (rotation !== 0) {
      const centerX = bounds.x + bounds.width / 2;
      const centerY = bounds.y + bounds.height / 2;
      const translatedX = mouseX - centerX;
      const translatedY = mouseY - centerY;
      const angle = -rotation * Math.PI / 180;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      mouseX = translatedX * cos - translatedY * sin + centerX;
      mouseY = translatedX * sin + translatedY * cos + centerY;
    }
    const handlePos = this.getRotationHandlePosition(bounds);
    const handleRadius = 8 / this.transformState.scale / this.baseImageScale;
    const dx = mouseX - handlePos.x;
    const dy = mouseY - handlePos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= handleRadius;
  }
  startRotatingShape(event) {
    const singleSelectedId = this.singleSelectedShapeId();
    if (singleSelectedId === null)
      return;
    this.isRotatingShape = true;
    this.rotatingShapeId = singleSelectedId;
    this.cursor = "grabbing";
    event.preventDefault();
  }
  updateRotatingShape(event) {
    if (!this.isRotatingShape || this.rotatingShapeId === null)
      return;
    const shape = this.shapeManager.getShapeById(this.rotatingShapeId);
    if (!shape || shape.type !== "rectangle" && shape.type !== "image" && shape.type !== "svg-symbol") {
      return;
    }
    const imgRect = this.img.getBoundingClientRect();
    const mouseX = (event.clientX - imgRect.left) / this.transformState.scale / this.baseImageScale;
    const mouseY = (event.clientY - imgRect.top) / this.transformState.scale / this.baseImageScale;
    const centerX = shape.x + shape.width / 2;
    const centerY = shape.y + shape.height / 2;
    const deltaX = mouseX - centerX;
    const deltaY = mouseY - centerY;
    let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 90;
    if (event.shiftKey) {
      const snapAngle = 15;
      angle = Math.round(angle / snapAngle) * snapAngle;
    }
    angle = (angle % 360 + 360) % 360;
    this.shapeManager.updateShape(this.rotatingShapeId, { rotation: angle });
  }
  stopRotatingShape() {
    this.isRotatingShape = false;
    if (this.rotatingShapeId !== null) {
      const shape = this.shapeManager.getShapeById(this.rotatingShapeId);
      if (shape) {
        this.shapeUpdated.emit(shape);
      }
    }
    this.rotatingShapeId = null;
    this.cursor = "default";
  }
  static \u0275fac = function InteractiveImageComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _InteractiveImageComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _InteractiveImageComponent, selectors: [["app-interactive-image"]], viewQuery: function InteractiveImageComponent_Query(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275viewQuery(_c04, 5);
      \u0275\u0275viewQuery(_c12, 5);
      \u0275\u0275viewQuery(_c2, 5);
      \u0275\u0275viewQuery(_c3, 5);
      \u0275\u0275viewQuery(_c4, 5);
      \u0275\u0275viewQuery(_c5, 5);
    }
    if (rf & 2) {
      let _t;
      \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.imageContainer = _t.first);
      \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.zoomElementRef = _t.first);
      \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.zoomOuterRef = _t.first);
      \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.imgRef = _t.first);
      \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.canvasRef = _t.first);
      \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.shapeImageInput = _t.first);
    }
  }, inputs: { imageUrl: [1, "imageUrl"], imageName: [1, "imageName"], shapesInput: [1, "shapesInput"], hoveredShapeId: [1, "hoveredShapeId"], selectedShapeIdInput: [1, "selectedShapeIdInput"], highlightedShapeIds: [1, "highlightedShapeIds"], config: [1, "config"], preset: [1, "preset"], customContextMenuActions: [1, "customContextMenuActions"] }, outputs: { shapeRightClicked: "shapeRightClicked", shapeDoubleClicked: "shapeDoubleClicked", shapeClicked: "shapeClicked", shapeUpdated: "shapeUpdated", shapeDrawn: "shapeDrawn", shapeHovered: "shapeHovered", shapeDeleted: "shapeDeleted", shapeSymbolChangeRequested: "shapeSymbolChangeRequested" }, features: [\u0275\u0275ProvidersFeature([
    ShapeManagerService,
    ZoomPanService,
    CanvasRenderService,
    DrawingService,
    ShapeConversionService
  ])], decls: 17, vars: 13, consts: [["imageContainer", ""], ["zoomOuter", ""], ["zoomElement", ""], ["imageElement", ""], ["canvasElement", ""], ["shapeImageInput", ""], [1, "interactive-image-container"], [1, "image-workspace"], [3, "enabledTools", "activeTool", "position", "showSymbolPalette", "toolClicked", "symbolPaletteToggled", 4, "ngIf"], [1, "image-container", 3, "contextmenu"], [1, "zoom-outer"], [1, "zoom-element"], [1, "main-image", 3, "wheel", "mouseleave", "mousedown", "mousemove", "mouseup", "contextmenu", "src", "alt"], [1, "shape-canvas", 3, "contextmenu"], ["class", "symbol-palette-bar", 4, "ngIf"], [3, "closeMenu", "actionSelected", "isVisible", "position", "actions", "selectedItem"], ["type", "file", "accept", "image/*", 2, "display", "none", 3, "change"], [3, "toolClicked", "symbolPaletteToggled", "enabledTools", "activeTool", "position", "showSymbolPalette"], [1, "symbol-palette-bar"], [3, "symbolSelected"]], template: function InteractiveImageComponent_Template(rf, ctx) {
    if (rf & 1) {
      const _r1 = \u0275\u0275getCurrentView();
      \u0275\u0275elementStart(0, "div", 6)(1, "div", 7);
      \u0275\u0275template(2, InteractiveImageComponent_app_unified_toolbar_2_Template, 1, 4, "app-unified-toolbar", 8);
      \u0275\u0275elementStart(3, "div", 9, 0);
      \u0275\u0275listener("contextmenu", function InteractiveImageComponent_Template_div_contextmenu_3_listener($event) {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.preventContextMenu($event));
      });
      \u0275\u0275elementStart(5, "div", 10, 1)(7, "div", 11, 2)(9, "img", 12, 3);
      \u0275\u0275listener("wheel", function InteractiveImageComponent_Template_img_wheel_9_listener($event) {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.onWheel($event));
      })("mouseleave", function InteractiveImageComponent_Template_img_mouseleave_9_listener($event) {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.onMouseLeave($event));
      })("mousedown", function InteractiveImageComponent_Template_img_mousedown_9_listener($event) {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.onMouseDown($event));
      })("mousemove", function InteractiveImageComponent_Template_img_mousemove_9_listener($event) {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.onMouseMove($event));
      })("mouseup", function InteractiveImageComponent_Template_img_mouseup_9_listener($event) {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.onMouseUp($event));
      })("contextmenu", function InteractiveImageComponent_Template_img_contextmenu_9_listener($event) {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.preventContextMenu($event));
      });
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(11, "canvas", 13, 4);
      \u0275\u0275listener("contextmenu", function InteractiveImageComponent_Template_canvas_contextmenu_11_listener($event) {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.preventContextMenu($event));
      });
      \u0275\u0275elementEnd()()()();
      \u0275\u0275template(13, InteractiveImageComponent_div_13_Template, 2, 0, "div", 14);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(14, "app-context-menu", 15);
      \u0275\u0275listener("closeMenu", function InteractiveImageComponent_Template_app_context_menu_closeMenu_14_listener() {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.closeContextMenu());
      })("actionSelected", function InteractiveImageComponent_Template_app_context_menu_actionSelected_14_listener($event) {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.handleContextMenuAction($event));
      });
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(15, "input", 16, 5);
      \u0275\u0275listener("change", function InteractiveImageComponent_Template_input_change_15_listener($event) {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.onShapeImageSelected($event));
      });
      \u0275\u0275elementEnd()();
    }
    if (rf & 2) {
      \u0275\u0275advance(2);
      \u0275\u0275property("ngIf", ctx.activeConfig().showToolbar);
      \u0275\u0275advance(7);
      \u0275\u0275styleProp("cursor", ctx.cursor);
      \u0275\u0275property("src", ctx.pngUrl(), \u0275\u0275sanitizeUrl)("alt", ctx.imageName());
      \u0275\u0275advance(4);
      \u0275\u0275property("ngIf", ctx.showSymbolPalette());
      \u0275\u0275advance();
      \u0275\u0275property("isVisible", ctx.contextMenu.visible)("position", \u0275\u0275pureFunction2(10, _c6, ctx.contextMenu.x, ctx.contextMenu.y))("actions", ctx.contextMenu.actions)("selectedItem", ctx.contextMenu.selectedItem);
    }
  }, dependencies: [
    CommonModule,
    NgIf,
    SymbolPaletteComponent,
    ContextMenuComponent,
    UnifiedToolbarComponent
  ], styles: ["\n\n.zoom-outer[_ngcontent-%COMP%] {\n  width: 100%;\n  height: 100%;\n  overflow: hidden;\n  position: relative;\n}\n.zoom-element[_ngcontent-%COMP%] {\n  position: relative;\n  transform-origin: 0 0;\n  width: fit-content;\n  height: 100%;\n}\n.zoom-element.dragging[_ngcontent-%COMP%] {\n  transition: none;\n}\n.image-canvas-container[_ngcontent-%COMP%] {\n  position: relative;\n  width: fit-content;\n  height: 100%;\n}\n.image-canvas-container[_ngcontent-%COMP%]   img[_ngcontent-%COMP%] {\n  display: block;\n  height: 100%;\n  object-fit: contain;\n}\n.image-canvas-container[_ngcontent-%COMP%]   canvas[_ngcontent-%COMP%] {\n  position: absolute;\n  top: 0;\n  left: 0;\n  height: 100%;\n  pointer-events: none;\n}\ncanvas[_ngcontent-%COMP%] {\n  position: absolute;\n  top: 0;\n  left: 0;\n  width: 100%;\n  height: 100%;\n  pointer-events: auto;\n}\n.interactive-image-container[_ngcontent-%COMP%] {\n  display: flex;\n  height: 100%;\n  width: 100%;\n  overflow: hidden;\n}\n.large-image-container[_nghost-%COMP%]   .interactive-image-container[_ngcontent-%COMP%], .large-image-container   [_nghost-%COMP%]   .interactive-image-container[_ngcontent-%COMP%] {\n  height: auto;\n}\n.large-image-container[_nghost-%COMP%]   .image-workspace[_ngcontent-%COMP%], .large-image-container   [_nghost-%COMP%]   .image-workspace[_ngcontent-%COMP%] {\n  height: auto;\n}\n.large-image-container[_nghost-%COMP%]   .image-container[_ngcontent-%COMP%], .large-image-container   [_nghost-%COMP%]   .image-container[_ngcontent-%COMP%] {\n  height: auto;\n}\n.large-image-container[_nghost-%COMP%]   .zoom-outer[_ngcontent-%COMP%], .large-image-container   [_nghost-%COMP%]   .zoom-outer[_ngcontent-%COMP%] {\n  height: auto;\n}\n.large-image-container[_nghost-%COMP%]   .zoom-element[_ngcontent-%COMP%], .large-image-container   [_nghost-%COMP%]   .zoom-element[_ngcontent-%COMP%] {\n  height: auto;\n}\n.large-image-container[_nghost-%COMP%]   .main-image[_ngcontent-%COMP%], .large-image-container   [_nghost-%COMP%]   .main-image[_ngcontent-%COMP%] {\n  height: auto;\n  max-height: 600px;\n  width: 100%;\n  object-fit: contain;\n}\n.symbol-palette-bar[_ngcontent-%COMP%] {\n  flex-shrink: 0;\n  width: 100%;\n  max-height: 180px;\n  overflow-x: auto;\n  overflow-y: hidden;\n  background: var(--surface-color, #ffffff);\n  border-top: 1px solid var(--border-color, #e0e0e0);\n}\n.image-workspace[_ngcontent-%COMP%] {\n  flex: 1;\n  display: flex;\n  flex-direction: column;\n  overflow: hidden;\n}\n.toolbar[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 10px;\n  padding: 10px;\n  background: var(--background-color);\n  border-bottom: 1px solid var(--border-color);\n}\n.toolbar-btn[_ngcontent-%COMP%] {\n  padding: 8px 16px;\n  border: 1px solid var(--border-color);\n  background: var(--button-background);\n  color: var(--primary-text);\n  cursor: pointer;\n  border-radius: 4px;\n  transition: all 0.2s;\n}\n.toolbar-btn[_ngcontent-%COMP%]:hover {\n  background: var(--hover-background);\n  border-color: var(--primary-color);\n}\n.toolbar-btn.active[_ngcontent-%COMP%] {\n  background: var(--primary-color);\n  color: white;\n  border-color: var(--primary-color);\n}\n.image-container[_ngcontent-%COMP%] {\n  flex: 1;\n  overflow: hidden;\n  position: relative;\n}\n.main-image[_ngcontent-%COMP%] {\n  display: block;\n  height: 100%;\n  object-fit: contain;\n}\n.shape-canvas[_ngcontent-%COMP%] {\n  position: absolute;\n  top: 0;\n  left: 0;\n  pointer-events: none;\n}\n/*# sourceMappingURL=interactive-image.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(InteractiveImageComponent, { className: "InteractiveImageComponent", filePath: "src/app/shared/image/refactored/interactive-image/interactive-image.component.ts", lineNumber: 52 });
})();

// src/app/features/equipment/refactored/services/equipment-mapper.service.ts
var EquipmentMapperService = class _EquipmentMapperService {
  pidSymbolsService = inject(PIDSymbolsService);
  mapAllToRfShapes(equipment) {
    return equipment.map((eq) => this.mapToRfShape(eq)).filter((shape) => shape !== null);
  }
  mapToRfShape(equipment, options) {
    if (!equipment.coordinates || !equipment.originalPictureSize) {
      return null;
    }
    try {
      const coordinates = this.parseCoordinates(equipment.coordinates);
      const pictureSize = this.parsePictureSize(equipment.originalPictureSize);
      if (!coordinates || !pictureSize) {
        return null;
      }
      if (!coordinates.startX || !coordinates.startY || !coordinates.endX || !coordinates.endY) {
        console.warn("[mapToRfShape] Invalid coordinates:", {
          equipmentId: equipment.id,
          rawCoordinates: equipment.coordinates,
          parsed: coordinates
        });
        return null;
      }
      if (!pictureSize.width || !pictureSize.height) {
        console.warn("[mapToRfShape] Invalid picture size:", {
          equipmentId: equipment.id,
          rawSize: equipment.originalPictureSize,
          parsed: pictureSize
        });
        return null;
      }
      const x = Math.min(coordinates.startX, coordinates.endX);
      const y = Math.min(coordinates.startY, coordinates.endY);
      const width = coordinates.width;
      const height = coordinates.height;
      if (width === 0 || height === 0) {
        console.warn("[mapToRfShape] Zero width or height:", {
          equipmentId: equipment.id,
          width,
          height,
          coordinates
        });
        return null;
      }
      let color;
      if (options?.shouldHighlight) {
        color = options.highlightColor || "#ff0000";
      } else if (options?.defaultColor) {
        color = options.defaultColor;
      } else {
        color = this.getShapeColor(equipment);
      }
      const rotation = equipment.rotation !== void 0 && equipment.rotation !== null ? equipment.rotation : coordinates.rotation !== void 0 ? coordinates.rotation : 0;
      if (equipment.symbolId && equipment.svgPath) {
        const pidSymbol = this.pidSymbolsService.getSymbolById(equipment.symbolId);
        const svgOriginalWidth = pidSymbol?.originalWidth || width;
        const svgOriginalHeight = pidSymbol?.originalHeight || height;
        const symbolShape = {
          id: equipment.id || 0,
          fileId: equipment.mainFileId || equipment.mainFileObject?.id || 0,
          type: "svg-symbol",
          symbolId: equipment.symbolId,
          svgPath: equipment.svgPath,
          color,
          originalPictureWidth: pictureSize.width,
          originalPictureHeight: pictureSize.height,
          originalWidth: svgOriginalWidth,
          // SVG viewbox dimensions for proper scaling
          originalHeight: svgOriginalHeight,
          isSelected: false,
          isBulkSelected: options?.shouldHighlight || false,
          currentImgWidth: pictureSize.width,
          currentImgHeigth: pictureSize.height,
          scaleToCurrentImage: 1,
          x,
          y,
          width,
          height,
          rotation
        };
        return symbolShape;
      }
      const shape = {
        id: equipment.id || 0,
        fileId: equipment.mainFileId || equipment.mainFileObject?.id || 0,
        type: "rectangle",
        color,
        originalPictureWidth: pictureSize.width,
        originalPictureHeight: pictureSize.height,
        originalWidth: pictureSize.width,
        // Use picture size, not shape dimensions
        originalHeight: pictureSize.height,
        // Use picture size, not shape dimensions
        isSelected: false,
        isBulkSelected: options?.shouldHighlight || false,
        currentImgWidth: pictureSize.width,
        currentImgHeigth: pictureSize.height,
        scaleToCurrentImage: 1,
        x,
        y,
        width,
        height,
        rotation
      };
      return shape;
    } catch (error) {
      console.error("Error mapping equipment to RfShape:", error);
      return null;
    }
  }
  parseCoordinates(coordinatesStr) {
    try {
      if (!coordinatesStr) {
        return null;
      }
      const cleanedCoords = coordinatesStr.replace(/\\/g, "").replace(/^"(.*)"$/, "$1").replace(/[{}]/g, "").trim();
      let coordsObj = {};
      try {
        const jsonStr = cleanedCoords.startsWith("{") ? cleanedCoords : `{${cleanedCoords}}`;
        coordsObj = JSON.parse(jsonStr);
      } catch {
        const parts = cleanedCoords.split(",");
        parts.forEach((part) => {
          const [key, value] = part.split(":");
          if (key && value) {
            const normalizedKey = key.trim().toLowerCase();
            const parsedValue = parseFloat(value.trim());
            if (!isNaN(parsedValue)) {
              coordsObj[normalizedKey] = parsedValue;
            }
          }
        });
      }
      const normalizedObj = {};
      for (const key in coordsObj) {
        normalizedObj[key.toLowerCase()] = coordsObj[key];
      }
      const startX = Number(normalizedObj.startx);
      const startY = Number(normalizedObj.starty);
      const endX = Number(normalizedObj.endx);
      const endY = Number(normalizedObj.endy);
      if (isNaN(startX) || isNaN(startY) || isNaN(endX) || isNaN(endY)) {
        console.warn("Invalid coordinate values:", { coordinatesStr, normalizedObj });
        return null;
      }
      const width = Math.abs(endX - startX);
      const height = Math.abs(endY - startY);
      return {
        startX,
        startY,
        endX,
        endY,
        width,
        height,
        rotation: normalizedObj.rotation !== void 0 ? Number(normalizedObj.rotation) : void 0
      };
    } catch (error) {
      console.error("Error parsing coordinates:", { coordinatesStr, error });
      return null;
    }
  }
  parsePictureSize(pictureSizeStr) {
    try {
      if (!pictureSizeStr) {
        return null;
      }
      const cleanedString = pictureSizeStr.replace(/[{}]/g, "").trim();
      const sizeMatch = cleanedString.match(/width:(\d+(?:\.\d+)?),\s*height:(\d+(?:\.\d+)?)/i);
      if (sizeMatch) {
        const width2 = Number(sizeMatch[1]);
        const height2 = Number(sizeMatch[2]);
        if (!isNaN(width2) && !isNaN(height2) && width2 > 0 && height2 > 0) {
          return { width: width2, height: height2 };
        }
      }
      const parts = cleanedString.split(",");
      const size = {};
      parts.forEach((part) => {
        const [key, value] = part.split(":");
        if (key && value) {
          const normalizedKey = key.trim().toLowerCase();
          const parsedValue = parseFloat(value.trim());
          if (!isNaN(parsedValue)) {
            size[normalizedKey] = parsedValue;
          }
        }
      });
      const width = size.width;
      const height = size.height;
      if (width && height && !isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
        return { width, height };
      }
      console.warn("Invalid picture size format:", pictureSizeStr);
      return null;
    } catch (error) {
      console.error("Error parsing picture size:", { pictureSizeStr, error });
      return null;
    }
  }
  getShapeColor(equipment) {
    if (equipment.lotoPoints && equipment.lotoPoints.length > 0) {
      const firstLotoPoint = equipment.lotoPoints[0];
      if (firstLotoPoint?.normPos?.name) {
        switch (firstLotoPoint.normPos.name.toLowerCase().trim()) {
          case "open":
            return "#FF0000";
          // Red
          case "closed":
            return "#00FF00";
          // Green
          case "auto":
            return "#FFFF00";
          // Yellow
          default:
            return "#0000FF";
        }
      }
    }
    return "#0000FF";
  }
  /**
   * Converts RfShape to coordinates string format
   * Returns string like: {startX:10,startY:20,endX:100,endY:80,width:90,height:60}
   */
  mapRfShapeToCoordinates(shape) {
    if (shape.type === "rectangle" || shape.type === "svg-symbol") {
      const rect = shape;
      const startX = rect.x;
      const startY = rect.y;
      const endX = rect.x + rect.width;
      const endY = rect.y + rect.height;
      return JSON.stringify({
        startX,
        startY,
        endX,
        endY,
        width: rect.width,
        height: rect.height,
        rotation: rect.rotation || 0
      });
    }
    return "{}";
  }
  /**
   * Formats picture size from shape dimensions
   * Returns string like: width:1920,height:1080
   */
  formatPictureSize(width, height) {
    return `width:${width},height:${height}`;
  }
  shapeToEquipment(shape) {
    if (shape.type !== "rectangle" && shape.type !== "svg-symbol")
      return null;
    const coordinates = this.mapRfShapeToCoordinates(shape);
    if (!coordinates)
      return null;
    const pictureSize = this.formatPictureSize(shape.originalPictureWidth, shape.originalPictureHeight);
    if (shape.type === "svg-symbol") {
      const symbol = shape;
      const equipment2 = new EquipmentDto({
        coordinates,
        originalPictureSize: pictureSize,
        rotation: symbol.rotation || 0,
        mainFileId: shape.fileId,
        symbolId: symbol.symbolId,
        svgPath: symbol.svgPath
      });
      return equipment2;
    }
    const rect = shape;
    const equipment = new EquipmentDto({
      coordinates,
      originalPictureSize: pictureSize,
      rotation: rect.rotation || 0,
      mainFileId: shape.fileId
    });
    return equipment;
  }
  static \u0275fac = function EquipmentMapperService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _EquipmentMapperService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _EquipmentMapperService, factory: _EquipmentMapperService.\u0275fac, providedIn: "root" });
};

// src/app/models/ui/nested-item.model.ts
var NestedItemImpl = class _NestedItemImpl {
  id;
  name;
  subtitle;
  values;
  isExpanded;
  objectType;
  color;
  isClicked;
  isLastClicked;
  constructor(data = {}) {
    this.id = data.id ?? "";
    this.name = data.name ?? "";
    this.subtitle = data.subtitle;
    this.values = data.values?.map((item) => new _NestedItemImpl(item)) ?? [];
    this.isExpanded = data.isExpanded ?? false;
    this.objectType = data.objectType ?? "";
    this.color = data.color ?? "";
    this.isClicked = data.isClicked ?? false;
    this.isLastClicked = data.isLastClicked ?? false;
  }
  addChild(child) {
    if (!this.values) {
      this.values = [];
    }
    this.values.push(new _NestedItemImpl(child));
  }
  removeChild(childId) {
    if (this.values) {
      this.values = this.values.filter((child) => child.id !== childId);
    }
  }
  toggleExpand() {
    this.isExpanded = !this.isExpanded;
  }
};

// src/app/features/files/refactored/rf-file-left-menu/rf-file-menu.service.ts
var FileMenuService = class _FileMenuService {
  currentFileService = inject(CurrentFileService);
  fileService = inject(FileService);
  destroyRef = inject(DestroyRef);
  menuItems = signal([]);
  isLoading = signal(false);
  error = signal(null);
  currentFile = signal(null);
  selectedType = signal("pid");
  constructor() {
    this.currentFileService.filesLoaded$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (loaded) => {
        if (loaded) {
          this.loadFiles();
          this.isLoading.set(false);
        } else {
          this.isLoading.set(true);
        }
      },
      error: (error) => {
        console.error("Error loading files:", error);
        this.error.set(error.message);
      }
    });
    this.currentFileService.filesUpdated$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.loadFiles(this.selectedType());
      },
      error: (error) => {
        console.error("Error fetching current file:", error);
      }
    });
  }
  loadFiles(type = "pid") {
    const criteria = type === "pid" ? "vendor" : "fileType";
    const nestedItems = this.createListOfNestedItems(this.currentFileService.getFilesByType(type), criteria);
    this.menuItems.set(nestedItems);
  }
  createListOfNestedItems(data, groupBy2) {
    const groupFiles = (files, key) => {
      return files.reduce((acc, file, index) => {
        const groupValue = file[key];
        if (groupValue && typeof groupValue === "object" && "name" in groupValue) {
          const groupName = groupValue.name;
          if (!acc[groupName]) {
            acc[groupName] = [];
          }
          acc[groupName].push(file);
        } else {
          console.warn(`File ${index} has invalid or missing ${key}:`, groupValue);
        }
        return acc;
      }, {});
    };
    const groupedFiles = groupFiles(data, groupBy2);
    return Object.entries(groupedFiles).map(([groupName, files]) => {
      const parentItem = new NestedItemImpl({
        id: groupBy2 + "_" + groupName,
        name: groupName,
        isExpanded: false,
        objectType: groupBy2
      });
      parentItem.values = files.map((file) => new NestedItemImpl({
        id: file.id.toString(),
        name: file.name && file.name.trim() !== "" ? file.name : file.fileNumber.join(",") || "Unnamed File",
        isExpanded: false,
        objectType: file.objectType,
        color: this.setFileItemColor(file)
      }));
      return parentItem;
    });
  }
  setFileItemColor(item) {
    if (!item.name || item.name === "") {
      return "red";
    }
    if (!item.isVerified) {
      return "yellow";
    }
    return "green";
  }
  getFileFromNestedItem(item, fileSignal) {
    if (item.values && item.values.length > 0)
      return;
    const startTime = performance.now();
    this.fileService.getFileById(item.id.toString()).pipe(takeUntilDestroyed(this.destroyRef), tap(() => {
      const endTime = performance.now();
      console.log(`File fetch time: ${endTime - startTime}ms`);
    })).subscribe({
      next: (response) => {
        const file = FileDto.fromJson(response.responseData);
        file.fileLink = file.fileLink.replaceAll("pdf", "jpg");
        fileSignal.set(file);
        const totalTime = performance.now() - startTime;
        console.log(`Total operation time: ${totalTime}ms`);
      },
      error: (error) => {
        console.error("Error getting file for edit:", error);
      }
    });
  }
  static \u0275fac = function FileMenuService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _FileMenuService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _FileMenuService, factory: _FileMenuService.\u0275fac, providedIn: "root" });
};

// src/app/shared/reactive-form/refactored/input-fields/services/equipment-dialog-file.service.ts
var EquipmentDialogFileService = class _EquipmentDialogFileService {
  currentFileService = inject(CurrentFileService);
  menuService = inject(FileMenuService);
  destroyRef = inject(DestroyRef);
  // State
  selectedFile = signal(null);
  // Menu items for toggle menu component
  menuItems = this.menuService.menuItems;
  // Files map from CurrentFileService
  filesMap = toSignal(this.currentFileService.fileMapByType$);
  // Loading and error states
  isLoading = this.menuService.isLoading;
  error = this.menuService.error;
  // Computed files list (for simple list view)
  files = computed(() => {
    const map2 = this.filesMap();
    if (!map2 || !map2.get("pid"))
      return [];
    return map2.get("pid") ?? [];
  });
  // Equipment from selected file
  equipment = computed(() => {
    const file = this.selectedFile();
    if (!file)
      return [];
    return file.points ?? [];
  });
  // Current file link for image display
  currentFileLink = computed(() => {
    const file = this.selectedFile();
    return file ? file.fileLink : "";
  });
  /**
   * Select a file from NestedItem (toggle menu)
   */
  selectFileFromNestedItem(fileItem) {
    this.menuService.getFileFromNestedItem(fileItem, this.selectedFile);
  }
  /**
   * Select a file directly (simple list)
   */
  selectFile(file) {
    this.selectedFile.set(file);
    this.currentFileService.setCurrentFile(file);
  }
  /**
   * Check if a file is currently selected
   */
  isFileSelected(file) {
    return this.selectedFile()?.id === file.id;
  }
  /**
   * Clear file selection
   */
  clearSelection() {
    this.selectedFile.set(null);
  }
  /**
   * Reset service state (call on dialog close)
   */
  reset() {
    this.selectedFile.set(null);
  }
  static \u0275fac = function EquipmentDialogFileService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _EquipmentDialogFileService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _EquipmentDialogFileService, factory: _EquipmentDialogFileService.\u0275fac });
};

// src/app/shared/list/toggle-list-virtual-scroll/toggle-list-virtual-scroll.component.ts
function ToggleListVirtualScrollComponent_ng_container_1_span_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 7);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const item_r2 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", item_r2.isExpanded ? "\u25BC" : "\u25B6", " ");
  }
}
function ToggleListVirtualScrollComponent_ng_container_1_span_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 8);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const item_r2 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(item_r2.subtitle);
  }
}
function ToggleListVirtualScrollComponent_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 2);
    \u0275\u0275listener("click", function ToggleListVirtualScrollComponent_ng_container_1_Template_div_click_1_listener($event) {
      const item_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onClick($event, item_r2));
    })("dblclick", function ToggleListVirtualScrollComponent_ng_container_1_Template_div_dblclick_1_listener() {
      const item_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onDoubleClick(item_r2));
    })("contextmenu", function ToggleListVirtualScrollComponent_ng_container_1_Template_div_contextmenu_1_listener($event) {
      const item_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onRightClick($event, item_r2));
    })("mousedown", function ToggleListVirtualScrollComponent_ng_container_1_Template_div_mousedown_1_listener($event) {
      const item_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onMiddleClick($event, item_r2));
    });
    \u0275\u0275template(2, ToggleListVirtualScrollComponent_ng_container_1_span_2_Template, 2, 1, "span", 3);
    \u0275\u0275elementStart(3, "div", 4)(4, "span", 5);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd();
    \u0275\u0275template(6, ToggleListVirtualScrollComponent_ng_container_1_span_6_Template, 2, 1, "span", 6);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const item_r2 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275styleProp("padding-left", item_r2.level * 20, "px")("background-color", ctx_r2.getItemColor(item_r2));
    \u0275\u0275classProp("highlighted", ctx_r2.highlightOnHover())("clicked", item_r2.isClicked)("last-clicked", item_r2.isLastClicked)("has-subtitle", ctx_r2.isLeafWithSubtitle(item_r2))("level-1", ctx_r2.colorLevels() && item_r2.level === 0)("level-2", ctx_r2.colorLevels() && item_r2.level === 1)("level-3", ctx_r2.colorLevels() && item_r2.level === 2);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", item_r2.values && item_r2.values.length > 0);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(item_r2.name);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r2.isLeafWithSubtitle(item_r2));
  }
}
var ToggleListVirtualScrollComponent = class _ToggleListVirtualScrollComponent {
  viewport = null;
  cdr = inject(ChangeDetectorRef);
  elementRef = inject(ElementRef);
  intersectionObserver = null;
  items = input([]);
  highlightOnHover = input(false);
  trackLastClicked = input(false);
  trackAllClicked = input(false);
  colorLevels = input(false);
  itemClicked = output();
  itemDoubleClicked = output();
  itemRightClicked = output();
  itemMiddleClicked = output();
  clickTimeout = null;
  lastClickTime = 0;
  doubleClickDelay = 250;
  expandedItemIds = signal(/* @__PURE__ */ new Set());
  lastClickedItemId = signal(null);
  allClickedItemIds = signal(/* @__PURE__ */ new Set());
  flatItems = computed(() => {
    const expandedIds = this.expandedItemIds();
    const lastClickedId = this.trackLastClicked() ? this.lastClickedItemId() : null;
    const allClickedIds = this.trackAllClicked() ? this.allClickedItemIds() : /* @__PURE__ */ new Set();
    const flatten = (items, level) => {
      let result = [];
      for (const item of items) {
        const isExpanded = expandedIds.has(item.id);
        const flatItem = __spreadProps(__spreadValues({}, item), {
          level,
          isExpanded,
          isClicked: allClickedIds.has(item.id),
          isLastClicked: item.id === lastClickedId
        });
        result.push(flatItem);
        if (isExpanded && item.values) {
          result = result.concat(flatten(item.values, level + 1));
        }
      }
      return result;
    };
    return flatten(this.items(), 0);
  });
  // Track last items reference to avoid redundant updates
  lastItemsLength = 0;
  pendingTimeouts = [];
  constructor() {
    effect(() => {
      const items = this.items();
      if (items.length !== this.lastItemsLength) {
        this.lastItemsLength = items.length;
        if (items.length > 0) {
          this.scheduleViewportCheck();
        }
      }
    });
  }
  ngAfterViewInit() {
    this.setupVisibilityObserver();
    this.scheduleViewportCheck();
  }
  /**
   * Set up IntersectionObserver to detect visibility changes.
   * This handles the case where the component is rendered but hidden initially.
   */
  setupVisibilityObserver() {
    if (typeof IntersectionObserver === "undefined")
      return;
    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0) {
          this.scheduleViewportCheck();
        }
      });
    }, { threshold: [0, 0.1, 0.5, 1] });
    this.intersectionObserver.observe(this.elementRef.nativeElement);
  }
  /**
   * Schedule viewport checks to ensure proper rendering.
   * Clears any pending checks before scheduling new ones.
   */
  scheduleViewportCheck() {
    this.pendingTimeouts.forEach((t) => clearTimeout(t));
    this.pendingTimeouts = [];
    this.pendingTimeouts.push(setTimeout(() => this.forceViewportUpdate(), 0));
    this.pendingTimeouts.push(setTimeout(() => this.forceViewportUpdate(), 100));
    this.pendingTimeouts.push(setTimeout(() => this.forceViewportUpdate(), 300));
  }
  /**
   * Force the viewport to update and render items
   */
  forceViewportUpdate() {
    if (this.viewport) {
      this.viewport.checkViewportSize();
      this.cdr.markForCheck();
    }
  }
  trackByFn(index, item) {
    return item.id;
  }
  onClick(event, item) {
    event.stopPropagation();
    const currentTime = (/* @__PURE__ */ new Date()).getTime();
    const timeSinceLastClick = currentTime - this.lastClickTime;
    if (timeSinceLastClick < this.doubleClickDelay) {
      clearTimeout(this.clickTimeout);
      this.clickTimeout = null;
      this.onDoubleClick(item);
    } else {
      this.clickTimeout = setTimeout(() => {
        this.onItemClick(event, item);
        this.clickTimeout = null;
      }, this.doubleClickDelay);
    }
    this.lastClickTime = currentTime;
  }
  onItemClick(event, item) {
    this.toggleItem(item);
    if (this.trackLastClicked()) {
      this.lastClickedItemId.set(item.id);
    }
    if (this.trackAllClicked()) {
      this.allClickedItemIds.update((ids) => {
        ids.add(item.id);
        return new Set(ids);
      });
    }
    this.itemClicked.emit(item);
  }
  toggleItem(item) {
    this.expandedItemIds.update((ids) => {
      if (ids.has(item.id)) {
        ids.delete(item.id);
      } else {
        ids.add(item.id);
      }
      return new Set(ids);
    });
    if (this.viewport) {
      this.viewport.checkViewportSize();
    }
  }
  isItemClicked(item) {
    return this.trackAllClicked() && this.allClickedItemIds().has(item.id);
  }
  isItemLastClicked(item) {
    return this.trackLastClicked() && item.id === this.lastClickedItemId();
  }
  onDoubleClick(item) {
    this.itemDoubleClicked.emit(item);
  }
  onRightClick(event, item) {
    event.preventDefault();
    event.stopPropagation();
    this.itemRightClicked.emit({ event, item });
  }
  onMiddleClick(event, item) {
    if (event.button === 1) {
      event.preventDefault();
      event.stopPropagation();
      this.itemMiddleClicked.emit(item);
    }
  }
  getItemColor(item) {
    return item.color || null;
  }
  isLeafWithSubtitle(item) {
    return !!item.subtitle && (!item.values || item.values.length === 0);
  }
  getItemSize() {
    const hasSubtitles = this.flatItems().some((item) => this.isLeafWithSubtitle(item));
    return hasSubtitles ? 50 : 40;
  }
  ngOnDestroy() {
    if (this.clickTimeout !== null) {
      clearTimeout(this.clickTimeout);
    }
    this.pendingTimeouts.forEach((t) => clearTimeout(t));
    this.pendingTimeouts = [];
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }
  }
  static \u0275fac = function ToggleListVirtualScrollComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _ToggleListVirtualScrollComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ToggleListVirtualScrollComponent, selectors: [["app-toggle-list-virtual-scroll"]], viewQuery: function ToggleListVirtualScrollComponent_Query(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275viewQuery(CdkVirtualScrollViewport, 5);
    }
    if (rf & 2) {
      let _t;
      \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.viewport = _t.first);
    }
  }, inputs: { items: [1, "items"], highlightOnHover: [1, "highlightOnHover"], trackLastClicked: [1, "trackLastClicked"], trackAllClicked: [1, "trackAllClicked"], colorLevels: [1, "colorLevels"] }, outputs: { itemClicked: "itemClicked", itemDoubleClicked: "itemDoubleClicked", itemRightClicked: "itemRightClicked", itemMiddleClicked: "itemMiddleClicked" }, decls: 2, vars: 3, consts: [[1, "toggle-list", 3, "itemSize"], [4, "cdkVirtualFor", "cdkVirtualForOf", "cdkVirtualForTrackBy"], [1, "item-content", 3, "click", "dblclick", "contextmenu", "mousedown"], ["class", "toggle-icon", 4, "ngIf"], [1, "item-text"], [1, "item-name"], ["class", "item-subtitle", 4, "ngIf"], [1, "toggle-icon"], [1, "item-subtitle"]], template: function ToggleListVirtualScrollComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "cdk-virtual-scroll-viewport", 0);
      \u0275\u0275template(1, ToggleListVirtualScrollComponent_ng_container_1_Template, 7, 21, "ng-container", 1);
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      \u0275\u0275property("itemSize", ctx.getItemSize());
      \u0275\u0275advance();
      \u0275\u0275property("cdkVirtualForOf", ctx.flatItems())("cdkVirtualForTrackBy", ctx.trackByFn);
    }
  }, dependencies: [ScrollingModule, CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport, CommonModule, NgIf], styles: ["\n\n[_nghost-%COMP%] {\n  display: block;\n  height: 100%;\n  min-height: 300px;\n}\n.toggle-list[_ngcontent-%COMP%] {\n  height: 100%;\n  min-height: 300px;\n}\ncdk-virtual-scroll-viewport.toggle-list[_ngcontent-%COMP%] {\n  height: 100%;\n  min-height: 300px;\n}\n.item-content[_ngcontent-%COMP%] {\n  padding: 8px;\n  cursor: pointer;\n  transition: transform 0.2s ease;\n  display: flex;\n  align-items: center;\n}\n.item-content[_ngcontent-%COMP%]:hover {\n  background-color: #f0f0f0;\n  transform: translateX(5px);\n}\n.clicked[_ngcontent-%COMP%] {\n  text-decoration: underline;\n  text-decoration-thickness: 2px;\n  font-weight: bold;\n}\n.last-clicked[_ngcontent-%COMP%] {\n  border-left: 3px solid #007bff;\n}\n.toggle-icon[_ngcontent-%COMP%] {\n  margin-right: 8px;\n  flex-shrink: 0;\n}\n.item-text[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  justify-content: center;\n  min-width: 0;\n  flex: 1;\n}\n.item-name[_ngcontent-%COMP%] {\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n.item-subtitle[_ngcontent-%COMP%] {\n  font-size: 0.75em;\n  color: #666;\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  margin-top: 2px;\n}\n.item-content.has-subtitle[_ngcontent-%COMP%] {\n  min-height: 50px;\n  display: flex;\n  align-items: center;\n}\n.highlighted[_ngcontent-%COMP%]:hover {\n  background-color: #f0f0f0;\n}\n.level-1[_ngcontent-%COMP%] {\n  margin-left: 0;\n}\n.level-2[_ngcontent-%COMP%] {\n  margin-left: 20px;\n}\n.level-3[_ngcontent-%COMP%] {\n  margin-left: 40px;\n}\n[_ngcontent-%COMP%]::-webkit-scrollbar {\n  width: 8px;\n  height: 8px;\n}\n[_ngcontent-%COMP%]::-webkit-scrollbar-track {\n  background: #f1f1f1;\n}\n[_ngcontent-%COMP%]::-webkit-scrollbar-thumb {\n  background: #888;\n  border-radius: 4px;\n}\n[_ngcontent-%COMP%]::-webkit-scrollbar-thumb:hover {\n  background: #555;\n}\n/*# sourceMappingURL=toggle-list-virtual-scroll.component.css.map */"], changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ToggleListVirtualScrollComponent, { className: "ToggleListVirtualScrollComponent", filePath: "src/app/shared/list/toggle-list-virtual-scroll/toggle-list-virtual-scroll.component.ts", lineNumber: 34 });
})();

// src/app/shared/menu/refactored/rf-toggle-menu/rf-toggle-menu.component.ts
function RfToggleMenuComponent_Conditional_1_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 11);
    \u0275\u0275listener("click", function RfToggleMenuComponent_Conditional_1_Conditional_3_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.clearSearch());
    });
    \u0275\u0275text(1, " \xD7 ");
    \u0275\u0275elementEnd();
  }
}
function RfToggleMenuComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 1)(1, "div", 6)(2, "input", 7);
    \u0275\u0275listener("input", function RfToggleMenuComponent_Conditional_1_Template_input_input_2_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onSearchChange($event.target.value));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275template(3, RfToggleMenuComponent_Conditional_1_Conditional_3_Template, 2, 0, "button", 8);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "button", 9);
    \u0275\u0275listener("click", function RfToggleMenuComponent_Conditional_1_Template_button_click_4_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.toggleSearchMode());
    });
    \u0275\u0275elementStart(5, "span", 10);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275property("placeholder", ctx_r1.searchPlaceholder())("value", ctx_r1.searchQuery());
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r1.searchQuery() ? 3 : -1);
    \u0275\u0275advance();
    \u0275\u0275property("title", ctx_r1.searchMode() === "AND" ? "Match all words" : "Match any word");
    \u0275\u0275attribute("data-mode", ctx_r1.searchMode());
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(ctx_r1.searchMode());
  }
}
function RfToggleMenuComponent_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "app-toggle-list-virtual-scroll", 12);
    \u0275\u0275listener("itemClicked", function RfToggleMenuComponent_Conditional_3_Template_app_toggle_list_virtual_scroll_itemClicked_0_listener($event) {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onItemClick($event));
    })("itemDoubleClicked", function RfToggleMenuComponent_Conditional_3_Template_app_toggle_list_virtual_scroll_itemDoubleClicked_0_listener($event) {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onItemDoubleClicked($event));
    })("itemRightClicked", function RfToggleMenuComponent_Conditional_3_Template_app_toggle_list_virtual_scroll_itemRightClicked_0_listener($event) {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onItemRightClicked($event));
    })("itemMiddleClicked", function RfToggleMenuComponent_Conditional_3_Template_app_toggle_list_virtual_scroll_itemMiddleClicked_0_listener($event) {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onItemMiddleClicked($event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275property("items", ctx_r1.filteredItems())("trackLastClicked", true)("trackAllClicked", true)("highlightOnHover", false);
  }
}
function RfToggleMenuComponent_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 4)(1, "div", 13);
    \u0275\u0275text(2, "\u{1F50D}");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "div", 14);
    \u0275\u0275text(4, "No items match your search");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "div", 15);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(6);
    \u0275\u0275textInterpolate1(" Try using ", ctx_r1.searchMode() === "AND" ? "OR" : "AND", " mode or different keywords ");
  }
}
function RfToggleMenuComponent_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 5)(1, "div", 16);
    \u0275\u0275text(2, "\u{1F4C2}");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "div", 17);
    \u0275\u0275text(4, "No items to display");
    \u0275\u0275elementEnd()();
  }
}
var RfToggleMenuComponent = class _RfToggleMenuComponent {
  destroyRef = inject(DestroyRef);
  // Inputs
  menuItems = input([]);
  enableSearch = input(true);
  searchPlaceholder = input("Search...");
  // Outputs
  itemClick = output();
  itemDblClick = output();
  itemRightClick = output();
  itemMiddleClick = output();
  // Search state
  searchQuery = signal("");
  searchMode = signal("AND");
  // Computed filtered items based on search
  filteredItems = computed(() => {
    const query = this.searchQuery().trim();
    const items = this.menuItems();
    if (!query) {
      return items;
    }
    const mode = this.searchMode();
    const searchTerms = query.toLowerCase().split(/\s+/).filter((term) => term.length > 0);
    return this.filterItems(items, searchTerms, mode);
  });
  // Check if any items match the search
  hasResults = computed(() => this.filteredItems().length > 0);
  /**
   * Recursively filter items based on search terms and mode
   */
  filterItems(items, searchTerms, mode) {
    return items.map((item) => this.filterSingleItem(item, searchTerms, mode)).filter((item) => item !== null);
  }
  /**
   * Filter a single item and its children
   */
  filterSingleItem(item, searchTerms, mode) {
    const itemText = (item.name + (item.subtitle ? " " + item.subtitle : "")).toLowerCase();
    const matchesSearch = this.itemMatchesSearch(itemText, searchTerms, mode);
    const filteredChildren = item.values ? this.filterItems(item.values, searchTerms, mode) : [];
    if (matchesSearch || filteredChildren.length > 0) {
      return __spreadProps(__spreadValues({}, item), {
        values: filteredChildren.length > 0 ? filteredChildren : item.values,
        isExpanded: filteredChildren.length > 0 ? true : item.isExpanded
        // Auto-expand if children match
      });
    }
    return null;
  }
  /**
   * Check if item text matches search terms based on mode
   */
  itemMatchesSearch(itemText, searchTerms, mode) {
    if (mode === "AND") {
      return searchTerms.every((term) => itemText.includes(term));
    } else {
      return searchTerms.some((term) => itemText.includes(term));
    }
  }
  /**
   * Toggle between AND/OR search mode
   */
  toggleSearchMode() {
    this.searchMode.update((mode) => mode === "AND" ? "OR" : "AND");
  }
  /**
   * Clear the search query
   */
  clearSearch() {
    this.searchQuery.set("");
  }
  /**
   * Handle search input change
   */
  onSearchChange(value) {
    this.searchQuery.set(value);
  }
  // Event handlers
  onItemClick(item) {
    this.itemClick.emit(item);
  }
  onItemDoubleClicked(item) {
    this.itemDblClick.emit(item);
  }
  onItemRightClicked(event) {
    this.itemRightClick.emit(event);
  }
  onItemMiddleClicked(item) {
    this.itemMiddleClick.emit(item);
  }
  static \u0275fac = function RfToggleMenuComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _RfToggleMenuComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _RfToggleMenuComponent, selectors: [["app-rf-toggle-menu"]], inputs: { menuItems: [1, "menuItems"], enableSearch: [1, "enableSearch"], searchPlaceholder: [1, "searchPlaceholder"] }, outputs: { itemClick: "itemClick", itemDblClick: "itemDblClick", itemRightClick: "itemRightClick", itemMiddleClick: "itemMiddleClick" }, decls: 6, vars: 2, consts: [[1, "rf-toggle-menu"], [1, "search-section"], [1, "menu-list-container"], [3, "items", "trackLastClicked", "trackAllClicked", "highlightOnHover"], [1, "no-results"], [1, "empty-state"], [1, "search-input-wrapper"], ["type", "text", 1, "search-input", 3, "input", "placeholder", "value"], ["title", "Clear search", 1, "clear-search-btn"], [1, "search-mode-toggle", 3, "click", "title"], [1, "mode-label"], ["title", "Clear search", 1, "clear-search-btn", 3, "click"], [3, "itemClicked", "itemDoubleClicked", "itemRightClicked", "itemMiddleClicked", "items", "trackLastClicked", "trackAllClicked", "highlightOnHover"], [1, "no-results-icon"], [1, "no-results-text"], [1, "no-results-hint"], [1, "empty-state-icon"], [1, "empty-state-text"]], template: function RfToggleMenuComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0);
      \u0275\u0275template(1, RfToggleMenuComponent_Conditional_1_Template, 7, 6, "div", 1);
      \u0275\u0275elementStart(2, "div", 2);
      \u0275\u0275template(3, RfToggleMenuComponent_Conditional_3_Template, 1, 4, "app-toggle-list-virtual-scroll", 3)(4, RfToggleMenuComponent_Conditional_4_Template, 7, 1, "div", 4)(5, RfToggleMenuComponent_Conditional_5_Template, 5, 0, "div", 5);
      \u0275\u0275elementEnd()();
    }
    if (rf & 2) {
      \u0275\u0275advance();
      \u0275\u0275conditional(ctx.enableSearch() ? 1 : -1);
      \u0275\u0275advance(2);
      \u0275\u0275conditional(ctx.hasResults() ? 3 : ctx.searchQuery() ? 4 : 5);
    }
  }, dependencies: [CommonModule, FormsModule, ToggleListVirtualScrollComponent], styles: ["\n\n[_nghost-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  height: 100%;\n  width: 100%;\n  background-color: var(--primary-background);\n  color: var(--primary-text);\n}\n.rf-toggle-menu[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  height: 100%;\n  width: 100%;\n  gap: 8px;\n}\n.search-section[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 8px;\n  padding: 12px;\n  background-color: var(--secondary-background);\n  border-bottom: 1px solid var(--border-color);\n}\n.search-input-wrapper[_ngcontent-%COMP%] {\n  position: relative;\n  flex: 1;\n}\n.search-input[_ngcontent-%COMP%] {\n  width: 100%;\n  padding: 8px 32px 8px 12px;\n  font-size: 14px;\n  border: 1px solid var(--border-color);\n  border-radius: 4px;\n  background-color: var(--card-background);\n  color: var(--primary-text);\n  transition: all 0.2s ease;\n}\n.search-input[_ngcontent-%COMP%]:focus {\n  outline: none;\n  border-color: var(--accent-color);\n  box-shadow: 0 0 0 3px var(--accent-color-shadow);\n}\n.search-input[_ngcontent-%COMP%]::placeholder {\n  color: var(--secondary-text);\n  opacity: 0.6;\n}\n.clear-search-btn[_ngcontent-%COMP%] {\n  position: absolute;\n  right: 4px;\n  top: 50%;\n  transform: translateY(-50%);\n  width: 24px;\n  height: 24px;\n  border: none;\n  background-color: transparent;\n  color: var(--secondary-text);\n  font-size: 20px;\n  cursor: pointer;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  border-radius: 50%;\n  transition: all 0.2s ease;\n}\n.clear-search-btn[_ngcontent-%COMP%]:hover {\n  background-color: var(--hover-color);\n  color: var(--primary-text);\n}\n.search-mode-toggle[_ngcontent-%COMP%] {\n  min-width: 60px;\n  padding: 8px 16px;\n  font-size: 13px;\n  font-weight: 600;\n  border: 1px solid var(--border-color);\n  border-radius: 4px;\n  background-color: var(--card-background);\n  color: var(--primary-text);\n  cursor: pointer;\n  transition: all 0.2s ease;\n  position: relative;\n}\n.search-mode-toggle[_ngcontent-%COMP%]:hover {\n  background-color: var(--hover-color);\n  border-color: var(--accent-color);\n}\n.search-mode-toggle[data-mode=AND][_ngcontent-%COMP%] {\n  border-color: var(--accent-color);\n  background-color: var(--accent-color);\n  color: white;\n}\n.search-mode-toggle[data-mode=OR][_ngcontent-%COMP%] {\n  border-color: var(--warning-background);\n  background-color: var(--warning-background);\n  color: var(--primary-text);\n}\n.mode-label[_ngcontent-%COMP%] {\n  display: block;\n  text-align: center;\n}\n.menu-list-container[_ngcontent-%COMP%] {\n  flex: 1;\n  min-height: 300px;\n  overflow: hidden;\n  display: flex;\n  flex-direction: column;\n}\n.menu-list-container[_ngcontent-%COMP%]   app-toggle-list-virtual-scroll[_ngcontent-%COMP%] {\n  flex: 1;\n  min-height: 300px;\n}\n.no-results[_ngcontent-%COMP%], \n.empty-state[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  height: 100%;\n  padding: 32px;\n  text-align: center;\n  color: var(--secondary-text);\n}\n.no-results-icon[_ngcontent-%COMP%], \n.empty-state-icon[_ngcontent-%COMP%] {\n  font-size: 48px;\n  margin-bottom: 16px;\n  opacity: 0.5;\n}\n.no-results-text[_ngcontent-%COMP%], \n.empty-state-text[_ngcontent-%COMP%] {\n  font-size: 16px;\n  font-weight: 500;\n  margin-bottom: 8px;\n  color: var(--primary-text);\n}\n.no-results-hint[_ngcontent-%COMP%] {\n  font-size: 13px;\n  color: var(--secondary-text);\n  opacity: 0.8;\n}\n@media (max-width: 768px) {\n  .search-section[_ngcontent-%COMP%] {\n    padding: 8px;\n  }\n  .search-input[_ngcontent-%COMP%] {\n    font-size: 13px;\n    padding: 6px 28px 6px 10px;\n  }\n  .search-mode-toggle[_ngcontent-%COMP%] {\n    min-width: 50px;\n    padding: 6px 12px;\n    font-size: 12px;\n  }\n}\n.search-input[_ngcontent-%COMP%]:focus-visible, \n.search-mode-toggle[_ngcontent-%COMP%]:focus-visible, \n.clear-search-btn[_ngcontent-%COMP%]:focus-visible {\n  outline: 2px solid var(--accent-color);\n  outline-offset: 2px;\n}\n@keyframes _ngcontent-%COMP%_fadeIn {\n  from {\n    opacity: 0;\n    transform: translateY(-10px);\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\n.no-results[_ngcontent-%COMP%], \n.empty-state[_ngcontent-%COMP%] {\n  animation: _ngcontent-%COMP%_fadeIn 0.3s ease;\n}\n/*# sourceMappingURL=rf-toggle-menu.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(RfToggleMenuComponent, { className: "RfToggleMenuComponent", filePath: "src/app/shared/menu/refactored/rf-toggle-menu/rf-toggle-menu.component.ts", lineNumber: 16 });
})();

// src/app/services/refactored/local-storage.service.ts
var LocalStorageService = class _LocalStorageService {
  platformId = inject(PLATFORM_ID);
  get isLocalStorageAvailable() {
    return isPlatformBrowser(this.platformId) && typeof localStorage !== "undefined";
  }
  /**
   * Sets an item in localStorage.
   * @param key The key for the storage item.
   * @param value The value to store. Will be JSON stringified.
   */
  setItem(key, value) {
    if (!this.isLocalStorageAvailable) {
      console.warn("localStorage is not available in this environment");
      return;
    }
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error("Error saving to localStorage", e);
    }
  }
  /**
   * Gets an item from localStorage.
   * @param key The key of the item to retrieve.
   * @returns The parsed item, or null if not found or on error.
   */
  getItem(key) {
    if (!this.isLocalStorageAvailable) {
      return null;
    }
    try {
      const item = localStorage.getItem(key);
      if (!item) {
        return null;
      }
      const dateReviver = (reviverKey, value) => {
        const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
        if (typeof value === "string" && isoDateRegex.test(value)) {
          return new Date(value);
        }
        return value;
      };
      return JSON.parse(item, dateReviver);
    } catch (e) {
      console.error("Error getting data from localStorage", e);
      return null;
    }
  }
  /**
   * Removes an item from localStorage.
   * @param key The key of the item to remove.
   */
  removeItem(key) {
    if (!this.isLocalStorageAvailable) {
      return;
    }
    localStorage.removeItem(key);
  }
  /**
   * Clears all items from localStorage.
   */
  clear() {
    if (!this.isLocalStorageAvailable) {
      return;
    }
    localStorage.clear();
  }
  /**
   * Checks if a key exists in localStorage.
   * @param key The key to check.
   * @returns True if the key exists, false otherwise.
   */
  hasItem(key) {
    if (!this.isLocalStorageAvailable) {
      return false;
    }
    return localStorage.getItem(key) !== null;
  }
  /**
   * Gets all keys from localStorage.
   * @returns Array of all keys in localStorage.
   */
  getAllKeys() {
    if (!this.isLocalStorageAvailable) {
      return [];
    }
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        keys.push(key);
      }
    }
    return keys;
  }
  static \u0275fac = function LocalStorageService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _LocalStorageService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _LocalStorageService, factory: _LocalStorageService.\u0275fac, providedIn: "root" });
};

// src/app/services/guide/guides/create-loto-point.guide.ts
var CREATE_LOTO_POINT_GUIDE = {
  id: "create-loto-point",
  name: "Create LOTO Point",
  description: "Learn how to create a new Lock Out Tag Out point",
  icon: "location_on",
  category: "loto",
  steps: [
    {
      id: "nav-card",
      message: "Click on the LOTO Points card to navigate to the LOTO Points page.",
      title: "Navigate to LOTO Points",
      order: 1,
      route: "/home"
    },
    {
      id: "create-button",
      message: 'Click the "Add New Loto Point" button to open the creation form.',
      title: "Create New Point",
      order: 2,
      route: "/loto-points"
    },
    {
      id: "field-tag-number",
      message: "Enter a unique tag number for this LOTO point. This is required.",
      title: "Tag Number",
      order: 3,
      route: "/loto-points"
    },
    {
      id: "field-description",
      message: "Provide a clear description of the LOTO point. This is required.",
      title: "Description",
      order: 4,
      route: "/loto-points"
    }
  ]
};

// src/app/services/guide/guides/create-loto-point-bulk.guide.ts
var CREATE_LOTO_POINT_BULK_GUIDE = {
  id: "create-loto-point-bulk",
  name: "Create LOTO Points in Bulk",
  description: "Learn how to create multiple LOTO points quickly using the LOTO Builder",
  icon: "dynamic_feed",
  category: "loto",
  steps: [
    {
      id: "nav-card",
      message: "Click on the LOTO Builder card to open the bulk creation tool.",
      title: "Open LOTO Builder",
      order: 1,
      route: "/home"
    },
    {
      id: "nav-menu",
      message: "You can also access LOTO Builder from the navigation menu.",
      title: "Navigation Menu",
      order: 2
    },
    {
      id: "left-panel-files",
      message: "Select the Files tab to browse P&ID files. Click on a file to load it in the viewer.",
      title: "Select a File",
      order: 3,
      route: "/loto-builder"
    },
    {
      id: "file-menu",
      message: "Expand folders and click on a P&ID file to load it. The file will be displayed on the right.",
      title: "Browse Files",
      order: 4,
      route: "/loto-builder"
    },
    {
      id: "image-viewer",
      message: "Right-click and drag on the image to draw a rectangle around equipment. Release to create an equipment shape.",
      title: "Draw Equipment Shapes",
      order: 5,
      route: "/loto-builder"
    },
    {
      id: "loto-point-form",
      message: "After drawing, a form will appear. Fill in the LOTO point details and save.",
      title: "Fill LOTO Point Details",
      order: 6,
      route: "/loto-builder"
    },
    {
      id: "continue-drawing",
      message: "Continue drawing more equipment shapes to create additional LOTO points. Each shape creates a new point.",
      title: "Create More Points",
      order: 7,
      route: "/loto-builder"
    }
  ]
};

// src/app/services/guide/guides/create-loto-standard.guide.ts
var CREATE_LOTO_STANDARD_GUIDE = {
  id: "create-loto-standard",
  name: "Create LOTO Standard",
  description: "Learn how to create a standard LOTO procedure",
  icon: "description",
  category: "loto",
  steps: [
    {
      id: "nav-card",
      message: "Click on the LOTO Standards card to navigate to the standards page.",
      title: "Navigate to Standards",
      order: 1,
      route: "/home"
    },
    {
      id: "create-button",
      message: "Click here to start creating a new LOTO standard procedure.",
      title: "Create New Standard",
      order: 2,
      route: "/loto-standard"
    },
    {
      id: "standard-name",
      message: "Enter a descriptive name for the LOTO standard.",
      title: "Standard Name",
      order: 3,
      route: "/loto-standard"
    },
    {
      id: "add-points",
      message: "Add LOTO points to this standard. You can search and select from existing points.",
      title: "Add Points",
      order: 4,
      route: "/loto-standard"
    },
    {
      id: "save-button",
      message: "Save the standard when all points have been added.",
      title: "Save Standard",
      order: 5,
      route: "/loto-standard"
    }
  ]
};

// src/app/services/guide/guides/manage-files.guide.ts
var MANAGE_FILES_GUIDE = {
  id: "manage-files",
  name: "Manage Files",
  description: "Learn how to upload, organize, and manage files",
  icon: "folder",
  category: "files",
  steps: [
    {
      id: "nav-card",
      message: "Click on the Files card to access the file management system.",
      title: "Navigate to Files",
      order: 1,
      route: "/home"
    },
    {
      id: "upload-button",
      message: "Click here to upload new files. You can select multiple files at once.",
      title: "Upload Files",
      order: 2,
      route: "/files"
    },
    {
      id: "folder-tree",
      message: "Use the folder tree to navigate and organize your files.",
      title: "Folder Navigation",
      order: 3,
      route: "/files"
    },
    {
      id: "file-actions",
      message: "Right-click on files to see available actions like download, rename, or delete.",
      title: "File Actions",
      order: 4,
      route: "/files"
    }
  ]
};

// src/app/services/guide/guides/equipment-management.guide.ts
var EQUIPMENT_MANAGEMENT_GUIDE = {
  id: "equipment-management",
  name: "Equipment Management",
  description: "Learn how to add and manage equipment records",
  icon: "build",
  category: "equipment",
  steps: [
    {
      id: "nav-card",
      message: "Click on the Equipment card to access equipment management.",
      title: "Navigate to Equipment",
      order: 1,
      route: "/home"
    },
    {
      id: "create-button",
      message: "Click here to add new equipment to the system.",
      title: "Add Equipment",
      order: 2,
      route: "/equipment"
    },
    {
      id: "equipment-name",
      message: "Enter the equipment name or tag number.",
      title: "Equipment Name",
      order: 3,
      route: "/equipment"
    },
    {
      id: "equipment-type",
      message: "Select the equipment type from the available categories.",
      title: "Equipment Type",
      order: 4,
      route: "/equipment"
    },
    {
      id: "save-button",
      message: "Save the equipment record when all details are complete.",
      title: "Save Equipment",
      order: 5,
      route: "/equipment"
    }
  ]
};

// src/app/services/guide/guides/index.ts
var AVAILABLE_GUIDES = [
  CREATE_LOTO_POINT_GUIDE,
  CREATE_LOTO_POINT_BULK_GUIDE,
  CREATE_LOTO_STANDARD_GUIDE,
  MANAGE_FILES_GUIDE,
  EQUIPMENT_MANAGEMENT_GUIDE
];

// src/app/services/guide/guide.service.ts
var GUIDE_STORAGE_KEY = "app_guide_progress";
var GuideService = class _GuideService {
  platformId = inject(PLATFORM_ID);
  localStorageService = inject(LocalStorageService);
  router = inject(Router);
  /** All registered guides */
  registeredGuides = /* @__PURE__ */ new Map();
  /** Elements registered via directive */
  registeredElements = /* @__PURE__ */ new Map();
  /** Currently active guide */
  activeGuide = signal(null);
  /** Whether the guide is paused (highlights disabled) */
  _isPaused = signal(false);
  /** Current route for filtering steps */
  currentRoute = signal("");
  /** All available guides */
  availableGuides = computed(() => Array.from(this.registeredGuides.values()));
  /** Public getter for paused state */
  isPaused = computed(() => this._isPaused());
  /** Steps for the active guide that apply to current route */
  activeSteps = computed(() => {
    const guideId = this.activeGuide();
    if (!guideId)
      return [];
    const guide = this.registeredGuides.get(guideId);
    if (!guide)
      return [];
    const currentRoute = this.currentRoute();
    return guide.steps.filter((step) => {
      if (!step.route)
        return true;
      if (step.route === "/") {
        return currentRoute === "/" || currentRoute === "";
      }
      return currentRoute.startsWith(step.route);
    }).sort((a, b) => a.order - b.order);
  });
  /** Check if a specific guide is active */
  isGuideActive = computed(() => this.activeGuide() !== null);
  constructor() {
    this.registerGuides(AVAILABLE_GUIDES);
    if (isPlatformBrowser(this.platformId)) {
      this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event) => {
        this.currentRoute.set(event.urlAfterRedirects);
      });
      this.currentRoute.set(this.router.url);
      this.restoreActiveGuide();
    }
  }
  /**
   * Register a guide configuration
   */
  registerGuide(guide) {
    this.registeredGuides.set(guide.id, guide);
  }
  /**
   * Register multiple guides at once
   */
  registerGuides(guides) {
    guides.forEach((guide) => this.registerGuide(guide));
  }
  /**
   * Start a guide - makes it active and persistent
   */
  startGuide(guideId) {
    if (!this.registeredGuides.has(guideId)) {
      console.warn(`Guide "${guideId}" not found`);
      return;
    }
    this._isPaused.set(false);
    this.activeGuide.set(guideId);
    this.saveProgress(guideId);
  }
  /**
   * Stop the current guide
   */
  stopGuide() {
    const currentGuide = this.activeGuide();
    if (currentGuide) {
      this.clearProgress(currentGuide);
    }
    this._isPaused.set(false);
    this.activeGuide.set(null);
  }
  /**
   * Toggle a guide on/off
   */
  toggleGuide(guideId) {
    if (this.activeGuide() === guideId) {
      this.stopGuide();
    } else {
      this.startGuide(guideId);
    }
  }
  /**
   * Toggle pause state for the active guide
   */
  togglePause() {
    this._isPaused.update((v) => !v);
  }
  /**
   * Resume a paused guide
   */
  resumeGuide() {
    this._isPaused.set(false);
  }
  /**
   * Pause the active guide (hide highlights but keep it selected)
   */
  pauseGuide() {
    this._isPaused.set(true);
  }
  /**
   * Register an element (called by directive)
   */
  registerElement(guideId, stepId, element, message, title) {
    const key = `${guideId}:${stepId}`;
    this.registeredElements.set(key, {
      guideId,
      stepId,
      element,
      message,
      title
    });
  }
  /**
   * Unregister an element (called when directive is destroyed)
   */
  unregisterElement(guideId, stepId) {
    const key = `${guideId}:${stepId}`;
    this.registeredElements.delete(key);
  }
  /**
   * Get registered element info
   */
  getRegisteredElement(guideId, stepId) {
    const key = `${guideId}:${stepId}`;
    return this.registeredElements.get(key);
  }
  /**
   * Check if an element should be highlighted
   */
  shouldHighlight(guideId, stepId) {
    if (this._isPaused()) {
      return false;
    }
    const active = this.activeGuide();
    if (!active || active !== guideId) {
      return false;
    }
    if (!stepId) {
      return true;
    }
    const guide = this.registeredGuides.get(guideId);
    if (!guide) {
      return false;
    }
    const step = guide.steps.find((s) => s.id === stepId);
    if (!step) {
      return true;
    }
    if (step.route) {
      const currentRoute = this.currentRoute();
      if (step.route === "/") {
        if (currentRoute !== "/" && currentRoute !== "") {
          return false;
        }
      } else if (!currentRoute.startsWith(step.route)) {
        return false;
      }
    }
    return true;
  }
  /**
   * Get step info for tooltip
   */
  getStepInfo(guideId, stepId) {
    const registered = this.getRegisteredElement(guideId, stepId);
    if (registered) {
      return { message: registered.message, title: registered.title };
    }
    const guide = this.registeredGuides.get(guideId);
    if (!guide)
      return null;
    const step = guide.steps.find((s) => s.id === stepId);
    if (!step)
      return null;
    return { message: step.message, title: step.title };
  }
  /**
   * Get a guide by ID
   */
  getGuide(guideId) {
    return this.registeredGuides.get(guideId);
  }
  /**
   * Mark a step as completed
   */
  markStepCompleted(guideId, stepId) {
    const progress = this.getProgress(guideId);
    if (progress && !progress.completedSteps.includes(stepId)) {
      progress.completedSteps.push(stepId);
      this.saveProgress(guideId, progress.completedSteps);
    }
  }
  /**
   * Check if all steps in a guide are completed
   */
  isGuideCompleted(guideId) {
    const guide = this.registeredGuides.get(guideId);
    if (!guide)
      return false;
    const progress = this.getProgress(guideId);
    if (!progress)
      return false;
    return guide.steps.every((step) => progress.completedSteps.includes(step.id));
  }
  /**
   * Get progress for a guide
   */
  getProgress(guideId) {
    const allProgress = this.getAllProgress();
    return allProgress[guideId] ?? null;
  }
  /**
   * Reset all guide progress
   */
  resetAllProgress() {
    this.localStorageService.removeItem(GUIDE_STORAGE_KEY);
    this.activeGuide.set(null);
  }
  saveProgress(guideId, completedSteps = []) {
    const allProgress = this.getAllProgress();
    allProgress[guideId] = {
      guideId,
      startedAt: allProgress[guideId]?.startedAt ?? /* @__PURE__ */ new Date(),
      completedSteps,
      isActive: true
    };
    this.localStorageService.setItem(GUIDE_STORAGE_KEY, allProgress);
  }
  clearProgress(guideId) {
    const allProgress = this.getAllProgress();
    if (allProgress[guideId]) {
      allProgress[guideId].isActive = false;
    }
    this.localStorageService.setItem(GUIDE_STORAGE_KEY, allProgress);
  }
  getAllProgress() {
    return this.localStorageService.getItem(GUIDE_STORAGE_KEY) ?? {};
  }
  restoreActiveGuide() {
    const allProgress = this.getAllProgress();
    const activeEntry = Object.values(allProgress).find((p) => p.isActive);
    if (activeEntry) {
      this.activeGuide.set(activeEntry.guideId);
    }
  }
  static \u0275fac = function GuideService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _GuideService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _GuideService, factory: _GuideService.\u0275fac, providedIn: "root" });
};

// src/app/shared/guide/guide.directive.ts
var GuideDirective = class _GuideDirective {
  elementRef = inject(ElementRef);
  guideService = inject(GuideService);
  renderer = inject(Renderer2);
  /** Guide identifier in format "guideId" or "guideId:stepId" */
  appGuide = input.required();
  /** Message to show when hovering over this element */
  guideMessage = input("");
  /** Optional title for the tooltip */
  guideTitle = input();
  /** If true, only show tooltip on hover without highlight/pulse effect */
  guideTooltipOnly = input(false);
  /** Whether the directive has a valid guide ID */
  hasValidGuide = computed(() => {
    const value = this.appGuide();
    return value && value.trim().length > 0;
  });
  /** Parsed guide ID */
  guideId = computed(() => {
    const value = this.appGuide();
    if (!value)
      return "";
    return value.split(":")[0];
  });
  /** Parsed step ID (defaults to 'default' if not provided) */
  stepId = computed(() => {
    const value = this.appGuide();
    if (!value)
      return "default";
    const parts = value.split(":");
    return parts[1] || "default";
  });
  /** Whether this element should be highlighted */
  isActive = computed(() => {
    if (!this.hasValidGuide())
      return false;
    const isPaused = this.guideService.isPaused();
    const activeGuide = this.guideService.activeGuide();
    const currentRoute = this.guideService.currentRoute();
    if (isPaused || !activeGuide || activeGuide !== this.guideId()) {
      return false;
    }
    return this.guideService.shouldHighlight(this.guideId(), this.stepId());
  });
  /** Whether this element should show highlight effect (not tooltip-only) */
  isActiveWithHighlight = computed(() => {
    return this.isActive() && !this.guideTooltipOnly();
  });
  tooltip = null;
  tooltipContainer = null;
  isTooltipVisible = false;
  constructor() {
    effect(() => {
      const active = this.isActive();
      if (active) {
        this.addHighlightStyles();
      } else {
        this.removeHighlightStyles();
        this.hideTooltip();
      }
    });
  }
  ngOnInit() {
    if (this.hasValidGuide()) {
      this.guideService.registerElement(this.guideId(), this.stepId(), this.elementRef.nativeElement, this.guideMessage(), this.guideTitle());
    }
  }
  ngOnDestroy() {
    if (this.hasValidGuide()) {
      this.guideService.unregisterElement(this.guideId(), this.stepId());
    }
    this.hideTooltip();
    this.removeHighlightStyles();
  }
  onMouseEnter() {
    if (this.isActive() && this.guideMessage()) {
      this.showTooltip();
    }
  }
  onMouseLeave() {
    this.hideTooltip();
  }
  onClick() {
    this.hideTooltip();
    if (this.isActive()) {
      this.guideService.markStepCompleted(this.guideId(), this.stepId());
    }
  }
  addHighlightStyles() {
    const el = this.elementRef.nativeElement;
    this.renderer.addClass(el, "guide-highlight");
  }
  removeHighlightStyles() {
    const el = this.elementRef.nativeElement;
    this.renderer.removeClass(el, "guide-highlight");
  }
  showTooltip() {
    if (this.isTooltipVisible || !this.guideMessage())
      return;
    const message = this.guideMessage();
    const title = this.guideTitle();
    this.tooltip = this.renderer.createElement("div");
    this.renderer.addClass(this.tooltip, "guide-tooltip");
    if (title) {
      const titleEl = this.renderer.createElement("div");
      this.renderer.addClass(titleEl, "guide-tooltip-title");
      titleEl.textContent = title;
      this.renderer.appendChild(this.tooltip, titleEl);
    }
    const messageEl = this.renderer.createElement("div");
    this.renderer.addClass(messageEl, "guide-tooltip-message");
    messageEl.textContent = message;
    this.renderer.appendChild(this.tooltip, messageEl);
    const arrow = this.renderer.createElement("div");
    this.renderer.addClass(arrow, "guide-tooltip-arrow");
    this.renderer.appendChild(this.tooltip, arrow);
    this.tooltipContainer = this.findTooltipContainer();
    const zIndex = this.calculateZIndex();
    this.renderer.setStyle(this.tooltip, "z-index", zIndex.toString());
    this.renderer.appendChild(this.tooltipContainer, this.tooltip);
    this.positionTooltip();
    this.isTooltipVisible = true;
  }
  hideTooltip() {
    if (this.tooltip && this.isTooltipVisible && this.tooltipContainer) {
      this.renderer.removeChild(this.tooltipContainer, this.tooltip);
      this.tooltip = null;
      this.tooltipContainer = null;
      this.isTooltipVisible = false;
    }
  }
  /**
   * Find the appropriate container for the tooltip.
   * Looks for the nearest overlay/dialog container, falls back to body.
   */
  findTooltipContainer() {
    let element = this.elementRef.nativeElement;
    while (element) {
      if (element.classList.contains("cdk-overlay-container") || element.classList.contains("cdk-overlay-pane") || element.classList.contains("mat-mdc-dialog-container") || element.classList.contains("popup-container") || element.classList.contains("popup-projection-container") || element.classList.contains("dialog-container") || element.hasAttribute("data-guide-container")) {
        return element;
      }
      element = element.parentElement;
    }
    return document.body;
  }
  /**
   * Calculate the appropriate z-index for the tooltip based on its container.
   * Ensures tooltip appears above sibling elements but respects dialog stacking.
   */
  calculateZIndex() {
    let element = this.elementRef.nativeElement;
    let maxZIndex = 0;
    while (element && element !== document.body) {
      const style = window.getComputedStyle(element);
      const zIndex = parseInt(style.zIndex, 10);
      if (!isNaN(zIndex) && zIndex > maxZIndex) {
        maxZIndex = zIndex;
      }
      element = element.parentElement;
    }
    return Math.max(maxZIndex + 1, 1e3);
  }
  positionTooltip() {
    if (!this.tooltip)
      return;
    const elementRect = this.elementRef.nativeElement.getBoundingClientRect();
    const tooltipRect = this.tooltip.getBoundingClientRect();
    let top = elementRect.top - tooltipRect.height - 10;
    let left = elementRect.left + (elementRect.width - tooltipRect.width) / 2;
    if (top < 10) {
      top = elementRect.bottom + 10;
      this.renderer.addClass(this.tooltip, "guide-tooltip-below");
    }
    if (left < 10) {
      left = 10;
    } else if (left + tooltipRect.width > window.innerWidth - 10) {
      left = window.innerWidth - tooltipRect.width - 10;
    }
    this.renderer.setStyle(this.tooltip, "top", `${top}px`);
    this.renderer.setStyle(this.tooltip, "left", `${left}px`);
  }
  static \u0275fac = function GuideDirective_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _GuideDirective)();
  };
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({ type: _GuideDirective, selectors: [["", "appGuide", ""]], hostVars: 4, hostBindings: function GuideDirective_HostBindings(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275listener("mouseenter", function GuideDirective_mouseenter_HostBindingHandler() {
        return ctx.onMouseEnter();
      })("mouseleave", function GuideDirective_mouseleave_HostBindingHandler() {
        return ctx.onMouseLeave();
      })("click", function GuideDirective_click_HostBindingHandler() {
        return ctx.onClick();
      });
    }
    if (rf & 2) {
      \u0275\u0275classProp("guide-active", ctx.isActiveWithHighlight())("guide-pulse", ctx.isActiveWithHighlight());
    }
  }, inputs: { appGuide: [1, "appGuide"], guideMessage: [1, "guideMessage"], guideTitle: [1, "guideTitle"], guideTooltipOnly: [1, "guideTooltipOnly"] } });
};

// src/app/models/loto/loto-point-summary.model.ts
var LotoPointSummaryDto = class _LotoPointSummaryDto {
  id;
  name;
  objectType;
  isVerified;
  isLabeled;
  isLockable;
  isProcessed;
  tagNumber;
  description;
  equipmentType;
  location;
  system;
  unit;
  zeroEnergyMethod;
  fileName;
  equipmentIds;
  constructor(data = {}) {
    this.id = data.id ?? 0;
    this.name = data.name ?? "";
    this.objectType = data.objectType ?? "LotoPointSummary";
    this.isVerified = data.isVerified ?? false;
    this.isLabeled = data.isLabeled ?? false;
    this.isLockable = data.isLockable ?? false;
    this.isProcessed = data.isProcessed ?? false;
    this.tagNumber = data.tagNumber ?? "";
    this.description = data.description ?? "";
    this.equipmentType = data.equipmentType ?? "";
    this.location = data.location ?? "";
    this.system = data.system ?? "";
    this.unit = data.unit ?? "";
    this.zeroEnergyMethod = data.zeroEnergyMethod ?? null;
    this.fileName = data.fileName ?? "";
    this.equipmentIds = data.equipmentIds ?? [];
  }
  static fromJson(json) {
    if (!json) {
      return new _LotoPointSummaryDto();
    }
    return new _LotoPointSummaryDto({
      id: json.id,
      name: json.name || json.tagNumber || "",
      objectType: json.objectType || "LotoPointSummary",
      isVerified: json.isVerified ?? false,
      isLabeled: json.isLabeled ?? false,
      isLockable: json.isLockable ?? false,
      isProcessed: json.isProcessed ?? false,
      tagNumber: json.tagNumber || "",
      description: json.description || "",
      equipmentType: json.equipmentType || "",
      location: json.location || "",
      system: json.system || "",
      unit: json.unit || "",
      zeroEnergyMethod: json.zeroEnergyMethod,
      fileName: json.fileName || "",
      equipmentIds: json.equipmentIds || []
    });
  }
  toJson() {
    return {
      id: this.id,
      name: this.name,
      objectType: this.objectType,
      isVerified: this.isVerified,
      isLabeled: this.isLabeled,
      isLockable: this.isLockable,
      isProcessed: this.isProcessed,
      tagNumber: this.tagNumber,
      description: this.description,
      equipmentType: this.equipmentType,
      location: this.location,
      system: this.system,
      unit: this.unit,
      zeroEnergyMethod: this.zeroEnergyMethod,
      fileName: this.fileName,
      equipmentIds: this.equipmentIds
    };
  }
};

// src/app/services/sync/sync-update.service.ts
var SyncUpdateService = class _SyncUpdateService {
  ngZone = inject(NgZone);
  destroyRef = inject(DestroyRef);
  platformId = inject(PLATFORM_ID);
  eventSource = null;
  reconnectAttempts = 0;
  maxReconnectAttempts = 10;
  // Increased from 5
  baseReconnectDelay = 1e3;
  // 1 second base delay
  maxReconnectDelay = 6e4;
  // Max 60 seconds between attempts
  // Connection state
  connectionStateSubject = new BehaviorSubject("disconnected");
  connectionState$ = this.connectionStateSubject.asObservable();
  // Subject for entity updates - components can subscribe to this
  entityUpdatedSubject = new Subject();
  entityUpdated$ = this.entityUpdatedSubject.asObservable();
  // Subject for sync complete events
  syncCompleteSubject = new Subject();
  syncComplete$ = this.syncCompleteSubject.asObservable();
  // Subject for specific entity type updates (e.g., 'LotoPoint')
  entityTypeUpdatedSubjects = /* @__PURE__ */ new Map();
  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.connect();
      this.destroyRef.onDestroy(() => {
        this.disconnect();
      });
    }
  }
  /**
   * Connect to the SSE endpoint
   */
  connect() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    if (this.eventSource) {
      return;
    }
    this.connectionStateSubject.next("connecting");
    const url = `${environment.baseApiUrl}/api/sync-updates/stream`;
    try {
      this.eventSource = new EventSource(url);
      this.eventSource.onopen = () => {
        this.ngZone.run(() => {
          console.log("SSE connected to sync updates");
          this.connectionStateSubject.next("connected");
          this.reconnectAttempts = 0;
        });
      };
      this.eventSource.addEventListener("connected", (event) => {
        this.ngZone.run(() => {
          console.log("SSE connection confirmed:", event.data);
        });
      });
      this.eventSource.addEventListener("entity_updated", (event) => {
        this.ngZone.run(() => {
          try {
            const data = JSON.parse(event.data);
            console.log("SSE entity update received:", data.entityType, "#", data.entityId);
            this.entityUpdatedSubject.next(data);
            const typeSubject = this.entityTypeUpdatedSubjects.get(data.entityType);
            if (typeSubject) {
              typeSubject.next(data);
            }
          } catch (e) {
            console.error("Error parsing entity update:", e);
          }
        });
      });
      this.eventSource.addEventListener("sync_complete", (event) => {
        this.ngZone.run(() => {
          try {
            const data = JSON.parse(event.data);
            console.log("SSE sync complete:", data);
            this.syncCompleteSubject.next(data);
          } catch (e) {
            console.error("Error parsing sync complete:", e);
          }
        });
      });
      this.eventSource.onerror = (error) => {
        this.ngZone.run(() => {
          console.error("SSE connection error:", error);
          this.connectionStateSubject.next("disconnected");
          this.handleReconnect();
        });
      };
    } catch (error) {
      console.error("Failed to create EventSource:", error);
      this.connectionStateSubject.next("disconnected");
      this.handleReconnect();
    }
  }
  /**
   * Handle reconnection with exponential backoff.
   * Delay doubles each attempt: 1s, 2s, 4s, 8s, 16s, 32s, 60s (capped), ...
   * With jitter to prevent thundering herd when server recovers.
   */
  handleReconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const exponentialDelay = this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      const cappedDelay = Math.min(exponentialDelay, this.maxReconnectDelay);
      const jitter = cappedDelay * 0.2 * (Math.random() * 2 - 1);
      const delay = Math.round(cappedDelay + jitter);
      console.log(`SSE reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.warn("SSE max reconnect attempts reached. Will retry in 5 minutes or on manual reconnect.");
      setTimeout(() => {
        this.reconnectAttempts = 0;
        this.connect();
      }, 5 * 60 * 1e3);
    }
  }
  /**
   * Disconnect from SSE
   */
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.connectionStateSubject.next("disconnected");
      console.log("SSE disconnected");
    }
  }
  /**
   * Get an observable for updates to a specific entity type.
   * Creates a new subject if one doesn't exist.
   *
   * @param entityType The entity type to listen for (e.g., 'LotoPoint', 'Equipment')
   */
  getEntityTypeUpdates$(entityType) {
    if (!this.entityTypeUpdatedSubjects.has(entityType)) {
      this.entityTypeUpdatedSubjects.set(entityType, new Subject());
    }
    return this.entityTypeUpdatedSubjects.get(entityType);
  }
  /**
   * Check if a specific entity was updated
   */
  wasEntityUpdated(event, entityType, entityId) {
    return event.entityType === entityType && event.entityId === entityId;
  }
  /**
   * Manual reconnect (for UI button)
   */
  reconnect() {
    this.reconnectAttempts = 0;
    this.disconnect();
    this.connect();
  }
  static \u0275fac = function SyncUpdateService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _SyncUpdateService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _SyncUpdateService, factory: _SyncUpdateService.\u0275fac, providedIn: "root" });
};

// src/app/services/loto-point-cache.service.ts
var LotoPointCacheService = class _LotoPointCacheService {
  apiService = inject(RfLotoPointApiService);
  syncUpdateService = inject(SyncUpdateService);
  destroyRef = inject(DestroyRef);
  // State
  summariesSubject = new BehaviorSubject([]);
  summaries$ = this.summariesSubject.asObservable();
  summariesLoadedSubject = new BehaviorSubject(false);
  summariesLoaded$ = this.summariesLoadedSubject.asObservable();
  summariesUpdatedSubject = new Subject();
  summariesUpdated$ = this.summariesUpdatedSubject.asObservable();
  isLoadingSubject = new BehaviorSubject(false);
  isLoading$ = this.isLoadingSubject.asObservable();
  errorSubject = new BehaviorSubject(null);
  error$ = this.errorSubject.asObservable();
  // Debounce SSE updates to avoid too many refreshes
  sseUpdateSubject = new Subject();
  constructor() {
    this.loadAllSummaries();
    this.syncUpdateService.getEntityTypeUpdates$("LotoPoint").pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        console.log("[LotoPointCache] SSE LotoPoint sync update received, queuing refresh");
        this.sseUpdateSubject.next();
      }
    });
    this.sseUpdateSubject.pipe(
      debounceTime(500),
      // Wait 500ms after last update before refreshing
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        console.log("[LotoPointCache] Refreshing cache after SSE sync updates");
        this.refresh();
      }
    });
  }
  /**
   * Load all LOTO point summaries from server
   * This is called once at app startup
   */
  loadAllSummaries() {
    this.isLoadingSubject.next(true);
    this.errorSubject.next(null);
    this.apiService.getSummaries().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        const summaries = response.responseData.map((s) => LotoPointSummaryDto.fromJson(s));
        this.summariesSubject.next(summaries);
        this.summariesLoadedSubject.next(true);
        this.isLoadingSubject.next(false);
        this.summariesUpdatedSubject.next();
      },
      error: (error) => {
        console.error("Error loading LOTO point summaries:", error);
        this.errorSubject.next(error.message || "Failed to load LOTO point summaries");
        this.isLoadingSubject.next(false);
        this.summariesLoadedSubject.next(true);
      }
    });
  }
  /**
   * Get all cached summaries
   */
  getAllSummaries() {
    return this.summariesSubject.getValue();
  }
  /**
   * Get summary by ID
   */
  getSummaryById(id) {
    return this.summariesSubject.getValue().find((s) => s.id === id);
  }
  /**
   * Filter summaries by criteria
   */
  filterSummaries(predicate) {
    return this.summariesSubject.getValue().filter(predicate);
  }
  /**
   * Refresh summaries from server
   */
  refresh() {
    this.loadAllSummaries();
  }
  /**
   * Trigger update notification without reloading
   * Use when a LOTO point is updated and you want to trigger UI refresh
   */
  notifyUpdated() {
    this.summariesUpdatedSubject.next();
  }
  static \u0275fac = function LotoPointCacheService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _LotoPointCacheService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _LotoPointCacheService, factory: _LotoPointCacheService.\u0275fac, providedIn: "root" });
};

// src/app/features/loto-points/refactored/services/rf-loto-point-left-menu.service.ts
var RfLotoPointLeftMenuService = class _RfLotoPointLeftMenuService {
  apiService = inject(RfLotoPointApiService);
  cacheService = inject(LotoPointCacheService);
  destroyRef = inject(DestroyRef);
  // State management for menu
  menuDataSubject = new BehaviorSubject([]);
  isLoadingSubject = new BehaviorSubject(false);
  errorSubject = new BehaviorSubject(null);
  // State management for selection
  selectedLotoPointSubject = new BehaviorSubject(null);
  selectedEquipmentSubject = new BehaviorSubject(null);
  selectedFileSubject = new BehaviorSubject(null);
  // Public observables for menu
  menuData$ = this.menuDataSubject.asObservable();
  isLoading$ = this.isLoadingSubject.asObservable();
  error$ = this.errorSubject.asObservable();
  // Public observables for selection
  selectedLotoPoint$ = this.selectedLotoPointSubject.asObservable();
  selectedEquipment$ = this.selectedEquipmentSubject.asObservable();
  selectedFile$ = this.selectedFileSubject.asObservable();
  // Cache for grouped menu data
  groupedDataCache = /* @__PURE__ */ new Map();
  // Track the last requested grouping to load it once cache is ready
  pendingGrouping = null;
  constructor() {
    this.cacheService.summariesLoaded$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (loaded) => {
        if (loaded) {
          this.isLoadingSubject.next(false);
          if (this.pendingGrouping) {
            const grouping = this.pendingGrouping;
            this.pendingGrouping = null;
            this.loadGroupedLotoPoints(grouping);
          }
        } else {
          this.isLoadingSubject.next(true);
        }
      },
      error: (error) => {
        this.errorSubject.next(error.message);
      }
    });
    this.cacheService.summariesUpdated$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.groupedDataCache.clear();
      }
    });
  }
  /**
   * Load LOTO points grouped by specified criteria
   * Uses cached summaries and groups them client-side for instant performance
   */
  loadGroupedLotoPoints(groupBy2) {
    const cachedGroupedData = this.groupedDataCache.get(groupBy2);
    if (cachedGroupedData) {
      this.menuDataSubject.next(cachedGroupedData);
      return;
    }
    const summaries = this.cacheService.getAllSummaries();
    if (summaries.length === 0) {
      this.pendingGrouping = groupBy2;
      this.isLoadingSubject.next(true);
      return;
    }
    const nestedItems = this.groupSummaries(summaries, groupBy2);
    this.groupedDataCache.set(groupBy2, nestedItems);
    this.menuDataSubject.next(nestedItems);
  }
  /**
   * Group LOTO point summaries by specified criteria (client-side)
   */
  groupSummaries(summaries, groupBy2) {
    const grouped = /* @__PURE__ */ new Map();
    summaries.forEach((summary) => {
      let groupKey;
      switch (groupBy2) {
        case "equipmentType":
          groupKey = summary.equipmentType || "Unknown";
          break;
        case "location":
          groupKey = summary.location || "Unknown";
          break;
        case "file":
          groupKey = summary.fileName || "Unknown";
          break;
        case "system":
          groupKey = summary.system || "Unknown";
          break;
        case "unit":
          groupKey = summary.unit || "Unknown";
          break;
        case "zeroEnergyMethod":
          groupKey = summary.zeroEnergyMethod || "Unknown";
          break;
        default:
          groupKey = "Unknown";
      }
      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, []);
      }
      grouped.get(groupKey).push(summary);
    });
    return Array.from(grouped.entries()).map(([groupName, summariesInGroup]) => {
      const parentItem = new NestedItemImpl({
        id: `${groupBy2}_${groupName}`,
        name: `${groupName} (${summariesInGroup.length})`,
        isExpanded: false,
        objectType: groupBy2,
        color: this.getGroupColor(groupBy2)
      });
      parentItem.values = summariesInGroup.map((summary) => new NestedItemImpl({
        id: summary.id.toString(),
        name: summary.tagNumber || `LOTO Point #${summary.id}`,
        subtitle: summary.description || void 0,
        isExpanded: false,
        objectType: "LotoPoint",
        color: this.getSummaryColor(summary)
      }));
      return parentItem;
    });
  }
  /**
   * Get display name for a LOTO point summary in the menu
   */
  getSummaryDisplayName(summary) {
    const parts = [];
    if (summary.tagNumber) {
      parts.push(summary.tagNumber);
    }
    if (summary.description) {
      parts.push(summary.description);
    }
    return parts.length > 0 ? parts.join(" - ") : `LOTO Point #${summary.id}`;
  }
  /**
   * Get color for LOTO point summary based on status
   */
  getSummaryColor(summary) {
    if (!summary.tagNumber || !summary.description) {
      return "red";
    }
    if (!summary.isVerified) {
      return "yellow";
    }
    return "green";
  }
  /**
   * Get color for group headers
   */
  getGroupColor(groupBy2) {
    const colorMap = {
      equipmentType: "#4CAF50",
      location: "#2196F3",
      file: "#FF9800",
      system: "#9C27B0",
      unit: "#00BCD4",
      zeroEnergyMethod: "#F44336"
    };
    return colorMap[groupBy2] || "#757575";
  }
  /**
   * Clear the cache for a specific grouping or all groupings
   */
  clearCache(groupBy2) {
    if (groupBy2) {
      this.groupedDataCache.delete(groupBy2);
    } else {
      this.groupedDataCache.clear();
    }
  }
  /**
   * Refresh data by clearing cache and reloading from server
   */
  refresh(groupBy2) {
    if (groupBy2) {
      this.clearCache(groupBy2);
    } else {
      this.clearCache();
    }
    this.cacheService.refresh();
  }
  /**
   * Select a LOTO point from NestedItem (toggle menu)
   * Fetches the full LOTO point data and navigates to associated equipment and file
   */
  selectLotoPointFromNestedItem(lotoPointItem) {
    if (lotoPointItem.objectType !== "LotoPoint") {
      return;
    }
    const lotoPointId = typeof lotoPointItem.id === "number" ? lotoPointItem.id.toString() : lotoPointItem.id;
    this.apiService.getLotoPointById(lotoPointId).pipe(takeUntilDestroyed(this.destroyRef), tap((response) => {
      const lotoPoint = response.responseData;
      this.selectedLotoPointSubject.next(lotoPoint);
      const equipmentList = lotoPoint.equipmentList;
      if (equipmentList && equipmentList.length > 0) {
        const firstEquipment = equipmentList[0];
        this.selectedEquipmentSubject.next(firstEquipment);
        if (firstEquipment.mainFileObject) {
          this.selectedFileSubject.next(firstEquipment.mainFileObject);
        } else if (firstEquipment.mainFileId) {
          const minimalFile = new FileDto({ id: firstEquipment.mainFileId });
          this.selectedFileSubject.next(minimalFile);
        } else {
          this.selectedFileSubject.next(null);
        }
      } else {
        this.selectedEquipmentSubject.next(null);
        this.selectedFileSubject.next(null);
      }
    }), catchError((error) => {
      this.errorSubject.next(error.message || "Failed to load LOTO point");
      return of(null);
    })).subscribe();
  }
  /**
   * Get the currently selected LOTO point
   */
  getSelectedLotoPoint() {
    return this.selectedLotoPointSubject.getValue();
  }
  /**
   * Get the currently selected equipment (from selected LOTO point)
   */
  getSelectedEquipment() {
    return this.selectedEquipmentSubject.getValue();
  }
  /**
   * Get the currently selected file (from selected equipment)
   */
  getSelectedFile() {
    return this.selectedFileSubject.getValue();
  }
  /**
   * Clear all selections
   */
  clearSelections() {
    this.selectedLotoPointSubject.next(null);
    this.selectedEquipmentSubject.next(null);
    this.selectedFileSubject.next(null);
  }
  /**
   * Reset service state (call when closing dialog or switching modes)
   */
  reset() {
    this.clearSelections();
  }
  static \u0275fac = function RfLotoPointLeftMenuService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _RfLotoPointLeftMenuService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _RfLotoPointLeftMenuService, factory: _RfLotoPointLeftMenuService.\u0275fac, providedIn: "root" });
};

// src/app/shared/reactive-form/refactored/input-fields/equipment-browser-dialog/equipment-browser-dialog.component.ts
var _forTrack06 = ($index, $item) => $item.value;
function EquipmentBrowserDialogComponent_Conditional_12_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 6)(1, "h3");
    \u0275\u0275text(2, "Select P&ID");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "app-rf-toggle-menu", 11);
    \u0275\u0275listener("itemClick", function EquipmentBrowserDialogComponent_Conditional_12_Template_app_rf_toggle_menu_itemClick_3_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onFileSelect($event));
    });
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275property("guideTooltipOnly", true);
    \u0275\u0275advance(3);
    \u0275\u0275property("menuItems", ctx_r1.fileMenuItems());
  }
}
function EquipmentBrowserDialogComponent_Conditional_13_For_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "option", 14);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const option_r4 = ctx.$implicit;
    \u0275\u0275property("value", option_r4.value);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(option_r4.label);
  }
}
function EquipmentBrowserDialogComponent_Conditional_13_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 15)(1, "p");
    \u0275\u0275text(2, "Loading LOTO points...");
    \u0275\u0275elementEnd()();
  }
}
function EquipmentBrowserDialogComponent_Conditional_13_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "app-rf-toggle-menu", 11);
    \u0275\u0275listener("itemClick", function EquipmentBrowserDialogComponent_Conditional_13_Conditional_8_Template_app_rf_toggle_menu_itemClick_0_listener($event) {
      \u0275\u0275restoreView(_r5);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.onLotoPointSelect($event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275property("menuItems", ctx_r1.lotoPointMenuItems());
  }
}
function EquipmentBrowserDialogComponent_Conditional_13_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 7)(1, "div", 12)(2, "h3");
    \u0275\u0275text(3, "Select LOTO Point");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "select", 13);
    \u0275\u0275listener("change", function EquipmentBrowserDialogComponent_Conditional_13_Template_select_change_4_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onGroupingChange($event));
    });
    \u0275\u0275repeaterCreate(5, EquipmentBrowserDialogComponent_Conditional_13_For_6_Template, 2, 2, "option", 14, _forTrack06);
    \u0275\u0275elementEnd()();
    \u0275\u0275template(7, EquipmentBrowserDialogComponent_Conditional_13_Conditional_7_Template, 3, 0, "div", 15)(8, EquipmentBrowserDialogComponent_Conditional_13_Conditional_8_Template, 1, 1, "app-rf-toggle-menu", 16);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(4);
    \u0275\u0275property("value", ctx_r1.lotoPointGrouping());
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r1.groupingOptions);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(ctx_r1.isLoadingLotoPoints() ? 7 : 8);
  }
}
function EquipmentBrowserDialogComponent_Conditional_15_Conditional_3_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 21);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    let tmp_3_0;
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" LOTO: ", (tmp_3_0 = ctx_r1.selectedLotoPoint()) == null ? null : tmp_3_0.tagNumber, " ");
  }
}
function EquipmentBrowserDialogComponent_Conditional_15_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 18)(1, "strong");
    \u0275\u0275text(2, "Selected:");
    \u0275\u0275elementEnd();
    \u0275\u0275text(3);
    \u0275\u0275template(4, EquipmentBrowserDialogComponent_Conditional_15_Conditional_3_Conditional_4_Template, 2, 1, "span", 21);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    let tmp_2_0;
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", (tmp_2_0 = ctx_r1.selectedEquipment()) == null ? null : tmp_2_0.tagNumber, " ");
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r1.selectedLotoPoint() ? 4 : -1);
  }
}
function EquipmentBrowserDialogComponent_Conditional_15_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 17)(1, "h3");
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275template(3, EquipmentBrowserDialogComponent_Conditional_15_Conditional_3_Template, 5, 2, "div", 18);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "div", 19)(5, "app-interactive-image", 20);
    \u0275\u0275listener("shapeClicked", function EquipmentBrowserDialogComponent_Conditional_15_Template_app_interactive_image_shapeClicked_5_listener($event) {
      \u0275\u0275restoreView(_r6);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onEquipmentSelected($event));
    });
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    let tmp_1_0;
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate((tmp_1_0 = ctx_r1.activeFile()) == null ? null : tmp_1_0.name);
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r1.selectedEquipment() ? 3 : -1);
    \u0275\u0275advance();
    \u0275\u0275property("guideTooltipOnly", true);
    \u0275\u0275advance();
    \u0275\u0275property("imageUrl", ctx_r1.activeFileLink())("shapesInput", ctx_r1.equipmentShapes())("preset", "EQUIPMENT_BROWSER");
  }
}
function EquipmentBrowserDialogComponent_Conditional_16_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p");
    \u0275\u0275text(1, "Select a P&ID file to view equipment");
    \u0275\u0275elementEnd();
  }
}
function EquipmentBrowserDialogComponent_Conditional_16_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p");
    \u0275\u0275text(1, "Select a LOTO point to view its location on the P&ID");
    \u0275\u0275elementEnd();
  }
}
function EquipmentBrowserDialogComponent_Conditional_16_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 9);
    \u0275\u0275template(1, EquipmentBrowserDialogComponent_Conditional_16_Conditional_1_Template, 2, 0, "p")(2, EquipmentBrowserDialogComponent_Conditional_16_Conditional_2_Template, 2, 0, "p");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r1.browseMode() === "file" ? 1 : 2);
  }
}
function EquipmentBrowserDialogComponent_Conditional_17_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 10)(1, "button", 22);
    \u0275\u0275listener("click", function EquipmentBrowserDialogComponent_Conditional_17_Template_button_click_1_listener() {
      \u0275\u0275restoreView(_r7);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onCancel());
    });
    \u0275\u0275text(2, " Cancel ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "button", 23);
    \u0275\u0275listener("click", function EquipmentBrowserDialogComponent_Conditional_17_Template_button_click_3_listener() {
      \u0275\u0275restoreView(_r7);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onConfirmSelection());
    });
    \u0275\u0275text(4, " Select Equipment ");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(3);
    \u0275\u0275property("disabled", !ctx_r1.selectedEquipment());
  }
}
var EquipmentBrowserDialogComponent = class _EquipmentBrowserDialogComponent {
  // Services
  fileService = inject(EquipmentDialogFileService);
  equipmentMapper = inject(EquipmentMapperService);
  currentFileService = inject(CurrentFileService);
  lotoPointMenuService = inject(RfLotoPointLeftMenuService);
  lotoPointApiService = inject(RfLotoPointApiService);
  // Inputs
  immediateSelection = input(false);
  // When true, emit equipmentSelected immediately on click (no confirm button needed)
  hideActions = input(false);
  // When true, hide the dialog action buttons
  // Outputs
  equipmentSelected = output();
  close = output();
  // Navigation mode
  browseMode = signal("file");
  // LOTO Point grouping
  lotoPointGrouping = signal("equipmentType");
  // Available grouping options
  groupingOptions = [
    { value: "equipmentType", label: "Equipment Type" },
    { value: "location", label: "Location" },
    { value: "file", label: "File" },
    { value: "system", label: "System" },
    { value: "unit", label: "Unit" },
    { value: "zeroEnergyMethod", label: "Zero Energy Method" }
  ];
  // State
  selectedEquipment = signal(null);
  highlightEquipmentId = signal(null);
  // Delegated to file service
  selectedFile = this.fileService.selectedFile;
  fileMenuItems = this.fileService.menuItems;
  currentFileLink = this.fileService.currentFileLink;
  // Delegated to LOTO point service
  lotoPointMenuItems = toSignal(this.lotoPointMenuService.menuData$, { initialValue: [] });
  isLoadingLotoPoints = toSignal(this.lotoPointMenuService.isLoading$, { initialValue: false });
  selectedLotoPoint = toSignal(this.lotoPointMenuService.selectedLotoPoint$, { initialValue: null });
  lotoPointSelectedEquipment = toSignal(this.lotoPointMenuService.selectedEquipment$, { initialValue: null });
  lotoPointSelectedFile = toSignal(this.lotoPointMenuService.selectedFile$, { initialValue: null });
  // Subscribe to CurrentFileService to get complete file data in LOTO point mode
  currentFile = toSignal(this.currentFileService.currentFile$, { initialValue: null });
  // Active file based on current mode
  activeFile = computed(() => {
    const mode = this.browseMode();
    if (mode === "lotoPoint") {
      return this.currentFile();
    } else {
      return this.selectedFile();
    }
  });
  // Active file link based on current mode
  activeFileLink = computed(() => {
    const file = this.activeFile();
    return file ? file.fileLink : "";
  });
  // Equipment from active file (works in both modes)
  equipment = computed(() => {
    const file = this.activeFile();
    if (!file)
      return [];
    return file.points ?? [];
  });
  // Equipment shapes for InteractiveImageComponent - reactive to both file and LOTO point selection
  equipmentShapes = computed(() => {
    const eq = this.equipment();
    if (!eq)
      return [];
    const shapes = eq.map((e) => this.equipmentMapper.mapToRfShape(e)).filter((s) => s !== null);
    const mode = this.browseMode();
    let highlightId = null;
    if (mode === "lotoPoint") {
      const lotoEquipment = this.lotoPointSelectedEquipment();
      highlightId = lotoEquipment?.id ?? null;
    } else {
      highlightId = this.highlightEquipmentId();
    }
    if (highlightId !== null) {
      shapes.forEach((shape) => {
        if (shape.id === highlightId) {
          shape.isSelected = true;
          shape.color = "#FF0000";
        }
      });
    }
    return shapes;
  });
  constructor() {
    effect(() => {
      const mode = this.browseMode();
      const grouping = this.lotoPointGrouping();
      if (mode === "lotoPoint") {
        this.lotoPointMenuService.loadGroupedLotoPoints(grouping);
      }
    });
  }
  onFileSelect(fileItem) {
    this.fileService.selectFileFromNestedItem(fileItem);
    this.selectedEquipment.set(null);
    this.highlightEquipmentId.set(null);
  }
  onLotoPointSelect(lotoPointItem) {
    this.lotoPointMenuService.selectLotoPointFromNestedItem(lotoPointItem);
    const selectedFile = this.lotoPointMenuService.getSelectedFile();
    if (selectedFile) {
      this.currentFileService.setCurrentFile(selectedFile);
    }
  }
  onBrowseModeChange(mode) {
    this.browseMode.set(mode);
    this.selectedEquipment.set(null);
    this.highlightEquipmentId.set(null);
    if (mode !== "lotoPoint") {
      this.lotoPointMenuService.clearSelections();
    }
  }
  onGroupingChange(event) {
    const select = event.target;
    const grouping = select.value;
    this.lotoPointGrouping.set(grouping);
  }
  onConfirmSelection() {
    const equipment = this.selectedEquipment();
    const file = this.activeFile();
    if (equipment && file) {
      const enrichedEquipment = new EquipmentDto(__spreadProps(__spreadValues({}, equipment), {
        mainFileId: file.id,
        mainFileObject: file
      }));
      this.equipmentSelected.emit(enrichedEquipment);
      this.reset();
    }
  }
  onCancel() {
    this.reset();
    this.close.emit();
  }
  onEquipmentSelected(shape) {
    console.log("Selected equipment:", shape.id);
    const selectedId = shape.id;
    if (selectedId !== null) {
      const eq = this.equipment();
      if (eq) {
        const selected = eq.find((e) => e.id === selectedId);
        if (selected) {
          console.log("Selected equipment:", selected);
          this.selectedEquipment.set(selected);
          this.highlightEquipmentId.set(selectedId);
          if (this.immediateSelection()) {
            const file = this.activeFile();
            if (file) {
              const enrichedEquipment = new EquipmentDto(__spreadProps(__spreadValues({}, selected), {
                mainFileId: file.id,
                mainFileObject: file
              }));
              this.equipmentSelected.emit(enrichedEquipment);
            }
          }
        }
      }
    }
  }
  reset() {
    this.fileService.reset();
    this.lotoPointMenuService.reset();
    this.selectedEquipment.set(null);
    this.highlightEquipmentId.set(null);
    this.browseMode.set("file");
  }
  static \u0275fac = function EquipmentBrowserDialogComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _EquipmentBrowserDialogComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _EquipmentBrowserDialogComponent, selectors: [["app-equipment-browser-dialog"]], inputs: { immediateSelection: [1, "immediateSelection"], hideActions: [1, "hideActions"] }, outputs: { equipmentSelected: "equipmentSelected", close: "close" }, features: [\u0275\u0275ProvidersFeature([EquipmentDialogFileService])], decls: 18, vars: 8, consts: [[1, "dialog-container"], [1, "dialog-content"], [1, "navigation-panel"], [1, "mode-toggle"], ["type", "button", 1, "mode-btn", 3, "click"], [1, "icon"], ["appGuide", "create-loto-point:file-selector", "guideMessage", "Expand folders and click on a P&ID file to load it. The file's equipment will be displayed on the right.", 1, "menu-container", 3, "guideTooltipOnly"], [1, "menu-container"], [1, "viewer-panel"], [1, "no-selection"], [1, "dialog-actions"], [3, "itemClick", "menuItems"], [1, "menu-header"], [1, "grouping-select", 3, "change", "value"], [3, "value"], [1, "loading"], [3, "menuItems"], [1, "viewer-header"], [1, "selected-equipment-info"], ["appGuide", "create-loto-point:image-viewer", "guideMessage", "Click on an equipment shape to select it. Selected equipment will be highlighted in red.", 1, "viewer-content", 3, "guideTooltipOnly"], [3, "shapeClicked", "imageUrl", "shapesInput", "preset"], [1, "loto-point-badge"], ["type", "button", 1, "btn-cancel", 3, "click"], ["type", "button", 1, "btn-select", 3, "click", "disabled"]], template: function EquipmentBrowserDialogComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "div", 2)(3, "div", 3)(4, "button", 4);
      \u0275\u0275listener("click", function EquipmentBrowserDialogComponent_Template_button_click_4_listener() {
        return ctx.onBrowseModeChange("file");
      });
      \u0275\u0275elementStart(5, "span", 5);
      \u0275\u0275text(6, "\u{1F4C1}");
      \u0275\u0275elementEnd();
      \u0275\u0275text(7, " By File ");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(8, "button", 4);
      \u0275\u0275listener("click", function EquipmentBrowserDialogComponent_Template_button_click_8_listener() {
        return ctx.onBrowseModeChange("lotoPoint");
      });
      \u0275\u0275elementStart(9, "span", 5);
      \u0275\u0275text(10, "\u{1F512}");
      \u0275\u0275elementEnd();
      \u0275\u0275text(11, " By LOTO Point ");
      \u0275\u0275elementEnd()();
      \u0275\u0275template(12, EquipmentBrowserDialogComponent_Conditional_12_Template, 4, 2, "div", 6)(13, EquipmentBrowserDialogComponent_Conditional_13_Template, 9, 2, "div", 7);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(14, "div", 8);
      \u0275\u0275template(15, EquipmentBrowserDialogComponent_Conditional_15_Template, 6, 6)(16, EquipmentBrowserDialogComponent_Conditional_16_Template, 3, 1, "div", 9);
      \u0275\u0275elementEnd()();
      \u0275\u0275template(17, EquipmentBrowserDialogComponent_Conditional_17_Template, 5, 1, "div", 10);
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      \u0275\u0275advance(4);
      \u0275\u0275classProp("active", ctx.browseMode() === "file");
      \u0275\u0275advance(4);
      \u0275\u0275classProp("active", ctx.browseMode() === "lotoPoint");
      \u0275\u0275advance(4);
      \u0275\u0275conditional(ctx.browseMode() === "file" ? 12 : -1);
      \u0275\u0275advance();
      \u0275\u0275conditional(ctx.browseMode() === "lotoPoint" ? 13 : -1);
      \u0275\u0275advance(2);
      \u0275\u0275conditional(ctx.activeFile() ? 15 : 16);
      \u0275\u0275advance(2);
      \u0275\u0275conditional(!ctx.hideActions() ? 17 : -1);
    }
  }, dependencies: [CommonModule, InteractiveImageComponent, RfToggleMenuComponent, GuideDirective], styles: ["\n\n.dialog-container[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  height: 100%;\n  min-height: 0;\n}\n.dialog-content[_ngcontent-%COMP%] {\n  display: flex;\n  flex: 1;\n  gap: 1rem;\n  overflow: hidden;\n}\n.navigation-panel[_ngcontent-%COMP%] {\n  width: 300px;\n  display: flex;\n  flex-direction: column;\n  border-right: 1px solid #ddd;\n  padding-right: 1rem;\n  gap: 0.75rem;\n  min-height: 0;\n}\n.mode-toggle[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 0.5rem;\n  border-bottom: 2px solid #e0e0e0;\n  padding-bottom: 0.75rem;\n  flex-shrink: 0;\n}\n.mode-btn[_ngcontent-%COMP%] {\n  flex: 1;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  gap: 0.5rem;\n  padding: 0.6rem 0.75rem;\n  border: 1px solid #ddd;\n  border-radius: 6px;\n  background-color: #f8f9fa;\n  color: #495057;\n  font-size: 0.9rem;\n  font-weight: 500;\n  cursor: pointer;\n  transition: all 0.2s ease;\n}\n.mode-btn[_ngcontent-%COMP%]:hover {\n  background-color: #e9ecef;\n  border-color: #adb5bd;\n}\n.mode-btn.active[_ngcontent-%COMP%] {\n  background-color: #007bff;\n  color: white;\n  border-color: #007bff;\n  box-shadow: 0 2px 4px rgba(0, 123, 255, 0.2);\n}\n.mode-btn[_ngcontent-%COMP%]   .icon[_ngcontent-%COMP%] {\n  font-size: 1.1rem;\n}\n.menu-container[_ngcontent-%COMP%] {\n  flex: 1;\n  display: flex;\n  flex-direction: column;\n  overflow: hidden;\n  min-height: 0;\n  height: 100%;\n}\n.menu-container[_ngcontent-%COMP%]   app-rf-toggle-menu[_ngcontent-%COMP%] {\n  flex: 1;\n  display: flex;\n  min-height: 0;\n  height: 100%;\n}\n.menu-container[_ngcontent-%COMP%]   h3[_ngcontent-%COMP%] {\n  margin: 0 0 0.75rem 0;\n  font-size: 1rem;\n  color: #333;\n  font-weight: 600;\n  flex-shrink: 0;\n}\n.menu-header[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 0.5rem;\n  margin-bottom: 0.75rem;\n  flex-shrink: 0;\n}\n.grouping-select[_ngcontent-%COMP%] {\n  padding: 0.5rem;\n  border: 1px solid #ddd;\n  border-radius: 4px;\n  font-size: 0.85rem;\n  background-color: white;\n  cursor: pointer;\n  transition: border-color 0.2s;\n}\n.grouping-select[_ngcontent-%COMP%]:hover {\n  border-color: #007bff;\n}\n.grouping-select[_ngcontent-%COMP%]:focus {\n  outline: none;\n  border-color: #007bff;\n  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);\n}\n.loading[_ngcontent-%COMP%] {\n  flex: 1;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  padding: 2rem;\n  color: #6c757d;\n  font-size: 0.9rem;\n  min-height: 0;\n}\n.file-list-panel[_ngcontent-%COMP%] {\n  width: 250px;\n  display: flex;\n  flex-direction: column;\n  border-right: 1px solid #ddd;\n  padding-right: 1rem;\n}\n.file-list-panel[_ngcontent-%COMP%]   h3[_ngcontent-%COMP%] {\n  margin: 0 0 1rem 0;\n  font-size: 1.1rem;\n  color: #333;\n}\n.file-list[_ngcontent-%COMP%] {\n  flex: 1;\n  overflow-y: auto;\n  border: 1px solid #ddd;\n  border-radius: 4px;\n}\n.file-item[_ngcontent-%COMP%] {\n  padding: 0.75rem;\n  cursor: pointer;\n  border-bottom: 1px solid #eee;\n  transition: background-color 0.2s;\n}\n.file-item[_ngcontent-%COMP%]:hover {\n  background-color: #f5f5f5;\n}\n.file-item.selected[_ngcontent-%COMP%] {\n  background-color: #007bff;\n  color: white;\n}\n.file-name[_ngcontent-%COMP%] {\n  font-size: 0.9rem;\n  word-break: break-word;\n}\n.no-files[_ngcontent-%COMP%] {\n  padding: 1rem;\n  text-align: center;\n  color: #999;\n}\n.viewer-panel[_ngcontent-%COMP%] {\n  flex: 1;\n  display: flex;\n  flex-direction: column;\n  min-width: 0;\n}\n.viewer-header[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  margin-bottom: 1rem;\n  padding-bottom: 0.5rem;\n  border-bottom: 1px solid #ddd;\n  gap: 1rem;\n}\n.viewer-header[_ngcontent-%COMP%]   h3[_ngcontent-%COMP%] {\n  margin: 0;\n  font-size: 1.1rem;\n  color: #333;\n  flex-shrink: 0;\n}\n.selected-equipment-info[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.75rem;\n  padding: 0.5rem 1rem;\n  background-color: #e7f3ff;\n  border-radius: 4px;\n  font-size: 0.9rem;\n  color: #0056b3;\n  flex-shrink: 0;\n}\n.loto-point-badge[_ngcontent-%COMP%] {\n  padding: 0.25rem 0.75rem;\n  background-color: #28a745;\n  color: white;\n  border-radius: 12px;\n  font-size: 0.85rem;\n  font-weight: 500;\n  white-space: nowrap;\n}\n.viewer-content[_ngcontent-%COMP%] {\n  flex: 1;\n  overflow: hidden;\n  border: 1px solid #ddd;\n  border-radius: 4px;\n  background-color: #f9f9f9;\n}\n.no-selection[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  height: 100%;\n  color: #999;\n  font-size: 1rem;\n}\n.no-selection[_ngcontent-%COMP%]   p[_ngcontent-%COMP%] {\n  text-align: center;\n  max-width: 300px;\n}\n.dialog-actions[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: flex-end;\n  gap: 0.5rem;\n  margin-top: 1rem;\n  padding-top: 1rem;\n  border-top: 1px solid #ddd;\n}\n.btn-cancel[_ngcontent-%COMP%], \n.btn-select[_ngcontent-%COMP%] {\n  padding: 0.5rem 1.5rem;\n  border: none;\n  border-radius: 4px;\n  font-size: 1rem;\n  cursor: pointer;\n  transition: background-color 0.2s;\n  font-weight: 500;\n}\n.btn-cancel[_ngcontent-%COMP%] {\n  background-color: #6c757d;\n  color: white;\n}\n.btn-cancel[_ngcontent-%COMP%]:hover {\n  background-color: #5a6268;\n}\n.btn-select[_ngcontent-%COMP%] {\n  background-color: #007bff;\n  color: white;\n}\n.btn-select[_ngcontent-%COMP%]:hover:not(:disabled) {\n  background-color: #0056b3;\n}\n.btn-select[_ngcontent-%COMP%]:disabled {\n  background-color: #ccc;\n  cursor: not-allowed;\n  opacity: 0.6;\n}\n@media (max-width: 768px) {\n  .navigation-panel[_ngcontent-%COMP%] {\n    width: 250px;\n  }\n  .mode-btn[_ngcontent-%COMP%] {\n    flex-direction: column;\n    padding: 0.5rem;\n    font-size: 0.8rem;\n  }\n  .mode-btn[_ngcontent-%COMP%]   .icon[_ngcontent-%COMP%] {\n    font-size: 1.2rem;\n  }\n}\n/*# sourceMappingURL=equipment-browser-dialog.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(EquipmentBrowserDialogComponent, { className: "EquipmentBrowserDialogComponent", filePath: "src/app/shared/reactive-form/refactored/input-fields/equipment-browser-dialog/equipment-browser-dialog.component.ts", lineNumber: 24 });
})();

// src/app/shared/reactive-form/refactored/input-fields/equipment-browser-input/equipment-browser-input.component.ts
function EquipmentBrowserInputComponent_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 9);
    \u0275\u0275listener("click", function EquipmentBrowserInputComponent_Conditional_7_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.clearSelection());
    });
    \u0275\u0275text(1, " \xD7 ");
    \u0275\u0275elementEnd();
  }
}
var EquipmentBrowserInputComponent = class _EquipmentBrowserInputComponent {
  label = "Select Equipment";
  placeholder = "No equipment selected";
  // State
  isDialogOpen = signal(false);
  selectedEquipment = signal(null);
  // ControlValueAccessor
  value = null;
  // Store equipment ID
  onChange = () => {
  };
  onTouched = () => {
  };
  disabled = false;
  writeValue(value) {
    this.value = value;
  }
  registerOnChange(fn) {
    this.onChange = fn;
  }
  registerOnTouched(fn) {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled) {
    this.disabled = isDisabled;
  }
  openDialog() {
    if (!this.disabled) {
      this.isDialogOpen.set(true);
    }
  }
  closeDialog() {
    this.isDialogOpen.set(false);
  }
  onEquipmentSelected(equipment) {
    this.selectedEquipment.set(equipment);
    this.value = equipment.id ?? null;
    this.onChange(this.value);
    this.onTouched();
    this.closeDialog();
  }
  clearSelection() {
    if (!this.disabled) {
      this.selectedEquipment.set(null);
      this.value = null;
      this.onChange(this.value);
      this.onTouched();
    }
  }
  getDisplayText() {
    const equipment = this.selectedEquipment();
    if (equipment) {
      return equipment.tagNumber || `Equipment #${equipment.id}`;
    }
    return this.value ? `Equipment ID: ${this.value}` : this.placeholder;
  }
  static \u0275fac = function EquipmentBrowserInputComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _EquipmentBrowserInputComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _EquipmentBrowserInputComponent, selectors: [["app-equipment-browser-input"]], inputs: { label: "label", placeholder: "placeholder" }, features: [\u0275\u0275ProvidersFeature([
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => _EquipmentBrowserInputComponent),
      multi: true
    }
  ])], decls: 12, vars: 9, consts: [[1, "equipment-browser-input"], [1, "input-label"], [1, "input-container"], [1, "selected-display"], [1, "display-text"], ["type", "button", "title", "Clear selection", 1, "clear-btn"], ["type", "button", 1, "browse-btn", 3, "click", "disabled"], [3, "close", "isOpen", "title", "size"], [3, "equipmentSelected", "close"], ["type", "button", "title", "Clear selection", 1, "clear-btn", 3, "click"]], template: function EquipmentBrowserInputComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "label", 1);
      \u0275\u0275text(2);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(3, "div", 2)(4, "div", 3)(5, "span", 4);
      \u0275\u0275text(6);
      \u0275\u0275elementEnd();
      \u0275\u0275template(7, EquipmentBrowserInputComponent_Conditional_7_Template, 2, 0, "button", 5);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(8, "button", 6);
      \u0275\u0275listener("click", function EquipmentBrowserInputComponent_Template_button_click_8_listener() {
        return ctx.openDialog();
      });
      \u0275\u0275text(9, " Browse P&ID ");
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(10, "app-rf-popup-projection", 7);
      \u0275\u0275listener("close", function EquipmentBrowserInputComponent_Template_app_rf_popup_projection_close_10_listener() {
        return ctx.closeDialog();
      });
      \u0275\u0275elementStart(11, "app-equipment-browser-dialog", 8);
      \u0275\u0275listener("equipmentSelected", function EquipmentBrowserInputComponent_Template_app_equipment_browser_dialog_equipmentSelected_11_listener($event) {
        return ctx.onEquipmentSelected($event);
      })("close", function EquipmentBrowserInputComponent_Template_app_equipment_browser_dialog_close_11_listener() {
        return ctx.closeDialog();
      });
      \u0275\u0275elementEnd()();
    }
    if (rf & 2) {
      \u0275\u0275advance(2);
      \u0275\u0275textInterpolate(ctx.label);
      \u0275\u0275advance(2);
      \u0275\u0275classProp("disabled", ctx.disabled);
      \u0275\u0275advance(2);
      \u0275\u0275textInterpolate(ctx.getDisplayText());
      \u0275\u0275advance();
      \u0275\u0275conditional(ctx.selectedEquipment() && !ctx.disabled ? 7 : -1);
      \u0275\u0275advance();
      \u0275\u0275property("disabled", ctx.disabled);
      \u0275\u0275advance(2);
      \u0275\u0275property("isOpen", ctx.isDialogOpen())("title", "Select Equipment from P&ID")("size", "large");
    }
  }, dependencies: [CommonModule, RfPopupProjectionComponent, EquipmentBrowserDialogComponent], styles: ["\n\n.equipment-browser-input[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 0.5rem;\n}\n.input-label[_ngcontent-%COMP%] {\n  font-weight: 500;\n  color: #333;\n  font-size: 0.9rem;\n}\n.input-container[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 0.5rem;\n  align-items: stretch;\n}\n.selected-display[_ngcontent-%COMP%] {\n  flex: 1;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 0.5rem 1rem;\n  border: 1px solid #ccc;\n  border-radius: 4px;\n  background-color: #fff;\n  min-height: 38px;\n}\n.selected-display.disabled[_ngcontent-%COMP%] {\n  background-color: #f5f5f5;\n  color: #999;\n  cursor: not-allowed;\n}\n.display-text[_ngcontent-%COMP%] {\n  flex: 1;\n  font-size: 0.9rem;\n  color: #333;\n}\n.selected-display.disabled[_ngcontent-%COMP%]   .display-text[_ngcontent-%COMP%] {\n  color: #999;\n}\n.clear-btn[_ngcontent-%COMP%] {\n  background: none;\n  border: none;\n  font-size: 1.5rem;\n  color: #999;\n  cursor: pointer;\n  padding: 0;\n  width: 24px;\n  height: 24px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  border-radius: 50%;\n  transition: background-color 0.2s, color 0.2s;\n}\n.clear-btn[_ngcontent-%COMP%]:hover {\n  background-color: #f0f0f0;\n  color: #333;\n}\n.browse-btn[_ngcontent-%COMP%] {\n  padding: 0.5rem 1.5rem;\n  background-color: #007bff;\n  color: white;\n  border: none;\n  border-radius: 4px;\n  font-size: 0.9rem;\n  cursor: pointer;\n  white-space: nowrap;\n  transition: background-color 0.2s;\n}\n.browse-btn[_ngcontent-%COMP%]:hover:not(:disabled) {\n  background-color: #0056b3;\n}\n.browse-btn[_ngcontent-%COMP%]:disabled {\n  background-color: #ccc;\n  cursor: not-allowed;\n  opacity: 0.6;\n}\n/*# sourceMappingURL=equipment-browser-input.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(EquipmentBrowserInputComponent, { className: "EquipmentBrowserInputComponent", filePath: "src/app/shared/reactive-form/refactored/input-fields/equipment-browser-input/equipment-browser-input.component.ts", lineNumber: 22 });
})();

// src/app/features/equipment/refactored/services/rf-equipment.service.ts
var RfEquipmentService = class _RfEquipmentService {
  mapperService = inject(EquipmentMapperService);
  oldApiService = inject(EquipmentService);
  destroyRef = inject(DestroyRef);
  saveEquipmentFromShape(shape) {
    const equipment = this.mapperService.shapeToEquipment(shape);
    if (!equipment) {
      return of(null);
    }
    return this.oldApiService.updateEquipment(equipment).pipe(takeUntilDestroyed(this.destroyRef), map((resp) => {
      if (resp && resp.responseData) {
        return new EquipmentDto(resp.responseData);
      }
      return null;
    }), catchError((err) => {
      console.error("Error updating equipment:", err);
      return of(null);
    }));
  }
  static \u0275fac = function RfEquipmentService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _RfEquipmentService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _RfEquipmentService, factory: _RfEquipmentService.\u0275fac, providedIn: "root" });
};

// src/app/shared/reactive-form/refactored/input-fields/equipment-shape-drawer-dialog/equipment-shape-drawer-dialog.component.ts
function EquipmentShapeDrawerDialogComponent_Conditional_7_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 16);
    \u0275\u0275listener("click", function EquipmentShapeDrawerDialogComponent_Conditional_7_Conditional_4_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.startDrawing());
    });
    \u0275\u0275text(1, " Start Drawing ");
    \u0275\u0275elementEnd();
  }
}
function EquipmentShapeDrawerDialogComponent_Conditional_7_Conditional_5_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 18);
    \u0275\u0275text(1, "Shape created!");
    \u0275\u0275elementEnd();
  }
}
function EquipmentShapeDrawerDialogComponent_Conditional_7_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 12)(1, "span", 17);
    \u0275\u0275text(2, "Draw a rectangle or place a symbol on the P&ID");
    \u0275\u0275elementEnd();
    \u0275\u0275template(3, EquipmentShapeDrawerDialogComponent_Conditional_7_Conditional_5_Conditional_3_Template, 2, 0, "span", 18);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(3);
    \u0275\u0275conditional(ctx_r2.drawnShape() ? 3 : -1);
  }
}
function EquipmentShapeDrawerDialogComponent_Conditional_7_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 15);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r2.error(), " ");
  }
}
function EquipmentShapeDrawerDialogComponent_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 9)(1, "h3");
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "div", 10);
    \u0275\u0275template(4, EquipmentShapeDrawerDialogComponent_Conditional_7_Conditional_4_Template, 2, 0, "button", 11)(5, EquipmentShapeDrawerDialogComponent_Conditional_7_Conditional_5_Template, 4, 1, "div", 12);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(6, "div", 13)(7, "app-interactive-image", 14);
    \u0275\u0275listener("shapeDrawn", function EquipmentShapeDrawerDialogComponent_Conditional_7_Template_app_interactive_image_shapeDrawn_7_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onShapeDrawn($event));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275template(8, EquipmentShapeDrawerDialogComponent_Conditional_7_Conditional_8_Template, 2, 1, "div", 15);
  }
  if (rf & 2) {
    let tmp_1_0;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate((tmp_1_0 = ctx_r2.selectedFile()) == null ? null : tmp_1_0.name);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(!ctx_r2.isDrawingMode() ? 4 : 5);
    \u0275\u0275advance(2);
    \u0275\u0275property("guideTooltipOnly", true);
    \u0275\u0275advance();
    \u0275\u0275property("imageUrl", ctx_r2.currentFileLink())("shapesInput", ctx_r2.equipmentShapes())("preset", "EQUIPMENT_DRAWER");
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r2.error() ? 8 : -1);
  }
}
function EquipmentShapeDrawerDialogComponent_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 5)(1, "p");
    \u0275\u0275text(2, "Select a P&ID file to draw equipment");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "p", 19);
    \u0275\u0275text(4, "\u270F\uFE0F Right-click and drag to draw a rectangle shape");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "p", 19);
    \u0275\u0275text(6, "\u2B50 Use toolbar Symbol button to place P&ID symbols");
    \u0275\u0275elementEnd()();
  }
}
function EquipmentShapeDrawerDialogComponent_Conditional_12_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " Saving... ");
  }
}
function EquipmentShapeDrawerDialogComponent_Conditional_12_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " Confirm Shape ");
  }
}
function EquipmentShapeDrawerDialogComponent_Conditional_12_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 20);
    \u0275\u0275listener("click", function EquipmentShapeDrawerDialogComponent_Conditional_12_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onConfirmShape());
    });
    \u0275\u0275template(1, EquipmentShapeDrawerDialogComponent_Conditional_12_Conditional_1_Template, 1, 0)(2, EquipmentShapeDrawerDialogComponent_Conditional_12_Conditional_2_Template, 1, 0);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275property("disabled", !ctx_r2.canConfirm() || ctx_r2.isLoading());
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r2.isLoading() ? 1 : 2);
  }
}
var EquipmentShapeDrawerDialogComponent = class _EquipmentShapeDrawerDialogComponent {
  interactiveImage;
  // Services
  fileService = inject(EquipmentDialogFileService);
  equipmentService = inject(RfEquipmentService);
  equipmentMapper = inject(EquipmentMapperService);
  destroyRef = inject(DestroyRef);
  // Inputs
  /** Enable LOTO point creation mode - saves equipment and emits for parent to open LOTO form */
  enableLotoPointCreation = input(false);
  // Outputs
  shapeDrawn = output();
  saveSuccess = output();
  /** Emitted when equipment is saved and ready for LOTO point creation (parent should open form) */
  equipmentReadyForLotoPoint = output();
  close = output();
  // State
  drawnShape = signal(null);
  isDrawingMode = signal(false);
  isLoading = signal(false);
  error = signal(null);
  // Delegated to shared service
  selectedFile = this.fileService.selectedFile;
  menuItems = this.fileService.menuItems;
  currentFileLink = this.fileService.currentFileLink;
  // Equipment from selected file
  equipment = computed(() => {
    const file = this.selectedFile();
    if (!file)
      return [];
    return file.points ?? [];
  });
  equipmentShapes = computed(() => {
    const equipment = this.equipment();
    if (!equipment)
      return [];
    return this.equipmentMapper.mapAllToRfShapes(equipment);
  });
  onFileSelect(fileItem) {
    this.fileService.selectFileFromNestedItem(fileItem);
    this.drawnShape.set(null);
    this.isDrawingMode.set(false);
  }
  startDrawing() {
    this.isDrawingMode.set(true);
    this.drawnShape.set(null);
  }
  onConfirmShape() {
    const shape = this.drawnShape();
    const file = this.selectedFile();
    if (shape && file) {
      this.isLoading.set(true);
      this.error.set(null);
      const shapeWithFileContext = __spreadProps(__spreadValues({}, shape), { fileId: file.id });
      this.equipmentService.saveEquipmentFromShape(shapeWithFileContext).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (savedEquipment) => {
          this.isLoading.set(false);
          if (savedEquipment) {
            const enrichedEquipment = new EquipmentDto(__spreadProps(__spreadValues({}, savedEquipment), {
              mainFileId: file.id,
              mainFileObject: file
            }));
            this.saveSuccess.emit(enrichedEquipment);
            this.close.emit();
          } else {
            this.error.set("Failed to save the equipment.");
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          this.error.set("An error occurred while saving the equipment.");
          console.error(err);
        }
      });
    }
  }
  onCancel() {
    this.fileService.reset();
    this.close.emit();
  }
  canConfirm() {
    return this.drawnShape() !== null && this.selectedFile() !== null;
  }
  onShapeDrawn($event) {
    this.drawnShape.set($event);
    this.isDrawingMode.set(false);
    if (this.selectedFile()) {
      this.shapeDrawn.emit({ shape: $event, file: this.selectedFile() });
      if (this.enableLotoPointCreation()) {
        this.saveEquipmentForLotoPoint($event);
      }
    }
  }
  /**
   * Saves the drawn equipment shape and emits event for parent to open LOTO point form
   */
  saveEquipmentForLotoPoint(shape) {
    const file = this.selectedFile();
    if (!file)
      return;
    this.isLoading.set(true);
    this.error.set(null);
    const shapeWithFileContext = __spreadProps(__spreadValues({}, shape), { fileId: file.id });
    this.equipmentService.saveEquipmentFromShape(shapeWithFileContext).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (savedEquipment) => {
        this.isLoading.set(false);
        if (savedEquipment) {
          const enrichedEquipment = new EquipmentDto(__spreadProps(__spreadValues({}, savedEquipment), {
            mainFileId: file.id,
            mainFileObject: file
          }));
          this.equipmentReadyForLotoPoint.emit(enrichedEquipment);
          this.drawnShape.set(null);
        } else {
          this.error.set("Failed to save the equipment.");
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.set("An error occurred while saving the equipment.");
        console.error(err);
      }
    });
  }
  static \u0275fac = function EquipmentShapeDrawerDialogComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _EquipmentShapeDrawerDialogComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _EquipmentShapeDrawerDialogComponent, selectors: [["app-equipment-shape-drawer-dialog"]], viewQuery: function EquipmentShapeDrawerDialogComponent_Query(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275viewQuery(InteractiveImageComponent, 5);
    }
    if (rf & 2) {
      let _t;
      \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.interactiveImage = _t.first);
    }
  }, inputs: { enableLotoPointCreation: [1, "enableLotoPointCreation"] }, outputs: { shapeDrawn: "shapeDrawn", saveSuccess: "saveSuccess", equipmentReadyForLotoPoint: "equipmentReadyForLotoPoint", close: "close" }, features: [\u0275\u0275ProvidersFeature([EquipmentDialogFileService])], decls: 13, vars: 4, consts: [[1, "dialog-container"], [1, "dialog-content"], ["appGuide", "create-loto-point:file-selector", "guideMessage", "Expand folders and click on a P&ID file to load it. You can then draw equipment shapes or place symbols on the image.", 1, "file-list-panel", 3, "guideTooltipOnly"], [3, "itemClick", "menuItems"], [1, "viewer-panel"], [1, "no-selection"], [1, "dialog-actions"], ["type", "button", 1, "btn-cancel", 3, "click"], ["type", "button", 1, "btn-confirm", 3, "disabled"], [1, "viewer-header"], [1, "drawing-controls"], ["type", "button", 1, "btn-start-drawing"], [1, "drawing-status"], ["appGuide", "create-loto-point:image-drawer", "guideMessage", "Right-click and drag to draw a rectangle, or use the Symbol button in the toolbar to place P&ID symbols.", 1, "viewer-content", 3, "guideTooltipOnly"], [3, "shapeDrawn", "imageUrl", "shapesInput", "preset"], [1, "error-message"], ["type", "button", 1, "btn-start-drawing", 3, "click"], [1, "status-text"], [1, "shape-info"], [1, "hint"], ["type", "button", 1, "btn-confirm", 3, "click", "disabled"]], template: function EquipmentShapeDrawerDialogComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "div", 2)(3, "h3");
      \u0275\u0275text(4, "Select P&ID");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(5, "app-rf-toggle-menu", 3);
      \u0275\u0275listener("itemClick", function EquipmentShapeDrawerDialogComponent_Template_app_rf_toggle_menu_itemClick_5_listener($event) {
        return ctx.onFileSelect($event);
      });
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(6, "div", 4);
      \u0275\u0275template(7, EquipmentShapeDrawerDialogComponent_Conditional_7_Template, 9, 7)(8, EquipmentShapeDrawerDialogComponent_Conditional_8_Template, 7, 0, "div", 5);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(9, "div", 6)(10, "button", 7);
      \u0275\u0275listener("click", function EquipmentShapeDrawerDialogComponent_Template_button_click_10_listener() {
        return ctx.onCancel();
      });
      \u0275\u0275text(11, " Cancel ");
      \u0275\u0275elementEnd();
      \u0275\u0275template(12, EquipmentShapeDrawerDialogComponent_Conditional_12_Template, 3, 2, "button", 8);
      \u0275\u0275elementEnd()();
    }
    if (rf & 2) {
      \u0275\u0275advance(2);
      \u0275\u0275property("guideTooltipOnly", true);
      \u0275\u0275advance(3);
      \u0275\u0275property("menuItems", ctx.menuItems());
      \u0275\u0275advance(2);
      \u0275\u0275conditional(ctx.selectedFile() ? 7 : 8);
      \u0275\u0275advance(5);
      \u0275\u0275conditional(!ctx.enableLotoPointCreation() ? 12 : -1);
    }
  }, dependencies: [
    CommonModule,
    InteractiveImageComponent,
    RfToggleMenuComponent,
    GuideDirective
  ], styles: ["\n\n.dialog-container[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  height: 100%;\n  max-height: 80vh;\n}\n.dialog-content[_ngcontent-%COMP%] {\n  display: flex;\n  flex: 1;\n  gap: 1rem;\n  overflow: hidden;\n}\n.file-list-panel[_ngcontent-%COMP%] {\n  width: 250px;\n  display: flex;\n  flex-direction: column;\n  border-right: 1px solid #ddd;\n  padding-right: 1rem;\n}\n.file-list-panel[_ngcontent-%COMP%]   h3[_ngcontent-%COMP%] {\n  margin: 0 0 1rem 0;\n  font-size: 1.1rem;\n  color: #333;\n}\n.file-list[_ngcontent-%COMP%] {\n  flex: 1;\n  overflow-y: auto;\n  border: 1px solid #ddd;\n  border-radius: 4px;\n}\n.file-item[_ngcontent-%COMP%] {\n  padding: 0.75rem;\n  cursor: pointer;\n  border-bottom: 1px solid #eee;\n  transition: background-color 0.2s;\n}\n.file-item[_ngcontent-%COMP%]:hover {\n  background-color: #f5f5f5;\n}\n.file-item.selected[_ngcontent-%COMP%] {\n  background-color: #007bff;\n  color: white;\n}\n.file-name[_ngcontent-%COMP%] {\n  font-size: 0.9rem;\n  word-break: break-word;\n}\n.no-files[_ngcontent-%COMP%] {\n  padding: 1rem;\n  text-align: center;\n  color: #999;\n}\n.viewer-panel[_ngcontent-%COMP%] {\n  flex: 1;\n  display: flex;\n  flex-direction: column;\n  min-width: 0;\n}\n.viewer-header[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  margin-bottom: 1rem;\n  padding-bottom: 0.5rem;\n  border-bottom: 1px solid #ddd;\n}\n.viewer-header[_ngcontent-%COMP%]   h3[_ngcontent-%COMP%] {\n  margin: 0;\n  font-size: 1.1rem;\n  color: #333;\n}\n.drawing-controls[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 1rem;\n}\n.btn-start-drawing[_ngcontent-%COMP%] {\n  padding: 0.5rem 1.5rem;\n  background-color: #28a745;\n  color: white;\n  border: none;\n  border-radius: 4px;\n  font-size: 0.9rem;\n  cursor: pointer;\n  transition: background-color 0.2s;\n}\n.btn-start-drawing[_ngcontent-%COMP%]:hover {\n  background-color: #218838;\n}\n.drawing-status[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 1rem;\n  padding: 0.5rem 1rem;\n  background-color: #fff3cd;\n  border: 1px solid #ffc107;\n  border-radius: 4px;\n}\n.status-text[_ngcontent-%COMP%] {\n  font-size: 0.9rem;\n  color: #856404;\n  font-weight: 500;\n}\n.shape-info[_ngcontent-%COMP%] {\n  padding: 0.25rem 0.75rem;\n  background-color: #d4edda;\n  color: #155724;\n  border-radius: 4px;\n  font-size: 0.85rem;\n  font-weight: 500;\n}\n.viewer-content[_ngcontent-%COMP%] {\n  flex: 1;\n  overflow: hidden;\n  border: 1px solid #ddd;\n  border-radius: 4px;\n  background-color: #f9f9f9;\n}\n.no-selection[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  height: 100%;\n  color: #999;\n}\n.dialog-actions[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: flex-end;\n  gap: 0.5rem;\n  margin-top: 1rem;\n  padding-top: 1rem;\n  border-top: 1px solid #ddd;\n}\n.btn-cancel[_ngcontent-%COMP%], \n.btn-confirm[_ngcontent-%COMP%] {\n  padding: 0.5rem 1.5rem;\n  border: none;\n  border-radius: 4px;\n  font-size: 1rem;\n  cursor: pointer;\n  transition: background-color 0.2s;\n}\n.btn-cancel[_ngcontent-%COMP%] {\n  background-color: #6c757d;\n  color: white;\n}\n.btn-cancel[_ngcontent-%COMP%]:hover {\n  background-color: #5a6268;\n}\n.btn-confirm[_ngcontent-%COMP%] {\n  background-color: #28a745;\n  color: white;\n}\n.btn-confirm[_ngcontent-%COMP%]:hover:not(:disabled) {\n  background-color: #218838;\n}\n.btn-confirm[_ngcontent-%COMP%]:disabled {\n  background-color: #ccc;\n  cursor: not-allowed;\n  opacity: 0.6;\n}\n.error-message[_ngcontent-%COMP%] {\n  margin-top: 0.5rem;\n  padding: 0.75rem 1rem;\n  background-color: #f8d7da;\n  border: 1px solid #f5c6cb;\n  border-radius: 4px;\n  color: #721c24;\n  font-size: 0.9rem;\n}\n.loto-point-form-container[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 1rem;\n  max-height: 70vh;\n  overflow-y: auto;\n}\n.equipment-info-banner[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  padding: 0.75rem 1rem;\n  background-color: #e7f3ff;\n  border: 1px solid #b8daff;\n  border-radius: 4px;\n  margin-bottom: 0.5rem;\n}\n.equipment-label[_ngcontent-%COMP%] {\n  font-weight: 600;\n  color: #004085;\n}\n.equipment-value[_ngcontent-%COMP%] {\n  color: #0056b3;\n  font-weight: 500;\n}\n/*# sourceMappingURL=equipment-shape-drawer-dialog.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(EquipmentShapeDrawerDialogComponent, { className: "EquipmentShapeDrawerDialogComponent", filePath: "src/app/shared/reactive-form/refactored/input-fields/equipment-shape-drawer-dialog/equipment-shape-drawer-dialog.component.ts", lineNumber: 28 });
})();

// src/environments/environment.prod.ts
var environment2 = {
  production: false,
  apiUrl: "http://localhost:8082/ng",
  baseApiUrl: "http://localhost:8082",
  syncServerUrl: "http://localhost:8090",
  baseHref: "/app/"
};

// src/app/features/values/refactored/services/rf-value-api.service.ts
var RfValueApiService = class _RfValueApiService {
  http = inject(HttpClient);
  baseUrl = `${environment2.apiUrl}/rf-values`;
  // ==================== CREATE ====================
  createValue(categoryAlias, valueName, valueAlias) {
    return this.http.post(this.baseUrl, {
      categoryAlias,
      valueName,
      valueAlias
    }).pipe(map((response) => response.responseData));
  }
  // ==================== READ ====================
  getValuesByCategory(categoryAlias) {
    return this.http.get(`${this.baseUrl}/category/${categoryAlias}`).pipe(map((response) => response.responseData));
  }
  getAllValues() {
    return this.http.get(`${this.baseUrl}/all`).pipe(map((response) => response.responseData));
  }
  getValueById(valueId) {
    return this.http.get(`${this.baseUrl}/${valueId}`).pipe(map((response) => response.responseData));
  }
  getAllCategories() {
    return this.http.get(`${this.baseUrl}/categories`).pipe(map((response) => response.responseData));
  }
  getValuesByCategories(categoryAliases) {
    return this.http.post(`${this.baseUrl}/categories/bulk`, { categoryAliases }).pipe(map((response) => new Map(Object.entries(response.responseData))));
  }
  // ==================== UPDATE ====================
  updateValue(valueId, name, alias) {
    return this.http.put(`${this.baseUrl}/${valueId}`, { name, alias }).pipe(map((response) => response.responseData));
  }
  // ==================== DELETE ====================
  deleteValue(valueId, transferToValueId) {
    const url = transferToValueId ? `${this.baseUrl}/${valueId}?transferToValueId=${transferToValueId}` : `${this.baseUrl}/${valueId}`;
    return this.http.delete(url).pipe(map(() => void 0));
  }
  // ==================== VALIDATION ====================
  canDeleteValue(valueId) {
    return this.http.get(`${this.baseUrl}/${valueId}/can-delete`).pipe(map((response) => response.responseData));
  }
  getValueDependencies(valueId) {
    return this.http.get(`${this.baseUrl}/${valueId}/dependencies`).pipe(map((response) => new Map(Object.entries(response.responseData))));
  }
  static \u0275fac = function RfValueApiService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _RfValueApiService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _RfValueApiService, factory: _RfValueApiService.\u0275fac, providedIn: "root" });
};

// src/app/features/values/refactored/services/rf-value.service.ts
var RfValueService = class _RfValueService {
  api = inject(RfValueApiService);
  syncUpdateService = inject(SyncUpdateService);
  destroyRef = inject(DestroyRef);
  // State signals
  valuesCache = signal(/* @__PURE__ */ new Map());
  categoriesCache = signal([]);
  // Public computed signals
  categories = computed(() => this.categoriesCache());
  sseSubscription = null;
  constructor() {
    this.loadCategories();
    this.preloadCommonCategories();
    this.subscribeToValueUpdates();
    this.destroyRef.onDestroy(() => {
      this.sseSubscription?.unsubscribe();
    });
  }
  /**
   * Subscribe to SSE updates for Value entities.
   * When a Value is synced from another machine, refresh all cached categories.
   */
  subscribeToValueUpdates() {
    this.sseSubscription = this.syncUpdateService.getEntityTypeUpdates$("Value").subscribe((event) => {
      console.log("RfValueService: Value entity updated via sync, refreshing caches", event);
      this.refreshAllCachedCategories();
    });
  }
  /**
   * Refresh all categories that are currently in the cache
   */
  refreshAllCachedCategories() {
    const cache = this.valuesCache();
    const categoryAliases = Array.from(cache.keys());
    if (categoryAliases.length > 0) {
      this.api.getValuesByCategories(categoryAliases).subscribe((valuesMap) => {
        const newCache = new Map(this.valuesCache());
        valuesMap.forEach((values, alias) => {
          newCache.set(alias, values);
        });
        this.valuesCache.set(newCache);
      });
    }
  }
  /**
   * Preload commonly used value categories to avoid race conditions
   */
  preloadCommonCategories() {
    const commonCategories = ["isoPos", "normPos", "location", "eqType", "zeroEnergyTemplate"];
    commonCategories.forEach((alias) => this.loadCategoryValues(alias));
  }
  // ==================== CATEGORY MANAGEMENT ====================
  loadCategories() {
    this.api.getAllCategories().subscribe((categories) => {
      this.categoriesCache.set(categories);
    });
  }
  getCategoryOptions() {
    return computed(() => this.categoriesCache().map((cat) => ({
      value: cat.alias || cat.name,
      label: cat.name
    })));
  }
  // ==================== VALUE MANAGEMENT ====================
  /**
   * Get values for a category as a signal
   * Triggers loading from API if not in cache
   */
  getValuesByCategory(categoryAlias) {
    const cached = this.valuesCache().get(categoryAlias);
    if (!cached) {
      this.loadCategoryValues(categoryAlias);
      return [];
    }
    return cached;
  }
  /**
   * Load values for a category from API
   */
  loadCategoryValues(categoryAlias) {
    this.api.getValuesByCategory(categoryAlias).subscribe((values) => {
      const cache = new Map(this.valuesCache());
      cache.set(categoryAlias, values);
      this.valuesCache.set(cache);
    });
  }
  /**
   * Get values as Options for dropdowns
   * Returns a computed signal that reactively updates
   */
  getValueOptions(categoryAlias) {
    return computed(() => {
      const cache = this.valuesCache();
      const values = cache.get(categoryAlias) || [];
      if (values.length === 0 && !cache.has(categoryAlias)) {
        setTimeout(() => this.loadCategoryValues(categoryAlias), 0);
      }
      return values.map((v) => ({
        value: v.id,
        label: v.name
      }));
    });
  }
  /**
   * Create a new value and update cache
   */
  createValue(categoryAlias, valueName, valueAlias) {
    return this.api.createValue(categoryAlias, valueName, valueAlias).pipe(tap((newValue) => {
      const cache = new Map(this.valuesCache());
      const categoryValues = cache.get(categoryAlias) || [];
      cache.set(categoryAlias, [...categoryValues, newValue]);
      this.valuesCache.set(cache);
    }));
  }
  /**
   * Update an existing value and update cache
   */
  updateValue(valueId, name, alias) {
    return this.api.updateValue(valueId, name, alias).pipe(tap((updatedValue) => {
      const cache = new Map(this.valuesCache());
      const categoryAlias = updatedValue.category?.alias || updatedValue.category?.name;
      if (categoryAlias) {
        const categoryValues = cache.get(categoryAlias) || [];
        const index = categoryValues.findIndex((v) => v.id === valueId);
        if (index !== -1) {
          categoryValues[index] = updatedValue;
          cache.set(categoryAlias, [...categoryValues]);
          this.valuesCache.set(cache);
        }
      }
    }));
  }
  /**
   * Delete a value and update cache
   */
  deleteValue(valueId, categoryAlias, transferToValueId) {
    return this.api.deleteValue(valueId, transferToValueId).pipe(tap(() => {
      const cache = new Map(this.valuesCache());
      const categoryValues = cache.get(categoryAlias) || [];
      cache.set(categoryAlias, categoryValues.filter((v) => v.id !== valueId));
      this.valuesCache.set(cache);
    }));
  }
  /**
   * Refresh values for a category (force reload from API)
   */
  refreshCategory(categoryAlias) {
    this.api.getValuesByCategory(categoryAlias).subscribe((values) => {
      const cache = new Map(this.valuesCache());
      cache.set(categoryAlias, values);
      this.valuesCache.set(cache);
    });
  }
  /**
   * Bulk load values for multiple categories
   */
  loadCategoriesValues(categoryAliases) {
    return this.api.getValuesByCategories(categoryAliases).pipe(tap((valuesMap) => {
      const cache = new Map(this.valuesCache());
      valuesMap.forEach((values, alias) => {
        cache.set(alias, values);
      });
      this.valuesCache.set(cache);
    }));
  }
  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache() {
    this.valuesCache.set(/* @__PURE__ */ new Map());
  }
  static \u0275fac = function RfValueService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _RfValueService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _RfValueService, factory: _RfValueService.\u0275fac, providedIn: "root" });
};

// src/app/shared/reactive-form/refactored/input-fields/equipment-unified-dialog/equipment-unified-dialog.component.ts
var _forTrack07 = ($index, $item) => $item.id;
function EquipmentUnifiedDialogComponent_Conditional_8_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 13);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r1.error(), " ");
  }
}
function EquipmentUnifiedDialogComponent_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 9)(1, "h3");
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "div", 10);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(5, "div", 11)(6, "app-interactive-image", 12);
    \u0275\u0275listener("shapeClicked", function EquipmentUnifiedDialogComponent_Conditional_8_Template_app_interactive_image_shapeClicked_6_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onEquipmentClicked($event));
    })("shapeDrawn", function EquipmentUnifiedDialogComponent_Conditional_8_Template_app_interactive_image_shapeDrawn_6_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onShapeDrawn($event));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275template(7, EquipmentUnifiedDialogComponent_Conditional_8_Conditional_7_Template, 2, 1, "div", 13);
  }
  if (rf & 2) {
    let tmp_1_0;
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate((tmp_1_0 = ctx_r1.selectedFile()) == null ? null : tmp_1_0.name);
    \u0275\u0275advance();
    \u0275\u0275classProp("has-selection", ctx_r1.selectedEquipment())("needs-loto", ctx_r1.needsLotoPointForm());
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r1.statusMessage(), " ");
    \u0275\u0275advance();
    \u0275\u0275property("guideTooltipOnly", true);
    \u0275\u0275advance();
    \u0275\u0275property("imageUrl", ctx_r1.currentFileLink())("shapesInput", ctx_r1.equipmentShapes())("preset", "EQUIPMENT_UNIFIED");
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r1.error() ? 7 : -1);
  }
}
function EquipmentUnifiedDialogComponent_Conditional_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 6)(1, "p");
    \u0275\u0275text(2, "Select a P&ID file to view and select equipment");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "p", 14);
    \u0275\u0275text(4, "\u{1F5B1}\uFE0F Left-click on a shape to select existing equipment");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "p", 14);
    \u0275\u0275text(6, "\u270F\uFE0F Right-click and drag to draw new equipment shape");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "p", 14);
    \u0275\u0275text(8, "\u2B50 Use toolbar Symbol button to place P&ID symbols");
    \u0275\u0275elementEnd()();
  }
}
function EquipmentUnifiedDialogComponent_Conditional_10_For_24_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "option", 23);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const opt_r4 = ctx.$implicit;
    \u0275\u0275property("ngValue", opt_r4.id);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(opt_r4.name);
  }
}
function EquipmentUnifiedDialogComponent_Conditional_10_For_32_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "option", 23);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const opt_r5 = ctx.$implicit;
    \u0275\u0275property("ngValue", opt_r5.id);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(opt_r5.name);
  }
}
function EquipmentUnifiedDialogComponent_Conditional_10_For_41_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "option", 23);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const opt_r6 = ctx.$implicit;
    \u0275\u0275property("ngValue", opt_r6.id);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(opt_r6.name);
  }
}
function EquipmentUnifiedDialogComponent_Conditional_10_For_49_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "option", 23);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const opt_r7 = ctx.$implicit;
    \u0275\u0275property("ngValue", opt_r7.id);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(opt_r7.name);
  }
}
function EquipmentUnifiedDialogComponent_Conditional_10_Conditional_50_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 27);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r1.lotoPointFormError());
  }
}
function EquipmentUnifiedDialogComponent_Conditional_10_Conditional_55_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " Creating... ");
  }
}
function EquipmentUnifiedDialogComponent_Conditional_10_Conditional_56_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " Create LOTO Point ");
  }
}
function EquipmentUnifiedDialogComponent_Conditional_10_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 7)(1, "div", 15)(2, "span", 16);
    \u0275\u0275text(3, "\u{1F4CB}");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "h4");
    \u0275\u0275text(5);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(6, "form", 17);
    \u0275\u0275listener("ngSubmit", function EquipmentUnifiedDialogComponent_Conditional_10_Template_form_ngSubmit_6_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.submitLotoPointForm());
    });
    \u0275\u0275elementStart(7, "div", 18)(8, "div", 19)(9, "label");
    \u0275\u0275text(10, "Tag Number *");
    \u0275\u0275elementEnd();
    \u0275\u0275element(11, "input", 20);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(12, "div", 19)(13, "label");
    \u0275\u0275text(14, "Description *");
    \u0275\u0275elementEnd();
    \u0275\u0275element(15, "input", 21);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(16, "div", 18)(17, "div", 19)(18, "label");
    \u0275\u0275text(19, "Equipment Type");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(20, "select", 22)(21, "option", 23);
    \u0275\u0275text(22, "-- Select --");
    \u0275\u0275elementEnd();
    \u0275\u0275repeaterCreate(23, EquipmentUnifiedDialogComponent_Conditional_10_For_24_Template, 2, 2, "option", 23, _forTrack07);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(25, "div", 19)(26, "label");
    \u0275\u0275text(27, "Location");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(28, "select", 24)(29, "option", 23);
    \u0275\u0275text(30, "-- Select --");
    \u0275\u0275elementEnd();
    \u0275\u0275repeaterCreate(31, EquipmentUnifiedDialogComponent_Conditional_10_For_32_Template, 2, 2, "option", 23, _forTrack07);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(33, "div", 18)(34, "div", 19)(35, "label");
    \u0275\u0275text(36, "Isolated Position");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(37, "select", 25)(38, "option", 23);
    \u0275\u0275text(39, "-- Select --");
    \u0275\u0275elementEnd();
    \u0275\u0275repeaterCreate(40, EquipmentUnifiedDialogComponent_Conditional_10_For_41_Template, 2, 2, "option", 23, _forTrack07);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(42, "div", 19)(43, "label");
    \u0275\u0275text(44, "Normal Position");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(45, "select", 26)(46, "option", 23);
    \u0275\u0275text(47, "-- Select --");
    \u0275\u0275elementEnd();
    \u0275\u0275repeaterCreate(48, EquipmentUnifiedDialogComponent_Conditional_10_For_49_Template, 2, 2, "option", 23, _forTrack07);
    \u0275\u0275elementEnd()()();
    \u0275\u0275template(50, EquipmentUnifiedDialogComponent_Conditional_10_Conditional_50_Template, 2, 1, "div", 27);
    \u0275\u0275elementStart(51, "div", 28)(52, "button", 29);
    \u0275\u0275listener("click", function EquipmentUnifiedDialogComponent_Conditional_10_Template_button_click_52_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.cancelLotoPointForm());
    });
    \u0275\u0275text(53, "Cancel");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(54, "button", 30);
    \u0275\u0275template(55, EquipmentUnifiedDialogComponent_Conditional_10_Conditional_55_Template, 1, 0)(56, EquipmentUnifiedDialogComponent_Conditional_10_Conditional_56_Template, 1, 0);
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    let tmp_1_0;
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate1("Create LOTO Point for Equipment #", (tmp_1_0 = ctx_r1.pendingEquipmentForLotoPoint()) == null ? null : tmp_1_0.id, "");
    \u0275\u0275advance();
    \u0275\u0275property("formGroup", ctx_r1.lotoPointForm);
    \u0275\u0275advance(15);
    \u0275\u0275property("ngValue", null);
    \u0275\u0275advance(2);
    \u0275\u0275repeater(ctx_r1.eqTypeOptions());
    \u0275\u0275advance(6);
    \u0275\u0275property("ngValue", null);
    \u0275\u0275advance(2);
    \u0275\u0275repeater(ctx_r1.locationOptions());
    \u0275\u0275advance(7);
    \u0275\u0275property("ngValue", null);
    \u0275\u0275advance(2);
    \u0275\u0275repeater(ctx_r1.isoPosOptions());
    \u0275\u0275advance(6);
    \u0275\u0275property("ngValue", null);
    \u0275\u0275advance(2);
    \u0275\u0275repeater(ctx_r1.normPosOptions());
    \u0275\u0275advance(2);
    \u0275\u0275conditional(ctx_r1.lotoPointFormError() ? 50 : -1);
    \u0275\u0275advance(4);
    \u0275\u0275property("disabled", ctx_r1.lotoPointForm.invalid || ctx_r1.isCreatingLotoPoint());
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r1.isCreatingLotoPoint() ? 55 : 56);
  }
}
function EquipmentUnifiedDialogComponent_Conditional_11_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " Saving... ");
  }
}
function EquipmentUnifiedDialogComponent_Conditional_11_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " Save & Select ");
  }
}
function EquipmentUnifiedDialogComponent_Conditional_11_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " Select Equipment ");
  }
}
function EquipmentUnifiedDialogComponent_Conditional_11_Template(rf, ctx) {
  if (rf & 1) {
    const _r8 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 8)(1, "button", 31);
    \u0275\u0275listener("click", function EquipmentUnifiedDialogComponent_Conditional_11_Template_button_click_1_listener() {
      \u0275\u0275restoreView(_r8);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onCancel());
    });
    \u0275\u0275text(2, " Cancel ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "button", 32);
    \u0275\u0275listener("click", function EquipmentUnifiedDialogComponent_Conditional_11_Template_button_click_3_listener() {
      \u0275\u0275restoreView(_r8);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onConfirm());
    });
    \u0275\u0275template(4, EquipmentUnifiedDialogComponent_Conditional_11_Conditional_4_Template, 1, 0)(5, EquipmentUnifiedDialogComponent_Conditional_11_Conditional_5_Template, 1, 0)(6, EquipmentUnifiedDialogComponent_Conditional_11_Conditional_6_Template, 1, 0);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(3);
    \u0275\u0275property("disabled", !ctx_r1.canConfirm() || ctx_r1.isLoading() || ctx_r1.isCreatingLotoPoint());
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r1.isLoading() ? 4 : ctx_r1.drawnShape() ? 5 : 6);
  }
}
var EquipmentUnifiedDialogComponent = class _EquipmentUnifiedDialogComponent {
  // Services
  fileService = inject(EquipmentDialogFileService);
  equipmentMapper = inject(EquipmentMapperService);
  equipmentService = inject(RfEquipmentService);
  lotoPointApiService = inject(RfLotoPointApiService);
  valueService = inject(RfValueService);
  fb = inject(FormBuilder);
  destroyRef = inject(DestroyRef);
  // Inputs
  requireLotoPointForDrawn = input(false);
  requireLotoPointForUnassociated = input(false);
  immediateSelection = input(false);
  hideActions = input(false);
  // Outputs
  equipmentAcquired = output();
  equipmentDrawnForLotoPoint = output();
  // Keep for backwards compatibility but won't use
  close = output();
  // Delegated to file service
  selectedFile = this.fileService.selectedFile;
  fileMenuItems = this.fileService.menuItems;
  currentFileLink = this.fileService.currentFileLink;
  // State - mimicking wizard's approach
  selectedEquipment = signal(null);
  // Currently selected/saved equipment
  drawnShape = signal(null);
  // Drawn shape (before saving)
  highlightEquipmentId = signal(null);
  isLoading = signal(false);
  error = signal(null);
  // LOTO Point Form State - shown when equipment needs LOTO point
  showLotoPointForm = signal(false);
  pendingEquipmentForLotoPoint = signal(null);
  // Equipment waiting for LOTO point
  isCreatingLotoPoint = signal(false);
  lotoPointFormError = signal(null);
  // Value options for LOTO point form dropdowns
  eqTypeOptions = computed(() => this.valueService.getValuesByCategory("eqType"));
  locationOptions = computed(() => this.valueService.getValuesByCategory("location"));
  isoPosOptions = computed(() => this.valueService.getValuesByCategory("isoPos"));
  normPosOptions = computed(() => this.valueService.getValuesByCategory("normPos"));
  // LOTO Point quick-create form
  lotoPointForm = this.fb.group({
    tagNumber: ["", Validators.required],
    description: ["", Validators.required],
    eqType: [null],
    location: [null],
    isoPos: [null],
    normPos: [null]
  });
  // Equipment from selected file
  equipment = computed(() => {
    const file = this.selectedFile();
    if (!file)
      return [];
    return file.points ?? [];
  });
  // Equipment shapes for InteractiveImageComponent
  equipmentShapes = computed(() => {
    const eq = this.equipment();
    const drawn = this.drawnShape();
    const selected = this.selectedEquipment();
    const shapes = eq.map((e) => this.equipmentMapper.mapToRfShape(e)).filter((s) => s !== null);
    if (selected?.id) {
      shapes.forEach((shape) => {
        if (shape.id === selected.id) {
          shape.isSelected = true;
          shape.color = "#FF0000";
        }
      });
    }
    if (drawn) {
      const drawnWithHighlight = __spreadProps(__spreadValues({}, drawn), {
        isSelected: true,
        color: "#00FF00"
        // Green for newly drawn
      });
      shapes.push(drawnWithHighlight);
    }
    return shapes;
  });
  // Check if we need to show LOTO form
  needsLotoPointForm = computed(() => {
    return this.showLotoPointForm() && this.pendingEquipmentForLotoPoint() !== null;
  });
  // Can confirm - equipment is selected and has LOTO point (if required)
  canConfirm = computed(() => {
    const selected = this.selectedEquipment();
    const drawn = this.drawnShape();
    const pendingLoto = this.pendingEquipmentForLotoPoint();
    if (pendingLoto) {
      return false;
    }
    if (drawn) {
      return true;
    }
    if (selected) {
      if (this.requireLotoPointForUnassociated()) {
        return selected.lotoPoints && selected.lotoPoints.length > 0;
      }
      return true;
    }
    return false;
  });
  // Status message for user guidance
  statusMessage = computed(() => {
    const selected = this.selectedEquipment();
    const drawn = this.drawnShape();
    const pending = this.pendingEquipmentForLotoPoint();
    if (pending) {
      return `Equipment saved. Fill out LOTO Point form below to associate.`;
    }
    if (drawn) {
      return 'New shape drawn. Click "Save & Select" to save the equipment.';
    }
    if (selected) {
      const lotoTag = selected.lotoPoints?.[0]?.tagNumber;
      if (lotoTag) {
        return `Selected: ${this.getEquipmentLabel(selected)} (LOTO: ${lotoTag})`;
      }
      if (this.requireLotoPointForUnassociated()) {
        return `Selected: ${this.getEquipmentLabel(selected)} - No LOTO Point. Will prompt for creation.`;
      }
      return `Selected: ${this.getEquipmentLabel(selected)}`;
    }
    return "Left-click to select existing equipment, or right-click and drag to draw new.";
  });
  // Get display label for equipment
  getEquipmentLabel(equipment) {
    if (equipment.lotoPoints?.[0]?.tagNumber) {
      return equipment.lotoPoints[0].tagNumber;
    }
    if (equipment.tagNumber) {
      return equipment.tagNumber;
    }
    return `Equipment #${equipment.id}`;
  }
  onFileSelect(fileItem) {
    this.fileService.selectFileFromNestedItem(fileItem);
    this.clearSelection();
  }
  // Handle click on existing equipment shape
  onEquipmentClicked(shape) {
    const selectedId = shape.id;
    if (selectedId !== null) {
      const eq = this.equipment();
      const selected = eq.find((e) => e.id === selectedId);
      if (selected) {
        this.drawnShape.set(null);
        const file = this.selectedFile();
        const enrichedEquipment = new EquipmentDto(__spreadProps(__spreadValues({}, selected), {
          mainFileId: file?.id,
          mainFileObject: file || void 0
        }));
        this.selectedEquipment.set(enrichedEquipment);
        this.highlightEquipmentId.set(selectedId);
        if (this.immediateSelection()) {
          this.equipmentAcquired.emit(enrichedEquipment);
        }
      }
    }
  }
  // Handle new shape drawn
  onShapeDrawn(shape) {
    this.selectedEquipment.set(null);
    this.highlightEquipmentId.set(null);
    this.drawnShape.set(shape);
  }
  onConfirm() {
    const file = this.selectedFile();
    if (!file)
      return;
    const drawn = this.drawnShape();
    const selected = this.selectedEquipment();
    if (drawn) {
      this.saveDrawnShape(file);
      return;
    }
    if (selected) {
      if (this.requireLotoPointForUnassociated()) {
        const hasLotoPoint = selected.lotoPoints && selected.lotoPoints.length > 0;
        if (!hasLotoPoint) {
          this.pendingEquipmentForLotoPoint.set(selected);
          this.showLotoPointForm.set(true);
          return;
        }
      }
      this.equipmentAcquired.emit(selected);
      this.reset();
    }
  }
  /**
   * Save drawn shape as equipment, then check if LOTO point is needed
   */
  saveDrawnShape(file) {
    const shape = this.drawnShape();
    if (!shape)
      return;
    this.isLoading.set(true);
    this.error.set(null);
    const shapeWithFileContext = __spreadProps(__spreadValues({}, shape), { fileId: file.id });
    this.equipmentService.saveEquipmentFromShape(shapeWithFileContext).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (savedEquipment) => {
        this.isLoading.set(false);
        if (savedEquipment) {
          const enrichedEquipment = new EquipmentDto(__spreadProps(__spreadValues({}, savedEquipment), {
            mainFileId: file.id,
            mainFileObject: file
          }));
          this.drawnShape.set(null);
          if (this.requireLotoPointForDrawn() || this.requireLotoPointForUnassociated()) {
            this.pendingEquipmentForLotoPoint.set(enrichedEquipment);
            this.showLotoPointForm.set(true);
          } else {
            this.equipmentAcquired.emit(enrichedEquipment);
            this.reset();
          }
        } else {
          this.error.set("Failed to save equipment.");
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error("Failed to save equipment:", err);
        this.error.set("Failed to save equipment. Please try again.");
      }
    });
  }
  onCancel() {
    this.reset();
    this.close.emit();
  }
  clearSelection() {
    this.selectedEquipment.set(null);
    this.drawnShape.set(null);
    this.highlightEquipmentId.set(null);
    this.error.set(null);
    this.showLotoPointForm.set(false);
    this.pendingEquipmentForLotoPoint.set(null);
    this.lotoPointFormError.set(null);
    this.lotoPointForm.reset();
  }
  reset() {
    this.fileService.reset();
    this.clearSelection();
  }
  // ==================== LOTO Point Form Methods ====================
  /**
   * Helper to find a ValueDto by ID from an options array
   */
  findValueById(options, id) {
    if (!id)
      return null;
    const found = options.find((opt) => opt.id === id);
    if (!found)
      return null;
    return new ValueDto({ id: found.id, name: found.name });
  }
  /**
   * Submit the LOTO point form
   */
  submitLotoPointForm() {
    if (this.lotoPointForm.invalid)
      return;
    const equipment = this.pendingEquipmentForLotoPoint();
    if (!equipment) {
      this.lotoPointFormError.set("No equipment available for LOTO point.");
      return;
    }
    this.isCreatingLotoPoint.set(true);
    this.lotoPointFormError.set(null);
    const formValue = this.lotoPointForm.value;
    const eqType = this.findValueById(this.eqTypeOptions(), formValue.eqType);
    const location = this.findValueById(this.locationOptions(), formValue.location);
    const isoPos = this.findValueById(this.isoPosOptions(), formValue.isoPos);
    const normPos = this.findValueById(this.normPosOptions(), formValue.normPos);
    const newLotoPoint = new LotoPointDto({
      tagNumber: formValue.tagNumber,
      description: formValue.description,
      eqType,
      location,
      isoPos,
      normPos,
      equipmentList: [equipment]
    });
    this.lotoPointApiService.createLotoPoint(newLotoPoint).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.isCreatingLotoPoint.set(false);
        if (response.responseData) {
          const createdLotoPoint = LotoPointDto.fromJson(response.responseData);
          const updatedEquipment = new EquipmentDto(__spreadProps(__spreadValues({}, equipment), {
            lotoPoints: [createdLotoPoint]
          }));
          this.selectedEquipment.set(updatedEquipment);
          this.pendingEquipmentForLotoPoint.set(null);
          this.showLotoPointForm.set(false);
          this.lotoPointForm.reset();
        } else {
          this.lotoPointFormError.set("Failed to create LOTO point.");
        }
      },
      error: (err) => {
        this.isCreatingLotoPoint.set(false);
        console.error("Failed to create LOTO point:", err);
        this.lotoPointFormError.set("Failed to create LOTO point. Please try again.");
      }
    });
  }
  /**
   * Cancel the LOTO point form
   */
  cancelLotoPointForm() {
    this.clearSelection();
  }
  static \u0275fac = function EquipmentUnifiedDialogComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _EquipmentUnifiedDialogComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _EquipmentUnifiedDialogComponent, selectors: [["app-equipment-unified-dialog"]], inputs: { requireLotoPointForDrawn: [1, "requireLotoPointForDrawn"], requireLotoPointForUnassociated: [1, "requireLotoPointForUnassociated"], immediateSelection: [1, "immediateSelection"], hideActions: [1, "hideActions"] }, outputs: { equipmentAcquired: "equipmentAcquired", equipmentDrawnForLotoPoint: "equipmentDrawnForLotoPoint", close: "close" }, features: [\u0275\u0275ProvidersFeature([EquipmentDialogFileService])], decls: 12, vars: 5, consts: [[1, "dialog-container"], [1, "dialog-content"], [1, "navigation-panel"], ["appGuide", "create-loto-point:file-selector", "guideMessage", "Expand folders and click on a P&ID file to load it. The file's equipment will be displayed on the right.", 1, "menu-container", 3, "guideTooltipOnly"], [3, "itemClick", "menuItems"], [1, "viewer-panel"], [1, "no-selection"], [1, "loto-form-section"], [1, "dialog-actions"], [1, "viewer-header"], [1, "status-message"], ["appGuide", "create-loto-point:image-unified", "guideMessage", "Left-click on an equipment shape to select it. Right-click and drag to draw a new equipment shape. Use the Symbol button to place P&ID symbols.", 1, "viewer-content", 3, "guideTooltipOnly"], [3, "shapeClicked", "shapeDrawn", "imageUrl", "shapesInput", "preset"], [1, "error-message"], [1, "hint"], [1, "loto-form-header"], [1, "loto-form-icon"], [1, "loto-form", 3, "ngSubmit", "formGroup"], [1, "form-row"], [1, "form-field"], ["type", "text", "formControlName", "tagNumber", "placeholder", "e.g., V-101"], ["type", "text", "formControlName", "description", "placeholder", "e.g., Main Isolation Valve"], ["formControlName", "eqType"], [3, "ngValue"], ["formControlName", "location"], ["formControlName", "isoPos"], ["formControlName", "normPos"], [1, "form-error"], [1, "form-actions"], ["type", "button", 1, "btn-cancel-small", 3, "click"], ["type", "submit", 1, "btn-submit", 3, "disabled"], ["type", "button", 1, "btn-cancel", 3, "click"], ["type", "button", 1, "btn-select", 3, "click", "disabled"]], template: function EquipmentUnifiedDialogComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "div", 2)(3, "div", 3)(4, "h3");
      \u0275\u0275text(5, "Select P&ID");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(6, "app-rf-toggle-menu", 4);
      \u0275\u0275listener("itemClick", function EquipmentUnifiedDialogComponent_Template_app_rf_toggle_menu_itemClick_6_listener($event) {
        return ctx.onFileSelect($event);
      });
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(7, "div", 5);
      \u0275\u0275template(8, EquipmentUnifiedDialogComponent_Conditional_8_Template, 8, 11)(9, EquipmentUnifiedDialogComponent_Conditional_9_Template, 9, 0, "div", 6);
      \u0275\u0275elementEnd()();
      \u0275\u0275template(10, EquipmentUnifiedDialogComponent_Conditional_10_Template, 57, 9, "div", 7)(11, EquipmentUnifiedDialogComponent_Conditional_11_Template, 7, 2, "div", 8);
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      \u0275\u0275advance(3);
      \u0275\u0275property("guideTooltipOnly", true);
      \u0275\u0275advance(3);
      \u0275\u0275property("menuItems", ctx.fileMenuItems());
      \u0275\u0275advance(2);
      \u0275\u0275conditional(ctx.selectedFile() ? 8 : 9);
      \u0275\u0275advance(2);
      \u0275\u0275conditional(ctx.needsLotoPointForm() ? 10 : -1);
      \u0275\u0275advance();
      \u0275\u0275conditional(!ctx.hideActions() ? 11 : -1);
    }
  }, dependencies: [
    CommonModule,
    ReactiveFormsModule,
    \u0275NgNoValidate,
    NgSelectOption,
    \u0275NgSelectMultipleOption,
    DefaultValueAccessor,
    SelectControlValueAccessor,
    NgControlStatus,
    NgControlStatusGroup,
    FormGroupDirective,
    FormControlName,
    InteractiveImageComponent,
    RfToggleMenuComponent,
    GuideDirective
  ], styles: ["\n\n[_nghost-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  flex: 1;\n  min-height: 0;\n  overflow: hidden;\n}\n.dialog-container[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  flex: 1;\n  min-height: 0;\n  overflow: hidden;\n  padding: 1rem;\n}\n.dialog-content[_ngcontent-%COMP%] {\n  display: flex;\n  flex: 1;\n  gap: 1rem;\n  overflow: hidden;\n  min-height: 0;\n}\n.navigation-panel[_ngcontent-%COMP%] {\n  width: 300px;\n  display: flex;\n  flex-direction: column;\n  border-right: 1px solid #ddd;\n  padding-right: 1rem;\n  gap: 0.75rem;\n  min-height: 0;\n}\n.menu-container[_ngcontent-%COMP%] {\n  flex: 1;\n  display: flex;\n  flex-direction: column;\n  overflow: hidden;\n  min-height: 0;\n  height: 100%;\n}\n.menu-container[_ngcontent-%COMP%]   app-rf-toggle-menu[_ngcontent-%COMP%] {\n  flex: 1;\n  display: flex;\n  min-height: 0;\n  height: 100%;\n}\n.menu-container[_ngcontent-%COMP%]   h3[_ngcontent-%COMP%] {\n  margin: 0 0 0.75rem 0;\n  font-size: 1rem;\n  color: #333;\n  font-weight: 600;\n  flex-shrink: 0;\n}\n.viewer-panel[_ngcontent-%COMP%] {\n  flex: 1;\n  display: flex;\n  flex-direction: column;\n  min-width: 0;\n  min-height: 0;\n  overflow: hidden;\n}\n.viewer-header[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  margin-bottom: 1rem;\n  padding-bottom: 0.5rem;\n  border-bottom: 1px solid #ddd;\n  gap: 1rem;\n  flex-shrink: 0;\n}\n.viewer-header[_ngcontent-%COMP%]   h3[_ngcontent-%COMP%] {\n  margin: 0;\n  font-size: 1.1rem;\n  color: #333;\n  flex-shrink: 0;\n}\n.status-message[_ngcontent-%COMP%] {\n  padding: 0.5rem 1rem;\n  background-color: #f8f9fa;\n  border-radius: 4px;\n  font-size: 0.9rem;\n  color: #6c757d;\n  flex: 1;\n  text-align: right;\n}\n.status-message.has-selection[_ngcontent-%COMP%] {\n  background-color: #e7f3ff;\n  color: #0056b3;\n}\n.viewer-content[_ngcontent-%COMP%] {\n  flex: 1;\n  overflow: hidden;\n  min-height: 0;\n  border: 1px solid #ddd;\n  border-radius: 4px;\n  background-color: #f9f9f9;\n}\n.error-message[_ngcontent-%COMP%] {\n  margin-top: 0.5rem;\n  padding: 0.75rem 1rem;\n  background-color: #f8d7da;\n  border: 1px solid #f5c6cb;\n  border-radius: 4px;\n  color: #721c24;\n  font-size: 0.9rem;\n}\n.no-selection[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  height: 100%;\n  color: #999;\n  font-size: 1rem;\n  text-align: center;\n  padding: 2rem;\n}\n.no-selection[_ngcontent-%COMP%]   p[_ngcontent-%COMP%] {\n  margin: 0.5rem 0;\n}\n.no-selection[_ngcontent-%COMP%]   .hint[_ngcontent-%COMP%] {\n  font-size: 0.85rem;\n  color: #aaa;\n}\n.dialog-actions[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: flex-end;\n  gap: 0.5rem;\n  margin-top: 1rem;\n  padding-top: 1rem;\n  border-top: 1px solid #ddd;\n  flex-shrink: 0;\n}\n.btn-cancel[_ngcontent-%COMP%], \n.btn-select[_ngcontent-%COMP%] {\n  padding: 0.5rem 1.5rem;\n  border: none;\n  border-radius: 4px;\n  font-size: 1rem;\n  cursor: pointer;\n  transition: background-color 0.2s;\n  font-weight: 500;\n}\n.btn-cancel[_ngcontent-%COMP%] {\n  background-color: #6c757d;\n  color: white;\n}\n.btn-cancel[_ngcontent-%COMP%]:hover {\n  background-color: #5a6268;\n}\n.btn-select[_ngcontent-%COMP%] {\n  background-color: #007bff;\n  color: white;\n}\n.btn-select[_ngcontent-%COMP%]:hover:not(:disabled) {\n  background-color: #0056b3;\n}\n.btn-select[_ngcontent-%COMP%]:disabled {\n  background-color: #ccc;\n  cursor: not-allowed;\n  opacity: 0.6;\n}\n.status-message.needs-loto[_ngcontent-%COMP%] {\n  background-color: #fff3cd;\n  color: #856404;\n  border: 1px solid #ffc107;\n}\n.loto-form-section[_ngcontent-%COMP%] {\n  margin-top: 1rem;\n  padding: 1rem;\n  background-color: #f8f9fa;\n  border: 1px solid #dee2e6;\n  border-radius: 8px;\n  border-left: 4px solid #ffc107;\n  flex-shrink: 0;\n  overflow-y: auto;\n}\n.loto-form-header[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  margin-bottom: 1rem;\n}\n.loto-form-header[_ngcontent-%COMP%]   h4[_ngcontent-%COMP%] {\n  margin: 0;\n  font-size: 1rem;\n  color: #333;\n}\n.loto-form-icon[_ngcontent-%COMP%] {\n  font-size: 1.2rem;\n}\n.loto-form[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 0.75rem;\n}\n.loto-form[_ngcontent-%COMP%]   .form-row[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 1rem;\n}\n.loto-form[_ngcontent-%COMP%]   .form-field[_ngcontent-%COMP%] {\n  flex: 1;\n  display: flex;\n  flex-direction: column;\n  gap: 0.25rem;\n}\n.loto-form[_ngcontent-%COMP%]   .form-field[_ngcontent-%COMP%]   label[_ngcontent-%COMP%] {\n  font-size: 0.85rem;\n  color: #555;\n  font-weight: 500;\n}\n.loto-form[_ngcontent-%COMP%]   .form-field[_ngcontent-%COMP%]   input[_ngcontent-%COMP%], \n.loto-form[_ngcontent-%COMP%]   .form-field[_ngcontent-%COMP%]   select[_ngcontent-%COMP%] {\n  padding: 0.5rem;\n  border: 1px solid #ced4da;\n  border-radius: 4px;\n  font-size: 0.9rem;\n}\n.loto-form[_ngcontent-%COMP%]   .form-field[_ngcontent-%COMP%]   input[_ngcontent-%COMP%]:focus, \n.loto-form[_ngcontent-%COMP%]   .form-field[_ngcontent-%COMP%]   select[_ngcontent-%COMP%]:focus {\n  outline: none;\n  border-color: #007bff;\n  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);\n}\n.loto-form[_ngcontent-%COMP%]   .form-error[_ngcontent-%COMP%] {\n  padding: 0.5rem;\n  background-color: #f8d7da;\n  border: 1px solid #f5c6cb;\n  border-radius: 4px;\n  color: #721c24;\n  font-size: 0.85rem;\n}\n.loto-form[_ngcontent-%COMP%]   .form-actions[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: flex-end;\n  gap: 0.5rem;\n  margin-top: 0.5rem;\n}\n.btn-cancel-small[_ngcontent-%COMP%] {\n  padding: 0.4rem 1rem;\n  background-color: #6c757d;\n  color: white;\n  border: none;\n  border-radius: 4px;\n  font-size: 0.9rem;\n  cursor: pointer;\n}\n.btn-cancel-small[_ngcontent-%COMP%]:hover {\n  background-color: #5a6268;\n}\n.btn-submit[_ngcontent-%COMP%] {\n  padding: 0.4rem 1rem;\n  background-color: #28a745;\n  color: white;\n  border: none;\n  border-radius: 4px;\n  font-size: 0.9rem;\n  cursor: pointer;\n  font-weight: 500;\n}\n.btn-submit[_ngcontent-%COMP%]:hover:not(:disabled) {\n  background-color: #218838;\n}\n.btn-submit[_ngcontent-%COMP%]:disabled {\n  background-color: #ccc;\n  cursor: not-allowed;\n  opacity: 0.6;\n}\n@media (max-width: 768px) {\n  .navigation-panel[_ngcontent-%COMP%] {\n    width: 250px;\n  }\n  .loto-form[_ngcontent-%COMP%]   .form-row[_ngcontent-%COMP%] {\n    flex-direction: column;\n  }\n}\n/*# sourceMappingURL=equipment-unified-dialog.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(EquipmentUnifiedDialogComponent, { className: "EquipmentUnifiedDialogComponent", filePath: "src/app/shared/reactive-form/refactored/input-fields/equipment-unified-dialog/equipment-unified-dialog.component.ts", lineNumber: 49 });
})();

// src/app/features/equipment/refactored/services/rf-equipment-editor-state.service.ts
var RfEquipmentEditorStateService = class _RfEquipmentEditorStateService {
  // Loading and error state
  _isLoading = signal(true);
  _error = signal(null);
  // File and equipment data (independent from CurrentFileService)
  _currentFile = signal(null);
  _allEquipment = signal([]);
  _selectedEquipment = signal(null);
  // UI state
  _highlightedEquipmentId = signal(null);
  _isLotoPointTableOpen = signal(false);
  _isLotoPointFormOpen = signal(false);
  _selectedLotoPoint = signal(null);
  // Public readonly signals
  isLoading = this._isLoading.asReadonly();
  error = this._error.asReadonly();
  currentFile = this._currentFile.asReadonly();
  allEquipment = this._allEquipment.asReadonly();
  selectedEquipment = this._selectedEquipment.asReadonly();
  highlightedEquipmentId = this._highlightedEquipmentId.asReadonly();
  isLotoPointTableOpen = this._isLotoPointTableOpen.asReadonly();
  isLotoPointFormOpen = this._isLotoPointFormOpen.asReadonly();
  selectedLotoPoint = this._selectedLotoPoint.asReadonly();
  // Computed values
  fileLink = computed(() => {
    const file = this._currentFile();
    return file?.fileLink || "";
  });
  allLotoPoints = computed(() => {
    const equipment = this._allEquipment();
    const lotoPoints = [];
    equipment.forEach((eq) => {
      if (eq.lotoPoints && eq.lotoPoints.length > 0) {
        lotoPoints.push(...eq.lotoPoints);
      }
    });
    return lotoPoints;
  });
  // State setters
  setLoading(loading) {
    this._isLoading.set(loading);
  }
  setError(error) {
    this._error.set(error);
  }
  setCurrentFile(file) {
    this._currentFile.set(file);
  }
  setAllEquipment(equipment) {
    this._allEquipment.set(equipment);
  }
  setSelectedEquipment(equipment) {
    this._selectedEquipment.set(equipment);
  }
  setHighlightedEquipmentId(id) {
    this._highlightedEquipmentId.set(id);
  }
  openLotoPointTable() {
    this._isLotoPointTableOpen.set(true);
  }
  closeLotoPointTable() {
    this._isLotoPointTableOpen.set(false);
  }
  openLotoPointForm(lotoPoint) {
    this._selectedLotoPoint.set(lotoPoint);
    this._isLotoPointFormOpen.set(true);
  }
  closeLotoPointForm() {
    this._isLotoPointFormOpen.set(false);
    this._selectedLotoPoint.set(null);
  }
  // Update equipment in the local list
  updateEquipmentInList(updatedEquipment) {
    const equipment = this._allEquipment();
    const updatedList = equipment.map((eq) => eq.id === updatedEquipment.id ? updatedEquipment : eq);
    this._allEquipment.set(updatedList);
    if (this._selectedEquipment()?.id === updatedEquipment.id) {
      this._selectedEquipment.set(updatedEquipment);
    }
  }
  // Update a loto point in the equipment list
  updateLotoPointInEquipment(updatedLotoPoint) {
    const equipment = this._allEquipment();
    const updatedList = equipment.map((eq) => {
      if (eq.lotoPoints?.some((lp) => lp.id === updatedLotoPoint.id)) {
        return new EquipmentDto(__spreadProps(__spreadValues({}, eq), {
          lotoPoints: eq.lotoPoints.map((lp) => lp.id === updatedLotoPoint.id ? updatedLotoPoint : lp)
        }));
      }
      return eq;
    });
    this._allEquipment.set(updatedList);
    const selectedEq = this._selectedEquipment();
    if (selectedEq?.lotoPoints?.some((lp) => lp.id === updatedLotoPoint.id)) {
      const updated = new EquipmentDto(__spreadProps(__spreadValues({}, selectedEq), {
        lotoPoints: selectedEq.lotoPoints.map((lp) => lp.id === updatedLotoPoint.id ? updatedLotoPoint : lp)
      }));
      this._selectedEquipment.set(updated);
    }
  }
  // Remove a loto point from equipment
  removeLotoPointFromEquipment(lotoPointId) {
    const equipment = this._allEquipment();
    const updatedList = equipment.map((eq) => {
      if (eq.lotoPoints?.some((lp) => lp.id === lotoPointId)) {
        return new EquipmentDto(__spreadProps(__spreadValues({}, eq), {
          lotoPoints: eq.lotoPoints.filter((lp) => lp.id !== lotoPointId)
        }));
      }
      return eq;
    });
    this._allEquipment.set(updatedList);
    const selectedEq = this._selectedEquipment();
    if (selectedEq?.lotoPoints?.some((lp) => lp.id === lotoPointId)) {
      const updated = new EquipmentDto(__spreadProps(__spreadValues({}, selectedEq), {
        lotoPoints: selectedEq.lotoPoints.filter((lp) => lp.id !== lotoPointId)
      }));
      this._selectedEquipment.set(updated);
    }
  }
  // Reset all state
  reset() {
    this._isLoading.set(true);
    this._error.set(null);
    this._currentFile.set(null);
    this._allEquipment.set([]);
    this._selectedEquipment.set(null);
    this._highlightedEquipmentId.set(null);
    this._isLotoPointTableOpen.set(false);
    this._isLotoPointFormOpen.set(false);
    this._selectedLotoPoint.set(null);
  }
  static \u0275fac = function RfEquipmentEditorStateService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _RfEquipmentEditorStateService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _RfEquipmentEditorStateService, factory: _RfEquipmentEditorStateService.\u0275fac });
};

// src/app/services/loto/loto-point.service.ts
var LotoPointService = class _LotoPointService {
  http;
  apiUrl = `${environment.apiUrl}/loto-points`;
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
    return this.http.post(this.apiUrl, lotoPoint);
  }
  updateLotoPoint(lotoPoint) {
    let lotoPointIdDto;
    if (lotoPoint instanceof LotoPointDto) {
      lotoPointIdDto = lotoPoint.toIdModel();
    } else if (this.isLotoPointIdDto(lotoPoint)) {
      lotoPointIdDto = lotoPoint;
    } else {
      console.error("Invalid parameter type, expected LotoPointDto or LotoPointIdDto");
      const fullLotoPoint = new LotoPointDto();
      Object.assign(fullLotoPoint, lotoPoint);
      lotoPointIdDto = fullLotoPoint.toIdModel();
    }
    const headers = new HttpHeaders().set("Content-Type", "application/json");
    return this.http.put(`${this.apiUrl}`, lotoPointIdDto, { headers });
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
  deleteLotoPoint(id) {
    return this.http.delete(`${this.apiUrl}/${id}`);
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
  static \u0275fac = function LotoPointService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _LotoPointService)(\u0275\u0275inject(HttpClient));
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _LotoPointService, factory: _LotoPointService.\u0275fac, providedIn: "root" });
};

// src/app/features/equipment/refactored/services/rf-equipment-editor-data.service.ts
var RfEquipmentEditorDataService = class _RfEquipmentEditorDataService {
  equipmentService = inject(EquipmentService);
  fileService = inject(FileService);
  lotoPointService = inject(LotoPointService);
  stateService = inject(RfEquipmentEditorStateService);
  /**
   * Load equipment and its associated file
   */
  loadEquipmentAndFile(equipmentId) {
    this.stateService.setLoading(true);
    this.stateService.setError(null);
    return this.equipmentService.getEquipmentById(equipmentId).pipe(tap((response) => {
      const equipment = response?.responseData ? new EquipmentDto(response.responseData) : null;
      if (equipment) {
        this.stateService.setSelectedEquipment(equipment);
      }
    }), switchMap((response) => {
      const equipment = response?.responseData ? new EquipmentDto(response.responseData) : null;
      if (!equipment) {
        throw new Error("Equipment not found");
      }
      return this.getPrimaryFile(equipment);
    }), tap((file) => {
      if (!file || !file.id) {
        throw new Error("No file associated with this equipment");
      }
    }), switchMap((file) => this.loadFileAndEquipment(file.id)), catchError((error) => {
      this.stateService.setError(error.message || "Failed to load equipment");
      this.stateService.setLoading(false);
      return throwError(() => error);
    }));
  }
  /**
   * Load file details and all equipment on that file
   */
  loadFileAndEquipment(fileId) {
    return forkJoin({
      file: this.fileService.getFileById(fileId.toString()).pipe(map((response) => response?.responseData ? new FileDto(response.responseData) : null)),
      equipment: this.fileService.getEquipmentByFileId(fileId).pipe(map((response) => {
        if (response?.responseData) {
          const data = Array.isArray(response.responseData) ? response.responseData : response.responseData || [];
          return data.map((eq) => new EquipmentDto(eq));
        }
        return [];
      }))
    }).pipe(tap((result) => {
      if (result.file) {
        this.stateService.setCurrentFile(result.file);
      }
      this.stateService.setAllEquipment(result.equipment || []);
      this.stateService.setLoading(false);
    }), map(() => void 0), catchError((error) => {
      this.stateService.setError("Failed to load file data");
      this.stateService.setLoading(false);
      return throwError(() => error);
    }));
  }
  /**
   * Get the primary file for an equipment
   * Returns an Observable that resolves to FileDto or null
   */
  getPrimaryFile(equipment) {
    if (equipment.mainFileObject) {
      return of(new FileDto(equipment.mainFileObject));
    }
    if (equipment.mainFileId) {
      return this.fileService.getFileById(equipment.mainFileId.toString()).pipe(map((response) => response?.responseData ? new FileDto(response.responseData) : null), catchError((error) => {
        console.error("Error fetching file by mainFileId:", error);
        return of(null);
      }));
    }
    return of(null);
  }
  /**
   * Update equipment coordinates
   */
  updateEquipmentCoordinates(equipment) {
    return this.equipmentService.updateEquipment(equipment).pipe(tap((response) => {
      if (response?.responseData) {
        this.stateService.updateEquipmentInList(new EquipmentDto(response.responseData));
      }
    }), catchError((error) => {
      console.error("Error updating equipment:", error);
      return of(null);
    }));
  }
  /**
   * Update a loto point
   */
  updateLotoPoint(lotoPoint) {
    return this.lotoPointService.updateLotoPoint(lotoPoint).pipe(tap((response) => {
      if (response?.responseData) {
        this.stateService.updateLotoPointInEquipment(new LotoPointDto(response.responseData));
      }
    }), catchError((error) => {
      console.error("Error updating loto point:", error);
      return of(null);
    }));
  }
  /**
   * Delete a loto point
   */
  deleteLotoPoint(lotoPointId) {
    return this.lotoPointService.deleteLotoPoint(lotoPointId.toString()).pipe(tap((response) => {
      if (response) {
        this.stateService.removeLotoPointFromEquipment(lotoPointId);
      }
    }), catchError((error) => {
      console.error("Error deleting loto point:", error);
      return of(null);
    }));
  }
  /**
   * Create a new loto point
   */
  createLotoPoint(lotoPoint) {
    return this.lotoPointService.createLotoPoint(lotoPoint).pipe(tap((response) => {
      if (response?.responseData) {
        const newLotoPoint = new LotoPointDto(response.responseData);
        this.stateService.updateLotoPointInEquipment(newLotoPoint);
      }
    }), catchError((error) => {
      console.error("Error creating loto point:", error);
      return of(null);
    }));
  }
  static \u0275fac = function RfEquipmentEditorDataService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _RfEquipmentEditorDataService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _RfEquipmentEditorDataService, factory: _RfEquipmentEditorDataService.\u0275fac });
};

// src/app/features/equipment/refactored/services/rf-equipment-editor-ui.service.ts
var RfEquipmentEditorUiService = class _RfEquipmentEditorUiService {
  stateService = inject(RfEquipmentEditorStateService);
  dataService = inject(RfEquipmentEditorDataService);
  shapeManager = inject(ShapeManagerService);
  equipmentMapper = inject(EquipmentMapperService);
  /**
   * Handle loto point selection from table
   */
  handleLotoPointSelection(lotoPoints) {
    if (lotoPoints.length === 0)
      return;
    const selectedLotoPoint = lotoPoints[0];
    const equipment = this.stateService.allEquipment();
    const matchingEquipment = equipment.find((eq) => eq.lotoPoints?.some((lp) => lp.id === selectedLotoPoint.id));
    if (matchingEquipment?.id) {
      this.highlightEquipment(matchingEquipment.id);
    }
  }
  /**
   * Handle shape right-click to open loto point form
   */
  handleShapeRightClick(shape) {
    const equipment = this.stateService.allEquipment();
    const matchingEquipment = equipment.find((eq) => eq.id === shape.id);
    if (matchingEquipment?.lotoPoints && matchingEquipment.lotoPoints.length > 0) {
      this.stateService.openLotoPointForm(matchingEquipment.lotoPoints[0]);
    }
  }
  /**
   * Handle shape selection
   */
  handleShapeSelection(shape) {
    if (shape.id) {
      this.stateService.setHighlightedEquipmentId(shape.id);
    }
  }
  /**
   * Handle shape update (drag/resize)
   */
  handleShapeUpdate(shape) {
    const equipment = this.stateService.allEquipment();
    const matchingEquipment = equipment.find((eq) => eq.id === shape.id);
    if (!matchingEquipment)
      return;
    const updatedEquipment = this.createUpdatedEquipmentFromShape(matchingEquipment, shape);
    this.dataService.updateEquipmentCoordinates(updatedEquipment).subscribe({
      next: () => {
        console.log("Equipment coordinates updated successfully");
      },
      error: (error) => {
        console.error("Failed to update equipment coordinates:", error);
      }
    });
  }
  /**
   * Highlight equipment on the image
   */
  highlightEquipment(equipmentId) {
    this.shapeManager.selectShape(equipmentId, true);
    this.stateService.setHighlightedEquipmentId(equipmentId);
  }
  /**
   * Submit loto point form (create or update)
   */
  submitLotoPointForm(lotoPoint) {
    if (!lotoPoint)
      return;
    if (lotoPoint.id) {
      this.dataService.updateLotoPoint(lotoPoint).subscribe({
        next: () => {
          this.stateService.closeLotoPointForm();
        }
      });
    } else {
      this.dataService.createLotoPoint(lotoPoint).subscribe({
        next: () => {
          this.stateService.closeLotoPointForm();
        }
      });
    }
  }
  /**
   * Delete loto point
   */
  deleteLotoPoint(lotoPointId) {
    if (!lotoPointId)
      return;
    this.dataService.deleteLotoPoint(lotoPointId).subscribe({
      next: () => {
        this.stateService.closeLotoPointForm();
      }
    });
  }
  /**
   * Create updated equipment DTO from shape changes
   */
  createUpdatedEquipmentFromShape(equipment, shape) {
    const updatedEquipment = new EquipmentDto(equipment);
    if (shape.type === "rectangle" || shape.type === "image" || shape.type === "svg-symbol") {
      const coordinates = JSON.stringify({
        startX: shape.x,
        startY: shape.y,
        endX: shape.x + shape.width,
        endY: shape.y + shape.height,
        width: shape.width,
        height: shape.height,
        rotation: shape.rotation || 0
      }).replace(/^"|"$/g, "").replace(/\\/g, "").replace(/"(\w+)":/g, "$1:");
      const originalPictureSize = `width:${shape.originalPictureWidth},height:${shape.originalPictureHeight}`;
      updatedEquipment.coordinates = coordinates;
      updatedEquipment.originalPictureSize = originalPictureSize;
    }
    return updatedEquipment;
  }
  /**
   * Get shapes for InteractiveImageComponent
   */
  getShapesFromEquipment() {
    const equipment = this.stateService.allEquipment();
    return this.equipmentMapper.mapAllToRfShapes(equipment);
  }
  static \u0275fac = function RfEquipmentEditorUiService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _RfEquipmentEditorUiService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _RfEquipmentEditorUiService, factory: _RfEquipmentEditorUiService.\u0275fac });
};

// src/app/features/equipment/refactored/rf-equipment-editor/rf-equipment-editor.component.ts
function RfEquipmentEditorComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 1);
    \u0275\u0275element(1, "div", 4);
    \u0275\u0275elementStart(2, "p");
    \u0275\u0275text(3, "Loading equipment...");
    \u0275\u0275elementEnd()();
  }
}
function RfEquipmentEditorComponent_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 2)(1, "i", 5);
    \u0275\u0275text(2, "\u26A0\uFE0F");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "p");
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(ctx_r0.error());
  }
}
function RfEquipmentEditorComponent_Conditional_3_Conditional_2_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 13);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const equipment_r3 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(equipment_r3.description);
  }
}
function RfEquipmentEditorComponent_Conditional_3_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 7)(1, "h2");
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275template(3, RfEquipmentEditorComponent_Conditional_3_Conditional_2_Conditional_3_Template, 2, 1, "p", 13);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const equipment_r3 = ctx;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(equipment_r3.tagNumber || "Equipment Editor");
    \u0275\u0275advance();
    \u0275\u0275conditional(equipment_r3.description ? 3 : -1);
  }
}
function RfEquipmentEditorComponent_Conditional_3_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "app-interactive-image", 14);
    \u0275\u0275listener("shapeClicked", function RfEquipmentEditorComponent_Conditional_3_Conditional_7_Template_app_interactive_image_shapeClicked_0_listener($event) {
      \u0275\u0275restoreView(_r4);
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.onShapeSelected($event));
    })("shapeRightClicked", function RfEquipmentEditorComponent_Conditional_3_Conditional_7_Template_app_interactive_image_shapeRightClicked_0_listener($event) {
      \u0275\u0275restoreView(_r4);
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.onShapeRightClicked($event));
    })("shapeUpdated", function RfEquipmentEditorComponent_Conditional_3_Conditional_7_Template_app_interactive_image_shapeUpdated_0_listener($event) {
      \u0275\u0275restoreView(_r4);
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.onShapeUpdated($event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275property("imageUrl", ctx_r0.fileLink())("shapesInput", ctx_r0.shapes())("preset", "EQUIPMENT_EDITOR");
  }
}
function RfEquipmentEditorComponent_Conditional_3_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 12)(1, "p");
    \u0275\u0275text(2, "No file available for this equipment");
    \u0275\u0275elementEnd()();
  }
}
function RfEquipmentEditorComponent_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 3)(1, "div", 6);
    \u0275\u0275template(2, RfEquipmentEditorComponent_Conditional_3_Conditional_2_Template, 4, 2, "div", 7);
    \u0275\u0275elementStart(3, "div", 8)(4, "button", 9);
    \u0275\u0275listener("click", function RfEquipmentEditorComponent_Conditional_3_Template_button_click_4_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.openLotoPointTable());
    });
    \u0275\u0275text(5);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(6, "div", 10);
    \u0275\u0275template(7, RfEquipmentEditorComponent_Conditional_3_Conditional_7_Template, 1, 3, "app-interactive-image", 11)(8, RfEquipmentEditorComponent_Conditional_3_Conditional_8_Template, 3, 0, "div", 12);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    let tmp_1_0;
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275conditional((tmp_1_0 = ctx_r0.selectedEquipment()) ? 2 : -1, tmp_1_0);
    \u0275\u0275advance(2);
    \u0275\u0275property("disabled", ctx_r0.allLotoPoints().length === 0);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" View LOTO Points (", ctx_r0.allLotoPoints().length, ") ");
    \u0275\u0275advance(2);
    \u0275\u0275conditional(ctx_r0.fileLink() ? 7 : 8);
  }
}
var RfEquipmentEditorComponent = class _RfEquipmentEditorComponent {
  // Services
  stateService = inject(RfEquipmentEditorStateService);
  dataService = inject(RfEquipmentEditorDataService);
  uiService = inject(RfEquipmentEditorUiService);
  destroyRef = inject(DestroyRef);
  // Input
  selectedEquipmentId = input.required();
  // Expose state as readonly signals
  isLoading = this.stateService.isLoading;
  error = this.stateService.error;
  fileLink = this.stateService.fileLink;
  selectedEquipment = this.stateService.selectedEquipment;
  isLotoPointTableOpen = this.stateService.isLotoPointTableOpen;
  isLotoPointFormOpen = this.stateService.isLotoPointFormOpen;
  selectedLotoPoint = this.stateService.selectedLotoPoint;
  allLotoPoints = this.stateService.allLotoPoints;
  // Computed shapes
  shapes = computed(() => this.uiService.getShapesFromEquipment());
  constructor() {
    effect(() => {
      const selectedId = this.selectedEquipmentId();
      if (selectedId) {
        this.dataService.loadEquipmentAndFile(selectedId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
      }
    });
    effect(() => {
      const shapes = this.shapes();
      const selectedId = this.selectedEquipmentId();
      const highlightedId = this.stateService.highlightedEquipmentId();
      if (shapes.length > 0 && selectedId && !highlightedId) {
        setTimeout(() => {
          this.uiService.highlightEquipment(selectedId);
        }, 100);
      }
    });
  }
  // Loto point table actions
  openLotoPointTable() {
    this.stateService.openLotoPointTable();
  }
  closeLotoPointTable() {
    this.stateService.closeLotoPointTable();
  }
  onLotoPointSelected(lotoPoints) {
    this.uiService.handleLotoPointSelection(lotoPoints);
  }
  // Shape interaction handlers
  onShapeRightClicked(shape) {
    this.uiService.handleShapeRightClick(shape);
  }
  onShapeSelected(shape) {
    this.uiService.handleShapeSelection(shape);
  }
  onShapeUpdated(shape) {
    this.uiService.handleShapeUpdate(shape);
  }
  // Loto point form actions
  onLotoPointFormClose() {
    this.stateService.closeLotoPointForm();
  }
  onLotoPointFormSubmit(lotoPoint) {
    this.uiService.submitLotoPointForm(lotoPoint);
  }
  onLotoPointFormDelete() {
    const lotoPoint = this.selectedLotoPoint();
    if (lotoPoint?.id) {
      this.uiService.deleteLotoPoint(lotoPoint.id);
    }
  }
  static \u0275fac = function RfEquipmentEditorComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _RfEquipmentEditorComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _RfEquipmentEditorComponent, selectors: [["app-rf-equipment-editor"]], inputs: { selectedEquipmentId: [1, "selectedEquipmentId"] }, features: [\u0275\u0275ProvidersFeature([
    RfEquipmentEditorStateService,
    RfEquipmentEditorDataService,
    RfEquipmentEditorUiService
  ])], decls: 4, vars: 3, consts: [[1, "equipment-editor-container"], [1, "loading-overlay"], [1, "error-message"], [1, "editor-content"], [1, "spinner"], [1, "error-icon"], [1, "editor-header"], [1, "equipment-info"], [1, "header-actions"], [1, "btn", "btn-primary", 3, "click", "disabled"], [1, "image-container"], [3, "imageUrl", "shapesInput", "preset"], [1, "no-file-message"], [1, "equipment-name"], [3, "shapeClicked", "shapeRightClicked", "shapeUpdated", "imageUrl", "shapesInput", "preset"]], template: function RfEquipmentEditorComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0);
      \u0275\u0275template(1, RfEquipmentEditorComponent_Conditional_1_Template, 4, 0, "div", 1)(2, RfEquipmentEditorComponent_Conditional_2_Template, 5, 1, "div", 2)(3, RfEquipmentEditorComponent_Conditional_3_Template, 9, 4, "div", 3);
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      \u0275\u0275advance();
      \u0275\u0275conditional(ctx.isLoading() ? 1 : -1);
      \u0275\u0275advance();
      \u0275\u0275conditional(ctx.error() ? 2 : -1);
      \u0275\u0275advance();
      \u0275\u0275conditional(!ctx.isLoading() && !ctx.error() ? 3 : -1);
    }
  }, dependencies: [
    CommonModule,
    InteractiveImageComponent
  ], styles: ["\n\n.equipment-editor-container[_ngcontent-%COMP%] {\n  width: 100%;\n  height: 100%;\n  display: flex;\n  flex-direction: column;\n  position: relative;\n  background-color: #f5f5f5;\n}\n.loading-overlay[_ngcontent-%COMP%] {\n  position: absolute;\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  background-color: rgba(255, 255, 255, 0.9);\n  z-index: 1000;\n}\n.spinner[_ngcontent-%COMP%] {\n  width: 50px;\n  height: 50px;\n  border: 4px solid #f3f3f3;\n  border-top: 4px solid #3498db;\n  border-radius: 50%;\n  animation: _ngcontent-%COMP%_spin 1s linear infinite;\n}\n@keyframes _ngcontent-%COMP%_spin {\n  0% {\n    transform: rotate(0deg);\n  }\n  100% {\n    transform: rotate(360deg);\n  }\n}\n.loading-overlay[_ngcontent-%COMP%]   p[_ngcontent-%COMP%] {\n  margin-top: 1rem;\n  font-size: 1.1rem;\n  color: #666;\n}\n.error-message[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  padding: 2rem;\n  margin: 2rem;\n  background-color: #fee;\n  border: 1px solid #fcc;\n  border-radius: 8px;\n  color: #c33;\n}\n.error-icon[_ngcontent-%COMP%] {\n  font-size: 2rem;\n  margin-right: 1rem;\n}\n.error-message[_ngcontent-%COMP%]   p[_ngcontent-%COMP%] {\n  font-size: 1.1rem;\n  margin: 0;\n}\n.editor-content[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  height: 100%;\n  overflow: hidden;\n}\n.editor-header[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 1rem 1.5rem;\n  background-color: white;\n  border-bottom: 1px solid #ddd;\n  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);\n}\n.equipment-info[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%] {\n  margin: 0;\n  font-size: 1.5rem;\n  color: #333;\n}\n.equipment-name[_ngcontent-%COMP%] {\n  margin: 0.25rem 0 0 0;\n  font-size: 0.9rem;\n  color: #666;\n}\n.header-actions[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 0.5rem;\n}\n.btn[_ngcontent-%COMP%] {\n  padding: 0.5rem 1rem;\n  border: none;\n  border-radius: 4px;\n  font-size: 0.9rem;\n  cursor: pointer;\n  transition: all 0.2s;\n}\n.btn-primary[_ngcontent-%COMP%] {\n  background-color: #3498db;\n  color: white;\n}\n.btn-primary[_ngcontent-%COMP%]:hover:not(:disabled) {\n  background-color: #2980b9;\n}\n.btn[_ngcontent-%COMP%]:disabled {\n  opacity: 0.5;\n  cursor: not-allowed;\n}\n.image-container[_ngcontent-%COMP%] {\n  flex: 1;\n  overflow: hidden;\n  position: relative;\n  background-color: #fafafa;\n}\n.pdf-viewer[_ngcontent-%COMP%] {\n  width: 100%;\n  height: 100%;\n}\n.no-file-message[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  height: 100%;\n  color: #999;\n  font-size: 1.2rem;\n}\n@media (max-width: 768px) {\n  .editor-header[_ngcontent-%COMP%] {\n    flex-direction: column;\n    align-items: flex-start;\n    gap: 1rem;\n  }\n  .header-actions[_ngcontent-%COMP%] {\n    width: 100%;\n  }\n  .btn[_ngcontent-%COMP%] {\n    flex: 1;\n  }\n}\n/*# sourceMappingURL=rf-equipment-editor.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(RfEquipmentEditorComponent, { className: "RfEquipmentEditorComponent", filePath: "src/app/features/equipment/refactored/rf-equipment-editor/rf-equipment-editor.component.ts", lineNumber: 26 });
})();

// src/app/shared/reactive-form/refactored/input-fields/services/equipment-loto-conflict.service.ts
var EquipmentLotoConflictService = class _EquipmentLotoConflictService {
  lotoPointCache = inject(LotoPointCacheService);
  /**
   * Find LOTO points that already have this equipment associated.
   * @param equipmentId The equipment ID to check
   * @param excludeLotoPointId Optional LOTO point ID to exclude (e.g., the current one being edited)
   * @returns Array of LOTO point summaries that have this equipment
   */
  findConflicts(equipmentId, excludeLotoPointId) {
    return this.lotoPointCache.getAllSummaries().filter((lp) => lp.equipmentIds?.includes(equipmentId) && lp.id !== excludeLotoPointId);
  }
  /**
   * Check if equipment has any conflicts.
   * @param equipmentId The equipment ID to check
   * @param excludeLotoPointId Optional LOTO point ID to exclude
   * @returns true if equipment has conflicts
   */
  hasConflicts(equipmentId, excludeLotoPointId) {
    return this.findConflicts(equipmentId, excludeLotoPointId).length > 0;
  }
  /**
   * Batch check for multiple equipment IDs (useful for multi-select).
   * @param equipmentIds Array of equipment IDs to check
   * @param excludeLotoPointId Optional LOTO point ID to exclude
   * @returns Map of equipmentId to array of conflicting LOTO points
   */
  findAllConflicts(equipmentIds, excludeLotoPointId) {
    const result = /* @__PURE__ */ new Map();
    for (const equipmentId of equipmentIds) {
      const conflicts = this.findConflicts(equipmentId, excludeLotoPointId);
      if (conflicts.length > 0) {
        result.set(equipmentId, conflicts);
      }
    }
    return result;
  }
  /**
   * Get equipment IDs that have conflicts from a list.
   * @param equipmentIds Array of equipment IDs to check
   * @param excludeLotoPointId Optional LOTO point ID to exclude
   * @returns Array of EquipmentConflict objects for equipment with conflicts
   */
  getConflictingEquipment(equipmentIds, excludeLotoPointId) {
    return equipmentIds.map((equipmentId) => ({
      equipmentId,
      conflicts: this.findConflicts(equipmentId, excludeLotoPointId)
    })).filter((item) => item.conflicts.length > 0);
  }
  /**
   * Check if equipment has NO association with any LOTO point.
   * Used for zero energy fields where equipment MUST have a LOTO point.
   * @param equipmentId The equipment ID to check
   * @returns true if equipment has NO LOTO point association
   */
  hasNoAssociation(equipmentId) {
    return this.findConflicts(equipmentId).length === 0;
  }
  static \u0275fac = function EquipmentLotoConflictService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _EquipmentLotoConflictService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _EquipmentLotoConflictService, factory: _EquipmentLotoConflictService.\u0275fac, providedIn: "root" });
};

// src/app/shared/reactive-form/refactored/input-fields/equipment-conflict-dialog/equipment-conflict-dialog.component.ts
var _forTrack08 = ($index, $item) => $item.id;
function EquipmentConflictDialogComponent_Conditional_1_Conditional_16_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 7)(1, "span", 8);
    \u0275\u0275text(2, "File:");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "span", 9);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(ctx_r1.data.equipment.mainFileObject == null ? null : ctx_r1.data.equipment.mainFileObject.name);
  }
}
function EquipmentConflictDialogComponent_Conditional_1_Conditional_17_For_5_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 19);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const conflict_r3 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(conflict_r3.description);
  }
}
function EquipmentConflictDialogComponent_Conditional_1_Conditional_17_For_5_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 20);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const conflict_r3 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(conflict_r3.location);
  }
}
function EquipmentConflictDialogComponent_Conditional_1_Conditional_17_For_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 16)(1, "div", 17);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "div", 18);
    \u0275\u0275template(4, EquipmentConflictDialogComponent_Conditional_1_Conditional_17_For_5_Conditional_4_Template, 2, 1, "span", 19)(5, EquipmentConflictDialogComponent_Conditional_1_Conditional_17_For_5_Conditional_5_Template, 2, 1, "span", 20);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const conflict_r3 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(conflict_r3.tagNumber);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(conflict_r3.description ? 4 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(conflict_r3.location ? 5 : -1);
  }
}
function EquipmentConflictDialogComponent_Conditional_1_Conditional_17_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 10)(1, "h4");
    \u0275\u0275text(2, "Currently Associated With");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "div", 15);
    \u0275\u0275repeaterCreate(4, EquipmentConflictDialogComponent_Conditional_1_Conditional_17_For_5_Template, 6, 3, "div", 16, _forTrack08);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(4);
    \u0275\u0275repeater(ctx_r1.data.conflicts);
  }
}
function EquipmentConflictDialogComponent_Conditional_1_Conditional_18_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 11)(1, "h4");
    \u0275\u0275text(2, "Will Be Reassigned To");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "div", 21);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(ctx_r1.data.currentLotoPointTagNumber);
  }
}
function EquipmentConflictDialogComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 1)(1, "div", 2);
    \u0275\u0275text(2, "\u26A0\uFE0F");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "div", 3)(4, "p", 4);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "p", 5);
    \u0275\u0275text(7);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(8, "div", 6)(9, "h4");
    \u0275\u0275text(10, "Selected Equipment");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(11, "div", 7)(12, "span", 8);
    \u0275\u0275text(13, "Tag Number:");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(14, "span", 9);
    \u0275\u0275text(15);
    \u0275\u0275elementEnd()();
    \u0275\u0275template(16, EquipmentConflictDialogComponent_Conditional_1_Conditional_16_Template, 5, 1, "div", 7);
    \u0275\u0275elementEnd();
    \u0275\u0275template(17, EquipmentConflictDialogComponent_Conditional_1_Conditional_17_Template, 6, 0, "div", 10)(18, EquipmentConflictDialogComponent_Conditional_1_Conditional_18_Template, 5, 1, "div", 11);
    \u0275\u0275elementStart(19, "div", 12)(20, "button", 13);
    \u0275\u0275listener("click", function EquipmentConflictDialogComponent_Conditional_1_Template_button_click_20_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onCancel());
    });
    \u0275\u0275text(21, "Cancel");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(22, "button", 14);
    \u0275\u0275listener("click", function EquipmentConflictDialogComponent_Conditional_1_Template_button_click_22_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onConfirm());
    });
    \u0275\u0275text(23);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate1(" ", ctx_r1.getPrimaryMessage(), " ");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", ctx_r1.getSecondaryMessage(), " ");
    \u0275\u0275advance(8);
    \u0275\u0275textInterpolate(ctx_r1.data.equipment.tagNumber || "N/A");
    \u0275\u0275advance();
    \u0275\u0275conditional((ctx_r1.data.equipment.mainFileObject == null ? null : ctx_r1.data.equipment.mainFileObject.name) ? 16 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(!ctx_r1.isNoAssociationConflict() && ctx_r1.data.conflicts.length > 0 ? 17 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(!ctx_r1.isNoAssociationConflict() && ctx_r1.data.currentLotoPointTagNumber ? 18 : -1);
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate(ctx_r1.getConfirmButtonText());
  }
}
var EquipmentConflictDialogComponent = class _EquipmentConflictDialogComponent {
  isOpen = false;
  data = null;
  confirmed = output();
  cancelled = output();
  onConfirm() {
    if (this.data?.equipment) {
      this.confirmed.emit(this.data.equipment);
    }
  }
  onCancel() {
    this.cancelled.emit();
  }
  getConflictSummary() {
    if (!this.data?.conflicts.length)
      return "";
    const count = this.data.conflicts.length;
    return count === 1 ? "1 existing LOTO point" : `${count} existing LOTO points`;
  }
  getDialogTitle() {
    if (this.data?.conflictType === "no-association") {
      return "Equipment Has No LOTO Point";
    }
    return "Equipment Already Associated";
  }
  getPrimaryMessage() {
    if (this.data?.conflictType === "no-association") {
      return "This equipment is not associated with any LOTO point.";
    }
    return `This equipment is already associated with ${this.getConflictSummary()}.`;
  }
  getSecondaryMessage() {
    if (this.data?.conflictType === "no-association") {
      return "Zero energy verification requires equipment with an existing LOTO point association.";
    }
    return "Adding it to the current LOTO point will reassign this equipment.";
  }
  getConfirmButtonText() {
    if (this.data?.conflictType === "no-association") {
      return "Add Anyway";
    }
    return "Confirm & Add";
  }
  isNoAssociationConflict() {
    return this.data?.conflictType === "no-association";
  }
  static \u0275fac = function EquipmentConflictDialogComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _EquipmentConflictDialogComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _EquipmentConflictDialogComponent, selectors: [["app-equipment-conflict-dialog"]], inputs: { isOpen: "isOpen", data: "data" }, outputs: { confirmed: "confirmed", cancelled: "cancelled" }, decls: 2, vars: 3, consts: [["size", "medium", 3, "close", "isOpen", "title"], [1, "conflict-dialog"], [1, "warning-icon"], [1, "message"], [1, "primary-message"], [1, "secondary-message"], [1, "equipment-info"], [1, "info-row"], [1, "label"], [1, "value"], [1, "conflicts-section"], [1, "reassign-info"], [1, "actions"], [1, "btn-cancel", 3, "click"], [1, "btn-confirm", 3, "click"], [1, "conflicts-list"], [1, "conflict-item"], [1, "conflict-tag"], [1, "conflict-details"], [1, "description"], [1, "location"], [1, "reassign-target"]], template: function EquipmentConflictDialogComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "app-rf-popup-projection", 0);
      \u0275\u0275listener("close", function EquipmentConflictDialogComponent_Template_app_rf_popup_projection_close_0_listener() {
        return ctx.onCancel();
      });
      \u0275\u0275template(1, EquipmentConflictDialogComponent_Conditional_1_Template, 24, 7, "div", 1);
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      \u0275\u0275property("isOpen", ctx.isOpen)("title", ctx.getDialogTitle());
      \u0275\u0275advance();
      \u0275\u0275conditional(ctx.data ? 1 : -1);
    }
  }, dependencies: [CommonModule, RfPopupProjectionComponent], styles: ["\n\n.conflict-dialog[_ngcontent-%COMP%] {\n  padding: 20px;\n  display: flex;\n  flex-direction: column;\n  gap: 20px;\n}\n.warning-icon[_ngcontent-%COMP%] {\n  font-size: 48px;\n  text-align: center;\n}\n.message[_ngcontent-%COMP%] {\n  text-align: center;\n}\n.primary-message[_ngcontent-%COMP%] {\n  font-size: 1.1em;\n  font-weight: 500;\n  color: var(--text-primary, #333);\n  margin: 0 0 8px 0;\n}\n.secondary-message[_ngcontent-%COMP%] {\n  font-size: 0.95em;\n  color: var(--text-secondary, #666);\n  margin: 0;\n}\n.equipment-info[_ngcontent-%COMP%], \n.conflicts-section[_ngcontent-%COMP%], \n.reassign-info[_ngcontent-%COMP%] {\n  background: var(--surface-light, #f5f5f5);\n  border-radius: 8px;\n  padding: 16px;\n}\n.equipment-info[_ngcontent-%COMP%]   h4[_ngcontent-%COMP%], \n.conflicts-section[_ngcontent-%COMP%]   h4[_ngcontent-%COMP%], \n.reassign-info[_ngcontent-%COMP%]   h4[_ngcontent-%COMP%] {\n  margin: 0 0 12px 0;\n  font-size: 0.9em;\n  text-transform: uppercase;\n  color: var(--text-secondary, #666);\n  letter-spacing: 0.5px;\n}\n.info-row[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 8px;\n  margin-bottom: 4px;\n}\n.info-row[_ngcontent-%COMP%]   .label[_ngcontent-%COMP%] {\n  font-weight: 500;\n  color: var(--text-secondary, #666);\n}\n.info-row[_ngcontent-%COMP%]   .value[_ngcontent-%COMP%] {\n  color: var(--text-primary, #333);\n}\n.conflicts-list[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n  max-height: 150px;\n  overflow-y: auto;\n}\n.conflict-item[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  padding: 8px 12px;\n  background: var(--card-background, #fff);\n  border-radius: 6px;\n  border: 1px solid var(--border-color, #e0e0e0);\n}\n.conflict-tag[_ngcontent-%COMP%] {\n  font-weight: 600;\n  color: var(--primary-color, #1976d2);\n  white-space: nowrap;\n}\n.conflict-details[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 2px;\n  font-size: 0.9em;\n  color: var(--text-secondary, #666);\n}\n.reassign-target[_ngcontent-%COMP%] {\n  font-weight: 600;\n  font-size: 1.1em;\n  color: var(--success-color, #2e7d32);\n}\n.actions[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: flex-end;\n  gap: 12px;\n  padding-top: 12px;\n  border-top: 1px solid var(--border-color, #e0e0e0);\n}\n.btn-cancel[_ngcontent-%COMP%], \n.btn-confirm[_ngcontent-%COMP%] {\n  padding: 10px 20px;\n  border-radius: 6px;\n  font-size: 0.95em;\n  font-weight: 500;\n  cursor: pointer;\n  transition: all 0.2s;\n}\n.btn-cancel[_ngcontent-%COMP%] {\n  background: transparent;\n  border: 1px solid var(--border-color, #ccc);\n  color: var(--text-primary, #333);\n}\n.btn-cancel[_ngcontent-%COMP%]:hover {\n  background: var(--surface-light, #f5f5f5);\n}\n.btn-confirm[_ngcontent-%COMP%] {\n  background: var(--warning-color, #ff9800);\n  border: none;\n  color: white;\n}\n.btn-confirm[_ngcontent-%COMP%]:hover {\n  background: var(--warning-color-dark, #f57c00);\n}\n/*# sourceMappingURL=equipment-conflict-dialog.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(EquipmentConflictDialogComponent, { className: "EquipmentConflictDialogComponent", filePath: "src/app/shared/reactive-form/refactored/input-fields/equipment-conflict-dialog/equipment-conflict-dialog.component.ts", lineNumber: 23 });
})();

// src/app/services/value.service.ts
var ValueService = class _ValueService {
  http;
  apiUrl = `${environment.apiUrl}/values`;
  constructor(http) {
    this.http = http;
  }
  addValueToCategoryById(categoryId, value) {
    return this.http.post(`${this.apiUrl}/add-to-category-by-id/${categoryId}`, value);
  }
  addValueToCategoryByName(categoryName, value, valueAlias = "") {
    return this.http.post(`${this.apiUrl}/add-to-category-by-name`, { category: categoryName, value, valueAlias });
  }
  getAllCategories() {
    return this.http.get(`${this.apiUrl}/categories`);
  }
  updateValue(valueId, newName, newAlias = "") {
    return this.http.put(`${this.apiUrl}/${valueId}`, { name: newName, alias: newAlias });
  }
  deleteValueAndTransfer(valueIdToDelete, transferToValueId) {
    return this.http.post(`${this.apiUrl}/delete-and-transfer`, {
      valueIdToDelete,
      transferToValueId
    });
  }
  static \u0275fac = function ValueService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _ValueService)(\u0275\u0275inject(HttpClient));
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _ValueService, factory: _ValueService.\u0275fac, providedIn: "root" });
};

// src/app/services/current-value.service.ts
var CurrentValueService = class _CurrentValueService {
  http;
  url = environment.apiUrl + "/values";
  allDataSubject = new BehaviorSubject({});
  allData$;
  allCategoriesSubject = new BehaviorSubject([]);
  allCategories$;
  currentValuesSubject = new BehaviorSubject([]);
  currentValues$ = this.currentValuesSubject.asObservable();
  valueService = inject(ValueService);
  constructor(http) {
    this.http = http;
    this.allData$ = this.allDataSubject.asObservable();
    this.loadAllData();
    this.allCategories$ = this.allCategoriesSubject.asObservable();
    this.loadAllCategories();
  }
  loadAllData() {
    this.http.get(this.url + "/all-values").pipe(map((response) => {
      this.currentValuesSubject.next(response.responseData);
      return response.responseData;
    }), map((values) => {
      const categoryData = {};
      values.forEach((value) => {
        if (!categoryData[value.category.alias]) {
          categoryData[value.category.alias] = [];
        }
        categoryData[value.category.alias].push(value);
      });
      return categoryData;
    }), tap((data) => this.allDataSubject.next(data)), catchError((error) => {
      console.error("Error loading data:", error);
      return of({});
    }), shareReplay(1)).subscribe();
  }
  loadAllCategories() {
    this.valueService.getAllCategories().pipe(tap((response) => {
      this.allCategoriesSubject.next(response.responseData);
    }), catchError((error) => {
      console.error("Error loading categories:", error);
      return of([]);
    }), shareReplay(1)).subscribe();
  }
  // updateCategoryWithNewValue(category: string, newValueName: string) {
  //   const currentData = this.allDataSubject.value;
  //   if (!currentData[category]) {
  //     currentData[category] = [];
  //   }
  //   const categoryDto = new CategoryDto({ name: category, alias: category });
  //   const newValue = new ValueDto({ name: newValueName, category: categoryDto });
  //   currentData[category].push(newValue);
  //   this.allDataSubject.next({...currentData});
  //   // Optionally, you can also send this update to the server
  //   return this.valueService.addValueToCategoryByName(category,newValueName).pipe(
  //     tap(response => {
  //       // Update the local data with the server response if needed
  //       const updatedValue = response.responseData;
  //       const updatedData = {...this.allDataSubject.value};
  //       const index = updatedData[category].findIndex(v => v.id === updatedValue.id);
  //       if (index !== -1) {
  //         updatedData[category][index] = updatedValue;
  //       } else {
  //         updatedData[category].push(updatedValue);
  //       }
  //       this.allDataSubject.next(updatedData);
  //     }),
  //     catchError(error => {
  //       console.error('Error updating category:', error);
  //       // Revert the local change if the server update fails
  //       this.allDataSubject.next(currentData);
  //       return of(null);
  //     })
  //   ).subscribe({
  //     next: (response) => console.log('Server updated successfully', response),
  //     error: (error) => console.error('Error updating server', error)
  //   });
  // }
  updateCategoryWithNewValue(category, newValueName, valueAlias = "") {
    return this.valueService.addValueToCategoryByName(category, newValueName, valueAlias).pipe(tap((response) => {
      const updatedValue = response.responseData;
      const currentData = __spreadValues({}, this.allDataSubject.value);
      if (!currentData[category]) {
        currentData[category] = [];
      }
      const index = currentData[category].findIndex((v) => v.id === updatedValue.id);
      if (index !== -1) {
        currentData[category][index] = updatedValue;
      } else {
        currentData[category].push(updatedValue);
      }
      this.allDataSubject.next(currentData);
      const currentValues = [...this.currentValuesSubject.value];
      currentValues.push(updatedValue);
      this.currentValuesSubject.next(currentValues);
    }), map((response) => response.responseData), catchError((error) => {
      console.error("Error updating category:", error);
      return of(null);
    }));
  }
  updateValue(valueId, newName, newAlias = "") {
    return this.valueService.updateValue(valueId, newName, newAlias).pipe(map((response) => response.responseData), tap((updatedValue) => {
      const currentData = __spreadValues({}, this.allDataSubject.value);
      for (const category in currentData) {
        const index = currentData[category].findIndex((v) => v.id === valueId);
        if (index !== -1) {
          currentData[category][index] = updatedValue;
          break;
        }
      }
      this.allDataSubject.next(currentData);
      const currentValues = this.currentValuesSubject.value;
      const valueIndex = currentValues.findIndex((v) => v.id === valueId);
      if (valueIndex !== -1) {
        const updatedValues = [...currentValues];
        updatedValues[valueIndex] = updatedValue;
        this.currentValuesSubject.next(updatedValues);
      }
    }), catchError((error) => {
      console.error("Error updating value:", error);
      return throwError(() => new Error("Failed to update value"));
    }));
  }
  deleteValueAndTransfer(valueIdToDelete, transferToValueId) {
    return this.valueService.deleteValueAndTransfer(valueIdToDelete, transferToValueId).pipe(tap((result) => {
      const currentData = __spreadValues({}, this.allDataSubject.value);
      for (const category in currentData) {
        currentData[category] = currentData[category].filter((v) => v.id !== valueIdToDelete);
      }
      this.allDataSubject.next(currentData);
      const currentValues = this.currentValuesSubject.value.filter((v) => v.id !== valueIdToDelete);
      this.currentValuesSubject.next(currentValues);
    }), catchError((error) => {
      console.error("Error deleting value and transferring items:", error);
      return throwError(() => new Error("Failed to delete value and transfer items"));
    }));
  }
  reloadAllData() {
    this.loadAllData();
  }
  // You can add more methods here as needed, for example:
  getAllCategories() {
    return Object.keys(this.allDataSubject.value);
  }
  getAllCategoryDtos() {
    return this.allCategories$;
  }
  getAllValueDtos() {
    return this.currentValues$;
  }
  // If you need to expose the entire dataset as an Observable
  getAllData() {
    return this.allData$;
  }
  getValuesByCategory(category) {
    if (category && category === "systems")
      category = "system";
    return this.allData$.pipe(map((data) => data[category] || []), shareReplay(1));
  }
  getOptionsByCategory(category) {
    return this.getValuesByCategory(category).pipe(map((values) => values.map((v) => ({ value: v.id, label: v.name }))));
  }
  static \u0275fac = function CurrentValueService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _CurrentValueService)(\u0275\u0275inject(HttpClient));
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _CurrentValueService, factory: _CurrentValueService.\u0275fac, providedIn: "root" });
};

// src/app/features/loto-points/refactored/services/rf-loto-point-mapper.service.ts
var LotoPointMapperService = class _LotoPointMapperService {
  valueService = inject(CurrentValueService);
  destroyRef = inject(DestroyRef);
  isoPosOptions = signal([]);
  normPosOptions = signal([]);
  locationOptions = signal([]);
  eqTypeOptions = signal([]);
  constructor() {
    this.loadAllOptions();
  }
  loadAllOptions() {
    this.loadOptions("isoPos", this.isoPosOptions);
    this.loadOptions("normPos", this.normPosOptions);
    this.loadOptions("location", this.locationOptions);
    this.loadOptions("eqType", this.eqTypeOptions);
  }
  loadOptions(category, optionsSignal) {
    this.valueService.getOptionsByCategory(category).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((options) => {
      optionsSignal.set(options);
    });
  }
  /**
   * Maps LotoPointDto fields to table columns
   * @param fields - Array of field names to include in columns
   * @returns Array of Column objects configured for LotoPoint display
   */
  toTableColumns(fields = [
    "processingStatus",
    "tagNumber",
    "description",
    "specificLocation",
    "location",
    "eqType",
    "isoPos",
    "normPos",
    "isLabeled",
    "isLockable",
    "zeroEnergy",
    "equipmentList",
    "comment"
  ]) {
    const allColumns = {
      id: {
        id: "id",
        header: "ID",
        accessorKey: "id",
        width: 80,
        filterable: true,
        sortable: true
      },
      processingStatus: {
        id: "processingStatus",
        header: "Status",
        accessorKey: "processingStatus.name",
        formFieldKey: "processingStatus",
        accessorFn: (item) => item.processingStatus?.name || "N/A",
        width: 120,
        filterable: true,
        sortable: true,
        conditionalStyling: (item, column) => {
          const alias = item.processingStatus?.alias;
          if (alias === "VRF")
            return { "background-color": "var(--status-complete)" };
          if (alias === "IP")
            return { "background-color": "var(--status-in-progress)" };
          return { "background-color": "var(--status-not-processed)" };
        }
      },
      tagNumber: {
        id: "tagNumber",
        header: "Tag Number",
        accessorKey: "tagNumber",
        width: 200,
        filterable: true,
        sortable: true,
        conditionalStyling: (item, column) => !item.tagNumber ? { "background-color": "var(--status-incomplete)" } : { "background-color": "" }
      },
      description: {
        id: "description",
        header: "Description",
        accessorKey: "description",
        width: 250,
        filterable: true,
        sortable: true,
        conditionalStyling: (item, column) => !item.description ? { "background-color": "var(--status-incomplete)" } : { "background-color": "" }
      },
      specificLocation: {
        id: "specificLocation",
        header: "Specific Location",
        accessorKey: "specificLocation",
        width: 180,
        filterable: true,
        sortable: true,
        conditionalStyling: (item, column) => !item.specificLocation ? { "background-color": "var(--status-incomplete)" } : { "background-color": "" }
      },
      unit: {
        id: "unit",
        header: "Unit",
        accessorKey: "unit",
        width: 100,
        filterable: true,
        sortable: true
      },
      tagged: {
        id: "tagged",
        header: "Tagging Status",
        accessorKey: "tagged",
        width: 130,
        filterable: true,
        sortable: true
      },
      lotos: {
        id: "lotos",
        header: "LOTOs",
        accessorFn: (item) => this.formatLotosList(item.lotos),
        width: 200,
        filterable: false,
        sortable: false
      },
      isoPos: {
        id: "isoPos",
        header: "ISO Position",
        accessorKey: "isoPos.name",
        formFieldKey: "isoPos",
        accessorFn: (item) => item.isoPos?.name || "N/A",
        width: 150,
        filterable: true,
        sortable: true,
        conditionalStyling: (item, column) => !item.isoPos?.id ? { "background-color": "var(--status-incomplete)" } : { "background-color": "" }
      },
      normPos: {
        id: "normPos",
        header: "Normal Position",
        accessorKey: "normPos.name",
        formFieldKey: "normPos",
        accessorFn: (item) => item.normPos?.name || "N/A",
        width: 150,
        filterable: true,
        sortable: true,
        conditionalStyling: (item, column) => !item.normPos?.id ? { "background-color": "var(--status-incomplete)" } : { "background-color": "" }
      },
      zeroEnergyMethod: {
        id: "zeroEnergyMethod",
        header: "Zero Energy Method",
        accessorKey: "zeroEnergyMethod",
        width: 180,
        filterable: true,
        sortable: true
      },
      standard: {
        id: "standard",
        header: "Standard",
        accessorKey: "standard",
        width: 120,
        filterable: true,
        sortable: true
      },
      generalLocation: {
        id: "generalLocation",
        header: "General Location",
        accessorKey: "generalLocation",
        width: 180,
        filterable: true,
        sortable: true
      },
      equipmentIdList: {
        id: "equipmentIdList",
        header: "Equipment IDs",
        accessorFn: (item) => this.formatEquipmentList(item.equipmentList),
        width: 200,
        filterable: false,
        sortable: false
      },
      equipmentList: {
        id: "equipmentList",
        header: "Equipment",
        accessorFn: (item) => this.formatEquipmentList(item.equipmentList),
        width: 200,
        filterable: false,
        sortable: false
      },
      normalPosition: {
        id: "normalPosition",
        header: "Normal Position",
        accessorKey: "normalPosition",
        width: 150,
        filterable: true,
        sortable: true
      },
      isolatedPosition: {
        id: "isolatedPosition",
        header: "Isolated Position",
        accessorKey: "isolatedPosition",
        width: 150,
        filterable: true,
        sortable: true
      },
      oldId: {
        id: "oldId",
        header: "Old ID",
        accessorKey: "oldId",
        width: 100,
        filterable: true,
        sortable: true
      },
      objectType: {
        id: "objectType",
        header: "Object Type",
        accessorKey: "objectType",
        width: 130,
        filterable: true,
        sortable: true
      },
      isUpdated: {
        id: "isUpdated",
        header: "Updated",
        accessorFn: (item) => item.isUpdated ? "Yes" : "No",
        width: 100,
        filterable: true,
        sortable: true,
        conditionalStyling: (item, column) => item.isUpdated ? { "background-color": "#fff3cd" } : { "background-color": "" }
      },
      conflictStatus: {
        id: "conflictStatus",
        header: "Conflict Status",
        accessorKey: "conflictStatus",
        width: 150,
        filterable: true,
        sortable: true,
        conditionalStyling: (item, column) => item.conflictStatus ? { "background-color": "#ffcccc" } : { "background-color": "" }
      },
      fileIds: {
        id: "fileIds",
        header: "Files",
        accessorFn: (item) => this.formatFileIds(item.fileIds),
        width: 100,
        filterable: false,
        sortable: false
      },
      name: {
        id: "name",
        header: "Name",
        accessorKey: "name",
        width: 150,
        filterable: true,
        sortable: true
      },
      zeroEnergy: {
        id: "zeroEnergy",
        header: "Zero Energy",
        accessorKey: "zeroEnergy.method",
        formFieldKey: "zeroEnergy",
        filterable: true,
        sortable: true
      },
      relatedLotoPointIds: {
        id: "relatedLotoPointIds",
        header: "Related LOTO Point IDs",
        accessorKey: "relatedLotoPointIds",
        filterable: true,
        sortable: true
      },
      location: {
        id: "location",
        header: "Location",
        accessorKey: "location.name",
        formFieldKey: "location",
        filterable: true,
        sortable: true
      },
      eqType: {
        id: "eqType",
        header: "Equipment Type",
        accessorKey: "eqType.name",
        formFieldKey: "eqType",
        filterable: true,
        sortable: true
      },
      isLabeled: {
        id: "isLabeled",
        header: "Labeled",
        accessorFn: (item) => item.isLabeled ? "Yes" : "No",
        width: 80,
        filterable: true,
        sortable: true,
        conditionalStyling: (item, column) => item.isLabeled ? { "background-color": "var(--status-complete)" } : { "background-color": "var(--status-incomplete)" }
      },
      isLockable: {
        id: "isLockable",
        header: "Lockable",
        accessorFn: (item) => item.isLockable ? "Yes" : "No",
        width: 80,
        filterable: true,
        sortable: true,
        conditionalStyling: (item, column) => item.isLockable ? { "background-color": "var(--status-complete)" } : { "background-color": "var(--status-incomplete)" }
      }
    };
    const result = fields.map((fieldName) => allColumns[fieldName]).filter((column) => column !== void 0);
    if (fields.includes("comment")) {
      const commentColumn = {
        id: "comment",
        header: "Comments",
        accessorFn: () => "",
        width: 120,
        filterable: false,
        sortable: false
      };
      const commentIndex = fields.indexOf("comment");
      result.splice(commentIndex, 0, commentColumn);
    }
    return result;
  }
  /**
   * Maps LotoPoint to form fields
   * @param lotoPoint - The LotoPointDto to map
   * @param isoPosOptions - Options for ISO Position select
   * @param normPosOptions - Options for Normal Position select
   * @param fields - Array of field names to include (defaults to all fields)
   * @returns Array of FormField objects
   */
  toFormFields(lotoPoint, fields = [
    "unit",
    "tagNumber",
    "description",
    "eqType",
    "isoPos",
    "normPos",
    "specificLocation",
    "location",
    "generalLocation",
    "equipmentList",
    "zeroEnergy",
    "isLabeled",
    "isLockable",
    "processingStatus",
    "comment"
  ]) {
    const allFields = {
      tagNumber: {
        name: "tagNumber",
        label: "Tag Number",
        type: "text",
        validators: [Validators.required],
        initialValue: lotoPoint.tagNumber || "",
        guideId: "create-loto-point:field-tag-number",
        guideMessage: "Enter a unique tag number for this LOTO point"
      },
      description: {
        name: "description",
        label: "Description",
        type: "text",
        validators: [Validators.required],
        initialValue: lotoPoint.description || "",
        guideId: "create-loto-point:field-description",
        guideMessage: "Provide a clear description of the LOTO point"
      },
      unit: {
        name: "unit",
        label: "Unit",
        type: "text",
        initialValue: lotoPoint.unit || "",
        guideId: "create-loto-point:field-unit",
        guideMessage: "Specify the unit where this LOTO point is located"
      },
      tagged: {
        name: "tagged",
        label: "Tagged",
        type: "text",
        initialValue: lotoPoint.tagged || "",
        guideId: "create-loto-point:field-tagged",
        guideMessage: "Indicate the tagging status"
      },
      isoPos: {
        name: "isoPos",
        label: "Isolated Position",
        type: "value-select",
        categoryAlias: "isoPos",
        canManageValues: true,
        validators: [Validators.required],
        initialValue: lotoPoint.isoPos?.id || null,
        guideId: "create-loto-point:field-isoPos",
        guideMessage: "Select the isolated position for this LOTO point (required)"
      },
      normPos: {
        name: "normPos",
        label: "Normal Position",
        type: "value-select",
        categoryAlias: "normPos",
        canManageValues: true,
        validators: [Validators.required],
        initialValue: lotoPoint.normPos?.id || null,
        guideId: "create-loto-point:field-normPos",
        guideMessage: "Select the normal operating position (required)"
      },
      specificLocation: {
        name: "specificLocation",
        label: "Specific Location",
        type: "text",
        validators: [Validators.required],
        initialValue: lotoPoint.specificLocation || "",
        guideId: "create-loto-point:field-specificLocation",
        guideMessage: "Enter the specific location of this LOTO point (required)"
      },
      standard: {
        name: "standard",
        label: "Standard",
        type: "text",
        initialValue: lotoPoint.standard || "",
        guideId: "create-loto-point:field-standard",
        guideMessage: "Reference to any applicable standard"
      },
      generalLocation: {
        name: "generalLocation",
        label: "General Location",
        type: "text",
        initialValue: lotoPoint.generalLocation || "",
        guideId: "create-loto-point:field-generalLocation",
        guideMessage: "Enter the general area or building location"
      },
      equipmentIdList: {
        name: "equipmentIdList",
        label: "Equipment IDs",
        type: "multi-select",
        initialValue: lotoPoint.equipmentIdList || [],
        guideId: "create-loto-point:field-equipmentIdList",
        guideMessage: "Select equipment IDs associated with this LOTO point"
      },
      normalPosition: {
        name: "normalPosition",
        label: "Normal Position",
        type: "text",
        initialValue: lotoPoint.normalPosition || "",
        guideId: "create-loto-point:field-normalPosition",
        guideMessage: "Enter the normal position value"
      },
      isolatedPosition: {
        name: "isolatedPosition",
        label: "Isolated Position",
        type: "text",
        initialValue: lotoPoint.isolatedPosition || "",
        guideId: "create-loto-point:field-isolatedPosition",
        guideMessage: "Enter the isolated position value"
      },
      oldId: {
        name: "oldId",
        label: "Old ID",
        type: "text",
        initialValue: lotoPoint.oldId || "",
        guideId: "create-loto-point:field-oldId",
        guideMessage: "Legacy ID from previous system (if applicable)"
      },
      isUpdated: {
        name: "isUpdated",
        label: "Is Updated",
        type: "select",
        options: [
          { value: "true", label: "Yes" },
          { value: "false", label: "No" }
        ],
        initialValue: lotoPoint.isUpdated?.toString() || "false",
        guideId: "create-loto-point:field-isUpdated",
        guideMessage: "Indicates if this LOTO point has been updated"
      },
      fileIds: {
        name: "fileIds",
        label: "File IDs",
        type: "text",
        initialValue: lotoPoint.fileIds || "",
        guideId: "create-loto-point:field-fileIds",
        guideMessage: "Associated file IDs for documentation"
      },
      conflictStatus: {
        name: "conflictStatus",
        label: "Conflict Status",
        type: "text",
        initialValue: lotoPoint.conflictStatus || "",
        guideId: "create-loto-point:field-conflictStatus",
        guideMessage: "Current conflict status of the LOTO point"
      },
      zeroEnergyMethod: {
        name: "zeroEnergyMethod",
        label: "Zero Energy Method",
        type: "textarea",
        validators: [Validators.required],
        initialValue: lotoPoint.zeroEnergyMethod || "",
        guideId: "create-loto-point:field-zeroEnergyMethod",
        guideMessage: "Describe the zero energy verification method (required)"
      },
      // zeroEnergy: {
      //   name: 'zeroEnergy',
      //   label: 'Zero Energy',
      //   type: 'textarea',
      //   initialValue: lotoPoint.zeroEnergy,
      // },
      zeroEnergy: {
        name: "zeroEnergy",
        label: "Zero Energy",
        type: "group",
        guideId: "create-loto-point:field-zeroEnergy",
        guideMessage: "Configure zero energy verification settings",
        context: {
          zeroEnergyId: lotoPoint.zeroEnergy?.id || null
        },
        fields: [
          {
            name: "zeroEnergyTemplate",
            label: "Zero Energy Verification Phrase",
            type: "zero-energy-phrase-builder",
            categoryAlias: "zeroEnergyTemplate",
            canManageValues: true,
            initialValue: (() => {
              const templateId = lotoPoint.zeroEnergy?.zeroEnergyTemplate?.id || null;
              return templateId;
            })()
          },
          {
            name: "templateEquipment",
            label: "Equipment (select on P&ID)",
            type: "equipment-list-manager",
            initialValue: lotoPoint.zeroEnergy?.templateEquipment || [],
            context: {
              conflictMode: "no-association",
              useUnifiedDialog: true,
              // Use unified dialog (single button for browse + draw)
              requireLotoPointForDrawn: true,
              // Require LOTO point creation when drawing new equipment
              requireLotoPointForUnassociated: true
              // Require LOTO point creation for equipment without association
            }
          },
          {
            name: "editShared",
            label: "",
            type: "hidden",
            initialValue: false
          }
        ]
      },
      relatedLotoPointIds: {
        name: "relatedLotoPointIds",
        label: "Related LOTO Point IDs",
        type: "multi-select",
        initialValue: lotoPoint.relatedLotoPointIds,
        guideId: "create-loto-point:field-relatedLotoPointIds",
        guideMessage: "Select any related LOTO point IDs"
      },
      location: {
        name: "location",
        label: "Location",
        type: "value-select",
        categoryAlias: "location",
        canManageValues: true,
        initialValue: lotoPoint.location?.id || null,
        guideId: "create-loto-point:field-location",
        guideMessage: "Select the location category for this LOTO point"
      },
      eqType: {
        name: "eqType",
        label: "Equipment Type",
        type: "value-select",
        categoryAlias: "eqType",
        canManageValues: true,
        initialValue: lotoPoint.eqType?.id || null,
        guideId: "create-loto-point:field-eqType",
        guideMessage: "Select the equipment type for this LOTO point"
      },
      equipmentList: {
        name: "equipmentList",
        label: "Equipment List",
        type: "equipment-list-manager",
        initialValue: lotoPoint.equipmentList || [],
        context: {
          currentLotoPointId: lotoPoint.id,
          currentLotoPointTagNumber: lotoPoint.tagNumber || void 0,
          useUnifiedDialog: true
        },
        guideId: "create-loto-point:field-equipmentList",
        guideMessage: "Manage the equipment associated with this LOTO point"
      },
      isLabeled: {
        name: "isLabeled",
        label: "Labeled",
        type: "checkbox",
        initialValue: lotoPoint.isLabeled ?? false,
        guideId: "create-loto-point:field-isLabeled",
        guideMessage: "Indicates if this LOTO point has been labeled"
      },
      isLockable: {
        name: "isLockable",
        label: "Lockable",
        type: "checkbox",
        initialValue: lotoPoint.isLockable ?? false,
        guideId: "create-loto-point:field-isLockable",
        guideMessage: "Indicates if this LOTO point is lockable"
      },
      processingStatus: {
        name: "processingStatus",
        label: "Processing Status",
        type: "value-select",
        categoryAlias: "processingStatus",
        canManageValues: true,
        initialValue: lotoPoint.processingStatus?.id || null,
        guideId: "create-loto-point:field-processingStatus",
        guideMessage: "Select the processing status for this LOTO point"
      }
    };
    if (fields.includes("comment")) {
      const commentField = {
        name: "comment",
        label: "Comments",
        type: "comment",
        commentContext: {
          entityType: "LotoPoint",
          entityId: lotoPoint.id || 0
        },
        guideId: "create-loto-point:field-comment",
        guideMessage: "Add or view comments for this LOTO point"
      };
      const result = fields.map((fieldName) => allFields[fieldName]).filter((field) => field !== void 0);
      const commentIndex = fields.indexOf("comment");
      result.splice(commentIndex, 0, commentField);
      return result;
    }
    return fields.map((fieldName) => allFields[fieldName]).filter((field) => field !== void 0);
  }
  /**
   * Formats LOTO list for display
   */
  formatLotosList(lotos) {
    if (!Array.isArray(lotos) || lotos.length === 0) {
      return "None";
    }
    return lotos.map((loto) => loto.workScope || loto.docNum || "Unknown").join(", ");
  }
  /**
   * Formats equipment list for display
   */
  formatEquipmentList(equipment) {
    if (!Array.isArray(equipment) || equipment.length === 0) {
      return "None";
    }
    return equipment.map((eq) => eq.name || eq.id || "Unknown").join(", ");
  }
  /**
   * Formats file IDs for display
   */
  formatFileIds(fileIds) {
    if (!fileIds) {
      return "0";
    }
    if (typeof fileIds === "string") {
      const ids = fileIds.split(",").filter((id) => id.trim());
      return ids.length.toString();
    }
    if (Array.isArray(fileIds)) {
      return fileIds.length.toString();
    }
    return "0";
  }
  /**
   * Transforms a single LotoPointDto for API submission
   */
  toApiModel(lotoPoint) {
    const apiModel = {
      id: lotoPoint.id,
      unit: lotoPoint.unit,
      tagNumber: lotoPoint.tagNumber,
      description: lotoPoint.description,
      specificLocation: lotoPoint.specificLocation,
      standard: lotoPoint.standard,
      generalLocation: lotoPoint.generalLocation,
      equipmentIdList: lotoPoint.equipmentList?.map((eq) => eq.id) || [],
      normalPosition: lotoPoint.normalPosition,
      isolatedPosition: lotoPoint.isolatedPosition,
      isoPos: lotoPoint.isoPos?.id,
      normPos: lotoPoint.normPos?.id,
      zeroEnergyMethod: lotoPoint.zeroEnergyMethod,
      isVerified: lotoPoint.isVerified,
      isLabeled: lotoPoint.isLabeled,
      isLockable: lotoPoint.isLockable,
      isProcessed: lotoPoint.isProcessed,
      fileIds: this.parseFileIds(lotoPoint.fileIds)
    };
    if (lotoPoint.zeroEnergy) {
      let templateId = null;
      const template = lotoPoint.zeroEnergy.zeroEnergyTemplate;
      if (typeof template === "number") {
        templateId = template;
      } else if (template?.id) {
        templateId = template.id;
      }
      const validTemplateId = templateId && templateId !== 0 ? templateId : null;
      const equipmentIds = [];
      if (lotoPoint.zeroEnergy.templateEquipment && Array.isArray(lotoPoint.zeroEnergy.templateEquipment)) {
        equipmentIds.push(...lotoPoint.zeroEnergy.templateEquipment.map((eq) => eq.id).filter((id) => id != null && id !== 0));
      }
      const zeroEnergyId = lotoPoint.zeroEnergy.id;
      const validZeroEnergyId = zeroEnergyId && zeroEnergyId !== 0 ? zeroEnergyId : null;
      apiModel.zeroEnergy = {
        id: validZeroEnergyId,
        zeroEnergyTemplateId: validTemplateId,
        templateEquipmentIds: equipmentIds.length > 0 ? equipmentIds : null,
        editShared: lotoPoint.zeroEnergy.editShared || false
      };
    }
    return apiModel;
  }
  /**
   * Transforms multiple LotoPointDtos for bulk API submission
   */
  toApiModels(lotoPoints) {
    return lotoPoints.map((lotoPoint) => this.toApiModel(lotoPoint));
  }
  /**
   * Parses file IDs from various formats
   */
  parseFileIds(fileIds) {
    if (!fileIds) {
      return [];
    }
    if (typeof fileIds === "string") {
      return fileIds.split(",").map((id) => parseInt(id.trim(), 10)).filter((id) => !isNaN(id));
    }
    if (Array.isArray(fileIds)) {
      return fileIds.map((id) => typeof id === "string" ? parseInt(id, 10) : id).filter((id) => !isNaN(id));
    }
    return [];
  }
  /**
   * Checks if a LotoPoint has all required fields for submission
   */
  isValid(lotoPoint) {
    return !!(lotoPoint.tagNumber && lotoPoint.description && lotoPoint.isoPos?.id && lotoPoint.normPos?.id);
  }
  /**
   * Gets validation errors for a LotoPoint
   */
  getValidationErrors(lotoPoint) {
    const errors = [];
    if (!lotoPoint.tagNumber) {
      errors.push("Tag Number is required");
    }
    if (!lotoPoint.description) {
      errors.push("Description is required");
    }
    if (!lotoPoint.isoPos?.id) {
      errors.push("ISO Position is required");
    }
    if (!lotoPoint.normPos?.id) {
      errors.push("Normal Position is required");
    }
    return errors;
  }
  static \u0275fac = function LotoPointMapperService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _LotoPointMapperService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _LotoPointMapperService, factory: _LotoPointMapperService.\u0275fac, providedIn: "root" });
};

// src/app/shared/reactive-form/refactored/input-fields/equipment-list-manager/equipment-list-manager.component.ts
var _c05 = ["lotoFormContainer"];
function EquipmentListManagerComponent_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 19);
    \u0275\u0275listener("click", function EquipmentListManagerComponent_Conditional_5_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.openUnifiedDialog());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(1, "svg", 20);
    \u0275\u0275element(2, "path", 21);
    \u0275\u0275elementEnd();
    \u0275\u0275text(3, " Add Equipment ");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275property("disabled", ctx_r2.disabled);
  }
}
function EquipmentListManagerComponent_Conditional_6_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 24);
    \u0275\u0275listener("click", function EquipmentListManagerComponent_Conditional_6_Conditional_0_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.openBrowser());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(1, "svg", 20);
    \u0275\u0275element(2, "path", 25);
    \u0275\u0275elementEnd();
    \u0275\u0275text(3, " Browse Existing ");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275property("disabled", ctx_r2.disabled);
  }
}
function EquipmentListManagerComponent_Conditional_6_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 26);
    \u0275\u0275listener("click", function EquipmentListManagerComponent_Conditional_6_Conditional_1_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r5);
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.openDrawer());
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(1, "svg", 20);
    \u0275\u0275element(2, "path", 27);
    \u0275\u0275elementEnd();
    \u0275\u0275text(3, " Draw New ");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275property("disabled", ctx_r2.disabled);
  }
}
function EquipmentListManagerComponent_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, EquipmentListManagerComponent_Conditional_6_Conditional_0_Template, 4, 1, "button", 22)(1, EquipmentListManagerComponent_Conditional_6_Conditional_1_Template, 4, 1, "button", 23);
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275conditional(ctx_r2.allowBrowse ? 0 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r2.allowDraw ? 1 : -1);
  }
}
function EquipmentListManagerComponent_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 28);
    \u0275\u0275listener("click", function EquipmentListManagerComponent_Conditional_7_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.clearAll());
    });
    \u0275\u0275text(1, " Clear All ");
    \u0275\u0275elementEnd();
  }
}
function EquipmentListManagerComponent_Conditional_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 8)(1, "p");
    \u0275\u0275text(2, "No equipment added yet");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "small");
    \u0275\u0275text(4, "Use the buttons above to add equipment");
    \u0275\u0275elementEnd()();
  }
}
function EquipmentListManagerComponent_Conditional_10_For_1_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(0, "svg", 20);
    \u0275\u0275element(1, "path", 39)(2, "path", 40);
    \u0275\u0275elementEnd();
  }
}
function EquipmentListManagerComponent_Conditional_10_For_1_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(0, "svg", 20);
    \u0275\u0275element(1, "path", 39)(2, "path", 21);
    \u0275\u0275elementEnd();
  }
}
function EquipmentListManagerComponent_Conditional_10_For_1_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 35);
    \u0275\u0275text(1, "Browsed");
    \u0275\u0275elementEnd();
  }
}
function EquipmentListManagerComponent_Conditional_10_For_1_Conditional_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 36);
    \u0275\u0275text(1, "Drawn");
    \u0275\u0275elementEnd();
  }
}
function EquipmentListManagerComponent_Conditional_10_For_1_Conditional_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 37);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const item_r8 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("File #", item_r8.fileId, "");
  }
}
function EquipmentListManagerComponent_Conditional_10_For_1_Conditional_11_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 41);
    \u0275\u0275listener("click", function EquipmentListManagerComponent_Conditional_10_For_1_Conditional_11_Template_button_click_0_listener($event) {
      \u0275\u0275restoreView(_r9);
      const $index_r10 = \u0275\u0275nextContext().$index;
      const ctx_r2 = \u0275\u0275nextContext(2);
      $event.stopPropagation();
      return \u0275\u0275resetView(ctx_r2.removeItem($index_r10));
    });
    \u0275\u0275text(1, " \xD7 ");
    \u0275\u0275elementEnd();
  }
}
function EquipmentListManagerComponent_Conditional_10_For_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 30);
    \u0275\u0275listener("click", function EquipmentListManagerComponent_Conditional_10_For_1_Template_div_click_0_listener() {
      const item_r8 = \u0275\u0275restoreView(_r7).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.openViewer(item_r8));
    });
    \u0275\u0275elementStart(1, "div", 31);
    \u0275\u0275template(2, EquipmentListManagerComponent_Conditional_10_For_1_Conditional_2_Template, 3, 0, ":svg:svg", 20)(3, EquipmentListManagerComponent_Conditional_10_For_1_Conditional_3_Template, 3, 0, ":svg:svg", 20);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "div", 32)(5, "span", 33);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "small", 34);
    \u0275\u0275template(8, EquipmentListManagerComponent_Conditional_10_For_1_Conditional_8_Template, 2, 0, "span", 35)(9, EquipmentListManagerComponent_Conditional_10_For_1_Conditional_9_Template, 2, 0, "span", 36)(10, EquipmentListManagerComponent_Conditional_10_For_1_Conditional_10_Template, 2, 1, "span", 37);
    \u0275\u0275elementEnd()();
    \u0275\u0275template(11, EquipmentListManagerComponent_Conditional_10_For_1_Conditional_11_Template, 2, 0, "button", 38);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const item_r8 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275classProp("disabled", ctx_r2.disabled);
    \u0275\u0275advance();
    \u0275\u0275classMap("icon-" + ctx_r2.getItemIcon(item_r8));
    \u0275\u0275advance();
    \u0275\u0275conditional(item_r8.source === "browsed" ? 2 : 3);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(ctx_r2.getItemDisplay(item_r8));
    \u0275\u0275advance(2);
    \u0275\u0275conditional(item_r8.source === "browsed" ? 8 : 9);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(item_r8.fileId ? 10 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(!ctx_r2.disabled ? 11 : -1);
  }
}
function EquipmentListManagerComponent_Conditional_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275repeaterCreate(0, EquipmentListManagerComponent_Conditional_10_For_1_Template, 12, 9, "div", 29, \u0275\u0275repeaterTrackByIndex);
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275repeater(ctx_r2.equipmentList());
  }
}
function EquipmentListManagerComponent_Conditional_22_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 17)(1, "span", 42);
    \u0275\u0275text(2, "Equipment:");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "span", 43);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    let tmp_2_0;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate1(" ", ((tmp_2_0 = ctx_r2.pendingEquipment()) == null ? null : tmp_2_0.tagNumber) || "New Equipment #" + ((tmp_2_0 = ctx_r2.pendingEquipment()) == null ? null : tmp_2_0.id), " ");
  }
}
function EquipmentListManagerComponent_Conditional_23_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 18);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r2.lotoPointFormError(), " ");
  }
}
var EquipmentListManagerComponent = class _EquipmentListManagerComponent {
  label = "Equipment List";
  allowBrowse = true;
  // Allow selecting existing equipment
  allowDraw = true;
  // Allow drawing new shapes
  useUnifiedDialog = false;
  // Use unified dialog instead of separate browse/draw dialogs
  currentLotoPointId;
  // For conflict detection exclusion
  currentLotoPointTagNumber;
  // For conflict dialog display
  conflictMode = "has-association";
  // Conflict detection mode
  requireLotoPointForDrawn = false;
  // Require LOTO point creation for newly drawn equipment
  requireLotoPointForUnassociated = false;
  // Require LOTO point creation for equipment without LOTO point association
  // ViewContainerRef for dynamic component loading
  lotoFormContainer;
  // Services
  equipmentMapper = inject(EquipmentMapperService);
  conflictService = inject(EquipmentLotoConflictService);
  lotoPointMapper = inject(LotoPointMapperService);
  lotoPointApi = inject(RfLotoPointApiService);
  destroyRef = inject(DestroyRef);
  cdr = inject(ChangeDetectorRef);
  // State
  isBrowserOpen = signal(false);
  isDrawerOpen = signal(false);
  isUnifiedDialogOpen = signal(false);
  isVeiewerOpen = signal(false);
  isConflictDialogOpen = signal(false);
  equipmentList = signal([]);
  selectedEquipment = signal(null);
  conflictDialogData = signal(null);
  pendingEquipment = signal(null);
  // LOTO Point Form State (for requireLotoPointForDrawn mode)
  isLotoPointFormOpen = signal(false);
  lotoPointFormFields = signal([]);
  newLotoPoint = signal(new LotoPointDto());
  isSavingLotoPoint = signal(false);
  lotoPointFormError = signal(null);
  // ControlValueAccessor
  value = signal([]);
  onChange = () => {
  };
  onTouched = () => {
  };
  disabled = false;
  writeValue(value) {
    if (Array.isArray(value)) {
      this.equipmentList.set(value.map((item) => {
        let tagNumber = item.tagNumber || "";
        if (item.lotoPoints && item.lotoPoints.length > 0 && item.lotoPoints[0]?.tagNumber) {
          tagNumber = item.lotoPoints[0].tagNumber;
        }
        return __spreadProps(__spreadValues({}, item), {
          fileId: item.mainFileId ?? item.fileId,
          // Use mainFile (string field), fallback to mainFileObject.name, then fileName
          fileName: item.mainFileObject?.name ?? item.mainFile ?? item.fileName ?? (item.mainFileId ? `File #${item.mainFileId}` : void 0),
          tagNumber,
          lotoPoints: item.lotoPoints || [],
          source: item.source ?? "browsed"
          // Default to browsed for draft-loaded items
        });
      }));
      this.value.set(value);
    } else {
      this.equipmentList.set([]);
      this.value.set([]);
    }
  }
  registerOnChange(fn) {
    this.onChange = fn;
  }
  registerOnTouched(fn) {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled) {
    this.disabled = isDisabled;
  }
  // Unified Dialog (combines browse + draw)
  openUnifiedDialog() {
    if (!this.disabled && (this.allowBrowse || this.allowDraw)) {
      this.isUnifiedDialogOpen.set(true);
    }
  }
  closeUnifiedDialog() {
    this.isUnifiedDialogOpen.set(false);
  }
  onUnifiedEquipmentAcquired(equipment) {
    if (this.conflictMode === "none" || !equipment.id) {
      this.addEquipmentToList(equipment, equipment.id ? "browsed" : "drawn");
      this.closeUnifiedDialog();
      return;
    }
    const hasLotoPointsFromDialog = equipment.lotoPoints && equipment.lotoPoints.length > 0;
    if (this.conflictMode === "has-association") {
      const conflicts = this.conflictService.findConflicts(equipment.id, this.currentLotoPointId);
      if (conflicts.length > 0) {
        this.showConflictDialog(equipment, conflicts, "has-association");
        this.closeUnifiedDialog();
        return;
      }
    } else if (this.conflictMode === "no-association") {
      if (!hasLotoPointsFromDialog && this.conflictService.hasNoAssociation(equipment.id)) {
        if (this.requireLotoPointForUnassociated) {
          this.closeUnifiedDialog();
          this.openLotoPointFormForEquipment(equipment);
          return;
        }
        this.showConflictDialog(equipment, [], "no-association");
        this.closeUnifiedDialog();
        return;
      }
    }
    this.addEquipmentToList(equipment, equipment.id ? "browsed" : "drawn");
    this.closeUnifiedDialog();
  }
  /**
   * Called when equipment is drawn in unified dialog and LOTO point creation is required.
   * Opens the LOTO point form for the newly drawn equipment.
   */
  onUnifiedEquipmentDrawnForLotoPoint(equipment) {
    this.closeUnifiedDialog();
    this.openLotoPointFormForEquipment(equipment);
  }
  // Browser Dialog
  openBrowser() {
    if (!this.disabled && this.allowBrowse) {
      this.isBrowserOpen.set(true);
    }
  }
  closeBrowser() {
    this.isBrowserOpen.set(false);
  }
  openViewer(item) {
    if (!item || !item.id) {
      console.warn("Cannot open viewer: equipment has no ID", item);
      return;
    }
    this.selectedEquipment.set(item);
    this.isVeiewerOpen.set(true);
  }
  closeViewer() {
    this.selectedEquipment.set(null);
    this.isVeiewerOpen.set(false);
  }
  onEquipmentSelected(equipment) {
    if (this.conflictMode === "none" || !equipment.id) {
      this.addEquipmentToList(equipment);
      this.closeBrowser();
      return;
    }
    if (this.conflictMode === "has-association") {
      const conflicts = this.conflictService.findConflicts(equipment.id, this.currentLotoPointId);
      if (conflicts.length > 0) {
        this.showConflictDialog(equipment, conflicts, "has-association");
        return;
      }
    } else if (this.conflictMode === "no-association") {
      if (this.conflictService.hasNoAssociation(equipment.id)) {
        this.showConflictDialog(equipment, [], "no-association");
        return;
      }
    }
    this.addEquipmentToList(equipment);
    this.closeBrowser();
  }
  showConflictDialog(equipment, conflicts, conflictType) {
    if (conflictType === "no-association" && this.requireLotoPointForUnassociated) {
      this.closeBrowser();
      this.openLotoPointFormForEquipment(equipment);
      return;
    }
    this.pendingEquipment.set(equipment);
    this.conflictDialogData.set({
      equipment,
      conflicts,
      currentLotoPointTagNumber: this.currentLotoPointTagNumber,
      conflictType
    });
    this.isConflictDialogOpen.set(true);
    this.closeBrowser();
  }
  addEquipmentToList(equipment, source = "browsed") {
    let tagNumber = equipment.tagNumber || "";
    if (equipment.lotoPoints && equipment.lotoPoints.length > 0 && equipment.lotoPoints[0].tagNumber) {
      tagNumber = equipment.lotoPoints[0].tagNumber;
    }
    const newItem = {
      id: equipment.id,
      coordinates: equipment.coordinates || "",
      fileId: equipment.mainFileId ?? void 0,
      fileName: equipment.mainFileObject?.name ?? (equipment.mainFileId ? `File #${equipment.mainFileId}` : ""),
      originalPictureSize: equipment.originalPictureSize || "",
      tagNumber,
      lotoPoints: equipment.lotoPoints || [],
      source
    };
    this.addItem(newItem);
  }
  // Conflict Dialog handlers
  onConflictConfirmed(equipment) {
    this.addEquipmentToList(equipment);
    this.closeConflictDialog();
  }
  onConflictCancelled() {
    this.closeConflictDialog();
  }
  closeConflictDialog() {
    this.isConflictDialogOpen.set(false);
    this.conflictDialogData.set(null);
    this.pendingEquipment.set(null);
  }
  // Drawer Dialog
  openDrawer() {
    if (!this.disabled && this.allowDraw) {
      this.isDrawerOpen.set(true);
    }
  }
  closeDrawer() {
    this.isDrawerOpen.set(false);
  }
  onEquipmentSaved(equipment) {
    if (!equipment) {
      console.error("No equipment saved");
      this.closeDrawer();
      return;
    }
    if (this.requireLotoPointForDrawn) {
      return;
    }
    const newItem = {
      id: equipment.id,
      coordinates: equipment.coordinates || "",
      fileId: equipment.mainFileId ?? void 0,
      fileName: equipment.mainFileObject?.name ?? (equipment.mainFileId ? `File #${equipment.mainFileId}` : ""),
      originalPictureSize: equipment.originalPictureSize || "",
      tagNumber: equipment.tagNumber || `Equipment #${equipment.id}`,
      source: "drawn"
    };
    this.addItem(newItem);
    this.closeDrawer();
  }
  /**
   * Called when equipment is saved and ready for LOTO point creation
   * (from drawer dialog's equipmentReadyForLotoPoint event)
   */
  onEquipmentReadyForLotoPoint(equipment) {
    this.openLotoPointFormForEquipment(equipment);
  }
  /**
   * Opens LOTO point form for newly drawn equipment
   */
  openLotoPointFormForEquipment(equipment) {
    return __async(this, null, function* () {
      this.pendingEquipment.set(equipment);
      const lotoPoint = new LotoPointDto({
        equipmentList: [equipment]
      });
      this.newLotoPoint.set(lotoPoint);
      const fieldsWithoutEquipmentList = [
        "unit",
        "tagNumber",
        "description",
        "eqType",
        "tagged",
        "isoPos",
        "normPos",
        "specificLocation",
        "location",
        "standard",
        "generalLocation"
      ];
      const formFields = this.lotoPointMapper.toFormFields(lotoPoint, fieldsWithoutEquipmentList);
      this.lotoPointFormFields.set(formFields);
      this.isLotoPointFormOpen.set(true);
      this.lotoPointFormError.set(null);
      yield this.loadLotoPointFormComponent();
    });
  }
  /**
   * Dynamically loads RfReactiveFormComponent to avoid circular dependency
   */
  loadLotoPointFormComponent() {
    return __async(this, null, function* () {
      this.cdr.detectChanges();
      yield new Promise((resolve) => setTimeout(resolve, 50));
      if (!this.lotoFormContainer) {
        console.error("lotoFormContainer not available after change detection");
        return;
      }
      this.lotoFormContainer.clear();
      const { RfReactiveFormComponent: RfReactiveFormComponent2 } = yield import("./chunk-744ED6IY.js");
      const componentRef = this.lotoFormContainer.createComponent(RfReactiveFormComponent2);
      componentRef.setInput("fields", this.lotoPointFormFields());
      componentRef.setInput("entity", this.newLotoPoint());
      componentRef.setInput("title", "");
      componentRef.setInput("submitButtonText", this.isSavingLotoPoint() ? "Saving..." : "Create LOTO Point");
      componentRef.setInput("showSubmitButton", true);
      componentRef.instance.formSubmit.subscribe((formData) => {
        this.onLotoPointFormSubmit(formData);
      });
      this.cdr.detectChanges();
    });
  }
  /**
   * Handle LOTO point form submission
   */
  onLotoPointFormSubmit(formData) {
    const equipment = this.pendingEquipment();
    if (!equipment) {
      this.lotoPointFormError.set("No equipment available for LOTO point.");
      return;
    }
    this.isSavingLotoPoint.set(true);
    this.lotoPointFormError.set(null);
    const lotoPointData = new LotoPointDto(__spreadProps(__spreadValues({}, formData), {
      equipmentList: [equipment]
    }));
    this.lotoPointApi.saveLotoPoint(lotoPointData).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.isSavingLotoPoint.set(false);
        if (response.responseData) {
          const createdLotoPoint = LotoPointDto.fromJson(response.responseData);
          const updatedEquipment = new EquipmentDto(__spreadProps(__spreadValues({}, equipment), {
            lotoPoints: [createdLotoPoint]
          }));
          const newItem = {
            id: updatedEquipment.id,
            coordinates: updatedEquipment.coordinates || "",
            fileId: updatedEquipment.mainFileId ?? void 0,
            fileName: updatedEquipment.mainFileObject?.name ?? (updatedEquipment.mainFileId ? `File #${updatedEquipment.mainFileId}` : ""),
            originalPictureSize: updatedEquipment.originalPictureSize || "",
            // Use the LOTO point's tag number (what the user just entered in the form)
            tagNumber: createdLotoPoint.tagNumber || updatedEquipment.tagNumber || `Equipment #${updatedEquipment.id}`,
            lotoPoints: [createdLotoPoint],
            source: "drawn"
          };
          this.addItem(newItem);
          this.closeLotoPointForm();
        } else {
          this.lotoPointFormError.set("Failed to save LOTO point.");
        }
      },
      error: (err) => {
        this.isSavingLotoPoint.set(false);
        this.lotoPointFormError.set("An error occurred while saving the LOTO point.");
        console.error("Failed to save LOTO point:", err);
      }
    });
  }
  /**
   * Close the LOTO point form popup
   */
  closeLotoPointForm() {
    this.isLotoPointFormOpen.set(false);
    this.lotoPointFormFields.set([]);
    this.newLotoPoint.set(new LotoPointDto());
    this.pendingEquipment.set(null);
    this.lotoPointFormError.set(null);
  }
  // List Management
  addItem(item) {
    const currentList = this.equipmentList();
    const updatedList = [...currentList, item];
    this.equipmentList.set(updatedList);
    this.value.set(updatedList);
    this.onChange(this.value());
    this.onTouched();
  }
  removeItem(index) {
    if (!this.disabled) {
      const currentList = this.equipmentList();
      const updatedList = currentList.filter((_, i) => i !== index);
      this.equipmentList.set(updatedList);
      this.value.set(updatedList);
      this.onChange(this.value());
      this.onTouched();
    }
  }
  clearAll() {
    if (!this.disabled) {
      this.equipmentList.set([]);
      this.value.set([]);
      this.onChange(this.value());
      this.onTouched();
    }
  }
  // Display helpers
  getItemDisplay(item) {
    if (item.lotoPoints && item.lotoPoints.length > 0 && item.lotoPoints[0]?.tagNumber) {
      return item.lotoPoints[0].tagNumber;
    }
    if (item.tagNumber) {
      return item.tagNumber;
    }
    return `Shape on ${item.fileName || (item.fileId ? `File #${item.fileId}` : "Unknown File")}`;
  }
  getItemIcon(item) {
    return item.source === "browsed" ? "existing" : "new";
  }
  hasItems() {
    return this.equipmentList().length > 0;
  }
  static \u0275fac = function EquipmentListManagerComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _EquipmentListManagerComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _EquipmentListManagerComponent, selectors: [["app-equipment-list-manager"]], viewQuery: function EquipmentListManagerComponent_Query(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275viewQuery(_c05, 5, ViewContainerRef);
    }
    if (rf & 2) {
      let _t;
      \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.lotoFormContainer = _t.first);
    }
  }, inputs: { label: "label", allowBrowse: "allowBrowse", allowDraw: "allowDraw", useUnifiedDialog: "useUnifiedDialog", currentLotoPointId: "currentLotoPointId", currentLotoPointTagNumber: "currentLotoPointTagNumber", conflictMode: "conflictMode", requireLotoPointForDrawn: "requireLotoPointForDrawn", requireLotoPointForUnassociated: "requireLotoPointForUnassociated" }, features: [\u0275\u0275ProvidersFeature([
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => _EquipmentListManagerComponent),
      multi: true
    }
  ])], decls: 26, vars: 33, consts: [["lotoFormContainer", ""], [1, "equipment-list-manager"], [1, "header"], [1, "input-label"], [1, "action-buttons"], ["type", "button", "title", "Add equipment", 1, "btn-add", 3, "disabled"], ["type", "button", "title", "Clear all equipment", 1, "btn-clear"], [1, "equipment-list"], [1, "empty-state"], [3, "close", "isOpen", "title", "size", "fullHeight", "zIndex"], [3, "equipmentAcquired", "equipmentDrawnForLotoPoint", "close", "requireLotoPointForDrawn", "requireLotoPointForUnassociated"], [3, "close", "isOpen", "title", "size", "zIndex"], [3, "equipmentSelected", "close"], [3, "saveSuccess", "equipmentReadyForLotoPoint", "close", "enableLotoPointCreation"], [3, "selectedEquipmentId"], [3, "confirmed", "cancelled", "isOpen", "data"], [1, "loto-point-form-container"], [1, "equipment-info-banner"], [1, "form-error-message"], ["type", "button", "title", "Add equipment", 1, "btn-add", 3, "click", "disabled"], ["width", "16", "height", "16", "viewBox", "0 0 16 16", "fill", "currentColor"], ["d", "M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"], ["type", "button", "title", "Select existing equipment", 1, "btn-browse", 3, "disabled"], ["type", "button", "title", "Draw new equipment shape", 1, "btn-draw", 3, "disabled"], ["type", "button", "title", "Select existing equipment", 1, "btn-browse", 3, "click", "disabled"], ["d", "M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"], ["type", "button", "title", "Draw new equipment shape", 1, "btn-draw", 3, "click", "disabled"], ["d", "M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"], ["type", "button", "title", "Clear all equipment", 1, "btn-clear", 3, "click"], [1, "equipment-item", 3, "disabled"], [1, "equipment-item", 3, "click"], [1, "item-icon"], [1, "item-content"], [1, "item-label"], [1, "item-meta"], [1, "badge", "badge-existing"], [1, "badge", "badge-new"], [1, "file-ref"], ["type", "button", "title", "Remove this equipment", 1, "btn-remove"], ["d", "M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"], ["d", "M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"], ["type", "button", "title", "Remove this equipment", 1, "btn-remove", 3, "click"], [1, "equipment-label"], [1, "equipment-value"]], template: function EquipmentListManagerComponent_Template(rf, ctx) {
    if (rf & 1) {
      const _r1 = \u0275\u0275getCurrentView();
      \u0275\u0275elementStart(0, "div", 1)(1, "div", 2)(2, "label", 3);
      \u0275\u0275text(3);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(4, "div", 4);
      \u0275\u0275template(5, EquipmentListManagerComponent_Conditional_5_Template, 4, 1, "button", 5)(6, EquipmentListManagerComponent_Conditional_6_Template, 2, 2)(7, EquipmentListManagerComponent_Conditional_7_Template, 2, 0, "button", 6);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(8, "div", 7);
      \u0275\u0275template(9, EquipmentListManagerComponent_Conditional_9_Template, 5, 0, "div", 8)(10, EquipmentListManagerComponent_Conditional_10_Template, 2, 0);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(11, "app-rf-popup-projection", 9);
      \u0275\u0275listener("close", function EquipmentListManagerComponent_Template_app_rf_popup_projection_close_11_listener() {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.closeUnifiedDialog());
      });
      \u0275\u0275elementStart(12, "app-equipment-unified-dialog", 10);
      \u0275\u0275listener("equipmentAcquired", function EquipmentListManagerComponent_Template_app_equipment_unified_dialog_equipmentAcquired_12_listener($event) {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.onUnifiedEquipmentAcquired($event));
      })("equipmentDrawnForLotoPoint", function EquipmentListManagerComponent_Template_app_equipment_unified_dialog_equipmentDrawnForLotoPoint_12_listener($event) {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.onUnifiedEquipmentDrawnForLotoPoint($event));
      })("close", function EquipmentListManagerComponent_Template_app_equipment_unified_dialog_close_12_listener() {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.closeUnifiedDialog());
      });
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(13, "app-rf-popup-projection", 11);
      \u0275\u0275listener("close", function EquipmentListManagerComponent_Template_app_rf_popup_projection_close_13_listener() {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.closeBrowser());
      });
      \u0275\u0275elementStart(14, "app-equipment-browser-dialog", 12);
      \u0275\u0275listener("equipmentSelected", function EquipmentListManagerComponent_Template_app_equipment_browser_dialog_equipmentSelected_14_listener($event) {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.onEquipmentSelected($event));
      })("close", function EquipmentListManagerComponent_Template_app_equipment_browser_dialog_close_14_listener() {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.closeBrowser());
      });
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(15, "app-rf-popup-projection", 11);
      \u0275\u0275listener("close", function EquipmentListManagerComponent_Template_app_rf_popup_projection_close_15_listener() {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.closeDrawer());
      });
      \u0275\u0275elementStart(16, "app-equipment-shape-drawer-dialog", 13);
      \u0275\u0275listener("saveSuccess", function EquipmentListManagerComponent_Template_app_equipment_shape_drawer_dialog_saveSuccess_16_listener($event) {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.onEquipmentSaved($event));
      })("equipmentReadyForLotoPoint", function EquipmentListManagerComponent_Template_app_equipment_shape_drawer_dialog_equipmentReadyForLotoPoint_16_listener($event) {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.onEquipmentReadyForLotoPoint($event));
      })("close", function EquipmentListManagerComponent_Template_app_equipment_shape_drawer_dialog_close_16_listener() {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.closeDrawer());
      });
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(17, "app-rf-popup-projection", 11);
      \u0275\u0275listener("close", function EquipmentListManagerComponent_Template_app_rf_popup_projection_close_17_listener() {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.closeViewer());
      });
      \u0275\u0275element(18, "app-rf-equipment-editor", 14);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(19, "app-equipment-conflict-dialog", 15);
      \u0275\u0275listener("confirmed", function EquipmentListManagerComponent_Template_app_equipment_conflict_dialog_confirmed_19_listener($event) {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.onConflictConfirmed($event));
      })("cancelled", function EquipmentListManagerComponent_Template_app_equipment_conflict_dialog_cancelled_19_listener() {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.onConflictCancelled());
      });
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(20, "app-rf-popup-projection", 11);
      \u0275\u0275listener("close", function EquipmentListManagerComponent_Template_app_rf_popup_projection_close_20_listener() {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.closeLotoPointForm());
      });
      \u0275\u0275elementStart(21, "div", 16);
      \u0275\u0275template(22, EquipmentListManagerComponent_Conditional_22_Template, 5, 1, "div", 17)(23, EquipmentListManagerComponent_Conditional_23_Template, 2, 1, "div", 18);
      \u0275\u0275elementContainer(24, null, 0);
      \u0275\u0275elementEnd()();
    }
    if (rf & 2) {
      let tmp_25_0;
      \u0275\u0275advance(3);
      \u0275\u0275textInterpolate(ctx.label);
      \u0275\u0275advance(2);
      \u0275\u0275conditional(ctx.useUnifiedDialog ? 5 : 6);
      \u0275\u0275advance(2);
      \u0275\u0275conditional(ctx.hasItems() && !ctx.disabled ? 7 : -1);
      \u0275\u0275advance(2);
      \u0275\u0275conditional(ctx.equipmentList().length === 0 ? 9 : 10);
      \u0275\u0275advance(2);
      \u0275\u0275property("isOpen", ctx.isUnifiedDialogOpen())("title", "Add Equipment")("size", "large")("fullHeight", true)("zIndex", 10050);
      \u0275\u0275advance();
      \u0275\u0275property("requireLotoPointForDrawn", ctx.requireLotoPointForDrawn)("requireLotoPointForUnassociated", ctx.requireLotoPointForUnassociated);
      \u0275\u0275advance();
      \u0275\u0275property("isOpen", ctx.isBrowserOpen())("title", "Select Existing Equipment")("size", "large")("zIndex", 10050);
      \u0275\u0275advance(2);
      \u0275\u0275property("isOpen", ctx.isDrawerOpen())("title", "Draw New Equipment Shape")("size", "large")("zIndex", 10050);
      \u0275\u0275advance();
      \u0275\u0275property("enableLotoPointCreation", ctx.requireLotoPointForDrawn);
      \u0275\u0275advance();
      \u0275\u0275property("isOpen", ctx.isVeiewerOpen())("title", "Viewing File")("size", "large")("zIndex", 10050);
      \u0275\u0275advance();
      \u0275\u0275property("selectedEquipmentId", (tmp_25_0 = ctx.selectedEquipment()) == null ? null : tmp_25_0.id);
      \u0275\u0275advance();
      \u0275\u0275property("isOpen", ctx.isConflictDialogOpen())("data", ctx.conflictDialogData());
      \u0275\u0275advance();
      \u0275\u0275property("isOpen", ctx.isLotoPointFormOpen())("title", "Create LOTO Point for Equipment")("size", "large")("zIndex", 10100);
      \u0275\u0275advance(2);
      \u0275\u0275conditional(ctx.pendingEquipment() ? 22 : -1);
      \u0275\u0275advance();
      \u0275\u0275conditional(ctx.lotoPointFormError() ? 23 : -1);
    }
  }, dependencies: [
    CommonModule,
    RfPopupProjectionComponent,
    EquipmentBrowserDialogComponent,
    EquipmentShapeDrawerDialogComponent,
    EquipmentUnifiedDialogComponent,
    RfEquipmentEditorComponent,
    EquipmentConflictDialogComponent
  ], styles: ["\n\n.equipment-list-manager[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 1rem;\n}\n.header[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  flex-wrap: wrap;\n  gap: 0.5rem;\n}\n.input-label[_ngcontent-%COMP%] {\n  font-weight: 500;\n  color: #333;\n  font-size: 0.9rem;\n}\n.action-buttons[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 0.5rem;\n  flex-wrap: wrap;\n}\n.btn-browse[_ngcontent-%COMP%], \n.btn-draw[_ngcontent-%COMP%], \n.btn-add[_ngcontent-%COMP%], \n.btn-clear[_ngcontent-%COMP%] {\n  padding: 0.5rem 1rem;\n  border: none;\n  border-radius: 4px;\n  font-size: 0.85rem;\n  cursor: pointer;\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  transition: background-color 0.2s;\n  white-space: nowrap;\n}\n.btn-browse[_ngcontent-%COMP%] {\n  background-color: #007bff;\n  color: white;\n}\n.btn-browse[_ngcontent-%COMP%]:hover:not(:disabled) {\n  background-color: #0056b3;\n}\n.btn-draw[_ngcontent-%COMP%] {\n  background-color: #28a745;\n  color: white;\n}\n.btn-draw[_ngcontent-%COMP%]:hover:not(:disabled) {\n  background-color: #218838;\n}\n.btn-add[_ngcontent-%COMP%] {\n  background-color: #17a2b8;\n  color: white;\n}\n.btn-add[_ngcontent-%COMP%]:hover:not(:disabled) {\n  background-color: #138496;\n}\n.btn-clear[_ngcontent-%COMP%] {\n  background-color: #6c757d;\n  color: white;\n}\n.btn-clear[_ngcontent-%COMP%]:hover:not(:disabled) {\n  background-color: #5a6268;\n}\n.btn-browse[_ngcontent-%COMP%]:disabled, \n.btn-draw[_ngcontent-%COMP%]:disabled, \n.btn-add[_ngcontent-%COMP%]:disabled, \n.btn-clear[_ngcontent-%COMP%]:disabled {\n  background-color: #ccc;\n  cursor: not-allowed;\n  opacity: 0.6;\n}\n.btn-browse[_ngcontent-%COMP%]   svg[_ngcontent-%COMP%], \n.btn-draw[_ngcontent-%COMP%]   svg[_ngcontent-%COMP%], \n.btn-add[_ngcontent-%COMP%]   svg[_ngcontent-%COMP%] {\n  flex-shrink: 0;\n}\n.equipment-list[_ngcontent-%COMP%] {\n  border: 1px solid #ddd;\n  border-radius: 4px;\n  min-height: 100px;\n  max-height: 300px;\n  overflow-y: auto;\n}\n.empty-state[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  padding: 2rem;\n  color: #999;\n  text-align: center;\n}\n.empty-state[_ngcontent-%COMP%]   p[_ngcontent-%COMP%] {\n  margin: 0 0 0.5rem 0;\n  font-size: 0.95rem;\n}\n.empty-state[_ngcontent-%COMP%]   small[_ngcontent-%COMP%] {\n  font-size: 0.85rem;\n  color: #bbb;\n}\n.equipment-item[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.75rem;\n  padding: 0.75rem;\n  border-bottom: 1px solid #eee;\n  transition: background-color 0.2s;\n}\n.equipment-item[_ngcontent-%COMP%]:last-child {\n  border-bottom: none;\n}\n.equipment-item[_ngcontent-%COMP%]:hover:not(.disabled) {\n  background-color: #f8f9fa;\n}\n.equipment-item.disabled[_ngcontent-%COMP%] {\n  opacity: 0.6;\n  cursor: not-allowed;\n}\n.item-icon[_ngcontent-%COMP%] {\n  flex-shrink: 0;\n  width: 32px;\n  height: 32px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  border-radius: 50%;\n  background-color: #f0f0f0;\n}\n.item-icon.icon-existing[_ngcontent-%COMP%] {\n  background-color: #d1ecf1;\n  color: #0c5460;\n}\n.item-icon.icon-new[_ngcontent-%COMP%] {\n  background-color: #d4edda;\n  color: #155724;\n}\n.item-content[_ngcontent-%COMP%] {\n  flex: 1;\n  display: flex;\n  flex-direction: column;\n  gap: 0.25rem;\n  min-width: 0;\n}\n.item-label[_ngcontent-%COMP%] {\n  font-weight: 500;\n  color: #333;\n  font-size: 0.9rem;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n.item-meta[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  font-size: 0.8rem;\n  color: #666;\n}\n.badge[_ngcontent-%COMP%] {\n  display: inline-block;\n  padding: 0.15rem 0.5rem;\n  border-radius: 3px;\n  font-size: 0.75rem;\n  font-weight: 500;\n  text-transform: uppercase;\n}\n.badge-existing[_ngcontent-%COMP%] {\n  background-color: #d1ecf1;\n  color: #0c5460;\n}\n.badge-new[_ngcontent-%COMP%] {\n  background-color: #d4edda;\n  color: #155724;\n}\n.file-ref[_ngcontent-%COMP%] {\n  color: #6c757d;\n  font-size: 0.75rem;\n}\n.btn-remove[_ngcontent-%COMP%] {\n  flex-shrink: 0;\n  background: none;\n  border: none;\n  font-size: 1.5rem;\n  color: #999;\n  cursor: pointer;\n  padding: 0;\n  width: 28px;\n  height: 28px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  border-radius: 50%;\n  transition: background-color 0.2s, color 0.2s;\n}\n.btn-remove[_ngcontent-%COMP%]:hover {\n  background-color: #f0f0f0;\n  color: #dc3545;\n}\n.loto-point-form-container[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 1rem;\n  max-height: 70vh;\n  overflow-y: auto;\n}\n.equipment-info-banner[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  padding: 0.75rem 1rem;\n  background-color: #e7f3ff;\n  border: 1px solid #b8daff;\n  border-radius: 4px;\n  margin-bottom: 0.5rem;\n}\n.equipment-label[_ngcontent-%COMP%] {\n  font-weight: 600;\n  color: #004085;\n}\n.equipment-value[_ngcontent-%COMP%] {\n  color: #0056b3;\n  font-weight: 500;\n}\n.form-error-message[_ngcontent-%COMP%] {\n  padding: 0.75rem 1rem;\n  background-color: #f8d7da;\n  border: 1px solid #f5c6cb;\n  border-radius: 4px;\n  color: #721c24;\n  font-size: 0.9rem;\n}\n/*# sourceMappingURL=equipment-list-manager.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(EquipmentListManagerComponent, { className: "EquipmentListManagerComponent", filePath: "src/app/shared/reactive-form/refactored/input-fields/equipment-list-manager/equipment-list-manager.component.ts", lineNumber: 60 });
})();

// src/app/features/values/refactored/components/rf-value-select/rf-value-select.component.ts
var _c06 = ["selectInput"];
var _forTrack09 = ($index, $item) => $item.value;
function RfValueSelectComponent_Conditional_4_Conditional_12_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 9);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r2.errorMessage());
  }
}
function RfValueSelectComponent_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 4);
    \u0275\u0275listener("click", function RfValueSelectComponent_Conditional_4_Template_div_click_0_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.closeDialog());
    });
    \u0275\u0275elementStart(1, "div", 5);
    \u0275\u0275listener("click", function RfValueSelectComponent_Conditional_4_Template_div_click_1_listener($event) {
      \u0275\u0275restoreView(_r2);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275elementStart(2, "h3");
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "div", 6)(5, "label");
    \u0275\u0275text(6, "Name:");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "input", 7);
    \u0275\u0275twoWayListener("ngModelChange", function RfValueSelectComponent_Conditional_4_Template_input_ngModelChange_7_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r2.dialogValueName, $event) || (ctx_r2.dialogValueName = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("keyup.enter", function RfValueSelectComponent_Conditional_4_Template_input_keyup_enter_7_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.saveValue());
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(8, "div", 6)(9, "label");
    \u0275\u0275text(10, "Alias (optional):");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(11, "input", 8);
    \u0275\u0275twoWayListener("ngModelChange", function RfValueSelectComponent_Conditional_4_Template_input_ngModelChange_11_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r2.dialogValueAlias, $event) || (ctx_r2.dialogValueAlias = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("keyup.enter", function RfValueSelectComponent_Conditional_4_Template_input_keyup_enter_11_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.saveValue());
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275template(12, RfValueSelectComponent_Conditional_4_Conditional_12_Template, 2, 1, "div", 9);
    \u0275\u0275elementStart(13, "div", 10)(14, "button", 11);
    \u0275\u0275listener("click", function RfValueSelectComponent_Conditional_4_Template_button_click_14_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.saveValue());
    });
    \u0275\u0275text(15, " Save ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(16, "button", 12);
    \u0275\u0275listener("click", function RfValueSelectComponent_Conditional_4_Template_button_click_16_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.closeDialog());
    });
    \u0275\u0275text(17, " Cancel ");
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate2("", ctx_r2.dialogMode() === "add" ? "Add" : "Edit", " ", ctx_r2.label(), "");
    \u0275\u0275advance(4);
    \u0275\u0275twoWayProperty("ngModel", ctx_r2.dialogValueName);
    \u0275\u0275advance(4);
    \u0275\u0275twoWayProperty("ngModel", ctx_r2.dialogValueAlias);
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r2.errorMessage() ? 12 : -1);
    \u0275\u0275advance(2);
    \u0275\u0275property("disabled", !ctx_r2.dialogValueName);
  }
}
function RfValueSelectComponent_Conditional_5_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 13);
    \u0275\u0275element(1, "span", 16);
    \u0275\u0275text(2, " Deleting and transferring references... Please wait. ");
    \u0275\u0275elementEnd();
  }
}
function RfValueSelectComponent_Conditional_5_Conditional_5_Conditional_2_For_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "option", 18);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const option_r6 = ctx.$implicit;
    \u0275\u0275property("value", option_r6.value);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(option_r6.label);
  }
}
function RfValueSelectComponent_Conditional_5_Conditional_5_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 6)(1, "label");
    \u0275\u0275text(2, "Transfer references to:");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "select", 17);
    \u0275\u0275twoWayListener("ngModelChange", function RfValueSelectComponent_Conditional_5_Conditional_5_Conditional_2_Template_select_ngModelChange_3_listener($event) {
      \u0275\u0275restoreView(_r5);
      const ctx_r2 = \u0275\u0275nextContext(3);
      \u0275\u0275twoWayBindingSet(ctx_r2.transferToValueId, $event) || (ctx_r2.transferToValueId = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275elementStart(4, "option", 18);
    \u0275\u0275text(5, "-- Select replacement --");
    \u0275\u0275elementEnd();
    \u0275\u0275repeaterCreate(6, RfValueSelectComponent_Conditional_5_Conditional_5_Conditional_2_For_7_Template, 2, 2, "option", 18, _forTrack09);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(3);
    \u0275\u0275twoWayProperty("ngModel", ctx_r2.transferToValueId);
    \u0275\u0275advance();
    \u0275\u0275property("value", null);
    \u0275\u0275advance(2);
    \u0275\u0275repeater(ctx_r2.transferOptions());
  }
}
function RfValueSelectComponent_Conditional_5_Conditional_5_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 9);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(3);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r2.errorMessage());
  }
}
function RfValueSelectComponent_Conditional_5_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p");
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
    \u0275\u0275template(2, RfValueSelectComponent_Conditional_5_Conditional_5_Conditional_2_Template, 8, 2, "div", 6)(3, RfValueSelectComponent_Conditional_5_Conditional_5_Conditional_3_Template, 2, 1, "div", 9);
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1('Are you sure you want to delete "', ctx_r2.selectedValueName(), '"?');
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r2.transferOptions().length > 0 ? 2 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r2.errorMessage() ? 3 : -1);
  }
}
function RfValueSelectComponent_Conditional_5_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " Deleting... ");
  }
}
function RfValueSelectComponent_Conditional_5_Conditional_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " Delete ");
  }
}
function RfValueSelectComponent_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 4);
    \u0275\u0275listener("click", function RfValueSelectComponent_Conditional_5_Template_div_click_0_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.isDeleting() ? null : ctx_r2.closeDeleteDialog());
    });
    \u0275\u0275elementStart(1, "div", 5);
    \u0275\u0275listener("click", function RfValueSelectComponent_Conditional_5_Template_div_click_1_listener($event) {
      \u0275\u0275restoreView(_r4);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275elementStart(2, "h3");
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275template(4, RfValueSelectComponent_Conditional_5_Conditional_4_Template, 3, 0, "div", 13)(5, RfValueSelectComponent_Conditional_5_Conditional_5_Template, 4, 3);
    \u0275\u0275elementStart(6, "div", 10)(7, "button", 14);
    \u0275\u0275listener("click", function RfValueSelectComponent_Conditional_5_Template_button_click_7_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.confirmDelete());
    });
    \u0275\u0275template(8, RfValueSelectComponent_Conditional_5_Conditional_8_Template, 1, 0)(9, RfValueSelectComponent_Conditional_5_Conditional_9_Template, 1, 0);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "button", 15);
    \u0275\u0275listener("click", function RfValueSelectComponent_Conditional_5_Template_button_click_10_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.closeDeleteDialog());
    });
    \u0275\u0275text(11, " Cancel ");
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1("Delete ", ctx_r2.label(), "?");
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r2.isDeleting() ? 4 : 5);
    \u0275\u0275advance(3);
    \u0275\u0275property("disabled", ctx_r2.isDeleting());
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r2.isDeleting() ? 8 : 9);
    \u0275\u0275advance(2);
    \u0275\u0275property("disabled", ctx_r2.isDeleting());
  }
}
var RfValueSelectComponent = class _RfValueSelectComponent {
  valueService = inject(RfValueService);
  injector = inject(Injector);
  selectInput;
  // Inputs
  categoryAlias = input.required();
  label = input("Value");
  canManageValues = input(true);
  // Outputs
  valueSelected = output();
  // State
  value = signal(null);
  disabled = signal(false);
  // Computed options based on categoryAlias
  options = computed(() => {
    const alias = this.categoryAlias();
    if (!alias)
      return [];
    const optionsSignal = this.valueService.getValueOptions(alias);
    const opts = optionsSignal();
    return opts;
  });
  // Dialog state for Add/Edit
  showDialog = signal(false);
  dialogMode = signal("add");
  dialogValueName = "";
  dialogValueAlias = "";
  errorMessage = signal("");
  // Delete confirmation state
  showDeleteConfirm = signal(false);
  transferToValueId = null;
  selectedValueName = signal("");
  transferOptions = signal([]);
  isDeleting = signal(false);
  // ControlValueAccessor
  onChange = (value) => {
  };
  onTouched = () => {
  };
  pendingValue = void 0;
  hasPendingValue = false;
  ngAfterViewInit() {
    if (this.selectInput) {
      this.selectInput.registerOnChange((val) => {
        this.value.set(val);
        this.onChange(val);
        this.emitSelectedValue(val);
      });
      this.selectInput.registerOnTouched(() => {
        this.onTouched();
      });
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
  }
  // ==================== ControlValueAccessor Methods ====================
  writeValue(value) {
    this.value.set(value);
    if (this.selectInput) {
      this.selectInput.writeValue(value);
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
  /**
   * Emit the full RfValueDto object when a value is selected
   */
  emitSelectedValue(valueId) {
    if (valueId === null || valueId === void 0) {
      this.valueSelected.emit(null);
      return;
    }
    const values = this.valueService.getValuesByCategory(this.categoryAlias());
    const selectedValue = values.find((v) => v.id === valueId) || null;
    this.valueSelected.emit(selectedValue);
  }
  // ==================== Searchable Select Event Handlers ====================
  onAddNew() {
    this.dialogMode.set("add");
    this.dialogValueName = "";
    this.dialogValueAlias = "";
    this.errorMessage.set("");
    this.showDialog.set(true);
  }
  onEdit() {
    const currentValue = this.value();
    if (!currentValue) {
      this.errorMessage.set("Please select a value to edit");
      return;
    }
    const selectedOption = this.options().find((opt) => opt.value === currentValue);
    if (!selectedOption)
      return;
    this.dialogMode.set("edit");
    this.dialogValueName = selectedOption.label;
    this.dialogValueAlias = "";
    this.errorMessage.set("");
    this.showDialog.set(true);
  }
  // ==================== Add/Edit Dialog ====================
  closeDialog() {
    this.showDialog.set(false);
    this.dialogValueName = "";
    this.dialogValueAlias = "";
    this.errorMessage.set("");
  }
  saveValue() {
    if (!this.dialogValueName.trim()) {
      this.errorMessage.set("Name is required");
      return;
    }
    const alias = this.categoryAlias();
    const isAddMode = this.dialogMode() === "add";
    if (isAddMode) {
      this.valueService.createValue(alias, this.dialogValueName, this.dialogValueAlias).subscribe({
        next: (newValue) => {
          this.closeDialog();
          this.valueService.refreshCategory(alias);
          this.value.set(newValue.id);
          this.onChange(newValue.id);
        },
        error: (error) => {
          this.errorMessage.set(error.error?.message || "Error creating value");
        }
      });
    } else {
      const valueId = this.value();
      if (!valueId)
        return;
      this.valueService.updateValue(valueId, this.dialogValueName, this.dialogValueAlias).subscribe({
        next: () => {
          this.closeDialog();
          this.valueService.refreshCategory(alias);
        },
        error: (error) => {
          this.errorMessage.set(error.error?.message || "Error updating value");
        }
      });
    }
  }
  // ==================== Delete Dialog ====================
  openDeleteDialog() {
    const currentValue = this.value();
    if (!currentValue)
      return;
    const selectedOption = this.options().find((opt) => opt.value === currentValue);
    if (!selectedOption)
      return;
    this.selectedValueName.set(selectedOption.label);
    const transfers = this.options().filter((opt) => opt.value !== currentValue);
    this.transferOptions.set(transfers);
    this.transferToValueId = null;
    this.errorMessage.set("");
    this.showDeleteConfirm.set(true);
  }
  closeDeleteDialog() {
    this.showDeleteConfirm.set(false);
    this.transferToValueId = null;
    this.errorMessage.set("");
    this.isDeleting.set(false);
  }
  confirmDelete() {
    const valueId = this.value();
    if (!valueId)
      return;
    const alias = this.categoryAlias();
    const transferId = this.transferToValueId;
    this.isDeleting.set(true);
    this.errorMessage.set("");
    this.valueService.deleteValue(valueId, alias, transferId || void 0).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.closeDeleteDialog();
        const newValue = transferId || null;
        this.value.set(newValue);
        this.onChange(newValue);
        if (this.selectInput) {
          this.selectInput.writeValue(newValue);
        }
        this.valueService.refreshCategory(alias);
      },
      error: (error) => {
        this.isDeleting.set(false);
        this.errorMessage.set(error.error?.message || "Error deleting value");
      }
    });
  }
  static \u0275fac = function RfValueSelectComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _RfValueSelectComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _RfValueSelectComponent, selectors: [["app-rf-value-select"]], viewQuery: function RfValueSelectComponent_Query(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275viewQuery(_c06, 5);
    }
    if (rf & 2) {
      let _t;
      \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.selectInput = _t.first);
    }
  }, inputs: { categoryAlias: [1, "categoryAlias"], label: [1, "label"], canManageValues: [1, "canManageValues"] }, outputs: { valueSelected: "valueSelected" }, features: [\u0275\u0275ProvidersFeature([{
    provide: NG_VALUE_ACCESSOR,
    useExisting: _RfValueSelectComponent,
    multi: true
  }])], decls: 6, vars: 6, consts: [["selectInput", ""], [1, "rf-value-select"], [3, "addNewOption", "editOption", "deleteOption", "label", "options", "categoryName", "showDelete"], [1, "dialog-overlay"], [1, "dialog-overlay", 3, "click"], [1, "dialog-content", 3, "click"], [1, "form-group"], ["type", "text", "placeholder", "Enter name", 1, "input-field", 3, "ngModelChange", "keyup.enter", "ngModel"], ["type", "text", "placeholder", "Enter alias", 1, "input-field", 3, "ngModelChange", "keyup.enter", "ngModel"], [1, "error-message"], [1, "dialog-actions"], ["type", "button", 1, "save-btn", 3, "click", "disabled"], ["type", "button", 1, "cancel-btn", 3, "click"], [1, "loading-message"], ["type", "button", 1, "delete-btn-confirm", 3, "click", "disabled"], ["type", "button", 1, "cancel-btn", 3, "click", "disabled"], [1, "spinner"], [1, "input-field", 3, "ngModelChange", "ngModel"], [3, "value"]], template: function RfValueSelectComponent_Template(rf, ctx) {
    if (rf & 1) {
      const _r1 = \u0275\u0275getCurrentView();
      \u0275\u0275elementStart(0, "div", 1)(1, "div")(2, "app-searchable-select-input", 2, 0);
      \u0275\u0275listener("addNewOption", function RfValueSelectComponent_Template_app_searchable_select_input_addNewOption_2_listener() {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.onAddNew());
      })("editOption", function RfValueSelectComponent_Template_app_searchable_select_input_editOption_2_listener() {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.onEdit());
      })("deleteOption", function RfValueSelectComponent_Template_app_searchable_select_input_deleteOption_2_listener() {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.openDeleteDialog());
      });
      \u0275\u0275elementEnd()();
      \u0275\u0275template(4, RfValueSelectComponent_Conditional_4_Template, 18, 6, "div", 3)(5, RfValueSelectComponent_Conditional_5_Template, 12, 5, "div", 3);
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      \u0275\u0275advance(2);
      \u0275\u0275property("label", ctx.label())("options", ctx.options())("categoryName", ctx.canManageValues() ? ctx.categoryAlias() : "")("showDelete", ctx.canManageValues() && !!ctx.value());
      \u0275\u0275advance(2);
      \u0275\u0275conditional(ctx.showDialog() ? 4 : -1);
      \u0275\u0275advance();
      \u0275\u0275conditional(ctx.showDeleteConfirm() ? 5 : -1);
    }
  }, dependencies: [CommonModule, FormsModule, NgSelectOption, \u0275NgSelectMultipleOption, DefaultValueAccessor, SelectControlValueAccessor, NgControlStatus, NgModel, SearchableSelectInputComponent], styles: ["\n\n.rf-value-select[_ngcontent-%COMP%] {\n  position: relative;\n  width: 100%;\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n}\n.dialog-overlay[_ngcontent-%COMP%] {\n  position: fixed;\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  background: rgba(0, 0, 0, 0.5);\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  z-index: 1000;\n}\n.dialog-content[_ngcontent-%COMP%] {\n  background: white;\n  padding: 24px;\n  border-radius: 8px;\n  min-width: 400px;\n  max-width: 90vw;\n  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);\n}\n.dialog-content[_ngcontent-%COMP%]   h3[_ngcontent-%COMP%] {\n  margin: 0 0 20px 0;\n  font-size: 18px;\n  font-weight: 600;\n}\n.dialog-content[_ngcontent-%COMP%]   p[_ngcontent-%COMP%] {\n  margin: 0 0 16px 0;\n  color: #666;\n}\n.form-group[_ngcontent-%COMP%] {\n  margin-bottom: 16px;\n}\n.form-group[_ngcontent-%COMP%]   label[_ngcontent-%COMP%] {\n  display: block;\n  margin-bottom: 4px;\n  font-weight: 500;\n  font-size: 14px;\n}\n.input-field[_ngcontent-%COMP%] {\n  width: 100%;\n  padding: 8px;\n  border: 1px solid #ccc;\n  border-radius: 4px;\n  font-size: 14px;\n  box-sizing: border-box;\n}\n.input-field[_ngcontent-%COMP%]:focus {\n  outline: none;\n  border-color: #2196f3;\n  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);\n}\n.dialog-actions[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 8px;\n  justify-content: flex-end;\n  margin-top: 20px;\n}\n.save-btn[_ngcontent-%COMP%] {\n  padding: 8px 16px;\n  background: #4caf50;\n  color: white;\n  border: none;\n  border-radius: 4px;\n  cursor: pointer;\n  font-size: 14px;\n  font-weight: 500;\n  transition: background 0.2s;\n}\n.save-btn[_ngcontent-%COMP%]:hover:not(:disabled) {\n  background: #45a049;\n}\n.save-btn[_ngcontent-%COMP%]:disabled {\n  background: #ccc;\n  cursor: not-allowed;\n}\n.delete-btn-confirm[_ngcontent-%COMP%] {\n  padding: 8px 16px;\n  background: #f44336;\n  color: white;\n  border: none;\n  border-radius: 4px;\n  cursor: pointer;\n  font-size: 14px;\n  font-weight: 500;\n  transition: background 0.2s;\n}\n.delete-btn-confirm[_ngcontent-%COMP%]:hover {\n  background: #da190b;\n}\n.cancel-btn[_ngcontent-%COMP%] {\n  padding: 8px 16px;\n  background: #f5f5f5;\n  border: 1px solid #ccc;\n  border-radius: 4px;\n  cursor: pointer;\n  font-size: 14px;\n  transition: background 0.2s;\n}\n.cancel-btn[_ngcontent-%COMP%]:hover {\n  background: #e0e0e0;\n}\n.error-message[_ngcontent-%COMP%] {\n  color: #f44336;\n  font-size: 13px;\n  margin-top: 8px;\n  padding: 8px;\n  background: #ffebee;\n  border-radius: 4px;\n  border-left: 3px solid #f44336;\n}\n.loading-message[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  padding: 16px;\n  background: #e3f2fd;\n  border-radius: 4px;\n  color: #1565c0;\n  font-size: 14px;\n  margin-bottom: 16px;\n}\n.spinner[_ngcontent-%COMP%] {\n  width: 20px;\n  height: 20px;\n  border: 2px solid #bbdefb;\n  border-top-color: #1565c0;\n  border-radius: 50%;\n  animation: _ngcontent-%COMP%_spin 0.8s linear infinite;\n}\n@keyframes _ngcontent-%COMP%_spin {\n  to {\n    transform: rotate(360deg);\n  }\n}\n.delete-btn-confirm[_ngcontent-%COMP%]:disabled, \n.cancel-btn[_ngcontent-%COMP%]:disabled {\n  opacity: 0.6;\n  cursor: not-allowed;\n}\n/*# sourceMappingURL=rf-value-select.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(RfValueSelectComponent, { className: "RfValueSelectComponent", filePath: "src/app/features/values/refactored/components/rf-value-select/rf-value-select.component.ts", lineNumber: 20 });
})();

// node_modules/@angular/material/fesm2022/icon-registry-B2IMBfNA.mjs
var policy;
function getPolicy() {
  if (policy === void 0) {
    policy = null;
    if (typeof window !== "undefined") {
      const ttWindow = window;
      if (ttWindow.trustedTypes !== void 0) {
        policy = ttWindow.trustedTypes.createPolicy("angular#components", {
          createHTML: (s) => s
        });
      }
    }
  }
  return policy;
}
function trustedHTMLFromString(html) {
  return getPolicy()?.createHTML(html) || html;
}
function getMatIconNameNotFoundError(iconName) {
  return Error(`Unable to find icon with the name "${iconName}"`);
}
function getMatIconNoHttpProviderError() {
  return Error("Could not find HttpClient for use with Angular Material icons. Please add provideHttpClient() to your providers.");
}
function getMatIconFailedToSanitizeUrlError(url) {
  return Error(`The URL provided to MatIconRegistry was not trusted as a resource URL via Angular's DomSanitizer. Attempted URL was "${url}".`);
}
function getMatIconFailedToSanitizeLiteralError(literal) {
  return Error(`The literal provided to MatIconRegistry was not trusted as safe HTML by Angular's DomSanitizer. Attempted literal was "${literal}".`);
}
var SvgIconConfig = class {
  url;
  svgText;
  options;
  svgElement;
  constructor(url, svgText, options) {
    this.url = url;
    this.svgText = svgText;
    this.options = options;
  }
};
var MatIconRegistry = class _MatIconRegistry {
  _httpClient;
  _sanitizer;
  _errorHandler;
  _document;
  /**
   * URLs and cached SVG elements for individual icons. Keys are of the format "[namespace]:[icon]".
   */
  _svgIconConfigs = /* @__PURE__ */ new Map();
  /**
   * SvgIconConfig objects and cached SVG elements for icon sets, keyed by namespace.
   * Multiple icon sets can be registered under the same namespace.
   */
  _iconSetConfigs = /* @__PURE__ */ new Map();
  /** Cache for icons loaded by direct URLs. */
  _cachedIconsByUrl = /* @__PURE__ */ new Map();
  /** In-progress icon fetches. Used to coalesce multiple requests to the same URL. */
  _inProgressUrlFetches = /* @__PURE__ */ new Map();
  /** Map from font identifiers to their CSS class names. Used for icon fonts. */
  _fontCssClassesByAlias = /* @__PURE__ */ new Map();
  /** Registered icon resolver functions. */
  _resolvers = [];
  /**
   * The CSS classes to apply when an `<mat-icon>` component has no icon name, url, or font
   * specified. The default 'material-icons' value assumes that the material icon font has been
   * loaded as described at https://google.github.io/material-design-icons/#icon-font-for-the-web
   */
  _defaultFontSetClass = ["material-icons", "mat-ligature-font"];
  constructor(_httpClient, _sanitizer, document2, _errorHandler) {
    this._httpClient = _httpClient;
    this._sanitizer = _sanitizer;
    this._errorHandler = _errorHandler;
    this._document = document2;
  }
  /**
   * Registers an icon by URL in the default namespace.
   * @param iconName Name under which the icon should be registered.
   * @param url
   */
  addSvgIcon(iconName, url, options) {
    return this.addSvgIconInNamespace("", iconName, url, options);
  }
  /**
   * Registers an icon using an HTML string in the default namespace.
   * @param iconName Name under which the icon should be registered.
   * @param literal SVG source of the icon.
   */
  addSvgIconLiteral(iconName, literal, options) {
    return this.addSvgIconLiteralInNamespace("", iconName, literal, options);
  }
  /**
   * Registers an icon by URL in the specified namespace.
   * @param namespace Namespace in which the icon should be registered.
   * @param iconName Name under which the icon should be registered.
   * @param url
   */
  addSvgIconInNamespace(namespace, iconName, url, options) {
    return this._addSvgIconConfig(namespace, iconName, new SvgIconConfig(url, null, options));
  }
  /**
   * Registers an icon resolver function with the registry. The function will be invoked with the
   * name and namespace of an icon when the registry tries to resolve the URL from which to fetch
   * the icon. The resolver is expected to return a `SafeResourceUrl` that points to the icon,
   * an object with the icon URL and icon options, or `null` if the icon is not supported. Resolvers
   * will be invoked in the order in which they have been registered.
   * @param resolver Resolver function to be registered.
   */
  addSvgIconResolver(resolver) {
    this._resolvers.push(resolver);
    return this;
  }
  /**
   * Registers an icon using an HTML string in the specified namespace.
   * @param namespace Namespace in which the icon should be registered.
   * @param iconName Name under which the icon should be registered.
   * @param literal SVG source of the icon.
   */
  addSvgIconLiteralInNamespace(namespace, iconName, literal, options) {
    const cleanLiteral = this._sanitizer.sanitize(SecurityContext.HTML, literal);
    if (!cleanLiteral) {
      throw getMatIconFailedToSanitizeLiteralError(literal);
    }
    const trustedLiteral = trustedHTMLFromString(cleanLiteral);
    return this._addSvgIconConfig(namespace, iconName, new SvgIconConfig("", trustedLiteral, options));
  }
  /**
   * Registers an icon set by URL in the default namespace.
   * @param url
   */
  addSvgIconSet(url, options) {
    return this.addSvgIconSetInNamespace("", url, options);
  }
  /**
   * Registers an icon set using an HTML string in the default namespace.
   * @param literal SVG source of the icon set.
   */
  addSvgIconSetLiteral(literal, options) {
    return this.addSvgIconSetLiteralInNamespace("", literal, options);
  }
  /**
   * Registers an icon set by URL in the specified namespace.
   * @param namespace Namespace in which to register the icon set.
   * @param url
   */
  addSvgIconSetInNamespace(namespace, url, options) {
    return this._addSvgIconSetConfig(namespace, new SvgIconConfig(url, null, options));
  }
  /**
   * Registers an icon set using an HTML string in the specified namespace.
   * @param namespace Namespace in which to register the icon set.
   * @param literal SVG source of the icon set.
   */
  addSvgIconSetLiteralInNamespace(namespace, literal, options) {
    const cleanLiteral = this._sanitizer.sanitize(SecurityContext.HTML, literal);
    if (!cleanLiteral) {
      throw getMatIconFailedToSanitizeLiteralError(literal);
    }
    const trustedLiteral = trustedHTMLFromString(cleanLiteral);
    return this._addSvgIconSetConfig(namespace, new SvgIconConfig("", trustedLiteral, options));
  }
  /**
   * Defines an alias for CSS class names to be used for icon fonts. Creating an matIcon
   * component with the alias as the fontSet input will cause the class name to be applied
   * to the `<mat-icon>` element.
   *
   * If the registered font is a ligature font, then don't forget to also include the special
   * class `mat-ligature-font` to allow the usage via attribute. So register like this:
   *
   * ```ts
   * iconRegistry.registerFontClassAlias('f1', 'font1 mat-ligature-font');
   * ```
   *
   * And use like this:
   *
   * ```html
   * <mat-icon fontSet="f1" fontIcon="home"></mat-icon>
   * ```
   *
   * @param alias Alias for the font.
   * @param classNames Class names override to be used instead of the alias.
   */
  registerFontClassAlias(alias, classNames = alias) {
    this._fontCssClassesByAlias.set(alias, classNames);
    return this;
  }
  /**
   * Returns the CSS class name associated with the alias by a previous call to
   * registerFontClassAlias. If no CSS class has been associated, returns the alias unmodified.
   */
  classNameForFontAlias(alias) {
    return this._fontCssClassesByAlias.get(alias) || alias;
  }
  /**
   * Sets the CSS classes to be used for icon fonts when an `<mat-icon>` component does not
   * have a fontSet input value, and is not loading an icon by name or URL.
   */
  setDefaultFontSetClass(...classNames) {
    this._defaultFontSetClass = classNames;
    return this;
  }
  /**
   * Returns the CSS classes to be used for icon fonts when an `<mat-icon>` component does not
   * have a fontSet input value, and is not loading an icon by name or URL.
   */
  getDefaultFontSetClass() {
    return this._defaultFontSetClass;
  }
  /**
   * Returns an Observable that produces the icon (as an `<svg>` DOM element) from the given URL.
   * The response from the URL may be cached so this will not always cause an HTTP request, but
   * the produced element will always be a new copy of the originally fetched icon. (That is,
   * it will not contain any modifications made to elements previously returned).
   *
   * @param safeUrl URL from which to fetch the SVG icon.
   */
  getSvgIconFromUrl(safeUrl) {
    const url = this._sanitizer.sanitize(SecurityContext.RESOURCE_URL, safeUrl);
    if (!url) {
      throw getMatIconFailedToSanitizeUrlError(safeUrl);
    }
    const cachedIcon = this._cachedIconsByUrl.get(url);
    if (cachedIcon) {
      return of(cloneSvg(cachedIcon));
    }
    return this._loadSvgIconFromConfig(new SvgIconConfig(safeUrl, null)).pipe(tap((svg) => this._cachedIconsByUrl.set(url, svg)), map((svg) => cloneSvg(svg)));
  }
  /**
   * Returns an Observable that produces the icon (as an `<svg>` DOM element) with the given name
   * and namespace. The icon must have been previously registered with addIcon or addIconSet;
   * if not, the Observable will throw an error.
   *
   * @param name Name of the icon to be retrieved.
   * @param namespace Namespace in which to look for the icon.
   */
  getNamedSvgIcon(name, namespace = "") {
    const key = iconKey(namespace, name);
    let config = this._svgIconConfigs.get(key);
    if (config) {
      return this._getSvgFromConfig(config);
    }
    config = this._getIconConfigFromResolvers(namespace, name);
    if (config) {
      this._svgIconConfigs.set(key, config);
      return this._getSvgFromConfig(config);
    }
    const iconSetConfigs = this._iconSetConfigs.get(namespace);
    if (iconSetConfigs) {
      return this._getSvgFromIconSetConfigs(name, iconSetConfigs);
    }
    return throwError(getMatIconNameNotFoundError(key));
  }
  ngOnDestroy() {
    this._resolvers = [];
    this._svgIconConfigs.clear();
    this._iconSetConfigs.clear();
    this._cachedIconsByUrl.clear();
  }
  /**
   * Returns the cached icon for a SvgIconConfig if available, or fetches it from its URL if not.
   */
  _getSvgFromConfig(config) {
    if (config.svgText) {
      return of(cloneSvg(this._svgElementFromConfig(config)));
    } else {
      return this._loadSvgIconFromConfig(config).pipe(map((svg) => cloneSvg(svg)));
    }
  }
  /**
   * Attempts to find an icon with the specified name in any of the SVG icon sets.
   * First searches the available cached icons for a nested element with a matching name, and
   * if found copies the element to a new `<svg>` element. If not found, fetches all icon sets
   * that have not been cached, and searches again after all fetches are completed.
   * The returned Observable produces the SVG element if possible, and throws
   * an error if no icon with the specified name can be found.
   */
  _getSvgFromIconSetConfigs(name, iconSetConfigs) {
    const namedIcon = this._extractIconWithNameFromAnySet(name, iconSetConfigs);
    if (namedIcon) {
      return of(namedIcon);
    }
    const iconSetFetchRequests = iconSetConfigs.filter((iconSetConfig) => !iconSetConfig.svgText).map((iconSetConfig) => {
      return this._loadSvgIconSetFromConfig(iconSetConfig).pipe(catchError((err) => {
        const url = this._sanitizer.sanitize(SecurityContext.RESOURCE_URL, iconSetConfig.url);
        const errorMessage = `Loading icon set URL: ${url} failed: ${err.message}`;
        this._errorHandler.handleError(new Error(errorMessage));
        return of(null);
      }));
    });
    return forkJoin(iconSetFetchRequests).pipe(map(() => {
      const foundIcon = this._extractIconWithNameFromAnySet(name, iconSetConfigs);
      if (!foundIcon) {
        throw getMatIconNameNotFoundError(name);
      }
      return foundIcon;
    }));
  }
  /**
   * Searches the cached SVG elements for the given icon sets for a nested icon element whose "id"
   * tag matches the specified name. If found, copies the nested element to a new SVG element and
   * returns it. Returns null if no matching element is found.
   */
  _extractIconWithNameFromAnySet(iconName, iconSetConfigs) {
    for (let i = iconSetConfigs.length - 1; i >= 0; i--) {
      const config = iconSetConfigs[i];
      if (config.svgText && config.svgText.toString().indexOf(iconName) > -1) {
        const svg = this._svgElementFromConfig(config);
        const foundIcon = this._extractSvgIconFromSet(svg, iconName, config.options);
        if (foundIcon) {
          return foundIcon;
        }
      }
    }
    return null;
  }
  /**
   * Loads the content of the icon URL specified in the SvgIconConfig and creates an SVG element
   * from it.
   */
  _loadSvgIconFromConfig(config) {
    return this._fetchIcon(config).pipe(tap((svgText) => config.svgText = svgText), map(() => this._svgElementFromConfig(config)));
  }
  /**
   * Loads the content of the icon set URL specified in the
   * SvgIconConfig and attaches it to the config.
   */
  _loadSvgIconSetFromConfig(config) {
    if (config.svgText) {
      return of(null);
    }
    return this._fetchIcon(config).pipe(tap((svgText) => config.svgText = svgText));
  }
  /**
   * Searches the cached element of the given SvgIconConfig for a nested icon element whose "id"
   * tag matches the specified name. If found, copies the nested element to a new SVG element and
   * returns it. Returns null if no matching element is found.
   */
  _extractSvgIconFromSet(iconSet, iconName, options) {
    const iconSource = iconSet.querySelector(`[id="${iconName}"]`);
    if (!iconSource) {
      return null;
    }
    const iconElement = iconSource.cloneNode(true);
    iconElement.removeAttribute("id");
    if (iconElement.nodeName.toLowerCase() === "svg") {
      return this._setSvgAttributes(iconElement, options);
    }
    if (iconElement.nodeName.toLowerCase() === "symbol") {
      return this._setSvgAttributes(this._toSvgElement(iconElement), options);
    }
    const svg = this._svgElementFromString(trustedHTMLFromString("<svg></svg>"));
    svg.appendChild(iconElement);
    return this._setSvgAttributes(svg, options);
  }
  /**
   * Creates a DOM element from the given SVG string.
   */
  _svgElementFromString(str) {
    const div = this._document.createElement("DIV");
    div.innerHTML = str;
    const svg = div.querySelector("svg");
    if (!svg) {
      throw Error("<svg> tag not found");
    }
    return svg;
  }
  /**
   * Converts an element into an SVG node by cloning all of its children.
   */
  _toSvgElement(element) {
    const svg = this._svgElementFromString(trustedHTMLFromString("<svg></svg>"));
    const attributes = element.attributes;
    for (let i = 0; i < attributes.length; i++) {
      const {
        name,
        value
      } = attributes[i];
      if (name !== "id") {
        svg.setAttribute(name, value);
      }
    }
    for (let i = 0; i < element.childNodes.length; i++) {
      if (element.childNodes[i].nodeType === this._document.ELEMENT_NODE) {
        svg.appendChild(element.childNodes[i].cloneNode(true));
      }
    }
    return svg;
  }
  /**
   * Sets the default attributes for an SVG element to be used as an icon.
   */
  _setSvgAttributes(svg, options) {
    svg.setAttribute("fit", "");
    svg.setAttribute("height", "100%");
    svg.setAttribute("width", "100%");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.setAttribute("focusable", "false");
    if (options && options.viewBox) {
      svg.setAttribute("viewBox", options.viewBox);
    }
    return svg;
  }
  /**
   * Returns an Observable which produces the string contents of the given icon. Results may be
   * cached, so future calls with the same URL may not cause another HTTP request.
   */
  _fetchIcon(iconConfig) {
    const {
      url: safeUrl,
      options
    } = iconConfig;
    const withCredentials = options?.withCredentials ?? false;
    if (!this._httpClient) {
      throw getMatIconNoHttpProviderError();
    }
    if (safeUrl == null) {
      throw Error(`Cannot fetch icon from URL "${safeUrl}".`);
    }
    const url = this._sanitizer.sanitize(SecurityContext.RESOURCE_URL, safeUrl);
    if (!url) {
      throw getMatIconFailedToSanitizeUrlError(safeUrl);
    }
    const inProgressFetch = this._inProgressUrlFetches.get(url);
    if (inProgressFetch) {
      return inProgressFetch;
    }
    const req = this._httpClient.get(url, {
      responseType: "text",
      withCredentials
    }).pipe(map((svg) => {
      return trustedHTMLFromString(svg);
    }), finalize(() => this._inProgressUrlFetches.delete(url)), share());
    this._inProgressUrlFetches.set(url, req);
    return req;
  }
  /**
   * Registers an icon config by name in the specified namespace.
   * @param namespace Namespace in which to register the icon config.
   * @param iconName Name under which to register the config.
   * @param config Config to be registered.
   */
  _addSvgIconConfig(namespace, iconName, config) {
    this._svgIconConfigs.set(iconKey(namespace, iconName), config);
    return this;
  }
  /**
   * Registers an icon set config in the specified namespace.
   * @param namespace Namespace in which to register the icon config.
   * @param config Config to be registered.
   */
  _addSvgIconSetConfig(namespace, config) {
    const configNamespace = this._iconSetConfigs.get(namespace);
    if (configNamespace) {
      configNamespace.push(config);
    } else {
      this._iconSetConfigs.set(namespace, [config]);
    }
    return this;
  }
  /** Parses a config's text into an SVG element. */
  _svgElementFromConfig(config) {
    if (!config.svgElement) {
      const svg = this._svgElementFromString(config.svgText);
      this._setSvgAttributes(svg, config.options);
      config.svgElement = svg;
    }
    return config.svgElement;
  }
  /** Tries to create an icon config through the registered resolver functions. */
  _getIconConfigFromResolvers(namespace, name) {
    for (let i = 0; i < this._resolvers.length; i++) {
      const result = this._resolvers[i](name, namespace);
      if (result) {
        return isSafeUrlWithOptions(result) ? new SvgIconConfig(result.url, null, result.options) : new SvgIconConfig(result, null);
      }
    }
    return void 0;
  }
  static \u0275fac = function MatIconRegistry_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _MatIconRegistry)(\u0275\u0275inject(HttpClient, 8), \u0275\u0275inject(DomSanitizer), \u0275\u0275inject(DOCUMENT, 8), \u0275\u0275inject(ErrorHandler));
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({
    token: _MatIconRegistry,
    factory: _MatIconRegistry.\u0275fac,
    providedIn: "root"
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MatIconRegistry, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], () => [{
    type: HttpClient,
    decorators: [{
      type: Optional
    }]
  }, {
    type: DomSanitizer
  }, {
    type: void 0,
    decorators: [{
      type: Optional
    }, {
      type: Inject,
      args: [DOCUMENT]
    }]
  }, {
    type: ErrorHandler
  }], null);
})();
function ICON_REGISTRY_PROVIDER_FACTORY(parentRegistry, httpClient, sanitizer, errorHandler, document2) {
  return parentRegistry || new MatIconRegistry(httpClient, sanitizer, document2, errorHandler);
}
var ICON_REGISTRY_PROVIDER = {
  // If there is already an MatIconRegistry available, use that. Otherwise, provide a new one.
  provide: MatIconRegistry,
  deps: [[new Optional(), new SkipSelf(), MatIconRegistry], [new Optional(), HttpClient], DomSanitizer, ErrorHandler, [new Optional(), DOCUMENT]],
  useFactory: ICON_REGISTRY_PROVIDER_FACTORY
};
function cloneSvg(svg) {
  return svg.cloneNode(true);
}
function iconKey(namespace, name) {
  return namespace + ":" + name;
}
function isSafeUrlWithOptions(value) {
  return !!(value.url && value.options);
}

// node_modules/@angular/cdk/fesm2022/passive-listeners-esHZRgIN.mjs
var supportsPassiveEvents;
function supportsPassiveEventListeners() {
  if (supportsPassiveEvents == null && typeof window !== "undefined") {
    try {
      window.addEventListener("test", null, Object.defineProperty({}, "passive", {
        get: () => supportsPassiveEvents = true
      }));
    } finally {
      supportsPassiveEvents = supportsPassiveEvents || false;
    }
  }
  return supportsPassiveEvents;
}
function normalizePassiveListenerOptions(options) {
  return supportsPassiveEventListeners() ? options : !!options.capture;
}

// node_modules/@angular/cdk/fesm2022/focus-monitor-e2l_RpN3.mjs
var INPUT_MODALITY_DETECTOR_OPTIONS = new InjectionToken("cdk-input-modality-detector-options");
var INPUT_MODALITY_DETECTOR_DEFAULT_OPTIONS = {
  ignoreKeys: [ALT, CONTROL, MAC_META, META, SHIFT]
};
var TOUCH_BUFFER_MS = 650;
var modalityEventListenerOptions = {
  passive: true,
  capture: true
};
var InputModalityDetector = class _InputModalityDetector {
  _platform = inject(Platform);
  _listenerCleanups;
  /** Emits whenever an input modality is detected. */
  modalityDetected;
  /** Emits when the input modality changes. */
  modalityChanged;
  /** The most recently detected input modality. */
  get mostRecentModality() {
    return this._modality.value;
  }
  /**
   * The most recently detected input modality event target. Is null if no input modality has been
   * detected or if the associated event target is null for some unknown reason.
   */
  _mostRecentTarget = null;
  /** The underlying BehaviorSubject that emits whenever an input modality is detected. */
  _modality = new BehaviorSubject(null);
  /** Options for this InputModalityDetector. */
  _options;
  /**
   * The timestamp of the last touch input modality. Used to determine whether mousedown events
   * should be attributed to mouse or touch.
   */
  _lastTouchMs = 0;
  /**
   * Handles keydown events. Must be an arrow function in order to preserve the context when it gets
   * bound.
   */
  _onKeydown = (event) => {
    if (this._options?.ignoreKeys?.some((keyCode) => keyCode === event.keyCode)) {
      return;
    }
    this._modality.next("keyboard");
    this._mostRecentTarget = _getEventTarget(event);
  };
  /**
   * Handles mousedown events. Must be an arrow function in order to preserve the context when it
   * gets bound.
   */
  _onMousedown = (event) => {
    if (Date.now() - this._lastTouchMs < TOUCH_BUFFER_MS) {
      return;
    }
    this._modality.next(isFakeMousedownFromScreenReader(event) ? "keyboard" : "mouse");
    this._mostRecentTarget = _getEventTarget(event);
  };
  /**
   * Handles touchstart events. Must be an arrow function in order to preserve the context when it
   * gets bound.
   */
  _onTouchstart = (event) => {
    if (isFakeTouchstartFromScreenReader(event)) {
      this._modality.next("keyboard");
      return;
    }
    this._lastTouchMs = Date.now();
    this._modality.next("touch");
    this._mostRecentTarget = _getEventTarget(event);
  };
  constructor() {
    const ngZone = inject(NgZone);
    const document2 = inject(DOCUMENT);
    const options = inject(INPUT_MODALITY_DETECTOR_OPTIONS, {
      optional: true
    });
    this._options = __spreadValues(__spreadValues({}, INPUT_MODALITY_DETECTOR_DEFAULT_OPTIONS), options);
    this.modalityDetected = this._modality.pipe(skip(1));
    this.modalityChanged = this.modalityDetected.pipe(distinctUntilChanged());
    if (this._platform.isBrowser) {
      const renderer = inject(RendererFactory2).createRenderer(null, null);
      this._listenerCleanups = ngZone.runOutsideAngular(() => {
        return [_bindEventWithOptions(renderer, document2, "keydown", this._onKeydown, modalityEventListenerOptions), _bindEventWithOptions(renderer, document2, "mousedown", this._onMousedown, modalityEventListenerOptions), _bindEventWithOptions(renderer, document2, "touchstart", this._onTouchstart, modalityEventListenerOptions)];
      });
    }
  }
  ngOnDestroy() {
    this._modality.complete();
    this._listenerCleanups?.forEach((cleanup) => cleanup());
  }
  static \u0275fac = function InputModalityDetector_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _InputModalityDetector)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({
    token: _InputModalityDetector,
    factory: _InputModalityDetector.\u0275fac,
    providedIn: "root"
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(InputModalityDetector, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], () => [], null);
})();
var FocusMonitorDetectionMode;
(function(FocusMonitorDetectionMode2) {
  FocusMonitorDetectionMode2[FocusMonitorDetectionMode2["IMMEDIATE"] = 0] = "IMMEDIATE";
  FocusMonitorDetectionMode2[FocusMonitorDetectionMode2["EVENTUAL"] = 1] = "EVENTUAL";
})(FocusMonitorDetectionMode || (FocusMonitorDetectionMode = {}));
var FOCUS_MONITOR_DEFAULT_OPTIONS = new InjectionToken("cdk-focus-monitor-default-options");
var captureEventListenerOptions = normalizePassiveListenerOptions({
  passive: true,
  capture: true
});
var FocusMonitor = class _FocusMonitor {
  _ngZone = inject(NgZone);
  _platform = inject(Platform);
  _inputModalityDetector = inject(InputModalityDetector);
  /** The focus origin that the next focus event is a result of. */
  _origin = null;
  /** The FocusOrigin of the last focus event tracked by the FocusMonitor. */
  _lastFocusOrigin;
  /** Whether the window has just been focused. */
  _windowFocused = false;
  /** The timeout id of the window focus timeout. */
  _windowFocusTimeoutId;
  /** The timeout id of the origin clearing timeout. */
  _originTimeoutId;
  /**
   * Whether the origin was determined via a touch interaction. Necessary as properly attributing
   * focus events to touch interactions requires special logic.
   */
  _originFromTouchInteraction = false;
  /** Map of elements being monitored to their info. */
  _elementInfo = /* @__PURE__ */ new Map();
  /** The number of elements currently being monitored. */
  _monitoredElementCount = 0;
  /**
   * Keeps track of the root nodes to which we've currently bound a focus/blur handler,
   * as well as the number of monitored elements that they contain. We have to treat focus/blur
   * handlers differently from the rest of the events, because the browser won't emit events
   * to the document when focus moves inside of a shadow root.
   */
  _rootNodeFocusListenerCount = /* @__PURE__ */ new Map();
  /**
   * The specified detection mode, used for attributing the origin of a focus
   * event.
   */
  _detectionMode;
  /**
   * Event listener for `focus` events on the window.
   * Needs to be an arrow function in order to preserve the context when it gets bound.
   */
  _windowFocusListener = () => {
    this._windowFocused = true;
    this._windowFocusTimeoutId = setTimeout(() => this._windowFocused = false);
  };
  /** Used to reference correct document/window */
  _document = inject(DOCUMENT, {
    optional: true
  });
  /** Subject for stopping our InputModalityDetector subscription. */
  _stopInputModalityDetector = new Subject();
  constructor() {
    const options = inject(FOCUS_MONITOR_DEFAULT_OPTIONS, {
      optional: true
    });
    this._detectionMode = options?.detectionMode || FocusMonitorDetectionMode.IMMEDIATE;
  }
  /**
   * Event listener for `focus` and 'blur' events on the document.
   * Needs to be an arrow function in order to preserve the context when it gets bound.
   */
  _rootNodeFocusAndBlurListener = (event) => {
    const target = _getEventTarget(event);
    for (let element = target; element; element = element.parentElement) {
      if (event.type === "focus") {
        this._onFocus(event, element);
      } else {
        this._onBlur(event, element);
      }
    }
  };
  monitor(element, checkChildren = false) {
    const nativeElement = coerceElement(element);
    if (!this._platform.isBrowser || nativeElement.nodeType !== 1) {
      return of();
    }
    const rootNode = _getShadowRoot(nativeElement) || this._getDocument();
    const cachedInfo = this._elementInfo.get(nativeElement);
    if (cachedInfo) {
      if (checkChildren) {
        cachedInfo.checkChildren = true;
      }
      return cachedInfo.subject;
    }
    const info = {
      checkChildren,
      subject: new Subject(),
      rootNode
    };
    this._elementInfo.set(nativeElement, info);
    this._registerGlobalListeners(info);
    return info.subject;
  }
  stopMonitoring(element) {
    const nativeElement = coerceElement(element);
    const elementInfo = this._elementInfo.get(nativeElement);
    if (elementInfo) {
      elementInfo.subject.complete();
      this._setClasses(nativeElement);
      this._elementInfo.delete(nativeElement);
      this._removeGlobalListeners(elementInfo);
    }
  }
  focusVia(element, origin, options) {
    const nativeElement = coerceElement(element);
    const focusedElement = this._getDocument().activeElement;
    if (nativeElement === focusedElement) {
      this._getClosestElementsInfo(nativeElement).forEach(([currentElement, info]) => this._originChanged(currentElement, origin, info));
    } else {
      this._setOrigin(origin);
      if (typeof nativeElement.focus === "function") {
        nativeElement.focus(options);
      }
    }
  }
  ngOnDestroy() {
    this._elementInfo.forEach((_info, element) => this.stopMonitoring(element));
  }
  /** Access injected document if available or fallback to global document reference */
  _getDocument() {
    return this._document || document;
  }
  /** Use defaultView of injected document if available or fallback to global window reference */
  _getWindow() {
    const doc = this._getDocument();
    return doc.defaultView || window;
  }
  _getFocusOrigin(focusEventTarget) {
    if (this._origin) {
      if (this._originFromTouchInteraction) {
        return this._shouldBeAttributedToTouch(focusEventTarget) ? "touch" : "program";
      } else {
        return this._origin;
      }
    }
    if (this._windowFocused && this._lastFocusOrigin) {
      return this._lastFocusOrigin;
    }
    if (focusEventTarget && this._isLastInteractionFromInputLabel(focusEventTarget)) {
      return "mouse";
    }
    return "program";
  }
  /**
   * Returns whether the focus event should be attributed to touch. Recall that in IMMEDIATE mode, a
   * touch origin isn't immediately reset at the next tick (see _setOrigin). This means that when we
   * handle a focus event following a touch interaction, we need to determine whether (1) the focus
   * event was directly caused by the touch interaction or (2) the focus event was caused by a
   * subsequent programmatic focus call triggered by the touch interaction.
   * @param focusEventTarget The target of the focus event under examination.
   */
  _shouldBeAttributedToTouch(focusEventTarget) {
    return this._detectionMode === FocusMonitorDetectionMode.EVENTUAL || !!focusEventTarget?.contains(this._inputModalityDetector._mostRecentTarget);
  }
  /**
   * Sets the focus classes on the element based on the given focus origin.
   * @param element The element to update the classes on.
   * @param origin The focus origin.
   */
  _setClasses(element, origin) {
    element.classList.toggle("cdk-focused", !!origin);
    element.classList.toggle("cdk-touch-focused", origin === "touch");
    element.classList.toggle("cdk-keyboard-focused", origin === "keyboard");
    element.classList.toggle("cdk-mouse-focused", origin === "mouse");
    element.classList.toggle("cdk-program-focused", origin === "program");
  }
  /**
   * Updates the focus origin. If we're using immediate detection mode, we schedule an async
   * function to clear the origin at the end of a timeout. The duration of the timeout depends on
   * the origin being set.
   * @param origin The origin to set.
   * @param isFromInteraction Whether we are setting the origin from an interaction event.
   */
  _setOrigin(origin, isFromInteraction = false) {
    this._ngZone.runOutsideAngular(() => {
      this._origin = origin;
      this._originFromTouchInteraction = origin === "touch" && isFromInteraction;
      if (this._detectionMode === FocusMonitorDetectionMode.IMMEDIATE) {
        clearTimeout(this._originTimeoutId);
        const ms = this._originFromTouchInteraction ? TOUCH_BUFFER_MS : 1;
        this._originTimeoutId = setTimeout(() => this._origin = null, ms);
      }
    });
  }
  /**
   * Handles focus events on a registered element.
   * @param event The focus event.
   * @param element The monitored element.
   */
  _onFocus(event, element) {
    const elementInfo = this._elementInfo.get(element);
    const focusEventTarget = _getEventTarget(event);
    if (!elementInfo || !elementInfo.checkChildren && element !== focusEventTarget) {
      return;
    }
    this._originChanged(element, this._getFocusOrigin(focusEventTarget), elementInfo);
  }
  /**
   * Handles blur events on a registered element.
   * @param event The blur event.
   * @param element The monitored element.
   */
  _onBlur(event, element) {
    const elementInfo = this._elementInfo.get(element);
    if (!elementInfo || elementInfo.checkChildren && event.relatedTarget instanceof Node && element.contains(event.relatedTarget)) {
      return;
    }
    this._setClasses(element);
    this._emitOrigin(elementInfo, null);
  }
  _emitOrigin(info, origin) {
    if (info.subject.observers.length) {
      this._ngZone.run(() => info.subject.next(origin));
    }
  }
  _registerGlobalListeners(elementInfo) {
    if (!this._platform.isBrowser) {
      return;
    }
    const rootNode = elementInfo.rootNode;
    const rootNodeFocusListeners = this._rootNodeFocusListenerCount.get(rootNode) || 0;
    if (!rootNodeFocusListeners) {
      this._ngZone.runOutsideAngular(() => {
        rootNode.addEventListener("focus", this._rootNodeFocusAndBlurListener, captureEventListenerOptions);
        rootNode.addEventListener("blur", this._rootNodeFocusAndBlurListener, captureEventListenerOptions);
      });
    }
    this._rootNodeFocusListenerCount.set(rootNode, rootNodeFocusListeners + 1);
    if (++this._monitoredElementCount === 1) {
      this._ngZone.runOutsideAngular(() => {
        const window2 = this._getWindow();
        window2.addEventListener("focus", this._windowFocusListener);
      });
      this._inputModalityDetector.modalityDetected.pipe(takeUntil(this._stopInputModalityDetector)).subscribe((modality) => {
        this._setOrigin(
          modality,
          true
          /* isFromInteraction */
        );
      });
    }
  }
  _removeGlobalListeners(elementInfo) {
    const rootNode = elementInfo.rootNode;
    if (this._rootNodeFocusListenerCount.has(rootNode)) {
      const rootNodeFocusListeners = this._rootNodeFocusListenerCount.get(rootNode);
      if (rootNodeFocusListeners > 1) {
        this._rootNodeFocusListenerCount.set(rootNode, rootNodeFocusListeners - 1);
      } else {
        rootNode.removeEventListener("focus", this._rootNodeFocusAndBlurListener, captureEventListenerOptions);
        rootNode.removeEventListener("blur", this._rootNodeFocusAndBlurListener, captureEventListenerOptions);
        this._rootNodeFocusListenerCount.delete(rootNode);
      }
    }
    if (!--this._monitoredElementCount) {
      const window2 = this._getWindow();
      window2.removeEventListener("focus", this._windowFocusListener);
      this._stopInputModalityDetector.next();
      clearTimeout(this._windowFocusTimeoutId);
      clearTimeout(this._originTimeoutId);
    }
  }
  /** Updates all the state on an element once its focus origin has changed. */
  _originChanged(element, origin, elementInfo) {
    this._setClasses(element, origin);
    this._emitOrigin(elementInfo, origin);
    this._lastFocusOrigin = origin;
  }
  /**
   * Collects the `MonitoredElementInfo` of a particular element and
   * all of its ancestors that have enabled `checkChildren`.
   * @param element Element from which to start the search.
   */
  _getClosestElementsInfo(element) {
    const results = [];
    this._elementInfo.forEach((info, currentElement) => {
      if (currentElement === element || info.checkChildren && currentElement.contains(element)) {
        results.push([currentElement, info]);
      }
    });
    return results;
  }
  /**
   * Returns whether an interaction is likely to have come from the user clicking the `label` of
   * an `input` or `textarea` in order to focus it.
   * @param focusEventTarget Target currently receiving focus.
   */
  _isLastInteractionFromInputLabel(focusEventTarget) {
    const {
      _mostRecentTarget: mostRecentTarget,
      mostRecentModality
    } = this._inputModalityDetector;
    if (mostRecentModality !== "mouse" || !mostRecentTarget || mostRecentTarget === focusEventTarget || focusEventTarget.nodeName !== "INPUT" && focusEventTarget.nodeName !== "TEXTAREA" || focusEventTarget.disabled) {
      return false;
    }
    const labels = focusEventTarget.labels;
    if (labels) {
      for (let i = 0; i < labels.length; i++) {
        if (labels[i].contains(mostRecentTarget)) {
          return true;
        }
      }
    }
    return false;
  }
  static \u0275fac = function FocusMonitor_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _FocusMonitor)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({
    token: _FocusMonitor,
    factory: _FocusMonitor.\u0275fac,
    providedIn: "root"
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(FocusMonitor, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], () => [], null);
})();
var CdkMonitorFocus = class _CdkMonitorFocus {
  _elementRef = inject(ElementRef);
  _focusMonitor = inject(FocusMonitor);
  _monitorSubscription;
  _focusOrigin = null;
  cdkFocusChange = new EventEmitter();
  constructor() {
  }
  get focusOrigin() {
    return this._focusOrigin;
  }
  ngAfterViewInit() {
    const element = this._elementRef.nativeElement;
    this._monitorSubscription = this._focusMonitor.monitor(element, element.nodeType === 1 && element.hasAttribute("cdkMonitorSubtreeFocus")).subscribe((origin) => {
      this._focusOrigin = origin;
      this.cdkFocusChange.emit(origin);
    });
  }
  ngOnDestroy() {
    this._focusMonitor.stopMonitoring(this._elementRef);
    if (this._monitorSubscription) {
      this._monitorSubscription.unsubscribe();
    }
  }
  static \u0275fac = function CdkMonitorFocus_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _CdkMonitorFocus)();
  };
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
    type: _CdkMonitorFocus,
    selectors: [["", "cdkMonitorElementFocus", ""], ["", "cdkMonitorSubtreeFocus", ""]],
    outputs: {
      cdkFocusChange: "cdkFocusChange"
    },
    exportAs: ["cdkMonitorFocus"]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(CdkMonitorFocus, [{
    type: Directive,
    args: [{
      selector: "[cdkMonitorElementFocus], [cdkMonitorSubtreeFocus]",
      exportAs: "cdkMonitorFocus"
    }]
  }], () => [], {
    cdkFocusChange: [{
      type: Output
    }]
  });
})();

// node_modules/@angular/cdk/fesm2022/private.mjs
var _VisuallyHiddenLoader = class __VisuallyHiddenLoader {
  static \u0275fac = function _VisuallyHiddenLoader_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || __VisuallyHiddenLoader)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({
    type: __VisuallyHiddenLoader,
    selectors: [["ng-component"]],
    exportAs: ["cdkVisuallyHidden"],
    decls: 0,
    vars: 0,
    template: function _VisuallyHiddenLoader_Template(rf, ctx) {
    },
    styles: [".cdk-visually-hidden{border:0;clip:rect(0 0 0 0);height:1px;margin:-1px;overflow:hidden;padding:0;position:absolute;width:1px;white-space:nowrap;outline:0;-webkit-appearance:none;-moz-appearance:none;left:0}[dir=rtl] .cdk-visually-hidden{left:auto;right:0}\n"],
    encapsulation: 2,
    changeDetection: 0
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(_VisuallyHiddenLoader, [{
    type: Component,
    args: [{
      exportAs: "cdkVisuallyHidden",
      encapsulation: ViewEncapsulation.None,
      template: "",
      changeDetection: ChangeDetectionStrategy.OnPush,
      styles: [".cdk-visually-hidden{border:0;clip:rect(0 0 0 0);height:1px;margin:-1px;overflow:hidden;padding:0;position:absolute;width:1px;white-space:nowrap;outline:0;-webkit-appearance:none;-moz-appearance:none;left:0}[dir=rtl] .cdk-visually-hidden{left:auto;right:0}\n"]
    }]
  }], null, null);
})();

// node_modules/@angular/cdk/fesm2022/breakpoints-observer-CljOfYGy.mjs
var mediaQueriesForWebkitCompatibility = /* @__PURE__ */ new Set();
var mediaQueryStyleNode;
var MediaMatcher = class _MediaMatcher {
  _platform = inject(Platform);
  _nonce = inject(CSP_NONCE, {
    optional: true
  });
  /** The internal matchMedia method to return back a MediaQueryList like object. */
  _matchMedia;
  constructor() {
    this._matchMedia = this._platform.isBrowser && window.matchMedia ? (
      // matchMedia is bound to the window scope intentionally as it is an illegal invocation to
      // call it from a different scope.
      window.matchMedia.bind(window)
    ) : noopMatchMedia;
  }
  /**
   * Evaluates the given media query and returns the native MediaQueryList from which results
   * can be retrieved.
   * Confirms the layout engine will trigger for the selector query provided and returns the
   * MediaQueryList for the query provided.
   */
  matchMedia(query) {
    if (this._platform.WEBKIT || this._platform.BLINK) {
      createEmptyStyleRule(query, this._nonce);
    }
    return this._matchMedia(query);
  }
  static \u0275fac = function MediaMatcher_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _MediaMatcher)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({
    token: _MediaMatcher,
    factory: _MediaMatcher.\u0275fac,
    providedIn: "root"
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MediaMatcher, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], () => [], null);
})();
function createEmptyStyleRule(query, nonce) {
  if (mediaQueriesForWebkitCompatibility.has(query)) {
    return;
  }
  try {
    if (!mediaQueryStyleNode) {
      mediaQueryStyleNode = document.createElement("style");
      if (nonce) {
        mediaQueryStyleNode.setAttribute("nonce", nonce);
      }
      mediaQueryStyleNode.setAttribute("type", "text/css");
      document.head.appendChild(mediaQueryStyleNode);
    }
    if (mediaQueryStyleNode.sheet) {
      mediaQueryStyleNode.sheet.insertRule(`@media ${query} {body{ }}`, 0);
      mediaQueriesForWebkitCompatibility.add(query);
    }
  } catch (e) {
    console.error(e);
  }
}
function noopMatchMedia(query) {
  return {
    matches: query === "all" || query === "",
    media: query,
    addListener: () => {
    },
    removeListener: () => {
    }
  };
}
var BreakpointObserver = class _BreakpointObserver {
  _mediaMatcher = inject(MediaMatcher);
  _zone = inject(NgZone);
  /**  A map of all media queries currently being listened for. */
  _queries = /* @__PURE__ */ new Map();
  /** A subject for all other observables to takeUntil based on. */
  _destroySubject = new Subject();
  constructor() {
  }
  /** Completes the active subject, signalling to all other observables to complete. */
  ngOnDestroy() {
    this._destroySubject.next();
    this._destroySubject.complete();
  }
  /**
   * Whether one or more media queries match the current viewport size.
   * @param value One or more media queries to check.
   * @returns Whether any of the media queries match.
   */
  isMatched(value) {
    const queries = splitQueries(coerceArray(value));
    return queries.some((mediaQuery) => this._registerQuery(mediaQuery).mql.matches);
  }
  /**
   * Gets an observable of results for the given queries that will emit new results for any changes
   * in matching of the given queries.
   * @param value One or more media queries to check.
   * @returns A stream of matches for the given queries.
   */
  observe(value) {
    const queries = splitQueries(coerceArray(value));
    const observables = queries.map((query) => this._registerQuery(query).observable);
    let stateObservable = combineLatest(observables);
    stateObservable = concat(stateObservable.pipe(take(1)), stateObservable.pipe(skip(1), debounceTime(0)));
    return stateObservable.pipe(map((breakpointStates) => {
      const response = {
        matches: false,
        breakpoints: {}
      };
      breakpointStates.forEach(({
        matches,
        query
      }) => {
        response.matches = response.matches || matches;
        response.breakpoints[query] = matches;
      });
      return response;
    }));
  }
  /** Registers a specific query to be listened for. */
  _registerQuery(query) {
    if (this._queries.has(query)) {
      return this._queries.get(query);
    }
    const mql = this._mediaMatcher.matchMedia(query);
    const queryObservable = new Observable((observer) => {
      const handler = (e) => this._zone.run(() => observer.next(e));
      mql.addListener(handler);
      return () => {
        mql.removeListener(handler);
      };
    }).pipe(startWith(mql), map(({
      matches
    }) => ({
      query,
      matches
    })), takeUntil(this._destroySubject));
    const output2 = {
      observable: queryObservable,
      mql
    };
    this._queries.set(query, output2);
    return output2;
  }
  static \u0275fac = function BreakpointObserver_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BreakpointObserver)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({
    token: _BreakpointObserver,
    factory: _BreakpointObserver.\u0275fac,
    providedIn: "root"
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BreakpointObserver, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], () => [], null);
})();
function splitQueries(queries) {
  return queries.map((query) => query.split(",")).reduce((a1, a2) => a1.concat(a2)).map((query) => query.trim());
}

// node_modules/@angular/cdk/fesm2022/observers.mjs
function shouldIgnoreRecord(record) {
  if (record.type === "characterData" && record.target instanceof Comment) {
    return true;
  }
  if (record.type === "childList") {
    for (let i = 0; i < record.addedNodes.length; i++) {
      if (!(record.addedNodes[i] instanceof Comment)) {
        return false;
      }
    }
    for (let i = 0; i < record.removedNodes.length; i++) {
      if (!(record.removedNodes[i] instanceof Comment)) {
        return false;
      }
    }
    return true;
  }
  return false;
}
var MutationObserverFactory = class _MutationObserverFactory {
  create(callback) {
    return typeof MutationObserver === "undefined" ? null : new MutationObserver(callback);
  }
  static \u0275fac = function MutationObserverFactory_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _MutationObserverFactory)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({
    token: _MutationObserverFactory,
    factory: _MutationObserverFactory.\u0275fac,
    providedIn: "root"
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MutationObserverFactory, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], null, null);
})();
var ContentObserver = class _ContentObserver {
  _mutationObserverFactory = inject(MutationObserverFactory);
  /** Keeps track of the existing MutationObservers so they can be reused. */
  _observedElements = /* @__PURE__ */ new Map();
  _ngZone = inject(NgZone);
  constructor() {
  }
  ngOnDestroy() {
    this._observedElements.forEach((_, element) => this._cleanupObserver(element));
  }
  observe(elementOrRef) {
    const element = coerceElement(elementOrRef);
    return new Observable((observer) => {
      const stream = this._observeElement(element);
      const subscription = stream.pipe(map((records) => records.filter((record) => !shouldIgnoreRecord(record))), filter((records) => !!records.length)).subscribe((records) => {
        this._ngZone.run(() => {
          observer.next(records);
        });
      });
      return () => {
        subscription.unsubscribe();
        this._unobserveElement(element);
      };
    });
  }
  /**
   * Observes the given element by using the existing MutationObserver if available, or creating a
   * new one if not.
   */
  _observeElement(element) {
    return this._ngZone.runOutsideAngular(() => {
      if (!this._observedElements.has(element)) {
        const stream = new Subject();
        const observer = this._mutationObserverFactory.create((mutations) => stream.next(mutations));
        if (observer) {
          observer.observe(element, {
            characterData: true,
            childList: true,
            subtree: true
          });
        }
        this._observedElements.set(element, {
          observer,
          stream,
          count: 1
        });
      } else {
        this._observedElements.get(element).count++;
      }
      return this._observedElements.get(element).stream;
    });
  }
  /**
   * Un-observes the given element and cleans up the underlying MutationObserver if nobody else is
   * observing this element.
   */
  _unobserveElement(element) {
    if (this._observedElements.has(element)) {
      this._observedElements.get(element).count--;
      if (!this._observedElements.get(element).count) {
        this._cleanupObserver(element);
      }
    }
  }
  /** Clean up the underlying MutationObserver for the specified element. */
  _cleanupObserver(element) {
    if (this._observedElements.has(element)) {
      const {
        observer,
        stream
      } = this._observedElements.get(element);
      if (observer) {
        observer.disconnect();
      }
      stream.complete();
      this._observedElements.delete(element);
    }
  }
  static \u0275fac = function ContentObserver_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _ContentObserver)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({
    token: _ContentObserver,
    factory: _ContentObserver.\u0275fac,
    providedIn: "root"
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ContentObserver, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], () => [], null);
})();
var CdkObserveContent = class _CdkObserveContent {
  _contentObserver = inject(ContentObserver);
  _elementRef = inject(ElementRef);
  /** Event emitted for each change in the element's content. */
  event = new EventEmitter();
  /**
   * Whether observing content is disabled. This option can be used
   * to disconnect the underlying MutationObserver until it is needed.
   */
  get disabled() {
    return this._disabled;
  }
  set disabled(value) {
    this._disabled = value;
    this._disabled ? this._unsubscribe() : this._subscribe();
  }
  _disabled = false;
  /** Debounce interval for emitting the changes. */
  get debounce() {
    return this._debounce;
  }
  set debounce(value) {
    this._debounce = coerceNumberProperty(value);
    this._subscribe();
  }
  _debounce;
  _currentSubscription = null;
  constructor() {
  }
  ngAfterContentInit() {
    if (!this._currentSubscription && !this.disabled) {
      this._subscribe();
    }
  }
  ngOnDestroy() {
    this._unsubscribe();
  }
  _subscribe() {
    this._unsubscribe();
    const stream = this._contentObserver.observe(this._elementRef);
    this._currentSubscription = (this.debounce ? stream.pipe(debounceTime(this.debounce)) : stream).subscribe(this.event);
  }
  _unsubscribe() {
    this._currentSubscription?.unsubscribe();
  }
  static \u0275fac = function CdkObserveContent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _CdkObserveContent)();
  };
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
    type: _CdkObserveContent,
    selectors: [["", "cdkObserveContent", ""]],
    inputs: {
      disabled: [2, "cdkObserveContentDisabled", "disabled", booleanAttribute],
      debounce: "debounce"
    },
    outputs: {
      event: "cdkObserveContent"
    },
    exportAs: ["cdkObserveContent"]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(CdkObserveContent, [{
    type: Directive,
    args: [{
      selector: "[cdkObserveContent]",
      exportAs: "cdkObserveContent"
    }]
  }], () => [], {
    event: [{
      type: Output,
      args: ["cdkObserveContent"]
    }],
    disabled: [{
      type: Input,
      args: [{
        alias: "cdkObserveContentDisabled",
        transform: booleanAttribute
      }]
    }],
    debounce: [{
      type: Input
    }]
  });
})();
var ObserversModule = class _ObserversModule {
  static \u0275fac = function ObserversModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _ObserversModule)();
  };
  static \u0275mod = /* @__PURE__ */ \u0275\u0275defineNgModule({
    type: _ObserversModule
  });
  static \u0275inj = /* @__PURE__ */ \u0275\u0275defineInjector({
    providers: [MutationObserverFactory]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ObserversModule, [{
    type: NgModule,
    args: [{
      imports: [CdkObserveContent],
      exports: [CdkObserveContent],
      providers: [MutationObserverFactory]
    }]
  }], null, null);
})();

// node_modules/@angular/cdk/fesm2022/a11y-module-BYox5gpI.mjs
var InteractivityChecker = class _InteractivityChecker {
  _platform = inject(Platform);
  constructor() {
  }
  /**
   * Gets whether an element is disabled.
   *
   * @param element Element to be checked.
   * @returns Whether the element is disabled.
   */
  isDisabled(element) {
    return element.hasAttribute("disabled");
  }
  /**
   * Gets whether an element is visible for the purposes of interactivity.
   *
   * This will capture states like `display: none` and `visibility: hidden`, but not things like
   * being clipped by an `overflow: hidden` parent or being outside the viewport.
   *
   * @returns Whether the element is visible.
   */
  isVisible(element) {
    return hasGeometry(element) && getComputedStyle(element).visibility === "visible";
  }
  /**
   * Gets whether an element can be reached via Tab key.
   * Assumes that the element has already been checked with isFocusable.
   *
   * @param element Element to be checked.
   * @returns Whether the element is tabbable.
   */
  isTabbable(element) {
    if (!this._platform.isBrowser) {
      return false;
    }
    const frameElement = getFrameElement(getWindow(element));
    if (frameElement) {
      if (getTabIndexValue(frameElement) === -1) {
        return false;
      }
      if (!this.isVisible(frameElement)) {
        return false;
      }
    }
    let nodeName = element.nodeName.toLowerCase();
    let tabIndexValue = getTabIndexValue(element);
    if (element.hasAttribute("contenteditable")) {
      return tabIndexValue !== -1;
    }
    if (nodeName === "iframe" || nodeName === "object") {
      return false;
    }
    if (this._platform.WEBKIT && this._platform.IOS && !isPotentiallyTabbableIOS(element)) {
      return false;
    }
    if (nodeName === "audio") {
      if (!element.hasAttribute("controls")) {
        return false;
      }
      return tabIndexValue !== -1;
    }
    if (nodeName === "video") {
      if (tabIndexValue === -1) {
        return false;
      }
      if (tabIndexValue !== null) {
        return true;
      }
      return this._platform.FIREFOX || element.hasAttribute("controls");
    }
    return element.tabIndex >= 0;
  }
  /**
   * Gets whether an element can be focused by the user.
   *
   * @param element Element to be checked.
   * @param config The config object with options to customize this method's behavior
   * @returns Whether the element is focusable.
   */
  isFocusable(element, config) {
    return isPotentiallyFocusable(element) && !this.isDisabled(element) && (config?.ignoreVisibility || this.isVisible(element));
  }
  static \u0275fac = function InteractivityChecker_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _InteractivityChecker)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({
    token: _InteractivityChecker,
    factory: _InteractivityChecker.\u0275fac,
    providedIn: "root"
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(InteractivityChecker, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], () => [], null);
})();
function getFrameElement(window2) {
  try {
    return window2.frameElement;
  } catch {
    return null;
  }
}
function hasGeometry(element) {
  return !!(element.offsetWidth || element.offsetHeight || typeof element.getClientRects === "function" && element.getClientRects().length);
}
function isNativeFormElement(element) {
  let nodeName = element.nodeName.toLowerCase();
  return nodeName === "input" || nodeName === "select" || nodeName === "button" || nodeName === "textarea";
}
function isHiddenInput(element) {
  return isInputElement(element) && element.type == "hidden";
}
function isAnchorWithHref(element) {
  return isAnchorElement(element) && element.hasAttribute("href");
}
function isInputElement(element) {
  return element.nodeName.toLowerCase() == "input";
}
function isAnchorElement(element) {
  return element.nodeName.toLowerCase() == "a";
}
function hasValidTabIndex(element) {
  if (!element.hasAttribute("tabindex") || element.tabIndex === void 0) {
    return false;
  }
  let tabIndex = element.getAttribute("tabindex");
  return !!(tabIndex && !isNaN(parseInt(tabIndex, 10)));
}
function getTabIndexValue(element) {
  if (!hasValidTabIndex(element)) {
    return null;
  }
  const tabIndex = parseInt(element.getAttribute("tabindex") || "", 10);
  return isNaN(tabIndex) ? -1 : tabIndex;
}
function isPotentiallyTabbableIOS(element) {
  let nodeName = element.nodeName.toLowerCase();
  let inputType = nodeName === "input" && element.type;
  return inputType === "text" || inputType === "password" || nodeName === "select" || nodeName === "textarea";
}
function isPotentiallyFocusable(element) {
  if (isHiddenInput(element)) {
    return false;
  }
  return isNativeFormElement(element) || isAnchorWithHref(element) || element.hasAttribute("contenteditable") || hasValidTabIndex(element);
}
function getWindow(node) {
  return node.ownerDocument && node.ownerDocument.defaultView || window;
}
var FocusTrap = class {
  _element;
  _checker;
  _ngZone;
  _document;
  _injector;
  _startAnchor;
  _endAnchor;
  _hasAttached = false;
  // Event listeners for the anchors. Need to be regular functions so that we can unbind them later.
  startAnchorListener = () => this.focusLastTabbableElement();
  endAnchorListener = () => this.focusFirstTabbableElement();
  /** Whether the focus trap is active. */
  get enabled() {
    return this._enabled;
  }
  set enabled(value) {
    this._enabled = value;
    if (this._startAnchor && this._endAnchor) {
      this._toggleAnchorTabIndex(value, this._startAnchor);
      this._toggleAnchorTabIndex(value, this._endAnchor);
    }
  }
  _enabled = true;
  constructor(_element, _checker, _ngZone, _document, deferAnchors = false, _injector) {
    this._element = _element;
    this._checker = _checker;
    this._ngZone = _ngZone;
    this._document = _document;
    this._injector = _injector;
    if (!deferAnchors) {
      this.attachAnchors();
    }
  }
  /** Destroys the focus trap by cleaning up the anchors. */
  destroy() {
    const startAnchor = this._startAnchor;
    const endAnchor = this._endAnchor;
    if (startAnchor) {
      startAnchor.removeEventListener("focus", this.startAnchorListener);
      startAnchor.remove();
    }
    if (endAnchor) {
      endAnchor.removeEventListener("focus", this.endAnchorListener);
      endAnchor.remove();
    }
    this._startAnchor = this._endAnchor = null;
    this._hasAttached = false;
  }
  /**
   * Inserts the anchors into the DOM. This is usually done automatically
   * in the constructor, but can be deferred for cases like directives with `*ngIf`.
   * @returns Whether the focus trap managed to attach successfully. This may not be the case
   * if the target element isn't currently in the DOM.
   */
  attachAnchors() {
    if (this._hasAttached) {
      return true;
    }
    this._ngZone.runOutsideAngular(() => {
      if (!this._startAnchor) {
        this._startAnchor = this._createAnchor();
        this._startAnchor.addEventListener("focus", this.startAnchorListener);
      }
      if (!this._endAnchor) {
        this._endAnchor = this._createAnchor();
        this._endAnchor.addEventListener("focus", this.endAnchorListener);
      }
    });
    if (this._element.parentNode) {
      this._element.parentNode.insertBefore(this._startAnchor, this._element);
      this._element.parentNode.insertBefore(this._endAnchor, this._element.nextSibling);
      this._hasAttached = true;
    }
    return this._hasAttached;
  }
  /**
   * Waits for the zone to stabilize, then focuses the first tabbable element.
   * @returns Returns a promise that resolves with a boolean, depending
   * on whether focus was moved successfully.
   */
  focusInitialElementWhenReady(options) {
    return new Promise((resolve) => {
      this._executeOnStable(() => resolve(this.focusInitialElement(options)));
    });
  }
  /**
   * Waits for the zone to stabilize, then focuses
   * the first tabbable element within the focus trap region.
   * @returns Returns a promise that resolves with a boolean, depending
   * on whether focus was moved successfully.
   */
  focusFirstTabbableElementWhenReady(options) {
    return new Promise((resolve) => {
      this._executeOnStable(() => resolve(this.focusFirstTabbableElement(options)));
    });
  }
  /**
   * Waits for the zone to stabilize, then focuses
   * the last tabbable element within the focus trap region.
   * @returns Returns a promise that resolves with a boolean, depending
   * on whether focus was moved successfully.
   */
  focusLastTabbableElementWhenReady(options) {
    return new Promise((resolve) => {
      this._executeOnStable(() => resolve(this.focusLastTabbableElement(options)));
    });
  }
  /**
   * Get the specified boundary element of the trapped region.
   * @param bound The boundary to get (start or end of trapped region).
   * @returns The boundary element.
   */
  _getRegionBoundary(bound) {
    const markers = this._element.querySelectorAll(`[cdk-focus-region-${bound}], [cdkFocusRegion${bound}], [cdk-focus-${bound}]`);
    if (typeof ngDevMode === "undefined" || ngDevMode) {
      for (let i = 0; i < markers.length; i++) {
        if (markers[i].hasAttribute(`cdk-focus-${bound}`)) {
          console.warn(`Found use of deprecated attribute 'cdk-focus-${bound}', use 'cdkFocusRegion${bound}' instead. The deprecated attribute will be removed in 8.0.0.`, markers[i]);
        } else if (markers[i].hasAttribute(`cdk-focus-region-${bound}`)) {
          console.warn(`Found use of deprecated attribute 'cdk-focus-region-${bound}', use 'cdkFocusRegion${bound}' instead. The deprecated attribute will be removed in 8.0.0.`, markers[i]);
        }
      }
    }
    if (bound == "start") {
      return markers.length ? markers[0] : this._getFirstTabbableElement(this._element);
    }
    return markers.length ? markers[markers.length - 1] : this._getLastTabbableElement(this._element);
  }
  /**
   * Focuses the element that should be focused when the focus trap is initialized.
   * @returns Whether focus was moved successfully.
   */
  focusInitialElement(options) {
    const redirectToElement = this._element.querySelector(`[cdk-focus-initial], [cdkFocusInitial]`);
    if (redirectToElement) {
      if ((typeof ngDevMode === "undefined" || ngDevMode) && redirectToElement.hasAttribute(`cdk-focus-initial`)) {
        console.warn(`Found use of deprecated attribute 'cdk-focus-initial', use 'cdkFocusInitial' instead. The deprecated attribute will be removed in 8.0.0`, redirectToElement);
      }
      if ((typeof ngDevMode === "undefined" || ngDevMode) && !this._checker.isFocusable(redirectToElement)) {
        console.warn(`Element matching '[cdkFocusInitial]' is not focusable.`, redirectToElement);
      }
      if (!this._checker.isFocusable(redirectToElement)) {
        const focusableChild = this._getFirstTabbableElement(redirectToElement);
        focusableChild?.focus(options);
        return !!focusableChild;
      }
      redirectToElement.focus(options);
      return true;
    }
    return this.focusFirstTabbableElement(options);
  }
  /**
   * Focuses the first tabbable element within the focus trap region.
   * @returns Whether focus was moved successfully.
   */
  focusFirstTabbableElement(options) {
    const redirectToElement = this._getRegionBoundary("start");
    if (redirectToElement) {
      redirectToElement.focus(options);
    }
    return !!redirectToElement;
  }
  /**
   * Focuses the last tabbable element within the focus trap region.
   * @returns Whether focus was moved successfully.
   */
  focusLastTabbableElement(options) {
    const redirectToElement = this._getRegionBoundary("end");
    if (redirectToElement) {
      redirectToElement.focus(options);
    }
    return !!redirectToElement;
  }
  /**
   * Checks whether the focus trap has successfully been attached.
   */
  hasAttached() {
    return this._hasAttached;
  }
  /** Get the first tabbable element from a DOM subtree (inclusive). */
  _getFirstTabbableElement(root) {
    if (this._checker.isFocusable(root) && this._checker.isTabbable(root)) {
      return root;
    }
    const children = root.children;
    for (let i = 0; i < children.length; i++) {
      const tabbableChild = children[i].nodeType === this._document.ELEMENT_NODE ? this._getFirstTabbableElement(children[i]) : null;
      if (tabbableChild) {
        return tabbableChild;
      }
    }
    return null;
  }
  /** Get the last tabbable element from a DOM subtree (inclusive). */
  _getLastTabbableElement(root) {
    if (this._checker.isFocusable(root) && this._checker.isTabbable(root)) {
      return root;
    }
    const children = root.children;
    for (let i = children.length - 1; i >= 0; i--) {
      const tabbableChild = children[i].nodeType === this._document.ELEMENT_NODE ? this._getLastTabbableElement(children[i]) : null;
      if (tabbableChild) {
        return tabbableChild;
      }
    }
    return null;
  }
  /** Creates an anchor element. */
  _createAnchor() {
    const anchor = this._document.createElement("div");
    this._toggleAnchorTabIndex(this._enabled, anchor);
    anchor.classList.add("cdk-visually-hidden");
    anchor.classList.add("cdk-focus-trap-anchor");
    anchor.setAttribute("aria-hidden", "true");
    return anchor;
  }
  /**
   * Toggles the `tabindex` of an anchor, based on the enabled state of the focus trap.
   * @param isEnabled Whether the focus trap is enabled.
   * @param anchor Anchor on which to toggle the tabindex.
   */
  _toggleAnchorTabIndex(isEnabled, anchor) {
    isEnabled ? anchor.setAttribute("tabindex", "0") : anchor.removeAttribute("tabindex");
  }
  /**
   * Toggles the`tabindex` of both anchors to either trap Tab focus or allow it to escape.
   * @param enabled: Whether the anchors should trap Tab.
   */
  toggleAnchors(enabled) {
    if (this._startAnchor && this._endAnchor) {
      this._toggleAnchorTabIndex(enabled, this._startAnchor);
      this._toggleAnchorTabIndex(enabled, this._endAnchor);
    }
  }
  /** Executes a function when the zone is stable. */
  _executeOnStable(fn) {
    if (this._injector) {
      afterNextRender(fn, {
        injector: this._injector
      });
    } else {
      setTimeout(fn);
    }
  }
};
var FocusTrapFactory = class _FocusTrapFactory {
  _checker = inject(InteractivityChecker);
  _ngZone = inject(NgZone);
  _document = inject(DOCUMENT);
  _injector = inject(Injector);
  constructor() {
    inject(_CdkPrivateStyleLoader).load(_VisuallyHiddenLoader);
  }
  /**
   * Creates a focus-trapped region around the given element.
   * @param element The element around which focus will be trapped.
   * @param deferCaptureElements Defers the creation of focus-capturing elements to be done
   *     manually by the user.
   * @returns The created focus trap instance.
   */
  create(element, deferCaptureElements = false) {
    return new FocusTrap(element, this._checker, this._ngZone, this._document, deferCaptureElements, this._injector);
  }
  static \u0275fac = function FocusTrapFactory_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _FocusTrapFactory)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({
    token: _FocusTrapFactory,
    factory: _FocusTrapFactory.\u0275fac,
    providedIn: "root"
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(FocusTrapFactory, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], () => [], null);
})();
var CdkTrapFocus = class _CdkTrapFocus {
  _elementRef = inject(ElementRef);
  _focusTrapFactory = inject(FocusTrapFactory);
  /** Underlying FocusTrap instance. */
  focusTrap;
  /** Previously focused element to restore focus to upon destroy when using autoCapture. */
  _previouslyFocusedElement = null;
  /** Whether the focus trap is active. */
  get enabled() {
    return this.focusTrap?.enabled || false;
  }
  set enabled(value) {
    if (this.focusTrap) {
      this.focusTrap.enabled = value;
    }
  }
  /**
   * Whether the directive should automatically move focus into the trapped region upon
   * initialization and return focus to the previous activeElement upon destruction.
   */
  autoCapture;
  constructor() {
    const platform = inject(Platform);
    if (platform.isBrowser) {
      this.focusTrap = this._focusTrapFactory.create(this._elementRef.nativeElement, true);
    }
  }
  ngOnDestroy() {
    this.focusTrap?.destroy();
    if (this._previouslyFocusedElement) {
      this._previouslyFocusedElement.focus();
      this._previouslyFocusedElement = null;
    }
  }
  ngAfterContentInit() {
    this.focusTrap?.attachAnchors();
    if (this.autoCapture) {
      this._captureFocus();
    }
  }
  ngDoCheck() {
    if (this.focusTrap && !this.focusTrap.hasAttached()) {
      this.focusTrap.attachAnchors();
    }
  }
  ngOnChanges(changes) {
    const autoCaptureChange = changes["autoCapture"];
    if (autoCaptureChange && !autoCaptureChange.firstChange && this.autoCapture && this.focusTrap?.hasAttached()) {
      this._captureFocus();
    }
  }
  _captureFocus() {
    this._previouslyFocusedElement = _getFocusedElementPierceShadowDom();
    this.focusTrap?.focusInitialElementWhenReady();
  }
  static \u0275fac = function CdkTrapFocus_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _CdkTrapFocus)();
  };
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
    type: _CdkTrapFocus,
    selectors: [["", "cdkTrapFocus", ""]],
    inputs: {
      enabled: [2, "cdkTrapFocus", "enabled", booleanAttribute],
      autoCapture: [2, "cdkTrapFocusAutoCapture", "autoCapture", booleanAttribute]
    },
    exportAs: ["cdkTrapFocus"],
    features: [\u0275\u0275NgOnChangesFeature]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(CdkTrapFocus, [{
    type: Directive,
    args: [{
      selector: "[cdkTrapFocus]",
      exportAs: "cdkTrapFocus"
    }]
  }], () => [], {
    enabled: [{
      type: Input,
      args: [{
        alias: "cdkTrapFocus",
        transform: booleanAttribute
      }]
    }],
    autoCapture: [{
      type: Input,
      args: [{
        alias: "cdkTrapFocusAutoCapture",
        transform: booleanAttribute
      }]
    }]
  });
})();
var LIVE_ANNOUNCER_ELEMENT_TOKEN = new InjectionToken("liveAnnouncerElement", {
  providedIn: "root",
  factory: LIVE_ANNOUNCER_ELEMENT_TOKEN_FACTORY
});
function LIVE_ANNOUNCER_ELEMENT_TOKEN_FACTORY() {
  return null;
}
var LIVE_ANNOUNCER_DEFAULT_OPTIONS = new InjectionToken("LIVE_ANNOUNCER_DEFAULT_OPTIONS");
var uniqueIds = 0;
var LiveAnnouncer = class _LiveAnnouncer {
  _ngZone = inject(NgZone);
  _defaultOptions = inject(LIVE_ANNOUNCER_DEFAULT_OPTIONS, {
    optional: true
  });
  _liveElement;
  _document = inject(DOCUMENT);
  _previousTimeout;
  _currentPromise;
  _currentResolve;
  constructor() {
    const elementToken = inject(LIVE_ANNOUNCER_ELEMENT_TOKEN, {
      optional: true
    });
    this._liveElement = elementToken || this._createLiveElement();
  }
  announce(message, ...args) {
    const defaultOptions = this._defaultOptions;
    let politeness;
    let duration;
    if (args.length === 1 && typeof args[0] === "number") {
      duration = args[0];
    } else {
      [politeness, duration] = args;
    }
    this.clear();
    clearTimeout(this._previousTimeout);
    if (!politeness) {
      politeness = defaultOptions && defaultOptions.politeness ? defaultOptions.politeness : "polite";
    }
    if (duration == null && defaultOptions) {
      duration = defaultOptions.duration;
    }
    this._liveElement.setAttribute("aria-live", politeness);
    if (this._liveElement.id) {
      this._exposeAnnouncerToModals(this._liveElement.id);
    }
    return this._ngZone.runOutsideAngular(() => {
      if (!this._currentPromise) {
        this._currentPromise = new Promise((resolve) => this._currentResolve = resolve);
      }
      clearTimeout(this._previousTimeout);
      this._previousTimeout = setTimeout(() => {
        this._liveElement.textContent = message;
        if (typeof duration === "number") {
          this._previousTimeout = setTimeout(() => this.clear(), duration);
        }
        this._currentResolve?.();
        this._currentPromise = this._currentResolve = void 0;
      }, 100);
      return this._currentPromise;
    });
  }
  /**
   * Clears the current text from the announcer element. Can be used to prevent
   * screen readers from reading the text out again while the user is going
   * through the page landmarks.
   */
  clear() {
    if (this._liveElement) {
      this._liveElement.textContent = "";
    }
  }
  ngOnDestroy() {
    clearTimeout(this._previousTimeout);
    this._liveElement?.remove();
    this._liveElement = null;
    this._currentResolve?.();
    this._currentPromise = this._currentResolve = void 0;
  }
  _createLiveElement() {
    const elementClass = "cdk-live-announcer-element";
    const previousElements = this._document.getElementsByClassName(elementClass);
    const liveEl = this._document.createElement("div");
    for (let i = 0; i < previousElements.length; i++) {
      previousElements[i].remove();
    }
    liveEl.classList.add(elementClass);
    liveEl.classList.add("cdk-visually-hidden");
    liveEl.setAttribute("aria-atomic", "true");
    liveEl.setAttribute("aria-live", "polite");
    liveEl.id = `cdk-live-announcer-${uniqueIds++}`;
    this._document.body.appendChild(liveEl);
    return liveEl;
  }
  /**
   * Some browsers won't expose the accessibility node of the live announcer element if there is an
   * `aria-modal` and the live announcer is outside of it. This method works around the issue by
   * pointing the `aria-owns` of all modals to the live announcer element.
   */
  _exposeAnnouncerToModals(id) {
    const modals = this._document.querySelectorAll('body > .cdk-overlay-container [aria-modal="true"]');
    for (let i = 0; i < modals.length; i++) {
      const modal = modals[i];
      const ariaOwns = modal.getAttribute("aria-owns");
      if (!ariaOwns) {
        modal.setAttribute("aria-owns", id);
      } else if (ariaOwns.indexOf(id) === -1) {
        modal.setAttribute("aria-owns", ariaOwns + " " + id);
      }
    }
  }
  static \u0275fac = function LiveAnnouncer_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _LiveAnnouncer)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({
    token: _LiveAnnouncer,
    factory: _LiveAnnouncer.\u0275fac,
    providedIn: "root"
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(LiveAnnouncer, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], () => [], null);
})();
var CdkAriaLive = class _CdkAriaLive {
  _elementRef = inject(ElementRef);
  _liveAnnouncer = inject(LiveAnnouncer);
  _contentObserver = inject(ContentObserver);
  _ngZone = inject(NgZone);
  /** The aria-live politeness level to use when announcing messages. */
  get politeness() {
    return this._politeness;
  }
  set politeness(value) {
    this._politeness = value === "off" || value === "assertive" ? value : "polite";
    if (this._politeness === "off") {
      if (this._subscription) {
        this._subscription.unsubscribe();
        this._subscription = null;
      }
    } else if (!this._subscription) {
      this._subscription = this._ngZone.runOutsideAngular(() => {
        return this._contentObserver.observe(this._elementRef).subscribe(() => {
          const elementText = this._elementRef.nativeElement.textContent;
          if (elementText !== this._previousAnnouncedText) {
            this._liveAnnouncer.announce(elementText, this._politeness, this.duration);
            this._previousAnnouncedText = elementText;
          }
        });
      });
    }
  }
  _politeness = "polite";
  /** Time in milliseconds after which to clear out the announcer element. */
  duration;
  _previousAnnouncedText;
  _subscription;
  constructor() {
    inject(_CdkPrivateStyleLoader).load(_VisuallyHiddenLoader);
  }
  ngOnDestroy() {
    if (this._subscription) {
      this._subscription.unsubscribe();
    }
  }
  static \u0275fac = function CdkAriaLive_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _CdkAriaLive)();
  };
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
    type: _CdkAriaLive,
    selectors: [["", "cdkAriaLive", ""]],
    inputs: {
      politeness: [0, "cdkAriaLive", "politeness"],
      duration: [0, "cdkAriaLiveDuration", "duration"]
    },
    exportAs: ["cdkAriaLive"]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(CdkAriaLive, [{
    type: Directive,
    args: [{
      selector: "[cdkAriaLive]",
      exportAs: "cdkAriaLive"
    }]
  }], () => [], {
    politeness: [{
      type: Input,
      args: ["cdkAriaLive"]
    }],
    duration: [{
      type: Input,
      args: ["cdkAriaLiveDuration"]
    }]
  });
})();
var HighContrastMode;
(function(HighContrastMode2) {
  HighContrastMode2[HighContrastMode2["NONE"] = 0] = "NONE";
  HighContrastMode2[HighContrastMode2["BLACK_ON_WHITE"] = 1] = "BLACK_ON_WHITE";
  HighContrastMode2[HighContrastMode2["WHITE_ON_BLACK"] = 2] = "WHITE_ON_BLACK";
})(HighContrastMode || (HighContrastMode = {}));
var BLACK_ON_WHITE_CSS_CLASS = "cdk-high-contrast-black-on-white";
var WHITE_ON_BLACK_CSS_CLASS = "cdk-high-contrast-white-on-black";
var HIGH_CONTRAST_MODE_ACTIVE_CSS_CLASS = "cdk-high-contrast-active";
var HighContrastModeDetector = class _HighContrastModeDetector {
  _platform = inject(Platform);
  /**
   * Figuring out the high contrast mode and adding the body classes can cause
   * some expensive layouts. This flag is used to ensure that we only do it once.
   */
  _hasCheckedHighContrastMode;
  _document = inject(DOCUMENT);
  _breakpointSubscription;
  constructor() {
    this._breakpointSubscription = inject(BreakpointObserver).observe("(forced-colors: active)").subscribe(() => {
      if (this._hasCheckedHighContrastMode) {
        this._hasCheckedHighContrastMode = false;
        this._applyBodyHighContrastModeCssClasses();
      }
    });
  }
  /** Gets the current high-contrast-mode for the page. */
  getHighContrastMode() {
    if (!this._platform.isBrowser) {
      return HighContrastMode.NONE;
    }
    const testElement = this._document.createElement("div");
    testElement.style.backgroundColor = "rgb(1,2,3)";
    testElement.style.position = "absolute";
    this._document.body.appendChild(testElement);
    const documentWindow = this._document.defaultView || window;
    const computedStyle = documentWindow && documentWindow.getComputedStyle ? documentWindow.getComputedStyle(testElement) : null;
    const computedColor = (computedStyle && computedStyle.backgroundColor || "").replace(/ /g, "");
    testElement.remove();
    switch (computedColor) {
      // Pre Windows 11 dark theme.
      case "rgb(0,0,0)":
      // Windows 11 dark themes.
      case "rgb(45,50,54)":
      case "rgb(32,32,32)":
        return HighContrastMode.WHITE_ON_BLACK;
      // Pre Windows 11 light theme.
      case "rgb(255,255,255)":
      // Windows 11 light theme.
      case "rgb(255,250,239)":
        return HighContrastMode.BLACK_ON_WHITE;
    }
    return HighContrastMode.NONE;
  }
  ngOnDestroy() {
    this._breakpointSubscription.unsubscribe();
  }
  /** Applies CSS classes indicating high-contrast mode to document body (browser-only). */
  _applyBodyHighContrastModeCssClasses() {
    if (!this._hasCheckedHighContrastMode && this._platform.isBrowser && this._document.body) {
      const bodyClasses = this._document.body.classList;
      bodyClasses.remove(HIGH_CONTRAST_MODE_ACTIVE_CSS_CLASS, BLACK_ON_WHITE_CSS_CLASS, WHITE_ON_BLACK_CSS_CLASS);
      this._hasCheckedHighContrastMode = true;
      const mode = this.getHighContrastMode();
      if (mode === HighContrastMode.BLACK_ON_WHITE) {
        bodyClasses.add(HIGH_CONTRAST_MODE_ACTIVE_CSS_CLASS, BLACK_ON_WHITE_CSS_CLASS);
      } else if (mode === HighContrastMode.WHITE_ON_BLACK) {
        bodyClasses.add(HIGH_CONTRAST_MODE_ACTIVE_CSS_CLASS, WHITE_ON_BLACK_CSS_CLASS);
      }
    }
  }
  static \u0275fac = function HighContrastModeDetector_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _HighContrastModeDetector)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({
    token: _HighContrastModeDetector,
    factory: _HighContrastModeDetector.\u0275fac,
    providedIn: "root"
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HighContrastModeDetector, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], () => [], null);
})();
var A11yModule = class _A11yModule {
  constructor() {
    inject(HighContrastModeDetector)._applyBodyHighContrastModeCssClasses();
  }
  static \u0275fac = function A11yModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _A11yModule)();
  };
  static \u0275mod = /* @__PURE__ */ \u0275\u0275defineNgModule({
    type: _A11yModule
  });
  static \u0275inj = /* @__PURE__ */ \u0275\u0275defineInjector({
    imports: [ObserversModule]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(A11yModule, [{
    type: NgModule,
    args: [{
      imports: [ObserversModule, CdkAriaLive, CdkTrapFocus, CdkMonitorFocus],
      exports: [CdkAriaLive, CdkTrapFocus, CdkMonitorFocus]
    }]
  }], () => [], null);
})();

// node_modules/@angular/cdk/fesm2022/typeahead-9ZW4Dtsf.mjs
var DEFAULT_TYPEAHEAD_DEBOUNCE_INTERVAL_MS = 200;
var Typeahead = class {
  _letterKeyStream = new Subject();
  _items = [];
  _selectedItemIndex = -1;
  /** Buffer for the letters that the user has pressed */
  _pressedLetters = [];
  _skipPredicateFn;
  _selectedItem = new Subject();
  selectedItem = this._selectedItem;
  constructor(initialItems, config) {
    const typeAheadInterval = typeof config?.debounceInterval === "number" ? config.debounceInterval : DEFAULT_TYPEAHEAD_DEBOUNCE_INTERVAL_MS;
    if (config?.skipPredicate) {
      this._skipPredicateFn = config.skipPredicate;
    }
    if ((typeof ngDevMode === "undefined" || ngDevMode) && initialItems.length && initialItems.some((item) => typeof item.getLabel !== "function")) {
      throw new Error("KeyManager items in typeahead mode must implement the `getLabel` method.");
    }
    this.setItems(initialItems);
    this._setupKeyHandler(typeAheadInterval);
  }
  destroy() {
    this._pressedLetters = [];
    this._letterKeyStream.complete();
    this._selectedItem.complete();
  }
  setCurrentSelectedItemIndex(index) {
    this._selectedItemIndex = index;
  }
  setItems(items) {
    this._items = items;
  }
  handleKey(event) {
    const keyCode = event.keyCode;
    if (event.key && event.key.length === 1) {
      this._letterKeyStream.next(event.key.toLocaleUpperCase());
    } else if (keyCode >= A && keyCode <= Z || keyCode >= ZERO && keyCode <= NINE) {
      this._letterKeyStream.next(String.fromCharCode(keyCode));
    }
  }
  /** Gets whether the user is currently typing into the manager using the typeahead feature. */
  isTyping() {
    return this._pressedLetters.length > 0;
  }
  /** Resets the currently stored sequence of typed letters. */
  reset() {
    this._pressedLetters = [];
  }
  _setupKeyHandler(typeAheadInterval) {
    this._letterKeyStream.pipe(tap((letter) => this._pressedLetters.push(letter)), debounceTime(typeAheadInterval), filter(() => this._pressedLetters.length > 0), map(() => this._pressedLetters.join("").toLocaleUpperCase())).subscribe((inputString) => {
      for (let i = 1; i < this._items.length + 1; i++) {
        const index = (this._selectedItemIndex + i) % this._items.length;
        const item = this._items[index];
        if (!this._skipPredicateFn?.(item) && item.getLabel?.().toLocaleUpperCase().trim().indexOf(inputString) === 0) {
          this._selectedItem.next(item);
          break;
        }
      }
      this._pressedLetters = [];
    });
  }
};

// node_modules/@angular/cdk/fesm2022/list-key-manager-CyOIXo8P.mjs
var ListKeyManager = class {
  _items;
  _activeItemIndex = -1;
  _activeItem = signal(null);
  _wrap = false;
  _typeaheadSubscription = Subscription.EMPTY;
  _itemChangesSubscription;
  _vertical = true;
  _horizontal;
  _allowedModifierKeys = [];
  _homeAndEnd = false;
  _pageUpAndDown = {
    enabled: false,
    delta: 10
  };
  _effectRef;
  _typeahead;
  /**
   * Predicate function that can be used to check whether an item should be skipped
   * by the key manager. By default, disabled items are skipped.
   */
  _skipPredicateFn = (item) => item.disabled;
  constructor(_items, injector) {
    this._items = _items;
    if (_items instanceof QueryList) {
      this._itemChangesSubscription = _items.changes.subscribe((newItems) => this._itemsChanged(newItems.toArray()));
    } else if (isSignal(_items)) {
      if (!injector && (typeof ngDevMode === "undefined" || ngDevMode)) {
        throw new Error("ListKeyManager constructed with a signal must receive an injector");
      }
      this._effectRef = effect(() => this._itemsChanged(_items()), {
        injector
      });
    }
  }
  /**
   * Stream that emits any time the TAB key is pressed, so components can react
   * when focus is shifted off of the list.
   */
  tabOut = new Subject();
  /** Stream that emits whenever the active item of the list manager changes. */
  change = new Subject();
  /**
   * Sets the predicate function that determines which items should be skipped by the
   * list key manager.
   * @param predicate Function that determines whether the given item should be skipped.
   */
  skipPredicate(predicate) {
    this._skipPredicateFn = predicate;
    return this;
  }
  /**
   * Configures wrapping mode, which determines whether the active item will wrap to
   * the other end of list when there are no more items in the given direction.
   * @param shouldWrap Whether the list should wrap when reaching the end.
   */
  withWrap(shouldWrap = true) {
    this._wrap = shouldWrap;
    return this;
  }
  /**
   * Configures whether the key manager should be able to move the selection vertically.
   * @param enabled Whether vertical selection should be enabled.
   */
  withVerticalOrientation(enabled = true) {
    this._vertical = enabled;
    return this;
  }
  /**
   * Configures the key manager to move the selection horizontally.
   * Passing in `null` will disable horizontal movement.
   * @param direction Direction in which the selection can be moved.
   */
  withHorizontalOrientation(direction) {
    this._horizontal = direction;
    return this;
  }
  /**
   * Modifier keys which are allowed to be held down and whose default actions will be prevented
   * as the user is pressing the arrow keys. Defaults to not allowing any modifier keys.
   */
  withAllowedModifierKeys(keys) {
    this._allowedModifierKeys = keys;
    return this;
  }
  /**
   * Turns on typeahead mode which allows users to set the active item by typing.
   * @param debounceInterval Time to wait after the last keystroke before setting the active item.
   */
  withTypeAhead(debounceInterval = 200) {
    if (typeof ngDevMode === "undefined" || ngDevMode) {
      const items2 = this._getItemsArray();
      if (items2.length > 0 && items2.some((item) => typeof item.getLabel !== "function")) {
        throw Error("ListKeyManager items in typeahead mode must implement the `getLabel` method.");
      }
    }
    this._typeaheadSubscription.unsubscribe();
    const items = this._getItemsArray();
    this._typeahead = new Typeahead(items, {
      debounceInterval: typeof debounceInterval === "number" ? debounceInterval : void 0,
      skipPredicate: (item) => this._skipPredicateFn(item)
    });
    this._typeaheadSubscription = this._typeahead.selectedItem.subscribe((item) => {
      this.setActiveItem(item);
    });
    return this;
  }
  /** Cancels the current typeahead sequence. */
  cancelTypeahead() {
    this._typeahead?.reset();
    return this;
  }
  /**
   * Configures the key manager to activate the first and last items
   * respectively when the Home or End key is pressed.
   * @param enabled Whether pressing the Home or End key activates the first/last item.
   */
  withHomeAndEnd(enabled = true) {
    this._homeAndEnd = enabled;
    return this;
  }
  /**
   * Configures the key manager to activate every 10th, configured or first/last element in up/down direction
   * respectively when the Page-Up or Page-Down key is pressed.
   * @param enabled Whether pressing the Page-Up or Page-Down key activates the first/last item.
   * @param delta Whether pressing the Home or End key activates the first/last item.
   */
  withPageUpDown(enabled = true, delta = 10) {
    this._pageUpAndDown = {
      enabled,
      delta
    };
    return this;
  }
  setActiveItem(item) {
    const previousActiveItem = this._activeItem();
    this.updateActiveItem(item);
    if (this._activeItem() !== previousActiveItem) {
      this.change.next(this._activeItemIndex);
    }
  }
  /**
   * Sets the active item depending on the key event passed in.
   * @param event Keyboard event to be used for determining which element should be active.
   */
  onKeydown(event) {
    const keyCode = event.keyCode;
    const modifiers = ["altKey", "ctrlKey", "metaKey", "shiftKey"];
    const isModifierAllowed = modifiers.every((modifier) => {
      return !event[modifier] || this._allowedModifierKeys.indexOf(modifier) > -1;
    });
    switch (keyCode) {
      case TAB:
        this.tabOut.next();
        return;
      case DOWN_ARROW:
        if (this._vertical && isModifierAllowed) {
          this.setNextItemActive();
          break;
        } else {
          return;
        }
      case UP_ARROW:
        if (this._vertical && isModifierAllowed) {
          this.setPreviousItemActive();
          break;
        } else {
          return;
        }
      case RIGHT_ARROW:
        if (this._horizontal && isModifierAllowed) {
          this._horizontal === "rtl" ? this.setPreviousItemActive() : this.setNextItemActive();
          break;
        } else {
          return;
        }
      case LEFT_ARROW:
        if (this._horizontal && isModifierAllowed) {
          this._horizontal === "rtl" ? this.setNextItemActive() : this.setPreviousItemActive();
          break;
        } else {
          return;
        }
      case HOME:
        if (this._homeAndEnd && isModifierAllowed) {
          this.setFirstItemActive();
          break;
        } else {
          return;
        }
      case END:
        if (this._homeAndEnd && isModifierAllowed) {
          this.setLastItemActive();
          break;
        } else {
          return;
        }
      case PAGE_UP:
        if (this._pageUpAndDown.enabled && isModifierAllowed) {
          const targetIndex = this._activeItemIndex - this._pageUpAndDown.delta;
          this._setActiveItemByIndex(targetIndex > 0 ? targetIndex : 0, 1);
          break;
        } else {
          return;
        }
      case PAGE_DOWN:
        if (this._pageUpAndDown.enabled && isModifierAllowed) {
          const targetIndex = this._activeItemIndex + this._pageUpAndDown.delta;
          const itemsLength = this._getItemsArray().length;
          this._setActiveItemByIndex(targetIndex < itemsLength ? targetIndex : itemsLength - 1, -1);
          break;
        } else {
          return;
        }
      default:
        if (isModifierAllowed || hasModifierKey(event, "shiftKey")) {
          this._typeahead?.handleKey(event);
        }
        return;
    }
    this._typeahead?.reset();
    event.preventDefault();
  }
  /** Index of the currently active item. */
  get activeItemIndex() {
    return this._activeItemIndex;
  }
  /** The active item. */
  get activeItem() {
    return this._activeItem();
  }
  /** Gets whether the user is currently typing into the manager using the typeahead feature. */
  isTyping() {
    return !!this._typeahead && this._typeahead.isTyping();
  }
  /** Sets the active item to the first enabled item in the list. */
  setFirstItemActive() {
    this._setActiveItemByIndex(0, 1);
  }
  /** Sets the active item to the last enabled item in the list. */
  setLastItemActive() {
    this._setActiveItemByIndex(this._getItemsArray().length - 1, -1);
  }
  /** Sets the active item to the next enabled item in the list. */
  setNextItemActive() {
    this._activeItemIndex < 0 ? this.setFirstItemActive() : this._setActiveItemByDelta(1);
  }
  /** Sets the active item to a previous enabled item in the list. */
  setPreviousItemActive() {
    this._activeItemIndex < 0 && this._wrap ? this.setLastItemActive() : this._setActiveItemByDelta(-1);
  }
  updateActiveItem(item) {
    const itemArray = this._getItemsArray();
    const index = typeof item === "number" ? item : itemArray.indexOf(item);
    const activeItem = itemArray[index];
    this._activeItem.set(activeItem == null ? null : activeItem);
    this._activeItemIndex = index;
    this._typeahead?.setCurrentSelectedItemIndex(index);
  }
  /** Cleans up the key manager. */
  destroy() {
    this._typeaheadSubscription.unsubscribe();
    this._itemChangesSubscription?.unsubscribe();
    this._effectRef?.destroy();
    this._typeahead?.destroy();
    this.tabOut.complete();
    this.change.complete();
  }
  /**
   * This method sets the active item, given a list of items and the delta between the
   * currently active item and the new active item. It will calculate differently
   * depending on whether wrap mode is turned on.
   */
  _setActiveItemByDelta(delta) {
    this._wrap ? this._setActiveInWrapMode(delta) : this._setActiveInDefaultMode(delta);
  }
  /**
   * Sets the active item properly given "wrap" mode. In other words, it will continue to move
   * down the list until it finds an item that is not disabled, and it will wrap if it
   * encounters either end of the list.
   */
  _setActiveInWrapMode(delta) {
    const items = this._getItemsArray();
    for (let i = 1; i <= items.length; i++) {
      const index = (this._activeItemIndex + delta * i + items.length) % items.length;
      const item = items[index];
      if (!this._skipPredicateFn(item)) {
        this.setActiveItem(index);
        return;
      }
    }
  }
  /**
   * Sets the active item properly given the default mode. In other words, it will
   * continue to move down the list until it finds an item that is not disabled. If
   * it encounters either end of the list, it will stop and not wrap.
   */
  _setActiveInDefaultMode(delta) {
    this._setActiveItemByIndex(this._activeItemIndex + delta, delta);
  }
  /**
   * Sets the active item to the first enabled item starting at the index specified. If the
   * item is disabled, it will move in the fallbackDelta direction until it either
   * finds an enabled item or encounters the end of the list.
   */
  _setActiveItemByIndex(index, fallbackDelta) {
    const items = this._getItemsArray();
    if (!items[index]) {
      return;
    }
    while (this._skipPredicateFn(items[index])) {
      index += fallbackDelta;
      if (!items[index]) {
        return;
      }
    }
    this.setActiveItem(index);
  }
  /** Returns the items as an array. */
  _getItemsArray() {
    if (isSignal(this._items)) {
      return this._items();
    }
    return this._items instanceof QueryList ? this._items.toArray() : this._items;
  }
  /** Callback for when the items have changed. */
  _itemsChanged(newItems) {
    this._typeahead?.setItems(newItems);
    const activeItem = this._activeItem();
    if (activeItem) {
      const newIndex = newItems.indexOf(activeItem);
      if (newIndex > -1 && newIndex !== this._activeItemIndex) {
        this._activeItemIndex = newIndex;
        this._typeahead?.setCurrentSelectedItemIndex(newIndex);
      }
    }
  }
};

// node_modules/@angular/cdk/fesm2022/activedescendant-key-manager-DC3-fwQI.mjs
var ActiveDescendantKeyManager = class extends ListKeyManager {
  setActiveItem(index) {
    if (this.activeItem) {
      this.activeItem.setInactiveStyles();
    }
    super.setActiveItem(index);
    if (this.activeItem) {
      this.activeItem.setActiveStyles();
    }
  }
};

// node_modules/@angular/cdk/fesm2022/focus-key-manager-C1rAQJ5z.mjs
var FocusKeyManager = class extends ListKeyManager {
  _origin = "program";
  /**
   * Sets the focus origin that will be passed in to the items for any subsequent `focus` calls.
   * @param origin Focus origin to be used when focusing items.
   */
  setFocusOrigin(origin) {
    this._origin = origin;
    return this;
  }
  setActiveItem(item) {
    super.setActiveItem(item);
    if (this.activeItem) {
      this.activeItem.focus(this._origin);
    }
  }
};

// node_modules/@angular/cdk/fesm2022/a11y.mjs
var ID_DELIMITER = " ";
function addAriaReferencedId(el, attr, id) {
  const ids = getAriaReferenceIds(el, attr);
  id = id.trim();
  if (ids.some((existingId) => existingId.trim() === id)) {
    return;
  }
  ids.push(id);
  el.setAttribute(attr, ids.join(ID_DELIMITER));
}
function removeAriaReferencedId(el, attr, id) {
  const ids = getAriaReferenceIds(el, attr);
  id = id.trim();
  const filteredIds = ids.filter((val) => val !== id);
  if (filteredIds.length) {
    el.setAttribute(attr, filteredIds.join(ID_DELIMITER));
  } else {
    el.removeAttribute(attr);
  }
}
function getAriaReferenceIds(el, attr) {
  const attrValue = el.getAttribute(attr);
  return attrValue?.match(/\S+/g) ?? [];
}
var CDK_DESCRIBEDBY_ID_PREFIX = "cdk-describedby-message";
var CDK_DESCRIBEDBY_HOST_ATTRIBUTE = "cdk-describedby-host";
var nextId = 0;
var AriaDescriber = class _AriaDescriber {
  _platform = inject(Platform);
  _document = inject(DOCUMENT);
  /** Map of all registered message elements that have been placed into the document. */
  _messageRegistry = /* @__PURE__ */ new Map();
  /** Container for all registered messages. */
  _messagesContainer = null;
  /** Unique ID for the service. */
  _id = `${nextId++}`;
  constructor() {
    inject(_CdkPrivateStyleLoader).load(_VisuallyHiddenLoader);
    this._id = inject(APP_ID) + "-" + nextId++;
  }
  describe(hostElement, message, role) {
    if (!this._canBeDescribed(hostElement, message)) {
      return;
    }
    const key = getKey(message, role);
    if (typeof message !== "string") {
      setMessageId(message, this._id);
      this._messageRegistry.set(key, {
        messageElement: message,
        referenceCount: 0
      });
    } else if (!this._messageRegistry.has(key)) {
      this._createMessageElement(message, role);
    }
    if (!this._isElementDescribedByMessage(hostElement, key)) {
      this._addMessageReference(hostElement, key);
    }
  }
  removeDescription(hostElement, message, role) {
    if (!message || !this._isElementNode(hostElement)) {
      return;
    }
    const key = getKey(message, role);
    if (this._isElementDescribedByMessage(hostElement, key)) {
      this._removeMessageReference(hostElement, key);
    }
    if (typeof message === "string") {
      const registeredMessage = this._messageRegistry.get(key);
      if (registeredMessage && registeredMessage.referenceCount === 0) {
        this._deleteMessageElement(key);
      }
    }
    if (this._messagesContainer?.childNodes.length === 0) {
      this._messagesContainer.remove();
      this._messagesContainer = null;
    }
  }
  /** Unregisters all created message elements and removes the message container. */
  ngOnDestroy() {
    const describedElements = this._document.querySelectorAll(`[${CDK_DESCRIBEDBY_HOST_ATTRIBUTE}="${this._id}"]`);
    for (let i = 0; i < describedElements.length; i++) {
      this._removeCdkDescribedByReferenceIds(describedElements[i]);
      describedElements[i].removeAttribute(CDK_DESCRIBEDBY_HOST_ATTRIBUTE);
    }
    this._messagesContainer?.remove();
    this._messagesContainer = null;
    this._messageRegistry.clear();
  }
  /**
   * Creates a new element in the visually hidden message container element with the message
   * as its content and adds it to the message registry.
   */
  _createMessageElement(message, role) {
    const messageElement = this._document.createElement("div");
    setMessageId(messageElement, this._id);
    messageElement.textContent = message;
    if (role) {
      messageElement.setAttribute("role", role);
    }
    this._createMessagesContainer();
    this._messagesContainer.appendChild(messageElement);
    this._messageRegistry.set(getKey(message, role), {
      messageElement,
      referenceCount: 0
    });
  }
  /** Deletes the message element from the global messages container. */
  _deleteMessageElement(key) {
    this._messageRegistry.get(key)?.messageElement?.remove();
    this._messageRegistry.delete(key);
  }
  /** Creates the global container for all aria-describedby messages. */
  _createMessagesContainer() {
    if (this._messagesContainer) {
      return;
    }
    const containerClassName = "cdk-describedby-message-container";
    const serverContainers = this._document.querySelectorAll(`.${containerClassName}[platform="server"]`);
    for (let i = 0; i < serverContainers.length; i++) {
      serverContainers[i].remove();
    }
    const messagesContainer = this._document.createElement("div");
    messagesContainer.style.visibility = "hidden";
    messagesContainer.classList.add(containerClassName);
    messagesContainer.classList.add("cdk-visually-hidden");
    if (!this._platform.isBrowser) {
      messagesContainer.setAttribute("platform", "server");
    }
    this._document.body.appendChild(messagesContainer);
    this._messagesContainer = messagesContainer;
  }
  /** Removes all cdk-describedby messages that are hosted through the element. */
  _removeCdkDescribedByReferenceIds(element) {
    const originalReferenceIds = getAriaReferenceIds(element, "aria-describedby").filter((id) => id.indexOf(CDK_DESCRIBEDBY_ID_PREFIX) != 0);
    element.setAttribute("aria-describedby", originalReferenceIds.join(" "));
  }
  /**
   * Adds a message reference to the element using aria-describedby and increments the registered
   * message's reference count.
   */
  _addMessageReference(element, key) {
    const registeredMessage = this._messageRegistry.get(key);
    addAriaReferencedId(element, "aria-describedby", registeredMessage.messageElement.id);
    element.setAttribute(CDK_DESCRIBEDBY_HOST_ATTRIBUTE, this._id);
    registeredMessage.referenceCount++;
  }
  /**
   * Removes a message reference from the element using aria-describedby
   * and decrements the registered message's reference count.
   */
  _removeMessageReference(element, key) {
    const registeredMessage = this._messageRegistry.get(key);
    registeredMessage.referenceCount--;
    removeAriaReferencedId(element, "aria-describedby", registeredMessage.messageElement.id);
    element.removeAttribute(CDK_DESCRIBEDBY_HOST_ATTRIBUTE);
  }
  /** Returns true if the element has been described by the provided message ID. */
  _isElementDescribedByMessage(element, key) {
    const referenceIds = getAriaReferenceIds(element, "aria-describedby");
    const registeredMessage = this._messageRegistry.get(key);
    const messageId = registeredMessage && registeredMessage.messageElement.id;
    return !!messageId && referenceIds.indexOf(messageId) != -1;
  }
  /** Determines whether a message can be described on a particular element. */
  _canBeDescribed(element, message) {
    if (!this._isElementNode(element)) {
      return false;
    }
    if (message && typeof message === "object") {
      return true;
    }
    const trimmedMessage = message == null ? "" : `${message}`.trim();
    const ariaLabel = element.getAttribute("aria-label");
    return trimmedMessage ? !ariaLabel || ariaLabel.trim() !== trimmedMessage : false;
  }
  /** Checks whether a node is an Element node. */
  _isElementNode(element) {
    return element.nodeType === this._document.ELEMENT_NODE;
  }
  static \u0275fac = function AriaDescriber_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _AriaDescriber)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({
    token: _AriaDescriber,
    factory: _AriaDescriber.\u0275fac,
    providedIn: "root"
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(AriaDescriber, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], () => [], null);
})();
function getKey(message, role) {
  return typeof message === "string" ? `${role || ""}/${message}` : message;
}
function setMessageId(element, serviceId) {
  if (!element.id) {
    element.id = `${CDK_DESCRIBEDBY_ID_PREFIX}-${serviceId}-${nextId++}`;
  }
}
var ConfigurableFocusTrap = class extends FocusTrap {
  _focusTrapManager;
  _inertStrategy;
  /** Whether the FocusTrap is enabled. */
  get enabled() {
    return this._enabled;
  }
  set enabled(value) {
    this._enabled = value;
    if (this._enabled) {
      this._focusTrapManager.register(this);
    } else {
      this._focusTrapManager.deregister(this);
    }
  }
  constructor(_element, _checker, _ngZone, _document, _focusTrapManager, _inertStrategy, config, injector) {
    super(_element, _checker, _ngZone, _document, config.defer, injector);
    this._focusTrapManager = _focusTrapManager;
    this._inertStrategy = _inertStrategy;
    this._focusTrapManager.register(this);
  }
  /** Notifies the FocusTrapManager that this FocusTrap will be destroyed. */
  destroy() {
    this._focusTrapManager.deregister(this);
    super.destroy();
  }
  /** @docs-private Implemented as part of ManagedFocusTrap. */
  _enable() {
    this._inertStrategy.preventFocus(this);
    this.toggleAnchors(true);
  }
  /** @docs-private Implemented as part of ManagedFocusTrap. */
  _disable() {
    this._inertStrategy.allowFocus(this);
    this.toggleAnchors(false);
  }
};
var EventListenerFocusTrapInertStrategy = class {
  /** Focus event handler. */
  _listener = null;
  /** Adds a document event listener that keeps focus inside the FocusTrap. */
  preventFocus(focusTrap) {
    if (this._listener) {
      focusTrap._document.removeEventListener("focus", this._listener, true);
    }
    this._listener = (e) => this._trapFocus(focusTrap, e);
    focusTrap._ngZone.runOutsideAngular(() => {
      focusTrap._document.addEventListener("focus", this._listener, true);
    });
  }
  /** Removes the event listener added in preventFocus. */
  allowFocus(focusTrap) {
    if (!this._listener) {
      return;
    }
    focusTrap._document.removeEventListener("focus", this._listener, true);
    this._listener = null;
  }
  /**
   * Refocuses the first element in the FocusTrap if the focus event target was outside
   * the FocusTrap.
   *
   * This is an event listener callback. The event listener is added in runOutsideAngular,
   * so all this code runs outside Angular as well.
   */
  _trapFocus(focusTrap, event) {
    const target = event.target;
    const focusTrapRoot = focusTrap._element;
    if (target && !focusTrapRoot.contains(target) && !target.closest?.("div.cdk-overlay-pane")) {
      setTimeout(() => {
        if (focusTrap.enabled && !focusTrapRoot.contains(focusTrap._document.activeElement)) {
          focusTrap.focusFirstTabbableElement();
        }
      });
    }
  }
};
var FOCUS_TRAP_INERT_STRATEGY = new InjectionToken("FOCUS_TRAP_INERT_STRATEGY");
var FocusTrapManager = class _FocusTrapManager {
  // A stack of the FocusTraps on the page. Only the FocusTrap at the
  // top of the stack is active.
  _focusTrapStack = [];
  /**
   * Disables the FocusTrap at the top of the stack, and then pushes
   * the new FocusTrap onto the stack.
   */
  register(focusTrap) {
    this._focusTrapStack = this._focusTrapStack.filter((ft) => ft !== focusTrap);
    let stack = this._focusTrapStack;
    if (stack.length) {
      stack[stack.length - 1]._disable();
    }
    stack.push(focusTrap);
    focusTrap._enable();
  }
  /**
   * Removes the FocusTrap from the stack, and activates the
   * FocusTrap that is the new top of the stack.
   */
  deregister(focusTrap) {
    focusTrap._disable();
    const stack = this._focusTrapStack;
    const i = stack.indexOf(focusTrap);
    if (i !== -1) {
      stack.splice(i, 1);
      if (stack.length) {
        stack[stack.length - 1]._enable();
      }
    }
  }
  static \u0275fac = function FocusTrapManager_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _FocusTrapManager)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({
    token: _FocusTrapManager,
    factory: _FocusTrapManager.\u0275fac,
    providedIn: "root"
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(FocusTrapManager, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], null, null);
})();
var ConfigurableFocusTrapFactory = class _ConfigurableFocusTrapFactory {
  _checker = inject(InteractivityChecker);
  _ngZone = inject(NgZone);
  _focusTrapManager = inject(FocusTrapManager);
  _document = inject(DOCUMENT);
  _inertStrategy;
  _injector = inject(Injector);
  constructor() {
    const inertStrategy = inject(FOCUS_TRAP_INERT_STRATEGY, {
      optional: true
    });
    this._inertStrategy = inertStrategy || new EventListenerFocusTrapInertStrategy();
  }
  create(element, config = {
    defer: false
  }) {
    let configObject;
    if (typeof config === "boolean") {
      configObject = {
        defer: config
      };
    } else {
      configObject = config;
    }
    return new ConfigurableFocusTrap(element, this._checker, this._ngZone, this._document, this._focusTrapManager, this._inertStrategy, configObject, this._injector);
  }
  static \u0275fac = function ConfigurableFocusTrapFactory_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _ConfigurableFocusTrapFactory)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({
    token: _ConfigurableFocusTrapFactory,
    factory: _ConfigurableFocusTrapFactory.\u0275fac,
    providedIn: "root"
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ConfigurableFocusTrapFactory, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], () => [], null);
})();

// node_modules/@angular/material/fesm2022/common-module-WayjW0Pb.mjs
var MATERIAL_SANITY_CHECKS = new InjectionToken("mat-sanity-checks", {
  providedIn: "root",
  factory: () => true
});
var MatCommonModule = class _MatCommonModule {
  constructor() {
    inject(HighContrastModeDetector)._applyBodyHighContrastModeCssClasses();
  }
  static \u0275fac = function MatCommonModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _MatCommonModule)();
  };
  static \u0275mod = /* @__PURE__ */ \u0275\u0275defineNgModule({
    type: _MatCommonModule
  });
  static \u0275inj = /* @__PURE__ */ \u0275\u0275defineInjector({
    imports: [BidiModule, BidiModule]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MatCommonModule, [{
    type: NgModule,
    args: [{
      imports: [BidiModule],
      exports: [BidiModule]
    }]
  }], () => [], null);
})();

// node_modules/@angular/material/fesm2022/icon.mjs
var _c07 = ["*"];
var MAT_ICON_DEFAULT_OPTIONS = new InjectionToken("MAT_ICON_DEFAULT_OPTIONS");
var MAT_ICON_LOCATION = new InjectionToken("mat-icon-location", {
  providedIn: "root",
  factory: MAT_ICON_LOCATION_FACTORY
});
function MAT_ICON_LOCATION_FACTORY() {
  const _document = inject(DOCUMENT);
  const _location = _document ? _document.location : null;
  return {
    // Note that this needs to be a function, rather than a property, because Angular
    // will only resolve it once, but we want the current path on each call.
    getPathname: () => _location ? _location.pathname + _location.search : ""
  };
}
var funcIriAttributes = ["clip-path", "color-profile", "src", "cursor", "fill", "filter", "marker", "marker-start", "marker-mid", "marker-end", "mask", "stroke"];
var funcIriAttributeSelector = funcIriAttributes.map((attr) => `[${attr}]`).join(", ");
var funcIriPattern = /^url\(['"]?#(.*?)['"]?\)$/;
var MatIcon = class _MatIcon {
  _elementRef = inject(ElementRef);
  _iconRegistry = inject(MatIconRegistry);
  _location = inject(MAT_ICON_LOCATION);
  _errorHandler = inject(ErrorHandler);
  _defaultColor;
  /**
   * Theme color of the icon. This API is supported in M2 themes only, it
   * has no effect in M3 themes. For color customization in M3, see https://material.angular.io/components/icon/styling.
   *
   * For information on applying color variants in M3, see
   * https://material.angular.io/guide/material-2-theming#optional-add-backwards-compatibility-styles-for-color-variants
   */
  get color() {
    return this._color || this._defaultColor;
  }
  set color(value) {
    this._color = value;
  }
  _color;
  /**
   * Whether the icon should be inlined, automatically sizing the icon to match the font size of
   * the element the icon is contained in.
   */
  inline = false;
  /** Name of the icon in the SVG icon set. */
  get svgIcon() {
    return this._svgIcon;
  }
  set svgIcon(value) {
    if (value !== this._svgIcon) {
      if (value) {
        this._updateSvgIcon(value);
      } else if (this._svgIcon) {
        this._clearSvgElement();
      }
      this._svgIcon = value;
    }
  }
  _svgIcon;
  /** Font set that the icon is a part of. */
  get fontSet() {
    return this._fontSet;
  }
  set fontSet(value) {
    const newValue = this._cleanupFontValue(value);
    if (newValue !== this._fontSet) {
      this._fontSet = newValue;
      this._updateFontIconClasses();
    }
  }
  _fontSet;
  /** Name of an icon within a font set. */
  get fontIcon() {
    return this._fontIcon;
  }
  set fontIcon(value) {
    const newValue = this._cleanupFontValue(value);
    if (newValue !== this._fontIcon) {
      this._fontIcon = newValue;
      this._updateFontIconClasses();
    }
  }
  _fontIcon;
  _previousFontSetClass = [];
  _previousFontIconClass;
  _svgName;
  _svgNamespace;
  /** Keeps track of the current page path. */
  _previousPath;
  /** Keeps track of the elements and attributes that we've prefixed with the current path. */
  _elementsWithExternalReferences;
  /** Subscription to the current in-progress SVG icon request. */
  _currentIconFetch = Subscription.EMPTY;
  constructor() {
    const ariaHidden = inject(new HostAttributeToken("aria-hidden"), {
      optional: true
    });
    const defaults = inject(MAT_ICON_DEFAULT_OPTIONS, {
      optional: true
    });
    if (defaults) {
      if (defaults.color) {
        this.color = this._defaultColor = defaults.color;
      }
      if (defaults.fontSet) {
        this.fontSet = defaults.fontSet;
      }
    }
    if (!ariaHidden) {
      this._elementRef.nativeElement.setAttribute("aria-hidden", "true");
    }
  }
  /**
   * Splits an svgIcon binding value into its icon set and icon name components.
   * Returns a 2-element array of [(icon set), (icon name)].
   * The separator for the two fields is ':'. If there is no separator, an empty
   * string is returned for the icon set and the entire value is returned for
   * the icon name. If the argument is falsy, returns an array of two empty strings.
   * Throws an error if the name contains two or more ':' separators.
   * Examples:
   *   `'social:cake' -> ['social', 'cake']
   *   'penguin' -> ['', 'penguin']
   *   null -> ['', '']
   *   'a:b:c' -> (throws Error)`
   */
  _splitIconName(iconName) {
    if (!iconName) {
      return ["", ""];
    }
    const parts = iconName.split(":");
    switch (parts.length) {
      case 1:
        return ["", parts[0]];
      // Use default namespace.
      case 2:
        return parts;
      default:
        throw Error(`Invalid icon name: "${iconName}"`);
    }
  }
  ngOnInit() {
    this._updateFontIconClasses();
  }
  ngAfterViewChecked() {
    const cachedElements = this._elementsWithExternalReferences;
    if (cachedElements && cachedElements.size) {
      const newPath = this._location.getPathname();
      if (newPath !== this._previousPath) {
        this._previousPath = newPath;
        this._prependPathToReferences(newPath);
      }
    }
  }
  ngOnDestroy() {
    this._currentIconFetch.unsubscribe();
    if (this._elementsWithExternalReferences) {
      this._elementsWithExternalReferences.clear();
    }
  }
  _usingFontIcon() {
    return !this.svgIcon;
  }
  _setSvgElement(svg) {
    this._clearSvgElement();
    const path = this._location.getPathname();
    this._previousPath = path;
    this._cacheChildrenWithExternalReferences(svg);
    this._prependPathToReferences(path);
    this._elementRef.nativeElement.appendChild(svg);
  }
  _clearSvgElement() {
    const layoutElement = this._elementRef.nativeElement;
    let childCount = layoutElement.childNodes.length;
    if (this._elementsWithExternalReferences) {
      this._elementsWithExternalReferences.clear();
    }
    while (childCount--) {
      const child = layoutElement.childNodes[childCount];
      if (child.nodeType !== 1 || child.nodeName.toLowerCase() === "svg") {
        child.remove();
      }
    }
  }
  _updateFontIconClasses() {
    if (!this._usingFontIcon()) {
      return;
    }
    const elem = this._elementRef.nativeElement;
    const fontSetClasses = (this.fontSet ? this._iconRegistry.classNameForFontAlias(this.fontSet).split(/ +/) : this._iconRegistry.getDefaultFontSetClass()).filter((className) => className.length > 0);
    this._previousFontSetClass.forEach((className) => elem.classList.remove(className));
    fontSetClasses.forEach((className) => elem.classList.add(className));
    this._previousFontSetClass = fontSetClasses;
    if (this.fontIcon !== this._previousFontIconClass && !fontSetClasses.includes("mat-ligature-font")) {
      if (this._previousFontIconClass) {
        elem.classList.remove(this._previousFontIconClass);
      }
      if (this.fontIcon) {
        elem.classList.add(this.fontIcon);
      }
      this._previousFontIconClass = this.fontIcon;
    }
  }
  /**
   * Cleans up a value to be used as a fontIcon or fontSet.
   * Since the value ends up being assigned as a CSS class, we
   * have to trim the value and omit space-separated values.
   */
  _cleanupFontValue(value) {
    return typeof value === "string" ? value.trim().split(" ")[0] : value;
  }
  /**
   * Prepends the current path to all elements that have an attribute pointing to a `FuncIRI`
   * reference. This is required because WebKit browsers require references to be prefixed with
   * the current path, if the page has a `base` tag.
   */
  _prependPathToReferences(path) {
    const elements = this._elementsWithExternalReferences;
    if (elements) {
      elements.forEach((attrs, element) => {
        attrs.forEach((attr) => {
          element.setAttribute(attr.name, `url('${path}#${attr.value}')`);
        });
      });
    }
  }
  /**
   * Caches the children of an SVG element that have `url()`
   * references that we need to prefix with the current path.
   */
  _cacheChildrenWithExternalReferences(element) {
    const elementsWithFuncIri = element.querySelectorAll(funcIriAttributeSelector);
    const elements = this._elementsWithExternalReferences = this._elementsWithExternalReferences || /* @__PURE__ */ new Map();
    for (let i = 0; i < elementsWithFuncIri.length; i++) {
      funcIriAttributes.forEach((attr) => {
        const elementWithReference = elementsWithFuncIri[i];
        const value = elementWithReference.getAttribute(attr);
        const match = value ? value.match(funcIriPattern) : null;
        if (match) {
          let attributes = elements.get(elementWithReference);
          if (!attributes) {
            attributes = [];
            elements.set(elementWithReference, attributes);
          }
          attributes.push({
            name: attr,
            value: match[1]
          });
        }
      });
    }
  }
  /** Sets a new SVG icon with a particular name. */
  _updateSvgIcon(rawName) {
    this._svgNamespace = null;
    this._svgName = null;
    this._currentIconFetch.unsubscribe();
    if (rawName) {
      const [namespace, iconName] = this._splitIconName(rawName);
      if (namespace) {
        this._svgNamespace = namespace;
      }
      if (iconName) {
        this._svgName = iconName;
      }
      this._currentIconFetch = this._iconRegistry.getNamedSvgIcon(iconName, namespace).pipe(take(1)).subscribe((svg) => this._setSvgElement(svg), (err) => {
        const errorMessage = `Error retrieving icon ${namespace}:${iconName}! ${err.message}`;
        this._errorHandler.handleError(new Error(errorMessage));
      });
    }
  }
  static \u0275fac = function MatIcon_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _MatIcon)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({
    type: _MatIcon,
    selectors: [["mat-icon"]],
    hostAttrs: ["role", "img", 1, "mat-icon", "notranslate"],
    hostVars: 10,
    hostBindings: function MatIcon_HostBindings(rf, ctx) {
      if (rf & 2) {
        \u0275\u0275attribute("data-mat-icon-type", ctx._usingFontIcon() ? "font" : "svg")("data-mat-icon-name", ctx._svgName || ctx.fontIcon)("data-mat-icon-namespace", ctx._svgNamespace || ctx.fontSet)("fontIcon", ctx._usingFontIcon() ? ctx.fontIcon : null);
        \u0275\u0275classMap(ctx.color ? "mat-" + ctx.color : "");
        \u0275\u0275classProp("mat-icon-inline", ctx.inline)("mat-icon-no-color", ctx.color !== "primary" && ctx.color !== "accent" && ctx.color !== "warn");
      }
    },
    inputs: {
      color: "color",
      inline: [2, "inline", "inline", booleanAttribute],
      svgIcon: "svgIcon",
      fontSet: "fontSet",
      fontIcon: "fontIcon"
    },
    exportAs: ["matIcon"],
    ngContentSelectors: _c07,
    decls: 1,
    vars: 0,
    template: function MatIcon_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275projectionDef();
        \u0275\u0275projection(0);
      }
    },
    styles: ["mat-icon,mat-icon.mat-primary,mat-icon.mat-accent,mat-icon.mat-warn{color:var(--mat-icon-color, inherit)}.mat-icon{-webkit-user-select:none;user-select:none;background-repeat:no-repeat;display:inline-block;fill:currentColor;height:24px;width:24px;overflow:hidden}.mat-icon.mat-icon-inline{font-size:inherit;height:inherit;line-height:inherit;width:inherit}.mat-icon.mat-ligature-font[fontIcon]::before{content:attr(fontIcon)}[dir=rtl] .mat-icon-rtl-mirror{transform:scale(-1, 1)}.mat-form-field:not(.mat-form-field-appearance-legacy) .mat-form-field-prefix .mat-icon,.mat-form-field:not(.mat-form-field-appearance-legacy) .mat-form-field-suffix .mat-icon{display:block}.mat-form-field:not(.mat-form-field-appearance-legacy) .mat-form-field-prefix .mat-icon-button .mat-icon,.mat-form-field:not(.mat-form-field-appearance-legacy) .mat-form-field-suffix .mat-icon-button .mat-icon{margin:auto}\n"],
    encapsulation: 2,
    changeDetection: 0
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MatIcon, [{
    type: Component,
    args: [{
      template: "<ng-content></ng-content>",
      selector: "mat-icon",
      exportAs: "matIcon",
      host: {
        "role": "img",
        "class": "mat-icon notranslate",
        "[class]": 'color ? "mat-" + color : ""',
        "[attr.data-mat-icon-type]": '_usingFontIcon() ? "font" : "svg"',
        "[attr.data-mat-icon-name]": "_svgName || fontIcon",
        "[attr.data-mat-icon-namespace]": "_svgNamespace || fontSet",
        "[attr.fontIcon]": "_usingFontIcon() ? fontIcon : null",
        "[class.mat-icon-inline]": "inline",
        "[class.mat-icon-no-color]": 'color !== "primary" && color !== "accent" && color !== "warn"'
      },
      encapsulation: ViewEncapsulation.None,
      changeDetection: ChangeDetectionStrategy.OnPush,
      styles: ["mat-icon,mat-icon.mat-primary,mat-icon.mat-accent,mat-icon.mat-warn{color:var(--mat-icon-color, inherit)}.mat-icon{-webkit-user-select:none;user-select:none;background-repeat:no-repeat;display:inline-block;fill:currentColor;height:24px;width:24px;overflow:hidden}.mat-icon.mat-icon-inline{font-size:inherit;height:inherit;line-height:inherit;width:inherit}.mat-icon.mat-ligature-font[fontIcon]::before{content:attr(fontIcon)}[dir=rtl] .mat-icon-rtl-mirror{transform:scale(-1, 1)}.mat-form-field:not(.mat-form-field-appearance-legacy) .mat-form-field-prefix .mat-icon,.mat-form-field:not(.mat-form-field-appearance-legacy) .mat-form-field-suffix .mat-icon{display:block}.mat-form-field:not(.mat-form-field-appearance-legacy) .mat-form-field-prefix .mat-icon-button .mat-icon,.mat-form-field:not(.mat-form-field-appearance-legacy) .mat-form-field-suffix .mat-icon-button .mat-icon{margin:auto}\n"]
    }]
  }], () => [], {
    color: [{
      type: Input
    }],
    inline: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    svgIcon: [{
      type: Input
    }],
    fontSet: [{
      type: Input
    }],
    fontIcon: [{
      type: Input
    }]
  });
})();
var MatIconModule = class _MatIconModule {
  static \u0275fac = function MatIconModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _MatIconModule)();
  };
  static \u0275mod = /* @__PURE__ */ \u0275\u0275defineNgModule({
    type: _MatIconModule
  });
  static \u0275inj = /* @__PURE__ */ \u0275\u0275defineInjector({
    imports: [MatCommonModule, MatCommonModule]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MatIconModule, [{
    type: NgModule,
    args: [{
      imports: [MatCommonModule, MatIcon],
      exports: [MatIcon, MatCommonModule]
    }]
  }], null, null);
})();

// src/app/shared/clipboard/clipboard.model.ts
var ClipboardModel = class _ClipboardModel {
  sections = [];
  activeSection = null;
  isExpanded = false;
  lastUpdated = /* @__PURE__ */ new Date();
  constructor(data = {}) {
    this.sections = data.sections ?? [];
    this.activeSection = data.activeSection ?? null;
    this.isExpanded = data.isExpanded ?? false;
    this.lastUpdated = data.lastUpdated ?? /* @__PURE__ */ new Date();
  }
  /**
   * Serialize to JSON for localStorage
   */
  toJson() {
    return {
      sections: this.sections,
      activeSection: this.activeSection,
      isExpanded: this.isExpanded,
      lastUpdated: this.lastUpdated
    };
  }
  /**
   * Deserialize from JSON
   */
  static fromJson(json) {
    return new _ClipboardModel({
      sections: json.sections ?? [],
      activeSection: json.activeSection ?? null,
      isExpanded: json.isExpanded ?? false,
      lastUpdated: json.lastUpdated ? new Date(json.lastUpdated) : /* @__PURE__ */ new Date()
    });
  }
};

// src/app/shared/clipboard/clibboard-local-storage.service.ts
var ClipboardLocalStorageService = class _ClipboardLocalStorageService {
  CLIPBOARD_KEY = "clipboardState";
  localStorageService = inject(LocalStorageService);
  /**
   * Save entire clipboard state to localStorage
   */
  saveClipboard(clipboard) {
    this.localStorageService.setItem(this.CLIPBOARD_KEY, clipboard.toJson());
  }
  /**
   * Load entire clipboard state from localStorage
   */
  loadClipboard() {
    const saved = this.localStorageService.getItem(this.CLIPBOARD_KEY);
    return saved ? ClipboardModel.fromJson(saved) : null;
  }
  /**
   * Clear clipboard from localStorage
   */
  clearClipboard() {
    this.localStorageService.removeItem(this.CLIPBOARD_KEY);
  }
  static \u0275fac = function ClipboardLocalStorageService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _ClipboardLocalStorageService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _ClipboardLocalStorageService, factory: _ClipboardLocalStorageService.\u0275fac, providedIn: "root" });
};

// src/app/shared/clipboard/clipboard.service.ts
var ClipboardService2 = class _ClipboardService {
  localStorageService = inject(ClipboardLocalStorageService);
  clipboardState = signal(new ClipboardModel());
  // Expose readonly signals
  sections = computed(() => this.clipboardState().sections);
  activeSection = computed(() => {
    const activeId = this.clipboardState().activeSection;
    return this.clipboardState().sections.find((s) => s.id === activeId) || null;
  });
  isClipboardExpanded = computed(() => this.clipboardState().isExpanded);
  constructor() {
    const saved = this.localStorageService.loadClipboard();
    if (saved) {
      this.clipboardState.set(saved);
    }
    effect(() => {
      const state = this.clipboardState();
      state.lastUpdated = /* @__PURE__ */ new Date();
      this.localStorageService.saveClipboard(state);
    });
  }
  /**
   * Add items to clipboard with automatic section management
   * Creates section if it doesn't exist based on objectType
   */
  addItems(items, formatter = (items2) => items2) {
    if (!items || items.length === 0)
      return;
    items = formatter(items);
    if (!items || items.length === 0)
      return;
    const objectType = items[0].objectType;
    if (!objectType) {
      console.warn("Item missing objectType property:", items[0]);
      return;
    }
    this.clipboardState.update((state) => {
      let section = state.sections.find((s) => s.type === objectType);
      if (!section) {
        section = {
          id: this.generateId(),
          name: this.formatSectionName(objectType),
          type: objectType,
          items: [],
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
        state.sections.push(section);
      }
      const existingIds = new Set(section.items.map((item) => item.id));
      const newItems = items.filter((item) => !existingIds.has(item.id));
      section.items.push(...newItems);
      if (section.items.length > 15) {
        section.items = section.items.slice(-15);
      }
      section.updatedAt = /* @__PURE__ */ new Date();
      state.activeSection = section.id;
      return new ClipboardModel({
        sections: state.sections,
        activeSection: state.activeSection,
        isExpanded: state.isExpanded,
        lastUpdated: /* @__PURE__ */ new Date()
      });
    });
  }
  /**
   * Add single item to clipboard
   */
  addItem(item, formatter = (items) => items) {
    this.addItems([item], formatter);
  }
  /**
   * Format objectType to human-readable section name
   */
  formatSectionName(objectType) {
    return objectType.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase()).trim();
  }
  /**
   * Create a new section
   */
  createSection(name, type) {
    const newSection = {
      id: this.generateId(),
      name,
      type,
      items: [],
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.clipboardState.update((state) => {
      state.sections.push(newSection);
      state.activeSection = newSection.id;
      return new ClipboardModel({
        sections: state.sections,
        activeSection: state.activeSection,
        isExpanded: state.isExpanded,
        lastUpdated: /* @__PURE__ */ new Date()
      });
    });
  }
  /**
   * Add items to a specific section
   */
  addItemsToSection(sectionId, items) {
    this.clipboardState.update((state) => {
      const section = state.sections.find((s) => s.id === sectionId);
      if (section) {
        section.items.push(...items);
        section.updatedAt = /* @__PURE__ */ new Date();
      }
      return new ClipboardModel({
        sections: state.sections,
        activeSection: state.activeSection,
        isExpanded: state.isExpanded,
        lastUpdated: /* @__PURE__ */ new Date()
      });
    });
    console.log(`Added items to section "${sectionId}":`, items);
  }
  /**
   * Add item to active section
   */
  addItemToActiveSection(item) {
    const activeId = this.clipboardState().activeSection;
    if (activeId) {
      this.addItemsToSection(activeId, [item]);
    }
  }
  /**
   * Add items to active section
   */
  addItemsToActiveSection(items) {
    const activeId = this.clipboardState().activeSection;
    if (activeId) {
      this.addItemsToSection(activeId, items);
    }
  }
  /**
   * Set active section
   */
  setActiveSection(sectionId) {
    this.clipboardState.update((state) => {
      return new ClipboardModel({
        sections: state.sections,
        activeSection: sectionId,
        isExpanded: state.isExpanded,
        lastUpdated: /* @__PURE__ */ new Date()
      });
    });
  }
  /**
   * Toggle clipboard expanded state
   */
  toggleExpanded() {
    this.clipboardState.update((state) => {
      return new ClipboardModel({
        sections: state.sections,
        activeSection: state.activeSection,
        isExpanded: !state.isExpanded,
        lastUpdated: /* @__PURE__ */ new Date()
      });
    });
  }
  /**
   * Delete a section
   */
  deleteSection(sectionId) {
    this.clipboardState.update((state) => {
      const filtered = state.sections.filter((s) => s.id !== sectionId);
      const newActiveId = state.activeSection === sectionId ? filtered.length > 0 ? filtered[0].id : null : state.activeSection;
      return new ClipboardModel({
        sections: filtered,
        activeSection: newActiveId,
        isExpanded: state.isExpanded,
        lastUpdated: /* @__PURE__ */ new Date()
      });
    });
  }
  /**
   * Clear all items from a section
   */
  clearSection(sectionId) {
    this.clipboardState.update((state) => {
      const section = state.sections.find((s) => s.id === sectionId);
      if (section) {
        section.items = [];
        section.updatedAt = /* @__PURE__ */ new Date();
      }
      return new ClipboardModel({
        sections: state.sections,
        activeSection: state.activeSection,
        isExpanded: state.isExpanded,
        lastUpdated: /* @__PURE__ */ new Date()
      });
    });
  }
  /**
   * Remove item from section by index
   */
  removeItemFromSection(sectionId, itemIndex) {
    this.clipboardState.update((state) => {
      const section = state.sections.find((s) => s.id === sectionId);
      if (section) {
        section.items = section.items.filter((_, i) => i !== itemIndex);
        section.updatedAt = /* @__PURE__ */ new Date();
      }
      return new ClipboardModel({
        sections: state.sections,
        activeSection: state.activeSection,
        isExpanded: state.isExpanded,
        lastUpdated: /* @__PURE__ */ new Date()
      });
    });
  }
  /**
   * Get section by ID
   */
  getSection(sectionId) {
    return this.clipboardState().sections.find((s) => s.id === sectionId);
  }
  /**
   * Get section by type (objectType)
   */
  getSectionByType(type) {
    return this.clipboardState().sections.find((s) => s.type === type);
  }
  /**
   * Check if section exists by type (objectType)
   */
  sectionExists(type) {
    return this.clipboardState().sections.some((s) => s.type === type);
  }
  /**
   * Get entire clipboard state
   */
  getClipboard() {
    return this.clipboardState();
  }
  /**
   * Clear entire clipboard
   */
  clearClipboard() {
    this.clipboardState.set(new ClipboardModel());
  }
  /**
   * Generate unique ID
   */
  generateId() {
    return `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  static \u0275fac = function ClipboardService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _ClipboardService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _ClipboardService, factory: _ClipboardService.\u0275fac, providedIn: "root" });
};

// src/app/models/loto/zero-energy-phrase-clipboard.model.ts
var ZeroEnergyPhraseClipboardItem = class {
  objectType = "ZeroEnergyPhrase";
  name = "";
  isVerified = false;
  method = "";
  zeroEnergyTemplate = null;
  templateEquipment = [];
  templateEquipmentIds = [];
  constructor(data = {}) {
    this.objectType = "ZeroEnergyPhrase";
    this.name = data.name || "";
    this.isVerified = data.isVerified || false;
    this.method = data.method || "";
    this.zeroEnergyTemplate = data.zeroEnergyTemplate ? { id: data.zeroEnergyTemplate.id, name: data.zeroEnergyTemplate.name } : null;
    this.templateEquipment = data.templateEquipment || [];
    this.templateEquipmentIds = data.templateEquipmentIds || [];
  }
};

// src/app/shared/reactive-form/refactored/input-fields/zero-energy-phrase-builder/zero-energy-phrase-builder.component.ts
var _c08 = ["selectInput"];
var _forTrack010 = ($index, $item) => $item.value;
function ZeroEnergyPhraseBuilderComponent_Conditional_3_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 15);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate2(" ", ctx_r1.selectedPhrasePlaceholderCount(), " placeholder", ctx_r1.selectedPhrasePlaceholderCount() === 1 ? "" : "s", " needed ");
  }
}
function ZeroEnergyPhraseBuilderComponent_Conditional_3_For_7_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 17);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const segment_r3 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(segment_r3.content);
  }
}
function ZeroEnergyPhraseBuilderComponent_Conditional_3_For_7_Conditional_1_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 18);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const segment_r3 = \u0275\u0275nextContext(2).$implicit;
    \u0275\u0275property("title", "Placeholder: " + segment_r3.content + " \u2192 Equipment: " + segment_r3.substitutedText);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", segment_r3.substitutedText, " ");
  }
}
function ZeroEnergyPhraseBuilderComponent_Conditional_3_For_7_Conditional_1_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 19);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const segment_r3 = \u0275\u0275nextContext(2).$implicit;
    \u0275\u0275property("title", "Placeholder " + (segment_r3.placeholderIndex + 1) + ": " + segment_r3.content + " (not selected)");
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", segment_r3.content, " ");
  }
}
function ZeroEnergyPhraseBuilderComponent_Conditional_3_For_7_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, ZeroEnergyPhraseBuilderComponent_Conditional_3_For_7_Conditional_1_Conditional_0_Template, 2, 2, "span", 18)(1, ZeroEnergyPhraseBuilderComponent_Conditional_3_For_7_Conditional_1_Conditional_1_Template, 2, 2, "span", 19);
  }
  if (rf & 2) {
    const segment_r3 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275conditional(segment_r3.hasSubstitution ? 0 : 1);
  }
}
function ZeroEnergyPhraseBuilderComponent_Conditional_3_For_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, ZeroEnergyPhraseBuilderComponent_Conditional_3_For_7_Conditional_0_Template, 2, 1, "span", 17)(1, ZeroEnergyPhraseBuilderComponent_Conditional_3_For_7_Conditional_1_Template, 2, 1);
  }
  if (rf & 2) {
    const segment_r3 = ctx.$implicit;
    \u0275\u0275conditional(segment_r3.type === "text" ? 0 : 1);
  }
}
function ZeroEnergyPhraseBuilderComponent_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 3)(1, "div", 13)(2, "span", 14);
    \u0275\u0275text(3, "Selected Phrase Preview:");
    \u0275\u0275elementEnd();
    \u0275\u0275template(4, ZeroEnergyPhraseBuilderComponent_Conditional_3_Conditional_4_Template, 2, 2, "span", 15);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "div", 16);
    \u0275\u0275repeaterCreate(6, ZeroEnergyPhraseBuilderComponent_Conditional_3_For_7_Template, 2, 1, null, null, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(4);
    \u0275\u0275conditional(ctx_r1.selectedPhrasePlaceholderCount() > 0 ? 4 : -1);
    \u0275\u0275advance(2);
    \u0275\u0275repeater(ctx_r1.previewWithEquipment().segments);
  }
}
function ZeroEnergyPhraseBuilderComponent_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 4)(1, "button", 20);
    \u0275\u0275listener("click", function ZeroEnergyPhraseBuilderComponent_Conditional_4_Template_button_click_1_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onEdit());
    });
    \u0275\u0275elementStart(2, "mat-icon");
    \u0275\u0275text(3, "edit");
    \u0275\u0275elementEnd();
    \u0275\u0275text(4, " Edit ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "button", 21);
    \u0275\u0275listener("click", function ZeroEnergyPhraseBuilderComponent_Conditional_4_Template_button_click_5_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.openDeleteDialog());
    });
    \u0275\u0275elementStart(6, "mat-icon");
    \u0275\u0275text(7, "delete");
    \u0275\u0275elementEnd();
    \u0275\u0275text(8, " Delete ");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("disabled", ctx_r1.disabled());
    \u0275\u0275advance(4);
    \u0275\u0275property("disabled", ctx_r1.disabled());
  }
}
function ZeroEnergyPhraseBuilderComponent_Conditional_15_Conditional_3_For_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 27);
    \u0275\u0275listener("click", function ZeroEnergyPhraseBuilderComponent_Conditional_15_Conditional_3_For_2_Template_button_click_0_listener() {
      const item_r7 = \u0275\u0275restoreView(_r6).$implicit;
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.onClipboardItemClick(item_r7));
    });
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const item_r7 = ctx.$implicit;
    const $index_r8 = ctx.$index;
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r1.getClipboardItemLabel(item_r7, $index_r8), " ");
  }
}
function ZeroEnergyPhraseBuilderComponent_Conditional_15_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 24);
    \u0275\u0275repeaterCreate(1, ZeroEnergyPhraseBuilderComponent_Conditional_15_Conditional_3_For_2_Template, 2, 1, "button", 26, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r1.displayClipboardItems());
  }
}
function ZeroEnergyPhraseBuilderComponent_Conditional_15_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 25);
    \u0275\u0275text(1, "No clipboard items available");
    \u0275\u0275elementEnd();
  }
}
function ZeroEnergyPhraseBuilderComponent_Conditional_15_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 22)(1, "button", 23);
    \u0275\u0275listener("click", function ZeroEnergyPhraseBuilderComponent_Conditional_15_Template_button_click_1_listener($event) {
      \u0275\u0275restoreView(_r5);
      const ctx_r1 = \u0275\u0275nextContext();
      ctx_r1.addToClipboard();
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275text(2, " + Add to Clipboard ");
    \u0275\u0275elementEnd()();
    \u0275\u0275template(3, ZeroEnergyPhraseBuilderComponent_Conditional_15_Conditional_3_Template, 3, 0, "div", 24)(4, ZeroEnergyPhraseBuilderComponent_Conditional_15_Conditional_4_Template, 2, 0, "div", 25);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("disabled", !ctx_r1.hasValidClipboardData());
    \u0275\u0275advance(2);
    \u0275\u0275conditional(ctx_r1.displayClipboardItems().length > 0 ? 3 : 4);
  }
}
function ZeroEnergyPhraseBuilderComponent_Conditional_16_Conditional_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 33)(1, "mat-icon");
    \u0275\u0275text(2, "error");
    \u0275\u0275elementEnd();
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", ctx_r1.errorMessage(), " ");
  }
}
function ZeroEnergyPhraseBuilderComponent_Conditional_16_Conditional_22_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 40);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate2(" ", ctx_r1.placeholderCount(), " placeholder", ctx_r1.placeholderCount() === 1 ? "" : "s", " ");
  }
}
function ZeroEnergyPhraseBuilderComponent_Conditional_16_Conditional_24_For_5_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 48);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const segment_r10 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(segment_r10.content);
  }
}
function ZeroEnergyPhraseBuilderComponent_Conditional_16_Conditional_24_For_5_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 49);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const segment_r10 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275property("title", "Placeholder #" + (segment_r10.placeholderIndex + 1));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", segment_r10.content, " ");
  }
}
function ZeroEnergyPhraseBuilderComponent_Conditional_16_Conditional_24_For_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, ZeroEnergyPhraseBuilderComponent_Conditional_16_Conditional_24_For_5_Conditional_0_Template, 2, 1, "span", 48)(1, ZeroEnergyPhraseBuilderComponent_Conditional_16_Conditional_24_For_5_Conditional_1_Template, 2, 2, "span", 49);
  }
  if (rf & 2) {
    const segment_r10 = ctx.$implicit;
    \u0275\u0275conditional(segment_r10.type === "text" ? 0 : 1);
  }
}
function ZeroEnergyPhraseBuilderComponent_Conditional_16_Conditional_24_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 42)(1, "div", 14);
    \u0275\u0275text(2, "Preview:");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "div", 47);
    \u0275\u0275repeaterCreate(4, ZeroEnergyPhraseBuilderComponent_Conditional_16_Conditional_24_For_5_Template, 2, 1, null, null, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(4);
    \u0275\u0275repeater(ctx_r1.segments());
  }
}
function ZeroEnergyPhraseBuilderComponent_Conditional_16_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 28);
    \u0275\u0275listener("click", function ZeroEnergyPhraseBuilderComponent_Conditional_16_Template_div_click_0_listener() {
      \u0275\u0275restoreView(_r9);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.closePhraseDialog());
    });
    \u0275\u0275elementStart(1, "div", 29);
    \u0275\u0275listener("click", function ZeroEnergyPhraseBuilderComponent_Conditional_16_Template_div_click_1_listener($event) {
      \u0275\u0275restoreView(_r9);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275elementStart(2, "div", 30)(3, "h3");
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "button", 31);
    \u0275\u0275listener("click", function ZeroEnergyPhraseBuilderComponent_Conditional_16_Template_button_click_5_listener() {
      \u0275\u0275restoreView(_r9);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.closePhraseDialog());
    });
    \u0275\u0275elementStart(6, "mat-icon");
    \u0275\u0275text(7, "close");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(8, "div", 32);
    \u0275\u0275template(9, ZeroEnergyPhraseBuilderComponent_Conditional_16_Conditional_9_Template, 4, 1, "div", 33);
    \u0275\u0275elementStart(10, "div", 34)(11, "label", 35);
    \u0275\u0275text(12, "Phrase Name");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(13, "input", 36);
    \u0275\u0275twoWayListener("ngModelChange", function ZeroEnergyPhraseBuilderComponent_Conditional_16_Template_input_ngModelChange_13_listener($event) {
      \u0275\u0275restoreView(_r9);
      const ctx_r1 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r1.dialogPhraseName, $event) || (ctx_r1.dialogPhraseName = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(14, "div", 37)(15, "div", 38)(16, "label", 35);
    \u0275\u0275text(17, "Verification Phrase");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(18, "button", 39);
    \u0275\u0275listener("click", function ZeroEnergyPhraseBuilderComponent_Conditional_16_Template_button_click_18_listener() {
      \u0275\u0275restoreView(_r9);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.insertPlaceholder());
    });
    \u0275\u0275elementStart(19, "mat-icon");
    \u0275\u0275text(20, "add");
    \u0275\u0275elementEnd();
    \u0275\u0275text(21, " Add Tag Placeholder ");
    \u0275\u0275elementEnd();
    \u0275\u0275template(22, ZeroEnergyPhraseBuilderComponent_Conditional_16_Conditional_22_Template, 2, 2, "span", 40);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(23, "textarea", 41);
    \u0275\u0275listener("input", function ZeroEnergyPhraseBuilderComponent_Conditional_16_Template_textarea_input_23_listener($event) {
      \u0275\u0275restoreView(_r9);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onPhraseTextChange($event.target.value));
    })("click", function ZeroEnergyPhraseBuilderComponent_Conditional_16_Template_textarea_click_23_listener($event) {
      \u0275\u0275restoreView(_r9);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.updateCursorPosition($event));
    })("keyup", function ZeroEnergyPhraseBuilderComponent_Conditional_16_Template_textarea_keyup_23_listener($event) {
      \u0275\u0275restoreView(_r9);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.updateCursorPosition($event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275template(24, ZeroEnergyPhraseBuilderComponent_Conditional_16_Conditional_24_Template, 6, 0, "div", 42);
    \u0275\u0275elementStart(25, "div", 43)(26, "mat-icon");
    \u0275\u0275text(27, "info");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(28, "span");
    \u0275\u0275text(29, ' Build a phrase with placeholders for equipment tags. Example: "Verify that [tag1] is open and [tag2] shows zero pressure" ');
    \u0275\u0275elementEnd()()()();
    \u0275\u0275elementStart(30, "div", 44)(31, "button", 45);
    \u0275\u0275listener("click", function ZeroEnergyPhraseBuilderComponent_Conditional_16_Template_button_click_31_listener() {
      \u0275\u0275restoreView(_r9);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.closePhraseDialog());
    });
    \u0275\u0275text(32, " Cancel ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(33, "button", 46);
    \u0275\u0275listener("click", function ZeroEnergyPhraseBuilderComponent_Conditional_16_Template_button_click_33_listener() {
      \u0275\u0275restoreView(_r9);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.savePhrase());
    });
    \u0275\u0275text(34);
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(ctx_r1.dialogMode() === "add" ? "Create New Phrase" : "Edit Phrase");
    \u0275\u0275advance(5);
    \u0275\u0275conditional(ctx_r1.errorMessage() ? 9 : -1);
    \u0275\u0275advance(4);
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.dialogPhraseName);
    \u0275\u0275property("disabled", ctx_r1.disabled());
    \u0275\u0275advance(5);
    \u0275\u0275property("disabled", ctx_r1.disabled());
    \u0275\u0275advance(4);
    \u0275\u0275conditional(ctx_r1.placeholderCount() > 0 ? 22 : -1);
    \u0275\u0275advance();
    \u0275\u0275property("value", ctx_r1.dialogPhraseText())("disabled", ctx_r1.disabled());
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r1.segments().length > 0 ? 24 : -1);
    \u0275\u0275advance(10);
    \u0275\u0275textInterpolate1(" ", ctx_r1.dialogMode() === "add" ? "Create" : "Update", " Phrase ");
  }
}
function ZeroEnergyPhraseBuilderComponent_Conditional_17_Conditional_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 33)(1, "mat-icon");
    \u0275\u0275text(2, "error");
    \u0275\u0275elementEnd();
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", ctx_r1.errorMessage(), " ");
  }
}
function ZeroEnergyPhraseBuilderComponent_Conditional_17_Conditional_15_For_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "option", 54);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const option_r13 = ctx.$implicit;
    \u0275\u0275property("value", option_r13.value);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(option_r13.label);
  }
}
function ZeroEnergyPhraseBuilderComponent_Conditional_17_Conditional_15_Template(rf, ctx) {
  if (rf & 1) {
    const _r12 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 34)(1, "label", 35);
    \u0275\u0275text(2, " Transfer references to this phrase (optional): ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "select", 53);
    \u0275\u0275twoWayListener("ngModelChange", function ZeroEnergyPhraseBuilderComponent_Conditional_17_Conditional_15_Template_select_ngModelChange_3_listener($event) {
      \u0275\u0275restoreView(_r12);
      const ctx_r1 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(ctx_r1.transferToValueId, $event) || (ctx_r1.transferToValueId = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275elementStart(4, "option", 54);
    \u0275\u0275text(5, "-- No transfer --");
    \u0275\u0275elementEnd();
    \u0275\u0275repeaterCreate(6, ZeroEnergyPhraseBuilderComponent_Conditional_17_Conditional_15_For_7_Template, 2, 2, "option", 54, _forTrack010);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(3);
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.transferToValueId);
    \u0275\u0275advance();
    \u0275\u0275property("value", null);
    \u0275\u0275advance(2);
    \u0275\u0275repeater(ctx_r1.transferOptions());
  }
}
function ZeroEnergyPhraseBuilderComponent_Conditional_17_Template(rf, ctx) {
  if (rf & 1) {
    const _r11 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 28);
    \u0275\u0275listener("click", function ZeroEnergyPhraseBuilderComponent_Conditional_17_Template_div_click_0_listener() {
      \u0275\u0275restoreView(_r11);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.closeDeleteDialog());
    });
    \u0275\u0275elementStart(1, "div", 50);
    \u0275\u0275listener("click", function ZeroEnergyPhraseBuilderComponent_Conditional_17_Template_div_click_1_listener($event) {
      \u0275\u0275restoreView(_r11);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275elementStart(2, "div", 30)(3, "h3");
    \u0275\u0275text(4, "Delete Phrase");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "button", 31);
    \u0275\u0275listener("click", function ZeroEnergyPhraseBuilderComponent_Conditional_17_Template_button_click_5_listener() {
      \u0275\u0275restoreView(_r11);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.closeDeleteDialog());
    });
    \u0275\u0275elementStart(6, "mat-icon");
    \u0275\u0275text(7, "close");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(8, "div", 32);
    \u0275\u0275template(9, ZeroEnergyPhraseBuilderComponent_Conditional_17_Conditional_9_Template, 4, 1, "div", 33);
    \u0275\u0275elementStart(10, "p", 51);
    \u0275\u0275text(11, ' Are you sure you want to delete the phrase "');
    \u0275\u0275elementStart(12, "strong");
    \u0275\u0275text(13);
    \u0275\u0275elementEnd();
    \u0275\u0275text(14, '"? ');
    \u0275\u0275elementEnd();
    \u0275\u0275template(15, ZeroEnergyPhraseBuilderComponent_Conditional_17_Conditional_15_Template, 8, 2, "div", 34);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(16, "div", 44)(17, "button", 45);
    \u0275\u0275listener("click", function ZeroEnergyPhraseBuilderComponent_Conditional_17_Template_button_click_17_listener() {
      \u0275\u0275restoreView(_r11);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.closeDeleteDialog());
    });
    \u0275\u0275text(18, " Cancel ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(19, "button", 52);
    \u0275\u0275listener("click", function ZeroEnergyPhraseBuilderComponent_Conditional_17_Template_button_click_19_listener() {
      \u0275\u0275restoreView(_r11);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.confirmDelete());
    });
    \u0275\u0275text(20, " Delete Phrase ");
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(9);
    \u0275\u0275conditional(ctx_r1.errorMessage() ? 9 : -1);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(ctx_r1.selectedPhraseName());
    \u0275\u0275advance(2);
    \u0275\u0275conditional(ctx_r1.transferOptions().length > 0 ? 15 : -1);
  }
}
var ZeroEnergyPhraseBuilderComponent = class _ZeroEnergyPhraseBuilderComponent {
  valueService = inject(RfValueService);
  injector = inject(Injector);
  clipboardService = inject(ClipboardService2);
  selectInput;
  // Inputs
  label = input("Zero Energy Phrase");
  categoryAlias = input("zeroEnergyTemplate");
  canManageValues = input(true);
  selectedEquipment = input([]);
  // Array of selected equipment/LOTO points for placeholder substitution
  initialPhraseId = input(null);
  // Initial phrase ID to preselect
  // Output for clipboard item selection - includes full equipment objects for proper form population
  clipboardItemSelected = output();
  // Output for placeholder count changes
  placeholderCountChange = output();
  // State
  selectedPhraseId = signal(null);
  disabled = signal(false);
  // Computed options based on categoryAlias with phrase preview
  options = computed(() => {
    const alias = this.categoryAlias();
    if (!alias)
      return [];
    const values = this.valueService.getValuesByCategory(alias);
    return values.map((v) => {
      let phraseText = "";
      let placeholderCount = 0;
      try {
        const phraseData = JSON.parse(v.alias || "{}");
        phraseText = phraseData.rawText || "";
        placeholderCount = phraseData.segments?.filter((s) => s.type === "placeholder").length || 0;
      } catch (e) {
      }
      const labelSuffix = placeholderCount > 0 ? ` (${placeholderCount} placeholder${placeholderCount === 1 ? "" : "s"})` : "";
      return {
        value: v.id,
        label: v.name + labelSuffix,
        description: phraseText,
        // Use description field for the phrase preview
        metadata: { phraseText, placeholderCount }
      };
    });
  });
  // Dialog state for Add/Edit phrase
  showPhraseDialog = signal(false);
  dialogMode = signal("add");
  dialogPhraseName = "";
  dialogPhraseText = signal("");
  cursorPosition = signal(0);
  errorMessage = signal("");
  // Delete confirmation state
  showDeleteConfirm = signal(false);
  transferToValueId = null;
  selectedPhraseName = signal("");
  transferOptions = signal([]);
  // Parsed segments from dialog phrase text
  segments = computed(() => {
    return this.parsePhrase(this.dialogPhraseText());
  });
  // Placeholder count
  placeholderCount = computed(() => {
    const segs = this.segments();
    return segs.filter((s) => s.type === "placeholder").length;
  });
  // Selected phrase preview (for displaying under dropdown)
  selectedPhrasePreview = computed(() => {
    const phraseId = this.selectedPhraseId();
    if (!phraseId)
      return null;
    const alias = this.categoryAlias();
    const values = this.valueService.getValuesByCategory(alias);
    const selectedValue = values.find((v) => v.id === phraseId);
    if (!selectedValue)
      return null;
    try {
      const phraseData = JSON.parse(selectedValue.alias || "{}");
      return phraseData;
    } catch (e) {
      return null;
    }
  });
  // Count of placeholders in selected phrase
  selectedPhrasePlaceholderCount = computed(() => {
    const preview = this.selectedPhrasePreview();
    if (!preview || !preview.segments)
      return 0;
    return preview.segments.filter((s) => s.type === "placeholder").length;
  });
  // Preview with equipment substituted into placeholders
  previewWithEquipment = computed(() => {
    const preview = this.selectedPhrasePreview();
    if (!preview || !preview.segments)
      return null;
    const equipment = this.selectedEquipment();
    const substitutedSegments = preview.segments.map((segment) => {
      if (segment.type === "placeholder" && segment.placeholderIndex !== void 0) {
        const equipmentItem = equipment[segment.placeholderIndex];
        if (equipmentItem) {
          const tagNumber = this.getEquipmentTagNumber(equipmentItem, segment.placeholderIndex);
          return __spreadProps(__spreadValues({}, segment), {
            substitutedText: tagNumber,
            hasSubstitution: true
          });
        }
      }
      return __spreadProps(__spreadValues({}, segment), {
        hasSubstitution: false
      });
    });
    return __spreadProps(__spreadValues({}, preview), {
      segments: substitutedSegments
    });
  });
  /**
   * Gets the best identifier for an equipment item to display in the phrase.
   * Priority: LOTO point tagNumber > equipment tagNumber > equipment tag > fallback
   */
  getEquipmentTagNumber(equipmentItem, index) {
    const fallback = `Equipment ${index + 1}`;
    if (equipmentItem.lotoPoints && Array.isArray(equipmentItem.lotoPoints) && equipmentItem.lotoPoints.length > 0) {
      const lotoTagNumber = equipmentItem.lotoPoints[0]?.tagNumber;
      if (lotoTagNumber)
        return lotoTagNumber;
    }
    if (equipmentItem.tagNumber) {
      return equipmentItem.tagNumber;
    }
    if (equipmentItem.tag) {
      return equipmentItem.tag;
    }
    if (equipmentItem.id) {
      return `Equipment #${equipmentItem.id}`;
    }
    return fallback;
  }
  // ControlValueAccessor
  onChange = (value) => {
  };
  onTouched = () => {
  };
  pendingValue = void 0;
  hasPendingValue = false;
  ngAfterViewInit() {
    if (this.selectInput) {
      this.selectInput.registerOnChange((val) => {
        const id = val?.id ?? val;
        this.selectedPhraseId.set(id);
        this.onChange({ id });
        setTimeout(() => {
          this.placeholderCountChange.emit(this.selectedPhrasePlaceholderCount());
        }, 0);
      });
      this.selectInput.registerOnTouched(() => {
        this.onTouched();
      });
      if (this.hasPendingValue) {
        this.selectInput.writeValue(this.pendingValue);
        this.hasPendingValue = false;
        this.pendingValue = void 0;
      }
      effect(() => {
        const opts = this.options();
        const val = this.selectedPhraseId();
        if (opts.length > 0 && val !== null && val !== void 0 && this.selectInput) {
          setTimeout(() => {
            if (this.selectInput) {
              this.selectInput.writeValue(val);
            }
          }, 0);
        }
      }, { injector: this.injector });
      effect(() => {
        const initialId = this.initialPhraseId();
        if (initialId !== null && initialId !== void 0 && this.selectInput) {
          this.selectedPhraseId.set(initialId);
          setTimeout(() => {
            if (this.selectInput) {
              this.selectInput.writeValue(initialId);
            }
          }, 0);
        }
      }, { injector: this.injector });
    }
  }
  /**
   * Parse the phrase text into segments
   * Syntax: [tag1], [tag2], etc.
   */
  parsePhrase(text) {
    if (!text)
      return [];
    const segments = [];
    const regex = /\[([^\]]+)\]/g;
    let lastIndex = 0;
    let match;
    let placeholderIndex = 0;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        segments.push({
          type: "text",
          content: text.substring(lastIndex, match.index)
        });
      }
      segments.push({
        type: "placeholder",
        content: match[1],
        placeholderIndex: placeholderIndex++
      });
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
      segments.push({
        type: "text",
        content: text.substring(lastIndex)
      });
    }
    return segments;
  }
  // ==================== ControlValueAccessor Methods ====================
  writeValue(value) {
    this.selectedPhraseId.set(value);
    if (this.selectInput) {
      this.selectInput.writeValue(value);
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
  // ==================== Searchable Select Event Handlers ====================
  onAddNew() {
    this.dialogMode.set("add");
    this.dialogPhraseName = "";
    this.dialogPhraseText.set("");
    this.cursorPosition.set(0);
    this.errorMessage.set("");
    this.showPhraseDialog.set(true);
  }
  onEdit() {
    const currentValue = this.selectedPhraseId();
    if (!currentValue) {
      this.errorMessage.set("Please select a phrase to edit");
      return;
    }
    const alias = this.categoryAlias();
    const values = this.valueService.getValuesByCategory(alias);
    const selectedValue = values.find((v) => v.id === currentValue);
    if (!selectedValue)
      return;
    this.dialogMode.set("edit");
    this.dialogPhraseName = selectedValue.name;
    try {
      const phraseData = JSON.parse(selectedValue.alias || "{}");
      this.dialogPhraseText.set(phraseData.rawText || "");
    } catch {
      this.dialogPhraseText.set("");
    }
    this.cursorPosition.set(0);
    this.errorMessage.set("");
    this.showPhraseDialog.set(true);
  }
  // ==================== Phrase Dialog Methods ====================
  closePhraseDialog() {
    this.showPhraseDialog.set(false);
    this.dialogPhraseName = "";
    this.dialogPhraseText.set("");
    this.errorMessage.set("");
  }
  savePhrase() {
    if (!this.dialogPhraseName.trim()) {
      this.errorMessage.set("Phrase name is required");
      return;
    }
    if (!this.dialogPhraseText().trim()) {
      this.errorMessage.set("Phrase text is required");
      return;
    }
    const alias = this.categoryAlias();
    const isAddMode = this.dialogMode() === "add";
    const phraseData = {
      name: this.dialogPhraseName,
      rawText: this.dialogPhraseText(),
      segments: this.segments()
    };
    const phraseAlias = JSON.stringify(phraseData);
    if (isAddMode) {
      this.valueService.createValue(alias, this.dialogPhraseName, phraseAlias).subscribe({
        next: (newValue) => {
          this.closePhraseDialog();
          this.valueService.refreshCategory(alias);
          this.selectedPhraseId.set(newValue.id);
          this.onChange(newValue.id);
        },
        error: (error) => {
          this.errorMessage.set(error.error?.message || "Error creating phrase");
        }
      });
    } else {
      const valueId = this.selectedPhraseId();
      if (!valueId)
        return;
      this.valueService.updateValue(valueId, this.dialogPhraseName, phraseAlias).subscribe({
        next: () => {
          this.closePhraseDialog();
          this.valueService.refreshCategory(alias);
        },
        error: (error) => {
          this.errorMessage.set(error.error?.message || "Error updating phrase");
        }
      });
    }
  }
  insertPlaceholder() {
    const currentText = this.dialogPhraseText();
    const cursor = this.cursorPosition();
    const placeholderNum = this.placeholderCount() + 1;
    const placeholder = `[tag${placeholderNum}]`;
    const newText = currentText.substring(0, cursor) + placeholder + currentText.substring(cursor);
    this.dialogPhraseText.set(newText);
    this.cursorPosition.set(cursor + placeholder.length);
  }
  updateCursorPosition(event) {
    const target = event.target;
    this.cursorPosition.set(target.selectionStart || 0);
  }
  onPhraseTextChange(newText) {
    this.dialogPhraseText.set(newText);
  }
  // ==================== Delete Dialog ====================
  openDeleteDialog() {
    const currentValue = this.selectedPhraseId();
    if (!currentValue)
      return;
    const selectedOption = this.options().find((opt) => opt.value === currentValue);
    if (!selectedOption)
      return;
    this.selectedPhraseName.set(selectedOption.label);
    const transfers = this.options().filter((opt) => opt.value !== currentValue);
    this.transferOptions.set(transfers);
    this.transferToValueId = null;
    this.errorMessage.set("");
    this.showDeleteConfirm.set(true);
  }
  closeDeleteDialog() {
    this.showDeleteConfirm.set(false);
    this.transferToValueId = null;
    this.errorMessage.set("");
  }
  confirmDelete() {
    const valueId = this.selectedPhraseId();
    if (!valueId)
      return;
    const alias = this.categoryAlias();
    this.valueService.deleteValue(valueId, alias, this.transferToValueId || void 0).subscribe({
      next: () => {
        this.closeDeleteDialog();
        this.selectedPhraseId.set(null);
        this.onChange(null);
        this.valueService.refreshCategory(alias);
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || "Error deleting phrase");
      }
    });
  }
  // ==================== Clipboard Methods ====================
  isClipboardCollapsed = signal(true);
  capturedInitialPhrase = signal(null);
  // Capture initial phrase when component has valid data
  captureInitialEffect = effect(() => {
    const phraseId = this.selectedPhraseId();
    const equipment = this.selectedEquipment();
    if (phraseId && !this.capturedInitialPhrase()) {
      const clipboardItem = new ZeroEnergyPhraseClipboardItem({
        zeroEnergyTemplate: { id: phraseId },
        templateEquipment: equipment,
        templateEquipmentIds: equipment.map((e) => e.id).filter((id) => id)
      });
      this.capturedInitialPhrase.set(clipboardItem);
    }
  });
  clipboardItems = computed(() => {
    const section = this.clipboardService.getSectionByType("ZeroEnergyPhrase");
    return section?.items ?? [];
  });
  displayClipboardItems = computed(() => {
    const items = this.clipboardItems();
    const initial = this.capturedInitialPhrase();
    if (initial && initial.zeroEnergyTemplate?.id) {
      return [initial, ...items];
    }
    return items;
  });
  toggleClipboardCollapse() {
    this.isClipboardCollapsed.update((value) => !value);
  }
  hasValidClipboardData() {
    const phraseId = this.selectedPhraseId();
    return !!phraseId;
  }
  getClipboardItemSummary = (item) => {
    const templateName = item.zeroEnergyTemplate?.name || `Template #${item.zeroEnergyTemplate?.id}`;
    const equipCount = item.templateEquipment?.length || item.templateEquipmentIds?.length || 0;
    return `${templateName} (${equipCount} equipment)`;
  };
  addToClipboard() {
    const phraseId = this.selectedPhraseId();
    if (!phraseId) {
      return;
    }
    const selectedOption = this.options().find((opt) => opt.value === phraseId);
    const phraseName = selectedOption?.label || `Template #${phraseId}`;
    const equipment = this.selectedEquipment();
    const clipboardItem = new ZeroEnergyPhraseClipboardItem({
      zeroEnergyTemplate: { id: phraseId, name: phraseName },
      templateEquipment: equipment,
      templateEquipmentIds: equipment.map((e) => e.id).filter((id) => id)
    });
    this.clipboardService.addItem(clipboardItem);
  }
  onClipboardItemClick(item) {
    if (item && item.zeroEnergyTemplate?.id) {
      this.selectedPhraseId.set(item.zeroEnergyTemplate.id);
      this.onChange({ id: item.zeroEnergyTemplate.id });
      if (this.selectInput) {
        this.selectInput.writeValue(item.zeroEnergyTemplate.id);
      }
      this.clipboardItemSelected.emit({
        phraseId: item.zeroEnergyTemplate.id,
        templateEquipment: item.templateEquipment || [],
        templateEquipmentIds: item.templateEquipmentIds || []
      });
    }
  }
  getClipboardItemLabel(item, index) {
    if (index === 0 && this.capturedInitialPhrase() === item) {
      return `[Initial] ${this.getClipboardItemSummary(item)}`;
    }
    return this.getClipboardItemSummary(item);
  }
  static \u0275fac = function ZeroEnergyPhraseBuilderComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _ZeroEnergyPhraseBuilderComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ZeroEnergyPhraseBuilderComponent, selectors: [["app-zero-energy-phrase-builder"]], viewQuery: function ZeroEnergyPhraseBuilderComponent_Query(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275viewQuery(_c08, 5);
    }
    if (rf & 2) {
      let _t;
      \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.selectInput = _t.first);
    }
  }, inputs: { label: [1, "label"], categoryAlias: [1, "categoryAlias"], canManageValues: [1, "canManageValues"], selectedEquipment: [1, "selectedEquipment"], initialPhraseId: [1, "initialPhraseId"] }, outputs: { clipboardItemSelected: "clipboardItemSelected", placeholderCountChange: "placeholderCountChange" }, features: [\u0275\u0275ProvidersFeature([{
    provide: NG_VALUE_ACCESSOR,
    useExisting: _ZeroEnergyPhraseBuilderComponent,
    multi: true
  }])], decls: 18, vars: 12, consts: [["selectInput", ""], [1, "phrase-select-container"], [3, "addNewOption", "editOption", "label", "options", "categoryName"], [1, "phrase-preview-box"], [1, "action-buttons"], [1, "clipboard-container"], [1, "clipboard-header", 3, "click"], [1, "clipboard-header-content"], [1, "clipboard-title"], [1, "clipboard-count"], ["type", "button", 1, "clipboard-collapse-btn"], [1, "collapse-icon"], [1, "dialog-overlay"], [1, "preview-header"], [1, "preview-label"], [1, "preview-placeholder-count"], [1, "preview-phrase"], [1, "preview-segment-text"], [1, "preview-segment-substituted", 3, "title"], [1, "preview-segment-placeholder", 3, "title"], ["type", "button", "title", "Edit phrase", 1, "btn-action", "btn-edit", 3, "click", "disabled"], ["type", "button", "title", "Delete phrase", 1, "btn-action", "btn-delete", 3, "click", "disabled"], [1, "clipboard-actions"], ["type", "button", "title", "Add current selection to clipboard", 1, "clipboard-add-btn", 3, "click", "disabled"], [1, "clipboard-list"], [1, "clipboard-empty"], ["type", "button", "title", "Click to paste", 1, "clipboard-item"], ["type", "button", "title", "Click to paste", 1, "clipboard-item", 3, "click"], [1, "dialog-overlay", 3, "click"], [1, "dialog-content", 3, "click"], [1, "dialog-header"], ["type", "button", "title", "Close", 1, "close-btn", 3, "click"], [1, "dialog-body"], [1, "error-message"], [1, "form-field"], [1, "field-label"], ["type", "text", "placeholder", "e.g., Valve Open Verification", 1, "field-input", 3, "ngModelChange", "ngModel", "disabled"], [1, "phrase-builder-section"], [1, "phrase-builder-header"], ["type", "button", "title", "Insert placeholder for equipment tag", 1, "btn-add-placeholder", 3, "click", "disabled"], [1, "placeholder-count"], ["placeholder", "Enter verification phrase... Click 'Add Tag Placeholder' to insert equipment tags", "rows", "4", 1, "phrase-input", 3, "input", "click", "keyup", "value", "disabled"], [1, "phrase-preview"], [1, "phrase-help"], [1, "dialog-footer"], ["type", "button", 1, "btn", "btn-secondary", 3, "click"], ["type", "button", 1, "btn", "btn-primary", 3, "click"], [1, "preview-content"], [1, "segment-text"], [1, "segment-placeholder", 3, "title"], [1, "dialog-content", "delete-dialog", 3, "click"], [1, "delete-message"], ["type", "button", 1, "btn", "btn-danger", 3, "click"], [1, "field-input", 3, "ngModelChange", "ngModel"], [3, "value"]], template: function ZeroEnergyPhraseBuilderComponent_Template(rf, ctx) {
    if (rf & 1) {
      const _r1 = \u0275\u0275getCurrentView();
      \u0275\u0275elementStart(0, "div", 1)(1, "app-searchable-select-input", 2, 0);
      \u0275\u0275listener("addNewOption", function ZeroEnergyPhraseBuilderComponent_Template_app_searchable_select_input_addNewOption_1_listener() {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.onAddNew());
      })("editOption", function ZeroEnergyPhraseBuilderComponent_Template_app_searchable_select_input_editOption_1_listener() {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.onEdit());
      });
      \u0275\u0275elementEnd();
      \u0275\u0275template(3, ZeroEnergyPhraseBuilderComponent_Conditional_3_Template, 8, 1, "div", 3)(4, ZeroEnergyPhraseBuilderComponent_Conditional_4_Template, 9, 2, "div", 4);
      \u0275\u0275elementStart(5, "div", 5)(6, "div", 6);
      \u0275\u0275listener("click", function ZeroEnergyPhraseBuilderComponent_Template_div_click_6_listener() {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.toggleClipboardCollapse());
      });
      \u0275\u0275elementStart(7, "div", 7)(8, "span", 8);
      \u0275\u0275text(9, "Clipboard");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(10, "span", 9);
      \u0275\u0275text(11);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(12, "button", 10)(13, "span", 11);
      \u0275\u0275text(14);
      \u0275\u0275elementEnd()()();
      \u0275\u0275template(15, ZeroEnergyPhraseBuilderComponent_Conditional_15_Template, 5, 2);
      \u0275\u0275elementEnd()();
      \u0275\u0275template(16, ZeroEnergyPhraseBuilderComponent_Conditional_16_Template, 35, 10, "div", 12)(17, ZeroEnergyPhraseBuilderComponent_Conditional_17_Template, 21, 3, "div", 12);
    }
    if (rf & 2) {
      \u0275\u0275advance();
      \u0275\u0275property("label", ctx.label())("options", ctx.options())("categoryName", ctx.categoryAlias());
      \u0275\u0275advance(2);
      \u0275\u0275conditional(ctx.previewWithEquipment() ? 3 : -1);
      \u0275\u0275advance();
      \u0275\u0275conditional(ctx.canManageValues() && ctx.selectedPhraseId() ? 4 : -1);
      \u0275\u0275advance(7);
      \u0275\u0275textInterpolate1("", ctx.displayClipboardItems().length, " items");
      \u0275\u0275advance();
      \u0275\u0275classProp("collapsed", ctx.isClipboardCollapsed());
      \u0275\u0275advance(2);
      \u0275\u0275textInterpolate(ctx.isClipboardCollapsed() ? "\u25B6" : "\u25BC");
      \u0275\u0275advance();
      \u0275\u0275conditional(!ctx.isClipboardCollapsed() ? 15 : -1);
      \u0275\u0275advance();
      \u0275\u0275conditional(ctx.showPhraseDialog() ? 16 : -1);
      \u0275\u0275advance();
      \u0275\u0275conditional(ctx.showDeleteConfirm() ? 17 : -1);
    }
  }, dependencies: [CommonModule, FormsModule, NgSelectOption, \u0275NgSelectMultipleOption, DefaultValueAccessor, SelectControlValueAccessor, NgControlStatus, NgModel, MatIconModule, MatIcon, SearchableSelectInputComponent], styles: ['\n\n.phrase-builder-container[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 12px;\n  padding: 16px;\n  background: var(--card-background, white);\n  border-radius: 8px;\n  border: 1px solid var(--border-color, #dee2e6);\n}\n.phrase-builder-label[_ngcontent-%COMP%] {\n  font-size: 15px;\n  font-weight: 600;\n  color: var(--primary-text, #2d3748);\n  margin: 0;\n}\n.phrase-builder-controls[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  flex-wrap: wrap;\n}\n.btn-add-placeholder[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  padding: 8px 14px;\n  font-size: 14px;\n  font-weight: 500;\n  background: var(--accent-color, #667eea);\n  color: white;\n  border: none;\n  border-radius: 6px;\n  cursor: pointer;\n  transition: all 0.3s ease;\n}\n.btn-add-placeholder[_ngcontent-%COMP%]:hover:not(:disabled) {\n  background: var(--accent-color-hover, #764ba2);\n  transform: translateY(-2px);\n  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);\n}\n.btn-add-placeholder[_ngcontent-%COMP%]:active:not(:disabled) {\n  transform: translateY(0);\n}\n.btn-add-placeholder[_ngcontent-%COMP%]:disabled {\n  opacity: 0.5;\n  cursor: not-allowed;\n  transform: none;\n}\n.btn-add-placeholder[_ngcontent-%COMP%]   svg[_ngcontent-%COMP%] {\n  flex-shrink: 0;\n}\n.placeholder-count[_ngcontent-%COMP%] {\n  font-size: 13px;\n  font-weight: 500;\n  color: var(--secondary-text, #718096);\n  padding: 4px 10px;\n  background: var(--secondary-background, #f0f2f5);\n  border-radius: 12px;\n}\n.phrase-input-wrapper[_ngcontent-%COMP%] {\n  position: relative;\n}\n.phrase-input[_ngcontent-%COMP%] {\n  width: 100%;\n  padding: 12px;\n  font-size: 14px;\n  font-family:\n    "Segoe UI",\n    Tahoma,\n    Geneva,\n    Verdana,\n    sans-serif;\n  line-height: 1.6;\n  border: 2px solid var(--border-color, #dee2e6);\n  border-radius: 6px;\n  background: var(--card-background, white);\n  color: var(--primary-text, #2d3748);\n  resize: vertical;\n  min-height: 100px;\n  transition: all 0.3s ease;\n}\n.phrase-input[_ngcontent-%COMP%]:focus {\n  outline: none;\n  border-color: var(--accent-color, #667eea);\n  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);\n}\n.phrase-input[_ngcontent-%COMP%]:disabled {\n  opacity: 0.6;\n  cursor: not-allowed;\n  background: var(--disabled-background, #f5f5f5);\n}\n.phrase-input[_ngcontent-%COMP%]::placeholder {\n  color: var(--secondary-text, #a0aec0);\n  font-style: italic;\n}\n.phrase-preview[_ngcontent-%COMP%] {\n  padding: 12px;\n  background: var(--secondary-background, #f7fafc);\n  border-radius: 6px;\n  border: 1px solid var(--border-color, #e2e8f0);\n}\n.preview-label[_ngcontent-%COMP%] {\n  font-size: 12px;\n  font-weight: 600;\n  color: var(--secondary-text, #718096);\n  margin-bottom: 8px;\n  text-transform: uppercase;\n  letter-spacing: 0.5px;\n}\n.preview-content[_ngcontent-%COMP%] {\n  font-size: 14px;\n  line-height: 1.6;\n  color: var(--primary-text, #2d3748);\n  word-wrap: break-word;\n}\n.segment-text[_ngcontent-%COMP%] {\n  color: var(--primary-text, #2d3748);\n}\n.segment-placeholder[_ngcontent-%COMP%] {\n  display: inline-block;\n  padding: 2px 8px;\n  background:\n    linear-gradient(\n      135deg,\n      #667eea 0%,\n      #764ba2 100%);\n  color: white;\n  border-radius: 4px;\n  font-weight: 600;\n  font-family: "Courier New", monospace;\n  font-size: 13px;\n  margin: 0 2px;\n  cursor: help;\n  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);\n}\n.phrase-help[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: flex-start;\n  gap: 8px;\n  padding: 10px;\n  background: var(--secondary-background, #f0f9ff);\n  border-radius: 6px;\n  border-left: 3px solid var(--accent-color, #667eea);\n}\n.phrase-help[_ngcontent-%COMP%]   svg[_ngcontent-%COMP%] {\n  flex-shrink: 0;\n  margin-top: 2px;\n  color: var(--accent-color, #667eea);\n}\n.phrase-help[_ngcontent-%COMP%]   span[_ngcontent-%COMP%] {\n  font-size: 13px;\n  line-height: 1.5;\n  color: var(--secondary-text, #4a5568);\n}\n.phrase-select-container[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n}\n.phrase-preview-box[_ngcontent-%COMP%] {\n  padding: 12px;\n  background: var(--secondary-background, #f7fafc);\n  border: 1px solid var(--border-color, #e2e8f0);\n  border-radius: 6px;\n  margin-top: 4px;\n}\n.preview-header[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  margin-bottom: 8px;\n  gap: 8px;\n  flex-wrap: wrap;\n}\n.preview-label[_ngcontent-%COMP%] {\n  font-size: 12px;\n  font-weight: 600;\n  color: var(--secondary-text, #718096);\n  text-transform: uppercase;\n  letter-spacing: 0.5px;\n}\n.preview-placeholder-count[_ngcontent-%COMP%] {\n  font-size: 12px;\n  font-weight: 500;\n  color: var(--accent-color, #667eea);\n  padding: 2px 8px;\n  background: var(--accent-background, #eef2ff);\n  border-radius: 10px;\n}\n.preview-phrase[_ngcontent-%COMP%] {\n  font-size: 14px;\n  line-height: 1.6;\n  color: var(--primary-text, #2d3748);\n  word-wrap: break-word;\n}\n.preview-segment-text[_ngcontent-%COMP%] {\n  color: var(--primary-text, #2d3748);\n}\n.preview-segment-placeholder[_ngcontent-%COMP%] {\n  display: inline-block;\n  padding: 2px 8px;\n  background:\n    linear-gradient(\n      135deg,\n      #667eea 0%,\n      #764ba2 100%);\n  color: white;\n  border-radius: 4px;\n  font-weight: 600;\n  font-family: "Courier New", monospace;\n  font-size: 13px;\n  margin: 0 2px;\n  cursor: help;\n  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);\n  opacity: 0.6;\n}\n.preview-segment-substituted[_ngcontent-%COMP%] {\n  display: inline-block;\n  padding: 2px 8px;\n  background:\n    linear-gradient(\n      135deg,\n      #10b981 0%,\n      #059669 100%);\n  color: white;\n  border-radius: 4px;\n  font-weight: 600;\n  font-family: "Courier New", monospace;\n  font-size: 13px;\n  margin: 0 2px;\n  cursor: help;\n  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);\n}\n.action-buttons[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 8px;\n  margin-top: 4px;\n}\n.btn-action[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  padding: 6px 12px;\n  font-size: 13px;\n  font-weight: 500;\n  border: none;\n  border-radius: 4px;\n  cursor: pointer;\n  transition: all 0.2s ease;\n}\n.btn-action[_ngcontent-%COMP%]   svg[_ngcontent-%COMP%] {\n  flex-shrink: 0;\n}\n.btn-action[_ngcontent-%COMP%]:disabled {\n  opacity: 0.5;\n  cursor: not-allowed;\n}\n.btn-edit[_ngcontent-%COMP%] {\n  background: var(--accent-color, #667eea);\n  color: white;\n}\n.btn-edit[_ngcontent-%COMP%]:hover:not(:disabled) {\n  background: var(--accent-color-hover, #5568d3);\n}\n.btn-delete[_ngcontent-%COMP%] {\n  background: var(--danger-color, #e53e3e);\n  color: white;\n}\n.btn-delete[_ngcontent-%COMP%]:hover:not(:disabled) {\n  background: var(--danger-color-hover, #c53030);\n}\n.dialog-overlay[_ngcontent-%COMP%] {\n  position: fixed;\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  background: rgba(0, 0, 0, 0.5);\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  z-index: 1000;\n  animation: _ngcontent-%COMP%_fadeIn 0.2s ease;\n}\n@keyframes _ngcontent-%COMP%_fadeIn {\n  from {\n    opacity: 0;\n  }\n  to {\n    opacity: 1;\n  }\n}\n.dialog-content[_ngcontent-%COMP%] {\n  background: var(--card-background, white);\n  border-radius: 8px;\n  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);\n  width: 90%;\n  max-width: 600px;\n  max-height: 90vh;\n  display: flex;\n  flex-direction: column;\n  animation: _ngcontent-%COMP%_slideUp 0.3s ease;\n}\n@keyframes _ngcontent-%COMP%_slideUp {\n  from {\n    transform: translateY(20px);\n    opacity: 0;\n  }\n  to {\n    transform: translateY(0);\n    opacity: 1;\n  }\n}\n.dialog-content.delete-dialog[_ngcontent-%COMP%] {\n  max-width: 500px;\n}\n.dialog-header[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 16px 20px;\n  border-bottom: 1px solid var(--border-color, #e2e8f0);\n}\n.dialog-header[_ngcontent-%COMP%]   h3[_ngcontent-%COMP%] {\n  margin: 0;\n  font-size: 18px;\n  font-weight: 600;\n  color: var(--primary-text, #2d3748);\n}\n.close-btn[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 32px;\n  height: 32px;\n  padding: 0;\n  background: transparent;\n  border: none;\n  border-radius: 4px;\n  cursor: pointer;\n  color: var(--secondary-text, #718096);\n  transition: all 0.2s ease;\n}\n.close-btn[_ngcontent-%COMP%]:hover {\n  background: var(--secondary-background, #f0f2f5);\n  color: var(--primary-text, #2d3748);\n}\n.dialog-body[_ngcontent-%COMP%] {\n  padding: 20px;\n  overflow-y: auto;\n  flex: 1;\n}\n.error-message[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: flex-start;\n  gap: 8px;\n  padding: 12px;\n  background: #fee;\n  border: 1px solid #fcc;\n  border-radius: 6px;\n  color: #c33;\n  font-size: 14px;\n  margin-bottom: 16px;\n}\n.error-message[_ngcontent-%COMP%]   svg[_ngcontent-%COMP%] {\n  flex-shrink: 0;\n  margin-top: 2px;\n}\n.form-field[_ngcontent-%COMP%] {\n  margin-bottom: 16px;\n}\n.field-label[_ngcontent-%COMP%] {\n  display: block;\n  font-size: 14px;\n  font-weight: 500;\n  color: var(--primary-text, #2d3748);\n  margin-bottom: 6px;\n}\n.field-input[_ngcontent-%COMP%] {\n  width: 100%;\n  padding: 10px 12px;\n  font-size: 14px;\n  border: 2px solid var(--border-color, #dee2e6);\n  border-radius: 6px;\n  background: var(--card-background, white);\n  color: var(--primary-text, #2d3748);\n  transition: all 0.3s ease;\n}\n.field-input[_ngcontent-%COMP%]:focus {\n  outline: none;\n  border-color: var(--accent-color, #667eea);\n  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);\n}\n.field-input[_ngcontent-%COMP%]:disabled {\n  opacity: 0.6;\n  cursor: not-allowed;\n  background: var(--disabled-background, #f5f5f5);\n}\n.phrase-builder-section[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 12px;\n}\n.phrase-builder-header[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  flex-wrap: wrap;\n}\n.delete-message[_ngcontent-%COMP%] {\n  font-size: 14px;\n  line-height: 1.6;\n  color: var(--primary-text, #2d3748);\n  margin: 0 0 16px 0;\n}\n.delete-message[_ngcontent-%COMP%]   strong[_ngcontent-%COMP%] {\n  color: var(--danger-color, #e53e3e);\n}\n.dialog-footer[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  justify-content: flex-end;\n  gap: 12px;\n  padding: 16px 20px;\n  border-top: 1px solid var(--border-color, #e2e8f0);\n}\n.btn[_ngcontent-%COMP%] {\n  padding: 10px 20px;\n  font-size: 14px;\n  font-weight: 500;\n  border: none;\n  border-radius: 6px;\n  cursor: pointer;\n  transition: all 0.2s ease;\n}\n.btn-primary[_ngcontent-%COMP%] {\n  background: var(--accent-color, #667eea);\n  color: white;\n}\n.btn-primary[_ngcontent-%COMP%]:hover {\n  background: var(--accent-color-hover, #5568d3);\n}\n.btn-secondary[_ngcontent-%COMP%] {\n  background: var(--secondary-background, #e2e8f0);\n  color: var(--primary-text, #2d3748);\n}\n.btn-secondary[_ngcontent-%COMP%]:hover {\n  background: var(--secondary-background-hover, #cbd5e0);\n}\n.btn-danger[_ngcontent-%COMP%] {\n  background: var(--danger-color, #e53e3e);\n  color: white;\n}\n.btn-danger[_ngcontent-%COMP%]:hover {\n  background: var(--danger-color-hover, #c53030);\n}\n.clipboard-container[_ngcontent-%COMP%] {\n  border: 1px solid var(--border-color, #dee2e6);\n  border-radius: 4px;\n  background-color: var(--card-background, white);\n  margin-top: 8px;\n  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);\n}\n.clipboard-header[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 10px 12px;\n  border-bottom: 1px solid var(--border-color, #dee2e6);\n  cursor: pointer;\n  -webkit-user-select: none;\n  user-select: none;\n  transition: background-color 0.2s ease;\n  background-color: var(--secondary-background, #f7fafc);\n}\n.clipboard-header[_ngcontent-%COMP%]:hover {\n  background-color: var(--hover-color, #edf2f7);\n}\n.clipboard-header-content[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  flex: 1;\n}\n.clipboard-title[_ngcontent-%COMP%] {\n  font-size: 13px;\n  font-weight: 600;\n  color: var(--primary-text, #2d3748);\n}\n.clipboard-count[_ngcontent-%COMP%] {\n  font-size: 11px;\n  color: var(--primary-text, #2d3748);\n  background-color: var(--accent-color-shadow, #e3f2fd);\n  padding: 2px 8px;\n  border-radius: 10px;\n}\n.clipboard-collapse-btn[_ngcontent-%COMP%] {\n  background: none;\n  border: none;\n  cursor: pointer;\n  padding: 4px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  color: var(--primary-text, #2d3748);\n}\n.clipboard-collapse-btn[_ngcontent-%COMP%]   .collapse-icon[_ngcontent-%COMP%] {\n  font-size: 11px;\n  transition: transform 0.2s ease;\n}\n.clipboard-collapse-btn.collapsed[_ngcontent-%COMP%]   .collapse-icon[_ngcontent-%COMP%] {\n  transform: rotate(-90deg);\n}\n.clipboard-actions[_ngcontent-%COMP%] {\n  padding: 8px 12px;\n  border-bottom: 1px solid var(--border-color, #dee2e6);\n  background-color: var(--secondary-background, #f7fafc);\n}\n.clipboard-add-btn[_ngcontent-%COMP%] {\n  width: 100%;\n  padding: 8px 12px;\n  background-color: var(--accent-color, #667eea);\n  color: white;\n  border: none;\n  border-radius: 4px;\n  cursor: pointer;\n  font-size: 12px;\n  font-weight: 500;\n  transition: all 0.2s ease;\n}\n.clipboard-add-btn[_ngcontent-%COMP%]:hover:not(:disabled) {\n  background-color: var(--accent-color-hover, #5568d3);\n}\n.clipboard-add-btn[_ngcontent-%COMP%]:disabled {\n  background-color: var(--secondary-background, #e2e8f0);\n  color: var(--secondary-text, #718096);\n  cursor: not-allowed;\n  border: 1px solid var(--border-color, #dee2e6);\n}\n.clipboard-list[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n  max-height: 200px;\n  overflow-y: auto;\n  padding: 10px 12px;\n}\n.clipboard-item[_ngcontent-%COMP%] {\n  padding: 8px 12px;\n  background-color: var(--primary-background, white);\n  border: 1px solid var(--border-color, #dee2e6);\n  border-radius: 4px;\n  cursor: pointer;\n  font-size: 12px;\n  text-align: left;\n  transition: all 0.2s ease;\n  color: var(--primary-text, #2d3748);\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n.clipboard-item[_ngcontent-%COMP%]:hover {\n  background-color: var(--secondary-background, #f7fafc);\n  border-color: var(--accent-color, #667eea);\n  color: var(--accent-color, #667eea);\n}\n.clipboard-item[_ngcontent-%COMP%]:active {\n  background-color: var(--accent-color-shadow, #e3f2fd);\n}\n.clipboard-empty[_ngcontent-%COMP%] {\n  padding: 16px;\n  text-align: center;\n  color: var(--secondary-text, #718096);\n  font-size: 12px;\n}\n@media (max-width: 768px) {\n  .phrase-builder-container[_ngcontent-%COMP%] {\n    padding: 12px;\n  }\n  .phrase-builder-controls[_ngcontent-%COMP%] {\n    flex-direction: column;\n    align-items: stretch;\n  }\n  .btn-add-placeholder[_ngcontent-%COMP%] {\n    width: 100%;\n    justify-content: center;\n  }\n  .dialog-content[_ngcontent-%COMP%] {\n    width: 95%;\n    max-height: 95vh;\n  }\n  .action-buttons[_ngcontent-%COMP%] {\n    flex-direction: column;\n  }\n  .btn-action[_ngcontent-%COMP%] {\n    width: 100%;\n    justify-content: center;\n  }\n}\n/*# sourceMappingURL=zero-energy-phrase-builder.component.css.map */'] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ZeroEnergyPhraseBuilderComponent, { className: "ZeroEnergyPhraseBuilderComponent", filePath: "src/app/shared/reactive-form/refactored/input-fields/zero-energy-phrase-builder/zero-energy-phrase-builder.component.ts", lineNumber: 38 });
})();

// src/app/shared/reactive-form/refactored/input-fields/form-group-input/form-group-input.component.ts
function FormGroupInputComponent_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 6);
    \u0275\u0275listener("click", function FormGroupInputComponent_Conditional_4_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onEditForAllClick());
    });
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275classProp("active", ctx_r1.editSharedEnabled());
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r1.editSharedEnabled() ? "Editing for All" : "Edit for All", " ");
  }
}
function FormGroupInputComponent_ng_container_6_Conditional_1_Case_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-searchable-select-input", 8);
  }
  if (rf & 2) {
    const field_r3 = \u0275\u0275nextContext(2).$implicit;
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275property("label", field_r3.label)("options", ctx_r1.getFieldOptions()(field_r3.options))("formControl", ctx_r1.getFormControl(field_r3.name))("categoryName", field_r3.name);
  }
}
function FormGroupInputComponent_ng_container_6_Conditional_1_Case_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-rf-value-select", 9);
  }
  if (rf & 2) {
    let tmp_6_0;
    const field_r3 = \u0275\u0275nextContext(2).$implicit;
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275property("categoryAlias", field_r3.categoryAlias || field_r3.name)("label", field_r3.label)("canManageValues", (tmp_6_0 = field_r3.canManageValues) !== null && tmp_6_0 !== void 0 ? tmp_6_0 : true)("formControl", ctx_r1.getFormControl(field_r3.name));
  }
}
function FormGroupInputComponent_ng_container_6_Conditional_1_Case_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-equipment-browser-input", 10);
  }
  if (rf & 2) {
    const field_r3 = \u0275\u0275nextContext(2).$implicit;
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275property("label", field_r3.label)("formControl", ctx_r1.getFormControl(field_r3.name));
  }
}
function FormGroupInputComponent_ng_container_6_Conditional_1_Case_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-equipment-list-manager", 11);
  }
  if (rf & 2) {
    let tmp_6_0;
    let tmp_9_0;
    let tmp_10_0;
    let tmp_11_0;
    const field_r3 = \u0275\u0275nextContext(2).$implicit;
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275property("label", field_r3.label)("formControl", ctx_r1.getFormControl(field_r3.name))("useUnifiedDialog", (tmp_6_0 = field_r3.context == null ? null : field_r3.context.useUnifiedDialog) !== null && tmp_6_0 !== void 0 ? tmp_6_0 : false)("currentLotoPointId", field_r3.context == null ? null : field_r3.context.currentLotoPointId)("currentLotoPointTagNumber", field_r3.context == null ? null : field_r3.context.currentLotoPointTagNumber)("conflictMode", (tmp_9_0 = field_r3.context == null ? null : field_r3.context.conflictMode) !== null && tmp_9_0 !== void 0 ? tmp_9_0 : "has-association")("requireLotoPointForDrawn", (tmp_10_0 = field_r3.context == null ? null : field_r3.context.requireLotoPointForDrawn) !== null && tmp_10_0 !== void 0 ? tmp_10_0 : false)("requireLotoPointForUnassociated", (tmp_11_0 = field_r3.context == null ? null : field_r3.context.requireLotoPointForUnassociated) !== null && tmp_11_0 !== void 0 ? tmp_11_0 : false);
  }
}
function FormGroupInputComponent_ng_container_6_Conditional_1_Case_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "app-zero-energy-phrase-builder", 14);
    \u0275\u0275listener("clipboardItemSelected", function FormGroupInputComponent_ng_container_6_Conditional_1_Case_5_Template_app_zero_energy_phrase_builder_clipboardItemSelected_0_listener($event) {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.onZeroEnergyClipboardPaste($event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    let tmp_6_0;
    const field_r3 = \u0275\u0275nextContext(2).$implicit;
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275property("label", field_r3.label)("categoryAlias", field_r3.categoryAlias || field_r3.name)("canManageValues", (tmp_6_0 = field_r3.canManageValues) !== null && tmp_6_0 !== void 0 ? tmp_6_0 : true)("selectedEquipment", ctx_r1.getFieldValue("templateEquipment"))("formControl", ctx_r1.getFormControl(field_r3.name));
  }
}
function FormGroupInputComponent_ng_container_6_Conditional_1_Case_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 13);
    \u0275\u0275element(1, "input", 15);
    \u0275\u0275elementStart(2, "label", 16);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const field_r3 = \u0275\u0275nextContext(2).$implicit;
    \u0275\u0275advance();
    \u0275\u0275property("formControlName", field_r3.name)("id", field_r3.name);
    \u0275\u0275advance();
    \u0275\u0275property("for", field_r3.name);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(field_r3.label);
  }
}
function FormGroupInputComponent_ng_container_6_Conditional_1_Case_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "label", 17);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
    \u0275\u0275element(2, "textarea", 18);
  }
  if (rf & 2) {
    const field_r3 = \u0275\u0275nextContext(2).$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(field_r3.label);
    \u0275\u0275advance();
    \u0275\u0275property("formControlName", field_r3.name);
  }
}
function FormGroupInputComponent_ng_container_6_Conditional_1_Case_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "label", 17);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
    \u0275\u0275element(2, "input", 19);
  }
  if (rf & 2) {
    const field_r3 = \u0275\u0275nextContext(2).$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(field_r3.label);
    \u0275\u0275advance();
    \u0275\u0275property("formControlName", field_r3.name);
  }
}
function FormGroupInputComponent_ng_container_6_Conditional_1_Case_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "label", 17);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
    \u0275\u0275element(2, "input", 20);
  }
  if (rf & 2) {
    const field_r3 = \u0275\u0275nextContext(2).$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(field_r3.label);
    \u0275\u0275advance();
    \u0275\u0275property("formControlName", field_r3.name);
  }
}
function FormGroupInputComponent_ng_container_6_Conditional_1_Case_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "label", 17);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
    \u0275\u0275element(2, "input", 21);
  }
  if (rf & 2) {
    const field_r3 = \u0275\u0275nextContext(2).$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(field_r3.label);
    \u0275\u0275advance();
    \u0275\u0275property("formControlName", field_r3.name);
  }
}
function FormGroupInputComponent_ng_container_6_Conditional_1_Case_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "label", 17);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
    \u0275\u0275element(2, "input", 22);
  }
  if (rf & 2) {
    const field_r3 = \u0275\u0275nextContext(2).$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(field_r3.label);
    \u0275\u0275advance();
    \u0275\u0275property("formControlName", field_r3.name);
  }
}
function FormGroupInputComponent_ng_container_6_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 7);
    \u0275\u0275template(1, FormGroupInputComponent_ng_container_6_Conditional_1_Case_1_Template, 1, 4, "app-searchable-select-input", 8)(2, FormGroupInputComponent_ng_container_6_Conditional_1_Case_2_Template, 1, 4, "app-rf-value-select", 9)(3, FormGroupInputComponent_ng_container_6_Conditional_1_Case_3_Template, 1, 2, "app-equipment-browser-input", 10)(4, FormGroupInputComponent_ng_container_6_Conditional_1_Case_4_Template, 1, 8, "app-equipment-list-manager", 11)(5, FormGroupInputComponent_ng_container_6_Conditional_1_Case_5_Template, 1, 5, "app-zero-energy-phrase-builder", 12)(6, FormGroupInputComponent_ng_container_6_Conditional_1_Case_6_Template, 4, 4, "div", 13)(7, FormGroupInputComponent_ng_container_6_Conditional_1_Case_7_Template, 3, 2)(8, FormGroupInputComponent_ng_container_6_Conditional_1_Case_8_Template, 3, 2)(9, FormGroupInputComponent_ng_container_6_Conditional_1_Case_9_Template, 3, 2)(10, FormGroupInputComponent_ng_container_6_Conditional_1_Case_10_Template, 3, 2)(11, FormGroupInputComponent_ng_container_6_Conditional_1_Case_11_Template, 3, 2);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    let tmp_3_0;
    const field_r3 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275conditional((tmp_3_0 = field_r3.type) === "select" ? 1 : tmp_3_0 === "value-select" ? 2 : tmp_3_0 === "equipment-browser" ? 3 : tmp_3_0 === "equipment-list-manager" ? 4 : tmp_3_0 === "zero-energy-phrase-builder" ? 5 : tmp_3_0 === "checkbox" ? 6 : tmp_3_0 === "textarea" ? 7 : tmp_3_0 === "number" ? 8 : tmp_3_0 === "date" ? 9 : tmp_3_0 === "time" ? 10 : 11);
  }
}
function FormGroupInputComponent_ng_container_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, FormGroupInputComponent_ng_container_6_Conditional_1_Template, 12, 1, "div", 7);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const field_r3 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275conditional(field_r3.type !== "hidden" ? 1 : -1);
  }
}
var FormGroupInputComponent = class _FormGroupInputComponent {
  label = input("");
  fields = input([]);
  formGroup = input.required();
  layout = input("column");
  context = input(null);
  // Edit for All state
  editSharedEnabled = signal(false);
  lotoPointApi = inject(RfLotoPointApiService);
  // Helper to get field options
  getFieldOptions = computed(() => {
    return (options) => {
      if (!options)
        return [];
      if (typeof options === "function")
        return options();
      if (Array.isArray(options))
        return options;
      return [];
    };
  });
  // Helper to get FormControl from FormGroup
  getFormControl(name) {
    const control = this.formGroup().get(name);
    if (!control || !(control instanceof FormControl)) {
      return new FormControl();
    }
    return control;
  }
  // Helper to get value from a sibling field (for zero-energy-phrase-builder to access templateEquipment)
  getFieldValue(name) {
    const control = this.formGroup().get(name);
    return control?.value || [];
  }
  // Handle clipboard paste for zero-energy-phrase-builder - updates templateEquipment field
  onZeroEnergyClipboardPaste(event) {
    const templateEquipmentControl = this.formGroup().get("templateEquipment");
    if (templateEquipmentControl && event.templateEquipment) {
      templateEquipmentControl.setValue(event.templateEquipment);
      templateEquipmentControl.markAsDirty();
    }
  }
  // Toggle "Edit for All" mode - fetches usage count and shows confirmation
  onEditForAllClick() {
    return __async(this, null, function* () {
      if (this.editSharedEnabled()) {
        this.editSharedEnabled.set(false);
        this.getFormControl("editShared")?.setValue(false);
        return;
      }
      const id = this.context()?.zeroEnergyId;
      if (!id)
        return;
      try {
        const response = yield firstValueFrom(this.lotoPointApi.getZeroEnergyUsageCount(id));
        const count = response.responseData;
        if (confirm(`This zero energy is shared by ${count} LOTO point(s). Changes will affect all of them. Continue?`)) {
          this.editSharedEnabled.set(true);
          this.getFormControl("editShared")?.setValue(true);
        }
      } catch (e) {
        console.error("Failed to fetch zero energy usage count", e);
      }
    });
  }
  static \u0275fac = function FormGroupInputComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _FormGroupInputComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _FormGroupInputComponent, selectors: [["app-form-group-input"]], inputs: { label: [1, "label"], fields: [1, "fields"], formGroup: [1, "formGroup"], layout: [1, "layout"], context: [1, "context"] }, decls: 7, vars: 6, consts: [[1, "form-group-container", 3, "formGroup"], [1, "form-group-header"], [1, "form-group-label"], ["type", "button", 1, "edit-shared-btn", 3, "active"], [1, "form-group-fields"], [4, "ngFor", "ngForOf"], ["type", "button", 1, "edit-shared-btn", 3, "click"], [1, "form-field"], [3, "label", "options", "formControl", "categoryName"], [3, "categoryAlias", "label", "canManageValues", "formControl"], [3, "label", "formControl"], [3, "label", "formControl", "useUnifiedDialog", "currentLotoPointId", "currentLotoPointTagNumber", "conflictMode", "requireLotoPointForDrawn", "requireLotoPointForUnassociated"], [3, "label", "categoryAlias", "canManageValues", "selectedEquipment", "formControl"], [1, "checkbox-field"], [3, "clipboardItemSelected", "label", "categoryAlias", "canManageValues", "selectedEquipment", "formControl"], ["type", "checkbox", 3, "formControlName", "id"], [3, "for"], [1, "field-label"], [1, "form-control", 3, "formControlName"], ["type", "number", 1, "form-control", 3, "formControlName"], ["type", "date", 1, "form-control", 3, "formControlName"], ["type", "time", 1, "form-control", 3, "formControlName"], ["type", "text", 1, "form-control", 3, "formControlName"]], template: function FormGroupInputComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "label", 2);
      \u0275\u0275text(3);
      \u0275\u0275elementEnd();
      \u0275\u0275template(4, FormGroupInputComponent_Conditional_4_Template, 2, 3, "button", 3);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(5, "div", 4);
      \u0275\u0275template(6, FormGroupInputComponent_ng_container_6_Template, 2, 1, "ng-container", 5);
      \u0275\u0275elementEnd()();
    }
    if (rf & 2) {
      let tmp_2_0;
      \u0275\u0275property("formGroup", ctx.formGroup());
      \u0275\u0275advance(3);
      \u0275\u0275textInterpolate(ctx.label());
      \u0275\u0275advance();
      \u0275\u0275conditional(((tmp_2_0 = ctx.context()) == null ? null : tmp_2_0.zeroEnergyId) ? 4 : -1);
      \u0275\u0275advance();
      \u0275\u0275classMap("form-group-layout-" + ctx.layout());
      \u0275\u0275advance();
      \u0275\u0275property("ngForOf", ctx.fields());
    }
  }, dependencies: [
    CommonModule,
    NgForOf,
    ReactiveFormsModule,
    DefaultValueAccessor,
    NumberValueAccessor,
    CheckboxControlValueAccessor,
    NgControlStatus,
    NgControlStatusGroup,
    FormControlDirective,
    FormGroupDirective,
    FormControlName,
    SearchableSelectInputComponent,
    EquipmentBrowserInputComponent,
    EquipmentListManagerComponent,
    RfValueSelectComponent,
    ZeroEnergyPhraseBuilderComponent
  ], styles: ["\n\n[_nghost-%COMP%] {\n  display: block;\n  width: 100%;\n}\n.form-group-container[_ngcontent-%COMP%] {\n  border: 1px solid var(--border-color);\n  border-radius: 4px;\n  padding: 1rem;\n  margin-bottom: 1rem;\n  background-color: var(--secondary-background);\n}\n.form-group-header[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  margin-bottom: 0.75rem;\n}\n.form-group-label[_ngcontent-%COMP%] {\n  display: block;\n  font-weight: 600;\n  font-size: 1rem;\n  color: var(--primary-text);\n  margin-bottom: 0;\n}\n.edit-shared-btn[_ngcontent-%COMP%] {\n  font-size: 0.85rem;\n  padding: 0.35rem 0.75rem;\n  border: 1px solid var(--accent-color);\n  border-radius: 4px;\n  background: var(--primary-background);\n  color: var(--accent-color);\n  font-weight: 600;\n  cursor: pointer;\n  transition: all 0.2s ease;\n}\n.edit-shared-btn[_ngcontent-%COMP%]:hover {\n  background: var(--accent-color);\n  color: white;\n}\n.edit-shared-btn.active[_ngcontent-%COMP%] {\n  background: var(--status-attention);\n  color: white;\n  border-color: var(--status-attention);\n}\n.form-group-fields[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 1rem;\n}\n.form-group-layout-column[_ngcontent-%COMP%] {\n  flex-direction: column;\n}\n.form-group-layout-row[_ngcontent-%COMP%] {\n  flex-direction: row;\n  flex-wrap: wrap;\n}\n.form-group-layout-grid[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));\n  gap: 1rem;\n}\n.form-field[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n}\n.field-label[_ngcontent-%COMP%] {\n  font-weight: 600;\n  margin-bottom: 0.5rem;\n  color: var(--primary-text);\n  font-size: 0.875rem;\n}\n.form-control[_ngcontent-%COMP%] {\n  padding: 0.5rem;\n  border: 1px solid var(--border-color);\n  border-radius: 4px;\n  font-size: 1rem;\n  background-color: var(--primary-background);\n  color: var(--primary-text);\n  transition: border-color 0.2s ease, box-shadow 0.2s ease;\n}\n.form-control[_ngcontent-%COMP%]:focus {\n  outline: none;\n  border-color: var(--accent-color);\n  box-shadow: 0 0 0 2px var(--accent-color-shadow);\n}\n.form-control[_ngcontent-%COMP%]::placeholder {\n  color: var(--secondary-text);\n}\n.form-control[readonly][_ngcontent-%COMP%] {\n  background-color: var(--secondary-background);\n  cursor: not-allowed;\n}\n.checkbox-field[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n}\n.checkbox-field[_ngcontent-%COMP%]   input[type=checkbox][_ngcontent-%COMP%] {\n  width: auto;\n  margin: 0;\n  accent-color: var(--accent-color);\n}\n.checkbox-field[_ngcontent-%COMP%]   label[_ngcontent-%COMP%] {\n  margin: 0;\n  font-weight: 500;\n  color: var(--primary-text);\n}\n/*# sourceMappingURL=form-group-input.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(FormGroupInputComponent, { className: "FormGroupInputComponent", filePath: "src/app/shared/reactive-form/refactored/input-fields/form-group-input/form-group-input.component.ts", lineNumber: 28 });
})();

// src/app/shared/reactive-form/refactored/input-fields/equipment-shape-drawer-input/equipment-shape-drawer-input.component.ts
function EquipmentShapeDrawerInputComponent_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 12);
    \u0275\u0275listener("click", function EquipmentShapeDrawerInputComponent_Conditional_7_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.clearShape());
    });
    \u0275\u0275text(1, " \xD7 ");
    \u0275\u0275elementEnd();
  }
}
var EquipmentShapeDrawerInputComponent = class _EquipmentShapeDrawerInputComponent {
  label = "Draw Equipment Shape";
  placeholder = "No shape drawn";
  // Services
  equipmentMapper = inject(EquipmentMapperService);
  fileMenuService = inject(FileMenuService);
  // State
  isDialogOpen = signal(false);
  drawnShapeInfo = signal(null);
  displayText = computed(() => {
    const shapeInfo = this.drawnShapeInfo();
    console.log("Shape info:", shapeInfo);
    if (shapeInfo) {
      return `Shape on ${shapeInfo.file.name}`;
    }
    return this.coordValue() ? `Shape (File ID: ${this.coordValue().fileId})` : this.placeholder;
  });
  // ControlValueAccessor
  coordValue = signal(null);
  value = signal(null);
  onChange = () => {
  };
  onTouched = () => {
  };
  disabled = false;
  writeValue(value) {
    this.value = value;
  }
  registerOnChange(fn) {
    this.onChange = fn;
  }
  registerOnTouched(fn) {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled) {
    this.disabled = isDisabled;
  }
  openDialog() {
    if (!this.disabled) {
      this.isDialogOpen.set(true);
    }
  }
  closeDialog() {
    this.isDialogOpen.set(false);
  }
  onShapeDrawn(data) {
    this.drawnShapeInfo.set(data);
    this.coordValue.set({
      coordinates: this.equipmentMapper.mapRfShapeToCoordinates(data.shape),
      fileId: data.file.id ?? 0,
      originalPictureSize: this.equipmentMapper.formatPictureSize(data.shape.originalPictureWidth, data.shape.originalPictureHeight)
    });
  }
  onSaveSuccess(data) {
    this.value.set(data);
    this.onChange(this.value);
    this.onTouched();
    this.closeDialog();
  }
  clearShape() {
    if (!this.disabled) {
      this.drawnShapeInfo.set(null);
      this.value.set(null);
      this.onChange(this.value);
      this.onTouched();
    }
  }
  getDisplayText() {
    const shapeInfo = this.drawnShapeInfo();
    if (shapeInfo) {
      console.log("Shape info:", shapeInfo);
      return `Shape on ${shapeInfo.file.name}`;
    }
    return this.coordValue() ? `Shape (File ID: ${this.coordValue().fileId})` : this.placeholder;
  }
  hasShape() {
    return this.drawnShapeInfo() !== null || this.value !== null;
  }
  static \u0275fac = function EquipmentShapeDrawerInputComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _EquipmentShapeDrawerInputComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _EquipmentShapeDrawerInputComponent, selectors: [["app-equipment-shape-drawer-input"]], inputs: { label: "label", placeholder: "placeholder" }, features: [\u0275\u0275ProvidersFeature([
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => _EquipmentShapeDrawerInputComponent),
      multi: true
    }
  ])], decls: 15, vars: 9, consts: [[1, "equipment-shape-drawer-input"], [1, "input-label"], [1, "input-container"], [1, "selected-display"], [1, "display-text"], ["type", "button", "title", "Clear shape", 1, "clear-btn"], ["type", "button", 1, "draw-btn", 3, "click", "disabled"], ["width", "16", "height", "16", "viewBox", "0 0 16 16", "fill", "currentColor"], ["d", "M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"], ["fill-rule", "evenodd", "d", "M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"], [3, "close", "isOpen", "title", "size"], [3, "saveSuccess", "shapeDrawn", "close"], ["type", "button", "title", "Clear shape", 1, "clear-btn", 3, "click"]], template: function EquipmentShapeDrawerInputComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "label", 1);
      \u0275\u0275text(2);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(3, "div", 2)(4, "div", 3)(5, "span", 4);
      \u0275\u0275text(6);
      \u0275\u0275elementEnd();
      \u0275\u0275template(7, EquipmentShapeDrawerInputComponent_Conditional_7_Template, 2, 0, "button", 5);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(8, "button", 6);
      \u0275\u0275listener("click", function EquipmentShapeDrawerInputComponent_Template_button_click_8_listener() {
        return ctx.openDialog();
      });
      \u0275\u0275namespaceSVG();
      \u0275\u0275elementStart(9, "svg", 7);
      \u0275\u0275element(10, "path", 8)(11, "path", 9);
      \u0275\u0275elementEnd();
      \u0275\u0275text(12, " Draw on P&ID ");
      \u0275\u0275elementEnd()()();
      \u0275\u0275namespaceHTML();
      \u0275\u0275elementStart(13, "app-rf-popup-projection", 10);
      \u0275\u0275listener("close", function EquipmentShapeDrawerInputComponent_Template_app_rf_popup_projection_close_13_listener() {
        return ctx.closeDialog();
      });
      \u0275\u0275elementStart(14, "app-equipment-shape-drawer-dialog", 11);
      \u0275\u0275listener("saveSuccess", function EquipmentShapeDrawerInputComponent_Template_app_equipment_shape_drawer_dialog_saveSuccess_14_listener($event) {
        return ctx.onSaveSuccess($event);
      })("shapeDrawn", function EquipmentShapeDrawerInputComponent_Template_app_equipment_shape_drawer_dialog_shapeDrawn_14_listener($event) {
        return ctx.onShapeDrawn($event);
      })("close", function EquipmentShapeDrawerInputComponent_Template_app_equipment_shape_drawer_dialog_close_14_listener() {
        return ctx.closeDialog();
      });
      \u0275\u0275elementEnd()();
    }
    if (rf & 2) {
      \u0275\u0275advance(2);
      \u0275\u0275textInterpolate(ctx.label);
      \u0275\u0275advance(2);
      \u0275\u0275classProp("disabled", ctx.disabled);
      \u0275\u0275advance(2);
      \u0275\u0275textInterpolate(ctx.displayText());
      \u0275\u0275advance();
      \u0275\u0275conditional(ctx.hasShape() && !ctx.disabled ? 7 : -1);
      \u0275\u0275advance();
      \u0275\u0275property("disabled", ctx.disabled);
      \u0275\u0275advance(5);
      \u0275\u0275property("isOpen", ctx.isDialogOpen())("title", "Draw Equipment Shape on P&ID")("size", "large");
    }
  }, dependencies: [CommonModule, RfPopupProjectionComponent, EquipmentShapeDrawerDialogComponent], styles: ["\n\n.equipment-shape-drawer-input[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 0.5rem;\n}\n.input-label[_ngcontent-%COMP%] {\n  font-weight: 500;\n  color: #333;\n  font-size: 0.9rem;\n}\n.input-container[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 0.5rem;\n  align-items: stretch;\n}\n.selected-display[_ngcontent-%COMP%] {\n  flex: 1;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 0.5rem 1rem;\n  border: 1px solid #ccc;\n  border-radius: 4px;\n  background-color: #fff;\n  min-height: 38px;\n}\n.selected-display.disabled[_ngcontent-%COMP%] {\n  background-color: #f5f5f5;\n  color: #999;\n  cursor: not-allowed;\n}\n.display-text[_ngcontent-%COMP%] {\n  flex: 1;\n  font-size: 0.9rem;\n  color: #333;\n}\n.selected-display.disabled[_ngcontent-%COMP%]   .display-text[_ngcontent-%COMP%] {\n  color: #999;\n}\n.clear-btn[_ngcontent-%COMP%] {\n  background: none;\n  border: none;\n  font-size: 1.5rem;\n  color: #999;\n  cursor: pointer;\n  padding: 0;\n  width: 24px;\n  height: 24px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  border-radius: 50%;\n  transition: background-color 0.2s, color 0.2s;\n}\n.clear-btn[_ngcontent-%COMP%]:hover {\n  background-color: #f0f0f0;\n  color: #333;\n}\n.draw-btn[_ngcontent-%COMP%] {\n  padding: 0.5rem 1.5rem;\n  background-color: #28a745;\n  color: white;\n  border: none;\n  border-radius: 4px;\n  font-size: 0.9rem;\n  cursor: pointer;\n  white-space: nowrap;\n  transition: background-color 0.2s;\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n}\n.draw-btn[_ngcontent-%COMP%]:hover:not(:disabled) {\n  background-color: #218838;\n}\n.draw-btn[_ngcontent-%COMP%]:disabled {\n  background-color: #ccc;\n  cursor: not-allowed;\n  opacity: 0.6;\n}\n.draw-btn[_ngcontent-%COMP%]   svg[_ngcontent-%COMP%] {\n  flex-shrink: 0;\n}\n/*# sourceMappingURL=equipment-shape-drawer-input.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(EquipmentShapeDrawerInputComponent, { className: "EquipmentShapeDrawerInputComponent", filePath: "src/app/shared/reactive-form/refactored/input-fields/equipment-shape-drawer-input/equipment-shape-drawer-input.component.ts", lineNumber: 26 });
})();

// src/app/features/values/refactored/components/rf-multi-value-select/rf-multi-value-select.component.ts
var _c09 = ["multiSelectInput"];
function RfMultiValueSelectComponent_Conditional_4_Conditional_12_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 9);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r2.errorMessage());
  }
}
function RfMultiValueSelectComponent_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 4);
    \u0275\u0275listener("click", function RfMultiValueSelectComponent_Conditional_4_Template_div_click_0_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.closeDialog());
    });
    \u0275\u0275elementStart(1, "div", 5);
    \u0275\u0275listener("click", function RfMultiValueSelectComponent_Conditional_4_Template_div_click_1_listener($event) {
      \u0275\u0275restoreView(_r2);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275elementStart(2, "h3");
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "div", 6)(5, "label");
    \u0275\u0275text(6, "Name:");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "input", 7);
    \u0275\u0275twoWayListener("ngModelChange", function RfMultiValueSelectComponent_Conditional_4_Template_input_ngModelChange_7_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r2.dialogValueName, $event) || (ctx_r2.dialogValueName = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("keyup.enter", function RfMultiValueSelectComponent_Conditional_4_Template_input_keyup_enter_7_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.saveValue());
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(8, "div", 6)(9, "label");
    \u0275\u0275text(10, "Alias (optional):");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(11, "input", 8);
    \u0275\u0275twoWayListener("ngModelChange", function RfMultiValueSelectComponent_Conditional_4_Template_input_ngModelChange_11_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r2.dialogValueAlias, $event) || (ctx_r2.dialogValueAlias = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("keyup.enter", function RfMultiValueSelectComponent_Conditional_4_Template_input_keyup_enter_11_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.saveValue());
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275template(12, RfMultiValueSelectComponent_Conditional_4_Conditional_12_Template, 2, 1, "div", 9);
    \u0275\u0275elementStart(13, "div", 10)(14, "button", 11);
    \u0275\u0275listener("click", function RfMultiValueSelectComponent_Conditional_4_Template_button_click_14_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.saveValue());
    });
    \u0275\u0275text(15, " Save ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(16, "button", 12);
    \u0275\u0275listener("click", function RfMultiValueSelectComponent_Conditional_4_Template_button_click_16_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.closeDialog());
    });
    \u0275\u0275text(17, " Cancel ");
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1("Add ", ctx_r2.label(), "");
    \u0275\u0275advance(4);
    \u0275\u0275twoWayProperty("ngModel", ctx_r2.dialogValueName);
    \u0275\u0275advance(4);
    \u0275\u0275twoWayProperty("ngModel", ctx_r2.dialogValueAlias);
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r2.errorMessage() ? 12 : -1);
    \u0275\u0275advance(2);
    \u0275\u0275property("disabled", !ctx_r2.dialogValueName);
  }
}
var RfMultiValueSelectComponent = class _RfMultiValueSelectComponent {
  valueService = inject(RfValueService);
  multiSelectInput;
  // Inputs
  categoryAlias = input.required();
  label = input("Values");
  canManageValues = input(true);
  // State
  values = signal([]);
  disabled = signal(false);
  // Computed options based on categoryAlias
  options = computed(() => {
    const alias = this.categoryAlias();
    if (!alias)
      return [];
    const optionsSignal = this.valueService.getValueOptions(alias);
    return optionsSignal();
  });
  // Dialog state for Add/Edit
  showDialog = signal(false);
  dialogMode = signal("add");
  dialogValueName = "";
  dialogValueAlias = "";
  errorMessage = signal("");
  // ControlValueAccessor
  onChange = (value) => {
  };
  onTouched = () => {
  };
  pendingValue = void 0;
  hasPendingValue = false;
  ngAfterViewInit() {
    if (this.multiSelectInput) {
      this.multiSelectInput.registerOnChange((val) => {
        this.values.set(val);
        this.onChange(val);
      });
      this.multiSelectInput.registerOnTouched(() => {
        this.onTouched();
      });
      if (this.hasPendingValue) {
        this.multiSelectInput.writeValue(this.pendingValue);
        this.hasPendingValue = false;
        this.pendingValue = void 0;
      }
    }
  }
  // ==================== ControlValueAccessor Methods ====================
  writeValue(value) {
    this.values.set(value || []);
    if (this.multiSelectInput) {
      this.multiSelectInput.writeValue(value || []);
    } else {
      this.pendingValue = value || [];
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
  }
  // ==================== Searchable Multi-Select Event Handlers ====================
  onAddNew() {
    this.dialogMode.set("add");
    this.dialogValueName = "";
    this.dialogValueAlias = "";
    this.errorMessage.set("");
    this.showDialog.set(true);
  }
  onEdit() {
    this.onAddNew();
  }
  // ==================== Add Dialog ====================
  closeDialog() {
    this.showDialog.set(false);
    this.dialogValueName = "";
    this.dialogValueAlias = "";
    this.errorMessage.set("");
  }
  saveValue() {
    if (!this.dialogValueName.trim()) {
      this.errorMessage.set("Name is required");
      return;
    }
    const alias = this.categoryAlias();
    this.valueService.createValue(alias, this.dialogValueName, this.dialogValueAlias).subscribe({
      next: (newValue) => {
        this.closeDialog();
        this.valueService.refreshCategory(alias);
        this.values.update((current) => [...current, newValue.id]);
        this.onChange(this.values());
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || "Error creating value");
      }
    });
  }
  static \u0275fac = function RfMultiValueSelectComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _RfMultiValueSelectComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _RfMultiValueSelectComponent, selectors: [["app-rf-multi-value-select"]], viewQuery: function RfMultiValueSelectComponent_Query(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275viewQuery(_c09, 5);
    }
    if (rf & 2) {
      let _t;
      \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.multiSelectInput = _t.first);
    }
  }, inputs: { categoryAlias: [1, "categoryAlias"], label: [1, "label"], canManageValues: [1, "canManageValues"] }, features: [\u0275\u0275ProvidersFeature([{
    provide: NG_VALUE_ACCESSOR,
    useExisting: _RfMultiValueSelectComponent,
    multi: true
  }])], decls: 5, vars: 4, consts: [["multiSelectInput", ""], [1, "rf-multi-value-select"], [3, "addNewOption", "editOption", "label", "options", "categoryName"], [1, "dialog-overlay"], [1, "dialog-overlay", 3, "click"], [1, "dialog-content", 3, "click"], [1, "form-group"], ["type", "text", "placeholder", "Enter name", 1, "input-field", 3, "ngModelChange", "keyup.enter", "ngModel"], ["type", "text", "placeholder", "Enter alias", 1, "input-field", 3, "ngModelChange", "keyup.enter", "ngModel"], [1, "error-message"], [1, "dialog-actions"], [1, "save-btn", 3, "click", "disabled"], [1, "cancel-btn", 3, "click"]], template: function RfMultiValueSelectComponent_Template(rf, ctx) {
    if (rf & 1) {
      const _r1 = \u0275\u0275getCurrentView();
      \u0275\u0275elementStart(0, "div", 1)(1, "div")(2, "app-searchable-multi-select-input", 2, 0);
      \u0275\u0275listener("addNewOption", function RfMultiValueSelectComponent_Template_app_searchable_multi_select_input_addNewOption_2_listener() {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.onAddNew());
      })("editOption", function RfMultiValueSelectComponent_Template_app_searchable_multi_select_input_editOption_2_listener() {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.onEdit());
      });
      \u0275\u0275elementEnd()();
      \u0275\u0275template(4, RfMultiValueSelectComponent_Conditional_4_Template, 18, 5, "div", 3);
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      \u0275\u0275advance(2);
      \u0275\u0275property("label", ctx.label())("options", ctx.options())("categoryName", ctx.canManageValues() ? ctx.label() : "");
      \u0275\u0275advance(2);
      \u0275\u0275conditional(ctx.showDialog() ? 4 : -1);
    }
  }, dependencies: [CommonModule, FormsModule, DefaultValueAccessor, NgControlStatus, NgModel, SearchableMultiSelectInputComponent], styles: ["\n\n.rf-multi-value-select[_ngcontent-%COMP%] {\n  position: relative;\n  width: 100%;\n}\n.dialog-overlay[_ngcontent-%COMP%] {\n  position: fixed;\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  background: rgba(0, 0, 0, 0.5);\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  z-index: 1000;\n}\n.dialog-content[_ngcontent-%COMP%] {\n  background: white;\n  padding: 24px;\n  border-radius: 8px;\n  min-width: 400px;\n  max-width: 90vw;\n  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);\n}\n.dialog-content[_ngcontent-%COMP%]   h3[_ngcontent-%COMP%] {\n  margin: 0 0 20px 0;\n  font-size: 18px;\n  font-weight: 600;\n}\n.form-group[_ngcontent-%COMP%] {\n  margin-bottom: 16px;\n}\n.form-group[_ngcontent-%COMP%]   label[_ngcontent-%COMP%] {\n  display: block;\n  margin-bottom: 4px;\n  font-weight: 500;\n  font-size: 14px;\n}\n.input-field[_ngcontent-%COMP%] {\n  width: 100%;\n  padding: 8px;\n  border: 1px solid #ccc;\n  border-radius: 4px;\n  font-size: 14px;\n  box-sizing: border-box;\n}\n.input-field[_ngcontent-%COMP%]:focus {\n  outline: none;\n  border-color: #2196f3;\n  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);\n}\n.dialog-actions[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 8px;\n  justify-content: flex-end;\n  margin-top: 20px;\n}\n.save-btn[_ngcontent-%COMP%] {\n  padding: 8px 16px;\n  background: #4caf50;\n  color: white;\n  border: none;\n  border-radius: 4px;\n  cursor: pointer;\n  font-size: 14px;\n  font-weight: 500;\n  transition: background 0.2s;\n}\n.save-btn[_ngcontent-%COMP%]:hover:not(:disabled) {\n  background: #45a049;\n}\n.save-btn[_ngcontent-%COMP%]:disabled {\n  background: #ccc;\n  cursor: not-allowed;\n}\n.cancel-btn[_ngcontent-%COMP%] {\n  padding: 8px 16px;\n  background: #f5f5f5;\n  border: 1px solid #ccc;\n  border-radius: 4px;\n  cursor: pointer;\n  font-size: 14px;\n  transition: background 0.2s;\n}\n.cancel-btn[_ngcontent-%COMP%]:hover {\n  background: #e0e0e0;\n}\n.error-message[_ngcontent-%COMP%] {\n  color: #f44336;\n  font-size: 13px;\n  margin-top: 8px;\n  padding: 8px;\n  background: #ffebee;\n  border-radius: 4px;\n  border-left: 3px solid #f44336;\n}\n/*# sourceMappingURL=rf-multi-value-select.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(RfMultiValueSelectComponent, { className: "RfMultiValueSelectComponent", filePath: "src/app/features/values/refactored/components/rf-multi-value-select/rf-multi-value-select.component.ts", lineNumber: 19 });
})();

// src/app/shared/reactive-form/refactored/input-fields/file-input/file-input.component.ts
function FileInputComponent_Conditional_11_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 7)(1, "span", 8);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "button", 9);
    \u0275\u0275listener("click", function FileInputComponent_Conditional_11_Template_button_click_3_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.handleFile(null));
    });
    \u0275\u0275text(4, "Remove");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(ctx_r1.file.name);
  }
}
var FileInputComponent = class _FileInputComponent {
  host;
  label = "Choose File";
  accept = "*/*";
  fileSelected = new EventEmitter();
  file = null;
  onChange = () => {
  };
  onTouched = () => {
  };
  isDragover = false;
  constructor(host) {
    this.host = host;
  }
  emitFiles(event) {
    const target = event.target;
    const files = target.files;
    const file = files && files.item(0);
    this.handleFile(file);
  }
  onDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragover = true;
  }
  onDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragover = false;
  }
  onDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragover = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }
  writeValue(value) {
    this.host.nativeElement.value = "";
    this.file = null;
  }
  registerOnChange(fn) {
    this.onChange = fn;
  }
  registerOnTouched(fn) {
    this.onTouched = fn;
  }
  onFileSelected(event) {
    const input2 = event.target;
    if (input2.files && input2.files.length > 0) {
      this.handleFile(input2.files[0]);
    }
  }
  handleFile(file) {
    this.file = file;
    this.onChange(file);
    this.onTouched();
    if (file) {
      const nameWithoutExtension = this.getNameWithoutExtension(file.name);
      this.fileSelected.emit({ file, nameWithoutExtension });
    }
  }
  getNameWithoutExtension(filename) {
    const lastDotIndex = filename.lastIndexOf(".");
    return lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
  }
  static \u0275fac = function FileInputComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _FileInputComponent)(\u0275\u0275directiveInject(ElementRef));
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _FileInputComponent, selectors: [["app-file-input"]], hostBindings: function FileInputComponent_HostBindings(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275listener("change", function FileInputComponent_change_HostBindingHandler($event) {
        return ctx.emitFiles($event);
      })("dragover", function FileInputComponent_dragover_HostBindingHandler($event) {
        return ctx.onDragOver($event);
      })("dragleave", function FileInputComponent_dragleave_HostBindingHandler($event) {
        return ctx.onDragLeave($event);
      })("drop", function FileInputComponent_drop_HostBindingHandler($event) {
        return ctx.onDrop($event);
      });
    }
  }, inputs: { label: "label", accept: "accept" }, outputs: { fileSelected: "fileSelected" }, features: [\u0275\u0275ProvidersFeature([
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => _FileInputComponent),
      multi: true
    }
  ])], decls: 12, vars: 5, consts: [[1, "file-input-wrapper"], [1, "label-container"], [1, "field-label"], [1, "file-input-container"], [1, "drop-zone"], [1, "file-input-button"], ["type", "file", 1, "file-input", 3, "change", "accept"], [1, "file-info"], [1, "file-name"], ["type", "button", 1, "remove-file", 3, "click"]], template: function FileInputComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "label", 2);
      \u0275\u0275text(3);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(4, "div", 3)(5, "div", 4)(6, "p");
      \u0275\u0275text(7, "Drag and drop a file here, or");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(8, "label", 5);
      \u0275\u0275text(9, " Choose File ");
      \u0275\u0275elementStart(10, "input", 6);
      \u0275\u0275listener("change", function FileInputComponent_Template_input_change_10_listener($event) {
        return ctx.onFileSelected($event);
      });
      \u0275\u0275elementEnd()()();
      \u0275\u0275template(11, FileInputComponent_Conditional_11_Template, 5, 1, "div", 7);
      \u0275\u0275elementEnd()();
    }
    if (rf & 2) {
      \u0275\u0275advance(3);
      \u0275\u0275textInterpolate(ctx.label);
      \u0275\u0275advance();
      \u0275\u0275classProp("dragover", ctx.isDragover);
      \u0275\u0275advance(6);
      \u0275\u0275property("accept", ctx.accept);
      \u0275\u0275advance();
      \u0275\u0275conditional(ctx.file ? 11 : -1);
    }
  }, styles: ["\n\n.file-input-wrapper[_ngcontent-%COMP%] {\n  margin-bottom: 1rem;\n}\n.file-input-wrapper[_ngcontent-%COMP%]   .label-container[_ngcontent-%COMP%] {\n  margin-bottom: 0.5rem;\n}\n.file-input-wrapper[_ngcontent-%COMP%]   .field-label[_ngcontent-%COMP%] {\n  font-weight: 600;\n  font-size: 0.875rem;\n  color: var(--primary-text);\n}\n.file-input-container[_ngcontent-%COMP%] {\n  border: 2px dashed var(--border-color);\n  border-radius: 4px;\n  padding: 20px;\n  text-align: center;\n  transition: all 0.3s ease;\n  color: var(--primary-text);\n}\n.file-input-container.dragover[_ngcontent-%COMP%] {\n  background-color: var(--secondary-background);\n  border-color: var(--accent-color);\n}\n.drop-zone[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n}\n.file-input-label[_ngcontent-%COMP%] {\n  padding: 10px 15px;\n  background-color: var(--accent-color);\n  color: var(--header-text);\n  border-radius: 4px;\n  cursor: pointer;\n  display: inline-block;\n  margin-top: 10px;\n}\n.file-input[_ngcontent-%COMP%] {\n  display: none;\n}\n.file-info[_ngcontent-%COMP%] {\n  margin-top: 15px;\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n}\n.file-name[_ngcontent-%COMP%] {\n  font-size: 0.9em;\n  color: var(--secondary-text);\n}\n.remove-file[_ngcontent-%COMP%] {\n  background-color: transparent;\n  color: var(--error-text, #d32f2f);\n  border: 1px solid var(--error-text, #d32f2f);\n  padding: 0.4rem 0.75rem;\n  border-radius: 4px;\n  cursor: pointer;\n  font-size: 0.75rem;\n  font-weight: 600;\n  transition: all 0.2s ease;\n}\n.remove-file[_ngcontent-%COMP%]:hover {\n  background-color: var(--error-background, #ffebee);\n  color: var(--error-text, #c62828);\n}\n.file-input-label[_ngcontent-%COMP%]:hover {\n  background-color: var(--accent-color-hover);\n}\n/*# sourceMappingURL=file-input.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(FileInputComponent, { className: "FileInputComponent", filePath: "src/app/shared/reactive-form/refactored/input-fields/file-input/file-input.component.ts", lineNumber: 18 });
})();

// src/app/shared/comments-dialog/comments-dialog.service.ts
var CommentsDialogService = class _CommentsDialogService {
  syncUpdateService = inject(SyncUpdateService);
  destroyRef = inject(DestroyRef);
  _isVisible = signal(false);
  _entityType = signal("");
  _entityId = signal(0);
  _onOpen = new Subject();
  // Comment change notification for real-time updates
  _commentChanged = new Subject();
  commentChanged$ = this._commentChanged.pipe(debounceTime(300));
  isVisible = this._isVisible.asReadonly();
  entityType = this._entityType.asReadonly();
  entityId = this._entityId.asReadonly();
  onOpen$ = this._onOpen.asObservable();
  constructor() {
    this.syncUpdateService.getEntityTypeUpdates$("Comment").pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      const entityTypeChange = event.changes?.find((c) => c.fieldName === "entityType");
      const entityIdChange = event.changes?.find((c) => c.fieldName === "entityId");
      if (entityTypeChange?.newValue && entityIdChange?.newValue) {
        try {
          const parentType = JSON.parse(entityTypeChange.newValue);
          const parentId = Number(JSON.parse(entityIdChange.newValue));
          this._commentChanged.next({ entityType: parentType, entityId: parentId });
        } catch {
          this._commentChanged.next(null);
        }
      } else {
        this._commentChanged.next(null);
      }
    });
  }
  emitCommentChanged(entityType, entityId) {
    this._commentChanged.next({ entityType, entityId });
  }
  open(entityType, entityId) {
    this._entityType.set(entityType);
    this._entityId.set(entityId);
    this._isVisible.set(true);
    this._onOpen.next();
  }
  close() {
    this._isVisible.set(false);
    this._entityType.set("");
    this._entityId.set(0);
  }
  static \u0275fac = function CommentsDialogService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _CommentsDialogService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _CommentsDialogService, factory: _CommentsDialogService.\u0275fac, providedIn: "root" });
};

// src/app/services/comment.service.ts
var CommentService = class _CommentService {
  http;
  apiUrl = `${environment.apiUrl}/comments`;
  constructor(http) {
    this.http = http;
  }
  getCommentsForEntity(entityType, entityId) {
    return this.http.get(`${this.apiUrl}/${entityType}/${entityId}`);
  }
  createComment(comment) {
    return this.http.post(this.apiUrl, comment.toJson());
  }
  updateComment(id, comment) {
    return this.http.put(`${this.apiUrl}/${id}`, comment.toJson());
  }
  deleteComment(id) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
  static \u0275fac = function CommentService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _CommentService)(\u0275\u0275inject(HttpClient));
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _CommentService, factory: _CommentService.\u0275fac, providedIn: "root" });
};

// src/app/models/base/comment.model.ts
var CommentDto = class _CommentDto extends BaseDto {
  content;
  entityId;
  entityType;
  commentType;
  needsAttention;
  isResolved;
  createdBy;
  dateCreated;
  dateModified;
  constructor(data = {}) {
    super(data);
    this.content = data.content || "";
    this.entityId = data.entityId || 0;
    this.entityType = data.entityType || "";
    this.commentType = data.commentType ?? new ValueDto();
    this.needsAttention = data.needsAttention ?? false;
    this.isResolved = data.isResolved ?? false;
    this.createdBy = data.createdBy || "";
    this.dateCreated = data.dateCreated || "";
    this.dateModified = data.dateModified || "";
  }
  toJson() {
    const json = {
      id: this.id || null,
      content: this.content,
      entityId: this.entityId,
      entityType: this.entityType,
      needsAttention: this.needsAttention,
      isResolved: this.isResolved
    };
    if (this.commentType?.id) {
      json.commentType = this.commentType.toJson();
    }
    return json;
  }
  static fromJson(json) {
    if (!json) {
      console.warn("Received null or undefined json in CommentDto.fromJson");
      return new _CommentDto();
    }
    return new _CommentDto(__spreadProps(__spreadValues({}, super.fromJson(json)), {
      content: json.content || "",
      entityId: json.entityId || 0,
      entityType: json.entityType || "",
      commentType: ValueDto.fromJson(json.commentType),
      needsAttention: json.needsAttention ?? false,
      isResolved: json.isResolved ?? false,
      createdBy: json.createdBy || "",
      dateCreated: json.dateCreated || "",
      dateModified: json.dateModified || ""
    }));
  }
};

// src/app/shared/reactive-form/refactored/input-fields/comment-input/comment-input.component.ts
function CommentInputComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 1)(1, "label");
    \u0275\u0275text(2);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(ctx_r0.label);
  }
}
function CommentInputComponent_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 3);
    \u0275\u0275text(1, "Save first to enable comments");
    \u0275\u0275elementEnd();
  }
}
function CommentInputComponent_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 4)(1, "span", 6);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "span", 7);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(ctx_r0.latestComment().createdBy);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(ctx_r0.latestComment().content);
  }
}
function CommentInputComponent_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 3);
    \u0275\u0275text(1, "No comments");
    \u0275\u0275elementEnd();
  }
}
var CommentInputComponent = class _CommentInputComponent {
  label = "";
  entityType = "";
  entityId = 0;
  dialogService = inject(CommentsDialogService);
  commentService = inject(CommentService);
  latestComment = signal(null);
  commentCount = signal(0);
  onChange = () => {
  };
  onTouched = () => {
  };
  writeValue(value) {
  }
  registerOnChange(fn) {
    this.onChange = fn;
  }
  registerOnTouched(fn) {
    this.onTouched = fn;
  }
  ngOnChanges() {
    if (this.entityType && this.entityId) {
      this.loadPreview();
    }
  }
  loadPreview() {
    this.commentService.getCommentsForEntity(this.entityType, this.entityId).subscribe({
      next: (response) => {
        const comments = (response.responseData || []).map((c) => CommentDto.fromJson(c));
        this.commentCount.set(comments.length);
        this.latestComment.set(comments.length > 0 ? comments[0] : null);
      }
    });
  }
  canOpenDialog() {
    return !!(this.entityType && this.entityId);
  }
  openDialog() {
    if (!this.entityType || !this.entityId) {
      console.warn("[CommentInput] Cannot open dialog - entityType:", this.entityType, "entityId:", this.entityId);
      return;
    }
    this.dialogService.open(this.entityType, this.entityId);
    this.onTouched();
  }
  static \u0275fac = function CommentInputComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _CommentInputComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _CommentInputComponent, selectors: [["app-comment-input"]], inputs: { label: "label", entityType: "entityType", entityId: "entityId" }, features: [\u0275\u0275ProvidersFeature([
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => _CommentInputComponent),
      multi: true
    }
  ]), \u0275\u0275NgOnChangesFeature], decls: 8, vars: 6, consts: [[1, "comment-input-wrapper"], [1, "label-container"], [1, "comment-preview", 3, "click"], [1, "no-comments"], [1, "latest-comment"], ["type", "button", 1, "open-dialog-btn", 3, "click", "disabled"], [1, "comment-author"], [1, "comment-text"]], template: function CommentInputComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0);
      \u0275\u0275template(1, CommentInputComponent_Conditional_1_Template, 3, 1, "div", 1);
      \u0275\u0275elementStart(2, "div", 2);
      \u0275\u0275listener("click", function CommentInputComponent_Template_div_click_2_listener() {
        return ctx.openDialog();
      });
      \u0275\u0275template(3, CommentInputComponent_Conditional_3_Template, 2, 0, "span", 3)(4, CommentInputComponent_Conditional_4_Template, 5, 2, "div", 4)(5, CommentInputComponent_Conditional_5_Template, 2, 0, "span", 3);
      \u0275\u0275elementStart(6, "button", 5);
      \u0275\u0275listener("click", function CommentInputComponent_Template_button_click_6_listener($event) {
        ctx.openDialog();
        return $event.stopPropagation();
      });
      \u0275\u0275text(7);
      \u0275\u0275elementEnd()()();
    }
    if (rf & 2) {
      \u0275\u0275advance();
      \u0275\u0275conditional(ctx.label ? 1 : -1);
      \u0275\u0275advance();
      \u0275\u0275classProp("disabled", !ctx.canOpenDialog());
      \u0275\u0275advance();
      \u0275\u0275conditional(!ctx.canOpenDialog() ? 3 : ctx.latestComment() ? 4 : 5);
      \u0275\u0275advance(3);
      \u0275\u0275property("disabled", !ctx.canOpenDialog());
      \u0275\u0275advance();
      \u0275\u0275textInterpolate1(" ", ctx.commentCount() > 0 ? ctx.commentCount() + " comment" + (ctx.commentCount() > 1 ? "s" : "") : "Add comment", " ");
    }
  }, dependencies: [CommonModule], styles: ["\n\n.comment-input-wrapper[_ngcontent-%COMP%] {\n  width: 100%;\n}\n.label-container[_ngcontent-%COMP%] {\n  margin-bottom: 4px;\n}\n.label-container[_ngcontent-%COMP%]   label[_ngcontent-%COMP%] {\n  font-size: 13px;\n  font-weight: 500;\n  color: var(--text-secondary, #666);\n}\n.comment-preview[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 8px;\n  padding: 6px 10px;\n  border: 1px solid var(--border-color, #ddd);\n  border-radius: 4px;\n  cursor: pointer;\n  min-height: 36px;\n  background: var(--bg-color, #fff);\n}\n.comment-preview[_ngcontent-%COMP%]:hover {\n  border-color: var(--primary-color, #1976d2);\n}\n.latest-comment[_ngcontent-%COMP%] {\n  flex: 1;\n  overflow: hidden;\n  display: flex;\n  gap: 6px;\n  align-items: center;\n}\n.comment-author[_ngcontent-%COMP%] {\n  font-size: 12px;\n  font-weight: 600;\n  white-space: nowrap;\n  color: var(--text-secondary, #888);\n}\n.comment-text[_ngcontent-%COMP%] {\n  font-size: 13px;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n.no-comments[_ngcontent-%COMP%] {\n  color: var(--text-secondary, #aaa);\n  font-size: 13px;\n}\n.open-dialog-btn[_ngcontent-%COMP%] {\n  background: var(--primary-light, #e3f2fd);\n  color: var(--primary-color, #1976d2);\n  border: none;\n  padding: 4px 10px;\n  border-radius: 4px;\n  cursor: pointer;\n  font-size: 12px;\n  white-space: nowrap;\n}\n.open-dialog-btn[_ngcontent-%COMP%]:hover:not(:disabled) {\n  background: var(--primary-color, #1976d2);\n  color: white;\n}\n.open-dialog-btn[_ngcontent-%COMP%]:disabled {\n  opacity: 0.5;\n  cursor: not-allowed;\n}\n.comment-preview.disabled[_ngcontent-%COMP%] {\n  opacity: 0.6;\n  cursor: not-allowed;\n  border-style: dashed;\n}\n/*# sourceMappingURL=comment-input.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(CommentInputComponent, { className: "CommentInputComponent", filePath: "src/app/shared/reactive-form/refactored/input-fields/comment-input/comment-input.component.ts", lineNumber: 130 });
})();

// src/app/shared/reactive-form/refactored/services/form-builder.service.ts
var FormBuilderService = class _FormBuilderService {
  fb = inject(FormBuilder);
  /**
   * Creates a FormGroup from field definitions and entity data
   */
  createFormFromFields(fields, entity) {
    const group = {};
    fields.forEach((field) => {
      if (field && field.name) {
        if (field.type === "form-array") {
          this.addFormArrayControl(group, field, entity);
        } else if (field.type === "group") {
          this.addFormGroupControl(group, field, entity);
        } else {
          this.addFormControl(group, field, entity);
        }
      }
    });
    return this.fb.group(group);
  }
  /**
   * Creates a FormArray control
   */
  addFormArrayControl(group, field, entity) {
    const arrayData = this.getNestedValue(entity, field.name) || [];
    const formArray = this.fb.array(arrayData.map((item) => this.createArrayItem(field.fields ?? [], item)));
    this.setNestedControl(group, field.name, formArray);
  }
  /**
   * Creates a FormGroup control for nested objects
   */
  addFormGroupControl(group, field, entity) {
    const nestedData = this.getNestedValue(entity, field.name) || {};
    const nestedGroup = this.createNestedGroup(field.fields ?? [], nestedData);
    this.setNestedControl(group, field.name, nestedGroup);
  }
  /**
   * Creates a regular FormControl
   */
  addFormControl(group, field, entity) {
    let value = this.getNestedValue(entity, field.name);
    value = this.normalizeValueByType(field.type, value);
    this.setNestedControl(group, field.name, new FormControl(value, field.validators || []));
  }
  /**
   * Normalizes values based on field type
   */
  normalizeValueByType(type, value) {
    if (type === "file") {
      return null;
    }
    if (type === "checkbox-group" || type === "multi-select" || type === "multi-input") {
      return value || [];
    }
    if (type === "select" && typeof value === "object" && value !== null) {
      return value.id;
    }
    if (type === "date" && !value) {
      return (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    }
    if (type === "time" && !value) {
      return (/* @__PURE__ */ new Date()).toTimeString().slice(0, 5);
    }
    return value;
  }
  /**
   * Creates a FormGroup for array items
   */
  createArrayItem(fields, data = {}) {
    const group = this.fb.group({});
    fields.forEach((field) => {
      const value = data[field.name] ?? field.initialValue ?? "";
      group.addControl(field.name, this.fb.control(value, field.validators));
    });
    return group;
  }
  /**
   * Creates a nested FormGroup for group fields
   */
  createNestedGroup(fields, data = {}) {
    const group = this.fb.group({});
    fields.forEach((field) => {
      let value = field.initialValue !== void 0 ? field.initialValue : data[field.name];
      value = this.normalizeValueByType(field.type, value);
      group.addControl(field.name, this.fb.control(value, field.validators));
    });
    return group;
  }
  /**
   * Sets a nested control in the form group
   */
  setNestedControl(group, path, control) {
    const pathParts = path.split(".");
    let currentGroup = group;
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (!currentGroup[part]) {
        currentGroup[part] = this.fb.group({});
      }
      currentGroup = currentGroup[part];
    }
    const lastPart = pathParts[pathParts.length - 1];
    if (currentGroup instanceof FormGroup) {
      currentGroup.addControl(lastPart, control);
    } else {
      currentGroup[lastPart] = control;
    }
  }
  /**
   * Gets nested value from an object using dot notation
   * Public to allow form component to access it for value normalization
   */
  getNestedValue(obj, path) {
    if (!obj || !path) {
      return null;
    }
    return path.split(".").reduce((prev, curr) => prev ? prev[curr] : null, obj);
  }
  static \u0275fac = function FormBuilderService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _FormBuilderService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _FormBuilderService, factory: _FormBuilderService.\u0275fac, providedIn: "root" });
};

// src/app/shared/reactive-form/refactored/services/form-validation.service.ts
var FormValidationService = class _FormValidationService {
  /**
   * Sets up conditional validators based on field dependencies
   */
  setupConditionalValidators(form, fields, destroyRef) {
    fields.forEach((field) => {
      if (field.showWhen) {
        const controllingField = form.get(field.showWhen.field);
        const dependentControl = form.get(field.name);
        if (controllingField && dependentControl) {
          const updateValidators = (value) => {
            const shouldShow = value === field.showWhen.value;
            if (shouldShow) {
              dependentControl.setValidators(field.validators ?? []);
            } else {
              dependentControl.clearValidators();
              dependentControl.reset(void 0, { emitEvent: false });
            }
            dependentControl.updateValueAndValidity({ emitEvent: false });
          };
          controllingField.valueChanges.pipe(takeUntilDestroyed(destroyRef)).subscribe(updateValidators);
          updateValidators(controllingField.value);
        }
      }
    });
  }
  /**
   * Validates the form and returns error messages
   */
  getFormErrors(form, fields) {
    const errors = {};
    fields.forEach((field) => {
      const control = form.get(field.name);
      if (control && control.invalid && (control.dirty || control.touched)) {
        if (control.errors) {
          const errorKey = Object.keys(control.errors)[0];
          errors[field.name] = this.getErrorMessage(field.label, errorKey, control.errors[errorKey]);
        }
      }
    });
    return errors;
  }
  /**
   * Gets a user-friendly error message for a validation error
   */
  getErrorMessage(fieldName, errorKey, errorValue) {
    switch (errorKey) {
      case "required":
        return `${fieldName} is required.`;
      case "minlength":
        return `${fieldName} must be at least ${errorValue.requiredLength} characters long.`;
      case "maxlength":
        return `${fieldName} cannot be more than ${errorValue.requiredLength} characters long.`;
      case "email":
        return `Please enter a valid email address.`;
      case "pastDate":
        return `Date for ${fieldName} cannot be in the past.`;
      default:
        return `Invalid input for ${fieldName}.`;
    }
  }
  /**
   * Checks if a field should be shown based on its conditions
   */
  shouldShowField(form, field) {
    if (!field.showWhen) {
      return true;
    }
    const control = form.get(field.showWhen.field);
    return control ? control.value === field.showWhen.value : false;
  }
  static \u0275fac = function FormValidationService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _FormValidationService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _FormValidationService, factory: _FormValidationService.\u0275fac, providedIn: "root" });
};

// src/app/shared/reactive-form/refactored/services/form-data.service.ts
var FormDataService = class _FormDataService {
  /**
   * Deep merges form values with original entity data
   */
  deepMerge(target, source) {
    const output2 = __spreadValues({}, target);
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach((key) => {
        const sourceValue = source[key];
        const targetValue = target[key];
        if (this.isObject(sourceValue) && targetValue) {
          output2[key] = this.deepMerge(targetValue, sourceValue);
        } else if (targetValue instanceof Date && typeof sourceValue === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sourceValue)) {
          const [year, month, day] = sourceValue.split("-").map(Number);
          output2[key] = new Date(year, month - 1, day);
        } else {
          output2[key] = sourceValue;
        }
      });
    }
    return output2;
  }
  /**
   * Checks if an item is a plain object
   */
  isObject(item) {
    return item && typeof item === "object" && !Array.isArray(item) && !(item instanceof Date);
  }
  /**
   * Groups fields by their group label
   */
  groupFields(fields) {
    const groupsMap = {};
    fields.forEach((field) => {
      const groupLabel = field.group?.label || "Ungrouped";
      if (!groupsMap[groupLabel]) {
        groupsMap[groupLabel] = [];
      }
      groupsMap[groupLabel].push(field);
    });
    return groupsMap;
  }
  /**
   * Checks if a value is a Signal
   */
  isSignal(item) {
    return item && typeof item.asReadonly === "function" && typeof item() === "function";
  }
  /**
   * Gets field options, unwrapping from Signal if necessary
   */
  getFieldOptions(options) {
    return this.isSignal(options) ? options() : options;
  }
  static \u0275fac = function FormDataService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _FormDataService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _FormDataService, factory: _FormDataService.\u0275fac, providedIn: "root" });
};

// src/app/shared/reactive-form/refactored/reactive-form/rf-reactive-form.component.ts
var _c010 = [[["", "extra-buttons", ""]]];
var _c13 = ["[extra-buttons]"];
var _forTrack011 = ($index, $item) => $item.name;
function RfReactiveFormComponent_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "h2", 0);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r0.title());
  }
}
function RfReactiveFormComponent_For_4_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "legend", 6);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const groupLabel_r2 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(groupLabel_r2);
  }
}
function RfReactiveFormComponent_For_4_For_3_Conditional_0_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 9);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const field_r3 = \u0275\u0275nextContext(2).$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(field_r3.tooltip);
  }
}
function RfReactiveFormComponent_For_4_For_3_Conditional_0_Case_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-searchable-select-input", 10);
  }
  if (rf & 2) {
    const field_r3 = \u0275\u0275nextContext(2).$implicit;
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275property("label", field_r3.label)("options", ctx_r0.getFieldOptions(field_r3.options))("formControl", ctx_r0.getFormControl(field_r3.name))("categoryName", field_r3.name);
  }
}
function RfReactiveFormComponent_For_4_For_3_Conditional_0_Case_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-chekcbox-group", 11);
  }
  if (rf & 2) {
    const field_r3 = \u0275\u0275nextContext(2).$implicit;
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275property("label", field_r3.label)("options", ctx_r0.getFieldOptions(field_r3.options))("formControl", ctx_r0.getFormControl(field_r3.name));
  }
}
function RfReactiveFormComponent_For_4_For_3_Conditional_0_Case_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-checkbox-label-only", 12);
  }
  if (rf & 2) {
    const field_r3 = \u0275\u0275nextContext(2).$implicit;
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275property("label", field_r3.label)("id", field_r3.name)("formControl", ctx_r0.getFormControl(field_r3.name));
  }
}
function RfReactiveFormComponent_For_4_For_3_Conditional_0_Case_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-rf-radio-group", 11);
  }
  if (rf & 2) {
    const field_r3 = \u0275\u0275nextContext(2).$implicit;
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275property("label", field_r3.label)("options", ctx_r0.getFieldOptions(field_r3.options))("formControl", ctx_r0.getFormControl(field_r3.name));
  }
}
function RfReactiveFormComponent_For_4_For_3_Conditional_0_Case_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-searchable-multi-select-input", 13);
  }
  if (rf & 2) {
    const field_r3 = \u0275\u0275nextContext(2).$implicit;
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275property("options", ctx_r0.getFieldOptions(field_r3.options))("label", field_r3.label)("formControl", ctx_r0.getFormControl(field_r3.name))("categoryName", field_r3.name);
  }
}
function RfReactiveFormComponent_For_4_For_3_Conditional_0_Case_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "app-file-input", 24);
    \u0275\u0275listener("fileSelected", function RfReactiveFormComponent_For_4_For_3_Conditional_0_Case_7_Template_app_file_input_fileSelected_0_listener($event) {
      \u0275\u0275restoreView(_r4);
      const ctx_r0 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r0.onFileSelected($event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    let tmp_24_0;
    const field_r3 = \u0275\u0275nextContext(2).$implicit;
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275property("formControl", ctx_r0.getFormControl(field_r3.name))("label", field_r3.label)("accept", (tmp_24_0 = field_r3.accept) !== null && tmp_24_0 !== void 0 ? tmp_24_0 : ".pdf,.doc,.docx,.img,.jpg,.jpeg,.png");
  }
}
function RfReactiveFormComponent_For_4_For_3_Conditional_0_Case_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-multi-text-input", 15);
  }
  if (rf & 2) {
    const field_r3 = \u0275\u0275nextContext(2).$implicit;
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275property("label", field_r3.label)("formControl", ctx_r0.getFormControl(field_r3.name));
  }
}
function RfReactiveFormComponent_For_4_For_3_Conditional_0_Case_9_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "app-form-array-input", 25);
    \u0275\u0275listener("addItem", function RfReactiveFormComponent_For_4_For_3_Conditional_0_Case_9_Template_app_form_array_input_addItem_0_listener() {
      \u0275\u0275restoreView(_r5);
      const field_r3 = \u0275\u0275nextContext(2).$implicit;
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.addArrayItem(field_r3.name, field_r3.fields));
    })("removeItem", function RfReactiveFormComponent_For_4_For_3_Conditional_0_Case_9_Template_app_form_array_input_removeItem_0_listener($event) {
      \u0275\u0275restoreView(_r5);
      const field_r3 = \u0275\u0275nextContext(2).$implicit;
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.removeArrayItem(field_r3.name, $event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const field_r3 = \u0275\u0275nextContext(2).$implicit;
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275property("label", field_r3.label)("formArray", ctx_r0.getFormArray(field_r3.name))("fields", field_r3.fields);
  }
}
function RfReactiveFormComponent_For_4_For_3_Conditional_0_Case_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-form-group-input", 17);
  }
  if (rf & 2) {
    const field_r3 = \u0275\u0275nextContext(2).$implicit;
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275property("label", field_r3.label)("formGroup", ctx_r0.getFormGroup(field_r3.name))("fields", field_r3.fields)("layout", ctx_r0.getGroupInputLayout())("context", field_r3.context);
  }
}
function RfReactiveFormComponent_For_4_For_3_Conditional_0_Case_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-equipment-browser-input", 18);
  }
  if (rf & 2) {
    const field_r3 = \u0275\u0275nextContext(2).$implicit;
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275property("label", field_r3.label)("formControl", ctx_r0.getFormControl(field_r3.name));
  }
}
function RfReactiveFormComponent_For_4_For_3_Conditional_0_Case_12_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-equipment-shape-drawer-input", 18);
  }
  if (rf & 2) {
    const field_r3 = \u0275\u0275nextContext(2).$implicit;
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275property("label", field_r3.label)("formControl", ctx_r0.getFormControl(field_r3.name));
  }
}
function RfReactiveFormComponent_For_4_For_3_Conditional_0_Case_13_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-equipment-list-manager", 19);
  }
  if (rf & 2) {
    let tmp_24_0;
    let tmp_25_0;
    let tmp_26_0;
    let tmp_29_0;
    const field_r3 = \u0275\u0275nextContext(2).$implicit;
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275property("label", field_r3.label)("formControl", ctx_r0.getFormControl(field_r3.name))("useUnifiedDialog", (tmp_24_0 = field_r3.context == null ? null : field_r3.context.useUnifiedDialog) !== null && tmp_24_0 !== void 0 ? tmp_24_0 : false)("requireLotoPointForDrawn", (tmp_25_0 = field_r3.context == null ? null : field_r3.context.requireLotoPointForDrawn) !== null && tmp_25_0 !== void 0 ? tmp_25_0 : false)("requireLotoPointForUnassociated", (tmp_26_0 = field_r3.context == null ? null : field_r3.context.requireLotoPointForUnassociated) !== null && tmp_26_0 !== void 0 ? tmp_26_0 : false)("currentLotoPointId", field_r3.context == null ? null : field_r3.context.currentLotoPointId)("currentLotoPointTagNumber", field_r3.context == null ? null : field_r3.context.currentLotoPointTagNumber)("conflictMode", (tmp_29_0 = field_r3.context == null ? null : field_r3.context.conflictMode) !== null && tmp_29_0 !== void 0 ? tmp_29_0 : "has-association");
  }
}
function RfReactiveFormComponent_For_4_For_3_Conditional_0_Case_14_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-rf-value-select", 20);
  }
  if (rf & 2) {
    let tmp_24_0;
    const field_r3 = \u0275\u0275nextContext(2).$implicit;
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275property("categoryAlias", field_r3.categoryAlias)("label", field_r3.label)("canManageValues", (tmp_24_0 = field_r3.canManageValues) !== null && tmp_24_0 !== void 0 ? tmp_24_0 : true)("formControl", ctx_r0.getFormControl(field_r3.name));
  }
}
function RfReactiveFormComponent_For_4_For_3_Conditional_0_Case_15_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-rf-multi-value-select", 20);
  }
  if (rf & 2) {
    let tmp_24_0;
    const field_r3 = \u0275\u0275nextContext(2).$implicit;
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275property("categoryAlias", field_r3.categoryAlias)("label", field_r3.label)("canManageValues", (tmp_24_0 = field_r3.canManageValues) !== null && tmp_24_0 !== void 0 ? tmp_24_0 : true)("formControl", ctx_r0.getFormControl(field_r3.name));
  }
}
function RfReactiveFormComponent_For_4_For_3_Conditional_0_Case_16_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-comment-input", 21);
  }
  if (rf & 2) {
    let tmp_23_0;
    let tmp_24_0;
    const field_r3 = \u0275\u0275nextContext(2).$implicit;
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275property("label", field_r3.label)("entityType", (tmp_23_0 = field_r3.commentContext == null ? null : field_r3.commentContext.entityType) !== null && tmp_23_0 !== void 0 ? tmp_23_0 : "")("entityId", (tmp_24_0 = field_r3.commentContext == null ? null : field_r3.commentContext.entityId) !== null && tmp_24_0 !== void 0 ? tmp_24_0 : 0)("formControl", ctx_r0.getFormControl(field_r3.name));
  }
}
function RfReactiveFormComponent_For_4_For_3_Conditional_0_Case_17_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-rf-form-input", 22);
  }
  if (rf & 2) {
    let tmp_24_0;
    const field_r3 = \u0275\u0275nextContext(2).$implicit;
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275property("label", field_r3.label)("type", field_r3.type)("readonly", (tmp_24_0 = field_r3.readonly) !== null && tmp_24_0 !== void 0 ? tmp_24_0 : false)("formControl", ctx_r0.getFormControl(field_r3.name));
  }
}
function RfReactiveFormComponent_For_4_For_3_Conditional_0_Conditional_18_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 23);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const field_r3 = \u0275\u0275nextContext(2).$implicit;
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r0.formErrors()[field_r3.name]);
  }
}
function RfReactiveFormComponent_For_4_For_3_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 8);
    \u0275\u0275template(1, RfReactiveFormComponent_For_4_For_3_Conditional_0_Conditional_1_Template, 2, 1, "div", 9)(2, RfReactiveFormComponent_For_4_For_3_Conditional_0_Case_2_Template, 1, 4, "app-searchable-select-input", 10)(3, RfReactiveFormComponent_For_4_For_3_Conditional_0_Case_3_Template, 1, 3, "app-chekcbox-group", 11)(4, RfReactiveFormComponent_For_4_For_3_Conditional_0_Case_4_Template, 1, 3, "app-checkbox-label-only", 12)(5, RfReactiveFormComponent_For_4_For_3_Conditional_0_Case_5_Template, 1, 3, "app-rf-radio-group", 11)(6, RfReactiveFormComponent_For_4_For_3_Conditional_0_Case_6_Template, 1, 4, "app-searchable-multi-select-input", 13)(7, RfReactiveFormComponent_For_4_For_3_Conditional_0_Case_7_Template, 1, 3, "app-file-input", 14)(8, RfReactiveFormComponent_For_4_For_3_Conditional_0_Case_8_Template, 1, 2, "app-multi-text-input", 15)(9, RfReactiveFormComponent_For_4_For_3_Conditional_0_Case_9_Template, 1, 3, "app-form-array-input", 16)(10, RfReactiveFormComponent_For_4_For_3_Conditional_0_Case_10_Template, 1, 5, "app-form-group-input", 17)(11, RfReactiveFormComponent_For_4_For_3_Conditional_0_Case_11_Template, 1, 2, "app-equipment-browser-input", 18)(12, RfReactiveFormComponent_For_4_For_3_Conditional_0_Case_12_Template, 1, 2, "app-equipment-shape-drawer-input", 18)(13, RfReactiveFormComponent_For_4_For_3_Conditional_0_Case_13_Template, 1, 8, "app-equipment-list-manager", 19)(14, RfReactiveFormComponent_For_4_For_3_Conditional_0_Case_14_Template, 1, 4, "app-rf-value-select", 20)(15, RfReactiveFormComponent_For_4_For_3_Conditional_0_Case_15_Template, 1, 4, "app-rf-multi-value-select", 20)(16, RfReactiveFormComponent_For_4_For_3_Conditional_0_Case_16_Template, 1, 4, "app-comment-input", 21)(17, RfReactiveFormComponent_For_4_For_3_Conditional_0_Case_17_Template, 1, 4, "app-rf-form-input", 22)(18, RfReactiveFormComponent_For_4_For_3_Conditional_0_Conditional_18_Template, 2, 1, "div", 23);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    let tmp_26_0;
    const field_r3 = \u0275\u0275nextContext().$implicit;
    const groupLabel_r2 = \u0275\u0275nextContext().$implicit;
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275classMap("form-field-layout-" + (groupLabel_r2 === "Ungrouped" ? ctx_r0.layout() : ctx_r0.groupLayout()));
    \u0275\u0275property("appGuide", field_r3.guideId || "")("guideMessage", field_r3.guideMessage || "")("guideTooltipOnly", true);
    \u0275\u0275advance();
    \u0275\u0275conditional(field_r3.tooltip ? 1 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional((tmp_26_0 = field_r3.type) === "select" ? 2 : tmp_26_0 === "checkbox-group" ? 3 : tmp_26_0 === "checkbox" ? 4 : tmp_26_0 === "radio-group" ? 5 : tmp_26_0 === "multi-select" ? 6 : tmp_26_0 === "file" ? 7 : tmp_26_0 === "multi-input" ? 8 : tmp_26_0 === "form-array" ? 9 : tmp_26_0 === "group" ? 10 : tmp_26_0 === "equipment-browser" ? 11 : tmp_26_0 === "equipment-shape-drawer" ? 12 : tmp_26_0 === "equipment-list-manager" ? 13 : tmp_26_0 === "value-select" ? 14 : tmp_26_0 === "multi-value-select" ? 15 : tmp_26_0 === "comment" ? 16 : 17);
    \u0275\u0275advance(16);
    \u0275\u0275conditional(ctx_r0.formErrors()[field_r3.name] ? 18 : -1);
  }
}
function RfReactiveFormComponent_For_4_For_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, RfReactiveFormComponent_For_4_For_3_Conditional_0_Template, 19, 8, "div", 7);
  }
  if (rf & 2) {
    const field_r3 = ctx.$implicit;
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275conditional(ctx_r0.shouldShowField(field_r3) ? 0 : -1);
  }
}
function RfReactiveFormComponent_For_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "fieldset", 5);
    \u0275\u0275template(1, RfReactiveFormComponent_For_4_Conditional_1_Template, 2, 1, "legend", 6);
    \u0275\u0275repeaterCreate(2, RfReactiveFormComponent_For_4_For_3_Template, 1, 1, null, null, _forTrack011);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const groupLabel_r2 = ctx.$implicit;
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275classMap("form-layout-" + (groupLabel_r2 === "Ungrouped" ? ctx_r0.layout() : ctx_r0.groupLayout()));
    \u0275\u0275advance();
    \u0275\u0275conditional(groupLabel_r2 !== "Ungrouped" ? 1 : -1);
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r0.groupedFields()[groupLabel_r2]);
  }
}
function RfReactiveFormComponent_Conditional_5_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 28);
    \u0275\u0275listener("click", function RfReactiveFormComponent_Conditional_5_Conditional_3_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.onDelete());
    });
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r0.deleteButtonText());
  }
}
function RfReactiveFormComponent_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 4)(1, "button", 26);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275template(3, RfReactiveFormComponent_Conditional_5_Conditional_3_Template, 2, 1, "button", 27);
    \u0275\u0275projection(4);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(ctx_r0.submitButtonText());
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r0.deleteButtonText() !== "" ? 3 : -1);
  }
}
var RfReactiveFormComponent = class _RfReactiveFormComponent {
  // Inputs
  fields = input([]);
  entity = input({});
  layout = input("column");
  groupLayout = input("grid");
  title = input("");
  submitButtonText = input("Submit");
  deleteButtonText = input("");
  showSubmitButton = input(true);
  // Outputs
  formSubmit = output();
  formDelete = output();
  addNewSelectOption = output();
  formValueChange = output();
  fileSelected = output();
  helperCheckboxChange = output();
  // Services
  formBuilderService = inject(FormBuilderService);
  validationService = inject(FormValidationService);
  dataService = inject(FormDataService);
  destroyRef = inject(DestroyRef);
  // State
  formErrors = signal({});
  form = new FormGroup({});
  isCreatingForm = false;
  lastPatchedEntity = null;
  // Computed
  Object = Object;
  groupedFields = computed(() => this.dataService.groupFields(this.fields()));
  constructor() {
    effect(() => {
      const fields = this.fields();
      if (fields && fields.length > 0) {
        this.isCreatingForm = true;
        this.createForm();
        this.isCreatingForm = false;
      }
    });
    effect(() => {
      const data = this.entity();
      if (this.isCreatingForm || !this.form || Object.keys(this.form.controls).length === 0) {
        return;
      }
      if (data === this.lastPatchedEntity) {
        return;
      }
      if (data && Object.keys(data).length > 0) {
        this.lastPatchedEntity = data;
        const normalizedData = this.normalizeEntityForPatch(data);
        setTimeout(() => {
          if (this.form) {
            this.form.patchValue(normalizedData, { emitEvent: false });
          }
        }, 0);
      }
    });
  }
  createForm() {
    const entity = this.entity();
    const fields = this.fields();
    this.form = this.formBuilderService.createFormFromFields(fields, entity);
    this.validationService.setupConditionalValidators(this.form, fields, this.destroyRef);
    this.form.valueChanges.pipe(debounceTime(1e3), distinctUntilChanged((prev, curr) => this.deepCompareByIds(prev, curr)), takeUntilDestroyed(this.destroyRef)).subscribe((formValue) => {
      const originalData = this.entity() || {};
      const mergedData = this.dataService.deepMerge(originalData, formValue);
      this.formValueChange.emit(mergedData);
    });
  }
  /**
   * Deep comparison that compares arrays and objects by IDs
   * This prevents false positives when object references change but IDs remain the same
   */
  deepCompareByIds(obj1, obj2) {
    if (obj1 == null && obj2 == null)
      return true;
    if (obj1 == null || obj2 == null)
      return false;
    if (typeof obj1 !== "object" || typeof obj2 !== "object") {
      return obj1 === obj2;
    }
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
      if (obj1.length !== obj2.length)
        return false;
      for (let i = 0; i < obj1.length; i++) {
        const item1 = obj1[i];
        const item2 = obj2[i];
        if (this.hasComparableId(item1) && this.hasComparableId(item2)) {
          if (item1.id !== item2.id)
            return false;
        } else {
          if (!this.deepCompareByIds(item1, item2))
            return false;
        }
      }
      return true;
    }
    if (this.hasComparableId(obj1) && this.hasComparableId(obj2)) {
      return obj1.id === obj2.id;
    }
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    if (keys1.length !== keys2.length)
      return false;
    for (const key of keys1) {
      if (!keys2.includes(key))
        return false;
      if (!this.deepCompareByIds(obj1[key], obj2[key]))
        return false;
    }
    return true;
  }
  /**
   * Check if an object has a valid ID that can be used for comparison
   * Returns true if the object has an 'id' property that is not null/undefined
   */
  hasComparableId(obj) {
    return obj != null && typeof obj === "object" && "id" in obj && obj.id != null;
  }
  /**
   * Normalizes entity data for form patching by extracting IDs from nested objects for select fields
   */
  normalizeEntityForPatch(entity) {
    if (!entity)
      return entity;
    const normalized = __spreadValues({}, entity);
    const fields = this.fields();
    const processFields = (fieldList, parentPath = "") => {
      fieldList.forEach((field) => {
        const fieldPath = parentPath ? `${parentPath}.${field.name}` : field.name;
        if (field.type === "select" || field.type === "value-select" || field.type === "zero-energy-phrase-builder") {
          const value = this.formBuilderService.getNestedValue(entity, fieldPath);
          if (value && typeof value === "object" && value !== null && value.id) {
            this.setNestedValue(normalized, fieldPath, value.id);
          }
        } else if (field.type === "multi-select" || field.type === "multi-value-select") {
          const value = this.formBuilderService.getNestedValue(entity, fieldPath);
          if (Array.isArray(value) && value.length > 0 && value[0]?.id) {
            this.setNestedValue(normalized, fieldPath, value.map((item) => item.id));
          }
        } else if (field.type === "group" && field.fields) {
          processFields(field.fields, fieldPath);
        }
      });
    };
    processFields(fields);
    return normalized;
  }
  /**
   * Sets a nested value in an object using dot notation
   */
  setNestedValue(obj, path, value) {
    const keys = path.split(".");
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
  }
  // Form array management
  getFormArray(name) {
    return this.form.get(name);
  }
  // Form group management
  getFormGroup(name) {
    const control = this.form.get(name);
    if (!control || !(control instanceof FormGroup)) {
      return new FormGroup({});
    }
    return control;
  }
  addArrayItem(arrayName, fields) {
    const formArray = this.getFormArray(arrayName);
    if (formArray) {
      formArray.push(this.formBuilderService.createArrayItem(fields));
      this.form.markAsDirty();
    }
  }
  removeArrayItem(arrayName, index) {
    const formArray = this.getFormArray(arrayName);
    if (formArray) {
      formArray.removeAt(index);
      this.form.markAsDirty();
    }
  }
  // Form control access
  getFormControl(path) {
    const control = this.form.get(path);
    if (!control || !(control instanceof FormControl)) {
      return new FormControl();
    }
    return control;
  }
  // Field visibility
  shouldShowField(field) {
    return this.validationService.shouldShowField(this.form, field);
  }
  // Form submission
  onSubmit() {
    if (this.form.valid) {
      const originalData = this.entity() || {};
      const formValue = this.form.value;
      const mergedData = this.dataService.deepMerge(originalData, formValue);
      this.formSubmit.emit(mergedData);
    } else {
      this.form.markAllAsTouched();
      this.updateFormErrors();
    }
  }
  onDelete() {
    this.formDelete.emit();
  }
  onContextMenu(event) {
    event.preventDefault();
    return false;
  }
  // Utility methods
  getCurrentFormValues() {
    return this.form ? this.form.value : null;
  }
  updateFormErrors() {
    const errors = this.validationService.getFormErrors(this.form, this.fields());
    this.formErrors.set(errors);
  }
  getFieldOptions(options) {
    return this.dataService.getFieldOptions(options);
  }
  // Helper to convert groupLayout to form-group-input compatible layout
  getGroupInputLayout() {
    const layout = this.groupLayout();
    return layout === "reactive" ? "column" : layout;
  }
  // Handle file selection from file input component
  onFileSelected(event) {
    this.fileSelected.emit(event);
  }
  static \u0275fac = function RfReactiveFormComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _RfReactiveFormComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _RfReactiveFormComponent, selectors: [["app-rf-reactive-form"]], inputs: { fields: [1, "fields"], entity: [1, "entity"], layout: [1, "layout"], groupLayout: [1, "groupLayout"], title: [1, "title"], submitButtonText: [1, "submitButtonText"], deleteButtonText: [1, "deleteButtonText"], showSubmitButton: [1, "showSubmitButton"] }, outputs: { formSubmit: "formSubmit", formDelete: "formDelete", addNewSelectOption: "addNewSelectOption", formValueChange: "formValueChange", fileSelected: "fileSelected", helperCheckboxChange: "helperCheckboxChange" }, ngContentSelectors: _c13, decls: 6, vars: 5, consts: [[1, "form-header"], [3, "ngSubmit", "contextmenu", "formGroup"], [1, "form-content"], [1, "form-group", 3, "class"], [1, "form-actions"], [1, "form-group"], [1, "group-title"], [1, "field-wrapper", 3, "class", "appGuide", "guideMessage", "guideTooltipOnly"], [1, "field-wrapper", 3, "appGuide", "guideMessage", "guideTooltipOnly"], [1, "field-tooltip"], [3, "label", "options", "formControl", "categoryName"], [3, "label", "options", "formControl"], [3, "label", "id", "formControl"], [3, "options", "label", "formControl", "categoryName"], [3, "formControl", "label", "accept"], ["type", "text", 3, "label", "formControl"], [3, "label", "formArray", "fields"], [3, "label", "formGroup", "fields", "layout", "context"], [3, "label", "formControl"], [3, "label", "formControl", "useUnifiedDialog", "requireLotoPointForDrawn", "requireLotoPointForUnassociated", "currentLotoPointId", "currentLotoPointTagNumber", "conflictMode"], [3, "categoryAlias", "label", "canManageValues", "formControl"], [3, "label", "entityType", "entityId", "formControl"], [3, "label", "type", "readonly", "formControl"], [1, "error-message"], [3, "fileSelected", "formControl", "label", "accept"], [3, "addItem", "removeItem", "label", "formArray", "fields"], ["type", "submit"], ["type", "button"], ["type", "button", 3, "click"]], template: function RfReactiveFormComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275projectionDef(_c010);
      \u0275\u0275template(0, RfReactiveFormComponent_Conditional_0_Template, 2, 1, "h2", 0);
      \u0275\u0275elementStart(1, "form", 1);
      \u0275\u0275listener("ngSubmit", function RfReactiveFormComponent_Template_form_ngSubmit_1_listener() {
        return ctx.onSubmit();
      })("contextmenu", function RfReactiveFormComponent_Template_form_contextmenu_1_listener($event) {
        return ctx.onContextMenu($event);
      });
      \u0275\u0275elementStart(2, "div", 2);
      \u0275\u0275repeaterCreate(3, RfReactiveFormComponent_For_4_Template, 4, 3, "fieldset", 3, \u0275\u0275repeaterTrackByIdentity);
      \u0275\u0275elementEnd();
      \u0275\u0275template(5, RfReactiveFormComponent_Conditional_5_Template, 5, 2, "div", 4);
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      \u0275\u0275conditional(ctx.title() !== "" ? 0 : -1);
      \u0275\u0275advance();
      \u0275\u0275classMap("form-layout-" + ctx.layout());
      \u0275\u0275property("formGroup", ctx.form);
      \u0275\u0275advance(2);
      \u0275\u0275repeater(ctx.Object.keys(ctx.groupedFields()));
      \u0275\u0275advance(2);
      \u0275\u0275conditional(ctx.showSubmitButton() ? 5 : -1);
    }
  }, dependencies: [
    ReactiveFormsModule,
    \u0275NgNoValidate,
    NgControlStatus,
    NgControlStatusGroup,
    FormControlDirective,
    FormGroupDirective,
    SearchableSelectInputComponent,
    ChekcboxGroupComponent,
    CheckboxLabelOnlyComponent,
    RfRadioGroupComponent,
    SearchableMultiSelectInputComponent,
    MultiTextInputComponent,
    RfFormInputComponent,
    FormArrayInputComponent,
    FormGroupInputComponent,
    EquipmentBrowserInputComponent,
    EquipmentShapeDrawerInputComponent,
    EquipmentListManagerComponent,
    RfValueSelectComponent,
    RfMultiValueSelectComponent,
    FileInputComponent,
    CommentInputComponent,
    GuideDirective
  ], styles: ['\n\n[_nghost-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  height: 100%;\n  width: 100%;\n}\nform[_ngcontent-%COMP%] {\n  background-color: var(--card-background);\n  color: var(--primary-text);\n  display: flex;\n  flex-direction: column;\n  flex: 1;\n  width: 100%;\n  box-sizing: border-box;\n  gap: 0;\n  padding: 0;\n  overflow: hidden;\n  min-height: 0;\n}\n.form-header[_ngcontent-%COMP%] {\n  flex-shrink: 0;\n  margin: 0;\n  padding: 20px 20px 10px 20px;\n  font-size: 1.5em;\n  font-weight: bold;\n}\n.form-content[_ngcontent-%COMP%] {\n  flex: 1;\n  overflow-y: auto;\n  overflow-x: visible;\n  min-height: 0;\n  padding: 20px;\n  box-sizing: border-box;\n  position: relative;\n  clip-path: none;\n}\n.form-content[_ngcontent-%COMP%]::-webkit-scrollbar {\n  width: 8px;\n}\n.form-content[_ngcontent-%COMP%]::-webkit-scrollbar-track {\n  background: transparent;\n}\n.form-content[_ngcontent-%COMP%]::-webkit-scrollbar-thumb {\n  background: var(--scroll-bar-color, #ccc);\n  border-radius: 4px;\n  transition: background 0.3s ease;\n}\n.form-content[_ngcontent-%COMP%]::-webkit-scrollbar-thumb:hover {\n  background: var(--accent-color, #999);\n}\n.form-content[_ngcontent-%COMP%] {\n  scrollbar-color: var(--border-color, #ccc) transparent;\n  scrollbar-width: thin;\n}\n.form-actions[_ngcontent-%COMP%] {\n  flex-shrink: 0;\n  display: flex;\n  gap: 10px;\n  flex-wrap: wrap;\n  padding: 20px;\n  border-top: 1px solid var(--border-color);\n  background-color: var(--card-background);\n  min-height: 60px;\n  align-items: center;\n  position: sticky;\n  bottom: 0;\n  z-index: 10;\n}\n.form-group[_ngcontent-%COMP%] {\n  border: none;\n  padding: 0;\n  margin: 0 0 20px 0;\n  flex-shrink: 0;\n  position: relative;\n}\n.group-title[_ngcontent-%COMP%] {\n  font-size: 1.2em;\n  font-weight: bold;\n  margin-bottom: 15px;\n  padding-bottom: 10px;\n  border-bottom: 1px solid var(--border-color);\n}\n.form-layout-row[_ngcontent-%COMP%] {\n  display: flex;\n  flex-wrap: nowrap;\n  gap: 15px;\n  overflow-x: auto;\n}\n.form-layout-column[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 15px;\n}\n.form-layout-grid[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 20px;\n}\n.form-layout-reactive[_ngcontent-%COMP%] {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 15px;\n}\n.form-field-layout-row[_ngcontent-%COMP%] {\n  flex: 0 0 auto;\n  width: 200px;\n}\n.form-field-layout-column[_ngcontent-%COMP%] {\n  width: 100%;\n}\n.form-field-layout-grid[_ngcontent-%COMP%] {\n  width: 100%;\n}\n.form-field-layout-reactive[_ngcontent-%COMP%] {\n  flex: 1 1 calc(50% - 7.5px);\n}\n.form-field-layout-column[_ngcontent-%COMP%], \n.form-field-layout-grid[_ngcontent-%COMP%], \n.form-field-layout-row[_ngcontent-%COMP%], \n.form-field-layout-reactive[_ngcontent-%COMP%] {\n  position: relative;\n}\nbutton[_ngcontent-%COMP%] {\n  padding: 10px 20px;\n  font-size: 16px;\n  color: var(--header-text);\n  background-color: var(--accent-color);\n  border: none;\n  border-radius: 4px;\n  cursor: pointer;\n  transition: background-color 0.3s ease;\n  flex-shrink: 0;\n  white-space: nowrap;\n}\nbutton[_ngcontent-%COMP%]:hover {\n  background-color: var(--accent-color-hover);\n}\nbutton[type=button][_ngcontent-%COMP%] {\n  background-color: #f44336;\n}\nbutton[type=button][_ngcontent-%COMP%]:hover {\n  background-color: #d32f2f;\n}\n.error-message[_ngcontent-%COMP%] {\n  color: #f44336;\n  font-size: 0.8em;\n  margin-top: 5px;\n}\n.field-wrapper[_ngcontent-%COMP%] {\n  position: relative;\n}\n.field-tooltip[_ngcontent-%COMP%] {\n  display: none;\n  position: absolute;\n  bottom: 100%;\n  left: 0;\n  margin-bottom: 8px;\n  padding: 10px 14px;\n  background-color: #333;\n  color: #fff;\n  font-size: 13px;\n  line-height: 1.4;\n  border-radius: 6px;\n  width: 280px;\n  max-width: 90vw;\n  z-index: 1000;\n  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);\n  white-space: normal;\n  word-wrap: break-word;\n}\n.field-tooltip[_ngcontent-%COMP%]::after {\n  content: "";\n  position: absolute;\n  top: 100%;\n  left: 20px;\n  border: 6px solid transparent;\n  border-top-color: #333;\n}\n.field-wrapper[_ngcontent-%COMP%]:hover   .field-tooltip[_ngcontent-%COMP%] {\n  display: block;\n}\n@media (max-width: 900px) {\n  .form-layout-grid[_ngcontent-%COMP%] {\n    grid-template-columns: repeat(2, 1fr);\n  }\n  .form-field-layout-reactive[_ngcontent-%COMP%] {\n    flex: 1 1 calc(50% - 7.5px);\n  }\n}\n@media (max-width: 600px) {\n  .form-layout-row[_ngcontent-%COMP%], \n   .form-layout-reactive[_ngcontent-%COMP%], \n   .form-layout-grid[_ngcontent-%COMP%] {\n    flex-direction: column;\n    grid-template-columns: 1fr;\n  }\n  .form-field-layout-row[_ngcontent-%COMP%], \n   .form-field-layout-reactive[_ngcontent-%COMP%] {\n    flex: 1 1 100%;\n    width: 100%;\n  }\n  .form-actions[_ngcontent-%COMP%] {\n    flex-wrap: wrap;\n  }\n  button[_ngcontent-%COMP%] {\n    flex: 1 1 calc(50% - 5px);\n    min-width: 100px;\n  }\n}\n/*# sourceMappingURL=rf-reactive-form.component.css.map */'] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(RfReactiveFormComponent, { className: "RfReactiveFormComponent", filePath: "src/app/shared/reactive-form/refactored/reactive-form/rf-reactive-form.component.ts", lineNumber: 53 });
})();

export {
  normalizePassiveListenerOptions,
  FocusMonitor,
  CdkMonitorFocus,
  _VisuallyHiddenLoader,
  BreakpointObserver,
  CdkObserveContent,
  ObserversModule,
  InteractivityChecker,
  FocusTrapFactory,
  LiveAnnouncer,
  A11yModule,
  ActiveDescendantKeyManager,
  FocusKeyManager,
  addAriaReferencedId,
  removeAriaReferencedId,
  AriaDescriber,
  MatCommonModule,
  MatIcon,
  MatIconModule,
  ClipboardService,
  CopyPasteDirective,
  ContextMenuComponent,
  RfPopupProjectionComponent,
  RfLotoPointApiService,
  environment2 as environment,
  SyncUpdateService,
  RfValueService,
  SearchableSelectInputComponent,
  RfValueSelectComponent,
  LocalStorageService,
  GuideDirective,
  ClipboardService2,
  ValueService,
  CurrentValueService,
  LotoPointMapperService,
  FindPipe,
  FileService,
  EquipmentService,
  CurrentFileService,
  PIDSymbolsService,
  ShapeManagerService,
  getPreset,
  InteractiveImageComponent,
  EquipmentMapperService,
  NestedItemImpl,
  RfToggleMenuComponent,
  RfLotoPointLeftMenuService,
  RfEquipmentService,
  LotoPointService,
  CommentsDialogService,
  CommentService,
  CommentDto,
  RfReactiveFormComponent
};
//# sourceMappingURL=chunk-RQ7TKOU7.js.map
