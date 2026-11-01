import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  increment,
  getDocFromServer
} from 'firebase/firestore';
import { db } from './firebase';
import type { ScheduleEvent, AppSettings, FanMessage } from '../App';

// Global Quota Exceeded state & listener registry
let isQuotaExceeded = false;
let quotaExceededListeners: Array<(isExceeded: boolean) => void> = [];

export function getIsQuotaExceeded(): boolean {
  return isQuotaExceeded;
}

export function onQuotaExceededChange(listener: (isExceeded: boolean) => void) {
  quotaExceededListeners.push(listener);
  listener(isQuotaExceeded);
  return () => {
    quotaExceededListeners = quotaExceededListeners.filter((l) => l !== listener);
  };
}

export function notifyQuotaExceeded() {
  if (!isQuotaExceeded) {
    isQuotaExceeded = true;
    console.warn('Firestore Quota Exceeded (Free tier daily read/write limit reached). App seamlessly switching to Local Storage mode.');
    quotaExceededListeners.forEach((l) => l(true));
  }
}

// Connection test as required by Firebase integration guidelines
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota limit exceeded')) {
      notifyQuotaExceeded();
    } else if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is running in offline mode or network is unreachable.');
    }
  }
}

export interface LiveStats {
  todayVisits: number;
  totalVisits: number;
  liveViewers?: number;
}

// Helper to get local YYYY-MM-DD
const getLocalDateKey = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * DAILY REFRESHING VISITS TRACKING
 * - Registers a visit once per device per calendar day in stats/global
 * - Automatically rolls over each day at midnight
 * - Completely eliminates heartbeats and online presence writes to preserve quota
 */
export function startDailyVisitsTracking(
  onStatsUpdate: (stats: LiveStats) => void
) {
  let unsubscribeStats: (() => void) | null = null;
  const todayKey = getLocalDateKey();

  // Initial stats from localStorage
  let currentTodayVisits = 1;
  let currentTotalVisits = 28;

  try {
    const saved = localStorage.getItem('avocean_visitor_stats_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed) {
        currentTodayVisits = typeof parsed.todayVisits === 'number' ? parsed.todayVisits : 1;
        currentTotalVisits = typeof parsed.totalVisits === 'number' ? parsed.totalVisits : 28;
      }
    }
  } catch {}

  onStatsUpdate({
    todayVisits: currentTodayVisits,
    totalVisits: currentTotalVisits
  });

  if (isQuotaExceeded) {
    return () => {};
  }

  // Register visit for TODAY once per device per day
  try {
    const lastCountedDate = localStorage.getItem('avocean_visit_date_v2');
    if (lastCountedDate !== todayKey) {
      localStorage.setItem('avocean_visit_date_v2', todayKey);
      const statsDocRef = doc(db, 'stats', 'global');
      getDoc(statsDocRef)
        .then((snap) => {
          const data = snap.exists() ? snap.data() : null;
          const isSameDay = data && data.currentDate === todayKey;
          const updatePayload = isSameDay
            ? {
                todayVisits: increment(1),
                totalVisits: increment(1),
                currentDate: todayKey,
                lastUpdated: new Date().toISOString()
              }
            : {
                todayVisits: 1,
                totalVisits: increment(1),
                currentDate: todayKey,
                lastUpdated: new Date().toISOString()
              };

          setDoc(statsDocRef, updatePayload, { merge: true }).catch((err: any) => {
            if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
              notifyQuotaExceeded();
            }
          });
        })
        .catch((err: any) => {
          if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
            notifyQuotaExceeded();
          } else {
            console.warn('Could not update daily visit counter:', err);
          }
        });
    }
  } catch (err) {
    console.warn('Session visit check error:', err);
  }

  // Listen to stats doc with safe error handler
  try {
    const statsDocRef = doc(db, 'stats', 'global');
    unsubscribeStats = onSnapshot(
      statsDocRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const currentTodayKey = getLocalDateKey();
          const isToday = data.currentDate === currentTodayKey;
          currentTodayVisits = isToday && typeof data.todayVisits === 'number' ? Math.max(1, data.todayVisits) : 1;
          currentTotalVisits = typeof data.totalVisits === 'number' ? Math.max(1, data.totalVisits) : currentTodayVisits;
          onStatsUpdate({
            todayVisits: currentTodayVisits,
            totalVisits: currentTotalVisits
          });
        }
      },
      (error: any) => {
        if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota limit exceeded')) {
          notifyQuotaExceeded();
        } else {
          console.warn('Stats real-time listener error:', error);
        }
      }
    );
  } catch (err: any) {
    if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
      notifyQuotaExceeded();
    }
  }

  return () => {
    if (unsubscribeStats) unsubscribeStats();
  };
}

