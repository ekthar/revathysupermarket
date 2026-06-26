import { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { api } from "@/services/api";
import { useCartStore } from "@/stores/cart";
import type { Product, Category } from "@msm/shared/types";
import { formatCurrency } from "@msm/shared/utils";

export default function CategoriesScreen() {
  const { category: selectedSlug } = useLocalSearchParams<{ category?: string }>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(selectedSlug || null);
  const [isLoading, setIsLoading] = useState(true);
  const { addItem } = useCartStore();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [activeCategory]);

  const fetchCategories = async () => {
    try {
      const { data } = await api.get("/categories");
      setCategories(data.items || data || []);
    } catch {}
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const params = activeCategory ? `?category=${activeCategory}` : "";
      const { data } = await api.get(`/products${params}`);
      setProducts(data.items || data || []);
    } catch {}
    setIsLoading(false);
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

  return (
    <View className="flex-1 bg-white pt-14">
      {/* Header */}
      <View className="px-5 pb-3">
        <Text className="text-xl font-heading text-slate-900">Categories</Text>
      </View>

      {/* Category Chips */}
      <FlatList
        horizontal
        data={[{ id: "all", name: "All", slug: "" } as any, ...categories]}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12 }}
        renderItem={({ item }) => {
          const isActive =
            (item.slug === "" && !activeCategory) ||
            item.slug === activeCategory;
          return (
            <Pressable
              onPress={() => setActiveCategory(item.slug || null)}
              className={`px-4 py-2 rounded-full mr-2 ${
                isActive ? "bg-primary-600" : "bg-slate-100"
              }`}
            >
              <Text
                className={`text-sm font-sans-medium ${
                  isActive ? "text-white" : "text-slate-600"
                }`}
              >
                {item.name}
              </Text>
            </Pressable>
          );
        }}
      />

      {/* Products Grid */}
      <FlatList
        data={products}
        numColumns={2}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        columnWrapperStyle={{ gap: 12 }}
        ItemSeparatorComponent={() => <View className="h-3" />}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchProducts} tintColor="#059669" />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View className="py-16 items-center">
              <Text className="text-3xl mb-2">📦</Text>
              <Text className="text-slate-400 text-sm">No products found</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            className="flex-1 bg-white border border-slate-100 rounded-2xl overflow-hidden"
            onPress={() => router.push(`/product/${item.id}`)}
          >
            <View className="h-28 bg-slate-50 items-center justify-center">
              {item.image ? (
                <Image
                  source={{ uri: item.image }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <Text className="text-2xl">🛒</Text>
              )}
            </View>
            <View className="p-3">
              <Text className="text-sm font-sans-medium text-slate-800" numberOfLines={1}>
                {item.name}
              </Text>
              <Text className="text-xs text-slate-400">{item.unit}</Text>
              <View className="flex-row items-center justify-between mt-2">
                <Text className="text-sm font-sans-bold text-slate-900">
                  {formatCurrency(item.discountPrice || item.price)}
                </Text>
                <Pressable
                  onPress={() => handleAddToCart(item)}
                  className="bg-primary-600 w-7 h-7 rounded-md items-center justify-center"
                >
                  <Text className="text-white text-sm">+</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
