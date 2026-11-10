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
import type { FanClub, FoodSupportProject } from '../types/fanhub';
import type { CareerProject, ActorProfile } from '../types/projects';
import { getProjectChronologicalScore } from '../types/projects';

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

/**
 * Helper to get Philippine Time YYYY-MM-DD (Asia/Manila, UTC+8)
 * Resets precisely at 12:00 Midnight Philippine Time (00:00 PHT).
 */
export const getPhilippineDateKey = (): string => {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date());
  } catch {
    const now = new Date();
    // UTC+8 offset for Philippine Time
    const phTime = new Date(now.getTime() + (8 * 60 + now.getTimezoneOffset()) * 60000);
    const y = phTime.getFullYear();
    const m = String(phTime.getMonth() + 1).padStart(2, '0');
    const d = String(phTime.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
};

// Backwards-compatible alias
export const getBangkokDateKey = getPhilippineDateKey;

/**
 * DAILY REFRESHING VISITS TRACKING
 * - Standardized on Philippine Time (Asia/Manila, UTC+8)
 * - Automatically resets today's visit count at 12:00 Midnight Philippine Time
 * - Registers visit once per device per PH calendar day in stats/global
 * - Guarantees phone, laptop, and desktop see the exact same count
 */
export function startDailyVisitsTracking(
  onStatsUpdate: (stats: LiveStats) => void
) {
  let unsubscribeStats: (() => void) | null = null;
  let activeTodayKey = getPhilippineDateKey();

  // Initial stats from localStorage
  let currentTodayVisits = 1;
  let currentTotalVisits = 28;

  try {
    const saved = localStorage.getItem('avocean_visitor_stats_v3');
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

  // Register visit for TODAY once per device per Philippine calendar day
  const recordVisitForToday = (key: string) => {
    try {
      const lastCountedDate = localStorage.getItem('avocean_visit_date_ph_v1');
      if (lastCountedDate !== key) {
        localStorage.setItem('avocean_visit_date_ph_v1', key);
        const statsDocRef = doc(db, 'stats', 'global');
        getDoc(statsDocRef)
          .then((snap) => {
            const data = snap.exists() ? snap.data() : null;
            const isSameDay = data && data.currentDate === key;
            const updatePayload = isSameDay
              ? {
                  todayVisits: increment(1),
                  totalVisits: increment(1),
                  currentDate: key,
                  lastUpdated: new Date().toISOString()
                }
              : {
                  todayVisits: 1,
                  totalVisits: increment(1),
                  currentDate: key,
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
  };

  recordVisitForToday(activeTodayKey);

  // Periodic check for 12:00 Midnight Philippine Time rollover
  const midnightCheckInterval = setInterval(() => {
    const freshKey = getPhilippineDateKey();
    if (freshKey !== activeTodayKey) {
      activeTodayKey = freshKey;
      recordVisitForToday(freshKey);
    }
  }, 30000);

  // Listen to stats doc with safe error handler
  try {
    const statsDocRef = doc(db, 'stats', 'global');
    unsubscribeStats = onSnapshot(
      statsDocRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const currentTodayKey = getPhilippineDateKey();
          const isToday = data.currentDate === currentTodayKey;
          currentTodayVisits = isToday && typeof data.todayVisits === 'number' ? Math.max(1, data.todayVisits) : 1;
          currentTotalVisits = typeof data.totalVisits === 'number' ? Math.max(1, data.totalVisits) : currentTodayVisits;
          onStatsUpdate({
            todayVisits: currentTodayVisits,
            totalVisits: currentTotalVisits
          });
          try {
            localStorage.setItem('avocean_visitor_stats_v3', JSON.stringify({
              todayVisits: currentTodayVisits,
              totalVisits: currentTotalVisits
            }));
          } catch {}
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
    clearInterval(midnightCheckInterval);
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
      // Notify listeners with live database state directly
      onUpdate(loaded);
    },
    (error: any) => {
      console.warn('Events real-time listener error:', error);
      if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota limit exceeded')) {
        notifyQuotaExceeded();
      }
    }
  );

  return unsubscribe;
}

export async function saveEventToFirestore(ev: ScheduleEvent): Promise<void> {
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

    await setDoc(eventRef, clean, { merge: true });
    console.log(`[Firestore] Event "${ev.title}" (${ev.id}) saved to Cloud Firestore successfully.`);
  } catch (error: any) {
    if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota limit exceeded')) {
      notifyQuotaExceeded();
    }
    console.error('[Firestore] Error saving event to cloud:', error);
    throw error;
  }
}

export async function updateEventPosterFitInFirestore(eventId: string, fit: 'contain' | 'cover'): Promise<void> {
  try {
    const eventRef = doc(db, 'events', eventId);
    await updateDoc(eventRef, {
      posterFit: fit,
      updatedAt: new Date().toISOString()
    });
    console.log(`[Firestore] Event (${eventId}) posterFit updated to "${fit}" in cloud.`);
  } catch (error: any) {
    console.error('[Firestore] Error updating poster fit in cloud:', error);
    throw error;
  }
}

export async function deleteEventFromFirestore(eventId: string): Promise<void> {
  try {
    const eventRef = doc(db, 'events', eventId);
    await deleteDoc(eventRef);
    console.log(`[Firestore] Event (${eventId}) deleted from Cloud Firestore.`);
  } catch (error: any) {
    if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota limit exceeded')) {
      notifyQuotaExceeded();
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
export function subscribeToFanMessages(
  initialSampleMessages: FanMessage[],
  onUpdate: (messages: FanMessage[]) => void
) {
  if (isQuotaExceeded) {
    try {
      const isInit = localStorage.getItem('avocean_inbox_initialized') === 'true';
      const saved = localStorage.getItem('avocean_fan_messages_v1');
      if (saved !== null) {
        onUpdate(JSON.parse(saved));
        return () => {};
      }
      if (isInit) {
        onUpdate([]);
        return () => {};
      }
    } catch {}
    onUpdate(initialSampleMessages);
    return () => {};
  }

  const messagesCol = collection(db, 'fan_messages');

  const unsubscribe = onSnapshot(
    messagesCol,
    async (snapshot) => {
      const msgs: FanMessage[] = [];
      snapshot.forEach((d) => {
        if (d.id !== 'test-msg-1793660834733') {
          msgs.push(d.data() as FanMessage);
        }
      });
      // Sort newest first
      msgs.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

      if (snapshot.empty || msgs.length === 0) {
        onUpdate([]);
        try {
          localStorage.setItem('avocean_fan_messages_v1', '[]');
          localStorage.setItem('avocean_inbox_initialized', 'true');
        } catch {}
      } else {
        onUpdate(msgs);
        try {
          localStorage.setItem('avocean_fan_messages_v1', JSON.stringify(msgs));
          localStorage.setItem('avocean_inbox_initialized', 'true');
        } catch {}
      }
    },
    (err: any) => {
      if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
        notifyQuotaExceeded();
        try {
          const saved = localStorage.getItem('avocean_fan_messages_v1');
          if (saved !== null) {
            onUpdate(JSON.parse(saved));
            return;
          }
        } catch {}
      } else {
        console.warn('Fan messages listener error:', err);
      }
    }
  );

  return unsubscribe;
}

export async function fetchFanMessagesFromFirestore(): Promise<FanMessage[]> {
  if (isQuotaExceeded) {
    try {
      const saved = localStorage.getItem('avocean_fan_messages_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  try {
    const messagesCol = collection(db, 'fan_messages');
    const snapshot = await getDocs(messagesCol);
    const msgs: FanMessage[] = [];
    snapshot.forEach((d) => {
      if (d.id !== 'test-msg-1793660834733') {
        msgs.push(d.data() as FanMessage);
      }
    });
    msgs.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    try {
      localStorage.setItem('avocean_fan_messages_v1', JSON.stringify(msgs));
    } catch {}
    return msgs;
  } catch (err: any) {
    if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
      notifyQuotaExceeded();
    } else {
      console.warn('Direct fetch fan messages error:', err);
    }
    return [];
  }
}

export async function sendFanMessageToFirestore(msg: FanMessage): Promise<void> {
  if (msg.id === 'test-msg-1793660834733') return;
  if (isQuotaExceeded) {
    throw new Error('Cloud messaging is temporarily paused due to free quota limit. Please try again tomorrow.');
  }
  try {
    localStorage.setItem('avocean_inbox_initialized', 'true');
    await setDoc(doc(db, 'settings', 'inbox_meta'), { initialized: true }, { merge: true });
  } catch {}
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
  try {
    localStorage.setItem('avocean_inbox_initialized', 'true');
    const local = localStorage.getItem('avocean_fan_messages_v1');
    if (local) {
      const parsed: FanMessage[] = JSON.parse(local);
      localStorage.setItem('avocean_fan_messages_v1', JSON.stringify(parsed.filter((m) => m.id !== id)));
    }
  } catch {}
  if (isQuotaExceeded) return;
  try {
    await setDoc(doc(db, 'settings', 'inbox_meta'), { initialized: true }, { merge: true });
    const msgRef = doc(db, 'fan_messages', id);
    await deleteDoc(msgRef);
  } catch (error: any) {
    if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota limit exceeded')) {
      notifyQuotaExceeded();
    }
  }
}

/**
 * 5. REAL-TIME FAN CLUBS DIRECTORY SYNC
 */
export function subscribeToFanClubs(
  initialSampleClubs: FanClub[],
  onUpdate: (clubs: FanClub[]) => void
) {
  const clubsCol = collection(db, 'fan_clubs');
  const unsubscribe = onSnapshot(
    clubsCol,
    (snapshot) => {
      const loaded: FanClub[] = [];
      snapshot.forEach((d) => {
        const club = d.data() as FanClub;
        if (club && club.name) {
          loaded.push(club);
        }
      });
      onUpdate(loaded);
    },
    (err: any) => {
      console.warn('Fan clubs listener error:', err);
      if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
        notifyQuotaExceeded();
      }
    }
  );

  return unsubscribe;
}

export async function saveFanClubToFirestore(club: FanClub): Promise<void> {
  try {
    if (!isQuotaExceeded) {
      await setDoc(doc(db, 'settings', 'fanhub_meta'), { initialized: true }, { merge: true });
      await setDoc(doc(db, 'fan_clubs', club.id), sanitizeForFirestore(club));
    }
  } catch (err: any) {
    if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
      notifyQuotaExceeded();
    }
  }
}

export async function deleteFanClubFromFirestore(clubId: string): Promise<void> {
  try {
    if (!isQuotaExceeded) {
      await setDoc(doc(db, 'settings', 'fanhub_meta'), { initialized: true }, { merge: true });
      await deleteDoc(doc(db, 'fan_clubs', clubId));
    }
  } catch (err: any) {
    if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
      notifyQuotaExceeded();
    }
  }
}

/**
 * 6. REAL-TIME FOOD SUPPORT PROJECTS SYNC
 */
export function subscribeToFoodProjects(
  initialSampleProjects: FoodSupportProject[],
  onUpdate: (projects: FoodSupportProject[]) => void
) {
  const projectsCol = collection(db, 'food_projects');
  const unsubscribe = onSnapshot(
    projectsCol,
    (snapshot) => {
      const loaded: FoodSupportProject[] = [];
      snapshot.forEach((d) => {
        const p = d.data() as FoodSupportProject;
        if (p && p.title) {
          loaded.push(p);
        }
      });
      onUpdate(loaded);
    },
    (err: any) => {
      console.warn('Food projects listener error:', err);
      if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
        notifyQuotaExceeded();
      }
    }
  );

  return unsubscribe;
}

export async function saveFoodProjectToFirestore(project: FoodSupportProject): Promise<void> {
  try {
    if (!isQuotaExceeded) {
      await setDoc(doc(db, 'settings', 'fanhub_meta'), { initialized: true }, { merge: true });
      await setDoc(doc(db, 'food_projects', project.id), sanitizeForFirestore(project));
    }
  } catch (err: any) {
    if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
      notifyQuotaExceeded();
    }
  }
}

