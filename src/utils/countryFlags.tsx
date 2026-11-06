import React, { useState } from 'react';
import { POPULAR_FAN_COUNTRIES } from '../data/countriesList';

/**
 * Extracts a 2-letter ISO code from an emoji flag (e.g. 🇵🇭 -> ph, 🇹🇭 -> th, 🇯🇵 -> jp)
 */
export const flagEmojiToIso = (emoji?: string): string | null => {
  if (!emoji) return null;
  const chars = Array.from(emoji.trim());
  if (chars.length === 2) {
    const cp0 = chars[0].codePointAt(0);
    const cp1 = chars[1].codePointAt(0);
    if (cp0 && cp1 && cp0 >= 0x1F1E6 && cp0 <= 0x1F1FF && cp1 >= 0x1F1E6 && cp1 <= 0x1F1FF) {
      const c1 = String.fromCharCode(cp0 - 0x1F1E6 + 65);
      const c2 = String.fromCharCode(cp1 - 0x1F1E6 + 65);
      return (c1 + c2).toLowerCase();
    }
  }
  return null;
};

/**
 * Resolves a 2-letter ISO code from a country code, country name, or flag emoji.
 */
export const getCountryIso2 = (code?: string, name?: string, flag?: string): string | null => {
  const c = (code || '').toUpperCase().trim();
  const n = (name || '').toLowerCase().trim();

  // Worldwide / Global / Inter
  if (
    c === 'GLOBAL' ||
    c === 'INTER' ||
    n.includes('worldwide') ||
    n.includes('global') ||
    n.includes('inter')
  ) {
    return null;
  }

  // Generic Other without a specific country name
  if (
    c === 'OTHER' &&
    (!n || n === 'other' || n === 'other / custom region' || n === 'other region')
  ) {
    return null;
  }

  // Special aliases
  if (c === 'UK') return 'gb';
  if (c === 'LATAM') return 'mx';
  if (c.length === 2 && /^[A-Z]{2}$/.test(c)) return c.toLowerCase();

  // From flag emoji
  const fromFlag = flagEmojiToIso(flag);
  if (fromFlag) return fromFlag;

  // Name inference
  if (n.includes('philippines') || n.includes('filipino') || n === 'ph') return 'ph';
  if (n.includes('thailand') || n.includes('thai') || n === 'th') return 'th';
  if (n.includes('vietnam') || n === 'vn') return 'vn';
  if (n.includes('japan') || n === 'jp') return 'jp';
  if (n.includes('china') || n === 'cn') return 'cn';
  if (n.includes('taiwan') || n === 'tw') return 'tw';
  if (n.includes('south korea') || n.includes('korea') || n === 'kr') return 'kr';
  if (n.includes('singapore') || n === 'sg') return 'sg';
  if (n.includes('malaysia') || n === 'my') return 'my';
  if (n.includes('indonesia') || n === 'id') return 'id';
  if (n.includes('hong kong') || n === 'hk') return 'hk';
  if (n.includes('brazil') || n === 'br') return 'br';
  if (n.includes('united states') || n.includes('usa') || n === 'us') return 'us';
  if (n.includes('canada') || n === 'ca') return 'ca';
  if (n.includes('united kingdom') || n.includes('britain') || n.includes('england') || n === 'uk' || n === 'gb') return 'gb';
  if (n.includes('spain') || n === 'es') return 'es';
  if (n.includes('france') || n === 'fr') return 'fr';
  if (n.includes('germany') || n === 'de') return 'de';
  if (n.includes('italy') || n === 'it') return 'it';
  if (n.includes('australia') || n === 'au') return 'au';
  if (n.includes('india') || n === 'in') return 'in';
  if (n.includes('mexico') || n === 'mx') return 'mx';
  if (n.includes('chile') || n === 'cl') return 'cl';
  if (n.includes('argentina') || n === 'ar') return 'ar';
  if (n.includes('colombia') || n === 'co') return 'co';
  if (n.includes('peru') || n === 'pe') return 'pe';
  if (n.includes('new zealand') || n === 'nz') return 'nz';
  if (n.includes('russia') || n === 'ru') return 'ru';
  if (n.includes('netherlands') || n.includes('holland') || n === 'nl') return 'nl';
  if (n.includes('switzerland') || n === 'ch') return 'ch';
  if (n.includes('sweden') || n === 'se') return 'se';
  if (n.includes('turkey') || n === 'tr') return 'tr';
  if (n.includes('poland') || n === 'pl') return 'pl';
  if (n.includes('myanmar') || n.includes('burma') || n === 'mm') return 'mm';
  if (n.includes('laos') || n === 'la') return 'la';
  if (n.includes('cambodia') || n === 'kh') return 'kh';
  if (n.includes('united arab emirates') || n.includes('uae') || n.includes('dubai') || n === 'ae') return 'ae';
  if (n.includes('saudi arabia') || n === 'sa') return 'sa';
  if (n.includes('portugal') || n === 'pt') return 'pt';
  if (n.includes('norway') || n === 'no') return 'no';
  if (n.includes('denmark') || n === 'dk') return 'dk';
  if (n.includes('finland') || n === 'fi') return 'fi';
  if (n.includes('belgium') || n === 'be') return 'be';
  if (n.includes('austria') || n === 'at') return 'at';
  if (n.includes('greece') || n === 'gr') return 'gr';
  if (n.includes('ireland') || n === 'ie') return 'ie';

  return null;
};

/**
 * Intelligent detector for user-typed custom country names
 */
