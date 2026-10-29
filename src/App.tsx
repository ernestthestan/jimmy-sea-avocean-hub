import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Calendar as CalendarIcon,
  List as ListIcon,
  Plus,
  Edit3,
  Trash2,
  MapPin,
  Clock,
  ExternalLink,
  Settings,
  Download,
  Upload,
  Check,
  X,
  Sparkles,
  Search,
  Image as ImageIcon,
  RotateCcw,
  Globe,
  Share2,
  Tv,
  Lock,
  Unlock,
  Copy,
  Eye,
  Navigation,
  FileImage,
  ArrowLeft,
  CheckCircle2,
  Bell,
  BellRing,
  Mail,
  Phone,
  MessageCircle,
  CalendarPlus,
  Smartphone,
  Sun,
  Moon,
  Camera,
  Filter,
  Key,
  EyeOff,
  Shield,
  Crown,
  LogOut,
  UserCheck,
  MessageSquare,
  Send,
  Inbox,
  Palette,
  SlidersHorizontal,
  Layers,
  Maximize2,
  Activity,
  Users
} from 'lucide-react';
import {
  testFirestoreConnection,
  startLivePresenceTracking,
  subscribeToEvents,
  saveEventToFirestore,
  deleteEventFromFirestore,
  subscribeToSettings,
  saveSettingsToFirestore,
  subscribeToFanMessages,
  sendFanMessageToFirestore,
  updateFanMessageInFirestore,
  deleteFanMessageFromFirestore
} from './lib/firestoreSync';

// --- Type Definitions ---
export type UserRole = 'visitor' | 'admin' | 'owner';
export type AccentChoice = 'purple' | 'blue' | 'green';

export interface FanMessage {
  id: string;
  senderName: string;
  eventTitle: string;
  eventDate?: string;
  sourceUrl?: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

export interface Member {
  id: string;
  name: string;
  emoji: string;
  circleBg: string;
  pillBg: string;
  pillBorder: string;
  textColor: string;
}

export interface WatchPlatform {
  id: string;
  name: string;
  platform: string;
  url: string;
}

export interface ScheduleEvent {
  id: string;
  title: string;
  date: string; // Start date YYYY-MM-DD
  endDate?: string; // Optional end date YYYY-MM-DD for multi-day events
  time?: string;
  timezone?: string;
  location?: string;
  locationUrl?: string; // Google Maps link
  posterUrl?: string; // Image URL or Base64 data URL
  members: string[]; // member ids
  category?: string;
  link?: string;
  description?: string;
  hashtags?: string;
  watchPlatforms?: WatchPlatform[];
  notes?: string;
}

export interface UserReminder {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  userTimezone: string;
  convertedTimeStr: string;
  timingMinutes: number;
  timingLabel: string;
  type: 'calendar' | 'email' | 'sms' | 'whatsapp' | 'browser';
  targetContact?: string;
  createdAt: string;
}

export type TitleSizeChoice = 'compact' | 'medium' | 'large' | 'xlarge';
export type SubtitleSizeChoice = 'small' | 'medium' | 'large' | 'xlarge';

export interface AppSettings {
  greeting: string;
  bannerTitle: string;
  bannerTitleSize?: TitleSizeChoice;
  bannerSubtitle: string;
  bannerSubtitleSize?: SubtitleSizeChoice;
  bannerTag?: string;
  bannerImageUrl: string;
  bannerPhotos?: string[]; // Multiple photos carousel
  bannerFit?: 'cover' | 'contain'; // Cover vs Contain
  bannerHeight?: 'compact' | 'medium' | 'tall' | 'auto'; // Customizable slot height
  bannerPreset: string;
  websiteIcon?: string;
  ownerPin: string; // Master passcode: full control over banner, settings, members & events
  adminPin: string; // Helper passcode: can only add and edit calendar events
  timeFormat?: '12h' | '24h';
  members: Member[];
}

export interface BannerPreset {
  id: string;
  name: string;
  gradient: string;
}

export interface TimezoneOption {
  code: string;
  label: string;
  offset: string;
  numericOffset: number;
  region: string;
  category: 'Popular Fan Zones' | 'Asia & Pacific' | 'Americas' | 'Europe & Africa' | 'Other';
}

export interface CountryCodeOption {
  country: string;
  code: string;
  flag: string;
}

// --- Country Calling Codes for SMS Reminders ---
const COUNTRY_CODES: CountryCodeOption[] = [
  { country: 'Thailand', code: '+66', flag: '🇹🇭' },
  { country: 'Philippines', code: '+63', flag: '🇵🇭' },
  { country: 'Japan', code: '+81', flag: '🇯🇵' },
  { country: 'South Korea', code: '+82', flag: '🇰🇷' },
  { country: 'Singapore', code: '+65', flag: '🇸🇬' },
  { country: 'Malaysia', code: '+60', flag: '🇲🇾' },
  { country: 'Indonesia', code: '+62', flag: '🇮🇩' },
  { country: 'Taiwan', code: '+886', flag: '🇹🇼' },
  { country: 'Hong Kong', code: '+852', flag: '🇭🇰' },
  { country: 'Vietnam', code: '+84', flag: '🇻🇳' },
  { country: 'United States & Canada', code: '+1', flag: '🇺🇸' },
  { country: 'United Kingdom', code: '+44', flag: '🇬🇧' },
  { country: 'Australia', code: '+61', flag: '🇦🇺' },
  { country: 'Germany', code: '+49', flag: '🇩🇪' },
  { country: 'France', code: '+33', flag: '🇫🇷' },
  { country: 'Italy', code: '+39', flag: '🇮🇹' },
  { country: 'Spain', code: '+34', flag: '🇪🇸' },
  { country: 'Brazil', code: '+55', flag: '🇧🇷' },
  { country: 'India', code: '+91', flag: '🇮🇳' },
  { country: 'Mexico', code: '+52', flag: '🇲🇽' }
];

// --- Comprehensive World Timezone Directory ---
const ALL_TIMEZONES: TimezoneOption[] = [
  // Popular fan schedule zones first
  { code: 'BKK', label: 'BKK - Bangkok', offset: 'UTC+7', numericOffset: 7, region: 'Thailand, Vietnam, Jakarta', category: 'Popular Fan Zones' },
  { code: 'JST', label: 'JST - Tokyo', offset: 'UTC+9', numericOffset: 9, region: 'Japan', category: 'Popular Fan Zones' },
  { code: 'KST', label: 'KST - Seoul', offset: 'UTC+9', numericOffset: 9, region: 'South Korea', category: 'Popular Fan Zones' },
  { code: 'PHT', label: 'PHT - Manila', offset: 'UTC+8', numericOffset: 8, region: 'Philippines', category: 'Popular Fan Zones' },
  { code: 'SGT', label: 'SGT - Singapore', offset: 'UTC+8', numericOffset: 8, region: 'Singapore', category: 'Popular Fan Zones' },
  { code: 'MYT', label: 'MYT - Kuala Lumpur', offset: 'UTC+8', numericOffset: 8, region: 'Malaysia', category: 'Popular Fan Zones' },
  { code: 'HKT', label: 'HKT - Hong Kong', offset: 'UTC+8', numericOffset: 8, region: 'Hong Kong', category: 'Popular Fan Zones' },
  { code: 'TPE', label: 'TPE - Taipei (CST)', offset: 'UTC+8', numericOffset: 8, region: 'Taiwan', category: 'Popular Fan Zones' },
  { code: 'WIB', label: 'WIB - Jakarta', offset: 'UTC+7', numericOffset: 7, region: 'Western Indonesia', category: 'Popular Fan Zones' },
  { code: 'UTC', label: 'UTC - Universal Time', offset: 'UTC+0', numericOffset: 0, region: 'Coordinated Universal Time', category: 'Popular Fan Zones' },
  { code: 'GMT', label: 'GMT/BST - London', offset: 'UTC+0/+1', numericOffset: 1, region: 'United Kingdom, Ireland', category: 'Popular Fan Zones' },
  { code: 'CET', label: 'CET/CEST - Central Europe', offset: 'UTC+1/+2', numericOffset: 2, region: 'Paris, Rome, Berlin, Madrid', category: 'Popular Fan Zones' },
  { code: 'PST', label: 'PST/PDT - US Pacific', offset: 'UTC-8/-7', numericOffset: -7, region: 'Los Angeles, San Francisco, Vancouver', category: 'Popular Fan Zones' },
  { code: 'EST', label: 'EST/EDT - US Eastern', offset: 'UTC-5/-4', numericOffset: -4, region: 'New York, Toronto, Miami', category: 'Popular Fan Zones' },
  { code: 'CST_US', label: 'CST/CDT - US Central', offset: 'UTC-6/-5', numericOffset: -5, region: 'Chicago, Dallas, Mexico City', category: 'Popular Fan Zones' },
  { code: 'AEST', label: 'AEST - Sydney', offset: 'UTC+10', numericOffset: 10, region: 'Sydney, Melbourne, Brisbane', category: 'Popular Fan Zones' },

  // Asia & Pacific
  { code: 'ICT', label: 'ICT - Indochina Time', offset: 'UTC+7', numericOffset: 7, region: 'Bangkok, Phnom Penh, Vientiane', category: 'Asia & Pacific' },
  { code: 'WITA', label: 'WITA - Central Indonesia', offset: 'UTC+8', numericOffset: 8, region: 'Bali, Makassar', category: 'Asia & Pacific' },
  { code: 'WIT', label: 'WIT - Eastern Indonesia', offset: 'UTC+9', numericOffset: 9, region: 'Jayapura, Maluku', category: 'Asia & Pacific' },
  { code: 'IST', label: 'IST - India Standard Time', offset: 'UTC+5:30', numericOffset: 5.5, region: 'New Delhi, Mumbai, Colombo', category: 'Asia & Pacific' },
  { code: 'NPT', label: 'NPT - Nepal Time', offset: 'UTC+5:45', numericOffset: 5.75, region: 'Kathmandu', category: 'Asia & Pacific' },
  { code: 'PKT', label: 'PKT - Pakistan Standard', offset: 'UTC+5', numericOffset: 5, region: 'Karachi, Islamabad, Tashkent', category: 'Asia & Pacific' },
  { code: 'BST_BD', label: 'BST - Bangladesh Standard', offset: 'UTC+6', numericOffset: 6, region: 'Dhaka, Almaty', category: 'Asia & Pacific' },
  { code: 'MMT', label: 'MMT - Myanmar Time', offset: 'UTC+6:30', numericOffset: 6.5, region: 'Yangon, Naypyidaw', category: 'Asia & Pacific' },
  { code: 'ACST', label: 'ACST - Central Australia', offset: 'UTC+9:30', numericOffset: 9.5, region: 'Adelaide, Darwin', category: 'Asia & Pacific' },
  { code: 'AWST', label: 'AWST - Western Australia', offset: 'UTC+8', numericOffset: 8, region: 'Perth', category: 'Asia & Pacific' },
  { code: 'NZST', label: 'NZST - New Zealand', offset: 'UTC+12/+13', numericOffset: 13, region: 'Auckland, Wellington', category: 'Asia & Pacific' },
  { code: 'FJT', label: 'FJT - Fiji Time', offset: 'UTC+12', numericOffset: 12, region: 'Suva', category: 'Asia & Pacific' },
  { code: 'TOT', label: 'TOT - Tonga Time', offset: 'UTC+13', numericOffset: 13, region: "Nuku'alofa", category: 'Asia & Pacific' },
  { code: 'LINT', label: 'LINT - Line Islands', offset: 'UTC+14', numericOffset: 14, region: 'Kiritimati', category: 'Asia & Pacific' },
  { code: 'CHAST', label: 'CHAST - Chatham Islands', offset: 'UTC+12:45', numericOffset: 12.75, region: 'Chatham Islands', category: 'Asia & Pacific' },

  // Americas
  { code: 'HST', label: 'HST - Hawaii Standard', offset: 'UTC-10', numericOffset: -10, region: 'Honolulu, Tahiti', category: 'Americas' },
  { code: 'AKST', label: 'AKST - Alaska Standard', offset: 'UTC-9', numericOffset: -9, region: 'Anchorage, Juneau', category: 'Americas' },
  { code: 'MST', label: 'MST/MDT - US Mountain', offset: 'UTC-7/-6', numericOffset: -6, region: 'Denver, Phoenix, Calgary', category: 'Americas' },
  { code: 'AST', label: 'AST - Atlantic Standard', offset: 'UTC-4', numericOffset: -4, region: 'Halifax, Santiago, San Juan', category: 'Americas' },
  { code: 'NST', label: 'NST - Newfoundland Time', offset: 'UTC-3:30', numericOffset: -3.5, region: "St. John's", category: 'Americas' },
  { code: 'BRT', label: 'BRT - Brasília Time', offset: 'UTC-3', numericOffset: -3, region: 'São Paulo, Rio de Janeiro', category: 'Americas' },
  { code: 'ART', label: 'ART - Argentina Time', offset: 'UTC-3', numericOffset: -3, region: 'Buenos Aires', category: 'Americas' },
  { code: 'COT', label: 'COT - Colombia Time', offset: 'UTC-5', numericOffset: -5, region: 'Bogotá, Lima, Quito', category: 'Americas' },
  { code: 'SST', label: 'SST - Samoa Standard', offset: 'UTC-11', numericOffset: -11, region: 'Pago Pago, Midway', category: 'Americas' },

  // Europe & Africa & Middle East
  { code: 'WET', label: 'WET - Western European', offset: 'UTC+0', numericOffset: 0, region: 'Lisbon, Casablanca', category: 'Europe & Africa' },
  { code: 'EET', label: 'EET/EEST - Eastern Europe', offset: 'UTC+2/+3', numericOffset: 3, region: 'Athens, Helsinki, Cairo, Istanbul', category: 'Europe & Africa' },
  { code: 'SAST', label: 'SAST - South Africa', offset: 'UTC+2', numericOffset: 2, region: 'Johannesburg, Cape Town', category: 'Europe & Africa' },
  { code: 'EAT', label: 'EAT - East Africa', offset: 'UTC+3', numericOffset: 3, region: 'Nairobi, Addis Ababa', category: 'Europe & Africa' },
  { code: 'GST', label: 'GST - Gulf Standard', offset: 'UTC+4', numericOffset: 4, region: 'Dubai, Abu Dhabi, Muscat', category: 'Europe & Africa' },
  { code: 'AST_ARAB', label: 'AST - Arabia Standard', offset: 'UTC+3', numericOffset: 3, region: 'Riyadh, Doha, Kuwait, Baghdad', category: 'Europe & Africa' },
  { code: 'IRST', label: 'IRST - Iran Standard', offset: 'UTC+3:30', numericOffset: 3.5, region: 'Tehran', category: 'Europe & Africa' },
  { code: 'MSK', label: 'MSK - Moscow Standard', offset: 'UTC+3', numericOffset: 3, region: 'Moscow, Saint Petersburg', category: 'Europe & Africa' },
  { code: 'AZOT', label: 'AZOT - Azores Time', offset: 'UTC-1', numericOffset: -1, region: 'Azores, Cape Verde', category: 'Europe & Africa' },

  // Custom
  { code: 'CUSTOM', label: 'Custom Timezone...', offset: '', numericOffset: 0, region: 'Enter manual code or city', category: 'Other' }
];

const STREAMING_PLATFORM_PRESETS = [
  { name: 'GMMTV', platform: 'YouTube', icon: 'youtube', defaultUrl: 'https://youtube.com/@gmmtv' },
  { name: 'GMMTV', platform: 'Facebook', icon: 'facebook', defaultUrl: 'https://facebook.com/gmmtvofficial' },
  { name: 'TrueID', platform: 'TrueID', icon: 'tv', defaultUrl: 'https://trueid.net' },
  { name: 'WeTV', platform: 'WeTV Thailand', icon: 'tv', defaultUrl: 'https://wetv.vip' },
  { name: 'iQIYI', platform: 'iQIYI', icon: 'tv', defaultUrl: 'https://iq.com' },
  { name: 'AIS PLAY', platform: 'AIS PLAY', icon: 'tv', defaultUrl: 'https://aisplay.ais.co.th' },
  { name: 'Netflix', platform: 'Netflix', icon: 'tv', defaultUrl: 'https://netflix.com' },
  { name: 'X / Twitter', platform: 'Space / Live', icon: 'tv', defaultUrl: 'https://x.com' }
];

const REMINDER_TIMING_OPTIONS = [
  { minutes: 15, label: '15 minutes before' },
  { minutes: 30, label: '30 minutes before' },
  { minutes: 60, label: '1 hour before' },
  { minutes: 120, label: '2 hours before' },
  { minutes: 1440, label: '1 day before' },
  { minutes: 0, label: 'At event start time' }
];

// --- Default Configuration & Presets ---
const BANNER_PRESETS: BannerPreset[] = [
  {
    id: 'avocean-dream',
    name: 'Avocean Pastel',
    gradient: 'linear-gradient(135deg, #DDD6FE 0%, #BAE6FD 52%, #BBF7D0 100%)'
  },
  {
    id: 'sunset-sea',
    name: 'Ocean Sunset',
    gradient: 'linear-gradient(135deg, #FDE68A 0%, #DDD6FE 50%, #7DD3FC 100%)'
  },
  {
    id: 'twilight-wave',
    name: 'Deep Sea Glow',
    gradient: 'linear-gradient(135deg, #C4B5FD 0%, #93C5FD 50%, #6EE7B7 100%)'
  }
];

// --- User Accent Theme Color Options ---
export const ACCENT_THEMES: Record<
  AccentChoice,
  {
    id: AccentChoice;
    name: string;
    emoji: string;
    colorHex: string;
    hoverHex: string;
    lightBg: string;
    lightText: string;
    badgeBorder: string;
  }
> = {
  purple: {
    id: 'purple',
    name: 'Jimmy Purple',
    emoji: '🥑',
    colorHex: '#7C3AED',
    hoverHex: '#6D28D9',
    lightBg: 'bg-purple-50 dark:bg-purple-950/50',
    lightText: 'text-purple-700 dark:text-purple-300',
    badgeBorder: 'border-purple-200 dark:border-purple-800'
  },
  blue: {
    id: 'blue',
    name: 'Sea Blue',
    emoji: '🌊',
    colorHex: '#0284C7',
    hoverHex: '#0369A1',
    lightBg: 'bg-sky-50 dark:bg-sky-950/50',
    lightText: 'text-sky-700 dark:text-sky-300',
    badgeBorder: 'border-sky-200 dark:border-sky-800'
  },
  green: {
    id: 'green',
    name: 'Avocean Green',
    emoji: '💚',
    colorHex: '#16A34A',
    hoverHex: '#15803D',
    lightBg: 'bg-emerald-50 dark:bg-emerald-950/50',
    lightText: 'text-emerald-700 dark:text-emerald-300',
    badgeBorder: 'border-emerald-200 dark:border-emerald-800'
  }
};

const DEFAULT_SETTINGS: AppSettings = {
  greeting: 'Hey ErnestTheStan!',
  bannerTitle: 'JIMMY SEA AVOCEAN HUB',
  bannerTitleSize: 'medium',
  bannerSubtitle: 'Official Fan Schedule, Appearances & Trending Projects 🥑🌊💚',
  bannerSubtitleSize: 'medium',
  bannerImageUrl: '',
  bannerPhotos: [],
  bannerFit: 'cover',
  bannerHeight: 'medium',
  bannerPreset: 'avocean-dream',
  websiteIcon: 'trio',
  ownerPin: 'ErnestTheStan05!',
  adminPin: 'Avocean2026',
  timeFormat: '12h',
  members: [
    {
      id: 'jimmy',
      name: 'Jimmy',
      emoji: '🥑',
      circleBg: '#7C3AED',
      pillBg: '#EFE7FF',
      pillBorder: '#C4B5FD',
      textColor: '#1A3668'
    },
    {
      id: 'sea',
      name: 'Sea',
      emoji: '🌊',
      circleBg: '#0284C7',
      pillBg: '#E0F2FE',
      pillBorder: '#93C5FD',
      textColor: '#1A3668'
    },
    {
      id: 'avocean',
      name: 'Avocean',
      emoji: '💚',
      circleBg: '#16A34A',
      pillBg: '#DCFCE7',
      pillBorder: '#86EFAC',
      textColor: '#1A3668'
    }
  ]
};

const SAMPLE_EVENTS: ScheduleEvent[] = [
  {
    id: 'sample-gmmtvnext',
    title: 'GMMTVNEXT: GENERATION HAPPY',
    date: '2026-11-03',
    endDate: '2026-11-05',
    time: '16:00',
    timezone: 'BKK',
    location: 'UNION HALL, UNION MALL',
    locationUrl: 'https://maps.google.com/?q=Union+Hall+Union+Mall+Bangkok',
    members: ['jimmy', 'sea', 'avocean'],
    category: 'Event',
    link: 'https://x.com/gmmtvofficial',
    description: 'Annual GMMTV press conference & showcase featuring lineup reveals, live artist appearances, and exclusive fan interactions.',
    hashtags: '#GMMTVNEXT #GMMTV2027 #JimmySea #Avocean',
    watchPlatforms: [
      { id: 'w1', name: 'GMMTV', platform: 'YouTube', url: 'https://youtube.com/@gmmtv' },
      { id: 'w2', name: 'GMMTV', platform: 'Facebook', url: 'https://facebook.com/gmmtvofficial' }
    ]
  },
  {
    id: 'sample-1',
    title: 'JimmySea Brand Photoshoot & Live Q&A',
    date: '2026-10-30',
    endDate: '2026-10-31',
    time: '18:00',
    timezone: 'BKK',
    location: 'Siam Paragon, Bangkok',
    locationUrl: 'https://maps.google.com/?q=Siam+Paragon+Bangkok',
    members: ['jimmy', 'sea', 'avocean'],
    category: 'Event',
    link: 'https://x.com',
    description: 'Official brand ambassador launch with exclusive photo corner and worldwide fan questions.',
    hashtags: '#JimmySeaLiveQA #JimmySea #Avocean',
    watchPlatforms: [
      { id: 'w3', name: 'GMMTV', platform: 'YouTube', url: 'https://youtube.com/@gmmtv' }
    ]
  },
  {
    id: 'sample-2',
    title: 'Jimmy Solo Clinic Talk & Book Corner',
    date: '2026-10-24',
    time: '14:00',
    timezone: 'BKK',
    location: 'CentralWorld, Bangkok',
    locationUrl: 'https://maps.google.com/?q=CentralWorld+Bangkok',
    members: ['jimmy'],
    category: 'Appearance',
    link: '',
    description: 'Dr. Jimmy sharing health insights and signing special edition journals on the 1st floor.',
    hashtags: '#DoctorJimmy #JimmyJitaraphol'
  },
  {
    id: 'sample-3',
    title: 'Sea BadmintoDay Charity Match',
    date: '2026-10-26',
    time: '16:30',
    timezone: 'BKK',
    location: 'GMMTV Live Studio',
    locationUrl: '',
    members: ['sea'],
    category: 'Broadcast',
    link: 'https://youtube.com',
    description: 'National athlete Sea Tawinan exhibition match raising funds for children sports equipment.',
    hashtags: '#SeaTawinan #BadmintonDayWithSea',
    watchPlatforms: [
      { id: 'w4', name: 'GMMTV', platform: 'YouTube', url: 'https://youtube.com' }
    ]
  },
  {
    id: 'sample-4',
    title: 'Avocean Halloween Fan Project & Space',
    date: '2026-10-31',
    time: '20:00',
    timezone: 'BKK',
    location: 'X (Twitter) Space',
    locationUrl: '',
    members: ['avocean', 'jimmy', 'sea'],
    category: 'Fan Event',
    link: 'https://x.com',
    description: 'Worldwide fandom gathering, Halloween costume reveals, fan art sharing and giveaways.',
    hashtags: '#AvoceanHalloween2026 #JimmySeaFandom',
    watchPlatforms: [
      { id: 'w5', name: 'X / Twitter', platform: 'Space', url: 'https://x.com' }
    ]
  }
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const STORAGE_SETTINGS_KEY = 'avocean_calendar_settings_v5';
const STORAGE_EVENTS_KEY = 'avocean_calendar_events_v5';
const STORAGE_ADMIN_KEY = 'avocean_is_admin_v5';
const STORAGE_ROLE_KEY = 'avocean_user_role_v5';
const STORAGE_REMINDERS_KEY = 'avocean_user_reminders_v4';
const STORAGE_DARK_MODE_KEY = 'avocean_dark_mode_v5';

// Helper to format YYYY-MM-DD
const toDateKey = (year: number, month: number, day: number) => {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
};

// Parse YYYY-MM-DD safely in local time
const parseDateKey = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

// Calculate all YYYY-MM-DD date keys in a range [startDate, endDate]
const getDateRangeKeys = (startDateStr: string, endDateStr?: string): string[] => {
  if (!endDateStr || endDateStr <= startDateStr) {
    return [startDateStr];
  }
  const keys: string[] = [];
  const start = parseDateKey(startDateStr);
  const end = parseDateKey(endDateStr);

  const curr = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  let count = 0;
  while (curr <= end && count < 31) {
    keys.push(toDateKey(curr.getFullYear(), curr.getMonth(), curr.getDate()));
    curr.setDate(curr.getDate() + 1);
    count++;
  }
  return keys.length > 0 ? keys : [startDateStr];
};

// Calculate number of days in an event (1 for single-day, 2 or 3+ for multi-day)
const getEventDaysCount = (startDateStr: string, endDateStr?: string): number => {
  if (!endDateStr || endDateStr <= startDateStr) return 1;
  const start = parseDateKey(startDateStr);
  const end = parseDateKey(endDateStr);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24)) + 1;
  return Math.max(1, Math.min(31, diffDays));
};

