import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Offer {
  id: number;
  title: string;
  description: string;
  discount: string;
  code?: string;
  validUntil: string;
  image?: string;
}

@Component({
  selector: 'app-deals',
  imports: [CommonModule],
  templateUrl: './deals.html',
  styleUrl: './deals.scss',
})
export class Deals {
  discounts: Offer[] = [
    { id: 1, title: 'Weekend Special', description: 'Save on weekend rentals', discount: '25% OFF', validUntil: '2024-12-31' },
    { id: 2, title: 'Long Term Rental', description: 'Book for 7+ days', discount: '30% OFF', validUntil: '2024-12-31' },
    { id: 3, title: 'Early Bird Offer', description: 'Book 30 days in advance', discount: '20% OFF', validUntil: '2024-12-31' }
  ];

  coupons: Offer[] = [
    { id: 1, title: 'First Time User', description: 'For new customers only', discount: '15% OFF', code: 'FIRST15', validUntil: '2024-12-31' },
    { id: 2, title: 'Student Discount', description: 'Valid student ID required', discount: '10% OFF', code: 'STUDENT10', validUntil: '2024-12-31' },
    { id: 3, title: 'Senior Citizen', description: 'Age 60+ discount', discount: '12% OFF', code: 'SENIOR12', validUntil: '2024-12-31' }
  ];

  festivalOffers: Offer[] = [
    { id: 1, title: 'Christmas Special', description: 'Holiday season offer', discount: '35% OFF', code: 'XMAS35', validUntil: '2024-12-26' },
    { id: 2, title: 'New Year Bonanza', description: 'Start the year with savings', discount: '40% OFF', code: 'NEWYEAR40', validUntil: '2025-01-07' },
    { id: 3, title: 'Summer Sale', description: 'Beat the heat with cool deals', discount: '28% OFF', code: 'SUMMER28', validUntil: '2024-08-31' }
  ];

  giftVouchers: Offer[] = [
    { id: 1, title: '$50 Gift Card', description: 'Perfect for any occasion', discount: '$50', validUntil: '2025-12-31' },
    { id: 2, title: '$100 Gift Card', description: 'Great value gift option', discount: '$100', validUntil: '2025-12-31' },
    { id: 3, title: '$200 Gift Card', description: 'Premium gift voucher', discount: '$200', validUntil: '2025-12-31' }
  ];

  copyCode(code: string) {
    navigator.clipboard.writeText(code);
    alert(`Coupon code "${code}" copied to clipboard!`);
  }

  getFestivalIcon(title: string): string {
    if (title.includes('Christmas')) return '🎄';
    if (title.includes('New Year')) return '🎆';
    if (title.includes('Summer')) return '☀️';
    return '🎉';
  }
}
