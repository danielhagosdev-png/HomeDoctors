/**
 * Home Doctors – Groq Proxy Server
 *
 * Sits between the React Native app and Groq's API so the API key
 * never lives in client-side code.
 *
 * Start:  npm start          (production)
 *         npm run dev        (auto-restart with nodemon)
 *
 * The app calls:  POST http://<your-ip>:3001/api/chat
 */

require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const Groq    = require('groq-sdk');

const app  = express();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─── Middleware ───────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '*').split(',').map(s => s.trim());

app.use(cors({
  origin: allowedOrigins.includes('*') ? '*' : (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) cb(null, true);
    else cb(new Error('Not allowed by CORS'));
  },
}));

app.use(express.json({ limit: '20kb' }));

// ─── System prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a helpful, cautious, and empathetic home health assistant for the "Home Doctors" mobile app.

Your role:
- Provide practical, evidence-based home remedy advice for common, non-emergency conditions.
- Explain causes, symptoms, and self-care steps in plain language.
- Always recommend when to seek professional medical care.
- Be concise: aim for 120–180 words per response. Use numbered lists and **bold** for key points.

Rules you MUST follow:
1. NEVER diagnose a medical condition.
2. NEVER recommend specific prescription medications or dosages.
3. ALWAYS add a brief note to consult a doctor when symptoms are severe, worsening, or affect a child/pregnant person.
4. If the question is not health-related, politely decline and offer to help with health topics.
5. If you are unsure, say so and advise seeing a doctor rather than guessing.

Tone: Warm, clear, and reassuring — like advice from a knowledgeable friend, not a formal medical report.`;

// ─── Rate limiting (simple in-memory) ────────────────────────────────────────
const requestCounts = new Map();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX       = 20;     // max requests per IP per minute

function checkRateLimit(ip) {
  const now  = Date.now();
  const entry = requestCounts.get(ip) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };

  if (now > entry.resetAt) {
    entry.count   = 0;
    entry.resetAt = now + RATE_LIMIT_WINDOW_MS;
  }

  entry.count++;
  requestCounts.set(ip, entry);
  return entry.count <= RATE_LIMIT_MAX;
}

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of requestCounts.entries()) {
    if (now > entry.resetAt) requestCounts.delete(ip);
  }
}, 300_000);

// ─── POST /api/chat ───────────────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

  // Rate limit
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment and try again.' });
  }

  const { messages } = req.body;

  // Validate
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required.' });
  }

  // Only allow 'user' and 'assistant' roles; strip anything else
  const safeMessages = messages
    .filter((m) => ['user', 'assistant'].includes(m.role) && typeof m.content === 'string')
    .slice(-10) // keep last 10 turns max
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1000) })); // cap content length

  if (safeMessages.length === 0 || safeMessages[safeMessages.length - 1].role !== 'user') {
    return res.status(400).json({ error: 'Last message must be from the user.' });
  }

  try {
    const completion = await groq.chat.completions.create({
      model:       'llama3-8b-8192',   // fast, free, high quality
      messages:    [{ role: 'system', content: SYSTEM_PROMPT }, ...safeMessages],
      max_tokens:  300,
      temperature: 0.5,
    });

    const reply = completion.choices?.[0]?.message?.content ?? '';
    if (!reply) throw new Error('Empty response from Groq');

    return res.json({ reply });

  } catch (err) {
    console.error('[Groq error]', err?.status, err?.message);

    if (err?.status === 429) {
      return res.status(429).json({ error: 'AI service is busy. Please try again in a moment.' });
    }
    if (err?.status === 401) {
      return res.status(500).json({ error: 'Server configuration error. Please contact support.' });
    }

    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '3001', 10);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅  Home Doctors proxy running on http://0.0.0.0:${PORT}`);
  console.log(`   Groq key: ${process.env.GROQ_API_KEY ? '***' + process.env.GROQ_API_KEY.slice(-4) : '❌ NOT SET'}`);
});
