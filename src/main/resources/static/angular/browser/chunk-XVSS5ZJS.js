import {
  CdkDrag,
  CdkDropList,
  DragDropModule,
  FloatingMenuComponent,
  MenuPosition,
  moveItemInArray
} from "./chunk-EOIM4DIO.js";
import "./chunk-L2ZGY44H.js";
import {
  EntityLoaderService
} from "./chunk-Q4NMF6LB.js";
import {
  CheckboxXComponent,
  InvisibleInputFieldComponent,
  InvisibleSearchableMultiSelectComponent,
  InvisibleSearchableSelectComponent,
  NestedFormInputComponent,
  RadioCheckboxesComponent
} from "./chunk-5RTLZHJG.js";
import "./chunk-C3MIWPDE.js";
import {
  FormContainerDto,
  FormStateService,
  PrintableFormDto
} from "./chunk-GLQJSYC5.js";
import {
  CommonModule,
  DefaultValueAccessor,
  DestroyRef,
  EventEmitter,
  FormsModule,
  NgControlStatus,
  NgModel,
  NgSelectOption,
  NgStyle,
  NumberValueAccessor,
  PLATFORM_ID,
  SelectControlValueAccessor,
  Subject,
  TitleCasePipe,
  computed,
  debounceTime,
  inject,
  input,
  isPlatformBrowser,
  output,
  signal,
  takeUntilDestroyed,
  toSignal,
  ɵNgSelectMultipleOption,
  ɵsetClassDebugInfo,
  ɵɵNgOnChangesFeature,
  ɵɵadvance,
  ɵɵclassProp,
  ɵɵconditional,
  ɵɵdefineComponent,
  ɵɵdefineInjectable,
  ɵɵdefinePipe,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵloadQuery,
  ɵɵnextContext,
  ɵɵpipe,
  ɵɵpipeBind1,
  ɵɵproperty,
  ɵɵpureFunction0,
  ɵɵpureFunction3,
  ɵɵqueryRefresh,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIdentity,
  ɵɵresetView,
  ɵɵresolveWindow,
  ɵɵrestoreView,
  ɵɵsanitizeUrl,
  ɵɵstyleProp,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtextInterpolate2,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty,
  ɵɵviewQuery
} from "./chunk-AVNJ6D7Z.js";
import {
  __spreadProps,
  __spreadValues
} from "./chunk-TXDUYLVM.js";

// src/app/features/form-designer-refactored/services/designer-interaction.service.ts
var DesignerInteractionService = class _DesignerInteractionService {
  // Zoom
  formScale = signal(1);
  MIN_SCALE = 0.1;
  MAX_SCALE = 3;
  ZOOM_INTENSITY = 0.1;
  // Drag
  isDragging = false;
  dragStartX = 0;
  dragStartY = 0;
  initialPositions = /* @__PURE__ */ new Map();
  // Resize
  resizingContainerId = null;
  resizeStartX = 0;
  resizeStartY = 0;
  initialSizes = /* @__PURE__ */ new Map();
  // Marquee selection
  isSelecting = signal(false);
  selectionBox = signal(null);
  selectionStart = { x: 0, y: 0 };
  PIXELS_PER_INCH = 96;
  // --- Zoom ---
  zoomIn() {
    this.formScale.update((s) => Math.min(this.MAX_SCALE, s + this.ZOOM_INTENSITY));
  }
  zoomOut() {
    this.formScale.update((s) => Math.max(this.MIN_SCALE, s - this.ZOOM_INTENSITY));
  }
  setScale(scale) {
    this.formScale.set(Math.max(this.MIN_SCALE, Math.min(this.MAX_SCALE, scale)));
  }
  resetScale() {
    this.formScale.set(1);
  }
  // --- Drag ---
  startDrag(event, containers) {
    this.isDragging = true;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.initialPositions.clear();
    containers.forEach((c) => {
      this.initialPositions.set(c.id + "", { x: c.position.x, y: c.position.y });
    });
  }
  getDragDelta(event) {
    return {
      dx: event.clientX - this.dragStartX,
      dy: event.clientY - this.dragStartY
    };
  }
  getInitialPosition(containerId) {
    return this.initialPositions.get(containerId);
  }
  endDrag() {
    this.isDragging = false;
    this.initialPositions.clear();
  }
  isDraggingActive() {
    return this.isDragging;
  }
  // --- Resize ---
  startResize(event, containers, resizingContainerId) {
    this.resizingContainerId = resizingContainerId;
    this.resizeStartX = event.clientX;
    this.resizeStartY = event.clientY;
    this.initialSizes.clear();
    containers.forEach((c) => {
      this.initialSizes.set(c.id + "", { width: c.size.width, height: c.size.height });
    });
  }
  getResizeDelta(event) {
    return {
      dx: event.clientX - this.resizeStartX,
      dy: event.clientY - this.resizeStartY
    };
  }
  getInitialSize(containerId) {
    return this.initialSizes.get(containerId);
  }
  endResize() {
    this.resizingContainerId = null;
    this.initialSizes.clear();
  }
  isResizing() {
    return this.resizingContainerId !== null;
  }
  getResizingContainerId() {
    return this.resizingContainerId;
  }
  // --- Marquee Selection ---
  startSelection(startPoint) {
    this.isSelecting.set(true);
    this.selectionStart = startPoint;
    this.selectionBox.set(__spreadProps(__spreadValues({}, startPoint), { width: 0, height: 0 }));
  }
  updateSelection(currentPoint) {
    if (!this.isSelecting())
      return;
    const x = Math.min(this.selectionStart.x, currentPoint.x);
    const y = Math.min(this.selectionStart.y, currentPoint.y);
    const width = Math.abs(currentPoint.x - this.selectionStart.x);
    const height = Math.abs(currentPoint.y - this.selectionStart.y);
    this.selectionBox.set({ x, y, width, height });
  }
  endSelection() {
    this.isSelecting.set(false);
    this.selectionBox.set(null);
  }
  getContainersInSelectionBox(containers) {
    const box = this.selectionBox();
    if (!box)
      return [];
    return containers.filter((c) => {
      if (c.locked)
        return false;
      const rect = {
        x: c.position?.x ?? 0,
        y: c.position?.y ?? 0,
        width: c.size?.width ?? 0,
        height: c.size?.height ?? 0
      };
      return box.x < rect.x + rect.width && box.x + box.width > rect.x && box.y < rect.y + rect.height && box.y + box.height > rect.y;
    });
  }
  // --- Reset ---
  reset() {
    this.endDrag();
    this.endResize();
    this.endSelection();
    this.resetScale();
  }
  static \u0275fac = function DesignerInteractionService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _DesignerInteractionService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _DesignerInteractionService, factory: _DesignerInteractionService.\u0275fac, providedIn: "root" });
};

// src/app/features/form-designer-refactored/services/container-operations.service.ts
var ContainerOperationsService = class _ContainerOperationsService {
  alignContainers(containers, alignment) {
    if (containers.length < 2)
      return containers;
    const ref = containers[0];
    return containers.map((c) => {
      if (c.id === ref.id)
        return c;
      const pos = __spreadValues({}, c.position);
      switch (alignment) {
        case "left":
          pos.x = ref.position.x;
          break;
        case "right":
          pos.x = ref.position.x + ref.size.width - c.size.width;
          break;
        case "top":
          pos.y = ref.position.y;
          break;
        case "bottom":
          pos.y = ref.position.y + ref.size.height - c.size.height;
          break;
        case "h-center":
          pos.x = ref.position.x + ref.size.width / 2 - c.size.width / 2;
          break;
        case "v-center":
          pos.y = ref.position.y + ref.size.height / 2 - c.size.height / 2;
          break;
      }
      return new FormContainerDto(__spreadProps(__spreadValues({}, c), { position: pos }));
    });
  }
  matchSize(containers, dimension) {
    if (containers.length < 2)
      return containers;
    const refSize = containers[0].size;
    return containers.map((c) => {
      if (c.id === containers[0].id)
        return c;
      const size = __spreadValues({}, c.size);
      if (dimension === "width" || dimension === "both")
        size.width = refSize.width;
      if (dimension === "height" || dimension === "both")
        size.height = refSize.height;
      return new FormContainerDto(__spreadProps(__spreadValues({}, c), { size }));
    });
  }
  distributeContainers(containers, direction) {
    if (containers.length < 3)
      return containers;
    const sorted = [...containers].sort((a, b) => direction === "horizontal" ? a.position.x - b.position.x : a.position.y - b.position.y);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const middle = sorted.slice(1, -1);
    const startEdge = direction === "horizontal" ? first.position.x + first.size.width : first.position.y + first.size.height;
    const endEdge = direction === "horizontal" ? last.position.x : last.position.y;
    const totalMiddle = middle.reduce((sum, c) => sum + (direction === "horizontal" ? c.size.width : c.size.height), 0);
    const spacing = (endEdge - startEdge - totalMiddle) / (middle.length + 1);
    const result = [first];
    let pos = startEdge + spacing;
    for (const c of middle) {
      const newPos = __spreadValues({}, c.position);
      if (direction === "horizontal") {
        newPos.x = pos;
        pos += c.size.width + spacing;
      } else {
        newPos.y = pos;
        pos += c.size.height + spacing;
      }
      result.push(new FormContainerDto(__spreadProps(__spreadValues({}, c), { position: newPos })));
    }
    result.push(last);
    return result;
  }
  arrangeSequentially(containers, direction, gap = 0) {
    if (containers.length < 2)
      return containers;
    const sorted = [...containers].sort((a, b) => direction === "horizontal" ? (a.position?.x ?? 0) - (b.position?.x ?? 0) : (a.position?.y ?? 0) - (b.position?.y ?? 0));
    const result = [sorted[0]];
    let prev = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
      const cur = sorted[i];
      const newPos = __spreadValues({}, cur.position);
      if (direction === "horizontal") {
        newPos.x = prev.position.x + prev.size.width + gap;
      } else {
        newPos.y = prev.position.y + prev.size.height + gap;
      }
      const updated = new FormContainerDto(__spreadProps(__spreadValues({}, cur), { position: newPos }));
      result.push(updated);
      prev = updated;
    }
    return result;
  }
  swapContainers(containers) {
    if (containers.length !== 2)
      return containers;
    const [a, b] = containers;
    return [
      new FormContainerDto(__spreadProps(__spreadValues({}, a), { position: b.position })),
      new FormContainerDto(__spreadProps(__spreadValues({}, b), { position: a.position }))
    ];
  }
  groupContainers(containers) {
    if (containers.length < 2)
      return containers;
    const groupId = `group-${Date.now()}`;
    return containers.map((c) => new FormContainerDto(__spreadProps(__spreadValues({}, c), { groupId })));
  }
  ungroupContainers(containers, allContainers) {
    if (containers.length === 0 || !containers[0].groupId)
      return [];
    const groupId = containers[0].groupId;
    return allContainers.filter((c) => c.groupId === groupId).map((c) => new FormContainerDto(__spreadProps(__spreadValues({}, c), { groupId: null })));
  }
  isGrouped(containers) {
    return containers.length > 0 && !!containers[0].groupId;
  }
  static \u0275fac = function ContainerOperationsService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _ContainerOperationsService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _ContainerOperationsService, factory: _ContainerOperationsService.\u0275fac, providedIn: "root" });
};

// src/app/features/form-designer-refactored/services/coordinate.service.ts
var CoordinateService = class _CoordinateService {
  PIXELS_PER_INCH = 96;
  inchesToPixels(inches) {
    return inches * this.PIXELS_PER_INCH;
  }
  pixelsToInches(pixels) {
    return pixels / this.PIXELS_PER_INCH;
  }
  getSheetSizeInPixels(sheetSize) {
    return {
      width: this.inchesToPixels(sheetSize.width),
      height: this.inchesToPixels(sheetSize.height)
    };
  }
  getScaledCoordinates(event, element, scale) {
    const rect = element.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / scale,
      y: (event.clientY - rect.top) / scale
    };
  }
  constrainPosition(container, boundsWidth, boundsHeight) {
    return {
      x: Math.max(0, Math.min(container.position.x, boundsWidth - container.size.width)),
      y: Math.max(0, Math.min(container.position.y, boundsHeight - container.size.height))
    };
  }
  constrainSize(width, height, minWidth = 50, minHeight = 20) {
    return {
      width: Math.max(minWidth, width),
      height: Math.max(minHeight, height)
    };
  }
  calculateDraggedPosition(initialPosition, dragDelta, containerSize, boundsWidth, boundsHeight) {
    return {
      x: Math.max(0, Math.min(initialPosition.x + dragDelta.dx, boundsWidth - containerSize.width)),
      y: Math.max(0, Math.min(initialPosition.y + dragDelta.dy, boundsHeight - containerSize.height))
    };
  }
  calculateResizedSize(initialSize, resizeDelta, minWidth = 50, minHeight = 20) {
    return {
      width: Math.max(minWidth, initialSize.width + resizeDelta.dx),
      height: Math.max(minHeight, initialSize.height + resizeDelta.dy)
    };
  }
  calculateFitToPanel(panelWidth, panelHeight, formWidth, formHeight, padding = 40) {
    const scaleX = (panelWidth - padding) / formWidth;
    const scaleY = (panelHeight - padding) / formHeight;
    return Math.min(scaleX, scaleY, 1);
  }
  getFormContainerStyle(formSize, scale) {
    return {
      width: `${formSize.width}px`,
      height: `${formSize.height}px`,
      transform: `scale(${scale})`,
      transformOrigin: "top left"
    };
  }
  getContainerPositionStyle(container) {
    return __spreadProps(__spreadValues({}, container.style), {
      position: "absolute",
      left: `${container.position?.x ?? 0}px`,
      top: `${container.position?.y ?? 0}px`,
      width: `${container.size?.width ?? 0}px`,
      height: `${container.size?.height ?? 0}px`
    });
  }
  getContentStyle(container) {
    if (!container.contentStyle)
      return {};
    const styles = __spreadValues({}, container.contentStyle);
    if (styles.fontSize && typeof styles.fontSize === "number") {
      styles.fontSize = `${styles.fontSize}px`;
    }
    return styles;
  }
  moveContainersByKeyboard(containers, direction, amount = 1) {
    const delta = { dx: 0, dy: 0 };
    switch (direction) {
      case "up":
        delta.dy = -amount;
        break;
      case "down":
        delta.dy = amount;
        break;
      case "left":
        delta.dx = -amount;
        break;
      case "right":
        delta.dx = amount;
        break;
    }
    return containers.map((c) => new FormContainerDto(__spreadProps(__spreadValues({}, c), {
      position: {
        x: (c.position?.x ?? 0) + delta.dx,
        y: (c.position?.y ?? 0) + delta.dy
      }
    })));
  }
  static \u0275fac = function CoordinateService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _CoordinateService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _CoordinateService, factory: _CoordinateService.\u0275fac, providedIn: "root" });
};

// src/app/features/form-designer-refactored/pipes/container-content.pipe.ts
var ContainerContentPipe = class _ContainerContentPipe {
  transform(container) {
    if (!container || !container.content)
      return "";
    switch (container.contentType) {
      case "text":
        return typeof container.content === "string" ? container.content : "";
      case "formField":
        return this.formatLabel(container.content.name);
      case "variable":
        return this.formatLabel(container.content);
      case "image":
        return typeof container.content === "string" ? container.content : "";
      default:
        if (typeof container.content === "string")
          return container.content;
        return container.content?.label || "";
    }
  }
  formatLabel(path) {
    if (!path)
      return "";
    return path.split(".").map((part) => {
      const result = part.replace(/([A-Z])/g, " $1");
      return result.charAt(0).toUpperCase() + result.slice(1);
    }).join(" -> ");
  }
  static \u0275fac = function ContainerContentPipe_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _ContainerContentPipe)();
  };
  static \u0275pipe = /* @__PURE__ */ \u0275\u0275definePipe({ name: "containerContent", type: _ContainerContentPipe, pure: true });
};

