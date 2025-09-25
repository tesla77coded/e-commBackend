import Stripe from 'stripe';
import Order from '../models/orderModel.js'
import Product from '../models/productModel.js';
import mongoose from 'mongoose';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// helper function because stripe asks for lowest currency unit
function amountInPaiseFromOrder(order) {
  const rupees = (order.totalPrice != null) ? Number(order.totalPrice) : null;
  if (rupees == null) throw new Error('Order totalPrice missing');
  return Math.round(rupees * 100);
}

// checkout session  POST /api/stripe/create-checkout-session
export const createCheckoutSession = async (req, res) => {
  try {
    const { mongoOrderId, items, orderId } = req.body;

    let order;
    if (mongoOrderId) {
      order = await Order.findById(mongoOrderId);
      if (!order) return res.status(404).json({ error: 'Order not found' });
    } else {
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'items required to create order' });
      }

      const productIds = items.map(it => it.product);
      const products = await Product.find({ _id: { $in: productIds } }).lean();

      const orderItems = items.map(it => {
        const prod = products.find(p => p._id.toString() === it.product.toString());
        if (!prod) throw new Error(`Product not found: ${it.product}`);
        return {
          product: prod._id,
          name: prod.name,
          image: prod.image,
          price: prod.price,
          qty: it.qty || 1,
        };
      });

      const totalRupees = orderItems.reduce((acc, it) => acc + (it.price * it.qty), 0);

      order = await Order.create({
        orderId: orderId || `order_${Date.now()}`,
        user: req.body.user || null,
        orderItems,
        shippingAddress: req.body.shippingAddress || {},
        itemPrice: totalRupees,
        totalPrice: totalRupees,
        currency: 'INR',
        isPaid: false,
        paymentResult: { status: 'created' },
      });
    }

    const amount = amountInPaiseFromOrder(order); // paise


    // line_items for checkout from orderItems 
    const line_items = (order.orderItems || []).map(i => ({
      price_data: {
        currency: 'inr',
        product_data: { name: i.name || `Product ${i.product}` },
        unit_amount: Math.round((i.price || 0) * 100),
      },
      quantity: i.qty || 1,
    }));

    //
    // create checkout session; you can add payment_method_types
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: line_items.length ? line_items : [{
        price_data: {
          currency: 'inr',
          product_data: { name: `Order ${order.orderId}` },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      metadata: { orderId: order.orderId, mongoOrderId: order._id.toString() },
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
    });

    // save session id for idempotency and later verification
    order.stripeSessionId = session.id;
    order.paymentResult = { status: 'pending' };
    await order.save();

    return res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('createCheckoutSession error:', err);
    return res.status(500).json({ error: 'Could not create checkout session' });
  }
};



// webhook handler — expects raw body(express.raw middleware).
// verifies signature and later to finalizeOrderPayment.

