import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarVerifyComponent } from './car-verify.component';

describe('CarVerifyComponent', () => {
  let component: CarVerifyComponent;
  let fixture: ComponentFixture<CarVerifyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarVerifyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CarVerifyComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
