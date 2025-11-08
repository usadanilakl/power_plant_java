import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LotoPointActionComponent } from './loto-point-action.component';

describe('LotoPointActionComponent', () => {
  let component: LotoPointActionComponent;
  let fixture: ComponentFixture<LotoPointActionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LotoPointActionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LotoPointActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
