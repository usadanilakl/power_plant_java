import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LotoStandardComponent } from './loto-standard.component';

describe('LotoStandardComponent', () => {
  let component: LotoStandardComponent;
  let fixture: ComponentFixture<LotoStandardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LotoStandardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LotoStandardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
