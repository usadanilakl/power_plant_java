import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FloatingMenuComponent } from './floating-menu.component';

describe('FloatingMenuComponent', () => {
  let component: FloatingMenuComponent;
  let fixture: ComponentFixture<FloatingMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FloatingMenuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FloatingMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
