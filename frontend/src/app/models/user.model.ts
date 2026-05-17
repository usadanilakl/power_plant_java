import { Validators } from '@angular/forms';
import { BaseDto, BaseModel } from './base/base.model';
import { Column } from './column.model';
import { Option } from './option.model';
import { RfFormField } from './ui/form-field.model';

export type UserFieldName = keyof UserModel;

export interface UserModel extends BaseModel {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  roles: string[];
  isActive: boolean;
  windowsUsername: string;
  permissionLevel: string;
  phone: string;
  company: string;
  signaturePath: string;
  // PIN authentication (read-only)
  signingInitials: string | null;
  pinSetAt: string | null;
  pinLockedUntil: string | null;
  trainingCompletedAt: string | null;
  trainingExpiresAt: string | null;
}

export class UserDto extends BaseDto implements UserModel {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  roles: string[];
  isActive: boolean;
  windowsUsername: string;
  permissionLevel: string;
  phone: string;
  company: string;
  signaturePath: string;
  signingInitials: string | null;
  pinSetAt: string | null;
  pinLockedUntil: string | null;
  trainingCompletedAt: string | null;
  trainingExpiresAt: string | null;

  constructor(data: Partial<UserModel> = {}) {
    super(data);
    this.username = data.username ?? '';
    this.firstName = data.firstName ?? '';
    this.lastName = data.lastName ?? '';
    this.email = data.email ?? '';
    this.role = data.role ?? '';
    this.roles = data.roles ?? [];
    this.isActive = data.isActive ?? true;
    this.windowsUsername = data.windowsUsername ?? '';
    this.permissionLevel = data.permissionLevel ?? '';
    this.phone = data.phone ?? '';
    this.company = data.company ?? '';
    this.signaturePath = data.signaturePath ?? '';
    this.signingInitials = data.signingInitials ?? null;
    this.pinSetAt = data.pinSetAt ?? null;
    this.pinLockedUntil = data.pinLockedUntil ?? null;
    this.trainingCompletedAt = data.trainingCompletedAt ?? null;
    this.trainingExpiresAt = data.trainingExpiresAt ?? null;
  }

  override toJson(): any {
    return {
      ...super.toJson(),
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
      signaturePath: this.signaturePath,
    };
  }

  static override fromJson(json: any): UserDto {
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
      permissionLevel: json.permissionLevel ?? '',
      phone: json.phone ?? '',
      company: json.company ?? '',
      signaturePath: json.signaturePath ?? '',
      signingInitials: json.signingInitials ?? null,
      pinSetAt: json.pinSetAt ?? null,
      pinLockedUntil: json.pinLockedUntil ?? null,
      trainingCompletedAt: json.trainingCompletedAt ?? null,
      trainingExpiresAt: json.trainingExpiresAt ?? null,
    });
  }

  toOption(): Option {
    return {
      value: this.id,
      label: this.name || `${this.firstName} ${this.lastName}`.trim() || this.username,
    };
  }

  static toTableColumns(
    fields: UserFieldName[] = ['name', 'email', 'username', 'role', 'permissionLevel', 'isActive', 'windowsUsername']
  ): Column[] {
    const allColumns: { [key in UserFieldName]?: Column } = {
      name: { id: 'name', header: 'Name', accessorKey: 'name', filterable: true },
      email: { id: 'email', header: 'Email', accessorKey: 'email', filterable: true },
      username: { id: 'username', header: 'Username', accessorKey: 'username', filterable: true },
      role: {
        id: 'role',
        header: 'Roles',
        filterable: true,
        accessorFn: (item: UserDto) =>
          (item.roles || []).map(r => r.replace('ROLE_', '')).join(', '),
      },
      permissionLevel: { id: 'permissionLevel', header: 'Permission', accessorKey: 'permissionLevel', filterable: true },
      isActive: {
        id: 'isActive',
        header: 'Active',
        filterable: true,
        accessorFn: (item: UserDto) => (item.isActive ? 'Yes' : 'No'),
        conditionalStyling: (item: any) =>
          item.isActive
            ? { 'background-color': '#90EE90' }
            : { 'background-color': '#FFCCCB' },
      },
      windowsUsername: { id: 'windowsUsername', header: 'Windows User', accessorKey: 'windowsUsername', filterable: true },
      firstName: { id: 'firstName', header: 'First Name', accessorKey: 'firstName', filterable: true },
      lastName: { id: 'lastName', header: 'Last Name', accessorKey: 'lastName', filterable: true },
      phone: { id: 'phone', header: 'Phone', accessorKey: 'phone', filterable: true },
      company: { id: 'company', header: 'Company', accessorKey: 'company', filterable: true },
    };

    return fields
      .map(f => allColumns[f])
      .filter((c): c is Column => c != null);
  }

  static toFormFields(dto: UserDto, options?: { isNew?: boolean }): RfFormField[] {
    const isNew = options?.isNew ?? (!dto.id || dto.id === 0);
    const availableRoles: Option[] = [
      { value: 'ROLE_ADMIN', label: 'Admin' },
      { value: 'ROLE_EMPLOYEE', label: 'Employee' },
      { value: 'ROLE_CONTRACTOR', label: 'Contractor' },
      { value: 'ROLE_PLANT', label: 'Plant' },
      // Plant job roles (no ROLE_ prefix — matches LotoRole convention).
      // Used by MaximoBundleService to find users whose WOs to aggregate.
      { value: 'LEAD_OPERATOR', label: 'Lead Operator' },
    ];

    const permissionOptions: Option[] = [
      { value: '', label: 'None' },
      { value: 'NONE', label: 'NONE' },
      { value: 'BASIC', label: 'BASIC' },
      { value: 'OPERATOR', label: 'OPERATOR' },
    ];

    return [
      {
        name: 'firstName',
        label: 'First Name',
        type: 'text',
        validators: [Validators.required],
        initialValue: dto.firstName,
      },
      {
        name: 'lastName',
        label: 'Last Name',
        type: 'text',
        validators: [Validators.required],
        initialValue: dto.lastName,
      },
      {
        name: 'username',
        label: 'Username',
        type: 'text',
        validators: [Validators.required],
        initialValue: dto.username,
      },
      {
        name: 'email',
        label: 'Email',
        type: 'text',
        validators: [Validators.required, Validators.email],
        initialValue: dto.email,
      },
      {
        name: 'password',
        label: isNew ? 'Password' : 'New Password (leave blank to keep)',
        type: 'text',
        validators: isNew ? [Validators.required] : [],
        initialValue: '',
      },
      {
        name: 'windowsUsername',
        label: 'Windows Username',
        type: 'text',
        initialValue: dto.windowsUsername,
      },
      {
        name: 'phone',
        label: 'Phone',
        type: 'text',
        initialValue: dto.phone,
      },
      {
        name: 'company',
        label: 'Company',
        type: 'text',
        initialValue: dto.company,
      },
      {
        name: 'roles',
        label: 'Roles',
        type: 'checkbox-group',
        options: availableRoles,
        initialValue: dto.roles || [],
      },
      {
        name: 'permissionLevel',
        label: 'Permission Level',
        type: 'select',
        options: permissionOptions,
        initialValue: dto.permissionLevel || '',
      },
      {
        name: 'isActive',
        label: 'Active',
        type: 'checkbox',
        initialValue: dto.isActive,
      },
      {
        name: 'signaturePath',
        label: 'Signature Path',
        type: 'text',
        initialValue: dto.signaturePath,
      },
    ];
  }
}
