import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageZoomInteractiveComponent } from './image-zoom-interactive.component';

describe('ImageZoomComponent', () => {
  let component: ImageZoomInteractiveComponent;
  let fixture: ComponentFixture<ImageZoomInteractiveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageZoomInteractiveComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImageZoomInteractiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
