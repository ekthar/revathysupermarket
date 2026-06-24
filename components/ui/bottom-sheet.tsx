"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import { lockDocumentScroll } from "@/lib/document-scroll-lock";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    return lockDocumentScroll();
  }, [open, pathname]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.1}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) {
                onClose();
              }
            }}
            className="stable-dialog fixed inset-x-0 bottom-0 z-[91] max-h-[85dvh] overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="h-1 w-10 rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-5 pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">{title}</h3>
                <button type="button" aria-label="Close" onClick={onClose} className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="sheet-scroll-content ios-native-scroll overflow-y-auto px-5 py-4">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
