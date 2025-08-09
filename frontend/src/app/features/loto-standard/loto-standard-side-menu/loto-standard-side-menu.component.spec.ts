import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LotoStandardSideMenuComponent } from './loto-standard-side-menu.component';

describe('LotoStandardSideMenuComponent', () => {
  let component: LotoStandardSideMenuComponent;
  let fixture: ComponentFixture<LotoStandardSideMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LotoStandardSideMenuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LotoStandardSideMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
