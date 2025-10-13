import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JhaLeftMenuComponent } from './jha-left-menu.component';

describe('JhaLeftMenuComponent', () => {
  let component: JhaLeftMenuComponent;
  let fixture: ComponentFixture<JhaLeftMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JhaLeftMenuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JhaLeftMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
