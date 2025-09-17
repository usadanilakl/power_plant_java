import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormZoomControlsComponent } from './form-zoom-controls.component';

describe('FormZoomControlsComponent', () => {
  let component: FormZoomControlsComponent;
  let fixture: ComponentFixture<FormZoomControlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormZoomControlsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormZoomControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
