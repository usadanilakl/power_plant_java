import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RfLotoPointFormComponent } from './rf-loto-point-form.component';

describe('RfLotoPointFormComponent', () => {
  let component: RfLotoPointFormComponent;
  let fixture: ComponentFixture<RfLotoPointFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RfLotoPointFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RfLotoPointFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
