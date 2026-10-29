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

// Generate persistent session ID for live presence heartbeats
const SESSION_ID = (() => {
  try {
    let sid = sessionStorage.getItem('avocean_presence_session_id');
    if (!sid) {
      sid = `fan_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem('avocean_presence_session_id', sid);
    }
    return sid;
  } catch {
    return `fan_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
})();

/**
 * 1. LIVE ONLINE PRESENCE & REAL TOTAL VISITS TRACKING
 */
export function startLivePresenceTracking(
  onStatsUpdate: (stats: { liveViewers: number; totalVisits: number }) => void
) {
  let isCleanedUp = false;

  // A. Register visit count once per browser session
  try {
    const hasCountedSession = sessionStorage.getItem('avocean_visit_counted');
    if (!hasCountedSession) {
      sessionStorage.setItem('avocean_visit_counted', 'true');
      const statsDocRef = doc(db, 'stats', 'global');
      setDoc(
        statsDocRef,
        {
          totalVisits: increment(1),
          lastUpdated: new Date().toISOString()
        },
        { merge: true }
      ).catch((err) => console.warn('Could not increment global visit counter:', err));
    }
  } catch (err) {
    console.warn('Session visit check error:', err);
  }

  // B. Heartbeat function to maintain presence in Firestore
  const sendHeartbeat = async () => {
    if (isCleanedUp) return;
    try {
      const presenceRef = doc(db, 'presence', SESSION_ID);
      await setDoc(
        presenceRef,
        {
          sessionId: SESSION_ID,
          lastSeen: Date.now()
        },
        { merge: true }
      );
    } catch (err) {
      // Ignore transient network errors
    }
  };

  // Immediate heartbeat on mount
  sendHeartbeat();
  const heartbeatInterval = setInterval(sendHeartbeat, 20000); // every 20 seconds

  // Clean up presence on tab close/unload
  const cleanupPresence = () => {
    try {
      const presenceRef = doc(db, 'presence', SESSION_ID);
      deleteDoc(presenceRef).catch(() => {});
    } catch {}
  };
  window.addEventListener('beforeunload', cleanupPresence);

  // C. Listen to live stats (real active presence sessions in the last 45 seconds + total visits)
  let unsubscribePresence: (() => void) | null = null;
  let unsubscribeStats: (() => void) | null = null;

  let currentLiveCount = 1;
  let currentTotalVisits = 4821;

  try {
    const statsDocRef = doc(db, 'stats', 'global');
    unsubscribeStats = onSnapshot(statsDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (typeof data.totalVisits === 'number') {
          currentTotalVisits = Math.max(data.totalVisits, 1);
          onStatsUpdate({ liveViewers: currentLiveCount, totalVisits: currentTotalVisits });
        }
      }
    });

    const presenceColRef = collection(db, 'presence');
    unsubscribePresence = onSnapshot(presenceColRef, (snapshot) => {
      const now = Date.now();
      const cutoff = now - 45000; // active within last 45s
      let activeCount = 0;
      snapshot.forEach((d) => {
        const data = d.data();
        if (data.lastSeen && data.lastSeen > cutoff) {
          activeCount++;
        }
      });
      // Ensure at least 1 (the current viewer)
      currentLiveCount = Math.max(1, activeCount);
      onStatsUpdate({ liveViewers: currentLiveCount, totalVisits: currentTotalVisits });
    });
  } catch (err) {
    console.warn('Real-time stats listener error:', err);
  }

  return () => {
    isCleanedUp = true;
    clearInterval(heartbeatInterval);
    window.removeEventListener('beforeunload', cleanupPresence);
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
 */
export function subscribeToEvents(
  initialSampleEvents: ScheduleEvent[],
  onUpdate: (events: ScheduleEvent[]) => void
) {
  const eventsCol = collection(db, 'events');
  const metaDocRef = doc(db, 'settings', 'events_meta');

  // Check if events have ever been initialized.
  // Once initialized, an empty events list is a valid user choice and NEVER gets re-seeded.
  getDoc(metaDocRef)
    .then(async (metaSnap) => {
      if (!metaSnap.exists()) {
        try {
          const eventsSnap = await getDocs(eventsCol);
          if (eventsSnap.empty && initialSampleEvents.length > 0) {
            for (const ev of initialSampleEvents) {
              const clean = sanitizeForFirestore(ev);
              await setDoc(doc(db, 'events', ev.id), clean).catch(() => {});
            }
          }
          await setDoc(metaDocRef, {
            seeded: true,
            initializedAt: new Date().toISOString()
          }).catch(() => {});
        } catch (e) {
          console.warn('Events initialization error:', e);
        }
      }
    })
    .catch((err) => console.warn('Could not check events meta doc:', err));

  const unsubscribe = onSnapshot(
    eventsCol,
    (snapshot) => {
      const loaded: ScheduleEvent[] = [];
      snapshot.forEach((docSnap) => {
        loaded.push(docSnap.data() as ScheduleEvent);
      });
      // Sort chronologically by date
      loaded.sort((a, b) => a.date.localeCompare(b.date));
      // Notify listeners even when loaded is empty (e.g. user deleted all events)
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
