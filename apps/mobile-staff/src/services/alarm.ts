import { Audio } from "expo-av";
import { AppState, AppStateStatus, Vibration } from "react-native";
import { ALARM_CONSTANTS } from "@msm/shared/constants";

/**
 * Audio alarm service for delivery assignment alerts.
 * Plays a looping alarm every 3 seconds until stopped.
 * Lifecycle-aware: pauses in background, resumes in foreground.
 */
class AlarmService {
  private sound: Audio.Sound | null = null;
  private loopTimer: ReturnType<typeof setInterval> | null = null;
  private isPlaying = false;
  private isPaused = false;
  private appStateSubscription: any = null;

  get playing(): boolean {
    return this.isPlaying;
  }

  async startAlarm(): Promise<void> {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.isPaused = false;

    // Configure audio session
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: false,
      staysActiveInBackground: true,
    });

    // Listen for app state changes
    this.appStateSubscription = AppState.addEventListener(
      "change",
      this.handleAppStateChange
    );

    // Play immediately
    await this.playOnce();

    // Loop every 3 seconds
    this.loopTimer = setInterval(() => {
      if (this.isPlaying && !this.isPaused) {
        this.playOnce();
        // Vibrate pattern: [300, 100, 300, 100, 300, 200, 500]
        Vibration.vibrate([300, 100, 300, 100, 300, 200, 500]);
      }
    }, ALARM_CONSTANTS.LOOP_INTERVAL_MS);
  }

  private async playOnce(): Promise<void> {
    try {
      // Unload previous sound if any
      if (this.sound) {
        await this.sound.unloadAsync().catch(() => {});
      }

      const { sound } = await Audio.Sound.createAsync(
        require("../../assets/audio/delivery_alarm.wav"),
        { volume: 1.0, shouldPlay: true }
      );
      this.sound = sound;

      // Vibrate
      Vibration.vibrate([300, 100, 300, 100, 300]);
    } catch {
      // Fall back to vibration only if audio asset missing
      Vibration.vibrate([500, 200, 500, 200, 500]);
    }
  }

  async stopAlarm(): Promise<void> {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    this.isPaused = false;

    if (this.loopTimer) {
      clearInterval(this.loopTimer);
      this.loopTimer = null;
    }

    if (this.sound) {
      await this.sound.stopAsync().catch(() => {});
      await this.sound.unloadAsync().catch(() => {});
      this.sound = null;
    }

    Vibration.cancel();

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }

  private handleAppStateChange = (state: AppStateStatus): void => {
    if (state === "active" && this.isPlaying && this.isPaused) {
      this.isPaused = false;
      this.playOnce();
    } else if (
      (state === "background" || state === "inactive") &&
      this.isPlaying
    ) {
      this.isPaused = true;
    }
  };
}

export const alarmService = new AlarmService();
