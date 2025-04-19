import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LotBoxDetailFormComponent } from './lot-box-detail-form.component';

describe('LotBoxDetailFormComponent', () => {
  let component: LotBoxDetailFormComponent;
  let fixture: ComponentFixture<LotBoxDetailFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LotBoxDetailFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LotBoxDetailFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
