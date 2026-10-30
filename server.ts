import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Server-side Gemini AI Translation Route
app.post('/api/translate', async (req, res) => {
  try {
    const { text, targetLang, targetLangName } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text string is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: 'GEMINI_API_KEY not configured on server' });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `You are an expert bilingual translator for Thai entertainment, GMMTV celebrity fandom, and international fan club events.
Translate the following event notice/description into ${targetLangName || targetLang}.
Preserve artist names (such as Jimmy, Sea, Avocean, GMMTV), venue names, dates, times, and line breaks accurately.
Make the translation natural, clear, and friendly for international fans.
Output ONLY the translated text, without commentary, markdown code fences, or explanations.

Text:
${text}`,
    });

    const translation = response.text?.trim() || '';
    return res.json({ translation });
  } catch (error: any) {
    console.error('Server translation error:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to translate description',
    });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
