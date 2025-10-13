import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JhaPageComponent } from './jha-page.component';

describe('JhaPageComponent', () => {
  let component: JhaPageComponent;
  let fixture: ComponentFixture<JhaPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JhaPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JhaPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
