import { AfterViewInit, ElementRef, ViewChild, Renderer2 } from '@angular/core';
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
export class HomeComponent implements AfterViewInit {
  @ViewChild('heroCard', { static: false }) heroCardRef!: ElementRef;
  toastMessage: string = '';
  showToast: boolean = false;
  toastTimeout: any;

  constructor(private renderer: Renderer2,private authService:AuthService,private router:Router) {}
  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  ngAfterViewInit() {}

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

  bookingRedirect(){
    if(this.isLoggedIn) {
      this.router.navigateByUrl('/booking');
    } else {
      this.alertMessage('Please login first to explore booking the car');
    }
  }

  viewOffers() {
    if(this.isLoggedIn) {
      this.router.navigateByUrl('/deals');
    } else {
      this.alertMessage('Please login first to see offers and deals in detail');
    }
  }

  listYourCar() {
    if(this.isLoggedIn) {
      this.router.navigateByUrl('/owner/list-car');
    } else {
      this.alertMessage('Please login first to list your car');
    }
  }
}
