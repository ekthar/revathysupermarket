import { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, ActivityIndicator, Pressable, Image } from "react-native";
import { router, Stack } from "expo-router";
import { Heart, Plus, ShoppingBag } from "lucide-react-native";
import { api } from "@/services/api";
import type { Product } from "@msm/shared/types";
import { formatCurrency } from "@msm/shared/utils";
import { useCartStore } from "@/stores/cart";

export default function FavoritesScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addItem } = useCartStore();

  useEffect(() => {
    api.get("/favorites").then(({ data }) => setProducts(data.items || [])).catch(() => {}).finally(() => setIsLoading(false));
  }, []);

  const handleAddToCart = useCallback((item: Product) => {
    addItem({ productId: item.id, name: item.name, image: item.image, price: item.price, discountPrice: item.discountPrice, quantity: 1, unit: item.unit, stock: item.stock });
  }, [addItem]);

  if (isLoading) return <View className="flex-1 items-center justify-center bg-white"><ActivityIndicator color="#050505" /></View>;

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Favorites", headerTintColor: "#050505" }} />
      <View className="flex-1 bg-white px-4 pt-4">
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View className="py-16 items-center">
              <Heart size={32} color="#D1D5DB" />
              <Text className="text-neutral-400 mt-3">No favorites yet</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/product/${item.id}`)}
              className="flex-row py-4 border-b border-neutral-50"
            >
              <View className="w-14 h-14 bg-neutral-50 rounded-xl mr-3 overflow-hidden items-center justify-center">
                {item.image ? (
                  <Image source={{ uri: item.image }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <ShoppingBag size={16} color="#9CA3AF" />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-body font-semibold text-neutral-800">{item.name}</Text>
                <Text className="text-body font-black text-neutral-900 mt-1">{formatCurrency(item.discountPrice || item.price)}</Text>
              </View>
              <Pressable
                onPress={() => handleAddToCart(item)}
                className="bg-primary-900 px-3 h-8 rounded-full justify-center items-center flex-row self-center"
              >
                <Plus size={12} color="#FFFFFF" strokeWidth={2.5} />
                <Text className="text-white text-micro font-bold ml-1">Add</Text>
              </Pressable>
            </Pressable>
          )}
        />
      </View>
    </>
  );
}
