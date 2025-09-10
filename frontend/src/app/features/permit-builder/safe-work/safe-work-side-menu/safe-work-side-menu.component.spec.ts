import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SafeWorkSideMenuComponent } from './safe-work-side-menu.component';

describe('SafeWorkSideMenuComponent', () => {
  let component: SafeWorkSideMenuComponent;
  let fixture: ComponentFixture<SafeWorkSideMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SafeWorkSideMenuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SafeWorkSideMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
