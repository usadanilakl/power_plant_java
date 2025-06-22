import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RouterMenuComponent } from './router-menu.component';

describe('RouterMenuComponent', () => {
  let component: RouterMenuComponent;
  let fixture: ComponentFixture<RouterMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterMenuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RouterMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
