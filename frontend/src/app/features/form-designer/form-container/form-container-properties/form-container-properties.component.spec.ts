import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormContainerPropertiesComponent } from './form-container-properties.component';

describe('FormContainerPropertiesComponent', () => {
  let component: FormContainerPropertiesComponent;
  let fixture: ComponentFixture<FormContainerPropertiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormContainerPropertiesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormContainerPropertiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
