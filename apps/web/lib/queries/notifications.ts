import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { readApiResponse } from "@/lib/client-api";

export const NOTIFICATIONS_QUERY_KEY = ["notifications"] as const;

type Notification = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

export function useNotifications() {
  return useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      const data = await readApiResponse<{ notifications?: Notification[] }>(res);
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return data.notifications ?? [];
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      if (!res.ok) throw new Error("Failed to mark notifications read");
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      const previous = queryClient.getQueryData<Notification[]>(NOTIFICATIONS_QUERY_KEY);
      queryClient.setQueryData<Notification[]>(NOTIFICATIONS_QUERY_KEY, (old) =>
        old?.map((n) => ({ ...n, read: true })) ?? []
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });
}
