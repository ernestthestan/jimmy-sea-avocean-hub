export type ProjectCategory =
  | 'shows'
  | 'movies'
  | 'music_videos'
  | 'partner_brands'
  | 'owned_brands';

export type ProjectArtist = 'jimmysea' | 'jimmy' | 'sea' | 'avocean';

export type ProjectStatus = 'released' | 'upcoming' | 'ongoing' | 'active';

export interface ProjectLink {
  id?: string;
  label: string;
  url: string;
  platform?: string;
}

export interface CareerProject {
  id: string;
  title: string;
  englishTitle?: string;
  thaiTitle?: string; // Optional authentic Thai script title (e.g. ภาพนายไม่เคยลืม) for projects that have one
  category: ProjectCategory;
  artist: ProjectArtist;
  role?: string;
  jimmyRole?: string;
  seaRole?: string;
  director?: string; // Series or Movie director name (e.g. Aof Noppharnach Chaiwimol)
  year?: string; // Release or On-Air period, e.g. 2023–2024 or Dec 2023 – Jan 2024
  filmedPeriod?: string; // Filmed month/year, e.g. January – April 2023
  status: ProjectStatus;
  description: string;
  imageUrl: string;
  mediaPhotos?: string[]; // Multiple photo/media collection (posters, character visuals, stills)
  mediaFit?: 'cover' | 'contain' | 'auto'; // Auto-fit (contain uncropped) vs cinematic crop (cover)
  mediaPosition?: string; // Adjustable framing focal position (e.g. 'center 25%')
  mediaOffsetY?: number; // Vertical focal offset percentage (0 to 100%)
  bannerUrl?: string;
  platform?: string;
  primaryLink?: string;
  extraLinks?: ProjectLink[];
  watchLinks?: ProjectLink[]; // Multiple Where to Watch / Official Streaming platforms & websites
  twitterUrl?: string; // Official Show / Series Twitter / X (e.g. https://x.com/ViceVersaSeries or @ViceVersaSeries)
  instagramUrl?: string; // Official Show / Series Instagram (e.g. https://instagram.com/viceversaseries or @viceversaseries)
  officialWebsiteUrl?: string; // Official Show / Series Website
  customWebsites?: Array<{ label: string; url: string }>; // Custom show websites & official links
  tags?: string[];
  highlight?: string;
  releaseDate?: string;
  titleSize?: 'compact' | 'medium' | 'large';
  fontSize?: 'compact' | 'medium' | 'large';
  updatedAt?: string;
}

export interface ProjectCategoryOption {
  id: 'all' | ProjectCategory;
  label: string;
  emoji: string;
  subLabel: string;
}

export const PROJECT_CATEGORIES: ProjectCategoryOption[] = [
  { id: 'all', label: 'All Projects', emoji: '🌟', subLabel: 'Everything' },
  { id: 'shows', label: 'Shows & Series', emoji: '📺', subLabel: 'Dramas & Variety' },
  { id: 'movies', label: 'Movies & Films', emoji: '🎬', subLabel: 'Theatrical & Films' },
  { id: 'music_videos', label: 'Music Videos', emoji: '🎵', subLabel: 'OSTs & Singles' },
  { id: 'partner_brands', label: 'Partner Brands', emoji: '🤝', subLabel: 'Endorsements' },
  { id: 'owned_brands', label: 'Owned Brands', emoji: '👑', subLabel: 'Personal Ventures' }
];

export interface ActorProfile {
  id: 'jimmy' | 'avocean' | 'sea';
  name: string;
  nativeName?: string;
  nickname?: string;
  roleTitle: string;
  avatarUrl: string;
  avatarPhotos?: string[]; // Multiple photos/media for Profile Avatar photo gallery
  bannerPhotoUrl?: string;
  birthDate?: string;
  birthPlace?: string;
  education?: string;
  agency?: string;
  heightWeight?: string;
  bloodType?: string;
  venturesOrSkills?: string;
  myDramaListUrl?: string; // Legacy optional
  customWebsites?: Array<{ label: string; url: string }>; // Customizable external websites & official links
  instagramUrl?: string;
  twitterUrl?: string;
  tiktokUrl?: string;
  bio: string;
  spouse?: string; // Spouse / Partner / Pairing
  parents?: string; // Parents (specifically for Avocean: Jimmy & Sea)
  zodiac?: string; // Zodiac Sign (e.g. Leo ♌, Aries ♈)
  favoriteColors?: string; // Favorite Color/s (e.g. Purple, Green, Black)
  favoriteFoods?: string; // Favorite Food/s (e.g. Salmon, Steak, Mango Sticky Rice)
  highlightChip?: string;
  quote?: string;
  titleSize?: 'compact' | 'medium' | 'large';
  bioSize?: 'small' | 'medium' | 'large';
  factsSize?: 'compact' | 'small' | 'medium' | 'large' | 'xl'; // Font size for Key Facts / Information grid
  avatarPosition?: string; // e.g. 'center top', 'center 15%', 'center 0%'
  avatarFit?: 'cover' | 'contain';
  avatarZoom?: number; // scale multiplier e.g. 1.0, 1.1
}

/**
 * Computes a numeric timestamp score for sorting projects chronologically.
 * Higher scores represent newer projects (e.g. 2026/2025 "My Magic Prophecy" > 2023 "Last Twilight" > 2022 "Vice Versa").
 */
export function getProjectChronologicalScore(p: CareerProject): number {
  // 1. Check explicit releaseDate e.g. "2025-06-01" or "2022-07-16"
  if (p.releaseDate) {
    const d = new Date(p.releaseDate);
    if (!isNaN(d.getTime())) {
      return d.getTime();
    }
  }

  // 2. Parse year string e.g. "2025", "2024–2025", "Dec 2023 – Jan 2024", "Jul 2022"
  const rawSources = [p.year || '', p.filmedPeriod || '', p.title || '', p.englishTitle || ''].join(' ');
  const yearMatches = rawSources.match(/\b(20\d{2}|19\d{2})\b/g);
  let latestYear = 0;
  if (yearMatches && yearMatches.length > 0) {
    latestYear = Math.max(...yearMatches.map((y) => parseInt(y, 10)));
  }

  // Check known titles if year is not explicitly provided
  if (!latestYear) {
    const lower = `${p.title} ${p.englishTitle || ''}`.toLowerCase();
    if (lower.includes('magic prophecy')) latestYear = 2026;
    else if (lower.includes('scarlet heart')) latestYear = 2026;
    else if (lower.includes('last twilight')) latestYear = 2023;
    else if (lower.includes('vice versa')) latestYear = 2022;
    else if (lower.includes('bad buddy')) latestYear = 2021;
    else if (lower.includes('55:15') || lower.includes('never too late')) latestYear = 2021;
    else if (lower.includes('our skyy 2') || lower.includes('ourskyy')) latestYear = 2023;
    else if (p.status === 'upcoming') latestYear = 2026;
    else if (p.status === 'ongoing' || p.status === 'active') latestYear = 2025;
    else latestYear = 2020;
  }

  // Check month names e.g. "Dec 2023", "July 2022"
  const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  let monthIndex = 0;
  const lowerSources = rawSources.toLowerCase();
  for (let m = 0; m < monthNames.length; m++) {
    if (lowerSources.includes(monthNames[m])) {
      monthIndex = m + 1;
    }
  }

  // Construct millisecond estimate
  return new Date(latestYear, Math.max(0, monthIndex - 1), 1).getTime();
}


