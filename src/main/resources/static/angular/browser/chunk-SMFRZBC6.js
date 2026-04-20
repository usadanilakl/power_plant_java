import {
  ContextMenuComponent,
  NestedItemImpl,
  PIDSymbolsService,
  RfToggleMenuComponent,
  ZoomPanService
} from "./chunk-UIGKXHOL.js";
import {
  CheckboxControlValueAccessor,
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
} from "./chunk-BLD5MXQL.js";
import {
  DiagramApiService
} from "./chunk-KSE3P6BZ.js";
import {
  ActivatedRoute,
  Router
} from "./chunk-4PYQZ7JD.js";
import {
  BehaviorSubject,
  CommonModule,
  DecimalPipe,
  HttpClient,
  Subject,
  computed,
  debounceTime,
  effect,
  environment,
  forkJoin,
  inject,
  input,
  output,
  signal,
  ɵsetClassDebugInfo,
  ɵɵProvidersFeature,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵclassProp,
  ɵɵconditional,
  ɵɵdeclareLet,
  ɵɵdefineComponent,
  ɵɵdefineInjectable,
  ɵɵelement,
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
  ɵɵpipeBind2,
  ɵɵproperty,
  ɵɵqueryRefresh,
  ɵɵreadContextLet,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIdentity,
  ɵɵresetView,
  ɵɵresolveDocument,
  ɵɵresolveWindow,
  ɵɵrestoreView,
  ɵɵstoreLet,
  ɵɵstyleProp,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtextInterpolate2,
  ɵɵviewQuery
} from "./chunk-W4KMF4YJ.js";
import {
  __spreadProps,
  __spreadValues
} from "./chunk-N6ESDQJH.js";

