import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotWorkSideMenuComponent } from './hot-work-side-menu.component';

describe('HotWorkSideMenuComponent', () => {
  let component: HotWorkSideMenuComponent;
  let fixture: ComponentFixture<HotWorkSideMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotWorkSideMenuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HotWorkSideMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
