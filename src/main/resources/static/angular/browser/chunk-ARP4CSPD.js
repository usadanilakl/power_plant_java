import {
  PIDSymbolsService,
  RfLotoPointApiService,
  SymbolPaletteComponent,
  ZoomPanService
} from "./chunk-QNGYFE3M.js";
import "./chunk-PRWR46IA.js";
import {
  DefaultValueAccessor,
  FormsModule,
  MaxValidator,
  MinValidator,
  NgControlStatus,
  NgModel,
  NgSelectOption,
  NumberValueAccessor,
  RangeValueAccessor,
  SelectControlValueAccessor,
  ɵNgSelectMultipleOption
} from "./chunk-HH6S5SLA.js";
import {
  DiagramApiService
} from "./chunk-JFF5GCHA.js";
import {
  ActivatedRoute,
  Router
} from "./chunk-OKWMHAJY.js";
import {
  BehaviorSubject,
  CommonModule,
  DecimalPipe,
  Subject,
  computed,
  debounceTime,
  effect,
  inject,
  of,
  output,
  signal,
  switchMap,
  ɵsetClassDebugInfo,
  ɵɵProvidersFeature,
  ɵɵadvance,
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
  ɵɵloadQuery,
  ɵɵnextContext,
  ɵɵpipe,
  ɵɵpipeBind2,
  ɵɵproperty,
  ɵɵqueryRefresh,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIdentity,
  ɵɵresetView,
  ɵɵresolveDocument,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtextInterpolate2,
  ɵɵviewQuery
} from "./chunk-LMIOZ4NA.js";
import {
  __spreadProps,
  __spreadValues
} from "./chunk-TXDUYLVM.js";

// src/app/features/diagram-builder/services/diagram-shape-manager.service.ts
var groupCounter = 0;
var DiagramShapeManagerService = class _DiagramShapeManagerService {
  _shapes = signal([]);
  _connections = signal([]);
  _selectedShapeIds = signal(/* @__PURE__ */ new Set());
  _nextShapeId = 1;
  _nextConnectionId = 1;
  shapes = this._shapes.asReadonly();
  connections = this._connections.asReadonly();
  selectedShapeIds = this._selectedShapeIds.asReadonly();
  selectedShapes = computed(() => {
    const ids = this._selectedShapeIds();
    return this._shapes().filter((s) => ids.has(s.id));
  });
  singleSelectedShape = computed(() => {
    const selected = this.selectedShapes();
    return selected.length === 1 ? selected[0] : null;
  });
  hasSelection = computed(() => this._selectedShapeIds().size > 0);
  selectionCount = computed(() => this._selectedShapeIds().size);
  // --- Shape CRUD ---
  setShapes(shapes) {
    this._shapes.set([...shapes]);
    this._nextShapeId = shapes.length > 0 ? Math.max(...shapes.map((s) => s.id)) + 1 : 1;
  }
  setConnections(connections) {
    this._connections.set([...connections]);
    this._nextConnectionId = connections.length > 0 ? Math.max(...connections.map((c) => c.id)) + 1 : 1;
  }
  addShape(shape) {
    const newShape = __spreadProps(__spreadValues({}, shape), { id: this._nextShapeId++ });
    this._shapes.update((shapes) => [...shapes, newShape]);
    return newShape;
  }
  updateShape(id, updates) {
    this._shapes.update((shapes) => shapes.map((s) => s.id === id ? __spreadValues(__spreadValues({}, s), updates) : s));
  }
  deleteShape(id) {
    this._shapes.update((shapes) => shapes.filter((s) => s.id !== id));
    this._connections.update((conns) => conns.filter((c) => c.sourceShapeId !== id && c.targetShapeId !== id));
    this._selectedShapeIds.update((ids) => {
      const next = new Set(ids);
      next.delete(id);
      return next;
    });
  }
  deleteSelectedShapes() {
    const ids = this._selectedShapeIds();
    if (ids.size === 0)
      return;
    this._shapes.update((shapes) => shapes.filter((s) => !ids.has(s.id)));
    this._connections.update((conns) => conns.filter((c) => !ids.has(c.sourceShapeId) && !ids.has(c.targetShapeId)));
    this._selectedShapeIds.set(/* @__PURE__ */ new Set());
  }
  getShapeById(id) {
    return this._shapes().find((s) => s.id === id);
  }
  // --- Connection CRUD ---
  addConnection(connection) {
    const newConn = __spreadProps(__spreadValues({}, connection), { id: this._nextConnectionId++ });
    this._connections.update((conns) => [...conns, newConn]);
    return newConn;
  }
  updateConnection(id, updates) {
    this._connections.update((conns) => conns.map((c) => c.id === id ? __spreadValues(__spreadValues({}, c), updates) : c));
  }
  deleteConnection(id) {
    this._connections.update((conns) => conns.filter((c) => c.id !== id));
  }
  // --- Selection ---
  selectShape(id, exclusive = true) {
    const shape = this.getShapeById(id);
    if (!shape)
      return;
    const groupIds = shape.groupId ? this._shapes().filter((s) => s.groupId === shape.groupId).map((s) => s.id) : [id];
    if (exclusive) {
      this._selectedShapeIds.set(new Set(groupIds));
    } else {
      this._selectedShapeIds.update((ids) => {
        const next = new Set(ids);
        for (const gid of groupIds)
          next.add(gid);
        return next;
      });
    }
  }
  deselectShape(id) {
    const shape = this.getShapeById(id);
    const groupIds = shape?.groupId ? this._shapes().filter((s) => s.groupId === shape.groupId).map((s) => s.id) : [id];
    this._selectedShapeIds.update((ids) => {
      const next = new Set(ids);
      for (const gid of groupIds)
        next.delete(gid);
      return next;
    });
  }
  toggleShapeSelection(id) {
    if (this.isSelected(id)) {
      this.deselectShape(id);
    } else {
      this.selectShape(id, false);
    }
  }
  selectMultiple(ids) {
    this._selectedShapeIds.set(new Set(ids));
  }
  selectShapesInRect(x1, y1, x2, y2) {
    const left = Math.min(x1, x2);
    const top = Math.min(y1, y2);
    const right = Math.max(x1, x2);
    const bottom = Math.max(y1, y2);
    const hitIds = /* @__PURE__ */ new Set();
    for (const s of this._shapes()) {
      if (s.x + s.width >= left && s.x <= right && s.y + s.height >= top && s.y <= bottom) {
        hitIds.add(s.id);
        if (s.groupId) {
          for (const gs of this._shapes()) {
            if (gs.groupId === s.groupId)
              hitIds.add(gs.id);
          }
        }
      }
    }
    this._selectedShapeIds.set(hitIds);
  }
  clearSelection() {
    this._selectedShapeIds.set(/* @__PURE__ */ new Set());
  }
  isSelected(id) {
    return this._selectedShapeIds().has(id);
  }
  // --- Grouping ---
  groupSelected() {
    const selected = this.selectedShapes();
    if (selected.length < 2)
      return null;
    const groupId = `group-${++groupCounter}-${Date.now()}`;
    this._shapes.update((shapes) => shapes.map((s) => this._selectedShapeIds().has(s.id) ? __spreadProps(__spreadValues({}, s), { groupId }) : s));
    return groupId;
  }
  ungroupSelected() {
    this._shapes.update((shapes) => shapes.map((s) => this._selectedShapeIds().has(s.id) ? __spreadProps(__spreadValues({}, s), { groupId: void 0 }) : s));
  }
  hasGroupInSelection() {
    return this.selectedShapes().some((s) => !!s.groupId);
  }
  static \u0275fac = function DiagramShapeManagerService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _DiagramShapeManagerService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _DiagramShapeManagerService, factory: _DiagramShapeManagerService.\u0275fac });
};

// src/app/features/diagram-builder/services/diagram-render.service.ts
var HANDLE_SIZE = 8;
var ROTATION_HANDLE_OFFSET = 20;
var DiagramRenderService = class _DiagramRenderService {
  drawAll(ctx, shapes, connections, selectedIds, hoveredId, scale) {
    ctx.save();
    for (const conn of connections) {
      this.drawConnection(ctx, conn, shapes, scale);
    }
    const sorted = [...shapes].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
    for (const shape of sorted) {
      this.drawShape(ctx, shape, scale);
      if (shape.linkedEntityId) {
        this.drawLinkedIndicator(ctx, shape, scale);
      }
      if (hoveredId === shape.id && !selectedIds.has(shape.id)) {
        this.drawHoverHighlight(ctx, shape);
      }
    }
    for (const shape of sorted) {
      if (selectedIds.has(shape.id)) {
        this.drawSelectionHandles(ctx, shape, scale);
      }
    }
    ctx.restore();
  }
  drawShape(ctx, shape, scale) {
    ctx.save();
    if (shape.rotation) {
      const cx = shape.x + shape.width / 2;
      const cy = shape.y + shape.height / 2;
      ctx.translate(cx, cy);
      ctx.rotate(shape.rotation * Math.PI / 180);
      ctx.translate(-cx, -cy);
    }
    switch (shape.type) {
      case "rectangle":
        this.drawRectangle(ctx, shape);
        break;
      case "circle":
        this.drawCircle(ctx, shape);
        break;
      case "line":
        this.drawLine(ctx, shape);
        break;
      case "text":
        this.drawText(ctx, shape, scale);
        break;
      case "symbol":
        this.drawSymbol(ctx, shape);
        break;
    }
    ctx.restore();
  }
  drawRectangle(ctx, shape) {
    ctx.strokeStyle = shape.color || "#ffffff";
    ctx.lineWidth = shape.lineWidth || 2;
    if (shape.fillColor) {
      ctx.fillStyle = shape.fillColor;
      ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
    }
    ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
    if (shape.label) {
      ctx.fillStyle = shape.color || "#ffffff";
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.fillText(shape.label, shape.x + shape.width / 2, shape.y + shape.height + 14);
    }
  }
  drawCircle(ctx, shape) {
    const cx = shape.x + shape.width / 2;
    const cy = shape.y + shape.height / 2;
    const rx = shape.width / 2;
    const ry = shape.height / 2;
    ctx.strokeStyle = shape.color || "#ffffff";
    ctx.lineWidth = shape.lineWidth || 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    if (shape.fillColor) {
      ctx.fillStyle = shape.fillColor;
      ctx.fill();
    }
    ctx.stroke();
  }
  drawLine(ctx, shape) {
    ctx.strokeStyle = shape.color || "#ffffff";
    ctx.lineWidth = shape.lineWidth || 2;
    ctx.beginPath();
    ctx.moveTo(shape.startX, shape.startY);
    ctx.lineTo(shape.endX, shape.endY);
    ctx.stroke();
  }
  drawText(ctx, shape, scale) {
    ctx.fillStyle = shape.color || "#ffffff";
    const fontSize = shape.fontSize || 14;
    ctx.font = `${fontSize}px ${shape.fontFamily || "Arial"}`;
    ctx.textBaseline = "top";
    ctx.fillText(shape.text, shape.x, shape.y);
  }
  drawSymbol(ctx, shape) {
    if (!shape.svgPath)
      return;
    ctx.save();
    ctx.translate(shape.x, shape.y);
    const path = new Path2D(shape.svgPath);
    const symbolBounds = this.getSymbolBounds(shape);
    const scaleX = shape.width / symbolBounds.width;
    const scaleY = shape.height / symbolBounds.height;
    ctx.scale(scaleX, scaleY);
    ctx.strokeStyle = shape.color || "#ffffff";
    ctx.lineWidth = (shape.lineWidth || 2) / Math.min(scaleX, scaleY);
    ctx.stroke(path);
    if (shape.fillColor) {
      ctx.fillStyle = shape.fillColor;
      ctx.fill(path);
    }
    ctx.restore();
    if (shape.label) {
      ctx.fillStyle = shape.color || "#ffffff";
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.fillText(shape.label, shape.x + shape.width / 2, shape.y + shape.height + 14);
    }
  }
  getSymbolBounds(shape) {
    return {
      width: shape.originalWidth || shape.width || 1,
      height: shape.originalHeight || shape.height || 1
    };
  }
  drawConnection(ctx, conn, shapes, scale) {
    const source = shapes.find((s) => s.id === conn.sourceShapeId);
    const target = shapes.find((s) => s.id === conn.targetShapeId);
    if (!source || !target)
      return;
    const sourcePoint = this.getAnchorPoint(source, conn.sourceAnchor);
    const targetPoint = this.getAnchorPoint(target, conn.targetAnchor);
    ctx.save();
    ctx.strokeStyle = conn.color || "#888888";
    ctx.lineWidth = conn.lineWidth || 2;
    if (conn.lineStyle === "dashed") {
      ctx.setLineDash([6, 4]);
    }
    ctx.beginPath();
    if (conn.waypoints && conn.waypoints.length > 0) {
      ctx.moveTo(sourcePoint.x, sourcePoint.y);
      for (const wp of conn.waypoints) {
        ctx.lineTo(wp.x, wp.y);
      }
      ctx.lineTo(targetPoint.x, targetPoint.y);
    } else {
      ctx.moveTo(sourcePoint.x, sourcePoint.y);
      if (conn.sourceAnchor === "left" || conn.sourceAnchor === "right") {
        ctx.lineTo(targetPoint.x, sourcePoint.y);
        ctx.lineTo(targetPoint.x, targetPoint.y);
      } else {
        ctx.lineTo(sourcePoint.x, targetPoint.y);
        ctx.lineTo(targetPoint.x, targetPoint.y);
      }
    }
    ctx.stroke();
    ctx.setLineDash([]);
    this.drawArrowhead(ctx, targetPoint, conn.targetAnchor);
    ctx.restore();
  }
  drawArrowhead(ctx, point, anchor) {
    const size = 8;
    ctx.save();
    ctx.translate(point.x, point.y);
    switch (anchor) {
      case "top":
        ctx.rotate(Math.PI / 2);
        break;
      case "bottom":
        ctx.rotate(-Math.PI / 2);
        break;
      case "left":
        ctx.rotate(0);
        break;
      case "right":
        ctx.rotate(Math.PI);
        break;
    }
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(size, -size / 2);
    ctx.lineTo(size, size / 2);
    ctx.closePath();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
    ctx.restore();
  }
  getAnchorPoint(shape, anchor) {
    switch (anchor) {
      case "top":
        return { x: shape.x + shape.width / 2, y: shape.y };
      case "bottom":
        return { x: shape.x + shape.width / 2, y: shape.y + shape.height };
      case "left":
        return { x: shape.x, y: shape.y + shape.height / 2 };
      case "right":
        return { x: shape.x + shape.width, y: shape.y + shape.height / 2 };
      default:
        return { x: shape.x + shape.width / 2, y: shape.y + shape.height / 2 };
    }
  }
  getAllAnchors(shape) {
    return ["top", "right", "bottom", "left"].map((position) => __spreadProps(__spreadValues({}, this.getAnchorPoint(shape, position)), {
      position,
      shapeId: shape.id
    }));
  }
  drawAnchorPoints(ctx, shape, hoveredAnchor) {
    const anchors = this.getAllAnchors(shape);
    for (const anchor of anchors) {
      const isHovered = hoveredAnchor && hoveredAnchor.shapeId === anchor.shapeId && hoveredAnchor.position === anchor.position;
      ctx.beginPath();
      ctx.arc(anchor.x, anchor.y, isHovered ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = isHovered ? "#4fc3f7" : "#2196f3";
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
  drawLinkedIndicator(ctx, shape, scale) {
    const r = 4 / scale;
    const x = shape.x + shape.width - r;
    const y = shape.y + r;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = "#4caf50";
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1 / scale;
    ctx.stroke();
    ctx.restore();
  }
  drawHoverHighlight(ctx, shape) {
    ctx.save();
    ctx.strokeStyle = "rgba(255, 165, 0, 0.6)";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(shape.x - 2, shape.y - 2, shape.width + 4, shape.height + 4);
    ctx.setLineDash([]);
    ctx.restore();
  }
  drawSelectionHandles(ctx, shape, scale) {
    const handleSize = HANDLE_SIZE / scale;
    const half = handleSize / 2;
    const { x, y, width: w, height: h } = shape;
    ctx.save();
    ctx.strokeStyle = "#2196f3";
    ctx.lineWidth = 1.5 / scale;
    ctx.setLineDash([4 / scale, 4 / scale]);
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);
    ctx.fillStyle = "#2196f3";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1 / scale;
    const handles = this.getResizeHandlePositions(shape);
    for (const hp of handles) {
      ctx.fillRect(hp.x - half, hp.y - half, handleSize, handleSize);
      ctx.strokeRect(hp.x - half, hp.y - half, handleSize, handleSize);
    }
    const rotX = x + w / 2;
    const rotY = y - ROTATION_HANDLE_OFFSET / scale;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(rotX, rotY);
    ctx.strokeStyle = "#2196f3";
    ctx.lineWidth = 1 / scale;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(rotX, rotY, half, 0, Math.PI * 2);
    ctx.fillStyle = "#4caf50";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();
    ctx.restore();
  }
  getResizeHandlePositions(shape) {
    const { x, y, width: w, height: h } = shape;
    return [
      { x, y, cursor: "nw-resize" },
      { x: x + w / 2, y, cursor: "n-resize" },
      { x: x + w, y, cursor: "ne-resize" },
      { x: x + w, y: y + h / 2, cursor: "e-resize" },
      { x: x + w, y: y + h, cursor: "se-resize" },
      { x: x + w / 2, y: y + h, cursor: "s-resize" },
      { x, y: y + h, cursor: "sw-resize" },
      { x, y: y + h / 2, cursor: "w-resize" }
    ];
  }
  hitTestHandle(shape, canvasX, canvasY, scale) {
    const handleSize = HANDLE_SIZE / scale;
    const half = handleSize / 2;
    const rotX = shape.x + shape.width / 2;
    const rotY = shape.y - ROTATION_HANDLE_OFFSET / scale;
    if (Math.abs(canvasX - rotX) <= half && Math.abs(canvasY - rotY) <= half) {
      return "rotate";
    }
    const handles = this.getResizeHandlePositions(shape);
    for (const hp of handles) {
      if (Math.abs(canvasX - hp.x) <= half && Math.abs(canvasY - hp.y) <= half) {
        return hp.cursor;
      }
    }
    return null;
  }
  hitTestShape(shapes, canvasX, canvasY) {
    for (let i = shapes.length - 1; i >= 0; i--) {
      const s = shapes[i];
      if (canvasX >= s.x && canvasX <= s.x + s.width && canvasY >= s.y && canvasY <= s.y + s.height) {
        return s;
      }
    }
    return null;
  }
  hitTestAnchor(shapes, canvasX, canvasY, threshold = 10) {
    for (const shape of shapes) {
      for (const anchor of this.getAllAnchors(shape)) {
        const dist = Math.sqrt((canvasX - anchor.x) ** 2 + (canvasY - anchor.y) ** 2);
        if (dist <= threshold)
          return anchor;
      }
    }
    return null;
  }
  static \u0275fac = function DiagramRenderService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _DiagramRenderService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _DiagramRenderService, factory: _DiagramRenderService.\u0275fac });
};

