import React, { useEffect } from 'react';

let openModalCount = 0;

/**
 * Ref-counted body lock & GPU animation pause while any modal is open.
 * Prevents background 60 FPS animations (`animate-pulse`, `animate-bounce`)
 * and background scrolling from consuming GPU/compositor bandwidth while
 * editing forms or viewing modals.
 */
export function useModalPerformanceLock(isOpen: boolean): void {
  useEffect(() => {
    if (!isOpen) return;
    openModalCount += 1;
    if (openModalCount === 1 && typeof document !== 'undefined') {
      document.body.classList.add('avocean-modal-open');
    }
    return () => {
      openModalCount = Math.max(0, openModalCount - 1);
      if (openModalCount === 0 && typeof document !== 'undefined') {
        document.body.classList.remove('avocean-modal-open');
      }
    };
  }, [isOpen]);
}

interface FreezeWhileModalOpenProps {
  frozen: boolean;
  children: React.ReactNode;
}

/**
 * Skips re-rendering the heavy background page tree (calendar grid, cards,
 * base64 images) on every single keystroke while a modal form is open.
 * Preserves DOM and scroll position with zero flicker, and resumes live
 * updates immediately when the modal closes.
 */
export const FreezeWhileModalOpen = React.memo<FreezeWhileModalOpenProps>(
  ({ children }) => <>{children}</>,
  (prev, next) => prev.frozen && next.frozen
);