// src/app/features/diagram-builder/services/diagram-shape-manager.service.ts
var groupCounter = 0;
var DiagramShapeManagerService = class _DiagramShapeManagerService {
  _shapes = signal([]);
  _connections = signal([]);
  _selectedShapeIds = signal(/* @__PURE__ */ new Set());
  _selectedConnectionId = signal(null);
  _nextShapeId = 1;
  _nextConnectionId = 1;
  shapes = this._shapes.asReadonly();
  connections = this._connections.asReadonly();
  selectedShapeIds = this._selectedShapeIds.asReadonly();
  selectedConnectionId = this._selectedConnectionId.asReadonly();
  selectedShapes = computed(() => {
    const ids = this._selectedShapeIds();
    return this._shapes().filter((s) => ids.has(s.id));
  });
  singleSelectedShape = computed(() => {
    const selected = this.selectedShapes();
    return selected.length === 1 ? selected[0] : null;
  });
  singleSelectedConnection = computed(() => {
    const id = this._selectedConnectionId();
    return id == null ? null : this._connections().find((c) => c.id === id) ?? null;
  });
  hasSelection = computed(() => this._selectedShapeIds().size > 0 || this._selectedConnectionId() != null);
  selectionCount = computed(() => this._selectedShapeIds().size);
  // --- Shape CRUD ---
  setShapes(shapes) {
    this._shapes.set([...shapes]);
    this._nextShapeId = shapes.length > 0 ? Math.max(...shapes.map((s) => s.id)) + 1 : 1;
  }
  setConnections(connections) {
    this._connections.set([...connections]);
    this._selectedConnectionId.set(null);
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
    this._connections.update((conns) => conns.filter((c) => c.sourcePlacementId !== id && c.targetPlacementId !== id));
    this._selectedShapeIds.update((ids) => {
      const next = new Set(ids);
      next.delete(id);
      return next;
    });
  }
  deleteSelectedShapes() {
    const ids = this._selectedShapeIds();
    const selectedConnectionId = this._selectedConnectionId();
    if (ids.size === 0 && selectedConnectionId == null)
      return;
    if (ids.size > 0) {
      this._shapes.update((shapes) => shapes.filter((s) => !ids.has(s.id)));
      this._connections.update((conns) => conns.filter((c) => !ids.has(c.sourcePlacementId) && !ids.has(c.targetPlacementId)));
      this._selectedShapeIds.set(/* @__PURE__ */ new Set());
    }
    if (selectedConnectionId != null) {
      this._connections.update((conns) => conns.filter((c) => c.id !== selectedConnectionId));
      this._selectedConnectionId.set(null);
    }
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
    if (this._selectedConnectionId() === id) {
      this._selectedConnectionId.set(null);
    }
  }
  // --- Selection ---
  selectShape(id, exclusive = true) {
    const shape = this.getShapeById(id);
    if (!shape)
      return;
    const groupIds = shape.groupId ? this._shapes().filter((s) => s.groupId === shape.groupId).map((s) => s.id) : [id];
    if (exclusive) {
      this._selectedShapeIds.set(new Set(groupIds));
      this._selectedConnectionId.set(null);
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
    this._selectedConnectionId.set(null);
  }
  selectConnection(id) {
    const connection = this._connections().find((c) => c.id === id);
    if (!connection)
      return;
    this._selectedShapeIds.set(/* @__PURE__ */ new Set());
    this._selectedConnectionId.set(id);
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
    this._selectedConnectionId.set(null);
  }
  clearSelection() {
    this._selectedShapeIds.set(/* @__PURE__ */ new Set());
    this._selectedConnectionId.set(null);
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
  drawAll(ctx, shapes, connections, selectedIds, selectedConnectionId, hoveredId, scale) {
    ctx.save();
    for (const conn of connections) {
      this.drawConnection(ctx, conn, shapes, scale);
      if (selectedConnectionId === conn.id) {
        this.drawSelectedConnection(ctx, conn, shapes, scale);
      }
    }
    const sorted = [...shapes].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
    for (const shape of sorted) {
      this.drawShape(ctx, shape, scale);
      if (shape.simEquipmentId) {
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
    const source = shapes.find((s) => s.id === conn.sourcePlacementId);
    const target = shapes.find((s) => s.id === conn.targetPlacementId);
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
      if (this.isHorizontalAfterRotation(source, conn.sourceAnchor)) {
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
  drawSelectedConnection(ctx, conn, shapes, scale) {
    const source = shapes.find((s) => s.id === conn.sourcePlacementId);
    const target = shapes.find((s) => s.id === conn.targetPlacementId);
    if (!source || !target)
      return;
    const sourcePoint = this.getAnchorPoint(source, conn.sourceAnchor);
    const targetPoint = this.getAnchorPoint(target, conn.targetAnchor);
    ctx.save();
    ctx.strokeStyle = "#4fc3f7";
    ctx.lineWidth = 4 / scale;
    ctx.setLineDash([8 / scale, 4 / scale]);
    ctx.beginPath();
    if (conn.waypoints && conn.waypoints.length > 0) {
      ctx.moveTo(sourcePoint.x, sourcePoint.y);
      for (const wp of conn.waypoints)
        ctx.lineTo(wp.x, wp.y);
      ctx.lineTo(targetPoint.x, targetPoint.y);
    } else {
      ctx.moveTo(sourcePoint.x, sourcePoint.y);
      if (this.isHorizontalAfterRotation(source, conn.sourceAnchor)) {
        ctx.lineTo(targetPoint.x, sourcePoint.y);
        ctx.lineTo(targetPoint.x, targetPoint.y);
      } else {
        ctx.lineTo(sourcePoint.x, targetPoint.y);
        ctx.lineTo(targetPoint.x, targetPoint.y);
      }
    }
    ctx.stroke();
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
    const cx = shape.x + shape.width / 2;
    const cy = shape.y + shape.height / 2;
    let dx, dy;
    switch (anchor) {
      case "top":
        dx = 0;
        dy = -shape.height / 2;
        break;
      case "bottom":
        dx = 0;
        dy = shape.height / 2;
        break;
      case "left":
        dx = -shape.width / 2;
        dy = 0;
        break;
      case "right":
        dx = shape.width / 2;
        dy = 0;
        break;
      default:
        dx = 0;
        dy = 0;
        break;
    }
    const rad = (shape.rotation ?? 0) * Math.PI / 180;
    return {
      x: cx + dx * Math.cos(rad) - dy * Math.sin(rad),
      y: cy + dx * Math.sin(rad) + dy * Math.cos(rad)
    };
  }
  getAllAnchors(shape) {
    return ["top", "right", "bottom", "left"].map((position) => __spreadProps(__spreadValues({}, this.getAnchorPoint(shape, position)), {
      position,
      placementId: shape.id
    }));
  }
  drawAnchorPoints(ctx, shape, hoveredAnchor) {
    const anchors = this.getAllAnchors(shape);
    for (const anchor of anchors) {
      const isHovered = hoveredAnchor && hoveredAnchor.placementId === anchor.placementId && hoveredAnchor.position === anchor.position;
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
    const sorted = [...shapes].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
    for (let i = sorted.length - 1; i >= 0; i--) {
      const s = sorted[i];
      const bounds = this.getInteractiveBounds(s);
      if (canvasX >= bounds.left && canvasX <= bounds.right && canvasY >= bounds.top && canvasY <= bounds.bottom) {
        return s;
      }
    }
    return null;
  }
  getInteractiveBounds(shape) {
    const margin = 8;
    const hasLabel = !!shape.label;
    const labelHeight = hasLabel ? 20 : 0;
    return {
      left: shape.x - margin,
      right: shape.x + shape.width + margin,
      top: shape.y - margin,
      bottom: shape.y + shape.height + margin + labelHeight
    };
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
  /**
   * Hit-test waypoints and midpoints on a selected connection.
   * Returns: { type: 'waypoint', index } for existing waypoints (index into conn.waypoints),
   *          { type: 'midpoint', segmentIndex } for midpoints between path segments,
   *          null if no hit.
   */
  hitTestWaypoint(conn, shapes, canvasX, canvasY, threshold = 10) {
    const source = shapes.find((s) => s.id === conn.sourcePlacementId);
    const target = shapes.find((s) => s.id === conn.targetPlacementId);
    if (!source || !target)
      return null;
    const sp = this.getAnchorPoint(source, conn.sourceAnchor);
    const tp = this.getAnchorPoint(target, conn.targetAnchor);
    const points = [sp];
    if (conn.waypoints?.length) {
      points.push(...conn.waypoints);
    } else if (this.isHorizontalAfterRotation(source, conn.sourceAnchor)) {
      points.push({ x: tp.x, y: sp.y });
    } else {
      points.push({ x: sp.x, y: tp.y });
    }
    points.push(tp);
    if (conn.waypoints?.length) {
      for (let i = 0; i < conn.waypoints.length; i++) {
        const wp = conn.waypoints[i];
        const dist = Math.sqrt((canvasX - wp.x) ** 2 + (canvasY - wp.y) ** 2);
        if (dist <= threshold)
          return { type: "waypoint", index: i };
      }
    }
    for (let i = 0; i < points.length - 1; i++) {
      const mx = (points[i].x + points[i + 1].x) / 2;
      const my = (points[i].y + points[i + 1].y) / 2;
      const dist = Math.sqrt((canvasX - mx) ** 2 + (canvasY - my) ** 2);
      if (dist <= threshold)
        return { type: "midpoint", segmentIndex: i, x: mx, y: my };
    }
    return null;
  }
  hitTestConnection(connections, shapes, canvasX, canvasY, threshold = 8) {
    for (let i = connections.length - 1; i >= 0; i--) {
      const conn = connections[i];
      const source = shapes.find((s) => s.id === conn.sourcePlacementId);
      const target = shapes.find((s) => s.id === conn.targetPlacementId);
      if (!source || !target)
        continue;
      const points = [this.getAnchorPoint(source, conn.sourceAnchor)];
      if (conn.waypoints?.length) {
        points.push(...conn.waypoints);
      } else if (this.isHorizontalAfterRotation(source, conn.sourceAnchor)) {
        const targetPoint = this.getAnchorPoint(target, conn.targetAnchor);
        points.push({ x: targetPoint.x, y: points[0].y });
      } else {
        const targetPoint = this.getAnchorPoint(target, conn.targetAnchor);
        points.push({ x: points[0].x, y: targetPoint.y });
      }
      points.push(this.getAnchorPoint(target, conn.targetAnchor));
      for (let p = 0; p < points.length - 1; p++) {
        if (this.distanceToSegment(canvasX, canvasY, points[p], points[p + 1]) <= threshold) {
          return conn;
        }
      }
    }
    return null;
  }
  distanceToSegment(px, py, a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lengthSq = dx * dx + dy * dy;
    if (lengthSq === 0) {
      return Math.sqrt((px - a.x) ** 2 + (py - a.y) ** 2);
    }
    const t = Math.max(0, Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / lengthSq));
    const projX = a.x + t * dx;
    const projY = a.y + t * dy;
    return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
  }
  isHorizontalAfterRotation(shape, anchor) {
    const rad = (shape.rotation ?? 0) * Math.PI / 180;
    const isOrigH = anchor === "left" || anchor === "right";
    const baseX = isOrigH ? 1 : 0;
    const baseY = isOrigH ? 0 : 1;
    const rotX = baseX * Math.cos(rad) - baseY * Math.sin(rad);
    const rotY = baseX * Math.sin(rad) + baseY * Math.cos(rad);
    return Math.abs(rotX) > Math.abs(rotY);
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
    if (sourceAnchor.placementId === targetAnchor.placementId) {
      this.cancelConnection();
      return null;
    }
    this.drawState = null;
    this.isDrawingConnection.set(false);
    return {
      id: 0,
      sourcePlacementId: sourceAnchor.placementId,
      targetPlacementId: targetAnchor.placementId,
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

// src/app/features/diagram-builder/services/diagram-placement-api.service.ts
var DiagramPlacementApiService = class _DiagramPlacementApiService {
  http = inject(HttpClient);
  baseUrl = `${environment.apiUrl}/diagram-placements`;
  getByDiagram(diagramId) {
    return this.http.get(`${this.baseUrl}/by-diagram/${diagramId}`);
  }
  bulkSave(diagramId, dtos) {
    return this.http.post(`${this.baseUrl}/bulk-save/${diagramId}`, dtos);
  }
  update(id, dto) {
    return this.http.put(`${this.baseUrl}/${id}`, dto);
  }
  delete(id) {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
  static \u0275fac = function DiagramPlacementApiService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _DiagramPlacementApiService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _DiagramPlacementApiService, factory: _DiagramPlacementApiService.\u0275fac, providedIn: "root" });
};

// src/app/features/diagram-builder/services/diagram-connection-api.service.ts
var DiagramConnectionApiService = class _DiagramConnectionApiService {
  http = inject(HttpClient);
  baseUrl = `${environment.apiUrl}/diagram-connections`;
  getByDiagram(diagramId) {
    return this.http.get(`${this.baseUrl}/by-diagram/${diagramId}`);
  }
  bulkSave(diagramId, dtos) {
    return this.http.post(`${this.baseUrl}/bulk-save/${diagramId}`, dtos);
  }
  update(id, dto) {
    return this.http.put(`${this.baseUrl}/${id}`, dto);
  }
  delete(id) {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
  static \u0275fac = function DiagramConnectionApiService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _DiagramConnectionApiService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _DiagramConnectionApiService, factory: _DiagramConnectionApiService.\u0275fac, providedIn: "root" });
};

// src/app/features/diagram-builder/models/diagram.model.ts
function normalizeDiagramData(dto) {
  let rawShapes;
  let rawConnections;
  try {
    rawShapes = JSON.parse(dto.shapesJson || "[]");
  } catch {
    rawShapes = [];
  }
  try {
    rawConnections = JSON.parse(dto.connectionsJson || "[]");
  } catch {
    rawConnections = [];
  }
  if (rawShapes && !Array.isArray(rawShapes) && rawShapes.schemaVersion) {
    return rawShapes;
  }
  return migrateLegacyToV1(Array.isArray(rawShapes) ? rawShapes : [], Array.isArray(rawConnections) ? rawConnections : []);
}
function migrateLegacyToV1(shapes, connections) {
  return {
    schemaVersion: 1,
    placements: shapes.map((s) => __spreadValues({
      id: s.id,
      inline: true,
      x: s.x,
      y: s.y,
      width: s.width,
      height: s.height,
      rotation: s.rotation,
      color: s.color,
      fillColor: s.fillColor,
      lineWidth: s.lineWidth,
      label: s.label,
      zIndex: s.zIndex,
      locked: s.locked,
      groupId: s.groupId,
      type: s.type,
      // Line endpoints
      startX: s.startX,
      startY: s.startY,
      endX: s.endX,
      endY: s.endY,
      // Text
      text: s.text,
      fontSize: s.fontSize,
      fontFamily: s.fontFamily,
      // Symbol
      symbolId: s.symbolId,
      svgPath: s.svgPath,
      originalWidth: s.originalWidth,
      originalHeight: s.originalHeight,
      // Circle
      radius: s.radius
    }, s.linkedEntityId ? {
      // These are non-standard fields on DiagramPlacement but won't break anything
    } : {})),
    connections: connections.map((c) => ({
      id: c.id,
      sourcePlacementId: c.sourceShapeId ?? c.sourcePlacementId,
      targetPlacementId: c.targetShapeId ?? c.targetPlacementId,
      sourceAnchor: c.sourceAnchor,
      targetAnchor: c.targetAnchor,
      waypoints: c.waypoints,
      lineStyle: c.lineStyle,
      lineWidth: c.lineWidth,
      color: c.color
    }))
  };
}
function serializeDiagramData(data) {
  return {
    shapesJson: JSON.stringify(data),
    connectionsJson: ""
    // connections are inside the DiagramData envelope now
  };
}

// src/app/features/diagram-builder/models/diagram-placement-dto.model.ts
function dtoToPlacement(dto) {
  return {
    id: dto.localId ?? dto.id ?? 0,
    name: dto.name,
    description: dto.description,
    simRole: dto.simRole,
    simParamsJson: dto.simParamsJson,
    simEquipmentId: dto.simEquipmentId,
    sourceEntityType: dto.sourceEntityType,
    sourceEntityId: dto.sourceEntityId,
    x: dto.x ?? 0,
    y: dto.y ?? 0,
    width: dto.width ?? 100,
    height: dto.height ?? 100,
    rotation: dto.rotation,
    color: dto.color,
    fillColor: dto.fillColor,
    lineWidth: dto.lineWidth,
    label: dto.label,
    zIndex: dto.zIndex,
    locked: dto.locked,
    groupId: dto.groupId,
    type: dto.type,
    symbolId: dto.symbolId,
    svgPath: dto.svgPath,
    originalWidth: dto.originalWidth,
    originalHeight: dto.originalHeight,
    text: dto.text,
    fontSize: dto.fontSize,
    fontFamily: dto.fontFamily,
    radius: dto.radius,
    startX: dto.startX,
    startY: dto.startY,
    endX: dto.endX,
    endY: dto.endY
  };
}
function placementToDto(p, diagramId) {
  return {
    diagramId,
    localId: p.id,
    name: p.name,
    description: p.description,
    simRole: p.simRole,
    simParamsJson: p.simParamsJson,
    simEquipmentId: p.simEquipmentId,
    sourceEntityType: p.sourceEntityType,
    sourceEntityId: p.sourceEntityId,
    x: p.x,
    y: p.y,
    width: p.width,
    height: p.height,
    rotation: p.rotation,
    color: p.color,
    fillColor: p.fillColor,
    lineWidth: p.lineWidth,
    label: p.label,
    zIndex: p.zIndex,
    locked: p.locked,
    groupId: p.groupId,
    type: p.type,
    symbolId: p.symbolId,
    svgPath: p.svgPath,
    originalWidth: p.originalWidth,
    originalHeight: p.originalHeight,
    text: p.text,
    fontSize: p.fontSize,
    fontFamily: p.fontFamily,
    radius: p.radius,
    startX: p.startX,
    startY: p.startY,
    endX: p.endX,
    endY: p.endY
  };
}

// src/app/features/diagram-builder/models/diagram-connection-dto.model.ts
function dtoToConnection(dto) {
  let waypoints;
  if (dto.waypointsJson) {
    try {
      waypoints = JSON.parse(dto.waypointsJson);
    } catch {
      waypoints = void 0;
    }
  }
  return {
    id: dto.localId ?? dto.id ?? 0,
    sourcePlacementId: dto.sourcePlacementLocalId ?? 0,
    targetPlacementId: dto.targetPlacementLocalId ?? 0,
    sourceAnchor: dto.sourceAnchor ?? "right",
    targetAnchor: dto.targetAnchor ?? "left",
    sourcePort: dto.sourcePort,
    targetPort: dto.targetPort,
    pipeTemplateId: dto.pipeTemplateId,
    pipeName: dto.pipeName,
    pipeParamsJson: dto.pipeParamsJson,
    waypoints,
    lineStyle: dto.lineStyle,
    lineWidth: dto.lineWidth,
    color: dto.color
  };
}
function connectionToDto(c, diagramId) {
  return {
    diagramId,
    localId: c.id,
    sourcePlacementLocalId: c.sourcePlacementId,
    targetPlacementLocalId: c.targetPlacementId,
    sourceAnchor: c.sourceAnchor,
    targetAnchor: c.targetAnchor,
    sourcePort: c.sourcePort,
    targetPort: c.targetPort,
    pipeTemplateId: c.pipeTemplateId,
    pipeName: c.pipeName,
    pipeParamsJson: c.pipeParamsJson,
    waypointsJson: c.waypoints ? JSON.stringify(c.waypoints) : void 0,
    lineStyle: c.lineStyle,
    lineWidth: c.lineWidth,
    color: c.color
  };
}

// src/app/features/diagram-builder/services/diagram-state.service.ts
var DiagramStateService = class _DiagramStateService {
  api = inject(DiagramApiService);
  placementApi = inject(DiagramPlacementApiService);
  connectionApi = inject(DiagramConnectionApiService);
  router = inject(Router);
  currentDiagram = signal(null);
  isDirty = signal(false);
  isSaving = signal(false);
  isLoading = signal(false);
  diagramName = computed(() => this.currentDiagram()?.name ?? "Untitled Diagram");
  saveSubject = new Subject();
  shapeManager = null;
  constructor() {
    this.saveSubject.pipe(debounceTime(2e3)).subscribe(() => {
      this.saveNow();
    });
  }
  setShapeManager(manager) {
    this.shapeManager = manager;
  }
  loadDiagram(id) {
    this.isLoading.set(true);
    forkJoin({
      diagram: this.api.getById(id),
      placements: this.placementApi.getByDiagram(id),
      connections: this.connectionApi.getByDiagram(id)
    }).subscribe({
      next: ({ diagram, placements, connections }) => {
        if (!diagram.responseData) {
          this.isLoading.set(false);
          return;
        }
        this.currentDiagram.set(diagram.responseData);
        const hasEntities = placements.responseData && placements.responseData.length > 0;
        if (hasEntities && this.shapeManager) {
          const shapes = placements.responseData.map(dtoToPlacement);
          const conns = (connections.responseData ?? []).map(dtoToConnection);
          this.shapeManager.setShapes(shapes);
          this.shapeManager.setConnections(conns);
        } else if (this.shapeManager) {
          const data = normalizeDiagramData(diagram.responseData);
          this.shapeManager.setShapes(data.placements);
          this.shapeManager.setConnections(data.connections);
        }
        this.isDirty.set(false);
        this.isLoading.set(false);
      },
      error: () => {
        this.api.getById(id).subscribe({
          next: (res) => {
            if (res.responseData) {
              this.currentDiagram.set(res.responseData);
              const data = normalizeDiagramData(res.responseData);
              if (this.shapeManager) {
                this.shapeManager.setShapes(data.placements);
                this.shapeManager.setConnections(data.connections);
              }
              this.isDirty.set(false);
            }
            this.isLoading.set(false);
          },
          error: () => this.isLoading.set(false)
        });
      }
    });
  }
  createNewDiagram(name = "Untitled Diagram", context) {
    const dto = {
      name,
      canvasWidth: 1920,
      canvasHeight: 1080,
      gridSize: 20,
      shapesJson: JSON.stringify({ schemaVersion: 1, placements: [], connections: [] }),
      connectionsJson: "",
      contextFileId: context?.contextFileId,
      contextFileName: context?.contextFileName
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
          if (res.responseData.id != null) {
            this.router.navigate(["diagram-builder", "build", res.responseData.id], { replaceUrl: true });
          }
        }
      }
    });
  }
  markDirty() {
    this.isDirty.set(true);
    this.saveSubject.next();
  }
  saveNow() {
    const diagram = this.currentDiagram();
    if (!diagram || !diagram.id || !this.shapeManager)
      return;
    this.isSaving.set(true);
    const shapes = this.shapeManager.shapes();
    const connections = this.shapeManager.connections();
    const diagramId = diagram.id;
    const placementDtos = shapes.map((p) => placementToDto(p, diagramId));
    const connectionDtos = connections.map((c) => connectionToDto(c, diagramId));
    const data = { schemaVersion: 1, placements: shapes, connections };
    const serialized = serializeDiagramData(data);
    const updatedDiagram = __spreadProps(__spreadValues({}, diagram), {
      shapesJson: serialized.shapesJson,
      connectionsJson: serialized.connectionsJson
    });
    forkJoin({
      diagram: this.api.update(diagramId, updatedDiagram),
      placements: this.placementApi.bulkSave(diagramId, placementDtos),
      connections: this.connectionApi.bulkSave(diagramId, connectionDtos)
    }).subscribe({
      next: ({ diagram: diagRes }) => {
        if (diagRes.responseData) {
          this.currentDiagram.set(diagRes.responseData);
        }
        this.isDirty.set(false);
        this.isSaving.set(false);
      },
      error: () => {
        this.api.update(diagramId, updatedDiagram).subscribe({
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
    \u0275\u0275elementStart(0, "button", 17);
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
    \u0275\u0275elementStart(0, "button", 18);
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
  onSave = output();
  onGroup = output();
  onUngroup = output();
  onZoomIn = output();
  onZoomOut = output();
  onZoomFit = output();
  drawingTools = [
    { id: "select", icon: "SEL", label: "Select" },
    { id: "draw-rectangle", icon: "REC", label: "Rectangle" },
    { id: "draw-circle", icon: "CIR", label: "Circle" },
    { id: "draw-line", icon: "LIN", label: "Line" },
    { id: "draw-text", icon: "TXT", label: "Text" },
    { id: "place-symbol", icon: "SYM", label: "P&ID Symbol" },
    { id: "draw-connection", icon: "CON", label: "Connection" }
  ];
  alignmentTools = [
    { type: "left", icon: "L", label: "Align Left" },
    { type: "right", icon: "R", label: "Align Right" },
    { type: "top", icon: "T", label: "Align Top" },
    { type: "bottom", icon: "B", label: "Align Bottom" },
    { type: "h-center", icon: "HC", label: "Center Horizontal" },
    { type: "v-center", icon: "VC", label: "Center Vertical" }
  ];
  static \u0275fac = function DiagramToolbarComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _DiagramToolbarComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _DiagramToolbarComponent, selectors: [["app-diagram-toolbar"]], outputs: { onAlign: "onAlign", onDistribute: "onDistribute", onDelete: "onDelete", onSave: "onSave", onGroup: "onGroup", onUngroup: "onUngroup", onZoomIn: "onZoomIn", onZoomOut: "onZoomOut", onZoomFit: "onZoomFit" }, decls: 51, vars: 9, consts: [[1, "diagram-toolbar"], [1, "tool-group"], [1, "group-label"], [1, "tool-buttons"], [1, "tool-btn", 3, "active", "title"], [1, "tool-btn", 3, "title", "disabled"], ["title", "Distribute Horizontally", 1, "tool-btn", 3, "click", "disabled"], ["title", "Distribute Vertically", 1, "tool-btn", 3, "click", "disabled"], ["title", "Toggle Grid", 1, "tool-btn", 3, "click"], ["title", "Snap to Grid", 1, "tool-btn", 3, "click"], ["title", "Zoom In", 1, "tool-btn", 3, "click"], ["title", "Zoom Out", 1, "tool-btn", 3, "click"], ["title", "Fit to View", 1, "tool-btn", 3, "click"], ["title", "Group (Ctrl+G)", 1, "tool-btn", 3, "click", "disabled"], ["title", "Ungroup (Ctrl+Shift+G)", 1, "tool-btn", 3, "click", "disabled"], ["title", "Save", 1, "tool-btn", 3, "click"], ["title", "Delete Selected (Del)", 1, "tool-btn", "danger", 3, "click", "disabled"], [1, "tool-btn", 3, "click", "title"], [1, "tool-btn", 3, "click", "title", "disabled"]], template: function DiagramToolbarComponent_Template(rf, ctx) {
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
      \u0275\u0275text(18, "DH");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(19, "button", 7);
      \u0275\u0275listener("click", function DiagramToolbarComponent_Template_button_click_19_listener() {
        return ctx.onDistribute.emit("vertical");
      });
      \u0275\u0275text(20, "DV");
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(21, "div", 1)(22, "span", 2);
      \u0275\u0275text(23, "Canvas");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(24, "div", 3)(25, "button", 8);
      \u0275\u0275listener("click", function DiagramToolbarComponent_Template_button_click_25_listener() {
        return ctx.gridService.toggleGrid();
      });
      \u0275\u0275text(26, "G");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(27, "button", 9);
      \u0275\u0275listener("click", function DiagramToolbarComponent_Template_button_click_27_listener() {
        return ctx.gridService.toggleSnap();
      });
      \u0275\u0275text(28, "SN");
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
      \u0275\u0275text(32, "-");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(33, "button", 12);
      \u0275\u0275listener("click", function DiagramToolbarComponent_Template_button_click_33_listener() {
        return ctx.onZoomFit.emit();
      });
      \u0275\u0275text(34, "FIT");
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(35, "div", 1)(36, "span", 2);
      \u0275\u0275text(37, "Group");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(38, "div", 3)(39, "button", 13);
      \u0275\u0275listener("click", function DiagramToolbarComponent_Template_button_click_39_listener() {
        return ctx.onGroup.emit();
      });
      \u0275\u0275text(40, "GR");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(41, "button", 14);
      \u0275\u0275listener("click", function DiagramToolbarComponent_Template_button_click_41_listener() {
        return ctx.onUngroup.emit();
      });
      \u0275\u0275text(42, "UG");
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(43, "div", 1)(44, "span", 2);
      \u0275\u0275text(45, "Actions");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(46, "div", 3)(47, "button", 15);
      \u0275\u0275listener("click", function DiagramToolbarComponent_Template_button_click_47_listener() {
        return ctx.onSave.emit();
      });
      \u0275\u0275text(48, "S");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(49, "button", 16);
      \u0275\u0275listener("click", function DiagramToolbarComponent_Template_button_click_49_listener() {
        return ctx.onDelete.emit();
      });
      \u0275\u0275text(50, "X");
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
      \u0275\u0275advance(8);
      \u0275\u0275property("disabled", !ctx.shapeManager.hasSelection());
    }
  }, dependencies: [CommonModule], styles: ["\n\n.diagram-toolbar[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 12px;\n  padding: 6px 12px;\n  background: #1e1e1e;\n  border-bottom: 1px solid #333;\n  align-items: center;\n  flex-wrap: wrap;\n}\n.tool-group[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 2px;\n}\n.group-label[_ngcontent-%COMP%] {\n  font-size: 10px;\n  color: #888;\n  text-transform: uppercase;\n}\n.tool-buttons[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 2px;\n}\n.tool-btn[_ngcontent-%COMP%] {\n  min-width: 32px;\n  height: 32px;\n  border: 1px solid #444;\n  background: #2a2a2a;\n  color: #ccc;\n  border-radius: 4px;\n  cursor: pointer;\n  font-size: 11px;\n  padding: 0 6px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  transition: all 0.15s;\n}\n.tool-btn[_ngcontent-%COMP%]:hover:not(:disabled) {\n  background: #3a3a3a;\n  border-color: #666;\n}\n.tool-btn.active[_ngcontent-%COMP%] {\n  background: #1565c0;\n  border-color: #2196f3;\n  color: #fff;\n}\n.tool-btn[_ngcontent-%COMP%]:disabled {\n  opacity: 0.4;\n  cursor: not-allowed;\n}\n.tool-btn.danger[_ngcontent-%COMP%]:hover:not(:disabled) {\n  background: #c62828;\n  border-color: #f44336;\n}\n/*# sourceMappingURL=diagram-toolbar.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(DiagramToolbarComponent, { className: "DiagramToolbarComponent", filePath: "src/app/features/diagram-builder/components/diagram-toolbar/diagram-toolbar.component.ts", lineNumber: 154 });
})();

// src/app/features/diagram-builder/models/sim-equipment.model.ts
function parseSimParams(json) {
  if (!json)
    return { schemaVersion: 1 };
  try {
    const parsed = JSON.parse(json);
    if (!parsed.schemaVersion)
      parsed.schemaVersion = 1;
    return parsed;
  } catch {
    return { schemaVersion: 1 };
  }
}
function serializeSimParams(params) {
  return JSON.stringify(__spreadProps(__spreadValues({}, params), { schemaVersion: 1 }));
}
function normalizeSimRole(role) {
  switch ((role || "").toLowerCase()) {
    case "source":
      return "source";
    case "sink":
      return "sink";
    case "valve":
      return "valve";
    case "pump":
      return "pump";
    case "pipe":
      return "pipe";
    case "vessel":
      return "vessel";
    case "instrument":
      return "instrument";
    case "motor":
      return "motor";
    case "three-way-valve":
      return "three-way-valve";
    case "selector-valve":
      return "selector-valve";
    case "pressure-regulator":
      return "pressure-regulator";
    case "filter":
      return "filter";
    case "bearing":
      return "bearing";
    case "heater":
      return "heater";
    case "vapor-extractor":
      return "vapor-extractor";
    case "heat-exchanger":
      return "heat-exchanger";
    case "accumulator":
      return "accumulator";
    case "junction":
    default:
      return "junction";
  }
}
function defaultSimParams(role) {
  const base = { schemaVersion: 1 };
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
      base.maxFlow = 1e4;
      base.minInletPressure = 10;
      break;
    case "pipe":
      base.diameter = 12;
      base.length = 50;
      base.frictionFactor = 0.02;
      base.insulationFactor = 0;
      break;
    case "vessel":
      base.volume = 1e3;
      base.maxPressure = 3e3;
      base.currentLevel = 50;
      base.minLevel = 0;
      base.sourcePressure = 15;
      break;
    case "instrument":
      base.measuredProperty = "pressure";
      break;
    case "motor":
      base.running = true;
      base.power = 500;
      break;
    case "three-way-valve":
      base.threeWayPosition = 50;
      break;
    case "selector-valve":
      base.selectedPort = "A";
      break;
    case "pressure-regulator":
      base.setpointPressure = 50;
      base.regulatorMaxFlow = 1e4;
      break;
    case "filter":
      base.filterDeltaP = 5;
      break;
    case "bearing":
      base.bearingFlowRequired = 100;
      base.bearingMaxTemp = 180;
      base.bearingTemp = 200;
      base.heatTransferCoeff = 0.3;
      break;
    case "heater":
      base.heaterRunning = false;
      base.heaterDeltaT = 50;
      break;
    case "vapor-extractor":
      base.extractorRunning = true;
      base.extractorPressureReduction = 2;
      break;
    case "accumulator":
      base.accumulatorSetPressure = 50;
      base.accumulatorDamping = 0.3;
      break;
    case "heat-exchanger":
      base.hxEffectiveness = 0.7;
      break;
  }
  return base;
}
var SYMBOL_ROLE_MAP = {
  "manual-valve": "valve",
  "gate-valve": "valve",
  "globe-valve": "valve",
  "check-valve": "valve",
  "ball-valve": "valve",
  "butterfly-valve": "valve",
  "relief-valve": "valve",
  "mov": "valve",
  "aov": "valve",
  "cv": "valve",
  "bypass-line-2-valves": "valve",
  "centrifugal-pump": "pump",
  "vertical-pump": "pump",
  "positive-displacement-pump": "pump",
  "compressor": "pump",
  "heat-exchanger": "heat-exchanger",
  "horizontal-vessel": "vessel",
  "vertical-vessel": "vessel",
  "tank": "vessel",
  "pressure-indicator": "instrument",
  "pressure-transmitter": "instrument",
  "temperature-indicator": "instrument",
  "flow-indicator": "instrument",
  "level-indicator": "instrument",
  "motor": "motor",
  "generator": "motor",
  "transformer": "motor",
  "breaker": "motor",
  "switchgear": "motor",
  // Rotating equipment
  "generator-body": "vessel",
  "shaft-seal": "vessel",
  "bearing-housing": "bearing",
  "exciter": "junction",
  "drain-pot": "vessel",
  "float-trap": "valve",
  "vacuum-pump": "pump",
  "detraining-tank": "vessel",
  "vapor-extractor": "vapor-extractor",
  "filter": "filter",
  "seal-drain-tray": "vessel",
  "vacuum-tank-horizontal": "vessel",
  "expansion-tank": "vessel",
  "three-way-valve": "three-way-valve",
  "square-tank": "vessel"
};

// src/app/features/diagram-builder/services/sim-equipment-api.service.ts
var SimEquipmentApiService = class _SimEquipmentApiService {
  http = inject(HttpClient);
  baseUrl = `${environment.apiUrl}/sim-equipment`;
  equipmentMap = signal(/* @__PURE__ */ new Map());
  equipmentList = computed(() => [...this.equipmentMap().values()]);
  getAll() {
    return this.http.get(`${this.baseUrl}/get-all`);
  }
  getById(id) {
    return this.http.get(`${this.baseUrl}/get-by-id/${id}`);
  }
  search(query) {
    return this.http.get(`${this.baseUrl}/search`, {
      params: { q: query }
    });
  }
  findBySource(type, id) {
    return this.http.get(`${this.baseUrl}/by-source`, {
      params: { type, id: id.toString() }
    });
  }
  create(dto) {
    return this.http.post(this.baseUrl, dto);
  }
  fromLotoPoint(lotoPointId) {
    return this.http.post(`${this.baseUrl}/from-loto-point/${lotoPointId}`, {});
  }
  fromEquipment(equipmentId) {
    return this.http.post(`${this.baseUrl}/from-equipment/${equipmentId}`, {});
  }
  update(id, dto) {
    return this.http.put(`${this.baseUrl}/${id}`, dto);
  }
  delete(id) {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
  loadAllIntoCache() {
    this.getAll().subscribe({
      next: (res) => {
        const next = /* @__PURE__ */ new Map();
        for (const eq of res.responseData || []) {
          if (eq.id != null)
            next.set(eq.id, eq);
        }
        this.equipmentMap.set(next);
      }
    });
  }
  upsertCached(dto) {
    if (dto.id == null)
      return;
    this.equipmentMap.update((current) => {
      const next = new Map(current);
      next.set(dto.id, dto);
      return next;
    });
  }
  removeCached(id) {
    this.equipmentMap.update((current) => {
      const next = new Map(current);
      next.delete(id);
      return next;
    });
  }
  getCachedById(id) {
    if (id == null)
      return null;
    return this.equipmentMap().get(id) ?? null;
  }
  static \u0275fac = function SimEquipmentApiService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _SimEquipmentApiService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _SimEquipmentApiService, factory: _SimEquipmentApiService.\u0275fac, providedIn: "root" });
};

// src/app/features/diagram-builder/components/diagram-properties/diagram-properties.component.ts
var _forTrack02 = ($index, $item) => $item.id;
function DiagramPropertiesComponent_Conditional_3_For_13_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "option", 5);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const role_r4 = ctx.$implicit;
    \u0275\u0275property("value", role_r4);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(role_r4);
  }
}
function DiagramPropertiesComponent_Conditional_3_Conditional_17_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "label");
    \u0275\u0275text(1, "Pressure ");
    \u0275\u0275elementStart(2, "input", 7);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_3_Conditional_17_Template_input_ngModelChange_2_listener($event) {
      \u0275\u0275restoreView(_r5);
      const shape_r2 = \u0275\u0275nextContext();
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateShapeParam(shape_r2, "sourcePressure", $event));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(3, "label");
    \u0275\u0275text(4, "Temperature ");
    \u0275\u0275elementStart(5, "input", 7);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_3_Conditional_17_Template_input_ngModelChange_5_listener($event) {
      \u0275\u0275restoreView(_r5);
      const shape_r2 = \u0275\u0275nextContext();
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateShapeParam(shape_r2, "sourceTemperature", $event));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(6, "label");
    \u0275\u0275text(7, "Flow Rate ");
    \u0275\u0275elementStart(8, "input", 7);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_3_Conditional_17_Template_input_ngModelChange_8_listener($event) {
      \u0275\u0275restoreView(_r5);
      const shape_r2 = \u0275\u0275nextContext();
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateShapeParam(shape_r2, "sourceFlowRate", $event));
    });
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    let tmp_3_0;
    let tmp_4_0;
    let tmp_5_0;
    const shape_r2 = \u0275\u0275nextContext();
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275property("ngModel", (tmp_3_0 = ctx_r2.shapeParams(shape_r2).sourcePressure) !== null && tmp_3_0 !== void 0 ? tmp_3_0 : 100);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", (tmp_4_0 = ctx_r2.shapeParams(shape_r2).sourceTemperature) !== null && tmp_4_0 !== void 0 ? tmp_4_0 : 500);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", (tmp_5_0 = ctx_r2.shapeParams(shape_r2).sourceFlowRate) !== null && tmp_5_0 !== void 0 ? tmp_5_0 : 1e4);
  }
}
function DiagramPropertiesComponent_Conditional_3_Conditional_18_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "label");
    \u0275\u0275text(1, "Position ");
    \u0275\u0275elementStart(2, "select", 4);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_3_Conditional_18_Template_select_ngModelChange_2_listener($event) {
      \u0275\u0275restoreView(_r6);
      const shape_r2 = \u0275\u0275nextContext();
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateShapeParam(shape_r2, "valvePosition", $event));
    });
    \u0275\u0275elementStart(3, "option", 17);
    \u0275\u0275text(4, "open");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "option", 18);
    \u0275\u0275text(6, "throttled");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "option", 19);
    \u0275\u0275text(8, "closed");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(9, "label");
    \u0275\u0275text(10, "Throttle % ");
    \u0275\u0275elementStart(11, "input", 9);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_3_Conditional_18_Template_input_ngModelChange_11_listener($event) {
      \u0275\u0275restoreView(_r6);
      const shape_r2 = \u0275\u0275nextContext();
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateShapeParam(shape_r2, "throttlePercent", $event));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(12, "label");
    \u0275\u0275text(13, "Cv ");
    \u0275\u0275elementStart(14, "input", 7);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_3_Conditional_18_Template_input_ngModelChange_14_listener($event) {
      \u0275\u0275restoreView(_r6);
      const shape_r2 = \u0275\u0275nextContext();
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateShapeParam(shape_r2, "cvCoefficient", ctx_r2.toNumberOrUndefined($event)));
    });
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    let tmp_3_0;
    let tmp_4_0;
    let tmp_7_0;
    const shape_r2 = \u0275\u0275nextContext();
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275property("ngModel", (tmp_3_0 = ctx_r2.shapeParams(shape_r2).valvePosition) !== null && tmp_3_0 !== void 0 ? tmp_3_0 : "open");
    \u0275\u0275advance(9);
    \u0275\u0275property("ngModel", (tmp_4_0 = ctx_r2.shapeParams(shape_r2).throttlePercent) !== null && tmp_4_0 !== void 0 ? tmp_4_0 : 50)("min", 0)("max", 100);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", (tmp_7_0 = ctx_r2.shapeParams(shape_r2).cvCoefficient) !== null && tmp_7_0 !== void 0 ? tmp_7_0 : "");
  }
}
function DiagramPropertiesComponent_Conditional_3_Conditional_19_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "label");
    \u0275\u0275text(1, "Running ");
    \u0275\u0275elementStart(2, "input", 20);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_3_Conditional_19_Template_input_ngModelChange_2_listener($event) {
      \u0275\u0275restoreView(_r7);
      const shape_r2 = \u0275\u0275nextContext();
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateShapeParam(shape_r2, "pumpRunning", $event));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(3, "label");
    \u0275\u0275text(4, "Delta P ");
    \u0275\u0275elementStart(5, "input", 7);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_3_Conditional_19_Template_input_ngModelChange_5_listener($event) {
      \u0275\u0275restoreView(_r7);
      const shape_r2 = \u0275\u0275nextContext();
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateShapeParam(shape_r2, "pumpDeltaP", $event));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(6, "label");
    \u0275\u0275text(7, "Max Flow ");
    \u0275\u0275elementStart(8, "input", 7);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_3_Conditional_19_Template_input_ngModelChange_8_listener($event) {
      \u0275\u0275restoreView(_r7);
      const shape_r2 = \u0275\u0275nextContext();
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateShapeParam(shape_r2, "maxFlow", $event));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(9, "label");
    \u0275\u0275text(10, "Min Inlet P ");
    \u0275\u0275elementStart(11, "input", 7);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_3_Conditional_19_Template_input_ngModelChange_11_listener($event) {
      \u0275\u0275restoreView(_r7);
      const shape_r2 = \u0275\u0275nextContext();
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateShapeParam(shape_r2, "minInletPressure", $event));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(12, "label");
    \u0275\u0275text(13, "Efficiency ");
    \u0275\u0275elementStart(14, "input", 7);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_3_Conditional_19_Template_input_ngModelChange_14_listener($event) {
      \u0275\u0275restoreView(_r7);
      const shape_r2 = \u0275\u0275nextContext();
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateShapeParam(shape_r2, "pumpEfficiency", ctx_r2.toNumberOrUndefined($event)));
    });
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    let tmp_3_0;
    let tmp_4_0;
    let tmp_5_0;
    let tmp_6_0;
    let tmp_7_0;
    const shape_r2 = \u0275\u0275nextContext();
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275property("ngModel", (tmp_3_0 = ctx_r2.shapeParams(shape_r2).pumpRunning) !== null && tmp_3_0 !== void 0 ? tmp_3_0 : true);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", (tmp_4_0 = ctx_r2.shapeParams(shape_r2).pumpDeltaP) !== null && tmp_4_0 !== void 0 ? tmp_4_0 : 50);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", (tmp_5_0 = ctx_r2.shapeParams(shape_r2).maxFlow) !== null && tmp_5_0 !== void 0 ? tmp_5_0 : 1e4);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", (tmp_6_0 = ctx_r2.shapeParams(shape_r2).minInletPressure) !== null && tmp_6_0 !== void 0 ? tmp_6_0 : 10);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", (tmp_7_0 = ctx_r2.shapeParams(shape_r2).pumpEfficiency) !== null && tmp_7_0 !== void 0 ? tmp_7_0 : "");
  }
}
function DiagramPropertiesComponent_Conditional_3_Conditional_20_Template(rf, ctx) {
  if (rf & 1) {
    const _r8 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "label");
    \u0275\u0275text(1, "Volume ");
    \u0275\u0275elementStart(2, "input", 7);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_3_Conditional_20_Template_input_ngModelChange_2_listener($event) {
      \u0275\u0275restoreView(_r8);
      const shape_r2 = \u0275\u0275nextContext();
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateShapeParam(shape_r2, "volume", $event));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(3, "label");
    \u0275\u0275text(4, "Current Level % ");
    \u0275\u0275elementStart(5, "input", 9);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_3_Conditional_20_Template_input_ngModelChange_5_listener($event) {
      \u0275\u0275restoreView(_r8);
      const shape_r2 = \u0275\u0275nextContext();
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateShapeParam(shape_r2, "currentLevel", $event));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(6, "label");
    \u0275\u0275text(7, "Min Level % ");
    \u0275\u0275elementStart(8, "input", 9);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_3_Conditional_20_Template_input_ngModelChange_8_listener($event) {
      \u0275\u0275restoreView(_r8);
      const shape_r2 = \u0275\u0275nextContext();
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateShapeParam(shape_r2, "minLevel", $event));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(9, "label");
    \u0275\u0275text(10, "Max Pressure ");
    \u0275\u0275elementStart(11, "input", 7);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_3_Conditional_20_Template_input_ngModelChange_11_listener($event) {
      \u0275\u0275restoreView(_r8);
      const shape_r2 = \u0275\u0275nextContext();
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateShapeParam(shape_r2, "maxPressure", $event));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(12, "label");
    \u0275\u0275text(13, "Head Pressure ");
    \u0275\u0275elementStart(14, "input", 7);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_3_Conditional_20_Template_input_ngModelChange_14_listener($event) {
      \u0275\u0275restoreView(_r8);
      const shape_r2 = \u0275\u0275nextContext();
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateShapeParam(shape_r2, "sourcePressure", $event));
    });
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    let tmp_3_0;
    let tmp_4_0;
    let tmp_7_0;
    let tmp_10_0;
    let tmp_11_0;
    const shape_r2 = \u0275\u0275nextContext();
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275property("ngModel", (tmp_3_0 = ctx_r2.shapeParams(shape_r2).volume) !== null && tmp_3_0 !== void 0 ? tmp_3_0 : 1e3);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", (tmp_4_0 = ctx_r2.shapeParams(shape_r2).currentLevel) !== null && tmp_4_0 !== void 0 ? tmp_4_0 : 50)("min", 0)("max", 100);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", (tmp_7_0 = ctx_r2.shapeParams(shape_r2).minLevel) !== null && tmp_7_0 !== void 0 ? tmp_7_0 : 0)("min", 0)("max", 100);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", (tmp_10_0 = ctx_r2.shapeParams(shape_r2).maxPressure) !== null && tmp_10_0 !== void 0 ? tmp_10_0 : 3e3);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", (tmp_11_0 = ctx_r2.shapeParams(shape_r2).sourcePressure) !== null && tmp_11_0 !== void 0 ? tmp_11_0 : 15);
  }
}
function DiagramPropertiesComponent_Conditional_3_Conditional_21_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "label");
    \u0275\u0275text(1, "Measured Property ");
    \u0275\u0275elementStart(2, "select", 4);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_3_Conditional_21_Template_select_ngModelChange_2_listener($event) {
      \u0275\u0275restoreView(_r9);
      const shape_r2 = \u0275\u0275nextContext();
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateShapeParam(shape_r2, "measuredProperty", $event));
    });
    \u0275\u0275elementStart(3, "option", 21);
    \u0275\u0275text(4, "pressure");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "option", 22);
    \u0275\u0275text(6, "temperature");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "option", 23);
    \u0275\u0275text(8, "flow");
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    let tmp_3_0;
    const shape_r2 = \u0275\u0275nextContext();
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275property("ngModel", (tmp_3_0 = ctx_r2.shapeParams(shape_r2).measuredProperty) !== null && tmp_3_0 !== void 0 ? tmp_3_0 : "pressure");
  }
}
function DiagramPropertiesComponent_Conditional_3_Conditional_22_Template(rf, ctx) {
  if (rf & 1) {
    const _r10 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "label");
    \u0275\u0275text(1, "Running ");
    \u0275\u0275elementStart(2, "input", 20);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_3_Conditional_22_Template_input_ngModelChange_2_listener($event) {
      \u0275\u0275restoreView(_r10);
      const shape_r2 = \u0275\u0275nextContext();
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateShapeParam(shape_r2, "running", $event));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(3, "label");
    \u0275\u0275text(4, "Power ");
    \u0275\u0275elementStart(5, "input", 7);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_3_Conditional_22_Template_input_ngModelChange_5_listener($event) {
      \u0275\u0275restoreView(_r10);
      const shape_r2 = \u0275\u0275nextContext();
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateShapeParam(shape_r2, "power", $event));
    });
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    let tmp_3_0;
    let tmp_4_0;
    const shape_r2 = \u0275\u0275nextContext();
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275property("ngModel", (tmp_3_0 = ctx_r2.shapeParams(shape_r2).running) !== null && tmp_3_0 !== void 0 ? tmp_3_0 : true);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", (tmp_4_0 = ctx_r2.shapeParams(shape_r2).power) !== null && tmp_4_0 !== void 0 ? tmp_4_0 : 500);
  }
}
function DiagramPropertiesComponent_Conditional_3_Conditional_23_Template(rf, ctx) {
  if (rf & 1) {
    const _r11 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "label");
    \u0275\u0275text(1, "Diameter ");
    \u0275\u0275elementStart(2, "input", 7);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_3_Conditional_23_Template_input_ngModelChange_2_listener($event) {
      \u0275\u0275restoreView(_r11);
      const shape_r2 = \u0275\u0275nextContext();
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateShapeParam(shape_r2, "diameter", $event));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(3, "label");
    \u0275\u0275text(4, "Length ");
    \u0275\u0275elementStart(5, "input", 7);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_3_Conditional_23_Template_input_ngModelChange_5_listener($event) {
      \u0275\u0275restoreView(_r11);
      const shape_r2 = \u0275\u0275nextContext();
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateShapeParam(shape_r2, "length", $event));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(6, "label");
    \u0275\u0275text(7, "Friction ");
    \u0275\u0275elementStart(8, "input", 24);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_3_Conditional_23_Template_input_ngModelChange_8_listener($event) {
      \u0275\u0275restoreView(_r11);
      const shape_r2 = \u0275\u0275nextContext();
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateShapeParam(shape_r2, "frictionFactor", $event));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(9, "label");
    \u0275\u0275text(10, "Insulation ");
    \u0275\u0275elementStart(11, "input", 24);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_3_Conditional_23_Template_input_ngModelChange_11_listener($event) {
      \u0275\u0275restoreView(_r11);
      const shape_r2 = \u0275\u0275nextContext();
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateShapeParam(shape_r2, "insulationFactor", $event));
    });
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    let tmp_3_0;
    let tmp_4_0;
    let tmp_5_0;
    let tmp_6_0;
    const shape_r2 = \u0275\u0275nextContext();
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275property("ngModel", (tmp_3_0 = ctx_r2.shapeParams(shape_r2).diameter) !== null && tmp_3_0 !== void 0 ? tmp_3_0 : 12);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", (tmp_4_0 = ctx_r2.shapeParams(shape_r2).length) !== null && tmp_4_0 !== void 0 ? tmp_4_0 : 50);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", (tmp_5_0 = ctx_r2.shapeParams(shape_r2).frictionFactor) !== null && tmp_5_0 !== void 0 ? tmp_5_0 : 0.02);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", (tmp_6_0 = ctx_r2.shapeParams(shape_r2).insulationFactor) !== null && tmp_6_0 !== void 0 ? tmp_6_0 : 0);
  }
}
function DiagramPropertiesComponent_Conditional_3_Conditional_24_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 6);
    \u0275\u0275text(1, "This role has no required custom parameters yet.");
    \u0275\u0275elementEnd();
  }
}
function DiagramPropertiesComponent_Conditional_3_Conditional_65_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0);
  }
  if (rf & 2) {
    const shape_r2 = \u0275\u0275nextContext();
    \u0275\u0275textInterpolate1(" :", shape_r2.sourceEntityId, " ");
  }
}
function DiagramPropertiesComponent_Conditional_3_Conditional_67_Template(rf, ctx) {
  if (rf & 1) {
    const _r12 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 25);
    \u0275\u0275listener("click", function DiagramPropertiesComponent_Conditional_3_Conditional_67_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r12);
      const shape_r2 = \u0275\u0275nextContext();
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.saveReusableDefinition(shape_r2));
    });
    \u0275\u0275text(1, " Update Reusable Definition ");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275property("disabled", ctx_r2.saveLibraryBusy());
  }
}
function DiagramPropertiesComponent_Conditional_3_Conditional_68_Template(rf, ctx) {
  if (rf & 1) {
    const _r13 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 25);
    \u0275\u0275listener("click", function DiagramPropertiesComponent_Conditional_3_Conditional_68_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r13);
      const shape_r2 = \u0275\u0275nextContext();
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.saveReusableDefinition(shape_r2));
    });
    \u0275\u0275text(1, " Save As Reusable Equipment ");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275property("disabled", ctx_r2.saveLibraryBusy());
  }
}
function DiagramPropertiesComponent_Conditional_3_Conditional_71_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 6);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r2.saveLibraryMessage());
  }
}
function DiagramPropertiesComponent_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 1)(1, "h4");
    \u0275\u0275text(2, "Equipment");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "label");
    \u0275\u0275text(4, "Name ");
    \u0275\u0275elementStart(5, "input", 3);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_3_Template_input_ngModelChange_5_listener($event) {
      const shape_r2 = \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateShape(shape_r2.id, { name: $event, label: $event || void 0 }));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(6, "label");
    \u0275\u0275text(7, "Description ");
    \u0275\u0275elementStart(8, "textarea", 4);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_3_Template_textarea_ngModelChange_8_listener($event) {
      const shape_r2 = \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateShape(shape_r2.id, { description: $event || void 0 }));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(9, "label");
    \u0275\u0275text(10, "Role ");
    \u0275\u0275elementStart(11, "select", 4);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_3_Template_select_ngModelChange_11_listener($event) {
      const shape_r2 = \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateShapeRole(shape_r2, $event));
    });
    \u0275\u0275repeaterCreate(12, DiagramPropertiesComponent_Conditional_3_For_13_Template, 2, 2, "option", 5, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(14, "div", 1)(15, "h4");
    \u0275\u0275text(16, "Behavior");
    \u0275\u0275elementEnd();
    \u0275\u0275template(17, DiagramPropertiesComponent_Conditional_3_Conditional_17_Template, 9, 3)(18, DiagramPropertiesComponent_Conditional_3_Conditional_18_Template, 15, 5)(19, DiagramPropertiesComponent_Conditional_3_Conditional_19_Template, 15, 5)(20, DiagramPropertiesComponent_Conditional_3_Conditional_20_Template, 15, 9)(21, DiagramPropertiesComponent_Conditional_3_Conditional_21_Template, 9, 1, "label")(22, DiagramPropertiesComponent_Conditional_3_Conditional_22_Template, 6, 2)(23, DiagramPropertiesComponent_Conditional_3_Conditional_23_Template, 12, 4)(24, DiagramPropertiesComponent_Conditional_3_Conditional_24_Template, 2, 0, "p", 6);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(25, "div", 1)(26, "h4");
    \u0275\u0275text(27, "Placement");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(28, "label");
    \u0275\u0275text(29, "X ");
    \u0275\u0275elementStart(30, "input", 7);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_3_Template_input_ngModelChange_30_listener($event) {
      const shape_r2 = \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateShape(shape_r2.id, { x: $event }));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(31, "label");
    \u0275\u0275text(32, "Y ");
    \u0275\u0275elementStart(33, "input", 7);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_3_Template_input_ngModelChange_33_listener($event) {
      const shape_r2 = \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateShape(shape_r2.id, { y: $event }));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(34, "label");
    \u0275\u0275text(35, "Width ");
    \u0275\u0275elementStart(36, "input", 8);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_3_Template_input_ngModelChange_36_listener($event) {
      const shape_r2 = \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateShape(shape_r2.id, { width: $event }));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(37, "label");
    \u0275\u0275text(38, "Height ");
    \u0275\u0275elementStart(39, "input", 8);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_3_Template_input_ngModelChange_39_listener($event) {
      const shape_r2 = \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateShape(shape_r2.id, { height: $event }));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(40, "label");
    \u0275\u0275text(41, "Rotation ");
    \u0275\u0275elementStart(42, "input", 9);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_3_Template_input_ngModelChange_42_listener($event) {
      const shape_r2 = \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateShape(shape_r2.id, { rotation: $event }));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(43, "label");
    \u0275\u0275text(44, "Color ");
    \u0275\u0275elementStart(45, "input", 10);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_3_Template_input_ngModelChange_45_listener($event) {
      const shape_r2 = \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateShape(shape_r2.id, { color: $event }));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(46, "label");
    \u0275\u0275text(47, "Fill ");
    \u0275\u0275elementStart(48, "input", 10);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_3_Template_input_ngModelChange_48_listener($event) {
      const shape_r2 = \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateShape(shape_r2.id, { fillColor: $event }));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(49, "label");
    \u0275\u0275text(50, "Line Width ");
    \u0275\u0275elementStart(51, "input", 9);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_3_Template_input_ngModelChange_51_listener($event) {
      const shape_r2 = \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateShape(shape_r2.id, { lineWidth: $event }));
    });
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(52, "div", 1)(53, "h4");
    \u0275\u0275text(54, "Metadata");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(55, "div", 11)(56, "span", 12);
    \u0275\u0275text(57, "Template");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(58, "span", 13);
    \u0275\u0275text(59);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(60, "div", 11)(61, "span", 12);
    \u0275\u0275text(62, "Source");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(63, "span", 13);
    \u0275\u0275text(64);
    \u0275\u0275template(65, DiagramPropertiesComponent_Conditional_3_Conditional_65_Template, 1, 1);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(66, "div", 14);
    \u0275\u0275template(67, DiagramPropertiesComponent_Conditional_3_Conditional_67_Template, 2, 1, "button", 15)(68, DiagramPropertiesComponent_Conditional_3_Conditional_68_Template, 2, 1, "button", 15);
    \u0275\u0275elementStart(69, "button", 16);
    \u0275\u0275listener("click", function DiagramPropertiesComponent_Conditional_3_Template_button_click_69_listener() {
      const shape_r2 = \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.saveReusableDefinition(shape_r2, true));
    });
    \u0275\u0275text(70, " Save As New Copy ");
    \u0275\u0275elementEnd()();
    \u0275\u0275template(71, DiagramPropertiesComponent_Conditional_3_Conditional_71_Template, 2, 1, "p", 6);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const shape_r2 = ctx;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(5);
    \u0275\u0275property("ngModel", shape_r2.name || "");
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", shape_r2.description || "");
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", ctx_r2.shapeRole(shape_r2));
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r2.roles);
    \u0275\u0275advance(5);
    \u0275\u0275conditional(ctx_r2.shapeRole(shape_r2) === "source" ? 17 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r2.shapeRole(shape_r2) === "valve" ? 18 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r2.shapeRole(shape_r2) === "pump" ? 19 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r2.shapeRole(shape_r2) === "vessel" ? 20 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r2.shapeRole(shape_r2) === "instrument" ? 21 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r2.shapeRole(shape_r2) === "motor" ? 22 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r2.shapeRole(shape_r2) === "pipe" ? 23 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r2.shapeRole(shape_r2) === "sink" || ctx_r2.shapeRole(shape_r2) === "junction" ? 24 : -1);
    \u0275\u0275advance(6);
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
    \u0275\u0275advance(8);
    \u0275\u0275textInterpolate(ctx_r2.templateName(shape_r2));
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate1(" ", shape_r2.sourceEntityType || "Custom", " ");
    \u0275\u0275advance();
    \u0275\u0275conditional(shape_r2.sourceEntityId ? 65 : -1);
    \u0275\u0275advance(2);
    \u0275\u0275conditional(shape_r2.simEquipmentId ? 67 : 68);
    \u0275\u0275advance(2);
    \u0275\u0275property("disabled", ctx_r2.saveLibraryBusy());
    \u0275\u0275advance(2);
    \u0275\u0275conditional(ctx_r2.saveLibraryMessage() ? 71 : -1);
  }
}
function DiagramPropertiesComponent_Conditional_4_For_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "option", 5);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const pipe_r15 = ctx.$implicit;
    \u0275\u0275property("value", pipe_r15.id);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(pipe_r15.name || "Pipe #" + pipe_r15.id);
  }
}
function DiagramPropertiesComponent_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r14 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 1)(1, "h4");
    \u0275\u0275text(2, "Connection Pipe");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "label");
    \u0275\u0275text(4, "Pipe Template ");
    \u0275\u0275elementStart(5, "select", 4);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_4_Template_select_ngModelChange_5_listener($event) {
      \u0275\u0275restoreView(_r14);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.applyPipeTemplate(ctx_r2.shapeManager.singleSelectedConnection().id, ctx_r2.toNumberOrUndefined($event)));
    });
    \u0275\u0275elementStart(6, "option", 26);
    \u0275\u0275text(7, "None");
    \u0275\u0275elementEnd();
    \u0275\u0275repeaterCreate(8, DiagramPropertiesComponent_Conditional_4_For_9_Template, 2, 2, "option", 5, _forTrack02);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(10, "label");
    \u0275\u0275text(11, "Pipe Name ");
    \u0275\u0275elementStart(12, "input", 3);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_4_Template_input_ngModelChange_12_listener($event) {
      \u0275\u0275restoreView(_r14);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateConnection(ctx_r2.shapeManager.singleSelectedConnection().id, { pipeName: $event || void 0 }));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(13, "label");
    \u0275\u0275text(14, "Length ");
    \u0275\u0275elementStart(15, "input", 7);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_4_Template_input_ngModelChange_15_listener($event) {
      \u0275\u0275restoreView(_r14);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateConnectionParam(ctx_r2.shapeManager.singleSelectedConnection(), "length", $event));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(16, "label");
    \u0275\u0275text(17, "Diameter ");
    \u0275\u0275elementStart(18, "input", 7);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_4_Template_input_ngModelChange_18_listener($event) {
      \u0275\u0275restoreView(_r14);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateConnectionParam(ctx_r2.shapeManager.singleSelectedConnection(), "diameter", $event));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(19, "label");
    \u0275\u0275text(20, "Friction ");
    \u0275\u0275elementStart(21, "input", 24);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_4_Template_input_ngModelChange_21_listener($event) {
      \u0275\u0275restoreView(_r14);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateConnectionParam(ctx_r2.shapeManager.singleSelectedConnection(), "frictionFactor", $event));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(22, "label");
    \u0275\u0275text(23, "Insulation ");
    \u0275\u0275elementStart(24, "input", 24);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_4_Template_input_ngModelChange_24_listener($event) {
      \u0275\u0275restoreView(_r14);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateConnectionParam(ctx_r2.shapeManager.singleSelectedConnection(), "insulationFactor", $event));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(25, "label");
    \u0275\u0275text(26, "Color ");
    \u0275\u0275elementStart(27, "input", 10);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_4_Template_input_ngModelChange_27_listener($event) {
      \u0275\u0275restoreView(_r14);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateConnection(ctx_r2.shapeManager.singleSelectedConnection().id, { color: $event }));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(28, "label");
    \u0275\u0275text(29, "Line Width ");
    \u0275\u0275elementStart(30, "input", 9);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_4_Template_input_ngModelChange_30_listener($event) {
      \u0275\u0275restoreView(_r14);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateConnection(ctx_r2.shapeManager.singleSelectedConnection().id, { lineWidth: $event }));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(31, "h4");
    \u0275\u0275text(32, "Port Assignment");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(33, "label");
    \u0275\u0275text(34, "Source Port ");
    \u0275\u0275elementStart(35, "select", 4);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_4_Template_select_ngModelChange_35_listener($event) {
      \u0275\u0275restoreView(_r14);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateConnection(ctx_r2.shapeManager.singleSelectedConnection().id, { sourcePort: $event || void 0 }));
    });
    \u0275\u0275elementStart(36, "option", 26);
    \u0275\u0275text(37, "Default");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(38, "option", 27);
    \u0275\u0275text(39, "A");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(40, "option", 28);
    \u0275\u0275text(41, "B");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(42, "label");
    \u0275\u0275text(43, "Target Port ");
    \u0275\u0275elementStart(44, "select", 4);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_4_Template_select_ngModelChange_44_listener($event) {
      \u0275\u0275restoreView(_r14);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.updateConnection(ctx_r2.shapeManager.singleSelectedConnection().id, { targetPort: $event || void 0 }));
    });
    \u0275\u0275elementStart(45, "option", 26);
    \u0275\u0275text(46, "Default");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(47, "option", 27);
    \u0275\u0275text(48, "A");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(49, "option", 28);
    \u0275\u0275text(50, "B");
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    let tmp_1_0;
    let tmp_4_0;
    let tmp_5_0;
    let tmp_6_0;
    let tmp_7_0;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(5);
    \u0275\u0275property("ngModel", (tmp_1_0 = ctx_r2.shapeManager.singleSelectedConnection().pipeTemplateId) !== null && tmp_1_0 !== void 0 ? tmp_1_0 : "");
    \u0275\u0275advance(3);
    \u0275\u0275repeater(ctx_r2.pipeTemplates());
    \u0275\u0275advance(4);
    \u0275\u0275property("ngModel", ctx_r2.shapeManager.singleSelectedConnection().pipeName || "");
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", (tmp_4_0 = ctx_r2.connectionParams(ctx_r2.shapeManager.singleSelectedConnection()).length) !== null && tmp_4_0 !== void 0 ? tmp_4_0 : "");
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", (tmp_5_0 = ctx_r2.connectionParams(ctx_r2.shapeManager.singleSelectedConnection()).diameter) !== null && tmp_5_0 !== void 0 ? tmp_5_0 : "");
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", (tmp_6_0 = ctx_r2.connectionParams(ctx_r2.shapeManager.singleSelectedConnection()).frictionFactor) !== null && tmp_6_0 !== void 0 ? tmp_6_0 : "");
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", (tmp_7_0 = ctx_r2.connectionParams(ctx_r2.shapeManager.singleSelectedConnection()).insulationFactor) !== null && tmp_7_0 !== void 0 ? tmp_7_0 : "");
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", ctx_r2.shapeManager.singleSelectedConnection().color || "#888888");
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", ctx_r2.shapeManager.singleSelectedConnection().lineWidth || 2)("min", 1)("max", 20);
    \u0275\u0275advance(5);
    \u0275\u0275property("ngModel", ctx_r2.shapeManager.singleSelectedConnection().sourcePort || "");
    \u0275\u0275advance(9);
    \u0275\u0275property("ngModel", ctx_r2.shapeManager.singleSelectedConnection().targetPort || "");
  }
}
function DiagramPropertiesComponent_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 2);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("", ctx_r2.shapeManager.selectedShapes().length, " shapes selected");
  }
}
function DiagramPropertiesComponent_Conditional_6_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r16 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 1)(1, "h4");
    \u0275\u0275text(2, "Diagram");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "label");
    \u0275\u0275text(4, "Name ");
    \u0275\u0275elementStart(5, "input", 3);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_6_Conditional_0_Template_input_ngModelChange_5_listener($event) {
      \u0275\u0275restoreView(_r16);
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.stateService.updateDiagramMeta({ name: $event }));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(6, "label");
    \u0275\u0275text(7, "Description ");
    \u0275\u0275elementStart(8, "textarea", 4);
    \u0275\u0275listener("ngModelChange", function DiagramPropertiesComponent_Conditional_6_Conditional_0_Template_textarea_ngModelChange_8_listener($event) {
      \u0275\u0275restoreView(_r16);
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.stateService.updateDiagramMeta({ description: $event }));
    });
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const diagram_r17 = ctx;
    \u0275\u0275advance(5);
    \u0275\u0275property("ngModel", diagram_r17.name);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", diagram_r17.description);
  }
}
function DiagramPropertiesComponent_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, DiagramPropertiesComponent_Conditional_6_Conditional_0_Template, 9, 2, "div", 1);
    \u0275\u0275elementStart(1, "p", 2);
    \u0275\u0275text(2, "Select equipment or a connection to edit properties");
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
  simEquipmentApi = inject(SimEquipmentApiService);
  roles = ["source", "sink", "valve", "pump", "vessel", "instrument", "motor", "junction", "pipe"];
  pipeTemplates = signal([]);
  saveLibraryMessage = signal(null);
  saveLibraryBusy = signal(false);
  constructor() {
    effect(() => {
      this.simEquipmentApi.equipmentMap();
      this.pipeTemplates.set(this.simEquipmentApi.equipmentList().filter((eq) => normalizeSimRole(eq.simRole) === "pipe"));
    });
  }
  shapeRole(shape) {
    return normalizeSimRole(shape.simRole);
  }
  shapeParams(shape) {
    return __spreadValues(__spreadValues({}, defaultSimParams(this.shapeRole(shape))), parseSimParams(shape.simParamsJson));
  }
  connectionParams(connection) {
    return parseSimParams(connection.pipeParamsJson);
  }
  templateName(shape) {
    if (!shape.simEquipmentId)
      return "Custom";
    return this.simEquipmentApi.getCachedById(shape.simEquipmentId)?.name || `Template #${shape.simEquipmentId}`;
  }
  updateShape(id, updates) {
    this.shapeManager.updateShape(id, updates);
    this.stateService.markDirty();
  }
  updateShapeRole(shape, role) {
    const nextParams = __spreadProps(__spreadValues(__spreadValues({}, defaultSimParams(role)), parseSimParams(shape.simParamsJson)), {
      schemaVersion: 1
    });
    this.updateShape(shape.id, {
      simRole: role,
      simParamsJson: serializeSimParams(nextParams)
    });
  }
  updateShapeParam(shape, key, value) {
    const nextParams = __spreadProps(__spreadValues({}, this.shapeParams(shape)), {
      [key]: value
    });
    this.updateShape(shape.id, {
      simParamsJson: serializeSimParams(nextParams)
    });
  }
  updateConnection(id, updates) {
    this.shapeManager.updateConnection(id, updates);
    this.stateService.markDirty();
  }
  applyPipeTemplate(connectionId, templateId) {
    const template = templateId != null ? this.simEquipmentApi.getCachedById(templateId) : null;
    this.updateConnection(connectionId, {
      pipeTemplateId: templateId,
      pipeName: template?.name || void 0,
      pipeParamsJson: template?.simParamsJson || serializeSimParams({ schemaVersion: 1 })
    });
  }
  updateConnectionParam(connection, key, rawValue) {
    const nextParams = __spreadProps(__spreadValues({}, this.connectionParams(connection)), {
      [key]: this.toNumberOrUndefined(rawValue) ?? void 0
    });
    this.updateConnection(connection.id, {
      pipeParamsJson: serializeSimParams(nextParams)
    });
  }
  toNumberOrUndefined(value) {
    if (value == null || value === "")
      return void 0;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : void 0;
  }
  saveReusableDefinition(shape, forceNew = false) {
    this.saveLibraryBusy.set(true);
    this.saveLibraryMessage.set(null);
    const dto = this.shapeToReusableDefinition(shape, forceNew ? void 0 : shape.simEquipmentId);
    const request = dto.id != null ? this.simEquipmentApi.update(dto.id, dto) : this.simEquipmentApi.create(dto);
    request.subscribe({
      next: (res) => {
        const saved = res.responseData;
        if (!saved?.id) {
          this.saveLibraryBusy.set(false);
          this.saveLibraryMessage.set("Failed to save reusable equipment.");
          return;
        }
        this.simEquipmentApi.upsertCached(saved);
        this.updateShape(shape.id, { simEquipmentId: saved.id });
        this.saveLibraryBusy.set(false);
        this.saveLibraryMessage.set(dto.id != null ? "Reusable equipment definition updated." : "Saved to equipment library for reuse across diagrams.");
      },
      error: () => {
        this.saveLibraryBusy.set(false);
        this.saveLibraryMessage.set("Failed to save reusable equipment.");
      }
    });
  }
  shapeToReusableDefinition(shape, existingId) {
    const existing = existingId != null ? this.simEquipmentApi.getCachedById(existingId) : null;
    return {
      id: existing?.id,
      name: shape.name || shape.label || "Reusable Equipment",
      description: shape.description || existing?.description || void 0,
      symbolId: shape.symbolId || existing?.symbolId || void 0,
      svgPath: shape.svgPath || existing?.svgPath || void 0,
      defaultWidth: Math.round(shape.width),
      defaultHeight: Math.round(shape.height),
      defaultColor: shape.color || existing?.defaultColor || void 0,
      simRole: shape.simRole || existing?.simRole || "junction",
      simParamsJson: shape.simParamsJson || existing?.simParamsJson || '{"schemaVersion":1}',
      sourceEntityType: existing?.sourceEntityType,
      sourceEntityId: existing?.sourceEntityId
    };
  }
  static \u0275fac = function DiagramPropertiesComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _DiagramPropertiesComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _DiagramPropertiesComponent, selectors: [["app-diagram-properties"]], decls: 7, vars: 1, consts: [[1, "properties-panel"], [1, "property-section"], [1, "info"], ["type", "text", 3, "ngModelChange", "ngModel"], [3, "ngModelChange", "ngModel"], [3, "value"], [1, "inline-info"], ["type", "number", 3, "ngModelChange", "ngModel"], ["type", "number", 3, "ngModelChange", "ngModel", "min"], ["type", "number", 3, "ngModelChange", "ngModel", "min", "max"], ["type", "color", 3, "ngModelChange", "ngModel"], [1, "linked-field"], [1, "linked-label"], [1, "linked-value"], [1, "template-actions"], [1, "btn-action", 3, "disabled"], [1, "btn-action", "secondary", 3, "click", "disabled"], ["value", "open"], ["value", "throttled"], ["value", "closed"], ["type", "checkbox", 3, "ngModelChange", "ngModel"], ["value", "pressure"], ["value", "temperature"], ["value", "flow"], ["type", "number", "step", "0.01", 3, "ngModelChange", "ngModel"], [1, "btn-action", 3, "click", "disabled"], ["value", ""], ["value", "A"], ["value", "B"]], template: function DiagramPropertiesComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "h3");
      \u0275\u0275text(2, "Properties");
      \u0275\u0275elementEnd();
      \u0275\u0275template(3, DiagramPropertiesComponent_Conditional_3_Template, 72, 31)(4, DiagramPropertiesComponent_Conditional_4_Template, 51, 12, "div", 1)(5, DiagramPropertiesComponent_Conditional_5_Template, 2, 1, "p", 2)(6, DiagramPropertiesComponent_Conditional_6_Template, 3, 1);
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      let tmp_0_0;
      \u0275\u0275advance(3);
      \u0275\u0275conditional((tmp_0_0 = ctx.shapeManager.singleSelectedShape()) ? 3 : ctx.shapeManager.singleSelectedConnection() ? 4 : ctx.shapeManager.selectedShapes().length > 1 ? 5 : 6, tmp_0_0);
    }
  }, dependencies: [CommonModule, FormsModule, NgSelectOption, \u0275NgSelectMultipleOption, DefaultValueAccessor, NumberValueAccessor, CheckboxControlValueAccessor, SelectControlValueAccessor, NgControlStatus, MinValidator, MaxValidator, NgModel], styles: ["\n\n[_nghost-%COMP%] {\n  display: block;\n  height: 100%;\n  overflow: hidden;\n}\n.properties-panel[_ngcontent-%COMP%] {\n  width: 260px;\n  height: 100%;\n  background: #1a1a1a;\n  border-left: 1px solid #333;\n  padding: 12px;\n  overflow-y: auto;\n  box-sizing: border-box;\n}\nh3[_ngcontent-%COMP%] {\n  margin: 0 0 12px;\n  font-size: 14px;\n  color: #aaa;\n}\nh4[_ngcontent-%COMP%] {\n  margin: 0 0 8px;\n  font-size: 13px;\n  color: #ddd;\n  text-transform: capitalize;\n}\n.property-section[_ngcontent-%COMP%] {\n  margin-bottom: 16px;\n}\nlabel[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  font-size: 12px;\n  color: #999;\n  margin-bottom: 6px;\n  gap: 8px;\n}\ninput[_ngcontent-%COMP%], \ntextarea[_ngcontent-%COMP%], \nselect[_ngcontent-%COMP%] {\n  width: 128px;\n  padding: 4px 6px;\n  background: #2a2a2a;\n  border: 1px solid #444;\n  color: #ddd;\n  border-radius: 3px;\n  font-size: 12px;\n}\ninput[type=color][_ngcontent-%COMP%] {\n  width: 40px;\n  height: 24px;\n  padding: 0;\n  cursor: pointer;\n}\ninput[type=checkbox][_ngcontent-%COMP%] {\n  width: auto;\n}\ntextarea[_ngcontent-%COMP%] {\n  height: 60px;\n  resize: vertical;\n}\n.linked-field[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  gap: 8px;\n  font-size: 11px;\n  margin-bottom: 6px;\n}\n.linked-label[_ngcontent-%COMP%] {\n  color: #888;\n}\n.linked-value[_ngcontent-%COMP%] {\n  color: #ddd;\n  text-align: right;\n  max-width: 140px;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n.info[_ngcontent-%COMP%] {\n  font-size: 12px;\n  color: #666;\n}\n.inline-info[_ngcontent-%COMP%] {\n  margin: 6px 0 0;\n  color: #777;\n  font-size: 11px;\n  line-height: 1.4;\n}\n.template-actions[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n  margin-top: 8px;\n}\n.btn-action[_ngcontent-%COMP%] {\n  padding: 6px 8px;\n  background: #2e7d32;\n  border: 1px solid #4caf50;\n  color: #fff;\n  border-radius: 3px;\n  cursor: pointer;\n  font-size: 11px;\n}\n.btn-action.secondary[_ngcontent-%COMP%] {\n  background: #2a2a2a;\n  border-color: #555;\n  color: #ccc;\n}\n.btn-action[_ngcontent-%COMP%]:disabled {\n  opacity: 0.6;\n  cursor: default;\n}\n/*# sourceMappingURL=diagram-properties.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(DiagramPropertiesComponent, { className: "DiagramPropertiesComponent", filePath: "src/app/features/diagram-builder/components/diagram-properties/diagram-properties.component.ts", lineNumber: 432 });
})();

