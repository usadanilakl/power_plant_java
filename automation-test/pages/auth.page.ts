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

  // ==================== STEP-UP / PIN ADMIN (server requires e2e.test-endpoints.enabled=true) ====================

  /**
   * Admin: assign 2-3-letter signing initials to a user. Initials drive the
   * step-up code format ({@code DK1111}). Caller must be logged in as admin.
   */
  async setSigningInitials(userId: number, initials: string): Promise<APIResponse> {
    return this.page.request.post(`${this.backendUrl}/api/auth/admin/users/${userId}/initials`, {
      data: { initials },
    });
  }

  /**
   * Admin (test profile only): set a user's PIN to a known value. Skips
   * trivial-PIN blocking and uniqueness checks so the suite can use
   * deterministic codes. Server-side gated by {@code e2e.test-endpoints.enabled}
   * (on in {@code application-test.properties} / {@code application-dev.properties}).
   */
  async setTestPin(userId: number, pin: string): Promise<APIResponse> {
    return this.page.request.post(`${this.backendUrl}/api/auth/admin/users/${userId}/pin/set-test`, {
      data: { pin },
    });
  }

  /** Admin (test profile only): clear PIN lockout state. */
  async unlockPin(userId: number): Promise<APIResponse> {
    return this.page.request.post(`${this.backendUrl}/api/auth/admin/users/${userId}/pin/unlock`);
  }

  /**
   * Anonymous: exchange a combined initials+PIN code (e.g. "DK1111") for a
   * single-use step-up token. Token expires in ~90s.
   */
  async authorizeStepUp(code: string): Promise<APIResponse> {
    return this.page.request.post(`${this.backendUrl}/api/auth/step-up`, {
      data: { code },
    });
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
   * Login by credential (username or email) + password using the actual
   * shape the backend's {@code LoginRequest} record requires ({@code credential},
   * not {@code email}). Use this for new tests; the legacy {@link #login}
   * helper sends {@code email} and will 401 against current backend.
   */
  async loginByCredential(credential: string, password: string): Promise<APIResponse> {
    return this.page.request.post(`${this.backendUrl}/api/auth/login`, {
      data: { credential, password },
    });
  }

  /**
   * Same as {@link #loginAsAdmin} but uses the correct {@code credential} payload
   * shape and accepts the seeded admin's actual username "admin".
   */
  async loginAsSeededAdmin(): Promise<APIResponse> {
    return this.loginByCredential('admin', 'admin');
  }

  /**
   * Create a fully-provisioned test actor: user + signing initials + PIN.
   * Returns the actor's record. Mirrors what
   * {@code LotoStandardWorkflowIT.provisionActor} does on the Java side.
   *
   * <p>Caller must be logged in as admin. The created user's email follows
   * the {@code @workflow-it.local} convention used by Java IT cleanup, so
   * a stray run won't leak past the next reset.
   */
  async provisionActor(opts: {
    initials: string;
    pin: string;
    roles: string[];
    suffix?: string;
  }): Promise<TestActor> {
    const suffix = opts.suffix ?? Date.now().toString().slice(-6);
    const email = `${opts.initials.toLowerCase()}+${suffix}@workflow-it.local`;
    const username = `${opts.initials.toLowerCase()}-${suffix}`;

    const createRes = await this.createUserWithRoles({
      username,
      firstName: opts.initials,
      lastName: 'Tester',
      email,
      roles: opts.roles,
      password: 'TestPass!1234',
      windowsUsername: '',
    });
    const createBody = await createRes.json();
    const userId: number = createBody?.responseData?.id;
    if (!userId) {
      throw new Error(`provisionActor: createUser returned no id; body=${JSON.stringify(createBody)}`);
    }

    const initialsRes = await this.setSigningInitials(userId, opts.initials);
    if (!initialsRes.ok()) {
      throw new Error(`setSigningInitials ${opts.initials} failed: ${await initialsRes.text()}`);
    }
    const pinRes = await this.setTestPin(userId, opts.pin);
    if (!pinRes.ok()) {
      throw new Error(`setTestPin ${opts.initials}${opts.pin} failed: ${await pinRes.text()}`);
    }

    return {
      userId,
      email,
      username,
      initials: opts.initials,
      pin: opts.pin,
      stepUpCode: `${opts.initials}${opts.pin}`,
    };
  }

  /**
   * Create a user with the {@code roles: List<String>} payload shape the
   * backend's {@code CreateUserRequest} actually expects. The legacy
   * {@link #createUser} helper sends {@code role} (singular) which the new
   * controller signature ignores.
   */
  async createUserWithRoles(data: CreateUserWithRolesRequest): Promise<APIResponse> {
    return this.page.request.post(`${this.backendUrl}/ng/users`, { data });
  }

  /**
   * Step-up convenience: exchange a code for a token and return just the
   * token string. Throws if the server didn't issue one (locked, wrong
   * PIN, ambiguous code).
   */
  async stepUpToken(code: string): Promise<string> {
    const res = await this.authorizeStepUp(code);
    if (!res.ok()) {
      throw new Error(`step-up failed for code ${code}: ${res.status()} ${await res.text()}`);
    }
    const body = await res.json();
    if (!body?.token) {
      throw new Error(`step-up succeeded but no token in body: ${JSON.stringify(body)}`);
    }
    return body.token;
  }

  /**
   * Delete every {@code @workflow-it.local} user — best-effort cleanup that
   * mirrors the Java IT pattern. Soft-delete via DELETE /ng/users/{id}.
   */
  async cleanupTestActors(actors: Array<{ userId: number }>): Promise<void> {
    for (const a of actors) {
      try { await this.deleteUser(a.userId); } catch { /* best-effort */ }
    }
  }

  /**
   * Create a test employee user and return the parsed response.
   * Caller should be logged in as admin.
   *
   * @deprecated Uses legacy {@code role} field that current backend ignores.
   * Use {@link #createUserWithRoles} for new tests.
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
   *
   * @deprecated see {@link #createTestEmployee}.
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

/** Shape the backend's CreateUserRequest record actually accepts (roles plural). */
export interface CreateUserWithRolesRequest {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  password: string;
  windowsUsername: string;
  phone?: string;
  company?: string;
  signaturePath?: string;
}

/** A provisioned test user: ids + step-up credentials for use across a spec. */
export interface TestActor {
  userId: number;
  email: string;
  username: string;
  initials: string;
  pin: string;
  /** Concatenated initials + PIN, what /api/auth/step-up takes. */
  stepUpCode: string;
}
