import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../theme.service';

@Component({
  selector: 'app-car-selection',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './car-selection.component.html',
  styleUrl: './car-selection.component.scss',
})
export class CarSelectionComponent {
  public themeService = inject(ThemeService);

  bookAudi() {
    // Navigate to the booking page for Audi with necessary query parameters
    // You can customize the query parameters as needed
    const queryParams = {
      carName: 'Audi Q8',
      carImage: 'images/Audi Q8 (3).png'
      // Add more parameters if needed, e.g., price, features, etc.
    };
    // Use RouterLink or programmatic navigation to go to the booking page
    // For example, using RouterLink:
    // this.router.navigate(['/book-audi'], { queryParams });
  }
}
