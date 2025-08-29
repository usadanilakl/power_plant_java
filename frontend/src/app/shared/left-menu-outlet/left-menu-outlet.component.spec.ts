import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeftMenuOutletComponent } from './left-menu-outlet.component';

describe('LeftMenuOutletComponent', () => {
  let component: LeftMenuOutletComponent;
  let fixture: ComponentFixture<LeftMenuOutletComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeftMenuOutletComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeftMenuOutletComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