// Backward compatibility alias
export const startLivePresenceTracking = startDailyVisitsTracking;

/**
 * Deeply sanitizes objects before sending to Firestore by removing any undefined keys
 * which cause Firestore setDoc/updateDoc to throw "Unsupported field value: undefined" errors.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as any;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        clean[key] = sanitizeForFirestore(value);
      }
    }
    return clean as any;
  }
  return data;
}

/**
 * 2. REAL-TIME CALENDAR EVENTS SYNC
 * Pure real-time listener with graceful local storage fallback when cloud quota is exhausted.
 */
export function subscribeToEvents(
  initialSampleEvents: ScheduleEvent[],
  onUpdate: (events: ScheduleEvent[]) => void
) {
  // If quota was already exceeded, deliver from localStorage immediately
  if (isQuotaExceeded) {
    try {
      const saved = localStorage.getItem('avocean_schedule_events_v2');
      if (saved) {
        onUpdate(JSON.parse(saved));
        return () => {};
      }
    } catch {}
    onUpdate(initialSampleEvents);
    return () => {};
  }

  const eventsCol = collection(db, 'events');

  const unsubscribe = onSnapshot(
    eventsCol,
    (snapshot) => {
      const loaded: ScheduleEvent[] = [];
      snapshot.forEach((docSnap) => {
        loaded.push(docSnap.data() as ScheduleEvent);
      });
      // Sort chronologically by date
      loaded.sort((a, b) => a.date.localeCompare(b.date));
      // Notify listeners with current database state
      onUpdate(loaded);
      try {
        localStorage.setItem('avocean_schedule_events_v2', JSON.stringify(loaded));
      } catch {}
    },
    (error: any) => {
      if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota limit exceeded')) {
        notifyQuotaExceeded();
        // Fall back gracefully to localStorage
        try {
          const saved = localStorage.getItem('avocean_schedule_events_v2');
          if (saved) {
            onUpdate(JSON.parse(saved));
            return;
          }
        } catch {}
        onUpdate(initialSampleEvents);
      } else {
        console.warn('Events real-time listener error:', error);
      }
    }
  );

  return unsubscribe;
}

export async function saveEventToFirestore(ev: ScheduleEvent): Promise<void> {
  if (isQuotaExceeded) {
    console.warn('Firestore quota exceeded. Event saved to local storage.');
    return;
  }

  try {
    const eventRef = doc(db, 'events', ev.id);
    const clean = sanitizeForFirestore({
      ...ev,
      updatedAt: new Date().toISOString()
    });

    // Guard against Firestore 1MiB document limit
    const serialized = JSON.stringify(clean);
    if (serialized.length > 950 * 1024) {
      throw new Error('Event data (including poster image) exceeds 950KB cloud document limit. Please use a compressed photo or web link.');
    }

    await setDoc(eventRef, clean);
  } catch (error: any) {
    if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota limit exceeded')) {
      notifyQuotaExceeded();
      console.warn('Firestore quota exceeded during saveEvent. Event preserved in local storage.');
      return; // Do not throw so local state continues to save
    }
    throw error;
  }
}