// src/app/features/diagram-builder/simulation/services/simulation-graph.service.ts
var SimulationGraphService = class _SimulationGraphService {
  /**
   * Topological sort via BFS from source nodes.
   * Returns ordered list of node IDs for forward propagation.
   */
  topologicalSort(nodes, edges) {
    const sources = [...nodes.values()].filter((n) => n.role === "source").map((n) => n.id);
    const queue = [...sources];
    const visited = /* @__PURE__ */ new Set();
    const order = [];
    while (queue.length > 0) {
      const id = queue.shift();
      if (visited.has(id))
        continue;
      const node = nodes.get(id);
      const allUpstreamReady = node.upstreamEdgeIds.every((edgeId) => {
        const edge = edges.get(edgeId);
        return !edge || visited.has(edge.sourceNodeId);
      });
      if (!allUpstreamReady && !sources.includes(id)) {
        queue.push(id);
        continue;
      }
      visited.add(id);
      order.push(id);
      for (const edgeId of node.downstreamEdgeIds) {
        const edge = edges.get(edgeId);
        if (edge && !visited.has(edge.targetNodeId)) {
          queue.push(edge.targetNodeId);
        }
      }
    }
    for (const id of nodes.keys()) {
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

// src/app/features/diagram-builder/simulation/models/simulation.model.ts
var DEFAULT_AMBIENT_TEMP = 70;
function defaultNodeState(shapeId, role) {
  return {
    shapeId,
    role,
    params: defaultSimParams(role),
    pressure: 0,
    temperature: DEFAULT_AMBIENT_TEMP,
    flowRate: 0,
    isFlowing: false,
    warnings: []
  };
}

// src/app/features/diagram-builder/simulation/strategies/simulation-utils.ts
var FLOW_EPSILON = 0.1;
var LARGE_DEMAND = 1e6;
var AMBIENT_TEMP = 70;
function getValveFactor(params) {
  switch (params.valvePosition) {
    case "closed":
      return 0;
    case "throttled":
      return Math.max(0, Math.min(1, (params.throttlePercent ?? 50) / 100));
    case "open":
    default:
      return 1;
  }
}
function clampPercent(value) {
  return Math.max(0, Math.min(100, value));
}

// src/app/features/diagram-builder/simulation/strategies/source.strategy.ts
var sourceStrategy = {
  compute(input2) {
    const { currentState, wantedFlow } = input2;
    const flowRate = currentState.params.sourceFlowRate ?? 0;
    return {
      outFlow: Math.min(flowRate, wantedFlow || flowRate),
      pressure: currentState.params.sourcePressure ?? 100,
      temperature: currentState.params.sourceTemperature ?? AMBIENT_TEMP,
      warnings: []
    };
  },
  computeDemand(node, state, childDemand) {
    return childDemand > 0 ? Math.min(childDemand, state.params.sourceFlowRate ?? childDemand) : state.params.sourceFlowRate ?? 0;
  }
};

// src/app/features/diagram-builder/simulation/strategies/sink.strategy.ts
var sinkStrategy = {
  compute(input2) {
    return {
      outFlow: 0,
      pressure: input2.avgInPressure,
      temperature: input2.avgInTemp,
      warnings: []
    };
  },
  computeDemand(_node, _state, _childDemand) {
    return LARGE_DEMAND;
  }
};

// src/app/features/diagram-builder/simulation/strategies/valve.strategy.ts
var valveStrategy = {
  compute(input2) {
    const { currentState, totalInFlow, avgInPressure, avgInTemp, wantedFlow } = input2;
    const openness = getValveFactor(currentState.params);
    const outFlow = Math.min(totalInFlow, wantedFlow || totalInFlow) * openness;
    const warnings = [];
    if (currentState.params.valvePosition === "closed") {
      warnings.push("Valve closed");
    }
    return {
      outFlow,
      pressure: avgInPressure * (0.15 + 0.85 * openness),
      temperature: avgInTemp,
      warnings
    };
  },
  computeDemand(node, state, childDemand) {
    return Math.min(childDemand * getValveFactor(state.params), state.params.cvCoefficient ?? LARGE_DEMAND);
  }
};

// src/app/features/diagram-builder/simulation/strategies/pump.strategy.ts
var pumpStrategy = {
  compute(input2) {
    const { currentState, totalInFlow, avgInPressure, avgInTemp, wantedFlow } = input2;
    const warnings = [];
    if (!currentState.params.pumpRunning) {
      warnings.push("Pump stopped");
      return {
        outFlow: 0,
        pressure: avgInPressure,
        temperature: avgInTemp,
        warnings
      };
    }
    const suctionOk = totalInFlow > FLOW_EPSILON && avgInPressure >= (currentState.params.minInletPressure ?? 0);
    if (!suctionOk) {
      warnings.push(totalInFlow <= FLOW_EPSILON ? "No inlet flow" : "Low inlet pressure");
      warnings.push("Cavitation risk");
      return {
        outFlow: 0,
        pressure: avgInPressure,
        temperature: avgInTemp,
        warnings
      };
    }
    const maxFlow = currentState.params.maxFlow ?? LARGE_DEMAND;
    const outFlow = Math.min(totalInFlow, wantedFlow || maxFlow, maxFlow);
    const pressure = avgInPressure + (currentState.params.pumpDeltaP ?? 50) * (currentState.params.pumpEfficiency ?? 1);
    return { outFlow, pressure, temperature: avgInTemp, warnings };
  },
  computeDemand(node, state, childDemand) {
    if (state.params.pumpRunning === false)
      return 0;
    const maxFlow = state.params.maxFlow ?? LARGE_DEMAND;
    return Math.min(maxFlow, childDemand > 0 ? childDemand : maxFlow);
  }
};

// src/app/features/diagram-builder/simulation/strategies/vessel.strategy.ts
var vesselStrategy = {
  compute(input2) {
    const { currentState, previousState, totalInFlow, avgInPressure, avgInTemp, wantedFlow, dtHours } = input2;
    const warnings = [];
    const volume = Math.max(1, currentState.params.volume ?? 1e3);
    const currentLevel = clampPercent(previousState.params.currentLevel ?? currentState.params.currentLevel ?? 50);
    const storedUnits = volume * (currentLevel / 100);
    const maxDischargeFromInventory = storedUnits / dtHours;
    const outFlow = Math.min(wantedFlow, totalInFlow + maxDischargeFromInventory);
    const pressure = Math.min(currentState.params.maxPressure ?? LARGE_DEMAND, (currentState.params.sourcePressure ?? 15) * Math.max(0.05, currentLevel / 100));
    const prevVesselTemp = previousState.params.vesselTemperature || previousState.temperature || AMBIENT_TEMP;
    const inFlowVolume = totalInFlow * dtHours;
    const nextVesselTemp = storedUnits + inFlowVolume > 0.01 ? (storedUnits * prevVesselTemp + inFlowVolume * avgInTemp) / (storedUnits + inFlowVolume) : prevVesselTemp;
    const temperature = nextVesselTemp;
    const nextStoredUnits = Math.max(0, storedUnits + (totalInFlow - outFlow) * dtHours);
    const nextLevel = clampPercent(nextStoredUnits / volume * 100);
    if (nextLevel <= (currentState.params.minLevel ?? 0) + 0.01) {
      warnings.push("Low level");
    }
    if (nextLevel >= 99.9) {
      warnings.push("High level");
    }
    return {
      outFlow,
      pressure,
      temperature,
      warnings,
      paramUpdates: { currentLevel: nextLevel, vesselTemperature: nextVesselTemp }
    };
  },
  computeDemand(_node, _state, childDemand) {
    return childDemand;
  }
};

// src/app/features/diagram-builder/simulation/strategies/passthrough.strategy.ts
var passthroughStrategy = {
  compute(input2) {
    const { totalInFlow, avgInPressure, avgInTemp, wantedFlow } = input2;
    return {
      outFlow: Math.min(totalInFlow, wantedFlow || totalInFlow),
      pressure: avgInPressure,
      temperature: avgInTemp,
      warnings: []
    };
  },
  computeDemand(_node, _state, childDemand) {
    return childDemand;
  }
};

// src/app/features/diagram-builder/simulation/strategies/three-way-valve.strategy.ts
var threeWayValveStrategy = {
  compute(input2) {
    const { currentState, totalInFlow, avgInPressure, avgInTemp, wantedFlow } = input2;
    const position = Math.max(0, Math.min(100, currentState.params.threeWayPosition ?? 50));
    const fractionB = position / 100;
    const fractionA = 1 - fractionB;
    const outFlow = Math.min(totalInFlow, wantedFlow || totalInFlow);
    const warnings = [];
    return {
      outFlow,
      pressure: avgInPressure * 0.95,
      temperature: avgInTemp,
      warnings,
      portFlowDistribution: { A: fractionA, B: fractionB }
    };
  },
  computeDemand(node, state, childDemand, demandByPort) {
    if (!demandByPort)
      return childDemand;
    const position = Math.max(0, Math.min(100, state.params.threeWayPosition ?? 50));
    const fractionA = 1 - position / 100;
    const fractionB = position / 100;
    const demandA = demandByPort["A"] ?? 0;
    const demandB = demandByPort["B"] ?? 0;
    return demandA * fractionA + demandB * fractionB;
  }
};

// src/app/features/diagram-builder/simulation/strategies/selector-valve.strategy.ts
var selectorValveStrategy = {
  compute(input2) {
    const { currentState, totalInFlow, avgInPressure, avgInTemp, wantedFlow } = input2;
    const selected = currentState.params.selectedPort ?? "A";
    const outFlow = Math.min(totalInFlow, wantedFlow || totalInFlow);
    return {
      outFlow,
      pressure: avgInPressure * 0.98,
      temperature: avgInTemp,
      warnings: [],
      portFlowDistribution: {
        A: selected === "A" ? 1 : 0,
        B: selected === "B" ? 1 : 0
      }
    };
  },
  computeDemand(node, state, childDemand, demandByPort) {
    if (!demandByPort)
      return childDemand;
    const selected = state.params.selectedPort ?? "A";
    return demandByPort[selected] ?? 0;
  }
};

// src/app/features/diagram-builder/simulation/strategies/pressure-regulator.strategy.ts
var pressureRegulatorStrategy = {
  compute(input2) {
    const { currentState, totalInFlow, avgInPressure, avgInTemp, wantedFlow } = input2;
    const setpoint = currentState.params.setpointPressure ?? 50;
    const maxFlow = currentState.params.regulatorMaxFlow ?? Infinity;
    const outFlow = Math.min(totalInFlow, wantedFlow || totalInFlow, maxFlow);
    const warnings = [];
    if (avgInPressure < setpoint) {
      warnings.push("Inlet pressure below setpoint");
    }
    return {
      outFlow,
      pressure: Math.min(avgInPressure, setpoint),
      temperature: avgInTemp,
      warnings
    };
  },
  computeDemand(node, state, childDemand) {
    const maxFlow = state.params.regulatorMaxFlow ?? Infinity;
    return Math.min(childDemand, maxFlow);
  }
};

// src/app/features/diagram-builder/simulation/strategies/filter.strategy.ts
var filterStrategy = {
  compute(input2) {
    const { currentState, totalInFlow, avgInPressure, avgInTemp, wantedFlow } = input2;
    const deltaP = currentState.params.filterDeltaP ?? 5;
    const outFlow = Math.min(totalInFlow, wantedFlow || totalInFlow);
    return {
      outFlow,
      pressure: Math.max(0, avgInPressure - deltaP),
      temperature: avgInTemp,
      warnings: []
    };
  },
  computeDemand(_node, _state, childDemand) {
    return childDemand;
  }
};

// src/app/features/diagram-builder/simulation/strategies/bearing.strategy.ts
var bearingStrategy = {
  compute(input2) {
    const { currentState, totalInFlow, avgInPressure, avgInTemp, wantedFlow } = input2;
    const required = currentState.params.bearingFlowRequired ?? 100;
    const maxTemp = currentState.params.bearingMaxTemp ?? 180;
    const bearingTemp = currentState.params.bearingTemp ?? 200;
    const baseCoeff = currentState.params.heatTransferCoeff ?? 0.3;
    const warnings = [];
    const outFlow = Math.min(totalInFlow, wantedFlow || totalInFlow);
    if (totalInFlow < required - FLOW_EPSILON) {
      warnings.push(`Low flow: ${totalInFlow.toFixed(0)} / ${required} required`);
    }
    if (totalInFlow < FLOW_EPSILON) {
      warnings.push("No flow to bearing");
    }
    const residenceFactor = totalInFlow > FLOW_EPSILON ? Math.min(1, required / totalInFlow) : 1;
    const effectiveCoeff = baseCoeff * residenceFactor;
    const outTemp = avgInTemp + effectiveCoeff * (bearingTemp - avgInTemp);
    if (outTemp > maxTemp) {
      warnings.push(`High oil temp: ${outTemp.toFixed(0)}\xB0F > ${maxTemp}\xB0F`);
    }
    return {
      outFlow,
      pressure: avgInPressure,
      temperature: outTemp,
      warnings
    };
  },
  computeDemand(_node, state, childDemand) {
    const required = state.params.bearingFlowRequired ?? 100;
    return Math.max(required, childDemand);
  }
};

// src/app/features/diagram-builder/simulation/strategies/heater.strategy.ts
var heaterStrategy = {
  compute(input2) {
    const { currentState, totalInFlow, avgInPressure, avgInTemp, wantedFlow } = input2;
    const running = currentState.params.heaterRunning ?? false;
    const deltaT = currentState.params.heaterDeltaT ?? 0;
    const outFlow = Math.min(totalInFlow, wantedFlow || totalInFlow);
    const warnings = [];
    if (!running) {
      warnings.push("Heater off");
    }
    return {
      outFlow,
      pressure: avgInPressure,
      temperature: running ? avgInTemp + deltaT : avgInTemp,
      warnings
    };
  },
  computeDemand(_node, _state, childDemand) {
    return childDemand;
  }
};

// src/app/features/diagram-builder/simulation/strategies/vapor-extractor.strategy.ts
var vaporExtractorStrategy = {
  compute(input2) {
    const { currentState, avgInPressure, avgInTemp } = input2;
    const running = currentState.params.extractorRunning ?? false;
    const warnings = [];
    if (!running) {
      warnings.push("Extractor off");
    }
    return {
      outFlow: 0,
      pressure: avgInPressure,
      temperature: avgInTemp,
      warnings
    };
  },
  computeDemand(_node, state, _childDemand) {
    return 0;
  }
};

// src/app/features/diagram-builder/simulation/strategies/heat-exchanger.strategy.ts
var heatExchangerStrategy = {
  compute(input2) {
    const { currentState, inFlowByPort } = input2;
    const effectiveness = currentState.params.hxEffectiveness ?? 0.7;
    const warnings = [];
    const primary = inFlowByPort?.["primary"] ?? { flow: 0, temp: 70, pressure: 0 };
    const secondary = inFlowByPort?.["secondary"] ?? { flow: 0, temp: 70, pressure: 0 };
    const totalOutFlow = primary.flow + secondary.flow;
    let primaryOutTemp = primary.temp;
    let secondaryOutTemp = secondary.temp;
    if (primary.flow > FLOW_EPSILON && secondary.flow > FLOW_EPSILON) {
      const minFlow = Math.min(primary.flow, secondary.flow);
      const q = effectiveness * minFlow * (primary.temp - secondary.temp);
      primaryOutTemp = primary.temp - q / primary.flow;
      secondaryOutTemp = secondary.temp + q / secondary.flow;
    } else if (primary.flow <= FLOW_EPSILON && secondary.flow > FLOW_EPSILON) {
      warnings.push("No primary flow");
    } else if (secondary.flow <= FLOW_EPSILON && primary.flow > FLOW_EPSILON) {
      warnings.push("No secondary flow \u2014 no cooling");
    } else {
      warnings.push("No flow");
    }
    const avgPressure = totalOutFlow > FLOW_EPSILON ? (primary.pressure * primary.flow + secondary.pressure * secondary.flow) / totalOutFlow : 0;
    return {
      outFlow: totalOutFlow,
      pressure: avgPressure,
      temperature: primary.flow > FLOW_EPSILON ? primaryOutTemp : secondaryOutTemp,
      warnings,
      // Each circuit gets its own flow fraction and temperature
      portFlowDistribution: {
        primary: totalOutFlow > FLOW_EPSILON ? primary.flow / totalOutFlow : 0.5,
        secondary: totalOutFlow > FLOW_EPSILON ? secondary.flow / totalOutFlow : 0.5
      },
      portTemperatures: {
        primary: primaryOutTemp,
        secondary: secondaryOutTemp
      }
    };
  },
  computeDemand(node, state, childDemand, demandByPort) {
    return childDemand;
  }
};

// src/app/features/diagram-builder/simulation/strategies/accumulator.strategy.ts
var accumulatorStrategy = {
  compute(input2) {
    const { currentState, previousState, totalInFlow, avgInPressure, avgInTemp, wantedFlow } = input2;
    const setPressure = currentState.params.accumulatorSetPressure ?? 50;
    const dampingRate = currentState.params.accumulatorDamping ?? 0.3;
    const outFlow = Math.min(totalInFlow, wantedFlow || totalInFlow);
    const warnings = [];
    const prevPressure = previousState.pressure || avgInPressure;
    const smoothed = prevPressure + dampingRate * (avgInPressure - prevPressure);
    const pressure = Math.max(0, smoothed);
    if (avgInPressure < setPressure * 0.8) {
      warnings.push("Low supply pressure");
    }
    return {
      outFlow,
      pressure,
      temperature: avgInTemp,
      warnings
    };
  },
  computeDemand(_node, _state, childDemand) {
    return childDemand;
  }
};

// src/app/features/diagram-builder/simulation/strategies/strategy-registry.ts
var STRATEGIES = {
  source: sourceStrategy,
  sink: sinkStrategy,
  valve: valveStrategy,
  pump: pumpStrategy,
  vessel: vesselStrategy,
  pipe: passthroughStrategy,
  junction: passthroughStrategy,
  instrument: passthroughStrategy,
  motor: passthroughStrategy,
  "three-way-valve": threeWayValveStrategy,
  "selector-valve": selectorValveStrategy,
  "pressure-regulator": pressureRegulatorStrategy,
  filter: filterStrategy,
  bearing: bearingStrategy,
  heater: heaterStrategy,
  "vapor-extractor": vaporExtractorStrategy,
  "heat-exchanger": heatExchangerStrategy,
  accumulator: accumulatorStrategy
};
function getStrategy(role) {
  return STRATEGIES[role] ?? passthroughStrategy;
}

// src/app/features/diagram-builder/simulation/services/simulation-engine.service.ts
var SimulationEngineService = class _SimulationEngineService {
  /**
   * Topological sort via BFS from source nodes.
   */
  topologicalSort(nodes, edges) {
    const indegree = /* @__PURE__ */ new Map();
    for (const node of nodes.values()) {
      indegree.set(node.id, 0);
    }
    for (const edge of edges.values()) {
      if (nodes.has(edge.sourceNodeId) && nodes.has(edge.targetNodeId)) {
        indegree.set(edge.targetNodeId, (indegree.get(edge.targetNodeId) ?? 0) + 1);
      }
    }
    const sources = [...nodes.values()].filter((n) => n.role === "source").map((n) => n.id);
    const zeroIndegree = [...nodes.keys()].filter((id) => (indegree.get(id) ?? 0) === 0);
    const queue = [.../* @__PURE__ */ new Set([...sources.length ? sources : [], ...zeroIndegree])];
    const visited = /* @__PURE__ */ new Set();
    const order = [];
    while (queue.length > 0) {
      const id = queue.shift();
      if (visited.has(id))
        continue;
      visited.add(id);
      order.push(id);
      const node = nodes.get(id);
      if (!node)
        continue;
      for (const edgeId of node.downstreamEdgeIds) {
        const edge = edges.get(edgeId);
        if (!edge || !nodes.has(edge.targetNodeId))
          continue;
        const nextIndegree = (indegree.get(edge.targetNodeId) ?? 0) - 1;
        indegree.set(edge.targetNodeId, nextIndegree);
        if (nextIndegree <= 0 && !visited.has(edge.targetNodeId)) {
          queue.push(edge.targetNodeId);
        }
      }
    }
    for (const id of nodes.keys()) {
      if (!visited.has(id))
        order.push(id);
    }
    return order;
  }
  step(nodes, edges, previousStates, dtSeconds) {
    const order = this.topologicalSort(nodes, edges);
    const nextStates = /* @__PURE__ */ new Map();
    const edgeStates = /* @__PURE__ */ new Map();
    const demandCache = /* @__PURE__ */ new Map();
    const demandPath = /* @__PURE__ */ new Set();
    const dtHours = Math.max(dtSeconds, 0.1) / 3600;
    for (const node of nodes.values()) {
      const prev = previousStates.get(node.id) ?? defaultNodeState(node.id, node.role);
      nextStates.set(node.id, __spreadProps(__spreadValues({}, prev), {
        role: node.role,
        params: __spreadValues(__spreadValues({}, node.params), prev.params),
        warnings: []
      }));
    }
    const desiredDemand = (nodeId) => {
      if (demandCache.has(nodeId))
        return demandCache.get(nodeId);
      if (demandPath.has(nodeId))
        return 0;
      demandPath.add(nodeId);
      const node = nodes.get(nodeId);
      const state = nextStates.get(nodeId);
      if (!node || !state) {
        demandPath.delete(nodeId);
        return 0;
      }
      const demandByPort = {};
      let childDemand = 0;
      for (const edgeId of node.downstreamEdgeIds) {
        const edge = edges.get(edgeId);
        if (!edge)
          continue;
        const edgeDemand = desiredDemand(edge.targetNodeId);
        childDemand += edgeDemand;
        const portKey = edge.sourcePort ?? "";
        demandByPort[portKey] = (demandByPort[portKey] ?? 0) + edgeDemand;
      }
      const strategy = getStrategy(node.role);
      const demand = strategy.computeDemand(node, state, childDemand, demandByPort);
      demandPath.delete(nodeId);
      demandCache.set(nodeId, demand);
      return demand;
    };
    for (const nodeId of nodes.keys()) {
      desiredDemand(nodeId);
    }
    for (const nodeId of order) {
      const node = nodes.get(nodeId);
      const state = nextStates.get(nodeId);
      if (!node || !state)
        continue;
      const previous = previousStates.get(nodeId) ?? state;
      const upstreamEdges = node.upstreamEdgeIds.map((edgeId) => edgeStates.get(edgeId)).filter((edge) => !!edge);
      const totalInFlow = upstreamEdges.reduce((sum, e) => sum + e.flowRate, 0);
      const avgInPressure = upstreamEdges.length ? upstreamEdges.reduce((sum, e) => sum + e.pressure, 0) / upstreamEdges.length : 0;
      const avgInTemp = this.weightedAvgTemp(upstreamEdges);
      const wantedFlow = demandCache.get(nodeId) ?? 0;
      const inFlowByPort = {};
      for (const edgeId of node.upstreamEdgeIds) {
        const edge = edges.get(edgeId);
        const edgeState = edgeStates.get(edgeId);
        if (!edge || !edgeState)
          continue;
        const portKey = edge.targetPort ?? "";
        const existing = inFlowByPort[portKey];
        if (existing) {
          const totalPortFlow = existing.flow + edgeState.flowRate;
          existing.temp = totalPortFlow > FLOW_EPSILON ? (existing.temp * existing.flow + edgeState.temperature * edgeState.flowRate) / totalPortFlow : existing.temp;
          existing.pressure = (existing.pressure + edgeState.pressure) / 2;
          existing.flow = totalPortFlow;
        } else {
          inFlowByPort[portKey] = { flow: edgeState.flowRate, temp: edgeState.temperature, pressure: edgeState.pressure };
        }
      }
      const strategy = getStrategy(node.role);
      const result = strategy.compute({
        node,
        previousState: previous,
        currentState: state,
        upstreamEdges,
        totalInFlow,
        avgInPressure,
        avgInTemp,
        wantedFlow,
        dtHours,
        inFlowByPort
      });
      if (result.paramUpdates) {
        state.params = __spreadValues(__spreadValues({}, state.params), result.paramUpdates);
      }
      const effectiveFlow = node.role === "sink" ? totalInFlow : result.outFlow;
      nextStates.set(nodeId, __spreadProps(__spreadValues({}, state), {
        pressure: result.pressure,
        temperature: result.temperature,
        flowRate: effectiveFlow,
        isFlowing: effectiveFlow > FLOW_EPSILON,
        warnings: result.warnings
      }));
      const childWeights = node.downstreamEdgeIds.map((edgeId) => {
        const edge = edges.get(edgeId);
        const childDem = edge ? demandCache.get(edge.targetNodeId) ?? 0 : 0;
        return { edgeId, demand: childDem };
      });
      const totalChildDemand = childWeights.reduce((sum, item) => sum + item.demand, 0);
      for (const item of childWeights) {
        const edge = edges.get(item.edgeId);
        if (!edge)
          continue;
        let ratio;
        if (result.portFlowDistribution && edge.sourcePort) {
          ratio = result.portFlowDistribution[edge.sourcePort] ?? 0;
        } else {
          ratio = totalChildDemand > 0 ? item.demand / totalChildDemand : 1 / Math.max(1, childWeights.length);
        }
        const edgeTemp = result.portTemperatures && edge.sourcePort ? result.portTemperatures[edge.sourcePort] ?? result.temperature : result.temperature;
        const baseEdge = {
          connectionId: edge.id,
          flowRate: result.outFlow * ratio,
          pressure: result.pressure,
          temperature: edgeTemp,
          isFlowing: result.outFlow * ratio > FLOW_EPSILON
        };
        edgeStates.set(edge.id, this.applyPipeEffects(baseEdge, edge));
      }
    }
    for (const edge of edges.values()) {
      if (!edgeStates.has(edge.id)) {
        edgeStates.set(edge.id, {
          connectionId: edge.id,
          flowRate: 0,
          pressure: 0,
          temperature: AMBIENT_TEMP,
          isFlowing: false
        });
      }
    }
    this.applyVaporExtractorEffects(nodes, edges, nextStates);
    return { nodes: nextStates, edges: edgeStates };
  }
  applyPipeEffects(sourceState, edge) {
    const params = edge.pipeParams;
    const diameter = Math.max(0.1, params.diameter ?? 1);
    const length = Math.max(0, params.length ?? 0);
    const frictionFactor = Math.max(0, params.frictionFactor ?? 0);
    const insulationFactor = Math.max(0, params.insulationFactor ?? 0);
    const FRICTION_SCALE = 1e-4;
    const pressureDrop = FRICTION_SCALE * frictionFactor * length * Math.pow(sourceState.flowRate, 2) / Math.pow(diameter, 5);
    const heatLoss = insulationFactor * length * Math.max(0, sourceState.temperature - AMBIENT_TEMP);
    return __spreadProps(__spreadValues({}, sourceState), {
      pressure: Math.max(0, sourceState.pressure - pressureDrop),
      temperature: Math.max(AMBIENT_TEMP, sourceState.temperature - heatLoss)
    });
  }
  weightedAvgTemp(upstreams) {
    const totalFlow = upstreams.reduce((sum, edge) => sum + edge.flowRate, 0);
    if (totalFlow <= FLOW_EPSILON) {
      return upstreams.length ? upstreams[0].temperature : AMBIENT_TEMP;
    }
    return upstreams.reduce((sum, edge) => sum + edge.temperature * edge.flowRate, 0) / totalFlow;
  }
  /**
   * Post-step: running vapor extractors reduce pressure on their upstream vessels.
   * For each running vapor-extractor, find the directly connected upstream node.
   * If it's a vessel, reduce its output pressure by extractorPressureReduction.
   */
  applyVaporExtractorEffects(nodes, edges, states) {
    for (const node of nodes.values()) {
      if (node.role !== "vapor-extractor")
        continue;
      const state = states.get(node.id);
      if (!state || !(state.params.extractorRunning ?? false))
        continue;
      const reduction = state.params.extractorPressureReduction ?? 2;
      for (const edgeId of node.upstreamEdgeIds) {
        const edge = edges.get(edgeId);
        if (!edge)
          continue;
        const upstreamNode = nodes.get(edge.sourceNodeId);
        const upstreamState = states.get(edge.sourceNodeId);
        if (!upstreamNode || !upstreamState)
          continue;
        if (upstreamNode.role === "vessel") {
          upstreamState.pressure = Math.max(0, upstreamState.pressure - reduction);
        }
      }
    }
  }
  static \u0275fac = function SimulationEngineService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _SimulationEngineService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _SimulationEngineService, factory: _SimulationEngineService.\u0275fac });
};

// src/app/features/diagram-builder/simulation/services/sim-graph-builder.service.ts
var SimGraphBuilderService = class _SimGraphBuilderService {
  build(placements, connections) {
    const nodes = /* @__PURE__ */ new Map();
    const edges = /* @__PURE__ */ new Map();
    for (const placement of placements) {
      const role = this.determineRole(placement);
      nodes.set(placement.id, {
        id: placement.id,
        role,
        params: placement.simParamsJson ? __spreadValues(__spreadValues({}, defaultSimParams(role)), parseSimParams(placement.simParamsJson)) : defaultSimParams(role),
        simEquipmentId: placement.simEquipmentId,
        upstreamEdgeIds: [],
        downstreamEdgeIds: []
      });
    }
    for (const conn of connections) {
      const edge = {
        id: conn.id,
        sourceNodeId: conn.sourcePlacementId,
        targetNodeId: conn.targetPlacementId,
        pipeParams: conn.pipeParamsJson ? parseSimParams(conn.pipeParamsJson) : { schemaVersion: 1 },
        sourcePort: conn.sourcePort,
        targetPort: conn.targetPort
      };
      edges.set(conn.id, edge);
      const sourceNode = nodes.get(conn.sourcePlacementId);
      const targetNode = nodes.get(conn.targetPlacementId);
      if (sourceNode)
        sourceNode.downstreamEdgeIds.push(conn.id);
      if (targetNode)
        targetNode.upstreamEdgeIds.push(conn.id);
    }
    return { nodes, edges };
  }
  determineRole(placement) {
    if (placement.simRole) {
      return normalizeSimRole(placement.simRole);
    }
    if (placement.type === "symbol" && placement.symbolId) {
      return SYMBOL_ROLE_MAP[placement.symbolId] ?? "junction";
    }
    if (placement.type === "line")
      return "pipe";
    return "junction";
  }
  static \u0275fac = function SimGraphBuilderService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _SimGraphBuilderService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _SimGraphBuilderService, factory: _SimGraphBuilderService.\u0275fac });
};

