import Link from "next/link";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/lib/types";

type TimeSlot = {
  title: string;
  subtitle: string;
  categories: string[];
};

const TIME_SLOTS: Record<string, TimeSlot> = {
  morning: {
    title: "Breakfast Essentials",
    subtitle: "Start your morning fresh",
    categories: ["Dairy", "Beverages"],
  },
  afternoon: {
    title: "Lunch Prep",
    subtitle: "Get lunch sorted quickly",
    categories: ["Vegetables", "Grocery Essentials"],
  },
  evening: {
    title: "Dinner Tonight",
    subtitle: "Everything for a great dinner",
    categories: ["Grocery Essentials", "Frozen Foods", "Vegetables"],
  },
  night: {
    title: "Late Night Cravings",
    subtitle: "Midnight munchies? We got you",
    categories: ["Snacks", "Beverages"],
  },
};

function getTimeSlotKey(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}

export function TimeOfDayRail({ products }: { products: Product[] }) {
  const slotKey = getTimeSlotKey();
  const slot = TIME_SLOTS[slotKey];

  const filtered = products
    .filter((p) =>
      slot.categories.some(
        (cat) => p.category.toLowerCase() === cat.toLowerCase()
      )
    )
    .slice(0, 8);

  if (filtered.length === 0) return null;

  return (
    <section className="pt-6 pb-2" aria-label={slot.title}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="mb-3">
          <h2 className="text-lg font-bold text-foreground">{slot.title}</h2>
          <p className="text-sm text-muted-foreground">{slot.subtitle}</p>
        </div>
        <div className="flex overflow-x-auto gap-3 scrollbar-hide pb-2 -mx-4 px-4 snap-x snap-mandatory">
          {filtered.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="flex-shrink-0 w-36 snap-start group"
            >
              <div className="relative h-36 w-36 rounded-2xl overflow-hidden bg-muted">
                {product.image && (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                    sizes="144px"
                  />
                )}
                {product.discountPrice && (
                  <span className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                    SALE
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-xs font-bold text-foreground line-clamp-2 leading-tight">
                {product.name}
              </p>
              <p className="mt-0.5 text-xs font-black text-foreground tabular-nums">
                {formatCurrency(product.discountPrice ?? product.price)}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
