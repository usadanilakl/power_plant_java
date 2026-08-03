import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { BehaviorSubject, Observable, firstValueFrom, of } from 'rxjs';
import { AuthService, AuthUser } from '../services/auth.service';
import { logDiagnosticsGuard } from './log-diagnostics.guard';

describe('logDiagnosticsGuard', () => {
  const currentUser$ = new BehaviorSubject<AuthUser | null>(null);
  const deniedTree = {} as UrlTree;
  const router = {
    createUrlTree: jasmine.createSpy('createUrlTree').and.returnValue(deniedTree),
  };

  beforeEach(() => {
    currentUser$.next(null);
    router.createUrlTree.calls.reset();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: {
            authChecked$: of(true),
            currentUser$,
          },
        },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('allows the narrow log diagnostics role without checking full access', async () => {
    currentUser$.next(userWithRoles(['ROLE_LOG_DIAGNOSTICS'], 'RESTRICTED'));

    expect(await evaluateGuard()).toBeTrue();
  });

  it('allows administrators', async () => {
    currentUser$.next(userWithRoles(['ROLE_ADMIN'], 'RESTRICTED'));

    expect(await evaluateGuard()).toBeTrue();
  });

  it('redirects authenticated users without a diagnostics role', async () => {
    currentUser$.next(userWithRoles(['ROLE_EMPLOYEE'], 'FULL'));

    expect(await evaluateGuard()).toBe(deniedTree);
    expect(router.createUrlTree).toHaveBeenCalledOnceWith(['/home']);
  });

  function evaluateGuard(): Promise<boolean | UrlTree> {
    const result = TestBed.runInInjectionContext(() => logDiagnosticsGuard(
      {} as ActivatedRouteSnapshot,
      {} as RouterStateSnapshot,
    ));
    return firstValueFrom(result as Observable<boolean | UrlTree>);
  }

  function userWithRoles(
    roles: string[],
    accessLevel: AuthUser['accessLevel'],
  ): AuthUser {
    return {
      id: 1,
      name: 'Support User',
      email: 'support@example.com',
      role: roles[0] ?? '',
      roles,
      isActive: true,
      accessLevel,
    };
  }
});
