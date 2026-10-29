import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  increment,
  getDocFromServer
} from 'firebase/firestore';
import { db } from './firebase';
import type { ScheduleEvent, AppSettings, FanMessage } from '../App';

// Connection test as required by Firebase integration guidelines
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is running in offline mode or network is unreachable.');
    }
  }
}

export interface LiveStats {
  liveViewers: number;
  todayVisits: number;
  totalVisits: number;
}

// Generate persistent device visitor ID (shared across multiple tabs on same device)
const VISITOR_ID = (() => {
  try {
    let vid = localStorage.getItem('avocean_visitor_device_id_v2');
    if (!vid) {
      vid = `fan_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('avocean_visitor_device_id_v2', vid);
    }
    return vid;
  } catch {
    return `fan_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
})();

// Helper to get local YYYY-MM-DD
const getLocalDateKey = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * 1. LIVE ONLINE PRESENCE & DAILY REFRESHING VISITS TRACKING
 * - Online: Real active heartbeat within 35 seconds (1 count per unique device).
 * - Visits: Tracks visits for TODAY that automatically refreshes each day at midnight.
 */
export function startLivePresenceTracking(
  onStatsUpdate: (stats: LiveStats) => void
) {
  let isCleanedUp = false;
  const todayKey = getLocalDateKey();

  // A. Register visit for TODAY once per device per day
  try {
    const lastCountedDate = localStorage.getItem('avocean_visit_date_v2');
    if (lastCountedDate !== todayKey) {
      localStorage.setItem('avocean_visit_date_v2', todayKey);
      const statsDocRef = doc(db, 'stats', 'global');
      getDoc(statsDocRef)
        .then((snap) => {
          const data = snap.exists() ? snap.data() : null;
          const isSameDay = data && data.currentDate === todayKey;
          if (isSameDay) {
            setDoc(
              statsDocRef,
              {
                todayVisits: increment(1),
                totalVisits: increment(1),
                currentDate: todayKey,
                lastUpdated: new Date().toISOString()
              },
              { merge: true }
            ).catch(() => {});
          } else {
            // New day rollover: Start todayVisits at 1 for the new day
            setDoc(
              statsDocRef,
              {
                todayVisits: 1,
                totalVisits: increment(1),
                currentDate: todayKey,
                lastUpdated: new Date().toISOString()
              },
              { merge: true }
            ).catch(() => {});
          }
        })
        .catch((err) => console.warn('Could not update daily visit counter:', err));
    }
  } catch (err) {
    console.warn('Session visit check error:', err);
  }

  // B. Heartbeat function to maintain presence in Firestore
  const sendHeartbeat = async () => {
    if (isCleanedUp) return;
    try {
      const presenceRef = doc(db, 'presence', VISITOR_ID);
      await setDoc(
        presenceRef,
        {
          visitorId: VISITOR_ID,
          lastSeen: Date.now()
        },
        { merge: true }
      );
    } catch {
      // Ignore transient network errors
    }
  };

  // Immediate heartbeat on mount
  sendHeartbeat();
  const heartbeatInterval = setInterval(sendHeartbeat, 15000); // Heartbeat every 15s

  // Clean up presence on tab close or navigation
  const cleanupPresence = () => {
    try {
      const presenceRef = doc(db, 'presence', VISITOR_ID);
      deleteDoc(presenceRef).catch(() => {});
    } catch {}
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      cleanupPresence();
    } else {
      sendHeartbeat();
    }
  };

  window.addEventListener('beforeunload', cleanupPresence);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // C. Listen to live stats (real active presence + daily visits)
  let unsubscribePresence: (() => void) | null = null;
  let unsubscribeStats: (() => void) | null = null;

  let currentLiveCount = 1;
  let currentTodayVisits = 1;
  let currentTotalVisits = 28;

  try {
    const statsDocRef = doc(db, 'stats', 'global');
    unsubscribeStats = onSnapshot(statsDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const currentTodayKey = getLocalDateKey();
        const isToday = data.currentDate === currentTodayKey;
        currentTodayVisits = isToday && typeof data.todayVisits === 'number' ? Math.max(1, data.todayVisits) : 1;
        currentTotalVisits = typeof data.totalVisits === 'number' ? Math.max(1, data.totalVisits) : currentTodayVisits;
        onStatsUpdate({
          liveViewers: currentLiveCount,
          todayVisits: currentTodayVisits,
          totalVisits: currentTotalVisits
        });
      }
    });

    const presenceColRef = collection(db, 'presence');
    unsubscribePresence = onSnapshot(presenceColRef, (snapshot) => {
      const now = Date.now();
      const cutoff = now - 35000; // Active within last 35 seconds
      let activeCount = 0;
      const staleIds: string[] = [];

      snapshot.forEach((d) => {
        const data = d.data();
        if (data.lastSeen && data.lastSeen > cutoff) {
          activeCount++;
        } else if (data.lastSeen && data.lastSeen < now - 90000) {
          staleIds.push(d.id);
        }
      });

      // Prune stale presence records older than 90 seconds
      if (staleIds.length > 0) {
        staleIds.slice(0, 5).forEach((id) => {
          deleteDoc(doc(db, 'presence', id)).catch(() => {});
        });
      }

      currentLiveCount = Math.max(1, activeCount);
      onStatsUpdate({
        liveViewers: currentLiveCount,
        todayVisits: currentTodayVisits,
        totalVisits: currentTotalVisits
      });
    });
  } catch (err) {
    console.warn('Real-time stats listener error:', err);
  }

  return () => {
    isCleanedUp = true;
    clearInterval(heartbeatInterval);
    window.removeEventListener('beforeunload', cleanupPresence);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    cleanupPresence();
    if (unsubscribePresence) unsubscribePresence();
    if (unsubscribeStats) unsubscribeStats();
  };
}

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
 * Pure real-time listener. Never injects sample events over user database edits.
 * All additions, edits, and deletions made directly on the website persist 100%.
 */
