import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { standaloneGuard } from './standalone.guard';

describe('standaloneGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => standaloneGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
