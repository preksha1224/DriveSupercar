import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CarService } from '../services/car.service';
import { EventService } from '../services/event.service';
import { BookingService } from '../services/booking';
import { Car } from '../model/cars.model';
interface Booking {
  id: string;
  bookingDate: Date;
  timeSlot: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  carModel?: string;
}

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  selected: boolean;
  available: boolean;
}
interface timeSlotBooking {
  start: string;
  end: string;
  selected: boolean;
  disabled: boolean;
}

interface MinOption {
  minOption: number[];
}

@Component({
  selector: 'app-booking-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './booking-page.component.html',
  styleUrl: './booking-page.component.scss',
})
export class BookingPageComponent implements OnInit {
  currentStep: number = 1;
  readonly totalSteps: number = 4;
  readonly stepLabels: string[] = [
    'Select Car, Location & Date',
    'Choose Minutes',
    'Select Time Slot',
    'Payment',
  ];

  // Gift voucher fields
  isGiftVoucher: boolean = false;
  recipientName: string = '';
  recipientEmail: string = '';

  availableDates: string[] = [];
  getBookedSlots: any[] = [];
  dateShow = false;
  // Form fields
  carModel: string = '';
  bookingDate: string = '';
  selectTime: any;
  selectedMin: any | undefined;
  selectedLocation: string = '';
  validationMessage: string = '';
  carsList: Car[] = [];
  slotBooking: timeSlotBooking[] = [];
  locations: string[] = ['berlin', 'hamburg', 'munich'];
  isLocationLoading: boolean = false;
  isCarLoading: boolean = false;
  evenetData: any = null;
  selectedEvents: any = null;
  noEvent = false;
  totalAmount: number = 0;
  paymentMethod: string = '';
  readonly pricePerMinute: number = 15;
  finalEventData: any = null;

  // Location info
  selectedState: string = '';
  selectedCity: string = '';

  // Add durationMap for mapping allowed_duration keys to minutes
  durationMap: { [key: string]: number } = {
    TEN: 10,
    TWENTY: 20,
    FORTY: 40,
    SIXTY: 60,
    DURATION_10_MIN: 10,
    DURATION_20_MIN: 20,
    DURATION_40_MIN: 40,
    DURATION_60_MIN: 60,
    '10': 10,
    '20': 20,
    '40': 40,
    '60': 60,
  };

  constructor(
    private route: ActivatedRoute,
    private carService: CarService,
    private cdr: ChangeDetectorRef,
    private event: EventService,
    private booking: BookingService,
  ) {}

  ngOnInit(): void {
    this.getevent();
    this.currentStep = 1;
    this.carModel = '';

    const navState = this.route.snapshot?.root?.queryParams && Object.keys(this.route.snapshot.root.queryParams).length === 0
      ? history.state
      : this.route.snapshot.root.queryParams;
    let preselectedCar = '';

    if (navState && navState.selectedCar) {
      preselectedCar = navState.selectedCar;
    }

    // Check if this is a gift voucher booking
    if (navState && navState.isGiftVoucher) {
      this.isGiftVoucher = true;
    }

    this.getcar(preselectedCar);
    if (navState) {
      // Handle available dates (from calendar selection)
      if (navState.availableDates && Array.isArray(navState.availableDates)) {
        // Dates as ISO strings or Date objects
        this.availableDates = navState.availableDates.map((d: any) => {
          const dateObj = new Date(d);
          return !isNaN(dateObj.getTime()) ? dateObj.toISOString().split('T')[0] : d;
        });
      } else if (navState.availableCities && Array.isArray(navState.availableCities)) {
        // If availableCities has date info, extract all unique dates
        const dates: string[] = navState.availableCities
          .map((city: any) => city.date)
          .filter((d: any) => !!d)
          .map((d: any) => {
            const dateObj = new Date(d);
            return !isNaN(dateObj.getTime()) ? dateObj.toISOString().split('T')[0] : d;
          });
        this.availableDates = Array.from(new Set(dates));
      } else if (navState.selectedDate) {
        // Fallback: single selected date
        const dateObj = new Date(navState.selectedDate);
        if (!isNaN(dateObj.getTime())) {
          this.availableDates = [dateObj.toISOString().split('T')[0]];
        } else if (typeof navState.selectedDate === 'string') {
          this.availableDates = [navState.selectedDate];
        }
      }
      if (navState.selectedDate) {
        const dateObj = new Date(navState.selectedDate);
        if (!isNaN(dateObj.getTime())) {
          this.bookingDate = dateObj.toISOString().split('T')[0];
        } else if (typeof navState.selectedDate === 'string') {
          this.bookingDate = navState.selectedDate;
        }
      } else if (this.availableDates.length > 0) {
        this.bookingDate = this.availableDates[0];
      }

      if (navState.location) {
        this.selectedLocation = navState.location.toString().toLocaleLowerCase();
      }
    }
    console.log('Navigation state:', this.selectedLocation);
  }