// src/app/features/diagram-builder/services/diagram-drawing.service.ts
var DiagramDrawingService = class _DiagramDrawingService {
  activeTool = signal("select");
  selectedSymbol = signal(null);
  drawingState = null;
  setTool(tool) {
    this.activeTool.set(tool);
    if (tool !== "place-symbol") {
      this.selectedSymbol.set(null);
    }
  }
  selectSymbol(symbol) {
    this.selectedSymbol.set(symbol);
    this.activeTool.set("place-symbol");
  }
  // --- Coordinate conversion ---
  clientToCanvasCoords(clientX, clientY, canvasRect, transform) {
    const relX = clientX - canvasRect.left;
    const relY = clientY - canvasRect.top;
    return {
      x: (relX - transform.pointX) / transform.scale,
      y: (relY - transform.pointY) / transform.scale
    };
  }
  // --- Drawing lifecycle ---
  startDrawing(canvasX, canvasY) {
    this.drawingState = {
      startX: canvasX,
      startY: canvasY,
      currentX: canvasX,
      currentY: canvasY
    };
  }
  updateDrawing(canvasX, canvasY) {
    if (this.drawingState) {
      this.drawingState.currentX = canvasX;
      this.drawingState.currentY = canvasY;
    }
  }
  finishDrawing() {
    if (!this.drawingState)
      return null;
    const { startX, startY, currentX, currentY } = this.drawingState;
    const x = Math.min(startX, currentX);
    const y = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    this.drawingState = null;
    if (width < 5 && height < 5)
      return null;
    const tool = this.activeTool();
    const symbol = this.selectedSymbol();
    switch (tool) {
      case "draw-rectangle":
        return {
          id: 0,
          type: "rectangle",
          x,
          y,
          width,
          height,
          color: "#ffffff",
          lineWidth: 2
        };
      case "draw-circle":
        return {
          id: 0,
          type: "circle",
          x,
          y,
          width,
          height,
          color: "#ffffff",
          lineWidth: 2
        };
      case "draw-line":
        return {
          id: 0,
          type: "line",
          x,
          y,
          width,
          height,
          startX,
          startY,
          endX: currentX,
          endY: currentY,
          color: "#ffffff",
          lineWidth: 2
        };
      case "place-symbol":
        if (!symbol)
          return null;
        const aspectRatio = symbol.originalWidth / symbol.originalHeight;
        const symWidth = Math.max(width, height * aspectRatio);
        const symHeight = symWidth / aspectRatio;
        return {
          id: 0,
          type: "symbol",
          x,
          y,
          width: symWidth,
          height: symHeight,
          color: "#ffffff",
          lineWidth: 2,
          symbolId: symbol.id,
          svgPath: symbol.svgPath,
          originalWidth: symbol.originalWidth,
          originalHeight: symbol.originalHeight
        };
      case "draw-text":
        return {
          id: 0,
          type: "text",
          x,
          y,
          width: 100,
          height: 20,
          text: "Text",
          fontSize: 14,
          color: "#ffffff"
        };
      default:
        return null;
    }
  }
  // --- Preview drawing on temp canvas ---
  drawPreview(ctx, canvasWidth, canvasHeight) {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    if (!this.drawingState)
      return;
    const { startX, startY, currentX, currentY } = this.drawingState;
    const x = Math.min(startX, currentX);
    const y = Math.min(startY, currentY);
    const w = Math.abs(currentX - startX);
    const h = Math.abs(currentY - startY);
    const tool = this.activeTool();
    ctx.save();
    ctx.strokeStyle = "rgba(33, 150, 243, 0.8)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 3]);
    switch (tool) {
      case "draw-rectangle":
      case "place-symbol":
      case "draw-text":
        ctx.strokeRect(x, y, w, h);
        break;
      case "draw-circle":
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case "draw-line":
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(currentX, currentY);
        ctx.stroke();
        break;
    }
    ctx.setLineDash([]);
    ctx.restore();
  }
  isDrawingTool() {
    const tool = this.activeTool();
    return tool !== "select" && tool !== "draw-connection";
  }
  isDrawing() {
    return this.drawingState !== null;
  }
  cancelDrawing() {
    this.drawingState = null;
  }
  static \u0275fac = function DiagramDrawingService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _DiagramDrawingService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _DiagramDrawingService, factory: _DiagramDrawingService.\u0275fac });
};

// src/app/features/diagram-builder/services/diagram-grid.service.ts
var DiagramGridService = class _DiagramGridService {
  gridVisible = signal(true);
  snapEnabled = signal(false);
  gridSize = signal(20);
  drawGrid(ctx, canvasWidth, canvasHeight, scale) {
    if (!this.gridVisible())
      return;
    const size = this.gridSize();
    ctx.save();
    const dotRadius = Math.max(0.5, 1 / scale);
    ctx.fillStyle = "rgba(150, 150, 150, 0.4)";
    for (let x = 0; x <= canvasWidth; x += size) {
      for (let y = 0; y <= canvasHeight; y += size) {
        ctx.beginPath();
        ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
  snapPosition(x, y) {
    if (!this.snapEnabled())
      return { x, y };
    const size = this.gridSize();
    return {
      x: Math.round(x / size) * size,
      y: Math.round(y / size) * size
    };
  }
  snapDimension(value) {
    if (!this.snapEnabled())
      return value;
    const size = this.gridSize();
    return Math.max(size, Math.round(value / size) * size);
  }
  toggleGrid() {
    this.gridVisible.update((v) => !v);
  }
  toggleSnap() {
    this.snapEnabled.update((v) => !v);
  }
  setGridSize(size) {
    this.gridSize.set(Math.max(5, size));
  }
  static \u0275fac = function DiagramGridService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _DiagramGridService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _DiagramGridService, factory: _DiagramGridService.\u0275fac });
};

// src/app/features/diagram-builder/services/diagram-connection.service.ts
var DiagramConnectionService = class _DiagramConnectionService {
  renderService;
  isDrawingConnection = signal(false);
  drawState = null;
  constructor(renderService) {
    this.renderService = renderService;
  }
  startConnection(anchor) {
    this.drawState = {
      sourceAnchor: anchor,
      currentX: anchor.x,
      currentY: anchor.y
    };
    this.isDrawingConnection.set(true);
  }
  updateConnection(canvasX, canvasY) {
    if (this.drawState) {
      this.drawState.currentX = canvasX;
      this.drawState.currentY = canvasY;
    }
  }
  finishConnection(targetAnchor) {
    if (!this.drawState)
      return null;
    const { sourceAnchor } = this.drawState;
    if (sourceAnchor.shapeId === targetAnchor.shapeId) {
      this.cancelConnection();
      return null;
    }
    this.drawState = null;
    this.isDrawingConnection.set(false);
    return {
      id: 0,
      sourceShapeId: sourceAnchor.shapeId,
      targetShapeId: targetAnchor.shapeId,
      sourceAnchor: sourceAnchor.position,
      targetAnchor: targetAnchor.position,
      lineStyle: "solid",
      lineWidth: 2,
      color: "#888888"
    };
  }
  cancelConnection() {
    this.drawState = null;
    this.isDrawingConnection.set(false);
  }
  drawPreview(ctx, canvasWidth, canvasHeight) {
    if (!this.drawState)
      return;
    const { sourceAnchor, currentX, currentY } = this.drawState;
    ctx.save();
    ctx.strokeStyle = "rgba(33, 150, 243, 0.7)";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 3]);
    ctx.beginPath();
    ctx.moveTo(sourceAnchor.x, sourceAnchor.y);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(sourceAnchor.x, sourceAnchor.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#4fc3f7";
    ctx.fill();
    ctx.restore();
  }
  getDrawState() {
    return this.drawState;
  }
  static \u0275fac = function DiagramConnectionService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _DiagramConnectionService)(\u0275\u0275inject(DiagramRenderService));
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _DiagramConnectionService, factory: _DiagramConnectionService.\u0275fac });
};

// src/app/features/diagram-builder/services/diagram-alignment.service.ts
var DiagramAlignmentService = class _DiagramAlignmentService {
  alignShapes(shapes, alignment) {
    if (shapes.length < 2)
      return [];
    const reference = shapes[0];
    const updates = [];
    for (let i = 1; i < shapes.length; i++) {
      const shape = shapes[i];
      const update = { id: shape.id };
      switch (alignment) {
        case "left":
          update.x = reference.x;
          break;
        case "right":
          update.x = reference.x + reference.width - shape.width;
          break;
        case "top":
          update.y = reference.y;
          break;
        case "bottom":
          update.y = reference.y + reference.height - shape.height;
          break;
        case "h-center":
          update.x = reference.x + reference.width / 2 - shape.width / 2;
          break;
        case "v-center":
          update.y = reference.y + reference.height / 2 - shape.height / 2;
          break;
      }
      updates.push(update);
    }
    return updates;
  }
  distributeShapes(shapes, direction) {
    if (shapes.length < 3)
      return [];
    const sorted = [...shapes].sort((a, b) => direction === "horizontal" ? a.x - b.x : a.y - b.y);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const updates = [];
    if (direction === "horizontal") {
      const totalSpace = last.x + last.width - first.x;
      const totalShapeWidth = sorted.reduce((sum, s) => sum + s.width, 0);
      const gap = (totalSpace - totalShapeWidth) / (sorted.length - 1);
      let currentX = first.x + first.width + gap;
      for (let i = 1; i < sorted.length - 1; i++) {
        updates.push({ id: sorted[i].id, x: currentX });
        currentX += sorted[i].width + gap;
      }
    } else {
      const totalSpace = last.y + last.height - first.y;
      const totalShapeHeight = sorted.reduce((sum, s) => sum + s.height, 0);
      const gap = (totalSpace - totalShapeHeight) / (sorted.length - 1);
      let currentY = first.y + first.height + gap;
      for (let i = 1; i < sorted.length - 1; i++) {
        updates.push({ id: sorted[i].id, y: currentY });
        currentY += sorted[i].height + gap;
      }
    }
    return updates;
  }
  matchSize(shapes, dimension) {
    if (shapes.length < 2)
      return [];
    const reference = shapes[0];
    const updates = [];
    for (let i = 1; i < shapes.length; i++) {
      const update = { id: shapes[i].id };
      if (dimension === "width" || dimension === "both") {
        update.width = reference.width;
      }
      if (dimension === "height" || dimension === "both") {
        update.height = reference.height;
      }
      updates.push(update);
    }
    return updates;
  }
  static \u0275fac = function DiagramAlignmentService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _DiagramAlignmentService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _DiagramAlignmentService, factory: _DiagramAlignmentService.\u0275fac });
};

// src/app/features/diagram-builder/models/diagram.model.ts
function parseDiagramData(dto) {
  let shapes = [];
  let connections = [];
  try {
    if (dto.shapesJson)
      shapes = JSON.parse(dto.shapesJson);
  } catch {
  }
  try {
    if (dto.connectionsJson)
      connections = JSON.parse(dto.connectionsJson);
  } catch {
  }
  return { shapes, connections };
}
function serializeDiagramData(data) {
  return {
    shapesJson: JSON.stringify(data.shapes),
    connectionsJson: JSON.stringify(data.connections)
  };
}

