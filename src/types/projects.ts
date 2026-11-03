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
  bannerUrl?: string;
  platform?: string;
  primaryLink?: string;
  extraLinks?: ProjectLink[];
  watchLinks?: ProjectLink[]; // Multiple Where to Watch / Official Streaming platforms & websites
  tags?: string[];
  highlight?: string;
  releaseDate?: string;
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