// src/app/features/form-designer-refactored/container-renderer/container-renderer.component.ts
var _c0 = () => [true, false];
var _c1 = () => ({ value: 1, label: "one" });
var _c2 = () => ({ value: 2, label: "two" });
var _c3 = () => ({ value: 3, label: "three" });
var _c4 = (a0, a1, a2) => [a0, a1, a2];
function ContainerRendererComponent_Case_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 0);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("ngStyle", ctx_r0.contentStyles());
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r0.container().content);
  }
}
function ContainerRendererComponent_Case_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 0);
    \u0275\u0275text(1);
    \u0275\u0275pipe(2, "containerContent");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("ngStyle", ctx_r0.contentStyles());
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(2, 2, ctx_r0.container()));
  }
}
function ContainerRendererComponent_Case_2_Case_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-invisible-input-field", 2);
  }
  if (rf & 2) {
    \u0275\u0275property("type", "text");
  }
}
function ContainerRendererComponent_Case_2_Case_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-invisible-input-field", 2);
  }
  if (rf & 2) {
    \u0275\u0275property("type", "text");
  }
}
function ContainerRendererComponent_Case_2_Case_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-invisible-input-field", 2);
  }
  if (rf & 2) {
    \u0275\u0275property("type", "date");
  }
}
function ContainerRendererComponent_Case_2_Case_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-invisible-input-field", 2);
  }
  if (rf & 2) {
    \u0275\u0275property("type", "time");
  }
}
function ContainerRendererComponent_Case_2_Case_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-invisible-input-field", 2);
  }
  if (rf & 2) {
    \u0275\u0275property("type", "number");
  }
}
function ContainerRendererComponent_Case_2_Case_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-invisible-input-field", 2);
  }
  if (rf & 2) {
    \u0275\u0275property("type", "file");
  }
}
function ContainerRendererComponent_Case_2_Case_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-checkbox-x");
  }
}
function ContainerRendererComponent_Case_2_Case_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-radio-checkboxes", 3);
  }
  if (rf & 2) {
    \u0275\u0275property("options", \u0275\u0275pureFunction0(1, _c0));
  }
}
function ContainerRendererComponent_Case_2_Case_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-invisible-searchable-select", 3);
  }
  if (rf & 2) {
    \u0275\u0275property("options", \u0275\u0275pureFunction3(4, _c4, \u0275\u0275pureFunction0(1, _c1), \u0275\u0275pureFunction0(2, _c2), \u0275\u0275pureFunction0(3, _c3)));
  }
}
function ContainerRendererComponent_Case_2_Case_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-invisible-searchable-multi-select", 3);
  }
  if (rf & 2) {
    \u0275\u0275property("options", \u0275\u0275pureFunction3(4, _c4, \u0275\u0275pureFunction0(1, _c1), \u0275\u0275pureFunction0(2, _c2), \u0275\u0275pureFunction0(3, _c3)));
  }
}
function ContainerRendererComponent_Case_2_Case_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-radio-checkboxes", 3);
  }
  if (rf & 2) {
    \u0275\u0275property("options", \u0275\u0275pureFunction0(1, _c0));
  }
}
function ContainerRendererComponent_Case_2_Case_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-nested-form-input");
  }
}
function ContainerRendererComponent_Case_2_Case_12_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 4);
    \u0275\u0275text(1);
    \u0275\u0275pipe(2, "containerContent");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(2, 1, ctx_r0.container()));
  }
}
function ContainerRendererComponent_Case_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, ContainerRendererComponent_Case_2_Case_0_Template, 1, 1, "app-invisible-input-field", 2)(1, ContainerRendererComponent_Case_2_Case_1_Template, 1, 1, "app-invisible-input-field", 2)(2, ContainerRendererComponent_Case_2_Case_2_Template, 1, 1, "app-invisible-input-field", 2)(3, ContainerRendererComponent_Case_2_Case_3_Template, 1, 1, "app-invisible-input-field", 2)(4, ContainerRendererComponent_Case_2_Case_4_Template, 1, 1, "app-invisible-input-field", 2)(5, ContainerRendererComponent_Case_2_Case_5_Template, 1, 1, "app-invisible-input-field", 2)(6, ContainerRendererComponent_Case_2_Case_6_Template, 1, 0, "app-checkbox-x")(7, ContainerRendererComponent_Case_2_Case_7_Template, 1, 2, "app-radio-checkboxes", 3)(8, ContainerRendererComponent_Case_2_Case_8_Template, 1, 8, "app-invisible-searchable-select", 3)(9, ContainerRendererComponent_Case_2_Case_9_Template, 1, 8, "app-invisible-searchable-multi-select", 3)(10, ContainerRendererComponent_Case_2_Case_10_Template, 1, 2, "app-radio-checkboxes", 3)(11, ContainerRendererComponent_Case_2_Case_11_Template, 1, 0, "app-nested-form-input")(12, ContainerRendererComponent_Case_2_Case_12_Template, 3, 3, "div", 4);
  }
  if (rf & 2) {
    let tmp_1_0;
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275conditional((tmp_1_0 = ctx_r0.getFormFieldType()) === "text" ? 0 : tmp_1_0 === "textarea" ? 1 : tmp_1_0 === "date" ? 2 : tmp_1_0 === "time" ? 3 : tmp_1_0 === "number" ? 4 : tmp_1_0 === "file" ? 5 : tmp_1_0 === "checkbox" ? 6 : tmp_1_0 === "radio" ? 7 : tmp_1_0 === "select" ? 8 : tmp_1_0 === "multi-select" ? 9 : tmp_1_0 === "radio-checkboxes" ? 10 : tmp_1_0 === "form-array" ? 11 : 12);
  }
}
function ContainerRendererComponent_Case_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "img", 1);
    \u0275\u0275pipe(1, "containerContent");
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("src", \u0275\u0275pipeBind1(1, 1, ctx_r0.container()), \u0275\u0275sanitizeUrl);
  }
}
function ContainerRendererComponent_Case_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 0);
    \u0275\u0275text(1);
    \u0275\u0275pipe(2, "containerContent");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275property("ngStyle", ctx_r0.container().contentStyle);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(2, 2, ctx_r0.container()));
  }
}
var ContainerRendererComponent = class _ContainerRendererComponent {
  coordinateService = inject(CoordinateService);
  container = input.required();
  contentStyles = computed(() => this.coordinateService.getContentStyle(this.container()));
  getFormFieldType() {
    const c = this.container();
    if (c.contentType === "formField" && c.content) {
      return c.content.type;
    }
    return void 0;
  }
  static \u0275fac = function ContainerRendererComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _ContainerRendererComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ContainerRendererComponent, selectors: [["app-container-renderer"]], inputs: { container: [1, "container"] }, decls: 5, vars: 1, consts: [[1, "text-content", 3, "ngStyle"], ["alt", "Image content", 2, "width", "100%", "height", "100%", "object-fit", "contain", 3, "src"], [3, "type"], [3, "options"], [1, "text-content"]], template: function ContainerRendererComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275template(0, ContainerRendererComponent_Case_0_Template, 2, 2, "div", 0)(1, ContainerRendererComponent_Case_1_Template, 3, 4, "div", 0)(2, ContainerRendererComponent_Case_2_Template, 13, 1)(3, ContainerRendererComponent_Case_3_Template, 2, 3, "img", 1)(4, ContainerRendererComponent_Case_4_Template, 3, 4, "div", 0);
    }
    if (rf & 2) {
      let tmp_0_0;
      \u0275\u0275conditional((tmp_0_0 = ctx.container().contentType) === "text" ? 0 : tmp_0_0 === "variable" ? 1 : tmp_0_0 === "formField" ? 2 : tmp_0_0 === "image" ? 3 : 4);
    }
  }, dependencies: [
    CommonModule,
    NgStyle,
    ContainerContentPipe,
    InvisibleInputFieldComponent,
    InvisibleSearchableSelectComponent,
    InvisibleSearchableMultiSelectComponent,
    RadioCheckboxesComponent,
    CheckboxXComponent,
    NestedFormInputComponent
  ], styles: ["\n\n[_nghost-%COMP%] {\n  display: contents;\n}\n.text-content[_ngcontent-%COMP%] {\n  width: 100%;\n  height: 100%;\n  overflow: hidden;\n  word-wrap: break-word;\n}\n/*# sourceMappingURL=container-renderer.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ContainerRendererComponent, { className: "ContainerRendererComponent", filePath: "src/app/features/form-designer-refactored/container-renderer/container-renderer.component.ts", lineNumber: 30 });
})();

// src/app/features/form-designer-refactored/container-list/container-list.component.ts
var _forTrack0 = ($index, $item) => $item.id;
function ContainerListComponent_For_6_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 7);
    \u0275\u0275text(1, "\u{1F512}");
    \u0275\u0275elementEnd();
  }
}
function ContainerListComponent_For_6_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1, "\u25A0");
    \u0275\u0275elementEnd();
  }
}
function ContainerListComponent_For_6_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "li", 5);
    \u0275\u0275listener("mouseenter", function ContainerListComponent_For_6_Template_li_mouseenter_0_listener() {
      const container_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onHover(container_r2));
    })("mouseleave", function ContainerListComponent_For_6_Template_li_mouseleave_0_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onHover(null));
    })("click", function ContainerListComponent_For_6_Template_li_click_0_listener($event) {
      const container_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.selectContainer(container_r2, $event));
    })("contextmenu", function ContainerListComponent_For_6_Template_li_contextmenu_0_listener($event) {
      const container_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onRightClick(container_r2, $event));
    });
    \u0275\u0275elementStart(1, "span", 6);
    \u0275\u0275template(2, ContainerListComponent_For_6_Conditional_2_Template, 2, 0, "span", 7)(3, ContainerListComponent_For_6_Conditional_3_Template, 2, 0, "span");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "span", 8);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const container_r2 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275classProp("selected", ctx_r2.isSelected(container_r2));
    \u0275\u0275advance(2);
    \u0275\u0275conditional(container_r2.locked ? 2 : 3);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(ctx_r2.getContainerName(container_r2));
  }
}
function ContainerListComponent_ForEmpty_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "li", 4);
    \u0275\u0275text(1, "No layers found.");
    \u0275\u0275elementEnd();
  }
}
var ContainerListComponent = class _ContainerListComponent {
  formState = inject(FormStateService);
  containersInput = input(null);
  containers = computed(() => {
    const source = this.containersInput() ?? this.formState.currentPageContainers();
    return [...source].sort((a, b) => {
      const zA = parseInt(String(a.style?.zIndex ?? 0), 10) || 0;
      const zB = parseInt(String(b.style?.zIndex ?? 0), 10) || 0;
      return zB - zA;
    });
  });
  hoverEvent = output();
  rightClickEvent = output();
  getContainerName(container) {
    return container.name ?? `Container ${container.id}`;
  }
  onHover(container) {
    this.formState.hoverContainer(container);
    this.hoverEvent.emit(container);
  }
  onRightClick(container, event) {
    this.rightClickEvent.emit({ container, event });
  }
  selectContainer(container, event) {
    this.formState.selectContainer(container, event);
  }
  isSelected(container) {
    return this.formState.isContainerSelected(container);
  }
  drop(event) {
    const reordered = [...this.containers()];
    moveItemInArray(reordered, event.previousIndex, event.currentIndex);
    this.formState.updateZIndexes(reordered);
  }
  static \u0275fac = function ContainerListComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _ContainerListComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ContainerListComponent, selectors: [["app-container-list"]], inputs: { containersInput: [1, "containersInput"] }, outputs: { hoverEvent: "hoverEvent", rightClickEvent: "rightClickEvent" }, decls: 8, vars: 1, consts: [[1, "container-list-wrapper"], [1, "list-header"], ["cdkDropList", "", 1, "container-list", 3, "cdkDropListDropped"], ["cdkDrag", "", 1, "container-item", 3, "selected"], [1, "empty-message"], ["cdkDrag", "", 1, "container-item", 3, "mouseenter", "mouseleave", "click", "contextmenu"], [1, "container-icon"], [1, "lock-icon"], [1, "container-name"]], template: function ContainerListComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "h4");
      \u0275\u0275text(3, "Layers");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(4, "ul", 2);
      \u0275\u0275listener("cdkDropListDropped", function ContainerListComponent_Template_ul_cdkDropListDropped_4_listener($event) {
        return ctx.drop($event);
      });
      \u0275\u0275repeaterCreate(5, ContainerListComponent_For_6_Template, 6, 4, "li", 3, _forTrack0, false, ContainerListComponent_ForEmpty_7_Template, 2, 0, "li", 4);
      \u0275\u0275elementEnd()();
    }
    if (rf & 2) {
      \u0275\u0275advance(5);
      \u0275\u0275repeater(ctx.containers());
    }
  }, dependencies: [CommonModule, DragDropModule, CdkDropList, CdkDrag], styles: ["\n\n.container-list-wrapper[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  height: 100%;\n  background-color: #f7f7f7;\n  border-left: 1px solid #e0e0e0;\n}\n.list-header[_ngcontent-%COMP%] {\n  padding: 10px 15px;\n  border-bottom: 1px solid #e0e0e0;\n  background-color: #f0f0f0;\n}\n.list-header[_ngcontent-%COMP%]   h4[_ngcontent-%COMP%] {\n  margin: 0;\n  font-size: 14px;\n  font-weight: 600;\n  color: #333;\n}\n.container-list[_ngcontent-%COMP%] {\n  list-style: none;\n  padding: 0;\n  margin: 0;\n  overflow-y: auto;\n  flex-grow: 1;\n}\n.container-item[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  padding: 10px 15px;\n  cursor: pointer;\n  border-bottom: 1px solid #e9e9e9;\n  transition: background-color 0.2s ease;\n  font-size: 13px;\n}\n.container-item[_ngcontent-%COMP%]:hover {\n  background-color: #e8f0fe;\n}\n.container-item.selected[_ngcontent-%COMP%] {\n  background-color: #d4e3ff;\n  font-weight: 500;\n  color: #0d47a1;\n}\n.container-icon[_ngcontent-%COMP%] {\n  margin-right: 10px;\n  color: #666;\n}\n.container-item.selected[_ngcontent-%COMP%]   .container-icon[_ngcontent-%COMP%] {\n  color: #0d47a1;\n}\n.container-name[_ngcontent-%COMP%] {\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n.empty-message[_ngcontent-%COMP%] {\n  padding: 20px;\n  text-align: center;\n  color: #888;\n  font-style: italic;\n}\n/*# sourceMappingURL=container-list.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ContainerListComponent, { className: "ContainerListComponent", filePath: "src/app/features/form-designer-refactored/container-list/container-list.component.ts", lineNumber: 14 });
})();