export async function deleteFoodProjectFromFirestore(projectId: string): Promise<void> {
  try {
    if (!isQuotaExceeded) {
      await setDoc(doc(db, 'settings', 'fanhub_meta'), { initialized: true }, { merge: true });
      await deleteDoc(doc(db, 'food_projects', projectId));
    }
  } catch (err: any) {
    if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
      notifyQuotaExceeded();
    }
  }
}

/**
 * 7. ADMIN & OWNER ACCOUNTS MANAGEMENT (Email + Password)
 * Stored in Firestore in collection 'admin_accounts'
 */
export type AdminCategory = 'general' | 'fanclub';

export interface AdminAccount {
  id: string; // Normalized email
  email: string;
  role: 'owner' | 'admin';
  adminCategory?: AdminCategory; // 'general': Calendar, Career Projects, Messages; 'fanclub': Assigned Fan Club & Events only
  assignedClubId?: string; // ID of specific fan club if adminCategory === 'fanclub'
  assignedClubName?: string; // Display name of specific fan club
  assignedClubIds?: string[]; // IDs of multiple fan clubs handled by this admin
  assignedClubNames?: string[]; // Names of multiple fan clubs handled by this admin
  assignedFoodProjectId?: string; // ID of specific food support project if applicable
  assignedFoodProjectTitle?: string; // Title of food support project
  status?: 'approved' | 'pending' | 'rejected';
  password: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  lastLoginAt?: string;
}

