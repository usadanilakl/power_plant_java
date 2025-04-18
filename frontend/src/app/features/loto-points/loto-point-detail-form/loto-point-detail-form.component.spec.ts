import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LotoPointDetailFormComponent } from './loto-point-detail-form.component';

describe('LotoPointDetailFormComponent', () => {
  let component: LotoPointDetailFormComponent;
  let fixture: ComponentFixture<LotoPointDetailFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LotoPointDetailFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LotoPointDetailFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
