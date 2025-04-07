import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PidComponent } from './pid.component';

describe('PidComponent', () => {
  let component: PidComponent;
  let fixture: ComponentFixture<PidComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PidComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PidComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
