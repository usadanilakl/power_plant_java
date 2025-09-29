import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckboxOnlyLabelComponent } from './checkbox-only-label.component';

describe('CheckboxOnlyLabelComponent', () => {
  let component: CheckboxOnlyLabelComponent;
  let fixture: ComponentFixture<CheckboxOnlyLabelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckboxOnlyLabelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CheckboxOnlyLabelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
