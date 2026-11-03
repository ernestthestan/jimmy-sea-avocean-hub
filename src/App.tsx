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
  AlignLeft,
  AlignCenter,
  AlignRight,
  HeartHandshake,
  Tv,
  Lock,
  Unlock,
  Copy,
  Hash,
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
  Minimize2,
  Expand,
  FileText,
  BookOpen,
  Activity,
  Users,
  Languages,
  Loader2,
  Ticket,
  ClipboardList,
  Truck,
  Film,
  RefreshCw,
  Heart
} from 'lucide-react';
import {
  testFirestoreConnection,
  startDailyVisitsTracking,
  subscribeToEvents,
  saveEventToFirestore,
  deleteEventFromFirestore,
  subscribeToSettings,
  saveSettingsToFirestore,
  subscribeToFanMessages,
  fetchFanMessagesFromFirestore,
  sendFanMessageToFirestore,
  updateFanMessageInFirestore,
  deleteFanMessageFromFirestore,
  subscribeToFanClubs,
  saveFanClubToFirestore,
  deleteFanClubFromFirestore,
  subscribeToFoodProjects,
  saveFoodProjectToFirestore,
  deleteFoodProjectFromFirestore,
  subscribeToCareerProjects,
  saveCareerProjectToFirestore,
  deleteCareerProjectFromFirestore,
  onQuotaExceededChange,
  ensureDefaultAdminAccounts,
  authenticateUserAccount,
  registerAdminAccount,
  deleteAdminAccount,
  subscribeToAdminAccounts,
  updateAdminAccountPassword,
  recordAuditLog,
  subscribeToAuditHistory,
  getBangkokDateKey,
  type LiveStats,
  type AdminAccount,
  type AuditLogEntry
} from './lib/firestoreSync';
import {
  TRANSLATION_LANGUAGES,
  type TranslationLanguage,
  translateText
} from './lib/translateService';
import { compressImageFile, compressDataUrl } from './lib/imageCompression';
import { FanHub } from './components/FanHub';
import type { FanClub, FoodSupportProject } from './types/fanhub';
import { INITIAL_FAN_CLUBS, INITIAL_FOOD_SUPPORT_PROJECTS } from './data/initialFanHubData';
import { ProjectsHub } from './components/ProjectsHub';
import type { CareerProject } from './types/projects';
import { INITIAL_CAREER_PROJECTS } from './data/initialProjects';

// --- Type Definitions ---
export type UserRole = 'visitor' | 'admin' | 'owner';
export type AccentChoice = 'purple' | 'blue' | 'green';

export type FanMessageCategory = 'calendar' | 'project' | 'fanclub' | 'foodsupport' | 'thanks';

export interface FanMessage {
  id: string;
  senderName: string;
  eventTitle: string; // Used as main title for all types (Event, Project, Fan Club, Food Campaign, or Thank You Note)
  eventDate?: string;
  sourceUrl?: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  category?: FanMessageCategory;
  // Wanna say thanks fields
  thanksTo?: string; // e.g. 'Jimmy & Sea', 'Jimmy', 'Sea', 'Admins & Website Team', 'Everyone'
  // Career Project fields
  projectCategory?: string; // Series, Movie, Music Video, Brand Endorsement, Owned Brand, Other
  projectArtist?: string; // Jimmy & Sea, Jimmy, Sea, Avocean
  projectYear?: string;
  characterNames?: string; // e.g. "Jimmy as Pongpeun, Sea as Pepper"
  // Fan Club Directory fields
  fanClubCountry?: string;
  fanClubCity?: string;
  // Food Support fields
  foodSupportTarget?: string;
  foodSupportOrganizer?: string;
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
  isAllDay?: boolean; // All-day event flag
  time?: string;
  endTime?: string; // Optional end time HH:mm
  timezone?: string;
  location?: string;
  locationUrl?: string; // Google Maps link
  posterUrl?: string; // Image URL or Base64 data URL (primary cover)
  posterUrls?: string[]; // Multiple photos/posters (e.g. seating map, perks chart, teaser posters)
  members: string[]; // member ids
  category?: string;
  link?: string;
  description?: string;
  hashtags?: string;
  watchPlatforms?: WatchPlatform[];
  notes?: string;
  // Registration Period Fields
  hasRegistration?: boolean;
  registrationStartDate?: string; // YYYY-MM-DD
  registrationStartTime?: string; // e.g. 10:00 AM or 10:00
  registrationEndDate?: string; // YYYY-MM-DD
  registrationEndTime?: string; // e.g. 6:00 PM or 18:00
  registrationTimezone?: string; // e.g. BKK
  registrationUrl?: string; // Link to registration form or ticket platform
  registrationNotes?: string; // Guidelines or instructions
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
export type HeaderAlignmentChoice = 'left' | 'center' | 'right';
export type ContainerWidthChoice = 'auto' | 'compact' | 'wide' | 'ultra' | 'full';

export interface AppSettings {
  greeting: string;
  greetingSize?: SubtitleSizeChoice;
  bannerTitle: string;
  bannerTitleSize?: TitleSizeChoice;
  bannerSubtitle: string;
  bannerSubtitleSize?: SubtitleSizeChoice;
  headerAlignment?: HeaderAlignmentChoice;
  containerWidth?: ContainerWidthChoice; // Responsive auto-adjust or customizable screen width
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
  { name: 'TikTok', platform: 'TikTok Live', icon: 'tv', defaultUrl: 'https://tiktok.com/@gmmtvofficial' },
  { name: 'X / Twitter', platform: 'Space / Live', icon: 'tv', defaultUrl: 'https://x.com/gmmtvofficial' }
];

export interface DetectedPlatformInfo {
  name: string;
  platform: string;
  categoryTag?: string;
}

// Automatically detect website/platform name and channel from any URL
export function detectPlatformFromUrl(url: string): DetectedPlatformInfo {
  const trimmed = (url || '').trim().toLowerCase();
  if (!trimmed) {
    return { name: 'GMMTV', platform: 'YouTube' };
  }

  // 1. YouTube
  if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
    if (trimmed.includes('gmmtv')) {
      return { name: 'GMMTV', platform: 'YouTube', categoryTag: 'YouTube' };
    }
    return { name: 'YouTube Stream', platform: 'YouTube', categoryTag: 'YouTube' };
  }

  // 2. Facebook
  if (trimmed.includes('facebook.com') || trimmed.includes('fb.watch') || trimmed.includes('fb.com')) {
    if (trimmed.includes('gmmtv')) {
      return { name: 'GMMTV', platform: 'Facebook', categoryTag: 'Facebook' };
    }
    return { name: 'Facebook Live', platform: 'Facebook', categoryTag: 'Facebook' };
  }

  // 3. X (Twitter)
  if (trimmed.includes('x.com') || trimmed.includes('twitter.com')) {
    if (trimmed.includes('/i/spaces/') || trimmed.includes('/broadcasts/') || trimmed.includes('/space/')) {
      return { name: 'X / Twitter Space', platform: 'Space / Live', categoryTag: 'X Space' };
    }
    if (trimmed.includes('gmmtv')) {
      return { name: 'GMMTV Official', platform: 'X / Twitter', categoryTag: 'X' };
    }
    return { name: 'X / Twitter', platform: 'X / Twitter', categoryTag: 'X' };
  }

  // 4. TrueID
  if (trimmed.includes('trueid.net')) {
    return { name: 'TrueID', platform: 'TrueID', categoryTag: 'TrueID' };
  }

  // 5. WeTV
  if (trimmed.includes('wetv.vip') || trimmed.includes('wetv.com')) {
    return { name: 'WeTV Thailand', platform: 'WeTV Thailand', categoryTag: 'WeTV' };
  }

  // 6. iQIYI
  if (trimmed.includes('iq.com') || trimmed.includes('iqiyi.com')) {
    return { name: 'iQIYI', platform: 'iQIYI', categoryTag: 'iQIYI' };
  }

  // 6b. Viki (Rakuten Viki)
  if (trimmed.includes('viki.com')) {
    return { name: 'Viki', platform: 'Viki', categoryTag: 'Viki' };
  }

  // 6c. Viu
  if (trimmed.includes('viu.com')) {
    return { name: 'Viu', platform: 'Viu', categoryTag: 'Viu' };
  }

  // 6d. GagaOOLala
  if (trimmed.includes('gagaoolala.com')) {
    return { name: 'GagaOOLala', platform: 'GagaOOLala', categoryTag: 'GagaOOLala' };
  }

  // 7. AIS PLAY
  if (trimmed.includes('aisplay.ais.co.th') || trimmed.includes('ais.th')) {
    return { name: 'AIS PLAY', platform: 'AIS PLAY', categoryTag: 'AIS PLAY' };
  }

  // 8. Netflix
  if (trimmed.includes('netflix.com')) {
    return { name: 'Netflix', platform: 'Netflix', categoryTag: 'Netflix' };
  }

  // 9. TikTok
  if (trimmed.includes('tiktok.com')) {
    if (trimmed.includes('/live')) {
      return { name: 'TikTok Live', platform: 'TikTok Live', categoryTag: 'TikTok' };
    }
    return { name: 'TikTok', platform: 'TikTok', categoryTag: 'TikTok' };
  }

  // 10. Instagram
  if (trimmed.includes('instagram.com')) {
    if (trimmed.includes('/live')) {
      return { name: 'Instagram Live', platform: 'Instagram Live', categoryTag: 'Instagram' };
    }
    return { name: 'Instagram', platform: 'Instagram', categoryTag: 'Instagram' };
  }

  // 11. Twitch
  if (trimmed.includes('twitch.tv')) {
    return { name: 'Twitch', platform: 'Twitch Stream', categoryTag: 'Twitch' };
  }

  // 12. Bilibili
  if (trimmed.includes('bilibili.com') || trimmed.includes('bilibili.tv')) {
    return { name: 'Bilibili', platform: 'Bilibili', categoryTag: 'Bilibili' };
  }

  // 13. oneD / One31
  if (trimmed.includes('oned.net') || trimmed.includes('one31.net')) {
    return { name: 'oneD', platform: 'oneD Live', categoryTag: 'oneD' };
  }

  // 14. Bugaboo.tv / Ch7HD
  if (trimmed.includes('bugaboo.tv')) {
    return { name: 'Bugaboo.tv', platform: 'Ch7HD', categoryTag: 'Bugaboo' };
  }

  // 15. Ticket / Event Platforms
  if (trimmed.includes('eventpop.me')) {
    return { name: 'Eventpop', platform: 'Online Event', categoryTag: 'Eventpop' };
  }
  if (trimmed.includes('ticketmelon.com')) {
    return { name: 'Ticketmelon', platform: 'Live Stream', categoryTag: 'Ticketmelon' };
  }
  if (trimmed.includes('thaiticketmajor.com')) {
    return { name: 'ThaiTicketMajor', platform: 'TTM Live', categoryTag: 'ThaiTicketMajor' };
  }

  // 16. Smart Domain Name Fallback
  try {
    const raw = trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`;
    const urlObj = new URL(raw);
    const host = urlObj.hostname.replace(/^(www|m|live|stream|web)\./, '');
    const mainName = host.split('.')[0] || 'Live';
    const formatted = mainName.charAt(0).toUpperCase() + mainName.slice(1);
    return { name: formatted, platform: formatted, categoryTag: formatted };
  } catch {
    return { name: 'Live Stream', platform: 'Online' };
  }
}

export interface PopularHashtagItem {
  tag: string;
  category: 'jimmy' | 'sea' | 'avocean' | 'general';
  desc: string;
}

// Quick add hashtags for usually used ones requested by user
export const POPULAR_HASHTAGS: PopularHashtagItem[] = [
  // User requested Jimmy individual hashtags
  { tag: '#jimmyyjp', category: 'jimmy', desc: 'Jimmy Jitaraphol (Official X/IG)' },
  { tag: '#Tiny', category: 'jimmy', desc: 'Jimmy Fandom' },
  // User requested Sea individual hashtags
  { tag: '#sea_tawinan', category: 'sea', desc: 'Sea Tawinan (Official X/IG)' },
  { tag: '#ChaoTalay', category: 'sea', desc: 'Sea Fandom (English)' },
  { tag: '#ชาวทะเล', category: 'sea', desc: 'Sea Fandom (Thai)' },
  // User requested Avocean fandom & JimmySea couple hashtags
  { tag: '#AVOCEAN', category: 'avocean', desc: 'JimmySea Official Fandom' },
  { tag: '#JimmySea', category: 'avocean', desc: 'Jimmy & Sea Duo' },
  { tag: '#จิมมี่ซี', category: 'avocean', desc: 'JimmySea (Thai)' },
  { tag: '#GMMTV', category: 'general', desc: 'GMMTV Official Agency' }
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
  greetingSize: 'small',
  bannerTitle: 'JIMMY SEA AVOCEAN HUB',
  bannerTitleSize: 'medium',
  bannerSubtitle: 'Official Fan Schedule, Appearances & Trending Projects 🥑🌊💚',
  bannerSubtitleSize: 'medium',
  headerAlignment: 'left',
  containerWidth: 'auto',
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
    endTime: '20:00',
    timezone: 'BKK',
    location: 'UNION HALL, UNION MALL',
    locationUrl: 'https://maps.google.com/?q=Union+Hall+Union+Mall+Bangkok',
    members: ['jimmy', 'sea', 'avocean'],
    category: 'Event',
    link: 'https://x.com/gmmtvofficial',
    description: 'งานแถลงข่าวเปิดตัวซีรีส์และโปรเจกต์ใหม่ประจำปีของ GMMTV พร้อมการปรากฏตัวของทัพนักแสดงและกิจกรรมสุดพิเศษกับแฟนคลับ\nAnnual GMMTV press conference & showcase featuring lineup reveals, live artist appearances, and exclusive fan interactions.',
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
    endTime: '20:30',
    timezone: 'BKK',
    location: 'Siam Paragon, Bangkok',
    locationUrl: 'https://maps.google.com/?q=Siam+Paragon+Bangkok',
    members: ['jimmy', 'sea', 'avocean'],
    category: 'Event',
    posterUrl: '/assets/aistudio/Screenshot_2026-10-29_160833_2a5e0be1.png',
    link: 'https://x.com',
    description: 'งานเปิดตัวพรีเซนเตอร์แบรนด์อย่างเป็นทางการ พร้อมมุมถ่ายภาพสุดพิเศษและการตอบคำถามแฟนคลับทั่วโลกสดจากพารากอนฮอลล์',
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
    description: 'คุณหมอจิมมี่ร่วมแบ่งปันสาระความรู้ด้านสุขภาพและการดูแลตนเอง พร้อมแจกลายเซ็นสมุดบันทึกรุ่นลิมิเต็ดเอดิชัน ณ บริเวณชั้น 1 ศูนย์การค้าเซ็นทรัลเวิลด์',
    hashtags: '#DoctorJimmy #JimmyJitaraphol'
  },
  {
    id: 'sample-3',
    title: 'Sea BadmintonDay Charity Match',
    date: '2026-10-26',
    time: '16:30',
    timezone: 'BKK',
    location: 'GMMTV Live Studio',
    locationUrl: '',
    members: ['sea'],
    category: 'Broadcast',
    link: 'https://youtube.com',
    description: 'แมตช์การแข่งขันแบดมินตันนัดพิเศษโดย ซี ทวินันท์ เพื่อระดมทุนสนับสนุนอุปกรณ์กีฬาให้กับเยาวชนที่ขาดแคลน',
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
    description: 'กิจกรรมปาร์ตี้ฮาโลวีนออนไลน์รวมพลชาว Avocean ทั่วทุกมุมโลก พูดคุยใน X Space เปิดตัวลุคคอสตูมสุดเซอร์ไพรส์ และร่วมกิจกรรมแจกของที่ระลึก',
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

// Extract all posters/photos for an event, backwards-compatible with legacy single posterUrl
export const getEventPosters = (ev: ScheduleEvent): string[] => {
  if (ev.posterUrls && ev.posterUrls.length > 0) {
    const valid = ev.posterUrls.filter(Boolean);
    if (valid.length > 0) return valid;
  }
  if (ev.posterUrl) {
    return [ev.posterUrl];
  }
  return [];
};

// Helper to compute a simple, fast text checksum for verifying cache freshness
export const computeTextChecksum = (text?: string | null): string => {
  if (!text) return '0_0';
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return `${text.length}_${hash}`;
};

// Helper to render event description with auto-linked clickable URLs
export const renderDescriptionTextWithLinks = (text?: string | null) => {
  if (!text) return null;
  // Match URLs starting with http:// or https://, as well as bare domains like bit.ly/... or register.gmm-tv.com/...
  const urlRegex = /(https?:\/\/[^\s<>"'{}|\\^`]+|(?:www\.|bit\.ly\/|register\.[a-z0-9.-]+)[^\s<>"'{}|\\^`]*)/gi;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      // Clean up any trailing punctuation like . , ) > ] ;
      const cleanUrl = part.replace(/[.,)>\];]+$/, '');
      const trailingPunctuation = part.slice(cleanUrl.length);
      const targetHref = cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')
        ? cleanUrl
        : `https://${cleanUrl}`;

      return (
        <React.Fragment key={index}>
          <a
            href={targetHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-bold underline underline-offset-2 break-all"
            onClick={(e) => e.stopPropagation()}
          >
            <span>{cleanUrl}</span>
            <ExternalLink className="w-3 h-3 inline shrink-0 ml-0.5" />
          </a>
          {trailingPunctuation}
        </React.Fragment>
      );
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
};

