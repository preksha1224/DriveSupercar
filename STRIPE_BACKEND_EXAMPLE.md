# Stripe Backend Integration Guide

## Overview
This file provides example backend code to implement Stripe Checkout for your rental car booking system.

## Prerequisites
1. Get your Stripe API keys from https://dashboard.stripe.com/apikeys
2. Install Stripe SDK: `npm install stripe` (for Node.js backend)

---

## Node.js/Express Example

```javascript
const express = require('express');
const stripe = require('stripe')('sk_test_YOUR_SECRET_KEY_HERE'); // Replace with your secret key
const app = express();

app.use(express.json());

// Create Stripe Checkout Session
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { lineItems, bookingData, successUrl, cancelUrl } = req.body;

    // Create line items for Stripe
    const stripeLineItems = lineItems.map(item => ({
      price_data: {
        currency: item.currency || 'eur',
        product_data: {
          name: item.name,
          description: item.description,
        },
        unit_amount: item.amount, // Amount in cents
      },
      quantity: item.quantity || 1,
    }));

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: stripeLineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        // Store booking data in metadata to retrieve after payment
        userId: bookingData.user_id,
        eventCarId: bookingData.eventCarId,
        startTime: bookingData.start_time,
        endTime: bookingData.end_time,
        amount: bookingData.amount.toString(),
        isGiftVoucher: bookingData.isGiftVoucher || 'false',
        recipientEmail: bookingData.recipientEmail || '',
        recipientName: bookingData.recipientName || '',
      },
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook to handle successful payments
app.post('/api/stripe-webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = 'whsec_YOUR_WEBHOOK_SECRET'; // Get this from Stripe Dashboard

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Extract booking data from metadata
    const bookingData = {
      user_id: session.metadata.userId,
      eventCarId: session.metadata.eventCarId,
      start_time: session.metadata.startTime,
      end_time: session.metadata.endTime,
      amount: parseFloat(session.metadata.amount),
      payment_intent: session.payment_intent,
      payment_status: 'completed',
      isGiftVoucher: session.metadata.isGiftVoucher === 'true',
      recipientEmail: session.metadata.recipientEmail,
      recipientName: session.metadata.recipientName,
    };

    // TODO: Call your booking service to create the booking in your database
    // Example:
    // await bookingService.createBooking(bookingData);
    
    console.log('✓ Payment successful, booking created:', bookingData);
  }

  res.json({ received: true });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

---

## Python/Flask Example

```python
import stripe
from flask import Flask, request, jsonify

app = Flask(__name__)
stripe.api_key = 'sk_test_YOUR_SECRET_KEY_HERE'  # Replace with your secret key

@app.route('/api/create-checkout-session', methods=['POST'])
def create_checkout_session():
    try:
        data = request.json
        line_items = data.get('lineItems', [])
        booking_data = data.get('bookingData', {})
        success_url = data.get('successUrl')
        cancel_url = data.get('cancelUrl')

        # Create line items for Stripe
        stripe_line_items = []
        for item in line_items:
            stripe_line_items.append({
                'price_data': {
                    'currency': item.get('currency', 'eur'),
                    'product_data': {
                        'name': item['name'],
                        'description': item.get('description', ''),
                    },
                    'unit_amount': item['amount'],  # Amount in cents
                },
                'quantity': item.get('quantity', 1),
            })

        # Create checkout session
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=stripe_line_items,
            mode='payment',
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                'userId': booking_data.get('user_id', ''),
                'eventCarId': booking_data.get('eventCarId', ''),
                'startTime': booking_data.get('start_time', ''),
                'endTime': booking_data.get('end_time', ''),
                'amount': str(booking_data.get('amount', 0)),
                'isGiftVoucher': str(booking_data.get('isGiftVoucher', False)),
                'recipientEmail': booking_data.get('recipientEmail', ''),
                'recipientName': booking_data.get('recipientName', ''),
            }
        )

        return jsonify({'id': session.id})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/stripe-webhook', methods=['POST'])
