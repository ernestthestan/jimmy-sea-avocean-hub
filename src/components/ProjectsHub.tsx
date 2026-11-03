import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Film,
  Tv,
  Music,
  ShoppingBag,
  Sparkles,
  Search,
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
  Copy
} from 'lucide-react';
import type { CareerProject, ProjectCategory, ProjectArtist, ProjectStatus, ProjectLink, ActorProfile } from '../types/projects';
import { PROJECT_CATEGORIES } from '../types/projects';
import { INITIAL_ACTOR_PROFILES } from '../data/initialActorProfiles';
import { subscribeToActorProfiles, saveActorProfilesToFirestore } from '../lib/firestoreSync';
import { TRANSLATION_LANGUAGES, translateText } from '../lib/translateService';
import { compressImageFile } from '../lib/imageCompression';

export const PROJECT_WATCH_PLATFORMS = [
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
  canEdit: boolean;
  isOwner: boolean;
  currentAccent: {
    colorHex: string;
    name?: string;
    [key: string]: any;
  };
  containerWidthClass?: string;
  activeMemberIds?: string[];
  preferredTranslationLang?: string;
  onSelectTranslationLang?: (lang: string) => void;
  onSaveProject: (project: CareerProject) => void;
  onDeleteProject: (projectId: string) => void;
  showToast: (msg: string) => void;
}

