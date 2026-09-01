import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LotoBoxDetailFormComponent } from './loto-box-detail-form.component';

describe('LotBoxDetailFormComponent', () => {
  let component: LotoBoxDetailFormComponent;
  let fixture: ComponentFixture<LotoBoxDetailFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LotoBoxDetailFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LotoBoxDetailFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