// src/app/features/diagram-builder/services/diagram-state.service.ts
var DiagramStateService = class _DiagramStateService {
  api = inject(DiagramApiService);
  currentDiagram = signal(null);
  isDirty = signal(false);
  isSaving = signal(false);
  isLoading = signal(false);
  diagramName = computed(() => this.currentDiagram()?.name ?? "Untitled Diagram");
  saveSubject = new Subject();
  shapeManager = null;
  constructor() {
    this.saveSubject.pipe(debounceTime(2e3)).subscribe(() => {
      this.save();
    });
  }
  setShapeManager(manager) {
    this.shapeManager = manager;
  }
  loadDiagram(id) {
    this.isLoading.set(true);
    this.api.getById(id).subscribe({
      next: (res) => {
        if (res.responseData) {
          this.currentDiagram.set(res.responseData);
          const data = parseDiagramData(res.responseData);
          if (this.shapeManager) {
            this.shapeManager.setShapes(data.shapes);
            this.shapeManager.setConnections(data.connections);
          }
          this.isDirty.set(false);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }
  createNewDiagram(name = "Untitled Diagram") {
    const dto = {
      name,
      canvasWidth: 1920,
      canvasHeight: 1080,
      gridSize: 20,
      shapesJson: "[]",
      connectionsJson: "[]"
    };
    this.api.create(dto).subscribe({
      next: (res) => {
        if (res.responseData) {
          this.currentDiagram.set(res.responseData);
          if (this.shapeManager) {
            this.shapeManager.setShapes([]);
            this.shapeManager.setConnections([]);
          }
          this.isDirty.set(false);
        }
      }
    });
  }
  markDirty() {
    this.isDirty.set(true);
    this.saveSubject.next();
  }
  save() {
    const diagram = this.currentDiagram();
    if (!diagram || !diagram.id || !this.shapeManager)
      return;
    this.isSaving.set(true);
    const data = {
      shapes: this.shapeManager.shapes(),
      connections: this.shapeManager.connections()
    };
    const serialized = serializeDiagramData(data);
    const updated = __spreadProps(__spreadValues({}, diagram), {
      shapesJson: serialized.shapesJson,
      connectionsJson: serialized.connectionsJson
    });
    this.api.update(diagram.id, updated).subscribe({
      next: (res) => {
        if (res.responseData) {
          this.currentDiagram.set(res.responseData);
        }
        this.isDirty.set(false);
        this.isSaving.set(false);
      },
      error: () => this.isSaving.set(false)
    });
  }
  updateDiagramMeta(updates) {
    const current = this.currentDiagram();
    if (current) {
      this.currentDiagram.set(__spreadValues(__spreadValues({}, current), updates));
      this.markDirty();
    }
  }
  static \u0275fac = function DiagramStateService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _DiagramStateService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _DiagramStateService, factory: _DiagramStateService.\u0275fac });
};

// src/app/features/diagram-builder/models/diagram-config.model.ts
var DIAGRAM_BUILDER_CONFIG = {
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
  canDrawConnections: true,
  showToolbar: true,
  showSymbolPalette: true,
  showGrid: true,
  showProperties: true,
  enabledTools: ["select", "draw-rectangle", "draw-circle", "draw-line", "draw-text", "place-symbol", "draw-connection"]
};
var DIAGRAM_RENDERER_CONFIG = {
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
  canDrawConnections: false,
  showToolbar: false,
  showSymbolPalette: false,
  showGrid: false,
  showProperties: false,
  enabledTools: ["select"]
};

// src/app/features/diagram-builder/components/diagram-toolbar/diagram-toolbar.component.ts
var _forTrack0 = ($index, $item) => $item.id;
var _forTrack1 = ($index, $item) => $item.type;
function DiagramToolbarComponent_For_6_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 16);
    \u0275\u0275listener("click", function DiagramToolbarComponent_For_6_Template_button_click_0_listener() {
      const tool_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.drawingService.setTool(tool_r2.id));
    });
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const tool_r2 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275classProp("active", ctx_r2.drawingService.activeTool() === tool_r2.id);
    \u0275\u0275property("title", tool_r2.label);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", tool_r2.icon, " ");
  }
}
function DiagramToolbarComponent_For_12_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 17);
    \u0275\u0275listener("click", function DiagramToolbarComponent_For_12_Template_button_click_0_listener() {
      const align_r5 = \u0275\u0275restoreView(_r4).$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onAlign.emit(align_r5.type));
    });
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const align_r5 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275property("title", align_r5.label)("disabled", ctx_r2.shapeManager.selectedShapes().length < 2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", align_r5.icon, " ");
  }
}
var DiagramToolbarComponent = class _DiagramToolbarComponent {
  drawingService = inject(DiagramDrawingService);
  gridService = inject(DiagramGridService);
  shapeManager = inject(DiagramShapeManagerService);
  onAlign = output();
  onDistribute = output();
  onDelete = output();
  onGroup = output();
  onUngroup = output();
  onZoomIn = output();
  onZoomOut = output();
  onZoomFit = output();
  drawingTools = [
    { id: "select", icon: "\u21F1", label: "Select" },
    { id: "draw-rectangle", icon: "\u25AD", label: "Rectangle" },
    { id: "draw-circle", icon: "\u25CB", label: "Circle" },
    { id: "draw-line", icon: "\u2571", label: "Line" },
    { id: "draw-text", icon: "T", label: "Text" },
    { id: "place-symbol", icon: "\u2699", label: "P&ID Symbol" },
    { id: "draw-connection", icon: "\u27F6", label: "Connection" }
  ];
  alignmentTools = [
    { type: "left", icon: "\u2ACD", label: "Align Left" },
    { type: "right", icon: "\u2ACE", label: "Align Right" },
    { type: "top", icon: "\u2AE0", label: "Align Top" },
    { type: "bottom", icon: "\u2AE1", label: "Align Bottom" },
    { type: "h-center", icon: "\u2AF0", label: "Center Horizontal" },
    { type: "v-center", icon: "\u2AEF", label: "Center Vertical" }
  ];
  static \u0275fac = function DiagramToolbarComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _DiagramToolbarComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _DiagramToolbarComponent, selectors: [["app-diagram-toolbar"]], outputs: { onAlign: "onAlign", onDistribute: "onDistribute", onDelete: "onDelete", onGroup: "onGroup", onUngroup: "onUngroup", onZoomIn: "onZoomIn", onZoomOut: "onZoomOut", onZoomFit: "onZoomFit" }, decls: 49, vars: 9, consts: [[1, "diagram-toolbar"], [1, "tool-group"], [1, "group-label"], [1, "tool-buttons"], [1, "tool-btn", 3, "active", "title"], [1, "tool-btn", 3, "title", "disabled"], ["title", "Distribute Horizontally", 1, "tool-btn", 3, "click", "disabled"], ["title", "Distribute Vertically", 1, "tool-btn", 3, "click", "disabled"], ["title", "Toggle Grid", 1, "tool-btn", 3, "click"], ["title", "Snap to Grid", 1, "tool-btn", 3, "click"], ["title", "Zoom In", 1, "tool-btn", 3, "click"], ["title", "Zoom Out", 1, "tool-btn", 3, "click"], ["title", "Fit to View", 1, "tool-btn", 3, "click"], ["title", "Group (Ctrl+G)", 1, "tool-btn", 3, "click", "disabled"], ["title", "Ungroup (Ctrl+Shift+G)", 1, "tool-btn", 3, "click", "disabled"], ["title", "Delete Selected (Del)", 1, "tool-btn", "danger", 3, "click", "disabled"], [1, "tool-btn", 3, "click", "title"], [1, "tool-btn", 3, "click", "title", "disabled"]], template: function DiagramToolbarComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "span", 2);
      \u0275\u0275text(3, "Tools");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(4, "div", 3);
      \u0275\u0275repeaterCreate(5, DiagramToolbarComponent_For_6_Template, 2, 4, "button", 4, _forTrack0);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(7, "div", 1)(8, "span", 2);
      \u0275\u0275text(9, "Align");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(10, "div", 3);
      \u0275\u0275repeaterCreate(11, DiagramToolbarComponent_For_12_Template, 2, 3, "button", 5, _forTrack1);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(13, "div", 1)(14, "span", 2);
      \u0275\u0275text(15, "Distribute");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(16, "div", 3)(17, "button", 6);
      \u0275\u0275listener("click", function DiagramToolbarComponent_Template_button_click_17_listener() {
        return ctx.onDistribute.emit("horizontal");
      });
      \u0275\u0275text(18, "\u27FA");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(19, "button", 7);
      \u0275\u0275listener("click", function DiagramToolbarComponent_Template_button_click_19_listener() {
        return ctx.onDistribute.emit("vertical");
      });
      \u0275\u0275text(20, "\u27FA\u0303");
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(21, "div", 1)(22, "span", 2);
      \u0275\u0275text(23, "Canvas");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(24, "div", 3)(25, "button", 8);
      \u0275\u0275listener("click", function DiagramToolbarComponent_Template_button_click_25_listener() {
        return ctx.gridService.toggleGrid();
      });
      \u0275\u0275text(26, "\u229E");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(27, "button", 9);
      \u0275\u0275listener("click", function DiagramToolbarComponent_Template_button_click_27_listener() {
        return ctx.gridService.toggleSnap();
      });
      \u0275\u0275text(28, "\u22A1");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(29, "button", 10);
      \u0275\u0275listener("click", function DiagramToolbarComponent_Template_button_click_29_listener() {
        return ctx.onZoomIn.emit();
      });
      \u0275\u0275text(30, "+");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(31, "button", 11);
      \u0275\u0275listener("click", function DiagramToolbarComponent_Template_button_click_31_listener() {
        return ctx.onZoomOut.emit();
      });
      \u0275\u0275text(32, "\u2212");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(33, "button", 12);
      \u0275\u0275listener("click", function DiagramToolbarComponent_Template_button_click_33_listener() {
        return ctx.onZoomFit.emit();
      });
      \u0275\u0275text(34, "\u229F");
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(35, "div", 1)(36, "span", 2);
      \u0275\u0275text(37, "Group");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(38, "div", 3)(39, "button", 13);
      \u0275\u0275listener("click", function DiagramToolbarComponent_Template_button_click_39_listener() {
        return ctx.onGroup.emit();
      });
      \u0275\u0275text(40, "\u229E");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(41, "button", 14);
      \u0275\u0275listener("click", function DiagramToolbarComponent_Template_button_click_41_listener() {
        return ctx.onUngroup.emit();
      });
      \u0275\u0275text(42, "\u229F");
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(43, "div", 1)(44, "span", 2);
      \u0275\u0275text(45, "Actions");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(46, "div", 3)(47, "button", 15);
      \u0275\u0275listener("click", function DiagramToolbarComponent_Template_button_click_47_listener() {
        return ctx.onDelete.emit();
      });
      \u0275\u0275text(48, "\u2715");
      \u0275\u0275elementEnd()()()();
    }
    if (rf & 2) {
      \u0275\u0275advance(5);
      \u0275\u0275repeater(ctx.drawingTools);
      \u0275\u0275advance(6);
      \u0275\u0275repeater(ctx.alignmentTools);
      \u0275\u0275advance(6);
      \u0275\u0275property("disabled", ctx.shapeManager.selectedShapes().length < 3);
      \u0275\u0275advance(2);
      \u0275\u0275property("disabled", ctx.shapeManager.selectedShapes().length < 3);
      \u0275\u0275advance(6);
      \u0275\u0275classProp("active", ctx.gridService.gridVisible());
      \u0275\u0275advance(2);
      \u0275\u0275classProp("active", ctx.gridService.snapEnabled());
      \u0275\u0275advance(12);
      \u0275\u0275property("disabled", ctx.shapeManager.selectionCount() < 2);
      \u0275\u0275advance(2);
      \u0275\u0275property("disabled", !ctx.shapeManager.hasGroupInSelection());
      \u0275\u0275advance(6);
      \u0275\u0275property("disabled", !ctx.shapeManager.hasSelection());
    }
  }, dependencies: [CommonModule], styles: ["\n\n.diagram-toolbar[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 12px;\n  padding: 6px 12px;\n  background: #1e1e1e;\n  border-bottom: 1px solid #333;\n  align-items: center;\n  flex-wrap: wrap;\n}\n.tool-group[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 2px;\n}\n.group-label[_ngcontent-%COMP%] {\n  font-size: 10px;\n  color: #888;\n  text-transform: uppercase;\n}\n.tool-buttons[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 2px;\n}\n.tool-btn[_ngcontent-%COMP%] {\n  width: 32px;\n  height: 32px;\n  border: 1px solid #444;\n  background: #2a2a2a;\n  color: #ccc;\n  border-radius: 4px;\n  cursor: pointer;\n  font-size: 14px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  transition: all 0.15s;\n}\n.tool-btn[_ngcontent-%COMP%]:hover:not(:disabled) {\n  background: #3a3a3a;\n  border-color: #666;\n}\n.tool-btn.active[_ngcontent-%COMP%] {\n  background: #1565c0;\n  border-color: #2196f3;\n  color: #fff;\n}\n.tool-btn[_ngcontent-%COMP%]:disabled {\n  opacity: 0.4;\n  cursor: not-allowed;\n}\n.tool-btn.danger[_ngcontent-%COMP%]:hover:not(:disabled) {\n  background: #c62828;\n  border-color: #f44336;\n}\n/*# sourceMappingURL=diagram-toolbar.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(DiagramToolbarComponent, { className: "DiagramToolbarComponent", filePath: "src/app/features/diagram-builder/components/diagram-toolbar/diagram-toolbar.component.ts", lineNumber: 158 });
})();

