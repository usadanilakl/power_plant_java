import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyPermitPackageBuilderComponent } from './daily-permit-package-builder.component';

describe('DailyPermitPackageBuilderComponent', () => {
  let component: DailyPermitPackageBuilderComponent;
  let fixture: ComponentFixture<DailyPermitPackageBuilderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyPermitPackageBuilderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DailyPermitPackageBuilderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
