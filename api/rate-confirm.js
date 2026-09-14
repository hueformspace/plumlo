export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');
  const { id, r, feedback } = req.body;
  if (!id || !r) return res.status(400).send('Missing params');

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    const update = { reaction: r };
    if (feedback) update.feedback_text = feedback;
    await supabase.from('sessions').update(update).eq('id', id);

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="background:#080612;color:#f0eaff;font-family:-apple-system,sans-serif;display:flex;justify-content:center;padding:60px 20px;">
  <div style="max-width:400px;text-align:center;">
    <h1>Thanks, got it.</h1>
  </div>
</body></html>`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to save');
  }
}
