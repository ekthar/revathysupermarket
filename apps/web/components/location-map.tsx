import { ExternalLink, Navigation } from "lucide-react";
import { STORE_COORDINATES, SITE } from "@/lib/constants";
import { Button } from "@/components/ui/button";

export function LocationMap({
  deliveryRadiusKm = SITE.deliveryRadiusKm,
  storeName = SITE.name,
  storeAddress = SITE.address,
  lat = STORE_COORDINATES.lat,
  lng = STORE_COORDINATES.lng
}: {
  deliveryRadiusKm?: number;
  storeName?: string;
  storeAddress?: string;
  lat?: number;
  lng?: number;
}) {
  // Use coordinates directly for accurate positioning instead of text search
  const embedUrl = `https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
  const openUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  return (
    <div className="relative h-full min-h-80 overflow-hidden rounded-xl bg-muted">
      <iframe
        title={`${storeName} Google Map`}
        src={embedUrl}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="h-full min-h-80 w-full border-0"
      />
      <div className="glass-panel absolute inset-x-3 bottom-3 rounded-xl p-3">
        <p className="text-sm font-black text-neutral-950 dark:text-white">{storeName}</p>
        <p className="mt-0.5 text-caption text-muted-foreground">{storeAddress}</p>
        <p className="mt-1 text-xs font-semibold text-muted-foreground">Delivery within {deliveryRadiusKm} KM only</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button asChild variant="outline" size="sm" className="rounded-2xl">
            <a href={openUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
              Open
            </a>
          </Button>
          <Button asChild size="sm" className="rounded-2xl">
            <a href={directionsUrl} target="_blank" rel="noreferrer">
              <Navigation className="h-3.5 w-3.5" />
              Directions
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
