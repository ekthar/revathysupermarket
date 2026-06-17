"use client";

export function OrderTrackingMap({
  latitude,
  longitude,
  title = "Order tracking map"
}: {
  latitude: number;
  longitude: number;
  title?: string;
}) {
  return (
    <iframe
      title={title}
      src={`https://www.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      className="h-64 w-full border-0"
    />
  );
}