// src/app/features/diagram-builder/components/diagram-properties/diagram-properties.component.ts
var _forTrack02 = ($index, $item) => $item.id;
function DiagramPropertiesComponent_Conditional_3_Conditional_33_Conditional_16_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 11)(1, "span", 12);
    \u0275\u0275text(2, "Normal Pos");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "span", 13);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(ctx_r2.linkedLotoPoint().normPos.name);
  }
}
function DiagramPropertiesComponent_Conditional_3_Conditional_33_Conditional_17_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 11)(1, "span", 12);
    \u0275\u0275text(2, "Isolated Pos");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "span", 13);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(ctx_r2.linkedLotoPoint().isoPos.name);
  }
}
function DiagramPropertiesComponent_Conditional_3_Conditional_33_Conditional_18_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 11)(1, "span", 12);
    \u0275\u0275text(2, "Type");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "span", 13);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(ctx_r2.linkedLotoPoint().eqType.name);
  }
}
function DiagramPropertiesComponent_Conditional_3_Conditional_33_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 8)(1, "div", 11)(2, "span", 12);
    \u0275\u0275text(3, "Tag");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "span", 13);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(6, "div", 11)(7, "span", 12);
    \u0275\u0275text(8, "Description");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "span", 13);
    \u0275\u0275text(10);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(11, "div", 11)(12, "span", 12);
    \u0275\u0275text(13, "Unit");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(14, "span", 13);
    \u0275\u0275text(15);
    \u0275\u0275elementEnd()();
    \u0275\u0275template(16, DiagramPropertiesComponent_Conditional_3_Conditional_33_Conditional_16_Template, 5, 1, "div", 11)(17, DiagramPropertiesComponent_Conditional_3_Conditional_33_Conditional_17_Template, 5, 1, "div", 11)(18, DiagramPropertiesComponent_Conditional_3_Conditional_33_Conditional_18_Template, 5, 1, "div", 11);
    \u0275\u0275elementStart(19, "button", 14);
    \u0275\u0275listener("click", function DiagramPropertiesComponent_Conditional_3_Conditional_33_Template_button_click_19_listener() {
      \u0275\u0275restoreView(_r4);
      const shape_r2 = \u0275\u0275nextContext();
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.unlinkEntity(shape_r2.id));
    });
    \u0275\u0275text(20, "Unlink");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate(ctx_r2.linkedLotoPoint().tagNumber);
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate(ctx_r2.linkedLotoPoint().description || "\u2014");
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate(ctx_r2.linkedLotoPoint().unit || "\u2014");
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r2.linkedLotoPoint().normPos ? 16 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r2.linkedLotoPoint().isoPos ? 17 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r2.linkedLotoPoint().eqType ? 18 : -1);
  }
}
function DiagramPropertiesComponent_Conditional_3_Conditional_34_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 9);
    \u0275\u0275text(1, "Loading...");
    \u0275\u0275elementEnd();
  }
}
function DiagramPropertiesComponent_Conditional_3_Conditional_35_Conditional_2_For_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 18);
    \u0275\u0275listener("click", function DiagramPropertiesComponent_Conditional_3_Conditional_35_Conditional_2_For_2_Template_div_click_0_listener() {
      const lp_r7 = \u0275\u0275restoreView(_r6).$implicit;
      const shape_r2 = \u0275\u0275nextContext(3);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.linkEntity(shape_r2.id, lp_r7));
    });
    \u0275\u0275elementStart(1, "span", 19);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "span", 20);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const lp_r7 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(lp_r7.tagNumber);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(lp_r7.description || "");
  }
}
function DiagramPropertiesComponent_Conditional_3_Conditional_35_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 16);
    \u0275\u0275repeaterCreate(1, DiagramPropertiesComponent_Conditional_3_Conditional_35_Conditional_2_For_2_Template, 5, 2, "div", 17, _forTrack02);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(3);
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r2.searchResults());
  }
}
function DiagramPropertiesComponent_Conditional_3_Conditional_35_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 10)(1, "input", 15);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_3_Conditional_35_Template_input_ngModelChange_1_listener($event) {
      \u0275\u0275restoreView(_r5);
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.onSearchInput($event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275template(2, DiagramPropertiesComponent_Conditional_3_Conditional_35_Conditional_2_Template, 3, 0, "div", 16);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("ngModel", ctx_r2.searchQuery());
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r2.searchResults().length > 0 ? 2 : -1);
  }
}
function DiagramPropertiesComponent_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 2)(1, "h4");
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "label");
    \u0275\u0275text(4, "X ");
    \u0275\u0275elementStart(5, "input", 3);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_3_Template_input_ngModelChange_5_listener($event) {
      const shape_r2 = \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateShape(shape_r2.id, { x: $event }));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(6, "label");
    \u0275\u0275text(7, "Y ");
    \u0275\u0275elementStart(8, "input", 3);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_3_Template_input_ngModelChange_8_listener($event) {
      const shape_r2 = \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateShape(shape_r2.id, { y: $event }));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(9, "label");
    \u0275\u0275text(10, "Width ");
    \u0275\u0275elementStart(11, "input", 4);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_3_Template_input_ngModelChange_11_listener($event) {
      const shape_r2 = \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateShape(shape_r2.id, { width: $event }));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(12, "label");
    \u0275\u0275text(13, "Height ");
    \u0275\u0275elementStart(14, "input", 4);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_3_Template_input_ngModelChange_14_listener($event) {
      const shape_r2 = \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateShape(shape_r2.id, { height: $event }));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(15, "label");
    \u0275\u0275text(16, "Rotation ");
    \u0275\u0275elementStart(17, "input", 5);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_3_Template_input_ngModelChange_17_listener($event) {
      const shape_r2 = \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateShape(shape_r2.id, { rotation: $event }));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(18, "label");
    \u0275\u0275text(19, "Color ");
    \u0275\u0275elementStart(20, "input", 6);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_3_Template_input_ngModelChange_20_listener($event) {
      const shape_r2 = \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateShape(shape_r2.id, { color: $event }));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(21, "label");
    \u0275\u0275text(22, "Fill ");
    \u0275\u0275elementStart(23, "input", 6);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_3_Template_input_ngModelChange_23_listener($event) {
      const shape_r2 = \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateShape(shape_r2.id, { fillColor: $event }));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(24, "label");
    \u0275\u0275text(25, "Line Width ");
    \u0275\u0275elementStart(26, "input", 5);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_3_Template_input_ngModelChange_26_listener($event) {
      const shape_r2 = \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateShape(shape_r2.id, { lineWidth: $event }));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(27, "label");
    \u0275\u0275text(28, "Label ");
    \u0275\u0275elementStart(29, "input", 7);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_3_Template_input_ngModelChange_29_listener($event) {
      const shape_r2 = \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateShape(shape_r2.id, { label: $event }));
    });
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(30, "div", 2)(31, "h4");
    \u0275\u0275text(32, "Linked Equipment");
    \u0275\u0275elementEnd();
    \u0275\u0275template(33, DiagramPropertiesComponent_Conditional_3_Conditional_33_Template, 21, 6, "div", 8)(34, DiagramPropertiesComponent_Conditional_3_Conditional_34_Template, 2, 0, "p", 9)(35, DiagramPropertiesComponent_Conditional_3_Conditional_35_Template, 3, 2, "div", 10);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const shape_r2 = ctx;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("Shape: ", shape_r2.type, "");
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", shape_r2.x);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", shape_r2.y);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", shape_r2.width)("min", 10);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", shape_r2.height)("min", 10);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", shape_r2.rotation || 0)("min", 0)("max", 360);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", shape_r2.color || "#ffffff");
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", shape_r2.fillColor || "#000000");
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", shape_r2.lineWidth || 2)("min", 1)("max", 20);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", shape_r2.label || "");
    \u0275\u0275advance(4);
    \u0275\u0275conditional(shape_r2.linkedEntityId && ctx_r2.linkedLotoPoint() ? 33 : shape_r2.linkedEntityId && !ctx_r2.linkedLotoPoint() ? 34 : 35);
  }
}
function DiagramPropertiesComponent_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 1);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("", ctx_r2.shapeManager.selectedShapes().length, " shapes selected");
  }
}
function DiagramPropertiesComponent_Conditional_5_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r8 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 2)(1, "h4");
    \u0275\u0275text(2, "Diagram");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "label");
    \u0275\u0275text(4, "Name ");
    \u0275\u0275elementStart(5, "input", 7);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_5_Conditional_0_Template_input_ngModelChange_5_listener($event) {
      \u0275\u0275restoreView(_r8);
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.stateService.updateDiagramMeta({ name: $event }));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(6, "label");
    \u0275\u0275text(7, "Description ");
    \u0275\u0275elementStart(8, "textarea", 21);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_5_Conditional_0_Template_textarea_ngModelChange_8_listener($event) {
      \u0275\u0275restoreView(_r8);
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.stateService.updateDiagramMeta({ description: $event }));
    });
    \u0275\u0275text(9, "              ");
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const diagram_r9 = ctx;
    \u0275\u0275advance(5);
    \u0275\u0275property("ngModel", diagram_r9.name);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", diagram_r9.description);
  }
}
function DiagramPropertiesComponent_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, DiagramPropertiesComponent_Conditional_5_Conditional_0_Template, 10, 2, "div", 2);
    \u0275\u0275elementStart(1, "p", 1);
    \u0275\u0275text(2, "Select a shape to edit properties");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    let tmp_1_0;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275conditional((tmp_1_0 = ctx_r2.stateService.currentDiagram()) ? 0 : -1, tmp_1_0);
  }
}
var DiagramPropertiesComponent = class _DiagramPropertiesComponent {
  shapeManager = inject(DiagramShapeManagerService);
  stateService = inject(DiagramStateService);
  lotoApi = inject(RfLotoPointApiService);
  linkedLotoPoint = signal(null);
  searchQuery = signal("");
  searchResults = signal([]);
  searchSubject = new Subject();
  lastFetchedId = null;
  constructor() {
    effect(() => {
      const shape = this.shapeManager.singleSelectedShape();
      const entityId = shape?.linkedEntityId;
      const entityType = shape?.linkedEntityType;
      if (entityId && entityType === "loto-point" && entityId !== this.lastFetchedId) {
        this.lastFetchedId = entityId;
        this.linkedLotoPoint.set(null);
        this.lotoApi.getLotoPointById(String(entityId)).subscribe({
          next: (res) => this.linkedLotoPoint.set(res.responseData ?? null),
          error: () => this.linkedLotoPoint.set(null)
        });
      } else if (!entityId) {
        this.lastFetchedId = null;
        this.linkedLotoPoint.set(null);
      }
      this.searchQuery.set("");
      this.searchResults.set([]);
    });
    this.searchSubject.pipe(debounceTime(300), switchMap((query) => {
      if (!query || query.length < 2)
        return of(null);
      return this.lotoApi.searchLotoPoints({ type: "global", query, page: 1, pageSize: 20 }, 20);
    })).subscribe((res) => {
      this.searchResults.set(res?.responseData?.content ?? []);
    });
  }
  updateShape(id, updates) {
    this.shapeManager.updateShape(id, updates);
    this.stateService.markDirty();
  }
  onSearchInput(query) {
    this.searchQuery.set(query);
    this.searchSubject.next(query);
  }
  linkEntity(shapeId, lotoPoint) {
    this.shapeManager.updateShape(shapeId, {
      linkedEntityId: lotoPoint.id,
      linkedEntityType: "loto-point",
      label: lotoPoint.tagNumber || void 0
    });
    this.linkedLotoPoint.set(lotoPoint);
    this.lastFetchedId = lotoPoint.id;
    this.searchQuery.set("");
    this.searchResults.set([]);
    this.stateService.markDirty();
  }
  unlinkEntity(shapeId) {
    this.shapeManager.updateShape(shapeId, {
      linkedEntityId: void 0,
      linkedEntityType: void 0
    });
    this.linkedLotoPoint.set(null);
    this.lastFetchedId = null;
    this.stateService.markDirty();
  }
  static \u0275fac = function DiagramPropertiesComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _DiagramPropertiesComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _DiagramPropertiesComponent, selectors: [["app-diagram-properties"]], decls: 6, vars: 1, consts: [[1, "properties-panel"], [1, "info"], [1, "property-section"], ["type", "number", 3, "ngModelChange", "ngModel"], ["type", "number", 3, "ngModelChange", "ngModel", "min"], ["type", "number", 3, "ngModelChange", "ngModel", "min", "max"], ["type", "color", 3, "ngModelChange", "ngModel"], ["type", "text", 3, "ngModelChange", "ngModel"], [1, "linked-entity-card"], [1, "loading-text"], [1, "link-search"], [1, "linked-field"], [1, "linked-label"], [1, "linked-value"], [1, "btn-unlink", 3, "click"], ["type", "text", "placeholder", "Search LOTO point...", 3, "ngModelChange", "ngModel"], [1, "search-results"], [1, "search-result-item"], [1, "search-result-item", 3, "click"], [1, "result-tag"], [1, "result-desc"], [3, "ngModelChange", "ngModel"]], template: function DiagramPropertiesComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "h3");
      \u0275\u0275text(2, "Properties");
      \u0275\u0275elementEnd();
      \u0275\u0275template(3, DiagramPropertiesComponent_Conditional_3_Template, 36, 17)(4, DiagramPropertiesComponent_Conditional_4_Template, 2, 1, "p", 1)(5, DiagramPropertiesComponent_Conditional_5_Template, 3, 1);
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      let tmp_0_0;
      \u0275\u0275advance(3);
      \u0275\u0275conditional((tmp_0_0 = ctx.shapeManager.singleSelectedShape()) ? 3 : ctx.shapeManager.selectedShapes().length > 1 ? 4 : 5, tmp_0_0);
    }
  }, dependencies: [CommonModule, FormsModule, DefaultValueAccessor, NumberValueAccessor, NgControlStatus, MinValidator, MaxValidator, NgModel], styles: ["\n\n.properties-panel[_ngcontent-%COMP%] {\n  width: 240px;\n  background: #1a1a1a;\n  border-left: 1px solid #333;\n  padding: 12px;\n  overflow-y: auto;\n}\nh3[_ngcontent-%COMP%] {\n  margin: 0 0 12px;\n  font-size: 14px;\n  color: #aaa;\n}\nh4[_ngcontent-%COMP%] {\n  margin: 0 0 8px;\n  font-size: 13px;\n  color: #ddd;\n  text-transform: capitalize;\n}\n.property-section[_ngcontent-%COMP%] {\n  margin-bottom: 16px;\n}\nlabel[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  font-size: 12px;\n  color: #999;\n  margin-bottom: 6px;\n  gap: 8px;\n}\ninput[_ngcontent-%COMP%], \ntextarea[_ngcontent-%COMP%] {\n  width: 120px;\n  padding: 4px 6px;\n  background: #2a2a2a;\n  border: 1px solid #444;\n  color: #ddd;\n  border-radius: 3px;\n  font-size: 12px;\n}\ninput[type=color][_ngcontent-%COMP%] {\n  width: 40px;\n  height: 24px;\n  padding: 0;\n  cursor: pointer;\n}\ntextarea[_ngcontent-%COMP%] {\n  width: 120px;\n  height: 60px;\n  resize: vertical;\n}\n.info[_ngcontent-%COMP%] {\n  font-size: 12px;\n  color: #666;\n}\n.linked-entity-card[_ngcontent-%COMP%] {\n  background: #222;\n  border: 1px solid #444;\n  border-radius: 4px;\n  padding: 8px;\n}\n.linked-field[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  font-size: 11px;\n  margin-bottom: 4px;\n}\n.linked-label[_ngcontent-%COMP%] {\n  color: #888;\n}\n.linked-value[_ngcontent-%COMP%] {\n  color: #ddd;\n  text-align: right;\n  max-width: 120px;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n.btn-unlink[_ngcontent-%COMP%] {\n  margin-top: 8px;\n  width: 100%;\n  padding: 4px;\n  background: #333;\n  border: 1px solid #555;\n  color: #f44336;\n  border-radius: 3px;\n  cursor: pointer;\n  font-size: 11px;\n}\n.btn-unlink[_ngcontent-%COMP%]:hover {\n  background: #422;\n  border-color: #f44336;\n}\n.loading-text[_ngcontent-%COMP%] {\n  font-size: 11px;\n  color: #888;\n}\n.link-search[_ngcontent-%COMP%]   input[_ngcontent-%COMP%] {\n  width: 100%;\n  box-sizing: border-box;\n  margin-bottom: 4px;\n}\n.search-results[_ngcontent-%COMP%] {\n  max-height: 200px;\n  overflow-y: auto;\n  border: 1px solid #444;\n  border-radius: 3px;\n  background: #222;\n}\n.search-result-item[_ngcontent-%COMP%] {\n  padding: 6px 8px;\n  cursor: pointer;\n  border-bottom: 1px solid #333;\n  display: flex;\n  flex-direction: column;\n  gap: 2px;\n}\n.search-result-item[_ngcontent-%COMP%]:last-child {\n  border-bottom: none;\n}\n.search-result-item[_ngcontent-%COMP%]:hover {\n  background: #2a3a4a;\n}\n.result-tag[_ngcontent-%COMP%] {\n  font-size: 12px;\n  color: #4fc3f7;\n  font-weight: 500;\n}\n.result-desc[_ngcontent-%COMP%] {\n  font-size: 10px;\n  color: #888;\n}\n/*# sourceMappingURL=diagram-properties.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(DiagramPropertiesComponent, { className: "DiagramPropertiesComponent", filePath: "src/app/features/diagram-builder/components/diagram-properties/diagram-properties.component.ts", lineNumber: 242 });
})();

// src/app/features/diagram-builder/simulation/models/simulation.model.ts
var SYMBOL_ROLE_MAP = {
  "manual-valve": "valve",
  "mov": "valve",
  "aov": "valve",
  "cv": "valve",
  "bypass-line-2-valves": "valve",
  "centrifugal-pump": "pump",
  "pressure-indicator": "instrument",
  "motor": "motor"
};
function roleFromShapeType(type) {
  if (type === "line")
    return "pipe";
  return "junction";
}
function defaultParams(role) {
  const base = { role };
  switch (role) {
    case "source":
      base.sourcePressure = 100;
      base.sourceTemperature = 500;
      base.sourceFlowRate = 1e4;
      break;
    case "valve":
      base.valvePosition = "open";
      base.throttlePercent = 50;
      break;
    case "pump":
      base.pumpRunning = true;
      base.pumpDeltaP = 50;
      break;
    case "pipe":
      base.pipeFrictionDrop = 0.5;
      break;
  }
  return base;
}
function defaultNodeState(shapeId, role) {
  return {
    shapeId,
    role,
    params: defaultParams(role),
    pressure: 0,
    temperature: 0,
    flowRate: 0,
    isFlowing: false
  };
}

// src/app/features/diagram-builder/simulation/services/simulation-graph.service.ts
var SimulationGraphService = class _SimulationGraphService {
  buildGraph(shapes, connections) {
    const graph = /* @__PURE__ */ new Map();
    for (const shape of shapes) {
      const role = this.determineRole(shape);
      graph.set(shape.id, {
        shapeId: shape.id,
        role,
        params: defaultParams(role),
        upstreamEdges: [],
        downstreamEdges: []
      });
    }
    for (const conn of connections) {
      const sourceNode = graph.get(conn.sourceShapeId);
      const targetNode = graph.get(conn.targetShapeId);
      if (sourceNode)
        sourceNode.downstreamEdges.push(conn.id);
      if (targetNode)
        targetNode.upstreamEdges.push(conn.id);
    }
    return graph;
  }
  determineRole(shape) {
    if (shape.type === "symbol") {
      const sym = shape;
      return SYMBOL_ROLE_MAP[sym.symbolId] ?? "junction";
    }
    return roleFromShapeType(shape.type);
  }
  /**
   * Topological sort via BFS from source nodes.
   * Returns ordered list of shapeIds for forward propagation.
   */
  topologicalSort(graph, connections) {
    const connMap = /* @__PURE__ */ new Map();
    for (const c of connections)
      connMap.set(c.id, c);
    const sources = [...graph.values()].filter((n) => n.role === "source").map((n) => n.shapeId);
    const queue = [...sources];
    const visited = /* @__PURE__ */ new Set();
    const order = [];
    while (queue.length > 0) {
      const id = queue.shift();
      if (visited.has(id))
        continue;
      const node = graph.get(id);
      const allUpstreamReady = node.upstreamEdges.every((edgeId) => {
        const conn = connMap.get(edgeId);
        return !conn || visited.has(conn.sourceShapeId);
      });
      if (!allUpstreamReady && !sources.includes(id)) {
        queue.push(id);
        continue;
      }
      visited.add(id);
      order.push(id);
      for (const edgeId of node.downstreamEdges) {
        const conn = connMap.get(edgeId);
        if (conn && !visited.has(conn.targetShapeId)) {
          queue.push(conn.targetShapeId);
        }
      }
    }
    for (const id of graph.keys()) {
      if (!visited.has(id))
        order.push(id);
    }
    return order;
  }
  static \u0275fac = function SimulationGraphService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _SimulationGraphService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _SimulationGraphService, factory: _SimulationGraphService.\u0275fac });
};

