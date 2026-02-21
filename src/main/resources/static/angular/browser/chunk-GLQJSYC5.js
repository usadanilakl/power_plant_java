import {
  BaseDto,
  BehaviorSubject,
  DestroyRef,
  HttpClient,
  Validators,
  computed,
  environment,
  inject,
  map,
  signal,
  switchMap,
  takeUntilDestroyed,
  tap,
  toSignal,
  ɵɵdefineInjectable,
  ɵɵinject
} from "./chunk-AVNJ6D7Z.js";
import {
  __spreadProps,
  __spreadValues
} from "./chunk-TXDUYLVM.js";

// src/app/features/form-designer-refactored/models/form-container.model.ts
var FormContainerDto = class _FormContainerDto extends BaseDto {
  content;
  formControlKey;
  contentType;
  position;
  size;
  style;
  contentStyle;
  groupId;
  pageNumber;
  locked;
  constructor(data = {}) {
    super(data);
    this.content = data.content ?? null;
    this.formControlKey = data.formControlKey ?? null;
    this.contentType = data.contentType ?? "text";
    this.position = data.position ?? { x: 0, y: 0 };
    this.size = data.size ?? { width: 100, height: 100 };
    this.groupId = data.groupId ?? null;
    this.pageNumber = data.pageNumber ?? 1;
    this.locked = data.locked ?? false;
    const defaultStyles = {
      position: "absolute",
      display: "flex",
      borderStyle: "solid",
      borderWidth: "1px",
      borderColor: "black",
      borderRadius: "0px",
      padding: "0px",
      boxSizing: "border-box",
      backgroundColor: "#f9f9f9",
      borderTopWidth: "1px",
      borderRightWidth: "1px",
      borderBottomWidth: "1px",
      borderLeftWidth: "1px"
    };
    this.style = __spreadValues(__spreadValues({}, defaultStyles), data.style);
    this.contentStyle = data.contentStyle ?? {};
  }
  toJson() {
    return __spreadProps(__spreadValues({}, super.toJson()), {
      content: JSON.stringify(this.content),
      position: JSON.stringify(this.position),
      size: JSON.stringify(this.size),
      style: JSON.stringify(this.style),
      groupId: this.groupId,
      contentType: this.contentType,
      pageNumber: this.pageNumber,
      locked: this.locked,
      contentStyle: JSON.stringify(this.contentStyle)
    });
  }
  static fromJson(json) {
    return new _FormContainerDto(__spreadProps(__spreadValues({}, super.fromJson(json)), {
      content: json.contentJson ? JSON.parse(json.contentJson) : null,
      position: json.positionJson ? JSON.parse(json.positionJson) : { x: 0, y: 0 },
      size: json.sizeJson ? JSON.parse(json.sizeJson) : { width: 100, height: 100 },
      style: json.styleJson ? JSON.parse(json.styleJson) : {},
      groupId: json.groupId,
      contentType: json.contentType ?? "text",
      pageNumber: json.pageNumber ?? 1,
      locked: json.locked ?? false,
      contentStyle: json.contentStyleJson ? JSON.parse(json.contentStyleJson) : {}
    }));
  }
};

