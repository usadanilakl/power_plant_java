import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TagNumberComponent } from './tag-number.component';

describe('TagNumberComponent', () => {
  let component: TagNumberComponent;
  let fixture: ComponentFixture<TagNumberComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TagNumberComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TagNumberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
