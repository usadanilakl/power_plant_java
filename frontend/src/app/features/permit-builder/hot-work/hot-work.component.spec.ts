import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotWorkComponent } from './hot-work.component';

describe('HotWorkComponent', () => {
  let component: HotWorkComponent;
  let fixture: ComponentFixture<HotWorkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotWorkComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HotWorkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
