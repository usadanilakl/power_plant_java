import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiTextInputComponent } from './multi-text-input.component';

describe('MultiTextInputComponent', () => {
  let component: MultiTextInputComponent;
  let fixture: ComponentFixture<MultiTextInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultiTextInputComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MultiTextInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
