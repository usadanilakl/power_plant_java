import { Column } from "../inputs/column.model";
import { FormField } from "../inputs/form-field.model";
import { BaseModel, IBaseModel } from "../permits/base.model";
import { UserPa } from "./user-pa.model";

export interface IUser extends IBaseModel {
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  role: string;
  password?: string;
  sharepointId: number | null;
}

export class User extends BaseModel<IUser> implements IUser {
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  role: string;
  password?: string;
  sharepointId: number | null;

  constructor(data: Partial<IUser> = {}) {
    super(data);
    this.firstName = data.firstName ?? '';
    this.lastName = data.lastName ?? '';
    this.company = data.company ?? '';
    this.email = data.email ?? '';
    this.role = data.role ?? '';
    this.password = data.password;
    this.sharepointId = data.sharepointId?? null;
  }

  getFormFields(): FormField[] {
    return [
      { name: 'firstName', label: 'First Name', type: 'text', initialValue: this.firstName },
      { name: 'lastName', label: 'Last Name', type: 'text', initialValue: this.lastName },
      { name: 'company', label: 'Company', type: 'text', initialValue: this.company },
      { name: 'email', label: 'Email', type: 'email', initialValue: this.email },
      { name: 'role', label: 'Role', type: 'text', initialValue: this.role },
      { name: 'password', label: 'Password', type: 'password', initialValue: this.password },
      { name:'sharepointId', label: 'SharePoint ID', type: 'text', initialValue: this.sharepointId?.toString() || '', readonly: true },
    ];
  }

  getTableColumns(): Column[] {
    return [
      { id: 'firstName', header: 'First Name', accessorKey: 'firstName' },
      { id: 'lastName', header: 'Last Name', accessorKey: 'lastName' },
      { id: 'company', header: 'Company', accessorKey: 'company' },
      { id: 'email', header: 'Email', accessorKey: 'email' },
      { id: 'role', header: 'Role', accessorKey: 'role' },
      {
        id: 'updatedAt',
        header: 'Last Updated',
        accessorFn: (item: IUser) => new Date(item.updatedAt).toLocaleString()
      },
      { id:'sharepointId', header: 'SharePoint ID', accessorKey:'sharepointId'  },
    ];
  }

  convertToPaModel(): UserPa {
    return new UserPa({
      ID: this.sharepointId ?? 0,
      FirstName: this.firstName,
      LastName: this.lastName,
      Company: this.company,
      Email: this.email,
      Role: this.role,
      Password: this.password
    });
  }
}