import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CarService } from '../services/car.service';
import { EventService } from '../services/event.service';
import { BookingService } from '../services/booking';
import { EmailService } from '../services/email.service';
import { PaymentService } from '../services/payment.service';
import { Car } from '../model/cars.model';
// Stripe types (for TypeScript)
declare var Stripe: any;
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
  userEmail: string = '';
  userPhone: string = '';
  stripeLoaded = false;
  stripe: any = null;
  cardElement: any = null;
  isProcessingPayment = false;
  paymentError: string = '';
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
    private router: Router,
    private carService: CarService,
    private cdr: ChangeDetectorRef,
    private event: EventService,
    private booking: BookingService,
    private emailService: EmailService,
    private paymentService: PaymentService,
  ) {}

  ngOnInit(): void {
    this.loadStripe();
    // Dynamically load Stripe.js
    this.getevent();
    this.currentStep = 1;
    this.carModel = '';
    // Get user email and phone from localStorage if available
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        this.userEmail = userObj.email || '';
        this.userPhone = userObj.phone || '';
      }
    } catch (e) {
      this.userEmail = '';
      this.userPhone = '';
    }

    const navState =
      this.route.snapshot?.root?.queryParams &&
      Object.keys(this.route.snapshot.root.queryParams).length === 0
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
  loadStripe() {
    if (this.stripeLoaded) return;
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.onload = () => {
      this.stripeLoaded = true;
      // Stripe publishable key (safe to use in frontend)
      const stripeKey =
        'pk_test_51TFWe68fSwJ7kpHqQNe1eUmVNiFcJrZkomxChFtCKgsAqrMUUjNurWcmojkhPMMtcTuQQOw0Jm2pcB7ClnyWWdyG00wzEVmVXx';
      this.stripe = (window as any).Stripe(stripeKey);
      console.log('✓ Stripe loaded successfully');

      // Initialize Stripe Elements
      setTimeout(() => this.mountCardElement(), 100);
    };
    script.onerror = () => {
      console.error('Failed to load Stripe.js');
      alert('Payment system failed to load. Please refresh the page.');
    };
    document.body.appendChild(script);
  }

  /**
   * Mount Stripe card element when user reaches payment step
   */
  mountCardElement() {
    if (!this.stripe || this.cardElement) return;

    // Wait until we're on step 4 and the card element container exists
    const cardElementContainer = document.getElementById('card-element');
    if (!cardElementContainer) {
      return; // Will be called again when step 4 is reached
    }

    const elements = this.stripe.elements();
    this.cardElement = elements.create('card', {
      hidePostalCode: true, // Disable postal code requirement
      style: {
        base: {
          fontSize: '16px',
          color: '#424770',
          '::placeholder': {
            color: '#aab7c4',
          },
        },
        invalid: {
          color: '#9e2146',
        },
      },
    });

    this.cardElement.mount('#card-element');

    // Listen for errors
    this.cardElement.on('change', (event: any) => {
      if (event.error) {
        this.paymentError = event.error.message;
      } else {
        this.paymentError = '';
      }
      this.cdr.detectChanges();
    });

    console.log('✓ Card element mounted');
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

      // Mount card element when reaching payment step
      if (this.currentStep === 4) {
        setTimeout(() => this.mountCardElement(), 100);
      }
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
          return (
            !!this.carModel &&
            !!this.selectedLocation &&
            !!this.bookingDate &&
            !!this.recipientName &&
            !!this.recipientEmail &&
            this.isValidEmail(this.recipientEmail)
          );
        }
        return !!this.carModel && !!this.selectedLocation && !!this.bookingDate;
      case 2:
        return !!this.selectedMin;
      case 3:
        return this.slotBooking.some((slot) => slot.selected);
      case 4:
        // Payment step is valid when card element is mounted
        return this.stripeLoaded && !!this.cardElement;
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
        return 'Payment information is required.';
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
        const hasCar =
          Array.isArray(event.eventCars) &&
          event.eventCars.some((ec: any) => ec.car_id === this.carModel);
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
    events.forEach((event) => {
      const start = new Date(event.start_date);
      const end = new Date(event.end_date);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
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
        eventMatched = event;
      }
    }
    console.log('Matched event for selected minutes:', eventMatched);
    this.slotBooking = this.getTimeIntervals(
      eventMatched.start_time,
      eventMatched.end_time,
      slot.value,
      buffer,
    );
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
    const gettingEventCarId = this.finalEventData?.eventCars.find(
      (ec: any) => ec.car_id === this.carModel,
    )?.id;
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
      'TEN',
      'TWENTY',
      'FORTY',
      'SIXTY',
      'DURATION_10_MIN',
      'DURATION_20_MIN',
      'DURATION_40_MIN',
      'DURATION_60_MIN',
      '10',
      '20',
      '40',
      '60',
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
        if (min && !minOptions.some((opt) => opt.value === min && opt.label === key)) {
          minOptions.push({ label: key, value: min });
        }
      }
    });
    this.selectTime = { minOption: minOptions };
    if (!minOptions.some((opt) => opt.label === this.selectedMin)) {
      this.selectedMin = undefined;
    }
    // Optionally reset slotBooking
    console.log('Updated minute options:', this.selectTime);
    console.log('EventCariD:', gettingEventCarId);
    console.log('Date:', this.bookingDate);

    if (gettingEventCarId && this.bookingDate) {
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
      });
    }
    this.slotBooking = [];
  }

  async submitBooking(): Promise<void> {
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

    // Verify Stripe is loaded
    if (!this.stripeLoaded || !this.stripe) {
      alert('Payment system is still loading. Please try again in a moment.');
      return;
    }

    let user_id = '';
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        console.log('User object from localStorage:', userObj);

        // Try different possible user ID field names
        user_id = userObj.id || userObj.user_id || userObj.userId || userObj._id || '';
        console.log('Extracted user_id:', user_id);
      }
    } catch (e) {
      console.error('Error parsing user from localStorage:', e);
      user_id = '';
    }
    if (!user_id) {
      alert('User not logged in. Please log in again.');
      return;
    }

    console.log('Using user_id for booking:', user_id);

    // Start processing payment
    this.isProcessingPayment = true;

    const gettingEventCarId = this.finalEventData?.eventCars.find(
      (ec: any) => ec.car_id === this.carModel,
    ).id;
    console.log('Event cars matching selected car:', gettingEventCarId);

    // Convert user_id to number if it's a numeric string (for database compatibility)
    const userId = isNaN(Number(user_id)) ? user_id : Number(user_id);
    console.log('Converted user_id for database:', userId, typeof userId);

    const bookingPayload: any = {
      user_id: userId,
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

    // Process payment with Stripe Payment Intents before creating booking
    try {
      await this.processStripePayment(bookingPayload);
    } catch (error: any) {
      this.isProcessingPayment = false;
      console.error('Payment processing error:', error);

      // Check for specific error types
      if (error.message && error.message.includes('user_id_fkey')) {
        this.paymentError = 'Invalid user account. Please logout and login again.';
      } else if (error.message && error.message.includes('Foreign key constraint')) {
        this.paymentError = 'Database error: Invalid reference data. Please contact support.';
      } else {
        this.paymentError = error.message || 'Payment processing failed. Please try again.';
      }

      alert(this.paymentError);
    }
  }

  /**
   * Process payment through Stripe Payment Intents API
   */
  async processStripePayment(bookingPayload: any): Promise<void> {
    if (!this.cardElement) {
      throw new Error('Card information is required');
    }

    // Get car details for payment description
    const selectedCar = this.carsList.find((car) => car.car_id === this.carModel);
    const carName = selectedCar ? `${selectedCar.make} ${selectedCar.model}` : 'Car';
    const selectedTimeRange = this.slotBooking.find((slot) => slot.selected);

    try {
      // Step 1: Create booking first to get booking_id
      console.log('Creating booking first...');
      const bookingResponse: any = await this.booking.createBooking(bookingPayload).toPromise();

      if (!bookingResponse?.data?.id) {
        throw new Error('Failed to create booking');
      }

      const bookingId = bookingResponse.data.id;
      console.log('✓ Booking created:', bookingId);

      // Step 2: Create payment intent with booking_id and amount (matching Postman format)
      const paymentIntentData = {
        booking_id: bookingId,
        amount: Math.round(this.totalAmount * 100), // Convert to cents
      };

      console.log('Creating payment intent with data:', paymentIntentData);

      const paymentIntentResponse: any = await this.paymentService
        .createPaymentIntent(paymentIntentData)
        .toPromise();

      console.log('Payment intent response:', paymentIntentResponse);

      if (!paymentIntentResponse?.data?.clientSecret) {
        throw new Error('Failed to create payment intent');
      }

      console.log('✓ Payment intent created');

      // Step 2: Confirm payment with Stripe.js
      const { error, paymentIntent } = await this.stripe.confirmCardPayment(
        paymentIntentResponse.data.clientSecret,
        {
          payment_method: {
            card: this.cardElement,
            billing_details: {
              email: this.isGiftVoucher ? this.recipientEmail : this.userEmail,
            },
          },
        },
      );

      if (error) {
        throw new Error(error.message);
      }

      if (paymentIntent.status !== 'succeeded') {
        throw new Error('Payment was not successful');
      }

      console.log('✓ Payment confirmed:', paymentIntent.id);

      // Step 3: Confirm payment on backend (update booking with payment info)
      const confirmData = {
        paymentIntentId: paymentIntent.id,
        bookingId: bookingId,
      };

      await this.paymentService.confirmPayment(confirmData).toPromise();
      console.log('✓ Payment confirmed on backend');

      // Step 4: Send confirmation email and complete
      this.sendBookingConfirmation(bookingId, paymentIntent.id);
    } catch (error: any) {
      console.error('Payment error:', error);
      throw error;
    }
  }

  /**
   * Send booking confirmation email after successful payment
   */
  private sendBookingConfirmation(bookingId: string, paymentIntentId: string): void {
    // Get selected time slot
    const selectedTimeRange = this.slotBooking.find((slot) => slot.selected);

    this.isProcessingPayment = false;

    // Get user details for email
    let userEmail = '';
    let userFirstName = '';
    let userLastName = '';
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        userEmail = userObj.email || '';
        userFirstName = userObj.first_name || userObj.firstName || '';
        userLastName = userObj.last_name || userObj.lastName || '';
      }
    } catch (e) {
      console.error('Failed to get user details from localStorage:', e);
    }

    // Get car name
    const selectedCar = this.carsList.find((car) => car.car_id === this.carModel);
    const carName = selectedCar ? `${selectedCar.make} ${selectedCar.model}` : 'Selected Car';

    // Send email if EmailJS is configured (async, don't wait for it)
    if (this.emailService.isConfigured()) {
      if (this.isGiftVoucher) {
        // Send gift voucher email to recipient
        this.emailService
          .sendGiftVoucherEmail(
            this.recipientEmail,
            this.recipientName,
            `${userFirstName} ${userLastName}`,
            {
              carName: carName,
              bookingDate: this.bookingDate,
              location: this.selectedLocation,
              duration: `${this.selectedMin} minutes`,
              timeSlot: `${selectedTimeRange?.start || 'N/A'} - ${selectedTimeRange?.end || 'N/A'}`,
              totalAmount: this.totalAmount,
            },
          )
          .then((emailResult) => {
            if (emailResult.success) {
              console.log('✓ Gift voucher email sent to:', this.recipientEmail);
            } else {
              console.warn('⚠️  Failed to send gift voucher email:', emailResult.message);
            }
          })
          .catch((emailError) => {
            console.error('⚠️  Gift voucher email error:', emailError);
          });
      } else {
        // Send booking confirmation email to user
        if (userEmail) {
          this.emailService
            .sendBookingConfirmationEmail(userEmail, {
              firstName: userFirstName,
              lastName: userLastName,
              carName: carName,
              bookingDate: this.bookingDate,
              location: this.selectedLocation,
              duration: `${this.selectedMin} minutes`,
              timeSlot: `${selectedTimeRange?.start || 'N/A'} - ${selectedTimeRange?.end || 'N/A'}`,
              totalAmount: this.totalAmount,
            })
            .then((emailResult) => {
              if (emailResult.success) {
                console.log('✓ Booking confirmation email sent to:', userEmail);
              } else {
                console.warn('⚠️  Failed to send confirmation email:', emailResult.message);
              }
            })
            .catch((emailError) => {
              console.error('⚠️  Booking confirmation email error:', emailError);
            });
        }
      }
    } else {
      // EmailJS not configured
      console.warn('⚠️  EmailJS not configured - skipping email notification');
    }

    // Navigate to success page with booking details
    this.router.navigate(['/booking-success'], {
      queryParams: {
        bookingId: bookingId,
        paymentIntentId: paymentIntentId,
        carName: carName,
        bookingDate: this.bookingDate,
        timeSlot: `${selectedTimeRange?.start || 'N/A'} - ${selectedTimeRange?.end || 'N/A'}`,
        amount: this.totalAmount,
        isGiftVoucher: this.isGiftVoucher,
        recipientEmail: this.recipientEmail,
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
    this.isProcessingPayment = false;
    this.paymentError = '';

    // Clear and unmount Stripe card element
    if (this.cardElement) {
      this.cardElement.clear();
      this.cardElement.unmount();
      this.cardElement = null;
    }
  }

  getTimeIntervals(startTimeStr: string, endTimeStr: string, min: number, buffer: number) {
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

  get selectedCar() {
    return this.carsList.find((car) => car.car_id === this.carModel);
  }
  get selectedSlot() {
    return this.slotBooking.find((slot) => slot.selected);
  }
}
