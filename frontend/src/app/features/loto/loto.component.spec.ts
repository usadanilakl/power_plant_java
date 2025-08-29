import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LotoComponent } from './loto.component';

describe('LotoComponent', () => {
  let component: LotoComponent;
  let fixture: ComponentFixture<LotoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LotoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LotoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
