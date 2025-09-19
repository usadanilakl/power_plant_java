import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemCarouselComponent } from './item-carousel.component';

describe('ItemCarouselComponent', () => {
  let component: ItemCarouselComponent;
  let fixture: ComponentFixture<ItemCarouselComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemCarouselComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItemCarouselComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
