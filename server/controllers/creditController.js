import Transaction from "../models/Transaction.js";
import Stripe from "stripe";
import User from "../models/User.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const plans = [
  {
    _id: "basic",
    name: "Basic",
    price: 10,
    credits: 100,
    features: [
      "100 text generations",
      "50 image generations",
      "Standard support",
      "Access to basic models",
    ],
  },
  {
    _id: "pro",
    name: "Pro",
    price: 20,
    credits: 500,
    features: [
      "500 text generations",
      "200 image generations",
      "Priority support",
      "Access to pro models",
      "Faster response time",
    ],
  },
  {
    _id: "premium",
    name: "Premium",
    price: 30,
    credits: 1000,
    features: [
      "1000 text generations",
      "500 image generations",
      "24/7 VIP support",
      "Access to premium models",
      "Dedicated account manager",
    ],
  },
];

// GET PLANS
export const getPlans = async (req, res) => {
  try {
    res.json({ success: true, plans });
  } catch (error) {
    console.error("Get Plans Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PURCHASE PLAN - Match frontend endpoint
export const purchasePlan = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user._id;

    console.log("🔵 [PAYMENT] Starting purchase for plan:", planId, "user:", userId);

    const plan = plans.find((p) => p._id === planId);
    if (!plan) {
      return res.status(400).json({ success: false, message: "Invalid plan selected" });
    }

    // Create a new transaction
    const transaction = await Transaction.create({
      userId,
      planId: plan._id,
      amount: plan.price,
      credits: plan.credits,
      isPaid: false,
    });

    const origin = req.headers.origin || "http://localhost:5173";

    console.log("🔵 [PAYMENT] Creating Stripe session...");

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { 
              name: plan.name,
              description: `${plan.credits} credits for QuickGPT`
            },
            unit_amount: plan.price * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/credits?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/credits?canceled=true`,
      metadata: {
        transactionId: transaction._id.toString(),
        userId: userId.toString(),
        appId: "quickgpt1",
      },
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes
    });

    // Update transaction with session ID
    transaction.sessionId = session.id;
    await transaction.save();

    console.log("✅ [PAYMENT] Stripe session created:", session.id);

    res.json({ success: true, url: session.url });
  } catch (error) {
    console.error("❌ [PAYMENT] Purchase Plan Error:", error.message);
    res.status(500).json({ success: false, message: "Payment initialization failed: " + error.message });
  }
};

// VERIFY PAYMENT - Match frontend
export const verifyPayment = async (req, res) => {
  try {
    const { session_id } = req.query;

    console.log("🔵 [VERIFY] Verifying payment for session:", session_id);

    if (!session_id) {
      return res.status(400).json({ success: false, message: "Session ID is required" });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);
    console.log("🔵 [VERIFY] Session details:", {
      id: session.id,
      payment_status: session.payment_status,
      status: session.status,
      metadata: session.metadata
    });

    // Check if payment is completed
    if (session.payment_status === 'paid' && session.status === 'complete') {
      // Find transaction by session ID
      const transaction = await Transaction.findOne({ sessionId: session_id });
      
      if (!transaction) {
        console.log("❌ [VERIFY] Transaction not found for session:", session_id);
        return res.status(404).json({ success: false, message: "Transaction not found" });
      }

      if (transaction.isPaid) {
        console.log("ℹ️ [VERIFY] Transaction already processed");
        const user = await User.findById(transaction.userId);
        return res.json({ 
          success: true, 
          message: "Payment already verified", 
          credits: user?.credits 
        });
      }

      // Update user credits
      const user = await User.findById(transaction.userId);
      if (!user) {
        console.log("❌ [VERIFY] User not found:", transaction.userId);
        return res.status(404).json({ success: false, message: "User not found" });
      }

      // Add credits to user
      const oldCredits = user.credits;
      user.credits += transaction.credits;
      await user.save();

      // Mark transaction as paid
      transaction.isPaid = true;
      await transaction.save();

      console.log("✅ [VERIFY] Payment verified successfully.");
      console.log("💰 [VERIFY] Credits updated:", {
        user: user.email,
        oldCredits,
        added: transaction.credits,
        newCredits: user.credits
      });

      return res.json({ 
        success: true, 
        message: "Payment verified successfully",
        credits: user.credits,
        addedCredits: transaction.credits,
        transactionId: transaction._id
      });
    }

    console.log("❌ [VERIFY] Payment not completed, status:", session.payment_status);
    res.json({ 
      success: false, 
      message: `Payment not completed. Status: ${session.payment_status}` 
    });
  } catch (error) {
    console.error("❌ [VERIFY] Verify Payment Error:", error.message);
    res.status(500).json({ 
      success: false, 
      message: "Payment verification failed: " + error.message 
    });
  }
};