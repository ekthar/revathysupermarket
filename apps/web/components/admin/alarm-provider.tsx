"use client";

import { useEffect, useState, useRef } from "react";
import { X, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AlarmProvider({ children }: { children: React.ReactNode }) {
  const [alarmActive, setAlarmActive] = useState(false);
  const [alarmPayload, setAlarmPayload] = useState<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let audio: HTMLAudioElement;

    if (alarmActive) {
      // Use a standard clear alarm ringtone URL
      audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
      audio.loop = true;
      audio.volume = 1.0;
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.error("Audio playback prevented by browser policy", err);
          // Fallback to visual only if browser blocks auto-play
        });
      }
    }

    return () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, [alarmActive]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "HEAVY_ALARM") {
        const type = event.data.payload?.type;
        if (type === "new_order_alert") {
          setAlarmPayload(event.data.payload);
          setAlarmActive(true);
        }
      }
    };

    if (typeof navigator !== "undefined" && navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener("message", handleMessage);
    }

    return () => {
      if (typeof navigator !== "undefined" && navigator.serviceWorker) {
        navigator.serviceWorker.removeEventListener("message", handleMessage);
      }
    };
  }, []);

  const acknowledge = () => {
    setAlarmActive(false);
    setAlarmPayload(null);
  };

  return (
    <>
      {children}
      {alarmActive && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 shadow-2xl border-4 border-red-500 animate-bounce shadow-red-500/50">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-20 w-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-2">
                <BellRing className="h-10 w-10 text-red-600 dark:text-red-500 animate-pulse" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-wider">
                {alarmPayload?.title || "New Order Alarm!"}
              </h2>
              <p className="text-slate-600 dark:text-slate-300 text-lg">
                Please acknowledge this notification to stop the alarm.
              </p>
              
              {alarmPayload?.orderId && (
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 w-full font-mono text-sm font-bold text-center">
                  Order ID: {alarmPayload.orderId}
                </div>
              )}
              
              <Button 
                onClick={acknowledge}
                className="w-full h-14 text-lg font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg hover:shadow-xl hover:shadow-red-600/30 transition-all mt-4"
              >
                ACKNOWLEDGE & SILENCE
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
