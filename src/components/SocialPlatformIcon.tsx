import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Film, Globe, Mail, ShoppingBag } from 'lucide-react';
import { SocialPlatform } from '../types/fanhub';

export interface SocialPlatformMeta {
  value: SocialPlatform;
  label: string;
  badgeLabel: string;
}

export const SOCIAL_PLATFORM_OPTIONS: SocialPlatformMeta[] = [
  { value: 'x', label: 'Twitter / X', badgeLabel: 'X' },
  { value: 'email', label: 'Official Email', badgeLabel: 'Official Email' },
  { value: 'instagram', label: 'Instagram', badgeLabel: 'Instagram' },
  { value: 'threads', label: 'Threads', badgeLabel: 'Threads' },
  { value: 'tiktok', label: 'TikTok', badgeLabel: 'TikTok' },
  { value: 'facebook', label: 'Facebook', badgeLabel: 'Facebook' },
  { value: 'line', label: 'LINE', badgeLabel: 'LINE' },
  { value: 'line_openchat', label: 'LINE OpenChat', badgeLabel: 'LINE OpenChat' },
  { value: 'whatsapp', label: 'WhatsApp', badgeLabel: 'WhatsApp' },
  { value: 'telegram', label: 'Telegram', badgeLabel: 'Telegram' },
  { value: 'discord', label: 'Discord', badgeLabel: 'Discord' },
  { value: 'youtube', label: 'YouTube', badgeLabel: 'YouTube' },
  { value: 'weibo', label: 'Weibo', badgeLabel: 'Weibo' },
  { value: 'web', label: 'Website', badgeLabel: 'Website' }
];

export const getSocialPlatformLabel = (platform: SocialPlatform): string => {
  return SOCIAL_PLATFORM_OPTIONS.find((p) => p.value === platform)?.badgeLabel || platform;
};

export type OfficialPlatformKey =
  | SocialPlatform
  | 'trailer'
  | 'netflix'
  | 'viki'
  | 'iqiyi'
  | 'viu'
  | 'gagaoolala'
  | 'wetv'
  | 'disney'
  | 'trueid'
  | 'one31'
  | 'gmmtv'
  | 'aisplay'
  | 'twitch'
  | 'bilibili'
  | 'spotify'
  | 'apple_music'
  | 'thaiticketmajor'
  | 'eventpop'
  | 'ticketmelon'
  | 'shopee'
  | 'lazada'
  | 'shop'
  | 'google_calendar'
  | 'google_maps'
  | 'apple_calendar';

/**
 * Resolves any platform name, channel label, or URL to an official brand icon key.
 */
