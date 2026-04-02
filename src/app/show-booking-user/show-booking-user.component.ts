import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { BookingService } from '../services/booking';

@Component({
  selector: 'app-show-booking-user',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './show-booking-user.component.html',
  styleUrl: './show-booking-user.component.scss',
})
export class ShowBookingUserComponent implements OnInit {
[x: string]: any;

  bookings: any[] = [];
  filteredBookings: any[] = [];
  paginatedBookings: any[] = [];

  isLoading: boolean = false;
  searchQuery: string = '';
  user_id = '';

  // Dropdown
  activeMenu: string | null = null;

  // Pagination
  currentPage = 1;
  itemsPerPage = 3;
  totalPages = 1;
  totalPagesArray: number[] = [];

  constructor(private bookingService: BookingService,private cdr:ChangeDetectorRef) {}

  ngOnInit(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userObj = JSON.parse(userStr);
      this.user_id = userObj.id;
    }
    this.loadBookings();
  }

  // 🔄 Load Data
  loadBookings(): void {
    this.isLoading = true;
    this.bookingService.getBookingByUserId(this.user_id).subscribe({
      next: (data) => {
        this.bookings = data.bookings || [];
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching bookings:', err);
        this.isLoading = false;
      }
    });
  }

  // 🔍 Search
  onSearch(event: any) {
    this.searchQuery = event.target.value.toLowerCase();
    this.currentPage = 1;
    this.applyFilters();
  }

  // 🎯 Search + Pagination
  applyFilters() {
    let data = this.bookings;

    // 🔍 Search
    if (this.searchQuery) {
      const search = this.searchQuery;

      data = this.bookings.filter(b => {
        const carName = `${b.eventCar?.car?.make || ''} ${b.eventCar?.car?.model || ''}`.toLowerCase();
        const city = (b.eventCar?.event?.city_name || '').toLowerCase();
        const status = (b.status || '').toLowerCase();
        const id = (b.id || '').toString().toLowerCase();

        return (
          id.includes(search) ||
          carName.includes(search) ||
          city.includes(search) ||
          status.includes(search)
        );
      });
    }

    // Save filtered data
    this.filteredBookings = data;

    // 📄 Pagination
    this.totalPages = Math.ceil(data.length / this.itemsPerPage) || 1;

    this.totalPagesArray = Array.from(
      { length: this.totalPages },
      (_, i) => i + 1
    );

    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;

    this.paginatedBookings = data.slice(start, end);
    this.cdr.markForCheck();
  }

  // 📄 Pagination Controls
  goToPage(page: number) {
    this.currentPage = page;
    this.applyFilters();
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.applyFilters();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.applyFilters();
    }
  }

  // 🎯 Actions
  cancelBooking(booking: any) {
    if (confirm(`Cancel booking ${booking.id}?`)) {
      booking.status = 'cancelled';
      this.applyFilters();
    }
  }

  rescheduleBooking(booking: any) {
    alert(`Reschedule booking ${booking.id} (coming soon)`);
  }

  viewDetails(booking: any) {
    alert(`Viewing details for ${booking.id}`);
  }

  // 🎨 Status Class
  getStatusClass(status: string) {
    return `status-${status?.toLowerCase()}`;
  }

  // 🔥 Dropdown
  toggleMenu(id: string) {
    this.activeMenu = this.activeMenu === id ? null : id;
  }

  // ❌ Close dropdown on outside click
  @HostListener('document:click')
  closeMenu() {
    this.activeMenu = null;
  }
}