export const ProjectsHub: React.FC<ProjectsHubProps> = ({
  projects,
  canEdit,
  isOwner,
  currentAccent,
  containerWidthClass,
  activeMemberIds = ['jimmy', 'sea', 'avocean'],
  preferredTranslationLang = 'en',
  onSelectTranslationLang,
  onSaveProject,
  onDeleteProject,
  showToast
}) => {
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

  // Actor Profiles State (Jimmy, Avocean, Sea)
  const [actorProfiles, setActorProfiles] = useState<Record<'jimmy' | 'avocean' | 'sea', ActorProfile>>(() => {
    try {
      const saved = localStorage.getItem('avocean_actor_profiles_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_ACTOR_PROFILES;
  });

  // Subscribe to live Firestore changes for Actor Profiles
  useEffect(() => {
    const unsub = subscribeToActorProfiles(INITIAL_ACTOR_PROFILES, (updated) => {
      setActorProfiles(updated);
    });
    return () => unsub();
  }, []);

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
      await saveActorProfilesToFirestore(nextProfiles);
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

  // Lightbox Photo Viewer
  const [lightboxImageUrl, setLightboxImageUrl] = useState<{ url: string; title: string } | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState<string>('');
  const [formEnglishTitle, setFormEnglishTitle] = useState<string>('');
  const [formCategory, setFormCategory] = useState<ProjectCategory>('shows');
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
        setFormImageUrl(compressedList[0]);
        setFormActiveMediaIndex(formMediaPhotos.length);
        showToast(
          compressedList.length === 1
            ? 'Media photo uploaded successfully!'
            : `${compressedList.length} media photos uploaded successfully!`
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

  const handleAddMediaUrl = (urlInput: string) => {
    if (!urlInput.trim()) return;
    const tokens = urlInput.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
    const additions: string[] = [];
    tokens.forEach((url) => {
      if (!formMediaPhotos.includes(url) && !additions.includes(url)) {
        additions.push(url);
      }
    });
    if (additions.length === 0) {
      showToast('Photo is already in media collection');
      return;
    }
    setFormMediaPhotos((prev) => [...prev, ...additions]);
    setNewMediaUrlInput('');
    setFormImageUrl(additions[0]);
    setFormActiveMediaIndex(formMediaPhotos.length);
    showToast(additions.length === 1 ? 'Photo added to media collection!' : `${additions.length} photos added to media collection!`);
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
      if (!activeMemberIds || activeMemberIds.length === 0 || activeMemberIds.length === 3) {
        return true;
      }
      if (p.artist === 'jimmysea') {
        return activeMemberIds.includes('jimmy') || activeMemberIds.includes('sea');
      }
      if (p.artist === 'jimmy') {
        return activeMemberIds.includes('jimmy');
      }
      if (p.artist === 'sea') {
        return activeMemberIds.includes('sea');
      }
      if (p.artist === 'avocean') {
        return activeMemberIds.includes('avocean');
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
  }, [projects, activeMemberIds]);

  // Filtered and searched projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // 1. Top member filter
      if (activeMemberIds && activeMemberIds.length > 0 && activeMemberIds.length < 3) {
        if (p.artist === 'jimmysea') {
          if (!activeMemberIds.includes('jimmy') && !activeMemberIds.includes('sea')) {
            return false;
          }
        } else if (p.artist === 'jimmy') {
          if (!activeMemberIds.includes('jimmy')) return false;
        } else if (p.artist === 'sea') {
          if (!activeMemberIds.includes('sea')) return false;
        } else if (p.artist === 'avocean') {
          if (!activeMemberIds.includes('avocean')) return false;
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
        return inTitle || inEng || inRole || inJimmy || inSea || inDirector || inDesc || inPlatform || inYear || inFilmed || inTags || inHighlight || inLinks;
      }
      return true;
    });
  }, [projects, activeMemberIds, selectedCategory, searchQuery]);

  const openAddModal = () => {
    setEditingProject(null);
    setFormTitle('');
    setFormEnglishTitle('');
    setFormCategory('shows');
    setFormArtist('jimmysea');
    setFormRole('');
    setFormJimmyRole('');
    setFormSeaRole('');
    setFormDirector('');
    setFormYear('2023–2024');
    setFormFilmedPeriod('');
    setFormStatus('released');
    setFormDescription('');
    const sampleCover = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80';
    setFormImageUrl(sampleCover);
    setFormMediaPhotos([sampleCover]);
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
    setIsModalOpen(true);
  };

  const openEditModal = (proj: CareerProject) => {
    setEditingProject(proj);
    setFormTitle(proj.title);
    setFormEnglishTitle(proj.englishTitle || '');
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

    const photos = (proj.mediaPhotos && proj.mediaPhotos.length > 0)
      ? [...proj.mediaPhotos]
      : (proj.imageUrl ? [proj.imageUrl] : []);
    setFormMediaPhotos(photos);
    setFormActiveMediaIndex(0);
    setFormMediaFit(proj.mediaFit || 'cover');
    setFormMediaOffsetY(typeof proj.mediaOffsetY === 'number' ? proj.mediaOffsetY : 50);
    setFormTitleSize(proj.titleSize || 'medium');
    setFormFontSize(proj.fontSize || 'medium');
    setNewMediaUrlInput('');
    setFormImageUrl(photos[0] || proj.imageUrl || '');

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

    const cleanMedia = formMediaPhotos.map((p) => p.trim()).filter(Boolean);
    const primaryPoster = cleanMedia[0] || formImageUrl.trim() || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80';

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

    const projectToSave: CareerProject = {
      id: editingProject ? editingProject.id : `proj-${formCategory}-${Date.now()}`,
      title: formTitle.trim(),
      englishTitle: formEnglishTitle.trim() || undefined,
      category: formCategory,
      artist: formArtist,
      role: trimmedRole || undefined,
      jimmyRole: trimmedJimmy || undefined,
      seaRole: trimmedSea || undefined,
      director: formDirector.trim() || undefined,
      year: formYear.trim() || undefined,
      filmedPeriod: formFilmedPeriod.trim() || undefined,
      status: formStatus,
      description: formDescription.trim(),
      imageUrl: primaryPoster,
      mediaPhotos: cleanMedia.length > 0 ? cleanMedia : undefined,
      mediaFit: formMediaFit,
      mediaPosition: `center ${formMediaOffsetY}%`,
      mediaOffsetY: formMediaOffsetY,
      titleSize: formTitleSize,
      fontSize: formFontSize,
      platform: formPlatform.trim() || undefined,
      primaryLink: validWatchLinks[0]?.url || undefined,
      extraLinks: validWatchLinks.length > 1 ? validWatchLinks.slice(1) : undefined,
      watchLinks: validWatchLinks.length > 0 ? validWatchLinks : undefined,
      twitterUrl: normalizeSocialUrl(formTwitterUrl, 'x'),
      instagramUrl: normalizeSocialUrl(formInstagramUrl, 'instagram'),
      officialWebsiteUrl: formOfficialWebsiteUrl.trim() || undefined,
      customWebsites: validCustomWebsites.length > 0 ? validCustomWebsites : undefined,
      highlight: formHighlight.trim() || undefined,
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
        return <Crown className="w-3.5 h-3.5" />;
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

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'released':
        return { label: 'Released', color: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' };
      case 'ongoing':
      case 'active':
        return { label: 'Active / Ongoing', color: 'bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800' };
      case 'upcoming':
        return { label: 'Upcoming', color: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800' };
    }
  };

  const getPlatformIcon = (platformStr?: string) => {
    const p = (platformStr || '').toLowerCase();
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
              if (key === 'jimmy') return { border: 'border-purple-200 dark:border-purple-900/60', badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300', emoji: '🥑', ring: 'ring-purple-200 dark:ring-purple-900/50' };
              if (key === 'sea') return { border: 'border-sky-200 dark:border-sky-900/60', badge: 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300', emoji: '🌊', ring: 'ring-sky-200 dark:ring-sky-900/50' };
              return { border: 'border-emerald-200 dark:border-emerald-900/60', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300', emoji: '🥑💚', ring: 'ring-emerald-200 dark:ring-emerald-900/50' };
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

                      return (
                        <div className="flex flex-col items-center gap-1.5 shrink-0">
                          <div
                            className="relative group/avatar cursor-pointer shrink-0 select-none overflow-hidden rounded-3xl"
                            onClick={() => setLightboxImageUrl({
                              url: activeAvatarPhoto,
                              title: `${profile.name}${allAvatarPhotos.length > 1 ? ` (${currentAvatarIdx + 1}/${allAvatarPhotos.length})` : ''}`
                            })}
                          >
                            <img
                              src={activeAvatarPhoto}
                              alt={`${profile.name} - Photo ${currentAvatarIdx + 1}`}
                              style={{
                                objectPosition: profile.avatarPosition || 'center 12%',
                                objectFit: profile.avatarFit || 'cover'
                              }}
                              className={`w-28 h-28 sm:w-36 sm:h-36 rounded-3xl object-cover shadow-md ring-4 ${accent.ring} bg-slate-100 dark:bg-slate-800 transition-transform duration-300 group-hover/avatar:scale-105`}
                            />

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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 xl:gap-6 items-stretch">
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
      <div className="bg-white/95 dark:bg-slate-900/90 rounded-[28px] p-5 sm:p-7 shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-5">
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
            Jimmy & Sea Career Projects
          </h2>
          <p className="text-xs sm:text-sm font-medium text-[#607494] dark:text-slate-400 max-w-3xl">
            Explore Jimmy and Sea&apos;s complete catalog of award-winning series, movies, official music videos, global partner brand endorsements, and personal ventures.
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

      {/* ============================================================== */}
      {/* 3. MAIN LAYOUT: LEFT STICKY CATEGORIES + RIGHT PROJECTS GRID   */}
      {/* ============================================================== */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* ============================================================== */}
        {/* LEFT SIDEBAR: STICKY CATEGORY NAVIGATION (Visible when scrolling!) */}
        {/* ============================================================== */}
        <aside className="w-full lg:w-64 shrink-0 lg:sticky lg:top-20 z-20 self-start">
          <div className="bg-white/95 dark:bg-slate-900/90 rounded-[24px] p-3 shadow-xs border border-slate-200/80 dark:border-slate-800 backdrop-blur-md space-y-2">
            <div className="flex items-center justify-between px-3 py-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Categories
              </span>
              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full">
                {filteredProjects.length} items
              </span>
            </div>

            {/* Vertical menu on desktop, horizontal scroll on mobile */}
            <nav className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-1 lg:pb-0 scrollbar-none">
              {PROJECT_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                const count = categoryCounts[cat.id] ?? 0;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    style={isSelected ? { backgroundColor: currentAccent.colorHex } : {}}
                    className={`inline-flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer text-left w-full ${
                      isSelected
                        ? 'text-white shadow-xs'
                        : 'bg-transparent text-[#526586] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-base shrink-0">{cat.emoji}</span>
                      <span className="truncate">{cat.label}</span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-black shrink-0 ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>

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

          {/* Projects View Controls: Poster Display Ratio & Global Font Size */}
          <div className="bg-white/95 dark:bg-slate-900/90 rounded-2xl shadow-xs px-4 py-2.5 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
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
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-5 xl:gap-6">
              {filteredProjects.map((proj) => {
                const artistInfo = getArtistLabel(proj.artist);
                const statusInfo = getStatusBadge(proj.status);
                const cardLang = projectCardLangs[proj.id] || targetLang || 'en';
                const isTranslating = !!translatingIds[proj.id];
                const cachedFullTrans = projectCardTranslations[proj.id]?.[cardLang];
                const isShowingTrans = !!showingTranslatedIds[proj.id] && !!cachedFullTrans;

                // Typography calculation per-card or from global toolbar
                const effectiveZoom = projectCardZoom[proj.id] || proj.fontSize || projectFontZoom;
                const typo = getProjectTypography(effectiveZoom);

                // English title & original Thai script separation (Green underline = English, Yellow underline = Thai)
                const hasThaiInTitle = /[\u0E00-\u0E7F]/.test(proj.title);
                const hasThaiInEnglishTitle = proj.englishTitle ? /[\u0E00-\u0E7F]/.test(proj.englishTitle) : false;

                let englishCandidate = '';
                let thaiCandidate = '';

                if (proj.englishTitle) {
                  if (hasThaiInEnglishTitle && !hasThaiInTitle) {
                    englishCandidate = proj.title;
                    thaiCandidate = proj.englishTitle;
                  } else {
                    englishCandidate = proj.englishTitle;
                    thaiCandidate = proj.title;
                  }
                } else if (hasThaiInTitle) {
                  englishCandidate = isShowingTrans && cachedFullTrans?.title ? cachedFullTrans.title : proj.title;
                  thaiCandidate = proj.title;
                } else {
                  englishCandidate = proj.title;
                  thaiCandidate = '';
                }

                const primaryEnglishTitle = (isShowingTrans && cachedFullTrans?.title)
                  ? cachedFullTrans.title
                  : (englishCandidate || proj.title);
                const originalThaiScript = thaiCandidate;

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

                return (
                  <div
                    key={proj.id}
                    className="bg-white/95 dark:bg-slate-900/90 rounded-[24px] border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Poster / Cover Image (Supports Multi-Photo Gallery, Whole Photo View, Direct Click to Expand) */}
                      {(() => {
                        const mediaList = (proj.mediaPhotos && proj.mediaPhotos.length > 0)
                          ? proj.mediaPhotos.filter(Boolean)
                          : [proj.imageUrl];
                        const activeMediaIdx = (projectCardMediaIndex[proj.id] ?? 0) % mediaList.length;
                        const activePhoto = mediaList[activeMediaIdx] || proj.imageUrl;
                        const isContain = proj.mediaFit === 'contain' || projectPosterAspect === 'contain';
                        const focalPos = proj.mediaPosition || `center ${proj.mediaOffsetY ?? 50}%`;

                        // Aspect ratio calculation to show the whole poster photo
                        const aspectClass =
                          projectPosterAspect === 'poster'
                            ? 'aspect-[2/3] sm:aspect-[3/4]'
                            : projectPosterAspect === 'contain'
                            ? 'aspect-[3/4] sm:aspect-[2/3]'
                            : 'aspect-[16/10]';

                        return (
                          <div
                            onClick={() =>
                              setLightboxImageUrl({
                                url: activePhoto,
                                title: `${primaryEnglishTitle} ${
                                  mediaList.length > 1 ? `(Photo ${activeMediaIdx + 1} of ${mediaList.length})` : ''
                                }`
                              })
                            }
                            className={`relative ${aspectClass} bg-slate-950 overflow-hidden group cursor-pointer select-none transition-all`}
                            title="Click poster to expand in high resolution"
                          >
                            {/* Ambient Blur Backdrop for Auto-Fit (contain) so 100% of the photo is visible */}
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
                                isContain ? 'object-contain' : 'object-cover group-hover:scale-105'
                              }`}
                              loading="lazy"
                            />
                            <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

                            {/* Hover expand overlay indicator cue */}
                            <div className="absolute inset-0 z-20 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                              <span className="px-3.5 py-1.5 rounded-full bg-black/75 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5 shadow-xl border border-white/20 transform scale-95 group-hover:scale-100 transition-transform">
                                <Maximize2 className="w-3.5 h-3.5 text-purple-300" />
                                <span>Click to Expand</span>
                              </span>
                            </div>

                            {/* Top Badges: Category & Artist */}
                            <div className="absolute top-3 inset-x-3 z-30 flex items-center justify-between gap-2 pointer-events-none">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-md text-white border border-white/20">
                                {getCategoryIcon(proj.category)}
                                <span>{getCategoryBadge(proj.category)}</span>
                              </span>

                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold border backdrop-blur-md ${artistInfo.bg}`}>
                                <span>{artistInfo.emoji}</span>
                                <span>{artistInfo.label}</span>
                              </span>
                            </div>

                            {/* Top Right Actions: Photo Counter + Expand */}
                            <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5">
                              {mediaList.length > 1 && (
                                <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black bg-black/60 text-white backdrop-blur-md border border-white/20 shadow-xs pointer-events-none">
                                  📷 {activeMediaIdx + 1}/{mediaList.length}
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLightboxImageUrl({ url: activePhoto, title: `${primaryEnglishTitle} (Photo ${activeMediaIdx + 1})` });
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-md cursor-pointer shadow-md"
                                title="Expand Full Resolution"
                              >
                                <Maximize2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Carousel Controls for Multi-Photo Projects */}
                            {mediaList.length > 1 && (
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
                                  className="absolute left-2 top-1/2 -translate-y-1/2 z-30 p-1.5 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-md hover:scale-110"
                                  title="Previous Photo"
                                >
                                  <ChevronLeft className="w-3.5 h-3.5" />
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
                                  className="absolute right-2 top-1/2 -translate-y-1/2 z-30 p-1.5 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-md hover:scale-110"
                                  title="Next Photo"
                                >
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            {/* Bottom Image Overlay: Status Badge */}
                            <div className="absolute bottom-3 right-3 z-30 pointer-events-none">
                              <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border backdrop-blur-md shadow-xs ${statusInfo.color}`}>
                                {statusInfo.label}
                              </span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Card Content Body */}
                      <div className="p-5 space-y-3">
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

                        {/* Dedicated Jimmy & Sea Character Names & Roles */}
                        {(displayJimmyRole || displaySeaRole || displayRole) && (
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

                        {/* Director (for TV Series & Movies) */}
                        {displayDirector && (
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 ${typo.meta}`}>
                            <Clapperboard className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                            <span>Directed by <strong className="text-[#1A3668] dark:text-white font-bold">{displayDirector}</strong></span>
                          </div>
                        )}

                        {/* Award / Highlight Chip */}
                        {displayHighlight && (
                          <div className={`p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 font-bold flex items-center gap-2 ${typo.meta}`}>
                            <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="leading-tight">{displayHighlight}</span>
                          </div>
                        )}

                        {/* Release / On-Air Period and Filmed Month / Year (Above Description / Synopsis) */}
                        {(proj.year || displayFilmedPeriod) && (
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

                        {/* Hashtags */}
                        {proj.tags && proj.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {proj.tags.map((tag, tIdx) => (
                              <span
                                key={tIdx}
                                className={`rounded-md font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 ${typo.tags}`}
                              >
                                {tag}
                              </span>
                            ))}
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
                            {allWatchLinks.map((link, lIdx) => (
                              <a
                                key={lIdx}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-flex items-center gap-1.5 rounded-xl font-bold bg-white dark:bg-slate-900 hover:bg-purple-50 dark:hover:bg-purple-950/60 text-[#1A3668] dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs hover:border-purple-300 cursor-pointer ${typo.buttons}`}
                              >
                                <span>{getPlatformIcon(link.platform || link.label)}</span>
                                <span className="truncate max-w-[170px]">{link.label}</span>
                                <ExternalLink className="w-3 h-3 text-slate-400" />
                              </a>
                            ))}
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
              })}
            </div>
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
            className="bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl w-full max-w-2xl p-6 max-h-[92vh] overflow-y-auto border border-slate-100 dark:border-slate-800 cursor-default"
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
              {/* Category & Artist Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ProjectCategory)}
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

              {/* Title & English Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                    Title / Thai Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Last Twilight ภาพนายไม่เคยลืม"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                    English / International Title
                  </label>
                  <input
                    type="text"
                    value={formEnglishTitle}
                    onChange={(e) => setFormEnglishTitle(e.target.value)}
                    placeholder="e.g. Last Twilight The Series"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                  />
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

              {/* DEDICATED CHARACTER NAMES & BILLING FOR JIMMY AND SEA */}
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
                          if (formSeaRole.trim()) parts.push(formSeaRole.toLowerCase().startsWith('sea as') ? formSeaRole.trim() : `Sea as ${formSeaRole.trim()}`);
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

              {/* Year / Era (Multi-year, Dec to Jan, etc.) & Filmed Month/Year */}
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
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ProjectStatus)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value="released">Released / Concluded</option>
                    <option value="active">Active / Ongoing</option>
                    <option value="upcoming">Upcoming</option>
                  </select>
                </div>
              </div>

              {/* Highlight Note */}
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

              {/* Director & Platform / Network */}
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

              {/* ============================================================== */}
              {/* MULTI-PHOTO MEDIA COLLECTION, AUTO-FIT & FRAMING ADJUSTMENTS   */}
              {/* ============================================================== */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-[#1A3668] dark:text-white flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      <span>Project Photos & Media ({formMediaPhotos.length})</span>
                    </label>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      Multi-Photo Enabled
                    </span>
                  </div>

                  {/* Ratio Toggles */}
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
                        <span>Media Sizing & Auto-Fit</span>
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
                            posterPreviewAspect === 'card' ? 'aspect-[16/10]' : 'aspect-[2/3] max-h-[360px]'
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
                          <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/90 via-black/30 to-black/20 pointer-events-none" />

                          {/* Top Badges (Category & Artist) */}
                          <div className="absolute top-3 inset-x-3 z-30 flex items-center justify-between gap-2 pointer-events-none">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-md text-white border border-white/20">
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
                              onClick={() => setLightboxImageUrl({ url: currentPreviewPhoto, title: formTitle || 'Poster Preview' })}
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
                                const statusObj = getStatusBadge(formStatus);
                                return (
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider backdrop-blur-md ${statusObj.color}`}>
                                    {statusObj.label}
                                  </span>
                                );
                              })()}
                            </div>
                            <h4 className="text-sm sm:text-base font-black text-white line-clamp-1 drop-shadow-md flex items-center gap-1.5 flex-wrap">
                              <span>{formEnglishTitle || formTitle || 'Your Project Title Here'}</span>
                              {formEnglishTitle && formTitle && formTitle !== formEnglishTitle && (
                                <>
                                  <span className="text-purple-300 font-bold select-none text-[0.85em]">•</span>
                                  <span className="text-[0.95em] sm:text-[1em] font-bold text-slate-100 font-thai tracking-normal">{formTitle}</span>
                                </>
                              )}
                            </h4>
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

                {/* Hidden File Input for Device Multiple Upload */}
                <input
                  ref={posterFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  onChange={handlePosterFileUpload}
                  className="hidden"
                />

                {/* Action Row: Upload Button + URL Input */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <button
                      type="button"
                      disabled={isUploadingPoster}
                      onClick={() => posterFileInputRef.current?.click()}
                      className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/80 dark:hover:bg-purple-900/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold cursor-pointer transition-all shrink-0 disabled:opacity-50"
                    >
                      {isUploadingPoster ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Compressing & Adding...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload From Device (Multiple)</span>
                        </>
                      )}
                    </button>

                    <div className="flex-1 flex gap-1.5">
                      <input
                        type="url"
                        value={newMediaUrlInput}
                        onChange={(e) => setNewMediaUrlInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddMediaUrl(newMediaUrlInput);
                          }
                        }}
                        placeholder="Or paste photo URL (comma/newline separated for multiple)..."
                        className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400 placeholder-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddMediaUrl(newMediaUrlInput)}
                        disabled={!newMediaUrlInput.trim()}
                        className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white text-xs font-bold cursor-pointer shrink-0 shadow-xs"
                      >
                        + Add
                      </button>
                    </div>
                  </div>

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
                      ✨ Concert & Stage
                    </button>
                  </div>
                </div>
              </div>

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

              {/* Tags */}
              <div>
                <label className="block text-xs font-bold text-[#526586] dark:text-slate-400 mb-1">
                  Hashtags / Tags (Space separated)
                </label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="#LastTwilightSeries #GMMTV #JimmySea"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                />
              </div>

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
      {/* 4. LIGHTBOX PHOTO VIEWER                                       */}
      {/* ============================================================== */}
      {lightboxImageUrl && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxImageUrl(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-4 cursor-pointer animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl flex items-center justify-between text-white pb-2"
          >
            <h3 className="text-sm sm:text-base font-bold truncate">
              {lightboxImageUrl.title}
            </h3>
            <button
              onClick={() => setLightboxImageUrl(null)}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[80vh] max-w-[90vw] flex items-center justify-center cursor-default"
          >
            <img
              src={lightboxImageUrl.url}
              alt={lightboxImageUrl.title}
              className="max-h-[80vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
            />
          </div>

          <div className="text-xs text-white/60 pt-2">
            Click outside or press Esc to close
          </div>
        </div>
      )}

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
                      <img
                        src={actorFormAvatarPhotos[0] || actorFormAvatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800'}
                        alt="Framing preview"
                        style={{
                          objectPosition: `center ${actorFormAvatarOffsetY}%`,
                          objectFit: actorFormAvatarFit
                        }}
                        className="w-24 h-24 rounded-2xl object-cover border-2 border-purple-500 shadow-md ring-2 ring-purple-200 dark:ring-purple-900 bg-slate-100 dark:bg-slate-800 transition-all"
                      />
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
