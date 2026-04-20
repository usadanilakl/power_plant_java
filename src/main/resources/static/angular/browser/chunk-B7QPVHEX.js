import {
  BidiModule,
  Directionality,
  Platform,
  ScrollDispatcher,
  ScrollingModule,
  ViewportRuler,
  supportsScrollBehavior
} from "./chunk-VPLEDPJD.js";
import {
  BaseDto
} from "./chunk-7ZBWWDK2.js";
import {
  Validators
} from "./chunk-BLD5MXQL.js";
import {
  ANIMATION_MODULE_TYPE,
  APP_ID,
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  Directive,
  ElementRef,
  EnvironmentInjector,
  EventEmitter,
  Injectable,
  InjectionToken,
  Injector,
  Input,
  Location,
  NgModule,
  NgModuleRef$1,
  NgZone,
  Output,
  RendererFactory2,
  Subject,
  Subscription,
  TemplateRef,
  VERSION,
  ViewContainerRef,
  ViewEncapsulation,
  afterNextRender,
  afterRender,
  booleanAttribute,
  createComponent,
  filter,
  inject,
  merge,
  setClassMetadata,
  takeUntil,
  takeWhile,
  untracked,
  ɵɵInheritDefinitionFeature,
  ɵɵNgOnChangesFeature,
  ɵɵProvidersFeature,
  ɵɵdefineComponent,
  ɵɵdefineDirective,
  ɵɵdefineInjectable,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
  ɵɵgetInheritedFactory
} from "./chunk-W4KMF4YJ.js";
import {
  __spreadProps,
  __spreadValues
} from "./chunk-N6ESDQJH.js";

// node_modules/@angular/cdk/fesm2022/portal-directives-Bw5woq8I.mjs
function throwNullPortalError() {
  throw Error("Must provide a portal to attach");
}
function throwPortalAlreadyAttachedError() {
  throw Error("Host already has a portal attached");
}
function throwPortalOutletAlreadyDisposedError() {
  throw Error("This PortalOutlet has already been disposed");
}
function throwUnknownPortalTypeError() {
  throw Error("Attempting to attach an unknown Portal type. BasePortalOutlet accepts either a ComponentPortal or a TemplatePortal.");
}
function throwNullPortalOutletError() {
  throw Error("Attempting to attach a portal to a null PortalOutlet");
}
function throwNoPortalAttachedError() {
  throw Error("Attempting to detach a portal that is not attached to a host");
}
var Portal = class {
  _attachedHost;
  /** Attach this portal to a host. */
  attach(host) {
    if (typeof ngDevMode === "undefined" || ngDevMode) {
      if (host == null) {
        throwNullPortalOutletError();
      }
      if (host.hasAttached()) {
        throwPortalAlreadyAttachedError();
      }
    }
    this._attachedHost = host;
    return host.attach(this);
  }
  /** Detach this portal from its host */
  detach() {
    let host = this._attachedHost;
    if (host != null) {
      this._attachedHost = null;
      host.detach();
    } else if (typeof ngDevMode === "undefined" || ngDevMode) {
      throwNoPortalAttachedError();
    }
  }
  /** Whether this portal is attached to a host. */
  get isAttached() {
    return this._attachedHost != null;
  }
  /**
   * Sets the PortalOutlet reference without performing `attach()`. This is used directly by
   * the PortalOutlet when it is performing an `attach()` or `detach()`.
   */
  setAttachedHost(host) {
    this._attachedHost = host;
  }
};
var ComponentPortal = class extends Portal {
  /** The type of the component that will be instantiated for attachment. */
  component;
  /**
   * Where the attached component should live in Angular's *logical* component tree.
   * This is different from where the component *renders*, which is determined by the PortalOutlet.
   * The origin is necessary when the host is outside of the Angular application context.
   */
  viewContainerRef;
  /** Injector used for the instantiation of the component. */
  injector;
  /**
   * @deprecated No longer in use. To be removed.
   * @breaking-change 18.0.0
   */
  componentFactoryResolver;
  /**
   * List of DOM nodes that should be projected through `<ng-content>` of the attached component.
   */
  projectableNodes;
  constructor(component, viewContainerRef, injector, _componentFactoryResolver, projectableNodes) {
    super();
    this.component = component;
    this.viewContainerRef = viewContainerRef;
    this.injector = injector;
    this.projectableNodes = projectableNodes;
  }
};
var TemplatePortal = class extends Portal {
  templateRef;
  viewContainerRef;
  context;
  injector;
  constructor(templateRef, viewContainerRef, context, injector) {
    super();
    this.templateRef = templateRef;
    this.viewContainerRef = viewContainerRef;
    this.context = context;
    this.injector = injector;
  }
  get origin() {
    return this.templateRef.elementRef;
  }
  /**
   * Attach the portal to the provided `PortalOutlet`.
   * When a context is provided it will override the `context` property of the `TemplatePortal`
   * instance.
   */
  attach(host, context = this.context) {
    this.context = context;
    return super.attach(host);
  }
  detach() {
    this.context = void 0;
    return super.detach();
  }
};
var DomPortal = class extends Portal {
  /** DOM node hosting the portal's content. */
  element;
  constructor(element) {
    super();
    this.element = element instanceof ElementRef ? element.nativeElement : element;
  }
};
var BasePortalOutlet = class {
  /** The portal currently attached to the host. */
  _attachedPortal;
  /** A function that will permanently dispose this host. */
  _disposeFn;
  /** Whether this host has already been permanently disposed. */
  _isDisposed = false;
  /** Whether this host has an attached portal. */
  hasAttached() {
    return !!this._attachedPortal;
  }
  /** Attaches a portal. */
  attach(portal) {
    if (typeof ngDevMode === "undefined" || ngDevMode) {
      if (!portal) {
        throwNullPortalError();
      }
      if (this.hasAttached()) {
        throwPortalAlreadyAttachedError();
      }
      if (this._isDisposed) {
        throwPortalOutletAlreadyDisposedError();
      }
    }
    if (portal instanceof ComponentPortal) {
      this._attachedPortal = portal;
      return this.attachComponentPortal(portal);
    } else if (portal instanceof TemplatePortal) {
      this._attachedPortal = portal;
      return this.attachTemplatePortal(portal);
    } else if (this.attachDomPortal && portal instanceof DomPortal) {
      this._attachedPortal = portal;
      return this.attachDomPortal(portal);
    }
    if (typeof ngDevMode === "undefined" || ngDevMode) {
      throwUnknownPortalTypeError();
    }
  }
  // @breaking-change 10.0.0 `attachDomPortal` to become a required abstract method.
  attachDomPortal = null;
  /** Detaches a previously attached portal. */
  detach() {
    if (this._attachedPortal) {
      this._attachedPortal.setAttachedHost(null);
      this._attachedPortal = null;
    }
    this._invokeDisposeFn();
  }
  /** Permanently dispose of this portal host. */
  dispose() {
    if (this.hasAttached()) {
      this.detach();
    }
    this._invokeDisposeFn();
    this._isDisposed = true;
  }
  /** @docs-private */
  setDisposeFn(fn) {
    this._disposeFn = fn;
  }
  _invokeDisposeFn() {
    if (this._disposeFn) {
      this._disposeFn();
      this._disposeFn = null;
    }
  }
};
var DomPortalOutlet = class extends BasePortalOutlet {
  outletElement;
  _appRef;
  _defaultInjector;
  _document;
  /**
   * @param outletElement Element into which the content is projected.
   * @param _unusedComponentFactoryResolver Used to resolve the component factory.
   *   Only required when attaching component portals.
   * @param _appRef Reference to the application. Only used in component portals when there
   *   is no `ViewContainerRef` available.
   * @param _defaultInjector Injector to use as a fallback when the portal being attached doesn't
   *   have one. Only used for component portals.
   * @param _document Reference to the document. Used when attaching a DOM portal. Will eventually
   *   become a required parameter.
   */
  constructor(outletElement, _unusedComponentFactoryResolver, _appRef, _defaultInjector, _document) {
    super();
    this.outletElement = outletElement;
    this._appRef = _appRef;
    this._defaultInjector = _defaultInjector;
    this._document = _document;
  }
  /**
   * Attach the given ComponentPortal to DOM element.
   * @param portal Portal to be attached
   * @returns Reference to the created component.
   */
  attachComponentPortal(portal) {
    let componentRef;
    if (portal.viewContainerRef) {
      const injector = portal.injector || portal.viewContainerRef.injector;
      const ngModuleRef = injector.get(NgModuleRef$1, null, {
        optional: true
      }) || void 0;
      componentRef = portal.viewContainerRef.createComponent(portal.component, {
        index: portal.viewContainerRef.length,
        injector,
        ngModuleRef,
        projectableNodes: portal.projectableNodes || void 0
      });
      this.setDisposeFn(() => componentRef.destroy());
    } else {
      if ((typeof ngDevMode === "undefined" || ngDevMode) && !this._appRef) {
        throw Error("Cannot attach component portal to outlet without an ApplicationRef.");
      }
      const appRef = this._appRef;
      const elementInjector = portal.injector || this._defaultInjector || Injector.NULL;
      const environmentInjector = elementInjector.get(EnvironmentInjector, appRef.injector);
      componentRef = createComponent(portal.component, {
        elementInjector,
        environmentInjector,
        projectableNodes: portal.projectableNodes || void 0
      });
      appRef.attachView(componentRef.hostView);
      this.setDisposeFn(() => {
        if (appRef.viewCount > 0) {
          appRef.detachView(componentRef.hostView);
        }
        componentRef.destroy();
      });
    }
    this.outletElement.appendChild(this._getComponentRootNode(componentRef));
    this._attachedPortal = portal;
    return componentRef;
  }
  /**
   * Attaches a template portal to the DOM as an embedded view.
   * @param portal Portal to be attached.
   * @returns Reference to the created embedded view.
   */
  attachTemplatePortal(portal) {
    let viewContainer = portal.viewContainerRef;
    let viewRef = viewContainer.createEmbeddedView(portal.templateRef, portal.context, {
      injector: portal.injector
    });
    viewRef.rootNodes.forEach((rootNode) => this.outletElement.appendChild(rootNode));
    viewRef.detectChanges();
    this.setDisposeFn(() => {
      let index = viewContainer.indexOf(viewRef);
      if (index !== -1) {
        viewContainer.remove(index);
      }
    });
    this._attachedPortal = portal;
    return viewRef;
  }
  /**
   * Attaches a DOM portal by transferring its content into the outlet.
   * @param portal Portal to be attached.
   * @deprecated To be turned into a method.
   * @breaking-change 10.0.0
   */
  attachDomPortal = (portal) => {
    const element = portal.element;
    if (!element.parentNode && (typeof ngDevMode === "undefined" || ngDevMode)) {
      throw Error("DOM portal content must be attached to a parent node.");
    }
    const anchorNode = this._document.createComment("dom-portal");
    element.parentNode.insertBefore(anchorNode, element);
    this.outletElement.appendChild(element);
    this._attachedPortal = portal;
    super.setDisposeFn(() => {
      if (anchorNode.parentNode) {
        anchorNode.parentNode.replaceChild(element, anchorNode);
      }
    });
  };
  /**
   * Clears out a portal from the DOM.
   */
  dispose() {
    super.dispose();
    this.outletElement.remove();
  }
  /** Gets the root HTMLElement for an instantiated component. */
  _getComponentRootNode(componentRef) {
    return componentRef.hostView.rootNodes[0];
  }
};
var CdkPortal = class _CdkPortal extends TemplatePortal {
  constructor() {
    const templateRef = inject(TemplateRef);
    const viewContainerRef = inject(ViewContainerRef);
    super(templateRef, viewContainerRef);
  }
  static \u0275fac = function CdkPortal_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _CdkPortal)();
  };
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
    type: _CdkPortal,
    selectors: [["", "cdkPortal", ""]],
    exportAs: ["cdkPortal"],
    features: [\u0275\u0275InheritDefinitionFeature]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(CdkPortal, [{
    type: Directive,
    args: [{
      selector: "[cdkPortal]",
      exportAs: "cdkPortal"
    }]
  }], () => [], null);
})();
var TemplatePortalDirective = class _TemplatePortalDirective extends CdkPortal {
  static \u0275fac = /* @__PURE__ */ (() => {
    let \u0275TemplatePortalDirective_BaseFactory;
    return function TemplatePortalDirective_Factory(__ngFactoryType__) {
      return (\u0275TemplatePortalDirective_BaseFactory || (\u0275TemplatePortalDirective_BaseFactory = \u0275\u0275getInheritedFactory(_TemplatePortalDirective)))(__ngFactoryType__ || _TemplatePortalDirective);
    };
  })();
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
    type: _TemplatePortalDirective,
    selectors: [["", "cdk-portal", ""], ["", "portal", ""]],
    exportAs: ["cdkPortal"],
    features: [\u0275\u0275ProvidersFeature([{
      provide: CdkPortal,
      useExisting: _TemplatePortalDirective
    }]), \u0275\u0275InheritDefinitionFeature]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(TemplatePortalDirective, [{
    type: Directive,
    args: [{
      selector: "[cdk-portal], [portal]",
      exportAs: "cdkPortal",
      providers: [{
        provide: CdkPortal,
        useExisting: TemplatePortalDirective
      }]
    }]
  }], null, null);
})();
var CdkPortalOutlet = class _CdkPortalOutlet extends BasePortalOutlet {
  _moduleRef = inject(NgModuleRef$1, {
    optional: true
  });
  _document = inject(DOCUMENT);
  _viewContainerRef = inject(ViewContainerRef);
  /** Whether the portal component is initialized. */
  _isInitialized = false;
  /** Reference to the currently-attached component/view ref. */
  _attachedRef;
  constructor() {
    super();
  }
  /** Portal associated with the Portal outlet. */
  get portal() {
    return this._attachedPortal;
  }
  set portal(portal) {
    if (this.hasAttached() && !portal && !this._isInitialized) {
      return;
    }
    if (this.hasAttached()) {
      super.detach();
    }
    if (portal) {
      super.attach(portal);
    }
    this._attachedPortal = portal || null;
  }
  /** Emits when a portal is attached to the outlet. */
  attached = new EventEmitter();
  /** Component or view reference that is attached to the portal. */
  get attachedRef() {
    return this._attachedRef;
  }
  ngOnInit() {
    this._isInitialized = true;
  }
  ngOnDestroy() {
    super.dispose();
    this._attachedRef = this._attachedPortal = null;
  }
  /**
   * Attach the given ComponentPortal to this PortalOutlet.
   *
   * @param portal Portal to be attached to the portal outlet.
   * @returns Reference to the created component.
   */
  attachComponentPortal(portal) {
    portal.setAttachedHost(this);
    const viewContainerRef = portal.viewContainerRef != null ? portal.viewContainerRef : this._viewContainerRef;
    const ref = viewContainerRef.createComponent(portal.component, {
      index: viewContainerRef.length,
      injector: portal.injector || viewContainerRef.injector,
      projectableNodes: portal.projectableNodes || void 0,
      ngModuleRef: this._moduleRef || void 0
    });
    if (viewContainerRef !== this._viewContainerRef) {
      this._getRootNode().appendChild(ref.hostView.rootNodes[0]);
    }
    super.setDisposeFn(() => ref.destroy());
    this._attachedPortal = portal;
    this._attachedRef = ref;
    this.attached.emit(ref);
    return ref;
  }
  /**
   * Attach the given TemplatePortal to this PortalHost as an embedded View.
   * @param portal Portal to be attached.
   * @returns Reference to the created embedded view.
   */
  attachTemplatePortal(portal) {
    portal.setAttachedHost(this);
    const viewRef = this._viewContainerRef.createEmbeddedView(portal.templateRef, portal.context, {
      injector: portal.injector
    });
    super.setDisposeFn(() => this._viewContainerRef.clear());
    this._attachedPortal = portal;
    this._attachedRef = viewRef;
    this.attached.emit(viewRef);
    return viewRef;
  }
  /**
   * Attaches the given DomPortal to this PortalHost by moving all of the portal content into it.
   * @param portal Portal to be attached.
   * @deprecated To be turned into a method.
   * @breaking-change 10.0.0
   */
  attachDomPortal = (portal) => {
    const element = portal.element;
    if (!element.parentNode && (typeof ngDevMode === "undefined" || ngDevMode)) {
      throw Error("DOM portal content must be attached to a parent node.");
    }
    const anchorNode = this._document.createComment("dom-portal");
    portal.setAttachedHost(this);
    element.parentNode.insertBefore(anchorNode, element);
    this._getRootNode().appendChild(element);
    this._attachedPortal = portal;
    super.setDisposeFn(() => {
      if (anchorNode.parentNode) {
        anchorNode.parentNode.replaceChild(element, anchorNode);
      }
    });
  };
  /** Gets the root node of the portal outlet. */
  _getRootNode() {
    const nativeElement = this._viewContainerRef.element.nativeElement;
    return nativeElement.nodeType === nativeElement.ELEMENT_NODE ? nativeElement : nativeElement.parentNode;
  }
  static \u0275fac = function CdkPortalOutlet_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _CdkPortalOutlet)();
  };
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
    type: _CdkPortalOutlet,
    selectors: [["", "cdkPortalOutlet", ""]],
    inputs: {
      portal: [0, "cdkPortalOutlet", "portal"]
    },
    outputs: {
      attached: "attached"
    },
    exportAs: ["cdkPortalOutlet"],
    features: [\u0275\u0275InheritDefinitionFeature]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(CdkPortalOutlet, [{
    type: Directive,
    args: [{
      selector: "[cdkPortalOutlet]",
      exportAs: "cdkPortalOutlet"
    }]
  }], () => [], {
    portal: [{
      type: Input,
      args: ["cdkPortalOutlet"]
    }],
    attached: [{
      type: Output
    }]
  });
})();
var PortalHostDirective = class _PortalHostDirective extends CdkPortalOutlet {
  static \u0275fac = /* @__PURE__ */ (() => {
    let \u0275PortalHostDirective_BaseFactory;
    return function PortalHostDirective_Factory(__ngFactoryType__) {
      return (\u0275PortalHostDirective_BaseFactory || (\u0275PortalHostDirective_BaseFactory = \u0275\u0275getInheritedFactory(_PortalHostDirective)))(__ngFactoryType__ || _PortalHostDirective);
    };
  })();
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
    type: _PortalHostDirective,
    selectors: [["", "cdkPortalHost", ""], ["", "portalHost", ""]],
    inputs: {
      portal: [0, "cdkPortalHost", "portal"]
    },
    exportAs: ["cdkPortalHost"],
    features: [\u0275\u0275ProvidersFeature([{
      provide: CdkPortalOutlet,
      useExisting: _PortalHostDirective
    }]), \u0275\u0275InheritDefinitionFeature]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(PortalHostDirective, [{
    type: Directive,
    args: [{
      selector: "[cdkPortalHost], [portalHost]",
      exportAs: "cdkPortalHost",
      inputs: [{
        name: "portal",
        alias: "cdkPortalHost"
      }],
      providers: [{
        provide: CdkPortalOutlet,
        useExisting: PortalHostDirective
      }]
    }]
  }], null, null);
})();
var PortalModule = class _PortalModule {
  static \u0275fac = function PortalModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _PortalModule)();
  };
  static \u0275mod = /* @__PURE__ */ \u0275\u0275defineNgModule({
    type: _PortalModule
  });
  static \u0275inj = /* @__PURE__ */ \u0275\u0275defineInjector({});
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(PortalModule, [{
    type: NgModule,
    args: [{
      imports: [CdkPortal, CdkPortalOutlet, TemplatePortalDirective, PortalHostDirective],
      exports: [CdkPortal, CdkPortalOutlet, TemplatePortalDirective, PortalHostDirective]
    }]
  }], null, null);
})();

// node_modules/@angular/cdk/fesm2022/backwards-compatibility-DHR38MsD.mjs
function _bindEventWithOptions(renderer, target, eventName, callback, options) {
  const major = parseInt(VERSION.major);
  const minor = parseInt(VERSION.minor);
  if (major > 19 || major === 19 && minor > 0 || major === 0 && minor === 0) {
    return renderer.listen(target, eventName, callback, options);
  }
  target.addEventListener(eventName, callback, options);
  return () => {
    target.removeEventListener(eventName, callback, options);
  };
}

// node_modules/@angular/cdk/fesm2022/shadow-dom-B0oHn41l.mjs
var shadowDomIsSupported;
function _supportsShadowDom() {
  if (shadowDomIsSupported == null) {
    const head = typeof document !== "undefined" ? document.head : null;
    shadowDomIsSupported = !!(head && (head.createShadowRoot || head.attachShadow));
  }
  return shadowDomIsSupported;
}
function _getShadowRoot(element) {
  if (_supportsShadowDom()) {
    const rootNode = element.getRootNode ? element.getRootNode() : null;
    if (typeof ShadowRoot !== "undefined" && ShadowRoot && rootNode instanceof ShadowRoot) {
      return rootNode;
    }
  }
  return null;
}
function _getFocusedElementPierceShadowDom() {
  let activeElement = typeof document !== "undefined" && document ? document.activeElement : null;
  while (activeElement && activeElement.shadowRoot) {
    const newActiveElement = activeElement.shadowRoot.activeElement;
    if (newActiveElement === activeElement) {
      break;
    } else {
      activeElement = newActiveElement;
    }
  }
  return activeElement;
}
function _getEventTarget(event) {
  return event.composedPath ? event.composedPath()[0] : event.target;
}

// node_modules/@angular/cdk/fesm2022/test-environment-CT0XxPyp.mjs
function _isTestEnvironment() {
  return (
    // @ts-ignore
    typeof __karma__ !== "undefined" && !!__karma__ || // @ts-ignore
    typeof jasmine !== "undefined" && !!jasmine || // @ts-ignore
    typeof jest !== "undefined" && !!jest || // @ts-ignore
    typeof Mocha !== "undefined" && !!Mocha
  );
}

// node_modules/@angular/cdk/fesm2022/style-loader-Cu9AvjH9.mjs
var appsWithLoaders = /* @__PURE__ */ new WeakMap();
var _CdkPrivateStyleLoader = class __CdkPrivateStyleLoader {
  _appRef;
  _injector = inject(Injector);
  _environmentInjector = inject(EnvironmentInjector);
  /**
   * Loads a set of styles.
   * @param loader Component which will be instantiated to load the styles.
   */
  load(loader) {
    const appRef = this._appRef = this._appRef || this._injector.get(ApplicationRef);
    let data = appsWithLoaders.get(appRef);
    if (!data) {
      data = {
        loaders: /* @__PURE__ */ new Set(),
        refs: []
      };
      appsWithLoaders.set(appRef, data);
      appRef.onDestroy(() => {
        appsWithLoaders.get(appRef)?.refs.forEach((ref) => ref.destroy());
        appsWithLoaders.delete(appRef);
      });
    }
    if (!data.loaders.has(loader)) {
      data.loaders.add(loader);
      data.refs.push(createComponent(loader, {
        environmentInjector: this._environmentInjector
      }));
    }
  }
  static \u0275fac = function _CdkPrivateStyleLoader_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || __CdkPrivateStyleLoader)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({
    token: __CdkPrivateStyleLoader,
    factory: __CdkPrivateStyleLoader.\u0275fac,
    providedIn: "root"
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(_CdkPrivateStyleLoader, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], null, null);
})();

// node_modules/@angular/cdk/fesm2022/css-pixel-value-C_HEqLhI.mjs
function coerceCssPixelValue(value) {
  if (value == null) {
    return "";
  }
  return typeof value === "string" ? value : `${value}px`;
}

// node_modules/@angular/cdk/fesm2022/array-I1yfCXUO.mjs
function coerceArray(value) {
  return Array.isArray(value) ? value : [value];
}

// node_modules/@angular/cdk/fesm2022/id-generator-Dw_9dSDu.mjs
var counters = {};
var _IdGenerator = class __IdGenerator {
  _appId = inject(APP_ID);
  /**
   * Generates a unique ID with a specific prefix.
   * @param prefix Prefix to add to the ID.
   */
  getId(prefix) {
    if (this._appId !== "ng") {
      prefix += this._appId;
    }
    if (!counters.hasOwnProperty(prefix)) {
      counters[prefix] = 0;
    }
    return `${prefix}${counters[prefix]++}`;
  }
  static \u0275fac = function _IdGenerator_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || __IdGenerator)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({
    token: __IdGenerator,
    factory: __IdGenerator.\u0275fac,
    providedIn: "root"
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(_IdGenerator, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], null, null);
})();

// node_modules/@angular/cdk/fesm2022/keycodes-CpHkExLC.mjs
var BACKSPACE = 8;
var TAB = 9;
var ENTER = 13;
var SHIFT = 16;
var CONTROL = 17;
var ALT = 18;
var ESCAPE = 27;
var SPACE = 32;
var PAGE_UP = 33;
var PAGE_DOWN = 34;
var END = 35;
var HOME = 36;
var LEFT_ARROW = 37;
var UP_ARROW = 38;
var RIGHT_ARROW = 39;
var DOWN_ARROW = 40;
var DELETE = 46;
var ZERO = 48;
var NINE = 57;
var A = 65;
var Z = 90;
var META = 91;
var MAC_META = 224;

// node_modules/@angular/cdk/fesm2022/keycodes.mjs
function hasModifierKey(event, ...modifiers) {
  if (modifiers.length) {
    return modifiers.some((modifier) => event[modifier]);
  }
  return event.altKey || event.shiftKey || event.ctrlKey || event.metaKey;
}

