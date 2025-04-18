import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LotoPointComponent } from './loto-point.component';

describe('LotoPointComponent', () => {
  let component: LotoPointComponent;
  let fixture: ComponentFixture<LotoPointComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LotoPointComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LotoPointComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
