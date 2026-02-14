export interface UserModel {
  id: number;
  name: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  windowsUsername: string;
}

export class UserDto implements UserModel {
  id: number;
  name: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  windowsUsername: string;

  constructor(data: Partial<UserModel> = {}) {
    this.id = data.id ?? 0;
    this.name = data.name ?? '';
    this.username = data.username ?? '';
    this.firstName = data.firstName ?? '';
    this.lastName = data.lastName ?? '';
    this.email = data.email ?? '';
    this.role = data.role ?? '';
    this.isActive = data.isActive ?? true;
    this.windowsUsername = data.windowsUsername ?? '';
  }

  toJson(): any {
    return {
      id: this.id,
      name: this.name,
      username: this.username,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      role: this.role,
      isActive: this.isActive,
      windowsUsername: this.windowsUsername
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
      isActive: json.isActive ?? true,
      windowsUsername: json.windowsUsername ?? ''
    });
  }
}
