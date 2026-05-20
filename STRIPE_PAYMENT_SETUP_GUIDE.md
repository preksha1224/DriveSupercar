# Stripe Payment Integration - Setup Guide

## Overview
Your booking system now uses **Stripe Payment Intents API** with your existing backend endpoints:
- `POST /payment/create-payment-intent`
- `POST /payment/confirm`
- `POST /payment/refund`
- `GET /payment`
- `GET /payment/:id`
- `GET /payment/booking/:bookingId`

## 🎯 How It Works

### Payment Flow
1. **User completes booking form** → Fills car, location, date, time, and card details
2. **Creates Payment Intent** → Frontend calls `/payment/create-payment-intent` with booking data
3. **Backend returns clientSecret** → Stripe creates a payment intent
4. **Confirms payment** → Frontend uses Stripe.js to process card with clientSecret
5. **Payment succeeds** → Frontend calls `/payment/confirm` to finalize
6. **Creates booking** → Booking is saved with payment reference
7. **Sends email** → Confirmation email sent to user

### Security Benefits
- Card details never touch your server (PCI compliance)
- Payment processing handled by Stripe
- 3D Secure (SCA) automatically applied for EU payments
- Secure client-server communication

---

## 📋 Setup Instructions

### Step 1: Get Your Stripe API Keys

1. Create or log in to your Stripe account: https://dashboard.stripe.com
2. Navigate to **Developers → API keys**
3. Copy your keys:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

### Step 2: Update Frontend Configuration

**File:** `src/app/booking-page/booking-page.component.ts`

Find this line (around line 264):
```typescript
const stripeKey = 'pk_test_51Nw7...YOUR_PUBLIC_KEY';
```

Replace with your actual publishable key:
```typescript
const stripeKey = 'pk_test_YOUR_ACTUAL_PUBLISHABLE_KEY';
```

⚠️ **IMPORTANT:** Only use your **publishable key** in frontend code!

### Step 3: Implement Backend Endpoints

Your backend needs to implement these endpoints using Stripe's server-side SDK:

#### Install Stripe SDK (Node.js):
```bash
npm install stripe
```

#### Backend Implementation Example (Node.js/Express):

```javascript
const express = require('express');
const stripe = require('stripe')('sk_test_YOUR_SECRET_KEY'); // Use your secret key
const router = express.Router();

// POST /payment/create-payment-intent
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'eur', metadata } = req.body;

    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Amount in cents (e.g., 1500 = €15.00)
      currency: currency,
      metadata: metadata, // Store booking info
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /payment/confirm
router.post('/confirm', async (req, res) => {
  try {
    const { paymentIntentId, bookingData } = req.body;

    // Verify the payment intent succeeded
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not successful' });
    }

    // TODO: Create booking in your database
    // const booking = await createBooking({
    //   ...bookingData,
    //   paymentIntentId,
    //   paymentStatus: 'completed',
    // });

    res.json({
      success: true,
      paymentIntent: paymentIntent,
      // booking: booking,
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /payment/refund
router.post('/refund', async (req, res) => {
  try {
    const { paymentIntentId, amount, reason } = req.body;

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount, // Optional: partial refund
      reason: reason || 'requested_by_customer',
    });

    res.json({ success: true, refund });
  } catch (error) {
    console.error('Error creating refund:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /payment (Get all payments)
router.get('/', async (req, res) => {
  try {
    const paymentIntents = await stripe.paymentIntents.list({ limit: 100 });
    res.json({ data: paymentIntents.data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /payment/:id (Get payment by ID)
router.get('/:id', async (req, res) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(req.params.id);
    res.json({ data: paymentIntent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /payment/booking/:bookingId (Get payments by booking)
router.get('/booking/:bookingId', async (req, res) => {
  try {
    // TODO: Query your database for payments associated with this booking
    // This requires storing payment-booking relationships in your DB
    res.json({ data: [] }); // Placeholder
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

#### Register routes in your main app:
```javascript
const paymentRouter = require('./routes/payment');
app.use('/payment', paymentRouter);
```

### Step 4: Test the Integration

#### Test Mode Cards (for development):
| Card Number | Result | 3D Secure |
|-------------|--------|-----------|
| `4242 4242 4242 4242` | ✅ Success | No |
| `4000 0025 0000 3155` | ✅ Success | Yes (requires popup) |
| `4000 0000 0000 9995` | ❌ Declined | No |
| `4000 0000 0000 0002` | ❌ Declined (generic) | No |

- **Expiry Date:** Any future date (e.g., 12/25)
- **CVC:** Any 3 digits (e.g., 123)
- **ZIP:** Any 5 digits (e.g., 12345)

#### Testing Steps:
1. Start your backend server
2. Start Angular dev server: `ng serve`
3. Navigate to booking page
4. Fill out all booking details
5. On Step 4, enter test card: `4242 4242 4242 4242`
6. Click "CONFIRM RESERVATION"
7. Payment should process and booking should be created

---

## 🔒 Security Best Practices

### ✅ DO:
- Store secret key in environment variables (never in code)
- Use HTTPS in production
- Validate payment status on backend before creating booking
- Implement webhook for payment status updates
- Log all payment transactions

### ❌ DON'T:
- Never expose secret key in frontend code
- Don't trust payment status from frontend only
- Don't store card details on your server
- Don't skip webhook implementation in production

---

## 🚀 Production Deployment

### 1. Switch to Live Keys
Replace test keys with live keys:
- Frontend: `pk_live_...`
- Backend: `sk_live_...`

### 2. Set Up Webhooks (Required!)
Webhooks ensure your backend is notified of payment status changes:

1. Go to **Stripe Dashboard → Developers → Webhooks**
2. Click "Add endpoint"
3. Enter your webhook URL: `https://yourdomain.com/payment/webhook`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the webhook signing secret (starts with `whsec_`)