// src/app/features/form-designer-refactored/container-properties/container-properties.component.ts
var _forTrack02 = ($index, $item) => $item.path;
var _forTrack1 = ($index, $item) => $item.id;
function ContainerPropertiesComponent_Conditional_0_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 4)(1, "div", 5)(2, "label", 67);
    \u0275\u0275text(3, "Apply To");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "select", 68);
    \u0275\u0275listener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Conditional_8_Template_select_ngModelChange_4_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.setBulkEditTarget($event));
    });
    \u0275\u0275elementStart(5, "option", 69);
    \u0275\u0275text(6, "All Selected");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "option", 70);
    \u0275\u0275text(8, "All on Page");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "option", 71);
    \u0275\u0275text(10, "All of Same Type");
    \u0275\u0275elementEnd()()()();
    \u0275\u0275elementStart(11, "button", 29);
    \u0275\u0275listener("click", function ContainerPropertiesComponent_Conditional_0_Conditional_8_Template_button_click_11_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.applyBulkUpdate());
    });
    \u0275\u0275text(12, "Apply");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(4);
    \u0275\u0275property("ngModel", ctx_r1.bulkEditTarget());
  }
}
function ContainerPropertiesComponent_Conditional_0_For_22_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "option", 10);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const page_r5 = ctx.$implicit;
    \u0275\u0275property("value", page_r5);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(page_r5);
  }
}
function ContainerPropertiesComponent_Conditional_0_Case_123_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 4)(1, "div", 5)(2, "div", 72)(3, "label", 73);
    \u0275\u0275text(4, "Text");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "button", 74);
    \u0275\u0275listener("click", function ContainerPropertiesComponent_Conditional_0_Case_123_Template_button_click_5_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.useContainerNameAsContent());
    });
    \u0275\u0275text(6, "Use Name");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(7, "textarea", 75);
    \u0275\u0275twoWayListener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Case_123_Template_textarea_ngModelChange_7_listener($event) {
      \u0275\u0275restoreView(_r6);
      const c_r4 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(c_r4.content, $event) || (c_r4.content = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Case_123_Template_textarea_ngModelChange_7_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.onPropertyChange());
    });
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(8, "div", 4)(9, "div", 5)(10, "label", 76);
    \u0275\u0275text(11, "Font Size (px)");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(12, "input", 77);
    \u0275\u0275twoWayListener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Case_123_Template_input_ngModelChange_12_listener($event) {
      \u0275\u0275restoreView(_r6);
      const c_r4 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(c_r4.contentStyle.fontSize, $event) || (c_r4.contentStyle.fontSize = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Case_123_Template_input_ngModelChange_12_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.onPropertyChange());
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(13, "div", 5)(14, "label", 78);
    \u0275\u0275text(15, "Text Color");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(16, "input", 79);
    \u0275\u0275twoWayListener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Case_123_Template_input_ngModelChange_16_listener($event) {
      \u0275\u0275restoreView(_r6);
      const c_r4 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(c_r4.contentStyle.color, $event) || (c_r4.contentStyle.color = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Case_123_Template_input_ngModelChange_16_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.onPropertyChange());
    });
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(17, "div", 4)(18, "div", 5)(19, "label", 80);
    \u0275\u0275text(20, "Font Weight");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(21, "select", 81);
    \u0275\u0275twoWayListener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Case_123_Template_select_ngModelChange_21_listener($event) {
      \u0275\u0275restoreView(_r6);
      const c_r4 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(c_r4.style.fontWeight, $event) || (c_r4.style.fontWeight = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Case_123_Template_select_ngModelChange_21_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.onPropertyChange());
    });
    \u0275\u0275elementStart(22, "option", 82);
    \u0275\u0275text(23, "Normal");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(24, "option", 83);
    \u0275\u0275text(25, "Bold");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(26, "div", 5)(27, "label", 84);
    \u0275\u0275text(28, "Font Style");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(29, "select", 85);
    \u0275\u0275twoWayListener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Case_123_Template_select_ngModelChange_29_listener($event) {
      \u0275\u0275restoreView(_r6);
      const c_r4 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(c_r4.style.fontStyle, $event) || (c_r4.style.fontStyle = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Case_123_Template_select_ngModelChange_29_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.onPropertyChange());
    });
    \u0275\u0275elementStart(30, "option", 82);
    \u0275\u0275text(31, "Normal");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(32, "option", 86);
    \u0275\u0275text(33, "Italic");
    \u0275\u0275elementEnd()()()();
    \u0275\u0275elementStart(34, "div", 4)(35, "div", 5)(36, "label", 87);
    \u0275\u0275text(37, "White Space");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(38, "select", 88);
    \u0275\u0275twoWayListener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Case_123_Template_select_ngModelChange_38_listener($event) {
      \u0275\u0275restoreView(_r6);
      const c_r4 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(c_r4.contentStyle.whiteSpace, $event) || (c_r4.contentStyle.whiteSpace = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Case_123_Template_select_ngModelChange_38_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.onPropertyChange());
    });
    \u0275\u0275elementStart(39, "option", 82);
    \u0275\u0275text(40, "Normal");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(41, "option", 89);
    \u0275\u0275text(42, "Preserve Spaces & Wrap");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(43, "option", 90);
    \u0275\u0275text(44, "Preserve Spaces");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(45, "option", 91);
    \u0275\u0275text(46, "No Wrap");
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const c_r4 = \u0275\u0275nextContext();
    \u0275\u0275advance(7);
    \u0275\u0275twoWayProperty("ngModel", c_r4.content);
    \u0275\u0275advance(5);
    \u0275\u0275twoWayProperty("ngModel", c_r4.contentStyle.fontSize);
    \u0275\u0275advance(4);
    \u0275\u0275twoWayProperty("ngModel", c_r4.contentStyle.color);
    \u0275\u0275advance(5);
    \u0275\u0275twoWayProperty("ngModel", c_r4.style.fontWeight);
    \u0275\u0275advance(8);
    \u0275\u0275twoWayProperty("ngModel", c_r4.style.fontStyle);
    \u0275\u0275advance(9);
    \u0275\u0275twoWayProperty("ngModel", c_r4.contentStyle.whiteSpace);
  }
}
function ContainerPropertiesComponent_Conditional_0_Case_124_For_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "option", 94);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const field_r8 = ctx.$implicit;
    \u0275\u0275property("ngValue", field_r8.path);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(field_r8.label);
  }
}
function ContainerPropertiesComponent_Conditional_0_Case_124_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 4)(1, "div", 5)(2, "label", 92);
    \u0275\u0275text(3, "Field");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "select", 93);
    \u0275\u0275twoWayListener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Case_124_Template_select_ngModelChange_4_listener($event) {
      \u0275\u0275restoreView(_r7);
      const c_r4 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(c_r4.content, $event) || (c_r4.content = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Case_124_Template_select_ngModelChange_4_listener() {
      \u0275\u0275restoreView(_r7);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.onPropertyChange());
    });
    \u0275\u0275elementStart(5, "option", 94);
    \u0275\u0275text(6, "-- Select Field --");
    \u0275\u0275elementEnd();
    \u0275\u0275repeaterCreate(7, ContainerPropertiesComponent_Conditional_0_Case_124_For_8_Template, 2, 2, "option", 94, _forTrack02);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(9, "div", 4)(10, "div", 5)(11, "label", 76);
    \u0275\u0275text(12, "Font Size (px)");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(13, "input", 77);
    \u0275\u0275twoWayListener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Case_124_Template_input_ngModelChange_13_listener($event) {
      \u0275\u0275restoreView(_r7);
      const c_r4 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(c_r4.contentStyle.fontSize, $event) || (c_r4.contentStyle.fontSize = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Case_124_Template_input_ngModelChange_13_listener() {
      \u0275\u0275restoreView(_r7);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.onPropertyChange());
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(14, "div", 5)(15, "label", 78);
    \u0275\u0275text(16, "Text Color");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(17, "input", 79);
    \u0275\u0275twoWayListener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Case_124_Template_input_ngModelChange_17_listener($event) {
      \u0275\u0275restoreView(_r7);
      const c_r4 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(c_r4.contentStyle.color, $event) || (c_r4.contentStyle.color = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Case_124_Template_input_ngModelChange_17_listener() {
      \u0275\u0275restoreView(_r7);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.onPropertyChange());
    });
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(18, "div", 4)(19, "div", 5)(20, "label", 80);
    \u0275\u0275text(21, "Font Weight");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(22, "select", 81);
    \u0275\u0275twoWayListener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Case_124_Template_select_ngModelChange_22_listener($event) {
      \u0275\u0275restoreView(_r7);
      const c_r4 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(c_r4.style.fontWeight, $event) || (c_r4.style.fontWeight = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Case_124_Template_select_ngModelChange_22_listener() {
      \u0275\u0275restoreView(_r7);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.onPropertyChange());
    });
    \u0275\u0275elementStart(23, "option", 82);
    \u0275\u0275text(24, "Normal");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(25, "option", 83);
    \u0275\u0275text(26, "Bold");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(27, "div", 5)(28, "label", 84);
    \u0275\u0275text(29, "Font Style");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(30, "select", 85);
    \u0275\u0275twoWayListener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Case_124_Template_select_ngModelChange_30_listener($event) {
      \u0275\u0275restoreView(_r7);
      const c_r4 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(c_r4.style.fontStyle, $event) || (c_r4.style.fontStyle = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Case_124_Template_select_ngModelChange_30_listener() {
      \u0275\u0275restoreView(_r7);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.onPropertyChange());
    });
    \u0275\u0275elementStart(31, "option", 82);
    \u0275\u0275text(32, "Normal");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(33, "option", 86);
    \u0275\u0275text(34, "Italic");
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const c_r4 = \u0275\u0275nextContext();
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(4);
    \u0275\u0275twoWayProperty("ngModel", c_r4.content);
    \u0275\u0275property("compareWith", ctx_r1.compareFields);
    \u0275\u0275advance();
    \u0275\u0275property("ngValue", null);
    \u0275\u0275advance(2);
    \u0275\u0275repeater(ctx_r1.flattenedFields);
    \u0275\u0275advance(6);
    \u0275\u0275twoWayProperty("ngModel", c_r4.contentStyle.fontSize);
    \u0275\u0275advance(4);
    \u0275\u0275twoWayProperty("ngModel", c_r4.contentStyle.color);
    \u0275\u0275advance(5);
    \u0275\u0275twoWayProperty("ngModel", c_r4.style.fontWeight);
    \u0275\u0275advance(8);
    \u0275\u0275twoWayProperty("ngModel", c_r4.style.fontStyle);
  }
}
function ContainerPropertiesComponent_Conditional_0_Case_125_Conditional_0_For_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "option", 10);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const field_r10 = ctx.$implicit;
    \u0275\u0275property("value", field_r10.path);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(field_r10.label);
  }
}
function ContainerPropertiesComponent_Conditional_0_Case_125_Conditional_0_For_15_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "option", 10);
    \u0275\u0275text(1);
    \u0275\u0275pipe(2, "titlecase");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const type_r11 = ctx.$implicit;
    \u0275\u0275property("value", type_r11);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(2, 2, type_r11));
  }
}
function ContainerPropertiesComponent_Conditional_0_Case_125_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 4)(1, "div", 5)(2, "label", 95);
    \u0275\u0275text(3, "Field Name");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "select", 96);
    \u0275\u0275twoWayListener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Case_125_Conditional_0_Template_select_ngModelChange_4_listener($event) {
      \u0275\u0275restoreView(_r9);
      const c_r4 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(c_r4.content.name, $event) || (c_r4.content.name = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Case_125_Conditional_0_Template_select_ngModelChange_4_listener() {
      \u0275\u0275restoreView(_r9);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.onPropertyChange());
    });
    \u0275\u0275elementStart(5, "option", 97);
    \u0275\u0275text(6, "-- Select Field --");
    \u0275\u0275elementEnd();
    \u0275\u0275repeaterCreate(7, ContainerPropertiesComponent_Conditional_0_Case_125_Conditional_0_For_8_Template, 2, 2, "option", 10, _forTrack02);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(9, "div", 4)(10, "div", 5)(11, "label", 98);
    \u0275\u0275text(12, "Field Type");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(13, "select", 99);
    \u0275\u0275twoWayListener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Case_125_Conditional_0_Template_select_ngModelChange_13_listener($event) {
      \u0275\u0275restoreView(_r9);
      const c_r4 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(c_r4.content.type, $event) || (c_r4.content.type = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Case_125_Conditional_0_Template_select_ngModelChange_13_listener() {
      \u0275\u0275restoreView(_r9);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.onPropertyChange());
    });
    \u0275\u0275repeaterCreate(14, ContainerPropertiesComponent_Conditional_0_Case_125_Conditional_0_For_15_Template, 3, 4, "option", 10, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const c_r4 = \u0275\u0275nextContext(2);
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(4);
    \u0275\u0275twoWayProperty("ngModel", c_r4.content.name);
    \u0275\u0275advance(3);
    \u0275\u0275repeater(ctx_r1.flattenedFields);
    \u0275\u0275advance(6);
    \u0275\u0275twoWayProperty("ngModel", c_r4.content.type);
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r1.formFieldTypes);
  }
}
function ContainerPropertiesComponent_Conditional_0_Case_125_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, ContainerPropertiesComponent_Conditional_0_Case_125_Conditional_0_Template, 16, 2);
  }
  if (rf & 2) {
    const c_r4 = \u0275\u0275nextContext();
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275conditional(ctx_r1.isFormFieldContent(c_r4.content) ? 0 : -1);
  }
}
function ContainerPropertiesComponent_Conditional_0_Case_126_Conditional_0_For_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "option", 94);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const field_r13 = ctx.$implicit;
    \u0275\u0275property("ngValue", field_r13.path);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(field_r13.label);
  }
}
function ContainerPropertiesComponent_Conditional_0_Case_126_Conditional_0_For_17_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "option", 94);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const form_r14 = ctx.$implicit;
    \u0275\u0275property("ngValue", form_r14.id);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(form_r14.name);
  }
}
function ContainerPropertiesComponent_Conditional_0_Case_126_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r12 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 4)(1, "div", 5)(2, "label", 100);
    \u0275\u0275text(3, "Source Array");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "select", 101);
    \u0275\u0275twoWayListener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Case_126_Conditional_0_Template_select_ngModelChange_4_listener($event) {
      \u0275\u0275restoreView(_r12);
      const c_r4 = \u0275\u0275nextContext(2);
      \u0275\u0275twoWayBindingSet(c_r4.content.name, $event) || (c_r4.content.name = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Case_126_Conditional_0_Template_select_ngModelChange_4_listener() {
      \u0275\u0275restoreView(_r12);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.onPropertyChange());
    });
    \u0275\u0275elementStart(5, "option", 94);
    \u0275\u0275text(6, "-- Select Array Field --");
    \u0275\u0275elementEnd();
    \u0275\u0275repeaterCreate(7, ContainerPropertiesComponent_Conditional_0_Case_126_Conditional_0_For_8_Template, 2, 2, "option", 94, _forTrack02);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(9, "div", 4)(10, "div", 5)(11, "label", 102);
    \u0275\u0275text(12, "Form Template");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(13, "select", 103);
    \u0275\u0275twoWayListener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Case_126_Conditional_0_Template_select_ngModelChange_13_listener($event) {
      \u0275\u0275restoreView(_r12);
      const ctx_r1 = \u0275\u0275nextContext(3);
      \u0275\u0275twoWayBindingSet(ctx_r1.formId, $event) || (ctx_r1.formId = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Case_126_Conditional_0_Template_select_ngModelChange_13_listener() {
      \u0275\u0275restoreView(_r12);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.onEntityFieldTypeChange());
    });
    \u0275\u0275elementStart(14, "option", 94);
    \u0275\u0275text(15, "-- Select Form --");
    \u0275\u0275elementEnd();
    \u0275\u0275repeaterCreate(16, ContainerPropertiesComponent_Conditional_0_Case_126_Conditional_0_For_17_Template, 2, 2, "option", 94, _forTrack1);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const c_r4 = \u0275\u0275nextContext(2);
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(4);
    \u0275\u0275twoWayProperty("ngModel", c_r4.content.name);
    \u0275\u0275advance();
    \u0275\u0275property("ngValue", null);
    \u0275\u0275advance(2);
    \u0275\u0275repeater(ctx_r1.arrayFields);
    \u0275\u0275advance(6);
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.formId);
    \u0275\u0275advance();
    \u0275\u0275property("ngValue", null);
    \u0275\u0275advance(2);
    \u0275\u0275repeater(ctx_r1.printableForms());
  }
}
function ContainerPropertiesComponent_Conditional_0_Case_126_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, ContainerPropertiesComponent_Conditional_0_Case_126_Conditional_0_Template, 18, 4);
  }
  if (rf & 2) {
    const c_r4 = \u0275\u0275nextContext();
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275conditional(ctx_r1.isFormFieldContent(c_r4.content) ? 0 : -1);
  }
}
function ContainerPropertiesComponent_Conditional_0_Case_127_Template(rf, ctx) {
  if (rf & 1) {
    const _r15 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 4)(1, "div", 5)(2, "label", 104);
    \u0275\u0275text(3, "Image");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "input", 105);
    \u0275\u0275listener("change", function ContainerPropertiesComponent_Conditional_0_Case_127_Template_input_change_4_listener($event) {
      \u0275\u0275restoreView(_r15);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.onFileSelected($event));
    });
    \u0275\u0275elementEnd()()();
  }
}
function ContainerPropertiesComponent_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 0)(1, "h3");
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "div", 1)(4, "label");
    \u0275\u0275text(5, "Bulk Edit Mode");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "div", 2)(7, "input", 3);
    \u0275\u0275listener("change", function ContainerPropertiesComponent_Conditional_0_Template_input_change_7_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.toggleBulkEditMode());
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275template(8, ContainerPropertiesComponent_Conditional_0_Conditional_8_Template, 13, 1);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "div", 1)(10, "label");
    \u0275\u0275text(11, "Container");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(12, "div", 4)(13, "div", 5)(14, "label", 6);
    \u0275\u0275text(15, "Name");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(16, "input", 7);
    \u0275\u0275twoWayListener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Template_input_ngModelChange_16_listener($event) {
      const c_r4 = \u0275\u0275restoreView(_r1);
      \u0275\u0275twoWayBindingSet(c_r4.name, $event) || (c_r4.name = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Template_input_ngModelChange_16_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onPropertyChange());
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(17, "div", 5)(18, "label", 8);
    \u0275\u0275text(19, "Page");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(20, "select", 9);
    \u0275\u0275listener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Template_select_ngModelChange_20_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.setPageNumber(+$event));
    });
    \u0275\u0275repeaterCreate(21, ContainerPropertiesComponent_Conditional_0_For_22_Template, 2, 2, "option", 10, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(23, "div", 2)(24, "label");
    \u0275\u0275text(25, "Locked:");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(26, "input", 3);
    \u0275\u0275listener("change", function ContainerPropertiesComponent_Conditional_0_Template_input_change_26_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.toggleLocked());
    });
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(27, "div", 1)(28, "label");
    \u0275\u0275text(29, "Position");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(30, "div", 4)(31, "div", 5)(32, "label", 11);
    \u0275\u0275text(33, "X");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(34, "input", 12);
    \u0275\u0275twoWayListener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Template_input_ngModelChange_34_listener($event) {
      const c_r4 = \u0275\u0275restoreView(_r1);
      \u0275\u0275twoWayBindingSet(c_r4.position.x, $event) || (c_r4.position.x = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Template_input_ngModelChange_34_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onPropertyChange());
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(35, "div", 5)(36, "label", 13);
    \u0275\u0275text(37, "Y");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(38, "input", 14);
    \u0275\u0275twoWayListener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Template_input_ngModelChange_38_listener($event) {
      const c_r4 = \u0275\u0275restoreView(_r1);
      \u0275\u0275twoWayBindingSet(c_r4.position.y, $event) || (c_r4.position.y = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Template_input_ngModelChange_38_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onPropertyChange());
    });
    \u0275\u0275elementEnd()()()();
    \u0275\u0275elementStart(39, "div", 1)(40, "label");
    \u0275\u0275text(41, "Size");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(42, "div", 4)(43, "div", 5)(44, "label", 15);
    \u0275\u0275text(45, "Width");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(46, "input", 16);
    \u0275\u0275twoWayListener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Template_input_ngModelChange_46_listener($event) {
      const c_r4 = \u0275\u0275restoreView(_r1);
      \u0275\u0275twoWayBindingSet(c_r4.size.width, $event) || (c_r4.size.width = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Template_input_ngModelChange_46_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onPropertyChange());
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(47, "div", 5)(48, "label", 17);
    \u0275\u0275text(49, "Height");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(50, "input", 18);
    \u0275\u0275twoWayListener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Template_input_ngModelChange_50_listener($event) {
      const c_r4 = \u0275\u0275restoreView(_r1);
      \u0275\u0275twoWayBindingSet(c_r4.size.height, $event) || (c_r4.size.height = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Template_input_ngModelChange_50_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onPropertyChange());
    });
    \u0275\u0275elementEnd()()()();
    \u0275\u0275elementStart(51, "div", 1)(52, "label");
    \u0275\u0275text(53, "Style");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(54, "div", 4)(55, "div", 5)(56, "label", 19);
    \u0275\u0275text(57, "Background");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(58, "input", 20);
    \u0275\u0275twoWayListener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Template_input_ngModelChange_58_listener($event) {
      const c_r4 = \u0275\u0275restoreView(_r1);
      \u0275\u0275twoWayBindingSet(c_r4.style.backgroundColor, $event) || (c_r4.style.backgroundColor = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Template_input_ngModelChange_58_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onPropertyChange());
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(59, "div", 21)(60, "label", 22);
    \u0275\u0275text(61, "Transparent");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(62, "input", 23);
    \u0275\u0275listener("change", function ContainerPropertiesComponent_Conditional_0_Template_input_change_62_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.toggleTransparentBackground());
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(63, "div", 5)(64, "label", 24);
    \u0275\u0275text(65, "Border Color");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(66, "input", 25);
    \u0275\u0275twoWayListener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Template_input_ngModelChange_66_listener($event) {
      const c_r4 = \u0275\u0275restoreView(_r1);
      \u0275\u0275twoWayBindingSet(c_r4.style.borderColor, $event) || (c_r4.style.borderColor = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Template_input_ngModelChange_66_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onPropertyChange());
    });
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(67, "div", 4)(68, "div", 5)(69, "label", 26);
    \u0275\u0275text(70, "Border Radius");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(71, "input", 27);
    \u0275\u0275twoWayListener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Template_input_ngModelChange_71_listener($event) {
      const c_r4 = \u0275\u0275restoreView(_r1);
      \u0275\u0275twoWayBindingSet(c_r4.style.borderRadius, $event) || (c_r4.style.borderRadius = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Template_input_ngModelChange_71_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onPropertyChange());
    });
    \u0275\u0275elementEnd()()()();
    \u0275\u0275elementStart(72, "div", 1)(73, "label");
    \u0275\u0275text(74, "Border Visibility");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(75, "div", 28)(76, "button", 29);
    \u0275\u0275listener("click", function ContainerPropertiesComponent_Conditional_0_Template_button_click_76_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.toggleBorder("Top"));
    });
    \u0275\u0275text(77, "Top");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(78, "button", 29);
    \u0275\u0275listener("click", function ContainerPropertiesComponent_Conditional_0_Template_button_click_78_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.toggleBorder("Right"));
    });
    \u0275\u0275text(79, "Right");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(80, "button", 29);
    \u0275\u0275listener("click", function ContainerPropertiesComponent_Conditional_0_Template_button_click_80_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.toggleBorder("Bottom"));
    });
    \u0275\u0275text(81, "Bottom");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(82, "button", 29);
    \u0275\u0275listener("click", function ContainerPropertiesComponent_Conditional_0_Template_button_click_82_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.toggleBorder("Left"));
    });
    \u0275\u0275text(83, "Left");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(84, "div", 1)(85, "label");
    \u0275\u0275text(86, "Border Thickness");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(87, "div", 4)(88, "div", 5)(89, "label", 30);
    \u0275\u0275text(90, "Top");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(91, "input", 31);
    \u0275\u0275twoWayListener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Template_input_ngModelChange_91_listener($event) {
      const c_r4 = \u0275\u0275restoreView(_r1);
      \u0275\u0275twoWayBindingSet(c_r4.style.borderTopWidth, $event) || (c_r4.style.borderTopWidth = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Template_input_ngModelChange_91_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onPropertyChange());
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(92, "div", 5)(93, "label", 32);
    \u0275\u0275text(94, "Right");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(95, "input", 33);
    \u0275\u0275twoWayListener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Template_input_ngModelChange_95_listener($event) {
      const c_r4 = \u0275\u0275restoreView(_r1);
      \u0275\u0275twoWayBindingSet(c_r4.style.borderRightWidth, $event) || (c_r4.style.borderRightWidth = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Template_input_ngModelChange_95_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onPropertyChange());
    });
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(96, "div", 4)(97, "div", 5)(98, "label", 34);
    \u0275\u0275text(99, "Bottom");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(100, "input", 35);
    \u0275\u0275twoWayListener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Template_input_ngModelChange_100_listener($event) {
      const c_r4 = \u0275\u0275restoreView(_r1);
      \u0275\u0275twoWayBindingSet(c_r4.style.borderBottomWidth, $event) || (c_r4.style.borderBottomWidth = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Template_input_ngModelChange_100_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onPropertyChange());
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(101, "div", 5)(102, "label", 36);
    \u0275\u0275text(103, "Left");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(104, "input", 37);
    \u0275\u0275twoWayListener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Template_input_ngModelChange_104_listener($event) {
      const c_r4 = \u0275\u0275restoreView(_r1);
      \u0275\u0275twoWayBindingSet(c_r4.style.borderLeftWidth, $event) || (c_r4.style.borderLeftWidth = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Template_input_ngModelChange_104_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onPropertyChange());
    });
    \u0275\u0275elementEnd()()()();
    \u0275\u0275elementStart(105, "div", 1)(106, "label");
    \u0275\u0275text(107, "Content");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(108, "div", 4)(109, "div", 5)(110, "label", 38);
    \u0275\u0275text(111, "Content Type");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(112, "select", 39);
    \u0275\u0275twoWayListener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Template_select_ngModelChange_112_listener($event) {
      const c_r4 = \u0275\u0275restoreView(_r1);
      \u0275\u0275twoWayBindingSet(c_r4.contentType, $event) || (c_r4.contentType = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Template_select_ngModelChange_112_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onContentTypeChange());
    });
    \u0275\u0275elementStart(113, "option", 40);
    \u0275\u0275text(114, "Text");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(115, "option", 41);
    \u0275\u0275text(116, "Form Field");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(117, "option", 42);
    \u0275\u0275text(118, "Dynamic Content");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(119, "option", 43);
    \u0275\u0275text(120, "Image");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(121, "option", 44);
    \u0275\u0275text(122, "Repeating Section");
    \u0275\u0275elementEnd()()()();
    \u0275\u0275template(123, ContainerPropertiesComponent_Conditional_0_Case_123_Template, 47, 6)(124, ContainerPropertiesComponent_Conditional_0_Case_124_Template, 35, 7)(125, ContainerPropertiesComponent_Conditional_0_Case_125_Template, 1, 1)(126, ContainerPropertiesComponent_Conditional_0_Case_126_Template, 1, 1)(127, ContainerPropertiesComponent_Conditional_0_Case_127_Template, 5, 0, "div", 4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(128, "div", 1)(129, "label");
    \u0275\u0275text(130, "Content Position");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(131, "div", 4)(132, "div", 5)(133, "label", 45);
    \u0275\u0275text(134, "Justify");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(135, "select", 46);
    \u0275\u0275twoWayListener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Template_select_ngModelChange_135_listener($event) {
      const c_r4 = \u0275\u0275restoreView(_r1);
      \u0275\u0275twoWayBindingSet(c_r4.style.justifyContent, $event) || (c_r4.style.justifyContent = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Template_select_ngModelChange_135_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onPropertyChange());
    });
    \u0275\u0275elementStart(136, "option", 47);
    \u0275\u0275text(137, "Start");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(138, "option", 48);
    \u0275\u0275text(139, "Center");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(140, "option", 49);
    \u0275\u0275text(141, "End");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(142, "option", 50);
    \u0275\u0275text(143, "Space Between");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(144, "option", 51);
    \u0275\u0275text(145, "Space Around");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(146, "div", 5)(147, "label", 52);
    \u0275\u0275text(148, "Align");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(149, "select", 53);
    \u0275\u0275twoWayListener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Template_select_ngModelChange_149_listener($event) {
      const c_r4 = \u0275\u0275restoreView(_r1);
      \u0275\u0275twoWayBindingSet(c_r4.style.alignItems, $event) || (c_r4.style.alignItems = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Template_select_ngModelChange_149_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onPropertyChange());
    });
    \u0275\u0275elementStart(150, "option", 47);
    \u0275\u0275text(151, "Start");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(152, "option", 48);
    \u0275\u0275text(153, "Center");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(154, "option", 49);
    \u0275\u0275text(155, "End");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(156, "option", 54);
    \u0275\u0275text(157, "Stretch");
    \u0275\u0275elementEnd()()()()();
    \u0275\u0275elementStart(158, "div", 1)(159, "label");
    \u0275\u0275text(160, "Padding");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(161, "div", 4)(162, "div", 5)(163, "label", 55);
    \u0275\u0275text(164, "All");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(165, "input", 56);
    \u0275\u0275listener("change", function ContainerPropertiesComponent_Conditional_0_Template_input_change_165_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.setAllPaddings($event));
    });
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(166, "div", 4)(167, "div", 5)(168, "label", 57);
    \u0275\u0275text(169, "Top");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(170, "input", 58);
    \u0275\u0275twoWayListener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Template_input_ngModelChange_170_listener($event) {
      const c_r4 = \u0275\u0275restoreView(_r1);
      \u0275\u0275twoWayBindingSet(c_r4.style.paddingTop, $event) || (c_r4.style.paddingTop = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Template_input_ngModelChange_170_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onPropertyChange());
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(171, "div", 5)(172, "label", 59);
    \u0275\u0275text(173, "Right");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(174, "input", 60);
    \u0275\u0275twoWayListener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Template_input_ngModelChange_174_listener($event) {
      const c_r4 = \u0275\u0275restoreView(_r1);
      \u0275\u0275twoWayBindingSet(c_r4.style.paddingRight, $event) || (c_r4.style.paddingRight = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Template_input_ngModelChange_174_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onPropertyChange());
    });
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(175, "div", 4)(176, "div", 5)(177, "label", 61);
    \u0275\u0275text(178, "Bottom");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(179, "input", 62);
    \u0275\u0275twoWayListener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Template_input_ngModelChange_179_listener($event) {
      const c_r4 = \u0275\u0275restoreView(_r1);
      \u0275\u0275twoWayBindingSet(c_r4.style.paddingBottom, $event) || (c_r4.style.paddingBottom = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Template_input_ngModelChange_179_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onPropertyChange());
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(180, "div", 5)(181, "label", 63);
    \u0275\u0275text(182, "Left");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(183, "input", 64);
    \u0275\u0275twoWayListener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Template_input_ngModelChange_183_listener($event) {
      const c_r4 = \u0275\u0275restoreView(_r1);
      \u0275\u0275twoWayBindingSet(c_r4.style.paddingLeft, $event) || (c_r4.style.paddingLeft = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("ngModelChange", function ContainerPropertiesComponent_Conditional_0_Template_input_ngModelChange_183_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onPropertyChange());
    });
    \u0275\u0275elementEnd()()()();
    \u0275\u0275elementStart(184, "div", 65)(185, "button", 66);
    \u0275\u0275listener("click", function ContainerPropertiesComponent_Conditional_0_Template_button_click_185_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onDelete());
    });
    \u0275\u0275text(186, "Delete Container");
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    let tmp_26_0;
    const c_r4 = ctx;
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(ctx_r1.getContainerName());
    \u0275\u0275advance(5);
    \u0275\u0275property("checked", ctx_r1.isBulkEditMode());
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r1.isBulkEditMode() ? 8 : -1);
    \u0275\u0275advance(8);
    \u0275\u0275twoWayProperty("ngModel", c_r4.name);
    \u0275\u0275advance(4);
    \u0275\u0275property("ngModel", c_r4.pageNumber);
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r1.pages());
    \u0275\u0275advance(5);
    \u0275\u0275property("checked", c_r4.locked);
    \u0275\u0275advance(8);
    \u0275\u0275twoWayProperty("ngModel", c_r4.position.x);
    \u0275\u0275advance(4);
    \u0275\u0275twoWayProperty("ngModel", c_r4.position.y);
    \u0275\u0275advance(8);
    \u0275\u0275twoWayProperty("ngModel", c_r4.size.width);
    \u0275\u0275advance(4);
    \u0275\u0275twoWayProperty("ngModel", c_r4.size.height);
    \u0275\u0275advance(8);
    \u0275\u0275twoWayProperty("ngModel", c_r4.style.backgroundColor);
    \u0275\u0275advance(4);
    \u0275\u0275property("checked", c_r4.style.backgroundColor === "transparent");
    \u0275\u0275advance(4);
    \u0275\u0275twoWayProperty("ngModel", c_r4.style.borderColor);
    \u0275\u0275advance(5);
    \u0275\u0275twoWayProperty("ngModel", c_r4.style.borderRadius);
    \u0275\u0275advance(5);
    \u0275\u0275classProp("active", ctx_r1.isBorderVisible("Top"));
    \u0275\u0275advance(2);
    \u0275\u0275classProp("active", ctx_r1.isBorderVisible("Right"));
    \u0275\u0275advance(2);
    \u0275\u0275classProp("active", ctx_r1.isBorderVisible("Bottom"));
    \u0275\u0275advance(2);
    \u0275\u0275classProp("active", ctx_r1.isBorderVisible("Left"));
    \u0275\u0275advance(9);
    \u0275\u0275twoWayProperty("ngModel", c_r4.style.borderTopWidth);
    \u0275\u0275advance(4);
    \u0275\u0275twoWayProperty("ngModel", c_r4.style.borderRightWidth);
    \u0275\u0275advance(5);
    \u0275\u0275twoWayProperty("ngModel", c_r4.style.borderBottomWidth);
    \u0275\u0275advance(4);
    \u0275\u0275twoWayProperty("ngModel", c_r4.style.borderLeftWidth);
    \u0275\u0275advance(8);
    \u0275\u0275twoWayProperty("ngModel", c_r4.contentType);
    \u0275\u0275advance(11);
    \u0275\u0275conditional((tmp_26_0 = c_r4.contentType) === "text" ? 123 : tmp_26_0 === "variable" ? 124 : tmp_26_0 === "formField" ? 125 : tmp_26_0 === "repeatingSection" ? 126 : tmp_26_0 === "image" ? 127 : -1);
    \u0275\u0275advance(12);
    \u0275\u0275twoWayProperty("ngModel", c_r4.style.justifyContent);
    \u0275\u0275advance(14);
    \u0275\u0275twoWayProperty("ngModel", c_r4.style.alignItems);
    \u0275\u0275advance(21);
    \u0275\u0275twoWayProperty("ngModel", c_r4.style.paddingTop);
    \u0275\u0275advance(4);
    \u0275\u0275twoWayProperty("ngModel", c_r4.style.paddingRight);
    \u0275\u0275advance(5);
    \u0275\u0275twoWayProperty("ngModel", c_r4.style.paddingBottom);
    \u0275\u0275advance(4);
    \u0275\u0275twoWayProperty("ngModel", c_r4.style.paddingLeft);
  }
}
var ContainerPropertiesComponent = class _ContainerPropertiesComponent {
  container = null;
  availableFields = {};
  updateContainerEvent = new EventEmitter();
  deleteContainerEvent = new EventEmitter();
  bulkUpdateEvent = new EventEmitter();
  propertyChange$ = new Subject();
  formState = inject(FormStateService);
  destroyRef = inject(DestroyRef);
  flattenedFields = [];
  arrayFields = [];
  formFieldTypes = [
    "text",
    "textarea",
    "select",
    "multi-select",
    "date",
    "time",
    "checkbox-group",
    "checkbox",
    "radio",
    "file",
    "multi-input",
    "number",
    "radio-group",
    "form-array"
  ];
  totalPages = this.formState.totalPages;
  pages = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));
  isBulkEditMode = signal(false);
  bulkEditTarget = signal("selected");
  printableForms = toSignal(this.formState.allForms$, { initialValue: [] });
  ngOnInit() {
    this.propertyChange$.pipe(debounceTime(700), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.container) {
        this.submitChanges(new FormContainerDto(this.container));
      }
    });
  }
  ngOnChanges(changes) {
    if (changes["availableFields"] && this.availableFields) {
      this.processAvailableFields(this.availableFields);
    }
  }
  onPropertyChange() {
    this.propertyChange$.next();
  }
  useContainerNameAsContent() {
    if (this.container) {
      this.container.content = this.container.name;
      this.onPropertyChange();
    }
  }
  setAllPaddings(event) {
    if (this.container) {
      const input2 = event.target;
      const value = input2.value;
      const padding = value ? `${value}px` : "";
      this.container.style.paddingTop = padding;
      this.container.style.paddingRight = padding;
      this.container.style.paddingBottom = padding;
      this.container.style.paddingLeft = padding;
      this.onPropertyChange();
    }
  }
  onDelete() {
    this.deleteContainerEvent.emit(this.container?.id ?? 0);
  }
  getContainerName() {
    return this.container?.name ?? "No Name";
  }
  submitChanges(container) {
    if (this.updateContainerEvent.observed) {
      this.updateContainerEvent.emit(container);
    } else {
      this.formState.updateContainer(container);
    }
  }
  toggleBorder(side) {
    if (!this.container)
      return;
    const borderSide = `border${side}Width`;
    const style = this.container.style;
    const currentWidth = style[borderSide];
    if (currentWidth === "0px" || !currentWidth) {
      style[borderSide] = "1px";
    } else {
      style[borderSide] = "0px";
    }
    this.onPropertyChange();
  }
  isBorderVisible(side) {
    if (!this.container)
      return false;
    const borderSide = `border${side}Width`;
    const width = this.container.style[borderSide];
    return width !== "0px" && !!width;
  }
  toggleLocked() {
    if (this.container) {
      this.container.locked = !this.container.locked;
      this.onPropertyChange();
    }
  }
  toggleTransparentBackground() {
    if (this.container) {
      if (this.container.style.backgroundColor === "transparent") {
        this.container.style.backgroundColor = "#ffffff";
      } else {
        this.container.style.backgroundColor = "transparent";
      }
      this.onPropertyChange();
    }
  }
  toggleBulkEditMode() {
    this.isBulkEditMode.update((v) => !v);
  }
  setBulkEditTarget(target) {
    this.bulkEditTarget.set(target);
  }
  applyBulkUpdate() {
    if (!this.container)
      return;
    const propertiesToUpdate = {
      size: this.container.size,
      style: this.container.style,
      contentStyle: this.container.contentStyle,
      pageNumber: this.container.pageNumber
    };
    const target = this.bulkEditTarget();
    let containerType;
    if (target === "type" && this.container.contentType === "formField" && typeof this.container.content === "object" && this.container.content) {
      containerType = this.container.content.type;
    }
    this.formState.bulkUpdateContainers(target, containerType, propertiesToUpdate);
  }
  onContentTypeChange() {
    if (this.container) {
      if (this.container.contentType === "formField") {
        if (typeof this.container.content !== "object" || !this.container.content || !("type" in this.container.content)) {
          this.container.content = { name: "", type: "text", label: "", options: [], initialValue: null };
        }
      } else if (this.container.contentType === "text") {
        this.container.content = "";
      } else if (this.container.contentType === "repeatingSection") {
        if (typeof this.container.content !== "object" || !this.container.content || !("type" in this.container.content)) {
          this.container.content = { name: "", type: "form-array", label: "", nestedForm: new PrintableFormDto(), initialValue: null };
        }
      } else {
        this.container.content = null;
      }
      this.onPropertyChange();
    }
  }
  formId = 0;
  onEntityFieldTypeChange() {
    if (this.container && this.container.contentType === "repeatingSection" && this.isFormFieldContent(this.container.content)) {
      const selectedForm = this.printableForms().find((form) => form.id === this.formId);
      if (selectedForm) {
        this.container.content.nestedForm = selectedForm;
      }
    }
    this.onPropertyChange();
  }
  onFileSelected(event) {
    const input2 = event.target;
    if (input2.files && input2.files[0] && this.container) {
      const file = input2.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        if (this.container) {
          this.container.content = e.target?.result;
          this.onPropertyChange();
        }
      };
      reader.readAsDataURL(file);
    }
  }
  compareFields(f1, f2) {
    return f1 && f2 ? f1.name === f2.name : f1 === f2;
  }
  isFormFieldContent(content) {
    return content && typeof content === "object" && "type" in content;
  }
  setPageNumber(pageNumber) {
    if (this.container) {
      this.container.pageNumber = pageNumber;
      this.onPropertyChange();
    }
  }
  processAvailableFields(dto) {
    const { fields, arrayFields } = this.flattenDto(dto);
    this.flattenedFields = fields;
    this.arrayFields = arrayFields;
  }
  flattenDto(obj, path = "", label = "") {
    let fields = [];
    let arrayFields = [];
    if (!obj || typeof obj !== "object") {
      return { fields, arrayFields };
    }
    for (const key of Object.keys(obj)) {
      if (key.startsWith("_"))
        continue;
      const value = obj[key];
      const newPath = path ? `${path}.${key}` : key;
      const newLabel = label ? `${label} > ${this.formatLabel(key)}` : this.formatLabel(key);
      if (Array.isArray(value)) {
        arrayFields.push({ path: newPath, label: newLabel });
      } else if (value && typeof value === "object" && Object.keys(value).length > 0) {
        const nested = this.flattenDto(value, newPath, newLabel);
        fields = fields.concat(nested.fields);
        arrayFields = arrayFields.concat(nested.arrayFields);
      } else {
        fields.push({ path: newPath, label: newLabel });
      }
    }
    return { fields, arrayFields };
  }
  formatLabel(key) {
    const result = key.replace(/([A-Z])/g, " $1");
    return result.charAt(0).toUpperCase() + result.slice(1);
  }
  static \u0275fac = function ContainerPropertiesComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _ContainerPropertiesComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ContainerPropertiesComponent, selectors: [["app-container-properties"]], inputs: { container: "container", availableFields: "availableFields" }, outputs: { updateContainerEvent: "updateContainerEvent", deleteContainerEvent: "deleteContainerEvent", bulkUpdateEvent: "bulkUpdateEvent" }, features: [\u0275\u0275NgOnChangesFeature], decls: 1, vars: 1, consts: [[1, "properties-panel"], [1, "property-group"], [1, "property-row"], ["type", "checkbox", 3, "change", "checked"], [1, "input-row"], [1, "input-field"], ["for", "containerName"], ["id", "containerName", "type", "text", 3, "ngModelChange", "ngModel"], ["for", "pageNumber"], ["id", "pageNumber", 3, "ngModelChange", "ngModel"], [3, "value"], ["for", "posX"], ["id", "posX", "type", "number", 3, "ngModelChange", "ngModel"], ["for", "posY"], ["id", "posY", "type", "number", 3, "ngModelChange", "ngModel"], ["for", "width"], ["id", "width", "type", "number", 3, "ngModelChange", "ngModel"], ["for", "height"], ["id", "height", "type", "number", 3, "ngModelChange", "ngModel"], ["for", "backgroundColor"], ["id", "backgroundColor", "type", "color", 3, "ngModelChange", "ngModel"], [1, "input-field-addon"], ["for", "transparentBg"], ["id", "transparentBg", "type", "checkbox", 3, "change", "checked"], ["for", "borderColor"], ["id", "borderColor", "type", "color", 3, "ngModelChange", "ngModel"], ["for", "borderRadius"], ["id", "borderRadius", "type", "text", "placeholder", "e.g., 5px or 50%", 3, "ngModelChange", "ngModel"], [1, "input-row", "border-toggle-buttons"], [3, "click"], ["for", "borderTopWidth"], ["id", "borderTopWidth", "type", "text", "placeholder", "e.g., 1px", 3, "ngModelChange", "ngModel"], ["for", "borderRightWidth"], ["id", "borderRightWidth", "type", "text", "placeholder", "e.g., 1px", 3, "ngModelChange", "ngModel"], ["for", "borderBottomWidth"], ["id", "borderBottomWidth", "type", "text", "placeholder", "e.g., 1px", 3, "ngModelChange", "ngModel"], ["for", "borderLeftWidth"], ["id", "borderLeftWidth", "type", "text", "placeholder", "e.g., 1px", 3, "ngModelChange", "ngModel"], ["for", "contentType"], ["id", "contentType", 3, "ngModelChange", "ngModel"], ["value", "text"], ["value", "formField"], ["value", "variable"], ["value", "image"], ["value", "repeatingSection"], ["for", "justifyContent"], ["id", "justifyContent", 3, "ngModelChange", "ngModel"], ["value", "flex-start"], ["value", "center"], ["value", "flex-end"], ["value", "space-between"], ["value", "space-around"], ["for", "alignItems"], ["id", "alignItems", 3, "ngModelChange", "ngModel"], ["value", "stretch"], ["for", "paddingAll"], ["id", "paddingAll", "type", "number", 3, "change"], ["for", "paddingTop"], ["id", "paddingTop", "type", "text", "placeholder", "e.g., 10px", 3, "ngModelChange", "ngModel"], ["for", "paddingRight"], ["id", "paddingRight", "type", "text", "placeholder", "e.g., 10px", 3, "ngModelChange", "ngModel"], ["for", "paddingBottom"], ["id", "paddingBottom", "type", "text", "placeholder", "e.g., 10px", 3, "ngModelChange", "ngModel"], ["for", "paddingLeft"], ["id", "paddingLeft", "type", "text", "placeholder", "e.g., 10px", 3, "ngModelChange", "ngModel"], [1, "actions"], [1, "delete-button", 3, "click"], ["for", "bulkEditTarget"], ["id", "bulkEditTarget", 3, "ngModelChange", "ngModel"], ["value", "selected"], ["value", "page"], ["value", "type"], [1, "label-with-button"], ["for", "textContent"], [1, "btn-link", 3, "click"], ["id", "textContent", 3, "ngModelChange", "ngModel"], ["for", "fontSize"], ["id", "fontSize", "type", "number", 3, "ngModelChange", "ngModel"], ["for", "textColor"], ["id", "textColor", "type", "color", 3, "ngModelChange", "ngModel"], ["for", "fontWeight"], ["id", "fontWeight", 3, "ngModelChange", "ngModel"], ["value", "normal"], ["value", "bold"], ["for", "fontStyle"], ["id", "fontStyle", 3, "ngModelChange", "ngModel"], ["value", "italic"], ["for", "whiteSpace"], ["id", "whiteSpace", 3, "ngModelChange", "ngModel"], ["value", "pre-wrap"], ["value", "pre"], ["value", "nowrap"], ["for", "formFieldContent"], ["id", "formFieldContent", 3, "ngModelChange", "ngModel", "compareWith"], [3, "ngValue"], ["for", "formFieldName"], ["id", "formFieldName", 3, "ngModelChange", "ngModel"], ["value", ""], ["for", "formFieldType"], ["id", "formFieldType", 3, "ngModelChange", "ngModel"], ["for", "repeatingContent"], ["id", "repeatingContent", 3, "ngModelChange", "ngModel"], ["for", "repeatingForm"], ["id", "repeatingForm", 3, "ngModelChange", "ngModel"], ["for", "imageContent"], ["id", "imageContent", "type", "file", "accept", "image/*", 3, "change"]], template: function ContainerPropertiesComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275template(0, ContainerPropertiesComponent_Conditional_0_Template, 187, 34, "div", 0);
    }
    if (rf & 2) {
      let tmp_0_0;
      \u0275\u0275conditional((tmp_0_0 = ctx.container) ? 0 : -1, tmp_0_0);
    }
  }, dependencies: [FormsModule, NgSelectOption, \u0275NgSelectMultipleOption, DefaultValueAccessor, NumberValueAccessor, SelectControlValueAccessor, NgControlStatus, NgModel, TitleCasePipe], styles: ["\n\n.properties-panel[_ngcontent-%COMP%] {\n  padding: 15px;\n  border: 1px solid #ccc;\n  border-radius: 5px;\n  background-color: #f9f9f9;\n  margin-bottom: 10px;\n  width: 90%;\n  height: 100%;\n  overflow: scroll;\n}\nh3[_ngcontent-%COMP%] {\n  margin-top: 0;\n  border-bottom: 1px solid #eee;\n  padding-bottom: 10px;\n  margin-bottom: 15px;\n  font-size: 16px;\n  font-weight: 600;\n}\n.property-group[_ngcontent-%COMP%] {\n  margin-bottom: 15px;\n}\n.property-group[_ngcontent-%COMP%]    > label[_ngcontent-%COMP%] {\n  display: block;\n  font-weight: bold;\n  margin-bottom: 8px;\n  font-size: 14px;\n  color: #333;\n}\n.input-row[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 10px;\n}\n.input-field[_ngcontent-%COMP%] {\n  flex: 1;\n}\n.input-field[_ngcontent-%COMP%]   label[_ngcontent-%COMP%] {\n  display: block;\n  font-size: 12px;\n  color: #666;\n  margin-bottom: 4px;\n}\ninput[type=number][_ngcontent-%COMP%], \ninput[type=text][_ngcontent-%COMP%], \nselect[_ngcontent-%COMP%], \ntextarea[_ngcontent-%COMP%] {\n  width: 100%;\n  padding: 8px;\n  border: 1px solid #ccc;\n  border-radius: 4px;\n  box-sizing: border-box;\n}\ntextarea[_ngcontent-%COMP%] {\n  min-height: 60px;\n  resize: vertical;\n}\n.actions[_ngcontent-%COMP%] {\n  margin-top: 20px;\n  text-align: right;\n}\n.delete-button[_ngcontent-%COMP%] {\n  background-color: #e74c3c;\n  color: white;\n  border: none;\n  padding: 8px 12px;\n  border-radius: 4px;\n  cursor: pointer;\n  font-size: 14px;\n}\n.delete-button[_ngcontent-%COMP%]:hover {\n  background-color: #c0392b;\n}\n.border-toggle-buttons[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 5px;\n}\n.border-toggle-buttons[_ngcontent-%COMP%]   button[_ngcontent-%COMP%] {\n  flex: 1;\n  padding: 8px;\n  border: 1px solid #ccc;\n  background-color: #fff;\n  border-radius: 4px;\n  cursor: pointer;\n  font-size: 12px;\n  transition: background-color 0.2s, color 0.2s;\n}\n.border-toggle-buttons[_ngcontent-%COMP%]   button[_ngcontent-%COMP%]:hover {\n  background-color: #e0e0e0;\n}\n.border-toggle-buttons[_ngcontent-%COMP%]   button.active[_ngcontent-%COMP%] {\n  background-color: #3498db;\n  color: white;\n  border-color: #3498db;\n}\n.label-with-button[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n}\n.btn-link[_ngcontent-%COMP%] {\n  background: none;\n  border: none;\n  color: #3498db;\n  cursor: pointer;\n  font-size: 12px;\n  padding: 0;\n}\n.btn-link[_ngcontent-%COMP%]:hover {\n  text-decoration: underline;\n}\n.input-field-addon[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 4px;\n  font-size: 12px;\n}\n.property-row[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  margin-bottom: 4px;\n}\n/*# sourceMappingURL=container-properties.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ContainerPropertiesComponent, { className: "ContainerPropertiesComponent", filePath: "src/app/features/form-designer-refactored/container-properties/container-properties.component.ts", lineNumber: 24 });
})();

