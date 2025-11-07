import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LotoPageComponent } from './loto-page.component';

describe('LotoPageComponent', () => {
  let component: LotoPageComponent;
  let fixture: ComponentFixture<LotoPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LotoPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LotoPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
