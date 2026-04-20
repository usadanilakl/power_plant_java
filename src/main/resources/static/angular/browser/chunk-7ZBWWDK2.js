// src/app/models/base/base.model.ts
var BaseDto = class _BaseDto {
  id;
  name;
  objectType;
  isVerified;
  constructor(data = {}) {
    this.id = data.id || 0;
    this.name = data.name || "";
    this.objectType = data.objectType || "";
    this.isVerified = this.toBooleanSafe(data.isVerified);
  }
  // Serialization method
  toJson() {
    return {
      id: this.id,
      name: this.name,
      objectType: this.objectType,
      isVerified: this.isVerified
    };
  }
  // Deserialization method (static)
  static fromJson(json) {
    if (!json) {
      console.warn("Received null or undefined json in BaseDto.fromJson");
      return new _BaseDto();
    }
    return new _BaseDto({
      id: json.id || 0,
      name: json.name || "",
      objectType: json.objectType || "",
      isVerified: json.isVerified
    });
  }
  toBooleanSafe(value) {
    if (typeof value === "boolean") {
      return value;
    }
    if (typeof value === "string") {
      return value.toLowerCase() === "true";
    }
    return Boolean(value);
  }
  setNestedObjectById(id, object) {
    if (!id)
      return null;
    if (typeof id === "object" && id.id) {
      return id;
    }
    if (typeof id === "number" && !isNaN(id)) {
      object.id = id;
    } else if (typeof id === "string" && !isNaN(Number(id))) {
      object.id = Number(id);
    }
    return object;
  }
};

export {
  BaseDto
};
//# sourceMappingURL=chunk-7ZBWWDK2.js.map
