import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Film,
  Tv,
  Music,
  ShoppingBag,
  Sparkles,
  Search,
  Filter,
  Plus,
  ExternalLink,
  Edit3,
  Trash2,
  X,
  Check,
  Crown,
  Heart,
  Share2,
  Calendar,
  Layers,
  Tag,
  Link2,
  Maximize2,
  Languages,
  RotateCcw,
  Loader2,
  Video,
  Clapperboard,
  Play,
  Globe,
  Radio,
  Camera,
  Upload,
  GraduationCap,
  MapPin,
  Award,
  Quote,
  Type,
  Palette,
  Utensils,
  Compass,
  Sliders,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Copy
} from 'lucide-react';
import type { CareerProject, ProjectCategory, ProjectArtist, ProjectStatus, ProjectLink, ActorProfile } from '../types/projects';
import { PROJECT_CATEGORIES, getProjectChronologicalScore } from '../types/projects';
import { INITIAL_ACTOR_PROFILES } from '../data/initialActorProfiles';
import { subscribeToActorProfiles, saveActorProfilesToFirestore } from '../lib/firestoreSync';
import { TRANSLATION_LANGUAGES, translateText } from '../lib/translateService';
import { compressImageFile } from '../lib/imageCompression';
import { OfficialHashtagPicker } from './OfficialHashtagPicker';
import { HashtagsDisplayCard } from './HashtagsDisplayCard';

export const PROJECT_WATCH_PLATFORMS = [
  { value: 'Trailer', label: 'Official Trailer', icon: '🎬' },
  { value: 'Viki', label: 'Viki (Rakuten Viki)', icon: '🟣' },
  { value: 'iQiyi', label: 'iQiyi', icon: '🟢' },
  { value: 'Viu', label: 'Viu', icon: '🟡' },
  { value: 'GagaOOLala', label: 'GagaOOLala', icon: '🌈' },
  { value: 'YouTube', label: 'YouTube', icon: '▶️' },
  { value: 'Netflix', label: 'Netflix', icon: '🍿' },
  { value: 'GMMTV', label: 'GMMTV', icon: '🎬' },
  { value: 'Disney+', label: 'Disney+ Hotstar', icon: '✨' },
  { value: 'WeTV', label: 'WeTV', icon: '🟠' },
  { value: 'TrueID', label: 'TrueID', icon: '🔴' },
  { value: 'One31', label: 'oneD / One31', icon: '📺' },
  { value: 'Spotify', label: 'Spotify', icon: '🟢' },
  { value: 'Apple Music', label: 'Apple Music', icon: '🍎' },
  { value: 'Instagram', label: 'Instagram', icon: '📸' },
  { value: 'X', label: 'X / Twitter', icon: '🐦' },
  { value: 'Shop', label: 'Shop / Merch', icon: '🛍️' },
  { value: 'Website', label: 'Official Website', icon: '🌐' }
];

export function detectProjectWatchPlatform(url: string): { platform: string; label: string } | null {
  const u = (url || '').trim().toLowerCase();
  if (!u) return null;
  if (u.includes('trailer') || u.includes('teaser') || u.includes('pilot')) {
    return { platform: 'Trailer', label: 'Official Trailer' };
  }
  if (u.includes('viki.com')) return { platform: 'Viki', label: 'Viki' };
  if (u.includes('iqiyi.com') || u.includes('iq.com')) return { platform: 'iQiyi', label: 'iQiyi' };
  if (u.includes('viu.com')) return { platform: 'Viu', label: 'Viu' };
  if (u.includes('gagaoolala.com')) return { platform: 'GagaOOLala', label: 'GagaOOLala' };
  if (u.includes('youtube.com') || u.includes('youtu.be')) return { platform: 'YouTube', label: 'YouTube' };
  if (u.includes('netflix.com')) return { platform: 'Netflix', label: 'Netflix' };
  if (u.includes('wetv.vip') || u.includes('wetv.com')) return { platform: 'WeTV', label: 'WeTV' };
  if (u.includes('hotstar.com') || u.includes('disneyplus.com')) return { platform: 'Disney+', label: 'Disney+ Hotstar' };
  if (u.includes('trueid.net')) return { platform: 'TrueID', label: 'TrueID' };
  if (u.includes('oned.net') || u.includes('one31.net')) return { platform: 'One31', label: 'oneD' };
  if (u.includes('gmm-tv.com') || u.includes('gmmtv')) return { platform: 'GMMTV', label: 'GMMTV' };
  if (u.includes('spotify.com')) return { platform: 'Spotify', label: 'Spotify' };
  if (u.includes('apple.com') || u.includes('music.apple')) return { platform: 'Apple Music', label: 'Apple Music' };
  if (u.includes('instagram.com')) return { platform: 'Instagram', label: 'Instagram' };
  if (u.includes('twitter.com') || u.includes('x.com')) return { platform: 'X', label: 'X / Twitter' };
  return null;
}

interface ProjectsHubProps {
  projects: CareerProject[];
  actorProfiles?: Record<'jimmy' | 'avocean' | 'sea', ActorProfile>;
  onSaveActorProfiles?: (profiles: Record<'jimmy' | 'avocean' | 'sea', ActorProfile>) => Promise<void> | void;
  canEdit: boolean;
  isOwner: boolean;
  currentAccent: {
    colorHex: string;
    name?: string;
    [key: string]: any;
  };
  containerWidthClass?: string;
  activeMemberIds?: string[];
  onToggleMemberFilter?: (memberId: string) => void;
  onSetActiveMemberIds?: (memberIds: string[]) => void;
  preferredTranslationLang?: string;
  onSelectTranslationLang?: (lang: string) => void;
  onSaveProject: (project: CareerProject) => void;
  onDeleteProject: (projectId: string) => void;
  showToast: (msg: string) => void;
}