export const detectCountryDetails = (
  input: string
): { code: string; name: string; flag: string } | null => {
  if (!input || !input.trim()) return null;
  const q = input.trim().toLowerCase();

  // Popular fan countries check
  const exact = POPULAR_FAN_COUNTRIES.find(
    (c) => c.name.toLowerCase() === q || c.code.toLowerCase() === q
  );
  if (exact && exact.code !== 'OTHER') {
    return { code: exact.code, name: exact.name, flag: exact.flag };
  }

  const dictionary: Record<string, { code: string; name: string; flag: string }> = {
    philippines: { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
    thailand: { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
    vietnam: { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
    japan: { code: 'JP', name: 'Japan', flag: '🇯🇵' },
    china: { code: 'CN', name: 'China', flag: '🇨🇳' },
    taiwan: { code: 'TW', name: 'Taiwan', flag: '🇹🇼' },
    'south korea': { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
    korea: { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
    singapore: { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
    malaysia: { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
    indonesia: { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
    'hong kong': { code: 'HK', name: 'Hong Kong', flag: '🇭🇰' },
    brazil: { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
    'united states': { code: 'US', name: 'United States', flag: '🇺🇸' },
    usa: { code: 'US', name: 'United States', flag: '🇺🇸' },
    canada: { code: 'CA', name: 'Canada', flag: '🇨🇦' },
    'united kingdom': { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
    uk: { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
    spain: { code: 'ES', name: 'Spain', flag: '🇪🇸' },
    france: { code: 'FR', name: 'France', flag: '🇫🇷' },
    germany: { code: 'DE', name: 'Germany', flag: '🇩🇪' },
    italy: { code: 'IT', name: 'Italy', flag: '🇮🇹' },
    australia: { code: 'AU', name: 'Australia', flag: '🇦🇺' },
    india: { code: 'IN', name: 'India', flag: '🇮🇳' },
    mexico: { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
    chile: { code: 'CL', name: 'Chile', flag: '🇨🇱' },
    argentina: { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
    colombia: { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
    peru: { code: 'PE', name: 'Peru', flag: '🇵🇪' },
    'new zealand': { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
    russia: { code: 'RU', name: 'Russia', flag: '🇷🇺' },
    netherlands: { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
    switzerland: { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
    sweden: { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
    turkey: { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
    poland: { code: 'PL', name: 'Poland', flag: '🇵🇱' },
    myanmar: { code: 'MM', name: 'Myanmar', flag: '🇲🇲' },
    laos: { code: 'LA', name: 'Laos', flag: '🇱🇦' },
    cambodia: { code: 'KH', name: 'Cambodia', flag: '🇰🇭' },
    'united arab emirates': { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
    uae: { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
    'saudi arabia': { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
    portugal: { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
    norway: { code: 'NO', name: 'Norway', flag: '🇳🇴' },
    denmark: { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
    finland: { code: 'FI', name: 'Finland', flag: '🇫🇮' },
    belgium: { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
    austria: { code: 'AT', name: 'Austria', flag: '🇦🇹' },
    greece: { code: 'GR', name: 'Greece', flag: '🇬🇷' },
    ireland: { code: 'IE', name: 'Ireland', flag: '🇮🇪' }
  };

  if (dictionary[q]) {
    return dictionary[q];
  }

  for (const [key, val] of Object.entries(dictionary)) {
    if (q.includes(key) || key.includes(q)) {
      return val;
    }
  }

  return null;
};

interface CountryFlagImageProps {
  countryCode?: string;
  countryName?: string;
  flagEmoji?: string;
  className?: string;
}

/**
 * High-definition Country Flag renderer.
 * Automatically resolves ISO 3166-1 alpha-2 codes and renders crisp colorful flag images
 * from FlagCDN with 2x resolution, eliminating plain two-letter codes (e.g. "PH") on Windows desktops.
 */
export const CountryFlagImage: React.FC<CountryFlagImageProps> = ({
  countryCode,
  countryName,
  flagEmoji,
  className = 'w-5 h-3.5 object-cover rounded-xs inline-block align-middle shrink-0'
}) => {
  const [hasError, setHasError] = useState(false);

  // Check if Worldwide / Inter
  const isGlobal =
    countryCode === 'GLOBAL' ||
    countryName?.toLowerCase().includes('worldwide') ||
    countryName?.toLowerCase().includes('inter') ||
    countryName?.toLowerCase().includes('global');

  // Check if generic "Other" without a custom country name
  const isGenericOther =
    (countryCode === 'OTHER' || !countryCode) &&
    (!countryName ||
      countryName.trim().toLowerCase() === 'other' ||
      countryName.trim().toLowerCase() === 'other / custom region' ||
      countryName.trim().toLowerCase() === 'other region');

  if (isGlobal || isGenericOther) {
    return <span className="text-sm shrink-0 inline-block align-middle select-none">🌐</span>;
  }

  const iso = getCountryIso2(countryCode, countryName, flagEmoji);

  if (!iso || hasError) {
    // If flagEmoji is valid unicode emoji and not literal text like 'PH', render it
    if (
      flagEmoji &&
      flagEmoji !== 'PH' &&
      flagEmoji !== 'TH' &&
      flagEmoji !== 'VN' &&
      flagEmoji !== 'OTHER' &&
      flagEmoji.length > 0
    ) {
      return (
        <span className="text-sm shrink-0 inline-block align-middle select-none">
          {flagEmoji}
        </span>
      );
    }
    return <span className="text-sm shrink-0 inline-block align-middle select-none">🌐</span>;
  }

  return (
    <img
      src={`https://flagcdn.com/w40/${iso.toLowerCase()}.png`}
      srcSet={`https://flagcdn.com/w80/${iso.toLowerCase()}.png 2x`}
      alt={`${countryName || countryCode || 'Country'} flag`}
      className={`${className} border border-slate-200/90 dark:border-slate-700/90 shadow-2xs`}
      loading="lazy"
      onError={() => setHasError(true)}
    />
  );
};
