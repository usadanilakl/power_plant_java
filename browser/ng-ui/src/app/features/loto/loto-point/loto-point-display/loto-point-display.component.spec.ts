import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LotoPointDisplayComponent } from './loto-point-display.component';

describe('LotoPointDisplayComponent', () => {
  let component: LotoPointDisplayComponent;
  let fixture: ComponentFixture<LotoPointDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LotoPointDisplayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LotoPointDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