export interface RegistrationStatusInfo {
  hasReg: boolean;
  status: 'open' | 'upcoming' | 'closed' | 'none';
  statusLabel: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

// Compute registration status based on event registration window and today's date
export const getRegistrationStatusInfo = (ev: ScheduleEvent, todayStr: string): RegistrationStatusInfo => {
  if (!ev.hasRegistration && !ev.registrationStartDate && !ev.registrationEndDate) {
    return {
      hasReg: false,
      status: 'none',
      statusLabel: '',
      badgeBg: '',
      badgeText: '',
      badgeBorder: ''
    };
  }

  const startDate = ev.registrationStartDate || '';
  const endDate = ev.registrationEndDate || startDate;

  if (startDate && todayStr < startDate) {
    return {
      hasReg: true,
      status: 'upcoming',
      statusLabel: 'Registration Upcoming',
      badgeBg: 'bg-amber-100 dark:bg-amber-950/80',
      badgeText: 'text-amber-800 dark:text-amber-300',
      badgeBorder: 'border-amber-300 dark:border-amber-700'
    };
  }

  if (endDate && todayStr > endDate) {
    return {
      hasReg: true,
      status: 'closed',
      statusLabel: 'Registration Concluded',
      badgeBg: 'bg-slate-100 dark:bg-slate-800',
      badgeText: 'text-slate-600 dark:text-slate-400',
      badgeBorder: 'border-slate-200 dark:border-slate-700'
    };
  }

  return {
    hasReg: true,
    status: 'open',
    statusLabel: 'Registration OPEN',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950/80',
    badgeText: 'text-emerald-800 dark:text-emerald-300',
    badgeBorder: 'border-emerald-300 dark:border-emerald-700'
  };
};

// Format readable registration period label e.g. "1 Nov, 10:00 AM – 5 Nov, 6:00 PM BKK"
export const formatRegistrationSchedule = (ev: ScheduleEvent, is12h: boolean): string => {
  const startD = ev.registrationStartDate;
  const endD = ev.registrationEndDate;
  const startT = ev.registrationStartTime ? (is12h ? formatTime12h(ev.registrationStartTime) : ev.registrationStartTime) : '';
  const endT = ev.registrationEndTime ? (is12h ? formatTime12h(ev.registrationEndTime) : ev.registrationEndTime) : '';
  const tz = ev.registrationTimezone || ev.timezone || 'BKK';

  if (!startD && !endD) return '';

  const formatSingleDate = (dStr: string) => {
    const dt = parseDateKey(dStr);
    return `${dt.getDate()} ${SHORT_MONTHS[dt.getMonth()]}`;
  };

  if (startD && endD && startD !== endD) {
    const sLabel = `${formatSingleDate(startD)}${startT ? ` ${startT}` : ''}`;
    const eLabel = `${formatSingleDate(endD)}${endT ? ` ${endT}` : ''}`;
    return `${sLabel} – ${eLabel} (${tz})`;
  }

  const dateLabel = formatSingleDate(startD || endD || '');
  if (startT && endT) {
    return `${dateLabel}, ${startT} – ${endT} (${tz})`;
  }
  if (startT) {
    return `${dateLabel} at ${startT} (${tz})`;
  }
  return `${dateLabel} (${tz})`;
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
  // 1. Matches "6:00 PM", "18:00", "06:30 am", etc.
  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?/i);
  if (match12) {
    let h = parseInt(match12[1], 10);
    const m = parseInt(match12[2], 10);
    const mer = match12[3]?.toUpperCase();
    if (mer === 'PM' && h < 12) h += 12;
    if (mer === 'AM' && h === 12) h = 0;
    return [isNaN(h) ? 18 : h, isNaN(m) ? 0 : m];
  }
  // 2. Matches hour only with AM/PM e.g. "6 PM", "6PM", "11am"
  const matchHourOnlyAmPm = trimmed.match(/^(\d{1,2})\s*(AM|PM)/i);
  if (matchHourOnlyAmPm) {
    let h = parseInt(matchHourOnlyAmPm[1], 10);
    const mer = matchHourOnlyAmPm[2].toUpperCase();
    if (mer === 'PM' && h < 12) h += 12;
    if (mer === 'AM' && h === 12) h = 0;
    return [isNaN(h) ? 18 : h, 0];
  }
  // 3. Simple colon e.g. "18:00"
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

// Calculate duration string e.g. "2 hrs duration" or "1h 30m duration"
const getEventTimeDurationLabel = (startTime?: string, endTime?: string): string | null => {
  if (!startTime || !endTime) return null;
  const [sh, sm] = parseHourAndMinute(startTime);
  const [eh, em] = parseHourAndMinute(endTime);
  let diffMin = (eh * 60 + em) - (sh * 60 + sm);
  if (diffMin <= 0) {
    diffMin += 24 * 60; // Overnight
  }
  const hours = Math.floor(diffMin / 60);
  const mins = diffMin % 60;
  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}m duration`;
  }
  if (hours > 0) {
    return `${hours} hr${hours > 1 ? 's' : ''} duration`;
  }
  return `${mins} mins duration`;
};

// Format event time and timezone in 12-hour format (e.g. "6:00 PM – 8:00 PM BKK" or "6:00 PM BKK")
const formatEventTime = (ev: ScheduleEvent, prefer12h: boolean = true) => {
  if (ev.isAllDay || ev.time?.toLowerCase() === 'all day') {
    return 'All Day';
  }
  if (!ev.time && !ev.endTime) return null;
  const startFmt = ev.time ? (prefer12h ? formatTime12h(ev.time) : ev.time) : '';
  const endFmt = ev.endTime ? (prefer12h ? formatTime12h(ev.endTime) : ev.endTime) : '';
  let timeRange = '';
  if (startFmt && endFmt) {
    timeRange = `${startFmt} – ${endFmt}`;
  } else {
    timeRange = startFmt || endFmt;
  }
  const tz = ev.timezone ? (ev.timezone === 'CST_US' ? 'CST' : ev.timezone) : '';
  if (tz) {
    if (timeRange.toLowerCase().includes(tz.toLowerCase())) {
      return timeRange;
    }
    return `${timeRange} ${tz}`;
  }
  return timeRange;
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
  
  let endDate: Date;
  if (ev.endTime) {
    const [endH, endM] = parseHourAndMinute(ev.endTime);
    endDate = new Date(Date.UTC(endYear, endMonth - 1, endDay, endH - fromOffset, endM || 0));
    if (endDate <= startDate) {
      endDate = new Date(endDate.getTime() + 24 * 3600 * 1000);
    }
  } else {
    const endDurationHours = ev.endDate && ev.endDate > ev.date ? 4 : 2;
    endDate = new Date(Date.UTC(endYear, endMonth - 1, endDay, h - fromOffset + endDurationHours, m || 0));
  }

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
  
  let endDate: Date;
  if (ev.endTime) {
    const [endH, endM] = parseHourAndMinute(ev.endTime);
    endDate = new Date(Date.UTC(endYear, endMonth - 1, endDay, endH - fromOffset, endM || 0));
    if (endDate <= startDate) {
      endDate = new Date(endDate.getTime() + 24 * 3600 * 1000);
    }
  } else {
    const endDurationHours = ev.endDate && ev.endDate > ev.date ? 4 : 2;
    endDate = new Date(Date.UTC(endYear, endMonth - 1, endDay, h - fromOffset + endDurationHours, m || 0));
  }

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
  // --- Dark Mode State --- (Defaults to light mode to match user preference and prevent dark screens on new devices)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_DARK_MODE_KEY);
      if (saved !== null) return saved === 'true';
      return false; // Default to luminous pastel light mode
    } catch {
      return false;
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

  // Purge legacy content caches from localStorage: everything is strictly cloud-driven from Firestore
  useEffect(() => {
    try {
      const CONTENT_KEYS_TO_CLEAR = [
        'avocean_career_projects_v1',
        'avocean_projects_initialized',
        'avocean_schedule_events_v2',
        'avocean_schedule_events_v1',
        STORAGE_EVENTS_KEY,
        'avocean_app_settings_v3',
        'avocean_app_settings_v2',
        STORAGE_SETTINGS_KEY,
        'avocean_fan_clubs_v3',
        'avocean_fanhub_initialized',
        'avocean_food_projects_v3',
        'avocean_actor_profiles_v1',
        'avocean_fan_messages_v1',
        'avocean_inbox_initialized',
        'avocean_audit_logs_v1'
      ];
      CONTENT_KEYS_TO_CLEAR.forEach((k) => localStorage.removeItem(k));
    } catch {}
  }, []);

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

  // Current Logged-in User Account State (Email & Password Auth)
  const [currentAccount, setCurrentAccount] = useState<AdminAccount | null>(() => {
    try {
      const saved = localStorage.getItem('avocean_current_account');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const currentUserEmail = currentAccount?.email || (userRole === 'owner' ? 'Owner' : userRole === 'admin' ? 'Admin' : 'visitor');

  // Login & Admin Registration Modal State
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);
  const [loginMode, setLoginMode] = useState<'signin' | 'register'>('signin');
  const [loginRoleTab, setLoginRoleTab] = useState<'admin' | 'owner'>('owner');
  const [loginEmailInput, setLoginEmailInput] = useState<string>('');
  const [loginPasswordInput, setLoginPasswordInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [loginLoading, setLoginLoading] = useState<boolean>(false);
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);

  // Admin Account Creation (Register with own email and passcodes)
  const [regEmailInput, setRegEmailInput] = useState<string>('');
  const [regDisplayNameInput, setRegDisplayNameInput] = useState<string>('');
  const [regPasswordInput, setRegPasswordInput] = useState<string>('');
  const [regConfirmPasswordInput, setRegConfirmPasswordInput] = useState<string>('');
  const [regAdminPasscodeInput, setRegAdminPasscodeInput] = useState<string>('Avocean2026');
  const [regError, setRegError] = useState<string>('');
  const [regLoading, setRegLoading] = useState<boolean>(false);
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);

  // Registered Admin Accounts List (Real-time Firestore sync)
  const [registeredAdmins, setRegisteredAdmins] = useState<AdminAccount[]>([]);
  const [adminAccountsModalOpen, setAdminAccountsModalOpen] = useState<boolean>(false);

  // Change Password Modal State (Admins can change default Avocean2026 to their own; Owner can change ErnestTheStan05!)
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState<boolean>(false);
  const [changePassEmail, setChangePassEmail] = useState<string>('');
  const [currentPasswordInput, setCurrentPasswordInput] = useState<string>('');
  const [newPasswordInput, setNewPasswordInput] = useState<string>('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [showPasswordField, setShowPasswordField] = useState<boolean>(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState<boolean>(false);

  // Log In & Activity Audit History Modal State
  const [auditModalOpen, setAuditModalOpen] = useState<boolean>(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditFilterTab, setAuditFilterTab] = useState<'all' | 'logins' | 'events' | 'fanhub' | 'settings'>('all');
  const [auditSearchQuery, setAuditSearchQuery] = useState<string>('');

  // Visitor's Detected Local Timezone (e.g. "Asia/Bangkok", "America/New_York", "Europe/London")
  const userLocalTimezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local';
    } catch {
      return 'Local';
    }
  }, []);

  // Real-time Today's date string (YYYY-MM-DD) based strictly on visitor's local timezone
  const [todayDateStr, setTodayDateStr] = useState<string>(() => {
    const now = new Date();
    return toDateKey(now.getFullYear(), now.getMonth(), now.getDate());
  });

  // Calendar State: Defaults dynamically to current month & today in user's timezone
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const now = new Date();
    return toDateKey(now.getFullYear(), now.getMonth(), now.getDate());
  });
  const [showWeekOnly, setShowWeekOnly] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'calendar' | 'list' | 'projects' | 'fanhub'>('calendar');
  const [fanHubSubTab, setFanHubSubTab] = useState<'directory' | 'foodsupport'>('directory');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [listViewFilter, setListViewFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [selectedDayActiveEventId, setSelectedDayActiveEventId] = useState<string | null>(null);

  // --- Fan Clubs Directory & Food Support State (Pure Cloud Firestore) ---
  const [fanClubs, setFanClubs] = useState<FanClub[]>([]);
  const [foodProjects, setFoodProjects] = useState<FoodSupportProject[]>([]);

  const handleSaveFanClub = (club: FanClub) => {
    setFanClubs((prev) => {
      const exists = prev.some((c) => c.id === club.id);
      return exists ? prev.map((c) => (c.id === club.id ? club : c)) : [club, ...prev];
    });
    saveFanClubToFirestore(club);
    recordAuditLog({
      userEmail: currentUserEmail,
      role: userRole === 'owner' ? 'owner' : 'admin',
      actionType: 'edit_fan_club',
      details: `Saved fan club "${club.name}" (${club.countryName || 'Global'})`
    }).catch(() => {});
    showToast(`Fan club "${club.name}" saved!`);
  };

  const handleDeleteFanClub = (clubId: string) => {
    const targetClub = fanClubs.find((c) => c.id === clubId);
    setFanClubs((prev) => prev.filter((c) => c.id !== clubId));
    deleteFanClubFromFirestore(clubId);
    recordAuditLog({
      userEmail: currentUserEmail,
      role: userRole === 'owner' ? 'owner' : 'admin',
      actionType: 'delete_fan_club',
      details: `Deleted fan club "${targetClub ? targetClub.name : clubId}"`
    }).catch(() => {});
    showToast('Fan club removed from directory.');
  };

  const handleSaveFoodProject = (project: FoodSupportProject) => {
    setFoodProjects((prev) => {
      const exists = prev.some((p) => p.id === project.id);
      return exists ? prev.map((p) => (p.id === project.id ? project : p)) : [project, ...prev];
    });
    saveFoodProjectToFirestore(project);
    recordAuditLog({
      userEmail: currentUserEmail,
      role: userRole === 'owner' ? 'owner' : 'admin',
      actionType: 'edit_food_project',
      details: `Saved food project "${project.title}" (Progress: ${project.currentAmount.toLocaleString()} / ${project.targetAmount.toLocaleString()} ${project.currency})`
    }).catch(() => {});
    showToast(`Food support project "${project.title}" saved!`);
  };

  const handleDeleteFoodProject = (projectId: string) => {
    const targetProj = foodProjects.find((p) => p.id === projectId);
    setFoodProjects((prev) => prev.filter((p) => p.id !== projectId));
    deleteFoodProjectFromFirestore(projectId);
    recordAuditLog({
      userEmail: currentUserEmail,
      role: userRole === 'owner' ? 'owner' : 'admin',
      actionType: 'delete_food_project',
      details: `Deleted food project "${targetProj ? targetProj.title : projectId}"`
    }).catch(() => {});
    showToast('Food support project removed.');
  };

  // --- Jimmy & Sea Career Projects State (Pure Cloud Firestore) ---
  const [careerProjects, setCareerProjects] = useState<CareerProject[]>([]);

  const handleSaveCareerProject = (project: CareerProject) => {
    setCareerProjects((prev) => {
      const exists = prev.some((p) => p.id === project.id);
      return exists ? prev.map((p) => (p.id === project.id ? project : p)) : [project, ...prev];
    });
    saveCareerProjectToFirestore(project);
    recordAuditLog({
      userEmail: currentUserEmail,
      role: userRole === 'owner' ? 'owner' : 'admin',
      actionType: 'edit_career_project',
      details: `Saved career project "${project.title}" (${project.category})`
    }).catch(() => {});
    showToast(`Project "${project.title}" saved!`);
  };

  const handleDeleteCareerProject = (projectId: string) => {
    const targetProj = careerProjects.find((p) => p.id === projectId);
    setCareerProjects((prev) => prev.filter((p) => p.id !== projectId));
    deleteCareerProjectFromFirestore(projectId);
    recordAuditLog({
      userEmail: currentUserEmail,
      role: userRole === 'owner' ? 'owner' : 'admin',
      actionType: 'delete_career_project',
      details: `Deleted career project "${targetProj ? targetProj.title : projectId}"`
    }).catch(() => {});
    showToast('Project removed.');
  };


  // Automatically update today's date string when midnight passes in user's timezone
  useEffect(() => {
    const updateTodayIfRolledOver = () => {
      const now = new Date();
      const current = toDateKey(now.getFullYear(), now.getMonth(), now.getDate());
      setTodayDateStr((prev) => (prev !== current ? current : prev));
    };
    const interval = setInterval(updateTodayIfRolledOver, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  // Settings & Events State (Pure Cloud Firestore - Live Real-Time)
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  const is12Hour = (settings.timeFormat || '12h') === '12h';

  const [events, setEvents] = useState<ScheduleEvent[]>([]);

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
  const [copiedIndividualTag, setCopiedIndividualTag] = useState<string | null>(null);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState<boolean>(false);
  const [showQuotaBanner, setShowQuotaBanner] = useState<boolean>(true);

  useEffect(() => {
    const unsub = onQuotaExceededChange((exceeded) => {
      setIsQuotaExceeded(exceeded);
    });
    return () => unsub();
  }, []);

  // --- Translation State for Native Event Descriptions ---
  const [preferredTranslationLang, setPreferredTranslationLang] = useState<string>(() => {
    try {
      return localStorage.getItem('avocean_preferred_trans_lang') || 'en';
    } catch {
      return 'en';
    }
  });

  const [translationsCache, setTranslationsCache] = useState<Record<string, Record<string, string>>>(() => {
    try {
      const saved = localStorage.getItem('avocean_translations_cache');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Filter out any stale error strings like QUERY LENGTH LIMIT EXCEEDED
        const cleaned: Record<string, Record<string, string>> = {};
        for (const [evId, langMap] of Object.entries(parsed)) {
          if (langMap && typeof langMap === 'object') {
            cleaned[evId] = {};
            for (const [lang, val] of Object.entries(langMap as Record<string, string>)) {
              if (
                typeof val === 'string' &&
                !val.includes('QUERY LENGTH LIMIT') &&
                !val.startsWith('MYMEMORY WARNING')
              ) {
                cleaned[evId][lang] = val;
              }
            }
          }
        }
        return cleaned;
      }
      return {};
    } catch {
      return {};
    }
  });

  // Track whether an event card is actively displaying the translated text vs original
  const [activeTranslationViews, setActiveTranslationViews] = useState<Record<string, boolean>>({});
  const [translatingEventId, setTranslatingEventId] = useState<string | null>(null);
  const [copiedTranslationId, setCopiedTranslationId] = useState<string | null>(null);

  // Photo Lightbox Modal State for Enlarging Event Posters and Photos (with multi-photo gallery support)
  const [enlargedPhoto, setEnlargedPhoto] = useState<{
    url: string;
    title?: string;
    photos?: string[];
    currentIndex?: number;
  } | null>(null);

  // Active photo index for events with multiple posters/photos (eventId -> photoIndex)
  const [activePhotoIndexByEvent, setActivePhotoIndexByEvent] = useState<Record<string, number>>({});

  // Viewer & Inbox message modal states
  const [leaveMessageModalOpen, setLeaveMessageModalOpen] = useState<boolean>(false);
  const [inboxModalOpen, setInboxModalOpen] = useState<boolean>(false);

  // Extended Event Description states (Reader modal & card view expand)
  const [descriptionModalEvent, setDescriptionModalEvent] = useState<ScheduleEvent | null>(null);
  const [descriptionModalFontSize, setDescriptionModalFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});
  const [descriptionModalCopied, setDescriptionModalCopied] = useState<boolean>(false);

  // Close modals on Escape key, or navigate photos with Left/Right arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (inboxModalOpen) {
          setInboxModalOpen(false);
          return;
        }
        if (leaveMessageModalOpen) {
          setLeaveMessageModalOpen(false);
          return;
        }
        if (descriptionModalEvent) {
          setDescriptionModalEvent(null);
          return;
        }
        if (enlargedPhoto) {
          setEnlargedPhoto(null);
          return;
        }
      } else if (enlargedPhoto && e.key === 'ArrowRight' && enlargedPhoto.photos && enlargedPhoto.photos.length > 1) {
        const nextIdx = ((enlargedPhoto.currentIndex ?? 0) + 1) % enlargedPhoto.photos.length;
        setEnlargedPhoto({
          ...enlargedPhoto,
          url: enlargedPhoto.photos[nextIdx],
          currentIndex: nextIdx
        });
      } else if (enlargedPhoto && e.key === 'ArrowLeft' && enlargedPhoto.photos && enlargedPhoto.photos.length > 1) {
        const prevIdx = ((enlargedPhoto.currentIndex ?? 0) - 1 + enlargedPhoto.photos.length) % enlargedPhoto.photos.length;
        setEnlargedPhoto({
          ...enlargedPhoto,
          url: enlargedPhoto.photos[prevIdx],
          currentIndex: prevIdx
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enlargedPhoto, descriptionModalEvent, inboxModalOpen, leaveMessageModalOpen]);

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
  // --- Daily Refreshing Visits & Cloud Stats ---
  const [visitorStats, setVisitorStats] = useState<LiveStats>(() => {
    try {
      const raw = localStorage.getItem('avocean_visitor_stats_v2');
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          todayVisits: typeof parsed.todayVisits === 'number' ? parsed.todayVisits : 1,
          totalVisits: typeof parsed.totalVisits === 'number' ? parsed.totalVisits : 28
        };
      }
    } catch {}
    return {
      todayVisits: 1,
      totalVisits: 28
    };
  });

  // Verify connection to Firestore and ensure default accounts on boot
  useEffect(() => {
    testFirestoreConnection();
    ensureDefaultAdminAccounts();
  }, []);

  // Daily Refreshing Visits Sync from Firestore
  useEffect(() => {
    const unsubscribe = startDailyVisitsTracking((stats) => {
      setVisitorStats(stats);
      try {
        localStorage.setItem('avocean_visitor_stats_v3', JSON.stringify(stats));
      } catch {}
    });
    return () => unsubscribe();
  }, []);

  // Real-Time Events Sync from Firestore across all devices
  useEffect(() => {
    const unsubscribe = subscribeToEvents(SAMPLE_EVENTS, (cloudEvents) => {
      setEvents(cloudEvents);
    });
    return () => unsubscribe();
  }, []);

  // Real-Time Audit History Sync from Firestore
  useEffect(() => {
    const unsubscribe = subscribeToAuditHistory((logs) => {
      setAuditLogs(logs);
    });
    return () => unsubscribe();
  }, []);

  // Real-Time Admin Accounts Sync from Firestore
  useEffect(() => {
    const unsub = subscribeToAdminAccounts((accounts) => {
      setRegisteredAdmins(accounts.filter((a) => a.role === 'admin'));
    });
    return () => unsub();
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

  // --- "Leave a message" State (Pure Cloud Firestore) ---
  const [fanMessages, setFanMessages] = useState<FanMessage[]>([]);

  // Real-Time Fan Messages Sync from Firestore across all devices (PC, Laptop, Phone)
  const [isRefreshingInbox, setIsRefreshingInbox] = useState<boolean>(false);
  const [isSendingMessage, setIsSendingMessage] = useState<boolean>(false);
  const isInitialMsgLoadRef = useRef(true);
  const prevMsgCountRef = useRef(0);

  useEffect(() => {
    const unsubscribe = subscribeToFanMessages([], (cloudMsgs) => {
      // Live arrival notification alert for Owner and Admins
      if (!isInitialMsgLoadRef.current && (isOwner || isAdmin)) {
        if (cloudMsgs.length > prevMsgCountRef.current) {
          const newest = cloudMsgs[0];
          if (newest && !newest.isRead) {
            const catLabel =
              newest.category === 'thanks'
                ? '💖 Thank You note'
                : newest.category === 'project'
                ? '🎬 Project suggestion'
                : newest.category === 'fanclub'
                ? '🌍 Fan Club submission'
                : newest.category === 'foodsupport'
                ? '🍱 Food Support proposal'
                : '📅 Event suggestion';
            showToast(`💌 New ${catLabel} from ${newest.senderName}: "${newest.eventTitle}"`);
          }
        }
      }
      isInitialMsgLoadRef.current = false;
      prevMsgCountRef.current = cloudMsgs.length;
      setFanMessages(cloudMsgs);
    });
    return () => unsubscribe();
  }, [isOwner, isAdmin]);

  // Real-Time Fan Clubs & Food Projects Sync from Firestore across all devices
  useEffect(() => {
    const unsubClubs = subscribeToFanClubs(INITIAL_FAN_CLUBS, (cloudClubs) => {
      setFanClubs(cloudClubs);
    });
    const unsubProjects = subscribeToFoodProjects(INITIAL_FOOD_SUPPORT_PROJECTS, (cloudProjects) => {
      setFoodProjects(cloudProjects);
    });
    return () => {
      unsubClubs();
      unsubProjects();
    };
  }, []);

  // Real-Time Career Projects Sync from Firestore across all devices
  useEffect(() => {
    const unsubProjects = subscribeToCareerProjects(INITIAL_CAREER_PROJECTS, (cloudProjects) => {
      setCareerProjects(cloudProjects);
    });
    return () => unsubProjects();
  }, []);


  const [msgCategory, setMsgCategory] = useState<FanMessageCategory>('calendar');
  const [msgSenderName, setMsgSenderName] = useState<string>('');
  const [msgEventTitle, setMsgEventTitle] = useState<string>('');
  const [msgEventDate, setMsgEventDate] = useState<string>('');
  const [msgSourceUrl, setMsgSourceUrl] = useState<string>('');
  const [msgContent, setMsgContent] = useState<string>('');
  const [messageSubmitted, setMessageSubmitted] = useState<boolean>(false);

  // Category-specific fields for Career Projects
  const [msgProjectCategory, setMsgProjectCategory] = useState<string>('Series');
  const [msgProjectArtist, setMsgProjectArtist] = useState<string>('Jimmy & Sea');
  const [msgProjectYear, setMsgProjectYear] = useState<string>('');
  const [msgCharacterNames, setMsgCharacterNames] = useState<string>('');

  // Category-specific fields for Fan Clubs
  const [msgFanClubCountry, setMsgFanClubCountry] = useState<string>('');
  const [msgFanClubCity, setMsgFanClubCity] = useState<string>('');

  // Category-specific fields for Food Support
  const [msgFoodSupportTarget, setMsgFoodSupportTarget] = useState<string>('');
  const [msgFoodSupportOrganizer, setMsgFoodSupportOrganizer] = useState<string>('');

  // Category-specific fields for Wanna Say Thanks
  const [msgThanksTo, setMsgThanksTo] = useState<string>('Jimmy & Sea');

  // Inbox category filter tab
  const [inboxFilterCategory, setInboxFilterCategory] = useState<'all' | 'calendar' | 'project' | 'fanclub' | 'foodsupport' | 'thanks'>('all');

  const unreadMessageCount = useMemo(() => {
    return fanMessages.filter((m) => !m.isRead).length;
  }, [fanMessages]);

  const openLeaveMessageModal = (overrideCategory?: FanMessageCategory) => {
    setMessageSubmitted(false);
    if (overrideCategory) {
      setMsgCategory(overrideCategory);
    } else if (activeTab === 'projects') {
      setMsgCategory('project');
    } else if (activeTab === 'fanhub') {
      setMsgCategory(fanHubSubTab === 'foodsupport' ? 'foodsupport' : 'fanclub');
    } else {
      setMsgCategory('calendar');
    }
    setLeaveMessageModalOpen(true);
  };

  const handleRefreshInbox = async () => {
    setIsRefreshingInbox(true);
    try {
      const fresh = await fetchFanMessagesFromFirestore();
      if (Array.isArray(fresh) && fresh.length > 0) {
        setFanMessages(fresh);
        try {
          localStorage.setItem('avocean_fan_messages_v1', JSON.stringify(fresh));
        } catch {}
        showToast(`Inbox refreshed! ${fresh.length} message${fresh.length > 1 ? 's' : ''} synced.`);
      } else {
        showToast('Inbox is up to date.');
      }
    } catch {
      showToast('Could not refresh inbox. Checking cloud connection...');
    } finally {
      setIsRefreshingInbox(false);
    }
  };

  const handleSendFanMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgSenderName.trim()) {
      if (msgCategory !== 'thanks') {
        showToast('Please enter your name or social handle.');
        return;
      }
    }
    if (msgCategory !== 'thanks' && !msgEventTitle.trim()) {
      if (msgCategory === 'project') {
        showToast('Please enter the project or brand title.');
      } else if (msgCategory === 'fanclub') {
        showToast('Please enter the fan club name.');
      } else if (msgCategory === 'foodsupport') {
        showToast('Please enter the food support project title.');
      } else {
        showToast('Please enter the event title or topic.');
      }
      return;
    }
    if (msgCategory !== 'thanks' && !msgSourceUrl.trim()) {
      showToast('Please provide a source link (e.g. social post, official website, or registration URL).');
      return;
    }
    if (!msgContent.trim()) {
      showToast(msgCategory === 'thanks' ? 'Please write your message or words of appreciation!' : 'Please provide details or a description.');
      return;
    }

    const effectiveSender = msgSenderName.trim() || (msgCategory === 'thanks' ? 'Anonymous NomNom 🥑🌊' : 'Anonymous');
    const effectiveTitle = msgCategory === 'thanks'
      ? (msgEventTitle.trim() || `💖 Thank You & Love for ${msgThanksTo}`)
      : msgEventTitle.trim();

    const newMsg: FanMessage = {
      id: `msg-${Date.now()}`,
      senderName: effectiveSender,
      eventTitle: effectiveTitle,
      eventDate: msgEventDate || undefined,
      sourceUrl: msgSourceUrl.trim() || undefined,
      message: msgContent.trim(),
      createdAt: new Date().toISOString(),
      isRead: false,
      category: msgCategory,
      ...(msgCategory === 'thanks'
        ? {
            thanksTo: msgThanksTo
          }
        : {}),
      ...(msgCategory === 'project'
        ? {
            projectCategory: msgProjectCategory,
            projectArtist: msgProjectArtist,
            projectYear: msgProjectYear.trim() || undefined,
            characterNames: msgCharacterNames.trim() || undefined
          }
        : {}),
      ...(msgCategory === 'fanclub'
        ? {
            fanClubCountry: msgFanClubCountry.trim() || undefined,
            fanClubCity: msgFanClubCity.trim() || undefined
          }
        : {}),
      ...(msgCategory === 'foodsupport'
        ? {
            foodSupportTarget: msgFoodSupportTarget.trim() || undefined,
            foodSupportOrganizer: msgFoodSupportOrganizer.trim() || undefined
          }
        : {})
    };

    setIsSendingMessage(true);

    try {
      // Optimistic state update
      setFanMessages((prev) => [newMsg, ...prev.filter((m) => m.id !== newMsg.id)]);
      // Save directly to Firestore cloud database
      await sendFanMessageToFirestore(newMsg);

      setMessageSubmitted(true);
      setTimeout(() => {
        setMessageSubmitted(false);
        setLeaveMessageModalOpen(false);
        setMsgSenderName('');
        setMsgEventTitle('');
        setMsgEventDate('');
        setMsgSourceUrl('');
        setMsgContent('');
        setMsgCharacterNames('');
        setMsgProjectYear('');
        setMsgFanClubCountry('');
        setMsgFanClubCity('');
        setMsgFoodSupportTarget('');
        setMsgFoodSupportOrganizer('');
        setMsgThanksTo('Jimmy & Sea');
        showToast(msgCategory === 'thanks' ? '💖 Thank you note sent in real time! Your love was received.' : '💌 Message sent in real time to Admins & Owner! Thank you.');
      }, 1200);
    } catch (err) {
      console.warn('Could not sync message to Firestore:', err);
      // Still keep locally and inform
      setMessageSubmitted(true);
      setTimeout(() => {
        setMessageSubmitted(false);
        setLeaveMessageModalOpen(false);
        setMsgSenderName('');
        setMsgEventTitle('');
        setMsgEventDate('');
        setMsgSourceUrl('');
        setMsgContent('');
        setMsgCharacterNames('');
        setMsgProjectYear('');
        setMsgFanClubCountry('');
        setMsgFanClubCity('');
        setMsgFoodSupportTarget('');
        setMsgFoodSupportOrganizer('');
        setMsgThanksTo('Jimmy & Sea');
        showToast('💌 Message saved! Will sync to all devices once online.');
      }, 1200);
    } finally {
      setIsSendingMessage(false);
    }
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

  const handleCopyMessageDetails = (msg: FanMessage) => {
    const lines = [
      `From: ${msg.senderName} (${msg.createdAt ? new Date(msg.createdAt).toLocaleDateString() : ''})`,
      `Type: ${msg.category === 'project' ? 'Career Project' : msg.category === 'fanclub' ? 'Fan Club Directory' : msg.category === 'foodsupport' ? 'Food Support Campaign' : 'Calendar Event'}`,
      `Title / Name: ${msg.eventTitle}`,
      msg.eventDate ? `Date: ${msg.eventDate}` : null,
      msg.projectCategory ? `Category: ${msg.projectCategory}` : null,
      msg.projectArtist ? `Artist: ${msg.projectArtist}` : null,
      msg.characterNames ? `Characters: ${msg.characterNames}` : null,
      msg.projectYear ? `Year: ${msg.projectYear}` : null,
      msg.fanClubCountry ? `Country / Region: ${msg.fanClubCountry}` : null,
      msg.fanClubCity ? `City: ${msg.fanClubCity}` : null,
      msg.foodSupportOrganizer ? `Organizer: ${msg.foodSupportOrganizer}` : null,
      msg.foodSupportTarget ? `Goal / Target: ${msg.foodSupportTarget}` : null,
      msg.sourceUrl ? `Link: ${msg.sourceUrl}` : null,
      `Details / Notes: ${msg.message}`
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(lines);
    showToast('Suggestion details copied to clipboard!');
  };

  const handleMarkMessageRead = async (id: string) => {
    const target = fanMessages.find((m) => m.id === id);
    if (target) {
      const nextRead = !target.isRead;
      setFanMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, isRead: nextRead } : m))
      );
      try {
        await updateFanMessageInFirestore(id, { isRead: nextRead });
      } catch (e) {
        console.warn('Could not update message read status in Firestore:', e);
      }
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!window.confirm('Delete this message from the Inbox?')) return;
    setFanMessages((prev) => {
      const updated = prev.filter((m) => m.id !== id);
      try {
        localStorage.setItem('avocean_fan_messages_v1', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    try {
      await deleteFanMessageFromFirestore(id);
      showToast('Message removed');
    } catch (e) {
      console.warn('Could not delete message from Firestore:', e);
    }
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

  const handleAddBannerPhoto = (photoInput: string) => {
    if (!photoInput.trim()) return;
    const currentList = settings.bannerPhotos && settings.bannerPhotos.length > 0
      ? [...settings.bannerPhotos]
      : (settings.bannerImageUrl ? [settings.bannerImageUrl] : []);

    const tokens = photoInput
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    const additions: string[] = [];
    tokens.forEach((url) => {
      if (!currentList.includes(url) && !additions.includes(url)) {
        additions.push(url);
      }
    });

    if (additions.length === 0) {
      showToast('Photo is already in banner collection');
      return;
    }

    const updatedList = [...currentList, ...additions];
    const updatedSettings: AppSettings = {
      ...settings,
      bannerPhotos: updatedList,
      bannerImageUrl: updatedList[0] || ''
    };
    setSettings(updatedSettings);
    saveSettingsToFirestore(updatedSettings).catch((err) => console.warn('Could not sync banner to Firestore:', err));
    setNewBannerUrlInput('');
    showToast(additions.length === 1 ? 'Banner photo added!' : `${additions.length} banner photos added!`);
  };

  const handleRemoveBannerPhoto = (indexToRemove: number) => {
    const currentList = settings.bannerPhotos && settings.bannerPhotos.length > 0
      ? [...settings.bannerPhotos]
      : (settings.bannerImageUrl ? [settings.bannerImageUrl] : []);
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

  const handleUpdateContainerWidth = (widthChoice: ContainerWidthChoice) => {
    const updated: AppSettings = { ...settings, containerWidth: widthChoice };
    setSettings(updated);
    saveSettingsToFirestore(updated).catch((err) => console.warn('Could not sync container width to Firestore:', err));
    showToast(`Display sizing updated to ${widthChoice === 'auto' ? 'Auto-Fit Screen' : widthChoice}`);
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
  const [isSavingEvent, setIsSavingEvent] = useState<boolean>(false);
  const [isCompressingPoster, setIsCompressingPoster] = useState<boolean>(false);
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDate, setFormDate] = useState<string>('2026-10-28');
  const [formEndDate, setFormEndDate] = useState<string>('');
  const [formIsMultiDay, setFormIsMultiDay] = useState<boolean>(false);
  const [formIsAllDay, setFormIsAllDay] = useState<boolean>(false);
  const [formTime, setFormTime] = useState<string>(() => (is12Hour ? '6:00 PM' : '18:00'));
  const [formEndTime, setFormEndTime] = useState<string>('');
  const [formTimezone, setFormTimezone] = useState<string>('BKK');
  const [customTimezone, setCustomTimezone] = useState<string>('');
  const [showTimeAdjuster, setShowTimeAdjuster] = useState<boolean>(true);
  const [timeAdjusterTarget, setTimeAdjusterTarget] = useState<'start' | 'end'>('start');

  // Currently focused time string for the scroll wheel & stepper
  const currentTimeForAdjuster = useMemo(() => {
    if (timeAdjusterTarget === 'start') {
      return formTime || (is12Hour ? '6:00 PM' : '18:00');
    }
    return formEndTime || formTime || (is12Hour ? '8:00 PM' : '20:00');
  }, [timeAdjusterTarget, formTime, formEndTime, is12Hour]);

  // Extract parsed hour & minute from active adjuster target
  const [adjHour24, adjMinute] = useMemo(() => {
    return parseHourAndMinute(currentTimeForAdjuster);
  }, [currentTimeForAdjuster]);

  const adjHour12 = useMemo(() => {
    const h = adjHour24 % 12;
    return h === 0 ? 12 : h;
  }, [adjHour24]);

  const adjPeriod = useMemo(() => {
    return adjHour24 >= 12 ? 'PM' : 'AM';
  }, [adjHour24]);

  // Set time value to the currently active target (start or end)
  const setTargetTimeValue = (val: string) => {
    if (timeAdjusterTarget === 'start') {
      setFormTime(val);
    } else {
      setFormEndTime(val);
    }
  };

  // Scroll wheel / button adjuster for Hour
  const handleAdjustHour = (delta: number) => {
    const nextH24 = (adjHour24 + delta + 24) % 24;
    const mStr = String(adjMinute).padStart(2, '0');
    if (is12Hour) {
      const p = nextH24 >= 12 ? 'PM' : 'AM';
      let h12 = nextH24 % 12;
      if (h12 === 0) h12 = 12;
      setTargetTimeValue(`${h12}:${mStr} ${p}`);
    } else {
      setTargetTimeValue(`${String(nextH24).padStart(2, '0')}:${mStr}`);
    }
  };

  // Scroll wheel / button adjuster for Minute (steps by delta, e.g. +/- 5)
  const handleAdjustMinute = (delta: number) => {
    let nextM = adjMinute + delta;
    let nextH24 = adjHour24;
    if (nextM >= 60) {
      nextM = nextM % 60;
      nextH24 = (nextH24 + 1) % 24;
    } else if (nextM < 0) {
      nextM = (nextM + 60) % 60;
      nextH24 = (nextH24 - 1 + 24) % 24;
    }
    const mStr = String(nextM).padStart(2, '0');
    if (is12Hour) {
      const p = nextH24 >= 12 ? 'PM' : 'AM';
      let h12 = nextH24 % 12;
      if (h12 === 0) h12 = 12;
      setTargetTimeValue(`${h12}:${mStr} ${p}`);
    } else {
      setTargetTimeValue(`${String(nextH24).padStart(2, '0')}:${mStr}`);
    }
  };

  // Toggle AM / PM in 12-Hour mode
  const handleSetAmPm = (target: 'AM' | 'PM') => {
    if (adjPeriod === target) return;
    const nextH24 = (adjHour24 + 12) % 24;
    let h12 = nextH24 % 12;
    if (h12 === 0) h12 = 12;
    const mStr = String(adjMinute).padStart(2, '0');
    setTargetTimeValue(`${h12}:${mStr} ${target}`);
  };

  // Quick preset helper to calculate end time by adding duration hours to start time
  const handleSetEndDuration = (hours: number) => {
    const [startH, startM] = parseHourAndMinute(formTime || (is12Hour ? '6:00 PM' : '18:00'));
    const totalMinutes = startH * 60 + startM + Math.round(hours * 60);
    const endH24 = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    const mStr = String(endM).padStart(2, '0');
    if (is12Hour) {
      const p = endH24 >= 12 ? 'PM' : 'AM';
      let h12 = endH24 % 12;
      if (h12 === 0) h12 = 12;
      setFormEndTime(`${h12}:${mStr} ${p}`);
    } else {
      setFormEndTime(`${String(endH24).padStart(2, '0')}:${mStr}`);
    }
    setTimeAdjusterTarget('end');
  };
  const [formLocation, setFormLocation] = useState<string>('');
  const [formLocationUrl, setFormLocationUrl] = useState<string>('');
  const [formPosterUrl, setFormPosterUrl] = useState<string>('');
  const [formPosterUrls, setFormPosterUrls] = useState<string[]>([]);
  const [formNewPosterUrlInput, setFormNewPosterUrlInput] = useState<string>('');
  const [showBatchPosterUrlInput, setShowBatchPosterUrlInput] = useState<boolean>(false);
  const [draftBatchPosterUrls, setDraftBatchPosterUrls] = useState<string>('');
  const [formMembers, setFormMembers] = useState<string[]>(['jimmy']);
  const [formCategory, setFormCategory] = useState<string>('Event');
  const [formLink, setFormLink] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [isExtendedDescEditor, setIsExtendedDescEditor] = useState<boolean>(false);
  const [showFullDescEditorModal, setShowFullDescEditorModal] = useState<boolean>(false);
  const [fullEditorTab, setFullEditorTab] = useState<'editor' | 'preview'>('editor');
  const [formHashtags, setFormHashtags] = useState<string>('');
  const [formWatchPlatforms, setFormWatchPlatforms] = useState<WatchPlatform[]>([]);

  // Registration Period Form State
  const [formHasRegistration, setFormHasRegistration] = useState<boolean>(false);
  const [formRegStartDate, setFormRegStartDate] = useState<string>('');
  const [formRegStartTime, setFormRegStartTime] = useState<string>('');
  const [formRegEndDate, setFormRegEndDate] = useState<string>('');
  const [formRegEndTime, setFormRegEndTime] = useState<string>('');
  const [formRegTimezone, setFormRegTimezone] = useState<string>('BKK');
  const [formRegUrl, setFormRegUrl] = useState<string>('');
  const [formRegNotes, setFormRegNotes] = useState<string>('');

  const [newPlatformName, setNewPlatformName] = useState<string>('GMMTV');
  const [newPlatformType, setNewPlatformType] = useState<string>('YouTube');
  const [newPlatformUrl, setNewPlatformUrl] = useState<string>('https://youtube.com/@gmmtv');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const bannerFileInputRef = useRef<HTMLInputElement | null>(null);

  // Settings Form State
  const [draftGreeting, setDraftGreeting] = useState<string>(settings.greeting);
  const [draftGreetingSize, setDraftGreetingSize] = useState<SubtitleSizeChoice>(settings.greetingSize || 'small');
  const [draftBannerTitle, setDraftBannerTitle] = useState<string>(settings.bannerTitle || 'JIMMY SEA AVOCEAN HUB');
  const [draftBannerTitleSize, setDraftBannerTitleSize] = useState<TitleSizeChoice>(settings.bannerTitleSize || 'medium');
  const [draftBannerSubtitle, setDraftBannerSubtitle] = useState<string>(settings.bannerSubtitle);
  const [draftBannerSubtitleSize, setDraftBannerSubtitleSize] = useState<SubtitleSizeChoice>(settings.bannerSubtitleSize || 'medium');
  const [draftHeaderAlignment, setDraftHeaderAlignment] = useState<HeaderAlignmentChoice>(settings.headerAlignment || 'left');
  const [draftContainerWidth, setDraftContainerWidth] = useState<ContainerWidthChoice>(settings.containerWidth || 'auto');
  const [draftBannerTag, setDraftBannerTag] = useState<string>(settings.bannerTag || '');
  const [draftBannerImageUrl, setDraftBannerImageUrl] = useState<string>(settings.bannerImageUrl);
  const [draftBannerPhotos, setDraftBannerPhotos] = useState<string[]>(() => {
    if (settings.bannerPhotos && settings.bannerPhotos.length > 0) return settings.bannerPhotos;
    if (settings.bannerImageUrl) return [settings.bannerImageUrl];
    return [];
  });
  const [draftNewBannerUrl, setDraftNewBannerUrl] = useState<string>('');
  const [showBatchUrlInput, setShowBatchUrlInput] = useState<boolean>(false);
  const [draftBatchBannerUrls, setDraftBatchBannerUrls] = useState<string>('');
  const [copiedBannerUrlIdx, setCopiedBannerUrlIdx] = useState<number | null>(null);
  const [draftBannerPreset, setDraftBannerPreset] = useState<string>(settings.bannerPreset);
  const [draftOwnerPin, setDraftOwnerPin] = useState<string>(settings.ownerPin || 'ErnestTheStan05!');
  const [draftAdminPin, setDraftAdminPin] = useState<string>(settings.adminPin || 'Avocean2026');
  const [draftTimeFormat, setDraftTimeFormat] = useState<'12h' | '24h'>(settings.timeFormat || '12h');
  const [draftWebsiteIcon, setDraftWebsiteIcon] = useState<string>(settings.websiteIcon || 'trio');
  const [draftMembers, setDraftMembers] = useState<Member[]>(settings.members);
  const [importJsonText, setImportJsonText] = useState<string>('');

  // Sizing classes for editable Hub Title, Subtitle & Top Greeting
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

  const greetingSizeClass = useMemo(() => {
    const sz = settings.greetingSize || 'small';
    if (sz === 'medium') return 'text-xs sm:text-sm';
    if (sz === 'large') return 'text-sm sm:text-base';
    if (sz === 'xlarge') return 'text-base sm:text-lg';
    return 'text-[11px] sm:text-xs'; // small default
  }, [settings.greetingSize]);

  // Container Width Class - Dynamic Auto-Fit to match device screen size or user preference
  const containerWidthClass = useMemo(() => {
    const mode = settings.containerWidth || 'auto';
    if (mode === 'compact') {
      return 'w-full max-w-[1340px] px-3 sm:px-4 mx-auto';
    }
    if (mode === 'wide') {
      return 'w-full max-w-[1780px] 2xl:max-w-[1920px] px-3 sm:px-6 md:px-8 xl:px-10 mx-auto';
    }
    if (mode === 'ultra') {
      return 'w-full max-w-[2160px] px-3 sm:px-6 md:px-8 xl:px-12 mx-auto';
    }
    if (mode === 'full') {
      return 'w-full max-w-[98vw] px-2 sm:px-4 md:px-6 lg:px-8 mx-auto';
    }
    // 'auto' default: automatically adapts to screen width with comfortable gutters!
    // On 1080p, 1440p, 2K/4K displays, comfortably expands up to 1880px / 2100px so content is not squished.
    return 'w-full max-w-[1780px] 2xl:max-w-[1920px] 3xl:max-w-[2160px] px-3 sm:px-6 md:px-8 xl:px-10 mx-auto';
  }, [settings.containerWidth]);

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
    saveSettingsToFirestore(updated).catch(() => {});
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

  // Open Login Modal with specific tab and mode
  const openLoginModal = (targetRole: 'admin' | 'owner' = 'owner', mode: 'signin' | 'register' = 'signin') => {
    setLoginMode(mode);
    setLoginRoleTab(targetRole);
    setLoginEmailInput('');
    setLoginPasswordInput('');
    setLoginError('');
    setShowLoginPassword(false);
    setRegError('');
    setRegEmailInput('');
    setRegDisplayNameInput('');
    setRegPasswordInput('');
    setRegConfirmPasswordInput('');
    setRegAdminPasscodeInput('Avocean2026');
    setShowRegPassword(false);
    setLoginModalOpen(true);
  };

  // Submit Admin Account Registration (with own email and passcodes)
  const handleRegisterAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (regPasswordInput !== regConfirmPasswordInput) {
      setRegError('Password and confirmation do not match.');
      return;
    }
    if (regPasswordInput.length < 6) {
      setRegError('Password / passcode must be at least 6 characters.');
      return;
    }

    setRegLoading(true);
    try {
      const res = await registerAdminAccount(
        regEmailInput,
        regPasswordInput,
        regDisplayNameInput,
        regAdminPasscodeInput
      );

      if (res.success && res.account) {
        setUserRole('admin');
        setCurrentAccount(res.account);
        setIsEditMode(true);
        setLoginModalOpen(false);
        setRegEmailInput('');
        setRegDisplayNameInput('');
        setRegPasswordInput('');
        setRegConfirmPasswordInput('');
        setRegError('');

        try {
          localStorage.setItem('avocean_current_account', JSON.stringify(res.account));
          localStorage.setItem(STORAGE_ROLE_KEY, 'admin');
        } catch {}

        showToast(`🎉 Admin account created! Welcome, ${res.account.displayName}.`);
      } else {
        setRegError(res.error || 'Could not create admin account. Please check your details.');
      }
    } catch (err: any) {
      setRegError(err?.message || 'Error creating account. Please try again.');
    } finally {
      setRegLoading(false);
    }
  };

  // Revoke / Delete Admin Account (Owner only)
  const handleDeleteAdmin = async (emailToDelete: string) => {
    if (!isOwner) return;
    if (!window.confirm(`Revoke and remove admin account "${emailToDelete}"? They will no longer be able to log in.`)) {
      return;
    }
    try {
      const res = await deleteAdminAccount(emailToDelete, currentUserEmail);
      if (res.success) {
        showToast(`Admin account "${emailToDelete}" removed.`);
      } else {
        showToast(res.error || 'Could not remove admin account.');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error removing admin account.');
    }
  };

  // Verify Login with Email and Password
  const handleVerifyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const email = loginEmailInput.trim();
      const pass = loginPasswordInput.trim();
      const res = await authenticateUserAccount(email, pass);

      if (res.success && res.account) {
        setUserRole(res.account.role);
        setCurrentAccount(res.account);
        setIsEditMode(true);
        setLoginModalOpen(false);
        setLoginPasswordInput('');
        setLoginError('');

        try {
          localStorage.setItem('avocean_current_account', JSON.stringify(res.account));
          localStorage.setItem(STORAGE_ROLE_KEY, res.account.role);
        } catch {}

        // Audit Log
        recordAuditLog({
          userEmail: res.account.email,
          role: res.account.role,
          actionType: 'login',
          details: `Logged in as ${res.account.role === 'owner' ? 'Owner' : 'Admin'} (${res.account.displayName})`
        }).catch(() => {});

        showToast(
          res.account.role === 'owner'
            ? '👑 Owner Mode unlocked! Full access granted.'
            : '🛡️ Admin Mode unlocked! You can now add and edit calendar events.'
        );
      } else {
        const errorMsg = res.error || 'Invalid email or password.';
        setLoginError(errorMsg);

        // Audit Log for failed login
        recordAuditLog({
          userEmail: email || 'unknown@avocean',
          role: 'admin',
          actionType: 'login_failed',
          details: `Failed login attempt with email "${email}": ${errorMsg}`
        }).catch(() => {});
      }
    } catch (err: any) {
      setLoginError(err?.message || 'Authentication error. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    const prevEmail = currentUserEmail;
    const prevRole = userRole;

    recordAuditLog({
      userEmail: prevEmail,
      role: prevRole === 'owner' ? 'owner' : 'admin',
      actionType: 'logout',
      details: `User ${prevEmail} logged out from ${prevRole} session`
    }).catch(() => {});

    setUserRole('visitor');
    setCurrentAccount(null);
    setIsEditMode(false);
    try {
      localStorage.removeItem('avocean_current_account');
      localStorage.setItem(STORAGE_ROLE_KEY, 'visitor');
    } catch {}
    showToast('Logged out. Switched to Visitor View.');
  };

  // Open Change Password Modal
  const openChangePasswordModal = (targetEmail?: string) => {
    const email = targetEmail || currentAccount?.email || '';
    setChangePassEmail(email);
    setCurrentPasswordInput('');
    setNewPasswordInput('');
    setConfirmPasswordInput('');
    setPasswordError('');
    setShowPasswordField(false);
    setChangePasswordModalOpen(true);
  };

  // Submit Password Change
  const handleSubmitChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }
    if (newPasswordInput.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await updateAdminAccountPassword(changePassEmail, currentPasswordInput, newPasswordInput);
      if (res.success) {
        setChangePasswordModalOpen(false);
        setCurrentPasswordInput('');
        setNewPasswordInput('');
        setConfirmPasswordInput('');
        showToast(`Password successfully updated for ${changePassEmail}!`);
      } else {
        setPasswordError(res.error || 'Could not update password. Please verify current password.');
      }
    } catch (err: any) {
      setPasswordError(err?.message || 'Error updating password.');
    } finally {
      setIsUpdatingPassword(false);
    }
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
    const now = new Date();
    const currentTodayStr = toDateKey(now.getFullYear(), now.getMonth(), now.getDate());
    setTodayDateStr(currentTodayStr);
    setCurrentMonthDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDateStr(currentTodayStr);
    setSelectedDayActiveEventId(null);
    showToast(`Jumped to Today: ${formatDetailFullDate(currentTodayStr)} (${userLocalTimezone})`);
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
      map[k].sort((a, b) => {
        if (a.isAllDay && !b.isAllDay) return -1;
        if (!a.isAllDay && b.isAllDay) return 1;
        return (a.time || '').localeCompare(b.time || '');
      });
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
    setFormIsAllDay(false);
    setFormTime(is12Hour ? '6:00 PM' : '18:00');
    setFormEndTime('');
    setTimeAdjusterTarget('start');
    setFormTimezone('BKK');
    setCustomTimezone('');
    setFormLocation('');
    setFormLocationUrl('');
    setFormPosterUrl('');
    setFormPosterUrls([]);
    setFormNewPosterUrlInput('');
    setShowBatchPosterUrlInput(false);
    setDraftBatchPosterUrls('');
    setFormMembers(['jimmy', 'sea']);
    setFormCategory('Event');
    setFormLink('');
    setFormDescription('');
    setIsExtendedDescEditor(false);
    setShowFullDescEditorModal(false);
    setFullEditorTab('editor');
    setFormHashtags('#JimmySea #AVOCEAN');
    setFormWatchPlatforms([]);
    setNewPlatformUrl('');
    setNewPlatformName('');
    setNewPlatformType('');
    setFormHasRegistration(false);
    setFormRegStartDate('');
    setFormRegStartTime(is12Hour ? '10:00 AM' : '10:00');
    setFormRegEndDate('');
    setFormRegEndTime(is12Hour ? '6:00 PM' : '18:00');
    setFormRegTimezone('BKK');
    setFormRegUrl('');
    setFormRegNotes('');
    setShowTimeAdjuster(true);
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

    const isAllDay = Boolean(ev.isAllDay || ev.time?.toLowerCase() === 'all day');
    setFormIsAllDay(isAllDay);

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

    if (parsedTime && !isAllDay) {
      if (is12Hour) {
        parsedTime = formatTime12h(parsedTime);
      }
    } else if (!isAllDay) {
      parsedTime = is12Hour ? '6:00 PM' : '18:00';
    }

    let parsedEndTime = ev.endTime || '';
    if (parsedEndTime && !isAllDay) {
      if (is12Hour) {
        parsedEndTime = formatTime12h(parsedEndTime);
      }
    }

    setFormTime(parsedTime);
    setFormEndTime(parsedEndTime);
    setTimeAdjusterTarget('start');

    const matched = ALL_TIMEZONES.find((t) => t.code === parsedTz);
    if (matched) {
      setFormTimezone(matched.code);
      setCustomTimezone('');
    } else {
      setFormTimezone('CUSTOM');
      setCustomTimezone(parsedTz);
    }
    setShowTimeAdjuster(!isAllDay);

    setFormLocation(ev.location || '');
    setFormLocationUrl(ev.locationUrl || '');
    const evPosters = getEventPosters(ev);
    setFormPosterUrls(evPosters);
    setFormPosterUrl(evPosters[0] || '');
    setFormNewPosterUrlInput('');
    setShowBatchPosterUrlInput(false);
    setDraftBatchPosterUrls('');
    setFormMembers(ev.members && ev.members.length ? ev.members : ['jimmy']);
    setFormCategory(ev.category || 'Event');
    setFormLink(ev.link || '');
    const currentDesc = ev.description || ev.notes || '';
    setFormDescription(currentDesc);
    setIsExtendedDescEditor(currentDesc.length > 200 || currentDesc.split('\n').length > 5);
    setShowFullDescEditorModal(false);
    setFullEditorTab('editor');
    setFormHashtags(ev.hashtags || '');
    setFormWatchPlatforms(ev.watchPlatforms ? [...ev.watchPlatforms] : []);
    setNewPlatformUrl('');
    setNewPlatformName('');
    setNewPlatformType('');
    // Populate registration period fields
    setFormHasRegistration(Boolean(ev.hasRegistration || ev.registrationStartDate));
    setFormRegStartDate(ev.registrationStartDate || '');
    setFormRegStartTime(ev.registrationStartTime || '');
    setFormRegEndDate(ev.registrationEndDate || '');
    setFormRegEndTime(ev.registrationEndTime || '');
    setFormRegTimezone(ev.registrationTimezone || ev.timezone || 'BKK');
    setFormRegUrl(ev.registrationUrl || '');
    setFormRegNotes(ev.registrationNotes || '');
    setEventModalOpen(true);
  };

  // Submit Add/Edit Event Form
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showToast('Please enter an event title.');
      return;
    }

    setIsSavingEvent(true);

    try {
      const resolvedTimezone =
        formTimezone === 'CUSTOM'
          ? customTimezone.trim() || 'UTC'
          : formTimezone;

      const resolvedEndDate =
        formIsMultiDay && formEndDate && formEndDate > formDate
          ? formEndDate
          : undefined;

      // Prepare posters list: combine formPosterUrls and any unsaved input
      let finalPostersList = [...formPosterUrls];
      if (formNewPosterUrlInput.trim() && !finalPostersList.includes(formNewPosterUrlInput.trim())) {
        finalPostersList.push(formNewPosterUrlInput.trim());
      }
      if (finalPostersList.length === 0 && formPosterUrl.trim()) {
        finalPostersList.push(formPosterUrl.trim());
      }
      finalPostersList = finalPostersList.filter(Boolean);

      // Auto-compress any base64 data URLs in the posters list
      const compressedPostersList: string[] = [];
      for (let p of finalPostersList) {
        if (p.startsWith('data:image/') && p.length > 150 * 1024) {
          try {
            p = await compressDataUrl(p, 1100, 0.78);
          } catch (compErr) {
            console.warn('Poster auto-compression fallback:', compErr);
          }
        }
        compressedPostersList.push(p);
      }

      const primaryPoster = compressedPostersList[0] || '';

      const newEvent: ScheduleEvent = {
        id: editingEvent ? editingEvent.id : `ev-${Date.now()}`,
        title: formTitle.trim(),
        date: formDate,
        endDate: resolvedEndDate || undefined,
        isAllDay: formIsAllDay,
        time: formIsAllDay ? 'All Day' : formTime.trim(),
        endTime: formIsAllDay ? undefined : (formEndTime.trim() ? formEndTime.trim() : undefined),
        timezone: formIsAllDay ? undefined : resolvedTimezone,
        location: formLocation.trim(),
        locationUrl: formLocationUrl.trim(),
        posterUrl: primaryPoster,
        posterUrls: compressedPostersList.length > 0 ? compressedPostersList : undefined,
        members: formMembers.length > 0 ? formMembers : [settings.members[0].id],
        category: formCategory,
        link: formLink.trim(),
        description: formDescription.trim(),
        hashtags: formHashtags.trim(),
        watchPlatforms: formWatchPlatforms,
        // Registration Period Fields
        hasRegistration: formHasRegistration,
        registrationStartDate: formHasRegistration && formRegStartDate ? formRegStartDate : undefined,
        registrationStartTime: formHasRegistration && formRegStartTime.trim() ? formRegStartTime.trim() : undefined,
        registrationEndDate: formHasRegistration && formRegEndDate ? formRegEndDate : undefined,
        registrationEndTime: formHasRegistration && formRegEndTime.trim() ? formRegEndTime.trim() : undefined,
        registrationTimezone: formHasRegistration && formRegStartDate ? formRegTimezone : undefined,
        registrationUrl: formHasRegistration && formRegUrl.trim() ? formRegUrl.trim() : undefined,
        registrationNotes: formHasRegistration && formRegNotes.trim() ? formRegNotes.trim() : undefined
      };

      // 1. Await Firestore save to guarantee it is safely committed to cloud
      await saveEventToFirestore(newEvent);

      // 2. Invalidate translation cache for this event so updated links and descriptions are never stale
      setTranslationsCache((prev) => {
        if (!prev[newEvent.id]) return prev;
        const next = { ...prev };
        delete next[newEvent.id];
        try {
          localStorage.setItem('avocean_translations_cache', JSON.stringify(next));
        } catch {}
        return next;
      });
      // Reset translation toggle to show the newly updated original text
      setActiveTranslationViews((prev) => ({ ...prev, [newEvent.id]: false }));

      // 3. Update React state
      setEvents((prev) => {
        const exists = prev.some((item) => item.id === newEvent.id);
        return exists
          ? prev.map((item) => (item.id === newEvent.id ? newEvent : item))
          : [...prev, newEvent];
      });

      if (detailEvent && detailEvent.id === newEvent.id) {
        setDetailEvent(newEvent);
      }

      // Record Audit Log
      recordAuditLog({
        userEmail: currentUserEmail,
        role: userRole === 'owner' ? 'owner' : 'admin',
        actionType: editingEvent ? 'edit_event' : 'create_event',
        details: `${editingEvent ? 'Updated' : 'Added'} event "${newEvent.title}" (${newEvent.date}${newEvent.time ? ` at ${newEvent.time}` : ''})`
      }).catch(() => {});

      setSelectedDateStr(formDate);
      setSelectedDayActiveEventId(null);
      const dt = parseDateKey(formDate);
      setCurrentMonthDate(new Date(dt.getFullYear(), dt.getMonth(), 1));
      setEventModalOpen(false);
      showToast(editingEvent ? 'Event updated and saved to cloud!' : 'Event added to calendar and saved to cloud!');
    } catch (err: any) {
      console.error('Could not save event to Firestore:', err);
      showToast(`Could not save event: ${err?.message || 'Please check your connection and try again.'}`);
    } finally {
      setIsSavingEvent(false);
    }
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
    const targetEv = events.find((ev) => ev.id === eventId);
    const updated = events.filter((ev) => ev.id !== eventId);
    setEvents(updated);

    // Record Audit Log
    recordAuditLog({
      userEmail: currentUserEmail,
      role: 'owner',
      actionType: 'delete_event',
      details: `Deleted event "${targetEv ? targetEv.title : eventId}" (${targetEv ? targetEv.date : ''})`
    }).catch(() => {});

    // Purge translation cache for deleted event
    setTranslationsCache((prev) => {
      if (!prev[eventId]) return prev;
      const next = { ...prev };
      delete next[eventId];
      try {
        localStorage.setItem('avocean_translations_cache', JSON.stringify(next));
      } catch {}
      return next;
    });
    setActiveTranslationViews((prev) => {
      const next = { ...prev };
      delete next[eventId];
      return next;
    });

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

  // Handle Poster Photo(s) Upload with automatic compression for fast cloud sync
  const handlePosterFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsCompressingPoster(true);
    showToast(`Optimizing ${files.length} photo${files.length > 1 ? 's' : ''} for cloud sync...`);

    try {
      const newCompressedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 15 * 1024 * 1024) {
          showToast(`"${file.name}" is larger than 15MB. Skipped.`);
          continue;
        }
        try {
          const compressedUrl = await compressImageFile(file, 1100, 0.78);
          newCompressedUrls.push(compressedUrl);
        } catch (err) {
          console.warn('Poster compression error for', file.name, err);
        }
      }

      if (newCompressedUrls.length > 0) {
        setFormPosterUrls((prev) => {
          const updated = [...prev, ...newCompressedUrls];
          setFormPosterUrl(updated[0] || '');
          return updated;
        });
        showToast(`Added ${newCompressedUrls.length} photo${newCompressedUrls.length > 1 ? 's' : ''}!`);
      }
    } finally {
      setIsCompressingPoster(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAddPosterUrl = () => {
    const trimmed = formNewPosterUrlInput.trim();
    if (!trimmed) return;
    setFormPosterUrls((prev) => {
      const updated = [...prev, trimmed];
      setFormPosterUrl(updated[0] || '');
      return updated;
    });
    setFormNewPosterUrlInput('');
    showToast('Photo added!');
  };

  const handleApplyBatchPosterUrls = () => {
    if (!draftBatchPosterUrls.trim()) return;
    const lines = draftBatchPosterUrls
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.startsWith('http://') || l.startsWith('https://') || l.startsWith('data:image/'));

    if (lines.length === 0) {
      showToast('No valid photo URLs found.');
      return;
    }

    setFormPosterUrls((prev) => {
      const updated = [...prev, ...lines];
      setFormPosterUrl(updated[0] || '');
      return updated;
    });
    setDraftBatchPosterUrls('');
    setShowBatchPosterUrlInput(false);
    showToast(`Added ${lines.length} photos!`);
  };

  const handleRemovePoster = (indexToRemove: number) => {
    setFormPosterUrls((prev) => {
      const updated = prev.filter((_, idx) => idx !== indexToRemove);
      setFormPosterUrl(updated[0] || '');
      return updated;
    });
    showToast('Photo removed.');
  };

  const handleSetCoverPoster = (indexToCover: number) => {
    if (indexToCover === 0) return;
    setFormPosterUrls((prev) => {
      const item = prev[indexToCover];
      const rest = prev.filter((_, idx) => idx !== indexToCover);
      const updated = [item, ...rest];
      setFormPosterUrl(updated[0] || '');
      return updated;
    });
    showToast('Cover poster set!');
  };

  const handleMovePoster = (fromIdx: number, toIdx: number) => {
    setFormPosterUrls((prev) => {
      if (toIdx < 0 || toIdx >= prev.length) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(fromIdx, 1);
      copy.splice(toIdx, 0, moved);
      setFormPosterUrl(copy[0] || '');
      return copy;
    });
  };

  // Handle Banner Photo Upload from device with compression and Firestore real-time sync
  const handleBannerFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    showToast(fileList.length === 1 ? 'Optimizing & uploading banner photo...' : `Optimizing & uploading ${fileList.length} banner photos...`);

    try {
      const compressedUrls: string[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (file.size > 20 * 1024 * 1024) {
          showToast(`File ${file.name} is too large (>20MB). Skipping.`);
          continue;
        }
        try {
          // Compress with 1280 max dimension and 0.78 quality to keep Firestore document compact & fast
          const compressed = await compressImageFile(file, 1280, 0.78);
          compressedUrls.push(compressed);
        } catch (err) {
          console.warn('Banner compression error:', err);
          const rawUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (ev) => resolve((ev.target?.result as string) || '');
            reader.readAsDataURL(file);
          });
          if (rawUrl) compressedUrls.push(rawUrl);
        }
      }

      if (compressedUrls.length === 0) return;

      const currentList = settings.bannerPhotos && settings.bannerPhotos.length > 0
        ? [...settings.bannerPhotos]
        : (settings.bannerImageUrl ? [settings.bannerImageUrl] : []);

      const updatedList = [...currentList, ...compressedUrls];

      // Update local state and drafts
      setDraftBannerImageUrl(compressedUrls[0]);
      setDraftBannerPhotos((prev) => [...prev, ...compressedUrls]);
      const updatedSettings: AppSettings = {
        ...settings,
        bannerPhotos: updatedList,
        bannerImageUrl: updatedList[0] || ''
      };
      setSettings(updatedSettings);

      // Persist to Firestore so everyone (admins, fans, visitors worldwide) sees it in real time
      await saveSettingsToFirestore(updatedSettings);
      showToast(
        compressedUrls.length === 1
          ? 'Banner photo uploaded & synced live to Firestore! Everyone can now see it.'
          : `${compressedUrls.length} banner photos uploaded & synced live to Firestore! Everyone can now see them.`
      );
    } catch (err) {
      console.error('Failed to upload/sync banner photo:', err);
      showToast('Could not save banner photo to Firestore. Please try again.');
    } finally {
      if (bannerFileInputRef.current) {
        bannerFileInputRef.current.value = '';
      }
    }
  };

  // Helper for checking if hashtag is currently present
  const hasHashtag = (currentText: string, tag: string): boolean => {
    if (!currentText || !tag) return false;
    const cleanTag = tag.trim().toLowerCase();
    const words = currentText.split(/\s+/).map((w) => w.toLowerCase());
    return words.includes(cleanTag);
  };

  // Helper for toggling a hashtag in the input
  const handleToggleHashtag = (tag: string) => {
    setFormHashtags((prev) => {
      const cleanTag = tag.trim();
      const words = (prev || '').trim().split(/\s+/).filter(Boolean);
      if (words.some((w) => w.toLowerCase() === cleanTag.toLowerCase())) {
        return words.filter((w) => w.toLowerCase() !== cleanTag.toLowerCase()).join(' ');
      } else {
        return [...words, cleanTag].join(' ');
      }
    });
  };

  const handleAddAllRequestedTags = () => {
    const requested = ['#jimmyyjp', '#Tiny', '#sea_tawinan', '#ChaoTalay', '#ชาวทะเล', '#AVOCEAN'];
    setFormHashtags((prev) => {
      const words = (prev || '').trim().split(/\s+/).filter(Boolean);
      requested.forEach((tag) => {
        if (!words.some((w) => w.toLowerCase() === tag.toLowerCase())) {
          words.push(tag);
        }
      });
      return words.join(' ');
    });
    showToast('Added popular JimmySea hashtags!');
  };

  // Auto-detect streaming website and channel when user pastes or types a link
  const handleWatchUrlChange = (url: string) => {
    setNewPlatformUrl(url);
    if (url.trim()) {
      const detected = detectPlatformFromUrl(url);
      setNewPlatformName(detected.name);
      setNewPlatformType(detected.platform);
    }
  };

  const handleAddWatchPlatform = (overrideUrl?: string, overrideName?: string, overrideType?: string) => {
    const rawUrl = (overrideUrl || newPlatformUrl).trim();
    if (!rawUrl) {
      showToast('Please enter or paste a streaming URL');
      return;
    }
    const detected = detectPlatformFromUrl(rawUrl);
    const resolvedName = (overrideName || newPlatformName).trim() || detected.name || 'GMMTV';
    const resolvedType = (overrideType || newPlatformType).trim() || detected.platform || 'YouTube';
    const resolvedUrl = rawUrl.startsWith('http://') || rawUrl.startsWith('https://') ? rawUrl : `https://${rawUrl}`;

