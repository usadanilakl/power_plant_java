import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LotoStandardFormComponent } from './loto-standard-form.component';

describe('LotoStandardFormComponent', () => {
  let component: LotoStandardFormComponent;
  let fixture: ComponentFixture<LotoStandardFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LotoStandardFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LotoStandardFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
