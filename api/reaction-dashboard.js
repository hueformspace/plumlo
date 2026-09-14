export default async function handler(req, res) {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    const { data: rows, error } = await supabase
      .from('sessions')
      .select('email, reaction, feedback_text')
      .not('reaction', 'is', null);
    if (error) throw error;

    const counts = { loved: 0, liked: 0, okay: 0, not_great: 0, didnt_help: 0 };
    const feedback = [];
    for (const row of rows) {
      if (counts[row.reaction] !== undefined) counts[row.reaction]++;
      if (row.feedback_text) feedback.push({ email: row.email, reaction: row.reaction, text: row.feedback_text });
    }
    const labels = { loved: '😍 Loved it', liked: '🙂 Liked it', okay: '😐 Okay', not_great: '😕 Not great', didnt_help: '😞 Didn\'t help' };

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { background:#080612; color:#f0eaff; font-family:-apple-system,sans-serif; max-width:600px; margin:0 auto; padding:40px 20px; }
  h1 { font-size:1.4rem; margin-bottom:24px; }
  .row { display:flex; justify-content:space-between; background:#110d1f; border:1px solid #2a1a4a; border-radius:10px; padding:14px 18px; margin-bottom:8px; }
  .count { color:#c084fc; font-weight:700; }
  h2 { font-size:1.1rem; margin:32px 0 12px; color:#c084fc; }
  .fb { background:#110d1f; border:1px solid #2a1a4a; border-radius:10px; padding:14px 18px; margin-bottom:8px; font-size:0.9rem; }
  .fb .meta { color:#7c6a9a; font-size:0.75rem; margin-bottom:6px; }
</style></head>
<body>
  <h1>Reaction Dashboard</h1>
  ${Object.keys(labels).map(k => `<div class="row"><span>${labels[k]}</span><span class="count">${counts[k]}</span></div>`).join('')}
  <h2>Written feedback (${feedback.length})</h2>
  ${feedback.length === 0 ? '<p style="color:#7c6a9a;">None yet.</p>' : feedback.map(f => `<div class="fb"><div class="meta">${f.email} — ${labels[f.reaction]}</div>${f.text}</div>`).join('')}
</body></html>`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to load');
  }
}