// node_modules/@angular/cdk/fesm2022/overlay-module-BUj0D19H.mjs
var scrollBehaviorSupported = supportsScrollBehavior();
var BlockScrollStrategy = class {
  _viewportRuler;
  _previousHTMLStyles = {
    top: "",
    left: ""
  };
  _previousScrollPosition;
  _isEnabled = false;
  _document;
  constructor(_viewportRuler, document2) {
    this._viewportRuler = _viewportRuler;
    this._document = document2;
  }
  /** Attaches this scroll strategy to an overlay. */
  attach() {
  }
  /** Blocks page-level scroll while the attached overlay is open. */
  enable() {
    if (this._canBeEnabled()) {
      const root = this._document.documentElement;
      this._previousScrollPosition = this._viewportRuler.getViewportScrollPosition();
      this._previousHTMLStyles.left = root.style.left || "";
      this._previousHTMLStyles.top = root.style.top || "";
      root.style.left = coerceCssPixelValue(-this._previousScrollPosition.left);
      root.style.top = coerceCssPixelValue(-this._previousScrollPosition.top);
      root.classList.add("cdk-global-scrollblock");
      this._isEnabled = true;
    }
  }
  /** Unblocks page-level scroll while the attached overlay is open. */
  disable() {
    if (this._isEnabled) {
      const html = this._document.documentElement;
      const body = this._document.body;
      const htmlStyle = html.style;
      const bodyStyle = body.style;
      const previousHtmlScrollBehavior = htmlStyle.scrollBehavior || "";
      const previousBodyScrollBehavior = bodyStyle.scrollBehavior || "";
      this._isEnabled = false;
      htmlStyle.left = this._previousHTMLStyles.left;
      htmlStyle.top = this._previousHTMLStyles.top;
      html.classList.remove("cdk-global-scrollblock");
      if (scrollBehaviorSupported) {
        htmlStyle.scrollBehavior = bodyStyle.scrollBehavior = "auto";
      }
      window.scroll(this._previousScrollPosition.left, this._previousScrollPosition.top);
      if (scrollBehaviorSupported) {
        htmlStyle.scrollBehavior = previousHtmlScrollBehavior;
        bodyStyle.scrollBehavior = previousBodyScrollBehavior;
      }
    }
  }
  _canBeEnabled() {
    const html = this._document.documentElement;
    if (html.classList.contains("cdk-global-scrollblock") || this._isEnabled) {
      return false;
    }
    const rootElement = this._document.documentElement;
    const viewport = this._viewportRuler.getViewportSize();
    return rootElement.scrollHeight > viewport.height || rootElement.scrollWidth > viewport.width;
  }
};
function getMatScrollStrategyAlreadyAttachedError() {
  return Error(`Scroll strategy has already been attached.`);
}
var CloseScrollStrategy = class {
  _scrollDispatcher;
  _ngZone;
  _viewportRuler;
  _config;
  _scrollSubscription = null;
  _overlayRef;
  _initialScrollPosition;
  constructor(_scrollDispatcher, _ngZone, _viewportRuler, _config) {
    this._scrollDispatcher = _scrollDispatcher;
    this._ngZone = _ngZone;
    this._viewportRuler = _viewportRuler;
    this._config = _config;
  }
  /** Attaches this scroll strategy to an overlay. */
  attach(overlayRef) {
    if (this._overlayRef && (typeof ngDevMode === "undefined" || ngDevMode)) {
      throw getMatScrollStrategyAlreadyAttachedError();
    }
    this._overlayRef = overlayRef;
  }
  /** Enables the closing of the attached overlay on scroll. */
  enable() {
    if (this._scrollSubscription) {
      return;
    }
    const stream = this._scrollDispatcher.scrolled(0).pipe(filter((scrollable) => {
      return !scrollable || !this._overlayRef.overlayElement.contains(scrollable.getElementRef().nativeElement);
    }));
    if (this._config && this._config.threshold && this._config.threshold > 1) {
      this._initialScrollPosition = this._viewportRuler.getViewportScrollPosition().top;
      this._scrollSubscription = stream.subscribe(() => {
        const scrollPosition = this._viewportRuler.getViewportScrollPosition().top;
        if (Math.abs(scrollPosition - this._initialScrollPosition) > this._config.threshold) {
          this._detach();
        } else {
          this._overlayRef.updatePosition();
        }
      });
    } else {
      this._scrollSubscription = stream.subscribe(this._detach);
    }
  }
  /** Disables the closing the attached overlay on scroll. */
  disable() {
    if (this._scrollSubscription) {
      this._scrollSubscription.unsubscribe();
      this._scrollSubscription = null;
    }
  }
  detach() {
    this.disable();
    this._overlayRef = null;
  }
  /** Detaches the overlay ref and disables the scroll strategy. */
  _detach = () => {
    this.disable();
    if (this._overlayRef.hasAttached()) {
      this._ngZone.run(() => this._overlayRef.detach());
    }
  };
};
var NoopScrollStrategy = class {
  /** Does nothing, as this scroll strategy is a no-op. */
  enable() {
  }
  /** Does nothing, as this scroll strategy is a no-op. */
  disable() {
  }
  /** Does nothing, as this scroll strategy is a no-op. */
  attach() {
  }
};
function isElementScrolledOutsideView(element, scrollContainers) {
  return scrollContainers.some((containerBounds) => {
    const outsideAbove = element.bottom < containerBounds.top;
    const outsideBelow = element.top > containerBounds.bottom;
    const outsideLeft = element.right < containerBounds.left;
    const outsideRight = element.left > containerBounds.right;
    return outsideAbove || outsideBelow || outsideLeft || outsideRight;
  });
}
function isElementClippedByScrolling(element, scrollContainers) {
  return scrollContainers.some((scrollContainerRect) => {
    const clippedAbove = element.top < scrollContainerRect.top;
    const clippedBelow = element.bottom > scrollContainerRect.bottom;
    const clippedLeft = element.left < scrollContainerRect.left;
    const clippedRight = element.right > scrollContainerRect.right;
    return clippedAbove || clippedBelow || clippedLeft || clippedRight;
  });
}
var RepositionScrollStrategy = class {
  _scrollDispatcher;
  _viewportRuler;
  _ngZone;
  _config;
  _scrollSubscription = null;
  _overlayRef;
  constructor(_scrollDispatcher, _viewportRuler, _ngZone, _config) {
    this._scrollDispatcher = _scrollDispatcher;
    this._viewportRuler = _viewportRuler;
    this._ngZone = _ngZone;
    this._config = _config;
  }
  /** Attaches this scroll strategy to an overlay. */
  attach(overlayRef) {
    if (this._overlayRef && (typeof ngDevMode === "undefined" || ngDevMode)) {
      throw getMatScrollStrategyAlreadyAttachedError();
    }
    this._overlayRef = overlayRef;
  }
  /** Enables repositioning of the attached overlay on scroll. */
  enable() {
    if (!this._scrollSubscription) {
      const throttle = this._config ? this._config.scrollThrottle : 0;
      this._scrollSubscription = this._scrollDispatcher.scrolled(throttle).subscribe(() => {
        this._overlayRef.updatePosition();
        if (this._config && this._config.autoClose) {
          const overlayRect = this._overlayRef.overlayElement.getBoundingClientRect();
          const {
            width,
            height
          } = this._viewportRuler.getViewportSize();
          const parentRects = [{
            width,
            height,
            bottom: height,
            right: width,
            top: 0,
            left: 0
          }];
          if (isElementScrolledOutsideView(overlayRect, parentRects)) {
            this.disable();
            this._ngZone.run(() => this._overlayRef.detach());
          }
        }
      });
    }
  }
  /** Disables repositioning of the attached overlay on scroll. */
  disable() {
    if (this._scrollSubscription) {
      this._scrollSubscription.unsubscribe();
      this._scrollSubscription = null;
    }
  }
  detach() {
    this.disable();
    this._overlayRef = null;
  }
};
var ScrollStrategyOptions = class _ScrollStrategyOptions {
  _scrollDispatcher = inject(ScrollDispatcher);
  _viewportRuler = inject(ViewportRuler);
  _ngZone = inject(NgZone);
  _document = inject(DOCUMENT);
  constructor() {
  }
  /** Do nothing on scroll. */
  noop = () => new NoopScrollStrategy();
  /**
   * Close the overlay as soon as the user scrolls.
   * @param config Configuration to be used inside the scroll strategy.
   */
  close = (config) => new CloseScrollStrategy(this._scrollDispatcher, this._ngZone, this._viewportRuler, config);
  /** Block scrolling. */
  block = () => new BlockScrollStrategy(this._viewportRuler, this._document);
  /**
   * Update the overlay's position on scroll.
   * @param config Configuration to be used inside the scroll strategy.
   * Allows debouncing the reposition calls.
   */
  reposition = (config) => new RepositionScrollStrategy(this._scrollDispatcher, this._viewportRuler, this._ngZone, config);
  static \u0275fac = function ScrollStrategyOptions_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _ScrollStrategyOptions)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({
    token: _ScrollStrategyOptions,
    factory: _ScrollStrategyOptions.\u0275fac,
    providedIn: "root"
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ScrollStrategyOptions, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], () => [], null);
})();
var OverlayConfig = class {
  /** Strategy with which to position the overlay. */
  positionStrategy;
  /** Strategy to be used when handling scroll events while the overlay is open. */
  scrollStrategy = new NoopScrollStrategy();
  /** Custom class to add to the overlay pane. */
  panelClass = "";
  /** Whether the overlay has a backdrop. */
  hasBackdrop = false;
  /** Custom class to add to the backdrop */
  backdropClass = "cdk-overlay-dark-backdrop";
  /** The width of the overlay panel. If a number is provided, pixel units are assumed. */
  width;
  /** The height of the overlay panel. If a number is provided, pixel units are assumed. */
  height;
  /** The min-width of the overlay panel. If a number is provided, pixel units are assumed. */
  minWidth;
  /** The min-height of the overlay panel. If a number is provided, pixel units are assumed. */
  minHeight;
  /** The max-width of the overlay panel. If a number is provided, pixel units are assumed. */
  maxWidth;
  /** The max-height of the overlay panel. If a number is provided, pixel units are assumed. */
  maxHeight;
  /**
   * Direction of the text in the overlay panel. If a `Directionality` instance
   * is passed in, the overlay will handle changes to its value automatically.
   */
  direction;
  /**
   * Whether the overlay should be disposed of when the user goes backwards/forwards in history.
   * Note that this usually doesn't include clicking on links (unless the user is using
   * the `HashLocationStrategy`).
   */
  disposeOnNavigation = false;
  constructor(config) {
    if (config) {
      const configKeys = Object.keys(config);
      for (const key of configKeys) {
        if (config[key] !== void 0) {
          this[key] = config[key];
        }
      }
    }
  }
};
var ConnectedOverlayPositionChange = class {
  connectionPair;
  scrollableViewProperties;
  constructor(connectionPair, scrollableViewProperties) {
    this.connectionPair = connectionPair;
    this.scrollableViewProperties = scrollableViewProperties;
  }
};
function validateVerticalPosition(property, value) {
  if (value !== "top" && value !== "bottom" && value !== "center") {
    throw Error(`ConnectedPosition: Invalid ${property} "${value}". Expected "top", "bottom" or "center".`);
  }
}
function validateHorizontalPosition(property, value) {
  if (value !== "start" && value !== "end" && value !== "center") {
    throw Error(`ConnectedPosition: Invalid ${property} "${value}". Expected "start", "end" or "center".`);
  }
}
var BaseOverlayDispatcher = class _BaseOverlayDispatcher {
  /** Currently attached overlays in the order they were attached. */
  _attachedOverlays = [];
  _document = inject(DOCUMENT);
  _isAttached;
  constructor() {
  }
  ngOnDestroy() {
    this.detach();
  }
  /** Add a new overlay to the list of attached overlay refs. */
  add(overlayRef) {
    this.remove(overlayRef);
    this._attachedOverlays.push(overlayRef);
  }
  /** Remove an overlay from the list of attached overlay refs. */
  remove(overlayRef) {
    const index = this._attachedOverlays.indexOf(overlayRef);
    if (index > -1) {
      this._attachedOverlays.splice(index, 1);
    }
    if (this._attachedOverlays.length === 0) {
      this.detach();
    }
  }
  static \u0275fac = function BaseOverlayDispatcher_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BaseOverlayDispatcher)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({
    token: _BaseOverlayDispatcher,
    factory: _BaseOverlayDispatcher.\u0275fac,
    providedIn: "root"
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BaseOverlayDispatcher, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], () => [], null);
})();
var OverlayKeyboardDispatcher = class _OverlayKeyboardDispatcher extends BaseOverlayDispatcher {
  _ngZone = inject(NgZone);
  _renderer = inject(RendererFactory2).createRenderer(null, null);
  _cleanupKeydown;
  /** Add a new overlay to the list of attached overlay refs. */
  add(overlayRef) {
    super.add(overlayRef);
    if (!this._isAttached) {
      this._ngZone.runOutsideAngular(() => {
        this._cleanupKeydown = this._renderer.listen("body", "keydown", this._keydownListener);
      });
      this._isAttached = true;
    }
  }
  /** Detaches the global keyboard event listener. */
  detach() {
    if (this._isAttached) {
      this._cleanupKeydown?.();
      this._isAttached = false;
    }
  }
  /** Keyboard event listener that will be attached to the body. */
  _keydownListener = (event) => {
    const overlays = this._attachedOverlays;
    for (let i = overlays.length - 1; i > -1; i--) {
      if (overlays[i]._keydownEvents.observers.length > 0) {
        this._ngZone.run(() => overlays[i]._keydownEvents.next(event));
        break;
      }
    }
  };
  static \u0275fac = /* @__PURE__ */ (() => {
    let \u0275OverlayKeyboardDispatcher_BaseFactory;
    return function OverlayKeyboardDispatcher_Factory(__ngFactoryType__) {
      return (\u0275OverlayKeyboardDispatcher_BaseFactory || (\u0275OverlayKeyboardDispatcher_BaseFactory = \u0275\u0275getInheritedFactory(_OverlayKeyboardDispatcher)))(__ngFactoryType__ || _OverlayKeyboardDispatcher);
    };
  })();
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({
    token: _OverlayKeyboardDispatcher,
    factory: _OverlayKeyboardDispatcher.\u0275fac,
    providedIn: "root"
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(OverlayKeyboardDispatcher, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], null, null);
})();
var OverlayOutsideClickDispatcher = class _OverlayOutsideClickDispatcher extends BaseOverlayDispatcher {
  _platform = inject(Platform);
  _ngZone = inject(NgZone);
  _renderer = inject(RendererFactory2).createRenderer(null, null);
  _cursorOriginalValue;
  _cursorStyleIsSet = false;
  _pointerDownEventTarget;
  _cleanups;
  /** Add a new overlay to the list of attached overlay refs. */
  add(overlayRef) {
    super.add(overlayRef);
    if (!this._isAttached) {
      const body = this._document.body;
      const eventOptions = {
        capture: true
      };
      this._cleanups = this._ngZone.runOutsideAngular(() => [_bindEventWithOptions(this._renderer, body, "pointerdown", this._pointerDownListener, eventOptions), _bindEventWithOptions(this._renderer, body, "click", this._clickListener, eventOptions), _bindEventWithOptions(this._renderer, body, "auxclick", this._clickListener, eventOptions), _bindEventWithOptions(this._renderer, body, "contextmenu", this._clickListener, eventOptions)]);
      if (this._platform.IOS && !this._cursorStyleIsSet) {
        this._cursorOriginalValue = body.style.cursor;
        body.style.cursor = "pointer";
        this._cursorStyleIsSet = true;
      }
      this._isAttached = true;
    }
  }
  /** Detaches the global keyboard event listener. */
  detach() {
    if (this._isAttached) {
      this._cleanups?.forEach((cleanup) => cleanup());
      this._cleanups = void 0;
      if (this._platform.IOS && this._cursorStyleIsSet) {
        this._document.body.style.cursor = this._cursorOriginalValue;
        this._cursorStyleIsSet = false;
      }
      this._isAttached = false;
    }
  }
  /** Store pointerdown event target to track origin of click. */
  _pointerDownListener = (event) => {
    this._pointerDownEventTarget = _getEventTarget(event);
  };
  /** Click event listener that will be attached to the body propagate phase. */
  _clickListener = (event) => {
    const target = _getEventTarget(event);
    const origin = event.type === "click" && this._pointerDownEventTarget ? this._pointerDownEventTarget : target;
    this._pointerDownEventTarget = null;
    const overlays = this._attachedOverlays.slice();
    for (let i = overlays.length - 1; i > -1; i--) {
      const overlayRef = overlays[i];
      if (overlayRef._outsidePointerEvents.observers.length < 1 || !overlayRef.hasAttached()) {
        continue;
      }
      if (containsPierceShadowDom(overlayRef.overlayElement, target) || containsPierceShadowDom(overlayRef.overlayElement, origin)) {
        break;
      }
      const outsidePointerEvents = overlayRef._outsidePointerEvents;
      if (this._ngZone) {
        this._ngZone.run(() => outsidePointerEvents.next(event));
      } else {
        outsidePointerEvents.next(event);
      }
    }
  };
  static \u0275fac = /* @__PURE__ */ (() => {
    let \u0275OverlayOutsideClickDispatcher_BaseFactory;
    return function OverlayOutsideClickDispatcher_Factory(__ngFactoryType__) {
      return (\u0275OverlayOutsideClickDispatcher_BaseFactory || (\u0275OverlayOutsideClickDispatcher_BaseFactory = \u0275\u0275getInheritedFactory(_OverlayOutsideClickDispatcher)))(__ngFactoryType__ || _OverlayOutsideClickDispatcher);
    };
  })();
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({
    token: _OverlayOutsideClickDispatcher,
    factory: _OverlayOutsideClickDispatcher.\u0275fac,
    providedIn: "root"
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(OverlayOutsideClickDispatcher, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], null, null);
})();
function containsPierceShadowDom(parent, child) {
  const supportsShadowRoot = typeof ShadowRoot !== "undefined" && ShadowRoot;
  let current = child;
  while (current) {
    if (current === parent) {
      return true;
    }
    current = supportsShadowRoot && current instanceof ShadowRoot ? current.host : current.parentNode;
  }
  return false;
}
var _CdkOverlayStyleLoader = class __CdkOverlayStyleLoader {
  static \u0275fac = function _CdkOverlayStyleLoader_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || __CdkOverlayStyleLoader)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({
    type: __CdkOverlayStyleLoader,
    selectors: [["ng-component"]],
    hostAttrs: ["cdk-overlay-style-loader", ""],
    decls: 0,
    vars: 0,
    template: function _CdkOverlayStyleLoader_Template(rf, ctx) {
    },
    styles: [".cdk-overlay-container,.cdk-global-overlay-wrapper{pointer-events:none;top:0;left:0;height:100%;width:100%}.cdk-overlay-container{position:fixed}@layer cdk-overlay{.cdk-overlay-container{z-index:1000}}.cdk-overlay-container:empty{display:none}.cdk-global-overlay-wrapper{display:flex;position:absolute}@layer cdk-overlay{.cdk-global-overlay-wrapper{z-index:1000}}.cdk-overlay-pane{position:absolute;pointer-events:auto;box-sizing:border-box;display:flex;max-width:100%;max-height:100%}@layer cdk-overlay{.cdk-overlay-pane{z-index:1000}}.cdk-overlay-backdrop{position:absolute;top:0;bottom:0;left:0;right:0;pointer-events:auto;-webkit-tap-highlight-color:rgba(0,0,0,0);opacity:0;touch-action:manipulation}@layer cdk-overlay{.cdk-overlay-backdrop{z-index:1000;transition:opacity 400ms cubic-bezier(0.25, 0.8, 0.25, 1)}}@media(prefers-reduced-motion){.cdk-overlay-backdrop{transition-duration:1ms}}.cdk-overlay-backdrop-showing{opacity:1}@media(forced-colors: active){.cdk-overlay-backdrop-showing{opacity:.6}}@layer cdk-overlay{.cdk-overlay-dark-backdrop{background:rgba(0,0,0,.32)}}.cdk-overlay-transparent-backdrop{transition:visibility 1ms linear,opacity 1ms linear;visibility:hidden;opacity:1}.cdk-overlay-transparent-backdrop.cdk-overlay-backdrop-showing,.cdk-high-contrast-active .cdk-overlay-transparent-backdrop{opacity:0;visibility:visible}.cdk-overlay-backdrop-noop-animation{transition:none}.cdk-overlay-connected-position-bounding-box{position:absolute;display:flex;flex-direction:column;min-width:1px;min-height:1px}@layer cdk-overlay{.cdk-overlay-connected-position-bounding-box{z-index:1000}}.cdk-global-scrollblock{position:fixed;width:100%;overflow-y:scroll}\n"],
    encapsulation: 2,
    changeDetection: 0
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(_CdkOverlayStyleLoader, [{
    type: Component,
    args: [{
      template: "",
      changeDetection: ChangeDetectionStrategy.OnPush,
      encapsulation: ViewEncapsulation.None,
      host: {
        "cdk-overlay-style-loader": ""
      },
      styles: [".cdk-overlay-container,.cdk-global-overlay-wrapper{pointer-events:none;top:0;left:0;height:100%;width:100%}.cdk-overlay-container{position:fixed}@layer cdk-overlay{.cdk-overlay-container{z-index:1000}}.cdk-overlay-container:empty{display:none}.cdk-global-overlay-wrapper{display:flex;position:absolute}@layer cdk-overlay{.cdk-global-overlay-wrapper{z-index:1000}}.cdk-overlay-pane{position:absolute;pointer-events:auto;box-sizing:border-box;display:flex;max-width:100%;max-height:100%}@layer cdk-overlay{.cdk-overlay-pane{z-index:1000}}.cdk-overlay-backdrop{position:absolute;top:0;bottom:0;left:0;right:0;pointer-events:auto;-webkit-tap-highlight-color:rgba(0,0,0,0);opacity:0;touch-action:manipulation}@layer cdk-overlay{.cdk-overlay-backdrop{z-index:1000;transition:opacity 400ms cubic-bezier(0.25, 0.8, 0.25, 1)}}@media(prefers-reduced-motion){.cdk-overlay-backdrop{transition-duration:1ms}}.cdk-overlay-backdrop-showing{opacity:1}@media(forced-colors: active){.cdk-overlay-backdrop-showing{opacity:.6}}@layer cdk-overlay{.cdk-overlay-dark-backdrop{background:rgba(0,0,0,.32)}}.cdk-overlay-transparent-backdrop{transition:visibility 1ms linear,opacity 1ms linear;visibility:hidden;opacity:1}.cdk-overlay-transparent-backdrop.cdk-overlay-backdrop-showing,.cdk-high-contrast-active .cdk-overlay-transparent-backdrop{opacity:0;visibility:visible}.cdk-overlay-backdrop-noop-animation{transition:none}.cdk-overlay-connected-position-bounding-box{position:absolute;display:flex;flex-direction:column;min-width:1px;min-height:1px}@layer cdk-overlay{.cdk-overlay-connected-position-bounding-box{z-index:1000}}.cdk-global-scrollblock{position:fixed;width:100%;overflow-y:scroll}\n"]
    }]
  }], null, null);
})();
var OverlayContainer = class _OverlayContainer {
  _platform = inject(Platform);
  _containerElement;
  _document = inject(DOCUMENT);
  _styleLoader = inject(_CdkPrivateStyleLoader);
  constructor() {
  }
  ngOnDestroy() {
    this._containerElement?.remove();
  }
  /**
   * This method returns the overlay container element. It will lazily
   * create the element the first time it is called to facilitate using
   * the container in non-browser environments.
   * @returns the container element
   */
  getContainerElement() {
    this._loadStyles();
    if (!this._containerElement) {
      this._createContainer();
    }
    return this._containerElement;
  }
  /**
   * Create the overlay container element, which is simply a div
   * with the 'cdk-overlay-container' class on the document body.
   */
  _createContainer() {
    const containerClass = "cdk-overlay-container";
    if (this._platform.isBrowser || _isTestEnvironment()) {
      const oppositePlatformContainers = this._document.querySelectorAll(`.${containerClass}[platform="server"], .${containerClass}[platform="test"]`);
      for (let i = 0; i < oppositePlatformContainers.length; i++) {
        oppositePlatformContainers[i].remove();
      }
    }
    const container = this._document.createElement("div");
    container.classList.add(containerClass);
    if (_isTestEnvironment()) {
      container.setAttribute("platform", "test");
    } else if (!this._platform.isBrowser) {
      container.setAttribute("platform", "server");
    }
    this._document.body.appendChild(container);
    this._containerElement = container;
  }
  /** Loads the structural styles necessary for the overlay to work. */
  _loadStyles() {
    this._styleLoader.load(_CdkOverlayStyleLoader);
  }
  static \u0275fac = function OverlayContainer_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _OverlayContainer)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({
    token: _OverlayContainer,
    factory: _OverlayContainer.\u0275fac,
    providedIn: "root"
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(OverlayContainer, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], () => [], null);
})();
var BackdropRef = class {
  _renderer;
  _ngZone;
  element;
  _cleanupClick;
  _cleanupTransitionEnd;
  _fallbackTimeout;
  constructor(document2, _renderer, _ngZone, onClick) {
    this._renderer = _renderer;
    this._ngZone = _ngZone;
    this.element = document2.createElement("div");
    this.element.classList.add("cdk-overlay-backdrop");
    this._cleanupClick = _renderer.listen(this.element, "click", onClick);
  }
  detach() {
    this._ngZone.runOutsideAngular(() => {
      const element = this.element;
      clearTimeout(this._fallbackTimeout);
      this._cleanupTransitionEnd?.();
      this._cleanupTransitionEnd = this._renderer.listen(element, "transitionend", this.dispose);
      this._fallbackTimeout = setTimeout(this.dispose, 500);
      element.style.pointerEvents = "none";
      element.classList.remove("cdk-overlay-backdrop-showing");
    });
  }
  dispose = () => {
    clearTimeout(this._fallbackTimeout);
    this._cleanupClick?.();
    this._cleanupTransitionEnd?.();
    this._cleanupClick = this._cleanupTransitionEnd = this._fallbackTimeout = void 0;
    this.element.remove();
  };
};
var OverlayRef = class {
  _portalOutlet;
  _host;
  _pane;
  _config;
  _ngZone;
  _keyboardDispatcher;
  _document;
  _location;
  _outsideClickDispatcher;
  _animationsDisabled;
  _injector;
  _renderer;
  _backdropClick = new Subject();
  _attachments = new Subject();
  _detachments = new Subject();
  _positionStrategy;
  _scrollStrategy;
  _locationChanges = Subscription.EMPTY;
  _backdropRef = null;
  /**
   * Reference to the parent of the `_host` at the time it was detached. Used to restore
   * the `_host` to its original position in the DOM when it gets re-attached.
   */
  _previousHostParent;
  /** Stream of keydown events dispatched to this overlay. */
  _keydownEvents = new Subject();
  /** Stream of mouse outside events dispatched to this overlay. */
  _outsidePointerEvents = new Subject();
  _renders = new Subject();
  _afterRenderRef;
  /** Reference to the currently-running `afterNextRender` call. */
  _afterNextRenderRef;
  constructor(_portalOutlet, _host, _pane, _config, _ngZone, _keyboardDispatcher, _document, _location, _outsideClickDispatcher, _animationsDisabled = false, _injector, _renderer) {
    this._portalOutlet = _portalOutlet;
    this._host = _host;
    this._pane = _pane;
    this._config = _config;
    this._ngZone = _ngZone;
    this._keyboardDispatcher = _keyboardDispatcher;
    this._document = _document;
    this._location = _location;
    this._outsideClickDispatcher = _outsideClickDispatcher;
    this._animationsDisabled = _animationsDisabled;
    this._injector = _injector;
    this._renderer = _renderer;
    if (_config.scrollStrategy) {
      this._scrollStrategy = _config.scrollStrategy;
      this._scrollStrategy.attach(this);
    }
    this._positionStrategy = _config.positionStrategy;
    this._afterRenderRef = untracked(() => afterRender(() => {
      this._renders.next();
    }, {
      injector: this._injector
    }));
  }
  /** The overlay's HTML element */
  get overlayElement() {
    return this._pane;
  }
  /** The overlay's backdrop HTML element. */
  get backdropElement() {
    return this._backdropRef?.element || null;
  }
  /**
   * Wrapper around the panel element. Can be used for advanced
   * positioning where a wrapper with specific styling is
   * required around the overlay pane.
   */
  get hostElement() {
    return this._host;
  }
  /**
   * Attaches content, given via a Portal, to the overlay.
   * If the overlay is configured to have a backdrop, it will be created.
   *
   * @param portal Portal instance to which to attach the overlay.
   * @returns The portal attachment result.
   */
  attach(portal) {
    if (!this._host.parentElement && this._previousHostParent) {
      this._previousHostParent.appendChild(this._host);
    }
    const attachResult = this._portalOutlet.attach(portal);
    if (this._positionStrategy) {
      this._positionStrategy.attach(this);
    }
    this._updateStackingOrder();
    this._updateElementSize();
    this._updateElementDirection();
    if (this._scrollStrategy) {
      this._scrollStrategy.enable();
    }
    this._afterNextRenderRef?.destroy();
    this._afterNextRenderRef = afterNextRender(() => {
      if (this.hasAttached()) {
        this.updatePosition();
      }
    }, {
      injector: this._injector
    });
    this._togglePointerEvents(true);
    if (this._config.hasBackdrop) {
      this._attachBackdrop();
    }
    if (this._config.panelClass) {
      this._toggleClasses(this._pane, this._config.panelClass, true);
    }
    this._attachments.next();
    this._keyboardDispatcher.add(this);
    if (this._config.disposeOnNavigation) {
      this._locationChanges = this._location.subscribe(() => this.dispose());
    }
    this._outsideClickDispatcher.add(this);
    if (typeof attachResult?.onDestroy === "function") {
      attachResult.onDestroy(() => {
        if (this.hasAttached()) {
          this._ngZone.runOutsideAngular(() => Promise.resolve().then(() => this.detach()));
        }
      });
    }
    return attachResult;
  }
  /**
   * Detaches an overlay from a portal.
   * @returns The portal detachment result.
   */
  detach() {
    if (!this.hasAttached()) {
      return;
    }
    this.detachBackdrop();
    this._togglePointerEvents(false);
    if (this._positionStrategy && this._positionStrategy.detach) {
      this._positionStrategy.detach();
    }
    if (this._scrollStrategy) {
      this._scrollStrategy.disable();
    }
    const detachmentResult = this._portalOutlet.detach();
    this._detachments.next();
    this._keyboardDispatcher.remove(this);
    this._detachContentWhenEmpty();
    this._locationChanges.unsubscribe();
    this._outsideClickDispatcher.remove(this);
    return detachmentResult;
  }
  /** Cleans up the overlay from the DOM. */
  dispose() {
    const isAttached = this.hasAttached();
    if (this._positionStrategy) {
      this._positionStrategy.dispose();
    }
    this._disposeScrollStrategy();
    this._backdropRef?.dispose();
    this._locationChanges.unsubscribe();
    this._keyboardDispatcher.remove(this);
    this._portalOutlet.dispose();
    this._attachments.complete();
    this._backdropClick.complete();
    this._keydownEvents.complete();
    this._outsidePointerEvents.complete();
    this._outsideClickDispatcher.remove(this);
    this._host?.remove();
    this._afterNextRenderRef?.destroy();
    this._previousHostParent = this._pane = this._host = this._backdropRef = null;
    if (isAttached) {
      this._detachments.next();
    }
    this._detachments.complete();
    this._afterRenderRef.destroy();
    this._renders.complete();
  }
  /** Whether the overlay has attached content. */
  hasAttached() {
    return this._portalOutlet.hasAttached();
  }
  /** Gets an observable that emits when the backdrop has been clicked. */
  backdropClick() {
    return this._backdropClick;
  }
  /** Gets an observable that emits when the overlay has been attached. */
  attachments() {
    return this._attachments;
  }
  /** Gets an observable that emits when the overlay has been detached. */
  detachments() {
    return this._detachments;
  }
  /** Gets an observable of keydown events targeted to this overlay. */
  keydownEvents() {
    return this._keydownEvents;
  }
  /** Gets an observable of pointer events targeted outside this overlay. */
  outsidePointerEvents() {
    return this._outsidePointerEvents;
  }
  /** Gets the current overlay configuration, which is immutable. */
  getConfig() {
    return this._config;
  }
  /** Updates the position of the overlay based on the position strategy. */
  updatePosition() {
    if (this._positionStrategy) {
      this._positionStrategy.apply();
    }
  }
  /** Switches to a new position strategy and updates the overlay position. */
  updatePositionStrategy(strategy) {
    if (strategy === this._positionStrategy) {
      return;
    }
    if (this._positionStrategy) {
      this._positionStrategy.dispose();
    }
    this._positionStrategy = strategy;
    if (this.hasAttached()) {
      strategy.attach(this);
      this.updatePosition();
    }
  }
  /** Update the size properties of the overlay. */
  updateSize(sizeConfig) {
    this._config = __spreadValues(__spreadValues({}, this._config), sizeConfig);
    this._updateElementSize();
  }
  /** Sets the LTR/RTL direction for the overlay. */
  setDirection(dir) {
    this._config = __spreadProps(__spreadValues({}, this._config), {
      direction: dir
    });
    this._updateElementDirection();
  }
  /** Add a CSS class or an array of classes to the overlay pane. */
  addPanelClass(classes) {
    if (this._pane) {
      this._toggleClasses(this._pane, classes, true);
    }
  }
  /** Remove a CSS class or an array of classes from the overlay pane. */
  removePanelClass(classes) {
    if (this._pane) {
      this._toggleClasses(this._pane, classes, false);
    }
  }
  /**
   * Returns the layout direction of the overlay panel.
   */
  getDirection() {
    const direction = this._config.direction;
    if (!direction) {
      return "ltr";
    }
    return typeof direction === "string" ? direction : direction.value;
  }
  /** Switches to a new scroll strategy. */
  updateScrollStrategy(strategy) {
    if (strategy === this._scrollStrategy) {
      return;
    }
    this._disposeScrollStrategy();
    this._scrollStrategy = strategy;
    if (this.hasAttached()) {
      strategy.attach(this);
      strategy.enable();
    }
  }
  /** Updates the text direction of the overlay panel. */
  _updateElementDirection() {
    this._host.setAttribute("dir", this.getDirection());
  }
  /** Updates the size of the overlay element based on the overlay config. */
  _updateElementSize() {
    if (!this._pane) {
      return;
    }
    const style = this._pane.style;
    style.width = coerceCssPixelValue(this._config.width);
    style.height = coerceCssPixelValue(this._config.height);
    style.minWidth = coerceCssPixelValue(this._config.minWidth);
    style.minHeight = coerceCssPixelValue(this._config.minHeight);
    style.maxWidth = coerceCssPixelValue(this._config.maxWidth);
    style.maxHeight = coerceCssPixelValue(this._config.maxHeight);
  }
  /** Toggles the pointer events for the overlay pane element. */
  _togglePointerEvents(enablePointer) {
    this._pane.style.pointerEvents = enablePointer ? "" : "none";
  }
  /** Attaches a backdrop for this overlay. */
  _attachBackdrop() {
    const showingClass = "cdk-overlay-backdrop-showing";
    this._backdropRef?.dispose();
    this._backdropRef = new BackdropRef(this._document, this._renderer, this._ngZone, (event) => {
      this._backdropClick.next(event);
    });
    if (this._animationsDisabled) {
      this._backdropRef.element.classList.add("cdk-overlay-backdrop-noop-animation");
    }
    if (this._config.backdropClass) {
      this._toggleClasses(this._backdropRef.element, this._config.backdropClass, true);
    }
    this._host.parentElement.insertBefore(this._backdropRef.element, this._host);
    if (!this._animationsDisabled && typeof requestAnimationFrame !== "undefined") {
      this._ngZone.runOutsideAngular(() => {
        requestAnimationFrame(() => this._backdropRef?.element.classList.add(showingClass));
      });
    } else {
      this._backdropRef.element.classList.add(showingClass);
    }
  }
  /**
   * Updates the stacking order of the element, moving it to the top if necessary.
   * This is required in cases where one overlay was detached, while another one,
   * that should be behind it, was destroyed. The next time both of them are opened,
   * the stacking will be wrong, because the detached element's pane will still be
   * in its original DOM position.
   */
  _updateStackingOrder() {
    if (this._host.nextSibling) {
      this._host.parentNode.appendChild(this._host);
    }
  }
  /** Detaches the backdrop (if any) associated with the overlay. */
  detachBackdrop() {
    if (this._animationsDisabled) {
      this._backdropRef?.dispose();
      this._backdropRef = null;
    } else {
      this._backdropRef?.detach();
    }
  }
  /** Toggles a single CSS class or an array of classes on an element. */
  _toggleClasses(element, cssClasses, isAdd) {
    const classes = coerceArray(cssClasses || []).filter((c) => !!c);
    if (classes.length) {
      isAdd ? element.classList.add(...classes) : element.classList.remove(...classes);
    }
  }
  /** Detaches the overlay content next time the zone stabilizes. */
  _detachContentWhenEmpty() {
    this._ngZone.runOutsideAngular(() => {
      const subscription = this._renders.pipe(takeUntil(merge(this._attachments, this._detachments))).subscribe(() => {
        if (!this._pane || !this._host || this._pane.children.length === 0) {
          if (this._pane && this._config.panelClass) {
            this._toggleClasses(this._pane, this._config.panelClass, false);
          }
          if (this._host && this._host.parentElement) {
            this._previousHostParent = this._host.parentElement;
            this._host.remove();
          }
          subscription.unsubscribe();
        }
      });
    });
  }
  /** Disposes of a scroll strategy. */
  _disposeScrollStrategy() {
    const scrollStrategy = this._scrollStrategy;
    scrollStrategy?.disable();
    scrollStrategy?.detach?.();
  }
};
var boundingBoxClass = "cdk-overlay-connected-position-bounding-box";
var cssUnitPattern = /([A-Za-z%]+)$/;
var FlexibleConnectedPositionStrategy = class {
  _viewportRuler;
  _document;
  _platform;
  _overlayContainer;
  /** The overlay to which this strategy is attached. */
  _overlayRef;
  /** Whether we're performing the very first positioning of the overlay. */
  _isInitialRender;
  /** Last size used for the bounding box. Used to avoid resizing the overlay after open. */
  _lastBoundingBoxSize = {
    width: 0,
    height: 0
  };
  /** Whether the overlay was pushed in a previous positioning. */
  _isPushed = false;
  /** Whether the overlay can be pushed on-screen on the initial open. */
  _canPush = true;
  /** Whether the overlay can grow via flexible width/height after the initial open. */
  _growAfterOpen = false;
  /** Whether the overlay's width and height can be constrained to fit within the viewport. */
  _hasFlexibleDimensions = true;
  /** Whether the overlay position is locked. */
  _positionLocked = false;
  /** Cached origin dimensions */
  _originRect;
  /** Cached overlay dimensions */
  _overlayRect;
  /** Cached viewport dimensions */
  _viewportRect;
  /** Cached container dimensions */
  _containerRect;
  /** Amount of space that must be maintained between the overlay and the edge of the viewport. */
  _viewportMargin = 0;
  /** The Scrollable containers used to check scrollable view properties on position change. */
  _scrollables = [];
  /** Ordered list of preferred positions, from most to least desirable. */
  _preferredPositions = [];
  /** The origin element against which the overlay will be positioned. */
  _origin;
  /** The overlay pane element. */
  _pane;
  /** Whether the strategy has been disposed of already. */
  _isDisposed;
  /**
   * Parent element for the overlay panel used to constrain the overlay panel's size to fit
   * within the viewport.
   */
  _boundingBox;
  /** The last position to have been calculated as the best fit position. */
  _lastPosition;
  /** The last calculated scroll visibility. Only tracked  */
  _lastScrollVisibility;
  /** Subject that emits whenever the position changes. */
  _positionChanges = new Subject();
  /** Subscription to viewport size changes. */
  _resizeSubscription = Subscription.EMPTY;
  /** Default offset for the overlay along the x axis. */
  _offsetX = 0;
  /** Default offset for the overlay along the y axis. */
  _offsetY = 0;
  /** Selector to be used when finding the elements on which to set the transform origin. */
  _transformOriginSelector;
  /** Keeps track of the CSS classes that the position strategy has applied on the overlay panel. */
  _appliedPanelClasses = [];
  /** Amount by which the overlay was pushed in each axis during the last time it was positioned. */
  _previousPushAmount;
  /** Observable sequence of position changes. */
  positionChanges = this._positionChanges;
  /** Ordered list of preferred positions, from most to least desirable. */
  get positions() {
    return this._preferredPositions;
  }
  constructor(connectedTo, _viewportRuler, _document, _platform, _overlayContainer) {
    this._viewportRuler = _viewportRuler;
    this._document = _document;
    this._platform = _platform;
    this._overlayContainer = _overlayContainer;
    this.setOrigin(connectedTo);
  }
  /** Attaches this position strategy to an overlay. */
  attach(overlayRef) {
    if (this._overlayRef && overlayRef !== this._overlayRef && (typeof ngDevMode === "undefined" || ngDevMode)) {
      throw Error("This position strategy is already attached to an overlay");
    }
    this._validatePositions();
    overlayRef.hostElement.classList.add(boundingBoxClass);
    this._overlayRef = overlayRef;
    this._boundingBox = overlayRef.hostElement;
    this._pane = overlayRef.overlayElement;
    this._isDisposed = false;
    this._isInitialRender = true;
    this._lastPosition = null;
    this._resizeSubscription.unsubscribe();
    this._resizeSubscription = this._viewportRuler.change().subscribe(() => {
      this._isInitialRender = true;
      this.apply();
    });
  }
  /**
   * Updates the position of the overlay element, using whichever preferred position relative
   * to the origin best fits on-screen.
   *
   * The selection of a position goes as follows:
   *  - If any positions fit completely within the viewport as-is,
   *      choose the first position that does so.
   *  - If flexible dimensions are enabled and at least one satisfies the given minimum width/height,
   *      choose the position with the greatest available size modified by the positions' weight.
   *  - If pushing is enabled, take the position that went off-screen the least and push it
   *      on-screen.
   *  - If none of the previous criteria were met, use the position that goes off-screen the least.
   * @docs-private
   */
  apply() {
    if (this._isDisposed || !this._platform.isBrowser) {
      return;
    }
    if (!this._isInitialRender && this._positionLocked && this._lastPosition) {
      this.reapplyLastPosition();
      return;
    }
    this._clearPanelClasses();
    this._resetOverlayElementStyles();
    this._resetBoundingBoxStyles();
    this._viewportRect = this._getNarrowedViewportRect();
    this._originRect = this._getOriginRect();
    this._overlayRect = this._pane.getBoundingClientRect();
    this._containerRect = this._overlayContainer.getContainerElement().getBoundingClientRect();
    const originRect = this._originRect;
    const overlayRect = this._overlayRect;
    const viewportRect = this._viewportRect;
    const containerRect = this._containerRect;
    const flexibleFits = [];
    let fallback;
    for (let pos of this._preferredPositions) {
      let originPoint = this._getOriginPoint(originRect, containerRect, pos);
      let overlayPoint = this._getOverlayPoint(originPoint, overlayRect, pos);
      let overlayFit = this._getOverlayFit(overlayPoint, overlayRect, viewportRect, pos);
      if (overlayFit.isCompletelyWithinViewport) {
        this._isPushed = false;
        this._applyPosition(pos, originPoint);
        return;
      }
      if (this._canFitWithFlexibleDimensions(overlayFit, overlayPoint, viewportRect)) {
        flexibleFits.push({
          position: pos,
          origin: originPoint,
          overlayRect,
          boundingBoxRect: this._calculateBoundingBoxRect(originPoint, pos)
        });
        continue;
      }
      if (!fallback || fallback.overlayFit.visibleArea < overlayFit.visibleArea) {
        fallback = {
          overlayFit,
          overlayPoint,
          originPoint,
          position: pos,
          overlayRect
        };
      }
    }
    if (flexibleFits.length) {
      let bestFit = null;
      let bestScore = -1;
      for (const fit of flexibleFits) {
        const score = fit.boundingBoxRect.width * fit.boundingBoxRect.height * (fit.position.weight || 1);
        if (score > bestScore) {
          bestScore = score;
          bestFit = fit;
        }
      }
      this._isPushed = false;
      this._applyPosition(bestFit.position, bestFit.origin);
      return;
    }
    if (this._canPush) {
      this._isPushed = true;
      this._applyPosition(fallback.position, fallback.originPoint);
      return;
    }
    this._applyPosition(fallback.position, fallback.originPoint);
  }
  detach() {
    this._clearPanelClasses();
    this._lastPosition = null;
    this._previousPushAmount = null;
    this._resizeSubscription.unsubscribe();
  }
  /** Cleanup after the element gets destroyed. */
  dispose() {
    if (this._isDisposed) {
      return;
    }
    if (this._boundingBox) {
      extendStyles(this._boundingBox.style, {
        top: "",
        left: "",
        right: "",
        bottom: "",
        height: "",
        width: "",
        alignItems: "",
        justifyContent: ""
      });
    }
    if (this._pane) {
      this._resetOverlayElementStyles();
    }
    if (this._overlayRef) {
      this._overlayRef.hostElement.classList.remove(boundingBoxClass);
    }
    this.detach();
    this._positionChanges.complete();
    this._overlayRef = this._boundingBox = null;
    this._isDisposed = true;
  }
  /**
   * This re-aligns the overlay element with the trigger in its last calculated position,
   * even if a position higher in the "preferred positions" list would now fit. This
   * allows one to re-align the panel without changing the orientation of the panel.
   */
  reapplyLastPosition() {
    if (this._isDisposed || !this._platform.isBrowser) {
      return;
    }
    const lastPosition = this._lastPosition;
    if (lastPosition) {
      this._originRect = this._getOriginRect();
      this._overlayRect = this._pane.getBoundingClientRect();
      this._viewportRect = this._getNarrowedViewportRect();
      this._containerRect = this._overlayContainer.getContainerElement().getBoundingClientRect();
      const originPoint = this._getOriginPoint(this._originRect, this._containerRect, lastPosition);
      this._applyPosition(lastPosition, originPoint);
    } else {
      this.apply();
    }
  }
  /**
   * Sets the list of Scrollable containers that host the origin element so that
   * on reposition we can evaluate if it or the overlay has been clipped or outside view. Every
   * Scrollable must be an ancestor element of the strategy's origin element.
   */
  withScrollableContainers(scrollables) {
    this._scrollables = scrollables;
    return this;
  }
  /**
   * Adds new preferred positions.
   * @param positions List of positions options for this overlay.
   */
  withPositions(positions) {
    this._preferredPositions = positions;
    if (positions.indexOf(this._lastPosition) === -1) {
      this._lastPosition = null;
    }
    this._validatePositions();
    return this;
  }
  /**
   * Sets a minimum distance the overlay may be positioned to the edge of the viewport.
   * @param margin Required margin between the overlay and the viewport edge in pixels.
   */
  withViewportMargin(margin) {
    this._viewportMargin = margin;
    return this;
  }
  /** Sets whether the overlay's width and height can be constrained to fit within the viewport. */
  withFlexibleDimensions(flexibleDimensions = true) {
    this._hasFlexibleDimensions = flexibleDimensions;
    return this;
  }
  /** Sets whether the overlay can grow after the initial open via flexible width/height. */
  withGrowAfterOpen(growAfterOpen = true) {
    this._growAfterOpen = growAfterOpen;
    return this;
  }
  /** Sets whether the overlay can be pushed on-screen if none of the provided positions fit. */
  withPush(canPush = true) {
    this._canPush = canPush;
    return this;
  }
  /**
   * Sets whether the overlay's position should be locked in after it is positioned
   * initially. When an overlay is locked in, it won't attempt to reposition itself
   * when the position is re-applied (e.g. when the user scrolls away).
   * @param isLocked Whether the overlay should locked in.
   */
  withLockedPosition(isLocked = true) {
    this._positionLocked = isLocked;
    return this;
  }
  /**
   * Sets the origin, relative to which to position the overlay.
   * Using an element origin is useful for building components that need to be positioned
   * relatively to a trigger (e.g. dropdown menus or tooltips), whereas using a point can be
   * used for cases like contextual menus which open relative to the user's pointer.
   * @param origin Reference to the new origin.
   */
  setOrigin(origin) {
    this._origin = origin;
    return this;
  }
  /**
   * Sets the default offset for the overlay's connection point on the x-axis.
   * @param offset New offset in the X axis.
   */
  withDefaultOffsetX(offset) {
    this._offsetX = offset;
    return this;
  }
  /**
   * Sets the default offset for the overlay's connection point on the y-axis.
   * @param offset New offset in the Y axis.
   */
  withDefaultOffsetY(offset) {
    this._offsetY = offset;
    return this;
  }
  /**
   * Configures that the position strategy should set a `transform-origin` on some elements
   * inside the overlay, depending on the current position that is being applied. This is
   * useful for the cases where the origin of an animation can change depending on the
   * alignment of the overlay.
   * @param selector CSS selector that will be used to find the target
   *    elements onto which to set the transform origin.
   */
  withTransformOriginOn(selector) {
    this._transformOriginSelector = selector;
    return this;
  }
  /**
   * Gets the (x, y) coordinate of a connection point on the origin based on a relative position.
   */
  _getOriginPoint(originRect, containerRect, pos) {
    let x;
    if (pos.originX == "center") {
      x = originRect.left + originRect.width / 2;
    } else {
      const startX = this._isRtl() ? originRect.right : originRect.left;
      const endX = this._isRtl() ? originRect.left : originRect.right;
      x = pos.originX == "start" ? startX : endX;
    }
    if (containerRect.left < 0) {
      x -= containerRect.left;
    }
    let y;
    if (pos.originY == "center") {
      y = originRect.top + originRect.height / 2;
    } else {
      y = pos.originY == "top" ? originRect.top : originRect.bottom;
    }
    if (containerRect.top < 0) {
      y -= containerRect.top;
    }
    return {
      x,
      y
    };
  }
  /**
   * Gets the (x, y) coordinate of the top-left corner of the overlay given a given position and
   * origin point to which the overlay should be connected.
   */
  _getOverlayPoint(originPoint, overlayRect, pos) {
    let overlayStartX;
    if (pos.overlayX == "center") {
      overlayStartX = -overlayRect.width / 2;
    } else if (pos.overlayX === "start") {
      overlayStartX = this._isRtl() ? -overlayRect.width : 0;
    } else {
      overlayStartX = this._isRtl() ? 0 : -overlayRect.width;
    }
    let overlayStartY;
    if (pos.overlayY == "center") {
      overlayStartY = -overlayRect.height / 2;
    } else {
      overlayStartY = pos.overlayY == "top" ? 0 : -overlayRect.height;
    }
    return {
      x: originPoint.x + overlayStartX,
      y: originPoint.y + overlayStartY
    };
  }
  /** Gets how well an overlay at the given point will fit within the viewport. */
  _getOverlayFit(point, rawOverlayRect, viewport, position) {
    const overlay = getRoundedBoundingClientRect(rawOverlayRect);
    let {
      x,
      y
    } = point;
    let offsetX = this._getOffset(position, "x");
    let offsetY = this._getOffset(position, "y");
    if (offsetX) {
      x += offsetX;
    }
    if (offsetY) {
      y += offsetY;
    }
    let leftOverflow = 0 - x;
    let rightOverflow = x + overlay.width - viewport.width;
    let topOverflow = 0 - y;
    let bottomOverflow = y + overlay.height - viewport.height;
    let visibleWidth = this._subtractOverflows(overlay.width, leftOverflow, rightOverflow);
    let visibleHeight = this._subtractOverflows(overlay.height, topOverflow, bottomOverflow);
    let visibleArea = visibleWidth * visibleHeight;
    return {
      visibleArea,
      isCompletelyWithinViewport: overlay.width * overlay.height === visibleArea,
      fitsInViewportVertically: visibleHeight === overlay.height,
      fitsInViewportHorizontally: visibleWidth == overlay.width
    };
  }
  /**
   * Whether the overlay can fit within the viewport when it may resize either its width or height.
   * @param fit How well the overlay fits in the viewport at some position.
   * @param point The (x, y) coordinates of the overlay at some position.
   * @param viewport The geometry of the viewport.
   */
  _canFitWithFlexibleDimensions(fit, point, viewport) {
    if (this._hasFlexibleDimensions) {
      const availableHeight = viewport.bottom - point.y;
      const availableWidth = viewport.right - point.x;
      const minHeight = getPixelValue(this._overlayRef.getConfig().minHeight);
      const minWidth = getPixelValue(this._overlayRef.getConfig().minWidth);
      const verticalFit = fit.fitsInViewportVertically || minHeight != null && minHeight <= availableHeight;
      const horizontalFit = fit.fitsInViewportHorizontally || minWidth != null && minWidth <= availableWidth;
      return verticalFit && horizontalFit;
    }
    return false;
  }
  /**
   * Gets the point at which the overlay can be "pushed" on-screen. If the overlay is larger than
   * the viewport, the top-left corner will be pushed on-screen (with overflow occurring on the
   * right and bottom).
   *
   * @param start Starting point from which the overlay is pushed.
   * @param rawOverlayRect Dimensions of the overlay.
   * @param scrollPosition Current viewport scroll position.
   * @returns The point at which to position the overlay after pushing. This is effectively a new
   *     originPoint.
   */
  _pushOverlayOnScreen(start, rawOverlayRect, scrollPosition) {
    if (this._previousPushAmount && this._positionLocked) {
      return {
        x: start.x + this._previousPushAmount.x,
        y: start.y + this._previousPushAmount.y
      };
    }
    const overlay = getRoundedBoundingClientRect(rawOverlayRect);
    const viewport = this._viewportRect;
    const overflowRight = Math.max(start.x + overlay.width - viewport.width, 0);
    const overflowBottom = Math.max(start.y + overlay.height - viewport.height, 0);
    const overflowTop = Math.max(viewport.top - scrollPosition.top - start.y, 0);
    const overflowLeft = Math.max(viewport.left - scrollPosition.left - start.x, 0);
    let pushX = 0;
    let pushY = 0;
    if (overlay.width <= viewport.width) {
      pushX = overflowLeft || -overflowRight;
    } else {
      pushX = start.x < this._viewportMargin ? viewport.left - scrollPosition.left - start.x : 0;
    }
    if (overlay.height <= viewport.height) {
      pushY = overflowTop || -overflowBottom;
    } else {
      pushY = start.y < this._viewportMargin ? viewport.top - scrollPosition.top - start.y : 0;
    }
    this._previousPushAmount = {
      x: pushX,
      y: pushY
    };
    return {
      x: start.x + pushX,
      y: start.y + pushY
    };
  }
  /**
   * Applies a computed position to the overlay and emits a position change.
   * @param position The position preference
   * @param originPoint The point on the origin element where the overlay is connected.
   */
  _applyPosition(position, originPoint) {
    this._setTransformOrigin(position);
    this._setOverlayElementStyles(originPoint, position);
    this._setBoundingBoxStyles(originPoint, position);
    if (position.panelClass) {
      this._addPanelClasses(position.panelClass);
    }
    if (this._positionChanges.observers.length) {
      const scrollVisibility = this._getScrollVisibility();
      if (position !== this._lastPosition || !this._lastScrollVisibility || !compareScrollVisibility(this._lastScrollVisibility, scrollVisibility)) {
        const changeEvent = new ConnectedOverlayPositionChange(position, scrollVisibility);
        this._positionChanges.next(changeEvent);
      }
      this._lastScrollVisibility = scrollVisibility;
    }
    this._lastPosition = position;
    this._isInitialRender = false;
  }
  /** Sets the transform origin based on the configured selector and the passed-in position.  */
  _setTransformOrigin(position) {
    if (!this._transformOriginSelector) {
      return;
    }
    const elements = this._boundingBox.querySelectorAll(this._transformOriginSelector);
    let xOrigin;
    let yOrigin = position.overlayY;
    if (position.overlayX === "center") {
      xOrigin = "center";
    } else if (this._isRtl()) {
      xOrigin = position.overlayX === "start" ? "right" : "left";
    } else {
      xOrigin = position.overlayX === "start" ? "left" : "right";
    }
    for (let i = 0; i < elements.length; i++) {
      elements[i].style.transformOrigin = `${xOrigin} ${yOrigin}`;
    }
  }
  /**
   * Gets the position and size of the overlay's sizing container.
   *
   * This method does no measuring and applies no styles so that we can cheaply compute the
   * bounds for all positions and choose the best fit based on these results.
   */
  _calculateBoundingBoxRect(origin, position) {
    const viewport = this._viewportRect;
    const isRtl = this._isRtl();
    let height, top, bottom;
    if (position.overlayY === "top") {
      top = origin.y;
      height = viewport.height - top + this._viewportMargin;
    } else if (position.overlayY === "bottom") {
      bottom = viewport.height - origin.y + this._viewportMargin * 2;
      height = viewport.height - bottom + this._viewportMargin;
    } else {
      const smallestDistanceToViewportEdge = Math.min(viewport.bottom - origin.y + viewport.top, origin.y);
      const previousHeight = this._lastBoundingBoxSize.height;
      height = smallestDistanceToViewportEdge * 2;
      top = origin.y - smallestDistanceToViewportEdge;
      if (height > previousHeight && !this._isInitialRender && !this._growAfterOpen) {
        top = origin.y - previousHeight / 2;
      }
    }
    const isBoundedByRightViewportEdge = position.overlayX === "start" && !isRtl || position.overlayX === "end" && isRtl;
    const isBoundedByLeftViewportEdge = position.overlayX === "end" && !isRtl || position.overlayX === "start" && isRtl;
    let width, left, right;
    if (isBoundedByLeftViewportEdge) {
      right = viewport.width - origin.x + this._viewportMargin * 2;
      width = origin.x - this._viewportMargin;
    } else if (isBoundedByRightViewportEdge) {
      left = origin.x;
      width = viewport.right - origin.x;
    } else {
      const smallestDistanceToViewportEdge = Math.min(viewport.right - origin.x + viewport.left, origin.x);
      const previousWidth = this._lastBoundingBoxSize.width;
      width = smallestDistanceToViewportEdge * 2;
      left = origin.x - smallestDistanceToViewportEdge;
      if (width > previousWidth && !this._isInitialRender && !this._growAfterOpen) {
        left = origin.x - previousWidth / 2;
      }
    }
    return {
      top,
      left,
      bottom,
      right,
      width,
      height
    };
  }
  /**
   * Sets the position and size of the overlay's sizing wrapper. The wrapper is positioned on the
   * origin's connection point and stretches to the bounds of the viewport.
   *
   * @param origin The point on the origin element where the overlay is connected.
   * @param position The position preference
   */
  _setBoundingBoxStyles(origin, position) {
    const boundingBoxRect = this._calculateBoundingBoxRect(origin, position);
    if (!this._isInitialRender && !this._growAfterOpen) {
      boundingBoxRect.height = Math.min(boundingBoxRect.height, this._lastBoundingBoxSize.height);
      boundingBoxRect.width = Math.min(boundingBoxRect.width, this._lastBoundingBoxSize.width);
    }
    const styles = {};
    if (this._hasExactPosition()) {
      styles.top = styles.left = "0";
      styles.bottom = styles.right = styles.maxHeight = styles.maxWidth = "";
      styles.width = styles.height = "100%";
    } else {
      const maxHeight = this._overlayRef.getConfig().maxHeight;
      const maxWidth = this._overlayRef.getConfig().maxWidth;
      styles.height = coerceCssPixelValue(boundingBoxRect.height);
      styles.top = coerceCssPixelValue(boundingBoxRect.top);
      styles.bottom = coerceCssPixelValue(boundingBoxRect.bottom);
      styles.width = coerceCssPixelValue(boundingBoxRect.width);
      styles.left = coerceCssPixelValue(boundingBoxRect.left);
      styles.right = coerceCssPixelValue(boundingBoxRect.right);
      if (position.overlayX === "center") {
        styles.alignItems = "center";
      } else {
        styles.alignItems = position.overlayX === "end" ? "flex-end" : "flex-start";
      }
      if (position.overlayY === "center") {
        styles.justifyContent = "center";
      } else {
        styles.justifyContent = position.overlayY === "bottom" ? "flex-end" : "flex-start";
      }
      if (maxHeight) {
        styles.maxHeight = coerceCssPixelValue(maxHeight);
      }
      if (maxWidth) {
        styles.maxWidth = coerceCssPixelValue(maxWidth);
      }
    }
    this._lastBoundingBoxSize = boundingBoxRect;
    extendStyles(this._boundingBox.style, styles);
  }
  /** Resets the styles for the bounding box so that a new positioning can be computed. */
  _resetBoundingBoxStyles() {
    extendStyles(this._boundingBox.style, {
      top: "0",
      left: "0",
      right: "0",
      bottom: "0",
      height: "",
      width: "",
      alignItems: "",
      justifyContent: ""
    });
  }
  /** Resets the styles for the overlay pane so that a new positioning can be computed. */
  _resetOverlayElementStyles() {
    extendStyles(this._pane.style, {
      top: "",
      left: "",
      bottom: "",
      right: "",
      position: "",
      transform: ""
    });
  }
  /** Sets positioning styles to the overlay element. */
  _setOverlayElementStyles(originPoint, position) {
    const styles = {};
    const hasExactPosition = this._hasExactPosition();
    const hasFlexibleDimensions = this._hasFlexibleDimensions;
    const config = this._overlayRef.getConfig();
    if (hasExactPosition) {
      const scrollPosition = this._viewportRuler.getViewportScrollPosition();
      extendStyles(styles, this._getExactOverlayY(position, originPoint, scrollPosition));
      extendStyles(styles, this._getExactOverlayX(position, originPoint, scrollPosition));
    } else {
      styles.position = "static";
    }
    let transformString = "";
    let offsetX = this._getOffset(position, "x");
    let offsetY = this._getOffset(position, "y");
    if (offsetX) {
      transformString += `translateX(${offsetX}px) `;
    }
    if (offsetY) {
      transformString += `translateY(${offsetY}px)`;
    }
    styles.transform = transformString.trim();
    if (config.maxHeight) {
      if (hasExactPosition) {
        styles.maxHeight = coerceCssPixelValue(config.maxHeight);
      } else if (hasFlexibleDimensions) {
        styles.maxHeight = "";
      }
    }
    if (config.maxWidth) {
      if (hasExactPosition) {
        styles.maxWidth = coerceCssPixelValue(config.maxWidth);
      } else if (hasFlexibleDimensions) {
        styles.maxWidth = "";
      }
    }
    extendStyles(this._pane.style, styles);
  }
  /** Gets the exact top/bottom for the overlay when not using flexible sizing or when pushing. */
  _getExactOverlayY(position, originPoint, scrollPosition) {
    let styles = {
      top: "",
      bottom: ""
    };
    let overlayPoint = this._getOverlayPoint(originPoint, this._overlayRect, position);
    if (this._isPushed) {
      overlayPoint = this._pushOverlayOnScreen(overlayPoint, this._overlayRect, scrollPosition);
    }
    if (position.overlayY === "bottom") {
      const documentHeight = this._document.documentElement.clientHeight;
      styles.bottom = `${documentHeight - (overlayPoint.y + this._overlayRect.height)}px`;
    } else {
      styles.top = coerceCssPixelValue(overlayPoint.y);
    }
    return styles;
  }
  /** Gets the exact left/right for the overlay when not using flexible sizing or when pushing. */
  _getExactOverlayX(position, originPoint, scrollPosition) {
    let styles = {
      left: "",
      right: ""
    };
    let overlayPoint = this._getOverlayPoint(originPoint, this._overlayRect, position);
    if (this._isPushed) {
      overlayPoint = this._pushOverlayOnScreen(overlayPoint, this._overlayRect, scrollPosition);
    }
    let horizontalStyleProperty;
    if (this._isRtl()) {
      horizontalStyleProperty = position.overlayX === "end" ? "left" : "right";
    } else {
      horizontalStyleProperty = position.overlayX === "end" ? "right" : "left";
    }
    if (horizontalStyleProperty === "right") {
      const documentWidth = this._document.documentElement.clientWidth;
      styles.right = `${documentWidth - (overlayPoint.x + this._overlayRect.width)}px`;
    } else {
      styles.left = coerceCssPixelValue(overlayPoint.x);
    }
    return styles;
  }
  /**
   * Gets the view properties of the trigger and overlay, including whether they are clipped
   * or completely outside the view of any of the strategy's scrollables.
   */
  _getScrollVisibility() {
    const originBounds = this._getOriginRect();
    const overlayBounds = this._pane.getBoundingClientRect();
    const scrollContainerBounds = this._scrollables.map((scrollable) => {
      return scrollable.getElementRef().nativeElement.getBoundingClientRect();
    });
    return {
      isOriginClipped: isElementClippedByScrolling(originBounds, scrollContainerBounds),
      isOriginOutsideView: isElementScrolledOutsideView(originBounds, scrollContainerBounds),
      isOverlayClipped: isElementClippedByScrolling(overlayBounds, scrollContainerBounds),
      isOverlayOutsideView: isElementScrolledOutsideView(overlayBounds, scrollContainerBounds)
    };
  }
  /** Subtracts the amount that an element is overflowing on an axis from its length. */
  _subtractOverflows(length, ...overflows) {
    return overflows.reduce((currentValue, currentOverflow) => {
      return currentValue - Math.max(currentOverflow, 0);
    }, length);
  }
  /** Narrows the given viewport rect by the current _viewportMargin. */
  _getNarrowedViewportRect() {
    const width = this._document.documentElement.clientWidth;
    const height = this._document.documentElement.clientHeight;
    const scrollPosition = this._viewportRuler.getViewportScrollPosition();
    return {
      top: scrollPosition.top + this._viewportMargin,
      left: scrollPosition.left + this._viewportMargin,
      right: scrollPosition.left + width - this._viewportMargin,
      bottom: scrollPosition.top + height - this._viewportMargin,
      width: width - 2 * this._viewportMargin,
      height: height - 2 * this._viewportMargin
    };
  }
  /** Whether the we're dealing with an RTL context */
  _isRtl() {
    return this._overlayRef.getDirection() === "rtl";
  }
  /** Determines whether the overlay uses exact or flexible positioning. */
  _hasExactPosition() {
    return !this._hasFlexibleDimensions || this._isPushed;
  }
  /** Retrieves the offset of a position along the x or y axis. */
  _getOffset(position, axis) {
    if (axis === "x") {
      return position.offsetX == null ? this._offsetX : position.offsetX;
    }
    return position.offsetY == null ? this._offsetY : position.offsetY;
  }
  /** Validates that the current position match the expected values. */
  _validatePositions() {
    if (typeof ngDevMode === "undefined" || ngDevMode) {
      if (!this._preferredPositions.length) {
        throw Error("FlexibleConnectedPositionStrategy: At least one position is required.");
      }
      this._preferredPositions.forEach((pair) => {
        validateHorizontalPosition("originX", pair.originX);
        validateVerticalPosition("originY", pair.originY);
        validateHorizontalPosition("overlayX", pair.overlayX);
        validateVerticalPosition("overlayY", pair.overlayY);
      });
    }
  }
  /** Adds a single CSS class or an array of classes on the overlay panel. */
  _addPanelClasses(cssClasses) {
    if (this._pane) {
      coerceArray(cssClasses).forEach((cssClass) => {
        if (cssClass !== "" && this._appliedPanelClasses.indexOf(cssClass) === -1) {
          this._appliedPanelClasses.push(cssClass);
          this._pane.classList.add(cssClass);
        }
      });
    }
  }
  /** Clears the classes that the position strategy has applied from the overlay panel. */
  _clearPanelClasses() {
    if (this._pane) {
      this._appliedPanelClasses.forEach((cssClass) => {
        this._pane.classList.remove(cssClass);
      });
      this._appliedPanelClasses = [];
    }
  }
  /** Returns the DOMRect of the current origin. */
  _getOriginRect() {
    const origin = this._origin;
    if (origin instanceof ElementRef) {
      return origin.nativeElement.getBoundingClientRect();
    }
    if (origin instanceof Element) {
      return origin.getBoundingClientRect();
    }
    const width = origin.width || 0;
    const height = origin.height || 0;
    return {
      top: origin.y,
      bottom: origin.y + height,
      left: origin.x,
      right: origin.x + width,
      height,
      width
    };
  }
};
function extendStyles(destination, source) {
  for (let key in source) {
    if (source.hasOwnProperty(key)) {
      destination[key] = source[key];
    }
  }
  return destination;
}
function getPixelValue(input) {
  if (typeof input !== "number" && input != null) {
    const [value, units] = input.split(cssUnitPattern);
    return !units || units === "px" ? parseFloat(value) : null;
  }
  return input || null;
}
function getRoundedBoundingClientRect(clientRect) {
  return {
    top: Math.floor(clientRect.top),
    right: Math.floor(clientRect.right),
    bottom: Math.floor(clientRect.bottom),
    left: Math.floor(clientRect.left),
    width: Math.floor(clientRect.width),
    height: Math.floor(clientRect.height)
  };
}
function compareScrollVisibility(a, b) {
  if (a === b) {
    return true;
  }
  return a.isOriginClipped === b.isOriginClipped && a.isOriginOutsideView === b.isOriginOutsideView && a.isOverlayClipped === b.isOverlayClipped && a.isOverlayOutsideView === b.isOverlayOutsideView;
}
var wrapperClass = "cdk-global-overlay-wrapper";
var GlobalPositionStrategy = class {
  /** The overlay to which this strategy is attached. */
  _overlayRef;
  _cssPosition = "static";
  _topOffset = "";
  _bottomOffset = "";
  _alignItems = "";
  _xPosition = "";
  _xOffset = "";
  _width = "";
  _height = "";
  _isDisposed = false;
  attach(overlayRef) {
    const config = overlayRef.getConfig();
    this._overlayRef = overlayRef;
    if (this._width && !config.width) {
      overlayRef.updateSize({
        width: this._width
      });
    }
    if (this._height && !config.height) {
      overlayRef.updateSize({
        height: this._height
      });
    }
    overlayRef.hostElement.classList.add(wrapperClass);
    this._isDisposed = false;
  }
  /**
   * Sets the top position of the overlay. Clears any previously set vertical position.
   * @param value New top offset.
   */
  top(value = "") {
    this._bottomOffset = "";
    this._topOffset = value;
    this._alignItems = "flex-start";
    return this;
  }
  /**
   * Sets the left position of the overlay. Clears any previously set horizontal position.
   * @param value New left offset.
   */
  left(value = "") {
    this._xOffset = value;
    this._xPosition = "left";
    return this;
  }
  /**
   * Sets the bottom position of the overlay. Clears any previously set vertical position.
   * @param value New bottom offset.
   */
  bottom(value = "") {
    this._topOffset = "";
    this._bottomOffset = value;
    this._alignItems = "flex-end";
    return this;
  }
  /**
   * Sets the right position of the overlay. Clears any previously set horizontal position.
   * @param value New right offset.
   */
  right(value = "") {
    this._xOffset = value;
    this._xPosition = "right";
    return this;
  }
  /**
   * Sets the overlay to the start of the viewport, depending on the overlay direction.
   * This will be to the left in LTR layouts and to the right in RTL.
   * @param offset Offset from the edge of the screen.
   */
  start(value = "") {
    this._xOffset = value;
    this._xPosition = "start";
    return this;
  }
  /**
   * Sets the overlay to the end of the viewport, depending on the overlay direction.
   * This will be to the right in LTR layouts and to the left in RTL.
   * @param offset Offset from the edge of the screen.
   */
  end(value = "") {
    this._xOffset = value;
    this._xPosition = "end";
    return this;
  }
  /**
   * Sets the overlay width and clears any previously set width.
   * @param value New width for the overlay
   * @deprecated Pass the `width` through the `OverlayConfig`.
   * @breaking-change 8.0.0
   */
  width(value = "") {
    if (this._overlayRef) {
      this._overlayRef.updateSize({
        width: value
      });
    } else {
      this._width = value;
    }
    return this;
  }
  /**
   * Sets the overlay height and clears any previously set height.
   * @param value New height for the overlay
   * @deprecated Pass the `height` through the `OverlayConfig`.
   * @breaking-change 8.0.0
   */
  height(value = "") {
    if (this._overlayRef) {
      this._overlayRef.updateSize({
        height: value
      });
    } else {
      this._height = value;
    }
    return this;
  }
  /**
   * Centers the overlay horizontally with an optional offset.
   * Clears any previously set horizontal position.
   *
   * @param offset Overlay offset from the horizontal center.
   */
  centerHorizontally(offset = "") {
    this.left(offset);
    this._xPosition = "center";
    return this;
  }
  /**
   * Centers the overlay vertically with an optional offset.
   * Clears any previously set vertical position.
   *
   * @param offset Overlay offset from the vertical center.
   */
  centerVertically(offset = "") {
    this.top(offset);
    this._alignItems = "center";
    return this;
  }
  /**
   * Apply the position to the element.
   * @docs-private
   */
  apply() {
    if (!this._overlayRef || !this._overlayRef.hasAttached()) {
      return;
    }
    const styles = this._overlayRef.overlayElement.style;
    const parentStyles = this._overlayRef.hostElement.style;
    const config = this._overlayRef.getConfig();
    const {
      width,
      height,
      maxWidth,
      maxHeight
    } = config;
    const shouldBeFlushHorizontally = (width === "100%" || width === "100vw") && (!maxWidth || maxWidth === "100%" || maxWidth === "100vw");
    const shouldBeFlushVertically = (height === "100%" || height === "100vh") && (!maxHeight || maxHeight === "100%" || maxHeight === "100vh");
    const xPosition = this._xPosition;
    const xOffset = this._xOffset;
    const isRtl = this._overlayRef.getConfig().direction === "rtl";
    let marginLeft = "";
    let marginRight = "";
    let justifyContent = "";
    if (shouldBeFlushHorizontally) {
      justifyContent = "flex-start";
    } else if (xPosition === "center") {
      justifyContent = "center";
      if (isRtl) {
        marginRight = xOffset;
      } else {
        marginLeft = xOffset;
      }
    } else if (isRtl) {
      if (xPosition === "left" || xPosition === "end") {
        justifyContent = "flex-end";
        marginLeft = xOffset;
      } else if (xPosition === "right" || xPosition === "start") {
        justifyContent = "flex-start";
        marginRight = xOffset;
      }
    } else if (xPosition === "left" || xPosition === "start") {
      justifyContent = "flex-start";
      marginLeft = xOffset;
    } else if (xPosition === "right" || xPosition === "end") {
      justifyContent = "flex-end";
      marginRight = xOffset;
    }
    styles.position = this._cssPosition;
    styles.marginLeft = shouldBeFlushHorizontally ? "0" : marginLeft;
    styles.marginTop = shouldBeFlushVertically ? "0" : this._topOffset;
    styles.marginBottom = this._bottomOffset;
    styles.marginRight = shouldBeFlushHorizontally ? "0" : marginRight;
    parentStyles.justifyContent = justifyContent;
    parentStyles.alignItems = shouldBeFlushVertically ? "flex-start" : this._alignItems;
  }
  /**
   * Cleans up the DOM changes from the position strategy.
   * @docs-private
   */
  dispose() {
    if (this._isDisposed || !this._overlayRef) {
      return;
    }
    const styles = this._overlayRef.overlayElement.style;
    const parent = this._overlayRef.hostElement;
    const parentStyles = parent.style;
    parent.classList.remove(wrapperClass);
    parentStyles.justifyContent = parentStyles.alignItems = styles.marginTop = styles.marginBottom = styles.marginLeft = styles.marginRight = styles.position = "";
    this._overlayRef = null;
    this._isDisposed = true;
  }
};
var OverlayPositionBuilder = class _OverlayPositionBuilder {
  _viewportRuler = inject(ViewportRuler);
  _document = inject(DOCUMENT);
  _platform = inject(Platform);
  _overlayContainer = inject(OverlayContainer);
  constructor() {
  }
  /**
   * Creates a global position strategy.
   */
  global() {
    return new GlobalPositionStrategy();
  }
  /**
   * Creates a flexible position strategy.
   * @param origin Origin relative to which to position the overlay.
   */
  flexibleConnectedTo(origin) {
    return new FlexibleConnectedPositionStrategy(origin, this._viewportRuler, this._document, this._platform, this._overlayContainer);
  }
  static \u0275fac = function OverlayPositionBuilder_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _OverlayPositionBuilder)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({
    token: _OverlayPositionBuilder,
    factory: _OverlayPositionBuilder.\u0275fac,
    providedIn: "root"
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(OverlayPositionBuilder, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], () => [], null);
})();
var Overlay = class _Overlay {
  scrollStrategies = inject(ScrollStrategyOptions);
  _overlayContainer = inject(OverlayContainer);
  _positionBuilder = inject(OverlayPositionBuilder);
  _keyboardDispatcher = inject(OverlayKeyboardDispatcher);
  _injector = inject(Injector);
  _ngZone = inject(NgZone);
  _document = inject(DOCUMENT);
  _directionality = inject(Directionality);
  _location = inject(Location);
  _outsideClickDispatcher = inject(OverlayOutsideClickDispatcher);
  _animationsModuleType = inject(ANIMATION_MODULE_TYPE, {
    optional: true
  });
  _idGenerator = inject(_IdGenerator);
  _renderer = inject(RendererFactory2).createRenderer(null, null);
  _appRef;
  _styleLoader = inject(_CdkPrivateStyleLoader);
  constructor() {
  }
  /**
   * Creates an overlay.
   * @param config Configuration applied to the overlay.
   * @returns Reference to the created overlay.
   */
  create(config) {
    this._styleLoader.load(_CdkOverlayStyleLoader);
    const host = this._createHostElement();
    const pane = this._createPaneElement(host);
    const portalOutlet = this._createPortalOutlet(pane);
    const overlayConfig = new OverlayConfig(config);
    overlayConfig.direction = overlayConfig.direction || this._directionality.value;
    return new OverlayRef(portalOutlet, host, pane, overlayConfig, this._ngZone, this._keyboardDispatcher, this._document, this._location, this._outsideClickDispatcher, this._animationsModuleType === "NoopAnimations", this._injector.get(EnvironmentInjector), this._renderer);
  }
  /**
   * Gets a position builder that can be used, via fluent API,
   * to construct and configure a position strategy.
   * @returns An overlay position builder.
   */
  position() {
    return this._positionBuilder;
  }
  /**
   * Creates the DOM element for an overlay and appends it to the overlay container.
   * @returns Newly-created pane element
   */
  _createPaneElement(host) {
    const pane = this._document.createElement("div");
    pane.id = this._idGenerator.getId("cdk-overlay-");
    pane.classList.add("cdk-overlay-pane");
    host.appendChild(pane);
    return pane;
  }
  /**
   * Creates the host element that wraps around an overlay
   * and can be used for advanced positioning.
   * @returns Newly-create host element.
   */
  _createHostElement() {
    const host = this._document.createElement("div");
    this._overlayContainer.getContainerElement().appendChild(host);
    return host;
  }
  /**
   * Create a DomPortalOutlet into which the overlay content can be loaded.
   * @param pane The DOM element to turn into a portal outlet.
   * @returns A portal outlet for the given DOM element.
   */
  _createPortalOutlet(pane) {
    if (!this._appRef) {
      this._appRef = this._injector.get(ApplicationRef);
    }
    return new DomPortalOutlet(pane, null, this._appRef, this._injector, this._document);
  }
  static \u0275fac = function Overlay_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _Overlay)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({
    token: _Overlay,
    factory: _Overlay.\u0275fac,
    providedIn: "root"
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Overlay, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], () => [], null);
})();
var defaultPositionList = [{
  originX: "start",
  originY: "bottom",
  overlayX: "start",
  overlayY: "top"
}, {
  originX: "start",
  originY: "top",
  overlayX: "start",
  overlayY: "bottom"
}, {
  originX: "end",
  originY: "top",
  overlayX: "end",
  overlayY: "bottom"
}, {
  originX: "end",
  originY: "bottom",
  overlayX: "end",
  overlayY: "top"
}];
var CDK_CONNECTED_OVERLAY_SCROLL_STRATEGY = new InjectionToken("cdk-connected-overlay-scroll-strategy", {
  providedIn: "root",
  factory: () => {
    const overlay = inject(Overlay);
    return () => overlay.scrollStrategies.reposition();
  }
});
var CdkOverlayOrigin = class _CdkOverlayOrigin {
  elementRef = inject(ElementRef);
  constructor() {
  }
  static \u0275fac = function CdkOverlayOrigin_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _CdkOverlayOrigin)();
  };
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
    type: _CdkOverlayOrigin,
    selectors: [["", "cdk-overlay-origin", ""], ["", "overlay-origin", ""], ["", "cdkOverlayOrigin", ""]],
    exportAs: ["cdkOverlayOrigin"]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(CdkOverlayOrigin, [{
    type: Directive,
    args: [{
      selector: "[cdk-overlay-origin], [overlay-origin], [cdkOverlayOrigin]",
      exportAs: "cdkOverlayOrigin"
    }]
  }], () => [], null);
})();
var CdkConnectedOverlay = class _CdkConnectedOverlay {
  _overlay = inject(Overlay);
  _dir = inject(Directionality, {
    optional: true
  });
  _overlayRef;
  _templatePortal;
  _backdropSubscription = Subscription.EMPTY;
  _attachSubscription = Subscription.EMPTY;
  _detachSubscription = Subscription.EMPTY;
  _positionSubscription = Subscription.EMPTY;
  _offsetX;
  _offsetY;
  _position;
  _scrollStrategyFactory = inject(CDK_CONNECTED_OVERLAY_SCROLL_STRATEGY);
  _disposeOnNavigation = false;
  _ngZone = inject(NgZone);
  /** Origin for the connected overlay. */
  origin;
  /** Registered connected position pairs. */
  positions;
  /**
   * This input overrides the positions input if specified. It lets users pass
   * in arbitrary positioning strategies.
   */
  positionStrategy;
  /** The offset in pixels for the overlay connection point on the x-axis */
  get offsetX() {
    return this._offsetX;
  }
  set offsetX(offsetX) {
    this._offsetX = offsetX;
    if (this._position) {
      this._updatePositionStrategy(this._position);
    }
  }
  /** The offset in pixels for the overlay connection point on the y-axis */
  get offsetY() {
    return this._offsetY;
  }
  set offsetY(offsetY) {
    this._offsetY = offsetY;
    if (this._position) {
      this._updatePositionStrategy(this._position);
    }
  }
  /** The width of the overlay panel. */
  width;
  /** The height of the overlay panel. */
  height;
  /** The min width of the overlay panel. */
  minWidth;
  /** The min height of the overlay panel. */
  minHeight;
  /** The custom class to be set on the backdrop element. */
  backdropClass;
  /** The custom class to add to the overlay pane element. */
  panelClass;
  /** Margin between the overlay and the viewport edges. */
  viewportMargin = 0;
  /** Strategy to be used when handling scroll events while the overlay is open. */
  scrollStrategy;
  /** Whether the overlay is open. */
  open = false;
  /** Whether the overlay can be closed by user interaction. */
  disableClose = false;
  /** CSS selector which to set the transform origin. */
  transformOriginSelector;
  /** Whether or not the overlay should attach a backdrop. */
  hasBackdrop = false;
  /** Whether or not the overlay should be locked when scrolling. */
  lockPosition = false;
  /** Whether the overlay's width and height can be constrained to fit within the viewport. */
  flexibleDimensions = false;
  /** Whether the overlay can grow after the initial open when flexible positioning is turned on. */
  growAfterOpen = false;
  /** Whether the overlay can be pushed on-screen if none of the provided positions fit. */
  push = false;
  /** Whether the overlay should be disposed of when the user goes backwards/forwards in history. */
  get disposeOnNavigation() {
    return this._disposeOnNavigation;
  }
  set disposeOnNavigation(value) {
    this._disposeOnNavigation = value;
  }
  /** Event emitted when the backdrop is clicked. */
  backdropClick = new EventEmitter();
  /** Event emitted when the position has changed. */
  positionChange = new EventEmitter();
  /** Event emitted when the overlay has been attached. */
  attach = new EventEmitter();
  /** Event emitted when the overlay has been detached. */
  detach = new EventEmitter();
  /** Emits when there are keyboard events that are targeted at the overlay. */
  overlayKeydown = new EventEmitter();
  /** Emits when there are mouse outside click events that are targeted at the overlay. */
  overlayOutsideClick = new EventEmitter();
  // TODO(jelbourn): inputs for size, scroll behavior, animation, etc.
  constructor() {
    const templateRef = inject(TemplateRef);
    const viewContainerRef = inject(ViewContainerRef);
    this._templatePortal = new TemplatePortal(templateRef, viewContainerRef);
    this.scrollStrategy = this._scrollStrategyFactory();
  }
  /** The associated overlay reference. */
  get overlayRef() {
    return this._overlayRef;
  }
  /** The element's layout direction. */
  get dir() {
    return this._dir ? this._dir.value : "ltr";
  }
  ngOnDestroy() {
    this._attachSubscription.unsubscribe();
    this._detachSubscription.unsubscribe();
    this._backdropSubscription.unsubscribe();
    this._positionSubscription.unsubscribe();
    this._overlayRef?.dispose();
  }
  ngOnChanges(changes) {
    if (this._position) {
      this._updatePositionStrategy(this._position);
      this._overlayRef?.updateSize({
        width: this.width,
        minWidth: this.minWidth,
        height: this.height,
        minHeight: this.minHeight
      });
      if (changes["origin"] && this.open) {
        this._position.apply();
      }
    }
    if (changes["open"]) {
      this.open ? this.attachOverlay() : this.detachOverlay();
    }
  }
  /** Creates an overlay */
  _createOverlay() {
    if (!this.positions || !this.positions.length) {
      this.positions = defaultPositionList;
    }
    const overlayRef = this._overlayRef = this._overlay.create(this._buildConfig());
    this._attachSubscription = overlayRef.attachments().subscribe(() => this.attach.emit());
    this._detachSubscription = overlayRef.detachments().subscribe(() => this.detach.emit());
    overlayRef.keydownEvents().subscribe((event) => {
      this.overlayKeydown.next(event);
      if (event.keyCode === ESCAPE && !this.disableClose && !hasModifierKey(event)) {
        event.preventDefault();
        this.detachOverlay();
      }
    });
    this._overlayRef.outsidePointerEvents().subscribe((event) => {
      const origin = this._getOriginElement();
      const target = _getEventTarget(event);
      if (!origin || origin !== target && !origin.contains(target)) {
        this.overlayOutsideClick.next(event);
      }
    });
  }
  /** Builds the overlay config based on the directive's inputs */
  _buildConfig() {
    const positionStrategy = this._position = this.positionStrategy || this._createPositionStrategy();
    const overlayConfig = new OverlayConfig({
      direction: this._dir || "ltr",
      positionStrategy,
      scrollStrategy: this.scrollStrategy,
      hasBackdrop: this.hasBackdrop,
      disposeOnNavigation: this.disposeOnNavigation
    });
    if (this.width || this.width === 0) {
      overlayConfig.width = this.width;
    }
    if (this.height || this.height === 0) {
      overlayConfig.height = this.height;
    }
    if (this.minWidth || this.minWidth === 0) {
      overlayConfig.minWidth = this.minWidth;
    }
    if (this.minHeight || this.minHeight === 0) {
      overlayConfig.minHeight = this.minHeight;
    }
    if (this.backdropClass) {
      overlayConfig.backdropClass = this.backdropClass;
    }
    if (this.panelClass) {
      overlayConfig.panelClass = this.panelClass;
    }
    return overlayConfig;
  }
  /** Updates the state of a position strategy, based on the values of the directive inputs. */
  _updatePositionStrategy(positionStrategy) {
    const positions = this.positions.map((currentPosition) => ({
      originX: currentPosition.originX,
      originY: currentPosition.originY,
      overlayX: currentPosition.overlayX,
      overlayY: currentPosition.overlayY,
      offsetX: currentPosition.offsetX || this.offsetX,
      offsetY: currentPosition.offsetY || this.offsetY,
      panelClass: currentPosition.panelClass || void 0
    }));
    return positionStrategy.setOrigin(this._getOrigin()).withPositions(positions).withFlexibleDimensions(this.flexibleDimensions).withPush(this.push).withGrowAfterOpen(this.growAfterOpen).withViewportMargin(this.viewportMargin).withLockedPosition(this.lockPosition).withTransformOriginOn(this.transformOriginSelector);
  }
  /** Returns the position strategy of the overlay to be set on the overlay config */
  _createPositionStrategy() {
    const strategy = this._overlay.position().flexibleConnectedTo(this._getOrigin());
    this._updatePositionStrategy(strategy);
    return strategy;
  }
  _getOrigin() {
    if (this.origin instanceof CdkOverlayOrigin) {
      return this.origin.elementRef;
    } else {
      return this.origin;
    }
  }
  _getOriginElement() {
    if (this.origin instanceof CdkOverlayOrigin) {
      return this.origin.elementRef.nativeElement;
    }
    if (this.origin instanceof ElementRef) {
      return this.origin.nativeElement;
    }
    if (typeof Element !== "undefined" && this.origin instanceof Element) {
      return this.origin;
    }
    return null;
  }
  /** Attaches the overlay. */
  attachOverlay() {
    if (!this._overlayRef) {
      this._createOverlay();
    } else {
      this._overlayRef.getConfig().hasBackdrop = this.hasBackdrop;
    }
    if (!this._overlayRef.hasAttached()) {
      this._overlayRef.attach(this._templatePortal);
    }
    if (this.hasBackdrop) {
      this._backdropSubscription = this._overlayRef.backdropClick().subscribe((event) => {
        this.backdropClick.emit(event);
      });
    } else {
      this._backdropSubscription.unsubscribe();
    }
    this._positionSubscription.unsubscribe();
    if (this.positionChange.observers.length > 0) {
      this._positionSubscription = this._position.positionChanges.pipe(takeWhile(() => this.positionChange.observers.length > 0)).subscribe((position) => {
        this._ngZone.run(() => this.positionChange.emit(position));
        if (this.positionChange.observers.length === 0) {
          this._positionSubscription.unsubscribe();
        }
      });
    }
    this.open = true;
  }
  /** Detaches the overlay. */
  detachOverlay() {
    this._overlayRef?.detach();
    this._backdropSubscription.unsubscribe();
    this._positionSubscription.unsubscribe();
    this.open = false;
  }
  static \u0275fac = function CdkConnectedOverlay_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _CdkConnectedOverlay)();
  };
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
    type: _CdkConnectedOverlay,
    selectors: [["", "cdk-connected-overlay", ""], ["", "connected-overlay", ""], ["", "cdkConnectedOverlay", ""]],
    inputs: {
      origin: [0, "cdkConnectedOverlayOrigin", "origin"],
      positions: [0, "cdkConnectedOverlayPositions", "positions"],
      positionStrategy: [0, "cdkConnectedOverlayPositionStrategy", "positionStrategy"],
      offsetX: [0, "cdkConnectedOverlayOffsetX", "offsetX"],
      offsetY: [0, "cdkConnectedOverlayOffsetY", "offsetY"],
      width: [0, "cdkConnectedOverlayWidth", "width"],
      height: [0, "cdkConnectedOverlayHeight", "height"],
      minWidth: [0, "cdkConnectedOverlayMinWidth", "minWidth"],
      minHeight: [0, "cdkConnectedOverlayMinHeight", "minHeight"],
      backdropClass: [0, "cdkConnectedOverlayBackdropClass", "backdropClass"],
      panelClass: [0, "cdkConnectedOverlayPanelClass", "panelClass"],
      viewportMargin: [0, "cdkConnectedOverlayViewportMargin", "viewportMargin"],
      scrollStrategy: [0, "cdkConnectedOverlayScrollStrategy", "scrollStrategy"],
      open: [0, "cdkConnectedOverlayOpen", "open"],
      disableClose: [0, "cdkConnectedOverlayDisableClose", "disableClose"],
      transformOriginSelector: [0, "cdkConnectedOverlayTransformOriginOn", "transformOriginSelector"],
      hasBackdrop: [2, "cdkConnectedOverlayHasBackdrop", "hasBackdrop", booleanAttribute],
      lockPosition: [2, "cdkConnectedOverlayLockPosition", "lockPosition", booleanAttribute],
      flexibleDimensions: [2, "cdkConnectedOverlayFlexibleDimensions", "flexibleDimensions", booleanAttribute],
      growAfterOpen: [2, "cdkConnectedOverlayGrowAfterOpen", "growAfterOpen", booleanAttribute],
      push: [2, "cdkConnectedOverlayPush", "push", booleanAttribute],
      disposeOnNavigation: [2, "cdkConnectedOverlayDisposeOnNavigation", "disposeOnNavigation", booleanAttribute]
    },
    outputs: {
      backdropClick: "backdropClick",
      positionChange: "positionChange",
      attach: "attach",
      detach: "detach",
      overlayKeydown: "overlayKeydown",
      overlayOutsideClick: "overlayOutsideClick"
    },
    exportAs: ["cdkConnectedOverlay"],
    features: [\u0275\u0275NgOnChangesFeature]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(CdkConnectedOverlay, [{
    type: Directive,
    args: [{
      selector: "[cdk-connected-overlay], [connected-overlay], [cdkConnectedOverlay]",
      exportAs: "cdkConnectedOverlay"
    }]
  }], () => [], {
    origin: [{
      type: Input,
      args: ["cdkConnectedOverlayOrigin"]
    }],
    positions: [{
      type: Input,
      args: ["cdkConnectedOverlayPositions"]
    }],
    positionStrategy: [{
      type: Input,
      args: ["cdkConnectedOverlayPositionStrategy"]
    }],
    offsetX: [{
      type: Input,
      args: ["cdkConnectedOverlayOffsetX"]
    }],
    offsetY: [{
      type: Input,
      args: ["cdkConnectedOverlayOffsetY"]
    }],
    width: [{
      type: Input,
      args: ["cdkConnectedOverlayWidth"]
    }],
    height: [{
      type: Input,
      args: ["cdkConnectedOverlayHeight"]
    }],
    minWidth: [{
      type: Input,
      args: ["cdkConnectedOverlayMinWidth"]
    }],
    minHeight: [{
      type: Input,
      args: ["cdkConnectedOverlayMinHeight"]
    }],
    backdropClass: [{
      type: Input,
      args: ["cdkConnectedOverlayBackdropClass"]
    }],
    panelClass: [{
      type: Input,
      args: ["cdkConnectedOverlayPanelClass"]
    }],
    viewportMargin: [{
      type: Input,
      args: ["cdkConnectedOverlayViewportMargin"]
    }],
    scrollStrategy: [{
      type: Input,
      args: ["cdkConnectedOverlayScrollStrategy"]
    }],
    open: [{
      type: Input,
      args: ["cdkConnectedOverlayOpen"]
    }],
    disableClose: [{
      type: Input,
      args: ["cdkConnectedOverlayDisableClose"]
    }],
    transformOriginSelector: [{
      type: Input,
      args: ["cdkConnectedOverlayTransformOriginOn"]
    }],
    hasBackdrop: [{
      type: Input,
      args: [{
        alias: "cdkConnectedOverlayHasBackdrop",
        transform: booleanAttribute
      }]
    }],
    lockPosition: [{
      type: Input,
      args: [{
        alias: "cdkConnectedOverlayLockPosition",
        transform: booleanAttribute
      }]
    }],
    flexibleDimensions: [{
      type: Input,
      args: [{
        alias: "cdkConnectedOverlayFlexibleDimensions",
        transform: booleanAttribute
      }]
    }],
    growAfterOpen: [{
      type: Input,
      args: [{
        alias: "cdkConnectedOverlayGrowAfterOpen",
        transform: booleanAttribute
      }]
    }],
    push: [{
      type: Input,
      args: [{
        alias: "cdkConnectedOverlayPush",
        transform: booleanAttribute
      }]
    }],
    disposeOnNavigation: [{
      type: Input,
      args: [{
        alias: "cdkConnectedOverlayDisposeOnNavigation",
        transform: booleanAttribute
      }]
    }],
    backdropClick: [{
      type: Output
    }],
    positionChange: [{
      type: Output
    }],
    attach: [{
      type: Output
    }],
    detach: [{
      type: Output
    }],
    overlayKeydown: [{
      type: Output
    }],
    overlayOutsideClick: [{
      type: Output
    }]
  });
})();
function CDK_CONNECTED_OVERLAY_SCROLL_STRATEGY_PROVIDER_FACTORY(overlay) {
  return () => overlay.scrollStrategies.reposition();
}
var CDK_CONNECTED_OVERLAY_SCROLL_STRATEGY_PROVIDER = {
  provide: CDK_CONNECTED_OVERLAY_SCROLL_STRATEGY,
  deps: [Overlay],
  useFactory: CDK_CONNECTED_OVERLAY_SCROLL_STRATEGY_PROVIDER_FACTORY
};
var OverlayModule = class _OverlayModule {
  static \u0275fac = function OverlayModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _OverlayModule)();
  };
  static \u0275mod = /* @__PURE__ */ \u0275\u0275defineNgModule({
    type: _OverlayModule
  });
  static \u0275inj = /* @__PURE__ */ \u0275\u0275defineInjector({
    providers: [Overlay, CDK_CONNECTED_OVERLAY_SCROLL_STRATEGY_PROVIDER],
    imports: [BidiModule, PortalModule, ScrollingModule, ScrollingModule]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(OverlayModule, [{
    type: NgModule,
    args: [{
      imports: [BidiModule, PortalModule, ScrollingModule, CdkConnectedOverlay, CdkOverlayOrigin],
      exports: [CdkConnectedOverlay, CdkOverlayOrigin, ScrollingModule],
      providers: [Overlay, CDK_CONNECTED_OVERLAY_SCROLL_STRATEGY_PROVIDER]
    }]
  }], null, null);
})();

