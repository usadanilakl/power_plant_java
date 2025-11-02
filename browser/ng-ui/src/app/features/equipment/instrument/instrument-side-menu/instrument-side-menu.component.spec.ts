import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstrumentSideMenuComponent } from './instrument-side-menu.component';

describe('InstrumentSideMenuComponent', () => {
  let component: InstrumentSideMenuComponent;
  let fixture: ComponentFixture<InstrumentSideMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstrumentSideMenuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InstrumentSideMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
