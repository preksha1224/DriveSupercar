import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {

  rideForm: FormGroup;
  rides: any[] = [];

  constructor(private fb: FormBuilder) {

    this.rideForm = this.fb.group({
      location: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      timeSlots: this.fb.array([this.createTimeSlot()])
    },
    { validators: this.dateRangeValidator });
  }

  get timeSlots(): FormArray {
    return this.rideForm.get('timeSlots') as FormArray;
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

  dateRangeValidator(group: FormGroup) {
    const start = group.get('startDate')?.value;
    const end = group.get('endDate')?.value;

    if (start && end && start > end) {
      return { invalidDateRange: true };
    }
    return null;
  }

  onSubmit() {
    if (this.rideForm.valid) {
      const rideData = this.rideForm.value;
      this.rides.push(rideData);
      console.log('Ride Data:', rideData);
      this.rideForm.reset();
      this.timeSlots.clear();
      this.addTimeSlot();
      const modal = document.getElementById('exampleModal');
      if (modal) {
        const modalInstance = (window as any).bootstrap.Modal.getInstance(modal);
        modalInstance.hide();
      }
    } else {
      this.rideForm.markAllAsTouched();
    }
  }

}

