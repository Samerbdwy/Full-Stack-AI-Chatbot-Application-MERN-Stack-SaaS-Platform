import Stripe from "stripe";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";

export const stripeWebhooks = async (req, res) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const { transactionId, appId } = session.metadata;

        if (appId !== "quickgpt1") {
          console.log("Ignored event: Invalid app");
          return res.json({ received: true });
        }

        const transaction = await Transaction.findOne({
          _id: transactionId,
          isPaid: false,
        });

        if (!transaction) {
          console.log("Transaction already processed or not found");
          return res.json({ received: true });
        }

        // Update user credits
        await User.updateOne(
          { _id: transaction.userId },
          { $inc: { credits: transaction.credits } }
        );

        // Mark transaction as paid
        transaction.isPaid = true;
        await transaction.save();

        console.log(`Credits updated for user ${transaction.userId}`);
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).send("Internal Server Error");
  }
};
