import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SmsPromptComponent } from './sms-prompt.component';

describe('SmsPromptComponent', () => {
  let component: SmsPromptComponent;
  let fixture: ComponentFixture<SmsPromptComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SmsPromptComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SmsPromptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
