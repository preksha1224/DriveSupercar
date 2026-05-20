# Environment Setup Guide

This project uses environment configuration files to manage sensitive keys like Stripe API keys. This ensures that each developer can use their own keys without committing them to the repository.

## Setup Instructions

### For New Developers

1. **Copy the template file:**
   ```bash
   cp src/environments/environment.template.ts src/environments/environment.development.ts
   ```

2. **Add your Stripe test key:**
   - Open `src/environments/environment.development.ts`
   - Replace `pk_test_YOUR_STRIPE_TEST_KEY_HERE` with your actual Stripe test key
   - You can get your Stripe test keys from: https://dashboard.stripe.com/test/apikeys

3. **Important:** Never commit `environment.development.ts` or `environment.ts` files with real keys!
   - These files are already in `.gitignore` to prevent accidental commits

### Environment Files Structure

- **`environment.template.ts`** - Template file (committed to git)
  - Contains placeholder values
  - Used as a reference for other developers

- **`environment.development.ts`** - Development environment (NOT committed)
  - Contains your local Stripe test keys
  - Used during `ng serve`

- **`environment.ts`** - Production environment (NOT committed)
  - Contains production Stripe keys
  - Used during `ng build --configuration=production`

### Configuration Options

```typescript
export const environment = {
  production: false,
  stripePublishableKey: 'pk_test_YOUR_KEY_HERE',  // Your Stripe publishable key
  apiUrl: 'http://localhost:3000/api'              // Backend API URL
};
```

### Getting Your Stripe Keys

1. Go to https://stripe.com
2. Sign up or log in to your account
3. Navigate to Developers → API keys
4. Copy your **Publishable key** (starts with `pk_test_` for test mode)
5. Paste it into your `environment.development.ts` file

### For Production Deployment

Before deploying to production:
1. Create/update `environment.ts` with production Stripe keys
2. Use live keys (starting with `pk_live_`) instead of test keys
3. Ensure the keys are stored securely (environment variables, secrets manager, etc.)

## Security Notes

⚠️ **Never commit real API keys to the repository!**

- The `.gitignore` file is configured to exclude environment files with keys
- Always use the template file as a reference
- Keep your API keys secure and don't share them publicly
- Use test keys for development and live keys for production only

## Troubleshooting

**Problem:** "Stripe is not loading" or payment errors
- **Solution:** Verify your Stripe key in `environment.development.ts` is correct

**Problem:** "Cannot find module '../../environments/environment.development'"
- **Solution:** Make sure you've created the `environment.development.ts` file from the template

**Problem:** Build fails with environment errors
- **Solution:** Ensure both `environment.ts` and `environment.development.ts` exist with valid configurations
