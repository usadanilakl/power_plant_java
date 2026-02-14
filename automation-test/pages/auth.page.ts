import { Page, APIResponse } from '@playwright/test';
import { BasePage } from './base.page';
import { config } from '../test.config';

/**
 * Page object for Auth, Access Grant, and User Management API testing.
 * All calls use Playwright's APIRequestContext (no browser navigation).
 */
export class AuthPage extends BasePage {
  readonly backendUrl: string;

  /** Default admin credentials (seeded by AdminUserSeeder on startup) */
  static readonly ADMIN_EMAIL = 'admin@power-plant.local';
  static readonly ADMIN_PASSWORD = 'admin';

  constructor(page: Page) {
    super(page);
    this.backendUrl = config.clientBackendUrl;
  }

  // ==================== AUTH ENDPOINTS ====================

  async login(email: string, password: string): Promise<APIResponse> {
    return this.page.request.post(`${this.backendUrl}/api/auth/login`, {
      data: { email, password },
    });
  }

  async logout(): Promise<APIResponse> {
    return this.page.request.post(`${this.backendUrl}/api/auth/logout`);
  }

  async getCurrentUser(): Promise<APIResponse> {
    return this.page.request.get(`${this.backendUrl}/api/auth/me`);
  }

  async requestAccess(): Promise<APIResponse> {
    return this.page.request.post(`${this.backendUrl}/api/auth/request-access`);
  }

  async getAccessStatus(): Promise<APIResponse> {
    return this.page.request.get(`${this.backendUrl}/api/auth/access-status`);
  }

  // ==================== ADMIN ACCESS MANAGEMENT ====================

  async getPendingRequests(): Promise<APIResponse> {
    return this.page.request.get(`${this.backendUrl}/api/auth/admin/pending`);
  }

  async getActiveGrants(): Promise<APIResponse> {
    return this.page.request.get(`${this.backendUrl}/api/auth/admin/active-grants`);
  }

  async approveRequest(id: number): Promise<APIResponse> {
    return this.page.request.post(`${this.backendUrl}/api/auth/admin/approve/${id}`);
  }

  async denyRequest(id: number): Promise<APIResponse> {
    return this.page.request.post(`${this.backendUrl}/api/auth/admin/deny/${id}`);
  }

  async revokeGrant(id: number): Promise<APIResponse> {
    return this.page.request.post(`${this.backendUrl}/api/auth/admin/revoke/${id}`);
  }

  // ==================== USER MANAGEMENT (ADMIN) ====================

  async createUser(data: CreateUserRequest): Promise<APIResponse> {
    return this.page.request.post(`${this.backendUrl}/ng/users`, {
      data,
    });
  }

  async getUsers(page: number = 1, pageSize: number = 50): Promise<APIResponse> {
    return this.page.request.get(
      `${this.backendUrl}/ng/users/paginated?page=${page}&pageSize=${pageSize}`
    );
  }

  async getUser(id: number): Promise<APIResponse> {
    return this.page.request.get(`${this.backendUrl}/ng/users/${id}`);
  }

  async updateUser(id: number, data: Partial<CreateUserRequest>): Promise<APIResponse> {
    return this.page.request.put(`${this.backendUrl}/ng/users/${id}`, {
      data,
    });
  }

  async deleteUser(id: number): Promise<APIResponse> {
    return this.page.request.delete(`${this.backendUrl}/ng/users/${id}`);
  }

  async getRoles(): Promise<APIResponse> {
    return this.page.request.get(`${this.backendUrl}/ng/users/roles`);
  }

  // ==================== HELPERS ====================

  /**
   * Login as the seeded admin user.
   * Returns the parsed response body.
   */
  async loginAsAdmin(): Promise<any> {
    const response = await this.login(AuthPage.ADMIN_EMAIL, AuthPage.ADMIN_PASSWORD);
    return response.json();
  }

  /**
   * Create a test employee user and return the parsed response.
   * Caller should be logged in as admin.
   */
  async createTestEmployee(suffix: string = ''): Promise<any> {
    const ts = suffix || Date.now().toString();
    const response = await this.createUser({
      username: `employee_${ts}`,
      firstName: 'Test',
      lastName: `Employee_${ts}`,
      email: `employee_${ts}@test.local`,
      role: 'ROLE_EMPLOYEE',
      password: 'password123',
      windowsUsername: '',
    });
    return response.json();
  }

  /**
   * Create a test contractor user and return the parsed response.
   * Caller should be logged in as admin.
   */
  async createTestContractor(suffix: string = ''): Promise<any> {
    const ts = suffix || Date.now().toString();
    const response = await this.createUser({
      username: `contractor_${ts}`,
      firstName: 'Test',
      lastName: `Contractor_${ts}`,
      email: `contractor_${ts}@test.local`,
      role: 'ROLE_CONTRACTOR',
      password: 'password123',
      windowsUsername: '',
    });
    return response.json();
  }
}

// ==================== TYPE DEFINITIONS ====================

export interface CreateUserRequest {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  password: string;
  windowsUsername: string;
}
