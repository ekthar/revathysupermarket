import { SITE } from "@/lib/constants";
import { safeProductImageUrl } from "@/lib/image";
import type { Product } from "@/lib/types";

type JsonLd = Record<string, unknown>;

export function organizationSchema(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    telephone: SITE.phone || undefined,
    address: {
      "@type": "PostalAddress",
      addressLocality: SITE.address,
    },
  };
}

export function websiteSchema(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE.url}/products?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function productSchema(product: Product): JsonLd {
  const schema: JsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: safeProductImageUrl(product.image),
    description: product.description,
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: product.discountPrice ?? product.price,
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  };

  if (product.avgRating && product.reviewCount && product.reviewCount > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.avgRating,
      reviewCount: product.reviewCount,
    };
  }

  return schema;
}

export interface OfferItem {
  id: string;
  title: string;
  description: string | null;
  discountType: string;
  discountValue: number;
}

export function offerCatalogSchema(offers: OfferItem[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name: `${SITE.name} Offers & Deals`,
    itemListElement: offers.map((offer) => ({
      "@type": "Offer",
      name: offer.title,
      description: offer.description || undefined,
      priceCurrency: "INR",
      discount:
        offer.discountType === "PERCENTAGE"
          ? `${offer.discountValue}%`
          : `₹${offer.discountValue}`,
    })),
  };
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function breadcrumbSchema(items: BreadcrumbItem[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
