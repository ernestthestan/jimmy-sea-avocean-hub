import React, { useState } from 'react';
import { Copy, CheckCircle2, Check, Hash } from 'lucide-react';

export interface HashtagsDisplayCardProps {
  hashtags?: string | string[];
  showToast: (msg: string) => void;
  accentColor?: string;
  className?: string;
}

export const HashtagsDisplayCard: React.FC<HashtagsDisplayCardProps> = ({
  hashtags,
  showToast,
  accentColor = '#7C3AED',
  className = ''
}) => {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedSingleTag, setCopiedSingleTag] = useState<string | null>(null);

  if (!hashtags) return null;

  const tagList = Array.isArray(hashtags)
    ? hashtags.filter(Boolean)
    : hashtags.split(/[\s,]+/).filter(Boolean);

  if (tagList.length === 0) return null;

  const allTagsString = tagList
    .map((t) => (t.startsWith('#') ? t : `#${t}`))
    .join(' ');

  const handleCopyAll = () => {
    navigator.clipboard.writeText(allTagsString);
    setCopiedAll(true);
    showToast('Copied all hashtags to clipboard!');
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleCopySingle = (rawTag: string) => {
    const cleanTag = rawTag.startsWith('#') ? rawTag : `#${rawTag}`;
    navigator.clipboard.writeText(cleanTag);
    setCopiedSingleTag(cleanTag);
    showToast(`Copied ${cleanTag}!`);
    setTimeout(() => setCopiedSingleTag(null), 2000);
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
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
          onClick={handleCopyAll}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-slate-200 dark:border-slate-600 text-xs font-bold text-[#1A3668] dark:text-white shrink-0 transition-all cursor-pointer shadow-2xs hover:border-purple-300"
          title="Copy all hashtags to clipboard"
        >
          {copiedAll ? (
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
            const isCopied = copiedSingleTag === cleanTag;
            return (
              <button
                key={tIdx}
                type="button"
                onClick={() => handleCopySingle(tag)}
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
};