// src/app/features/diagram-builder/simulation/services/simulation-state.service.ts
var SimulationStateService = class _SimulationStateService {
  graphBuilder = inject(SimGraphBuilderService);
  engine = inject(SimulationEngineService);
  tickMs = 500;
  dtSeconds = 1;
  isSimulating = signal(false);
  simTimeSeconds = signal(0);
  nodes = /* @__PURE__ */ new Map();
  edges = /* @__PURE__ */ new Map();
  nodeSubjects = /* @__PURE__ */ new Map();
  edgeSubjects = /* @__PURE__ */ new Map();
  _nodeStates = /* @__PURE__ */ new Map();
  _edgeStates = /* @__PURE__ */ new Map();
  tickHandle = null;
  activate(shapes, connections) {
    this.stopTicking();
    const graph = this.graphBuilder.build(shapes, connections);
    this.nodes = graph.nodes;
    this.edges = graph.edges;
    this.simTimeSeconds.set(0);
    this._nodeStates.clear();
    this.nodeSubjects.clear();
    for (const node of this.nodes.values()) {
      const state = defaultNodeState(node.id, node.role);
      state.params = __spreadValues({}, node.params);
      this._nodeStates.set(node.id, state);
      this.nodeSubjects.set(node.id, new BehaviorSubject(state));
    }
    this._edgeStates.clear();
    this.edgeSubjects.clear();
    for (const edge of this.edges.values()) {
      const edgeState = {
        connectionId: edge.id,
        flowRate: 0,
        pressure: 0,
        temperature: DEFAULT_AMBIENT_TEMP,
        isFlowing: false
      };
      this._edgeStates.set(edge.id, edgeState);
      this.edgeSubjects.set(edge.id, new BehaviorSubject(edgeState));
    }
    this.isSimulating.set(true);
    this.runStep();
    this.startTicking();
  }
  deactivate() {
    this.stopTicking();
    this.isSimulating.set(false);
    this.simTimeSeconds.set(0);
    for (const sub of this.nodeSubjects.values())
      sub.complete();
    for (const sub of this.edgeSubjects.values())
      sub.complete();
    this.nodeSubjects.clear();
    this.edgeSubjects.clear();
    this._nodeStates.clear();
    this._edgeStates.clear();
    this.nodes.clear();
    this.edges.clear();
  }
  updateNodeParams(shapeId, updates) {
    const state = this._nodeStates.get(shapeId);
    if (!state)
      return;
    state.params = __spreadValues(__spreadValues({}, state.params), updates);
    const node = this.nodes.get(shapeId);
    if (node) {
      node.params = __spreadValues(__spreadValues({}, node.params), updates);
    }
    this.runStep();
  }
  updateNodeRole(shapeId, role) {
    const state = this._nodeStates.get(shapeId);
    if (!state)
      return;
    state.role = role;
    const node = this.nodes.get(shapeId);
    if (node)
      node.role = role;
    this.runStep();
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
  runStep() {
    const result = this.engine.step(this.nodes, this.edges, this._nodeStates, this.dtSeconds);
    for (const [id, state] of result.nodes) {
      this._nodeStates.set(id, state);
      this.nodeSubjects.get(id)?.next(state);
    }
    for (const [id, edge] of result.edges) {
      this._edgeStates.set(id, edge);
      this.edgeSubjects.get(id)?.next(edge);
    }
  }
  startTicking() {
    this.tickHandle = setInterval(() => {
      if (!this.isSimulating())
        return;
      this.runStep();
      this.simTimeSeconds.update((value) => value + this.dtSeconds);
    }, this.tickMs);
  }
  stopTicking() {
    if (this.tickHandle) {
      clearInterval(this.tickHandle);
      this.tickHandle = null;
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
  // Cached data for animation-only redraws
  cachedShapes = [];
  cachedConnections = [];
  cachedNodeStates = [];
  cachedEdgeStates = [];
  cachedScale = 1;
  /**
   * Draw static simulation overlays on the shape canvas.
   * Called on sim tick (every 500ms) as part of the full render.
   * Draws: shape state colors, badges, vessel levels, valve handles (static position),
   * role indicators, warning dots, connection flow (static colored lines).
   */
  drawStaticOverlays(ctx, shapes, connections, nodeStates, edgeStates, scale) {
    this.cachedShapes = shapes;
    this.cachedConnections = connections;
    this.cachedNodeStates = nodeStates;
    this.cachedEdgeStates = edgeStates;
    this.cachedScale = scale;
    const nodeMap = new Map(nodeStates.map((n) => [n.shapeId, n]));
    const edgeMap = new Map(edgeStates.map((e) => [e.connectionId, e]));
    const shapeMap = new Map(shapes.map((s) => [s.id, s]));
    for (const conn of connections) {
      const edge = edgeMap.get(conn.id);
      if (edge) {
        this.drawConnectionFlowStatic(ctx, conn, edge, shapeMap, scale);
      }
    }
    for (const shape of shapes) {
      const state = nodeMap.get(shape.id);
      if (!state)
        continue;
      this.drawShapeStateOverlay(ctx, shape, state, scale);
      if (state.role === "vessel")
        this.drawVesselLevel(ctx, shape, state, scale);
      if (state.role === "valve")
        this.drawValveHandle(ctx, shape, state, scale);
      this.drawNodeBadge(ctx, shape, state, scale);
      if (state.role === "source")
        this.drawRoleIndicator(ctx, shape, scale, "#2196f3");
      if (state.role === "sink")
        this.drawRoleIndicator(ctx, shape, scale, "#9c27b0");
      if (state.warnings?.length)
        this.drawWarningDot(ctx, shape, scale);
    }
  }
  /**
   * Draw animated-only overlays on the temp canvas.
   * Called at 60fps by requestAnimationFrame.
   * Draws ONLY: flow dash animation, pump impeller rotation, warning pulse.
   * Uses cached data from the last drawStaticOverlays call.
   */
  drawAnimatedOverlays(ctx) {
    const shapes = this.cachedShapes;
    const connections = this.cachedConnections;
    const nodeStates = this.cachedNodeStates;
    const edgeStates = this.cachedEdgeStates;
    const scale = this.cachedScale;
    if (!shapes.length)
      return;
    const nodeMap = new Map(nodeStates.map((n) => [n.shapeId, n]));
    const edgeMap = new Map(edgeStates.map((e) => [e.connectionId, e]));
    const shapeMap = new Map(shapes.map((s) => [s.id, s]));
    for (const conn of connections) {
      const edge = edgeMap.get(conn.id);
      if (edge && edge.isFlowing) {
        this.drawFlowDashAnimation(ctx, conn, edge, shapeMap, scale);
      }
    }
    for (const shape of shapes) {
      const state = nodeMap.get(shape.id);
      if (!state)
        continue;
      if (state.role === "pump")
        this.drawPumpImpeller(ctx, shape, state, scale);
      if (state.warnings?.length)
        this.drawWarningPulse(ctx, shape, scale);
    }
  }
  // ─── Static drawing methods (shape canvas, 2fps) ───
  drawShapeStateOverlay(ctx, shape, state, scale) {
    let color = null;
    let alpha = 0.2;
    switch (state.role) {
      case "valve":
        switch (state.params.valvePosition) {
          case "open":
            color = "#4caf50";
            break;
          case "closed":
            color = "#f44336";
            break;
          case "throttled":
            color = "#ff9800";
            break;
          default:
            color = "#4caf50";
            break;
        }
        break;
      case "pump":
        color = state.params.pumpRunning ? "#4caf50" : "#666666";
        alpha = state.params.pumpRunning ? 0.15 : 0.25;
        break;
      case "vessel":
        return;
      case "source":
        color = "#2196f3";
        alpha = 0.1;
        break;
      case "sink":
        color = "#9c27b0";
        alpha = 0.1;
        break;
      case "three-way-valve":
        color = "#ff9800";
        alpha = 0.15;
        break;
      case "selector-valve":
        color = state.params.selectedPort === "A" ? "#2196f3" : "#e91e63";
        alpha = 0.15;
        break;
      case "pressure-regulator":
        color = "#00bcd4";
        alpha = 0.15;
        break;
      case "filter":
        color = "#8bc34a";
        alpha = 0.1;
        break;
      case "bearing":
        color = state.warnings?.length ? "#f44336" : "#4caf50";
        alpha = 0.15;
        break;
      case "heater":
        color = state.params.heaterRunning ? "#ff5722" : "#666666";
        alpha = state.params.heaterRunning ? 0.2 : 0.25;
        break;
      case "vapor-extractor":
        color = state.params.extractorRunning ? "#66bb6a" : "#666666";
        alpha = 0.15;
        break;
      case "heat-exchanger":
        color = "#4fc3f7";
        alpha = 0.15;
        break;
      case "accumulator":
        color = "#b39ddb";
        alpha = 0.15;
        break;
      default:
        return;
    }
    if (!color)
      return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    if (shape.type === "circle") {
      ctx.beginPath();
      ctx.ellipse(shape.x + shape.width / 2, shape.y + shape.height / 2, shape.width / 2, shape.height / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
    }
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2 / scale;
    if (shape.type === "circle") {
      ctx.beginPath();
      ctx.ellipse(shape.x + shape.width / 2, shape.y + shape.height / 2, shape.width / 2, shape.height / 2, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
    }
    ctx.restore();
  }
  drawValveHandle(ctx, shape, state, scale) {
    const cx = shape.x + shape.width / 2;
    const cy = shape.y + shape.height / 2;
    const handleLen = Math.min(shape.width, shape.height) * 0.35;
    let color;
    let angle;
    switch (state.params.valvePosition) {
      case "open":
        color = "#4caf50";
        angle = 0;
        break;
      case "closed":
        color = "#f44336";
        angle = Math.PI / 2;
        break;
      case "throttled":
        color = "#ff9800";
        angle = Math.PI / 2 * (1 - (state.params.throttlePercent ?? 50) / 100);
        break;
      default:
        color = "#4caf50";
        angle = 0;
        break;
    }
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3 / scale;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-handleLen, 0);
    ctx.lineTo(handleLen, 0);
    ctx.stroke();
    const gripLen = handleLen * 0.4;
    ctx.beginPath();
    ctx.moveTo(0, -gripLen);
    ctx.lineTo(0, gripLen);
    ctx.stroke();
    ctx.restore();
  }
  drawConnectionFlowStatic(ctx, conn, edge, shapeMap, scale) {
    const source = shapeMap.get(conn.sourcePlacementId);
    const target = shapeMap.get(conn.targetPlacementId);
    if (!source || !target)
      return;
    const sp = this.renderService.getAnchorPoint(source, conn.sourceAnchor);
    const tp = this.renderService.getAnchorPoint(target, conn.targetAnchor);
    ctx.save();
    ctx.lineWidth = 3 / scale;
    if (edge.isFlowing) {
      const intensity = Math.min(1, edge.flowRate / 15e3);
      const r = Math.round(13 + (129 - 13) * (1 - intensity));
      const g = Math.round(71 + (212 - 71) * (1 - intensity));
      const b = Math.round(161 + (250 - 161) * (1 - intensity));
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
    } else {
      ctx.strokeStyle = "rgba(85, 85, 85, 0.4)";
    }
    ctx.beginPath();
    this.traceConnectionPath(ctx, sp, tp, conn, source);
    ctx.stroke();
    ctx.restore();
  }
  drawNodeBadge(ctx, shape, state, scale) {
    if (state.role === "pipe")
      return;
    const fontSize = Math.max(11, 13 / scale);
    const extras = state.role === "vessel" ? ` L${(state.params.currentLevel ?? 0).toFixed(0)}%` : "";
    const text = `${state.pressure.toFixed(0)}psi  ${state.temperature.toFixed(0)}\xB0F  ${state.flowRate.toFixed(0)}u/h${extras}`;
    ctx.save();
    ctx.font = `bold ${fontSize}px monospace`;
    const metrics = ctx.measureText(text);
    const padding = 5 / scale;
    const badgeW = metrics.width + padding * 2;
    const badgeH = fontSize + padding * 2;
    const badgeX = shape.x + shape.width / 2 - badgeW / 2;
    const badgeY = shape.y - badgeH - 8 / scale;
    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 3 / scale);
    ctx.fill();
    ctx.strokeStyle = state.isFlowing ? "rgba(129, 212, 250, 0.4)" : "rgba(100, 100, 100, 0.4)";
    ctx.lineWidth = 1 / scale;
    ctx.stroke();
    ctx.fillStyle = state.isFlowing ? "#b3e5fc" : "#888";
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.fillText(text, badgeX + padding, badgeY + padding);
    ctx.restore();
  }
  drawVesselLevel(ctx, shape, state, scale) {
    const level = Math.max(0, Math.min(100, state.params.currentLevel ?? 0));
    const px = Math.max(6 / scale, shape.width * 0.18);
    const py = Math.max(10 / scale, shape.height * 0.1);
    const fw = Math.max(8 / scale, shape.width - px * 2);
    const fh = Math.max(10 / scale, shape.height - py * 2);
    const lh = fh * (level / 100);
    const fx = shape.x + (shape.width - fw) / 2;
    const fy = shape.y + py + (fh - lh);
    ctx.save();
    const grad = ctx.createLinearGradient(fx, fy, fx, fy + lh);
    grad.addColorStop(0, "rgba(3, 169, 244, 0.35)");
    grad.addColorStop(1, "rgba(3, 169, 244, 0.15)");
    ctx.fillStyle = grad;
    ctx.fillRect(fx, fy, fw, lh);
    ctx.strokeStyle = "rgba(129, 212, 250, 0.8)";
    ctx.lineWidth = 1.5 / scale;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx + fw, fy);
    ctx.stroke();
    ctx.strokeStyle = "rgba(129, 212, 250, 0.4)";
    ctx.lineWidth = 1 / scale;
    ctx.strokeRect(fx, shape.y + py, fw, fh);
    const fontSize = Math.max(12 / scale, Math.min(shape.width / 3.5, 16 / scale));
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#b3e5fc";
    ctx.fillText(`${level.toFixed(0)}%`, shape.x + shape.width / 2, shape.y + shape.height / 2);
    ctx.restore();
  }
  drawRoleIndicator(ctx, shape, scale, color) {
    const r = 6 / scale;
    ctx.save();
    ctx.beginPath();
    ctx.arc(shape.x + r + 2 / scale, shape.y + r + 2 / scale, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5 / scale;
    ctx.stroke();
    ctx.restore();
  }
  drawWarningDot(ctx, shape, scale) {
    const r = 7 / scale;
    const x = shape.x + shape.width - r - 2 / scale;
    const y = shape.y + r + 2 / scale;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = "#f44336";
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5 / scale;
    ctx.stroke();
    const fontSize = Math.max(8, 10 / scale);
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff";
    ctx.fillText("!", x, y);
    ctx.restore();
  }
  // ─── Animated drawing methods (temp canvas, 60fps) ───
  drawFlowDashAnimation(ctx, conn, edge, shapeMap, scale) {
    const source = shapeMap.get(conn.sourcePlacementId);
    const target = shapeMap.get(conn.targetPlacementId);
    if (!source || !target)
      return;
    const sp = this.renderService.getAnchorPoint(source, conn.sourceAnchor);
    const tp = this.renderService.getAnchorPoint(target, conn.targetAnchor);
    const intensity = Math.min(1, edge.flowRate / 15e3);
    const r = Math.round(13 + (129 - 13) * (1 - intensity));
    const g = Math.round(71 + (212 - 71) * (1 - intensity));
    const b = Math.round(161 + (250 - 161) * (1 - intensity));
    ctx.save();
    ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.lineWidth = 4 / scale;
    ctx.setLineDash([8 / scale, 12 / scale]);
    ctx.lineDashOffset = -this.animationOffset / scale;
    ctx.beginPath();
    this.traceConnectionPath(ctx, sp, tp, conn, source);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
  drawPumpImpeller(ctx, shape, state, scale) {
    const cx = shape.x + shape.width / 2;
    const cy = shape.y + shape.height / 2;
    const r = Math.min(shape.width, shape.height) * 0.28;
    ctx.save();
    ctx.translate(cx, cy);
    if (state.params.pumpRunning) {
      ctx.rotate(this.animationOffset * 0.15);
      ctx.strokeStyle = "#4caf50";
      ctx.lineWidth = 2.5 / scale;
      ctx.lineCap = "round";
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(r * Math.cos(i * Math.PI / 2), r * Math.sin(i * Math.PI / 2));
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(0, 0, 3 / scale, 0, Math.PI * 2);
      ctx.fillStyle = "#4caf50";
      ctx.fill();
    } else {
      ctx.strokeStyle = "#666";
      ctx.lineWidth = 2 / scale;
      ctx.lineCap = "round";
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(r * Math.cos(i * Math.PI / 2 + Math.PI / 4), r * Math.sin(i * Math.PI / 2 + Math.PI / 4));
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(0, 0, 3 / scale, 0, Math.PI * 2);
      ctx.fillStyle = "#666";
      ctx.fill();
    }
    ctx.restore();
  }
  drawWarningPulse(ctx, shape, scale) {
    const r = 7 / scale;
    const x = shape.x + shape.width - r - 2 / scale;
    const y = shape.y + r + 2 / scale;
    const pulse = 0.5 + 0.5 * Math.sin(this.animationOffset * 0.3);
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r + 4 / scale, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(244, 67, 54, ${0.2 * pulse})`;
    ctx.fill();
    ctx.restore();
  }
  // ─── Shared path tracer ───
  traceConnectionPath(ctx, sp, tp, conn, sourceShape) {
    if (conn.waypoints && conn.waypoints.length > 0) {
      ctx.moveTo(sp.x, sp.y);
      for (const wp of conn.waypoints)
        ctx.lineTo(wp.x, wp.y);
      ctx.lineTo(tp.x, tp.y);
    } else {
      ctx.moveTo(sp.x, sp.y);
      const isHoriz = sourceShape ? this.isHorizontalAfterRotation(sourceShape, conn.sourceAnchor) : conn.sourceAnchor === "left" || conn.sourceAnchor === "right";
      if (isHoriz) {
        ctx.lineTo(tp.x, sp.y);
        ctx.lineTo(tp.x, tp.y);
      } else {
        ctx.lineTo(sp.x, tp.y);
        ctx.lineTo(tp.x, tp.y);
      }
    }
  }
  // ─── Animation lifecycle ───
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
    this.cachedShapes = [];
    this.cachedConnections = [];
    this.cachedNodeStates = [];
    this.cachedEdgeStates = [];
  }
  isHorizontalAfterRotation(shape, anchor) {
    const rad = (shape.rotation ?? 0) * Math.PI / 180;
    const isOrigH = anchor === "left" || anchor === "right";
    const baseX = isOrigH ? 1 : 0;
    const baseY = isOrigH ? 0 : 1;
    const rotX = baseX * Math.cos(rad) - baseY * Math.sin(rad);
    const rotY = baseX * Math.sin(rad) + baseY * Math.cos(rad);
    return Math.abs(rotX) > Math.abs(rotY);
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
    \u0275\u0275elementStart(2, "span", 3);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "button", 4);
    \u0275\u0275listener("click", function SimulationToolbarComponent_Conditional_3_Template_button_click_4_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onReset.emit());
    });
    \u0275\u0275text(5, "Reset");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1("t=", ctx_r1.simState.simTimeSeconds(), "s");
  }
}
var SimulationToolbarComponent = class _SimulationToolbarComponent {
  simState = inject(SimulationStateService);
  onToggle = output();
  onReset = output();
  static \u0275fac = function SimulationToolbarComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _SimulationToolbarComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _SimulationToolbarComponent, selectors: [["app-simulation-toolbar"]], outputs: { onToggle: "onToggle", onReset: "onReset" }, decls: 4, vars: 4, consts: [[1, "sim-toolbar"], [1, "sim-toggle", 3, "click"], [1, "sim-badge"], [1, "sim-time"], [1, "sim-btn", 3, "click"]], template: function SimulationToolbarComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "button", 1);
      \u0275\u0275listener("click", function SimulationToolbarComponent_Template_button_click_1_listener() {
        return ctx.onToggle.emit();
      });
      \u0275\u0275text(2);
      \u0275\u0275elementEnd();
      \u0275\u0275template(3, SimulationToolbarComponent_Conditional_3_Template, 6, 1);
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
  }, dependencies: [CommonModule], styles: ["\n\n.sim-toolbar[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n}\n.sim-toggle[_ngcontent-%COMP%] {\n  padding: 4px 12px;\n  border: 1px solid #444;\n  border-radius: 4px;\n  background: #2a2a2a;\n  color: #ccc;\n  cursor: pointer;\n  font-size: 12px;\n  transition: all 0.15s;\n}\n.sim-toggle[_ngcontent-%COMP%]:hover {\n  background: #3a3a3a;\n}\n.sim-toggle.active[_ngcontent-%COMP%] {\n  background: #b71c1c;\n  border-color: #f44336;\n  color: #fff;\n}\n.sim-badge[_ngcontent-%COMP%] {\n  font-size: 10px;\n  color: #f44336;\n  font-weight: 700;\n  letter-spacing: 1px;\n  animation: _ngcontent-%COMP%_pulse 1.5s ease-in-out infinite;\n}\n.sim-time[_ngcontent-%COMP%] {\n  font-size: 11px;\n  color: #aaa;\n  font-family: monospace;\n}\n@keyframes _ngcontent-%COMP%_pulse {\n  50% {\n    opacity: 0.5;\n  }\n}\n.sim-btn[_ngcontent-%COMP%] {\n  padding: 4px 8px;\n  border: 1px solid #444;\n  border-radius: 4px;\n  background: #2a2a2a;\n  color: #ccc;\n  cursor: pointer;\n  font-size: 11px;\n}\n.sim-btn[_ngcontent-%COMP%]:hover {\n  background: #3a3a3a;\n}\n/*# sourceMappingURL=simulation-toolbar.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(SimulationToolbarComponent, { className: "SimulationToolbarComponent", filePath: "src/app/features/diagram-builder/simulation/components/simulation-toolbar.component.ts", lineNumber: 70 });
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
    \u0275\u0275elementStart(0, "div", 6)(1, "span", 7);
    \u0275\u0275text(2, "Level");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "span", 8);
    \u0275\u0275text(4);
    \u0275\u0275pipe(5, "number");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    let tmp_4_0;
    const state_r4 = \u0275\u0275nextContext();
    \u0275\u0275advance(3);
    \u0275\u0275classProp("flowing", state_r4.isFlowing);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind2(5, 3, (tmp_4_0 = state_r4.params.currentLevel) !== null && tmp_4_0 !== void 0 ? tmp_4_0 : 0, "1.0-0"), "% ");
  }
}
function SimulationInspectorComponent_Conditional_3_Conditional_26_For_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 11);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const warning_r5 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(warning_r5);
  }
}
function SimulationInspectorComponent_Conditional_3_Conditional_26_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 9);
    \u0275\u0275repeaterCreate(1, SimulationInspectorComponent_Conditional_3_Conditional_26_For_2_Template, 2, 1, "div", 11, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const state_r4 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275repeater(state_r4.warnings);
  }
}
function SimulationInspectorComponent_Conditional_3_Conditional_27_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 10)(1, "h4");
    \u0275\u0275text(2, "Source");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "label");
    \u0275\u0275text(4, "Pressure ");
    \u0275\u0275elementStart(5, "input", 12);
    \u0275\u0275listener("ngModelChange", function SimulationInspectorComponent_Conditional_3_Conditional_27_Template_input_ngModelChange_5_listener($event) {
      \u0275\u0275restoreView(_r6);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.updateParam("sourcePressure", $event));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(6, "label");
    \u0275\u0275text(7, "Temperature ");
    \u0275\u0275elementStart(8, "input", 12);
    \u0275\u0275listener("ngModelChange", function SimulationInspectorComponent_Conditional_3_Conditional_27_Template_input_ngModelChange_8_listener($event) {
      \u0275\u0275restoreView(_r6);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.updateParam("sourceTemperature", $event));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(9, "label");
    \u0275\u0275text(10, "Flow Rate ");
    \u0275\u0275elementStart(11, "input", 12);
    \u0275\u0275listener("ngModelChange", function SimulationInspectorComponent_Conditional_3_Conditional_27_Template_input_ngModelChange_11_listener($event) {
      \u0275\u0275restoreView(_r6);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.updateParam("sourceFlowRate", $event));
    });
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const state_r4 = \u0275\u0275nextContext();
    \u0275\u0275advance(5);
    \u0275\u0275property("ngModel", state_r4.params.sourcePressure);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", state_r4.params.sourceTemperature);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", state_r4.params.sourceFlowRate);
  }
}
function SimulationInspectorComponent_Conditional_3_Conditional_28_Conditional_10_Template(rf, ctx) {
  if (rf & 1) {
    const _r8 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "label");
    \u0275\u0275text(1, "Throttle % ");
    \u0275\u0275elementStart(2, "input", 15);
    \u0275\u0275listener("ngModelChange", function SimulationInspectorComponent_Conditional_3_Conditional_28_Conditional_10_Template_input_ngModelChange_2_listener($event) {
      \u0275\u0275restoreView(_r8);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.updateParam("throttlePercent", $event));
    });
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    let tmp_4_0;
    const state_r4 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngModel", (tmp_4_0 = state_r4.params.throttlePercent) !== null && tmp_4_0 !== void 0 ? tmp_4_0 : 50);
  }
}
function SimulationInspectorComponent_Conditional_3_Conditional_28_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 10)(1, "h4");
    \u0275\u0275text(2, "Valve");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "div", 13)(4, "button", 14);
    \u0275\u0275listener("click", function SimulationInspectorComponent_Conditional_3_Conditional_28_Template_button_click_4_listener() {
      \u0275\u0275restoreView(_r7);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.updateParam("valvePosition", "open"));
    });
    \u0275\u0275text(5, "Open");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "button", 14);
    \u0275\u0275listener("click", function SimulationInspectorComponent_Conditional_3_Conditional_28_Template_button_click_6_listener() {
      \u0275\u0275restoreView(_r7);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.updateParam("valvePosition", "throttled"));
    });
    \u0275\u0275text(7, "Throttle");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "button", 14);
    \u0275\u0275listener("click", function SimulationInspectorComponent_Conditional_3_Conditional_28_Template_button_click_8_listener() {
      \u0275\u0275restoreView(_r7);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.updateParam("valvePosition", "closed"));
    });
    \u0275\u0275text(9, "Closed");
    \u0275\u0275elementEnd()();
    \u0275\u0275template(10, SimulationInspectorComponent_Conditional_3_Conditional_28_Conditional_10_Template, 3, 1, "label");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const state_r4 = \u0275\u0275nextContext();
    \u0275\u0275advance(4);
    \u0275\u0275classProp("active", state_r4.params.valvePosition === "open")("green", state_r4.params.valvePosition === "open");
    \u0275\u0275advance(2);
    \u0275\u0275classProp("active", state_r4.params.valvePosition === "throttled")("amber", state_r4.params.valvePosition === "throttled");
    \u0275\u0275advance(2);
    \u0275\u0275classProp("active", state_r4.params.valvePosition === "closed")("red", state_r4.params.valvePosition === "closed");
    \u0275\u0275advance(2);
    \u0275\u0275conditional(state_r4.params.valvePosition === "throttled" ? 10 : -1);
  }
}
function SimulationInspectorComponent_Conditional_3_Conditional_29_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 10)(1, "h4");
    \u0275\u0275text(2, "Pump");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "button", 16);
    \u0275\u0275listener("click", function SimulationInspectorComponent_Conditional_3_Conditional_29_Template_button_click_3_listener() {
      \u0275\u0275restoreView(_r9);
      const state_r4 = \u0275\u0275nextContext();
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.updateParam("pumpRunning", !state_r4.params.pumpRunning));
    });
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "label");
    \u0275\u0275text(6, "Delta P ");
    \u0275\u0275elementStart(7, "input", 12);
    \u0275\u0275listener("ngModelChange", function SimulationInspectorComponent_Conditional_3_Conditional_29_Template_input_ngModelChange_7_listener($event) {
      \u0275\u0275restoreView(_r9);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.updateParam("pumpDeltaP", $event));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(8, "label");
    \u0275\u0275text(9, "Max Flow ");
    \u0275\u0275elementStart(10, "input", 12);
    \u0275\u0275listener("ngModelChange", function SimulationInspectorComponent_Conditional_3_Conditional_29_Template_input_ngModelChange_10_listener($event) {
      \u0275\u0275restoreView(_r9);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.updateParam("maxFlow", $event));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(11, "label");
    \u0275\u0275text(12, "Min Inlet P ");
    \u0275\u0275elementStart(13, "input", 12);
    \u0275\u0275listener("ngModelChange", function SimulationInspectorComponent_Conditional_3_Conditional_29_Template_input_ngModelChange_13_listener($event) {
      \u0275\u0275restoreView(_r9);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.updateParam("minInletPressure", $event));
    });
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const state_r4 = \u0275\u0275nextContext();
    \u0275\u0275advance(3);
    \u0275\u0275classProp("running", state_r4.params.pumpRunning);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", state_r4.params.pumpRunning ? "Stop Pump" : "Start Pump", " ");
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", state_r4.params.pumpDeltaP);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", state_r4.params.maxFlow);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", state_r4.params.minInletPressure);
  }
}
function SimulationInspectorComponent_Conditional_3_Conditional_30_Template(rf, ctx) {
  if (rf & 1) {
    const _r10 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 10)(1, "h4");
    \u0275\u0275text(2, "Vessel");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "label");
    \u0275\u0275text(4, "Volume ");
    \u0275\u0275elementStart(5, "input", 12);
    \u0275\u0275listener("ngModelChange", function SimulationInspectorComponent_Conditional_3_Conditional_30_Template_input_ngModelChange_5_listener($event) {
      \u0275\u0275restoreView(_r10);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.updateParam("volume", $event));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(6, "label");
    \u0275\u0275text(7, "Current Level % ");
    \u0275\u0275elementStart(8, "input", 17);
    \u0275\u0275listener("ngModelChange", function SimulationInspectorComponent_Conditional_3_Conditional_30_Template_input_ngModelChange_8_listener($event) {
      \u0275\u0275restoreView(_r10);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.updateParam("currentLevel", $event));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(9, "label");
    \u0275\u0275text(10, "Min Level % ");
    \u0275\u0275elementStart(11, "input", 17);
    \u0275\u0275listener("ngModelChange", function SimulationInspectorComponent_Conditional_3_Conditional_30_Template_input_ngModelChange_11_listener($event) {
      \u0275\u0275restoreView(_r10);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.updateParam("minLevel", $event));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(12, "label");
    \u0275\u0275text(13, "Head Pressure ");
    \u0275\u0275elementStart(14, "input", 12);
    \u0275\u0275listener("ngModelChange", function SimulationInspectorComponent_Conditional_3_Conditional_30_Template_input_ngModelChange_14_listener($event) {
      \u0275\u0275restoreView(_r10);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.updateParam("sourcePressure", $event));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(15, "label");
    \u0275\u0275text(16, "Fluid Temp (F) ");
    \u0275\u0275elementStart(17, "input", 12);
    \u0275\u0275listener("ngModelChange", function SimulationInspectorComponent_Conditional_3_Conditional_30_Template_input_ngModelChange_17_listener($event) {
      \u0275\u0275restoreView(_r10);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.updateParam("vesselTemperature", $event));
    });
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    let tmp_7_0;
    const state_r4 = \u0275\u0275nextContext();
    \u0275\u0275advance(5);
    \u0275\u0275property("ngModel", state_r4.params.volume);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", state_r4.params.currentLevel);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", state_r4.params.minLevel);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", state_r4.params.sourcePressure);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", (tmp_7_0 = state_r4.params.vesselTemperature) !== null && tmp_7_0 !== void 0 ? tmp_7_0 : 70);
  }
}
function SimulationInspectorComponent_Conditional_3_Conditional_31_Template(rf, ctx) {
  if (rf & 1) {
    const _r11 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 10)(1, "h4");
    \u0275\u0275text(2, "Instrument");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "label");
    \u0275\u0275text(4, "Property ");
    \u0275\u0275elementStart(5, "select", 3);
    \u0275\u0275listener("ngModelChange", function SimulationInspectorComponent_Conditional_3_Conditional_31_Template_select_ngModelChange_5_listener($event) {
      \u0275\u0275restoreView(_r11);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.updateParam("measuredProperty", $event));
    });
    \u0275\u0275elementStart(6, "option", 18);
    \u0275\u0275text(7, "pressure");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "option", 19);
    \u0275\u0275text(9, "temperature");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "option", 20);
    \u0275\u0275text(11, "flow");
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const state_r4 = \u0275\u0275nextContext();
    \u0275\u0275advance(5);
    \u0275\u0275property("ngModel", state_r4.params.measuredProperty);
  }
}
function SimulationInspectorComponent_Conditional_3_Conditional_32_Template(rf, ctx) {
  if (rf & 1) {
    const _r12 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 10)(1, "h4");
    \u0275\u0275text(2, "Motor");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "label");
    \u0275\u0275text(4, "Running ");
    \u0275\u0275elementStart(5, "input", 21);
    \u0275\u0275listener("ngModelChange", function SimulationInspectorComponent_Conditional_3_Conditional_32_Template_input_ngModelChange_5_listener($event) {
      \u0275\u0275restoreView(_r12);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.updateParam("running", $event));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(6, "label");
    \u0275\u0275text(7, "Power ");
    \u0275\u0275elementStart(8, "input", 12);
    \u0275\u0275listener("ngModelChange", function SimulationInspectorComponent_Conditional_3_Conditional_32_Template_input_ngModelChange_8_listener($event) {
      \u0275\u0275restoreView(_r12);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.updateParam("power", $event));
    });
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const state_r4 = \u0275\u0275nextContext();
    \u0275\u0275advance(5);
    \u0275\u0275property("ngModel", state_r4.params.running);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", state_r4.params.power);
  }
}
function SimulationInspectorComponent_Conditional_3_Conditional_33_Template(rf, ctx) {
  if (rf & 1) {
    const _r13 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 10)(1, "h4");
    \u0275\u0275text(2, "Pipe");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "label");
    \u0275\u0275text(4, "Friction ");
    \u0275\u0275elementStart(5, "input", 22);
    \u0275\u0275listener("ngModelChange", function SimulationInspectorComponent_Conditional_3_Conditional_33_Template_input_ngModelChange_5_listener($event) {
      \u0275\u0275restoreView(_r13);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.updateParam("frictionFactor", $event));
    });
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const state_r4 = \u0275\u0275nextContext();
    \u0275\u0275advance(5);
    \u0275\u0275property("ngModel", state_r4.params.frictionFactor);
  }
}
function SimulationInspectorComponent_Conditional_3_Conditional_34_Template(rf, ctx) {
  if (rf & 1) {
    const _r14 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 10)(1, "h4");
    \u0275\u0275text(2, "3-Way Valve");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "label");
    \u0275\u0275text(4, "Position ");
    \u0275\u0275elementStart(5, "input", 23);
    \u0275\u0275listener("ngModelChange", function SimulationInspectorComponent_Conditional_3_Conditional_34_Template_input_ngModelChange_5_listener($event) {
      \u0275\u0275restoreView(_r14);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.updateParam("threeWayPosition", $event));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(6, "div", 24)(7, "span", 25);
    \u0275\u0275text(8);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "span", 26);
    \u0275\u0275text(10);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    let tmp_3_0;
    let tmp_4_0;
    let tmp_5_0;
    const state_r4 = \u0275\u0275nextContext();
    \u0275\u0275advance(5);
    \u0275\u0275property("ngModel", (tmp_3_0 = state_r4.params.threeWayPosition) !== null && tmp_3_0 !== void 0 ? tmp_3_0 : 50);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1("\u25C0 A: ", 100 - ((tmp_4_0 = state_r4.params.threeWayPosition) !== null && tmp_4_0 !== void 0 ? tmp_4_0 : 50), "%");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("B: ", (tmp_5_0 = state_r4.params.threeWayPosition) !== null && tmp_5_0 !== void 0 ? tmp_5_0 : 50, "% \u25B6");
  }
}
function SimulationInspectorComponent_Conditional_3_Conditional_35_Template(rf, ctx) {
  if (rf & 1) {
    const _r15 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 10)(1, "h4");
    \u0275\u0275text(2, "Selector Valve");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "div", 13)(4, "button", 14);
    \u0275\u0275listener("click", function SimulationInspectorComponent_Conditional_3_Conditional_35_Template_button_click_4_listener() {
      \u0275\u0275restoreView(_r15);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.updateParam("selectedPort", "A"));
    });
    \u0275\u0275text(5, "Port A");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "button", 14);
    \u0275\u0275listener("click", function SimulationInspectorComponent_Conditional_3_Conditional_35_Template_button_click_6_listener() {
      \u0275\u0275restoreView(_r15);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.updateParam("selectedPort", "B"));
    });
    \u0275\u0275text(7, "Port B");
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const state_r4 = \u0275\u0275nextContext();
    \u0275\u0275advance(4);
    \u0275\u0275classProp("active", state_r4.params.selectedPort === "A")("green", state_r4.params.selectedPort === "A");
    \u0275\u0275advance(2);
    \u0275\u0275classProp("active", state_r4.params.selectedPort === "B")("green", state_r4.params.selectedPort === "B");
  }
}
function SimulationInspectorComponent_Conditional_3_Conditional_36_Template(rf, ctx) {
  if (rf & 1) {
    const _r16 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 10)(1, "h4");
    \u0275\u0275text(2, "Pressure Regulator");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "label");
    \u0275\u0275text(4, "Setpoint PSI ");
    \u0275\u0275elementStart(5, "input", 12);
    \u0275\u0275listener("ngModelChange", function SimulationInspectorComponent_Conditional_3_Conditional_36_Template_input_ngModelChange_5_listener($event) {
      \u0275\u0275restoreView(_r16);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.updateParam("setpointPressure", $event));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(6, "label");
    \u0275\u0275text(7, "Max Flow ");
    \u0275\u0275elementStart(8, "input", 12);
    \u0275\u0275listener("ngModelChange", function SimulationInspectorComponent_Conditional_3_Conditional_36_Template_input_ngModelChange_8_listener($event) {
      \u0275\u0275restoreView(_r16);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.updateParam("regulatorMaxFlow", $event));
    });
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const state_r4 = \u0275\u0275nextContext();
    \u0275\u0275advance(5);
    \u0275\u0275property("ngModel", state_r4.params.setpointPressure);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", state_r4.params.regulatorMaxFlow);
  }
}
function SimulationInspectorComponent_Conditional_3_Conditional_37_Template(rf, ctx) {
  if (rf & 1) {
    const _r17 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 10)(1, "h4");
    \u0275\u0275text(2, "Filter");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "label");
    \u0275\u0275text(4, "Delta P ");
    \u0275\u0275elementStart(5, "input", 12);
    \u0275\u0275listener("ngModelChange", function SimulationInspectorComponent_Conditional_3_Conditional_37_Template_input_ngModelChange_5_listener($event) {
      \u0275\u0275restoreView(_r17);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.updateParam("filterDeltaP", $event));
    });
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const state_r4 = \u0275\u0275nextContext();
    \u0275\u0275advance(5);
    \u0275\u0275property("ngModel", state_r4.params.filterDeltaP);
  }
}
function SimulationInspectorComponent_Conditional_3_Conditional_38_Template(rf, ctx) {
  if (rf & 1) {
    const _r18 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 10)(1, "h4");
    \u0275\u0275text(2, "Bearing");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "label");
    \u0275\u0275text(4, "Required Flow ");
    \u0275\u0275elementStart(5, "input", 12);
    \u0275\u0275listener("ngModelChange", function SimulationInspectorComponent_Conditional_3_Conditional_38_Template_input_ngModelChange_5_listener($event) {
      \u0275\u0275restoreView(_r18);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.updateParam("bearingFlowRequired", $event));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(6, "label");
    \u0275\u0275text(7, "Bearing Temp (F) ");
    \u0275\u0275elementStart(8, "input", 12);
    \u0275\u0275listener("ngModelChange", function SimulationInspectorComponent_Conditional_3_Conditional_38_Template_input_ngModelChange_8_listener($event) {
      \u0275\u0275restoreView(_r18);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.updateParam("bearingTemp", $event));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(9, "label");
    \u0275\u0275text(10, "Heat Transfer ");
    \u0275\u0275elementStart(11, "input", 27);
    \u0275\u0275listener("ngModelChange", function SimulationInspectorComponent_Conditional_3_Conditional_38_Template_input_ngModelChange_11_listener($event) {
      \u0275\u0275restoreView(_r18);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.updateParam("heatTransferCoeff", $event));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(12, "label");
    \u0275\u0275text(13, "Max Oil Temp (F) ");
    \u0275\u0275elementStart(14, "input", 12);
    \u0275\u0275listener("ngModelChange", function SimulationInspectorComponent_Conditional_3_Conditional_38_Template_input_ngModelChange_14_listener($event) {
      \u0275\u0275restoreView(_r18);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.updateParam("bearingMaxTemp", $event));
    });
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    let tmp_4_0;
    let tmp_5_0;
    const state_r4 = \u0275\u0275nextContext();
    \u0275\u0275advance(5);
    \u0275\u0275property("ngModel", state_r4.params.bearingFlowRequired);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", (tmp_4_0 = state_r4.params.bearingTemp) !== null && tmp_4_0 !== void 0 ? tmp_4_0 : 200);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", (tmp_5_0 = state_r4.params.heatTransferCoeff) !== null && tmp_5_0 !== void 0 ? tmp_5_0 : 0.3);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", state_r4.params.bearingMaxTemp);
  }
}
function SimulationInspectorComponent_Conditional_3_Conditional_39_Template(rf, ctx) {
  if (rf & 1) {
    const _r19 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 10)(1, "h4");
    \u0275\u0275text(2, "Heater");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "button", 16);
    \u0275\u0275listener("click", function SimulationInspectorComponent_Conditional_3_Conditional_39_Template_button_click_3_listener() {
      \u0275\u0275restoreView(_r19);
      const state_r4 = \u0275\u0275nextContext();
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.updateParam("heaterRunning", !state_r4.params.heaterRunning));
    });
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "label");
    \u0275\u0275text(6, "Delta T (F) ");
    \u0275\u0275elementStart(7, "input", 12);
    \u0275\u0275listener("ngModelChange", function SimulationInspectorComponent_Conditional_3_Conditional_39_Template_input_ngModelChange_7_listener($event) {
      \u0275\u0275restoreView(_r19);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.updateParam("heaterDeltaT", $event));
    });
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const state_r4 = \u0275\u0275nextContext();
    \u0275\u0275advance(3);
    \u0275\u0275classProp("running", state_r4.params.heaterRunning);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", state_r4.params.heaterRunning ? "Turn Off" : "Turn On", " ");
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", state_r4.params.heaterDeltaT);
  }
}
function SimulationInspectorComponent_Conditional_3_Conditional_40_Template(rf, ctx) {
  if (rf & 1) {
    const _r20 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 10)(1, "h4");
    \u0275\u0275text(2, "Vapor Extractor");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "button", 16);
    \u0275\u0275listener("click", function SimulationInspectorComponent_Conditional_3_Conditional_40_Template_button_click_3_listener() {
      \u0275\u0275restoreView(_r20);
      const state_r4 = \u0275\u0275nextContext();
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.updateParam("extractorRunning", !state_r4.params.extractorRunning));
    });
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "label");
    \u0275\u0275text(6, "Pressure Reduction ");
    \u0275\u0275elementStart(7, "input", 28);
    \u0275\u0275listener("ngModelChange", function SimulationInspectorComponent_Conditional_3_Conditional_40_Template_input_ngModelChange_7_listener($event) {
      \u0275\u0275restoreView(_r20);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.updateParam("extractorPressureReduction", $event));
    });
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const state_r4 = \u0275\u0275nextContext();
    \u0275\u0275advance(3);
    \u0275\u0275classProp("running", state_r4.params.extractorRunning);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", state_r4.params.extractorRunning ? "Stop" : "Start", " ");
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", state_r4.params.extractorPressureReduction);
  }
}
function SimulationInspectorComponent_Conditional_3_Conditional_41_Template(rf, ctx) {
  if (rf & 1) {
    const _r21 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 10)(1, "h4");
    \u0275\u0275text(2, "Heat Exchanger");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "label");
    \u0275\u0275text(4, "Effectiveness ");
    \u0275\u0275elementStart(5, "input", 27);
    \u0275\u0275listener("ngModelChange", function SimulationInspectorComponent_Conditional_3_Conditional_41_Template_input_ngModelChange_5_listener($event) {
      \u0275\u0275restoreView(_r21);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.updateParam("hxEffectiveness", $event));
    });
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    let tmp_3_0;
    const state_r4 = \u0275\u0275nextContext();
    \u0275\u0275advance(5);
    \u0275\u0275property("ngModel", (tmp_3_0 = state_r4.params.hxEffectiveness) !== null && tmp_3_0 !== void 0 ? tmp_3_0 : 0.7);
  }
}
function SimulationInspectorComponent_Conditional_3_Conditional_42_Template(rf, ctx) {
  if (rf & 1) {
    const _r22 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 10)(1, "h4");
    \u0275\u0275text(2, "Accumulator");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "label");
    \u0275\u0275text(4, "Set Pressure ");
    \u0275\u0275elementStart(5, "input", 12);
    \u0275\u0275listener("ngModelChange", function SimulationInspectorComponent_Conditional_3_Conditional_42_Template_input_ngModelChange_5_listener($event) {
      \u0275\u0275restoreView(_r22);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.updateParam("accumulatorSetPressure", $event));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(6, "label");
    \u0275\u0275text(7, "Damping Rate ");
    \u0275\u0275elementStart(8, "input", 27);
    \u0275\u0275listener("ngModelChange", function SimulationInspectorComponent_Conditional_3_Conditional_42_Template_input_ngModelChange_8_listener($event) {
      \u0275\u0275restoreView(_r22);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.updateParam("accumulatorDamping", $event));
    });
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    let tmp_3_0;
    let tmp_4_0;
    const state_r4 = \u0275\u0275nextContext();
    \u0275\u0275advance(5);
    \u0275\u0275property("ngModel", (tmp_3_0 = state_r4.params.accumulatorSetPressure) !== null && tmp_3_0 !== void 0 ? tmp_3_0 : 50);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", (tmp_4_0 = state_r4.params.accumulatorDamping) !== null && tmp_4_0 !== void 0 ? tmp_4_0 : 0.3);
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
    \u0275\u0275elementEnd()();
    \u0275\u0275template(25, SimulationInspectorComponent_Conditional_3_Conditional_25_Template, 6, 6, "div", 6);
    \u0275\u0275elementEnd();
    \u0275\u0275template(26, SimulationInspectorComponent_Conditional_3_Conditional_26_Template, 3, 0, "div", 9)(27, SimulationInspectorComponent_Conditional_3_Conditional_27_Template, 12, 3, "div", 10)(28, SimulationInspectorComponent_Conditional_3_Conditional_28_Template, 11, 13, "div", 10)(29, SimulationInspectorComponent_Conditional_3_Conditional_29_Template, 14, 6, "div", 10)(30, SimulationInspectorComponent_Conditional_3_Conditional_30_Template, 18, 5, "div", 10)(31, SimulationInspectorComponent_Conditional_3_Conditional_31_Template, 12, 1, "div", 10)(32, SimulationInspectorComponent_Conditional_3_Conditional_32_Template, 9, 2, "div", 10)(33, SimulationInspectorComponent_Conditional_3_Conditional_33_Template, 6, 1, "div", 10)(34, SimulationInspectorComponent_Conditional_3_Conditional_34_Template, 11, 3, "div", 10)(35, SimulationInspectorComponent_Conditional_3_Conditional_35_Template, 8, 8, "div", 10)(36, SimulationInspectorComponent_Conditional_3_Conditional_36_Template, 9, 2, "div", 10)(37, SimulationInspectorComponent_Conditional_3_Conditional_37_Template, 6, 1, "div", 10)(38, SimulationInspectorComponent_Conditional_3_Conditional_38_Template, 15, 4, "div", 10)(39, SimulationInspectorComponent_Conditional_3_Conditional_39_Template, 8, 4, "div", 10)(40, SimulationInspectorComponent_Conditional_3_Conditional_40_Template, 8, 4, "div", 10)(41, SimulationInspectorComponent_Conditional_3_Conditional_41_Template, 6, 1, "div", 10)(42, SimulationInspectorComponent_Conditional_3_Conditional_42_Template, 9, 2, "div", 10);
  }
  if (rf & 2) {
    const state_r4 = ctx;
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", state_r4.role);
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r1.roles);
    \u0275\u0275advance(6);
    \u0275\u0275classProp("flowing", state_r4.isFlowing);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind2(12, 28, state_r4.pressure, "1.1-1"), " psi ");
    \u0275\u0275advance(5);
    \u0275\u0275classProp("flowing", state_r4.isFlowing);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind2(18, 31, state_r4.temperature, "1.0-0"), " F ");
    \u0275\u0275advance(5);
    \u0275\u0275classProp("flowing", state_r4.isFlowing);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind2(24, 34, state_r4.flowRate, "1.0-0"), " u/hr ");
    \u0275\u0275advance(2);
    \u0275\u0275conditional(state_r4.role === "vessel" ? 25 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional((state_r4.warnings == null ? null : state_r4.warnings.length) ? 26 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(state_r4.role === "source" ? 27 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(state_r4.role === "valve" ? 28 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(state_r4.role === "pump" ? 29 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(state_r4.role === "vessel" ? 30 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(state_r4.role === "instrument" ? 31 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(state_r4.role === "motor" ? 32 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(state_r4.role === "pipe" ? 33 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(state_r4.role === "three-way-valve" ? 34 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(state_r4.role === "selector-valve" ? 35 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(state_r4.role === "pressure-regulator" ? 36 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(state_r4.role === "filter" ? 37 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(state_r4.role === "bearing" ? 38 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(state_r4.role === "heater" ? 39 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(state_r4.role === "vapor-extractor" ? 40 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(state_r4.role === "heat-exchanger" ? 41 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(state_r4.role === "accumulator" ? 42 : -1);
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
  roles = [
    "source",
    "sink",
    "valve",
    "pump",
    "vessel",
    "instrument",
    "motor",
    "junction",
    "pipe",
    "three-way-valve",
    "selector-valve",
    "pressure-regulator",
    "filter",
    "bearing",
    "heater",
    "vapor-extractor",
    "heat-exchanger",
    "accumulator"
  ];
  constructor() {
    effect((onCleanup) => {
      const shape = this.shapeManager.singleSelectedShape();
      if (!shape) {
        this.nodeState.set(null);
        return;
      }
      this.nodeState.set(this.simState.getNodeState(shape.id) ?? null);
      const obs = this.simState.getNodeState$(shape.id);
      const sub = obs?.subscribe((state) => this.nodeState.set(state));
      onCleanup(() => sub?.unsubscribe());
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
    this.simState.updateNodeRole(state.shapeId, role);
  }
  static \u0275fac = function SimulationInspectorComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _SimulationInspectorComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _SimulationInspectorComponent, selectors: [["app-simulation-inspector"]], decls: 5, vars: 1, consts: [[1, "sim-inspector"], [1, "info"], [1, "role-section"], [3, "ngModelChange", "ngModel"], [3, "value"], [1, "readout"], [1, "readout-row"], [1, "readout-label"], [1, "readout-value"], [1, "warning-box"], [1, "param-section"], [1, "warning-item"], ["type", "number", 3, "ngModelChange", "ngModel"], [1, "valve-buttons"], [3, "click"], ["type", "range", "min", "0", "max", "100", "step", "5", 3, "ngModelChange", "ngModel"], [1, "pump-toggle", 3, "click"], ["type", "number", "min", "0", "max", "100", 3, "ngModelChange", "ngModel"], ["value", "pressure"], ["value", "temperature"], ["value", "flow"], ["type", "checkbox", 3, "ngModelChange", "ngModel"], ["type", "number", "step", "0.1", 3, "ngModelChange", "ngModel"], ["type", "range", "min", "0", "max", "100", "step", "1", 3, "ngModelChange", "ngModel"], [2, "display", "flex", "justify-content", "space-between", "font-size", "11px", "margin-bottom", "4px"], [2, "color", "#4fc3f7"], [2, "color", "#ff9800"], ["type", "number", "step", "0.05", "min", "0", "max", "1", 3, "ngModelChange", "ngModel"], ["type", "number", "step", "0.5", 3, "ngModelChange", "ngModel"]], template: function SimulationInspectorComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "h3");
      \u0275\u0275text(2, "Simulation");
      \u0275\u0275elementEnd();
      \u0275\u0275template(3, SimulationInspectorComponent_Conditional_3_Template, 43, 37)(4, SimulationInspectorComponent_Conditional_4_Template, 2, 0, "p", 1);
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      let tmp_0_0;
      \u0275\u0275advance(3);
      \u0275\u0275conditional((tmp_0_0 = ctx.nodeState()) ? 3 : 4, tmp_0_0);
    }
  }, dependencies: [CommonModule, DecimalPipe, FormsModule, NgSelectOption, \u0275NgSelectMultipleOption, DefaultValueAccessor, NumberValueAccessor, RangeValueAccessor, CheckboxControlValueAccessor, SelectControlValueAccessor, NgControlStatus, MinValidator, MaxValidator, NgModel], styles: ["\n\n.sim-inspector[_ngcontent-%COMP%] {\n  width: 240px;\n  background: #1a1a1a;\n  border-left: 1px solid #333;\n  padding: 12px;\n  overflow-y: auto;\n}\nh3[_ngcontent-%COMP%] {\n  margin: 0 0 12px;\n  font-size: 14px;\n  color: #f44336;\n}\nh4[_ngcontent-%COMP%] {\n  margin: 8px 0 6px;\n  font-size: 12px;\n  color: #aaa;\n  text-transform: uppercase;\n}\n.role-section[_ngcontent-%COMP%] {\n  margin-bottom: 12px;\n}\nlabel[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  font-size: 12px;\n  color: #999;\n  margin-bottom: 6px;\n  gap: 8px;\n}\nselect[_ngcontent-%COMP%], \ninput[type=number][_ngcontent-%COMP%] {\n  width: 100px;\n  padding: 4px 6px;\n  background: #2a2a2a;\n  border: 1px solid #444;\n  color: #ddd;\n  border-radius: 3px;\n  font-size: 12px;\n}\ninput[type=range][_ngcontent-%COMP%] {\n  width: 100px;\n}\ninput[type=checkbox][_ngcontent-%COMP%] {\n  width: auto;\n}\n.readout[_ngcontent-%COMP%] {\n  background: #111;\n  border: 1px solid #333;\n  border-radius: 4px;\n  padding: 8px;\n  margin-bottom: 12px;\n}\n.readout-row[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  font-size: 12px;\n  margin-bottom: 4px;\n}\n.readout-label[_ngcontent-%COMP%] {\n  color: #888;\n}\n.readout-value[_ngcontent-%COMP%] {\n  color: #666;\n  font-family: monospace;\n}\n.readout-value.flowing[_ngcontent-%COMP%] {\n  color: #81d4fa;\n}\n.param-section[_ngcontent-%COMP%] {\n  margin-bottom: 12px;\n}\n.valve-buttons[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 4px;\n  margin-bottom: 8px;\n}\n.valve-buttons[_ngcontent-%COMP%]   button[_ngcontent-%COMP%] {\n  flex: 1;\n  padding: 6px 4px;\n  border: 1px solid #444;\n  border-radius: 3px;\n  background: #2a2a2a;\n  color: #ccc;\n  cursor: pointer;\n  font-size: 11px;\n}\n.valve-buttons[_ngcontent-%COMP%]   button.active.green[_ngcontent-%COMP%] {\n  background: #2e7d32;\n  border-color: #4caf50;\n  color: #fff;\n}\n.valve-buttons[_ngcontent-%COMP%]   button.active.amber[_ngcontent-%COMP%] {\n  background: #e65100;\n  border-color: #ff9800;\n  color: #fff;\n}\n.valve-buttons[_ngcontent-%COMP%]   button.active.red[_ngcontent-%COMP%] {\n  background: #c62828;\n  border-color: #f44336;\n  color: #fff;\n}\n.pump-toggle[_ngcontent-%COMP%] {\n  width: 100%;\n  padding: 8px;\n  border: 1px solid #444;\n  border-radius: 4px;\n  background: #2a2a2a;\n  color: #ccc;\n  cursor: pointer;\n  font-size: 12px;\n  margin-bottom: 8px;\n}\n.pump-toggle.running[_ngcontent-%COMP%] {\n  background: #2e7d32;\n  border-color: #4caf50;\n  color: #fff;\n}\n.warning-box[_ngcontent-%COMP%] {\n  margin-bottom: 12px;\n  padding: 8px;\n  border: 1px solid #5d1f1f;\n  border-radius: 4px;\n  background: rgba(244, 67, 54, 0.1);\n}\n.warning-item[_ngcontent-%COMP%] {\n  color: #ff8a80;\n  font-size: 11px;\n  margin-bottom: 4px;\n}\n.info[_ngcontent-%COMP%] {\n  font-size: 12px;\n  color: #666;\n}\n/*# sourceMappingURL=simulation-inspector.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(SimulationInspectorComponent, { className: "SimulationInspectorComponent", filePath: "src/app/features/diagram-builder/simulation/components/simulation-inspector.component.ts", lineNumber: 421 });
})();

// src/app/features/diagram-builder/components/equipment-library/equipment-library.component.ts
var _forTrack03 = ($index, $item) => $item.id;
function EquipmentLibraryComponent_For_12_Conditional_1_Conditional_6_For_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 17);
    \u0275\u0275listener("click", function EquipmentLibraryComponent_For_12_Conditional_1_Conditional_6_For_2_Template_div_click_0_listener() {
      const sym_r5 = \u0275\u0275restoreView(_r4).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r2.onSymbolClick(sym_r5));
    })("dblclick", function EquipmentLibraryComponent_For_12_Conditional_1_Conditional_6_For_2_Template_div_dblclick_0_listener() {
      const sym_r5 = \u0275\u0275restoreView(_r4).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r2.placeSymbolOnCanvas(sym_r5.id));
    })("contextmenu", function EquipmentLibraryComponent_For_12_Conditional_1_Conditional_6_For_2_Template_div_contextmenu_0_listener($event) {
      const sym_r5 = \u0275\u0275restoreView(_r4).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r2.onSymbolRightClick($event, sym_r5));
    });
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(1, "svg", 18);
    \u0275\u0275element(2, "path", 19);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(3, "span", 20);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const sym_r5 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext(4);
    \u0275\u0275classProp("selected", ctx_r2.selectedSymbolId() === sym_r5.id);
    \u0275\u0275property("title", sym_r5.name);
    \u0275\u0275advance();
    \u0275\u0275attribute("viewBox", "0 0 " + sym_r5.originalWidth + " " + sym_r5.originalHeight);
    \u0275\u0275advance();
    \u0275\u0275attribute("d", sym_r5.svgPath)("stroke", ctx_r2.selectedSymbolId() === sym_r5.id ? "#4fc3f7" : "#ccc");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(sym_r5.name);
  }
}
function EquipmentLibraryComponent_For_12_Conditional_1_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 15);
    \u0275\u0275repeaterCreate(1, EquipmentLibraryComponent_For_12_Conditional_1_Conditional_6_For_2_Template, 5, 7, "div", 16, _forTrack03);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275nextContext(2);
    const symbols_r6 = \u0275\u0275readContextLet(0);
    \u0275\u0275advance();
    \u0275\u0275repeater(symbols_r6);
  }
}
function EquipmentLibraryComponent_For_12_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 12)(1, "button", 13);
    \u0275\u0275listener("click", function EquipmentLibraryComponent_For_12_Conditional_1_Template_button_click_1_listener() {
      \u0275\u0275restoreView(_r1);
      const cat_r2 = \u0275\u0275nextContext().$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.toggleCategory(cat_r2.id));
    });
    \u0275\u0275elementStart(2, "span");
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "span", 14);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd()();
    \u0275\u0275template(6, EquipmentLibraryComponent_For_12_Conditional_1_Conditional_6_Template, 3, 0, "div", 15);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const cat_r2 = \u0275\u0275nextContext().$implicit;
    const symbols_r6 = \u0275\u0275readContextLet(0);
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275styleProp("border-left-color", cat_r2.color);
    \u0275\u0275classProp("expanded", ctx_r2.expandedCategory() === cat_r2.id);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(cat_r2.label);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(symbols_r6.length);
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r2.expandedCategory() === cat_r2.id ? 6 : -1);
  }
}
function EquipmentLibraryComponent_For_12_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275declareLet(0);
    \u0275\u0275template(1, EquipmentLibraryComponent_For_12_Conditional_1_Template, 7, 7, "div", 12);
  }
  if (rf & 2) {
    const cat_r2 = ctx.$implicit;
    const symbols_r7 = \u0275\u0275storeLet(\u0275\u0275nextContext().getFilteredSymbols(cat_r2.id));
    \u0275\u0275advance();
    \u0275\u0275conditional(symbols_r7.length > 0 ? 1 : -1);
  }
}
function EquipmentLibraryComponent_Conditional_18_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "span", 8);
  }
}
var EquipmentLibraryComponent = class _EquipmentLibraryComponent {
  api = inject(SimEquipmentApiService);
  pidSymbols = inject(PIDSymbolsService);
  onEquipmentClick = output();
  onEquipmentAddToCanvas = output();
  allEquipment = signal([]);
  isLoading = signal(true);
  searchQuery = signal("");
  expandedCategory = signal("valve");
  selectedSymbolId = signal(null);
  ctxMenuVisible = signal(false);
  ctxMenuPosition = signal({ x: 0, y: 0 });
  ctxMenuItem = signal(null);
  ctxMenuActions = [];
  templateMap = /* @__PURE__ */ new Map();
  allSymbols = this.pidSymbols.getAllSymbols();
  categoryMeta = [
    { id: "valve", label: "Valves", color: "#4caf50" },
    { id: "pump", label: "Pumps", color: "#ff9800" },
    { id: "vessel", label: "Vessels", color: "#00bcd4" },
    { id: "instrument", label: "Instruments", color: "#cddc39" },
    { id: "electrical", label: "Electrical", color: "#ff5722" },
    { id: "rotating-equipment", label: "Rotating Equip", color: "#42a5f5" }
  ];
  static ROLE_COLORS = {
    source: "#2196f3",
    sink: "#9c27b0",
    valve: "#4caf50",
    pump: "#ff9800",
    pipe: "#795548",
    vessel: "#00bcd4",
    instrument: "#cddc39",
    motor: "#ff5722"
  };
  static ROLE_ORDER = ["source", "valve", "pump", "vessel", "instrument", "motor", "junction", "pipe", "sink"];
  getFilteredSymbols(category) {
    const query = this.searchQuery().toLowerCase().trim();
    const symbols = this.pidSymbols.getSymbolsByCategory(category);
    if (!query)
      return symbols;
    return symbols.filter((s) => s.name.toLowerCase().includes(query));
  }
  toggleCategory(categoryId) {
    this.expandedCategory.set(this.expandedCategory() === categoryId ? null : categoryId);
  }
  // --- Symbol events ---
  onSymbolClick(sym) {
    this.selectedSymbolId.set(sym.id);
  }
  onSymbolRightClick(event, sym) {
    event.preventDefault();
    event.stopPropagation();
    this.ctxMenuItem.set(sym.id);
    this.ctxMenuPosition.set({ x: event.clientX, y: event.clientY });
    this.ctxMenuActions = [
      {
        id: "add-to-diagram",
        label: "Add to Diagram",
        action: () => this.placeSymbolOnCanvas(sym.id)
      }
    ];
    this.ctxMenuVisible.set(true);
  }
  placeSymbolOnCanvas(symbolId) {
    const symbol = this.pidSymbols.getSymbolById(symbolId);
    if (!symbol)
      return;
    const role = SYMBOL_ROLE_MAP[symbol.id] ?? "junction";
    const dto = {
      name: symbol.name,
      symbolId: symbol.id,
      svgPath: symbol.svgPath,
      defaultWidth: symbol.width,
      defaultHeight: symbol.height,
      simRole: role,
      simParamsJson: serializeSimParams(defaultSimParams(role))
    };
    this.api.create(dto).subscribe({
      next: (res) => {
        if (res.responseData) {
          this.api.upsertCached(res.responseData);
          this.onEquipmentAddToCanvas.emit(res.responseData);
          this.loadAll();
        }
      }
    });
  }
  // --- Saved Templates (unchanged) ---
  templateMenuItems = computed(() => {
    const equipment = this.allEquipment();
    const grouped = /* @__PURE__ */ new Map();
    for (const eq of equipment) {
      const role = eq.simRole || "junction";
      if (!grouped.has(role))
        grouped.set(role, []);
      grouped.get(role).push(eq);
    }
    this.templateMap.clear();
    for (const eq of equipment) {
      if (eq.id != null)
        this.templateMap.set(eq.id, eq);
    }
    return _EquipmentLibraryComponent.ROLE_ORDER.filter((role) => grouped.has(role)).map((role) => new NestedItemImpl({
      id: `role-${role}`,
      name: `${role.charAt(0).toUpperCase() + role.slice(1)} (${grouped.get(role).length})`,
      objectType: "Group",
      color: _EquipmentLibraryComponent.ROLE_COLORS[role] || "#888",
      isExpanded: true,
      values: grouped.get(role).map((eq) => new NestedItemImpl({
        id: eq.id,
        name: eq.name || "Unnamed",
        subtitle: eq.sourceEntityType ? `${eq.sourceEntityType}:${eq.sourceEntityId}` : void 0,
        objectType: "SimEquipment",
        color: _EquipmentLibraryComponent.ROLE_COLORS[role] || "#888"
      }))
    }));
  });
  ngOnInit() {
    this.loadAll();
  }
  onTemplateClick(item) {
    if (item.objectType !== "SimEquipment")
      return;
    const eq = this.templateMap.get(item.id);
    if (eq)
      this.onEquipmentClick.emit(eq);
  }
  onTemplateDblClick(item) {
    if (item.objectType !== "SimEquipment")
      return;
    const eq = this.templateMap.get(item.id);
    if (eq)
      this.onEquipmentAddToCanvas.emit(eq);
  }
  onTemplateRightClick(event) {
    event.event.preventDefault();
    event.event.stopPropagation();
    if (event.item.objectType !== "SimEquipment")
      return;
    const eq = this.templateMap.get(event.item.id);
    if (!eq)
      return;
    this.ctxMenuItem.set(eq);
    this.ctxMenuPosition.set({ x: event.event.clientX, y: event.event.clientY });
    this.ctxMenuActions = [
      {
        id: "add-to-diagram",
        label: "Add to Diagram",
        action: () => this.onEquipmentAddToCanvas.emit(eq)
      },
      { id: "div1", label: "", divider: true, action: () => {
      } },
      {
        id: "rename",
        label: "Rename",
        action: () => this.renameEquipment(eq)
      },
      {
        id: "delete",
        label: "Delete Template",
        action: () => this.deleteEquipment(eq)
      }
    ];
    this.ctxMenuVisible.set(true);
  }
  loadAll() {
    this.isLoading.set(true);
    this.api.getAll().subscribe({
      next: (res) => {
        const items = res.responseData || [];
        this.allEquipment.set(items);
        for (const eq of items)
          this.api.upsertCached(eq);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }
  renameEquipment(eq) {
    const newName = prompt("Rename equipment template:", eq.name || "");
    if (newName == null || newName.trim() === "" || newName === eq.name)
      return;
    if (eq.id == null)
      return;
    this.api.update(eq.id, __spreadProps(__spreadValues({}, eq), { name: newName.trim() })).subscribe({
      next: (res) => {
        if (res.responseData)
          this.api.upsertCached(res.responseData);
        this.loadAll();
      }
    });
  }
  deleteEquipment(eq) {
    if (eq.id == null)
      return;
    if (!confirm(`Delete template "${eq.name || "Unnamed"}"?`))
      return;
    this.api.delete(eq.id).subscribe({
      next: () => this.loadAll()
    });
  }
  static \u0275fac = function EquipmentLibraryComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _EquipmentLibraryComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _EquipmentLibraryComponent, selectors: [["app-equipment-library"]], outputs: { onEquipmentClick: "onEquipmentClick", onEquipmentAddToCanvas: "onEquipmentAddToCanvas" }, decls: 22, vars: 11, consts: [[1, "library-panel"], ["type", "text", "placeholder", "Search symbols...", 1, "search-input", 3, "input", "value"], ["open", "", 1, "section"], [1, "section-header"], [1, "section-count"], [1, "section-body"], [1, "categories-container"], [1, "section"], [1, "loading-dot"], [1, "section-body", "templates-body"], [3, "itemClick", "itemDblClick", "itemRightClick", "menuItems", "enableSearch", "searchPlaceholder"], [3, "closeMenu", "isVisible", "position", "selectedItem", "actions"], [1, "category-section"], [1, "category-toggle", 3, "click"], [1, "cat-count"], [1, "symbol-grid"], [1, "symbol-card", 3, "selected", "title"], [1, "symbol-card", 3, "click", "dblclick", "contextmenu", "title"], ["width", "36", "height", "36", 1, "symbol-preview"], ["fill", "none", "stroke-width", "2"], [1, "symbol-name"]], template: function EquipmentLibraryComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "h3");
      \u0275\u0275text(2, "Equipment Library");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(3, "input", 1);
      \u0275\u0275listener("input", function EquipmentLibraryComponent_Template_input_input_3_listener($event) {
        return ctx.searchQuery.set($event.target.value);
      });
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(4, "details", 2)(5, "summary", 3);
      \u0275\u0275text(6, " P&ID Symbols ");
      \u0275\u0275elementStart(7, "span", 4);
      \u0275\u0275text(8);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(9, "div", 5)(10, "div", 6);
      \u0275\u0275repeaterCreate(11, EquipmentLibraryComponent_For_12_Template, 2, 2, null, null, _forTrack03);
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(13, "details", 7)(14, "summary", 3);
      \u0275\u0275text(15, " Saved Templates ");
      \u0275\u0275elementStart(16, "span", 4);
      \u0275\u0275text(17);
      \u0275\u0275elementEnd();
      \u0275\u0275template(18, EquipmentLibraryComponent_Conditional_18_Template, 1, 0, "span", 8);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(19, "div", 9)(20, "app-rf-toggle-menu", 10);
      \u0275\u0275listener("itemClick", function EquipmentLibraryComponent_Template_app_rf_toggle_menu_itemClick_20_listener($event) {
        return ctx.onTemplateClick($event);
      })("itemDblClick", function EquipmentLibraryComponent_Template_app_rf_toggle_menu_itemDblClick_20_listener($event) {
        return ctx.onTemplateDblClick($event);
      })("itemRightClick", function EquipmentLibraryComponent_Template_app_rf_toggle_menu_itemRightClick_20_listener($event) {
        return ctx.onTemplateRightClick($event);
      });
      \u0275\u0275elementEnd()()()();
      \u0275\u0275elementStart(21, "app-context-menu", 11);
      \u0275\u0275listener("closeMenu", function EquipmentLibraryComponent_Template_app_context_menu_closeMenu_21_listener() {
        return ctx.ctxMenuVisible.set(false);
      });
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      \u0275\u0275advance(3);
      \u0275\u0275property("value", ctx.searchQuery());
      \u0275\u0275advance(5);
      \u0275\u0275textInterpolate(ctx.allSymbols.length);
      \u0275\u0275advance(3);
      \u0275\u0275repeater(ctx.categoryMeta);
      \u0275\u0275advance(6);
      \u0275\u0275textInterpolate(ctx.allEquipment().length);
      \u0275\u0275advance();
      \u0275\u0275conditional(ctx.isLoading() ? 18 : -1);
      \u0275\u0275advance(2);
      \u0275\u0275property("menuItems", ctx.templateMenuItems())("enableSearch", true)("searchPlaceholder", "Search templates...");
      \u0275\u0275advance();
      \u0275\u0275property("isVisible", ctx.ctxMenuVisible())("position", ctx.ctxMenuPosition())("selectedItem", ctx.ctxMenuItem())("actions", ctx.ctxMenuActions);
    }
  }, dependencies: [CommonModule, RfToggleMenuComponent, ContextMenuComponent], styles: ['\n\n[_nghost-%COMP%] {\n  display: block;\n  height: 100%;\n  overflow: hidden;\n}\n.library-panel[_ngcontent-%COMP%] {\n  width: 240px;\n  height: 100%;\n  background: #1a1a1a;\n  border-right: 1px solid #333;\n  padding: 8px;\n  display: flex;\n  flex-direction: column;\n  gap: 2px;\n  overflow: hidden;\n  box-sizing: border-box;\n}\nh3[_ngcontent-%COMP%] {\n  margin: 0 0 4px;\n  font-size: 13px;\n  color: #aaa;\n}\n.search-input[_ngcontent-%COMP%] {\n  width: 100%;\n  padding: 6px 8px;\n  background: #2a2a2a;\n  border: 1px solid #444;\n  border-radius: 4px;\n  color: #ccc;\n  font-size: 12px;\n  margin-bottom: 4px;\n  box-sizing: border-box;\n}\n.search-input[_ngcontent-%COMP%]::placeholder {\n  color: #666;\n}\n.search-input[_ngcontent-%COMP%]:focus {\n  outline: none;\n  border-color: #2196f3;\n}\n.section[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  min-height: 0;\n  border-top: 1px solid #333;\n}\n.section[open][_ngcontent-%COMP%] {\n  flex: 1;\n}\n.section-header[_ngcontent-%COMP%] {\n  font-size: 11px;\n  color: #999;\n  cursor: pointer;\n  padding: 6px 2px;\n  list-style: none;\n  -webkit-user-select: none;\n  user-select: none;\n  display: flex;\n  align-items: center;\n  gap: 6px;\n}\n.section-header[_ngcontent-%COMP%]::-webkit-details-marker {\n  display: none;\n}\n.section-header[_ngcontent-%COMP%]::before {\n  content: "\\25b6";\n  display: inline-block;\n  font-size: 7px;\n  transition: transform 0.15s ease;\n}\ndetails[open][_ngcontent-%COMP%]    > .section-header[_ngcontent-%COMP%]::before {\n  transform: rotate(90deg);\n}\n.section-count[_ngcontent-%COMP%] {\n  font-size: 10px;\n  color: #666;\n  margin-left: auto;\n}\n.loading-dot[_ngcontent-%COMP%] {\n  width: 6px;\n  height: 6px;\n  border-radius: 50%;\n  background: #4caf50;\n  animation: _ngcontent-%COMP%_pulse 1s infinite;\n}\n@keyframes _ngcontent-%COMP%_pulse {\n  0%, 100% {\n    opacity: 0.3;\n  }\n  50% {\n    opacity: 1;\n  }\n}\n.section-body[_ngcontent-%COMP%] {\n  flex: 1;\n  min-height: 0;\n  overflow-y: auto;\n}\n.section-body[_ngcontent-%COMP%]   app-rf-toggle-menu[_ngcontent-%COMP%] {\n  display: block;\n  height: 100%;\n}\n.templates-body[_ngcontent-%COMP%] {\n  overflow: hidden;\n}\n.categories-container[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 2px;\n}\n.category-toggle[_ngcontent-%COMP%] {\n  width: 100%;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 6px 8px;\n  background: #222;\n  border: none;\n  border-left: 3px solid #444;\n  color: #bbb;\n  font-size: 11px;\n  font-weight: 600;\n  cursor: pointer;\n  text-align: left;\n  transition: all 0.15s;\n}\n.category-toggle[_ngcontent-%COMP%]:hover {\n  background: #2a2a2a;\n  color: #ddd;\n}\n.category-toggle.expanded[_ngcontent-%COMP%] {\n  background: #2a2a2a;\n  color: #fff;\n}\n.cat-count[_ngcontent-%COMP%] {\n  font-size: 10px;\n  color: #666;\n  font-weight: 400;\n}\n.symbol-grid[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 4px;\n  padding: 6px 4px;\n  background: #1e1e1e;\n}\n.symbol-card[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  padding: 6px 2px 4px;\n  background: #252525;\n  border: 1px solid #333;\n  border-radius: 4px;\n  cursor: pointer;\n  transition: all 0.15s;\n  min-height: 54px;\n}\n.symbol-card[_ngcontent-%COMP%]:hover {\n  background: #2d2d2d;\n  border-color: #555;\n  transform: translateY(-1px);\n}\n.symbol-card.selected[_ngcontent-%COMP%] {\n  background: #1a3a5c;\n  border-color: #2196f3;\n}\n.symbol-preview[_ngcontent-%COMP%] {\n  flex-shrink: 0;\n  margin-bottom: 2px;\n}\n.symbol-name[_ngcontent-%COMP%] {\n  font-size: 9px;\n  color: #888;\n  text-align: center;\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  max-width: 100%;\n  line-height: 1.2;\n}\n.symbol-card[_ngcontent-%COMP%]:hover   .symbol-name[_ngcontent-%COMP%] {\n  color: #bbb;\n}\n.symbol-card.selected[_ngcontent-%COMP%]   .symbol-name[_ngcontent-%COMP%] {\n  color: #4fc3f7;\n}\n.section-body[_ngcontent-%COMP%]::-webkit-scrollbar {\n  width: 5px;\n}\n.section-body[_ngcontent-%COMP%]::-webkit-scrollbar-track {\n  background: transparent;\n}\n.section-body[_ngcontent-%COMP%]::-webkit-scrollbar-thumb {\n  background: #444;\n  border-radius: 3px;\n}\n.section-body[_ngcontent-%COMP%]::-webkit-scrollbar-thumb:hover {\n  background: #666;\n}\n/*# sourceMappingURL=equipment-library.component.css.map */'] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(EquipmentLibraryComponent, { className: "EquipmentLibraryComponent", filePath: "src/app/features/diagram-builder/components/equipment-library/equipment-library.component.ts", lineNumber: 292 });
})();

// src/app/features/diagram-builder/components/diagram-canvas/diagram-canvas.component.ts
var _c0 = ["canvasContainer"];
var _c1 = ["gridCanvas"];
var _c2 = ["shapeCanvas"];
var _c3 = ["tempCanvas"];
function DiagramCanvasComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 5)(1, "app-diagram-toolbar", 14);
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
    })("onSave", function DiagramCanvasComponent_Conditional_1_Template_app_diagram_toolbar_onSave_1_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.saveDiagram());
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
    \u0275\u0275elementStart(2, "app-simulation-toolbar", 15);
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
    \u0275\u0275elementStart(0, "app-equipment-library", 16);
    \u0275\u0275listener("onEquipmentClick", function DiagramCanvasComponent_Conditional_3_Template_app_equipment_library_onEquipmentClick_0_listener($event) {
      \u0275\u0275restoreView(_r4);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onEquipmentDragStart($event));
    })("onEquipmentAddToCanvas", function DiagramCanvasComponent_Conditional_3_Template_app_equipment_library_onEquipmentAddToCanvas_0_listener($event) {
      \u0275\u0275restoreView(_r4);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.addEquipmentToCanvas($event));
    });
    \u0275\u0275elementEnd();
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
    \u0275\u0275elementStart(0, "span", 12);
    \u0275\u0275text(1, "\u25CF Unsaved");
    \u0275\u0275elementEnd();
  }
}
function DiagramCanvasComponent_Conditional_20_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 13);
    \u0275\u0275text(1, "Saving...");
    \u0275\u0275elementEnd();
  }
}
var DiagramCanvasComponent = class _DiagramCanvasComponent {
  embeddedDiagramId = input(null);
  embeddedMode = input(null);
  initialDiagramName = input(null);
  initialContextFileId = input(null);
  initialContextFileName = input(null);
  backgroundImageUrl = input(null);
  focusSourceEntityType = input(null);
  focusSourceEntityId = input(null);
  focusConnectionId = input(null);
  selectedSourceChange = output();
  selectedConnectionChange = output();
  simulationRunningChange = output();
  selectedNodeStateChange = output();
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
  simEquipmentApi = inject(SimEquipmentApiService);
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
  isDraggingWaypoint = false;
  draggedWaypointConnectionId = null;
  draggedWaypointIndex = -1;
  animFrameId = 0;
  backgroundImage = null;
  backgroundImageUrlLoaded = null;
  backgroundImageUrlPending = null;
  lastEmbeddedDiagramId = null;
  lastFocusedSourceKey = null;
  lastFocusedConnectionKey = null;
  Math = Math;
  constructor() {
    this.stateService.setShapeManager(this.shapeManager);
    effect(() => {
      this.shapeManager.shapes();
      this.shapeManager.connections();
      this.shapeManager.selectedShapeIds();
      this.gridService.gridVisible();
      this.gridService.gridSize();
      this.backgroundImageUrl();
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
    effect(() => {
      const embeddedId = this.embeddedDiagramId();
      if (embeddedId == null || embeddedId === this.lastEmbeddedDiagramId) {
        return;
      }
      this.lastEmbeddedDiagramId = embeddedId;
      this.stateService.loadDiagram(embeddedId);
    });
    effect(() => {
      const sourceType = this.focusSourceEntityType();
      const sourceId = this.focusSourceEntityId();
      const shapes = this.shapeManager.shapes();
      const diagramId = this.stateService.currentDiagram()?.id ?? this.embeddedDiagramId() ?? null;
      if (!sourceType || sourceId == null || shapes.length === 0) {
        return;
      }
      const focusKey = `${diagramId}:${sourceType}:${sourceId}:${shapes.length}`;
      if (focusKey === this.lastFocusedSourceKey) {
        return;
      }
      const match = shapes.find((shape) => shape.sourceEntityType === sourceType && shape.sourceEntityId === sourceId);
      if (!match) {
        return;
      }
      this.lastFocusedSourceKey = focusKey;
      this.drawingService.setTool("select");
      this.shapeManager.selectShape(match.id);
      this.centerOnPlacement(match);
      this.requestRender();
    });
    effect(() => {
      const connectionId = this.focusConnectionId();
      const connections = this.shapeManager.connections();
      const shapes = this.shapeManager.shapes();
      const diagramId = this.stateService.currentDiagram()?.id ?? this.embeddedDiagramId() ?? null;
      if (connectionId == null || connections.length === 0 || shapes.length === 0) {
        return;
      }
      const focusKey = `${diagramId}:connection:${connectionId}:${connections.length}`;
      if (focusKey === this.lastFocusedConnectionKey) {
        return;
      }
      const match = connections.find((connection) => connection.id === connectionId);
      if (!match) {
        return;
      }
      this.lastFocusedConnectionKey = focusKey;
      this.drawingService.setTool("select");
      this.shapeManager.selectConnection(match.id);
      this.centerOnConnection(match);
      this.requestRender();
    });
    effect(() => {
      const selectedShape = this.shapeManager.singleSelectedShape();
      const selectedConnection = this.shapeManager.selectedConnectionId();
      if (!selectedShape || selectedConnection != null) {
        this.selectedSourceChange.emit({ sourceEntityType: null, sourceEntityId: null });
        return;
      }
      this.selectedSourceChange.emit({
        sourceEntityType: selectedShape.sourceEntityType || null,
        sourceEntityId: selectedShape.sourceEntityId ?? null
      });
    });
    effect(() => {
      this.selectedConnectionChange.emit(this.shapeManager.selectedConnectionId());
    });
    effect(() => {
      this.simulationRunningChange.emit(this.simState.isSimulating());
    });
    effect(() => {
      const selectedShape = this.shapeManager.singleSelectedShape();
      const selectedConnection = this.shapeManager.selectedConnectionId();
      if (!selectedShape || selectedConnection != null || !this.simState.isSimulating()) {
        this.selectedNodeStateChange.emit(null);
        return;
      }
      this.selectedNodeStateChange.emit(this.simState.getNodeState(selectedShape.id) ?? null);
    });
  }
  ngOnInit() {
    this.simEquipmentApi.loadAllIntoCache();
    const mode = this.embeddedMode() ?? this.route.snapshot.data["mode"];
    this.config = mode === "renderer" ? DIAGRAM_RENDERER_CONFIG : DIAGRAM_BUILDER_CONFIG;
    const embeddedId = this.embeddedDiagramId();
    const routeId = this.route.snapshot.paramMap.get("id");
    if (embeddedId != null) {
      this.lastEmbeddedDiagramId = embeddedId;
      this.stateService.loadDiagram(embeddedId);
    } else if (routeId) {
      this.stateService.loadDiagram(Number(routeId));
    } else {
      this.stateService.createNewDiagram(this.initialDiagramName() ?? "Untitled Diagram", {
        contextFileId: this.initialContextFileId() ?? void 0,
        contextFileName: this.initialContextFileName() ?? void 0
      });
    }
  }
  ngAfterViewInit() {
    this.setupCanvases();
    this.requestRender();
    const ro = new ResizeObserver(() => this.setupCanvases());
    ro.observe(this.canvasContainerRef.nativeElement);
  }
  ngOnDestroy() {
    if (this.stateService.isDirty()) {
      this.stateService.saveNow();
    }
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
      this.ensureBackgroundImageLoaded();
      this.drawBackgroundImage(gridCtx);
      this.gridService.drawGrid(gridCtx, this.canvasWidth, this.canvasHeight, scale);
      gridCtx.setTransform(1, 0, 0, 1, 0, 0);
    }
    const shapeCtx = this.shapeCanvasRef?.nativeElement?.getContext("2d");
    if (shapeCtx) {
      applyTransform(shapeCtx);
      this.renderService.drawAll(shapeCtx, this.shapeManager.shapes(), this.shapeManager.connections(), this.shapeManager.selectedShapeIds(), this.shapeManager.selectedConnectionId(), this.hoveredShapeId, scale);
      if (this.drawingService.activeTool() === "draw-connection") {
        for (const shape of this.shapeManager.shapes()) {
          this.renderService.drawAnchorPoints(shapeCtx, shape, this.hoveredAnchor);
        }
      }
      if (this.simState.isSimulating()) {
        this.simRender.drawStaticOverlays(shapeCtx, this.shapeManager.shapes(), this.shapeManager.connections(), this.simState.getAllNodeStates(), this.simState.getAllEdgeStates(), scale);
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
  /**
   * Render only the animation layer (temp canvas) at 60fps.
   * Draws: flow dash animation, pump impeller rotation, warning pulses.
   * Does NOT touch grid or shape canvases — those only redraw on sim tick.
   * Every 30 frames (~500ms), also triggers a full render for static overlays.
   */
  animFrameCount = 0;
  renderAnimationLayer() {
    this.animFrameCount++;
    if (this.animFrameCount % 30 === 0) {
      this.requestRender();
    }
    const dpr = window.devicePixelRatio || 1;
    const { scale, pointX, pointY } = this.transform;
    const tempCtx = this.tempCanvasRef?.nativeElement?.getContext("2d");
    if (!tempCtx)
      return;
    tempCtx.setTransform(1, 0, 0, 1, 0, 0);
    tempCtx.clearRect(0, 0, tempCtx.canvas.width, tempCtx.canvas.height);
    tempCtx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * pointX, dpr * pointY);
    this.simRender.drawAnimatedOverlays(tempCtx);
    tempCtx.setTransform(1, 0, 0, 1, 0, 0);
  }
  ensureBackgroundImageLoaded() {
    const url = this.backgroundImageUrl();
    if (!url) {
      this.backgroundImage = null;
      this.backgroundImageUrlLoaded = null;
      this.backgroundImageUrlPending = null;
      return;
    }
    if (this.backgroundImageUrlLoaded === url && this.backgroundImage) {
      return;
    }
    if (this.backgroundImageUrlPending === url) {
      return;
    }
    const img = new Image();
    this.backgroundImageUrlPending = url;
    img.onload = () => {
      this.backgroundImage = img;
      this.backgroundImageUrlLoaded = url;
      this.backgroundImageUrlPending = null;
      this.requestRender();
    };
    img.onerror = () => {
      this.backgroundImage = null;
      this.backgroundImageUrlLoaded = null;
      this.backgroundImageUrlPending = null;
      this.requestRender();
    };
    img.src = url;
  }
  drawBackgroundImage(ctx) {
    if (!this.backgroundImage)
      return;
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.drawImage(this.backgroundImage, 0, 0, this.canvasWidth, this.canvasHeight);
    ctx.restore();
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
            this.shapeManager.addConnection(__spreadProps(__spreadValues({}, conn), {
              pipeTemplateId: conn.pipeTemplateId ?? this.getDefaultPipeTemplateId()
            }));
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
        const selectedConn = this.shapeManager.singleSelectedConnection?.();
        if (selectedConn) {
          const wpHit = this.renderService.hitTestWaypoint(selectedConn, this.shapeManager.shapes(), coords.x, coords.y);
          if (wpHit) {
            if (wpHit.type === "waypoint") {
              this.isDraggingWaypoint = true;
              this.draggedWaypointConnectionId = selectedConn.id;
              this.draggedWaypointIndex = wpHit.index;
              this.dragStartCanvas = { x: coords.x, y: coords.y };
            } else {
              const wps = [...selectedConn.waypoints || []];
              const insertIdx = wpHit.segmentIndex;
              wps.splice(insertIdx, 0, { x: wpHit.x, y: wpHit.y });
              this.shapeManager.updateConnection(selectedConn.id, { waypoints: wps });
              this.isDraggingWaypoint = true;
              this.draggedWaypointConnectionId = selectedConn.id;
              this.draggedWaypointIndex = insertIdx;
              this.dragStartCanvas = { x: coords.x, y: coords.y };
            }
            return;
          }
        }
        const hitConnection = this.renderService.hitTestConnection(this.shapeManager.connections(), this.shapeManager.shapes(), coords.x, coords.y);
        if (hitConnection) {
          this.shapeManager.selectConnection(hitConnection.id);
          return;
        }
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
    if (this.isDraggingWaypoint && this.draggedWaypointConnectionId != null) {
      const conn = this.shapeManager.connections().find((c) => c.id === this.draggedWaypointConnectionId);
      if (conn?.waypoints) {
        const wps = [...conn.waypoints];
        const snapped = this.gridService.snapPosition(coords.x, coords.y);
        wps[this.draggedWaypointIndex] = { x: snapped.x, y: snapped.y };
        this.shapeManager.updateConnection(conn.id, { waypoints: wps });
        this.requestRender();
      }
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
      if (s.type === "line" && s.startX !== void 0) {
        const updates = {};
        const handle = this.resizeHandle || "";
        const movingStart = handle.includes("nw") || handle === "n-resize" || handle === "w-resize" || handle === "ne-resize";
        if (movingStart) {
          updates.startX = s.startX + dx;
          updates.startY = s.startY + dy;
        } else {
          updates.endX = s.endX + dx;
          updates.endY = s.endY + dy;
        }
        const sx = updates.startX ?? s.startX;
        const sy = updates.startY ?? s.startY;
        const ex = updates.endX ?? s.endX;
        const ey = updates.endY ?? s.endY;
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
        if (startShape.type === "line" && startShape.startX !== void 0) {
          const snapDx = snapped.x - startShape.x;
          const snapDy = snapped.y - startShape.y;
          updates.startX = startShape.startX + snapDx;
          updates.startY = startShape.startY + snapDy;
          updates.endX = startShape.endX + snapDx;
          updates.endY = startShape.endY + snapDy;
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
      const anchorChanged = nextHoveredAnchor?.placementId !== this.hoveredAnchor?.placementId || nextHoveredAnchor?.position !== this.hoveredAnchor?.position;
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
    if (this.isDragging || this.isResizing || this.isRotating || this.isDraggingWaypoint) {
      this.stateService.markDirty();
    }
    this.isDragging = false;
    this.isResizing = false;
    this.isRotating = false;
    this.isDraggingWaypoint = false;
    this.draggedWaypointConnectionId = null;
    this.draggedWaypointIndex = -1;
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
    const coords = this.getCanvasCoords(event);
    if (!this.simState.isSimulating()) {
      const selectedConn = this.shapeManager.singleSelectedConnection?.();
      if (selectedConn?.waypoints?.length) {
        const wpHit = this.renderService.hitTestWaypoint(selectedConn, this.shapeManager.shapes(), coords.x, coords.y);
        if (wpHit?.type === "waypoint") {
          const wps = [...selectedConn.waypoints];
          wps.splice(wpHit.index, 1);
          this.shapeManager.updateConnection(selectedConn.id, { waypoints: wps.length ? wps : void 0 });
          this.stateService.markDirty();
          this.requestRender();
        }
      }
      return;
    }
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
    if (state.role === "selector-valve") {
      const newPort = state.params.selectedPort === "A" ? "B" : "A";
      this.simState.updateNodeParams(hit.id, { selectedPort: newPort });
      this.requestRender();
    }
    if (state.role === "heater") {
      this.simState.updateNodeParams(hit.id, { heaterRunning: !state.params.heaterRunning });
      this.requestRender();
    }
    if (state.role === "vapor-extractor") {
      this.simState.updateNodeParams(hit.id, { extractorRunning: !state.params.extractorRunning });
      this.requestRender();
    }
  }
  onKeyDown(event) {
    if (event.ctrlKey && event.key.toLowerCase() === "s") {
      event.preventDefault();
      this.saveDiagram();
      return;
    }
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
      if (this.shapeManager.selectedConnectionId() != null) {
        return;
      }
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
          if (shape.type === "line" && shape.startX !== void 0) {
            updates.startX = shape.startX + dx;
            updates.startY = shape.startY + dy;
            updates.endX = shape.endX + dx;
            updates.endY = shape.endY + dy;
          }
          this.shapeManager.updateShape(shape.id, updates);
        }
        this.stateService.markDirty();
        this.requestRender();
      }
    }
  }
  onBeforeUnload() {
    if (this.stateService.isDirty()) {
      this.stateService.saveNow();
    }
  }
  // --- Equipment Library drag/drop ---
  draggedEquipment = null;
  onEquipmentDragStart(eq) {
    this.draggedEquipment = eq;
  }
  onDrop(event) {
    event.preventDefault();
    const json = event.dataTransfer?.getData("application/sim-equipment");
    const eq = json ? JSON.parse(json) : this.draggedEquipment;
    if (!eq || !eq.id)
      return;
    const coords = this.getCanvasCoords(event);
    this.placeEquipment(eq, coords.x, coords.y);
    this.draggedEquipment = null;
  }
  /** Add equipment at the visible center of the canvas. Called from equipment library context menu. */
  addEquipmentToCanvas(eq) {
    if (!eq.id)
      return;
    const container = this.canvasContainerRef?.nativeElement;
    if (!container)
      return;
    const rect = container.getBoundingClientRect();
    const centerClient = { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 };
    const coords = this.drawingService.clientToCanvasCoords(centerClient.clientX, centerClient.clientY, rect, this.transform);
    this.placeEquipment(eq, coords.x, coords.y);
  }
  placeEquipment(eq, cx, cy) {
    const w = eq.defaultWidth || 60;
    const h = eq.defaultHeight || 60;
    const placement = {
      simEquipmentId: eq.id,
      name: eq.name || "New Equipment",
      description: eq.description || void 0,
      simRole: eq.simRole || "junction",
      simParamsJson: eq.simParamsJson || '{"schemaVersion":1}',
      sourceEntityType: eq.sourceEntityType || void 0,
      sourceEntityId: eq.sourceEntityId || void 0,
      x: cx - w / 2,
      y: cy - h / 2,
      width: w,
      height: h,
      type: eq.symbolId ? "symbol" : "rectangle",
      symbolId: eq.symbolId || void 0,
      svgPath: eq.svgPath || void 0,
      originalWidth: eq.defaultWidth || void 0,
      originalHeight: eq.defaultHeight || void 0,
      color: eq.defaultColor || "#ffffff",
      label: eq.name || void 0
    };
    const added = this.shapeManager.addShape(placement);
    this.shapeManager.selectShape(added.id);
    this.stateService.markDirty();
    this.requestRender();
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
  saveDiagram() {
    this.stateService.saveNow();
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
      this.requestRender();
      this.simRender.startAnimation(() => this.renderAnimationLayer());
    }
  }
  operateSelectedEquipment() {
    if (!this.simState.isSimulating())
      return false;
    const selected = this.shapeManager.singleSelectedShape();
    if (!selected)
      return false;
    const state = this.simState.getNodeState(selected.id);
    if (!state)
      return false;
    if (state.role === "valve") {
      const newPos = state.params.valvePosition === "open" ? "closed" : "open";
      this.simState.updateNodeParams(selected.id, { valvePosition: newPos });
      this.requestRender();
      return true;
    }
    if (state.role === "pump") {
      this.simState.updateNodeParams(selected.id, { pumpRunning: !state.params.pumpRunning });
      this.requestRender();
      return true;
    }
    return false;
  }
  resetSimulation() {
    if (this.simState.isSimulating()) {
      this.simRender.stopAnimation();
      this.simState.deactivate();
      this.simState.activate(this.shapeManager.shapes(), this.shapeManager.connections());
      this.requestRender();
      this.simRender.startAnimation(() => this.renderAnimationLayer());
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
  getDefaultPipeTemplateId() {
    return this.simEquipmentApi.equipmentList().find((eq) => eq.id != null && normalizeSimRole(eq.simRole) === "pipe")?.id;
  }
  centerOnPlacement(shape) {
    const container = this.canvasContainerRef?.nativeElement;
    if (!container)
      return;
    const shapeCenterX = shape.x + shape.width / 2;
    const shapeCenterY = shape.y + shape.height / 2;
    this.transform = __spreadProps(__spreadValues({}, this.transform), {
      pointX: container.clientWidth / 2 - shapeCenterX * this.transform.scale,
      pointY: container.clientHeight / 2 - shapeCenterY * this.transform.scale
    });
  }
  centerOnConnection(connection) {
    const source = this.shapeManager.getShapeById(connection.sourcePlacementId);
    const target = this.shapeManager.getShapeById(connection.targetPlacementId);
    const container = this.canvasContainerRef?.nativeElement;
    if (!source || !target || !container)
      return;
    const midpointX = (source.x + source.width / 2 + target.x + target.width / 2) / 2;
    const midpointY = (source.y + source.height / 2 + target.y + target.height / 2) / 2;
    this.transform = __spreadProps(__spreadValues({}, this.transform), {
      pointX: container.clientWidth / 2 - midpointX * this.transform.scale,
      pointY: container.clientHeight / 2 - midpointY * this.transform.scale
    });
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
      }, false, \u0275\u0275resolveDocument)("beforeunload", function DiagramCanvasComponent_beforeunload_HostBindingHandler() {
        return ctx.onBeforeUnload();
      }, false, \u0275\u0275resolveWindow);
    }
  }, inputs: { embeddedDiagramId: [1, "embeddedDiagramId"], embeddedMode: [1, "embeddedMode"], initialDiagramName: [1, "initialDiagramName"], initialContextFileId: [1, "initialContextFileId"], initialContextFileName: [1, "initialContextFileName"], backgroundImageUrl: [1, "backgroundImageUrl"], focusSourceEntityType: [1, "focusSourceEntityType"], focusSourceEntityId: [1, "focusSourceEntityId"], focusConnectionId: [1, "focusConnectionId"] }, outputs: { selectedSourceChange: "selectedSourceChange", selectedConnectionChange: "selectedConnectionChange", simulationRunningChange: "simulationRunningChange", selectedNodeStateChange: "selectedNodeStateChange" }, features: [\u0275\u0275ProvidersFeature([
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
    SimulationRenderService,
    SimGraphBuilderService
  ])], decls: 23, vars: 9, consts: [["canvasContainer", ""], ["gridCanvas", ""], ["shapeCanvas", ""], ["tempCanvas", ""], [1, "diagram-page"], [1, "toolbar-row"], [1, "diagram-workspace"], [1, "canvas-container", 3, "drop", "dragover", "mousedown", "mousemove", "mouseup", "wheel", "dblclick", "contextmenu"], [1, "layer-canvas", "grid-canvas"], [1, "layer-canvas", "shape-canvas"], [1, "layer-canvas", "temp-canvas"], [1, "status-bar"], [1, "dirty-indicator"], [1, "saving-indicator"], [3, "onAlign", "onDistribute", "onDelete", "onSave", "onGroup", "onUngroup", "onZoomIn", "onZoomOut", "onZoomFit"], [3, "onToggle", "onReset"], [3, "onEquipmentClick", "onEquipmentAddToCanvas"]], template: function DiagramCanvasComponent_Template(rf, ctx) {
    if (rf & 1) {
      const _r1 = \u0275\u0275getCurrentView();
      \u0275\u0275elementStart(0, "div", 4);
      \u0275\u0275template(1, DiagramCanvasComponent_Conditional_1_Template, 3, 0, "div", 5);
      \u0275\u0275elementStart(2, "div", 6);
      \u0275\u0275template(3, DiagramCanvasComponent_Conditional_3_Template, 1, 0, "app-equipment-library");
      \u0275\u0275elementStart(4, "div", 7, 0);
      \u0275\u0275listener("drop", function DiagramCanvasComponent_Template_div_drop_4_listener($event) {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.onDrop($event));
      })("dragover", function DiagramCanvasComponent_Template_div_dragover_4_listener($event) {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView($event.preventDefault());
      })("mousedown", function DiagramCanvasComponent_Template_div_mousedown_4_listener($event) {
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
      \u0275\u0275element(6, "canvas", 8, 1)(8, "canvas", 9, 2)(10, "canvas", 10, 3);
      \u0275\u0275elementEnd();
      \u0275\u0275template(12, DiagramCanvasComponent_Conditional_12_Template, 1, 0, "app-simulation-inspector")(13, DiagramCanvasComponent_Conditional_13_Template, 1, 0, "app-diagram-properties");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(14, "div", 11)(15, "span");
      \u0275\u0275text(16);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(17, "span");
      \u0275\u0275text(18);
      \u0275\u0275elementEnd();
      \u0275\u0275template(19, DiagramCanvasComponent_Conditional_19_Template, 2, 0, "span", 12)(20, DiagramCanvasComponent_Conditional_20_Template, 2, 0, "span", 13);
      \u0275\u0275elementStart(21, "span");
      \u0275\u0275text(22);
      \u0275\u0275elementEnd()()();
    }
    if (rf & 2) {
      \u0275\u0275advance();
      \u0275\u0275conditional(ctx.config.showToolbar ? 1 : -1);
      \u0275\u0275advance(2);
      \u0275\u0275conditional(!ctx.simState.isSimulating() ? 3 : -1);
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
  }, dependencies: [CommonModule, DiagramToolbarComponent, DiagramPropertiesComponent, SimulationToolbarComponent, SimulationInspectorComponent, EquipmentLibraryComponent], styles: ["\n\n[_nghost-%COMP%] {\n  display: block;\n  height: 100%;\n}\n.diagram-page[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  height: 100%;\n  background: #121212;\n  color: #e0e0e0;\n}\n.diagram-workspace[_ngcontent-%COMP%] {\n  display: flex;\n  flex: 1;\n  overflow: hidden;\n  position: relative;\n}\n.canvas-container[_ngcontent-%COMP%] {\n  flex: 1;\n  overflow: hidden;\n  position: relative;\n  cursor: default;\n}\n.layer-canvas[_ngcontent-%COMP%] {\n  position: absolute;\n  top: 0;\n  left: 0;\n}\n.grid-canvas[_ngcontent-%COMP%] {\n  z-index: 1;\n}\n.shape-canvas[_ngcontent-%COMP%] {\n  z-index: 2;\n}\n.temp-canvas[_ngcontent-%COMP%] {\n  z-index: 3;\n  pointer-events: none;\n}\n.status-bar[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 16px;\n  padding: 4px 12px;\n  background: #1e1e1e;\n  border-top: 1px solid #333;\n  font-size: 12px;\n  color: #888;\n}\n.toolbar-row[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 16px;\n  background: #1e1e1e;\n  border-bottom: 1px solid #333;\n}\n.dirty-indicator[_ngcontent-%COMP%] {\n  color: #ff9800;\n}\n.saving-indicator[_ngcontent-%COMP%] {\n  color: #4caf50;\n}\n/*# sourceMappingURL=diagram-canvas.component.css.map */"], changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(DiagramCanvasComponent, { className: "DiagramCanvasComponent", filePath: "src/app/features/diagram-builder/components/diagram-canvas/diagram-canvas.component.ts", lineNumber: 167 });
})();

export {
  normalizeDiagramData,
  serializeDiagramData,
  normalizeSimRole,
  SimEquipmentApiService,
  DiagramCanvasComponent
};
//# sourceMappingURL=chunk-SMFRZBC6.js.map
