import { TRPCError } from "@trpc/server";
import Stripe from "stripe";
import { createTRPCRouter, protectedProcedure } from "../trpc";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2024-06-20",
  });
}

export const billingRouter = createTRPCRouter({
  createCheckoutSession: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user!.id;

    const user = await ctx.db.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        brokerage: {
          select: { id: true, stripeCustomerId: true, plan: true },
        },
      },
    });

    if (!user?.brokerage) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "No brokerage found for this account",
      });
    }

    if (user.brokerage.plan === "PRO") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Already on PRO plan",
      });
    }

    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    let customerId = user.brokerage.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { brokerageId: user.brokerage.id },
      });
      customerId = customer.id;
      await ctx.db.brokerage.update({
        where: { id: user.brokerage.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.STRIPE_PRO_PRICE_ID!,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/dashboard/settings/billing?success=1`,
      cancel_url: `${appUrl}/dashboard/settings/billing?cancelled=1`,
      metadata: { brokerageId: user.brokerage.id },
    });

    if (!session.url) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create checkout session",
      });
    }

    return { url: session.url };
  }),

  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user!.id },
      select: {
        brokerage: {
          select: { plan: true, stripeCustomerId: true },
        },
      },
    });

    return {
      plan: user?.brokerage?.plan ?? "FREE",
    };
  }),
});
