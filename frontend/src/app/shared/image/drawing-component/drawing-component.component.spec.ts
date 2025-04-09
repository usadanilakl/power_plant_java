import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DrawingComponentComponent } from './drawing-component.component';

describe('DrawingComponentComponent', () => {
  let component: DrawingComponentComponent;
  let fixture: ComponentFixture<DrawingComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DrawingComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DrawingComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
