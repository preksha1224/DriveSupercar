import { AfterViewInit, ElementRef, ViewChild, Renderer2, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, AfterViewInit {
  @ViewChild('heroCard', { static: false }) heroCardRef!: ElementRef;
  toastMessage: string = '';
  showToast: boolean = false;
  toastTimeout: any;

  locations = [
    {
      city: 'BERLIN',
      region: 'Brandenburg',
      route: 'Autobahn A100 & City Routes',
      popular: true,
      lat: 52.5200,
      lng: 13.4050
    },
    {
      city: 'MUNICH',
      region: 'Bavaria',
      route: 'Alpine Foothills & City Circuits',
      popular: false,
      lat: 48.1351,
      lng: 11.5820
    },
    {
      city: 'FRANKFURT',
      region: 'Hesse',
      route: 'Taunus Mountain Roads',
      popular: false,
      lat: 50.1109,
      lng: 8.6821
    },
    {
      city: 'HAMBURG',
      region: 'Hamburg',
      route: 'Harbor Drive & Expressways',
      popular: false,
      lat: 53.5511,
      lng: 9.9937
    },
    {
      city: 'STUTTGART',
      region: 'Baden-Württemberg',
      route: 'Swabian Alb Scenic Routes',
      popular: false,
      lat: 48.7758,
      lng: 9.1829
    }
  ];

  // Calendar properties
  currentDate: Date = new Date();
  currentMonthYear: string = '';
  weekDays: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  calendarDays: any[] = [];
  totalCarsAvailable: number = 45;

  // City availability data for different dates
  cityAvailability: any = {
    'BERLIN': [2, 5, 8, 12, 15, 18, 22, 25, 28],
    'MUNICH': [3, 7, 10, 14, 17, 20, 24, 27, 30],
    'FRANKFURT': [1, 6, 9, 13, 16, 19, 23, 26, 29],
    'HAMBURG': [4, 11, 15, 21, 25, 28],
    'STUTTGART': [5, 12, 18, 22, 26]
  };

  constructor(private renderer: Renderer2, private authService: AuthService, private router: Router) {}
  
  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  ngOnInit() {
    // Generate calendar on init to ensure data is ready
    this.generateCalendar();
  }

  ngAfterViewInit() {
    // Calendar already generated in ngOnInit
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
      this.router.navigateByUrl('/user/login')
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
    // Always use current date
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    // Format current month and year
    this.currentMonthYear = today.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
    
    // Get first day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    // Get days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    this.calendarDays = [];
    
    // Add days from previous month
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      this.calendarDays.push({
        day: prevMonthLastDay - i,
        isCurrentMonth: false,
        isToday: false,
        availability: null,
        availableCars: 0,
        cities: []
      });
    }
    
    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday = date.toDateString() === today.toDateString();
      
      // Get cities available on this day
      const citiesAvailable = this.getCitiesForDay(day);
      
      // Determine availability based on number of cities
      let availability = 'booked';
      let totalCars = 0;
      
      if (citiesAvailable.length > 0) {
        totalCars = citiesAvailable.reduce((sum, city) => sum + city.cars, 0);
        
        if (citiesAvailable.length >= 3) {
          availability = 'available';
        } else if (citiesAvailable.length > 0) {
          availability = 'limited';
        }
      }
      
      this.calendarDays.push({
        day: day,
        isCurrentMonth: true,
        isToday: isToday,
        availability: availability,
        availableCars: totalCars,
        cities: citiesAvailable,
        date: date
      });
    }
    
    // Add days from next month to fill the grid
    const remainingDays = 42 - this.calendarDays.length;
    for (let day = 1; day <= remainingDays; day++) {
      this.calendarDays.push({
        day: day,
        isCurrentMonth: false,
        isToday: false,
        availability: null,
        availableCars: 0,
        cities: []
      });
    }
    
    console.log('Calendar generated:', this.calendarDays.length, 'days');
    console.log('Current month:', this.currentMonthYear);
  }

  getCitiesForDay(day: number): any[] {
    const cities = [];
    
    for (const [cityName, days] of Object.entries(this.cityAvailability)) {
      if ((days as number[]).includes(day)) {
        cities.push({
          name: cityName,
          cars: Math.floor(Math.random() * 8) + 3 // 3-10 cars per city
        });
      }
    }
    
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
      // Navigate to booking with selected date and available cities
      this.router.navigate(['/booking'], { 
        state: { 
          selectedDate: day.date,
          availableCities: day.cities
        }
      });
    } else {
      const cityNames = day.cities.map((c: any) => c.name).join(', ');
      this.alertMessage(`Please login first to book a car. Available in: ${cityNames}`);
    }
  }
}
