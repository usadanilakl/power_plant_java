import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TagNumberDetailFormComponent } from './tag-number-detail-form.component';

describe('TagNumberDetailFormComponent', () => {
  let component: TagNumberDetailFormComponent;
  let fixture: ComponentFixture<TagNumberDetailFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TagNumberDetailFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TagNumberDetailFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
