import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JhaTableComponent } from './jha-table.component';

describe('JhaTableComponent', () => {
  let component: JhaTableComponent;
  let fixture: ComponentFixture<JhaTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JhaTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JhaTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
