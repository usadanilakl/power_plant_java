import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FieldPropertiesComponent } from './field-properties.component';

describe('FieldPropertiesComponent', () => {
  let component: FieldPropertiesComponent;
  let fixture: ComponentFixture<FieldPropertiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FieldPropertiesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FieldPropertiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
