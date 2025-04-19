import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LotoDetailFormComponent } from './loto-detail-form.component';

describe('LotoDetailFormComponent', () => {
  let component: LotoDetailFormComponent;
  let fixture: ComponentFixture<LotoDetailFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LotoDetailFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LotoDetailFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
