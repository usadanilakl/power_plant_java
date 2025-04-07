import { TestBed } from '@angular/core/testing';

import { TagNumberService } from './tag-number.service';

describe('TagNumberService', () => {
  let service: TagNumberService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TagNumberService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
