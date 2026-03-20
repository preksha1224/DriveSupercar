import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookingdetailspageComponent } from './bookingdetailspage.component';

describe('BookingdetailspageComponent', () => {
  let component: BookingdetailspageComponent;
  let fixture: ComponentFixture<BookingdetailspageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingdetailspageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BookingdetailspageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