// node_modules/@angular/cdk/fesm2022/overlay.mjs
var FullscreenOverlayContainer = class _FullscreenOverlayContainer extends OverlayContainer {
  _renderer = inject(RendererFactory2).createRenderer(null, null);
  _fullScreenEventName;
  _cleanupFullScreenListener;
  constructor() {
    super();
  }
  ngOnDestroy() {
    super.ngOnDestroy();
    this._cleanupFullScreenListener?.();
  }
  _createContainer() {
    const eventName = this._getEventName();
    super._createContainer();
    this._adjustParentForFullscreenChange();
    if (eventName) {
      this._cleanupFullScreenListener?.();
      this._cleanupFullScreenListener = this._renderer.listen("document", eventName, () => {
        this._adjustParentForFullscreenChange();
      });
    }
  }
  _adjustParentForFullscreenChange() {
    if (this._containerElement) {
      const fullscreenElement = this.getFullscreenElement();
      const parent = fullscreenElement || this._document.body;
      parent.appendChild(this._containerElement);
    }
  }
  _getEventName() {
    if (!this._fullScreenEventName) {
      const _document = this._document;
      if (_document.fullscreenEnabled) {
        this._fullScreenEventName = "fullscreenchange";
      } else if (_document.webkitFullscreenEnabled) {
        this._fullScreenEventName = "webkitfullscreenchange";
      } else if (_document.mozFullScreenEnabled) {
        this._fullScreenEventName = "mozfullscreenchange";
      } else if (_document.msFullscreenEnabled) {
        this._fullScreenEventName = "MSFullscreenChange";
      }
    }
    return this._fullScreenEventName;
  }
  /**
   * When the page is put into fullscreen mode, a specific element is specified.
   * Only that element and its children are visible when in fullscreen mode.
   */
  getFullscreenElement() {
    const _document = this._document;
    return _document.fullscreenElement || _document.webkitFullscreenElement || _document.mozFullScreenElement || _document.msFullscreenElement || null;
  }
  static \u0275fac = function FullscreenOverlayContainer_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _FullscreenOverlayContainer)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({
    token: _FullscreenOverlayContainer,
    factory: _FullscreenOverlayContainer.\u0275fac,
    providedIn: "root"
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(FullscreenOverlayContainer, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], () => [], null);
})();

