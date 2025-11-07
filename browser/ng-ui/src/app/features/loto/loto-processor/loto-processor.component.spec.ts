import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LotoProcessorComponent } from './loto-processor.component';

describe('LotoProcessorComponent', () => {
  let component: LotoProcessorComponent;
  let fixture: ComponentFixture<LotoProcessorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LotoProcessorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LotoProcessorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