#### Implement webhook endpoint:
```javascript
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = 'whsec_YOUR_WEBHOOK_SECRET';

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('✓ Payment succeeded:', paymentIntent.id);
      // Update booking status in your database
      break;
    case 'payment_intent.payment_failed':
      console.log('✗ Payment failed:', event.data.object.id);
      // Handle failed payment
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({received: true});
});
```

### 3. Enable 3D Secure (SCA)
For EU compliance, 3D Secure is automatically enabled. No additional configuration needed.

### 4. Update Success/Cancel URLs
Ensure your production domain is used in redirect URLs.

---

## 📊 Monitoring & Debugging

### View Payments in Stripe Dashboard
1. Go to **Payments** tab
2. Filter by status, date, amount
3. Click on any payment to see details and metadata

### Common Issues

#### ❗ "Payment system is still loading"
- **Cause:** Stripe.js script failed to load
- **Fix:** Check internet connection, verify Stripe is not blocked by firewall

#### ❗ "Failed to create payment intent"
- **Cause:** Backend endpoint not responding or returning error
- **Fix:** Check backend logs, verify Stripe secret key is correct

#### ❗ "Payment was not successful"
- **Cause:** Card declined or authentication failed
- **Fix:** Try different test card or check Stripe logs for decline reason

#### ❗ "Card information is required"
- **Cause:** Card element didn't mount properly
- **Fix:** Ensure you're on Step 4 and Stripe.js loaded successfully

### Debug Mode
Check browser console for detailed logs:
- `✓ Stripe loaded successfully`
- `✓ Card element mounted`
- `✓ Payment intent created`
- `✓ Payment confirmed: pi_xxx`
- `✓ Payment confirmed on backend`

---

## 💡 Advanced Features

### Refund a Payment
```typescript
// In your admin panel
this.paymentService.refundPayment({
  paymentIntentId: 'pi_xxx',
  amount: 5000, // Optional: partial refund in cents
  reason: 'requested_by_customer'
}).subscribe(result => {
  console.log('Refund successful:', result);
});
```

### Get Payment History
```typescript
// Get all payments
this.paymentService.getAllPayments().subscribe(payments => {
  console.log('All payments:', payments);
});

// Get payments for a specific booking
this.paymentService.getPaymentsByBooking(bookingId).subscribe(payments => {
  console.log('Booking payments:', payments);
});
```

---

## 📞 Support

- **Stripe Documentation:** https://stripe.com/docs/payments/payment-intents
- **Stripe Support:** https://support.stripe.com/
- **Test Cards:** https://stripe.com/docs/testing

---

## ✅ Checklist

Before going live:
- [ ] Replaced test keys with live keys
- [ ] Set up webhook endpoint
- [ ] Tested successful payment flow
- [ ] Tested declined payment flow
- [ ] Tested 3D Secure flow (EU)
- [ ] Configured HTTPS
- [ ] Stored secret keys in environment variables
- [ ] Tested refund functionality
- [ ] Set up payment monitoring/alerts
- [ ] Reviewed Stripe Dashboard settings

---

## 🎉 You're All Set!

Your rental car booking system now has secure payment processing with Stripe Payment Intents!
