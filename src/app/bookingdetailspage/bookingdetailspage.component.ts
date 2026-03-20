import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { BookingService } from '../services/booking';

interface BookingDetails {
  carName: string;
  location: string;
  bookingDate: string;
  paymentStatus: string;
  bookingId: string;
}

@Component({
  selector: 'app-bookingdetailspage',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bookingdetailspage.component.html',
  styleUrl: './bookingdetailspage.component.scss',
})
export class BookingdetailspageComponent implements OnInit {
  user: any = { first_name: '', last_name: '' };
  bookingDetails: BookingDetails = {
    carName: '-',
    location: '-',
    bookingDate: '-',
    paymentStatus: 'Pending',
    bookingId: '-',
  };
  isLoading = false;

  private bookingService = inject(BookingService);
  private cdr = inject(ChangeDetectorRef);
  showToast = false;
  toastMessage = '';

  ngOnInit(): void {
    this.getUserFromStorage();
    this.getBookingDetails();
  }

  getUserFromStorage(): void {
    const storedObjectString = localStorage.getItem('user');
    if (storedObjectString) {
      this.user = JSON.parse(storedObjectString);
    }
  }

  alertMessage(message: string): void {
    this.cdr.markForCheck();
    this.toastMessage = message;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 5000);
  }

  getBookingDetails(): void {
    const userId = this.user?.id || this.user?._id;

    if (!userId) {
      this.bookingDetails = this.getStaticBookingDetails();
      this.alertMessage('User not found, showing static booking details.');
      return;
    }

    this.isLoading = true;
    // this.bookingService.getBookingByUserId(userId).subscribe({
    //   next: (response) => {
    //     const apiBooking = this.extractBooking(response);
    //     this.bookingDetails = apiBooking ? apiBooking : this.getStaticBookingDetails();

    //     if (!apiBooking) {
    //       this.alertMessage('No booking found from API, showing static booking details.');
    //     }

    //     this.isLoading = false;
    //     this.cdr.markForCheck();
    //   },
    //   error: () => {
    //     this.bookingDetails = this.getStaticBookingDetails();
    //     this.isLoading = false;
    //     this.alertMessage('Booking API failed, showing static booking details.');
    //   },
    // });
  }

  private getStaticBookingDetails(): BookingDetails {
    const storedBooking = localStorage.getItem('latestBookingSelection');

    if (storedBooking) {
      const localBooking = JSON.parse(storedBooking);
      return {
        carName: localBooking?.carName || '-',
        location: localBooking?.location || '-',
        bookingDate: localBooking?.bookingDate || '-',
        paymentStatus: localBooking?.paymentStatus || 'Pending',
        bookingId: localBooking?.bookingId || '-',
      };
    }

    return {
      carName: '-',
      location: '-',
      bookingDate: '-',
      paymentStatus: 'Pending',
      bookingId: '-',
    };
  }

  private extractBooking(response: any): BookingDetails | null {
    const rawBooking =
      response?.data?.[0] ??
      response?.data ??
      response?.booking ??
      (Array.isArray(response) ? response[0] : response);

    if (!rawBooking) {
      return null;
    }

    const carName =
      rawBooking?.carName ||
      rawBooking?.car_model ||
      rawBooking?.carModel ||
      `${rawBooking?.car?.make ?? ''} ${rawBooking?.car?.model ?? ''}`.trim();

    const location =
      rawBooking?.location ||
      rawBooking?.city ||
      rawBooking?.pickup_location ||
      rawBooking?.event?.cityName ||
      rawBooking?.event?.city_name ||
      rawBooking?.event?.city;

    const bookingDateSource =
      rawBooking?.bookingDate || rawBooking?.date || rawBooking?.start_time || rawBooking?.createdAt;

    const bookingDate = bookingDateSource
      ? new Date(bookingDateSource).toISOString().split('T')[0]
      : '-';

    return {
      carName: carName || '-',
      location: location || '-',
      bookingDate,
      paymentStatus: rawBooking?.paymentStatus || rawBooking?.status || 'Pending',
      bookingId: rawBooking?.id || rawBooking?._id || '-',
    };
  }
}
