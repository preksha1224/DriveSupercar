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
  availableDates: string[] = [];

  dateShow=false;
  // Form fields
  carModel: string = '';
  bookingDate: string = '';
  selectTime: MinOption;
  selectedMin: number | undefined;
  selectedLocation: string = '';
  validationMessage: string = '';
  cars: string[] = [];
  selectedEventId: string = '';
  selectedEventCarId: string = '';
  carsList: Car[] = [];
  slotBooking: timeSlotBooking[] = [];
  locations: string[] = ['berlin', 'hamburg', 'munich'];
  isLocationLoading: boolean = false;
  carOptions: string[] = [];
  isCarLoading: boolean = false;
  evenetData: any = null;
  selectedEvents: any = null;
  noEvent=false;

  // Payment mock data
  totalAmount: number = 0;
  paymentMethod: string = '';
  readonly pricePerMinute: number = 15;

  // Time window and minute options
  readonly bookingWindow: TimeSlot = {
    id: 'all',
    startTime: '10:00',
    endTime: '16:00',
    selected: true,
    available: true,
  };
  minOption: MinOption = { minOption: [] };
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
  ) {
    this.selectTime = { minOption: [] };
  }

  ngOnInit(): void {

    this.getevent();
    this.currentStep = 1;
    this.carModel = '';

    // Use Angular's router navigation state
    const navState = this.route.snapshot?.root?.queryParams && Object.keys(this.route.snapshot.root.queryParams).length === 0
      ? history.state
      : this.route.snapshot.root.queryParams;
    let preselectedCar = '';

    if (navState && navState.selectedCar) {
      preselectedCar = navState.selectedCar;
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
        this.evenetData=res
      },

      error: (err: unknown): void => {
        console.error('Failed to load events', err);
        this.selectTime = { minOption: [] };
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

  getDate(){
    this.selectedEvents=null;
    if(this.carModel!=='' && this.selectedLocation!=='' ){
      console.log(this.evenetData);
      this.selectedEvents=this.evenetData.filter((event: any) => {
        return event.city_name===this.selectedLocation;
      });
      console.log(this.selectedEvents);
      if(this.selectedEvents.length>0){
        this.dateShow=true;
        this.noEvent=false;
        this.availableDates = this.generateAvailableDatesFromEvents(this.selectedEvents);
      }else{
        this.dateShow=true;
        this.noEvent=true;
      }
    }else{
      this.dateShow=false;
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

  selectMin(min: number): void {
    this.selectedMin = min;
    this.totalAmount = min * this.pricePerMinute;
    const buffer = min === 10 ? 5 : 10;
    this.slotBooking = this.getTimeIntervals(
      this.bookingWindow.startTime,
      this.bookingWindow.endTime,
      min,
      buffer,
    );
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
    this.validationMessage = '';
  }

  onBookingDateChange(): void {
    this.validationMessage = '';
    // Reset time slots when date changes
    if (this.selectedMin) {
      const buffer = this.selectedMin === 10 ? 5 : 10;
      this.slotBooking = this.getTimeIntervals(
        this.bookingWindow.startTime,
        this.bookingWindow.endTime,
        this.selectedMin,
        buffer,
      );
    }
  }

  submitBooking(): void {
    // Find selected time slot
    const selectedTimeRange = this.slotBooking.find((slot) => slot.selected);
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
    if (!this.selectedMin) {
      alert('Please select a minute option.');
      return;
    }
    if (!selectedTimeRange) {
      alert('Please select a time slot.');
      return;
    }

    // Find the selected car object
    const selectedCar = this.carsList.find((car) => `${car.make} ${car.model}` === this.carModel);
    if (!selectedCar) {
      alert('Selected car not found.');
      return;
    }

    // Get user_id from localStorage (set by AuthService)
    let user_id = '';
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        user_id = userObj.id || userObj._id || userObj.user_id || '';
      }
    } catch (e) {
      user_id = '';
    }
    if (!user_id) {
      alert('User not logged in. Please log in again.');
      return;
    }
    // Construct booking payload
    const bookingPayload = {
      user_id,
      eventCarId: this.selectedEventCarId,
      start_time: new Date(`${this.bookingDate}T${selectedTimeRange.start}:00`)
        .toISOString()
        .replace('.000', ''),
      end_time: new Date(`${this.bookingDate}T${selectedTimeRange.end}:00`)
        .toISOString()
        .replace('.000', ''),
      amount: Number(this.selectedMin) || 0,
    };

    console.log('Booking payload:', bookingPayload);
    this.booking.createBooking(bookingPayload).subscribe({
      next: (res) => {
        alert('Booking submitted successfully!');
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
  }

  getTimeIntervals(startTimeStr: string, endTimeStr: string, min: number, buffer: number) {
    const intervals: timeSlotBooking[] = [];
    const startTime = new Date();
    const endTime = new Date();
    const [startHours, startMinutes] = startTimeStr.split(':').map(Number);
    const [endHours, endMinutes] = endTimeStr.split(':').map(Number);
    startTime.setHours(startHours, startMinutes, 0, 0);
    endTime.setHours(endHours, endMinutes, 0, 0);
    if (endTime <= startTime) {
      endTime.setDate(endTime.getDate() + 1);
    }
    let currentStart = new Date(startTime);
    while (currentStart < endTime) {
      let currentEnd = new Date(currentStart);
      currentEnd.setMinutes(currentEnd.getMinutes() + min);
      if (currentEnd > endTime) {
        break;
      }
      const formattedStart = `${currentStart.getHours().toString().padStart(2, '0')}:${currentStart.getMinutes().toString().padStart(2, '0')}`;
      const formattedEnd = `${currentEnd.getHours().toString().padStart(2, '0')}:${currentEnd.getMinutes().toString().padStart(2, '0')}`;
      intervals.push({ start: formattedStart, end: formattedEnd, selected: false });
      // Advance to next slot: last end + buffer
      currentStart = new Date(currentEnd);
      currentStart.setMinutes(currentStart.getMinutes() + buffer);
      if (currentStart > endTime) break;
    }
    return intervals;
  }
}
