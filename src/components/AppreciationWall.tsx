import React, { useState, useMemo } from 'react';
import {
  Heart,
  Search,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Trash2,
  Inbox,
  Filter,
  ArrowUpDown,
  Send,
  CheckCircle2,
  Plus,
  Languages,
  Loader2,
  RotateCcw,
  Copy,
  ChevronDown,
  Globe
} from 'lucide-react';
import type { FanMessage } from '../App';
import { TRANSLATION_LANGUAGES, translateText } from '../lib/translateService';

export interface AppreciationWallProps {
  messages: FanMessage[];
  allMessages: FanMessage[];
  canEdit: boolean;
  isOwner: boolean;
  currentAccent: {
    id?: string;
    name: string;
    emoji?: string;
    colorHex: string;
    hoverHex?: string;
    lightBg?: string;
    lightText?: string;
    badgeBorder?: string;
    bgClass?: string;
    textClass?: string;
    borderClass?: string;
  };
  containerWidthClass: string;
  onOpenSayThanks: (recipient?: string) => void;
  onToggleApproveForWall: (msg: FanMessage, approve: boolean) => void;
  onDeleteMessage?: (id: string) => void;
  onOpenInbox?: () => void;
  showToast: (msg: string) => void;
}

export const THANKS_RECIPIENTS = [
  { id: 'all', label: 'All Recipients', emoji: '💖' },
  { id: 'JimmySea', label: '🥑🌊 JimmySea', emoji: '🥑🌊' },
  { id: 'Jimmy', label: '🥑 Jimmy', emoji: '🥑' },
  { id: 'Sea', label: '🌊 Sea', emoji: '🌊' },
  { id: 'Avocean', label: '💚 Avocean', emoji: '💚' },
  { id: 'JimmySea Avocean Family', label: '🥑🌊💚 JimmySea Avocean Family', emoji: '🥑🌊💚' },
  { id: 'Admins & Hub Team', label: '🛠️ Admins & Hub Team', emoji: '🛠️' }
] as const;