// src/app/features/form-designer-refactored/zoom-controls/zoom-controls.component.ts
var ZoomControlsComponent = class _ZoomControlsComponent {
  scale = input.required();
  zoomIn = output();
  zoomOut = output();
  fitToPanel = output();
  scalePercentage = computed(() => Math.round(this.scale() * 100));
  static \u0275fac = function ZoomControlsComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _ZoomControlsComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ZoomControlsComponent, selectors: [["app-zoom-controls"]], inputs: { scale: [1, "scale"] }, outputs: { zoomIn: "zoomIn", zoomOut: "zoomOut", fitToPanel: "fitToPanel" }, decls: 7, vars: 1, consts: [[1, "zoom-controls"], ["title", "Zoom Out", 3, "click"], ["title", "Fit to screen", 1, "scale-display", 3, "click"], ["title", "Zoom In", 3, "click"]], template: function ZoomControlsComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "button", 1);
      \u0275\u0275listener("click", function ZoomControlsComponent_Template_button_click_1_listener() {
        return ctx.zoomOut.emit();
      });
      \u0275\u0275text(2, "-");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(3, "button", 2);
      \u0275\u0275listener("click", function ZoomControlsComponent_Template_button_click_3_listener() {
        return ctx.fitToPanel.emit();
      });
      \u0275\u0275text(4);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(5, "button", 3);
      \u0275\u0275listener("click", function ZoomControlsComponent_Template_button_click_5_listener() {
        return ctx.zoomIn.emit();
      });
      \u0275\u0275text(6, "+");
      \u0275\u0275elementEnd()();
    }
    if (rf & 2) {
      \u0275\u0275advance(4);
      \u0275\u0275textInterpolate1("", ctx.scalePercentage(), "%");
    }
  }, dependencies: [CommonModule], styles: ["\n\n.zoom-controls[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 4px;\n  background-color: #f0f0f0;\n  padding: 4px;\n  border-radius: 4px;\n  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);\n}\n.zoom-controls[_ngcontent-%COMP%]   button[_ngcontent-%COMP%] {\n  background-color: white;\n  border: 1px solid #ccc;\n  border-radius: 4px;\n  cursor: pointer;\n  font-weight: bold;\n  width: 30px;\n  height: 30px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n.zoom-controls[_ngcontent-%COMP%]   button[_ngcontent-%COMP%]:hover {\n  background-color: #e9e9e9;\n}\n.zoom-controls[_ngcontent-%COMP%]   .scale-display[_ngcontent-%COMP%] {\n  width: auto;\n  padding: 0 10px;\n  cursor: pointer;\n  font-size: 14px;\n}\n/*# sourceMappingURL=zoom-controls.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ZoomControlsComponent, { className: "ZoomControlsComponent", filePath: "src/app/features/form-designer-refactored/zoom-controls/zoom-controls.component.ts", lineNumber: 11 });
})();

