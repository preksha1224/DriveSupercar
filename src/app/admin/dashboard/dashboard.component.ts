import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CarService } from '../../services/car.service';
import { Car } from '../../model/cars.model';
import { EventService } from '../../services/event.service';
import { DurationFormatPipe } from "../../custom-pipe/duration-format.pipe";
import { BookingService } from '../../services/booking';  
import { AuthService } from '../../services/auth.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

interface DashboardBookingRow {
  userName: string;
  userId: string;
  eventName: string; 
  amount: string | number;
  carName: string;
  range: string;
  status: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DurationFormatPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

  rideForm: FormGroup;
  rides: any[] = [];
  cars: Car[] = [];
  rawBookings: any[] = [];
  bookings: DashboardBookingRow[] = [];
  isBookingLoading = false;
  blockedDateRanges: { start: Date; end: Date }[] = [];
  private userNameCache = new Map<string, string>();
  private eventCityCache = new Map<string, string>();
  private eventRangeCache = new Map<string, { startDate: string; endDate: string }>();
editRideForm!: FormGroup;
isUpdating = false;
selectedRideIndex: number = -1;
  durationMap: any = {
    tenMin: 'TEN',
    twentyMin: 'TWENTY',
    fortyMin: 'FORTY',
    sixtyMin: 'SIXTY'
  };

  constructor(
    private fb: FormBuilder,
    private carService: CarService,
    private eventService: EventService,
    private cdr: ChangeDetectorRef,
    private bookingService: BookingService,
    private authService: AuthService
  ) {
    this.rideForm = this.fb.group({
      location: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      cars: this.fb.array([]),
      timeSlots: this.fb.array([this.createTimeSlot()])
    },
    { validators: this.dateRangeValidator });
  }

  ngOnInit() {
    this.carService.getCar().subscribe({
      next: (data) => {
        this.cars = data.data;
        this.setDefaultCars();
        this.rebuildBookingRows();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.log(err);
      }
    });

    this.getEvent();
    this.bookinglist();
  }