  getcar(preselectedCar: string = ''): void {
    console.log('Fetching cars with preselectedCar:', preselectedCar);
    this.isCarLoading = true;
    this.carService.getCar().subscribe({
      next: (res: any): void => {
        console.log('Car data:', res);
        this.carsList = res.data;
        for (const car of this.carsList) {
          const carDisplayName = `${car.make} ${car.model}`;
          if (carDisplayName === preselectedCar) {
            this.carModel = car.car_id;
            break;
          }
        }
        this.isCarLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        console.error('Failed to load cars', err);
        if (!preselectedCar) {
          this.carModel = '';
        }
        this.isCarLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  getevent(): void {
    this.event.getEvent().subscribe({
      next: (res: any): void => {
        console.log('Event data:', res);
        this.evenetData = res;
      },

      error: (err: unknown): void => {
        console.error('Failed to load events', err);
        this.selectTime = null;
        this.selectedMin = undefined;
        this.slotBooking = [];
        this.isLocationLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  get minPickupDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  get canSubmit(): boolean {
    return this.isStepValid(4);
  }

  isStepActive(step: number): boolean {
    return this.currentStep === step;
  }

  isStepCompleted(step: number): boolean {
    return step < this.currentStep;
  }

  goToStep(step: number): void {
    if (step < 1 || step > this.totalSteps) {
      return;
    }

    if (step <= this.currentStep) {
      this.currentStep = step;
      this.validationMessage = '';
      return;
    }

    for (let i = this.currentStep; i < step; i++) {
      if (!this.isStepValid(i)) {
        this.validationMessage = this.getStepValidationMessage(i);
        return;
      }
    }

    this.currentStep = step;
    this.validationMessage = '';
  }

  nextStep(): void {
    if (!this.isStepValid(this.currentStep)) {
      this.validationMessage = this.getStepValidationMessage(this.currentStep);
      return;
    }

    if (this.currentStep < this.totalSteps) {
      this.currentStep += 1;
      this.validationMessage = '';
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep -= 1;
      this.validationMessage = '';
    }
  }

  isStepValid(step: number): boolean {
    switch (step) {
      case 1:
        // Add email validation for gift voucher
        if (this.isGiftVoucher) {
          return !!this.carModel && !!this.selectedLocation && !!this.bookingDate &&
            !!this.recipientName && !!this.recipientEmail && this.isValidEmail(this.recipientEmail);
        }
        return !!this.carModel && !!this.selectedLocation && !!this.bookingDate;
      case 2:
        return !!this.selectedMin;
      case 3:
        return this.slotBooking.some((slot) => slot.selected);
      case 4:
        return !!this.paymentMethod;
      default:
        return false;
    }
  }

  getStepValidationMessage(step: number): string {
    switch (step) {
      case 1:
        if (!this.carModel) return 'Please select a car to continue.';
        if (!this.selectedLocation) return 'Please select a location.';
        if (!this.bookingDate) return 'Please select a date.';
        if (this.isGiftVoucher) {
          if (!this.recipientName) return 'Please enter recipient name.';
          if (!this.recipientEmail) return 'Please enter recipient email.';
          if (!this.isValidEmail(this.recipientEmail)) return 'Please enter a valid email address.';
        }
        return 'Please complete all required fields.';
      case 2:
        return 'Please choose a minute option.';
      case 3:
        return 'Please select an available time slot.';
      case 4:
        return 'Please select a payment method.';
      default:
        return 'Please complete all required fields.';
    }
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  selectCar(car: string): void {
    console.log(car);
    this.carModel = car;
    this.getDate();
  }

  selectLocation(location: string): void {
    this.selectedLocation = location;
    this.validationMessage = '';
    this.getDate();
  }

  getDate() {
    this.selectedEvents = null;
    if (this.carModel !== '' && this.selectedLocation !== '') {
      // Filter events by both city and car
      this.selectedEvents = this.evenetData.filter((event: any) => {
        // Check if event has eventCars and one matches the selected car
        const hasCar = Array.isArray(event.eventCars) && event.eventCars.some((ec: any) => ec.car_id === this.carModel);
        return event.city_name === this.selectedLocation && hasCar;
      });
      console.log('Filtered events for car and location:', this.selectedEvents);
      if (this.selectedEvents.length > 0) {
        this.dateShow = true;
        this.noEvent = false;
        this.availableDates = this.generateAvailableDatesFromEvents(this.selectedEvents);
      } else {
        this.dateShow = true;
        this.noEvent = true;
        this.availableDates = [];
      }
    } else {
      this.dateShow = false;
    }
  }

  generateAvailableDatesFromEvents(events: any[]): string[] {
    const allDates = new Set<string>();
    events.forEach(event => {
      const start = new Date(event.start_date);
      const end = new Date(event.end_date);
      for (
        let d = new Date(start);
        d <= end;
        d.setDate(d.getDate() + 1)
      ) {
        allDates.add(d.toISOString().split('T')[0]);
      }
    });
    return Array.from(allDates).sort();
  }

  selectMin(slot: any): void {
    console.log('Selected minutes:', slot.value);
    this.selectedMin = slot.label;
    this.totalAmount = slot.value * this.pricePerMinute;
    let eventMatched: any = null;
    const buffer = slot.value === 10 ? 5 : 10;
    for (const event of this.finalEventData.eventTimeWindows) {
      if (event.allowed_duration.includes(slot.label)) {
        eventMatched=event;
      }
    }
    console.log('Matched event for selected minutes:', eventMatched);
     this.slotBooking = this.getTimeIntervals(eventMatched.start_time, eventMatched.end_time, slot.value, buffer);
    console.log('Generated time slots:', this.slotBooking);

    this.validationMessage = '';
  }

  selectPaymentMethod(method: string): void {
    this.paymentMethod = method;
    this.validationMessage = '';
  }

  selectDividedSlot(selectedSlot: timeSlotBooking): void {
    this.slotBooking = this.slotBooking.map((slot) => ({
      ...slot,
      selected: slot.start === selectedSlot.start && slot.end === selectedSlot.end,
    }));
    console.log(this.slotBooking);
    this.validationMessage = '';
  }

  onBookingDateChange(): void {
    console.log('Selected booking date:', this.bookingDate);
    console.log('Selected events:', this.selectedEvents);

    if (!this.bookingDate || !this.selectedEvents || !Array.isArray(this.selectedEvents)) {
      this.selectTime = null;
      return;
    }

    // Find the event where bookingDate is between start_date and end_date
    const bookingDateObj = new Date(this.bookingDate);
    const matchingEvent = this.selectedEvents.find((event: any) => {
      const start = new Date(event.start_date);
      const end = new Date(event.end_date);
      // bookingDate should be >= start_date and <= end_date
      return bookingDateObj >= start && bookingDateObj <= end;
    });
    this.finalEventData = matchingEvent;
    console.log('Matching event for selected date:', matchingEvent);
    const gettingEventCarId = this.finalEventData?.eventCars.find((ec: any) => ec.car_id === this.carModel)?.id;
    console.log('Event cars matching selected car:', gettingEventCarId);
    if (!matchingEvent || !gettingEventCarId) {
      this.selectTime = null;
      this.finalEventData = null;
      return;
    }

    // Only use time windows for the selected car (eventCarId)
    const timeWindows = (matchingEvent.eventTimeWindows || []).filter((tw: any) => {
      // If eventCarId is present on the time window, match it; otherwise, include all
      return !tw.eventCarId || tw.eventCarId === gettingEventCarId;
    });
    console.log('Time windows for selected car and date:', timeWindows);
    const durationOrder = [
      'TEN', 'TWENTY', 'FORTY', 'SIXTY',
      'DURATION_10_MIN', 'DURATION_20_MIN', 'DURATION_40_MIN', 'DURATION_60_MIN',
      '10', '20', '40', '60'
    ];
    let allowedSet = new Set<string>();
    timeWindows.forEach((tw: any) => {
      if (Array.isArray(tw.allowed_duration)) {
        tw.allowed_duration.forEach((d: string) => {
          if (Object.prototype.hasOwnProperty.call(this.durationMap, d)) {
            allowedSet.add(d);
          }
        });
      }
    });
    let minOptions: { label: string; value: number }[] = [];
    durationOrder.forEach((key) => {
      if (allowedSet.has(key)) {
        const min = this.durationMap[key];
        if (min && !minOptions.some(opt => opt.value === min && opt.label === key)) {
          minOptions.push({ label: key, value: min });
        }
      }
    });
    this.selectTime = { minOption: minOptions };
    if (!minOptions.some(opt => opt.label === this.selectedMin)) {
      this.selectedMin = undefined;
    }
    // Optionally reset slotBooking
    console.log('Updated minute options:', this.selectTime);
    console.log('EventCariD:', gettingEventCarId);
    console.log('Date:', this.bookingDate);

    if(gettingEventCarId && this.bookingDate){
      const requestbody = {
        eventCarId: gettingEventCarId,
        date: this.bookingDate.toString(),
      };
      console.log('Request body for fetching bookings by date:', requestbody);
      this.booking.getBookingAsPerDate(requestbody).subscribe({
        next: (res: any): void => {
          console.log('Bookings for date:', res);
          this.getBookedSlots = res.data;
        },
        error: (err: Error): void => {
          console.error('Failed to load bookings for date', err);
        },
      })
    }
    this.slotBooking = [];
  }

  submitBooking(): void {
    const selectedTimeRange = this.slotBooking.find((slot) => slot.selected);
    console.log('Submitting booking with details:', {
      carModel: this.carModel,
      selectedLocation: this.selectedLocation,
      bookingDate: this.bookingDate,
      selectedMin: this.selectedMin,
      selectedTimeRange,
    });
    if (!this.carModel) {
      alert('Please select a car.');
      return;
    }
    if (!this.selectedLocation) {
      alert('Please select a location.');
      return;
    }
    if (!this.bookingDate) {
      alert('Please select a date.');
      return;
    }
    // if (this.isGiftVoucher) {
    //   if (!this.recipientName) {
    //     alert('Please enter recipient name.');
    //     return;
    //   }
    //   if (!this.recipientEmail || !this.isValidEmail(this.recipientEmail)) {
    //     alert('Please enter a valid recipient email.');
    //     return;
    //   }
    // }
    if (!this.selectedMin) {
      alert('Please select a minute option.');
      return;
    }
    if (!selectedTimeRange) {
      alert('Please select a time slot.');
      return;
    }
    let user_id = '';
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        user_id = userObj.id;
        console.log('Extracted user_id from localStorage:', user_id);
      }
    } catch (e) {
      user_id = '';
    }
    if (!user_id) {
      alert('User not logged in. Please log in again.');
      return;
    }

    const gettingEventCarId = this.finalEventData?.eventCars.find((ec: any) => ec.car_id === this.carModel).id;
    console.log('Event cars matching selected car:', gettingEventCarId);

    const bookingPayload: any = {
      user_id,
      eventCarId: gettingEventCarId,
      start_time: new Date(`${this.bookingDate}T${selectedTimeRange.start}:00`)
        .toISOString()
        .replace('.000', ''),
      end_time: new Date(`${this.bookingDate}T${selectedTimeRange.end}:00`)
        .toISOString()
        .replace('.000', ''),
      amount: Number(this.totalAmount) || 0,
    };

    // Add gift voucher fields if applicable
    if (this.isGiftVoucher) {
      bookingPayload.isGiftVoucher = true;
      bookingPayload.recipientName = this.recipientName;
      bookingPayload.recipientEmail = this.recipientEmail;
    }

    console.log('Booking payload:', bookingPayload);
    this.booking.createBooking(bookingPayload).subscribe({
      next: (res) => {
        console.log(res);
        if (this.isGiftVoucher) {
          alert(`Gift voucher sent successfully to ${this.recipientEmail}!`);
        } else {
          alert('Booking submitted successfully!');
        }
        this.resetForm();
      },
      error: (err) => {
        alert('Booking failed: ' + (err?.message || err));
      },
    });
  }

  resetForm(): void {
    this.carModel = '';
    this.bookingDate = '';
    this.selectedLocation = '';
    this.selectedMin = undefined;
    this.slotBooking = [];
    this.currentStep = 1;
    this.validationMessage = '';
    this.recipientName = '';
    this.recipientEmail = '';
    this.isGiftVoucher = false;
  }

  getTimeIntervals(startTimeStr: string, endTimeStr: string, min: number, buffer: number) {
    console.log(`Generating time intervals from ${startTimeStr} to ${endTimeStr} with duration ${min} minutes and buffer ${buffer} minutes`);
    const intervals: timeSlotBooking[] = [];
    // If input is ISO string, parse as date, else fallback to time string
    let startTime: Date, endTime: Date;
    if (startTimeStr.includes('T')) {
      startTime = new Date(startTimeStr);
    } else {
      startTime = new Date();
      const [startHours, startMinutes] = startTimeStr.split(':').map(Number);
      startTime.setHours(startHours, startMinutes, 0, 0);
    }
    if (endTimeStr.includes('T')) {
      endTime = new Date(endTimeStr);
    } else {
      endTime = new Date();
      const [endHours, endMinutes] = endTimeStr.split(':').map(Number);
      endTime.setHours(endHours, endMinutes, 0, 0);
    }
    if (endTime <= startTime) {
      endTime.setDate(endTime.getDate() + 1);
    }
    let currentStart = new Date(startTime);
    while (currentStart < endTime) {
      let currentEnd = new Date(currentStart);
      currentEnd.setMinutes(currentEnd.getMinutes() + min);
      const formattedStart = `${currentStart.getHours().toString().padStart(2, '0')}:${currentStart.getMinutes().toString().padStart(2, '0')}`;
      const formattedEnd = `${currentEnd.getHours().toString().padStart(2, '0')}:${currentEnd.getMinutes().toString().padStart(2, '0')}`;
      let disabled = false;
      if (Array.isArray(this.getBookedSlots) && this.getBookedSlots.length > 0) {
        const slotStart = new Date(`${this.bookingDate}T${formattedStart}:00`);
        const slotEnd = new Date(`${this.bookingDate}T${formattedEnd}:00`);
        for (const booked of this.getBookedSlots) {
          let bookedStart = new Date(booked.start_time);
          let bookedEnd = new Date(booked.end_time);
          bookedStart = new Date(bookedStart.getTime() - buffer * 60000);
          bookedEnd = new Date(bookedEnd.getTime() + buffer * 60000);
          if (slotStart < bookedEnd && slotEnd > bookedStart) {
            disabled = true;
            break;
          }
        }
      }
      intervals.push({ start: formattedStart, end: formattedEnd, selected: false, disabled });
      currentStart = new Date(currentEnd);
      currentStart.setMinutes(currentStart.getMinutes() + buffer);
      if (currentStart > endTime) break;
    }
    return intervals;
  }
}