    const item: WatchPlatform = {
      id: `wp-${Date.now()}`,
      name: resolvedName,
      platform: resolvedType,
      url: resolvedUrl
    };
    setFormWatchPlatforms((prev) => [...prev, item]);
    setNewPlatformUrl('');
    setNewPlatformName('');
    setNewPlatformType('');
    showToast(`Added ${resolvedName} (${resolvedType})!`);
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

  // --- Translation Handlers for Event Descriptions ---
  const handleSelectTranslationLang = (langCode: string) => {
    setPreferredTranslationLang(langCode);
    try {
      localStorage.setItem('avocean_preferred_trans_lang', langCode);
    } catch {}
    const langObj = TRANSLATION_LANGUAGES.find((l) => l.code === langCode);
    showToast(`Translation language: ${langObj?.flag || ''} ${langObj?.name || langCode}`);
  };

  const handleTranslateEventDescription = async (
    eventId: string,
    text: string,
    targetLangCode?: string,
    forceRefresh: boolean = false
  ) => {
    const lang = targetLangCode || preferredTranslationLang;
    if (!text.trim()) return;

    const currentChecksum = computeTextChecksum(text);
    const eventCache = translationsCache[eventId];
    const isChecksumValid = eventCache && eventCache._sourceChecksum === currentChecksum;

    // If already in cache for this event and target language, and source checksum matches, and not forcing refresh:
    if (!forceRefresh && isChecksumValid) {
      const existing = eventCache[lang];
      if (
        existing &&
        !existing.includes('QUERY LENGTH LIMIT') &&
        !existing.startsWith('MYMEMORY WARNING')
      ) {
        setActiveTranslationViews((prev) => ({ ...prev, [eventId]: true }));
        return;
      }
    }

    setTranslatingEventId(eventId);
    try {
      const translated = await translateText(text, lang);
      setTranslationsCache((prev) => {
        const prevEvent = prev[eventId];
        // If checksum changed, clear previous stale language versions so we don't mix old & new translations
        const base = prevEvent?._sourceChecksum === currentChecksum ? prevEvent : {};
        const next = {
          ...prev,
          [eventId]: {
            ...base,
            _sourceChecksum: currentChecksum,
            [lang]: translated
          }
        };
        try {
          localStorage.setItem('avocean_translations_cache', JSON.stringify(next));
        } catch {}
        return next;
      });
      setActiveTranslationViews((prev) => ({ ...prev, [eventId]: true }));
      const langObj = TRANSLATION_LANGUAGES.find((l) => l.code === lang);
      showToast(forceRefresh ? `Refreshed ${langObj?.name || lang} translation!` : `Translated to ${langObj?.flag || ''} ${langObj?.name || lang}!`);
    } catch (err: any) {
      console.error('Translation error:', err);
      showToast('Could not complete translation. Please try again.');
    } finally {
      setTranslatingEventId(null);
    }
  };

