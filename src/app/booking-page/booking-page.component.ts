import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Booking {
  id: string;
  licenseProof: string;
  pickupDate: Date;
  dropDate: Date;
  timeSlot: string;
  amount: number;
  discount: number;
  finalAmount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  carModel?: string;
}

interface TimeSlot {
  id: string;
  time: string;
  selected: boolean;
  available: boolean;
}

@Component({
  selector: 'app-booking-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './booking-page.component.html',
  styleUrl: './booking-page.component.scss',
})
export class BookingPageComponent {
  // Form fields
  carModel: string = '';
  licenseProof: string = '';
  pickupDate: string = '';
  dropDate: string = '';
  amount: number = 0;
  discount: number = 0;
  finalAmount: number = 0;

  // Time slots (BMS style)
  timeSlots: TimeSlot[] = [
    { id: 'slot1', time: '06:00 AM - 08:00 AM', selected: false, available: true },
    { id: 'slot2', time: '08:00 AM - 10:00 AM', selected: false, available: true },
    { id: 'slot3', time: '10:00 AM - 12:00 PM', selected: false, available: true },
    { id: 'slot4', time: '12:00 PM - 02:00 PM', selected: false, available: false },
    { id: 'slot5', time: '02:00 PM - 04:00 PM', selected: false, available: true },
    { id: 'slot6', time: '04:00 PM - 06:00 PM', selected: false, available: true },
    { id: 'slot7', time: '06:00 PM - 08:00 PM', selected: false, available: true },
    { id: 'slot8', time: '08:00 PM - 10:00 PM', selected: false, available: false },
  ];

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  selectTimeSlot(slot: TimeSlot): void {
    if (!slot.available) return;
    
    // Deselect all other slots
    this.timeSlots.forEach(s => s.selected = false);
    // Select the clicked slot
    slot.selected = true;
  }

  calculateFinalAmount(): void {
    this.finalAmount = this.amount - this.discount;
  }

  onAmountChange(): void {
    this.calculateFinalAmount();
  }

  onDiscountChange(): void {
    this.calculateFinalAmount();
  }

  submitBooking(): void {
    const selectedSlot = this.timeSlots.find(slot => slot.selected);
    
    if (!this.carModel || !this.licenseProof || !this.pickupDate || !this.dropDate || !selectedSlot) {
      alert('Please fill all required fields and select a time slot');
      return;
    }

    // You can add your booking submission logic here
    console.log('Booking submitted:', {
      carModel: this.carModel,
      licenseProof: this.licenseProof,
      pickupDate: this.pickupDate,
      dropDate: this.dropDate,
      timeSlot: selectedSlot.time,
      amount: this.amount,
      discount: this.discount,
      finalAmount: this.finalAmount
    });

    alert('Booking submitted successfully!');
    this.resetForm();
  }

  resetForm(): void {
    this.carModel = '';
    this.licenseProof = '';
    this.pickupDate = '';
    this.dropDate = '';
    this.amount = 0;
    this.discount = 0;
    this.finalAmount = 0;
    this.timeSlots.forEach(slot => slot.selected = false);
  }
}