  get editCarsFormArray(): FormArray {
  return this.editRideForm.get('cars') as FormArray;
}

get editTimeSlots(): FormArray {
  return this.editRideForm.get('timeSlots') as FormArray;
}
initEditRideForm(): void {
  this.editRideForm = this.fb.group({
    cars: this.fb.array([]),
    location: ['', Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    timeSlots: this.fb.array([this.createTimeSlot()])
  });
}


  bookinglist() {
    this.isBookingLoading = true;

    this.bookingService.getallBooking().subscribe({
      next: (data) => {
        this.rawBookings = this.extractBookings(data);
           console.log('Raw bookings:', this.rawBookings);
           
        forkJoin([
          this.loadUserNamesForBookings(this.rawBookings),
          this.loadEventCitiesForBookings(this.rawBookings) 
        ]).subscribe({
          next: () => {
            this.rebuildBookingRows();
            this.isBookingLoading = false;
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.log('Error loading related data:', err);
            this.rebuildBookingRows();
            this.isBookingLoading = false;
            this.cdr.markForCheck();
          }
        });
      },
      error: (err) => {
        console.log('Error fetching bookings:', err);
        this.bookings = [];
        this.isBookingLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private loadUserNamesForBookings(bookings: any[]) {
    const uniqueUserIds = [...new Set(
      bookings
        .map((booking) => this.extractUserId(booking))
        .filter((id) => !!id && id !== '-')
    )];

    const requests = uniqueUserIds
      .filter((id) => !this.userNameCache.has(id))
      .map((id) =>
        this.authService.getuser(id).pipe(
          map((response: any) => ({
            id,
            userName: this.extractUserNameFromUserResponse(response) || 'N/A'
          })),
          catchError((error) => {
            console.log(`User fetch failed for id ${id}:`, error);
            return of({ id, userName: 'N/A' });
          })
        )
      );

    if (!requests.length) {
      return of([]);
    }

    return forkJoin(requests).pipe(
      map((results) => {
        results.forEach((item) => this.userNameCache.set(item.id, item.userName));
        return results;
      })
    );
  }

  private extractUserNameFromUserResponse(response: any): string {
    const firstName = response?.data?.first_name || response?.user?.first_name || '';
    const lastName = response?.data?.last_name || response?.user?.last_name || '';
    return `${firstName} ${lastName}`.trim();
  }

  private extractUserId(booking: any): string {
    return String(
      booking?.user_id ||
      booking?.userId ||
      booking?.user?._id ||
      booking?.user?.id ||
      booking?.customer_id ||
      booking?.customerId ||
      '-'
    ).trim();
  }
  private loadEventCitiesForBookings(bookings: any[]) {
    const uniqueEventIds = [...new Set(
      bookings
        .map((booking) => this.extractEventId(booking))
        .filter((id) => !!id && id !== '-')
    )];

    const requests = uniqueEventIds
      .filter((id) => !this.eventCityCache.has(id) || !this.eventRangeCache.has(id))
      .map((id) =>
        this.eventService.getEvent().pipe(
          map((events: any[]) => {
            const event = events.find((e: any) => String(e.id || e._id) === String(id));

            return {
              id,
              cityName: this.extractCityNameFromEventResponse(event) || 'N/A',
              startDate: event?.start_date || event?.startDate || '',
              endDate: event?.end_date || event?.endDate || ''
            };
          }),
          catchError((error) => {
            console.log(`Event fetch failed for id ${id}:`, error);
            return of({
              id,
              cityName: 'N/A',
              startDate: '',
              endDate: ''
            });
          })
        )
      );

    if (!requests.length) {
      return of([]);
    }

    return forkJoin(requests).pipe(
      map((results) => {
        results.forEach((item) => {
          this.eventCityCache.set(item.id, item.cityName);
          this.eventRangeCache.set(item.id, {
            startDate: item.startDate,
            endDate: item.endDate
          });
        });
        return results;
      })
    );
  }
  private extractEventId(booking: any): string {
    return String(
      booking?.eventCar?.event_id ||
      booking?.eventCar?.eventId ||
      booking?.event_id ||
      booking?.eventId ||
      booking?.event?._id ||
      '-'
    ).trim();
  }
  private extractCityNameFromEventResponse(response: any): string {
    return String(
      response?.data?.city_name ||
      response?.event?.city_name ||
      response?.city_name ||
      ''
    ).trim();
  }

  private rebuildBookingRows(): void {
    this.bookings = this.rawBookings.map((booking: any) => this.mapBookingRow(booking));
    this.applyFilters();
  }

  private extractBookings(response: any): any[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    if (Array.isArray(response?.bookings)) {
      return response.bookings;
    }

    if (Array.isArray(response?.result)) {
      return response.result;
    }

    if (response?.data && typeof response.data === 'object') {
      return [response.data];
    }

    if (response?.booking && typeof response.booking === 'object') {
      return [response.booking];
    }

    return [];
  }

  private mapBookingRow(booking: any): DashboardBookingRow {
    const firstName =
      booking?.user?.first_name ||
      booking?.user?.firstName ||
      booking?.first_name ||
      booking?.customer?.first_name ||
      booking?.customer?.firstName ||
      '';

    const lastName =
      booking?.user?.last_name ||
      booking?.user?.lastName ||
      booking?.last_name ||
      booking?.customer?.last_name ||
      booking?.customer?.lastName ||
      '';

    const userId = this.extractUserId(booking);

    const embeddedUserName =
      `${firstName} ${lastName}`.trim() ||
      booking?.userName ||
      booking?.username ||
      booking?.user?.username ||
      booking?.user?.name ||
      booking?.customer?.name ||
      '';

    const userName =
      this.userNameCache.get(userId) ||
      embeddedUserName ||
      'N/A';

    const amount =
      booking?.amount ??
      booking?.totalAmount ??
      booking?.total_amount ??
      booking?.price ??
      booking?.payment?.amount ??
      '-';

    const carName = this.resolveCarName(booking);
    const range = this.buildBookingRange(booking);

    const eventId = this.extractEventId(booking);
    const eventName =
      this.eventCityCache.get(eventId) ||  
      booking?.event?.city_name ||
      booking?.eventName ||
      booking?.event_name ||
      '-';

    return {
      userName,
      userId: String(userId),
      eventName,
      amount,
      carName,
      range,
      status: booking?.paymentStatus || booking?.status || 'Pending'
    };
  }

  private resolveCarName(booking: any): string {
    const directCarName =
      booking?.carName ||
      booking?.car_model ||
      booking?.carModel ||
      booking?.vehicleName ||
      booking?.eventCar?.carName ||
      booking?.eventCar?.car_model ||
      booking?.eventCar?.carModel ||
      booking?.eventCar?.car?.name ||
      booking?.car?.name ||
      `${booking?.eventCar?.car?.make ?? ''} ${booking?.eventCar?.car?.model ?? ''}`.trim() ||
      `${booking?.car?.make ?? ''} ${booking?.car?.model ?? ''}`.trim();

    if (directCarName) {
      return directCarName;
    }

    const eventCarId =
      booking?.eventCarId ||
      booking?.event_car_id ||
      booking?.eventcarid ||
      booking?.eventCar?.id ||
      booking?.eventCar?._id;

    if (eventCarId) {
      const matchedEventCar = this.findEventCarById(eventCarId);
      const matchedEventCarName = this.getCarNameFromEntity(matchedEventCar);
      if (matchedEventCarName) {
        return matchedEventCarName;
      }

      const eventCarCarId =
        matchedEventCar?.car_id ||
        matchedEventCar?.carId ||
        matchedEventCar?.car?.car_id ||
        matchedEventCar?.car?.id;

      if (eventCarCarId) {
        const matchedCar = this.cars.find((car) => String(car.car_id) === String(eventCarCarId));
        if (matchedCar) {
          return `${matchedCar.make} ${matchedCar.model}`.trim();
        }
      }
    }

    const bookingCarId =
      booking?.car_id ||
      booking?.carId ||
      booking?.car?.car_id ||
      booking?.car?.id;

    if (bookingCarId) {
      const matchedCar = this.cars.find((car) => String(car.car_id) === String(bookingCarId));
      if (matchedCar) {
        return `${matchedCar.make} ${matchedCar.model}`.trim();
      }
    }

    return String(eventCarId || '-');
  }

  private findEventCarById(eventCarId: string): any {
    const allEventCars = this.rides.flatMap((ride: any) =>
      Array.isArray(ride?.eventCars) ? ride.eventCars : []
    );

    return allEventCars.find((eventCar: any) =>
      String(eventCar?.id || eventCar?._id || eventCar?.eventCarId || eventCar?.event_car_id) ===
      String(eventCarId)
    );
  }

  private getCarNameFromEntity(entity: any): string {
    if (!entity) {
      return '';
    }

    return (
      entity?.carName ||
      entity?.car_model ||
      entity?.carModel ||
      entity?.name ||
      entity?.car?.name ||
      `${entity?.make ?? ''} ${entity?.model ?? ''}`.trim() ||
      `${entity?.car?.make ?? ''} ${entity?.car?.model ?? ''}`.trim()
    );
  }

  getEvent() {
    this.eventService.getEvent().subscribe({
      next: (data) => {
        this.rides = data.reverse();
        this.rebuildBookingRows();
        console.log(data)
        this.blockedDateRanges = this.rides.map((ride: any) => ({
          start: new Date(ride.start_date),
          end: new Date(ride.end_date)
        }));

        this.cdr.markForCheck();
      },
      error: (err) => console.log(err)
    });
  }
    isDateBlocked(date: string): boolean {

    const selected = new Date(date);

    return this.blockedDateRanges.some(range =>
      selected >= range.start && selected <= range.end
    );

  }

  setDefaultCars() {
    const carArray = this.carsFormArray;

    carArray.clear();

    this.cars.forEach(car => {
      carArray.push(this.fb.control(car.car_id));
    });
  }

  get timeSlots(): FormArray {
    return this.rideForm.get('timeSlots') as FormArray;
  }

  convertTimeToTimestamp(time: string, date: string): string {
    const [hours, minutes] = time.split(':').map(Number);

    const d = new Date(date);
    d.setHours(hours, minutes, 0, 0);

    return d.toISOString();
  }

  createTimeSlot(): FormGroup {
    return this.fb.group({
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      tenMin: [false],
      twentyMin: [false],
      fortyMin: [false],
      sixtyMin: [false]
    });
  }

  addTimeSlot() {
    this.timeSlots.push(this.createTimeSlot());
  }

  removeTimeSlot(index: number) {
    this.timeSlots.removeAt(index);
  }

  dateRangeValidator = (group: FormGroup) => {

    const start = group.get('startDate')?.value;
    const end = group.get('endDate')?.value;

    if (start && end && start > end) {
      return { invalidDateRange: true };
    }

    if (start && this.isDateBlocked(start)) {
      return { startBlocked: true };
    }

    if (end && this.isDateBlocked(end)) {
      return { endBlocked: true };
    }

    return null;
  }
  get carsFormArray(): FormArray {
    return this.rideForm.get('cars') as FormArray;
  }

  onCarChange(event: Event, carId: string) {
    const checkbox = event.target as HTMLInputElement;

    if (checkbox.checked) {
      this.carsFormArray.push(this.fb.control(carId));
    } else {
      const index = this.carsFormArray.controls.findIndex(
        x => x.value === carId
      );
      if (index !== -1) {
        this.carsFormArray.removeAt(index);
      }
    }
  }


  dismissModel() {
    const modal = document.getElementById('exampleModal');
      if (modal) {
        const modalInstance = (window as any).bootstrap.Modal.getInstance(modal);
        this.rideForm.reset();
        modalInstance.hide();
        this.setDefaultCars();
    }
  }
  editdismissModel() {
    const modal = document.getElementById('editRideModal');
    if (modal) {
      const modalInstance = (window as any).bootstrap.Modal.getInstance(modal);
      this.rideForm.reset();
      modalInstance?.hide();
      this.setDefaultCars();
    }
  }

  onSubmit() {
    if (this.rideForm.valid) {
      const rideData = this.rideForm.value;
      let startDate= new Date(this.rideForm.value.startDate);
      let endDate= new Date(this.rideForm.value.endDate);
      const time_windows = this.rideForm.value.timeSlots.map((slot: any) => {

        const start = this.convertTimeToTimestamp(slot.startTime, this.rideForm.value.startDate);
        const end = this.convertTimeToTimestamp(slot.endTime, this.rideForm.value.startDate);

        const allowedDurations = Object.keys(this.durationMap)
          .filter(key => slot[key])
          .map(key => this.durationMap[key]);

        return {
          start_time: start,
          end_time: end,
          allowed_duration: allowedDurations
        };

      });

      const requestData:any={
        city_name:this.rideForm.value.location,
        venue:"parking",
        start_date:startDate,
        end_date:endDate,
        cars:this.rideForm.value.cars,
        time_windows:time_windows
      }
      console.log(requestData);
      this.eventService.createEvent(requestData).subscribe({
        next:(data)=>{
          console.log(data);
          this.getEvent();
        },
        error:(err)=>{
          console.log(err);
        }
      })
      this.rideForm.reset();
      this.timeSlots.clear();
      this.addTimeSlot();
      this.dismissModel();
    } else {
      this.rideForm.markAllAsTouched();
    }
  }

  private buildBookingRange(booking: any): string {
    const startDate =
      booking?.start_date ||
      booking?.startDate ||
      booking?.bookingStartDate ||
      booking?.booking_start_date ||
      booking?.event?.start_date ||
      booking?.event?.startDate;

    const endDate =
      booking?.end_date ||
      booking?.endDate ||
      booking?.bookingEndDate ||
      booking?.booking_end_date ||
      booking?.event?.end_date ||
      booking?.event?.endDate;

    if (startDate && endDate) {
      return `${this.formatDate(startDate)} - ${this.formatDate(endDate)}`;
    }

    const bookedRange =
      booking?.booked_range ||
      booking?.bookedRange;

    if (typeof bookedRange === 'string') {
      const parts = [...bookedRange.matchAll(/"([^"]+)"/g)].map(m => m[1]);
      if (parts.length >= 2) {
        return `${this.formatDate(parts[0])} - ${this.formatDate(parts[1])}`;
      }
    }

    const eventId = this.extractEventId(booking);
    const cachedRange = this.eventRangeCache.get(eventId);

    if (cachedRange?.startDate && cachedRange?.endDate) {
      return `${this.formatDate(cachedRange.startDate)} - ${this.formatDate(cachedRange.endDate)}`;
    }

    return '-';
  }


  private formatDate(value: string | Date): string {
    const d = value instanceof Date ? value : new Date(this.normalizeDateString(value));
    return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString();
  }

  private normalizeDateString(value: string): string {
    return value
      .replace(' ', 'T')
      .replace(/\+00(?::?00)?$/, 'Z');
  }
  currentPage: number = 1;
  itemsPerPage: number = 10;

  get totalPages(): number {
    return Math.ceil(this.bookings.length / this.itemsPerPage);
  }

  get totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get paginatedBookings() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.bookings.slice(start, end);
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  goToPage(page: number): void {
    this.currentPage = page;
  }

  private applyFilters(): void {
  }
    selectedRide: any = null;


  editRide(ride: any, index: number): void {
    this.selectedRide = ride;
    this.selectedRideIndex = index;

    // Use the existing rideForm instead of creating a new one
    this.rideForm.patchValue({
      location: ride.city_name,
      startDate: this.formatDateForInput(ride.start_date),
      endDate: this.formatDateForInput(ride.end_date)
    });

    // Patch cars array
    const carArray = this.carsFormArray;
    carArray.clear();
    
    // Check for car_id in eventCars or cars
    const carIds = (ride.eventCars || ride.cars || [])
      .map((c: any) => typeof c === 'object' ? String(c.car_id || c.id) : String(c))
      .filter((id: string) => id && id !== 'undefined');

    carIds.forEach((id: string) => {
      carArray.push(this.fb.control(id));
    });

    // Patch time slots
    const timeSlotsArray = this.timeSlots;
    timeSlotsArray.clear();
    if (ride.eventTimeWindows && Array.isArray(ride.eventTimeWindows)) {
      ride.eventTimeWindows.forEach((slot: any) => {
        timeSlotsArray.push(this.fb.group({
          startTime: [this.extractTimeFromISO(slot.start_time), Validators.required],
          endTime: [this.extractTimeFromISO(slot.end_time), Validators.required],
          tenMin: [slot.allowed_duration?.includes('TEN') || false],
          twentyMin: [slot.allowed_duration?.includes('TWENTY') || false],
          fortyMin: [slot.allowed_duration?.includes('FORTY') || false],
          sixtyMin: [slot.allowed_duration?.includes('SIXTY') || false]
        }));
      });
    } else {
      timeSlotsArray.push(this.createTimeSlot());
    }
  }

  updateRide(): void {
    if (this.rideForm.valid && this.selectedRide) {
      this.isUpdating = true;
      const rideData = this.rideForm.value;
      const startDate = new Date(rideData.startDate);
      const endDate = new Date(rideData.endDate);

      const time_windows = rideData.timeSlots.map((slot: any) => {
        const start = this.convertTimeToTimestamp(slot.startTime, rideData.startDate);
        const end = this.convertTimeToTimestamp(slot.endTime, rideData.startDate);

        const allowedDurations = Object.keys(this.durationMap)
          .filter(key => slot[key])
          .map(key => this.durationMap[key]);

        return {
          start_time: start,
          end_time: end,
          allowed_duration: allowedDurations
        };
      });

      const requestData: any = {
        city_name: rideData.location,
        venue: "parking",
        start_date: startDate,
        end_date: endDate,
        cars: rideData.cars,
        time_windows: time_windows
      };

      const rideId = this.selectedRide.id || this.selectedRide._id;
      this.eventService.updateEvent(rideId, requestData).subscribe({
        next: (data) => {
          console.log('Update success:', data);
          this.isUpdating = false;
          this.getEvent();
          this.editdismissModel();
        },
        error: (err) => {
          console.log('Update error:', err);
          this.isUpdating = false;
        }
      });
    } else {
      this.rideForm.markAllAsTouched();
    }
  }

private formatDateForInput(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : '';
}

  private extractTimeFromISO(isoStr: string): string {
    if (!isoStr) return '';
    const date = new Date(isoStr);
    if (isNaN(date.getTime())) return '';
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  onEditCarChange(event: any, carId: any): void {
    const carIdStr = String(carId);
    if (event.target.checked) {
      if (!this.editCarsFormArray.value.includes(carIdStr)) {
        this.editCarsFormArray.push(this.fb.control(carIdStr));
      }
    } else {
      const index = this.editCarsFormArray.value.indexOf(carIdStr);
      if (index !== -1) this.editCarsFormArray.removeAt(index);
    }
  }

  isCarSelectedForEdit(carId: any): boolean {
    return this.editCarsFormArray.value.includes(String(carId));
  }

  addEditTimeSlot(): void {
    this.editTimeSlots.push(this.createTimeSlot());
  }

  removeEditTimeSlot(index: number): void {
    this.editTimeSlots.removeAt(index);
  }

  dismissEditModel(): void {
    const modal = document.getElementById('editRideModal');
    if (modal) {
      const bsModal = (window as any).bootstrap.Modal.getInstance(modal);
      bsModal?.hide();
    }
  }

  onEditSubmit(): void {
    this.updateRide();
  }

  deleteRide(rideId: string, index: number): void {
    console.log('rideid', rideId);

    const confirmed = window.confirm('Are you sure you want to delete this ride?');

    if (!confirmed) {
      return;
    }

    this.eventService.deleteEvent(rideId).subscribe({
      next: () => {
        this.getEvent(); 
      },
      error: (err: any) => console.log(err)
    });
  }
}

