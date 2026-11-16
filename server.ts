import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Server-side Gemini AI Translation Route
app.post('/api/translate', async (req, res) => {
  try {
    const { text, lines, targetLang, targetLangName } = req.body;

    if ((!text || typeof text !== 'string') && (!Array.isArray(lines) || lines.length === 0)) {
      return res.status(400).json({ error: 'Text string or lines array is required' });
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

    // Preferred deterministic mode: translate an array of non-empty lines while client owns 100% of line breaks & spacing
    if (Array.isArray(lines) && lines.length > 0) {
      const sanitizedLines = lines.map((l: unknown) => (typeof l === 'string' ? l : String(l ?? '')));
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `You are an expert bilingual translator for Thai entertainment, GMMTV celebrity fandom, and international fan club events.
Translate each item in the input JSON string array into ${targetLangName || targetLang}, using the full array as shared context (for dates like Thai Buddhist year 69 = 2026, pronouns, and venue names).
CRITICAL RULES:
1. Return a JSON array of strings with the EXACT SAME number of items (${sanitizedLines.length}) in the exact same order.
2. Preserve artist names (such as Jimmy, Sea, Avocean, GMMTV), venue names, dates, and times accurately.
3. Preserve all placeholder tokens (such as __AVO_URL_0__), hashtags, social handles, emojis, and internal spacing around them EXACTLY without removing spaces or merging items.
4. Do NOT add or remove items, and do NOT include newlines inside an array item.
5. Make the translation natural, clear, and friendly for international fans.

Input lines JSON:
${JSON.stringify(sanitizedLines)}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
      });

      const rawJson = response.text?.trim() || '';
      try {
        const parsed = JSON.parse(rawJson);
        if (Array.isArray(parsed) && parsed.length === sanitizedLines.length) {
          return res.json({
            lines: parsed.map((item: unknown) => (typeof item === 'string' ? item : String(item ?? ''))),
          });
        }
      } catch {
        // Fall through to single-text mode if JSON parse fails
      }
      if (!text || typeof text !== 'string') {
        return res.status(502).json({ error: 'Structured translation count mismatch' });
      }
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `You are an expert bilingual translator for Thai entertainment, GMMTV celebrity fandom, and international fan club events.
Translate the following event notice/description into ${targetLangName || targetLang}.
Preserve artist names (such as Jimmy, Sea, Avocean, GMMTV), venue names, dates, and times accurately.
CRITICAL FORMATTING: Preserve ALL formatting and spacing EXACTLY as in the source text:
- Keep the exact same number of line breaks and blank lines (e.g. double newlines / empty lines between paragraphs).
- Keep all leading indentation, spaces after bullet points (-, •, numbers), and spaces around emojis, hashtags, and placeholder tokens like __AVO_URL_0__.
CRITICAL: Preserve all URLs, placeholder tokens (such as __AVO_URL_0__), registration links, web links, hashtags, and social handles EXACTLY as they appear without shortening, modifying, or removing adjacent spaces.
Make the translation natural, clear, and friendly for international fans.
Output ONLY the translated text, without commentary, markdown code fences, or explanations.

Text:
${text}`,
    });

    const translation = response.text?.replace(/^\r?\n+|\r?\n+$/g, '') || '';
    return res.json({ translation });
  } catch (error: any) {
    console.error('Server translation error:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to translate description',
    });
  }
});

// Security & Anti-cache middleware for mobile browsers (Samsung Internet / Chrome)
app.use((req, res, next) => {
  // Mobile security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Never allow caching of HTML, manifest, or application scripts
  if (
    req.path === '/' ||
    req.path.endsWith('.html') ||
    req.path.endsWith('.json') ||
    req.path.endsWith('.tsx') ||
    req.path.endsWith('.ts') ||
    req.path.endsWith('.jsx') ||
    req.path.endsWith('.js') ||
    req.path.includes('/src/') ||
    req.path.includes('/@vite/')
  ) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }
  next();
});

// App version endpoint for cross-device sync diagnostics
const BUILD_TIMESTAMP = Date.now().toString();
app.get('/api/version', (_req, res) => {
  res.json({ version: BUILD_TIMESTAMP, updated: new Date().toISOString() });
});

// Serve public static assets (including og-image.png, favicon, manifests)
app.use(express.static('public'));

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist', {
      setHeaders: (res, path) => {
        if (path.endsWith('.html') || path.endsWith('.json')) {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      }
    }));
    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
