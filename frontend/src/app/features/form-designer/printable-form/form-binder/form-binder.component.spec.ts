import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormBinderComponent } from './form-binder.component';

describe('FormBinderComponent', () => {
  let component: FormBinderComponent;
  let fixture: ComponentFixture<FormBinderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormBinderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormBinderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