// src/app/features/form-designer-refactored/page-navigator/page-navigator.component.ts
function PageNavigatorComponent_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 4);
    \u0275\u0275listener("click", function PageNavigatorComponent_Conditional_5_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.nextPage());
    });
    \u0275\u0275text(1, " Next \xBB ");
    \u0275\u0275elementEnd();
  }
}
function PageNavigatorComponent_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 4);
    \u0275\u0275listener("click", function PageNavigatorComponent_Conditional_6_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.addPage());
    });
    \u0275\u0275text(1, " Add New ");
    \u0275\u0275elementEnd();
  }
}
var PageNavigatorComponent = class _PageNavigatorComponent {
  formState = inject(FormStateService);
  currentPage = this.formState.currentPage;
  totalPages = this.formState.totalPages;
  prevPage() {
    if (this.currentPage() > 1) {
      this.formState.goToPage(this.currentPage() - 1);
    }
  }
  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.formState.goToPage(this.currentPage() + 1);
    }
  }
  addPage() {
    this.formState.goToPage(this.totalPages() + 1);
  }
  static \u0275fac = function PageNavigatorComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _PageNavigatorComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _PageNavigatorComponent, selectors: [["app-page-navigator"]], decls: 7, vars: 4, consts: [[1, "page-navigation-container"], [1, "nav-button", 3, "click", "disabled"], [1, "page-info"], [1, "nav-button"], [1, "nav-button", 3, "click"]], template: function PageNavigatorComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "button", 1);
      \u0275\u0275listener("click", function PageNavigatorComponent_Template_button_click_1_listener() {
        return ctx.prevPage();
      });
      \u0275\u0275text(2, " \xAB Previous ");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(3, "span", 2);
      \u0275\u0275text(4);
      \u0275\u0275elementEnd();
      \u0275\u0275template(5, PageNavigatorComponent_Conditional_5_Template, 2, 0, "button", 3)(6, PageNavigatorComponent_Conditional_6_Template, 2, 0, "button", 3);
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      \u0275\u0275advance();
      \u0275\u0275property("disabled", ctx.currentPage() <= 1);
      \u0275\u0275advance(3);
      \u0275\u0275textInterpolate2(" Page ", ctx.currentPage(), " of ", ctx.totalPages(), " ");
      \u0275\u0275advance();
      \u0275\u0275conditional(ctx.currentPage() < ctx.totalPages() ? 5 : 6);
    }
  }, dependencies: [CommonModule], styles: ["\n\n.page-navigation-container[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  gap: 1rem;\n  padding: 0.5rem;\n  font-family: sans-serif;\n}\n.nav-button[_ngcontent-%COMP%] {\n  padding: 0.5rem 1rem;\n  border: 1px solid #ccc;\n  background-color: #f0f0f0;\n  border-radius: 4px;\n  cursor: pointer;\n  transition: background-color 0.2s;\n}\n.nav-button[_ngcontent-%COMP%]:hover:not(:disabled) {\n  background-color: #e0e0e0;\n}\n.nav-button[_ngcontent-%COMP%]:disabled {\n  cursor: not-allowed;\n  opacity: 0.5;\n}\n.page-info[_ngcontent-%COMP%] {\n  font-weight: bold;\n}\n/*# sourceMappingURL=page-navigator.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(PageNavigatorComponent, { className: "PageNavigatorComponent", filePath: "src/app/features/form-designer-refactored/page-navigator/page-navigator.component.ts", lineNumber: 12 });
})();

