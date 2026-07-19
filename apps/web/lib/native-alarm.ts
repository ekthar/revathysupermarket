/**
 * Native Alarm — wake screen + sound + vibration for critical alerts.
 *
 * Used by Delivery and Staff apps when a new order/assignment arrives.
 * On native: uses Capacitor LocalNotifications with fullScreenIntent + custom sound.
 * On web: falls back to Web Notification API + Audio.
 *
 * Alarm types:
 * - delivery_assigned: Loud looping alarm for delivery partners (critical)
 * - new_order: Chime alert for staff/admin (high priority)
 * - order_update: Simple notification for customers (normal)
 */

import { isNative, platform } from "@/lib/native-bridge";
import { hapticImpact } from "@/lib/native-bridge";

// ─── Types ───────────────────────────────────────────────────────────────────

export type AlarmType = "delivery_assigned" | "new_order" | "order_update";

export interface AlarmConfig {
  type: AlarmType;
  title: string;
  body: string;
  orderId?: string;
  url?: string;
}

interface AlarmState {
  active: boolean;
  type: AlarmType | null;
  config: AlarmConfig | null;
  audioElement: HTMLAudioElement | null;
  vibrationInterval: ReturnType<typeof setInterval> | null;
  timeoutId: ReturnType<typeof setTimeout> | null;
}

const state: AlarmState = {
  active: false,
  type: null,
  config: null,
  audioElement: null,
  vibrationInterval: null,
  timeoutId: null,
};

type AlarmListener = (config: AlarmConfig) => void;
const alarmListeners: Set<AlarmListener> = new Set();
const dismissListeners: Set<() => void> = new Set();

// ─── Alarm Configuration ─────────────────────────────────────────────────────

const ALARM_CONFIG: Record<AlarmType, {
  sound: string;
  vibrationPattern: number[];
  loopInterval: number;
  autoStopSeconds: number;
  channelId: string;
  fullScreen: boolean;
}> = {
  delivery_assigned: {
    sound: "/sounds/delivery_alarm.wav",
    vibrationPattern: [300, 100, 300, 100, 300, 200, 500],
    loopInterval: 3000, // Replay every 3 seconds
    autoStopSeconds: 60, // Auto-stop after 60 seconds
    channelId: "delivery_alarm",
    fullScreen: true,
  },
  new_order: {
    sound: "/sounds/order_alert.wav",
    vibrationPattern: [200, 100, 200, 100, 400],
    loopInterval: 5000, // Replay every 5 seconds
    autoStopSeconds: 30,
    channelId: "order_alerts",
    fullScreen: true,
  },
  order_update: {
    sound: "/sounds/notification.wav",
    vibrationPattern: [100, 50, 100],
    loopInterval: 0, // No loop
    autoStopSeconds: 0,
    channelId: "order_updates",
    fullScreen: false,
  },
};

// ─── Public API ──────────────────────────────────────────────────────────────

/** Trigger an alarm */
export async function triggerAlarm(config: AlarmConfig): Promise<void> {
  // Don't trigger if one is already active (prevent spam)
  if (state.active) return;

  const alarmDef = ALARM_CONFIG[config.type];

  state.active = true;
  state.type = config.type;
  state.config = config;

  // Notify UI listeners (shows alarm overlay)
  alarmListeners.forEach((cb) => cb(config));

  if (isNative) {
    await triggerNativeAlarm(config, alarmDef);
  } else {
    triggerWebAlarm(config, alarmDef);
  }

  // Auto-stop after timeout
  if (alarmDef.autoStopSeconds > 0) {
    state.timeoutId = setTimeout(() => {
      dismissAlarm();
    }, alarmDef.autoStopSeconds * 1000);
  }
}