export function resolveOfficialPlatformKey(
  platformOrName?: string,
  url?: string
): OfficialPlatformKey {
  const p = (platformOrName || '').trim().toLowerCase();
  const u = (url || '').trim().toLowerCase();

  // Explicit trailer / teaser takes priority if labeled as trailer
  if (p.includes('trailer') || p.includes('teaser') || p.includes('pilot')) {
    return 'trailer';
  }

  // Exact known keys first
  const exactMap: Record<string, OfficialPlatformKey> = {
    x: 'x',
    twitter: 'x',
    instagram: 'instagram',
    threads: 'threads',
    tiktok: 'tiktok',
    facebook: 'facebook',
    line: 'line',
    line_openchat: 'line_openchat',
    whatsapp: 'whatsapp',
    telegram: 'telegram',
    discord: 'discord',
    youtube: 'youtube',
    weibo: 'weibo',
    email: 'email',
    web: 'web',
    website: 'web',
    trailer: 'trailer',
    netflix: 'netflix',
    viki: 'viki',
    iqiyi: 'iqiyi',
    viu: 'viu',
    gagaoolala: 'gagaoolala',
    wetv: 'wetv',
    'disney+': 'disney',
    disney: 'disney',
    trueid: 'trueid',
    one31: 'one31',
    oned: 'one31',
    gmmtv: 'gmmtv',
    'ais play': 'aisplay',
    aisplay: 'aisplay',
    twitch: 'twitch',
    bilibili: 'bilibili',
    spotify: 'spotify',
    'apple music': 'apple_music',
    apple_music: 'apple_music',
    shop: 'shop',
    google_calendar: 'google_calendar',
    'google calendar': 'google_calendar',
    google_maps: 'google_maps',
    'google maps': 'google_maps',
    apple_calendar: 'apple_calendar',
    'apple calendar': 'apple_calendar'
  };
  if (p && exactMap[p]) return exactMap[p];

  // URL-based detection (most accurate when user pasted a link)
  if (u) {
    if (u.startsWith('mailto:')) return 'email';
    if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
    if (u.includes('x.com') || u.includes('twitter.com')) return 'x';
    if (u.includes('threads.net') || u.includes('threads.com')) return 'threads';
    if (u.includes('instagram.com') || u.includes('instagr.am')) return 'instagram';
    if (u.includes('tiktok.com')) return 'tiktok';
    if (u.includes('facebook.com') || u.includes('fb.watch') || u.includes('fb.com')) return 'facebook';
    if (u.includes('openchat') && u.includes('line.me')) return 'line_openchat';
    if (u.includes('line.me') || u.includes('lin.ee')) return 'line';
    if (u.includes('wa.me') || u.includes('whatsapp.com')) return 'whatsapp';
    if (u.includes('t.me') || u.includes('telegram.me') || u.includes('telegram.org')) return 'telegram';
    if (u.includes('discord.gg') || u.includes('discord.com')) return 'discord';
    if (u.includes('weibo.com') || u.includes('weibo.cn')) return 'weibo';
    if (u.includes('netflix.com')) return 'netflix';
    if (u.includes('viki.com')) return 'viki';
    if (u.includes('iq.com') || u.includes('iqiyi.com')) return 'iqiyi';
    if (u.includes('viu.com')) return 'viu';
    if (u.includes('gagaoolala.com')) return 'gagaoolala';
    if (u.includes('wetv.vip') || u.includes('wetv.com')) return 'wetv';
    if (u.includes('disneyplus.com') || u.includes('hotstar.com')) return 'disney';
    if (u.includes('trueid.net')) return 'trueid';
    if (u.includes('oned.net') || u.includes('one31.net')) return 'one31';
    if (u.includes('aisplay.ais.co.th') || u.includes('ais.th')) return 'aisplay';
    if (u.includes('twitch.tv')) return 'twitch';
    if (u.includes('bilibili.com') || u.includes('bilibili.tv')) return 'bilibili';
    if (u.includes('spotify.com')) return 'spotify';
    if (u.includes('music.apple.com') || u.includes('apple.com')) return 'apple_music';
    if (u.includes('gmm-tv.com')) return 'gmmtv';
    if (u.includes('thaiticketmajor.com')) return 'thaiticketmajor';
    if (u.includes('eventpop.me')) return 'eventpop';
    if (u.includes('ticketmelon.com')) return 'ticketmelon';
    if (u.includes('shopee.')) return 'shopee';
    if (u.includes('lazada.')) return 'lazada';
    if (u.includes('calendar.google.com')) return 'google_calendar';
    if (u.includes('maps.google.com') || u.includes('google.com/maps') || u.includes('maps.app.goo.gl') || u.includes('goo.gl/maps')) return 'google_maps';
  }

  // Keyword detection from platform / label string
  if (p) {
    if (p.includes('youtube')) return 'youtube';
    if (p.includes('threads')) return 'threads';
    if (p.includes('instagram') || p === 'ig') return 'instagram';
    if (p.includes('tiktok')) return 'tiktok';
    if (p.includes('facebook') || p.includes('fb')) return 'facebook';
    if (p.includes('openchat')) return 'line_openchat';
    if (p.includes('line')) return 'line';
    if (p.includes('whatsapp')) return 'whatsapp';
    if (p.includes('telegram')) return 'telegram';
    if (p.includes('discord')) return 'discord';
    if (p.includes('weibo')) return 'weibo';
    if (p.includes('netflix')) return 'netflix';
    if (p.includes('viki')) return 'viki';
    if (p.includes('iqiyi') || p.includes('iq.com')) return 'iqiyi';
    if (p.includes('viu')) return 'viu';
    if (p.includes('gagaoolala')) return 'gagaoolala';
    if (p.includes('wetv')) return 'wetv';
    if (p.includes('disney') || p.includes('hotstar')) return 'disney';
    if (p.includes('trueid')) return 'trueid';
    if (p.includes('one31') || p.includes('oned')) return 'one31';
    if (p.includes('ais play') || p.includes('aisplay')) return 'aisplay';
    if (p.includes('twitch')) return 'twitch';
    if (p.includes('bilibili')) return 'bilibili';
    if (p.includes('spotify')) return 'spotify';
    if (p.includes('apple')) return 'apple_music';
    if (p.includes('gmmtv') || p.includes('gmm-tv')) return 'gmmtv';
    if (p.includes('thaiticketmajor') || p.includes('ttm')) return 'thaiticketmajor';
    if (p.includes('eventpop')) return 'eventpop';
    if (p.includes('ticketmelon')) return 'ticketmelon';
    if (p.includes('shopee')) return 'shopee';
    if (p.includes('lazada')) return 'lazada';
    if (p.includes('shop') || p.includes('merch') || p.includes('store')) return 'shop';
    if (p.includes('twitter') || p.includes('space') || /\bx\b/.test(p)) return 'x';
    if (p.includes('email') || p.includes('mail')) return 'email';
  }

  return 'web';
}

