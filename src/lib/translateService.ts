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

const NO_SPACE_LANG_PREFIXES = new Set(['th', 'ja', 'zh', 'lo', 'km', 'my']);

function usesWordSpaces(targetLang: string): boolean {
  const lower = targetLang.toLowerCase();
  const prefix = lower.split('-')[0];
  return !NO_SPACE_LANG_PREFIXES.has(lower) && !NO_SPACE_LANG_PREFIXES.has(prefix);
}

/**
 * Checks if text has any translatable letters (ignoring URL placeholders, hashtags, and mentions)
 */
function hasTranslatableLetters(text: string): boolean {
  const stripped = text
    .replace(/__\s*AVO_URL_\d+\s*__/gi, '')
    .replace(/(^|\s)[#@][\p{L}\p{N}_-]+/gu, '$1');
  return /\p{L}/u.test(stripped);
}

interface LineSegment {
  text: string;
  hadTrailingSpace: boolean;
}

/**
 * Splits a single line (> maxLen) into chunks <= maxLen at whitespace or punctuation
 * boundaries, tracking whether the original split point had whitespace so spaces are
 * never lost or spuriously inserted when rejoining.
 */
function splitSingleLineIntoSegments(lineCore: string, maxLen = 350): LineSegment[] {
  if (lineCore.length <= maxLen) {
    return [{ text: lineCore, hadTrailingSpace: false }];
  }

  const segments: LineSegment[] = [];
  // Tokenize keeping exact whitespace runs so we preserve spacing decisions cleanly
  const tokens = lineCore.split(/(\s+)/);
  let current = '';

  const pushUnbrokenToken = (token: string, tokenHasTrailingSpace: boolean) => {
    let remaining = token;
    while (remaining.length > maxLen) {
      // Look for a natural punctuation/clause break within the second half of maxLen
      const slice = remaining.slice(0, maxLen);
      let breakIdx = -1;
      for (let i = slice.length - 1; i >= Math.floor(maxLen * 0.5); i--) {
        if (/[.!?,;:)\]/|]/.test(slice[i])) {
          breakIdx = i + 1;
          break;
        }
      }
      if (breakIdx <= 0) {
        breakIdx = maxLen;
      }
      segments.push({
        text: remaining.slice(0, breakIdx),
        hadTrailingSpace: false
      });
      remaining = remaining.slice(breakIdx);
    }
    if (remaining) {
      current = remaining;
      if (tokenHasTrailingSpace) {
        segments.push({ text: current, hadTrailingSpace: true });
        current = '';
      }
    }
  };

  for (let i = 0; i < tokens.length; i += 2) {
    const word = tokens[i] || '';
    const spaceAfter = tokens[i + 1] || '';
    if (!word) continue;

    if (!current) {
      if (word.length <= maxLen) {
        current = word;
      } else {
        pushUnbrokenToken(word, Boolean(spaceAfter));
        continue;
      }
    } else {
      // Previous word had a whitespace separator before this word
      const prevSpace = tokens[i - 1] || ' ';
      if (current.length + prevSpace.length + word.length <= maxLen) {
        current += prevSpace + word;
      } else {
        segments.push({ text: current, hadTrailingSpace: true });
        current = '';
        if (word.length <= maxLen) {
          current = word;
        } else {
          pushUnbrokenToken(word, Boolean(spaceAfter));
          continue;
        }
      }
    }
  }

  if (current) {
    segments.push({ text: current, hadTrailingSpace: false });
  }

  return segments.length > 0 ? segments : [{ text: lineCore, hadTrailingSpace: false }];
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
      let translated = '';
      let lastOrigHadSpace = false;
      const wordSpacedTarget = usesWordSpaces(targetLang);

      for (const item of data[0]) {
        const seg = typeof item?.[0] === 'string' ? item[0] : '';
        const origSeg = typeof item?.[1] === 'string' ? item[1] : '';
        if (!seg) continue;

        if (translated.length > 0 && !/\s$/.test(translated) && !/^\s/.test(seg)) {
          if (
            lastOrigHadSpace ||
            (wordSpacedTarget &&
              /[\p{L}\p{N}.!?)\]]$/u.test(translated) &&
              /^[\p{L}\p{N}(\[]/u.test(seg))
          ) {
            translated += ' ';
          }
        }
        translated += seg;
        lastOrigHadSpace = /\s$/.test(origSeg);
      }

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
 * Translates the non-whitespace core of a single line, chunking safely if > 350 chars
 */
async function translateSingleLineCore(core: string, targetLang: string): Promise<string> {
  const segments = splitSingleLineIntoSegments(core, 350);
  const wordSpacedTarget = usesWordSpaces(targetLang);
  const translatedPieces: string[] = [];

  for (const seg of segments) {
    if (!hasTranslatableLetters(seg.text)) {
      translatedPieces.push(seg.text);
      continue;
    }

    let result = await translateChunkMyMemory(seg.text, targetLang);
    if (!result) {
      result = await translateChunkGTX(seg.text, targetLang);
    }
    translatedPieces.push(result || seg.text);
  }

  let joined = '';
  for (let i = 0; i < translatedPieces.length; i++) {
    const piece = translatedPieces[i];
    if (i === 0) {
      joined = piece;
      continue;
    }

    const prevSeg = segments[i - 1];
    const boundaryAlreadyHasSpace = /\s$/.test(joined) || /^\s/.test(piece);
    if (!boundaryAlreadyHasSpace) {
      if (prevSeg.hadTrailingSpace) {
        joined += ' ';
      } else if (
        wordSpacedTarget &&
        /[\p{L}\p{N}.!?,;)\]]$/u.test(joined) &&
        /^[\p{L}\p{N}(\[]/u.test(piece)
      ) {
        joined += ' ';
      }
    }
    joined += piece;
  }

  return joined;
}

/**
 * Translates a single full line while preserving its leading indentation,
 * bullet/list prefix + spacing, and trailing whitespace verbatim.
 */
async function translateLinePreservingStructure(
  line: string,
  targetLang: string,
  lineCache: Map<string, string>
): Promise<string> {
  // Preserve blank or whitespace-only lines verbatim
  if (!line.trim()) return line;

  const cached = lineCache.get(line);
  if (cached !== undefined) return cached;

  const match = line.match(/^([ \t]*)((?:[-•*▪▫◦–—]+\s+|\d+[.)]\s+)?)(.*?)([ \t]*)$/);
  if (!match) return line;

  const [, leadingWs, bulletPrefix, core, trailingWs] = match;

  if (!core || !hasTranslatableLetters(core)) {
    lineCache.set(line, line);
    return line;
  }

  let translatedCore = await translateSingleLineCore(core, targetLang);

  // Guard against translators accidentally stripping a space right after a leading symbol/emoji
  const leadingSymbolGapMatch = core.match(/^([^\p{L}\p{N}\s(\["'#_]+)(\s+)([\p{L}\p{N}])/u);
  if (leadingSymbolGapMatch) {
    const symbol = leadingSymbolGapMatch[1];
    const gap = leadingSymbolGapMatch[2];
    if (
      translatedCore.startsWith(symbol) &&
      translatedCore.length > symbol.length &&
      !/^\s/.test(translatedCore.slice(symbol.length))
    ) {
      translatedCore = `${symbol}${gap}${translatedCore.slice(symbol.length)}`;
    }
  }

  const finalLine = `${leadingWs}${bulletPrefix}${translatedCore}${trailingWs}`;
  lineCache.set(line, finalLine);
  return finalLine;
}

/**
 * Extracts and replaces URLs with safe placeholder tokens so translation
 * APIs cannot corrupt, translate, or strip query parameters/paths from URLs.
 */
function protectUrls(text: string): { protectedText: string; urlMap: Map<string, string> } {
  const urlMap = new Map<string, string>();
  let tokenIndex = 0;

  // Regex matching http/https URLs and common bare URLs
  const urlRegex = /(https?:\/\/[^\s<>"'{}|\\^`]+|(?:www\.|bit\.ly\/|register\.[a-z0-9.-]+)[^\s<>"'{}|\\^`]*)/gi;

  const protectedText = text.replace(urlRegex, (match) => {
    // Trim trailing punctuation that belongs to sentence structure rather than the URL
    const trailingPunctMatch = match.match(/[.,)>\];]+$/);
    const trailingPunct = trailingPunctMatch ? trailingPunctMatch[0] : '';
    const cleanUrl = match.slice(0, match.length - trailingPunct.length);

    if (!cleanUrl) return match;

    const token = `__AVO_URL_${tokenIndex++}__`;
    urlMap.set(token, cleanUrl);
    return `${token}${trailingPunct}`;
  });

  return { protectedText, urlMap };
}

/**
 * Restores original exact URLs from placeholder tokens while ensuring word spaces
 * immediately before or after a URL are never fused by external translators.
 */
function restoreUrls(text: string, urlMap: Map<string, string>): string {
  let restored = text;
  urlMap.forEach((originalUrl, token) => {
    const num = token.replace(/\D/g, '');
    // Matches both exact token and loose spaced forms like "__ AVO_URL_0 __"
    const tokenRegex = new RegExp(`__\\s*AVO_URL_${num}\\s*__`, 'gi');
    restored = restored.replace(tokenRegex, (matched, offset, fullStr) => {
      const before = offset > 0 ? fullStr[offset - 1] : '';
      const afterIdx = offset + matched.length;
      const after = afterIdx < fullStr.length ? fullStr[afterIdx] : '';
      const needsSpaceBefore = Boolean(before && /[\p{L}\p{N}]/u.test(before));
      const needsSpaceAfter = Boolean(after && /[\p{L}\p{N}]/u.test(after));
      return `${needsSpaceBefore ? ' ' : ''}${originalUrl}${needsSpaceAfter ? ' ' : ''}`;
    });
  });
  return restored;
}

/**
 * Main translation entry point supporting:
 * 1. Server-side Gemini 3.8 Flash AI translation endpoint (/api/translate)
 * 2. Line-by-line client-side fallback (< 350 chars per segment) preserving every
 *    line break, blank paragraph gap, indentation, bullet spacing, and word spacing
 * 3. Automatic URL protection ensuring links are preserved with 100% accuracy
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

  const normalized = text.replace(/\r\n?/g, '\n');
  if (!normalized.trim()) return '';

  // Strip only outer leading/trailing blank lines so inner paragraph spacing and line 1 indentation stay intact
  const outerTrimmed = normalized.replace(/^\n+|\n+$/g, '');

  // Protect URLs so external translation engines do not translate, shorten, or break links
  const { protectedText, urlMap } = protectUrls(outerTrimmed);

  // 1. Try server-side Gemini 3.8 Flash AI endpoint first (if full-stack server is running)
  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: protectedText,
        targetLang,
        targetLangName
      })
    });

    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data.translation && typeof data.translation === 'string' && data.translation.trim()) {
          const cleanServerText = data.translation.replace(/^\r?\n+|\r?\n+$/g, '');
          return restoreUrls(cleanServerText, urlMap);
        }
      }
    }
  } catch {
    // Backend endpoint offline or not running (e.g. static Cloudflare Workers deploy)
  }

  // 2. Line-by-line Client-side Translation (guarantees blank lines, line breaks & bullets never get stripped)
  const lines = protectedText.split('\n');
  const translatedLines = new Array<string>(lines.length);
  const lineCache = new Map<string, string>();

  const CONCURRENCY = 4;
  let cursor = 0;

  const workers = Array.from({ length: Math.min(CONCURRENCY, lines.length) }, async () => {
    while (cursor < lines.length) {
      const idx = cursor++;
      translatedLines[idx] = await translateLinePreservingStructure(lines[idx], targetLang, lineCache);
    }
  });

  await Promise.all(workers);

  const combined = translatedLines.join('\n');
  if (combined.trim() && !isInvalidTranslationResult(combined)) {
    return restoreUrls(combined, urlMap);
  }

  throw new Error(`Unable to translate description to ${targetLangName}. Please try again.`);
}

