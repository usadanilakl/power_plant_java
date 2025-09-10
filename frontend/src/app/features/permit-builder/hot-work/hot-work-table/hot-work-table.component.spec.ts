import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotWorkTableComponent } from './hot-work-table.component';

describe('HotWorkTableComponent', () => {
  let component: HotWorkTableComponent;
  let fixture: ComponentFixture<HotWorkTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotWorkTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HotWorkTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
