export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'No code provided' });

  const supabase = (await import('@supabase/supabase-js')).createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  const cleanCode = code.trim();

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .ilike('code', cleanCode)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Invalid code' });
  if (data.sessions_used >= data.sessions_total) return res.status(403).json({ error: 'No sessions remaining' });

  await supabase
    .from('sessions')
    .update({ sessions_used: data.sessions_used + 1 })
    .eq('code', data.code);

  return res.status(200).json({
    success: true,
    remaining: data.sessions_total - data.sessions_used - 1,
    is_free_trial: data.is_free_trial || false
  });
}
