import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarSuccessComponent } from './car-success.component';

describe('CarSuccessComponent', () => {
  let component: CarSuccessComponent;
  let fixture: ComponentFixture<CarSuccessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarSuccessComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CarSuccessComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