// src/app/models/category.model.ts
var CategoryDto = class _CategoryDto {
  id;
  name;
  alias;
  constructor(data = {}) {
    this.id = data.id || 0;
    this.name = data.name || "";
    this.alias = data.alias || "";
  }
  // Serialization method
  toJson() {
    return {
      id: this.id,
      name: this.name,
      alias: this.alias
    };
  }
  // Deserialization method (static)
  static fromJson(json) {
    return new _CategoryDto({
      id: json.id,
      name: json.name,
      alias: json.alias
    });
  }
};

// src/app/models/value.model.ts
var ValueDto = class _ValueDto {
  id;
  name;
  alias;
  category;
  constructor(data = {}) {
    this.id = data.id || 0;
    this.name = data.name || "";
    this.alias = data.alias || "";
    this.category = data.category || new CategoryDto({ id: 0, name: "", alias: "" });
  }
  toOption() {
    return { value: this.id, label: this.name };
  }
  // Serialization method
  toJson() {
    return {
      id: this.id,
      name: this.name,
      category: this.category
    };
  }
  // Deserialization method (static)
  static fromJson(json) {
    if (!json)
      return new _ValueDto();
    return new _ValueDto({
      id: json.id ?? 0,
      // Use nullish coalescing to provide a default value
      name: json.name || "",
      category: json.category ? CategoryDto.fromJson(json.category) : new CategoryDto()
    });
  }
};