// src/app/features/diagram-builder/simulation/services/simulation-engine.service.ts
var MAX_ITERATIONS = 50;
var PRESSURE_EPSILON = 0.01;
var FLOW_EPSILON = 0.1;
var SimulationEngineService = class _SimulationEngineService {
  graphService = inject(SimulationGraphService);
  solve(graph, connections, currentStates) {
    const connMap = /* @__PURE__ */ new Map();
    for (const c of connections)
      connMap.set(c.id, c);
    const order = this.graphService.topologicalSort(graph, connections);
    for (const node of graph.values()) {
      if (!currentStates.has(node.shapeId)) {
        currentStates.set(node.shapeId, defaultNodeState(node.shapeId, node.role));
      }
    }
    for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
      const prevStates = /* @__PURE__ */ new Map();
      for (const [id, s] of currentStates) {
        prevStates.set(id, __spreadValues({}, s));
      }
      for (const shapeId of order) {
        const node = graph.get(shapeId);
        if (!node)
          continue;
        const state = currentStates.get(shapeId);
        const upstreamStates = [];
        for (const edgeId of node.upstreamEdges) {
          const conn = connMap.get(edgeId);
          if (conn) {
            const us = currentStates.get(conn.sourceShapeId);
            if (us)
              upstreamStates.push(us);
          }
        }
        const computed2 = this.computeNode(node, state.params, upstreamStates);
        currentStates.set(shapeId, __spreadProps(__spreadValues({}, state), {
          pressure: computed2.pressure,
          temperature: computed2.temperature,
          flowRate: computed2.flowRate,
          isFlowing: computed2.flowRate > FLOW_EPSILON
        }));
      }
      let maxDelta = 0;
      for (const [id, state] of currentStates) {
        const prev = prevStates.get(id);
        if (prev) {
          maxDelta = Math.max(maxDelta, Math.abs(state.pressure - prev.pressure), Math.abs(state.flowRate - prev.flowRate));
        }
      }
      if (maxDelta < PRESSURE_EPSILON)
        break;
    }
    const edges = /* @__PURE__ */ new Map();
    for (const conn of connections) {
      const sourceState = currentStates.get(conn.sourceShapeId);
      const sourceNode = graph.get(conn.sourceShapeId);
      if (!sourceState || !sourceNode) {
        edges.set(conn.id, {
          connectionId: conn.id,
          flowRate: 0,
          pressure: 0,
          temperature: 0,
          isFlowing: false
        });
        continue;
      }
      const numDown = Math.max(1, sourceNode.downstreamEdges.length);
      const edgeFlow = sourceState.flowRate / numDown;
      edges.set(conn.id, {
        connectionId: conn.id,
        flowRate: edgeFlow,
        pressure: sourceState.pressure,
        temperature: sourceState.temperature,
        isFlowing: edgeFlow > FLOW_EPSILON
      });
    }
    return { nodes: currentStates, edges };
  }
  computeNode(node, params, upstreams) {
    const totalFlow = upstreams.reduce((s, u) => s + u.flowRate, 0);
    const avgPressure = upstreams.length ? upstreams.reduce((s, u) => s + u.pressure, 0) / upstreams.length : 0;
    const avgTemp = this.weightedAvgTemp(upstreams);
    switch (node.role) {
      case "source":
        return {
          pressure: params.sourcePressure ?? 100,
          temperature: params.sourceTemperature ?? 500,
          flowRate: params.sourceFlowRate ?? 1e4
        };
      case "sink":
        return {
          pressure: 0,
          temperature: avgTemp,
          flowRate: totalFlow
        };
      case "valve":
        if (params.valvePosition === "closed") {
          return { pressure: avgPressure, temperature: avgTemp, flowRate: 0 };
        }
        if (params.valvePosition === "throttled") {
          const factor = (params.throttlePercent ?? 50) / 100;
          return {
            pressure: avgPressure * factor,
            temperature: avgTemp,
            flowRate: totalFlow * factor
          };
        }
        return { pressure: avgPressure, temperature: avgTemp, flowRate: totalFlow };
      case "pump":
        if (!params.pumpRunning) {
          return { pressure: avgPressure, temperature: avgTemp, flowRate: 0 };
        }
        return {
          pressure: avgPressure + (params.pumpDeltaP ?? 50),
          temperature: avgTemp,
          flowRate: totalFlow
        };
      case "pipe":
        return {
          pressure: Math.max(0, avgPressure - (params.pipeFrictionDrop ?? 0.5)),
          temperature: avgTemp,
          flowRate: totalFlow
        };
      case "instrument":
      case "motor":
      case "junction":
      default:
        return { pressure: avgPressure, temperature: avgTemp, flowRate: totalFlow };
    }
  }
  weightedAvgTemp(upstreams) {
    const totalFlow = upstreams.reduce((s, u) => s + u.flowRate, 0);
    if (totalFlow <= 0)
      return upstreams.length ? upstreams[0].temperature : 0;
    return upstreams.reduce((s, u) => s + u.temperature * u.flowRate, 0) / totalFlow;
  }
  static \u0275fac = function SimulationEngineService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _SimulationEngineService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _SimulationEngineService, factory: _SimulationEngineService.\u0275fac });
};

// src/app/features/diagram-builder/simulation/services/simulation-state.service.ts
var SimulationStateService = class _SimulationStateService {
  graphService = inject(SimulationGraphService);
  engine = inject(SimulationEngineService);
  isSimulating = signal(false);
  graph = /* @__PURE__ */ new Map();
  connections = [];
  nodeSubjects = /* @__PURE__ */ new Map();
  edgeSubjects = /* @__PURE__ */ new Map();
  _nodeStates = /* @__PURE__ */ new Map();
  _edgeStates = /* @__PURE__ */ new Map();
  activate(shapes, connections) {
    this.connections = connections;
    this.graph = this.graphService.buildGraph(shapes, connections);
    this._nodeStates.clear();
    this.nodeSubjects.clear();
    for (const node of this.graph.values()) {
      const state = defaultNodeState(node.shapeId, node.role);
      state.params = __spreadValues({}, node.params);
      this._nodeStates.set(node.shapeId, state);
      this.nodeSubjects.set(node.shapeId, new BehaviorSubject(state));
    }
    this._edgeStates.clear();
    this.edgeSubjects.clear();
    for (const conn of connections) {
      const edge = {
        connectionId: conn.id,
        flowRate: 0,
        pressure: 0,
        temperature: 0,
        isFlowing: false
      };
      this._edgeStates.set(conn.id, edge);
      this.edgeSubjects.set(conn.id, new BehaviorSubject(edge));
    }
    this.isSimulating.set(true);
    this.runSolver();
  }
  deactivate() {
    this.isSimulating.set(false);
    for (const sub of this.nodeSubjects.values())
      sub.complete();
    for (const sub of this.edgeSubjects.values())
      sub.complete();
    this.nodeSubjects.clear();
    this.edgeSubjects.clear();
    this._nodeStates.clear();
    this._edgeStates.clear();
    this.graph.clear();
  }
  updateNodeParams(shapeId, updates) {
    const state = this._nodeStates.get(shapeId);
    if (!state)
      return;
    state.params = __spreadValues(__spreadValues({}, state.params), updates);
    if (updates.role)
      state.role = updates.role;
    const graphNode = this.graph.get(shapeId);
    if (graphNode && updates.role)
      graphNode.role = updates.role;
    this.runSolver();
  }
  getNodeState$(shapeId) {
    return this.nodeSubjects.get(shapeId)?.asObservable();
  }
  getNodeState(shapeId) {
    return this._nodeStates.get(shapeId);
  }
  getEdgeState(connectionId) {
    return this._edgeStates.get(connectionId);
  }
  getAllNodeStates() {
    return [...this._nodeStates.values()];
  }
  getAllEdgeStates() {
    return [...this._edgeStates.values()];
  }
  runSolver() {
    const result = this.engine.solve(this.graph, this.connections, this._nodeStates);
    for (const [id, state] of result.nodes) {
      this._nodeStates.set(id, state);
      this.nodeSubjects.get(id)?.next(state);
    }
    for (const [id, edge] of result.edges) {
      this._edgeStates.set(id, edge);
      this.edgeSubjects.get(id)?.next(edge);
    }
  }
  static \u0275fac = function SimulationStateService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _SimulationStateService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _SimulationStateService, factory: _SimulationStateService.\u0275fac });
};

// src/app/features/diagram-builder/simulation/services/simulation-render.service.ts
var SimulationRenderService = class _SimulationRenderService {
  renderService = inject(DiagramRenderService);
  animationOffset = 0;
  animFrameId = 0;
  drawOverlays(ctx, shapes, connections, nodeStates, edgeStates, scale) {
    const nodeMap = new Map(nodeStates.map((n) => [n.shapeId, n]));
    const edgeMap = new Map(edgeStates.map((e) => [e.connectionId, e]));
    const shapeMap = new Map(shapes.map((s) => [s.id, s]));
    for (const conn of connections) {
      const edge = edgeMap.get(conn.id);
      if (edge) {
        this.drawConnectionOverlay(ctx, conn, edge, shapeMap, scale);
      }
    }
    for (const shape of shapes) {
      const state = nodeMap.get(shape.id);
      if (state) {
        this.drawNodeBadge(ctx, shape, state, scale);
        if (state.role === "valve")
          this.drawValveIndicator(ctx, shape, state, scale);
        if (state.role === "pump")
          this.drawPumpIndicator(ctx, shape, state, scale);
        if (state.role === "source")
          this.drawSourceIndicator(ctx, shape, scale);
        if (state.role === "sink")
          this.drawSinkIndicator(ctx, shape, scale);
      }
    }
  }
  drawConnectionOverlay(ctx, conn, edge, shapeMap, scale) {
    const source = shapeMap.get(conn.sourceShapeId);
    const target = shapeMap.get(conn.targetShapeId);
    if (!source || !target)
      return;
    const sp = this.renderService.getAnchorPoint(source, conn.sourceAnchor);
    const tp = this.renderService.getAnchorPoint(target, conn.targetAnchor);
    ctx.save();
    ctx.lineWidth = 4 / scale;
    if (edge.isFlowing) {
      const intensity = Math.min(1, edge.flowRate / 15e3);
      const r = Math.round(13 + (129 - 13) * (1 - intensity));
      const g = Math.round(71 + (212 - 71) * (1 - intensity));
      const b = Math.round(161 + (250 - 161) * (1 - intensity));
      ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.setLineDash([8 / scale, 12 / scale]);
      ctx.lineDashOffset = -this.animationOffset / scale;
    } else {
      ctx.strokeStyle = "#555";
      ctx.setLineDash([4 / scale, 8 / scale]);
    }
    ctx.beginPath();
    if (conn.waypoints && conn.waypoints.length > 0) {
      ctx.moveTo(sp.x, sp.y);
      for (const wp of conn.waypoints)
        ctx.lineTo(wp.x, wp.y);
      ctx.lineTo(tp.x, tp.y);
    } else {
      ctx.moveTo(sp.x, sp.y);
      if (conn.sourceAnchor === "left" || conn.sourceAnchor === "right") {
        ctx.lineTo(tp.x, sp.y);
        ctx.lineTo(tp.x, tp.y);
      } else {
        ctx.lineTo(sp.x, tp.y);
        ctx.lineTo(tp.x, tp.y);
      }
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
  drawNodeBadge(ctx, shape, state, scale) {
    if (state.role === "pipe")
      return;
    const fontSize = 9 / scale;
    ctx.save();
    ctx.font = `${fontSize}px monospace`;
    const p = state.pressure.toFixed(0);
    const t = state.temperature.toFixed(0);
    const f = state.flowRate.toFixed(0);
    const text = `${p}psi ${t}\xB0F ${f}lb/h`;
    const metrics = ctx.measureText(text);
    const padding = 3 / scale;
    const badgeW = metrics.width + padding * 2;
    const badgeH = fontSize + padding * 2;
    const badgeX = shape.x + shape.width / 2 - badgeW / 2;
    const badgeY = shape.y + shape.height + 4 / scale;
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 2 / scale);
    ctx.fill();
    ctx.fillStyle = state.isFlowing ? "#81d4fa" : "#666";
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.fillText(text, badgeX + padding, badgeY + padding);
    ctx.restore();
  }
  drawValveIndicator(ctx, shape, state, scale) {
    const r = 5 / scale;
    const x = shape.x + r + 2 / scale;
    const y = shape.y + r + 2 / scale;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    switch (state.params.valvePosition) {
      case "open":
        ctx.fillStyle = "#4caf50";
        break;
      case "closed":
        ctx.fillStyle = "#f44336";
        break;
      case "throttled":
        ctx.fillStyle = "#ff9800";
        break;
      default:
        ctx.fillStyle = "#4caf50";
    }
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1 / scale;
    ctx.stroke();
    ctx.restore();
  }
  drawPumpIndicator(ctx, shape, state, scale) {
    const r = 5 / scale;
    const x = shape.x + r + 2 / scale;
    const y = shape.y + r + 2 / scale;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = state.params.pumpRunning ? "#4caf50" : "#666";
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1 / scale;
    ctx.stroke();
    ctx.restore();
  }
  drawSourceIndicator(ctx, shape, scale) {
    const r = 5 / scale;
    ctx.save();
    ctx.beginPath();
    ctx.arc(shape.x + r + 2 / scale, shape.y + r + 2 / scale, r, 0, Math.PI * 2);
    ctx.fillStyle = "#2196f3";
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1 / scale;
    ctx.stroke();
    ctx.restore();
  }
  drawSinkIndicator(ctx, shape, scale) {
    const r = 5 / scale;
    ctx.save();
    ctx.beginPath();
    ctx.arc(shape.x + r + 2 / scale, shape.y + r + 2 / scale, r, 0, Math.PI * 2);
    ctx.fillStyle = "#9c27b0";
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1 / scale;
    ctx.stroke();
    ctx.restore();
  }
  startAnimation(renderCallback) {
    this.stopAnimation();
    const animate = () => {
      this.animationOffset = (this.animationOffset + 0.8) % 40;
      renderCallback();
      this.animFrameId = requestAnimationFrame(animate);
    };
    this.animFrameId = requestAnimationFrame(animate);
  }
  stopAnimation() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = 0;
    }
  }
  static \u0275fac = function SimulationRenderService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _SimulationRenderService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _SimulationRenderService, factory: _SimulationRenderService.\u0275fac });
};

// src/app/features/diagram-builder/simulation/components/simulation-toolbar.component.ts
function SimulationToolbarComponent_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 2);
    \u0275\u0275text(1, "SIMULATION ACTIVE");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "button", 3);
    \u0275\u0275listener("click", function SimulationToolbarComponent_Conditional_3_Template_button_click_2_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onReset.emit());
    });
    \u0275\u0275text(3, "Reset");
    \u0275\u0275elementEnd();
  }
}
var SimulationToolbarComponent = class _SimulationToolbarComponent {
  simState = inject(SimulationStateService);
  onToggle = output();
  onReset = output();
  static \u0275fac = function SimulationToolbarComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _SimulationToolbarComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _SimulationToolbarComponent, selectors: [["app-simulation-toolbar"]], outputs: { onToggle: "onToggle", onReset: "onReset" }, decls: 4, vars: 4, consts: [[1, "sim-toolbar"], [1, "sim-toggle", 3, "click"], [1, "sim-badge"], [1, "sim-btn", 3, "click"]], template: function SimulationToolbarComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "button", 1);
      \u0275\u0275listener("click", function SimulationToolbarComponent_Template_button_click_1_listener() {
        return ctx.onToggle.emit();
      });
      \u0275\u0275text(2);
      \u0275\u0275elementEnd();
      \u0275\u0275template(3, SimulationToolbarComponent_Conditional_3_Template, 4, 0);
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      \u0275\u0275advance();
      \u0275\u0275classProp("active", ctx.simState.isSimulating());
      \u0275\u0275advance();
      \u0275\u0275textInterpolate1(" ", ctx.simState.isSimulating() ? "\u23F9 Stop" : "\u25B6 Simulate", " ");
      \u0275\u0275advance();
      \u0275\u0275conditional(ctx.simState.isSimulating() ? 3 : -1);
    }
  }, dependencies: [CommonModule], styles: ["\n\n.sim-toolbar[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n}\n.sim-toggle[_ngcontent-%COMP%] {\n  padding: 4px 12px;\n  border: 1px solid #444;\n  border-radius: 4px;\n  background: #2a2a2a;\n  color: #ccc;\n  cursor: pointer;\n  font-size: 12px;\n  transition: all 0.15s;\n}\n.sim-toggle[_ngcontent-%COMP%]:hover {\n  background: #3a3a3a;\n}\n.sim-toggle.active[_ngcontent-%COMP%] {\n  background: #b71c1c;\n  border-color: #f44336;\n  color: #fff;\n}\n.sim-badge[_ngcontent-%COMP%] {\n  font-size: 10px;\n  color: #f44336;\n  font-weight: 700;\n  letter-spacing: 1px;\n  animation: _ngcontent-%COMP%_pulse 1.5s ease-in-out infinite;\n}\n@keyframes _ngcontent-%COMP%_pulse {\n  50% {\n    opacity: 0.5;\n  }\n}\n.sim-btn[_ngcontent-%COMP%] {\n  padding: 4px 8px;\n  border: 1px solid #444;\n  border-radius: 4px;\n  background: #2a2a2a;\n  color: #ccc;\n  cursor: pointer;\n  font-size: 11px;\n}\n.sim-btn[_ngcontent-%COMP%]:hover {\n  background: #3a3a3a;\n}\n/*# sourceMappingURL=simulation-toolbar.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(SimulationToolbarComponent, { className: "SimulationToolbarComponent", filePath: "src/app/features/diagram-builder/simulation/components/simulation-toolbar.component.ts", lineNumber: 64 });
})();

