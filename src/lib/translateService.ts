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
 * Translates text into target language using:
 * 1. Server-side Gemini 3.8 Flash AI translation endpoint (/api/translate)
 * 2. High-availability client fallback for static hosts (e.g. Cloudflare Workers)
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

  // 1. Try server-side Gemini AI endpoint first
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
      const data = await res.json();
      if (data.translation && typeof data.translation === 'string' && data.translation.trim()) {
        return data.translation.trim();
      }
    }
  } catch {
    // Network or server endpoint offline, proceed to fallback
  }

  // 2. High-availability public machine translation fallback (works on Cloudflare Workers & static deploys)
  try {
    const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      trimmed
    )}&langpair=autodetect|${encodeURIComponent(targetLang.split('-')[0])}`;

    const res = await fetch(myMemoryUrl);
    if (res.ok) {
      const data = await res.json();
      const candidate = data?.responseData?.translatedText;
      if (candidate && typeof candidate === 'string' && candidate.trim() && !candidate.startsWith('MYMEMORY WARNING')) {
        return candidate.trim();
      }
    }
  } catch {
    // MyMemory fallback failed, try secondary fallback
  }

  // 3. Secondary client web fallback
  try {
    const fallbackUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(
      targetLang
    )}&dt=t&q=${encodeURIComponent(trimmed)}`;

    const res = await fetch(fallbackUrl);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const fullTranslation = data[0].map((chunk: any) => chunk[0] || '').join('');
        if (fullTranslation.trim()) {
          return fullTranslation.trim();
        }
      }
    }
  } catch {
    // Secondary fallback failed
  }

  throw new Error(`Unable to translate text to ${targetLangName}. Please try again.`);
}
