import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewFileFormComponent } from './new-file-form.component';

describe('NewFileFormComponent', () => {
  let component: NewFileFormComponent;
  let fixture: ComponentFixture<NewFileFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewFileFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewFileFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
