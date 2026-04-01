import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowBookingUserComponent } from './show-booking-user.component';

describe('ShowBookingUserComponent', () => {
  let component: ShowBookingUserComponent;
  let fixture: ComponentFixture<ShowBookingUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowBookingUserComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShowBookingUserComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
