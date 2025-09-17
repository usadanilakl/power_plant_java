import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RadioCheckboxesComponent } from './radio-checkboxes.component';

describe('RadioCheckboxesComponent', () => {
  let component: RadioCheckboxesComponent;
  let fixture: ComponentFixture<RadioCheckboxesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RadioCheckboxesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RadioCheckboxesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