export async function deleteEventFromFirestore(eventId: string): Promise<void> {
  if (isQuotaExceeded) {
    console.warn('Firestore quota exceeded. Event deleted from local storage.');
    return;
  }

  try {
    const eventRef = doc(db, 'events', eventId);
    await deleteDoc(eventRef);
  } catch (error: any) {
    if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota limit exceeded')) {
      notifyQuotaExceeded();
      return;
    }
    throw error;
  }
}

/**
 * 3. REAL-TIME HUB SETTINGS & BANNER SYNC
 */
export function subscribeToSettings(
  defaultSettings: AppSettings,
  onUpdate: (settings: AppSettings) => void
) {
  if (isQuotaExceeded) {
    onUpdate(defaultSettings);
    return () => {};
  }

  const settingsDocRef = doc(db, 'settings', 'global');

  // Check if settings exist, seed if not
  getDoc(settingsDocRef)
    .then((snap) => {
      if (!snap.exists()) {
        setDoc(settingsDocRef, {
          ...defaultSettings,
          updatedAt: new Date().toISOString()
        }).catch((err: any) => {
          if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
            notifyQuotaExceeded();
          }
        });
      }
    })
    .catch((err: any) => {
      if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
        notifyQuotaExceeded();
      } else {
        console.warn('Could not check settings doc:', err);
      }
    });

  const unsubscribe = onSnapshot(
    settingsDocRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Partial<AppSettings>;
        onUpdate({
          ...defaultSettings,
          ...data,
          members: data.members || defaultSettings.members
        });
      }
    },
    (err: any) => {
      if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
        notifyQuotaExceeded();
      } else {
        console.warn('Settings real-time listener error:', err);
      }
    }
  );

  return unsubscribe;
}

export async function saveSettingsToFirestore(settings: AppSettings): Promise<void> {
  if (isQuotaExceeded) {
    console.warn('Firestore quota exceeded. Settings saved locally.');
    return;
  }

  try {
    const settingsDocRef = doc(db, 'settings', 'global');
    const clean = sanitizeForFirestore({
      ...settings,
      updatedAt: new Date().toISOString()
    });
    await setDoc(settingsDocRef, clean, { merge: true });
  } catch (error: any) {
    if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota limit exceeded')) {
      notifyQuotaExceeded();
      return;
    }
    throw error;
  }
}

/**
 * 4. REAL-TIME FAN MESSAGES SYNC
 */
export function subscribeToFanMessages(onUpdate: (messages: FanMessage[]) => void) {
  if (isQuotaExceeded) {
    return () => {};
  }

  const messagesCol = collection(db, 'fan_messages');

  const unsubscribe = onSnapshot(
    messagesCol,
    (snapshot) => {
      const msgs: FanMessage[] = [];
      snapshot.forEach((d) => {
        msgs.push(d.data() as FanMessage);
      });
      // Sort newest first
      msgs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      onUpdate(msgs);
    },
    (err: any) => {
      if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
        notifyQuotaExceeded();
      } else {
        console.warn('Fan messages listener error:', err);
      }
    }
  );

  return unsubscribe;
}

export async function sendFanMessageToFirestore(msg: FanMessage): Promise<void> {
  if (isQuotaExceeded) {
    throw new Error('Cloud messaging is temporarily paused due to free quota limit. Please try again tomorrow.');
  }
  const msgRef = doc(db, 'fan_messages', msg.id);
  const clean = sanitizeForFirestore(msg);
  await setDoc(msgRef, clean);
}

export async function updateFanMessageInFirestore(id: string, updates: Partial<FanMessage>): Promise<void> {
  if (isQuotaExceeded) return;
  const msgRef = doc(db, 'fan_messages', id);
  const clean = sanitizeForFirestore(updates);
  await updateDoc(msgRef, clean);
}

export async function deleteFanMessageFromFirestore(id: string): Promise<void> {
  if (isQuotaExceeded) return;
  try {
    const msgRef = doc(db, 'fan_messages', id);
    await deleteDoc(msgRef);
  } catch (error: any) {
    if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota limit exceeded')) {
      notifyQuotaExceeded();
    }
  }
}
