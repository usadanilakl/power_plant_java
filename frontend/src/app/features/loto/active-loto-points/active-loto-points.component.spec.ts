import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActiveLotoPointsComponent } from './active-loto-points.component';

describe('ActiveLotoPointsComponent', () => {
  let component: ActiveLotoPointsComponent;
  let fixture: ComponentFixture<ActiveLotoPointsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActiveLotoPointsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActiveLotoPointsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