/** Dismiss the active alarm */
export function dismissAlarm(): void {
  if (!state.active) return;

  state.active = false;
  state.type = null;
  state.config = null;

  // Stop audio
  if (state.audioElement) {
    state.audioElement.pause();
    state.audioElement.src = "";
    state.audioElement = null;
  }

  // Stop vibration loop
  if (state.vibrationInterval) {
    clearInterval(state.vibrationInterval);
    state.vibrationInterval = null;
  }

  // Clear auto-stop
  if (state.timeoutId) {
    clearTimeout(state.timeoutId);
    state.timeoutId = null;
  }

  // Stop native vibration
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(0);
  }

  // Cancel native local notification
  cancelNativeAlarmNotification();

  // Notify dismiss listeners
  dismissListeners.forEach((cb) => cb());
}

/** Check if alarm is currently active */
export function isAlarmActive(): boolean {
  return state.active;
}

/** Get current alarm config */
export function getActiveAlarm(): AlarmConfig | null {
  return state.config;
}

/** Register listener for alarm trigger (UI shows overlay) */
export function onAlarmTriggered(callback: AlarmListener): () => void {
  alarmListeners.add(callback);
  return () => { alarmListeners.delete(callback); };
}

/** Register listener for alarm dismiss */
export function onAlarmDismissed(callback: () => void): () => void {
  dismissListeners.add(callback);
  return () => { dismissListeners.delete(callback); };
}

// ─── Native Alarm (Capacitor) ────────────────────────────────────────────────

async function triggerNativeAlarm(
  config: AlarmConfig,
  alarmDef: typeof ALARM_CONFIG[AlarmType]
): Promise<void> {
  try {
    // @ts-ignore
    const { LocalNotifications } = await import(/* webpackIgnore: true */ "@capacitor/local-notifications");

    // Schedule a local notification with full-screen intent
    await LocalNotifications.schedule({
      notifications: [{
        id: 99999, // Fixed ID so we can cancel it
        title: config.title,
        body: config.body,
        channelId: alarmDef.channelId,
        sound: alarmDef.sound.replace("/sounds/", "").replace(".wav", ""),
        smallIcon: "ic_stat_icon",
        largeIcon: "ic_launcher",
        ongoing: true, // Can't be swiped away
        autoCancel: false,
        extra: {
          type: config.type,
          orderId: config.orderId,
          url: config.url,
        },
        ...(alarmDef.fullScreen && platform === "android" ? {
          // Android: show as full-screen intent (wakes screen)
          fullScreenIntent: true,
        } : {}),
      }],
    });

    // Start vibration loop
    startVibrationLoop(alarmDef.vibrationPattern, alarmDef.loopInterval);

    // Haptic feedback
    void hapticImpact("heavy");

  } catch {
    // Fallback to web alarm
    triggerWebAlarm(config, alarmDef);
  }
}

async function cancelNativeAlarmNotification(): Promise<void> {
  if (!isNative) return;
  try {
    // @ts-ignore
    const { LocalNotifications } = await import(/* webpackIgnore: true */ "@capacitor/local-notifications");
    await LocalNotifications.cancel({ notifications: [{ id: 99999 }] });
  } catch {}
}

// ─── Web Alarm (Fallback) ────────────────────────────────────────────────────

function triggerWebAlarm(
  config: AlarmConfig,
  alarmDef: typeof ALARM_CONFIG[AlarmType]
): void {
  // Play audio
  try {
    const audio = new Audio(alarmDef.sound);
    audio.loop = alarmDef.loopInterval > 0;
    audio.volume = 1.0;
    audio.play().catch(() => {});
    state.audioElement = audio;
  } catch {}

  // Vibration
  startVibrationLoop(alarmDef.vibrationPattern, alarmDef.loopInterval);

  // Web Notification (if permission granted)
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    try {
      new Notification(config.title, {
        body: config.body,
        icon: "/icons/icon-192.png",
        requireInteraction: true,
        tag: `alarm-${config.type}`,
      });
    } catch {}
  }
}

// ─── Vibration Loop ──────────────────────────────────────────────────────────

function startVibrationLoop(pattern: number[], intervalMs: number): void {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;

  // Initial vibration
  navigator.vibrate(pattern);

  // Loop if interval > 0
  if (intervalMs > 0) {
    state.vibrationInterval = setInterval(() => {
      navigator.vibrate(pattern);
    }, intervalMs);
  }
}
