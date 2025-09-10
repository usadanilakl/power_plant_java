import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyPermitPackageSideMenuComponent } from './daily-permit-package-side-menu.component';

describe('DailyPermitPackageSideMenuComponent', () => {
  let component: DailyPermitPackageSideMenuComponent;
  let fixture: ComponentFixture<DailyPermitPackageSideMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyPermitPackageSideMenuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DailyPermitPackageSideMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
