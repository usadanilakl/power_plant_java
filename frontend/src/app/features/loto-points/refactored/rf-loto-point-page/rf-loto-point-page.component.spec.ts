import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RfLotoPointPageComponent } from './rf-loto-point-page.component';

describe('RfLotoPointPageComponent', () => {
  let component: RfLotoPointPageComponent;
  let fixture: ComponentFixture<RfLotoPointPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RfLotoPointPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RfLotoPointPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
