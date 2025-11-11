// Client-only presence using BroadcastChannel with a simple heartbeat.
// This is a best-effort local presence mechanism; for cross-user presence across devices,
// wire this interface to a realtime service (e.g., Pusher/Ably/Supabase) in the future.

type ResourceType = 'rep' | 'lead';

export type PresenceUser = {
  userId: string;
  firstName: string;
  lastName: string;
};

type PresenceEvent =
  | {
      type: 'enter';
      resourceType: ResourceType;
      resourceId: string;
      user: PresenceUser;
      timestamp: number;
    }
  | {
      type: 'leave';
      resourceType: ResourceType;
      resourceId: string;
      user: PresenceUser;
      timestamp: number;
    }
  | {
      type: 'heartbeat';
      resourceType: ResourceType;
      resourceId: string;
      user: PresenceUser;
      timestamp: number;
    };

export type PresenceMap = Record<
  string, // resourceId
  {
    users: PresenceUser[];
    updatedAt: number;
  }
>;

const CHANNEL_NAME = 'wusa_presence_channel_v1';
const HEARTBEAT_MS = 10_000;
const STALE_MS = 30_000;

function isClient(): boolean {
  return typeof window !== 'undefined';
}

function now(): number {
  return Date.now();
}

export function createPresenceController(resourceType: ResourceType, currentUser: PresenceUser | null) {
  let channel: BroadcastChannel | null = null;
  const listeners: Array<(presence: PresenceMap) => void> = [];
  let presenceById: PresenceMap = {};
  let activeResourceId: string | null = null;
  let heartbeatTimer: number | null = null;

  function notify() {
    listeners.forEach((l) => l({ ...presenceById }));
  }

  function cleanupStale() {
    const cutoff = now() - STALE_MS;
    let changed = false;
    Object.keys(presenceById).forEach((rid) => {
      const entry = presenceById[rid];
      if (!entry) return;
      const filtered = entry.users.filter((u) => entry.updatedAt >= cutoff);
      if (filtered.length !== entry.users.length || entry.updatedAt < cutoff) {
        changed = true;
        if (filtered.length === 0) {
          delete presenceById[rid];
        } else {
          presenceById[rid] = { users: filtered, updatedAt: Math.max(entry.updatedAt, now()) };
        }
      }
    });
    if (changed) notify();
  }

  function handleEvent(evt: PresenceEvent) {
    if (evt.resourceType !== resourceType) return;
    const rid = evt.resourceId;
    const key = rid;
    const current = presenceById[key] || { users: [], updatedAt: 0 };
    const withoutUser = current.users.filter((u) => u.userId !== evt.user.userId);
    let nextUsers = withoutUser;
    if (evt.type === 'enter' || evt.type === 'heartbeat') {
      nextUsers = [...withoutUser, evt.user];
    }
    presenceById[key] = {
      users: nextUsers,
      updatedAt: evt.timestamp,
    };
    if (presenceById[key].users.length === 0) {
      delete presenceById[key];
    }
    notify();
  }

  function startChannel() {
    if (!isClient()) return;
    if (channel) return;
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = (e: MessageEvent<PresenceEvent>) => {
        if (!e.data) return;
        handleEvent(e.data);
      };
    } catch {
      channel = null;
    }
  }

  function post(evt: PresenceEvent) {
    if (!isClient()) return;
    if (!channel) return;
    try {
      channel.postMessage(evt);
    } catch {
      // no-op
    }
  }

  function sendEnter(resourceId: string) {
    if (!currentUser) return;
    const evt: PresenceEvent = {
      type: 'enter',
      resourceType,
      resourceId,
      user: currentUser,
      timestamp: now(),
    };
    // Update local state immediately
    handleEvent(evt);
    post(evt);
  }

  function sendLeave(resourceId: string) {
    if (!currentUser) return;
    const evt: PresenceEvent = {
      type: 'leave',
      resourceType,
      resourceId,
      user: currentUser,
      timestamp: now(),
    };
    // Update local state immediately
    handleEvent(evt);
    post(evt);
  }

  function sendHeartbeat(resourceId: string) {
    if (!currentUser) return;
    const evt: PresenceEvent = {
      type: 'heartbeat',
      resourceType,
      resourceId,
      user: currentUser,
      timestamp: now(),
    };
    // Update local state immediately
    handleEvent(evt);
    post(evt);
  }

  function beginHeartbeat(resourceId: string) {
    if (!isClient()) return;
    if (heartbeatTimer) window.clearInterval(heartbeatTimer);
    heartbeatTimer = window.setInterval(() => {
      cleanupStale();
      sendHeartbeat(resourceId);
    }, HEARTBEAT_MS) as unknown as number;
  }

  function endHeartbeat() {
    if (!isClient()) return;
    if (heartbeatTimer) {
      window.clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  }

  function setActive(resourceId: string | null) {
    startChannel();
    if (!isClient()) return;
    if (activeResourceId && activeResourceId !== resourceId) {
      sendLeave(activeResourceId);
    }
    activeResourceId = resourceId;
    endHeartbeat();
    if (resourceId) {
      sendEnter(resourceId);
      beginHeartbeat(resourceId);
      // Clear on unload to best-effort leave
      const handler = () => {
        try {
          sendLeave(resourceId);
        } catch {
          // no-op
        }
      };
      window.addEventListener('beforeunload', handler, { once: true });
      window.addEventListener('pagehide', handler, { once: true });
    }
  }

  function onPresence(listener: (presence: PresenceMap) => void) {
    startChannel();
    listeners.push(listener);
    // Immediate emit
    listener({ ...presenceById });
    return () => {
      const idx = listeners.indexOf(listener);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }

  function getPresence(): PresenceMap {
    return { ...presenceById };
  }

  return {
    setActive,
    onPresence,
    getPresence,
  };
}


