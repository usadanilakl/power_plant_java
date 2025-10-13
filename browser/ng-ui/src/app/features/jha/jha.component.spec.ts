import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JhaComponent } from './jha.component';

describe('JhaComponent', () => {
  let component: JhaComponent;
  let fixture: ComponentFixture<JhaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JhaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JhaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
