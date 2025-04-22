import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupProjectionComponent } from './popup-projection.component';

describe('PopupProjectionComponent', () => {
  let component: PopupProjectionComponent;
  let fixture: ComponentFixture<PopupProjectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopupProjectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PopupProjectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
