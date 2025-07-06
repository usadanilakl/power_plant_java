import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TagNumberGeneratorComponent } from './tag-number-generator.component';

describe('TagNumberGeneratorComponent', () => {
  let component: TagNumberGeneratorComponent;
  let fixture: ComponentFixture<TagNumberGeneratorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TagNumberGeneratorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TagNumberGeneratorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
