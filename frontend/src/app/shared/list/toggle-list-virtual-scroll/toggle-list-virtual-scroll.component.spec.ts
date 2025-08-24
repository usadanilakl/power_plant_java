import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToggleListVirtualScrollComponent } from './toggle-list-virtual-scroll.component';

describe('ToggleListVirtualScrollComponent', () => {
  let component: ToggleListVirtualScrollComponent;
  let fixture: ComponentFixture<ToggleListVirtualScrollComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToggleListVirtualScrollComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ToggleListVirtualScrollComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
