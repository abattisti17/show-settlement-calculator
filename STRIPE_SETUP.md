# Stripe Subscription Setup Guide

This guide will walk you through setting up Stripe subscriptions for your Show Settlement Calculator.

## Prerequisites

- A Stripe account (sign up at https://stripe.com if you don't have one)
- Access to your Supabase dashboard
- Your app deployed or running locally

## Step 1: Create Database Table ✅ ALREADY DONE

**This step is complete!** The `user_subscriptions` table was created using `supabase db push`.

You can verify it exists:
1. Go to your Supabase dashboard
2. Navigate to **Table Editor**
3. Look for `user_subscriptions` in the table list

**Skip to Step 2!**

## Step 2: Get Supabase Service Role Key

1. Go to your Supabase dashboard
2. Navigate to **Settings → API**
3. Copy the **service_role** key (keep this secret!)
4. Add it to your `.env.local` file as `SUPABASE_SERVICE_ROLE_KEY`

## Step 3: Create Stripe Product and Price

1. Log in to your Stripe Dashboard: https://dashboard.stripe.com
2. Navigate to **Products** in the left sidebar
3. Click **+ Add product**
4. Fill in the details:
   - **Name**: "Settlement Calculator Pro" (or your preferred name)
   - **Description**: Optional description of your subscription
   - **Pricing**: Set up your pricing model
     - **Price**: Enter your monthly price (e.g., $10.00)
     - **Billing period**: Monthly (recurring)
     - **Currency**: USD (or your preferred currency)
5. Click **Save product**
6. **Copy the Price ID** (starts with `price_`...) - you'll need this for your environment variables

## Step 4: Get Stripe API Keys

### Development (Test Mode)

1. In your Stripe Dashboard, make sure **Test mode** is ON (toggle in the top right)
2. Navigate to **Developers → API keys**
3. Copy the following keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)

### Production (Live Mode)

When you're ready to go live:

1. Toggle to **Live mode** in the Stripe Dashboard
2. Navigate to **Developers → API keys**
3. Copy the following keys:
   - **Publishable key** (starts with `pk_live_`)
   - **Secret key** (starts with `sk_live_`)

## Step 5: Set Up Environment Variables

Add the following to your `.env.local` file:

```bash
# Supabase Service Role Key (from Step 2)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Stripe Keys (from Step 4)
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# Stripe Price ID (from Step 3)
STRIPE_PRICE_ID=price_your_price_id_here

# Stripe Webhook Secret (you'll get this in Step 6)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### Vercel Deployment

Don't forget to add these environment variables to your Vercel project:

1. Go to your Vercel project dashboard
2. Navigate to **Settings → Environment Variables**
3. Add all the above variables for **Production**, **Preview**, and **Development** environments

## Step 6: Set Up Stripe Webhooks

Webhooks are critical for keeping your database in sync with Stripe subscription events.

### Local Development (using Stripe CLI)

1. Install the Stripe CLI: https://stripe.com/docs/stripe-cli
2. Run `stripe login` to authenticate
3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
   ```
4. Copy the webhook signing secret (starts with `whsec_`) and add it to your `.env.local`

### Production (Vercel)

1. In your Stripe Dashboard, navigate to **Developers → Webhooks**
2. Click **+ Add endpoint**
3. Enter your webhook URL:
   - URL: `https://show-settlement-calculator.vercel.app/api/webhooks/stripe`
   - Replace `your-domain` with your actual Vercel domain
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. Click on the newly created endpoint
7. **Reveal** and copy the **Signing secret** (starts with `whsec_`)
8. Add this to your Vercel environment variables as `STRIPE_WEBHOOK_SECRET`

## Step 7: Enable Customer Portal

The Customer Portal allows users to manage their own subscriptions (update payment methods, cancel, view invoices).

1. In your Stripe Dashboard, navigate to **Settings → Billing → Customer Portal**
2. Click **Activate test link** (for test mode) or configure settings for production
3. Configure what customers can do:
   - ✅ **Cancel subscriptions** (recommended)
   - ✅ **Update payment methods** (recommended)
   - ✅ **View invoices** (recommended)
   - Configure cancellation flow (immediate or at period end)
4. Save your settings

## Step 8: Test the Integration

### Test with Stripe Test Cards

Stripe provides test card numbers for testing different scenarios:

**Successful payment:**
- Card number: `4242 4242 4242 4242`
- Any future expiration date (e.g., 12/34)
- Any 3-digit CVC
- Any ZIP code

**Declined payment:**
- Card number: `4000 0000 0000 0002`

**Other test cards:** https://stripe.com/docs/testing

### Testing Flow

1. Start your development server: `npm run dev`
2. Log in to your app
3. Click **Subscribe Now** on the dashboard
4. You should be redirected to Stripe Checkout
5. Use a test card to complete payment
6. After successful payment, you should be redirected back to your dashboard
7. Verify:
   - Your subscription shows as **Active** in the dashboard
   - The `user_subscriptions` table in Supabase has a new record
   - You can access the calculator (no paywall)
   - The **Manage Billing** button works

### Test Webhook Events

While testing, monitor webhook events in your Stripe Dashboard:

1. Navigate to **Developers → Webhooks**
2. Click on your webhook endpoint
3. View the **Recent events** tab to see incoming webhook calls
4. Check for any failures and investigate errors

## Step 9: Go Live

When you're ready to accept real payments:

1. Complete your Stripe account activation (provide business details, banking info, etc.)
2. Switch to **Live mode** in Stripe Dashboard
3. Create a new product/price in Live mode (or use the existing one)
4. Get your **Live API keys** from **Developers → API keys**
5. Update environment variables in Vercel with Live keys:
   - `STRIPE_SECRET_KEY=sk_live_...`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...`
   - `STRIPE_PRICE_ID=price_live_...`
6. Create a new webhook endpoint for production URL
7. Update `STRIPE_WEBHOOK_SECRET` with the Live webhook secret
8. Test the entire flow with a real card (you can refund yourself afterward)

## Troubleshooting

### "No subscription found" even after successful payment

- Check Stripe Dashboard → Webhooks for failed webhook deliveries
- Verify `STRIPE_WEBHOOK_SECRET` is correct
- Check Supabase logs for errors
- Ensure RLS policies allow the webhook service role to write to `user_subscriptions`

### "Webhook signature verification failed"

- Verify `STRIPE_WEBHOOK_SECRET` matches the webhook endpoint's signing secret
- Make sure you're using the correct secret for test/live mode
- Check that the webhook URL is correct

### TypeScript errors

- Run `npm install` to ensure all dependencies are installed
- Run `npx tsc --noEmit` to check for type errors

### Subscription not showing as active

- Check the `user_subscriptions` table in Supabase
- Verify the `status` column is 'active' or 'trialing'
- Check that the `user_id` matches the authenticated user

## Security Checklist

Before going live, verify:

- [ ] `STRIPE_SECRET_KEY` is never exposed client-side
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is never exposed client-side
- [ ] `STRIPE_WEBHOOK_SECRET` is never exposed client-side
- [ ] Webhook signature verification is enabled
- [ ] RLS policies are enabled on `user_subscriptions` table
- [ ] Environment variables are set in Vercel (not just locally)
- [ ] Test mode keys are replaced with live keys in production
- [ ] HTTPS is enabled (Vercel does this automatically)

## Support

If you encounter issues:

1. Check the Stripe Dashboard for webhook events and errors
2. Check Supabase logs for database errors
3. Check browser console for client-side errors
4. Check Vercel logs for server-side errors
5. Review Stripe documentation: https://stripe.com/docs
