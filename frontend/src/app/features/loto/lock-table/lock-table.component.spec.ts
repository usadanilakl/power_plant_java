import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LockTableComponent } from './lock-table.component';

describe('LockTableComponent', () => {
  let component: LockTableComponent;
  let fixture: ComponentFixture<LockTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LockTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LockTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