export const AppreciationWall: React.FC<AppreciationWallProps> = ({
  messages,
  allMessages,
  canEdit,
  isOwner,
  currentAccent,
  containerWidthClass,
  onOpenSayThanks,
  onToggleApproveForWall,
  onDeleteMessage,
  onOpenInbox,
  showToast
}) => {
  const [selectedRecipient, setSelectedRecipient] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Translation State for Appreciation Wall Notes
  const [preferredLang, setPreferredLang] = useState<string>(() => {
    try {
      return localStorage.getItem('avocean_preferred_trans_lang') || 'en';
    } catch {
      return 'en';
    }
  });

  // Card-specific target language override (msgId -> langCode)
  const [cardTargetLangs, setCardTargetLangs] = useState<Record<string, string>>({});

  // Cached translations (msgId -> { [langCode]: string })
  const [translationsCache, setTranslationsCache] = useState<Record<string, Record<string, string>>>(() => {
    try {
      const saved = localStorage.getItem('avocean_wall_translations_cache');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  // Tracking which cards are actively showing translated text vs original
  const [activeTranslationViews, setActiveTranslationViews] = useState<Record<string, boolean>>({});

  // Which note card is currently translating
  const [translatingMsgId, setTranslatingMsgId] = useState<string | null>(null);

  // Copied note ID for feedback
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  // Local likes tracking (stored in localStorage)
  const [cheeredIds, setCheeredIds] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('avocean_wall_cheers');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  const handleCheer = (msgId: string) => {
    setCheeredIds((prev) => {
      const current = prev[msgId] ?? 0;
      const updated = { ...prev, [msgId]: current + 1 };
      try {
        localStorage.setItem('avocean_wall_cheers', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showToast('❤️ Sent love & cheering to this note!');
  };

  // Translation handler for an individual appreciation note
  const handleTranslateMessage = async (msg: FanMessage, targetLang?: string, forceRefresh: boolean = false) => {
    const lang = targetLang || cardTargetLangs[msg.id] || preferredLang;
    if (!msg.message.trim()) return;

    // Check existing translation in cache
    const existing = translationsCache[msg.id]?.[lang];
    if (existing && !forceRefresh) {
      setActiveTranslationViews((prev) => ({ ...prev, [msg.id]: true }));
      return;
    }

    setTranslatingMsgId(msg.id);
    try {
      const translated = await translateText(msg.message, lang);
      setTranslationsCache((prev) => {
        const next = {
          ...prev,
          [msg.id]: {
            ...(prev[msg.id] || {}),
            [lang]: translated
          }
        };
        try {
          localStorage.setItem('avocean_wall_translations_cache', JSON.stringify(next));
        } catch {}
        return next;
      });
      setActiveTranslationViews((prev) => ({ ...prev, [msg.id]: true }));
      const langObj = TRANSLATION_LANGUAGES.find((l) => l.code === lang);
      showToast(forceRefresh ? `Refreshed ${langObj?.name || lang} translation!` : `Translated to ${langObj?.flag || ''} ${langObj?.name || lang}!`);
    } catch (err: any) {
      console.error('Translation error on Appreciation Wall:', err);
      showToast('Could not complete translation. Please try again.');
    } finally {
      setTranslatingMsgId(null);
    }
  };

  const handleToggleTranslationView = (msgId: string) => {
    setActiveTranslationViews((prev) => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const handleCopyNote = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    showToast('Copied note to clipboard!');
    setTimeout(() => {
      setCopiedMsgId((prev) => (prev === msgId ? null : prev));
    }, 2000);
  };

  const pendingCount = useMemo(() => {
    return allMessages.filter((m) => m.category === 'thanks' && !m.approvedForWall).length;
  }, [allMessages]);

  // Filter messages
  const filteredMessages = useMemo(() => {
    let result = messages.filter((m) => m.category === 'thanks' && m.approvedForWall === true);

    if (selectedRecipient !== 'all') {
      result = result.filter((m) => {
        const to = (m.thanksTo || 'JimmySea').toLowerCase();
        const sel = selectedRecipient.toLowerCase();
        if (sel === 'jimmysea') {
          return to.includes('jimmysea') || (to.includes('jimmy') && to.includes('sea'));
        }
        return to.includes(sel) || sel.includes(to);
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (m) =>
          m.senderName.toLowerCase().includes(q) ||
          m.message.toLowerCase().includes(q) ||
          (m.eventTitle && m.eventTitle.toLowerCase().includes(q)) ||
          (m.thanksTo && m.thanksTo.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [messages, selectedRecipient, searchQuery, sortOrder]);

  // Recipient styling badge helper
  const getRecipientBadgeStyle = (recipientStr?: string) => {
    const to = (recipientStr || 'JimmySea').toLowerCase();
    if (to.includes('jimmysea avocean') || to.includes('family')) {
      return {
        label: '🥑🌊💚 JimmySea Avocean Family',
        badgeClass:
          'bg-gradient-to-r from-purple-100 via-sky-100 to-emerald-100 dark:from-purple-950/80 dark:via-sky-950/80 dark:to-emerald-950/80 text-purple-950 dark:text-purple-200 border-purple-300 dark:border-purple-700'
      };
    }
    if (to.includes('jimmysea') || to.includes('jimmy & sea') || (to.includes('jimmy') && to.includes('sea'))) {
      return {
        label: '🥑🌊 JimmySea',
        badgeClass:
          'bg-gradient-to-r from-purple-100 via-indigo-50 to-sky-100 dark:from-purple-950/80 dark:via-indigo-950/80 dark:to-sky-950/80 text-purple-900 dark:text-purple-200 border-purple-300 dark:border-indigo-700'
      };
    }
    if (to.includes('jimmy')) {
      return {
        label: '🥑 Jimmy',
        badgeClass:
          'bg-purple-100 dark:bg-purple-950/80 text-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-800'
      };
    }
    if (to.includes('sea')) {
      return {
        label: '🌊 Sea',
        badgeClass:
          'bg-sky-100 dark:bg-sky-950/80 text-sky-900 dark:text-sky-200 border-sky-200 dark:border-sky-800'
      };
    }
    if (to.includes('admin') || to.includes('team') || to.includes('hub')) {
      return {
        label: '🛠️ Admins & Hub Team',
        badgeClass:
          'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800'
      };
    }
    if (to.includes('avocean')) {
      return {
        label: '💚 Avocean',
        badgeClass:
          'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
      };
    }
    return {
      label: recipientStr || '🥑🌊 JimmySea',
      badgeClass:
        'bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-200 border-rose-200 dark:border-rose-800'
    };
  };

  return (
    <div className={`space-y-6 ${containerWidthClass} mx-auto transition-all`}>
      {/* 1. HERO BANNER */}
      <div className="relative overflow-hidden rounded-[32px] p-6 sm:p-8 bg-gradient-to-br from-rose-500/10 via-purple-500/10 to-sky-500/10 dark:from-rose-950/40 dark:via-purple-950/30 dark:to-sky-950/30 border border-rose-200/80 dark:border-rose-900/60 shadow-sm backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-500 text-white shadow-xs">
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>Avocean Appreciation Wall</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#1A3668] dark:text-white tracking-tight">
              JimmySea & Avocean Appreciation Wall
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-[#526586] dark:text-slate-300 leading-relaxed">
              A heartwarming space of gratitude, love & cheering messages from fans and NomNoms worldwide.
              Feel free to post in your native language—anyone can translate notes into their chosen language with 1 click! 🥑🌊💚
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              onClick={() => onOpenSayThanks()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-black text-white shadow-md bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 hover:opacity-95 active:scale-95 transition-all cursor-pointer"
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>Wanna Say Thanks?</span>
            </button>

            {canEdit && onOpenInbox && (
              <button
                onClick={onOpenInbox}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer active:scale-95 transition-all"
                title="Review new appreciation messages submitted by fans in real time"
              >
                <Inbox className="w-3.5 h-3.5 text-rose-500" />
                <span>Review Pending Notes</span>
                {pendingCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                    {pendingCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. RECIPIENT SELECTOR PILLS */}
      <div className="bg-white/95 dark:bg-slate-900/90 rounded-2xl shadow-xs p-3 border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
            <Filter className="w-3 h-3 text-rose-500" />
            <span>Filter by Recipient</span>
          </span>
          <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full">
            {filteredMessages.length} {filteredMessages.length === 1 ? 'Note' : 'Notes'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {THANKS_RECIPIENTS.map((rec) => {
            const isSel = selectedRecipient === rec.id;
            const count =
              rec.id === 'all'
                ? messages.filter((m) => m.category === 'thanks' && m.approvedForWall === true).length
                : messages.filter(
                    (m) =>
                      m.category === 'thanks' &&
                      m.approvedForWall === true &&
                      (m.thanksTo || 'Jimmy & Sea').toLowerCase().includes(rec.id.toLowerCase())
                  ).length;

            return (
              <button
                key={rec.id}
                onClick={() => setSelectedRecipient(rec.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isSel
                    ? 'bg-rose-500 text-white shadow-xs font-black'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{rec.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isSel ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. SEARCH & CONTROLS TOOLBAR */}
      <div className="bg-white/95 dark:bg-slate-900/90 rounded-2xl shadow-xs px-4 py-2.5 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 rounded-xl px-3 py-1.5 border border-slate-200/70 dark:border-slate-700">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes, message text, or sender handle..."
            className="w-full text-xs font-semibold text-[#1A3668] dark:text-white placeholder-slate-400 focus:outline-none bg-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              ✕
            </button>
          )}
        </div>

        {/* Right Controls: Translate To & Sort */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Target Language Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-400 hidden sm:inline flex items-center gap-1 text-[11px]">
              <Languages className="w-3.5 h-3.5 text-purple-500" />
              <span>Translate:</span>
            </span>
            <div className="relative inline-flex items-center">
              <select
                value={preferredLang}
                onChange={(e) => {
                  const newLang = e.target.value;
                  setPreferredLang(newLang);
                  try {
                    localStorage.setItem('avocean_preferred_trans_lang', newLang);
                  } catch {}
                  const langObj = TRANSLATION_LANGUAGES.find((l) => l.code === newLang);
                  showToast(`Default translation set to ${langObj?.flag || ''} ${langObj?.name || newLang}`);
                }}
                className="text-xs font-bold pl-2.5 pr-6 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[#1A3668] dark:text-white border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-rose-400 appearance-none"
                title="Choose default language for translating appreciation notes"
              >
                {TRANSLATION_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 pointer-events-none" />
            </div>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-rose-500" />
              <span>Sort:</span>
            </span>
            <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700 text-[11px] font-bold">
              <button
                onClick={() => setSortOrder('newest')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  sortOrder === 'newest'
                    ? 'bg-rose-500 text-white shadow-xs font-black'
                    : 'text-slate-600 dark:text-slate-300 hover:text-rose-500'
                }`}
              >
                Newest First
              </button>
              <button
                onClick={() => setSortOrder('oldest')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  sortOrder === 'oldest'
                    ? 'bg-rose-500 text-white shadow-xs font-black'
                    : 'text-slate-600 dark:text-slate-300 hover:text-rose-500'
                }`}
              >
                Oldest First
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. WALL NOTES GRID */}
      {filteredMessages.length === 0 ? (
        <div className="bg-white/95 dark:bg-slate-900/90 rounded-[28px] p-10 sm:p-14 text-center border border-slate-200/80 dark:border-slate-800 flex flex-col items-center justify-center gap-3">
          <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-500 flex items-center justify-center text-3xl shadow-xs">
            💖
          </div>
          <h3 className="text-lg sm:text-xl font-black text-[#1A3668] dark:text-white">
            {messages.filter((m) => m.category === 'thanks' && m.approvedForWall === true).length === 0
              ? 'The Appreciation Wall is Ready for Its First Note!'
              : 'No notes match your filter'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
            {messages.filter((m) => m.category === 'thanks' && m.approvedForWall === true).length === 0
              ? 'When fans say thanks in the "Wanna say thanks" bubble and an admin or owner approves it, the note will be posted here on the wall for everyone to read!'
              : 'Try changing your recipient filter or clearing your search query.'}
          </p>

          <div className="pt-2 flex items-center gap-2 flex-wrap justify-center">
            <button
              onClick={() => onOpenSayThanks()}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold text-white shadow-xs bg-rose-500 hover:bg-rose-600 cursor-pointer active:scale-95 transition-all"
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>Leave a Thank You Note</span>
            </button>

            {canEdit && onOpenInbox && pendingCount > 0 && (
              <button
                onClick={onOpenInbox}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 cursor-pointer transition-all"
              >
                <Inbox className="w-3.5 h-3.5 text-rose-500" />
                <span>Approve Pending Notes ({pendingCount})</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredMessages.map((msg) => {
            const badge = getRecipientBadgeStyle(msg.thanksTo);
            const cheers = (cheeredIds[msg.id] ?? 0);
            const targetLang = cardTargetLangs[msg.id] || preferredLang;
            const targetLangObj = TRANSLATION_LANGUAGES.find((l) => l.code === targetLang);
            const cachedTranslation = translationsCache[msg.id]?.[targetLang];
            const isShowingTranslated = Boolean(activeTranslationViews[msg.id] && cachedTranslation);
            const isTranslating = translatingMsgId === msg.id;
            const displayText = isShowingTranslated ? cachedTranslation : msg.message;

            return (
              <div
                key={msg.id}
                className="bg-white/95 dark:bg-slate-900/90 rounded-[24px] border border-rose-100 dark:border-slate-800 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Decorative Top Ambient Bar */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400" />

                <div className="space-y-3">
                  {/* Card Header: Recipient Badge & Date */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-black border shadow-2xs ${badge.badgeClass}`}
                    >
                      {badge.label}
                    </span>

                    <span className="text-[10px] font-bold text-slate-400">
                      {new Date(msg.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>

                  {/* Title / Topic (If provided) */}
                  {msg.eventTitle && !msg.eventTitle.startsWith('💖 Thank You & Love') && (
                    <h4 className="text-sm font-extrabold text-[#1A3668] dark:text-white leading-snug">
                      {msg.eventTitle}
                    </h4>
                  )}

                  {/* Message Content Bubble */}
                  <div className="relative p-3.5 rounded-2xl bg-gradient-to-br from-rose-50/70 via-pink-50/50 to-purple-50/50 dark:from-rose-950/30 dark:via-pink-950/20 dark:to-purple-950/30 border border-rose-100/80 dark:border-rose-900/40">
                    <span className="absolute -top-2 left-3 text-2xl text-rose-300 dark:text-rose-700 select-none font-serif leading-none">
                      “
                    </span>
                    <p className="text-xs sm:text-[13px] text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line font-medium pt-1">
                      {displayText}
                    </p>

                    {/* Translated Status Pill & Quick Toggle */}
                    {isShowingTranslated && (
                      <div className="mt-2.5 pt-2 border-t border-purple-200/50 dark:border-purple-800/40 flex items-center justify-between text-[10.5px] text-purple-700 dark:text-purple-300 font-bold">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-purple-500" />
                          <span>Translated to {targetLangObj?.flag} {targetLangObj?.name}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleTranslationView(msg.id)}
                          className="text-purple-600 dark:text-purple-400 hover:underline cursor-pointer font-bold"
                          title="View note in original language"
                        >
                          View Original
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Note Translation Action Bar */}
                  <div className="flex items-center justify-between gap-1.5 pt-0.5 text-xs flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Language Dropdown for this note */}
                      <div className="relative inline-flex items-center">
                        <select
                          value={targetLang}
                          onChange={(e) => {
                            const newLang = e.target.value;
                            setCardTargetLangs((prev) => ({ ...prev, [msg.id]: newLang }));
                            if (activeTranslationViews[msg.id]) {
                              handleTranslateMessage(msg, newLang);
                            }
                          }}
                          className="text-[11px] font-bold pl-2 pr-5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer focus:outline-none appearance-none"
                          title="Select target language for translation"
                        >
                          {TRANSLATION_LANGUAGES.map((l) => (
                            <option key={l.code} value={l.code}>
                              {l.flag} {l.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-2.5 h-2.5 text-slate-400 absolute right-1.5 pointer-events-none" />
                      </div>

                      {/* Translate / Toggle Button */}
                      {cachedTranslation ? (
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleTranslationView(msg.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 transition-colors cursor-pointer"
                            title={isShowingTranslated ? "Show original native text" : `Show ${targetLangObj?.name} translation`}
                          >
                            <Languages className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                            <span>{isShowingTranslated ? 'Show Original' : 'Show Translation'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTranslateMessage(msg, targetLang, true)}
                            disabled={isTranslating}
                            className="p-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-purple-600 border border-slate-200 dark:border-slate-700 cursor-pointer disabled:opacity-50"
                            title="Re-translate note"
                          >
                            <RotateCcw className={`w-3 h-3 ${isTranslating ? 'animate-spin text-purple-600' : ''}`} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleTranslateMessage(msg, targetLang)}
                          disabled={isTranslating}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold bg-gradient-to-r from-purple-600 to-rose-500 hover:opacity-95 text-white shadow-2xs transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                          title={`Translate this note to ${targetLangObj?.name || 'chosen language'}`}
                        >
                          {isTranslating ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
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
                    </div>

                    {/* Copy note text button */}
                    <button
                      type="button"
                      onClick={() => handleCopyNote(msg.id, displayText)}
                      className="p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors"
                      title="Copy note text to clipboard"
                    >
                      {copiedMsgId === msg.id ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Card Footer: Sender, Link, Cheer Button & Admin Unpost */}
                <div className="pt-3.5 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                      💌
                    </div>
                    <span className="font-bold text-[#1A3668] dark:text-white truncate text-xs">
                      {msg.senderName}
                    </span>

                    {msg.sourceUrl && (
                      <a
                        href={msg.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 dark:text-purple-400 hover:text-purple-700 underline inline-flex items-center gap-0.5 font-bold text-[11px] shrink-0 ml-1"
                        title="View attached tweet / fan art"
                      >
                        <span>Link</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Cheer Button */}
                    <button
                      type="button"
                      onClick={() => handleCheer(msg.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-all active:scale-95 cursor-pointer"
                      title="Cheer for this note!"
                    >
                      <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                      <span>{cheers > 0 ? cheers : 'Cheer'}</span>
                    </button>

                    {/* Admin Unpost Quick Action */}
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => onToggleApproveForWall(msg, false)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
                        title="Remove note from Appreciation Wall"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span className="hidden sm:inline">Unpost</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