interface SocialPlatformIconProps {
  platform: OfficialPlatformKey | string;
  url?: string;
  className?: string;
}

export const SocialPlatformIcon: React.FC<SocialPlatformIconProps> = ({
  platform,
  url,
  className = 'w-4 h-4 shrink-0'
}) => {
  const uid = useId().replace(/:/g, '');
  const resolved = resolveOfficialPlatformKey(platform, url);

  switch (resolved) {
    case 'x':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <rect width="24" height="24" rx="6" className="fill-slate-950 dark:fill-white" />
          <path
            d="M17.24 5.5h2.29l-5 5.71 5.88 7.79h-4.6l-3.6-4.72-4.13 4.72H5.79l5.35-6.11-5.64-7.39h4.72l3.26 4.31 3.76-4.31zm-.8 12.13h1.27L9.5 6.8H8.14l8.3 10.83z"
            className="fill-white dark:fill-slate-950"
          />
        </svg>
      );

    case 'instagram':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <defs>
            <radialGradient id={`ig-grad-${uid}`} cx="30%" cy="107%" r="150%">
              <stop offset="0%" stopColor="#fdf497" />
              <stop offset="5%" stopColor="#fdf497" />
              <stop offset="45%" stopColor="#fd5949" />
              <stop offset="60%" stopColor="#d6249f" />
              <stop offset="90%" stopColor="#285AEB" />
            </radialGradient>
          </defs>
          <rect width="24" height="24" rx="6" fill={`url(#ig-grad-${uid})`} />
          <rect
            x="5.2"
            y="5.2"
            width="13.6"
            height="13.6"
            rx="4"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.7"
          />
          <circle cx="12" cy="12" r="3.2" fill="none" stroke="#ffffff" strokeWidth="1.7" />
          <circle cx="16.1" cy="7.9" r="1" fill="#ffffff" />
        </svg>
      );

    case 'threads':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <rect width="24" height="24" rx="6" className="fill-slate-950 dark:fill-white" />
          <path
            d="M15.48 11.46c-.07-.04-.15-.07-.22-.1-.18-2.41-1.5-3.79-3.79-3.81h-.04c-1.37 0-2.51.58-3.22 1.65l1.16.8c.49-.74 1.25-1.03 2.06-1.03h.03c.77.01 1.35.23 1.72.66.27.32.45.75.54 1.3-.68-.12-1.42-.15-2.21-.11-2.22.13-3.65 1.43-3.55 3.24.05.92.51 1.71 1.29 2.23.66.44 1.52.65 2.41.6 1.18-.06 2.11-.51 2.75-1.34.49-.62.8-1.43.94-2.45.56.34.98.79 1.21 1.32.39.91.41 2.4-.8 3.61-1.06 1.06-2.34 1.52-4.27 1.54-2.14-.02-3.76-.71-4.81-2.06-.99-1.26-1.5-3.09-1.52-5.43.02-2.34.53-4.17 1.52-5.43 1.05-1.35 2.67-2.04 4.81-2.06 2.16.02 3.81.71 4.9 2.07.54.67.94 1.51 1.2 2.49l1.36-.36c-.32-1.2-.82-2.24-1.5-3.09-1.38-1.72-3.39-2.61-5.95-2.63h-.02c-2.56.02-4.55.91-5.91 2.64-1.21 1.54-1.83 3.68-1.86 6.36v.02c.03 2.68.65 4.82 1.86 6.36 1.36 1.73 3.35 2.62 5.91 2.64h.02c2.3-.02 3.92-.63 5.26-1.97 1.73-1.73 1.67-3.9 1.1-5.22-.4-.93-1.15-1.69-2.15-2.19zm-3.85 3.98c-.98.06-1.99-.38-2.04-1.32-.04-.7.5-1.48 2.11-1.57.18-.01.36-.02.53-.02.57 0 1.1.06 1.59.17-.18 2.27-1.24 2.69-2.19 2.74z"
            className="fill-white dark:fill-slate-950"
          />
        </svg>
      );

    case 'tiktok':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <rect width="24" height="24" rx="6" fill="#010101" />
          <path
            d="M16.1 8.8a4.3 4.3 0 0 1-2.4-.75v5.3a4.35 4.35 0 1 1-3.75-4.3v2.28a2.1 2.1 0 1 0 1.48 2.01V4.8h2.27a4.28 4.28 0 0 0 2.4 2.77v1.23z"
            fill="#25F4EE"
            transform="translate(-0.7 -0.5)"
          />
          <path
            d="M16.1 8.8a4.3 4.3 0 0 1-2.4-.75v5.3a4.35 4.35 0 1 1-3.75-4.3v2.28a2.1 2.1 0 1 0 1.48 2.01V4.8h2.27a4.28 4.28 0 0 0 2.4 2.77v1.23z"
            fill="#FE2C55"
            transform="translate(0.7 0.5)"
          />
          <path
            d="M16.1 8.8a4.3 4.3 0 0 1-2.4-.75v5.3a4.35 4.35 0 1 1-3.75-4.3v2.28a2.1 2.1 0 1 0 1.48 2.01V4.8h2.27a4.28 4.28 0 0 0 2.4 2.77v1.23z"
            fill="#ffffff"
          />
        </svg>
      );

    case 'facebook':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <circle cx="12" cy="12" r="11" fill="#1877F2" />
          <path
            d="M15.67 12.78l.49-3.17h-3.04V7.55c0-.87.42-1.71 1.79-1.71h1.38V3.14s-1.26-.21-2.46-.21c-2.51 0-4.15 1.52-4.15 4.28v2.4H6.89v3.17h2.79v7.67a11.1 11.1 0 0 0 3.44 0v-7.67h2.55z"
            fill="#ffffff"
          />
        </svg>
      );

    case 'line':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <rect width="24" height="24" rx="6" fill="#06C755" />
          <path
            d="M19.5 11.08c0-3.36-3.37-6.08-7.5-6.08s-7.5 2.72-7.5 6.08c0 3.01 2.67 5.53 6.27 6.01.24.05.58.16.66.37.08.19.05.49.02.68l-.11.64c-.03.19-.15.74.65.4.8-.34 4.32-2.55 5.9-4.36 1.09-1.19 1.61-2.4 1.61-3.74z"
            fill="#ffffff"
          />
          <text
            x="12"
            y="12.7"
            textAnchor="middle"
            fill="#06C755"
            fontSize="4.6"
            fontWeight="900"
            fontFamily="Arial, Helvetica, sans-serif"
            letterSpacing="-0.2"
          >
            LINE
          </text>
        </svg>
      );

    case 'line_openchat':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <rect width="24" height="24" rx="6" fill="#06C755" />
          <path
            d="M19.3 11.1c0-3.2-3.27-5.8-7.3-5.8s-7.3 2.6-7.3 5.8c0 2.86 2.59 5.26 6.09 5.71.24.05.56.16.64.36.07.18.05.47.02.65l-.1.61c-.03.18-.15.71.63.39.77-.32 4.19-2.43 5.73-4.16 1.06-1.13 1.59-2.29 1.59-3.56z"
            fill="#ffffff"
          />
          <path
            d="M10.4 8.5l-.6 5.2m4.4-5.2l-.6 5.2M8.8 10.2h6.4M8.4 12.2h6.4"
            stroke="#06C755"
            strokeWidth="1.35"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'whatsapp':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <circle cx="12" cy="12" r="11" fill="#25D366" />
          <path
            d="M12.04 5.5a6.44 6.44 0 0 0-5.58 9.65L5.5 18.7l3.64-.95a6.44 6.44 0 1 0 2.9-12.25zm3.74 9.09c-.16.45-.92.86-1.27.91-.33.05-.75.07-1.21-.07-.28-.09-.64-.21-1.1-.41-1.93-.83-3.19-2.78-3.29-2.91-.1-.13-.79-1.05-.79-2s.5-1.42.68-1.61c.18-.19.39-.24.52-.24h.37c.12 0 .28-.05.44.33.16.39.55 1.35.6 1.45.05.1.08.21.02.34-.06.13-.1.21-.19.32-.1.11-.2.25-.29.34-.1.1-.2.2-.08.39.11.19.51.84 1.09 1.36.75.67 1.38.88 1.57.97.19.1.31.08.42-.05.11-.13.48-.56.61-.76.13-.19.26-.16.44-.1.18.06 1.13.53 1.32.63.19.1.32.15.37.23.05.08.05.47-.11.92z"
            fill="#ffffff"
          />
        </svg>
      );

    case 'telegram':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <circle cx="12" cy="12" r="11" fill="#26A5E4" />
          <path
            d="M17.36 7.31l-1.97 9.28c-.15.66-.54.82-1.09.51l-3.01-2.22-1.45 1.4c-.16.16-.3.3-.61.3l.22-3.07 5.58-5.04c.24-.22-.05-.34-.38-.12l-6.9 4.35-2.97-.93c-.65-.2-.66-.65.14-.96l11.61-4.47c.54-.2 1.01.13.83.97z"
            fill="#ffffff"
          />
        </svg>
      );

    case 'discord':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <rect width="24" height="24" rx="6" fill="#5865F2" />
          <path
            d="M17.56 7.52a12.4 12.4 0 0 0-3.07-.95.05.05 0 0 0-.05.02c-.13.24-.28.55-.38.79a11.46 11.46 0 0 0-3.44 0c-.1-.24-.26-.55-.39-.79a.05.05 0 0 0-.05-.02 12.36 12.36 0 0 0-3.07.95.04.04 0 0 0-.02.02C5.13 10.47 4.6 13.33 4.86 16.15c0 .02.01.03.02.04a12.5 12.5 0 0 0 3.77 1.9.05.05 0 0 0 .05-.02c.29-.4.55-.82.77-1.26a.05.05 0 0 0-.03-.07 8.2 8.2 0 0 1-1.17-.56.05.05 0 0 1 0-.08c.08-.06.16-.12.23-.18a.05.05 0 0 1 .05-.01c2.46 1.12 5.12 1.12 7.55 0a.05.05 0 0 1 .05.01c.07.06.15.12.23.18a.05.05 0 0 1 0 .08c-.38.22-.77.41-1.18.56a.05.05 0 0 0-.02.07c.23.44.49.86.77 1.26a.05.05 0 0 0 .05.02 12.46 12.46 0 0 0 3.77-1.9.05.05 0 0 0 .02-.04c.31-3.26-.53-6.09-2.22-8.61a.04.04 0 0 0-.01-.02zM9.8 14.42c-.74 0-1.35-.68-1.35-1.52s.6-1.52 1.35-1.52c.76 0 1.36.69 1.35 1.52 0 .84-.6 1.52-1.35 1.52zm4.98 0c-.74 0-1.35-.68-1.35-1.52s.6-1.52 1.35-1.52c.76 0 1.36.69 1.35 1.52 0 .84-.59 1.52-1.35 1.52z"
            fill="#ffffff"
          />
        </svg>
      );

    case 'youtube':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <rect x="1.5" y="4.5" width="21" height="15" rx="4.2" fill="#FF0000" />
          <polygon points="10,8.8 16.2,12 10,15.2" fill="#ffffff" />
        </svg>
      );

    case 'weibo':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <rect width="24" height="24" rx="6" fill="#E6162D" />
          <path
            d="M10.4 17.8c-3.2 0-5.8-1.6-5.8-3.7 0-1.1.7-2.4 1.9-3.5 1.6-1.5 3.4-2.1 4.1-1.4.3.3.3.9.1 1.4-.1.3.2.4.5.3 1.2-.5 2.4-.5 2.9.2.2.3.2.7 0 1.1-.1.2.1.3.3.3 1.1.2 2 .9 2 1.8 0 1.9-2.7 3.5-6 3.5z"
            fill="#ffffff"
          />
          <ellipse cx="9.9" cy="14.5" rx="2.3" ry="1.6" fill="#E6162D" />
          <circle cx="9.3" cy="14.5" r="0.7" fill="#ffffff" />
          <path
            d="M14.8 7.4c1.6-.3 3.3.5 3.9 2.1m-3.4-.3c.8-.1 1.6.3 1.9 1.1"
            fill="none"
            stroke="#FFCC00"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'netflix':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <rect width="24" height="24" rx="6" fill="#141414" />
          <path d="M7 4.5h3v15H7z" fill="#B20710" />
          <path d="M14 4.5h3v15h-3z" fill="#B20710" />
          <path d="M7 4.5h3l7 15h-3z" fill="#E50914" />
        </svg>
      );

    case 'viki':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <rect width="24" height="24" rx="6" fill="#1C9BEF" />
          <path
            d="M6.2 7.2h2.7l3.1 8.1 3.1-8.1h2.7L13.3 18h-2.6L6.2 7.2z"
            fill="#ffffff"
          />
        </svg>
      );

    case 'iqiyi':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <rect width="24" height="24" rx="6" fill="#00BE06" />
          <text
            x="12"
            y="14.7"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="7.4"
            fontWeight="900"
            fontFamily="Arial, Helvetica, sans-serif"
            letterSpacing="-0.3"
          >
            iQIYI
          </text>
        </svg>
      );

    case 'viu':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <rect width="24" height="24" rx="6" fill="#FFBF00" />
          <text
            x="12"
            y="15.2"
            textAnchor="middle"
            fill="#141414"
            fontSize="9.2"
            fontWeight="900"
            fontFamily="Arial, Helvetica, sans-serif"
            letterSpacing="-0.4"
          >
            viu
          </text>
        </svg>
      );

    case 'gagaoolala':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <defs>
            <linearGradient id={`gaga-grad-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF3B8D" />
              <stop offset="50%" stopColor="#A855F7" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
          </defs>
          <rect width="24" height="24" rx="6" fill={`url(#gaga-grad-${uid})`} />
          <text
            x="12"
            y="15.3"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="8.8"
            fontWeight="900"
            fontFamily="Arial, Helvetica, sans-serif"
          >
            GO
          </text>
        </svg>
      );

    case 'wetv':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <rect width="24" height="24" rx="6" fill="#182235" />
          <path d="M7.5 6.8l9.8 5.2-9.8 5.2V6.8z" fill="#00A8FF" />
          <path d="M7.5 6.8l5.6 3-5.6 4.2V6.8z" fill="#FF7A00" />
          <path d="M12.2 12l5.1 0-9.8 5.2 4.7-5.2z" fill="#2ECC71" />
        </svg>
      );

    case 'disney':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <defs>
            <linearGradient id={`disney-grad-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#08164A" />
              <stop offset="100%" stopColor="#1246D6" />
            </linearGradient>
          </defs>
          <rect width="24" height="24" rx="6" fill={`url(#disney-grad-${uid})`} />
          <path
            d="M4.5 11.2c3.2-3.3 8.8-3.5 12.6-.3"
            fill="none"
            stroke="#5CE1E6"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <text
            x="11.5"
            y="16.4"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="8.2"
            fontWeight="900"
            fontFamily="Arial, Helvetica, sans-serif"
          >
            D+
          </text>
        </svg>
      );

    case 'trueid':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <rect width="24" height="24" rx="6" fill="#E30613" />
          <text
            x="12"
            y="14.7"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="7.4"
            fontWeight="900"
            fontFamily="Arial, Helvetica, sans-serif"
            letterSpacing="-0.3"
          >
            trueID
          </text>
        </svg>
      );

    case 'one31':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <rect width="24" height="24" rx="6" fill="#0062CC" />
          <text
            x="12"
            y="14.9"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="7.8"
            fontWeight="900"
            fontFamily="Arial, Helvetica, sans-serif"
            letterSpacing="-0.3"
          >
            oneD
          </text>
        </svg>
      );

    case 'gmmtv':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <rect width="24" height="24" rx="6" fill="#005BAC" />
          <rect x="3" y="17.5" width="18" height="2.4" rx="1.2" fill="#FFD100" />
          <text
            x="12"
            y="14.2"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="6.2"
            fontWeight="900"
            fontFamily="Arial, Helvetica, sans-serif"
            letterSpacing="-0.2"
          >
            GMMTV
          </text>
        </svg>
      );

    case 'aisplay':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <rect width="24" height="24" rx="6" fill="#76BC21" />
          <polygon points="9.2,7.4 17.4,12 9.2,16.6" fill="#ffffff" />
        </svg>
      );

    case 'twitch':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <rect width="24" height="24" rx="6" fill="#9146FF" />
          <path
            d="M6.8 5.2L5.5 8.5v9.8h3.4v2l2.1-2h2.9l4.6-4.6V5.2H6.8zm10.2 7.8l-2.3 2.3h-3.2l-1.9 1.9v-1.9H7.2V6.8h9.8v6.2z"
            fill="#ffffff"
          />
          <rect x="13.5" y="8.8" width="1.5" height="3.8" fill="#ffffff" />
          <rect x="10.2" y="8.8" width="1.5" height="3.8" fill="#ffffff" />
        </svg>
      );

    case 'bilibili':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <rect width="24" height="24" rx="6" fill="#00A1D6" />
          <path
            d="M8.5 5.8l2 2h3l2-2M7 8.5h10a2 2 0 0 1 2 2v5.5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-5.5a2 2 0 0 1 2-2z"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line x1="9.3" y1="12" x2="9.3" y2="14.2" stroke="#ffffff" strokeWidth="1.7" strokeLinecap="round" />
          <line x1="14.7" y1="12" x2="14.7" y2="14.2" stroke="#ffffff" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );

    case 'spotify':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <circle cx="12" cy="12" r="11" fill="#1DB954" />
          <path
            d="M7.2 9.7c3.2-.9 6.9-.6 9.6 1m-8.8 2.6c2.6-.7 5.6-.5 7.9.8m-7.1 2.4c2.1-.5 4.4-.3 6.2.7"
            fill="none"
            stroke="#121212"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'apple_music':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <defs>
            <linearGradient id={`am-grad-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FA5C7C" />
              <stop offset="100%" stopColor="#FA233B" />
            </linearGradient>
          </defs>
          <rect width="24" height="24" rx="6" fill={`url(#am-grad-${uid})`} />
          <path
            d="M16.5 6.2v8.2a2.1 2.1 0 1 1-1.4-2v-4l-5.2 1.2v6a2.1 2.1 0 1 1-1.4-2V8.1l8-1.9z"
            fill="#ffffff"
          />
        </svg>
      );

    case 'thaiticketmajor':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <rect width="24" height="24" rx="6" fill="#D91E2A" />
          <text
            x="12"
            y="14.8"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="7.4"
            fontWeight="900"
            fontFamily="Arial, Helvetica, sans-serif"
          >
            TTM
          </text>
        </svg>
      );

    case 'eventpop':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <rect width="24" height="24" rx="6" fill="#00A8E8" />
          <text
            x="12"
            y="15"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="8.5"
            fontWeight="900"
            fontFamily="Arial, Helvetica, sans-serif"
          >
            EP
          </text>
        </svg>
      );

    case 'ticketmelon':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <rect width="24" height="24" rx="6" fill="#00C389" />
          <text
            x="12"
            y="15"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="8.5"
            fontWeight="900"
            fontFamily="Arial, Helvetica, sans-serif"
          >
            TM
          </text>
        </svg>
      );

    case 'shopee':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <rect width="24" height="24" rx="6" fill="#EE4D2D" />
          <path
            d="M9 8.5a3 3 0 0 1 6 0"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <rect x="6.5" y="8.5" width="11" height="10" rx="2" fill="#ffffff" />
          <text
            x="12"
            y="16.2"
            textAnchor="middle"
            fill="#EE4D2D"
            fontSize="8.2"
            fontWeight="900"
            fontFamily="Arial, Helvetica, sans-serif"
          >
            S
          </text>
        </svg>
      );

    case 'lazada':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <defs>
            <linearGradient id={`laz-grad-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0F146D" />
              <stop offset="60%" stopColor="#9B1B7A" />
              <stop offset="100%" stopColor="#F57224" />
            </linearGradient>
          </defs>
          <rect width="24" height="24" rx="6" fill={`url(#laz-grad-${uid})`} />
          <path
            d="M12 17.5l-5.3-3.4a3.2 3.2 0 0 1 3.7-5.1L12 10l1.6-1a3.2 3.2 0 0 1 3.7 5.1L12 17.5z"
            fill="#ffffff"
          />
        </svg>
      );

    case 'shop':
      return (
        <span className={`inline-flex items-center justify-center rounded-md bg-rose-600 text-white ${className}`}>
          <ShoppingBag className="w-[70%] h-[70%]" />
        </span>
      );

    case 'trailer':
      return (
        <span className={`inline-flex items-center justify-center rounded-md bg-amber-500 text-white ${className}`}>
          <Film className="w-[70%] h-[70%]" />
        </span>
      );

    case 'google_calendar':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <rect x="2" y="2" width="20" height="20" rx="4.5" fill="#ffffff" stroke="#E2E8F0" strokeWidth="0.8" />
          <path d="M6.5 2H17.5V6.5H6.5V2Z" fill="#4285F4" />
          <path d="M17.5 2H18.5A3.5 3.5 0 0 1 22 5.5V6.5H17.5V2Z" fill="#1967D2" />
          <path d="M2 5.5A3.5 3.5 0 0 1 5.5 2H6.5V6.5H2V5.5Z" fill="#4285F4" />
          <path d="M2 6.5H6.5V17.5H2V6.5Z" fill="#4285F4" />
          <path d="M17.5 6.5H22V17.5H17.5V6.5Z" fill="#FBBC04" />
          <path d="M6.5 17.5H17.5V22H6.5V17.5Z" fill="#34A853" />
          <path d="M2 17.5H6.5V22H5.5A3.5 3.5 0 0 1 2 18.5V17.5Z" fill="#188038" />
          <path d="M17.5 17.5H22L17.5 22V17.5Z" fill="#EA4335" />
          <text
            x="12"
            y="15.3"
            textAnchor="middle"
            fill="#1967D2"
            fontSize="8.8"
            fontWeight="900"
            fontFamily="Arial, Helvetica, sans-serif"
          >
            31
          </text>
        </svg>
      );

    case 'google_maps':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <rect width="24" height="24" rx="6" fill="#ffffff" />
          <path d="M12 3.2c-3.5 0-6.3 2.8-6.3 6.3 0 1.8.8 3.6 2 5.1l4.3 6.2 4.3-6.2c1.2-1.5 2-3.3 2-5.1 0-3.5-2.8-6.3-6.3-6.3z" fill="#34A853" />
          <path d="M12 3.2c-2.2 0-4.2 1.1-5.3 2.9l5.3 4.4V3.2z" fill="#EA4335" />
          <path d="M12 3.2v7.3l5.3-4.4C16.2 4.3 14.2 3.2 12 3.2z" fill="#4285F4" />
          <path d="M6.7 6.1A6.2 6.2 0 0 0 5.7 9.5c0 1.8.8 3.6 2 5.1l4.3-4.1-5.3-4.4z" fill="#FBBC04" />
          <circle cx="12" cy="9.5" r="2.4" fill="#ffffff" />
        </svg>
      );

    case 'apple_calendar':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <rect x="2" y="2" width="20" height="20" rx="5" fill="#ffffff" stroke="#E2E8F0" strokeWidth="0.9" />
          <path d="M2 7A5 5 0 0 1 7 2H17A5 5 0 0 1 22 7V8.5H2V7Z" fill="#FF3B30" />
          <text
            x="12"
            y="18.2"
            textAnchor="middle"
            fill="#1E293B"
            fontSize="10"
            fontWeight="800"
            fontFamily="Arial, Helvetica, sans-serif"
          >
            17
          </text>
        </svg>
      );

    case 'email':
      return (
        <span className={`inline-flex items-center justify-center rounded-md bg-purple-600 text-white ${className}`}>
          <Mail className="w-[70%] h-[70%]" />
        </span>
      );

    case 'web':
    default:
      return (
        <span className={`inline-flex items-center justify-center rounded-md bg-sky-600 text-white ${className}`}>
          <Globe className="w-[70%] h-[70%]" />
        </span>
      );
  }
};

