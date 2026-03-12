import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CarService } from '../../services/car.service';
import { Car } from '../../model/cars.model';
import { EventService } from '../../services/event.service';
import { DurationFormatPipe } from "../../custom-pipe/duration-format.pipe";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DurationFormatPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit{

  rideForm: FormGroup;
  rides: any[] = [];
  cars: Car[]=[];
  blockedDateRanges: { start: Date; end: Date }[] = [];

  durationMap: any = {
    tenMin: 'TEN',
    twentyMin: 'TWENTY',
    fortyMin: 'FORTY',
    sixtyMin: 'SIXTY'
  };

  constructor(
    private fb: FormBuilder,
    private carService:CarService,
    private eventService:EventService,
    private cdr: ChangeDetectorRef
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
      this.cdr.detectChanges();

    },
      error:(err)=>{
        console.log(err)
      }
    })

    this.getEvent();
  }

  getEvent() {
    this.eventService.getEvent().subscribe({
      next: (data) => {
        this.rides = data.reverse();
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

    } else {
      this.rideForm.markAllAsTouched();
    }
  }

}