// src/app/features/form-designer-refactored/models/printable-form.model.ts
var PrintableFormDto = class _PrintableFormDto extends BaseDto {
  formContainers;
  size;
  formType;
  isPrimary;
  constructor(data = {}) {
    super(data);
    this.formContainers = data.formContainers?.map((fc) => new FormContainerDto(fc)) ?? [];
    this.size = data.size ?? { width: 8.5, height: 11 };
    this.formType = data.formType || "";
    this.isPrimary = data.isPrimary ?? false;
  }
  toJson() {
    return __spreadProps(__spreadValues({}, super.toJson()), {
      formContainers: this.formContainers.map((fc) => fc.toJson()),
      size: this.size ?? { width: 8.5, height: 11 },
      formType: this.formType || "",
      isPrimary: this.isPrimary ?? false
    });
  }
  static fromJson(json) {
    return new _PrintableFormDto(__spreadProps(__spreadValues({}, super.fromJson(json)), {
      formContainers: Array.isArray(json.formContainers) ? json.formContainers.map((fc) => FormContainerDto.fromJson(fc)) : [],
      size: json.size ?? { width: 8.5, height: 11 },
      formType: json.formType || "",
      isPrimary: json.isPrimary ?? false
    }));
  }
  static isValidKey(key) {
    return [
      "id",
      "name",
      "objectType",
      "isVerified",
      "formContainers",
      "size",
      "formType"
    ].includes(key);
  }
  static toFormFields(dto, fields = ["name", "formType", "isPrimary"]) {
    const allFields = {
      id: { name: "id", label: "ID", type: "text", initialValue: dto.id },
      name: {
        name: "name",
        label: "Form Name",
        type: "text",
        validators: [Validators.required],
        initialValue: dto.name ?? ""
      },
      formType: {
        name: "formType",
        label: "Form Type",
        type: "select",
        validators: [Validators.required],
        initialValue: dto.formType,
        options: [
          { value: "SafeWork", label: "Safe Work" },
          { value: "HotWork", label: "Hot Work" },
          { value: "ConfinedSpace", label: "Confined Space" },
          { value: "WorkRequest", label: "Work Request" },
          { value: "Loto", label: "LOTO" },
          { value: "Jha", label: "JHA" },
          { value: "JobStep", label: "Job Step" }
        ]
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
      objectType: { name: "objectType", label: "Object Type", type: "text", initialValue: dto.objectType },
      formContainers: { name: "formContainers", label: "Form Containers", type: "text" },
      size: { name: "size", label: "Size", type: "text" },
      isPrimary: { name: "isPrimary", label: "Primary", type: "checkbox", initialValue: dto.isPrimary ?? false }
    };
    return fields.map((fieldName) => allFields[fieldName]);
  }
  static toTableColumns(fields = ["name", "formType", "isVerified"]) {
    const allColumns = {
      id: { id: "id", header: "ID", accessorKey: "id" },
      name: { id: "name", header: "Form Name", accessorKey: "name" },
      formType: { id: "formType", header: "Form Type", accessorKey: "formType" },
      isVerified: {
        id: "isVerified",
        header: "Verified",
        accessorFn: (item) => item.isVerified ? "Yes" : "No",
        conditionalStyling: (item) => item.isVerified ? { "background-color": "#90EE90" } : { "background-color": "#FFCCCB" }
      },
      objectType: { id: "objectType", header: "Object Type", accessorKey: "objectType" },
      formContainers: { id: "formContainers", header: "Form Containers", accessorKey: "formContainers" },
      size: { id: "size", header: "Size", accessorKey: "size" },
      isPrimary: { id: "isPrimary", header: "Primary", accessorKey: "isPrimary" }
    };
    return fields.map((fieldName) => allColumns[fieldName]);
  }
  addFormContainer(formContainer) {
    this.formContainers.push(formContainer);
  }
  removeFormContainer(formContainer) {
    this.formContainers = this.formContainers.filter((fc) => fc.id !== formContainer.id);
  }
};

// src/app/features/form-designer-refactored/services/form-api.service.ts
var FormApiService = class _FormApiService {
  http;
  formsUrl = `${environment.apiUrl}/forms`;
  containersUrl = `${environment.apiUrl}/form-containers`;
  constructor(http) {
    this.http = http;
  }
  // --- Form endpoints ---
  getAllForms() {
    return this.http.get(`${this.formsUrl}/get-all`);
  }
  getFormById(id) {
    return this.http.get(`${this.formsUrl}/get-by-id/${id}`);
  }
  saveForm(form) {
    return this.http.post(`${this.formsUrl}/save`, form);
  }
  addContainerToForm(formId, containerId) {
    return this.http.post(`${this.formsUrl}/add/${containerId}/to/${formId}`, {});
  }
  addAllContainers(formId, containers) {
    return this.http.post(`${this.formsUrl}/add-all/${formId}`, containers);
  }
  copyForm(formId) {
    return this.http.post(`${this.formsUrl}/copy/${formId}`, {});
  }
  getPrimaryFormByType(permitType) {
    return this.http.get(`${this.formsUrl}/get-primary-form-by-type/${permitType}`);
  }
  // --- Container endpoints ---
  getAllContainers() {
    return this.http.get(`${this.containersUrl}/get-all`);
  }
  getContainerById(id) {
    return this.http.get(`${this.containersUrl}/get-by-id/${id}`);
  }
  saveContainer(container) {
    return this.http.post(`${this.containersUrl}/save`, container);
  }
  saveAllContainers(containers) {
    return this.http.post(`${this.containersUrl}/save-all`, containers);
  }
  deleteContainer(id) {
    return this.http.delete(`${this.containersUrl}/${id}`);
  }
  deleteAllContainers(ids) {
    return this.http.post(`${this.containersUrl}/delete-all`, ids);
  }
  static \u0275fac = function FormApiService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _FormApiService)(\u0275\u0275inject(HttpClient));
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _FormApiService, factory: _FormApiService.\u0275fac, providedIn: "root" });
};

