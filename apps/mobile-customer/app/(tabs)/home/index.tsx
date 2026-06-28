import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  Image,
} from "react-native";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { router } from "expo-router";
import { Search, TrendingUp, Zap, Sparkles } from "lucide-react-native";
import { api } from "@/services/api";
import type { Product, Category, Banner } from "@msm/shared/types";
import { useAuthStore } from "@/stores/auth";
import { useSettingsStore } from "@/stores/settings";
import { LiveOrderBanner } from "@/components/home/LiveOrderBanner";
import { HeroBanner } from "@/components/home/HeroBanner";
import { RecentOrders } from "@/components/home/RecentOrders";
import { ProductSection } from "@/components/home/ProductSection";
import { FloatingCartBar } from "@/components/home/FloatingCartBar";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";

export default function HomeScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();
  const { storeConfig, loadStoreConfig } = useSettingsStore();

  const fetchData = async () => {
    try {
      const [catRes, prodRes, bannerRes] = await Promise.all([
        api.get("/categories"),
        api.get("/products?limit=60"),
        api.get("/banners").catch(() => ({ data: { items: [] } })),
      ]);
      setCategories(catRes.data.items || catRes.data || []);
      setProducts(prodRes.data.items || prodRes.data || []);
      setBanners(bannerRes.data.items || bannerRes.data || []);
    } catch {}
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
    loadStoreConfig();
  }, []);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  // Derive product sections
  const trending = [...products]
    .sort((a, b) => ((b as any).popularity || 0) - ((a as any).popularity || 0))
    .slice(0, 12);
  const offers = products.filter((p) => p.discountPrice).slice(0, 8);
  const featured = products.filter((p) => p.isFeatured).slice(0, 8);
  const freshPicks = [...products].sort(() => Math.random() - 0.5).slice(0, 10);

  // Greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const heroImage =
    banners[0]?.image ||
    "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1800&auto=format&fit=crop";
  const heroTitle = banners[0]?.title || "Fresh Groceries Delivered Fast";

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#050505"
          />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View className="px-4 pt-16 pb-2 flex-row items-center justify-between">
          <View>
            <Text className="text-caption text-neutral-400 font-medium">
              {getGreeting()}
            </Text>
            <Text className="text-heading font-bold text-neutral-900">
              {user?.name || "Customer"} 👋
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <View className="h-10 w-10 rounded-full bg-neutral-50 items-center justify-center">
              <Text className="text-lg">
                {storeConfig.storeName.charAt(0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <Pressable
          onPress={() => router.push("/search")}
          className="mx-4 mb-4 h-12 bg-neutral-50 rounded-xl flex-row items-center px-4 border border-neutral-100"
        >
          <Search size={16} color="#9CA3AF" />
          <Text className="ml-3 text-body text-neutral-400">
            Search products...
          </Text>
        </Pressable>

        {/* Live Order Tracking Banner */}
        <LiveOrderBanner />

        {/* Hero Banner */}
        <HeroBanner
          image={heroImage}
          title={heroTitle}
          deliveryRadiusKm={storeConfig.deliveryRadiusKm}
        />

        {/* Promo Banners Carousel */}
        {banners.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-4"
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            {banners.slice(1).map((banner, i) => (
              <Animated.View
                key={banner.id}
                entering={FadeInRight.delay(i * 80).duration(400)}
              >
                <View className="w-72 h-36 rounded-2xl bg-neutral-100 mr-3 overflow-hidden">
                  {banner.image && (
                    <Image
                      source={{ uri: banner.image }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  )}
                  <View className="absolute bottom-0 left-0 right-0 p-4 bg-black/30">
                    <Text className="text-white font-bold text-body">
                      {banner.title}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            ))}
          </ScrollView>
        )}

        {/* Recent Orders */}
        <RecentOrders />

        {/* Categories */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          className="px-4 pt-6"
        >
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-title font-bold text-neutral-900">
              Categories
            </Text>
            <Pressable onPress={() => router.push("/(tabs)/categories")}>
              <Text className="text-caption font-semibold text-primary-900">
                See All
              </Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((cat, i) => (
              <Animated.View
                key={cat.id}
                entering={FadeInRight.delay(i * 50).duration(300)}
              >
                <Pressable
                  onPress={() =>
                    router.push(`/(tabs)/categories?category=${cat.slug}`)
                  }
                  className="items-center mr-5"
                >
                  <View className="w-16 h-16 rounded-2xl bg-neutral-50 items-center justify-center mb-2 border border-neutral-100">
                    {cat.image ? (
                      <Image
                        source={{ uri: cat.image }}
                        className="w-12 h-12 rounded-xl"
                      />
                    ) : (
                      <Text className="text-2xl">🥬</Text>
                    )}
                  </View>
                  <Text
                    className="text-micro text-neutral-600 font-medium text-center w-16"
                    numberOfLines={1}
                  >
                    {cat.name}
                  </Text>
                </Pressable>
              </Animated.View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Weekly Best Selling */}
        <ProductSection
          title="Weekly Best Sellers"
          icon={<TrendingUp size={18} color="#050505" />}
          products={trending.slice(0, 8)}
          delay={200}
        />

        {/* Today's Offers */}
        {offers.length > 0 && (
          <ProductSection
            title="Just for you"
            icon={<Zap size={18} color="#F59E0B" />}
            products={offers}
            delay={300}
          />
        )}

        {/* Fresh Picks */}
        <ProductSection
          title="Today's Fresh Picks"
          icon={<Sparkles size={18} color="#F59E0B" />}
          products={freshPicks}
          delay={400}
        />

        {/* All Products Grid */}
        <View className="px-4 pt-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-title font-bold text-neutral-900">
              All Products
            </Text>
            <Pressable onPress={() => router.push("/(tabs)/categories")}>
              <Text className="text-caption font-semibold text-primary-900">
                View all
              </Text>
            </Pressable>
          </View>
          {isLoading ? (
            <View className="flex-row flex-wrap justify-between">
              {[1, 2, 3, 4].map((i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </View>
          ) : (
            <View className="flex-row flex-wrap justify-between">
              {products.slice(0, 8).map((product) => (
                <MiniProductCard key={product.id} product={product} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Cart Bar */}
      <FloatingCartBar />
    </View>
  );
}

/** Compact product card for the "All Products" grid */
function MiniProductCard({ product }: { product: Product }) {
  const { addItem } = useCartStore();
  const price = product.discountPrice || product.price;

  return (
    <Pressable
      onPress={() => router.push(`/product/${product.id}`)}
      className="w-[48%] mb-3 bg-white border border-neutral-100 rounded-xl overflow-hidden"
    >
      <View className="h-28 bg-neutral-50 items-center justify-center">
        {product.image ? (
          <Image
            source={{ uri: product.image }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <Text className="text-2xl">🛒</Text>
        )}
        {product.discountPrice && (
          <View className="absolute top-2 left-2 bg-primary-900 px-1.5 py-0.5 rounded-full">
            <Text className="text-[9px] font-black text-white">
              {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% OFF
            </Text>
          </View>
        )}
      </View>
      <View className="p-2.5">
        <Text className="text-caption font-semibold text-neutral-800" numberOfLines={1}>
          {product.name}
        </Text>
        <Text className="text-micro text-neutral-400">{product.unit}</Text>
        <View className="flex-row items-center justify-between mt-1.5">
          <Text className="text-body font-black text-neutral-900">
            {formatCurrency(price)}
          </Text>
          <Pressable
            onPress={() =>
              addItem({
                productId: product.id,
                name: product.name,
                image: product.image,
                price: product.price,
                discountPrice: product.discountPrice,
                quantity: 1,
                unit: product.unit,
                stock: product.stock,
              })
            }
            className="h-7 w-7 rounded-full bg-primary-900 items-center justify-center"
          >
            <Text className="text-white text-sm font-bold">+</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

// Import at component level to avoid circular deps
import { useCartStore } from "@/stores/cart";
import { formatCurrency } from "@msm/shared/utils";
