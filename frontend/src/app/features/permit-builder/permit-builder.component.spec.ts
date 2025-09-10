import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PermitBuilderComponent } from './permit-builder.component';

describe('PermitBuilderComponent', () => {
  let component: PermitBuilderComponent;
  let fixture: ComponentFixture<PermitBuilderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PermitBuilderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PermitBuilderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
