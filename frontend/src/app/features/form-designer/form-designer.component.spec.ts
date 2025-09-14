import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormDesignerComponent } from './form-designer.component';

describe('FormDesignerComponent', () => {
  let component: FormDesignerComponent;
  let fixture: ComponentFixture<FormDesignerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormDesignerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormDesignerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
