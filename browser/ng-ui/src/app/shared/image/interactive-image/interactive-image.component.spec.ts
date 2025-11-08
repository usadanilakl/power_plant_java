import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InteractiveImageComponent } from './interactive-image.component';

describe('InteractiveImageComponent', () => {
  let component: InteractiveImageComponent;
  let fixture: ComponentFixture<InteractiveImageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InteractiveImageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InteractiveImageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
