export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;
  const email = (req.body && req.body.email) ? String(req.body.email).trim() : '';
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
      );
    let query = supabase
    .from('sessions')
    .select('id')
    .eq('is_free_trial', true);
    if (email) {
      query = query.or(`ip_address.eq.${ip},email.ilike.${email}`);
    } else {
      query = query.eq('ip_address', ip);
    }
    const { data, error } = await query.limit(1);
    if (error) throw error;
    return res.status(200).json({ allowed: data.length === 0 });
  } catch (err) {
    console.error(err);
    return res.status(200).json({ allowed: true });
  }
}
