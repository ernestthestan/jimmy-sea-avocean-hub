export interface TranslationLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const TRANSLATION_LANGUAGES: TranslationLanguage[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文', flag: '🇨🇳' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文', flag: '🇹🇼' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'tl', name: 'Filipino / Tagalog', nativeName: 'Tagalog', flag: '🇵🇭' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' }
];

export interface TranslateParams {
  text: string;
  targetLang: string;
  targetLangName?: string;
}

/**
 * Checks if a response from MyMemory is an error message instead of an actual translation
 */
function isInvalidTranslationResult(candidate: unknown): boolean {
  if (!candidate || typeof candidate !== 'string') return true;
  const upper = candidate.toUpperCase().trim();
  if (upper.includes('QUERY LENGTH LIMIT')) return true;
  if (upper.startsWith('MYMEMORY WARNING')) return true;
  if (upper.includes('INVALID TARGET LANGUAGE')) return true;
  if (upper.includes('YOU HAVE USED ALL YOUR FREE QUOTA')) return true;
  if (upper.includes('PLEASE SELECT TWO DISTINCT LANGUAGES')) return true;
  if (upper.includes('IS NOT A VALID LANGUAGE')) return true;
  return false;
}

/**
 * Splits arbitrary text into small chunks (< 350 characters) respecting
 * paragraphs and sentence boundaries to strictly conform to external translation API limits.
 */
function splitTextIntoChunks(text: string, maxChunkLength = 350): string[] {
  if (text.length <= maxChunkLength) {
    return [text];
  }

  const chunks: string[] = [];
  const paragraphs = text.split(/\n+/);
  let current = '';

  for (const para of paragraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) continue;

    if ((current + '\n' + trimmedPara).trim().length <= maxChunkLength) {
      current = current ? `${current}\n${trimmedPara}` : trimmedPara;
    } else {
      if (current) {
        chunks.push(current);
        current = '';
      }

      if (trimmedPara.length <= maxChunkLength) {
        current = trimmedPara;
      } else {
        // Paragraph exceeds maxChunkLength: split by sentences (. ! ? or commas)
        const sentences = trimmedPara.match(/[^.!?\n]+[.!?\n]*/g) || [trimmedPara];
        let subChunk = '';
        for (const s of sentences) {
          const trimmedS = s.trim();
          if (!trimmedS) continue;

          if ((subChunk + ' ' + trimmedS).trim().length <= maxChunkLength) {
            subChunk = subChunk ? `${subChunk} ${trimmedS}` : trimmedS;
          } else {
            if (subChunk) {
              chunks.push(subChunk);
              subChunk = '';
            }

            if (trimmedS.length <= maxChunkLength) {
              subChunk = trimmedS;
            } else {
              // Hard slice if a single unbroken sentence is extraordinarily long
              for (let i = 0; i < trimmedS.length; i += maxChunkLength) {
                chunks.push(trimmedS.slice(i, i + maxChunkLength));
              }
            }
          }
        }
        if (subChunk) {
          chunks.push(subChunk);
        }
      }
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks.length > 0 ? chunks : [text];
}

/**
 * Translates a single small chunk (< 350 chars) via MyMemory API
 */
async function translateChunkMyMemory(chunk: string, targetLang: string): Promise<string | null> {
  try {
    const langCode = targetLang.split('-')[0].toLowerCase();
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      chunk
    )}&langpair=autodetect|${encodeURIComponent(langCode)}`;

    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    const candidate = data?.responseData?.translatedText;
    if (candidate && !isInvalidTranslationResult(candidate)) {
      return candidate.trim();
    }
  } catch {
    // Network or API failure
  }
  return null;
}

/**
 * Translates a single small chunk via Google GTX web translation endpoint
 */
async function translateChunkGTX(chunk: string, targetLang: string): Promise<string | null> {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(
      targetLang
    )}&dt=t&q=${encodeURIComponent(chunk)}`;

    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    if (Array.isArray(data) && Array.isArray(data[0])) {
      const translated = data[0].map((item: any) => item[0] || '').join('');
      if (translated && !isInvalidTranslationResult(translated)) {
        return translated.trim();
      }
    }
  } catch {
    // Fallback failure
  }
  return null;
}

/**
 * Main translation entry point supporting:
 * 1. Server-side Gemini 3.8 Flash AI translation endpoint (/api/translate)
 * 2. Intelligent chunked client-side fallback (< 350 chars per chunk) ensuring
 *    descriptions of any length never trigger QUERY LENGTH LIMIT errors on static deploys
 */
export async function translateText(
  paramOrText: TranslateParams | string,
  maybeTargetLang?: string,
  maybeTargetLangName?: string
): Promise<string> {
  let text = '';
  let targetLang = 'en';
  let targetLangName = 'English';

  if (typeof paramOrText === 'string') {
    text = paramOrText;
    targetLang = maybeTargetLang || 'en';
    targetLangName =
      maybeTargetLangName ||
      TRANSLATION_LANGUAGES.find((l) => l.code === targetLang)?.name ||
      targetLang;
  } else {
    text = paramOrText.text;
    targetLang = paramOrText.targetLang || 'en';
    targetLangName =
      paramOrText.targetLangName ||
      TRANSLATION_LANGUAGES.find((l) => l.code === targetLang)?.name ||
      targetLang;
  }

  const trimmed = text.trim();
  if (!trimmed) return '';

  // 1. Try server-side Gemini 3.8 Flash AI endpoint first (if full-stack server is running)
  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: trimmed,
        targetLang,
        targetLangName
      })
    });

    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data.translation && typeof data.translation === 'string' && data.translation.trim()) {
          return data.translation.trim();
        }
      }
    }
  } catch {
    // Backend endpoint offline or not running (e.g. static Cloudflare Workers deploy)
  }

  // 2. Client-side Chunked Translation
  // Chunking ensures we never exceed the 500 character limitation on public machine translation endpoints
  const chunks = splitTextIntoChunks(trimmed, 350);

  const translatedChunks: string[] = [];
  for (const chunk of chunks) {
    // Try MyMemory for this chunk
    let chunkResult = await translateChunkMyMemory(chunk, targetLang);

    // If MyMemory failed or had an error, try Google GTX fallback
    if (!chunkResult) {
      chunkResult = await translateChunkGTX(chunk, targetLang);
    }

    // If both failed, retain original chunk text so translation remains intact
    translatedChunks.push(chunkResult || chunk);
  }

  const finalResult = translatedChunks.join('\n\n').trim();
  if (finalResult && !isInvalidTranslationResult(finalResult)) {
    return finalResult;
  }

  throw new Error(`Unable to translate description to ${targetLangName}. Please try again.`);
}