export const stripeWebhookHandler = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;


  if (process.env.NODE_ENV === 'test') {
    try {
      if (req.body == null) {
        event = {};
      } else if (Buffer.isBuffer(req.body)) {
        event = JSON.parse(req.body.toString());
      } else if (typeof req.body === 'string') {
        event = JSON.parse(req.body);
      } else {
        // already parsed object
        event = req.body;
      }
    } catch (err) {
      console.error('Failed to parse webhook body in test mode:', err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  } else {
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
  // handle relevant events
  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const metadata = paymentIntent.metadata || {};
        await finalizeOrderPayment({ paymentIntentId: paymentIntent.id, metadata, rawEvent: paymentIntent });
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object;

        const piId = session.payment_intent;
        const metadata = session.metadata || {};
        await finalizeOrderPayment({ paymentIntentId: piId, metadata, rawEvent: session });
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const metadata = paymentIntent.metadata || {};
        await markOrderFailed({ paymentIntentId: paymentIntent.id, metadata, rawEvent: paymentIntent });
        break;
      }

      default:
        console.log(`Unhandled stripe event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Error handling webhook event:', err);
    return res.status(500).send('Webhook handler error');
  }
};


// Mark order as failed 
async function markOrderFailed({ paymentIntentId, metadata = {}, rawEvent = {} }) {
  const mongoOrderId = metadata.mongoOrderId || metadata.orderId;
  if (!mongoOrderId) return;

  await Order.findOneAndUpdate(
    { _id: mongoOrderId, isPaid: false },
    {
      $set: {
        paymentResult: {
          id: paymentIntentId,
          status: 'failed',
          update_time: new Date().toISOString(),
          raw: rawEvent,
        },
      },
    }
  );
}


// finalize payment: mark order paid, decrement stock.

async function finalizeOrderPayment({ paymentIntentId, metadata = {}, rawEvent = {} }) {
  const mongoOrderId = metadata.mongoOrderId || metadata.orderId;
  if (!mongoOrderId) {
    console.warn('No mongoOrderId in metadata; skipping finalizeOrderPayment');
    return;
  }

  const order = await Order.findById(mongoOrderId);
  if (!order) {
    console.warn('Order not found for finalizeOrderPayment:', mongoOrderId);
    return;
  }

  if (order.isPaid && order.stripePaymentIntentId === paymentIntentId) {
    console.log('Order already marked paid:', mongoOrderId);
    return;
  }

  const session = await mongoose.startSession().catch(() => null);

  if (session) {
    try {
      session.startTransaction();

      const orderInTx = await Order.findById(mongoOrderId).session(session);
      if (!orderInTx) {
        console.warn('Order disappeared in transaction:', mongoOrderId);
        await session.abortTransaction();
        session.endSession();
        return;
      }

      if (orderInTx.isPaid) {
        console.log('Order already paid inside transaction:', mongoOrderId);
        await session.commitTransaction();
        session.endSession();
        return;
      }

      // decrement stock for each item 
      if (orderInTx.orderItems && orderInTx.orderItems.length) {
        for (const it of orderInTx.orderItems) {
          try {
            const updateRes = await Product.updateOne(
              { _id: it.product, countInStock: { $gte: it.qty } },
              { $inc: { countInStock: -it.qty } },
              { session }
            );
            if (updateRes.modifiedCount === 0) {
              console.warn(`Could not decrement stock for product ${it.product} qty ${it.qty}`);
            }
          } catch (err) {
            console.warn('Product decrement failed (tx):', err);
          }
        }
      }

      // mark order paid
      orderInTx.isPaid = true;
      orderInTx.paidAt = new Date();
      orderInTx.stripePaymentIntentId = paymentIntentId;
      orderInTx.paymentResult = {
        id: paymentIntentId,
        status: 'paid',
        update_time: new Date().toISOString(),
        raw: rawEvent,
      };
      orderInTx.status = 'paid';

      await orderInTx.save({ session });

      await session.commitTransaction();
      session.endSession();
      console.log('Order finalized transactionally:', mongoOrderId);
      return;
    } catch (err) {
      console.error('Transaction finalizeOrderPayment failed, aborting:', err);
      try { await session.abortTransaction(); } catch (e) { /* ignore */ }
      session.endSession();
    }
  }

  // non-transactional fallback

  try {
    const orderDoc = await Order.findById(mongoOrderId);

    if (!orderDoc) {
      console.log('Order not found in non-transaction path:', mongoOrderId);
      return;
    }

    if (orderDoc.isPaid) {
      console.log('Order already marked paid (non-transaction):', mongoOrderId);
      return;
    }

    orderDoc.isPaid = true;
    orderDoc.paidAt = new Date();
    orderDoc.stripePaymentIntentId = paymentIntentId;
    orderDoc.paymentResult = {
      id: paymentIntentId,
      status: 'paid',
      update_time: new Date().toISOString(),
      raw: rawEvent,
    };
    orderDoc.status = 'paid';

    const saved = await orderDoc.save();

    if (saved.orderItems && saved.orderItems.length) {
      for (const it of saved.orderItems) {
        try {
          const res = await Product.updateOne(
            { _id: it.product, countInStock: { $gte: it.qty } },
            { $inc: { countInStock: -it.qty } }
          );
          if (res.modifiedCount === 0) {
            console.warn(`Could not decrement stock for product ${it.product} qty ${it.qty} (non-tx)`);
          }
        } catch (err) {
          console.warn('Product decrement failed (non-tx):', err);
        }
      }
    }

    console.log('Order finalized (non-transaction direct-save):', mongoOrderId);
  } catch (err) {
    console.error('finalizeOrderPayment non-transaction direct-save failed:', err);
  }
}

export default {
  createCheckoutSession,
  stripeWebhookHandler,
};