// src/app/features/diagram-builder/simulation/components/simulation-inspector.component.ts
function SimulationInspectorComponent_Conditional_3_For_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "option", 4);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const r_r3 = ctx.$implicit;
    \u0275\u0275property("value", r_r3);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(r_r3);
  }
}
function SimulationInspectorComponent_Conditional_3_Conditional_25_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 9)(1, "h4");
    \u0275\u0275text(2, "Source Parameters");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "label");
    \u0275\u0275text(4, "Pressure (psi) ");
    \u0275\u0275elementStart(5, "input", 10);
    \u0275\u0275listener("ngModelChange", function SimulationInspectorComponent_Conditional_3_Conditional_25_Template_input_ngModelChange_5_listener($event) {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.updateParam("sourcePressure", $event));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(6, "label");
    \u0275\u0275text(7, "Temperature (\xB0F) ");
    \u0275\u0275elementStart(8, "input", 10);
    \u0275\u0275listener("ngModelChange", function SimulationInspectorComponent_Conditional_3_Conditional_25_Template_input_ngModelChange_8_listener($event) {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.updateParam("sourceTemperature", $event));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(9, "label");
    \u0275\u0275text(10, "Flow Rate (lb/hr) ");
    \u0275\u0275elementStart(11, "input", 10);
    \u0275\u0275listener("ngModelChange", function SimulationInspectorComponent_Conditional_3_Conditional_25_Template_input_ngModelChange_11_listener($event) {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.updateParam("sourceFlowRate", $event));
    });
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const state_r5 = \u0275\u0275nextContext();
    \u0275\u0275advance(5);
    \u0275\u0275property("ngModel", state_r5.params.sourcePressure);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", state_r5.params.sourceTemperature);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", state_r5.params.sourceFlowRate);
  }
}
function SimulationInspectorComponent_Conditional_3_Conditional_26_Conditional_10_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "label");
    \u0275\u0275text(1);
    \u0275\u0275elementStart(2, "input", 13);
    \u0275\u0275listener("ngModelChange", function SimulationInspectorComponent_Conditional_3_Conditional_26_Conditional_10_Template_input_ngModelChange_2_listener($event) {
      \u0275\u0275restoreView(_r7);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.updateParam("throttlePercent", $event));
    });
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    let tmp_4_0;
    let tmp_5_0;
    const state_r5 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("Throttle: ", (tmp_4_0 = state_r5.params.throttlePercent) !== null && tmp_4_0 !== void 0 ? tmp_4_0 : 50, "% ");
    \u0275\u0275advance();
    \u0275\u0275property("ngModel", (tmp_5_0 = state_r5.params.throttlePercent) !== null && tmp_5_0 !== void 0 ? tmp_5_0 : 50);
  }
}
function SimulationInspectorComponent_Conditional_3_Conditional_26_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 9)(1, "h4");
    \u0275\u0275text(2, "Valve Position");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "div", 11)(4, "button", 12);
    \u0275\u0275listener("click", function SimulationInspectorComponent_Conditional_3_Conditional_26_Template_button_click_4_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.updateParam("valvePosition", "open"));
    });
    \u0275\u0275text(5, "Open");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "button", 12);
    \u0275\u0275listener("click", function SimulationInspectorComponent_Conditional_3_Conditional_26_Template_button_click_6_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.updateParam("valvePosition", "throttled"));
    });
    \u0275\u0275text(7, "Throttle");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "button", 12);
    \u0275\u0275listener("click", function SimulationInspectorComponent_Conditional_3_Conditional_26_Template_button_click_8_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.updateParam("valvePosition", "closed"));
    });
    \u0275\u0275text(9, "Closed");
    \u0275\u0275elementEnd()();
    \u0275\u0275template(10, SimulationInspectorComponent_Conditional_3_Conditional_26_Conditional_10_Template, 3, 2, "label");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const state_r5 = \u0275\u0275nextContext();
    \u0275\u0275advance(4);
    \u0275\u0275classProp("active", state_r5.params.valvePosition === "open")("green", state_r5.params.valvePosition === "open");
    \u0275\u0275advance(2);
    \u0275\u0275classProp("active", state_r5.params.valvePosition === "throttled")("amber", state_r5.params.valvePosition === "throttled");
    \u0275\u0275advance(2);
    \u0275\u0275classProp("active", state_r5.params.valvePosition === "closed")("red", state_r5.params.valvePosition === "closed");
    \u0275\u0275advance(2);
    \u0275\u0275conditional(state_r5.params.valvePosition === "throttled" ? 10 : -1);
  }
}
function SimulationInspectorComponent_Conditional_3_Conditional_27_Template(rf, ctx) {
  if (rf & 1) {
    const _r8 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 9)(1, "h4");
    \u0275\u0275text(2, "Pump");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "button", 14);
    \u0275\u0275listener("click", function SimulationInspectorComponent_Conditional_3_Conditional_27_Template_button_click_3_listener() {
      \u0275\u0275restoreView(_r8);
      const state_r5 = \u0275\u0275nextContext();
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.updateParam("pumpRunning", !state_r5.params.pumpRunning));
    });
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "label");
    \u0275\u0275text(6, "Delta-P (psi) ");
    \u0275\u0275elementStart(7, "input", 10);
    \u0275\u0275listener("ngModelChange", function SimulationInspectorComponent_Conditional_3_Conditional_27_Template_input_ngModelChange_7_listener($event) {
      \u0275\u0275restoreView(_r8);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.updateParam("pumpDeltaP", $event));
    });
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const state_r5 = \u0275\u0275nextContext();
    \u0275\u0275advance(3);
    \u0275\u0275classProp("running", state_r5.params.pumpRunning);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", state_r5.params.pumpRunning ? "\u23F9 Stop Pump" : "\u25B6 Start Pump", " ");
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", state_r5.params.pumpDeltaP);
  }
}
function SimulationInspectorComponent_Conditional_3_Conditional_28_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 9)(1, "h4");
    \u0275\u0275text(2, "Pipe");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "label");
    \u0275\u0275text(4, "Friction Drop (psi) ");
    \u0275\u0275elementStart(5, "input", 15);
    \u0275\u0275listener("ngModelChange", function SimulationInspectorComponent_Conditional_3_Conditional_28_Template_input_ngModelChange_5_listener($event) {
      \u0275\u0275restoreView(_r9);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.updateParam("pipeFrictionDrop", $event));
    });
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const state_r5 = \u0275\u0275nextContext();
    \u0275\u0275advance(5);
    \u0275\u0275property("ngModel", state_r5.params.pipeFrictionDrop);
  }
}
function SimulationInspectorComponent_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 2)(1, "label");
    \u0275\u0275text(2, "Role ");
    \u0275\u0275elementStart(3, "select", 3);
    \u0275\u0275listener("ngModelChange", function SimulationInspectorComponent_Conditional_3_Template_select_ngModelChange_3_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.changeRole($event));
    });
    \u0275\u0275repeaterCreate(4, SimulationInspectorComponent_Conditional_3_For_5_Template, 2, 2, "option", 4, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(6, "div", 5)(7, "div", 6)(8, "span", 7);
    \u0275\u0275text(9, "Pressure");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "span", 8);
    \u0275\u0275text(11);
    \u0275\u0275pipe(12, "number");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(13, "div", 6)(14, "span", 7);
    \u0275\u0275text(15, "Temperature");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(16, "span", 8);
    \u0275\u0275text(17);
    \u0275\u0275pipe(18, "number");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(19, "div", 6)(20, "span", 7);
    \u0275\u0275text(21, "Flow Rate");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(22, "span", 8);
    \u0275\u0275text(23);
    \u0275\u0275pipe(24, "number");
    \u0275\u0275elementEnd()()();
    \u0275\u0275template(25, SimulationInspectorComponent_Conditional_3_Conditional_25_Template, 12, 3, "div", 9)(26, SimulationInspectorComponent_Conditional_3_Conditional_26_Template, 11, 13, "div", 9)(27, SimulationInspectorComponent_Conditional_3_Conditional_27_Template, 8, 4, "div", 9)(28, SimulationInspectorComponent_Conditional_3_Conditional_28_Template, 6, 1, "div", 9);
  }
  if (rf & 2) {
    const state_r5 = ctx;
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", state_r5.role);
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r1.roles);
    \u0275\u0275advance(6);
    \u0275\u0275classProp("flowing", state_r5.isFlowing);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind2(12, 14, state_r5.pressure, "1.1-1"), " psi ");
    \u0275\u0275advance(5);
    \u0275\u0275classProp("flowing", state_r5.isFlowing);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind2(18, 17, state_r5.temperature, "1.0-0"), " \xB0F ");
    \u0275\u0275advance(5);
    \u0275\u0275classProp("flowing", state_r5.isFlowing);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind2(24, 20, state_r5.flowRate, "1.0-0"), " lb/hr ");
    \u0275\u0275advance(2);
    \u0275\u0275conditional(state_r5.role === "source" ? 25 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(state_r5.role === "valve" ? 26 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(state_r5.role === "pump" ? 27 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(state_r5.role === "pipe" ? 28 : -1);
  }
}
function SimulationInspectorComponent_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 1);
    \u0275\u0275text(1, "Select a shape to inspect simulation state");
    \u0275\u0275elementEnd();
  }
}
var SimulationInspectorComponent = class _SimulationInspectorComponent {
  simState = inject(SimulationStateService);
  shapeManager = inject(DiagramShapeManagerService);
  nodeState = signal(null);
  roles = ["source", "sink", "valve", "pump", "instrument", "motor", "junction", "pipe"];
  constructor() {
    effect(() => {
      const shape = this.shapeManager.singleSelectedShape();
      if (shape) {
        this.nodeState.set(this.simState.getNodeState(shape.id) ?? null);
      } else {
        this.nodeState.set(null);
      }
    });
    effect(() => {
      const shape = this.shapeManager.singleSelectedShape();
      if (!shape)
        return;
      const obs = this.simState.getNodeState$(shape.id);
      obs?.subscribe((state) => this.nodeState.set(state));
    });
  }
  updateParam(key, value) {
    const state = this.nodeState();
    if (!state)
      return;
    this.simState.updateNodeParams(state.shapeId, { [key]: value });
  }
  changeRole(role) {
    const state = this.nodeState();
    if (!state)
      return;
    this.simState.updateNodeParams(state.shapeId, { role });
  }
  static \u0275fac = function SimulationInspectorComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _SimulationInspectorComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _SimulationInspectorComponent, selectors: [["app-simulation-inspector"]], decls: 5, vars: 1, consts: [[1, "sim-inspector"], [1, "info"], [1, "role-section"], [3, "ngModelChange", "ngModel"], [3, "value"], [1, "readout"], [1, "readout-row"], [1, "readout-label"], [1, "readout-value"], [1, "param-section"], ["type", "number", 3, "ngModelChange", "ngModel"], [1, "valve-buttons"], [3, "click"], ["type", "range", "min", "0", "max", "100", "step", "5", 3, "ngModelChange", "ngModel"], [1, "pump-toggle", 3, "click"], ["type", "number", "step", "0.1", 3, "ngModelChange", "ngModel"]], template: function SimulationInspectorComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "h3");
      \u0275\u0275text(2, "Simulation");
      \u0275\u0275elementEnd();
      \u0275\u0275template(3, SimulationInspectorComponent_Conditional_3_Template, 29, 23)(4, SimulationInspectorComponent_Conditional_4_Template, 2, 0, "p", 1);
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      let tmp_0_0;
      \u0275\u0275advance(3);
      \u0275\u0275conditional((tmp_0_0 = ctx.nodeState()) ? 3 : 4, tmp_0_0);
    }
  }, dependencies: [CommonModule, DecimalPipe, FormsModule, NgSelectOption, \u0275NgSelectMultipleOption, DefaultValueAccessor, NumberValueAccessor, RangeValueAccessor, SelectControlValueAccessor, NgControlStatus, NgModel], styles: ["\n\n.sim-inspector[_ngcontent-%COMP%] {\n  width: 240px;\n  background: #1a1a1a;\n  border-left: 1px solid #333;\n  padding: 12px;\n  overflow-y: auto;\n}\nh3[_ngcontent-%COMP%] {\n  margin: 0 0 12px;\n  font-size: 14px;\n  color: #f44336;\n}\nh4[_ngcontent-%COMP%] {\n  margin: 8px 0 6px;\n  font-size: 12px;\n  color: #aaa;\n  text-transform: uppercase;\n}\n.role-section[_ngcontent-%COMP%] {\n  margin-bottom: 12px;\n}\nlabel[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  font-size: 12px;\n  color: #999;\n  margin-bottom: 6px;\n  gap: 8px;\n}\nselect[_ngcontent-%COMP%], \ninput[type=number][_ngcontent-%COMP%] {\n  width: 100px;\n  padding: 4px 6px;\n  background: #2a2a2a;\n  border: 1px solid #444;\n  color: #ddd;\n  border-radius: 3px;\n  font-size: 12px;\n}\ninput[type=range][_ngcontent-%COMP%] {\n  width: 100px;\n}\n.readout[_ngcontent-%COMP%] {\n  background: #111;\n  border: 1px solid #333;\n  border-radius: 4px;\n  padding: 8px;\n  margin-bottom: 12px;\n}\n.readout-row[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  font-size: 12px;\n  margin-bottom: 4px;\n}\n.readout-label[_ngcontent-%COMP%] {\n  color: #888;\n}\n.readout-value[_ngcontent-%COMP%] {\n  color: #666;\n  font-family: monospace;\n}\n.readout-value.flowing[_ngcontent-%COMP%] {\n  color: #81d4fa;\n}\n.param-section[_ngcontent-%COMP%] {\n  margin-bottom: 12px;\n}\n.valve-buttons[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 4px;\n  margin-bottom: 8px;\n}\n.valve-buttons[_ngcontent-%COMP%]   button[_ngcontent-%COMP%] {\n  flex: 1;\n  padding: 6px 4px;\n  border: 1px solid #444;\n  border-radius: 3px;\n  background: #2a2a2a;\n  color: #ccc;\n  cursor: pointer;\n  font-size: 11px;\n}\n.valve-buttons[_ngcontent-%COMP%]   button.active.green[_ngcontent-%COMP%] {\n  background: #2e7d32;\n  border-color: #4caf50;\n  color: #fff;\n}\n.valve-buttons[_ngcontent-%COMP%]   button.active.amber[_ngcontent-%COMP%] {\n  background: #e65100;\n  border-color: #ff9800;\n  color: #fff;\n}\n.valve-buttons[_ngcontent-%COMP%]   button.active.red[_ngcontent-%COMP%] {\n  background: #c62828;\n  border-color: #f44336;\n  color: #fff;\n}\n.pump-toggle[_ngcontent-%COMP%] {\n  width: 100%;\n  padding: 8px;\n  border: 1px solid #444;\n  border-radius: 4px;\n  background: #2a2a2a;\n  color: #ccc;\n  cursor: pointer;\n  font-size: 12px;\n  margin-bottom: 8px;\n}\n.pump-toggle.running[_ngcontent-%COMP%] {\n  background: #2e7d32;\n  border-color: #4caf50;\n  color: #fff;\n}\n.info[_ngcontent-%COMP%] {\n  font-size: 12px;\n  color: #666;\n}\n/*# sourceMappingURL=simulation-inspector.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(SimulationInspectorComponent, { className: "SimulationInspectorComponent", filePath: "src/app/features/diagram-builder/simulation/components/simulation-inspector.component.ts", lineNumber: 205 });
})();

