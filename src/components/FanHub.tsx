import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  ExternalLink,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Copy,
  Clock,
  MapPin,
  Calendar,
  Sparkles,
  Heart,
  Coffee,
  Truck,
  Gift,
  Cake,
  Flower2,
  X,
  Check,
  Globe,
  Share2,
  MessageCircle,
  Eye,
  Camera,
  Play,
  TrendingUp,
  AlertCircle,
  Languages,
  Image as ImageIcon,
  Settings,
  Smile,
  ChevronDown,
  Loader2,
  RotateCcw
} from 'lucide-react';
import type {
  FanClub,
  FoodSupportProject,
  FanClubActor,
  ProjectStatus,
  SupportType,
  SocialLink,
  ProofMedia,
  SocialPlatform,
  ClubCategory,
  CategoryIconsConfig
} from '../types/fanhub';
import type { ScheduleEvent, AccentChoice } from '../App';
import { POPULAR_FAN_COUNTRIES } from '../data/countriesList';
import { POPULAR_CURRENCIES } from '../data/currencies';
import {
  TRANSLATION_LANGUAGES,
  type TranslationLanguage,
  translateText
} from '../lib/translateService';
import {
  getTranslatedBio,
  getTranslatedSupportText,
  autoTranslateFoodSupportDraft
} from '../utils/translation';



interface FanHubProps {
  fanClubs: FanClub[];
  foodProjects: FoodSupportProject[];
  canEdit: boolean;
  isOwner: boolean;
  events: ScheduleEvent[];
  currentAccent: {
    colorHex: string;
    name?: string;
    [key: string]: any;
  };
  activeSubTab?: 'directory' | 'foodsupport';
  onSubTabChange?: (tab: 'directory' | 'foodsupport') => void;
  onSaveFanClub: (club: FanClub) => void;
  onDeleteFanClub: (clubId: string) => void;
  onSaveFoodProject: (project: FoodSupportProject) => void;
  onDeleteFoodProject: (projectId: string) => void;
  showToast: (msg: string) => void;
}