export const normalizeAccountEmail = (email: string): string => {
  const clean = email.trim().toLowerCase();
  if (clean === 'ernestthestan' || clean === 'ernest') {
    return 'ernestthestan@gmail.com';
  }
  return clean;
};

export const DEFAULT_ACCOUNTS: Record<string, AdminAccount> = {
  'ernestthestan@gmail.com': {
    id: 'ernestthestan@gmail.com',
    email: 'ernestthestan@gmail.com',
    role: 'owner',
    adminCategory: 'general',
    status: 'approved',
    password: 'ErnestTheStan05!',
    displayName: 'Ernest (Hub Owner)',
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z'
  }
};

/**
 * Seed default Owner account in Firestore if not yet present
 */
export async function ensureDefaultAdminAccounts(): Promise<void> {
  if (isQuotaExceeded) return;
  try {
    // Delete legacy sample admin account from Firestore if present
    try {
      const sampleAdminRef = doc(db, 'admin_accounts', 'admin@avocean.hub');
      await deleteDoc(sampleAdminRef);
      localStorage.removeItem('avocean_pwd_admin@avocean.hub');
    } catch {}

    for (const [normEmail, acc] of Object.entries(DEFAULT_ACCOUNTS)) {
      const accRef = doc(db, 'admin_accounts', normEmail);
      const snap = await getDoc(accRef).catch(() => null);
      if (!snap || !snap.exists()) {
        await setDoc(accRef, sanitizeForFirestore(acc));
      }
    }
  } catch (err) {
    console.warn('Could not seed default admin accounts:', err);
  }
}

/**
 * Register a new Admin account using their own email, name, chosen password, and assigned scope.
 * Account starts in 'pending' status until explicitly approved by the Hub Owner.
 */
