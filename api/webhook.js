import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const rawBody = await getRawBody(req);

  let event;
  try {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(rawBody);
    event = JSON.parse(rawBody.toString());
  } catch (err) {
    return res.status(400).json({ error: 'Webhook error' });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email = session.customer_details?.email;
    const amount = session.amount_total;
    const sessions_total = amount >= 4900 ? 10 : 2;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const supabase = (await import('@supabase/supabase-js')).createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    await supabase.from('sessions').insert({ code, email, sessions_total, sessions_used: 0 });

    console.log(`Code created: ${code} for ${email}`);
  }

  res.status(200).json({ received: true });
}

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
