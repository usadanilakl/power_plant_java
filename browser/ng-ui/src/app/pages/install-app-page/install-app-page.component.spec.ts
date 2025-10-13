import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstallAppPageComponent } from './install-app-page.component';

describe('InstallAppPageComponent', () => {
  let component: InstallAppPageComponent;
  let fixture: ComponentFixture<InstallAppPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstallAppPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InstallAppPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
