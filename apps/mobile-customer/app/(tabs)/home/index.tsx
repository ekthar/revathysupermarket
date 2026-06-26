import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  FlatList,
  Image,
} from "react-native";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { router } from "expo-router";
import { api } from "@/services/api";
import type { Product, Category, Banner } from "@msm/shared/types";
import { formatCurrency } from "@msm/shared/utils";
import { useCartStore } from "@/stores/cart";
import { useAuthStore } from "@/stores/auth";
import { ProductCardSkeleton } from "@/components/ui";

export default function HomeScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();
  const { addItem } = useCartStore();

  const fetchData = async () => {
    try {
      const [catRes, prodRes, bannerRes] = await Promise.all([
        api.get("/categories"),
        api.get("/products?featured=true&limit=10"),
        api.get("/banners").catch(() => ({ data: { items: [] } })),
      ]);
      setCategories(catRes.data.items || catRes.data || []);
      setFeatured(prodRes.data.items || prodRes.data || []);
      setBanners(bannerRes.data.items || bannerRes.data || []);
    } catch {
      // Silently fail — show empty state
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  const handleAddToCart = (product: Product) => {
    addItem({
      productId: product.id,
      name: product.name,
      image: product.image,
      price: product.price,
      discountPrice: product.discountPrice,
      quantity: 1,
      unit: product.unit,
      stock: product.stock,
    });
  };

  // Greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <ScrollView
      className="flex-1 bg-white"
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor="#059669"
        />
      }
    >
      {/* Header */}
      <View className="px-5 pt-16 pb-4">
        <Text className="text-sm text-slate-500">{getGreeting()}</Text>
        <Text className="text-xl font-heading text-slate-900">
          {user?.name || "Customer"} 👋
        </Text>
      </View>

      {/* Search Bar */}
      <Pressable
        onPress={() => router.push("/search")}
        className="mx-5 mb-5 h-12 bg-slate-50 rounded-xl flex-row items-center px-4 border border-slate-100"
      >
        <Text className="text-slate-400 mr-2">🔍</Text>
        <Text className="text-slate-400 text-sm">Search products...</Text>
      </Pressable>

      {/* Banners */}
      {banners.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-6"
          contentContainerStyle={{ paddingHorizontal: 20 }}
        >
          {banners.map((banner) => (
            <View
              key={banner.id}
              className="w-72 h-36 rounded-2xl bg-primary-100 mr-3 overflow-hidden"
            >
              {banner.image && (
                <Image
                  source={{ uri: banner.image }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              )}
              <View className="absolute bottom-0 left-0 right-0 p-4 bg-black/30">
                <Text className="text-white font-sans-bold">
                  {banner.title}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Categories */}
      <View className="px-5 mb-6">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-lg font-heading text-slate-900">
            Categories
          </Text>
          <Pressable onPress={() => router.push("/(tabs)/categories")}>
            <Text className="text-sm font-sans-medium text-primary-600">
              See All
            </Text>
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {categories.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() =>
                router.push(`/(tabs)/categories?category=${cat.slug}`)
              }
              className="items-center mr-5"
            >
              <View className="w-16 h-16 rounded-2xl bg-primary-50 items-center justify-center mb-2">
                {cat.image ? (
                  <Image
                    source={{ uri: cat.image }}
                    className="w-12 h-12 rounded-xl"
                  />
                ) : (
                  <Text className="text-2xl">🥬</Text>
                )}
              </View>
              <Text className="text-xs text-slate-600 font-sans-medium text-center w-16" numberOfLines={1}>
                {cat.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Featured Products */}
      <View className="px-5 mb-8">
        <Text className="text-lg font-heading text-slate-900 mb-3">
          Featured Products
        </Text>
        {isLoading ? (
          <View className="flex-row flex-wrap justify-between">
            {[1, 2, 3, 4].map((i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </View>
        ) : featured.length === 0 ? (
          <View className="py-8 items-center">
            <Text className="text-slate-400">No products available</Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap justify-between">
            {featured.map((product) => (
              <Pressable
                key={product.id}
                className="w-[48%] mb-4 bg-white border border-slate-100 rounded-2xl overflow-hidden"
                onPress={() => router.push(`/product/${product.id}`)}
              >
                <View className="h-32 bg-slate-50 items-center justify-center">
                  {product.image ? (
                    <Image
                      source={{ uri: product.image }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <Text className="text-3xl">🛒</Text>
                  )}
                  {product.discountPrice && (
                    <View className="absolute top-2 left-2 bg-red-500 px-2 py-0.5 rounded-md">
                      <Text className="text-xs text-white font-sans-bold">
                        {Math.round(
                          ((product.price - product.discountPrice) /
                            product.price) *
                            100
                        )}
                        % OFF
                      </Text>
                    </View>
                  )}
                </View>
                <View className="p-3">
                  <Text
                    className="text-sm font-sans-medium text-slate-800"
                    numberOfLines={2}
                  >
                    {product.name}
                  </Text>
                  <Text className="text-xs text-slate-400 mt-0.5">
                    {product.unit}
                  </Text>
                  <View className="flex-row items-center justify-between mt-2">
                    <View>
                      <Text className="text-sm font-sans-bold text-slate-900">
                        {formatCurrency(
                          product.discountPrice || product.price
                        )}
                      </Text>
                      {product.discountPrice && (
                        <Text className="text-xs text-slate-400 line-through">
                          {formatCurrency(product.price)}
                        </Text>
                      )}
                    </View>
                    <Pressable
                      onPress={() => handleAddToCart(product)}
                      className="bg-primary-600 w-8 h-8 rounded-lg items-center justify-center"
                    >
                      <Text className="text-white text-lg">+</Text>
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