export const FanHub: React.FC<FanHubProps> = ({
  fanClubs,
  foodProjects,
  canEdit,
  isOwner,
  events,
  currentAccent,
  activeSubTab = 'directory',
  onSubTabChange,
  onSaveFanClub,
  onDeleteFanClub,
  onSaveFoodProject,
  onDeleteFoodProject,
  showToast
}) => {
  // Main sub-tab switcher: 'directory' | 'foodsupport'
  const [hubTab, setHubTab] = useState<'directory' | 'foodsupport'>(activeSubTab);

  // Sync internal subtab state whenever activeSubTab prop changes (e.g. from bottom bubble)
  useEffect(() => {
    if (activeSubTab && activeSubTab !== hubTab) {
      setHubTab(activeSubTab);
    }
  }, [activeSubTab]);

  const handleTabClick = (tab: 'directory' | 'foodsupport') => {
    setHubTab(tab);
    if (onSubTabChange) {
      onSubTabChange(tab);
    }
  };

  // Default Category Icons
  const DEFAULT_CATEGORY_ICONS: CategoryIconsConfig = {
    everyone: '🥑',
    duo: '🤝',
    actor: '🎭',
    jimmy: '🩺',
    sea: '🌊',
    avocean: '🥑'
  };

  // Category Icons State (persisted for Owner)
  const [categoryIcons, setCategoryIcons] = useState<CategoryIconsConfig>(() => {
    try {
      const saved = localStorage.getItem('jimmysea_category_icons');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
    return DEFAULT_CATEGORY_ICONS;
  });

  // Category Icon Customization Modal State (for Owner)
  const [isIconModalOpen, setIsIconModalOpen] = useState<boolean>(false);
  const [tempCategoryIcons, setTempCategoryIcons] = useState<CategoryIconsConfig>(categoryIcons);

  const saveCategoryIcons = (newIcons: CategoryIconsConfig) => {
    setCategoryIcons(newIcons);
    try {
      localStorage.setItem('jimmysea_category_icons', JSON.stringify(newIcons));
    } catch (e) {
      // ignore
    }
    setIsIconModalOpen(false);
    showToast('Category icons updated successfully!');
  };

  const resetCategoryIcons = () => {
    setTempCategoryIcons(DEFAULT_CATEGORY_ICONS);
    setCategoryIcons(DEFAULT_CATEGORY_ICONS);
    try {
      localStorage.removeItem('jimmysea_category_icons');
    } catch (e) {
      // ignore
    }
    showToast('Reset category icons to defaults');
  };

  // Directory filter states
  const [directorySearch, setDirectorySearch] = useState<string>('');
  const [directoryActorFilter, setDirectoryActorFilter] = useState<FanClubActor>('all');
  const [directoryCountryFilter, setDirectoryCountryFilter] = useState<string>('all');

  // Food support filter states
  const [supportSearch, setSupportSearch] = useState<string>('');
  const [supportStatusFilter, setSupportStatusFilter] = useState<'all' | ProjectStatus>('all');
  const [supportActorFilter, setSupportActorFilter] = useState<FanClubActor>('all');

  // Selected target language per club card (default 'en')
  const [selectedClubLang, setSelectedClubLang] = useState<Record<string, string>>({});
  // Translated text cache: clubId -> langCode -> translatedText
  const [clubTranslations, setClubTranslations] = useState<Record<string, Record<string, string>>>({});
  const [isTranslatingClub, setIsTranslatingClub] = useState<Record<string, boolean>>({});
  const [activeClubTranslation, setActiveClubTranslation] = useState<Record<string, boolean>>({});

  const handleTranslateClubBio = async (club: FanClub, targetLang: string, forceRefresh = false) => {
    const currentLang = targetLang || selectedClubLang[club.id] || 'en';
    // If not force refreshing and already showing translated in this language, toggle back to original
    if (!forceRefresh && activeClubTranslation[club.id] && (selectedClubLang[club.id] || 'en') === currentLang) {
      setActiveClubTranslation((prev) => ({ ...prev, [club.id]: false }));
      return;
    }

    // If English is selected and we already have verified translatedDescription without forcing refresh
    if (!forceRefresh && currentLang === 'en' && club.translatedDescription) {
      setClubTranslations((prev) => ({
        ...prev,
        [club.id]: { ...(prev[club.id] || {}), en: club.translatedDescription! }
      }));
      setActiveClubTranslation((prev) => ({ ...prev, [club.id]: true }));
      return;
    }

    // Check if already in cache and not forcing refresh
    if (!forceRefresh && clubTranslations[club.id]?.[currentLang]) {
      setActiveClubTranslation((prev) => ({ ...prev, [club.id]: true }));
      return;
    }

    // Live translate
    setIsTranslatingClub((prev) => ({ ...prev, [club.id]: true }));
    try {
      const langObj = TRANSLATION_LANGUAGES.find((l) => l.code === currentLang);
      const translated = await translateText(club.description, currentLang, langObj?.name);
      setClubTranslations((prev) => ({
        ...prev,
        [club.id]: { ...(prev[club.id] || {}), [currentLang]: translated }
      }));
      setActiveClubTranslation((prev) => ({ ...prev, [club.id]: true }));
    } catch (err: any) {
      const fallback = getTranslatedBio(club.description, club.translatedDescription);
      setClubTranslations((prev) => ({
        ...prev,
        [club.id]: { ...(prev[club.id] || {}), [currentLang]: fallback.text }
      }));
      setActiveClubTranslation((prev) => ({ ...prev, [club.id]: true }));
    } finally {
      setIsTranslatingClub((prev) => ({ ...prev, [club.id]: false }));
    }
  };

  // Selected target language per food support project (default 'en')
  const [selectedProjectLang, setSelectedProjectLang] = useState<Record<string, string>>({});
  // Translated details cache: projId -> langCode -> { description, notes }
  const [projectTranslations, setProjectTranslations] = useState<
    Record<string, Record<string, { description: string; notes?: string }>>
  >({});
  const [isTranslatingProject, setIsTranslatingProject] = useState<Record<string, boolean>>({});
  const [activeProjectTranslation, setActiveProjectTranslation] = useState<Record<string, boolean>>({});

  const handleTranslateFoodProject = async (project: FoodSupportProject, targetLang: string, forceRefresh = false) => {
    const currentLang = targetLang || selectedProjectLang[project.id] || 'en';
    // If not force refreshing and already showing translated in this language, toggle back to original
    if (!forceRefresh && activeProjectTranslation[project.id] && (selectedProjectLang[project.id] || 'en') === currentLang) {
      setActiveProjectTranslation((prev) => ({ ...prev, [project.id]: false }));
      return;
    }

    // If English is selected and verified translations exist without forcing refresh
    if (!forceRefresh && currentLang === 'en' && project.translatedDescription) {
      setProjectTranslations((prev) => ({
        ...prev,
        [project.id]: {
          ...(prev[project.id] || {}),
          en: {
            description: project.translatedDescription!,
            notes: project.translatedDeliveryNotes || project.deliveryNotes
          }
        }
      }));
      setActiveProjectTranslation((prev) => ({ ...prev, [project.id]: true }));
      return;
    }

    // Check cache if not forcing refresh
    if (!forceRefresh && projectTranslations[project.id]?.[currentLang]) {
      setActiveProjectTranslation((prev) => ({ ...prev, [project.id]: true }));
      return;
    }

    // Live translate
    setIsTranslatingProject((prev) => ({ ...prev, [project.id]: true }));
    try {
      const langObj = TRANSLATION_LANGUAGES.find((l) => l.code === currentLang);
      const transDesc = await translateText(project.description, currentLang, langObj?.name);
      let transNotes = project.deliveryNotes;
      if (project.deliveryNotes && project.deliveryNotes.trim()) {
        transNotes = await translateText(project.deliveryNotes, currentLang, langObj?.name);
      }
      setProjectTranslations((prev) => ({
        ...prev,
        [project.id]: {
          ...(prev[project.id] || {}),
          [currentLang]: {
            description: transDesc,
            notes: transNotes
          }
        }
      }));
      setActiveProjectTranslation((prev) => ({ ...prev, [project.id]: true }));
    } catch (err: any) {
      setProjectTranslations((prev) => ({
        ...prev,
        [project.id]: {
          ...(prev[project.id] || {}),
          [currentLang]: {
            description: project.translatedDescription || project.description,
            notes: project.translatedDeliveryNotes || project.deliveryNotes
          }
        }
      }));
      setActiveProjectTranslation((prev) => ({ ...prev, [project.id]: true }));
    } finally {
      setIsTranslatingProject((prev) => ({ ...prev, [project.id]: false }));
    }
  };


  // Copy feedback tracking
  const [copiedHandle, setCopiedHandle] = useState<string | null>(null);

  // Modals
  const [editingClub, setEditingClub] = useState<FanClub | null>(null);
  const [isClubModalOpen, setIsClubModalOpen] = useState<boolean>(false);

  const [editingProject, setEditingProject] = useState<FoodSupportProject | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState<boolean>(false);

  // Quick donation modal
  const [donationModalProject, setDonationModalProject] = useState<FoodSupportProject | null>(null);
  const [additionalDonationAmount, setAdditionalDonationAmount] = useState<string>('');

  // Media Lightbox
  const [lightboxMedia, setLightboxMedia] = useState<{ url: string; caption?: string; title?: string } | null>(null);

  // Helper to copy handle
  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHandle(text);
    showToast(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedHandle(null), 2000);
  };

  // Category matching helper (handles Actor, Duo, Everyone)
  const matchCategory = (actorValue: string, filter: string) => {
    if (!filter || filter === 'all') return true;
    const norm = (actorValue || '').toLowerCase();
    if (filter === 'everyone') {
      return norm === 'everyone' || norm === 'avocean';
    }
    if (filter === 'duo') {
      return norm === 'duo' || norm === 'jimmysea';
    }
    if (filter === 'actor') {
      return norm === 'actor' || norm === 'jimmy' || norm === 'sea';
    }
    return norm === filter.toLowerCase();
  };

  // Category badge with JimmySea purple-blue and Everyone purple-blue-green gradient & dynamic owner icons
  const renderCategoryBadge = (actor: string) => {
    const norm = (actor || '').toLowerCase();
    if (norm === 'everyone' || norm === 'avocean') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase text-white bg-gradient-to-r from-purple-600 via-sky-500 to-emerald-500 shadow-xs tracking-wider border border-white/20">
          <span>{categoryIcons.everyone || '🥑'}</span>
          <span>EVERYONE</span>
        </span>
      );
    }
    if (norm === 'duo' || norm === 'jimmysea') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-500 shadow-xs tracking-wider border border-white/20">
          <span>{categoryIcons.duo || '🤝'}</span>
          <span>DUO</span>
        </span>
      );
    }
    if (norm === 'jimmy') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
          <span>{categoryIcons.jimmy || '🩺'}</span>
          <span>ACTOR (JIMMY)</span>
        </span>
      );
    }
    if (norm === 'sea') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-sky-100 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
          <span>{categoryIcons.sea || '🌊'}</span>
          <span>ACTOR (SEA)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
        <span>{categoryIcons.actor || '🎭'}</span>
        <span>ACTOR</span>
      </span>
    );
  };


  // Distinct countries for directory filter
  const availableCountries = Array.from(
    new Set(
      fanClubs.map((c) =>
        JSON.stringify({ code: c.countryCode, name: c.countryName, flag: c.flagEmoji })
      )
    )
  ).map((str) => JSON.parse(str));

  // Filtered fan clubs
  const filteredFanClubs = fanClubs.filter((club) => {
    if (directoryActorFilter !== 'all' && !matchCategory(club.actor, directoryActorFilter)) {
      return false;
    }
    if (directoryCountryFilter !== 'all' && club.countryCode !== directoryCountryFilter) {
      return false;
    }
    if (directorySearch.trim()) {
      const q = directorySearch.toLowerCase();
      const matchName = club.name.toLowerCase().includes(q);
      const matchCountry = club.countryName.toLowerCase().includes(q);
      const matchHandle = club.handle?.toLowerCase().includes(q);
      const matchDesc = club.description.toLowerCase().includes(q);
      const matchTrans = club.translatedDescription?.toLowerCase().includes(q);
      return matchName || matchCountry || matchHandle || matchDesc || matchTrans;
    }
    return true;
  });

  // Filtered food support projects
  const filteredProjects = foodProjects.filter((proj) => {
    if (supportStatusFilter !== 'all' && proj.status !== supportStatusFilter) {
      return false;
    }
    if (supportActorFilter !== 'all' && !matchCategory(proj.actor, supportActorFilter)) {
      return false;
    }
    if (supportSearch.trim()) {
      const q = supportSearch.toLowerCase();
      const matchTitle = proj.title.toLowerCase().includes(q);
      const matchEvent = proj.eventName?.toLowerCase().includes(q);
      const matchOrg = proj.organizerName.toLowerCase().includes(q);
      const matchDesc = proj.description.toLowerCase().includes(q);
      return matchTitle || matchEvent || matchOrg || matchDesc;
    }
    return true;
  });

  // Platform icon helper
  const renderPlatformBadge = (platform: SocialPlatform, url: string, label?: string) => {
    const icons: Record<string, string> = {
      x: '𝕏',
      instagram: '📷',
      tiktok: '🎵',
      facebook: '📘',
      line: '💬',
      discord: '👾',
      youtube: '▶️',
      weibo: '🔴',
      web: '🌐'
    };
    return (
      <a
        key={url + platform}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/60 text-xs font-bold text-[#1A3668] dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 transition-all shadow-2xs group cursor-pointer"
        title={label || `Visit ${platform.toUpperCase()}`}
      >
        <span>{icons[platform] || '🔗'}</span>
        <span className="capitalize">{label || platform}</span>
        <ExternalLink className="w-2.5 h-2.5 opacity-50 group-hover:opacity-100 transition-opacity" />
      </a>
    );
  };

  // Support type icon helper
  const getSupportTypeIcon = (type: SupportType) => {
    switch (type) {
      case 'food_truck':
        return <Truck className="w-4 h-4 text-emerald-500" />;
      case 'coffee_cart':
        return <Coffee className="w-4 h-4 text-amber-500" />;
      case 'snack_boxes':
        return <Gift className="w-4 h-4 text-purple-500" />;
      case 'custom_cake':
        return <Cake className="w-4 h-4 text-rose-500" />;
      case 'flower_stand':
        return <Flower2 className="w-4 h-4 text-pink-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-sky-500" />;
    }
  };

  return (
    <div className="w-full max-w-[1240px] mx-auto flex flex-col gap-6 animate-in fade-in duration-200 pb-12">
      {/* ============================================================== */}
      {/* TOP HEADER & DUAL-TAB NAVIGATION                               */}
      {/* ============================================================== */}
      <div className="bg-white/95 dark:bg-slate-900/90 rounded-[28px] p-4 sm:p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col gap-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300">
                AVOCEAN FAN HUB
              </span>
              <span className="text-xs text-slate-400 font-semibold">
                Official Branches & Community Support
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1A3668] dark:text-white tracking-tight">
              Fan Clubs Directory & Food Support Tracker
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
              Find and connect with international fan clubs for Jimmy, Sea, and Avocean, and track ongoing food support projects!
            </p>
          </div>

          {/* Dual Tab Switcher */}
          <div className="inline-flex p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 self-start md:self-auto shrink-0 shadow-2xs">
            <button
              type="button"
              onClick={() => handleTabClick('directory')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                hubTab === 'directory'
                  ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-500 text-white shadow-xs'
                  : 'text-[#475569] dark:text-slate-300 hover:text-[#1A3668] dark:hover:text-white'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Fan Clubs ({fanClubs.length})</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabClick('foodsupport')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                hubTab === 'foodsupport'
                  ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-500 text-white shadow-xs'
                  : 'text-[#475569] dark:text-slate-300 hover:text-[#1A3668] dark:hover:text-white'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Food Support ({foodProjects.length})</span>
            </button>
          </div>
        </div>

        {/* Global Hub Highlights Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[11px] font-bold text-slate-400 block">Total Chapters</span>
            <span className="text-lg font-extrabold text-[#1A3668] dark:text-white">
              {fanClubs.length} Active Clubs
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[11px] font-bold text-slate-400 block">Countries & Regions</span>
            <span className="text-lg font-extrabold text-[#1A3668] dark:text-white">
              {availableCountries.length} Worldwide
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[11px] font-bold text-slate-400 block">Food Support Projects</span>
            <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
              {foodProjects.filter((p) => p.status === 'open').length} Open Now
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[11px] font-bold text-slate-400 block">Delivered Gifts & Carts</span>
            <span className="text-lg font-extrabold text-purple-600 dark:text-purple-400">
              {foodProjects.filter((p) => p.status === 'delivered').length} Successful
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: FAN CLUBS DIRECTORY                                     */}
      {/* ============================================================== */}
      {hubTab === 'directory' && (
        <div className="flex flex-col gap-5">
          {/* Controls Bar: Search, Actor Filter, Country Filter, + Add Club */}
          <div className="bg-white/95 dark:bg-slate-900/90 rounded-[24px] p-4 shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={directorySearch}
                onChange={(e) => setDirectorySearch(e.target.value)}
                placeholder="Search by fan club name, handle, country, or language..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-semibold text-[#1A3668] dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-purple-400"
              />
              {directorySearch && (
                <button
                  type="button"
                  onClick={() => setDirectorySearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Category Filter Pills: All | Actor | Duo | Everyone */}
              <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                {(
                  [
                    { key: 'all', label: 'All Fan Clubs' },
                    { key: 'actor', label: `${categoryIcons.actor || '🎭'} Actor` },
                    { key: 'duo', label: `${categoryIcons.duo || '🤝'} Duo` },
                    { key: 'everyone', label: `${categoryIcons.everyone || '🥑'} Everyone` }
                  ] as { key: FanClubActor; label: string }[]
                ).map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setDirectoryActorFilter(opt.key)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      directoryActorFilter === opt.key
                        ? opt.key === 'everyone'
                          ? 'bg-gradient-to-r from-purple-600 via-sky-500 to-emerald-500 text-white shadow-xs font-extrabold'
                          : opt.key === 'duo'
                          ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-500 text-white shadow-xs font-extrabold'
                          : opt.key === 'actor'
                          ? 'bg-purple-600 text-white shadow-xs font-extrabold'
                          : 'bg-white dark:bg-slate-700 text-[#1A3668] dark:text-white shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}

                {/* Owner: Edit category icons button */}
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => {
                      setTempCategoryIcons({ ...categoryIcons });
                      setIsIconModalOpen(true);
                    }}
                    className="ml-1 px-2 py-1 rounded-lg text-[11px] font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-950/60 transition-colors cursor-pointer flex items-center gap-1"
                    title="Owner: Edit & Choose Category Icons"
                  >
                    <Settings className="w-3 h-3 text-purple-600" />
                    <span>Edit Icons</span>
                  </button>
                )}
              </div>


              {/* Country Select */}
              <select
                value={directoryCountryFilter}
                onChange={(e) => setDirectoryCountryFilter(e.target.value)}
                aria-label="Filter by Country"
                className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-[#1A3668] dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">🌍 All Countries</option>
                {availableCountries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>

              {/* Add Club Button (Admin / Owner) */}
              {canEdit && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingClub({
                      id: `fc-${Date.now()}`,
                      name: '',
                      actor: 'jimmysea',
                      countryCode: 'TH',
                      countryName: 'Thailand',
                      flagEmoji: '🇹🇭',
                      description: '',
                      handle: '',
                      isOfficialOrVerified: false,
                      socials: [{ platform: 'x', url: '' }]
                    });
                    setIsClubModalOpen(true);
                  }}
                  style={{ backgroundColor: currentAccent.colorHex }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-95 cursor-pointer shrink-0 transition-opacity"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Fan Club</span>
                </button>
              )}
            </div>
          </div>

          {/* Clubs Grid */}
          {filteredFanClubs.length === 0 ? (
            <div className="bg-white/80 dark:bg-slate-900/80 rounded-3xl p-12 text-center border border-slate-200/80 dark:border-slate-800 flex flex-col items-center justify-center gap-3">
              <Globe className="w-10 h-10 text-slate-300 dark:text-slate-600" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                No Fan Clubs found
              </h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Try searching with a different country name or reset your actor filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setDirectorySearch('');
                  setDirectoryActorFilter('all');
                  setDirectoryCountryFilter('all');
                }}
                className="px-4 py-1.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredFanClubs.map((club) => {
                // Fallback banner gradient based on category

                const normActor = (club.actor || '').toLowerCase();
                const fallbackBannerClass =
                  normActor === 'everyone' || normActor === 'avocean'
                    ? 'bg-gradient-to-r from-purple-700 via-sky-600 to-emerald-600'
                    : normActor === 'duo' || normActor === 'jimmysea'
                    ? 'bg-gradient-to-r from-purple-700 via-indigo-600 to-sky-600'
                    : normActor === 'sea'
                    ? 'bg-gradient-to-r from-sky-600 to-blue-700'
                    : 'bg-gradient-to-r from-purple-800 to-indigo-700';

                return (
                  <div
                    key={club.id}
                    className="bg-white/95 dark:bg-slate-900/90 rounded-[24px] shadow-sm border border-slate-200/80 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-600/60 transition-all flex flex-col justify-between overflow-hidden group"
                  >
                    <div>
                      {/* OFFICIAL HEADER BANNER */}
                      <div className="relative h-28 sm:h-32 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                        {club.bannerUrl ? (
                          <img
                            src={club.bannerUrl}
                            alt={`${club.name} banner`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className={`w-full h-full ${fallbackBannerClass} flex items-center justify-end pr-4 opacity-90`}>
                            <Sparkles className="w-12 h-12 text-white/20" />
                          </div>
                        )}

                        {/* Top Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent pointer-events-none" />

                        {/* Top Row inside Banner: Country badge & Category badge */}
                        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 z-10">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-white bg-black/45 backdrop-blur-md border border-white/20 shadow-xs">
                            <span className="text-sm leading-none">{club.flagEmoji}</span>
                            <span className="truncate max-w-[110px] sm:max-w-[130px]">{club.countryName}</span>
                          </span>

                          <div className="flex items-center gap-1.5">
                            {renderCategoryBadge(club.actor)}

                            {/* Admin Buttons */}
                            {canEdit && (
                              <div className="flex items-center gap-0.5 bg-black/45 backdrop-blur-md rounded-full p-0.5 border border-white/20">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingClub(club);
                                    setIsClubModalOpen(true);
                                  }}
                                  className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/20 cursor-pointer transition-colors"
                                  title="Edit fan club"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                {isOwner && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (window.confirm(`Delete "${club.name}" from fan club directory?`)) {
                                        onDeleteFanClub(club.id);
                                      }
                                    }}
                                    className="p-1 rounded-full text-rose-300 hover:text-rose-100 hover:bg-rose-500/30 cursor-pointer transition-colors"
                                    title="Delete fan club"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* AVATAR DISPLAY PHOTO (Overlapping Banner) */}
                      <div className="px-5 -mt-8 flex items-end justify-between relative z-10 mb-2">
                        <div className="relative">
                          {club.avatarUrl ? (
                            <img
                              src={club.avatarUrl}
                              alt={`${club.name} profile`}
                              className="w-16 h-16 rounded-full border-3 border-white dark:border-slate-900 shadow-md object-cover bg-white dark:bg-slate-800"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full border-3 border-white dark:border-slate-900 shadow-md bg-gradient-to-tr from-purple-600 via-indigo-600 to-sky-500 flex items-center justify-center text-white text-xl font-black">
                              {club.flagEmoji || '🥑'}
                            </div>
                          )}
                        </div>

                        {club.handle && (
                          <button
                            type="button"
                            onClick={() => handleCopyText(club.handle || '', club.name)}
                            className="inline-flex items-center gap-1 text-[11.5px] font-mono font-semibold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer bg-purple-50 dark:bg-purple-950/50 px-2.5 py-1 rounded-full border border-purple-200/60 dark:border-purple-800/60"
                            title="Click to copy handle"
                          >
                            <span>{club.handle}</span>
                            {copiedHandle === club.handle ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-2.5 h-2.5 opacity-50" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* CLUB INFO & DESCRIPTION */}
                      <div className="px-5 pt-1 space-y-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-base font-extrabold text-[#1A3668] dark:text-white leading-tight">
                            {club.name}
                          </h3>
                          {club.isOfficialOrVerified && (
                            <span
                              className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-sky-500 text-white text-[10px] font-black shrink-0 shadow-2xs"
                              title="Official / Verified Fanclub"
                            >
                              ✓
                            </span>
                          )}
                        </div>

                        {/* Description & Selectable Translation */}
                        {(() => {
                          const isClubTrans = Boolean(activeClubTranslation[club.id]);
                          const clubTargetLang = selectedClubLang[club.id] || 'en';
                          const targetClubLangObj =
                            TRANSLATION_LANGUAGES.find((l) => l.code === clubTargetLang) || TRANSLATION_LANGUAGES[0];
                          const translatedBioText =
                            clubTranslations[club.id]?.[clubTargetLang] ||
                            (clubTargetLang === 'en' ? club.translatedDescription : undefined);

                          return (
                            <div className="space-y-2 pt-0.5">
                              {isClubTrans && translatedBioText ? (
                                <div className="p-3 rounded-2xl bg-purple-50/90 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/80">
                                  <div className="flex items-center justify-between text-[10px] font-extrabold uppercase text-purple-700 dark:text-purple-300 mb-1">
                                    <span className="flex items-center gap-1">
                                      <Languages className="w-3 h-3 text-purple-600" />
                                      <span>Bio Translation</span>
                                    </span>
                                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                                      {targetClubLangObj.flag} {targetClubLangObj.name}
                                    </span>
                                  </div>
                                  <p className="text-xs text-[#1A3668] dark:text-purple-100 font-medium leading-relaxed">
                                    {translatedBioText}
                                  </p>
                                </div>
                              ) : (
                                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                                  {club.description}
                                </p>
                              )}

                              {/* Language Dropdown & Translate Button (matching events) */}
                              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex-wrap">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <div className="relative inline-flex items-center">
                                    <select
                                      value={clubTargetLang}
                                      onChange={(e) => {
                                        const newLang = e.target.value;
                                        setSelectedClubLang((prev) => ({ ...prev, [club.id]: newLang }));
                                        if (activeClubTranslation[club.id]) {
                                          handleTranslateClubBio(club, newLang, true);
                                        }
                                      }}
                                      className="text-[11px] font-bold pl-2.5 pr-6 py-1 rounded-lg bg-white dark:bg-slate-800 text-[#1A3668] dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-purple-400 appearance-none"
                                      title="Choose target language for fan club bio"
                                    >
                                      {TRANSLATION_LANGUAGES.map((lang) => (
                                        <option key={lang.code} value={lang.code}>
                                          {lang.flag} {lang.name}
                                        </option>
                                      ))}
                                    </select>
                                    <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 pointer-events-none" />
                                  </div>

                                  {translatedBioText ? (
                                    <div className="inline-flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleTranslateClubBio(club, clubTargetLang)}
                                        disabled={isTranslatingClub[club.id]}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 transition-colors cursor-pointer"
                                        title={isClubTrans ? "View original bio" : `Show ${targetClubLangObj?.name} translation`}
                                      >
                                        <Languages className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                        <span>{isClubTrans ? 'Show Original' : 'Show Translation'}</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleTranslateClubBio(club, clubTargetLang, true)}
                                        disabled={isTranslatingClub[club.id]}
                                        className="p-1 rounded-lg bg-white/95 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
                                        title="Re-translate / Refresh translation"
                                      >
                                        <RotateCcw className={`w-3.5 h-3.5 ${isTranslatingClub[club.id] ? 'animate-spin text-purple-600' : ''}`} />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleTranslateClubBio(club, clubTargetLang, true)}
                                      disabled={isTranslatingClub[club.id]}
                                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
                                      title={`Translate bio to ${targetClubLangObj?.name}`}
                                    >
                                      {isTranslatingClub[club.id] ? (
                                        <>
                                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
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
                                </div>

                                {isClubTrans && (
                                  <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                                    <span>{targetClubLangObj.flag}</span>
                                    <span>{targetClubLangObj.name}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>


                    {/* Social Platforms Row */}
                    <div className="p-5 pt-3 border-t border-slate-100 dark:border-slate-800 mt-3">
                      <span className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Official Social Links
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {club.socials.map((s) => renderPlatformBadge(s.platform, s.url, s.label))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: FOOD SUPPORT & PROJECT TRACKER                          */}
      {/* ============================================================== */}
      {hubTab === 'foodsupport' && (
        <div className="flex flex-col gap-5">
          {/* Controls Bar: Search, Status Filter, Actor Filter, + Create Project */}
          <div className="bg-white/95 dark:bg-slate-900/90 rounded-[24px] p-4 shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={supportSearch}
                onChange={(e) => setSupportSearch(e.target.value)}
                placeholder="Search food support projects, events, food trucks, coffee carts..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-semibold text-[#1A3668] dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-purple-400"
              />
              {supportSearch && (
                <button
                  type="button"
                  onClick={() => setSupportSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Status Filter */}
              <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                {(
                  [
                    { key: 'all', label: 'All Status' },
                    { key: 'open', label: '🟢 Open' },
                    { key: 'reached', label: '🎯 Reached' },
                    { key: 'delivered', label: '🎉 Delivered' }
                  ] as { key: 'all' | ProjectStatus; label: string }[]
                ).map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setSupportStatusFilter(opt.key)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      supportStatusFilter === opt.key
                        ? 'bg-white dark:bg-slate-700 text-[#1A3668] dark:text-white shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Category Filter: All | Actor | Duo | Everyone */}
              <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                {(
                  [
                    { key: 'all', label: 'All Categories' },
                    { key: 'actor', label: `${categoryIcons.actor || '🎭'} Actor` },
                    { key: 'duo', label: `${categoryIcons.duo || '🤝'} Duo` },
                    { key: 'everyone', label: `${categoryIcons.everyone || '🥑'} Everyone` }
                  ] as { key: FanClubActor; label: string }[]
                ).map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setSupportActorFilter(opt.key)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      supportActorFilter === opt.key
                        ? opt.key === 'everyone'
                          ? 'bg-gradient-to-r from-purple-600 via-sky-500 to-emerald-500 text-white shadow-xs font-extrabold'
                          : opt.key === 'duo'
                          ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-500 text-white shadow-xs font-extrabold'
                          : opt.key === 'actor'
                          ? 'bg-purple-600 text-white shadow-xs font-extrabold'
                          : 'bg-white dark:bg-slate-700 text-[#1A3668] dark:text-white shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}

                {/* Owner: Edit category icons button */}
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => {
                      setTempCategoryIcons({ ...categoryIcons });
                      setIsIconModalOpen(true);
                    }}
                    className="ml-1 px-2 py-1 rounded-lg text-[11px] font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-950/60 transition-colors cursor-pointer flex items-center gap-1"
                    title="Owner: Edit & Choose Category Icons"
                  >
                    <Settings className="w-3 h-3 text-purple-600" />
                    <span>Edit Icons</span>
                  </button>
                )}
              </div>


              {/* Add Project Button (Admin / Owner) */}
              {canEdit && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingProject({
                      id: `proj-${Date.now()}`,
                      title: '',
                      actor: 'jimmysea',
                      supportType: 'food_truck',
                      status: 'open',
                      eventName: '',
                      organizerName: '',
                      description: '',
                      targetAmount: 30000,
                      currentAmount: 0,
                      currency: 'THB',
                      proofMedia: [],
                      createdAt: new Date().toISOString()
                    });
                    setIsProjectModalOpen(true);
                  }}
                  style={{ backgroundColor: currentAccent.colorHex }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-95 cursor-pointer shrink-0 transition-opacity"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Create Support Project</span>
                </button>
              )}
            </div>
          </div>

          {/* Food Support Cards Grid */}
          {filteredProjects.length === 0 ? (
            <div className="bg-white/80 dark:bg-slate-900/80 rounded-3xl p-12 text-center border border-slate-200/80 dark:border-slate-800 flex flex-col items-center justify-center gap-3">
              <Truck className="w-10 h-10 text-slate-300 dark:text-slate-600" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                No Food Support projects found
              </h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Try selecting "All Projects" or creating a new support project.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filteredProjects.map((proj) => {
                const percent = Math.min(100, Math.round((proj.currentAmount / Math.max(1, proj.targetAmount)) * 100));

                const statusBadge =
                  proj.status === 'delivered' ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-2xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>DELIVERED & VERIFIED</span>
                    </span>
                  ) : proj.status === 'reached' ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-2xs">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>100% GOAL REACHED</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-300 dark:border-sky-700 shadow-2xs animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                      <span>OPEN FOR SUPPORT ({percent}%)</span>
                    </span>
                  );

                return (
                  <div
                    key={proj.id}
                    className="bg-white/95 dark:bg-slate-900/90 rounded-[28px] p-5 sm:p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-600/70 transition-all flex flex-col justify-between gap-5"
                  >
                    <div className="space-y-4">
                      {/* Top Row: Type, Category Badge & Status */}
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            {getSupportTypeIcon(proj.supportType)}
                          </div>
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 capitalize">
                            {proj.supportType === 'other' && proj.customSupportType
                              ? proj.customSupportType
                              : proj.supportType.replace('_', ' ')}
                          </span>
                          {renderCategoryBadge(proj.actor)}
                        </div>
                        {statusBadge}
                      </div>

                      {/* Project Title */}
                      <div>
                        <h3 className="text-base sm:text-lg font-extrabold text-[#1A3668] dark:text-white leading-snug">
                          {proj.title}
                        </h3>
                        {/* Event Link */}
                        {proj.eventName && (
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 mt-1">
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            <span>{proj.eventName}</span>
                            {proj.eventDate && <span className="opacity-75">({proj.eventDate})</span>}
                          </div>
                        )}
                      </div>

                      {/* Organizer Details */}
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs font-medium">
                        <span className="text-slate-500 dark:text-slate-400">Organized by:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#1A3668] dark:text-white">
                            {proj.organizerName}
                          </span>
                          {proj.organizerContactUrl && (
                            <a
                              href={proj.organizerContactUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-600 dark:text-purple-400 hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Description, Menu Concept, Selectable Translation, & Delivery Notes */}
                      {(() => {
                        const isProjTrans = Boolean(activeProjectTranslation[proj.id]);
                        const projTargetLang = selectedProjectLang[proj.id] || 'en';
                        const targetProjLangObj =
                          TRANSLATION_LANGUAGES.find((l) => l.code === projTargetLang) || TRANSLATION_LANGUAGES[0];
                        const cachedProj = projectTranslations[proj.id]?.[projTargetLang];
                        const translatedDesc =
                          cachedProj?.description || (projTargetLang === 'en' ? proj.translatedDescription : undefined);
                        const translatedNotes =
                          cachedProj?.notes || (projTargetLang === 'en' ? proj.translatedDeliveryNotes : undefined);

                        return (
                          <div className="space-y-2.5">
                            {/* Menu Concept Description */}
                            {isProjTrans && translatedDesc ? (
                              <div className="p-3.5 rounded-2xl bg-purple-50/90 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/80 space-y-1">
                                <div className="flex items-center justify-between text-[10px] font-extrabold uppercase text-purple-700 dark:text-purple-300">
                                  <span className="flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 text-purple-600" />
                                    <span>Menu Concept & Details</span>
                                  </span>
                                  <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                                    {targetProjLangObj.flag} {targetProjLangObj.name}
                                  </span>
                                </div>
                                <p className="text-xs text-[#1A3668] dark:text-purple-100 font-medium leading-relaxed">
                                  {translatedDesc}
                                </p>
                              </div>
                            ) : (
                              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                                {proj.description}
                              </p>
                            )}

                            {/* Target Language Dropdown & Translate Button (matching events) */}
                            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex-wrap">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <div className="relative inline-flex items-center">
                                  <select
                                    value={projTargetLang}
                                    onChange={(e) => {
                                      const newLang = e.target.value;
                                      setSelectedProjectLang((prev) => ({ ...prev, [proj.id]: newLang }));
                                      if (activeProjectTranslation[proj.id]) {
                                        handleTranslateFoodProject(proj, newLang, true);
                                      }
                                    }}
                                    className="text-[11px] font-bold pl-2.5 pr-6 py-1 rounded-lg bg-white dark:bg-slate-800 text-[#1A3668] dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-purple-400 appearance-none"
                                    title="Choose target language for food support details"
                                  >
                                    {TRANSLATION_LANGUAGES.map((lang) => (
                                      <option key={lang.code} value={lang.code}>
                                        {lang.flag} {lang.name}
                                      </option>
                                    ))}
                                  </select>
                                  <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 pointer-events-none" />
                                </div>

                                {translatedDesc ? (
                                  <div className="inline-flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleTranslateFoodProject(proj, projTargetLang)}
                                      disabled={isTranslatingProject[proj.id]}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 transition-colors cursor-pointer"
                                      title={isProjTrans ? "View original details" : `Show ${targetProjLangObj?.name} translation`}
                                    >
                                      <Languages className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                      <span>{isProjTrans ? 'Show Original' : 'Show Translation'}</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleTranslateFoodProject(proj, projTargetLang, true)}
                                      disabled={isTranslatingProject[proj.id]}
                                      className="p-1 rounded-lg bg-white/95 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
                                      title="Re-translate / Refresh translation"
                                    >
                                      <RotateCcw className={`w-3.5 h-3.5 ${isTranslatingProject[proj.id] ? 'animate-spin text-purple-600' : ''}`} />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleTranslateFoodProject(proj, projTargetLang, true)}
                                    disabled={isTranslatingProject[proj.id]}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
                                    title={`Translate food support to ${targetProjLangObj?.name}`}
                                  >
                                    {isTranslatingProject[proj.id] ? (
                                      <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
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
                              </div>

                              {isProjTrans && (
                                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                                  <span>{targetProjLangObj.flag}</span>
                                  <span>{targetProjLangObj.name}</span>
                                </span>
                              )}
                            </div>

                            {/* Delivery Notes / Thank You quote (Translated or Original) */}
                            {proj.deliveryNotes && (
                              <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/80 text-xs font-medium text-purple-900 dark:text-purple-200 space-y-1">
                                <span className="font-bold flex items-center gap-1">
                                  💬 Delivery & Thank You Update {isProjTrans && `(${targetProjLangObj.name})`}:
                                </span>
                                <p className="leading-relaxed">
                                  {isProjTrans && translatedNotes ? translatedNotes : proj.deliveryNotes}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* GOAL & PROGRESS BAR */}
                      <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-500 dark:text-slate-400">Project Goal:</span>
                          <span className="text-sm font-extrabold text-[#1A3668] dark:text-white">
                            {proj.currentAmount.toLocaleString()} / {proj.targetAmount.toLocaleString()} {proj.currency}
                          </span>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden relative">
                          <div
                            className="h-full rounded-full transition-all duration-500 ease-out"
                            style={{
                              width: `${percent}%`,
                              background:
                                percent >= 100
                                  ? 'linear-gradient(90deg, #10B981 0%, #059669 100%)'
                                  : 'linear-gradient(90deg, #8B5CF6 0%, #3B82F6 100%)'
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          <span>
                            {percent >= 100
                              ? '🎉 Goal Fully Reached!'
                              : `${(proj.targetAmount - proj.currentAmount).toLocaleString()} ${proj.currency} remaining`}
                          </span>
                          <span className="font-extrabold text-[#1A3668] dark:text-white">{percent}% Funded</span>
                        </div>
                      </div>

                      {/* DELIVERY PROOF MEDIA GALLERY (Photos & Videos) */}
                      {proj.proofMedia && proj.proofMedia.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                              <Camera className="w-3.5 h-3.5 text-purple-600" />
                              <span>Delivery Proof & Celebration Photos ({proj.proofMedia.length})</span>
                            </span>
                            <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold">
                              Click photo to expand
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {proj.proofMedia.map((media, mIdx) => (
                              <button
                                key={mIdx}
                                type="button"
                                onClick={() =>
                                  setLightboxMedia({
                                    url: media.url,
                                    caption: media.caption,
                                    title: proj.title
                                  })
                                }
                                className="group relative rounded-xl overflow-hidden aspect-video bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer"
                              >
                                {media.type === 'video' ? (
                                  <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white">
                                    <Play className="w-6 h-6 text-purple-400" />
                                  </div>
                                ) : (
                                  <img
                                    src={media.url}
                                    alt={media.caption || 'Proof photo'}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    loading="lazy"
                                  />
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold p-1 text-center">
                                  <span>{media.caption || 'View Media'}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>


                    {/* Action Buttons Row */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        {proj.donationUrl && proj.status === 'open' && (
                          <a
                            href={proj.donationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ backgroundColor: currentAccent.colorHex }}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-95 cursor-pointer transition-opacity"
                          >
                            <Gift className="w-3.5 h-3.5" />
                            <span>Support / Donate</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}

                        {proj.announcementUrl && (
                          <a
                            href={proj.announcementUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-[#1A3668] dark:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs"
                          >
                            <span>View on 𝕏</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>

                      {/* Admin Controls */}
                      {canEdit && (
                        <div className="flex items-center gap-1.5">
                          {proj.status === 'open' && (
                            <button
                              type="button"
                              onClick={() => {
                                setDonationModalProject(proj);
                                setAdditionalDonationAmount('');
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold cursor-pointer"
                              title="Update raised amount"
                            >
                              + Add Funds
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProject(proj);
                              setIsProjectModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-slate-800 cursor-pointer"
                            title="Edit project"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {isOwner && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Delete food support project "${proj.title}"?`)) {
                                onDeleteFoodProject(proj.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 cursor-pointer"
                            title="Delete project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    )}

      {/* ============================================================== */}
      {/* MODAL: ADD / EDIT FAN CLUB                                     */}
      {/* ============================================================== */}
      {isClubModalOpen && editingClub && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl w-full max-w-lg p-5 sm:p-6 my-auto max-h-[92vh] overflow-y-auto border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-purple-600" />
                <h3 className="text-base sm:text-lg font-bold text-[#1A3668] dark:text-white">
                  {editingClub.id.startsWith('fc-') && !fanClubs.some((c) => c.id === editingClub.id)
                    ? 'Add New Fan Club'
                    : 'Edit Fan Club'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsClubModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editingClub.name.trim()) {
                  showToast('Please enter a fan club name');
                  return;
                }
                onSaveFanClub(editingClub);
                setIsClubModalOpen(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Club Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingClub.name}
                  onChange={(e) => setEditingClub({ ...editingClub, name: e.target.value })}
                  placeholder="e.g. JimmySea Philippines (NomNom PH)"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Category / Representation *
                  </label>
                  <select
                    value={editingClub.actor}
                    onChange={(e) => setEditingClub({ ...editingClub, actor: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-xs font-bold text-[#1A3668] dark:text-white focus:outline-none"
                  >
                    <option value="everyone">{categoryIcons.everyone || '🥑'} Everyone (Jimmy + Sea + Avocean)</option>
                    <option value="duo">{categoryIcons.duo || '🤝'} Duo (JimmySea)</option>
                    <option value="actor">{categoryIcons.actor || '🎭'} Actor (Solo)</option>
                    <option value="jimmy">{categoryIcons.jimmy || '🩺'} Actor — Jimmy Jitaraphol</option>
                    <option value="sea">{categoryIcons.sea || '🌊'} Actor — Sea Tawinan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Primary Handle (Optional)
                  </label>
                  <input
                    type="text"
                    value={editingClub.handle || ''}
                    onChange={(e) => setEditingClub({ ...editingClub, handle: e.target.value })}
                    placeholder="e.g. @JimmySeaPH or @Avocean_TH"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              {/* Country Selection: Preset Dropdown + Custom Flag & Name */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Country & Region Selection *
                  </label>
                  <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                    Pick from list or customize
                  </span>
                </div>

                {/* Preset Dropdown */}
                <select
                  onChange={(e) => {
                    const found = POPULAR_FAN_COUNTRIES.find((c) => c.code === e.target.value);
                    if (found && found.code !== 'OTHER') {
                      setEditingClub({
                        ...editingClub,
                        countryCode: found.code,
                        countryName: found.name,
                        flagEmoji: found.flag
                      });
                    }
                  }}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-[#1A3668] dark:text-white focus:outline-none"
                >
                  <option value="">-- Quick Select from Popular Fan Regions --</option>
                  {POPULAR_FAN_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.name} ({c.code})
                    </option>
                  ))}
                </select>

                {/* Editable inputs */}
                <div className="flex gap-2 items-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 mb-0.5">Flag</span>
                    <input
                      type="text"
                      value={editingClub.flagEmoji}
                      onChange={(e) => setEditingClub({ ...editingClub, flagEmoji: e.target.value })}
                      placeholder="🇵🇭"
                      className="w-14 text-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-1.5 text-base font-bold text-[#1A3668] dark:text-white focus:outline-none"
                    />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 mb-0.5">Country / Region Name</span>
                    <input
                      type="text"
                      value={editingClub.countryName}
                      onChange={(e) =>
                        setEditingClub({
                          ...editingClub,
                          countryName: e.target.value,
                          countryCode: e.target.value.substring(0, 3).toUpperCase()
                        })
                      }
                      placeholder="Philippines"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Official Banner & Display Photo (Avatar) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Official Visuals (Banner & Profile Photo)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                      <span>Official Header Banner URL</span>
                    </label>
                    <input
                      type="url"
                      value={editingClub.bannerUrl || ''}
                      onChange={(e) => setEditingClub({ ...editingClub, bannerUrl: e.target.value })}
                      placeholder="https://... (header banner image)"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                    />
                    {editingClub.bannerUrl && (
                      <div className="mt-1.5 h-12 w-full rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100">
                        <img
                          src={editingClub.bannerUrl}
                          alt="Banner preview"
                          className="w-full h-full object-cover"
                          onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-sky-600" />
                      <span>Display Photo / Avatar URL</span>
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="url"
                        value={editingClub.avatarUrl || ''}
                        onChange={(e) => setEditingClub({ ...editingClub, avatarUrl: e.target.value })}
                        placeholder="https://... (profile display photo)"
                        className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                      />
                      {editingClub.avatarUrl && (
                        <img
                          src={editingClub.avatarUrl}
                          alt="Avatar preview"
                          className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-700 object-cover shrink-0"
                          onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description & International Translation */}
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Description / Bio (Original) *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const res = getTranslatedBio(editingClub.description);
                        setEditingClub({
                          ...editingClub,
                          translatedDescription: res.text.replace(/^\[English translation\]:\s*/i, '')
                        });
                        showToast('Auto-generated translation!');
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Auto-Translate to English</span>
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    required
                    value={editingClub.description}
                    onChange={(e) => setEditingClub({ ...editingClub, description: e.target.value })}
                    placeholder="What projects, fan gatherings, or translations does this fan club coordinate?"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <Languages className="w-3.5 h-3.5 text-purple-600" />
                    <span>English / International Translation (Optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={editingClub.translatedDescription || ''}
                    onChange={(e) => setEditingClub({ ...editingClub, translatedDescription: e.target.value })}
                    placeholder="English translation for international fans..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400 resize-none"
                  />
                </div>
              </div>

              {/* Social Links List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Social Media Links
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingClub({
                        ...editingClub,
                        socials: [...editingClub.socials, { platform: 'x', url: '' }]
                      });
                    }}
                    className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                  >
                    + Add Link
                  </button>
                </div>

                <div className="space-y-2">
                  {editingClub.socials.map((soc, sIdx) => (
                    <div key={sIdx} className="flex items-center gap-2">
                      <select
                        value={soc.platform}
                        onChange={(e) => {
                          const next = [...editingClub.socials];
                          next[sIdx].platform = e.target.value as any;
                          setEditingClub({ ...editingClub, socials: next });
                        }}
                        className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-2 text-xs font-bold text-[#1A3668] dark:text-white focus:outline-none"
                      >
                        <option value="x">𝕏 Twitter</option>
                        <option value="instagram">Instagram</option>
                        <option value="tiktok">TikTok</option>
                        <option value="facebook">Facebook</option>
                        <option value="line">Line</option>
                        <option value="discord">Discord</option>
                        <option value="youtube">YouTube</option>
                        <option value="weibo">Weibo</option>
                        <option value="web">Website</option>
                      </select>
                      <input
                        type="url"
                        value={soc.url}
                        onChange={(e) => {
                          const next = [...editingClub.socials];
                          next[sIdx].url = e.target.value;
                          setEditingClub({ ...editingClub, socials: next });
                        }}
                        placeholder="https://..."
                        className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none"
                      />
                      {editingClub.socials.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const next = editingClub.socials.filter((_, idx) => idx !== sIdx);
                            setEditingClub({ ...editingClub, socials: next });
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-500 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Verified Checkbox */}
              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingClub.isOfficialOrVerified || false}
                  onChange={(e) => setEditingClub({ ...editingClub, isOfficialOrVerified: e.target.checked })}
                  className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Mark as Official / Verified Fan Club
                </span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsClubModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: currentAccent.colorHex }}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-95 cursor-pointer"
                >
                  Save Fan Club
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADD / EDIT FOOD SUPPORT PROJECT                         */}
      {/* ============================================================== */}
      {isProjectModalOpen && editingProject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl w-full max-w-xl p-5 sm:p-6 my-auto max-h-[92vh] overflow-y-auto border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-purple-600" />
                <h3 className="text-base sm:text-lg font-bold text-[#1A3668] dark:text-white">
                  {editingProject.id.startsWith('proj-') && !foodProjects.some((p) => p.id === editingProject.id)
                    ? 'Create Food Support Project'
                    : 'Edit Food Support Project'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsProjectModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editingProject.title.trim()) {
                  showToast('Please enter a project title');
                  return;
                }
                onSaveFoodProject(editingProject);
                setIsProjectModalOpen(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={editingProject.title}
                  onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                  placeholder="e.g. MEDIHEAL Food Truck & Smoothie Bar"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={editingProject.actor}
                    onChange={(e) => setEditingProject({ ...editingProject, actor: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-[#1A3668] dark:text-white focus:outline-none"
                  >
                    <option value="everyone">{categoryIcons.everyone || '🥑'} Everyone (Jimmy + Sea + Avocean)</option>
                    <option value="duo">{categoryIcons.duo || '🤝'} Duo (JimmySea)</option>
                    <option value="actor">{categoryIcons.actor || '🎭'} Actor (Solo)</option>
                    <option value="jimmy">{categoryIcons.jimmy || '🩺'} Actor — Jimmy</option>
                    <option value="sea">{categoryIcons.sea || '🌊'} Actor — Sea</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Support Type
                  </label>
                  <select
                    value={editingProject.supportType}
                    onChange={(e) => setEditingProject({ ...editingProject, supportType: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-[#1A3668] dark:text-white focus:outline-none"
                  >
                    <option value="food_truck">Food Truck 🚚</option>
                    <option value="coffee_cart">Coffee Cart ☕</option>
                    <option value="snack_boxes">Snack Boxes 🍱</option>
                    <option value="flower_stand">Flower Stand 💐</option>
                    <option value="custom_cake">Custom Cake 🎂</option>
                    <option value="gifting">Gifting 🎁</option>
                    <option value="led_billboard">LED Billboard 📺</option>
                    <option value="other">✍️ Other (Type Custom Type)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={editingProject.status}
                    onChange={(e) => setEditingProject({ ...editingProject, status: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-[#1A3668] dark:text-white focus:outline-none"
                  >
                    <option value="open">🟢 Open</option>
                    <option value="reached">🎯 Reached</option>
                    <option value="delivered">🎉 Delivered</option>
                  </select>
                </div>
              </div>

              {/* Custom Support Type Input (When Other is selected or admin wants to type freely) */}
              {editingProject.supportType === 'other' && (
                <div className="p-3.5 rounded-2xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 animate-in fade-in slide-in-from-top-1 duration-150">
                  <label className="block text-xs font-bold text-purple-900 dark:text-purple-200 mb-1 flex items-center justify-between">
                    <span>Specify Custom Support Type * (Owner / Admin Custom Entry)</span>
                    <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                      Displays directly on card
                    </span>
                  </label>
                  <input
                    type="text"
                    required={editingProject.supportType === 'other'}
                    value={editingProject.customSupportType || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, customSupportType: e.target.value })}
                    placeholder="Type custom support type (e.g. LED Billboard Truck, Boba Drink Station, Hand Fans)..."
                    className="w-full rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              )}

              {/* Event Link & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Associated Calendar Event
                  </label>
                  <input
                    type="text"
                    value={editingProject.eventName || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, eventName: e.target.value })}
                    placeholder="e.g. MEDIHEAL Fanmeet"
                    list="available-events-list"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none"
                  />
                  <datalist id="available-events-list">
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.title} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Event Date
                  </label>
                  <input
                    type="date"
                    value={editingProject.eventDate || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, eventDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Financial Goal, Raised & Selectable Currency List */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Target Goal Amount
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingProject.targetAmount}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, targetAmount: Math.max(1, Number(e.target.value) || 0) })
                    }
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-[#1A3668] dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Current Raised
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingProject.currentAmount}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, currentAmount: Math.max(0, Number(e.target.value) || 0) })
                    }
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-[#1A3668] dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Currency (Select from List) *
                  </label>
                  <select
                    value={
                      POPULAR_CURRENCIES.some((c) => c.code === editingProject.currency)
                        ? editingProject.currency
                        : 'CUSTOM'
                    }
                    onChange={(e) => {
                      if (e.target.value !== 'CUSTOM') {
                        setEditingProject({ ...editingProject, currency: e.target.value });
                      } else {
                        setEditingProject({ ...editingProject, currency: '' });
                      }
                    }}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-xs font-bold text-[#1A3668] dark:text-white focus:outline-none"
                  >
                    {POPULAR_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code} {c.symbol ? `(${c.symbol})` : ''} — {c.name}
                      </option>
                    ))}
                  </select>
                  {(!POPULAR_CURRENCIES.some((c) => c.code === editingProject.currency) ||
                    !editingProject.currency) && (
                    <input
                      type="text"
                      required
                      value={editingProject.currency}
                      onChange={(e) =>
                        setEditingProject({ ...editingProject, currency: e.target.value.toUpperCase() })
                      }
                      placeholder="Type code e.g. CAD, AUD, NZD"
                      className="mt-1.5 w-full rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-[#1A3668] dark:text-white uppercase"
                    />
                  )}
                </div>
              </div>

              {/* Organizer & Donation Link */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Organizer Fan Club *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProject.organizerName}
                    onChange={(e) => setEditingProject({ ...editingProject, organizerName: e.target.value })}
                    placeholder="e.g. JimmySea Thailand & NomNoms PH"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Donation / Form Link
                  </label>
                  <input
                    type="url"
                    value={editingProject.donationUrl || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, donationUrl: e.target.value })}
                    placeholder="https://forms.gle/..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-[#1A3668] dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Description / Menu Concept (Original & English / International Translation) */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Description / Menu Concept (Original) *
                    </label>
                    {editingProject.description && (
                      <button
                        type="button"
                        onClick={() => {
                          const draft = autoTranslateFoodSupportDraft(editingProject.description);
                          setEditingProject({ ...editingProject, translatedDescription: draft });
                          showToast('Generated English draft for Menu Concept!');
                        }}
                        className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Auto-Translate to English</span>
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={2}
                    required
                    value={editingProject.description}
                    onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                    placeholder="Detail the menu, stickers, cup sleeves, food truck wrap design, etc."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-purple-700 dark:text-purple-300 mb-1">
                    🌐 English / International Menu Concept Translation (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={editingProject.translatedDescription || ''}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, translatedDescription: e.target.value })
                    }
                    placeholder="English translation of menu concept for international fans..."
                    className="w-full rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-950/30 px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400 resize-none"
                  />
                </div>
              </div>

              {/* Proof Media (Photos & Videos) */}
              <div className="space-y-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Delivery Proof Media (Photos / Videos)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const newMedia: ProofMedia = {
                        id: `pm-${Date.now()}`,
                        type: 'image',
                        url: '',
                        caption: ''
                      };
                      setEditingProject({
                        ...editingProject,
                        proofMedia: [...editingProject.proofMedia, newMedia]
                      });
                    }}
                    className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                  >
                    + Add Media Photo / Video
                  </button>
                </div>

                {editingProject.proofMedia.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">
                    No proof media attached yet. Add photo URLs or video links once food support has been prepared or delivered!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {editingProject.proofMedia.map((media, mIdx) => (
                      <div key={media.id || mIdx} className="flex items-center gap-2">
                        <select
                          value={media.type}
                          onChange={(e) => {
                            const next = [...editingProject.proofMedia];
                            next[mIdx].type = e.target.value as any;
                            setEditingProject({ ...editingProject, proofMedia: next });
                          }}
                          className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs font-bold text-[#1A3668] dark:text-white"
                        >
                          <option value="image">📷 Photo</option>
                          <option value="video">▶️ Video</option>
                        </select>
                        <input
                          type="url"
                          value={media.url}
                          onChange={(e) => {
                            const next = [...editingProject.proofMedia];
                            next[mIdx].url = e.target.value;
                            setEditingProject({ ...editingProject, proofMedia: next });
                          }}
                          placeholder="Image or video URL..."
                          className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-[#1A3668] dark:text-white"
                        />
                        <input
                          type="text"
                          value={media.caption || ''}
                          onChange={(e) => {
                            const next = [...editingProject.proofMedia];
                            next[mIdx].caption = e.target.value;
                            setEditingProject({ ...editingProject, proofMedia: next });
                          }}
                          placeholder="Caption..."
                          className="w-32 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-[#1A3668] dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const next = editingProject.proofMedia.filter((_, idx) => idx !== mIdx);
                            setEditingProject({ ...editingProject, proofMedia: next });
                          }}
                          className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Delivery Notes / Thank You Message (Original & English / International Translation) */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Delivery Notes / Thank You Message (Original)
                    </label>
                    {editingProject.deliveryNotes && (
                      <button
                        type="button"
                        onClick={() => {
                          const draft = autoTranslateFoodSupportDraft(editingProject.deliveryNotes || '');
                          setEditingProject({ ...editingProject, translatedDeliveryNotes: draft });
                          showToast('Generated English draft for Delivery Notes!');
                        }}
                        className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Auto-Translate to English</span>
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={2}
                    value={editingProject.deliveryNotes || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, deliveryNotes: e.target.value })}
                    placeholder="e.g. Delivered successfully! Artists loved the coconut puddings and signed our banner."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-purple-700 dark:text-purple-300 mb-1">
                    🌐 English / International Thank You Message Translation (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={editingProject.translatedDeliveryNotes || ''}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, translatedDeliveryNotes: e.target.value })
                    }
                    placeholder="English translation of delivery update & thank you message..."
                    className="w-full rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-950/30 px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400 resize-none"
                  />
                </div>
              </div>


              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: currentAccent.colorHex }}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-95 cursor-pointer"
                >
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* QUICK DONATION / FUNDS UPDATE MODAL                            */}
      {/* ============================================================== */}
      {donationModalProject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl w-full max-w-md p-5 border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-[#1A3668] dark:text-white mb-1">
              Add Funds to Project
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 truncate">
              {donationModalProject.title}
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Amount to Add ({donationModalProject.currency})
                </label>
                <input
                  type="number"
                  min="1"
                  value={additionalDonationAmount}
                  onChange={(e) => setAdditionalDonationAmount(e.target.value)}
                  placeholder="e.g. 2500"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm font-bold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setDonationModalProject(null)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const add = Number(additionalDonationAmount);
                    if (add > 0) {
                      const updatedAmount = donationModalProject.currentAmount + add;
                      const nextStatus: ProjectStatus =
                        updatedAmount >= donationModalProject.targetAmount && donationModalProject.status === 'open'
                          ? 'reached'
                          : donationModalProject.status;

                      onSaveFoodProject({
                        ...donationModalProject,
                        currentAmount: updatedAmount,
                        status: nextStatus
                      });
                      showToast(`Added ${add.toLocaleString()} ${donationModalProject.currency} to project!`);
                    }
                    setDonationModalProject(null);
                  }}
                  style={{ backgroundColor: currentAccent.colorHex }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-95 cursor-pointer"
                >
                  Add Funds
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MEDIA LIGHTBOX (PROOF PHOTOS & VIDEO CLIPS)                    */}
      {/* ============================================================== */}
      {lightboxMedia && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setLightboxMedia(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxMedia(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 p-1 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="rounded-2xl overflow-hidden bg-slate-900 border border-white/20 shadow-2xl max-h-[80vh] flex items-center justify-center">
              <img
                src={lightboxMedia.url}
                alt={lightboxMedia.caption || 'Proof'}
                className="max-h-[75vh] w-auto object-contain rounded-2xl"
              />
            </div>
            {lightboxMedia.caption && (
              <div className="mt-3 text-center px-4 py-2 rounded-full bg-black/60 text-white text-xs font-semibold backdrop-blur-md">
                {lightboxMedia.caption}
              </div>
            )}
          </div>
        </div>
      )}
      {/* ============================================================== */}
      {/* MODAL: CUSTOMIZE CATEGORY ICONS (OWNER ONLY)                   */}
      {/* ============================================================== */}
      {isIconModalOpen && isOwner && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl w-full max-w-lg p-5 sm:p-6 my-auto max-h-[92vh] overflow-y-auto border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Smile className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#1A3668] dark:text-white">
                    Edit & Choose Category Icons
                  </h3>
                  <p className="text-xs text-slate-400">
                    Owner Settings: Customize icons for filters, pills, and dropdowns
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsIconModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Category 1: Everyone */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1A3668] dark:text-white">
                    🥑 Everyone (Jimmy + Sea + Avocean)
                  </span>
                  <span className="text-sm">{tempCategoryIcons.everyone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tempCategoryIcons.everyone}
                    onChange={(e) =>
                      setTempCategoryIcons({ ...tempCategoryIcons, everyone: e.target.value })
                    }
                    placeholder="e.g. 🥑"
                    className="w-16 text-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-base font-bold text-[#1A3668] dark:text-white"
                  />
                  <div className="flex-1 flex items-center gap-1.5 flex-wrap">
                    {['🥑', '💜', '💚', '🌈', '🌟', '✨', '👑', '🥟', '🍀', '🪐'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() =>
                          setTempCategoryIcons({ ...tempCategoryIcons, everyone: emoji })
                        }
                        className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center cursor-pointer transition-transform hover:scale-115 ${
                          tempCategoryIcons.everyone === emoji
                            ? 'bg-purple-200 dark:bg-purple-900 ring-2 ring-purple-500'
                            : 'bg-white dark:bg-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Category 2: Duo */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1A3668] dark:text-white">
                    🤝 Duo (JimmySea)
                  </span>
                  <span className="text-sm">{tempCategoryIcons.duo}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tempCategoryIcons.duo}
                    onChange={(e) =>
                      setTempCategoryIcons({ ...tempCategoryIcons, duo: e.target.value })
                    }
                    placeholder="e.g. 🤝"
                    className="w-16 text-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-base font-bold text-[#1A3668] dark:text-white"
                  />
                  <div className="flex-1 flex items-center gap-1.5 flex-wrap">
                    {['🤝', '💜💙', '💜', '💙', '🤞', '🫂', '💫', '🪐', '🌙'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setTempCategoryIcons({ ...tempCategoryIcons, duo: emoji })}
                        className={`h-7 px-1.5 rounded-lg text-sm flex items-center justify-center cursor-pointer transition-transform hover:scale-115 ${
                          tempCategoryIcons.duo === emoji
                            ? 'bg-purple-200 dark:bg-purple-900 ring-2 ring-purple-500'
                            : 'bg-white dark:bg-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Category 3: Actor (Solo) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1A3668] dark:text-white">
                    🎭 Actor (Solo)
                  </span>
                  <span className="text-sm">{tempCategoryIcons.actor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tempCategoryIcons.actor}
                    onChange={(e) =>
                      setTempCategoryIcons({ ...tempCategoryIcons, actor: e.target.value })
                    }
                    placeholder="e.g. 🎭"
                    className="w-16 text-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-base font-bold text-[#1A3668] dark:text-white"
                  />
                  <div className="flex-1 flex items-center gap-1.5 flex-wrap">
                    {['🎭', '🎬', '🌟', '⭐', '🎤', '🏆', '💎'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setTempCategoryIcons({ ...tempCategoryIcons, actor: emoji })}
                        className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center cursor-pointer transition-transform hover:scale-115 ${
                          tempCategoryIcons.actor === emoji
                            ? 'bg-purple-200 dark:bg-purple-900 ring-2 ring-purple-500'
                            : 'bg-white dark:bg-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Category 4: Actor — Jimmy */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1A3668] dark:text-white">
                    🩺 Actor — Jimmy Jitaraphol
                  </span>
                  <span className="text-sm">{tempCategoryIcons.jimmy}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tempCategoryIcons.jimmy}
                    onChange={(e) =>
                      setTempCategoryIcons({ ...tempCategoryIcons, jimmy: e.target.value })
                    }
                    placeholder="e.g. 🩺"
                    className="w-16 text-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-base font-bold text-[#1A3668] dark:text-white"
                  />
                  <div className="flex-1 flex items-center gap-1.5 flex-wrap">
                    {['🩺', '🦊', '💜', '💊', '👨‍⚕️', '👑', '🏥'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setTempCategoryIcons({ ...tempCategoryIcons, jimmy: emoji })}
                        className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center cursor-pointer transition-transform hover:scale-115 ${
                          tempCategoryIcons.jimmy === emoji
                            ? 'bg-purple-200 dark:bg-purple-900 ring-2 ring-purple-500'
                            : 'bg-white dark:bg-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Category 5: Actor — Sea */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1A3668] dark:text-white">
                    🌊 Actor — Sea Tawinan
                  </span>
                  <span className="text-sm">{tempCategoryIcons.sea}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tempCategoryIcons.sea}
                    onChange={(e) =>
                      setTempCategoryIcons({ ...tempCategoryIcons, sea: e.target.value })
                    }
                    placeholder="e.g. 🌊"
                    className="w-16 text-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-base font-bold text-[#1A3668] dark:text-white"
                  />
                  <div className="flex-1 flex items-center gap-1.5 flex-wrap">
                    {['🌊', '💙', '🏸', '🏄', '🐬', '🏖️', '🫧'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setTempCategoryIcons({ ...tempCategoryIcons, sea: emoji })}
                        className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center cursor-pointer transition-transform hover:scale-115 ${
                          tempCategoryIcons.sea === emoji
                            ? 'bg-purple-200 dark:bg-purple-900 ring-2 ring-purple-500'
                            : 'bg-white dark:bg-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Preview of Badges */}
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 space-y-1.5">
                <span className="block text-[11px] font-bold text-slate-500">Live Preview:</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase text-white bg-gradient-to-r from-purple-600 via-sky-500 to-emerald-500 shadow-xs">
                    <span>{tempCategoryIcons.everyone || '🥑'}</span>
                    <span>EVERYONE</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-500 shadow-xs">
                    <span>{tempCategoryIcons.duo || '🤝'}</span>
                    <span>DUO</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-100 text-indigo-700">
                    <span>{tempCategoryIcons.actor || '🎭'}</span>
                    <span>ACTOR</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-100 text-purple-700">
                    <span>{tempCategoryIcons.jimmy || '🩺'}</span>
                    <span>JIMMY</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-sky-100 text-sky-700">
                    <span>{tempCategoryIcons.sea || '🌊'}</span>
                    <span>SEA</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={resetCategoryIcons}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-500 cursor-pointer"
                >
                  Reset Defaults
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsIconModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => saveCategoryIcons(tempCategoryIcons)}
                    style={{ backgroundColor: currentAccent.colorHex }}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-95 cursor-pointer"
                  >
                    Save Category Icons
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

