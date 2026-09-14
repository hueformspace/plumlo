export default async function handler(req, res) {
  const { id, r } = req.query;
  if (!id || !r) return res.status(400).send('Missing params');

  const labels = {
    didnt_help: "Didn't help",
    not_great: "Not great",
    okay: "Okay",
    liked: "Liked it",
    loved: "Loved it"
  };
  const label = labels[r] || r;
  const showFeedback = r !== 'loved' && r !== 'liked';

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { background:#080612; color:#f0eaff; font-family:-apple-system,sans-serif; display:flex; justify-content:center; padding:60px 20px; }
  .card { max-width:400px; background:#110d1f; border:1px solid #2a1a4a; border-radius:16px; padding:32px; text-align:center; }
  h1 { font-size:1.3rem; margin-bottom:20px; }
  textarea { width:100%; min-height:70px; margin-top:16px; padding:12px; background:#0f0a1a; border:1px solid #3b1f6a; border-radius:10px; color:#f0eaff; font-family:inherit; }
  button { margin-top:16px; padding:12px 28px; background:#9b5de5; color:#fff; border:none; border-radius:100px; font-size:0.95rem; cursor:pointer; }
</style></head>
<body>
  <div class="card">
    <h1>You said: ${label}</h1>
    <form method="POST" action="/api/rate-confirm">
      <input type="hidden" name="id" value="${id}">
      <input type="hidden" name="r" value="${r}">
      ${showFeedback ? '<textarea name="feedback" placeholder="What would make it better? (optional)"></textarea>' : ''}
      <br><button type="submit">Confirm</button>
    </form>
  </div>
</body></html>`);
}
