import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarChoiceComponent } from './car-choice.component';

describe('CarChoiceComponent', () => {
  let component: CarChoiceComponent;
  let fixture: ComponentFixture<CarChoiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarChoiceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CarChoiceComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
