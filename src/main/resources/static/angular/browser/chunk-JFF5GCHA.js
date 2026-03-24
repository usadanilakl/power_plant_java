import {
  HttpClient,
  environment,
  inject,
  ɵɵdefineInjectable
} from "./chunk-LMIOZ4NA.js";

// src/app/features/diagram-builder/services/diagram-api.service.ts
var DiagramApiService = class _DiagramApiService {
  http = inject(HttpClient);
  baseUrl = `${environment.apiUrl}/diagrams`;
  getAll() {
    return this.http.get(`${this.baseUrl}/get-all`);
  }
  getById(id) {
    return this.http.get(`${this.baseUrl}/get-by-id/${id}`);
  }
  create(dto) {
    return this.http.post(this.baseUrl, dto);
  }
  update(id, dto) {
    return this.http.put(`${this.baseUrl}/${id}`, dto);
  }
  delete(id) {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
  static \u0275fac = function DiagramApiService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _DiagramApiService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _DiagramApiService, factory: _DiagramApiService.\u0275fac, providedIn: "root" });
};

export {
  DiagramApiService
};
//# sourceMappingURL=chunk-JFF5GCHA.js.map
