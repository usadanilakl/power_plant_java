import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckboxLabelOnlyComponent } from './checkbox-label-only.component';

describe('CheckboxLabelOnlyComponent', () => {
  let component: CheckboxLabelOnlyComponent;
  let fixture: ComponentFixture<CheckboxLabelOnlyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckboxLabelOnlyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CheckboxLabelOnlyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
