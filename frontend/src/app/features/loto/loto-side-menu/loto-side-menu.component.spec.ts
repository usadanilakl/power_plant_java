import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LotoSideMenuComponent } from './loto-side-menu.component';

describe('LotoSideMenuComponent', () => {
  let component: LotoSideMenuComponent;
  let fixture: ComponentFixture<LotoSideMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LotoSideMenuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LotoSideMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
