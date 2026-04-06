import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
const { email } = body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  // Check if email already used a free trial
  const { data: existing } = await supabase
    .from('free_trials')
    .select('email')
    .eq('email', email.toLowerCase())
    .single();

  if (existing) {
    return res.status(400).json({ error: 'Free trial already used for this email.' });
  }

  // Generate code and insert into both tables
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();

  await supabase.from('free_trials').insert({ email: email.toLowerCase() });
  await supabase.from('sessions').insert({
    code,
    email: email.toLowerCase(),
    sessions_total: 1,
    sessions_used: 0,
    is_free_trial: true
  });

  // Send email
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: 'Plumlo <hello@plumlo.com>',
    to: email,
    subject: 'Your Free Plumlo Trial',
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="margin:0;padding:0;background:#0f0a1a;font-family:'Segoe UI',sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0a1a;padding:40px 20px;">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
              <tr><td style="padding-bottom:32px;text-align:center;">
                <span style="font-size:2rem;font-weight:800;color:#c084fc;letter-spacing:-1px;">plumlo</span>
              </td></tr>
              <tr><td style="background:#1a1028;border:1px solid #3b1f6a;border-radius:16px;padding:40px;">
                <h1 style="color:#e9d5ff;font-size:1.4rem;margin:0 0 16px;">Your free trial is ready.</h1>
                <p style="color:#a78bca;font-size:0.95rem;line-height:1.6;margin:0 0 32px;">
                  Practice one full interview with Alex. Use the code below to get started.
                </p>
                <div style="background:#0f0a1a;border:1px solid #7c3aed;border-radius:12px;padding:24px;text-align:center;margin-bottom:32px;">
                  <div style="font-size:2.2rem;font-weight:800;color:#c084fc;letter-spacing:6px;">${code}</div>
                  <div style="color:#5b4070;font-size:0.8rem;margin-top:8px;">1 session included</div>
                </div>
                <div style="text-align:center;margin-bottom:32px;">
                  <a href="https://www.plumlo.com/app.html" style="display:inline-block;background:#7c3aed;color:#fff;font-weight:700;font-size:1rem;padding:16px 32px;border-radius:10px;text-decoration:none;">
                    Start Your Interview →
                  </a>
                </div>
                <p style="color:#5b4070;font-size:0.82rem;line-height:1.6;margin:0;">
                  Paste your code when prompted. Questions? Reply to this email.
                </p>
              </td></tr>
              <tr><td style="padding-top:24px;text-align:center;">
                <p style="color:#3b2a5a;font-size:0.75rem;margin:0;">© 2026 Plumlo. All rights reserved.</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `
  });

  return res.status(200).json({ success: true });
}