export async function registerAdminAccount(
  rawEmail: string,
  rawPass: string,
  rawDisplayName: string,
  authPasscode?: string,
  adminCategory: AdminCategory = 'general',
  assignedClubId?: string,
  assignedClubName?: string,
  assignedFoodProjectId?: string,
  assignedFoodProjectTitle?: string,
  assignedClubIds?: string[],
  assignedClubNames?: string[]
): Promise<{ success: boolean; account?: AdminAccount; error?: string }> {
  const email = normalizeAccountEmail(rawEmail);
  const pass = rawPass.trim();
  const displayName = rawDisplayName.trim() || email.split('@')[0];

  if (!email || !email.includes('@') || !email.includes('.')) {
    return { success: false, error: 'Please enter a valid email address.' };
  }
  if (!pass || pass.length < 6) {
    return { success: false, error: 'Password / passcode must be at least 6 characters.' };
  }

  // Authorization check: Must provide the private Admin Access Code (Default: Avocean2026!)
  const validSecret = 'Avocean2026!';
  const enteredSecret = (authPasscode || '').trim();
  if (!enteredSecret) {
    return { success: false, error: 'Please enter the private Admin Authorization Code provided by the Hub Owner.' };
  }

  let storedAdminPin = '';
  try {
    const savedSettings = localStorage.getItem('avocean_app_settings_v3');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      storedAdminPin = parsed.adminPin;
    }
  } catch {}

  const isValidSecret =
    enteredSecret === validSecret ||
    enteredSecret === 'Avocean2026' || // backwards-compatibility
    (storedAdminPin && enteredSecret === storedAdminPin);

  if (!isValidSecret) {
    return { success: false, error: 'Incorrect Admin Authorization Code. Please check the code given to you by the Hub Owner.' };
  }

  // Prevent hijacking owner email
  if (email === 'ernestthestan@gmail.com') {
    return { success: false, error: 'This email is reserved for Hub Owner. Please log in as Owner.' };
  }

  // Check if account already exists in Firestore
  try {
    if (!isQuotaExceeded) {
      const accRef = doc(db, 'admin_accounts', email);
      const snap = await getDoc(accRef);
      if (snap.exists()) {
        const existingData = snap.data() as AdminAccount;
        if (existingData.status === 'pending') {
          return { success: false, error: 'You already submitted an admin request with this email. It is currently awaiting Owner approval.' };
        }
        return { success: false, error: 'An account with this email already exists. Please log in directly.' };
      }
    }
  } catch (err) {
    console.warn('Account check error:', err);
  }

  const nowIso = new Date().toISOString();
  const clubIds = assignedClubIds && assignedClubIds.length > 0 ? assignedClubIds : assignedClubId ? [assignedClubId] : [];
  const clubNames = assignedClubNames && assignedClubNames.length > 0 ? assignedClubNames : assignedClubName ? [assignedClubName] : [];

  const newAccount: AdminAccount = {
    id: email,
    email,
    role: 'admin',
    adminCategory,
    assignedClubId: clubIds[0] || undefined,
    assignedClubName: clubNames.join(', ') || undefined,
    assignedClubIds: clubIds.length > 0 ? clubIds : undefined,
    assignedClubNames: clubNames.length > 0 ? clubNames : undefined,
    assignedFoodProjectId: assignedFoodProjectId || undefined,
    assignedFoodProjectTitle: assignedFoodProjectTitle || undefined,
    status: 'pending', // Requires Owner Approval!
    password: pass,
    displayName,
    createdAt: nowIso,
    updatedAt: nowIso
  };

  // Save to Firestore
  try {
    if (!isQuotaExceeded) {
      const accRef = doc(db, 'admin_accounts', email);
      await setDoc(accRef, sanitizeForFirestore(newAccount));
    }
  } catch (err: any) {
    if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
      notifyQuotaExceeded();
    } else {
      console.warn('Could not save new admin account to Firestore:', err);
    }
  }

  // Save credentials for local fallback
  try {
    localStorage.setItem(`avocean_pwd_${email}`, pass);
  } catch {}

  // Record audit log entry
  const scopeDetail =
    adminCategory === 'fanclub'
      ? `Fan Club Admin (Assigned: ${clubNames.join(', ') || 'Fan Club'})`
      : 'General Admin (Calendar, Career Projects, Messages)';

  await recordAuditLog({
    userEmail: email,
    role: 'admin',
    actionType: 'create_admin',
    details: `New admin request submitted (pending Owner approval): "${displayName}" (${email}) - ${scopeDetail}`
  });

  return { success: true, account: newAccount };
}

/**
 * Approve a pending Admin account (Owner only) with optional category/scope adjustment
 */
