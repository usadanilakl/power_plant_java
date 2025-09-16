import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormContainerListComponent } from './form-container-list.component';

describe('FormContainerListComponent', () => {
  let component: FormContainerListComponent;
  let fixture: ComponentFixture<FormContainerListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormContainerListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormContainerListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
