import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormContainerRendererComponent } from './form-container-renderer.component';

describe('FormContainerRendererComponent', () => {
  let component: FormContainerRendererComponent;
  let fixture: ComponentFixture<FormContainerRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormContainerRendererComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormContainerRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
