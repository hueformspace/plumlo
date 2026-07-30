export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    const { data, error } = await supabase
      .from('sessions')
      .select('id')
      .eq('is_free_trial', true)
      .eq('ip_address', ip)
      .limit(1);
    if (error) throw error;
    return res.status(200).json({ allowed: data.length === 0 });
  } catch (err) {
    console.error(err);
    return res.status(200).json({ allowed: true });
  }
}