export async function approveAdminAccount(
  rawEmail: string,
  ownerEmail: string,
  overrides?: {
    adminCategory?: AdminCategory;
    assignedClubId?: string;
    assignedClubName?: string;
    assignedClubIds?: string[];
    assignedClubNames?: string[];
    assignedFoodProjectId?: string;
    assignedFoodProjectTitle?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const email = normalizeAccountEmail(rawEmail);
  const nowIso = new Date().toISOString();

  try {
    if (!isQuotaExceeded) {
      const accRef = doc(db, 'admin_accounts', email);
      const updateData: Record<string, any> = {
        status: 'approved',
        approvedAt: nowIso,
        approvedBy: ownerEmail,
        updatedAt: nowIso
      };

      if (overrides) {
        if (overrides.adminCategory !== undefined) updateData.adminCategory = overrides.adminCategory;
        if (overrides.assignedClubId !== undefined) updateData.assignedClubId = overrides.assignedClubId;
        if (overrides.assignedClubName !== undefined) updateData.assignedClubName = overrides.assignedClubName;
        if (overrides.assignedClubIds !== undefined) updateData.assignedClubIds = overrides.assignedClubIds;
        if (overrides.assignedClubNames !== undefined) updateData.assignedClubNames = overrides.assignedClubNames;
        if (overrides.assignedFoodProjectId !== undefined) updateData.assignedFoodProjectId = overrides.assignedFoodProjectId;
        if (overrides.assignedFoodProjectTitle !== undefined) updateData.assignedFoodProjectTitle = overrides.assignedFoodProjectTitle;
      }

      await updateDoc(accRef, updateData);
    }
  } catch (err: any) {
    console.warn('Could not approve admin account in Firestore:', err);
    return { success: false, error: err?.message || 'Could not approve account' };
  }

  await recordAuditLog({
    userEmail: ownerEmail,
    role: 'owner',
    actionType: 'approve_admin',
    details: `Owner approved admin account: ${email}${overrides?.adminCategory ? ` (${overrides.adminCategory})` : ''}`
  });

  return { success: true };
}

/**
 * Update an existing admin's category, assigned fan club or display details (Owner only)
 */
export async function updateAdminAccountScope(
  rawEmail: string,
  ownerEmail: string,
  updates: {
    adminCategory: AdminCategory;
    assignedClubId?: string;
    assignedClubName?: string;
    assignedClubIds?: string[];
    assignedClubNames?: string[];
    assignedFoodProjectId?: string;
    assignedFoodProjectTitle?: string;
    displayName?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const email = normalizeAccountEmail(rawEmail);
  const nowIso = new Date().toISOString();

  if (email === 'ernestthestan@gmail.com') {
    return { success: false, error: 'Cannot modify scope of the Hub Owner account.' };
  }

  try {
    if (!isQuotaExceeded) {
      const accRef = doc(db, 'admin_accounts', email);
      const updatePayload: Record<string, any> = {
        adminCategory: updates.adminCategory,
        assignedClubId: updates.adminCategory === 'fanclub' ? (updates.assignedClubId || '') : '',
        assignedClubName: updates.adminCategory === 'fanclub' ? (updates.assignedClubName || '') : '',
        assignedClubIds: updates.adminCategory === 'fanclub' ? (updates.assignedClubIds || []) : [],
        assignedClubNames: updates.adminCategory === 'fanclub' ? (updates.assignedClubNames || []) : [],
        assignedFoodProjectId: updates.adminCategory === 'fanclub' ? (updates.assignedFoodProjectId || '') : '',
        assignedFoodProjectTitle: updates.adminCategory === 'fanclub' ? (updates.assignedFoodProjectTitle || '') : '',
        updatedAt: nowIso
      };
      if (updates.displayName) {
        updatePayload.displayName = updates.displayName.trim();
      }

      await updateDoc(accRef, updatePayload);
    }
  } catch (err: any) {
    console.warn('Could not update admin scope in Firestore:', err);
    return { success: false, error: err?.message || 'Could not update admin account scope' };
  }

  await recordAuditLog({
    userEmail: ownerEmail,
    role: 'owner',
    actionType: 'settings_update',
    details: `Owner updated admin scope for ${email}: Category=${updates.adminCategory}, Clubs=${updates.assignedClubNames?.join(', ') || updates.assignedClubName || 'None'}`
  });

  return { success: true };
}

/**
 * Create an admin account directly by the Owner (pre-approved, bypassing registration request)
 */
export async function createAdminAccountDirectly(
  accountData: {
    email: string;
    password: string;
    displayName: string;
    adminCategory: AdminCategory;
    assignedClubId?: string;
    assignedClubName?: string;
    assignedClubIds?: string[];
    assignedClubNames?: string[];
    assignedFoodProjectId?: string;
    assignedFoodProjectTitle?: string;
  },
  ownerEmail: string
): Promise<{ success: boolean; account?: AdminAccount; error?: string }> {
  const email = normalizeAccountEmail(accountData.email);
  const pass = accountData.password.trim();
  const displayName = accountData.displayName.trim() || email.split('@')[0];

  if (!email || !email.includes('@') || !email.includes('.')) {
    return { success: false, error: 'Please enter a valid email address.' };
  }
  if (!pass || pass.length < 6) {
    return { success: false, error: 'Password / passcode must be at least 6 characters.' };
  }
  if (email === 'ernestthestan@gmail.com') {
    return { success: false, error: 'This email is reserved for Hub Owner.' };
  }

  const nowIso = new Date().toISOString();
  const newAccount: AdminAccount = {
    id: email,
    email,
    role: 'admin',
    adminCategory: accountData.adminCategory,
    assignedClubId: accountData.assignedClubId || undefined,
    assignedClubName: accountData.assignedClubName || undefined,
    assignedClubIds: accountData.assignedClubIds && accountData.assignedClubIds.length > 0 ? accountData.assignedClubIds : undefined,
    assignedClubNames: accountData.assignedClubNames && accountData.assignedClubNames.length > 0 ? accountData.assignedClubNames : undefined,
    assignedFoodProjectId: accountData.assignedFoodProjectId || undefined,
    assignedFoodProjectTitle: accountData.assignedFoodProjectTitle || undefined,
    status: 'approved',
    password: pass,
    displayName,
    createdAt: nowIso,
    updatedAt: nowIso,
    approvedAt: nowIso,
    approvedBy: ownerEmail
  };

  try {
    if (!isQuotaExceeded) {
      const accRef = doc(db, 'admin_accounts', email);
      await setDoc(accRef, sanitizeForFirestore(newAccount));
    }
  } catch (err: any) {
    console.warn('Could not save direct admin account:', err);
    return { success: false, error: err?.message || 'Could not save account to Firestore' };
  }

  try {
    localStorage.setItem(`avocean_pwd_${email}`, pass);
  } catch {}

  await recordAuditLog({
    userEmail: ownerEmail,
    role: 'owner',
    actionType: 'create_admin',
    details: `Owner directly created approved admin account: "${displayName}" (${email}) - ${accountData.adminCategory}`
  });

  return { success: true, account: newAccount };
}

/**
 * Reject / Decline a pending Admin account (Owner only)
 */
export async function rejectAdminAccount(
  rawEmail: string,
  ownerEmail: string
): Promise<{ success: boolean; error?: string }> {
  const email = normalizeAccountEmail(rawEmail);
  const nowIso = new Date().toISOString();

  try {
    if (!isQuotaExceeded) {
      const accRef = doc(db, 'admin_accounts', email);
      await updateDoc(accRef, {
        status: 'rejected',
        updatedAt: nowIso
      });
    }
  } catch (err: any) {
    console.warn('Could not reject admin account in Firestore:', err);
    return { success: false, error: err?.message || 'Could not decline request' };
  }

  await recordAuditLog({
    userEmail: ownerEmail,
    role: 'owner',
    actionType: 'reject_admin',
    details: `Owner declined admin request: ${email}`
  });

  return { success: true };
}

/**
 * Delete / Revoke an Admin account (Owner only)
 */
export async function deleteAdminAccount(
  rawEmail: string,
  performedByEmail: string
): Promise<{ success: boolean; error?: string }> {
  const email = normalizeAccountEmail(rawEmail);
  if (email === 'ernestthestan@gmail.com') {
    return { success: false, error: 'Cannot delete the Owner account.' };
  }

  try {
    if (!isQuotaExceeded) {
      await deleteDoc(doc(db, 'admin_accounts', email));
    }
    localStorage.removeItem(`avocean_pwd_${email}`);
  } catch (err) {
    console.warn('Could not delete admin account from Firestore:', err);
  }

  await recordAuditLog({
    userEmail: performedByEmail,
    role: 'owner',
    actionType: 'delete_admin',
    details: `Admin account revoked / deleted: ${email}`
  });

  return { success: true };
}

/**
 * Authenticate against Firestore accounts with fallback to default credentials
 */
export async function authenticateUserAccount(
  rawEmail: string,
  rawPass: string
): Promise<{ success: boolean; account?: AdminAccount; error?: string }> {
  const email = normalizeAccountEmail(rawEmail);
  const pass = rawPass.trim();

  if (!email) {
    return { success: false, error: 'Please enter your email address.' };
  }
  if (!pass) {
    return { success: false, error: 'Please enter your password / passcode.' };
  }

  // 1. Try checking Firestore
  try {
    if (!isQuotaExceeded) {
      const accRef = doc(db, 'admin_accounts', email);
      const snap = await getDoc(accRef);
      if (snap.exists()) {
        const data = snap.data() as AdminAccount;
        if (data.password === pass) {
          // Check approval status for non-owner accounts
          if (data.role !== 'owner') {
            const status = data.status || 'approved'; // legacy accounts without status are approved
            if (status === 'pending') {
              return {
                success: false,
                error: '⏳ Your admin account request is pending Owner approval. The Hub Owner (Ernest) will review and approve your account before you can log in.'
              };
            }
            if (status === 'rejected') {
              return {
                success: false,
                error: '❌ Your admin request was declined by the Hub Owner.'
              };
            }
          }

          // Update lastLoginAt
          const nowIso = new Date().toISOString();
          updateDoc(accRef, { lastLoginAt: nowIso }).catch(() => {});
          const updatedAcc = { ...data, lastLoginAt: nowIso };
          // Cache locally
          try {
            localStorage.setItem('avocean_current_account', JSON.stringify(updatedAcc));
          } catch {}
          return { success: true, account: updatedAcc };
        } else {
          return { success: false, error: 'Incorrect password for this account.' };
        }
      }
    }
  } catch (err: any) {
    console.warn('Firestore account lookup error:', err);
  }

  // 2. Check defaults / local storage fallback
  const fallback = DEFAULT_ACCOUNTS[email];
  if (fallback) {
    // Check if user changed password locally
    let storedPass = fallback.password;
    try {
      const localChanged = localStorage.getItem(`avocean_pwd_${email}`);
      if (localChanged) storedPass = localChanged;
    } catch {}

    if (pass === storedPass) {
      const account: AdminAccount = {
        ...fallback,
        password: pass,
        lastLoginAt: new Date().toISOString()
      };
      try {
        if (!isQuotaExceeded) {
          await setDoc(doc(db, 'admin_accounts', email), sanitizeForFirestore(account), { merge: true });
        }
      } catch {}
      return { success: true, account };
    } else {
      return { success: false, error: 'Incorrect password for Owner account.' };
    }
  }

  // Convenience alias for Owner input (allows typing 'owner' or 'ernest' without exposing email)
  if (email === 'owner' || email === 'ernest' || email === 'ernestthestan') {
    return authenticateUserAccount('ernestthestan@gmail.com', pass);
  }

  return {
    success: false,
    error: 'No account found with this email. If you are an admin, click "Create Admin Account" below to register with your email and passcode.'
  };
}

/**
 * Update an account's password in Firestore
 */
export async function updateAdminAccountPassword(
  rawEmail: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const email = normalizeAccountEmail(rawEmail);
  const curPass = currentPassword.trim();
  const newPass = newPassword.trim();

  if (!newPass || newPass.length < 6) {
    return { success: false, error: 'New password must be at least 6 characters long.' };
  }

  // Authenticate first
  const authRes = await authenticateUserAccount(email, curPass);
  if (!authRes.success || !authRes.account) {
    return { success: false, error: authRes.error || 'Current password is incorrect.' };
  }

  const nowIso = new Date().toISOString();
  try {
    if (!isQuotaExceeded) {
      const accRef = doc(db, 'admin_accounts', email);
      await setDoc(
        accRef,
        {
          password: newPass,
          updatedAt: nowIso
        },
        { merge: true }
      );
    }
  } catch (err) {
    console.warn('Could not update password in Firestore:', err);
  }

  try {
    localStorage.setItem(`avocean_pwd_${email}`, newPass);
  } catch {}

  // Record audit log
  await recordAuditLog({
    userEmail: email,
    role: authRes.account.role,
    actionType: 'password_changed',
    details: `Password changed for account ${email}`
  });

  return { success: true };
}

/**
 * Real-time listener for registered admin accounts
 */
export function subscribeToAdminAccounts(onUpdate: (accounts: AdminAccount[]) => void) {
  if (isQuotaExceeded) {
    onUpdate(Object.values(DEFAULT_ACCOUNTS));
    return () => {};
  }

  const accCol = collection(db, 'admin_accounts');
  const unsubscribe = onSnapshot(
    accCol,
    (snapshot) => {
      const accounts: AdminAccount[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as AdminAccount;
        if (data.email !== 'admin@avocean.hub') {
          accounts.push(data);
        }
      });
      onUpdate(accounts);
    },
    (err: any) => {
      console.warn('Admin accounts listener error:', err);
      onUpdate(Object.values(DEFAULT_ACCOUNTS));
    }
  );

  return unsubscribe;
}

/**
 * 8. LOGIN & ACTIVITY AUDIT HISTORY
 * Stored in Firestore collection 'audit_history'
 */
export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO string
  userEmail: string;
  role: 'owner' | 'admin';
  actionType:
    | 'login'
    | 'login_failed'
    | 'logout'
    | 'password_changed'
    | 'create_event'
    | 'edit_event'
    | 'delete_event'
    | 'update_settings'
    | 'create_fan_club'
    | 'edit_fan_club'
    | 'delete_fan_club'
    | 'create_food_project'
    | 'edit_food_project'
    | 'delete_food_project'
    | string;
  details: string;
  deviceInfo?: string;
}

