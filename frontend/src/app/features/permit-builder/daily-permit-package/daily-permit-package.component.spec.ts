import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyPermitPackageComponent } from './daily-permit-package.component';

describe('DailyPermitPackageComponent', () => {
  let component: DailyPermitPackageComponent;
  let fixture: ComponentFixture<DailyPermitPackageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyPermitPackageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DailyPermitPackageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
