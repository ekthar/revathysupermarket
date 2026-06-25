"use client";

import { Facebook, Instagram, MapPin } from "lucide-react";

interface StoreInfoLinksProps {
  googleMapsUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
}

export function StoreInfoLinks({ googleMapsUrl, instagramUrl, facebookUrl }: StoreInfoLinksProps) {
  const hasAny = googleMapsUrl || instagramUrl || facebookUrl;
  if (!hasAny) return null;

  return (
    <div className="flex items-center justify-center gap-4">
      {googleMapsUrl && (
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Find us on Google Maps"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition-colors hover:bg-primary-50 hover:text-primary-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-primary-900/30 dark:hover:text-primary-400"
        >
          <MapPin className="h-5 w-5" />
        </a>
      )}
      {instagramUrl && (
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Follow us on Instagram"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition-colors hover:bg-pink-50 hover:text-pink-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-pink-900/30 dark:hover:text-pink-400"
        >
          <Instagram className="h-5 w-5" />
        </a>
      )}
      {facebookUrl && (
        <a
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Follow us on Facebook"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
        >
          <Facebook className="h-5 w-5" />
        </a>
      )}
    </div>
  );
}
