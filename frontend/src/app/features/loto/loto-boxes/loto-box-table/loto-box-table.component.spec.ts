import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LotoBoxTableComponent } from './loto-box-table.component';

describe('LotoBoxTableComponent', () => {
  let component: LotoBoxTableComponent;
  let fixture: ComponentFixture<LotoBoxTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LotoBoxTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LotoBoxTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
