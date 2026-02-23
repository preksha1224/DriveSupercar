import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-location',
  imports: [CommonModule],
  templateUrl: './location.component.html',
  styleUrl: './location.component.scss',
})
export class LocationComponent {
  cities = [
    {
      name: 'Berlin',
      imageUrl: 'images/berlin-skyline.jpg',
      imageAlt: 'Berlin city skyline',
    },
    {
      name: 'Hamburg',
      imageUrl: 'images/hamburg.jpg',
      imageAlt: 'Hamburg harbor skyline',
    },
    {
      name: 'Munich',
      imageUrl: 'images/munich.jpg',
      imageAlt: 'Munich city skyline',
    },
    {
      name: 'Cologne',
      imageUrl: 'images/cologne-cathedral-skyline.jpg',
      imageAlt: 'Cologne cathedral skyline',
    },
  ];
}
