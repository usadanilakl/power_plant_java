import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PermitBuilderPageComponent } from './permit-builder-page.component';

describe('PermitBuilderPageComponent', () => {
  let component: PermitBuilderPageComponent;
  let fixture: ComponentFixture<PermitBuilderPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PermitBuilderPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PermitBuilderPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
