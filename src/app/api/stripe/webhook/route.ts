import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/server/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Stripe webhook signature verification failed:", message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const brokerageId = session.metadata?.brokerageId;
        if (brokerageId) {
          await db.brokerage.update({
            where: { id: brokerageId },
            data: {
              plan: "PRO",
              stripeCustomerId: session.customer as string,
            },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        await db.brokerage.updateMany({
          where: { stripeCustomerId: customerId },
          data: { plan: "FREE" },
        });
        break;
      }

      default:
        // Ignore unhandled events
        break;
    }
  } catch (err) {
    console.error("Error handling Stripe event:", err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}

// App Router reads the raw body via req.text() — no bodyParser config needed
