import { create } from "zustand";
import { api } from "../services/api";
import { alarmService } from "../services/alarm";
import { locationService } from "../services/location";
import type {
  DeliveryDashboardData,
  DeliveryActiveOrder,
  DeliveryAssignmentEvent,
} from "@msm/shared/types";
import { POLLING_CONSTANTS } from "@msm/shared/constants";

interface DeliveryState {
  // Dashboard data
  dashboard: DeliveryDashboardData | null;
  isLoading: boolean;
  error: string | null;

  // Assignment alerts
  pendingAssignment: DeliveryAssignmentEvent | null;
  acknowledgedIds: Set<string>;

  // Actions
  fetchDashboard: () => Promise<void>;
  handleAssignment: (event: DeliveryAssignmentEvent) => void;
  acknowledgeAssignment: (eventId: string, orderId: string) => Promise<void>;
  dismissAssignment: () => void;
  startPolling: () => void;
  stopPolling: () => void;

  // Location tracking
  startTracking: (orderId: string) => Promise<boolean>;
  stopTracking: () => Promise<void>;
}

let pollInterval: ReturnType<typeof setInterval> | null = null;

export const useDeliveryStore = create<DeliveryState>((set, get) => ({
  dashboard: null,
  isLoading: false,
  error: null,
  pendingAssignment: null,
  acknowledgedIds: new Set(),

  fetchDashboard: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get("/delivery/dashboard");
      set({ dashboard: data, isLoading: false });
    } catch {
      set({ error: "Failed to load dashboard", isLoading: false });
    }
  },

  handleAssignment: (event: DeliveryAssignmentEvent) => {
    const { acknowledgedIds } = get();
    // Deduplicate
    if (acknowledgedIds.has(event.eventId)) return;

    set({ pendingAssignment: event });
    alarmService.startAlarm();
  },

  acknowledgeAssignment: async (eventId: string, orderId: string) => {
    await alarmService.stopAlarm();
    const { acknowledgedIds } = get();
    acknowledgedIds.add(eventId);
    set({ pendingAssignment: null, acknowledgedIds });

    try {
      await api.post("/delivery/acknowledge", { eventId, orderId });
    } catch {
      // Non-critical
    }
  },

  dismissAssignment: () => {
    alarmService.stopAlarm();
    set({ pendingAssignment: null });
  },

  startPolling: () => {
    // Initial fetch
    get().fetchDashboard();

    // Poll every 30 seconds for assignments
    pollInterval = setInterval(async () => {
      try {
        const { data } = await api.get("/delivery/assignments/pending");
        const events = (data.events || []) as DeliveryAssignmentEvent[];
        if (events.length > 0) {
          get().handleAssignment(events[0]);
        }
      } catch {
        // Silently fail polling
      }
    }, POLLING_CONSTANTS.ASSIGNMENT_POLL_INTERVAL_MS);
  },

  stopPolling: () => {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  },

  startTracking: async (orderId: string) => {
    return locationService.startTracking(orderId);
  },

  stopTracking: async () => {
    return locationService.stopTracking();
  },
}));
