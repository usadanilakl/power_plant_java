import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PyramidGraphComponent } from './pyramid-graph.component';

describe('PyramidGraphComponent', () => {
  let component: PyramidGraphComponent;
  let fixture: ComponentFixture<PyramidGraphComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PyramidGraphComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PyramidGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
