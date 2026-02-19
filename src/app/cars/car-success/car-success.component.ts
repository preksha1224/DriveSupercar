import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ThemeService } from '../../theme.service';

@Component({
  selector: 'app-car-success',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './car-success.component.html',
  styleUrl: './car-success.component.scss',
})
export class CarSuccessComponent implements OnInit {
  themeService = inject(ThemeService);
  route = inject(ActivatedRoute);
  router = inject(Router);

  details: any = {};

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.details = params;
    });

     setTimeout(() => {
      this.router.navigate(['/']);
    }, 10000);
  }

  goToHome() {
    this.router.navigate(['/']);
  }
}
