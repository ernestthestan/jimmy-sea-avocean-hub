import React from 'react';
import { Check } from 'lucide-react';

export interface PopularHashtagItem {
  tag: string;
  category: 'jimmy' | 'sea' | 'avocean' | 'general';
  desc: string;
}

export const POPULAR_HASHTAGS: PopularHashtagItem[] = [
  { tag: '#jimmyyjp', category: 'jimmy', desc: 'Jimmy Jitaraphol (Official X/IG)' },
  { tag: '#Tiny', category: 'jimmy', desc: 'Jimmy Fandom' },
  { tag: '#Sea_tawinan', category: 'sea', desc: 'Sea Tawinan (Official X/IG)' },
  { tag: '#ChaoTalay', category: 'sea', desc: 'Sea Fandom (English)' },
  { tag: '#ชาวทะเล', category: 'sea', desc: 'Sea Fandom (Thai)' },
  { tag: '#AVOCEAN', category: 'avocean', desc: 'JimmySea Official Fandom' },
  { tag: '#JimmySea', category: 'avocean', desc: 'Jimmy & Sea Duo' },
  { tag: '#จิมมี่ซี', category: 'avocean', desc: 'JimmySea (Thai)' },
  { tag: '#GMMTV', category: 'general', desc: 'GMMTV Official Agency' }
];

export interface OfficialHashtagPickerProps {
  value: string;
  onChange: (val: string) => void;
  onShowToast?: (msg: string) => void;
  title?: string;
  placeholder?: string;
  className?: string;
}

export const OfficialHashtagPicker: React.FC<OfficialHashtagPickerProps> = ({
  value = '',
  onChange,
  onShowToast,
  title = 'Official Hashtags',
  placeholder = 'e.g. #jimmyyjp #Tiny #Sea_tawinan #ChaoTalay #ชาวทะเล #AVOCEAN',
  className = ''
}) => {
  // Helper for checking if hashtag is currently present
  const hasHashtag = (currentText: string, tag: string): boolean => {
    if (!currentText || !tag) return false;
    const cleanTag = tag.trim().toLowerCase();
    const words = currentText.split(/[\s,]+/).map((w) => w.toLowerCase());
    return words.includes(cleanTag);
  };

  // Helper for toggling a hashtag in the input
  const handleToggleHashtag = (tag: string) => {
    const cleanTag = tag.trim();
    const words = (value || '').trim().split(/[\s,]+/).filter(Boolean);
    const exists = words.some((w) => w.toLowerCase() === cleanTag.toLowerCase());

    if (exists) {
      const next = words.filter((w) => w.toLowerCase() !== cleanTag.toLowerCase()).join(' ');
      onChange(next);
    } else {
      const next = [...words, cleanTag].join(' ');
      onChange(next);
    }
  };

  const handleAddAllTags = () => {
    const requested = ['#jimmyyjp', '#Tiny', '#Sea_tawinan', '#ChaoTalay', '#ชาวทะเล', '#AVOCEAN'];
    const words = (value || '').trim().split(/[\s,]+/).filter(Boolean);
    requested.forEach((tag) => {
      if (!words.some((w) => w.toLowerCase() === tag.toLowerCase())) {
        words.push(tag);
      }
    });
    onChange(words.join(' '));
    if (onShowToast) {
      onShowToast('Added popular JimmySea hashtags!');
    }
  };

  const tagCount = (value || '').split(/[\s,]+/).filter(Boolean).length;

  return (
    <div
      className={`space-y-2.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 ${className}`}
    >
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          <label className="block text-xs font-bold text-[#1A3668] dark:text-white">
            {title}
          </label>
          <span className="text-[11px] font-semibold text-slate-400">
            (Click pills to toggle or type custom tags)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleAddAllTags}
            className="text-[10.5px] font-bold px-2.5 py-1 rounded-lg bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/70 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 transition-colors cursor-pointer shadow-2xs"
            title="Add all popular fan hashtags at once"
          >
            + Add All JimmySea Tags
          </button>
          {value.trim() && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="text-[10.5px] font-bold text-rose-500 hover:text-rose-700 underline cursor-pointer px-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Quick Add Hashtag Pills */}
      <div className="space-y-1.5 pt-0.5">
        <div className="flex items-center justify-between text-[10.5px] font-bold text-slate-400 flex-wrap gap-1">
          <span>Quick add usually used tags:</span>
          <span className="text-[10px] text-purple-600 dark:text-purple-400">
            🥑 Jimmy: #jimmyyjp #Tiny · 🌊 Sea: #Sea_tawinan #ChaoTalay #ชาวทะเล · 💚 #AVOCEAN
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_HASHTAGS.map((item) => {
            const isSelected = hasHashtag(value, item.tag);

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
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm font-semibold text-[#1A3668] dark:text-white focus:outline-none focus:border-purple-400 placeholder:text-slate-400 resize-y leading-relaxed font-sans"
        />
        <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 pt-1 font-medium">
          <span>Space or comma-separated hashtags</span>
          <span>{tagCount} {tagCount === 1 ? 'tag' : 'tags'} added</span>
        </div>
      </div>
    </div>
  );
};
