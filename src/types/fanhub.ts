export type FanClubActor =
  | 'all'
  | 'duo'
  | 'everyone'
  | 'jimmysea'
  | 'jimmy'
  | 'sea'
  | 'avocean'
  | 'jimmy_avocean'
  | 'sea_avocean';

export type ClubCategory =
  | 'duo'
  | 'everyone'
  | 'jimmysea'
  | 'jimmy'
  | 'sea'
  | 'avocean'
  | 'jimmy_avocean'
  | 'sea_avocean';

export type SocialPlatform =
  | 'x'
  | 'instagram'
  | 'tiktok'
  | 'facebook'
  | 'line'
  | 'discord'
  | 'youtube'
  | 'weibo'
  | 'web'
  | 'email';

export interface SocialLink {
  platform: SocialPlatform;
  label?: string;
  url: string;
}

export type FanClubEventCategory =
  | 'cup_sleeve'
  | 'donation_drive'
  | 'watch_party'
  | 'gathering'
  | 'concert_support'
  | 'charity'
  | 'exhibit'
  | 'birthday'
  | 'other';

export type FanClubPhotoAspect = 'poster' | 'card' | 'square';
export type FanClubPhotoSize = 'small' | 'medium' | 'large';

export interface FanClubEvent {
  id: string;
  title: string;
  category?: FanClubEventCategory;
  date: string; // YYYY-MM-DD
  endDate?: string; // Optional multi-day end date
  time?: string; // e.g. "11:00 AM - 5:00 PM"
  location?: string; // Venue / Cafe / City
  locationUrl?: string; // Google Maps URL
  description?: string; // Project/event details (giveaways, photobooths, cup sleeves, etc.)
  link?: string; // Official announcement / RSVP link
  donationUrl?: string; // Optional donation / support drive link
  posterUrl?: string; // Event poster image URL (primary)
  photos?: string[]; // Multiple photos / media URLs
  photoAspect?: FanClubPhotoAspect; // Aspect ratio adjustment: poster (3:4), card (16:9), square (1:1)
  photoSize?: FanClubPhotoSize; // Display size adjustment: small, medium, large
}

export type FanClubBannerHeight = 'compact' | 'standard' | 'large' | 'tall' | 'auto' | 'widescreen' | 'header';
export type FanClubBannerFit = 'cover' | 'contain' | 'auto';
export type FanClubBannerPosition = 'center' | 'top' | 'bottom';
export type FanClubAvatarSize = 'small' | 'standard' | 'large' | 'xl';

export interface FanClub {
  id: string;
  name: string;
  actor: ClubCategory;
  countryCode: string; // e.g. "GLOBAL", "TH", "PH", "VN", "JP", "CN", "LATAM"
  countryName: string; // e.g. "Thailand", "Philippines", "Global / Inter"
  city?: string; // Optional city / chapter e.g. "Manila", "Bangkok"
  flagEmoji: string; // e.g. "🇹🇭", "🇵🇭", "🌐"
  description: string;
  translatedDescription?: string; // Translated version for international fans (e.g. English)
  handle?: string; // e.g. "@JimmySea_OFC", "@AvoceanOfficial"
  bannerUrl?: string; // Official header banner image URL
  avatarUrl?: string; // Official display photo / profile picture URL
  bannerHeight?: FanClubBannerHeight; // Visual sizing: compact, standard, large, tall, auto, widescreen, header
  bannerFit?: FanClubBannerFit; // Fit style: cover (fill), contain (no crop full view with ambient glow), auto
  bannerPosition?: FanClubBannerPosition; // Focal point: center, top, bottom
  avatarSize?: FanClubAvatarSize; // Visual sizing: small (76px), standard (96px), large (112px), xl (128px)
  isOfficialOrVerified?: boolean;
  socials: SocialLink[];
  hashtags?: string;
  tags?: string[];
  events?: FanClubEvent[]; // Upcoming and ongoing fan club events
  updatedAt?: string;
}

export type ProjectStatus = 'open' | 'reached' | 'delivered';

export type SupportType =
  | 'food_truck'
  | 'coffee_cart'
  | 'snack_boxes'
  | 'flower_stand'
  | 'custom_cake'
  | 'gifting'
  | 'led_billboard'
  | 'other';

export interface ProofMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
  caption?: string;
}

export interface FoodSupportProject {
  id: string;
  title: string;
  actor: ClubCategory;
  supportType: SupportType;
  customSupportType?: string; // Allows admin/owner to type custom support type instead of just "Other"
  status: ProjectStatus;
  eventName?: string;
  eventDate?: string;
  location?: string;
  countryCode?: string; // e.g. "TH", "PH", "JP", "VN", "GLOBAL"
  countryName?: string; // e.g. "Thailand", "Philippines", "Global / International"
  flagEmoji?: string; // e.g. "🇹🇭", "🇵🇭", "🌐"
  organizerName: string;
  organizerContactUrl?: string;
  description: string;
  translatedDescription?: string;
  targetAmount: number;
  currentAmount: number;
  currency: string; // "THB" | "PHP" | "USD" | etc.
  donationUrl?: string;
  announcementUrl?: string;
  deadline?: string;
  proofMedia: ProofMedia[];
  deliveryNotes?: string;
  translatedDeliveryNotes?: string; // Translated version for international fans (e.g. English)
  hashtags?: string;
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
}



