export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { transcript, jobDescription, language } = req.body;
  if (!transcript || !jobDescription) {
    return res.status(400).json({ error: 'Missing transcript or jobDescription' });
  }
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `You are an expert interview coach. Score this interview based on the job description.

CRITICAL RULES:
- If the transcript is empty, blank, or contains no candidate responses, return a score of 0 and state that no interview was completed.
- If a question was not answered, score it 0 and mark it as unanswered. Do not infer or assume any positive qualities from silence or non-responses.
- Never award points for things that did not happen.
- If the transcript ends with a line starting "[Session note:", the candidate's final answer was cut off and not recorded. Do not mark that question as unanswered and do not score it 0. Say plainly once, near the top, that the session ended before that answer was recorded. Do not list it under What missed, do not call it unanswered, and do not lower the score for it. Score the recorded answers on their own merits, as if the interview had only those questions.
- Be honest even if the feedback is harsh.

JOB DESCRIPTION:
${jobDescription}

INTERVIEW TRANSCRIPT:
${transcript}

Provide a debrief with:
1. Overall score (0-100)
2. What landed well (3 bullet points — if nothing landed, say so)
3. What missed (3 bullet points)
4. What to fix for next time (3 bullet points)

Be specific, honest, and actionable. Format clearly.${language && language !== 'English' ? ' Respond entirely in ' + language + '.' : ''}`
        }]
      })
    });
    const data = await response.json();
    const debrief = data.content[0].text;
    return res.status(200).json({ debrief });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Scoring failed' });
  }
}
