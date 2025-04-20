import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LockDetailFormComponent } from './lock-detail-form.component';

describe('LockDetailFormComponent', () => {
  let component: LockDetailFormComponent;
  let fixture: ComponentFixture<LockDetailFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LockDetailFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LockDetailFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
