import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailPromptComponent } from './email-prompt.component';

describe('EmailPromptComponent', () => {
  let component: EmailPromptComponent;
  let fixture: ComponentFixture<EmailPromptComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmailPromptComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmailPromptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
