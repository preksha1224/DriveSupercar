import {
  AfterViewInit,
  ElementRef,
  ViewChild,
  Renderer2,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { EventService } from '../../services/event.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, AfterViewInit {
  @ViewChild('heroCard', { static: false }) heroCardRef!: ElementRef;
  @ViewChild('heroVideo', { static: false }) heroVideoRef!: ElementRef;
  toastMessage: string = '';
  showToast: boolean = false;
  toastTimeout: any;
  events: any[] = [];

  locations = [
    {
      city: 'BERLIN',
      region: 'Brandenburg',
      route: 'Autobahn A100 & City Routes',
      popular: true,
      lat: 52.52,
      lng: 13.405,
    },
    {
      city: 'MUNICH',
      region: 'Bavaria',
      route: 'Alpine Foothills & City Circuits',
      popular: false,
      lat: 48.1351,
      lng: 11.582,
    },
    {
      city: 'FRANKFURT',
      region: 'Hesse',
      route: 'Taunus Mountain Roads',
      popular: false,
      lat: 50.1109,
      lng: 8.6821,
    },
    {
      city: 'HAMBURG',
      region: 'Hamburg',
      route: 'Harbor Drive & Expressways',
      popular: false,
      lat: 53.5511,
      lng: 9.9937,
    },
    {
      city: 'STUTTGART',
      region: 'Baden-Württemberg',
      route: 'Swabian Alb Scenic Routes',
      popular: false,
      lat: 48.7758,
      lng: 9.1829,
    },
  ];

  // Calendar properties
  currentDate: Date = new Date();
  currentMonthYear: string = '';
  weekDays: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  calendarDays: any[] = [];
  totalCarsAvailable: number = 0;

  // City availability data for different dates
  cityAvailability: any = {
    BERLIN: [2, 5, 8, 12, 15, 18, 22, 25, 28],
    MUNICH: [3, 7, 10, 14, 17, 20, 24, 27, 30],
    FRANKFURT: [1, 6, 9, 13, 16, 19, 23, 26, 29],
    HAMBURG: [4, 11, 15, 21, 25, 28],
    STUTTGART: [5, 12, 18, 22, 26],
  };

  constructor(
    private renderer: Renderer2,
    private authService: AuthService,
    private router: Router,
    private eventService: EventService,
    private cdr: ChangeDetectorRef,
  ) {}

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  ngOnInit() {
    this.generateCalendar(); // create empty calendar first

    this.eventService.getEvent().subscribe({
      next: (res: any) => {
        this.events = res || [];

        this.totalCarsAvailable = this.events.reduce(
          (sum: any, event: any) => sum + (event.eventCars?.length || 0),
          0,
        );

        this.generateCalendar(); // regenerate after API
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.log('Event API error', err);
      },
    });
  }

  ngAfterViewInit() {
    // Force video to play after view init
    this.playHeroVideo();
  }

  onHeroMouseMove(event: MouseEvent) {
    const card = this.heroCardRef?.nativeElement;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * 10; // max 10deg
    const rotateY = ((x - centerX) / centerX) * -10;
    this.renderer.setStyle(card, 'transform', `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`);
    this.renderer.addClass(card, 'is-tilting');
  }

  onHeroMouseLeave() {
    const card = this.heroCardRef?.nativeElement;
    if (!card) return;
    this.renderer.setStyle(card, 'transform', 'rotateX(0deg) rotateY(0deg)');
    this.renderer.removeClass(card, 'is-tilting');
  }

  alertMessage(message: string) {
    this.toastMessage = message;
    this.showToast = true;
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastTimeout = setTimeout(() => {
      this.showToast = false;
      this.router.navigateByUrl('/user/login');
    }, 3000);
  }

  bookingRedirect() {
    if (this.isLoggedIn) {
      this.router.navigateByUrl('/booking');
    } else {
      this.alertMessage('Please login first to explore booking the car');
    }
  }

  viewOffers() {
    if (this.isLoggedIn) {
      this.router.navigateByUrl('/deals');
    } else {
      this.alertMessage('Please login first to see offers and deals in detail');
    }
  }

  listYourCar() {
    if (this.isLoggedIn) {
      this.router.navigateByUrl('/owner/list-car');
    } else {
      this.alertMessage('Please login first to list your car');
    }
  }

  selectLocation(location: any) {
    console.log('Selected location:', location);
    // Navigate to booking page with location pre-selected
    if (this.isLoggedIn) {
      this.router.navigateByUrl('/booking', { state: { location: location.city } });
    } else {
      this.alertMessage('Please login first to book a car at ' + location.city);
    }
  }
  generateCalendar() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    this.currentMonthYear = today.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    this.calendarDays = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);

      const isToday = date.toDateString() === today.toDateString();

      const citiesAvailable = this.getCitiesForDay(date);

      let availability = 'booked';
      let totalCars = 0;

      if (citiesAvailable.length) {
        totalCars = citiesAvailable.reduce((sum: any, city: any) => sum + city.cars, 0);

        availability = citiesAvailable.length >= 3 ? 'available' : 'limited';
      }

      this.calendarDays.push({
        day,
        isCurrentMonth: true,
        isToday,
        availability,
        availableCars: totalCars,
        cities: citiesAvailable,
        date,
      });
    }
  }

  getCitiesForDay(date: Date) {
    const cities: any[] = [];

    this.events.forEach((event: any) => {
      const start = new Date(event.start_date);
      const end = new Date(event.end_date);

      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);

      const current = new Date(date);
      current.setHours(0, 0, 0, 0);

      if (current >= start && current <= end) {
        cities.push({
          name: event.city_name.toUpperCase(),
          cars: event.eventCars.length,
        });
      }
    });

    return cities;
  }

  previousMonth() {
    // Remove month navigation - always show current month
    return;
  }

  nextMonth() {
    // Remove month navigation - always show current month
    return;
  }

  selectDate(day: any) {
    if (!day.isCurrentMonth || day.availability === 'booked') return;

    if (this.isLoggedIn) {
      // Find all available dates for the selected city
      let availableDates: string[] = [];
      if (day.cities && day.cities.length > 0) {
        const selectedCity = day.cities[0].name;
        availableDates = this.calendarDays
          .filter((d) => d.isCurrentMonth && d.cities.some((c: any) => c.name === selectedCity))
          .map((d) => {
            if (d.date instanceof Date) {
              // Format as local yyyy-mm-dd
              return (
                d.date.getFullYear() +
                '-' +
                String(d.date.getMonth() + 1).padStart(2, '0') +
                '-' +
                String(d.date.getDate()).padStart(2, '0')
              );
            } else if (typeof d.date === 'string') {
              // fallback if date is already string
              return d.date;
            }
            return '';
          })
          .filter((d: string) => !!d);
      } else {
        // fallback: just the selected day
        availableDates = [
          day.date instanceof Date
            ? day.date.getFullYear() +
              '-' +
              String(day.date.getMonth() + 1).padStart(2, '0') +
              '-' +
              String(day.date.getDate()).padStart(2, '0')
            : day.date,
        ];
      }

      this.router.navigate(['/booking'], {
        state: {
          selectedDate:
            day.date instanceof Date
              ? day.date.getFullYear() +
                '-' +
                String(day.date.getMonth() + 1).padStart(2, '0') +
                '-' +
                String(day.date.getDate()).padStart(2, '0')
              : day.date,
          availableCities: day.cities,
          availableDates: availableDates,
        },
      });
    } else {
      const cityNames = day.cities.map((c: any) => c.name).join(', ');

      this.alertMessage(`Please login first. Available in: ${cityNames}`);
    }
  }

  playHeroVideo() {
    const video = this.heroVideoRef?.nativeElement;
    if (video) {
      // Reset and play video
      video.muted = true;
      video.load();
      const playPromise = video.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Hero video playing successfully');
          })
          .catch((error: any) => {
            console.log('Video autoplay failed:', error);
            // Retry playing on user interaction
            document.addEventListener(
              'click',
              () => {
                video.play().catch((err: any) => console.log('Retry failed:', err));
              },
              { once: true },
            );
          });
      }
    }
  }
}
