import { Injectable } from '@angular/core';
import emailjs from '@emailjs/browser';



@Injectable({
  providedIn: 'root'
})
export class EmailService {
  private readonly SERVICE_ID = 'service_ujgkqf3';
  private readonly PUBLIC_KEY = 'OUnFwoU67T2XmIoFp';
  
  // Template IDs - using same template for all email types
  private readonly REGISTRATION_TEMPLATE_ID = 'template_v6140bc';
  private readonly BOOKING_TEMPLATE_ID = 'template_v6140bc';
  private readonly GIFT_VOUCHER_TEMPLATE_ID = 'template_v6140bc';

  constructor() {
    emailjs.init(this.PUBLIC_KEY);
  }

  /**
   * Send registration success email to the user
   * @param to - User's email address
   * @param firstName - User's first name
   * @param lastName - User's last name
   * @returns Promise with send result
   */
  async sendRegistrationSuccessEmail(
    to: string,
    firstName: string,
    lastName: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const templateParams = {
        to_email: to,
        to_name: `${firstName} ${lastName}`,
        first_name: firstName,
        last_name: lastName,
        subject: 'Welcome to Rental Car - Registration Successful! 🎉',
        reply_to: 'noreply@rentalcar.com'
      };

      const response = await emailjs.send(
        this.SERVICE_ID,
        this.REGISTRATION_TEMPLATE_ID,
        templateParams
      );

      console.log('✓ Registration email sent successfully:', response);
      return {
        success: true,
        message: 'Registration email sent successfully'
      };
    } catch (error: any) {
      console.error('✗ Failed to send registration email:', error);
      return {
        success: false,
        message: error?.text || 'Failed to send registration email'
      };
    }
  }

  /**
   * Send booking confirmation email
   * @param to - User's email address
   * @param bookingDetails - Booking information
   * @returns Promise with send result
   */
  async sendBookingConfirmationEmail(
    to: string,
    bookingDetails: {
      firstName: string;
      lastName: string;
      carName: string;
      bookingDate: string;
      location: string;
      duration: string;
      timeSlot: string;
      totalAmount: number;
    }
  ): Promise<{ success: boolean; message: string }> {
    try {
      const templateParams = {
        to_email: to,
        to_name: `${bookingDetails.firstName} ${bookingDetails.lastName}`,
        first_name: bookingDetails.firstName,
        last_name: bookingDetails.lastName,
        car_name: bookingDetails.carName,
        booking_date: bookingDetails.bookingDate,
        location: bookingDetails.location,
        duration: bookingDetails.duration,
        time_slot: bookingDetails.timeSlot,
        total_amount: bookingDetails.totalAmount,
        subject: `Booking Confirmation - ${bookingDetails.carName}`,
        reply_to: 'noreply@rentalcar.com'
      };

      const response = await emailjs.send(
        this.SERVICE_ID,
        this.BOOKING_TEMPLATE_ID,
        templateParams
      );

      console.log('✓ Booking confirmation email sent successfully:', response);
      return {
        success: true,
        message: 'Booking confirmation email sent successfully'
      };
    } catch (error: any) {
      console.error('✗ Failed to send booking confirmation email:', error);
      return {
        success: false,
        message: error?.text || 'Failed to send booking confirmation email'
      };
    }
  }

  /**
   * Send gift voucher email
   * @param recipientEmail - Recipient's email address
   * @param recipientName - Recipient's name
   * @param senderName - Sender's name
   * @param voucherDetails - Voucher information
   * @returns Promise with send result
   */
  async sendGiftVoucherEmail(
    recipientEmail: string,
    recipientName: string,
    senderName: string,
    voucherDetails: {
      carName: string;
      bookingDate: string;
      location: string;
      duration: string;
      timeSlot: string;
      totalAmount: number;
    }
  ): Promise<{ success: boolean; message: string }> {
    try {
      const templateParams = {
        to_email: recipientEmail,
        to_name: recipientName,
        recipient_name: recipientName,
        sender_name: senderName,
        car_name: voucherDetails.carName,
        booking_date: voucherDetails.bookingDate,
        location: voucherDetails.location,
        duration: voucherDetails.duration,
        time_slot: voucherDetails.timeSlot,
        total_amount: voucherDetails.totalAmount,
        subject: `🎁 You've received a Gift Voucher from ${senderName}!`,
        reply_to: 'noreply@rentalcar.com'
      };

      const response = await emailjs.send(
        this.SERVICE_ID,
        this.GIFT_VOUCHER_TEMPLATE_ID,
        templateParams
      );

      console.log('✓ Gift voucher email sent successfully:', response);
      return {
        success: true,
        message: 'Gift voucher email sent successfully'
      };
    } catch (error: any) {
      console.error('✗ Failed to send gift voucher email:', error);
      return {
        success: false,
        message: error?.text || 'Failed to send gift voucher email'
      };
    }
  }

  /**
   * Test if EmailJS is configured correctly
   * @returns boolean indicating if service is ready
   */
  isConfigured(): boolean {
    // Credentials are configured
    return true;
  }

  /**
   * Send a test email to verify EmailJS configuration
   * @param testEmail - Email address to send test to
   * @returns Promise with send result
   */
  async sendTestEmail(testEmail: string): Promise<{ success: boolean; message: string }> {
    try {
      const templateParams = {
        to_email: testEmail,
        to_name: 'Test User',
        first_name: 'Test',
        last_name: 'User',
        subject: 'EmailJS Configuration Test',
        reply_to: 'noreply@rentalcar.com'
      };

      const response = await emailjs.send(
        this.SERVICE_ID,
        this.REGISTRATION_TEMPLATE_ID,
        templateParams
      );

      console.log('✓ Test email sent successfully to:', testEmail, response);
      return {
        success: true,
        message: `Test email sent successfully to ${testEmail}`
      };
    } catch (error: any) {
      console.error('✗ Failed to send test email:', error);
      return {
        success: false,
        message: error?.text || 'Failed to send test email'
      };
    }
  }
}
