export interface UserModel {
  id: number;
  name: string;
  email: string;
  role: string;
  password: string;
}

export class UserDto implements UserModel {
  id: number;
  name: string;
  email: string;
  role: string;
  password: string;

  constructor(data: Partial<UserModel> = {}) {
    this.id = data.id ?? 0;
    this.name = data.name ?? '';
    this.email = data.email ?? '';
    this.role = data.role ?? '';
    this.password = data.password ?? '';
  }

  // Serialization method
  toJson(): any {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      role: this.role,
      password: this.password
    };
  }

  // Deserialization method (static)
  static fromJson(json: any): UserDto {
    if (!json) {
      // console.warn('Received null or undefined json in UserDto.fromJson');
      return new UserDto();
    }

    return new UserDto({
      id: json.id ?? 0,
      name: json.name ?? '',
      email: json.email ?? '',
      role: json.role ?? '',
      password: json.password ?? ''
    });
  }

  // Builder-like static method
  static build(config: {
    id?: number;
    name?: string;
    email?: string;
    role?: string;
    password?: string;
  }): UserDto {
    return new UserDto(config);
  }
}