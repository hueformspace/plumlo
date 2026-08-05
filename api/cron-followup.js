export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    const now = new Date().toISOString();
    const { data: rows, error } = await supabase
      .from('sessions')
      .select('id, email')
      .eq('is_free_trial', true)
      .eq('sent_followup', false)
      .lte('send_after', now)
      .not('email', 'is', null);
    if (error) throw error;
    if (!rows || rows.length === 0) {
      return res.status(200).json({ sent: 0 });
    }
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    let sent = 0;
    for (const row of rows) {
      try {
        await resend.emails.send({
          from: 'Jason <hello@plumlo.com>',
          to: row.email,
          subject: 'practiced. ready.',
          html: `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #f0eaff; font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; }
  .email-shell { max-width: 480px; margin: 0 auto; border-radius: 16px; overflow: hidden; }
  .logo-band { background: #7c6a9a; padding: 26px 36px; text-align: center; }
  .logo-band .wordmark { font-size: 1.9rem; font-weight: 700; color: #f0eaff; letter-spacing: -1px; }
  .body-band { background: #110d1f; padding: 40px 36px 36px; }
  .body-band h1 { font-size: 2rem; font-weight: 700; color: #f0eaff; line-height: 1.1; letter-spacing: -0.5px; margin-bottom: 28px; }
  .body-band h1 span { color: #c084fc; }
  .body-band p { font-size: 0.95rem; color: #f0eaff; line-height: 1.9; margin-bottom: 16px; }
  .body-band p:last-child { margin-bottom: 0; }
  .sig-band { background: #7c6a9a; padding: 26px 36px; }
  .sig-band .name { font-size: 1rem; font-weight: 700; color: #f0eaff; margin-bottom: 6px; }
  .sig-band .meta { font-size: 0.78rem; color: #f0eaff; line-height: 1.9; opacity: 0.75; }
  .sig-band .tagline { font-size: 0.72rem; color: #f0eaff; margin-top: 8px; font-style: italic; opacity: 0.5; }
  .footer { background: #7c6a9a; padding: 14px 36px; text-align: center; border-top: 1px solid rgba(240,234,255,0.1); }
  .footer p { font-size: 0.68rem; color: #f0eaff; opacity: 0.4; }
</style>
</head>
<body>
<div class="email-shell">
  <div class="logo-band"><div class="wordmark">plumlo</div></div>
  <div class="body-band">
    <h1>practiced.<br><span>ready.</span></h1>
    <p>Hey, thanks for giving Plumlo a shot.</p>
    <p>Hope the debrief actually helped and showed you what landed and what to fix. That's the whole point. No more guessing.</p>
    <p>We're still building this out. Adding languages, tightening the scoring, making it better every week.</p>
    <p>If you want more practice before a real interview, Starter and Pro are both one-time, no subscription. We're around.</p>
  </div>
  <div class="sig-band">
    <div class="name">Jason</div>
    <div class="meta">Plumlo — plumlo.com</div>
    <div class="tagline">Practice with AI before AI interviews you.</div>
  </div>
  <div class="footer"><p>© 2026 Plumlo. All rights reserved.</p></div>
</div>
</body>
</html>`
        });
        await supabase
          .from('sessions')
          .update({ sent_followup: true })
          .eq('id', row.id);
        sent++;
      } catch (e) {
        console.error('Failed to send to', row.email, e);
      }
    }
    return res.status(200).json({ sent });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Cron failed' });
  }
}
