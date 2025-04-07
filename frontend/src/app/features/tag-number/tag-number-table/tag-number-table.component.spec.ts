import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TagNumberTableComponent } from './tag-number-table.component';

describe('TagNumberTableComponent', () => {
  let component: TagNumberTableComponent;
  let fixture: ComponentFixture<TagNumberTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TagNumberTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TagNumberTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
