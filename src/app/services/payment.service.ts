import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {

  constructor(private http: HttpClient) {}

  /**
   * Create a payment intent
   */
  createPaymentIntent(paymentData: {
    amount: number;
    currency?: string;
    metadata?: any;
  }): Observable<any> {
    return this.http.post(`/payment/create-payment-intent`, paymentData);
  }

  /**
   * Confirm payment
   */
  confirmPayment(confirmData: {
    paymentIntentId: string;
    bookingId?: string;
    [key: string]: any;
  }): Observable<any> {
    return this.http.post(`/payment/confirm`, confirmData);
  }

  /**
   * Refund payment
   */
  refundPayment(refundData: {
    paymentIntentId: string;
    amount?: number;
    reason?: string;
  }): Observable<any> {
    return this.http.post(`/payment/refund`, refundData);
  }

}
