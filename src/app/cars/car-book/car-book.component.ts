import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ThemeService } from '../../theme.service';

@Component({
  selector: 'app-car-book',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './car-book.component.html',
  styleUrl: './car-book.component.scss',
})
export class CarBookComponent implements OnInit {
  public themeService = inject(ThemeService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  selectedCar: string = 'Audi Q8'; // Default fallback
  selectedCarImage: string = 'images/audilogo.jpg'; // Default fallback

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['car']) this.selectedCar = params['car'];
      if (params['img']) this.selectedCarImage = params['img'];
    });
  }

  bookingForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    age: ['', [Validators.required, Validators.min(18)]],
    licenseNumber: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
    duration: ['', Validators.required],
    timeSlot: ['', Validators.required]
  });

  durations = ['20 minutes 20000 INR', '30 minutes  30000 INR', '1 Hour 80000 INR'];
  timeSlots = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];

  onSubmit() {
    if (this.bookingForm.valid) {
      console.log('Audi Booking submitted:', this.bookingForm.value);
      const formValue = this.bookingForm.value;
      this.router.navigate(['/verify-audi'], {
        queryParams: {
          carName: this.selectedCar,
          name: formValue.name,
          email: formValue.email,
          age: formValue.age,
          licenseNumber: formValue.licenseNumber,
          duration: formValue.duration,
          timeSlot: formValue.timeSlot
        }
      });
    } else {
      this.bookingForm.markAllAsTouched();
    }
  }
}