export interface GenericPlatformOption {
  value: string;
  label: string;
}

interface GenericPlatformSelectProps {
  value: string;
  options: GenericPlatformOption[];
  onChange: (value: string) => void;
  minWidthClass?: string;
}

export const OfficialPlatformSelect: React.FC<GenericPlatformSelectProps> = ({
  value,
  options,
  onChange,
  minWidthClass = 'min-w-[148px]'
}) => {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number; openUp: boolean } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selected = options.find((opt) => opt.value === value) || options[0];

  const updatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const menuHeight = 272;
    const openUp = spaceBelow < menuHeight && rect.top > spaceBelow;
    setMenuPos({
      top: openUp ? rect.top - 4 : rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 196),
      openUp
    });
  };

  useEffect(() => {
    if (!open) return;
    updatePosition();

    const handleClickOutside = (e: MouseEvent) => {
      if (
        buttonRef.current?.contains(e.target as Node) ||
        menuRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      setOpen(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    const handleScrollOrResize = () => updatePosition();

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [open]);

  return (
    <div className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`inline-flex items-center justify-between gap-2 ${minWidthClass} rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 px-2.5 py-1.5 text-xs font-bold text-[#1A3668] dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer transition-colors`}
      >
        <span className="inline-flex items-center gap-2 truncate">
          <SocialPlatformIcon platform={selected.value} className="w-4 h-4 shrink-0" />
          <span className="truncate">{selected.label}</span>
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open &&
        menuPos &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            style={{
              position: 'fixed',
              top: menuPos.top,
              left: menuPos.left,
              width: menuPos.width,
              transform: menuPos.openUp ? 'translateY(-100%)' : undefined,
              zIndex: 9999
            }}
            className="max-h-68 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl py-1"
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-bold text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                      : 'text-[#1A3668] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="inline-flex items-center gap-2.5 truncate">
                    <SocialPlatformIcon platform={opt.value} className="w-4 h-4 shrink-0" />
                    <span className="truncate">{opt.label}</span>
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
};

interface SocialPlatformSelectProps {
  value: SocialPlatform;
  onChange: (platform: SocialPlatform) => void;
}

export const SocialPlatformSelect: React.FC<SocialPlatformSelectProps> = ({ value, onChange }) => {
  return (
    <OfficialPlatformSelect
      value={value}
      options={SOCIAL_PLATFORM_OPTIONS}
      onChange={(val) => onChange(val as SocialPlatform)}
    />
  );
};
