export interface UserModel {
  id: number;
  name: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  roles: string[];
  isActive: boolean;
  windowsUsername: string;
  permissionLevel: string;
}

export class UserDto implements UserModel {
  id: number;
  name: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  roles: string[];
  isActive: boolean;
  windowsUsername: string;
  permissionLevel: string;

  constructor(data: Partial<UserModel> = {}) {
    this.id = data.id ?? 0;
    this.name = data.name ?? '';
    this.username = data.username ?? '';
    this.firstName = data.firstName ?? '';
    this.lastName = data.lastName ?? '';
    this.email = data.email ?? '';
    this.role = data.role ?? '';
    this.roles = data.roles ?? [];
    this.isActive = data.isActive ?? true;
    this.windowsUsername = data.windowsUsername ?? '';
    this.permissionLevel = data.permissionLevel ?? '';
  }

  toJson(): any {
    return {
      id: this.id,
      name: this.name,
      username: this.username,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      roles: this.roles,
      isActive: this.isActive,
      windowsUsername: this.windowsUsername,
      permissionLevel: this.permissionLevel
    };
  }

  static fromJson(json: any): UserDto {
    if (!json) return new UserDto();
    return new UserDto({
      id: json.id ?? 0,
      name: json.name ?? '',
      username: json.username ?? '',
      firstName: json.firstName ?? '',
      lastName: json.lastName ?? '',
      email: json.email ?? '',
      role: json.role ?? '',
      roles: json.roles ?? [],
      isActive: json.isActive ?? true,
      windowsUsername: json.windowsUsername ?? '',
      permissionLevel: json.permissionLevel ?? ''
    });
  }
}
