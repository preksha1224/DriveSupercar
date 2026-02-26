import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { min } from 'rxjs';

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
  startTime: string;
  endTime: string;
  selected: boolean;
  available: boolean;
}
interface timeSlotBooking {
  start: string;
  end: string;
}

@Component({
  selector: 'app-booking-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './booking-page.component.html',
  styleUrl: './booking-page.component.scss',
})
export class BookingPageComponent implements OnInit {
  // Form fields
  carModel: string = '';
  licenseProof: string = '';
  pickupDate: string = '';
  dropDate: string = '';
  amount: number = 0;
  discount: number = 0;
  finalAmount: number = 0;
  selectSlot:TimeSlot|undefined;
  selectTime:any|undefined;
  slotBooking:timeSlotBooking[]|undefined;
  // Time slots (BMS style)
  timeSlots: TimeSlot[] = [
    { id: 'short', startTime: '10:00',endTime:'13:00', selected: false, available: true },
    { id: 'long', startTime: '13:00', endTime:'16:00', selected: false, available: true },
    { id: 'all', startTime: '10:00', endTime:'16:00', selected: false, available: true },
  ];
  minOption=[
    {id: 'short',minOption:[10,20]},
    {id: 'long',minOption:[40,60]},
    {id:'all',minOption:[10,20,40,60]}
  ]
  // Location info
  selectedState: string = '';
  selectedCity: string = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.selectedState = params['state'] || '';
      this.selectedCity = params['city'] || '';
    });
    // const timeSlots = this.getTimeIntervals('10:00', '12:00',60,10);
    // for(let timeSlot of timeSlots){
    //   console.log(timeSlot)
    // }
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  selectTimeSlot(slot: TimeSlot): void {
    if (!slot.available) return;

    // Deselect all other slots
    this.timeSlots.forEach(s => s.selected = false);
    // Select the clicked slot
    slot.selected = true;
    this.selectSlot=slot;
    console.log(this.selectSlot)
    this.selectTime=this.minOption.find(data=>data.id===slot.id)
    console.log(this.selectTime)
    this.selectTime.selected = false
  }
  selectMin(min:number){
    console.log(min);
    if(min===10){
    const timeSlots = this.getTimeIntervals(this.selectSlot?.startTime??'10:00', this.selectSlot?.endTime??'12:00',min,5);
     this.slotBooking=timeSlots;
    }
    else{
    const timeSlots = this.getTimeIntervals(this.selectSlot?.startTime??'10:00', this.selectSlot?.endTime??'12:00',min,10);
     this.slotBooking=timeSlots;
    }
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
      timeSlot: selectedSlot.startTime,
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

  getTimeIntervals(startTimeStr: string, endTimeStr: string, min: number, buffer: number) {
    const intervals = [];
    const startTime = new Date();
    const endTime = new Date();
    const [startHours, startMinutes] = startTimeStr.split(':').map(Number);
    const [endHours, endMinutes] = endTimeStr.split(':').map(Number);
    startTime.setHours(startHours, startMinutes, 0, 0);
    endTime.setHours(endHours, endMinutes, 0, 0);
    if (endTime <= startTime) {
      endTime.setDate(endTime.getDate() + 1);
    }
    let currentStart = new Date(startTime);
    while (currentStart < endTime) {
      let currentEnd = new Date(currentStart);
      currentEnd.setMinutes(currentEnd.getMinutes() + min);
      const formattedStart = `${currentStart.getHours().toString().padStart(2, '0')}:${currentStart.getMinutes().toString().padStart(2, '0')}`;
      const formattedEnd = `${currentEnd.getHours().toString().padStart(2, '0')}:${currentEnd.getMinutes().toString().padStart(2, '0')}`;
      intervals.push({ start: formattedStart, end: formattedEnd });
      // Advance to next slot: last end + buffer
      currentStart = new Date(currentEnd);
      currentStart.setMinutes(currentStart.getMinutes() + buffer);
      if (currentStart > endTime) break;
    }
    return intervals;
  }
}
