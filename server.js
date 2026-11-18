import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const MODEL = process.env.OPENAI_MODEL || 'gpt-5.5';

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, aiConfigured: Boolean(process.env.OPENAI_API_KEY), model: MODEL });
});

app.post('/api/chat', async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ error: 'AI is not configured yet. Add OPENAI_API_KEY to the server environment.' });
    }
    const { messages, language } = req.body ?? {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Please send a question.' });
    }
    const safeMessages = messages.slice(-20).map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content ?? '').slice(0, 8000)
    }));
    const langInstruction = language === 'hi'
      ? 'Reply in clear, natural Hindi. Keep technical terms in English where useful.'
      : language === 'en'
        ? 'Reply in clear, accessible English.'
        : 'Reply in the language used by the student.';

    const upstream = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        instructions: `You are Gem, a helpful, careful AI study tutor for school, college, and competitive-exam learners. Answer a broad range of educational questions: mathematics, science, languages, history, geography, civics, reasoning, computers, and general knowledge. Explain concepts step by step when useful, adapt to the student's level, and give examples. For MCQs, clearly identify the correct option and explain why. If a question is ambiguous, ask a concise clarification. Do not invent facts, citations, exam dates, or current affairs; say when information may be outdated and recommend checking an authoritative current source. Be honest when uncertain. You may answer general non-study questions too, but prioritize education. ${langInstruction}`,
        input: safeMessages.map(m => ({ role: m.role, content: m.content }))
      })
    });
    const data = await upstream.json();
    if (!upstream.ok) {
      const message = data?.error?.message || `AI provider returned HTTP ${upstream.status}`;
      return res.status(upstream.status).json({ error: message });
    }
    const answer = data.output
      ?.filter(item => item.type === 'message')
      .flatMap(item => item.content || [])
      .filter(part => part.type === 'output_text')
      .map(part => part.text)
      .join('\n') || data.output_text || 'Sorry, I could not generate an answer. Please try again.';
    res.json({ answer });
  } catch (err) {
    console.error('Gem chat error:', err);
    res.status(500).json({ error: 'Something went wrong while contacting the AI. Please try again.' });
  }
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`Gem AI running at http://localhost:${port}`));
