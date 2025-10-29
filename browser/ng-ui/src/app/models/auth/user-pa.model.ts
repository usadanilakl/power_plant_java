export interface IUserPa {
  ID?: number;
  FirstName?: string;
  LastName?: string;
  Company?: string;
  Email?: string;
  Role?: string;
  FullName?: string;
  LastLoggedIn?: string;
  Token?: string;
  Password?: string;
}

export class UserPa implements IUserPa {
  ID?: number;
  FirstName?: string;
  LastName?: string;
  Company?: string;
  Email?: string;
  Role?: string;
  FullName?: string;
  LastLoggedIn?: string;
  Token?: string;
  Password?: string;

  constructor(data: Partial<IUserPa> = {}) {
    if(typeof data === 'string') data = JSON.parse(data);

    this.ID = data.ID;
    this.FirstName = data.FirstName;
    this.LastName = data.LastName;
    this.Company = data.Company;
    this.Email = data.Email;
    this.Role = data.Role;
    this.FullName = data.FullName;
    this.LastLoggedIn = data.LastLoggedIn;
    this.Token = data.Token;
    this.Password = data.Password;
  }

  convertToUser(): any {
    return {
      sharepointId: this.ID,
      firstName: this.FirstName,
      lastName: this.LastName,
      company: this.Company,
      email: this.Email,
      role: this.Role,
      password: this.Password
    };
  }
}