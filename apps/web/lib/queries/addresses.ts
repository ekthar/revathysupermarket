import { useMutation, useQueryClient } from "@tanstack/react-query";
import { readApiResponse } from "@/lib/client-api";

export const ADDRESSES_QUERY_KEY = ["addresses"] as const;

type Address = {
  id: string;
  label: string;
  houseName: string;
  street: string;
  landmark: string;
  pincode: string;
  isDefault: boolean;
};

export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/account/addresses/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Failed to delete address" }));
        throw new Error(data.error || "Failed to delete address");
      }
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ADDRESSES_QUERY_KEY });
      const previous = queryClient.getQueryData<Address[]>(ADDRESSES_QUERY_KEY);
      queryClient.setQueryData<Address[]>(ADDRESSES_QUERY_KEY, (old) =>
        old?.filter((addr) => addr.id !== id) ?? []
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(ADDRESSES_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY });
    },
  });
}

export function useMakeDefaultAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/account/addresses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      const data = await readApiResponse<{ error?: string }>(res);
      if (!res.ok) throw new Error(data.error ?? "Failed to update address");
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ADDRESSES_QUERY_KEY });
      const previous = queryClient.getQueryData<Address[]>(ADDRESSES_QUERY_KEY);
      queryClient.setQueryData<Address[]>(ADDRESSES_QUERY_KEY, (old) =>
        old?.map((addr) => ({ ...addr, isDefault: addr.id === id })) ?? []
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(ADDRESSES_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY });
    },
  });
}
