"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Bell, Camera, Battery, Shield, Check, ChevronRight } from "lucide-react";
import { springs } from "@/lib/motion";
import { isNative } from "@/lib/native-bridge";
import {
  hasCompletedPermissions,
  markPermissionsCompleted,
  requestPermission,
  getRequiredPermissions,
  detectAppVariant,
  type PermissionType,
  type PermissionResult,
  type AppVariant,
} from "@/lib/native-permissions";
import { registerNativePush, setupPushListeners } from "@/lib/native-push";

const PERMISSION_INFO: Record<PermissionType, {
  icon: typeof Bell;
  title: string;
  description: string;
  color: string;
}> = {
  notifications: {
    icon: Bell, title: "Push Notifications",
    description: "Get real-time order updates, delivery alerts, and important announcements.",
    color: "bg-blue-500",
  },
  location: {
    icon: MapPin, title: "Location Access",
    description: "Find nearby stores, verify delivery address, and enable accurate tracking.",
    color: "bg-emerald-500",
  },
  locationBackground: {
    icon: MapPin, title: "Background Location",
    description: "Share your location with customers while delivering, even when app is minimized.",
    color: "bg-teal-500",
  },
  camera: {
    icon: Camera, title: "Camera",
    description: "Take proof-of-delivery photos and scan QR codes for order verification.",
    color: "bg-purple-500",
  },
  exactAlarm: {
    icon: Bell, title: "Alarm Notifications",
    description: "Wake your screen for urgent order assignments — never miss a delivery.",
    color: "bg-red-500",
  },
  batteryOptimization: {
    icon: Battery, title: "Battery Optimization",
    description: "Keep the app running reliably so you never miss incoming orders.",
    color: "bg-amber-500",
  },
};


/**
 * PermissionGate — Full-screen first-launch permission onboarding.
 * Apple HIG: explain WHY before asking, one at a time, allow skip for non-critical.
 */
export function PermissionGate({ children }: { children: React.ReactNode }) {
  const [showGate, setShowGate] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [variant, setVariant] = useState<AppVariant>("customer");
  const [results, setResults] = useState<PermissionResult[]>([]);
  const [requesting, setRequesting] = useState(false);
  const [permissions, setPermissions] = useState<{ type: PermissionType; required: boolean }[]>([]);

  useEffect(() => {
    if (!isNative) return;
    if (hasCompletedPermissions()) return;
    const detected = detectAppVariant();
    setVariant(detected);
    setPermissions(getRequiredPermissions(detected));
    setShowGate(true);
  }, []);

  const handleRequest = useCallback(async () => {
    if (currentStep >= permissions.length) return;
    setRequesting(true);
    const perm = permissions[currentStep];
    const status = await requestPermission(perm.type);
    setResults((prev) => [...prev, { type: perm.type, status, required: perm.required }]);
    setRequesting(false);
    setCurrentStep((prev) => prev + 1);
  }, [currentStep, permissions]);

  const handleSkip = useCallback(() => {
    if (currentStep >= permissions.length) return;
    const perm = permissions[currentStep];
    setResults((prev) => [...prev, { type: perm.type, status: "denied", required: perm.required }]);
    setCurrentStep((prev) => prev + 1);
  }, [currentStep, permissions]);

  const handleComplete = useCallback(async () => {
    markPermissionsCompleted(results);
    await registerNativePush();
    await setupPushListeners();
    setShowGate(false);
  }, [results]);

  useEffect(() => {
    if (permissions.length > 0 && currentStep >= permissions.length && !requesting) {
      const timer = setTimeout(handleComplete, 800);
      return () => clearTimeout(timer);
    }
  }, [currentStep, permissions.length, requesting, handleComplete]);

  if (!showGate) return <>{children}</>;

  const isComplete = currentStep >= permissions.length;
  const currentPerm = !isComplete ? permissions[currentStep] : null;
  const currentInfo = currentPerm ? PERMISSION_INFO[currentPerm.type] : null;
  const variantName = variant === "customer" ? "Shopping" : variant === "delivery" ? "Delivery" : "Staff";

  if (isComplete) {
    const granted = results.filter((r) => r.status === "granted").length;
    return (
      <>
        <div className="pointer-events-none opacity-20">{children}</div>
        <div className="fixed inset-0 z-[200] bg-white dark:bg-neutral-950 flex flex-col items-center justify-center px-8 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={springs.snappy}
            className="h-20 w-20 rounded-full bg-emerald-500 flex items-center justify-center mb-6">
            <Check className="h-10 w-10 text-white" strokeWidth={3} />
          </motion.div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-white">All Set!</h1>
          <p className="mt-2 text-sm text-neutral-500 max-w-xs">
            {granted}/{permissions.length} permissions granted. Your {variantName.toLowerCase()} app is ready.
          </p>
        </div>
      </>
    );
  }

  if (!currentInfo || !currentPerm) return <>{children}</>;
  const Icon = currentInfo.icon;

  return (
    <>
      <div className="pointer-events-none opacity-20">{children}</div>
      <div className="fixed inset-0 z-[200] bg-white dark:bg-neutral-950 flex flex-col">
        {/* Progress */}
        <div className="px-6 pt-16 pb-4">
          <div className="flex gap-1.5">
            {Array.from({ length: permissions.length }).map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                i < currentStep ? "bg-emerald-500" : i === currentStep ? "bg-neutral-900 dark:bg-white" : "bg-neutral-200 dark:bg-neutral-800"
              }`} />
            ))}
          </div>
          <p className="mt-3 text-[11px] font-bold text-neutral-400 uppercase tracking-widest">
            Step {currentStep + 1} of {permissions.length}
          </p>
        </div>
        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div key={currentPerm.type} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={springs.enter}
            className="flex-1 flex flex-col items-center justify-center px-8 text-center">
            <div className={`h-20 w-20 rounded-3xl ${currentInfo.color} flex items-center justify-center mb-8 shadow-lg`}>
              <Icon className="h-10 w-10 text-white" strokeWidth={1.8} />
            </div>
            <h1 className="text-2xl font-black text-neutral-900 dark:text-white">{currentInfo.title}</h1>
            <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400 max-w-sm leading-relaxed">{currentInfo.description}</p>
            {currentPerm.required && (
              <div className="mt-4 flex items-center gap-1.5 text-[11px] font-bold text-amber-600">
                <Shield className="h-3 w-3" /> Required for app functionality
              </div>
            )}
          </motion.div>
        </AnimatePresence>
        {/* Actions */}
        <div className="px-6 pb-10 space-y-3">
          <button type="button" onClick={handleRequest} disabled={requesting}
            className="w-full h-14 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-sm flex items-center justify-center gap-2 press disabled:opacity-50">
            {requesting ? <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Allow {currentInfo.title}<ChevronRight className="h-4 w-4" /></>}
          </button>
          {!currentPerm.required && (
            <button type="button" onClick={handleSkip} className="w-full h-12 rounded-2xl text-neutral-500 font-semibold text-sm press">
              Skip for now
            </button>
          )}
        </div>
      </div>
    </>
  );
}
