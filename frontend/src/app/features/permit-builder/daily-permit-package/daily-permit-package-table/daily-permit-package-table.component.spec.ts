import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyPermitPackageTableComponent } from './daily-permit-package-table.component';

describe('DailyPermitPackageTableComponent', () => {
  let component: DailyPermitPackageTableComponent;
  let fixture: ComponentFixture<DailyPermitPackageTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyPermitPackageTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DailyPermitPackageTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