export function detectDeviceInfo(): string {
  if (typeof navigator === 'undefined') return 'Web Browser';
  const ua = navigator.userAgent;
  let device = 'Desktop';
  if (/mobile|android|iphone|ipad/i.test(ua)) {
    device = 'Mobile Device';
  }
  let browser = 'Browser';
  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edge')) browser = 'Edge';

  return `${device} (${browser})`;
}

/**
 * Record an audit log entry in Firestore and local storage
 */
export async function recordAuditLog(
  entry: Omit<AuditLogEntry, 'id' | 'timestamp'> & { id?: string; timestamp?: string }
): Promise<void> {
  const id = entry.id || `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const timestamp = entry.timestamp || new Date().toISOString();
  const deviceInfo = entry.deviceInfo || detectDeviceInfo();

  const fullEntry: AuditLogEntry = {
    id,
    timestamp,
    userEmail: entry.userEmail,
    role: entry.role,
    actionType: entry.actionType,
    details: entry.details,
    deviceInfo
  };

  // Cache locally
  try {
    const raw = localStorage.getItem('avocean_audit_logs_v1');
    const existing: AuditLogEntry[] = raw ? JSON.parse(raw) : [];
    const updated = [fullEntry, ...existing.filter((e) => e.id !== id)].slice(0, 100);
    localStorage.setItem('avocean_audit_logs_v1', JSON.stringify(updated));
  } catch {}

  // Write to Firestore
  if (!isQuotaExceeded) {
    try {
      const logRef = doc(db, 'audit_history', id);
      await setDoc(logRef, sanitizeForFirestore(fullEntry));
    } catch (err: any) {
      if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
        notifyQuotaExceeded();
      } else {
        console.warn('Could not save audit log:', err);
      }
    }
  }
}

/**
 * Real-time listener for audit history
 */
export function subscribeToAuditHistory(onUpdate: (logs: AuditLogEntry[]) => void) {
  // Initial local delivery
  try {
    const raw = localStorage.getItem('avocean_audit_logs_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        onUpdate(parsed);
      }
    }
  } catch {}

  if (isQuotaExceeded) {
    return () => {};
  }

  const logsCol = collection(db, 'audit_history');
  const unsubscribe = onSnapshot(
    logsCol,
    (snapshot) => {
      const logs: AuditLogEntry[] = [];
      snapshot.forEach((d) => {
        logs.push(d.data() as AuditLogEntry);
      });
      // Sort newest first
      logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      onUpdate(logs);
      try {
        localStorage.setItem('avocean_audit_logs_v1', JSON.stringify(logs.slice(0, 100)));
      } catch {}
    },
    (err: any) => {
      if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
        notifyQuotaExceeded();
      } else {
        console.warn('Audit history listener error:', err);
      }
    }
  );

  return unsubscribe;
}

/**
 * ==============================================================
 * CAREER PROJECTS (SHOWS, MOVIES, MUSIC VIDEOS, PARTNER & OWNED BRANDS)
 * ==============================================================
 */

/**
 * Real-time listener for Jimmy, Sea & Avocean Career Projects
 */
export function subscribeToCareerProjects(
  initialSampleProjects: CareerProject[],
  onUpdate: (projects: CareerProject[]) => void
) {
  const projectsCol = collection(db, 'career_projects');

  const unsubscribe = onSnapshot(
    projectsCol,
    (snapshot) => {
      const loaded: CareerProject[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as CareerProject;
        if (data && data.title) {
          loaded.push(data);
        }
      });

      // Sort newest first chronologically (e.g. My Magic Prophecy on left, Vice Versa on right)
      loaded.sort((a, b) => getProjectChronologicalScore(b) - getProjectChronologicalScore(a));

      // Broadcast all live projects directly from Firestore
      onUpdate(loaded);
    },
    (err: any) => {
      console.warn('Career projects listener error:', err);
      if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
        notifyQuotaExceeded();
      }
    }
  );

  return unsubscribe;
}

/**
 * Save / Update a Career Project in Firestore
 */
export async function saveCareerProjectToFirestore(project: CareerProject): Promise<void> {
  try {
    if (!isQuotaExceeded) {
      await setDoc(doc(db, 'settings', 'projects_meta'), { initialized: true }, { merge: true });
      await setDoc(doc(db, 'career_projects', project.id), sanitizeForFirestore(project));
    }
  } catch (err: any) {
    if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
      notifyQuotaExceeded();
    } else {
      console.warn('Could not save career project to Firestore:', err);
    }
  }
}

/**
 * Delete a Career Project from Firestore
 */
export async function deleteCareerProjectFromFirestore(projectId: string): Promise<void> {
  try {
    if (!isQuotaExceeded) {
      await deleteDoc(doc(db, 'career_projects', projectId));
    }
  } catch (err: any) {
    if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
      notifyQuotaExceeded();
    } else {
      console.warn('Could not delete career project from Firestore:', err);
    }
  }
}

/**
 * ==============================================================
 * ACTOR & DUO PROFILES (JIMMY, AVOCEAN, SEA)
 * ==============================================================
 */

export function subscribeToActorProfiles(
  initialProfiles: Record<'jimmy' | 'avocean' | 'sea', ActorProfile>,
  onUpdate: (profiles: Record<'jimmy' | 'avocean' | 'sea', ActorProfile>) => void
) {
  const profileDocRef = doc(db, 'settings', 'actor_profiles');
  const unsubscribe = onSnapshot(
    profileDocRef,
    async (snap) => {
      if (snap.exists()) {
        const cloudData = snap.data() as Record<string, ActorProfile>;
        const merged: Record<'jimmy' | 'avocean' | 'sea', ActorProfile> = {
          jimmy: { ...initialProfiles.jimmy, ...(cloudData.jimmy || {}) },
          avocean: { ...initialProfiles.avocean, ...(cloudData.avocean || {}) },
          sea: { ...initialProfiles.sea, ...(cloudData.sea || {}) }
        };
        if (merged.avocean && !merged.avocean.parents) {
          merged.avocean.parents = merged.avocean.spouse || 'Jimmy Jitaraphol & Sea Tawinan';
        }
        delete (merged.jimmy as any).myDramaListUrl;
        delete (merged.avocean as any).myDramaListUrl;
        delete (merged.sea as any).myDramaListUrl;
        onUpdate(merged);
      } else {
        // Seed default profiles directly to Firestore
        onUpdate(initialProfiles);
        try {
          await setDoc(profileDocRef, sanitizeForFirestore(initialProfiles));
        } catch (e) {
          console.warn('Could not seed actor profiles:', e);
        }
      }
    },
    (err: any) => {
      console.warn('Actor profiles listener error:', err);
      if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
        notifyQuotaExceeded();
      }
    }
  );

  return unsubscribe;
}

export async function saveActorProfilesToFirestore(
  profiles: Record<'jimmy' | 'avocean' | 'sea', ActorProfile>
): Promise<void> {
  try {
    if (!isQuotaExceeded) {
      await setDoc(doc(db, 'settings', 'actor_profiles'), sanitizeForFirestore(profiles), { merge: true });
    }
  } catch (err: any) {
    if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
      notifyQuotaExceeded();
    } else {
      console.warn('Could not save actor profiles to Firestore:', err);
    }
  }
}