// src/app/features/diagram-builder/components/diagram-canvas/diagram-canvas.component.ts
var _c0 = ["canvasContainer"];
var _c1 = ["gridCanvas"];
var _c2 = ["shapeCanvas"];
var _c3 = ["tempCanvas"];
function DiagramCanvasComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 5)(1, "app-diagram-toolbar", 15);
    \u0275\u0275listener("onAlign", function DiagramCanvasComponent_Conditional_1_Template_app_diagram_toolbar_onAlign_1_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onAlign($event));
    })("onDistribute", function DiagramCanvasComponent_Conditional_1_Template_app_diagram_toolbar_onDistribute_1_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onDistribute($event));
    })("onDelete", function DiagramCanvasComponent_Conditional_1_Template_app_diagram_toolbar_onDelete_1_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.deleteSelected());
    })("onGroup", function DiagramCanvasComponent_Conditional_1_Template_app_diagram_toolbar_onGroup_1_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.groupSelected());
    })("onUngroup", function DiagramCanvasComponent_Conditional_1_Template_app_diagram_toolbar_onUngroup_1_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.ungroupSelected());
    })("onZoomIn", function DiagramCanvasComponent_Conditional_1_Template_app_diagram_toolbar_onZoomIn_1_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.zoomIn());
    })("onZoomOut", function DiagramCanvasComponent_Conditional_1_Template_app_diagram_toolbar_onZoomOut_1_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.zoomOut());
    })("onZoomFit", function DiagramCanvasComponent_Conditional_1_Template_app_diagram_toolbar_onZoomFit_1_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.zoomFit());
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "app-simulation-toolbar", 16);
    \u0275\u0275listener("onToggle", function DiagramCanvasComponent_Conditional_1_Template_app_simulation_toolbar_onToggle_2_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.toggleSimulation());
    })("onReset", function DiagramCanvasComponent_Conditional_1_Template_app_simulation_toolbar_onReset_2_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.resetSimulation());
    });
    \u0275\u0275elementEnd()();
  }
}
function DiagramCanvasComponent_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 7)(1, "app-symbol-palette", 17);
    \u0275\u0275listener("symbolSelected", function DiagramCanvasComponent_Conditional_3_Template_app_symbol_palette_symbolSelected_1_listener($event) {
      \u0275\u0275restoreView(_r4);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onSymbolSelected($event));
    });
    \u0275\u0275elementEnd()();
  }
}
function DiagramCanvasComponent_Conditional_12_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-simulation-inspector");
  }
}
function DiagramCanvasComponent_Conditional_13_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-diagram-properties");
  }
}
function DiagramCanvasComponent_Conditional_19_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 13);
    \u0275\u0275text(1, "\u25CF Unsaved");
    \u0275\u0275elementEnd();
  }
}
function DiagramCanvasComponent_Conditional_20_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 14);
    \u0275\u0275text(1, "Saving...");
    \u0275\u0275elementEnd();
  }
}
var DiagramCanvasComponent = class _DiagramCanvasComponent {
  canvasContainerRef;
  gridCanvasRef;
  shapeCanvasRef;
  tempCanvasRef;
  shapeManager = inject(DiagramShapeManagerService);
  renderService = inject(DiagramRenderService);
  drawingService = inject(DiagramDrawingService);
  gridService = inject(DiagramGridService);
  connectionService = inject(DiagramConnectionService);
  alignmentService = inject(DiagramAlignmentService);
  stateService = inject(DiagramStateService);
  zoomPanService = inject(ZoomPanService);
  pidSymbols = inject(PIDSymbolsService);
  simState = inject(SimulationStateService);
  simRender = inject(SimulationRenderService);
  route = inject(ActivatedRoute);
  router = inject(Router);
  config = DIAGRAM_BUILDER_CONFIG;
  transform = { scale: 1, pointX: 0, pointY: 0 };
  canvasWidth = 1920;
  canvasHeight = 1080;
  hoveredShapeId = null;
  hoveredAnchor = null;
  isDragging = false;
  isPanning = false;
  isResizing = false;
  isRotating = false;
  isMarqueeSelecting = false;
  resizeHandle = null;
  rotateStartAngle = 0;
  rotateStartRotation = 0;
  dragStartShapes = /* @__PURE__ */ new Map();
  dragStartCanvas = { x: 0, y: 0 };
  panStart = { x: 0, y: 0 };
  resizeStartShape = null;
  resizeStartCanvas = { x: 0, y: 0 };
  marqueeStart = { x: 0, y: 0 };
  marqueeEnd = { x: 0, y: 0 };
  animFrameId = 0;
  Math = Math;
  constructor() {
    this.stateService.setShapeManager(this.shapeManager);
    effect(() => {
      this.shapeManager.shapes();
      this.shapeManager.connections();
      this.shapeManager.selectedShapeIds();
      this.gridService.gridVisible();
      this.gridService.gridSize();
      this.requestRender();
    });
    effect(() => {
      const diagram = this.stateService.currentDiagram();
      if (!diagram)
        return;
      const nextWidth = diagram.canvasWidth ?? 1920;
      const nextHeight = diagram.canvasHeight ?? 1080;
      const nextGridSize = diagram.gridSize ?? 20;
      const sizeChanged = nextWidth !== this.canvasWidth || nextHeight !== this.canvasHeight;
      this.canvasWidth = nextWidth;
      this.canvasHeight = nextHeight;
      this.gridService.setGridSize(nextGridSize);
      if (sizeChanged) {
        this.setupCanvases();
      } else {
        this.requestRender();
      }
    });
  }
  ngOnInit() {
    const mode = this.route.snapshot.data["mode"];
    this.config = mode === "renderer" ? DIAGRAM_RENDERER_CONFIG : DIAGRAM_BUILDER_CONFIG;
    const id = this.route.snapshot.paramMap.get("id");
    if (id) {
      this.stateService.loadDiagram(Number(id));
    } else {
      this.stateService.createNewDiagram();
    }
  }
  ngAfterViewInit() {
    this.setupCanvases();
    this.requestRender();
    const ro = new ResizeObserver(() => this.setupCanvases());
    ro.observe(this.canvasContainerRef.nativeElement);
  }
  ngOnDestroy() {
    if (this.animFrameId)
      cancelAnimationFrame(this.animFrameId);
    this.simRender.stopAnimation();
    if (this.simState.isSimulating())
      this.simState.deactivate();
  }
  setupCanvases() {
    const container = this.canvasContainerRef?.nativeElement;
    if (!container)
      return;
    const { clientWidth, clientHeight } = container;
    if (clientWidth === 0 || clientHeight === 0)
      return;
    const dpr = window.devicePixelRatio || 1;
    const canvases = [
      this.gridCanvasRef?.nativeElement,
      this.shapeCanvasRef?.nativeElement,
      this.tempCanvasRef?.nativeElement
    ].filter(Boolean);
    for (const canvas of canvases) {
      if (canvas) {
        canvas.width = clientWidth * dpr;
        canvas.height = clientHeight * dpr;
        canvas.style.width = `${clientWidth}px`;
        canvas.style.height = `${clientHeight}px`;
      }
    }
    this.requestRender();
  }
  requestRender() {
    if (this.animFrameId)
      return;
    this.animFrameId = requestAnimationFrame(() => {
      this.animFrameId = 0;
      this.render();
    });
  }
  render() {
    const dpr = window.devicePixelRatio || 1;
    const { scale, pointX, pointY } = this.transform;
    const applyTransform = (ctx) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * pointX, dpr * pointY);
    };
    const gridCtx = this.gridCanvasRef?.nativeElement?.getContext("2d");
    if (gridCtx) {
      applyTransform(gridCtx);
      this.gridService.drawGrid(gridCtx, this.canvasWidth, this.canvasHeight, scale);
      gridCtx.setTransform(1, 0, 0, 1, 0, 0);
    }
    const shapeCtx = this.shapeCanvasRef?.nativeElement?.getContext("2d");
    if (shapeCtx) {
      applyTransform(shapeCtx);
      this.renderService.drawAll(shapeCtx, this.shapeManager.shapes(), this.shapeManager.connections(), this.shapeManager.selectedShapeIds(), this.hoveredShapeId, scale);
      if (this.drawingService.activeTool() === "draw-connection") {
        for (const shape of this.shapeManager.shapes()) {
          this.renderService.drawAnchorPoints(shapeCtx, shape, this.hoveredAnchor);
        }
      }
      if (this.simState.isSimulating()) {
        this.simRender.drawOverlays(shapeCtx, this.shapeManager.shapes(), this.shapeManager.connections(), this.simState.getAllNodeStates(), this.simState.getAllEdgeStates(), scale);
      }
      shapeCtx.setTransform(1, 0, 0, 1, 0, 0);
    }
    const tempCtx = this.tempCanvasRef?.nativeElement?.getContext("2d");
    if (tempCtx) {
      applyTransform(tempCtx);
      if (this.drawingService.isDrawing()) {
        this.drawingService.drawPreview(tempCtx, this.canvasWidth, this.canvasHeight);
      }
      if (this.connectionService.isDrawingConnection()) {
        this.connectionService.drawPreview(tempCtx, this.canvasWidth, this.canvasHeight);
      }
      if (this.isMarqueeSelecting) {
        const x = Math.min(this.marqueeStart.x, this.marqueeEnd.x);
        const y = Math.min(this.marqueeStart.y, this.marqueeEnd.y);
        const w = Math.abs(this.marqueeEnd.x - this.marqueeStart.x);
        const h = Math.abs(this.marqueeEnd.y - this.marqueeStart.y);
        tempCtx.strokeStyle = "rgba(33, 150, 243, 0.8)";
        tempCtx.fillStyle = "rgba(33, 150, 243, 0.08)";
        tempCtx.lineWidth = 1 / scale;
        tempCtx.setLineDash([4 / scale, 4 / scale]);
        tempCtx.fillRect(x, y, w, h);
        tempCtx.strokeRect(x, y, w, h);
        tempCtx.setLineDash([]);
      }
      tempCtx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }
  // --- Mouse handlers ---
  getCanvasCoords(event) {
    const container = this.canvasContainerRef.nativeElement;
    const rect = container.getBoundingClientRect();
    return this.drawingService.clientToCanvasCoords(event.clientX, event.clientY, rect, this.transform);
  }
  onMouseDown(event) {
    if (event.button === 1 || event.button === 2 || event.button === 0 && event.altKey) {
      event.preventDefault();
      this.isPanning = true;
      this.panStart = { x: event.clientX - this.transform.pointX, y: event.clientY - this.transform.pointY };
      return;
    }
    if (event.button !== 0)
      return;
    const coords = this.getCanvasCoords(event);
    const tool = this.drawingService.activeTool();
    if (tool === "draw-connection") {
      const anchor = this.renderService.hitTestAnchor(this.shapeManager.shapes(), coords.x, coords.y);
      if (anchor) {
        if (this.connectionService.isDrawingConnection()) {
          const conn = this.connectionService.finishConnection(anchor);
          if (conn) {
            this.shapeManager.addConnection(conn);
            this.stateService.markDirty();
          }
        } else {
          this.connectionService.startConnection(anchor);
        }
      } else {
        this.connectionService.cancelConnection();
        this.requestRender();
      }
      return;
    }
    if (this.drawingService.isDrawingTool() && this.config.canDrawShapes) {
      this.drawingService.startDrawing(coords.x, coords.y);
      return;
    }
    if (tool === "select" && this.config.canSelectShapes) {
      const singleSelected = this.shapeManager.singleSelectedShape();
      if (singleSelected && this.config.canResizeShapes) {
        const handle = this.renderService.hitTestHandle(singleSelected, coords.x, coords.y, this.transform.scale);
        if (handle) {
          if (handle === "rotate") {
            this.isRotating = true;
            this.resizeStartShape = __spreadValues({}, singleSelected);
            const cx = singleSelected.x + singleSelected.width / 2;
            const cy = singleSelected.y + singleSelected.height / 2;
            this.rotateStartAngle = Math.atan2(coords.y - cy, coords.x - cx);
            this.rotateStartRotation = singleSelected.rotation || 0;
          } else {
            this.isResizing = true;
            this.resizeHandle = handle;
            this.resizeStartShape = __spreadValues({}, singleSelected);
            this.resizeStartCanvas = coords;
          }
          return;
        }
      }
      const hitShape = this.renderService.hitTestShape(this.shapeManager.shapes(), coords.x, coords.y);
      if (hitShape) {
        if (event.ctrlKey && this.config.canMultiSelect) {
          this.shapeManager.toggleShapeSelection(hitShape.id);
        } else if (!this.shapeManager.isSelected(hitShape.id)) {
          this.shapeManager.selectShape(hitShape.id);
        }
        if (this.config.canDragShapes) {
          this.isDragging = true;
          this.dragStartCanvas = coords;
          this.dragStartShapes.clear();
          for (const s of this.shapeManager.selectedShapes()) {
            this.dragStartShapes.set(s.id, __spreadValues({}, s));
          }
        }
      } else {
        {
          if (!event.ctrlKey) {
            this.shapeManager.clearSelection();
          }
          this.isMarqueeSelecting = true;
          this.marqueeStart = coords;
          this.marqueeEnd = coords;
        }
      }
    }
  }
  onMouseMove(event) {
    if (this.isPanning) {
      this.canvasContainerRef.nativeElement.style.cursor = "grabbing";
      this.transform = __spreadProps(__spreadValues({}, this.transform), {
        pointX: event.clientX - this.panStart.x,
        pointY: event.clientY - this.panStart.y
      });
      this.requestRender();
      return;
    }
    const coords = this.getCanvasCoords(event);
    if (this.drawingService.isDrawing()) {
      this.drawingService.updateDrawing(coords.x, coords.y);
      this.requestRender();
      return;
    }
    if (this.connectionService.isDrawingConnection()) {
      this.connectionService.updateConnection(coords.x, coords.y);
      this.hoveredAnchor = this.renderService.hitTestAnchor(this.shapeManager.shapes(), coords.x, coords.y);
      this.requestRender();
      return;
    }
    if (this.isRotating && this.resizeStartShape) {
      const s = this.resizeStartShape;
      const cx = s.x + s.width / 2;
      const cy = s.y + s.height / 2;
      const currentAngle = Math.atan2(coords.y - cy, coords.x - cx);
      const deltaAngle = (currentAngle - this.rotateStartAngle) * (180 / Math.PI);
      let newRotation = this.rotateStartRotation + deltaAngle;
      if (event.shiftKey) {
        newRotation = Math.round(newRotation / 15) * 15;
      }
      this.shapeManager.updateShape(s.id, { rotation: newRotation });
      this.requestRender();
      return;
    }
    if (this.isResizing && this.resizeStartShape) {
      const dx = coords.x - this.resizeStartCanvas.x;
      const dy = coords.y - this.resizeStartCanvas.y;
      const s = this.resizeStartShape;
      if (s.type === "line") {
        const line = s;
        const updates = {};
        const handle = this.resizeHandle || "";
        const movingStart = handle.includes("nw") || handle === "n-resize" || handle === "w-resize" || handle === "ne-resize";
        if (movingStart) {
          updates.startX = line.startX + dx;
          updates.startY = line.startY + dy;
        } else {
          updates.endX = line.endX + dx;
          updates.endY = line.endY + dy;
        }
        const sx = updates.startX ?? line.startX;
        const sy = updates.startY ?? line.startY;
        const ex = updates.endX ?? line.endX;
        const ey = updates.endY ?? line.endY;
        updates.x = Math.min(sx, ex);
        updates.y = Math.min(sy, ey);
        updates.width = Math.max(1, Math.abs(ex - sx));
        updates.height = Math.max(1, Math.abs(ey - sy));
        this.shapeManager.updateShape(s.id, updates);
      } else {
        let newX = s.x, newY = s.y, newW = s.width, newH = s.height;
        if (this.resizeHandle?.includes("e")) {
          newW = Math.max(10, s.width + dx);
        }
        if (this.resizeHandle?.includes("w")) {
          newX = s.x + dx;
          newW = Math.max(10, s.width - dx);
        }
        if (this.resizeHandle?.includes("s")) {
          newH = Math.max(10, s.height + dy);
        }
        if (this.resizeHandle?.includes("n")) {
          newY = s.y + dy;
          newH = Math.max(10, s.height - dy);
        }
        const snapped = this.gridService.snapPosition(newX, newY);
        this.shapeManager.updateShape(s.id, {
          x: snapped.x,
          y: snapped.y,
          width: this.gridService.snapDimension(newW),
          height: this.gridService.snapDimension(newH)
        });
      }
      this.requestRender();
      return;
    }
    if (this.isDragging) {
      const dx = coords.x - this.dragStartCanvas.x;
      const dy = coords.y - this.dragStartCanvas.y;
      for (const [id, startShape] of this.dragStartShapes) {
        const snapped = this.gridService.snapPosition(startShape.x + dx, startShape.y + dy);
        const updates = { x: snapped.x, y: snapped.y };
        if (startShape.type === "line") {
          const line = startShape;
          const snapDx = snapped.x - startShape.x;
          const snapDy = snapped.y - startShape.y;
          updates.startX = line.startX + snapDx;
          updates.startY = line.startY + snapDy;
          updates.endX = line.endX + snapDx;
          updates.endY = line.endY + snapDy;
        }
        this.shapeManager.updateShape(id, updates);
      }
      this.requestRender();
      return;
    }
    if (this.isMarqueeSelecting) {
      this.marqueeEnd = coords;
      this.shapeManager.selectShapesInRect(this.marqueeStart.x, this.marqueeStart.y, this.marqueeEnd.x, this.marqueeEnd.y);
      this.requestRender();
      return;
    }
    if (this.drawingService.activeTool() === "draw-connection") {
      const nextHoveredAnchor = this.renderService.hitTestAnchor(this.shapeManager.shapes(), coords.x, coords.y);
      const anchorChanged = nextHoveredAnchor?.shapeId !== this.hoveredAnchor?.shapeId || nextHoveredAnchor?.position !== this.hoveredAnchor?.position;
      this.hoveredAnchor = nextHoveredAnchor;
      if (anchorChanged) {
        this.requestRender();
      }
    }
    const hit = this.renderService.hitTestShape(this.shapeManager.shapes(), coords.x, coords.y);
    const newHoveredId = hit?.id ?? null;
    if (newHoveredId !== this.hoveredShapeId) {
      this.hoveredShapeId = newHoveredId;
      this.requestRender();
    }
    this.updateCursor(coords);
  }
  onMouseUp(event) {
    if (this.isPanning) {
      this.isPanning = false;
      return;
    }
    if (this.isMarqueeSelecting) {
      this.isMarqueeSelecting = false;
      this.requestRender();
      return;
    }
    if (this.drawingService.isDrawing()) {
      const shape = this.drawingService.finishDrawing();
      if (shape) {
        const added = this.shapeManager.addShape(shape);
        this.shapeManager.selectShape(added.id);
        this.stateService.markDirty();
      }
      this.requestRender();
      return;
    }
    if (this.isDragging || this.isResizing || this.isRotating) {
      this.stateService.markDirty();
    }
    this.isDragging = false;
    this.isResizing = false;
    this.isRotating = false;
    this.resizeHandle = null;
    this.resizeStartShape = null;
    this.dragStartShapes.clear();
  }
  onWheel(event) {
    if (!this.config.canZoom)
      return;
    event.preventDefault();
    const container = this.canvasContainerRef.nativeElement;
    const rect = container.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(10, Math.max(0.1, this.transform.scale * zoomFactor));
    const scaleChange = newScale / this.transform.scale;
    this.transform = {
      scale: newScale,
      pointX: mouseX - scaleChange * (mouseX - this.transform.pointX),
      pointY: mouseY - scaleChange * (mouseY - this.transform.pointY)
    };
    this.requestRender();
  }
  onDoubleClick(event) {
    if (!this.simState.isSimulating())
      return;
    const coords = this.getCanvasCoords(event);
    const hit = this.renderService.hitTestShape(this.shapeManager.shapes(), coords.x, coords.y);
    if (!hit)
      return;
    const state = this.simState.getNodeState(hit.id);
    if (!state)
      return;
    if (state.role === "valve") {
      const newPos = state.params.valvePosition === "open" ? "closed" : "open";
      this.simState.updateNodeParams(hit.id, { valvePosition: newPos });
      this.requestRender();
    }
    if (state.role === "pump") {
      this.simState.updateNodeParams(hit.id, { pumpRunning: !state.params.pumpRunning });
      this.requestRender();
    }
  }
  onKeyDown(event) {
    if ((event.key === "Delete" || event.key === "Backspace") && this.config.canDeleteShapes) {
      this.deleteSelected();
    }
    if (event.key === "Escape") {
      this.drawingService.cancelDrawing();
      this.connectionService.cancelConnection();
      this.isMarqueeSelecting = false;
      this.drawingService.setTool("select");
      this.shapeManager.clearSelection();
      this.requestRender();
    }
    if (event.ctrlKey && event.key === "a") {
      event.preventDefault();
      this.shapeManager.selectMultiple(this.shapeManager.shapes().map((s) => s.id));
      this.requestRender();
    }
    if (event.ctrlKey && !event.shiftKey && event.key === "g") {
      event.preventDefault();
      this.groupSelected();
    }
    if (event.ctrlKey && event.shiftKey && event.key === "G") {
      event.preventDefault();
      this.ungroupSelected();
    }
    if (this.config.canDragShapes && this.shapeManager.hasSelection()) {
      const step = event.shiftKey ? 10 : 1;
      let dx = 0, dy = 0;
      switch (event.key) {
        case "ArrowLeft":
          dx = -step;
          break;
        case "ArrowRight":
          dx = step;
          break;
        case "ArrowUp":
          dy = -step;
          break;
        case "ArrowDown":
          dy = step;
          break;
      }
      if (dx || dy) {
        event.preventDefault();
        for (const shape of this.shapeManager.selectedShapes()) {
          const updates = { x: shape.x + dx, y: shape.y + dy };
          if (shape.type === "line") {
            const line = shape;
            updates.startX = line.startX + dx;
            updates.startY = line.startY + dy;
            updates.endX = line.endX + dx;
            updates.endY = line.endY + dy;
          }
          this.shapeManager.updateShape(shape.id, updates);
        }
        this.stateService.markDirty();
        this.requestRender();
      }
    }
  }
  // --- Toolbar actions ---
  onSymbolSelected(symbol) {
    this.drawingService.selectSymbol(symbol);
  }
  onAlign(alignment) {
    const updates = this.alignmentService.alignShapes(this.shapeManager.selectedShapes(), alignment);
    this.applyUpdates(updates);
  }
  onDistribute(direction) {
    const updates = this.alignmentService.distributeShapes(this.shapeManager.selectedShapes(), direction);
    this.applyUpdates(updates);
  }
  deleteSelected() {
    this.shapeManager.deleteSelectedShapes();
    this.stateService.markDirty();
    this.requestRender();
  }
  groupSelected() {
    const groupId = this.shapeManager.groupSelected();
    if (groupId) {
      this.stateService.markDirty();
      this.requestRender();
    }
  }
  ungroupSelected() {
    this.shapeManager.ungroupSelected();
    this.stateService.markDirty();
    this.requestRender();
  }
  // --- Simulation ---
  toggleSimulation() {
    if (this.simState.isSimulating()) {
      this.simRender.stopAnimation();
      this.simState.deactivate();
      this.requestRender();
    } else {
      this.simState.activate(this.shapeManager.shapes(), this.shapeManager.connections());
      this.simRender.startAnimation(() => this.requestRender());
    }
  }
  resetSimulation() {
    if (this.simState.isSimulating()) {
      this.simRender.stopAnimation();
      this.simState.deactivate();
      this.simState.activate(this.shapeManager.shapes(), this.shapeManager.connections());
      this.simRender.startAnimation(() => this.requestRender());
    }
  }
  zoomIn() {
    this.transform = __spreadProps(__spreadValues({}, this.transform), { scale: Math.min(10, this.transform.scale * 1.2) });
    this.requestRender();
  }
  zoomOut() {
    this.transform = __spreadProps(__spreadValues({}, this.transform), { scale: Math.max(0.1, this.transform.scale * 0.8) });
    this.requestRender();
  }
  zoomFit() {
    const container = this.canvasContainerRef.nativeElement;
    const scaleX = container.clientWidth / this.canvasWidth;
    const scaleY = container.clientHeight / this.canvasHeight;
    const scale = Math.min(scaleX, scaleY) * 0.95;
    this.transform = {
      scale,
      pointX: (container.clientWidth - this.canvasWidth * scale) / 2,
      pointY: (container.clientHeight - this.canvasHeight * scale) / 2
    };
    this.requestRender();
  }
  applyUpdates(updates) {
    for (const u of updates) {
      this.shapeManager.updateShape(u.id, u);
    }
    if (updates.length > 0) {
      this.stateService.markDirty();
      this.requestRender();
    }
  }
  updateCursor(coords) {
    const container = this.canvasContainerRef.nativeElement;
    const tool = this.drawingService.activeTool();
    if (tool !== "select") {
      container.style.cursor = "crosshair";
      return;
    }
    const singleSelected = this.shapeManager.singleSelectedShape();
    if (singleSelected) {
      const handle = this.renderService.hitTestHandle(singleSelected, coords.x, coords.y, this.transform.scale);
      if (handle) {
        container.style.cursor = handle === "rotate" ? "grab" : handle;
        return;
      }
    }
    const hit = this.renderService.hitTestShape(this.shapeManager.shapes(), coords.x, coords.y);
    container.style.cursor = hit ? "move" : "grab";
  }
  static \u0275fac = function DiagramCanvasComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _DiagramCanvasComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _DiagramCanvasComponent, selectors: [["app-diagram-canvas"]], viewQuery: function DiagramCanvasComponent_Query(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275viewQuery(_c0, 5);
      \u0275\u0275viewQuery(_c1, 5);
      \u0275\u0275viewQuery(_c2, 5);
      \u0275\u0275viewQuery(_c3, 5);
    }
    if (rf & 2) {
      let _t;
      \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.canvasContainerRef = _t.first);
      \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.gridCanvasRef = _t.first);
      \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.shapeCanvasRef = _t.first);
      \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.tempCanvasRef = _t.first);
    }
  }, hostBindings: function DiagramCanvasComponent_HostBindings(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275listener("keydown", function DiagramCanvasComponent_keydown_HostBindingHandler($event) {
        return ctx.onKeyDown($event);
      }, false, \u0275\u0275resolveDocument);
    }
  }, features: [\u0275\u0275ProvidersFeature([
    DiagramShapeManagerService,
    DiagramRenderService,
    DiagramDrawingService,
    DiagramGridService,
    DiagramConnectionService,
    DiagramAlignmentService,
    DiagramStateService,
    ZoomPanService,
    SimulationGraphService,
    SimulationEngineService,
    SimulationStateService,
    SimulationRenderService
  ])], decls: 23, vars: 9, consts: [["canvasContainer", ""], ["gridCanvas", ""], ["shapeCanvas", ""], ["tempCanvas", ""], [1, "diagram-page"], [1, "toolbar-row"], [1, "diagram-workspace"], [1, "symbol-palette-panel"], [1, "canvas-container", 3, "mousedown", "mousemove", "mouseup", "wheel", "dblclick", "contextmenu"], [1, "layer-canvas", "grid-canvas"], [1, "layer-canvas", "shape-canvas"], [1, "layer-canvas", "temp-canvas"], [1, "status-bar"], [1, "dirty-indicator"], [1, "saving-indicator"], [3, "onAlign", "onDistribute", "onDelete", "onGroup", "onUngroup", "onZoomIn", "onZoomOut", "onZoomFit"], [3, "onToggle", "onReset"], [3, "symbolSelected"]], template: function DiagramCanvasComponent_Template(rf, ctx) {
    if (rf & 1) {
      const _r1 = \u0275\u0275getCurrentView();
      \u0275\u0275elementStart(0, "div", 4);
      \u0275\u0275template(1, DiagramCanvasComponent_Conditional_1_Template, 3, 0, "div", 5);
      \u0275\u0275elementStart(2, "div", 6);
      \u0275\u0275template(3, DiagramCanvasComponent_Conditional_3_Template, 2, 0, "div", 7);
      \u0275\u0275elementStart(4, "div", 8, 0);
      \u0275\u0275listener("mousedown", function DiagramCanvasComponent_Template_div_mousedown_4_listener($event) {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.onMouseDown($event));
      })("mousemove", function DiagramCanvasComponent_Template_div_mousemove_4_listener($event) {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.onMouseMove($event));
      })("mouseup", function DiagramCanvasComponent_Template_div_mouseup_4_listener($event) {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.onMouseUp($event));
      })("wheel", function DiagramCanvasComponent_Template_div_wheel_4_listener($event) {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.onWheel($event));
      })("dblclick", function DiagramCanvasComponent_Template_div_dblclick_4_listener($event) {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.onDoubleClick($event));
      })("contextmenu", function DiagramCanvasComponent_Template_div_contextmenu_4_listener($event) {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView($event.preventDefault());
      });
      \u0275\u0275element(6, "canvas", 9, 1)(8, "canvas", 10, 2)(10, "canvas", 11, 3);
      \u0275\u0275elementEnd();
      \u0275\u0275template(12, DiagramCanvasComponent_Conditional_12_Template, 1, 0, "app-simulation-inspector")(13, DiagramCanvasComponent_Conditional_13_Template, 1, 0, "app-diagram-properties");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(14, "div", 12)(15, "span");
      \u0275\u0275text(16);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(17, "span");
      \u0275\u0275text(18);
      \u0275\u0275elementEnd();
      \u0275\u0275template(19, DiagramCanvasComponent_Conditional_19_Template, 2, 0, "span", 13)(20, DiagramCanvasComponent_Conditional_20_Template, 2, 0, "span", 14);
      \u0275\u0275elementStart(21, "span");
      \u0275\u0275text(22);
      \u0275\u0275elementEnd()()();
    }
    if (rf & 2) {
      \u0275\u0275advance();
      \u0275\u0275conditional(ctx.config.showToolbar ? 1 : -1);
      \u0275\u0275advance(2);
      \u0275\u0275conditional(ctx.config.showSymbolPalette && ctx.drawingService.activeTool() === "place-symbol" ? 3 : -1);
      \u0275\u0275advance(9);
      \u0275\u0275conditional(ctx.simState.isSimulating() ? 12 : ctx.config.showProperties ? 13 : -1);
      \u0275\u0275advance(4);
      \u0275\u0275textInterpolate(ctx.stateService.diagramName());
      \u0275\u0275advance(2);
      \u0275\u0275textInterpolate1("", ctx.Math.round(ctx.transform.scale * 100), "%");
      \u0275\u0275advance();
      \u0275\u0275conditional(ctx.stateService.isDirty() ? 19 : -1);
      \u0275\u0275advance();
      \u0275\u0275conditional(ctx.stateService.isSaving() ? 20 : -1);
      \u0275\u0275advance(2);
      \u0275\u0275textInterpolate2("", ctx.shapeManager.shapes().length, " shapes, ", ctx.shapeManager.connections().length, " connections");
    }
  }, dependencies: [CommonModule, DiagramToolbarComponent, DiagramPropertiesComponent, SymbolPaletteComponent, SimulationToolbarComponent, SimulationInspectorComponent], styles: ["\n\n[_nghost-%COMP%] {\n  display: block;\n  height: 100%;\n}\n.diagram-page[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  height: 100%;\n  background: #121212;\n  color: #e0e0e0;\n}\n.diagram-workspace[_ngcontent-%COMP%] {\n  display: flex;\n  flex: 1;\n  overflow: hidden;\n  position: relative;\n}\n.symbol-palette-panel[_ngcontent-%COMP%] {\n  width: 200px;\n  border-right: 1px solid #333;\n  overflow-y: auto;\n  background: #1a1a1a;\n}\n.canvas-container[_ngcontent-%COMP%] {\n  flex: 1;\n  overflow: hidden;\n  position: relative;\n  cursor: default;\n}\n.layer-canvas[_ngcontent-%COMP%] {\n  position: absolute;\n  top: 0;\n  left: 0;\n}\n.grid-canvas[_ngcontent-%COMP%] {\n  z-index: 1;\n}\n.shape-canvas[_ngcontent-%COMP%] {\n  z-index: 2;\n}\n.temp-canvas[_ngcontent-%COMP%] {\n  z-index: 3;\n  pointer-events: none;\n}\n.status-bar[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 16px;\n  padding: 4px 12px;\n  background: #1e1e1e;\n  border-top: 1px solid #333;\n  font-size: 12px;\n  color: #888;\n}\n.toolbar-row[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 16px;\n  background: #1e1e1e;\n  border-bottom: 1px solid #333;\n}\n.dirty-indicator[_ngcontent-%COMP%] {\n  color: #ff9800;\n}\n.saving-indicator[_ngcontent-%COMP%] {\n  color: #4caf50;\n}\n/*# sourceMappingURL=diagram-canvas.component.css.map */"], changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(DiagramCanvasComponent, { className: "DiagramCanvasComponent", filePath: "src/app/features/diagram-builder/components/diagram-canvas/diagram-canvas.component.ts", lineNumber: 166 });
})();
export {
  DiagramCanvasComponent
};
//# sourceMappingURL=chunk-ARP4CSPD.js.map
