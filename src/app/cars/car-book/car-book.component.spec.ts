import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarBookComponent } from './car-book.component';

describe('CarBookComponent', () => {
  let component: CarBookComponent;
  let fixture: ComponentFixture<CarBookComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarBookComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CarBookComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
