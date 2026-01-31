import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "No signature provided" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  // Handle the event
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

/**
 * Handle successful checkout session completion
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const supabase = createServiceClient();

  // Get subscription details
  const subscriptionId = session.subscription as string;
  if (!subscriptionId) {
    console.error("No subscription ID in checkout session");
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = session.metadata?.supabase_user_id;

  if (!userId) {
    console.error("No user ID in session metadata");
    return;
  }

  // IDEMPOTENCY CHECK: Check if this webhook was already processed
  // by looking for existing subscription_id
  const { data: existing } = await supabase
    .from("user_subscriptions")
    .select("id, stripe_subscription_id")
    .eq("stripe_subscription_id", subscriptionId)
    .single();

  // If subscription already exists with this ID, skip processing (idempotency)
  if (existing?.stripe_subscription_id === subscriptionId) {
    console.log(`Subscription ${subscriptionId} already processed, skipping (idempotent)`);
    return;
  }

  // Check if user has a subscription record (for updating vs creating)
  const { data: userSubscription } = await supabase
    .from("user_subscriptions")
    .select("id")
    .eq("user_id", userId)
    .single();

  // Type cast to access properties safely
  const sub = subscription as any;
  const periodStart = sub.current_period_start;
  const periodEnd = sub.current_period_end;

  if (userSubscription) {
    // Update existing record for this user
    const { error } = await supabase
      .from("user_subscriptions")
      .update({
        stripe_customer_id: sub.customer as string,
        stripe_subscription_id: sub.id,
        stripe_price_id: sub.items.data[0].price.id,
        status: sub.status,
        current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
        current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        cancel_at_period_end: sub.cancel_at_period_end,
      })
      .eq("user_id", userId);

    if (error) {
      console.error("Error updating subscription:", error);
    }
  } else {
    // Create new record
    const { error } = await supabase
      .from("user_subscriptions")
      .insert({
        user_id: userId,
        stripe_customer_id: sub.customer as string,
        stripe_subscription_id: sub.id,
        stripe_price_id: sub.items.data[0].price.id,
        status: sub.status,
        current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
        current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        cancel_at_period_end: sub.cancel_at_period_end,
      });

    if (error) {
      console.error("Error creating subscription:", error);
    }
  }

  // SYNC TO ENTITLEMENTS TABLE
  // Determine entitlement status based on Stripe subscription status
  const entitlementStatus = 
    sub.status === "active" || sub.status === "trialing" ? "active" : "inactive";

  const { error: entitlementError } = await supabase
    .from("user_entitlements")
    .upsert(
      {
        user_id: userId,
        source: "stripe",
        status: entitlementStatus,
        expires_at: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        metadata: {
          stripe_subscription_id: sub.id,
          stripe_customer_id: sub.customer,
          stripe_price_id: sub.items.data[0].price.id,
        },
      },
      { onConflict: "user_id" }
    );

  if (entitlementError) {
    console.error("Error syncing entitlement:", entitlementError);
  }
}

/**
 * Handle subscription updates (renewals, plan changes, etc.)
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const supabase = createServiceClient();

  // Type cast to access properties safely
  const sub = subscription as any;
  const periodStart = sub.current_period_start;
  const periodEnd = sub.current_period_end;

  // IDEMPOTENCY: Check if subscription exists before updating
  const { data: existing } = await supabase
    .from("user_subscriptions")
    .select("id, updated_at, user_id")
    .eq("stripe_subscription_id", sub.id)
    .single();

  if (!existing) {
    console.error(`Subscription ${sub.id} not found for update, skipping`);
    return;
  }

  const { error } = await supabase
    .from("user_subscriptions")
    .update({
      status: sub.status,
      stripe_price_id: sub.items.data[0].price.id,
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: sub.cancel_at_period_end,
    })
    .eq("stripe_subscription_id", sub.id);

  if (error) {
    console.error("Error updating subscription:", error);
  }

  // SYNC TO ENTITLEMENTS TABLE
  // Determine entitlement status based on Stripe subscription status
  const entitlementStatus = 
    sub.status === "active" || sub.status === "trialing" ? "active" : "inactive";

  const { error: entitlementError } = await supabase
    .from("user_entitlements")
    .upsert(
      {
        user_id: existing.user_id,
        source: "stripe",
        status: entitlementStatus,
        expires_at: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        metadata: {
          stripe_subscription_id: sub.id,
          stripe_customer_id: sub.customer,
          stripe_price_id: sub.items.data[0].price.id,
        },
      },
      { onConflict: "user_id" }
    );

  if (entitlementError) {
    console.error("Error syncing entitlement:", entitlementError);
  }
}

/**
 * Handle subscription deletion/cancellation
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const supabase = createServiceClient();

  // IDEMPOTENCY: Check if subscription exists and is not already canceled
  const { data: existing } = await supabase
    .from("user_subscriptions")
    .select("id, status, user_id")
    .eq("stripe_subscription_id", subscription.id)
    .single();

  if (!existing) {
    console.error(`Subscription ${subscription.id} not found for deletion, skipping`);
    return;
  }

  if (existing.status === "canceled") {
    console.log(`Subscription ${subscription.id} already canceled, skipping (idempotent)`);
    return;
  }

  const { error } = await supabase
    .from("user_subscriptions")
    .update({
      status: "canceled",
    })
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    console.error("Error marking subscription as canceled:", error);
  }

  // SYNC TO ENTITLEMENTS TABLE
  // Set entitlement to inactive when subscription is canceled
  const { error: entitlementError } = await supabase
    .from("user_entitlements")
    .update({
      status: "inactive",
    })
    .eq("user_id", existing.user_id)
    .eq("source", "stripe");

  if (entitlementError) {
    console.error("Error syncing entitlement cancellation:", entitlementError);
  }
}

/**
 * Handle failed invoice payments
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const supabase = createServiceClient();

  // Type cast to access subscription property safely
  const inv = invoice as any;
  const subscriptionId = typeof inv.subscription === 'string' 
    ? inv.subscription 
    : inv.subscription?.id;
    
  if (!subscriptionId) {
    return;
  }

  // IDEMPOTENCY: Check if subscription exists and is not already past_due
  const { data: existing } = await supabase
    .from("user_subscriptions")
    .select("id, status, user_id")
    .eq("stripe_subscription_id", subscriptionId)
    .single();

  if (!existing) {
    console.error(`Subscription ${subscriptionId} not found for payment failure update, skipping`);
    return;
  }

  if (existing.status === "past_due") {
    console.log(`Subscription ${subscriptionId} already marked past_due, skipping (idempotent)`);
    return;
  }

  const { error } = await supabase
    .from("user_subscriptions")
    .update({
      status: "past_due",
    })
    .eq("stripe_subscription_id", subscriptionId);

  if (error) {
    console.error("Error updating subscription status to past_due:", error);
  }

  // SYNC TO ENTITLEMENTS TABLE
  // Set entitlement to inactive when payment fails
  const { error: entitlementError } = await supabase
    .from("user_entitlements")
    .update({
      status: "inactive",
    })
    .eq("user_id", existing.user_id)
    .eq("source", "stripe");

  if (entitlementError) {
    console.error("Error syncing entitlement for payment failure:", entitlementError);
  }
}
