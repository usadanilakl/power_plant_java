import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JhaFormComponent } from './jha-form.component';

describe('JhaFormComponent', () => {
  let component: JhaFormComponent;
  let fixture: ComponentFixture<JhaFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JhaFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JhaFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
