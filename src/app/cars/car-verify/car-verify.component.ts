import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ThemeService } from '../../theme.service';

@Component({
  selector: 'app-car-verify',
  standalone: true,
  imports: [CommonModule, RouterLink],  templateUrl: './car-verify.component.html',
  styleUrl: './car-verify.component.scss',
})
export class CarVerifyComponent implements OnInit {
  themeService = inject(ThemeService);
  route = inject(ActivatedRoute);
  router = inject(Router);

  bookingDetails: any = {};

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.bookingDetails = { ...params };
    });
  }

  onAdd() {
    this.router.navigate(['/success-audi'], {
      queryParams: this.bookingDetails
    });
  }
}
