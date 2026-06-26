import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { api } from "./api";
import { LOCATION_CONSTANTS } from "@msm/shared/constants";

const LOCATION_TASK_NAME = "msm-delivery-location-tracking";

let lastUpdateTime = 0;
let activeOrderId: string | null = null;

// Define the background task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) return;
  if (!data) return;

  const { locations } = data as { locations: Location.LocationObject[] };
  const location = locations[0];
  if (!location) return;

  const now = Date.now();
  if (now - lastUpdateTime < LOCATION_CONSTANTS.TRACKING_THROTTLE_SECONDS * 1000) return;
  lastUpdateTime = now;

  try {
    await api.post("/delivery/location", {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });
  } catch {
    // Non-critical — silently fail
  }
});

export const locationService = {
  isTracking: false,

  async requestPermissions(): Promise<boolean> {
    const { status: foreground } = await Location.requestForegroundPermissionsAsync();
    if (foreground !== "granted") return false;

    const { status: background } = await Location.requestBackgroundPermissionsAsync();
    return background === "granted";
  },

  async startTracking(orderId: string): Promise<boolean> {
    if (this.isTracking && activeOrderId === orderId) return true;

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return false;

    activeOrderId = orderId;
    this.isTracking = true;
    lastUpdateTime = 0;

    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.High,
      distanceInterval: LOCATION_CONSTANTS.DISTANCE_FILTER_METERS,
      timeInterval: LOCATION_CONSTANTS.TRACKING_THROTTLE_SECONDS * 1000,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: "MSM Delivery",
        notificationBody: "Tracking delivery location...",
        notificationColor: "#059669",
      },
    });

    return true;
  },

  async stopTracking(): Promise<void> {
    if (!this.isTracking) return;
    this.isTracking = false;
    activeOrderId = null;

    const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    if (isRegistered) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }
  },

  async getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return null;
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      return { latitude: location.coords.latitude, longitude: location.coords.longitude };
    } catch {
      return null;
    }
  },
};