export const ProjectsHub: React.FC<ProjectsHubProps> = ({
  projects,
  actorProfiles: propActorProfiles,
  onSaveActorProfiles,
  canEdit,
  isOwner,
  currentAccent,
  containerWidthClass,
  activeMemberIds = ['jimmy', 'sea', 'avocean'],
  onToggleMemberFilter,
  onSetActiveMemberIds,
  preferredTranslationLang = 'en',
  onSelectTranslationLang,
  onSaveProject,
  onDeleteProject,
  showToast
}) => {
  // Member Filters State (All Member / Jimmy / Sea / Avocean)
  const [localMemberIds, setLocalMemberIds] = useState<string[]>(activeMemberIds || ['jimmy', 'sea', 'avocean']);

  useEffect(() => {
    if (activeMemberIds && activeMemberIds.length > 0) {
      setLocalMemberIds(activeMemberIds);
    }
  }, [activeMemberIds]);

  const currentMemberIds = activeMemberIds || localMemberIds;
  const isAllMembersActive = currentMemberIds.length === 3 || currentMemberIds.length === 0;
  const isJimmyActive = currentMemberIds.includes('jimmy');
  const isSeaActive = currentMemberIds.includes('sea');
  const isAvoceanActive = currentMemberIds.includes('avocean');

  const handleSelectAllMembers = () => {
    const all = ['jimmy', 'sea', 'avocean'];
    setLocalMemberIds(all);
    if (onSetActiveMemberIds) onSetActiveMemberIds(all);
  };

  const handleToggleMember = (memberId: string) => {
    let next: string[];
    if (isAllMembersActive) {
      next = [memberId];
    } else if (currentMemberIds.includes(memberId)) {
      if (currentMemberIds.length === 1) {
        next = ['jimmy', 'sea', 'avocean'];
      } else {
        next = currentMemberIds.filter((id) => id !== memberId);
      }
    } else {
      next = [...currentMemberIds, memberId];
      if (next.length === 3) {
        next = ['jimmy', 'sea', 'avocean'];
      }
    }
    setLocalMemberIds(next);
    if (onSetActiveMemberIds) {
      onSetActiveMemberIds(next);
    } else if (onToggleMemberFilter) {
      onToggleMemberFilter(memberId);
    }
  };

  // Category & Search State
  const [selectedCategory, setSelectedCategory] = useState<'all' | ProjectCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Translation State
  const [targetLang, setTargetLang] = useState<string>(preferredTranslationLang);
  const [projectCardLangs, setProjectCardLangs] = useState<Record<string, string>>({});
  const [projectCardTranslations, setProjectCardTranslations] = useState<Record<string, Record<string, Record<string, string>>>>(() => {
    try {
      const raw = localStorage.getItem('avocean_project_card_translations_v2');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [translatingIds, setTranslatingIds] = useState<Record<string, boolean>>({});
  const [showingTranslatedIds, setShowingTranslatedIds] = useState<Record<string, boolean>>({});

  // Sync targetLang if prop changes
  useEffect(() => {
    if (preferredTranslationLang) {
      setTargetLang(preferredTranslationLang);
    }
  }, [preferredTranslationLang]);

  // Actor Profiles State (Jimmy, Avocean, Sea) - Cloud-driven from Firestore
  const [localActorProfiles, setLocalActorProfiles] = useState<Record<'jimmy' | 'avocean' | 'sea', ActorProfile>>(
    () => propActorProfiles || INITIAL_ACTOR_PROFILES
  );

  const actorProfiles = propActorProfiles || localActorProfiles;

  const setActorProfiles = (action: React.SetStateAction<Record<'jimmy' | 'avocean' | 'sea', ActorProfile>>) => {
    setLocalActorProfiles((prev) => {
      const current = propActorProfiles || prev;
      return typeof action === 'function' ? action(current) : action;
    });
  };

  // Sync if propActorProfiles changes
  useEffect(() => {
    if (propActorProfiles) {
      setLocalActorProfiles(propActorProfiles);
    }
  }, [propActorProfiles]);

  // Subscribe to live Firestore changes if not already provided by prop
  useEffect(() => {
    if (propActorProfiles) return;
    const unsub = subscribeToActorProfiles(INITIAL_ACTOR_PROFILES, (updated) => {
      setLocalActorProfiles(updated);
    });
    return () => unsub();
  }, [propActorProfiles]);

  // Quick Font Zoom per card (compact | medium | large)
  const [cardZoom, setCardZoom] = useState<Record<string, 'compact' | 'medium' | 'large'>>({
    jimmy: 'medium',
    avocean: 'medium',
    sea: 'medium'
  });

  // Global Font Zoom across all Career Projects (compact | medium | large | xl)
  const [projectFontZoom, setProjectFontZoom] = useState<'compact' | 'medium' | 'large' | 'xl'>(() => {
    try {
      const saved = localStorage.getItem('avocean_projects_font_zoom');
      if (saved === 'compact' || saved === 'medium' || saved === 'large' || saved === 'xl') return saved;
    } catch {}
    return 'medium';
  });

  // Per-project individual font zoom overrides
  const [projectCardZoom, setProjectCardZoom] = useState<Record<string, 'compact' | 'medium' | 'large' | 'xl'>>({});

  // Poster Display Mode across Projects Hub:
  // 'poster' (2:3 vertical portrait poster - shows the whole photo with faces and logos)
  // 'contain' (Auto-Fit 100% whole photo without cropping)
  // 'card' (16:10 landscape)
  const [projectPosterAspect, setProjectPosterAspect] = useState<'poster' | 'contain' | 'card'>(() => {
    try {
      const saved = localStorage.getItem('avocean_projects_poster_aspect');
      if (saved === 'poster' || saved === 'contain' || saved === 'card') return saved;
    } catch {}
    return 'poster'; // Default to full poster so the whole photo is visible as requested!
  });

  const handleUpdateProjectPosterAspect = (mode: 'poster' | 'contain' | 'card') => {
    setProjectPosterAspect(mode);
    try {
      localStorage.setItem('avocean_projects_poster_aspect', mode);
    } catch {}
    showToast(`Poster view set to ${mode === 'poster' ? 'Full Portrait Poster (Whole Photo)' : mode === 'contain' ? 'Auto-Fit (100% Visible)' : 'Landscape Card'}`);
  };

  const handleUpdateProjectFontZoom = (zoom: 'compact' | 'medium' | 'large' | 'xl') => {
    setProjectFontZoom(zoom);
    try {
      localStorage.setItem('avocean_projects_font_zoom', zoom);
    } catch {}
    showToast(`Projects font size: ${zoom.toUpperCase()}`);
  };

  // Dynamic Typography Calculator for Career Projects
  const getProjectTypography = (effectiveZoom: 'compact' | 'medium' | 'large' | 'xl') => {
    switch (effectiveZoom) {
      case 'compact':
        return {
          title: 'text-sm sm:text-base font-bold',
          subtitle: 'text-[11px] font-semibold',
          badges: 'text-[12px] sm:text-xs px-2.5 py-1 font-bold',
          meta: 'text-[10px]',
          body: 'text-[11px] leading-relaxed',
          tags: 'text-[9.5px] px-1.5 py-0.5',
          buttons: 'text-[11px] px-2.5 py-1.5'
        };
      case 'large':
        return {
          title: 'text-lg sm:text-xl md:text-2xl font-black',
          subtitle: 'text-sm sm:text-base font-bold',
          badges: 'text-sm sm:text-[15px] px-4 py-2 font-bold',
          meta: 'text-xs sm:text-[13px]',
          body: 'text-sm sm:text-base leading-relaxed',
          tags: 'text-xs px-2.5 py-1',
          buttons: 'text-xs sm:text-sm px-4 py-2 font-black'
        };
      case 'xl':
        return {
          title: 'text-xl sm:text-2xl md:text-3xl font-black',
          subtitle: 'text-base sm:text-lg font-bold',
          badges: 'text-base sm:text-lg px-5 py-2.5 font-black',
          meta: 'text-sm font-semibold',
          body: 'text-base sm:text-lg leading-relaxed',
          tags: 'text-sm px-3 py-1',
          buttons: 'text-sm sm:text-base px-5 py-2.5 font-black'
        };
      case 'medium':
      default:
        return {
          title: 'text-base sm:text-lg md:text-xl font-bold',
          subtitle: 'text-xs sm:text-sm font-semibold',
          badges: 'text-xs sm:text-[13.5px] px-3.5 py-1.5 font-bold',
          meta: 'text-[11px]',
          body: 'text-xs sm:text-[13px] leading-relaxed',
          tags: 'text-[10.5px] px-2 py-0.5',
          buttons: 'text-xs px-3.5 py-1.5'
        };
    }
  };

  // Selected translation language per card (defaults to global targetLang, or lets user pick any language)
  const [actorCardLangs, setActorCardLangs] = useState<Record<string, string>>({
    jimmy: preferredTranslationLang || 'en',
    sea: preferredTranslationLang || 'en',
    avocean: preferredTranslationLang || 'en'
  });

  // Cached full card translations: actorId -> langCode -> TranslatedCardData
  const [actorCardTranslations, setActorCardTranslations] = useState<Record<string, Record<string, Record<string, string>>>>(() => {
    try {
      const saved = localStorage.getItem('avocean_actor_card_translations_v2');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [translatingActorCard, setTranslatingActorCard] = useState<Record<string, boolean>>({});
  const [showingTranslatedCard, setShowingTranslatedCard] = useState<Record<string, boolean>>({});

  const handleTranslateActorCard = async (actorId: string, lang: string) => {
    const profile = actorProfiles[actorId as 'jimmy' | 'avocean' | 'sea'];
    if (!profile) return;

    if (actorCardTranslations[actorId]?.[lang]) {
      setShowingTranslatedCard((prev) => ({ ...prev, [actorId]: true }));
      return;
    }

    setTranslatingActorCard((prev) => ({ ...prev, [actorId]: true }));
    try {
      const items: Array<{ key: string; text: string }> = [
        { key: 'roleTitle', text: profile.roleTitle },
        { key: 'highlightChip', text: profile.highlightChip || '' },
        { key: 'birthDate', text: profile.birthDate || '' },
        { key: 'birthPlace', text: profile.birthPlace || '' },
        { key: 'education', text: profile.education || '' },
        { key: 'heightWeight', text: profile.heightWeight || '' },
        { key: 'venturesOrSkills', text: profile.venturesOrSkills || '' },
        { key: 'spouse', text: profile.spouse || '' },
        { key: 'zodiac', text: profile.zodiac || '' },
        { key: 'favoriteColors', text: profile.favoriteColors || '' },
        { key: 'favoriteFoods', text: profile.favoriteFoods || '' },
        { key: 'bio', text: profile.bio || '' },
        { key: 'quote', text: profile.quote || '' }
      ].filter((item) => item.text && item.text.trim().length > 0);

      const settled = await Promise.allSettled(
        items.map(async (item) => {
          const res = await translateText(item.text, lang);
          return { key: item.key, text: res && !res.startsWith('QUERY LENGTH') ? res : item.text };
        })
      );

      const cardResult: Record<string, string> = {};
      settled.forEach((s, idx) => {
        if (s.status === 'fulfilled' && s.value.text) {
          cardResult[s.value.key] = s.value.text;
        } else {
          cardResult[items[idx].key] = items[idx].text;
        }
      });

      setActorCardTranslations((prev) => {
        const next = {
          ...prev,
          [actorId]: {
            ...(prev[actorId] || {}),
            [lang]: cardResult
          }
        };
        try {
          localStorage.setItem('avocean_actor_card_translations_v2', JSON.stringify(next));
        } catch {}
        return next;
      });

      setShowingTranslatedCard((prev) => ({ ...prev, [actorId]: true }));
    } catch {
      showToast('Could not translate profile content.');
    } finally {
      setTranslatingActorCard((prev) => ({ ...prev, [actorId]: false }));
    }
  };

  const toggleCardTranslation = (actorId: string) => {
    setShowingTranslatedCard((prev) => ({ ...prev, [actorId]: !prev[actorId] }));
  };

  // Actor Profile Edit Modal State
  const [editingActorProfile, setEditingActorProfile] = useState<ActorProfile | null>(null);
  const [actorFormName, setActorFormName] = useState<string>('');
  const [actorFormNativeName, setActorFormNativeName] = useState<string>('');
  const [actorFormNickname, setActorFormNickname] = useState<string>('');
  const [actorFormRoleTitle, setActorFormRoleTitle] = useState<string>('');
  const [actorFormHighlightChip, setActorFormHighlightChip] = useState<string>('');
  const [actorFormAvatarUrl, setActorFormAvatarUrl] = useState<string>('');
  const [actorFormBannerPhotoUrl, setActorFormBannerPhotoUrl] = useState<string>('');
  const [actorFormBirthDate, setActorFormBirthDate] = useState<string>('');
  const [actorFormBirthPlace, setActorFormBirthPlace] = useState<string>('');
  const [actorFormEducation, setActorFormEducation] = useState<string>('');
  const [actorFormAgency, setActorFormAgency] = useState<string>('');
  const [actorFormHeightWeight, setActorFormHeightWeight] = useState<string>('');
  const [actorFormVentures, setActorFormVentures] = useState<string>('');
  const [actorFormCustomWebsites, setActorFormCustomWebsites] = useState<Array<{ id: string; label: string; url: string }>>([]);
  const [actorFormInstagramUrl, setActorFormInstagramUrl] = useState<string>('');
  const [actorFormTwitterUrl, setActorFormTwitterUrl] = useState<string>('');
  const [actorFormTiktokUrl, setActorFormTiktokUrl] = useState<string>('');
  const [actorFormSpouse, setActorFormSpouse] = useState<string>('');
  const [actorFormZodiac, setActorFormZodiac] = useState<string>('');
  const [actorFormFavoriteColors, setActorFormFavoriteColors] = useState<string>('');
  const [actorFormFavoriteFoods, setActorFormFavoriteFoods] = useState<string>('');
  const [actorFormAvatarPhotos, setActorFormAvatarPhotos] = useState<string[]>([]);
  const [actorFormNewAvatarUrlInput, setActorFormNewAvatarUrlInput] = useState<string>('');
  const [showBatchAvatarUrlInput, setShowBatchAvatarUrlInput] = useState<boolean>(false);
  const [draftBatchAvatarUrls, setDraftBatchAvatarUrls] = useState<string>('');
  const [actorFormAvatarOffsetY, setActorFormAvatarOffsetY] = useState<number>(12);
  const [actorFormAvatarFit, setActorFormAvatarFit] = useState<'cover' | 'contain'>('cover');
  const [actorFormBio, setActorFormBio] = useState<string>('');
  const [actorFormQuote, setActorFormQuote] = useState<string>('');
  const [actorFormTitleSize, setActorFormTitleSize] = useState<'compact' | 'medium' | 'large'>('medium');
  const [actorFormFactsSize, setActorFormFactsSize] = useState<'compact' | 'small' | 'medium' | 'large' | 'xl'>('medium');
  const [actorFormBioSize, setActorFormBioSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [isActorSaving, setIsActorSaving] = useState<boolean>(false);

  // Active photo index for profiles with multiple avatar photos on cards
  const [activeAvatarIndex, setActiveAvatarIndex] = useState<Record<string, number>>({});
  // Active media photo index for project cards with multiple photos/media
  const [projectCardMediaIndex, setProjectCardMediaIndex] = useState<Record<string, number>>({});

  // File upload to base64 canvas compression helper
  const compressImageFile = (file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.85): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'avatar' | 'banner') => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    try {
      if (target === 'avatar') {
        const compressedList: string[] = [];
        for (let i = 0; i < fileList.length; i++) {
          const compressed = await compressImageFile(fileList[i], 900, 900, 0.85);
          compressedList.push(compressed);
        }
        setActorFormAvatarPhotos((prev) => [...prev, ...compressedList]);
        if (!actorFormAvatarUrl && compressedList[0]) {
          setActorFormAvatarUrl(compressedList[0]);
        }
        showToast(compressedList.length === 1 ? 'Avatar photo uploaded!' : `${compressedList.length} avatar photos uploaded!`);
      } else {
        const compressed = await compressImageFile(fileList[0], 1400, 800, 0.85);
        setActorFormBannerPhotoUrl(compressed);
        showToast('Banner image uploaded and processed!');
      }
    } catch {
      showToast('Could not process image file.');
    }
  };

  const handleAddAvatarPhotoUrl = (urlInput: string) => {
    if (!urlInput.trim()) return;
    const tokens = urlInput.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
    const additions: string[] = [];
    tokens.forEach((url) => {
      if (!actorFormAvatarPhotos.includes(url) && !additions.includes(url)) {
        additions.push(url);
      }
    });
    if (additions.length === 0) {
      showToast('Photo is already in avatar list');
      return;
    }
    setActorFormAvatarPhotos((prev) => [...prev, ...additions]);
    setActorFormNewAvatarUrlInput('');
    setDraftBatchAvatarUrls('');
    setShowBatchAvatarUrlInput(false);
    showToast(additions.length === 1 ? 'Avatar photo added!' : `${additions.length} avatar photos added!`);
  };

  const handleRemoveAvatarPhoto = (idxToRemove: number) => {
    setActorFormAvatarPhotos((prev) => prev.filter((_, idx) => idx !== idxToRemove));
    showToast('Photo removed from avatar list');
  };

  const handleMoveAvatarPhoto = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= actorFormAvatarPhotos.length) return;
    setActorFormAvatarPhotos((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(fromIdx, 1);
      copy.splice(toIdx, 0, item);
      return copy;
    });
  };

  const openEditActorModal = (prof: ActorProfile) => {
    setEditingActorProfile(prof);
    setActorFormName(prof.name);
    setActorFormNativeName(prof.nativeName || '');
    setActorFormNickname(prof.nickname || '');
    setActorFormRoleTitle(prof.roleTitle || '');
    setActorFormHighlightChip(prof.highlightChip || '');
    const initialPhotos = (prof.avatarPhotos && prof.avatarPhotos.length > 0)
      ? [...prof.avatarPhotos]
      : (prof.avatarUrl ? [prof.avatarUrl] : []);
    setActorFormAvatarPhotos(initialPhotos);
    setActorFormAvatarUrl(initialPhotos[0] || prof.avatarUrl || '');
    setActorFormNewAvatarUrlInput('');
    setShowBatchAvatarUrlInput(false);
    setDraftBatchAvatarUrls('');
    setActorFormBannerPhotoUrl(prof.bannerPhotoUrl || '');
    setActorFormBirthDate(prof.birthDate || '');
    setActorFormBirthPlace(prof.birthPlace || '');
    setActorFormEducation(prof.education || '');
    setActorFormAgency(prof.agency || '');
    setActorFormHeightWeight(prof.heightWeight || '');
    setActorFormVentures(prof.venturesOrSkills || '');
    setActorFormSpouse(prof.parents || prof.spouse || '');
    setActorFormZodiac(prof.zodiac || '');
    setActorFormFavoriteColors(prof.favoriteColors || '');
    setActorFormFavoriteFoods(prof.favoriteFoods || '');
    // Calculate vertical offset percentage from avatarPosition
    let parsedOffset = 12;
    if (prof.avatarPosition) {
      const match = prof.avatarPosition.match(/(\d+)%/);
      if (match) {
        parsedOffset = parseInt(match[1], 10);
      } else if (prof.avatarPosition.includes('top')) {
        parsedOffset = 0;
      } else if (prof.avatarPosition.includes('center')) {
        parsedOffset = 50;
      } else if (prof.avatarPosition.includes('bottom')) {
        parsedOffset = 100;
      }
    }
    setActorFormAvatarOffsetY(parsedOffset);
    setActorFormAvatarFit(prof.avatarFit || 'cover');
    const loadedWebsites = (prof.customWebsites && prof.customWebsites.length > 0)
      ? prof.customWebsites.map((w, idx) => ({ id: `web-${idx}-${Date.now()}`, label: w.label || 'Website', url: w.url || '' }))
      : [];
    setActorFormCustomWebsites(loadedWebsites);
    setActorFormInstagramUrl(prof.instagramUrl || '');
    setActorFormTwitterUrl(prof.twitterUrl || '');
    setActorFormTiktokUrl(prof.tiktokUrl || '');
    setActorFormBio(prof.bio || '');
    setActorFormQuote(prof.quote || '');
    setActorFormTitleSize(prof.titleSize || 'medium');
    setActorFormFactsSize(prof.factsSize || 'medium');
    setActorFormBioSize(prof.bioSize || 'medium');
  };

  const handleAddCustomWebsite = () => {
    setActorFormCustomWebsites((prev) => [
      ...prev,
      { id: `web-${Date.now()}-${Math.random()}`, label: 'Official Website', url: '' }
    ]);
  };

  const handleUpdateCustomWebsite = (idx: number, field: 'label' | 'url', val: string) => {
    setActorFormCustomWebsites((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleRemoveCustomWebsite = (idx: number) => {
    setActorFormCustomWebsites((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveActorProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActorProfile) return;
    setIsActorSaving(true);
    try {
      let finalAvatarPhotos = [...actorFormAvatarPhotos];
      if (actorFormNewAvatarUrlInput.trim() && !finalAvatarPhotos.includes(actorFormNewAvatarUrlInput.trim())) {
        finalAvatarPhotos.push(actorFormNewAvatarUrlInput.trim());
      }
      if (finalAvatarPhotos.length === 0 && actorFormAvatarUrl.trim()) {
        finalAvatarPhotos.push(actorFormAvatarUrl.trim());
      }
      finalAvatarPhotos = finalAvatarPhotos.map((p) => p.trim()).filter(Boolean);
      const primaryAvatar = finalAvatarPhotos[0] || actorFormAvatarUrl.trim() || editingActorProfile.avatarUrl;

      const updated: ActorProfile = {
        ...editingActorProfile,
        name: actorFormName.trim(),
        nativeName: actorFormNativeName.trim() || undefined,
        nickname: actorFormNickname.trim() || undefined,
        roleTitle: actorFormRoleTitle.trim(),
        highlightChip: actorFormHighlightChip.trim() || undefined,
        avatarUrl: primaryAvatar,
        avatarPhotos: finalAvatarPhotos.length > 0 ? finalAvatarPhotos : undefined,
        bannerPhotoUrl: actorFormBannerPhotoUrl.trim() || undefined,
        birthDate: actorFormBirthDate.trim() || undefined,
        birthPlace: actorFormBirthPlace.trim() || undefined,
        education: actorFormEducation.trim() || undefined,
        agency: actorFormAgency.trim() || undefined,
        heightWeight: actorFormHeightWeight.trim() || undefined,
        venturesOrSkills: actorFormVentures.trim() || undefined,
        spouse: actorFormSpouse.trim() || undefined,
        parents: editingActorProfile.id === 'avocean' ? (actorFormSpouse.trim() || undefined) : undefined,
        zodiac: actorFormZodiac.trim() || undefined,
        favoriteColors: actorFormFavoriteColors.trim() || undefined,
        favoriteFoods: actorFormFavoriteFoods.trim() || undefined,
        avatarPosition: `center ${actorFormAvatarOffsetY}%`,
        avatarFit: actorFormAvatarFit,
        myDramaListUrl: undefined,
        customWebsites: actorFormCustomWebsites
          .map((w) => ({ label: w.label.trim() || 'Official Website', url: w.url.trim() }))
          .filter((w) => w.url.length > 0),
        instagramUrl: actorFormInstagramUrl.trim() || undefined,
        twitterUrl: actorFormTwitterUrl.trim() || undefined,
        tiktokUrl: actorFormTiktokUrl.trim() || undefined,
        bio: actorFormBio.trim(),
        quote: actorFormQuote.trim() || undefined,
        titleSize: actorFormTitleSize,
        factsSize: actorFormFactsSize,
        bioSize: actorFormBioSize
      };

      const nextProfiles = {
        ...actorProfiles,
        [editingActorProfile.id]: updated
      };

      setActorProfiles(nextProfiles);
      if (onSaveActorProfiles) {
        await onSaveActorProfiles(nextProfiles);
      } else {
        await saveActorProfilesToFirestore(nextProfiles);
      }
      showToast(`Saved ${updated.name}'s profile successfully!`);
      setEditingActorProfile(null);
    } catch {
      showToast('Could not save profile changes.');
    } finally {
      setIsActorSaving(false);
    }
  };

  // Helper classes for facts inputs in the Edit Profile modal based on chosen font size
  const getModalFactsInputClass = () => {
    if (actorFormFactsSize === 'compact') return 'text-[11px] py-1.5 px-3';
    if (actorFormFactsSize === 'small') return 'text-xs py-2 px-3.5';
    if (actorFormFactsSize === 'large') return 'text-sm sm:text-base py-3 px-4 font-semibold';
    if (actorFormFactsSize === 'xl') return 'text-base sm:text-lg py-3.5 px-4 font-bold';
    return 'text-xs sm:text-[13px] py-2.5 px-3.5';
  };

  const getModalFactsLabelClass = () => {
    if (actorFormFactsSize === 'compact') return 'text-[10.5px]';
    if (actorFormFactsSize === 'large') return 'text-xs sm:text-sm font-black';
    if (actorFormFactsSize === 'xl') return 'text-sm sm:text-base font-black';
    return 'text-xs font-bold';
  };

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProject, setEditingProject] = useState<CareerProject | null>(null);

  // Lightbox Photo Viewer & Multi-Media Carousel State
  interface LightboxGalleryState {
    url: string;
    title: string;
    photos?: string[];
    currentIndex?: number;
  }
  const [lightboxImageUrl, setLightboxImageUrl] = useState<LightboxGalleryState | null>(null);

  const navigateLightbox = (direction: 'prev' | 'next') => {
    setLightboxImageUrl((prev) => {
      if (!prev) return null;
      const photos = prev.photos && prev.photos.length > 0 ? prev.photos : [prev.url];
      if (photos.length <= 1) return prev;
      const curIdx = typeof prev.currentIndex === 'number'
        ? prev.currentIndex
        : Math.max(0, photos.indexOf(prev.url));
      const nextIdx = direction === 'next'
        ? (curIdx + 1) % photos.length
        : (curIdx - 1 + photos.length) % photos.length;
      return {
        ...prev,
        url: photos[nextIdx],
        currentIndex: nextIdx
      };
    });
  };

  // Global Arrow Keys keyboard listener for Lightbox navigation
  useEffect(() => {
    if (!lightboxImageUrl) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxImageUrl(null);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateLightbox('prev');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateLightbox('next');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImageUrl]);

  // Form Fields
  const [formTitle, setFormTitle] = useState<string>('');
  const [formThaiTitle, setFormThaiTitle] = useState<string>('');
  const [formEnglishTitle, setFormEnglishTitle] = useState<string>('');
  const [formCategory, setFormCategory] = useState<ProjectCategory>('shows');
  const isBrandProject = formCategory === 'owned_brands' || formCategory === 'partner_brands';
  const [formArtist, setFormArtist] = useState<ProjectArtist>('jimmysea');
  const [formRole, setFormRole] = useState<string>('');
  const [formJimmyRole, setFormJimmyRole] = useState<string>('');
  const [formSeaRole, setFormSeaRole] = useState<string>('');
  const [formDirector, setFormDirector] = useState<string>('');
  const [formYear, setFormYear] = useState<string>('2023–2024');
  const [formFilmedPeriod, setFormFilmedPeriod] = useState<string>('');
  const [formStatus, setFormStatus] = useState<ProjectStatus>('released');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formImageUrl, setFormImageUrl] = useState<string>('');
  const [formPlatform, setFormPlatform] = useState<string>('GMMTV / YouTube');
  const [formHighlight, setFormHighlight] = useState<string>('');
  const [formTags, setFormTags] = useState<string>('');
  const [formWatchLinks, setFormWatchLinks] = useState<ProjectLink[]>([
    { label: 'YouTube Official Playlist', url: '', platform: 'YouTube' }
  ]);
  const [formTwitterUrl, setFormTwitterUrl] = useState<string>('');
  const [formInstagramUrl, setFormInstagramUrl] = useState<string>('');
  const [formOfficialWebsiteUrl, setFormOfficialWebsiteUrl] = useState<string>('');
  const [formCustomWebsites, setFormCustomWebsites] = useState<Array<{ id: string; label: string; url: string }>>([]);

  const handleAddProjectCustomWebsite = () => {
    setFormCustomWebsites((prev) => [
      ...prev,
      { id: `proj-web-${Date.now()}-${Math.random()}`, label: 'Official Website', url: '' }
    ]);
  };

  const handleUpdateProjectCustomWebsite = (idx: number, field: 'label' | 'url', val: string) => {
    setFormCustomWebsites((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleRemoveProjectCustomWebsite = (idx: number) => {
    setFormCustomWebsites((prev) => prev.filter((_, i) => i !== idx));
  };
  const posterFileInputRef = useRef<HTMLInputElement | null>(null);
  const avatarFileInputRef = useRef<HTMLInputElement | null>(null);
  const bannerFileInputRef = useRef<HTMLInputElement | null>(null);
  const [formAvatarUrl, setFormAvatarUrl] = useState<string>('');
  const [formBannerUrl, setFormBannerUrl] = useState<string>('');
  const [isUploadingBanner, setIsUploadingBanner] = useState<boolean>(false);
  const [bannerLoadError, setBannerLoadError] = useState<boolean>(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState<boolean>(false);
  const [isUploadingPoster, setIsUploadingPoster] = useState<boolean>(false);
  const [posterLoadError, setPosterLoadError] = useState<boolean>(false);
  const [posterPreviewAspect, setPosterPreviewAspect] = useState<'card' | 'poster'>('card');
  const [formMediaPhotos, setFormMediaPhotos] = useState<string[]>([]);
  const [formActiveMediaIndex, setFormActiveMediaIndex] = useState<number>(0);
  const [formMediaFit, setFormMediaFit] = useState<'cover' | 'contain' | 'auto'>('cover');
  const [formMediaOffsetY, setFormMediaOffsetY] = useState<number>(50); // 0% to 100%
  const [formTitleSize, setFormTitleSize] = useState<'compact' | 'medium' | 'large'>('medium');
  const [formFontSize, setFormFontSize] = useState<'compact' | 'medium' | 'large'>('medium');
  const [newMediaUrlInput, setNewMediaUrlInput] = useState<string>('');

  // Handle Local Device Upload for Multiple Career Project Photos / Media with compression
  const handlePosterFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setIsUploadingPoster(true);
    setPosterLoadError(false);

    try {
      const compressedList: string[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (!file.type.startsWith('image/')) continue;
        try {
          // Compress with 1280 maxDimension, quality 0.80 to keep Firestore document compact & crisp
          const compressed = await compressImageFile(file, 1280, 1280, 0.80);
          compressedList.push(compressed);
        } catch (err) {
          console.warn('Compression fallback for file:', file.name, err);
          const raw = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (ev) => resolve((ev.target?.result as string) || '');
            reader.readAsDataURL(file);
          });
          if (raw) compressedList.push(raw);
        }
      }

      if (compressedList.length > 0) {
        setFormMediaPhotos((prev) => [...prev, ...compressedList]);
        if (!isBrandProject) {
          setFormImageUrl(compressedList[0]);
        }
        setFormActiveMediaIndex(formMediaPhotos.length);
        showToast(
          compressedList.length === 1
            ? 'Media photo added successfully!'
            : `${compressedList.length} media photos added successfully!`
        );
      }
    } catch (err) {
      console.error('Failed to compress/upload poster image:', err);
      showToast('Could not process some image files.');
    } finally {
      setIsUploadingPoster(false);
      if (posterFileInputRef.current) {
        posterFileInputRef.current.value = '';
      }
    }
  };

  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const compressed = await compressImageFile(file, 512, 512, 0.85);
      setFormAvatarUrl(compressed);
      showToast('Brand display photo uploaded successfully!');
    } catch (err) {
      console.warn('Avatar compression fallback:', err);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const res = (ev.target?.result as string) || '';
        if (res) {
          setFormAvatarUrl(res);
          showToast('Brand display photo uploaded successfully!');
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingAvatar(false);
      if (avatarFileInputRef.current) {
        avatarFileInputRef.current.value = '';
      }
    }
  };

  const handleBannerFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingBanner(true);
    setBannerLoadError(false);
    try {
      const compressed = await compressImageFile(file, 1600, 1000, 0.85);
      setFormBannerUrl(compressed);
      setFormImageUrl(compressed);
      showToast('Brand header banner uploaded successfully!');
    } catch (err) {
      console.warn('Banner compression fallback:', err);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const res = (ev.target?.result as string) || '';
        if (res) {
          setFormBannerUrl(res);
          setFormImageUrl(res);
          showToast('Brand header banner uploaded successfully!');
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingBanner(false);
      if (bannerFileInputRef.current) {
        bannerFileInputRef.current.value = '';
      }
    }
  };

  const handleAddMediaUrl = (urlInput: string) => {
    if (!urlInput.trim()) return;

    // Matches any http://, https://, or data:image/ URLs
    const urlRegex = /(https?:\/\/[^\s"',<>[\]]+|data:image\/[^\s"',<>[\]]+)/gi;
    const matched = urlInput.match(urlRegex) || [];

    // Fallback if user typed clean plain paths or comma/space separated list without protocol
    const fallbackTokens = urlInput
      .split(/[\n\r,\s;]+/)
      .map((s) => s.trim().replace(/^['"<(]+|['">)]+$/g, ''))
      .filter(Boolean);

    const candidates = matched.length > 0 ? matched : fallbackTokens;
    const cleanList = candidates
      .map((u) => u.trim().replace(/[.,;)]+$/, ''))
      .filter(Boolean);

    const additions: string[] = [];
    cleanList.forEach((url) => {
      if (!formMediaPhotos.includes(url) && !additions.includes(url)) {
        additions.push(url);
      }
    });

    if (additions.length === 0) {
      if (cleanList.length > 0) {
        showToast(cleanList.length === 1 ? 'This photo is already in the media collection' : 'All entered photos are already in the media collection');
      } else {
        showToast('Please enter a valid image URL');
      }
      return;
    }

    setFormMediaPhotos((prev) => [...prev, ...additions]);
    setNewMediaUrlInput('');
    if (!isBrandProject) {
      setFormImageUrl(additions[0]);
    }
    setFormActiveMediaIndex(formMediaPhotos.length);
    showToast(additions.length === 1 ? 'Photo added to media collection!' : `Added ${additions.length} photos at once!`);
  };

  const handleRemoveMediaPhoto = (idxToRemove: number) => {
    setFormMediaPhotos((prev) => {
      const updated = prev.filter((_, i) => i !== idxToRemove);
      if (updated.length > 0) {
        const nextIdx = Math.min(formActiveMediaIndex, updated.length - 1);
        setFormActiveMediaIndex(nextIdx);
        setFormImageUrl(updated[nextIdx]);
      } else {
        setFormImageUrl('');
        setFormActiveMediaIndex(0);
      }
      return updated;
    });
    showToast('Photo removed from media collection');
  };

  const handleMoveMediaPhoto = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= formMediaPhotos.length) return;
    setFormMediaPhotos((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(fromIdx, 1);
      copy.splice(toIdx, 0, item);
      return copy;
    });
    setFormActiveMediaIndex(toIdx);
    setFormImageUrl(formMediaPhotos[fromIdx] || formImageUrl);
  };

  const handleSetPrimaryMedia = (idx: number) => {
    if (idx === 0) return;
    setFormMediaPhotos((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.unshift(item);
      return copy;
    });
    setFormActiveMediaIndex(0);
    setFormImageUrl(formMediaPhotos[idx]);
    showToast('Set as main cover poster!');
  };

  // Translate Full Project (Title, English Title, Character Names & Roles, Director, Highlight, Synopsis, Filmed Period)
  const handleTranslateProjectCard = async (projectId: string, langToUse?: string) => {
    const proj = projects.find((p) => p.id === projectId);
    if (!proj) return;
    const lang = langToUse || projectCardLangs[projectId] || targetLang || 'en';

    // If already cached for this language, just show translated
    if (projectCardTranslations[projectId]?.[lang]) {
      setShowingTranslatedIds((prev) => ({ ...prev, [projectId]: true }));
      return;
    }

    setTranslatingIds((prev) => ({ ...prev, [projectId]: true }));
    try {
      const items: Array<{ key: string; text: string }> = [
        { key: 'title', text: proj.title || '' },
        { key: 'thaiTitle', text: proj.thaiTitle || '' },
        { key: 'englishTitle', text: proj.englishTitle || '' },
        { key: 'jimmyRole', text: proj.jimmyRole || '' },
        { key: 'seaRole', text: proj.seaRole || '' },
        { key: 'role', text: proj.role || '' },
        { key: 'director', text: proj.director || '' },
        { key: 'highlight', text: proj.highlight || '' },
        { key: 'description', text: proj.description || '' },
        { key: 'filmedPeriod', text: proj.filmedPeriod || '' }
      ].filter((item) => item.text && item.text.trim().length > 0);

      const settled = await Promise.allSettled(
        items.map(async (item) => {
          const res = await translateText(item.text, lang);
          return { key: item.key, text: res && !res.startsWith('QUERY LENGTH') ? res : item.text };
        })
      );

      const cardResult: Record<string, string> = {};
      settled.forEach((s, idx) => {
        if (s.status === 'fulfilled' && s.value.text) {
          cardResult[s.value.key] = s.value.text;
        } else {
          cardResult[items[idx].key] = items[idx].text;
        }
      });

      setProjectCardTranslations((prev) => {
        const next = {
          ...prev,
          [projectId]: {
            ...(prev[projectId] || {}),
            [lang]: cardResult
          }
        };
        try {
          localStorage.setItem('avocean_project_card_translations_v2', JSON.stringify(next));
        } catch {}
        return next;
      });

      setShowingTranslatedIds((prev) => ({ ...prev, [projectId]: true }));
    } catch {
      showToast('Could not translate project content.');
    } finally {
      setTranslatingIds((prev) => ({ ...prev, [projectId]: false }));
    }
  };

  const toggleTranslationView = (projectId: string) => {
    setShowingTranslatedIds((prev) => ({ ...prev, [projectId]: !prev[projectId] }));
  };

  // Count by category (taking into account top member filters)
  const categoryCounts = useMemo(() => {
    const memberFiltered = projects.filter((p) => {
      if (!currentMemberIds || currentMemberIds.length === 0 || currentMemberIds.length === 3) {
        return true;
      }
      if (p.artist === 'jimmysea') {
        return currentMemberIds.includes('jimmy') || currentMemberIds.includes('sea');
      }
      if (p.artist === 'jimmy') {
        return currentMemberIds.includes('jimmy');
      }
      if (p.artist === 'sea') {
        return currentMemberIds.includes('sea');
      }
      if (p.artist === 'avocean') {
        return currentMemberIds.includes('avocean');
      }
      return true;
    });

    const counts: Record<string, number> = { all: memberFiltered.length };
    PROJECT_CATEGORIES.forEach((cat) => {
      if (cat.id !== 'all') {
        counts[cat.id] = memberFiltered.filter((p) => p.category === cat.id).length;
      }
    });
    return counts;
  }, [projects, currentMemberIds]);

  // Sorting Order State ('newest' = newest on left, 'oldest' = oldest on left, 'az' = alphabetical)
  const [projectSortOrder, setProjectSortOrder] = useState<'newest' | 'oldest' | 'az'>('newest');

  // Filtered, searched and chronologically sorted projects
  const filteredProjects = useMemo(() => {
    const list = projects.filter((p) => {
      // 1. Top member filter
      if (currentMemberIds && currentMemberIds.length > 0 && currentMemberIds.length < 3) {
        if (p.artist === 'jimmysea') {
          if (!currentMemberIds.includes('jimmy') && !currentMemberIds.includes('sea')) {
            return false;
          }
        } else if (p.artist === 'jimmy') {
          if (!currentMemberIds.includes('jimmy')) return false;
        } else if (p.artist === 'sea') {
          if (!currentMemberIds.includes('sea')) return false;
        } else if (p.artist === 'avocean') {
          if (!currentMemberIds.includes('avocean')) return false;
        }
      }

      // 2. Category filter
      if (selectedCategory !== 'all' && p.category !== selectedCategory) {
        return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = p.title.toLowerCase().includes(q);
        const inThai = (p.thaiTitle || '').toLowerCase().includes(q);
        const inEng = (p.englishTitle || '').toLowerCase().includes(q);
        const inRole = (p.role || '').toLowerCase().includes(q);
        const inJimmy = (p.jimmyRole || '').toLowerCase().includes(q);
        const inSea = (p.seaRole || '').toLowerCase().includes(q);
        const inDesc = p.description.toLowerCase().includes(q);
        const inPlatform = (p.platform || '').toLowerCase().includes(q);
        const inDirector = (p.director || '').toLowerCase().includes(q);
        const inYear = (p.year || '').toLowerCase().includes(q);
        const inFilmed = (p.filmedPeriod || '').toLowerCase().includes(q);
        const inTags = (p.tags || []).some((t) => t.toLowerCase().includes(q));
        const inHighlight = (p.highlight || '').toLowerCase().includes(q);
        const inLinks = (p.watchLinks || []).some(
          (l) => l.label.toLowerCase().includes(q) || (l.platform || '').toLowerCase().includes(q)
        );
        return inTitle || inThai || inEng || inRole || inJimmy || inSea || inDirector || inDesc || inPlatform || inYear || inFilmed || inTags || inHighlight || inLinks;
      }
      return true;
    });

    // Chronological sorting: Default newest first (e.g. My Magic Prophecy on left, Vice Versa on right)
    return list.sort((a, b) => {
      if (projectSortOrder === 'oldest') {
        return getProjectChronologicalScore(a) - getProjectChronologicalScore(b);
      }
      if (projectSortOrder === 'az') {
        return (a.title || a.englishTitle || '').localeCompare(b.title || b.englishTitle || '');
      }
      // 'newest' default: newest on top-left, oldest at the end
      return getProjectChronologicalScore(b) - getProjectChronologicalScore(a);
    });
  }, [projects, currentMemberIds, selectedCategory, searchQuery, projectSortOrder]);

  // Status Filter State ('all' | 'upcoming' | 'airing' | 'active' | 'past')
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'upcoming' | 'airing' | 'active' | 'past'>('all');

  // Grid Columns Layout Preference ('3' | '2' | 'auto')
  const [projectGridColumns, setProjectGridColumns] = useState<'3' | '2' | 'auto'>(() => {
    try {
      const saved = localStorage.getItem('avocean_projects_grid_cols');
      if (saved === '3' || saved === '2' || saved === 'auto') return saved;
    } catch {}
    return '3'; // Default to 3 cards per row on laptop & desktop
  });

  const handleUpdateProjectGridColumns = (cols: '3' | '2' | 'auto') => {
    setProjectGridColumns(cols);
    try {
      localStorage.setItem('avocean_projects_grid_cols', cols);
    } catch {}
    showToast(`Grid layout: ${cols === '2' ? '2 Cards Row' : '3 Cards Row'}`);
  };

  // Helper to identify commercial ventures & endorsements vs broadcasting shows
  const isBrandProj = (p: CareerProject) =>
    p.category === 'owned_brands' || p.category === 'partner_brands';

  // Partitioned projects by status and category:
  // CRITICAL RULE: Brands are NOT television shows/movies and must NEVER be placed in Airing.
  const upcomingProjects = useMemo(
    () => filteredProjects.filter((p) => p.status === 'upcoming'),
    [filteredProjects]
  );
  const upcomingShows = useMemo(
    () => filteredProjects.filter((p) => !isBrandProj(p) && p.status === 'upcoming'),
    [filteredProjects]
  );
  const upcomingBrands = useMemo(
    () => filteredProjects.filter((p) => isBrandProj(p) && p.status === 'upcoming'),
    [filteredProjects]
  );

  // Airing shows: STRICTLY television/film series & music videos currently on-air (0 BRANDS ALLOWED)
  const airingShows = useMemo(
    () => filteredProjects.filter((p) => !isBrandProj(p) && (p.status === 'ongoing' || p.status === 'active')),
    [filteredProjects]
  );

  // Active brands: Operating commercial ventures & ongoing brand endorsements
  const activeBrands = useMemo(
    () => filteredProjects.filter((p) => isBrandProj(p) && (p.status === 'active' || p.status === 'ongoing')),
    [filteredProjects]
  );

  // Past television/film projects
  const pastShows = useMemo(
    () =>
      filteredProjects.filter(
        (p) =>
          !isBrandProj(p) &&
          (p.status === 'released' ||
            (p.status !== 'upcoming' && p.status !== 'ongoing' && p.status !== 'active'))
      ),
    [filteredProjects]
  );

  // Non-active/concluded brands
  const nonActiveBrands = useMemo(
    () =>
      filteredProjects.filter(
        (p) =>
          isBrandProj(p) &&
          (p.status === 'released' ||
            (p.status !== 'upcoming' && p.status !== 'active' && p.status !== 'ongoing'))
      ),
    [filteredProjects]
  );

  const pastProjects = useMemo(
    () =>
      filteredProjects.filter(
        (p) =>
          p.status === 'released' ||
          (p.status !== 'upcoming' && p.status !== 'ongoing' && p.status !== 'active')
      ),
    [filteredProjects]
  );

  const openAddModal = () => {
    setEditingProject(null);
    setFormTitle('');
    setFormThaiTitle('');
    setFormEnglishTitle('');
    setFormAvatarUrl('');
    setFormBannerUrl('');
    const initialCategory: ProjectCategory =
      selectedCategory === 'owned_brands' || selectedCategory === 'partner_brands'
        ? selectedCategory
        : selectedCategory !== 'all'
        ? (selectedCategory as ProjectCategory)
        : 'shows';
    setFormCategory(initialCategory);
    setFormArtist(initialCategory === 'owned_brands' ? 'avocean' : 'jimmysea');
    setFormRole('');
    setFormJimmyRole('');
    setFormSeaRole('');
    setFormDirector('');
    setFormYear('2023–2024');
    setFormFilmedPeriod('');
    setFormStatus(initialCategory === 'owned_brands' || initialCategory === 'partner_brands' ? 'active' : 'released');
    setFormDescription('');
    const isBrandInit = initialCategory === 'owned_brands' || initialCategory === 'partner_brands';
    const sampleCover = isBrandInit ? '' : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80';
    setFormImageUrl(sampleCover);
    setFormMediaPhotos(isBrandInit ? [] : [sampleCover]);
    setFormActiveMediaIndex(0);
    setFormMediaFit('cover');
    setFormMediaOffsetY(50);
    setFormTitleSize('medium');
    setFormFontSize('medium');
    setNewMediaUrlInput('');
    setFormPlatform('GMMTV / YouTube');
    setFormHighlight('');
    setFormTags('#JimmySea #Avocean');
    setFormTwitterUrl('');
    setFormInstagramUrl('');
    setFormOfficialWebsiteUrl('');
    setFormCustomWebsites([]);
    setFormWatchLinks([
      { label: 'YouTube Official Playlist', url: '', platform: 'YouTube' }
    ]);
    setPosterLoadError(false);
    setIsUploadingPoster(false);
    setIsUploadingBanner(false);
    setIsModalOpen(true);
  };

  const openEditModal = (proj: CareerProject) => {
    setEditingProject(proj);
    let resolvedTitle = proj.title;
    let resolvedThai = proj.thaiTitle ? proj.thaiTitle.trim() : '';

    // If thaiTitle wasn't explicitly saved yet, check whether existing title had Thai script
    if (!resolvedThai) {
      const hasThaiInTitle = /[\u0E00-\u0E7F]/.test(proj.title);
      const hasThaiInEng = proj.englishTitle ? /[\u0E00-\u0E7F]/.test(proj.englishTitle) : false;
      if (hasThaiInTitle && proj.englishTitle && !hasThaiInEng) {
        resolvedTitle = proj.englishTitle;
        resolvedThai = proj.title;
      } else if (hasThaiInEng && !hasThaiInTitle) {
        resolvedTitle = proj.title;
        resolvedThai = proj.englishTitle;
      } else if (hasThaiInTitle && !proj.englishTitle) {
        resolvedTitle = proj.title;
        resolvedThai = proj.title;
      }
    }

    setFormTitle(resolvedTitle);
    setFormThaiTitle(resolvedThai);
    setFormEnglishTitle(proj.englishTitle || resolvedTitle);
    setFormAvatarUrl(proj.avatarUrl || '');
    const isBrandProjItem = proj.category === 'owned_brands' || proj.category === 'partner_brands';
    const resolvedBanner = proj.bannerUrl || (isBrandProjItem ? proj.imageUrl : '');
    setFormBannerUrl(resolvedBanner || '');
    setFormCategory(proj.category);
    setFormArtist(proj.artist);

    let resolvedJimmy = proj.jimmyRole || '';
    let resolvedSea = proj.seaRole || '';
    let resolvedRole = proj.role || '';

    // If jimmyRole or seaRole is not explicitly separated but role has "Jimmy as X, Sea as Y", extract them
    if (!resolvedJimmy && resolvedRole) {
      const matchJimmy = resolvedRole.match(/Jimmy as ([^,·\n]+)/i);
      if (matchJimmy) resolvedJimmy = matchJimmy[1].trim();
    }
    if (!resolvedSea && resolvedRole) {
      const matchSea = resolvedRole.match(/Sea as ([^,·\n]+)/i);
      if (matchSea) resolvedSea = matchSea[1].trim();
    }

    setFormJimmyRole(resolvedJimmy);
    setFormSeaRole(resolvedSea);
    setFormRole(resolvedRole);
    setFormDirector(proj.director || '');
    setFormYear(proj.year || '');
    setFormFilmedPeriod(proj.filmedPeriod || '');
    setFormStatus(proj.status);
    setFormDescription(proj.description);

    let photos: string[] = [];
    if (isBrandProjItem) {
      if (proj.mediaPhotos && proj.mediaPhotos.length > 0) {
        // Filter out any legacy banner photo so Brand Media & Lookbook Gallery starts completely empty
        // unless distinct product/campaign photos have been explicitly added!
        photos = proj.mediaPhotos.filter(
          (p) =>
            p &&
            p.trim() !== (resolvedBanner || '').trim() &&
            p.trim() !== (proj.bannerUrl || '').trim() &&
            p.trim() !== (proj.imageUrl || '').trim()
        );
      } else {
        photos = [];
      }
    } else {
      photos = (proj.mediaPhotos && proj.mediaPhotos.length > 0)
        ? [...proj.mediaPhotos]
        : (proj.imageUrl ? [proj.imageUrl] : []);
    }
    setFormMediaPhotos(photos);
    setFormActiveMediaIndex(0);
    setFormMediaFit(proj.mediaFit || 'cover');
    setFormMediaOffsetY(typeof proj.mediaOffsetY === 'number' ? proj.mediaOffsetY : 50);
    setFormTitleSize(proj.titleSize || 'medium');
    setFormFontSize(proj.fontSize || 'medium');
    setNewMediaUrlInput('');
    setFormImageUrl(isBrandProjItem ? (resolvedBanner || '') : (photos[0] || proj.imageUrl || ''));

    setFormPlatform(proj.platform || '');
    setFormHighlight(proj.highlight || '');
    setFormTags((proj.tags || []).join(' '));
    setFormTwitterUrl(proj.twitterUrl || '');
    setFormInstagramUrl(proj.instagramUrl || '');
    setFormOfficialWebsiteUrl(proj.officialWebsiteUrl || '');
    setFormCustomWebsites(
      (proj.customWebsites || []).map((w, idx) => ({ id: `site-${idx}-${Date.now()}`, label: w.label || 'Official Website', url: w.url }))
    );
    // Load watchLinks or fall back to primaryLink + extraLinks
    const existingLinks = proj.watchLinks && proj.watchLinks.length > 0
      ? proj.watchLinks
      : [
          ...(proj.primaryLink ? [{ label: proj.extraLinks?.[0]?.label || 'Official Link', url: proj.primaryLink, platform: proj.platform || 'Website' }] : []),
          ...(proj.extraLinks || [])
        ];
    setFormWatchLinks(
      existingLinks.length > 0
        ? existingLinks
        : [{ label: 'Official Link', url: '', platform: 'YouTube' }]
    );
    setPosterLoadError(false);
    setIsUploadingPoster(false);
    setIsModalOpen(true);
  };

  // Watch link manipulation in modal with smart platform detection and auto-labeling
  const handleAddWatchLink = () => {
    setFormWatchLinks((prev) => [
      ...prev,
      { label: 'Viki', url: '', platform: 'Viki' }
    ]);
  };

  const handleUpdateWatchLink = (idx: number, field: keyof ProjectLink, val: string) => {
    setFormWatchLinks((prev) => {
      const updated = [...prev];
      const current = { ...updated[idx] };

      if (field === 'url') {
        current.url = val;
        // Auto-detect platform and label when a URL is pasted
        const detected = detectProjectWatchPlatform(val);
        if (detected) {
          current.platform = detected.platform;
          const prevLabel = (current.label || '').trim().toLowerCase();
          const isGenericOrPlatformName =
            !prevLabel ||
            prevLabel === 'watch / official link' ||
            prevLabel === 'official link' ||
            prevLabel === 'youtube' ||
            PROJECT_WATCH_PLATFORMS.some(
              (p) => p.value.toLowerCase() === prevLabel || p.label.toLowerCase() === prevLabel
            );
          if (isGenericOrPlatformName) {
            current.label = detected.label;
          }
        }
      } else if (field === 'platform') {
        const prevPlatform = current.platform;
        current.platform = val;
        // Automatically sync the label if the previous label was generic or matched the previous platform
        const prevLabel = (current.label || '').trim().toLowerCase();
        const wasGenericOrPreviousPlatform =
          !prevLabel ||
          prevLabel === 'watch / official link' ||
          prevLabel === 'official link' ||
          prevLabel === (prevPlatform || '').toLowerCase() ||
          PROJECT_WATCH_PLATFORMS.some(
            (p) => p.value.toLowerCase() === prevLabel || p.label.toLowerCase() === prevLabel
          );
        if (wasGenericOrPreviousPlatform) {
          const matched = PROJECT_WATCH_PLATFORMS.find((p) => p.value === val);
          current.label = matched?.value || val;
        }
      } else {
        current[field] = val;
      }

      updated[idx] = current;
      return updated;
    });
  };

  const handleRemoveWatchLink = (idx: number) => {
    setFormWatchLinks((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showToast('Please enter the project or brand title');
      return;
    }

    const tagsArray = formTags
      .split(/\s+/)
      .map((t) => (t.startsWith('#') ? t : `#${t}`))
      .filter((t) => t.length > 1);

    const validWatchLinks = formWatchLinks
      .map((l) => {
        const platform = l.platform || 'Website';
        const label = l.label.trim() || platform;
        return { ...l, label, platform, url: l.url.trim() };
      })
      .filter((l) => l.url.length > 0);

    const trimmedJimmy = formJimmyRole.trim();
    const trimmedSea = formSeaRole.trim();
    let trimmedRole = formRole.trim();

    // If trimmedRole is empty but Jimmy and/or Sea character names are provided, auto-format
    if (!trimmedRole && (trimmedJimmy || trimmedSea)) {
      const parts: string[] = [];
      if (trimmedJimmy) {
        parts.push(trimmedJimmy.toLowerCase().startsWith('jimmy as') ? trimmedJimmy : `Jimmy as ${trimmedJimmy}`);
      }
      if (trimmedSea) {
        parts.push(trimmedSea.toLowerCase().startsWith('sea as') ? trimmedSea : `Sea as ${trimmedSea}`);
      }
      trimmedRole = parts.join(', ');
    }

    const normalizeSocialUrl = (urlStr: string, platformType: 'x' | 'instagram') => {
      const trimmed = urlStr.trim();
      if (!trimmed) return undefined;
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
      const cleanHandle = trimmed.replace(/^@/, '');
      if (platformType === 'x') return `https://x.com/${cleanHandle}`;
      if (platformType === 'instagram') return `https://instagram.com/${cleanHandle}`;
      return trimmed;
    };

    const validCustomWebsites = formCustomWebsites
      .map((w) => ({ label: w.label.trim() || 'Official Website', url: w.url.trim() }))
      .filter((w) => w.url.length > 0);

    const isBrand = formCategory === 'owned_brands' || formCategory === 'partner_brands';

    const cleanMedia = formMediaPhotos.map((p) => p.trim()).filter(Boolean);
    const bannerToSave = isBrand
      ? (formBannerUrl.trim() || formImageUrl.trim() || undefined)
      : undefined;

    const primaryPoster = isBrand
      ? (bannerToSave || (cleanMedia[0] || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80'))
      : (cleanMedia[0] || formImageUrl.trim() || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80');

    const projectToSave: CareerProject = {
      id: editingProject ? editingProject.id : `proj-${formCategory}-${Date.now()}`,
      title: formTitle.trim(),
      thaiTitle: formThaiTitle.trim() || undefined,
      englishTitle: formTitle.trim(),
      category: formCategory,
      artist: formArtist,
      avatarUrl: formAvatarUrl.trim() || undefined,
      bannerUrl: bannerToSave,
      role: !isBrand ? (trimmedRole || undefined) : undefined,
      jimmyRole: !isBrand ? (trimmedJimmy || undefined) : undefined,
      seaRole: !isBrand ? (trimmedSea || undefined) : undefined,
      director: !isBrand ? (formDirector.trim() || undefined) : undefined,
      year: !isBrand ? (formYear.trim() || undefined) : undefined,
      filmedPeriod: !isBrand ? (formFilmedPeriod.trim() || undefined) : undefined,
      status: formStatus,
      description: formDescription.trim(),
      imageUrl: primaryPoster,
      mediaPhotos: cleanMedia.length > 0 ? cleanMedia : undefined,
      mediaFit: formMediaFit,
      mediaPosition: `center ${formMediaOffsetY}%`,
      mediaOffsetY: formMediaOffsetY,
      titleSize: formTitleSize,
      fontSize: formFontSize,
      platform: !isBrand ? (formPlatform.trim() || undefined) : undefined,
      primaryLink: validWatchLinks[0]?.url || undefined,
      extraLinks: validWatchLinks.length > 1 ? validWatchLinks.slice(1) : undefined,
      watchLinks: validWatchLinks.length > 0 ? validWatchLinks : undefined,
      twitterUrl: normalizeSocialUrl(formTwitterUrl, 'x'),
      instagramUrl: normalizeSocialUrl(formInstagramUrl, 'instagram'),
      officialWebsiteUrl: formOfficialWebsiteUrl.trim() || undefined,
      customWebsites: validCustomWebsites.length > 0 ? validCustomWebsites : undefined,
      highlight: !isBrand ? (formHighlight.trim() || undefined) : undefined,
      tags: tagsArray.length > 0 ? tagsArray : undefined,
      updatedAt: new Date().toISOString()
    };

    onSaveProject(projectToSave);
    setIsModalOpen(false);
  };

  const handleDelete = (proj: CareerProject) => {
    if (window.confirm(`Are you sure you want to remove "${proj.title}" from the projects list?`)) {
      onDeleteProject(proj.id);
    }
  };

  const getArtistLabel = (artist: ProjectArtist) => {
    switch (artist) {
      case 'jimmysea':
        return {
          label: 'JimmySea',
          emoji: '🥑🌊',
          bg: 'bg-gradient-to-r from-purple-100 via-indigo-50 to-sky-100 dark:from-purple-950/90 dark:via-indigo-950/80 dark:to-sky-950/90 text-purple-950 dark:text-sky-100 border-purple-300/90 dark:border-indigo-600 font-extrabold shadow-2xs'
        };
      case 'jimmy':
        return { label: 'Jimmy Jitaraphol', emoji: '🥑', bg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' };
      case 'sea':
        return { label: 'Sea Tawinan', emoji: '🌊', bg: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800' };
      case 'avocean':
        return { label: 'Avocean Community', emoji: '🥑💚', bg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' };
    }
  };

  const getCategoryIcon = (category: ProjectCategory) => {
    switch (category) {
      case 'shows':
        return <Tv className="w-3.5 h-3.5" />;
      case 'movies':
        return <Film className="w-3.5 h-3.5" />;
      case 'music_videos':
        return <Music className="w-3.5 h-3.5" />;
      case 'partner_brands':
        return <Sparkles className="w-3.5 h-3.5" />;
      case 'owned_brands':
        return <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
    }
  };

  const getCategoryBadge = (category: ProjectCategory) => {
    switch (category) {
      case 'shows':
        return 'Series & Shows';
      case 'movies':
        return 'Movie / Film';
      case 'music_videos':
        return 'Music Video';
      case 'partner_brands':
        return 'Partner Brand';
      case 'owned_brands':
        return 'Owned Brand';
    }
  };

  const getCategoryBadgeStyle = (category: ProjectCategory) => {
    switch (category) {
      case 'owned_brands':
        return 'bg-gradient-to-r from-amber-200/90 via-yellow-100 to-amber-200/90 dark:from-amber-950/90 dark:via-yellow-950/80 dark:to-amber-900/90 text-amber-950 dark:text-amber-100 border-2 border-amber-400 dark:border-amber-500 shadow-xs font-black tracking-wider';
      case 'partner_brands':
        return 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold';
      case 'shows':
        return 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-bold';
      case 'movies':
        return 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold';
      case 'music_videos':
        return 'bg-pink-100 dark:bg-pink-950/80 text-pink-800 dark:text-pink-300 border border-pink-200 dark:border-pink-800 font-bold';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 font-bold';
    }
  };

  const getStatusBadge = (status: ProjectStatus, category?: ProjectCategory) => {
    const isBrand = category === 'owned_brands' || category === 'partner_brands';
    if (isBrand) {
      switch (status) {
        case 'active':
        case 'ongoing':
          return { label: 'Active', color: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' };
        case 'upcoming':
          return { label: 'Upcoming', color: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800' };
        case 'released':
        default:
          return { label: 'Non-Active', color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700' };
      }
    }
    switch (status) {
      case 'upcoming':
        return { label: 'Upcoming', color: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800' };
      case 'ongoing':
      case 'active':
        return { label: 'Airing', color: 'bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800' };
      case 'released':
      default:
        return { label: 'Past Projects', color: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' };
    }
  };

  const getPlatformIcon = (platformStr?: string) => {
    const p = (platformStr || '').toLowerCase();
    if (p.includes('trailer') || p.includes('teaser') || p.includes('pilot')) return '🎬';
    if (p.includes('viki')) return '🟣';
    if (p.includes('iqiyi') || p.includes('iq.com')) return '🟢';
    if (p.includes('viu')) return '🟡';
    if (p.includes('gagaoolala')) return '🌈';
    if (p.includes('youtube')) return '▶️';
    if (p.includes('spotify')) return '🟢';
    if (p.includes('apple')) return '🍎';
    if (p.includes('netflix')) return '🍿';
    if (p.includes('gmmtv') || p.includes('gmm-tv')) return '🎬';
    if (p.includes('disney') || p.includes('hotstar')) return '✨';
    if (p.includes('wetv')) return '🟠';
    if (p.includes('trueid')) return '🔴';
    if (p.includes('one31') || p.includes('oned')) return '📺';
    if (p.includes('instagram') || p.includes('ig')) return '📸';
    if (p.includes('shop') || p.includes('merch') || p.includes('line shopping')) return '🛍️';
    if (p.includes('x') || p.includes('twitter')) return '🐦';
    return '🔗';
  };

  return (
    <div className={`w-full ${containerWidthClass || 'max-w-[1780px] 2xl:max-w-[1920px] 3xl:max-w-[2160px] px-3 sm:px-6 md:px-8 xl:px-10 mx-auto'} flex flex-col gap-6 animate-in fade-in duration-200 pb-24`}>
      {/* ============================================================== */}
      {/* 1. ACTOR & COMMUNITY PROFILES (JIMMY · AVOCEAN · SEA)          */}
      {/* Left: Jimmy | Middle: Avocean | Right: Sea                     */}
      {/* ============================================================== */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <span>Artist & Community Profiles</span>
            </span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span>Translate via:</span>
            <select
              value={targetLang}
              onChange={(e) => {
                setTargetLang(e.target.value);
                if (onSelectTranslationLang) onSelectTranslationLang(e.target.value);
              }}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg px-2 py-0.5 text-xs font-semibold focus:outline-hidden"
            >
              {TRANSLATION_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Render Profile Banner Function */}
        {(() => {
          const renderProfileBanner = (key: 'jimmy' | 'avocean' | 'sea') => {
            const profile = actorProfiles[key] || INITIAL_ACTOR_PROFILES[key];
            const zoom = cardZoom[key] || profile.bioSize || 'medium';
            const cardLang = actorCardLangs[key] || targetLang || 'en';
            const isTranslating = translatingActorCard[key];
            const isShowingTranslated = showingTranslatedCard[key];
            const trans = actorCardTranslations[key]?.[cardLang];

            const currentRole = (isShowingTranslated && trans?.roleTitle) ? trans.roleTitle : profile.roleTitle;
            const currentHighlight = (isShowingTranslated && trans?.highlightChip) ? trans.highlightChip : profile.highlightChip;
            const currentBirthDate = (isShowingTranslated && trans?.birthDate) ? trans.birthDate : profile.birthDate;
            const currentBirthPlace = (isShowingTranslated && trans?.birthPlace) ? trans.birthPlace : profile.birthPlace;
            const currentEducation = (isShowingTranslated && trans?.education) ? trans.education : profile.education;
            const currentStats = (isShowingTranslated && trans?.heightWeight) ? trans.heightWeight : profile.heightWeight;
            const currentVentures = (isShowingTranslated && trans?.venturesOrSkills) ? trans.venturesOrSkills : profile.venturesOrSkills;
            const currentSpouse = (isShowingTranslated && trans?.spouse) ? trans.spouse : profile.spouse;
            const currentZodiac = (isShowingTranslated && trans?.zodiac) ? trans.zodiac : profile.zodiac;
            const currentColors = (isShowingTranslated && trans?.favoriteColors) ? trans.favoriteColors : profile.favoriteColors;
            const currentFoods = (isShowingTranslated && trans?.favoriteFoods) ? trans.favoriteFoods : profile.favoriteFoods;
            const currentBio = (isShowingTranslated && trans?.bio) ? trans.bio : profile.bio;
            const currentQuote = (isShowingTranslated && trans?.quote) ? trans.quote : profile.quote;

            // Title font size class based on profile settings
            const getTitleSizeClass = () => {
              const base = profile.titleSize || 'medium';
              if (base === 'compact') return 'text-lg sm:text-xl';
              if (base === 'large') return 'text-2xl sm:text-3xl';
              return 'text-xl sm:text-2xl';
            };

            // Key Facts & Information font size (scales with both profile setting and card zoom)
            const getFactsSizeClass = () => {
              const base = profile.factsSize || 'medium';
              if (zoom === 'compact') {
                if (base === 'compact') return 'text-[10px] leading-snug';
                if (base === 'small') return 'text-[10.5px] leading-snug';
                if (base === 'large') return 'text-xs sm:text-sm leading-normal';
                if (base === 'xl') return 'text-sm sm:text-base leading-normal';
                return 'text-[11px] sm:text-xs leading-normal';
              }
              if (zoom === 'large') {
                if (base === 'compact') return 'text-xs sm:text-sm leading-normal';
                if (base === 'small') return 'text-sm sm:text-base leading-normal';
                if (base === 'large') return 'text-base sm:text-lg leading-relaxed';
                if (base === 'xl') return 'text-lg sm:text-xl leading-relaxed';
                return 'text-sm sm:text-base leading-relaxed';
              }
              if (base === 'compact') return 'text-[11px] leading-snug';
              if (base === 'small') return 'text-xs leading-normal';
              if (base === 'large') return 'text-sm sm:text-base leading-normal';
              if (base === 'xl') return 'text-base sm:text-lg leading-relaxed';
              return 'text-xs sm:text-[13px] leading-normal';
            };

            const getFactsIconClass = () => {
              const base = profile.factsSize || 'medium';
              if (zoom === 'large' || base === 'large' || base === 'xl') return 'w-4 h-4 shrink-0 mt-0.5';
              return 'w-3.5 h-3.5 shrink-0 mt-0.5';
            };

            const getBioSizeClass = () => {
              if (zoom === 'compact') return 'text-xs leading-relaxed';
              if (zoom === 'large') return 'text-base sm:text-lg leading-relaxed';
              return 'text-sm leading-relaxed';
            };

            const getActorAccent = () => {
              if (key === 'jimmy') return { border: 'border-purple-200 dark:border-purple-900/60', badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300', emoji: '🥑', ring: 'ring-purple-200 dark:ring-purple-900/50', bg: 'from-purple-500/20 via-purple-500/10 to-indigo-500/20' };
              if (key === 'sea') return { border: 'border-sky-200 dark:border-sky-900/60', badge: 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300', emoji: '🌊', ring: 'ring-sky-200 dark:ring-sky-900/50', bg: 'from-sky-500/20 via-sky-500/10 to-blue-500/20' };
              return { border: 'border-emerald-200 dark:border-emerald-900/60', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300', emoji: '🥑💚', ring: 'ring-emerald-200 dark:ring-emerald-900/50', bg: 'from-emerald-500/20 via-teal-500/10 to-green-500/20' };
            };

            const accent = getActorAccent();

            return (
              <div
                key={key}
                className={`bg-white/95 dark:bg-slate-900/95 rounded-[28px] overflow-hidden border ${accent.border} shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-full p-5 sm:p-6`}
              >
                <div className="space-y-4">
                  {/* Top Action Bar: Tag Badge, Font Zoom, and Admin Edit */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-xs ${accent.badge}`}>
                      <span>{accent.emoji}</span>
                      <span>{key === 'jimmy' ? 'Jimmy Jitaraphol' : key === 'sea' ? 'Sea Tawinan' : 'AVOCEAN Community'}</span>
                    </span>

                    <div className="flex items-center gap-2">
                      {/* Font Zoom Controls (A- / A / A+) */}
                      <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 rounded-full px-2 py-0.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold">
                        <button
                          type="button"
                          title="Compact Text"
                          onClick={() => setCardZoom((prev) => ({ ...prev, [key]: 'compact' }))}
                          className={`px-1.5 py-0.5 rounded cursor-pointer ${zoom === 'compact' ? 'bg-purple-600 text-white shadow-xs' : 'hover:text-purple-600'}`}
                        >
                          A-
                        </button>
                        <span className="text-slate-300 dark:text-slate-600 px-0.5">|</span>
                        <button
                          type="button"
                          title="Medium Text"
                          onClick={() => setCardZoom((prev) => ({ ...prev, [key]: 'medium' }))}
                          className={`px-1.5 py-0.5 rounded cursor-pointer ${zoom === 'medium' ? 'bg-purple-600 text-white shadow-xs' : 'hover:text-purple-600'}`}
                        >
                          A
                        </button>
                        <span className="text-slate-300 dark:text-slate-600 px-0.5">|</span>
                        <button
                          type="button"
                          title="Large Text"
                          onClick={() => setCardZoom((prev) => ({ ...prev, [key]: 'large' }))}
                          className={`px-1.5 py-0.5 rounded cursor-pointer ${zoom === 'large' ? 'bg-purple-600 text-white shadow-xs' : 'hover:text-purple-600'}`}
                        >
                          A+
                        </button>
                      </div>

                      {/* Admin / Owner Edit Profile */}
                      {(canEdit || isOwner) && (
                        <button
                          type="button"
                          onClick={() => openEditActorModal(profile)}
                          title="Edit Profile Information & Photos"
                          className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Profile Header with BIGGER Avatar Photo (No backdrop banner) */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-1">
                    {/* Bigger Avatar Photo with adjustable objectPosition so head isn't cut off */}
                    {/* Multi-Photo Avatar Portrait with interactive gallery navigation & framing */}
                    {(() => {
                      const allAvatarPhotos = (profile.avatarPhotos && profile.avatarPhotos.length > 0)
                        ? profile.avatarPhotos.filter(Boolean)
                        : (profile.avatarUrl ? [profile.avatarUrl] : []);
                      const currentAvatarIdx = (activeAvatarIndex[key] ?? 0) % (allAvatarPhotos.length || 1);
                      const activeAvatarPhoto = allAvatarPhotos[currentAvatarIdx] || profile.avatarUrl;

                      const emojiFallback = key === 'jimmy' ? '🥑' : key === 'sea' ? '🌊' : '🥑🌊';

                      return (
                        <div className="flex flex-col items-center gap-1.5 shrink-0">
                          <div
                            className={`relative group/avatar ${activeAvatarPhoto ? 'cursor-pointer' : ''} shrink-0 select-none overflow-hidden rounded-3xl`}
                            onClick={() => {
                              if (activeAvatarPhoto) {
                                setLightboxImageUrl({
                                  url: activeAvatarPhoto,
                                  title: `${profile.name}${allAvatarPhotos.length > 1 ? ` (${currentAvatarIdx + 1}/${allAvatarPhotos.length})` : ''}`,
                                  photos: allAvatarPhotos.length > 0 ? allAvatarPhotos : [activeAvatarPhoto],
                                  currentIndex: currentAvatarIdx
                                });
                              }
                            }}
                          >
                            {activeAvatarPhoto ? (
                              <img
                                src={activeAvatarPhoto}
                                alt={`${profile.name} - Photo ${currentAvatarIdx + 1}`}
                                style={{
                                  objectPosition: profile.avatarPosition || 'center 12%',
                                  objectFit: profile.avatarFit || 'cover'
                                }}
                                className={`w-28 h-28 sm:w-36 sm:h-36 rounded-3xl object-cover shadow-md ring-4 ${accent.ring} bg-slate-100 dark:bg-slate-800 transition-transform duration-300 group-hover/avatar:scale-105`}
                              />
                            ) : (
                              <div
                                className={`w-28 h-28 sm:w-36 sm:h-36 rounded-3xl flex flex-col items-center justify-center p-2 text-center shadow-md ring-4 ${accent.ring} bg-gradient-to-br ${accent.bg} transition-transform duration-300 group-hover/avatar:scale-105`}
                              >
                                <span className="text-3xl sm:text-4xl select-none mb-1">{emojiFallback}</span>
                                <span className="text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-200 line-clamp-1">{profile.nickname || profile.name}</span>
                              </div>
                            )}

                            {/* Multi-Photo Counter Badge */}
                            {allAvatarPhotos.length > 1 && (
                              <div className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/70 text-white text-[10px] font-black backdrop-blur-xs shadow-xs">
                                <ImageIcon className="w-2.5 h-2.5 text-purple-300" />
                                <span>{currentAvatarIdx + 1}/{allAvatarPhotos.length}</span>
                              </div>
                            )}

                            {/* Left & Right Switcher Arrows for Multiple Photos */}
                            {allAvatarPhotos.length > 1 && (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const nextIdx = (currentAvatarIdx - 1 + allAvatarPhotos.length) % allAvatarPhotos.length;
                                    setActiveAvatarIndex((prev) => ({ ...prev, [key]: nextIdx }));
                                  }}
                                  className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-xs transition-all opacity-80 group-hover/avatar:opacity-100 shadow-md z-10 cursor-pointer active:scale-95"
                                  title="Previous avatar photo"
                                >
                                  <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const nextIdx = (currentAvatarIdx + 1) % allAvatarPhotos.length;
                                    setActiveAvatarIndex((prev) => ({ ...prev, [key]: nextIdx }));
                                  }}
                                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-xs transition-all opacity-80 group-hover/avatar:opacity-100 shadow-md z-10 cursor-pointer active:scale-95"
                                  title="Next avatar photo"
                                >
                                  <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                                </button>
                              </>
                            )}

                            {/* Hover overlay with zoom icon */}
                            <div className="absolute inset-0 bg-black/30 rounded-3xl opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center text-white transition-opacity pointer-events-none">
                              <Maximize2 className="w-5 h-5 drop-shadow-md" />
                            </div>
                          </div>

                          {/* Mini Thumbnail Dots for Multi-Photos */}
                          {allAvatarPhotos.length > 1 && (
                            <div className="flex items-center gap-1 pt-0.5">
                              {allAvatarPhotos.map((_, pIdx) => (
                                <button
                                  key={pIdx}
                                  type="button"
                                  onClick={() => setActiveAvatarIndex((prev) => ({ ...prev, [key]: pIdx }))}
                                  className={`transition-all rounded-full cursor-pointer ${
                                    pIdx === currentAvatarIdx
                                      ? 'w-4 h-1.5 bg-purple-600 dark:bg-purple-400'
                                      : 'w-1.5 h-1.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                                  }`}
                                  title={`Photo #${pIdx + 1}`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Names & Roles Header */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <h3 className={`${getTitleSizeClass()} font-black text-[#1A3668] dark:text-white tracking-tight`}>
                        {profile.name}
                      </h3>

                      <div className="flex items-center gap-2 flex-wrap">
                        {profile.nativeName && (
                          <span className="text-xs sm:text-sm font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2.5 py-0.5 rounded-lg border border-purple-100 dark:border-purple-900/40 font-thai">
                            🇹🇭 {profile.nativeName}
                          </span>
                        )}
                        {profile.nickname && (
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            ({profile.nickname})
                          </span>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                        {currentRole}
                      </p>

                      {currentHighlight && (
                        <div className="pt-0.5">
                          <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 leading-tight">
                            {currentHighlight}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* TRANSLATE EVERYTHING INSIDE CARD BAR (Select ANY language) */}
                  <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shrink-0">
                        <Languages className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span>Language:</span>
                      </span>
                      <select
                        value={cardLang}
                        onChange={(e) => {
                          const newLang = e.target.value;
                          setActorCardLangs((prev) => ({ ...prev, [key]: newLang }));
                          if (isShowingTranslated) {
                            handleTranslateActorCard(key, newLang);
                          }
                        }}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-hidden"
                      >
                        {TRANSLATION_LANGUAGES.map((l) => (
                          <option key={l.code} value={l.code}>
                            {l.flag} {l.name} ({l.nativeName})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isShowingTranslated && (
                        <button
                          type="button"
                          onClick={() => toggleCardTranslation(key)}
                          className="px-2.5 py-1 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Original</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (isShowingTranslated) {
                            toggleCardTranslation(key);
                          } else {
                            handleTranslateActorCard(key, cardLang);
                          }
                        }}
                        disabled={isTranslating}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black cursor-pointer transition-all ${
                          isShowingTranslated
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                            : 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs'
                        } disabled:opacity-50`}
                      >
                        {isTranslating ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Translating...</span>
                          </>
                        ) : isShowingTranslated ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Translated ({cardLang.toUpperCase()})</span>
                          </>
                        ) : (
                          <>
                            <Languages className="w-3.5 h-3.5" />
                            <span>Translate Everything</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Key Facts Grid (Scales with factsSize setting and card zoom!) */}
                  <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2.5 ${getFactsSizeClass()} pt-1 transition-all`}>
                    {currentBirthDate && (
                      <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-300">
                        <Calendar className={`${getFactsIconClass()} text-slate-400`} />
                        <span className="font-bold text-slate-400 dark:text-slate-500 shrink-0">Born:</span>
                        <span className="font-medium">{currentBirthDate}</span>
                      </div>
                    )}
                    {currentBirthPlace && (
                      <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-300">
                        <MapPin className={`${getFactsIconClass()} text-slate-400`} />
                        <span className="font-bold text-slate-400 dark:text-slate-500 shrink-0">Birthplace:</span>
                        <span className="font-medium">{currentBirthPlace}</span>
                      </div>
                    )}
                    {currentEducation && (
                      <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-300 sm:col-span-2">
                        <GraduationCap className={`${getFactsIconClass()} text-slate-400`} />
                        <span className="font-bold text-slate-400 dark:text-slate-500 shrink-0">Education:</span>
                        <span className="font-medium">{currentEducation}</span>
                      </div>
                    )}
                    {currentStats && (
                      <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-300">
                        <Award className={`${getFactsIconClass()} text-slate-400`} />
                        <span className="font-bold text-slate-400 dark:text-slate-500 shrink-0">Stats:</span>
                        <span className="font-medium">{currentStats}</span>
                      </div>
                    )}
                    {profile.agency && (
                      <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-300">
                        <Sparkles className={`${getFactsIconClass()} text-purple-400`} />
                        <span className="font-bold text-slate-400 dark:text-slate-500 shrink-0">Agency:</span>
                        <span className="font-medium">{profile.agency}</span>
                      </div>
                    )}
                    {currentVentures && (
                      <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-300 sm:col-span-2">
                        <Crown className={`${getFactsIconClass()} text-amber-500`} />
                        <span className="font-bold text-slate-400 dark:text-slate-500 shrink-0">Ventures:</span>
                        <span className="font-semibold text-amber-700 dark:text-amber-400">{currentVentures}</span>
                      </div>
                    )}
                    {currentZodiac && (
                      <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-300">
                        <Compass className={`${getFactsIconClass()} text-indigo-500`} />
                        <span className="font-bold text-slate-400 dark:text-slate-500 shrink-0">𝗭𝗼𝗱𝗶𝗮𝗰 Sign:</span>
                        <span className="font-medium">{currentZodiac}</span>
                      </div>
                    )}
                    {currentColors && (
                      <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-300">
                        <Palette className={`${getFactsIconClass()} text-fuchsia-500`} />
                        <span className="font-bold text-slate-400 dark:text-slate-500 shrink-0">𝗙𝗮𝘃𝗼𝗿𝗶𝘁𝗲 C𝗼𝗹𝗼𝗿/s:</span>
                        <span className="font-medium">{currentColors}</span>
                      </div>
                    )}
                    {currentFoods && (
                      <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-300 sm:col-span-2">
                        <Utensils className={`${getFactsIconClass()} text-orange-500`} />
                        <span className="font-bold text-slate-400 dark:text-slate-500 shrink-0">𝗙𝗮𝘃𝗼𝗿𝗶𝘁𝗲 F𝗼𝗼𝗱s:</span>
                        <span className="font-medium">{currentFoods}</span>
                      </div>
                    )}
                    {currentSpouse && (
                      <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-300 sm:col-span-2">
                        <Heart className={`${getFactsIconClass()} text-rose-500 fill-rose-500/20`} />
                        <span className="font-bold text-slate-400 dark:text-slate-500 shrink-0">
                          {key === 'avocean' ? 'Parents:' : 'Spouse / Partner:'}
                        </span>
                        <span className="font-semibold text-rose-700 dark:text-rose-400">{currentSpouse}</span>
                      </div>
                    )}
                  </div>

                  {/* Biography Section (Translated!) */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Biography
                    </span>
                    <p className={`${getBioSizeClass()} font-normal text-slate-600 dark:text-slate-300 transition-all`}>
                      {currentBio}
                    </p>
                  </div>

                  {/* Motto / Signature Quote (Translated!) */}
                  {currentQuote && (
                    <div className="p-2.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/50 text-xs italic text-purple-900 dark:text-purple-200 flex items-start gap-1.5">
                      <Quote className="w-3.5 h-3.5 shrink-0 mt-0.5 text-purple-500" />
                      <span>&ldquo;{currentQuote}&rdquo;</span>
                    </div>
                  )}
                </div>

                {/* Footer Social & Media Links */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* User-defined Websites & Official Links */}
                    {profile.customWebsites && profile.customWebsites.map((site, sIdx) => {
                      if (!site.url) return null;
                      return (
                        <a
                          key={sIdx}
                          href={site.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200 dark:border-purple-800 transition-all cursor-pointer shadow-2xs"
                          title={site.label || site.url}
                        >
                          <Globe className="w-3 h-3 text-purple-500" />
                          <span>{site.label || 'Website'}</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                        </a>
                      );
                    })}

                    {profile.instagramUrl && (
                      <a
                        href={profile.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-pink-50 text-pink-700 hover:bg-pink-100 dark:bg-pink-950/70 dark:text-pink-300 border border-pink-200 dark:border-pink-800 transition-all cursor-pointer"
                        title="Instagram"
                      >
                        <span>📸 IG</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                    {profile.twitterUrl && (
                      <a
                        href={profile.twitterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 transition-all cursor-pointer"
                        title="X / Twitter"
                      >
                        <span>𝕏</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                    {profile.tiktokUrl && (
                      <a
                        href={profile.tiktokUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                        title="TikTok"
                      >
                        <span>🎵 TikTok</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>

                  {(canEdit || isOwner) && (
                    <button
                      type="button"
                      onClick={() => openEditActorModal(profile)}
                      className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit Profile</span>
                    </button>
                  )}
                </div>
              </div>
            );
          };

          return (
            <div className="space-y-5">
              {/* Top Row: Jimmy (Left) & Sea (Right) */}
              <div className="grid grid-cols-1 md:grid-cols-2 landscape:grid-cols-2 gap-4 sm:gap-5 xl:gap-6 items-stretch">
                <div>{renderProfileBanner('jimmy')}</div>
                <div>{renderProfileBanner('sea')}</div>
              </div>

              {/* Duo Connector Badge */}
              <div className="flex items-center justify-center -my-2 relative z-10">
                <div className="px-4 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 backdrop-blur-md">
                  <span>🥑 Jimmy</span>
                  <span className="text-purple-500 font-black">+</span>
                  <span>🌊 Sea</span>
                  <span className="text-slate-400 font-bold">=</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-black flex items-center gap-1">
                    <span>💚</span>
                    <span>AVOCEAN</span>
                  </span>
                </div>
              </div>

              {/* Bottom Row: Avocean below both in the middle */}
              <div className="flex justify-center w-full">
                <div className="w-full md:w-5/6 lg:w-3/4">
                  {renderProfileBanner('avocean')}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ============================================================== */}
      {/* 2. HERO HEADER: PROJECTS & CAREER PORTFOLIO                    */}
      {/* ============================================================== */}
      <div className="bg-white/95 dark:bg-slate-900/90 rounded-[28px] p-5 sm:p-7 shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col gap-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                <Film className="w-3.5 h-3.5" />
                <span>Official Filmography & Ventures</span>
              </span>
              {/* Exactly with Green Heart 💚 as requested */}
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                🥑 Jimmy · 🌊 Sea · 💚 Avocean
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-[#1A3668] dark:text-white tracking-tight">
              Jimmy Sea Avocean Career Projects
            </h2>
            <p className="text-xs sm:text-sm font-medium text-[#607494] dark:text-slate-400 max-w-3xl">
              Explore Jimmy, Sea, and Avocean&apos;s complete catalog of award-winning series, movies, official music videos, global partner brand endorsements, and personal ventures.
            </p>
          </div>

          {/* Right Action: Admin Add Button */}
          {canEdit && (
            <div className="shrink-0 self-start md:self-auto">
              <button
                onClick={openAddModal}
                style={{ backgroundColor: currentAccent.colorHex }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold text-white shadow-xs hover:opacity-95 cursor-pointer active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Project</span>
              </button>
            </div>
          )}
        </div>

        {/* Member Filters Row: All Member / Jimmy / Sea / Avocean */}
        <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#607494] dark:text-slate-400 mr-1 shrink-0">
              <Filter className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Filter:</span>
            </div>

            {/* All Member */}
            <button
              type="button"
              onClick={handleSelectAllMembers}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                isAllMembersActive
                  ? 'bg-[#1A3668] text-white border-[#1A3668] dark:bg-purple-600 dark:border-purple-600 shadow-xs ring-1 ring-purple-300/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-[#526586] dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>All Member</span>
            </button>

            {/* Jimmy */}
            <button
              type="button"
              onClick={() => handleToggleMember('jimmy')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border shrink-0 whitespace-nowrap ${
                isJimmyActive && !isAllMembersActive
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-400/40'
                  : isJimmyActive
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700 shadow-2xs hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                  : 'bg-white dark:bg-slate-800/60 text-slate-400 border-slate-200 dark:border-slate-700 opacity-50 hover:opacity-80'
              }`}
            >
              <span>🥑</span>
              <span>Jimmy</span>
            </button>

            {/* Sea */}
            <button
              type="button"
              onClick={() => handleToggleMember('sea')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border shrink-0 whitespace-nowrap ${
                isSeaActive && !isAllMembersActive
                  ? 'bg-sky-600 text-white border-sky-600 shadow-xs ring-2 ring-sky-400/40'
                  : isSeaActive
                  ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-200 border-sky-300 dark:border-sky-700 shadow-2xs hover:bg-sky-100 dark:hover:bg-sky-900/60'
                  : 'bg-white dark:bg-slate-800/60 text-slate-400 border-slate-200 dark:border-slate-700 opacity-50 hover:opacity-80'
              }`}
            >
              <span>🌊</span>
              <span>Sea</span>
            </button>

            {/* Avocean */}
            <button
              type="button"
              onClick={() => handleToggleMember('avocean')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border shrink-0 whitespace-nowrap ${
                isAvoceanActive && !isAllMembersActive
                  ? 'bg-teal-600 text-white border-teal-600 shadow-xs ring-2 ring-teal-400/40'
                  : isAvoceanActive
                  ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 border-teal-300 dark:border-teal-700 shadow-2xs hover:bg-teal-100 dark:hover:bg-teal-900/60'
                  : 'bg-white dark:bg-slate-800/60 text-slate-400 border-slate-200 dark:border-slate-700 opacity-50 hover:opacity-80'
              }`}
            >
              <span>💚</span>
              <span>Avocean</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {!isAllMembersActive ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                  Filtered: {currentMemberIds.map((id) => (id === 'jimmy' ? '🥑 Jimmy' : id === 'sea' ? '🌊 Sea' : '💚 Avocean')).join(' + ')} ({filteredProjects.length} projects)
                </span>
                <button
                  type="button"
                  onClick={handleSelectAllMembers}
                  className="text-xs font-bold text-purple-700 dark:text-purple-300 underline hover:text-purple-900 cursor-pointer"
                >
                  Show All
                </button>
              </div>
            ) : (
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Showing all {filteredProjects.length} projects
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. MAIN LAYOUT: LEFT STICKY CATEGORIES + RIGHT PROJECTS GRID   */}
      {/* ============================================================== */}
      <div className="flex flex-col lg:flex-row md:landscape:flex-row items-start gap-5 lg:gap-6">
        {/* ============================================================== */}
        {/* LEFT SIDEBAR: STICKY CATEGORY NAVIGATION (Visible when scrolling!) */}
        {/* ============================================================== */}
        <aside className="w-full lg:w-64 md:landscape:w-60 shrink-0 lg:sticky md:landscape:sticky lg:top-20 md:landscape:top-20 z-20 self-start">
          <div className="bg-white/95 dark:bg-slate-900/90 rounded-[24px] p-3 shadow-xs border border-slate-200/80 dark:border-slate-800 backdrop-blur-md space-y-2">
            <div className="flex items-center justify-between px-3 py-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Categories
              </span>
              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full">
                {filteredProjects.length} items
              </span>
            </div>

            {/* Category Navigation: Clean grid on mobile/tablet, vertical list on desktop & landscape */}
            <nav className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:flex lg:flex-col md:landscape:flex md:landscape:flex-col gap-1.5 w-full">
              {PROJECT_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                const count = categoryCounts[cat.id] ?? 0;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    style={isSelected ? { backgroundColor: currentAccent.colorHex } : {}}
                    className={`inline-flex items-center justify-between gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'text-white shadow-xs'
                        : 'bg-slate-100/80 lg:bg-transparent md:landscape:bg-transparent dark:bg-slate-800/80 lg:dark:bg-transparent md:landscape:dark:bg-transparent text-[#526586] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    } w-full`}
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2 truncate">
                      <span className="text-sm sm:text-base shrink-0">{cat.emoji}</span>
                      <span className="truncate">{cat.label}</span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-black shrink-0 ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-white lg:bg-slate-100 md:landscape:bg-slate-100 dark:bg-slate-700 lg:dark:bg-slate-800 md:landscape:dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>

            {/* Release Status Quick Filter in Sidebar */}
            {(() => {
              const isViewingBrands = selectedCategory === 'owned_brands' || selectedCategory === 'partner_brands';
              const statusItems = isViewingBrands
                ? [
                    { id: 'all', label: 'All Brands', emoji: '👑', count: filteredProjects.length },
                    { id: 'active', label: 'Active', emoji: '🟢', count: activeBrands.length },
                    { id: 'upcoming', label: 'Upcoming', emoji: '🕒', count: upcomingBrands.length },
                    { id: 'past', label: 'Non-Active', emoji: '⚪', count: nonActiveBrands.length },
                  ]
                : selectedCategory === 'all'
                ? [
                    { id: 'all', label: 'All Works', emoji: '✨', count: filteredProjects.length },
                    { id: 'airing', label: 'Airing Shows', emoji: '📺', count: airingShows.length },
                    { id: 'active', label: 'Active Brands', emoji: '🟢', count: activeBrands.length },
                    { id: 'upcoming', label: 'Upcoming', emoji: '🕒', count: upcomingProjects.length },
                    { id: 'past', label: 'Past Projects', emoji: '🎬', count: pastShows.length },
                  ]
                : [
                    { id: 'all', label: 'All Projects', emoji: '✨', count: filteredProjects.length },
                    { id: 'airing', label: 'Airing', emoji: '📺', count: airingShows.length },
                    { id: 'upcoming', label: 'Upcoming', emoji: '🕒', count: upcomingShows.length },
                    { id: 'past', label: 'Past Projects', emoji: '🎬', count: pastShows.length },
                  ];

              return (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 px-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1 block mb-1.5">
                    {isViewingBrands ? 'Brand Status' : 'Release Status'}
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex lg:flex-col md:landscape:flex md:landscape:flex-col gap-1.5 w-full">
                    {statusItems.map((st) => {
                      const isSel = selectedStatus === st.id;
                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setSelectedStatus(st.id as any)}
                          className={`inline-flex items-center justify-between gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${
                            isSel
                              ? 'bg-[#1A3668] dark:bg-purple-600 text-white shadow-xs'
                              : 'bg-slate-100/80 lg:bg-transparent dark:bg-slate-800/80 lg:dark:bg-transparent text-[#526586] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                          } w-full`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span>{st.emoji}</span>
                            <span className="truncate">{st.label}</span>
                          </div>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-black shrink-0 ${
                              isSel
                                ? 'bg-white/20 text-white'
                                : 'bg-white lg:bg-slate-100 dark:bg-slate-700 lg:dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            {st.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Language Selector for Descriptions */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 px-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                  <Languages className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                  <span>Default Project Language</span>
                </span>
              </div>
              <select
                value={targetLang}
                onChange={(e) => {
                  const newLang = e.target.value;
                  setTargetLang(newLang);
                  if (onSelectTranslationLang) {
                    onSelectTranslationLang(newLang);
                  }
                }}
                className="w-full text-xs font-bold px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-[#1A3668] dark:text-white border border-slate-200 dark:border-slate-700 cursor-pointer focus:outline-none"
              >
                {TRANSLATION_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </aside>

        {/* ============================================================== */}
        {/* RIGHT MAIN CONTENT: SEARCH + PROJECTS GRID                     */}
        {/* ============================================================== */}
        <main className="flex-1 min-w-0 w-full space-y-4">
          {/* Search Bar */}
          <div className="bg-white/95 dark:bg-slate-900/90 rounded-full shadow-xs px-5 py-3 flex items-center gap-3 border border-slate-200/80 dark:border-slate-800">
            <Search className="w-4 h-4 text-[#475569] dark:text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shows (Last Twilight), roles (Mork, Day), music videos, partner brands (Maybelline, CeraVe), or where to watch..."
              className="w-full text-xs sm:text-sm font-semibold text-[#1A3668] dark:text-white placeholder-[#94A3B8] focus:outline-none bg-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Navigation Tabs: Strictly separates Airing shows from Active brands */}
          {(() => {
            const isViewingBrands = selectedCategory === 'owned_brands' || selectedCategory === 'partner_brands';
            return (
              <div className="bg-white/95 dark:bg-slate-900/90 rounded-2xl shadow-xs p-2.5 sm:p-3 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2.5">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap w-full sm:w-auto">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1 pl-1 shrink-0">
                    Status:
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedStatus('all')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedStatus === 'all'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-purple-600'
                    }`}
                  >
                    <span>{isViewingBrands ? '👑 All Brands' : '✨ All Works'}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      selectedStatus === 'all' ? 'bg-white/20 text-white' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      {filteredProjects.length}
                    </span>
                  </button>

                  {/* Airing Shows Tab (Strictly TV/Film series & MVs, 0 brands) */}
                  {!isViewingBrands && (
                    <button
                      type="button"
                      onClick={() => setSelectedStatus('airing')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedStatus === 'airing'
                          ? 'bg-sky-500 text-white shadow-xs'
                          : 'bg-sky-50/70 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 border border-sky-200/60 dark:border-sky-900/50'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span>📺 Airing Shows</span>
                        {airingShows.length > 0 && (
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                          </span>
                        )}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                        selectedStatus === 'airing' ? 'bg-white/25 text-white' : 'bg-sky-200/80 dark:bg-sky-900/60 text-sky-900 dark:text-sky-200'
                      }`}>
                        {airingShows.length}
                      </span>
                    </button>
                  )}

                  {/* Active Brands Tab (Dedicated for Operating Brands & Live Endorsements) */}
                  {(isViewingBrands || activeBrands.length > 0 || selectedCategory === 'all') && (
                    <button
                      type="button"
                      onClick={() => setSelectedStatus('active')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedStatus === 'active'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200/60 dark:border-emerald-900/50'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span>🟢 {isViewingBrands ? 'Active' : 'Active Brands'}</span>
                        {activeBrands.length > 0 && (
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                        )}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                        selectedStatus === 'active' ? 'bg-white/25 text-white' : 'bg-emerald-200/80 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200'
                      }`}>
                        {activeBrands.length}
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedStatus('upcoming')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedStatus === 'upcoming'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-amber-50/70 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200/60 dark:border-amber-900/50'
                    }`}
                  >
                    <span>🕒 Upcoming</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      selectedStatus === 'upcoming' ? 'bg-white/25 text-white' : 'bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200'
                    }`}>
                      {isViewingBrands ? upcomingBrands.length : upcomingProjects.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedStatus('past')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedStatus === 'past'
                        ? 'bg-slate-700 dark:bg-slate-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'
                    }`}
                  >
                    <span>{isViewingBrands ? '⚪ Non-Active' : '🎬 Past Projects'}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      selectedStatus === 'past' ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                    }`}>
                      {isViewingBrands ? nonActiveBrands.length : pastShows.length}
                    </span>
                  </button>
                </div>

                <div className="text-[11px] font-semibold text-slate-400 px-1 hidden sm:block">
                  {isViewingBrands
                    ? 'Organized: Active Brands → Upcoming → Non-Active'
                    : 'Organized: Shows & Series → Movies → Music Videos → Brands'}
                </div>
              </div>
            );
          })()}

          {/* Projects View Controls: Poster Display Ratio & Global Font Size */}
          <div className="bg-white/95 dark:bg-slate-900/90 rounded-2xl shadow-xs px-3 sm:px-4 py-2.5 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Poster Aspect Mode (Whole Photo vs Auto-Fit vs Landscape) */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-[#526586] dark:text-slate-400 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Poster Display:</span>
              </span>
              <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => handleUpdateProjectPosterAspect('poster')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                    projectPosterAspect === 'poster'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-purple-600'
                  }`}
                  title="Shows full theatrical portrait poster (Whole photo with heads, bodies & logos)"
                >
                  🎬 Full Poster (2:3)
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateProjectPosterAspect('contain')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                    projectPosterAspect === 'contain'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-purple-600'
                  }`}
                  title="100% of the entire photo visible without cropping, with ambient glow"
                >
                  ⚡ Auto-Fit (100% Whole)
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateProjectPosterAspect('card')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                    projectPosterAspect === 'card'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-purple-600'
                  }`}
                  title="Classic horizontal 16:10 card"
                >
                  🖼️ Landscape (16:10)
                </button>
              </div>
            </div>

            {/* Global Projects Font Size Zoom Controls */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#526586] dark:text-slate-400 flex items-center gap-1">
                <Type className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Font Size:</span>
              </span>
              <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700 text-[11px] font-bold">
                {(
                  [
                    { id: 'compact', label: 'A-', tip: 'Compact Font' },
                    { id: 'medium', label: 'A', tip: 'Medium / Standard Font' },
                    { id: 'large', label: 'A+', tip: 'Large Font' },
                    { id: 'xl', label: 'A++', tip: 'Extra Large Font' }
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    title={opt.tip}
                    onClick={() => handleUpdateProjectFontZoom(opt.id)}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      projectFontZoom === opt.id
                        ? 'bg-purple-600 text-white shadow-xs font-black'
                        : 'text-slate-600 dark:text-slate-300 hover:text-purple-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Chronological Sorting Order Toggle (Newest First on Left vs Oldest First) */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#526586] dark:text-slate-400 flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Sort:</span>
              </span>
              <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setProjectSortOrder('newest');
                    showToast('Sorted Newest First (Left: Newest → Right: Oldest)');
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    projectSortOrder === 'newest'
                      ? 'bg-purple-600 text-white shadow-xs font-black'
                      : 'text-slate-600 dark:text-slate-300 hover:text-purple-600'
                  }`}
                  title="Newest projects on the left (e.g. My Magic Prophecy first, Vice Versa last)"
                >
                  📅 Newest First
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProjectSortOrder('oldest');
                    showToast('Sorted Oldest First (Left: Oldest → Right: Newest)');
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    projectSortOrder === 'oldest'
                      ? 'bg-purple-600 text-white shadow-xs font-black'
                      : 'text-slate-600 dark:text-slate-300 hover:text-purple-600'
                  }`}
                  title="Oldest projects on the left (e.g. Vice Versa first, My Magic Prophecy last)"
                >
                  ⏳ Oldest First
                </button>
              </div>
            </div>

            {/* Grid Columns Toggle (3 Cards Row vs 2 Cards Row) */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#526586] dark:text-slate-400 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Layout:</span>
              </span>
              <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => handleUpdateProjectGridColumns('3')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    projectGridColumns === '3' || projectGridColumns === 'auto'
                      ? 'bg-purple-600 text-white shadow-xs font-black'
                      : 'text-slate-600 dark:text-slate-300 hover:text-purple-600'
                  }`}
                  title="3 Cards Row (fits all 3 cards in one row on laptop & desktop)"
                >
                  3 Cards Row
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateProjectGridColumns('2')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    projectGridColumns === '2'
                      ? 'bg-purple-600 text-white shadow-xs font-black'
                      : 'text-slate-600 dark:text-slate-300 hover:text-purple-600'
                  }`}
                  title="2 Cards Row (wider cards)"
                >
                  2 Cards Row
                </button>
              </div>
            </div>
          </div>

          {/* Projects Cards Grid */}
          {filteredProjects.length === 0 ? (
            <div className="bg-white/95 dark:bg-slate-900/90 rounded-[28px] p-10 sm:p-14 text-center border border-slate-200/80 dark:border-slate-800 flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-600 flex items-center justify-center text-3xl shadow-xs">
                🎬
              </div>
              <h3 className="text-lg sm:text-xl font-black text-[#1A3668] dark:text-white">
                {projects.length === 0 ? 'No Career Projects Yet' : 'No projects found'}
              </h3>
              <p className="text-xs sm:text-sm text-[#607494] dark:text-slate-400 max-w-md">
                {projects.length === 0
                  ? 'All sample projects have been deleted. You and the admins can add your official series, movies, music videos, partner brands, and owned ventures using the "+ Add Project" button.'
                  : 'No works or brands match your current filter selection. Try selecting "All Projects" or resetting your search keywords.'}
              </p>
              {projects.length === 0 ? (
                canEdit && (
                  <button
                    onClick={openAddModal}
                    style={{ backgroundColor: currentAccent.colorHex }}
                    className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-white shadow-xs hover:opacity-95 cursor-pointer active:scale-95 transition-all"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Add First Project</span>
                  </button>
                )
              ) : (
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                  }}
                  className="mt-2 px-4 py-2 rounded-full text-xs font-bold text-white bg-[#1A3668] dark:bg-purple-600 cursor-pointer shadow-xs hover:opacity-90"
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            (() => {
              const renderProjectCard = (proj: CareerProject) => {
                const artistInfo = getArtistLabel(proj.artist);
                const isBrand = proj.category === 'owned_brands' || proj.category === 'partner_brands';
                const statusInfo = getStatusBadge(proj.status, proj.category);
                const cardLang = projectCardLangs[proj.id] || targetLang || 'en';
                const isTranslating = !!translatingIds[proj.id];
                const cachedFullTrans = projectCardTranslations[proj.id]?.[cardLang];
                const isShowingTrans = !!showingTranslatedIds[proj.id] && !!cachedFullTrans;

                // Typography calculation per-card or from global toolbar
                const effectiveZoom = projectCardZoom[proj.id] || proj.fontSize || projectFontZoom;
                const typo = getProjectTypography(effectiveZoom);

                // English title & original Thai script separation:
                // IMPORTANT: Not all projects have Thai titles (e.g. brands, endorsements, music singles, international campaigns)!
                const hasThaiInTitle = /[\u0E00-\u0E7F]/.test(proj.title);
                const hasThaiInEnglishTitle = proj.englishTitle ? /[\u0E00-\u0E7F]/.test(proj.englishTitle) : false;
                const explicitThai = proj.thaiTitle ? proj.thaiTitle.trim() : '';

                let primaryEnglishTitle = proj.title;
                let originalThaiScript = '';

                if (explicitThai) {
                  // Explicit authentic Thai title provided
                  originalThaiScript = explicitThai;
                  primaryEnglishTitle = proj.title || proj.englishTitle || explicitThai;
                } else if (hasThaiInTitle && proj.englishTitle && !hasThaiInEnglishTitle) {
                  // Legacy data: title was Thai script, englishTitle was Romanized/English
                  primaryEnglishTitle = proj.englishTitle;
                  originalThaiScript = proj.title;
                } else if (hasThaiInEnglishTitle && !hasThaiInTitle) {
                  // Legacy data: englishTitle was Thai script, title was English
                  primaryEnglishTitle = proj.title;
                  originalThaiScript = proj.englishTitle;
                } else if (hasThaiInTitle) {
                  // The single title is in Thai script
                  primaryEnglishTitle = (isShowingTrans && cachedFullTrans?.title) ? cachedFullTrans.title : proj.title;
                  originalThaiScript = proj.title;
                } else {
                  // Clean project without a Thai title (e.g. Avocean, Mediheal, GMMTV Live, Converse, etc.)
                  primaryEnglishTitle = proj.title || proj.englishTitle || '';
                  originalThaiScript = '';
                }

                if (isShowingTrans && cachedFullTrans?.title) {
                  primaryEnglishTitle = cachedFullTrans.title;
                }

                const displayJimmyRole = (isShowingTrans && cachedFullTrans?.jimmyRole) ? cachedFullTrans.jimmyRole : proj.jimmyRole;
                const displaySeaRole = (isShowingTrans && cachedFullTrans?.seaRole) ? cachedFullTrans.seaRole : proj.seaRole;
                const displayRole = (isShowingTrans && cachedFullTrans?.role) ? cachedFullTrans.role : proj.role;
                const displayDirector = (isShowingTrans && cachedFullTrans?.director) ? cachedFullTrans.director : proj.director;
                const displayHighlight = (isShowingTrans && cachedFullTrans?.highlight) ? cachedFullTrans.highlight : proj.highlight;
                const displayDescription = (isShowingTrans && cachedFullTrans?.description) ? cachedFullTrans.description : proj.description;
                const displayFilmedPeriod = (isShowingTrans && cachedFullTrans?.filmedPeriod) ? cachedFullTrans.filmedPeriod : proj.filmedPeriod;

                // Combine watchLinks or fallback
                const allWatchLinks: ProjectLink[] =
                  proj.watchLinks && proj.watchLinks.length > 0
                    ? proj.watchLinks
                    : [
                        ...(proj.primaryLink ? [{ label: proj.extraLinks?.[0]?.label || 'Official Link', url: proj.primaryLink, platform: proj.platform || 'Website' }] : []),
                        ...(proj.extraLinks || [])
                      ];

                const brandMediaList = isBrand
                  ? (proj.mediaPhotos && proj.mediaPhotos.length > 0)
                    ? proj.mediaPhotos.filter(
                        (p) =>
                          p &&
                          p.trim() !== (proj.bannerUrl || '').trim() &&
                          p.trim() !== (proj.imageUrl || '').trim()
                      )
                    : []
                  : [];
                const showMediaList = (proj.mediaPhotos && proj.mediaPhotos.length > 0)
                  ? proj.mediaPhotos.filter(Boolean)
                  : [proj.imageUrl].filter(Boolean);
                const mediaList = isBrand ? brandMediaList : showMediaList;

                return (
                  <div
                    key={proj.id}
                    className="bg-white/95 dark:bg-slate-900/90 rounded-[24px] border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Poster / Cover Image (Supports Multi-Photo Gallery, Whole Photo View, Direct Click to Expand) */}
                      {(() => {
                        const brandBannerPhoto = proj.bannerUrl || proj.imageUrl;
                        const activeMediaIdx = (projectCardMediaIndex[proj.id] ?? 0) % (mediaList.length || 1);
                        const activePhoto = isBrand ? brandBannerPhoto : (mediaList[activeMediaIdx] || proj.imageUrl);
                        const isContain = proj.mediaFit === 'contain' || projectPosterAspect === 'contain';
                        const focalPos = proj.mediaPosition || `center ${proj.mediaOffsetY ?? 50}%`;

                        // Aspect ratio calculation:
                        // For brands: sleek horizontal landscape banner (16:9 / 2:1, max-h 260px) matching Fan Clubs style
                        // For television shows & movies: theatrical portrait poster (2:3 or 3:4) or 16:10 card
                        const aspectClass = isBrand
                          ? 'aspect-[16/9] sm:aspect-[2/1] w-full max-h-[260px]'
                          : projectPosterAspect === 'poster'
                          ? 'aspect-[2/3] sm:aspect-[3/4]'
                          : projectPosterAspect === 'contain'
                          ? 'aspect-[3/4] sm:aspect-[2/3]'
                          : 'aspect-[16/10]';

                        return (
                          <div
                            tabIndex={!isBrand && mediaList.length > 1 ? 0 : undefined}
                            onKeyDown={(e) => {
                              if (isBrand || mediaList.length <= 1) return;
                              if (e.key === 'ArrowLeft') {
                                e.preventDefault();
                                e.stopPropagation();
                                setProjectCardMediaIndex((prev) => ({
                                  ...prev,
                                  [proj.id]: (activeMediaIdx - 1 + mediaList.length) % mediaList.length
                                }));
                              } else if (e.key === 'ArrowRight') {
                                e.preventDefault();
                                e.stopPropagation();
                                setProjectCardMediaIndex((prev) => ({
                                  ...prev,
                                  [proj.id]: (activeMediaIdx + 1) % mediaList.length
                                }));
                              }
                            }}
                            onClick={() =>
                              setLightboxImageUrl({
                                url: activePhoto,
                                title: isBrand
                                  ? `${primaryEnglishTitle} Official Banner`
                                  : `${primaryEnglishTitle} ${
                                      mediaList.length > 1 ? `(Photo ${activeMediaIdx + 1} of ${mediaList.length})` : ''
                                    }`,
                                photos: isBrand ? [activePhoto] : mediaList,
                                currentIndex: isBrand ? 0 : activeMediaIdx
                              })
                            }
                            className={`relative ${aspectClass} bg-slate-900 dark:bg-slate-950 overflow-hidden group cursor-pointer select-none transition-all focus:outline-none focus:ring-2 focus:ring-purple-500`}
                            title={isBrand ? 'Click banner to expand in high resolution' : (mediaList.length > 1 ? 'Click poster to expand · Use Arrow Keys or buttons to switch photos' : 'Click poster to expand in high resolution')}
                          >
                            {/* Ambient Blur Backdrop for Auto-Fit (contain) so 100% of the photo is visible without stark black bars */}
                            {isContain && (
                              <div
                                className="absolute inset-0 bg-cover bg-center filter blur-xl opacity-40 scale-110 pointer-events-none"
                                style={{ backgroundImage: `url(${activePhoto})` }}
                              />
                            )}

                            <img
                              src={activePhoto}
                              alt={primaryEnglishTitle}
                              style={{ objectPosition: focalPos }}
                              className={`w-full h-full relative z-10 transition-transform duration-500 ${
                                isBrand
                                  ? isContain
                                    ? 'object-contain'
                                    : 'object-cover group-hover:scale-105'
                                  : isContain
                                  ? 'object-contain'
                                  : 'object-cover group-hover:scale-105'
                              }`}
                              loading="lazy"
                            />

                            {/* Hover expand overlay indicator cue */}
                            <div className="absolute inset-0 z-20 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                              <span className="px-3.5 py-1.5 rounded-full bg-black/75 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5 shadow-xl border border-white/20 transform scale-95 group-hover:scale-100 transition-transform">
                                <Maximize2 className="w-3.5 h-3.5 text-purple-300" />
                                <span>{isBrand ? 'Click to Enlarge Banner' : 'Click to Expand'}</span>
                              </span>
                            </div>

                            {/* Top Right Actions: Photo Counter (for TV shows) + Expand */}
                            <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5">
                              {!isBrand && mediaList.length > 1 && (
                                <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black bg-black/60 text-white backdrop-blur-md border border-white/20 shadow-xs pointer-events-none">
                                  📷 {activeMediaIdx + 1}/{mediaList.length}
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLightboxImageUrl({
                                    url: activePhoto,
                                    title: isBrand
                                      ? `${primaryEnglishTitle} Official Banner`
                                      : `${primaryEnglishTitle} ${
                                          mediaList.length > 1 ? `(Photo ${activeMediaIdx + 1} of ${mediaList.length})` : ''
                                        }`,
                                    photos: isBrand ? [activePhoto] : mediaList,
                                    currentIndex: isBrand ? 0 : activeMediaIdx
                                  });
                                }}
                                className="opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-2 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-md cursor-pointer shadow-md"
                                title={isBrand ? "Expand Banner in Full Resolution" : "Expand Full Resolution"}
                              >
                                <Maximize2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Carousel Controls for Multi-Photo TV Series & Movie Posters */}
                            {!isBrand && mediaList.length > 1 && (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setProjectCardMediaIndex((prev) => ({
                                      ...prev,
                                      [proj.id]: (activeMediaIdx - 1 + mediaList.length) % mediaList.length
                                    }));
                                  }}
                                  className="absolute left-2 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-1.5 rounded-full bg-black/70 hover:bg-black/90 text-white backdrop-blur-md opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-all cursor-pointer shadow-md hover:scale-110 active:scale-95"
                                  title="Previous Photo (← Left Arrow)"
                                  aria-label="Previous Photo"
                                >
                                  <ChevronLeft className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setProjectCardMediaIndex((prev) => ({
                                      ...prev,
                                      [proj.id]: (activeMediaIdx + 1) % mediaList.length
                                    }));
                                  }}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-1.5 rounded-full bg-black/70 hover:bg-black/90 text-white backdrop-blur-md opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-all cursor-pointer shadow-md hover:scale-110 active:scale-95"
                                  title="Next Photo (→ Right Arrow)"
                                  aria-label="Next Photo"
                                >
                                  <ChevronRight className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        );
                      })()}

                      {/* Brand Header: Display Picture + Badges Row placed cleanly below the banner (sized like Fan Clubs avatar, no negative margin, no covering the banner) */}
                      {isBrand && (
                        <div className="px-5 sm:px-6 pt-4 pb-1 flex items-center gap-4 relative z-20">
                          {/* Clickable Display Picture (Matching Fan Clubs standard size: w-20 h-20 sm:w-24 sm:h-24) */}
                          <div
                            onClick={(e) => {
                              if (proj.avatarUrl) {
                                e.stopPropagation();
                                setLightboxImageUrl({
                                  url: proj.avatarUrl,
                                  title: `${primaryEnglishTitle} Display Photo`,
                                  photos: [proj.avatarUrl],
                                  currentIndex: 0
                                });
                              }
                            }}
                            className={`relative shrink-0 ${proj.avatarUrl ? 'cursor-pointer group/avatar' : ''}`}
                            title={proj.avatarUrl ? 'Click to view full display photo' : primaryEnglishTitle}
                          >
                            {proj.avatarUrl ? (
                              <>
                                <img
                                  src={proj.avatarUrl}
                                  alt={`${primaryEnglishTitle} display photo`}
                                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-slate-200 dark:border-slate-700 shadow-md object-cover bg-white dark:bg-slate-800 group-hover/avatar:scale-105 transition-transform duration-200"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                                <div className="absolute inset-0 rounded-full bg-black/0 group-hover/avatar:bg-black/25 transition-colors flex items-center justify-center opacity-0 group-hover/avatar:opacity-100">
                                  <Maximize2 className="w-4 h-4 text-white drop-shadow-md" />
                                </div>
                              </>
                            ) : (
                              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-slate-200 dark:border-slate-700 shadow-md bg-gradient-to-tr from-amber-500 via-purple-600 to-indigo-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-black">
                                {proj.category === 'owned_brands' ? '👑' : '🤝'}
                              </div>
                            )}
                          </div>

                          {/* Badges beside the avatar */}
                          <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] uppercase tracking-wider shrink-0 ${getCategoryBadgeStyle(proj.category)}`}>
                              {getCategoryIcon(proj.category)}
                              <span>{getCategoryBadge(proj.category)}</span>
                            </span>

                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold border shadow-2xs shrink-0 ${artistInfo.bg}`}>
                              <span>{artistInfo.emoji}</span>
                              <span>{artistInfo.label}</span>
                            </span>

                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-2xs shrink-0 ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Card Content Body */}
                      <div className="p-5 space-y-3">
                        {/* Badges Row: Category, Artist & Status (For Shows, Movies & MVs) */}
                        {!isBrand && (
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider shadow-2xs ${getCategoryBadgeStyle(proj.category)}`}>
                                {getCategoryIcon(proj.category)}
                                <span>{getCategoryBadge(proj.category)}</span>
                              </span>

                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold border shadow-2xs ${artistInfo.bg}`}>
                                <span>{artistInfo.emoji}</span>
                                <span>{artistInfo.label}</span>
                              </span>
                            </div>

                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-2xs ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                        )}

                        {/* Interactive Language Selector, Card Typography Zoom & Translator Bar */}
                        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Languages className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                            <select
                              value={cardLang}
                              onChange={(e) => {
                                const nextLang = e.target.value;
                                setProjectCardLangs((prev) => ({ ...prev, [proj.id]: nextLang }));
                                handleTranslateProjectCard(proj.id, nextLang);
                              }}
                              className="text-[11px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-200 cursor-pointer focus:outline-hidden"
                            >
                              {TRANSLATION_LANGUAGES.map((l) => (
                                <option key={l.code} value={l.code}>
                                  {l.flag} {l.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Card-level Font Size Controls */}
                            <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 shadow-2xs">
                              <button
                                type="button"
                                onClick={() => {
                                  const nextZoom = effectiveZoom === 'xl' ? 'large' : effectiveZoom === 'large' ? 'medium' : 'compact';
                                  setProjectCardZoom((prev) => ({ ...prev, [proj.id]: nextZoom }));
                                }}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-black cursor-pointer transition-colors ${
                                  effectiveZoom === 'compact' ? 'bg-purple-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                                title="Smaller text"
                              >
                                A-
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setProjectCardZoom((prev) => ({ ...prev, [proj.id]: 'medium' }));
                                }}
                                className={`px-1.5 py-0.5 rounded text-[10.5px] font-black cursor-pointer transition-colors ${
                                  effectiveZoom === 'medium' ? 'bg-purple-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                                title="Default text"
                              >
                                A
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const nextZoom = effectiveZoom === 'compact' ? 'medium' : effectiveZoom === 'medium' ? 'large' : 'xl';
                                  setProjectCardZoom((prev) => ({ ...prev, [proj.id]: nextZoom }));
                                }}
                                className={`px-1.5 py-0.5 rounded text-[11px] font-black cursor-pointer transition-colors ${
                                  effectiveZoom === 'large' || effectiveZoom === 'xl' ? 'bg-purple-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                                title="Larger text"
                              >
                                A+
                              </button>
                            </div>

                            {cachedFullTrans ? (
                              <button
                                type="button"
                                onClick={() => toggleTranslationView(proj.id)}
                                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                                  isShowingTrans
                                    ? 'bg-purple-600 text-white shadow-2xs'
                                    : 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800'
                                }`}
                              >
                                <Languages className="w-3 h-3" />
                                <span>{isShowingTrans ? 'Original' : cardLang.toUpperCase()}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleTranslateProjectCard(proj.id, cardLang)}
                                disabled={isTranslating}
                                className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                              >
                                {isTranslating ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Sparkles className="w-3 h-3" />
                                )}
                                <span>Translate</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Dedicated Jimmy & Sea Character Names & Roles (Only for shows & movies, not brands) */}
                        {!isBrand && (displayJimmyRole || displaySeaRole || displayRole) && (
                          <div className="flex flex-wrap items-center gap-2 pt-0.5">
                            {displayJimmyRole && (
                              <div className={`inline-flex items-center gap-1.5 rounded-xl font-bold bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shadow-2xs ${typo.badges}`}>
                                <span className="text-sm sm:text-base">🥑</span>
                                <span className="font-bold text-purple-950 dark:text-purple-100 tracking-tight">
                                  {displayJimmyRole.toLowerCase().startsWith('jimmy as') ? displayJimmyRole : `Jimmy as ${displayJimmyRole}`}
                                </span>
                              </div>
                            )}

                            {displaySeaRole && (
                              <div className={`inline-flex items-center gap-1.5 rounded-xl font-bold bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 shadow-2xs ${typo.badges}`}>
                                <span className="text-sm sm:text-base">🌊</span>
                                <span className="font-bold text-sky-950 dark:text-sky-100 tracking-tight">
                                  {displaySeaRole.toLowerCase().startsWith('sea as') ? displaySeaRole : `Sea as ${displaySeaRole}`}
                                </span>
                              </div>
                            )}

                            {!displayJimmyRole && !displaySeaRole && displayRole && (
                              <div className={`inline-flex items-center gap-1.5 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 ${typo.badges}`}>
                                <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />
                                <span>{displayRole}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Title & Original Thai Script: Side by side separated by a bullet */}
                        <div className="flex items-baseline gap-x-2 gap-y-1 flex-wrap">
                          <h3 className={`${typo.title} text-[#1A3668] dark:text-white leading-snug group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors inline-flex items-baseline gap-2 flex-wrap`}>
                            <span>{primaryEnglishTitle}</span>

                            {originalThaiScript && originalThaiScript !== primaryEnglishTitle && (
                              <>
                                <span className="text-purple-400 dark:text-purple-500 font-bold select-none text-[0.85em] opacity-70">
                                  •
                                </span>
                                <span className="font-thai font-bold text-[#526586] dark:text-slate-200 tracking-normal text-[0.95em] sm:text-[1em]">
                                  {originalThaiScript}
                                </span>
                              </>
                            )}
                          </h3>

                          {isShowingTrans && (
                            <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 font-black self-center">
                              {cardLang.toUpperCase()} Translated
                            </span>
                          )}
                        </div>

                        {/* Director (for TV Series & Movies, not brands) */}
                        {!isBrand && displayDirector && (
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 ${typo.meta}`}>
                            <Clapperboard className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                            <span>Directed by <strong className="text-[#1A3668] dark:text-white font-bold">{displayDirector}</strong></span>
                          </div>
                        )}

                        {/* Award / Highlight Chip (not for brands) */}
                        {!isBrand && displayHighlight && (
                          <div className={`p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 font-bold flex items-center gap-2 ${typo.meta}`}>
                            <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="leading-tight">{displayHighlight}</span>
                          </div>
                        )}

                        {/* Release / On-Air Period and Filmed Month / Year (Above Description / Synopsis, not for brands) */}
                        {!isBrand && (proj.year || displayFilmedPeriod) && (
                          <div className="flex flex-wrap items-center gap-2 pt-0.5">
                            {proj.year && (
                              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/70 ${typo.meta}`}>
                                <Calendar className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                                <span>{proj.year}</span>
                              </div>
                            )}
                            {displayFilmedPeriod && (
                              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/70 ${typo.meta}`}>
                                <Clapperboard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span>Filmed: {displayFilmedPeriod}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Description & Overview */}
                        <div className="space-y-1.5 pt-0.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`font-bold text-slate-400 flex items-center gap-1 ${typo.meta}`}>
                              <span>Overview &amp; Synopsis</span>
                            </span>
                          </div>

                          <p className={`font-medium text-[#475569] dark:text-slate-300 whitespace-pre-line leading-relaxed ${typo.body}`}>
                            {displayDescription}
                          </p>
                        </div>

                        {/* Hashtags with Copy All and Individual Click-to-Copy Pills */}
                        {proj.tags && proj.tags.length > 0 && (
                          <div className="pt-2">
                            <HashtagsDisplayCard
                              hashtags={proj.tags}
                              showToast={showToast}
                              accentColor={currentAccent.colorHex}
                            />
                          </div>
                        )}

                        {/* Brand Media & Product Lookbook Gallery (Clickable Thumbnails with Lightbox) */}
                        {isBrand && brandMediaList.length > 0 && (
                          <div className="pt-2">
                            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-50/60 to-indigo-50/60 dark:from-purple-950/40 dark:to-indigo-950/30 border border-purple-200/70 dark:border-purple-900/60 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className={`font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5 ${typo.meta}`}>
                                  <ImageIcon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                  <span>Brand Media &amp; Product Gallery</span>
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                  📷 {brandMediaList.length} {brandMediaList.length === 1 ? 'photo' : 'photos'}
                                </span>
                              </div>

                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {brandMediaList.map((photo, pIdx) => (
                                  <div
                                    key={pIdx}
                                    onClick={() =>
                                      setLightboxImageUrl({
                                        url: photo,
                                        title: `${primaryEnglishTitle} — Brand Media (${pIdx + 1} of ${brandMediaList.length})`,
                                        photos: brandMediaList,
                                        currentIndex: pIdx
                                      })
                                    }
                                    className="group/media relative aspect-square rounded-xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs hover:border-purple-400 hover:shadow-xs transition-all"
                                    title="Click to view full photo in gallery (use arrow keys to browse)"
                                  >
                                    <img
                                      src={photo}
                                      alt={`${primaryEnglishTitle} media ${pIdx + 1}`}
                                      className="w-full h-full object-cover group-hover/media:scale-105 transition-transform duration-200"
                                      loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover/media:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover/media:opacity-100">
                                      <Maximize2 className="w-4 h-4 text-white drop-shadow-md" />
                                    </div>
                                    <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/70 text-white text-[8px] font-mono pointer-events-none">
                                      #{pIdx + 1}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Where to Watch & Official Links Section */}
                    <div className="p-5 pt-0 space-y-3">
                      {/* Official Show Social Accounts & Websites */}
                      {(proj.twitterUrl || proj.instagramUrl || proj.officialWebsiteUrl || (proj.customWebsites && proj.customWebsites.length > 0)) && (
                        <div className="p-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/70 dark:border-purple-900/60 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className={`font-black uppercase tracking-wider text-purple-900 dark:text-purple-300 flex items-center gap-1.5 ${typo.meta}`}>
                              <Globe className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                              <span>Official Show Accounts &amp; Websites</span>
                            </span>
                            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                              Verified
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {proj.twitterUrl && (
                              <a
                                href={proj.twitterUrl.startsWith('http') ? proj.twitterUrl : `https://x.com/${proj.twitterUrl.replace(/^@/, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all shadow-2xs hover:border-purple-300 cursor-pointer"
                                title="Official Show X / Twitter"
                              >
                                <span>𝕏</span>
                                <span>Official X</span>
                                <ExternalLink className="w-3 h-3 text-slate-400" />
                              </a>
                            )}

                            {proj.instagramUrl && (
                              <a
                                href={proj.instagramUrl.startsWith('http') ? proj.instagramUrl : `https://instagram.com/${proj.instagramUrl.replace(/^@/, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 hover:bg-pink-50 dark:hover:bg-pink-950/50 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-900/70 transition-all shadow-2xs hover:border-pink-300 cursor-pointer"
                                title="Official Show Instagram"
                              >
                                <span>📸</span>
                                <span>Official IG</span>
                                <ExternalLink className="w-3 h-3 text-pink-400" />
                              </a>
                            )}

                            {proj.officialWebsiteUrl && (
                              <a
                                href={proj.officialWebsiteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 hover:bg-purple-50 dark:hover:bg-purple-950/60 text-[#1A3668] dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all shadow-2xs hover:border-purple-300 cursor-pointer"
                                title="Official Show Website"
                              >
                                <Globe className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                <span>Official Website</span>
                                <ExternalLink className="w-3 h-3 text-slate-400" />
                              </a>
                            )}

                            {proj.customWebsites && proj.customWebsites.map((site, sIdx) => {
                              if (!site.url) return null;
                              return (
                                <a
                                  key={sIdx}
                                  href={site.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 hover:bg-purple-50 dark:hover:bg-purple-950/60 text-[#1A3668] dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all shadow-2xs hover:border-purple-300 cursor-pointer"
                                  title={site.label || site.url}
                                >
                                  <Globe className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                  <span className="truncate max-w-[170px]">{site.label || 'Website'}</span>
                                  <ExternalLink className="w-3 h-3 text-slate-400" />
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {allWatchLinks.length > 0 && (
                        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/80 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className={`font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 ${typo.meta}`}>
                              <Play className="w-3 h-3 text-purple-600 dark:text-purple-400 fill-current" />
                              <span>Where to Watch &amp; Official Links</span>
                            </span>
                            <span className={`text-slate-400 ${typo.meta}`}>
                              {allWatchLinks.length} source{allWatchLinks.length > 1 ? 's' : ''}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {allWatchLinks.map((link, lIdx) => {
                              const isTrailer = (link.platform || '').toLowerCase().includes('trailer') ||
                                (link.label || '').toLowerCase().includes('trailer') ||
                                (link.platform || '').toLowerCase().includes('teaser') ||
                                (link.label || '').toLowerCase().includes('teaser');
                              return (
                                <a
                                  key={lIdx}
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`inline-flex items-center gap-1.5 rounded-xl font-bold transition-all shadow-2xs cursor-pointer ${
                                    isTrailer
                                      ? 'bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700/80 hover:border-amber-400'
                                      : 'bg-white dark:bg-slate-900 hover:bg-purple-50 dark:hover:bg-purple-950/60 text-[#1A3668] dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-purple-300'
                                  } ${typo.buttons}`}
                                >
                                  <span>{getPlatformIcon(link.platform || link.label)}</span>
                                  <span className="truncate max-w-[170px]">{link.label}</span>
                                  {isTrailer && (
                                    <span className="text-[9.5px] font-black px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                                      Trailer
                                    </span>
                                  )}
                                  <ExternalLink className="w-3 h-3 text-slate-400" />
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Card Bottom Controls (Admin Edit / Delete) */}
                      {canEdit && (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(proj)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Project</span>
                          </button>
                          <button
                            onClick={() => handleDelete(proj)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              };

              const gridColsClass =
                projectGridColumns === '2'
                  ? 'grid-cols-1 md:grid-cols-2'
                  : 'grid-cols-1 sm:grid-cols-2 min-[1120px]:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3';

              const renderProjectGrid = (projectList: CareerProject[]) => (
                <div className={`grid ${gridColsClass} gap-4 sm:gap-4.5 xl:gap-5`}>
                  {projectList.map((p) => renderProjectCard(p))}
                </div>
              );

              const isViewingBrands = selectedCategory === 'owned_brands' || selectedCategory === 'partner_brands';

              const CATEGORY_SECTIONS: {
                id: ProjectCategory;
                title: string;
                emoji: string;
                subtitle: string;
                accentBorder: string;
                badgeBg: string;
              }[] = [
                {
                  id: 'shows',
                  title: 'Shows & Series',
                  emoji: '📺',
                  subtitle: 'Official television series, dramas, on-air episodes & broadcast variety',
                  accentBorder: 'border-purple-400/50 dark:border-purple-700/60',
                  badgeBg: 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                },
                {
                  id: 'movies',
                  title: 'Movies & Films',
                  emoji: '🎬',
                  subtitle: 'Theatrical releases, feature films & cinematic productions',
                  accentBorder: 'border-indigo-400/50 dark:border-indigo-700/60',
                  badgeBg: 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                },
                {
                  id: 'music_videos',
                  title: 'Music Videos & Singles',
                  emoji: '🎵',
                  subtitle: 'Official singles, music videos & soundtrack performances',
                  accentBorder: 'border-pink-400/50 dark:border-pink-700/60',
                  badgeBg: 'bg-pink-100 dark:bg-pink-950/80 text-pink-800 dark:text-pink-300 border-pink-200 dark:border-pink-800'
                },
                {
                  id: 'owned_brands',
                  title: 'Owned Brands & Personal Ventures',
                  emoji: '👑',
                  subtitle: 'Founder ventures, official business lines & personal merchandise',
                  accentBorder: 'border-amber-400/60 dark:border-amber-500/60',
                  badgeBg: 'bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-950/90 dark:to-yellow-950/80 text-amber-950 dark:text-amber-200 border-2 border-amber-400 dark:border-amber-600 font-black'
                },
                {
                  id: 'partner_brands',
                  title: 'Partner Brands & Endorsements',
                  emoji: '🤝',
                  subtitle: 'Commercial endorsements, brand ambassador campaigns & official partnerships',
                  accentBorder: 'border-indigo-400/50 dark:border-indigo-700/60',
                  badgeBg: 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                }
              ];

              const sectionsToDisplay =
                selectedCategory === 'all'
                  ? CATEGORY_SECTIONS
                  : CATEGORY_SECTIONS.filter((c) => c.id === selectedCategory);

              // Filter projects for each section according to status selection
              const getSectionProjects = (catId: ProjectCategory) => {
                return filteredProjects.filter((p) => {
                  if (p.category !== catId) return false;
                  if (selectedStatus === 'airing') {
                    return !isBrandProj(p) && (p.status === 'ongoing' || p.status === 'active');
                  }
                  if (selectedStatus === 'active') {
                    return isBrandProj(p) && (p.status === 'active' || p.status === 'ongoing');
                  }
                  if (selectedStatus === 'upcoming') {
                    return p.status === 'upcoming';
                  }
                  if (selectedStatus === 'past') {
                    return (
                      p.status === 'released' ||
                      (p.status !== 'upcoming' && p.status !== 'ongoing' && p.status !== 'active')
                    );
                  }
                  return true;
                });
              };

              const visibleSections = sectionsToDisplay
                .map((sec) => ({
                  ...sec,
                  items: getSectionProjects(sec.id)
                }))
                .filter((sec) => (selectedCategory === 'all' ? sec.items.length > 0 : true));

              const totalVisibleItems = visibleSections.reduce((acc, sec) => acc + sec.items.length, 0);

              if (totalVisibleItems === 0) {
                return (
                  <div className="bg-white/95 dark:bg-slate-900/90 rounded-[28px] p-10 text-center border border-dashed border-slate-300 dark:border-slate-800 space-y-3 shadow-xs">
                    <div className="text-4xl">🔍</div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-white">
                      No Projects or Brands Found
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      No items match your selected filters. Try clearing your search or switching status filters to view all career projects and brands.
                    </p>
                    <div className="pt-2 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategory('all');
                          setSelectedStatus('all');
                          setSearchQuery('');
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 cursor-pointer shadow-xs"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div className="space-y-10">
                  {visibleSections.map((sec) => {
                    const count = sec.items.length;
                    return (
                      <section key={sec.id} className="space-y-4 pt-1">
                        {/* Category Section Header */}
                        <div className={`flex items-center justify-between gap-3 pb-2.5 border-b-2 ${sec.accentBorder}`}>
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-2xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 flex items-center justify-center text-lg shadow-2xs border border-slate-200/80 dark:border-slate-700">
                              {sec.emoji}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                                  <span>{sec.title}</span>
                                </h3>
                                <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${sec.badgeBg}`}>
                                  {count} {count === 1 ? 'item' : 'items'}
                                </span>
                              </div>
                              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                {sec.subtitle}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Project Cards Grid */}
                        {sec.items.length > 0 ? (
                          renderProjectGrid(sec.items)
                        ) : (
                          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500">
                            No {sec.title.toLowerCase()} currently match your active status filters.
                          </div>
                        )}
                      </section>
                    );
                  })}
                </div>
              );
            })()
          )}
        </main>
      </div>

      {/* ============================================================== */}
      {/* 3. EXTENDED ADD / EDIT PROJECT MODAL                           */}
      {/* ============================================================== */}
      {isModalOpen && canEdit && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl w-full max-w-2xl lg:max-w-3xl p-6 sm:p-7 max-h-[92vh] overflow-y-auto border border-slate-100 dark:border-slate-800 cursor-default"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                  <Film className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1A3668] dark:text-white">
                    {editingProject ? 'Edit Career Project' : 'Add New Career Project'}
                  </h3>
                  <p className="text-xs font-semibold text-[#607494] dark:text-slate-400">
                    Add or update shows, movies, music videos, roles, and watch platforms
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4">
              {/* Hidden Avatar File Input */}
              <input
                type="file"
                ref={avatarFileInputRef}
                accept="image/*"
                onChange={handleAvatarFileUpload}
                className="hidden"
              />

              {/* Hidden Banner File Input */}
              <input
                type="file"
                ref={bannerFileInputRef}
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleBannerFileUpload}
                className="hidden"
              />

              {/* Category & Artist Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => {
                      const nextCat = e.target.value as ProjectCategory;
                      const wasBrand = formCategory === 'owned_brands' || formCategory === 'partner_brands';
                      const isNowBrand = nextCat === 'owned_brands' || nextCat === 'partner_brands';
                      setFormCategory(nextCat);
                      if (!wasBrand && isNowBrand) {
                        // When selecting a brand venture, media gallery must start completely empty
                        setFormMediaPhotos([]);
                        if (!formBannerUrl && formImageUrl && !formImageUrl.includes('photo-1536440136628')) {
                          setFormBannerUrl(formImageUrl);
                        }
                      } else if (wasBrand && !isNowBrand) {
                        if (formMediaPhotos.length === 0) {
                          const fallback = formBannerUrl || formImageUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80';
                          setFormMediaPhotos([fallback]);
                          setFormImageUrl(fallback);
                        }
                      }
                    }}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value="shows">📺 Shows & Series</option>
                    <option value="movies">🎬 Movies & Theatrical</option>
                    <option value="music_videos">🎵 Music Videos & OSTs</option>
                    <option value="partner_brands">🤝 Partner Brands (Endorsements)</option>
                    <option value="owned_brands">👑 Owned Brands & Personal Ventures</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                    Artist / Involved <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formArtist}
                    onChange={(e) => setFormArtist(e.target.value as ProjectArtist)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value="jimmysea">🥑🌊 JimmySea (Pairing)</option>
                    <option value="jimmy">🥑 Jimmy Jitaraphol (Solo)</option>
                    <option value="sea">🌊 Sea Tawinan (Solo)</option>
                    <option value="avocean">🥑💚 Avocean Brand</option>
                  </select>
                </div>
              </div>

              {/* BRAND DISPLAY PHOTO / LOGO (Just like Fan Clubs profile avatar) */}
              {(formCategory === 'owned_brands' || formCategory === 'partner_brands') && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-50/70 to-indigo-50/70 dark:from-purple-950/40 dark:to-indigo-950/30 border border-purple-200/80 dark:border-purple-800/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      <span>Brand Display Photo / Logo</span>
                    </label>
                    <span className="text-[10.5px] text-purple-600 dark:text-purple-400 font-semibold">
                      ✨ Logo & Profile Avatar
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-purple-300 dark:border-purple-700 shadow-md overflow-hidden bg-white dark:bg-slate-800 shrink-0 flex items-center justify-center">
                      {formAvatarUrl ? (
                        <img
                          src={formAvatarUrl}
                          alt="Brand Logo"
                          className="w-full h-full object-cover"
                          onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                        />
                      ) : (
                        <span className="text-3xl select-none">
                          {formCategory === 'owned_brands' ? '👑' : '🤝'}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="url"
                          value={formAvatarUrl}
                          onChange={(e) => setFormAvatarUrl(e.target.value)}
                          placeholder="https://... (brand logo / profile picture URL)"
                          className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                        />
                        <button
                          type="button"
                          onClick={() => avatarFileInputRef.current?.click()}
                          disabled={isUploadingAvatar}
                          className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors shadow-2xs disabled:opacity-50"
                        >
                          {isUploadingAvatar ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Upload className="w-3.5 h-3.5" />
                          )}
                          <span>{isUploadingAvatar ? 'Uploading...' : 'Upload'}</span>
                        </button>
                        {formAvatarUrl && (
                          <button
                            type="button"
                            onClick={() => setFormAvatarUrl('')}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
                            title="Remove display photo"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Upload a square or circle logo from your computer/phone, or paste an image URL.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Title & Optional Thai Script Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-[#526586] dark:text-slate-400">
                      Project Title <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">Primary Name</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => {
                      setFormTitle(e.target.value);
                      setFormEnglishTitle(e.target.value);
                    }}
                    placeholder="e.g. Last Twilight, Vice Versa, Avocean..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Main display title for this show, brand, song, or project.</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-[#526586] dark:text-slate-400">
                      Thai Script Title <span className="text-slate-400 font-normal">(Optional / ถ้ามี)</span>
                    </label>
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium font-thai">ชื่อภาษาไทย</span>
                  </div>
                  <input
                    type="text"
                    value={formThaiTitle}
                    onChange={(e) => setFormThaiTitle(e.target.value)}
                    placeholder="e.g. ภาพนายไม่เคยลืม (Leave blank if none)"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400 font-thai"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Leave empty for brands, endorsements, or projects without a Thai title.</p>
                </div>
              </div>

              {/* Title & Content Typography Sizing Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
                <div>
                  <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1 flex items-center justify-between">
                    <span>Title Font Size</span>
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-extrabold uppercase">
                      {formTitleSize}
                    </span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['compact', 'medium', 'large'] as const).map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setFormTitleSize(size)}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold capitalize transition-all border cursor-pointer ${
                          formTitleSize === size
                            ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1 flex items-center justify-between">
                    <span>Card Text & Body Size</span>
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-extrabold uppercase">
                      {formFontSize}
                    </span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['compact', 'medium', 'large'] as const).map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setFormFontSize(size)}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold capitalize transition-all border cursor-pointer ${
                          formFontSize === size
                            ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* DEDICATED CHARACTER NAMES & BILLING FOR JIMMY AND SEA (Hidden for Brands) */}
              {!isBrandProject && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50/80 to-sky-50/60 dark:from-purple-950/40 dark:to-sky-950/30 border border-purple-200/90 dark:border-purple-800/70 space-y-3.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      <span>Jimmy &amp; Sea Character Names &amp; Billing</span>
                    </span>
                    <span className="text-[10.5px] font-semibold text-purple-700 dark:text-purple-300">
                      Displayed on Project Cards
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                        <span>🥑 Jimmy&apos;s Character Name</span>
                      </label>
                      <input
                        type="text"
                        value={formJimmyRole}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormJimmyRole(val);
                          // If combined role is empty or follows standard pattern, auto-sync
                          if (!formRole || formRole.includes('Jimmy as') || formRole.includes('Sea as')) {
                            const parts: string[] = [];
                            if (val.trim()) parts.push(val.toLowerCase().startsWith('jimmy as') ? val.trim() : `Jimmy as ${val.trim()}`);
                            if (formSeaRole.trim()) parts.push(formSeaRole.toLowerCase().startsWith('sea as') ? formSeaRole.trim() : `Sea as ${val.trim()}`);
                            setFormRole(parts.join(', '));
                          }
                        }}
                        placeholder="e.g. Pongpeun (or Mork, Puen, Wai)"
                        className="w-full rounded-xl border border-purple-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Character played by Jimmy in this project</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                        <span>🌊 Sea&apos;s Character Name</span>
                      </label>
                      <input
                        type="text"
                        value={formSeaRole}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormSeaRole(val);
                          // If combined role is empty or follows standard pattern, auto-sync
                          if (!formRole || formRole.includes('Jimmy as') || formRole.includes('Sea as')) {
                            const parts: string[] = [];
                            if (formJimmyRole.trim()) parts.push(formJimmyRole.toLowerCase().startsWith('jimmy as') ? formJimmyRole.trim() : `Jimmy as ${formJimmyRole.trim()}`);
                            if (val.trim()) parts.push(val.toLowerCase().startsWith('sea as') ? val.trim() : `Sea as ${val.trim()}`);
                            setFormRole(parts.join(', '));
                          }
                        }}
                        placeholder="e.g. Pepper (or Day, Talay, Pangpond)"
                        className="w-full rounded-xl border border-sky-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Character played by Sea in this project</p>
                    </div>
                  </div>

                  {/* Combined Character Billing Headline (e.g. Jimmy as Pongpeun, Sea as Pepper) */}
                  <div className="pt-2 border-t border-purple-200/60 dark:border-purple-900/40 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Full Character Billing Headline
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const parts: string[] = [];
                          if (formJimmyRole.trim()) {
                            parts.push(formJimmyRole.toLowerCase().startsWith('jimmy as') ? formJimmyRole.trim() : `Jimmy as ${formJimmyRole.trim()}`);
                          }
                          if (formSeaRole.trim()) {
                            parts.push(formSeaRole.toLowerCase().startsWith('sea as') ? formSeaRole.trim() : `Sea as ${formSeaRole.trim()}`);
                          }
                          setFormRole(parts.join(', '));
                        }}
                        className="text-[10.5px] font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                      >
                        ✨ Auto-Format: &quot;Jimmy as ..., Sea as ...&quot;
                      </button>
                    </div>

                    <input
                      type="text"
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value)}
                      placeholder="e.g. Jimmy as Pongpeun, Sea as Pepper"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                    />

                    {/* Character Presets */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      <span className="text-[10px] font-bold text-slate-400">Quick Presets:</span>
                      {[
                        { j: 'Pongpeun', s: 'Pepper', label: 'Jimmy as Pongpeun, Sea as Pepper' },
                        { j: 'Mork (Mork Methas)', s: 'Day (Day Wachirawit)', label: 'Jimmy as Mork, Sea as Day' },
                        { j: 'Tun / Puen', s: 'Talay / Tess', label: 'Jimmy as Puen, Sea as Talay' }
                      ].map((pre, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => {
                            setFormJimmyRole(pre.j);
                            setFormSeaRole(pre.s);
                            setFormRole(pre.label);
                          }}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-purple-300 text-slate-600 dark:text-slate-300 hover:text-purple-600 cursor-pointer transition-colors"
                        >
                          {pre.label}
                        </button>
                      ))}
                    </div>

                    {/* Live Character Badge Preview */}
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-purple-100 dark:border-purple-900/60 flex items-center justify-between flex-wrap gap-2">
                      <span className="text-[10.5px] font-bold text-slate-400">Live Preview on Card:</span>
                      <div className="flex flex-wrap items-center gap-2">
                        {formJimmyRole.trim() && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs sm:text-[13px] font-bold bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-200 border border-purple-200 dark:border-purple-800 shadow-2xs">
                            <span>🥑</span>
                            <span>{formJimmyRole.toLowerCase().startsWith('jimmy as') ? formJimmyRole : `Jimmy as ${formJimmyRole}`}</span>
                          </span>
                        )}
                        {formSeaRole.trim() && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs sm:text-[13px] font-bold bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-200 border border-sky-200 dark:border-sky-800 shadow-2xs">
                            <span>🌊</span>
                            <span>{formSeaRole.toLowerCase().startsWith('sea as') ? formSeaRole : `Sea as ${formSeaRole}`}</span>
                          </span>
                        )}
                        {!formJimmyRole.trim() && !formSeaRole.trim() && (
                          <span className="text-xs italic text-slate-400">
                            {formRole.trim() || 'Enter character names above to preview badges'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Status and Release / Filmed Period: Streamlined for Brands vs Shows */}
              {isBrandProject ? (
                <div>
                  <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1 flex items-center justify-between">
                    <span>Brand Status</span>
                    <span className="text-[10.5px] font-bold text-purple-600 dark:text-purple-400">
                      Active or Non-Active Venture
                    </span>
                  </label>
                  <select
                    value={formStatus === 'released' ? 'released' : formStatus === 'upcoming' ? 'upcoming' : 'active'}
                    onChange={(e) => setFormStatus(e.target.value as ProjectStatus)}
                    className="w-full rounded-xl border border-purple-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-xs font-bold text-[#1A3668] dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  >
                    <option value="active">🟢 Active (Current Brand / In Business)</option>
                    <option value="released">⚪ Non-Active (Past / Concluded / Inactive)</option>
                    <option value="upcoming">🕒 Upcoming Launch</option>
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                      Release / On-Air Period
                    </label>
                    <input
                      type="text"
                      value={formYear}
                      onChange={(e) => setFormYear(e.target.value)}
                      placeholder="e.g. 2024–2025 or Dec 2023 – Jan 2024"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                      Filmed Month / Year
                    </label>
                    <input
                      type="text"
                      value={formFilmedPeriod}
                      onChange={(e) => setFormFilmedPeriod(e.target.value)}
                      placeholder="e.g. January – April 2023"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                      Status
                    </label>
                    <select
                      value={formStatus === 'active' ? 'ongoing' : formStatus}
                      onChange={(e) => setFormStatus(e.target.value as ProjectStatus)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                    >
                      <option value="upcoming">🕒 Upcoming</option>
                      <option value="ongoing">📺 Airing</option>
                      <option value="released">🎬 Past Projects</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Highlight Note (Hidden for Brands) */}
              {!isBrandProject && (
                <div>
                  <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                    Highlight / Award / Key Feature
                  </label>
                  <input
                    type="text"
                    value={formHighlight}
                    onChange={(e) => setFormHighlight(e.target.value)}
                    placeholder="e.g. ⭐ Asian Television Awards Nominee · Debut BL Pairing"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                  Description / Synopsis
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Provide an overview of the show, song, brand collaboration, or venture..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs font-medium text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              {/* Director & Platform / Network (Hidden for Brands) */}
              {!isBrandProject && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                      Director (TV Series / Movies)
                    </label>
                    <input
                      type="text"
                      value={formDirector}
                      onChange={(e) => setFormDirector(e.target.value)}
                      placeholder="e.g. Aof Noppharnach or X Nuttapong"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                      Platform / Network / Company
                    </label>
                    <input
                      type="text"
                      value={formPlatform}
                      onChange={(e) => setFormPlatform(e.target.value)}
                      placeholder="e.g. GMMTV / YouTube, Clinic BKK, Sunbather"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* ============================================================== */}
              {/* MEDIA & BANNER SECTIONS: DEDICATED FOR BRANDS VS SHOWS / MOVIES */}
              {/* ============================================================== */}
              {isBrandProject ? (
                <>
                  {/* ============================================================== */}
                  {/* SECTION 1: DEDICATED BRAND HEADER BANNER (COVER)              */}
                  {/* ============================================================== */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50/70 via-indigo-50/50 to-purple-50/70 dark:from-purple-950/40 dark:via-indigo-950/30 dark:to-purple-950/40 border border-purple-200/90 dark:border-purple-800/70 space-y-3.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-black text-[#1A3668] dark:text-white flex items-center gap-1.5 uppercase tracking-wide">
                          <ImageIcon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                          <span>Brand Header Banner</span>
                        </label>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          📐 Landscape Top Banner
                        </span>
                      </div>
                      <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
                        Top banner image across the card
                      </span>
                    </div>

                    {/* Banner Media Sizing (Cover/Contain) & Vertical Framing */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-purple-100 dark:border-slate-800 shadow-2xs">
                      {/* Fit Style: Auto-Fit (Contain) vs Fill Area (Cover) */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-[#1A3668] dark:text-slate-300 flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Maximize2 className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                            <span>Banner Sizing &amp; Auto-Fit</span>
                          </span>
                          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-extrabold uppercase">
                            {formMediaFit === 'contain' ? '⚡ Auto-Fit (100% visible)' : '🖼️ Fill Area'}
                          </span>
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setFormMediaFit('cover')}
                            className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all border cursor-pointer ${
                              formMediaFit === 'cover'
                                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            Fill Area (Cover)
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormMediaFit('contain')}
                            className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all border cursor-pointer ${
                              formMediaFit === 'contain'
                                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                            }`}
                            title="Shows the entire banner image without cropping"
                          >
                            Auto-Fit (Contain)
                          </button>
                        </div>
                      </div>

                      {/* Vertical Framing / Offset Adjustment */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-[#1A3668] dark:text-slate-300">
                          <span className="flex items-center gap-1">
                            <Sliders className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                            <span>Banner Focal Position</span>
                          </span>
                          <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400">
                            {formMediaOffsetY}%
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 font-bold shrink-0">Top</span>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={formMediaOffsetY}
                            onChange={(e) => setFormMediaOffsetY(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                          />
                          <span className="text-[10px] text-slate-400 font-bold shrink-0">Bottom</span>
                        </div>
                        <div className="flex items-center justify-end gap-1 pt-0.5">
                          <button
                            type="button"
                            onClick={() => setFormMediaOffsetY(15)}
                            className={`text-[9.5px] px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer ${
                              formMediaOffsetY === 15 ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-purple-600'
                            }`}
                          >
                            Top 15%
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormMediaOffsetY(50)}
                            className={`text-[9.5px] px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer ${
                              formMediaOffsetY === 50 ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-purple-600'
                            }`}
                          >
                            Center 50%
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormMediaOffsetY(85)}
                            className={`text-[9.5px] px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer ${
                              formMediaOffsetY === 85 ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-purple-600'
                            }`}
                          >
                            Bottom 85%
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Live Banner Preview Box */}
                    {(() => {
                      const currentBannerPhoto = formBannerUrl || formImageUrl;

                      return (
                        <div className="relative rounded-2xl overflow-hidden border border-purple-200 dark:border-slate-700 bg-slate-900 shadow-sm">
                          {currentBannerPhoto && !bannerLoadError ? (
                            <div className="relative w-full aspect-[16/7] sm:aspect-[2.2/1] max-h-[220px] overflow-hidden bg-slate-950 flex items-center justify-center group">
                              {/* Ambient Blurred Backdrop when Auto-Fit (contain) is active */}
                              {formMediaFit === 'contain' && (
                                <div
                                  className="absolute inset-0 bg-cover bg-center filter blur-xl opacity-35 scale-110 pointer-events-none"
                                  style={{
                                    backgroundImage: `url(${currentBannerPhoto})`
                                  }}
                                />
                              )}

                              <img
                                src={currentBannerPhoto}
                                alt={formTitle || 'Brand Banner Preview'}
                                onError={() => setBannerLoadError(true)}
                                onLoad={() => setBannerLoadError(false)}
                                style={{
                                  objectPosition: `center ${formMediaOffsetY}%`
                                }}
                                className={`w-full h-full relative z-10 transition-transform duration-300 ${
                                  formMediaFit === 'contain' ? 'object-contain' : 'object-cover group-hover:scale-105'
                                }`}
                              />
                              <div className="absolute bottom-0 inset-x-0 h-24 z-20 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

                              {/* Top Badges (Category & Artist) */}
                              <div className="absolute top-3 inset-x-3 z-30 flex items-center justify-between gap-2 pointer-events-none">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider backdrop-blur-md ${getCategoryBadgeStyle(formCategory)}`}>
                                  {getCategoryIcon(formCategory)}
                                  <span>{getCategoryBadge(formCategory)}</span>
                                </span>

                                {(() => {
                                  const artistInfo = getArtistLabel(formArtist);
                                  return (
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold border backdrop-blur-md ${artistInfo.bg}`}>
                                      <span>{artistInfo.emoji}</span>
                                      <span>{artistInfo.label}</span>
                                    </span>
                                  );
                                })()}
                              </div>

                              {/* Top Right Action: Lightbox */}
                              <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setLightboxImageUrl({
                                      url: currentBannerPhoto,
                                      title: formTitle ? `${formTitle} Banner` : 'Brand Banner Preview',
                                      photos: [currentBannerPhoto],
                                      currentIndex: 0
                                    })
                                  }
                                  className="p-2 rounded-full bg-black/60 text-white hover:bg-black/90 backdrop-blur-md shadow-md cursor-pointer transition-transform hover:scale-110"
                                  title="View Full Resolution Banner in Lightbox"
                                >
                                  <Maximize2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Bottom Overlay with Real-time Title, Avatar, Status */}
                              <div className="absolute bottom-3 inset-x-3 z-30 space-y-1.5 pointer-events-none">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-200 bg-purple-950/70 px-2 py-0.5 rounded-full border border-purple-500/40">
                                    {formCategory === 'owned_brands' ? '👑 Owned Brand' : '🤝 Partner Brand'}
                                  </span>
                                  {(() => {
                                    const statusObj = getStatusBadge(formStatus, formCategory);
                                    return (
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider backdrop-blur-md ${statusObj.color}`}>
                                        {statusObj.label}
                                      </span>
                                    );
                                  })()}
                                </div>
                                <div className="flex items-center gap-2 min-w-0">
                                  {formAvatarUrl && (
                                    <img
                                      src={formAvatarUrl}
                                      alt="Brand avatar"
                                      className="w-7 h-7 rounded-full object-cover border-2 border-white/80 shadow-xs shrink-0"
                                    />
                                  )}
                                  <h4 className="text-sm sm:text-base font-black text-white line-clamp-1 drop-shadow-md flex items-center gap-1.5 flex-wrap">
                                    <span>{formTitle || 'Brand Title'}</span>
                                    {formThaiTitle && formThaiTitle.trim().length > 0 && (
                                      <>
                                        <span className="text-purple-300 font-bold select-none text-[0.85em]">•</span>
                                        <span className="text-[0.95em] sm:text-[1em] font-bold text-slate-100 font-thai tracking-normal">{formThaiTitle.trim()}</span>
                                      </>
                                    )}
                                  </h4>
                                </div>
                              </div>
                            </div>
                          ) : bannerLoadError ? (
                            <div className="p-8 text-center flex flex-col items-center justify-center gap-2 bg-rose-50/10 text-slate-300">
                              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-xl">
                                ⚠️
                              </div>
                              <p className="text-xs font-bold text-rose-400">
                                Unable to load banner image from URL
                              </p>
                              <p className="text-[11px] text-slate-400 max-w-sm">
                                The link provided might be restricted or invalid. You can upload an image directly from your computer or phone below.
                              </p>
                              <button
                                type="button"
                                onClick={() => bannerFileInputRef.current?.click()}
                                className="mt-1 px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 cursor-pointer"
                              >
                                Upload Banner File Instead
                              </button>
                            </div>
                          ) : (
                            <div
                              onClick={() => bannerFileInputRef.current?.click()}
                              className="p-8 text-center flex flex-col items-center justify-center gap-2.5 cursor-pointer hover:bg-slate-800/80 transition-colors"
                            >
                              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                                <ImageIcon className="w-6 h-6" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-200">
                                  No brand header banner selected yet
                                </p>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  Upload a horizontal landscape banner or paste a banner image URL below
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Banner Upload & URL Controls */}
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <button
                          type="button"
                          disabled={isUploadingBanner}
                          onClick={() => bannerFileInputRef.current?.click()}
                          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer transition-all shrink-0 disabled:opacity-50 shadow-xs"
                        >
                          {isUploadingBanner ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Uploading Banner...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-3.5 h-3.5" />
                              <span>Upload Banner (Device)</span>
                            </>
                          )}
                        </button>

                        <div className="flex-1 flex gap-1.5">
                          <input
                            type="url"
                            value={formBannerUrl}
                            onChange={(e) => {
                              setFormBannerUrl(e.target.value);
                              setFormImageUrl(e.target.value);
                              setBannerLoadError(false);
                            }}
                            placeholder="Or paste brand header banner image URL..."
                            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400 placeholder-slate-400"
                          />
                          {formBannerUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                setFormBannerUrl('');
                                setFormImageUrl('');
                              }}
                              className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
                              title="Clear banner URL"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Sample Brand Banners Quick Presets */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-purple-500" />
                          <span>Quick Sample Banners:</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const u = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&auto=format&fit=crop&q=80';
                            setFormBannerUrl(u);
                            setFormImageUrl(u);
                            setBannerLoadError(false);
                          }}
                          className="text-[10.5px] font-semibold px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          🏬 Boutique Store
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const u = 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1600&auto=format&fit=crop&q=80';
                            setFormBannerUrl(u);
                            setFormImageUrl(u);
                            setBannerLoadError(false);
                          }}
                          className="text-[10.5px] font-semibold px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          🛍️ Apparel Banner
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const u = 'https://images.unsplash.com/photo-1513094735237-8f2714d57c13?w=1600&auto=format&fit=crop&q=80';
                            setFormBannerUrl(u);
                            setFormImageUrl(u);
                            setBannerLoadError(false);
                          }}
                          className="text-[10.5px] font-semibold px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          ✨ Lifestyle Studio
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ============================================================== */}
                  {/* SECTION 2: BRAND MEDIA GALLERY & CAMPAIGN LOOKBOOK             */}
                  {/* ============================================================== */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-3.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-black text-[#1A3668] dark:text-white flex items-center gap-1.5 uppercase tracking-wide">
                          <Layers className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                          <span>Brand Media &amp; Lookbook Gallery ({formMediaPhotos.length})</span>
                        </label>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          ✨ Separate from Banner
                        </span>
                      </div>
                      <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
                        Product photos, lookbook shots &amp; campaign images
                      </span>
                    </div>

                    <p className="text-[11px] text-[#526586] dark:text-slate-400 leading-relaxed">
                      Add campaign photos, product shots, lookbooks, or event pictures. These will display in a dedicated, interactive photo gallery inside the brand card body below the overview and synopsis.
                    </p>

                    {/* Media Thumbnails Strip */}
                    {formMediaPhotos.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-[#526586] dark:text-slate-400">
                          <span>Media Items in Gallery ({formMediaPhotos.length})</span>
                          <span className="text-[10px] text-slate-400">Click a thumbnail to view full resolution</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
                          {formMediaPhotos.map((photo, idx) => (
                            <div
                              key={idx}
                              className="relative p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-purple-300 transition-all flex flex-col justify-between group shadow-2xs"
                            >
                              <div
                                onClick={() =>
                                  setLightboxImageUrl({
                                    url: photo,
                                    title: `${formTitle || 'Brand Media'} Photo #${idx + 1} of ${formMediaPhotos.length}`,
                                    photos: formMediaPhotos,
                                    currentIndex: idx
                                  })
                                }
                                className="relative aspect-square rounded-lg overflow-hidden bg-slate-950 mb-1.5 cursor-pointer"
                              >
                                <img
                                  src={photo}
                                  alt={`Brand Media ${idx + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                />
                                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[9px] font-mono">
                                  #{idx + 1}
                                </span>
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                  <Maximize2 className="w-4 h-4 text-white drop-shadow-md" />
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-1 pt-0.5">
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                  Photo #{idx + 1}
                                </span>

                                <div className="flex items-center gap-1">
                                  {idx > 0 && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMoveMediaPhoto(idx, idx - 1);
                                      }}
                                      className="p-1 rounded text-slate-400 hover:text-purple-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                      title="Move earlier"
                                    >
                                      <ArrowUp className="w-3 h-3" />
                                    </button>
                                  )}
                                  {idx < formMediaPhotos.length - 1 && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMoveMediaPhoto(idx, idx + 1);
                                      }}
                                      className="p-1 rounded text-slate-400 hover:text-purple-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                      title="Move later"
                                    >
                                      <ArrowDown className="w-3 h-3" />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveMediaPhoto(idx);
                                    }}
                                    className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                                    title="Delete this media photo"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => posterFileInputRef.current?.click()}
                        className="p-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-center flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-purple-400 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                          <Layers className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                            No brand media photos added yet (Optional)
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Click to upload lookbook photos, or paste image URLs below
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Media Upload & Multi-URL Input Controls */}
                    <div className="space-y-3">
                      {/* Upload Device Files Button */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <button
                          type="button"
                          disabled={isUploadingPoster}
                          onClick={() => posterFileInputRef.current?.click()}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/80 dark:hover:bg-purple-900/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold cursor-pointer transition-all disabled:opacity-50 shadow-2xs"
                        >
                          {isUploadingPoster ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Compressing &amp; Adding...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-3.5 h-3.5" />
                              <span>Upload Photos from Device (Multiple)</span>
                            </>
                          )}
                        </button>
                        <span className="text-[10.5px] font-semibold text-slate-400">
                          Supports JPG, PNG, WEBP, GIF
                        </span>
                      </div>

                      {/* Multi-URL Input Box with Live Detection Counter */}
                      {(() => {
                        const urlMatches = newMediaUrlInput.match(/(https?:\/\/[^\s"',<>[\]]+|data:image\/[^\s"',<>[\]]+)/gi) || [];
                        const detectedCount = urlMatches.length > 0
                          ? urlMatches.length
                          : newMediaUrlInput.split(/[\n\r,\s;]+/).filter(Boolean).length;

                        return (
                          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-purple-200/90 dark:border-slate-700 shadow-2xs space-y-2">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <label className="text-[11px] font-bold text-[#1A3668] dark:text-slate-200 flex items-center gap-1.5">
                                <Link2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                <span>Paste Image URLs (Add Multiple URLs at Once)</span>
                              </label>
                              {detectedCount > 0 && (
                                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                  ✨ {detectedCount} {detectedCount === 1 ? 'URL detected' : 'URLs detected ready to add'}
                                </span>
                              )}
                            </div>

                            <textarea
                              rows={2}
                              value={newMediaUrlInput}
                              onChange={(e) => setNewMediaUrlInput(e.target.value)}
                              onKeyDown={(e) => {
                                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddMediaUrl(newMediaUrlInput);
                                }
                              }}
                              placeholder="Paste one or multiple image URLs here...&#10;URLs can be separated by new line, space, or comma (e.g. https://.../pic1.jpg https://.../pic2.jpg)"
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-2.5 text-xs font-medium text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400 placeholder-slate-400 font-mono transition-all leading-relaxed"
                            />

                            <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5">
                              <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                                💡 Tip: Paste multiple links at once (separated by Enter, commas, or spaces).
                              </p>
                              <div className="flex items-center gap-2">
                                {newMediaUrlInput && (
                                  <button
                                    type="button"
                                    onClick={() => setNewMediaUrlInput('')}
                                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer font-bold px-2 py-1"
                                  >
                                    Clear
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleAddMediaUrl(newMediaUrlInput)}
                                  disabled={!newMediaUrlInput.trim()}
                                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white text-xs font-bold cursor-pointer transition-all shadow-xs flex items-center gap-1.5"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>
                                    {detectedCount > 1
                                      ? `Add All ${detectedCount} Photos at Once`
                                      : detectedCount === 1
                                      ? 'Add Photo'
                                      : 'Add Media'}
                                  </span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Brand Media Quick Presets */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-purple-500" />
                          <span>Quick Add Samples:</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddMediaUrl('https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80')}
                          className="text-[10.5px] font-semibold px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          👕 Lookbook
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddMediaUrl('https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&auto=format&fit=crop&q=80')}
                          className="text-[10.5px] font-semibold px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          🛍️ Merch &amp; Store
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddMediaUrl('https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80')}
                          className="text-[10.5px] font-semibold px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          📸 Campaign Photoshoot
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleAddMediaUrl(
                              [
                                'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80',
                                'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&auto=format&fit=crop&q=80',
                                'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80'
                              ].join('\n')
                            )
                          }
                          className="text-[10.5px] font-bold px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950/80 border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-100 cursor-pointer shadow-2xs"
                          title="Adds 3 lookbook photos at once as a multi-URL demo"
                        >
                          ✨ Batch Add 3 Photos at Once
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* ============================================================== */
                /* SECTION 3: TV SHOWS, MOVIES & MUSIC VIDEOS THEATRICAL POSTERS  */
                /* ============================================================== */
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-[#1A3668] dark:text-white flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span>Project Photos &amp; Media ({formMediaPhotos.length})</span>
                      </label>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        Multi-Photo Enabled
                      </span>
                    </div>

                    {/* Ratio Toggles for Shows vs 16:10 Card */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400 mr-0.5">Ratio:</span>
                      <button
                        type="button"
                        onClick={() => setPosterPreviewAspect('card')}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          posterPreviewAspect === 'card'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                        title="16:10 Landscape Card Preview"
                      >
                        16:10 Card
                      </button>
                      <button
                        type="button"
                        onClick={() => setPosterPreviewAspect('poster')}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          posterPreviewAspect === 'poster'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                        title="2:3 Portrait Poster Preview"
                      >
                        2:3 Poster
                      </button>
                    </div>
                  </div>

                  {/* Media Fit (Auto Fit vs Fill Area) & Vertical Adjustment Slider */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    {/* Fit Style: Auto-Fit (Contain) vs Fill Area (Cover) */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-[#1A3668] dark:text-slate-300 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Maximize2 className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                          <span>Media Sizing &amp; Auto-Fit</span>
                        </span>
                        <span className="text-[10px] text-purple-600 dark:text-purple-400 font-extrabold uppercase">
                          {formMediaFit === 'contain' ? '⚡ Auto-Fit (100% visible)' : '🖼️ Fill Area'}
                        </span>
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setFormMediaFit('cover')}
                          className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all border cursor-pointer ${
                            formMediaFit === 'cover'
                              ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          Fill Area (Cover)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormMediaFit('contain')}
                          className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all border cursor-pointer ${
                            formMediaFit === 'contain'
                              ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                          }`}
                          title="Shows the entire poster/media without cropping any heads, text, or borders"
                        >
                          Auto-Fit (Contain)
                        </button>
                      </div>
                    </div>

                    {/* Vertical Framing / Offset Adjustment */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-[#1A3668] dark:text-slate-300">
                        <span className="flex items-center gap-1">
                          <Sliders className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                          <span>Framing Focal Adjustment</span>
                        </span>
                        <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400">
                          {formMediaOffsetY}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-bold shrink-0">Top</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={formMediaOffsetY}
                          onChange={(e) => setFormMediaOffsetY(Number(e.target.value))}
                          className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                        />
                        <span className="text-[10px] text-slate-400 font-bold shrink-0">Bottom</span>
                      </div>
                      <div className="flex items-center justify-end gap-1 pt-0.5">
                        <button
                          type="button"
                          onClick={() => setFormMediaOffsetY(15)}
                          className={`text-[9.5px] px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer ${
                            formMediaOffsetY === 15 ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-purple-600'
                          }`}
                        >
                          Top 15%
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormMediaOffsetY(50)}
                          className={`text-[9.5px] px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer ${
                            formMediaOffsetY === 50 ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-purple-600'
                          }`}
                        >
                          Center 50%
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormMediaOffsetY(85)}
                          className={`text-[9.5px] px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer ${
                            formMediaOffsetY === 85 ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-purple-600'
                          }`}
                        >
                          Bottom 85%
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Live Card Preview Box */}
                  {(() => {
                    const currentPreviewPhoto =
                      formMediaPhotos[formActiveMediaIndex] ||
                      formMediaPhotos[0] ||
                      formImageUrl;

                    return (
                      <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 shadow-md">
                        {currentPreviewPhoto && !posterLoadError ? (
                          <div
                            className={`relative w-full ${
                              posterPreviewAspect === 'card'
                                ? 'aspect-[16/10]'
                                : 'aspect-[2/3] max-h-[360px]'
                            } overflow-hidden bg-slate-950 flex items-center justify-center group`}
                          >
                            {/* Ambient Blurred Backdrop when Auto-Fit (contain) is active */}
                            {formMediaFit === 'contain' && (
                              <div
                                className="absolute inset-0 bg-cover bg-center filter blur-xl opacity-35 scale-110 pointer-events-none"
                                style={{
                                  backgroundImage: `url(${currentPreviewPhoto})`
                                }}
                              />
                            )}

                            <img
                              src={currentPreviewPhoto}
                              alt={formTitle || 'Project Poster Preview'}
                              onError={() => setPosterLoadError(true)}
                              onLoad={() => setPosterLoadError(false)}
                              style={{
                                objectPosition: `center ${formMediaOffsetY}%`
                              }}
                              className={`w-full h-full relative z-10 transition-transform duration-300 ${
                                formMediaFit === 'contain' ? 'object-contain' : 'object-cover group-hover:scale-105'
                              }`}
                            />
                            <div className="absolute bottom-0 inset-x-0 h-24 z-20 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

                            {/* Top Badges (Category & Artist) */}
                            <div className="absolute top-3 inset-x-3 z-30 flex items-center justify-between gap-2 pointer-events-none">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider backdrop-blur-md ${getCategoryBadgeStyle(formCategory)}`}>
                                {getCategoryIcon(formCategory)}
                                <span>{getCategoryBadge(formCategory)}</span>
                              </span>

                              {(() => {
                                const artistInfo = getArtistLabel(formArtist);
                                return (
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold border backdrop-blur-md ${artistInfo.bg}`}>
                                    <span>{artistInfo.emoji}</span>
                                    <span>{artistInfo.label}</span>
                                  </span>
                                );
                              })()}
                            </div>

                            {/* Top Right Actions: Lightbox + Photo Counter */}
                            <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5">
                              {formMediaPhotos.length > 1 && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-black/60 text-white backdrop-blur-md border border-white/20">
                                  📷 {formActiveMediaIndex + 1} / {formMediaPhotos.length}
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  setLightboxImageUrl({
                                    url: currentPreviewPhoto,
                                    title: `${formTitle || 'Poster Preview'} ${
                                      formMediaPhotos.length > 1
                                        ? `(Photo ${formActiveMediaIndex + 1} of ${formMediaPhotos.length})`
                                        : ''
                                    }`,
                                    photos: formMediaPhotos.length > 0 ? formMediaPhotos : [currentPreviewPhoto],
                                    currentIndex: formActiveMediaIndex
                                  })
                                }
                                className="p-2 rounded-full bg-black/60 text-white hover:bg-black/90 backdrop-blur-md shadow-md cursor-pointer transition-transform hover:scale-110"
                                title="View Full Resolution in Lightbox"
                              >
                                <Maximize2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Carousel Navigation Arrows if multiple photos */}
                            {formMediaPhotos.length > 1 && (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFormActiveMediaIndex((prev) => (prev - 1 + formMediaPhotos.length) % formMediaPhotos.length);
                                  }}
                                  className="absolute left-2.5 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md shadow-md cursor-pointer transition-all hover:scale-110"
                                  title="Previous Media Photo"
                                >
                                  <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFormActiveMediaIndex((prev) => (prev + 1) % formMediaPhotos.length);
                                  }}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md shadow-md cursor-pointer transition-all hover:scale-110"
                                  title="Next Media Photo"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </>
                            )}

                            {/* Bottom Overlay with Real-time Title, Status, and Year */}
                            <div className="absolute bottom-3 inset-x-3 z-30 space-y-1.5 pointer-events-none">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[11px] font-bold text-white/90 drop-shadow-xs">
                                  {formYear || 'Year'}
                                </span>
                                {(() => {
                                  const statusObj = getStatusBadge(formStatus, formCategory);
                                  return (
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider backdrop-blur-md ${statusObj.color}`}>
                                      {statusObj.label}
                                    </span>
                                  );
                                })()}
                              </div>
                              <div className="flex items-center gap-2 min-w-0">
                                <h4 className="text-sm sm:text-base font-black text-white line-clamp-1 drop-shadow-md flex items-center gap-1.5 flex-wrap">
                                  <span>{formTitle || 'Your Project Title Here'}</span>
                                  {formThaiTitle && formThaiTitle.trim().length > 0 && (
                                    <>
                                      <span className="text-purple-300 font-bold select-none text-[0.85em]">•</span>
                                      <span className="text-[0.95em] sm:text-[1em] font-bold text-slate-100 font-thai tracking-normal">{formThaiTitle.trim()}</span>
                                    </>
                                  )}
                                </h4>
                              </div>
                            </div>
                          </div>
                        ) : posterLoadError ? (
                          <div className="p-8 text-center flex flex-col items-center justify-center gap-2 bg-rose-50/10 text-slate-300">
                            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-xl">
                              ⚠️
                            </div>
                            <p className="text-xs font-bold text-rose-400">
                              Unable to load image from URL
                            </p>
                            <p className="text-[11px] text-slate-400 max-w-sm">
                              The link provided might be restricted, expired, or invalid. You can upload an image directly from your computer or phone below.
                            </p>
                            <button
                              type="button"
                              onClick={() => posterFileInputRef.current?.click()}
                              className="mt-1 px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 cursor-pointer"
                            >
                              Upload Local File Instead
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => posterFileInputRef.current?.click()}
                            className="p-8 text-center flex flex-col items-center justify-center gap-2.5 cursor-pointer hover:bg-slate-800/80 transition-colors"
                          >
                            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                              <ImageIcon className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-200">
                                No poster image selected yet
                              </p>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Upload a photo from your device or paste an image URL below
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Thumbnails Collection Manager (Active Photos Carousel) */}
                  {formMediaPhotos.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-[#526586] dark:text-slate-400">
                        <span>Media Photos Strip ({formMediaPhotos.length})</span>
                        <span className="text-[10px] text-slate-400">
                          ⭐ Main cover is photo #1
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-44 overflow-y-auto pr-1">
                        {formMediaPhotos.map((photo, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setFormActiveMediaIndex(idx);
                              setFormImageUrl(photo);
                              setPosterLoadError(false);
                            }}
                            className={`relative p-1.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                              formActiveMediaIndex === idx
                                ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-500 ring-2 ring-purple-400/50'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-purple-300'
                            }`}
                          >
                            <div className="relative aspect-[16/10] rounded-lg overflow-hidden bg-slate-950 mb-1.5">
                              <img
                                src={photo}
                                alt={`Media ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                              {idx === 0 && (
                                <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-amber-500 text-white text-[9px] font-black uppercase shadow-xs">
                                  Primary
                                </span>
                              )}
                              <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/70 text-white text-[8.5px] font-mono">
                                #{idx + 1}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-1 pt-0.5">
                              {idx !== 0 ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSetPrimaryMedia(idx);
                                  }}
                                  className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                                  title="Make this the main cover poster"
                                >
                                  Set Main
                                </button>
                              ) : (
                                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                                  Cover
                                </span>
                              )}

                              <div className="flex items-center gap-1">
                                {idx > 0 && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMoveMediaPhoto(idx, idx - 1);
                                    }}
                                    className="p-1 rounded text-slate-400 hover:text-purple-600 cursor-pointer"
                                    title="Move earlier"
                                  >
                                    <ArrowUp className="w-3 h-3" />
                                  </button>
                                )}
                                {idx < formMediaPhotos.length - 1 && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMoveMediaPhoto(idx, idx + 1);
                                    }}
                                    className="p-1 rounded text-slate-400 hover:text-purple-600 cursor-pointer"
                                    title="Move later"
                                  >
                                    <ArrowDown className="w-3 h-3" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveMediaPhoto(idx);
                                  }}
                                  className="p-1 rounded text-rose-500 hover:text-rose-700 cursor-pointer"
                                  title="Delete this photo"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Row: Upload Button + Multi-URL Input */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <button
                        type="button"
                        disabled={isUploadingPoster}
                        onClick={() => posterFileInputRef.current?.click()}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/80 dark:hover:bg-purple-900/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold cursor-pointer transition-all disabled:opacity-50 shadow-2xs"
                      >
                        {isUploadingPoster ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Compressing &amp; Adding...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload From Device (Multiple Photos)</span>
                          </>
                        )}
                      </button>
                      <span className="text-[10.5px] font-semibold text-slate-400">
                        Supports JPG, PNG, WEBP, GIF
                      </span>
                    </div>

                    {/* Multi-URL Input Box with Live Detection Counter */}
                    {(() => {
                      const urlMatches = newMediaUrlInput.match(/(https?:\/\/[^\s"',<>[\]]+|data:image\/[^\s"',<>[\]]+)/gi) || [];
                      const detectedCount = urlMatches.length > 0
                        ? urlMatches.length
                        : newMediaUrlInput.split(/[\n\r,\s;]+/).filter(Boolean).length;

                      return (
                        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-purple-200/90 dark:border-slate-700 shadow-2xs space-y-2">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <label className="text-[11px] font-bold text-[#1A3668] dark:text-slate-200 flex items-center gap-1.5">
                              <Link2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                              <span>Paste Poster URLs (Add Multiple URLs at Once)</span>
                            </label>
                            {detectedCount > 0 && (
                              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                ✨ {detectedCount} {detectedCount === 1 ? 'URL detected' : 'URLs detected ready to add'}
                              </span>
                            )}
                          </div>

                          <textarea
                            rows={2}
                            value={newMediaUrlInput}
                            onChange={(e) => setNewMediaUrlInput(e.target.value)}
                            onKeyDown={(e) => {
                              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                                e.preventDefault();
                                handleAddMediaUrl(newMediaUrlInput);
                              }
                            }}
                            placeholder="Paste one or multiple poster URLs here...&#10;URLs can be separated by new line, space, or comma (e.g. https://.../poster1.jpg https://.../poster2.jpg)"
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-2.5 text-xs font-medium text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400 placeholder-slate-400 font-mono transition-all leading-relaxed"
                          />

                          <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5">
                            <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                              💡 Tip: Paste multiple links at once (separated by Enter, commas, or spaces).
                            </p>
                            <div className="flex items-center gap-2">
                              {newMediaUrlInput && (
                                <button
                                  type="button"
                                  onClick={() => setNewMediaUrlInput('')}
                                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer font-bold px-2 py-1"
                                >
                                  Clear
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleAddMediaUrl(newMediaUrlInput)}
                                disabled={!newMediaUrlInput.trim()}
                                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white text-xs font-bold cursor-pointer transition-all shadow-xs flex items-center gap-1.5"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>
                                  {detectedCount > 1
                                    ? `Add All ${detectedCount} Posters at Once`
                                    : detectedCount === 1
                                    ? 'Add Poster'
                                    : 'Add Media'}
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Sample Posters Quick Presets */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-purple-500" />
                        <span>Add Sample Posters:</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddMediaUrl('https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80')}
                        className="text-[10.5px] font-semibold px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        🎬 Cinema Sunset
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddMediaUrl('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80')}
                        className="text-[10.5px] font-semibold px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        🎭 Theater Spotlight
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddMediaUrl('https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80')}
                        className="text-[10.5px] font-semibold px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        ✨ Concert &amp; Stage
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Hidden File Input for Device Multiple Poster Upload */}
              <input
                ref={posterFileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                onChange={handlePosterFileUpload}
                className="hidden"
              />

              {/* MULTIPLE WHERE TO WATCH & OFFICIAL LINKS BUILDER */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#1A3668] dark:text-white flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 fill-current" />
                    <span>Where to Watch / Official Streaming & Websites ({formWatchLinks.length})</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddWatchLink}
                    className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                  >
                    + Add Link
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {formWatchLinks.map((link, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                    >
                      <select
                        value={link.platform || 'Viki'}
                        onChange={(e) => handleUpdateWatchLink(idx, 'platform', e.target.value)}
                        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1.5 text-xs font-bold text-[#1A3668] dark:text-white shrink-0"
                      >
                        {PROJECT_WATCH_PLATFORMS.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.icon} {p.label}
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        value={link.label}
                        onChange={(e) => handleUpdateWatchLink(idx, 'label', e.target.value)}
                        placeholder={`Label (defaults to ${link.platform || 'Platform'})`}
                        className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-[#1A3668] dark:text-white"
                      />

                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => handleUpdateWatchLink(idx, 'url', e.target.value)}
                        placeholder="Paste URL (auto-detects platform)..."
                        className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-[#1A3668] dark:text-white font-mono"
                      />

                      <button
                        type="button"
                        onClick={() => handleRemoveWatchLink(idx)}
                        disabled={formWatchLinks.length === 1}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer shrink-0 self-end sm:self-auto"
                        title="Remove link"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* OFFICIAL SHOW SOCIAL MEDIA & SHOW WEBSITES */}
              <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#1A3668] dark:text-white flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Official Show Social Accounts &amp; Websites</span>
                  </label>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">
                    Series / Project Accounts
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                      <span>𝕏 Official Show Twitter / X</span>
                    </label>
                    <input
                      type="text"
                      value={formTwitterUrl}
                      onChange={(e) => setFormTwitterUrl(e.target.value)}
                      placeholder="e.g. @ViceVersaSeries or https://x.com/..."
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                      <span>📸 Official Show Instagram</span>
                    </label>
                    <input
                      type="text"
                      value={formInstagramUrl}
                      onChange={(e) => setFormInstagramUrl(e.target.value)}
                      placeholder="e.g. @viceversaseries or https://instagram.com/..."
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Globe className="w-3 h-3 text-purple-500" />
                      <span>Official Websites &amp; External Links ({formCustomWebsites.length})</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleAddProjectCustomWebsite}
                      className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                    >
                      + Add Website
                    </button>
                  </div>

                  {formCustomWebsites.length === 0 ? (
                    <button
                      type="button"
                      onClick={handleAddProjectCustomWebsite}
                      className="w-full py-2 px-3 border border-dashed border-purple-300/80 dark:border-purple-800/80 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:border-purple-500 hover:text-purple-600 cursor-pointer text-left transition-colors flex items-center justify-between bg-white/60 dark:bg-slate-900/60"
                    >
                      <span>Add official show website (e.g. GMMTV Show Page, Merch Shop, Fan Page)...</span>
                      <span className="text-purple-600 dark:text-purple-400 font-black">+ Add</span>
                    </button>
                  ) : (
                    <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                      {formCustomWebsites.map((site, idx) => (
                        <div
                          key={site.id || idx}
                          className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center gap-2"
                        >
                          <input
                            type="text"
                            value={site.label}
                            onChange={(e) => handleUpdateProjectCustomWebsite(idx, 'label', e.target.value)}
                            placeholder="Site Label (e.g. GMMTV Official Site)"
                            className="w-1/3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-[#1A3668] dark:text-white"
                          />
                          <input
                            type="url"
                            value={site.url}
                            onChange={(e) => handleUpdateProjectCustomWebsite(idx, 'url', e.target.value)}
                            placeholder="https://..."
                            className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-[#1A3668] dark:text-white font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveProjectCustomWebsite(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                            title="Remove website"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Official Hashtags with Quick Add Pills */}
              <OfficialHashtagPicker
                value={formTags}
                onChange={setFormTags}
                onShowToast={showToast}
                title="Official Project Hashtags"
                placeholder="e.g. #LastTwilightSeries #GMMTV #JimmySea #AVOCEAN"
              />

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-bold text-[#526586] dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: currentAccent.colorHex }}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold text-white shadow-xs cursor-pointer hover:opacity-90"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{editingProject ? 'Save Changes' : 'Create Project'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. LIGHTBOX PHOTO VIEWER & MULTI-PHOTO GALLERY                 */}
      {/* ============================================================== */}
      {lightboxImageUrl && (() => {
        const photos = lightboxImageUrl.photos && lightboxImageUrl.photos.length > 0
          ? lightboxImageUrl.photos
          : [lightboxImageUrl.url];
        const curIdx = typeof lightboxImageUrl.currentIndex === 'number'
          ? lightboxImageUrl.currentIndex
          : Math.max(0, photos.indexOf(lightboxImageUrl.url));
        const hasMultiple = photos.length > 1;

        return (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Photo Lightbox Gallery"
            onClick={() => setLightboxImageUrl(null)}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-3 sm:p-5 select-none animate-in fade-in duration-200"
          >
            {/* Top Bar: Title, Counter, Close Button */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-5xl mx-auto flex items-center justify-between text-white pb-2 z-10"
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-3">
                <h3 className="text-sm sm:text-base font-bold truncate text-white">
                  {lightboxImageUrl.title}
                </h3>
                {hasMultiple && (
                  <span className="shrink-0 px-2.5 py-0.5 rounded-full text-xs font-black bg-white/15 text-white border border-white/20 backdrop-blur-md">
                    📷 {curIdx + 1} / {photos.length}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setLightboxImageUrl(null)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title="Close (Esc)"
                  aria-label="Close Lightbox"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Center Stage: Floating Prev Button + Photo + Floating Next Button */}
            <div className="relative flex-1 w-full max-w-6xl mx-auto flex items-center justify-center my-auto min-h-0 py-2">
              {/* Prev Arrow Button */}
              {hasMultiple && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateLightbox('prev');
                  }}
                  className="absolute left-2 sm:left-4 z-20 p-2.5 sm:p-3.5 rounded-full bg-black/75 hover:bg-black/95 text-white border border-white/20 backdrop-blur-md shadow-2xl transition-all cursor-pointer hover:scale-110 active:scale-95"
                  title="Previous Photo (← Left Arrow)"
                  aria-label="Previous Photo"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-7 sm:h-7 stroke-[2.5]" />
                </button>
              )}

              {/* Main Image Container */}
              <div
                onClick={(e) => e.stopPropagation()}
                className="relative max-h-[75vh] max-w-[90vw] sm:max-w-[85vw] flex items-center justify-center cursor-default"
              >
                <img
                  key={lightboxImageUrl.url}
                  src={lightboxImageUrl.url}
                  alt={lightboxImageUrl.title}
                  className="max-h-[75vh] max-w-[90vw] sm:max-w-[85vw] object-contain rounded-2xl shadow-2xl border border-white/10 transition-opacity duration-200"
                />
              </div>

              {/* Next Arrow Button */}
              {hasMultiple && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateLightbox('next');
                  }}
                  className="absolute right-2 sm:right-4 z-20 p-2.5 sm:p-3.5 rounded-full bg-black/75 hover:bg-black/95 text-white border border-white/20 backdrop-blur-md shadow-2xl transition-all cursor-pointer hover:scale-110 active:scale-95"
                  title="Next Photo (→ Right Arrow)"
                  aria-label="Next Photo"
                >
                  <ChevronRight className="w-5 h-5 sm:w-7 sm:h-7 stroke-[2.5]" />
                </button>
              )}
            </div>

            {/* Bottom Bar: Thumbnail Strip (if multiple) & Keyboard Hint */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl mx-auto flex flex-col items-center gap-2 pt-2 z-10"
            >
              {hasMultiple && (
                <div className="w-full flex items-center justify-center gap-2 overflow-x-auto py-1 px-2 scrollbar-none max-w-full">
                  {photos.map((thumbUrl, tIdx) => {
                    const isSelected = tIdx === curIdx;
                    return (
                      <button
                        key={tIdx}
                        type="button"
                        onClick={() =>
                          setLightboxImageUrl((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  url: thumbUrl,
                                  currentIndex: tIdx
                                }
                              : null
                          )
                        }
                        className={`relative shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-purple-400 ring-2 ring-purple-400/60 scale-105 opacity-100'
                            : 'border-white/20 opacity-50 hover:opacity-85'
                        }`}
                        title={`Jump to photo ${tIdx + 1}`}
                      >
                        <img
                          src={thumbUrl}
                          alt={`Thumbnail ${tIdx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="text-[11px] sm:text-xs text-white/60 text-center flex items-center gap-2 flex-wrap justify-center">
                {hasMultiple ? (
                  <>
                    <span className="font-semibold text-white/80">
                      ← / → Arrow Keys or Chevron Buttons to switch photos
                    </span>
                    <span>•</span>
                  </>
                ) : null}
                <span>Click outside or press Esc to close</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ============================================================== */}
      {/* 5. ACTOR PROFILE EDIT MODAL                                    */}
      {/* ============================================================== */}
      {editingActorProfile && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-[28px] max-w-2xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 my-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  Profile Editor
                </span>
                <h3 className="text-xl font-black text-[#1A3668] dark:text-white">
                  Edit {editingActorProfile.name}&apos;s Profile
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingActorProfile(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveActorProfile} className="space-y-4 pt-4 text-xs font-semibold">
              {/* Names: English Romanization AND Thai Script */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">
                    English Romanization Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={actorFormName}
                    onChange={(e) => setActorFormName(e.target.value)}
                    placeholder="e.g. Jimmy Jitaraphol Potiwihok"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Official English spelling & romanized name</p>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">
                    Thai Script Name
                  </label>
                  <input
                    type="text"
                    value={actorFormNativeName}
                    onChange={(e) => setActorFormNativeName(e.target.value)}
                    placeholder="e.g. จิมมี่ จิตรพล โพธิวิหค"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-thai"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Authentic Thai script spelling (ชื่อภาษาไทย)</p>
                </div>
              </div>

              {/* Nickname & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">
                    Nickname / Moniker
                  </label>
                  <input
                    type="text"
                    value={actorFormNickname}
                    onChange={(e) => setActorFormNickname(e.target.value)}
                    placeholder="e.g. หมอจิมมี่ (Dr. Jimmy) / Tiny"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">
                    Role / Professional Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={actorFormRoleTitle}
                    onChange={(e) => setActorFormRoleTitle(e.target.value)}
                    placeholder="e.g. Actor · Model · Medical Doctor (M.D.)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Highlight Chip */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">
                  Highlight Badge / Chip Text
                </label>
                <input
                  type="text"
                  value={actorFormHighlightChip}
                  onChange={(e) => setActorFormHighlightChip(e.target.value)}
                  placeholder="e.g. 🩺 Licensed Medical Doctor (M.D.) & Award-Nominated Actor"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Multi-Photo Profile Avatar Manager & Interactive Framing Tool */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700 space-y-3.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5" />
                        <span>Profile Avatar Photos & Media ({actorFormAvatarPhotos.length})</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Add multiple photos for this actor. Fans can browse through them with arrows on the card!
                    </p>
                  </div>

                  {/* Multi-File Upload Button */}
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer transition-all shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Image(s)</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'avatar')}
                    />
                  </label>
                </div>

                {/* Single / Batch Photo URL Inputs */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={actorFormNewAvatarUrlInput}
                      onChange={(e) => setActorFormNewAvatarUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddAvatarPhotoUrl(actorFormNewAvatarUrlInput);
                        }
                      }}
                      placeholder="Paste image URL (e.g. https://...)"
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddAvatarPhotoUrl(actorFormNewAvatarUrlInput)}
                      disabled={!actorFormNewAvatarUrlInput.trim()}
                      className="px-3.5 py-2 rounded-xl bg-[#1A3668] dark:bg-purple-600 hover:opacity-90 disabled:opacity-40 text-white text-xs font-bold cursor-pointer shadow-xs shrink-0"
                    >
                      Add Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBatchAvatarUrlInput((prev) => !prev)}
                      className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer shrink-0"
                    >
                      {showBatchAvatarUrlInput ? 'Hide Batch' : 'Batch Add'}
                    </button>
                  </div>

                  {/* Batch Add Textarea */}
                  {showBatchAvatarUrlInput && (
                    <div className="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/60 space-y-2 animate-in fade-in duration-150">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Paste Multiple Photo URLs (separated by new lines or commas):
                      </label>
                      <textarea
                        rows={3}
                        value={draftBatchAvatarUrls}
                        onChange={(e) => setDraftBatchAvatarUrls(e.target.value)}
                        placeholder="https://images...&#10;https://images..."
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            handleAddAvatarPhotoUrl(draftBatchAvatarUrls);
                            setDraftBatchAvatarUrls('');
                            setShowBatchAvatarUrlInput(false);
                          }}
                          disabled={!draftBatchAvatarUrls.trim()}
                          className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white text-xs font-bold cursor-pointer shadow-xs"
                        >
                          Add All URLs
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Avatar Photos List with Reordering & Instant Delete */}
                {actorFormAvatarPhotos.length === 0 ? (
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-400">
                    No avatar photos yet. Upload photos or paste URLs above.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {actorFormAvatarPhotos.map((pUrl, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <img
                            src={pUrl}
                            alt={`Avatar photo ${idx + 1}`}
                            style={{
                              objectPosition: `center ${actorFormAvatarOffsetY}%`,
                              objectFit: actorFormAvatarFit
                            }}
                            className="w-12 h-12 rounded-xl object-cover border border-purple-200 dark:border-purple-800 shrink-0 bg-slate-100"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-xs font-bold text-slate-800 dark:text-white">
                                Photo #{idx + 1}
                              </span>
                              {idx === 0 && (
                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                                  Primary Cover
                                </span>
                              )}
                            </div>
                            <span className="text-[10.5px] font-mono text-slate-500 dark:text-slate-400 truncate block">
                              {pUrl.startsWith('data:') ? 'Local file uploaded' : pUrl}
                            </span>
                          </div>
                        </div>

                        {/* Actions: Move Up / Down & Delete */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveAvatarPhoto(idx, idx - 1)}
                            disabled={idx === 0}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveAvatarPhoto(idx, idx + 1)}
                            disabled={idx === actorFormAvatarPhotos.length - 1}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveAvatarPhoto(idx)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg cursor-pointer transition-colors"
                            title="Delete this photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Interactive Framing & Head/Hair Offset Tool (Fixes cut off forehead/hair!) */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      <span>Avatar Photo Framing (Prevents Cut Off Hair / Head)</span>
                    </span>
                    <span className="text-xs font-black text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                      Offset: {actorFormAvatarOffsetY}%
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Live Framing Preview Box */}
                    <div className="relative shrink-0">
                      {(actorFormAvatarPhotos[0] || actorFormAvatarUrl) ? (
                        <img
                          src={actorFormAvatarPhotos[0] || actorFormAvatarUrl}
                          alt="Framing preview"
                          style={{
                            objectPosition: `center ${actorFormAvatarOffsetY}%`,
                            objectFit: actorFormAvatarFit
                          }}
                          className="w-24 h-24 rounded-2xl object-cover border-2 border-purple-500 shadow-md ring-2 ring-purple-200 dark:ring-purple-900 bg-slate-100 dark:bg-slate-800 transition-all"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-2xl flex flex-col items-center justify-center border-2 border-purple-500 shadow-md ring-2 ring-purple-200 dark:ring-purple-900 bg-slate-100 dark:bg-slate-800 text-3xl">
                          🥑🌊
                        </div>
                      )}
                      <span className="absolute bottom-1 inset-x-1 text-[9px] font-black uppercase text-center bg-black/70 text-white rounded-md py-0.5 backdrop-blur-xs">
                        Live Preview
                      </span>
                    </div>

                    <div className="flex-1 w-full space-y-2.5">
                      {/* Vertical Y-Offset Slider */}
                      <div>
                        <div className="flex justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                          <span>Top of Head / Hair (0%)</span>
                          <span>Optimal (12%)</span>
                          <span>Bottom (100%)</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={actorFormAvatarOffsetY}
                          onChange={(e) => setActorFormAvatarOffsetY(parseInt(e.target.value, 10))}
                          className="w-full accent-purple-600 cursor-pointer"
                        />
                      </div>

                      {/* Quick Framing Presets */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-400 shrink-0">Presets:</span>
                        {[
                          { label: 'Full Hair (5%)', val: 5 },
                          { label: 'Optimal Face (12%)', val: 12 },
                          { label: 'Upper Chest (25%)', val: 25 },
                          { label: 'Center (50%)', val: 50 }
                        ].map((preset) => (
                          <button
                            key={preset.val}
                            type="button"
                            onClick={() => setActorFormAvatarOffsetY(preset.val)}
                            className={`px-2 py-0.5 rounded-lg text-[10.5px] font-bold border transition-all cursor-pointer ${
                              actorFormAvatarOffsetY === preset.val
                                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>

                      {/* Fit Mode Toggle */}
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[10px] font-bold text-slate-400 shrink-0">Fit Mode:</span>
                        <button
                          type="button"
                          onClick={() => setActorFormAvatarFit('cover')}
                          className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold border cursor-pointer transition-all ${
                            actorFormAvatarFit === 'cover'
                              ? 'bg-[#1A3668] dark:bg-purple-600 text-white border-transparent shadow-xs'
                              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          Cover (Fill Frame)
                        </button>
                        <button
                          type="button"
                          onClick={() => setActorFormAvatarFit('contain')}
                          className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold border cursor-pointer transition-all ${
                            actorFormAvatarFit === 'contain'
                              ? 'bg-[#1A3668] dark:bg-purple-600 text-white border-transparent shadow-xs'
                              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          Contain (Fit Full Image)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Facts Section Header with Quick Font Size Selector */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5" />
                    <span>Key Facts &amp; Profile Details</span>
                  </h4>
                  <p className="text-[10.5px] text-slate-400">
                    Adjust values below and customize their display font size
                  </p>
                </div>

                {/* Font Size Selector for Key Facts (Compact / Small / Normal / Large / XL) */}
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-200/80 dark:border-slate-700">
                  <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
                    Font Size:
                  </span>
                  <div className="inline-flex items-center bg-white dark:bg-slate-900 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
                    {[
                      { id: 'compact', label: '11px', name: 'Compact' },
                      { id: 'small', label: '12px', name: 'Small' },
                      { id: 'medium', label: '13px', name: 'Normal' },
                      { id: 'large', label: '15px', name: 'Large' },
                      { id: 'xl', label: '17px', name: 'XL' }
                    ].map((sz) => (
                      <button
                        key={sz.id}
                        type="button"
                        onClick={() => setActorFormFactsSize(sz.id as any)}
                        className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold transition-all cursor-pointer ${
                          actorFormFactsSize === sz.id
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-300 hover:text-purple-600'
                        }`}
                        title={`${sz.name} font size (${sz.label})`}
                      >
                        {sz.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Facts: Birthday, Birthplace, Education, Agency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-slate-700 dark:text-slate-300 mb-1 ${getModalFactsLabelClass()}`}>
                    Birth Date / Debut Date
                  </label>
                  <input
                    type="text"
                    value={actorFormBirthDate}
                    onChange={(e) => setActorFormBirthDate(e.target.value)}
                    title={actorFormBirthDate}
                    placeholder="e.g. August 21, 1994 (Age 30)"
                    className={`w-full ${getModalFactsInputClass()} rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500 transition-all`}
                  />
                </div>

                <div>
                  <label className={`block text-slate-700 dark:text-slate-300 mb-1 ${getModalFactsLabelClass()}`}>
                    Birthplace / Origin
                  </label>
                  <input
                    type="text"
                    value={actorFormBirthPlace}
                    onChange={(e) => setActorFormBirthPlace(e.target.value)}
                    title={actorFormBirthPlace}
                    placeholder="e.g. Bangkok, Thailand"
                    className={`w-full ${getModalFactsInputClass()} rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500 transition-all`}
                  />
                </div>
              </div>

              {/* Zodiac Sign & Favorite Colors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5 ${getModalFactsLabelClass()}`}>
                    <Compass className="w-3.5 h-3.5 text-indigo-500" />
                    <span>𝗭𝗼𝗱𝗶𝗮𝗰 Sign</span>
                  </label>
                  <input
                    type="text"
                    value={actorFormZodiac}
                    onChange={(e) => setActorFormZodiac(e.target.value)}
                    title={actorFormZodiac}
                    placeholder="e.g. Leo ♌ (Western) · Leo ♌ / Cancer ♋ (Thai)"
                    className={`w-full ${getModalFactsInputClass()} rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500 transition-all`}
                  />
                </div>

                <div>
                  <label className={`block text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5 ${getModalFactsLabelClass()}`}>
                    <Palette className="w-3.5 h-3.5 text-fuchsia-500" />
                    <span>𝗙𝗮𝘃𝗼𝗿𝗶𝘁𝗲 C𝗼𝗹𝗼𝗿/s</span>
                  </label>
                  <input
                    type="text"
                    value={actorFormFavoriteColors}
                    onChange={(e) => setActorFormFavoriteColors(e.target.value)}
                    title={actorFormFavoriteColors}
                    placeholder="e.g. Purple, Green, Black, White"
                    className={`w-full ${getModalFactsInputClass()} rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500 transition-all`}
                  />
                </div>
              </div>

              {/* Favorite Foods & Spouse / Partner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5 ${getModalFactsLabelClass()}`}>
                    <Utensils className="w-3.5 h-3.5 text-orange-500" />
                    <span>𝗙𝗮𝘃𝗼𝗿𝗶𝘁𝗲 F𝗼𝗼𝗱s</span>
                  </label>
                  <input
                    type="text"
                    value={actorFormFavoriteFoods}
                    onChange={(e) => setActorFormFavoriteFoods(e.target.value)}
                    title={actorFormFavoriteFoods}
                    placeholder="e.g. Salmon, Beef / Steak, Japanese Cuisine, Iced Americano"
                    className={`w-full ${getModalFactsInputClass()} rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500 transition-all`}
                  />
                </div>

                <div>
                  <label className={`block text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5 ${getModalFactsLabelClass()}`}>
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    <span>{editingActorProfile?.id === 'avocean' ? 'Parents' : 'Spouse / Official Partner'}</span>
                  </label>
                  <input
                    type="text"
                    value={actorFormSpouse}
                    onChange={(e) => setActorFormSpouse(e.target.value)}
                    title={actorFormSpouse}
                    placeholder={
                      editingActorProfile?.id === 'avocean'
                        ? 'e.g. Jimmy Jitaraphol & Sea Tawinan'
                        : 'e.g. Sea Tawinan Anukoolprasert (Official Duo & On-screen Partner)'
                    }
                    className={`w-full ${getModalFactsInputClass()} rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500 transition-all`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-slate-700 dark:text-slate-300 mb-1 ${getModalFactsLabelClass()}`}>
                    Education / Major Works
                  </label>
                  <input
                    type="text"
                    value={actorFormEducation}
                    onChange={(e) => setActorFormEducation(e.target.value)}
                    title={actorFormEducation}
                    placeholder="e.g. M.D., Faculty of Medicine, Chiang Mai University"
                    className={`w-full ${getModalFactsInputClass()} rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500 transition-all`}
                  />
                </div>

                <div>
                  <label className={`block text-slate-700 dark:text-slate-300 mb-1 ${getModalFactsLabelClass()}`}>
                    Agency / Management
                  </label>
                  <input
                    type="text"
                    value={actorFormAgency}
                    onChange={(e) => setActorFormAgency(e.target.value)}
                    title={actorFormAgency}
                    placeholder="e.g. GMMTV"
                    className={`w-full ${getModalFactsInputClass()} rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500 transition-all`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-slate-700 dark:text-slate-300 mb-1 ${getModalFactsLabelClass()}`}>
                    Height, Weight &amp; Blood / Mascot
                  </label>
                  <input
                    type="text"
                    value={actorFormHeightWeight}
                    onChange={(e) => setActorFormHeightWeight(e.target.value)}
                    title={actorFormHeightWeight}
                    placeholder="e.g. 180 cm · 68 kg · Blood Type AB"
                    className={`w-full ${getModalFactsInputClass()} rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500 transition-all`}
                  />
                </div>

                <div>
                  <label className={`block text-slate-700 dark:text-slate-300 mb-1 ${getModalFactsLabelClass()}`}>
                    Ventures, Brands &amp; Skills
                  </label>
                  <input
                    type="text"
                    value={actorFormVentures}
                    onChange={(e) => setActorFormVentures(e.target.value)}
                    title={actorFormVentures}
                    placeholder="e.g. Doctor Jimmy Clinic / Sunbather Studio"
                    className={`w-full ${getModalFactsInputClass()} rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500 transition-all`}
                  />
                </div>
              </div>

              {/* Biography */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">
                  Full Biography &amp; Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={actorFormBio}
                  onChange={(e) => setActorFormBio(e.target.value)}
                  placeholder="Enter detailed biographical summary..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Motto / Quote */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">
                  Motto / Signature Quote
                </label>
                <input
                  type="text"
                  value={actorFormQuote}
                  onChange={(e) => setActorFormQuote(e.target.value)}
                  placeholder="e.g. Always give your sincere best, both in medicine and on screen."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Font Size Preferences: Title Size, Key Facts Size & Bio Size */}
              <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-purple-700 dark:text-purple-400">
                  <Type className="w-3.5 h-3.5" />
                  <span>Card Font Size Preferences</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold text-xs">
                      Title Font Size
                    </label>
                    <select
                      value={actorFormTitleSize}
                      onChange={(e) => setActorFormTitleSize(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-medium text-xs"
                    >
                      <option value="compact">Compact (Smaller)</option>
                      <option value="medium">Medium / Standard</option>
                      <option value="large">Large (Prominent)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold text-xs">
                      Key Facts &amp; Info Font Size
                    </label>
                    <select
                      value={actorFormFactsSize}
                      onChange={(e) => setActorFormFactsSize(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-bold text-xs ring-1 ring-purple-200 dark:ring-purple-900"
                    >
                      <option value="compact">Compact (11px)</option>
                      <option value="small">Small (12px)</option>
                      <option value="medium">Medium / Standard (13px)</option>
                      <option value="large">Large (15px - Prominent)</option>
                      <option value="xl">Extra Large (17px - High Readability)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold text-xs">
                      Bio Description Font Size
                    </label>
                    <select
                      value={actorFormBioSize}
                      onChange={(e) => setActorFormBioSize(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-medium text-xs"
                    >
                      <option value="small">Small (12px)</option>
                      <option value="medium">Medium (14px - Default)</option>
                      <option value="large">Large (16px - Easy Read)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Dynamic Websites & Official Links Manager */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      <span>Websites &amp; Official Links</span>
                    </label>
                    <p className="text-[10.5px] text-slate-400">
                      Add any custom websites, stores, clinics, fan hubs, or channels you want displayed
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCustomWebsite}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900 border border-purple-200 dark:border-purple-800 cursor-pointer transition-all"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Website</span>
                  </button>
                </div>

                {actorFormCustomWebsites.length > 0 && (
                  <div className="space-y-2">
                    {actorFormCustomWebsites.map((site, sIdx) => (
                      <div
                        key={site.id || sIdx}
                        className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80"
                      >
                        <div className="w-1/3 min-w-[110px]">
                          <input
                            type="text"
                            value={site.label}
                            onChange={(e) => handleUpdateCustomWebsite(sIdx, 'label', e.target.value)}
                            placeholder="e.g. Clinic Website"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <input
                            type="url"
                            value={site.url}
                            onChange={(e) => handleUpdateCustomWebsite(sIdx, 'url', e.target.value)}
                            placeholder="https://..."
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-xs focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomWebsite(sIdx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors cursor-pointer shrink-0"
                          title="Remove Website"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Social Profiles */}
                <div className="pt-2">
                  <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                    Social Media Handles:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <input
                        type="url"
                        value={actorFormInstagramUrl}
                        onChange={(e) => setActorFormInstagramUrl(e.target.value)}
                        placeholder="📸 Instagram URL"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-xs focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <input
                        type="url"
                        value={actorFormTwitterUrl}
                        onChange={(e) => setActorFormTwitterUrl(e.target.value)}
                        placeholder="𝕏 / Twitter URL"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-xs focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <input
                        type="url"
                        value={actorFormTiktokUrl}
                        onChange={(e) => setActorFormTiktokUrl(e.target.value)}
                        placeholder="🎵 TikTok URL (optional)"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-xs focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingActorProfile(null)}
                  className="px-4 py-2 rounded-full text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActorSaving}
                  style={{ backgroundColor: currentAccent.colorHex }}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold text-white shadow-xs cursor-pointer hover:opacity-90 disabled:opacity-50"
                >
                  {isActorSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                  <span>Save Profile Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
