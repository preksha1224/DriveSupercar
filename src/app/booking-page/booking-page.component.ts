import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CarService } from '../services/car.service';
import { EventService } from '../services/event.service';
import { appConfig } from '../app.config';
import { BookingService } from '../services/booking';
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
    'Select Car',
    'Choose Location',
    'Choose Minutes',
    'Date & Time Slot',
  ];
  availableDates: string[] = [];

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
  carsList: import('../model/cars.model').Car[] = [];
  slotBooking: timeSlotBooking[] = [];
  locations: string[] = [];
  isLocationLoading: boolean = false;
  carOptions: string[] = [];
  isCarLoading: boolean = false;

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
    this.getcar();

    const navState = window.history.state;
    let preselectedCar = '';

    // Handle selected car from home page BEFORE loading cars
    if (navState && navState.selectedCar) {
      preselectedCar = navState.selectedCar;
      this.carModel = preselectedCar;
    }

    this.getcar(preselectedCar);
    if (navState) {
      // Handle selected car from home page
      if (navState.selectedCar) {
        this.carModel = navState.selectedCar;
        console.log(this.carModel);
      }

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

      // Pre-select bookingDate if available
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
        this.selectedLocation = navState.location;
      }
      if (
        navState.availableCities &&
        Array.isArray(navState.availableCities) &&
        navState.availableCities.length > 0
      ) {
        if (!this.selectedLocation && navState.availableCities[0]?.name) {
          this.selectedLocation = navState.availableCities[0].name;
        }
      }
    }

    this.route.queryParams.subscribe((params) => {
      this.selectedState = params['state'] || '';
      this.selectedCity = params['city'] || '';
    });

    this.route.queryParamMap.subscribe((params) => {
      this.selectedLocation = params.get('location') ?? '';
    });

    // Ensure availableDates has dates even when navigating directly
    if (!this.availableDates || this.availableDates.length === 0) {
      // Generate next 30 days as available dates
      const dates: string[] = [];
      const today = new Date();
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        dates.push(date.toISOString().split('T')[0]);
      }
      this.availableDates = dates;
    }

    // Ensure bookingDate is set to first available date if not already set
    if (!this.bookingDate && this.availableDates.length > 0) {
      this.bookingDate = this.availableDates[0];
    }
  }

  getcar(preselectedCar: string = ''): void {
    this.isCarLoading = true;
    this.carService.getCar().subscribe({
      next: (res: unknown): void => {
        const api = res as
          | { data?: import('../model/cars.model').Car[] }
          | import('../model/cars.model').Car[];
        const list: import('../model/cars.model').Car[] = Array.isArray(api)
          ? api
          : (api.data ?? []);

        this.carsList = list;
        const names: string[] = list
          .map((car) => `${car.make} ${car.model}`)
          .filter(
            (name: unknown): name is string => typeof name === 'string' && name.trim().length > 0,
          );

        this.carOptions = Array.from(new Set<string>(names));

        // Restore preselected car after loading options
        if (preselectedCar) {
          this.carModel = preselectedCar;
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
    this.isLocationLoading = true;

    this.event.getEvent().subscribe({
      next: (res: unknown): void => {
        const root = res as any;
        const list: any[] = Array.isArray(root)
          ? root
          : Array.isArray(root?.data)
            ? root.data
            : Array.isArray(root?.data?.data)
              ? root.data.data
              : [];

        // Set selectedEventId and selectedEventCarId from the first event if available
        if (list.length > 0 && list[0].id) {
          this.selectedEventId = list[0].id;
          if (
            Array.isArray(list[0].eventCars) &&
            list[0].eventCars.length > 0 &&
            list[0].eventCars[0].id
          ) {
            this.selectedEventCarId = list[0].eventCars[0].id;
          }
        }

        const cityNames: string[] = list
          .map(
            (item: any) =>
              item?.cityName ??
              item?.city_name ??
              item?.city ??
              item?.CityName ??
              item?.location?.cityName ??
              item?.location?.city ??
              item?.address?.cityName ??
              item?.address?.city,
          )
          .filter(
            (city: unknown): city is string => typeof city === 'string' && city.trim().length > 0,
          )
          .map((city: string) => city.trim());

        this.locations = Array.from(new Set(cityNames));

        const allowedDurations: string[] = list
          .flatMap((eventItem: any) => {
            const windows = Array.isArray(eventItem?.eventTimeWindows)
              ? eventItem.eventTimeWindows
              : [];
            return windows.flatMap((windowItem: any) =>
              Array.isArray(windowItem?.allowed_duration) ? windowItem.allowed_duration : [],
            );
          })

          .filter(
            (value: unknown): value is string =>
              typeof value === 'string' && value.trim().length > 0,
          )
          .map((value: string) => value.trim().toUpperCase());
        console.log('allowduration', allowedDurations);

        const minutes: number[] = Array.from(
          new Set(
            allowedDurations
              .map((durationKey: string) => this.durationMap[durationKey])
              .filter((value: number | undefined): value is number => typeof value === 'number'),
          ),
        ).sort((a: number, b: number) => a - b);
        console.log('minutes', minutes);

        this.selectTime = {
          minOption: minutes,
        };
        console.log('selecttime', this.selectTime);

        this.selectedMin = undefined;
        this.slotBooking = [];
        this.isLocationLoading = false;
        this.cdr.detectChanges();
      },

      error: (err: unknown): void => {
        console.error('Failed to load events', err);
        this.locations = [];
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
        return !!this.carModel;
      case 2:
        return !!this.selectedLocation;
      case 3:
        return !!this.selectedMin;
      case 4:
        return !!this.bookingDate && this.slotBooking.some((slot) => slot.selected);
      default:
        return false;
    }
  }

  getStepValidationMessage(step: number): string {
    switch (step) {
      case 1:
        return 'Please select a car to continue.';
      case 2:
        return 'Please select a pickup location.';
      case 3:
        return 'Please choose a minute option.';
      case 4:
        return 'Please select pickup/drop date and an available time slot.';
      default:
        return 'Please complete all required fields.';
    }
  }

  selectCar(car: string): void {
    // this.getcar();
    console.log(car);
    this.carModel = car;
  }

  selectLocation(location: string): void {
    this.selectedLocation = location;
    this.validationMessage = '';
  }

  selectMin(min: number): void {
    this.selectedMin = min;
    const buffer = min === 10 ? 5 : 10;
    this.slotBooking = this.getTimeIntervals(
      this.bookingWindow.startTime,
      this.bookingWindow.endTime,
      min,
      buffer,
    );
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
      alert('Please select a booking date.');
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
