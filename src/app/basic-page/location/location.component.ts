import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-location',
  imports: [CommonModule],
  templateUrl: './location.component.html',
  styleUrl: './location.component.scss',
})
export class LocationComponent {
  constructor(private router: Router) {}

  states = [
    {
      name: 'Berlin',
      imageUrl: 'images/berlin-skyline.jpg',
      imageAlt: 'Berlin city skyline',
      cities: ['Mitte', 'Charlottenburg', 'Kreuzberg', 'Prenzlauer Berg']
    },
    {
      name: 'Hamburg',
      imageUrl: 'images/hamburg.jpg',
      imageAlt: 'Hamburg harbor skyline',
      cities: ['Altona', 'Eimsbüttel', 'Hamburg-Mitte', 'Wandsbek']
    },
    {
      name: 'Munich',
      imageUrl: 'images/munich.jpg',
      imageAlt: 'Munich city skyline',
      cities: ['Altstadt', 'Schwabing', 'Maxvorstadt', 'Haidhausen']
    },
    {
      name: 'Cologne',
      imageUrl: 'images/cologne-cathedral-skyline.jpg',
      imageAlt: 'Cologne cathedral skyline',
      cities: ['Innenstadt', 'Ehrenfeld', 'Nippes', 'Lindenthal']
    },
  ];

  onCitySelect(stateName: string, cityName: string): void {
    this.router.navigate(['/booking'], {
      queryParams: {
        state: stateName,
        city: cityName
      }
    });
  }
}
