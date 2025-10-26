import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserLeftMenuComponent } from './user-left-menu.component';

describe('UserLeftMenuComponent', () => {
  let component: UserLeftMenuComponent;
  let fixture: ComponentFixture<UserLeftMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserLeftMenuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserLeftMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
