import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageInteractiveComponent } from './image-interactive.component';

describe('ImageInteractiveComponent', () => {
  let component: ImageInteractiveComponent;
  let fixture: ComponentFixture<ImageInteractiveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageInteractiveComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImageInteractiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
