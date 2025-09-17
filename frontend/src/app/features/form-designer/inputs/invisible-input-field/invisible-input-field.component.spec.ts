import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvisibleInputFieldComponent } from './invisible-input-field.component';

describe('InvisibleInputFieldComponent', () => {
  let component: InvisibleInputFieldComponent;
  let fixture: ComponentFixture<InvisibleInputFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvisibleInputFieldComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvisibleInputFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
