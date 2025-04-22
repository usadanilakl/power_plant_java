import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrintTagFormComponent } from './print-tag-form.component';

describe('PrintTagFormComponent', () => {
  let component: PrintTagFormComponent;
  let fixture: ComponentFixture<PrintTagFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrintTagFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrintTagFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
