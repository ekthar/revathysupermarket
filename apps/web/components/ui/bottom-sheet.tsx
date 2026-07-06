"use client";

import { Drawer } from "vaul";
import { X } from "lucide-react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[91] bg-black/40 backdrop-blur-sm" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-[92] max-h-[85dvh] rounded-t-3xl bg-white dark:bg-slate-900 shadow-2xl outline-none">
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="h-1 w-10 rounded-full bg-slate-200 dark:bg-slate-700" />
          </div>

          {/* Header */}
          {title ? (
            <div className="flex items-center justify-between px-5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Drawer.Title className="text-title font-bold text-slate-900 dark:text-white">
                {title}
              </Drawer.Title>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="h-11 w-11 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
              >
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
          ) : (
            <Drawer.Title className="sr-only">Dialog</Drawer.Title>
          )}

          {/* Scrollable content — extra bottom padding to clear the fixed mobile nav bar */}
          <div className="overflow-y-auto px-5 py-4 pb-[calc(5rem+var(--safe-bottom,0px))] md:pb-6">
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
