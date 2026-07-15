"use client";

import { useState } from "react";
import { CheckCircle2, Home, MapPin, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/toast-provider";
import { useDeleteAddress, useMakeDefaultAddress } from "@/lib/queries/addresses";

type Address = {
  id: string;
  label: string;
  houseName: string;
  street: string;
  landmark: string;
  pincode: string;
  isDefault: boolean;
};

export function SavedAddressesClient({ addresses: initialAddresses }: { addresses: Address[] }) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const { showToast } = useToast();
  const deleteAddressMutation = useDeleteAddress();
  const makeDefaultMutation = useMakeDefaultAddress();

  function makeDefault(id: string) {
    makeDefaultMutation.mutate(id, {
      onSuccess: () => {
        setAddresses((current) => current.map((addr) => ({ ...addr, isDefault: addr.id === id })));
        showToast("Default address updated", "success");
      },
      onError: (error) => {
        showToast(error.message ?? "Failed to update address.", "error");
      },
    });
  }

  function deleteAddress(id: string) {
    const confirmed = window.confirm("Delete this address?");
    if (!confirmed) return;
    const previous = addresses;
    setAddresses((current) => current.filter((addr) => addr.id !== id));
    deleteAddressMutation.mutate(id, {
      onSuccess: () => {
        showToast("Address deleted", "success");
      },
      onError: (error) => {
        setAddresses(previous);
        showToast(error.message || "Failed to delete address", "error");
      },
    });
  }

  return (
    <section className="mt-5 rounded-xl bg-white dark:bg-neutral-900 card-shadow p-4">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <MapPin className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h2 className="text-title font-bold text-neutral-900 dark:text-white">Saved Addresses</h2>
          <p className="text-caption text-neutral-500 dark:text-neutral-400">{addresses.length} address{addresses.length !== 1 ? "es" : ""} saved</p>
        </div>
      </div>

      {addresses.length === 0 ? (
        <div className="rounded-2xl bg-neutral-50 dark:bg-neutral-800 p-6 text-center">
          <MapPin className="h-8 w-8 text-neutral-300 dark:text-neutral-600 mx-auto" />
          <p className="mt-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">No saved addresses yet</p>
          <p className="mt-1 text-caption text-neutral-400 dark:text-neutral-500">Addresses are saved automatically when you place an order.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {addresses.map((address) => (
              <motion.article
                key={address.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="rounded-2xl bg-neutral-50 dark:bg-neutral-800 p-3.5 border border-neutral-100 dark:border-neutral-700"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-body font-bold text-neutral-900 dark:text-white">{address.label}</span>
                    {address.isDefault && (
                      <span className="inline-flex items-center gap-1 text-micro font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="h-3 w-3" />
                        Default
                      </span>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-caption text-neutral-600 dark:text-neutral-300 leading-relaxed pl-6">
                  {address.houseName}, {address.street}
                  {address.landmark && <>, {address.landmark}</>}
                  , {address.pincode}
                </p>
                <div className="mt-3 flex items-center gap-3 pl-6">
                  {!address.isDefault && (
                    <button
                      type="button"
                      onClick={() => makeDefault(address.id)}
                      className="text-caption font-bold text-primary hover:underline"
                    >
                      Set as default
                    </button>
                  )}
                  {!address.isDefault && (
                    <button
                      type="button"
                      onClick={() => deleteAddress(address.id)}
                      className="text-caption font-bold text-red-500 hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  )}
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