// src/app/features/form-designer-refactored/services/form-state.service.ts
var FormStateService = class _FormStateService {
  api = inject(FormApiService);
  destroyRef = inject(DestroyRef);
  currentEntity;
  currentEntityFields = [];
  // --- Observables ---
  formsSubject = new BehaviorSubject([]);
  allForms$ = this.formsSubject.asObservable();
  formSubject = new BehaviorSubject(new PrintableFormDto());
  form$ = this.formSubject.asObservable();
  formContainersSubject = new BehaviorSubject([]);
  formContainers$ = this.formContainersSubject.asObservable();
  allContainers = toSignal(this.formContainers$, { initialValue: [] });
  // --- Signals ---
  currentPage = signal(1);
  selectedContainers = signal([]);
  hoveredContainer = signal(null);
  propertiesOfContainer = signal(null);
  // --- Computed ---
  currentPageContainers = computed(() => {
    const page = this.currentPage();
    return this.allContainers().filter((c) => (c.pageNumber ?? 1) === page);
  });
  totalPages = computed(() => {
    const containers = this.allContainers();
    if (!containers || containers.length === 0)
      return 1;
    return containers.reduce((max, c) => {
      const p = c.pageNumber ?? 1;
      return p > max ? p : max;
    }, 1);
  });
  constructor() {
    this.loadForms();
  }
  // ==================== Form CRUD ====================
  loadForms() {
    this.api.getAllForms().pipe(takeUntilDestroyed(this.destroyRef), map((r) => r.responseData)).subscribe({
      next: (forms) => this.formsSubject.next(forms),
      error: (err) => console.error("Error loading forms:", err)
    });
  }
  setCurrentFormById(formId) {
    this.api.getFormById(formId).pipe(takeUntilDestroyed(this.destroyRef), map((r) => r.responseData)).subscribe({
      next: (form) => {
        this.formSubject.next(form);
        this.formContainersSubject.next(form.formContainers);
      },
      error: (err) => console.error("Error loading form:", err)
    });
  }
  setCurrentFormWithDto(dto) {
    this.formSubject.next(dto);
    this.formContainersSubject.next(dto.formContainers);
  }
  updateForm(formDto) {
    this.api.saveForm(formDto).pipe(takeUntilDestroyed(this.destroyRef), map((r) => new PrintableFormDto(r.responseData))).subscribe({
      next: (form) => {
        this.formSubject.next(form);
        this.updateFormInArray(form);
      },
      error: (err) => console.error("Error updating form:", err)
    });
  }
  updateFormInArray(form) {
    const current = this.formsSubject.value;
    const idx = current.findIndex((f) => f.id === form.id);
    if (idx !== -1) {
      const updated = [...current];
      updated[idx] = form;
      this.formsSubject.next(updated);
    } else {
      this.formsSubject.next([...current, form]);
    }
  }
  copyForm(formId) {
    this.api.copyForm(formId).pipe(takeUntilDestroyed(this.destroyRef), map((r) => new PrintableFormDto(r.responseData))).subscribe({
      next: (form) => this.updateFormInArray(form),
      error: (err) => console.error("Error copying form:", err)
    });
  }
  // ==================== Page Operations ====================
  goToPage(page) {
    this.currentPage.set(page);
    if (page > this.totalPages())
      this.createNewContainer(new FormContainerDto());
  }
  copyPage() {
    const newItems = this.currentPageContainers().map((c) => new FormContainerDto(__spreadProps(__spreadValues({}, c), { id: void 0 })));
    this.createNewContainers(newItems, this.totalPages() + 1);
  }
  deletePage() {
    const containers = this.currentPageContainers();
    if (!containers || containers.length === 0)
      return;
    this.deleteContainers(containers);
  }
  // ==================== Container CRUD ====================
  createNewContainer(container) {
    const currentContainers = this.formContainersSubject.value;
    const maxZIndex = currentContainers.reduce((max, c) => {
      const z = Number(c.style?.zIndex ?? 0);
      return z > max ? z : max;
    }, 0);
    const containerWithZ = new FormContainerDto(__spreadProps(__spreadValues({}, container), {
      style: __spreadProps(__spreadValues({}, container.style), { zIndex: maxZIndex + 1 + "" }),
      pageNumber: this.currentPage()
    }));
    this.api.saveContainer(containerWithZ).pipe(takeUntilDestroyed(this.destroyRef), map((r) => r.responseData), switchMap((saved) => {
      const formId = this.formSubject.value.id;
      return this.api.addContainerToForm(formId, saved.id).pipe(map((r) => new PrintableFormDto(r.responseData)));
    })).subscribe({
      next: (updatedForm) => {
        this.formSubject.next(updatedForm);
        this.formContainersSubject.next(updatedForm.formContainers);
      },
      error: (err) => console.error("Error creating container:", err)
    });
  }
  createNewContainers(containers, pageNumber = this.currentPage()) {
    const formId = this.formSubject.value.id;
    const currentContainers = this.formContainersSubject.value;
    let maxZIndex = currentContainers.reduce((max, c) => {
      const z = Number(c.style?.zIndex ?? 0);
      return z > max ? z : max;
    }, 0);
    const prepared = containers.map((c) => {
      maxZIndex++;
      return new FormContainerDto(__spreadProps(__spreadValues({}, c), {
        style: __spreadProps(__spreadValues({}, c.style), { zIndex: maxZIndex + "" }),
        pageNumber: pageNumber ?? this.currentPage()
      }));
    });
    this.api.saveAllContainers(prepared).pipe(takeUntilDestroyed(this.destroyRef), map((r) => r.responseData), switchMap((created) => this.api.addAllContainers(formId, created).pipe(map((r) => new PrintableFormDto(r.responseData))))).subscribe({
      next: (updatedForm) => {
        this.formSubject.next(updatedForm);
        this.formContainersSubject.next(updatedForm.formContainers);
      },
      error: (err) => console.error("Error creating containers:", err)
    });
  }
  copySelectedContainers() {
    const selected = this.selectedContainers();
    if (selected.length === 0)
      return;
    const groupMapping = /* @__PURE__ */ new Map();
    const copies = selected.map((c) => {
      let newGroupId = null;
      if (c.groupId) {
        if (!groupMapping.has(c.groupId)) {
          groupMapping.set(c.groupId, `group-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
        }
        newGroupId = groupMapping.get(c.groupId);
      }
      return new FormContainerDto(__spreadProps(__spreadValues({}, c), { id: void 0, groupId: newGroupId }));
    });
    this.createNewContainers(copies);
  }
  updateContainer(container) {
    if (!container?.id)
      return;
    this.api.saveContainer(container).pipe(takeUntilDestroyed(this.destroyRef), map((r) => new FormContainerDto(r.responseData))).subscribe({
      next: (updated) => this.updateContainerInArray(updated),
      error: (err) => console.error("Error updating container:", err)
    });
  }
  updateContainerInArray(container) {
    const current = this.formContainersSubject.value;
    const idx = current.findIndex((c) => c.id === container.id);
    if (idx !== -1) {
      const updated = [...current];
      updated[idx] = container;
      this.formContainersSubject.next(updated);
    } else {
      this.formContainersSubject.next([...current, container]);
    }
    this.selectedContainers.update((sel) => sel.map((s) => s.id === container.id ? container : s));
  }
  updateContainers(containers) {
    if (!containers || containers.length === 0)
      return;
    this.api.saveAllContainers(containers).pipe(takeUntilDestroyed(this.destroyRef), map((r) => r.responseData.map((c) => new FormContainerDto(c)))).subscribe({
      next: (updated) => this.updateContainersInArray(updated),
      error: (err) => console.error("Error updating containers:", err)
    });
  }
  updateContainersInArray(containers) {
    const map2 = new Map(containers.map((c) => [c.id, c]));
    const updated = this.formContainersSubject.value.map((c) => map2.get(c.id) || c);
    this.formContainersSubject.next(updated);
    this.selectedContainers.update((sel) => sel.map((s) => map2.get(s.id) || s));
  }
  deleteContainer(id) {
    this.api.deleteContainer(id).pipe(takeUntilDestroyed(this.destroyRef), tap(() => this.removeContainerFromArray(id))).subscribe({
      error: (err) => console.error("Error deleting container:", err)
    });
  }
  deleteContainers(containers) {
    if (!containers || containers.length === 0)
      return;
    this.api.deleteAllContainers(containers.map((c) => c.id)).pipe(takeUntilDestroyed(this.destroyRef), tap(() => this.removeContainersFromArray(containers.map((c) => c.id)))).subscribe({
      error: (err) => console.error("Error deleting containers:", err)
    });
  }
  removeContainerFromArray(id) {
    this.formContainersSubject.next(this.formContainersSubject.value.filter((c) => c.id !== id));
  }
  removeContainersFromArray(ids) {
    this.formContainersSubject.next(this.formContainersSubject.value.filter((c) => !ids.includes(c.id)));
  }
  // ==================== Z-Index ====================
  updateZIndexes(reorderedContainers) {
    const currentForm = this.formSubject.value;
    if (!currentForm)
      return;
    const maxZ = reorderedContainers.length;
    const updated = reorderedContainers.map((c, i) => __spreadProps(__spreadValues({}, c), {
      style: __spreadProps(__spreadValues({}, c.style), { zIndex: maxZ - i + "" })
    }));
    const updatedMap = new Map(updated.map((c) => [c.id, c]));
    const updatedArray = this.formContainersSubject.value.map((c) => new FormContainerDto(updatedMap.get(c.id) || c));
    this.updateContainers(updatedArray);
  }
  // ==================== Selection ====================
  selectContainer(container, event) {
    if (container.locked)
      return;
    const all = this.formContainersSubject.value;
    const group = container.groupId ? all.filter((c) => c.groupId === container.groupId) : [container];
    this.selectedContainers.update((current) => {
      const isPartiallySelected = group.some((c) => current.some((s) => s.id === c.id));
      if (event.ctrlKey) {
        if (isPartiallySelected) {
          const groupIds = new Set(group.map((c) => c.id));
          return current.filter((c) => !groupIds.has(c.id));
        }
        return [...current, ...group];
      }
      const isSoleSelection = current.length === group.length && group.every((c) => current.some((s) => s.id === c.id));
      if (isSoleSelection)
        return current;
      return group;
    });
  }
  isContainerSelected(container) {
    return this.selectedContainers().some((c) => c.id === container.id);
  }
  hoverContainer(container) {
    this.hoveredContainer.set(container);
    this.formContainersSubject.next([...this.formContainersSubject.value]);
  }
  isContainerHovered(container) {
    return this.hoveredContainer()?.id === container.id;
  }
  // ==================== Local State ====================
  getFormContainers() {
    return this.formContainersSubject.value;
  }
  setFormContainers(containers) {
    this.formContainersSubject.next(containers);
  }
  updateContainersState(updatedContainers) {
    const map2 = new Map(updatedContainers.map((c) => [c.id, c]));
    const newContainers = this.formContainersSubject.getValue().map((c) => map2.get(c.id) || c);
    this.formContainersSubject.next(newContainers);
  }
  // ==================== Bulk Edit ====================
  bulkUpdateContainers(target, containerType, propertiesToUpdate) {
    const allContainers = this.allContainers();
    const page = this.currentPage();
    const targets = allContainers.filter((c) => {
      switch (target) {
        case "selected":
          return this.isContainerSelected(c);
        case "page":
          return (c.pageNumber ?? 1) === page;
        case "type":
          return c.contentType === "formField" && typeof c.content === "object" && c.content !== null && c.content.type === containerType;
        default:
          return false;
      }
    });
    if (targets.length === 0)
      return;
    const updated = targets.map((c) => new FormContainerDto(__spreadProps(__spreadValues(__spreadValues({}, c), propertiesToUpdate), {
      style: __spreadValues(__spreadValues({}, c.style), propertiesToUpdate.style),
      contentStyle: __spreadValues(__spreadValues({}, c.contentStyle), propertiesToUpdate.contentStyle)
    })));
    this.api.saveAllContainers(updated).pipe(takeUntilDestroyed(this.destroyRef), map((r) => r.responseData.map((c) => new FormContainerDto(c)))).subscribe({
      next: (results) => {
        const resultsMap = new Map(results.map((c) => [c.id, c]));
        const newAll = allContainers.map((c) => resultsMap.get(c.id) || c);
        this.formContainersSubject.next(newAll);
        const currentForm = this.formSubject.value;
        if (currentForm) {
          this.formSubject.next(new PrintableFormDto(__spreadProps(__spreadValues({}, currentForm), {
            formContainers: newAll
          })));
        }
      },
      error: (err) => console.error("Error during bulk update:", err)
    });
  }
  static \u0275fac = function FormStateService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _FormStateService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _FormStateService, factory: _FormStateService.\u0275fac, providedIn: "root" });
};

export {
  FormContainerDto,
  PrintableFormDto,
  FormStateService
};
//# sourceMappingURL=chunk-GLQJSYC5.js.map