  const handleToggleTranslationView = (eventId: string) => {
    setActiveTranslationViews((prev) => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
  };

  const handleCopyTranslatedDescription = (eventId: string, text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedTranslationId(eventId);
    showToast('Description copied to clipboard!');
    setTimeout(() => {
      setCopiedTranslationId((prev) => (prev === eventId ? null : prev));
    }, 2500);
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
    const initialPhotos = settings.bannerPhotos && settings.bannerPhotos.length > 0
      ? [...settings.bannerPhotos]
      : (settings.bannerImageUrl ? [settings.bannerImageUrl] : []);
    setDraftBannerPhotos(initialPhotos);
    setDraftBannerImageUrl(initialPhotos[0] || settings.bannerImageUrl || '');
    setDraftNewBannerUrl('');
    setDraftBatchBannerUrls('');
    setShowBatchUrlInput(false);
    setCopiedBannerUrlIdx(null);
    setDraftGreeting(settings.greeting || DEFAULT_SETTINGS.greeting);
    setDraftGreetingSize(settings.greetingSize || 'small');
    setDraftBannerTitle(settings.bannerTitle || 'JIMMY SEA AVOCEAN HUB');
    setDraftBannerTitleSize(settings.bannerTitleSize || 'medium');
    setDraftBannerSubtitle(settings.bannerSubtitle ?? DEFAULT_SETTINGS.bannerSubtitle);
    setDraftBannerSubtitleSize(settings.bannerSubtitleSize || 'medium');
    setDraftHeaderAlignment(settings.headerAlignment || 'left');
    setDraftContainerWidth(settings.containerWidth || 'auto');
    setDraftBannerTag(settings.bannerTag ?? '');
    setDraftBannerPreset(settings.bannerPreset || 'avocean-dream');
    setDraftOwnerPin(settings.ownerPin || 'ErnestTheStan05!');
    setDraftAdminPin(settings.adminPin || 'Avocean2026');
    setDraftTimeFormat(settings.timeFormat || '12h');
    setDraftWebsiteIcon(settings.websiteIcon || 'trio');
    setDraftMembers(settings.members.map((m) => ({ ...m })));
    setSettingsModalOpen(true);
  };

  const handleDraftAddPhoto = (urlInput: string) => {
    if (!urlInput.trim()) return;
    const tokens = urlInput
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const newAdditions: string[] = [];
    tokens.forEach((url) => {
      if (!draftBannerPhotos.includes(url) && !newAdditions.includes(url)) {
        newAdditions.push(url);
      }
    });

    if (newAdditions.length === 0) {
      showToast('Photo URL is already in your banner list');
      return;
    }

    setDraftBannerPhotos((prev) => [...prev, ...newAdditions]);
    setDraftNewBannerUrl('');
    setDraftBatchBannerUrls('');
    setShowBatchUrlInput(false);
    showToast(newAdditions.length === 1 ? 'Banner photo added!' : `${newAdditions.length} banner photos added!`);
  };

  const handleDraftRemovePhoto = (idxToRemove: number) => {
    setDraftBannerPhotos((prev) => prev.filter((_, idx) => idx !== idxToRemove));
    showToast('Photo removed from list');
  };

  const handleDraftMovePhoto = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= draftBannerPhotos.length) return;
    setDraftBannerPhotos((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(fromIdx, 1);
      copy.splice(toIdx, 0, item);
      return copy;
    });
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanBannerPhotos = draftBannerPhotos
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    const primaryBannerImage = cleanBannerPhotos[0] || '';

