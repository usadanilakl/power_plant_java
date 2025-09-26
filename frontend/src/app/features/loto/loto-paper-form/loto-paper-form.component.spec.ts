import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LotoPaperFormComponent } from './loto-paper-form.component';

describe('LotoPaperFormComponent', () => {
  let component: LotoPaperFormComponent;
  let fixture: ComponentFixture<LotoPaperFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LotoPaperFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LotoPaperFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
