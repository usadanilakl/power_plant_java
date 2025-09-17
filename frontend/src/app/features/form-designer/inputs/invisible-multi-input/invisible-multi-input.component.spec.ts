import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvisibleMultiInputComponent } from './invisible-multi-input.component';

describe('InvisibleMultiInputComponent', () => {
  let component: InvisibleMultiInputComponent;
  let fixture: ComponentFixture<InvisibleMultiInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvisibleMultiInputComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvisibleMultiInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
