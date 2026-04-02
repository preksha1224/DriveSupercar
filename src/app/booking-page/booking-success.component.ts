import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-booking-success',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './booking-success.component.html',
  styleUrl: './booking-success.component.scss',
})
export class BookingSuccessComponent implements OnInit {
  bookingId: string = '';
  paymentIntentId: string = '';
  carName: string = '';
  bookingDate: string = '';
  timeSlot: string = '';
  amount: number = 0;
  isGiftVoucher: boolean = false;
  recipientEmail: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // Get booking details from query params
    this.route.queryParams.subscribe((params) => {
      this.bookingId = params['bookingId'] || '';
      this.paymentIntentId = params['paymentIntentId'] || '';
      this.carName = params['carName'] || '';
      this.bookingDate = params['bookingDate'] || '';
      this.timeSlot = params['timeSlot'] || '';
      this.amount = parseFloat(params['amount']) || 0;
      this.isGiftVoucher = params['isGiftVoucher'] === 'true';
      this.recipientEmail = params['recipientEmail'] || '';
    });
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }

  goToBookingDetails(): void {
    this.router.navigate(['/Bookingdetail']);
  }
}