// Format full readable date range string (e.g. "Friday, 30 – Saturday, 31 October 2026 (2-Day Event)")
const formatEventFullDateRange = (startDateStr: string, endDateStr?: string): string => {
  const startDt = parseDateKey(startDateStr);
  const startDayName = FULL_DAYS[startDt.getDay()];
  const startDayNum = startDt.getDate();
  const startMonthName = MONTHS[startDt.getMonth()];
  const startYear = startDt.getFullYear();

  if (!endDateStr || endDateStr <= startDateStr) {
    return `${startDayName}, ${startDayNum} ${startMonthName} ${startYear}`;
  }

  const endDt = parseDateKey(endDateStr);
  const endDayName = FULL_DAYS[endDt.getDay()];
  const endDayNum = endDt.getDate();
  const endMonthName = MONTHS[endDt.getMonth()];
  const endYear = endDt.getFullYear();
  const daysCount = getEventDaysCount(startDateStr, endDateStr);

  if (startMonthName === endMonthName && startYear === endYear) {
    return `${startDayName}, ${startDayNum} – ${endDayName}, ${endDayNum} ${startMonthName} ${startYear} (${daysCount}-Day Event)`;
  }

  if (startYear === endYear) {
    return `${startDayName}, ${startDayNum} ${startMonthName} – ${endDayName}, ${endDayNum} ${endMonthName} ${startYear} (${daysCount}-Day Event)`;
  }

  return `${startDayName}, ${startDayNum} ${startMonthName} ${startYear} – ${endDayName}, ${endDayNum} ${endMonthName} ${endYear} (${daysCount}-Day Event)`;
};

// Short format for badges or pills e.g. "30–31 Oct (2D)"
const formatEventShortDateRange = (startDateStr: string, endDateStr?: string): string => {
  const startDt = parseDateKey(startDateStr);
  const startDay = startDt.getDate();
  const startMonth = SHORT_MONTHS[startDt.getMonth()];

  if (!endDateStr || endDateStr <= startDateStr) {
    return `${startDay} ${startMonth}`;
  }

  const endDt = parseDateKey(endDateStr);
  const endDay = endDt.getDate();
  const endMonth = SHORT_MONTHS[endDt.getMonth()];
  const daysCount = getEventDaysCount(startDateStr, endDateStr);

  if (startMonth === endMonth) {
    return `${startDay}–${endDay} ${startMonth} (${daysCount}D)`;
  }
  return `${startDay} ${startMonth} – ${endDay} ${endMonth} (${daysCount}D)`;
};

// Get numeric offset in hours for any timezone code
const getTimezoneOffsetHours = (tzCode?: string): number => {
  if (!tzCode) return 7;
  const found = ALL_TIMEZONES.find((t) => t.code === tzCode);
  return found ? found.numericOffset : 7;
};

// Convert 24h or any time string to 12h AM/PM format (e.g. "18:00" -> "6:00 PM")
const formatTime12h = (timeStr?: string): string => {
  if (!timeStr) return '';
  const trimmed = timeStr.trim();
  if (!trimmed) return '';

  // Already has AM / PM
  if (/(am|pm)/i.test(trimmed)) {
    return trimmed.replace(/(\d{1,2}:\d{2})\s*(am|pm)/i, (_, t, p) => `${t} ${p.toUpperCase()}`);
  }

  // Matches "HH:mm" or "H:mm" with optional trailing text (e.g. "18:00 BKK")
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?:\s+(.+))?$/);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const trailing = match[3] ? ` ${match[3].trim()}` : '';
    if (!isNaN(hours) && hours >= 0 && hours <= 24) {
      const period = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      if (hours === 0) hours = 12;
      return `${hours}:${minutes} ${period}${trailing}`;
    }
  }

  // Matches single hour "HH"
  const matchHour = trimmed.match(/^(\d{1,2})(?:\s+(.+))?$/);
  if (matchHour) {
    let hours = parseInt(matchHour[1], 10);
    const trailing = matchHour[2] ? ` ${matchHour[2].trim()}` : '';
    if (!isNaN(hours) && hours >= 0 && hours <= 24) {
      const period = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      if (hours === 0) hours = 12;
      return `${hours}:00 ${period}${trailing}`;
    }
  }

  return trimmed;
};

// Parse any time string (12h or 24h) to [hour24, minute]
const parseHourAndMinute = (timeStr?: string): [number, number] => {
  if (!timeStr) return [18, 0];
  const trimmed = timeStr.trim();
  const match12 = trimmed.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (match12) {
    let h = parseInt(match12[1], 10);
    const m = parseInt(match12[2], 10);
    const mer = match12[3]?.toUpperCase();
    if (mer === 'PM' && h < 12) h += 12;
    if (mer === 'AM' && h === 12) h = 0;
    return [isNaN(h) ? 18 : h, isNaN(m) ? 0 : m];
  }
  if (trimmed.includes(':')) {
    const [h, m] = trimmed.split(':').map(Number);
    return [isNaN(h) ? 18 : h, isNaN(m) ? 0 : m];
  }
  const h = parseInt(trimmed, 10);
  return [isNaN(h) ? 18 : h, 0];
};

// Time converter between timezones (with 12-hour AM/PM primary output)
const convertEventTimeAndDate = (
  timeStr: string = '18:00',
  fromTzCode: string = 'BKK',
  toTzCode: string = 'BKK',
  dateStr: string = '2026-11-03',
  prefer12h: boolean = true
) => {
  const [h, m] = parseHourAndMinute(timeStr);

  const fromOffset = getTimezoneOffsetHours(fromTzCode);
  const toOffset = getTimezoneOffsetHours(toTzCode);
  const diffHours = toOffset - fromOffset;

  const [y, mon, d] = dateStr.split('-').map(Number);
  const baseUtcMs = Date.UTC(y, mon - 1, d, h, m || 0);
  const convertedMs = baseUtcMs + diffHours * 3600 * 1000;
  const convertedDate = new Date(convertedMs);

  const utcHours = convertedDate.getUTCHours();
  const newM = String(convertedDate.getUTCMinutes()).padStart(2, '0');

  // 12-hour format with AM/PM (e.g. 7:00 PM)
  const period = utcHours >= 12 ? 'PM' : 'AM';
  let h12 = utcHours % 12;
  if (h12 === 0) h12 = 12;
  const convertedTime12 = `${h12}:${newM} ${period}`;
  const convertedTime24 = `${String(utcHours).padStart(2, '0')}:${newM}`;

  const convertedDateStr = toDateKey(
    convertedDate.getUTCFullYear(),
    convertedDate.getUTCMonth(),
    convertedDate.getUTCDate()
  );

  let dayShift = '';
  if (convertedDateStr > dateStr) {
    dayShift = '(+1 day next day)';
  } else if (convertedDateStr < dateStr) {
    dayShift = '(-1 day previous day)';
  }

  return {
    time: prefer12h ? convertedTime12 : convertedTime24,
    time12: convertedTime12,
    time24: convertedTime24,
    date: convertedDateStr,
    dayShift,
    fullDateLabel: `${FULL_DAYS[convertedDate.getUTCDay()]}, ${convertedDate.getUTCDate()} ${SHORT_MONTHS[convertedDate.getUTCMonth()]}`
  };
};

// Format event time and timezone in 12-hour format (e.g. "6:00 PM BKK")
const formatEventTime = (ev: ScheduleEvent, prefer12h: boolean = true) => {
  if (!ev.time) return null;
  const formatted = prefer12h ? formatTime12h(ev.time) : ev.time;
  const tz = ev.timezone ? (ev.timezone === 'CST_US' ? 'CST' : ev.timezone) : '';
  if (tz) {
    if (formatted.toLowerCase().includes(tz.toLowerCase())) {
      return formatted;
    }
    return `${formatted} ${tz}`;
  }
  return formatted;
};

