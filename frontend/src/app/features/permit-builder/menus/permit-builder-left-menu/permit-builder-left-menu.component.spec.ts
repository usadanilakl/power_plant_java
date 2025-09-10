import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PermitBuilderLeftMenuComponent } from './permit-builder-left-menu.component';

describe('PermitBuilderLeftMenuComponent', () => {
  let component: PermitBuilderLeftMenuComponent;
  let fixture: ComponentFixture<PermitBuilderLeftMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PermitBuilderLeftMenuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PermitBuilderLeftMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
