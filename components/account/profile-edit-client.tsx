"use client";

import { useState, useRef } from "react";
import { Camera, Check, Chrome, Loader2, Mail, Phone, Save, Trash2, User } from "lucide-react";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { readApiResponse } from "@/lib/client-api";

interface ProfileEditProps {
  user: {
    name: string;
    email: string;
    phone: string;
    image: string | null;
  };
}

export function ProfileEditClient({ user: initialUser }: ProfileEditProps) {
  const [name, setName] = useState(initialUser.name);
  const [email, setEmail] = useState(initialUser.email);
  const [image, setImage] = useState(initialUser.image);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Phone OTP flow
  const [phoneDraft, setPhoneDraft] = useState(initialUser.phone);
  const [phoneOtp, setPhoneOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "Image too large. Max 5MB." });
      return;
    }

    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const res = await fetch("/api/account/avatar", { method: "POST", body: formData });
      const data = await readApiResponse<{ image?: string; error?: string }>(res);

      if (res.ok && data.image) {
        setImage(data.image);
        setMessage({ type: "success", text: "Profile photo updated!" });
      } else {
        setMessage({ type: "error", text: data.error || "Upload failed." });
      }
    } catch {
      setMessage({ type: "error", text: "Upload failed. Try again." });
    } finally {
      setUploading(false);
    }
  }

  async function removeAvatar() {
    setUploading(true);
    try {
      const res = await fetch("/api/account/avatar", { method: "DELETE" });
      if (res.ok) {
        setImage(null);
        setMessage({ type: "success", text: "Photo removed." });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to remove photo." });
    } finally {
      setUploading(false);
    }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email: email || undefined })
      });
      const data = await readApiResponse<{ error?: string }>(res);

      if (res.ok) {
        setMessage({ type: "success", text: "Profile saved successfully!" });
      } else {
        setMessage({ type: "error", text: data.error || "Save failed." });
      }
    } catch {
      setMessage({ type: "error", text: "Save failed. Try again." });
    } finally {
      setSaving(false);
    }
  }

  async function sendPhoneOtp() {
    if (!phoneDraft || phoneDraft.length < 10) {
      setMessage({ type: "error", text: "Enter a valid 10-digit phone number." });
      return;
    }
    setPhoneLoading(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneDraft })
      });
      const data = await readApiResponse<{ error?: string }>(res);
      if (res.ok) {
        setOtpSent(true);
        setMessage({ type: "success", text: "OTP sent on WhatsApp." });
      } else {
        setMessage({ type: "error", text: data.error || "Could not send OTP." });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to send OTP." });
    } finally {
      setPhoneLoading(false);
    }
  }

  async function verifyPhoneOtp() {
    setPhoneLoading(true);
    try {
      const res = await fetch("/api/account/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneDraft, otp: phoneOtp })
      });
      const data = await readApiResponse<{ error?: string }>(res);
      if (res.ok) {
        setMessage({ type: "success", text: "Phone number verified!" });
        setOtpSent(false);
      } else {
        setMessage({ type: "error", text: data.error || "Verification failed." });
      }
    } catch {
      setMessage({ type: "error", text: "Verification failed." });
    } finally {
      setPhoneLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Avatar Section */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 card-shadow p-5">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-4">Profile Photo</p>

        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="h-20 w-20 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 dark:from-primary/10 dark:to-slate-800 flex items-center justify-center">
              {image ? (
                <img src={image} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-primary/60" />
              )}
            </div>
            {/* Camera overlay button */}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary flex items-center justify-center shadow-md press"
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
              ) : (
                <Camera className="h-3.5 w-3.5 text-white" />
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>

          <div className="flex-1">
            <p className="text-[13px] font-semibold text-slate-800 dark:text-white">
              {name || "Add your name"}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Tap the camera to change photo
            </p>
            {image && (
              <button
                type="button"
                onClick={removeAvatar}
                disabled={uploading}
                className="mt-2 text-[11px] font-semibold text-red-500 flex items-center gap-1 press"
              >
                <Trash2 className="h-3 w-3" /> Remove photo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={saveProfile} className="rounded-2xl bg-white dark:bg-slate-900 card-shadow p-5 space-y-4">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Personal Info</p>

        <div>
          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">Full Name</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-10 pr-4 text-[14px] font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-10 pr-4 text-[14px] font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        {/* Phone section */}
        <div>
          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">Phone Number</label>
          {initialUser.phone ? (
            <div className="flex items-center gap-2 h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5">
              <Phone className="h-4 w-4 text-primary" />
              <span className="text-[14px] font-medium text-slate-900 dark:text-white">{initialUser.phone}</span>
              <Check className="h-4 w-4 text-primary ml-auto" />
              <span className="text-[10px] text-primary font-semibold">Verified</span>
            </div>
          ) : (
            <div className="space-y-2 rounded-xl bg-primary/5 dark:bg-primary/10 p-3">
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="tel"
                  value={phoneDraft}
                  onChange={(e) => setPhoneDraft(e.target.value.replace(/\D/g, "").slice(0, 12))}
                  placeholder="10-digit phone number"
                  className="w-full h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-4 text-[14px] font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-primary transition-all"
                />
              </div>
              {otpSent && (
                <input
                  type="text"
                  value={phoneOtp}
                  onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="6-digit OTP"
                  className="w-full h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 text-[14px] font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-primary transition-all text-center tracking-[0.3em]"
                />
              )}
              <button
                type="button"
                onClick={otpSent ? verifyPhoneOtp : sendPhoneOtp}
                disabled={phoneLoading}
                className="w-full h-11 rounded-xl bg-primary text-white text-[13px] font-bold press disabled:opacity-50"
              >
                {phoneLoading ? "Please wait..." : otpSent ? "Verify OTP" : "Send WhatsApp OTP"}
              </button>
            </div>
          )}
        </div>

        {/* Save button */}
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="w-full h-12 rounded-xl bg-primary text-white text-[14px] font-bold flex items-center justify-center gap-2 press disabled:opacity-50 shadow-sm"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>

      {/* Link Google */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 card-shadow p-5">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-3">Connected Accounts</p>
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/account/edit" })}
          className="w-full h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 press hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <Chrome className="h-4 w-4" />
          Link Google Account
        </button>
      </div>

      {/* Status message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`rounded-xl p-3 text-[13px] font-medium text-center ${
              message.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300"
                : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300"
            }`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
