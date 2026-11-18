import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    aiConfigured: Boolean(process.env.GROQ_API_KEY),
    provider: 'Groq',
    model: MODEL
  });
});

app.post('/api/chat', async (req, res) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(503).json({
        error: 'AI is not configured. Add GROQ_API_KEY to Render.'
      });
    }

    const { messages, language } = req.body ?? {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: 'Please send a question.'
      });
    }

    const langInstruction = language === 'hi'
      ? 'Reply in clear, natural Hindi.'
      : language === 'en'
      ? 'Reply in clear English.'
      : 'Reply in the language used by the student.';

    const safeMessages = messages.slice(-20).map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content ?? '').slice(0, 8000)
    }));

    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            {
              role: 'system',
              content: `You are Gem, a helpful AI study tutor.
              Help students with UPSC, SSC, Railway, Banking,
              State PCS, school and college subjects.
              Explain concepts clearly with examples.
              For MCQs, identify the correct option and explain it.
              Answer general knowledge and other questions too.
              Do not invent facts or current affairs.
              ${langInstruction}`
            },
            ...safeMessages
          ],
          temperature: 0.7,
          max_tokens: 1500
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Groq API error:', data);
      return res.status(response.status).json({
        error: data?.error?.message || 'Groq API request failed.'
      });
    }

    const answer = data.choices?.[0]?.message?.content;

    res.json({
      answer: answer || 'Sorry, please try again.'
    });

  } catch (err) {
    console.error('Gem chat error:', err);
    res.status(500).json({
      error: 'Something went wrong while contacting the AI.'
    });
  }
});

const port = Number(process.env.PORT || 3000);

app.listen(port, () => {
  console.log(`Gem AI running on port ${port}`);
});