    const updatedSettings: AppSettings = {
      ...settings,
      greeting: draftGreeting.trim() || 'Hey ErnestTheStan!',
      greetingSize: draftGreetingSize,
      bannerTitle: draftBannerTitle.trim() || 'JIMMY SEA AVOCEAN HUB',
      bannerTitleSize: draftBannerTitleSize,
      bannerSubtitle:
        draftBannerSubtitle.trim() ||
        'Official Fan Schedule, Appearances & Trending Projects 🥑🌊💚',
      bannerSubtitleSize: draftBannerSubtitleSize,
      headerAlignment: draftHeaderAlignment,
      containerWidth: draftContainerWidth,
      bannerTag: draftBannerTag.trim() || '',
      bannerImageUrl: primaryBannerImage,
      bannerPhotos: cleanBannerPhotos,
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
    saveSettingsToFirestore(updatedSettings).catch((err) => console.warn('Could not sync settings to Firestore:', err));
    recordAuditLog({
      userEmail: currentUserEmail,
      role: 'owner',
      actionType: 'update_settings',
      details: `Updated hub settings: title="${updatedSettings.bannerTitle}", subtitle="${updatedSettings.bannerSubtitle}", icon="${updatedSettings.websiteIcon}"`
    }).catch(() => {});
    setSettingsModalOpen(false);
    showToast('Banner, Website Icon & Settings updated in cloud!');
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Reset all schedule events and settings back to original sample data?')) {
      setSettings(DEFAULT_SETTINGS);
      setEvents(SAMPLE_EVENTS);
      setActiveMemberIds(['jimmy', 'sea', 'avocean']);
      saveSettingsToFirestore(DEFAULT_SETTINGS).catch(() => {});
      SAMPLE_EVENTS.forEach((ev) => {
        saveEventToFirestore(ev).catch(() => {});
      });
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
        const updated = { ...DEFAULT_SETTINGS, ...parsed.settings, bannerTitle: 'JIMMY SEA AVOCEAN HUB' };
        setSettings(updated);
        saveSettingsToFirestore(updated).catch(() => {});
      }
      if (Array.isArray(parsed.events)) {
        setEvents(parsed.events);
        parsed.events.forEach((ev: ScheduleEvent) => {
          saveEventToFirestore(ev).catch(() => {});
        });
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

  // Counts for List View Filters (Upcoming vs Past Concluded)
  const { upcomingCount, pastCount, allCount } = useMemo(() => {
    let upcoming = 0;
    let past = 0;
    filteredEvents.forEach((ev) => {
      const isPast = (ev.endDate || ev.date) < todayDateStr;
      if (isPast) past++;
      else upcoming++;
    });
    return {
      upcomingCount: upcoming,
      pastCount: past,
      allCount: filteredEvents.length
    };
  }, [filteredEvents, todayDateStr]);

  const listViewEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...filteredEvents]
      .filter((ev) => {
        const isPast = (ev.endDate || ev.date) < todayDateStr;
        if (listViewFilter === 'upcoming' && isPast) return false;
        if (listViewFilter === 'past' && !isPast) return false;

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
        if (listViewFilter === 'past') {
          // Show most recently concluded events first
          if (a.date !== b.date) return b.date.localeCompare(a.date);
          if (a.isAllDay && !b.isAllDay) return -1;
          if (!a.isAllDay && b.isAllDay) return 1;
          return (b.time || '').localeCompare(a.time || '');
        }
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        if (a.isAllDay && !b.isAllDay) return -1;
        if (!a.isAllDay && b.isAllDay) return 1;
        return (a.time || '').localeCompare(b.time || '');
      });
  }, [filteredEvents, searchQuery, listViewFilter, todayDateStr]);

  const selectedTzObj = ALL_TIMEZONES.find((t) => t.code === formTimezone);

  const reminderConversion = useMemo(() => {
    if (!reminderEvent) return null;
    const startConv = convertEventTimeAndDate(
      reminderEvent.time || '18:00',
      reminderEvent.timezone || 'BKK',
      reminderUserTz,
      reminderEvent.date,
      is12Hour
    );
    const endConv = reminderEvent.endTime
      ? convertEventTimeAndDate(
          reminderEvent.endTime,
          reminderEvent.timezone || 'BKK',
          reminderUserTz,
          reminderEvent.endDate || reminderEvent.date,
          is12Hour
        )
      : null;
    return {
      start: startConv,
      end: endConv
    };
  }, [reminderEvent, reminderUserTz, is12Hour]);

  // Render Full Event View (Matching Screenshot 2 - shows all details immediately!)
  const renderFullEventCard = (ev: ScheduleEvent) => {
    const hasReminder = isReminderSetForEvent(ev.id);
    const regInfo = getRegistrationStatusInfo(ev, todayDateStr);
    const allPosters = getEventPosters(ev);

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
            {regInfo.hasReg && (
              <span className={`text-xs font-extrabold flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-2xs ${regInfo.badgeBg} ${regInfo.badgeText} ${regInfo.badgeBorder}`}>
                <span className={`w-2 h-2 rounded-full ${
                  regInfo.status === 'open'
                    ? 'bg-emerald-500 animate-pulse'
                    : regInfo.status === 'upcoming'
                    ? 'bg-amber-500'
                    : 'bg-slate-400'
                }`} />
                <span>{regInfo.statusLabel}</span>
              </span>
            )}
            {(ev.isAllDay || ev.time || ev.endTime) && (
              <span className={`text-xs font-bold flex items-center gap-1.5 flex-wrap ${
                ev.isAllDay ? 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/70 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800' : 'text-[#334155] dark:text-slate-300'
              }`}>
                {ev.isAllDay ? (
                  <span>☀️ All Day</span>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5 text-purple-500" />
                    <span>{formatEventTime(ev, is12Hour)}</span>
                    {getEventTimeDurationLabel(ev.time, ev.endTime) && (
                      <span className="text-[10px] font-bold text-purple-600 dark:text-purple-300 bg-purple-100/70 dark:bg-purple-950/70 px-2 py-0.5 rounded-full">
                        {getEventTimeDurationLabel(ev.time, ev.endTime)}
                      </span>
                    )}
                  </>
                )}
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
              {/* Poster Media (Single or Multiple Photos with gallery carousel and thumbnail strip) */}
              {allPosters.length > 0 && (() => {
                const currentIdx = (activePhotoIndexByEvent[ev.id] ?? 0) % allPosters.length;
                const activePhotoUrl = allPosters[currentIdx] || allPosters[0];

                return (
                  <div className="flex flex-col gap-2.5">
                    <div
                      onClick={() => setEnlargedPhoto({
                        url: activePhotoUrl,
                        title: `${ev.title}${allPosters.length > 1 ? ` (${currentIdx + 1}/${allPosters.length})` : ''}`,
                        photos: allPosters,
                        currentIndex: currentIdx
                      })}
                      className="w-full rounded-2xl overflow-hidden shadow-xs border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800 cursor-pointer group relative transition-all hover:shadow-md select-none"
                      title="Click to view full photo"
                    >
                      <img
                        src={activePhotoUrl}
                        alt={`${ev.title} - Photo ${currentIdx + 1}`}
                        className="w-full max-h-[360px] object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      />

                      {/* Multi-photo badge & counter at top-left */}
                      {allPosters.length > 1 && (
                        <div className="absolute top-2.5 left-2.5 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 hover:bg-black/85 text-white text-xs font-bold backdrop-blur-xs shadow-sm">
                          <ImageIcon className="w-3.5 h-3.5 text-purple-300" />
                          <span>{currentIdx + 1} / {allPosters.length}</span>
                        </div>
                      )}

                      {/* Previous / Next Arrows on Hover / Mobile */}
                      {allPosters.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActivePhotoIndexByEvent((prev) => ({
                                ...prev,
                                [ev.id]: (currentIdx - 1 + allPosters.length) % allPosters.length
                              }));
                            }}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-xs transition-all opacity-85 group-hover:opacity-100 shadow-md z-10 cursor-pointer active:scale-95"
                            title="Previous photo"
                          >
                            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActivePhotoIndexByEvent((prev) => ({
                                ...prev,
                                [ev.id]: (currentIdx + 1) % allPosters.length
                              }));
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-xs transition-all opacity-85 group-hover:opacity-100 shadow-md z-10 cursor-pointer active:scale-95"
                            title="Next photo"
                          >
                            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                          </button>
                        </>
                      )}

                      {/* Hover Overlay with Enlarge Badge */}
                      <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-black/80 text-white text-xs font-bold backdrop-blur-xs shadow-lg transform translate-y-1 group-hover:translate-y-0 transition-transform">
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>Click to view full photo</span>
                        </span>
                      </div>

                      {/* Pinned Expand Badge at Top-Right */}
                      <div className="absolute top-2.5 right-2.5 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs opacity-85 group-hover:opacity-100 transition-all shadow-sm">
                        <Maximize2 className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    {/* Interactive Thumbnail Strip for Multi-Photo Events */}
                    {allPosters.length > 1 && (
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 px-0.5">
                        {allPosters.map((pUrl, pIdx) => (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => setActivePhotoIndexByEvent((prev) => ({ ...prev, [ev.id]: pIdx }))}
                            className={`relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                              pIdx === currentIdx
                                ? 'border-purple-600 ring-2 ring-purple-300 dark:ring-purple-900 scale-105 shadow-sm'
                                : 'border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100'
                            }`}
                            title={`View Photo #${pIdx + 1}`}
                          >
                            <img src={pUrl} alt={`Thumbnail ${pIdx + 1}`} className="w-full h-full object-cover" />
                            {pIdx === 0 && (
                              <span className="absolute bottom-0 inset-x-0 bg-purple-700/85 text-[8px] text-white font-bold text-center leading-tight py-0.5">
                                Cover
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
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
                      {ev.isAllDay ? (
                        <span className="text-amber-800 dark:text-amber-300 font-bold bg-amber-50 dark:bg-amber-950/70 px-2 py-0.5 rounded-md text-[11px]">
                          ☀️ All-Day Event Schedule
                        </span>
                      ) : (
                        <span>{ev.endTime ? 'Time: ' : 'Starts '}{formatEventTime(ev, is12Hour) || 'TBA'}</span>
                      )}
                      {!ev.isAllDay && getEventTimeDurationLabel(ev.time, ev.endTime) && (
                        <span className="text-[11px] font-bold text-purple-600 dark:text-purple-300">
                          ({getEventTimeDurationLabel(ev.time, ev.endTime)})
                        </span>
                      )}
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

              {/* Registration / Ticket Period Card */}
              {regInfo.hasReg && (
                <div
                  className={`rounded-[26px] p-4.5 sm:p-5 shadow-2xs border transition-all ${
                    regInfo.status === 'open'
                      ? 'bg-gradient-to-br from-emerald-50/90 to-teal-50/70 dark:from-emerald-950/50 dark:to-teal-950/40 border-emerald-300/80 dark:border-emerald-700'
                      : regInfo.status === 'upcoming'
                      ? 'bg-gradient-to-br from-amber-50/90 to-yellow-50/70 dark:from-amber-950/50 dark:to-yellow-950/40 border-amber-300/80 dark:border-amber-700'
                      : 'bg-slate-50/90 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-2xs ${regInfo.badgeBg} ${regInfo.badgeText} ${regInfo.badgeBorder}`}>
                        <span className={`w-2 h-2 rounded-full ${
                          regInfo.status === 'open'
                            ? 'bg-emerald-500 animate-pulse'
                            : regInfo.status === 'upcoming'
                            ? 'bg-amber-500'
                            : 'bg-slate-400'
                        }`} />
                        <span>{regInfo.statusLabel}</span>
                      </span>

                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#1A3668] dark:text-white">
                        <Ticket className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span>Registration / Ticket Period</span>
                      </div>
                    </div>

                    {ev.registrationUrl && (
                      <a
                        href={ev.registrationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white shadow-xs transition-all cursor-pointer ${
                          regInfo.status === 'open'
                            ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'
                            : regInfo.status === 'upcoming'
                            ? 'bg-amber-600 hover:bg-amber-700'
                            : 'bg-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        <span>{regInfo.status === 'open' ? 'Register / Get Tickets Now' : 'Registration Link'}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs font-bold text-[#1A3668] dark:text-slate-200">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                      <span>{formatRegistrationSchedule(ev, is12Hour)}</span>
                    </div>

                    {ev.registrationNotes && (
                      <div className="text-[11px] font-semibold text-[#607494] dark:text-slate-400 bg-white/70 dark:bg-slate-800/70 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                        📌 {ev.registrationNotes}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Description & Translation for International Fans */}
              {ev.description && (() => {
                const isTranslating = translatingEventId === ev.id;
                const currentChecksum = computeTextChecksum(ev.description);
                const eventCache = translationsCache[ev.id];
                const isCacheValid = eventCache && eventCache._sourceChecksum === currentChecksum;
                const rawCached = isCacheValid ? eventCache?.[preferredTranslationLang] : undefined;
                const cachedTranslation =
                  rawCached &&
                  !rawCached.includes('QUERY LENGTH LIMIT') &&
                  !rawCached.startsWith('MYMEMORY WARNING')
                    ? rawCached
                    : undefined;
                const isShowingTranslated = Boolean(activeTranslationViews[ev.id] && cachedTranslation);
                const currentDisplayDescription = isShowingTranslated ? cachedTranslation : ev.description;
                const currentLangObj = TRANSLATION_LANGUAGES.find((l) => l.code === preferredTranslationLang);

                const isLongDescription = (currentDisplayDescription || '').length > 280 || (currentDisplayDescription || '').split('\n').length > 5;
                const isExpanded = Boolean(expandedDescriptions[ev.id]);

                return (
                  <div className="flex flex-col gap-1.5 flex-1">
                    <div className="flex items-center justify-between gap-2 px-1 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="block text-xs font-bold text-[#475569] dark:text-slate-400">
                          About Event
                        </span>
                        {isShowingTranslated && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            <span>{currentLangObj?.flag}</span>
                            <span>{currentLangObj?.name}</span>
                          </span>
                        )}
                      </div>

                      {/* Translation & View Controls Toolbar */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Target Language Dropdown */}
                        <div className="relative inline-flex items-center">
                          <select
                            value={preferredTranslationLang}
                            onChange={(e) => {
                              const newLang = e.target.value;
                              handleSelectTranslationLang(newLang);
                              if (activeTranslationViews[ev.id]) {
                                handleTranslateEventDescription(ev.id, ev.description || '', newLang);
                              }
                            }}
                            className="text-[11px] font-bold pl-2 pr-6 py-1 rounded-lg bg-white/95 dark:bg-slate-800 text-[#1A3668] dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-purple-400 appearance-none"
                            title="Choose target language for translation"
                          >
                            {TRANSLATION_LANGUAGES.map((lang) => (
                              <option key={lang.code} value={lang.code} className="dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                                {lang.flag} {lang.name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 pointer-events-none" />
                        </div>

                        {/* Translate / Toggle Button */}
                        {cachedTranslation ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleToggleTranslationView(ev.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 transition-colors cursor-pointer"
                              title={isShowingTranslated ? "View original notice text" : `Show ${currentLangObj?.name} translation`}
                            >
                              <Languages className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                              <span>{isShowingTranslated ? 'Show Original' : 'Show Translation'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleTranslateEventDescription(ev.id, ev.description || '', preferredTranslationLang, true)}
                              disabled={isTranslating}
                              className="p-1 rounded-lg bg-white/95 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
                              title="Re-translate / Refresh translation to fetch updated text and links"
                            >
                              <RotateCcw className={`w-3.5 h-3.5 ${isTranslating ? 'animate-spin text-purple-600' : ''}`} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleTranslateEventDescription(ev.id, ev.description || '')}
                            disabled={isTranslating}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
                            title={`Translate description to ${currentLangObj?.name || 'selected language'}`}
                          >
                            {isTranslating ? (
                              <>
                                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Translating...</span>
                              </>
                            ) : (
                              <>
                                <Languages className="w-3.5 h-3.5" />
                                <span>Translate</span>
                              </>
                            )}
                          </button>
                        )}

                        {/* Copy Description Button */}
                        <button
                          onClick={() => handleCopyTranslatedDescription(ev.id, currentDisplayDescription || '')}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold bg-white/95 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                          title="Copy text"
                        >
                          {copiedTranslationId === ev.id ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>

                        {/* Extended View Button */}
                        <button
                          type="button"
                          onClick={() => setDescriptionModalEvent(ev)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white/95 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-slate-700 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-slate-700 shadow-2xs transition-colors cursor-pointer"
                          title="Open full extended reader view"
                        >
                          <Maximize2 className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                          <span>Extended View</span>
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-50/90 dark:bg-slate-800/90 rounded-[24px] p-5 shadow-2xs border border-slate-200/80 dark:border-slate-700/80 text-xs sm:text-[13.5px] font-medium text-[#334155] dark:text-slate-200 leading-relaxed whitespace-pre-line flex-1 flex flex-col justify-between">
                      {isLongDescription && !isExpanded ? (
                        <div className="relative">
                          <div className="max-h-48 overflow-hidden">
                            {renderDescriptionTextWithLinks(currentDisplayDescription)}
                          </div>
                          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-50 via-slate-50/90 to-transparent dark:from-slate-800 dark:via-slate-800/90 flex items-end justify-between pt-6 px-1">
                            <button
                              type="button"
                              onClick={() => setExpandedDescriptions((prev) => ({ ...prev, [ev.id]: true }))}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-purple-700 dark:text-purple-300 bg-white dark:bg-slate-700 border border-purple-200 dark:border-purple-800 shadow-xs hover:bg-purple-50 dark:hover:bg-purple-950/60 cursor-pointer transition-all"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                              <span>Show Full Description</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDescriptionModalEvent(ev)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-xs cursor-pointer transition-all"
                              title="Open full distraction-free announcement reader"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                              <span>Extended View</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div>{renderDescriptionTextWithLinks(currentDisplayDescription)}</div>
                          {isLongDescription && isExpanded && (
                            <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => setExpandedDescriptions((prev) => ({ ...prev, [ev.id]: false }))}
                                className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                                <span>Show Less</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setDescriptionModalEvent(ev)}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 border border-purple-200 dark:border-purple-800 cursor-pointer"
                              >
                                <Maximize2 className="w-3.5 h-3.5" />
                                <span>Extended Reader</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Footer hint if translated */}
                      {isShowingTranslated && (
                        <div className="mt-3 pt-2.5 border-t border-purple-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-purple-700 dark:text-purple-300 font-semibold">
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-purple-500" />
                            <span>AI Translation ({currentLangObj?.name})</span>
                          </span>
                          <button
                            onClick={() => handleToggleTranslationView(ev.id)}
                            className="underline hover:text-purple-900 dark:hover:text-purple-200 cursor-pointer"
                          >
                            View original text
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
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
              {ev.hashtags && (() => {
                const tagList = ev.hashtags.split(/[\s,]+/).filter(Boolean);
                return (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <span className="block text-xs font-bold text-[#475569] dark:text-slate-400">
                          Hashtags
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300">
                          {tagList.length} {tagList.length === 1 ? 'tag' : 'tags'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyHashtags(ev.hashtags || '')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-slate-200 dark:border-slate-600 text-xs font-bold text-[#1A3668] dark:text-white shrink-0 transition-all cursor-pointer shadow-2xs hover:border-purple-300"
                        title="Copy all hashtags to clipboard"
                      >
                        {copiedHashtags ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-emerald-600 dark:text-emerald-400">Copied All!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                            <span>Copy All</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="bg-slate-50/90 dark:bg-slate-800/90 rounded-[22px] p-3.5 sm:p-4 shadow-2xs border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
                      <div className="flex flex-wrap gap-2 items-center">
                        {tagList.map((tag, tIdx) => {
                          const cleanTag = tag.startsWith('#') ? tag : `#${tag}`;
                          const isCopied = copiedIndividualTag === cleanTag;
                          return (
                            <button
                              key={tIdx}
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(cleanTag);
                                setCopiedIndividualTag(cleanTag);
                                showToast(`Copied ${cleanTag}!`);
                                setTimeout(() => setCopiedIndividualTag(null), 2000);
                              }}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer shadow-2xs group ${
                                isCopied
                                  ? 'bg-emerald-500 text-white border-emerald-500 scale-102 shadow-xs'
                                  : 'bg-white dark:bg-slate-700/90 text-[#1A3668] dark:text-slate-100 hover:text-purple-700 dark:hover:text-purple-300 border-slate-200 dark:border-slate-600 hover:border-purple-300 dark:hover:border-purple-500 hover:bg-purple-50/70 dark:hover:bg-purple-950/40 active:scale-97'
                              }`}
                              title={`Click to copy ${cleanTag}`}
                            >
                              {isCopied ? (
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              ) : (
                                <Hash className="w-3 h-3 text-purple-500 dark:text-purple-400 opacity-70 group-hover:opacity-100" />
                              )}
                              <span>{cleanTag.replace(/^#/, '')}</span>
                              <Copy className="w-2.5 h-2.5 opacity-0 group-hover:opacity-70 transition-opacity ml-0.5" />
                            </button>
                          );
                        })}
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400 font-semibold px-1">
                        <span>Click any hashtag to copy it individually</span>
                        <span className="text-[10px] opacity-75">Ready for Twitter/X & IG</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
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

      {/* Cloud Quota Notice Banner (if Firestore free daily quota is exceeded) */}
      {isQuotaExceeded && showQuotaBanner && (
        <div className={`${containerWidthClass} mb-3 px-3.5 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-3 shadow-2xs backdrop-blur-md`}>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold text-[11px] shrink-0">
              ☁️ Cloud Quota Notice
            </span>
            <span className="font-semibold text-xs leading-relaxed">
              Firestore free daily read limit reached for today (resets at midnight UTC). The app is seamlessly running in <strong>Local Storage Mode</strong> so you can continue viewing, creating, and editing events without interruption!
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://console.firebase.google.com/project/gen-lang-client-0451241322/firestore/databases/ai-studio-remixjimmyseaavo-4879c752-3bf2-455d-8b6f-4259853fbf24/data?openUpgradeDialog=true"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 font-bold text-amber-800 dark:text-amber-200 text-[11px] transition-colors"
            >
              Manage Quota ↗
            </a>
            <button
              onClick={() => setShowQuotaBanner(false)}
              className="p-1 rounded-lg hover:bg-amber-500/20 text-amber-800 dark:text-amber-200 cursor-pointer"
              title="Dismiss note"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* TOP TOOLBAR: BALANCED TWO-TIER RESPONSIVE LAYOUT FOR LAPTOP & MOBILE */}
      <div className={`${containerWidthClass} flex flex-col gap-2.5 mb-4`}>
        {/* ROW 1: Engagement & Stats on Left, User Display Preferences & Logins on Right */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 w-full">
          {/* Left Side: "Leave a message" (viewers), Inbox (admins/owner), Stats & Role Badge */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Leave a Message button: visible to everyone */}
            <button
              onClick={() => {
                openLeaveMessageModal();
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 text-[#1A3668] dark:text-slate-200 shadow-xs border border-slate-200/80 dark:border-slate-700 cursor-pointer transition-all active:scale-95"
              title={
                activeTab === 'projects'
                  ? 'Suggest a series, movie, MV, or endorsement project for Jimmy & Sea'
                  : activeTab === 'fanhub'
                  ? 'Submit a Fan Club directory listing or Food Support project'
                  : 'Know about an event we missed? Leave a note for Admins & Owner'
              }
            >
              {activeTab === 'projects' ? (
                <>
                  <Film className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Suggest a Project</span>
                </>
              ) : activeTab === 'fanhub' ? (
                <>
                  <HeartHandshake className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Submit Fan Club / Food Support</span>
                </>
              ) : (
                <>
                  <MessageSquare className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Leave a message</span>
                </>
              )}
            </button>

            {/* Wanna say thanks? button: quick direct way to send love & appreciation */}
            <button
              onClick={() => openLeaveMessageModal('thanks')}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full bg-rose-50/90 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 shadow-2xs border border-rose-200/80 dark:border-rose-800 cursor-pointer transition-all active:scale-95"
              title="Wanna say thanks? Leave a heartfelt note of appreciation for Jimmy, Sea, or the admins"
            >
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>Wanna say thanks?</span>
            </button>

            {/* Admin & Owner: Active Live Inbox with unread count badge (Visible only when logged in) */}
            {canEditEvents && (
              <button
                onClick={() => setInboxModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/70 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 shadow-xs border border-amber-200 dark:border-amber-800 cursor-pointer transition-all active:scale-95"
                title="Fan Messages Inbox (Admins & Owner)"
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

            {/* Today's Visits Stats (Admin & Owner Only) */}
            {canEditEvents && (
              <div
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-white/90 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 shadow-2xs select-none"
                title={`${visitorStats.todayVisits.toLocaleString()} visits today · ${visitorStats.totalVisits.toLocaleString()} all-time`}
              >
                <Users className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
                <span>{visitorStats.todayVisits.toLocaleString()} visits today</span>
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

          {/* Right Controls: Accent Selector, 12H/24H, Dark Mode, Cloud Sync, Reminders, and Visitor Logins */}
          <div className="flex items-center gap-2 flex-wrap ml-auto">
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

            {/* Quick Force Sync Button for other devices / mobile caches */}
            <button
              onClick={() => {
                if ('caches' in window) {
                  caches.keys().then((names) => {
                    names.forEach((name) => caches.delete(name));
                  });
                }
                const url = new URL(window.location.href);
                url.searchParams.set('_sync', Date.now().toString());
                window.location.replace(url.toString());
              }}
              className="p-2 rounded-full bg-white/90 dark:bg-slate-800 text-[#1A3668] dark:text-purple-300 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-xs border border-slate-200/80 dark:border-slate-700 cursor-pointer transition-all"
              title="Sync Latest Version across all devices (Clears local caches & reloads)"
              aria-label="Sync Latest Version"
            >
              <RefreshCw className="w-4 h-4 text-purple-600 dark:text-purple-400" />
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

            {/* Visitor Logins (shown when not logged in) */}
            {!canEditEvents && (
              <div className="flex items-center gap-2">
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

        {/* ROW 2: DEDICATED ADMIN & OWNER ACTION BAR (Appears only when Admin or Owner is logged in) */}
        {canEditEvents && (
          <div className="w-full flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-purple-200/50 dark:border-slate-700/60">
            {/* Left Tools: Management & Hub Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {isOwner ? (
                <>
                  <button
                    onClick={openSettingsModal}
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 text-[#1A3668] dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-slate-700 shadow-xs border border-purple-100 dark:border-slate-700 transition-all cursor-pointer"
                    title="Customize Hub Header, Greeting & Members"
                  >
                    <Settings className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Customize</span>
                  </button>

                  <button
                    onClick={() => setBackupModalOpen(true)}
                    className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-full bg-white/90 dark:bg-slate-800 text-[#1A3668] dark:text-slate-200 hover:bg-sky-50 shadow-xs border border-slate-200/80 dark:border-slate-700 cursor-pointer"
                    title="Backup or Import Schedule"
                  >
                    <Download className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    <span>Backup</span>
                  </button>

                  <button
                    onClick={() => setAuditModalOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-white/90 dark:bg-slate-800 text-[#1A3668] dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/60 shadow-xs border border-slate-200/80 dark:border-slate-700 cursor-pointer transition-all"
                    title="View Log In & Activity Audit History"
                  >
                    <ClipboardList className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Activity History</span>
                  </button>

                  <button
                    onClick={() => openChangePasswordModal()}
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-white/90 dark:bg-slate-800 text-[#1A3668] dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/60 shadow-xs border border-slate-200/80 dark:border-slate-700 cursor-pointer transition-all"
                    title="Change Account Password"
                  >
                    <Key className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Password</span>
                  </button>

                  <button
                    onClick={() => setAdminAccountsModalOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-white/90 dark:bg-slate-800 text-[#1A3668] dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/60 shadow-xs border border-slate-200/80 dark:border-slate-700 cursor-pointer transition-all"
                    title="Manage Registered Admin Accounts"
                  >
                    <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Admins ({registeredAdmins.length})</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setAuditModalOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-white/90 dark:bg-slate-800 text-[#1A3668] dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/60 shadow-xs border border-slate-200/80 dark:border-slate-700 cursor-pointer transition-all"
                    title="View Log In & Activity Audit History"
                  >
                    <ClipboardList className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Activity History</span>
                  </button>

                  <button
                    onClick={() => openChangePasswordModal()}
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-white/90 dark:bg-slate-800 text-[#1A3668] dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/60 shadow-xs border border-slate-200/80 dark:border-slate-700 cursor-pointer transition-all"
                    title="Change Admin Password"
                  >
                    <Key className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Password</span>
                  </button>
                </>
              )}
            </div>

            {/* Right Tools: Primary Action "+ Add Event" & Logout Button */}
            <div className="flex items-center gap-2 flex-wrap ml-auto">
              <button
                onClick={() => openAddEventModal(selectedDateStr)}
                style={{ backgroundColor: currentAccent.colorHex }}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded-full text-white shadow-xs transition-all cursor-pointer active:scale-95 hover:opacity-90"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add Event</span>
              </button>

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 border border-slate-200/80 dark:border-slate-700 cursor-pointer transition-colors"
                title={isOwner ? 'Exit Owner Mode' : 'Exit Admin Mode'}
              >
                {isOwner ? <Lock className="w-3.5 h-3.5" /> : <LogOut className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 1. SEPARATED BANNER PHOTO CONTAINER (AUTO FIT & SIZING)        */}
      {/* ============================================================== */}
      <div className={`${containerWidthClass} mb-4`}>
        {(() => {
          const currentHeight = settings.bannerHeight || 'medium';
          const heightClass =
            currentHeight === 'compact'
              ? 'h-44 sm:h-56 md:h-64 lg:h-72 xl:h-80'
              : currentHeight === 'tall'
              ? 'h-64 sm:h-84 md:h-[420px] lg:h-[480px] xl:h-[540px] 2xl:h-[620px]'
              : currentHeight === 'auto'
              ? 'h-56 sm:h-72 md:h-84 lg:h-96 xl:h-[440px] 2xl:h-[500px]'
              : 'h-52 sm:h-68 md:h-80 lg:h-96 xl:h-[420px] 2xl:h-[480px]'; // medium default

          const activePhoto =
            activeBannerPhotos.length > 0
              ? activeBannerPhotos[currentBannerIndex % activeBannerPhotos.length]
              : settings.bannerImageUrl;

          const isContain = settings.bannerFit === 'contain';

          return (
            <div
              onClick={() => {
                if (activePhoto) {
                  setEnlargedPhoto({ url: activePhoto, title: settings.bannerTitle || 'Official Hub Banner' });
                }
              }}
              className={`relative w-full ${heightClass} rounded-[28px] overflow-hidden shadow-sm border-2 border-white/80 dark:border-slate-800 bg-slate-200 dark:bg-slate-800 group ${
                activePhoto ? 'cursor-pointer' : ''
              }`}
              title={activePhoto ? 'Click to view full banner photo' : undefined}
            >
              {activePhoto ? (
                isContain ? (
                  /* Contain Mode: Full photo shown with soft blurred ambient backdrop */
                  <div className="relative w-full h-full overflow-hidden flex items-center justify-center bg-slate-900/90 dark:bg-slate-950">
                    <img
                      src={activePhoto}
                      alt="Ambient banner backdrop"
                      className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-50 scale-125 saturate-150 pointer-events-none"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none z-5" />
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
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentBannerIndex((prev) =>
                        prev === 0 ? activeBannerPhotos.length - 1 : prev - 1
                      );
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs transition-all cursor-pointer"
                    title="Previous Photo"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentBannerIndex((prev) =>
                        (prev + 1) % activeBannerPhotos.length
                      );
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs transition-all cursor-pointer"
                    title="Next Photo"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* Dot Indicators */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-xs"
                  >
                    {activeBannerPhotos.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentBannerIndex(idx);
                        }}
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
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setBannerPhotosModalOpen(true);
                    }}
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
      <div className={`${containerWidthClass} mb-6`}>
        <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-md rounded-[28px] p-5 sm:p-6 shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col gap-4">
          {/* Top Row: Title, Badges, Greeting & Owner Quick Actions */}
          <div className={`flex flex-col md:flex-row gap-4 ${
            (settings.headerAlignment || 'left') === 'center'
              ? 'items-center justify-between'
              : (settings.headerAlignment || 'left') === 'right'
              ? 'items-start md:items-center justify-between'
              : 'items-start md:items-center justify-between'
          }`}>
            <div className={`flex flex-col flex-1 w-full ${
              (settings.headerAlignment || 'left') === 'center'
                ? 'items-center text-center mx-auto'
                : (settings.headerAlignment || 'left') === 'right'
                ? 'items-end text-right'
                : 'items-start text-left'
            }`}>
              <div className={`flex items-center gap-2 mb-1.5 flex-wrap ${
                (settings.headerAlignment || 'left') === 'center'
                  ? 'justify-center'
                  : (settings.headerAlignment || 'left') === 'right'
                  ? 'justify-end'
                  : 'justify-start'
              }`}>
                <TrioBadges members={settings.members} size="sm" />
                <span className={`${greetingSizeClass} font-semibold text-[#607494] dark:text-slate-400`}>
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
              <div className={`flex items-center gap-2 shrink-0 ${
                (settings.headerAlignment || 'left') === 'center'
                  ? 'self-center md:self-center'
                  : (settings.headerAlignment || 'left') === 'right'
                  ? 'self-end md:self-center'
                  : 'self-start md:self-center'
              }`}>
                <button
                  onClick={() => openChangePasswordModal()}
                  className="px-3 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#1A3668] dark:text-white text-xs font-bold shadow-xs cursor-pointer transition-all flex items-center gap-1.5 border border-slate-200/80 dark:border-slate-700"
                  title="Change Account Password"
                >
                  <Key className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span className="hidden sm:inline">Password</span>
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
        <div className={`${containerWidthClass} flex flex-col lg:flex-row lg:items-start items-start justify-center gap-6 xl:gap-8`}>
          {/* LEFT COLUMN: Calendar Card (Self-start & Natural Height, Never Stretched!) */}
          <div className="w-full lg:w-[480px] xl:w-[540px] 2xl:w-[600px] shrink-0 flex flex-col gap-5 self-start order-1">
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
                    title={`Jump to Today (${todayDateStr} · ${userLocalTimezone})`}
                    className="h-10 sm:h-11 px-4 sm:px-5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all shadow-2xs text-xs sm:text-sm font-black text-[#1A3668] dark:text-white cursor-pointer inline-flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                    <span>Today</span>
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
                        return <div key={`empty-${cIdx}`} className="h-[68px] sm:h-[78px] md:h-[86px]" />;
                      }

                      const isSelected = cell.dateStr === selectedDateStr;
                      const isToday = cell.dateStr === todayDateStr;
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
                          className={`flex flex-col items-center justify-start py-1 px-0.5 sm:px-1 group cursor-pointer focus:outline-none min-h-[68px] sm:min-h-[78px] md:min-h-[86px] rounded-2xl transition-all relative ${
                            isToday
                              ? 'bg-[#E0F2FE] dark:bg-sky-950/70 border-2 border-sky-300 dark:border-sky-600 shadow-xs'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 border-2 border-transparent'
                          }`}
                        >
                          {/* Today Micro Label */}
                          {isToday && (
                            <span className="text-[8px] font-black uppercase tracking-wider text-sky-700 dark:text-sky-300 -mt-0.5 mb-0.5">
                              TODAY
                            </span>
                          )}

                          {/* Day Number Badge: Purple if Selected, Blue if Today (when another date is selected), Default otherwise */}
                          <div
                            style={isSelected ? { backgroundColor: currentAccent.colorHex } : {}}
                            className={`w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center text-sm sm:text-base md:text-lg transition-all ${
                              isSelected
                                ? 'text-white font-black shadow-lg scale-105 ring-3 ring-purple-400/40'
                                : isToday
                                  ? 'bg-sky-500 dark:bg-sky-600 text-white font-black shadow-xs ring-2 ring-sky-300 dark:ring-sky-500'
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
                  {selectedDayEvents.map((evItem) => {
                    const firstMember = evItem.members && evItem.members[0] ? getMemberById(evItem.members[0]) : null;
                    return (
                      <button
                        key={evItem.id}
                        onClick={() => setSelectedDayActiveEventId(evItem.id)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                          selectedDayActiveEventId === evItem.id
                            ? 'bg-[#1A3668] text-white border-[#1A3668] dark:bg-purple-600 dark:border-purple-600 shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-[#526586] dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {firstMember && <span className="leading-none">{firstMember.emoji}</span>}
                        <span>{formatEventTime(evItem, is12Hour) || 'TBA'}</span>
                        <span>·</span>
                        <span className="max-w-[130px] truncate">{evItem.title}</span>
                        {evItem.members && evItem.members.length === 1 && firstMember && (
                          <span className="text-[10px] opacity-85 font-semibold">({firstMember.name})</span>
                        )}
                      </button>
                    );
                  })}
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
      ) : activeTab === 'list' ? (
        /* DEDICATED FULL-WIDTH CENTERED LIST VIEW: Auto-adjusts to screen size */
        <div className={`${containerWidthClass} flex flex-col gap-5`}>
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

          {/* List View Filter Tabs & Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2">
            {/* Filter Pills */}
            <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xs self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setListViewFilter('upcoming')}
                style={listViewFilter === 'upcoming' ? { backgroundColor: currentAccent.colorHex } : {}}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  listViewFilter === 'upcoming'
                    ? 'text-white shadow-xs'
                    : 'text-[#526586] dark:text-slate-400 hover:text-[#1A3668] dark:hover:text-white'
                }`}
              >
                Upcoming & Today ({upcomingCount})
              </button>
              <button
                type="button"
                onClick={() => setListViewFilter('past')}
                style={listViewFilter === 'past' ? { backgroundColor: currentAccent.colorHex } : {}}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  listViewFilter === 'past'
                    ? 'text-white shadow-xs'
                    : 'text-[#526586] dark:text-slate-400 hover:text-[#1A3668] dark:hover:text-white'
                }`}
              >
                Past Concluded ({pastCount})
              </button>
              <button
                type="button"
                onClick={() => setListViewFilter('all')}
                style={listViewFilter === 'all' ? { backgroundColor: currentAccent.colorHex } : {}}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  listViewFilter === 'all'
                    ? 'text-white shadow-xs'
                    : 'text-[#526586] dark:text-slate-400 hover:text-[#1A3668] dark:hover:text-white'
                }`}
              >
                All ({allCount})
              </button>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-xs font-bold text-[#607494] dark:text-slate-400">
                {listViewFilter === 'upcoming'
                  ? `${listViewEvents.length} Active`
                  : listViewFilter === 'past'
                  ? `${listViewEvents.length} Concluded`
                  : `${listViewEvents.length} Total`}
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
          </div>

          {listViewEvents.length === 0 ? (
            <div className="bg-white/95 dark:bg-slate-900/90 rounded-[28px] shadow-xs py-14 px-6 flex flex-col items-center justify-center text-center border border-slate-200/80 dark:border-slate-800">
              <TrioBadges members={settings.members} size="lg" />
              <h3 className="text-lg font-bold text-[#1A3668] dark:text-white mt-3 mb-1">
                {searchQuery
                  ? 'No matching events found'
                  : listViewFilter === 'upcoming'
                  ? 'No upcoming events scheduled'
                  : listViewFilter === 'past'
                  ? 'No past concluded events'
                  : 'No events found'}
              </h3>
              <p className="text-xs sm:text-sm font-medium text-[#607494] dark:text-slate-400 mb-4 max-w-sm">
                {searchQuery
                  ? 'Try searching another keyword or adjusting your member filters'
                  : listViewFilter === 'upcoming'
                  ? 'Past events are hidden once concluded. Switch to "Past Concluded" to review event history, or add a new upcoming event!'
                  : listViewFilter === 'past'
                  ? 'No past events found in the schedule archive.'
                  : 'Add events to populate the schedule list.'}
              </p>
              <div className="flex items-center gap-2">
                {listViewFilter === 'upcoming' && pastCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setListViewFilter('past')}
                    className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 dark:text-purple-300 px-4 py-2 rounded-full border border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 cursor-pointer transition-colors"
                  >
                    <span>View Past Concluded ({pastCount})</span>
                  </button>
                )}
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
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {listViewEvents.map((ev) => renderFullEventCard(ev))}
            </div>
          )}
        </div>
      ) : activeTab === 'projects' ? (
        /* ============================================================== */
        /* PROJECTS HUB: SHOWS, MOVIES, MUSIC VIDEOS & BRANDS             */
        /* ============================================================== */
        <ProjectsHub
          projects={careerProjects}
          canEdit={canEditEvents}
          isOwner={isOwner}
          currentAccent={currentAccent}
          containerWidthClass={containerWidthClass}
          activeMemberIds={activeMemberIds}
          preferredTranslationLang={preferredTranslationLang}
          onSelectTranslationLang={handleSelectTranslationLang}
          onSaveProject={handleSaveCareerProject}
          onDeleteProject={handleDeleteCareerProject}
          showToast={showToast}
        />
      ) : (
        /* ============================================================== */
        /* FAN HUB: FAN CLUBS DIRECTORY & FOOD SUPPORT PROJECTS           */
        /* ============================================================== */
        <FanHub
          fanClubs={fanClubs}
          foodProjects={foodProjects}
          canEdit={canEditEvents}
          isOwner={isOwner}
          events={events}
          currentAccent={currentAccent}
          containerWidthClass={containerWidthClass}
          activeSubTab={fanHubSubTab}
          onSubTabChange={setFanHubSubTab}
          onSaveFanClub={handleSaveFanClub}
          onDeleteFanClub={handleDeleteFanClub}
          onSaveFoodProject={handleSaveFoodProject}
          onDeleteFoodProject={handleDeleteFoodProject}
          showToast={showToast}
          activeMemberIds={activeMemberIds}
        />
      )}

      {/* ============================================================== */}
      {/* FLOATING NAVIGATION DOCKS                                      */}
      {/* Bubble 1: Schedule (Calendar / List)                           */}
      {/* Bubble 2: Projects (Shows, Movies, MVs, Brands) - Between!     */}
      {/* Bubble 3: Fan Hub (Fan Clubs / Food Support)                   */}
      {/* ============================================================== */}
      <div className="fixed bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 sm:gap-3 max-w-[calc(100vw-16px)] justify-center flex-wrap sm:flex-nowrap pointer-events-none">
        {/* Bubble 1: Schedule Navigation (Calendar / List) with Purple, Blue & Green Gradient */}
        <div className="p-[2.5px] rounded-full bg-gradient-to-r from-purple-500 via-sky-500 to-emerald-400 shadow-xl shadow-purple-500/20 pointer-events-auto shrink-0 transition-transform hover:scale-[1.02]">
          <div
            className={`backdrop-blur-xl p-1 sm:p-1.5 rounded-full flex items-center gap-1 transition-colors ${
              isDarkMode
                ? 'bg-gradient-to-r from-purple-950/80 via-slate-900/95 to-emerald-950/80 border border-purple-500/30 shadow-lg'
                : 'bg-gradient-to-r from-purple-50/95 via-sky-50/95 to-emerald-50/95 border border-white/90 shadow-lg shadow-purple-500/15'
            }`}
          >
            <button
              onClick={() => setActiveTab('calendar')}
              className={`inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-[13px] font-bold transition-all cursor-pointer ${
                activeTab === 'calendar'
                  ? 'bg-gradient-to-r from-purple-600 via-sky-500 to-emerald-500 text-white shadow-md shadow-purple-500/25'
                  : isDarkMode
                  ? 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  : 'text-[#3B4D6B] hover:text-[#1A3668] hover:bg-white/80'
              }`}
              title="View Calendar schedule"
            >
              <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
              <span>Calendar</span>
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-[13px] font-bold transition-all cursor-pointer ${
                activeTab === 'list'
                  ? 'bg-gradient-to-r from-purple-600 via-sky-500 to-emerald-500 text-white shadow-md shadow-purple-500/25'
                  : isDarkMode
                  ? 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  : 'text-[#3B4D6B] hover:text-[#1A3668] hover:bg-white/80'
              }`}
              title="View List schedule"
            >
              <ListIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
              <span>List</span>
            </button>
          </div>
        </div>

        {/* Bubble 2: Projects Navigation with Purple, Blue & Green Gradient */}
        <div className="p-[2.5px] rounded-full bg-gradient-to-r from-purple-500 via-sky-500 to-emerald-400 shadow-xl shadow-purple-500/20 pointer-events-auto shrink-0 transition-transform hover:scale-[1.02]">
          <div
            className={`backdrop-blur-xl p-1 sm:p-1.5 rounded-full flex items-center gap-1 transition-colors ${
              isDarkMode
                ? 'bg-gradient-to-r from-purple-950/80 via-slate-900/95 to-emerald-950/80 border border-purple-500/30 shadow-lg'
                : 'bg-gradient-to-r from-purple-50/95 via-sky-50/95 to-emerald-50/95 border border-white/90 shadow-lg shadow-purple-500/15'
            }`}
          >
            <button
              onClick={() => setActiveTab('projects')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-[13px] font-bold transition-all cursor-pointer ${
                activeTab === 'projects'
                  ? 'bg-gradient-to-r from-purple-600 via-sky-500 to-emerald-500 text-white shadow-md shadow-purple-500/25'
                  : isDarkMode
                  ? 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  : 'text-[#3B4D6B] hover:text-[#1A3668] hover:bg-white/80'
              }`}
              title="Jimmy, Sea & Avocean Shows, Movies, MVs, Partner Brands & Owned Brands"
            >
              <Film className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
              <span>Projects</span>
            </button>
          </div>
        </div>

        {/* Bubble 3: Fan Hub Navigation (Fan Clubs / Food Support) with Purple, Blue & Green Gradient */}
        <div className="p-[2.5px] rounded-full bg-gradient-to-r from-purple-500 via-sky-500 to-emerald-400 shadow-xl shadow-purple-500/20 pointer-events-auto shrink-0 transition-transform hover:scale-[1.02]">
          <div
            className={`backdrop-blur-xl p-1 sm:p-1.5 rounded-full flex items-center gap-1 transition-colors ${
              isDarkMode
                ? 'bg-gradient-to-r from-purple-950/80 via-slate-900/95 to-emerald-950/80 border border-purple-500/30 shadow-lg'
                : 'bg-gradient-to-r from-purple-50/95 via-sky-50/95 to-emerald-50/95 border border-white/90 shadow-lg shadow-purple-500/15'
            }`}
          >
            <button
              onClick={() => {
                setActiveTab('fanhub');
                setFanHubSubTab('directory');
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-[13px] font-bold transition-all cursor-pointer ${
                activeTab === 'fanhub' && fanHubSubTab === 'directory'
                  ? 'bg-gradient-to-r from-purple-600 via-sky-500 to-emerald-500 text-white shadow-md shadow-purple-500/25'
                  : isDarkMode
                  ? 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  : 'text-[#3B4D6B] hover:text-[#1A3668] hover:bg-white/80'
              }`}
              title="JimmySea Fan Clubs Directory"
            >
              <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
              <span>Fan Clubs</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('fanhub');
                setFanHubSubTab('foodsupport');
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-[13px] font-bold transition-all cursor-pointer ${
                activeTab === 'fanhub' && fanHubSubTab === 'foodsupport'
                  ? 'bg-gradient-to-r from-purple-600 via-sky-500 to-emerald-500 text-white shadow-md shadow-purple-500/25'
                  : isDarkMode
                  ? 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  : 'text-[#3B4D6B] hover:text-[#1A3668] hover:bg-white/80'
              }`}
              title="Fan Food Support & Catering Projects"
            >
              <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
              <span>Food Support</span>
            </button>
          </div>
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
                      {formatEventTime(reminderEvent, is12Hour) || 'TBA'}
                    </span>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-[11px] text-purple-700 dark:text-purple-300 font-bold block">Your converted local time:</span>
                    <span className="font-extrabold text-[#7C3AED] dark:text-purple-300 text-sm">
                      {reminderConversion.end
                        ? `${reminderConversion.start.time} – ${reminderConversion.end.time} ${reminderUserTz}`
                        : `${reminderConversion.start.time} ${reminderUserTz}`}
                    </span>
                    {reminderConversion.start.dayShift && (
                      <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold ml-1">
                        {reminderConversion.start.dayShift}
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
          <div className={`bg-white dark:bg-slate-900 rounded-[28px] shadow-xl w-full ${isExtendedDescEditor ? 'max-w-2xl' : 'max-w-lg'} p-5 sm:p-6 transition-all duration-200 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto border border-slate-100 dark:border-slate-800`}>
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

              {/* Time & Timezone Selection with Start Time, End Time, Scroll Wheel & All-Day Event Toggle */}
              <div>
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <label className="text-xs font-bold text-[#526586] dark:text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Time & Timezone ({is12Hour ? '12-Hour AM/PM' : '24-Hour'})</span>
                  </label>

                  <div className="flex items-center gap-2">
                    {/* All-Day Event Toggle Checkbox */}
                    <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800 text-amber-900 dark:text-amber-300 cursor-pointer select-none hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors">
                      <input
                        type="checkbox"
                        checked={formIsAllDay}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormIsAllDay(checked);
                          if (checked) {
                            setShowTimeAdjuster(false);
                          }
                        }}
                        className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                      <span className="text-xs font-bold">☀️ All-Day Event</span>
                    </label>

                    {!formIsAllDay && (
                      <button
                        type="button"
                        onClick={() => setShowTimeAdjuster(!showTimeAdjuster)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 cursor-pointer"
                      >
                        <SlidersHorizontal className="w-3 h-3" />
                        <span>{showTimeAdjuster ? 'Hide Wheel' : 'Open Scroll Wheel'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {formIsAllDay ? (
                  <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/70 text-amber-600 dark:text-amber-300 flex items-center justify-center text-base font-bold shrink-0">
                        ☀️
                      </span>
                      <div>
                        <span className="font-bold text-amber-900 dark:text-amber-200 block text-xs sm:text-sm">
                          All-Day Event Schedule Active
                        </span>
                        <span className="text-amber-700 dark:text-amber-300/80 text-[11px]">
                          This event runs throughout the entire day without fixed start or end hours.
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormIsAllDay(false)}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-xs font-bold hover:bg-amber-50 cursor-pointer shrink-0"
                    >
                      Set specific time
                    </button>
                  </div>
                ) : (
                  <>
                {/* Start Time, End Time & Timezone Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  {/* Start Time Input */}
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Start Time *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formTime}
                        onFocus={() => setTimeAdjusterTarget('start')}
                        onChange={(e) => {
                          setFormTime(e.target.value);
                          setTimeAdjusterTarget('start');
                        }}
                        placeholder={is12Hour ? 'e.g. 6:00 PM' : 'e.g. 18:00'}
                        className={`w-full rounded-xl border bg-white dark:bg-slate-800 pl-3 pr-8 py-2 text-xs sm:text-sm font-semibold text-[#1A3668] dark:text-white focus:outline-none transition-colors ${
                          timeAdjusterTarget === 'start' && showTimeAdjuster
                            ? 'border-purple-500 ring-1 ring-purple-300/40'
                            : 'border-slate-200 dark:border-slate-700'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setTimeAdjusterTarget('start');
                          setShowTimeAdjuster(true);
                        }}
                        title="Adjust Start Time with Scroll Wheel"
                        className={`absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer p-0.5 transition-colors ${
                          timeAdjusterTarget === 'start' && showTimeAdjuster
                            ? 'text-purple-600 dark:text-purple-400'
                            : 'text-slate-400 hover:text-purple-600'
                        }`}
                      >
                        <Clock className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* End Time Input (Optional) */}
                  <div className="sm:col-span-4">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        End Time (Optional)
                      </label>
                      {formEndTime && (
                        <button
                          type="button"
                          onClick={() => setFormEndTime('')}
                          className="text-[10px] font-bold text-rose-500 hover:text-rose-700 cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={formEndTime}
                        onFocus={() => setTimeAdjusterTarget('end')}
                        onChange={(e) => {
                          setFormEndTime(e.target.value);
                          setTimeAdjusterTarget('end');
                        }}
                        placeholder={is12Hour ? 'e.g. 8:00 PM' : 'e.g. 20:00'}
                        className={`w-full rounded-xl border bg-white dark:bg-slate-800 pl-3 pr-8 py-2 text-xs sm:text-sm font-semibold text-[#1A3668] dark:text-white focus:outline-none transition-colors ${
                          timeAdjusterTarget === 'end' && showTimeAdjuster
                            ? 'border-purple-500 ring-1 ring-purple-300/40'
                            : 'border-slate-200 dark:border-slate-700'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setTimeAdjusterTarget('end');
                          setShowTimeAdjuster(true);
                          if (!formEndTime) {
                            handleSetEndDuration(2);
                          }
                        }}
                        title="Adjust End Time with Scroll Wheel"
                        className={`absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer p-0.5 transition-colors ${
                          timeAdjusterTarget === 'end' && showTimeAdjuster
                            ? 'text-purple-600 dark:text-purple-400'
                            : 'text-slate-400 hover:text-purple-600'
                        }`}
                      >
                        <Clock className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Timezone Dropdown */}
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Timezone
                    </label>
                    <select
                      value={formTimezone}
                      onChange={(e) => setFormTimezone(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-2 text-xs font-bold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400 cursor-pointer"
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
                </div>

                {/* Interactive Time Scroll Wheel & Stepper with Start/End Target Switcher */}
                {showTimeAdjuster && (
                  <div className="mt-2.5 p-3 sm:p-3.5 rounded-2xl bg-purple-50/70 dark:bg-slate-800/80 border border-purple-100 dark:border-slate-700 animate-in fade-in duration-150">
                    {/* Top Switcher: Which time is being adjusted with the wheel */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-purple-100 dark:border-slate-700">
                      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/90 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs">
                        <button
                          type="button"
                          onClick={() => setTimeAdjusterTarget('start')}
                          className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            timeAdjusterTarget === 'start'
                              ? 'bg-purple-600 text-white shadow-2xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-purple-600'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>Start: {formatTime12h(formTime)}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTimeAdjusterTarget('end');
                            if (!formEndTime) handleSetEndDuration(2);
                          }}
                          className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            timeAdjusterTarget === 'end'
                              ? 'bg-purple-600 text-white shadow-2xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-purple-600'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>End: {formEndTime ? formatTime12h(formEndTime) : 'Set End'}</span>
                        </button>
                      </div>

                      {/* Quick Duration Buttons (Set end time relative to start time) */}
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mr-0.5">
                          Set Duration:
                        </span>
                        {[1, 1.5, 2, 3, 4].map((hrs) => (
                          <button
                            key={hrs}
                            type="button"
                            onClick={() => handleSetEndDuration(hrs)}
                            className="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-white dark:bg-slate-700 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-slate-200 dark:border-slate-600 text-[#1A3668] dark:text-white cursor-pointer shadow-2xs active:scale-95 transition-all"
                            title={`Set end time to +${hrs} hr${hrs > 1 ? 's' : ''} after start time`}
                          >
                            +{hrs}h
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="text-center mb-1 text-[11px] font-semibold text-purple-700 dark:text-purple-300">
                      Adjusting <strong>{timeAdjusterTarget === 'start' ? 'Start Time' : 'End Time'}</strong>: Roll mouse wheel or click up/down
                    </div>

                    <div className="flex items-center justify-center gap-3 select-none py-1">
                      {/* HOUR WHEEL & STEPPER */}
                      <div className="flex flex-col items-center">
                        <button
                          type="button"
                          onClick={() => handleAdjustHour(1)}
                          className="w-10 h-6 rounded-t-lg bg-white dark:bg-slate-700 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-200 cursor-pointer active:scale-95 transition-all shadow-2xs"
                          title="Increase Hour (or roll mouse wheel up)"
                        >
                          <ChevronUp className="w-4 h-4 stroke-[2.5]" />
                        </button>
                        <div
                          onWheel={(e) => {
                            e.preventDefault();
                            handleAdjustHour(e.deltaY < 0 ? 1 : -1);
                          }}
                          className="w-14 h-12 bg-white dark:bg-slate-900 border-x border-slate-200 dark:border-slate-600 flex flex-col items-center justify-center cursor-ns-resize shadow-inner group transition-colors hover:border-purple-400"
                          title="Roll mouse wheel here to scroll hour"
                        >
                          <span className="text-xl font-black text-[#1A3668] dark:text-white leading-none">
                            {is12Hour ? adjHour12 : String(adjHour24).padStart(2, '0')}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                            Hour
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAdjustHour(-1)}
                          className="w-10 h-6 rounded-b-lg bg-white dark:bg-slate-700 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-200 cursor-pointer active:scale-95 transition-all shadow-2xs"
                          title="Decrease Hour (or roll mouse wheel down)"
                        >
                          <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      </div>

                      <span className="text-2xl font-black text-slate-400 dark:text-slate-500 pb-2">:</span>

                      {/* MINUTE WHEEL & STEPPER */}
                      <div className="flex flex-col items-center">
                        <button
                          type="button"
                          onClick={() => handleAdjustMinute(5)}
                          className="w-10 h-6 rounded-t-lg bg-white dark:bg-slate-700 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-200 cursor-pointer active:scale-95 transition-all shadow-2xs"
                          title="+5 Minutes (or roll mouse wheel up)"
                        >
                          <ChevronUp className="w-4 h-4 stroke-[2.5]" />
                        </button>
                        <div
                          onWheel={(e) => {
                            e.preventDefault();
                            handleAdjustMinute(e.deltaY < 0 ? 5 : -5);
                          }}
                          className="w-14 h-12 bg-white dark:bg-slate-900 border-x border-slate-200 dark:border-slate-600 flex flex-col items-center justify-center cursor-ns-resize shadow-inner group transition-colors hover:border-purple-400"
                          title="Roll mouse wheel here to scroll minutes"
                        >
                          <span className="text-xl font-black text-[#1A3668] dark:text-white leading-none">
                            {String(adjMinute).padStart(2, '0')}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                            Min
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAdjustMinute(-5)}
                          className="w-10 h-6 rounded-b-lg bg-white dark:bg-slate-700 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-200 cursor-pointer active:scale-95 transition-all shadow-2xs"
                          title="-5 Minutes (or roll mouse wheel down)"
                        >
                          <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      </div>

                      {/* AM / PM SELECTOR (Only rendered in 12-Hour mode) */}
                      {is12Hour && (
                        <div className="flex flex-col gap-1.5 ml-2">
                          <button
                            type="button"
                            onClick={() => handleSetAmPm('AM')}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                              adjPeriod === 'AM'
                                ? 'bg-purple-600 text-white shadow-xs scale-105'
                                : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-purple-50'
                            }`}
                          >
                            AM
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetAmPm('PM')}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                              adjPeriod === 'PM'
                                ? 'bg-purple-600 text-white shadow-xs scale-105'
                                : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-purple-50'
                            }`}
                          >
                            PM
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Quick Preset Pills */}
                    <div className="mt-3 pt-2.5 border-t border-purple-100 dark:border-slate-700">
                      <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                        Quick Times for {timeAdjusterTarget === 'start' ? 'Start' : 'End'}:
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {(is12Hour
                          ? ['10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:30 PM']
                          : ['10:00', '12:00', '14:00', '16:00', '18:00', '19:00', '20:00', '21:30']
                        ).map((preset) => {
                          const activeVal = timeAdjusterTarget === 'start' ? formTime : formEndTime;
                          return (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setTargetTimeValue(preset)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                                activeVal.toLowerCase().startsWith(preset.toLowerCase())
                                  ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                                  : 'bg-white dark:bg-slate-700 text-[#1A3668] dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:bg-purple-50'
                              }`}
                            >
                              {preset}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Live Formatted Summary Line */}
                {(formTime || formEndTime) && (
                  <div className="mt-2 text-[11.5px] font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-2 px-1 flex-wrap">
                    <Clock className="w-3.5 h-3.5 shrink-0 text-purple-600 dark:text-purple-400" />
                    <span>
                      Displays as:{' '}
                      <strong className="font-extrabold text-[#1A3668] dark:text-white">
                        {formatTime12h(formTime)}
                        {formEndTime ? ` – ${formatTime12h(formEndTime)}` : ''}{' '}
                        {formTimezone !== 'CUSTOM' ? formTimezone : customTimezone || 'UTC'}
                      </strong>
                    </span>
                    {getEventTimeDurationLabel(formTime, formEndTime) && (
                      <span className="text-[10px] font-extrabold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                        ✨ {getEventTimeDurationLabel(formTime, formEndTime)}
                      </span>
                    )}
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
                  </>
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

              {/* Event Posters & Photo Media Manager (Supports Multiple Posters & Photos) */}
              <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-200/80 dark:bg-purple-900/80 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                      <FileImage className="w-4 h-4" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#1A3668] dark:text-white flex items-center gap-1.5">
                        <span>Event Posters & Photo Media</span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/80 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-800">
                          {formPosterUrls.length} {formPosterUrls.length === 1 ? 'photo' : 'photos'}
                        </span>
                      </label>
                      <p className="text-[10.5px] font-medium text-[#607494] dark:text-slate-400">
                        Add promotional posters, seating maps, schedule infographics, or benefits charts.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setShowBatchPosterUrlInput(!showBatchPosterUrlInput)}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 text-[11px] font-bold cursor-pointer transition-colors"
                    >
                      {showBatchPosterUrlInput ? 'Hide Batch URLs' : 'Paste Multiple URLs'}
                    </button>
                    {formPosterUrls.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Remove all photos for this event?')) {
                            setFormPosterUrls([]);
                            setFormPosterUrl('');
                          }
                        }}
                        className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline px-2 py-1 cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>

                {/* Batch URLs Textarea (Collapsible) */}
                {showBatchPosterUrlInput && (
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 space-y-2 animate-in fade-in duration-150">
                    <label className="block text-[11px] font-bold text-[#1A3668] dark:text-slate-300">
                      Paste Multiple Image URLs (One URL per line):
                    </label>
                    <textarea
                      rows={3}
                      value={draftBatchPosterUrls}
                      onChange={(e) => setDraftBatchPosterUrls(e.target.value)}
                      placeholder={'https://example.com/poster1.jpg\nhttps://example.com/seating-map.jpg\nhttps://example.com/benefits-chart.jpg'}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs font-mono text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">
                        URLs will be added to the event photo list.
                      </span>
                      <button
                        type="button"
                        onClick={handleApplyBatchPosterUrls}
                        style={{ backgroundColor: currentAccent.colorHex }}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white shadow-xs cursor-pointer hover:opacity-90"
                      >
                        + Add All URLs
                      </button>
                    </div>
                  </div>
                )}

                {/* Add Photo by URL or File Upload */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 flex gap-1.5">
                    <input
                      type="url"
                      value={formNewPosterUrlInput}
                      onChange={(e) => setFormNewPosterUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddPosterUrl();
                        }
                      }}
                      placeholder="Paste image link URL (https://...)"
                      className="flex-1 rounded-xl border border-purple-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                    />
                    <button
                      type="button"
                      onClick={handleAddPosterUrl}
                      disabled={!formNewPosterUrlInput.trim()}
                      className="px-3.5 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/60 dark:hover:bg-purple-800/80 text-purple-700 dark:text-purple-300 disabled:opacity-40 text-xs font-bold cursor-pointer shrink-0 transition-colors"
                    >
                      + Add URL
                    </button>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePosterFileUpload}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isCompressingPoster}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold cursor-pointer shrink-0 inline-flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95"
                  >
                    {isCompressingPoster ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Optimizing...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload File(s)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Thumbnails Gallery Management */}
                {formPosterUrls.length === 0 ? (
                  <div className="py-6 px-4 rounded-xl border border-dashed border-purple-200 dark:border-purple-800/60 bg-white/50 dark:bg-slate-800/50 text-center flex flex-col items-center justify-center gap-1.5">
                    <ImageIcon className="w-6 h-6 text-purple-400 opacity-60" />
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      No posters or photos added yet.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Upload from your device (you can select multiple files) or paste web links.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-64 overflow-y-auto pr-1">
                      {formPosterUrls.map((pUrl, idx) => (
                        <div
                          key={idx}
                          className={`group relative rounded-xl overflow-hidden bg-white dark:bg-slate-800 border-2 transition-all p-1.5 flex flex-col justify-between ${
                            idx === 0
                              ? 'border-purple-500 ring-2 ring-purple-300/50 dark:ring-purple-900 shadow-sm'
                              : 'border-slate-200 dark:border-slate-700 hover:border-purple-300'
                          }`}
                        >
                          {/* Image preview with click to enlarge */}
                          <div
                            onClick={() => setEnlargedPhoto({
                              url: pUrl,
                              title: `${formTitle || 'Event Photo'} (#${idx + 1})`,
                              photos: formPosterUrls,
                              currentIndex: idx
                            })}
                            className="relative w-full h-24 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 cursor-pointer flex items-center justify-center mb-1.5"
                            title="Click to preview full size"
                          >
                            <img src={pUrl} alt={`Photo #${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            {/* Badges on preview */}
                            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-black/70 text-white text-[9px] font-black">
                              #{idx + 1}
                            </span>
                            {idx === 0 && (
                              <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded-md bg-purple-600 text-white text-[9px] font-black uppercase tracking-wider shadow-xs">
                                Cover
                              </span>
                            )}
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Maximize2 className="w-4 h-4" />
                            </div>
                          </div>

                          {/* Control buttons row */}
                          <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100 dark:border-slate-700/80">
                            <div className="flex items-center gap-1">
                              {idx > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleSetCoverPoster(idx)}
                                  className="text-[10px] font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800 cursor-pointer"
                                  title="Set as main cover poster"
                                >
                                  Make Cover
                                </button>
                              )}
                              {idx > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleMovePoster(idx, idx - 1)}
                                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
                                  title="Move earlier"
                                >
                                  <ChevronLeft className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {idx < formPosterUrls.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleMovePoster(idx, idx + 1)}
                                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
                                  title="Move later"
                                >
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemovePoster(idx)}
                              className="p-1 rounded hover:bg-rose-50 text-rose-500 dark:hover:bg-rose-950/60 cursor-pointer"
                              title="Delete photo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <p className="text-[10px] text-slate-400 px-0.5">
                      💡 Tip: Photo #1 is displayed as the primary cover. You can reorder photos using the arrow buttons or click "Make Cover".
                    </p>
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

              {/* Where to Watch (Streaming Links) with Automatic Website Detection */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Tv className="w-3.5 h-3.5 text-red-500" />
                    <label className="text-xs font-bold text-[#1A3668] dark:text-white">
                      Where to Watch (Streaming Links)
                    </label>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {formWatchPlatforms.length} added
                  </span>
                </div>

                {/* Quick Add Presets Bar */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10.5px] font-bold text-slate-400">Quick add presets:</span>
                  {STREAMING_PLATFORM_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setNewPlatformName(p.name);
                        setNewPlatformType(p.platform);
                        setNewPlatformUrl(p.defaultUrl);
                      }}
                      className="text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[#1A3668] dark:text-white hover:bg-purple-50 dark:hover:bg-purple-950/60 cursor-pointer transition-colors shadow-2xs"
                    >
                      {p.name} {p.platform}
                    </button>
                  ))}
                </div>

                {/* Auto-detected website indicator badge */}
                {newPlatformUrl.trim() && (() => {
                  const detected = detectPlatformFromUrl(newPlatformUrl);
                  return (
                    <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-[11px] text-purple-700 dark:text-purple-300 animate-in fade-in duration-150">
                      <div className="flex items-center gap-1.5 min-w-0 truncate">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                        <span className="truncate">
                          Auto-detected website: <strong>{detected.platform}</strong> · Channel: <strong>{detected.name}</strong>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddWatchPlatform()}
                        className="text-[11px] font-bold text-purple-700 dark:text-purple-300 underline hover:text-purple-900 dark:hover:text-purple-100 cursor-pointer shrink-0 ml-2"
                      >
                        + Add Now
                      </button>
                    </div>
                  );
                })()}

                {/* Input Fields: URL input first for effortless paste & auto-detect */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-6 flex gap-1.5">
                    <input
                      type="url"
                      value={newPlatformUrl}
                      onChange={(e) => handleWatchUrlChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddWatchPlatform();
                        }
                      }}
                      placeholder="Paste link URL (e.g. YouTube, Facebook, X Space, WeTV)..."
                      className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400 placeholder:text-slate-400"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      value={newPlatformName}
                      onChange={(e) => setNewPlatformName(e.target.value)}
                      placeholder="Channel / Host (Auto-filled)"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 px-2.5 py-1.5 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                      title="Channel or Host name (auto-filled from link)"
                    />
                  </div>
                  <div className="sm:col-span-3 flex gap-1.5">
                    <input
                      type="text"
                      value={newPlatformType}
                      onChange={(e) => setNewPlatformType(e.target.value)}
                      placeholder="Platform (Auto-filled)"
                      className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 px-2.5 py-1.5 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                      title="Platform / Website name (auto-filled from link)"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddWatchPlatform()}
                      disabled={!newPlatformUrl.trim()}
                      className="px-3.5 py-1.5 rounded-xl bg-[#1A3668] hover:bg-[#13284f] dark:bg-purple-600 dark:hover:bg-purple-700 text-white text-xs font-bold shrink-0 cursor-pointer disabled:opacity-40 transition-colors shadow-xs active:scale-95"
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
                        className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-semibold shadow-2xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Tv className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                          <span className="font-bold text-[#1A3668] dark:text-white">{wp.name}</span>
                          <span className="text-slate-400">·</span>
                          <span className="text-[#607494] dark:text-slate-300">{wp.platform}</span>
                          <span className="text-slate-400">·</span>
                          <span className="text-[11px] text-slate-400 truncate max-w-[200px]">{wp.url}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveWatchPlatform(wp.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                          title="Remove streaming link"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <label className="text-xs font-bold text-[#1A3668] dark:text-slate-200">
                      Event Description & Announcement Details
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Character and Line Counter */}
                    <span className="text-[11px] font-semibold text-slate-400">
                      {formDescription.split('\n').filter(Boolean).length} lines · {formDescription.length} chars
                    </span>

                    {/* Toggle Extended Height */}
                    <button
                      type="button"
                      onClick={() => setIsExtendedDescEditor(!isExtendedDescEditor)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950/70 hover:bg-purple-200 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 transition-colors cursor-pointer"
                      title={isExtendedDescEditor ? "Switch to standard height" : "Extend editor height for long text"}
                    >
                      {isExtendedDescEditor ? (
                        <>
                          <Minimize2 className="w-3 h-3" />
                          <span>Standard View</span>
                        </>
                      ) : (
                        <>
                          <Maximize2 className="w-3 h-3" />
                          <span>Extended View</span>
                        </>
                      )}
                    </button>

                    {/* Open Dedicated Fullscreen/Split-View Editor */}
                    <button
                      type="button"
                      onClick={() => {
                        setFullEditorTab('editor');
                        setShowFullDescEditorModal(true);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-[#1A3668] dark:text-white border border-slate-200 dark:border-slate-600 shadow-2xs transition-colors cursor-pointer"
                      title="Open full distraction-free editor with live preview"
                    >
                      <Expand className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                      <span>Full Editor</span>
                    </button>
                  </div>
                </div>

                {/* Quick Announcement Section Badges / Starters */}
                <div className="flex items-center gap-1.5 flex-wrap py-0.5">
                  <span className="text-[10px] font-bold text-slate-400">Quick inserts:</span>
                  {[
                    { label: 'Online Reg', snippet: '\n[🚨 รอบ Online Registration]\n📌 เงื่อนไข:\n🔗 https://...\n📅 ระยะเวลาลงทะเบียน: \n🎁 สิทธิพิเศษ: \n' },
                    { label: 'On-Site Reg', snippet: '\n[🚨 รอบ On-Site Registration]\n📌 เงื่อนไข:\n📍 สถานที่: \n📅 ระยะเวลา: \n🎁 สิทธิพิเศษ: \n' },
                    { label: 'Terms & Conditions', snippet: '\n📌 เงื่อนไขและกติกา:\n- \n' },
                    { label: 'Privileges / Perks', snippet: '\n🎁 สิทธิพิเศษสำหรับผู้เข้าร่วม:\n- \n' },
                    { label: 'Winner Announcement', snippet: '\n📅 ประกาศรายชื่อผู้โชคดี: \n' },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormDescription((prev) => (prev ? `${prev.trimEnd()}${preset.snippet}` : preset.snippet.trimStart()))}
                      className="text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 hover:bg-purple-50 dark:hover:bg-purple-950/60 text-[#1A3668] dark:text-slate-200 border border-slate-200/80 dark:border-slate-600 transition-colors cursor-pointer"
                    >
                      + {preset.label}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <textarea
                    rows={isExtendedDescEditor ? 14 : 7}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Enter or paste detailed announcement (e.g. registration tiers, ticket rules, hashtag guidelines, schedule details). Drag bottom-right corner to freely resize height anytime..."
                    className={`w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-3 text-sm font-semibold text-[#1A3668] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-500 transition-all leading-relaxed resize-y ${
                      isExtendedDescEditor ? 'min-h-[280px]' : 'min-h-[150px]'
                    }`}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 flex-wrap gap-2">
                  <span>💡 Preserves line breaks, links, emojis and bullet points. Drag the bottom right corner (⋰) to resize as tall as you need.</span>
                  {formDescription && (
                    <button
                      type="button"
                      onClick={() => setFormDescription('')}
                      className="text-rose-500 hover:text-rose-700 underline cursor-pointer"
                    >
                      Clear description
                    </button>
                  )}
                </div>
              </div>

              {/* Official Hashtags with Quick Add Pills */}
              <div className="space-y-2.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <label className="block text-xs font-bold text-[#1A3668] dark:text-white">
                      Official Hashtags
                    </label>
                    <span className="text-[11px] font-semibold text-slate-400">
                      (Click pills to toggle or type custom tags)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleAddAllRequestedTags}
                      className="text-[10.5px] font-bold px-2.5 py-1 rounded-lg bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/70 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 transition-colors cursor-pointer shadow-2xs"
                      title="Add all popular fan hashtags at once"
                    >
                      + Add All JimmySea Tags
                    </button>
                    {formHashtags.trim() && (
                      <button
                        type="button"
                        onClick={() => setFormHashtags('')}
                        className="text-[10.5px] font-bold text-rose-500 hover:text-rose-700 underline cursor-pointer px-1"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Add Hashtag Pills */}
                <div className="space-y-1.5 pt-0.5">
                  <div className="flex items-center justify-between text-[10.5px] font-bold text-slate-400">
                    <span>Quick add usually used tags:</span>
                    <span className="hidden sm:inline text-[10px] text-purple-600 dark:text-purple-400">
                      🥑 Jimmy: #jimmyyjp #Tiny · 🌊 Sea: #sea_tawinan #ChaoTalay #ชาวทะเล · 💚 #AVOCEAN
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_HASHTAGS.map((item) => {
                      const isSelected = hasHashtag(formHashtags, item.tag);

                      const activeClasses =
                        item.category === 'jimmy'
                          ? 'bg-purple-600 text-white border-purple-600 shadow-2xs scale-102 ring-1 ring-purple-400/40'
                          : item.category === 'sea'
                          ? 'bg-sky-600 text-white border-sky-600 shadow-2xs scale-102 ring-1 ring-sky-400/40'
                          : item.category === 'avocean'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs scale-102 ring-1 ring-emerald-400/40'
                          : 'bg-[#1A3668] text-white border-[#1A3668] shadow-2xs scale-102';

                      const inactiveClasses =
                        item.category === 'jimmy'
                          ? 'bg-purple-50/80 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/80 hover:bg-purple-100 dark:hover:bg-purple-900/50'
                          : item.category === 'sea'
                          ? 'bg-sky-50/80 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200/80 dark:border-sky-800/80 hover:bg-sky-100 dark:hover:bg-sky-900/50'
                          : item.category === 'avocean'
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                          : 'bg-white dark:bg-slate-700 text-[#1A3668] dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600';

                      return (
                        <button
                          key={item.tag}
                          type="button"
                          onClick={() => handleToggleHashtag(item.tag)}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                            isSelected ? activeClasses : inactiveClasses
                          }`}
                          title={`${item.desc} — click to ${isSelected ? 'remove' : 'add'}`}
                        >
                          {isSelected ? (
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          ) : (
                            <span className="text-[11px] font-bold opacity-70">+</span>
                          )}
                          <span>{item.tag}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="relative pt-1">
                  <textarea
                    rows={2}
                    value={formHashtags}
                    onChange={(e) => setFormHashtags(e.target.value)}
                    placeholder="e.g. #jimmyyjp #Tiny #sea_tawinan #ChaoTalay #ชาวทะเล #AVOCEAN"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400 placeholder:text-slate-400 resize-y leading-relaxed"
                  />
                  <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 pt-1 font-medium">
                    <span>Space or comma-separated hashtags</span>
                    <span>{formHashtags.split(/[\s,]+/).filter(Boolean).length} tags added</span>
                  </div>
                </div>
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

              {/* Registration / Ticket Period Section */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/70 to-teal-50/60 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-200/80 dark:border-emerald-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formHasRegistration}
                      onChange={(e) => setFormHasRegistration(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-emerald-300 dark:border-slate-700 cursor-pointer"
                    />
                    <div className="flex items-center gap-1.5">
                      <Ticket className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                        Include Registration / Ticket Period
                      </span>
                    </div>
                  </label>
                  {formHasRegistration && (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-200/80 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200">
                      Registration Enabled
                    </span>
                  )}
                </div>

                <p className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300/80">
                  Specify registration or ticket sales dates (e.g. raffle registration window, ticket pre-sales, or form signups) before the main event.
                </p>

                {formHasRegistration && (
                  <div className="space-y-3 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60">
                    {/* Registration Start & End Dates */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-emerald-900 dark:text-emerald-200 mb-1">
                          Registration Opens (Start Date) *
                        </label>
                        <input
                          type="date"
                          required={formHasRegistration}
                          value={formRegStartDate}
                          onChange={(e) => {
                            setFormRegStartDate(e.target.value);
                            if (formRegEndDate && formRegEndDate < e.target.value) {
                              setFormRegEndDate(e.target.value);
                            }
                          }}
                          className="w-full rounded-xl border border-emerald-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-emerald-900 dark:text-emerald-200 mb-1">
                          Registration Closes (End Date)
                        </label>
                        <input
                          type="date"
                          min={formRegStartDate}
                          value={formRegEndDate}
                          onChange={(e) => setFormRegEndDate(e.target.value)}
                          className="w-full rounded-xl border border-emerald-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Registration Times & Timezone */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-emerald-900 dark:text-emerald-200 mb-1">
                          Open Time (Optional)
                        </label>
                        <input
                          type="text"
                          value={formRegStartTime}
                          onChange={(e) => setFormRegStartTime(e.target.value)}
                          placeholder={is12Hour ? 'e.g. 10:00 AM' : 'e.g. 10:00'}
                          className="w-full rounded-xl border border-emerald-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-emerald-900 dark:text-emerald-200 mb-1">
                          Close Time (Optional)
                        </label>
                        <input
                          type="text"
                          value={formRegEndTime}
                          onChange={(e) => setFormRegEndTime(e.target.value)}
                          placeholder={is12Hour ? 'e.g. 6:00 PM' : 'e.g. 18:00'}
                          className="w-full rounded-xl border border-emerald-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-emerald-900 dark:text-emerald-200 mb-1">
                          Timezone
                        </label>
                        <select
                          value={formRegTimezone}
                          onChange={(e) => setFormRegTimezone(e.target.value)}
                          className="w-full rounded-xl border border-emerald-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs font-bold text-[#1A3668] dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                        >
                          {ALL_TIMEZONES.slice(0, 15).map((tz) => (
                            <option key={tz.code} value={tz.code}>
                              {tz.code} ({tz.offset})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Registration Link / Form URL */}
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-900 dark:text-emerald-200 mb-1">
                        Registration / Ticket Link (URL)
                      </label>
                      <input
                        type="url"
                        value={formRegUrl}
                        onChange={(e) => setFormRegUrl(e.target.value)}
                        placeholder="https://... (Google Form, ThaiTicketMajor, Ticketmelon link)"
                        className="w-full rounded-xl border border-emerald-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Registration Instructions / Notes */}
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-900 dark:text-emerald-200 mb-1">
                        Instructions / Guidelines (Optional)
                      </label>
                      <input
                        type="text"
                        value={formRegNotes}
                        onChange={(e) => setFormRegNotes(e.target.value)}
                        placeholder="e.g. 1 entry per account, raffle results announced 2 days before event"
                        className="w-full rounded-xl border border-emerald-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}
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
                  disabled={isSavingEvent || isCompressingPoster}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-white bg-[#1A3668] dark:bg-purple-600 hover:bg-slate-800 disabled:opacity-50 shadow-xs cursor-pointer active:scale-95 transition-all"
                >
                  {isSavingEvent ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving to Cloud...</span>
                    </>
                  ) : isCompressingPoster ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Optimizing Photo...</span>
                    </>
                  ) : (
                    <span>{editingEvent ? 'Save Changes' : 'Add to Calendar'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: SECURE EMAIL & PASSWORD LOGIN & ADMIN REGISTRATION       */}
      {/* ============================================================== */}
      {loginModalOpen && (
        <div
          onClick={() => {
            setLoginModalOpen(false);
            setLoginError('');
            setRegError('');
            setLoginPasswordInput('');
            setRegPasswordInput('');
            setRegConfirmPasswordInput('');
          }}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-[28px] shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150 border border-slate-100 dark:border-slate-800 cursor-default"
          >
            {/* Top Close & Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center ${
                    loginMode === 'register'
                      ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                      : loginRoleTab === 'owner'
                      ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                      : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                  }`}
                >
                  {loginMode === 'register' ? (
                    <Sparkles className="w-4 h-4" />
                  ) : loginRoleTab === 'owner' ? (
                    <Crown className="w-4 h-4" />
                  ) : (
                    <Shield className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1A3668] dark:text-white">
                    {loginMode === 'register'
                      ? 'Create Admin Account'
                      : loginRoleTab === 'owner'
                      ? 'Owner Sign In'
                      : 'Admin Sign In'}
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-400">
                    {loginMode === 'register'
                      ? 'Use your own email & passcode to join the admin team'
                      : 'Protected with Email & Password'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setLoginModalOpen(false);
                  setLoginError('');
                  setRegError('');
                  setLoginPasswordInput('');
                  setRegPasswordInput('');
                  setRegConfirmPasswordInput('');
                }}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher Tabs: Sign In vs Create Admin Account */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
              <button
                type="button"
                onClick={() => {
                  setLoginMode('signin');
                  setLoginError('');
                  setRegError('');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  loginMode === 'signin'
                    ? 'bg-white dark:bg-slate-900 text-[#1A3668] dark:text-white shadow-xs'
                    : 'text-[#607494] dark:text-slate-400 hover:text-[#1A3668] dark:hover:text-white'
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoginMode('register');
                  setLoginRoleTab('admin');
                  setLoginError('');
                  setRegError('');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  loginMode === 'register'
                    ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 shadow-xs'
                    : 'text-[#607494] dark:text-slate-400 hover:text-[#1A3668] dark:hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Create Admin Account</span>
              </button>
            </div>

            {loginMode === 'signin' ? (
              <>
                {/* Role Switcher Tabs for Sign In */}
                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginRoleTab('owner');
                      setLoginEmailInput('');
                      setLoginError('');
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
                      setLoginEmailInput('');
                      setLoginError('');
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

                <form onSubmit={handleVerifyLogin} className="space-y-3.5">
                  {/* Email Address */}
                  <div>
                    <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={loginEmailInput}
                      onChange={(e) => {
                        setLoginEmailInput(e.target.value);
                        setLoginError('');
                      }}
                      placeholder={
                        loginRoleTab === 'owner'
                          ? 'Enter Owner email or username'
                          : 'Enter your registered admin email'
                      }
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                      autoFocus
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-[#526586] dark:text-slate-400">
                        Password / Passcode
                      </label>
                    </div>
                    <div className="relative">
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        value={loginPasswordInput}
                        onChange={(e) => {
                          setLoginPasswordInput(e.target.value);
                          setLoginError('');
                        }}
                        placeholder="Enter your password / passcode"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 pr-10 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {loginError && (
                    <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-xs font-bold text-rose-600 dark:text-rose-300">
                      {loginError}
                    </div>
                  )}

                  {/* Admin Sign Up Callout */}
                  {loginRoleTab === 'admin' && (
                    <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex items-center justify-between gap-2">
                      <div className="text-[11px] font-semibold text-blue-900 dark:text-blue-200">
                        New admin helper without an account?
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setLoginMode('register');
                          setLoginError('');
                          setRegError('');
                        }}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline shrink-0 cursor-pointer"
                      >
                        Create one here →
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginModalOpen(false);
                        setLoginError('');
                        setLoginPasswordInput('');
                      }}
                      className="px-3.5 py-2 rounded-full text-xs font-bold text-[#526586] dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loginLoading}
                      className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold text-white shadow-xs cursor-pointer active:scale-95 transition-all ${
                        loginRoleTab === 'owner'
                          ? 'bg-[#7C3AED] hover:bg-[#6D28D9]'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {loginLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>{loginRoleTab === 'owner' ? 'Sign In as Owner' : 'Sign In as Admin'}</span>
                    </button>
                  </div>
                </form>
              </>
            ) : (
              /* CREATE ADMIN ACCOUNT REGISTRATION FORM */
              <form onSubmit={handleRegisterAdmin} className="space-y-3">
                {/* Admin's Own Email Address */}
                <div>
                  <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                    Your Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmailInput}
                    onChange={(e) => {
                      setRegEmailInput(e.target.value);
                      setRegError('');
                    }}
                    placeholder="Enter your personal or admin email (e.g. name@gmail.com)"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-blue-400"
                    autoFocus
                  />
                </div>

                {/* Admin Display Name */}
                <div>
                  <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                    Your Name / Display Name
                  </label>
                  <input
                    type="text"
                    value={regDisplayNameInput}
                    onChange={(e) => setRegDisplayNameInput(e.target.value)}
                    placeholder="e.g. Sarah (PH Admin) or Admin Alex"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-blue-400"
                  />
                </div>

                {/* Chosen Admin Passcode / Password */}
                <div>
                  <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                    Your Chosen Passcode / Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regPasswordInput}
                      onChange={(e) => {
                        setRegPasswordInput(e.target.value);
                        setRegError('');
                      }}
                      placeholder="At least 6 characters"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 pr-10 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-blue-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Chosen Passcode */}
                <div>
                  <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                    Confirm Chosen Passcode / Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regConfirmPasswordInput}
                    onChange={(e) => {
                      setRegConfirmPasswordInput(e.target.value);
                      setRegError('');
                    }}
                    placeholder="Repeat your chosen passcode"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-blue-400"
                  />
                </div>

                {/* Admin Authorization Access Passcode */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-[#1A3668] dark:text-slate-200">
                      Admin Authorization Code
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Default: <code className="font-bold text-blue-600 dark:text-blue-400">Avocean2026</code>
                    </span>
                  </div>
                  <input
                    type="text"
                    value={regAdminPasscodeInput}
                    onChange={(e) => setRegAdminPasscodeInput(e.target.value)}
                    placeholder="Avocean2026"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-blue-400"
                  />
                  <p className="text-[10.5px] font-medium text-[#607494] dark:text-slate-400">
                    Enter the community admin code to verify your authorization to add and edit events.
                  </p>
                </div>

                {regError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-xs font-bold text-rose-600 dark:text-rose-300">
                    {regError}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMode('signin');
                      setLoginRoleTab('admin');
                      setRegError('');
                      setLoginError('');
                    }}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    ← Back to Sign In
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setLoginModalOpen(false)}
                      className="px-3.5 py-2 rounded-full text-xs font-bold text-[#526586] dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={regLoading}
                      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs cursor-pointer active:scale-95 transition-all"
                    >
                      {regLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>Create & Sign In</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CHANGE PASSWORD (ADMIN & OWNER)                         */}
      {/* ============================================================== */}
      {changePasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1A3668] dark:text-white">
                    Change Password
                  </h3>
                  <p className="text-xs font-semibold text-[#607494] dark:text-slate-400">
                    Set your own personal password to keep your account safe
                  </p>
                </div>
              </div>
              <button
                onClick={() => setChangePasswordModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitChangePassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                  Account Email
                </label>
                <input
                  type="email"
                  required
                  value={changePassEmail}
                  onChange={(e) => setChangePassEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-[#1A3668] dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswordField ? 'text' : 'password'}
                    required
                    value={currentPasswordInput}
                    onChange={(e) => {
                      setCurrentPasswordInput(e.target.value);
                      setPasswordError('');
                    }}
                    placeholder="Enter current password"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 pr-10 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordField(!showPasswordField)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPasswordField ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                  New Password
                </label>
                <input
                  type={showPasswordField ? 'text' : 'password'}
                  required
                  value={newPasswordInput}
                  onChange={(e) => {
                    setNewPasswordInput(e.target.value);
                    setPasswordError('');
                  }}
                  placeholder="Enter new password (at least 6 characters)"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                  Confirm New Password
                </label>
                <input
                  type={showPasswordField ? 'text' : 'password'}
                  required
                  value={confirmPasswordInput}
                  onChange={(e) => {
                    setConfirmPasswordInput(e.target.value);
                    setPasswordError('');
                  }}
                  placeholder="Confirm new password"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              {passwordError && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-xs font-bold text-rose-600 dark:text-rose-300">
                  {passwordError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setChangePasswordModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-bold text-[#526586] dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  style={{ backgroundColor: currentAccent.colorHex }}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold text-white shadow-xs cursor-pointer active:scale-95 transition-all"
                >
                  {isUpdatingPassword && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save New Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: REGISTERED ADMIN ACCOUNTS MANAGEMENT (OWNER ONLY)       */}
      {/* ============================================================== */}
      {adminAccountsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl w-full max-w-lg p-6 max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-150 border border-slate-100 dark:border-slate-800">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1A3668] dark:text-white">
                    Registered Admin Accounts
                  </h3>
                  <p className="text-xs font-semibold text-[#607494] dark:text-slate-400">
                    Admins authorized to add & edit calendar events
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAdminAccountsModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of Admins */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2.5 min-h-[140px]">
              {registeredAdmins.length === 0 ? (
                <div className="text-center py-8 px-4 text-slate-400 text-xs">
                  <Shield className="w-8 h-8 mx-auto mb-2 opacity-40 text-blue-500" />
                  <p className="font-semibold text-slate-500 dark:text-slate-400">No admin accounts created yet.</p>
                  <p className="mt-1 text-[11px]">Admins can register anytime using their own email and passcode.</p>
                </div>
              ) : (
                registeredAdmins.map((acc) => (
                  <div
                    key={acc.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0">
                        🛡️
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-[#1A3668] dark:text-white truncate">
                            {acc.displayName || acc.email.split('@')[0]}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                            Admin
                          </span>
                        </div>
                        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                          {acc.email}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {acc.lastLoginAt
                            ? `Last active: ${new Date(acc.lastLoginAt).toLocaleDateString()}`
                            : `Joined: ${new Date(acc.createdAt).toLocaleDateString()}`}
                        </div>
                      </div>
                    </div>

                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => handleDeleteAdmin(acc.email)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
                        title={`Revoke access for ${acc.email}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setAdminAccountsModalOpen(false);
                  openLoginModal('admin', 'register');
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 cursor-pointer transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Register New Admin</span>
              </button>

              <button
                type="button"
                onClick={() => setAdminAccountsModalOpen(false)}
                className="px-4 py-2 rounded-full text-xs font-bold text-white bg-[#1A3668] dark:bg-slate-700 hover:bg-slate-800 cursor-pointer shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: LOG IN & ACTIVITY AUDIT HISTORY (OWNER & ADMIN)         */}
      {/* ============================================================== */}
      {auditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150 border border-slate-100 dark:border-slate-800">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1A3668] dark:text-white">
                    Log In & Activity History
                  </h3>
                  <p className="text-xs font-semibold text-[#607494] dark:text-slate-400">
                    Real-time cross-device audit history of who logged in and what was edited
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAuditModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Tabs & Search */}
            <div className="py-3 space-y-2.5">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
                {[
                  { id: 'all', label: 'All Activities' },
                  { id: 'logins', label: '🔑 Logins & Auth' },
                  { id: 'events', label: '📅 Events' },
                  { id: 'fanhub', label: '🥑 Fan Hub & Projects' },
                  { id: 'settings', label: '⚙️ Settings' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setAuditFilterTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-full shrink-0 transition-all cursor-pointer ${
                      auditFilterTab === tab.id
                        ? 'bg-[#1A3668] dark:bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={auditSearchQuery}
                  onChange={(e) => setAuditSearchQuery(e.target.value)}
                  placeholder="Filter logs by email, event name, or detail..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-8 pr-3 py-1.5 text-xs text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>

            {/* Logs List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[250px]">
              {(() => {
                const filtered = auditLogs.filter((log) => {
                  // Tab filter
                  if (auditFilterTab === 'logins' && !['login', 'login_failed', 'logout', 'password_changed'].includes(log.actionType)) {
                    return false;
                  }
                  if (auditFilterTab === 'events' && !['create_event', 'edit_event', 'delete_event'].includes(log.actionType)) {
                    return false;
                  }
                  if (auditFilterTab === 'fanhub' && !['edit_fan_club', 'delete_fan_club', 'edit_food_project', 'delete_food_project'].includes(log.actionType)) {
                    return false;
                  }
                  if (auditFilterTab === 'settings' && !['update_settings'].includes(log.actionType)) {
                    return false;
                  }

                  // Search filter
                  if (auditSearchQuery.trim()) {
                    const q = auditSearchQuery.toLowerCase();
                    const matchEmail = (log.userEmail || '').toLowerCase().includes(q);
                    const matchDetails = (log.details || '').toLowerCase().includes(q);
                    const matchAction = (log.actionType || '').toLowerCase().includes(q);
                    return matchEmail || matchDetails || matchAction;
                  }
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-1.5">
                      <ClipboardList className="w-8 h-8 opacity-30 text-purple-600 mb-1" />
                      <span className="font-bold text-[#1A3668] dark:text-slate-300">No activity logs recorded yet</span>
                      <span>Logins, edits, and schedule updates will be logged here in real-time.</span>
                    </div>
                  );
                }

                return filtered.map((entry) => {
                  const isLogin = entry.actionType === 'login';
                  const isLoginFailed = entry.actionType === 'login_failed';
                  const isDelete = entry.actionType.includes('delete');
                  const isPassword = entry.actionType === 'password_changed';

                  const badgeClass = isLogin
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : isLoginFailed || isDelete
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                    : isPassword
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                    : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800';

                  // Format timestamp in Bangkok time and local time
                  const dateObj = new Date(entry.timestamp);
                  const bkkTime = new Intl.DateTimeFormat('en-GB', {
                    timeZone: 'Asia/Bangkok',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  }).format(dateObj);

                  return (
                    <div
                      key={entry.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/80 flex flex-col gap-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${badgeClass}`}>
                            {entry.actionType.replace('_', ' ')}
                          </span>
                          <span className="font-bold text-[#1A3668] dark:text-white">
                            {entry.role === 'owner' ? 'Hub Owner' : entry.userEmail}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400">
                            ({entry.role === 'owner' ? '👑 Owner' : '🛡️ Admin'})
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          <span>{bkkTime} BKK</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        {entry.details.replace(/ernestthestan@gmail\.com/gi, 'Hub Owner')}
                      </p>

                      {entry.deviceInfo && (
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 pt-0.5">
                          <span>Device:</span>
                          <span className="font-mono">{entry.deviceInfo}</span>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>{auditLogs.length} total logged activities</span>
              <button
                onClick={() => setAuditModalOpen(false)}
                style={{ backgroundColor: currentAccent.colorHex }}
                className="px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-xs cursor-pointer"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: CUSTOMIZE BANNER, GREETING & MEMBER PILLS (OWNER)     */}
      {/* ============================================================== */}
      {settingsModalOpen && (
        <div
          onClick={() => setSettingsModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-[28px] shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto border border-slate-100 dark:border-slate-800 cursor-default"
          >
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
              {/* Account Security & Password Management Shortcut */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-[#1A3668] dark:text-white">
                    <Key className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Account Security & Passwords</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsModalOpen(false);
                      openChangePasswordModal();
                    }}
                    className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                  >
                    Change Password →
                  </button>
                </div>
                <p className="text-[11px] font-medium text-[#607494] dark:text-slate-400">
                  Manage your private Owner login password and administrator security.
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

              {/* Dedicated Banner Photos Manager (Never a single confusing long line!) */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                      Banner Photos ({draftBannerPhotos.length})
                    </span>
                    <p className="text-[11px] text-[#607494] dark:text-slate-400">
                      Individual photo cards with thumbnails & instant delete buttons
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => bannerFileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 dark:text-purple-300 hover:underline cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Upload Image</span>
                  </button>
                </div>

                {/* List of Banner Photos - Each is an individual item, NEVER one long line */}
                {draftBannerPhotos.length === 0 ? (
                  <div className="py-5 px-3 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                    No custom banner photos yet. Add photo URLs below or upload from device.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {draftBannerPhotos.map((photoUrl, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 shadow-xs"
                      >
                        {/* Thumbnail & Order */}
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <img
                            src={photoUrl}
                            alt={`Banner photo ${idx + 1}`}
                            className="w-14 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.opacity = '0.5';
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-xs font-bold text-[#1A3668] dark:text-white">
                                Photo #{idx + 1}
                              </span>
                              {idx === 0 && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                                  Primary
                                </span>
                              )}
                            </div>
                            {/* Distinct, readable URL preview */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate max-w-[180px] sm:max-w-[260px] block">
                                {photoUrl.startsWith('data:') ? 'Local file uploaded' : photoUrl}
                              </span>
                              {!photoUrl.startsWith('data:') && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(photoUrl);
                                    setCopiedBannerUrlIdx(idx);
                                    showToast('Photo URL copied!');
                                    setTimeout(() => setCopiedBannerUrlIdx(null), 2000);
                                  }}
                                  className="text-slate-400 hover:text-purple-600 p-0.5 cursor-pointer"
                                  title="Copy URL"
                                >
                                  {copiedBannerUrlIdx === idx ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Reorder and Red Delete Button */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleDraftMovePhoto(idx, idx - 1)}
                            disabled={idx === 0}
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer"
                            title="Move Up"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDraftMovePhoto(idx, idx + 1)}
                            disabled={idx === draftBannerPhotos.length - 1}
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer"
                            title="Move Down"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          {/* Distinct Red Delete Button with text and trash icon */}
                          <button
                            type="button"
                            onClick={() => handleDraftRemovePhoto(idx)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all cursor-pointer border border-rose-200 dark:border-rose-900"
                            title={`Delete Photo #${idx + 1}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Photo Input / Batch Paste */}
                <div className="pt-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#526586] dark:text-slate-400">
                      {showBatchUrlInput ? 'Paste Multiple URLs (One per line)' : 'Add Photo URL'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowBatchUrlInput(!showBatchUrlInput)}
                      className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                    >
                      {showBatchUrlInput ? '← Single URL Mode' : '+ Paste Multiple URLs'}
                    </button>
                  </div>

                  {showBatchUrlInput ? (
                    <div className="space-y-2">
                      <textarea
                        rows={3}
                        value={draftBatchBannerUrls}
                        onChange={(e) => setDraftBatchBannerUrls(e.target.value)}
                        placeholder="https://example.com/photo1.jpg&#10;https://example.com/photo2.jpg&#10;https://example.com/photo3.jpg"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs font-mono text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                      />
                      <button
                        type="button"
                        onClick={() => handleDraftAddPhoto(draftBatchBannerUrls)}
                        disabled={!draftBatchBannerUrls.trim()}
                        style={{ backgroundColor: currentAccent.colorHex }}
                        className="w-full py-2 rounded-xl text-xs font-bold text-white disabled:opacity-40 cursor-pointer shadow-xs"
                      >
                        Add All URLs to Collection
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={draftNewBannerUrl}
                        onChange={(e) => setDraftNewBannerUrl(e.target.value)}
                        placeholder="Paste image URL (https://...)"
                        className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleDraftAddPhoto(draftNewBannerUrl);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleDraftAddPhoto(draftNewBannerUrl)}
                        disabled={!draftNewBannerUrl.trim()}
                        style={{ backgroundColor: currentAccent.colorHex }}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-40 cursor-pointer shrink-0 shadow-xs"
                      >
                        + Add Photo
                      </button>
                    </div>
                  )}
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

              {/* Hub Title & Header Alignment (Owner Only: Left, Center, Right) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-[#1A3668] dark:text-white">
                    <AlignLeft className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Hub Title & Header Alignment</span>
                  </label>
                  <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                    Owner Editable
                  </span>
                </div>
                <p className="text-[11px] text-[#607494] dark:text-slate-400">
                  Align Hub Title, Header Subtitle & Top Greeting to the left, center, or right.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'left', label: 'Left', icon: AlignLeft },
                      { id: 'center', label: 'Center', icon: AlignCenter },
                      { id: 'right', label: 'Right', icon: AlignRight }
                    ] as const
                  ).map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = draftHeaderAlignment === opt.id;
                    return (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => setDraftHeaderAlignment(opt.id)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-[#1A3668] dark:bg-purple-600 text-white border-[#1A3668] dark:border-purple-600 shadow-xs'
                            : 'bg-white dark:bg-slate-900 text-[#526586] dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Screen Display Width & Screen Auto-Fit (Owner Only) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-[#1A3668] dark:text-white">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Screen Sizing & Display Width</span>
                  </label>
                  <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                    Owner Editable
                  </span>
                </div>
                <p className="text-[11px] text-[#607494] dark:text-slate-400">
                  Automatically adjusts content, banner, and project cards to fit your computer monitor or phone smoothly.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {(
                    [
                      { id: 'auto', label: 'Auto Fit Screen', sub: 'Responsive' },
                      { id: 'wide', label: 'Wide (1800px)', sub: 'Desktop' },
                      { id: 'ultra', label: 'Ultra (2160px)', sub: 'Large 4K' },
                      { id: 'compact', label: 'Compact (1340px)', sub: 'Classic Box' }
                    ] as const
                  ).map((w) => {
                    const isSelected = draftContainerWidth === w.id;
                    return (
                      <button
                        type="button"
                        key={w.id}
                        onClick={() => setDraftContainerWidth(w.id)}
                        className={`py-2 px-1.5 rounded-xl text-center text-xs font-bold transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-[#1A3668] dark:bg-purple-600 text-white border-[#1A3668] dark:border-purple-600 shadow-xs'
                            : 'bg-white dark:bg-slate-900 text-[#526586] dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="leading-tight">{w.label}</div>
                        <div className="text-[9px] opacity-75 font-normal mt-0.5">{w.sub}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Top Greeting Subtitle & Font Size (Owner Only) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#526586] dark:text-slate-400">
                    Top Greeting Subtitle
                  </label>
                  <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                    Owner Editable
                  </span>
                </div>
                <input
                  type="text"
                  value={draftGreeting}
                  onChange={(e) => setDraftGreeting(e.target.value)}
                  placeholder="Hey ErnestTheStan!"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-500"
                />
                <div>
                  <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                    Greeting Font Size
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
                        onClick={() => setDraftGreetingSize(opt.id)}
                        className={`py-1.5 px-1 rounded-xl text-center text-xs font-bold cursor-pointer transition-all border ${
                          draftGreetingSize === opt.id
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
        <div
          onClick={() => setLeaveMessageModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl w-full max-w-lg p-5 sm:p-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150 border border-slate-100 dark:border-slate-800 cursor-default"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div
                  style={{
                    backgroundColor:
                      msgCategory === 'thanks'
                        ? '#FFE4E6'
                        : msgCategory === 'project'
                        ? '#F3E8FF'
                        : msgCategory === 'fanclub'
                        ? '#E0F2FE'
                        : msgCategory === 'foodsupport'
                        ? '#DCFCE7'
                        : '#EDE9FE'
                  }}
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                >
                  {msgCategory === 'thanks' ? (
                    <Heart className="w-5 h-5 text-rose-600 dark:text-rose-300 fill-rose-500" />
                  ) : msgCategory === 'project' ? (
                    <Film className="w-5 h-5 text-purple-700 dark:text-purple-300" />
                  ) : msgCategory === 'fanclub' ? (
                    <Users className="w-5 h-5 text-sky-700 dark:text-sky-300" />
                  ) : msgCategory === 'foodsupport' ? (
                    <HeartHandshake className="w-5 h-5 text-emerald-700 dark:text-emerald-300" />
                  ) : (
                    <MessageSquare className="w-5 h-5 text-purple-700 dark:text-purple-300" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1A3668] dark:text-white">
                    {msgCategory === 'thanks'
                      ? 'Wanna Say Thanks? 💖'
                      : msgCategory === 'project'
                      ? 'Suggest a Career Project'
                      : msgCategory === 'fanclub'
                      ? 'Submit a Fan Club'
                      : msgCategory === 'foodsupport'
                      ? 'Submit Food Support'
                      : 'Leave a Message'}
                  </h3>
                  <p className="text-xs font-semibold text-[#607494] dark:text-slate-400">
                    {msgCategory === 'thanks'
                      ? 'Send your love, heartfelt appreciation, or cheering message to Jimmy, Sea, or the admins!'
                      : msgCategory === 'project'
                      ? 'Propose a drama, movie, MV, or endorsement for Jimmy & Sea'
                      : msgCategory === 'fanclub'
                      ? 'Submit your fan club for the global Avocean directory'
                      : msgCategory === 'foodsupport'
                      ? 'Propose a food truck, catering, or charity campaign'
                      : 'Notify admins or owner about upcoming events & appearances'}
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

            {/* Category Selector Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 mb-4 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => setMsgCategory('calendar')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  msgCategory === 'calendar'
                    ? 'bg-white dark:bg-slate-700 text-[#1A3668] dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                <span>📅</span>
                <span>Calendar</span>
              </button>

              <button
                type="button"
                onClick={() => setMsgCategory('project')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  msgCategory === 'project'
                    ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                <span>🎬</span>
                <span>Projects</span>
              </button>

              <button
                type="button"
                onClick={() => setMsgCategory('fanclub')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  msgCategory === 'fanclub'
                    ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                <span>🌍</span>
                <span>Fan Clubs</span>
              </button>

              <button
                type="button"
                onClick={() => setMsgCategory('foodsupport')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  msgCategory === 'foodsupport'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                <span>🍱</span>
                <span>Food Support</span>
              </button>

              <button
                type="button"
                onClick={() => setMsgCategory('thanks')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer col-span-2 sm:col-span-1 ${
                  msgCategory === 'thanks'
                    ? 'bg-rose-500 text-white shadow-xs font-extrabold'
                    : 'text-rose-700 dark:text-rose-300 bg-rose-50/70 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40'
                }`}
              >
                <span>💖</span>
                <span>Say Thanks</span>
              </button>
            </div>

            {messageSubmitted ? (
              <div className="py-8 flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-[#1A3668] dark:text-white">
                  Message Sent in Real Time!
                </h4>
                <p className="text-xs font-medium text-[#607494] dark:text-slate-400 max-w-xs">
                  {msgCategory === 'thanks'
                    ? 'Thank you! Your heartfelt thank you note has been received in real time and brought a big smile to the team.'
                    : msgCategory === 'project'
                    ? 'Thank you! Admins and owner have received your career project suggestion and will review it.'
                    : msgCategory === 'fanclub'
                    ? 'Thank you! Admins have received your fan club submission to review for the directory.'
                    : msgCategory === 'foodsupport'
                    ? 'Thank you! Your food support proposal has been submitted to the team.'
                    : 'Thank you! The schedule admins and owner have received your note and will review the event details.'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendFanMessage} className="space-y-3.5">
                {/* Contextual Banner Note */}
                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed border ${
                    msgCategory === 'thanks'
                      ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-950 dark:text-rose-200'
                      : msgCategory === 'project'
                      ? 'bg-purple-50/70 dark:bg-purple-950/40 border-purple-100 dark:border-purple-900 text-purple-900 dark:text-purple-200'
                      : msgCategory === 'fanclub'
                      ? 'bg-sky-50/70 dark:bg-sky-950/40 border-sky-100 dark:border-sky-900 text-sky-900 dark:text-sky-200'
                      : msgCategory === 'foodsupport'
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200'
                      : 'bg-purple-50/70 dark:bg-purple-950/40 border-purple-100 dark:border-purple-900 text-purple-900 dark:text-purple-200'
                  }`}
                >
                  {msgCategory === 'thanks'
                    ? '💖 Wanna say thanks? Share what Jimmy, Sea, or this hub means to you! Leave cheering words, thank the creators, or send love to the fandom—no links required!'
                    : msgCategory === 'project'
                    ? '🎬 Missing a drama, movie, music video, brand endorsement or owned brand? Suggest it below and include character names (e.g. Jimmy as Pongpeun, Sea as Pepper)!'
                    : msgCategory === 'fanclub'
                    ? '🌍 Want your country, city, or regional fan club listed in the global Avocean directory? Share your handle and links below!'
                    : msgCategory === 'foodsupport'
                    ? '🍱 Running or organizing food support, a catering truck, or fan gifts for Jimmy & Sea? Propose details and donation link below!'
                    : '📅 Did we forget to list an upcoming schedule, interview, or appearance? Let us know below so we can keep the calendar complete!'}
                </div>

                {/* Sender Name / Handle */}
                <div>
                  <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                    Your Name or Social Handle *
                  </label>
                  <input
                    type="text"
                    required
                    value={msgSenderName}
                    onChange={(e) => setMsgSenderName(e.target.value)}
                    placeholder="e.g. AvoceanFan_BKK or @twitterhandle"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                {/* 1. CALENDAR FIELDS */}
                {msgCategory === 'calendar' && (
                  <>
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
                          Source / Official Link *
                        </label>
                        <input
                          type="url"
                          required
                          value={msgSourceUrl}
                          onChange={(e) => setMsgSourceUrl(e.target.value)}
                          placeholder="https://x.com/... or official link"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                        Details / Schedule Information *
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
                  </>
                )}

                {/* 2. CAREER PROJECT FIELDS */}
                {msgCategory === 'project' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                        Project / Show / Brand Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={msgEventTitle}
                        onChange={(e) => setMsgEventTitle(e.target.value)}
                        placeholder="e.g. Vice Versa, Last Twilight, Doctor Jimmy Clinic, or Pond's"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                          Category *
                        </label>
                        <select
                          value={msgProjectCategory}
                          onChange={(e) => setMsgProjectCategory(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                        >
                          <option value="Series">Series / Drama</option>
                          <option value="Movie">Movie / Film</option>
                          <option value="Music Video">Music Video</option>
                          <option value="Brand Endorsement">Brand Endorsement</option>
                          <option value="Owned Brand">Owned Brand</option>
                          <option value="Other">Other Project</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                          Artist *
                        </label>
                        <select
                          value={msgProjectArtist}
                          onChange={(e) => setMsgProjectArtist(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                        >
                          <option value="Jimmy & Sea">Jimmy & Sea</option>
                          <option value="Jimmy">Jimmy</option>
                          <option value="Sea">Sea</option>
                          <option value="Avocean">Avocean</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                          Release Year / Status
                        </label>
                        <input
                          type="text"
                          value={msgProjectYear}
                          onChange={(e) => setMsgProjectYear(e.target.value)}
                          placeholder="e.g. 2026 or Filming"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                        Character Names (Jimmy as ..., Sea as ...)
                      </label>
                      <input
                        type="text"
                        value={msgCharacterNames}
                        onChange={(e) => setMsgCharacterNames(e.target.value)}
                        placeholder="e.g. Jimmy as Pongpeun, Sea as Pepper"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                        Watch URL / Trailer / Official Announcement Link *
                      </label>
                      <input
                        type="url"
                        required
                        value={msgSourceUrl}
                        onChange={(e) => setMsgSourceUrl(e.target.value)}
                        placeholder="https://youtube.com/watch?... or https://x.com/..."
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                        Project Synopsis / Brand Description *
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={msgContent}
                        onChange={(e) => setMsgContent(e.target.value)}
                        placeholder="Provide synopsis, character role details, official broadcast station, or brand info..."
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                      />
                    </div>
                  </>
                )}

                {/* 3. FAN CLUB DIRECTORY FIELDS */}
                {msgCategory === 'fanclub' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                        Fan Club Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={msgEventTitle}
                        onChange={(e) => setMsgEventTitle(e.target.value)}
                        placeholder="e.g. JimmySea Philippines, Avocean Vietnam, TinySea LATAM"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                          Country / Region *
                        </label>
                        <input
                          type="text"
                          required
                          value={msgFanClubCountry}
                          onChange={(e) => setMsgFanClubCountry(e.target.value)}
                          placeholder="e.g. Philippines, Vietnam, Brazil, Worldwide"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                          City / Area (Optional)
                        </label>
                        <input
                          type="text"
                          value={msgFanClubCity}
                          onChange={(e) => setMsgFanClubCity(e.target.value)}
                          placeholder="e.g. Manila, Ho Chi Minh City"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                        Official Social Media URL *
                      </label>
                      <input
                        type="url"
                        required
                        value={msgSourceUrl}
                        onChange={(e) => setMsgSourceUrl(e.target.value)}
                        placeholder="https://x.com/jimmysea_ph or https://instagram.com/..."
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                        About the Fan Club / Fandom Bio *
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={msgContent}
                        onChange={(e) => setMsgContent(e.target.value)}
                        placeholder="Describe your fan club, year established, activities, contact admins..."
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                      />
                    </div>
                  </>
                )}

                {/* 4. FOOD SUPPORT FIELDS */}
                {msgCategory === 'foodsupport' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                        Food Support / Project Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={msgEventTitle}
                        onChange={(e) => setMsgEventTitle(e.target.value)}
                        placeholder="e.g. Food Support for GMMTV Starlympics 2026 or Birthday Food Truck"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                          Organizing Fan Club / Team *
                        </label>
                        <input
                          type="text"
                          required
                          value={msgFoodSupportOrganizer}
                          onChange={(e) => setMsgFoodSupportOrganizer(e.target.value)}
                          placeholder="e.g. Avocean Inter Fans & PH FC"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                          Fundraising Goal / Target (Optional)
                        </label>
                        <input
                          type="text"
                          value={msgFoodSupportTarget}
                          onChange={(e) => setMsgFoodSupportTarget(e.target.value)}
                          placeholder="e.g. 25,000 THB or 500 USD"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                          Delivery / Event Date (Optional)
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
                          Campaign / Form / Info Link *
                        </label>
                        <input
                          type="url"
                          required
                          value={msgSourceUrl}
                          onChange={(e) => setMsgSourceUrl(e.target.value)}
                          placeholder="https://x.com/... or Google Form link"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                        Catering & Food Project Details *
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={msgContent}
                        onChange={(e) => setMsgContent(e.target.value)}
                        placeholder="Detail planned items (lunch boxes, coffee truck, snack bags), venue delivery, beneficiary..."
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                      />
                    </div>
                  </>
                )}

                {/* 5. WANNA SAY THANKS FIELDS */}
                {msgCategory === 'thanks' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1.5">
                        Who do you want to say thanks to? 💖
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {[
                          { id: 'Jimmy & Sea', label: '🥑🌊 Jimmy & Sea' },
                          { id: 'Jimmy Jitaraphol', label: '🥑 Jimmy' },
                          { id: 'Sea Tawinan', label: '🌊 Sea' },
                          { id: 'Admins & Website Team', label: '🛠️ Admins & Hub Team' },
                          { id: 'Whole Avocean Family', label: '💚 Whole Avocean Family' }
                        ].map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setMsgThanksTo(item.id)}
                            className={`py-1.5 px-2.5 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                              msgThanksTo === item.id
                                ? 'bg-rose-500 text-white border-rose-600 shadow-xs font-black'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-rose-300'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                        Your Heartfelt Thank You Message *
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={msgContent}
                        onChange={(e) => setMsgContent(e.target.value)}
                        placeholder="Write your sweet words of appreciation, encouragement, gratitude, or love... 🥑🌊💚"
                        className="w-full rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-slate-800 px-3.5 py-2.5 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-rose-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                        Topic / Title (Optional)
                      </label>
                      <input
                        type="text"
                        value={msgEventTitle}
                        onChange={(e) => setMsgEventTitle(e.target.value)}
                        placeholder="e.g. Thank you for this schedule! or Always cheering for Jimmy & Sea"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-rose-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                        Optional Fan Art / Tweet / Social Post Link
                      </label>
                      <input
                        type="url"
                        value={msgSourceUrl}
                        onChange={(e) => setMsgSourceUrl(e.target.value)}
                        placeholder="https://x.com/... (optional)"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-rose-400"
                      />
                    </div>
                  </>
                )}

                {/* Form Buttons */}
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
                    disabled={isSendingMessage}
                    style={{ backgroundColor: currentAccent.colorHex }}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold text-white shadow-xs cursor-pointer active:scale-95 transition-all hover:opacity-90 disabled:opacity-50"
                  >
                    {isSendingMessage ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending in real time...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>
                          {msgCategory === 'thanks'
                            ? 'Send Thank You Note 💖'
                            : msgCategory === 'project'
                            ? 'Submit Project Suggestion'
                            : msgCategory === 'fanclub'
                            ? 'Submit Fan Club'
                            : msgCategory === 'foodsupport'
                            ? 'Submit Food Support'
                            : 'Send Message'}
                        </span>
                      </>
                    )}
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
        <div
          onClick={() => setInboxModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150 border border-slate-100 dark:border-slate-800 cursor-default"
          >
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                  <Inbox className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-[#1A3668] dark:text-white">
                      Viewer Messages & Suggestions
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Live Cloud Sync</span>
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[#607494] dark:text-slate-400">
                    Visible only to Admins and Owner ({fanMessages.length} total · {unreadMessageCount} unread)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleRefreshInbox}
                  disabled={isRefreshingInbox}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#1A3668] dark:text-slate-200 text-xs font-bold transition-all cursor-pointer border border-slate-200/80 dark:border-slate-700"
                  title="Force re-sync inbox with cloud database"
                >
                  <RotateCcw className={`w-3.5 h-3.5 text-purple-600 dark:text-purple-400 ${isRefreshingInbox ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
                <button
                  onClick={() => setInboxModalOpen(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 mb-3.5 pb-2 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setInboxFilterCategory('all')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  inboxFilterCategory === 'all'
                    ? 'bg-[#1A3668] dark:bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                All ({fanMessages.length})
              </button>
              <button
                type="button"
                onClick={() => setInboxFilterCategory('calendar')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  inboxFilterCategory === 'calendar'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100'
                }`}
              >
                📅 Events ({fanMessages.filter((m) => !m.category || m.category === 'calendar').length})
              </button>
              <button
                type="button"
                onClick={() => setInboxFilterCategory('project')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  inboxFilterCategory === 'project'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100'
                }`}
              >
                🎬 Projects ({fanMessages.filter((m) => m.category === 'project').length})
              </button>
              <button
                type="button"
                onClick={() => setInboxFilterCategory('fanclub')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  inboxFilterCategory === 'fanclub'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 hover:bg-sky-100'
                }`}
              >
                🌍 Fan Clubs ({fanMessages.filter((m) => m.category === 'fanclub').length})
              </button>
              <button
                type="button"
                onClick={() => setInboxFilterCategory('foodsupport')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  inboxFilterCategory === 'foodsupport'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                }`}
              >
                🍱 Food Support ({fanMessages.filter((m) => m.category === 'foodsupport').length})
              </button>
              <button
                type="button"
                onClick={() => setInboxFilterCategory('thanks')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  inboxFilterCategory === 'thanks'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
                }`}
              >
                💖 Say Thanks ({fanMessages.filter((m) => m.category === 'thanks').length})
              </button>
            </div>

            {fanMessages.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <Inbox className="w-10 h-10 text-slate-300 mb-2" />
                <span className="text-sm font-bold text-[#1A3668] dark:text-white">
                  Inbox is empty
                </span>
                <span className="text-xs text-slate-400">
                  When viewers submit events, project suggestions, fan club tips, or thank you notes, they will appear here.
                </span>
              </div>
            ) : (
              <div className="space-y-3.5">
                {fanMessages
                  .filter((msg) => {
                    if (inboxFilterCategory === 'all') return true;
                    if (inboxFilterCategory === 'calendar') return !msg.category || msg.category === 'calendar';
                    return msg.category === inboxFilterCategory;
                  })
                  .map((msg) => {
                    const isThanks = msg.category === 'thanks';
                    const isProject = msg.category === 'project';
                    const isFanClub = msg.category === 'fanclub';
                    const isFoodSupport = msg.category === 'foodsupport';
                    const isCalendar = !msg.category || msg.category === 'calendar';

                    return (
                      <div
                        key={msg.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          msg.isRead
                            ? 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                            : isThanks
                            ? 'bg-gradient-to-br from-rose-50/90 via-pink-50/80 to-purple-50/70 dark:from-rose-950/40 dark:via-pink-950/30 dark:to-purple-950/40 border-rose-200 dark:border-rose-800 shadow-2xs'
                            : isProject
                            ? 'bg-purple-50/70 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800 shadow-2xs'
                            : isFanClub
                            ? 'bg-sky-50/70 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800 shadow-2xs'
                            : isFoodSupport
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 shadow-2xs'
                            : 'bg-purple-50/70 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800 shadow-2xs'
                        }`}
                      >
                        {/* Header Row: Title, Category Badge, Status, Date */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-extrabold text-[#1A3668] dark:text-white">
                              {msg.eventTitle}
                            </span>

                            {/* Category Pill Badge */}
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                isThanks
                                  ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 flex items-center gap-1'
                                  : isProject
                                  ? 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                                  : isFanClub
                                  ? 'bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                                  : isFoodSupport
                                  ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                  : 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                              }`}
                            >
                              {isThanks
                                ? `💖 Say Thanks · To: ${msg.thanksTo || 'Jimmy & Sea'}`
                                : isProject
                                ? `🎬 Project · ${msg.projectCategory || 'Work'}`
                                : isFanClub
                                ? `🌍 Fan Club · ${msg.fanClubCountry || 'Global'}`
                                : isFoodSupport
                                ? '🍱 Food Support'
                                : '📅 Event'}
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

                        {/* Extra Context Badges */}
                        {(isProject || isFanClub || isFoodSupport || isThanks) && (
                          <div className="flex items-center gap-1.5 flex-wrap mb-2 text-[11px]">
                            {isThanks && (
                              <span className="font-semibold px-2 py-0.5 rounded-md bg-rose-100/80 dark:bg-rose-950/70 text-rose-800 dark:text-rose-200 flex items-center gap-1">
                                💌 Appreciation for: {msg.thanksTo || 'Jimmy & Sea'}
                              </span>
                            )}

                            {isProject && (
                              <>
                                {msg.projectArtist && (
                                  <span className="font-semibold px-2 py-0.5 rounded-md bg-purple-100/70 dark:bg-purple-950/70 text-purple-800 dark:text-purple-200">
                                    ⭐ {msg.projectArtist}
                                  </span>
                                )}
                                {msg.characterNames && (
                                  <span className="font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200">
                                    🎭 {msg.characterNames}
                                  </span>
                                )}
                                {msg.projectYear && (
                                  <span className="font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300">
                                    📅 {msg.projectYear}
                                  </span>
                                )}
                              </>
                            )}

                            {isFanClub && (
                              <>
                                {msg.fanClubCountry && (
                                  <span className="font-semibold px-2 py-0.5 rounded-md bg-sky-100/70 dark:bg-sky-950/70 text-sky-800 dark:text-sky-200">
                                    📍 {msg.fanClubCountry} {msg.fanClubCity ? `(${msg.fanClubCity})` : ''}
                                  </span>
                                )}
                              </>
                            )}

                            {isFoodSupport && (
                              <>
                                {msg.foodSupportOrganizer && (
                                  <span className="font-semibold px-2 py-0.5 rounded-md bg-emerald-100/70 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200">
                                    🤝 Organized by: {msg.foodSupportOrganizer}
                                  </span>
                                )}
                                {msg.foodSupportTarget && (
                                  <span className="font-semibold px-2 py-0.5 rounded-md bg-amber-100/70 dark:bg-amber-950/70 text-amber-800 dark:text-amber-200">
                                    🎯 Target: {msg.foodSupportTarget}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        )}

                        {/* Message / Description Body */}
                        {isThanks ? (
                          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-rose-100 dark:border-rose-900/60 shadow-2xs mb-3">
                            <p className="text-xs text-rose-950 dark:text-rose-100 leading-relaxed whitespace-pre-line font-medium italic">
                              "{msg.message}"
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mb-3 whitespace-pre-line">
                            "{msg.message}"
                          </p>
                        )}

                        {/* Footer row: Sender, Link, Action buttons */}
                        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex-wrap gap-2">
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            From: <span className="font-bold text-[#1A3668] dark:text-white">{msg.senderName}</span>
                            {msg.sourceUrl && (
                              <a
                                href={msg.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-2 text-purple-600 dark:text-purple-400 underline inline-flex items-center gap-1 font-semibold"
                              >
                                <span>Official Link</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Action based on category */}
                            {isCalendar && (
                              <button
                                onClick={() => handlePrefillEventFromMessage(msg)}
                                style={{ backgroundColor: currentAccent.colorHex }}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold text-white shadow-2xs hover:opacity-90 cursor-pointer"
                                title="Pre-fill Add Event Form"
                              >
                                <Sparkles className="w-3 h-3" />
                                <span>+ Add to Calendar</span>
                              </button>
                            )}

                            {isProject && (
                              <button
                                onClick={() => {
                                  setInboxModalOpen(false);
                                  setActiveTab('projects');
                                  handleMarkMessageRead(msg.id);
                                  showToast(`Switched to Projects Hub! You can now add "${msg.eventTitle}".`);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-2xs cursor-pointer"
                                title="Switch to Projects Tab"
                              >
                                <Film className="w-3 h-3" />
                                <span>Go to Projects</span>
                              </button>
                            )}

                            {isFanClub && (
                              <button
                                onClick={() => {
                                  setInboxModalOpen(false);
                                  setActiveTab('fanhub');
                                  setFanHubSubTab('directory');
                                  handleMarkMessageRead(msg.id);
                                  showToast(`Switched to Fan Clubs Directory! You can add "${msg.eventTitle}".`);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-2xs cursor-pointer"
                                title="Switch to Fan Clubs Directory"
                              >
                                <Users className="w-3 h-3" />
                                <span>Go to Fan Clubs</span>
                              </button>
                            )}

                            {isFoodSupport && (
                              <button
                                onClick={() => {
                                  setInboxModalOpen(false);
                                  setActiveTab('fanhub');
                                  setFanHubSubTab('foodsupport');
                                  handleMarkMessageRead(msg.id);
                                  showToast(`Switched to Food Support! You can add "${msg.eventTitle}".`);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-2xs cursor-pointer"
                                title="Switch to Food Support Projects"
                              >
                                <HeartHandshake className="w-3 h-3" />
                                <span>Go to Food Support</span>
                              </button>
                            )}

                            {/* Copy Full Info Helper */}
                            <button
                              onClick={() => handleCopyMessageDetails(msg)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 cursor-pointer"
                              title="Copy all details to clipboard"
                            >
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </button>

                            {/* Read / Unread toggle */}
                            <button
                              onClick={() => handleMarkMessageRead(msg.id)}
                              className="px-2.5 py-1 rounded-full text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 cursor-pointer"
                            >
                              {msg.isRead ? 'Mark Unread' : 'Mark Read'}
                            </button>

                            {/* Delete button */}
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
                    );
                  })}
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

              {/* Screen Display Width & Screen Auto-Fit Control */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-[#1A3668] dark:text-white">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Screen Sizing & Display Width</span>
                  </label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    {(settings.containerWidth || 'auto') === 'auto' ? '⚡ Auto-Fit Active' : settings.containerWidth}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Automatically adjusts banner and page layout to fill your computer screen without large blank margins.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {(
                    [
                      { id: 'auto', label: 'Auto Fit Screen', sub: 'Responsive' },
                      { id: 'wide', label: 'Wide (1800px)', sub: 'Desktop' },
                      { id: 'ultra', label: 'Ultra (2160px)', sub: 'Large 4K' },
                      { id: 'compact', label: 'Compact (1340px)', sub: 'Classic Box' }
                    ] as const
                  ).map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => handleUpdateContainerWidth(w.id)}
                      className={`py-2 px-1.5 rounded-xl text-center text-xs font-bold transition-all border cursor-pointer ${
                        (settings.containerWidth || 'auto') === w.id
                          ? 'bg-[#1A3668] dark:bg-purple-600 text-white border-[#1A3668] dark:border-purple-600 shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-[#526586] dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="leading-tight">{w.label}</div>
                      <div className="text-[9px] opacity-75 font-normal mt-0.5">{w.sub}</div>
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
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <img
                            src={photo}
                            alt={`Banner ${idx + 1}`}
                            className="w-14 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-xs font-bold text-[#1A3668] dark:text-white">
                                Photo #{idx + 1}
                              </span>
                              {idx === currentBannerIndex % activeBannerPhotos.length && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                                  Current
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 block truncate max-w-[190px] sm:max-w-[240px]">
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
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all cursor-pointer border border-rose-200 dark:border-rose-900"
                            title={`Delete Photo #${idx + 1}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
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

      {/* ============================================================== */}
      {/* PHOTO LIGHTBOX MODAL (Full Resolution Event Photo Popup)      */}
      {/* ============================================================== */}
      {enlargedPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-3 sm:p-5 animate-in fade-in duration-200 select-none"
          onClick={() => setEnlargedPhoto(null)}
        >
          {/* Top Bar: Title, Multi-photo counter, Open Original & Close */}
          <div
            className="w-full max-w-5xl flex items-center justify-between gap-3 text-white z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 truncate pr-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shrink-0 animate-pulse" />
              <span className="text-sm sm:text-base font-extrabold truncate text-white tracking-tight">
                {enlargedPhoto.title || 'Event Photo'}
              </span>
              {enlargedPhoto.photos && enlargedPhoto.photos.length > 1 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 text-white text-xs font-bold shrink-0">
                  <ImageIcon className="w-3 h-3 text-purple-300" />
                  <span>
                    {(enlargedPhoto.currentIndex ?? 0) + 1} / {enlargedPhoto.photos.length}
                  </span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Open Image in New Tab */}
              <a
                href={enlargedPhoto.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all cursor-pointer"
                title="Open photo in new tab"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Open Original</span>
              </a>

              {/* Close Button */}
              <button
                onClick={() => setEnlargedPhoto(null)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center border border-white/20 transition-all cursor-pointer active:scale-95"
                title="Close (Esc)"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Centered Image Container with Navigation Arrows */}
          <div className="relative flex-1 flex items-center justify-center my-2 max-h-[75vh] max-w-[95vw] w-full cursor-pointer">
            {/* Previous Photo Button */}
            {enlargedPhoto.photos && enlargedPhoto.photos.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const prev = ((enlargedPhoto.currentIndex ?? 0) - 1 + enlargedPhoto.photos!.length) % enlargedPhoto.photos!.length;
                  setEnlargedPhoto({
                    ...enlargedPhoto,
                    url: enlargedPhoto.photos![prev],
                    currentIndex: prev
                  });
                }}
                className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition-all shadow-xl z-20 cursor-pointer active:scale-95"
                title="Previous photo (←)"
              >
                <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
              </button>
            )}

            <img
              src={enlargedPhoto.url}
              alt={enlargedPhoto.title || 'Full resolution photo'}
              className="max-h-[75vh] max-w-[88vw] object-contain rounded-2xl shadow-2xl border border-white/15 animate-in zoom-in-95 duration-200 cursor-default"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Next Photo Button */}
            {enlargedPhoto.photos && enlargedPhoto.photos.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const next = ((enlargedPhoto.currentIndex ?? 0) + 1) % enlargedPhoto.photos!.length;
                  setEnlargedPhoto({
                    ...enlargedPhoto,
                    url: enlargedPhoto.photos![next],
                    currentIndex: next
                  });
                }}
                className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition-all shadow-xl z-20 cursor-pointer active:scale-95"
                title="Next photo (→)"
              >
                <ChevronRight className="w-6 h-6 stroke-[2.5]" />
              </button>
            )}
          </div>

          {/* Bottom Bar: Thumbnails (if multi-photo) & Instructions */}
          <div
            className="flex flex-col items-center gap-2 z-10 w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {enlargedPhoto.photos && enlargedPhoto.photos.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto max-w-full px-2 py-1 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10">
                {enlargedPhoto.photos.map((pUrl, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => setEnlargedPhoto({
                      ...enlargedPhoto,
                      url: pUrl,
                      currentIndex: pIdx
                    })}
                    className={`relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      pIdx === (enlargedPhoto.currentIndex ?? 0)
                        ? 'border-purple-400 ring-2 ring-purple-400/50 scale-105 opacity-100 shadow-md'
                        : 'border-white/20 opacity-50 hover:opacity-90'
                    }`}
                    title={`View photo #${pIdx + 1}`}
                  >
                    <img src={pUrl} alt={`Thumb #${pIdx + 1}`} className="w-full h-full object-cover" />
                    {pIdx === 0 && (
                      <span className="absolute bottom-0 inset-x-0 bg-purple-700/80 text-[7px] text-white font-bold text-center leading-tight">
                        Cover
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            <div className="text-white/60 text-xs font-medium select-none flex items-center gap-2 pointer-events-none">
              <span>Click open space or press</span>
              <kbd className="px-2 py-0.5 rounded bg-white/15 text-white font-mono text-[11px] font-bold">
                Esc
              </kbd>
              <span>to close</span>
              {enlargedPhoto.photos && enlargedPhoto.photos.length > 1 && (
                <>
                  <span className="opacity-40">·</span>
                  <span>Use</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-white/15 text-white font-mono text-[11px] font-bold">
                    ←
                  </kbd>
                  <kbd className="px-1.5 py-0.5 rounded bg-white/15 text-white font-mono text-[11px] font-bold">
                    →
                  </kbd>
                  <span>to browse</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: FULLSCREEN DESCRIPTION & ANNOUNCEMENT EDITOR            */}
      {/* ============================================================== */}
      {showFullDescEditorModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
          onClick={() => setShowFullDescEditorModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar: Title, Counters, Presets & Actions */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3 bg-slate-50/70 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#1A3668] dark:text-white leading-tight">
                    Extended Description & Announcement Editor
                  </h3>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mt-0.5">
                    <span>{formDescription.split('\n').filter(Boolean).length} lines</span>
                    <span>·</span>
                    <span>{formDescription.length} characters</span>
                    <span>·</span>
                    <span>{formTitle || 'Schedule Event'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Mobile Tab Switcher */}
                <div className="inline-flex md:hidden items-center p-1 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setFullEditorTab('editor')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      fullEditorTab === 'editor'
                        ? 'bg-white dark:bg-slate-700 text-[#1A3668] dark:text-white shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    Editor
                  </button>
                  <button
                    type="button"
                    onClick={() => setFullEditorTab('preview')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      fullEditorTab === 'preview'
                        ? 'bg-white dark:bg-slate-700 text-[#1A3668] dark:text-white shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    Live Preview
                  </button>
                </div>

                {/* Done & Apply Button */}
                <button
                  type="button"
                  onClick={() => setShowFullDescEditorModal(false)}
                  style={{ backgroundColor: currentAccent.colorHex }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white shadow-xs hover:opacity-95 cursor-pointer active:scale-95 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Apply & Return</span>
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setShowFullDescEditorModal(false)}
                  className="w-9 h-9 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
                  title="Close (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Insert Snippets Toolbar */}
            <div className="px-4 py-2 bg-purple-50/50 dark:bg-purple-950/30 border-b border-purple-100 dark:border-purple-900/50 flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-purple-900 dark:text-purple-300">Quick inserts:</span>
              {[
                { label: 'Online Reg Section', snippet: '\n[🚨 รอบ Online Registration]\n📌 เงื่อนไข:\n🔗 https://...\n📅 ระยะเวลาซื้อสินค้าและลงทะเบียน: \n🎁 สิทธิพิเศษ: \n🎁 ผู้โชคดีทั้งหมด: \n' },
                { label: 'On-Site Reg Section', snippet: '\n[🚨 รอบ On-Site Registration]\n📌 เงื่อนไข:\n📍 สถานที่: \n📅 ระยะเวลา: \n🎁 สิทธิพิเศษ: \n🎁 ผู้โชคดี: \n' },
                { label: 'Terms & Conditions', snippet: '\n📌 เงื่อนไขและกติกา:\n- \n- \n' },
                { label: 'Privileges / Perks', snippet: '\n🎁 สิทธิพิเศษ:\n- \n' },
                { label: 'Winner Announcement', snippet: '\n📅 ประกาศรายชื่อผู้โชคดี:\n' },
                { label: 'Notice & Remarks', snippet: '\n⚠️ หมายเหตุ:\n- \n' }
              ].map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setFormDescription((prev) => (prev ? `${prev.trimEnd()}${preset.snippet}` : preset.snippet.trimStart()))}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-900 text-[#1A3668] dark:text-slate-200 border border-purple-200/60 dark:border-slate-700 transition-colors cursor-pointer"
                >
                  + {preset.label}
                </button>
              ))}
            </div>

            {/* Main Editor Body: Split View (Side-by-Side on Desktop) */}
            <div className="flex-1 overflow-hidden p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Full-Height Textarea */}
              <div className={`flex flex-col h-full ${fullEditorTab === 'preview' ? 'hidden md:flex' : 'flex'}`}>
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 px-1">
                  <span>Text Editor (Preserves formatting & links)</span>
                  {formDescription && (
                    <button
                      type="button"
                      onClick={() => setFormDescription('')}
                      className="text-rose-500 hover:text-rose-700 underline cursor-pointer text-[11px]"
                    >
                      Clear all text
                    </button>
                  )}
                </div>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Paste or write detailed announcement here... Full paragraph text, bullet points, tier rules, hashtags, and registration links are fully preserved."
                  className="flex-1 w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-4 text-sm font-medium text-[#1A3668] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-500 resize-none leading-relaxed min-h-[380px] overflow-y-auto"
                />
              </div>

              {/* Right Column: Live Announcement Preview */}
              <div className={`flex flex-col h-full ${fullEditorTab === 'editor' ? 'hidden md:flex' : 'flex'}`}>
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 px-1">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Live Fan View Preview</span>
                  </span>
                  <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                    Auto-links active
                  </span>
                </div>
                <div className="flex-1 w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 overflow-y-auto min-h-[380px]">
                  {formDescription.trim() ? (
                    <div className="text-sm font-medium text-[#334155] dark:text-slate-200 leading-relaxed whitespace-pre-line">
                      {renderDescriptionTextWithLinks(formDescription)}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-6">
                      <FileText className="w-10 h-10 mb-2 opacity-30 text-purple-500" />
                      <p className="text-xs font-semibold">Start typing in the editor to see your announcement formatted live.</p>
                      <p className="text-[11px] opacity-70 mt-1">Links like https://... will automatically become clickable buttons.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Footer Bar */}
            <div className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs font-medium text-slate-400 bg-slate-50/70 dark:bg-slate-800/50">
              <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">Esc</kbd> or click Apply & Return when done</span>
              <button
                type="button"
                onClick={() => setShowFullDescEditorModal(false)}
                style={{ backgroundColor: currentAccent.colorHex }}
                className="px-5 py-2 rounded-full text-xs font-bold text-white shadow-xs hover:opacity-95 cursor-pointer"
              >
                Done Editing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: EXTENDED EVENT ANNOUNCEMENT & DESCRIPTION READER         */}
      {/* ============================================================== */}
      {descriptionModalEvent && (() => {
        const ev = descriptionModalEvent;
        const isTranslating = translatingEventId === ev.id;
        const currentChecksum = computeTextChecksum(ev.description);
        const eventCache = translationsCache[ev.id];
        const isCacheValid = eventCache && eventCache._sourceChecksum === currentChecksum;
        const rawCached = isCacheValid ? eventCache?.[preferredTranslationLang] : undefined;
        const cachedTranslation =
          rawCached &&
          !rawCached.includes('QUERY LENGTH LIMIT') &&
          !rawCached.startsWith('MYMEMORY WARNING')
            ? rawCached
            : undefined;
        const isShowingTranslated = Boolean(activeTranslationViews[ev.id] && cachedTranslation);
        const currentDisplayDescription = isShowingTranslated ? cachedTranslation : ev.description;
        const currentLangObj = TRANSLATION_LANGUAGES.find((l) => l.code === preferredTranslationLang);
        const regInfo = getRegistrationStatusInfo(ev, todayDateStr);

        const fontSizeClasses = {
          sm: 'text-xs sm:text-[13px] leading-normal',
          base: 'text-xs sm:text-sm leading-relaxed',
          lg: 'text-sm sm:text-base leading-relaxed',
          xl: 'text-base sm:text-lg leading-loose'
        };

        return (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
            onClick={() => setDescriptionModalEvent(null)}
          >
            <div
              className="bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header: Title, Category, Members, Close */}
              <div className="p-5 sm:p-6 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {ev.category && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 text-[10.5px] font-bold text-[#475569] dark:text-slate-300 uppercase tracking-wider bg-white dark:bg-slate-800">
                          <MapPin className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                          <span>{ev.category}</span>
                        </span>
                      )}
                      {(ev.members || []).map((mId) => {
                        const m = getMemberById(mId);
                        return (
                          <span
                            key={mId}
                            style={{
                              backgroundColor: isDarkMode ? '#1E293B' : m.pillBg,
                              borderColor: m.pillBorder
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10.5px] font-bold text-[#1A3668] dark:text-white"
                          >
                            <span>{m.emoji}</span>
                            <span>{m.name}</span>
                          </span>
                        );
                      })}
                    </div>

                    <h2 className="text-lg sm:text-xl font-extrabold text-[#1A3668] dark:text-white leading-snug tracking-tight">
                      {ev.title}
                    </h2>

                    <div className="flex items-center gap-3 text-xs font-semibold text-[#607494] dark:text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span>{formatEventFullDateRange(ev.date, ev.endDate)}</span>
                      </span>
                      {ev.time && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                          <span>{ev.isAllDay ? 'All-Day' : formatEventTime(ev, is12Hour)}</span>
                        </span>
                      )}
                      {ev.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                          <span>{ev.location}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDescriptionModalEvent(null)}
                    className="w-9 h-9 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 flex items-center justify-center cursor-pointer transition-colors shrink-0"
                    title="Close (Esc)"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Reader Controls Toolbar: Font Size, Translation & Copy */}
                <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  {/* Font Size Adjuster */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-400">Size:</span>
                    {(['sm', 'base', 'lg', 'xl'] as const).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setDescriptionModalFontSize(sz)}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                          descriptionModalFontSize === sz
                            ? 'bg-[#1A3668] dark:bg-purple-600 text-white shadow-2xs'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {sz === 'sm' ? 'A-' : sz === 'base' ? 'A' : sz === 'lg' ? 'A+' : 'A++'}
                      </button>
                    ))}
                  </div>

                  {/* Translation & Copy Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Language Selector */}
                    <div className="relative inline-flex items-center">
                      <select
                        value={preferredTranslationLang}
                        onChange={(e) => {
                          const newLang = e.target.value;
                          handleSelectTranslationLang(newLang);
                          if (activeTranslationViews[ev.id]) {
                            handleTranslateEventDescription(ev.id, ev.description || '', newLang);
                          }
                        }}
                        className="text-[11px] font-bold pl-2 pr-6 py-1 rounded-lg bg-white dark:bg-slate-800 text-[#1A3668] dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer focus:outline-none appearance-none"
                      >
                        {TRANSLATION_LANGUAGES.map((lang) => (
                          <option key={lang.code} value={lang.code} className="dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                            {lang.flag} {lang.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 pointer-events-none" />
                    </div>

                    {/* Translate Button */}
                    {cachedTranslation ? (
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleToggleTranslationView(ev.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 cursor-pointer"
                        >
                          <Languages className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                          <span>{isShowingTranslated ? 'Show Original' : 'Show Translation'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTranslateEventDescription(ev.id, ev.description || '', preferredTranslationLang, true)}
                          disabled={isTranslating}
                          className="p-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
                          title="Re-translate / Refresh translation to fetch updated text and links"
                        >
                          <RotateCcw className={`w-3.5 h-3.5 ${isTranslating ? 'animate-spin text-purple-600' : ''}`} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleTranslateEventDescription(ev.id, ev.description || '')}
                        disabled={isTranslating}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-bold bg-purple-600 hover:bg-purple-700 text-white cursor-pointer disabled:opacity-50"
                      >
                        {isTranslating ? (
                          <>
                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Translating...</span>
                          </>
                        ) : (
                          <>
                            <Languages className="w-3 h-3" />
                            <span>Translate</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Copy Description Button */}
                    <button
                      onClick={() => {
                        handleCopyTranslatedDescription(ev.id, currentDisplayDescription || '');
                        setDescriptionModalCopied(true);
                        setTimeout(() => setDescriptionModalCopied(false), 2000);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs"
                    >
                      {descriptionModalCopied ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Announcement</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Scrollable Announcement Body */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5 bg-white dark:bg-slate-900">
                {/* Registration Callout if applicable */}
                {regInfo.hasReg && (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-200/80 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${regInfo.badgeBg} ${regInfo.badgeText} border ${regInfo.badgeBorder}`}>
                          {regInfo.statusLabel}
                        </span>
                        <span className="text-xs font-bold text-[#1A3668] dark:text-white">Registration & Ticket Schedule</span>
                      </div>
                      <p className="text-xs font-semibold text-[#607494] dark:text-slate-300">
                        {formatRegistrationSchedule(ev, is12Hour)}
                      </p>
                    </div>
                    {ev.registrationUrl && (
                      <a
                        href={ev.registrationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs shrink-0 cursor-pointer"
                      >
                        <span>Open Official Registration</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                )}

                {/* Formatted Announcement Text with Clickable Links */}
                <div className={`font-medium text-[#334155] dark:text-slate-200 whitespace-pre-line ${fontSizeClasses[descriptionModalFontSize]}`}>
                  {renderDescriptionTextWithLinks(currentDisplayDescription)}
                </div>

                {/* Official Hashtags Section */}
                {ev.hashtags && (
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <span className="block text-xs font-bold text-slate-400 mb-2">Official Hashtags</span>
                    <div className="flex flex-wrap gap-2">
                      {ev.hashtags.split(/\s+/).filter(Boolean).map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Reader Footer */}
              <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2 bg-slate-50/70 dark:bg-slate-800/50 text-xs font-semibold text-slate-400">
                <span>{currentDisplayDescription?.split('\n').filter(Boolean).length || 0} lines · {currentDisplayDescription?.length || 0} characters</span>
                <div className="flex items-center gap-2">
                  {ev.link && (
                    <a
                      href={ev.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:underline px-3 py-1.5 cursor-pointer"
                    >
                      <span>Official Source Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setDescriptionModalEvent(null)}
                    style={{ backgroundColor: currentAccent.colorHex }}
                    className="px-5 py-2 rounded-full text-xs font-bold text-white shadow-xs hover:opacity-95 cursor-pointer"
                  >
                    Close Reader
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Hidden File Input for Banner Photos (Device Camera / Storage) - Always mounted */}
      <input
        ref={bannerFileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleBannerFileUpload}
        className="hidden"
      />
    </div>
  );
}