def stripe_webhook():
    payload = request.data
    sig_header = request.headers.get('Stripe-Signature')
    webhook_secret = 'whsec_YOUR_WEBHOOK_SECRET'  # Get from Stripe Dashboard

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
    except ValueError:
        return 'Invalid payload', 400
    except stripe.error.SignatureVerificationError:
        return 'Invalid signature', 400

    # Handle checkout.session.completed event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        
        booking_data = {
            'user_id': session['metadata']['userId'],
            'eventCarId': session['metadata']['eventCarId'],
            'start_time': session['metadata']['startTime'],
            'end_time': session['metadata']['endTime'],
            'amount': float(session['metadata']['amount']),
            'payment_intent': session.get('payment_intent'),
            'payment_status': 'completed',
            'isGiftVoucher': session['metadata']['isGiftVoucher'] == 'True',
            'recipientEmail': session['metadata'].get('recipientEmail', ''),
            'recipientName': session['metadata'].get('recipientName', ''),
        }

        # TODO: Call your booking service to create the booking
        print('✓ Payment successful, booking created:', booking_data)

    return jsonify({'received': True})


if __name__ == '__main__':
    app.run(port=3000)
```

---

## Setup Instructions

### 1. Get Your Stripe Keys
- Log in to https://dashboard.stripe.com
- Go to Developers > API keys
- Copy your **Publishable key** (starts with `pk_test_`) for the frontend
- Copy your **Secret key** (starts with `sk_test_`) for the backend

### 2. Update Frontend (Already done)
- Open `booking-page.component.ts`
- Replace `pk_test_51Nw7...YOUR_PUBLIC_KEY` with your actual publishable key

### 3. Implement Backend
- Choose Node.js or Python example above
- Replace `sk_test_YOUR_SECRET_KEY_HERE` with your secret key
- Deploy to your backend server

### 4. Configure Webhook (for production)
- Go to Stripe Dashboard > Developers > Webhooks
- Add endpoint: `https://your-domain.com/api/stripe-webhook`
- Select event: `checkout.session.completed`
- Copy the webhook signing secret (starts with `whsec_`)
- Replace `whsec_YOUR_WEBHOOK_SECRET` in your code

### 5. Update Success Page
Create a success page component to handle the redirect after payment:

```typescript
// booking-success.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-booking-success',
  template: `
    <div class="success-container">
      <h1>✓ Booking Confirmed!</h1>
      <p>Your payment was successful.</p>
      <p>Session ID: {{ sessionId }}</p>
      <a routerLink="/">Return to Home</a>
    </div>
  `
})
export class BookingSuccessComponent implements OnInit {
  sessionId: string = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.sessionId = this.route.snapshot.queryParams['session_id'] || '';
    // TODO: Verify payment status with backend using sessionId
  }
}
```

---

## Testing

### Test Cards (Stripe Test Mode)
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Use any future expiry date and any 3-digit CVC

### Test Flow
1. Select a car, location, date, and time slot
2. Click "CONFIRM RESERVATION"
3. You'll be redirected to Stripe Checkout
4. Enter test card: `4242 4242 4242 4242`
5. After payment, you'll be redirected to success page
6. Webhook will create booking in your database

---

## Production Checklist
- [ ] Replace test keys with live keys (`pk_live_...` and `sk_live_...`)
- [ ] Set up webhook endpoint in production
- [ ] Configure proper success/cancel URLs
- [ ] Add error logging and monitoring
- [ ] Test payment flow end-to-end
- [ ] Enable 3D Secure for EU compliance (SCA)
- [ ] Add receipt emails through Stripe

---

## Security Notes
⚠️ **NEVER** expose your Stripe secret key in frontend code!
⚠️ Always validate payments on the backend using webhooks
⚠️ Use HTTPS in production for all API calls
