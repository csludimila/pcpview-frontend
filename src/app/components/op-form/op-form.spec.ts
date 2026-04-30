import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpFormComponent } from './op-form';

describe('OpFormComponent', () => {
  let component: OpFormComponent;
  let fixture: ComponentFixture<OpFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OpFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