// src/app/features/form-designer-refactored/form-designer-canvas/form-designer-canvas.component.ts
var _c02 = ["centerPanel"];
var _c12 = ["formContent"];
var _forTrack03 = ($index, $item) => $item.id;
function FormDesignerCanvasComponent_Conditional_77_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div", 46);
  }
  if (rf & 2) {
    const box_r2 = ctx;
    \u0275\u0275styleProp("left", box_r2.x, "px")("top", box_r2.y, "px")("width", box_r2.width, "px")("height", box_r2.height, "px");
  }
}
function FormDesignerCanvasComponent_For_81_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 47);
    \u0275\u0275listener("mousedown", function FormDesignerCanvasComponent_For_81_Template_div_mousedown_0_listener($event) {
      const container_r4 = \u0275\u0275restoreView(_r3).$implicit;
      const ctx_r4 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r4.onDragStart($event, container_r4));
    })("click", function FormDesignerCanvasComponent_For_81_Template_div_click_0_listener($event) {
      const container_r4 = \u0275\u0275restoreView(_r3).$implicit;
      const ctx_r4 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r4.selectContainer(container_r4, $event));
    })("contextmenu", function FormDesignerCanvasComponent_For_81_Template_div_contextmenu_0_listener($event) {
      const container_r4 = \u0275\u0275restoreView(_r3).$implicit;
      const ctx_r4 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r4.viewPropertiesOfContainer(container_r4, $event));
    });
    \u0275\u0275element(1, "app-container-renderer", 48);
    \u0275\u0275elementStart(2, "div", 49);
    \u0275\u0275listener("mousedown", function FormDesignerCanvasComponent_For_81_Template_div_mousedown_2_listener($event) {
      const \u0275$index_129_r6 = \u0275\u0275restoreView(_r3).$index;
      const ctx_r4 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r4.startResize($event, \u0275$index_129_r6));
    });
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const container_r4 = ctx.$implicit;
    const ctx_r4 = \u0275\u0275nextContext();
    \u0275\u0275classProp("selected", ctx_r4.isContainerSelected(container_r4))("locked", container_r4.locked)("hovered", ctx_r4.formState.isContainerHovered(container_r4));
    \u0275\u0275property("ngStyle", ctx_r4.getContainerStyles(container_r4));
    \u0275\u0275advance();
    \u0275\u0275property("container", container_r4);
  }
}
var FormDesignerCanvasComponent = class _FormDesignerCanvasComponent {
  platformId;
  centerPanel;
  formContentElement;
  formState = inject(FormStateService);
  stateService = inject(DesignerInteractionService);
  operationsService = inject(ContainerOperationsService);
  coordinateService = inject(CoordinateService);
  entityLoaderService = inject(EntityLoaderService);
  menuPosition = MenuPosition;
  currentForm = toSignal(this.formState.form$, { initialValue: new PrintableFormDto() });
  containers = this.formState.currentPageContainers;
  isPropertiesPopupOpen = signal(false);
  sheetWidth = signal(8.5);
  sheetHeight = signal(11);
  sheetSize = computed(() => ({ width: this.sheetWidth(), height: this.sheetHeight() }));
  formSize = computed(() => this.coordinateService.getSheetSizeInPixels(this.sheetSize()));
  formScale = this.stateService.formScale;
  availableFields = computed(() => {
    const type = this.currentForm().formType ?? "SafeWork";
    return this.entityLoaderService.loadEntityDto(type);
  });
  destroy$ = new Subject();
  constructor(platformId) {
    this.platformId = platformId;
  }
  ngOnInit() {
    const formType = this.currentForm().formType ?? "SafeWork";
    const { entity, fields } = this.entityLoaderService.loadEntityWithFields(formType);
    this.formState.currentEntity = entity;
    this.formState.currentEntityFields = fields;
    const size = this.currentForm().size ?? { width: 8.5, height: 11 };
    this.sheetWidth.set(size.width);
    this.sheetHeight.set(size.height);
  }
  ngAfterViewInit() {
    this.fitToPanel();
  }
  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      this.cleanup();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
  // ==================== Form Operations ====================
  onWindowResize() {
    this.fitToPanel();
  }
  onMouseWheel(event) {
    if (event.ctrlKey) {
      event.preventDefault();
      const direction = event.deltaY > 0 ? -1 : 1;
      const scaleAmount = 1 + direction * 0.02;
      this.stateService.setScale(this.formScale() * scaleAmount);
    }
  }
  zoomIn() {
    this.stateService.zoomIn();
  }
  zoomOut() {
    this.stateService.zoomOut();
  }
  fitToPanel() {
    if (!this.centerPanel)
      return;
    const el = this.centerPanel.nativeElement;
    const scale = this.coordinateService.calculateFitToPanel(el.offsetWidth, el.offsetHeight, this.formSize().width, this.formSize().height);
    this.stateService.setScale(scale);
  }
  updateSheetSize(width, height) {
    const newForm = new PrintableFormDto(__spreadProps(__spreadValues({}, this.currentForm()), { size: { width, height } }));
    this.formState.updateForm(newForm);
    this.fitToPanel();
  }
  getFormContainerStyle() {
    return this.coordinateService.getFormContainerStyle(this.formSize(), this.formScale());
  }
  // ==================== Container Operations ====================
  addContainer() {
    this.formState.createNewContainer(new FormContainerDto());
  }
  selectContainer(container, event) {
    this.formState.selectContainer(container, event);
  }
  updateContainer(container) {
    this.formState.updateContainer(container);
  }
  deleteContainer(id = 0) {
    const contId = !id || id === 0 ? this.formState.selectedContainers()[0]?.id : id;
    if (contId)
      this.formState.deleteContainer(contId);
  }
  isContainerSelected(container) {
    return this.formState.isContainerSelected(container);
  }
  getContainerStyles(container) {
    return this.coordinateService.getContainerPositionStyle(container);
  }
  // ==================== Properties Popup ====================
  viewPropertiesOfContainer(container, event) {
    this.formState.propertiesOfContainer.set(container);
    if (container)
      this.formState.selectContainer(container, event);
    event.preventDefault();
    this.isPropertiesPopupOpen.set(true);
  }
  closePropertiesPopup() {
    this.isPropertiesPopupOpen.set(false);
    this.formState.propertiesOfContainer.set(null);
  }
  // ==================== Keyboard ====================
  handleKeyboardEvent(event) {
    const selected = this.formState.selectedContainers();
    if (selected.length === 0)
      return;
    const moveAmount = event.shiftKey ? 10 : 1;
    let direction = null;
    switch (event.key) {
      case "ArrowUp":
        direction = "up";
        break;
      case "ArrowDown":
        direction = "down";
        break;
      case "ArrowLeft":
        direction = "left";
        break;
      case "ArrowRight":
        direction = "right";
        break;
      default:
        return;
    }
    event.preventDefault();
    const updated = this.coordinateService.moveContainersByKeyboard(selected, direction, moveAmount);
    this.formState.updateContainers(updated);
  }
  // ==================== Drag ====================
  onDragStart(event, container) {
    if (container.locked)
      return;
    event.preventDefault();
    event.stopPropagation();
    const selected = this.formState.selectedContainers();
    this.stateService.startDrag(event, selected);
    document.addEventListener("mousemove", this.onDragMove);
    document.addEventListener("mouseup", this.onDragEnd);
  }
  onDragMove = (event) => {
    if (!this.stateService.isDraggingActive())
      return;
    event.preventDefault();
    const delta = this.stateService.getDragDelta(event);
    const sheet = this.formContentElement.nativeElement;
    const updated = this.formState.selectedContainers().map((c) => {
      const initialPos = this.stateService.getInitialPosition(c.id + "");
      if (!initialPos)
        return c;
      const newPos = this.coordinateService.calculateDraggedPosition(initialPos, delta, c.size, sheet.clientWidth, sheet.clientHeight);
      return new FormContainerDto(__spreadProps(__spreadValues({}, c), { position: newPos }));
    });
    this.formState.updateContainersState(updated);
  };
  onDragEnd = (event) => {
    if (!this.stateService.isDraggingActive())
      return;
    const delta = this.stateService.getDragDelta(event);
    const sheet = this.formContentElement.nativeElement;
    const final = this.formState.selectedContainers().map((c) => {
      const initialPos = this.stateService.getInitialPosition(c.id + "");
      if (!initialPos)
        return c;
      const newPos = this.coordinateService.calculateDraggedPosition(initialPos, delta, c.size, sheet.clientWidth, sheet.clientHeight);
      return new FormContainerDto(__spreadProps(__spreadValues({}, c), { position: newPos }));
    });
    if (final.length > 0)
      this.formState.updateContainers(final);
    this.stateService.endDrag();
    document.removeEventListener("mousemove", this.onDragMove);
    document.removeEventListener("mouseup", this.onDragEnd);
  };
  // ==================== Resize ====================
  startResize(event, index) {
    if (!isPlatformBrowser(this.platformId))
      return;
    event.preventDefault();
    event.stopPropagation();
    const selected = this.formState.selectedContainers();
    const containersToResize = selected.length > 1 ? selected : [this.containers()[index]];
    this.stateService.startResize(event, containersToResize, this.containers()[index].id + "");
    document.addEventListener("mousemove", this.onResize);
    document.addEventListener("mouseup", this.stopResize);
  }
  onResize = (event) => {
    if (!isPlatformBrowser(this.platformId) || !this.stateService.isResizing())
      return;
    const delta = this.stateService.getResizeDelta(event);
    const selected = this.formState.selectedContainers();
    const updated = selected.map((c) => {
      const initial = this.stateService.getInitialSize(c.id + "");
      if (!initial)
        return c;
      const newSize = this.coordinateService.calculateResizedSize(initial, delta);
      return new FormContainerDto(__spreadProps(__spreadValues({}, c), { size: newSize }));
    });
    this.formState.updateContainersState(updated);
  };
  stopResize = (event) => {
    if (!isPlatformBrowser(this.platformId) || !this.stateService.isResizing())
      return;
    if (event) {
      const delta = this.stateService.getResizeDelta(event);
      const selected = this.formState.selectedContainers();
      const final = selected.map((c) => {
        const initial = this.stateService.getInitialSize(c.id + "");
        if (!initial)
          return c;
        const newSize = this.coordinateService.calculateResizedSize(initial, delta);
        return new FormContainerDto(__spreadProps(__spreadValues({}, c), { size: newSize }));
      });
      if (final.length > 0)
        this.formState.updateContainers(final);
    }
    this.stateService.endResize();
    document.removeEventListener("mousemove", this.onResize);
    document.removeEventListener("mouseup", this.stopResize);
  };
  // ==================== Marquee Selection ====================
  onFormSheetMouseDown(event) {
    const target = event.target;
    if (event.target !== this.formContentElement.nativeElement && !target.classList.contains("locked")) {
      return;
    }
    if (this.stateService.isDraggingActive())
      return;
    event.preventDefault();
    const startPoint = this.coordinateService.getScaledCoordinates(event, this.formContentElement.nativeElement, this.formScale());
    this.stateService.startSelection(startPoint);
    if (!event.ctrlKey) {
      this.formState.selectedContainers.set([]);
    }
    document.addEventListener("mousemove", this.onDocumentMouseMove);
    document.addEventListener("mouseup", this.onDocumentMouseUp);
  }
  onDocumentMouseMove = (event) => {
    if (!this.stateService.isSelecting())
      return;
    const currentPoint = this.coordinateService.getScaledCoordinates(event, this.formContentElement.nativeElement, this.formScale());
    this.stateService.updateSelection(currentPoint);
    this.updateSelectionFromBox();
  };
  onDocumentMouseUp = () => {
    this.stateService.endSelection();
    document.removeEventListener("mousemove", this.onDocumentMouseMove);
    document.removeEventListener("mouseup", this.onDocumentMouseUp);
  };
  updateSelectionFromBox() {
    const selected = this.stateService.getContainersInSelectionBox(this.containers());
    this.formState.selectedContainers.set(selected);
  }
  // ==================== Grouping ====================
  groupSelection() {
    const selected = this.formState.selectedContainers();
    const grouped = this.operationsService.groupContainers(selected);
    this.formState.updateContainers(grouped);
  }
  ungroupSelection() {
    const selected = this.formState.selectedContainers();
    const ungrouped = this.operationsService.ungroupContainers(selected, this.containers());
    this.formState.updateContainers(ungrouped);
    this.formState.selectedContainers.set(ungrouped);
  }
  isGroupSelected() {
    return this.operationsService.isGrouped(this.formState.selectedContainers());
  }
  // ==================== Alignment ====================
  alignContainers(alignment) {
    const selected = this.formState.selectedContainers();
    const aligned = this.operationsService.alignContainers(selected, alignment);
    this.formState.updateContainers(aligned);
  }
  matchSize(dimension) {
    const selected = this.formState.selectedContainers();
    const matched = this.operationsService.matchSize(selected, dimension);
    this.formState.updateContainers(matched);
  }
  distributeContainers(direction) {
    const selected = this.formState.selectedContainers();
    const distributed = this.operationsService.distributeContainers(selected, direction);
    this.formState.updateContainers(distributed);
  }
  arrangeSequentially(direction, gap = -2) {
    const selected = this.formState.selectedContainers();
    const arranged = this.operationsService.arrangeSequentially(selected, direction, gap);
    this.formState.updateContainers(arranged);
  }
  swapContainers() {
    const selected = this.formState.selectedContainers();
    const swapped = this.operationsService.swapContainers(selected);
    this.formState.updateContainers(swapped);
  }
  // ==================== Cleanup ====================
  cleanup() {
    this.stopResize();
    document.removeEventListener("mousemove", this.onDocumentMouseMove);
    document.removeEventListener("mouseup", this.onDocumentMouseUp);
    document.removeEventListener("mousemove", this.onDragMove);
    document.removeEventListener("mouseup", this.onDragEnd);
  }
  static \u0275fac = function FormDesignerCanvasComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _FormDesignerCanvasComponent)(\u0275\u0275directiveInject(PLATFORM_ID));
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _FormDesignerCanvasComponent, selectors: [["app-form-designer-canvas"]], viewQuery: function FormDesignerCanvasComponent_Query(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275viewQuery(_c02, 5);
      \u0275\u0275viewQuery(_c12, 5);
    }
    if (rf & 2) {
      let _t;
      \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.centerPanel = _t.first);
      \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.formContentElement = _t.first);
    }
  }, hostBindings: function FormDesignerCanvasComponent_HostBindings(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275listener("resize", function FormDesignerCanvasComponent_resize_HostBindingHandler() {
        return ctx.onWindowResize();
      }, false, \u0275\u0275resolveWindow)("wheel", function FormDesignerCanvasComponent_wheel_HostBindingHandler($event) {
        return ctx.onMouseWheel($event);
      })("keydown", function FormDesignerCanvasComponent_keydown_HostBindingHandler($event) {
        return ctx.handleKeyboardEvent($event);
      }, false, \u0275\u0275resolveWindow);
    }
  }, decls: 86, vars: 10, consts: [["centerPanel", ""], ["designArea", ""], ["formContent", ""], [1, "printable-form-designer"], [1, "top-menu"], [1, "control-group", "sheet-size-controls"], ["type", "number", "title", "Sheet Width", 3, "ngModelChange", "change", "ngModel"], ["type", "number", "title", "Sheet Height", 3, "ngModelChange", "change", "ngModel"], [3, "click"], [1, "zoom-controls-container", 3, "zoomIn", "zoomOut", "fitToPanel", "scale"], [1, "main-content"], [1, "left-panel"], [1, "tools-menu"], [1, "control-group"], ["title", "Add Container", 3, "click"], ["title", "Duplicate", 3, "click"], ["title", "Delete Selected", 3, "click"], ["title", "Group Selected", 3, "click"], ["title", "Ungroup Selection", 3, "click"], [1, "control-group", "alignment-controls"], [1, "group-title"], [1, "button-row"], ["title", "Align Left", 3, "click"], ["title", "Align Horizontal Center", 3, "click"], ["title", "Align Right", 3, "click"], ["title", "Swap Places", 3, "click"], ["title", "Align Top", 3, "click"], ["title", "Align Vertical Center", 3, "click"], ["title", "Align Bottom", 3, "click"], ["title", "Match Width", 3, "click"], ["title", "Match Height", 3, "click"], ["title", "Match Width & Height", 3, "click"], ["title", "Distribute Horizontally", 3, "click"], ["title", "Distribute Vertically", 3, "click"], ["title", "Arrange Horizontally", 3, "click"], ["title", "Arrange Vertically", 3, "click"], [1, "center-panel"], [1, "form-container", 3, "ngStyle"], [1, "grid-background"], [1, "selection-box", 3, "left", "top", "width", "height"], [1, "form-content", 3, "mousedown"], [1, "draggable-container", 3, "ngStyle", "selected", "locked", "hovered"], [1, "right-panel"], [3, "rightClickEvent"], [3, "close", "title", "position", "open"], [3, "deleteContainerEvent", "container", "availableFields"], [1, "selection-box"], [1, "draggable-container", 3, "mousedown", "click", "contextmenu", "ngStyle"], [3, "container"], [1, "resize-handle", "bottom-right", 3, "mousedown"]], template: function FormDesignerCanvasComponent_Template(rf, ctx) {
    if (rf & 1) {
      const _r1 = \u0275\u0275getCurrentView();
      \u0275\u0275elementStart(0, "div", 3)(1, "div", 4)(2, "div", 5)(3, "label");
      \u0275\u0275text(4, "Sheet Size:");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(5, "input", 6);
      \u0275\u0275twoWayListener("ngModelChange", function FormDesignerCanvasComponent_Template_input_ngModelChange_5_listener($event) {
        \u0275\u0275restoreView(_r1);
        \u0275\u0275twoWayBindingSet(ctx.sheetWidth, $event) || (ctx.sheetWidth = $event);
        return \u0275\u0275resetView($event);
      });
      \u0275\u0275listener("change", function FormDesignerCanvasComponent_Template_input_change_5_listener() {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.updateSheetSize(ctx.sheetWidth(), ctx.sheetHeight()));
      });
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(6, "span");
      \u0275\u0275text(7, "x");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(8, "input", 7);
      \u0275\u0275twoWayListener("ngModelChange", function FormDesignerCanvasComponent_Template_input_ngModelChange_8_listener($event) {
        \u0275\u0275restoreView(_r1);
        \u0275\u0275twoWayBindingSet(ctx.sheetHeight, $event) || (ctx.sheetHeight = $event);
        return \u0275\u0275resetView($event);
      });
      \u0275\u0275listener("change", function FormDesignerCanvasComponent_Template_input_change_8_listener() {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.updateSheetSize(ctx.sheetWidth(), ctx.sheetHeight()));
      });
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(9, "button", 8);
      \u0275\u0275listener("click", function FormDesignerCanvasComponent_Template_button_click_9_listener() {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.formState.copyPage());
      });
      \u0275\u0275text(10, "Copy Page");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(11, "button", 8);
      \u0275\u0275listener("click", function FormDesignerCanvasComponent_Template_button_click_11_listener() {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.formState.deletePage());
      });
      \u0275\u0275text(12, "Delete Page");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(13, "app-zoom-controls", 9);
      \u0275\u0275listener("zoomIn", function FormDesignerCanvasComponent_Template_app_zoom_controls_zoomIn_13_listener() {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.zoomIn());
      })("zoomOut", function FormDesignerCanvasComponent_Template_app_zoom_controls_zoomOut_13_listener() {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.zoomOut());
      })("fitToPanel", function FormDesignerCanvasComponent_Template_app_zoom_controls_fitToPanel_13_listener() {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.fitToPanel());
      });
      \u0275\u0275elementEnd();
      \u0275\u0275element(14, "app-page-navigator");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(15, "div", 10)(16, "div", 11)(17, "div", 12)(18, "div", 13)(19, "button", 14);
      \u0275\u0275listener("click", function FormDesignerCanvasComponent_Template_button_click_19_listener() {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.addContainer());
      });
      \u0275\u0275text(20, "Add");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(21, "button", 15);
      \u0275\u0275listener("click", function FormDesignerCanvasComponent_Template_button_click_21_listener() {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.formState.copySelectedContainers());
      });
      \u0275\u0275text(22, "Duplicate");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(23, "button", 16);
      \u0275\u0275listener("click", function FormDesignerCanvasComponent_Template_button_click_23_listener() {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.deleteContainer());
      });
      \u0275\u0275text(24, "Delete");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(25, "div", 13)(26, "button", 17);
      \u0275\u0275listener("click", function FormDesignerCanvasComponent_Template_button_click_26_listener() {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.groupSelection());
      });
      \u0275\u0275text(27, "Group");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(28, "button", 18);
      \u0275\u0275listener("click", function FormDesignerCanvasComponent_Template_button_click_28_listener() {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.ungroupSelection());
      });
      \u0275\u0275text(29, "Ungroup");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(30, "div", 19)(31, "h4", 20);
      \u0275\u0275text(32, "Align");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(33, "div", 21)(34, "button", 22);
      \u0275\u0275listener("click", function FormDesignerCanvasComponent_Template_button_click_34_listener() {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.alignContainers("left"));
      });
      \u0275\u0275text(35, "Left");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(36, "button", 23);
      \u0275\u0275listener("click", function FormDesignerCanvasComponent_Template_button_click_36_listener() {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.alignContainers("h-center"));
      });
      \u0275\u0275text(37, "Center");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(38, "button", 24);
      \u0275\u0275listener("click", function FormDesignerCanvasComponent_Template_button_click_38_listener() {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.alignContainers("right"));
      });
      \u0275\u0275text(39, "Right");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(40, "button", 25);
      \u0275\u0275listener("click", function FormDesignerCanvasComponent_Template_button_click_40_listener() {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.swapContainers());
      });
      \u0275\u0275text(41, "Swap");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(42, "div", 21)(43, "button", 26);
      \u0275\u0275listener("click", function FormDesignerCanvasComponent_Template_button_click_43_listener() {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.alignContainers("top"));
      });
      \u0275\u0275text(44, "Top");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(45, "button", 27);
      \u0275\u0275listener("click", function FormDesignerCanvasComponent_Template_button_click_45_listener() {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.alignContainers("v-center"));
      });
      \u0275\u0275text(46, "Middle");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(47, "button", 28);
      \u0275\u0275listener("click", function FormDesignerCanvasComponent_Template_button_click_47_listener() {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.alignContainers("bottom"));
      });
      \u0275\u0275text(48, "Bottom");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(49, "h4", 20);
      \u0275\u0275text(50, "Match Size");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(51, "div", 21)(52, "button", 29);
      \u0275\u0275listener("click", function FormDesignerCanvasComponent_Template_button_click_52_listener() {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.matchSize("width"));
      });
      \u0275\u0275text(53, "Width");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(54, "button", 30);
      \u0275\u0275listener("click", function FormDesignerCanvasComponent_Template_button_click_54_listener() {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.matchSize("height"));
      });
      \u0275\u0275text(55, "Height");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(56, "button", 31);
      \u0275\u0275listener("click", function FormDesignerCanvasComponent_Template_button_click_56_listener() {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.matchSize("both"));
      });
      \u0275\u0275text(57, "Both");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(58, "h4", 20);
      \u0275\u0275text(59, "Distribute");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(60, "div", 21)(61, "button", 32);
      \u0275\u0275listener("click", function FormDesignerCanvasComponent_Template_button_click_61_listener() {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.distributeContainers("horizontal"));
      });
      \u0275\u0275text(62, "Horizontal");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(63, "button", 33);
      \u0275\u0275listener("click", function FormDesignerCanvasComponent_Template_button_click_63_listener() {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.distributeContainers("vertical"));
      });
      \u0275\u0275text(64, "Vertical");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(65, "h4", 20);
      \u0275\u0275text(66, "Arrange");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(67, "div", 21)(68, "button", 34);
      \u0275\u0275listener("click", function FormDesignerCanvasComponent_Template_button_click_68_listener() {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.arrangeSequentially("horizontal"));
      });
      \u0275\u0275text(69, "Horizontal");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(70, "button", 35);
      \u0275\u0275listener("click", function FormDesignerCanvasComponent_Template_button_click_70_listener() {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.arrangeSequentially("vertical"));
      });
      \u0275\u0275text(71, "Vertical");
      \u0275\u0275elementEnd()()()()();
      \u0275\u0275elementStart(72, "div", 36, 0)(74, "div", 37, 1);
      \u0275\u0275element(76, "div", 38);
      \u0275\u0275template(77, FormDesignerCanvasComponent_Conditional_77_Template, 1, 8, "div", 39);
      \u0275\u0275elementStart(78, "div", 40, 2);
      \u0275\u0275listener("mousedown", function FormDesignerCanvasComponent_Template_div_mousedown_78_listener($event) {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.onFormSheetMouseDown($event));
      });
      \u0275\u0275repeaterCreate(80, FormDesignerCanvasComponent_For_81_Template, 3, 8, "div", 41, _forTrack03);
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(82, "div", 42)(83, "app-container-list", 43);
      \u0275\u0275listener("rightClickEvent", function FormDesignerCanvasComponent_Template_app_container_list_rightClickEvent_83_listener($event) {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.viewPropertiesOfContainer($event.container, $event.event));
      });
      \u0275\u0275elementEnd()()()();
      \u0275\u0275elementStart(84, "app-floating-menu", 44);
      \u0275\u0275listener("close", function FormDesignerCanvasComponent_Template_app_floating_menu_close_84_listener() {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.closePropertiesPopup());
      });
      \u0275\u0275elementStart(85, "app-container-properties", 45);
      \u0275\u0275listener("deleteContainerEvent", function FormDesignerCanvasComponent_Template_app_container_properties_deleteContainerEvent_85_listener($event) {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.deleteContainer($event));
      });
      \u0275\u0275elementEnd()();
    }
    if (rf & 2) {
      let tmp_7_0;
      \u0275\u0275advance(5);
      \u0275\u0275twoWayProperty("ngModel", ctx.sheetWidth);
      \u0275\u0275advance(3);
      \u0275\u0275twoWayProperty("ngModel", ctx.sheetHeight);
      \u0275\u0275advance(5);
      \u0275\u0275property("scale", ctx.formScale());
      \u0275\u0275advance(61);
      \u0275\u0275property("ngStyle", ctx.getFormContainerStyle());
      \u0275\u0275advance(3);
      \u0275\u0275conditional((tmp_7_0 = ctx.stateService.selectionBox()) ? 77 : -1, tmp_7_0);
      \u0275\u0275advance(3);
      \u0275\u0275repeater(ctx.containers());
      \u0275\u0275advance(4);
      \u0275\u0275property("title", "Container Properties")("position", ctx.menuPosition.BottomLeft)("open", ctx.isPropertiesPopupOpen());
      \u0275\u0275advance();
      \u0275\u0275property("container", ctx.formState.propertiesOfContainer())("availableFields", ctx.availableFields());
    }
  }, dependencies: [
    CommonModule,
    NgStyle,
    FormsModule,
    DefaultValueAccessor,
    NumberValueAccessor,
    NgControlStatus,
    NgModel,
    ContainerRendererComponent,
    ContainerListComponent,
    ContainerPropertiesComponent,
    FloatingMenuComponent,
    ZoomControlsComponent,
    PageNavigatorComponent
  ], styles: ["\n\n.printable-form-designer[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  height: 100%;\n  width: 100%;\n  font-family: Arial, sans-serif;\n  color: #333;\n  background-color: #f0f0f0;\n  overflow: hidden;\n}\n.top-menu[_ngcontent-%COMP%] {\n  width: 100%;\n  padding: 10px;\n  background-color: #ffffff;\n  border-bottom: 1px solid #e0e0e0;\n  display: flex;\n  justify-content: flex-start;\n  align-items: center;\n  flex-wrap: wrap;\n  gap: 10px;\n}\n.top-menu[_ngcontent-%COMP%]   button[_ngcontent-%COMP%] {\n  padding: 8px 12px;\n  background-color: #ecf0f1;\n  border: 1px solid #bdc3c7;\n  border-radius: 4px;\n  cursor: pointer;\n  transition: all 0.3s ease;\n}\n.top-menu[_ngcontent-%COMP%]   button[_ngcontent-%COMP%]:hover {\n  background-color: #d2d7d9;\n  border-color: #a1a7ab;\n}\n.control-group[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 5px;\n  padding: 5px;\n  border: 1px solid #ccc;\n  border-radius: 5px;\n}\n.alignment-controls[_ngcontent-%COMP%] {\n  flex-direction: column;\n  align-items: stretch;\n  gap: 5px;\n}\n.alignment-controls[_ngcontent-%COMP%]   .button-row[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  gap: 5px;\n}\n.alignment-controls[_ngcontent-%COMP%]   .button-row[_ngcontent-%COMP%]   button[_ngcontent-%COMP%] {\n  flex: 1;\n}\n.group-title[_ngcontent-%COMP%] {\n  margin: 10px 0 5px 0;\n  font-size: 14px;\n  font-weight: 600;\n  color: #2d3748;\n  border-bottom: 1px solid #e2e8f0;\n  padding-bottom: 4px;\n}\n.sheet-size-controls[_ngcontent-%COMP%] {\n  gap: 8px;\n}\n.sheet-size-controls[_ngcontent-%COMP%]   label[_ngcontent-%COMP%] {\n  font-weight: bold;\n  margin-right: 4px;\n}\n.sheet-size-controls[_ngcontent-%COMP%]   input[_ngcontent-%COMP%] {\n  width: 60px;\n  padding: 8px;\n  border: 1px solid #bdc3c7;\n  border-radius: 4px;\n}\n.sheet-size-controls[_ngcontent-%COMP%]   span[_ngcontent-%COMP%] {\n  color: #7f8c8d;\n}\n.main-content[_ngcontent-%COMP%] {\n  display: flex;\n  flex: 1;\n  overflow: hidden;\n}\n.left-panel[_ngcontent-%COMP%], \n.right-panel[_ngcontent-%COMP%] {\n  flex: 1;\n  background-color: #ffffff;\n  display: flex;\n  flex-direction: column;\n  overflow-y: auto;\n  padding: 20px;\n}\n.left-panel[_ngcontent-%COMP%] {\n  border-right: 1px solid #e0e0e0;\n}\n.right-panel[_ngcontent-%COMP%] {\n  border-left: 1px solid #e0e0e0;\n}\n.center-panel[_ngcontent-%COMP%] {\n  flex-grow: 1;\n  display: flex;\n  justify-content: center;\n  align-items: flex-start;\n  padding: 20px;\n  overflow: auto;\n  background-color: #e0e0e0;\n}\n.form-container[_ngcontent-%COMP%] {\n  background-color: #ffffff;\n  box-shadow: 0 0 20px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.1);\n  position: relative;\n  overflow: hidden;\n  transform-origin: top left;\n  border-radius: 2px;\n  transition: all 0.3s ease;\n}\n.grid-background[_ngcontent-%COMP%] {\n  position: absolute;\n  top: 0;\n  left: 0;\n  width: 100%;\n  height: 100%;\n  --grid-minor-color: #e9e9e9;\n  --grid-major-color: #dcdcdc;\n  --grid-minor-size: 10px;\n  --grid-major-size: 50px;\n  background-image:\n    linear-gradient(\n      to right,\n      var(--grid-minor-color) 1px,\n      transparent 1px),\n    linear-gradient(\n      to bottom,\n      var(--grid-minor-color) 1px,\n      transparent 1px),\n    linear-gradient(\n      to right,\n      var(--grid-major-color) 1px,\n      transparent 1px),\n    linear-gradient(\n      to bottom,\n      var(--grid-major-color) 1px,\n      transparent 1px);\n  background-size:\n    var(--grid-minor-size) var(--grid-minor-size),\n    var(--grid-minor-size) var(--grid-minor-size),\n    var(--grid-major-size) var(--grid-major-size),\n    var(--grid-major-size) var(--grid-major-size);\n  z-index: -1;\n}\n.form-content[_ngcontent-%COMP%] {\n  position: absolute;\n  top: 0;\n  left: 0;\n  width: 100%;\n  height: 100%;\n  padding: 20px;\n  box-sizing: border-box;\n}\n.selection-box[_ngcontent-%COMP%] {\n  position: absolute;\n  border: 1px dashed #007bff;\n  background-color: rgba(0, 123, 255, 0.2);\n  pointer-events: none;\n  z-index: 9999;\n}\n.draggable-container[_ngcontent-%COMP%] {\n  position: absolute;\n  display: flex;\n  cursor: move;\n  border: 1px solid #ccc;\n  background-color: rgba(0, 123, 255, 0.1);\n}\n.draggable-container.locked[_ngcontent-%COMP%] {\n  cursor: not-allowed;\n  border-style: dashed;\n}\n.draggable-container.selected[_ngcontent-%COMP%] {\n  border: 2px solid #007bff;\n  box-shadow: 0 0 10px rgba(0, 123, 255, 0.5);\n  z-index: 10;\n}\n.draggable-container.hovered[_ngcontent-%COMP%] {\n  border: 2px solid #db3f34;\n  box-shadow: 0 0 10px rgba(219, 52, 52, 0.5);\n}\n.resize-handle[_ngcontent-%COMP%] {\n  position: absolute;\n  width: 10px;\n  height: 10px;\n  background-color: #007bff;\n  border: 1px solid white;\n  border-radius: 50%;\n}\n.resize-handle.bottom-right[_ngcontent-%COMP%] {\n  bottom: -5px;\n  right: -5px;\n  cursor: nwse-resize;\n}\n@media (max-width: 1200px) {\n  .main-content[_ngcontent-%COMP%] {\n    flex-direction: column;\n  }\n  .left-panel[_ngcontent-%COMP%], \n   .right-panel[_ngcontent-%COMP%] {\n    width: 100%;\n    max-height: 30vh;\n    border: none;\n    border-bottom: 1px solid #e0e0e0;\n  }\n  .center-panel[_ngcontent-%COMP%] {\n    flex: 1;\n  }\n}\n/*# sourceMappingURL=form-designer-canvas.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(FormDesignerCanvasComponent, { className: "FormDesignerCanvasComponent", filePath: "src/app/features/form-designer-refactored/form-designer-canvas/form-designer-canvas.component.ts", lineNumber: 50 });
})();
export {
  FormDesignerCanvasComponent
};
//# sourceMappingURL=chunk-XVSS5ZJS.js.map
