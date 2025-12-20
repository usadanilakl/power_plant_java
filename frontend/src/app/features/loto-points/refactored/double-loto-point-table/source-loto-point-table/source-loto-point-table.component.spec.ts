import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SourceLotoPointTableComponent } from './source-loto-point-table.component';

describe('SourceLotoPointTableComponent', () => {
  let component: SourceLotoPointTableComponent;
  let fixture: ComponentFixture<SourceLotoPointTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SourceLotoPointTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SourceLotoPointTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
