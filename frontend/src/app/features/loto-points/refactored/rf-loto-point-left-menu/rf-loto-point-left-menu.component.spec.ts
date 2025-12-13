import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RfLotoPointLeftMenuComponent } from './rf-loto-point-left-menu.component';

describe('RfLotoPointLeftMenuComponent', () => {
  let component: RfLotoPointLeftMenuComponent;
  let fixture: ComponentFixture<RfLotoPointLeftMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RfLotoPointLeftMenuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RfLotoPointLeftMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