// Generate 1-Click Google Calendar URL
const createGoogleCalendarUrl = (ev: ScheduleEvent) => {
  const fromOffset = getTimezoneOffsetHours(ev.timezone || 'BKK');
  const [h, m] = parseHourAndMinute(ev.time || '18:00');
  const [year, month, day] = ev.date.split('-').map(Number);

  const utcMs = Date.UTC(year, month - 1, day, h - fromOffset, m || 0);
  const startDate = new Date(utcMs);

  const endTargetDateStr = ev.endDate && ev.endDate > ev.date ? ev.endDate : ev.date;
  const [endYear, endMonth, endDay] = endTargetDateStr.split('-').map(Number);
  const endDurationHours = ev.endDate && ev.endDate > ev.date ? 4 : 2;
  const endDate = new Date(Date.UTC(endYear, endMonth - 1, endDay, h - fromOffset + endDurationHours, m || 0));

  const formatUtc = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');

  const startUtc = formatUtc(startDate);
  const endUtc = formatUtc(endDate);

  const title = encodeURIComponent(ev.title);
  const watchLinks = (ev.watchPlatforms || []).map((w) => `${w.name} (${w.platform}): ${w.url}`).join('\n');
  const details = encodeURIComponent(
    `${ev.description || ''}\n\n${ev.hashtags || ''}\n\nWhere to watch:\n${watchLinks}\n\n${ev.link ? `Event Link: ${ev.link}` : ''}`
  );
  const location = encodeURIComponent(ev.location || '');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startUtc}/${endUtc}&details=${details}&location=${location}`;
};

// Generate and download .ics file
const downloadIcsFile = (ev: ScheduleEvent, reminderMinutes: number = 15) => {
  const fromOffset = getTimezoneOffsetHours(ev.timezone || 'BKK');
  const [h, m] = parseHourAndMinute(ev.time || '18:00');
  const [year, month, day] = ev.date.split('-').map(Number);

  const utcMs = Date.UTC(year, month - 1, day, h - fromOffset, m || 0);
  const startDate = new Date(utcMs);

  const endTargetDateStr = ev.endDate && ev.endDate > ev.date ? ev.endDate : ev.date;
  const [endYear, endMonth, endDay] = endTargetDateStr.split('-').map(Number);
  const endDurationHours = ev.endDate && ev.endDate > ev.date ? 4 : 2;
  const endDate = new Date(Date.UTC(endYear, endMonth - 1, endDay, h - fromOffset + endDurationHours, m || 0));

  const formatUtc = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');
  const nowUtc = formatUtc(new Date());

  const watchLinks = (ev.watchPlatforms || []).map((w) => `${w.name} (${w.platform}): ${w.url}`).join('\\n');
  const descriptionText = `${(ev.description || '').replace(/\n/g, '\\n')}\\n\\n${ev.hashtags || ''}\\n\\nWatch:\\n${watchLinks}`;

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Avocean//JimmySea Schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:avocean-${ev.id}-${Date.now()}@avocean.app`,
    `DTSTAMP:${nowUtc}`,
    `DTSTART:${formatUtc(startDate)}`,
    `DTEND:${formatUtc(endDate)}`,
    `SUMMARY:${ev.title}`,
    `DESCRIPTION:${descriptionText}`,
    `LOCATION:${ev.location || ''}`,
    'BEGIN:VALARM',
    `TRIGGER:-PT${reminderMinutes}M`,
    'ACTION:DISPLAY',
    `DESCRIPTION:Reminder: ${ev.title} starts soon!`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ];

  const blob = new Blob([icsLines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${ev.title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Custom Badge Component for individual member
const MemberCircleIcon: React.FC<{
  member: Member;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ member, size = 'md', className = '' }) => {
  const sizeClasses = {
    xs: 'w-4 h-4 text-[9px]',
    sm: 'w-6 h-6 text-xs',
    md: 'w-7 h-7 text-sm',
    lg: 'w-11 h-11 text-xl'
  };

  return (
    <span
      style={{ backgroundColor: member.circleBg }}
      className={`inline-flex items-center justify-center rounded-full text-white select-none shrink-0 shadow-xs ${sizeClasses[size] || sizeClasses.md} ${className}`}
      title={member.name}
    >
      <span className="leading-none">{member.emoji}</span>
    </span>
  );
};

// Overlapping Trio Logo Component
const TrioBadges: React.FC<{ members: Member[]; size?: 'sm' | 'lg' }> = ({
  members,
  size = 'sm'
}) => {
  const dims =
    size === 'lg'
      ? { circle: 'w-12 h-12 text-xl border-[3px] border-white dark:border-slate-800', overlap: '-ml-2.5' }
      : { circle: 'w-5 h-5 text-[10px] border-[1.5px] border-white dark:border-slate-800', overlap: '-ml-1.5' };

  return (
    <div className="inline-flex items-center justify-center">
      {members.map((m, idx) => (
        <div
          key={m.id}
          style={{ backgroundColor: m.circleBg, zIndex: idx + 1 }}
          className={`rounded-full flex items-center justify-center text-white shadow-xs select-none ${dims.circle} ${
            idx > 0 ? dims.overlap : ''
          }`}
        >
          <span className="leading-none">{m.emoji}</span>
        </div>
      ))}
    </div>
  );
};

export default function App() {
  // --- Dark Mode State --- (Defaults to dark mode as requested)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_DARK_MODE_KEY);
      if (saved !== null) return saved === 'true';
      return true; // Default to sleek dark mode
    } catch {
      return true;
    }
  });

  // Toggle Dark Mode
  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_DARK_MODE_KEY, String(next));
      } catch (e) {
        console.warn('Dark mode storage failed', e);
      }
      return next;
    });
  };

  // Sync isDarkMode to documentElement so Tailwind dark variant only applies in dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);

  // --- Role & Access Control State (Visitor, Admin, Owner) ---
  const [userRole, setUserRole] = useState<UserRole>(() => {
    try {
      const savedRole = localStorage.getItem(STORAGE_ROLE_KEY);
      if (savedRole === 'owner' || savedRole === 'admin') {
        return savedRole;
      }
      if (localStorage.getItem(STORAGE_ADMIN_KEY) === 'true') {
        return 'owner';
      }
      return 'visitor';
    } catch {
      return 'visitor';
    }
  });

  const isOwner = userRole === 'owner';
  const isAdmin = userRole === 'admin';
  const canEditEvents = isOwner || isAdmin;

  // Login Modal State (Distinct Owner and Admin logins)
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);
  const [loginRoleTab, setLoginRoleTab] = useState<'admin' | 'owner'>('owner');
  const [loginPinInput, setLoginPinInput] = useState<string>('');
  const [loginPinError, setLoginPinError] = useState<string>('');
  const [showLoginPin, setShowLoginPin] = useState<boolean>(false);

  // Dedicated Passcode Management Modal State (Owner can manage both Owner & Admin codes)
  const [changePasscodeModalOpen, setChangePasscodeModalOpen] = useState<boolean>(false);
  const [passcodeModalTab, setPasscodeModalTab] = useState<'owner' | 'admin'>('owner');
  const [currentOwnerPinCheck, setCurrentOwnerPinCheck] = useState<string>('');
  const [newOwnerPinInput, setNewOwnerPinInput] = useState<string>('');
  const [confirmOwnerPinInput, setConfirmOwnerPinInput] = useState<string>('');
  const [newAdminPinInput, setNewAdminPinInput] = useState<string>('');
  const [passcodeError, setPasscodeError] = useState<string>('');
  const [showPasscodeField, setShowPasscodeField] = useState<boolean>(false);

  // Calendar State (Default to Friday, 30 October 2026 matching requested view)
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => new Date(2026, 9, 1));
  const [selectedDateStr, setSelectedDateStr] = useState<string>('2026-10-30');
  const [showWeekOnly, setShowWeekOnly] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'calendar' | 'list'>('calendar');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDayActiveEventId, setSelectedDayActiveEventId] = useState<string | null>(null);

  // Settings & Events State
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const resolvedOwnerPin =
          !parsed.ownerPin || parsed.ownerPin === 'avocean2026'
            ? 'ErnestTheStan05!'
            : parsed.ownerPin;
        const resolvedAdminPin =
          !parsed.adminPin || parsed.adminPin === 'admin2026' || parsed.adminPin === 'avocean2026'
            ? 'Avocean2026'
            : parsed.adminPin;

        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          ownerPin: resolvedOwnerPin,
          adminPin: resolvedAdminPin,
          bannerTitle: parsed.bannerTitle || 'JIMMY SEA AVOCEAN HUB',
          bannerTitleSize: parsed.bannerTitleSize || 'medium',
          bannerSubtitle: parsed.bannerSubtitle || DEFAULT_SETTINGS.bannerSubtitle,
          bannerSubtitleSize: parsed.bannerSubtitleSize || 'medium',
          timeFormat: parsed.timeFormat || '12h',
          websiteIcon: parsed.websiteIcon || 'trio'
        };
      }
    } catch (e) {
      console.warn('Could not load settings from storage', e);
    }
    return DEFAULT_SETTINGS;
  });

  const is12Hour = (settings.timeFormat || '12h') === '12h';

  const [events, setEvents] = useState<ScheduleEvent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_EVENTS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not load events from storage', e);
    }
    return SAMPLE_EVENTS;
  });

  const [activeMemberIds, setActiveMemberIds] = useState<string[]>(['jimmy', 'sea', 'avocean']);

  // User Saved Reminders State
  const [userReminders, setUserReminders] = useState<UserReminder[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_REMINDERS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modals & UI State
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [eventModalOpen, setEventModalOpen] = useState<boolean>(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  // Default selected event set to 'sample-1' (JimmySea Brand Photoshoot & Live Q&A on Oct 30)
  const [detailEvent, setDetailEvent] = useState<ScheduleEvent | null>(() => {
    return SAMPLE_EVENTS.find((e) => e.id === 'sample-1') || SAMPLE_EVENTS[0] || null;
  });
  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);
  const [backupModalOpen, setBackupModalOpen] = useState<boolean>(false);
  const [myRemindersModalOpen, setMyRemindersModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedHashtags, setCopiedHashtags] = useState<boolean>(false);

  // --- Personal Accent Color Choice (Purple, Blue, Green) ---
  const [accentColor, setAccentColor] = useState<AccentChoice>(() => {
    try {
      const saved = localStorage.getItem('avocean_accent_theme_choice') as AccentChoice;
      if (saved && (saved === 'purple' || saved === 'blue' || saved === 'green')) {
        return saved;
      }
    } catch {}
    return 'purple';
  });

  const currentAccent = ACCENT_THEMES[accentColor] || ACCENT_THEMES.purple;

  const handleSelectAccent = (choice: AccentChoice) => {
    setAccentColor(choice);
    try {
      localStorage.setItem('avocean_accent_theme_choice', choice);
    } catch {}
    showToast(`Accent theme updated to ${ACCENT_THEMES[choice].name}!`);
  };

  // --- Real-Time Firestore Presence, Visitor Count & Cloud Sync ---
  const [visitorStats, setVisitorStats] = useState<{ totalVisits: number; liveViewers: number }>(() => {
    try {
      const raw = localStorage.getItem('avocean_visitor_stats_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          totalVisits: parsed.totalVisits || 4821,
          liveViewers: parsed.liveViewers || 1
        };
      }
    } catch {}
    return {
      totalVisits: 4821,
      liveViewers: 1
    };
  });

  // Verify connection to Firestore on boot
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // Real-Time Online Presence & Total Visits from Firestore
  useEffect(() => {
    const unsubscribe = startLivePresenceTracking((liveStats) => {
      setVisitorStats(liveStats);
      try {
        localStorage.setItem('avocean_visitor_stats_v1', JSON.stringify(liveStats));
      } catch {}
    });
    return () => unsubscribe();
  }, []);

  // Real-Time Events Sync from Firestore across all devices
  useEffect(() => {
    const unsubscribe = subscribeToEvents(SAMPLE_EVENTS, (cloudEvents) => {
      setEvents(cloudEvents);
      try {
        localStorage.setItem(STORAGE_EVENTS_KEY, JSON.stringify(cloudEvents));
      } catch {}
    });
    return () => unsubscribe();
  }, []);

  // Ensure detailEvent is always valid and does not reference a deleted event
  useEffect(() => {
    if (detailEvent && !events.some((e) => e.id === detailEvent.id)) {
      setDetailEvent(events.length > 0 ? events[0] : null);
    }
  }, [events, detailEvent]);

  // Real-Time Settings & Banner Sync from Firestore
  useEffect(() => {
    const unsubscribe = subscribeToSettings(DEFAULT_SETTINGS, (cloudSettings) => {
      setSettings((prev) => ({
        ...prev,
        ...cloudSettings
      }));
    });
    return () => unsubscribe();
  }, []);

  // --- "Leave a message" State (Viewers submit; only Admin & Owner can read) ---
  const [leaveMessageModalOpen, setLeaveMessageModalOpen] = useState<boolean>(false);
  const [inboxModalOpen, setInboxModalOpen] = useState<boolean>(false);
  const [fanMessages, setFanMessages] = useState<FanMessage[]>(() => {
    try {
      const saved = localStorage.getItem('avocean_fan_messages_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'msg-sample-1',
        senderName: 'PolcaAvocean',
        eventTitle: 'JimmySea Special Live Stream on GMMTV Official',
        eventDate: '2026-11-08',
        sourceUrl: 'https://x.com/gmmtvofficial',
        message: 'Hi admins & owner! Official GMMTV account just posted that Jimmy and Sea will be guests for an online shopping live stream next Sunday at 19:00 BKK. Could you add it to the schedule? 🥑🌊',
        createdAt: '2026-10-27T10:30:00Z',
        isRead: false
      }
    ];
  });

  // Real-Time Fan Messages Sync from Firestore
  useEffect(() => {
    const unsubscribe = subscribeToFanMessages((cloudMsgs) => {
      if (cloudMsgs && cloudMsgs.length > 0) {
        setFanMessages(cloudMsgs);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('avocean_fan_messages_v1', JSON.stringify(fanMessages));
    } catch {}
  }, [fanMessages]);

  const [msgSenderName, setMsgSenderName] = useState<string>('');
  const [msgEventTitle, setMsgEventTitle] = useState<string>('');
  const [msgEventDate, setMsgEventDate] = useState<string>('');
  const [msgSourceUrl, setMsgSourceUrl] = useState<string>('');
  const [msgContent, setMsgContent] = useState<string>('');
  const [messageSubmitted, setMessageSubmitted] = useState<boolean>(false);

  const unreadMessageCount = useMemo(() => {
    return fanMessages.filter((m) => !m.isRead).length;
  }, [fanMessages]);

  const handleSendFanMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgContent.trim() && !msgEventTitle.trim()) return;

    const newMsg: FanMessage = {
      id: `msg-${Date.now()}`,
      senderName: msgSenderName.trim() || 'Avocean Fan',
      eventTitle: msgEventTitle.trim() || 'Fan Note / Suggestion',
      eventDate: msgEventDate || undefined,
      sourceUrl: msgSourceUrl.trim() || undefined,
      message: msgContent.trim(),
      createdAt: new Date().toISOString(),
      isRead: false
    };

    setFanMessages((prev) => [newMsg, ...prev]);
    // Save to Firestore cloud database
    sendFanMessageToFirestore(newMsg).catch((err) => console.warn('Could not sync message to Firestore:', err));

    setMessageSubmitted(true);
    setTimeout(() => {
      setMessageSubmitted(false);
      setLeaveMessageModalOpen(false);
      setMsgSenderName('');
      setMsgEventTitle('');
      setMsgEventDate('');
      setMsgSourceUrl('');
      setMsgContent('');
      showToast('💌 Message sent to Admins & Owner! Thank you for the update.');
    }, 1500);
  };

  const handlePrefillEventFromMessage = (msg: FanMessage) => {
    setInboxModalOpen(false);
    openAddEventModal(msg.eventDate || selectedDateStr);
    if (msg.eventTitle) setFormTitle(msg.eventTitle);
    if (msg.eventDate) setFormDate(msg.eventDate);
    if (msg.sourceUrl) setFormLink(msg.sourceUrl);
    if (msg.message) setFormDescription(msg.message);
    // Mark as read
    handleMarkMessageRead(msg.id);
    showToast('Event details pre-filled from message!');
  };

  const handleMarkMessageRead = (id: string) => {
    const target = fanMessages.find((m) => m.id === id);
    if (target) {
      updateFanMessageInFirestore(id, { isRead: !target.isRead }).catch(() => {});
    }
    setFanMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isRead: !m.isRead } : m))
    );
  };

  const handleDeleteMessage = (id: string) => {
    deleteFanMessageFromFirestore(id).catch(() => {});
    setFanMessages((prev) => prev.filter((m) => m.id !== id));
    showToast('Message removed');
  };

  // --- Banner Photos Carousel & Sizing State (Admin & Owner) ---
  const [bannerPhotosModalOpen, setBannerPhotosModalOpen] = useState<boolean>(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState<number>(0);
  const [newBannerUrlInput, setNewBannerUrlInput] = useState<string>('');

  // Active list of banner photos (either settings.bannerPhotos, or fallback to settings.bannerImageUrl)
  const activeBannerPhotos: string[] = useMemo(() => {
    if (settings.bannerPhotos && settings.bannerPhotos.length > 0) {
      return settings.bannerPhotos;
    }
    if (settings.bannerImageUrl) {
      return [settings.bannerImageUrl];
    }
    return [];
  }, [settings.bannerPhotos, settings.bannerImageUrl]);

  // Rotate banner photos automatically throughout the day / every 8 seconds if multiple
  useEffect(() => {
    if (activeBannerPhotos.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % activeBannerPhotos.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [activeBannerPhotos.length]);

  const handleAddBannerPhoto = (photoUrl: string) => {
    if (!photoUrl.trim()) return;
    const currentList = settings.bannerPhotos && settings.bannerPhotos.length > 0
      ? [...settings.bannerPhotos]
      : (settings.bannerImageUrl ? [settings.bannerImageUrl] : []);

    if (currentList.includes(photoUrl.trim())) {
      showToast('Photo is already in banner collection');
      return;
    }

    const updatedList = [...currentList, photoUrl.trim()];
    const updatedSettings: AppSettings = {
      ...settings,
      bannerPhotos: updatedList,
      bannerImageUrl: updatedList[0]
    };
    setSettings(updatedSettings);
    saveSettingsToFirestore(updatedSettings).catch((err) => console.warn('Could not sync banner to Firestore:', err));
    setNewBannerUrlInput('');
    showToast('Banner photo added!');
  };

  const handleRemoveBannerPhoto = (indexToRemove: number) => {
    const currentList = settings.bannerPhotos || [];
    const updatedList = currentList.filter((_, idx) => idx !== indexToRemove);
    const updatedSettings: AppSettings = {
      ...settings,
      bannerPhotos: updatedList,
      bannerImageUrl: updatedList[0] || ''
    };
    setSettings(updatedSettings);
    saveSettingsToFirestore(updatedSettings).catch((err) => console.warn('Could not sync banner to Firestore:', err));
    setCurrentBannerIndex(0);
    showToast('Photo removed from banner');
  };

  const handleUpdateBannerFit = (fit: 'cover' | 'contain') => {
    const updated: AppSettings = { ...settings, bannerFit: fit };
    setSettings(updated);
    saveSettingsToFirestore(updated).catch((err) => console.warn('Could not sync banner fit to Firestore:', err));
    showToast(`Banner fit updated to ${fit === 'contain' ? 'Fit Entire Photo' : 'Fill Area'}`);
  };

  const handleUpdateBannerHeight = (height: 'compact' | 'medium' | 'tall' | 'auto') => {
    const updated: AppSettings = { ...settings, bannerHeight: height };
    setSettings(updated);
    saveSettingsToFirestore(updated).catch((err) => console.warn('Could not sync banner height to Firestore:', err));
    showToast(`Banner height set to ${height}`);
  };

  // --- Event Reminder Modal State ---
  const [reminderModalOpen, setReminderModalOpen] = useState<boolean>(false);
  const [reminderEvent, setReminderEvent] = useState<ScheduleEvent | null>(null);
  const [reminderTab, setReminderTab] = useState<'calendar' | 'email' | 'sms' | 'browser'>('calendar');
  const [reminderUserTz, setReminderUserTz] = useState<string>('PHT');
  const [reminderTiming, setReminderTiming] = useState<number>(15);
  const [reminderEmail, setReminderEmail] = useState<string>('');
  const [reminderCountryCode, setReminderCountryCode] = useState<string>('+63');
  const [reminderPhone, setReminderPhone] = useState<string>('');
  const [reminderSuccess, setReminderSuccess] = useState<boolean>(false);

  // Event Form State
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDate, setFormDate] = useState<string>('2026-10-28');
  const [formEndDate, setFormEndDate] = useState<string>('');
  const [formIsMultiDay, setFormIsMultiDay] = useState<boolean>(false);
  const [formTime, setFormTime] = useState<string>('18:00');
  const [formTimezone, setFormTimezone] = useState<string>('BKK');
  const [customTimezone, setCustomTimezone] = useState<string>('');
  const [formLocation, setFormLocation] = useState<string>('');
  const [formLocationUrl, setFormLocationUrl] = useState<string>('');
  const [formPosterUrl, setFormPosterUrl] = useState<string>('');
  const [formMembers, setFormMembers] = useState<string[]>(['jimmy']);
  const [formCategory, setFormCategory] = useState<string>('Event');
  const [formLink, setFormLink] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formHashtags, setFormHashtags] = useState<string>('');
  const [formWatchPlatforms, setFormWatchPlatforms] = useState<WatchPlatform[]>([]);

  const [newPlatformName, setNewPlatformName] = useState<string>('GMMTV');
  const [newPlatformType, setNewPlatformType] = useState<string>('YouTube');
  const [newPlatformUrl, setNewPlatformUrl] = useState<string>('https://youtube.com/@gmmtv');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const bannerFileInputRef = useRef<HTMLInputElement | null>(null);

  // Settings Form State
  const [draftGreeting, setDraftGreeting] = useState<string>(settings.greeting);
  const [draftBannerTitle, setDraftBannerTitle] = useState<string>(settings.bannerTitle || 'JIMMY SEA AVOCEAN HUB');
  const [draftBannerTitleSize, setDraftBannerTitleSize] = useState<TitleSizeChoice>(settings.bannerTitleSize || 'medium');
  const [draftBannerSubtitle, setDraftBannerSubtitle] = useState<string>(settings.bannerSubtitle);
  const [draftBannerSubtitleSize, setDraftBannerSubtitleSize] = useState<SubtitleSizeChoice>(settings.bannerSubtitleSize || 'medium');
  const [draftBannerTag, setDraftBannerTag] = useState<string>(settings.bannerTag || '');
  const [draftBannerImageUrl, setDraftBannerImageUrl] = useState<string>(settings.bannerImageUrl);
  const [draftBannerPreset, setDraftBannerPreset] = useState<string>(settings.bannerPreset);
  const [draftOwnerPin, setDraftOwnerPin] = useState<string>(settings.ownerPin || 'ErnestTheStan05!');
  const [draftAdminPin, setDraftAdminPin] = useState<string>(settings.adminPin || 'Avocean2026');
  const [draftTimeFormat, setDraftTimeFormat] = useState<'12h' | '24h'>(settings.timeFormat || '12h');
  const [draftWebsiteIcon, setDraftWebsiteIcon] = useState<string>(settings.websiteIcon || 'trio');
  const [draftMembers, setDraftMembers] = useState<Member[]>(settings.members);
  const [importJsonText, setImportJsonText] = useState<string>('');

  // Sizing classes for editable Hub Title & Subtitle
  const titleSizeClass = useMemo(() => {
    const sz = settings.bannerTitleSize || 'medium';
    if (sz === 'compact') return 'text-xl sm:text-2xl lg:text-[26px]';
    if (sz === 'large') return 'text-3xl sm:text-4xl lg:text-[42px]';
    if (sz === 'xlarge') return 'text-4xl sm:text-5xl lg:text-[54px]';
    return 'text-2xl sm:text-3xl lg:text-[32px]'; // medium
  }, [settings.bannerTitleSize]);

  const subtitleSizeClass = useMemo(() => {
    const sz = settings.bannerSubtitleSize || 'medium';
    if (sz === 'small') return 'text-[11px] sm:text-xs';
    if (sz === 'large') return 'text-sm sm:text-base';
    if (sz === 'xlarge') return 'text-base sm:text-lg';
    return 'text-xs sm:text-sm'; // medium
  }, [settings.bannerSubtitleSize]);

  // Dynamically update the browser tab icon (favicon) when websiteIcon changes
  useEffect(() => {
    const faviconLink = document.getElementById('app-favicon') as HTMLLinkElement | null;
    if (!faviconLink) return;

    const icon = settings.websiteIcon || 'trio';
    if (icon === 'trio' || !icon) {
      faviconLink.href = '/favicon.svg';
    } else if (icon === 'jimmy') {
      faviconLink.href = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="%237C3AED" stroke="%23DDD6FE" stroke-width="3"/><text x="32" y="38" font-size="34" text-anchor="middle" dominant-baseline="middle">🥑</text></svg>`;
    } else if (icon === 'sea') {
      faviconLink.href = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="%230284C7" stroke="%23BAE6FD" stroke-width="3"/><text x="32" y="38" font-size="34" text-anchor="middle" dominant-baseline="middle">🌊</text></svg>`;
    } else if (icon === 'avocean') {
      faviconLink.href = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="%2316A34A" stroke="%23BBF7D0" stroke-width="3"/><text x="32" y="38" font-size="34" text-anchor="middle" dominant-baseline="middle">💚</text></svg>`;
    } else if (icon.startsWith('http://') || icon.startsWith('https://') || icon.startsWith('data:')) {
      faviconLink.href = icon;
    } else {
      const encoded = encodeURIComponent(icon);
      faviconLink.href = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="%230F172A" stroke="%2338BDF8" stroke-width="3"/><text x="32" y="38" font-size="28" text-anchor="middle" dominant-baseline="middle">${encoded}</text></svg>`;
    }
  }, [settings.websiteIcon]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  const toggleTimeFormat = () => {
    const nextFormat: '12h' | '24h' = is12Hour ? '24h' : '12h';
    const updated = { ...settings, timeFormat: nextFormat };
    setSettings(updated);
    try {
      localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save time format', e);
    }
    showToast(`Time format switched to ${nextFormat === '12h' ? '12-Hour AM/PM' : '24-Hour'}`);
  };

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_EVENTS_KEY, JSON.stringify(events));
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  }, [events]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ROLE_KEY, userRole);
      localStorage.setItem(STORAGE_ADMIN_KEY, userRole !== 'visitor' ? 'true' : 'false');
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  }, [userRole]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_REMINDERS_KEY, JSON.stringify(userReminders));
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  }, [userReminders]);

  // Open Login Modal with specific tab
  const openLoginModal = (targetRole: 'admin' | 'owner' = 'owner') => {
    setLoginRoleTab(targetRole);
    setLoginPinInput('');
    setLoginPinError('');
    setShowLoginPin(false);
    setLoginModalOpen(true);
  };

  // Verify Login for Owner vs Admin
  const handleVerifyLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const entered = loginPinInput.trim();
    const correctOwnerPin = settings.ownerPin || 'ErnestTheStan05!';
    const correctAdminPin = settings.adminPin || 'Avocean2026';

    if (loginRoleTab === 'owner') {
      if (entered === correctOwnerPin) {
        setUserRole('owner');
        setIsEditMode(true);
        setLoginModalOpen(false);
        setLoginPinInput('');
        setLoginPinError('');
        showToast('👑 Owner Mode unlocked! Full access granted.');
      } else if (entered === correctAdminPin) {
        setLoginPinError('This is the Admin helper passcode. Switch to the Admin tab to log in as Admin.');
      } else {
        setLoginPinError('Incorrect Owner passcode. Please try again.');
      }
    } else {
      // Admin role tab
      if (entered === correctAdminPin) {
        setUserRole('admin');
        setIsEditMode(true);
        setLoginModalOpen(false);
        setLoginPinInput('');
        setLoginPinError('');
        showToast('🛡️ Admin Mode unlocked! You can now add and edit calendar events.');
      } else if (entered === correctOwnerPin) {
        // Owner entered master passcode in admin tab
        setUserRole('owner');
        setIsEditMode(true);
        setLoginModalOpen(false);
        setLoginPinInput('');
        setLoginPinError('');
        showToast('👑 Owner passcode recognized! Full Owner Mode unlocked.');
      } else {
        setLoginPinError('Incorrect Admin passcode. Please try again.');
      }
    }
  };

  const handleLogout = () => {
    setUserRole('visitor');
    setIsEditMode(false);
    showToast('Switched to Visitor View.');
  };

  // Submit Change Owner Passcode
  const handleChangeOwnerPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    const currentSavedOwner = settings.ownerPin || 'ErnestTheStan05!';
    if (currentOwnerPinCheck.trim() !== currentSavedOwner) {
      setPasscodeError('Current owner passcode is incorrect.');
      return;
    }
    if (!newOwnerPinInput.trim()) {
      setPasscodeError('New owner passcode cannot be empty.');
      return;
    }
    if (newOwnerPinInput.trim().length < 4) {
      setPasscodeError('Passcode should be at least 4 characters long.');
      return;
    }
    if (newOwnerPinInput !== confirmOwnerPinInput) {
      setPasscodeError('New passcode and confirmation do not match.');
      return;
    }

    const updated = newOwnerPinInput.trim();
    setSettings((prev) => ({ ...prev, ownerPin: updated }));
    setDraftOwnerPin(updated);
    setChangePasscodeModalOpen(false);
    setCurrentOwnerPinCheck('');
    setNewOwnerPinInput('');
    setConfirmOwnerPinInput('');
    setPasscodeError('');
    showToast('Owner passcode updated successfully!');
  };

  // Submit Change Admin (Helper) Passcode
  const handleChangeAdminPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminPinInput.trim()) {
      setPasscodeError('Admin passcode cannot be empty.');
      return;
    }
    if (newAdminPinInput.trim().length < 4) {
      setPasscodeError('Admin passcode should be at least 4 characters long.');
      return;
    }

    const updated = newAdminPinInput.trim();
    setSettings((prev) => ({ ...prev, adminPin: updated }));
    setDraftAdminPin(updated);
    setChangePasscodeModalOpen(false);
    setNewAdminPinInput('');
    setPasscodeError('');
    showToast('Admin helper passcode updated! Share it with your event helpers.');
  };

  // Toggle Member Filter Pill
  const toggleMemberFilter = (memberId: string) => {
    setActiveMemberIds((prev) => {
      if (prev.includes(memberId)) {
        if (prev.length === 1) return settings.members.map((m) => m.id);
        return prev.filter((id) => id !== memberId);
      }
      return [...prev, memberId];
    });
  };

  // Calendar Navigation
  const handlePrevMonth = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleJumpToToday = () => {
    const todayYear = 2026;
    const todayMonth = 9; // October (0-indexed)
    const todayDay = 28;
    setCurrentMonthDate(new Date(todayYear, todayMonth, 1));
    setSelectedDateStr(toDateKey(todayYear, todayMonth, todayDay));
  };

  // Build Calendar Grid for Current Month
  const calendarDays = useMemo(() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: ({ day: number; dateStr: string } | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({
        day,
        dateStr: toDateKey(year, month, day)
      });
    }
    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    const weeks: ({ day: number; dateStr: string } | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }
    return weeks;
  }, [currentMonthDate]);

  const displayedWeeks = useMemo(() => {
    if (!showWeekOnly) return calendarDays;
    const matchingWeek = calendarDays.find((week) =>
      week.some((cell) => cell && cell.dateStr === selectedDateStr)
    );
    return matchingWeek ? [matchingWeek] : [calendarDays[0]];
  }, [calendarDays, showWeekOnly, selectedDateStr]);

  const filteredEvents = useMemo(() => {
    return events.filter((ev) =>
      (ev.members || []).some((mId) => activeMemberIds.includes(mId))
    );
  }, [events, activeMemberIds]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, ScheduleEvent[]> = {};
    filteredEvents.forEach((ev) => {
      const dates = getDateRangeKeys(ev.date, ev.endDate);
      dates.forEach((dateKey) => {
        if (!map[dateKey]) map[dateKey] = [];
        if (!map[dateKey].some((existing) => existing.id === ev.id)) {
          map[dateKey].push(ev);
        }
      });
    });
    Object.keys(map).forEach((k) => {
      map[k].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    });
    return map;
  }, [filteredEvents]);

  const selectedDayEvents = eventsByDate[selectedDateStr] || [];

  const formattedSelectedDate = useMemo(() => {
    const dt = parseDateKey(selectedDateStr);
    const dayName = SHORT_DAYS[dt.getDay()];
    const dayNum = dt.getDate();
    const monthName = SHORT_MONTHS[dt.getMonth()];
    return `${dayName} ${dayNum} ${monthName}`;
  }, [selectedDateStr]);

  const formatDetailFullDate = (dateStr: string) => {
    const dt = parseDateKey(dateStr);
    const dayName = FULL_DAYS[dt.getDay()];
    const dayNum = dt.getDate();
    const monthName = MONTHS[dt.getMonth()];
    const year = dt.getFullYear();
    return `${dayName}, ${dayNum} ${monthName} ${year}`;
  };

  // Open Add Event Modal
  const openAddEventModal = (defaultDate = selectedDateStr) => {
    if (!canEditEvents) {
      openLoginModal('admin');
      return;
    }
    setEditingEvent(null);
    setFormTitle('');
    setFormDate(defaultDate);
    setFormEndDate('');
    setFormIsMultiDay(false);
    setFormTime('18:00');
    setFormTimezone('BKK');
    setCustomTimezone('');
    setFormLocation('');
    setFormLocationUrl('');
    setFormPosterUrl('');
    setFormMembers(['jimmy', 'sea']);
    setFormCategory('Event');
    setFormLink('');
    setFormDescription('');
    setFormHashtags('#JimmySea #Avocean');
    setFormWatchPlatforms([]);
    setEventModalOpen(true);
  };

  // Open Edit Event Modal
  const openEditEventModal = (ev: ScheduleEvent) => {
    if (!canEditEvents) {
      openLoginModal('admin');
      return;
    }
    setEditingEvent(ev);
    setFormTitle(ev.title || '');
    setFormDate(ev.date || selectedDateStr);
    const isMulti = Boolean(ev.endDate && ev.endDate > ev.date);
    setFormIsMultiDay(isMulti);
    setFormEndDate(ev.endDate || '');

    let parsedTime = ev.time || '';
    let parsedTz = ev.timezone || '';

    if (!parsedTz && parsedTime) {
      const parts = parsedTime.trim().split(/\s+/);
      if (parts.length >= 2) {
        parsedTime = parts[0];
        parsedTz = parts.slice(1).join(' ');
      } else {
        parsedTz = 'BKK';
      }
    }
    if (!parsedTz) parsedTz = 'BKK';

    setFormTime(parsedTime);
    const matched = ALL_TIMEZONES.find((t) => t.code === parsedTz);
    if (matched) {
      setFormTimezone(matched.code);
      setCustomTimezone('');
    } else {
      setFormTimezone('CUSTOM');
      setCustomTimezone(parsedTz);
    }

    setFormLocation(ev.location || '');
    setFormLocationUrl(ev.locationUrl || '');
    setFormPosterUrl(ev.posterUrl || '');
    setFormMembers(ev.members && ev.members.length ? ev.members : ['jimmy']);
    setFormCategory(ev.category || 'Event');
    setFormLink(ev.link || '');
    setFormDescription(ev.description || ev.notes || '');
    setFormHashtags(ev.hashtags || '');
    setFormWatchPlatforms(ev.watchPlatforms ? [...ev.watchPlatforms] : []);
    setEventModalOpen(true);
  };

  // Submit Add/Edit Event Form
  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const resolvedTimezone =
      formTimezone === 'CUSTOM'
        ? customTimezone.trim() || 'UTC'
        : formTimezone;

    const resolvedEndDate =
      formIsMultiDay && formEndDate && formEndDate > formDate
        ? formEndDate
        : undefined;

    const newEvent: ScheduleEvent = {
      id: editingEvent ? editingEvent.id : `ev-${Date.now()}`,
      title: formTitle.trim(),
      date: formDate,
      endDate: resolvedEndDate || undefined,
      time: formTime.trim(),
      timezone: resolvedTimezone,
      location: formLocation.trim(),
      locationUrl: formLocationUrl.trim(),
      posterUrl: formPosterUrl.trim(),
      members: formMembers.length > 0 ? formMembers : [settings.members[0].id],
      category: formCategory,
      link: formLink.trim(),
      description: formDescription.trim(),
      hashtags: formHashtags.trim(),
      watchPlatforms: formWatchPlatforms
    };

    setEvents((prev) => {
      const exists = prev.some((item) => item.id === newEvent.id);
      const updated = exists
        ? prev.map((item) => (item.id === newEvent.id ? newEvent : item))
        : [...prev, newEvent];
      try {
        localStorage.setItem(STORAGE_EVENTS_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Sync to Firestore Cloud Database
    saveEventToFirestore(newEvent).catch((err) => console.warn('Could not sync event to Firestore:', err));

    if (detailEvent && detailEvent.id === newEvent.id) {
      setDetailEvent(newEvent);
    }

    setSelectedDateStr(formDate);
    const dt = parseDateKey(formDate);
    setCurrentMonthDate(new Date(dt.getFullYear(), dt.getMonth(), 1));
    setEventModalOpen(false);
    showToast(editingEvent ? 'Event updated!' : 'Event added to calendar!');
  };

  // Delete Event (Owner Only)
  const handleDeleteEvent = async (eventId: string) => {
    if (!isOwner) {
      if (isAdmin) {
        showToast('Admins can only add and edit events. Only the Owner can delete events.');
      } else {
        openLoginModal('owner');
      }
      return;
    }
    const updated = events.filter((ev) => ev.id !== eventId);
    setEvents(updated);
    try {
      localStorage.setItem(STORAGE_EVENTS_KEY, JSON.stringify(updated));
    } catch {}

    // Sync deletion to Firestore Cloud Database
    try {
      await deleteEventFromFirestore(eventId);
    } catch (err) {
      console.warn('Could not delete event from Firestore:', err);
    }

    if (detailEvent && detailEvent.id === eventId) {
      setDetailEvent(updated.length > 0 ? updated[0] : null);
    }
    showToast('Event removed from schedule');
  };

  // Quick Auto-generate Google Maps Search Link
  const handleAutoGenerateMapsLink = () => {
    if (!formLocation.trim()) return;
    const query = encodeURIComponent(formLocation.trim());
    const generatedUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
    setFormLocationUrl(generatedUrl);
    showToast('Google Maps search link generated!');
  };

  // Handle Poster Photo Upload
  const handlePosterFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      showToast('Image is larger than 4MB. Please choose a smaller file or link.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFormPosterUrl(event.target.result as string);
        showToast('Poster uploaded successfully!');
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Banner Photo Upload from file
  const handleBannerFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Banner image is larger than 5MB. Please choose a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const photoUrl = event.target.result as string;
        setDraftBannerImageUrl(photoUrl);
        setSettings((prev) => ({ ...prev, bannerImageUrl: photoUrl }));
        showToast('Banner photo updated!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddWatchPlatform = () => {
    if (!newPlatformUrl.trim()) return;
    const item: WatchPlatform = {
      id: `wp-${Date.now()}`,
      name: newPlatformName.trim() || 'GMMTV',
      platform: newPlatformType.trim() || 'YouTube',
      url: newPlatformUrl.trim()
    };
    setFormWatchPlatforms((prev) => [...prev, item]);
    setNewPlatformUrl('');
  };

  const handleRemoveWatchPlatform = (id: string) => {
    setFormWatchPlatforms((prev) => prev.filter((p) => p.id !== id));
  };

  // Share Event Link / Summary
  const handleShareEvent = async (ev: ScheduleEvent) => {
    const shareText = `${ev.title}\n📅 ${formatDetailFullDate(ev.date)}\n⏰ Starts ${formatEventTime(ev, is12Hour) || 'TBA'}${ev.location ? `\n📍 ${ev.location}` : ''}${ev.hashtags ? `\n${ev.hashtags}` : ''}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: ev.title,
          text: shareText,
          url: window.location.href
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    navigator.clipboard.writeText(shareText);
    showToast('Event summary & link copied to clipboard! Ready to share!');
  };

  const handleCopyHashtags = (hashtags: string) => {
    if (!hashtags) return;
    navigator.clipboard.writeText(hashtags);
    setCopiedHashtags(true);
    showToast('Hashtags copied! Ready to paste into your post!');
    setTimeout(() => setCopiedHashtags(false), 2500);
  };

  // --- Open Reminder Modal ---
  const openReminderModal = (ev: ScheduleEvent) => {
    setReminderEvent(ev);
    setReminderSuccess(false);

    const userOffsetHours = -new Date().getTimezoneOffset() / 60;
    const matched = ALL_TIMEZONES.find((t) => t.numericOffset === userOffsetHours);
    if (matched) {
      setReminderUserTz(matched.code);
    } else {
      setReminderUserTz('PHT');
    }

    setReminderTiming(15);
    setReminderModalOpen(true);
  };

  // Save Reminder to list
  const handleSaveReminder = (type: 'calendar' | 'email' | 'sms' | 'whatsapp' | 'browser', target?: string) => {
    if (!reminderEvent) return;

    const timingOption = REMINDER_TIMING_OPTIONS.find((t) => t.minutes === reminderTiming) || REMINDER_TIMING_OPTIONS[0];
    const converted = convertEventTimeAndDate(
      reminderEvent.time || '18:00',
      reminderEvent.timezone || 'BKK',
      reminderUserTz,
      reminderEvent.date,
      is12Hour
    );

    const newReminder: UserReminder = {
      id: `rem-${Date.now()}`,
      eventId: reminderEvent.id,
      eventTitle: reminderEvent.title,
      eventDate: reminderEvent.date,
      userTimezone: reminderUserTz,
      convertedTimeStr: `${converted.time} ${reminderUserTz}`,
      timingMinutes: reminderTiming,
      timingLabel: timingOption.label,
      type,
      targetContact: target || '',
      createdAt: new Date().toISOString()
    };

    setUserReminders((prev) => [newReminder, ...prev.filter((r) => r.eventId !== reminderEvent.id)]);
    setReminderSuccess(true);
    showToast(`Reminder saved! Converted to ${converted.time} ${reminderUserTz}`);
  };

  const handleDeleteReminder = (id: string) => {
    setUserReminders((prev) => prev.filter((r) => r.id !== id));
    showToast('Reminder removed');
  };

  const isReminderSetForEvent = (eventId: string) => {
    return userReminders.some((r) => r.eventId === eventId);
  };

  const handleEnableBrowserNotification = async () => {
    if (!('Notification' in window)) {
      showToast('Browser notifications are not supported in this browser.');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      handleSaveReminder('browser', 'Web Browser Notification');
      new Notification('JIMMY SEA AVOCEAN HUB', {
        body: `You will be alerted when "${reminderEvent?.title}" is starting!`,
        icon: '/favicon.ico'
      });
      showToast('Browser notifications enabled!');
    } else {
      showToast('Permission not granted for browser notifications.');
    }
  };

  const getWhatsAppReminderUrl = () => {
    if (!reminderEvent) return '';
    const converted = convertEventTimeAndDate(
      reminderEvent.time || '18:00',
      reminderEvent.timezone || 'BKK',
      reminderUserTz,
      reminderEvent.date,
      is12Hour
    );
    const text = encodeURIComponent(
      `🥑🌊 *Event Reminder: ${reminderEvent.title}*\n\n📅 Date: ${converted.fullDateLabel}\n⏰ Your Time: ${converted.time} ${reminderUserTz} ${converted.dayShift}\n📍 Location: ${reminderEvent.location || 'Online'}\n${reminderEvent.hashtags || ''}\n\nDon't miss it!`
    );
    return `https://api.whatsapp.com/send?text=${text}`;
  };

  // Settings Modal Handlers (Owner Only)
  const openSettingsModal = () => {
    if (!isOwner) {
      if (isAdmin) {
        showToast('Admins can only add and edit calendar events. Banner and site settings are Owner-only.');
      } else {
        openLoginModal('owner');
      }
      return;
    }
    setDraftGreeting(settings.greeting || DEFAULT_SETTINGS.greeting);
    setDraftBannerTitle(settings.bannerTitle || 'JIMMY SEA AVOCEAN HUB');
    setDraftBannerTitleSize(settings.bannerTitleSize || 'medium');
    setDraftBannerSubtitle(settings.bannerSubtitle ?? DEFAULT_SETTINGS.bannerSubtitle);
    setDraftBannerSubtitleSize(settings.bannerSubtitleSize || 'medium');
    setDraftBannerTag(settings.bannerTag ?? '');
    setDraftBannerImageUrl(settings.bannerImageUrl ?? '');
    setDraftBannerPreset(settings.bannerPreset || 'avocean-dream');
    setDraftOwnerPin(settings.ownerPin || 'ErnestTheStan05!');
    setDraftAdminPin(settings.adminPin || 'Avocean2026');
    setDraftTimeFormat(settings.timeFormat || '12h');
    setDraftWebsiteIcon(settings.websiteIcon || 'trio');
    setDraftMembers(settings.members.map((m) => ({ ...m })));
    setSettingsModalOpen(true);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedSettings: AppSettings = {
      ...settings,
      greeting: draftGreeting.trim() || 'Hey ErnestTheStan!',
      bannerTitle: draftBannerTitle.trim() || 'JIMMY SEA AVOCEAN HUB',
      bannerTitleSize: draftBannerTitleSize,
      bannerSubtitle:
        draftBannerSubtitle.trim() ||
        'Official Fan Schedule, Appearances & Trending Projects 🥑🌊💚',
      bannerSubtitleSize: draftBannerSubtitleSize,
      bannerTag: draftBannerTag.trim() || '',
      bannerImageUrl: draftBannerImageUrl.trim(),
      bannerPreset: draftBannerPreset || 'avocean-dream',
      ownerPin: draftOwnerPin.trim() || settings.ownerPin || 'ErnestTheStan05!',
      adminPin: draftAdminPin.trim() || settings.adminPin || 'Avocean2026',
      timeFormat: draftTimeFormat,
      websiteIcon: draftWebsiteIcon || 'trio',
      members: draftMembers.map((m) => ({
        ...m,
        name: m.name.trim() || 'Member',
        emoji: m.emoji.trim() || '⭐'
      }))
    };
    setSettings(updatedSettings);
    localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(updatedSettings));
    saveSettingsToFirestore(updatedSettings).catch((err) => console.warn('Could not sync settings to Firestore:', err));
    setSettingsModalOpen(false);
    showToast('Banner, Website Icon & Settings updated!');
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Reset all schedule events and settings back to original sample data?')) {
      setSettings(DEFAULT_SETTINGS);
      setEvents(SAMPLE_EVENTS);
      setActiveMemberIds(['jimmy', 'sea', 'avocean']);
      setBackupModalOpen(false);
      showToast('Reset to default schedule!');
    }
  };

  const handleDownloadBackup = () => {
    const payload = JSON.stringify({ settings, events, userReminders }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jimmy-sea-avocean-schedule-${selectedDateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Schedule exported as JSON!');
  };

  const handleImportBackup = () => {
    try {
      const parsed = JSON.parse(importJsonText);
      if (parsed.settings) {
        setSettings({ ...DEFAULT_SETTINGS, ...parsed.settings, bannerTitle: 'JIMMY SEA AVOCEAN HUB' });
      }
      if (Array.isArray(parsed.events)) {
        setEvents(parsed.events);
      }
      if (Array.isArray(parsed.userReminders)) {
        setUserReminders(parsed.userReminders);
      }
      setImportJsonText('');
      setBackupModalOpen(false);
      showToast('Schedule restored from JSON!');
    } catch {
      showToast('Invalid JSON format. Please verify your backup data.');
    }
  };

  const getMemberById = (id: string): Member =>
    settings.members.find((m) => m.id === id) || settings.members[0];

  const listViewEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...filteredEvents]
      .filter((ev) => {
        if (!q) return true;
        return (
          ev.title.toLowerCase().includes(q) ||
          (ev.location && ev.location.toLowerCase().includes(q)) ||
          (ev.timezone && ev.timezone.toLowerCase().includes(q)) ||
          (ev.description && ev.description.toLowerCase().includes(q)) ||
          (ev.hashtags && ev.hashtags.toLowerCase().includes(q)) ||
          (ev.category && ev.category.toLowerCase().includes(q)) ||
          ev.date.includes(q)
        );
      })
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return (a.time || '').localeCompare(b.time || '');
      });
  }, [filteredEvents, searchQuery]);

  const selectedTzObj = ALL_TIMEZONES.find((t) => t.code === formTimezone);

  const reminderConversion = useMemo(() => {
    if (!reminderEvent) return null;
    return convertEventTimeAndDate(
      reminderEvent.time || '18:00',
      reminderEvent.timezone || 'BKK',
      reminderUserTz,
      reminderEvent.date,
      is12Hour
    );
  }, [reminderEvent, reminderUserTz, is12Hour]);

  // Render Full Event View (Matching Screenshot 2 - shows all details immediately!)
  const renderFullEventCard = (ev: ScheduleEvent) => {
    const hasReminder = isReminderSetForEvent(ev.id);

    return (
      <div
        key={ev.id}
        className="bg-white/95 dark:bg-slate-900/95 rounded-[32px] p-5 sm:p-7 shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between gap-5 flex-1 h-full min-h-full animate-in fade-in duration-200"
      >
        {/* Top Action Row */}
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/70 px-3 py-1 rounded-full border border-purple-200 dark:border-purple-800">
              {formatEventFullDateRange(ev.date, ev.endDate)}
            </span>
            {getEventDaysCount(ev.date, ev.endDate) > 1 && (
              <span className="text-xs font-extrabold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/70 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                🗓️ {getEventDaysCount(ev.date, ev.endDate)}-Day Event
              </span>
            )}
            {ev.time && (
              <span className="text-xs font-bold text-[#334155] dark:text-slate-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-purple-500" />
                <span>{formatEventTime(ev, is12Hour)}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Set Reminder Button */}
            <button
              onClick={() => openReminderModal(ev)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold shadow-xs transition-all cursor-pointer bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-[#1A3668] dark:text-white border border-slate-200/80 dark:border-slate-700"
            >
              <Bell className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>{hasReminder ? 'Reminder Active' : 'Set Reminder'}</span>
            </button>

            {/* Share Button */}
            <button
              onClick={() => handleShareEvent(ev)}
              className="p-2.5 rounded-full bg-white dark:bg-slate-800 text-[#1A3668] dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 shadow-xs border border-slate-200/80 dark:border-slate-700 transition-all cursor-pointer"
              title="Share Event"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Quick Actions for Event Editors & Owner */}
            {canEditEvents && (
              <>
                <button
                  onClick={() => openEditEventModal(ev)}
                  className="p-2.5 rounded-full bg-white dark:bg-slate-800 text-slate-400 hover:text-purple-600 shadow-xs border border-slate-200/80 dark:border-slate-700 transition-all cursor-pointer"
                  title="Edit Event"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                {isOwner && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete "${ev.title}"?`)) {
                        handleDeleteEvent(ev.id);
                      }
                    }}
                    className="p-2.5 rounded-full bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-600 shadow-xs border border-slate-200/80 dark:border-slate-700 transition-all cursor-pointer"
                    title="Delete Event (Owner Only)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Main 2-Column Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 flex-1 items-stretch">
          {/* Left Sub-Column: Media Poster, Venue & Google Maps, Streaming */}
          <div className="xl:col-span-5 flex flex-col justify-between gap-4 h-full">
            <div className="flex flex-col gap-4">
              {/* Poster Media (Only rendered when an official poster is uploaded) */}
              {ev.posterUrl && (
                <div className="w-full rounded-2xl overflow-hidden shadow-xs border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800">
                  <img
                    src={ev.posterUrl}
                    alt={ev.title}
                    className="w-full max-h-[360px] object-cover"
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4 mt-auto">
              {/* Venue Section with Google Maps Button */}
              {ev.location && (
                <div className="flex flex-col gap-2">
                  <span className="block text-xs font-bold text-[#475569] dark:text-slate-400 px-1">
                    Venue
                  </span>
                  <div className="bg-slate-50/90 dark:bg-slate-800/90 rounded-[22px] p-4 shadow-2xs border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-[#1A3668] dark:text-purple-400 shrink-0" />
                    <span className="text-sm font-bold text-[#1A3668] dark:text-white tracking-tight">
                      {ev.location}
                    </span>
                  </div>

                  <a
                    href={ev.locationUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ backgroundColor: currentAccent.colorHex }}
                    className="w-full py-3.5 px-4 rounded-[20px] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer hover:opacity-90"
                  >
                    <Navigation className="w-4 h-4 fill-white" />
                    <span>Directions in Google Maps</span>
                  </a>
                </div>
              )}

              {/* Where to Watch */}
              {ev.watchPlatforms && ev.watchPlatforms.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="block text-xs font-bold text-[#475569] dark:text-slate-400 px-1">
                    Where to watch
                  </span>
                  <div className="bg-slate-50/90 dark:bg-slate-800/90 rounded-[24px] shadow-2xs border border-slate-200/80 dark:border-slate-700/80 divide-y divide-slate-200/80 dark:divide-slate-700/80 overflow-hidden">
                    {ev.watchPlatforms.map((wp) => (
                      <a
                        key={wp.id}
                        href={wp.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3.5 flex items-center justify-between hover:bg-slate-100/80 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-200/80 dark:bg-slate-700 group-hover:bg-purple-100 dark:group-hover:bg-purple-900 text-[#1A3668] dark:text-white flex items-center justify-center shrink-0 transition-colors">
                            <Tv className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-[#1A3668] dark:text-white leading-tight">
                              {wp.name}
                            </span>
                            <span className="text-xs font-medium text-[#475569] dark:text-slate-400">
                              {wp.platform}
                            </span>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Sub-Column: Header Info, Timing, Description, Hashtags */}
          <div className="xl:col-span-7 flex flex-col justify-between gap-4 h-full">
            <div className="flex flex-col gap-4">
              {/* Title & Members Card */}
              <div className="bg-slate-50/90 dark:bg-slate-800/90 rounded-[26px] p-5 shadow-2xs border border-slate-200/80 dark:border-slate-700/80">
                {ev.category && (
                  <div className="mb-2.5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-[#475569] dark:text-slate-300 uppercase tracking-wider bg-white dark:bg-slate-800/80">
                      <MapPin className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                      <span>{ev.category}</span>
                    </span>
                  </div>
                )}

                <h1 className="text-xl sm:text-2xl font-extrabold text-[#1A3668] dark:text-white leading-snug tracking-tight mb-3">
                  {ev.title}
                </h1>

                <div className="flex flex-wrap items-center gap-2">
                  {(ev.members || []).map((mId) => {
                    const m = getMemberById(mId);
                    return (
                      <span
                        key={mId}
                        style={{
                          backgroundColor: isDarkMode ? '#1E293B' : m.pillBg,
                          borderColor: m.pillBorder
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold text-[#1A3668] dark:text-white"
                      >
                        <span className="text-sm">{m.emoji}</span>
                        <span>{m.name}</span>
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Date & Time Card */}
              <div className="bg-slate-50/90 dark:bg-slate-800/90 rounded-[24px] p-4 shadow-2xs border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3.5">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <CalendarIcon className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div className="flex flex-col truncate">
                    <span className="text-sm font-bold text-[#1A3668] dark:text-white truncate">
                      {formatEventFullDateRange(ev.date, ev.endDate)}
                    </span>
                    <span className="text-xs font-semibold text-[#475569] dark:text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                      {getEventDaysCount(ev.date, ev.endDate) > 1 && (
                        <span className="text-amber-700 dark:text-amber-300 font-bold bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-md text-[11px]">
                          {getEventDaysCount(ev.date, ev.endDate)}-Day Event
                        </span>
                      )}
                      <span>Starts {formatEventTime(ev, is12Hour) || 'TBA'}</span>
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => openReminderModal(ev)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0 ${
                    hasReminder
                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                      : 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white border border-purple-500/30'
                  }`}
                >
                  <Bell className="w-3.5 h-3.5 text-white" />
                  <span>{hasReminder ? 'Reminder Active' : 'Remind Me'}</span>
                </button>
              </div>

              {/* Description */}
              {ev.description && (
                <div className="flex flex-col gap-1.5 flex-1">
                  <span className="block text-xs font-bold text-[#475569] dark:text-slate-400 px-1">
                    About Event
                  </span>
                  <div className="bg-slate-50/90 dark:bg-slate-800/90 rounded-[24px] p-5 shadow-2xs border border-slate-200/80 dark:border-slate-700/80 text-xs sm:text-[13.5px] font-medium text-[#334155] dark:text-slate-200 leading-relaxed whitespace-pre-line flex-1">
                    {ev.description}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4 mt-auto">
              {/* More Info Link */}
              {ev.link && (
                <div className="flex flex-col gap-1.5">
                  <span className="block text-xs font-bold text-[#475569] dark:text-slate-400 px-1">
                    More info
                  </span>
                  <a
                    href={ev.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded-[20px] bg-white dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[#1A3668] dark:text-white font-bold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>Open event details</span>
                  </a>
                </div>
              )}

              {/* Hashtags */}
              {ev.hashtags && (
                <div className="flex flex-col gap-1.5">
                  <span className="block text-xs font-bold text-[#475569] dark:text-slate-400 px-1">
                    Hashtags
                  </span>
                  <div className="bg-slate-50/90 dark:bg-slate-800/90 rounded-[22px] p-3 pl-4 shadow-2xs border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3">
                    <span className="text-xs sm:text-sm font-bold text-[#1A3668] dark:text-white tracking-tight truncate">
                      {ev.hashtags}
                    </span>
                    <button
                      onClick={() => handleCopyHashtags(ev.hashtags || '')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 hover:bg-purple-100 border border-slate-200 dark:border-slate-600 text-xs font-bold text-[#1A3668] dark:text-white shrink-0 transition-colors cursor-pointer"
                    >
                      {copiedHashtags ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`min-h-screen w-full flex flex-col items-center pb-28 px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 select-none sm:select-auto relative transition-colors duration-300 ${
        isDarkMode ? 'dark text-[#F8FAFC]' : 'text-[#1A3668]'
      }`}
      style={{
        background: isDarkMode
          ? 'linear-gradient(180deg, #0B1120 0%, #0F172A 48%, #111827 100%)'
          : 'linear-gradient(135deg, #F3E8FF 0%, #E0F2FE 50%, #ECFDF5 100%)',
        fontFamily: "'Quicksand', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
      }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#1A3668] dark:bg-purple-950 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 animate-bounce border border-white/20">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP TOOLBAR: FILLS FULL WIDTH UP TO 1340px */}
      <div className="w-full max-w-[1340px] flex flex-wrap items-center justify-between gap-3 mb-4 px-1">
        {/* Left Side: "Leave a message" (viewers), Inbox (admins/owner), & Stats */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Leave a Message button: visible to everyone, sized like login buttons */}
          <button
            onClick={() => {
              setMessageSubmitted(false);
              setLeaveMessageModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 text-[#1A3668] dark:text-slate-200 shadow-xs border border-slate-200/80 dark:border-slate-700 cursor-pointer transition-all active:scale-95"
            title="Know about an event we missed? Leave a note for Admins & Owner"
          >
            <MessageSquare className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Leave a message</span>
          </button>

          {/* Admin & Owner Only: Inbox with unread count */}
          {canEditEvents && (
            <button
              onClick={() => setInboxModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/70 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 shadow-xs border border-amber-200 dark:border-amber-800 cursor-pointer transition-all active:scale-95"
              title="Fan Messages Inbox (Admins & Owner Only)"
            >
              <Inbox className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Inbox</span>
              {unreadMessageCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-extrabold animate-pulse">
                  {unreadMessageCount}
                </span>
              )}
            </button>
          )}

          {/* Admin & Owner Only: Live Viewers & Total Website Visits Stats */}
          {canEditEvents && (
            <div className="hidden sm:inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full bg-white/90 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>{visitorStats.liveViewers} online</span>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <Users className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
              <span>{visitorStats.totalVisits.toLocaleString()} visits</span>
            </div>
          )}

          {/* Role Status Pills */}
          {isOwner && (
            <div className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shadow-xs">
              <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
              <span>Owner Mode</span>
            </div>
          )}
          {isAdmin && (
            <div className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-xs">
              <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Admin (Events Only)</span>
            </div>
          )}
        </div>

        {/* Right Controls: Accent Selector, 12H/24H, Dark Mode, Reminders, Logins / Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Accent Color Switcher: Purple, Blue, Green (Saved to user's device only) */}
          <div
            className="inline-flex items-center p-1 rounded-full bg-white/90 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs gap-1"
            title="Personal Accent Theme (Changes only on your screen)"
          >
            {(['purple', 'blue', 'green'] as AccentChoice[]).map((c) => {
              const theme = ACCENT_THEMES[c];
              const isSelected = accentColor === c;
              return (
                <button
                  key={c}
                  onClick={() => handleSelectAccent(c)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? 'scale-110 shadow-xs ring-2 ring-offset-1 ring-slate-400 dark:ring-offset-slate-900'
                      : 'opacity-50 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: theme.colorHex }}
                  title={`${theme.name} Accent (${theme.emoji})`}
                >
                  <span className="text-[10px]">{theme.emoji}</span>
                </button>
              );
            })}
          </div>

          {/* 12-Hour vs 24-Hour Quick Switcher */}
          <button
            onClick={toggleTimeFormat}
            className="px-2.5 py-1.5 rounded-full bg-white/90 dark:bg-slate-800 text-[#1A3668] dark:text-purple-300 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-xs border border-slate-200/80 dark:border-slate-700 cursor-pointer transition-all flex items-center gap-1.5 text-xs font-bold"
            title={is12Hour ? 'Current: 12-Hour AM/PM. Click for 24-Hour' : 'Current: 24-Hour. Click for 12-Hour AM/PM'}
          >
            <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>{is12Hour ? '12-Hour' : '24-Hour'}</span>
          </button>

          {/* Light / Dark Mode Toggle Button */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full bg-white/90 dark:bg-slate-800 text-[#1A3668] dark:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-xs border border-slate-200/80 dark:border-slate-700 cursor-pointer transition-all"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Saved Reminders Counter */}
          {userReminders.length > 0 && (
            <button
              onClick={() => setMyRemindersModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 hover:bg-purple-200 shadow-xs border border-purple-200 dark:border-purple-800 transition-all cursor-pointer"
            >
              <BellRing className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>{userReminders.length} Saved</span>
            </button>
          )}

          {isOwner ? (
            <div className="flex items-center gap-2">
              <button
                onClick={openSettingsModal}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 text-[#1A3668] dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-slate-700 shadow-xs border border-purple-100 dark:border-slate-700 transition-all cursor-pointer"
                title="Customize Hub Header, Greeting & Members"
              >
                <Settings className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span className="hidden sm:inline">Customize</span>
              </button>

              <button
                onClick={() => setBackupModalOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-full bg-white/90 dark:bg-slate-800 text-[#1A3668] dark:text-slate-200 hover:bg-sky-50 shadow-xs border border-white dark:border-slate-700 cursor-pointer"
                title="Backup or Import Schedule"
              >
                <Download className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span className="hidden sm:inline">Backup</span>
              </button>

              <button
                onClick={() => {
                  setPasscodeModalTab('owner');
                  setCurrentOwnerPinCheck('');
                  setNewOwnerPinInput('');
                  setConfirmOwnerPinInput('');
                  setNewAdminPinInput('');
                  setPasscodeError('');
                  setShowPasscodeField(false);
                  setChangePasscodeModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-white/90 dark:bg-slate-800 text-[#1A3668] dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/60 shadow-xs border border-white dark:border-slate-700 cursor-pointer transition-all"
                title="Manage Owner & Admin Passcodes"
              >
                <Key className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span className="hidden sm:inline">Passcodes</span>
              </button>

              <button
                onClick={() => openAddEventModal(selectedDateStr)}
                style={{ backgroundColor: currentAccent.colorHex }}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full text-white shadow-xs transition-all cursor-pointer active:scale-95 hover:opacity-90"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add Event</span>
              </button>

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1 text-xs font-bold p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 text-slate-500 hover:text-rose-600 cursor-pointer transition-colors"
                title="Exit Owner Mode"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : isAdmin ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAddEventModal(selectedDateStr)}
                style={{ backgroundColor: currentAccent.colorHex }}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full text-white shadow-xs transition-all cursor-pointer active:scale-95 hover:opacity-90"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add Event</span>
              </button>

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 text-slate-500 hover:text-rose-600 cursor-pointer transition-colors"
                title="Exit Admin Mode"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {/* Distinct Admin Login and Owner Login buttons */}
              <button
                onClick={() => openLoginModal('admin')}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 text-[#1A3668] dark:text-slate-200 shadow-xs border border-slate-200/80 dark:border-slate-700 cursor-pointer transition-all active:scale-95"
                title="Admin Login (Add & Edit Events)"
              >
                <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Admin Login</span>
              </button>

              <button
                onClick={() => openLoginModal('owner')}
                style={{ backgroundColor: currentAccent.colorHex }}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full text-white shadow-xs cursor-pointer transition-all active:scale-95 hover:opacity-90"
                title="Owner Login (Full Control)"
              >
                <Crown className="w-3.5 h-3.5 text-amber-300 fill-amber-300/30" />
                <span>Owner Login</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. SEPARATED BANNER PHOTO CONTAINER (MULTIPLE PHOTOS & FIT)    */}
      {/* ============================================================== */}
      <div className="w-full max-w-[1340px] mb-4">
        {(() => {
          const currentHeight = settings.bannerHeight || 'medium';
          const heightClass =
            currentHeight === 'compact'
              ? 'h-44 sm:h-56 lg:h-64'
              : currentHeight === 'tall'
              ? 'h-64 sm:h-84 lg:h-[420px]'
              : currentHeight === 'auto'
              ? 'h-56 sm:h-72 lg:h-[380px]'
              : 'h-52 sm:h-68 lg:h-80'; // medium default

          const activePhoto =
            activeBannerPhotos.length > 0
              ? activeBannerPhotos[currentBannerIndex % activeBannerPhotos.length]
              : settings.bannerImageUrl;

          const isContain = settings.bannerFit === 'contain';

          return (
            <div className={`relative w-full ${heightClass} rounded-[28px] overflow-hidden shadow-sm border-2 border-white/80 dark:border-slate-800 bg-slate-200 dark:bg-slate-800 group`}>
              {activePhoto ? (
                isContain ? (
                  /* Contain Mode: Full photo shown with soft blurred ambient backdrop */
                  <div className="relative w-full h-full overflow-hidden flex items-center justify-center bg-slate-900/90 dark:bg-slate-950">
                    <img
                      src={activePhoto}
                      alt="Ambient banner backdrop"
                      className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-110 pointer-events-none"
                    />
                    <img
                      src={activePhoto}
                      alt="Jimmy & Sea Hub Banner Artwork"
                      className="w-full h-full object-contain relative z-10 transition-opacity duration-300"
                    />
                  </div>
                ) : (
                  /* Cover Mode: Fills full banner container */
                  <img
                    src={activePhoto}
                    alt="Jimmy & Sea Hub Banner Artwork"
                    className="w-full h-full object-cover object-center group-hover:scale-[1.01] transition-transform duration-500"
                  />
                )
              ) : (
                <div
                  style={{
                    background: (
                      BANNER_PRESETS.find((p) => p.id === settings.bannerPreset) ||
                      BANNER_PRESETS[0]
                    ).gradient
                  }}
                  className="w-full h-full relative flex items-center justify-center overflow-hidden"
                >
                  <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/30 dark:bg-purple-900/30 blur-2xl pointer-events-none" />
                  <div className="absolute -left-10 -bottom-10 w-56 h-56 rounded-full bg-white/20 dark:bg-sky-900/30 blur-xl pointer-events-none" />

                  <div className="text-center z-10 px-4">
                    <TrioBadges members={settings.members} size="lg" />
                    <span className="block mt-2 text-xs font-bold text-[#1A3668]/70 dark:text-white/70 uppercase tracking-widest">
                      Official Banner Photo Slot
                    </span>
                  </div>
                </div>
              )}

              {/* Multiple Photos Navigation Arrows */}
              {activeBannerPhotos.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setCurrentBannerIndex((prev) =>
                        prev === 0 ? activeBannerPhotos.length - 1 : prev - 1
                      )
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs transition-all cursor-pointer"
                    title="Previous Photo"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() =>
                      setCurrentBannerIndex((prev) =>
                        (prev + 1) % activeBannerPhotos.length
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs transition-all cursor-pointer"
                    title="Next Photo"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* Dot Indicators */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-xs">
                    {activeBannerPhotos.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentBannerIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                          idx === currentBannerIndex % activeBannerPhotos.length
                            ? 'bg-white w-4'
                            : 'bg-white/50 hover:bg-white/80'
                        }`}
                        title={`Photo ${idx + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Adjust Photo Slot & Manage Photos Button: Visible to BOTH Admin & Owner */}
              {canEditEvents && (
                <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
                  <button
                    onClick={() => setBannerPhotosModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 dark:bg-slate-900/90 hover:bg-white text-[#1A3668] dark:text-white text-xs font-bold shadow-md backdrop-blur-xs cursor-pointer border border-white/60 dark:border-slate-700 transition-all active:scale-95"
                    title="Adjust Photo Sizing, Fit & Add/Remove Banner Photos (Admin & Owner)"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>
                      Adjust Banner {activeBannerPhotos.length > 1 ? `(${activeBannerPhotos.length})` : ''}
                    </span>
                  </button>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* ============================================================== */}
      {/* 2. SEPARATED HUB HEADER CARD WITH INTEGRATED MEMBER FILTERS     */}
      {/* ============================================================== */}
      <div className="w-full max-w-[1340px] mb-6">
        <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-md rounded-[28px] p-5 sm:p-6 shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col gap-4">
          {/* Top Row: Title, Badges, Greeting & Owner Quick Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <TrioBadges members={settings.members} size="sm" />
                <span className="text-xs font-semibold text-[#607494] dark:text-slate-400">
                  {settings.greeting}
                </span>
              </div>

              {/* Requested Official Hub Name: JIMMY SEA AVOCEAN HUB (Size customizable by Owner) */}
              <h1 className={`${titleSizeClass} font-extrabold text-[#1A3668] dark:text-white tracking-tight leading-tight transition-all`}>
                {settings.bannerTitle || 'JIMMY SEA AVOCEAN HUB'}
              </h1>
              <p className={`${subtitleSizeClass} font-semibold text-[#526586] dark:text-slate-400 mt-1 transition-all`}>
                {settings.bannerSubtitle}
              </p>
            </div>

            {/* Owner quick action buttons on the right side if logged in as Owner */}
            {isOwner && (
              <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
                <button
                  onClick={() => {
                    setPasscodeModalTab('owner');
                    setCurrentOwnerPinCheck('');
                    setNewOwnerPinInput('');
                    setConfirmOwnerPinInput('');
                    setNewAdminPinInput('');
                    setPasscodeError('');
                    setShowPasscodeField(false);
                    setChangePasscodeModalOpen(true);
                  }}
                  className="px-3 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#1A3668] dark:text-white text-xs font-bold shadow-xs cursor-pointer transition-all flex items-center gap-1.5 border border-slate-200/80 dark:border-slate-700"
                  title="Manage Owner & Admin Passcodes"
                >
                  <Key className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span className="hidden sm:inline">Passcodes</span>
                </button>
                <button
                  onClick={openSettingsModal}
                  className="px-3.5 py-2 rounded-2xl bg-[#1A3668] dark:bg-purple-600 hover:bg-slate-800 text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
                >
                  Customize Info
                </button>
              </div>
            )}
          </div>

          {/* Integrated Member Filters Row - Removed count number badges as requested */}
          <div className="mt-1 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#607494] dark:text-slate-400 mr-1">
                <Filter className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Filter:</span>
              </div>

              {/* All Members Toggle (Clean without count number) */}
              <button
                onClick={() => setActiveMemberIds(settings.members.map((m) => m.id))}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                  activeMemberIds.length === settings.members.length
                    ? 'bg-[#1A3668] text-white border-[#1A3668] dark:bg-purple-600 dark:border-purple-600 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-[#526586] dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>All Members</span>
              </button>

              {/* Individual Member Filter Pills (Clean without count numbers) */}
              {settings.members.map((member) => {
                const isActive = activeMemberIds.includes(member.id);

                return (
                  <button
                    key={member.id}
                    onClick={() => toggleMemberFilter(member.id)}
                    style={{
                      backgroundColor: isActive
                        ? isDarkMode
                          ? '#1E293B'
                          : member.pillBg
                        : isDarkMode
                        ? '#0F172A'
                        : '#FFFFFF',
                      borderColor: isActive
                        ? member.pillBorder
                        : isDarkMode
                        ? '#334155'
                        : '#E2E8F0'
                    }}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border-[1.5px] text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                      isActive
                        ? 'opacity-100 scale-100 shadow-xs ring-1 ring-purple-300/30'
                        : 'opacity-40 hover:opacity-80'
                    }`}
                  >
                    <MemberCircleIcon member={member} size="sm" />
                    <span className="text-[#1A3668] dark:text-white font-bold">
                      {member.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Filter Status / Quick Reset */}
            <div className="flex items-center gap-2">
              {activeMemberIds.length < settings.members.length && (
                <button
                  onClick={() => setActiveMemberIds(settings.members.map((m) => m.id))}
                  className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>Filtering {activeMemberIds.length}/{settings.members.length}</span>
                  <span className="text-purple-400 font-semibold">· Show All</span>
                </button>
              )}

              {isOwner && (
                <button
                  onClick={openSettingsModal}
                  className="text-xs font-semibold text-[#607494] dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 flex items-center gap-1 cursor-pointer"
                  title="Edit member names, colors & badges"
                >
                  <Edit3 className="w-3 h-3" />
                  <span className="hidden sm:inline">Edit Members</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. WIDE RESPONSIVE DASHBOARD LAYOUT                            */}
      {/* ============================================================== */}
      {activeTab === 'calendar' ? (
        <div className="w-full max-w-[1560px] flex flex-col lg:flex-row lg:items-start items-start justify-center gap-6 xl:gap-9">
          {/* LEFT COLUMN: Calendar Card (Self-start & Natural Height, Never Stretched!) */}
          <div className="w-full lg:w-[540px] xl:w-[600px] 2xl:w-[640px] shrink-0 flex flex-col gap-5 self-start order-1">
            {/* Calendar Header with Navigation */}
            <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-md rounded-[32px] p-6 sm:p-8 md:p-9 shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col h-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm font-extrabold text-[#607494] dark:text-slate-400 uppercase tracking-widest">
                      Calendar View
                    </span>
                    <h2 className="text-2xl sm:text-3xl md:text-[32px] font-black text-[#1A3668] dark:text-white leading-tight">
                      {MONTHS[currentMonthDate.getMonth()]}
                      {currentMonthDate.getFullYear() !== 2026
                        ? ` '${String(currentMonthDate.getFullYear()).slice(-2)}`
                        : ' 2026'}
                    </h2>
                  </div>
                </div>

                {/* Month Navigation */}
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <button
                    onClick={handlePrevMonth}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all shadow-2xs flex items-center justify-center text-[#1A3668] dark:text-white cursor-pointer"
                    aria-label="Previous Month"
                  >
                    <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all shadow-2xs flex items-center justify-center text-[#1A3668] dark:text-white cursor-pointer"
                    aria-label="Next Month"
                  >
                    <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
                  </button>
                  <button
                    onClick={handleJumpToToday}
                    className="h-10 sm:h-11 px-4 sm:px-5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all shadow-2xs text-xs sm:text-sm font-black text-[#1A3668] dark:text-white cursor-pointer"
                  >
                    Today
                  </button>
                </div>
              </div>

              {/* Weekdays Grid */}
              <div className="grid grid-cols-7 mb-4 text-center text-xs sm:text-sm md:text-[15px] font-black text-[#526586] dark:text-slate-400">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="py-2 uppercase tracking-wider">
                    {d}
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="flex flex-col gap-3 sm:gap-4 md:gap-4.5">
                {displayedWeeks.map((week, wIdx) => (
                  <div key={wIdx} className="grid grid-cols-7 items-start">
                    {week.map((cell, cIdx) => {
                      if (!cell) {
                        return <div key={`empty-${cIdx}`} className="h-[64px] sm:h-[74px] md:h-[82px]" />;
                      }

                      const isSelected = cell.dateStr === selectedDateStr;
                      const dayEvents = eventsByDate[cell.dateStr] || [];

                      const dayMemberIds = Array.from(
                        new Set(dayEvents.flatMap((e) => e.members || []))
                      ).filter((id) => activeMemberIds.includes(id));

                      const hasMultiDay = dayEvents.some((e) => e.endDate && e.endDate > e.date);

                      return (
                        <button
                          key={cell.dateStr}
                          onClick={() => {
                            setSelectedDateStr(cell.dateStr);
                            setSelectedDayActiveEventId(null);
                          }}
                          className="flex flex-col items-center justify-start py-1 group cursor-pointer focus:outline-none min-h-[64px] sm:min-h-[74px] md:min-h-[82px]"
                        >
                          <div
                            style={isSelected ? { backgroundColor: currentAccent.colorHex } : {}}
                            className={`w-11 h-11 sm:w-12 sm:h-12 md:w-13 md:h-13 rounded-full flex items-center justify-center text-sm sm:text-base md:text-lg transition-all ${
                              isSelected
                                ? 'text-white font-black shadow-lg scale-110 ring-3 ring-purple-400/40'
                                : 'text-[#1A3668] dark:text-slate-300 font-extrabold group-hover:bg-slate-100 dark:group-hover:bg-slate-800'
                            }`}
                          >
                            {cell.day}
                          </div>

                          {dayMemberIds.length > 0 && (
                            <div className="flex items-center justify-center -space-x-1 sm:-space-x-1.5 mt-1 sm:mt-1.5">
                              {dayMemberIds.slice(0, 3).map((mId) => {
                                const m = getMemberById(mId);
                                return (
                                  <span
                                    key={mId}
                                    style={{ backgroundColor: m.circleBg }}
                                    className="w-6 h-6 sm:w-7 sm:h-7 md:w-7.5 md:h-7.5 rounded-full text-xs sm:text-sm md:text-base flex items-center justify-center text-white ring-2 ring-white dark:ring-slate-900 shadow-xs select-none transition-transform group-hover:scale-110"
                                    title={m.name}
                                  >
                                    <span className="leading-none">{m.emoji}</span>
                                  </span>
                                );
                              })}
                            </div>
                          )}

                          {hasMultiDay && (
                            <span
                              className="w-6 sm:w-7 h-1.5 sm:h-2 rounded-full bg-purple-500/90 dark:bg-purple-400 mt-1"
                              title="Multi-day event spans this date"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Week Toggle */}
              <div className="border-t border-slate-100 dark:border-slate-800 mt-6 pt-3.5 pb-1 flex justify-center">
                <button
                  onClick={() => setShowWeekOnly(!showWeekOnly)}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-[#1A3668] dark:text-purple-300 hover:text-purple-700 py-1 px-4 rounded-full transition-colors cursor-pointer"
                >
                  {showWeekOnly ? (
                    <>
                      <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                      <span>Show full month</span>
                    </>
                  ) : (
                    <>
                      <ChevronUp className="w-4 h-4 stroke-[2.5]" />
                      <span>Show week only</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Selected Day Schedule */}
          <div className="w-full flex-1 min-w-0 flex flex-col order-2 self-start">
            <div className="flex flex-col flex-1">
              {/* Selected Day Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 mb-4">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#1A3668] dark:text-white">
                    {formattedSelectedDate}
                  </h2>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300">
                    {selectedDayEvents.length === 0
                      ? 'No events'
                      : `${selectedDayEvents.length} ${
                          selectedDayEvents.length === 1 ? 'event scheduled' : 'events scheduled'
                        }`}
                  </span>
                </div>

                {canEditEvents && (
                  <button
                    onClick={() => openAddEventModal(selectedDateStr)}
                    style={{ backgroundColor: currentAccent.colorHex }}
                    className="text-xs font-bold text-white px-3.5 py-2 rounded-full shadow-xs transition-opacity cursor-pointer flex items-center gap-1.5 self-start sm:self-auto hover:opacity-90"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Event</span>
                  </button>
                )}
              </div>

              {/* Event switcher tabs if day has multiple events */}
              {selectedDayEvents.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-3">
                  <button
                    onClick={() => setSelectedDayActiveEventId(null)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                      !selectedDayActiveEventId
                        ? 'bg-[#1A3668] text-white border-[#1A3668] dark:bg-purple-600 dark:border-purple-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-[#526586] dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    All Events ({selectedDayEvents.length})
                  </button>
                  {selectedDayEvents.map((evItem) => (
                    <button
                      key={evItem.id}
                      onClick={() => setSelectedDayActiveEventId(evItem.id)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                        selectedDayActiveEventId === evItem.id
                          ? 'bg-[#1A3668] text-white border-[#1A3668] dark:bg-purple-600 dark:border-purple-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-[#526586] dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>{evItem.time || 'TBA'}</span>
                      <span>·</span>
                      <span className="max-w-[140px] truncate">{evItem.title}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected Day Events List or Empty State */}
              {selectedDayEvents.length === 0 ? (
                <div className="bg-white/95 dark:bg-slate-900/90 rounded-[32px] shadow-xs py-14 px-6 flex flex-col items-center justify-center text-center border border-slate-200/80 dark:border-slate-800 min-h-[380px]">
                  <div className="mb-4">
                    <TrioBadges members={settings.members} size="lg" />
                  </div>
                  <h3 className="text-lg font-bold text-[#1A3668] dark:text-white mb-1">
                    No events scheduled on this day
                  </h3>
                  <p className="text-xs sm:text-sm font-medium text-[#475569] dark:text-slate-400 max-w-sm">
                    Select a marked day with colored dots on the calendar, or switch to the List view to see upcoming appearances.
                  </p>

                  {canEditEvents && (
                    <button
                      onClick={() => openAddEventModal(selectedDateStr)}
                      style={{ backgroundColor: currentAccent.colorHex }}
                      className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-white px-4 py-2 rounded-full transition-opacity cursor-pointer shadow-xs hover:opacity-90"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add event on {formattedSelectedDate}</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {(selectedDayActiveEventId
                    ? selectedDayEvents.filter((ev) => ev.id === selectedDayActiveEventId)
                    : selectedDayEvents
                  ).map((ev) => renderFullEventCard(ev))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* DEDICATED FULL-WIDTH CENTERED LIST VIEW: No stretching, clean search & complete event cards */
        <div className="w-full max-w-[1100px] mx-auto flex flex-col gap-5">
          {/* Search bar */}
          <div className="bg-white/95 dark:bg-slate-900/90 rounded-full shadow-xs px-5 py-3.5 flex items-center gap-3 border border-slate-200/80 dark:border-slate-800">
            <Search className="w-4 h-4 text-[#475569] dark:text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search schedule, venues, timezones, official hashtags..."
              className="w-full text-sm font-semibold text-[#1A3668] dark:text-white placeholder-[#94A3B8] focus:outline-none bg-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* List View Header */}
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#607494] dark:text-slate-400">
              Showing {listViewEvents.length} {listViewEvents.length === 1 ? 'Event' : 'Events'}
            </span>
            {canEditEvents && (
              <button
                onClick={() => openAddEventModal(selectedDateStr)}
                style={{ backgroundColor: currentAccent.colorHex }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white px-3.5 py-1.5 rounded-full shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Event</span>
              </button>
            )}
          </div>

          {listViewEvents.length === 0 ? (
            <div className="bg-white/95 dark:bg-slate-900/90 rounded-[28px] shadow-xs py-14 px-6 flex flex-col items-center justify-center text-center border border-slate-200/80 dark:border-slate-800">
              <TrioBadges members={settings.members} size="lg" />
              <h3 className="text-lg font-bold text-[#1A3668] dark:text-white mt-3 mb-1">
                No matching events found
              </h3>
              <p className="text-xs sm:text-sm font-medium text-[#607494] dark:text-slate-400 mb-4">
                Try searching another keyword or adjusting your member filters
              </p>
              {canEditEvents && (
                <button
                  onClick={() => openAddEventModal(selectedDateStr)}
                  style={{ backgroundColor: currentAccent.colorHex }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white px-4 py-2 rounded-full shadow-xs cursor-pointer hover:opacity-90"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Schedule Event</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {listViewEvents.map((ev) => renderFullEventCard(ev))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* FLOATING NAVIGATION PILL (Calendar | List)                     */}
      {/* ============================================================== */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1.5 rounded-full shadow-lg flex items-center gap-1 border border-slate-200/80 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('calendar')}
            style={activeTab === 'calendar' ? { backgroundColor: currentAccent.colorHex } : {}}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-bold transition-all cursor-pointer ${
              activeTab === 'calendar'
                ? 'text-white shadow-sm'
                : 'text-[#526586] dark:text-slate-400 hover:text-[#1A3668] dark:hover:text-white'
            }`}
          >
            <CalendarIcon className="w-4 h-4 stroke-[2.2]" />
            <span>Calendar</span>
          </button>
          <button
            onClick={() => setActiveTab('list')}
            style={activeTab === 'list' ? { backgroundColor: currentAccent.colorHex } : {}}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-bold transition-all cursor-pointer ${
              activeTab === 'list'
                ? 'text-white shadow-sm'
                : 'text-[#526586] dark:text-slate-400 hover:text-[#1A3668] dark:hover:text-white'
            }`}
          >
            <ListIcon className="w-4 h-4 stroke-[2.2]" />
            <span>List</span>
          </button>
        </div>
      </div>



      {/* ============================================================== */}
      {/* MODAL: EVENT REMINDER (CALENDAR, EMAIL, SMS, TIMEZONE CONVERT) */}
      {/* ============================================================== */}
      {reminderModalOpen && reminderEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl w-full max-w-lg p-5 sm:p-6 my-auto max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150 border border-slate-100 dark:border-slate-800">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#1A3668] dark:text-white">
                    Set Event Reminder
                  </h3>
                  <p className="text-xs font-semibold text-[#607494] dark:text-slate-400 truncate max-w-[280px]">
                    {reminderEvent.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReminderModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success Notification */}
            {reminderSuccess && (
              <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 dark:text-emerald-200">
                  <span className="font-bold block">Reminder Confirmed!</span>
                  <span>We've registered your reminder preference for this event in your chosen timezone.</span>
                </div>
              </div>
            )}

            {/* Timezone Selection & Real-Time Fan Time Conversion */}
            <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-800 mb-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-bold text-purple-900 dark:text-purple-300">
                  <Globe className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Your Timezone (International Fans)</span>
                </label>
                <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                  Auto-Converts Time
                </span>
              </div>

              <select
                value={reminderUserTz}
                onChange={(e) => setReminderUserTz(e.target.value)}
                className="w-full rounded-xl border border-purple-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <optgroup label="Popular Fan Zones">
                  {ALL_TIMEZONES.filter((t) => t.category === 'Popular Fan Zones').map((tz) => (
                    <option key={tz.code} value={tz.code}>
                      {tz.label} ({tz.offset}) - {tz.region}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Asia & Pacific">
                  {ALL_TIMEZONES.filter((t) => t.category === 'Asia & Pacific').map((tz) => (
                    <option key={tz.code} value={tz.code}>
                      {tz.label} ({tz.offset})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Americas">
                  {ALL_TIMEZONES.filter((t) => t.category === 'Americas').map((tz) => (
                    <option key={tz.code} value={tz.code}>
                      {tz.label} ({tz.offset})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Europe, Africa & Middle East">
                  {ALL_TIMEZONES.filter((t) => t.category === 'Europe & Africa').map((tz) => (
                    <option key={tz.code} value={tz.code}>
                      {tz.label} ({tz.offset})
                    </option>
                  ))}
                </optgroup>
              </select>

              {reminderConversion && (
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-purple-200/80 dark:border-purple-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Original event schedule:</span>
                    <span className="font-bold text-[#1A3668] dark:text-white">
                      {reminderEvent.time || '18:00'} {reminderEvent.timezone || 'BKK'}
                    </span>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-[11px] text-purple-700 dark:text-purple-300 font-bold block">Your converted local time:</span>
                    <span className="font-extrabold text-[#7C3AED] dark:text-purple-300 text-sm">
                      {reminderConversion.time} {reminderUserTz}
                    </span>
                    {reminderConversion.dayShift && (
                      <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold ml-1">
                        {reminderConversion.dayShift}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Reminder Timing Preference */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1.5">
                Notify me:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {REMINDER_TIMING_OPTIONS.map((opt) => (
                  <button
                    key={opt.minutes}
                    type="button"
                    onClick={() => setReminderTiming(opt.minutes)}
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      reminderTiming === opt.minutes
                        ? 'bg-[#1A3668] dark:bg-purple-600 text-white border-[#1A3668] dark:border-purple-600'
                        : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-[#1A3668] dark:text-slate-200 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reminder Methods Tabs */}
            <div className="mb-4">
              <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 mb-3">
                <button
                  type="button"
                  onClick={() => setReminderTab('calendar')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    reminderTab === 'calendar'
                      ? 'bg-white dark:bg-slate-900 text-[#1A3668] dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-[#1A3668] dark:hover:text-white'
                  }`}
                >
                  <CalendarPlus className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Calendar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReminderTab('email')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    reminderTab === 'email'
                      ? 'bg-white dark:bg-slate-900 text-[#1A3668] dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-[#1A3668] dark:hover:text-white'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>Email</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReminderTab('sms')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    reminderTab === 'sms'
                      ? 'bg-white dark:bg-slate-900 text-[#1A3668] dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-[#1A3668] dark:hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Cellphone</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReminderTab('browser')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    reminderTab === 'browser'
                      ? 'bg-white dark:bg-slate-900 text-[#1A3668] dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-[#1A3668] dark:hover:text-white'
                  }`}
                >
                  <Bell className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Browser</span>
                </button>
              </div>

              {/* TAB 1: 1-Click Calendar Add */}
              {reminderTab === 'calendar' && (
                <div className="space-y-2.5">
                  <p className="text-xs text-[#607494] dark:text-slate-400">
                    Add directly to your personal calendar. Times and alarm notifications will be set automatically:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <a
                      href={createGoogleCalendarUrl(reminderEvent)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleSaveReminder('calendar', 'Google Calendar')}
                      className="py-3 px-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-purple-300 hover:bg-purple-50/50 shadow-xs flex items-center gap-2.5 font-bold text-xs text-[#1A3668] dark:text-white transition-all cursor-pointer"
                    >
                      <CalendarIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span>Google Calendar</span>
                      <ExternalLink className="w-3 h-3 text-slate-400 ml-auto" />
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        downloadIcsFile(reminderEvent, reminderTiming);
                        handleSaveReminder('calendar', 'Apple / Outlook (.ics)');
                      }}
                      className="py-3 px-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-purple-300 hover:bg-purple-50/50 shadow-xs flex items-center gap-2.5 font-bold text-xs text-[#1A3668] dark:text-white transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                      <span>Apple iCal / Outlook (.ics)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: Email Notification */}
              {reminderTab === 'email' && (
                <div className="space-y-3">
                  <p className="text-xs text-[#607494] dark:text-slate-400">
                    Enter your email to receive an alert with direct stream links before the event begins:
                  </p>

                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={reminderEmail}
                      onChange={(e) => setReminderEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!reminderEmail.trim() || !reminderEmail.includes('@')) {
                          showToast('Please enter a valid email address');
                          return;
                        }
                        handleSaveReminder('email', reminderEmail.trim());
                      }}
                      className="px-4 py-2 rounded-xl bg-[#1A3668] dark:bg-purple-600 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer transition-all"
                    >
                      Set Email Alert
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: Cellphone / SMS / WhatsApp Notification */}
              {reminderTab === 'sms' && (
                <div className="space-y-3">
                  <p className="text-xs text-[#607494] dark:text-slate-400">
                    Choose your country code and mobile number for SMS notifications, or send a pre-filled reminder to WhatsApp:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <select
                      value={reminderCountryCode}
                      onChange={(e) => setReminderCountryCode(e.target.value)}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-2 text-xs font-bold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400 cursor-pointer"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.country} value={c.code}>
                          {c.flag} {c.country} ({c.code})
                        </option>
                      ))}
                    </select>

                    <input
                      type="tel"
                      value={reminderPhone}
                      onChange={(e) => setReminderPhone(e.target.value)}
                      placeholder="Mobile number"
                      className="sm:col-span-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (!reminderPhone.trim()) {
                          showToast('Please enter your mobile phone number');
                          return;
                        }
                        handleSaveReminder('sms', `${reminderCountryCode} ${reminderPhone.trim()}`);
                      }}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-[#1A3668] dark:bg-purple-600 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Save Mobile SMS Reminder</span>
                    </button>

                    <a
                      href={getWhatsAppReminderUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleSaveReminder('whatsapp', 'WhatsApp Alert')}
                      className="py-2.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp Alert</span>
                    </a>
                  </div>
                </div>
              )}

              {/* TAB 4: Browser Desktop / PWA Alert */}
              {reminderTab === 'browser' && (
                <div className="space-y-3">
                  <p className="text-xs text-[#607494] dark:text-slate-400">
                    Get a real-time pop-up notification on this computer or phone right when the event or stream is starting:
                  </p>

                  <button
                    type="button"
                    onClick={handleEnableBrowserNotification}
                    className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <BellRing className="w-4 h-4" />
                    <span>Enable Browser Web Notification</span>
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400">
                Stored safely in your device preferences
              </span>
              <button
                type="button"
                onClick={() => setReminderModalOpen(false)}
                className="px-4 py-1.5 rounded-full text-xs font-bold text-[#1A3668] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: MY SAVED REMINDERS LIST                                 */}
      {/* ============================================================== */}
      {myRemindersModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl w-full max-w-md p-6 max-h-[85vh] overflow-y-auto border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BellRing className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-base font-bold text-[#1A3668] dark:text-white">
                  My Scheduled Reminders ({userReminders.length})
                </h3>
              </div>
              <button
                onClick={() => setMyRemindersModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {userReminders.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                You haven't set any event reminders yet.
              </p>
            ) : (
              <div className="space-y-2.5">
                {userReminders.map((r) => (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <h4 className="font-bold text-[#1A3668] dark:text-white truncate mb-0.5">
                        {r.eventTitle}
                      </h4>
                      <div className="text-[11px] font-semibold text-[#607494] dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
                        <span>⏰ {r.convertedTimeStr}</span>
                        <span>·</span>
                        <span>{r.timingLabel}</span>
                        {r.targetContact && (
                          <>
                            <span>·</span>
                            <span className="truncate max-w-[140px] text-purple-700 dark:text-purple-400">
                              {r.targetContact}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteReminder(r.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 cursor-pointer"
                      title="Remove Reminder"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: ADD / EDIT EVENT FORM                                 */}
      {/* ============================================================== */}
      {eventModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[28px] shadow-xl w-full max-w-lg p-5 sm:p-6 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#1A3668] dark:text-white">
                {editingEvent ? 'Edit Schedule Event' : 'Add Schedule Event'}
              </h3>
              <button
                onClick={() => setEventModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-4">
              {/* Event Title */}
              <div>
                <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. GMMTVNEXT: GENERATION HAPPY"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              {/* Date & Date Range Selection */}
              <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-800 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-purple-900 dark:text-purple-300">
                    <CalendarIcon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Event Schedule Date(s)</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formIsMultiDay}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setFormIsMultiDay(checked);
                        if (checked && (!formEndDate || formEndDate <= formDate)) {
                          // Default to next day (2-day event)
                          const next = parseDateKey(formDate);
                          next.setDate(next.getDate() + 1);
                          setFormEndDate(toDateKey(next.getFullYear(), next.getMonth(), next.getDate()));
                        }
                      }}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-purple-900 dark:text-purple-300">
                      Multi-day Event (2 or 3+ days)
                    </span>
                  </label>
                </div>

                {!formIsMultiDay ? (
                  <div>
                    <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full rounded-xl border border-purple-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                          Start Date *
                        </label>
                        <input
                          type="date"
                          required
                          value={formDate}
                          onChange={(e) => {
                            setFormDate(e.target.value);
                            if (formEndDate && formEndDate < e.target.value) {
                              setFormEndDate(e.target.value);
                            }
                          }}
                          className="w-full rounded-xl border border-purple-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                          End Date *
                        </label>
                        <input
                          type="date"
                          required
                          min={formDate}
                          value={formEndDate}
                          onChange={(e) => setFormEndDate(e.target.value)}
                          className="w-full rounded-xl border border-purple-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                        />
                      </div>
                    </div>

                    {/* Quick set buttons for 2-day or 3-day events */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold text-[#607494] dark:text-slate-400">Quick set:</span>
                      <button
                        type="button"
                        onClick={() => {
                          const dt = parseDateKey(formDate);
                          dt.setDate(dt.getDate() + 1);
                          setFormEndDate(toDateKey(dt.getFullYear(), dt.getMonth(), dt.getDate()));
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 border border-purple-200 dark:border-slate-700 text-[#1A3668] dark:text-white hover:bg-purple-100 dark:hover:bg-purple-900/50 cursor-pointer shadow-2xs"
                      >
                        2 Days (e.g. Weekend)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const dt = parseDateKey(formDate);
                          dt.setDate(dt.getDate() + 2);
                          setFormEndDate(toDateKey(dt.getFullYear(), dt.getMonth(), dt.getDate()));
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 border border-purple-200 dark:border-slate-700 text-[#1A3668] dark:text-white hover:bg-purple-100 dark:hover:bg-purple-900/50 cursor-pointer shadow-2xs"
                      >
                        3 Days (e.g. 3-Day Showcase)
                      </button>
                    </div>

                    {formEndDate && formEndDate > formDate && (
                      <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-indigo-900 dark:text-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span>✨ {getEventDaysCount(formDate, formEndDate)}-Day Event Duration:</span>
                        <span className="font-extrabold text-indigo-700 dark:text-indigo-300">
                          {formatEventFullDateRange(formDate, formEndDate)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Time & Timezone Selection */}
              <div>
                <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                  Time & Timezone (12-Hour AM/PM)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    placeholder="e.g. 18:00 or 6:00 PM"
                    className="w-1/2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                  />
                  <select
                    value={formTimezone}
                    onChange={(e) => setFormTimezone(e.target.value)}
                    className="w-1/2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-2 text-xs font-bold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400 cursor-pointer"
                  >
                    <optgroup label="Popular Fan Zones">
                      {ALL_TIMEZONES.filter((t) => t.category === 'Popular Fan Zones').map((tz) => (
                        <option key={tz.code} value={tz.code}>
                          {tz.label} ({tz.offset})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Asia & Pacific">
                      {ALL_TIMEZONES.filter((t) => t.category === 'Asia & Pacific').map((tz) => (
                        <option key={tz.code} value={tz.code}>
                          {tz.label} ({tz.offset})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Americas">
                      {ALL_TIMEZONES.filter((t) => t.category === 'Americas').map((tz) => (
                        <option key={tz.code} value={tz.code}>
                          {tz.label} ({tz.offset})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Europe, Africa & Middle East">
                      {ALL_TIMEZONES.filter((t) => t.category === 'Europe & Africa').map((tz) => (
                        <option key={tz.code} value={tz.code}>
                          {tz.label} ({tz.offset})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Custom">
                      <option value="CUSTOM">Custom Timezone...</option>
                    </optgroup>
                  </select>
                </div>

                {formTime && (
                  <div className="mt-1.5 text-[11px] font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1.5 px-1">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Displays as: <strong className="font-extrabold">{formatTime12h(formTime)} {formTimezone !== 'CUSTOM' ? formTimezone : customTimezone}</strong>
                    </span>
                  </div>
                )}

                {formTimezone === 'CUSTOM' && (
                  <input
                    type="text"
                    value={customTimezone}
                    onChange={(e) => setCustomTimezone(e.target.value)}
                    placeholder="e.g. NZST, CEST, Dubai (GST)"
                    className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                  />
                )}

                {selectedTzObj && formTimezone !== 'CUSTOM' && (
                  <div className="flex items-center gap-1 text-[11px] font-medium text-[#607494] dark:text-slate-400 mt-1 px-1">
                    <Globe className="w-3 h-3 text-purple-500 shrink-0" />
                    <span className="truncate">{selectedTzObj.region}</span>
                  </div>
                )}
              </div>

              {/* Members Involved */}
              <div>
                <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1.5">
                  Members Involved
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {settings.members.map((m) => {
                    const checked = formMembers.includes(m.id);
                    return (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => {
                          setFormMembers((prev) =>
                            prev.includes(m.id)
                              ? prev.filter((id) => id !== m.id)
                              : [...prev, m.id]
                          );
                        }}
                        style={{
                          backgroundColor: checked
                            ? isDarkMode
                              ? '#1E293B'
                              : m.pillBg
                            : isDarkMode
                            ? '#0F172A'
                            : '#F8FAFC',
                          borderColor: checked ? m.pillBorder : isDarkMode ? '#334155' : '#E2E8F0'
                        }}
                        className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border text-xs font-bold text-[#1A3668] dark:text-white transition-all cursor-pointer"
                      >
                        <span>{m.emoji}</span>
                        <span className="truncate">{m.name}</span>
                        {checked && <Check className="w-3.5 h-3.5 text-purple-700 dark:text-purple-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Poster Photo */}
              <div className="p-3 rounded-2xl bg-purple-50/50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-purple-900 dark:text-purple-300">
                    <FileImage className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Event Poster / Photo Media</span>
                  </label>
                  {formPosterUrl && (
                    <button
                      type="button"
                      onClick={() => setFormPosterUrl('')}
                      className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                    >
                      Remove photo
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formPosterUrl}
                    onChange={(e) => setFormPosterUrl(e.target.value)}
                    placeholder="Paste image link URL (https://...)"
                    className="flex-1 rounded-xl border border-purple-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-[#1A3668] dark:text-white"
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePosterFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer shrink-0"
                  >
                    Upload File
                  </button>
                </div>

                {formPosterUrl && (
                  <div className="w-full h-24 rounded-xl overflow-hidden bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 flex items-center justify-center">
                    <img src={formPosterUrl} alt="Preview" className="h-full object-contain" />
                  </div>
                )}
              </div>

              {/* Location & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                    Location / Venue
                  </label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. UNION HALL, UNION MALL"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="Event / Broadcast / Fan Event"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              {/* Google Maps Location Link */}
              <div className="p-3 rounded-2xl bg-sky-50/60 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1 text-xs font-bold text-sky-900 dark:text-sky-300">
                    <MapPin className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    <span>Google Maps Location Link</span>
                  </label>
                  {formLocation.trim() && (
                    <button
                      type="button"
                      onClick={handleAutoGenerateMapsLink}
                      className="text-[11px] font-bold text-sky-700 dark:text-sky-400 hover:text-sky-900 underline cursor-pointer"
                    >
                      + Auto-fill from venue name
                    </button>
                  )}
                </div>

                <input
                  type="url"
                  value={formLocationUrl}
                  onChange={(e) => setFormLocationUrl(e.target.value)}
                  placeholder="https://maps.app.goo.gl/... or https://maps.google.com/..."
                  className="w-full rounded-xl border border-sky-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-sky-400"
                />
              </div>

              {/* Where to Watch */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-[#1A3668] dark:text-white">
                    <Tv className="w-3.5 h-3.5 text-red-500" />
                    <span>Where to Watch (Streaming Links)</span>
                  </label>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {formWatchPlatforms.length} added
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10.5px] font-bold text-slate-400">Quick add:</span>
                  {STREAMING_PLATFORM_PRESETS.slice(0, 4).map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setNewPlatformName(p.name);
                        setNewPlatformType(p.platform);
                        setNewPlatformUrl(p.defaultUrl);
                      }}
                      className="text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[#1A3668] dark:text-white hover:bg-purple-50 cursor-pointer"
                    >
                      {p.name} {p.platform}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newPlatformName}
                    onChange={(e) => setNewPlatformName(e.target.value)}
                    placeholder="Channel (e.g. GMMTV)"
                    className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 px-2.5 py-1.5 text-xs font-semibold text-[#1A3668] dark:text-white"
                  />
                  <input
                    type="text"
                    value={newPlatformType}
                    onChange={(e) => setNewPlatformType(e.target.value)}
                    placeholder="Platform (e.g. YouTube)"
                    className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 px-2.5 py-1.5 text-xs font-semibold text-[#1A3668] dark:text-white"
                  />
                  <div className="flex gap-1.5">
                    <input
                      type="url"
                      value={newPlatformUrl}
                      onChange={(e) => setNewPlatformUrl(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 px-2.5 py-1.5 text-xs font-semibold text-[#1A3668] dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddWatchPlatform}
                      className="px-2.5 py-1.5 rounded-xl bg-[#1A3668] dark:bg-purple-600 text-white text-xs font-bold shrink-0 cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {formWatchPlatforms.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {formWatchPlatforms.map((wp) => (
                      <div
                        key={wp.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-semibold"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Tv className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                          <span className="font-bold text-[#1A3668] dark:text-white">{wp.name}</span>
                          <span className="text-slate-400">·</span>
                          <span className="text-[#607494] dark:text-slate-300">{wp.platform}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveWatchPlatform(wp.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                  Event Description
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Detailed explanation of the event..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              {/* Hashtags */}
              <div>
                <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                  Official Hashtags
                </label>
                <input
                  type="text"
                  value={formHashtags}
                  onChange={(e) => setFormHashtags(e.target.value)}
                  placeholder="e.g. #GMMTVNEXT #JimmySea #Avocean"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              {/* Link */}
              <div>
                <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                  More Info / Official Announcement Link (Optional)
                </label>
                <input
                  type="url"
                  value={formLink}
                  onChange={(e) => setFormLink(e.target.value)}
                  placeholder="https://x.com/... or official ticket link"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEventModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-bold text-[#526586] dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full text-xs font-bold text-white bg-[#1A3668] dark:bg-purple-600 hover:bg-slate-800 shadow-xs cursor-pointer active:scale-95 transition-all"
                >
                  {editingEvent ? 'Save Changes' : 'Add to Calendar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: SEPARATE OWNER & ADMIN LOGIN MODAL                      */}
      {/* ============================================================== */}
      {loginModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[28px] shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-150 border border-slate-100 dark:border-slate-800">
            {/* Top Close & Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    loginRoleTab === 'owner'
                      ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                      : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                  }`}
                >
                  {loginRoleTab === 'owner' ? <Crown className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                </div>
                <h3 className="text-base font-bold text-[#1A3668] dark:text-white">
                  {loginRoleTab === 'owner' ? 'Owner Sign In' : 'Admin Sign In'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setLoginModalOpen(false);
                  setLoginPinError('');
                  setLoginPinInput('');
                }}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Role Switcher Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
              <button
                type="button"
                onClick={() => {
                  setLoginRoleTab('owner');
                  setLoginPinError('');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  loginRoleTab === 'owner'
                    ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-xs'
                    : 'text-[#607494] dark:text-slate-400 hover:text-[#1A3668] dark:hover:text-white'
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Owner</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoginRoleTab('admin');
                  setLoginPinError('');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  loginRoleTab === 'admin'
                    ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 shadow-xs'
                    : 'text-[#607494] dark:text-slate-400 hover:text-[#1A3668] dark:hover:text-white'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin (Helpers)</span>
              </button>
            </div>

            <p className="text-xs text-[#607494] dark:text-slate-400 mb-4">
              {loginRoleTab === 'owner'
                ? 'Owner has full control to customize the banner, edit members, manage passcodes, and add or delete events.'
                : 'Admins can add or edit events in the calendar to help keep the schedule up to date.'}
            </p>

            <form onSubmit={handleVerifyLogin} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                  {loginRoleTab === 'owner' ? 'Owner Passcode' : 'Admin Passcode'}
                </label>
                <div className="relative">
                  <input
                    type={showLoginPin ? 'text' : 'password'}
                    required
                    value={loginPinInput}
                    onChange={(e) => {
                      setLoginPinInput(e.target.value);
                      setLoginPinError('');
                    }}
                    placeholder={loginRoleTab === 'owner' ? 'Enter owner passcode' : 'Enter admin passcode'}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 pr-10 text-sm font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPin(!showLoginPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showLoginPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {loginPinError && (
                  <p className="text-[11px] font-bold text-rose-600 mt-1.5">
                    {loginPinError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setLoginModalOpen(false);
                    setLoginPinError('');
                    setLoginPinInput('');
                  }}
                  className="px-3.5 py-2 rounded-full text-xs font-bold text-[#526586] dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-full text-xs font-bold text-white shadow-xs cursor-pointer active:scale-95 transition-all ${
                    loginRoleTab === 'owner'
                      ? 'bg-[#7C3AED] hover:bg-[#6D28D9]'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {loginRoleTab === 'owner' ? 'Unlock Owner Access' : 'Unlock Admin Access'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: PASSCODE MANAGEMENT (OWNER ONLY)                        */}
      {/* ============================================================== */}
      {changePasscodeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1A3668] dark:text-white">
                    Passcode Management
                  </h3>
                  <p className="text-xs font-semibold text-[#607494] dark:text-slate-400">
                    Manage Owner and Admin security passcodes
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setChangePasscodeModalOpen(false);
                  setPasscodeError('');
                  setCurrentOwnerPinCheck('');
                  setNewOwnerPinInput('');
                  setConfirmOwnerPinInput('');
                  setNewAdminPinInput('');
                }}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Passcode Tabs: Owner Code vs Admin Helper Code */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
              <button
                type="button"
                onClick={() => {
                  setPasscodeModalTab('owner');
                  setPasscodeError('');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  passcodeModalTab === 'owner'
                    ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-xs'
                    : 'text-[#607494] dark:text-slate-400 hover:text-[#1A3668] dark:hover:text-white'
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Owner Passcode</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPasscodeModalTab('admin');
                  setPasscodeError('');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  passcodeModalTab === 'admin'
                    ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 shadow-xs'
                    : 'text-[#607494] dark:text-slate-400 hover:text-[#1A3668] dark:hover:text-white'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Helper Code</span>
              </button>
            </div>

            {passcodeModalTab === 'owner' ? (
              /* TAB 1: CHANGE OWNER PASSCODE */
              <form onSubmit={handleChangeOwnerPasscode} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                    Current Owner Passcode
                  </label>
                  <div className="relative">
                    <input
                      type={showPasscodeField ? 'text' : 'password'}
                      required
                      value={currentOwnerPinCheck}
                      onChange={(e) => {
                        setCurrentOwnerPinCheck(e.target.value);
                        setPasscodeError('');
                      }}
                      placeholder="Enter current owner passcode"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 pr-10 text-sm font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasscodeField(!showPasscodeField)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showPasscodeField ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                    New Owner Passcode
                  </label>
                  <input
                    type={showPasscodeField ? 'text' : 'password'}
                    required
                    value={newOwnerPinInput}
                    onChange={(e) => {
                      setNewOwnerPinInput(e.target.value);
                      setPasscodeError('');
                    }}
                    placeholder="Enter new owner passcode"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                    Confirm New Owner Passcode
                  </label>
                  <input
                    type={showPasscodeField ? 'text' : 'password'}
                    required
                    value={confirmOwnerPinInput}
                    onChange={(e) => {
                      setConfirmOwnerPinInput(e.target.value);
                      setPasscodeError('');
                    }}
                    placeholder="Confirm new owner passcode"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                {passcodeError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-xs font-bold text-rose-600 dark:text-rose-300">
                    {passcodeError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setChangePasscodeModalOpen(false);
                      setPasscodeError('');
                      setCurrentOwnerPinCheck('');
                      setNewOwnerPinInput('');
                      setConfirmOwnerPinInput('');
                    }}
                    className="px-4 py-2 rounded-full text-xs font-bold text-[#526586] dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-full text-xs font-bold text-white bg-[#7C3AED] hover:bg-[#6D28D9] shadow-xs cursor-pointer active:scale-95 transition-all"
                  >
                    Update Owner Passcode
                  </button>
                </div>
              </form>
            ) : (
              /* TAB 2: MANAGE ADMIN / HELPER PASSCODE */
              <form onSubmit={handleChangeAdminPasscode} className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 text-xs text-[#1A3668] dark:text-blue-200 space-y-1.5">
                  <span className="font-bold block flex items-center gap-1.5 text-blue-900 dark:text-blue-300">
                    <Shield className="w-3.5 h-3.5 text-blue-600" />
                    For Event Helpers & Collaborators
                  </span>
                  <span>
                    Admins can log in with this code to add or edit calendar events. They cannot edit banner settings, change member designs, or delete events.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                    Set New Admin Passcode
                  </label>
                  <div className="relative">
                    <input
                      type={showPasscodeField ? 'text' : 'password'}
                      required
                      value={newAdminPinInput}
                      onChange={(e) => {
                        setNewAdminPinInput(e.target.value);
                        setPasscodeError('');
                      }}
                      placeholder="Enter new admin passcode"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 pr-10 text-sm font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-blue-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasscodeField(!showPasscodeField)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showPasscodeField ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {passcodeError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-xs font-bold text-rose-600 dark:text-rose-300">
                    {passcodeError}
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      const shareText = `You can help manage events on the Jimmy Sea Avocean Calendar! Use Admin passcode: ${settings.adminPin}`;
                      navigator.clipboard.writeText(shareText);
                      showToast('Admin helper code copied to clipboard!');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 border border-blue-200 dark:border-blue-800 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Helper Invite</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setChangePasscodeModalOpen(false);
                        setPasscodeError('');
                        setNewAdminPinInput('');
                      }}
                      className="px-3.5 py-2 rounded-full text-xs font-bold text-[#526586] dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-full text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs cursor-pointer active:scale-95 transition-all"
                    >
                      Save Admin Code
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: CUSTOMIZE BANNER, GREETING & MEMBER PILLS (OWNER)     */}
      {/* ============================================================== */}
      {settingsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[28px] shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#1A3668] dark:text-white">
                Customize Banner, Header & Members
              </h3>
              <button
                onClick={() => setSettingsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              {/* Passcode Management Shortcut */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-[#1A3668] dark:text-white">
                    <Key className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Security Passcodes</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsModalOpen(false);
                      setPasscodeModalTab('owner');
                      setChangePasscodeModalOpen(true);
                    }}
                    className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                  >
                    Change Passcodes →
                  </button>
                </div>
                <p className="text-[11px] font-medium text-[#607494] dark:text-slate-400">
                  Manage both your Owner passcode (full control) and Admin passcode (for helpers to add/edit events).
                </p>
              </div>

              {/* Default Time Format Selection */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-bold text-[#1A3668] dark:text-white">
                  <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Time Display Format</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDraftTimeFormat('12h')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center justify-center gap-1.5 ${
                      draftTimeFormat === '12h'
                        ? 'bg-[#1A3668] dark:bg-purple-600 text-white border-[#1A3668] dark:border-purple-600 shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-[#526586] dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>12-Hour (6:00 PM)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraftTimeFormat('24h')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center justify-center gap-1.5 ${
                      draftTimeFormat === '24h'
                        ? 'bg-[#1A3668] dark:bg-purple-600 text-white border-[#1A3668] dark:border-purple-600 shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-[#526586] dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>24-Hour (18:00)</span>
                  </button>
                </div>
              </div>

              {/* Website Icon & Browser Favicon Selection */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-[#1A3668] dark:text-white">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Website Icon & Browser Favicon</span>
                  </label>
                  <span className="text-[10.5px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/80 px-2 py-0.5 rounded-full">
                    Live Tab Icon
                  </span>
                </div>
                <p className="text-[11px] text-[#607494] dark:text-slate-400">
                  This icon appears on your browser tab, bookmarks bar, and when saved as a mobile home screen shortcut.
                </p>

                {/* Preset Options */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setDraftWebsiteIcon('trio')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col items-center text-center gap-1.5 ${
                      draftWebsiteIcon === 'trio' || !draftWebsiteIcon
                        ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-500 text-purple-900 dark:text-purple-200 ring-2 ring-purple-400/30 font-bold'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-[#526586] dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-center -space-x-1 py-1">
                      <span className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-[10px] text-white shadow-xs">🥑</span>
                      <span className="w-5 h-5 rounded-full bg-sky-500 flex items-center justify-center text-[10px] text-white shadow-xs">🌊</span>
                      <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] text-white shadow-xs">💚</span>
                    </div>
                    <span className="text-[11px] font-bold">Official Trio</span>
                    <span className="text-[9.5px] text-slate-400">Default SVG</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDraftWebsiteIcon('jimmy')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col items-center text-center gap-1.5 ${
                      draftWebsiteIcon === 'jimmy'
                        ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-500 text-purple-900 dark:text-purple-200 ring-2 ring-purple-400/30 font-bold'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-[#526586] dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-sm shadow-xs text-white">
                      🥑
                    </div>
                    <span className="text-[11px] font-bold">Jimmy</span>
                    <span className="text-[9.5px] text-slate-400">Avocado Violet</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDraftWebsiteIcon('sea')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col items-center text-center gap-1.5 ${
                      draftWebsiteIcon === 'sea'
                        ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 text-sky-900 dark:text-sky-200 ring-2 ring-sky-400/30 font-bold'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-[#526586] dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-sky-600 flex items-center justify-center text-sm shadow-xs text-white">
                      🌊
                    </div>
                    <span className="text-[11px] font-bold">Sea</span>
                    <span className="text-[9.5px] text-slate-400">Ocean Azure</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDraftWebsiteIcon('avocean')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col items-center text-center gap-1.5 ${
                      draftWebsiteIcon === 'avocean'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-400/30 font-bold'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-[#526586] dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-sm shadow-xs text-white">
                      💚
                    </div>
                    <span className="text-[11px] font-bold">Avocean</span>
                    <span className="text-[9.5px] text-slate-400">Fan Heart</span>
                  </button>
                </div>

                {/* Custom Icon / Emoji / Image Input */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#526586] dark:text-slate-400">
                      Or use custom emoji or image URL:
                    </label>
                    {draftWebsiteIcon && !['trio', 'jimmy', 'sea', 'avocean'].includes(draftWebsiteIcon) && (
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Custom Active</span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={draftWebsiteIcon === 'trio' || draftWebsiteIcon === 'jimmy' || draftWebsiteIcon === 'sea' || draftWebsiteIcon === 'avocean' ? '' : draftWebsiteIcon}
                    onChange={(e) => setDraftWebsiteIcon(e.target.value.trim() || 'trio')}
                    placeholder="Enter custom emoji (e.g. 🥑, 🌊, 🫶, 🐬) or image URL"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-[#1A3668] dark:text-white placeholder:text-slate-400"
                  />
                </div>

                {/* Live Tab Preview Box */}
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Live Browser Tab Preview
                  </span>
                  <div className="flex items-center gap-2 max-w-[220px] bg-white dark:bg-slate-800 py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs">
                    <span className="text-sm shrink-0">
                      {draftWebsiteIcon === 'jimmy'
                        ? '🥑'
                        : draftWebsiteIcon === 'sea'
                        ? '🌊'
                        : draftWebsiteIcon === 'avocean'
                        ? '💚'
                        : draftWebsiteIcon && !['trio', 'jimmy', 'sea', 'avocean'].includes(draftWebsiteIcon)
                        ? draftWebsiteIcon.length <= 4 ? draftWebsiteIcon : '🌐'
                        : '🥑'}
                    </span>
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                      JIMMY SEA AVOCEAN HUB
                    </span>
                    <span className="text-slate-400 text-[10px] ml-auto">✕</span>
                  </div>
                </div>
              </div>

              {/* Banner Photo Section */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-3">
                <span className="block text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                  Dedicated Banner Photo
                </span>
                <div>
                  <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                    Banner Photo URL (Separated from text)
                  </label>
                  <input
                    type="url"
                    value={draftBannerImageUrl}
                    onChange={(e) => setDraftBannerImageUrl(e.target.value)}
                    placeholder="https://... (direct photo link)"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-[#1A3668] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                    Banner Fallback Theme (If no photo URL)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {BANNER_PRESETS.map((preset) => (
                      <button
                        type="button"
                        key={preset.id}
                        onClick={() => setDraftBannerPreset(preset.id)}
                        style={{ background: preset.gradient }}
                        className={`py-2 px-2 rounded-xl text-[11px] font-bold text-[#1A3668] border-2 cursor-pointer ${
                          draftBannerPreset === preset.id
                            ? 'border-[#1A3668] dark:border-white'
                            : 'border-white dark:border-slate-800'
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Hub Title & Size (Owner Only) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#526586] dark:text-slate-400">
                    Hub Title (JIMMY SEA AVOCEAN HUB)
                  </label>
                  <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                    Owner Editable
                  </span>
                </div>
                <input
                  type="text"
                  value={draftBannerTitle}
                  onChange={(e) => setDraftBannerTitle(e.target.value)}
                  placeholder="JIMMY SEA AVOCEAN HUB"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm font-bold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-500"
                />
                <div>
                  <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                    Title Font Size
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(
                      [
                        { id: 'compact', label: 'Compact', sub: '26px' },
                        { id: 'medium', label: 'Medium', sub: '32px' },
                        { id: 'large', label: 'Large', sub: '42px' },
                        { id: 'xlarge', label: 'X-Large', sub: '54px' }
                      ] as const
                    ).map((opt) => (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => setDraftBannerTitleSize(opt.id)}
                        className={`py-1.5 px-1 rounded-xl text-center text-xs font-bold cursor-pointer transition-all border ${
                          draftBannerTitleSize === opt.id
                            ? 'bg-[#1A3668] dark:bg-purple-600 text-white border-transparent shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        <div className="leading-tight">{opt.label}</div>
                        <div className="text-[9px] opacity-75">{opt.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Header Subtitle Text & Size (Owner Only) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#526586] dark:text-slate-400">
                    Header Subtitle
                  </label>
                  <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                    Owner Editable
                  </span>
                </div>
                <input
                  type="text"
                  value={draftBannerSubtitle}
                  onChange={(e) => setDraftBannerSubtitle(e.target.value)}
                  placeholder="Official Fan Schedule, Appearances & Trending Projects 🥑🌊💚"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-500"
                />
                <div>
                  <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                    Subtitle Font Size
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(
                      [
                        { id: 'small', label: 'Small', sub: '11px' },
                        { id: 'medium', label: 'Medium', sub: '13px' },
                        { id: 'large', label: 'Large', sub: '15px' },
                        { id: 'xlarge', label: 'X-Large', sub: '17px' }
                      ] as const
                    ).map((opt) => (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => setDraftBannerSubtitleSize(opt.id)}
                        className={`py-1.5 px-1 rounded-xl text-center text-xs font-bold cursor-pointer transition-all border ${
                          draftBannerSubtitleSize === opt.id
                            ? 'bg-[#1A3668] dark:bg-purple-600 text-white border-transparent shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        <div className="leading-tight">{opt.label}</div>
                        <div className="text-[9px] opacity-75">{opt.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                  Top Greeting Subtitle
                </label>
                <input
                  type="text"
                  value={draftGreeting}
                  onChange={(e) => setDraftGreeting(e.target.value)}
                  placeholder="Hey ErnestTheStan!"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm font-semibold text-[#1A3668] dark:text-white"
                />
              </div>

              {/* Members */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-[#526586] dark:text-slate-400">
                  Member Filter Pills (Name, Icon/Emoji & Badge Color)
                </label>
                {draftMembers.map((m, idx) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center gap-2.5"
                  >
                    <input
                      type="text"
                      value={m.emoji}
                      onChange={(e) => {
                        const updated = [...draftMembers];
                        updated[idx].emoji = e.target.value;
                        setDraftMembers(updated);
                      }}
                      className="w-11 h-10 text-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-base text-[#1A3668] dark:text-white"
                      title="Emoji / Icon"
                    />
                    <input
                      type="text"
                      value={m.name}
                      onChange={(e) => {
                        const updated = [...draftMembers];
                        updated[idx].name = e.target.value;
                        setDraftMembers(updated);
                      }}
                      className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-bold text-[#1A3668] dark:text-white"
                      placeholder="Member name"
                    />
                    <input
                      type="color"
                      value={m.circleBg}
                      onChange={(e) => {
                        const updated = [...draftMembers];
                        updated[idx].circleBg = e.target.value;
                        setDraftMembers(updated);
                      }}
                      className="w-9 h-9 rounded-lg cursor-pointer border-0 bg-transparent"
                      title="Badge Circle Color"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSettingsModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-bold text-[#526586] dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full text-xs font-bold text-white bg-[#1A3668] dark:bg-purple-600 hover:bg-slate-800 cursor-pointer"
                >
                  Save Customizations
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: BACKUP / EXPORT / IMPORT JSON                         */}
      {/* ============================================================== */}
      {backupModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[28px] shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-[#1A3668] dark:text-white">
                Backup & Restore Schedule
              </h3>
              <button
                onClick={() => setBackupModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs font-medium text-[#607494] dark:text-slate-400 mb-4">
              Your edits are stored safely in your browser. You can export a JSON backup file, import an existing backup, or reset back to default samples.
            </p>

            <div className="space-y-2 mb-4">
              <button
                onClick={handleDownloadBackup}
                className="w-full py-2.5 px-4 rounded-xl bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 text-sky-900 dark:text-sky-200 font-bold text-xs flex items-center justify-center gap-2 border border-sky-200 dark:border-sky-800 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export Current Schedule (.json)</span>
              </button>

              <button
                onClick={handleResetToDefaults}
                className="w-full py-2 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:text-rose-700 text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Sample Schedule</span>
              </button>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
              <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1.5">
                Import Schedule JSON
              </label>
              <textarea
                rows={4}
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder="Paste backup JSON here..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs font-mono text-[#1A3668] dark:text-white mb-3 focus:outline-none focus:border-purple-400"
              />
              <button
                onClick={handleImportBackup}
                disabled={!importJsonText.trim()}
                className="w-full py-2.5 px-4 rounded-xl bg-[#1A3668] dark:bg-purple-600 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Restore from JSON</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: LEAVE A MESSAGE (VIEWERS & FANS)                       */}
      {/* ============================================================== */}
      {leaveMessageModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1A3668] dark:text-white">
                    Leave a Message
                  </h3>
                  <p className="text-xs font-semibold text-[#607494] dark:text-slate-400">
                    Notify admins or owner about upcoming events
                  </p>
                </div>
              </div>
              <button
                onClick={() => setLeaveMessageModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {messageSubmitted ? (
              <div className="py-8 flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-[#1A3668] dark:text-white">
                  Message Sent!
                </h4>
                <p className="text-xs font-medium text-[#607494] dark:text-slate-400 max-w-xs">
                  Thank you! The schedule admins and owner have received your note and will review the event details.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendFanMessage} className="space-y-3.5">
                <div className="p-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900 text-xs text-purple-900 dark:text-purple-200">
                  Did we forget to list an upcoming schedule, interview, or appearance? Let us know below so we can keep the calendar complete!
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                    Your Name or Social Handle (Optional)
                  </label>
                  <input
                    type="text"
                    value={msgSenderName}
                    onChange={(e) => setMsgSenderName(e.target.value)}
                    placeholder="e.g. AvoceanFan_BKK or @twitterhandle"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                    Event Title / Topic *
                  </label>
                  <input
                    type="text"
                    required
                    value={msgEventTitle}
                    onChange={(e) => setMsgEventTitle(e.target.value)}
                    placeholder="e.g. JimmySea live shopping on GMMTV"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                      Event Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={msgEventDate}
                      onChange={(e) => setMsgEventDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                      Source / Link (Optional)
                    </label>
                    <input
                      type="url"
                      value={msgSourceUrl}
                      onChange={(e) => setMsgSourceUrl(e.target.value)}
                      placeholder="https://x.com/..."
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                    Details / Message *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={msgContent}
                    onChange={(e) => setMsgContent(e.target.value)}
                    placeholder="Describe time, venue, channel or any extra info..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setLeaveMessageModalOpen(false)}
                    className="px-3.5 py-2 rounded-full text-xs font-bold text-[#526586] dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ backgroundColor: currentAccent.colorHex }}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold text-white shadow-xs cursor-pointer active:scale-95 transition-all hover:opacity-90"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Message</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 5: INBOX (ADMINS & OWNER ONLY)                           */}
      {/* ============================================================== */}
      {inboxModalOpen && canEditEvents && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                  <Inbox className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1A3668] dark:text-white">
                    Viewer Messages & Suggestions
                  </h3>
                  <p className="text-xs font-semibold text-[#607494] dark:text-slate-400">
                    Visible only to Admins and Owner ({fanMessages.length} total)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInboxModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {fanMessages.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <Inbox className="w-10 h-10 text-slate-300 mb-2" />
                <span className="text-sm font-bold text-[#1A3668] dark:text-white">
                  Inbox is empty
                </span>
                <span className="text-xs text-slate-400">
                  When viewers submit event tips, they will appear here.
                </span>
              </div>
            ) : (
              <div className="space-y-3.5">
                {fanMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      msg.isRead
                        ? 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                        : 'bg-purple-50/70 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-extrabold text-[#1A3668] dark:text-white">
                          {msg.eventTitle}
                        </span>
                        {!msg.isRead && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500 text-white">
                            New
                          </span>
                        )}
                        {msg.eventDate && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 border border-slate-200 dark:border-slate-600">
                            🗓️ {msg.eventDate}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(msg.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mb-3 whitespace-pre-line">
                      "{msg.message}"
                    </p>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex-wrap gap-2">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        From: <span className="font-bold text-[#1A3668] dark:text-white">{msg.senderName}</span>
                        {msg.sourceUrl && (
                          <a
                            href={msg.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-purple-600 dark:text-purple-400 underline inline-flex items-center gap-1"
                          >
                            <span>Link</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handlePrefillEventFromMessage(msg)}
                          style={{ backgroundColor: currentAccent.colorHex }}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold text-white shadow-2xs hover:opacity-90 cursor-pointer"
                          title="Pre-fill Add Event Form"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>+ Add to Calendar</span>
                        </button>
                        <button
                          onClick={() => handleMarkMessageRead(msg.id)}
                          className="px-2.5 py-1 rounded-full text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 cursor-pointer"
                        >
                          {msg.isRead ? 'Mark Unread' : 'Mark Read'}
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                          title="Delete message"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 6: BANNER PHOTOS & SIZING MANAGER (ADMIN & OWNER)         */}
      {/* ============================================================== */}
      {bannerPhotosModalOpen && canEditEvents && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1A3668] dark:text-white">
                    Banner Slot & Photo Collection
                  </h3>
                  <p className="text-xs font-semibold text-[#607494] dark:text-slate-400">
                    Adjust photo sizing, fit, and rotate multiple banner photos
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBannerPhotosModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Photo Fit Control (Cover vs Contain) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-bold text-[#1A3668] dark:text-white">
                  <Maximize2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Photo Fit Style</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateBannerFit('cover')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer flex flex-col items-center gap-0.5 ${
                      settings.bannerFit !== 'contain'
                        ? 'bg-[#1A3668] dark:bg-purple-600 text-white border-[#1A3668] dark:border-purple-600 shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-[#526586] dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>Fill Area (Cover)</span>
                    <span className="text-[10px] opacity-80 font-normal">Crops to fill slot completely</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateBannerFit('contain')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer flex flex-col items-center gap-0.5 ${
                      settings.bannerFit === 'contain'
                        ? 'bg-[#1A3668] dark:bg-purple-600 text-white border-[#1A3668] dark:border-purple-600 shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-[#526586] dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>Fit Entire Photo (Contain)</span>
                    <span className="text-[10px] opacity-80 font-normal">Shows 100% without cropping</span>
                  </button>
                </div>
              </div>

              {/* Slot Height Sizing Control */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-bold text-[#1A3668] dark:text-white">
                  <Layers className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Banner Slot Height</span>
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['compact', 'medium', 'tall', 'auto'] as const).map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => handleUpdateBannerHeight(h)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold capitalize transition-all border cursor-pointer ${
                        (settings.bannerHeight || 'medium') === h
                          ? 'bg-[#1A3668] dark:bg-purple-600 text-white border-[#1A3668] dark:border-purple-600 shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-[#526586] dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add New Photo */}
              <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Add Photo to Banner Collection</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => bannerFileInputRef.current?.click()}
                    className="text-[11px] font-bold text-purple-700 dark:text-purple-300 underline cursor-pointer"
                  >
                    Upload from device
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newBannerUrlInput}
                    onChange={(e) => setNewBannerUrlInput(e.target.value)}
                    placeholder="Paste image URL (https://...)"
                    className="flex-1 rounded-xl border border-purple-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddBannerPhoto(newBannerUrlInput)}
                    disabled={!newBannerUrlInput.trim()}
                    style={{ backgroundColor: currentAccent.colorHex }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-40 cursor-pointer shrink-0 shadow-xs"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Photos Collection Carousel List */}
              <div>
                <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-2">
                  Active Banner Photos ({activeBannerPhotos.length})
                </label>
                {activeBannerPhotos.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                    No custom photos added yet. Upload or paste a URL above to showcase Jimmy & Sea artwork!
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {activeBannerPhotos.map((photo, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={photo}
                            alt={`Banner ${idx + 1}`}
                            className="w-14 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-[#1A3668] dark:text-white block truncate">
                              Photo #{idx + 1}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {photo.startsWith('data:') ? 'Local file uploaded' : photo}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setCurrentBannerIndex(idx)}
                            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 text-[11px] font-bold text-[#1A3668] dark:text-white border border-slate-200 dark:border-slate-600 hover:bg-purple-50 cursor-pointer"
                          >
                            Preview
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveBannerPhoto(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                            title="Remove photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setBannerPhotosModalOpen(false)}
                style={{ backgroundColor: currentAccent.colorHex }}
                className="px-5 py-2 rounded-full text-xs font-bold text-white shadow-xs cursor-pointer hover:opacity-90"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
