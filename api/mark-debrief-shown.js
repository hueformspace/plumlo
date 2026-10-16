import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { code, id, debrief } = req.body;
  if (!code && !id) return res.status(400).json({ error: 'Missing code or id' });
  const match = (q) => (id ? q.eq('id', id) : q.ilike('code', code));
  const update = { debrief_shown: true };
  if (debrief) {
    const { data: row } = await match(supabase.from('sessions').select('debrief')).limit(1).maybeSingle();
    const prior = row && row.debrief ? row.debrief + '\n\n----------\n\n' : '';
    update.debrief = prior + String(debrief).slice(0, 8000);
  }
  const { error } = await match(supabase.from('sessions').update(update));
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ ok: true });
}
