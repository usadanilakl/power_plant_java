import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyPermitPackageFormComponent } from './daily-permit-package-form.component';

describe('DailyPermitPackageFormComponent', () => {
  let component: DailyPermitPackageFormComponent;
  let fixture: ComponentFixture<DailyPermitPackageFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyPermitPackageFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DailyPermitPackageFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
