import { useState, useEffect } from "react";
import { View, Text, FlatList, ActivityIndicator, Pressable, Image } from "react-native";
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

  if (isLoading) return <View className="flex-1 items-center justify-center bg-white"><ActivityIndicator color="#059669" /></View>;

  return (
    <View className="flex-1 bg-white px-5 pt-4">
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<View className="py-16 items-center"><Text className="text-3xl mb-2">❤️</Text><Text className="text-slate-400">No favorites yet</Text></View>}
        renderItem={({ item }) => (
          <View className="flex-row py-4 border-b border-slate-50">
            <View className="w-14 h-14 bg-slate-50 rounded-xl mr-3 overflow-hidden">
              {item.image ? <Image source={{ uri: item.image }} className="w-full h-full" /> : <View className="flex-1 items-center justify-center"><Text>🛒</Text></View>}
            </View>
            <View className="flex-1">
              <Text className="text-sm font-sans-medium text-slate-800">{item.name}</Text>
              <Text className="text-sm font-sans-bold text-slate-900 mt-1">{formatCurrency(item.discountPrice || item.price)}</Text>
            </View>
            <Pressable onPress={() => addItem({ productId: item.id, name: item.name, image: item.image, price: item.price, discountPrice: item.discountPrice, quantity: 1, unit: item.unit, stock: item.stock })} className="bg-primary-100 px-3 rounded-lg justify-center">
              <Text className="text-primary-700 text-xs font-sans-bold">Add</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}
