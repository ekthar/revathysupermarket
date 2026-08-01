import Link from "next/link";
import Image from "next/image";

type OfferItem = {
  id: string;
  title: string;
  description: string | null;
  badge: string | null;
  image: string | null;
  categoryId: string | null;
};

export function OffersStrip({ offers }: { offers: OfferItem[] }) {
  if (offers.length === 0) return null;

  return (
    <section className="pt-4 pb-2" aria-label="Current offers">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
          Offers for you
        </h2>
        <div className="flex overflow-x-auto gap-3 scrollbar-hide pb-2 -mx-4 px-4 snap-x snap-mandatory">
          {offers.map((offer) => (
            <Link
              key={offer.id}
              href="/offers"
              className="relative flex-shrink-0 w-60 h-32 rounded-2xl overflow-hidden snap-start group"
            >
              {/* Background */}
              {offer.image ? (
                <Image
                  src={offer.image}
                  alt={offer.title}
                  fill
                  className="object-cover"
                  sizes="240px"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-secondary-600" />
              )}

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

              {/* Badge pill */}
              {offer.badge && (
                <span className="absolute top-2.5 left-2.5 bg-white/90 text-xs font-black text-neutral-900 px-2.5 py-0.5 rounded-full">
                  {offer.badge}
                </span>
              )}

              {/* Content */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5">
                <p className="text-sm font-bold text-white line-clamp-1">{offer.title}</p>
                {offer.description && (
                  <p className="text-xs text-white/80 mt-0.5 line-clamp-1">{offer.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