// src/app/models/permits/safe-work.model.ts
var SwHazards = class {
  highTemp = false;
  highPressure = false;
  energized = false;
  storedEnergy = false;
  eyeHazard = false;
  egressAccess = false;
  ergonomicHazard = false;
  fallingObject = false;
  highNoise = false;
  dustParticulate = false;
  combustibleDust = false;
  fireHazard = false;
  hotSurface = false;
  slippery = false;
  ventilationRequired = false;
  lightingRestrictions = false;
  chemicalExposure = false;
  liftingHazard = false;
  handTraps = false;
  heatColdStress = false;
  elevatedSurface = false;
  environmental = false;
  weatherHazards = false;
  weatherHazardDescription = "";
  other = false;
  otherDescription = "";
  constructor(data = {}) {
    Object.assign(this, data);
  }
};
var SwPermits = class {
  lotoRequired = false;
  lotoDescription = "";
  confinedSpace = false;
  confinedSpaceDescription = "";
  hotWork = false;
  hotWorkDescription = "";
  ventingPurging = false;
  ventingPurgingDescription = "";
  jha = true;
  gasTesting = false;
  excavationPermit = false;
  energizedPermit = false;
  other = false;
  otherDescription = "";
  constructor(data = {}) {
    Object.assign(this, data);
  }
};
var SwPpe = class {
  hardhat = true;
  safetyGlasses = true;
  hearingProtection = true;
  boots = true;
  fallProtection = false;
  gfi = false;
  respirator = false;
  dustMask = false;
  gloves = true;
  iceCleats = false;
  acidSuit = false;
  barricade = false;
  faceShield = false;
  gasMonitor = false;
  arcFlashPpe = false;
  weldingJacket = false;
  weldingShield = false;
  weldingGloves = false;
  purgingVentilation = false;
  other = false;
  otherDescription = "";
  dummyCheckbox = "";
  constructor(data = {}) {
    Object.assign(this, data);
  }
};
var SafeWorkDto = class _SafeWorkDto extends BaseDto {
  date;
  time;
  companyPerson;
  location;
  workScope;
  specialInstructions;
  requestedBy;
  hazards;
  permits;
  ppe;
  permitStatus;
  constructor(data = {}) {
    super(data);
    this.date = data.date ?? null;
    this.time = data.time ?? null;
    this.companyPerson = data.companyPerson ?? null;
    this.location = data.location ?? null;
    this.workScope = data.workScope ?? null;
    this.specialInstructions = data.specialInstructions ?? null;
    this.requestedBy = data.requestedBy ?? null;
    this.hazards = data.hazards ?? new SwHazards();
    this.permits = data.permits ?? new SwPermits();
    this.ppe = data.ppe ?? new SwPpe();
    this.permitStatus = data.permitStatus ?? new ValueDto();
  }
  toJson() {
    return __spreadProps(__spreadValues({}, super.toJson()), {
      date: this.date,
      time: this.time,
      companyPerson: this.companyPerson,
      location: this.location,
      workScope: this.workScope,
      specialInstructions: this.specialInstructions,
      requestedBy: this.requestedBy,
      hazards: this.hazards,
      permits: this.permits,
      ppe: this.ppe,
      permitStatus: this.permitStatus?.toJson() ?? null
    });
  }
  static fromJson(json) {
    return new _SafeWorkDto(__spreadProps(__spreadValues({}, super.fromJson(json)), {
      date: json.date || null,
      time: json.time || null,
      companyPerson: json.companyPerson || null,
      location: json.location || null,
      workScope: json.workScope || null,
      specialInstructions: json.specialInstructions || null,
      requestedBy: json.requestedBy || null,
      hazards: json.hazards || new SwHazards(),
      permits: json.permits || new SwPermits(),
      ppe: json.ppe || new SwPpe(),
      permitStatus: ValueDto.fromJson(json.permitStatus)
    }));
  }
  static isValidKey(key) {
    return [
      "id",
      "date",
      "time",
      "companyPerson",
      "location",
      "workScope",
      "specialInstructions",
      "requestedBy",
      "isVerified",
      "name",
      "objectType",
      ...Object.keys(_SafeWorkDto.getHazardFields(null)),
      ...Object.keys(_SafeWorkDto.getPermitFields(null)),
      ...Object.keys(_SafeWorkDto.getPpeFields(null))
    ].includes(key);
  }
  static toFormFields(dto, locationOptions = [], fields = [
    "location",
    "date",
    "time",
    "companyPerson",
    "workScope",
    "specialInstructions",
    "requestedBy",
    ...Object.keys(_SafeWorkDto.getHazardFields(null)),
    ...Object.keys(_SafeWorkDto.getPermitFields(null)),
    ...Object.keys(_SafeWorkDto.getPpeFields(null))
  ]) {
    const ppeFields = _SafeWorkDto.getPpeFields(dto.ppe);
    const permitFields = _SafeWorkDto.getPermitFields(dto.permits);
    const hazardFields = _SafeWorkDto.getHazardFields(dto.hazards);
    const allFields = __spreadValues(__spreadValues(__spreadValues({
      id: { name: "id", label: "ID", type: "text", initialValue: dto.id },
      workArea: {
        name: "workArea",
        label: "Work Area",
        type: "work-area-select",
        initialValue: dto.workArea?.id ?? null,
        context: { viewMode: "map", fallbackText: dto.location }
      },
      date: {
        name: "date",
        label: "Date",
        type: "date",
        validators: [Validators.required],
        initialValue: dto.date ?? (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
      },
      time: {
        name: "time",
        label: "Time",
        type: "time",
        validators: [Validators.required],
        initialValue: dto.time ?? (/* @__PURE__ */ new Date()).toTimeString().slice(0, 5)
      },
      companyPerson: {
        name: "companyPerson",
        label: "Company Person",
        type: "text",
        validators: [Validators.required],
        initialValue: dto.companyPerson
      },
      location: {
        name: "location",
        label: "Location",
        type: "text",
        // type: 'multi-select',
        options: locationOptions,
        validators: [Validators.required],
        initialValue: dto.location
      },
      workScope: {
        name: "workScope",
        label: "Work Scope",
        type: "textarea",
        validators: [Validators.required],
        initialValue: dto.workScope
      },
      specialInstructions: {
        name: "specialInstructions",
        label: "Special Instructions",
        type: "textarea",
        initialValue: dto.specialInstructions
      },
      requestedBy: {
        name: "requestedBy",
        label: "Requested By",
        type: "text",
        validators: [Validators.required],
        initialValue: dto.requestedBy
      },
      isVerified: {
        name: "isVerified",
        label: "Is Verified",
        type: "select",
        options: [
          { value: "true", label: "Yes" },
          { value: "false", label: "No" }
        ],
        initialValue: dto.isVerified?.toString()
      },
      name: { name: "name", label: "Name", type: "text", initialValue: dto.name },
      objectType: { name: "objectType", label: "Object Type", type: "text", initialValue: dto.objectType }
    }, ppeFields), permitFields), hazardFields);
    return fields.map((fieldName) => allFields[fieldName]);
  }
  static toTableColumns(fields = ["date", "time", "companyPerson", "location", "workScope", "requestedBy"]) {
    const allColumns = {
      id: { id: "id", header: "ID", accessorKey: "id" },
      date: { id: "date", header: "Date", accessorKey: "date" },
      time: { id: "time", header: "Time", accessorKey: "time" },
      companyPerson: { id: "companyPerson", header: "Company Person", accessorKey: "companyPerson" },
      location: { id: "location", header: "Location", accessorKey: "location" },
      workScope: { id: "workScope", header: "Work Scope", accessorKey: "workScope" },
      specialInstructions: { id: "specialInstructions", header: "Special Instructions", accessorKey: "specialInstructions" },
      requestedBy: { id: "requestedBy", header: "Requested By", accessorKey: "requestedBy" },
      hazards: {
        id: "hazards",
        header: "Hazards",
        accessorFn: (item) => item.hazards ? "Yes" : "No"
      },
      permits: {
        id: "permits",
        header: "Permits",
        accessorFn: (item) => item.permits ? "Yes" : "No"
      },
      ppe: {
        id: "ppe",
        header: "PPE",
        accessorFn: (item) => item.ppe ? "Yes" : "No"
      },
      name: { id: "name", header: "Name", accessorKey: "name" },
      objectType: { id: "objectType", header: "Object Type", accessorKey: "objectType" },
      isVerified: {
        id: "isVerified",
        header: "Verified",
        accessorFn: (item) => item.isVerified ? "Yes" : "No",
        conditionalStyling: (item, column) => item.isVerified ? { "background-color": "#90EE90" } : { "background-color": "#FFCCCB" }
      },
      permitStatus: {
        id: "permitStatus",
        header: "Status",
        accessorFn: (item) => item.permitStatus?.name || ""
      }
    };
    return fields.map((fieldName) => allColumns[fieldName]);
  }
  static generatePermitFromRequest(request, workArea, categoryProfile) {
    const dto = new _SafeWorkDto({
      date: request.dateOfWorkToBePerformed?.split("T")[0] ?? null,
      time: request.timeOfWorkToBePerformed,
      companyPerson: request.company + "/" + request.requestedBy,
      location: request.location,
      workScope: request.workScope,
      requestedBy: request.requestedBy
    });
    dto.hazards = mergeSwHazards(categoryProfile?.standardHazards, workArea?.constantHazards);
    return dto;
  }
  static formatLabel(key) {
    const result = key.replace(/([A-Z])/g, " $1");
    return result.charAt(0).toUpperCase() + result.slice(1);
  }
  static getHazardOptions(hazards) {
    if (!hazards)
      return [];
    const hazardKeys = Object.keys(hazards);
    return hazardKeys.map((key) => {
      return {
        label: this.formatLabel(key),
        // 'highTemp' -> 'High Temp'
        key,
        value: hazards[key]
        // The boolean value (true/false)
      };
    });
  }
  static getPpeOptions(ppe) {
    if (!ppe)
      return [];
    const hazardKeys = Object.keys(ppe);
    return hazardKeys.map((key) => {
      return {
        label: this.formatLabel(key),
        // 'highTemp' -> 'High Temp'
        key,
        value: ppe[key]
        // The boolean value (true/false)
      };
    });
  }
  static getPermitOptions(permits) {
    if (!permits)
      return [];
    const hazardKeys = Object.keys(permits);
    return hazardKeys.map((key) => {
      return {
        label: this.formatLabel(key),
        // 'highTemp' -> 'High Temp'
        key,
        value: permits[key]
        // The boolean value (true/false)
      };
    });
  }
  static getHazardFields(hazardsDto) {
    const hazards = hazardsDto || new SwHazards();
    const group = { label: "Hazards", orientation: "horizontal" };
    return {
      "hazards.highTemp": { name: "hazards.highTemp", label: "High Temp", type: "checkbox", initialValue: hazards.highTemp, group },
      "hazards.highPressure": { name: "hazards.highPressure", label: "High Pressure", type: "checkbox", initialValue: hazards.highPressure, group },
      "hazards.energized": { name: "hazards.energized", label: "Energized", type: "checkbox", initialValue: hazards.energized, group },
      "hazards.storedEnergy": { name: "hazards.storedEnergy", label: "Stored Energy", type: "checkbox", initialValue: hazards.storedEnergy, group },
      "hazards.eyeHazard": { name: "hazards.eyeHazard", label: "Eye Hazard", type: "checkbox", initialValue: hazards.eyeHazard, group },
      "hazards.egressAccess": { name: "hazards.egressAccess", label: "Egress/Access", type: "checkbox", initialValue: hazards.egressAccess, group },
      "hazards.ergonomicHazard": { name: "hazards.ergonomicHazard", label: "Ergonomic Hazard", type: "checkbox", initialValue: hazards.ergonomicHazard, group },
      "hazards.fallingObject": { name: "hazards.fallingObject", label: "Falling Object", type: "checkbox", initialValue: hazards.fallingObject, group },
      "hazards.highNoise": { name: "hazards.highNoise", label: "High Noise", type: "checkbox", initialValue: hazards.highNoise, group },
      "hazards.dustParticulate": { name: "hazards.dustParticulate", label: "Dust/Particulate", type: "checkbox", initialValue: hazards.dustParticulate, group },
      "hazards.combustibleDust": { name: "hazards.combustibleDust", label: "Combustible Dust", type: "checkbox", initialValue: hazards.combustibleDust, group },
      "hazards.fireHazard": { name: "hazards.fireHazard", label: "Fire Hazard", type: "checkbox", initialValue: hazards.fireHazard, group },
      "hazards.hotSurface": { name: "hazards.hotSurface", label: "Hot Surface", type: "checkbox", initialValue: hazards.hotSurface, group },
      "hazards.slippery": { name: "hazards.slippery", label: "Slippery", type: "checkbox", initialValue: hazards.slippery, group },
      "hazards.ventilationRequired": { name: "hazards.ventilationRequired", label: "Ventilation Required", type: "checkbox", initialValue: hazards.ventilationRequired, group },
      "hazards.lightingRestrictions": { name: "hazards.lightingRestrictions", label: "Lighting Restrictions", type: "checkbox", initialValue: hazards.lightingRestrictions, group },
      "hazards.chemicalExposure": { name: "hazards.chemicalExposure", label: "Chemical Exposure", type: "checkbox", initialValue: hazards.chemicalExposure, group },
      "hazards.liftingHazard": { name: "hazards.liftingHazard", label: "Lifting Hazard", type: "checkbox", initialValue: hazards.liftingHazard, group },
      "hazards.handTraps": { name: "hazards.handTraps", label: "Hand Traps", type: "checkbox", initialValue: hazards.handTraps, group },
      "hazards.heatColdStress": { name: "hazards.heatColdStress", label: "Heat/Cold Stress", type: "checkbox", initialValue: hazards.heatColdStress, group },
      "hazards.elevatedSurface": { name: "hazards.elevatedSurface", label: "Elevated Surface", type: "checkbox", initialValue: hazards.elevatedSurface, group },
      "hazards.environmental": { name: "hazards.environmental", label: "Environmental", type: "checkbox", initialValue: hazards.environmental, group },
      "hazards.other": { name: "hazards.other", label: "Other", type: "checkbox", initialValue: hazards.other, group },
      "hazards.otherDescription": { name: "hazards.otherDescription", label: "Other Description", type: "text", initialValue: hazards.otherDescription, group }
    };
  }
  static getPermitFields(permitsDto) {
    const permits = permitsDto || new SwPermits();
    const group = { label: "Permits", orientation: "horizontal" };
    return {
      "permits.lotoRequired": { name: "permits.lotoRequired", label: "LOTO Required", type: "checkbox", initialValue: permits.lotoRequired, group },
      "permits.lotoDescription": { name: "permits.lotoDescription", label: "LOTO Description", type: "text", initialValue: permits.lotoDescription, group },
      "permits.confinedSpace": { name: "permits.confinedSpace", label: "Confined Space", type: "checkbox", initialValue: permits.confinedSpace, group },
      "permits.confinedSpaceDescription": { name: "permits.confinedSpaceDescription", label: "Confined Space Description", type: "text", initialValue: permits.confinedSpaceDescription, group },
      "permits.hotWork": { name: "permits.hotWork", label: "Hot Work", type: "checkbox", initialValue: permits.hotWork, group },
      "permits.hotWorkDescription": { name: "permits.hotWorkDescription", label: "Hot Work Description", type: "text", initialValue: permits.hotWorkDescription, group },
      "permits.ventingPurging": { name: "permits.ventingPurging", label: "Venting/Purging", type: "checkbox", initialValue: permits.ventingPurging, group },
      "permits.ventingPurgingDescription": { name: "permits.ventingPurgingDescription", label: "Venting/Purging Description", type: "text", initialValue: permits.ventingPurgingDescription, group },
      "permits.jha": { name: "permits.jha", label: "JHA", type: "checkbox", initialValue: permits.jha, group },
      "permits.gasTesting": { name: "permits.gasTesting", label: "Gas Testing", type: "checkbox", initialValue: permits.gasTesting, group },
      "permits.excavationPermit": { name: "permits.excavationPermit", label: "Excavation Permit", type: "checkbox", initialValue: permits.excavationPermit, group },
      "permits.energizedPermit": { name: "permits.energizedPermit", label: "Energized Permit", type: "checkbox", initialValue: permits.energizedPermit, group },
      "permits.other": { name: "permits.other", label: "Other", type: "checkbox", initialValue: permits.other, group },
      "permits.otherDescription": { name: "permits.otherDescription", label: "Other Description", type: "text", initialValue: permits.otherDescription, group }
    };
  }
  static getPpeFields(ppeDto) {
    const ppe = ppeDto || new SwPpe();
    const group = { label: "PPE", orientation: "horizontal" };
    return {
      "ppe.hardhat": { name: "ppe.hardhat", label: "Hardhat", type: "checkbox", initialValue: ppe.hardhat, group },
      "ppe.safetyGlasses": { name: "ppe.safetyGlasses", label: "Safety Glasses", type: "checkbox", initialValue: ppe.safetyGlasses, group },
      "ppe.hearingProtection": { name: "ppe.hearingProtection", label: "Hearing Protection", type: "checkbox", initialValue: ppe.hearingProtection, group },
      "ppe.boots": { name: "ppe.boots", label: "Boots", type: "checkbox", initialValue: ppe.boots, group },
      "ppe.fallProtection": { name: "ppe.fallProtection", label: "Fall Protection", type: "checkbox", initialValue: ppe.fallProtection, group },
      "ppe.gfi": { name: "ppe.gfi", label: "GFI", type: "checkbox", initialValue: ppe.gfi, group },
      "ppe.respirator": { name: "ppe.respirator", label: "Respirator", type: "checkbox", initialValue: ppe.respirator, group },
      "ppe.dustMask": { name: "ppe.dustMask", label: "Dust Mask", type: "checkbox", initialValue: ppe.dustMask, group },
      "ppe.gloves": { name: "ppe.gloves", label: "Gloves", type: "checkbox", initialValue: ppe.gloves, group },
      "ppe.iceCleats": { name: "ppe.iceCleats", label: "Ice Cleats", type: "checkbox", initialValue: ppe.iceCleats, group },
      "ppe.acidSuit": { name: "ppe.acidSuit", label: "Acid Suit", type: "checkbox", initialValue: ppe.acidSuit, group },
      "ppe.barricade": { name: "ppe.barricade", label: "Barricade", type: "checkbox", initialValue: ppe.barricade, group },
      "ppe.faceShield": { name: "ppe.faceShield", label: "Face Shield", type: "checkbox", initialValue: ppe.faceShield, group },
      "ppe.gasMonitor": { name: "ppe.gasMonitor", label: "Gas Monitor", type: "checkbox", initialValue: ppe.gasMonitor, group },
      "ppe.arcFlashPpe": { name: "ppe.arcFlashPpe", label: "Arc Flash PPE", type: "checkbox", initialValue: ppe.arcFlashPpe, group },
      "ppe.weldingJacket": { name: "ppe.weldingJacket", label: "Welding Jacket", type: "checkbox", initialValue: ppe.weldingJacket, group },
      "ppe.weldingShield": { name: "ppe.weldingShield", label: "Welding Shield", type: "checkbox", initialValue: ppe.weldingShield, group },
      "ppe.weldingGloves": { name: "ppe.weldingGloves", label: "Welding Gloves", type: "checkbox", initialValue: ppe.weldingGloves, group },
      "ppe.purgingVentilation": { name: "ppe.purgingVentilation", label: "Purging Ventilation", type: "checkbox", initialValue: ppe.purgingVentilation, group },
      "ppe.other": { name: "ppe.other", label: "Other", type: "checkbox", initialValue: ppe.other, group },
      "ppe.otherDescription": { name: "ppe.otherDescription", label: "Other Description", type: "text", initialValue: ppe.otherDescription, group }
    };
  }
};

// src/app/models/permits/confined-space.model.ts
var ConfinedSpaceHazards = class {
  oxygenDeficiency = false;
  flammableGas = false;
  combustibleDust = false;
  toxicGas = false;
  rotatingEquipment = false;
  electricalShock = false;
  entrapment = false;
  engulfment = false;
  heatStress = false;
  other = false;
  otherDescription = "";
  constructor(data = {}) {
    Object.assign(this, data);
  }
};
var ConfinedSpacePpe = class {
  faceShield = false;
  fcfi = false;
  lovVoltageTools = false;
  explosionProofTools = false;
  nonSparkingTools = false;
  fallProtection = false;
  retrievalSystem = false;
  lifeline = false;
  personalAtmosphericMeter = true;
  tripod = false;
  other = false;
  otherDescription = "";
  constructor(data = {}) {
    Object.assign(this, data);
  }
};
var ConfinedSpacePrecautions = class {
  ventilation = false;
  blankFlanged = false;
  doubleBlockAndBleed = false;
  barriers = false;
  other = false;
  otherDescription = "";
  lockOutTagOut = "";
  hotWorkPermit = "";
  constructor(data = {}) {
    Object.assign(this, data);
  }
};
var ConfinedSpaceDto = class _ConfinedSpaceDto extends BaseDto {
  date;
  time;
  space;
  workScope;
  issuedTo;
  duration;
  lotoNum;
  hotWorkNum;
  ventilation;
  blankFlanged;
  meterModel;
  meterNum;
  calibrated;
  oxygen;
  lel;
  hydrogenSulfide;
  carbonMonoxide;
  ammonia;
  timeOfSample;
  testerInitials;
  hazards;
  ppe;
  precautions;
  permitStatus;
  constructor(data = {}) {
    super(data);
    this.date = data.date ?? null;
    this.time = data.time ?? null;
    this.space = data.space ?? null;
    this.workScope = data.workScope ?? null;
    this.issuedTo = data.issuedTo ?? null;
    this.duration = data.duration ?? "12 hours";
    this.lotoNum = data.lotoNum ?? null;
    this.hotWorkNum = data.hotWorkNum ?? null;
    this.ventilation = data.ventilation ?? false;
    this.blankFlanged = data.blankFlanged ?? false;
    this.meterModel = data.meterModel ?? "RKI GX-3R PRO";
    this.meterNum = data.meterNum ?? null;
    this.calibrated = data.calibrated ?? true;
    this.oxygen = data?.oxygen ?? null;
    this.lel = data?.lel ?? null;
    this.hydrogenSulfide = data?.hydrogenSulfide ?? null;
    this.carbonMonoxide = data?.carbonMonoxide ?? null;
    this.ammonia = data?.ammonia ?? null;
    this.timeOfSample = data?.timeOfSample ?? null;
    this.testerInitials = data?.testerInitials ?? null;
    this.hazards = data.hazards ?? new ConfinedSpaceHazards();
    this.ppe = data.ppe ?? new ConfinedSpacePpe();
    this.precautions = data.precautions ?? new ConfinedSpacePrecautions();
    this.permitStatus = data.permitStatus ?? new ValueDto();
  }
  toJson() {
    return __spreadProps(__spreadValues({}, super.toJson()), {
      date: this.date,
      time: this.time,
      space: this.space,
      workScope: this.workScope,
      issuedTo: this.issuedTo,
      duration: this.duration,
      lotoNum: this.lotoNum,
      hotWorkNum: this.hotWorkNum,
      ventilation: this.ventilation,
      blankFlanged: this.blankFlanged,
      meterModel: this.meterModel,
      meterNum: this.meterNum,
      calibrated: this.calibrated,
      oxygen: this.oxygen,
      lel: this.lel,
      hydrogenSulfide: this.hydrogenSulfide,
      carbonMonoxide: this.carbonMonoxide,
      ammonia: this.ammonia,
      hazards: this.hazards,
      ppe: this.ppe,
      precautions: this.precautions,
      permitStatus: this.permitStatus?.toJson() ?? null
    });
  }
  static fromJson(json) {
    return new _ConfinedSpaceDto(__spreadProps(__spreadValues({}, super.fromJson(json)), {
      date: json.date || null,
      time: json.time || null,
      space: json.space || null,
      workScope: json.workScope || null,
      issuedTo: json.issuedTo || null,
      duration: json.duration || null,
      lotoNum: json.lotoNum || null,
      hotWorkNum: json.hotWorkNum || null,
      ventilation: json.ventilation || false,
      blankFlanged: json.blankFlanged || false,
      meterModel: json.meterModel || "RKI GX-3R PRO",
      meterNum: json.meterNum || null,
      calibrated: json.calibrated || false,
      oxygen: json.oxygen || null,
      lel: json.lel || null,
      hydrogenSulfide: json.hydrogenSulfide || null,
      carbonMonoxide: json.carbonMonoxide || null,
      ammonia: json.ammonia || null,
      hazards: json.hazards || new ConfinedSpaceHazards(),
      ppe: json.ppe || new ConfinedSpacePpe(),
      precautions: json.precautions || new ConfinedSpacePrecautions(),
      permitStatus: ValueDto.fromJson(json.permitStatus)
    }));
  }
  static isValidKey(key) {
    return [
      "id",
      "date",
      "time",
      "space",
      "workScope",
      "issuedTo",
      "duration",
      "lotoNum",
      "hotWorkNum",
      "ventilation",
      "blankFlanged",
      "meterModel",
      "meterNum",
      "calibrated",
      "hazards",
      "isVerified",
      "name",
      "objectType",
      "ppe",
      "precautions"
    ].includes(key);
  }
  static toFormFields(dto, spaceOptions = [], fields = [
    "space",
    "date",
    "time",
    "workScope",
    "issuedTo",
    "duration",
    "meterModel",
    "meterNum",
    "calibrated",
    ...Object.keys(_ConfinedSpaceDto.getHazardFields(null)),
    ...Object.keys(_ConfinedSpaceDto.getPpeFields(null)),
    ...Object.keys(_ConfinedSpaceDto.getPrecautionFields(null))
  ]) {
    const hazardFields = _ConfinedSpaceDto.getHazardFields(dto.hazards);
    const ppeFields = _ConfinedSpaceDto.getPpeFields(dto.ppe);
    const precautionFields = _ConfinedSpaceDto.getPrecautionFields(dto.precautions);
    const allFields = __spreadValues(__spreadValues(__spreadValues({
      id: { name: "id", label: "ID", type: "text", initialValue: dto.id },
      workArea: {
        name: "workArea",
        label: "Work Area",
        type: "work-area-select",
        initialValue: dto.workArea?.id ?? null,
        context: { viewMode: "map", fallbackText: dto.space }
      },
      date: {
        name: "date",
        label: "Date",
        type: "date",
        validators: [Validators.required],
        initialValue: dto.date ?? (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
      },
      time: {
        name: "time",
        label: "Time",
        type: "time",
        validators: [Validators.required],
        initialValue: dto.time ?? (/* @__PURE__ */ new Date()).toTimeString().slice(0, 5)
      },
      space: {
        name: "space",
        label: "Confined Space",
        type: "text",
        options: spaceOptions,
        validators: [Validators.required],
        initialValue: dto.space
      },
      workScope: {
        name: "workScope",
        label: "Work Scope",
        type: "textarea",
        validators: [Validators.required],
        initialValue: dto.workScope
      },
      issuedTo: {
        name: "issuedTo",
        label: "Issued To",
        type: "text",
        validators: [Validators.required],
        initialValue: dto.issuedTo
      },
      duration: {
        name: "duration",
        label: "Duration",
        type: "text",
        validators: [Validators.required],
        initialValue: dto.duration
      },
      meterModel: {
        name: "meterModel",
        label: "Meter Model",
        type: "text",
        initialValue: dto.meterModel
      },
      meterNum: {
        name: "meterNum",
        label: "Meter Number",
        type: "text",
        initialValue: dto.meterNum
      },
      calibrated: {
        name: "calibrated",
        label: "Calibrated",
        type: "checkbox",
        initialValue: dto.calibrated
      },
      oxygen: { name: "oxygen", label: "Oxygen", type: "text", initialValue: dto.oxygen },
      lel: { name: "lel", label: "LEL", type: "text", initialValue: dto.lel },
      hydrogenSulfide: { name: "hydrogenSulfide", label: "H2S", type: "text", initialValue: dto.hydrogenSulfide },
      carbonMonoxide: { name: "carbonMonoxide", label: "CO", type: "text", initialValue: dto.carbonMonoxide },
      ammonia: { name: "ammonia", label: "Ammonia", type: "text", initialValue: dto.ammonia },
      timeOfSample: { name: "timeOfSample", label: "Time of Sample", type: "time", initialValue: dto.timeOfSample },
      testerInitials: { name: "testerInitials", label: "Tester Initials", type: "text", initialValue: dto.testerInitials }
    }, hazardFields), ppeFields), precautionFields);
    return fields.map((fieldName) => allFields[fieldName]);
  }
  static toTableColumns(fields = ["date", "time", "space", "workScope", "issuedTo", "duration"]) {
    const allColumns = {
      id: { id: "id", header: "ID", accessorKey: "id" },
      date: { id: "date", header: "Date", accessorKey: "date" },
      time: { id: "time", header: "Time", accessorKey: "time" },
      space: { id: "space", header: "Confined Space", accessorKey: "space" },
      workScope: { id: "workScope", header: "Work Scope", accessorKey: "workScope" },
      issuedTo: { id: "issuedTo", header: "Issued To", accessorKey: "issuedTo" },
      duration: { id: "duration", header: "Duration", accessorKey: "duration" },
      lotoNum: { id: "lotoNum", header: "LOTO Number", accessorKey: "lotoNum" },
      hotWorkNum: { id: "hotWorkNum", header: "Hot Work Number", accessorKey: "hotWorkNum" },
      ventilation: {
        id: "ventilation",
        header: "Ventilation",
        accessorFn: (item) => item.ventilation ? "Yes" : "No"
      },
      blankFlanged: {
        id: "blankFlanged",
        header: "Blank Flanged",
        accessorFn: (item) => item.blankFlanged ? "Yes" : "No"
      },
      meterModel: { id: "meterModel", header: "Meter Model", accessorKey: "meterModel" },
      meterNum: { id: "meterNum", header: "Meter Number", accessorKey: "meterNum" },
      calibrated: {
        id: "calibrated",
        header: "Calibrated",
        accessorFn: (item) => item.calibrated ? "Yes" : "No"
      },
      oxygen: { id: "oxygen", header: "Oxygen", accessorKey: "oxygen" },
      lel: { id: "lel", header: "LEL", accessorKey: "lel" },
      hydrogenSulfide: { id: "hydrogenSulfide", header: "H2S", accessorKey: "hydrogenSulfide" },
      carbonMonoxide: { id: "carbonMonoxide", header: "CO", accessorKey: "carbonMonoxide" },
      ammonia: { id: "ammonia", header: "Ammonia", accessorKey: "ammonia" },
      timeOfSample: { id: "timeOfSample", header: "Time of Sample", accessorKey: "timeOfSample" },
      testerInitials: { id: "testerInitials", header: "Tester Initials", accessorKey: "testerInitials" },
      hazards: {
        id: "hazards",
        header: "Hazards",
        accessorFn: (item) => {
          if (!item.hazards)
            return "None";
          const activeHazards = Object.entries(item.hazards).filter(([_, value]) => value).map(([key, _]) => key.replace(/([A-Z])/g, " $1").trim());
          return activeHazards.length > 0 ? activeHazards.join(", ") : "None";
        }
      },
      ppe: {
        id: "ppe",
        header: "PPE",
        accessorFn: (item) => {
          if (!item.ppe)
            return "None";
          const activePpe = Object.entries(item.ppe).filter(([_, value]) => value).map(([key, _]) => _ConfinedSpaceDto.formatLabel(key));
          return activePpe.length > 0 ? activePpe.join(", ") : "None";
        }
      },
      precautions: {
        id: "precautions",
        header: "Precautions",
        accessorFn: (item) => {
          if (!item.precautions)
            return "None";
          const activePrecautions = Object.entries(item.precautions).filter(([_, value]) => value).map(([key, _]) => _ConfinedSpaceDto.formatLabel(key));
          return activePrecautions.length > 0 ? activePrecautions.join(", ") : "None";
        }
      },
      isVerified: {
        id: "isVerified",
        header: "Verified",
        accessorFn: (item) => item.isVerified ? "Yes" : "No"
      },
      name: { id: "name", header: "Name", accessorKey: "name" },
      objectType: { id: "objectType", header: "Object Type", accessorKey: "objectType" },
      permitStatus: {
        id: "permitStatus",
        header: "Status",
        accessorFn: (item) => item.permitStatus?.name || ""
      }
    };
    return fields.map((fieldName) => allColumns[fieldName]);
  }
  static generatePermitFromRequest(request, workArea, categoryProfile) {
    const dto = new _ConfinedSpaceDto({
      date: request.dateOfWorkToBePerformed?.split("T")[0],
      issuedTo: request.requestedBy,
      space: request.space,
      workScope: request.workScope
    });
    dto.hazards = mergeConfinedSpaceHazards(categoryProfile?.standardConfinedSpaceHazards, workArea?.constantConfinedSpaceHazards);
    return dto;
  }
  static formatLabel(key) {
    const result = key.replace(/([A-Z])/g, " $1");
    return result.charAt(0).toUpperCase() + result.slice(1);
  }
  static getHazardOptions(hazards) {
    if (!hazards)
      return [];
    const hazardKeys = Object.keys(hazards);
    return hazardKeys.map((key) => {
      return {
        label: this.formatLabel(key),
        // 'highTemp' -> 'High Temp'
        key,
        value: hazards[key]
        // The boolean value (true/false)
      };
    });
  }
  static getPpeOptions(ppe) {
    if (!ppe)
      return [];
    const ppeKeys = Object.keys(ppe);
    return ppeKeys.map((key) => {
      return {
        label: this.formatLabel(key),
        // 'safetyGlasses' -> 'Safety Glasses'
        key,
        value: ppe[key]
        // The boolean value (true/false)
      };
    });
  }
  static getPrecautionOptions(precautions) {
    if (!precautions)
      return [];
    const precautionKeys = Object.keys(precautions);
    return precautionKeys.map((key) => {
      return {
        label: this.formatLabel(key),
        key,
        value: precautions[key]
      };
    });
  }
  static getHazardFields(hazardsDto) {
    const hazards = hazardsDto || new ConfinedSpaceHazards();
    const group = { label: "Hazards", orientation: "horizontal" };
    return {
      "hazards.oxygenDeficiency": {
        name: "hazards.oxygenDeficiency",
        label: "Oxygen Deficiency",
        type: "checkbox",
        initialValue: hazards.oxygenDeficiency,
        group
      },
      "hazards.flammableGas": { name: "hazards.flammableGas", label: "Flammable Gas", type: "checkbox", initialValue: hazards.flammableGas, group },
      "hazards.combustibleDust": { name: "hazards.combustibleDust", label: "Combustible Dust", type: "checkbox", initialValue: hazards.combustibleDust, group },
      "hazards.toxicGas": { name: "hazards.toxicGas", label: "Toxic Gas", type: "checkbox", initialValue: hazards.toxicGas, group },
      "hazards.rotatingEquipment": { name: "hazards.rotatingEquipment", label: "Rotating Equipment", type: "checkbox", initialValue: hazards.rotatingEquipment, group },
      "hazards.electricalShock": { name: "hazards.electricalShock", label: "Electrical Shock", type: "checkbox", initialValue: hazards.electricalShock, group },
      "hazards.entrapment": { name: "hazards.entrapment", label: "Entrapment", type: "checkbox", initialValue: hazards.entrapment, group },
      "hazards.engulfment": { name: "hazards.engulfment", label: "Engulfment", type: "checkbox", initialValue: hazards.engulfment, group },
      "hazards.heatStress": { name: "hazards.heatStress", label: "Heat Stress", type: "checkbox", initialValue: hazards.heatStress, group },
      "hazards.other": { name: "hazards.other", label: "Other", type: "checkbox", initialValue: hazards.other, group },
      "hazards.otherDescription": { name: "hazards.otherDescription", label: "Other Description", type: "text", initialValue: hazards.otherDescription, group }
    };
  }
  static getPpeFields(ppeDto) {
    const ppe = ppeDto || new ConfinedSpacePpe();
    const group = { label: "PPE", orientation: "horizontal" };
    return {
      "ppe.faceShield": { name: "ppe.faceShield", label: "Face Shield", type: "checkbox", initialValue: ppe.faceShield, group },
      "ppe.fcfi": { name: "ppe.fcfi", label: "FCFI", type: "checkbox", initialValue: ppe.fcfi, group },
      "ppe.lovVoltageTools": { name: "ppe.lovVoltageTools", label: "Low Voltage Tools", type: "checkbox", initialValue: ppe.lovVoltageTools, group },
      "ppe.explosionProofTools": { name: "ppe.explosionProofTools", label: "Explosion Proof Tools", type: "checkbox", initialValue: ppe.explosionProofTools, group },
      "ppe.nonSparkingTools": { name: "ppe.nonSparkingTools", label: "Non-Sparking Tools", type: "checkbox", initialValue: ppe.nonSparkingTools, group },
      "ppe.fallProtection": { name: "ppe.fallProtection", label: "Fall Protection", type: "checkbox", initialValue: ppe.fallProtection, group },
      "ppe.retrievalSystem": { name: "ppe.retrievalSystem", label: "Retrieval System", type: "checkbox", initialValue: ppe.retrievalSystem, group },
      "ppe.lifeline": { name: "ppe.lifeline", label: "Lifeline", type: "checkbox", initialValue: ppe.lifeline, group },
      "ppe.personalAtmosphericMeter": { name: "ppe.personalAtmosphericMeter", label: "Personal Atmospheric Meter", type: "checkbox", initialValue: ppe.personalAtmosphericMeter, group },
      "ppe.tripod": { name: "ppe.tripod", label: "Tripod", type: "checkbox", initialValue: ppe.tripod, group },
      "ppe.other": { name: "ppe.other", label: "Other", type: "checkbox", initialValue: ppe.other, group },
      "ppe.otherDescription": { name: "ppe.otherDescription", label: "Other Description", type: "text", initialValue: ppe.otherDescription, group }
    };
  }
  static getPrecautionFields(precautionsDto) {
    const precautions = precautionsDto || new ConfinedSpacePrecautions();
    const group = { label: "Precautions", orientation: "horizontal" };
    return {
      "precautions.ventilation": { name: "precautions.ventilation", label: "Ventilation", type: "checkbox", initialValue: precautions.ventilation, group },
      "precautions.blankFlanged": { name: "precautions.blankFlanged", label: "Blank/Flanged", type: "checkbox", initialValue: precautions.blankFlanged, group },
      "precautions.doubleBlockAndBleed": { name: "precautions.doubleBlockAndBleed", label: "Double Block and Bleed", type: "checkbox", initialValue: precautions.doubleBlockAndBleed, group },
      "precautions.barriers": { name: "precautions.barriers", label: "Barriers", type: "checkbox", initialValue: precautions.barriers, group },
      "precautions.other": { name: "precautions.other", label: "Other", type: "checkbox", initialValue: precautions.other, group },
      "precautions.otherDescription": { name: "precautions.otherDescription", label: "Other Description", type: "text", initialValue: precautions.otherDescription, group },
      "precautions.lockOutTagOut": { name: "precautions.lockOutTagOut", label: "Lock Out/Tag Out", type: "text", initialValue: precautions.lockOutTagOut, group },
      "precautions.hotWorkPermit": { name: "precautions.hotWorkPermit", label: "Hot Work Permit", type: "text", initialValue: precautions.hotWorkPermit, group }
    };
  }
};

// src/app/utils/hazard-merge.util.ts
function mergeSwHazards(...sources) {
  const result = new SwHazards();
  for (const source of sources) {
    if (!source)
      continue;
    for (const key of Object.keys(result)) {
      const val = source[key];
      if (typeof val === "boolean" && val === true) {
        result[key] = true;
      } else if (typeof val === "string" && val.trim()) {
        const existing = result[key];
        result[key] = existing ? existing + "; " + val.trim() : val.trim();
      }
    }
  }
  return result;
}
function mergeHotWorkMeasures(...sources) {
  const result = new HotWorkMeasures();
  for (const source of sources) {
    if (!source)
      continue;
    for (const key of Object.keys(result)) {
      const val = source[key];
      if (typeof val === "boolean" && val === true) {
        result[key] = true;
      }
    }
  }
  return result;
}
function mergeConfinedSpaceHazards(...sources) {
  const result = new ConfinedSpaceHazards();
  for (const source of sources) {
    if (!source)
      continue;
    for (const key of Object.keys(result)) {
      const val = source[key];
      if (typeof val === "boolean" && val === true) {
        result[key] = true;
      } else if (typeof val === "string" && val.trim()) {
        const existing = result[key];
        result[key] = existing ? existing + "; " + val.trim() : val.trim();
      }
    }
  }
  return result;
}

// src/app/models/permits/hot-work.model.ts
var HotWorkMeasures = class {
  areaIsClean = true;
  flammablesAreSecured = true;
  noCombustibleDustOrDebrisPresent = true;
  radiativeHeatPreventiveMeasuresAreTaken = true;
  vesselsArePurged = true;
  openingsAreCovered = true;
  ductVentilationIsSecured = true;
  lockOutIsCompleted = true;
  communicationIsEstablished = true;
  fireWatchIsAwareOfDuties = true;
  fireExtinguisherPresent = true;
  fireProtectionIsInService = true;
  constructor(data = {}) {
    Object.assign(this, data);
  }
};
var HotWorkDto = class _HotWorkDto extends BaseDto {
  date;
  location;
  workScope;
  foreman;
  fireWatch;
  meterModel;
  meterNum;
  specialInstructions;
  measures;
  isAirMonitoringRegisteredOnConfinedSpace;
  timeOfInitialTest;
  isFireWatchRequired;
  initialTestResult;
  permitStatus;
  constructor(data = {}) {
    super(data);
    this.date = data.date ?? null;
    this.location = data.location ?? null;
    this.workScope = data.workScope ?? null;
    this.foreman = data.foreman ?? null;
    this.fireWatch = data.fireWatch ?? null;
    this.meterModel = data.meterModel ?? "RKI GX-3R PRO";
    this.meterNum = data.meterNum ?? null;
    this.specialInstructions = data.specialInstructions ?? null;
    this.measures = data.measures ?? new HotWorkMeasures();
    this.isAirMonitoringRegisteredOnConfinedSpace = data.isAirMonitoringRegisteredOnConfinedSpace ?? false;
    this.timeOfInitialTest = data.timeOfInitialTest ?? "";
    this.isFireWatchRequired = data.isFireWatchRequired ?? true;
    this.initialTestResult = data.initialTestResult ?? "";
    this.permitStatus = data.permitStatus ?? new ValueDto();
  }
  toJson() {
    return __spreadProps(__spreadValues({}, super.toJson()), {
      date: this.date,
      location: this.location,
      workScope: this.workScope,
      foreman: this.foreman,
      fireWatch: this.fireWatch,
      meterModel: this.meterModel,
      meterNum: this.meterNum,
      specialInstructions: this.specialInstructions,
      measures: this.measures,
      permitStatus: this.permitStatus?.toJson() ?? null
    });
  }
  static fromJson(json) {
    return new _HotWorkDto(__spreadProps(__spreadValues({}, super.fromJson(json)), {
      date: json.date || null,
      location: json.location || null,
      workScope: json.workScope || null,
      foreman: json.foreman || null,
      fireWatch: json.fireWatch || null,
      meterModel: json.meterModel || "RKI GX-3R PRO",
      meterNum: json.meterNum || null,
      specialInstructions: json.specialInstructions || null,
      measures: json.measures || new HotWorkMeasures(),
      permitStatus: ValueDto.fromJson(json.permitStatus)
    }));
  }
  static isValidKey(key) {
    return [
      "id",
      "date",
      "location",
      "workScope",
      "foreman",
      "fireWatch",
      "meterModel",
      "meterNum",
      "specialInstructions",
      "measures",
      "isVerified",
      "name",
      "objectType"
    ].includes(key);
  }
  static toFormFields(dto, locationOptions = [], fields = [
    "location",
    "date",
    "workScope",
    "foreman",
    "fireWatch",
    "meterModel",
    "meterNum",
    "specialInstructions",
    ...Object.keys(_HotWorkDto.getMeasureFields(null))
  ]) {
    const measureFields = _HotWorkDto.getMeasureFields(dto.measures);
    const allFields = __spreadValues({
      id: { name: "id", label: "ID", type: "text", initialValue: dto.id },
      workArea: {
        name: "workArea",
        label: "Work Area",
        type: "work-area-select",
        initialValue: dto.workArea?.id ?? null,
        context: { viewMode: "map", fallbackText: dto.location }
      },
      date: {
        name: "date",
        label: "Date",
        type: "date",
        validators: [Validators.required],
        initialValue: dto.date ?? (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
      },
      location: {
        name: "location",
        label: "Location",
        type: "text",
        options: locationOptions,
        validators: [Validators.required],
        initialValue: dto.location
      },
      workScope: {
        name: "workScope",
        label: "Work Scope",
        type: "textarea",
        validators: [Validators.required],
        initialValue: dto.workScope
      },
      foreman: {
        name: "foreman",
        label: "Foreman",
        type: "text",
        validators: [Validators.required],
        initialValue: dto.foreman
      },
      fireWatch: {
        name: "fireWatch",
        label: "Fire Watch",
        type: "text",
        validators: [Validators.required],
        initialValue: dto.fireWatch
      },
      meterModel: {
        name: "meterModel",
        label: "Meter Model",
        type: "text",
        initialValue: dto.meterModel
      },
      meterNum: {
        name: "meterNum",
        label: "Meter Number",
        type: "text",
        initialValue: dto.meterNum
      },
      specialInstructions: {
        name: "specialInstructions",
        label: "Special Instructions",
        type: "textarea",
        initialValue: dto.specialInstructions
      },
      name: { name: "name", label: "Name", type: "text", initialValue: dto.name },
      objectType: { name: "objectType", label: "Object Type", type: "text", initialValue: dto.objectType },
      isAirMonitoringRegisteredOnConfinedSpace: {
        name: "isAirMonitoringRegisteredOnConfinedSpace",
        label: "Air Monitoring Registered on Confined Space",
        type: "select",
        options: [
          { value: "true", label: "Yes" },
          { value: "false", label: "No" }
        ],
        initialValue: dto.isAirMonitoringRegisteredOnConfinedSpace?.toString()
      },
      isFireWatchRequired: {
        name: "isFireWatchRequired",
        label: "Fire Watch Required",
        type: "select",
        options: [
          { value: "true", label: "Yes" },
          { value: "false", label: "No" }
        ],
        initialValue: dto.isFireWatchRequired?.toString()
      },
      timeOfInitialTest: {
        name: "timeOfInitialTest",
        label: "Time of Initial Test",
        type: "time",
        initialValue: dto.timeOfInitialTest
      },
      initialTestResult: {
        name: "initialTestResult",
        label: "Initial Test Result",
        type: "text",
        initialValue: dto.initialTestResult
      }
    }, measureFields);
    return fields.map((fieldName) => allFields[fieldName]);
  }
  static toTableColumns(fields = ["date", "location", "workScope", "foreman", "fireWatch"]) {
    const allColumns = {
      id: { id: "id", header: "ID", accessorKey: "id" },
      date: { id: "date", header: "Date", accessorKey: "date" },
      location: { id: "location", header: "Location", accessorKey: "location" },
      workScope: { id: "workScope", header: "Work Scope", accessorKey: "workScope" },
      foreman: { id: "foreman", header: "Foreman", accessorKey: "foreman" },
      fireWatch: { id: "fireWatch", header: "Fire Watch", accessorKey: "fireWatch" },
      meterModel: { id: "meterModel", header: "Meter Model", accessorKey: "meterModel" },
      meterNum: { id: "meterNum", header: "Meter Number", accessorKey: "meterNum" },
      specialInstructions: { id: "specialInstructions", header: "Special Instructions", accessorKey: "specialInstructions" },
      measures: {
        id: "measures",
        header: "Safety Measures",
        accessorFn: (item) => item.measures ? "Yes" : "No"
      },
      name: { id: "name", header: "Name", accessorKey: "name" },
      objectType: { id: "objectType", header: "Object Type", accessorKey: "objectType" },
      isVerified: {
        id: "isVerified",
        header: "Verified",
        accessorFn: (item) => item.isVerified ? "Yes" : "No",
        conditionalStyling: (item, column) => item.isVerified ? { "background-color": "#90EE90" } : { "background-color": "#FFCCCB" }
      },
      isAirMonitoringRegisteredOnConfinedSpace: {
        id: "isAirMonitoringRegisteredOnConfinedSpace",
        header: "Air Mon. on CS",
        accessorFn: (item) => item.isAirMonitoringRegisteredOnConfinedSpace ? "Yes" : "No"
      },
      isFireWatchRequired: {
        id: "isFireWatchRequired",
        header: "Fire Watch Req.",
        accessorFn: (item) => item.isFireWatchRequired ? "Yes" : "No"
      },
      timeOfInitialTest: {
        id: "timeOfInitialTest",
        header: "Initial Test Time",
        accessorKey: "timeOfInitialTest"
      },
      initialTestResult: {
        id: "initialTestResult",
        header: "Initial Test Result",
        accessorKey: "initialTestResult"
      },
      permitStatus: {
        id: "permitStatus",
        header: "Status",
        accessorFn: (item) => item.permitStatus?.name || ""
      }
    };
    return fields.map((fieldName) => allColumns[fieldName]);
  }
  static generatePermitFromRequest(request, workArea, categoryProfile) {
    const dto = new _HotWorkDto({
      date: request.dateOfWorkToBePerformed?.split("T")[0],
      foreman: request.requestedBy,
      location: request.location,
      workScope: request.workScope,
      fireWatch: request.fireWatch
    });
    dto.measures = mergeHotWorkMeasures(categoryProfile?.standardHotWorkMeasures, workArea?.constantHotWorkMeasures);
    return dto;
  }
  static formatLabel(key) {
    const result = key.replace(/([A-Z])/g, " $1");
    return result.charAt(0).toUpperCase() + result.slice(1);
  }
  static getHwMeasuresOptions(measures) {
    if (!measures)
      return [];
    const hazardKeys = Object.keys(measures);
    return hazardKeys.map((key) => {
      return {
        label: this.formatLabel(key),
        // 'highTemp' -> 'High Temp'
        key,
        value: measures[key]
        // The boolean value (true/false)
      };
    });
  }
  static getMeasureFields(measuresDto) {
    const measures = measuresDto || new HotWorkMeasures();
    const group = { label: "Safety Measures", orientation: "vertical" };
    return {
      "measures.areaIsClean": { name: "measures.areaIsClean", label: "Area is Clean", type: "checkbox", initialValue: measures.areaIsClean, group },
      "measures.flammablesAreSecured": { name: "measures.flammablesAreSecured", label: "Flammables are Secured", type: "checkbox", initialValue: measures.flammablesAreSecured, group },
      "measures.noCombustibleDustOrDebrisPresent": { name: "measures.noCombustibleDustOrDebrisPresent", label: "No Combustible Dust/Debris", type: "checkbox", initialValue: measures.noCombustibleDustOrDebrisPresent, group },
      "measures.radiativeHeatPreventiveMeasuresAreTaken": { name: "measures.radiativeHeatPreventiveMeasuresAreTaken", label: "Radiative Heat Prevention Taken", type: "checkbox", initialValue: measures.radiativeHeatPreventiveMeasuresAreTaken, group },
      "measures.vesselsArePurged": { name: "measures.vesselsArePurged", label: "Vessels are Purged", type: "checkbox", initialValue: measures.vesselsArePurged, group },
      "measures.openingsAreCovered": { name: "measures.openingsAreCovered", label: "Openings are Covered", type: "checkbox", initialValue: measures.openingsAreCovered, group },
      "measures.ductVentilationIsSecured": { name: "measures.ductVentilationIsSecured", label: "Duct Ventilation Secured", type: "checkbox", initialValue: measures.ductVentilationIsSecured, group },
      "measures.lockOutIsCompleted": { name: "measures.lockOutIsCompleted", label: "Lock-Out Completed", type: "checkbox", initialValue: measures.lockOutIsCompleted, group },
      "measures.communicationIsEstablished": { name: "measures.communicationIsEstablished", label: "Communication Established", type: "checkbox", initialValue: measures.communicationIsEstablished, group },
      "measures.fireWatchIsAwareOfDuties": { name: "measures.fireWatchIsAwareOfDuties", label: "Fire Watch Aware of Duties", type: "checkbox", initialValue: measures.fireWatchIsAwareOfDuties, group },
      "measures.fireExtinguisherPresent": { name: "measures.fireExtinguisherPresent", label: "Fire Extinguisher Present", type: "checkbox", initialValue: measures.fireExtinguisherPresent, group },
      "measures.fireProtectionIsInService": { name: "measures.fireProtectionIsInService", label: "Fire Protection in Service", type: "checkbox", initialValue: measures.fireProtectionIsInService, group }
    };
  }
};

// src/app/models/file/file-id.model.ts
var FileIdDto = class _FileIdDto extends BaseDto {
  fileType;
  fileLink;
  baseLink;
  folder;
  system;
  relatedSystems;
  fileNumber;
  vendor;
  points;
  extension;
  extensions;
  bulkEditStep;
  docNum;
  constructor(data = {}) {
    super(data);
    this.fileType = data.fileType || 0;
    this.fileLink = data.fileLink || "";
    this.baseLink = data.baseLink || "";
    this.folder = data.folder || "";
    this.system = data.system || 0;
    this.relatedSystems = data.relatedSystems || [];
    this.fileNumber = data.fileNumber || [];
    this.vendor = data.vendor || 0;
    this.points = data.points || [];
    this.objectType = data.objectType || "";
    this.extension = data.extension || "";
    this.extensions = data.extensions || [];
    this.bulkEditStep = data.bulkEditStep || "";
    this.docNum = data.docNum || "";
  }
  toJson() {
    return __spreadProps(__spreadValues({}, super.toJson()), {
      fileType: this.fileType,
      fileLink: this.fileLink,
      baseLink: this.baseLink,
      folder: this.folder,
      system: this.system,
      relatedSystems: this.relatedSystems,
      fileNumber: this.fileNumber,
      vendor: this.vendor,
      points: this.points,
      extension: this.extension,
      extensions: this.extensions,
      bulkEditStep: this.bulkEditStep,
      docNum: this.docNum
    });
  }
  static fromJson(json) {
    if (!json) {
      console.warn("Received null or undefined json in FileIdDto.fromJson");
      return new _FileIdDto();
    }
    return new _FileIdDto(__spreadProps(__spreadValues({}, super.fromJson(json)), {
      fileType: json.fileType,
      fileLink: json.fileLink,
      baseLink: json.baseLink,
      folder: json.folder,
      system: json.system,
      relatedSystems: json.relatedSystems,
      fileNumber: json.fileNumber,
      vendor: json.vendor,
      points: json.points || [],
      extension: json.extension,
      extensions: json.extensions,
      bulkEditStep: json.bulkEditStep,
      docNum: json.docNum
    }));
  }
};

// src/app/models/file/file.model.ts
var FileDto = class _FileDto extends BaseDto {
  fileType;
  fileLink;
  baseLink;
  folder;
  system;
  relatedSystems;
  fileNumber;
  vendor;
  points;
  extension;
  extensions;
  bulkEditStep;
  docNum;
  constructor(data = {}) {
    super(data);
    this.id = data.id || 0;
    this.name = data.name || "";
    this.fileType = data.fileType ? ValueDto.fromJson(data.fileType) : new ValueDto({ id: 0, name: "" });
    this.fileLink = data.fileLink || "";
    this.baseLink = data.baseLink || "";
    this.folder = data.folder || "";
    this.system = data.system ? ValueDto.fromJson(data.system) : new ValueDto({ id: 0, name: "" });
    this.relatedSystems = data.relatedSystems || [];
    this.fileNumber = data.fileNumber || [];
    this.vendor = data.vendor ? ValueDto.fromJson(data.vendor) : new ValueDto({ id: 0, name: "" });
    this.points = data.points?.map((point) => EquipmentDto.fromJson(point)) || [];
    this.objectType = data.objectType || "";
    this.extension = data.extension || "";
    this.extensions = data.extensions || [];
    this.bulkEditStep = data.bulkEditStep || "";
    this.docNum = data.docNum || "";
    this.isVerified = data.isVerified || false;
  }
  // Serialization method
  toJson() {
    return __spreadProps(__spreadValues({}, super.toJson()), {
      fileType: this.fileType?.toJson?.() ?? this.fileType,
      fileLink: this.fileLink,
      baseLink: this.baseLink,
      folder: this.folder,
      system: this.system?.toJson?.() ?? this.system,
      relatedSystems: this.relatedSystems,
      fileNumber: this.fileNumber,
      vendor: this.vendor?.toJson?.() ?? this.vendor,
      points: this.points.map((point) => point.toJson()),
      extension: this.extension,
      extensions: this.extensions,
      bulkEditStep: this.bulkEditStep,
      docNum: this.docNum
    });
  }
  // Deserialization method (static)
  static fromJson(json) {
    return new _FileDto(__spreadProps(__spreadValues({}, super.fromJson(json)), {
      fileType: json.fileType ? ValueDto.fromJson(json.fileType) : new ValueDto({ id: 0, name: "" }),
      fileLink: json.fileLink,
      baseLink: json.baseLink,
      folder: json.folder,
      system: json.system ? ValueDto.fromJson(json.system) : new ValueDto({ id: 0, name: "" }),
      relatedSystems: json.relatedSystems,
      fileNumber: json.fileNumber,
      vendor: json.vendor ? ValueDto.fromJson(json.vendor) : new ValueDto({ id: 0, name: "" }),
      points: json.points?.map((point) => EquipmentDto.fromJson(point)) ?? [],
      extension: json.extension,
      extensions: json.extensions,
      bulkEditStep: json.bulkEditStep,
      docNum: json.docNum
    }));
  }
  toIdModel() {
    const extractId = (value) => {
      if (value == null)
        return 0;
      if (typeof value === "number")
        return value;
      if (typeof value === "object" && value.id != null)
        return value.id;
      return 0;
    };
    return new FileIdDto({
      id: this.id,
      name: this.name,
      fileType: extractId(this.fileType),
      fileLink: this.fileLink,
      baseLink: this.baseLink,
      folder: this.folder,
      system: extractId(this.system),
      relatedSystems: this.relatedSystems,
      fileNumber: this.fileNumber,
      vendor: extractId(this.vendor),
      points: this.points?.map((point) => typeof point === "number" ? point : point.id) || [],
      objectType: this.objectType,
      extension: this.extension,
      extensions: this.extensions,
      bulkEditStep: this.bulkEditStep,
      docNum: this.docNum,
      isVerified: this.isVerified
    });
  }
};

// src/app/models/user.model.ts
var UserDto = class _UserDto extends BaseDto {
  username;
  firstName;
  lastName;
  email;
  role;
  roles;
  isActive;
  windowsUsername;
  permissionLevel;
  phone;
  company;
  signaturePath;
  constructor(data = {}) {
    super(data);
    this.username = data.username ?? "";
    this.firstName = data.firstName ?? "";
    this.lastName = data.lastName ?? "";
    this.email = data.email ?? "";
    this.role = data.role ?? "";
    this.roles = data.roles ?? [];
    this.isActive = data.isActive ?? true;
    this.windowsUsername = data.windowsUsername ?? "";
    this.permissionLevel = data.permissionLevel ?? "";
    this.phone = data.phone ?? "";
    this.company = data.company ?? "";
    this.signaturePath = data.signaturePath ?? "";
  }
  toJson() {
    return __spreadProps(__spreadValues({}, super.toJson()), {
      username: this.username,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      roles: this.roles,
      isActive: this.isActive,
      windowsUsername: this.windowsUsername,
      permissionLevel: this.permissionLevel,
      phone: this.phone,
      company: this.company,
      signaturePath: this.signaturePath
    });
  }
  static fromJson(json) {
    if (!json)
      return new _UserDto();
    return new _UserDto({
      id: json.id ?? 0,
      name: json.name ?? "",
      username: json.username ?? "",
      firstName: json.firstName ?? "",
      lastName: json.lastName ?? "",
      email: json.email ?? "",
      role: json.role ?? "",
      roles: json.roles ?? [],
      isActive: json.isActive ?? true,
      windowsUsername: json.windowsUsername ?? "",
      permissionLevel: json.permissionLevel ?? "",
      phone: json.phone ?? "",
      company: json.company ?? "",
      signaturePath: json.signaturePath ?? ""
    });
  }
  toOption() {
    return {
      value: this.id,
      label: this.name || `${this.firstName} ${this.lastName}`.trim() || this.username
    };
  }
  static toTableColumns(fields = ["name", "email", "username", "role", "permissionLevel", "isActive", "windowsUsername"]) {
    const allColumns = {
      name: { id: "name", header: "Name", accessorKey: "name", filterable: true },
      email: { id: "email", header: "Email", accessorKey: "email", filterable: true },
      username: { id: "username", header: "Username", accessorKey: "username", filterable: true },
      role: {
        id: "role",
        header: "Roles",
        filterable: true,
        accessorFn: (item) => (item.roles || []).map((r) => r.replace("ROLE_", "")).join(", ")
      },
      permissionLevel: { id: "permissionLevel", header: "Permission", accessorKey: "permissionLevel", filterable: true },
      isActive: {
        id: "isActive",
        header: "Active",
        filterable: true,
        accessorFn: (item) => item.isActive ? "Yes" : "No",
        conditionalStyling: (item) => item.isActive ? { "background-color": "#90EE90" } : { "background-color": "#FFCCCB" }
      },
      windowsUsername: { id: "windowsUsername", header: "Windows User", accessorKey: "windowsUsername", filterable: true },
      firstName: { id: "firstName", header: "First Name", accessorKey: "firstName", filterable: true },
      lastName: { id: "lastName", header: "Last Name", accessorKey: "lastName", filterable: true },
      phone: { id: "phone", header: "Phone", accessorKey: "phone", filterable: true },
      company: { id: "company", header: "Company", accessorKey: "company", filterable: true }
    };
    return fields.map((f) => allColumns[f]).filter((c) => c != null);
  }
  static toFormFields(dto, options) {
    const isNew = options?.isNew ?? (!dto.id || dto.id === 0);
    const availableRoles = [
      { value: "ROLE_ADMIN", label: "Admin" },
      { value: "ROLE_EMPLOYEE", label: "Employee" },
      { value: "ROLE_CONTRACTOR", label: "Contractor" },
      { value: "ROLE_PLANT", label: "Plant" }
    ];
    const permissionOptions = [
      { value: "", label: "None" },
      { value: "NONE", label: "NONE" },
      { value: "BASIC", label: "BASIC" },
      { value: "OPERATOR", label: "OPERATOR" }
    ];
    return [
      {
        name: "firstName",
        label: "First Name",
        type: "text",
        validators: [Validators.required],
        initialValue: dto.firstName
      },
      {
        name: "lastName",
        label: "Last Name",
        type: "text",
        validators: [Validators.required],
        initialValue: dto.lastName
      },
      {
        name: "username",
        label: "Username",
        type: "text",
        validators: [Validators.required],
        initialValue: dto.username
      },
      {
        name: "email",
        label: "Email",
        type: "text",
        validators: [Validators.required, Validators.email],
        initialValue: dto.email
      },
      {
        name: "password",
        label: isNew ? "Password" : "New Password (leave blank to keep)",
        type: "text",
        validators: isNew ? [Validators.required] : [],
        initialValue: ""
      },
      {
        name: "windowsUsername",
        label: "Windows Username",
        type: "text",
        initialValue: dto.windowsUsername
      },
      {
        name: "phone",
        label: "Phone",
        type: "text",
        initialValue: dto.phone
      },
      {
        name: "company",
        label: "Company",
        type: "text",
        initialValue: dto.company
      },
      {
        name: "roles",
        label: "Roles",
        type: "checkbox-group",
        options: availableRoles,
        initialValue: dto.roles || []
      },
      {
        name: "permissionLevel",
        label: "Permission Level",
        type: "select",
        options: permissionOptions,
        initialValue: dto.permissionLevel || ""
      },
      {
        name: "isActive",
        label: "Active",
        type: "checkbox",
        initialValue: dto.isActive
      },
      {
        name: "signaturePath",
        label: "Signature Path",
        type: "text",
        initialValue: dto.signaturePath
      }
    ];
  }
};

// src/app/models/base/base-permit-id.model.ts
var BasePermitIdDto = class _BasePermitIdDto extends BaseDto {
  workScope;
  system;
  equipment;
  requestor;
  controlAuthority;
  permitType;
  docNum;
  permitStatus;
  temp;
  constructor(data = {}) {
    super(data);
    this.workScope = data.workScope || "";
    this.system = data.system || 0;
    this.equipment = data.equipment || [];
    this.requestor = data.requestor || 0;
    this.controlAuthority = data.controlAuthority || 0;
    this.permitType = data.permitType || 0;
    this.docNum = data.docNum || 0;
    this.permitStatus = data.permitStatus || 0;
    this.temp = data.temp || false;
  }
  toJson() {
    return __spreadProps(__spreadValues({}, super.toJson()), {
      workScope: this.workScope,
      system: this.system,
      equipment: this.equipment,
      requestor: this.requestor,
      controlAuthority: this.controlAuthority,
      permitType: this.permitType,
      docNum: this.docNum,
      permitStatus: this.permitStatus,
      temp: this.temp
    });
  }
  static fromJson(json) {
    if (!json) {
      console.warn("Received null or undefined json in BasePermitIdDto.fromJson");
      return new _BasePermitIdDto();
    }
    return new _BasePermitIdDto(__spreadProps(__spreadValues({}, super.fromJson(json)), {
      workScope: json.workScope || "",
      system: json.system || 0,
      equipment: json.equipment || [],
      requestor: json.requestor || 0,
      controlAuthority: json.controlAuthority || 0,
      permitType: json.permitType || 0,
      docNum: json.docNum || 0,
      permitStatus: json.permitStatus || 0,
      temp: json.temp || false
    }));
  }
};

// src/app/models/base/base-permit.model.ts
var BasePermitDto = class _BasePermitDto extends BaseDto {
  workScope;
  system;
  equipment;
  requestor;
  controlAuthority;
  permitType;
  docNum;
  permitStatus;
  temp;
  constructor(data = {}) {
    super(data);
    this.workScope = data.workScope || "";
    this.system = data.system || new ValueDto();
    this.equipment = data.equipment || [];
    this.requestor = data.requestor || new UserDto();
    this.controlAuthority = data.controlAuthority || new UserDto();
    this.permitType = data.permitType || new ValueDto();
    this.docNum = data.docNum || 0;
    this.permitStatus = data.permitStatus || new ValueDto();
    this.temp = data.temp || false;
  }
  // Override toJson method
  toJson() {
    return __spreadProps(__spreadValues({}, super.toJson()), {
      workScope: this.workScope ?? "",
      system: this.system?.toJson() ?? null,
      equipment: this.equipment?.map((eq) => eq?.toJson() ?? null).filter(Boolean) ?? [],
      requestor: new UserDto(this.requestor)?.toJson() ?? null,
      controlAuthority: new UserDto(this.controlAuthority)?.toJson() ?? null,
      permitType: this.permitType?.toJson() ?? null,
      docNum: this.docNum ?? 0,
      permitStatus: new ValueDto(this.permitStatus)?.toJson() ?? null,
      temp: this.temp ?? false
    });
  }
  // Override fromJson method
  static fromJson(json) {
    if (!json) {
      console.warn("Received null or undefined json in BasePermitDto.fromJson");
      return new _BasePermitDto();
    }
    return new _BasePermitDto(__spreadProps(__spreadValues({}, super.fromJson(json)), {
      workScope: json.workScope || "",
      system: ValueDto.fromJson(json.system),
      equipment: (json.equipment || []).map((eq) => EquipmentDto.fromJson(eq)),
      requestor: UserDto.fromJson(json.requestor),
      controlAuthority: UserDto.fromJson(json.controlAuthority),
      permitType: ValueDto.fromJson(json.permitType),
      docNum: json.docNum || 0,
      permitStatus: ValueDto.fromJson(json.permitStatus),
      temp: json.temp || false
    }));
  }
  toIdModel() {
    return new BasePermitIdDto(__spreadProps(__spreadValues({}, this.toJson()), {
      id: this.id,
      name: this.name,
      objectType: this.objectType,
      system: this.system.id,
      equipment: this.equipment.map((eq) => eq.id),
      requestor: this.requestor.id,
      controlAuthority: this.controlAuthority.id,
      permitType: this.permitType.id,
      permitStatus: this.permitStatus.id
    }));
  }
};

// src/app/models/loto/lock.model.ts
var LockDto = class _LockDto extends BaseDto {
  number;
  loto;
  lotoAccessoryStatus;
  tagLabel;
  assignedLotoPointId;
  lockType;
  constructor(data = {}) {
    super(data);
    this.number = data.number ?? 0;
    this.loto = data.loto ?? new LotoDto();
    this.lotoAccessoryStatus = data.lotoAccessoryStatus ?? new ValueDto();
    this.tagLabel = data.tagLabel ?? "";
    this.assignedLotoPointId = data.assignedLotoPointId ?? null;
    this.lockType = data.lockType ?? "LOCK";
  }
  // Override toJson method
  toJson() {
    return __spreadProps(__spreadValues({}, super.toJson()), {
      number: this.number,
      loto: this.loto.toJson(),
      lotoAccessoryStatus: this.lotoAccessoryStatus.toJson(),
      tagLabel: this.tagLabel,
      assignedLotoPointId: this.assignedLotoPointId,
      lockType: this.lockType
    });
  }
  // Override fromJson method
  static fromJson(json) {
    if (!json) {
      console.warn("Received null or undefined json in LockDto.fromJson");
      return new _LockDto();
    }
    return new _LockDto(__spreadProps(__spreadValues({}, super.fromJson(json)), {
      number: json.number ?? 0,
      loto: LotoDto.fromJson(json.loto),
      lotoAccessoryStatus: ValueDto.fromJson(json.lotoAccessoryStatus),
      tagLabel: json.tagLabel ?? "",
      assignedLotoPointId: json.assignedLotoPointId ?? null,
      lockType: json.lockType ?? "LOCK"
    }));
  }
};

// src/app/models/loto/loto-box.model.ts
var LotoBoxDto = class _LotoBoxDto extends BasePermitDto {
  number;
  loto;
  lotoAccessoryStatus;
  ledStripId;
  rangeStart;
  rangeEnd;
  description;
  // LED status fields
  r;
  g;
  b;
  brightness;
  strip;
  manualOverride;
  constructor(data = {}, isNested = false) {
    super(data);
    this.number = data.number ?? 0;
    this.loto = isNested ? null : data.loto ? new LotoDto(__spreadProps(__spreadValues({}, data.loto), { lotoBox: null })) : null;
    this.lotoAccessoryStatus = data.lotoAccessoryStatus ? new ValueDto(data.lotoAccessoryStatus) : new ValueDto();
    this.ledStripId = data.ledStripId ?? null;
    this.rangeStart = data.rangeStart ?? null;
    this.rangeEnd = data.rangeEnd ?? null;
    this.description = data.description ?? "";
    this.r = data.r;
    this.g = data.g;
    this.b = data.b;
    this.brightness = data.brightness;
    this.strip = data.strip;
    this.manualOverride = data.manualOverride ?? false;
  }
  // Override toJson method
  toJson() {
    return __spreadProps(__spreadValues({}, super.toJson()), {
      number: this.number,
      loto: this.loto?.toJson(),
      lotoAccessoryStatus: this.lotoAccessoryStatus.toJson(),
      ledStripId: this.ledStripId,
      rangeStart: this.rangeStart,
      rangeEnd: this.rangeEnd,
      description: this.description
    });
  }
  // Override fromJson method
  static fromJson(json, isNested = false) {
    if (!json) {
      console.warn("Received null or undefined json in LotoBoxDto.fromJson");
      return new _LotoBoxDto();
    }
    return new _LotoBoxDto(__spreadProps(__spreadValues({}, super.fromJson(json)), {
      number: json.number,
      loto: isNested ? null : json.loto ? LotoDto.fromJson(__spreadProps(__spreadValues({}, json.loto), { lotoBox: null })) : null,
      lotoAccessoryStatus: ValueDto.fromJson(json.lotoAccessoryStatus),
      ledStripId: json.ledStripId,
      rangeStart: json.rangeStart,
      rangeEnd: json.rangeEnd,
      description: json.description,
      r: json.r,
      g: json.g,
      b: json.b,
      brightness: json.brightness,
      strip: json.strip,
      manualOverride: json.manualOverride
    }), isNested);
  }
};

// src/app/models/loto/loto-id.model.ts
var LotoIdDto = class _LotoIdDto extends BasePermitIdDto {
  lotoPoints;
  locks;
  lotoBox;
  boxNumber;
  equipmentSystem;
  lotoRequestor;
  date;
  constructor(data = {}) {
    super(data);
    this.lotoPoints = data.lotoPoints || [];
    this.locks = data.locks || [];
    this.lotoBox = data.lotoBox || null;
    this.boxNumber = data.boxNumber || null;
    this.equipmentSystem = data.equipmentSystem || "";
    this.lotoRequestor = data.lotoRequestor || "";
    this.date = data.date || "";
  }
  toJson() {
    return __spreadProps(__spreadValues({}, super.toJson()), {
      lotoPoints: this.lotoPoints,
      locks: this.locks,
      lotoBox: this.lotoBox,
      boxNumber: this.boxNumber,
      equipmentSystem: this.equipmentSystem,
      lotoRequestor: this.lotoRequestor,
      date: this.date
    });
  }
  static fromJson(json) {
    if (!json) {
      console.warn("Received null or undefined json in LotoIdDto.fromJson");
      return new _LotoIdDto();
    }
    return new _LotoIdDto(__spreadProps(__spreadValues({}, super.fromJson(json)), {
      lotoPoints: json.lotoPoints || [],
      locks: json.locks || [],
      lotoBox: json.lotoBox || null,
      boxNumber: json.boxNumber || null,
      equipmentSystem: json.equipmentSystem || "",
      lotoRequestor: json.lotoRequestor || "",
      date: json.date || ""
    }));
  }
};

// src/app/models/loto/loto.model.ts
var LotoDto = class _LotoDto extends BasePermitDto {
  lotoPoints;
  locks;
  lotoBox;
  boxNumber;
  equipmentSystem;
  lotoRequestor;
  date;
  personnel;
  sourceStandardId;
  sourceStandardName;
  constructor(data = {}) {
    super(data);
    this.lotoPoints = data.lotoPoints?.map((point) => new LotoPointDto(point)) ?? [];
    this.locks = data.locks?.map((lock) => new LockDto(lock)) ?? [];
    this.lotoBox = data.lotoBox ? new LotoBoxDto(data.lotoBox, true) : null;
    this.boxNumber = data.boxNumber || null;
    this.equipmentSystem = data.equipmentSystem || "";
    this.lotoRequestor = data.lotoRequestor || "";
    this.date = data.date || "";
    this.personnel = data.personnel ?? [];
    this.sourceStandardId = data.sourceStandardId ?? null;
    this.sourceStandardName = data.sourceStandardName ?? "";
  }
  // Override toJson method
  toJson() {
    return __spreadProps(__spreadValues({}, super.toJson()), {
      lotoPoints: this.lotoPoints.map((point) => point.toJson()),
      locks: this.locks.map((lock) => lock.toJson()),
      lotoBox: this.lotoBox?.toJson(),
      boxNumber: this.boxNumber,
      equipmentSystem: this.equipmentSystem,
      lotoRequestor: this.lotoRequestor,
      date: this.date,
      personnel: this.personnel,
      sourceStandardId: this.sourceStandardId,
      sourceStandardName: this.sourceStandardName
    });
  }
  // Override fromJson method
  static fromJson(json) {
    if (!json) {
      console.warn("Received null or undefined json in LotoDto.fromJson");
      return new _LotoDto();
    }
    return new _LotoDto(__spreadProps(__spreadValues({}, super.fromJson(json)), {
      lotoPoints: json.lotoPoints?.map((pointJson) => LotoPointDto.fromJson(pointJson)) || null,
      locks: (json.locks ?? []).map((lock) => LockDto.fromJson(lock)),
      lotoBox: json.lotoBox ? LotoBoxDto.fromJson(json.lotoBox, true) : null,
      boxNumber: json.boxNumber,
      equipmentSystem: json.equipmentSystem,
      lotoRequestor: json.lotoRequestor,
      date: json.date,
      personnel: json.personnel ?? [],
      sourceStandardId: json.sourceStandardId ?? null,
      sourceStandardName: json.sourceStandardName ?? ""
    }));
  }
  toIdModel() {
    const baseIdModel = super.toIdModel();
    return new LotoIdDto(__spreadProps(__spreadValues({}, baseIdModel), {
      lotoPoints: this.lotoPoints.map((point) => point.id),
      locks: this.locks.map((lock) => lock.id),
      lotoBox: this.lotoBox ? this.lotoBox.id : null,
      boxNumber: this.boxNumber,
      equipmentSystem: this.equipmentSystem,
      lotoRequestor: this.lotoRequestor,
      date: this.date
    }));
  }
  static toTableColumns() {
    return [
      { id: "id", header: "ID", accessorKey: "id" },
      { id: "permitNumber", header: "Permit #", accessorKey: "permitNumber" },
      { id: "name", header: "LOTO Number", accessorKey: "name" },
      { id: "permitStatus", header: "Status", accessorKey: "permitStatus.name" },
      { id: "equipmentSystem", header: "Equipment/System", accessorKey: "equipmentSystem" },
      { id: "lotoRequestor", header: "Requestor", accessorKey: "lotoRequestor" },
      { id: "date", header: "Date", accessorKey: "date" },
      { id: "boxNumber", header: "Box #", accessorKey: "boxNumber" },
      { id: "pointCount", header: "Points", accessorKey: "lotoPoints.length" }
    ];
  }
  static toFormFields(dto) {
    const fields = [
      {
        name: "equipmentSystem",
        label: "Equipment System",
        type: "text",
        initialValue: dto.equipmentSystem,
        validators: [Validators.required]
      },
      {
        name: "lotoRequestor",
        label: "LOTO Requestor",
        type: "text",
        initialValue: dto.lotoRequestor,
        validators: [Validators.required]
      },
      {
        name: "date",
        label: "Date",
        type: "date",
        initialValue: dto.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        validators: [Validators.required]
      },
      {
        name: "boxNumber",
        label: "Box Number",
        type: "number",
        initialValue: dto.boxNumber?.toString() || ""
      },
      {
        name: "lotoBox",
        label: "LOTO Box",
        type: "select",
        initialValue: dto.lotoBox?.id,
        options: dto.lotoBox ? [{ value: dto.lotoBox.id, label: `Box #${dto.lotoBox.number}` }] : []
      },
      {
        name: "isVerified",
        label: "Is Verified",
        type: "select",
        initialValue: (dto.isVerified ?? false).toString(),
        options: [
          { value: "true", label: "Yes" },
          { value: "false", label: "No" }
        ]
      },
      {
        name: "locks",
        label: "Locks",
        type: "multi-select",
        initialValue: (dto.locks ?? []).map((l) => l.id),
        options: (dto.locks ?? []).map((l) => ({ value: l.id, label: `Lock #${l.number}` }))
      },
      {
        name: "lotoPoints",
        label: "Tags and Locks",
        type: "form-array",
        initialValue: dto.lotoPoints ?? [],
        fields: [
          { name: "tagNumber", label: "Tag #", type: "text" },
          { name: "description", label: "EID to be Tagged/Locked", type: "text" },
          { name: "specificLocation", label: "Location", type: "text" },
          { name: "isoPos", label: "LOTO Position", type: "text" },
          { name: "normPos", label: "Released Position", type: "text" },
          { name: "hungBy", label: "Hung By", type: "text" },
          { name: "verifiedBy", label: "Verified By", type: "text" },
          { name: "zeroEnergyMethod", label: "Zero Energy Verification", type: "textarea" }
        ]
      }
    ];
    return fields;
  }
};

// src/app/models/loto/loto-point-id.model.ts
var LotoPointIdDto = class _LotoPointIdDto extends BaseDto {
  unit;
  tagged;
  tagNumber;
  description;
  isoPos;
  normPos;
  isoPosId;
  normPosId;
  specificLocation;
  standard;
  generalLocation;
  equipmentIdList;
  normalPosition;
  isolatedPosition;
  characteristicsJson;
  equipmentList;
  oldId;
  isUpdated;
  fileIds;
  conflictStatus;
  lotos;
  lotoIds;
  zeroEnergyMethod;
  zeroEnergy;
  location;
  eqType;
  counterpartId;
  isLabeled;
  isLockable;
  isProcessed;
  processingStatus;
  modelFileId;
  constructor(data = {}) {
    super(data);
    this.unit = data.unit ?? null;
    this.tagged = data.tagged ?? null;
    this.tagNumber = data.tagNumber ?? null;
    this.description = data.description ?? null;
    this.isoPos = data.isoPos ?? null;
    this.normPos = data.normPos ?? null;
    this.isoPosId = data.isoPosId ?? null;
    this.normPosId = data.normPosId ?? null;
    this.specificLocation = data.specificLocation ?? null;
    this.standard = data.standard ?? null;
    this.generalLocation = data.generalLocation ?? null;
    this.equipmentIdList = data.equipmentIdList ?? null;
    this.normalPosition = data.normalPosition ?? null;
    this.isolatedPosition = data.isolatedPosition ?? null;
    this.characteristicsJson = data.characteristicsJson ?? null;
    this.equipmentList = data.equipmentList ?? null;
    this.oldId = data.oldId ?? null;
    this.isUpdated = data.isUpdated ?? null;
    this.fileIds = data.fileIds ?? null;
    this.conflictStatus = data.conflictStatus ?? null;
    this.lotos = data.lotos ?? null;
    this.lotoIds = data.lotoIds ?? null;
    this.zeroEnergyMethod = data.zeroEnergyMethod ?? null;
    this.zeroEnergy = data.zeroEnergy ?? null;
    this.location = data.location ?? null;
    this.eqType = data.eqType ?? null;
    this.counterpartId = data.counterpartId ?? null;
    this.isLabeled = data.isLabeled ?? null;
    this.isLockable = data.isLockable ?? null;
    this.isProcessed = data.isProcessed ?? null;
    this.processingStatus = data.processingStatus ?? null;
    this.modelFileId = data.modelFileId ?? null;
  }
  // export class LotoPointIdDto extends BaseDto {
  //   unit: string;
  //   tagged: string;
  //   tagNumber: string;
  //   description: string;
  //   isoPos: number | null;
  //   normPosId: number | null;
  //   specificLocation: string;
  //   standard: string;
  //   generalLocation: string;
  //   equipmentIdList: number[];
  //   normalPosition: string;
  //   isolatedPosition: string;
  //   oldId: string;
  //   isUpdated: number;
  //   fileIds: string;
  //   conflictStatus: string;
  //   lotoIds: number[];
  //   constructor(data: Partial<LotoPointIdDto> = {}) {
  //     super(data);
  //     this.unit = data.unit || '';
  //     this.tagged = data.tagged || '';
  //     this.tagNumber = data.tagNumber || '';
  //     this.description = data.description || '';
  //     this.isoPos = data.isoPos || null;
  //     this.normPosId = data.normPosId || null;
  //     this.specificLocation = data.specificLocation || '';
  //     this.standard = data.standard || '';
  //     this.generalLocation = data.generalLocation || '';
  //     this.equipmentIdList = data.equipmentIdList || [];
  //     this.normalPosition = data.normalPosition || '';
  //     this.isolatedPosition = data.isolatedPosition || '';
  //     this.oldId = data.oldId || '';
  //     this.objectType = data.objectType || '';
  //     this.isUpdated = data.isUpdated || 0;
  //     this.fileIds = data.fileIds || '';
  //     this.conflictStatus = data.conflictStatus || '';
  //     this.lotoIds = data.lotoIds || [];
  //   }
  toJson() {
    return __spreadProps(__spreadValues({}, super.toJson()), {
      unit: this.unit,
      tagged: this.tagged,
      tagNumber: this.tagNumber,
      description: this.description,
      isoPos: this.isoPos,
      normPos: this.normPos,
      isoPosId: this.isoPosId,
      normPosId: this.normPosId,
      specificLocation: this.specificLocation,
      standard: this.standard,
      generalLocation: this.generalLocation,
      equipmentIdList: this.equipmentIdList,
      normalPosition: this.normalPosition,
      isolatedPosition: this.isolatedPosition,
      characteristicsJson: this.characteristicsJson,
      equipmentList: this.equipmentList,
      oldId: this.oldId,
      isUpdated: this.isUpdated,
      fileIds: this.fileIds,
      conflictStatus: this.conflictStatus,
      lotos: this.lotos,
      lotoIds: this.lotoIds,
      zeroEnergyMethod: this.zeroEnergyMethod,
      zeroEnergy: this.zeroEnergy,
      location: this.location,
      eqType: this.eqType,
      counterpartId: this.counterpartId,
      isLabeled: this.isLabeled,
      isLockable: this.isLockable,
      isProcessed: this.isProcessed,
      processingStatus: this.processingStatus,
      modelFileId: this.modelFileId
    });
  }
  static fromJson(json) {
    if (!json) {
      console.warn("Received null or undefined json in LotoPointIdDto.fromJson");
      return new _LotoPointIdDto();
    }
    return new _LotoPointIdDto(__spreadProps(__spreadValues({}, super.fromJson(json)), {
      unit: json.unit,
      tagged: json.tagged,
      tagNumber: json.tagNumber,
      description: json.description,
      isoPos: json.isoPos,
      normPos: json.normPos,
      isoPosId: json.isoPosId,
      normPosId: json.normPosId,
      specificLocation: json.specificLocation,
      standard: json.standard,
      generalLocation: json.generalLocation,
      equipmentIdList: json.equipmentIdList || [],
      normalPosition: json.normalPosition,
      isolatedPosition: json.isolatedPosition,
      characteristicsJson: json.characteristicsJson || null,
      equipmentList: json.equipmentList || [],
      oldId: json.oldId,
      isUpdated: json.isUpdated,
      fileIds: json.fileIds || "",
      conflictStatus: json.conflictStatus,
      lotos: json.lotos || [],
      lotoIds: json.lotoIds || [],
      zeroEnergyMethod: json.zeroEnergyMethod,
      zeroEnergy: json.zeroEnergy,
      location: json.location,
      eqType: json.eqType,
      counterpartId: json.counterpartId,
      isLabeled: json.isLabeled ?? false,
      isLockable: json.isLockable ?? false,
      isProcessed: json.isProcessed ?? false,
      processingStatus: json.processingStatus ?? null,
      modelFileId: json.modelFileId ?? null
    }));
  }
};

// src/app/models/loto/zero-energy.model.ts
var ZeroEnergyDto = class _ZeroEnergyDto extends BaseDto {
  method = "";
  zeroEnergyTemplate = new ValueDto();
  templateEquipment = [];
  templateEquipmentIds = [];
  constructor(data = {}) {
    super(data);
    this.method = data.method ?? "";
    this.zeroEnergyTemplate = this.toValueDto(data.zeroEnergyTemplate);
    this.templateEquipment = this.toEquipmentDtos(data.templateEquipment);
    this.templateEquipmentIds = data.templateEquipmentIds ?? [];
  }
  toValueDto(data) {
    if (data instanceof ValueDto)
      return data;
    if (typeof data === "number")
      return new ValueDto({ id: data });
    return data instanceof ValueDto ? data : new ValueDto(data ?? {});
  }
  toEquipmentDtos(data) {
    return Array.isArray(data) ? data.map((item) => item instanceof EquipmentDto ? item : new EquipmentDto(item)) : [];
  }
  toJson() {
    return __spreadProps(__spreadValues({}, super.toJson()), {
      method: this.method,
      zeroEnergyTemplate: this.zeroEnergyTemplate?.toJson?.() ?? this.zeroEnergyTemplate,
      templateEquipment: this.templateEquipment.map((item) => item.toJson()),
      templateEquipmentIds: this.templateEquipmentIds
    });
  }
  static fromJson(json) {
    if (!json) {
      return new _ZeroEnergyDto();
    }
    return new _ZeroEnergyDto(__spreadProps(__spreadValues({}, super.fromJson(json)), {
      method: json.method ?? "",
      zeroEnergyTemplate: json.zeroEnergyTemplate ? ValueDto.fromJson(json.zeroEnergyTemplate) : new ValueDto(),
      templateEquipment: Array.isArray(json.templateEquipment) ? json.templateEquipment.map((item) => EquipmentDto.fromJson(item)) : [],
      templateEquipmentIds: json.templateEquipmentIds ?? []
    }));
  }
};

// src/app/models/loto/loto-point.model.ts
var LotoPointDto = class _LotoPointDto extends BaseDto {
  unit;
  tagged;
  tagNumber;
  description;
  isoPos;
  normPos;
  specificLocation;
  standard;
  generalLocation;
  equipmentIdList;
  normalPosition;
  isolatedPosition;
  fluid;
  characteristicsJson;
  equipmentList;
  oldId;
  isUpdated;
  fileIds;
  conflictStatus;
  lotos;
  zeroEnergyMethod;
  zeroEnergy;
  relatedLotoPointIds;
  location;
  eqType;
  counterpartId;
  isLabeled;
  isLockable;
  isProcessed;
  processingStatus;
  modelFile;
  constructor(data = {}) {
    super(data);
    this.unit = data.unit ?? null;
    this.tagged = data.tagged ?? null;
    this.tagNumber = data.tagNumber ?? null;
    this.description = data.description ?? null;
    this.isoPos = super.setNestedObjectById(data.isoPos, new ValueDto());
    this.normPos = super.setNestedObjectById(data.normPos, new ValueDto());
    this.specificLocation = data.specificLocation ?? null;
    this.standard = data.standard ?? null;
    this.generalLocation = data.generalLocation ?? null;
    this.equipmentIdList = data.equipmentIdList ?? null;
    this.normalPosition = data.normalPosition ?? null;
    this.isolatedPosition = data.isolatedPosition ?? null;
    this.fluid = data.fluid ?? null;
    this.characteristicsJson = data.characteristicsJson ?? null;
    this.equipmentList = data.equipmentList ?? null;
    this.oldId = data.oldId ?? null;
    this.isUpdated = data.isUpdated ?? null;
    this.fileIds = data.fileIds ?? null;
    this.conflictStatus = data.conflictStatus ?? null;
    this.lotos = data.lotos ?? null;
    this.zeroEnergyMethod = data.zeroEnergyMethod ?? null;
    if (data.zeroEnergy) {
      this.zeroEnergy = new ZeroEnergyDto(data.zeroEnergy);
    } else {
      this.zeroEnergy = null;
    }
    this.relatedLotoPointIds = data.relatedLotoPointIds ?? null;
    this.location = super.setNestedObjectById(data.location, new ValueDto());
    this.eqType = super.setNestedObjectById(data.eqType, new ValueDto());
    this.counterpartId = data.counterpartId ?? null;
    this.isLabeled = data.isLabeled ?? null;
    this.isLockable = data.isLockable ?? null;
    this.isProcessed = data.isProcessed ?? null;
    this.processingStatus = super.setNestedObjectById(data.processingStatus, new ValueDto());
    this.modelFile = data.modelFile ? new FileDto(data.modelFile) : null;
  }
  // Serialization method
  toJson() {
    return __spreadProps(__spreadValues({}, super.toJson()), {
      unit: this.unit || "",
      tagged: this.tagged || "",
      tagNumber: this.tagNumber || "",
      description: this.description || "",
      isoPos: this.isoPos?.toJson() || null,
      normPos: this.normPos?.toJson() || null,
      specificLocation: this.specificLocation || "",
      standard: this.standard || "",
      generalLocation: this.generalLocation || "",
      equipmentIdList: this.equipmentIdList || [],
      normalPosition: this.normalPosition || "",
      isolatedPosition: this.isolatedPosition || "",
      fluid: this.fluid || "",
      characteristicsJson: this.characteristicsJson || null,
      equipmentList: this.equipmentList ? Array.from(this.equipmentList).filter((equipment) => equipment != null).map((equipment) => equipment.toJson()) : [],
      oldId: this.oldId || "",
      isUpdated: this.isUpdated || 0,
      fileIds: this.fileIds || "",
      conflictStatus: this.conflictStatus || "",
      lotos: this.lotos?.map((loto) => loto.toJson()),
      zeroEnergyMethod: this.zeroEnergyMethod || null,
      zeroEnergy: this.zeroEnergy || null,
      relatedLotoPointIds: this.relatedLotoPointIds || [],
      location: this.location?.toJson() || null,
      eqType: this.eqType?.toJson() || null,
      counterpartId: this.counterpartId || null,
      isLabeled: this.isLabeled ?? false,
      isLockable: this.isLockable ?? false,
      isProcessed: this.isProcessed ?? false,
      processingStatus: this.processingStatus?.toJson() || null,
      modelFile: this.modelFile?.toJson() ?? null
    });
  }
  // Deserialization method (static)
  static fromJson(json) {
    if (!json) {
      console.warn("Received null or undefined json in LotoPointDto.fromJson");
      return new _LotoPointDto();
    }
    return new _LotoPointDto(__spreadProps(__spreadValues({}, super.fromJson(json)), {
      unit: json.unit || "",
      tagged: json.tagged || "",
      tagNumber: json.tagNumber || "",
      description: json.description || "",
      isoPos: json.isoPos ? ValueDto.fromJson(json.isoPos) : new ValueDto(),
      normPos: json.normPos ? ValueDto.fromJson(json.normPos) : new ValueDto(),
      specificLocation: json.specificLocation || "",
      standard: json.standard || "",
      generalLocation: json.generalLocation || "",
      equipmentIdList: Array.isArray(json.equipmentIdList) ? json.equipmentIdList : [],
      normalPosition: json.normalPosition || "",
      isolatedPosition: json.isolatedPosition || "",
      fluid: json.fluid || "",
      characteristicsJson: json.characteristicsJson || null,
      equipmentList: json.equipmentList ? json.equipmentList.filter((equipment) => equipment != null).map((equipment) => {
        try {
          return EquipmentDto.fromJson(equipment);
        } catch (error) {
          console.warn("Error parsing EquipmentDto:", error);
          return null;
        }
      }).filter((equipment) => equipment !== null) : [],
      oldId: json.oldId || "",
      isUpdated: json.isUpdated || 0,
      fileIds: json.fileIds || "",
      conflictStatus: json.conflictStatus || "",
      lotos: Array.isArray(json.lotos) ? json.lotos.map((lotoJson) => LotoDto.fromJson(lotoJson)) : [],
      zeroEnergyMethod: json.zeroEnergyMethod || null,
      zeroEnergy: json.zeroEnergy ? ZeroEnergyDto.fromJson(json.zeroEnergy) : null,
      relatedLotoPointIds: Array.isArray(json.relatedLotoPointIds) ? json.relatedLotoPointIds : [],
      location: json.location ? ValueDto.fromJson(json.location) : new ValueDto(),
      eqType: json.eqType ? ValueDto.fromJson(json.eqType) : new ValueDto(),
      counterpartId: json.counterpartId || null,
      isLabeled: json.isLabeled ?? false,
      isLockable: json.isLockable ?? false,
      isProcessed: json.isProcessed ?? false,
      processingStatus: json.processingStatus ? ValueDto.fromJson(json.processingStatus) : null,
      modelFile: json.modelFile ? FileDto.fromJson(json.modelFile) : null
    }));
  }
  static toFormFields(dto, isoPosOptions, normPosOptions, fields = [
    "tagNumber",
    "description",
    "unit",
    "tagged",
    "isoPos",
    "normPos",
    "specificLocation",
    "standard",
    "generalLocation",
    "isVerified",
    "zeroEnergyMethod"
  ]) {
    const allFields = {
      tagNumber: {
        name: "tagNumber",
        label: "Tag Number",
        type: "text",
        validators: [Validators.required],
        initialValue: dto.tagNumber
      },
      description: {
        name: "description",
        label: "Description",
        type: "text",
        validators: [Validators.required],
        initialValue: dto.description
      },
      unit: {
        name: "unit",
        label: "Unit",
        type: "text",
        initialValue: dto.unit
      },
      tagged: {
        name: "tagged",
        label: "Tagged",
        type: "text",
        initialValue: dto.tagged
      },
      isoPos: {
        name: "isoPos",
        label: "Isolated Position",
        type: "select",
        options: isoPosOptions,
        initialValue: dto.isoPos?.id || null
      },
      normPos: {
        name: "normPos",
        label: "Normal Position",
        type: "select",
        options: normPosOptions,
        initialValue: dto.normPos?.id || null
      },
      specificLocation: {
        name: "specificLocation",
        label: "Specific Location",
        type: "text",
        initialValue: dto.specificLocation
      },
      standard: {
        name: "standard",
        label: "Standard",
        type: "text",
        initialValue: dto.standard
      },
      generalLocation: {
        name: "generalLocation",
        label: "General Location",
        type: "text",
        initialValue: dto.generalLocation
      },
      // Add other fields here...
      id: { name: "id", label: "ID", type: "text", initialValue: dto.id },
      equipmentIdList: {
        name: "equipmentIdList",
        label: "Equipment IDs",
        type: "multi-select",
        initialValue: dto.equipmentIdList
      },
      normalPosition: {
        name: "normalPosition",
        label: "Normal Position",
        type: "text",
        initialValue: dto.normalPosition
      },
      isolatedPosition: {
        name: "isolatedPosition",
        label: "Isolated Position",
        type: "text",
        initialValue: dto.isolatedPosition
      },
      fluid: {
        name: "fluid",
        label: "Fluid",
        type: "text",
        initialValue: dto.fluid
      },
      characteristicsJson: {
        name: "characteristicsJson",
        label: "Characteristics",
        type: "text",
        initialValue: dto.characteristicsJson
      },
      oldId: {
        name: "oldId",
        label: "Old ID",
        type: "text",
        initialValue: dto.oldId
      },
      objectType: {
        name: "objectType",
        label: "Object Type",
        type: "text",
        initialValue: dto.objectType
      },
      isUpdated: {
        name: "isUpdated",
        label: "Is Updated",
        type: "text",
        initialValue: dto.isUpdated
      },
      fileIds: {
        name: "fileIds",
        label: "File IDs",
        type: "text",
        initialValue: dto.fileIds
      },
      conflictStatus: {
        name: "conflictStatus",
        label: "Conflict Status",
        type: "text",
        initialValue: dto.conflictStatus
      },
      equipmentList: {
        name: "equipmentList",
        label: "Equipment List",
        type: "text"
      },
      lotos: { name: "lotos", label: "Lotos", type: "text" },
      name: {
        name: "name",
        label: "Name",
        type: "text",
        initialValue: dto.name
      },
      isVerified: {
        name: "isVerified",
        label: "Is Verified",
        type: "select",
        options: [
          { value: "true", label: "Yes" },
          { value: "false", label: "No" }
        ],
        initialValue: dto.isVerified?.toString()
      },
      zeroEnergyMethod: {
        name: "zeroEnergyMethod",
        label: "Zero Energy Method",
        type: "text",
        initialValue: dto.zeroEnergyMethod
      },
      zeroEnergy: {
        name: "zeroEnergy",
        label: "Zero Energy",
        type: "text",
        initialValue: dto.zeroEnergy
      },
      relatedLotoPointIds: {
        name: "relatedLotoPointIds",
        label: "Related LOTO Point IDs",
        type: "multi-select",
        initialValue: dto.relatedLotoPointIds
      },
      location: {
        name: "location",
        label: "Location",
        type: "select",
        options: [],
        initialValue: dto.location?.id || null
      },
      eqType: {
        name: "eqType",
        label: "Equipment Type",
        type: "select",
        options: [],
        initialValue: dto.eqType?.id || null
      },
      counterpartId: {
        name: "counterpartId",
        label: "Counterpart ID",
        type: "text",
        initialValue: dto.counterpartId?.toString() || null
      },
      isLabeled: {
        name: "isLabeled",
        label: "Labeled",
        type: "select",
        options: [
          { value: "true", label: "Yes" },
          { value: "false", label: "No" }
        ],
        initialValue: dto.isLabeled?.toString()
      },
      isLockable: {
        name: "isLockable",
        label: "Lockable",
        type: "select",
        options: [
          { value: "true", label: "Yes" },
          { value: "false", label: "No" }
        ],
        initialValue: dto.isLockable?.toString()
      },
      isProcessed: {
        name: "isProcessed",
        label: "Processed",
        type: "select",
        options: [
          { value: "true", label: "Yes" },
          { value: "false", label: "No" }
        ],
        initialValue: dto.isProcessed?.toString()
      },
      processingStatus: {
        name: "processingStatus",
        label: "Processing Status",
        type: "select",
        options: [],
        initialValue: dto.processingStatus?.id || null
      },
      modelFile: {
        name: "modelFile",
        label: "3D Model File",
        type: "text",
        initialValue: dto.modelFile?.name || null
      }
    };
    return fields.map((fieldName) => allFields[fieldName]);
  }
  // Add this method to the LotoPointDto class
  static toTableColumns(fields = [
    "unit",
    "tagNumber",
    "description",
    "specificLocation",
    "tagged",
    "lotos",
    "isoPos",
    "normPos"
  ]) {
    const allColumns = {
      unit: { id: "unit", header: "Unit", accessorKey: "unit" },
      tagNumber: {
        id: "tagNumber",
        header: "Tag Number",
        accessorKey: "tagNumber"
      },
      description: {
        id: "description",
        header: "Description",
        accessorKey: "description"
      },
      specificLocation: {
        id: "specificLocation",
        header: "Specific Location",
        accessorKey: "specificLocation"
      },
      tagged: { id: "tagged", header: "Tagging Status", accessorKey: "tagged" },
      lotos: {
        id: "lotos",
        header: "LOTOs",
        accessorFn: (item) => {
          if (Array.isArray(item.lotos)) {
            return item.lotos.map((loto) => loto.workScope).join(", ");
          }
          return "";
        }
      },
      isoPos: { id: "isoPos", header: "ISO Pos", accessorKey: "isoPos.name" },
      normPos: {
        id: "normPos",
        header: "Norm Pos",
        accessorKey: "normPos.name"
      },
      id: { id: "id", header: "ID", accessorKey: "id" },
      standard: { id: "standard", header: "Standard", accessorKey: "standard" },
      generalLocation: {
        id: "generalLocation",
        header: "General Location",
        accessorKey: "generalLocation"
      },
      equipmentIdList: {
        id: "equipmentIdList",
        header: "Equipment IDs",
        accessorKey: "equipmentIdList"
      },
      normalPosition: {
        id: "normalPosition",
        header: "Normal Position",
        accessorKey: "normalPosition"
      },
      isolatedPosition: {
        id: "isolatedPosition",
        header: "Isolated Position",
        accessorKey: "isolatedPosition"
      },
      fluid: {
        id: "fluid",
        header: "Fluid",
        accessorKey: "fluid"
      },
      characteristicsJson: {
        id: "characteristicsJson",
        header: "Characteristics",
        accessorKey: "characteristicsJson"
      },
      oldId: { id: "oldId", header: "Old ID", accessorKey: "oldId" },
      objectType: {
        id: "objectType",
        header: "Object Type",
        accessorKey: "objectType"
      },
      isUpdated: {
        id: "isUpdated",
        header: "Is Updated",
        accessorKey: "isUpdated"
      },
      fileIds: { id: "fileIds", header: "File IDs", accessorKey: "fileIds" },
      conflictStatus: {
        id: "conflictStatus",
        header: "Conflict Status",
        accessorKey: "conflictStatus"
      },
      equipmentList: {
        id: "equipmentList",
        header: "Equipment List",
        accessorKey: "equipmentList"
      },
      name: { id: "name", header: "Name", accessorKey: "name" },
      isVerified: {
        id: "isVerified",
        header: "Verified",
        accessorFn: (item) => item.isVerified ? "Yes" : "No",
        conditionalStyling: (item, column) => item.isVerified ? { "background-color": "#90EE90" } : { "background-color": "#FFCCCB" }
      },
      zeroEnergyMethod: {
        id: "zeroEnergyMethod",
        header: "Zero Energy Method",
        accessorKey: "zeroEnergyMethod"
      },
      zeroEnergy: {
        id: "zeroEnergy",
        header: "Zero Energy",
        accessorKey: "zeroEnergy.method"
      },
      relatedLotoPointIds: {
        id: "relatedLotoPointIds",
        header: "Related LOTO Point IDs",
        accessorKey: "relatedLotoPointIds"
      },
      location: {
        id: "location",
        header: "Location",
        accessorKey: "location.name"
      },
      eqType: {
        id: "eqType",
        header: "Equipment Type",
        accessorKey: "eqType.name"
      },
      counterpartId: {
        id: "counterpartId",
        header: "Counterpart ID",
        accessorKey: "counterpartId"
      },
      isLabeled: {
        id: "isLabeled",
        header: "Labeled",
        accessorFn: (item) => item.isLabeled ? "Yes" : "No",
        conditionalStyling: (item, column) => item.isLabeled ? { "background-color": "#90EE90" } : { "background-color": "#FFCCCB" }
      },
      isLockable: {
        id: "isLockable",
        header: "Lockable",
        accessorFn: (item) => item.isLockable ? "Yes" : "No",
        conditionalStyling: (item, column) => item.isLockable ? { "background-color": "#90EE90" } : { "background-color": "#FFCCCB" }
      },
      isProcessed: {
        id: "isProcessed",
        header: "Processed",
        accessorFn: (item) => item.isProcessed ? "Yes" : "No",
        conditionalStyling: (item, column) => item.isProcessed ? { "background-color": "#90EE90" } : { "background-color": "#FFCCCB" }
      },
      processingStatus: {
        id: "processingStatus",
        header: "Status",
        accessorKey: "processingStatus.name"
      },
      modelFile: {
        id: "modelFile",
        header: "3D Model",
        accessorFn: (item) => item.modelFile?.name || ""
      }
    };
    return fields.map((fieldName) => allColumns[fieldName]);
  }
  static isValidKey(key) {
    const validKeys = [
      "id",
      "unit",
      "tagged",
      "tagNumber",
      "description",
      "isoPos",
      "normPos",
      "specificLocation",
      "standard",
      "generalLocation",
      "equipmentIdList",
      "normalPosition",
      "isolatedPosition",
      "fluid",
      "characteristicsJson",
      "equipmentList",
      "oldId",
      "objectType",
      "isUpdated",
      "fileIds",
      "conflictStatus",
      "lotos",
      "isVerified",
      "zeroEnergyMethod",
      "counterpartId",
      "isLabeled",
      "isLockable",
      "isProcessed",
      "processingStatus",
      "modelFile"
    ];
    return validKeys.includes(key);
  }
  toIdModel() {
    const equipmentIds = this.equipmentList?.map((equipment) => equipment.id) || null;
    return new LotoPointIdDto({
      id: this.id,
      unit: this.unit,
      isVerified: this.isVerified,
      tagged: this.tagged,
      tagNumber: this.tagNumber,
      description: this.description,
      isoPos: this.isoPos?.id || null,
      isoPosId: this.isoPos?.id || null,
      normPos: this.normPos?.id || null,
      normPosId: this.normPos?.id || null,
      specificLocation: this.specificLocation,
      standard: this.standard,
      generalLocation: this.generalLocation,
      equipmentIdList: equipmentIds,
      equipmentList: equipmentIds,
      // Both fields should have the same IDs
      normalPosition: this.normalPosition,
      isolatedPosition: this.isolatedPosition,
      characteristicsJson: this.characteristicsJson,
      oldId: this.oldId,
      objectType: this.objectType,
      isUpdated: this.isUpdated,
      // fileIds: this.fileIds.split(',').map(id => id.trim()).filter(id => id !== ''),
      fileIds: this.fileIds,
      conflictStatus: this.conflictStatus,
      lotos: this.lotos?.map((loto) => loto.id) || null,
      lotoIds: this.lotos?.map((loto) => loto.id) || null,
      // Both fields should have the same IDs
      zeroEnergyMethod: this.zeroEnergyMethod,
      zeroEnergy: this.zeroEnergy ? {
        id: this.zeroEnergy.id || null,
        zeroEnergyTemplateId: typeof this.zeroEnergy.zeroEnergyTemplate === "number" ? this.zeroEnergy.zeroEnergyTemplate : this.zeroEnergy.zeroEnergyTemplate?.id || null,
        templateEquipmentIds: this.zeroEnergy.templateEquipment?.map((eq) => eq.id).filter((id) => id != null) || [],
        editShared: this.zeroEnergy.editShared || false
      } : null,
      location: this.location?.id || null,
      eqType: this.eqType?.id || null,
      counterpartId: this.counterpartId || null,
      processingStatus: this.processingStatus?.id || null,
      modelFileId: this.modelFile?.id || 0
    });
  }
  toOption() {
    const label = this.tagNumber && this.description ? `${this.tagNumber} - ${this.description}` : this.tagNumber || this.description || "No Tag Number or Description";
    return {
      value: this.id,
      label
    };
  }
  applyPresetValue(equipment) {
    Object.keys(equipment).forEach((key) => {
      if (_LotoPointDto.isValidKey(key)) {
        const value = equipment[key];
        if (value !== null && value !== void 0 && value !== "") {
          if (typeof value === "object" && !Array.isArray(value)) {
            if (value.id) {
              this[key] = value;
            }
          } else {
            this[key] = value;
          }
        }
      }
    });
    return this;
  }
};

// src/app/models/equipment/equipment-id.model.ts
var EquipmentIdDto = class _EquipmentIdDto extends BaseDto {
  tagNumber;
  description;
  specificLocation;
  eqTypeId;
  files;
  vendorId;
  locationId;
  systemId;
  coordinates;
  originalPictureSize;
  rotation;
  mainFile;
  mainFileId;
  lotoPointIds;
  isUpdated;
  conflictStatus;
  // Symbol fields for PID markup shapes
  symbolId;
  svgPath;
  constructor(data = {}) {
    super(data);
    this.tagNumber = data.tagNumber || null;
    this.description = data.description || null;
    this.specificLocation = data.specificLocation || null;
    this.eqTypeId = data.eqTypeId || null;
    this.files = data.files || null;
    this.vendorId = data.vendorId || null;
    this.locationId = data.locationId || null;
    this.systemId = data.systemId || null;
    this.coordinates = data.coordinates || null;
    this.originalPictureSize = data.originalPictureSize || null;
    this.rotation = data.rotation || null;
    this.mainFile = data.mainFile || null;
    this.mainFileId = data.mainFileId || null;
    this.lotoPointIds = data.lotoPointIds || null;
    this.isUpdated = data.isUpdated || null;
    this.conflictStatus = data.conflictStatus || null;
    this.symbolId = data.symbolId || null;
    this.svgPath = data.svgPath || null;
  }
  toJson() {
    return __spreadProps(__spreadValues({}, super.toJson()), {
      tagNumber: this.tagNumber || null,
      description: this.description || null,
      specificLocation: this.specificLocation || null,
      eqTypeId: this.eqTypeId || null,
      files: this.files || null,
      vendorId: this.vendorId || null,
      locationId: this.locationId || null,
      systemId: this.systemId || null,
      coordinates: this.coordinates || null,
      originalPictureSize: this.originalPictureSize || null,
      rotation: this.rotation || null,
      mainFile: this.mainFile || null,
      mainFileId: this.mainFileId || null,
      lotoPointIds: this.lotoPointIds || null,
      isUpdated: this.isUpdated || null,
      conflictStatus: this.conflictStatus || null,
      symbolId: this.symbolId || null,
      svgPath: this.svgPath || null
    });
  }
  static fromJson(json) {
    if (!json) {
      console.warn("Received null or undefined json in EquipmentIdDto.fromJson");
      return new _EquipmentIdDto();
    }
    return new _EquipmentIdDto(__spreadProps(__spreadValues({}, super.fromJson(json)), {
      tagNumber: json.tagNumber || null,
      description: json.description || null,
      specificLocation: json.specificLocation || null,
      eqTypeId: json.eqTypeId || null,
      files: json.files || null,
      vendorId: json.vendorId || null,
      locationId: json.locationId || null,
      systemId: json.systemId || null,
      coordinates: json.coordinates || null,
      originalPictureSize: json.originalPictureSize || null,
      rotation: json.rotation || null,
      mainFile: json.mainFile || null,
      mainFileId: json.mainFileId || null,
      lotoPointIds: json.lotoPointIds || null,
      isUpdated: json.isUpdated || null,
      conflictStatus: json.conflictStatus || null,
      symbolId: json.symbolId || null,
      svgPath: json.svgPath || null
    }));
  }
};

// src/app/models/equipment/equipment.model.ts
var EquipmentDto = class _EquipmentDto extends BaseDto {
  tagNumber;
  description;
  specificLocation;
  eqType;
  files;
  vendor;
  location;
  system;
  coordinates;
  originalPictureSize;
  rotation;
  mainFile;
  mainFileId;
  lotoPoints;
  isUpdated;
  conflictStatus;
  mainFileObject;
  // Symbol fields for PID markup shapes
  symbolId;
  svgPath;
  constructor(data = {}) {
    super(data);
    this.tagNumber = data.tagNumber ?? null;
    this.description = data.description ?? null;
    this.specificLocation = data.specificLocation ?? null;
    this.eqType = super.setNestedObjectById(data.eqType, new ValueDto());
    this.files = data.files ?? [];
    this.vendor = super.setNestedObjectById(data.vendor, new ValueDto());
    this.location = super.setNestedObjectById(data.location, new ValueDto());
    this.system = super.setNestedObjectById(data.system, new ValueDto());
    this.coordinates = data.coordinates ?? null;
    this.originalPictureSize = data.originalPictureSize ?? null;
    this.rotation = data.rotation ?? null;
    this.mainFile = data.mainFile ?? null;
    this.mainFileId = data.mainFileId ?? null;
    this.lotoPoints = data.lotoPoints ?? [];
    this.isUpdated = data.isUpdated ?? null;
    this.conflictStatus = data.conflictStatus ?? null;
    this.mainFileObject = data.mainFileObject ?? null;
    this.symbolId = data.symbolId ?? null;
    this.svgPath = data.svgPath ?? null;
  }
  // Serialization method
  toJson() {
    return __spreadProps(__spreadValues({}, super.toJson()), {
      tagNumber: this.tagNumber || null,
      description: this.description || null,
      specificLocation: this.specificLocation || null,
      eqType: this.eqType ? this.eqType.toJson() : null,
      files: Array.isArray(this.files) ? this.files : null,
      vendor: this.vendor ? this.vendor.toJson() : null,
      location: this.location ? this.location.toJson() : null,
      system: this.system ? this.system.toJson() : null,
      coordinates: this.coordinates || null,
      originalPictureSize: this.originalPictureSize || null,
      rotation: this.rotation || null,
      mainFile: this.mainFile || null,
      mainFileId: this.mainFileId || null,
      lotoPoints: this.lotoPoints?.map((point) => point ? point.toJson() : null).filter(Boolean),
      isUpdated: this.isUpdated || null,
      conflictStatus: this.conflictStatus || null,
      mainFileObject: this.mainFileObject ? FileDto.fromJson(this.mainFileObject).toJson() : null,
      symbolId: this.symbolId || null,
      svgPath: this.svgPath || null
    });
  }
  // Deserialization method (static)
  static fromJson(json) {
    if (!json) {
      console.warn("Received null or undefined json in EquipmentDto.fromJson");
      return new _EquipmentDto();
    }
    return new _EquipmentDto(__spreadProps(__spreadValues({}, super.fromJson(json)), {
      tagNumber: json.tagNumber || null,
      description: json.description || null,
      specificLocation: json.specificLocation || null,
      eqType: json.eqType ? ValueDto.fromJson(json.eqType) : null,
      files: Array.isArray(json.files) ? json.files : [],
      vendor: json.vendor ? ValueDto.fromJson(json.vendor) : null,
      location: json.location ? ValueDto.fromJson(json.location) : null,
      system: json.system ? ValueDto.fromJson(json.system) : null,
      coordinates: json.coordinates || null,
      originalPictureSize: json.originalPictureSize || null,
      rotation: json.rotation || null,
      mainFile: json.mainFile || null,
      mainFileId: json.mainFileId || null,
      lotoPoints: json.lotoPoints ? json.lotoPoints.map((point) => LotoPointDto.fromJson(point)) : null,
      isUpdated: json.isUpdated || null,
      conflictStatus: json.conflictStatus || null,
      mainFileObject: json.mainFileObject ? FileDto.fromJson(json.mainFileObject) : null,
      symbolId: json.symbolId || null,
      svgPath: json.svgPath || null
    }));
  }
  toIdModel() {
    return new EquipmentIdDto({
      id: this.id,
      tagNumber: this.tagNumber,
      description: this.description,
      specificLocation: this.specificLocation,
      eqTypeId: this.eqType?.id || 0,
      files: this.files,
      vendorId: this.vendor?.id || 0,
      locationId: this.location?.id || 0,
      systemId: this.system?.id || 0,
      coordinates: this.coordinates,
      originalPictureSize: this.originalPictureSize,
      rotation: this.rotation,
      mainFile: this.mainFile,
      mainFileId: this.mainFileId ?? this.mainFileObject?.id,
      lotoPointIds: this.lotoPoints?.map((point) => point.id) || null,
      isUpdated: this.isUpdated,
      conflictStatus: this.conflictStatus,
      isVerified: this.isVerified,
      symbolId: this.symbolId,
      svgPath: this.svgPath
    });
  }
  toShapeObject() {
    try {
      const cleanedCoords = this.coordinates?.replace(/\\/g, "").replace(/^"(.*)"$/, "$1");
      if (!cleanedCoords)
        return null;
      let coordsObj;
      try {
        coordsObj = JSON.parse(cleanedCoords);
      } catch {
        const parts = cleanedCoords.split(",");
        coordsObj = {
          startX: parts[0].split(":")[1],
          startY: parts[1].split(":")[1],
          endX: parts[2].split(":")[1],
          endY: parts[3].split(":")[1],
          width: parts[4].split(":")[1],
          height: parts[5].split(":")[1]
        };
      }
      const startX = Number(coordsObj.startX);
      const startY = Number(coordsObj.startY);
      const endX = Number(coordsObj.endX);
      const endY = Number(coordsObj.endY);
      if (isNaN(startX) || isNaN(startY) || isNaN(endX) || isNaN(endY)) {
        throw new Error("Invalid coordinate values");
      }
      const width = Math.abs(endX - startX);
      const height = Math.abs(endY - startY);
      const sizeMatch = this.originalPictureSize?.match(/width:(\d+),height:(\d+)/);
      if (!sizeMatch) {
        throw new Error("Invalid original picture size format");
      }
      const originalWidth = Number(sizeMatch[1]);
      const originalHeight = Number(sizeMatch[2]);
      if (isNaN(originalWidth) || isNaN(originalHeight)) {
        throw new Error("Invalid original picture size values");
      }
      return {
        id: this.id,
        type: "rectangle",
        color: this.getShapeColor(),
        originalPictureWidth: originalWidth,
        originalPictureHeight: originalHeight,
        isSelected: false,
        isSecondarySelected: false,
        x: Math.min(startX, endX),
        y: Math.min(startY, endY),
        width,
        height,
        scaleToCurrentImage: 1,
        currentImgHeigth: 1,
        currentImgWidth: 1
      };
    } catch (error) {
      console.error("Error parsing coordinates:", error);
      return {
        id: this.id,
        type: "rectangle",
        color: "#FF0000",
        originalPictureWidth: 0,
        originalPictureHeight: 0,
        isSelected: false,
        isSecondarySelected: false,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        scaleToCurrentImage: 0,
        currentImgHeigth: 0,
        currentImgWidth: 0
      };
    }
  }
  static createEquipmentFromShape(shape) {
    if (shape.type !== "rectangle") {
      throw new Error("Only rectangle shapes are supported for equipment");
    }
    const coordinates = JSON.stringify({
      startX: shape.x,
      startY: shape.y,
      endX: shape.x + shape.width,
      endY: shape.y + shape.height,
      width: shape.width,
      height: shape.height
    }).replace(/^"|"$/g, "").replace(/\\/g, "").replace(/"(\w+)":/g, "$1:");
    const originalPictureSize = `width:${shape.originalPictureWidth},height:${shape.originalPictureHeight}`;
    const newEq = new _EquipmentDto({
      coordinates,
      originalPictureSize
    });
    return newEq;
  }
  setCoordinatesFromShape(shape) {
    if (shape.type !== "rectangle") {
      throw new Error("Only rectangle shapes are supported for equipment");
    }
    const coordinates = JSON.stringify({
      startX: shape.x,
      startY: shape.y,
      endX: shape.x + shape.width,
      endY: shape.y + shape.height,
      width: shape.width,
      height: shape.height
    }).replace(/^"|"$/g, "").replace(/\\/g, "").replace(/"(\w+)":/g, "$1:");
    const originalPictureSize = `width:${shape.originalPictureWidth},height:${shape.originalPictureHeight}`;
    this.coordinates = coordinates;
    this.originalPictureSize = originalPictureSize;
    return this;
  }
  getShapeColor() {
    switch (this.getNormalLotoPosition().toLowerCase().trim()) {
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
  getNormalLotoPosition() {
    if (this.lotoPoints && this.lotoPoints.length > 0) {
      const firstLotoPoint = this.lotoPoints[0];
      if (firstLotoPoint && firstLotoPoint.normPos && firstLotoPoint.normPos.name) {
        return firstLotoPoint.normPos.name;
      }
    }
    return "";
  }
  static isValidKey(key) {
    const validKeys = [
      "id",
      "tagNumber",
      "description",
      "specificLocation",
      "eqType",
      "files",
      "vendor",
      "location",
      "system",
      "coordinates",
      "originalPictureSize",
      "mainFile",
      "lotoPoints",
      "isUpdated",
      "conflictStatus",
      "isVerified"
    ];
    return validKeys.includes(key);
  }
  static toFormFields(dto, eqTypeOptions, vendorOptions, locationOptions, systemOptions, fields = ["tagNumber", "description", "specificLocation", "eqType", "vendor", "location", "system"]) {
    const allFields = {
      id: { name: "id", label: "ID", type: "text", initialValue: dto.id },
      tagNumber: { name: "tagNumber", label: "Tag Number", type: "text", validators: [Validators.required], initialValue: dto.tagNumber },
      description: { name: "description", label: "Description", type: "text", validators: [Validators.required], initialValue: dto.description },
      specificLocation: { name: "specificLocation", label: "Specific Location", type: "text", initialValue: dto.specificLocation },
      eqType: {
        name: "eqType",
        label: "Equipment Type",
        type: "select",
        options: eqTypeOptions,
        initialValue: dto.eqType?.id || null
      },
      files: { name: "files", label: "Files", type: "multi-select", initialValue: dto.files },
      vendor: {
        name: "vendor",
        label: "Vendor",
        type: "select",
        options: vendorOptions,
        initialValue: dto.vendor?.id || null
      },
      location: {
        name: "location",
        label: "Location",
        type: "select",
        options: locationOptions,
        initialValue: dto.location?.id || null
      },
      system: {
        name: "system",
        label: "System",
        type: "select",
        options: systemOptions,
        initialValue: dto.system?.id || null
      },
      coordinates: { name: "coordinates", label: "Coordinates", type: "text", initialValue: dto.coordinates },
      originalPictureSize: { name: "originalPictureSize", label: "Original Picture Size", type: "text", initialValue: dto.originalPictureSize },
      rotation: { name: "rotation", label: "Rotation", type: "text", initialValue: dto.rotation },
      mainFile: { name: "mainFile", label: "Main File", type: "text", initialValue: dto.mainFile },
      mainFileId: { name: "mainFileId", label: "Main File ID", type: "text", initialValue: dto.mainFileId },
      lotoPoints: { name: "lotoPoints", label: "LOTO Points", type: "multi-select", initialValue: dto.lotoPoints?.map((point) => point.id) || null },
      isUpdated: { name: "isUpdated", label: "Is Updated", type: "text", initialValue: dto.isUpdated },
      conflictStatus: { name: "conflictStatus", label: "Conflict Status", type: "text", initialValue: dto.conflictStatus },
      isVerified: {
        name: "isVerified",
        label: "Is Verified",
        type: "select",
        options: [
          { value: "true", label: "Yes" },
          { value: "false", label: "No" }
        ],
        initialValue: dto.isVerified?.toString()
      },
      name: { name: "name", label: "Name", type: "text", initialValue: dto.name },
      objectType: { name: "objectType", label: "Object Type", type: "text", initialValue: dto.objectType },
      mainFileObject: { name: "mainFileObject", label: "Main File", type: "text", initialValue: dto.mainFile },
      symbolId: { name: "symbolId", label: "Symbol ID", type: "text", initialValue: dto.symbolId },
      svgPath: { name: "svgPath", label: "SVG Path", type: "text", initialValue: dto.svgPath }
    };
    return fields.map((fieldName) => allFields[fieldName]);
  }
  applyPresetValue(equipment) {
    Object.keys(equipment).forEach((key) => {
      if (_EquipmentDto.isValidKey(key)) {
        const value = equipment[key];
        if (value !== null && value !== void 0 && value !== "") {
          if (typeof value === "object" && !Array.isArray(value)) {
            if (value.id) {
              this[key] = value;
            }
          } else {
            this[key] = value;
          }
        }
      }
    });
    return this;
  }
};

// src/app/models/permits/work-area.model.ts
var WorkAreaDto = class _WorkAreaDto extends BaseDto {
  description;
  areaType;
  constantHazards;
  constantHotWorkMeasures;
  constantConfinedSpaceHazards;
  constantLotoIds;
  locationIds;
  shapeId;
  constructor(data = {}) {
    super(data);
    this.description = data.description ?? null;
    this.areaType = data.areaType ?? null;
    this.constantHazards = data.constantHazards ? new SwHazards(data.constantHazards) : null;
    this.constantHotWorkMeasures = data.constantHotWorkMeasures ? new HotWorkMeasures(data.constantHotWorkMeasures) : null;
    this.constantConfinedSpaceHazards = data.constantConfinedSpaceHazards ? new ConfinedSpaceHazards(data.constantConfinedSpaceHazards) : null;
    this.constantLotoIds = data.constantLotoIds ?? [];
    this.locationIds = data.locationIds ?? [];
    this.shapeId = data.shapeId ?? null;
  }
  toJson() {
    return __spreadProps(__spreadValues({}, super.toJson()), {
      description: this.description,
      areaType: this.areaType,
      constantHazards: this.constantHazards,
      constantHotWorkMeasures: this.constantHotWorkMeasures,
      constantConfinedSpaceHazards: this.constantConfinedSpaceHazards,
      constantLotoIds: this.constantLotoIds,
      locationIds: this.locationIds,
      shapeId: this.shapeId
    });
  }
  static fromJson(json) {
    if (!json)
      return new _WorkAreaDto();
    return new _WorkAreaDto({
      id: json.id || 0,
      name: json.name || "",
      description: json.description,
      areaType: json.areaType,
      constantHazards: json.constantHazards,
      constantHotWorkMeasures: json.constantHotWorkMeasures,
      constantConfinedSpaceHazards: json.constantConfinedSpaceHazards,
      constantLotoIds: json.constantLotoIds || [],
      locationIds: json.locationIds || [],
      shapeId: json.shapeId
    });
  }
  static toFormFields(entity, lotoStandardOptions = [], locationOptions = []) {
    return [
      {
        name: "name",
        label: "Area Name",
        type: "text",
        validators: [Validators.required],
        initialValue: entity.name ?? ""
      },
      {
        name: "description",
        label: "Description",
        type: "textarea",
        initialValue: entity.description ?? ""
      },
      {
        name: "areaType",
        label: "Area Type",
        type: "value-select",
        categoryAlias: "workAreaType",
        canManageValues: true,
        initialValue: entity.areaType?.id ?? null
      },
      {
        name: "constantLotoIds",
        label: "LOTO Standards",
        type: "loto-standard-select",
        options: lotoStandardOptions,
        initialValue: entity.constantLotoIds ?? []
      },
      {
        name: "locationIds",
        label: "Locations",
        type: "multi-select",
        options: locationOptions,
        initialValue: entity.locationIds ?? []
      },
      ..._WorkAreaDto.getHazardFields(entity.constantHazards),
      ..._WorkAreaDto.getHotWorkMeasureFields(entity.constantHotWorkMeasures),
      ..._WorkAreaDto.getConfinedSpaceHazardFields(entity.constantConfinedSpaceHazards)
    ];
  }
  static getHazardFields(hazardsDto) {
    const hazards = hazardsDto || new SwHazards();
    const group = { label: "Constant Hazards", orientation: "horizontal" };
    return [
      { name: "constantHazards.highTemp", label: "High Temp", type: "checkbox", initialValue: hazards.highTemp, group },
      { name: "constantHazards.highPressure", label: "High Pressure", type: "checkbox", initialValue: hazards.highPressure, group },
      { name: "constantHazards.energized", label: "Energized", type: "checkbox", initialValue: hazards.energized, group },
      { name: "constantHazards.storedEnergy", label: "Stored Energy", type: "checkbox", initialValue: hazards.storedEnergy, group },
      { name: "constantHazards.eyeHazard", label: "Eye Hazard", type: "checkbox", initialValue: hazards.eyeHazard, group },
      { name: "constantHazards.egressAccess", label: "Egress/Access", type: "checkbox", initialValue: hazards.egressAccess, group },
      { name: "constantHazards.fireHazard", label: "Fire Hazard", type: "checkbox", initialValue: hazards.fireHazard, group },
      { name: "constantHazards.chemicalExposure", label: "Chemical Exposure", type: "checkbox", initialValue: hazards.chemicalExposure, group },
      { name: "constantHazards.confinedSpace", label: "Confined Space", type: "checkbox", initialValue: hazards.confinedSpace ?? false, group },
      { name: "constantHazards.highNoise", label: "High Noise", type: "checkbox", initialValue: hazards.highNoise, group },
      { name: "constantHazards.dustParticulate", label: "Dust/Particulate", type: "checkbox", initialValue: hazards.dustParticulate, group },
      { name: "constantHazards.combustibleDust", label: "Combustible Dust", type: "checkbox", initialValue: hazards.combustibleDust, group },
      { name: "constantHazards.hotSurface", label: "Hot Surface", type: "checkbox", initialValue: hazards.hotSurface, group },
      { name: "constantHazards.slippery", label: "Slippery", type: "checkbox", initialValue: hazards.slippery, group },
      { name: "constantHazards.ventilationRequired", label: "Ventilation Required", type: "checkbox", initialValue: hazards.ventilationRequired, group },
      { name: "constantHazards.elevatedSurface", label: "Elevated Surface", type: "checkbox", initialValue: hazards.elevatedSurface, group },
      { name: "constantHazards.liftingHazard", label: "Lifting Hazard", type: "checkbox", initialValue: hazards.liftingHazard, group },
      { name: "constantHazards.handTraps", label: "Hand Traps", type: "checkbox", initialValue: hazards.handTraps, group },
      { name: "constantHazards.heatColdStress", label: "Heat/Cold Stress", type: "checkbox", initialValue: hazards.heatColdStress, group },
      { name: "constantHazards.environmental", label: "Environmental", type: "checkbox", initialValue: hazards.environmental, group }
    ];
  }
  static getHotWorkMeasureFields(measuresDto) {
    const measures = measuresDto || new HotWorkMeasures();
    const group = { label: "Constant Hot Work Measures", orientation: "horizontal" };
    return [
      { name: "constantHotWorkMeasures.areaIsClean", label: "Area is Clean", type: "checkbox", initialValue: measures.areaIsClean, group },
      { name: "constantHotWorkMeasures.flammablesAreSecured", label: "Flammables Secured", type: "checkbox", initialValue: measures.flammablesAreSecured, group },
      { name: "constantHotWorkMeasures.noCombustibleDustOrDebrisPresent", label: "No Combustible Dust/Debris", type: "checkbox", initialValue: measures.noCombustibleDustOrDebrisPresent, group },
      { name: "constantHotWorkMeasures.radiativeHeatPreventiveMeasuresAreTaken", label: "Radiative Heat Prevention", type: "checkbox", initialValue: measures.radiativeHeatPreventiveMeasuresAreTaken, group },
      { name: "constantHotWorkMeasures.vesselsArePurged", label: "Vessels Purged", type: "checkbox", initialValue: measures.vesselsArePurged, group },
      { name: "constantHotWorkMeasures.openingsAreCovered", label: "Openings Covered", type: "checkbox", initialValue: measures.openingsAreCovered, group },
      { name: "constantHotWorkMeasures.ductVentilationIsSecured", label: "Duct Ventilation Secured", type: "checkbox", initialValue: measures.ductVentilationIsSecured, group },
      { name: "constantHotWorkMeasures.lockOutIsCompleted", label: "Lock-Out Completed", type: "checkbox", initialValue: measures.lockOutIsCompleted, group },
      { name: "constantHotWorkMeasures.communicationIsEstablished", label: "Communication Established", type: "checkbox", initialValue: measures.communicationIsEstablished, group },
      { name: "constantHotWorkMeasures.fireWatchIsAwareOfDuties", label: "Fire Watch Aware of Duties", type: "checkbox", initialValue: measures.fireWatchIsAwareOfDuties, group },
      { name: "constantHotWorkMeasures.fireExtinguisherPresent", label: "Fire Extinguisher Present", type: "checkbox", initialValue: measures.fireExtinguisherPresent, group },
      { name: "constantHotWorkMeasures.fireProtectionIsInService", label: "Fire Protection in Service", type: "checkbox", initialValue: measures.fireProtectionIsInService, group }
    ];
  }
  static getConfinedSpaceHazardFields(hazardsDto) {
    const hazards = hazardsDto || new ConfinedSpaceHazards();
    const group = { label: "Constant Confined Space Hazards", orientation: "horizontal" };
    return [
      { name: "constantConfinedSpaceHazards.oxygenDeficiency", label: "Oxygen Deficiency", type: "checkbox", initialValue: hazards.oxygenDeficiency, group },
      { name: "constantConfinedSpaceHazards.flammableGas", label: "Flammable Gas", type: "checkbox", initialValue: hazards.flammableGas, group },
      { name: "constantConfinedSpaceHazards.combustibleDust", label: "Combustible Dust", type: "checkbox", initialValue: hazards.combustibleDust, group },
      { name: "constantConfinedSpaceHazards.toxicGas", label: "Toxic Gas", type: "checkbox", initialValue: hazards.toxicGas, group },
      { name: "constantConfinedSpaceHazards.rotatingEquipment", label: "Rotating Equipment", type: "checkbox", initialValue: hazards.rotatingEquipment, group },
      { name: "constantConfinedSpaceHazards.electricalShock", label: "Electrical Shock", type: "checkbox", initialValue: hazards.electricalShock, group },
      { name: "constantConfinedSpaceHazards.entrapment", label: "Entrapment", type: "checkbox", initialValue: hazards.entrapment, group },
      { name: "constantConfinedSpaceHazards.engulfment", label: "Engulfment", type: "checkbox", initialValue: hazards.engulfment, group },
      { name: "constantConfinedSpaceHazards.heatStress", label: "Heat Stress", type: "checkbox", initialValue: hazards.heatStress, group }
    ];
  }
  static toTableColumns() {
    return [
      { id: "name", header: "Name", accessorKey: "name" },
      { id: "description", header: "Description", accessorKey: "description" },
      { id: "areaType", header: "Area Type", accessorFn: (item) => item.areaType?.name ?? "" }
    ];
  }
};

export {
  BACKSPACE,
  TAB,
  ENTER,
  SHIFT,
  CONTROL,
  ALT,
  ESCAPE,
  SPACE,
  PAGE_UP,
  PAGE_DOWN,
  END,
  HOME,
  LEFT_ARROW,
  UP_ARROW,
  RIGHT_ARROW,
  DOWN_ARROW,
  DELETE,
  ZERO,
  NINE,
  A,
  Z,
  META,
  MAC_META,
  _getShadowRoot,
  _getFocusedElementPierceShadowDom,
  _getEventTarget,
  _bindEventWithOptions,
  _CdkPrivateStyleLoader,
  coerceArray,
  _IdGenerator,
  hasModifierKey,
  ComponentPortal,
  TemplatePortal,
  BasePortalOutlet,
  DomPortalOutlet,
  CdkPortal,
  CdkPortalOutlet,
  PortalModule,
  OverlayConfig,
  OverlayContainer,
  OverlayRef,
  Overlay,
  CdkOverlayOrigin,
  CdkConnectedOverlay,
  OverlayModule,
  ValueDto,
  HotWorkMeasures,
  HotWorkDto,
  ConfinedSpaceHazards,
  ConfinedSpaceDto,
  SwHazards,
  SafeWorkDto,
  WorkAreaDto,
  FileDto,
  EquipmentDto,
  UserDto,
  LockDto,
  LotoBoxDto,
  LotoDto,
  LotoPointIdDto,
  ZeroEnergyDto,
  LotoPointDto
};
//# sourceMappingURL=chunk-B7QPVHEX.js.map
