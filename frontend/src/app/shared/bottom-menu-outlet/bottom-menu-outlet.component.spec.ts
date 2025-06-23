import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BottomMenuOutletComponent } from './bottom-menu-outlet.component';

describe('BottomMenuOutletComponent', () => {
  let component: BottomMenuOutletComponent;
  let fixture: ComponentFixture<BottomMenuOutletComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BottomMenuOutletComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BottomMenuOutletComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