export function subscribeToEvents(
  _initialSampleEvents: ScheduleEvent[],
  onUpdate: (events: ScheduleEvent[]) => void
) {
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
    },
    (error) => {
      console.warn('Events real-time listener error:', error);
    }
  );

  return unsubscribe;
}

export async function saveEventToFirestore(ev: ScheduleEvent): Promise<void> {
  const eventRef = doc(db, 'events', ev.id);
  const clean = sanitizeForFirestore({
    ...ev,
    updatedAt: new Date().toISOString()
  });
  await setDoc(eventRef, clean);
}

export async function deleteEventFromFirestore(eventId: string): Promise<void> {
  const eventRef = doc(db, 'events', eventId);
  await deleteDoc(eventRef);
}

/**
 * 3. REAL-TIME HUB SETTINGS & BANNER SYNC
 */
export function subscribeToSettings(
  defaultSettings: AppSettings,
  onUpdate: (settings: AppSettings) => void
) {
  const settingsDocRef = doc(db, 'settings', 'global');

  // Check if settings exist, seed if not
  getDoc(settingsDocRef)
    .then((snap) => {
      if (!snap.exists()) {
        setDoc(settingsDocRef, {
          ...defaultSettings,
          updatedAt: new Date().toISOString()
        }).catch(() => {});
      }
    })
    .catch((err) => console.warn('Could not check settings doc:', err));

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
    (err) => console.warn('Settings real-time listener error:', err)
  );

  return unsubscribe;
}

export async function saveSettingsToFirestore(settings: AppSettings): Promise<void> {
  const settingsDocRef = doc(db, 'settings', 'global');
  const clean = sanitizeForFirestore({
    ...settings,
    updatedAt: new Date().toISOString()
  });
  await setDoc(settingsDocRef, clean, { merge: true });
}

/**
 * 4. REAL-TIME FAN MESSAGES SYNC
 */
export function subscribeToFanMessages(onUpdate: (messages: FanMessage[]) => void) {
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
    (err) => console.warn('Fan messages listener error:', err)
  );

  return unsubscribe;
}

export async function sendFanMessageToFirestore(msg: FanMessage): Promise<void> {
  const msgRef = doc(db, 'fan_messages', msg.id);
  const clean = sanitizeForFirestore(msg);
  await setDoc(msgRef, clean);
}

export async function updateFanMessageInFirestore(id: string, updates: Partial<FanMessage>): Promise<void> {
  const msgRef = doc(db, 'fan_messages', id);
  const clean = sanitizeForFirestore(updates);
  await updateDoc(msgRef, clean);
}

export async function deleteFanMessageFromFirestore(id: string): Promise<void> {
  const msgRef = doc(db, 'fan_messages', id);
  await deleteDoc(msgRef);
}
